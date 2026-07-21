import React, {forwardRef} from 'react';
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
        <h2>🎓 Course Complete!</h2>
      ) : (
        <h2>📊 Course Progress</h2>
      )}
      <p className={styles.name}>{payload.name ?? 'A Python & Data Analysis student'}</p>
      <p className={styles.stat}>
        {payload.completedCount} / {payload.totalCount} weeks · {payload.badgeCount} badges
      </p>
      <p className={styles.id}>ID: {payload.studentId}</p>
      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrDataUrl} alt="Verification QR code" className={styles.qr} />
      )}
    </div>
  );
});

export default SharedProgressCard;
