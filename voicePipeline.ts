export type VoiceInitPhase =
  | 'idle'
  | 'requesting_mic'
  | 'authenticating'
  | 'connecting_ws'
  | 'starting_audio_nodes'
  | 'streaming'
  | 'fallback_active'
  | 'stopping';

export interface VoiceInitPhaseMeta {
  isInitializing: boolean;
  label: string;
  detail: string;
}

export function getVoiceInitPhaseMeta(phase: VoiceInitPhase): VoiceInitPhaseMeta {
  switch (phase) {
    case 'requesting_mic':
      return {
        isInitializing: true,
        label: 'Mic Access',
        detail: 'Allowing microphone...',
      };
    case 'authenticating':
      return {
        isInitializing: true,
        label: 'Session',
        detail: 'Preparing session...',
      };
    case 'connecting_ws':
      return {
        isInitializing: true,
        label: 'Connecting',
        detail: 'Connecting voice...',
      };
    case 'starting_audio_nodes':
      return {
        isInitializing: true,
        label: 'Audio Graph',
        detail: 'Starting audio nodes...',
      };
    default:
      return {
        isInitializing: false,
        label: '',
        detail: '',
      };
  }
}

export interface DisconnectableNode {
  disconnect: () => void;
}

export interface ScriptProcessorLike extends DisconnectableNode {
  onaudioprocess: ((event: never) => void) | null;
}

export interface AudioNodesBundle<
  TSource extends DisconnectableNode = MediaStreamAudioSourceNode,
  TAnalyser extends DisconnectableNode = AnalyserNode,
  TProcessor extends ScriptProcessorLike = ScriptProcessorNode,
  TGain extends DisconnectableNode = GainNode,
> {
  source: TSource | null;
  analyser: TAnalyser | null;
  processor: TProcessor | null;
  zeroGain: TGain | null;
}

export function disposeAudioNodes<
  TSource extends DisconnectableNode,
  TAnalyser extends DisconnectableNode,
  TProcessor extends ScriptProcessorLike,
  TGain extends DisconnectableNode,
>(nodes: AudioNodesBundle<TSource, TAnalyser, TProcessor, TGain>): void {
  if (nodes.source) {
    try {
      nodes.source.disconnect();
    } catch {
      // ignore disconnect errors on already-detached nodes
    }
    nodes.source = null;
  }

  if (nodes.analyser) {
    try {
      nodes.analyser.disconnect();
    } catch {
      // ignore
    }
    nodes.analyser = null;
  }

  if (nodes.processor) {
    nodes.processor.onaudioprocess = null;
    try {
      nodes.processor.disconnect();
    } catch {
      // ignore
    }
    nodes.processor = null;
  }

  if (nodes.zeroGain) {
    try {
      nodes.zeroGain.disconnect();
    } catch {
      // ignore
    }
    nodes.zeroGain = null;
  }
}

export function formatConnectedAudioNodes<
  TSource extends DisconnectableNode,
  TAnalyser extends DisconnectableNode,
  TProcessor extends ScriptProcessorLike,
  TGain extends DisconnectableNode,
>(nodes: AudioNodesBundle<TSource, TAnalyser, TProcessor, TGain>): string {
  const connected: string[] = [];
  if (nodes.source) connected.push('source');
  if (nodes.analyser) connected.push('analyser');
  if (nodes.processor) connected.push('processor');
  if (nodes.zeroGain) connected.push('zeroGain');
  return connected.length > 0 ? connected.join('+') : 'none';
}

export function evaluateAudioGraphHealth(params: {
  contextState?: AudioContextState | null;
  nodes: AudioNodesBundle<DisconnectableNode, DisconnectableNode, ScriptProcessorLike, DisconnectableNode>;
  requireProcessor: boolean;
  elapsedSinceStartMs: number;
  frameCount: number;
  stallTimeoutMs?: number;
}): {
  ok: boolean;
  reason?: 'context_suspended' | 'missing_nodes' | 'no_audio_frames';
} {
  if (
    !params.nodes.source ||
    !params.nodes.analyser ||
    !params.nodes.zeroGain ||
    (params.requireProcessor && !params.nodes.processor)
  ) {
    return { ok: false, reason: 'missing_nodes' };
  }

  if (params.contextState && params.contextState !== 'running') {
    return { ok: false, reason: 'context_suspended' };
  }

  const timeoutMs = params.stallTimeoutMs ?? 3500;
  if (params.elapsedSinceStartMs >= timeoutMs && params.frameCount === 0) {
    return { ok: false, reason: 'no_audio_frames' };
  }

  return { ok: true };
}
