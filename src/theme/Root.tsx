import React, {type ReactNode} from 'react';
import {UiModeProvider} from '@site/src/context/UiModeContext';
import {CurrentDocProvider} from '@site/src/context/CurrentDocContext';
import UiModeBodyAttribute from '@site/src/theme/Root/UiModeBodyAttribute';
import PlaygroundFab from '@site/src/components/PlaygroundFab';
import LearningStylePicker from '@site/src/components/LearningStylePicker';

// Swizzled Root: mounts context providers and the global FAB/onboarding that
// need to be present on every page.
export default function Root({children}: {children: ReactNode}): React.JSX.Element {
  return (
    <UiModeProvider>
      <CurrentDocProvider>
        <UiModeBodyAttribute />
        {children}
        <PlaygroundFab />
        <LearningStylePicker />
      </CurrentDocProvider>
    </UiModeProvider>
  );
}
