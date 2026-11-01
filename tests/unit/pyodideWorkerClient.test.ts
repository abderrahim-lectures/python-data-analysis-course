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
});
