// Refuses the handful of Python constructs that reach past the lesson sandbox
// and into the host page. Pyodide's `js` and `pyodide` modules bridge into the
// browser — they can read this origin's localStorage, rewrite the DOM and
// issue same-origin fetches — and a shared /playground/<code> link is
// attacker-written code that runs on the viewer's origin, so it is screened
// here before the engine ever sees it.
//
// What this is: a *guardrail*. A text scan cannot be a security boundary —
// `__import__("\u006a\u0073")`, `__import__("builtins").exec(...)`,
// `sys.modules["js"]` and `vars()["__builtins__"]` all walked straight through
// the earlier version of this file, and `marshal` + `types` can still build a
// callable from bytes without naming exec at all. The deny list below closes
// those routes; audit-report-2026-11-runtime.md §B3 explains why the real
// boundary has to be structural (do not execute foreign code in this origin)
// and what that change would look like.
//
// The trade is deliberate and one-directional: over-blocking costs a learner
// one reworded snippet, under-blocking hands someone else's link their saved
// progress. Nothing in src/content/** uses any name refused here, so no lesson
// cell is affected — the cost is only paid by a playground snippet that reaches
// for one of them.

// Matches the submodule forms too (`from pyodide.ffi import to_js`).
const MOD = String.raw`(?:js|pyodide)(?:\.\w+)*`;
const BRIDGE = new RegExp(
  String.raw`(?:^|[^\w.])(?:` +
    String.raw`import\s+${MOD}\b` + '|' +
    String.raw`from\s+${MOD}\s+import\b` + '|' +
    String.raw`__import__\s*\(\s*['"]${MOD}['"]\s*\)` + '|' +
    String.raw`importlib\s*\.\s*import_module\s*\(\s*['"]${MOD}['"]\s*\)` +
  ')',
  'm',
);

// Dynamic execution can smuggle bridge imports past BRIDGE
// (`exec("from js import window")`). Blocking the call form is not enough:
// `E = exec` then `E("...")` reaches the same builtin without ever writing
// `exec(`, and that payload ran in a real browser before this rule existed. So
// the bare *names* are refused too — while `re.compile(...)` and `model.eval()`
// stay allowed, because those are attributes, not the builtins.
const EXEC_NAMES = /(?<![\w.])(?:exec|eval|compile)\b/;

// stdlib modules that compile and run source they are handed:
// `code.InteractiveInterpreter().runsource(...)`, `timeit.timeit(...)`,
// `cProfile.run(...)`, `trace.Trace().run(...)`, `runpy.run_module(...)`,
// `pdb.Pdb().runsource(...)`. Each of them reached `js` in a real browser with
// `"import " + "js"` split across two literals, i.e. without naming exec.
const EXEC_MODULES = 'code|timeit|pdb|profile|cProfile|trace|runpy';

// `_pyodide` is the runtime's own internals (`_importhook`, `jsbind`, …): no
// snippet needs it, and it is the layer that owns the bridge.
const INTERNAL_MODULES = '_pyodide';

// The names that turn "run my snippet" into "reach the host". Every route to
// the real `exec`/`__import__` has to name one of them first:
//   __import__("builtins").exec(...)         the builtins module by import
//   sys.modules["js"]                        the module cache, no import needed
//   vars() / globals() / locals()            the caller's namespace, incl. __builtins__
//   importlib.import_module("\u006a\u0073")  an import that escapes BRIDGE's literal
//   marshal + types.FunctionType(...)        a callable built from bytecode
// `getattr`, `setattr` and `delattr` are deliberately NOT here: they are only
// dangerous once one of the names above has produced the object they poke at,
// and `getattr` is ordinary Python a learner may legitimately experiment with.
//
// Each name is matched in the form that actually escapes, not bare: a lesson
// comment saying "column names and types" must not be refused, and
// `sns.pairplot(df, vars=[...])` is a real lesson cell. So modules are caught
// by `import x` (anywhere in the import list — `import os, sys` counts), by
// `x.` / `x(`, and the namespace builtins by their call form (a bare
// `vars = ...` cannot reach the caller's namespace).
const ESCAPE_NAMES = new RegExp(
  [
    String.raw`\b__import__\b`,
    String.raw`\b(?:builtins|importlib|marshal|sys|types)\s*[.(]`,
    String.raw`\bimport\b[^\n]*(?:\b(?:builtins|importlib|marshal|sys|types)\b)`,
    String.raw`\bimport\b[^\n]*(?:\b(?:${EXEC_MODULES})\b)`,
    String.raw`\bimport\b[^\n]*(?:\b${INTERNAL_MODULES}\b)`,
    String.raw`\b(?:vars|globals|locals)\b(?!\s*=)`,
  ].join('|'),
);

// Introspection hooks that walk from an ordinary object to the class graph, and
// from a class to everything else (`print.__self__` is the builtins module;
// `().__class__.__bases__[0].__subclasses__()` is the classic chain). Every one
// of those has to name the hook it walks through, so blocking the names closes
// the class of bypass instead of one instance of it. `__name__`/`__main__` are
// deliberately absent: `if __name__ == "__main__":` is a beginner idiom and
// several lessons use it.
const DUNDER_INTROSPECTION =
  /__builtins__|__loader__|__subclasses__|__globals__|__bases__|__base__|__mro__|__self__|__class__|__dict__|__getattribute__|__getattr__|__setattr__|__delattr__|__call__|__code__|__closure__|__reduce__|__reduce_ex__|__module__|__spec__|__wrapped__|__func__|__defaults__|__kwdefaults__|__objclass__|__weakref__|__qualname__|__slots__/;

export function usesJsBridge(src: string): boolean {
  // Python removes a backslash-newline before tokenizing, so `import \` +
  // newline + `js`, `exe` + newline + `c(...)` and `__imp` + newline + `ort__`
  // are ordinary code that a line-by-line scan would miss. Join them first —
  // this is what the interpreter will actually see.
  const code = src.replace(/\\\r?\n/g, '');
  return (
    BRIDGE.test(code) ||
    EXEC_NAMES.test(code) ||
    ESCAPE_NAMES.test(code) ||
    DUNDER_INTROSPECTION.test(code)
  );
}
