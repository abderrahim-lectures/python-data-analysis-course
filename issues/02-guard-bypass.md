## 2. `pythonGuard` is bypassable: nine ways to reach `js`/`pyodide` without writing `import js`

**Labels:** `type:bug`, `area:playground`
**Severity:** high (security), reduced but not closed

### Why it matters

`/playground/<base64>` renders attacker-written code into a runnable cell, and it runs on the
**viewer's** origin after one Run click. Pyodide's `js` module gives that code the page's
`localStorage` (XP, streak, completed lessons), the DOM, and same-origin `fetch` — i.e. the
viewer's saved progress and their anonymous Supabase session. `pythonGuard.usesJsBridge` exists
to refuse that, and the earlier version was a text scan that missed:

| Payload | Why it passed |
|---|---|
| `__import__("\u006a\u0073")` | CPython decodes the escapes; the scan only saw `"\u006a\u0073"` |
| `__import__("builtins").exec(...)` | `DYNAMIC_EXEC` deliberately excludes a receiver after `.` |
| `E = __import__("builtins").exec; E(...)` | no bare `exec(` appears at all |
| `...exec(b64decode("..."))` | payload never appears as text |
| `sys.modules["js"]` | `js` is already imported by Pyodide; no import statement needed |
| `[v for k, v in vars().items() ...][0].exec(...)` | `vars()` was not blocked |
| `print.__self__.exec(...)` | `__self__` was not in the dunder list |
| `().__class__.__bases__[0].__subclasses__()` | classic subclass chain, partially blocked |
| `import marshal, types; types.FunctionType(marshal.loads(...))` | builds a callable without naming `exec` |

Plus two lexical variants that defeated every rule at once: a backslash line continuation
(`import \`⏎`js`, `exe`⏎`c(...)`) and a dangerous module that is not first in an import list
(`import os, sys`).

A second round of fuzzing (24 payloads, each run against the real engine when it passed) found two
more families:

| Payload | Why it passed |
|---|---|
| `E = exec` then `E("import " + "js" + …)` | the builtin is bound to a name, so no `exec(` ever appears |
| `code.InteractiveInterpreter().runsource(…)`, `timeit.timeit(…)`, `profile`/`cProfile.run(…)`, `trace.Trace().run(…)`, `runpy.run_module(…)`, `pdb.Pdb().runsource(…)` | stdlib modules that compile and run strings; each executed `import js` with the literals split |

### Fix (PR #321)

Both rounds: `usesJsBridge` joins continuations before scanning (what the interpreter sees), refuses the
escape names in the form that escapes (`import x` anywhere in the statement, `x.`, `x(`, and
`vars`/`globals`/`locals` by call), and extends the dunder list to the introspection hooks that
walk an object to the class graph. All nine payloads are regression tests, and all **1576**
lesson code fences still pass the guard (0 refused), so no lesson cell changes behaviour. The bare
names `exec`/`eval`/`compile` are refused (attributes such as `re.compile`/`model.eval()` still
pass), and imports of those seven stdlib modules plus `_pyodide` are refused.

### Still open

A text scan is a guardrail, not a boundary. The structural fix is to stop executing foreign code
in the site's origin — render `/playground/<code>` in a `<iframe sandbox="allow-scripts">`
(opaque origin). That needs `frame-src` added to the CSP (currently `'none'`) and a prototype to
answer one question: a same-origin `new Worker(...)` is blocked from an opaque origin, so the
frame must run Pyodide on its own main thread or boot the worker from a `blob:` URL. Written up
in `audit-report-2026-11-runtime.md` §B3.
