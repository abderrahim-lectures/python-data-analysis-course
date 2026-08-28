import React from 'react';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

interface ReadingTimeProps {
  content: string;
}

/**
 * Estimates reading time based on word count (average 200 WPM for technical content).
 */
export default function ReadingTime({content}: ReadingTimeProps): React.JSX.Element {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));

  return (
    <span className={styles.readingTime}>
      <span className={styles.icon}>📖</span>
      <Translate
        id="readingTime.minutes"
        values={{minutes}}
        description="Estimated reading time">
        {'{minutes} min read'}
      </Translate>
    </span>
  );
}
