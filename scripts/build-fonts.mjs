// Builds the web fonts in src/assets/fonts from the MesloLGS Nerd Font TTFs in
// fonts/ (download them from https://www.nerdfonts.com/font-downloads and put
// the "MesloLGS Nerd Font" files there; the Mono and Propo variants are not used).
//
//   npm run build:fonts
//
// Each font is subset to the characters a terminal UI needs and written as WOFF2,
// which takes it from ~3 MB to well under 100 KB. The Nerd Font icon sets (Font
// Awesome, Devicons, Octicons, ...) are left out because they are ~600 KB per
// style; only the specific icons the UI uses are kept (see ICONS below).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import subsetFont from 'subset-font';

const SOURCE_DIR = new URL('../fonts/', import.meta.url);
const OUTPUT_DIR = new URL('../src/assets/fonts/', import.meta.url);

const STYLES = ['Regular', 'Bold', 'Italic', 'BoldItalic'];

const RANGES = [
  [0x0020, 0x007e], // Basic Latin
  [0x00a0, 0x017f], // Latin-1 Supplement, Latin Extended-A
  [0x2000, 0x206f], // General punctuation
  [0x20a0, 0x20cf], // Currency
  [0x2190, 0x21ff], // Arrows
  [0x2200, 0x22ff], // Mathematical operators
  [0x2300, 0x23ff], // Miscellaneous technical
  [0x2500, 0x259f], // Box drawing, block elements
  [0x25a0, 0x25ff], // Geometric shapes
  [0x2600, 0x27bf], // Miscellaneous symbols, dingbats
  [0x2800, 0x28ff], // Braille (spinners, charts)
  [0xe0a0, 0xe0d7], // Powerline and Powerline Extra symbols
];

/** Individual Nerd Font icons: add the codepoint and what it is. */
const ICONS = [
  0xe709, // nf-dev-github_badge, the GitHub icon in the header
];

const text = [...RANGES, ...ICONS.map((icon) => [icon, icon])].flatMap(([from, to]) =>
  Array.from({ length: to - from + 1 }, (_, index) => String.fromCodePoint(from + index)),
).join('');

await mkdir(OUTPUT_DIR, { recursive: true });

for (const style of STYLES) {
  const input = await readFile(new URL(`MesloLGSNerdFont-${style}.ttf`, SOURCE_DIR));
  const output = await subsetFont(input, text, { targetFormat: 'woff2' });
  await writeFile(new URL(`MesloLGSNerdFont-${style}.woff2`, OUTPUT_DIR), output);
  console.log(`${style}: ${(input.length / 1024).toFixed(0)} KB -> ${(output.length / 1024).toFixed(0)} KB`);
}
