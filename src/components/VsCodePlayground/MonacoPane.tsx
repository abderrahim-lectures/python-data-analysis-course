import React, {useEffect, useRef} from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  resetKey: string;
}

/**
 * Monaco Editor wrapped for Docusaurus.
 *
 * `monaco-editor` is imported dynamically inside `useEffect` (never at module
 * top-level): Docusaurus prerenders static HTML via ReactDOMServer at build
 * time, and Monaco touches `window`/`document` the moment it's imported, so a
 * top-level import would crash the build. The dynamic import also keeps the
 * ~4 MB editor out of the initial bundle — it only loads once a lesson page
 * with the playground actually mounts it.
 *
 * Python needs no language *worker* (its syntax highlighting is a Monarch
 * grammar that runs on the main thread), so only the base `editor.worker` is
 * wired up — and if that worker ever fails to spawn, the editor still works,
 * just without worker-backed services.
 */
export default function MonacoPane({value, onChange, ariaLabel, resetKey}: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<{editor: import('monaco-editor').editor.IStandaloneCodeEditor; dispose: () => void} | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const holder = containerRef.current;
    let disposed = false;
    let cleanup: (() => void) | null = null;

    void (async () => {
      try {
        // Must be set before editor.create; see doc comment above.
        // @ts-ignore -- MonacoEnvironment is a global Monaco expects us to set.
        window.MonacoEnvironment = {
          getWorker() {
            return new Worker(
              new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
              {type: 'module'},
            );
          },
        };
        const monaco = await import('monaco-editor');
        if (disposed) return;
        const editor = monaco.editor.create(holder, {
          value,
          language: 'python',
          theme: 'vs-dark',
          automaticLayout: true,
          fontSize: 13,
          fontFamily: 'var(--ifm-font-family-monospace)',
          minimap: {enabled: false},
          scrollBeyondLastLine: false,
          renderLineHighlight: 'all',
          padding: {top: 12},
          tabSize: 4,
          wordWrap: 'on',
          lineNumbersMinChars: 3,
        });
        const sub = editor.onDidChangeModelContent(() => onChange(editor.getValue()));
        cleanup = () => {
          sub.dispose();
          editor.dispose();
        };
        editorRef.current = {editor, dispose: cleanup};
      } catch {
        // Monaco failed to load (e.g. bundler couldn't emit its worker) — the
        // playground panel still renders, just without a code surface. The
        // terminal stays usable; nothing crashes.
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per panel lifetime
  }, []);

  // Reset the editor contents when the student navigates to a different week
  // (resetKey changes), while ignoring the initial mount (value already set).
  useEffect(() => {
    const editor = editorRef.current?.editor;
    if (editor && editor.getValue() !== value) {
      editor.setValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to page changes
  }, [resetKey]);

  return <div ref={containerRef} data-testid="vsc-editor" className="vsc-monaco-host" aria-label={ariaLabel} />;
}
