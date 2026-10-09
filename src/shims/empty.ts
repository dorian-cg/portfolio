// Stand-in for Node modules that are imported at load time but only used in
// paths the browser never takes: Ink's error overlay (fs, path, url), opt-in
// devtools, ansi-escapes on old Windows (os) and stack-utils (module).
export const readFileSync = (): string => '';
export const relative = (_from: string, to: string): string => to;
export const fileURLToPath = (url: string | URL): string => String(url);
export const release = (): string => '';
export const builtinModules: string[] = [];

export default { readFileSync, relative, fileURLToPath, release, builtinModules };
