import React, {useEffect, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import type {LocaleAutoRedirectNotice} from '@site/src/theme/Root/LocaleRedirect';
import styles from './styles.module.css';

/**
 * A silent auto-redirect (LocaleRedirect.tsx) read as "the page glitched
 * into another language" to a first-time visitor who never asked for a
 * locale switch — this makes that redirect visible and one click to undo,
 * shown once on the page it landed on.
 */
export default function AutoLocaleRedirectBanner(): React.JSX.Element | null {
  const {siteConfig, i18n} = useDocusaurusContext();
  const [notice, setNotice] = useLocalStorage<LocaleAutoRedirectNotice | null>(
    STORAGE_KEYS.localeAutoRedirectNotice,
    null,
  );
  const [shown, setShown] = useState<LocaleAutoRedirectNotice | null>(null);

  useEffect(() => {
    if (notice) {
      setShown(notice);
      setNotice(null); // one-shot: clear immediately so a refresh doesn't re-show it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!shown) {
    return null;
  }

  const currentLabel = i18n.localeConfigs[i18n.currentLocale]?.label ?? i18n.currentLocale;
  const originalLabel =
    i18n.localeConfigs[shown.originalLocale]?.label ?? shown.originalLocale;
  const originalPrefix =
    shown.originalLocale === i18n.defaultLocale ? '' : `${shown.originalLocale}/`;
  const backHref = `${siteConfig.baseUrl}${originalPrefix}${shown.originalUrl.replace(/^\//, '')}`;

  return (
    <div className={styles.banner}>
      <p>
        <Translate id="autoLocaleRedirect.message" values={{locale: currentLabel}}>
          {'Switched to {locale} based on your browser — '}
        </Translate>
        <a href={backHref}>{originalLabel}</a>
      </p>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => setShown(null)}
        aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
