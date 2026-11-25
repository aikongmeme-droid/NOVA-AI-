import { getEmotionSpec } from './emotions';

export type UserMoodState =
  | 'distressed'
  | 'anxious'
  | 'melancholic'
  | 'frustrated'
  | 'playful'
  | 'curious'
  | 'celebratory'
  | 'affectionate'
  | 'reflective'
  | 'neutral';

export type MoodTrajectory = 'improving' | 'declining' | 'steady' | 'volatile';

export type PersonalityArchetypeId =
  | 'adaptive'
  | 'witty_friend'
  | 'caring_confidante'
  | 'curious_learner'
  | 'energetic_cheerleader';

export interface PersonalityTraits {
  warmth: number; // 0..100
  playfulness: number; // 0..100
  curiosity: number; // 0..100
  energy: number; // 0..100
  interactionsCount: number;
}

export interface PersonalityArchetypeSpec {
  id: PersonalityArchetypeId;
  label: string;
  tagline: string;
  preferredVoice: 'Kore' | 'Zephyr' | 'Aoede' | 'Leda';
  idleEmotion: string;
  thinkingEmotions: string[];
  listeningEmotions: string[];
  signatureEmotions: string[];
  promptDirective: string;
  ttsDirective: string;
}

export const DEFAULT_PERSONALITY_TRAITS: PersonalityTraits = {
  warmth: 65,
  playfulness: 50,
  curiosity: 58,
  energy: 55,
  interactionsCount: 0,
};

export const PERSONALITY_ARCHETYPES: readonly PersonalityArchetypeSpec[] = [
  {
    id: 'adaptive',
    label: 'Natural Blend',
    tagline: 'Adapts organically to your mood and evolves over time',
    preferredVoice: 'Kore',
    idleEmotion: 'friendlysmile',
    thinkingEmotions: ['readingthoughtfully', 'thoughtfulteflection'],
    listeningEmotions: ['activelistening', 'warmsmile0', 'gentlehappiness'],
    signatureEmotions: [
      'friendlysmile',
      'warmwelcome',
      'warmsmile0',
      'activelistening',
      'genuinecuriosity',
      'naturallaughter',
    ],
    promptDirective:
      'Balance warmth, natural wit, curiosity, and emotional attunement organically based on the user’s mood and your shared history.',
    ttsDirective: 'Natural, expressive, emotionally responsive female voice',
  },
  {
    id: 'witty_friend',
    label: 'Witty Friend',
    tagline: 'Playful banter, clever humor, upbeat warmth',
    preferredVoice: 'Zephyr',
    idleEmotion: 'playfulsmile',
    thinkingEmotions: ['mischievoussmile', 'Intriguedexpression'],
    listeningEmotions: ['amusedreaction', 'playfulsmile', 'lightlaugh0'],
    signatureEmotions: [
      'playfulsmile',
      'naturallaughter',
      'lightlaugh0',
      'amusedreaction',
      'playfulteasing',
      'mischievoussmile',
      'wittyconfidence',
      'contagiouslaughter',
    ],
    promptDirective:
      'Lean into clever, warm humor, playful teasing, nimble banter, and lighthearted metaphors — while staying genuinely kind and dropping into sincere softness if the user is hurting.',
    ttsDirective: 'Bright, playfully amused, nimble female voice with warm chuckle sparkle',
  },
  {
    id: 'caring_confidante',
    label: 'Caring Confidante',
    tagline: 'Deeply empathetic, calm, gentle emotional anchor',
    preferredVoice: 'Kore',
    idleEmotion: 'softsmile0',
    thinkingEmotions: ['reflectivelistening0', 'thoughtfulteflection'],
    listeningEmotions: ['empatheticunderstanding', 'softsmile0', 'relaxedcomfort'],
    signatureEmotions: [
      'deepempathy',
      'compassionateexpression',
      'empatheticunderstanding',
      'gentleconcern',
      'softsmile0',
      'relaxedcomfort',
      'gratefulwarmth',
      'relief0',
    ],
    promptDirective:
      'Prioritize deep emotional safety, gentle unhurried pacing, attentive validation, and tender reassurance like a trusted close confidante.',
    ttsDirective: 'Soft, tender, soothing, unhurried female voice with calm emotional warmth',
  },
  {
    id: 'curious_learner',
    label: 'Curious Learner',
    tagline: 'Thoughtful explorer, sharp insights, language coach',
    preferredVoice: 'Kore',
    idleEmotion: 'thoughtfulInterest',
    thinkingEmotions: ['adjustingglasses', 'thoughtfulteflection'],
    listeningEmotions: ['genuinecuriosity', 'Intriguedexpression', 'thoughtfulInterest'],
    signatureEmotions: [
      'genuinecuriosity',
      'Intriguedexpression',
      'thoughtfulInterest',
      'adjustingglasses',
      'exciteddiscovery',
      'understandingealization',
      'confusedbutcurious',
    ],
    promptDirective:
      'Stay genuinely fascinated by ideas, nuances, cultures, and languages — ask insightful follow-up questions, explain clearly with vivid examples, and delight in learning alongside the user.',
    ttsDirective: 'Articulate, curious, engaged female voice with expressive inquisitive lift',
  },
  {
    id: 'energetic_cheerleader',
    label: 'Bright Cheerleader',
    tagline: 'Uplifting, enthusiastic, motivating spark',
    preferredVoice: 'Zephyr',
    idleEmotion: 'genuinehappiness',
    thinkingEmotions: ['excited0', 'understandingealization'],
    listeningEmotions: ['genuinehappiness', 'bigsmile0', 'reassuringconfidence'],
    signatureEmotions: [
      'genuinehappiness',
      'clappinghands',
      'proudhappiness',
      'heartfeltjoy',
      'delighted0',
      'reassuringconfidence',
      'excited0',
      'bigsmile0',
    ],
    promptDirective:
      'Bring uplifting momentum, genuine encouragement, and celebratory energy — spot strengths, champion small wins, and inspire confidence without sounding fake.',
    ttsDirective: 'Vibrant, uplifting, encouraging female voice with radiant warmth',
  },
];

export function normalizePersonalityArchetype(
  raw?: string | null
): PersonalityArchetypeId {
  const cleaned = (raw ?? '').trim().toLowerCase();
  const match = PERSONALITY_ARCHETYPES.find((a) => a.id === cleaned);
  return match ? match.id : 'adaptive';
}

export function getPersonalityArchetypeSpec(
  id?: string | null
): PersonalityArchetypeSpec {
  const normalized = normalizePersonalityArchetype(id);
  return (
    PERSONALITY_ARCHETYPES.find((a) => a.id === normalized) ??
    PERSONALITY_ARCHETYPES[0]
  );
}

function clampTrait(value: unknown, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function parsePersonalityTraits(
  raw?: string | Partial<PersonalityTraits> | null
): PersonalityTraits {
  if (!raw) return { ...DEFAULT_PERSONALITY_TRAITS };
  let obj: Partial<PersonalityTraits> | null = null;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw) as Partial<PersonalityTraits>;
    } catch {
      obj = null;
    }
  } else if (typeof raw === 'object') {
    obj = raw;
  }
  if (!obj) return { ...DEFAULT_PERSONALITY_TRAITS };
  return {
    warmth: clampTrait(obj.warmth, DEFAULT_PERSONALITY_TRAITS.warmth),
    playfulness: clampTrait(obj.playfulness, DEFAULT_PERSONALITY_TRAITS.playfulness),
    curiosity: clampTrait(obj.curiosity, DEFAULT_PERSONALITY_TRAITS.curiosity),
    energy: clampTrait(obj.energy, DEFAULT_PERSONALITY_TRAITS.energy),
    interactionsCount: Math.max(
      0,
      Math.round(Number.isFinite(Number(obj.interactionsCount)) ? Number(obj.interactionsCount) : 0)
    ),
  };
}

export interface TurnSentimentSignal {
  mood: UserMoodState;
  valence: number; // -1.0 (deep negative) to +1.0 (high positive)
  arousal: number; // 0.0 (calm/low energy) to 1.0 (intense/high energy)
  intensity: number; // 0.0 to 1.0
  cues: string[];
}

export interface ConversationalStyleProfile {
  archetypeId: PersonalityArchetypeId;
  archetypeLabel: string;
  traits: PersonalityTraits;
  preferredVoice: 'Kore' | 'Zephyr' | 'Aoede' | 'Leda';
  mood: UserMoodState;
  previousMood: UserMoodState | null;
  trajectory: MoodTrajectory;
  valence: number;
  arousal: number;
  styleName: string;
  pacingGuidance: string;
  empathyStrategy: string;
  recommendedEmotions: string[];
  idleEmotion: string;
  listeningEmotion: string;
  thinkingEmotion: string;
  ttsStyleDirective: string;
}

interface MoodRule {
  mood: UserMoodState;
  pattern: RegExp;
  valence: number;
  arousal: number;
  weight: number;
  cueLabel: string;
}

const MOOD_RULES: readonly MoodRule[] = [
  {
    mood: 'distressed',
    pattern:
      /(не выдерживаю|сломал[ао]?сь|срыв|рыдаю|плачу|разбито сердце|потерял[аи]?|горе|жить не хочется|безнадеж|отчаяни|ужасно плохо|heartbreak|breakup|broke down|crying|sobbing|tears|overwhelmed|hopeless|devastated|grief|can't take it|😭|😢|💔)/i,
    valence: -0.9,
    arousal: 0.78,
    weight: 4,
    cueLabel: 'distress_signal',
  },
  {
    mood: 'anxious',
    pattern:
      /(тревож|волнуюсь|боюсь|страшно|паник|переживаю|нервнича|стресс|не знаю что делать|растерян|anxious|worried|scared|nervous|stressed|panic|afraid|terrified|uncertain|xavotir|qo'rq|😰|😨|😟)/i,
    valence: -0.58,
    arousal: 0.75,
    weight: 3,
    cueLabel: 'anxiety_signal',
  },
  {
    mood: 'frustrated',
    pattern:
      /(бесит|раздражает|достал[оа]?|ненавижу|несправедлив|злюсь|злость|тупо|провал|ничего не получается|задолбал|frustrated|angry|furious|annoyed|unfair|hate this|fed up|stuck|ugh|asabiy|😤|😡|🤬)/i,
    valence: -0.68,
    arousal: 0.82,
    weight: 3,
    cueLabel: 'frustration_signal',
  },
  {
    mood: 'melancholic',
    pattern:
      /(грустн|печаль|одинок|тоск|пустота|устал[аи]?|выгорел|нет сил|разочарован|скучно|плохо на душе|sad|lonely|melancholy|empty|exhausted|burned out|tired|disappointed|down|blue|xafa|charchadim|triste|üzgün|😔|😞|🥀)/i,
    valence: -0.52,
    arousal: 0.25,
    weight: 2.5,
    cueLabel: 'melancholy_signal',
  },
  {
    mood: 'celebratory',
    pattern:
      /(ура|победа|выиграл|сдал[аи]?|получилось|сбылось|поздрав|восторг|невероятно|супер|отлично|круто|счастлив|горжусь|yay|won|passed|nailed it|achieved|celebrat|ecstatic|thrilled|proud|amazing news|awesome|tabriklayman|xursand|zo'r|harika|🎉|🥳|🏆|✨)/i,
    valence: 0.88,
    arousal: 0.85,
    weight: 3,
    cueLabel: 'celebration_signal',
  },
  {
    mood: 'playful',
    pattern:
      /(ахах|хаха|хихи|хехе|ржу|шутк|прикол|подкол|дурачим|спорим|хитро|haha|hehe|lol|lmao|funny|joke|teas|hilarious|jaja|kulgi|hazil|😂|🤣|😜|😏)/i,
    valence: 0.72,
    arousal: 0.68,
    weight: 2.8,
    cueLabel: 'playful_humor',
  },
  {
    mood: 'affectionate',
    pattern:
      /(люблю|обожаю|скучаю|спасибо|благодар|ты лучшая|ты настоящая|дорог[ао]|родн|солнце|милая|красивая|комплимент|love you|miss you|thank you|thanks|grateful|appreciate you|sweet|darling|rahmat|gracias|teşekkür|❤️|🥹|🥰|💖)/i,
    valence: 0.8,
    arousal: 0.45,
    weight: 2.6,
    cueLabel: 'affection_warmth',
  },
  {
    mood: 'reflective',
    pattern:
      /(смысл жизни|философ|задумал|размышляю|вспоминаю|душа|время летит|мечтаю|будущее|предназнач|тишина|ночью|spokojn|goodnight|meaning of life|reflect|ponder|deep down|philosophy|memories|soul|nostalg)/i,
    valence: 0.1,
    arousal: 0.22,
    weight: 2.2,
    cueLabel: 'reflective_depth',
  },
  {
    mood: 'curious',
    pattern:
      /(почему|зачем|как работает|как сказать|расскажи|объясни|проверь|интересно|любопытно|что думаешь|why|how does|tell me|explain|curious|fascinating|wonder|what if|check my|pronunciation|grammar|nima uchun|qanday|tushuntir)/i,
    valence: 0.3,
    arousal: 0.52,
    weight: 2,
    cueLabel: 'curiosity_inquiry',
  },
];

const STYLE_PRESETS: Record<
  UserMoodState,
  Pick<
    ConversationalStyleProfile,
    'styleName' | 'pacingGuidance' | 'empathyStrategy' | 'recommendedEmotions' | 'ttsStyleDirective'
  >
> = {
  distressed: {
    styleName: 'Tender Grounding Companion',
    pacingGuidance:
      'Slow down noticeably. Use short, gentle, uncluttered sentences with breathing room. Avoid overwhelming advice right away.',
    empathyStrategy:
      'Acknowledge and validate their pain first with sincere presence, let them feel heard without rushing to fix everything, and offer soft grounding comfort.',
    recommendedEmotions: [
      'deepempathy',
      'compassionatesadness0',
      'compassionateexpression',
      'suppressedtears',
      'empatheticunderstanding',
      'gentleconcern',
    ],
    ttsStyleDirective:
      'Very soft, tender, unhurried compassionate voice with gentle pauses and protective warmth',
  },
  anxious: {
    styleName: 'Calm Reassuring Anchor',
    pacingGuidance:
      'Keep a steady, calm, measured cadence. Break thoughts into clear, manageable steps so the user feels anchored rather than rushed.',
    empathyStrategy:
      'Normalize their worry gently, calm the immediate tension, and offer steady, practical reassurance that they do not have to carry it alone.',
    recommendedEmotions: [
      'gentleconcern',
      'empatheticunderstanding',
      'reassuringconfidence',
      'relief0',
      'relaxedcomfort',
    ],
    ttsStyleDirective:
      'Steady, soothing, calm and reassuring female voice that grounds tension',
  },
  frustrated: {
    styleName: 'Steady Non-Judgmental Ally',
    pacingGuidance:
      'Clear, composed, respectful rhythm. Never sound overly chipper or dismissive of their frustration.',
    empathyStrategy:
      'Validate why the situation feels unfair or exhausting BEFORE suggesting any next step; stand solidly on their side like a loyal friend.',
    recommendedEmotions: [
      'empatheticunderstanding',
      'reflectivelistening0',
      'deepempathy',
      'reassuringconfidence',
      'understandingealization',
    ],
    ttsStyleDirective:
      'Composed, grounded, empathetic ally voice — attentive and sincere without forced cheerfulness',
  },
  melancholic: {
    styleName: 'Warm Quiet Confidante',
    pacingGuidance:
      'Gentle, low-pressure, cozy tone with unhurried pacing. Leave room for quiet reflection without forcing high energy.',
    empathyStrategy:
      'Sit gently beside their tiredness or loneliness, remind them warmly that they matter, and invite small, effortless sharing.',
    recommendedEmotions: [
      'compassionateexpression',
      'deepsadness',
      'gentlesmile0',
      'softsmile0',
      'relaxedcomfort',
      'fallingasleep',
    ],
    ttsStyleDirective:
      'Quiet, warm, cozy and unhurried intimate voice with gentle tenderness',
  },
  celebratory: {
    styleName: 'Radiant Celebrating Friend',
    pacingGuidance:
      'Vibrant, expressive, lively energy that genuinely matches their excitement and pride.',
    empathyStrategy:
      'Celebrate their win wholeheartedly, highlight the effort or milestone behind it, and amplify their joy authentically.',
    recommendedEmotions: [
      'clappinghands',
      'proudhappiness',
      'euphoria0',
      'delighted0',
      'heartfeltjoy',
      'happysurprise',
      'excited0',
    ],
    ttsStyleDirective:
      'Bright, joyful, genuinely excited and proud female voice with celebratory sparkle',
  },
  playful: {
    styleName: 'Witty Playful Banter',
    pacingGuidance:
      'Light, nimble, rhythmic phrasing with playful timing and conversational sparkle.',
    empathyStrategy:
      'Match their humor, laugh warmly with them, weave in gentle witty teasing, and keep the chemistry lively and spontaneous.',
    recommendedEmotions: [
      'naturallaughter',
      'biglaugh',
      'lightlaugh0',
      'contagiouslaughter',
      'amusedreaction',
      'playfulteasing',
      'mischievoussmile',
      'sillyexcitement',
      'wittyconfidence',
    ],
    ttsStyleDirective:
      'Lighthearted, smiling, playful and lightly amused voice with natural chuckle warmth',
  },
  affectionate: {
    styleName: 'Heartfelt Close Friend',
    pacingGuidance:
      'Warm, open-hearted, smooth phrasing with sincere personal appreciation.',
    empathyStrategy:
      'Receive and reciprocate warmth gracefully, remember shared details or names warmly, and express genuine appreciation.',
    recommendedEmotions: [
      'gratefulwarmth',
      'deepaffection',
      'blushing0',
      'warmsmile0',
      'gentlehappiness',
      'lovingeyes',
      'shyattraction',
    ],
    ttsStyleDirective:
      'Sincere, tender, warmly smiling female voice full of genuine closeness and gratitude',
  },
  reflective: {
    styleName: 'Thoughtful Late-Night Thinker',
    pacingGuidance:
      'Unhurried, contemplative, evocative rhythm with space for nuance and meaning.',
    empathyStrategy:
      'Explore the deeper layer behind their thought, reflect honestly, and ask one resonant question that invites deeper perspective.',
    recommendedEmotions: [
      'thoughtfulteflection',
      'reflectivelistening0',
      'understandingealization',
      'thoughtfulInterest',
      'content0',
      'gentlesmile0',
    ],
    ttsStyleDirective:
      'Softly introspective, thoughtful, unhurried conversational voice with warm depth',
  },
  curious: {
    styleName: 'Engaged Insightful Explorer',
    pacingGuidance:
      'Crisp, clear, enthusiastic articulation — structured when explaining, curious when exploring.',
    empathyStrategy:
      'Reward their curiosity, explain concepts vividly like a clever friend (or native-speaker coach when practicing language), and spark the next discovery.',
    recommendedEmotions: [
      'genuinecuriosity',
      'Intriguedexpression',
      'thoughtfulInterest',
      'adjustingglasses',
      'exciteddiscovery',
      'confusedbutcurious',
      'understandingealization',
    ],
    ttsStyleDirective:
      'Curious, articulate, warmly engaging voice with expressive inquisitive lift',
  },
  neutral: {
    styleName: 'Warm Everyday Companion',
    pacingGuidance:
      'Natural, relaxed, friendly conversational flow — balanced energy, genuinely attentive.',
    empathyStrategy:
      'Be present, reference relevant context from earlier turns or saved memories naturally, and ask a thoughtful follow-up.',
    recommendedEmotions: [
      'friendlysmile',
      'warmwelcome',
      'warmsmile0',
      'activelistening',
      'softsmile0',
      'content0',
      'bigsmile0',
    ],
    ttsStyleDirective:
      'Natural, warm, conversational female voice — relaxed, sincere, and attentive',
  },
};

export function analyzeTurnSentiment(text: string): TurnSentimentSignal {
  const clean = text.trim();
  if (!clean) {
    return { mood: 'neutral', valence: 0, arousal: 0.3, intensity: 0, cues: [] };
  }

  const scores = new Map<UserMoodState, number>();
  const cues: string[] = [];
  let weightedValence = 0;
  let weightedArousal = 0;
  let totalWeight = 0;

  for (const rule of MOOD_RULES) {
    if (rule.pattern.test(clean)) {
      const current = scores.get(rule.mood) ?? 0;
      scores.set(rule.mood, current + rule.weight);
      cues.push(rule.cueLabel);
      weightedValence += rule.valence * rule.weight;
      weightedArousal += rule.arousal * rule.weight;
      totalWeight += rule.weight;
    }
  }

  const exclamations = (clean.match(/!/g) || []).length;
  const questions = (clean.match(/\?/g) || []).length;
  const ellipses = (clean.match(/\.\.\.|…/g) || []).length;

  if (questions > 0 && !scores.has('curious')) {
    scores.set('curious', (scores.get('curious') ?? 0) + 1.2);
    cues.push('question_prompt');
  }

  let dominantMood: UserMoodState = 'neutral';
  let topScore = 0;
  for (const [mood, score] of scores.entries()) {
    if (score > topScore) {
      topScore = score;
      dominantMood = mood;
    }
  }

  let valence = totalWeight > 0 ? weightedValence / totalWeight : 0;
  let arousal = totalWeight > 0 ? weightedArousal / totalWeight : 0.35;

  if (exclamations >= 2) {
    arousal = Math.min(1, arousal + 0.15);
    cues.push('high_emphasis');
  }
  if (ellipses >= 1 && valence <= 0) {
    arousal = Math.max(0.1, arousal - 0.12);
    cues.push('trailing_pause');
  }

  const intensity = Math.min(1, Math.max(0.15, topScore / 4));

  return {
    mood: dominantMood,
    valence: Math.round(valence * 100) / 100,
    arousal: Math.round(arousal * 100) / 100,
    intensity: Math.round(intensity * 100) / 100,
    cues,
  };
}

/**
 * Gradually evolves NOVA's persistent personality traits over time based on user interactions.
 * User behavior organically nudges warmth, playfulness, curiosity, and energy within [0, 100].
 */
export function evolvePersonalityTraits(
  current: PersonalityTraits,
  signal: TurnSentimentSignal,
  userText?: string | null
): PersonalityTraits {
  const next: PersonalityTraits = { ...current, interactionsCount: current.interactionsCount + 1 };
  const text = (userText ?? '').trim();

  let dWarmth = 0;
  let dPlay = 0;
  let dCuriosity = 0;
  let dEnergy = 0;

  switch (signal.mood) {
    case 'distressed':
    case 'melancholic':
    case 'anxious':
      dWarmth += 3;
      dPlay -= 2;
      dEnergy -= 2;
      break;
    case 'frustrated':
      dWarmth += 2;
      dPlay -= 1;
      break;
    case 'affectionate':
      dWarmth += 3;
      dPlay += 1;
      break;
    case 'playful':
      dPlay += 4;
      dEnergy += 2;
      break;
    case 'celebratory':
      dEnergy += 3;
      dWarmth += 2;
      dPlay += 1;
      break;
    case 'curious':
      dCuriosity += 3;
      break;
    case 'reflective':
      dCuriosity += 2;
      dWarmth += 1;
      dEnergy -= 2;
      break;
    default:
      break;
  }

  if (text.includes('?')) dCuriosity += 1;
  if (text.includes('!')) dEnergy += 1;
  if (/be more (funny|playful|witty)|шут|повесел/i.test(text)) dPlay += 5;
  if (/be calmer|softer|gentle|спокойн|помягче/i.test(text)) {
    dWarmth += 4;
    dEnergy -= 5;
  }

  next.warmth = clampTrait(next.warmth + dWarmth, current.warmth);
  next.playfulness = clampTrait(next.playfulness + dPlay, current.playfulness);
  next.curiosity = clampTrait(next.curiosity + dCuriosity, current.curiosity);
  next.energy = clampTrait(next.energy + dEnergy, current.energy);

  return next;
}

export function analyzeConversationMoodProfile(params: {
  currentUserText?: string | null;
  recentMessages: Array<{ role: string; content: string; emotion?: string | null }>;
  memories?: Array<{ fact: string }>;
  archetypeId?: PersonalityArchetypeId | string | null;
  traits?: PersonalityTraits | null;
}): ConversationalStyleProfile {
  const archetype = getPersonalityArchetypeSpec(params.archetypeId);
  const traits = parsePersonalityTraits(params.traits);

  const userHistory = params.recentMessages
    .filter((m) => m.role === 'user' && m.content?.trim())
    .slice(-6)
    .map((m) => analyzeTurnSentiment(m.content));

  const currentText = params.currentUserText?.trim() ?? '';
  const currentSignal = currentText
    ? analyzeTurnSentiment(currentText)
    : userHistory.length > 0
      ? userHistory[userHistory.length - 1]
      : { mood: 'neutral' as UserMoodState, valence: 0, arousal: 0.35, intensity: 0.2, cues: [] };

  let previousSignal: TurnSentimentSignal | null = null;
  if (currentText && userHistory.length > 0) {
    previousSignal = userHistory[userHistory.length - 1];
  } else if (!currentText && userHistory.length >= 2) {
    previousSignal = userHistory[userHistory.length - 2];
  }

  let effectiveMood: UserMoodState = currentSignal.mood;
  if (
    effectiveMood === 'neutral' &&
    previousSignal &&
    previousSignal.mood !== 'neutral' &&
    previousSignal.intensity >= 0.55
  ) {
    effectiveMood = previousSignal.mood;
  }

  let trajectory: MoodTrajectory = 'steady';
  const allSignals = currentText ? [...userHistory, currentSignal] : userHistory;
  if (allSignals.length >= 2) {
    const prev = allSignals[allSignals.length - 2];
    const curr = allSignals[allSignals.length - 1];
    const delta = curr.valence - prev.valence;

    if (allSignals.length >= 3) {
      const earlier = allSignals[allSignals.length - 3];
      const delta1 = prev.valence - earlier.valence;
      const delta2 = curr.valence - prev.valence;
      if (Math.abs(delta1) >= 0.45 && Math.abs(delta2) >= 0.45 && delta1 * delta2 < 0) {
        trajectory = 'volatile';
      }
    }

    if (trajectory === 'steady') {
      if (delta >= 0.35) trajectory = 'improving';
      else if (delta <= -0.35) trajectory = 'declining';
    }
  }

  const preset = STYLE_PRESETS[effectiveMood];

  // Blend mood emotions with selected archetype signature emotions (carefully protecting tender distress/sadness states)
  const isSensitiveDistress =
    effectiveMood === 'distressed' || effectiveMood === 'melancholic' || effectiveMood === 'anxious';
  const rawCombinedEmotions = isSensitiveDistress
    ? [...preset.recommendedEmotions, ...archetype.signatureEmotions.slice(0, 2)]
    : archetype.id === 'adaptive'
      ? [...preset.recommendedEmotions, ...archetype.signatureEmotions.slice(0, 2)]
      : [...archetype.signatureEmotions.slice(0, 4), ...preset.recommendedEmotions];

  const validEmotions = Array.from(
    new Set(rawCombinedEmotions.map((id) => getEmotionSpec(id).id))
  );

  const listeningPool = isSensitiveDistress
    ? ['empatheticunderstanding', 'reflectivelistening0']
    : archetype.listeningEmotions;
  const thinkingPool = archetype.thinkingEmotions;

  // Pick style name combining selected archetype when not in acute distress
  const styleName =
    archetype.id === 'adaptive'
      ? preset.styleName
      : isSensitiveDistress
        ? `${preset.styleName} (${archetype.label})`
        : `${archetype.label} · ${preset.styleName}`;

  const combinedTtsDirective =
    archetype.id === 'adaptive'
      ? preset.ttsStyleDirective
      : `${archetype.ttsDirective}; ${preset.ttsStyleDirective}`;

  return {
    archetypeId: archetype.id,
    archetypeLabel: archetype.label,
    traits,
    preferredVoice: archetype.preferredVoice,
    mood: effectiveMood,
    previousMood: previousSignal?.mood ?? null,
    trajectory,
    valence: currentSignal.valence,
    arousal: currentSignal.arousal,
    styleName,
    pacingGuidance:
      archetype.id === 'adaptive'
        ? preset.pacingGuidance
        : `${archetype.promptDirective} ${preset.pacingGuidance}`,
    empathyStrategy: preset.empathyStrategy,
    recommendedEmotions: validEmotions,
    idleEmotion: getEmotionSpec(archetype.idleEmotion).id,
    listeningEmotion: getEmotionSpec(listeningPool[0]).id,
    thinkingEmotion: getEmotionSpec(thinkingPool[0]).id,
    ttsStyleDirective: combinedTtsDirective,
  };
}

export function selectPersonalityAwareEmotion(params: {
  archetypeId?: PersonalityArchetypeId | string | null;
  candidateEmotionId?: string | null;
  replyText?: string | null;
  userMood?: UserMoodState;
}): string {
  const archetype = getPersonalityArchetypeSpec(params.archetypeId);
  if (params.candidateEmotionId?.trim()) {
    const spec = getEmotionSpec(params.candidateEmotionId);
    if (spec.id !== 'friendlysmile' || archetype.id === 'adaptive') {
      return spec.id;
    }
  }
  if (archetype.id !== 'adaptive' && (!params.userMood || params.userMood === 'neutral')) {
    return getEmotionSpec(archetype.signatureEmotions[0]).id;
  }
  return getEmotionSpec(archetype.idleEmotion).id;
}

export function formatPersonalityContextForPrompt(
  profile: ConversationalStyleProfile
): string {
  const archetype = getPersonalityArchetypeSpec(profile.archetypeId);
  const trajectoryNote =
    profile.trajectory === 'declining'
      ? 'EMOTIONAL SHIFT ALERT: User mood dipped compared to earlier messages — gently soften immediately, check in with care, and prioritize emotional safety over chatter.'
      : profile.trajectory === 'improving'
        ? 'EMOTIONAL SHIFT: User mood is brightening compared to earlier messages — warmly acknowledge the relief or progress without abrupt tone whiplash.'
        : profile.trajectory === 'volatile'
          ? 'EMOTIONAL SHIFT: Mixed/rapid emotional swings across recent turns — stay steady, grounded, and deeply attentive.'
          : 'Emotional arc is steady across recent conversation.';

  const t = profile.traits;
  return `ADAPTIVE PERSONALITY & USER PREFERENCE PROFILE (PERSISTENT):
- Selected Companion Archetype: ${archetype.label} (${archetype.id}) — ${archetype.promptDirective}
- Learned User Interaction Traits (evolved over ${t.interactionsCount} interactions): Warmth ${t.warmth}/100 | Playfulness ${t.playfulness}/100 | Curiosity ${t.curiosity}/100 | Energy ${t.energy}/100
- Detected User Mood: ${profile.mood}${
    profile.previousMood && profile.previousMood !== profile.mood
      ? ` (shifted from ${profile.previousMood})`
      : ''
  } | Valence: ${profile.valence} | Energy: ${profile.arousal}
- ${trajectoryNote}
- Active Conversational Style: ${profile.styleName}
- Pacing & Tone Adaptation: ${profile.pacingGuidance}
- Relational Strategy: ${profile.empathyStrategy}
- Priority Editorial Emotions matching this personality & mood (pick exact fit from the 72-emotion palette): ${profile.recommendedEmotions.join(', ')}`;
}
