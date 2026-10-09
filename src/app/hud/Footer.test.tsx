import { Box } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { layoutFor } from '../layout';
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
});
