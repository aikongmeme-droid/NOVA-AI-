const NON_NAME_WORDS = new Set([
  'сегодня',
  'вчера',
  'завтра',
  'очень',
  'просто',
  'сейчас',
  'тут',
  'здесь',
  'дома',
  'устал',
  'устала',
  'рада',
  'рад',
  'готов',
  'готова',
  'хорошо',
  'плохо',
  'нормально',
  'супер',
  'привет',
  'здравствуй',
  'fine',
  'good',
  'great',
  'okay',
  'ok',
  'tired',
  'happy',
  'sad',
  'here',
  'ready',
  'doing',
  'going',
  'looking',
  'trying',
  'asking',
  'sorry',
  'sure',
  'nova',
  'нова',
  'yaxshi',
  'tayyor',
  'bien',
  'mal',
  'feliz',
  'cansado',
  'cansada',
  'не',
  'да',
  'нет',
  'так',
  'уже',
  'тоже',
  'ещё',
  'еще',
  'человек',
  'робот',
  'друг',
  'подруга',
  'кто',
  'что',
  'как',
  'no',
  'yes',
  'human',
  'robot',
  'friend',
  'ai',
  'ии',
]);

function cleanCandidateName(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/[.,!?;:"'«»()]+$/g, '')
    .replace(/^[.,!?;:"'«»()]+/g, '')
    .trim();

  if (cleaned.length < 2 || cleaned.length > 28) return null;
  if (/\d/.test(cleaned)) return null;

  const words = cleaned.split(/\s+/);
  if (words.length > 2) return null;

  for (const w of words) {
    if (w.length < 2) return null;
    if (NON_NAME_WORDS.has(w.toLowerCase())) return null;
    if (!/^[\p{L}'’-]+$/u.test(w)) return null;
  }

  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const ASKED_FOR_NAME_REGEX =
  /(?:как\s+(?:тебя|вас)\s+зовут|тво[её]\s+имя|what(?:'s| is)\s+your\s+name|who\s+am\s+i\s+talking\s+to|ismingiz\s+nima|isming\s+nima|c[oó]mo\s+te\s+llamas)/iu;

/**
 * Deterministically extracts a user's name when they explicitly introduce themselves
 * (or answer a direct name question from NOVA).
 * Returns a durable memory fact like "User's name is Amir", or null if no clear introduction is present.
 */
export function extractUserNameFact(
  userText: string,
  lastAssistantMessage?: string | null
): string | null {
  const text = userText.trim();
  if (text.length < 2) return null;

  const patterns: RegExp[] = [
    /(?:меня\s+зовут|зови\s+меня|мо[её]\s+имя(?:\s*[-—:]|\s+это)?)\s+([\p{L}'’-]+(?:\s+[\p{L}'’-]+)?)/iu,
    /(?:^|[.!?,]\s*)(?:привет[,!.]?\s*)?я\s*[-—:]?\s*([\p{L}'’-]+)(?:$|[.!?,])/iu,
    /(?:my\s+name\s+is|call\s+me)\s+([A-Za-z][A-Za-z'’-]+(?:\s+[A-Za-z][A-Za-z'’-]+)?)/i,
    /(?:^|[.!?,]\s*)(?:hi|hello|hey)?[,!]?\s*(?:i\s+am|i['’]m)\s+([A-Z][a-z'’-]{1,20})(?:$|[.!?,])/i,
    /(?:mening\s+ismim|ismim)\s+([\p{L}'’-]+(?:\s+[\p{L}'’-]+)?)/iu,
    /(?:me\s+llamo|mi\s+nombre\s+es)\s+([\p{L}'’-]+(?:\s+[\p{L}'’-]+)?)/iu,
  ];

  for (const regex of patterns) {
    const match = regex.exec(text);
    if (match?.[1]) {
      const name = cleanCandidateName(match[1]);
      if (name) {
        return `User's name is ${name}`;
      }
    }
  }

  // If NOVA just asked for the user's name and the user replied directly with 1-2 words
  if (
    lastAssistantMessage &&
    ASKED_FOR_NAME_REGEX.test(lastAssistantMessage) &&
    !text.includes('?')
  ) {
    const directName = cleanCandidateName(text);
    if (directName) {
      return `User's name is ${directName}`;
    }
  }

  return null;
}

export function extractKnownUserName(memories: Array<{ fact: string }>): string | null {
  for (const m of memories) {
    const match = /User's name is\s+(.+)$/i.exec(m.fact.trim());
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}
