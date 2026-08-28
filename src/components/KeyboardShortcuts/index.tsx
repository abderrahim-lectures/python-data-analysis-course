import React, {useState, useEffect} from 'react';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  {keys: ['Ctrl', 'Enter'], description: 'Run code'},
  {keys: ['Ctrl', 'A'], description: 'Select all code'},
  {keys: ['Ctrl', '/'], description: 'Toggle comment'},
  {keys: ['Ctrl', 'D'], description: 'Delete line'},
  {keys: ['Ctrl', 'Z'], description: 'Undo'},
  {keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo'},
  {keys: ['?'], description: 'Show shortcuts'},
];

/**
 * Keyboard shortcuts help panel that shows available shortcuts.
 * Toggled with ? key or by clicking the help button.
 */
export default function KeyboardShortcuts(): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts when ? is pressed (not in input/textarea)
      if (
        e.key === '?' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setIsVisible((prev) => !prev);
      }
      // Hide on Escape
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        className={styles.helpButton}
        onClick={() => setIsVisible(true)}
        aria-label="Keyboard shortcuts">
        ⌨️
      </button>

      {isVisible && (
        <div className={styles.overlay} onClick={() => setIsVisible(false)}>
          <div
            className={styles.panel}
            role="dialog"
            aria-label="Keyboard shortcuts"
            onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h2>
                <Translate id="shortcuts.title">Keyboard Shortcuts</Translate>
              </h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsVisible(false)}
                aria-label="Close">
                ✕
              </button>
            </div>
            <div className={styles.shortcuts}>
              {SHORTCUTS.map((shortcut, i) => (
                <div key={i} className={styles.shortcut}>
                  <div className={styles.keys}>
                    {shortcut.keys.map((key, j) => (
                      <kbd key={j} className={styles.key}>
                        {key}
                      </kbd>
                    ))}
                  </div>
                  <span className={styles.description}>{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
