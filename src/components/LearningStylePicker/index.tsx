import React, {useEffect, useState} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {useStudentIdentity} from '@site/src/hooks/useStudentIdentity';
import styles from './styles.module.css';

/**
 * One-time onboarding modal: optional first name.
 * Shown once, on first visit (hasOnboarded is false until a student ID exists).
 */
export default function LearningStylePicker(): React.JSX.Element | null {
  const {name, setName, ensureStudentId, hasOnboarded} = useStudentIdentity();
  const [mounted, setMounted] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => setMounted(true), []);

  if (!mounted || hasOnboarded) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (nameInput.trim()) {
      setName(nameInput.trim());
    }
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
            Ready to start learning Python? Let's get you set up!
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

        <button type="submit" className="button button--primary button--block">
          <Translate id="onboarding.submit">Let's start learning →</Translate>
        </button>
      </form>
    </div>
  );
}
