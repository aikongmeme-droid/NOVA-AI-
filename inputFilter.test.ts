import test from 'node:test';
import assert from 'node:assert/strict';
import { handleUserMessage, sanitizeUserMessage } from './inputFilter';

test('ignores empty, whitespace-only, and single-character noise', () => {
  assert.deepEqual(sanitizeUserMessage(''), { valid: false, cleanText: '' });
  assert.deepEqual(sanitizeUserMessage('   \n\t  '), { valid: false, cleanText: '' });
  assert.deepEqual(sanitizeUserMessage('  a '), { valid: false, cleanText: 'a' });
  assert.deepEqual(sanitizeUserMessage('э'), { valid: false, cleanText: 'э' });

  let called = false;
  const accepted = handleUserMessage('  x  ', () => {
    called = true;
  });
  assert.equal(accepted, false);
  assert.equal(called, false);
});

test('accepts trimmed phrases with length >= 2 and forwards clean text', () => {
  assert.deepEqual(sanitizeUserMessage('  ok  '), { valid: true, cleanText: 'ok' });
  assert.deepEqual(sanitizeUserMessage(' Да '), { valid: true, cleanText: 'Да' });

  let forwarded = '';
  const accepted = handleUserMessage('   Привет, Нова!   ', (clean) => {
    forwarded = clean;
  });
  assert.equal(accepted, true);
  assert.equal(forwarded, 'Привет, Нова!');
});
