// Pure dataset-mounting helpers for the in-browser Python runner.
// Shared by runnable-cell.client.ts and unit tests: given the code of a
// page's runnable cells and the dataset manifest, build the list of files to
// pre-mount into the Pyodide virtual filesystem before the first run.

// Matches quoted filenames passed to file-reading calls, plus an optional
// trailing `, newline=…` argument so multi-line calls are still caught:
//   open('name.csv')                          -> group 1
//   pd.read_csv("titanic.csv")                -> group 1
//   pd.read_csv('data.csv', newline='')       -> group 2
export const DATASET_FILE_RE =
  /(?:open|read_csv|read_excel|read_json|np\.loadtxt|np\.genfromtxt|loadtxt|genfromtxt)\s*\(\s*["']([\w.\-/]+)["']|(?:open|read_csv)\s*\(\s*["']([\w.\-/]+)["']\s*,\s*newline/mg;

export function normalizeDatasetName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Bare, deduplicated file names referenced anywhere in a page's code. A path
// prefix (e.g. `data/titanic.csv`) is stripped so the mount key is the file
// name the lesson code uses with a bare `open(...)` call.
export function uniqueRefsFromSource(source: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of source.matchAll(DATASET_FILE_RE)) {
    const name = (match[1] ?? match[2])?.split('/').pop();
    if (name && !seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

export interface DatasetMountPlanEntry {
  ref: string;
  shipped: string;
}

// Map referenced names to shipped filenames through the manifest
// (normalized name -> shipped filename). References missing from the
// manifest are skipped so a typo never triggers a network fetch, and the
// plan holds at most one entry per shipped file (later case/path variants of
// the same dataset collapse onto the first reference).
export function planDatasetMounts(
  source: string,
  manifest: Record<string, string> | null,
): DatasetMountPlanEntry[] {
  if (!manifest) return [];
  const plannedByShipped = new Map<string, string>();
  for (const ref of uniqueRefsFromSource(source)) {
    const shipped = manifest[normalizeDatasetName(ref)];
    if (shipped && !plannedByShipped.has(shipped)) plannedByShipped.set(shipped, ref);
  }
  return Array.from(plannedByShipped, ([shipped, ref]) => ({ref, shipped}));
}