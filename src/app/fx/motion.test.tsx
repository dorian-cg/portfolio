import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { Entrance, MotionProvider, useAmbientMotion, useEntrance } from './motion';

function Probe() {
  return (
    <Text>
      ambient:{String(useAmbientMotion())} entrance:{String(useEntrance())}
    </Text>
  );
}

describe('motion', () => {
  it('plays everything by default', () => {
    expect(render(<Probe />).lastFrame()).toBe('ambient:true entrance:true');
  });

  it('turns everything off for reduced motion', () => {
    const { lastFrame } = render(
      <MotionProvider reduced>
        <Probe />
      </MotionProvider>,
    );
    expect(lastFrame()).toBe('ambient:false entrance:false');
  });

  it('turns only entrance effects off when a section has been seen', () => {
    const { lastFrame } = render(
      <MotionProvider reduced={false}>
        <Entrance play={false}>
          <Probe />
        </Entrance>
      </MotionProvider>,
    );
    expect(lastFrame()).toBe('ambient:true entrance:false');
  });

  it('keeps reduced motion on inside an entrance that plays', () => {
    const { lastFrame } = render(
      <MotionProvider reduced>
        <Entrance play>
          <Probe />
        </Entrance>
      </MotionProvider>,
    );
    expect(lastFrame()).toBe('ambient:false entrance:false');
  });
});
