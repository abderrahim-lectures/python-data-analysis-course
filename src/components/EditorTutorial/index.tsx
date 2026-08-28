import React, {useState, useEffect, useCallback} from 'react';
import Translate from '@docusaurus/Translate';
import {usePluginData} from '@docusaurus/useGlobalData';
import styles from './styles.module.css';

interface TutorialStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: React.ReactNode;
  content: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
  mobilePosition?: 'top' | 'bottom';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    target: '[data-tutorial-target="monaco-editor"]',
    title: <Translate id="tutorial.step1.title">Welcome to the Python Editor</Translate>,
    content: (
      <Translate id="tutorial.step1.content">
        This is where you'll write Python code. Type directly here — no installation needed!
      </Translate>
    ),
    position: 'bottom',
    mobilePosition: 'top',
  },
  {
    id: 'run-button',
    target: '[data-tutorial-target="run-button"]',
    title: <Translate id="tutorial.step2.title">Run Your Code</Translate>,
    content: (
      <Translate id="tutorial.step2.content">
        Click "Run" or press Ctrl+Enter to execute your code. Your output appears in the terminal below.
      </Translate>
    ),
    position: 'bottom',
    mobilePosition: 'top',
  },
  {
    id: 'terminal',
    target: '[data-tutorial-target="terminal"]',
    title: <Translate id="tutorial.step3.title">See Results Here</Translate>,
    content: (
      <Translate id="tutorial.step3.content">
        This terminal shows your code's output, errors, and help messages. Read the last line when something goes wrong.
      </Translate>
    ),
    position: 'top',
    mobilePosition: 'bottom',
  },
  {
    id: 'notebook-tab',
    target: '[data-tutorial-target="notebook-tab"]',
    title: <Translate id="tutorial.step4.title">Notebook Mode</Translate>,
    content: (
      <Translate id="tutorial.step4.content">
        Click this tab for interactive notebooks with charts and data analysis. We'll use this in Week 3.
      </Translate>
    ),
    position: 'bottom',
    mobilePosition: 'top',
  },
  {
    id: 'shortcuts',
    target: '[data-tutorial-target="monaco-editor"]',
    title: <Translate id="tutorial.step5.title">Keyboard Shortcuts</Translate>,
    content: (
      <div>
        <p><Translate id="tutorial.step5.content">Useful shortcuts to speed up coding:</Translate></p>
        <ul style={{margin: '8px 0', paddingLeft: '20px', fontSize: '13px'}}>
          <li><strong>Ctrl+Enter</strong> — Run code</li>
          <li><strong>Ctrl+A</strong> — Select all</li>
          <li><strong>Ctrl+/</strong> — Comment/uncomment line</li>
          <li><strong>Ctrl+D</strong> — Duplicate line</li>
        </ul>
      </div>
    ),
    position: 'bottom',
    mobilePosition: 'top',
  },
  {
    id: 'try-it',
    target: '[data-tutorial-target="monaco-editor"]',
    title: <Translate id="tutorial.step6.title">Try It Now</Translate>,
    content: (
      <Translate id="tutorial.step6.content">
        Type this and click Run:
      </Translate>
    ),
    position: 'bottom',
    mobilePosition: 'top',
  },
];

interface EditorTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
  isVisible: boolean;
}

export default function EditorTutorial({
  onComplete,
  onSkip,
  isVisible,
}: EditorTutorialProps): React.JSX.Element | null {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  // Find and highlight the target element
  useEffect(() => {
    if (!isVisible) return;

    const step = TUTORIAL_STEPS[currentStep];
    if (!step) return;

    const el = document.querySelector(step.target) as HTMLElement;
    setHighlightedElement(el);

    // Scroll element into view if needed
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'center'});
    }
  }, [currentStep, isVisible]);

  const handleNext = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleNext, handlePrev, onSkip]);

  if (!isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  if (!step) return null;

  return (
    <div className={styles.overlay}>
      {/* Spotlight effect */}
      <div
        className={styles.spotlight}
        style={highlightedElement ? {
          top: highlightedElement.getBoundingClientRect().top - 8,
          left: highlightedElement.getBoundingClientRect().left - 8,
          width: highlightedElement.getBoundingClientRect().width + 16,
          height: highlightedElement.getBoundingClientRect().height + 16,
        } : undefined}
      />

      {/* Tooltip */}
      <div
        className={`${styles.tooltip} ${styles[`tooltip--${step.mobilePosition || step.position}`]}`}
        style={highlightedElement ? {
          top: step.position === 'bottom'
            ? highlightedElement.getBoundingClientRect().bottom + 16
            : undefined,
          bottom: step.position === 'top'
            ? window.innerHeight - highlightedElement.getBoundingClientRect().top + 16
            : undefined,
          left: Math.min(
            highlightedElement.getBoundingClientRect().left,
            window.innerWidth - 320
          ),
        } : undefined}
      >
        <div className={styles.tooltipHeader}>
          <span className={styles.stepCounter}>
            {currentStep + 1} / {TUTORIAL_STEPS.length}
          </span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onSkip}
            aria-label="Close tutorial">
            ×
          </button>
        </div>

        <h3 className={styles.tooltipTitle}>{step.title}</h3>
        <p className={styles.tooltipContent}>{step.content}</p>

        {step.id === 'try-it' && (
          <div className={styles.codeExample}>
            <code>print("Hello, Python! 🐍")</code>
          </div>
        )}

        <div className={styles.tooltipActions}>
          <button
            type="button"
            className={styles.skipButton}
            onClick={onSkip}>
            <Translate id="tutorial.skip">Skip tutorial</Translate>
          </button>

          <div className={styles.navButtons}>
            {currentStep > 0 && (
              <button
                type="button"
                className={styles.prevButton}
                onClick={handlePrev}>
                ←
              </button>
            )}
            <button
              type="button"
              className={styles.nextButton}
              onClick={handleNext}>
              {currentStep < TUTORIAL_STEPS.length - 1
                ? <Translate id="tutorial.next">Next</Translate>
                : <Translate id="tutorial.start">Start Coding!</Translate>
              }
            </button>
          </div>
        </div>

        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%`}}
          />
        </div>
      </div>
    </div>
  );
}
