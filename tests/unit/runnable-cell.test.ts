import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {stubDom} from './_domstub.ts';
import {awardLessonXp, initRunnableCells, runCellCode} from '../../src/lib/runnable-cell.client';
import type {CellRuntime} from '../../src/lib/runnable-cell.client';

type Recorded = Array<{kind: string; text: string}>;

function makeEngine() {
  const calls = {
    stdout: undefined as undefined | {batched: (s: string) => void},
    stderr: undefined as undefined | {batched: (s: string) => void},
    stdin: undefined as undefined | {stdin: () => string},
    loaded: [] as string[],
    wrapped: [] as string[],
    ran: [] as string[],
  };
  const engine = {
    setStdout: (cb: {batched: (s: string) => void}) => {
      calls.stdout = cb;
    },
    setStderr: (cb: {batched: (s: string) => void}) => {
      calls.stderr = cb;
    },
    setStdin: (cb: {stdin: () => string}) => {
      calls.stdin = cb;
    },
    loadPackagesFromImports: async (src: string) => {
      calls.loaded.push(src);
    },
    runPython: async (src: string) => {
      calls.wrapped.push(src);
      return (code: string) => `W(${code})`;
    },
    runPythonAsync: async (src: string) => {
      calls.ran.push(src);
    },
  };
  return {engine, calls};
}

function makeRuntime(engine: ReturnType<typeof makeEngine>['engine'], out: Recorded): CellRuntime {
  return {
    appendLine: (kind, text) => out.push({kind, text}),
    engine,
  };
}

describe('runCellCode', () => {
  let out: Recorded;
  let mock: ReturnType<typeof makeEngine>;

  function win() {
    vi.stubGlobal('window', {prompt: () => '', location: {href: 'http://localhost/learn/titanic'}});
  }

  beforeEach(() => {
    out = [];
    mock = makeEngine();
    win();
  });

  test('routes stdout, stderr and reads stdin via prompt', async () => {
    vi.stubGlobal('window', {prompt: () => 'typed', location: {href: 'http://localhost/learn/titanic'}});
    await runCellCode('x = 1', makeRuntime(mock.engine, out));
    mock.calls.stdout?.batched('hello\n');
    mock.calls.stderr?.batched('oops\n');
    expect(out).toEqual([
      {kind: 'out', text: 'hello\n'},
      {kind: 'err', text: 'oops\n'},
    ]);
    expect(mock.calls.stdin?.stdin()).toBe('typed');
  });

  test('loads imports, wraps the trailing expression, then runs it', async () => {
    await runCellCode('print(1)', makeRuntime(mock.engine, out));
    expect(mock.calls.loaded).toEqual(['print(1)']);
    expect(mock.calls.wrapped).toEqual([expect.stringContaining('_wrap_bare_expr')]);
    expect(mock.calls.ran).toEqual(['W(print(1))']);
    expect(out).toEqual([]);
  });

  test('refuses the js/pyodide bridge modules without executing', async () => {
    await runCellCode('import js', makeRuntime(mock.engine, out));
    expect(mock.calls.loaded).toEqual([]);
    expect(mock.calls.ran).toEqual([]);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('err');
    expect(out[0].text).toContain('Blocked');
  });

  test('maps runtime failures to friendly errors on the err line', async () => {
    vi.stubGlobal('window', {prompt: () => ''});
    mock.engine.runPythonAsync = async () => {
      throw new Error("NameError: name 'x' is not defined");
    };
    await runCellCode('x', makeRuntime(mock.engine, out));
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('err');
    expect(out[0].text).toContain('recognize');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});

describe('awardLessonXp', () => {
  function storage(initial?: Record<string, string>): Storage {
    const map = new Map(Object.entries(initial ?? {}));
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(),
      key: () => '',
      length: map.size,
    } as Storage;
  }

  test('awards the run + completion bonus and reports the gain', async () => {
    vi.stubGlobal('localStorage', storage());
    const first = await awardLessonXp('titanic-exploration');
    expect(first.xpBefore).toBe(0);
    expect(first.gained).toBe(65);
  });

  test('reports the balance before the award', async () => {
    const seed = {
      'pda:state': JSON.stringify({version: 1, xp: 70, lessonsRun: {}, lessonsCompleted: {}}),
    };
    vi.stubGlobal('localStorage', storage(seed));
    const next = await awardLessonXp('titanic-eda');
    expect(next.xpBefore).toBe(70);
    expect(next.gained).toBe(90);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});

describe('initRunnableCells bootstrapping', () => {
  test('walks the DOM for runnable cells and hydrates none on an empty page', () => {
    const stub = stubDom();
    initRunnableCells(stub.restore() as any);
    expect(stub.queryAll['[data-runnable]'] ?? []).toEqual([]);
  });

  test('registers a DOMContentLoaded autoboot when the page is loading', async () => {
    vi.resetModules();
    const stub = stubDom();
    (stub.restore() as any).readyState = 'loading';
    await import('../../src/lib/runnable-cell.client.ts');
    expect(stub.listeners['DOMContentLoaded']).toBeDefined();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});