import { theme } from '../../terminal/theme';

/** HUD colour roles, taken from the terminal theme so both always agree. */
export const hud = {
  line: theme.cyan,
  bright: theme.brightCyan,
  text: theme.foreground,
  dim: theme.brightBlack,
  accent: theme.yellow,
  ok: theme.green,
} as const;
