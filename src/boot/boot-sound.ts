import { scalePitch, type CueCall } from '../sound/cues';
import type { BootEvent } from './boot-screen';

/** The sound for something the boot did. OK marks climb a pentatonic scale, so the boot ends on a high note. */
export function bootCue(event: BootEvent): CueCall {
  switch (event.type) {
    case 'count':
      // The memory counter rises from a low tick to a higher one as it fills.
      return { cue: 'count', pitch: 0.8 + 0.5 * event.progress };
    case 'ok':
      return { cue: 'ok', pitch: 0.9 * scalePitch(event.index) };
    default:
      return { cue: event.type };
  }
}
