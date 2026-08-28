import React, {useCallback, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import Translate from '@docusaurus/Translate';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import CodeBlock from '@theme/CodeBlock';
import {usePyodideRunner} from '@site/src/hooks/usePyodideRunner';
import {useTerminalOutput} from '@site/src/hooks/useTerminalOutput';
import {useXp} from '@site/src/hooks/useXp';
import {useErrorHistory, countErrorsForWeek, STUCK_THRESHOLD} from '@site/src/hooks/useErrorHistory';
import styles from './styles.module.css';
import './teaching-flash.css';

interface Props {
  code: string;
}

/**
 * "Trail" inline runnable Python cell.
 *
 * The lesson's code blocks become living elements: read the paragraph, run the
 * cell right where it sits (Pyodide WASM in the browser), watch output stream
 * inline, and — when you want — predict the output first and earn Engage XP
 * instead of just XP for running.
 */
export default function RunnableCell({code}: Props): React.JSX.Element {
  const {frontMatter} = useDoc();
  const courseFrontMatter = frontMatter as {
    section?: string;
    track?: string;
    week?: number;
  };
  const weekId = useMemo(() => {
    const {section, track, week} = courseFrontMatter;
    if (section && track && week != null) {
      return `${section}-${track}-week-${week}`;
    }
    return null;
  }, [courseFrontMatter]);

  const {lines, append, clear, scrollRef} = useTerminalOutput();
  const runningCodeRef = useRef(code);
  const outRef = useRef<string[]>([]);
  const errRef = useRef<string[]>([]);
  const errHeadlineRef = useRef<string | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const [predictionOpen, setPredictionOpen] = useState(false);
  const [prediction, setPrediction] = useState('');
  const [predictionResult, setPredictionResult] = useState<'correct' | 'wrong' | null>(null);
  const [bonus, setBonus] = useState<string | null>(null);
  const bonusTimer = useRef<number | null>(null);
  const flashBonus = (text: string) => {
    setBonus(text);
    if (bonusTimer.current) window.clearTimeout(bonusTimer.current);
    bonusTimer.current = window.setTimeout(() => setBonus(null), 1100);
  };
  const [actualText, setActualText] = useState('');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [draft, setDraft] = useState(code);
  const [stdinBlocked, setStdinBlocked] = useState(false);
  const [hasError, setHasError] = useState(false);

  const {addXp} = useXp();
  const {errors, recordError} = useErrorHistory();

  const handleOutput = useCallback(
    (line: {id: number; kind: 'cmd' | 'out' | 'err' | 'info' | 'hint' | 'success'; text: string}) => {
      append(line);
      if (line.kind === 'out') {
        outRef.current.push(line.text);
      }
      if (line.kind === 'err') {
        errRef.current.push(line.text);
        // Pyodide streams the traceback into stderr across several chunks, so
        // keep the last "SomeError: …" headline as the recordable message.
        for (const l of line.text.split('\n')) {
          if (/^[\w.]+Error:/.test(l.trim()) || /^[\w.]+Exception:/.test(l.trim())) {
            errHeadlineRef.current = l.trim().slice(0, 200);
          }
        }
      }
    },
    [append],
  );

  const getCode = useCallback(() => runningCodeRef.current, []);

  const {busy, loadingProgress, run} = usePyodideRunner({
    getCode,
    onOutput: handleOutput,
    commandLabel: '$ python',
  });

  const predicted = prediction.trim();

  const handleRun = useCallback(
    async (src?: string) => {
      const isEdit = typeof src === 'string';
      const target = isEdit ? src : runningCodeRef.current;
      if (/\binput\(/.test(target)) {
        setStdinBlocked(true);
        return;
      }
      setStdinBlocked(false);
      runningCodeRef.current = target;
      setOverlayOpen(false);
      setPredictionResult(null);
      outRef.current = [];
      errRef.current = [];
      errHeadlineRef.current = null;
      setHasError(false);
      const ok = await run();
      if (isEdit) {
        runningCodeRef.current = code;
      }
      if (!ok) {
        const message =
          errHeadlineRef.current ?? errRef.current.join('\n').trim() ?? 'Unknown error';
        if (weekId && message) recordError(message, weekId);
        setHasError(true);
        return;
      }
      addXp(5, 'Run cell');
      flashBonus('+5 XP');
      if (predicted) {
        const actual = outRef.current.join('\n').trim();
        const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
        const correct = normalize(predicted) === normalize(actual);
        setActualText(actual);
        setPredictionResult(correct ? 'correct' : 'wrong');
        if (correct) {
          addXp(10, 'Correct prediction');
          flashBonus('+15 XP');
        }
      }
    },
    [run, predicted, addXp, code, weekId, recordError],
  );

  const openOverlay = useCallback(() => {
    setDraft(runningCodeRef.current);
    setOverlayOpen(true);
  }, []);

  /** Scrolls to the nearest teaching paragraph/heading above this cell and flashes it. */
  const focusTeaching = useCallback(() => {
    const cell = cellRef.current;
    const container = cell?.closest('.theme-doc-markdown') as HTMLElement | null;
    const candidates = container
      ? Array.from(container.querySelectorAll<HTMLElement>('h2, h3, h4, p'))
      : [];
    const cellTop = cell?.getBoundingClientRect().top ?? 0;
    const above = candidates.filter((el) => el.getBoundingClientRect().top < cellTop - 4);
    const nearestHeading = [...above].reverse().find((el) => /^H[1-4]$/.test(el.tagName));
    const pick = nearestHeading ?? above[above.length - 1];
    if (!pick) return;
    pick.scrollIntoView({behavior: 'smooth', block: 'center'});
    pick.classList.remove('runnable-cell__teaching-flash');
    void pick.offsetWidth;
    pick.classList.add('runnable-cell__teaching-flash');
    window.setTimeout(() => pick.classList.remove('runnable-cell__teaching-flash'), 2600);
  }, []);

  const stuckCount = useMemo(
    () => (weekId ? countErrorsForWeek(errors, weekId) : 0),
    [errors, weekId],
  );
  const stuckQuery = useMemo(() => {
    const weekMsgs = errors
      .filter((e) => e.weekId === weekId)
      .map((e) => e.message)
      .slice(0, 3);
    return encodeURIComponent([...new Set(weekMsgs)].join(' '));
  }, [errors, weekId]);

  const lineClass = (kind: string) =>
    kind === 'cmd'
      ? styles.lineCmd
      : kind === 'out'
        ? styles.lineOut
        : kind === 'err'
          ? styles.lineErr
          : kind === 'hint'
            ? styles.lineHint
            : kind === 'success'
              ? styles.lineSuccess
              : styles.lineInfo;

  return (
    <div className={styles.cell} data-testid="runnable-cell" ref={cellRef}>
      {bonus !== null && (
        <span className={styles.bonus} role="status">
          {bonus}
        </span>
      )}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.run}
          disabled={busy}
          onClick={() => void handleRun()}
          aria-label="Run this Python code">
          <span aria-hidden="true">▶</span>{' '}
          <Translate id="runnablecell.run">Run</Translate>
        </button>
        <span className={styles.lang}>python</span>
        <span className="runnable-cell__spacer" aria-hidden="true" />
        <button
          type="button"
          className={styles.predictToggle}
          aria-pressed={predictionOpen}
          onClick={() => setPredictionOpen((o) => !o)}>
          <span aria-hidden="true">🤔</span>{' '}
          <Translate id="runnablecell.predict">Predict</Translate>
        </button>
        <button
          type="button"
          className={styles.expand}
          onClick={openOverlay}
          aria-label="Edit and run this code">
          <span aria-hidden="true">⛶</span>
        </button>
      </div>

      <CodeBlock language="python">{code}</CodeBlock>

      {stdinBlocked && (
        <div className={`${styles.feedback} ${styles.feedbackSurprise}`} role="status">
          <Translate id="runnablecell.stdinBlocked">
            This example waits for typed input (input()), which the in-browser sandbox can't supply yet — skip it, or edit the code to remove the input() line.
          </Translate>
        </div>
      )}

      {predictionOpen && predictionResult === null && (
        <form
          className={styles.predict}
          onSubmit={(e) => {
            e.preventDefault();
            void handleRun();
          }}>
          <label className={styles.predictLabel} htmlFor={`predict-${code.slice(0, 8)}`}>
            <Translate id="runnablecell.predictLabel">What do you think this code will print?</Translate>
          </label>
          <div className={styles.predictRow}>
            <input
              id={`predict-${code.slice(0, 8)}`}
              className={styles.predictInput}
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              placeholder="Type your guess, then run…"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className={styles.check} disabled={busy}>
              <Translate id="runnablecell.runAndCheck">Run &amp; check</Translate>
            </button>
          </div>
        </form>
      )}

      {predictionResult === 'correct' && (
        <div className={`${styles.feedback} ${styles.feedbackCorrect}`} role="status">
          <Translate id="runnablecell.correct">🎯 Your prediction was right. You've got this!</Translate>
        </div>
      )}
      {predictionResult === 'wrong' && (
        <div className={`${styles.feedback} ${styles.feedbackSurprise}`} role="status">
          <Translate id="runnablecell.surpriseTitle">Surprise!</Translate>{' '}
          <Translate id="runnablecell.surpriseBody" values={{actual: actualText}}>
            {'The code actually printed "{actual}". If that differs from your guess, re-read the paragraph just above — that surprise *is* the lesson.'}
          </Translate>
        </div>
      )}

      {hasError && (
        <div className={styles.stuck} role="status">
          <p className={styles.stuckTitle}>
            <Translate id="runnablecell.stuckTitle">Still red? That's normal.</Translate>
          </p>
          <p className={styles.stuckBody}>
            <Translate id="runnablecell.stuckBody">
              The hint under the red line above names the exact mistake — and the teaching paragraph right above this code explains how to fix it.
            </Translate>
          </p>
          <div className={styles.stuckActions}>
            <button type="button" className={styles.reread} onClick={focusTeaching}>
              <Translate id="runnablecell.reread">Re-read the teaching paragraph ↑</Translate>
            </button>
            {stuckCount >= STUCK_THRESHOLD && (
              <>
                <a
                  className={styles.stuckLink}
                  href={`https://www.google.com/search?q=${stuckQuery} python`}
                  target="_blank"
                  rel="noopener noreferrer">
                  <Translate id="runnablecell.search">Search this error</Translate>
                </a>
                <a
                  className={styles.stuckLink}
                  href="https://github.com/abderrahim-lectures/python-data-analysis-course/discussions"
                  target="_blank"
                  rel="noopener noreferrer">
                  <Translate id="runnablecell.ask">Ask for help</Translate>
                </a>
              </>
            )}
          </div>
        </div>
      )}

      {(lines.length > 0 || busy) && (
        <div className={styles.output} ref={scrollRef} data-testid="runnable-cell-output">
          {lines.map((l) => (
            <div key={l.id} className={lineClass(l.kind)}>
              {l.kind === 'cmd' ? <span className={styles.prompt} aria-hidden="true">❯ </span> : null}
              {l.text}
            </div>
          ))}
          {busy && (
            <div className={styles.lineInfo}>
              <span className={styles.spinner} aria-hidden="true" />
              {loadingProgress < 100 ? (
                <Translate id="runnablecell.booting" values={{progress: loadingProgress}}>
                  {'Booting Python… {progress}%'}
                </Translate>
              ) : (
                <Translate id="runnablecell.running">Running…</Translate>
              )}
            </div>
          )}
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              clear();
            }}
            aria-label="Clear cell output">
            <Translate id="runnablecell.clear">Clear</Translate>
          </button>
        </div>
      )}

      {overlayOpen &&
        createPortal(
          <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Python editor">
            <div className={styles.overlayPanel}>
              <div className={styles.overlayHeader}>
                <span className={styles.overlayTitle}>
                  <Translate id="runnablecell.editorTitle">Edit &amp; run</Translate>
                </span>
                <button
                  type="button"
                  className={styles.overlayClose}
                  onClick={() => setOverlayOpen(false)}
                  aria-label="Close editor">
                  ✕
                </button>
              </div>
              <textarea
                className={styles.overlayTextarea}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                autoFocus
                aria-label="Python code"
              />
              <div className={styles.overlayFooter}>
                <button
                  type="button"
                  className={styles.reset}
                  onClick={() => setDraft(code)}
                  disabled={draft === code}>
                  <Translate id="runnablecell.reset">Reset to lesson code</Translate>
                </button>
                <button
                  type="button"
                  className={styles.run}
                  disabled={busy}
                  onClick={() => void handleRun(draft)}>
                  <span aria-hidden="true">▶</span>{' '}
                  <Translate id="runnablecell.runEdited">Run</Translate>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}