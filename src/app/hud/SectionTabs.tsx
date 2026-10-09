import { Box, Text } from 'ink';
import { Tap } from '../input/pointer';
import type { Layout } from '../layout';
import { hud } from './palette';
import { PAGES, SECTIONS, titleOf, type Page, type SectionId } from './sections';

export interface SectionTabsProps {
  section: SectionId;
  layout: Layout;
  /** Called when a tab is tapped. */
  onSelect?: (section: SectionId) => void;
}

/** The wide and medium layouts' tab bar. */
export function SectionTabs({ section, layout, onSelect }: SectionTabsProps) {
  const numbered = layout.mode === 'wide';
  return (
    <Box columnGap={2} paddingX={1} marginBottom={1} flexShrink={0}>
      {SECTIONS.map(({ id, title }, index) => {
        const label = numbered ? `${index + 1} ${title}` : title;
        return (
          <Tap key={id} onTap={() => onSelect?.(id)}>
            {id === section ? (
              <Text bold inverse color={hud.accent}>
                {` ${label} `}
              </Text>
            ) : (
              <Text color={hud.line}>{` ${label} `}</Text>
            )}
          </Tap>
        );
      })}
    </Box>
  );
}

export interface PagerProps {
  page: Page;
  /** Called when an arrow is tapped. */
  onStep?: (delta: 1 | -1) => void;
}

/** The narrow layout's pager: `‹  2/6 MISSIONS  ›`. The arrows are easy to hit with a thumb. */
export function Pager({ page, onStep }: PagerProps) {
  const position = PAGES.indexOf(page) + 1;
  return (
    <Box justifyContent="space-between" paddingX={1} flexShrink={0}>
      <Tap onTap={() => onStep?.(-1)} width={3} slopX={2} slopY={1} justifyContent="center">
        <Text bold color={hud.line}>
          ‹
        </Text>
      </Tap>
      <Text>
        <Text color={hud.dim}>
          {position}/{PAGES.length}{' '}
        </Text>
        <Text bold color={hud.accent}>
          {titleOf(page)}
        </Text>
      </Text>
      <Tap onTap={() => onStep?.(1)} width={3} slopX={2} slopY={1} justifyContent="center">
        <Text bold color={hud.line}>
          ›
        </Text>
      </Tap>
    </Box>
  );
}
