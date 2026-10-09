/** Real loading stages that the boot log waits for before marking a task OK. */
export type Milestone = 'terminal' | 'ink';

export type BootStep =
  /** Prints a line, then pauses. `event` marks a line that sounds like more than a line. */
  | { kind: 'line'; text: string; pause?: number; event?: 'ready' }
  /**
   * Waits for a key or tap before going on, when the boot is gated. Browsers
   * only allow sound after one, so this is where audio is unlocked. Without a
   * gate it does nothing.
   */
  | { kind: 'power' }
  /** Prints an empty line, then pauses. */
  | { kind: 'blank'; pause?: number }
  /** Counts up to `total` kilobytes over `duration` ms, in place. */
  | { kind: 'memory'; label: string; total: number; duration: number }
  /**
   * Prints a line, waits at least `work` ms and, when `milestone` is set, until
   * that real loading stage has happened, then appends an OK status.
   */
  | { kind: 'task'; text: string; work: number; milestone?: Milestone };

/**
 * Every line has to fit a phone, about 36 columns. A task also gets ` ... [ OK ]`
 * after its text, which is 11 more.
 */
export const BOOT_STEPS: readonly BootStep[] = [
  { kind: 'line', text: 'DC//OS BOOT v1.0', pause: 120 },
  { kind: 'power' },
  { kind: 'line', text: 'Personnel interface (c) 2026', pause: 120 },
  { kind: 'blank', pause: 80 },
  { kind: 'memory', label: 'Memory Test:', total: 640, duration: 500 },
  { kind: 'blank', pause: 80 },
  { kind: 'task', text: 'Calibrating display', work: 100 },
  { kind: 'task', text: 'Detecting input', work: 90 },
  { kind: 'blank', pause: 80 },
  { kind: 'line', text: 'Initialising DC//OS...', pause: 200 },
  { kind: 'task', text: 'Loading terminal (WASM)', work: 120, milestone: 'terminal' },
  { kind: 'task', text: 'Mounting React runtime', work: 120 },
  { kind: 'task', text: 'Starting Ink', work: 120, milestone: 'ink' },
  { kind: 'blank', pause: 80 },
  { kind: 'line', text: 'Interface ready.', pause: 300, event: 'ready' },
];

/** What the boot shows while it waits for the visitor to power it on. */
export const POWER_PROMPT = ['▶ PRESS ANY KEY OR TAP', '  TO POWER ON · M FOR SILENT'] as const;
