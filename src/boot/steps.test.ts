import { describe, expect, it } from 'vitest';
import { BOOT_STEPS, POWER_PROMPT, type BootStep } from './steps';

/** How long a step takes, not counting any wait for the real milestone. */
const durationOf = (step: BootStep): number =>
  step.kind === 'task' ? step.work : step.kind === 'memory' ? step.duration : step.kind === 'power' ? 0 : (step.pause ?? 0);

describe('BOOT_STEPS', () => {
  const milestones = BOOT_STEPS.flatMap((step) =>
    step.kind === 'task' && step.milestone ? [step.milestone] : [],
  );

  it('waits on each real loading stage exactly once, in loading order', () => {
    expect(milestones).toEqual(['terminal', 'ink']);
  });

  it('has only valid, non-negative timings', () => {
    for (const step of BOOT_STEPS) {
      const timings = step.kind === 'memory' ? [step.duration, step.total] : [durationOf(step)];
      timings.forEach((value) => expect(value).toBeGreaterThanOrEqual(0));
    }
  });

  it('plays for a few seconds at normal speed', () => {
    const total = BOOT_STEPS.reduce((sum, step) => sum + durationOf(step), 0);
    expect(total).toBeGreaterThan(1500);
    expect(total).toBeLessThan(4000);
  });

  it('waits to be powered on once, right after the banner', () => {
    expect(BOOT_STEPS.filter((step) => step.kind === 'power')).toHaveLength(1);
    expect(BOOT_STEPS[1]).toEqual({ kind: 'power' });
  });

  it('marks the last line as the moment the interface is ready', () => {
    expect(BOOT_STEPS.at(-1)).toMatchObject({ kind: 'line', event: 'ready' });
  });

  describe('on a phone', () => {
    const PHONE_COLUMNS = 36;
    const STATUS = ' ... [ OK ]'.length;

    it('fits the power-on prompt', () => {
      POWER_PROMPT.forEach((row) => expect(row.length).toBeLessThanOrEqual(PHONE_COLUMNS));
    });

    it('fits every line, with its status, in the columns a phone has', () => {
      for (const step of BOOT_STEPS) {
        if (step.kind === 'line') {
          expect(step.text.length).toBeLessThanOrEqual(PHONE_COLUMNS);
        } else if (step.kind === 'task') {
          expect(step.text.length + STATUS).toBeLessThanOrEqual(PHONE_COLUMNS);
        } else if (step.kind === 'memory') {
          expect(`${step.label} ${step.total}K OK`.length).toBeLessThanOrEqual(PHONE_COLUMNS);
        }
      }
    });
  });
});
