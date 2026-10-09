import { describe, expect, it, vi } from 'vitest';
import { CUES } from './cues';
import { STORAGE_KEY, createSoundEngine, silentEngine, type EngineOptions } from './engine';
import { fakeAudio } from './fake-audio';

class MemoryStorage {
  data = new Map<string, string>();
  getItem = (key: string) => this.data.get(key) ?? null;
  setItem = (key: string, value: string) => void this.data.set(key, value);
}

const setup = (options: EngineOptions = {}) => {
  const { Context, contexts } = fakeAudio();
  const storage = new MemoryStorage();
  const engine = createSoundEngine({ AudioContext: Context, storage, hidden: () => false, ...options });
  return { engine, contexts, storage };
};

/** The frequency each oscillator of the latest context started at. */
const pitches = (contexts: ReturnType<typeof fakeAudio>['contexts']) =>
  contexts[0]!.oscillators.map((node) => node.frequency.calls[0]!.value);

describe('createSoundEngine', () => {
  describe('without Web Audio', () => {
    it('is unavailable and does nothing', async () => {
      const engine = createSoundEngine({ AudioContext: undefined, storage: new MemoryStorage() });
      expect(engine.available).toBe(false);
      await expect(engine.unlock()).resolves.toBeUndefined();
      expect(() => engine.play('tick')).not.toThrow();
    });

    it('survives a context that cannot be built', async () => {
      const Broken = class {
        constructor() {
          throw new Error('no audio');
        }
      } as unknown as typeof AudioContext;
      const engine = createSoundEngine({ AudioContext: Broken, storage: new MemoryStorage() });
      await expect(engine.unlock()).resolves.toBeUndefined();
      expect(() => engine.play('tick')).not.toThrow();
    });
  });

  describe('unlocking', () => {
    it('makes no context until asked, and plays nothing before then', () => {
      const { engine, contexts } = setup();
      expect(engine.available).toBe(true);
      engine.play('section');
      expect(contexts).toHaveLength(0);
    });

    it('starts and resumes one context, and primes it with silence once', async () => {
      const { engine, contexts } = setup();
      await engine.unlock();
      await engine.unlock();
      expect(contexts).toHaveLength(1);
      expect(contexts[0]!.state).toBe('running');
      expect(contexts[0]!.resumeCalls).toBe(1);
      expect(contexts[0]!.nodes.filter((node) => node.kind === 'source')).toHaveLength(1);
    });

    it('stays locked and silent if the browser refuses to resume', async () => {
      const { Context, contexts } = fakeAudio({ refuseResume: true });
      const engine = createSoundEngine({ AudioContext: Context, storage: new MemoryStorage(), hidden: () => false });
      await expect(engine.unlock()).resolves.toBeUndefined();
      engine.play('section');
      expect(contexts[0]!.state).toBe('suspended');
      expect(contexts[0]!.oscillators).toHaveLength(0);
    });

    it('unlocks on the first gesture on the target, then lets go of it', async () => {
      const target = new EventTarget();
      const { engine, contexts } = setup({ unlockOn: target });
      expect(engine.enabled()).toBe(true);

      target.dispatchEvent(new Event('keydown'));
      await vi.waitFor(() => expect(contexts[0]?.state).toBe('running'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      target.dispatchEvent(new Event('pointerdown'));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(contexts).toHaveLength(1);
      expect(contexts[0]!.resumeCalls).toBe(1);
    });

    it('keeps listening while the browser has not let it start', async () => {
      const target = new EventTarget();
      const { Context, contexts } = fakeAudio({ refuseResume: true });
      createSoundEngine({ AudioContext: Context, storage: new MemoryStorage(), unlockOn: target });
      const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

      target.dispatchEvent(new Event('click'));
      await settle();
      target.dispatchEvent(new Event('click'));
      await settle();
      expect(contexts).toHaveLength(1);
      expect(contexts[0]!.resumeCalls).toBe(2);
    });
  });

  describe('playing', () => {
    it('builds the cue through the master gain into the speakers', async () => {
      const { engine, contexts } = setup();
      await engine.unlock();
      engine.play('section');
      const context = contexts[0]!;
      expect(pitches(contexts)).toEqual([CUES.section.parts[0]!.hz]);
      const envelope = context.oscillators[0]!.outputs[0]!.outputs[0]!;
      expect(envelope.kind).toBe('gain');
      const master = envelope.outputs[0]!;
      expect(master.outputs).toEqual([context.destination]);
    });

    it('bends pitch and volume on request', async () => {
      const { engine, contexts } = setup();
      await engine.unlock();
      engine.play('section', { pitch: 2, gain: 0.5 });
      const [part] = CUES.section.parts;
      expect(pitches(contexts)).toEqual([part!.hz * 2]);
      const envelope = contexts[0]!.nodes.find((node) => node.kind === 'gain' && node.gain.calls.length > 0)!;
      expect(envelope.gain.calls[1]!.value).toBeCloseTo(part!.gain * CUES.section.gain * 0.5);
    });

    it('varies the pitch of cues with jitter, within bounds', async () => {
      const { engine, contexts } = setup({ random: () => 1 });
      await engine.unlock();
      engine.play('type');
      expect(pitches(contexts)[0]).toBeCloseTo(CUES.type.parts[0]!.hz * (1 + CUES.type.jitter!));
    });

    it('throttles a cue by its gap and lets others through', async () => {
      let time = 1000;
      const { engine, contexts } = setup({ now: () => time });
      await engine.unlock();
      engine.play('tick');
      engine.play('tick');
      engine.play('section');
      expect(contexts[0]!.oscillators).toHaveLength(2);

      time += CUES.tick.gap!;
      engine.play('tick');
      expect(contexts[0]!.oscillators).toHaveLength(3);
    });

    it('does not play while the page is hidden', async () => {
      let hidden = true;
      const { engine, contexts } = setup({ hidden: () => hidden });
      await engine.unlock();
      engine.play('section');
      expect(contexts[0]!.oscillators).toHaveLength(0);

      hidden = false;
      engine.play('section');
      expect(contexts[0]!.oscillators).toHaveLength(1);
    });

    it('does not play while the context is suspended', async () => {
      const { engine, contexts } = setup();
      await engine.unlock();
      contexts[0]!.state = 'suspended';
      engine.play('section');
      expect(contexts[0]!.oscillators).toHaveLength(0);
    });

    it('survives a sound that fails to build', async () => {
      const { engine, contexts } = setup();
      await engine.unlock();
      contexts[0]!.createOscillator = () => {
        throw new Error('too many nodes');
      };
      expect(() => engine.play('section')).not.toThrow();
    });
  });

  describe('the on/off setting', () => {
    it('is on by default', () => {
      expect(setup().engine.enabled()).toBe(true);
    });

    it('remembers being turned off', () => {
      const first = setup();
      first.engine.setEnabled(false);
      expect(first.storage.data.get(STORAGE_KEY)).toBe('off');

      const second = createSoundEngine({ AudioContext: fakeAudio().Context, storage: first.storage });
      expect(second.enabled()).toBe(false);
      second.setEnabled(true);
      expect(first.storage.data.get(STORAGE_KEY)).toBe('on');
    });

    it('is silent while off', async () => {
      const { engine, contexts } = setup();
      await engine.unlock();
      engine.setEnabled(false);
      engine.play('section');
      expect(contexts[0]!.oscillators).toHaveLength(0);
    });

    it('works for the visit when storage throws', () => {
      const broken = {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      };
      const engine = createSoundEngine({ AudioContext: fakeAudio().Context, storage: broken });
      expect(engine.enabled()).toBe(true);
      expect(() => engine.setEnabled(false)).not.toThrow();
      expect(engine.enabled()).toBe(false);
    });

    it('tells subscribers only when it changes, and stops when they leave', () => {
      const { engine } = setup();
      const listener = vi.fn();
      const stop = engine.subscribe(listener);
      engine.setEnabled(true);
      expect(listener).not.toHaveBeenCalled();
      engine.setEnabled(false);
      expect(listener).toHaveBeenCalledTimes(1);
      stop();
      engine.setEnabled(true);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('says which way a toggle went: off is heard before it mutes, on after it unmutes', async () => {
      const { engine, contexts } = setup();
      await engine.unlock();

      engine.toggle();
      expect(engine.enabled()).toBe(false);
      expect(pitches(contexts)).toEqual([CUES.off.parts[0]!.hz]);

      engine.toggle();
      expect(engine.enabled()).toBe(true);
      expect(pitches(contexts)).toEqual([CUES.off.parts[0]!.hz, CUES.click.parts[0]!.hz]);
    });

    it('unlocks from a toggle, which is always a gesture', () => {
      const { engine, contexts } = setup();
      engine.toggle();
      expect(contexts).toHaveLength(1);
    });
  });
});

describe('silentEngine', () => {
  it('does nothing and is off', async () => {
    expect(silentEngine.available).toBe(false);
    expect(silentEngine.enabled()).toBe(false);
    await expect(silentEngine.unlock()).resolves.toBeUndefined();
    silentEngine.play('section');
    silentEngine.toggle();
    silentEngine.setEnabled(true);
    expect(silentEngine.subscribe(() => {})()).toBeUndefined();
  });
});
