import { EventEmitter } from 'node:events';

// Ink only uses `Stream` for an `instanceof` check on the stdout it is given.
export class Stream extends EventEmitter {}

// patch-console imports this at load time; it is only used when console
// patching is enabled, which the browser build never does.
export class PassThrough extends Stream {
  write(): boolean {
    return true;
  }
}

export default { Stream, PassThrough };
