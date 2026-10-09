import { Box } from 'ink';
import type { Layout } from '../layout';
import type { ScrollRange } from '../navigation';
import { Footer } from './Footer';
import { Header } from './Header';
import { IdentityPanel, IdentityStrip } from './IdentityPanel';
import { sectionOf, type Page } from './sections';
import { SectionTabs, Pager } from './SectionTabs';
import { ScrollView } from './ScrollView';
import { SectionView } from './SectionView';
import { hud } from './palette';

export interface HudProps {
  layout: Layout;
  page: Page;
  /** Rows the page is scrolled by. */
  scroll?: number;
  /** Pages whose entrance effects have finished, so a remount does not replay them. */
  visited?: Partial<Record<Page, true>>;
  reportRange?: (page: Page, range: ScrollRange) => void;
  /** A tab was tapped. */
  onSelect?: (page: Page) => void;
  /** A pager arrow was tapped. */
  onStep?: (delta: 1 | -1) => void;
}

const ignoreRange = () => {};

/** The main screen. Arranges the same panels three ways, by terminal width. */
export function Hud({ layout, page, scroll = 0, visited = {}, reportRange = ignoreRange, onSelect, onStep }: HudProps) {
  const section = sectionOf(page);
  const scrolling = { scroll, reportRange, entrance: !visited[section] };
  const frame = { width: layout.columns, height: layout.rows, flexDirection: 'column' } as const;

  if (layout.mode === 'wide') {
    return (
      <Box {...frame}>
        <Header layout={layout} />
        <Box flexGrow={1} flexBasis={0}>
          <Box
            width={layout.sidebarWidth}
            flexShrink={0}
            borderStyle="round"
            borderColor={hud.line}
            paddingY={1}
          >
            <IdentityPanel layout={layout} />
          </Box>
          <Box flexGrow={1} flexBasis={0} flexDirection="column" borderStyle="round" borderColor={hud.line}>
            <SectionTabs section={section} layout={layout} onSelect={onSelect} />
            <SectionView section={section} {...scrolling} />
          </Box>
        </Box>
        <Footer layout={layout} />
      </Box>
    );
  }

  if (layout.mode === 'medium') {
    return (
      <Box {...frame}>
        <Header layout={layout} />
        <IdentityStrip layout={layout} />
        <Box flexGrow={1} flexBasis={0} flexDirection="column" borderStyle="round" borderColor={hud.line}>
          <SectionTabs section={section} layout={layout} onSelect={onSelect} />
          <SectionView section={section} {...scrolling} />
        </Box>
        <Footer layout={layout} />
      </Box>
    );
  }

  return (
    <Box {...frame}>
      <Header layout={layout} />
      <Pager page={page} onStep={onStep} />
      <Box flexGrow={1} flexBasis={0} flexDirection="column" borderStyle="round" borderColor={hud.line}>
        {page === 'identity' ? (
          <ScrollView key={page} page={page} {...scrolling}>
            <IdentityPanel layout={layout} />
          </ScrollView>
        ) : (
          <SectionView section={section} {...scrolling} />
        )}
      </Box>
      <Footer layout={layout} />
    </Box>
  );
}
