import { describe, expect, it } from 'vitest';
import { BOOT_STEPS } from './steps';

describe('BOOT_STEPS', () => {
  const milestones = BOOT_STEPS.flatMap((step) =>
    step.kind === 'task' && step.milestone ? [step.milestone] : [],
  );

  it('waits on each real loading stage exactly once, in loading order', () => {
    expect(milestones).toEqual(['terminal', 'ink']);
  });

  it('has only valid, non-negative timings', () => {
    for (const step of BOOT_STEPS) {
      const timings =
        step.kind === 'task'
          ? [step.work]
          : step.kind === 'memory'
            ? [step.duration, step.total]
            : [step.pause ?? 0];
      timings.forEach((value) => expect(value).toBeGreaterThanOrEqual(0));
    }
  });

  it('plays for a few seconds at normal speed', () => {
    const total = BOOT_STEPS.reduce(
      (sum, step) =>
        sum +
        (step.kind === 'task' ? step.work : step.kind === 'memory' ? step.duration : (step.pause ?? 0)),
      0,
    );
    expect(total).toBeGreaterThan(1500);
    expect(total).toBeLessThan(4000);
  });
});
