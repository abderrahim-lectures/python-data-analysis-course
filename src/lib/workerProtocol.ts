// The message contract between the page and its Pyodide worker, in one place.
//
// It used to be declared twice — once in pyodide.worker.ts, once in
// pyodideWorkerClient.ts — so adding a message (the stdin echo, the EOF
// signal) meant editing both, and a mismatch would only show up at runtime as
// a message the other side silently ignored. Types only: nothing here runs.

/** Everything the page sends to run one cell. */
export interface RunMessage {
  type: 'run';
  id: number;
  code: string;
  /** Every runnable cell's source on the page, for dataset mounting. */
  allSource: string;
  /** The other cells' source, so a NameError can be explained. */
  otherCellSources: string;
  locale: string;
  /** Values for the cell's input() calls, in order. */
  stdin: string[];
}

export type WorkerInMessage = RunMessage;

/**
 * Everything the worker reports back. `id` echoes the triggering run so the
 * page (one shared worker serving every cell) routes each message to the cell
 * that asked for it.
 */
export type WorkerOutMessage =
  | {type: 'loading'; id: number}
  | {type: 'progress'; id: number; pct: number}
  | {type: 'phase'; id: number; phase: 'packages' | 'running'}
  | {type: 'stdout' | 'stderr'; id: number; text: string}
  /** A value handed to input(), echoed so the panel reads like a terminal. */
  | {type: 'stdin'; id: number; text: string}
  /** Asked for more input() values than the run was given (once per run). */
  | {type: 'eof'; id: number}
  | {type: 'figure'; id: number; png: string}
  | {type: 'done'; id: number; executed: boolean}
  | {type: 'fatal'; id: number; message: string};
