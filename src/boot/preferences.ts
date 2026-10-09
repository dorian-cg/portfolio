import type { BootOptions } from './boot-screen';

// matchMedia can be missing or throw, so access is guarded and falls back to
// playing the animation.
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** The sequence always takes the same time; reduced motion skips it. */
export function bootOptions(): BootOptions {
  return { skip: prefersReducedMotion() };
}
