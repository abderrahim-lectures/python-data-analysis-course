import React, {useState} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {useJupyterLiteNotebookUrl, useJupyterLiteReplUrl} from '@site/src/utils/playgroundUrls';
import styles from './styles.module.css';

interface Props {
  weekId: string | null;
  /** 'notebook' for Data Analysis, 'repl' for Python 101 (a plain console, no cells). */
  mode: 'notebook' | 'repl';
}

/**
 * Only mounted (with an iframe src) once the FAB is actually open — see index.tsx.
 * Shows an explicit loading state: Pyodide + pandas/numpy/matplotlib wheels are
 * tens of MB on first load, so a blank iframe would otherwise look frozen.
 */
export default function JupyterLiteEmbed({weekId, mode}: Props): React.JSX.Element {
  const [loaded, setLoaded] = useState(false);
  const notebookSrc = useJupyterLiteNotebookUrl(weekId);
  const replSrc = useJupyterLiteReplUrl();
  const src = mode === 'repl' ? replSrc : notebookSrc;

  return (
    <div className={styles.jupyterLiteWrapper}>
      {!loaded && (
        <div className={styles.loadingState}>
          <Translate id="playground.jupyterlite.loading">
            Loading the Python environment — first load can take a moment, faster on Wi-Fi.
          </Translate>
        </div>
      )}
      {/* No inline visibility toggle here: an inline style on the iframe would
          out-specificity the .dockHidden class the parent panel uses to hide
          the whole embed on close, permanently pinning it "visible" the
          moment it first finishes loading (loaded never resets back to
          false once true, since this component now stays mounted across
          closes). The .loadingState overlay above already fully covers the
          iframe while !loaded, so the iframe itself never needs its own
          visibility toggle. */}
      <iframe
        className={styles.embedFrame}
        src={src}
        title={
          mode === 'repl'
            ? translate({id: 'playground.jupyterlite.replTitle', message: 'JupyterLite Python console'})
            : translate({id: 'playground.jupyterlite.notebookTitle', message: 'JupyterLite notebook'})
        }
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
