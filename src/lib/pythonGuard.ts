// Pyodide's `js` and `pyodide` modules bridge into the host page — they can
// read this origin's localStorage, rewrite the DOM, and issue same-origin
// fetches. No lesson or playground snippet needs them, and ?code= links are
// attacker-controllable, so they are refused before execution.
// Matches the submodule forms too (`from pyodide.ffi import to_js`).
// Deliberately conservative: a mention inside a string or comment is also
// refused. Over-blocking costs a learner nothing here; under-blocking hands
// a shared link read access to their saved progress.
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

// Dynamic execution can smuggle bridge imports past the static regex above
// (e.g. `exec("from js import window")`). Block the execution builtins
// themselves — no lesson or playground snippet needs them.
// Anchored on [^\w.] (not just \b) so `re.compile(...)`, `obj.eval(...)`
// etc. are not mistaken for the bare builtins.
const DYNAMIC_EXEC = /(?:^|[^\w.])(?:exec|eval|compile)\s*\(/;
const BUILTIN_IMPORT = /\bbuiltins\s*\.\s*__import__\b/;

// getattr(__builtins__, "ex"+"ec")(...), vars(__builtins__)["exec"](...),
// globals()["__builtins__"], and subclass-hunting chains
// (().__class__.__bases__[0].__subclasses__()) all reach exec/eval/import
// without ever writing a literal "exec(" that DYNAMIC_EXEC would catch.
// Every one of those techniques has to name the introspection hook it
// walks through, so blocking those names outright (rather than trying to
// enumerate every way to call them) closes the class of bypass instead of
// one instance of it. `__import__` itself is deliberately excluded here:
// several real projects legitimately call `__import__("pathlib")` etc.,
// and the js/pyodide-targeted form is already precisely caught by BRIDGE
// above, so blanket-blocking the name would break real content to guard
// against a case that's already covered.
const DUNDER_INTROSPECTION = /__builtins__|__loader__|__subclasses__|__globals__|__bases__|__base__|__mro__/;

export function usesJsBridge(src: string): boolean {
  return BRIDGE.test(src) || DYNAMIC_EXEC.test(src) || BUILTIN_IMPORT.test(src) || DUNDER_INTROSPECTION.test(src);
}

// A cell that calls input() must run on the main thread: Pyodide's stdin
// callback is synchronous (the interpreter blocks waiting for a return
// value), and today that's window.prompt(). A Web Worker has no window and
// no synchronous way to ask the main thread for a value -- that needs
// Atomics.wait() on a SharedArrayBuffer, which needs cross-origin-isolation
// (COOP/COEP) response headers GitHub Pages cannot set. So cells using
// input() are routed to the legacy in-page engine instead of the worker
// (see runnable-cell.client.ts); everything else gets the non-blocking path.
// Deliberately conservative like usesJsBridge above: a mention inside a
// string or comment still routes to the main thread, which only costs that
// one cell the worker's benefit, never correctness.
const BLOCKING_INPUT = /\binput\s*\(/;

export function usesBlockingInput(src: string): boolean {
  return BLOCKING_INPUT.test(src);
}
