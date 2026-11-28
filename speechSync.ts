import { handleUserMessage } from '../shared/inputFilter';

interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const NATURAL_VOICE_HINTS =
  /(neural|natural|online|enhanced|premium|wavenet|studio)/i;
const FEMALE_VOICE_HINTS =
  /(female|woman|girl|milena|irina|katya|svetlana|dariya|elena|samantha|victoria|ava|allison|aria|jenny|karen|serena|fiona|moira|tessa|monica|paulina|helena|amelie|anna|yelda|leyla|aisha|google)/i;
const MALE_VOICE_HINTS =
  /\b(male|daniel|alex|fred|yuri|pavel|dmitry|nicolas|thomas|oliver|aaron|arthur|david|mark)\b/i;
const ROBOTIC_VOICE_HINTS =
  /(espeak|mbrola|albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|pipe organ|trinoids|whisper|zarvox)/i;

export interface VoiceLike {
  name: string;
  lang: string;
  localService?: boolean;
}

const COMPATIBLE_LANGUAGE_FALLBACKS: Record<string, readonly string[]> = {
  uz: ['tr', 'az', 'tk', 'kk', 'ky', 'id'],
  az: ['tr', 'uz', 'tk'],
  tk: ['tr', 'uz', 'az'],
  kk: ['ky', 'tr', 'uz'],
  ky: ['kk', 'tr', 'uz'],
  tg: ['fa', 'uz', 'tr'],
  fa: ['ar', 'ur', 'tr'],
  ur: ['hi', 'ar', 'fa'],
  hi: ['ur', 'bn'],
  uk: ['be', 'pl', 'cs', 'sk'],
  be: ['uk', 'pl', 'ru'],
  ru: ['uk', 'be', 'bg', 'sr'],
  es: ['pt', 'it', 'fr'],
  pt: ['es', 'it', 'fr'],
  it: ['es', 'fr', 'pt'],
  fr: ['es', 'it', 'pt'],
  de: ['nl', 'sv', 'da'],
  nl: ['de', 'sv', 'da'],
  sv: ['nb', 'no', 'da'],
  nb: ['sv', 'da', 'no'],
  no: ['nb', 'sv', 'da'],
  da: ['sv', 'nb', 'no'],
  ms: ['id'],
  id: ['ms'],
};

function isForbiddenVoiceFallback(targetBase: string, candidateBase: string): boolean {
  // Never use an English voice to read Russian (or Slavic/Turkic/etc.), never use a Russian voice to read Uzbek
  if (candidateBase === 'en' && targetBase !== 'en') return true;
  if (candidateBase === 'ru' && targetBase === 'uz') return true;
  if (candidateBase === 'ru' && (targetBase === 'tr' || targetBase === 'az' || targetBase === 'en')) {
    return true;
  }
  return false;
}

function scoreVoiceQuality(voice: VoiceLike): number {
  const vName = voice.name;
  let score = 0;
  if (NATURAL_VOICE_HINTS.test(vName)) score += 35;
  if (FEMALE_VOICE_HINTS.test(vName)) score += 30;
  if (/google/i.test(vName)) score += 18;
  if (voice.localService) score += 6;
  if (MALE_VOICE_HINTS.test(vName)) score -= 35;
  if (ROBOTIC_VOICE_HINTS.test(vName)) score -= 60;
  return score;
}

export function selectBestCompatibleVoice<T extends VoiceLike>(
  voices: readonly T[],
  bcp47: string
): T | null {
  if (!voices.length) return null;

  const targetLower = bcp47.toLowerCase().replace(/_/g, '-');
  const baseLang = targetLower.split('-')[0];

  // 1. Exact or same base language native voices
  const nativeMatches = voices.filter((v) => {
    const vLang = v.lang.toLowerCase().replace(/_/g, '-');
    return vLang === targetLower || vLang.startsWith(`${baseLang}-`) || vLang === baseLang;
  });

  if (nativeMatches.length > 0) {
    let best = nativeMatches[0];
    let bestScore =
      (best.lang.toLowerCase().replace(/_/g, '-') === targetLower ? 60 : 30) +
      scoreVoiceQuality(best);

    for (let i = 1; i < nativeMatches.length; i++) {
      const candidate = nativeMatches[i];
      const exactBonus =
        candidate.lang.toLowerCase().replace(/_/g, '-') === targetLower ? 60 : 30;
      const score = exactBonus + scoreVoiceQuality(candidate);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    return best;
  }

  // 2. Compatible phonetic language family (strictly honoring prohibited-pair guard)
  const compatibleBases = COMPATIBLE_LANGUAGE_FALLBACKS[baseLang] ?? [];
  for (const compatBase of compatibleBases) {
    if (isForbiddenVoiceFallback(baseLang, compatBase)) continue;
    const compatMatches = voices.filter((v) => {
      const vBase = v.lang.toLowerCase().replace(/_/g, '-').split('-')[0];
      return vBase === compatBase;
    });
    if (compatMatches.length > 0) {
      let best = compatMatches[0];
      let bestScore = scoreVoiceQuality(best);
      for (let i = 1; i < compatMatches.length; i++) {
        const score = scoreVoiceQuality(compatMatches[i]);
        if (score > bestScore) {
          best = compatMatches[i];
          bestScore = score;
        }
      }
      return best;
    }
  }

  // 3. Do NOT pick a forbidden voice (e.g. English for Russian or Russian for Uzbek)
  const nonForbidden = voices.filter((v) => {
    const vBase = v.lang.toLowerCase().replace(/_/g, '-').split('-')[0];
    return !isForbiddenVoiceFallback(baseLang, vBase);
  });

  if (nonForbidden.length === 0) {
    return null;
  }

  let best = nonForbidden[0];
  let bestScore = scoreVoiceQuality(best);
  for (let i = 1; i < nonForbidden.length; i++) {
    const score = scoreVoiceQuality(nonForbidden[i]);
    if (score > bestScore) {
      best = nonForbidden[i];
      bestScore = score;
    }
  }
  return best;
}

export function selectNativeFemaleVoice(
  bcp47: string
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  return selectBestCompatibleVoice(voices, bcp47);
}

export class SpeechSyncController {
  private currentLang: string;
  private recognition: BrowserSpeechRecognition | null = null;
  private isListening = false;
  private onTranscriptCb: ((text: string) => void) | null = null;
  private onErrorCb: ((err: string) => void) | null = null;
  private activeSynthCleanup: ((fromCancel: boolean) => void) | null = null;

  constructor(initialLang = 'en-US') {
    this.currentLang = initialLang;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener?.('voiceschanged', () => {
          window.speechSynthesis.getVoices();
        });
      } catch {
        // ignore synthesis warmup errors
      }
    }
    const Ctor = getSpeechRecognitionCtor();
    if (Ctor) {
      try {
        this.recognition = new Ctor();
        this.recognition.lang = initialLang;
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
      } catch {
        this.recognition = null;
      }
    }
  }

  public getLanguage(): string {
    return this.currentLang;
  }

  public setLanguage(nextLang: string | null | undefined): void {
    if (!nextLang) return;
    const changed = nextLang !== this.currentLang;
    this.currentLang = nextLang;

    if (this.recognition) {
      this.recognition.lang = nextLang;
      if (changed && this.isListening) {
        try {
          this.recognition.stop();
        } catch {
          // ignore
        }
      }
    }
  }

  public isRecognitionSupported(): boolean {
    return getSpeechRecognitionCtor() !== null;
  }

  public startRecognition(
    onTranscript: (text: string) => void,
    onError?: (err: string) => void
  ): boolean {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return false;

    this.stopRecognition();
    this.onTranscriptCb = onTranscript;
    this.onErrorCb = onError ?? null;
    this.isListening = true;

    const rec = new Ctor();
    rec.lang = this.currentLang;
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          const rawText = res[0]?.transcript ?? '';
          handleUserMessage(rawText, (cleanText) => {
            this.onTranscriptCb?.(cleanText);
          });
        }
      }
    };

    rec.onerror = (ev) => {
      if (ev.error === 'aborted' || ev.error === 'no-speech') return;
      this.onErrorCb?.(ev.error);
    };

    rec.onend = () => {
      if (this.isListening && this.recognition === rec) {
        rec.lang = this.currentLang;
        try {
          rec.start();
        } catch {
          // ignore rapid restart errors
        }
      }
    };

    this.recognition = rec;
    try {
      rec.start();
      return true;
    } catch {
      this.recognition = null;
      this.isListening = false;
      return false;
    }
  }

  public stopRecognition(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
  }

  public speakWithSynthesis(
    text: string,
    langOverride?: string | null,
    options?: {
      rate?: number;
      pitch?: number;
      volume?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<void> {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      !text.trim()
    ) {
      return Promise.resolve();
    }

    const targetLang = langOverride || this.currentLang;
    this.cancelSynthesis();

    const rate = Math.max(0.82, Math.min(1.2, options?.rate ?? 0.96));
    const pitch = Math.max(0.88, Math.min(1.15, options?.pitch ?? 1.04));
    const volume = Math.max(0.2, Math.min(1, options?.volume ?? 1));

    return new Promise((resolve) => {
      let settled = false;
      const estimatedMs = Math.min(
        28000,
        Math.max(2200, Math.round((text.length * 88) / rate))
      );
      const startedAt = Date.now();
      let boundarySeen = false;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      const progressTimer = options?.onProgress
        ? window.setInterval(() => {
            if (settled || boundarySeen) return;
            const elapsed = Date.now() - startedAt;
            options.onProgress?.(Math.min(0.95, elapsed / Math.max(1200, estimatedMs * 0.72)));
          }, 180)
        : null;

      let safetyTimer = 0;

      const finish = (fromCancel: boolean) => {
        if (settled) return;
        settled = true;
        if (this.activeSynthCleanup === finish) {
          this.activeSynthCleanup = null;
        }
        window.clearTimeout(safetyTimer);
        if (progressTimer !== null) window.clearInterval(progressTimer);
        utterance.onend = null;
        utterance.onerror = null;
        utterance.onboundary = null;
        if (!fromCancel) {
          options?.onProgress?.(1);
        }
        resolve();
      };

      this.activeSynthCleanup = finish;
      safetyTimer = window.setTimeout(() => finish(false), estimatedMs);

      if (options?.onProgress) {
        utterance.onboundary = (ev) => {
          if (settled || typeof ev.charIndex !== 'number') return;
          boundarySeen = true;
          options.onProgress?.(Math.min(1, Math.max(0, ev.charIndex / Math.max(1, text.length))));
        };
      }

      utterance.onend = () => finish(false);
      utterance.onerror = () => finish(false);
      try {
        try {
          const voice = selectNativeFemaleVoice(targetLang);
          if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang || targetLang;
          }
        } catch {
          // fall back to utterance.lang default voice
        }
        window.speechSynthesis.speak(utterance);
      } catch {
        finish(false);
      }
    });
  }

  public cancelSynthesis(): void {
    const cleanup = this.activeSynthCleanup;
    this.activeSynthCleanup = null;
    cleanup?.(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
