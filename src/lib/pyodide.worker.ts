// Runs Pyodide off the main thread so a slow cell (a cold engine boot, a
// heavy pandas operation, a big matplotlib render) never freezes scrolling,
// clicking, or any other tab. Owns exactly one engine for its lifetime (a
// full page navigation still tears the worker down and pays the boot cost
// again, same as the previous main-thread design -- see pythonRunnerCore.ts
// for why the actual bytes are cache-first regardless). Cells that call
// input() never reach this worker at all (see pythonGuard.usesBlockingInput
// and the routing in runnable-cell.client.ts) since Pyodide's stdin callback
// is synchronous and this worker has no way to satisfy that.
import {overwriteGetLocale, toLocale, baseLocale} from '../paraglide/runtime.js';
import {py, runCellCode, mountDatasets, type PyodideModel} from './pythonRunnerCore.ts';

type RunMessage = {
  type: 'run';
  id: number;
  code: string;
  allSource: string;
  otherCellSources: string;
  locale: string;
};

type InMessage = RunMessage;

// `id` echoes the triggering RunMessage's id on every reply so the client
// (one shared worker serving every cell on the page) can route each message
// to the right cell instead of whichever `runInWorker()` call happens to be
// listening.
type OutMessage =
  | {type: 'loading'; id: number}
  | {type: 'progress'; id: number; pct: number}
  | {type: 'phase'; id: number; phase: 'packages' | 'running'}
  | {type: 'stdout' | 'stderr'; id: number; text: string}
  | {type: 'figure'; id: number; png: string}
  | {type: 'done'; id: number; executed: boolean}
  | {type: 'fatal'; id: number; message: string};

const post = (m: OutMessage) => (self as unknown as {postMessage(m: OutMessage): void}).postMessage(m);

// The worker boots before it knows which lesson page spawned it, so the
// first 'run' message's locale configures paraglide's `m.*()` messages
// (used only for the "blocked bridge" / "load the dataset first" hints) --
// otherwise getLocale() would fall through to baseLocale ('en') inside a
// worker regardless of the page's actual locale, since the url/cookie/
// localStorage strategies all require `window`/`document`, neither of which
// exist here.
let localeConfigured = false;

let enginePromise: Promise<PyodideModel> | null = null;

// setStdout/setStderr are engine-wide, not per-run, and only one Python
// script can execute against a Pyodide engine at a time -- two cells "run
// at once" would misroute each other's output, or worse, interleave against
// a shared Python global namespace. A page can only click one Run button at
// a time in practice, but nothing stops a second click landing while the
// first cell is still executing, so incoming 'run' messages are queued and
// drained strictly one at a time rather than assumed to arrive one at a time.
const queue: RunMessage[] = [];
let draining = false;

async function drainQueue(): Promise<void> {
  if (draining) return;
  draining = true;
  let msg: RunMessage | undefined;
  while ((msg = queue.shift())) {
    await runOne(msg);
  }
  draining = false;
}

async function runOne(msg: RunMessage): Promise<void> {
  if (!localeConfigured) {
    localeConfigured = true;
    const locale = toLocale(msg.locale) ?? baseLocale;
    overwriteGetLocale(() => locale);
  }

  let engine: PyodideModel;
  try {
    if (!enginePromise) {
      post({type: 'loading', id: msg.id});
      enginePromise = py((pct) => post({type: 'progress', id: msg.id, pct}));
    }
    engine = await enginePromise;
  } catch (e) {
    enginePromise = null; // let a retry try loading again instead of replaying the same rejection forever
    post({type: 'fatal', id: msg.id, message: e instanceof Error ? e.message : String(e)});
    return;
  }

  await mountDatasets(engine, msg.allSource);

  const executed = await runCellCode(msg.code, {
    engine,
    otherCellSources: msg.otherCellSources,
    appendLine: (kind, text) => post({type: kind === 'out' ? 'stdout' : 'stderr', id: msg.id, text}),
    appendFigure: (png) => post({type: 'figure', id: msg.id, png}),
    onPhase: (phase) => post({type: 'phase', id: msg.id, phase}),
    stdin: () => '', // never exercised -- see the module doc comment above
  });
  post({type: 'done', id: msg.id, executed});
}

self.onmessage = (ev: MessageEvent<InMessage>) => {
  if (ev.data.type !== 'run') return;
  queue.push(ev.data);
  void drainQueue();
};
