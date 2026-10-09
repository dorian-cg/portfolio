import { Box } from 'ink';
import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakePointer } from '../../ink-bridge/fake-pointer';
import { RecordingSound } from '../../sound/fake-audio';
import { openLink } from '../input/open-link';
import { PointerProvider } from '../input/pointer';
import { layoutFor } from '../layout';
import { SoundProvider } from '../sound';
import { until, wait } from '../test-utils';
import { GITHUB_ICON, Header, SOUND_OFF, SOUND_ON, githubName } from './Header';

vi.mock('../input/open-link', () => ({ openLink: vi.fn() }));

// ink-testing-library draws into a 100-column screen, so wide is tested at its narrowest, 100.
const WIDE = 100;

const frame = (columns: number) =>
  render(
    <Box width={columns} flexDirection="column">
      <Header layout={layoutFor(columns, 40)} />
    </Box>,
  ).lastFrame()!;

beforeEach(() => vi.mocked(openLink).mockClear());

describe('Header', () => {
  it('names the interface and shows the uptime on the wide layout', () => {
    expect(frame(WIDE)).toContain('DC//OS · PORTFOLIO INTERFACE');
    expect(frame(WIDE)).toMatch(/UPTIME \d+y/);
  });

  it('leaves out the interface name when medium is short of room', () => {
    expect(frame(80)).not.toContain('PORTFOLIO INTERFACE');
    expect(frame(80)).toMatch(/UPTIME \d+y/);
  });

  it('keeps only the name and the repository on a phone, where the uptime goes on the identity page', () => {
    const out = frame(36);
    expect(out).toContain('DC//OS');
    expect(out).toContain(githubName);
    expect(out).not.toContain('UPTIME');
  });

  it('no longer shows a status in the corner', () => {
    for (const columns of [WIDE, 80, 36]) {
      expect(frame(columns)).not.toContain('ONLINE');
    }
  });

  it('shows the GitHub icon and the repository on the right', () => {
    const out = frame(WIDE);
    expect(githubName).toBe('dorian-cortes/portfolio');
    expect(GITHUB_ICON).toBe('');
    expect(out.trimEnd().endsWith(`${GITHUB_ICON} dorian-cortes/portfolio`)).toBe(true);
  });

  it('fits every width it is used at', () => {
    for (const columns of [WIDE, 99, 60, 59, 36]) {
      for (const line of frame(columns).split('\n')) {
        expect(line.length).toBeLessThanOrEqual(columns);
      }
    }
  });

  describe('the repository link', () => {
    const mount = (columns: number) => {
      const pointer = new FakePointer();
      const { lastFrame } = render(
        <PointerProvider source={pointer.onGesture}>
          <Box width={columns} flexDirection="column">
            <Header layout={layoutFor(columns, 40)} />
          </Box>
        </PointerProvider>,
      );
      return { pointer, lastFrame };
    };

    it.each(['mouse', 'touch'])('opens the repository when tapped with a %s', async (pointerType) => {
      const { pointer, lastFrame } = mount(WIDE);
      await until(lastFrame, (out) => out.includes(githubName));
      await wait(60);
      const col = lastFrame()!.indexOf(githubName) + 2;
      pointer.tap(col, 0, pointerType);
      expect(openLink).toHaveBeenCalledWith('https://github.com/dorian-cortes/portfolio');
    });

    it('does not open for a tap elsewhere in the header', async () => {
      const { pointer, lastFrame } = mount(WIDE);
      await until(lastFrame, (out) => out.includes(githubName));
      await wait(60);
      pointer.tap(3, 0);
      pointer.tap(50, 0);
      expect(openLink).not.toHaveBeenCalled();
    });
  });

  describe('the sound toggle', () => {
    const mount = (columns: number, sound = new RecordingSound()) => {
      const pointer = new FakePointer();
      const app = render(
        <PointerProvider source={pointer.onGesture}>
          <SoundProvider engine={sound}>
            <Box width={columns} flexDirection="column">
              <Header layout={layoutFor(columns, 40)} />
            </Box>
          </SoundProvider>
        </PointerProvider>,
      );
      return { pointer, sound, ...app };
    };

    it('is not shown when the browser cannot make sound', () => {
      for (const columns of [WIDE, 36]) {
        expect(frame(columns)).not.toContain(SOUND_ON);
      }
    });

    it('shows a note beside the repository when sound is on', () => {
      const out = mount(WIDE).lastFrame()!;
      expect(out.trimEnd().endsWith(`${SOUND_ON}  ${GITHUB_ICON} ${githubName}`)).toBe(true);
    });

    it('shows the note struck through when muted', () => {
      const sound = new RecordingSound();
      sound.setEnabled(false);
      expect(mount(WIDE, sound).lastFrame()).toContain(`${SOUND_OFF}  ${GITHUB_ICON}`);
    });

    it('toggles sound when tapped, and shows it', async () => {
      const { pointer, sound, lastFrame } = mount(WIDE);
      await until(lastFrame, (out) => out.includes(SOUND_ON));
      await wait(60);

      pointer.tap(lastFrame()!.indexOf(SOUND_ON) + 1, 0);
      expect(sound.enabled()).toBe(false);
      await until(lastFrame, (out) => out.includes(SOUND_OFF));

      pointer.tap(lastFrame()!.indexOf(SOUND_OFF) + 1, 0);
      expect(sound.enabled()).toBe(true);
      await until(lastFrame, (out) => !out.includes(SOUND_OFF));
    });

    it('forgives a thumb that lands a cell off, without reaching the repository link', async () => {
      const { pointer, sound, lastFrame } = mount(36);
      await until(lastFrame, (out) => out.includes(SOUND_ON));
      await wait(60);
      const note = lastFrame()!.indexOf(SOUND_ON);

      pointer.tap(note + 1, 0, 'touch');
      expect(sound.enabled()).toBe(false);
      expect(openLink).not.toHaveBeenCalled();
    });

    it('plays a sound when the repository link is opened', async () => {
      const { pointer, sound, lastFrame } = mount(WIDE);
      await until(lastFrame, (out) => out.includes(githubName));
      await wait(60);
      pointer.tap(lastFrame()!.indexOf(githubName) + 2, 0);
      expect(sound.cues).toEqual(['link']);
      expect(openLink).toHaveBeenCalled();
    });

    it('fits every width the header is used at', () => {
      for (const columns of [WIDE, 99, 60, 59, 36]) {
        for (const line of mount(columns).lastFrame()!.split('\n')) {
          expect(line.length).toBeLessThanOrEqual(columns);
        }
      }
    });
  });
});
