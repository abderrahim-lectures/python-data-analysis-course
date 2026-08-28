import React, {useState, useEffect, useCallback} from 'react';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

interface Tip {
  id: string;
  content: React.ReactNode;
  category: 'python' | 'editor' | 'data';
}

const TIPS: Tip[] = [
  {
    id: 'indentation',
    category: 'python',
    content: (
      <Translate id="tips.indentation">
        Python uses indentation to group code. Use 4 spaces (not tabs) for each level.
      </Translate>
    ),
  },
  {
    id: 'comments',
    category: 'python',
    content: (
      <Translate id="tips.comments">
        Add comments with #. They help you remember what your code does!
      </Translate>
    ),
  },
  {
    id: 'variables',
    category: 'python',
    content: (
      <Translate id="tips.variables">
        Variables don't need to be declared. Just name = value and Python creates it.
      </Translate>
    ),
  },
  {
    id: 'keyboard-run',
    category: 'editor',
    content: (
      <Translate id="tips.keyboardRun">
        Press Ctrl+Enter to run your code quickly without using the mouse.
      </Translate>
    ),
  },
  {
    id: 'error-messages',
    category: 'editor',
    content: (
      <Translate id="tips.errorMessages">
        Read error messages from the bottom up — the last line usually tells you what went wrong.
      </Translate>
    ),
  },
  {
    id: 'copy-paste',
    category: 'editor',
    content: (
      <Translate id="tips.copyPaste">
        You can copy code from lessons and paste it into the editor to try it out!
      </Translate>
    ),
  },
  {
    id: 'print-debug',
    category: 'python',
    content: (
      <Translate id="tips.printDebug">
        Use print() to see what your code is doing step by step — a great way to find bugs!
      </Translate>
    ),
  },
  {
    id: 'dataframe',
    category: 'data',
    content: (
      <Translate id="tips.dataframe">
        A pandas DataFrame is like an Excel table — rows and columns of data you can analyze.
      </Translate>
    ),
  },
  {
    id: 'notebook',
    category: 'editor',
    content: (
      <Translate id="tips.notebook">
        The Notebook tab runs interactive Jupyter notebooks — perfect for data analysis with charts!
      </Translate>
    ),
  },
  {
    id: 'ask-help',
    category: 'editor',
    content: (
      <Translate id="tips.askHelp">
        Stuck? Click the 💡 hint in the terminal — it shows common mistakes and how to fix them.
      </Translate>
    ),
  },
];

interface Props {
  isVisible: boolean;
  onDismiss: () => void;
}

export default function TipsOfDay({isVisible, onDismiss}: Props): React.JSX.Element | null {
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);

  useEffect(() => {
    if (isVisible) {
      // Show a random tip
      const randomIndex = Math.floor(Math.random() * TIPS.length);
      setCurrentTip(TIPS[randomIndex]);
    }
  }, [isVisible]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  if (!isVisible || !currentTip) return null;

  return (
    <div className={styles.overlay} onClick={handleDismiss}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.icon}>💡</span>
          <h3 className={styles.title}>
            <Translate id="tips.title">Tip of the Day</Translate>
          </h3>
        </div>
        
        <div className={styles.content}>
          <span className={styles.category}>
            {currentTip.category === 'python' && (
              <Translate id="tips.category.python">Python</Translate>
            )}
            {currentTip.category === 'editor' && (
              <Translate id="tips.category.editor">Editor</Translate>
            )}
            {currentTip.category === 'data' && (
              <Translate id="tips.category.data">Data Analysis</Translate>
            )}
          </span>
          <p className={styles.tipText}>{currentTip.content}</p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className="button button--primary"
            onClick={handleDismiss}>
            <Translate id="tips.gotIt">Got it!</Translate>
          </button>
        </div>
      </div>
    </div>
  );
}
