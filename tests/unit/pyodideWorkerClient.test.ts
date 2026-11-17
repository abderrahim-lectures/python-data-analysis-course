import {beforeEach, describe, expect, test, vi} from 'vitest';
import {stubDom} from './_domstub.ts';

// A Worker whose script fails to load is terminated by the browser, and
// postMessage to a terminated worker is a silent no-op. The client used to keep
// the dead worker, so the "check your connection and try again" it printed
// could never be acted on: the next Run posted into the void, no message or
// error came back, and the button stayed disabled on "Executing…" until a hard
// reload. These pin the replacement.

class FakeWorker {
  static instances: FakeWorker[] = [];
  listeners: Record<string, Array<(ev: unknown) => void>> = {};
  posted: unknown[] = [];
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }
  addEventListener(type: string, fn: (ev: unknown) => void) {
    (this.listeners[type] ??= []).push(fn);
  }
  removeEventListener(type: string, fn: (ev: unknown) => void) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((f) => f !== fn);
  }
  postMessage(msg: unknown) {
    this.posted.push(msg);
  }
  terminate() {
    this.terminated = true;
  }
  emit(type: string, ev: unknown) {
    for (const fn of [...(this.listeners[type] ?? [])]) fn(ev);
  }
}

const RUN_OPTS = {allSource: 'print(1)', otherCellSources: '', locale: 'en', stdin: []};

function callbacks() {
  return {
    appendLine: vi.fn(),
    appendFigure: vi.fn(),
    onPhase: vi.fn(),
    onLoading: vi.fn(),
    onProgress: vi.fn(),
    onReady: vi.fn(),
  };
}

async function loadClient() {
  vi.resetModules();
  FakeWorker.instances = [];
  return import('../../src/lib/pyodideWorkerClient.ts');
}

beforeEach(() => {
  stubDom();
  vi.unstubAllGlobals();
  vi.stubGlobal('Worker', FakeWorker);
});

describe('pyodideWorkerClient', () => {
  test('a worker that errors is terminated and replaced, so the next run works', async () => {
    const {runInWorker} = await loadClient();

    const first = runInWorker('print(1)', RUN_OPTS, callbacks());
    const dead = FakeWorker.instances.at(-1)!;
    dead.emit('error', {message: 'Failed to load worker script'});

    await expect(first).resolves.toBe(false);
    expect(dead.terminated).toBe(true);

    // The retry must not post into the dead worker.
    const second = runInWorker('print(1)', RUN_OPTS, callbacks());
    expect(FakeWorker.instances).toHaveLength(2);
    const fresh = FakeWorker.instances.at(-1)!;
    expect(fresh).not.toBe(dead);
    expect(dead.posted).toHaveLength(1);

    const runId = (fresh.posted[0] as {id: number}).id;
    fresh.emit('message', {data: {type: 'done', id: runId, executed: true}});
    await expect(second).resolves.toBe(true);
  });

  test('a healthy worker is reused rather than rebuilt per run', async () => {
    const {runInWorker} = await loadClient();

    const first = runInWorker('print(1)', RUN_OPTS, callbacks());
    const w = FakeWorker.instances.at(-1)!;
    w.emit('message', {data: {type: 'done', id: (w.posted[0] as {id: number}).id, executed: true}});
    await expect(first).resolves.toBe(true);

    const second = runInWorker('print(2)', RUN_OPTS, callbacks());
    w.emit('message', {data: {type: 'done', id: (w.posted[1] as {id: number}).id, executed: true}});
    await expect(second).resolves.toBe(true);
    expect(FakeWorker.instances).toHaveLength(1);
  });

  test('a fatal engine message still resolves and clears the busy overlay', async () => {
    const {runInWorker} = await loadClient();
    const cb = callbacks();

    const run = runInWorker('print(1)', RUN_OPTS, cb);
    const w = FakeWorker.instances.at(-1)!;
    w.emit('message', {data: {type: 'fatal', id: (w.posted[0] as {id: number}).id, message: 'boom'}});

    await expect(run).resolves.toBe(false);
    expect(cb.onReady).toHaveBeenCalled();
  });

  // A cell that never returns (while True: pass) cannot be interrupted: the
  // worker drains its queue serially, Pyodide's interrupt buffer needs
  // SharedArrayBuffer and the site has no cross-origin isolation, so
  // terminate() is the only exit. These pin both halves -- the promise must
  // settle (or the cell stays on "Executing…" forever) and the next run must
  // build a live worker rather than posting into the corpse.
  test('stopRun settles the in-flight run and terminates the worker', async () => {
    const {runInWorker, stopRun, isWorkerRunning} = await loadClient();

    const run = runInWorker('while True: pass', RUN_OPTS, callbacks());
    const w = FakeWorker.instances.at(-1)!;
    expect(isWorkerRunning()).toBe(true);

    expect(stopRun()).toBe(true);

    // Settled, and settled as "did not execute" so no XP is awarded for a run
    // the learner cancelled.
    await expect(run).resolves.toBe(false);
    expect(w.terminated).toBe(true);
    expect(isWorkerRunning()).toBe(false);
    // The cell reports the stop in its own words; the client must not also
    // print an engine-load error, which would be a lie.
    expect(w.posted).toHaveLength(1);
  });

  test('stopRun is a no-op when nothing is running, so the UI stays silent', async () => {
    // One module instance for both halves: the old version called loadClient()
    // twice, and its second call reset the module registry, so the assertion
    // "the worker was not terminated" was looking at a different worker than
    // the one the run had used. It could never have failed.
    const {runInWorker, stopRun} = await loadClient();
    expect(stopRun()).toBe(false);

    const run = runInWorker('print(1)', RUN_OPTS, callbacks());
    const w = FakeWorker.instances.at(-1)!;
    w.emit('message', {data: {type: 'done', id: (w.posted[0] as {id: number}).id, executed: true}});
    await expect(run).resolves.toBe(true);

    // Worker alive, nothing pending -- a stale Stop click must not kill a
    // healthy session (and throw away every package it had installed).
    expect(stopRun()).toBe(false);
    expect(w.terminated).toBe(false);
  });

  test('the run after a stop boots a fresh worker and works', async () => {
    const {runInWorker, stopRun} = await loadClient();

    const stuck = runInWorker('while True: pass', RUN_OPTS, callbacks());
    const dead = FakeWorker.instances.at(-1)!;
    stopRun();
    await expect(stuck).resolves.toBe(false);

    const second = runInWorker('print(2)', RUN_OPTS, callbacks());
    expect(FakeWorker.instances).toHaveLength(2);
    const fresh = FakeWorker.instances.at(-1)!;
    expect(fresh).not.toBe(dead);
    expect(dead.posted).toHaveLength(1);

    fresh.emit('message', {data: {type: 'done', id: (fresh.posted[0] as {id: number}).id, executed: true}});
    await expect(second).resolves.toBe(true);
  });

  test('a stop settles every run queued behind the stuck one', async () => {
    const {runInWorker, stopRun} = await loadClient();

    const first = runInWorker('while True: pass', RUN_OPTS, callbacks());
    const second = runInWorker('print(2)', RUN_OPTS, callbacks());
    const w = FakeWorker.instances.at(-1)!;
    stopRun();

    // Neither can ever receive a 'done' from a terminated worker; both must
    // still settle or their cells hang on "Executing…" after the overlay goes.
    await expect(first).resolves.toBe(false);
    await expect(second).resolves.toBe(false);
    expect(w.posted).toHaveLength(2);
  });
});
