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

export function usesJsBridge(src: string): boolean {
  return BRIDGE.test(src);
}
