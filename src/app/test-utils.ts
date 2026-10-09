export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Polls until `frame()` satisfies `condition`, then returns it. Animated and
 * measured content arrives a few renders after the event that causes it, and
 * how long that takes depends on how busy the test machine is.
 */
export async function until(
  frame: () => string | undefined,
  condition: (frame: string) => boolean,
  timeoutMs = 8000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = frame() ?? '';
    if (condition(current)) {
      return current;
    }
    await wait(20);
  }
  throw new Error(`Timed out waiting for the frame to change. Last frame:\n${frame()}`);
}
