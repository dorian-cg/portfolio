import { Box } from 'ink';
import { profile } from '../../../content/profile';
import { Typed } from '../../fx/typewriter';
import { Bullets, Heading } from '../parts';

export function Profile() {
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Heading>SUMMARY</Heading>
        <Typed cps={450} delay={250}>
          {profile.summary}
        </Typed>
      </Box>
      <Box flexDirection="column">
        <Heading delay={900}>TECHNICAL LEADERSHIP</Heading>
        <Bullets items={profile.leadership} delay={1200} />
      </Box>
    </Box>
  );
}
