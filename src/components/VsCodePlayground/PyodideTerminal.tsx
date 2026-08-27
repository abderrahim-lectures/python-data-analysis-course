import React, {useCallback, useEffect, useRef, useState} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {loadPyodideRuntime} from './pyodide';

interface TerminalLine {
  id: number;
  kind: 'cmd' | 'out' | 'err' | 'info';
  text: string;
}

interface Props {
  /** Current editor contents, read at Run time via a ref to avoid re-running on each keystroke. */
  getCode: () => string;
  /** Incremented by the panel's Run button; each bump triggers an execution. */
  runRequest: number;
}

let lineId = 0;

/**
 * The playground's integrated terminal: renders Pyodide's stdout/stderr under a
 * `$ python main.py` prompt, styled like a real VS Code terminal panel.
 */
export default function PyodideTerminal({getCode, runRequest}: Props): React.JSX.Element {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef(getCode);
  codeRef.current = getCode;

  const append = useCallback((kind: TerminalLine['kind'], text: string) => {
    setLines((prev) => [...prev, {id: ++lineId, kind, text}]);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, collapsed]);

  // The panel's Run button bumps `runRequest`; expand the terminal and run.
  useEffect(() => {
    if (runRequest === 0) return;
    setCollapsed(false);
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run is stable enough; only react to bumps
  }, [runRequest]);

  const run = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    append('cmd', '$ python main.py');
    try {
      const py = await loadPyodideRuntime();
      py.setStdout({batched: (s) => append('out', s)});
      py.setStderr({batched: (s) => append('err', s)});
      try {
        await py.loadPackagesFromImports(codeRef.current());
      } catch {
        // Unknown/absent package names are simply not installed; the run below
        // will raise the real ImportError, which is more useful than dying here.
      }
      await py.runPythonAsync(codeRef.current());
    } catch (err) {
      append('err', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [append, busy]);

  const clear = useCallback(() => setLines([]), []);

  return (
    <div className="vsc-terminal" data-testid="vsc-terminal" aria-label={translate({id: 'playground.vscode.terminalLabel', message: 'Integrated terminal'})}>
      <div className="vsc-terminal__header">
        <button type="button" className="vsc-terminal__tab" aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)}>
          <span className="vsc-terminal__chevron" aria-hidden="true">{collapsed ? '▸' : '▾'}</span>
          TERMINAL
        </button>
        <span className="vsc-terminal__meta">python (pyodide · wasm)</span>
        <button type="button" className="vsc-terminal__action" onClick={clear} aria-label={translate({id: 'playground.vscode.clearTerminal', message: 'Clear terminal'})}>
          ⌫
        </button>
      </div>
      {!collapsed && (
        <div className="vsc-terminal__body" ref={scrollRef}>
          {lines.length === 0 && !busy && (
            <div className="vsc-terminal__placeholder">
              <Translate id="playground.vscode.terminalEmpty">
                Press Run to execute main.py in the browser — no server needed.
              </Translate>
            </div>
          )}
          {lines.map((l) => (
            <div key={l.id} className={`vsc-terminal__line vsc-terminal__line--${l.kind}`}>
              {l.kind === 'cmd' ? <span className="vsc-terminal__prompt" aria-hidden="true">❯ </span> : null}
              {l.text}
            </div>
          ))}
          {busy && (
            <div className="vsc-terminal__line vsc-terminal__line--info">
              <span className="vsc-terminal__spinner" aria-hidden="true" />
              <Translate id="playground.vscode.booting">
                Booting Python (WASM)… first run downloads ~10 MB
              </Translate>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
