import { createContext, useContext, type ReactNode } from 'react';

interface Motion {
  /** The visitor asked for no animation: every effect shows its final state at once. */
  reduced: boolean;
  /** A section turns its entrance effects off once the visitor has seen them. */
  entrance: boolean;
}

const MotionContext = createContext<Motion>({ reduced: false, entrance: true });

export function MotionProvider({ reduced, children }: { reduced: boolean; children: ReactNode }) {
  const parent = useContext(MotionContext);
  return <MotionContext.Provider value={{ ...parent, reduced }}>{children}</MotionContext.Provider>;
}

/** Turns entrance effects (typing, decrypting) on or off for everything inside. */
export function Entrance({ play, children }: { play: boolean; children: ReactNode }) {
  const parent = useContext(MotionContext);
  return <MotionContext.Provider value={{ ...parent, entrance: play }}>{children}</MotionContext.Provider>;
}

/** Whether ambient motion (spinning, pulsing) should run. */
export const useAmbientMotion = (): boolean => !useContext(MotionContext).reduced;

/** Whether entrance effects should play. */
export const useEntrance = (): boolean => {
  const { reduced, entrance } = useContext(MotionContext);
  return !reduced && entrance;
};
