# AGENTS.md

Guidance for coding agents working in this repository.

## What this is

A static, server-less web app: a full-screen ghostty-web terminal running an
Ink (React) TUI, deployed to GitHub Pages. Do not add a backend.

## Commands

- `npm run dev`: dev server
- `npm test`: run all unit tests (`vitest run`)
- `npm run typecheck`: `tsc --noEmit`
- `npm run build`: typecheck and production build to `dist/`

Run `npm run typecheck && npm test && npm run build` before finishing a change.
Use npm only.

## Layout

- `src/main.ts`: entry; imports `./shims/install` first, sets chalk colour level
- `src/bootstrap.tsx`: creates the terminal, the bridges and renders the Ink app
- `src/terminal/`: ghostty-web setup (`create-terminal.ts`, `theme.ts`)
- `src/ink-bridge/`: `TerminalStdin` / `TerminalStdout` adapters; `FakeTerminal` for tests
- `src/shims/`: browser replacements for Node built-ins used by Ink
- `src/app/`: Ink React components (`*.tsx`)
- `src/boot/`: boot-screen overlay (`steps.ts` script, `boot-screen.ts` player, `display.ts` canvas drawing, `boot-theme.ts`, `preferences.ts`); its markup and CSS live in `index.html`
- `src/assets/fonts/`: generated web fonts; `scripts/build-fonts.mjs` rebuilds them from `fonts/` (git-ignored TTFs)

## Conventions

- Every module gets a co-located `*.test.ts(x)` file. New behaviour needs tests.
- DOM tests opt in with `// @vitest-environment jsdom`; the default is node.
- Mock `ghostty-web` in tests (it needs WASM and canvas). Use `FakeTerminal` to
  drive the bridges and Ink without a real terminal.
- Components must lay out from `useWindowSize()` so they follow terminal resizes.
- Ink is Node-first. If the build fails with a missing export, or the browser
  reports a Node built-in, add an alias in `vite.config.ts` and a shim in
  `src/shims/` (with a test). Aliases are skipped under Vitest on purpose.
- Boot text is drawn on a canvas with the terminal's font and cell metrics (`measureCell` in `src/terminal/font.ts` mirrors ghostty-web's measurement). Keep them in sync, and load fonts (`loadFonts`) before creating the terminal or measuring.
- JSX is compiled by Vite itself; do not add `@vitejs/plugin-react` (it pre-bundles `react-dom`, which this app does not use).
- The boot overlay must work before JS loads: keep its markup/CSS in `index.html`, and keep tasks tied to real stages via `Milestone`s reported from `bootstrap`.
- The Vite `base` is `./` so the site works under a GitHub Pages sub-path.
