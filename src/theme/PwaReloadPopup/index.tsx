import React, {useState} from 'react';
import Translate from '@docusaurus/Translate';

export default function PwaReloadPopup({onReload}: {onReload: () => void}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div
      className="alert alert--secondary"
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1.25rem',
        borderRadius: 'var(--ifm-radius-lg)',
        boxShadow: 'var(--ifm-global-shadow-lw)',
      }}>
      <span>
        <Translate id="theme.PwaReloadPopup.info">New version available</Translate>
      </span>
      <button
        className="button button--primary button--sm"
        type="button"
        onClick={() => {
          setVisible(false);
          onReload();
        }}>
        <Translate id="theme.PwaReloadPopup.refreshButtonText">Refresh</Translate>
      </button>
      <button
        className="clean-btn close"
        type="button"
        aria-label="Close"
        onClick={() => setVisible(false)}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
