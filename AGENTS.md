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
- `src/ink-bridge/`: `TerminalStdin` / `TerminalStdout` adapters; `TerminalPointer` (taps, wheel, drag and swipe from the browser's pointer events); `FakeTerminal` and `FakePointer` for tests
- `src/shims/`: browser replacements for Node built-ins used by Ink
- `src/content/profile.ts`: everything the portfolio says, from the resume. Edit text and links here
- `src/app/`: Ink React components. `App.tsx` (providers, intro then HUD), `Intro.tsx` + `intro-script.ts`, `layout.ts` (`layoutFor`: wide, medium, narrow), `navigation.ts` (pure reducer) + `use-navigation.ts` (keys and gestures)
  - `hud/`: the screen (`Hud.tsx` arranges the panels per layout; `sections/` has one view per section; `ScrollView.tsx`)
  - `fx/`: animation primitives (`typewriter`, `decrypt`, `braille` canvas, `emblem`, `globe` with `world-map.ts`, `uptime`, `motion` context)
  - `input/`: `PointerProvider`, `useTap` / `Tap` (hit-test against Ink's layout)
- `src/boot/`: boot-screen overlay (`steps.ts` script, `boot-screen.ts` player, `display.ts` canvas drawing, `boot-theme.ts`, `preferences.ts`, `boot-sound.ts` maps boot events to cues); its markup and CSS live in `index.html`
- `src/sound/`: Web Audio sound, no audio files. `recipes.ts` (oscillator recipes from Bencho, MIT, notice in the file), `synth.ts` (schedules a recipe), `cues.ts` (every cue by name, with gain, throttle and jitter: **tune the soundscape here**), `engine.ts` (`createSoundEngine`: unlock on a gesture, on/off kept in `localStorage`; `silentEngine` is the default). `fake-audio.ts` has `fakeAudio()` and `RecordingSound` for tests. The React side is `src/app/sound.tsx` (`SoundProvider`, `useSound`, `useSoundEnabled`)
- `src/assets/fonts/`: generated web fonts; `scripts/build-fonts.mjs` rebuilds them from `fonts/` (git-ignored TTFs)

## Conventions

- Every module gets a co-located `*.test.ts(x)` file. New behaviour needs tests.
- DOM tests opt in with `// @vitest-environment jsdom`; the default is node.
- Mock `ghostty-web` in tests (it needs WASM and canvas). Use `FakeTerminal` to
  drive the bridges and Ink without a real terminal.
- Components must lay out from `useWindowSize()` so they follow terminal resizes. `layoutFor(columns, rows)` picks wide (>= 100 columns), medium (>= 60) or narrow (phones); every change has to work in all three.
- Every animation honours `prefers-reduced-motion` through `src/app/fx/motion.tsx`: reduced motion shows the final state at once. Render with `<App reducedMotion />` (or a `MotionProvider reduced`) in tests that check content.
- Fixed-size pieces of the screen (header, footer, tabs) need `flexShrink={0}` and scrolling regions `flexBasis={0}`; Ink's flex shrink otherwise squashes the fixed pieces when content is tall.
- Sound: play through `useSound()` (or `engine.play` outside React) with a cue name from `cues.ts`; do not build oscillators elsewhere. Browsers allow audio only after a key press or tap, so the boot waits at a `power` step for one (`gate`), and `engine.unlock()` runs inside that gesture. Cues that repeat quickly need a `gap`. Tests use `RecordingSound` (via `<App sound={…}>` or `SoundProvider`) or `fakeAudio()`; never real audio.
- Glyphs must be in the font subset (`scripts/build-fonts.mjs`): box drawing, blocks, braille, geometric shapes, arrows. No emoji.
- Tests that wait for animation or measured layout poll with `until` (`src/app/test-utils.ts`) instead of sleeping. A page that has just opened reports its size a render or two later, so a key pressed in that first moment can find nothing to scroll; tests repeat the key until it takes effect.
- Ink is Node-first. If the build fails with a missing export, or the browser
  reports a Node built-in, add an alias in `vite.config.ts` and a shim in
  `src/shims/` (with a test). Aliases are skipped under Vitest on purpose.
- Boot text is drawn on a canvas with the terminal's font and cell metrics (`measureCell` in `src/terminal/font.ts` mirrors ghostty-web's measurement). Keep them in sync, and load fonts (`loadFonts`) before creating the terminal or measuring.
- JSX is compiled by Vite itself; do not add `@vitejs/plugin-react` (it pre-bundles `react-dom`, which this app does not use).
- The boot overlay must work before JS loads: keep its markup/CSS in `index.html`, and keep tasks tied to real stages via `Milestone`s reported from `bootstrap`.
- The Vite `base` is `./` so the site works under a GitHub Pages sub-path.
