export const SECTIONS = [
  { id: 'profile', title: 'PROFILE' },
  { id: 'missions', title: 'MISSIONS' },
  { id: 'capabilities', title: 'CAPABILITIES' },
  { id: 'training', title: 'TRAINING' },
  { id: 'comms', title: 'COMMS' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/**
 * What the screen shows. The narrow layout gives the identity panel a page of
 * its own; wider layouts always show it beside the sections.
 */
export type Page = 'identity' | SectionId;

export const PAGES: readonly Page[] = ['identity', ...SECTIONS.map((section) => section.id)];

export const titleOf = (id: Page): string =>
  id === 'identity' ? 'IDENTITY' : SECTIONS.find((section) => section.id === id)!.title;

/** The section shown beside the identity panel for `page`. */
export const sectionOf = (page: Page): SectionId => (page === 'identity' ? 'profile' : page);
