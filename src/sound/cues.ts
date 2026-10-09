import { RECIPES, type Part, type RecipeName } from './recipes';

/**
 * Every sound the portfolio makes, by what happens. This is the one place to
 * tune the soundscape: swap a recipe, change a gain or throttle a cue.
 */
export type CueName =
  // Boot screen.
  | 'power'
  | 'line'
  | 'count'
  | 'ok'
  | 'ready'
  | 'out'
  | 'fail'
  // Intro.
  | 'type'
  | 'scan'
  | 'confirm'
  | 'enter'
  // HUD.
  | 'section'
  | 'settle'
  | 'tick'
  | 'glide'
  | 'edge'
  | 'link'
  // Sound toggle.
  | 'click'
  | 'off';

export interface Cue {
  parts: readonly Part[];
  /** Multiplies the recipe's own gain. Ticks that repeat quickly sit well below events. */
  gain: number;
  /** Minimum milliseconds between two plays of this cue, so fast sources do not machine-gun. */
  gap?: number;
  /** Random pitch variation, as a fraction: 0.05 is up to 5% either way. */
  jitter?: number;
}

const cue = (recipes: RecipeName | readonly RecipeName[], gain = 1, extra: Partial<Cue> = {}): Cue => {
  const names: readonly RecipeName[] = typeof recipes === 'string' ? [recipes] : recipes;
  return { parts: names.flatMap((name): Part[] => [...RECIPES[name]]), gain, ...extra };
};

export const CUES: Record<CueName, Cue> = {
  power: cue(['boot', 'drone']),
  line: cue('tock', 0.6, { gap: 45 }),
  count: cue('cog', 0.5, { gap: 40 }),
  ok: cue('check'),
  ready: cue('rise'),
  out: cue('whisk', 0.8),
  fail: cue('deny'),

  type: cue('poke', 0.4, { gap: 35, jitter: 0.05 }),
  scan: cue('mark', 1.2, { gap: 30 }),
  confirm: cue('chime'),
  enter: cue('expand'),

  section: cue('pick'),
  settle: cue('lift', 1, { gap: 80 }),
  tick: cue('tock', 0.35, { gap: 45 }),
  glide: cue('glide', 0.6, { gap: 120 }),
  edge: cue('bump', 1, { gap: 250 }),
  link: cue('press'),

  click: cue('click'),
  off: cue('off'),
};

/** What to play: a cue, and how to bend it. */
export interface PlayOptions {
  /** Multiplies the pitch. */
  pitch?: number;
  /** Multiplies the volume. */
  gain?: number;
}

export interface CueCall extends PlayOptions {
  cue: CueName;
}

const PENTATONIC = [0, 2, 4, 7, 9];

/**
 * The pitch multiplier of the `index`th note of a major pentatonic scale
 * (0, 1, 2, … up through the octaves). Any run of these notes sounds
 * consonant, so sections and OK marks can each have a note of their own.
 */
export function scalePitch(index: number): number {
  const i = Math.max(0, Math.floor(index));
  const semitones = PENTATONIC[i % PENTATONIC.length]! + 12 * Math.floor(i / PENTATONIC.length);
  return 2 ** (semitones / 12);
}
