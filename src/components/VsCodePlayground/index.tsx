import React, {useEffect, useState} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {useCurrentDoc} from '@site/src/context/CurrentDocContext';
import {buildWeekId} from '@site/src/utils/weekId';
import MonacoPane from './MonacoPane';
import PyodideTerminal from './PyodideTerminal';
import JupyterLiteEmbed from './JupyterLiteEmbed';
import {starterCodeForSection} from './starterCode';

const DESKTOP_MIN_WIDTH = '(min-width: 1440px)';

/**
 * Persistent VS Code web-style split: course content on the left, an in-browser
 * editor + terminal on the right. Replaces the old floating "playground" FAB —
 * this is not a modal and never covers the lesson on desktop; the doc layout
 * reserves space for it via `body[data-vsc-open] .docs-wrapper` padding.
 *
 * The Monaco editor (code surface) runs Python through Pyodide (WASM) — nothing
 * is executed on a server. JupyterLite stays available as the "Notebook" tab,
 * which is where pandas/matplotlib notebooks are meant to run.
 */
export default function VsCodePlayground(): React.JSX.Element | null {
  const {doc} = useCurrentDoc();

  // Only lesson pages get the split view; the homepage/gallery stay full-width
  // marketing pages. CurrentDocContext is populated by DocItem/Content, so
  // this flips to a doc page as soon as one is actually read.
  if (!doc.section) return null;

  const [open, setOpen] = useState<boolean>(() => {
    // Static prerender (no window) renders the desktop layout; the client
    // hydration pass corrects to the real viewport width.
    if (typeof window === 'undefined') return true;
    return window.matchMedia(DESKTOP_MIN_WIDTH).matches;
  });

  const [tab, setTab] = useState<'editor' | 'notebook'>('editor');
  const embedKey =
    doc.section && doc.track && doc.week != null
      ? buildWeekId(doc.section, doc.track, doc.week)
      : `${doc.section}:${doc.track ?? 'none'}:${doc.week ?? 'none'}`;
  const weekId =
    doc.section && doc.track && doc.week != null
      ? buildWeekId(doc.section, doc.track, doc.week)
      : null;

  const [resetKey, setResetKey] = useState(embedKey);
  const [code, setCode] = useState(() => starterCodeForSection(doc.section));
  const [runCount, setRunCount] = useState(0);

  // Navigating to a different week/section resets the editor to that page's
  // starter file (the notebook iframe is keyed separately in JupyterLiteEmbed).
  useEffect(() => {
    if (embedKey !== resetKey) {
      setResetKey(embedKey);
      setCode(starterCodeForSection(doc.section));
      setTab('editor');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- embedKey is the change signal
  }, [embedKey]);

  // Layout: the doc content reserves room for the panel via CSS keyed off this
  // body attribute, so toggling the panel reflows the lesson without any JS
  // layout math.
  useEffect(() => {
    document.body.dataset.vscOpen = open ? '1' : '0';
    return () => {
      delete document.body.dataset.vscOpen;
    };
  }, [open]);

  const toggleOpen = () => setOpen((o) => !o);

  const embedMode: 'notebook' | 'repl' = doc.section === 'data-analysis' ? 'notebook' : 'repl';

  return (
    <>
      {/* Floating terminal-style toggle — mobile/tablet only (the panel is
          persistent on desktop, so this stays hidden there). */}
      <button
        type="button"
        className="vsc-mobile-toggle"
        data-testid="vsc-mobile-toggle"
        onClick={() => setOpen(true)}
        aria-hidden={open}
        tabIndex={open ? -1 : 0}>
        <span className="vsc-mobile-toggle__prompt" aria-hidden="true">❯</span>
        <Translate id="playground.vscode.openEditor">Open editor</Translate>
      </button>

      {/* Slim reopen strip — desktop only, shown while the panel is collapsed. */}
      <button
        type="button"
        className="vsc-reopen"
        data-testid="vsc-reopen"
        onClick={() => setOpen(true)}
        aria-label={translate({id: 'playground.vscode.reopen', message: 'Show editor'})}>
        <span aria-hidden="true">❯</span> Code
      </button>

      <aside className="vsc-dock" role="region" aria-label={translate({id: 'playground.panel.label', message: 'Code playground'})}>
        {/* Title bar — macOS traffic lights + app title + collapse */}
        <div className="vsc-titlebar">
          <span className="vsc-titlebar__lights" aria-hidden="true">
            <i className="vsc-light vsc-light--red" />
            <i className="vsc-light vsc-light--yellow" />
            <i className="vsc-light vsc-light--green" />
          </span>
          <span className="vsc-titlebar__title">pyda-course · Playground</span>
          <button
            type="button"
            className="vsc-titlebar__close"
            data-testid="vsc-collapse"
            onClick={toggleOpen}
            aria-label={translate({id: 'playground.vscode.collapse', message: 'Hide editor'})}>
            ▁
          </button>
        </div>

        <div className="vsc-main">
          {/* Activity bar — visual VS Code flourish; not interactive. */}
          <div className="vsc-activitybar" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="vsc-activitybar__icon vsc-activitybar__icon--active"><path d="M2 4l7-2v20l-7-2V4zm9-1h4v20h-4V3zm6 2l5 2v12l-5 2V5z" /></svg>
            <svg viewBox="0 0 24 24" className="vsc-activitybar__icon"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-5-5" stroke="currentColor" strokeWidth="2" /></svg>
            <svg viewBox="0 0 24 24" className="vsc-activitybar__icon"><circle cx="7" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10 12l4 4m0-4l-4 4" stroke="currentColor" strokeWidth="2" /></svg>
            <svg viewBox="0 0 24 24" className="vsc-activitybar__icon"><path d="M4 4h16v6H4V4zm0 10h16v6H4v-6z" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          </div>

          {/* Tabs + editor/notebook content */}
          <div className="vsc-workbench">
            <div className="vsc-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'editor'}
                data-testid="vsc-tab-editor"
                className={`vsc-tab ${tab === 'editor' ? 'vsc-tab--active' : ''}`}
                onClick={() => setTab('editor')}>
                <span className="vsc-tab__dot" aria-hidden="true">●</span>
                main.py
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'notebook'}
                data-testid="vsc-tab-notebook"
                className={`vsc-tab ${tab === 'notebook' ? 'vsc-tab--active' : ''}`}
                onClick={() => setTab('notebook')}>
                <span className="vsc-tab__dot vsc-tab__dot--book" aria-hidden="true">◫</span>
                Notebook
              </button>
              <div className="vsc-tabs__spacer" />
              <button
                type="button"
                className="vsc-run"
                data-testid="vsc-run"
                onClick={() => {
                  if (tab !== 'editor') setTab('editor');
                  setRunCount((c) => c + 1);
                }}>
                <span aria-hidden="true">▶</span> Run
              </button>
            </div>

            <div className="vsc-workbench__content">
              {tab === 'editor' ? (
                <MonacoPane
                  key={resetKey}
                  value={code}
                  onChange={setCode}
                  resetKey={resetKey}
                  ariaLabel={translate({id: 'playground.vscode.editorLabel', message: 'Python editor (main.py)'})}
                />
              ) : (
                <JupyterLiteEmbed key={`lite:${embedKey}`} weekId={weekId} mode={embedMode} />
              )}
            </div>

            {/* Integrated terminal — Pyodide stdout/stderr. */}
            <PyodideTerminal getCode={() => code} runRequest={runCount} />
          </div>
        </div>

        <div className="vsc-statusbar">
          <span className="vsc-statusbar__item">⧉ main.py</span>
          <span className="vsc-statusbar__item vsc-statusbar__item--python">
            <span aria-hidden="true">🐍</span> Python 3.12 · Pyodide (WASM)
          </span>
          <span className="vsc-statusbar__item vsc-statusbar__spacer" aria-hidden="true" />
          <span className="vsc-statusbar__item" aria-hidden="true">⚡ In-Browser</span>
          <span className="vsc-statusbar__item" aria-hidden="true">UTF-8</span>
        </div>
      </aside>
    </>
  );
}
