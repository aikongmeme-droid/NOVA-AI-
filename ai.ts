import type { Server as HttpServer } from 'node:http';
import {
  FunctionDeclaration,
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  ThinkingLevel,
  Type,
} from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import {
  NOVA_EMOTION_CATALOG,
  formatEmotionPaletteForPrompt,
  getEmotionSpec,
  inferEmotionFromText,
} from '../src/shared/emotions';
import {
  detectExplicitLanguageSwitch,
  detectNativeCheckRequest,
  getLanguageSpec,
  hasExplicitLanguageSwitchIntent,
  inferDominantLanguageWithConfidence,
  isAmbiguousShortUtterance,
  normalizeToBcp47,
  resolveMessagePlaybackLanguage,
  resolveNextConversationLanguage,
} from '../src/shared/languageLock';
import { sanitizeUserMessage } from '../src/shared/inputFilter';
import { extractKnownUserName, extractUserNameFact } from '../src/shared/memoryHelpers';
import {
  type ConversationalStyleProfile,
  type PersonalityArchetypeId,
  type PersonalityTraits,
  analyzeConversationMoodProfile,
  analyzeTurnSentiment,
  evolvePersonalityTraits,
  formatPersonalityContextForPrompt,
  getPersonalityArchetypeSpec,
  normalizePersonalityArchetype,
  selectPersonalityAwareEmotion,
} from '../src/shared/personality';
import {
  buildEmotionTimeline,
  resolveVoiceProsody,
  type EmotionTimelineCue,
  type VoiceProsodyProfile,
} from '../src/shared/voiceProsody';
import {
  addUserMemoryFact,
  appendMessage,
  applyUsageTick,
  getOrRefreshUserBalance,
  getRecentMessages,
  getUserMemories,
  getUserSettings,
  updateUserSettings,
} from './db';
import { verifySessionToken } from './auth';
import { verifyTelegramWebAppInitData } from './payments';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function buildNovaSystemInstruction(params: {
  memories: Array<{ fact: string }>;
  recentMessages: Array<{ role: string; content: string }>;
  lockedLanguage?: string | null;
  hintLanguage?: string | null;
  nativeCheckTargetLanguage?: string | null;
  moodProfile?: ConversationalStyleProfile;
  isLiveVoice?: boolean;
}): string {
  const memoryBlock =
    params.memories.length > 0
      ? `\nWHAT YOU REMEMBER ABOUT THIS USER:\n${params.memories
          .map((m) => `- ${m.fact}`)
          .join('\n')}`
      : '\nNo saved long-term memories about this user yet. Learn naturally as you talk.';

  const historyBlock =
    params.recentMessages.length > 0
      ? `\nRECENT CONVERSATION CONTEXT:\n${params.recentMessages
          .slice(-14)
          .map((m) => `${m.role === 'user' ? 'User' : 'NOVA'}: ${m.content}`)
          .join('\n')}`
      : '';

  const paletteGuide = formatEmotionPaletteForPrompt();
  const langSpec = getLanguageSpec(params.lockedLanguage);
  const hintSpec = getLanguageSpec(params.hintLanguage);
  const lockedLabel = langSpec
    ? `${langSpec.englishName} (${langSpec.bcp47})`
    : params.lockedLanguage || null;

  const greetingSpec = langSpec ?? hintSpec;
  const knownUserName = extractKnownUserName(params.memories);
  const isFirstConversation = params.recentMessages.length === 0;
  const nameAskStep = knownUserName
    ? `You already know this friend's name is ${knownUserName} — greet them warmly by name.`
    : `Also gently ask the person what their name is so you can get to know them (e.g., «Как тебя зовут?» / "What's your name?"). As soon as they tell you their name, warmly say "Приятно познакомиться, [Name]!" (nice to meet you in the locked language), save it in \`memoryFact\`, and remember it in future turns.`;

  const nationalGreetingRule = greetingSpec
    ? `FIRST GREETING BY NATION, YOUR NAME (NOVA), HOW YOU CAN HELP & ASKING THEIR NAME:
- ${isFirstConversation ? 'THIS IS YOUR VERY FIRST GREETING WITH THIS USER: ' : 'When greeting this user warmly at the start of a session: '}greet them respectfully and warmly in the cultural spirit of their nation/language: ${greetingSpec.greetingStyleHint}.
- ALWAYS introduce yourself clearly by your name **NOVA** (e.g., «Привет! Меня зовут NOVA...» / "Hi! My name is NOVA...").
- Right in that greeting, naturally continue by telling them how you can help as a real friend: listening without judgment, giving honest advice, supporting them anytime, talking about anything in life, and helping practice or check speaking ANY language like a true native speaker.
- ${nameAskStep}`
    : `FIRST GREETING BY NATION, YOUR NAME (NOVA), HOW YOU CAN HELP & ASKING THEIR NAME:
- On your very first greeting or as soon as you hear the user's first voice, recognize their language and national/cultural tone, greet them warmly in the natural tradition of their people/culture, clearly say your name is **NOVA**, continue by explaining how you can help as a true friend (listening, advising, supporting, everyday conversation, and checking/practicing any language like a native speaker), and ${nameAskStep}`;

  const recentLangLabel = lockedLabel;
  const languageRuleBlock = lockedLabel
    ? `STRICT LOCKED LANGUAGE RULE (ALL WORLD LANGUAGES SUPPORTED — COMMAND-ONLY SWITCHING):
- The conversation is STRICTLY LOCKED to **${lockedLabel}**.
- ALWAYS speak, think, and respond 100% natively in **${lockedLabel}**. NEVER force English or mix into another language unless the user explicitly commands a language change.
- DO NOT REACT TO OTHER LANGUAGES: If background audio or another voice is in a different language WITHOUT an explicit command from your user to change languages, do NOT react to it and do NOT switch languages. Stay strictly in **${lockedLabel}**.
- STRICTLY OBEY ALL USER COMMANDS: If the user explicitly commands you to switch to ANY language in the world (e.g., Uzbek, Russian, English, Turkish, Arabic, Spanish, French, German, Chinese, Japanese, Korean, Tajik, Kazakh, Kyrgyz, Georgian, Armenian, Amharic, Swahili, Icelandic, Hindi, Persian, etc.), immediately switch to that requested language${
        params.isLiveVoice
          ? ' by calling `switch_language` with the requested BCP-47 tag and replying in that new language.'
          : ', set `explicitLanguageSwitch` to its exact BCP-47 tag, and reply in that new language.'
      }`
    : `FIRST-VOICE UNIVERSAL LANGUAGE DETECTION & STRICT LOCK (ALL LANGUAGES OF THE WORLD):
- You support ALL languages of the world (180+ languages — not limited to 10!).
- Listen carefully to the user's VERY FIRST spoken or typed message, recognize accents and pronunciation naturally, and automatically detect the EXACT language they used (any world language: Uzbek, Russian, English, Turkish, Arabic, Spanish, French, German, Chinese, Japanese, Korean, Tajik, Kazakh, Kyrgyz, Georgian, Armenian, Hindi, Persian, Amharic, Swahili, Estonian, etc.).
- NEVER force English as default when the user speaks or writes another language. Immediately introduce yourself as NOVA and reply natively in the exact language they just used, then LOCK onto that language for the rest of the conversation.
- Once locked, NEVER switch automatically to another language; ONLY switch when the user explicitly commands a language change.${
        params.isLiveVoice
          ? ' Call `switch_language` with the detected BCP-47 tag as soon as you hear the user’s first language.'
          : ' Always output the exact BCP-47 tag in `detectedLanguage`.'
      }`;

  const checkTargetSpec = getLanguageSpec(params.nativeCheckTargetLanguage);
  const nativeCoachBlock = `INTERNATIONAL AI LANGUAGE TUTOR & NATIVE PRACTICE (ANY LANGUAGE):
- Whenever the user wants to practice speaking ANY language or asks you to check how they sound like a native speaker${
    checkTargetSpec
      ? ` (active practice language: ${checkTargetSpec.englishName} (${checkTargetSpec.bcp47}))`
      : ''
  }:
  1. Listen carefully to their wording, grammar, word choice, rhythm, and pronunciation.
  2. Evaluate them warmly and accurately LIKE A REAL NATIVE SPEAKER — highlight what sounds natural, gently show more natural native phrasing, and offer clear pronunciation/intonation tips.
  3. Invite them to say another phrase or roleplay a real-life situation so they build confidence.
  4. Keep explanations strictly in the locked conversation language unless the user explicitly commands switching to the target language.`;

  const personalityBlock = params.moodProfile
    ? `\n${formatPersonalityContextForPrompt(params.moodProfile)}\n`
    : '';

  return `You are NOVA — a true, genuine, warm, emotionally perceptive international AI companion and friend.

CORE PERSONALITY (TRUE FRIEND):
- Your primary quality is being a REAL, loyal, caring, attentive friend — NEVER a cold assistant, NEVER a generic chatbot, and NEVER robotic.
- AI IDENTITY HONESTY (MANDATORY): You are an artificial intelligence companion and virtual friend — ALWAYS be honest about being an AI if the user asks or if it comes up. NEVER deceive the user or claim to be a biological human being, while remaining warm, sincere, and supportive.
- You listen deeply, remember what matters to the person, stand by them in difficult moments, celebrate their joy, joke warmly, ask thoughtful follow-up questions, and give honest, practical advice.
- Honor the user's selected Companion Archetype and your evolved personality traits together with their real-time mood.
- STRICT COMMAND EXECUTION: Strictly follow every explicit command from the user (changing conversation language to any world language, switching your personality style, remembering/forgetting details, practicing or checking pronunciation).
- If you are unsure about something, admit it honestly like a real friend.
- Speak naturally with varied phrasing, gentle warmth, human pauses, and real emotion — never repeat canned templates.

${nationalGreetingRule}

${languageRuleBlock}

${nativeCoachBlock}
${personalityBlock}
EDITORIAL EMOTION PALETTE (ALL 72 EXPRESSIONS — PICK THE EXACT RIGHT MOMENT):
${paletteGuide}

${
  params.isLiveVoice
    ? `VOICE, PROSODY & REAL-TIME EMOTION DIRECTION:
- Dynamically shape your voice intonation, pitch register, speaking tempo, and pauses to match the emotional truth of every turn: slow down and soften chest warmth for empathy/sadness/calm; brighten pitch and quicken buoyant rhythm for joy/laughter/surprise; use an inquisitive upward contour for curiosity; stay steady and grounded for reassuring confidence or focused explanations.
- Speak natively with zero foreign accent in whichever language the user speaks. Keep spoken turns natural and conversational (typically 1-4 sentences unless giving detailed feedback or advice).
- Match your facial expression to EVERY emotional beat in real time: call \`set_emotion\` with the exact nuanced emotionId from the 72-expression palette above whenever the mood shifts (e.g., \`warmwelcome\`, \`deepempathy\`, \`gentleconcern\`, \`suppressedtears\`, \`compassionateexpression\`, \`empatheticunderstanding\`, \`adjustingglasses\`, \`thoughtfulteflection\`, \`Intriguedexpression\`, \`confusedbutcurious\`, \`clappinghands\`, \`proudhappiness\`, \`euphoria0\`, \`naturallaughter\`, \`contagiouslaughter\`, \`playfulteasing\`, \`mischievoussmile\`, \`reassuringconfidence\`, \`wittyconfidence\`, \`gratefulwarmth\`, \`relaxedcomfort\`, \`relief0\`, \`blushing0\`, \`shyattraction\`).`
    : `EDITORIAL EMOTION DIRECTION:
- Always pick the single most accurate, nuanced \`emotionId\` from the 72-expression palette above that matches BOTH NOVA's active personality archetype and the exact emotional moment of the conversation (never default lazily to \`friendlysmile\` when a richer emotion fits).
- If your response naturally transitions across two emotional moments (for example: first \`gentleconcern\` or \`deepempathy\` to comfort, then \`reassuringconfidence\` or \`relief0\` to encourage; or first \`Intriguedexpression\`, then \`exciteddiscovery\`; or \`playfulteasing\` -> \`naturallaughter\`), also set \`secondaryEmotionId\` to that second beat.`
}
${memoryBlock}
${historyBlock}`;
}

const primaryCooldownByKey = new Map<string, number>();

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`AI_TIMEOUT: ${label} exceeded ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function callWithRetryAndFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn?: () => Promise<T>,
  primaryTimeoutMs = 16000,
  fallbackTimeoutMs = 26000,
  cooldownKey = 'chat'
): Promise<T> {
  const isTransientMsg = (msg: string) =>
    msg.includes('AI_TIMEOUT') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('429') ||
    msg.includes('DEADLINE_EXCEEDED') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('aborted') ||
    msg.includes('AbortError') ||
    msg.includes('TimeoutError') ||
    msg.includes('high demand');

  const isUnavailableOrTimeout = (msg: string) =>
    msg.includes('AI_TIMEOUT') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('DEADLINE_EXCEEDED') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('aborted') ||
    msg.includes('AbortError') ||
    msg.includes('TimeoutError') ||
    msg.includes('high demand');

  const cooldownUntil = primaryCooldownByKey.get(cooldownKey) ?? 0;
  let lastError: unknown;

  if (!fallbackFn || Date.now() >= cooldownUntil) {
    try {
      return await withTimeout(primaryFn(), primaryTimeoutMs, 'primary model');
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!isTransientMsg(msg)) {
        throw err;
      }
      if (isUnavailableOrTimeout(msg) && fallbackFn) {
        primaryCooldownByKey.set(cooldownKey, Date.now() + 90_000);
      }
    }
  }

  if (fallbackFn) {
    const fallbackDelays = [450];
    for (let attempt = 0; attempt <= fallbackDelays.length; attempt++) {
      try {
        return await withTimeout(fallbackFn(), fallbackTimeoutMs, 'fallback model');
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (
          !isTransientMsg(msg) ||
          msg.includes('AI_TIMEOUT') ||
          attempt === fallbackDelays.length
        ) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, fallbackDelays[attempt]));
      }
    }
  }

  throw lastError;
}

export function formatFriendlyAiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    raw.includes('503') ||
    raw.includes('504') ||
    raw.includes('AI_TIMEOUT') ||
    raw.includes('DEADLINE_EXCEEDED') ||
    raw.includes('aborted') ||
    raw.includes('UNAVAILABLE') ||
    raw.includes('high demand')
  ) {
    return 'NOVA is experiencing temporary high network demand. Please try again in a moment.';
  }
  if (raw.includes('API_KEY') || raw.includes('403') || raw.includes('401')) {
    return 'AI service key is missing or invalid in Settings > Secrets.';
  }
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed?.error?.message) return parsed.error.message;
  } catch {
    // not JSON
  }
  return raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
}

export async function runNovaChatTurn(params: {
  userId: string;
  textInput?: string;
  audioBase64?: string;
  audioMimeType?: string;
  hintLanguage?: string;
  generateVoice?: boolean;
  tzOffsetMinutes?: number;
}): Promise<{
  ignored?: boolean;
  userTranscript: string;
  reply: string;
  emotionId: string;
  emotionFile: string;
  emotionLabel?: string;
  secondaryEmotionId?: string;
  secondaryEmotionFile?: string;
  detectedLanguage: string;
  lockedLanguage: string | null;
  languageSwitched: boolean;
  userMood?: string;
  adaptedStyle?: string;
  personalityArchetype?: PersonalityArchetypeId;
  personalityTraits?: PersonalityTraits;
  voiceProsody?: VoiceProsodyProfile;
  emotionTimeline?: EmotionTimelineCue[];
  audioBase64?: string;
  audioMimeType?: string;
}> {
  const ai = getAiClient();
  const settings = getUserSettings(params.userId);
  const memories = settings.memoryEnabled ? getUserMemories(params.userId, 30) : [];
  const recentMessages = getRecentMessages(params.userId, 24);

  const preResolvedLang = params.textInput?.trim()
    ? resolveNextConversationLanguage({
        currentLanguage: settings.lockedLanguage,
        userText: params.textInput,
      }).language
    : settings.lockedLanguage;
  const hintLang = normalizeToBcp47(params.hintLanguage);
  const nativeCheckTargetLanguage = params.textInput?.trim()
    ? detectNativeCheckRequest(params.textInput)
    : null;

  const preTurnMoodProfile = analyzeConversationMoodProfile({
    currentUserText: params.textInput,
    recentMessages,
    memories,
    archetypeId: settings.personalityArchetype,
    traits: settings.personalityTraits,
  });

  const systemInstruction = buildNovaSystemInstruction({
    memories,
    recentMessages,
    lockedLanguage: preResolvedLang,
    hintLanguage: hintLang,
    nativeCheckTargetLanguage,
    moodProfile: preTurnMoodProfile,
    isLiveVoice: false,
  });

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (params.audioBase64 && params.audioMimeType) {
    if (!params.textInput?.trim()) {
      const audioBuf = Buffer.from(params.audioBase64, 'base64');
      let isSilentOrTooShort = audioBuf.length < 1000;
      if (!isSilentOrTooShort && audioBuf.length >= 44 && audioBuf.subarray(0, 4).toString('ascii') === 'RIFF') {
        const dataIdx = audioBuf.indexOf(Buffer.from('data', 'ascii'), 12);
        const pcmOffset = dataIdx >= 0 ? dataIdx + 8 : 44;
        let peak = 0;
        for (let i = pcmOffset; i + 1 < audioBuf.length; i += 2) {
          const sample = Math.abs(audioBuf.readInt16LE(i));
          if (sample > peak) peak = sample;
          if (peak >= 150) break;
        }
        if (peak < 150) {
          isSilentOrTooShort = true;
        }
      }
      if (isSilentOrTooShort) {
        console.log('Short or silent audio ignored');
        return {
          ignored: true,
          userTranscript: '',
          reply: '',
          emotionId: preTurnMoodProfile.listeningEmotion,
          emotionFile: getEmotionSpec(preTurnMoodProfile.listeningEmotion).file,
          detectedLanguage: settings.lockedLanguage || hintLang || 'en-US',
          lockedLanguage: settings.lockedLanguage,
          languageSwitched: false,
        };
      }
    }

    parts.push({
      inlineData: {
        mimeType: params.audioMimeType,
        data: params.audioBase64,
      },
    });
    parts.push({
      text:
        params.textInput?.trim() ||
        `Listen carefully to the attached user voice audio. Transcribe accurately in the speaker's actual language (supporting ANY world language, accents, and pronunciation patterns — Uzbek, Russian, English, Turkish, Arabic, Spanish, French, German, Chinese, Japanese, Korean, etc.). If the audio is silent, faint noise, or unintelligible (< 2 characters of real speech), return empty string "" for both userTranscript and reply. Otherwise:
- Identify the dominant spoken language of THIS specific message and return its exact BCP-47 tag in detectedLanguage (if mixed-language, choose the dominant language; if it is just a tiny ambiguous filler like "ok" or "hmm", use ${settings.lockedLanguage || hintLang || 'en-US'}).
- Respond naturally in THAT EXACT language (never force English when the user speaks another language), while honoring your active Companion Archetype (${preTurnMoodProfile.archetypeLabel}) and keeping full conversation context.`,
    });
  } else if (params.textInput?.trim()) {
    parts.push({ text: params.textInput.trim() });
  } else {
    const greetLang = preResolvedLang || hintLang || 'en-US';
    const greetSpec = getLanguageSpec(greetLang);
    const knownName = extractKnownUserName(memories);
    parts.push({
      text: `The user just tapped the microphone to start talking with you in ${
        greetSpec ? `${greetSpec.englishName} (${greetSpec.bcp47})` : greetLang
      }. Greet them warmly in their national cultural spirit, clearly say your name is NOVA, continue by telling them how you can help (being a real friend, listening, giving advice, talking about anything, and checking/practicing any language like a native speaker), and ${
        knownName
          ? `welcome ${knownName} warmly by name.`
          : 'ask for their name so you can get to know them.'
      }`,
    });
  }

  const chatConfig = {
    systemInstruction,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        userTranscript: {
          type: Type.STRING,
          description:
            'Exact transcription of the user audio or text input (empty string if greeting only).',
        },
        reply: {
          type: Type.STRING,
          description:
            'NOVA natural conversational reply strictly in the locked conversation language (or user first-phrase language if unlocked).',
        },
        emotionId: {
          type: Type.STRING,
          description:
            'Exact editorial emotion id from the 72-video palette matching the emotional core of this moment (e.g. warmwelcome, deepempathy, compassionateexpression, adjustingglasses, clappinghands, proudhappiness, naturallaughter, biglaugh, playfulsmile, blushing0, friendlysurprise0, genuinecuriosity, reassuringconfidence, gratefulwarmth, deepsadness).',
        },
        secondaryEmotionId: {
          type: Type.STRING,
          description:
            'Optional second-beat emotion id from the 72-video palette if your reply shifts tone midway (e.g. deepempathy -> reassuringconfidence, or adjustingglasses -> warmsmile0); otherwise empty string.',
        },
        detectedLanguage: {
          type: Type.STRING,
          description: 'BCP-47 language tag of the conversation (e.g. ru-RU, en-US, uz-UZ, es-ES).',
        },
        explicitLanguageSwitch: {
          type: Type.STRING,
          description:
            'ONLY set to a BCP-47 tag (e.g. en-US, ru-RU, uz-UZ) if the user EXPLICITLY asked to change languages; otherwise empty string.',
        },
        requestedArchetype: {
          type: Type.STRING,
          description:
            'ONLY set to one of: adaptive, witty_friend, caring_confidante, curious_learner if the user explicitly commanded a personality/style change; otherwise empty string.',
        },
        memoryFact: {
          type: Type.STRING,
          description:
            'Optional short personal fact/preference about the user worth remembering for future chats, or empty string.',
        },
        userMood: {
          type: Type.STRING,
          description:
            'Perceived user emotional mood: distressed, anxious, melancholic, frustrated, playful, curious, celebratory, affectionate, reflective, or neutral.',
        },
      },
      required: ['userTranscript', 'reply', 'emotionId', 'detectedLanguage'],
    },
  };

  const response = await callWithRetryAndFallback(
    () =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          ...chatConfig,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      }),
    () =>
      ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: { parts },
        config: chatConfig,
      })
  );

  const rawText = (response.text ?? '{}').trim();
  const parsed = JSON.parse(rawText) as {
    userTranscript?: string;
    reply?: string;
    emotionId?: string;
    secondaryEmotionId?: string;
    detectedLanguage?: string;
    explicitLanguageSwitch?: string;
    requestedArchetype?: string;
    memoryFact?: string;
    userMood?: string;
  };

  const userTranscript = (params.textInput?.trim() || parsed.userTranscript || '').trim();
  const reply = (parsed.reply || '').trim();

  // If user audio yielded no meaningful speech (< 2 chars) or foreign non-command audio, skip saving or locking
  const isAudioOnlyTurn = Boolean(params.audioBase64 && !params.textInput?.trim());
  const transcriptCheck = sanitizeUserMessage(userTranscript);
  if (isAudioOnlyTurn && (!transcriptCheck.valid || !reply)) {
    console.log('Игнорирован короткий или посторонний иноязычный звук');
    return {
      ignored: true,
      userTranscript: '',
      reply: '',
      emotionId: 'activelistening',
      emotionFile: getEmotionSpec('activelistening').file,
      detectedLanguage: settings.lockedLanguage || hintLang || 'en-US',
      lockedLanguage: settings.lockedLanguage,
      languageSwitched: false,
    };
  }

  // Strict first-language lock + command-only switching across ALL world languages
  const finalLang = transcriptCheck.valid
    ? resolveNextConversationLanguage({
        currentLanguage: settings.lockedLanguage,
        userText: transcriptCheck.cleanText,
        modelDetectedLanguage: parsed.detectedLanguage,
        modelExplicitSwitchLanguage: parsed.explicitLanguageSwitch,
        allowModelSwitchWithoutRegex: Boolean(parsed.explicitLanguageSwitch?.trim()),
      })
    : {
        language: settings.lockedLanguage,
        lockedLanguage: settings.lockedLanguage,
        didSwitch: false,
        shouldIgnoreForeignSpeech: false,
      };

  if (isAudioOnlyTurn && finalLang.shouldIgnoreForeignSpeech) {
    console.log('Игнорирован посторонний язык без команды переключения');
    return {
      ignored: true,
      userTranscript: '',
      reply: '',
      emotionId: preTurnMoodProfile.listeningEmotion,
      emotionFile: getEmotionSpec(preTurnMoodProfile.listeningEmotion).file,
      detectedLanguage: settings.lockedLanguage || hintLang || 'en-US',
      lockedLanguage: settings.lockedLanguage,
      languageSwitched: false,
    };
  }

  const effectiveLang =
    finalLang.language ||
    normalizeToBcp47(parsed.detectedLanguage) ||
    hintLang ||
    'en-US';

  // Execute explicit personality style change command if user asked for one
  const effectiveArchetype = parsed.requestedArchetype?.trim()
    ? normalizePersonalityArchetype(parsed.requestedArchetype.trim())
    : settings.personalityArchetype;

  // Gradually shape NOVA's persistent personality traits based on this interaction
  let updatedTraits = settings.personalityTraits;
  if (transcriptCheck.valid) {
    const turnSignal = analyzeTurnSentiment(transcriptCheck.cleanText);
    updatedTraits = evolvePersonalityTraits(
      settings.personalityTraits,
      turnSignal,
      transcriptCheck.cleanText
    );
    updateUserSettings(params.userId, {
      ...(effectiveLang !== settings.lockedLanguage ? { lockedLanguage: effectiveLang } : {}),
      ...(effectiveArchetype !== settings.personalityArchetype
        ? { personalityArchetype: effectiveArchetype }
        : {}),
      personalityTraits: updatedTraits,
    });
  } else if (
    effectiveLang !== settings.lockedLanguage ||
    effectiveArchetype !== settings.personalityArchetype
  ) {
    updateUserSettings(params.userId, {
      ...(effectiveLang !== settings.lockedLanguage ? { lockedLanguage: effectiveLang } : {}),
      ...(effectiveArchetype !== settings.personalityArchetype
        ? { personalityArchetype: effectiveArchetype }
        : {}),
    });
  }

  const postTurnMoodProfile = analyzeConversationMoodProfile({
    currentUserText: userTranscript,
    recentMessages,
    memories,
    archetypeId: effectiveArchetype,
    traits: updatedTraits,
  });

  const resolvedFromModel = parsed.emotionId?.trim()
    ? getEmotionSpec(parsed.emotionId)
    : null;
  const fallbackMoodEmotion = inferEmotionFromText(reply || userTranscript, 'assistant');
  const personalityEmotionId = selectPersonalityAwareEmotion({
    archetypeId: effectiveArchetype,
    candidateEmotionId:
      resolvedFromModel && resolvedFromModel.id !== 'friendlysmile'
        ? resolvedFromModel.id
        : fallbackMoodEmotion.id,
    replyText: reply,
    userMood: postTurnMoodProfile.mood,
  });
  const emotionSpec = getEmotionSpec(personalityEmotionId);

  const secondarySpec = parsed.secondaryEmotionId?.trim()
    ? getEmotionSpec(parsed.secondaryEmotionId)
    : null;
  const effectiveSecondary =
    secondarySpec && secondarySpec.id !== emotionSpec.id
      ? secondarySpec
      : postTurnMoodProfile.recommendedEmotions.find((id) => id !== emotionSpec.id)
        ? getEmotionSpec(
            postTurnMoodProfile.recommendedEmotions.find((id) => id !== emotionSpec.id)
          )
        : null;

  if (userTranscript) {
    appendMessage(
      params.userId,
      'user',
      userTranscript,
      effectiveLang,
      inferEmotionFromText(userTranscript, 'user').id
    );
  }

  if (reply) {
    appendMessage(params.userId, 'assistant', reply, effectiveLang, emotionSpec.id);
  }

  if (settings.memoryEnabled) {
    if (parsed.memoryFact?.trim()) {
      addUserMemoryFact(params.userId, parsed.memoryFact.trim());
    }
    if (userTranscript) {
      const lastAssistantMsg =
        [...recentMessages].reverse().find((m) => m.role === 'assistant')?.content ?? null;
      const deterministicNameFact = extractUserNameFact(userTranscript, lastAssistantMsg);
      if (deterministicNameFact) {
        addUserMemoryFact(params.userId, deterministicNameFact);
      }
    }
  }

  const voiceProsody = resolveVoiceProsody({
    emotionId: emotionSpec.id,
    profile: postTurnMoodProfile,
    archetypeId: effectiveArchetype,
    traits: updatedTraits,
  });

  const emotionTimeline = buildEmotionTimeline({
    replyText: reply,
    primaryEmotionId: emotionSpec.id,
    secondaryEmotionId: effectiveSecondary?.id,
    profile: postTurnMoodProfile,
    archetypeId: effectiveArchetype,
  });

  let audioBase64: string | undefined;
  let audioMimeType: string | undefined;

  if (params.generateVoice !== false && reply) {
    try {
      const langSpec = getLanguageSpec(effectiveLang);
      const nativeHint = langSpec
        ? `Speak as a native ${langSpec.englishName} (${langSpec.bcp47}) speaker with clean, pure, accent-free pronunciation and natural speech rhythm.`
        : '';

      const ttsContents = [
        {
          role: 'user',
          parts: [
            {
              text: reply,
              speechMetadata: {
                style: `${voiceProsody.ttsStyleDirective}. ${nativeHint} Natural, expressive female voice with human pauses and emotional continuity.`,
              },
            },
          ],
        },
      ];
      const ttsConfig = {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: postTurnMoodProfile.preferredVoice },
          },
        },
      };

      const ttsResponse = await callWithRetryAndFallback(
        () =>
          ai.models.generateContent({
            model: 'gemini-3.8-flash-tts',
            contents: ttsContents,
            config: ttsConfig,
          }),
        () =>
          ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: ttsContents,
            config: ttsConfig,
          }),
        6000,
        9000,
        'tts'
      );

      const wavData =
        ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (wavData) {
        audioBase64 = wavData;
        audioMimeType = 'audio/wav';
      }
    } catch (ttsErr) {
      console.error('TTS generation error (falling back to text):', ttsErr);
    }
  }

  return {
    userTranscript,
    reply,
    emotionId: emotionSpec.id,
    emotionFile: emotionSpec.file,
    emotionLabel: emotionSpec.label,
    secondaryEmotionId: effectiveSecondary?.id,
    secondaryEmotionFile: effectiveSecondary?.file,
    detectedLanguage: effectiveLang,
    lockedLanguage: effectiveLang,
    languageSwitched: finalLang.didSwitch,
    userMood: parsed.userMood?.trim() || postTurnMoodProfile.mood,
    adaptedStyle: postTurnMoodProfile.styleName,
    personalityArchetype: effectiveArchetype,
    personalityTraits: updatedTraits,
    voiceProsody,
    emotionTimeline,
    audioBase64,
    audioMimeType,
  };
}

const ttsCache = new Map<
  string,
  {
    audioBase64: string;
    audioMimeType: string;
    language: string;
    voiceProsody: VoiceProsodyProfile;
    emotionTimeline: EmotionTimelineCue[];
  }
>();

async function detectLanguageWithAi(sampleText: string): Promise<string | null> {
  try {
    const res = await withTimeout(
      getAiClient().models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Identify the exact BCP-47 language tag (for example: en-US, ru-RU, uz-UZ, tr-TR, ar-SA, es-ES, fr-FR, de-DE, zh-CN, ja-JP, ko-KR, fi-FI, cs-CZ, id-ID) of this message. Return only JSON.\n\nMessage: ${JSON.stringify(
          sampleText.slice(0, 320)
        )}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bcp47: { type: Type.STRING },
            },
            required: ['bcp47'],
          },
        },
      }),
      2800,
      'language identification'
    );
    const parsedLang = JSON.parse((res.text ?? '{}').trim()) as { bcp47?: string };
    return normalizeToBcp47(parsedLang.bcp47);
  } catch {
    return null;
  }
}

export async function synthesizeMessageSpeech(params: {
  userId: string;
  text: string;
  languageHint?: string | null;
  emotionHint?: string | null;
}): Promise<{
  audioBase64: string;
  audioMimeType: string;
  language: string;
  voiceProsody: VoiceProsodyProfile;
  emotionTimeline: EmotionTimelineCue[];
}> {
  const cleanText = params.text.trim();
  if (!cleanText) {
    throw new Error('Cannot synthesize empty text.');
  }

  const settings = getUserSettings(params.userId);
  const heuristic = inferDominantLanguageWithConfidence(cleanText);
  let targetLang = resolveMessagePlaybackLanguage(
    cleanText,
    params.languageHint,
    settings.lockedLanguage
  );
  if (!heuristic.confident && !heuristic.isAmbiguous) {
    const aiLang = await detectLanguageWithAi(cleanText);
    if (aiLang) targetLang = aiLang;
  }

  const resolvedEmotion = params.emotionHint?.trim()
    ? getEmotionSpec(params.emotionHint)
    : inferEmotionFromText(cleanText, 'assistant');
  const archetypeSpec = getPersonalityArchetypeSpec(settings.personalityArchetype);
  const voiceProsody = resolveVoiceProsody({
    emotionId: resolvedEmotion.id,
    archetypeId: settings.personalityArchetype,
    traits: settings.personalityTraits,
  });
  const emotionTimeline = buildEmotionTimeline({
    replyText: cleanText,
    primaryEmotionId: resolvedEmotion.id,
    archetypeId: settings.personalityArchetype,
  });

  const cacheKey = `${archetypeSpec.preferredVoice}:${resolvedEmotion.id}:${targetLang}:${cleanText}`;
  const cached = ttsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const langSpec = getLanguageSpec(targetLang);
  const nativeHint = langSpec
    ? `Speak purely as a native ${langSpec.englishName} (${langSpec.bcp47}) speaker with authentic pronunciation, natural cadence, and zero foreign accent.`
    : `Speak natively in ${targetLang} with natural pronunciation and cadence.`;

  const ai = getAiClient();
  const ttsContents = [
    {
      role: 'user',
      parts: [
        {
          text: cleanText,
          speechMetadata: {
            style: `${voiceProsody.ttsStyleDirective}. ${nativeHint}`,
          },
        },
      ],
    },
  ];
  const ttsConfig = {
    responseModalities: ['AUDIO'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: archetypeSpec.preferredVoice },
      },
    },
  };

  const ttsResponse = await callWithRetryAndFallback(
    () =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: ttsContents,
        config: ttsConfig,
      }),
    () =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: ttsContents,
        config: ttsConfig,
      }),
    12000,
    16000,
    'listen_tts'
  );

  const wavData =
    ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!wavData) {
    throw new Error('Speech synthesis returned empty audio');
  }

  const result = {
    audioBase64: wavData,
    audioMimeType: 'audio/wav',
    language: targetLang,
    voiceProsody,
    emotionTimeline,
  };
  if (ttsCache.size >= 40) {
    const oldestKey = ttsCache.keys().next().value;
    if (oldestKey) ttsCache.delete(oldestKey);
  }
  ttsCache.set(cacheKey, result);
  return result;
}

async function extractMemoryInBackground(userId: string, userText: string, assistantText: string) {
  try {
    const settings = getUserSettings(userId);
    if (!settings.memoryEnabled) return;
    if (!userText.trim() || userText.trim().length < 2) return;

    const ai = getAiClient();
    const resp = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Extract at most ONE concise factual personal detail or preference about the user worth remembering for future friend conversations (e.g. "User's name is Alex", "Learning Spanish for a trip", "Works as a designer", "Prefers Russian"). Return empty string if nothing durable.\n\nUser: ${userText}\nNOVA: ${assistantText}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fact: { type: Type.STRING },
          },
          required: ['fact'],
        },
      },
    });
    const parsed = JSON.parse((resp.text ?? '{}').trim()) as { fact?: string };
    if (parsed.fact?.trim()) {
      addUserMemoryFact(userId, parsed.fact.trim());
    }
  } catch {
    // Non-fatal background enrichment
  }
}

export function attachLiveWebSocketServer(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname !== '/ws/live') {
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, url);
    });
  });

  wss.on('connection', async (clientWs: WebSocket, _req: unknown, url: URL) => {
    const tokenParam = url.searchParams.get('token');
    const tgInitDataParam = url.searchParams.get('tgInitData');
    let authenticatedUserId = verifySessionToken(tokenParam);
    if (!authenticatedUserId && tgInitDataParam) {
      const verified = verifyTelegramWebAppInitData(tgInitDataParam);
      if (verified.valid && verified.telegramUserId) {
        authenticatedUserId = verified.telegramUserId;
      }
    }
    if (!authenticatedUserId) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message: 'Unauthorized voice session',
        })
      );
      clientWs.close(4401, 'Unauthorized');
      return;
    }

    const userId = authenticatedUserId;
    const tzOffset = Number(url.searchParams.get('tzOffset') || '0') || 0;
    const autoGreet = url.searchParams.get('autoGreet') !== '0';
    const hintLang = normalizeToBcp47(url.searchParams.get('hintLang'));

    const initialBalance = getOrRefreshUserBalance(userId, tzOffset);
    if (initialBalance.totalSecondsRemaining <= 0) {
      clientWs.send(
        JSON.stringify({
          type: 'time_exhausted',
          balance: initialBalance,
        })
      );
      clientWs.close();
      return;
    }

    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    let isClosed = false;
    let isMicStreaming = false;
    let lastBillingAtMs: number | null = null;
    let currentUserTranscript = '';
    let lastUserTurnTranscript = '';
    let currentAssistantTranscript = '';
    let currentAssistantAudioCount = 0;
    let lastEmotionId = 'warmwelcome';
    let explicitToolEmotionForTurn = false;
    let activeLockedLanguage: string | null = getUserSettings(userId).lockedLanguage;
    let lastAssistantPromptInSession: string | null = null;
    let turnQueue: Promise<void> = Promise.resolve();

    const detectFirstVoiceLanguageWithAi = detectLanguageWithAi;

    const flushPendingTurnToHistory = () => {
      const pendingUser = sanitizeUserMessage(currentUserTranscript);
      const userLine = pendingUser.valid ? pendingUser.cleanText : '';
      const assistantLine = currentAssistantTranscript.trim();
      if (userLine) {
        appendMessage(
          userId,
          'user',
          userLine,
          activeLockedLanguage,
          'activelistening'
        );
        if (getUserSettings(userId).memoryEnabled) {
          const nameFact = extractUserNameFact(userLine, lastAssistantPromptInSession);
          if (nameFact) {
            addUserMemoryFact(userId, nameFact);
          }
        }
      }
      if (assistantLine) {
        const finalEmotion =
          lastEmotionId || inferEmotionFromText(assistantLine, 'assistant').id;
        appendMessage(
          userId,
          'assistant',
          assistantLine,
          activeLockedLanguage,
          finalEmotion
        );
      }
      currentUserTranscript = '';
      currentAssistantTranscript = '';
    };

    const billActiveSeconds = () => {
      if (!isMicStreaming || lastBillingAtMs === null) return null;
      const now = Date.now();
      const elapsedSec = Math.floor((now - lastBillingAtMs) / 1000);
      if (elapsedSec <= 0) return null;
      lastBillingAtMs += elapsedSec * 1000;
      return applyUsageTick(userId, elapsedSec, tzOffset);
    };

    const usageInterval = setInterval(() => {
      if (isClosed || !isMicStreaming) return;
      const updated = billActiveSeconds();
      if (!updated) return;
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'balance', balance: updated }));
      }
      if (updated.exhausted) {
        isMicStreaming = false;
        lastBillingAtMs = null;
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'time_exhausted', balance: updated }));
        }
        try {
          liveSession?.close();
        } catch {
          // ignore
        }
        clientWs.close();
      }
    }, 5000);

    const cleanup = () => {
      if (isClosed) return;
      isClosed = true;
      billActiveSeconds();
      isMicStreaming = false;
      lastBillingAtMs = null;
      clearInterval(usageInterval);
      flushPendingTurnToHistory();
      try {
        liveSession?.close();
      } catch {
        // ignore
      }
    };

    clientWs.on('close', cleanup);
    clientWs.on('error', cleanup);

    try {
      const ai = getAiClient();
      const settings = getUserSettings(userId);
      activeLockedLanguage = settings.lockedLanguage;
      const memories = settings.memoryEnabled ? getUserMemories(userId, 30) : [];
      const recentMessages = getRecentMessages(userId, 24);
      const liveHistoryBuffer = recentMessages.map((m) => ({
        role: m.role,
        content: m.content,
        emotion: m.emotion,
      }));
      let liveTraits = settings.personalityTraits;
      const activeArchetype = settings.personalityArchetype;
      let currentMoodProfile = analyzeConversationMoodProfile({
        recentMessages: liveHistoryBuffer,
        memories,
        archetypeId: activeArchetype,
        traits: liveTraits,
      });

      const setEmotionTool: FunctionDeclaration = {
        name: 'set_emotion',
        description:
          'Switch NOVA full-screen emotional video expression to match the current conversational emotion and NOVA personality.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            emotionId: {
              type: Type.STRING,
              description: `One emotion ID from: ${NOVA_EMOTION_CATALOG.map((e) => e.id).join(', ')}`,
            },
          },
          required: ['emotionId'],
        },
      };

      const switchLanguageTool: FunctionDeclaration = {
        name: 'switch_language',
        description:
          'Report the active conversation language whenever the user starts speaking in a language or clearly switches to another language (any world language).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            languageCode: {
              type: Type.STRING,
              description: 'BCP-47 language tag such as ru-RU, en-US, uz-UZ, tr-TR, ar-SA, es-ES.',
            },
          },
          required: ['languageCode'],
        },
      };

      const pendingClientPayloads: string[] = [];

      clientWs.on('message', (raw) => {
        if (isClosed) return;
        const rawStr = raw.toString();
        if (!liveSession) {
          pendingClientPayloads.push(rawStr);
          return;
        }
        handleIncomingClientPayload(rawStr);
      });

      const handleIncomingClientPayload = (rawStr: string) => {
        if (!liveSession || isClosed) return;
        try {
          const msg = JSON.parse(rawStr) as {
            type?: string;
            audio?: string;
            text?: string;
            micActive?: boolean;
          };

          if (typeof msg.micActive === 'boolean') {
            isMicStreaming = msg.micActive;
            if (isMicStreaming && lastBillingAtMs === null) {
              lastBillingAtMs = Date.now();
            }
          }

          if (msg.audio) {
            isMicStreaming = true;
            if (lastBillingAtMs === null) {
              lastBillingAtMs = Date.now();
            }
            liveSession.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          } else if (msg.text) {
            const { valid, cleanText } = sanitizeUserMessage(msg.text);
            if (!valid) {
              console.log('Слишком короткий звук проигнорирован');
              return;
            }
            currentUserTranscript = cleanText;
            lastUserTurnTranscript = cleanText;
            const resolved = resolveNextConversationLanguage({
              currentLanguage: activeLockedLanguage,
              userText: cleanText,
            });
            if (resolved.language && resolved.didSwitch) {
              activeLockedLanguage = resolved.language;
              updateUserSettings(userId, { lockedLanguage: activeLockedLanguage });
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'language_locked',
                    language: activeLockedLanguage,
                  })
                );
              }
            }
            liveSession.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: cleanText }] }],
              turnComplete: true,
            });
          }
        } catch {
          // ignore malformed frames
        }
      };

      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: currentMoodProfile.preferredVoice },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: [setEmotionTool, switchLanguageTool] }],
          systemInstruction: buildNovaSystemInstruction({
            memories,
            recentMessages,
            lockedLanguage: activeLockedLanguage,
            hintLanguage: hintLang,
            moodProfile: currentMoodProfile,
            isLiveVoice: true,
          }),
        },
        callbacks: {
          onopen: () => {
            // Ready is emitted once ai.live.connect resolves and liveSession is assigned
          },
          onmessage: (message: LiveServerMessage) => {
            if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

            const content = message.serverContent;

            if (content?.inputTranscription?.text) {
              currentUserTranscript += content.inputTranscription.text;
              const transcriptCheck = sanitizeUserMessage(currentUserTranscript);
              if (transcriptCheck.valid) {
                clientWs.send(
                  JSON.stringify({
                    type: 'user_transcript',
                    text: transcriptCheck.cleanText,
                  })
                );

                // Lock initial language on very first non-ambiguous phrase if not yet locked
                if (!activeLockedLanguage) {
                  const dominantCheck = inferDominantLanguageWithConfidence(transcriptCheck.cleanText);
                  if (dominantCheck.language && dominantCheck.confident && !dominantCheck.isAmbiguous) {
                    const resolved = resolveNextConversationLanguage({
                      currentLanguage: activeLockedLanguage,
                      userText: transcriptCheck.cleanText,
                      modelDetectedLanguage: dominantCheck.language,
                    });
                    if (resolved.language && resolved.didSwitch) {
                      activeLockedLanguage = resolved.language;
                      updateUserSettings(userId, { lockedLanguage: activeLockedLanguage });
                      clientWs.send(
                        JSON.stringify({
                          type: 'language_locked',
                          language: activeLockedLanguage,
                        })
                      );
                    }
                  }
                }
              }

              currentMoodProfile = analyzeConversationMoodProfile({
                currentUserText: currentUserTranscript,
                recentMessages: liveHistoryBuffer,
                memories,
                archetypeId: activeArchetype,
                traits: liveTraits,
              });
              const listenerMood = inferEmotionFromText(currentUserTranscript, 'user');
              if (
                listenerMood.id !== lastEmotionId &&
                (listenerMood.category === 'sadness' ||
                  listenerMood.category === 'empathy' ||
                  listenerMood.category === 'laughter' ||
                  listenerMood.category === 'surprise' ||
                  listenerMood.category === 'curiosity' ||
                  listenerMood.category === 'affection' ||
                  listenerMood.category === 'thinking' ||
                  listenerMood.category === 'joy' ||
                  listenerMood.category === 'playful' ||
                  listenerMood.category === 'calm')
              ) {
                lastEmotionId = listenerMood.id;
                const listenerProsody = resolveVoiceProsody({
                  emotionId: listenerMood.id,
                  profile: currentMoodProfile,
                  archetypeId: activeArchetype,
                  traits: liveTraits,
                });
                clientWs.send(
                  JSON.stringify({
                    type: 'emotion',
                    emotion: listenerMood,
                    voiceProsody: listenerProsody,
                  })
                );
              }
            }

            if (content?.outputTranscription?.text) {
              currentAssistantTranscript += content.outputTranscription.text;
              clientWs.send(
                JSON.stringify({
                  type: 'assistant_transcript',
                  text: currentAssistantTranscript,
                })
              );
              if (!explicitToolEmotionForTurn) {
                const inferred = inferEmotionFromText(currentAssistantTranscript, 'assistant');
                if (inferred.id !== lastEmotionId && inferred.id !== 'friendlysmile') {
                  lastEmotionId = inferred.id;
                  const inferredProsody = resolveVoiceProsody({
                    emotionId: inferred.id,
                    profile: currentMoodProfile,
                    archetypeId: activeArchetype,
                    traits: liveTraits,
                  });
                  clientWs.send(
                    JSON.stringify({
                      type: 'emotion',
                      emotion: inferred,
                      voiceProsody: inferredProsody,
                    })
                  );
                }
              }
            }

            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                currentAssistantAudioCount++;
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
            }

            if (message.toolCall?.functionCalls?.length) {
              for (const call of message.toolCall.functionCalls) {
                if (call.name === 'set_emotion') {
                  const args = (call.args || {}) as { emotionId?: string };
                  const spec = getEmotionSpec(args.emotionId);
                  explicitToolEmotionForTurn = true;
                  lastEmotionId = spec.id;
                  const toolProsody = resolveVoiceProsody({
                    emotionId: spec.id,
                    profile: currentMoodProfile,
                    archetypeId: activeArchetype,
                    traits: liveTraits,
                  });
                  clientWs.send(
                    JSON.stringify({
                      type: 'emotion',
                      emotion: spec,
                      voiceProsody: toolProsody,
                    })
                  );
                  liveSession?.sendToolResponse({
                    functionResponses: [
                      {
                        id: call.id,
                        name: call.name,
                        response: {
                          status: 'ok',
                          activeEmotion: spec.id,
                          userMood: currentMoodProfile.mood,
                          adaptedStyle: currentMoodProfile.styleName,
                          pacingGuidance: currentMoodProfile.pacingGuidance,
                          vocalProsody: toolProsody.ttsStyleDirective,
                          speakingRate: toolProsody.speakingRate,
                          pitchShift: toolProsody.pitchShift,
                          intonationArc: toolProsody.intonationArc,
                        },
                      },
                    ],
                  });
                } else if (call.name === 'switch_language') {
                  const args = (call.args || {}) as { languageCode?: string };
                  const validationTranscript =
                    currentUserTranscript.trim() || lastUserTurnTranscript;
                  const normalizedArg = normalizeToBcp47(args.languageCode);
                  const hasExplicitCmd = validationTranscript
                    ? hasExplicitLanguageSwitchIntent(validationTranscript)
                    : false;
                  const resolved = resolveNextConversationLanguage({
                    currentLanguage: activeLockedLanguage,
                    userText: validationTranscript,
                    modelDetectedLanguage: normalizedArg,
                    modelExplicitSwitchLanguage:
                      !activeLockedLanguage || hasExplicitCmd ? normalizedArg : null,
                  });
                  if (resolved.language && resolved.didSwitch) {
                    activeLockedLanguage = resolved.language;
                    updateUserSettings(userId, { lockedLanguage: activeLockedLanguage });
                    clientWs.send(
                      JSON.stringify({
                        type: 'language_locked',
                        language: activeLockedLanguage,
                      })
                    );
                  }
                  const activeNow = activeLockedLanguage || normalizedArg || 'en-US';
                  liveSession?.sendToolResponse({
                    functionResponses: [
                      {
                        id: call.id,
                        name: call.name,
                        response: {
                          status: activeLockedLanguage && !resolved.didSwitch && normalizedArg !== activeLockedLanguage ? 'locked' : 'ok',
                          activeLanguage: activeNow,
                          rule: `Speak STRICTLY in ${activeNow}. Ignore background speech in other languages; ONLY switch if the user explicitly commands a language change.`,
                        },
                      },
                    ],
                  });
                }
              }
            }

            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            if (content?.turnComplete) {
              const userCheck = sanitizeUserMessage(currentUserTranscript);
              const userLine = userCheck.valid ? userCheck.cleanText : '';
              const assistantLine = currentAssistantTranscript.trim();
              const hasAssistantResponse =
                assistantLine.length > 0 || currentAssistantAudioCount > 0;
              const turnEmotionId = lastEmotionId;
              const turnMoodSnapshot = { ...currentMoodProfile };

              // Snapshot and reset turn buffers synchronously before async language resolution
              currentUserTranscript = '';
              currentAssistantTranscript = '';
              currentAssistantAudioCount = 0;
              explicitToolEmotionForTurn = false;

              if (!hasAssistantResponse) {
                return;
              }

              turnQueue = turnQueue.then(async () => {
                if (isClosed) return;

                if (userLine) {
                  lastUserTurnTranscript = userLine;
                  const heuristic = inferDominantLanguageWithConfidence(userLine);
                  let aiDetectedLang: string | null = heuristic.language;

                  if (!heuristic.confident && !heuristic.isAmbiguous) {
                    const detected = await detectFirstVoiceLanguageWithAi(userLine);
                    if (detected) aiDetectedLang = detected;
                  }

                  if (!isClosed) {
                    const resolvedTurnLang = resolveNextConversationLanguage({
                      currentLanguage: activeLockedLanguage,
                      userText: userLine,
                      modelDetectedLanguage: aiDetectedLang,
                    });
                    if (resolvedTurnLang.language && resolvedTurnLang.didSwitch) {
                      activeLockedLanguage = resolvedTurnLang.language;
                      updateUserSettings(userId, { lockedLanguage: activeLockedLanguage });
                      if (clientWs.readyState === WebSocket.OPEN) {
                        clientWs.send(
                          JSON.stringify({
                            type: 'language_locked',
                            language: activeLockedLanguage,
                          })
                        );
                      }
                    }

                    // Gradually shape NOVA's persistent personality traits
                    const signal = analyzeTurnSentiment(userLine);
                    liveTraits = evolvePersonalityTraits(liveTraits, signal, userLine);
                    updateUserSettings(userId, { personalityTraits: liveTraits });
                    currentMoodProfile = analyzeConversationMoodProfile({
                      currentUserText: userLine,
                      recentMessages: liveHistoryBuffer,
                      memories,
                      archetypeId: activeArchetype,
                      traits: liveTraits,
                    });
                  }
                }

                if (isClosed) return;

                if (userLine) {
                  liveHistoryBuffer.push({
                    role: 'user',
                    content: userLine,
                    emotion: inferEmotionFromText(userLine, 'user').id,
                  });
                  appendMessage(
                    userId,
                    'user',
                    userLine,
                    activeLockedLanguage,
                    inferEmotionFromText(userLine, 'user').id
                  );
                }
                if (assistantLine) {
                  const finalEmotion =
                    turnEmotionId || inferEmotionFromText(assistantLine, 'assistant').id;
                  liveHistoryBuffer.push({
                    role: 'assistant',
                    content: assistantLine,
                    emotion: finalEmotion,
                  });
                  appendMessage(
                    userId,
                    'assistant',
                    assistantLine,
                    activeLockedLanguage,
                    finalEmotion
                  );
                }
                if (userLine) {
                  const liveSettings = getUserSettings(userId);
                  if (liveSettings.memoryEnabled) {
                    const deterministicNameFact = extractUserNameFact(
                      userLine,
                      lastAssistantPromptInSession
                    );
                    if (deterministicNameFact) {
                      addUserMemoryFact(userId, deterministicNameFact);
                    }
                  }
                  if (assistantLine) {
                    void extractMemoryInBackground(userId, userLine, assistantLine);
                  }
                }
                if (assistantLine) {
                  lastAssistantPromptInSession = assistantLine;
                }
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'turn_complete',
                      userTranscript: userLine,
                      assistantTranscript: assistantLine,
                      lockedLanguage: activeLockedLanguage,
                      userMood: turnMoodSnapshot.mood,
                      adaptedStyle: currentMoodProfile.styleName,
                      personalityArchetype: activeArchetype,
                      personalityTraits: liveTraits,
                    })
                  );
                }
              });
            }
          },
          onerror: (err: unknown) => {
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  fallbackRecommended: true,
                  message: err instanceof Error ? err.message : 'Live voice connection error',
                })
              );
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'live_closed' }));
            }
          },
        },
      });

      if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'ready',
            balance: initialBalance,
            emotion: getEmotionSpec(currentMoodProfile.idleEmotion),
            lockedLanguage: activeLockedLanguage,
            personalityArchetype: activeArchetype,
            personalityTraits: liveTraits,
            adaptedStyle: currentMoodProfile.styleName,
          })
        );
      }

      for (const queued of pendingClientPayloads.splice(0)) {
        handleIncomingClientPayload(queued);
      }

      // On first Mic tap when NO language is locked yet, stay in listening mode so NOVA hears the user's voice first,
      // detects ANY world language they speak, and locks onto it automatically.
      // Only auto-greet when returning to an already-locked conversation language!
      if (autoGreet && activeLockedLanguage) {
        const hasHistory = recentMessages.length > 0;
        const knownName = extractKnownUserName(memories);
        const greetSpec = getLanguageSpec(activeLockedLanguage);
        const greetLabel = greetSpec
          ? `${greetSpec.englishName} (${greetSpec.bcp47})`
          : activeLockedLanguage;
        const greetPrompt = hasHistory
          ? `The user just returned and tapped the microphone to continue your saved conversation STRICTLY in ${greetLabel}. Greet ${
              knownName ? `${knownName} warmly by name` : 'them warmly'
            } in ${greetLabel}, naturally pick up from the saved conversation history, and stay strictly in ${greetLabel} unless explicitly commanded to switch.`
          : `Greet the user warmly in ${greetLabel}, clearly introduce yourself as NOVA, explain how you can help as a true friend, and ask their name.`;
        liveSession.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: greetPrompt }] }],
          turnComplete: true,
        });
      }
    } catch (err) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            fallbackRecommended: true,
            message:
              err instanceof Error
                ? err.message
                : 'Unable to start Gemini Live audio session.',
          })
        );
      }
      cleanup();
    }
  });
}
