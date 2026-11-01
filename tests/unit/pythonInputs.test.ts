import {describe, expect, test} from 'vitest';
import {inputCallSites} from '../../src/lib/pythonInputs.ts';

const prompts = (src: string) => inputCallSites(src).map((s) => s.prompt);
const needsStdin = (src: string) => inputCallSites(src).length > 0;

describe('input() call sites', () => {
  test('finds a call with a literal prompt', () => {
    expect(prompts('year_text = input("Birth year? ")')).toEqual(['Birth year?']);
    expect(prompts("name = input('Your name: ')")).toEqual(['Your name:']);
  });

  test('a call without a prompt still needs a value', () => {
    expect(prompts('x = int(input())')).toEqual(['']);
    expect(needsStdin('x = int(input())')).toBe(true);
  });

  test('reports every call in source order', () => {
    const src = 'name = input("Name: ")\nyear = int(input("Year: "))\nprint(name, year)';
    expect(prompts(src)).toEqual(['Name:', 'Year:']);
  });

  test('a call inside a loop or function is still a call site', () => {
    expect(prompts('while True:\n    word = input("Start word: ")\n    if not word:\n        break')).toEqual([
      'Start word:',
    ]);
    // An interpolated prompt has no static text to label the field with.
    expect(prompts('def ask():\n    return input(f"{label}: ")')).toEqual(['']);
    expect(prompts('x = input(r"Raw: ")')).toEqual(['Raw:']);
  });

  test('tolerates whitespace between the name and the parenthesis', () => {
    expect(prompts('x = input ("Age? ")')).toEqual(['Age?']);
    expect(prompts('x = input(\n    "Age? "\n)')).toEqual(['Age?']);
  });

  test('recognises one- and two-letter string prefixes', () => {
    expect(prompts('x = input(r"Raw: ")')).toEqual(['Raw:']);
    expect(prompts('x = input(rb"Bytes: ")')).toEqual(['Bytes:']);
    expect(prompts("x = input(R'Upper: ')")).toEqual(['Upper:']);
  });

  test('decodes the escapes a learner would actually type', () => {
    expect(prompts('x = input("Line\\nOne")')).toEqual(['Line One']);
    expect(prompts("x = input('It\\'s here')")).toEqual(["It's here"]);
  });
});

describe('what is not a call site', () => {
  test('a mention in a comment or a string is prose, not a call', () => {
    expect(needsStdin('# input("Name? ") asks for a name')).toBe(false);
    expect(needsStdin('print("call input() to read a line")')).toBe(false);
    expect(needsStdin('msg = """input("x")"""')).toBe(false);
  });

  test('identifiers that merely contain "input" are not calls', () => {
    expect(needsStdin('user_input = 5')).toBe(false);
    expect(needsStdin('def get_input(): pass')).toBe(false);
    expect(needsStdin('my_input("x")')).toBe(false);
    expect(needsStdin('form.input("x")')).toBe(false);
  });

  test('the constant lesson cells need no values', () => {
    expect(needsStdin('print(int(3.9))')).toBe(false);
    expect(needsStdin('import math\nprint(math.floor(-3.9))')).toBe(false);
  });
});
