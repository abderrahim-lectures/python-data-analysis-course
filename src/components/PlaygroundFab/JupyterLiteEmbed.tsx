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
      <iframe
        className={styles.embedFrame}
        src={src}
        title="JupyterLite notebook"
        onLoad={() => setLoaded(true)}
        style={{visibility: loaded ? 'visible' : 'hidden'}}
      />
    </div>
  );
}
