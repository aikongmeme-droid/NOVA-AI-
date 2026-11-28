export const MIN_USER_MESSAGE_LENGTH = 2;

export interface SanitizedUserMessage {
  valid: boolean;
  cleanText: string;
}

/**
 * Trims surrounding whitespace and rejects empty or single-character noise (< 2 chars).
 */
export function sanitizeUserMessage(
  text?: string | null
): SanitizedUserMessage {
  const cleanText = (text ?? '').trim();
  if (cleanText.length < MIN_USER_MESSAGE_LENGTH) {
    return { valid: false, cleanText };
  }
  return { valid: true, cleanText };
}

/**
 * Filters short noise/phrases before forwarding to the AI model pipeline.
 */
export function handleUserMessage(
  text: string,
  processModelRequest: (cleanText: string) => void
): boolean {
  const { valid, cleanText } = sanitizeUserMessage(text);
  if (!valid) {
    console.log('Short or silent audio ignored');
    return false;
  }
  processModelRequest(cleanText);
  return true;
}
