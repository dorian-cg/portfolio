import { Box, Text, useWindowSize } from 'ink';

export function App() {
  const { columns, rows } = useWindowSize();

  return (
    <Box
      width={columns}
      height={rows}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Text bold color="green">
        Hello from Ink 👋
      </Text>
      <Text dimColor>
        {columns} × {rows}
      </Text>
    </Box>
  );
}
