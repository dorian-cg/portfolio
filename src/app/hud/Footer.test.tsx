import { Box } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { RecordingSound } from '../../sound/fake-audio';
import { layoutFor } from '../layout';
import { SoundProvider } from '../sound';
import { Footer } from './Footer';

const frame = (columns: number) =>
  render(
    <Box width={columns}>
      <Footer layout={layoutFor(columns, 40)} />
    </Box>,
  ).lastFrame()!;

describe('Footer', () => {
  it('lists every key on the wide layout', () => {
    expect(frame(140)).toContain('←/→ section · 1-5 jump · ↑/↓ scroll');
  });

  it('drops the number keys on the medium layout', () => {
    expect(frame(80)).toContain('←/→ section · ↑/↓ scroll');
    expect(frame(80)).not.toContain('1-5');
  });

  it('talks about pages and touch on a phone', () => {
    expect(frame(36)).toContain('‹ › page · ↕ scroll');
  });

  it('fits a phone', () => {
    expect(frame(36).length).toBeLessThanOrEqual(36);
  });

  describe('with sound', () => {
    const withSound = (columns: number) =>
      render(
        <SoundProvider engine={new RecordingSound()}>
          <Box width={columns}>
            <Footer layout={layoutFor(columns, 40)} />
          </Box>
        </SoundProvider>,
      ).lastFrame()!;

    it('adds the mute key on the wide and medium layouts', () => {
      expect(withSound(140)).toContain('←/→ section · 1-5 jump · ↑/↓ scroll · m sound');
      expect(withSound(80)).toContain('←/→ section · ↑/↓ scroll · m sound');
    });

    it('leaves it out on a phone, which has the header toggle and no keyboard', () => {
      expect(withSound(36)).not.toContain('m sound');
      expect(withSound(36).length).toBeLessThanOrEqual(36);
    });

    it('does not mention it when there is no sound to mute', () => {
      expect(frame(140)).not.toContain('m sound');
    });
  });
});
