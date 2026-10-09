import { Box, Text } from 'ink';
import { profile } from '../../../content/profile';
import { Bullets } from '../parts';
import { hud } from '../palette';

export function Missions() {
  return (
    <Box flexDirection="column" gap={1}>
      {profile.experience.map((job, index) => (
        <Box key={`${job.company}-${job.period}`} flexDirection="column">
          <Text>
            <Text bold color={hud.accent}>
              {job.company}
            </Text>
            <Text color={hud.dim}> · {job.period}</Text>
          </Text>
          <Text color={hud.bright}>{job.role}</Text>
          <Text color={hud.dim}>{job.place}</Text>
          <Bullets items={job.bullets} delay={index * 450} />
        </Box>
      ))}
    </Box>
  );
}
