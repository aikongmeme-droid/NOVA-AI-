import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampElapsedTickSeconds,
  isValidNewWebUserId,
  resetTickRateLimiterForTests,
  signSessionToken,
  timingSafeEqualStrings,
  verifySessionToken,
} from './auth';

test('session tokens sign and verify per-user identity and reject tampering', () => {
  const token = signSessionToken('web_abc123456789');
  assert.equal(verifySessionToken(token), 'web_abc123456789');

  const [uid, sig] = token.split('.');
  assert.equal(verifySessionToken(`web_other999999.${sig}`), null);
  assert.equal(verifySessionToken(`${uid}.${'0'.repeat(64)}`), null);
  assert.equal(verifySessionToken('invalid'), null);
  assert.equal(verifySessionToken(null), null);
});

test('isValidNewWebUserId allows strong web/usr IDs and blocks tg_ or predictable guest IDs', () => {
  assert.equal(isValidNewWebUserId('web_9f8e7d6c5b4a3210'), true);
  assert.equal(isValidNewWebUserId('usr_custom_1234'), true);
  assert.equal(isValidNewWebUserId('tg_123456'), false);
  assert.equal(isValidNewWebUserId('guest_default'), false);
  assert.equal(isValidNewWebUserId('abc'), false);
});

test('timingSafeEqualStrings validates webhook secrets securely', () => {
  assert.equal(timingSafeEqualStrings('my-secret-123', 'my-secret-123'), true);
  assert.equal(timingSafeEqualStrings('my-secret-123', 'my-secret-124'), false);
  assert.equal(timingSafeEqualStrings('short', 'longer-secret'), false);
  assert.equal(timingSafeEqualStrings('', ''), false);
});

test('clampElapsedTickSeconds blocks burst double-charging while allowing 5s voice ticks', () => {
  const uid = 'web_tick_test_01';
  resetTickRateLimiterForTests(uid);

  // First tick: allows up to 10s
  assert.equal(clampElapsedTickSeconds(uid, 5, 100_000), 5);
  // Duplicate call 200ms later: blocked (0s deducted)
  assert.equal(clampElapsedTickSeconds(uid, 5, 100_200), 0);
  // Legitimate call 5s later: allows 5s
  assert.equal(clampElapsedTickSeconds(uid, 5, 105_000), 5);
  // Oversized client claim 2s later: clamped to real elapsed + 1s
  assert.equal(clampElapsedTickSeconds(uid, 30, 107_000), 3);
});
