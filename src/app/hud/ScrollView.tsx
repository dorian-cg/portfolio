import { Box, Text, useBoxMetrics, type DOMElement } from 'ink';
import { useEffect, useRef, type ReactNode } from 'react';
import { Entrance } from '../fx/motion';
import type { ScrollRange } from '../navigation';
import { hud } from './palette';
import { scrollbarThumb } from './scrollbar';
import type { Page } from './sections';

export interface ScrollViewProps {
  page: Page;
  /** Rows to scroll by. */
  scroll: number;
  /** Told how far the content can scroll, whenever that changes. */
  reportRange: (page: Page, range: ScrollRange) => void;
  /** Whether the content plays its entrance effects (typing, decrypting). */
  entrance?: boolean;
  children: ReactNode;
}

/** Clips its content to the space it is given and scrolls it, with a scrollbar. */
export function ScrollView({ page, scroll, reportRange, entrance = true, children }: ScrollViewProps) {
  const viewRef = useRef<DOMElement>(null);
  const contentRef = useRef<DOMElement>(null);
  const view = useBoxMetrics(viewRef);
  const content = useBoxMetrics(contentRef);

  const viewport = view.clientHeight;
  const max = Math.max(0, content.height - viewport);
  const measured = view.hasMeasured && content.hasMeasured;

  useEffect(() => {
    if (measured) {
      reportRange(page, { max, viewport });
    }
  }, [measured, page, max, viewport, reportRange]);

  const thumb = scrollbarThumb(viewport, content.height, scroll);

  return (
    <Box flexGrow={1} flexBasis={0} paddingX={1}>
      <Box ref={viewRef} flexGrow={1} flexDirection="column" overflow="hidden" contentOffsetY={scroll}>
        {/* Never shrinks: the content must keep its full height to be scrolled. */}
        <Box ref={contentRef} flexDirection="column" flexShrink={0}>
          <Entrance play={entrance}>{children}</Entrance>
        </Box>
      </Box>
      {/* Always takes its column, so the text never reflows when a scrollbar is needed. */}
      <Box width={1} marginLeft={1} flexShrink={0} flexDirection="column">
        {max > 0 &&
          Array.from({ length: viewport }, (_, row) => {
            const onThumb = row >= thumb.top && row < thumb.top + thumb.size;
            return (
              <Text key={row} color={onThumb ? hud.line : hud.dim}>
                {onThumb ? '┃' : '│'}
              </Text>
            );
          })}
      </Box>
    </Box>
  );
}
