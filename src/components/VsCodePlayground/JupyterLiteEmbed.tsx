import React, {useRef, useState, useMemo} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useJupyterLiteNotebookUrl, useJupyterLiteReplUrl} from '@site/src/utils/playgroundUrls';
import styles from './styles.module.css';

export type PlaygroundMode = 'notebook' | 'repl';

interface Props {
  weekId: string | null;
  /** 'notebook' for Data Analysis, 'repl' for Python 101 (a plain console, no cells). */
  mode: PlaygroundMode;
}

/** Map Docusaurus locale codes to JupyterLite locale codes */
const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ar: 'ar',
  es: 'es',
  fr: 'fr-FR',
};

/** Loading messages in all supported languages */
const LOADING_MESSAGES: Record<string, string> = {
  en: 'Loading the Python environment — first load can take a moment, faster on Wi-Fi.',
  ar: 'جاري تحميل بيئة Python — قد يستغرق التحميل الأول لحظة، أسرع عبر Wi-Fi.',
  es: 'Cargando el entorno de Python — la primera carga puede tardar un momento, es más rápida por Wi-Fi.',
  fr: "Chargement de l'environnement Python — le premier chargement peut prendre un moment, plus rapide en Wi-Fi.",
};

/**
 * JupyterLab's default toolbar (thin gray icons on plain white, no visible
 * band) is easy to miss, especially in the FAB's fairly compact panel. Same
 * origin as this site (both served from pyda-course.online) means we can
 * reach into the iframe's own document and inject an override stylesheet —
 * no need to touch the JupyterLite build pipeline itself for something this
 * cosmetic. Injected once the iframe's document is ready; CSS rules apply
 * to the toolbar whenever JupyterLite finishes rendering it (that happens
 * well after the iframe's own load event, once the kernel boots), so timing
 * doesn't matter here the way it would for direct DOM manipulation.
 */
const TOOLBAR_VISIBILITY_CSS = `
  .jp-Toolbar {
    background: var(--jp-layout-color2, #eeeeee) !important;
    border-bottom: 2px solid #5b3df5 !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }
  .jp-ToolbarButtonComponent svg path,
  .jp-ToolbarButtonComponent svg circle {
    fill: #2d2d2d !important;
  }
`;

/**
 * Only mounted (with an iframe src) once the FAB is actually open — see index.tsx.
 * Shows an explicit loading state: Pyodide + pandas/numpy/matplotlib wheels are
 * tens of MB on first load, so a blank iframe would otherwise look frozen.
 */
const JupyterLiteEmbed = React.memo(function JupyterLiteEmbed({
  weekId,
  mode,
}: Props): React.JSX.Element {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const notebookSrc = useJupyterLiteNotebookUrl(weekId);
  const replSrc = useJupyterLiteReplUrl();
  const {i18n} = useDocusaurusContext();
  const locale = i18n.currentLocale;

  const src = useMemo(() => {
    const jupyterLocale = LOCALE_MAP[locale] ?? 'en-US';
    const baseSrc = mode === 'repl' ? replSrc : notebookSrc;
    return `${baseSrc}?locale=${jupyterLocale}`;
  }, [locale, mode, replSrc, notebookSrc]);

  const loadingMessage = useMemo(() => {
    return LOADING_MESSAGES[locale] ?? LOADING_MESSAGES.en;
  }, [locale]);

  const handleLoad = () => {
    setLoaded(true);
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc && !doc.getElementById('pda-toolbar-visibility')) {
        const style = doc.createElement('style');
        style.id = 'pda-toolbar-visibility';
        style.textContent = TOOLBAR_VISIBILITY_CSS;
        doc.head.appendChild(style);
      }
    } catch {
      // Same-origin today, but fail silently rather than break the embed
      // if that ever changes (e.g. /lite/ moves to a different subdomain).
    }
  };

  return (
    <div className={styles.jupyterLiteWrapper}>
      {!loaded && (
        <div className={styles.loadingState}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>{loadingMessage}</p>
          </div>
        </div>
      )}
      {/* No inline visibility toggle here: an inline style on the iframe would
          out-specificity the .dockHidden class the parent panel uses to hide
          the whole embed on close, permanently pinning it "visible" the
          moment it first finishes loading (loaded never resets back to
          false once true, since this component now stays mounted across
          closes). The .loadingState overlay above already fully covers the
          iframe while !loaded, so the iframe itself never needs its own
          visibility toggle. */}
      <iframe
        ref={iframeRef}
        className={styles.embedFrame}
        src={src}
        title={
          mode === 'repl'
            ? translate({id: 'playground.jupyterlite.replTitle', message: 'JupyterLite Python console'})
            : translate({id: 'playground.jupyterlite.notebookTitle', message: 'JupyterLite notebook'})
        }
        onLoad={handleLoad}
      />
    </div>
  );
});

export default JupyterLiteEmbed;
