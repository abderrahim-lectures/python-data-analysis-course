// The worker's side of `input()`: a small replay queue over the values the
// learner typed into the cell's form before pressing Run.
//
// Pyodide's stdin callback is synchronous — the interpreter blocks inside the
// wasm call until JS returns a string (or `undefined` for EOF). So the values
// have to be ready before the run starts; this keeps that "pop, echo, then
// report end-of-file" contract in one place both the worker and its tests can
// exercise without a running interpreter.

export interface StdinQueueHooks {
  /** Called once per value actually handed to input(), so the client can echo
   *  it into the output panel (the terminal shows what you typed). */
  onValue(value: string): void;
  /** Called at most once, the first time input() runs past the last value. */
  onEnd(): void;
}

export interface StdinQueue {
  /** Pyodide's stdin callback shape: a line, or `undefined` for EOF. */
  read(): string | undefined;
}

export function stdinQueue(values: readonly string[], hooks: StdinQueueHooks): StdinQueue {
  const pending = [...values];
  let ended = false;
  return {
    read() {
      const value = pending.shift();
      if (value === undefined) {
        // EOF is a one-time announcement: a cell that catches EOFError and
        // asks again must not keep growing the learner's form.
        if (!ended) {
          ended = true;
          hooks.onEnd();
        }
        return undefined;
      }
      hooks.onValue(value);
      return value;
    },
  };
}
