import React, {useEffect, useRef, useState} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {useCurrentDoc} from '@site/src/context/CurrentDocContext';
import {buildWeekId} from '@site/src/utils/weekId';
import TrinketEmbed from './TrinketEmbed';
import JupyterLiteEmbed from './JupyterLiteEmbed';
import styles from './styles.module.css';

export default function PlaygroundFab(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const {doc} = useCurrentDoc();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Default to Trinket when the FAB is opened outside any doc page (e.g. the homepage) —
  // Python 101 is the course's entry point, so that's the most useful universal default.
  const showJupyterLite = doc.section === 'data-analysis';
  const weekId =
    doc.section && doc.track && doc.week != null
      ? buildWeekId(doc.section, doc.track, doc.week)
      : null;

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        onClick={() => setIsOpen(true)}
        aria-label={translate({
          id: 'playground.fab.open',
          message: 'Open the code playground',
        })}>
        <span aria-hidden="true">{'</>'}</span>
      </button>

      {isOpen && (
        <div className={styles.overlay} role="presentation" onClick={() => setIsOpen(false)}>
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label={translate({
              id: 'playground.panel.label',
              message: 'Code playground',
            })}
            tabIndex={-1}
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}>
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
              {showJupyterLite ? (
                <JupyterLiteEmbed weekId={weekId} />
              ) : (
                <TrinketEmbed />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
