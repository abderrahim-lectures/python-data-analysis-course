import React, {useRef, useState} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {useSharePayload} from '@site/src/hooks/useSharePayload';
import {encodeSharePayload} from '@site/src/utils/shareEncoding';
import SharedProgressCard from './SharedProgressCard';
import styles from './styles.module.css';

export default function ShareProgress(): React.JSX.Element {
  const payload = useSharePayload();
  const shareBasePath = useBaseUrl('/share');
  const certificateRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);
  const [downloading, setDownloading] = useState(false);

  const shareUrl = ExecutionEnvironment.canUseDOM
    ? `${window.location.origin}${shareBasePath}?data=${encodeSharePayload(payload)}`
    : '';

  const handleCopy = async () => {
    if (!ExecutionEnvironment.canUseDOM) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ensureQrCode = async (): Promise<string> => {
    if (qrDataUrl) return qrDataUrl;
    const QRCode = await import('qrcode');
    const dataUrl = await QRCode.toDataURL(shareUrl, {width: 240});
    setQrDataUrl(dataUrl);
    return dataUrl;
  };

  const handleDownloadCertificate = async (format: 'png' | 'pdf') => {
    setDownloading(true);
    try {
      await ensureQrCode();
      // Give the QR <img> a tick to actually paint before rasterizing.
      await new Promise((resolve) => setTimeout(resolve, 50));
      const node = certificateRef.current;
      if (!node) return;

      const {toPng} = await import('html-to-image');
      const pngDataUrl = await toPng(node, {pixelRatio: 2});

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = 'pyda-course-certificate.png';
        link.href = pngDataUrl;
        link.click();
      } else {
        const {jsPDF} = await import('jspdf');
        const pdf = new jsPDF({orientation: 'portrait', unit: 'px', format: [500, 650]});
        pdf.addImage(pngDataUrl, 'PNG', 40, 40, 420, 546);
        pdf.save('pyda-course-certificate.pdf');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h2>
        <Translate id="shareProgress.heading">Share My Progress</Translate>
      </h2>
      <p>
        <Translate id="shareProgress.intro">
          Get a read-only link to your progress — safe to send over WhatsApp or social media.
          Nothing is stored on a server; the link just carries your summary.
        </Translate>
      </p>
      <div className={styles.linkRow}>
        <input type="text" readOnly value={shareUrl} className={styles.linkInput} />
        <button className="button button--primary" type="button" onClick={handleCopy}>
          {copied
            ? translate({id: 'shareProgress.copied', message: 'Copied!'})
            : translate({id: 'shareProgress.copy', message: 'Copy link'})}
        </button>
      </div>

      {payload.completed && (
        <div className={styles.certificateSection}>
          <h3>
            <Translate id="shareProgress.certificate.heading">
              🎓 Download your certificate
            </Translate>
          </h3>
          <p className={styles.disclaimer}>
            <Translate id="shareProgress.certificate.disclaimer">
              This is a convenience/spot-check tool, not a verified credential — the QR code
              links to your progress summary for a quick check, not a cryptographic guarantee.
            </Translate>
          </p>
          <div className={styles.certificateActions}>
            <button
              className="button button--primary"
              type="button"
              disabled={downloading}
              onClick={() => handleDownloadCertificate('png')}>
              <Translate id="shareProgress.certificate.png">Download PNG</Translate>
            </button>
            <button
              className="button button--secondary"
              type="button"
              disabled={downloading}
              onClick={() => handleDownloadCertificate('pdf')}>
              <Translate id="shareProgress.certificate.pdf">Download PDF</Translate>
            </button>
          </div>
        </div>
      )}

      {/* Off-screen: only used as the rasterization source for the certificate download. */}
      <div className={styles.offscreen} aria-hidden="true">
        <SharedProgressCard ref={certificateRef} payload={payload} qrDataUrl={qrDataUrl} />
      </div>
    </div>
  );
}
