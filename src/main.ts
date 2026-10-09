import './shims/install';
import chalk from 'chalk';
import { bootstrap } from './bootstrap';
import { startBoot } from './boot/boot-screen';
import { applyBootTheme, bootDisplayStyle } from './boot/boot-theme';
import { createCanvasDisplay } from './boot/display';
import { bootCue } from './boot/boot-sound';
import { bootOptions } from './boot/preferences';
import { createSoundEngine } from './sound/engine';
import { loadFonts, measureCell } from './terminal/font';

// The browser's colour detection is conservative (and zero on some browsers);
// ghostty-web renders truecolor everywhere.
chalk.level = 3;

async function main() {
  const container = document.getElementById('terminal');
  if (!container) {
    throw new Error('Missing #terminal element');
  }
  const bootRoot = document.getElementById('boot');

  // The boot text must use the real font and cell size from its first line.
  await loadFonts();
  const options = bootOptions();
  const log = bootRoot?.querySelector<HTMLElement>('.boot-log');
  let display;
  if (bootRoot && log && !options.skip) {
    const cell = measureCell();
    applyBootTheme(bootRoot, cell);
    display = createCanvasDisplay(log, bootDisplayStyle(cell));
  }

  // Browsers only allow sound after a key press or tap, so a boot that will
  // make sound waits for one at the start. A visitor who muted it, or asked for
  // no animation, is not made to wait.
  const sound = createSoundEngine({ unlockOn: window });
  const boot = startBoot(bootRoot, {
    ...options,
    display,
    gate: sound.available && sound.enabled(),
    onPower: (silent) => (silent ? sound.setEnabled(false) : sound.unlock()),
    onEvent: (event) => {
      const { cue, ...bend } = bootCue(event);
      sound.play(cue, bend);
    },
  });

  // The app starts behind the boot screen, which stays up until it has played
  // out and the terminal is ready.
  let release!: () => void;
  const ready = new Promise<void>((resolve) => (release = resolve));
  try {
    await bootstrap(container, { onMilestone: boot.milestone, ready, sound });
    await boot.done();
    release();
  } catch (error) {
    boot.fail(error);
    throw error;
  }
}

main().catch((error: unknown) => console.error(error));
