import React, {type ReactNode} from 'react';
import OriginalMDXComponents from '@theme-original/MDXComponents';
import RunnableCell from '@site/src/components/RunnableCell';

/**
 * "Trail" MDX wiring: every fenced python code block in the docs becomes a
 * RunnableCell — still rendered as highlighted code on build (SSG), but alive
 * in the browser: Run runs it through Pyodide inline, Predict first earns
 * Engage XP, and it expands to a fullscreen editor on phones.
 *
 * Everything that is not a python fence is passed through to the original
 * theme components untouched.
 */

function isPythonFence(node: ReactNode): node is React.ReactElement<{className?: unknown; children?: ReactNode}> {
  if (!React.isValidElement(node)) return false;
  const className = (node.props as {className?: unknown}).className;
  if (typeof className !== 'string') return false;
  return /(^|\s)language-(python|py)(\s|$)/.test(className);
}

function childrenToText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(childrenToText).join('');
  if (React.isValidElement(node)) {
    return childrenToText((node.props as {children?: ReactNode}).children);
  }
  return '';
}

export default {
  ...OriginalMDXComponents,
  pre: (preProps: {children?: ReactNode}) => {
    const children = preProps.children;
    const codeChild = Array.isArray(children)
      ? children.find(isPythonFence)
      : isPythonFence(children)
        ? children
        : null;
    if (codeChild) {
      return (
        <RunnableCell code={childrenToText((codeChild.props as {children?: ReactNode}).children)} />
      );
    }
    // Original MDXPre simply forwards its children — keep that behavior.
    return children;
  },
};