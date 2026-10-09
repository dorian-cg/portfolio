import process from './process';

// Some dependencies of Ink reference the global `process` directly.
// This module must be imported before anything that loads them.
if (typeof globalThis.process === 'undefined') {
  Object.defineProperty(globalThis, 'process', {
    value: process,
    configurable: true,
    writable: true,
  });
}
