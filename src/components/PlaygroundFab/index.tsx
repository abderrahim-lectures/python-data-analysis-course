import React, {useEffect, useRef, useState} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {useCurrentDoc} from '@site/src/context/CurrentDocContext';
import {buildWeekId} from '@site/src/utils/weekId';
import JupyterLiteEmbed from './JupyterLiteEmbed';
import styles from './styles.module.css';

export default function PlaygroundFab(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const {doc} = useCurrentDoc();
  const panelRef = useRef<HTMLDivElement>(null);

  // Both sections use JupyterLite (self-hosted, works offline) — Data Analysis
  // gets the full Notebook app (cell-based, matches its pedagogy), Python 101
  // gets the lighter REPL app (a plain console, closer to what a "scratch
  // playground" should feel like for single-snippet exercises). Defaults to
  // the REPL when the FAB is opened outside any doc page (e.g. the homepage),
  // since Python 101 is the course's entry point.
  const embedMode: 'notebook' | 'repl' = doc.section === 'data-analysis' ? 'notebook' : 'repl';
  const weekId =
    doc.section && doc.track && doc.week != null
      ? buildWeekId(doc.section, doc.track, doc.week)
      : null;
  const embedKey = weekId ?? 'default';

  // PlaygroundFab is mounted once, globally, in Root — it never unmounts on
  // navigation. `mountedKey` tracks which page's embed is currently loaded
  // into the iframe (if any). Closing the panel used to unconditionally
  // unmount it, destroying the iframe outright — for JupyterLite specifically,
  // that meant any notebook edits typed since the last save (manual or its own
  // ~2-minute autosave interval) were lost the moment a student closed the FAB,
  // which is exactly what "my notebook isn't saving" looks like from the
  // outside. Now the embed, once opened, stays mounted (just visually hidden
  // via CSS) across closes on the *same* page, so it keeps running — and
  // keeps whatever the student typed — in the background. It only actually
  // unmounts (via the `key` below) when the page itself changes, which is the
  // per-page reset this was always meant to have.
  const [mountedKey, setMountedKey] = useState<string | null>(null);
  useEffect(() => {
    setMountedKey(null);
  }, [embedKey]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const openFab = () => {
    setMountedKey(embedKey);
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        onClick={openFab}
        aria-label={translate({
          id: 'playground.fab.open',
          message: 'Open the code playground',
        })}>
        <span aria-hidden="true">{'</>'}</span>
      </button>

      {mountedKey === embedKey && (
        // Not a modal: no backdrop, no click-outside-to-close. Students often
        // want to scroll back up through the lesson while the playground
        // stays open next to (or, on mobile, over) it, so the rest of the
        // page must stay fully visible and interactive.
        <div className={`${styles.dock} ${isOpen ? '' : styles.dockHidden}`}>
          <div
            className={styles.panel}
            role="region"
            aria-label={translate({
              id: 'playground.panel.label',
              message: 'Code playground',
            })}
            tabIndex={-1}
            ref={panelRef}>
            <div className={styles.panelHeader}>
              <span>
                <Translate id="playground.panel.title">Playground</Translate>
              </span>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label={translate({id: 'playground.panel.close', message: 'Close'})}>
                ✕
              </button>
            </div>
            <div className={styles.panelBody}>
              <JupyterLiteEmbed key={embedKey} weekId={weekId} mode={embedMode} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
