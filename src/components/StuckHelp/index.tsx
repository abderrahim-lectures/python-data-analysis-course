import React, {useState} from 'react';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

interface StuckHelpProps {
  weekId: string;
  section: 'python-101' | 'data-analysis';
}

interface CommonMistake {
  error: string;
  fix: string;
  lessonLink?: string;
}

const COMMON_MISTAKES: Record<string, CommonMistake[]> = {
  'python-101': [
    {
      error: 'Forgetting colons after if/for/while/def',
      fix: 'Always add : at the end of these statements.',
      lessonLink: '/docs/python-101/normal/week-2#if-statements',
    },
    {
      error: 'Using = instead of == in comparisons',
      fix: '= assigns a value, == compares values.',
    },
    {
      error: 'Not converting input() to a number',
      fix: 'input() returns text. Use int() or float() to convert.',
    },
    {
      error: 'Indentation errors',
      fix: 'Python uses spaces to group code. Use 4 spaces after :.',
    },
    {
      error: 'Mixing strings and numbers',
      fix: 'Use str() to convert numbers to text before concatenating.',
    },
  ],
  'data-analysis': [
    {
      error: 'Forgetting to import pandas',
      fix: 'Start with: import pandas as pd',
    },
    {
      error: 'Column name typos',
      fix: 'Check exact spelling and case. Use df.columns to list all.',
    },
    {
      error: 'Not grouping before aggregating',
      fix: 'Use df.groupby("column").agg() instead of just df.agg().',
    },
    {
      error: 'Plot not showing',
      fix: 'Add plt.show() after creating the plot.',
    },
    {
      error: 'File not found errors',
      fix: 'Check the file path. Use the exact filename from the files panel.',
    },
  ],
};

export default function StuckHelp({weekId, section}: StuckHelpProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const mistakes = COMMON_MISTAKES[section] || COMMON_MISTAKES['python-101'];

  return (
    <div className={styles.stuckHelp}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}>
        <span className={styles.icon}>💡</span>
        <Translate id="stuckHelp.title">Stuck? Common mistakes this week</Translate>
        <span className={styles.chevron}>{expanded ? '▾' : '▸'}</span>
      </button>
      
      {expanded && (
        <div className={styles.content}>
          <ul className={styles.mistakesList}>
            {mistakes.map((mistake, index) => (
              <li key={index} className={styles.mistake}>
                <strong className={styles.mistakeError}>{mistake.error}</strong>
                <p className={styles.mistakeFix}>{mistake.fix}</p>
                {mistake.lessonLink && (
                  <a href={mistake.lessonLink} className={styles.lessonLink}>
                    📖 See this in the lesson
                  </a>
                )}
              </li>
            ))}
          </ul>
          
          <div className={styles.helpLinks}>
            <Translate id="stuckHelp.stillStuck">
              Still stuck? Try these:
            </Translate>
            <ul>
              <li>
                <a href="https://github.com/abderrahim-lectures/python-data-analysis-course/discussions" target="_blank" rel="noopener noreferrer">
                  💬 Ask on GitHub Discussions
                </a>
              </li>
              <li>
                <a href="https://github.com/abderrahim-lectures/python-data-analysis-course/issues/new" target="_blank" rel="noopener noreferrer">
                  🐛 Report a bug
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
