import React from 'react';
import {translate} from '@docusaurus/Translate';
import {useUiMode} from '@site/src/context/UiModeContext';
import styles from './styles.module.css';

/**
 * Persistent Gamified/Classical switch. Docusaurus doesn't allow safely
 * swizzling custom React navbar item types without ejecting internals, so
 * this renders as a small fixed pill instead — reachable from anywhere,
 * without forking theme-classic's NavbarItem component types.
 */
export default function ModeToggle(): React.JSX.Element {
  const {mode, setMode} = useUiMode();
  const isGamified = mode === 'gamified';

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setMode(isGamified ? 'classical' : 'gamified')}
      aria-label={translate({
        id: 'modeToggle.label',
        message: 'Switch between Gamified and Classical mode',
      })}
      title={isGamified ? 'Gamified mode — click for Classical' : 'Classical mode — click for Gamified'}>
      {isGamified ? '🎮' : '📄'}
    </button>
  );
}
