/**
 * Lazy Pyodide (WASM Python) loader for the Monaco playground.
 *
 * The ~10 MB Python runtime is fetched from jsdelivr on first run, exactly the
 * way JupyterLite already does for its own kernel — the site deliberately does
 * not vendor the wasm/whl binaries into the repo or the PWA precache. The
 * loader module itself is also runtime-imported from the same CDN: the npm
 * `pyodide` package pulls Node builtins (node:fs, node:crypto, …) that the
 * Rspack browser build can't bundle, and there's no reason to ship a copy of
 * the loader when the wasm dist already has to come from the CDN anyway.
 *
 * Once loaded, the runtime is cached as a singleton so every later "Run" is
 * instant and variables persist between runs, like a real REPL.
 */
const PYODIDE_VERSION = '0.26.4';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_LOADER_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`;

export interface PyodideRuntime {
  setStdout: (opts: {batched: (line: string) => void}) => void;
  setStderr: (opts: {batched: (line: string) => void}) => void;
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackagesFromImports: (code: string) => Promise<unknown>;
}

interface PyodideModule {
  loadPyodide: (opts: {indexURL: string}) => Promise<PyodideRuntime>;
}

let pyodidePromise: Promise<PyodideRuntime> | null = null;

export function loadPyodideRuntime(): Promise<PyodideRuntime> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      // webpackIgnore tells the bundler to leave this URL alone and emit a
      // plain runtime import instead of trying to bundle the CDN file.
      const pyodideModule = (await import(
        /* webpackIgnore: true */
        PYODIDE_LOADER_URL
      )) as unknown as PyodideModule;
      return pyodideModule.loadPyodide({indexURL: PYODIDE_INDEX_URL});
    })();
  }
  return pyodidePromise;
}
