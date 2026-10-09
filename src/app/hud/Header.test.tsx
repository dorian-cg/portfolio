import { Box } from 'ink';
import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakePointer } from '../../ink-bridge/fake-pointer';
import { openLink } from '../input/open-link';
import { PointerProvider } from '../input/pointer';
import { layoutFor } from '../layout';
import { until, wait } from '../test-utils';
import { GITHUB_ICON, Header, githubName } from './Header';

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
    expect(githubName).toBe('dorian-cg/portfolio');
    expect(GITHUB_ICON).toBe('');
    expect(out.trimEnd().endsWith(`${GITHUB_ICON} dorian-cg/portfolio`)).toBe(true);
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
      expect(openLink).toHaveBeenCalledWith('https://github.com/dorian-cg/portfolio');
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
});
