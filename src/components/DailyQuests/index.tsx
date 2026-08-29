import React, {useMemo} from 'react';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import styles from './styles.module.css';

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  xpReward: number;
  completed: boolean;
  completedAt?: string;
}

interface DailyQuestsData {
  date: string;
  quests: Quest[];
}

interface Props {
  compact?: boolean;
  onQuestComplete?: (quest: Quest) => void;
  /** Removes the outer card chrome so a wrapping panel can supply it. */
  flat?: boolean;
}

// Quest templates
const QUEST_TEMPLATES = [
  {id: 'run-code', title: 'Code Runner', description: 'Run code 3 times', icon: '▶️', maxProgress: 3, xpReward: 15},
  {id: 'no-errors', title: 'Clean Coder', description: 'Run code without errors', icon: '✨', maxProgress: 2, xpReward: 10},
  {id: 'complete-lesson', title: 'Lesson Learner', description: 'Complete a lesson', icon: '📚', maxProgress: 1, xpReward: 20},
  {id: 'practice-quiz', title: 'Quiz Master', description: 'Take a practice quiz', icon: '📝', maxProgress: 1, xpReward: 15},
  {id: 'explore-notebook', title: 'Notebook Explorer', description: 'Try the notebook tab', icon: '📓', maxProgress: 1, xpReward: 10},
];

/**
 * Generates daily quests based on the current date.
 * Quests reset every day at midnight.
 */
function generateDailyQuests(): Quest[] {
  const today = new Date().toDateString();
  // Use date as seed for consistent daily quests
  const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Select 3 random quests
  const shuffled = [...QUEST_TEMPLATES].sort((a, b) => {
    const hashA = (seed + a.id.charCodeAt(0)) % 100;
    const hashB = (seed + b.id.charCodeAt(0)) % 100;
    return hashA - hashB;
  });
  
  return shuffled.slice(0, 3).map((template) => ({
    ...template,
    progress: 0,
    completed: false,
  }));
}

/**
 * Daily quest system for habit formation.
 * Inspired by Duolingo's daily quest mechanics.
 */
export default function DailyQuests({compact = false, onQuestComplete, flat = false}: Props): React.JSX.Element {
  const [questsData, setQuestsData] = useLocalStorage<DailyQuestsData>(
    STORAGE_KEYS.dailyQuests,
    {date: '', quests: []}
  );

  const quests = useMemo(() => {
    const today = new Date().toDateString();
    // Generate new quests if it's a new day
    if (questsData.date !== today) {
      const newQuests = generateDailyQuests();
      setQuestsData({date: today, quests: newQuests});
      return newQuests;
    }
    return questsData.quests;
  }, [questsData, setQuestsData]);

  const completedCount = quests.filter((q) => q.completed).length;
  const totalCount = quests.length;
  const allCompleted = completedCount === totalCount;

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <span className={styles.compactIcon}>🎯</span>
        <span className={styles.compactText}>
          {completedCount}/{totalCount}
        </span>
      </div>
    );
  }

  return (
    <div className={flat ? styles.flat : styles.container}>
      <div className={styles.header}>
        {!flat && (
          <h3 className={styles.title}>
            <span className={styles.titleIcon}>🎯</span>
            <Translate id="dailyQuests.title">Daily Quests</Translate>
          </h3>
        )}
        {flat && <span className={styles.flatTitle}>
          <Translate id="dailyQuests.completed">Completed</Translate>
        </span>}
        <span className={styles.counter}>
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className={styles.questList}>
        {quests.map((quest) => (
          <div
            key={quest.id}
            className={`${styles.questItem} ${quest.completed ? styles.questCompleted : ''}`}>
            <div className={styles.questIcon}>{quest.icon}</div>
            <div className={styles.questInfo}>
              <h4 className={styles.questTitle}>{quest.title}</h4>
              <p className={styles.questDescription}>{quest.description}</p>
              <div className={styles.questProgress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{width: `${(quest.progress / quest.maxProgress) * 100}%`}}
                  />
                </div>
                <span className={styles.progressText}>
                  {quest.progress}/{quest.maxProgress}
                </span>
              </div>
            </div>
            <div className={styles.questReward}>
              <span className={styles.rewardIcon}>⭐</span>
              <span className={styles.rewardAmount}>+{quest.xpReward}</span>
            </div>
            {quest.completed && (
              <div className={styles.completedBadge}>✓</div>
            )}
          </div>
        ))}
      </div>

      {allCompleted && (
        <div className={styles.allCompleted}>
          <Translate id="dailyQuests.allComplete">
            All quests complete! Come back tomorrow for new challenges 🎉
          </Translate>
        </div>
      )}
    </div>
  );
}
