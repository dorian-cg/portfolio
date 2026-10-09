// Ink consults this only when stdout reports no size, which cannot happen with
// the terminal bridge, so a standard default is enough.
const terminalSize = (): { columns: number; rows: number } => ({
  columns: 80,
  rows: 24,
});

export default terminalSize;
