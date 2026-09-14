// Main-thread side of the Pyodide Web Worker. Owns one lazily-created,
// page-lifetime worker shared by every cell, and translates its messages
// into the same shape the rest of the app already expects: appendLine/
// appendFigure/onPhase callbacks (mirroring pythonRunnerCore's CellRuntime)
// and the pyodide:loading/progress/ready window events Base.astro's busy
// overlay listens to -- so nothing downstream of a Run click needs to know
// or care whether the code actually ran on the main thread or in the worker.
import {m} from '../paraglide/messages.js';

export interface WorkerRunCallbacks {
  appendLine(kind: 'out' | 'err', text: string): void;
  appendFigure(pngB64: string): void;
  onPhase(phase: 'packages' | 'running'): void;
  onLoading(detail?: {phase?: string}): void;
  onProgress(pct: number): void;
  onReady(): void;
}

type OutMessage =
  | {type: 'loading'; id: number}
  | {type: 'progress'; id: number; pct: number}
  | {type: 'phase'; id: number; phase: 'packages' | 'running'}
  | {type: 'stdout' | 'stderr'; id: number; text: string}
  | {type: 'figure'; id: number; png: string}
  | {type: 'done'; id: number; executed: boolean}
  | {type: 'fatal'; id: number; message: string};

let worker: Worker | null = null;
let nextId = 1;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./pyodide.worker.ts', import.meta.url), {type: 'module'});
  }
  return worker;
}

// Runs one cell's code in the worker and resolves once it's done (never
// rejects -- an engine load failure is reported through appendLine same as
// a Python-level error, and still resolves `false`, mirroring runCellCode's
// own contract of "false only means the cell was refused before running").
// The worker is shared by every cell on the page and processes runs strictly
// one at a time (see pyodide.worker.ts's queue), so a second call queued
// behind an in-flight one is expected, not a bug -- each call filters
// incoming messages by its own request id so it only ever reacts to its own
// cell's output, never another cell's.
export function runInWorker(
  code: string,
  opts: {allSource: string; otherCellSources: string; locale: string},
  cb: WorkerRunCallbacks,
): Promise<boolean> {
  const w = getWorker();
  const id = nextId++;
  return new Promise((resolve) => {
    const finish = (executed: boolean) => {
      cb.onReady();
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      resolve(executed);
    };
    const onMessage = (ev: MessageEvent<OutMessage>) => {
      const msg = ev.data;
      if (msg.id !== id) return;
      switch (msg.type) {
        case 'loading':
          cb.onLoading();
          break;
        case 'progress':
          cb.onProgress(msg.pct);
          break;
        case 'phase':
          cb.onPhase(msg.phase);
          cb.onLoading({phase: msg.phase});
          break;
        case 'stdout':
          cb.appendLine('out', msg.text);
          break;
        case 'stderr':
          cb.appendLine('err', msg.text);
          break;
        case 'figure':
          cb.appendFigure(msg.png);
          break;
        case 'done':
          finish(msg.executed);
          break;
        case 'fatal':
          console.warn('[pyodideWorkerClient] engine failed to load in worker', msg.message);
          cb.appendLine('err', m.cell_engine_load_failed());
          finish(false);
          break;
      }
    };
    const onError = (ev: ErrorEvent) => {
      console.warn('[pyodideWorkerClient] worker error', ev.message);
      cb.appendLine('err', m.cell_engine_load_failed());
      finish(false);
    };
    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.postMessage({
      type: 'run',
      id,
      code,
      allSource: opts.allSource,
      otherCellSources: opts.otherCellSources,
      locale: opts.locale,
    });
  });
}
