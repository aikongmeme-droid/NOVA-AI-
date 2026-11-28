export function float32ToPcm16Base64(float32: Float32Array): string {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function pcm16Base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const samples = new Float32Array(bytes.byteLength / 2);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(i * 2, true) / 32768;
  }
  return samples;
}

export function downsampleTo16k(
  input: Float32Array,
  inputSampleRate: number
): Float32Array {
  if (inputSampleRate === 16000 || input.length === 0) return input;
  const ratio = inputSampleRate / 16000;
  const outputLength = Math.floor(input.length / ratio);
  if (outputLength <= 0) return new Float32Array(0);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      sum += input[j];
      count++;
    }
    output[i] = count > 0 ? sum / count : input[start] ?? 0;
  }
  return output;
}

export function computeRmsLevel(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSq += samples[i] * samples[i];
  }
  return Math.min(1, Math.sqrt(sumSq / samples.length) * 4.5);
}

export function createAudioContext(sampleRate?: number): AudioContext {
  const Ctor =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      : undefined;
  if (!Ctor) {
    throw new Error('Web Audio API is not supported in this browser.');
  }
  if (sampleRate) {
    try {
      return new Ctor({ sampleRate });
    } catch {
      return new Ctor();
    }
  }
  return new Ctor();
}

export interface WavPlaybackOptions {
  playbackRate?: number;
  onProgress?: (progress: number, currentTimeSec: number, durationSec: number) => void;
}

export class PcmAudioPlayer {
  private ctx: AudioContext | null = null;
  private nextStartTime = 0;
  private playGen = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private progressRafId: number | null = null;
  private onLevelChange?: (level: number) => void;
  private onPlaybackStateChange?: (playing: boolean) => void;

  constructor(callbacks?: {
    onLevelChange?: (level: number) => void;
    onPlaybackStateChange?: (playing: boolean) => void;
  }) {
    this.onLevelChange = callbacks?.onLevelChange;
    this.onPlaybackStateChange = callbacks?.onPlaybackStateChange;
  }

  private cancelProgressLoop(): void {
    if (this.progressRafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.progressRafId);
      this.progressRafId = null;
    }
  }

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = createAudioContext(24000);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public unlock(): void {
    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const silentBuffer = ctx.createBuffer(1, 1, ctx.sampleRate || 24000);
      const src = ctx.createBufferSource();
      src.buffer = silentBuffer;
      src.connect(ctx.destination);
      src.start(0);
    } catch {
      // ignore if audio context cannot unlock yet
    }
  }

  public enqueuePcm24k(base64Pcm: string): void {
    const ctx = this.ensureContext();
    const myGen = this.playGen;
    const samples = pcm16Base64ToFloat32(base64Pcm);
    if (samples.length === 0) return;

    const buffer = ctx.createBuffer(1, samples.length, 24000);
    buffer.getChannelData(0).set(samples);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    if (this.activeSources.size === 0 && this.nextStartTime < now) {
      this.nextStartTime = now + 0.02;
    }
    const startAt = Math.max(now + 0.02, this.nextStartTime);
    this.nextStartTime = startAt + buffer.duration;

    this.activeSources.add(source);
    this.onPlaybackStateChange?.(true);
    this.onLevelChange?.(computeRmsLevel(samples));

    source.onended = () => {
      this.activeSources.delete(source);
      if (myGen !== this.playGen) return;
      if (this.activeSources.size === 0) {
        this.onLevelChange?.(0);
        this.onPlaybackStateChange?.(false);
      }
    };

    source.start(startAt);
  }

  public async playWavBase64(
    base64Wav: string,
    options?: WavPlaybackOptions
  ): Promise<void> {
    this.stop();
    const myGen = this.playGen;
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore resume error; decode/playback may still recover
      }
    }
    if (myGen !== this.playGen) {
      return;
    }

    const binary = atob(base64Wav);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const isRiffWav =
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46;

    if (!isRiffWav) {
      if (myGen === this.playGen) {
        this.enqueuePcm24k(base64Wav);
      }
      return;
    }

    const decoded = await ctx.decodeAudioData(bytes.buffer.slice(0));
    if (myGen !== this.playGen) {
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = decoded;
    const safeRate = Math.max(0.85, Math.min(1.15, options?.playbackRate ?? 1));
    source.playbackRate.value = safeRate;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const levelBuffer = new Float32Array(analyser.fftSize);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    this.activeSources.add(source);
    this.onPlaybackStateChange?.(true);
    this.onLevelChange?.(0.5);

    const startCtxTime = ctx.currentTime;
    const effectiveDuration = Math.max(0.1, decoded.duration / safeRate);

    const tickProgress = () => {
      if (myGen !== this.playGen) return;
      const elapsed = Math.max(0, ctx.currentTime - startCtxTime);
      const progress = Math.min(1, elapsed / effectiveDuration);
      options?.onProgress?.(progress, elapsed, effectiveDuration);

      try {
        analyser.getFloatTimeDomainData(levelBuffer);
        this.onLevelChange?.(computeRmsLevel(levelBuffer));
      } catch {
        // ignore analyser read edge case
      }

      if (progress < 1 && typeof requestAnimationFrame === 'function') {
        this.progressRafId = requestAnimationFrame(tickProgress);
      }
    };

    return new Promise((resolve) => {
      source.onended = () => {
        this.cancelProgressLoop();
        try {
          source.disconnect();
          analyser.disconnect();
        } catch {
          // ignore disconnect errors
        }
        this.activeSources.delete(source);
        if (myGen === this.playGen && this.activeSources.size === 0) {
          options?.onProgress?.(1, effectiveDuration, effectiveDuration);
          this.onLevelChange?.(0);
          this.onPlaybackStateChange?.(false);
        }
        resolve();
      };
      source.start(0);
      if (typeof requestAnimationFrame === 'function') {
        this.progressRafId = requestAnimationFrame(tickProgress);
      }
    });
  }

  public stop(): void {
    this.playGen += 1;
    this.cancelProgressLoop();
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    this.activeSources.clear();
    this.nextStartTime = 0;
    this.onLevelChange?.(0);
    this.onPlaybackStateChange?.(false);
  }

  public dispose(): void {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close();
    }
    this.ctx = null;
  }
}
