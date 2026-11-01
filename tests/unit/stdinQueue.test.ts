import {describe, expect, test} from 'vitest';
import {stdinQueue} from '../../src/lib/stdinQueue.ts';

function harness(values: string[]) {
  const echoed: string[] = [];
  let ends = 0;
  const q = stdinQueue(values, {onValue: (v) => echoed.push(v), onEnd: () => ends++});
  return {q, echoed, ends: () => ends};
}

describe('the worker stdin queue', () => {
  test('hands input() the values in the order the learner typed them', () => {
    const {q, echoed} = harness(['Amina', '2004']);
    expect(q.read()).toBe('Amina');
    expect(q.read()).toBe('2004');
    expect(echoed).toEqual(['Amina', '2004']);
    expect(q.read()).toBeUndefined(); // drained
  });

  test('an empty answer is a value, not end-of-file', () => {
    const {q, echoed, ends} = harness(['']);
    expect(q.read()).toBe('');
    expect(echoed).toEqual(['']);
    expect(ends()).toBe(0);
  });

  test('running dry is EOF, and it is announced once', () => {
    const {q, echoed, ends} = harness([]);
    expect(q.read()).toBeUndefined();
    // A cell that swallows EOFError and asks again must not grow the form
    // forever, and EOF is never echoed as if the learner had typed it.
    expect(q.read()).toBeUndefined();
    expect(q.read()).toBeUndefined();
    expect(ends()).toBe(1);
    expect(echoed).toEqual([]);
  });

  test('a second run can replay the same values (a re-run keeps the fields)', () => {
    const first = harness(['7']);
    expect(first.q.read()).toBe('7');
    const second = harness(['7']);
    expect(second.q.read()).toBe('7');
    expect(second.q.read()).toBeUndefined();
  });
});
