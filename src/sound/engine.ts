import { CUES, type CueName, type PlayOptions } from './cues';
import { schedule } from './synth';

export interface SoundEngine {
  /** Whether this browser can make sound at all; the toggle is hidden when it cannot. */
  readonly available: boolean;
  /** Plays a cue, if sound is on, unlocked and the page is visible. Never throws. */
  play(cue: CueName, options?: PlayOptions): void;
  /**
   * Starts the audio context. Browsers only allow that from inside a key press
   * or tap, so call it synchronously from one.
   */
  unlock(): Promise<void>;
  enabled(): boolean;
  setEnabled(on: boolean): void;
  /** Flips the setting, with a sound that says which way it went. */
  toggle(): void;
  /** For `useSyncExternalStore`: `listener` runs when `enabled()` changes. */
  subscribe(listener: () => void): () => void;
}

/** Makes no sound. What the app uses until it is given a real engine, and in tests. */
export const silentEngine: SoundEngine = {
  available: false,
  play() {},
  unlock: () => Promise.resolve(),
  enabled: () => false,
  setEnabled() {},
  toggle() {},
  subscribe: () => () => {},
};

export interface EngineOptions {
  /** Defaults to the browser's. Without one the engine is unavailable. */
  AudioContext?: typeof AudioContext;
  /** Where the on/off choice is kept. Defaults to `localStorage`, which may be missing or throw. */
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  /** Unlock on the first key press, tap or click on this target (normally `window`). */
  unlockOn?: EventTarget;
  now?: () => number;
  random?: () => number;
  hidden?: () => boolean;
}

export const STORAGE_KEY = 'dcos-sound';

const GESTURES = ['pointerdown', 'keydown', 'touchend', 'click'] as const;

/** The overall volume. The recipes are mixed to sit quietly under it. */
const MASTER_GAIN = 1;

const browserStorage = (): Pick<Storage, 'getItem' | 'setItem'> | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

/** Sound is on until the visitor turns it off. */
export function createSoundEngine(options: EngineOptions = {}): SoundEngine {
  const Context: typeof AudioContext | undefined =
    options.AudioContext ?? (globalThis as { AudioContext?: typeof AudioContext }).AudioContext;
  const storage = options.storage ?? browserStorage();
  const now = options.now ?? (() => performance.now());
  const random = options.random ?? Math.random;
  const hidden = options.hidden ?? (() => typeof document !== 'undefined' && document.hidden);

  const listeners = new Set<() => void>();
  const lastPlayed = new Map<CueName, number>();
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  let primed = false;

  const read = (): boolean => {
    try {
      return storage?.getItem(STORAGE_KEY) !== 'off';
    } catch {
      return true;
    }
  };
  let on = read();

  const open = (): AudioContext | undefined => {
    if (!context && Context) {
      try {
        context = new Context();
        master = context.createGain();
        master.gain.value = MASTER_GAIN;
        master.connect(context.destination);
      } catch {
        context = undefined;
        master = undefined;
      }
    }
    return context;
  };

  const unlock = async (): Promise<void> => {
    const ready = open();
    if (!ready) {
      return;
    }
    try {
      const resumed = ready.state === 'running' ? undefined : ready.resume();
      if (!primed) {
        // iOS only starts the context once something has been played inside the gesture.
        primed = true;
        const silence = ready.createBufferSource();
        silence.buffer = ready.createBuffer(1, 1, ready.sampleRate);
        silence.connect(ready.destination);
        silence.start(0);
      }
      await resumed;
    } catch {
      // Stays locked; the next gesture tries again.
    }
  };

  const play: SoundEngine['play'] = (name, { pitch = 1, gain = 1 } = {}) => {
    if (!on || !context || !master || context.state !== 'running' || hidden()) {
      return;
    }
    const cue = CUES[name];
    const time = now();
    if (cue.gap !== undefined) {
      if (time - (lastPlayed.get(name) ?? -Infinity) < cue.gap) {
        return;
      }
      lastPlayed.set(name, time);
    }
    const bend = cue.jitter ? 1 + (random() * 2 - 1) * cue.jitter : 1;
    try {
      schedule(context, master, cue.parts, { pitch: pitch * bend, gain: gain * cue.gain });
    } catch {
      // A sound that fails to play is not worth breaking the page for.
    }
  };

  const notify = () => listeners.forEach((listener) => listener());

  const setEnabled = (next: boolean) => {
    if (next === on) {
      return;
    }
    on = next;
    try {
      storage?.setItem(STORAGE_KEY, next ? 'on' : 'off');
    } catch {
      // The choice lasts for this visit only.
    }
    notify();
  };

  const engine: SoundEngine = {
    available: Boolean(Context),
    play,
    unlock,
    enabled: () => on,
    setEnabled,
    toggle() {
      void unlock();
      if (on) {
        play('off');
        setEnabled(false);
      } else {
        setEnabled(true);
        play('click');
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  if (options.unlockOn && Context) {
    const target = options.unlockOn;
    const onGesture = () => {
      void unlock().then(() => {
        if (context?.state === 'running') {
          GESTURES.forEach((type) => target.removeEventListener(type, onGesture, true));
        }
      });
    };
    GESTURES.forEach((type) => target.addEventListener(type, onGesture, true));
  }

  return engine;
}
