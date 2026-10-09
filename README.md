# portfolio

A static web app that looks and behaves like a terminal. Visitors land on a
full-screen [Ghostty](https://ghostty.org) terminal (via
[ghostty-web](https://github.com/coder/ghostty-web)) that immediately runs an
[Ink](https://github.com/vadimdemedes/ink) (React) text UI. There is no server:
everything runs in the browser and is published to GitHub Pages.

## Stack

- TypeScript, Vite, React (JSX)
- ghostty-web: terminal emulator (Ghostty's VT parser compiled to WASM)
- Ink: React renderer for terminal UIs
- Vitest: unit tests

## Getting started

Requires Node.js >= 22.12.

```bash
npm install
npm run dev        # dev server
npm test           # run unit tests once
npm run test:watch # tests in watch mode
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

## How it works

Ink is written for Node: it writes to a `stdout` stream, reads keystrokes from
a `stdin` stream and listens for `resize` events. In the browser those streams
are bridges over the ghostty-web terminal:

```
keyboard ──► ghostty-web Terminal ──onData──► TerminalStdin ──► Ink
window   ──► FitAddon ──onResize──► TerminalStdout 'resize' ──► Ink re-layout
Ink output ──► TerminalStdout.write ──► Terminal.write ──► screen
```

- `src/terminal/` creates the terminal, waits for the font, and fits it to the
  window before anything renders, so Ink's first frame has the right size.
- `src/ink-bridge/` adapts the terminal to Ink's `stdin`/`stdout`. Resizes
  update `columns`/`rows` and then emit `resize`, so Ink re-lays-out.
- `src/shims/` replaces the Node built-ins that Ink imports (see the aliases in
  `vite.config.ts`). They apply only to the browser build; tests run against
  real Node modules.
- `src/app/` holds the Ink components. `src/bootstrap.tsx` wires everything
  together and `src/main.ts` is the entry point.

## Boot screen

While the app loads, a vintage CRT/BIOS boot sequence plays on top of it
(`src/boot/`). The overlay shell and power-on animation are plain HTML and CSS in
`index.html`, so they show instantly, before the JS bundle arrives. Its `[ OK ]`
lines for the terminal engine and Ink wait for the real loading stages reported
by `bootstrap`.

- The text is drawn on a canvas with the terminal's font, cell grid and colours
  (the same `fillText`-per-cell approach as ghostty-web), so it looks identical
  to the terminal that replaces it.
- It always plays for the same length of time (about 3 s), unless real loading
  is slower. Press any key or click to fast-forward it; it still waits for
  real loading.
- `prefers-reduced-motion` skips it entirely.
- If startup fails, the error is shown on the boot screen as `[FAIL]`.
- Edit the lines and timings in `src/boot/steps.ts`.

## Fonts

The terminal uses MesloLGS Nerd Font. `src/assets/fonts/*.woff2` are subsets of
the TTFs (Latin, symbols, box drawing, Powerline), about 60-90 KB each instead of
3 MB. To regenerate them (for example to add the Nerd Font icon ranges), put the
`MesloLGS Nerd Font` TTFs in `fonts/` (git-ignored) and run `npm run build:fonts`.

## Deployment

Pushes to `main` run typecheck, tests and build, then deploy `dist/` to GitHub
Pages (`.github/workflows/deploy.yml`). In the repository settings, set
**Pages → Source** to **GitHub Actions**. The build uses a relative base path,
so it works under `/portfolio/` and on a custom domain.
