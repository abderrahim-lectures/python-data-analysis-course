import {useEffect} from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';

/**
 * Global, invisible: on a visitor's very first page load anywhere on the
 * site, checks their browser's preferred language(s) against the locales
 * this site actually ships (en/ar/es/fr) and, if a better match exists and
 * they're not already on it, redirects once to the equivalent page under
 * that locale. Never runs again after that first attempt (tracked in
 * localStorage) — once a student has landed somewhere, or switched locales
 * themselves via the navbar dropdown, this must never fight that choice.
 */
export default function LocaleRedirect(): null {
  const {siteConfig, i18n} = useDocusaurusContext();
  const [checked, setChecked] = useLocalStorage<boolean>(
    STORAGE_KEYS.localeRedirectChecked,
    false,
  );

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM || checked) return;
    setChecked(true); // only ever attempt this once per device, regardless of outcome

    const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
    const target = preferred
      .map((lang) => lang.split('-')[0].toLowerCase())
      .find((short) => i18n.locales.includes(short) && short !== i18n.currentLocale);
    if (!target) return;

    const {baseUrl} = siteConfig;
    const {pathname, search, hash} = window.location;
    if (!pathname.startsWith(baseUrl)) return;

    let rest = pathname.slice(baseUrl.length);
    const currentPrefix = `${i18n.currentLocale}/`;
    if (i18n.currentLocale !== i18n.defaultLocale && rest.startsWith(currentPrefix)) {
      rest = rest.slice(currentPrefix.length);
    }

    const newPrefix = target === i18n.defaultLocale ? '' : `${target}/`;
    window.location.replace(`${baseUrl}${newPrefix}${rest}${search}${hash}`);
    // Only ever meant to run once, on mount — deliberately not re-running on
    // every render even though `checked`/`i18n`/etc. are technically dep-array
    // inputs, since setChecked(true) above makes every subsequent run a no-op.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
