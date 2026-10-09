import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { layoutFor } from '../layout';
import { Pager, SectionTabs } from './SectionTabs';

describe('SectionTabs', () => {
  it('numbers the tabs on the wide layout, to match the number keys', () => {
    const { lastFrame } = render(<SectionTabs section="profile" layout={layoutFor(140, 40)} />);
    expect(lastFrame()).toMatch(/1 PROFILE\s+2 MISSIONS\s+3 CAPABILITIES\s+4 TRAINING\s+5 COMMS/);
  });

  it('drops the numbers on the medium layout, to fit', () => {
    const { lastFrame } = render(<SectionTabs section="profile" layout={layoutFor(80, 40)} />);
    expect(lastFrame()).toMatch(/PROFILE\s+MISSIONS\s+CAPABILITIES\s+TRAINING\s+COMMS/);
    expect(lastFrame()).not.toMatch(/\d PROFILE/);
  });

  it('fits the medium layout', () => {
    const [firstLine] = render(<SectionTabs section="comms" layout={layoutFor(60, 40)} />).lastFrame()!.split('\n');
    expect(firstLine!.length).toBeLessThanOrEqual(60);
  });
});

describe('Pager', () => {
  it('shows the position and the title between two arrows', () => {
    const { lastFrame } = render(<Pager page="capabilities" />);
    expect(lastFrame()).toMatch(/‹\s+4\/6 CAPABILITIES\s+›/);
  });

  it('counts the identity page first', () => {
    expect(render(<Pager page="identity" />).lastFrame()).toContain('1/6 IDENTITY');
  });
});
