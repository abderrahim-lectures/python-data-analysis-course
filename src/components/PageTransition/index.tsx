import React, {useEffect, useRef, useState, type ReactNode} from 'react';
import {useLocation} from '@docusaurus/router';
import styles from './styles.module.css';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Fades page content in on client-side route changes. The very first paint
 * (SSR + first client render) stays visible — no transition on load — so
 * static HTML is never hidden from crawlers or flash-of-invisible-content.
 * prefers-reduced-motion turns the animation off entirely (see CSS).
 */
export default function PageTransition({children}: PageTransitionProps): React.JSX.Element {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 60);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className={`${styles.transition} ${isVisible ? styles.visible : ''}`}>
      {children}
    </div>
  );
}