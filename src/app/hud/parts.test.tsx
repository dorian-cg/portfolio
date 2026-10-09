import { Box } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { MotionProvider } from '../fx/motion';
import { Bullets, Heading } from './parts';

const still = (node: React.ReactNode) =>
  render(<MotionProvider reduced>{node}</MotionProvider>).lastFrame()!;

describe('Heading', () => {
  it('marks the title', () => {
    expect(still(<Heading>SUMMARY</Heading>)).toBe('▌ SUMMARY');
  });
});

describe('Bullets', () => {
  it('puts a marker before every item', () => {
    expect(still(<Bullets items={['one', 'two']} />)).toBe('› one\n› two');
  });

  it('wraps a long item under its own text, not under the marker', () => {
    const out = still(
      <Box width={16}>
        <Bullets items={['alpha bravo charlie delta echo']} />
      </Box>,
    );
    const [first, second] = out.split('\n');
    expect(first!.startsWith('› alpha')).toBe(true);
    expect(second!.startsWith('  ')).toBe(true);
    expect(second!.trim().length).toBeGreaterThan(0);
  });
});
