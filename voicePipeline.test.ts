import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type AudioNodesBundle,
  type DisconnectableNode,
  type ScriptProcessorLike,
  disposeAudioNodes,
  evaluateAudioGraphHealth,
  formatConnectedAudioNodes,
  getVoiceInitPhaseMeta,
} from './voicePipeline';

test('maps explicit voice initialization phases cleanly', () => {
  assert.deepEqual(getVoiceInitPhaseMeta('requesting_mic'), {
    isInitializing: true,
    label: 'Mic Access',
    detail: 'Allowing microphone...',
  });
  assert.deepEqual(getVoiceInitPhaseMeta('authenticating'), {
    isInitializing: true,
    label: 'Session',
    detail: 'Preparing session...',
  });
  assert.deepEqual(getVoiceInitPhaseMeta('connecting_ws'), {
    isInitializing: true,
    label: 'Connecting',
    detail: 'Connecting voice...',
  });
  assert.deepEqual(getVoiceInitPhaseMeta('starting_audio_nodes'), {
    isInitializing: true,
    label: 'Audio Graph',
    detail: 'Starting audio nodes...',
  });
  assert.equal(getVoiceInitPhaseMeta('streaming').isInitializing, false);
  assert.equal(getVoiceInitPhaseMeta('idle').isInitializing, false);
});

test('disposes all audio nodes cleanly even if one disconnect throws', () => {
  const calls: string[] = [];
  const bundle: AudioNodesBundle<
    DisconnectableNode,
    DisconnectableNode,
    ScriptProcessorLike,
    DisconnectableNode
  > = {
    source: {
      disconnect() {
        calls.push('source');
      },
    },
    analyser: {
      disconnect() {
        calls.push('analyser');
        throw new Error('already disconnected');
      },
    },
    processor: {
      onaudioprocess: () => undefined,
      disconnect() {
        calls.push('processor');
      },
    },
    zeroGain: {
      disconnect() {
        calls.push('zeroGain');
      },
    },
  };

  assert.equal(
    formatConnectedAudioNodes(bundle),
    'source+analyser+processor+zeroGain'
  );

  const processorRef = bundle.processor!;
  disposeAudioNodes(bundle);

  assert.deepEqual(calls, ['source', 'analyser', 'processor', 'zeroGain']);
  assert.equal(processorRef.onaudioprocess, null);
  assert.equal(bundle.source, null);
  assert.equal(bundle.analyser, null);
  assert.equal(bundle.processor, null);
  assert.equal(bundle.zeroGain, null);
  assert.equal(formatConnectedAudioNodes(bundle), 'none');
});

test('detects missing nodes, suspended context, or stalled zero-frame audio graphs', () => {
  const activeBundle: AudioNodesBundle<
    DisconnectableNode,
    DisconnectableNode,
    ScriptProcessorLike,
    DisconnectableNode
  > = {
    source: { disconnect() {} },
    analyser: { disconnect() {} },
    processor: { onaudioprocess: () => undefined, disconnect() {} },
    zeroGain: { disconnect() {} },
  };

  assert.deepEqual(
    evaluateAudioGraphHealth({
      contextState: 'running',
      nodes: activeBundle,
      requireProcessor: true,
      elapsedSinceStartMs: 200,
      frameCount: 0,
    }),
    { ok: true }
  );

  assert.deepEqual(
    evaluateAudioGraphHealth({
      contextState: 'suspended',
      nodes: activeBundle,
      requireProcessor: true,
      elapsedSinceStartMs: 500,
      frameCount: 0,
    }),
    { ok: false, reason: 'context_suspended' }
  );

  assert.deepEqual(
    evaluateAudioGraphHealth({
      contextState: 'running',
      nodes: activeBundle,
      requireProcessor: true,
      elapsedSinceStartMs: 3600,
      frameCount: 0,
    }),
    { ok: false, reason: 'no_audio_frames' }
  );

  assert.deepEqual(
    evaluateAudioGraphHealth({
      contextState: 'running',
      nodes: { ...activeBundle, processor: null },
      requireProcessor: true,
      elapsedSinceStartMs: 500,
      frameCount: 10,
    }),
    { ok: false, reason: 'missing_nodes' }
  );
});
