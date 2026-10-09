import { Box, type DOMElement } from 'ink';
import type { ComponentProps, ReactNode, RefObject } from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';
import type { PointerGesture } from '../../ink-bridge/terminal-pointer';
import type { Event } from '../../ink-bridge/types';

/** Where gestures come from: the browser's pointer events, or a fake one in tests. */
export type PointerSource = Event<PointerGesture>;

const PointerContext = createContext<PointerSource | undefined>(undefined);

export function PointerProvider({ source, children }: { source: PointerSource | undefined; children: ReactNode }) {
  return <PointerContext.Provider value={source}>{children}</PointerContext.Provider>;
}

/** Calls `handler` for every gesture while `isActive`. Does nothing without a pointer, as in a plain terminal. */
export function usePointerGesture(handler: (gesture: PointerGesture) => void, isActive = true): void {
  const source = useContext(PointerContext);
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(() => {
    if (!source || !isActive) {
      return;
    }
    const subscription = source((gesture) => latest.current(gesture));
    return () => subscription.dispose();
  }, [source, isActive]);
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Where an element is on the screen, in cells. Ink only reports positions
 * relative to the parent, so this adds up the whole chain. Offsets from
 * scrolling are not included, so it is for things outside scrolled content.
 */
export function absoluteBox(node: DOMElement): Rect | undefined {
  const own = node.yogaNode;
  if (!own) {
    return undefined;
  }
  let left = 0;
  let top = 0;
  for (let current: DOMElement | undefined = node; current; current = current.parentNode) {
    left += current.yogaNode?.getComputedLeft() ?? 0;
    top += current.yogaNode?.getComputedTop() ?? 0;
  }
  return { left, top, width: own.getComputedWidth(), height: own.getComputedHeight() };
}

export type Tapped = Extract<PointerGesture, { type: 'tap' }>;

export interface TapOptions {
  /** Extra cells around the element that still count, for fingers: a row is thin. */
  slopX?: number;
  slopY?: number;
  /** Ignore taps from these pointers. */
  ignore?: (tap: Tapped) => boolean;
}

/** Calls `handler` when a tap lands on the element in `ref`. */
export function useTap(ref: RefObject<DOMElement | null>, handler: (tap: Tapped) => void, options: TapOptions = {}): void {
  const { slopX = 0, slopY = 0, ignore } = options;
  usePointerGesture((gesture) => {
    if (gesture.type !== 'tap' || !ref.current || ignore?.(gesture)) {
      return;
    }
    const box = absoluteBox(ref.current);
    if (
      box &&
      gesture.col >= box.left - slopX &&
      gesture.col < box.left + box.width + slopX &&
      gesture.row >= box.top - slopY &&
      gesture.row < box.top + box.height + slopY
    ) {
      handler(gesture);
    }
  });
}

/** A box that can be tapped. */
export function Tap({
  onTap,
  slopX,
  slopY,
  ignore,
  children,
  ...boxProps
}: { onTap: (tap: Tapped) => void; children: ReactNode } & TapOptions & Omit<ComponentProps<typeof Box>, 'ref' | 'children'>) {
  const ref = useRef<DOMElement>(null);
  useTap(ref, onTap, { slopX, slopY, ignore });
  return (
    <Box ref={ref} {...boxProps}>
      {children}
    </Box>
  );
}
