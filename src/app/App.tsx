import { Box, useWindowSize } from 'ink';
import { useCallback, useEffect, useState } from 'react';
import { silentEngine, type SoundEngine } from '../sound/engine';
import { MotionProvider } from './fx/motion';
import { Hud } from './hud/Hud';
import { PointerProvider, type PointerSource } from './input/pointer';
import { Intro } from './Intro';
import { layoutFor } from './layout';
import { SoundProvider } from './sound';
import { useNavigation } from './use-navigation';

export interface AppProps {
  /** Skip every animation, the intro included, and show final states at once. */
  reducedMotion?: boolean;
  /**
   * Resolves when whatever covers the terminal (the boot screen) has gone. The
   * intro starts then, so it is not played out behind it. Without it the app
   * starts at once.
   */
  ready?: Promise<void>;
  /** Taps, swipes and the wheel. Without it the app only answers the keyboard. */
  pointer?: PointerSource;
  /** Makes the sounds. Without it the app is silent. */
  sound?: SoundEngine;
}

export function App({ reducedMotion = false, ready, pointer, sound = silentEngine }: AppProps) {
  return (
    <PointerProvider source={pointer}>
      <SoundProvider engine={sound}>
        <MotionProvider reduced={reducedMotion}>
          <Screen reducedMotion={reducedMotion} ready={ready} />
        </MotionProvider>
      </SoundProvider>
    </PointerProvider>
  );
}

/** Inside the providers, so its hooks can see the pointer. */
function Screen({ reducedMotion, ready }: Pick<AppProps, 'reducedMotion' | 'ready'>) {
  const { columns, rows } = useWindowSize();
  const layout = layoutFor(columns, rows);
  const [revealed, setRevealed] = useState(!ready);
  const [introDone, setIntroDone] = useState(Boolean(reducedMotion));
  const finishIntro = useCallback(() => setIntroDone(true), []);

  useEffect(() => {
    let current = true;
    void ready?.then(() => current && setRevealed(true));
    return () => {
      current = false;
    };
  }, [ready]);

  // The key that skips the intro must not also navigate, so navigation waits for it.
  const { page, visited, scroll, reportRange, goto, step } = useNavigation(layout, introDone);

  if (!revealed) {
    return <Box width={layout.columns} height={layout.rows} />;
  }
  if (!introDone) {
    return <Intro layout={layout} onDone={finishIntro} />;
  }
  return (
    <Hud
      layout={layout}
      page={page}
      visited={visited}
      scroll={scroll}
      reportRange={reportRange}
      onSelect={goto}
      onStep={step}
    />
  );
}
