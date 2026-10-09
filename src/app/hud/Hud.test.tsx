import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { MotionProvider } from '../fx/motion';
import { layoutFor } from '../layout';
import { Hud } from './Hud';
import { PAGES } from './sections';

// Reduced motion shows every effect's final state, so the content can be checked as is.
const frame = (columns: number, rows: number, page: (typeof PAGES)[number]) =>
  render(
    <MotionProvider reduced>
      <Hud layout={layoutFor(columns, rows)} page={page} />
    </MotionProvider>,
  ).lastFrame() ?? '';

const lines = (text: string) => text.split('\n');

describe('Hud', () => {
  describe('wide', () => {
    it('shows the identity panel beside the tabs and the selected section', () => {
      const out = frame(140, 40, 'profile');
      expect(out).toContain('DORIAN CORTES');
      expect(out).toContain('Senior Software Engineer');
      expect(out).toContain('9.9320°N 84.0985°W');
      expect(out).toContain('STATUS');
      for (const title of ['PROFILE', 'MISSIONS', 'CAPABILITIES', 'TRAINING', 'COMMS']) {
        expect(out).toContain(title);
      }
      expect(out).toContain('SUMMARY');
    });

    it('shows the section chosen', () => {
      expect(frame(140, 60, 'missions')).toContain('Gorilla Logic');
      expect(frame(140, 60, 'capabilities')).toContain('Azure Cosmos DB');
      expect(frame(140, 60, 'training')).toContain('Colegio Técnico Don Bosco');
      expect(frame(140, 60, 'comms')).toContain('linkedin.com');
    });
  });

  describe('medium', () => {
    it('shows a one-line identity instead of the panel', () => {
      const out = frame(80, 30, 'profile');
      expect(out).toContain('DORIAN CORTES');
      expect(out).not.toContain('STATUS');
      expect(out).toContain('MISSIONS');
    });
  });

  describe('narrow', () => {
    it('shows the pager with the page position', () => {
      expect(frame(40, 30, 'missions')).toContain('3/6 MISSIONS');
      expect(frame(40, 30, 'identity')).toContain('1/6 IDENTITY');
    });

    it('gives the identity its own page, without the section tabs', () => {
      const out = frame(40, 30, 'identity');
      expect(out).toContain('STATUS');
      expect(out).not.toContain('CAPABILITIES');
    });

    it('keeps the coordinates on one line even on a very small phone', () => {
      expect(frame(30, 46, 'identity')).toContain('◎ 9.9320°N 84.0985°W');
    });

    it('keeps the status rows whole even on a very small phone', () => {
      const out = frame(30, 46, 'identity');
      expect(out).toContain('STATUS ● ONLINE');
      expect(out).toContain('AT     Microsoft');
      expect(out).toMatch(/UPTIME \d+y/);
    });

    it('shows only the selected section on the other pages', () => {
      const out = frame(40, 30, 'training');
      expect(out).toContain('EDUCATION');
      expect(out).not.toContain('STATUS');
    });
  });

  it.each([
    [140, 40],
    [80, 30],
    [40, 30],
    [40, 12],
  ])('fits %i × %i without overflowing the width or height', (columns, rows) => {
    for (const page of PAGES) {
      const out = lines(frame(columns, rows, page));
      expect(out.length).toBeLessThanOrEqual(rows);
      out.forEach((line) => expect(line.length).toBeLessThanOrEqual(columns));
    }
  });
});
