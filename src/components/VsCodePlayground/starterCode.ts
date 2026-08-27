import type {SectionId} from '@site/src/types/progress';

/**
 * Starter code shown in the Monaco editor when the playground opens on a given
 * section. Pure-Python by default; `loadPackagesFromImports` in the runner
 * fetches any pandas/numpy/etc. imports from the Pyodide CDN on demand, so
 * the Data Analysis starter can still `import statistics` without bundling
 * anything extra into the site.
 */
export const PYTHON_101_STARTER = `# main.py — Python 101
def greet(name):
    return f"Hello, {name}!"

print(greet("Python"))
print(2 + 2)
`;

export const DATA_ANALYSIS_STARTER = `# main.py — Data Analysis
import statistics

temps = [21, 22, 25, 19, 23, 26, 20]
print("mean:", statistics.mean(temps))
print("max:", max(temps))
`;

export function starterCodeForSection(section: SectionId | null): string {
  return section === 'data-analysis' ? DATA_ANALYSIS_STARTER : PYTHON_101_STARTER;
}
