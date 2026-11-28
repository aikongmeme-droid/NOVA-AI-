import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCENT_RIPPLE_SIZE,
  DEFAULT_RIPPLE_SIZE,
  MAX_ACTIVE_RIPPLES,
  RIPPLE_DURATION_MS,
  appendTapRipple,
  createTapRipple,
  pruneExpiredRipples,
  resolveRippleTone,
} from './tapRipple';

test('createTapRipple creates normalized coordinates and rejects invalid inputs', () => {
  const surface = createTapRipple({ id: 1, x: 123.456, y: 456.789, now: 1000 });
  assert.deepEqual(surface, {
    id: 1,
    x: 123.5,
    y: 456.8,
    size: DEFAULT_RIPPLE_SIZE,
    tone: 'surface',
    createdAt: 1000,
  });

  const accent = createTapRipple({ id: 2, x: 50, y: 80, tone: 'accent', now: 2000 });
  assert.equal(accent?.size, ACCENT_RIPPLE_SIZE);
  assert.equal(accent?.tone, 'accent');

  assert.equal(createTapRipple({ id: 3, x: -5, y: 10 }), null);
  assert.equal(createTapRipple({ id: 4, x: Number.NaN, y: 10 }), null);
});

test('appendTapRipple caps concurrent ripples to MAX_ACTIVE_RIPPLES', () => {
  let list: ReturnType<typeof appendTapRipple> = [];
  for (let i = 1; i <= MAX_ACTIVE_RIPPLES + 4; i++) {
    const item = createTapRipple({ id: i, x: i * 10, y: i * 10, now: 1000 + i });
    assert.ok(item);
    list = appendTapRipple(list, item);
  }
  assert.equal(list.length, MAX_ACTIVE_RIPPLES);
  assert.equal(list[0].id, 5);
  assert.equal(list[list.length - 1].id, MAX_ACTIVE_RIPPLES + 4);
});

test('pruneExpiredRipples removes completed ripples and retains active ones', () => {
  const r1 = createTapRipple({ id: 1, x: 10, y: 10, now: 1000 })!;
  const r2 = createTapRipple({ id: 2, x: 20, y: 20, now: 1300 })!;
  const remaining = pruneExpiredRipples([r1, r2], 1000 + RIPPLE_DURATION_MS);
  assert.deepEqual(remaining.map((r) => r.id), [2]);
});

test('resolveRippleTone handles non-element targets and interactive element detection', () => {
  assert.equal(resolveRippleTone(null), 'surface');
  assert.equal(
    resolveRippleTone({ closest: () => ({}) } as unknown as EventTarget),
    'accent'
  );
  assert.equal(
    resolveRippleTone({ closest: () => null } as unknown as EventTarget),
    'surface'
  );
});
