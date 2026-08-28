import React from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import styles from './styles.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  {path: '/', label: 'Home', icon: '🏠'},
  {path: '/docs/python-101', label: 'Python', icon: '🐍'},
  {path: '/docs/data-analysis', label: 'Data', icon: '📊'},
  {path: '/progress', label: 'Progress', icon: '📈'},
];

/**
 * Mobile bottom navigation bar for quick access to main sections.
 * Only visible on mobile devices.
 */
export default function MobileBottomNav(): React.JSX.Element | null {
  const location = useLocation();

  return (
    <nav className={styles.bottomNav} aria-label="Mobile navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            aria-current={isActive ? 'page' : undefined}>
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
