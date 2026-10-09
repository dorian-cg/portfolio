import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { CueName, PlayOptions } from '../sound/cues';
import { silentEngine, type SoundEngine } from '../sound/engine';

const SoundContext = createContext<SoundEngine>(silentEngine);

export function SoundProvider({ engine, children }: { engine: SoundEngine; children: ReactNode }) {
  return <SoundContext.Provider value={engine}>{children}</SoundContext.Provider>;
}

/** The app's sound engine: silent unless a `SoundProvider` gave it a real one. */
export const useSoundEngine = (): SoundEngine => useContext(SoundContext);

/** Plays a cue. The function keeps its identity, so it is safe in effect dependencies. */
export function useSound(): (cue: CueName, options?: PlayOptions) => void {
  const engine = useSoundEngine();
  return useCallback((cue, options) => engine.play(cue, options), [engine]);
}

/** Whether sound is on, re-rendering when the visitor flips it. */
export function useSoundEnabled(): boolean {
  const engine = useSoundEngine();
  return useSyncExternalStore(engine.subscribe, engine.enabled);
}
