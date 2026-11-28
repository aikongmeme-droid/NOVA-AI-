import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  DAILY_FREE_SECONDS,
  UsageBalanceState,
  deductUsageSeconds,
  getLocalDateKey,
  refreshDailyAllowance,
} from '../src/shared/billing';
import {
  DEFAULT_PERSONALITY_TRAITS,
  type PersonalityArchetypeId,
  type PersonalityTraits,
  normalizePersonalityArchetype,
  parsePersonalityTraits,
} from '../src/shared/personality';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'nova.db');
export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS user_balances (
    user_id TEXT PRIMARY KEY,
    last_reset_date TEXT NOT NULL,
    free_seconds_remaining INTEGER NOT NULL,
    paid_seconds_remaining INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    memory_enabled INTEGER NOT NULL DEFAULT 1,
    subtitles_enabled INTEGER NOT NULL DEFAULT 1,
    locked_language TEXT,
    personality_archetype TEXT NOT NULL DEFAULT 'adaptive',
    personality_traits TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    language TEXT,
    emotion TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_user_created
    ON messages(user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    fact TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, fact)
  );

  CREATE TABLE IF NOT EXISTS payment_orders (
    order_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    usd_amount REAL NOT NULL,
    minutes INTEGER NOT NULL,
    seconds INTEGER NOT NULL,
    stars_amount INTEGER NOT NULL,
    star_usd_rate REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'paid', 'failed')),
    invoice_url TEXT,
    telegram_charge_id TEXT UNIQUE,
    created_at INTEGER NOT NULL,
    paid_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS processed_charges (
    telegram_charge_id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    processed_at INTEGER NOT NULL
  );
`);

// Ensure new settings columns exist for pre-existing databases
const settingsColumns = db
  .prepare(`PRAGMA table_info(user_settings)`)
  .all() as Array<{ name: string }>;
if (!settingsColumns.some((c) => c.name === 'locked_language')) {
  db.exec(`ALTER TABLE user_settings ADD COLUMN locked_language TEXT`);
}
if (!settingsColumns.some((c) => c.name === 'personality_archetype')) {
  db.exec(`ALTER TABLE user_settings ADD COLUMN personality_archetype TEXT NOT NULL DEFAULT 'adaptive'`);
}
if (!settingsColumns.some((c) => c.name === 'personality_traits')) {
  db.exec(`ALTER TABLE user_settings ADD COLUMN personality_traits TEXT NOT NULL DEFAULT ''`);
}

export interface StoredMessage {
  id: number;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  language: string | null;
  emotion: string | null;
  createdAt: number;
}

export interface StoredMemory {
  id: number;
  fact: string;
  createdAt: number;
}

export interface UserSettings {
  memoryEnabled: boolean;
  subtitlesEnabled: boolean;
  lockedLanguage: string | null;
  personalityArchetype: PersonalityArchetypeId;
  personalityTraits: PersonalityTraits;
}

export interface PaymentOrder {
  orderId: string;
  userId: string;
  minutes: number;
  seconds: number;
  starsAmount: number;
  status: 'pending' | 'paid' | 'failed';
  invoiceUrl: string | null;
  telegramChargeId: string | null;
  createdAt: number;
  paidAt: number | null;
}

export function userExistsInDb(userId: string): boolean {
  const row = db
    .prepare(
      `SELECT 1 AS found FROM user_balances WHERE user_id = ?
       UNION ALL SELECT 1 FROM user_settings WHERE user_id = ?
       UNION ALL SELECT 1 FROM messages WHERE user_id = ?
       UNION ALL SELECT 1 FROM memories WHERE user_id = ?
       UNION ALL SELECT 1 FROM payment_orders WHERE user_id = ?
       LIMIT 1`
    )
    .get(userId, userId, userId, userId, userId) as { found: number } | undefined;
  return Boolean(row?.found);
}

export function getOrRefreshUserBalance(
  userId: string,
  tzOffsetMinutes = 0
): UsageBalanceState & { totalSecondsRemaining: number } {
  const dateKey = getLocalDateKey(tzOffsetMinutes);
  const existing = db
    .prepare(
      `SELECT user_id, last_reset_date, free_seconds_remaining, paid_seconds_remaining
       FROM user_balances WHERE user_id = ?`
    )
    .get(userId) as
    | {
        user_id: string;
        last_reset_date: string;
        free_seconds_remaining: number;
        paid_seconds_remaining: number;
      }
    | undefined;

  if (!existing) {
    const now = Date.now();
    db.prepare(
      `INSERT INTO user_balances (user_id, last_reset_date, free_seconds_remaining, paid_seconds_remaining, updated_at)
       VALUES (?, ?, ?, 0, ?)`
    ).run(userId, dateKey, DAILY_FREE_SECONDS, now);

    return {
      userId,
      lastResetDate: dateKey,
      freeSecondsRemaining: DAILY_FREE_SECONDS,
      paidSecondsRemaining: 0,
      totalSecondsRemaining: DAILY_FREE_SECONDS,
    };
  }

  const currentState: UsageBalanceState = {
    userId: existing.user_id,
    lastResetDate: existing.last_reset_date,
    freeSecondsRemaining: existing.free_seconds_remaining,
    paidSecondsRemaining: existing.paid_seconds_remaining,
  };

  const refreshed = refreshDailyAllowance(currentState, dateKey);
  if (
    refreshed.lastResetDate !== currentState.lastResetDate ||
    refreshed.freeSecondsRemaining !== currentState.freeSecondsRemaining
  ) {
    db.prepare(
      `UPDATE user_balances
       SET last_reset_date = ?, free_seconds_remaining = ?, updated_at = ?
       WHERE user_id = ?`
    ).run(refreshed.lastResetDate, refreshed.freeSecondsRemaining, Date.now(), userId);
  }

  return {
    ...refreshed,
    totalSecondsRemaining: refreshed.freeSecondsRemaining + refreshed.paidSecondsRemaining,
  };
}

export function applyUsageTick(
  userId: string,
  elapsedSeconds: number,
  tzOffsetMinutes = 0
): UsageBalanceState & { totalSecondsRemaining: number; exhausted: boolean } {
  const current = getOrRefreshUserBalance(userId, tzOffsetMinutes);
  const { nextBalance, exhausted } = deductUsageSeconds(current, elapsedSeconds);

  db.prepare(
    `UPDATE user_balances
     SET free_seconds_remaining = ?, paid_seconds_remaining = ?, updated_at = ?
     WHERE user_id = ?`
  ).run(
    nextBalance.freeSecondsRemaining,
    nextBalance.paidSecondsRemaining,
    Date.now(),
    userId
  );

  return {
    ...nextBalance,
    totalSecondsRemaining: nextBalance.freeSecondsRemaining + nextBalance.paidSecondsRemaining,
    exhausted,
  };
}

export function getUserSettings(userId: string): UserSettings {
  const row = db
    .prepare(
      `SELECT memory_enabled, subtitles_enabled, locked_language, personality_archetype, personality_traits
       FROM user_settings WHERE user_id = ?`
    )
    .get(userId) as
    | {
        memory_enabled: number;
        subtitles_enabled: number;
        locked_language: string | null;
        personality_archetype: string | null;
        personality_traits: string | null;
      }
    | undefined;

  if (!row) {
    const defaultTraitsJson = JSON.stringify(DEFAULT_PERSONALITY_TRAITS);
    db.prepare(
      `INSERT INTO user_settings (user_id, memory_enabled, subtitles_enabled, locked_language, personality_archetype, personality_traits, updated_at)
       VALUES (?, 1, 1, NULL, 'adaptive', ?, ?)`
    ).run(userId, defaultTraitsJson, Date.now());
    return {
      memoryEnabled: true,
      subtitlesEnabled: true,
      lockedLanguage: null,
      personalityArchetype: 'adaptive',
      personalityTraits: { ...DEFAULT_PERSONALITY_TRAITS },
    };
  }

  return {
    memoryEnabled: row.memory_enabled === 1,
    subtitlesEnabled: row.subtitles_enabled === 1,
    lockedLanguage: row.locked_language ?? null,
    personalityArchetype: normalizePersonalityArchetype(row.personality_archetype),
    personalityTraits: parsePersonalityTraits(row.personality_traits),
  };
}

export function updateUserSettings(
  userId: string,
  patch: Partial<UserSettings>
): UserSettings {
  const current = getUserSettings(userId);
  const next: UserSettings = {
    memoryEnabled: patch.memoryEnabled ?? current.memoryEnabled,
    subtitlesEnabled: patch.subtitlesEnabled ?? current.subtitlesEnabled,
    lockedLanguage:
      patch.lockedLanguage !== undefined
        ? patch.lockedLanguage
        : current.lockedLanguage,
    personalityArchetype:
      patch.personalityArchetype !== undefined
        ? normalizePersonalityArchetype(patch.personalityArchetype)
        : current.personalityArchetype,
    personalityTraits:
      patch.personalityTraits !== undefined
        ? parsePersonalityTraits(patch.personalityTraits)
        : current.personalityTraits,
  };

  db.prepare(
    `INSERT INTO user_settings (user_id, memory_enabled, subtitles_enabled, locked_language, personality_archetype, personality_traits, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       memory_enabled = excluded.memory_enabled,
       subtitles_enabled = excluded.subtitles_enabled,
       locked_language = excluded.locked_language,
       personality_archetype = excluded.personality_archetype,
       personality_traits = excluded.personality_traits,
       updated_at = excluded.updated_at`
  ).run(
    userId,
    next.memoryEnabled ? 1 : 0,
    next.subtitlesEnabled ? 1 : 0,
    next.lockedLanguage,
    next.personalityArchetype,
    JSON.stringify(next.personalityTraits),
    Date.now()
  );

  return next;
}

export function appendMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  language?: string | null,
  emotion?: string | null
): StoredMessage {
  const createdAt = Date.now();
  const res = db
    .prepare(
      `INSERT INTO messages (user_id, role, content, language, emotion, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(userId, role, content, language ?? null, emotion ?? null, createdAt);

  return {
    id: Number(res.lastInsertRowid),
    userId,
    role,
    content,
    language: language ?? null,
    emotion: emotion ?? null,
    createdAt,
  };
}

export function getRecentMessages(userId: string, limit = 30): StoredMessage[] {
  const rows = db
    .prepare(
      `SELECT id, user_id, role, content, language, emotion, created_at
       FROM messages
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`
    )
    .all(userId, limit) as Array<{
    id: number;
    user_id: string;
    role: 'user' | 'assistant';
    content: string;
    language: string | null;
    emotion: string | null;
    created_at: number;
  }>;

  return rows
    .reverse()
    .map((r) => ({
      id: r.id,
      userId: r.user_id,
      role: r.role,
      content: r.content,
      language: r.language,
      emotion: r.emotion,
      createdAt: r.created_at,
    }));
}

export function getUserMemories(userId: string, limit = 25): StoredMemory[] {
  const rows = db
    .prepare(
      `SELECT id, fact, created_at FROM memories
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(userId, limit) as Array<{ id: number; fact: string; created_at: number }>;

  return rows.map((r) => ({
    id: r.id,
    fact: r.fact,
    createdAt: r.created_at,
  }));
}

export function addUserMemoryFact(userId: string, fact: string): void {
  const trimmed = fact.trim();
  if (!trimmed) return;
  db.prepare(
    `INSERT OR IGNORE INTO memories (user_id, fact, created_at)
     VALUES (?, ?, ?)`
  ).run(userId, trimmed, Date.now());
}

export function clearUserHistoryAndMemory(userId: string): void {
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`DELETE FROM messages WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM memories WHERE user_id = ?`).run(userId);
    db.prepare(`UPDATE user_settings SET locked_language = NULL WHERE user_id = ?`).run(
      userId
    );
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function createPaymentOrder(order: {
  orderId: string;
  userId: string;
  minutes: number;
  seconds: number;
  starsAmount: number;
  invoiceUrl: string | null;
}): PaymentOrder {
  const now = Date.now();
  db.prepare(
    `INSERT INTO payment_orders (
       order_id, user_id, usd_amount, minutes, seconds, stars_amount,
       star_usd_rate, status, invoice_url, created_at
     ) VALUES (?, ?, 0, ?, ?, ?, 0, 'pending', ?, ?)`
  ).run(
    order.orderId,
    order.userId,
    order.minutes,
    order.seconds,
    order.starsAmount,
    order.invoiceUrl,
    now
  );

  return {
    ...order,
    status: 'pending',
    telegramChargeId: null,
    createdAt: now,
    paidAt: null,
  };
}

export function updatePaymentOrderInvoiceUrl(orderId: string, invoiceUrl: string): void {
  db.prepare(`UPDATE payment_orders SET invoice_url = ? WHERE order_id = ?`).run(
    invoiceUrl,
    orderId
  );
}

export function getPaymentOrder(orderId: string): PaymentOrder | null {
  const row = db
    .prepare(`SELECT * FROM payment_orders WHERE order_id = ?`)
    .get(orderId) as
    | {
        order_id: string;
        user_id: string;
        minutes: number;
        seconds: number;
        stars_amount: number;
        status: 'pending' | 'paid' | 'failed';
        invoice_url: string | null;
        telegram_charge_id: string | null;
        created_at: number;
        paid_at: number | null;
      }
    | undefined;

  if (!row) return null;
  return {
    orderId: row.order_id,
    userId: row.user_id,
    minutes: row.minutes,
    seconds: row.seconds,
    starsAmount: row.stars_amount,
    status: row.status,
    invoiceUrl: row.invoice_url,
    telegramChargeId: row.telegram_charge_id,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

export function creditPaidMinutesAtomic(params: {
  orderId: string;
  telegramChargeId: string;
  paidStarsAmount: number;
  tzOffsetMinutes?: number;
}): {
  credited: boolean;
  alreadyProcessed: boolean;
  reason?: string;
  order?: PaymentOrder;
} {
  const { orderId, telegramChargeId, paidStarsAmount, tzOffsetMinutes = 0 } = params;

  // Ensure balance row exists before transaction
  const orderPre = getPaymentOrder(orderId);
  if (!orderPre) {
    return { credited: false, alreadyProcessed: false, reason: 'ORDER_NOT_FOUND' };
  }
  getOrRefreshUserBalance(orderPre.userId, tzOffsetMinutes);

  db.exec('BEGIN IMMEDIATE');
  try {
    const existingCharge = db
      .prepare(`SELECT order_id FROM processed_charges WHERE telegram_charge_id = ?`)
      .get(telegramChargeId) as { order_id: string } | undefined;

    if (existingCharge) {
      db.exec('ROLLBACK');
      return {
        credited: false,
        alreadyProcessed: true,
        order: getPaymentOrder(orderId) ?? undefined,
      };
    }

    const order = db
      .prepare(`SELECT * FROM payment_orders WHERE order_id = ?`)
      .get(orderId) as
      | {
          order_id: string;
          user_id: string;
          seconds: number;
          stars_amount: number;
          status: string;
        }
      | undefined;

    if (!order) {
      db.exec('ROLLBACK');
      return { credited: false, alreadyProcessed: false, reason: 'ORDER_NOT_FOUND' };
    }

    if (order.status === 'paid') {
      db.exec('ROLLBACK');
      return {
        credited: false,
        alreadyProcessed: true,
        order: getPaymentOrder(orderId) ?? undefined,
      };
    }

    if (paidStarsAmount < order.stars_amount) {
      db.exec('ROLLBACK');
      return { credited: false, alreadyProcessed: false, reason: 'INSUFFICIENT_STARS_AMOUNT' };
    }

    const now = Date.now();
    db.prepare(
      `INSERT INTO processed_charges (telegram_charge_id, order_id, user_id, processed_at)
       VALUES (?, ?, ?, ?)`
    ).run(telegramChargeId, orderId, order.user_id, now);

    db.prepare(
      `UPDATE payment_orders
       SET status = 'paid', telegram_charge_id = ?, paid_at = ?
       WHERE order_id = ?`
    ).run(telegramChargeId, now, orderId);

    db.prepare(
      `UPDATE user_balances
       SET paid_seconds_remaining = paid_seconds_remaining + ?, updated_at = ?
       WHERE user_id = ?`
    ).run(order.seconds, now, order.user_id);

    db.exec('COMMIT');

    return {
      credited: true,
      alreadyProcessed: false,
      order: getPaymentOrder(orderId) ?? undefined,
    };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
