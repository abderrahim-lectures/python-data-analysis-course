import React from 'react';
import clsx from 'clsx';
import {useLocation} from '@docusaurus/router';
import {NavbarSecondaryMenuFiller} from '@docusaurus/theme-common/internal';
import {ThemeClassNames} from '@docusaurus/theme-common';
import SidebarLayout from '@theme-original/DocRoot/Layout/Sidebar';
import type SidebarLayoutType from '@theme/DocRoot/Layout/Sidebar';
import TrailRail, {parseLessonPath} from '@site/src/components/TrailRail';
import styles from './styles.module.css';

type Props = React.ComponentProps<typeof SidebarLayoutType>;

function TrailRailNav() {
  return <TrailRail />;
}

function TrailRailMobile() {
  return <NavbarSecondaryMenuFiller component={TrailRailNav} props={{}} />;
}

/**
 * On lesson pages (.../docs/<section>/<track>/week-N) the docs tree sidebar is
 * replaced by the compact trail rail — the week-map the Trail concept calls
 * for. Every other doc keeps the standard Docusaurus sidebar untouched.
 */
export default function SidebarWrapper(
  props: Props & {hiddenSidebarContainer: boolean},
): React.JSX.Element {
  const {pathname} = useLocation();
  const isLesson = parseLessonPath(pathname) !== null;

  if (!isLesson) {
    return <SidebarLayout {...props} />;
  }

  return (
    <aside
      className={clsx(
        ThemeClassNames.docs.docSidebarContainer,
        styles.docSidebarContainer,
      )}>
      <div className={styles.sidebarViewport}>
        <TrailRail />
      </div>
      <TrailRailMobile />
    </aside>
  );
}