// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startBoot, type BootEvent, type BootOptions } from './boot-screen';
import type { Display, Row } from './display';
import { POWER_PROMPT, type BootStep } from './steps';

/** Records what would be drawn, as plain text rows, and what tone each span has. */
class RecordingDisplay implements Display {
  rows: readonly Row[] = [];
  disposed = false;
  draw(rows: readonly Row[]) {
    this.rows = rows.map((row) => row.map((span) => ({ ...span })));
  }
  dispose() {
    this.disposed = true;
  }
}

let display: RecordingDisplay;

const createRoot = () => {
  const root = document.createElement('div');
  root.innerHTML = '<div class="boot-log"><span class="boot-cursor"></span></div>';
  document.body.append(root);
  return root;
};

const boot = (root: HTMLElement, options: BootOptions = {}) =>
  startBoot(root, { display, ...options });

const rowTexts = (_root?: HTMLElement) =>
  display.rows.map((row) => row.map((span) => span.text).join(''));

const simple: BootStep[] = [
  { kind: 'line', text: 'first', pause: 100 },
  { kind: 'task', text: 'load', work: 100, milestone: 'terminal' },
  { kind: 'line', text: 'last', pause: 100 },
];

describe('startBoot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    display = new RecordingDisplay();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('does nothing without a root element', async () => {
    const screen = startBoot(null, { display });
    screen.milestone('terminal');
    await expect(screen.done()).resolves.toBeUndefined();
    expect(display.disposed).toBe(true);
  });

  it('removes the overlay immediately when skipped up front', async () => {
    const root = createRoot();
    const screen = startBoot(root, { skip: true, display });
    await screen.done();
    expect(root.isConnected).toBe(false);
    expect(display.disposed).toBe(true);
  });

  it('prints lines progressively', async () => {
    const root = createRoot();
    boot(root, { steps: simple });
    expect(rowTexts(root)).toEqual(['first']);

    await vi.advanceTimersByTimeAsync(100);
    expect(rowTexts(root)).toEqual(['first', 'load ...']);
  });

  it('moves the cursor to the end of the last row', async () => {
    const root = createRoot();
    boot(root, { steps: simple });
    const cursor = root.querySelector<HTMLElement>('.boot-cursor')!;
    expect(cursor.style.getPropertyValue('--boot-cursor-row')).toBe('0');
    expect(cursor.style.getPropertyValue('--boot-cursor-col')).toBe('5'); // "first"

    await vi.advanceTimersByTimeAsync(100);
    expect(cursor.style.getPropertyValue('--boot-cursor-row')).toBe('1');
    expect(cursor.style.getPropertyValue('--boot-cursor-col')).toBe('8'); // "load ..."
  });

  it('holds a task until its real milestone is reported', async () => {
    const root = createRoot();
    const screen = boot(root, { steps: simple });
    await vi.advanceTimersByTimeAsync(5000);
    expect(rowTexts(root)).toEqual(['first', 'load ...']);
    expect(display.rows[1].map((span) => span.tone)).toEqual(['text']);

    screen.milestone('terminal');
    await vi.advanceTimersByTimeAsync(0);
    expect(rowTexts(root)).toEqual(['first', 'load ... [ OK ]', 'last']);
  });

  it('does not wait if the milestone was reported early', async () => {
    const root = createRoot();
    const screen = boot(root, { steps: simple });
    screen.milestone('terminal');
    await vi.advanceTimersByTimeAsync(200);
    expect(rowTexts(root)).toEqual(['first', 'load ... [ OK ]', 'last']);
  });

  it('fades out and removes the overlay once finished', async () => {
    const root = createRoot();
    const screen = boot(root, { steps: simple });
    screen.milestone('terminal');

    await vi.advanceTimersByTimeAsync(300);
    expect(root.classList.contains('boot-out')).toBe(true);
    expect(root.isConnected).toBe(true);

    await vi.advanceTimersByTimeAsync(400);
    await screen.done();
    expect(root.isConnected).toBe(false);
  });

  it('counts memory up in place and ends with OK', async () => {
    const root = createRoot();
    boot(root, {
      steps: [{ kind: 'memory', label: 'Memory Test:', total: 640, duration: 200 }],
    });
    const amount = () => Number(rowTexts(root)[0].match(/(\d+)K/)![1]);
    const start = amount();
    expect(start).toBeLessThan(640);

    await vi.advanceTimersByTimeAsync(100);
    expect(amount()).toBeGreaterThan(start);
    expect(amount()).toBeLessThan(640);

    await vi.advanceTimersByTimeAsync(200);
    expect(rowTexts(root)).toEqual(['Memory Test: 640K OK']);
  });

  it('fast-forwards on skip but still waits for real loading', async () => {
    const root = createRoot();
    const screen = boot(root, { steps: simple });
    screen.skip();
    await vi.advanceTimersByTimeAsync(0);
    expect(rowTexts(root)).toEqual(['first', 'load ...']);

    screen.milestone('terminal');
    await vi.advanceTimersByTimeAsync(0);
    expect(rowTexts(root)).toEqual(['first', 'load ... [ OK ]', 'last']);
  });

  it('skips when a key is pressed or the page is clicked', async () => {
    const root = createRoot();
    const screen = boot(root, { steps: simple });
    screen.milestone('terminal');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    await vi.advanceTimersByTimeAsync(0);
    expect(rowTexts(root)).toEqual(['first', 'load ... [ OK ]', 'last']);
  });

  it('shows the error and stays up on failure', async () => {
    const root = createRoot();
    const screen = boot(root, { steps: simple });
    await vi.advanceTimersByTimeAsync(100);

    screen.fail(new Error('wasm failed'));
    await screen.done();

    expect(rowTexts().at(-1)).toBe('[FAIL] wasm failed');
    expect(display.rows.at(-1)?.[0].tone).toBe('fail');
    await vi.advanceTimersByTimeAsync(2000);
    expect(root.isConnected).toBe(true);
    expect(root.classList.contains('boot-out')).toBe(false);
  });

  it('stringifies non-Error failures', async () => {
    const root = createRoot();
    const screen = boot(root, { steps: simple });
    screen.fail('boom');
    await screen.done();
    expect(rowTexts(root).at(-1)).toBe('[FAIL] boom');
  });

  it('stops listening for skip input once finished', async () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const root = createRoot();
    const screen = boot(root, { steps: [{ kind: 'line', text: 'x' }] });
    await vi.advanceTimersByTimeAsync(400);
    await screen.done();
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });
});

describe('startBoot with sound', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    display = new RecordingDisplay();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const gated: BootStep[] = [
    { kind: 'line', text: 'first' },
    { kind: 'power' },
    { kind: 'line', text: 'last', pause: 100 },
  ];
  const prompt = POWER_PROMPT.map((text) => text);

  const press = (key: string, init: KeyboardEventInit = {}) =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key, ...init }));

  /** Starts a gated boot and lets it reach the prompt. */
  const start = async (options: BootOptions = {}, steps: readonly BootStep[] = gated) => {
    const root = createRoot();
    const screen = boot(root, { steps, gate: true, ...options });
    await vi.advanceTimersByTimeAsync(0);
    return { root, screen };
  };

  describe('the power-on gate', () => {
    it('shows the prompt after the banner and waits for the visitor', async () => {
      const { root } = await start();
      expect(rowTexts(root)).toEqual(['first', ...prompt]);

      await vi.advanceTimersByTimeAsync(10_000);
      expect(rowTexts(root)).toEqual(['first', ...prompt]);
      expect(root.classList.contains('boot-out')).toBe(false);
    });

    it('does not wait without a gate, and runs straight through', async () => {
      const root = createRoot();
      boot(root, { steps: gated });
      await vi.advanceTimersByTimeAsync(0);
      expect(rowTexts(root)).toEqual(['first', 'last']);
    });

    it('takes the prompt down and carries on when a key is pressed, without skipping', async () => {
      const onPower = vi.fn();
      const { root } = await start({ onPower });

      press('Enter');
      expect(onPower).toHaveBeenCalledWith(false);
      await vi.advanceTimersByTimeAsync(0);
      expect(rowTexts(root)).toEqual(['first', 'last']);

      // That key press is not also a skip: the last line still pauses.
      await vi.advanceTimersByTimeAsync(50);
      expect(root.classList.contains('boot-out')).toBe(false);
      await vi.advanceTimersByTimeAsync(100);
      expect(root.classList.contains('boot-out')).toBe(true);
    });

    it('powers on with a tap too', async () => {
      const onPower = vi.fn();
      const { root } = await start({ onPower });

      window.dispatchEvent(new Event('pointerdown'));
      expect(onPower).toHaveBeenCalledWith(false);
      await vi.advanceTimersByTimeAsync(0);
      expect(rowTexts(root)).toEqual(['first', 'last']);
    });

    it('powers on silent with M, in either case', async () => {
      const onPower = vi.fn();
      const events: BootEvent[] = [];
      const { root } = await start({ onPower, onEvent: (event) => events.push(event) });

      press('M');
      expect(onPower).toHaveBeenCalledWith(true);
      await vi.advanceTimersByTimeAsync(0);
      expect(events.map((event) => event.type)).toEqual(['line', 'line']);
      expect(root.classList.contains('boot-power')).toBe(false);
    });

    it('announces the power-on and flares the screen', async () => {
      const events: BootEvent[] = [];
      const { root } = await start({ onEvent: (event) => events.push(event) });
      press('a');
      await vi.advanceTimersByTimeAsync(0);
      expect(events.map((event) => event.type)).toEqual(['line', 'power', 'line']);
      expect(root.classList.contains('boot-power')).toBe(true);
    });

    it('ignores modifier keys and a held key', async () => {
      const onPower = vi.fn();
      const { root } = await start({ onPower });

      press('Shift');
      press('Control');
      press('a', { repeat: true });
      expect(onPower).not.toHaveBeenCalled();
      expect(rowTexts(root)).toEqual(['first', ...prompt]);
    });

    it('only powers on once', async () => {
      const onPower = vi.fn();
      await start({ onPower });
      press('a');
      press('b');
      window.dispatchEvent(new Event('pointerdown'));
      expect(onPower).toHaveBeenCalledTimes(1);
    });

    it('is not skipped by holding the key that powered it on', async () => {
      const { root } = await start();
      press('a');
      press('a', { repeat: true });
      press('a', { repeat: true });
      await vi.advanceTimersByTimeAsync(50);
      expect(root.classList.contains('boot-out')).toBe(false);
    });

    it('skips on the next key after powering on', async () => {
      const { root } = await start();
      press('a');
      await vi.advanceTimersByTimeAsync(0);
      press('b');
      await vi.advanceTimersByTimeAsync(0);
      expect(root.classList.contains('boot-out')).toBe(true);
    });

    it('waits a moment for audio to start, but not for ever', async () => {
      const { root } = await start({ onPower: () => new Promise(() => {}) });
      press('a');
      await vi.advanceTimersByTimeAsync(299);
      expect(rowTexts(root)).toEqual(['first']);
      await vi.advanceTimersByTimeAsync(1);
      expect(rowTexts(root)).toEqual(['first', 'last']);
    });

    it('does not wait for audio that has started', async () => {
      const { root } = await start({ onPower: () => Promise.resolve() });
      press('a');
      await vi.advanceTimersByTimeAsync(0);
      expect(rowTexts(root)).toEqual(['first', 'last']);
    });

    it.each([
      [
        'throws',
        () => {
          throw new Error('no audio');
        },
      ],
      ['rejects', () => Promise.reject(new Error('no audio'))],
    ])('carries on when starting audio %s', async (_, onPower) => {
      const { root } = await start({ onPower });
      press('a');
      await vi.advanceTimersByTimeAsync(0);
      expect(rowTexts(root)).toEqual(['first', 'last']);
    });

    it('lets the real loading carry on behind the prompt', async () => {
      const { root, screen } = await start({}, [
        { kind: 'power' },
        { kind: 'task', text: 'load', work: 10, milestone: 'terminal' },
      ]);
      screen.milestone('terminal');
      press('a');
      await vi.advanceTimersByTimeAsync(10);
      expect(rowTexts(root)).toEqual(['load ... [ OK ]']);
    });

    it('takes the prompt down and shows the error if loading fails while waiting', async () => {
      const onPower = vi.fn();
      const { root, screen } = await start({ onPower });
      screen.fail(new Error('wasm failed'));
      await screen.done();
      expect(rowTexts(root)).toEqual(['first', '[FAIL] wasm failed']);

      // The prompt no longer listens.
      press('a');
      expect(onPower).not.toHaveBeenCalled();
    });

    it('skips from the first key when the steps have no power step to wait at', async () => {
      const root = createRoot();
      const screen = boot(root, { steps: simple, gate: true });
      screen.milestone('terminal');
      press('a');
      await vi.advanceTimersByTimeAsync(0);
      expect(rowTexts(root)).toEqual(['first', 'load ... [ OK ]', 'last']);
    });
  });

  describe('events', () => {
    const steps: BootStep[] = [
      { kind: 'line', text: 'banner' },
      { kind: 'blank' },
      { kind: 'memory', label: 'Mem:', total: 100, duration: 100 },
      { kind: 'task', text: 'load', work: 10 },
      { kind: 'task', text: 'more', work: 10 },
      { kind: 'line', text: 'ready.', pause: 10, event: 'ready' },
    ];

    const run = async () => {
      const events: BootEvent[] = [];
      const screen = boot(createRoot(), { steps, onEvent: (event) => events.push(event) });
      await vi.advanceTimersByTimeAsync(1000);
      await screen.done();
      return events;
    };

    it('reports lines, counting, OKs, ready and the fade, in order', async () => {
      const types = (await run()).map((event) => event.type);
      expect(types.filter((type) => type === 'count')).toHaveLength(20);
      expect(types.filter((type) => type !== 'count')).toEqual([
        'line', 'ok', 'line', 'ok', 'line', 'ok', 'ready', 'out',
      ]);
    });

    it('counts progress from nearly 0 to 1 and numbers the OKs from 0', async () => {
      const events = await run();
      const progress = events.flatMap((event) => (event.type === 'count' ? [event.progress] : []));
      expect(progress[0]).toBeCloseTo(0.05);
      expect(progress.at(-1)).toBe(1);
      expect(events.flatMap((event) => (event.type === 'ok' ? [event.index] : []))).toEqual([0, 1, 2]);
    });

    it('does not make a sound for a blank row', async () => {
      const events = await run();
      expect(events.filter((event) => event.type === 'line')).toHaveLength(3);
    });

    it('goes quiet once skipped, except for a failure', async () => {
      const events: BootEvent[] = [];
      const screen = boot(createRoot(), { steps, onEvent: (event) => events.push(event) });
      const before = events.length;
      screen.skip();
      await vi.advanceTimersByTimeAsync(0);
      expect(events).toHaveLength(before);

      screen.fail(new Error('boom'));
      expect(events.at(-1)).toEqual({ type: 'fail' });
    });

    it('reports a failure', async () => {
      const events: BootEvent[] = [];
      const screen = boot(createRoot(), { steps, onEvent: (event) => events.push(event) });
      screen.fail('boom');
      expect(events.at(-1)).toEqual({ type: 'fail' });
    });
  });
});

