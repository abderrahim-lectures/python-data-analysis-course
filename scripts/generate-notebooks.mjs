#!/usr/bin/env node
// Generates a real Jupyter notebook (.ipynb, nbformat v4) for every lesson
// from its markdown source: prose blocks become markdown cells, ```python
// fences become code cells, and lessons that reference a dataset get a
// download-to-cwd prep cell so open('…') / read_csv behave like on disk.
//
// Output: notebooks/<section>/<track>/<lesson-slug>.ipynb (committed so
// Colab/nbviewer/Binder/Deepnote can open them from GitHub by URL).
import {readdirSync, readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const REPO = 'abderrahim-lectures/python-data-analysis-course';
const BRANCH = 'main';
const DATASETS_DIR = new URL('../public/datasets', import.meta.url).pathname;
const DATASETS_INDEX = DATASETS_DIR + '/index.json';
const LESSONS_ROOT = new URL('../src/content/lessons', import.meta.url).pathname;
const OUT_ROOT = new URL('../notebooks', import.meta.url).pathname;

const LANG_INFO = {
  name: 'python',
  version: '3.11.0',
  pygments_lexer: 'ipython3',
};
const KERNELSPEC = {
  display_name: 'Python 3',
  language: 'python',
  name: 'python3',
};

const md = (source) => ({
  cell_type: 'markdown',
  metadata: {},
  source: String(source).split('\n').map((l) => l + '\n'),
});
const code = (source) => ({
  cell_type: 'code',
  metadata: {},
  execution_count: null,
  outputs: [],
  source: String(source).split('\n').map((l) => l + '\n'),
});
const notebook = (cells) => ({
  cells,
  metadata: {kernelspec: KERNELSPEC, language_info: LANG_INFO, 'colab': {provenance: []}},
  nbformat: 4,
  nbformat_minor: 5,
});

// Strip YAML frontmatter (leading `---` block).
function stripFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return text;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return lines.slice(i + 1).join('\n');
    }
  }
  return text;
}

// Split the body into alternating text / ```<lang> fence blocks.
function splitBlocks(body) {
  const blocks = [];
  let textBuf = [];
  const flush = () => {
    const t = textBuf.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (t) blocks.push({kind: 'md', content: t});
    textBuf = [];
  };
  const fenceRe = /^```(\w*)\s*\n([\s\S]*?)^```\s*$/gm;
  let last = 0;
  for (const m of body.matchAll(fenceRe)) {
    const head = body.slice(last, m.index);
    textBuf.push(head);
    flush();
    blocks.push({kind: 'code', lang: m[1] || 'python', content: m[2].replace(/\s+$/, '')});
    last = m.index + m[0].length;
  }
  textBuf.push(body.slice(last));
  flush();
  return blocks;
}

const DATASET_RE = /["']([\w./-]+\.(?:csv|tsv|json|txt|parquet))["']/g;
// Map a code-referenced filename to the shipped dataset it corresponds to.
// Robust to case and to `students-performance.csv` vs `StudentsPerformance.csv`
// (hyphen/underscore-insensitive): both must resolve to the same shipped file.
const shippedDatasets = readdirSync(DATASETS_DIR).filter((n) => !n.startsWith('.'));
const shippedLookup = new Map(); // normalized name -> shipped filename
for (const n of shippedDatasets) shippedLookup.set(normalizeName(n), n);

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function referencedDatasets(blocks) {
  const datasets = new Map(); // shipped name -> {name, aliases: Set}
  for (const b of blocks) {
    if (b.kind !== 'code') continue;
    for (const m of b.content.matchAll(DATASET_RE)) {
      const ref = m[1].split('/').pop();
      if (!ref) continue;
      const shipped = shippedLookup.get(normalizeName(ref));
      if (!shipped) continue;
      if (!datasets.has(shipped)) datasets.set(shipped, {name: shipped, aliases: new Set()});
      if (ref !== shipped) datasets.get(shipped).aliases.add(ref);
    }
  }
  return [...datasets.values()];
}

function datasetPrepCell(datasets) {
  const lines = [
    '# 💾 Load the course datasets into this environment',
    '# The course data files live in the PyDA repo; pull them so',
    '# `open("…")` / `pd.read_csv("…")` work exactly like on disk.',
    'import os',
    'def _fetch(name, aliases=()):',
    '    if os.path.exists(name):',
    '        return',
    '    url = f"https://raw.githubusercontent.com/' + REPO + '/' + BRANCH + '/public/datasets/{name}"',
    '    os.system(f"curl -sL -o {name} {url}")',
    '    for alias in aliases:',
    '        if not os.path.exists(alias):',
    '            os.system(f"cp {name} {alias}")',
    '',
    ...datasets.flatMap((d) => [
      `_fetch(${JSON.stringify(d.name)}, (${[...d.aliases].map((a) => JSON.stringify(a)).join(', ')}${
        d.aliases.size ? '' : ''
      }))`,
    ]),
  ];
  return code(lines.join('\n'));
}

function buildLesson(filePath, relPath) {
  const raw = readFileSync(filePath, 'utf8');
  const body = stripFrontmatter(raw);
  const blocks = splitBlocks(body);
  const datasets = referencedDatasets(blocks);

  const cells = [];
  cells.push(code([
    '# ' + relPath.replace(/\.md$/, ''),
    '# Generated companion notebook for the PyDA course.',
    '# Run cells top-to-bottom (or in any order) to follow the lesson.',
    '',
    'print("PyDA — ready 🚀")',
  ].join('\n')));
  if (datasets.length) cells.push(datasetPrepCell(datasets));
  for (const b of blocks) {
    cells.push(b.kind === 'code' ? code(b.content) : md(b.content));
  }
  cells.push(code('# The end. Practice on your own — each cell is a minimal, runnable chunk.'));
  return notebook(cells);
}

function walk(dir, cb) {
  for (const name of readdirSync(dir, {withFileTypes: true})) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walk(p, cb);
    else if (name.name.endsWith('.md')) cb(p);
  }
}

let count = 0;
walk(LESSONS_ROOT, (filePath) => {
  // /src/content/lessons/<section>/<track>/<slug>.md
  const rel = filePath.replace(LESSONS_ROOT + '/', '');
  const [section, track, ...rest] = rel.split('/');
  const slug = rest.join('-').replace(/\.md$/, '');
  const nb = buildLesson(filePath, rel);
  const outDir = join(OUT_ROOT, section, track);
  mkdirSync(outDir, {recursive: true});
  // Keep local octicons/slugs filesystem-safe.
  writeFileSync(join(outDir, `${slug}.ipynb`), JSON.stringify(nb, null, 1) + '\n');
  count++;
});
console.log(`generated ${count} notebooks`);

// Emit a datasets index the browser runtime fetches so normalized name
// lookups (StudentsPerformance.csv -> students-performance.csv) work on
// demand in the lesson cells.
const shippedDatasets2 = readdirSync(DATASETS_DIR).filter((n) => !n.startsWith('.'));
const dsIndex = {};
for (const name of shippedDatasets2) {
  const norm = normalizeName(name);
  // Map: `"studentsperformancecsv": "students-performance.csv"`.
  dsIndex[norm] = name;
}
writeFileSync(DATASETS_INDEX, JSON.stringify(dsIndex, null, 1) + '\n', 'utf8');
console.log(`wrote ${DATASETS_INDEX}`);