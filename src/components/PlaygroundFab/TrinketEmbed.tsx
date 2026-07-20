import React from 'react';
import {TRINKET_EMBED_URL} from '@site/src/utils/playgroundUrls';
import styles from './styles.module.css';

/** Only mounted (with an iframe src) once the FAB is actually open — see index.tsx. */
export default function TrinketEmbed(): React.JSX.Element {
  return (
    <iframe
      className={styles.embedFrame}
      src={TRINKET_EMBED_URL}
      title="Trinket Python playground"
      allow="clipboard-write"
    />
  );
}
