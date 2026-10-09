import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { silentEngine } from '../sound/engine';
import { RecordingSound } from '../sound/fake-audio';
import { SoundProvider, useSound, useSoundEnabled, useSoundEngine } from './sound';
import { until } from './test-utils';

function Probe() {
  const enabled = useSoundEnabled();
  const engine = useSoundEngine();
  return (
    <Text>
      {enabled ? 'on' : 'off'} {engine.available ? 'available' : 'unavailable'}
    </Text>
  );
}

describe('SoundProvider', () => {
  it('is silent and off without a provider', () => {
    expect(render(<Probe />).lastFrame()).toBe('off unavailable');
  });

  it('hands the engine to the components inside', () => {
    expect(render(<SoundProvider engine={silentEngine}><Probe /></SoundProvider>).lastFrame()).toBe('off unavailable');
    const sound = new RecordingSound();
    expect(render(<SoundProvider engine={sound}><Probe /></SoundProvider>).lastFrame()).toBe('on available');
  });

  it('re-renders when sound is switched on or off', async () => {
    const sound = new RecordingSound();
    const { lastFrame } = render(<SoundProvider engine={sound}><Probe /></SoundProvider>);
    sound.setEnabled(false);
    await until(lastFrame, (frame) => frame.startsWith('off'));
    sound.setEnabled(true);
    await until(lastFrame, (frame) => frame.startsWith('on'));
  });

  it('plays through the engine', () => {
    function Player() {
      const play = useSound();
      play('section', { pitch: 2 });
      return null;
    }
    const sound = new RecordingSound();
    render(<SoundProvider engine={sound}><Player /></SoundProvider>);
    expect(sound.plays[0]).toEqual({ cue: 'section', options: { pitch: 2 } });
  });

  it('keeps the same play function between renders', () => {
    const seen = new Set<unknown>();
    function Collector({ n }: { n: number }) {
      seen.add(useSound());
      return <Text>{n}</Text>;
    }
    const sound = new RecordingSound();
    const { rerender } = render(<SoundProvider engine={sound}><Collector n={1} /></SoundProvider>);
    rerender(<SoundProvider engine={sound}><Collector n={2} /></SoundProvider>);
    expect(seen.size).toBe(1);
  });
});
