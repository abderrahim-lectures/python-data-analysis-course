import React, {type ReactNode} from 'react';
import {UiModeProvider} from '@site/src/context/UiModeContext';
import {CurrentDocProvider} from '@site/src/context/CurrentDocContext';
import UiModeBodyAttribute from '@site/src/theme/Root/UiModeBodyAttribute';
import LocaleRedirect from '@site/src/theme/Root/LocaleRedirect';
import AutoLocaleRedirectBanner from '@site/src/components/AutoLocaleRedirectBanner';
import VsCodePlayground from '@site/src/components/VsCodePlayground';
import LearningStylePicker from '@site/src/components/LearningStylePicker';
import WelcomeBackBanner from '@site/src/components/WelcomeBackBanner';
import BadgeToast from '@site/src/components/BadgeCase/BadgeToast';
import CourseCompletionWatcher from '@site/src/components/BadgeCase/CourseCompletionWatcher';
import MobileBottomNav from '@site/src/components/MobileBottomNav';
import PageTransition from '@site/src/components/PageTransition';

// Swizzled Root: mounts context providers and the global, always-present UI
// (onboarding, welcome-back nudge, badge toast, mobile nav) that need
// to be on every page regardless of which doc is being viewed.
export default function Root({children}: {children: ReactNode}): React.JSX.Element {
  return (
    <UiModeProvider>
      <CurrentDocProvider>
        <UiModeBodyAttribute />
        <LocaleRedirect />
        <AutoLocaleRedirectBanner />
        <CourseCompletionWatcher />
        <WelcomeBackBanner />
        <PageTransition>{children}</PageTransition>
        <VsCodePlayground />
        <LearningStylePicker />
        <BadgeToast />
        <MobileBottomNav />
      </CurrentDocProvider>
    </UiModeProvider>
  );
}
