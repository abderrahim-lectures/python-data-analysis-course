import React, {useState, useEffect} from 'react';
import styles from './styles.module.css';

/**
 * Back to top button that appears when user scrolls down.
 */
export default function BackToTop(): React.JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      className={styles.button}
      onClick={scrollToTop}
      aria-label="Back to top">
      ↑
    </button>
  );
}
