import {describe, expect, test} from 'vitest';
import {usesJsBridge} from '../../src/lib/pythonGuard.ts';

describe('blocks the host bridge', () => {
  const blocked = [
    'import js',
    'import pyodide',
    'from js import document',
    'from js import localStorage, fetch',
    'from pyodide.ffi import to_js',
    "__import__('js')",
    '__import__("js")',
    "importlib.import_module('js')",
    '  import js',            // indented, inside a function
    'x = 1\nimport js\nprint(x)',
    'if True:\n    from js import window',
  ];

  test.each(blocked)('rejects %j', (src) => {
    expect(usesJsBridge(src)).toBe(true);
  });
});

describe('allows ordinary teaching code', () => {
  const allowed = [
    'print("hello")',
    'x = 5\nx = x + 1  # x now names 6',
    'import json',
    'import math, random',
    'from dataclasses import dataclass',
    'import pandas as pd',
    'from collections import Counter',
    // Identifiers that merely contain the blocked names must not trip it.
    'import jsonschema',
    'from jsonlines import Reader',
    'js = 5\nprint(js)',
    'import numpy as js',
    'data.js_field = 3',
    // Names that are ordinary Python and must keep working.
    'if __name__ == "__main__":\n    main()',
    'import re\npattern = re.compile(r"\\d+")',
    'class Point: pass\np = Point()\nprint(getattr(p, "x", 1))',
  ];

  test.each(allowed)('allows %j', (src) => {
    expect(usesJsBridge(src)).toBe(false);
  });
});

describe('deliberately conservative', () => {
  // The guard is a plain text scan, so a bridge import mentioned inside a
  // string or comment is refused too. That false positive is the intended
  // trade: over-blocking costs a learner a reword, under-blocking hands a
  // shared ?code= link read access to the viewer's saved progress.
  test('refuses a bridge import mentioned inside a docstring', () => {
    expect(usesJsBridge('"""import js is just prose here"""\nprint(1)')).toBe(true);
  });
});

describe('refuses the routes that walk around the bridge import', () => {
  // Each of these reached the host before the escape-name list existed: the
  // bridge was importable without ever writing `import js`.
  const escapes = [
    // an escaped module name defeats a scan for the literal "js"
    String.raw`m = __import__("\u006a\u0073")`,
    // the builtins module, by import
    '__import__("builtins").exec("from " + "js import window")',
    // ... bound to a name first, so no bare exec( appears
    'E = __import__("builtins").exec\nE("import " + "js")',
    // ... or with the payload hidden in base64
    '__import__("builtins").exec(__import__("base64").b64decode("ZnJvbSBqcw==").decode())',
    // the module cache: sys.modules already holds `js` in Pyodide
    'import sys\nm = sys.modules["js"]\nprint(m.window.location.href)',
    // the caller's namespace still holds __builtins__
    'b = [v for k, v in vars().items() if hasattr(v, "exec")][0]\nb.exec("import js")',
    // a builtin function is a door to its own module
    'print.__self__.exec("import js")',
    // the classic subclass chain
    'print(().__class__.__bases__[0].__subclasses__())',
    // bytecode needs neither exec nor __import__ to name itself
    'import marshal, types\ntypes.FunctionType(marshal.loads(b""), {})()',
  ];

  test.each(escapes)('refuses %j', (src) => {
    expect(usesJsBridge(src)).toBe(true);
  });
});

describe('lexical tricks that split a refused token', () => {
  // Python deletes a backslash-newline before tokenizing, so the scan has to
  // join those lines first — otherwise every rule above is one character apart
  // from a bypass.
  const continuations = [
    'import ' + '\\\n' + 'js',
    'exe' + '\\\n' + 'c("print(1)")',
    '__imp' + '\\\n' + 'ort__("js")',
    'im' + '\\\n' + 'port sys',
    'import ' + '\\\r\n' + 'js',
  ];
  test.each(continuations)('refuses %j', (src) => {
    expect(usesJsBridge(src)).toBe(true);
  });

  test('refuses a dangerous module that is not first in the import list', () => {
    expect(usesJsBridge('import os, sys\nx = sys\nx.modules["js"]')).toBe(true);
    expect(usesJsBridge('from os import path, sys')).toBe(true);
    expect(usesJsBridge('import json, types')).toBe(true);
  });

  test('a plain join with backslashes in a string is not a call to exec', () => {
    expect(usesJsBridge('print("a\\\nb")')).toBe(false);
  });
});

describe('the second round: aliasing and the string-executing stdlib', () => {
  // Found by fuzzing the guard and then running the payloads in a real browser
  // (Firefox + Pyodide): `E = exec` + `E("import " + "js")` reached the bridge,
  // and so did `code.InteractiveInterpreter().runsource(...)`, `timeit`,
  // `profile`/`cProfile`, `trace` and `runpy` — none of which names exec.
  const payloads = [
    'E = eval\nE("print(1)")',
    'F = exec\nF("print(1)")',
    'compile("1", "<s>", "eval")',
    'import code\ncode.InteractiveInterpreter().runsource("print(1)")',
    'import timeit\ntimeit.timeit("print(1)", number=1)',
    'import pdb\npdb.Pdb().runsource("print(1)")',
    'import profile\nprofile.run("print(1)")',
    'import cProfile\ncProfile.run("print(1)")',
    'import trace\ntrace.Trace().run("print(1)")',
    'import runpy\nrunpy.run_module("js")',
    'import _pyodide\nprint(dir(_pyodide))',
  ];
  test.each(payloads)('refuses %j', (src) => {
    expect(usesJsBridge(src)).toBe(true);
  });

  // ...while the same words as attributes, or in prose, stay allowed.
  const allowed = [
    'import re\npattern = re.compile(r"\\d+")',
    'model.eval()',
    'stats.exec_time = 1',
    '# the code. Then run it.\nprint(1)',
    '# 3 evaluates to 3\nprint(3)',
  ];
  test.each(allowed)('still allows %j', (src) => {
    expect(usesJsBridge(src)).toBe(false);
  });
});

// Five routes that reached the bridge without naming `js`, `sys` or any of the
// names the earlier rules refused. Each was confirmed in CPython: pickle's
// GLOBAL opcode imports and calls a named attribute from bytes, inspect's
// currentframe() returns the caller's frame and therefore its builtins,
// os re-exports sys as an attribute, and two short adjacent literals rebuild a
// refused dunder without ever containing one.
describe('closures found by the runtime audit', () => {
  const blocked = [
    // pickle GLOBAL/STACK_GLOBAL: imports the module and looks up the
    // attribute from the payload, so neither name appears in the source.
    'import pickle\npickle.loads(b"cjs\\nfetch\\n(X\'https://e.test/c\'\\ntR.")',
    'import _pickle',
    // inspect hands back the caller's frame, and its builtins with it.
    'import inspect\nE = inspect.currentframe().f_builtins["ex" + "ec"]',
    // os.sys is sys, without writing `sys.` or `import sys`.
    'import os\ns = getattr(os, "sys")\nm = s.modules["j" + "s"]',
    // implicit concatenation rebuilds a dunder the literal list cannot see.
    'B = getattr(print, "__se" "lf__")',
    'E = getattr(B, "ex" "ec")',
    // Pyodide registers the bridge under this name too; `\b` cannot end a
    // match after `pyodide` because `_` is a word character.
    'import pyodide_js',
    'from pyodide_js import loadPackagesFromImports',
  ];

  test.each(blocked)('rejects %j', (src) => {
    expect(usesJsBridge(src)).toBe(true);
  });

  const stillAllowed = [
    'import os\nprint(os.path.join("a", "b"))',
    'import os\nkey = os.environ["KEY"]',
    'print("=" * 70)',
    'print("-" * 40)',
    'msg = ("Students who complete a test "\n       "preparation course")\nprint(msg)',
    'print("Hello, " + name)',
    'd = {"a": "x", "b": "y"}',
    'print("a", "b")',
    // `import pickle` is refused outright: the only reason to import it in a
    // lesson would be to call loads(), and the module is not used anywhere in
    // the 1576-fence corpus below.
    'parser.add_argument("--interactive", action="store_true")',
  ];

  test.each(stillAllowed)('still allows %j', (src) => {
    expect(usesJsBridge(src)).toBe(false);
  });

  // The rule that closes the split-literal trick matches on source *shape*, so
  // it is the one most likely to catch lesson text by accident. This is the
  // whole English corpus plus all three translations: 1576 fences.
  test('no lesson fence in any locale is refused', async () => {
    const {readFileSync, readdirSync, statSync} = await import('node:fs');
    const {join} = await import('node:path');
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const n of readdirSync(dir)) {
        const p = join(dir, n);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (p.endsWith('.md')) out.push(p);
      }
      return out;
    };
    const offenders: string[] = [];
    let fences = 0;
    for (const f of walk('src/content/lessons')) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)) {
        fences += 1;
        if (usesJsBridge(m[1])) offenders.push(f);
      }
    }
    expect(fences).toBeGreaterThan(1000);
    expect(offenders).toEqual([]);
  });
});
