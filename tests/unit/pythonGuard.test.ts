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
