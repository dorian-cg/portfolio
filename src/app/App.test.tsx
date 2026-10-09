import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { INTRO_DURATION } from './intro-script';
import { until, wait } from './test-utils';

const SUMMARY_END = 'mentoring engineers and adapting quickly';

describe('App', () => {
  it('shows the HUD', () => {
    const { lastFrame } = render(<App reducedMotion />);
    expect(lastFrame()).toContain('DORIAN CORTES');
  });

  it('shows the uptime in the header', () => {
    expect(render(<App reducedMotion />).lastFrame()).toMatch(/UPTIME \d+y \d\dm \d\dd \d\d:\d\d:\d\d/);
  });

  it('shows the whole profile at once when motion is reduced', () => {
    const { lastFrame } = render(<App reducedMotion />);
    expect(lastFrame()).toContain('SUMMARY');
    expect(lastFrame()).toContain(SUMMARY_END);
  });

  describe('with motion', () => {
    /** Renders the app and skips the intro, as a visitor would with any key. */
    const skipIntro = async () => {
      const app = render(<App />);
      await until(app.lastFrame, (frame) => frame.includes('> '));
      app.stdin.write(' ');
      await until(app.lastFrame, (frame) => frame.includes('PROFILE'));
      return app;
    };

    it('plays the intro before the HUD, and skips it on a key press', async () => {
      const { lastFrame, stdin } = render(<App />);
      await until(lastFrame, (frame) => frame.includes('> DC//'));
      expect(lastFrame()).not.toContain('PROFILE');

      stdin.write(' ');
      await until(lastFrame, (frame) => frame.includes('PROFILE'));
      expect(lastFrame()).not.toContain('press any key or tap to skip');
    });

    it('does not navigate with the key that skipped the intro', async () => {
      const { lastFrame, stdin } = render(<App />);
      await until(lastFrame, (frame) => frame.includes('> '));
      stdin.write('2');
      // The profile, not the missions, types itself out.
      await until(lastFrame, (frame) => frame.includes(SUMMARY_END));
      expect(lastFrame()).not.toContain('Gorilla Logic');
    });

    it('waits for the boot screen to go before starting the intro', async () => {
      let release!: () => void;
      const ready = new Promise<void>((resolve) => (release = resolve));
      const { lastFrame, stdin } = render(<App ready={ready} />);

      await wait(400);
      expect(lastFrame()).not.toContain('> ');
      expect(lastFrame()).not.toContain('PROFILE');
      stdin.write(' '); // a key during the boot screen must not skip the intro that has not started
      await wait(100);

      release();
      await until(lastFrame, (frame) => frame.includes('> DC//'));
      expect(lastFrame()).not.toContain('PROFILE');
    });

    it('moves on to the HUD by itself when the intro has played out', async () => {
      const { lastFrame } = render(<App />);
      await until(lastFrame, (frame) => frame.includes('PROFILE'), INTRO_DURATION * 3);
    });

    it('types the section out instead of showing it at once', async () => {
      const { lastFrame } = await skipIntro();
      expect(lastFrame()).not.toContain(SUMMARY_END);
      expect(lastFrame()).toContain('█');

      await until(lastFrame, (frame) => frame.includes(SUMMARY_END));
      expect(lastFrame()).toContain('SUMMARY');
    });

    it('types out the whole section, including what is scrolled out of view', async () => {
      const { lastFrame, stdin } = await skipIntro();
      await until(lastFrame, (frame) => frame.includes(SUMMARY_END) && frame.includes('┃'));
      await wait(1500);
      stdin.write('G');
      await until(lastFrame, (frame) => frame.includes('Mentor engineers joining the team'));
    });

    it('types a section out again every time it is opened', async () => {
      const { lastFrame, stdin } = await skipIntro();
      await until(lastFrame, (frame) => frame.includes(SUMMARY_END) && !frame.includes('█'));

      stdin.write('2');
      await until(lastFrame, (frame) => frame.includes('Jan 2022 – Present') && frame.includes('█'));
      await until(lastFrame, (frame) => !frame.includes('█'));

      // Back to the profile, which is typed out afresh, not shown whole.
      stdin.write('1');
      await until(lastFrame, (frame) => frame.includes('█') && !frame.includes(SUMMARY_END));
      await until(lastFrame, (frame) => frame.includes(SUMMARY_END));
    });
  });
});
