import type { Part } from './recipes';

export interface ScheduleOptions {
  /** Multiplies every frequency: 2 is an octave up. */
  pitch?: number;
  /** Multiplies every part's gain. */
  gain?: number;
  /** Context time, in seconds, at which the sound starts. */
  when?: number;
}

/** Floor of the exponential ramps, which cannot reach 0. */
const SILENCE = 1e-4;

/**
 * Schedules `parts` on `context`, playing into `destination`: each is an
 * oscillator, optionally glided and low-passed, shaped by an attack and an
 * exponential decay.
 */
export function schedule(
  context: BaseAudioContext,
  destination: AudioNode,
  parts: readonly Part[],
  { pitch = 1, gain = 1, when = context.currentTime }: ScheduleOptions = {},
): void {
  for (const part of parts) {
    const start = when + (part.at ?? 0) / 1000;
    const end = start + part.ms / 1000;

    const oscillator = context.createOscillator();
    oscillator.type = part.wave ?? 'sine';
    oscillator.frequency.setValueAtTime(part.hz * pitch, start);
    if (part.to) {
      oscillator.frequency.exponentialRampToValueAtTime(part.to * pitch, end);
    }

    const envelope = context.createGain();
    const attack = Math.min((part.atk ?? 4) / 1000, (part.ms / 1000) * 0.6);
    envelope.gain.setValueAtTime(SILENCE, start);
    envelope.gain.exponentialRampToValueAtTime(part.gain * gain, start + attack);
    envelope.gain.exponentialRampToValueAtTime(SILENCE, end);

    let source: AudioNode = oscillator;
    if (part.cut) {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = part.cut;
      oscillator.connect(filter);
      source = filter;
    }
    source.connect(envelope).connect(destination);

    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }
}
