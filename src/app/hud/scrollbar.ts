/** The scrollbar thumb: where it starts and how many rows it covers. */
export function scrollbarThumb(viewport: number, content: number, offset: number): { top: number; size: number } {
  if (viewport <= 0 || content <= viewport) {
    return { top: 0, size: viewport };
  }
  const size = Math.max(1, Math.round((viewport * viewport) / content));
  const max = content - viewport;
  const top = Math.round((Math.min(Math.max(offset, 0), max) / max) * (viewport - size));
  return { top, size };
}
