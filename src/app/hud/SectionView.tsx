import type { ComponentType } from 'react';
import { Capabilities } from './sections/Capabilities';
import { Comms } from './sections/Comms';
import { Missions } from './sections/Missions';
import { Profile } from './sections/Profile';
import { Training } from './sections/Training';
import { ScrollView, type ScrollViewProps } from './ScrollView';
import type { SectionId } from './sections';

const VIEWS: Record<SectionId, ComponentType> = {
  profile: Profile,
  missions: Missions,
  capabilities: Capabilities,
  training: Training,
  comms: Comms,
};

/** The body of the selected section, scrolled. */
export function SectionView({ section, ...scrolling }: { section: SectionId } & Omit<ScrollViewProps, 'page' | 'children'>) {
  const View = VIEWS[section];
  return (
    // Keyed so each section is measured afresh, not with the previous one's size.
    <ScrollView key={section} page={section} {...scrolling}>
      <View />
    </ScrollView>
  );
}
