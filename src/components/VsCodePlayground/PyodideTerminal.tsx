import React, {useCallback, useEffect} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {usePyodideRunner} from '@site/src/hooks/usePyodideRunner';
import {useTerminalOutput} from '@site/src/hooks/useTerminalOutput';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';

interface Props {
  getCode: () => string;
  runRequest: number;
  /** Called whenever a run finishes with an error (for error-history tracking). */
  onError?: (message: string) => void;
}

/**
 * Integrated terminal that executes Python code via Pyodide (WASM).
 * Displays stdout/stderr with beginner-friendly error messages.
 */
export default function PyodideTerminal({getCode, runRequest, onError}: Props): React.JSX.Element {
  const {lines, collapsed, toggleCollapsed, expand, append, clear, scrollRef} = useTerminalOutput();

  const handleOutput = useCallback(
    (line: {id: number; kind: 'cmd' | 'out' | 'err' | 'info' | 'hint' | 'success'; text: string}) => {
      append(line);
    },
    [append],
  );

  const {busy, loadingProgress, lastError, run, clearError} = usePyodideRunner({
    getCode,
    onOutput: handleOutput,
  });

  // Report errors to the parent (StillStuck) once per distinct error message
  const lastReportedRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (lastError && lastError !== lastReportedRef.current) {
      lastReportedRef.current = lastError;
      onError?.(lastError);
    }
  }, [lastError, onError]);

  // Trigger run when runRequest changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (runRequest === 0) return;
    expand();
    void run();
  }, [runRequest]);

  const copyError = useCallback(async () => {
    if (lastError) {
      await navigator.clipboard.writeText(lastError);
    }
  }, [lastError]);

  const reportIssue = useCallback(() => {
    if (lastError) {
      const title = encodeURIComponent(`Error: ${lastError.slice(0, 50)}`);
      const body = encodeURIComponent(
        `## Error Report\n\n**Error:**\n\`\`\`\n${lastError}\n\`\`\`\n\n**Code:**\n\`\`\`python\n${getCode()}\n\`\`\`\n\n**Steps to reproduce:**\n1. Open the editor\n2. Paste the code above\n3. Click Run\n\n**Expected behavior:**\n[What should happen?]\n\n**Actual behavior:**\n[What actually happened?]`,
      );
      window.open(
        `https://github.com/abderrahim-lectures/python-data-analysis-course/issues/new?title=${title}&body=${body}`,
        '_blank',
      );
    }
  }, [lastError, getCode]);

  return (
    <div
      className="vsc-terminal"
      data-testid="vsc-terminal"
      data-tutorial-target="terminal"
      aria-label={translate({id: 'playground.vscode.terminalLabel', message: 'Integrated terminal'})}>
      <div className="vsc-terminal__header">
        <button
          type="button"
          className="vsc-terminal__tab"
          aria-expanded={!collapsed}
          onClick={toggleCollapsed}>
          <span className="vsc-terminal__chevron" aria-hidden="true">
            {collapsed ? '▸' : '▾'}
          </span>
          TERMINAL
        </button>
        <span className="vsc-terminal__meta">python (pyodide · wasm)</span>
        {lastError && (
          <>
            <button
              type="button"
              className="vsc-terminal__action"
              onClick={copyError}
              aria-label={translate({id: 'playground.vscode.copyError', message: 'Copy error'})}>
              📋
            </button>
            <button
              type="button"
              className="vsc-terminal__action"
              onClick={reportIssue}
              aria-label={translate({id: 'playground.vscode.reportIssue', message: 'Report issue'})}>
              🐛
            </button>
          </>
        )}
        <button
          type="button"
          className="vsc-terminal__action"
          onClick={() => {
            clear();
            clearError();
          }}
          aria-label={translate({id: 'playground.vscode.clearTerminal', message: 'Clear terminal'})}>
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
              {l.kind === 'cmd' ? (
                <span className="vsc-terminal__prompt" aria-hidden="true">
                  ❯{' '}
                </span>
              ) : null}
              {l.text}
            </div>
          ))}
          {busy && (
            <div className="vsc-terminal__line vsc-terminal__line--info">
              <span className="vsc-terminal__spinner" aria-hidden="true" />
              {loadingProgress < 100 ? (
                <Translate id="playground.vscode.booting" values={{progress: loadingProgress}}>
                  {'Booting Python (WASM)… {progress}%'}
                </Translate>
              ) : (
                <Translate id="playground.vscode.running">Running code…</Translate>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
