import {describe, expect, test} from 'vitest';
import {
  DATASET_FILE_RE,
  normalizeDatasetName,
  planDatasetMounts,
  uniqueRefsFromSource,
} from '../../src/lib/datasetMount';
import {friendlyError} from '../../src/lib/friendlyError';

const MANIFEST: Record<string, string> = {
  titaniccsv: 'titanic.csv',
  studentsperformancecsv: 'students-performance.csv',
  slmcorpuscsv: 'slm-corpus.csv',
  salescsv: 'sales.csv',
};

describe('normalizeDatasetName', () => {
  test.each([
    ['StudentsPerformance.csv', 'studentsperformancecsv'],
    ['students-performance.csv', 'studentsperformancecsv'],
    ['titanic.csv', 'titaniccsv'],
    ['sales.csv', 'salescsv'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeDatasetName(input)).toBe(expected);
  });
});

describe('uniqueRefsFromSource', () => {
  test('extracts names from the open/read_csv family with both quote styles', () => {
    const src = `
      df = pd.read_csv("titanic.csv")
      f = open('slm-corpus.csv')
      r = pd.read_excel("sales.xlsx")
      j = np.loadtxt('points.csv')
    `;
    expect(uniqueRefsFromSource(src).sort()).toEqual(
      ['slm-corpus.csv', 'sales.xlsx', 'titanic.csv', 'points.csv'].sort(),
    );
  });

  test('captures a multi-line call with trailing newline argument', () => {
    const src = `pd.read_csv('data.csv', newline='')`;
    expect(uniqueRefsFromSource(src)).toEqual(['data.csv']);
  });

  test('strips directory prefixes and deduplicates', () => {
    const src = `
      pd.read_csv("data/titanic.csv")
      pd.read_csv('titanic.csv')
      open('Titanic.CSV')
    `;
    // Case differs, so the strings differ — this is a reference-level dedupe.
    expect(uniqueRefsFromSource(src)).toEqual(['titanic.csv', 'Titanic.CSV']);
  });

  test('a bare string mentioning read_csv still extracts (mount filter rejects unknowns)', () => {
    expect(uniqueRefsFromSource(`print("read_csv('x.csv')")`)).toEqual(['x.csv']);
    expect(uniqueRefsFromSource(`df.to_csv("out.csv")`)).toEqual([]);
  });

  test('empty source → empty list', () => {
    expect(uniqueRefsFromSource('')).toEqual([]);
  });
});

describe('planDatasetMounts', () => {
  test('maps references to normalized shipped filenames', () => {
    const src = `
      pd.read_csv("StudentsPerformance.csv")
      open('slm-corpus.csv')
    `;
    expect(planDatasetMounts(src, MANIFEST)).toEqual(
      expect.arrayContaining([
        {ref: 'StudentsPerformance.csv', shipped: 'students-performance.csv'},
        {ref: 'slm-corpus.csv', shipped: 'slm-corpus.csv'},
      ]),
    );
  });

  test('skips references absent from the manifest', () => {
    const src = `pd.read_csv("missing.csv")`;
    expect(planDatasetMounts(src, MANIFEST)).toEqual([]);
  });

  test('null manifest → no plan', () => {
    expect(planDatasetMounts(`pd.read_csv("titanic.csv")`, null)).toEqual([]);
  });

  test('deduplicates the same shipped file across references', () => {
    const src = `
      pd.read_csv("Titanic.csv")
      pd.read_csv("titanic.csv")
    `;
    const plan = planDatasetMounts(src, MANIFEST);
    expect(plan.filter((p) => p.shipped === 'titanic.csv')).toHaveLength(1);
  });
});

describe('friendlyError', () => {
  const cases: [string, RegExp][] = [
    ['  File "<exec>", line 2\nSyntaxError: invalid syntax', /Python can't understand/],
    ['TypeError: can only concatenate str (not "int") to str', /str\(\) to convert/],
    ["Traceback …\nNameError: name 'x' is not defined", /name 'x'|recognize/],
    ['  File "<exec>", line 3\nIndentationError: unexpected indent', /indentation. Check your spaces/],
    ['ZeroDivisionError: division by zero', /can't divide by zero/],
    ['ValueError: invalid literal for int() with base 10: "a"', /Make sure it's digits only/],
    ['ModuleNotFoundError: No module named "pandas"', /available in the browser/],
  ];
  test.each(cases)('%s → friendly hint', (raw, hint) => {
    expect(friendlyError(raw)).toMatch(hint);
  });

  test('first match wins', () => {
    expect(friendlyError('Traceback … ZeroDivisionError: x / 0')).toMatch(/can't divide by zero/);
  });

  test('unrecognized messages pass through unchanged', () => {
    expect(friendlyError('KeyError: "foo"')).toBe('KeyError: "foo"');
  });
});

describe('DATASET_FILE_RE export', () => {
  test('is a global regex usable with matchAll', () => {
    const src = `open('a.csv') pd.read_csv("b.csv")`;
    const got = Array.from(src.matchAll(DATASET_FILE_RE), (m) => m[1]);
    expect(got).toEqual(['a.csv', 'b.csv']);
  });
});