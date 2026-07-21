import React, {useState} from 'react';
import Translate from '@docusaurus/Translate';
import {useJupyterLiteUrl} from '@site/src/utils/playgroundUrls';
import styles from './styles.module.css';

interface Props {
  weekId: string | null;
}

/**
 * Only mounted (with an iframe src) once the FAB is actually open — see index.tsx.
 * Shows an explicit loading state: Pyodide + pandas/numpy/matplotlib wheels are
 * tens of MB on first load, so a blank iframe would otherwise look frozen.
 */
export default function JupyterLiteEmbed({weekId}: Props): React.JSX.Element {
  const [loaded, setLoaded] = useState(false);
  const src = useJupyterLiteUrl(weekId);

  return (
    <div className={styles.jupyterLiteWrapper}>
      {!loaded && (
        <div className={styles.loadingState}>
          <Translate id="playground.jupyterlite.loading">
            Loading the notebook environment — first load can take a moment, faster on
            Wi-Fi.
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
      <iframe className={styles.embedFrame} src={src} title="JupyterLite notebook" onLoad={() => setLoaded(true)} />
    </div>
  );
}
