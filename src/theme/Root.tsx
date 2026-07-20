import React, {type ReactNode} from 'react';
import {UiModeProvider} from '@site/src/context/UiModeContext';
import UiModeBodyAttribute from '@site/src/theme/Root/UiModeBodyAttribute';

// Swizzled Root: mounts context providers that need to wrap every page.
// The FAB itself is added here too once it exists (see PlaygroundFab issue).
export default function Root({children}: {children: ReactNode}): React.JSX.Element {
  return (
    <UiModeProvider>
      <UiModeBodyAttribute />
      {children}
    </UiModeProvider>
  );
}
