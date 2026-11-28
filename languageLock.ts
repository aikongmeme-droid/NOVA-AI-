export interface LanguageSpec {
  bcp47: string;
  base: string;
  englishName: string;
  nativeName: string;
  greetingStyleHint: string;
}

const SUPPORTED_LANGUAGES: readonly LanguageSpec[] = [
  {
    bcp47: 'ru-RU',
    base: 'ru',
    englishName: 'Russian',
    nativeName: 'Русский',
    greetingStyleHint: 'Warm, sincere Russian greeting (e.g. «Привет!» / «Здравствуй! Рада тебя слышать»)',
  },
  {
    bcp47: 'en-US',
    base: 'en',
    englishName: 'English',
    nativeName: 'English',
    greetingStyleHint: 'Warm, friendly English greeting (e.g. "Hey! So good to hear you")',
  },
  {
    bcp47: 'uz-UZ',
    base: 'uz',
    englishName: 'Uzbek',
    nativeName: 'Oʻzbekcha',
    greetingStyleHint: 'Respectful, warm Uzbek greeting (e.g. «Assalomu alaykum! Yaxshimisiz?»)',
  },
  {
    bcp47: 'tg-TJ',
    base: 'tg',
    englishName: 'Tajik',
    nativeName: 'Тоҷикӣ',
    greetingStyleHint: 'Respectful, warm Tajik greeting (e.g. «Ассалому алайкум! Хуш омадед, аҳволатон чӣ тавр?»)',
  },
  {
    bcp47: 'ky-KG',
    base: 'ky',
    englishName: 'Kyrgyz',
    nativeName: 'Кыргызча',
    greetingStyleHint: 'Respectful, warm Kyrgyz greeting (e.g. «Саламатсызбы! Кандайсыз?»)',
  },
  {
    bcp47: 'kk-KZ',
    base: 'kk',
    englishName: 'Kazakh',
    nativeName: 'Қазақша',
    greetingStyleHint: 'Respectful, warm Kazakh greeting (e.g. «Сәлеметсіз бе! Қалыңыз қалай?»)',
  },
  {
    bcp47: 'az-AZ',
    base: 'az',
    englishName: 'Azerbaijani',
    nativeName: 'Azərbaycanca',
    greetingStyleHint: 'Warm, respectful Azerbaijani greeting (e.g. «Salam! Necəsiniz?»)',
  },
  {
    bcp47: 'tk-TM',
    base: 'tk',
    englishName: 'Turkmen',
    nativeName: 'Türkmençe',
    greetingStyleHint: 'Warm, respectful Turkmen greeting (e.g. «Salam! Ýagdaýlaryňyz nähili?»)',
  },
  {
    bcp47: 'ka-GE',
    base: 'ka',
    englishName: 'Georgian',
    nativeName: 'ქართული',
    greetingStyleHint: 'Warm Georgian greeting (e.g. «გამარჯობა! როგორ ხარ?»)',
  },
  {
    bcp47: 'hy-AM',
    base: 'hy',
    englishName: 'Armenian',
    nativeName: 'Հայերեն',
    greetingStyleHint: 'Warm Armenian greeting (e.g. «Բարև Ձեզ! Ինչպե՞ս եք»)',
  },
  {
    bcp47: 'uk-UA',
    base: 'uk',
    englishName: 'Ukrainian',
    nativeName: 'Українська',
    greetingStyleHint: 'Warm Ukrainian greeting (e.g. «Привіт! Рада тебе чути»)',
  },
  {
    bcp47: 'be-BY',
    base: 'be',
    englishName: 'Belarusian',
    nativeName: 'Беларуская',
    greetingStyleHint: 'Warm Belarusian greeting (e.g. «Прывітанне! Рада цябе чуць»)',
  },
  {
    bcp47: 'pl-PL',
    base: 'pl',
    englishName: 'Polish',
    nativeName: 'Polski',
    greetingStyleHint: 'Warm Polish greeting (e.g. "Cześć! Miło Cię słyszeć")',
  },
  {
    bcp47: 'cs-CZ',
    base: 'cs',
    englishName: 'Czech',
    nativeName: 'Čeština',
    greetingStyleHint: 'Warm Czech greeting (e.g. "Ahoj! Ráda tě slyším")',
  },
  {
    bcp47: 'ro-RO',
    base: 'ro',
    englishName: 'Romanian',
    nativeName: 'Română',
    greetingStyleHint: 'Warm Romanian greeting (e.g. "Bună! Mă bucur să te aud")',
  },
  {
    bcp47: 'es-ES',
    base: 'es',
    englishName: 'Spanish',
    nativeName: 'Español',
    greetingStyleHint: 'Warm, expressive Spanish greeting (e.g. "¡Hola! Qué alegría escucharte")',
  },
  {
    bcp47: 'fr-FR',
    base: 'fr',
    englishName: 'French',
    nativeName: 'Français',
    greetingStyleHint: 'Warm, gentle French greeting (e.g. «Salut ! Ravie de t’entendre»)',
  },
  {
    bcp47: 'de-DE',
    base: 'de',
    englishName: 'German',
    nativeName: 'Deutsch',
    greetingStyleHint: 'Warm, friendly German greeting (e.g. "Hallo! Schön, dich zu hören")',
  },
  {
    bcp47: 'nl-NL',
    base: 'nl',
    englishName: 'Dutch',
    nativeName: 'Nederlands',
    greetingStyleHint: 'Warm Dutch greeting (e.g. "Hoi! Fijn om je te horen")',
  },
  {
    bcp47: 'tr-TR',
    base: 'tr',
    englishName: 'Turkish',
    nativeName: 'Türkçe',
    greetingStyleHint: 'Warm, heartfelt Turkish greeting (e.g. "Merhaba! Seni duymak çok güzel")',
  },
  {
    bcp47: 'ar-SA',
    base: 'ar',
    englishName: 'Arabic',
    nativeName: 'العربية',
    greetingStyleHint: 'Warm, respectful Arabic greeting (e.g. «أهلاً بك! يسعدني سماع صوتك»)',
  },
  {
    bcp47: 'fa-IR',
    base: 'fa',
    englishName: 'Persian',
    nativeName: 'فارسی',
    greetingStyleHint: 'Warm, respectful Persian greeting (e.g. «سلام! خوشحالم صدایت را می‌شنوم»)',
  },
  {
    bcp47: 'he-IL',
    base: 'he',
    englishName: 'Hebrew',
    nativeName: 'עברית',
    greetingStyleHint: 'Warm Hebrew greeting (e.g. «שלום! איזה כיף לשמוע אותך»)',
  },
  {
    bcp47: 'it-IT',
    base: 'it',
    englishName: 'Italian',
    nativeName: 'Italiano',
    greetingStyleHint: 'Warm Italian greeting (e.g. "Ciao! Che bello sentirti")',
  },
  {
    bcp47: 'pt-BR',
    base: 'pt',
    englishName: 'Portuguese',
    nativeName: 'Português',
    greetingStyleHint: 'Warm Portuguese greeting (e.g. "Oi! Que bom falar com você")',
  },
  {
    bcp47: 'zh-CN',
    base: 'zh',
    englishName: 'Chinese',
    nativeName: '中文',
    greetingStyleHint: 'Warm Chinese greeting (e.g. "你好！很高兴听到你的声音")',
  },
  {
    bcp47: 'ja-JP',
    base: 'ja',
    englishName: 'Japanese',
    nativeName: '日本語',
    greetingStyleHint: 'Warm, polite Japanese greeting (e.g. 「こんにちは！お話しできて嬉しいです」)',
  },
  {
    bcp47: 'ko-KR',
    base: 'ko',
    englishName: 'Korean',
    nativeName: '한국어',
    greetingStyleHint: 'Warm Korean greeting (e.g. "안녕하세요! 목소리 들으니 반가워요")',
  },
  {
    bcp47: 'hi-IN',
    base: 'hi',
    englishName: 'Hindi',
    nativeName: 'हिन्दी',
    greetingStyleHint: 'Warm Hindi greeting (e.g. "नमस्ते! आपसे बात करके बहुत अच्छा लगा")',
  },
  {
    bcp47: 'ur-PK',
    base: 'ur',
    englishName: 'Urdu',
    nativeName: 'اردو',
    greetingStyleHint: 'Respectful, warm Urdu greeting (e.g. «السلام علیکم! آپ سے بات کر کے بہت خوشی ہوئی»)',
  },
  {
    bcp47: 'bn-BD',
    base: 'bn',
    englishName: 'Bengali',
    nativeName: 'বাংলা',
    greetingStyleHint: 'Warm Bengali greeting (e.g. "নমস্কার / আসসালামু আলাইকুম! আপনার সাথে কথা বলে ভালো লাগছে")',
  },
  {
    bcp47: 'vi-VN',
    base: 'vi',
    englishName: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    greetingStyleHint: 'Warm Vietnamese greeting (e.g. "Chào bạn! Rất vui được nói chuyện với bạn")',
  },
  {
    bcp47: 'th-TH',
    base: 'th',
    englishName: 'Thai',
    nativeName: 'ไทย',
    greetingStyleHint: 'Warm, polite Thai greeting (e.g. "สวัสดีค่ะ! ยินดีที่ได้คุยกันนะคะ")',
  },
  {
    bcp47: 'id-ID',
    base: 'id',
    englishName: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    greetingStyleHint: 'Warm Indonesian greeting (e.g. "Halo! Senang sekali berbicara denganmu")',
  },
];

const BY_BASE = new Map<string, LanguageSpec>(
  SUPPORTED_LANGUAGES.map((l) => [l.base, l])
);

const ALIASES: Record<string, string> = {
  russian: 'ru-RU',
  русский: 'ru-RU',
  русском: 'ru-RU',
  english: 'en-US',
  английский: 'en-US',
  английском: 'en-US',
  uzbek: 'uz-UZ',
  узбекский: 'uz-UZ',
  узбекском: 'uz-UZ',
  ozbek: 'uz-UZ',
  "o'zbek": 'uz-UZ',
  tajik: 'tg-TJ',
  таджикский: 'tg-TJ',
  таджикском: 'tg-TJ',
  тоҷикӣ: 'tg-TJ',
  kyrgyz: 'ky-KG',
  kirghiz: 'ky-KG',
  киргизский: 'ky-KG',
  кыргызский: 'ky-KG',
  кыргызча: 'ky-KG',
  kazakh: 'kk-KZ',
  казахский: 'kk-KZ',
  казахском: 'kk-KZ',
  azerbaijani: 'az-AZ',
  azeri: 'az-AZ',
  азербайджанский: 'az-AZ',
  turkmen: 'tk-TM',
  туркменский: 'tk-TM',
  georgian: 'ka-GE',
  грузинский: 'ka-GE',
  armenian: 'hy-AM',
  армянский: 'hy-AM',
  ukrainian: 'uk-UA',
  украинский: 'uk-UA',
  украинском: 'uk-UA',
  belarusian: 'be-BY',
  белорусский: 'be-BY',
  polish: 'pl-PL',
  польский: 'pl-PL',
  czech: 'cs-CZ',
  чешский: 'cs-CZ',
  romanian: 'ro-RO',
  румынский: 'ro-RO',
  spanish: 'es-ES',
  испанский: 'es-ES',
  испанском: 'es-ES',
  french: 'fr-FR',
  французский: 'fr-FR',
  французском: 'fr-FR',
  german: 'de-DE',
  немецкий: 'de-DE',
  немецком: 'de-DE',
  dutch: 'nl-NL',
  нидерландский: 'nl-NL',
  голландский: 'nl-NL',
  turkish: 'tr-TR',
  турецкий: 'tr-TR',
  турецком: 'tr-TR',
  arabic: 'ar-SA',
  арабский: 'ar-SA',
  арабском: 'ar-SA',
  persian: 'fa-IR',
  farsi: 'fa-IR',
  персидский: 'fa-IR',
  фарси: 'fa-IR',
  hebrew: 'he-IL',
  иврит: 'he-IL',
  italian: 'it-IT',
  итальянский: 'it-IT',
  итальянском: 'it-IT',
  portuguese: 'pt-BR',
  португальский: 'pt-BR',
  португальском: 'pt-BR',
  chinese: 'zh-CN',
  mandarin: 'zh-CN',
  китайский: 'zh-CN',
  китайском: 'zh-CN',
  japanese: 'ja-JP',
  японский: 'ja-JP',
  японском: 'ja-JP',
  korean: 'ko-KR',
  корейский: 'ko-KR',
  корейском: 'ko-KR',
  hindi: 'hi-IN',
  хинди: 'hi-IN',
  urdu: 'ur-PK',
  урду: 'ur-PK',
  bengali: 'bn-BD',
  бенгальский: 'bn-BD',
  vietnamese: 'vi-VN',
  вьетнамский: 'vi-VN',
  thai: 'th-TH',
  тайский: 'th-TH',
  indonesian: 'id-ID',
  индонезийский: 'id-ID',
  finnish: 'fi-FI',
  финский: 'fi-FI',
  swedish: 'sv-SE',
  шведский: 'sv-SE',
  norwegian: 'nb-NO',
  норвежский: 'nb-NO',
  danish: 'da-DK',
  датский: 'da-DK',
  greek: 'el-GR',
  греческий: 'el-GR',
  hungarian: 'hu-HU',
  венгерский: 'hu-HU',
  mongolian: 'mn-MN',
  монгольский: 'mn-MN',
  swahili: 'sw-KE',
  суахили: 'sw-KE',
};

const BCP47_GENERAL_REGEX = /^[a-z]{2,3}(?:-[a-z]{4})?(?:-[a-z]{2}|\d{3})?$/i;

function formatCanonicalBcp47(tag: string): string {
  const parts = tag.split('-');
  return parts
    .map((part, idx) => {
      if (idx === 0) return part.toLowerCase();
      if (part.length === 4) {
        return part[0].toUpperCase() + part.slice(1).toLowerCase();
      }
      if (part.length === 2) return part.toUpperCase();
      return part;
    })
    .join('-');
}

const ISO_639_EXTRA_CODES = [
  'fil', 'yue', 'haw', 'ceb', 'mai', 'bho', 'kok', 'ast', 'scn', 'nap', 'vec', 'gsw', 'nds',
];

const PREFERRED_REGIONS: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  uz: 'uz-UZ',
  tg: 'tg-TJ',
  ky: 'ky-KG',
  kk: 'kk-KZ',
  az: 'az-AZ',
  tk: 'tk-TM',
  ka: 'ka-GE',
  hy: 'hy-AM',
  uk: 'uk-UA',
  be: 'be-BY',
  pl: 'pl-PL',
  cs: 'cs-CZ',
  sk: 'sk-SK',
  ro: 'ro-RO',
  hu: 'hu-HU',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  nl: 'nl-NL',
  fi: 'fi-FI',
  sv: 'sv-SE',
  nb: 'nb-NO',
  no: 'nb-NO',
  da: 'da-DK',
  el: 'el-GR',
  tr: 'tr-TR',
  ar: 'ar-SA',
  fa: 'fa-IR',
  he: 'he-IL',
  it: 'it-IT',
  pt: 'pt-BR',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  hi: 'hi-IN',
  ur: 'ur-PK',
  bn: 'bn-BD',
  vi: 'vi-VN',
  th: 'th-TH',
  id: 'id-ID',
  ms: 'ms-MY',
  tl: 'tl-PH',
  fil: 'fil-PH',
  sw: 'sw-KE',
  mn: 'mn-MN',
  am: 'am-ET',
  is: 'is-IS',
  et: 'et-EE',
  lv: 'lv-LV',
  lt: 'lt-LT',
  bg: 'bg-BG',
  sr: 'sr-RS',
  hr: 'hr-HR',
  bs: 'bs-BA',
  sl: 'sl-SI',
  sq: 'sq-AL',
  mk: 'mk-MK',
  ne: 'ne-NP',
  si: 'si-LK',
  km: 'km-KH',
  lo: 'lo-LA',
  my: 'my-MM',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  ml: 'ml-IN',
  kn: 'kn-IN',
  ps: 'ps-AF',
  ku: 'ku-TR',
  tt: 'tt-RU',
  yo: 'yo-NG',
  ha: 'ha-NG',
  zu: 'zu-ZA',
  so: 'so-SO',
  ca: 'ca-ES',
  eu: 'eu-ES',
  gl: 'gl-ES',
  cy: 'cy-GB',
  ga: 'ga-IE',
  mt: 'mt-MT',
  af: 'af-ZA',
};

let cachedWorldLanguageNameMap: Map<string, string> | null = null;

function buildCanonicalFromBase(base: string): string {
  const lower = base.toLowerCase();
  if (PREFERRED_REGIONS[lower]) return PREFERRED_REGIONS[lower];
  const byBase = BY_BASE.get(lower);
  if (byBase) return byBase.bcp47;
  return lower;
}

function getWorldLanguageNameMap(): Map<string, string> {
  if (cachedWorldLanguageNameMap) return cachedWorldLanguageNameMap;
  const map = new Map<string, string>();
  for (const [k, v] of Object.entries(ALIASES)) {
    map.set(k.toLowerCase(), v);
  }
  for (const spec of SUPPORTED_LANGUAGES) {
    map.set(spec.englishName.toLowerCase(), spec.bcp47);
    map.set(spec.nativeName.toLowerCase(), spec.bcp47);
  }

  try {
    const uiLocales = ['en', 'ru', 'uz', 'tr', 'es', 'fr', 'de', 'ar', 'pt', 'zh', 'ja', 'ko'];
    const displayInstances = uiLocales
      .map((loc) => {
        try {
          return new Intl.DisplayNames([loc], { type: 'language' });
        } catch {
          return null;
        }
      })
      .filter((d): d is Intl.DisplayNames => d !== null);

    const codes: string[] = [...ISO_639_EXTRA_CODES];
    for (let a = 97; a <= 122; a++) {
      for (let b = 97; b <= 122; b++) {
        codes.push(String.fromCharCode(a, b));
      }
    }

    for (const code of codes) {
      const canonical = buildCanonicalFromBase(code);
      for (const dn of displayInstances) {
        try {
          const name = dn.of(code);
          if (name && name.toLowerCase() !== code && !/^unknown/i.test(name)) {
            const normalizedName = name.toLowerCase().trim();
            if (normalizedName.length >= 3 && !map.has(normalizedName)) {
              map.set(normalizedName, canonical);
            }
          }
        } catch {
          // ignore unsupported code
        }
      }
      // Also index native name of the language itself
      try {
        const selfDn = new Intl.DisplayNames([code], { type: 'language' });
        const selfName = selfDn.of(code);
        if (selfName && selfName.toLowerCase() !== code) {
          const normalizedSelf = selfName.toLowerCase().trim();
          if (normalizedSelf.length >= 2 && !map.has(normalizedSelf)) {
            map.set(normalizedSelf, canonical);
          }
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // Intl.DisplayNames unavailable in minimal runtime
  }

  cachedWorldLanguageNameMap = map;
  return map;
}

function lookupDynamicWorldLanguageInText(text: string): string | null {
  const map = getWorldLanguageNameMap();
  const cleaned = text
    .toLowerCase()
    .replace(/[.!?,…:;()"'«»/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;

  const words = cleaned.split(' ').filter((w) => w.length >= 3);
  for (const word of words) {
    if (map.has(word)) {
      return map.get(word)!;
    }
    // Strip common Russian/Uzbek/Turkish language name inflections
    const candidates = [
      word.replace(/(?:ском|ский|ская|ское|скую|ски|ому|ого)$/u, 'ский'),
      word.replace(/(?:ском|ский|ская|ское|скую|ски|ому|ого)$/u, ''),
      word.replace(/(?:chaga|cha|tilida|tili)$/u, ''),
      word.replace(/(?:ca|çe|ce|ça|ceye|caya)$/u, ''),
    ];
    for (const cand of candidates) {
      if (cand.length >= 3 && map.has(cand)) {
        return map.get(cand)!;
      }
    }
  }
  return null;
}

export function normalizeToBcp47(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase().replace(/_/g, '-');
  if (!cleaned) return null;

  const exactByBcp = SUPPORTED_LANGUAGES.find(
    (l) => l.bcp47.toLowerCase() === cleaned
  );
  if (exactByBcp) return exactByBcp.bcp47;

  const base = cleaned.split('-')[0];
  const byBase = BY_BASE.get(base);
  if (byBase) return byBase.bcp47;
  if (PREFERRED_REGIONS[base] && !cleaned.includes('-')) {
    return PREFERRED_REGIONS[base];
  }

  if (ALIASES[cleaned]) return ALIASES[cleaned];

  const worldMap = getWorldLanguageNameMap();
  if (worldMap.has(cleaned)) return worldMap.get(cleaned)!;

  // Accept ANY valid BCP-47 language tag in the world (not limited to curated list)
  if (BCP47_GENERAL_REGEX.test(cleaned)) {
    return formatCanonicalBcp47(cleaned);
  }

  return null;
}

export function getLanguageSpec(bcp47?: string | null): LanguageSpec | null {
  const normalized = normalizeToBcp47(bcp47);
  if (!normalized) return null;
  const known = SUPPORTED_LANGUAGES.find((l) => l.bcp47 === normalized);
  if (known) return known;

  const base = normalized.split('-')[0];
  let englishName = normalized;
  let nativeName = normalized;
  try {
    const enNames = new Intl.DisplayNames(['en'], { type: 'language' });
    englishName = enNames.of(normalized) || enNames.of(base) || normalized;
    const natNames = new Intl.DisplayNames([normalized, base], { type: 'language' });
    nativeName = natNames.of(normalized) || natNames.of(base) || englishName;
  } catch {
    // fallback cleanly to canonical tag
  }

  return {
    bcp47: normalized,
    base,
    englishName,
    nativeName,
    greetingStyleHint: `Warm, respectful culturally authentic greeting in ${englishName} (${normalized})`,
  };
}

const TARGET_LANGUAGE_PATTERNS: Array<{ bcp47: string; pattern: RegExp }> = [
  {
    bcp47: 'en-US',
    pattern: /(english|ingliz|inglis|инглиш|английск\p{L}*|по-английски)/iu,
  },
  {
    bcp47: 'ru-RU',
    pattern: /(russian|ruscha|rus til\p{L}*|русск\p{L}*|по-русски)/iu,
  },
  {
    bcp47: 'uz-UZ',
    pattern: /(uzbek|o['’]?zbek\p{L}*|узбекск\p{L}*|по-узбекски)/iu,
  },
  {
    bcp47: 'tg-TJ',
    pattern: /(tajik|tojik\p{L}*|тоҷик\p{L}*|таджикск\p{L}*|по-таджикски)/iu,
  },
  {
    bcp47: 'ky-KG',
    pattern: /(kyrgyz|kirghiz|кыргыз\p{L}*|киргизск\p{L}*|по-киргизски|по-кыргызски)/iu,
  },
  {
    bcp47: 'kk-KZ',
    pattern: /(kazakh|қазақ\p{L}*|казахск\p{L}*|по-казахски)/iu,
  },
  {
    bcp47: 'az-AZ',
    pattern: /(azerbaijani|azeri|azərbaycan\p{L}*|азербайджанск\p{L}*|по-азербайджански)/iu,
  },
  {
    bcp47: 'tk-TM',
    pattern: /(turkmen|türkmen\p{L}*|туркменск\p{L}*|по-туркменски)/iu,
  },
  {
    bcp47: 'ka-GE',
    pattern: /(georgian|ქართულ\p{L}*|грузинск\p{L}*|по-грузински)/iu,
  },
  {
    bcp47: 'hy-AM',
    pattern: /(armenian|հայերեն|армянск\p{L}*|по-армянски)/iu,
  },
  {
    bcp47: 'uk-UA',
    pattern: /(ukrainian|українськ\p{L}*|украинск\p{L}*|по-украински)/iu,
  },
  {
    bcp47: 'be-BY',
    pattern: /(belarusian|беларуск\p{L}*|белорусск\p{L}*|по-белорусски)/iu,
  },
  {
    bcp47: 'pl-PL',
    pattern: /(polish|polsk\p{L}*|польск\p{L}*|по-польски)/iu,
  },
  {
    bcp47: 'cs-CZ',
    pattern: /(czech|češtin\p{L}*|česk\p{L}*|чешск\p{L}*|по-чешски)/iu,
  },
  {
    bcp47: 'sk-SK',
    pattern: /(slovak|slovenčin\p{L}*|словацк\p{L}*|по-словацки)/iu,
  },
  {
    bcp47: 'ro-RO',
    pattern: /(romanian|român\p{L}*|румынск\p{L}*|по-румынски)/iu,
  },
  {
    bcp47: 'hu-HU',
    pattern: /(hungarian|magyar\p{L}*|венгерск\p{L}*|по-венгерски)/iu,
  },
  {
    bcp47: 'es-ES',
    pattern: /(spanish|español|espanol|испанск\p{L}*|по-испански)/iu,
  },
  {
    bcp47: 'fr-FR',
    pattern: /(french|français|francais|французск\p{L}*|по-французски)/iu,
  },
  {
    bcp47: 'de-DE',
    pattern: /(german|deutsch|немецк\p{L}*|по-немецки)/iu,
  },
  {
    bcp47: 'nl-NL',
    pattern: /(dutch|nederlands|нидерландск\p{L}*|голландск\p{L}*|по-голландски)/iu,
  },
  {
    bcp47: 'fi-FI',
    pattern: /(finnish|suome\p{L}*|финск\p{L}*|по-фински)/iu,
  },
  {
    bcp47: 'sv-SE',
    pattern: /(swedish|svenska|шведск\p{L}*|по-шведски)/iu,
  },
  {
    bcp47: 'nb-NO',
    pattern: /(norwegian|norsk|норвежск\p{L}*|по-норвежски)/iu,
  },
  {
    bcp47: 'da-DK',
    pattern: /(danish|dansk|датск\p{L}*|по-датски)/iu,
  },
  {
    bcp47: 'el-GR',
    pattern: /(greek|ελληνικ\p{L}*|греческ\p{L}*|по-гречески)/iu,
  },
  {
    bcp47: 'tr-TR',
    pattern: /(turkish|türkçe|turkce|турецк\p{L}*|по-турецки)/iu,
  },
  {
    bcp47: 'ar-SA',
    pattern: /(arabic|العربية|арабск\p{L}*|по-арабски)/iu,
  },
  {
    bcp47: 'fa-IR',
    pattern: /(persian|farsi|فارسی|персидск\p{L}*|фарси|по-персидски)/iu,
  },
  {
    bcp47: 'he-IL',
    pattern: /(hebrew|עברית|иврит\p{L}*|на\s+иврите)/iu,
  },
  {
    bcp47: 'it-IT',
    pattern: /(italian|italiano|итальянск\p{L}*|по-итальянски)/iu,
  },
  {
    bcp47: 'pt-BR',
    pattern: /(portuguese|português|portugues|португальск\p{L}*|по-португальски)/iu,
  },
  {
    bcp47: 'zh-CN',
    pattern: /(chinese|mandarin|中文|китайск\p{L}*|по-китайски)/iu,
  },
  {
    bcp47: 'ja-JP',
    pattern: /(japanese|日本語|японск\p{L}*|по-японски)/iu,
  },
  {
    bcp47: 'ko-KR',
    pattern: /(korean|한국어|корейск\p{L}*|по-корейски)/iu,
  },
  {
    bcp47: 'hi-IN',
    pattern: /(hindi|हिन्दी|хинди)/iu,
  },
  {
    bcp47: 'ur-PK',
    pattern: /(urdu|اردو|урду)/iu,
  },
  {
    bcp47: 'bn-BD',
    pattern: /(bengali|bangla|বাংলা|бенгальск\p{L}*)/iu,
  },
  {
    bcp47: 'vi-VN',
    pattern: /(vietnamese|tiếng\s*việt|вьетнамск\p{L}*|по-вьетнамски)/iu,
  },
  {
    bcp47: 'th-TH',
    pattern: /(thai|ภาษาไทย|тайск\p{L}*|по-тайски)/iu,
  },
  {
    bcp47: 'id-ID',
    pattern: /(indonesian|bahasa\s*indonesia|индонезийск\p{L}*)/iu,
  },
  {
    bcp47: 'ms-MY',
    pattern: /(malay|bahasa\s*melayu|малайск\p{L}*)/iu,
  },
  {
    bcp47: 'tl-PH',
    pattern: /(tagalog|filipino|тагальск\p{L}*|филиппинск\p{L}*)/iu,
  },
  {
    bcp47: 'sw-KE',
    pattern: /(swahili|kiswahili|суахили)/iu,
  },
  {
    bcp47: 'mn-MN',
    pattern: /(mongolian|монгол\p{L}*|монгольск\p{L}*)/iu,
  },
];

const SWITCH_INTENT_REGEX =
  /(давай\s+(?:говорить|поговорим|общаться|перейд[её]м|на)|давайте\s+(?:говорить|поговорим|общаться|перейд[её]м)|говорим\s+(?:на|по)|хочу\s+(?:говорить|общаться)\s+(?:на|по)|перейд[и]|переключ[и]|переведи\s+(?:наш\s+)?разговор\s+на|говори\s+(?:со\s+мной\s+)?(?:на|по)|отвечай\s+(?:мне\s+)?(?:на|по)|пиши\s+(?:мне\s+)?(?:на|по)|разговаривай\s+(?:со\s+мной\s+)?(?:на|по)|смени\s+язык|поменяй\s+язык|измени\s+язык|can\s+we\s+(?:speak|talk)\s+in|please\s+(?:speak|talk|switch)|let'?s\s+(?:speak|talk|switch)|switch\s+(?:to|language)|speak\s+(?:only\s+)?(?:in|to\s+me\s+in)|talk\s+(?:only\s+)?(?:in|to\s+me\s+in)|change\s+(?:the\s+)?language|reply\s+in|respond\s+in|gaplashaylik|gapir|o['’]?taylik|tilni\s+o['’]?zgartir|habla\s+en|cambia\s+al|parle\s+en|sprich\s+(?:bitte\s+)?(?:auf|in)|konuş|сөйле|розмовляй|мовою|забони|гап\s+зан)/iu;

// Broad multilingual switch-command verbs/nouns used to guard model tool-calls against background foreign audio
const SWITCH_COMMAND_WORDS_REGEX =
  /(давай|давайте|перейд|переключ|смени|поменяй|измени|говори|разговаривай|отвечай|пиши|язык|мовою|тіл|tilni|o['’]?zgartir|gaplashaylik|gapir|o['’]?taylik|switch|change\s+(?:the\s+)?language|speak\s+(?:in|to\s+me)|talk\s+(?:in|to\s+me)|reply\s+in|respond\s+in|cambia|habla|idioma|parle|langue|sprich|sprache|konuş|تحدث|تكلم|لغة|話して|話そう|말해|언어|बोलो|भाषा|забон|сөйле|розмовляй)/iu;

const NATIVE_CHECK_INTENT_REGEX =
  /(провер[ьи]|оцен[и]|помоги\s+(?:мне\s+)?(?:говорить|произносить)|практик|как\s+носитель|акцент|произношени|check\s+(?:my|how\s+i\s+speak)|evaluate\s+my|practice\s+speaking|like\s+a\s+native|native\s+speaker|tekshir|talaffuz|ona\s+tili\s+kabi)/iu;

const AMBIGUOUS_SHORT_FILLERS = new Set([
  'ok',
  'okay',
  'hmm',
  'hm',
  'uh',
  'um',
  'aha',
  'uh-huh',
  'mhm',
  'mmm',
  'yes',
  'no',
  'yeah',
  'yep',
  'nope',
  'hi',
  'hey',
  'yo',
  'lol',
  'haha',
  'hehe',
  'wow',
  'да',
  'нет',
  'ну',
  'хм',
  'ага',
  'угу',
  'ок',
  'окей',
  'эй',
  'ой',
  'ау',
  'ha',
  "yo'q",
  'yoq',
  "xo'p",
  'xop',
  'evet',
  'tamam',
  'si',
  'non',
  'ja',
  'nein',
]);

/**
 * Returns true if the user's text contains an explicit command/request to change languages.
 */
export function hasExplicitLanguageSwitchIntent(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return SWITCH_INTENT_REGEX.test(trimmed) || SWITCH_COMMAND_WORDS_REGEX.test(trimmed);
}

/**
 * Returns a BCP-47 language when the user explicitly commands switching languages.
 */
export function detectExplicitLanguageSwitch(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (!SWITCH_INTENT_REGEX.test(trimmed) && !SWITCH_COMMAND_WORDS_REGEX.test(trimmed)) {
    return null;
  }

  for (const entry of TARGET_LANGUAGE_PATTERNS) {
    if (entry.pattern.test(trimmed)) {
      return entry.bcp47;
    }
  }
  return lookupDynamicWorldLanguageInText(trimmed);
}

/**
 * Detects when the user asks NOVA to check/evaluate/help them speak any language like a native speaker.
 */
export function detectNativeCheckRequest(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!NATIVE_CHECK_INTENT_REGEX.test(trimmed)) return null;

  for (const entry of TARGET_LANGUAGE_PATTERNS) {
    if (entry.pattern.test(trimmed)) {
      return entry.bcp47;
    }
  }
  return lookupDynamicWorldLanguageInText(trimmed);
}

/**
 * Identifies short single-word / filler utterances that should NOT trigger an unexpected language switch.
 */
export function isAmbiguousShortUtterance(text: string): boolean {
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[.!?,…:;()"'«»]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return true;
  if (AMBIGUOUS_SHORT_FILLERS.has(cleaned)) return true;

  const tokens = cleaned.split(' ').filter(Boolean);
  // Single very short Latin/Cyrillic token (<= 3 chars, excluding CJK/Arabic ideographs)
  const hasIdeographic = /[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0600-\u06FF\u0900-\u097F]/.test(
    cleaned
  );
  if (!hasIdeographic && tokens.length === 1 && tokens[0].length <= 3) {
    return true;
  }
  return false;
}

function countPatternTokens(text: string, regex: RegExp): number {
  const globalFlags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  const cloned = new RegExp(regex.source, globalFlags);
  return (text.match(cloned) || []).length;
}

export interface LanguageDetectionResult {
  language: string | null;
  confident: boolean;
  isAmbiguous: boolean;
  isMixed: boolean;
}

/**
 * Universal confidence-aware & mixed-language dominant detection across world scripts and languages.
 * `confident: false` means script-level or weak signal only so AI audio/text identification can refine it.
 */
export function inferDominantLanguageWithConfidence(text: string): LanguageDetectionResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { language: null, confident: false, isAmbiguous: true, isMixed: false };
  }

  const explicit = detectExplicitLanguageSwitch(trimmed);
  if (explicit) {
    return { language: explicit, confident: true, isAmbiguous: false, isMixed: false };
  }

  const isAmbiguous = isAmbiguousShortUtterance(trimmed);

  // Score candidate languages by character & word evidence so mixed-language messages resolve to the dominant language
  const candidates = new Map<string, number>();
  const addScore = (lang: string, score: number) => {
    if (score <= 0) return;
    candidates.set(lang, (candidates.get(lang) ?? 0) + score);
  };

  // 1. Distinct non-Latin scripts (weighted by character count)
  const cyrillicChars = (trimmed.match(/[\u0400-\u04FF]/g) || []).length;
  if (cyrillicChars > 0) {
    if (/[ғӣқӯҳҷ]/i.test(trimmed)) addScore('tg-TJ', cyrillicChars + 6);
    else if (/[әіңғүұқ]/i.test(trimmed)) addScore('kk-KZ', cyrillicChars + 6);
    else if (/[өүң]/i.test(trimmed)) addScore('ky-KG', cyrillicChars + 6);
    else if (/[іїєґ]/i.test(trimmed)) addScore('uk-UA', cyrillicChars + 6);
    else if (/[ў]/i.test(trimmed)) addScore('be-BY', cyrillicChars + 6);
    else {
      const ruWords = countPatternTokens(
        trimmed,
        /(?:^|\P{L})(привет|здравствуй\p{L}*|спасибо|пожалуйста|как\s+дела|меня\s+зовут|хорошо|давай|что|это|очень|сегодня|завтра|почему|можно|нужно|буду|есть|сказать|говорить|по-русски|я|мы|ты|он|она)(?=$|\P{L})/iu
      );
      addScore('ru-RU', cyrillicChars + ruWords * 4);
    }
  }

  const kaChars = (trimmed.match(/[\u10A0-\u10FF]/g) || []).length;
  if (kaChars > 0) addScore('ka-GE', kaChars + 6);

  const hyChars = (trimmed.match(/[\u0530-\u058F]/g) || []).length;
  if (hyChars > 0) addScore('hy-AM', hyChars + 6);

  const heChars = (trimmed.match(/[\u0590-\u05FF]/g) || []).length;
  if (heChars > 0) addScore('he-IL', heChars + 6);

  const elChars = (trimmed.match(/[\u0370-\u03FF]/g) || []).length;
  if (elChars > 0) addScore('el-GR', elChars + 6);

  const arChars = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
  if (arChars > 0) {
    if (/[پچژگ]/u.test(trimmed)) addScore('fa-IR', arChars + 6);
    else if (/[ٹڈڑںےہ]/u.test(trimmed)) addScore('ur-PK', arChars + 6);
    else addScore('ar-SA', arChars + 6);
  }

  const bnChars = (trimmed.match(/[\u0980-\u09FF]/g) || []).length;
  if (bnChars > 0) addScore('bn-BD', bnChars + 6);

  const hiChars = (trimmed.match(/[\u0900-\u097F]/g) || []).length;
  if (hiChars > 0) addScore('hi-IN', hiChars + 6);

  const thChars = (trimmed.match(/[\u0E00-\u0E7F]/g) || []).length;
  if (thChars > 0) addScore('th-TH', thChars + 6);

  const kanaChars = (trimmed.match(/[\u3040-\u30FF]/g) || []).length;
  const koChars = (trimmed.match(/[\uAC00-\uD7AF]/g) || []).length;
  const hanChars = (trimmed.match(/[\u4E00-\u9FFF]/g) || []).length;
  if (kanaChars > 0) addScore('ja-JP', kanaChars + hanChars + 6);
  else if (hanChars > 0) addScore('zh-CN', hanChars + 6);
  if (koChars > 0) addScore('ko-KR', koChars + 6);

  // 2. Latin-script languages (diacritics + distinctive lexical markers)
  const lower = trimmed.toLowerCase();
  const latinMatchers: Array<{ lang: string; diacritics?: RegExp; words: RegExp }> = [
    {
      lang: 'az-AZ',
      diacritics: /[ə]/,
      words: /\b(salam|necəsən|necəsiniz|təşəkkür|yaxşıyam|mən|sən)\b/gi,
    },
    {
      lang: 'pl-PL',
      diacritics: /[ąćęłńśźż]/i,
      words: /\b(cześć|dziękuję|proszę|jak się masz|dobrze|jestem)\b/gi,
    },
    {
      lang: 'cs-CZ',
      diacritics: /[řěů]/i,
      words: /\b(ahoj|dobrý den|děkuji|jak se máš|prosím|jsem)\b/gi,
    },
    {
      lang: 'hu-HU',
      diacritics: /[őű]/i,
      words: /\b(szia|köszönöm|hogy vagy|igen|nem|vagyok)\b/gi,
    },
    {
      lang: 'tr-TR',
      diacritics: /[şğıİ]/,
      words: /\b(merhaba|nasılsın|nasılsınız|nasilsin|teşekkür\w*|tesekkur\w*|iyi günler|günaydın|bugün|güzel|evet|hayır|lütfen|tamam|neden|seni|ben|sen)\b/gi,
    },
    {
      lang: 'ro-RO',
      diacritics: /[șțăâî]/i,
      words: /\b(bună|mulțumesc|ce mai faci|sunt|foarte|bine)\b/gi,
    },
    {
      lang: 'vi-VN',
      diacritics: /[đơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỷỹỵ]/i,
      words: /\b(chào|cảm ơn|bạn|khỏe không|tôi)\b/gi,
    },
    {
      lang: 'uz-UZ',
      words: /\b(salom|assalomu|alaykum|qalay\w*|qanday\w*|yaxshi\w*|rahmat|men|sen|siz|nima|o'zbek\w*|o‘zbek\w*|gaplash\w*|bugun|ertaga|uchun|bilan|kerak|juda|haqida|iltimos|kechirasiz|yordam|soat|nechada|bor|yo'q|bormi)\b/gi,
    },
    {
      lang: 'es-ES',
      diacritics: /[ñ¿¡]/i,
      words: /\b(hola|buenos|buenas|gracias|como estas|cómo estás|qué|cómo|por favor|amigo|hablar|estoy|muy bien)\b/gi,
    },
    {
      lang: 'fr-FR',
      diacritics: /[àâçéèêëîïôùûüÿœæ]/i,
      words: /\b(bonjour|salut|merci|ça va|comment|s'il vous plaît|je suis|avec|pourquoi|parler|beaucoup)\b/gi,
    },
    {
      lang: 'de-DE',
      diacritics: /[äöüß]/i,
      words: /\b(hallo|guten|danke|wie geht|ich bin|tschüss|bitte|warum|heute|sprechen|sehr gut)\b/gi,
    },
    {
      lang: 'it-IT',
      words: /\b(ciao|grazie|buongiorno|buonasera|come stai|per favore|sono|molto bene|parlare)\b/gi,
    },
    {
      lang: 'pt-BR',
      diacritics: /[ãõç]/i,
      words: /\b(olá|oi|obrigado|obrigada|tudo bem|bom dia|boa tarde|você|falar|muito)\b/gi,
    },
    {
      lang: 'id-ID',
      words: /\b(apa kabar|terima kasih|selamat pagi|selamat siang|selamat malam|saya|kamu|hari ini|bagaimana)\b/gi,
    },
    {
      lang: 'fi-FI',
      words: /\b(moi|hei|kiitos|hyvää|mitä kuuluu|minä|sinä)\b/gi,
    },
    {
      lang: 'sv-SE',
      words: /\b(hej|tack|hur mår du|god morgon|jag|du)\b/gi,
    },
    {
      lang: 'sw-KE',
      words: /\b(jambo|habari|asante|nzuri|mambo|sana)\b/gi,
    },
    {
      lang: 'nl-NL',
      words: /\b(bedankt|goedemorgen|hoe gaat het|alsjeblieft|ik ben|dank je)\b/gi,
    },
    {
      lang: 'en-US',
      words: /\b(hello|hi|hey|how are you|good morning|good evening|good afternoon|thank you|thanks|please|my name|i am|i'm|what is|who are you|can you|do you|let's|actually|today|tomorrow|about|tell me|check|English|means|help|need|would|could|should|really|great|sorry|deadline|meeting|project|deployment|fixed|bug|schedule|presentation|report|email|office|coffee)\b/gi,
    },
  ];

  for (const matcher of latinMatchers) {
    const wordHits = countPatternTokens(trimmed, matcher.words);
    const diacriticHits = matcher.diacritics
      ? countPatternTokens(trimmed, matcher.diacritics)
      : 0;
    if (wordHits > 0 || diacriticHits > 0) {
      addScore(matcher.lang, wordHits * 6 + diacriticHits * 4);
    }
  }

  // Fallback weak Latin signal if no strong markers matched
  if (candidates.size === 0 && /[a-zA-Z]/.test(trimmed)) {
    return {
      language: 'en-US',
      confident: false,
      isAmbiguous,
      isMixed: false,
    };
  }

  const ranked = [...candidates.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) {
    return { language: null, confident: false, isAmbiguous: true, isMixed: false };
  }

  const [topLang, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] ?? 0;
  const isMixed = ranked.length >= 2 && secondScore >= 4;

  // Confident when non-ambiguous AND either clear lead or native non-Latin script without near tie
  let confident = !isAmbiguous && topScore >= 5;
  if (topLang === 'ru-RU') {
    const hasRuMarkers =
      /(?:^|\P{L})(привет|здравствуй\p{L}*|спасибо|пожалуйста|как\s+дела|меня\s+зовут|хорошо|давай|что|это|очень|сегодня|почему|я\s+|мы\s+|ты\s+)(?=$|\P{L})/iu.test(
        trimmed
      ) || cyrillicChars >= 8;
    confident = !isAmbiguous && hasRuMarkers;
  }
  if (isMixed && topScore - secondScore <= 2) {
    // Near tie in mixed-language phrase -> let AI / model clarify dominant language
    confident = false;
  }

  return {
    language: topLang,
    confident,
    isAmbiguous,
    isMixed,
  };
}

export function inferInitialLanguageWithConfidence(text: string): {
  language: string | null;
  confident: boolean;
} {
  const res = inferDominantLanguageWithConfidence(text);
  return { language: res.language, confident: res.confident };
}

/**
 * Infers language from a text sample.
 */
export function inferInitialLanguageFromText(text: string): string | null {
  return inferDominantLanguageWithConfidence(text).language;
}

function getBaseLang(tag?: string | null): string {
  return (tag || '').split('-')[0].toLowerCase();
}

/**
 * Strict First-Language Lock + Command-Only Switching across ALL world languages:
 * - On the user's first spoken/written message (`currentLanguage === null`), detects ANY world language
 *   from the user's voice/text and locks onto it.
 * - Once locked, NEVER switches automatically on background/foreign speech.
 * - Switches STRICTLY ONLY when the user gives an explicit command to change languages.
 * - Flags foreign non-locked voice speech (`shouldIgnoreForeignSpeech`) so NOVA does not react to it.
 */
export function resolveNextConversationLanguage(params: {
  currentLanguage: string | null;
  userText?: string;
  modelDetectedLanguage?: string | null;
  modelExplicitSwitchLanguage?: string | null;
  allowModelSwitchWithoutRegex?: boolean;
}): {
  language: string | null;
  lockedLanguage: string | null;
  didSwitch: boolean;
  shouldIgnoreForeignSpeech: boolean;
} {
  const current = normalizeToBcp47(params.currentLanguage);
  const text = (params.userText || '').trim();

  // 1. Explicit user command to switch to ANY world language ALWAYS executes strictly
  if (text) {
    const explicitFromText = detectExplicitLanguageSwitch(text);
    if (explicitFromText) {
      return {
        language: explicitFromText,
        lockedLanguage: explicitFromText,
        didSwitch: explicitFromText !== current,
        shouldIgnoreForeignSpeech: false,
      };
    }
  }

  const explicitFromModel = normalizeToBcp47(params.modelExplicitSwitchLanguage);
  if (
    explicitFromModel &&
    (!text ||
      (!isAmbiguousShortUtterance(text) &&
        (params.allowModelSwitchWithoutRegex ||
          hasExplicitLanguageSwitchIntent(text) ||
          !current)))
  ) {
    return {
      language: explicitFromModel,
      lockedLanguage: explicitFromModel,
      didSwitch: explicitFromModel !== current,
      shouldIgnoreForeignSpeech: false,
    };
  }

  const fromModel = normalizeToBcp47(params.modelDetectedLanguage);
  const dominant = text
    ? inferDominantLanguageWithConfidence(text)
    : { language: null, confident: false, isAmbiguous: true, isMixed: false };

  // 2. If a language is ALREADY locked, NEVER switch automatically and flag foreign non-command speech
  if (current) {
    const currentBase = getBaseLang(current);
    const nativeCheckTarget = text ? detectNativeCheckRequest(text) : null;

    if (text && isAmbiguousShortUtterance(text)) {
      return {
        language: current,
        lockedLanguage: current,
        didSwitch: false,
        shouldIgnoreForeignSpeech: false,
      };
    }

    let incomingLang: string | null = null;
    let incomingConfident = false;
    if (dominant.language && dominant.confident) {
      incomingLang = dominant.language;
      incomingConfident = true;
    } else if (fromModel && !dominant.isAmbiguous) {
      incomingLang = fromModel;
      incomingConfident = true;
    }

    const isDifferentLanguage =
      incomingConfident &&
      incomingLang !== null &&
      getBaseLang(incomingLang) !== currentBase &&
      !dominant.isMixed &&
      !nativeCheckTarget;

    return {
      language: current,
      lockedLanguage: current,
      didSwitch: false,
      shouldIgnoreForeignSpeech: Boolean(isDifferentLanguage),
    };
  }

  // 3. No language locked yet: first spoken/written phrase locks onto ANY world language
  if (text && isAmbiguousShortUtterance(text) && !dominant.confident) {
    return {
      language: null,
      lockedLanguage: null,
      didSwitch: false,
      shouldIgnoreForeignSpeech: false,
    };
  }

  let initialLock: string | null = null;
  if (dominant.language && dominant.confident) {
    if (fromModel && fromModel !== dominant.language && !dominant.isMixed) {
      const isGenericCyrillic =
        dominant.language === 'ru-RU' &&
        !/\b(привет|здравствуй\w*|спасибо|пожалуйста|хорошо|давай|сегодня|меня зовут)\b/i.test(text);
      initialLock = isGenericCyrillic ? fromModel : dominant.language;
    } else {
      initialLock = dominant.language;
    }
  } else if (fromModel && (!text || !dominant.isAmbiguous)) {
    initialLock = fromModel;
  } else if (dominant.language && !dominant.isAmbiguous) {
    initialLock = dominant.language;
  }

  return {
    language: initialLock,
    lockedLanguage: initialLock,
    didSwitch: Boolean(initialLock),
    shouldIgnoreForeignSpeech: false,
  };
}

/**
 * Backward-compatible alias for resolveNextConversationLanguage.
 */
export function resolveNextLockedLanguage(params: {
  currentLockedLanguage: string | null;
  userText?: string;
  modelDetectedLanguage?: string | null;
  modelExplicitSwitchLanguage?: string | null;
}): {
  lockedLanguage: string | null;
  didSwitch: boolean;
  shouldIgnoreForeignSpeech: boolean;
} {
  const next = resolveNextConversationLanguage({
    currentLanguage: params.currentLockedLanguage,
    userText: params.userText,
    modelDetectedLanguage: params.modelDetectedLanguage,
    modelExplicitSwitchLanguage: params.modelExplicitSwitchLanguage,
  });
  return {
    lockedLanguage: next.lockedLanguage,
    didSwitch: next.didSwitch,
    shouldIgnoreForeignSpeech: next.shouldIgnoreForeignSpeech,
  };
}

/**
 * Identifies the exact language of a specific message when pressing Listen.
 * Never lets a stale conversation language override clear message script/vocabulary
 * (e.g. Russian text is always ru-RU, Uzbek text is always uz-UZ).
 */
export function resolveMessagePlaybackLanguage(
  content: string,
  storedLanguage?: string | null,
  fallbackLanguage?: string | null
): string {
  const detected = inferDominantLanguageWithConfidence(content);
  if (detected.language && detected.confident) {
    return detected.language;
  }
  const normalizedStored = normalizeToBcp47(storedLanguage);
  if (normalizedStored) {
    return normalizedStored;
  }
  if (detected.language && !detected.isAmbiguous) {
    return detected.language;
  }
  return normalizeToBcp47(fallbackLanguage) || 'en-US';
}
