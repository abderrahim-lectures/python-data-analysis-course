import {useState, useCallback, useEffect, useRef} from 'react';

interface TerminalLine {
  id: number;
  kind: 'cmd' | 'out' | 'err' | 'info' | 'hint' | 'success';
  text: string;
}

/**
 * Manages terminal output lines with auto-scroll functionality.
 */
export function useTerminalOutput() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineIdRef = useRef(0);

  const append = useCallback((line: Omit<TerminalLine, 'id'>) => {
    setLines((prev) => [...prev, {id: ++lineIdRef.current, ...line}]);
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);
  const expand = useCallback(() => setCollapsed(false), []);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lines, collapsed]);

  return {lines, collapsed, toggleCollapsed, expand, append, clear, scrollRef};
}
