// matchMedia can be missing or throw, so access is guarded and falls back to a
// mouse and keyboard.
export function hasCoarsePointer(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}
