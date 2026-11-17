import {beforeEach, describe, expect, test, vi} from 'vitest';
import {el, fakeEl, stubDom, type DomStub, type FakeEl} from './_domstub.ts';

// The Stop control is static markup inside the busy overlay in Base.astro
// (#app-stop) rather than a button created per run. The overlay carries
// transition:persist, so it survives soft navigation; a per-run button on
// document.body did not, and a runaway cell followed the learner to the next
// page with the overlay up and no way out. Verified in a browser; these pin
// the wiring so a later refactor cannot quietly go back to a detached button.

class FakeWorker {
  static instances: FakeWorker[] = [];
  listeners: Record<string, Array<(ev: unknown) => void>> = {};
  posted: Array<{id: number}> = [];
  terminated = false;
  constructor() { FakeWorker.instances.push(this); }
  addEventListener(t: string, fn: (ev: unknown) => void) { (this.listeners[t] ??= []).push(fn); }
  removeEventListener(t: string, fn: (ev: unknown) => void) {
    this.listeners[t] = (this.listeners[t] ?? []).filter((f) => f !== fn);
  }
  postMessage(m: unknown) { this.posted.push(m as {id: number}); }
  terminate() { this.terminated = true; }
  emit(t: string, ev: unknown) { for (const fn of [...(this.listeners[t] ?? [])]) fn(ev); }
}

function cellFixture(stub: DomStub, _tag?: string) {
  const cell = fakeEl('div');
  const run = fakeEl('button');
  const out = fakeEl('div');
  const lines = fakeEl('div');
  const clear = fakeEl('button');
  const code = fakeEl('code');
  const actions = fakeEl('div');
  cell.appendChild(actions); actions.appendChild(run);
  cell.appendChild(code);
  cell.appendChild(out); out.appendChild(lines); out.appendChild(clear);
  cell.querySelectorFor = {
    '[data-run]': run, '[data-output]': out, '[data-lines]': lines,
    '[data-clear]': clear, '.cell__actions': actions, code,
  };
  stub.queryAll['[data-runnable] code'] = [code];
  return {cell, run, out, lines, clear, code};
}

async function loadModule() {
  vi.resetModules();
  FakeWorker.instances = [];
  return import('../../src/lib/runnable-cell.client.ts');
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal('Worker', FakeWorker);
  vi.stubGlobal('window', {
    prompt: () => '', getSelection: () => null,
    location: {href: 'https://example.com/learn/python-101/normal/lessons/01-printing/'},
    addEventListener: () => {}, dispatchEvent: () => true,
  });
  vi.stubGlobal('navigator', {clipboard: {writeText: vi.fn().mockResolvedValue(undefined)}});
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => { cb(); return 0; });
});

describe('the Stop control lives in the persistent overlay', () => {
  test('running a cell reveals the static button, and finishing hides it', async () => {
    const stub = stubDom();
    const stop = el('app-stop', stub);
    stop.hidden = true;
    const {initCell} = await loadModule();
    const f = cellFixture(stub);

    initCell(f.cell as unknown as Element);
    (f.run.allListeners['click'] ?? []).forEach((fn) => fn({}));
    // The run is in flight: the button is shown.
    await Promise.resolve();
    expect(stop.hidden).toBe(false);

    // Finish the run and confirm it is hidden again.
    const w = FakeWorker.instances.at(-1)!;
    w.emit('message', {data: {type: 'done', id: w.posted[0].id, executed: true}});
    await new Promise((r) => setTimeout(r, 20));
    expect(stop.hidden).toBe(true);
  });

  test('clicking it terminates the worker and clears the overlay', async () => {
    const stub = stubDom();
    const stop = el('app-stop', stub);
    const dispatched: string[] = [];
    vi.stubGlobal('window', {
      prompt: () => '', getSelection: () => null,
      location: {href: 'https://example.com/x'},
      addEventListener: () => {},
      dispatchEvent: (e: {type: string}) => { dispatched.push(e.type); return true; },
    });
    const {initCell} = await loadModule();
    const f = cellFixture(stub);

    initCell(f.cell as unknown as Element);
    (f.run.allListeners['click'] ?? []).forEach((fn) => fn({}));
    await Promise.resolve();
    const w = FakeWorker.instances.at(-1)!;

    stop.click();
    expect(w.terminated).toBe(true);
    // The overlay and the top loading bar are both cleared by pyodide:ready.
    expect(dispatched).toContain('pyodide:ready');
  });

  test('a second click after the run ended does nothing', async () => {
    const stub = stubDom();
    const stop = el('app-stop', stub);
    const {initCell} = await loadModule();
    const f = cellFixture(stub);

    initCell(f.cell as unknown as Element);
    (f.run.allListeners['click'] ?? []).forEach((fn) => fn({}));
    await Promise.resolve();
    const w = FakeWorker.instances.at(-1)!;
    w.emit('message', {data: {type: 'done', id: w.posted[0].id, executed: true}});
    await new Promise((r) => setTimeout(r, 20));

    // The handler was bound once for this run; a late click must not kill a
    // fresh session.
    stop.click();
    expect(w.terminated).toBe(false);
  });

  test('a stop after the owning cell was detached does not throw', async () => {
    const stub = stubDom();
    const stop = el('app-stop', stub);
    const {initCell} = await loadModule();
    const f = cellFixture(stub);

    initCell(f.cell as unknown as Element);
    (f.run.allListeners['click'] ?? []).forEach((fn) => fn({}));
    await Promise.resolve();

    // Simulate the soft navigation: the panel the run belongs to is gone.
    f.out.isConnected = false;
    expect(() => stop.click()).not.toThrow();
  });
});

// Two cells can have runs in flight at once: the worker is serial, but nothing
// stops a learner clicking Run on cell 2 inside the overlay's 200ms show delay.
// Each cell's `finally` used to hide the shared button unconditionally, so the
// first cell to finish hid the control for the second -- which was still
// running, possibly forever, with the overlay up and the page inert. That is
// R49 again, reached through a second cell rather than a navigation.
describe('the Stop button is shared between overlapping runs', () => {
  test('the first cell finishing does not hide it while a second run runs', async () => {
    const stub = stubDom();
    const stop = el('app-stop', stub);
    stop.hidden = true;
    const {initCell} = await loadModule();
    const cellA = cellFixture(stub, 'div');
    const cellB = cellFixture(stub, 'div');
    stub.queryAll['[data-runnable] code'] = [cellA.code, cellB.code];

    initCell(cellA.cell as unknown as Element);
    initCell(cellB.cell as unknown as Element);
    (cellA.run.allListeners['click'] ?? []).forEach((fn) => fn({}));
    await Promise.resolve();
    (cellB.run.allListeners['click'] ?? []).forEach((fn) => fn({}));
    await Promise.resolve();

    const w = FakeWorker.instances.at(-1)!;
    expect(stop.hidden).toBe(false);

    // Cell A's run finishes while B is still queued behind it.
    w.emit('message', {data: {type: 'done', id: w.posted[0].id, executed: true}});
    await new Promise((r) => setTimeout(r, 20));
    // Still visible: B has not been given a reply yet.
    expect(stop.hidden).toBe(false);

    // Now B finishes too; the button goes away.
    w.emit('message', {data: {type: 'done', id: w.posted[1].id, executed: true}});
    await new Promise((r) => setTimeout(r, 20));
    expect(stop.hidden).toBe(true);
  });
});
