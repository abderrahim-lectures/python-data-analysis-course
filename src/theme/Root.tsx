import React, {type ReactNode} from 'react';
import {UiModeProvider} from '@site/src/context/UiModeContext';
import {CurrentDocProvider} from '@site/src/context/CurrentDocContext';
import UiModeBodyAttribute from '@site/src/theme/Root/UiModeBodyAttribute';
import PlaygroundFab from '@site/src/components/PlaygroundFab';
import LearningStylePicker from '@site/src/components/LearningStylePicker';
import ModeToggle from '@site/src/components/ModeToggle';
import WelcomeBackBanner from '@site/src/components/WelcomeBackBanner';
import BadgeToast from '@site/src/components/BadgeCase/BadgeToast';
import CourseCompletionWatcher from '@site/src/components/BadgeCase/CourseCompletionWatcher';

// Swizzled Root: mounts context providers and the global, always-present UI
// (FAB, onboarding, mode toggle, welcome-back nudge, badge toast) that need
// to be on every page regardless of which doc is being viewed.
export default function Root({children}: {children: ReactNode}): React.JSX.Element {
  return (
    <UiModeProvider>
      <CurrentDocProvider>
        <UiModeBodyAttribute />
        <CourseCompletionWatcher />
        <WelcomeBackBanner />
        {children}
        <PlaygroundFab />
        <LearningStylePicker />
        <ModeToggle />
        <BadgeToast />
      </CurrentDocProvider>
    </UiModeProvider>
  );
}
