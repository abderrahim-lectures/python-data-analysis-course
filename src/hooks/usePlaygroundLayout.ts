import {useState, useEffect, useCallback} from 'react';

/**
 * Manages the advanced editor panel layout state including open/closed toggle
 * and the CSS body attribute for layout reflow.
 *
 * Since the "Trail" inline cells became the primary way to run code in lessons,
 * the VS Code dock starts closed (full-width reading); it remains available as
 * the advanced editor / notebook escape hatch when the student opts in.
 */
export function usePlaygroundLayout() {
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    document.body.dataset.vscOpen = open ? '1' : '0';
    return () => {
      delete document.body.dataset.vscOpen;
    };
  }, [open]);

  const toggleOpen = useCallback(() => setOpen((o) => !o), []);

  return {open, setOpen, toggleOpen};
}
