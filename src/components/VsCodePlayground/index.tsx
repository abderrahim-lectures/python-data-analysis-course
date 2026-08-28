import React, {useCallback, useState} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {useCurrentDoc} from '@site/src/context/CurrentDocContext';
import MonacoPane from './MonacoPane';
import PyodideTerminal from './PyodideTerminal';
import JupyterLiteEmbed from './JupyterLiteEmbed';
import EditorTutorial from '../EditorTutorial';
import FirstSuccess from '../FirstSuccess';
import TipsOfDay from '../TipsOfDay';
import StillStuck from '../StillStuck';
import {
  usePlaygroundLayout,
  usePlaygroundTab,
  useEditorCode,
  usePlaygroundOnboarding,
  usePlaygroundPreferences,
} from '@site/src/hooks';
import {useErrorHistory} from '@site/src/hooks/useErrorHistory';
import {useXp} from '@site/src/hooks/useXp';
import {useStreak} from '@site/src/hooks/useStreak';

/**
 * Persistent VS Code web-style split: course content on the left, an in-browser
 * editor + terminal on the right.
 */
export default function VsCodePlayground(): React.JSX.Element | null {
  const {doc} = useCurrentDoc();

  // ALL hooks must be called before any early return (Rules of Hooks)
  const {open, setOpen, toggleOpen} = usePlaygroundLayout();
  const {tab, setTab, embedKey, weekId, embedMode} = usePlaygroundTab({
    section: doc.section,
    track: doc.track,
    week: doc.week,
  });
  const {code, setCode, resetKey, resetCode, getCode} = useEditorCode({
    section: doc.section,
    embedKey,
  });
  const {
    showTutorial,
    showFirstSuccess,
    showTips,
    handleTutorialComplete,
    handleTutorialSkip,
    handleFirstSuccessDismiss,
    handleTipsDismiss,
    triggerFirstSuccess,
  } = usePlaygroundOnboarding();
  const {minimapEnabled, toggleMinimap} = usePlaygroundPreferences();
  const {addXp} = useXp();
  const {recordActivity} = useStreak();
  const {errors, recordError} = useErrorHistory();
  const [runRequest, setRunRequest] = useState(0);

  const handleRun = useCallback(() => {
    if (tab !== 'editor') setTab('editor');
    triggerFirstSuccess();
    setRunRequest((n) => n + 1);
    addXp(5, 'Run code');
    recordActivity();
  }, [tab, setTab, triggerFirstSuccess, addXp, recordActivity]);

  // Only lesson pages get the split view
  if (!doc.section) return null;

  return (
    <>
      <EditorTutorial
        isVisible={showTutorial && open}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
      <FirstSuccess isVisible={showFirstSuccess && open} onDismiss={handleFirstSuccessDismiss} />
      <TipsOfDay isVisible={showTips && open} onDismiss={handleTipsDismiss} />

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

      <button
        type="button"
        className="vsc-reopen"
        data-testid="vsc-reopen"
        onClick={() => setOpen(true)}
        aria-label={translate({id: 'playground.vscode.reopen', message: 'Show editor'})}>
        <span aria-hidden="true">❯</span> Code
      </button>

      <aside className="vsc-dock" role="region" aria-label={translate({id: 'playground.panel.label', message: 'Code playground'})}>
        <div className="vsc-titlebar">
          <span className="vsc-titlebar__lights" aria-hidden="true">
            <i className="vsc-light vsc-light--red" />
            <i className="vsc-light vsc-light--yellow" />
            <i className="vsc-light vsc-light--green" />
          </span>
          <span className="vsc-titlebar__title">pyda-course · Playground</span>
          <button
            type="button"
            className={`vsc-titlebar__minimap ${minimapEnabled ? 'vsc-titlebar__minimap--active' : ''}`}
            onClick={toggleMinimap}
            aria-label={translate({id: 'playground.vscode.toggleMinimap', message: 'Toggle minimap'})}
            aria-pressed={minimapEnabled}>
            {minimapEnabled ? '🗺️' : '🗺️'}
          </button>
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
          <div className="vsc-activitybar">
            <svg viewBox="0 0 24 24" className="vsc-activitybar__icon vsc-activitybar__icon--active"><title>{translate({id: 'playground.vscode.explorer', message: 'Explorer'})}</title><path d="M2 4l7-2v20l-7-2V4zm9-1h4v20h-4V3zm6 2l5 2v12l-5 2V5z" /></svg>
            <svg viewBox="0 0 24 24" className="vsc-activitybar__icon"><title>{translate({id: 'playground.vscode.search', message: 'Search'})}</title><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-5-5" stroke="currentColor" strokeWidth="2" /></svg>
            <svg viewBox="0 0 24 24" className="vsc-activitybar__icon"><title>{translate({id: 'playground.vscode.extensions', message: 'Extensions'})}</title><circle cx="7" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10 12l4 4m0-4l-4 4" stroke="currentColor" strokeWidth="2" /></svg>
            <svg viewBox="0 0 24 24" className="vsc-activitybar__icon"><title>{translate({id: 'playground.vscode.settings', message: 'Settings'})}</title><path d="M4 4h16v6H4V4zm0 10h16v6H4v-6z" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          </div>

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
                data-tutorial-target="notebook-tab"
                className={`vsc-tab ${tab === 'notebook' ? 'vsc-tab--active' : ''}`}
                onClick={() => setTab('notebook')}>
                <span className="vsc-tab__dot vsc-tab__dot--book" aria-hidden="true">◫</span>
                Notebook
              </button>
              <div className="vsc-tabs__spacer" />
              <button
                type="button"
                className="vsc-reset"
                data-testid="vsc-reset"
                onClick={resetCode}
                aria-label={translate({id: 'playground.vscode.reset', message: 'Reset code'})}>
                <span aria-hidden="true">↺</span>
              </button>
              <button
                type="button"
                className="vsc-run"
                data-testid="vsc-run"
                data-tutorial-target="run-button"
                onClick={handleRun}>
                <span aria-hidden="true">▶</span> Run
              </button>
            </div>

            <div className="vsc-workbench__content" data-tutorial-target="monaco-editor">
              {tab === 'editor' ? (
                <MonacoPane
                  key={resetKey}
                  value={code}
                  onChange={setCode}
                  resetKey={resetKey}
                  minimap={minimapEnabled}
                  ariaLabel={translate({id: 'playground.vscode.editorLabel', message: 'Python editor (main.py)'})}
                />
              ) : (
                <JupyterLiteEmbed key={`lite:${embedKey}`} weekId={weekId} mode={embedMode} />
              )}
            </div>

            <PyodideTerminal
              getCode={getCode}
              runRequest={runRequest}
              onError={weekId ? (msg) => recordError(msg, weekId) : undefined}
            />
            {weekId && <StillStuck weekId={weekId} errors={errors} />}
          </div>
        </div>

        <div className="vsc-statusbar">
          <span className="vsc-statusbar__item">⧉ main.py</span>
          <span className="vsc-statusbar__item vsc-statusbar__item--python">
            <span aria-hidden="true">🐍</span> Python 3.12 · Pyodide (WASM)
          </span>
          <span className="vsc-statusbar__spacer" aria-hidden="true" />
          <span className="vsc-statusbar__item" aria-hidden="true">⚡ In-Browser</span>
          <span className="vsc-statusbar__item" aria-hidden="true">UTF-8</span>
        </div>
      </aside>
    </>
  );
}
