import { describe, expect, it, vi } from 'vitest';
import empty, { builtinModules, fileURLToPath, readFileSync, relative, release } from './empty';
import process, { cwd, env } from './process';
import signalExit from './signal-exit';
import { PassThrough, Stream } from './stream';
import terminalSize from './terminal-size';
import { types } from './util';

describe('process shim', () => {
  it('has the fields libraries read', () => {
    expect(process.env).toEqual({});
    expect(process.platform).toBe('browser');
    expect(process.argv).toEqual([]);
    expect(process.cwd()).toBe('/');
    expect(cwd()).toBe('/');
    expect(process.env).toBe(env);
  });

  it('accepts event registration without doing anything', () => {
    expect(() => {
      process.on();
      process.once();
      process.off();
      process.exit();
    }).not.toThrow();
    expect(process.emit()).toBe(false);
  });

  it('runs nextTick callbacks asynchronously with their arguments', async () => {
    const callback = vi.fn();
    process.nextTick(callback, 1, 2);
    expect(callback).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith(1, 2);
  });
});

describe('install', () => {
  it('leaves an existing global process untouched', async () => {
    const original = globalThis.process;
    await import('./install');
    expect(globalThis.process).toBe(original);
  });

  it('defines the global process when it is missing', async () => {
    const original = globalThis.process;
    vi.resetModules();
    // @ts-expect-error simulating a browser, which has no global process
    delete globalThis.process;
    try {
      await import('./install');
      expect(globalThis.process.platform).toBe('browser');
    } finally {
      Object.defineProperty(globalThis, 'process', {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  });
});

describe('stream shim', () => {
  it('provides a class usable with instanceof', () => {
    expect(new Stream()).toBeInstanceOf(Stream);
  });

  it('provides an inert PassThrough', () => {
    const stream = new PassThrough();
    expect(stream).toBeInstanceOf(Stream);
    expect(stream.write()).toBe(true);
  });
});

describe('util shim', () => {
  it('detects native errors', () => {
    expect(types.isNativeError(new TypeError('x'))).toBe(true);
    expect(types.isNativeError({ message: 'x' })).toBe(false);
  });
});

describe('signal-exit shim', () => {
  it('returns an unsubscribe function that can be called safely', () => {
    const unsubscribe = signalExit();
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });
});

describe('terminal-size shim', () => {
  it('returns the 80x24 default', () => {
    expect(terminalSize()).toEqual({ columns: 80, rows: 24 });
  });
});

describe('empty shim', () => {
  it('provides harmless replacements for fs, path and url', () => {
    expect(readFileSync()).toBe('');
    expect(relative('/a', '/a/b')).toBe('/a/b');
    expect(fileURLToPath('file:///x')).toBe('file:///x');
    expect(release()).toBe('');
    expect(builtinModules).toEqual([]);
    expect(empty.readFileSync).toBe(readFileSync);
  });
});
