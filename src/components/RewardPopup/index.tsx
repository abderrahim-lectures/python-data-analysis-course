import React, {useEffect, useState, useCallback} from 'react';
import styles from './styles.module.css';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

interface Props {
  show: boolean;
  type: 'xp' | 'achievement' | 'levelup' | 'streak';
  title: string;
  subtitle?: string;
  icon?: string;
  xpAmount?: number;
  onDismiss: () => void;
}

const CONFETTI_COLORS = ['#5b3df5', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

/**
 * Celebration popup with confetti animation for achievements and rewards.
 * Inspired by Duolingo's celebration animations.
 */
export default function RewardPopup({
  show,
  type,
  title,
  subtitle,
  icon,
  xpAmount,
  onDismiss,
}: Props): React.JSX.Element | null {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      // Generate confetti pieces
      const pieces: ConfettiPiece[] = Array.from({length: 50}, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 2,
        size: 8 + Math.random() * 12,
      }));
      setConfetti(pieces);

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        onDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  const handleDismiss = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => onDismiss(), 300);
  }, [onDismiss]);

  if (!show) return null;

  const icons = {
    xp: '⭐',
    achievement: '🏆',
    levelup: '🎉',
    streak: '🔥',
  };

  return (
    <div className={styles.overlay} onClick={handleDismiss}>
      {/* Confetti */}
      <div className={styles.confettiContainer}>
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className={styles.confettiPiece}
            style={{
              left: `${piece.x}%`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Reward Card */}
      <div
        className={`${styles.rewardCard} ${styles[`reward-${type}`]} ${
          isAnimating ? styles.rewardEnter : styles.rewardExit
        }`}
        onClick={(e) => e.stopPropagation()}>
        <div className={styles.rewardIcon}>
          {icon || icons[type]}
        </div>

        <h3 className={styles.rewardTitle}>{title}</h3>
        
        {subtitle && (
          <p className={styles.rewardSubtitle}>{subtitle}</p>
        )}

        {xpAmount && (
          <div className={styles.xpBadge}>
            <span className={styles.xpIcon}>⭐</span>
            <span className={styles.xpAmount}>+{xpAmount} XP</span>
          </div>
        )}

        <button
          type="button"
          className={styles.rewardButton}
          onClick={handleDismiss}>
          Continue
        </button>
      </div>
    </div>
  );
}
