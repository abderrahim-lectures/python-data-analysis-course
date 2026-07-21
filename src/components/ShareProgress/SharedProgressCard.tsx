import React, {forwardRef} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import type {SharePayload} from '@site/src/types/share';
import styles from './SharedProgressCard.module.css';

interface Props {
  payload: SharePayload;
  qrDataUrl?: string;
}

/**
 * Presentational card shared by /share (read-only, decoded from a URL) and
 * the certificate download (rasterized via html-to-image) — same visuals,
 * different context.
 */
const SharedProgressCard = forwardRef<HTMLDivElement, Props>(function SharedProgressCard(
  {payload, qrDataUrl},
  ref,
) {
  return (
    <div ref={ref} className={styles.card}>
      {payload.completed ? (
        <h2>
          🎓 <Translate id="sharedProgressCard.completeHeading">Course Complete!</Translate>
        </h2>
      ) : (
        <h2>
          📊 <Translate id="sharedProgressCard.progressHeading">Course Progress</Translate>
        </h2>
      )}
      <p className={styles.name}>
        {payload.name ?? (
          <Translate id="sharedProgressCard.defaultName">
            A Python & Data Analysis student
          </Translate>
        )}
      </p>
      <p className={styles.stat}>
        <Translate
          id="sharedProgressCard.stats"
          values={{
            completed: payload.completedCount,
            total: payload.totalCount,
            badges: payload.badgeCount,
          }}>
          {'{completed} / {total} weeks · {badges} badges'}
        </Translate>
      </p>
      <p className={styles.id}>
        <Translate id="sharedProgressCard.idLabel" values={{studentId: payload.studentId}}>
          {'ID: {studentId}'}
        </Translate>
      </p>
      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrDataUrl}
          alt={translate({
            id: 'sharedProgressCard.qrAlt',
            message: 'Verification QR code',
          })}
          className={styles.qr}
        />
      )}
    </div>
  );
});

export default SharedProgressCard;
