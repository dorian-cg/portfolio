// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startBoot, type BootOptions } from './boot-screen';
import type { Display, Row } from './display';
import type { BootStep } from './steps';

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
