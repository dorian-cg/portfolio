import { Box, Text } from 'ink';
import { profile } from '../../../content/profile';
import { Typed } from '../../fx/typewriter';
import { Heading } from '../parts';
import { hud } from '../palette';

export function Training() {
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Heading>EDUCATION</Heading>
        {profile.education.map((degree, index) => (
          <Box key={degree.school} flexDirection="column" marginTop={1}>
            <Typed bold color={hud.bright} cps={200} delay={300 + index * 500}>
              {degree.school}
            </Typed>
            <Text>{degree.title}</Text>
            <Text color={hud.dim}>
              {degree.place} · {degree.period}
            </Text>
          </Box>
        ))}
      </Box>
      <Box flexDirection="column">
        <Heading delay={900}>LANGUAGES</Heading>
        {profile.spoken.map((spoken) => (
          <Text key={spoken.language}>
            <Text color={hud.ok}>●</Text> {spoken.language} <Text color={hud.dim}>— {spoken.level}</Text>
          </Text>
        ))}
      </Box>
    </Box>
  );
}
