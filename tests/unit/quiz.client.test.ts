import {beforeEach, describe, expect, test, vi} from 'vitest';
import {el, fakeEl, stubDom} from './_domstub.ts';
import {initQuizzes} from '../../src/lib/quiz.client.ts';
import {getQuizProgress, loadState} from '../../src/lib/gameState.ts';

function seedLocalStorage() {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
    key: () => null,
    length: Object.keys(store).length,
  };
}

function quizFixture() {
  const stub = stubDom();

  const q1 = fakeEl('q1'); q1.dataset.answer = '0';
  const q2 = fakeEl('q2'); q2.dataset.answer = '1';

  const mkOpt = () => fakeEl('opt');
  const q1opts = [mkOpt(), mkOpt()];
  const q2opts = [mkOpt(), mkOpt()];
  q1.querySelectorAllFor['.quiz-q__opt'] = q1opts;
  q2.querySelectorAllFor['.quiz-q__opt'] = q2opts;
  const fb1 = fakeEl('fb1'); fb1.hidden = true;
  const fb2 = fakeEl('fb2'); fb2.hidden = true;
  q1.querySelectorFor['.quiz-q__feedback'] = fb1;
  q2.querySelectorFor['.quiz-q__feedback'] = fb2;

  const summary = fakeEl('summary');
  summary.hidden = true;

  const quiz = fakeEl('quiz') as any;
  quiz.querySelectorAllFor['.quiz-q'] = [q1, q2];
  quiz.querySelectorFor['.quiz-q[data-answer]'] = q1;
  quiz.querySelectorFor['[data-quiz-summary]'] = summary;

  stub.queryAll['[data-quiz]'] = [quiz];

  return {stub, quiz, q1, q2, q1opts, q2opts, fb1, fb2, summary};
}

beforeEach(() => {
  vi.unstubAllGlobals();
  seedLocalStorage();
});

describe('initQuizzes', () => {
  test('records correct/wrong answers and writes the summary', async () => {
    const {q1, q2, q1opts, q2opts, summary, fb1} = quizFixture();
    initQuizzes();

    await q1opts[0].listeners.click();   // q1 correct (answer idx 0)
    await q2opts[0].listeners.click();   // q2 wrong (answer idx 1)

    expect(q1.classList.has('quiz-q--answered')).toBe(true);
    expect(q1opts[0].classSet.has('quiz-q__opt--correct')).toBe(true);
    expect(fb1.hidden).toBe(false);
    expect(fb1.textContent).toContain('Correct');

    expect(q2opts[0].classSet.has('quiz-q__opt--wrong')).toBe(true);
    expect(q2opts[1].classSet.has('quiz-q__opt--correct')).toBe(true);

    expect(summary.hidden).toBe(false);
    expect(summary.textContent).toBe('You got 1/2 right.');

    const p = getQuizProgress();
    expect(p.total).toBe(2);
    expect(p.correct).toBe(1);
  });

  test('already-answered questions ignore further clicks', async () => {
    const {q1, q1opts, fb1} = quizFixture();
    initQuizzes();
    await q1opts[0].listeners.click();
    await q1opts[1].listeners.click();
    expect(q1opts[1].classSet.has('quiz-q__opt--wrong')).toBe(false);
    expect(fb1.textContent).toContain('Correct');
    expect(getQuizProgress().total).toBe(1);
  });

  test('records into gameState so progress stats are real', async () => {
    seedLocalStorage();
    const {q1, q2, q1opts, q2opts} = quizFixture();
    expect(loadState().quizTotal).toBe(0);
    initQuizzes();
    await q2opts[1].listeners.click(); // correct
    await q1opts[0].listeners.click(); // correct
    const s = loadState();
    expect(s.quizTotal).toBe(2);
    expect(s.quizCorrect).toBe(2);
  });

  test('hydrated quizzes are not re-initialized', () => {
    const {quiz, q1opts} = quizFixture();
    quiz.dataset['data-hydrated'] = '1';
    initQuizzes();
    expect(q1opts[0].listeners.click).toBeUndefined();
  });

  test('auto-hydrates quizzes on DOMContentLoaded', async () => {
    vi.resetModules();
    const {stub, quiz, q1opts} = quizFixture();
    await import('../../src/lib/quiz.client.ts');
    expect(stub.listeners['DOMContentLoaded']).toBeDefined();
    stub.listeners['DOMContentLoaded']();
    expect(quiz.dataset['data-hydrated']).toBe('1');
    expect(q1opts[0].listeners.click).toBeDefined();
  });
});