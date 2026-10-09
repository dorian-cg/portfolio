import { render, type Instance } from 'ink';
import { App } from './app/App';
import { TerminalStdin } from './ink-bridge/terminal-stdin';
import { TerminalStdout } from './ink-bridge/terminal-stdout';
import type { Milestone } from './boot/steps';
import { createTerminal } from './terminal/create-terminal';

export interface BootstrapHooks {
  /** Called as real loading stages complete, to drive the boot screen. */
  onMilestone?: (milestone: Milestone) => void;
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

  const instance = render(<App />, {
    stdout: stdout as unknown as NodeJS.WriteStream,
    stderr: stdout as unknown as NodeJS.WriteStream,
    stdin: stdin as unknown as NodeJS.ReadStream,
    exitOnCtrlC: false,
    patchConsole: false,
    interactive: true,
    alternateScreen: true,
  });
  hooks.onMilestone?.('ink');
  return instance;
}
