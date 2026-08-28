import React from 'react';
import styles from './styles.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

/**
 * Skeleton loading placeholder for content that is loading.
 * Shows a shimmer animation to indicate loading state.
 */
export default function Skeleton({
  width,
  height,
  variant = 'text',
  className,
}: SkeletonProps): React.JSX.Element {
  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className || ''}`}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '100px'),
      }}
      aria-hidden="true"
    />
  );
}
