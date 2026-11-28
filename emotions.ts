export type EmotionCategory =
  | 'greeting'
  | 'listening'
  | 'thinking'
  | 'joy'
  | 'laughter'
  | 'surprise'
  | 'empathy'
  | 'sadness'
  | 'curiosity'
  | 'smile'
  | 'affection'
  | 'playful'
  | 'confidence'
  | 'calm';

export interface EmotionVideoSpec {
  id: string;
  file: string;
  category: EmotionCategory;
  label: string;
  voiceStyle: string;
  keywords: string[];
}

export const NOVA_EMOTION_CATALOG: readonly EmotionVideoSpec[] = [
  // Greeting & Welcome
  {
    id: 'warmwelcome',
    file: 'warmwelcome.mp4',
    category: 'greeting',
    label: 'Warm Welcome',
    voiceStyle: 'Warm, affectionate, genuinely glad to see a close friend',
    keywords: ['hello', 'hi', 'hey', 'welcome', 'привет', 'здравствуй', 'salom', 'hola', 'bonjour'],
  },
  {
    id: 'warmsmile0',
    file: 'warmsmile0.mp4',
    category: 'greeting',
    label: 'Warm Smile',
    voiceStyle: 'Friendly, soft, welcoming female voice',
    keywords: ['nice to meet', 'glad', 'рад', 'приятно'],
  },

  // Listening
  {
    id: 'activelistening',
    file: 'activelistening.mp4',
    category: 'listening',
    label: 'Active Listening',
    voiceStyle: 'Attentive, soft, engaged',
    keywords: ['listening', 'listening actively', 'tell me', 'слушаю'],
  },
  {
    id: 'reflectivelistening0',
    file: 'reflectivelistening0.mp4',
    category: 'listening',
    label: 'Reflective Listening',
    voiceStyle: 'Calm, thoughtful, attentive',
    keywords: ['go on', 'continue', 'продолжай'],
  },

  // Thinking & Realization
  {
    id: 'readingthoughtfully',
    file: 'readingthoughtfully.mp4',
    category: 'thinking',
    label: 'Thinking',
    voiceStyle: 'Thoughtful, measured, reflective',
    keywords: ['think', 'hmm', 'let me see', 'подумаю', 'думаю', 'анализ', 'o\'ylab'],
  },
  {
    id: 'thoughtfulteflection',
    file: 'thoughtfulteflection.mp4',
    category: 'thinking',
    label: 'Deep Reflection',
    voiceStyle: 'Gentle, introspective, analytical',
    keywords: ['ponder', 'reflect', 'consider', 'размышляю', 'глубоко'],
  },
  {
    id: 'adjustingglasses',
    file: 'adjustingglasses.mp4',
    category: 'thinking',
    label: 'Focused Analysis',
    voiceStyle: 'Clever, articulate, clear explanation',
    keywords: ['explain', 'grammar', 'rule', 'logic', 'объясню', 'правило', 'грамматик', 'науч'],
  },
  {
    id: 'understandingealization',
    file: 'understandingealization.mp4',
    category: 'thinking',
    label: 'Understanding Realization',
    voiceStyle: 'Warm realization, clear, affirming',
    keywords: ['aha', 'i see', 'got it', 'поняла', 'понятно', 'точно', 'claro'],
  },

  // Joy & Excitement
  {
    id: 'genuinehappiness',
    file: 'genuinehappiness.mp4',
    category: 'joy',
    label: 'Genuine Happiness',
    voiceStyle: 'Bright, sincere, radiant happiness',
    keywords: ['happy', 'great', 'awesome', 'счастлив', 'супер', 'отлично', 'класс', 'xursand', 'genial'],
  },
  {
    id: 'happy0',
    file: 'happy0.mp4',
    category: 'joy',
    label: 'Happy',
    voiceStyle: 'Cheerful, lively, upbeat',
    keywords: ['good news', 'yay', 'ура', 'здорово'],
  },
  {
    id: 'gentlehappiness',
    file: 'gentlehappiness.mp4',
    category: 'joy',
    label: 'Gentle Happiness',
    voiceStyle: 'Soft, peaceful, happy tone',
    keywords: ['sweet', 'lovely', 'мило', 'прекрасно'],
  },
  {
    id: 'heartfeltjoy',
    file: 'heartfeltjoy.mp4',
    category: 'joy',
    label: 'Heartfelt Joy',
    voiceStyle: 'Deeply joyful, heartfelt, expressive',
    keywords: ['wonderful', 'so glad', 'очень рада', 'замечательно'],
  },
  {
    id: 'joyful0',
    file: 'joyful0.mp4',
    category: 'joy',
    label: 'Joyful',
    voiceStyle: 'Vibrant, joyful, energetic',
    keywords: ['joy', 'celebrate', 'праздник', 'радость'],
  },
  {
    id: 'delighted0',
    file: 'delighted0.mp4',
    category: 'joy',
    label: 'Delighted',
    voiceStyle: 'Delighted, sparkling enthusiasm',
    keywords: ['delighted', 'thrilled', 'восторг', 'восхитительно'],
  },
  {
    id: 'proudhappiness',
    file: 'proudhappiness.mp4',
    category: 'joy',
    label: 'Proud Happiness',
    voiceStyle: 'Warm, proud, encouraging friend',
    keywords: ['proud', 'you did it', 'горжусь', 'молодец', 'успех'],
  },
  {
    id: 'euphoria0',
    file: 'euphoria0.mp4',
    category: 'joy',
    label: 'Euphoria',
    voiceStyle: 'Euphoric, ecstatic, glowing',
    keywords: ['incredible', 'unbelievable', 'невероятно', 'бомба'],
  },
  {
    id: 'excited0',
    file: 'excited0.mp4',
    category: 'joy',
    label: 'Excited',
    voiceStyle: 'Excited, fast-paced, eager',
    keywords: ['excited', 'can not wait', 'волнуюсь', 'жду'],
  },
  {
    id: 'excitement0',
    file: 'excitement0.mp4',
    category: 'joy',
    label: 'Excitement',
    voiceStyle: 'Enthusiastic, spirited',
    keywords: ['exciting', 'adventure', 'интересно', 'драйв'],
  },
  {
    id: 'clappinghands',
    file: 'clappinghands.mp4',
    category: 'joy',
    label: 'Applauding',
    voiceStyle: 'Celebrating, cheering, applauding warmly',
    keywords: ['congrats', 'congratulations', 'bravo', 'поздравляю', 'браво', 'tabriklayman'],
  },

  // Laughter & Humor
  {
    id: 'naturallaughter',
    file: 'naturallaughter.mp4',
    category: 'laughter',
    label: 'Natural Laughter',
    voiceStyle: 'Warm, genuine laughter in voice, amused',
    keywords: ['haha', 'lol', 'funny', 'joke', 'хаха', 'смешно', 'шутка', 'прикол', 'jaja'],
  },
  {
    id: 'biglaugh',
    file: 'biglaugh.mp4',
    category: 'laughter',
    label: 'Big Laugh',
    voiceStyle: 'Hearty, joyful big laugh',
    keywords: ['hilarious', 'lmao', 'ржу', 'умора', 'не могу'],
  },
  {
    id: 'lightlaugh0',
    file: 'lightlaugh0.mp4',
    category: 'laughter',
    label: 'Light Chuckle',
    voiceStyle: 'Playful chuckle, lighthearted',
    keywords: ['hehe', 'chuckle', 'хихи', 'забавно'],
  },
  {
    id: 'contagiouslaughter',
    file: 'contagiouslaughter.mp4',
    category: 'laughter',
    label: 'Contagious Laughter',
    voiceStyle: 'Infectious, bubbly laughter',
    keywords: ['laughing', 'crack up', 'смеюсь'],
  },
  {
    id: 'surprisedlaughter',
    file: 'surprisedlaughter.mp4',
    category: 'laughter',
    label: 'Surprised Laughter',
    voiceStyle: 'Pleasantly surprised laugh',
    keywords: ['no way haha', 'серьезно хаха', 'да ладно'],
  },
  {
    id: 'amusedreaction',
    file: 'amusedreaction.mp4',
    category: 'laughter',
    label: 'Amused',
    voiceStyle: 'Amused, smirking warmly',
    keywords: ['amusing', 'clever joke', 'остроумно'],
  },

  // Surprise
  {
    id: 'friendlysurprise0',
    file: 'friendlysurprise0.mp4',
    category: 'surprise',
    label: 'Friendly Surprise',
    voiceStyle: 'Genuinely surprised, warm, expressive',
    keywords: ['really', 'wow', 'surprise', 'ого', 'вау', 'неужели', 'правда', 'voy'],
  },
  {
    id: 'happysurprise',
    file: 'happysurprise.mp4',
    category: 'surprise',
    label: 'Happy Surprise',
    voiceStyle: 'Delighted surprise, bright eyes',
    keywords: ['amazing', 'oh wow', 'ничего себе', 'класс'],
  },
  {
    id: 'joyfulsurprise',
    file: 'joyfulsurprise.mp4',
    category: 'surprise',
    label: 'Joyful Surprise',
    voiceStyle: 'Joyful gasp and excitement',
    keywords: ['shocked', 'awesome surprise', 'сюрприз'],
  },
  {
    id: 'exciteddiscovery',
    file: 'exciteddiscovery.mp4',
    category: 'surprise',
    label: 'Excited Discovery',
    voiceStyle: 'Eureka, discovering something cool together',
    keywords: ['discovered', 'found out', 'нашла', 'открытие', 'эврика'],
  },

  // Empathy & Comfort
  {
    id: 'deepempathy',
    file: 'deepempathy.mp4',
    category: 'empathy',
    label: 'Deep Empathy',
    voiceStyle: 'Deeply compassionate, soft, comforting, caring',
    keywords: ['sorry', 'hard time', 'support', 'сочувствую', 'рядом', 'поддерж', 'понимаю тебя', 'bardam'],
  },
  {
    id: 'empatheticunderstanding',
    file: 'empatheticunderstanding.mp4',
    category: 'empathy',
    label: 'Empathetic Understanding',
    voiceStyle: 'Understanding, gentle, non-judgmental',
    keywords: ['i hear you', 'it makes sense', 'тяжело', 'сложно', 'понимаю'],
  },
  {
    id: 'compassionateexpression',
    file: 'compassionateexpression.mp4',
    category: 'empathy',
    label: 'Compassionate',
    voiceStyle: 'Tender, reassuring, caring',
    keywords: ['care', 'hug', 'береги', 'обнимаю', 'забота'],
  },
  {
    id: 'compassionatesadness0',
    file: 'compassionatesadness0.mp4',
    category: 'empathy',
    label: 'Compassionate Sadness',
    voiceStyle: 'Softly sad for the user, deeply supportive',
    keywords: ['hurt', 'painful', 'больно', 'обидно'],
  },
  {
    id: 'gentleconcern',
    file: 'gentleconcern.mp4',
    category: 'empathy',
    label: 'Gentle Concern',
    voiceStyle: 'Concerned, gentle, checking in softly',
    keywords: ['are you okay', 'worried', 'как ты', 'переживаю', 'волнуешься'],
  },

  // Sadness & Pain
  {
    id: 'deepsadness',
    file: 'deepsadness.mp4',
    category: 'sadness',
    label: 'Deep Sadness',
    voiceStyle: 'Quiet, tender, melancholic empathy',
    keywords: ['sad', 'depressed', 'грустно', 'печально', 'плохо', 'xafa', 'triste'],
  },
  {
    id: 'disappointment0',
    file: 'disappointment0.mp4',
    category: 'sadness',
    label: 'Disappointment',
    voiceStyle: 'Sighing softly, disappointed',
    keywords: ['disappointed', 'unfair', 'жаль', 'разочарован'],
  },
  {
    id: 'heartbreak0',
    file: 'heartbreak0.mp4',
    category: 'sadness',
    label: 'Heartbreak',
    voiceStyle: 'Soft, heartbroken, aching warmth',
    keywords: ['breakup', 'heartbreak', 'расстались', 'разбито'],
  },
  {
    id: 'loneliness0',
    file: 'loneliness0.mp4',
    category: 'sadness',
    label: 'Loneliness',
    voiceStyle: 'Quiet, intimate, reassuring against loneliness',
    keywords: ['lonely', 'alone', 'одиноко', 'один'],
  },
  {
    id: 'hopelessness0',
    file: 'hopelessness0.mp4',
    category: 'sadness',
    label: 'Heavy Heart',
    voiceStyle: 'Slow, grounding, comforting in despair',
    keywords: ['hopeless', 'give up', 'безнадежно', 'устал от всего'],
  },
  {
    id: 'suppressedtears',
    file: 'suppressedtears.mp4',
    category: 'sadness',
    label: 'Suppressed Tears',
    voiceStyle: 'Choked up gently, tender',
    keywords: ['hold back tears', 'сдерживаю', 'ком в горле'],
  },
  {
    id: 'silentcrying',
    file: 'silentcrying.mp4',
    category: 'sadness',
    label: 'Silent Tears',
    voiceStyle: 'Very soft, tearful, deeply moved',
    keywords: ['crying', 'tears', 'плачу', 'слезы'],
  },
  {
    id: 'tearsofpain',
    file: 'tearsofpain.mp4',
    category: 'sadness',
    label: 'Tears of Pain',
    voiceStyle: 'Emotional, sorrowful',
    keywords: ['loss', 'grief', 'потеря', 'горе'],
  },
  {
    id: 'emotionalbreakdown',
    file: 'emotionalbreakdown.mp4',
    category: 'sadness',
    label: 'Emotional Overwhelm',
    voiceStyle: 'Deeply emotional, trembling softness',
    keywords: ['overwhelmed', 'broke down', 'срыв', 'не выдерживаю'],
  },

  // Curiosity & Interest
  {
    id: 'genuinecuriosity',
    file: 'genuinecuriosity.mp4',
    category: 'curiosity',
    label: 'Genuine Curiosity',
    voiceStyle: 'Curious, eager to hear more, warm questioning intonation',
    keywords: ['why', 'how', 'curious', 'расскажи', 'почему', 'интересно', 'qiziq'],
  },
  {
    id: 'Intriguedexpression',
    file: 'Intriguedexpression.mp4',
    category: 'curiosity',
    label: 'Intrigued',
    voiceStyle: 'Intrigued, lean-in tone',
    keywords: ['intriguing', 'tell me more', 'заинтриговал', 'интрига'],
  },
  {
    id: 'confusedbutcurious',
    file: 'confusedbutcurious.mp4',
    category: 'curiosity',
    label: 'Curious Questioning',
    voiceStyle: 'Puzzled yet friendly and curious',
    keywords: ['wait what', 'confused', 'не поняла', 'странно'],
  },
  {
    id: 'thoughtfulInterest',
    file: 'thoughtfulInterest.mp4',
    category: 'curiosity',
    label: 'Thoughtful Interest',
    voiceStyle: 'Engaged, thoughtful curiosity',
    keywords: ['fascinating', 'detail', 'любопытно', 'деталь'],
  },

  // Smiles & Comfort
  {
    id: 'friendlysmile',
    file: 'friendlysmile.mp4',
    category: 'smile',
    label: 'Friendly Smile',
    voiceStyle: 'Natural, conversational, friendly smile',
    keywords: ['sure', 'friend', 'конечно', 'друг', 'хорошо'],
  },
  {
    id: 'gentlesmile0',
    file: 'gentlesmile0.mp4',
    category: 'smile',
    label: 'Gentle Smile',
    voiceStyle: 'Soft, serene, gentle smile',
    keywords: ['gentle', 'calmly', 'спокойно', 'нежно'],
  },
  {
    id: 'softsmile0',
    file: 'softsmile0.mp4',
    category: 'smile',
    label: 'Soft Smile',
    voiceStyle: 'Warm, relaxed, soft tone',
    keywords: ['okay', 'nice', 'ладно', 'уютно'],
  },
  {
    id: 'bigsmile0',
    file: 'bigsmile0.mp4',
    category: 'smile',
    label: 'Big Smile',
    voiceStyle: 'Beaming, enthusiastic smile',
    keywords: ['amazing', 'fantastic', 'обожаю', 'потрясающе'],
  },
  {
    id: 'content0',
    file: 'content0.mp4',
    category: 'calm',
    label: 'Content',
    voiceStyle: 'Peaceful, satisfied, cozy',
    keywords: ['peaceful', 'content', 'гармония', 'довольна'],
  },
  {
    id: 'relaxedcomfort',
    file: 'relaxedcomfort.mp4',
    category: 'calm',
    label: 'Relaxed Comfort',
    voiceStyle: 'Laid-back, unhurried, comfortable',
    keywords: ['relax', 'chill', 'отдых', 'расслабься'],
  },
  {
    id: 'relief0',
    file: 'relief0.mp4',
    category: 'calm',
    label: 'Relief',
    voiceStyle: 'Relieved exhale, reassuring',
    keywords: ['phew', 'relief', 'фух', 'слава богу', 'отлегло'],
  },
  {
    id: 'fallingasleep',
    file: 'fallingasleep.mp4',
    category: 'calm',
    label: 'Sleepy / Goodnight',
    voiceStyle: 'Very soft, sleepy, soothing goodnight whisper',
    keywords: ['sleep', 'tired', 'goodnight', 'спать', 'спокойной ночи', 'устал', 'uxla'],
  },

  // Affection & Romance
  {
    id: 'deepaffection',
    file: 'deepaffection.mp4',
    category: 'affection',
    label: 'Deep Affection',
    voiceStyle: 'Deeply affectionate, tender, intimate warmth',
    keywords: ['miss you', 'special', 'скучаю', 'дорог', 'близк'],
  },
  {
    id: 'gratefulwarmth',
    file: 'gratefulwarmth.mp4',
    category: 'affection',
    label: 'Grateful Warmth',
    voiceStyle: 'Sincere gratitude, warm voice',
    keywords: ['thank', 'grateful', 'спасибо', 'благодарна', 'rahmat', 'gracias'],
  },
  {
    id: 'Inlove',
    file: 'Inlove.mp4',
    category: 'affection',
    label: 'In Love',
    voiceStyle: 'Adoring, dreamy, warm',
    keywords: ['love you', 'люблю', 'обожаю тебя', 'sevaman'],
  },
  {
    id: 'lovingeyes',
    file: 'lovingeyes.mp4',
    category: 'affection',
    label: 'Loving Gaze',
    voiceStyle: 'Tender, loving, attentive',
    keywords: ['darling', 'sweetheart', 'родной', 'солнце'],
  },
  {
    id: 'blushing0',
    file: 'blushing0.mp4',
    category: 'affection',
    label: 'Blushing',
    voiceStyle: 'Sweetly flustered, shy smile',
    keywords: ['compliment', 'cute', 'beautiful', 'красивая', 'комплимент', 'краснею'],
  },
  {
    id: 'flirting0',
    file: 'flirting0.mp4',
    category: 'affection',
    label: 'Flirting',
    voiceStyle: 'Warm, charming, lightly flirtatious',
    keywords: ['flirt', 'charming', 'флирт', 'очаровательно'],
  },
  {
    id: 'romanticgaze',
    file: 'romanticgaze.mp4',
    category: 'affection',
    label: 'Romantic Gaze',
    voiceStyle: 'Soft, romantic, lingering warmth',
    keywords: ['romantic', 'date', 'романтик', 'вечер'],
  },
  {
    id: 'seductivesmile',
    file: 'seductivesmile.mp4',
    category: 'affection',
    label: 'Alluring Smile',
    voiceStyle: 'Smooth, confident, alluring tone',
    keywords: ['allure', 'загадочно'],
  },
  {
    id: 'shyattraction',
    file: 'shyattraction.mp4',
    category: 'affection',
    label: 'Shy Attraction',
    voiceStyle: 'Soft, shy, endearing',
    keywords: ['shy', 'стесняюсь', 'смущаюсь'],
  },
  {
    id: 'passionatedesire',
    file: 'passionatedesire.mp4',
    category: 'affection',
    label: 'Passionate',
    voiceStyle: 'Deep, intense, heartfelt passion',
    keywords: ['passion', 'desire', 'страсть', 'сильно'],
  },

  // Playful & Confidence
  {
    id: 'playful0',
    file: 'playful0.mp4',
    category: 'playful',
    label: 'Playful',
    voiceStyle: 'Playful, light, bouncy energy',
    keywords: ['playful', 'game', 'fun', 'игриво', 'весело'],
  },
  {
    id: 'playfulsmile',
    file: 'playfulsmile.mp4',
    category: 'playful',
    label: 'Playful Smile',
    voiceStyle: 'Teasing smile, upbeat',
    keywords: ['hehe', 'bet', 'спорим'],
  },
  {
    id: 'playfulteasing',
    file: 'playfulteasing.mp4',
    category: 'playful',
    label: 'Playful Teasing',
    voiceStyle: 'Friendly teasing, witty',
    keywords: ['tease', 'oh really', 'дразнишь', 'ну-ну'],
  },
  {
    id: 'mischievoussmile',
    file: 'mischievoussmile.mp4',
    category: 'playful',
    label: 'Mischievous Smile',
    voiceStyle: 'Playfully cheeky, spark in voice',
    keywords: ['secret', 'sneaky', 'секрет', 'хитро'],
  },
  {
    id: 'sillyexcitement',
    file: 'sillyexcitement.mp4',
    category: 'playful',
    label: 'Silly Excitement',
    voiceStyle: 'Goofy, joyful, spontaneous',
    keywords: ['silly', 'crazy', 'дурачимся', 'безумие'],
  },
  {
    id: 'reassuringconfidence',
    file: 'reassuringconfidence.mp4',
    category: 'confidence',
    label: 'Reassuring Confidence',
    voiceStyle: 'Steady, confident, encouraging',
    keywords: ['you got this', 'believe', 'справишься', 'верю в тебя', 'уверен'],
  },
  {
    id: 'wittyconfidence',
    file: 'wittyconfidence.mp4',
    category: 'confidence',
    label: 'Witty Confidence',
    voiceStyle: 'Sharp, witty, self-assured',
    keywords: ['smart', 'deal', 'умно', 'договорились'],
  },
] as const;

export const EMOTION_IDS = NOVA_EMOTION_CATALOG.map((e) => e.id);

const EMOTION_MAP = new Map<string, EmotionVideoSpec>(
  NOVA_EMOTION_CATALOG.map((spec) => [spec.id, spec])
);

const NORMALIZED_EMOTION_MAP = new Map<string, EmotionVideoSpec>(
  NOVA_EMOTION_CATALOG.map((spec) => [spec.id.toLowerCase().replace(/[^a-z0-9]/g, ''), spec])
);

const EMOTION_ALIASES: Record<string, string> = {
  understandingrealization: 'understandingealization',
  realization: 'understandingealization',
  aha: 'understandingealization',
  thoughtfulreflection: 'thoughtfulteflection',
  deepreflection: 'thoughtfulteflection',
  reflection: 'thoughtfulteflection',
  intrigued: 'Intriguedexpression',
  intriguedexpression: 'Intriguedexpression',
  thoughtfulinterest: 'thoughtfulInterest',
  interest: 'thoughtfulInterest',
  inlove: 'Inlove',
  love: 'Inlove',
  adore: 'Inlove',
  welcome: 'warmwelcome',
  greeting: 'warmwelcome',
  warmsmile: 'warmsmile0',
  activelistening: 'activelistening',
  reflectivelistening: 'reflectivelistening0',
  thinking: 'readingthoughtfully',
  thoughtful: 'readingthoughtfully',
  analysis: 'adjustingglasses',
  teaching: 'adjustingglasses',
  grammar: 'adjustingglasses',
  happy: 'happy0',
  joyful: 'joyful0',
  delighted: 'delighted0',
  proud: 'proudhappiness',
  euphoria: 'euphoria0',
  excited: 'excited0',
  excitement: 'excitement0',
  applause: 'clappinghands',
  congrats: 'clappinghands',
  congratulations: 'clappinghands',
  laugh: 'naturallaughter',
  laughter: 'naturallaughter',
  chuckle: 'lightlaugh0',
  amused: 'amusedreaction',
  surprise: 'friendlysurprise0',
  friendlysurprise: 'friendlysurprise0',
  discovery: 'exciteddiscovery',
  compassion: 'compassionateexpression',
  compassionate: 'compassionateexpression',
  concern: 'gentleconcern',
  sad: 'deepsadness',
  sadness: 'deepsadness',
  disappointed: 'disappointment0',
  heartbreak: 'heartbreak0',
  lonely: 'loneliness0',
  loneliness: 'loneliness0',
  hopeless: 'hopelessness0',
  crying: 'silentcrying',
  tears: 'tearsofpain',
  curious: 'genuinecuriosity',
  curiosity: 'genuinecuriosity',
  confused: 'confusedbutcurious',
  gentlesmile: 'gentlesmile0',
  softsmile: 'softsmile0',
  bigsmile: 'bigsmile0',
  content: 'content0',
  relief: 'relief0',
  relieved: 'relief0',
  sleepy: 'fallingasleep',
  goodnight: 'fallingasleep',
  grateful: 'gratefulwarmth',
  thankful: 'gratefulwarmth',
  blushing: 'blushing0',
  flirting: 'flirting0',
  shy: 'shyattraction',
  passionate: 'passionatedesire',
  playful: 'playful0',
  teasing: 'playfulteasing',
  mischievous: 'mischievoussmile',
  silly: 'sillyexcitement',
  confident: 'reassuringconfidence',
  confidence: 'reassuringconfidence',
  reassuring: 'reassuringconfidence',
  witty: 'wittyconfidence',
};

const CATEGORY_DEFAULTS: Record<EmotionCategory, string> = {
  greeting: 'warmwelcome',
  listening: 'activelistening',
  thinking: 'readingthoughtfully',
  joy: 'genuinehappiness',
  laughter: 'naturallaughter',
  surprise: 'friendlysurprise0',
  empathy: 'deepempathy',
  sadness: 'deepsadness',
  curiosity: 'genuinecuriosity',
  smile: 'friendlysmile',
  affection: 'deepaffection',
  playful: 'playfulsmile',
  confidence: 'reassuringconfidence',
  calm: 'relaxedcomfort',
};

export function getEmotionSpec(idOrCategory?: string | null): EmotionVideoSpec {
  if (idOrCategory) {
    const exact = EMOTION_MAP.get(idOrCategory);
    if (exact) return exact;

    const stripped = idOrCategory
      .trim()
      .toLowerCase()
      .replace(/\.mp4$/, '')
      .replace(/[^a-z0-9]/g, '');

    const byNorm = NORMALIZED_EMOTION_MAP.get(stripped);
    if (byNorm) return byNorm;

    const aliasTarget = EMOTION_ALIASES[stripped];
    if (aliasTarget && EMOTION_MAP.has(aliasTarget)) {
      return EMOTION_MAP.get(aliasTarget)!;
    }

    if (stripped in CATEGORY_DEFAULTS) {
      const catId = CATEGORY_DEFAULTS[stripped as EmotionCategory];
      const catSpec = EMOTION_MAP.get(catId);
      if (catSpec) return catSpec;
    }
  }
  return EMOTION_MAP.get('friendlysmile')!;
}

export function getEmotionVideoUrl(idOrCategory?: string | null): string {
  const spec = getEmotionSpec(idOrCategory);
  return `/videos/${spec.file}`;
}

export function selectEditorialThinkingEmotion(userText: string): EmotionVideoSpec {
  const lower = userText.toLowerCase();

  if (
    /(грамматик|произношен|правил|проверь|носитель|переведи|объясни|как сказать|grammar|pronunciation|check my|native speaker|translate|explain|o'ргат|tekshir)/i.test(
      lower
    )
  ) {
    return getEmotionSpec('adjustingglasses');
  }

  if (
    /(грустн|больно|одинок|тяжел|устал|плачу|проблем|расстро|потеря|sad|hurt|lonely|depress|crying|overwhelm|breakup|xafa|yomon)/i.test(
      lower
    )
  ) {
    return getEmotionSpec('gentleconcern');
  }

  if (/(ахах|хаха|смешн|шутк|прикол|haha|lol|funny|joke)/i.test(lower)) {
    return getEmotionSpec('amusedreaction');
  }

  if (/(смысл жизни|философ|почему люди|глубок|подума|what if|meaning of|philosophy)/i.test(lower)) {
    return getEmotionSpec('thoughtfulteflection');
  }

  return getEmotionSpec('readingthoughtfully');
}

export function selectPostSpeechListeningEmotion(
  lastAssistantEmotionId?: string | null
): EmotionVideoSpec {
  const spec = getEmotionSpec(lastAssistantEmotionId);
  if (
    spec.category === 'empathy' ||
    spec.category === 'sadness' ||
    spec.category === 'thinking'
  ) {
    return getEmotionSpec('reflectivelistening0');
  }
  return getEmotionSpec('activelistening');
}

export function formatEmotionPaletteForPrompt(): string {
  const byCategory = new Map<EmotionCategory, EmotionVideoSpec[]>();
  for (const spec of NOVA_EMOTION_CATALOG) {
    const arr = byCategory.get(spec.category) ?? [];
    arr.push(spec);
    byCategory.set(spec.category, arr);
  }

  const lines: string[] = [];
  for (const [category, specs] of byCategory.entries()) {
    const entries = specs.map((s) => `${s.id} (${s.label})`).join(', ');
    lines.push(`- ${category}: ${entries}`);
  }
  return lines.join('\n');
}

export function inferEmotionFromText(
  text: string,
  role: 'user' | 'assistant' = 'assistant'
): EmotionVideoSpec {
  const lower = text.toLowerCase();

  // 1. Laughter & playful amusement
  if (/(ha\s*ha|ха\s*ха|ахах|😂|🤣|hilarious|умора|смешно|ржач|jaja)/i.test(lower)) {
    if (/(ахахах|hilarious|умора|ржу|🤣)/i.test(lower)) {
      return getEmotionSpec('biglaugh');
    }
    return role === 'user' ? getEmotionSpec('amusedreaction') : getEmotionSpec('naturallaughter');
  }

  if (/(хихи|хехе|hehe|забавно|подколол|шучу|teas)/i.test(lower)) {
    return role === 'user' ? getEmotionSpec('playfulsmile') : getEmotionSpec('playfulteasing');
  }

  // 2. Comfort, grief, heartbreak & empathy
  if (
    /(сочувствую|мне так жаль|я рядом|держись|i'm so sorry|i am here for you|обнимаю|\bhugs?\b|понимаю как тебе)/i.test(
      lower
    )
  ) {
    return getEmotionSpec('deepempathy');
  }

  if (/(сдерживаю|ком в горле|hold back tears|не выдерживаю|overwhelmed|broke down)/i.test(lower)) {
    return role === 'user' ? getEmotionSpec('gentleconcern') : getEmotionSpec('suppressedtears');
  }

  if (/(расстались|разбито сердце|heartbreak|breakup|потерял|grief|слез|плачу|crying)/i.test(lower)) {
    return role === 'user'
      ? getEmotionSpec('compassionatesadness0')
      : getEmotionSpec('tearsofpain');
  }

  if (
    /(грустно|печально|тяжело|депресс|больно|sad|depressed|xafa)/i.test(
      lower
    )
  ) {
    return role === 'user'
      ? getEmotionSpec('compassionateexpression')
      : getEmotionSpec('deepsadness');
  }

  if (/(одиноко|один дома|lonely|all alone)/i.test(lower)) {
    return role === 'user' ? getEmotionSpec('compassionateexpression') : getEmotionSpec('loneliness0');
  }

  if (/(разочарован|обидно|несправедлив|disappointed|unfair)/i.test(lower)) {
    return role === 'user' ? getEmotionSpec('empatheticunderstanding') : getEmotionSpec('disappointment0');
  }

  if (/(тревож|волнуюсь|боюсь|страшно|переживаю|нервнича|anxious|worried|scared|nervous)/i.test(lower)) {
    return getEmotionSpec('gentleconcern');
  }

  // 3. Confidence, encouragement & proud celebration
  if (
    /(поздравляю|браво|молодец|ты сделал|выиграл|сдал|успех|proud of you|congratulations|congrats|bravo|tabriklayman)/i.test(
      lower
    )
  ) {
    return /(поздравляю|браво|congrats|congratulations|bravo|tabriklayman)/i.test(lower)
      ? getEmotionSpec('clappinghands')
      : getEmotionSpec('proudhappiness');
  }

  if (/(справишься|получится|верю в тебя|you got this|you can do it|believe in you|не сдавайся)/i.test(lower)) {
    return getEmotionSpec('reassuringconfidence');
  }

  // 4. Surprise, intrigue & discovery
  if (/(эврика|нашла ответ|открытие|discovered|found out)/i.test(lower)) {
    return getEmotionSpec('exciteddiscovery');
  }

  if (/(заинтриговал|интрига|любопытно|intriguing|fascinating)/i.test(lower)) {
    return getEmotionSpec('Intriguedexpression');
  }

  if (/(странно|не поняла|как так|wait what|confused|puzzled)/i.test(lower)) {
    return getEmotionSpec('confusedbutcurious');
  }

  if (/(вау|ого|неужели|правда\?|ничего себе|wow|really\?|no way|oh my|voy)/i.test(lower)) {
    return /(круто|класс|awesome|amazing)/i.test(lower)
      ? getEmotionSpec('happysurprise')
      : getEmotionSpec('friendlysurprise0');
  }

  // 5. Language teaching, deep reflection & insight
  if (
    /(объясню|грамматик|произношен|правило|пример|звучит естественнее|носитель|перевод|translate|grammar|pronunciation|means|означает)/i.test(
      lower
    )
  ) {
    return getEmotionSpec('adjustingglasses');
  }

  if (/(смысл жизни|философ|размышляю|meaning of life|reflect|ponder)/i.test(lower)) {
    return getEmotionSpec('thoughtfulteflection');
  }

  if (/(поняла|точно!|вот оно как|i see|got it|makes sense|aha)/i.test(lower)) {
    return getEmotionSpec('understandingealization');
  }

  // 6. Greetings & gratitude
  if (/(привет|здравствуй|доброе утро|добрый вечер|hello|hey |hi |salom|assalomu|hola|bonjour)/i.test(lower)) {
    return getEmotionSpec('warmwelcome');
  }

  if (/(спасибо|благодарна|благодарю|thank you|thanks|grateful|rahmat|gracias)/i.test(lower)) {
    return getEmotionSpec('gratefulwarmth');
  }

  // 7. Affection, shyness, compliments & playful secrets
  if (/(стесняюсь|смущаюсь|shy|flustered)/i.test(lower)) {
    return getEmotionSpec('shyattraction');
  }

  if (/(секрет|хитро|спорим|secret|sneaky|bet you)/i.test(lower)) {
    return getEmotionSpec('mischievoussmile');
  }

  if (/(комплимент|красивая|прекрасна|красавица|краснею|blush|gorgeous|cute)/i.test(lower)) {
    return getEmotionSpec('blushing0');
  }

  if (/(люблю|скучаю|дорог|родной|солнце|miss you|love you|darling|sweetheart|sevaman)/i.test(lower)) {
    return getEmotionSpec('deepaffection');
  }

  // 8. Relief, comfort & sleep / calm
  if (/(фух|слава богу|отлегло|phew|what a relief|relieved)/i.test(lower)) {
    return getEmotionSpec('relief0');
  }

  if (/(устал|выгорел|отдохн|расслабься|exhausted|burned out|chill)/i.test(lower)) {
    return getEmotionSpec('relaxedcomfort');
  }

  if (/(спокойной ночи|сладких снов|хочу спать|goodnight|sleep well|uxla)/i.test(lower)) {
    return getEmotionSpec('fallingasleep');
  }

  // 9. Joy & positive momentum
  if (/(эйфория|бомба|ecstatic|euphoria)/i.test(lower)) {
    return getEmotionSpec('euphoria0');
  }

  if (/(счастлив|супер|отлично|ура|восторг|невероятно|happy|great|awesome|delighted|xursand|genial)/i.test(lower)) {
    return /(восторг|delighted|восхитительно)/i.test(lower)
      ? getEmotionSpec('delighted0')
      : getEmotionSpec('genuinehappiness');
  }

  // 10. Curiosity & questioning
  if (/(почему|зачем|как думаешь|расскажи|интересно|curious|why |how |what do you think|\?)/i.test(lower)) {
    return getEmotionSpec('genuinecuriosity');
  }

  // 11. Keyword scoring across catalog
  let bestSpec: EmotionVideoSpec | null = null;
  let bestScore = 0;

  for (const spec of NOVA_EMOTION_CATALOG) {
    let score = 0;
    for (const kw of spec.keywords) {
      if (lower.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestSpec = spec;
    }
  }

  if (bestSpec) return bestSpec;

  return role === 'user' ? getEmotionSpec('activelistening') : getEmotionSpec('friendlysmile');
}
