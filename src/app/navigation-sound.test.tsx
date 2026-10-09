import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { scalePitch } from '../sound/cues';
import { RecordingSound } from '../sound/fake-audio';
import { App } from './App';
import { until, wait } from './test-utils';

const KEYS = { right: '\u001B[C', left: '\u001B[D', down: '\u001B[B', up: '\u001B[A', pageDown: '\u001B[6~' };

/** Renders the app, already past the intro, with a sound engine that writes down what it plays. */
const open = async () => {
  const sound = new RecordingSound();
  const app = render(<App reducedMotion sound={sound} />);
  // The identity page hands over to the profile a moment after the first render.
  await until(app.lastFrame, (frame) => frame.includes('SUMMARY'));
  await wait(80);
  return { app, sound };
};

type Opened = Awaited<ReturnType<typeof open>>;

/** Presses a key and gives the app time to act on it and draw. */
const press = async ({ app }: Opened, key: string) => {
  app.stdin.write(key);
  await wait(80);
};

/** Opens the missions section and waits for it to measure itself, which is when its scrollbar appears. */
const openScrollable = async (opened: Opened) => {
  const { app, sound } = opened;
  const deadline = Date.now() + 4000;
  while (!app.lastFrame()!.includes('┃') && Date.now() < deadline) {
    app.stdin.write('2');
    await wait(150);
  }
  await until(app.lastFrame, (frame) => frame.includes('┃'));
  await wait(300);
  sound.plays.length = 0;
};

describe('section sounds', () => {
  it('is silent at the start, even though the identity page hands over to the profile', async () => {
    const { sound } = await open();
    expect(sound.plays).toEqual([]);
  });

  it('plays a note per section when stepping with the arrows', async () => {
    const opened = await open();
    await press(opened, KEYS.right);
    await press(opened, KEYS.right);
    await press(opened, KEYS.left);
    expect(opened.sound.plays).toEqual([
      { cue: 'section', options: { pitch: scalePitch(2) } }, // missions
      { cue: 'section', options: { pitch: scalePitch(3) } }, // capabilities
      { cue: 'section', options: { pitch: scalePitch(2) } },
    ]);
  });

  it('plays the note of the section jumped to with a number', async () => {
    const opened = await open();
    await press(opened, '5');
    expect(opened.sound.plays).toEqual([{ cue: 'section', options: { pitch: scalePitch(5) } }]);
  });

  it('wraps around with a note too', async () => {
    const opened = await open();
    await press(opened, KEYS.left);
    expect(opened.sound.plays).toEqual([{ cue: 'section', options: { pitch: scalePitch(5) } }]);
  });

  it('makes no sound for a jump to the section already open', async () => {
    const opened = await open();
    await press(opened, '1');
    expect(opened.sound.plays).toEqual([]);
  });

  it('gives every section a different, rising note', () => {
    const pitches = [1, 2, 3, 4, 5].map(scalePitch);
    expect(new Set(pitches).size).toBe(5);
    expect([...pitches].sort((a, b) => a - b)).toEqual(pitches);
  });
});

describe('scroll sounds', () => {
  it('ticks for a line, glides for a page and for the ends', async () => {
    const opened = await open();
    await openScrollable(opened);

    await press(opened, KEYS.down);
    expect(opened.sound.cues).toEqual(['tick']);
    await press(opened, KEYS.pageDown);
    expect(opened.sound.cues).toEqual(['tick', 'glide']);
    await press(opened, 'g');
    expect(opened.sound.cues).toEqual(['tick', 'glide', 'glide']);
  });

  it('thumps at the top and at the bottom, and not in between', async () => {
    const opened = await open();
    await openScrollable(opened);

    await press(opened, KEYS.up);
    expect(opened.sound.cues).toEqual(['edge']);

    await press(opened, 'G');
    await press(opened, KEYS.down);
    expect(opened.sound.cues).toEqual(['edge', 'glide', 'edge']);
  });

  it('says nothing when a section has nothing to scroll', async () => {
    const opened = await open();
    await press(opened, '5');
    await wait(300);
    opened.sound.plays.length = 0;

    await press(opened, KEYS.down);
    await press(opened, KEYS.up);
    await press(opened, 'G');
    expect(opened.sound.plays).toEqual([]);
  });
});

describe('the mute key', () => {
  it('toggles sound with m, and does not move', async () => {
    const opened = await open();
    expect(opened.sound.enabled()).toBe(true);

    await press(opened, 'm');
    expect(opened.sound.enabled()).toBe(false);
    await press(opened, 'm');
    expect(opened.sound.enabled()).toBe(true);
    expect(opened.sound.plays).toEqual([]);
    expect(opened.app.lastFrame()).toContain('SUMMARY');
  });
});
