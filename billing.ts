export const DAILY_FREE_MINUTES = 30;
export const DAILY_FREE_SECONDS = DAILY_FREE_MINUTES * 60; // 1800 seconds

export type StarPackageId = 'pack_50' | 'pack_100';

export interface StarPackage {
  id: StarPackageId;
  minutes: number;
  seconds: number;
  stars: number;
  label: string;
}

export const STAR_PACKAGES: readonly StarPackage[] = [
  {
    id: 'pack_50',
    minutes: 50,
    seconds: 50 * 60,
    stars: 50,
    label: '+50m · 50★',
  },
  {
    id: 'pack_100',
    minutes: 100,
    seconds: 100 * 60,
    stars: 100,
    label: '+100m · 100★',
  },
] as const;

export function getStarPackage(packageId: string | null | undefined): StarPackage | null {
  if (!packageId) return null;
  return STAR_PACKAGES.find((pkg) => pkg.id === packageId) ?? null;
}

export interface UsageBalanceState {
  userId: string;
  lastResetDate: string;
  freeSecondsRemaining: number;
  paidSecondsRemaining: number;
}

export type NovaMode = 'VOICE_FREE' | 'VOICE_PAID' | 'TEXT_ONLY';

export function resolveNovaMode(balance: {
  freeSecondsRemaining: number;
  paidSecondsRemaining: number;
}): NovaMode {
  if (balance.freeSecondsRemaining > 0) return 'VOICE_FREE';
  if (balance.paidSecondsRemaining > 0) return 'VOICE_PAID';
  return 'TEXT_ONLY';
}

/**
 * Microphone access is enabled ONLY while free 30 minutes remain
 * or after paid minutes have been credited via verified payment.
 */
export function canActivateMicrophone(balance: {
  freeSecondsRemaining: number;
  paidSecondsRemaining: number;
}): boolean {
  return Math.max(0, balance.freeSecondsRemaining) + Math.max(0, balance.paidSecondsRemaining) > 0;
}

export function getLocalDateKey(timezoneOffsetMinutes = 0, now = new Date()): string {
  // Clamp offset to valid UTC-12..UTC+14 range to prevent client manipulation
  const clampedOffset = Math.max(-840, Math.min(720, Math.trunc(timezoneOffsetMinutes)));
  const shiftedMs = now.getTime() - clampedOffset * 60_000;
  const d = new Date(shiftedMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function refreshDailyAllowance(
  balance: UsageBalanceState,
  _currentDateKey: string
): UsageBalanceState {
  // No automatic free-time reset once the initial 30-minute free trial ends:
  // after freeSecondsRemaining reaches 0, voice/mic unlocks strictly after payment.
  return balance;
}

export function deductUsageSeconds(
  balance: UsageBalanceState,
  elapsedSeconds: number
): { nextBalance: UsageBalanceState; deductedSeconds: number; exhausted: boolean } {
  const safeElapsed = Math.max(0, Math.floor(elapsedSeconds));
  if (safeElapsed === 0) {
    const total = balance.freeSecondsRemaining + balance.paidSecondsRemaining;
    return { nextBalance: balance, deductedSeconds: 0, exhausted: total <= 0 };
  }

  let remainingToDeduct = safeElapsed;
  let free = Math.max(0, balance.freeSecondsRemaining);
  let paid = Math.max(0, balance.paidSecondsRemaining);

  const fromFree = Math.min(free, remainingToDeduct);
  free -= fromFree;
  remainingToDeduct -= fromFree;

  const fromPaid = Math.min(paid, remainingToDeduct);
  paid -= fromPaid;
  remainingToDeduct -= fromPaid;

  const deductedSeconds = fromFree + fromPaid;
  const totalLeft = free + paid;

  return {
    nextBalance: {
      ...balance,
      freeSecondsRemaining: free,
      paidSecondsRemaining: paid,
    },
    deductedSeconds,
    exhausted: totalLeft <= 0,
  };
}

export function formatCountdownSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
