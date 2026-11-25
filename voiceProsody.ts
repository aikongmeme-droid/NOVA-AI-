import {
  getEmotionSpec,
  inferEmotionFromText,
  type EmotionCategory,
} from './emotions';
import {
  getPersonalityArchetypeSpec,
  type ConversationalStyleProfile,
  type MoodTrajectory,
  type PersonalityArchetypeId,
  type PersonalityTraits,
  type UserMoodState,
} from './personality';

export type IntonationArc =
  | 'warm-rising'
  | 'gentle-falling'
  | 'curious-upward'
  | 'lively-expressive'
  | 'grounded-steady'
  | 'tender-soft';

export type PauseCadence = 'spacious' | 'reflective' | 'conversational' | 'brisk';

export interface VoiceProsodyProfile {
  emotionId: string;
  emotionCategory: EmotionCategory;
  speakingRate: number;
  wavPlaybackRate: number;
  pitchShift: number;
  intonationArc: IntonationArc;
  pauseCadence: PauseCadence;
  energyLevel: number;
  videoPlaybackRate: number;
  videoTransitionMs: number;
  ttsStyleDirective: string;
}

export interface EmotionTimelineCue {
  emotionId: string;
  atProgress: number; // 0..1 fraction of spoken playback
  transitionMs: number;
  prosody: VoiceProsodyProfile;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const CATEGORY_PROSODY_BASE: Record<
  EmotionCategory,
  {
    rate: number;
    pitch: number;
    energy: number;
    arc: IntonationArc;
    cadence: PauseCadence;
    videoRate: number;
    transitionMs: number;
    cueText: string;
  }
> = {
  greeting: {
    rate: 1.01,
    pitch: 1.04,
    energy: 0.72,
    arc: 'warm-rising',
    cadence: 'conversational',
    videoRate: 1.0,
    transitionMs: 480,
    cueText: 'Warm rising greeting inflection, welcoming smile in the voice',
  },
  listening: {
    rate: 0.96,
    pitch: 1.0,
    energy: 0.5,
    arc: 'grounded-steady',
    cadence: 'conversational',
    videoRate: 0.96,
    transitionMs: 550,
    cueText: 'Attentive, grounded, receptive cadence',
  },
  thinking: {
    rate: 0.92,
    pitch: 0.99,
    energy: 0.45,
    arc: 'grounded-steady',
    cadence: 'reflective',
    videoRate: 0.92,
    transitionMs: 600,
    cueText: 'Measured, articulate, thoughtful cadence with slight reflective pauses',
  },
  joy: {
    rate: 1.08,
    pitch: 1.06,
    energy: 0.88,
    arc: 'lively-expressive',
    cadence: 'brisk',
    videoRate: 1.05,
    transitionMs: 380,
    cueText: 'Bright, buoyant upward pitch movement and lively joyful tempo',
  },
  laughter: {
    rate: 1.11,
    pitch: 1.07,
    energy: 0.92,
    arc: 'lively-expressive',
    cadence: 'brisk',
    videoRate: 1.06,
    transitionMs: 340,
    cueText: 'Sparkling amused pitch lift, smiling resonance, nimble lighthearted rhythm',
  },
  surprise: {
    rate: 1.06,
    pitch: 1.06,
    energy: 0.84,
    arc: 'curious-upward',
    cadence: 'conversational',
    videoRate: 1.04,
    transitionMs: 320,
    cueText: 'Expressive upward surprise contour with crisp vocal onset',
  },
  empathy: {
    rate: 0.88,
    pitch: 0.95,
    energy: 0.34,
    arc: 'tender-soft',
    cadence: 'spacious',
    videoRate: 0.9,
    transitionMs: 740,
    cueText: 'Unrushed, soft chest warmth, gentle falling cadence with comforting breath pauses',
  },
  sadness: {
    rate: 0.85,
    pitch: 0.93,
    energy: 0.25,
    arc: 'gentle-falling',
    cadence: 'spacious',
    videoRate: 0.88,
    transitionMs: 800,
    cueText: 'Quiet, tender, lowered pitch and unhurried empathetic phrasing with soft pauses',
  },
  curiosity: {
    rate: 1.02,
    pitch: 1.04,
    energy: 0.68,
    arc: 'curious-upward',
    cadence: 'conversational',
    videoRate: 1.01,
    transitionMs: 440,
    cueText: 'Inquisitive, engaged upward inflection toward key questions',
  },
  smile: {
    rate: 1.0,
    pitch: 1.02,
    energy: 0.6,
    arc: 'warm-rising',
    cadence: 'conversational',
    videoRate: 1.0,
    transitionMs: 520,
    cueText: 'Natural relaxed conversational smile, balanced pitch and smooth phrasing',
  },
  affection: {
    rate: 0.91,
    pitch: 0.97,
    energy: 0.48,
    arc: 'tender-soft',
    cadence: 'spacious',
    videoRate: 0.93,
    transitionMs: 680,
    cueText: 'Intimate, tender, softly lingering warmth with gentle phrasing',
  },
  playful: {
    rate: 1.07,
    pitch: 1.05,
    energy: 0.8,
    arc: 'lively-expressive',
    cadence: 'brisk',
    videoRate: 1.04,
    transitionMs: 380,
    cueText: 'Bouncy, playfully teasing melodic variation and crisp timing',
  },
  confidence: {
    rate: 0.98,
    pitch: 0.98,
    energy: 0.72,
    arc: 'grounded-steady',
    cadence: 'conversational',
    videoRate: 0.98,
    transitionMs: 460,
    cueText: 'Assured, steady, clear resonance with confident downward sentence endings',
  },
  calm: {
    rate: 0.89,
    pitch: 0.96,
    energy: 0.36,
    arc: 'gentle-falling',
    cadence: 'spacious',
    videoRate: 0.9,
    transitionMs: 720,
    cueText: 'Soothing, unhurried, serene tone with soft unforced exhales',
  },
};

export function resolveVoiceProsody(params: {
  emotionId?: string | null;
  userMood?: UserMoodState;
  trajectory?: MoodTrajectory;
  valence?: number;
  arousal?: number;
  archetypeId?: PersonalityArchetypeId | string | null;
  traits?: Partial<PersonalityTraits> | null;
  profile?: Partial<ConversationalStyleProfile> | null;
}): VoiceProsodyProfile {
  const emotion = getEmotionSpec(params.emotionId);
  const base = CATEGORY_PROSODY_BASE[emotion.category];

  const userMood = params.profile?.mood ?? params.userMood ?? 'neutral';
  const trajectory = params.profile?.trajectory ?? params.trajectory ?? 'steady';
  const valence = params.profile?.valence ?? params.valence ?? 0;
  const arousal = params.profile?.arousal ?? params.arousal ?? 0.4;
  const archetype = getPersonalityArchetypeSpec(
    params.profile?.archetypeId ?? params.archetypeId
  );

  const traits = params.profile?.traits ?? params.traits;
  const traitEnergy = typeof traits?.energy === 'number' ? traits.energy : 55;
  const traitWarmth = typeof traits?.warmth === 'number' ? traits.warmth : 65;
  const traitPlayfulness = typeof traits?.playfulness === 'number' ? traits.playfulness : 50;

  let rate = base.rate;
  let pitch = base.pitch;
  let energy = base.energy;
  let videoRate = base.videoRate;
  let transitionMs = base.transitionMs;
  let arc = base.arc;
  let cadence = base.cadence;

  // Fine-grained emotion-specific micro-adjustments
  if (emotion.id === 'fallingasleep' || emotion.id === 'silentcrying' || emotion.id === 'tearsofpain') {
    rate -= 0.03;
    pitch -= 0.02;
    energy -= 0.08;
    videoRate -= 0.02;
    transitionMs += 80;
  } else if (emotion.id === 'euphoria0' || emotion.id === 'excited0' || emotion.id === 'biglaugh') {
    rate += 0.03;
    pitch += 0.02;
    energy += 0.06;
    videoRate += 0.02;
    transitionMs -= 30;
  } else if (emotion.id === 'adjustingglasses') {
    rate = 0.95;
    pitch = 1.0;
    cadence = 'reflective';
  }

  // Personality archetype nuance
  if (archetype.id === 'caring_confidante') {
    rate -= 0.03;
    pitch -= 0.015;
    transitionMs += 70;
  } else if (archetype.id === 'energetic_cheerleader') {
    rate += 0.04;
    pitch += 0.02;
    energy += 0.08;
    transitionMs -= 40;
  } else if (archetype.id === 'witty_friend') {
    rate += 0.02;
    pitch += 0.01;
  } else if (archetype.id === 'curious_learner') {
    pitch += 0.015;
    if (arc === 'grounded-steady') arc = 'curious-upward';
  }

  // Learned user traits subtle drift (-0.03 .. +0.03)
  rate += ((traitEnergy - 55) / 45) * 0.025;
  pitch += ((traitPlayfulness - 50) / 50) * 0.012 - ((traitWarmth - 65) / 50) * 0.008;

  // Real-time mood & trajectory safety: distressed or declining turns soften cadence immediately
  const isSensitiveContext =
    userMood === 'distressed' ||
    userMood === 'melancholic' ||
    userMood === 'anxious' ||
    trajectory === 'declining' ||
    valence <= -0.45;

  if (isSensitiveContext) {
    rate = Math.min(rate, 0.92);
    pitch = Math.min(pitch, 0.98);
    energy = Math.min(energy, 0.42);
    videoRate = Math.min(videoRate, 0.93);
    transitionMs = Math.max(transitionMs, 680);
    arc = emotion.category === 'sadness' ? 'gentle-falling' : 'tender-soft';
    cadence = 'spacious';
  } else if (arousal >= 0.72 && valence >= 0.35) {
    rate += 0.02;
    pitch += 0.01;
    energy += 0.06;
  }

  const finalRate = round2(clamp(rate, 0.84, 1.15));
  const finalPitch = round2(clamp(pitch, 0.91, 1.09));
  const finalEnergy = round2(clamp(energy, 0.18, 0.98));
  const finalVideoRate = round2(clamp(videoRate, 0.86, 1.08));
  const finalTransitionMs = Math.round(clamp(transitionMs, 280, 900));

  // Subtle PCM WAV playbackRate range stays ultra-natural (no chipmunking) since Gemini TTS already renders prosody
  const wavPlaybackRate = round2(clamp(1 + (finalRate - 1) * 0.28, 0.95, 1.05));

  const pitchPercent = Math.round((finalPitch - 1) * 100);
  const pitchDesc =
    pitchPercent >= 2
      ? `bright expressive lift (+${pitchPercent}% pitch)`
      : pitchPercent <= -2
        ? `warm grounded depth (${pitchPercent}% pitch)`
        : 'balanced natural pitch';

  const rateDesc =
    finalRate >= 1.06
      ? `lively upbeat pace (${finalRate}x)`
      : finalRate <= 0.91
        ? `unhurried tender pace (${finalRate}x)`
        : `natural conversational pace (${finalRate}x)`;

  const ttsStyleDirective = [
    emotion.voiceStyle,
    base.cueText,
    `Vocal delivery: ${rateDesc}, ${pitchDesc}, intonation: ${arc}, pauses: ${cadence}`,
    params.profile?.ttsStyleDirective || archetype.ttsDirective,
  ]
    .filter(Boolean)
    .join('. ');

  return {
    emotionId: emotion.id,
    emotionCategory: emotion.category,
    speakingRate: finalRate,
    wavPlaybackRate,
    pitchShift: finalPitch,
    intonationArc: arc,
    pauseCadence: cadence,
    energyLevel: finalEnergy,
    videoPlaybackRate: finalVideoRate,
    videoTransitionMs: finalTransitionMs,
    ttsStyleDirective,
  };
}

function splitReplySentences(replyText: string): string[] {
  const clean = replyText.trim();
  if (!clean) return [];
  const parts = clean
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [clean];
}

export function buildEmotionTimeline(params: {
  replyText: string;
  primaryEmotionId?: string | null;
  secondaryEmotionId?: string | null;
  profile?: Partial<ConversationalStyleProfile> | null;
  archetypeId?: PersonalityArchetypeId | string | null;
}): EmotionTimelineCue[] {
  const primarySpec = getEmotionSpec(params.primaryEmotionId);
  const primaryProsody = resolveVoiceProsody({
    emotionId: primarySpec.id,
    profile: params.profile,
    archetypeId: params.archetypeId,
  });

  const cues: EmotionTimelineCue[] = [
    {
      emotionId: primarySpec.id,
      atProgress: 0,
      transitionMs: primaryProsody.videoTransitionMs,
      prosody: primaryProsody,
    },
  ];

  const sentences = splitReplySentences(params.replyText);
  const totalChars = sentences.reduce((acc, s) => acc + s.length, 0);

  if (sentences.length >= 2 && totalChars > 0) {
    let accumulated = sentences[0].length;
    for (let i = 1; i < sentences.length; i++) {
      const sentence = sentences[i];
      const progress = round2(clamp(accumulated / totalChars, 0.18, 0.86));
      accumulated += sentence.length;

      const inferred = inferEmotionFromText(sentence, 'assistant');
      const lastCue = cues[cues.length - 1];

      let nextEmotionId: string | null = null;
      if (inferred.id !== 'friendlysmile' && inferred.id !== lastCue.emotionId) {
        nextEmotionId = inferred.id;
      } else if (
        i === Math.floor(sentences.length / 2) &&
        params.secondaryEmotionId?.trim()
      ) {
        const sec = getEmotionSpec(params.secondaryEmotionId);
        if (sec.id !== lastCue.emotionId) {
          nextEmotionId = sec.id;
        }
      }

      if (nextEmotionId && cues.length < 4) {
        const prosody = resolveVoiceProsody({
          emotionId: nextEmotionId,
          profile: params.profile,
          archetypeId: params.archetypeId,
        });
        cues.push({
          emotionId: nextEmotionId,
          atProgress: progress,
          transitionMs: prosody.videoTransitionMs,
          prosody,
        });
      }
    }
  }

  // Fallback secondary cue if explicit secondaryEmotionId wasn't placed by sentence boundaries
  if (cues.length === 1 && params.secondaryEmotionId?.trim()) {
    const sec = getEmotionSpec(params.secondaryEmotionId);
    if (sec.id !== primarySpec.id) {
      const prosody = resolveVoiceProsody({
        emotionId: sec.id,
        profile: params.profile,
        archetypeId: params.archetypeId,
      });
      cues.push({
        emotionId: sec.id,
        atProgress: 0.55,
        transitionMs: prosody.videoTransitionMs,
        prosody,
      });
    }
  }

  return cues;
}
