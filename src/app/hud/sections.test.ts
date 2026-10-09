import { describe, expect, it } from 'vitest';
import { PAGES, SECTIONS, sectionOf, titleOf } from './sections';

describe('sections', () => {
  it('has the identity page first, then every section in order', () => {
    expect(PAGES).toEqual(['identity', ...SECTIONS.map((section) => section.id)]);
  });

  it('titles every page', () => {
    expect(PAGES.map(titleOf)).toEqual(['IDENTITY', 'PROFILE', 'MISSIONS', 'CAPABILITIES', 'TRAINING', 'COMMS']);
  });

  it('shows the profile beside the identity panel', () => {
    expect(sectionOf('identity')).toBe('profile');
    expect(sectionOf('comms')).toBe('comms');
  });
});
