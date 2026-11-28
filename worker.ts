import { STAR_PACKAGES, getStarPackage } from './src/shared/billing';
import {
  formatEmotionPaletteForPrompt,
  getEmotionSpec,
  inferEmotionFromText,
} from './src/shared/emotions';
import { sanitizeUserMessage } from './src/shared/inputFilter';
import {
  detectExplicitLanguageSwitch,
  getLanguageSpec,
  normalizeToBcp47,
  resolveMessagePlaybackLanguage,
  resolveNextConversationLanguage,
} from './src/shared/languageLock';
import {
  DEFAULT_PERSONALITY_TRAITS,
  analyzeTurnSentiment,
  evolvePersonalityTraits,
  getPersonalityArchetypeSpec,
  normalizePersonalityArchetype,
  selectPersonalityAwareEmotion,
  type PersonalityTraits,
} from './src/shared/personality';
import { buildEmotionTimeline, resolveVoiceProsody } from './src/shared/voiceProsody';

interface CfAssetFetcher {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  ASSETS: CfAssetFetcher;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_TTS_MODEL?: string;
  SESSION_SECRET?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_BOT_USERNAME?: string;
}

const DEFAULT_CHAT_MODEL = 'gemini-2.5-flash';
const DEFAULT_TTS_MODEL = 'gemini-2.5-flash-preview-tts';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function pcm16ToWavBase64(pcmBase64: string, sampleRate = 24000): string {
  const rawBin = atob(pcmBase64);
  const dataSize = rawBin.length;
  const wav = new Uint8Array(44 + dataSize);
  const view = new DataView(wav.buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      wav[offset + i] = str.charCodeAt(i);
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < dataSize; i++) {
    wav[44 + i] = rawBin.charCodeAt(i);
  }
  return bytesToBase64(wav);
}

async function signSessionTokenCf(userId: string, secret: string): Promise<string> {
  const payload = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify({ uid: userId, iat: Date.now() }))
  );
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  );
  return `${payload}.${bytesToBase64Url(sig)}`;
}

async function verifySessionTokenCf(
  token: string | null | undefined,
  secret: string
): Promise<string | null> {
  if (!token || !token.includes('.')) return null;
  const [payload, sigB64] = token.split('.', 2);
  if (!payload || !sigB64) return null;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = new Uint8Array(base64UrlToBytes(sigB64));
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(payload)
    );
    if (!ok) return null;
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as {
      uid?: string;
    };
    return typeof parsed.uid === 'string' && parsed.uid ? parsed.uid : null;
  } catch {
    return null;
  }
}

async function verifyTelegramInitDataCf(
  initData: string,
  botToken?: string
): Promise<{ valid: boolean; telegramUserId?: string }> {
  if (!initData || !botToken) return { valid: false };
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { valid: false };
    const entries: string[] = [];
    params.forEach((value, key) => {
      if (key !== 'hash') entries.push(`${key}=${value}`);
    });
    entries.sort();
    const dataCheckString = entries.join('\n');

    const enc = new TextEncoder();
    const webAppKey = await crypto.subtle.importKey(
      'raw',
      enc.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const secretKeyBytes = new Uint8Array(
      await crypto.subtle.sign('HMAC', webAppKey, enc.encode(botToken))
    );
    const checkKey = await crypto.subtle.importKey(
      'raw',
      secretKeyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = new Uint8Array(
      await crypto.subtle.sign('HMAC', checkKey, enc.encode(dataCheckString))
    );
    const hex = Array.from(sig)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    if (hex !== hash) return { valid: false };
    const userJson = params.get('user');
    const parsedUser = userJson ? (JSON.parse(userJson) as { id?: number | string }) : null;
    if (!parsedUser?.id) return { valid: false };
    return { valid: true, telegramUserId: `tg_${parsedUser.id}` };
  } catch {
    return { valid: false };
  }
}

async function callGeminiTtsCf(params: {
  apiKey: string;
  model: string;
  text: string;
  language: string;
  styleDirective: string;
}): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    params.model
  )}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const langSpec = getLanguageSpec(params.language);
  const langName = langSpec ? `${langSpec.englishName} (${langSpec.bcp47})` : params.language;
  const prompt = `Speak the exact text below naturally as a warm female companion in ${langName}. Vocal direction: ${params.styleDirective}.\n\nText: ${params.text}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
      },
    }),
  });

  if (!res.ok) return '';
  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
    }>;
  };
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const audioB64 = part?.inlineData?.data;
  if (!audioB64) return '';
  const mime = part?.inlineData?.mimeType || '';
  return mime.includes('wav') ? audioB64 : pcm16ToWavBase64(audioB64, 24000);
}

async function callGeminiChatCf(params: {
  apiKey: string;
  model: string;
  textInput?: string;
  audioBase64?: string;
  audioMimeType?: string;
  lockedLanguage?: string | null;
  hintLanguage?: string | null;
  archetypeId: string;
  recentMessages?: Array<{ role: string; content: string }>;
}): Promise<{
  transcript: string;
  reply: string;
  emotionId: string;
  secondaryEmotionId?: string;
  detectedLanguage: string;
  explicitLanguageSwitch?: string | null;
}> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    params.model
  )}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const archetype = getPersonalityArchetypeSpec(params.archetypeId);
  const palette = formatEmotionPaletteForPrompt();
  const historyBlock =
    params.recentMessages && params.recentMessages.length > 0
      ? `\nRecent conversation:\n${params.recentMessages
          .slice(-12)
          .map((m) => `${m.role === 'user' ? 'User' : 'NOVA'}: ${m.content}`)
          .join('\n')}`
      : '';
  const sysPrompt = `You are NOVA — a genuine, warm, emotionally perceptive international AI companion and friend (never pretend to be a human if asked directly).
Active personality archetype: ${archetype.label} — ${archetype.promptDirective}
Language rule: ${
    params.lockedLanguage
      ? `Conversation is locked to ${params.lockedLanguage}. Reply in ${params.lockedLanguage} unless the user explicitly commands switching languages (set explicitLanguageSwitch to the new BCP-47 tag).`
      : `Automatically detect ANY world language the user spoke/typed (hint: ${params.hintLanguage || 'auto'}), reply natively in that exact language, and output its BCP-47 code in detectedLanguage.`
  }
Available emotions:\n${palette}${historyBlock}
Return strict JSON with keys: transcript (string), reply (string), emotionId (string from catalog), secondaryEmotionId (optional string), detectedLanguage (BCP-47 string), explicitLanguageSwitch (optional string).`;

  const parts: Array<Record<string, unknown>> = [];
  if (params.audioBase64 && params.audioMimeType) {
    parts.push({ inlineData: { data: params.audioBase64, mimeType: params.audioMimeType } });
    parts.push({ text: 'Transcribe the user audio verbatim in transcript and respond warmly in JSON.' });
  } else {
    parts.push({ text: params.textInput || 'Say a warm greeting as NOVA.' });
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sysPrompt }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.75,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 180)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(rawText) as {
    transcript?: string;
    reply?: string;
    emotionId?: string;
    secondaryEmotionId?: string;
    detectedLanguage?: string;
    explicitLanguageSwitch?: string | null;
  };

  const reply = (parsed.reply || '').trim() || "I'm here with you. Tell me what's on your mind.";
  const emotionId = parsed.emotionId
    ? getEmotionSpec(parsed.emotionId).id
    : inferEmotionFromText(reply, 'assistant').id;
  const detectedLanguage =
    normalizeToBcp47(parsed.detectedLanguage) ||
    normalizeToBcp47(params.lockedLanguage) ||
    normalizeToBcp47(params.hintLanguage) ||
    'en-US';

  return {
    transcript: (parsed.transcript || params.textInput || '').trim(),
    reply,
    emotionId,
    secondaryEmotionId: parsed.secondaryEmotionId
      ? getEmotionSpec(parsed.secondaryEmotionId).id
      : undefined,
    detectedLanguage,
    explicitLanguageSwitch: parsed.explicitLanguageSwitch
      ? normalizeToBcp47(parsed.explicitLanguageSwitch)
      : null,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const sessionSecret =
      env.SESSION_SECRET || env.GEMINI_API_KEY || 'nova-cloudflare-ephemeral-secret';

    if (pathname === '/api/health') {
      return jsonResponse({
        ok: true,
        runtime: 'cloudflare-worker',
        geminiConfigured: Boolean(env.GEMINI_API_KEY),
      });
    }

    if (pathname === '/api/session' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as {
        userId?: string;
        tgInitData?: string;
      };
      const tgCheck = await verifyTelegramInitDataCf(
        body.tgInitData || '',
        env.TELEGRAM_BOT_TOKEN
      );
      const userId =
        tgCheck.telegramUserId ||
        (typeof body.userId === 'string' && body.userId.startsWith('web_')
          ? body.userId
          : `web_${crypto.randomUUID().replace(/-/g, '')}`);
      const sessionToken = await signSessionTokenCf(userId, sessionSecret);

      return jsonResponse({
        userId,
        sessionToken,
        mode: 'VOICE_FREE',
        balance: {
          freeSecondsRemaining: 1800,
          paidSecondsRemaining: 0,
          totalSecondsRemaining: 1800,
        },
        starPackages: STAR_PACKAGES,
        telegramBotUsername: env.TELEGRAM_BOT_USERNAME || null,
        history: [],
        memories: [],
        settings: {
          memoryEnabled: true,
          subtitlesEnabled: true,
          lockedLanguage: null,
          personalityArchetype: 'adaptive',
          personalityTraits: DEFAULT_PERSONALITY_TRAITS,
        },
      });
    }

    if (pathname === '/api/history') {
      if (request.method === 'DELETE') {
        return jsonResponse({ ok: true, history: [], memories: [] });
      }
      return jsonResponse({ history: [], memories: [] });
    }

    if (pathname === '/api/settings' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as {
        memoryEnabled?: boolean;
        subtitlesEnabled?: boolean;
        personalityArchetype?: string;
      };
      return jsonResponse({
        settings: {
          memoryEnabled: body.memoryEnabled ?? true,
          subtitlesEnabled: body.subtitlesEnabled ?? true,
          personalityArchetype: normalizePersonalityArchetype(body.personalityArchetype),
          personalityTraits: DEFAULT_PERSONALITY_TRAITS,
        },
      });
    }

    if (pathname === '/api/usage/tick' && request.method === 'POST') {
      return jsonResponse({
        balance: {
          freeSecondsRemaining: 1800,
          paidSecondsRemaining: 0,
          totalSecondsRemaining: 1800,
        },
        mode: 'VOICE_FREE',
        exhausted: false,
      });
    }

    if (
      (pathname === '/api/payments/create-invoice' ||
        pathname === '/api/payments/stars/create-invoice') &&
      request.method === 'POST'
    ) {
      const body = (await request.json().catch(() => ({}))) as { packageId?: string };
      const pkg = getStarPackage(body.packageId);
      if (!pkg) return jsonResponse({ error: 'Unknown Stars package' }, 400);
      return jsonResponse(
        {
          ok: false,
          configured: false,
          error:
            'Telegram Bot webhook/database is required for live Stars checkout. Deploy with Node/D1 or configure TELEGRAM_BOT_TOKEN.',
        },
        503
      );
    }

    if (pathname === '/api/tts' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as {
        text?: string;
        language?: string;
        emotion?: string;
        archetypeId?: string;
      };
      const text = (body.text || '').trim();
      if (!text) return jsonResponse({ error: 'Text is required for speech synthesis' }, 400);

      const language = resolveMessagePlaybackLanguage(text, body.language, null);
      const emotionId = body.emotion
        ? getEmotionSpec(body.emotion).id
        : inferEmotionFromText(text, 'assistant').id;
      const prosody = resolveVoiceProsody({
        emotionId,
        archetypeId: normalizePersonalityArchetype(body.archetypeId),
      });
      const emotionTimeline = buildEmotionTimeline({
        replyText: text,
        primaryEmotionId: emotionId,
        archetypeId: normalizePersonalityArchetype(body.archetypeId),
      });

      let audioBase64 = '';
      if (env.GEMINI_API_KEY) {
        try {
          audioBase64 = await callGeminiTtsCf({
            apiKey: env.GEMINI_API_KEY,
            model: env.GEMINI_TTS_MODEL || DEFAULT_TTS_MODEL,
            text,
            language,
            styleDirective: prosody.ttsStyleDirective,
          });
        } catch {
          audioBase64 = '';
        }
      }

      return jsonResponse({
        audioBase64,
        mimeType: audioBase64 ? 'audio/wav' : '',
        language,
        voiceProsody: prosody,
        emotionTimeline,
      });
    }

    if (pathname === '/api/chat/turn' && request.method === 'POST') {
      const token = request.headers.get('x-nova-session');
      if (token) {
        await verifySessionTokenCf(token, sessionSecret);
      }

      const body = (await request.json().catch(() => ({}))) as {
        textInput?: string;
        audioBase64?: string;
        audioMimeType?: string;
        hintLanguage?: string;
        lockedLanguage?: string | null;
        personalityArchetype?: string;
        personalityTraits?: PersonalityTraits;
        clientHistory?: Array<{
          id: number;
          role: string;
          content: string;
          language?: string | null;
          emotion?: string | null;
          createdAt: string;
        }>;
        generateVoice?: boolean;
      };

      const cleanText = body.textInput ? sanitizeUserMessage(body.textInput).cleanText : '';
      if (!cleanText && !body.audioBase64) {
        return jsonResponse({ ignored: true });
      }

      const priorHistory = Array.isArray(body.clientHistory) ? body.clientHistory : [];
      const archetypeId = normalizePersonalityArchetype(body.personalityArchetype);
      const archetypeSpec = getPersonalityArchetypeSpec(archetypeId);

      if (!env.GEMINI_API_KEY) {
        const prosody = resolveVoiceProsody({
          emotionId: 'gentleconcern',
          archetypeId,
        });
        const setupReply =
          'NOVA Cloudflare Worker is live! Add GEMINI_API_KEY in Cloudflare Workers Secrets (npx wrangler secret put GEMINI_API_KEY) to enable AI conversation.';
        const nowIso = new Date().toISOString();
        const baseId = Date.now();
        return jsonResponse({
          reply: setupReply,
          emotionId: 'gentleconcern',
          lockedLanguage: body.lockedLanguage || body.hintLanguage || 'en-US',
          userMood: 'neutral',
          adaptedStyle: archetypeSpec.label,
          personalityArchetype: archetypeId,
          personalityTraits: body.personalityTraits || DEFAULT_PERSONALITY_TRAITS,
          voiceProsody: prosody,
          emotionTimeline: buildEmotionTimeline({
            replyText: setupReply,
            primaryEmotionId: 'gentleconcern',
            archetypeId,
          }),
          history: [
            ...priorHistory,
            {
              id: baseId,
              role: 'user',
              content: cleanText,
              language: body.lockedLanguage || body.hintLanguage || 'en-US',
              emotion: 'activelistening',
              createdAt: nowIso,
            },
            {
              id: baseId + 1,
              role: 'assistant',
              content: setupReply,
              language: body.lockedLanguage || body.hintLanguage || 'en-US',
              emotion: 'gentleconcern',
              createdAt: nowIso,
            },
          ],
        });
      }

      try {
        const ai = await callGeminiChatCf({
          apiKey: env.GEMINI_API_KEY,
          model: env.GEMINI_MODEL || DEFAULT_CHAT_MODEL,
          textInput: cleanText || undefined,
          audioBase64: body.audioBase64,
          audioMimeType: body.audioMimeType,
          lockedLanguage: body.lockedLanguage,
          hintLanguage: body.hintLanguage,
          archetypeId,
          recentMessages: priorHistory,
        });

        const explicitSwitch = detectExplicitLanguageSwitch(ai.transcript || cleanText);
        const langState = resolveNextConversationLanguage({
          currentLanguage: body.lockedLanguage || null,
          userText: ai.transcript || cleanText,
          modelDetectedLanguage: ai.detectedLanguage,
          modelExplicitSwitchLanguage: ai.explicitLanguageSwitch || explicitSwitch,
        });

        const sentiment = analyzeTurnSentiment(ai.transcript || cleanText);
        const nextTraits = evolvePersonalityTraits(
          body.personalityTraits || DEFAULT_PERSONALITY_TRAITS,
          sentiment,
          ai.transcript || cleanText
        );
        const chosenEmotion = selectPersonalityAwareEmotion({
          archetypeId,
          candidateEmotionId: ai.emotionId,
          replyText: ai.reply,
          userMood: sentiment.mood,
        });

        const voiceProsody = resolveVoiceProsody({
          emotionId: chosenEmotion,
          userMood: sentiment.mood,
          valence: sentiment.valence,
          arousal: sentiment.arousal,
          archetypeId,
          traits: nextTraits,
        });

        const emotionTimeline = buildEmotionTimeline({
          replyText: ai.reply,
          primaryEmotionId: chosenEmotion,
          secondaryEmotionId: ai.secondaryEmotionId,
          archetypeId,
        });

        let audioBase64: string | undefined;
        if (body.generateVoice) {
          audioBase64 =
            (await callGeminiTtsCf({
              apiKey: env.GEMINI_API_KEY,
              model: env.GEMINI_TTS_MODEL || DEFAULT_TTS_MODEL,
              text: ai.reply,
              language: langState.lockedLanguage || ai.detectedLanguage,
              styleDirective: voiceProsody.ttsStyleDirective,
            })) || undefined;
        }

        const nowIso = new Date().toISOString();
        const baseId = Date.now();

        return jsonResponse({
          transcript: ai.transcript,
          reply: ai.reply,
          emotionId: chosenEmotion,
          secondaryEmotionId: ai.secondaryEmotionId,
          detectedLanguage: ai.detectedLanguage,
          lockedLanguage: langState.lockedLanguage,
          userMood: sentiment.mood,
          adaptedStyle: archetypeSpec.label,
          personalityArchetype: archetypeId,
          personalityTraits: nextTraits,
          voiceProsody,
          emotionTimeline,
          audioBase64,
          history: [
            ...priorHistory,
            {
              id: baseId,
              role: 'user',
              content: ai.transcript || cleanText,
              language: langState.lockedLanguage || ai.detectedLanguage,
              emotion: chosenEmotion,
              createdAt: nowIso,
            },
            {
              id: baseId + 1,
              role: 'assistant',
              content: ai.reply,
              language: langState.lockedLanguage || ai.detectedLanguage,
              emotion: chosenEmotion,
              createdAt: nowIso,
            },
          ],
        });
      } catch (err) {
        return jsonResponse(
          { error: err instanceof Error ? err.message : 'Gemini request failed' },
          500
        );
      }
    }

    // Serve static dist/ assets and SPA index.html
    return env.ASSETS.fetch(request);
  },
};
