import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {fakeEl, stubDom, type FakeEl} from './_domstub.ts';
import {awardLessonXp, initCell, initRunnableCells, resetExtraPackagesCache, runCellCode} from '../../src/lib/runnable-cell.client';
import {type CellRuntime, type InitCellDeps, type PyodideModel} from '../../src/lib/runnable-cell.client';

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
    FS: {writeFile: (_path: string, _data: Uint8Array) => {}},
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
    resetExtraPackagesCache();
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

  test('pre-installs a vendored wheel (seaborn) once before running code that imports it', async () => {
    await runCellCode('import seaborn as sns', makeRuntime(mock.engine, out));
    // First load call pulls the Pyodide-index deps seaborn needs at import time.
    expect(mock.calls.loaded[0]).toContain('import micropip, numpy, pandas, matplotlib, scipy, statsmodels');
    // The run first installs the wheel from our own origin, then executes.
    expect(mock.calls.ran[0]).toContain('await micropip.install');
    expect(mock.calls.ran[1]).toBe('W(import seaborn as sns)');
    // A second seaborn cell skips the install: wheel installed exactly once.
    await runCellCode('import seaborn as sns; sns.histplot([1, 2])', makeRuntime(mock.engine, out));
    expect(mock.calls.ran.filter((s: string) => s.includes('micropip.install'))).toHaveLength(1);
  });

  test('preloads the seaborn stack when the page uses seaborn but this cell does not', async () => {
    // Lesson 06 cell 1 calls df["math score"].corr(df["reading score"], method="spearman"),
    // which imports scipy inside pandas. scipy comes along with the seaborn stack, and another
    // cell on the page imports seaborn — so the deps must be ready before this cell runs.
    const rt: CellRuntime = {
      appendLine: (kind, text) => out.push({kind, text}),
      engine: mock.engine,
      otherCellSources: 'import seaborn as sns\nsns.histplot(df["math score"])',
    };
    await runCellCode('rho = df["math score"].corr(df["reading score"], method="spearman")', rt);
    expect(mock.calls.loaded[0]).toContain('import micropip, numpy, pandas, matplotlib, scipy, statsmodels');
    expect(mock.calls.ran[0]).toContain('await micropip.install');
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
      throw new Error("NameError: name 'y' is not defined");
    };
    await runCellCode('x', makeRuntime(mock.engine, out));
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('err');
    expect(out[0].text).toContain('recognize');
    expect(out[0].text).not.toContain('dataset');
  });

  test('a NameError with a dataset-loading sibling cell hints to load the dataset first', async () => {
    vi.stubGlobal('window', {prompt: () => ''});
    mock.engine.runPythonAsync = async () => {
      throw new Error("NameError: name 'df' is not defined");
    };
    const rt: CellRuntime = {
      appendLine: (kind, text) => out.push({kind, text}),
      engine: mock.engine,
      otherCellSources: 'pd.read_csv("titanic.csv")\ndf.head()',
    };
    await runCellCode('df.head()', rt);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('err');
    expect(out[0].text).toContain('recognize');
    expect(out[0].text).toContain('pd.read_csv');
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

describe('initCell DOM wiring', () => {
  function memoryStorage(initial?: Record<string, string>): Storage {
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

  interface Fixture {
    stub: ReturnType<typeof stubDom>;
    cell: FakeEl;
    pre: FakeEl;
    run: FakeEl;
    clear: FakeEl;
    lines: FakeEl;
    out: FakeEl;
    actions: FakeEl;
    code: FakeEl;
    engine: PyodideModel;
    calls: ReturnType<typeof makeEngine>['calls'];
    loadEngine: () => Promise<PyodideModel>;
  }

  function buildFixture(src = 'print("hi")'): Fixture {
    const stub = stubDom();
    const cell = fakeEl('cell');
    const actions = fakeEl('actions');
    const run = fakeEl('run');
    const lang = fakeEl('lang');
    const pre = fakeEl('pre');
    const code = fakeEl('code');
    const out = fakeEl('out');
    const lines = fakeEl('lines');
    const clear = fakeEl('clear');
    cell.appendChild(actions);
    actions.appendChild(run);
    actions.appendChild(lang);
    cell.appendChild(pre);
    pre.appendChild(code);
    cell.appendChild(out);
    out.appendChild(lines);
    out.appendChild(clear);
    actions.classList.add('cell__actions');
    pre.classList.add('cell__code');
    run.classList.add('cell__run');
    out.classList.add('cell__output');
    lines.classList.add('cell__lines');
    clear.classList.add('cell__clear');
    code.textContent = src;
    run.disabled = false;
    out.hidden = true;
    clear.hidden = true;
    cell.querySelectorFor = {
      '[data-run]': run,
      '[data-output]': out,
      '[data-lines]': lines,
      '[data-clear]': clear,
      '.cell__actions': actions,
      'code': code,
    };
    const {engine, calls} = makeEngine();
    vi.stubGlobal('window', {prompt: () => '', getSelection: () => null, location: {href: 'https://example.com/lessons/python-101'}});
    vi.stubGlobal('navigator', {clipboard: {writeText: vi.fn().mockResolvedValue(undefined)}});
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => { cb(); return 0; });
    const loadEngine = async () => engine;
    return {stub, cell, pre, run, clear, lines, out, actions, code, engine, calls, loadEngine};
  }

  const flush = () => new Promise((r) => setTimeout(r, 10));
  const asElement = (el: FakeEl) => el as unknown as Element;
  const gutterOf = (pre: FakeEl) => pre.children.find((c) => c.classSet.has('cell__gutter'));

  test('localizes chrome, paints a gutter, and makes the code editable', () => {
    const fixture = buildFixture('line1\nline2\nline3');
    const {stub, cell, run, clear, code, pre} = fixture;
    vi.stubGlobal('localStorage', memoryStorage());
    initCell(asElement(cell), {loadEngine: fixture.loadEngine} as InitCellDeps);

    expect(run.textContent.length).toBeGreaterThan(0);
    expect(run.getAttribute('aria-label')).toBeTruthy();
    expect(clear.textContent.length).toBeGreaterThan(0);
    expect(code.getAttribute('contenteditable')).toBe('plaintext-only');
    expect(pre.children.map((c) => c.classSet.has('cell__gutter'))).toContain(true);
    expect(gutterOf(pre)?.textContent).toBe('1\n2\n3\n');
    expect(stub.restore().head.children.length).toBeGreaterThan(0);

    initCell(asElement(cell), {loadEngine: fixture.loadEngine} as InitCellDeps);
    expect(pre.children.length).toBe(2);
  });

  test('clicking Run disables the button, runs the engine, awards XP, fires lesson:complete and toasts first success', async () => {
    const f = buildFixture('print("hi")');
    const {cell, run, lines, out} = f;
    cell.dataset.lesson = 'titanic';
    vi.stubGlobal('localStorage', memoryStorage());
    const completeSpy = vi.fn();
    initCell(asElement(cell), {loadEngine: f.loadEngine});
    cell.addEventListener('lesson:complete', completeSpy);

    await (run.listeners['click']() as unknown as Promise<unknown>);

    expect(f.calls.ran).toHaveLength(1);
    expect(run.disabled).toBe(false);
    expect(out.hidden).toBe(false);
    expect(lines.children[0].textContent).toBe('$ python');
    f.calls.stdout?.batched('hi\n');
    expect(lines.children[lines.children.length - 1].textContent).toBe('hi\n');
    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(completeSpy.mock.calls[0][0].detail).toEqual({lessonId: 'titanic', xp: 65});
    const body = f.stub.restore().body as unknown as FakeEl;
    expect(body.children.some((c) => c.classSet.has('firstsuccess-toast'))).toBe(true);
  });

  test('a cell without data-lesson falls back to the page data-lesson-id', async () => {
    const f = buildFixture('print("hi")');
    const {cell, run} = f;
    const doc = f.stub.restore() as Record<string, any>;
    doc.querySelector = (sel: string) =>
      sel === '[data-lesson-id]' ? {getAttribute: () => 'python-101/normal/01-printing'} : null;
    vi.stubGlobal('localStorage', memoryStorage());
    const completeSpy = vi.fn();
    initCell(asElement(cell), {loadEngine: f.loadEngine});
    cell.addEventListener('lesson:complete', completeSpy);

await (run.listeners['click']() as unknown as Promise<unknown>);
    expect(completeSpy.mock.calls[0][0].detail.lessonId).toBe('python-101/normal/01-printing');
  });

  test('mounts datasets referenced by the code before running', async () => {
    const f = buildFixture('open("titanic.csv")');
    const {cell, run, engine, code} = f;
    f.stub.queryAll['[data-runnable] code'] = [code];
    cell.dataset.lesson = 'titanic';
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ok: true, json: async () => ({titaniccsv: 'Titanic.csv'})})
        .mockResolvedValueOnce({ok: true, arrayBuffer: async () => new ArrayBuffer(8)}),
    );
    vi.stubGlobal('localStorage', memoryStorage());
    const writeFile = vi.spyOn(engine.FS, 'writeFile');
    initCell(asElement(cell), {loadEngine: f.loadEngine});

    await (run.listeners['click']() as unknown as Promise<unknown>);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('datasets/index.json'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('datasets/Titanic.csv'));
    const written = writeFile.mock.calls.map((c) => c[0]);
    expect(written).toContain('/home/pyodide/Titanic.csv');
    expect(written).toContain('/Titanic.csv');
    expect(written).toContain('/home/pyodide/titanic.csv');
    expect(written).toContain('/titanic.csv');

    writeFile.mockClear();
    await (run.listeners['click']() as unknown as Promise<unknown>);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(writeFile).not.toHaveBeenCalled();
  });

  test('refuses the js bridge, shows the friendly line, and awards nothing', async () => {
    const f = buildFixture('import js');
    const {cell, run, lines} = f;
    cell.dataset.lesson = 'titanic';
    vi.stubGlobal('localStorage', memoryStorage());
    const completeSpy = vi.fn();
    initCell(asElement(cell), {loadEngine: f.loadEngine});
    cell.addEventListener('lesson:complete', completeSpy);

    await (run.listeners['click']() as unknown as Promise<unknown>);

    expect(f.calls.ran).toHaveLength(0);
    const last = lines.children[lines.children.length - 1];
    expect(last.classSet.has('o-line--err')).toBe(true);
    expect(last.textContent).toContain('Blocked');
    expect(completeSpy).not.toHaveBeenCalled();
  });

  test('Clear wipes the lines and hides the output', () => {
    const f = buildFixture();
    const {cell, clear, lines, out} = f;
    vi.stubGlobal('localStorage', memoryStorage());
    initCell(asElement(cell), {loadEngine: f.loadEngine});
    lines.appendChild(fakeEl('d'));
    out.hidden = false;
    clear.hidden = false;

    clear.listeners['click']();

    expect(lines.children.length).toBe(0);
    expect(out.hidden).toBe(true);
    expect(clear.hidden).toBe(true);
  });

  test('Copy writes the source code to the clipboard', async () => {
    const f = buildFixture('print("copy this")');
    const {cell, code, actions} = f;
    vi.stubGlobal('localStorage', memoryStorage());
    initCell(asElement(cell), {loadEngine: f.loadEngine});
    code.textContent = 'print("copy this")';

    const copy = actions.children.find((c) => c.classSet.has('cell__copy'));
    expect(copy).toBeDefined();
    copy?.listeners['click']();

    await flush();
    const nav = navigator as unknown as {clipboard: {writeText: ReturnType<typeof vi.fn>}};
    expect(nav.clipboard.writeText).toHaveBeenCalledWith('print("copy this")');
  });

  test('Tab inserts four spaces via execCommand and Ctrl+Enter triggers Run', () => {
    const f = buildFixture();
    const {cell, run, code} = f;
    vi.stubGlobal('localStorage', memoryStorage());
    initCell(asElement(cell), {loadEngine: f.loadEngine});
    const doc = f.stub.restore() as {execCommand: ReturnType<typeof vi.fn>};

    for (const fn of code.allListeners['keydown'] ?? []) fn({key: 'Tab', preventDefault: vi.fn()});
    expect(doc.execCommand).toHaveBeenCalledWith('insertText', false, '    ');

    const clicks = vi.fn();
    run.addEventListener('click', clicks);
    for (const fn of code.allListeners['keydown'] ?? []) fn({key: 'Enter', ctrlKey: true, preventDefault: vi.fn()});
    expect(clicks).toHaveBeenCalledTimes(1);
  });

  test('edits re-highlight the code and renumber the gutter', () => {
    const f = buildFixture('a = 1\nb = 2');
    const {cell, code, pre} = f;
    vi.stubGlobal('localStorage', memoryStorage());
    initCell(asElement(cell), {loadEngine: f.loadEngine});
    expect(code.innerHTML).toContain('tok-num');

    code.textContent = 'x\n0.5\n3';
    code.listeners['input']();

    expect(gutterOf(pre)?.textContent).toBe('1\n2\n3\n');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});