import { BOOT_STEPS, POWER_PROMPT, type BootStep, type Milestone } from './steps';
import type { Display, Row } from './display';

/** Something the boot did that is worth a sound. */
export type BootEvent =
  | { type: 'power' | 'line' | 'ready' | 'out' | 'fail' }
  /** The memory counter moved; `progress` goes from 0 to 1. */
  | { type: 'count'; progress: number }
  /** A task or the memory test finished; `index` counts them from 0. */
  | { type: 'ok'; index: number };

export interface BootOptions {
  /** Skip the animation entirely (e.g. reduced motion). */
  skip?: boolean;
  /** Draws the boot rows. Without one, the sequence runs but shows no text. */
  display?: Display;
  steps?: readonly BootStep[];
  /**
   * Waits at the `power` step for a key or tap, so the page has the gesture
   * browsers want before they allow sound. Loading carries on behind the wait.
   */
  gate?: boolean;
  /**
   * Called inside that key press or tap, so it can start audio. `silent` is
   * true when the visitor chose M. The boot waits briefly for the promise.
   */
  onPower?: (silent: boolean) => void | Promise<void>;
  /** Called as the boot does things; nothing is reported once the visitor skips. */
  onEvent?: (event: BootEvent) => void;
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

/** The longest the boot waits for audio to start before going on. */
const POWER_WAIT_MS = 300;

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock']);

/** The decision made at the power-on prompt. */
interface Powered {
  silent: boolean;
  pending: void | Promise<void>;
}

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
  const gated = Boolean(options.gate) && steps.some((step) => step.kind === 'power');
  const cursor = root.querySelector<HTMLElement>('.boot-cursor');

  const rows: Row[] = [];
  let skipped = false;
  let aborted = false;
  const pendingSleeps = new Set<() => void>();
  const reached = new Set<Milestone>();
  const waiters = new Map<Milestone, Array<() => void>>();
  let okCount = 0;
  let releaseGate: ((powered?: Powered) => void) | undefined;
  let gateEvent: Event | undefined;

  const emit = (event: BootEvent) => {
    if (!skipped || event.type === 'fail') {
      options.onEvent?.(event);
    }
  };

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

  /** Shows the power-on prompt and waits for a key or tap, then takes it down again. */
  const waitForPower = async () => {
    const first = rows.length;
    POWER_PROMPT.forEach((text) => addRow(text));

    const powered = await new Promise<Powered | undefined>((resolve) => {
      const onGesture = (event: Event) => {
        if (event instanceof KeyboardEvent && (event.repeat || MODIFIER_KEYS.has(event.key))) {
          return;
        }
        removeGateListeners();
        gateEvent = event;
        const silent = event instanceof KeyboardEvent && event.key.toLowerCase() === 'm';
        // Inside the gesture, which is the only place audio may start.
        let pending: void | Promise<void>;
        try {
          pending = options.onPower?.(silent);
        } catch {
          pending = undefined;
        }
        resolve({ silent, pending });
      };
      const removeGateListeners = () => {
        window.removeEventListener('keydown', onGesture);
        window.removeEventListener('pointerdown', onGesture);
        releaseGate = undefined;
      };
      window.addEventListener('keydown', onGesture);
      window.addEventListener('pointerdown', onGesture);
      releaseGate = (value) => {
        removeGateListeners();
        resolve(value);
      };
    });

    // Only the prompt's own rows: a failure may have added its message below them.
    rows.splice(first, POWER_PROMPT.length);
    render();
    if (!powered || aborted) {
      return;
    }
    listenForSkip();
    if (!powered.silent) {
      root.classList.add('boot-power');
      emit({ type: 'power' });
    }
    // A rejected or slow start of audio must not hold the boot up.
    await Promise.race([
      Promise.resolve(powered.pending).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, POWER_WAIT_MS)),
    ]);
  };

  const play = async (step: BootStep) => {
    switch (step.kind) {
      case 'line':
        addRow(step.text);
        emit({ type: step.event ?? 'line' });
        await sleep(step.pause ?? 0);
        break;
      case 'power':
        if (gated) {
          await waitForPower();
        }
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
          emit({ type: 'count', progress: frame / frames });
          await sleep(step.duration / frames);
        }
        row.push({ text: ' OK', tone: 'ok' });
        render();
        emit({ type: 'ok', index: okCount++ });
        await sleep(100);
        break;
      }
      case 'task': {
        const row = addRow(`${step.text} ...`);
        emit({ type: 'line' });
        await sleep(step.work);
        if (step.milestone) {
          await waitFor(step.milestone);
        }
        if (!aborted) {
          row.push({ text: ' [ OK ]', tone: 'ok' });
          render();
          emit({ type: 'ok', index: okCount++ });
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
    emit({ type: 'out' });
    await new Promise((resolve) => setTimeout(resolve, FADE_MS));
    root.remove();
    display.dispose();
    removeSkipListeners();
  };

  const skip = () => {
    skipped = true;
    [...pendingSleeps].forEach((finish) => finish());
  };

  // The key or tap that powered the boot on must not also skip it, and neither must holding that key.
  const onSkipInput = (event: Event) => {
    if (event !== gateEvent && !(event instanceof KeyboardEvent && event.repeat)) {
      skip();
    }
  };
  const listenForSkip = () => {
    window.addEventListener('keydown', onSkipInput);
    window.addEventListener('pointerdown', onSkipInput);
  };
  const removeSkipListeners = () => {
    window.removeEventListener('keydown', onSkipInput);
    window.removeEventListener('pointerdown', onSkipInput);
  };
  if (!gated) {
    listenForSkip();
  }

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
      releaseGate?.();
      [...pendingSleeps].forEach((finish) => finish());
      waiters.forEach((list) => list.forEach((resolve) => resolve()));
      waiters.clear();
      removeSkipListeners();
      emit({ type: 'fail' });
      const message = error instanceof Error ? error.message : String(error);
      rows.push([
        { text: '[FAIL] ', tone: 'fail' },
        { text: message, tone: 'text' },
      ]);
      render();
    },
  };
}
