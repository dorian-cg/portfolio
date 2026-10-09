import { Box, Text } from 'ink';
import { profile } from '../../../content/profile';
import { Typed } from '../../fx/typewriter';
import { Heading } from '../parts';
import { hud } from '../palette';

export function Capabilities() {
  return (
    <Box flexDirection="column" gap={1}>
      {profile.skills.map((group, groupIndex) => (
        <Box key={group.name} flexDirection="column">
          <Heading delay={groupIndex * 150}>{group.name.toUpperCase()}</Heading>
          <Box flexWrap="wrap" columnGap={2}>
            {group.items.map((item, index) => (
              <Text key={item}>
                <Text color={hud.ok}>●</Text>{' '}
                <Typed cps={200} delay={groupIndex * 150 + index * 45}>
                  {item}
                </Typed>
              </Text>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
