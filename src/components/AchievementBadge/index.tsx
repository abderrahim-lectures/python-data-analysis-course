import React from 'react';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Props {
  achievement: Achievement;
  compact?: boolean;
}

const RARITY_COLORS = {
  common: {bg: '#6b7280', border: '#9ca3af'},
  rare: {bg: '#3b82f6', border: '#60a5fa'},
  epic: {bg: '#8b5cf6', border: '#a78bfa'},
  legendary: {bg: '#f59e0b', border: '#fbbf24'},
};

/**
 * Displays an achievement badge with unlock status.
 * Gamification element: Badges recognize accomplishments and are shareable.
 */
export default function AchievementBadge({achievement, compact = false}: Props): React.JSX.Element {
  const rarityColor = RARITY_COLORS[achievement.rarity];

  if (compact) {
    return (
      <div
        className={`${styles.badgeCompact} ${achievement.unlocked ? styles.badgeUnlocked : styles.badgeLocked}`}
        style={{
          borderColor: achievement.unlocked ? rarityColor.border : undefined,
        }}>
        <span className={styles.badgeIcon}>{achievement.icon}</span>
      </div>
    );
  }

  return (
    <div
      className={`${styles.badgeCard} ${achievement.unlocked ? styles.badgeUnlocked : styles.badgeLocked}`}
      style={{
        borderColor: achievement.unlocked ? rarityColor.border : undefined,
      }}>
      <div className={styles.badgeIconContainer}>
        <span
          className={styles.badgeIcon}
          style={{
            background: achievement.unlocked ? rarityColor.bg : undefined,
          }}>
          {achievement.icon}
        </span>
        {achievement.unlocked && (
          <span className={styles.badgeCheck}>✓</span>
        )}
      </div>

      <div className={styles.badgeInfo}>
        <h4 className={styles.badgeName}>{achievement.name}</h4>
        <p className={styles.badgeDescription}>{achievement.description}</p>
        <div className={styles.badgeMeta}>
          <span
            className={styles.badgeRarity}
            style={{color: rarityColor.bg}}>
            {achievement.rarity}
          </span>
          {achievement.unlocked && achievement.unlockedAt && (
            <span className={styles.badgeDate}>
              {new Date(achievement.unlockedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {!achievement.unlocked && (
        <div className={styles.badgeLockedOverlay}>
          <span className={styles.badgeLockIcon}>🔒</span>
        </div>
      )}
    </div>
  );
}
