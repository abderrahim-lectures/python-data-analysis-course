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
