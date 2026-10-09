import { describe, expect, it } from 'vitest';
import { FakeAudioContext, RecordingSound, fakeAudio } from './fake-audio';

describe('fakeAudio', () => {
  it('keeps the contexts it constructs', () => {
    const { Context, contexts } = fakeAudio();
    const context = new Context();
    expect(contexts).toEqual([context]);
  });

  it('starts suspended and runs once resumed', async () => {
    const context = new FakeAudioContext();
    expect(context.state).toBe('suspended');
    await context.resume();
    expect(context.state).toBe('running');
    expect(context.resumeCalls).toBe(1);
  });

  it('rejects a resume when told the browser refuses', async () => {
    const context = new FakeAudioContext();
    context.refuseResume = true;
    await expect(context.resume()).rejects.toThrow('blocked');
    expect(context.state).toBe('suspended');
  });
});

describe('RecordingSound', () => {
  it('records plays with their options, in order', () => {
    const sound = new RecordingSound();
    sound.play('tick');
    sound.play('section', { pitch: 2 });
    expect(sound.cues).toEqual(['tick', 'section']);
    expect(sound.plays[1]!.options).toEqual({ pitch: 2 });
  });

  it('toggles and tells subscribers', () => {
    const sound = new RecordingSound();
    let calls = 0;
    const stop = sound.subscribe(() => calls++);
    sound.toggle();
    expect(sound.enabled()).toBe(false);
    stop();
    sound.toggle();
    expect(sound.enabled()).toBe(true);
    expect(calls).toBe(1);
  });
});
