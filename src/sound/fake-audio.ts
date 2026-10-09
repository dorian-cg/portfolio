import type { CueName, PlayOptions } from './cues';
import type { SoundEngine } from './engine';

/** An AudioParam that remembers how it was driven. */
class FakeParam {
  value = 0;
  readonly calls: Array<{ kind: 'set' | 'ramp'; value: number; time: number }> = [];
  setValueAtTime(value: number, time: number) {
    this.calls.push({ kind: 'set', value, time });
    return this;
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    this.calls.push({ kind: 'ramp', value, time });
    return this;
  }
}

class FakeNode {
  readonly gain = new FakeParam();
  readonly frequency = new FakeParam();
  type = '';
  buffer: unknown;
  started?: number;
  stopped?: number;
  readonly outputs: FakeNode[] = [];
  constructor(readonly kind: string) {}
  connect(next: FakeNode) {
    this.outputs.push(next);
    return next;
  }
  start(time: number) {
    this.started = time;
  }
  stop(time: number) {
    this.stopped = time;
  }
}

/** Enough of AudioContext for the synth and the engine, recording what they build. */
export class FakeAudioContext {
  state: 'suspended' | 'running' = 'suspended';
  currentTime = 0;
  sampleRate = 44100;
  readonly destination = new FakeNode('destination');
  readonly nodes: FakeNode[] = [];
  resumeCalls = 0;
  /** Set to make `resume()` fail, as it does when the browser refuses. */
  refuseResume = false;

  private make(kind: string) {
    const node = new FakeNode(kind);
    this.nodes.push(node);
    return node;
  }
  createGain() {
    return this.make('gain');
  }
  createOscillator() {
    return this.make('oscillator');
  }
  createBiquadFilter() {
    return this.make('filter');
  }
  createBufferSource() {
    return this.make('source');
  }
  createBuffer() {
    return {};
  }
  resume() {
    this.resumeCalls++;
    if (this.refuseResume) {
      return Promise.reject(new Error('blocked'));
    }
    this.state = 'running';
    return Promise.resolve();
  }
  /** The oscillators created so far, in order. */
  get oscillators() {
    return this.nodes.filter((node) => node.kind === 'oscillator');
  }
}

/** A stand-in for the `AudioContext` constructor that keeps every context it made. */
export function fakeAudio({ refuseResume = false } = {}) {
  const contexts: FakeAudioContext[] = [];
  const Context = class extends FakeAudioContext {
    constructor() {
      super();
      this.refuseResume = refuseResume;
      contexts.push(this);
    }
  } as unknown as typeof AudioContext;
  return { Context, contexts };
}

/** A sound engine that makes no sound and writes down what it was asked to play. */
export class RecordingSound implements SoundEngine {
  available = true;
  plays: Array<{ cue: CueName; options?: PlayOptions }> = [];
  unlocks = 0;
  private on = true;
  private readonly listeners = new Set<() => void>();

  play = (cue: CueName, options?: PlayOptions) => {
    this.plays.push({ cue, options });
  };
  unlock = () => {
    this.unlocks++;
    return Promise.resolve();
  };
  enabled = () => this.on;
  setEnabled = (on: boolean) => {
    this.on = on;
    this.listeners.forEach((listener) => listener());
  };
  toggle = () => this.setEnabled(!this.on);
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** The cues played, in order. */
  get cues(): CueName[] {
    return this.plays.map((play) => play.cue);
  }
}
