import { describe, expect, it } from 'vitest';
import { FakeAudioContext } from './fake-audio';
import type { Part } from './recipes';
import { schedule } from './synth';

const run = (parts: Part[], options?: Parameters<typeof schedule>[3]) => {
  const context = new FakeAudioContext();
  const out = context.destination;
  schedule(context as unknown as BaseAudioContext, out as unknown as AudioNode, parts, options);
  return { context, out };
};

describe('schedule', () => {
  it('plays an oscillator through an envelope into the destination', () => {
    const { context, out } = run([{ hz: 440, ms: 100, gain: 0.05, wave: 'triangle' }]);
    const [oscillator] = context.oscillators;
    expect(oscillator!.type).toBe('triangle');
    expect(oscillator!.frequency.calls[0]).toEqual({ kind: 'set', value: 440, time: 0 });
    const envelope = oscillator!.outputs[0]!;
    expect(envelope.kind).toBe('gain');
    expect(envelope.outputs).toEqual([out]);
  });

  it('shapes the envelope with an attack and a decay to near silence', () => {
    const { context } = run([{ hz: 440, ms: 100, gain: 0.05, atk: 10 }]);
    const envelope = context.nodes.find((node) => node.kind === 'gain')!;
    expect(envelope.gain.calls).toEqual([
      { kind: 'set', value: 1e-4, time: 0 },
      { kind: 'ramp', value: 0.05, time: 0.01 },
      { kind: 'ramp', value: 1e-4, time: 0.1 },
    ]);
  });

  it('never lets the attack take more than most of the sound', () => {
    const { context } = run([{ hz: 440, ms: 10, gain: 0.05, atk: 90 }]);
    const envelope = context.nodes.find((node) => node.kind === 'gain')!;
    expect(envelope.gain.calls[1]!.time).toBeCloseTo(0.006);
  });

  it('glides to the target frequency', () => {
    const { context } = run([{ hz: 400, to: 200, ms: 200, gain: 0.05 }]);
    const [oscillator] = context.oscillators;
    expect(oscillator!.frequency.calls[1]).toEqual({ kind: 'ramp', value: 200, time: 0.2 });
  });

  it('low-passes only when the part has a cut-off', () => {
    const plain = run([{ hz: 400, ms: 50, gain: 0.05 }]);
    expect(plain.context.nodes.some((node) => node.kind === 'filter')).toBe(false);

    const cut = run([{ hz: 400, ms: 50, gain: 0.05, cut: 800 }]);
    const filter = cut.context.nodes.find((node) => node.kind === 'filter')!;
    expect(filter.type).toBe('lowpass');
    expect(cut.context.oscillators[0]!.outputs).toEqual([filter]);
  });

  it('applies pitch to the start and the target, and gain to the peak', () => {
    const { context } = run([{ hz: 400, to: 200, ms: 100, gain: 0.04 }], { pitch: 2, gain: 0.5 });
    const [oscillator] = context.oscillators;
    expect(oscillator!.frequency.calls.map((call) => call.value)).toEqual([800, 400]);
    const envelope = context.nodes.find((node) => node.kind === 'gain')!;
    expect(envelope.gain.calls[1]!.value).toBeCloseTo(0.02);
  });

  it('starts every part together, or after its own delay, from `when`', () => {
    const { context } = run(
      [
        { hz: 200, ms: 100, gain: 0.05 },
        { hz: 300, ms: 100, gain: 0.05, at: 24 },
      ],
      { when: 1 },
    );
    expect(context.oscillators.map((node) => node.started)).toEqual([1, 1.024]);
    expect(context.oscillators[1]!.stopped).toBeCloseTo(1.144);
  });
});
