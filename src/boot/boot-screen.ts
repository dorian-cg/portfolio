import { BOOT_STEPS, type BootStep, type Milestone } from './steps';
import type { Display, Row } from './display';

export interface BootOptions {
  /** Skip the animation entirely (e.g. reduced motion). */
  skip?: boolean;
  /** Draws the boot rows. Without one, the sequence runs but shows no text. */
  display?: Display;
  steps?: readonly BootStep[];
}

export interface BootScreen {
  /** Reports that a real loading stage has completed. */
  milestone(name: Milestone): void;
  /** Resolves once the sequence has played out and the screen has gone. */
  done(): Promise<void>;
  /** Fast-forwards the animation; it still waits for real loading. */
  skip(): void;
  /** Shows an error on the boot screen and keeps it up. */
  fail(error: unknown): void;
}

const FADE_MS = 350;

const noopBoot: BootScreen = {
  milestone() {},
  done: () => Promise.resolve(),
  skip() {},
  fail() {},
};

const nullDisplay: Display = { draw() {}, dispose() {} };

/**
 * Plays a vintage BIOS boot sequence inside `root` (the `#boot` overlay from
 * index.html) while the real app loads behind it.
 */
export function startBoot(root: HTMLElement | null, options: BootOptions = {}): BootScreen {
  if (!root) {
    options.display?.dispose();
    return noopBoot;
  }
  if (options.skip) {
    options.display?.dispose();
    root.remove();
    return noopBoot;
  }

  const { steps = BOOT_STEPS, display = nullDisplay } = options;
  const cursor = root.querySelector<HTMLElement>('.boot-cursor');

  const rows: Row[] = [];
  let skipped = false;
  let aborted = false;
  const pendingSleeps = new Set<() => void>();
  const reached = new Set<Milestone>();
  const waiters = new Map<Milestone, Array<() => void>>();

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      if (skipped || aborted || ms <= 0) {
        resolve();
        return;
      }
      const finish = () => {
        clearTimeout(timer);
        pendingSleeps.delete(finish);
        resolve();
      };
      const timer = setTimeout(finish, ms);
      pendingSleeps.add(finish);
    });

  const waitFor = (name: Milestone) =>
    new Promise<void>((resolve) => {
      if (reached.has(name) || aborted) {
        resolve();
        return;
      }
      waiters.set(name, [...(waiters.get(name) ?? []), resolve]);
    });

  /** Redraws the rows and moves the (CSS-blinking) cursor to the end of the last one. */
  const render = () => {
    display.draw(rows);
    const last = rows.at(-1) ?? [];
    const column = last.reduce((sum, span) => sum + [...span.text].length, 0);
    cursor?.style.setProperty('--boot-cursor-col', String(column));
    cursor?.style.setProperty('--boot-cursor-row', String(Math.max(rows.length - 1, 0)));
  };

  const addRow = (text = ''): Row => {
    const row: Row = text ? [{ text, tone: 'text' }] : [];
    rows.push(row);
    render();
    return row;
  };

  const play = async (step: BootStep) => {
    switch (step.kind) {
      case 'line':
        addRow(step.text);
        await sleep(step.pause ?? 0);
        break;
      case 'blank':
        addRow();
        await sleep(step.pause ?? 0);
        break;
      case 'memory': {
        const row = addRow();
        const frames = 20;
        for (let frame = 1; frame <= frames && !aborted; frame++) {
          const amount = Math.round((step.total * frame) / frames);
          row[0] = { text: `${step.label} ${amount}K`, tone: 'text' };
          render();
          await sleep(step.duration / frames);
        }
        row.push({ text: ' OK', tone: 'ok' });
        render();
        await sleep(100);
        break;
      }
      case 'task': {
        const row = addRow(`${step.text} ...`);
        await sleep(step.work);
        if (step.milestone) {
          await waitFor(step.milestone);
        }
        if (!aborted) {
          row.push({ text: ' [ OK ]', tone: 'ok' });
          render();
        }
        break;
      }
    }
  };

  const run = async () => {
    for (const step of steps) {
      if (aborted) {
        return;
      }
      await play(step);
    }
    if (aborted) {
      return;
    }
    root.classList.add('boot-out');
    await new Promise((resolve) => setTimeout(resolve, FADE_MS));
    root.remove();
    display.dispose();
    removeSkipListeners();
  };

  const skip = () => {
    skipped = true;
    [...pendingSleeps].forEach((finish) => finish());
  };

  const removeSkipListeners = () => {
    window.removeEventListener('keydown', skip);
    window.removeEventListener('pointerdown', skip);
  };
  window.addEventListener('keydown', skip);
  window.addEventListener('pointerdown', skip);

  const completion = run();

  return {
    milestone(name) {
      reached.add(name);
      waiters.get(name)?.forEach((resolve) => resolve());
      waiters.delete(name);
    },
    done: () => completion,
    skip,
    fail(error) {
      aborted = true;
      [...pendingSleeps].forEach((finish) => finish());
      waiters.forEach((list) => list.forEach((resolve) => resolve()));
      waiters.clear();
      removeSkipListeners();
      const message = error instanceof Error ? error.message : String(error);
      rows.push([
        { text: '[FAIL] ', tone: 'fail' },
        { text: message, tone: 'text' },
      ]);
      render();
    },
  };
}
