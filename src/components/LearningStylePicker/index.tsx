import React, {useEffect, useState} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {useUiMode} from '@site/src/context/UiModeContext';
import {useStudentIdentity} from '@site/src/hooks/useStudentIdentity';
import type {UiMode} from '@site/src/types/progress';
import styles from './styles.module.css';

/**
 * One-time onboarding modal: optional first name + Gamified/Classical choice.
 * Shown once, on first visit (hasOnboarded is false until a student ID exists).
 * The learning-style choice isn't a lock-in — ModeToggle lets it change any time.
 */
export default function LearningStylePicker(): React.JSX.Element | null {
  const {setMode} = useUiMode();
  const {name, setName, ensureStudentId, hasOnboarded} = useStudentIdentity();
  const [mounted, setMounted] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<UiMode>('gamified');

  useEffect(() => setMounted(true), []);

  if (!mounted || hasOnboarded) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (nameInput.trim()) {
      setName(nameInput.trim());
    }
    setMode(selectedMode);
    ensureStudentId();
  };

  return (
    <div className={styles.overlay} role="presentation">
      <form
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label={translate({id: 'onboarding.title', message: 'Welcome!'})}
        onSubmit={handleSubmit}>
        <h2>
          <Translate id="onboarding.heading">Welcome! 👋</Translate>
        </h2>
        <p>
          <Translate id="onboarding.intro">
            Two quick questions before you start — you can change either any time.
          </Translate>
        </p>

        <label className={styles.field}>
          <Translate id="onboarding.name.label">What should we call you? (optional)</Translate>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={translate({
              id: 'onboarding.name.placeholder',
              message: 'Your first name',
            })}
            maxLength={40}
          />
        </label>

        <fieldset className={styles.field}>
          <legend>
            <Translate id="onboarding.mode.label">How do you like to learn?</Translate>
          </legend>
          <label className={styles.radioOption}>
            <input
              type="radio"
              name="learning-style"
              checked={selectedMode === 'gamified'}
              onChange={() => setSelectedMode('gamified')}
            />
            <span>
              🎮{' '}
              <Translate id="onboarding.mode.gamified">
                Gamified — badges, quizzes, bonus unlocks, playful UI
              </Translate>
            </span>
          </label>
          <label className={styles.radioOption}>
            <input
              type="radio"
              name="learning-style"
              checked={selectedMode === 'classical'}
              onChange={() => setSelectedMode('classical')}
            />
            <span>
              📄{' '}
              <Translate id="onboarding.mode.classical">
                Classical — clean, minimal, no gamification chrome
              </Translate>
            </span>
          </label>
        </fieldset>

        <button type="submit" className="button button--primary button--block">
          <Translate id="onboarding.submit">Let's go →</Translate>
        </button>
      </form>
    </div>
  );
}
