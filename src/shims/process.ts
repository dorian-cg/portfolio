const noop = (): void => {};

export const cwd = (): string => '/';

export const env: Record<string, string | undefined> = {};

/**
 * Minimal browser stand-in for Node's `process`, enough for Ink and its
 * dependencies to import and run. Streams are supplied to Ink explicitly, so
 * the std* members are placeholders.
 */
const process = {
  env,
  platform: 'browser',
  argv: [] as string[],
  version: '',
  versions: {} as Record<string, string>,
  pid: 0,
  cwd,
  nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]): void => {
    queueMicrotask(() => callback(...args));
  },
  on: noop,
  once: noop,
  off: noop,
  addListener: noop,
  removeListener: noop,
  removeAllListeners: noop,
  emit: (): boolean => false,
  exit: noop,
  stdout: { isTTY: false, write: (): boolean => true },
  stderr: { isTTY: false, write: (): boolean => true },
  stdin: { isTTY: false },
};

export default process;
