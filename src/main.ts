import './shims/install';
import chalk from 'chalk';
import { bootstrap } from './bootstrap';
import { startBoot } from './boot/boot-screen';
import { applyBootTheme, bootDisplayStyle } from './boot/boot-theme';
import { createCanvasDisplay } from './boot/display';
import { bootOptions } from './boot/preferences';
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
  const boot = startBoot(bootRoot, { ...options, display });

  // The app starts behind the boot screen, which stays up until it has played
  // out and the terminal is ready.
  let release!: () => void;
  const ready = new Promise<void>((resolve) => (release = resolve));
  try {
    await bootstrap(container, { onMilestone: boot.milestone, ready });
    await boot.done();
    release();
  } catch (error) {
    boot.fail(error);
    throw error;
  }
}

main().catch((error: unknown) => console.error(error));
