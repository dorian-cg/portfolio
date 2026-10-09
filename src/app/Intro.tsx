import { Box, Text, useAnimation, useInput } from 'ink';
import { useEffect } from 'react';
import { hud } from './hud/palette';
import { usePointerGesture } from './input/pointer';
import { INTRO_DURATION, INTRO_WIDTH, introLines, type IntroLine } from './intro-script';
import type { Layout } from './layout';

const valueColor = (kind: IntroLine['kind']) => (kind === 'loaded' ? hud.ok : kind === 'scan' ? hud.line : hud.text);

export interface IntroProps {
  layout: Layout;
  /** Called once, when the intro has played out or the visitor skipped it. */
  onDone: () => void;
}

/** The start-up sequence shown before the HUD. Any key skips it. */
export function Intro({ layout, onDone }: IntroProps) {
  const { time } = useAnimation({ interval: 40 });
  const finished = time >= INTRO_DURATION;

  useInput(() => onDone());
  usePointerGesture((gesture) => gesture.type === 'tap' && onDone());
  useEffect(() => {
    if (finished) {
      onDone();
    }
  }, [finished, onDone]);

  const lines = introLines(time);
  const last = lines.length - 1;
  return (
    <Box width={layout.columns} height={layout.rows} alignItems="center" justifyContent="center">
      <Box width={Math.min(INTRO_WIDTH, layout.columns - 2)} flexDirection="column">
        {lines.map((line, index) => (
          <Text key={line.kind} wrap="truncate">
            <Text color={hud.accent}>{line.prompt} </Text>
            <Text color={hud.bright}>{line.label}</Text>
            <Text bold color={valueColor(line.kind)}>
              {line.value}
            </Text>
            {index === last && !finished && <Text color={hud.accent}>█</Text>}
          </Text>
        ))}
        <Box marginTop={1}>
          <Text color={hud.dim}>press any key or tap to skip</Text>
        </Box>
      </Box>
    </Box>
  );
}
