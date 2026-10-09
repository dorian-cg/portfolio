import { profile } from '../content/profile';
import { typedCount } from './fx/typewriter';

/** Milliseconds from the first character to the hand-over to the HUD. */
export const INTRO_DURATION = 2900;

export const SCAN_START = 750;
export const SCAN_END = 1650;
const BAR_WIDTH = 14;

/**
 * Columns the intro's text may use. A phone has about 36, and the block needs a
 * margin and a column for the cursor.
 */
export const INTRO_WIDTH = 34;

export interface IntroLine {
  /** `prompt` is the `>`, `label` the text before the value, `value` the highlighted part. */
  prompt: string;
  label: string;
  value: string;
  kind: 'plain' | 'scan' | 'loaded' | 'welcome';
}

interface Typed {
  kind: IntroLine['kind'];
  label: string;
  value: string;
  /** When the first character appears, in ms. */
  at: number;
  cps: number;
}

const TYPED: readonly Typed[] = [
  { kind: 'plain', label: 'DC//OS v1.0 :: portfolio', value: '', at: 0, cps: 50 },
  { kind: 'loaded', label: 'Profile loaded: ', value: profile.name.toUpperCase(), at: 1750, cps: 55 },
  { kind: 'welcome', label: 'Welcome, visitor.', value: '', at: 2300, cps: 60 },
];

/** `▕████░░░░▏ 63%` for `percent` from 0 to 100. */
export function scanBar(percent: number): string {
  const clamped = Math.min(100, Math.max(0, percent));
  const filled = Math.round((clamped / 100) * BAR_WIDTH);
  return `▕${'█'.repeat(filled)}${'░'.repeat(BAR_WIDTH - filled)}▏ ${String(Math.round(clamped)).padStart(3)}%`;
}

/** The lines shown `time` ms into the intro, in order. A line appears when its first character does. */
export function introLines(time: number): IntroLine[] {
  const lines: IntroLine[] = [];
  const type = ({ kind, label, value, at, cps }: Typed): IntroLine | undefined => {
    if (time < at) {
      return undefined;
    }
    // Label and value are typed as one string, then split again for colouring.
    const typed = (label + value).slice(0, typedCount(time, at, cps));
    return { prompt: '>', kind, label: typed.slice(0, label.length), value: typed.slice(label.length) };
  };

  const [banner, loaded, welcome] = TYPED.map(type);
  if (banner) lines.push(banner);
  if (time >= SCAN_START) {
    const percent = Math.min(100, Math.max(0, ((time - SCAN_START) / (SCAN_END - SCAN_START)) * 100));
    lines.push({ prompt: '>', kind: 'scan', label: 'Loading ', value: scanBar(percent) });
  }
  if (loaded) lines.push(loaded);
  if (welcome) lines.push(welcome);
  return lines;
}
