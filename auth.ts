import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SECRET_FILE = path.join(DATA_DIR, '.session_secret');

function loadOrCreateSecret(): string {
  const envSecret = process.env.NOVA_SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SECRET_FILE)) {
      const existing = fs.readFileSync(SECRET_FILE, 'utf8').trim();
      if (existing.length >= 32) {
        return existing;
      }
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, generated, { mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const SESSION_SECRET = loadOrCreateSecret();

export function signSessionToken(userId: string): string {
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(userId)
    .digest('hex');
  return `${userId}.${sig}`;
}

export function verifySessionToken(token?: string | null): string | null {
  if (!token || typeof token !== 'string') return null;
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx <= 0) return null;

  const userId = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  if (!userId || !/^[a-f0-9]{64}$/i.test(providedSig)) {
    return null;
  }

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(userId)
    .digest('hex');

  const providedBuf = Buffer.from(providedSig.toLowerCase(), 'utf8');
  const expectedBuf = Buffer.from(expectedSig.toLowerCase(), 'utf8');
  if (providedBuf.length !== expectedBuf.length) {
    return null;
  }
  return crypto.timingSafeEqual(providedBuf, expectedBuf) ? userId : null;
}

export function isValidNewWebUserId(rawUserId?: string | null): boolean {
  if (!rawUserId || typeof rawUserId !== 'string') return false;
  const trimmed = rawUserId.trim();
  if (trimmed.startsWith('tg_') || trimmed.startsWith('guest')) {
    return false;
  }
  return /^(?:web_[a-zA-Z0-9_-]{8,60}|usr_[a-zA-Z0-9_-]{6,60})$/.test(trimmed);
}

export function timingSafeEqualStrings(
  a?: string | null,
  b?: string | null
): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) {
    return false;
  }
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const lastTickTimestampByUser = new Map<string, number>();

/**
 * Clamps client-reported elapsed seconds against wall-clock time since the previous tick
 * so rapid-fire/burst requests cannot accidentally or maliciously double-deduct seconds.
 */
export function clampElapsedTickSeconds(
  userId: string,
  requestedSeconds: number,
  nowMs = Date.now()
): number {
  const safeReq = Math.max(0, Math.min(30, Math.floor(Number(requestedSeconds) || 0)));
  if (safeReq === 0) return 0;

  const prevMs = lastTickTimestampByUser.get(userId);
  if (prevMs === undefined) {
    lastTickTimestampByUser.set(userId, nowMs);
    return Math.min(safeReq, 10);
  }

  const elapsedRealSeconds = Math.floor(Math.max(0, nowMs - prevMs) / 1000);
  // Allow 1s clock jitter tolerance; if < 1s since last tick, deduct 0 to stop duplicate rapid calls
  if (elapsedRealSeconds < 1) {
    return 0;
  }

  const allowed = Math.min(safeReq, elapsedRealSeconds + 1);
  if (allowed > 0) {
    lastTickTimestampByUser.set(userId, nowMs);
  }
  return allowed;
}

export function resetTickRateLimiterForTests(userId?: string): void {
  if (userId) {
    lastTickTimestampByUser.delete(userId);
  } else {
    lastTickTimestampByUser.clear();
  }
}
