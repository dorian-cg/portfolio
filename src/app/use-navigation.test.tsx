import { render } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { wait } from './test-utils';
import { ENTRANCE_MS } from './use-navigation';

const KEYS = { right: '\u001B[C', left: '\u001B[D', down: '\u001B[B', up: '\u001B[A', tab: '\t', pageDown: '\u001B[6~' };

/** Renders the app, and gives it a moment to start listening for keys. */
const open = async () => {
  const app = render(<App reducedMotion />);
  await wait(50);
  return app;
};

type App = Awaited<ReturnType<typeof open>>;

/** The screen without its header, whose uptime clock changes every second. */
const body = (app: App) => app.lastFrame()!.split('\n').slice(1).join('\n');

/**
 * Presses `key` until `condition` holds for the frame. A page that has just
 * opened is still measuring itself, and a key pressed in that first moment
 * has nothing to scroll yet, so the press is repeated. Every key used here is
 * idempotent or stops at the ends.
 */
const pressUntil = async (app: App, key: string, condition: (frame: string) => boolean, timeoutMs = 4000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    app.stdin.write(key);
    const retryAt = Date.now() + 150;
    while (Date.now() < retryAt) {
      if (condition(app.lastFrame() ?? '')) {
        return;
      }
      await wait(10);
    }
  }
  throw new Error(`Pressing ${JSON.stringify(key)} never gave the expected screen:\n${app.lastFrame()}`);
};

/** Presses `key` and waits for the screen to show `text`. */
const goTo = (app: App, key: string, text: string) => pressUntil(app, key, (frame) => frame.includes(text));

/** Waits until the screen, apart from its header, has stopped changing. */
const settled = async (app: App) => {
  let previous = body(app);
  for (let still = 0; still < 4; ) {
    await wait(50);
    const current = body(app);
    still = current === previous ? still + 1 : 0;
    previous = current;
  }
};

/**
 * Opens a section and waits for it to measure itself, which is when its
 * scrollbar appears, and then for the screen to settle.
 */
const openScrollable = async (app: App, key: string) => {
  await goTo(app, key, '┃');
  await settled(app);
};

describe('keyboard navigation', () => {
  it('jumps to a section with its number', async () => {
    const app = await open();
    await goTo(app, '5', 'OPEN CHANNELS');
    await goTo(app, '4', 'EDUCATION');
  });

  it('steps through the sections with the arrows and tab, wrapping around', async () => {
    const app = await open();
    expect(app.lastFrame()).toContain('SUMMARY');
    await goTo(app, KEYS.right, 'Microsoft');
    expect(app.lastFrame()).not.toContain('SUMMARY');
    await goTo(app, KEYS.left, 'SUMMARY');
    await goTo(app, KEYS.left, 'OPEN CHANNELS');
    await goTo(app, KEYS.tab, 'SUMMARY');
  });

  it('scrolls a section that does not fit, and shows a scrollbar', async () => {
    const app = await open();
    await openScrollable(app, '2');
    expect(app.lastFrame()).not.toContain('Selenium');

    await goTo(app, 'G', 'Selenium');
    expect(app.lastFrame()).not.toContain('Serve as primary technical owner');

    await goTo(app, 'g', 'Serve as primary technical owner');
  });

  it('scrolls by line and by page', async () => {
    const app = await open();
    await openScrollable(app, '2');
    const top = body(app);

    await pressUntil(app, KEYS.down, () => body(app) !== top);
    await pressUntil(app, KEYS.up, () => body(app) === top);

    await pressUntil(app, KEYS.pageDown, () => body(app) !== top);
  });

  it('remembers where each section was scrolled to', async () => {
    const app = await open();
    await openScrollable(app, '2');
    await goTo(app, 'G', 'Selenium');
    const bottom = body(app);
    await goTo(app, '1', 'SUMMARY');
    await pressUntil(app, '2', (frame) => frame.includes('Selenium') && frame.includes('┃'));
    expect(body(app)).toBe(bottom);
  });

  it('does not show a scrollbar when everything fits', async () => {
    const app = await open();
    await goTo(app, '5', 'OPEN CHANNELS');
    expect(app.lastFrame()).not.toContain('┃');
  });
});

describe('entrance effects', () => {
  afterEach(() => vi.useRealTimers());

  it('stop for a page once they have had time to finish, even if the visitor stays on it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { lastFrame, stdin } = render(<App />);
    stdin.write(' '); // skips the intro
    await vi.waitFor(() => expect(lastFrame()).toContain('█'));

    await vi.advanceTimersByTimeAsync(ENTRANCE_MS + 100);
    await vi.waitFor(() => expect(lastFrame()).not.toContain('█'));
    expect(lastFrame()).toContain('mentoring engineers and adapting quickly');
  });
});
