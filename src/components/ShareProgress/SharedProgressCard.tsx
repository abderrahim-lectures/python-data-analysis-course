import React, {forwardRef} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type {SharePayload} from '@site/src/types/share';
import styles from './SharedProgressCard.module.css';

interface Props {
  payload: SharePayload;
  qrDataUrl?: string;
}

/**
 * Presentational card shared by /share (read-only, decoded from a URL) and
 * the certificate download (rasterized via html-to-image) — same component,
 * two visual modes: a compact progress summary normally, and a formal
 * certificate layout (course name, "issued on" date, site name, the
 * student's name set in a distinct serif face) once `payload.completed`.
 */
const SharedProgressCard = forwardRef<HTMLDivElement, Props>(function SharedProgressCard(
  {payload, qrDataUrl},
  ref,
) {
  const {siteConfig} = useDocusaurusContext();
  const websiteName = new URL(siteConfig.url).hostname;

  if (payload.completed) {
    return (
      <div ref={ref} className={`${styles.card} ${styles.certificate}`}>
        <p className={styles.courseName}>{siteConfig.title}</p>
        <h2 className={styles.certTitle}>
          🎓 <Translate id="sharedProgressCard.certificateHeading">Certificate of Completion</Translate>
        </h2>
        <p className={styles.certifyLine}>
          <Translate id="sharedProgressCard.certifyLine">This certifies that</Translate>
        </p>
        <p className={styles.studentName}>
          {payload.name ?? (
            <Translate id="sharedProgressCard.defaultName">A Python & Data Analysis student</Translate>
          )}
        </p>
        <p className={styles.certifyLine}>
          <Translate id="sharedProgressCard.completedLine">
            has completed the full course
          </Translate>
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
        {payload.date && <p className={styles.date}>{payload.date}</p>}
        <p className={styles.website}>{websiteName}</p>
        <p className={styles.id}>
          <Translate id="sharedProgressCard.idLabel" values={{studentId: payload.studentId}}>
            {'ID: {studentId}'}
          </Translate>
        </p>
        {qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={translate({id: 'sharedProgressCard.qrAlt', message: 'Verification QR code'})}
            className={styles.qr}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className={styles.card}>
      <h2>
        📊 <Translate id="sharedProgressCard.progressHeading">Course Progress</Translate>
      </h2>
      <p className={styles.name}>
        {payload.name ?? (
          <Translate id="sharedProgressCard.defaultName">A Python & Data Analysis student</Translate>
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
          alt={translate({id: 'sharedProgressCard.qrAlt', message: 'Verification QR code'})}
          className={styles.qr}
        />
      )}
    </div>
  );
});

export default SharedProgressCard;
