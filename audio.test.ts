import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRmsLevel,
  downsampleTo16k,
  float32ToPcm16Base64,
  pcm16Base64ToFloat32,
} from './audio';

test('float32ToPcm16Base64 and pcm16Base64ToFloat32 round-trip PCM samples accurately', () => {
  const input = new Float32Array([-1, -0.5, 0, 0.5, 0.99]);
  const b64 = float32ToPcm16Base64(input);
  assert.ok(b64.length > 0);
  const decoded = pcm16Base64ToFloat32(b64);
  assert.equal(decoded.length, input.length);
  for (let i = 0; i < input.length; i++) {
    assert.ok(Math.abs(decoded[i] - input[i]) < 0.002);
  }
});

test('downsampleTo16k reduces 48kHz audio to 16kHz cleanly', () => {
  const input = new Float32Array(480);
  for (let i = 0; i < input.length; i++) {
    input[i] = Math.sin((2 * Math.PI * 440 * i) / 48000) * 0.5;
  }
  const out = downsampleTo16k(input, 48000);
  assert.equal(out.length, 160);
  assert.equal(downsampleTo16k(out, 16000), out);
});

test('computeRmsLevel returns 0 for silence and scales speech amplitude within [0, 1]', () => {
  assert.equal(computeRmsLevel(new Float32Array(0)), 0);
  assert.equal(computeRmsLevel(new Float32Array(128)), 0);
  const loud = new Float32Array(128).fill(0.5);
  assert.equal(computeRmsLevel(loud), 1);
  const soft = new Float32Array(128).fill(0.05);
  const level = computeRmsLevel(soft);
  assert.ok(level > 0.2 && level < 0.3);
});
