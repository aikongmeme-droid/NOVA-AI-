export interface TelegramWebAppUser {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebAppBridge {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
  };
  ready?: () => void;
  expand?: () => void;
  openInvoice?: (url: string, callback?: (status: string) => void) => void;
  openTelegramLink?: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebAppBridge;
    };
  }
}

const STORAGE_UID_KEY = 'nova_ai_user_id_v1';
const STORAGE_TOKEN_KEY = 'nova_ai_session_token_v1';

export function getTelegramWebApp(): TelegramWebAppBridge | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

function generateWebUserId(): string {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `web_${rand}`;
}

export function getStoredSessionToken(userId: string): string {
  try {
    const raw = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { userId?: string; token?: string };
    if (parsed.userId === userId && typeof parsed.token === 'string') {
      return parsed.token;
    }
    return '';
  } catch {
    return '';
  }
}

export function setStoredSessionToken(userId: string, token: string): void {
  try {
    localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify({ userId, token }));
  } catch {
    // ignore storage errors
  }
}

export function rotateWebIdentity(): {
  userId: string;
  tgInitData: string;
  sessionToken: string;
  tzOffsetMinutes: number;
  isTelegramMiniApp: boolean;
} {
  const nextId = generateWebUserId();
  try {
    localStorage.setItem(STORAGE_UID_KEY, nextId);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  } catch {
    // ignore
  }
  return {
    userId: nextId,
    tgInitData: '',
    sessionToken: '',
    tzOffsetMinutes: new Date().getTimezoneOffset(),
    isTelegramMiniApp: false,
  };
}

export function getClientIdentity(): {
  userId: string;
  tgInitData: string;
  sessionToken: string;
  tzOffsetMinutes: number;
  isTelegramMiniApp: boolean;
} {
  const tg = getTelegramWebApp();
  const tgInitData = tg?.initData || '';
  const tgUser = tg?.initDataUnsafe?.user;
  const tzOffsetMinutes = new Date().getTimezoneOffset();

  if (tgUser?.id && tgInitData) {
    const userId = `tg_${tgUser.id}`;
    return {
      userId,
      tgInitData,
      sessionToken: getStoredSessionToken(userId),
      tzOffsetMinutes,
      isTelegramMiniApp: true,
    };
  }

  let stored = '';
  try {
    stored = localStorage.getItem(STORAGE_UID_KEY) || '';
    if (!stored || stored.startsWith('tg_') || stored.startsWith('guest')) {
      stored = generateWebUserId();
      localStorage.setItem(STORAGE_UID_KEY, stored);
    }
  } catch {
    stored = generateWebUserId();
  }

  return {
    userId: stored,
    tgInitData: '',
    sessionToken: getStoredSessionToken(stored),
    tzOffsetMinutes,
    isTelegramMiniApp: false,
  };
}
