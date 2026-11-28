import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_FREE_SECONDS,
  STAR_PACKAGES,
  canActivateMicrophone,
  deductUsageSeconds,
  formatCountdownSeconds,
  getLocalDateKey,
  getStarPackage,
  refreshDailyAllowance,
  resolveNovaMode,
} from './billing';

test('one-time 30-minute free allowance never resets automatically on a new day', () => {
  assert.equal(DAILY_FREE_SECONDS, 1800);
  const exhausted = {
    userId: 'u1',
    lastResetDate: '2026-11-15',
    freeSecondsRemaining: 0,
    paidSecondsRemaining: 0,
  };

  const nextDay = refreshDailyAllowance(exhausted, '2026-11-16');
  assert.equal(nextDay.freeSecondsRemaining, 0);
  assert.equal(nextDay.paidSecondsRemaining, 0);
  assert.equal(canActivateMicrophone(nextDay), false);

  const afterPayment = {
    ...nextDay,
    paidSecondsRemaining: 3000,
  };
  assert.equal(canActivateMicrophone(afterPayment), true);
  assert.equal(resolveNovaMode(afterPayment), 'VOICE_PAID');
});

test('deductUsageSeconds consumes free seconds first, then paid seconds, and never goes negative', () => {
  const initial = {
    userId: 'u1',
    lastResetDate: '2026-11-16',
    freeSecondsRemaining: 10,
    paidSecondsRemaining: 25,
  };

  const step1 = deductUsageSeconds(initial, 15);
  assert.equal(step1.deductedSeconds, 15);
  assert.equal(step1.nextBalance.freeSecondsRemaining, 0);
  assert.equal(step1.nextBalance.paidSecondsRemaining, 20);
  assert.equal(step1.exhausted, false);

  const step2 = deductUsageSeconds(step1.nextBalance, 50);
  assert.equal(step2.deductedSeconds, 20);
  assert.equal(step2.nextBalance.freeSecondsRemaining, 0);
  assert.equal(step2.nextBalance.paidSecondsRemaining, 0);
  assert.equal(step2.exhausted, true);

  const zeroDeduct = deductUsageSeconds(initial, 0);
  assert.equal(zeroDeduct.deductedSeconds, 0);
  assert.equal(zeroDeduct.nextBalance.freeSecondsRemaining, 10);
});

test('resolveNovaMode and canActivateMicrophone enforce payment after 30 free minutes end', () => {
  const freeActive = { freeSecondsRemaining: 1800, paidSecondsRemaining: 0 };
  const exhausted = { freeSecondsRemaining: 0, paidSecondsRemaining: 0 };
  const paidActive = { freeSecondsRemaining: 0, paidSecondsRemaining: 6000 };

  assert.equal(resolveNovaMode(freeActive), 'VOICE_FREE');
  assert.equal(canActivateMicrophone(freeActive), true);

  assert.equal(resolveNovaMode(exhausted), 'TEXT_ONLY');
  assert.equal(canActivateMicrophone(exhausted), false);

  assert.equal(resolveNovaMode(paidActive), 'VOICE_PAID');
  assert.equal(canActivateMicrophone(paidActive), true);
});

test('STAR_PACKAGES defines exact Stars-only packages (+50m · 50★ and +100m · 100★)', () => {
  assert.equal(STAR_PACKAGES.length, 2);
  const p50 = getStarPackage('pack_50');
  assert.ok(p50);
  assert.equal(p50.minutes, 50);
  assert.equal(p50.seconds, 3000);
  assert.equal(p50.stars, 50);
  assert.equal(p50.label, '+50m · 50★');

  const p100 = getStarPackage('pack_100');
  assert.ok(p100);
  assert.equal(p100.minutes, 100);
  assert.equal(p100.seconds, 6000);
  assert.equal(p100.stars, 100);
  assert.equal(p100.label, '+100m · 100★');

  assert.equal(getStarPackage('unknown'), null);
});

test('formatCountdownSeconds formats MM:SS and HH:MM:SS cleanly', () => {
  assert.equal(formatCountdownSeconds(1800), '30:00');
  assert.equal(formatCountdownSeconds(65), '01:05');
  assert.equal(formatCountdownSeconds(0), '00:00');
  assert.equal(formatCountdownSeconds(3661), '01:01:01');
});

test('getLocalDateKey clamps invalid timezone offsets safely', () => {
  const date = new Date('2026-11-16T12:00:00Z');
  assert.equal(getLocalDateKey(0, date), '2026-11-16');
  assert.equal(getLocalDateKey(-99999, date), '2026-11-17');
});
