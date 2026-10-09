// There are no process signals in a browser, so nothing is ever registered.
const signalExit = (): (() => void) => () => {};

export default signalExit;
