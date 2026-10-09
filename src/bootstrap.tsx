import { render, type Instance } from 'ink';
import { App } from './app/App';
import { TerminalPointer } from './ink-bridge/terminal-pointer';
import { TerminalStdin } from './ink-bridge/terminal-stdin';
import { TerminalStdout } from './ink-bridge/terminal-stdout';
import type { Milestone } from './boot/steps';
import type { SoundEngine } from './sound/engine';
import { prefersReducedMotion } from './boot/preferences';
import { createTerminal } from './terminal/create-terminal';

export interface BootstrapHooks {
  /** Called as real loading stages complete, to drive the boot screen. */
  onMilestone?: (milestone: Milestone) => void;
  /** Resolves when the boot screen has gone, which is when the intro should start. */
  ready?: Promise<void>;
  /** Makes the app's sounds. Without it the app is silent. */
  sound?: SoundEngine;
}

/** Mounts the terminal in `container` and starts the Ink app inside it. */
export async function bootstrap(
  container: HTMLElement,
  hooks: BootstrapHooks = {},
): Promise<Instance> {
  const { term } = await createTerminal(container);
  hooks.onMilestone?.('terminal');
  const stdout = new TerminalStdout(term);
  const stdin = new TerminalStdin(term);
  const pointer = new TerminalPointer(container, term);

  const instance = render(<App reducedMotion={prefersReducedMotion()} ready={hooks.ready} pointer={pointer.onGesture} sound={hooks.sound} />, {
    stdout: stdout as unknown as NodeJS.WriteStream,
    stderr: stdout as unknown as NodeJS.WriteStream,
    stdin: stdin as unknown as NodeJS.ReadStream,
    exitOnCtrlC: false,
    patchConsole: false,
    interactive: true,
    alternateScreen: true,
  });
  // The pointer listens on the page's container, so it must stop with the app.
  void instance.waitUntilExit().then(
    () => pointer.dispose(),
    () => pointer.dispose(),
  );
  hooks.onMilestone?.('ink');
  return instance;
}
