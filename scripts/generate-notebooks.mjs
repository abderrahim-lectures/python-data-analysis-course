#!/usr/bin/env node
// Generates a real Jupyter notebook (.ipynb, nbformat v4) for every lesson
// from its markdown source: prose blocks become markdown cells, ```python
// fences become code cells, and lessons that reference a dataset get a
// download-to-cwd prep cell so open('…') / read_csv behave like on disk.
//
// Output: notebooks/<section>/<track>/<lesson-slug>.ipynb (committed so
// Colab/nbviewer/Binder/Deepnote can open them from GitHub by URL).
//
// It also generates per-locale project notebooks from the project markdown
// into examples/<slug>/notebook.{locale}.ipynb so each locale's Colab/Kaggle
// badges point at a notebook whose prose matches the reader's language
// (code cells stay Python). English projects keep their hand-authored
// examples/<slug>/notebook.ipynb; only missing ones are generated.
import {readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const REPO = 'abderrahim-lectures/python-data-analysis-course';
const BRANCH = 'main';
const DATASETS_DIR = new URL('../public/datasets', import.meta.url).pathname;
const DATASETS_INDEX = DATASETS_DIR + '/index.json';
const LESSONS_ROOT = new URL('../src/content/lessons', import.meta.url).pathname;
const OUT_ROOT = new URL('../notebooks', import.meta.url).pathname;
const PROJECTS_ROOT = new URL('../src/content/projects', import.meta.url).pathname;
const PROJECT_OUT_ROOT = new URL('../examples', import.meta.url).pathname;
const PROJECT_LOCALES = ['ar', 'es', 'fr'];

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

// Curated import name -> pip package, for the install prep cell of generated
// project notebooks. Only packages that are known-good on PyPI are listed;
// anything not in this map is treated as stdlib or a project-local module
// (e.g. patterns.py) and left alone.
const IMPORT_TO_PIP = {
  pandas: 'pandas',
  numpy: 'numpy',
  matplotlib: 'matplotlib',
  seaborn: 'seaborn',
  plotly: 'plotly',
  requests: 'requests',
  httpx: 'httpx',
  dotenv: 'python-dotenv',
  yaml: 'pyyaml',
  tomli_w: 'tomli-w',
  openpyxl: 'openpyxl',
  bs4: 'beautifulsoup4',
  bleach: 'bleach',
  sklearn: 'scikit-learn',
  joblib: 'joblib',
  PIL: 'pillow',
  cv2: 'opencv-python',
  openai: 'openai',
  langchain_openai: 'langchain-openai',
  deepagents: 'deepagents',
  sentence_transformers: 'sentence-transformers',
  transformers: 'transformers',
  peft: 'peft',
  spacy: 'spacy',
  textblob: 'textblob',
  folium: 'folium',
  networkx: 'networkx',
  fastapi: 'fastapi',
  uvicorn: 'uvicorn',
  websockets: 'websockets',
  pydantic: 'pydantic',
  markdown: 'Markdown',
  qrcode: 'qrcode',
  piexif: 'piexif',
  pypdf: 'pypdf',
  moviepy: 'moviepy',
  pydub: 'pydub',
  midiutil: 'MIDIUtil',
  whisper: 'openai-whisper',
  ultralytics: 'ultralytics',
  discord: 'discord.py',
  strawberry: 'strawberry-graphql',
  dash: 'dash',
  dash_bootstrap_components: 'dash-bootstrap-components',
  click: 'click',
  jose: 'python-jose',
};

function projectDeps(blocks) {
  const deps = new Set();
  for (const b of blocks) {
    if (b.kind !== 'code' || b.lang !== 'python') continue;
    for (const m of b.content.matchAll(/^import (\w+)|^from (\w+) import/gm)) {
      const mod = m[1] || m[2];
      const pip = IMPORT_TO_PIP[mod];
      if (pip) deps.add(pip);
    }
  }
  return [...deps];
}

function projectDepsCell(deps) {
  const lines = [
    '# 📦 Install third-party libraries used by this project',
    '# Colab/Kaggle ship most common data-science packages, but not all;',
    '# this installs the ones this project imports (safe to re-run).',
    'import sys',
    'sub = lambda cmd: __import__("subprocess").check_call(["pip", "install", "-q"] + cmd)',
    `sub(${JSON.stringify(deps)})`,
  ];
  return code(lines.join('\n'));
}

// Build a notebook for a project page. Projects differ from lessons: prose
// becomes markdown cells, ```python fences become code cells, and everything
// else (bash/powershell setup, unlabelled demo output) becomes markdown cells
// so the notebook tells the full story without executing shell snippets.
function buildProject(filePath, slug, locale) {
  const raw = readFileSync(filePath, 'utf8');
  const body = stripFrontmatter(raw);
  const blockRe = /^```(\w*)\s*\n([\s\S]*?)^```\s*$/gm;
  const blocks = [];
  let last = 0;
  for (const m of body.matchAll(blockRe)) {
    const head = body.slice(last, m.index).replace(/\n{3,}/g, '\n\n').trim();
    if (head) blocks.push({kind: 'md', content: head});
    const lang = m[1] || 'bash';
    blocks.push(lang === 'python' ? {kind: 'code', lang, content: m[2].replace(/\s+$/, '')} : {kind: 'md', content: '```' + lang + '\n' + m[2].replace(/\s+$/, '') + '\n```'});
    last = m.index + m[0].length;
  }
  const tail = body.slice(last).replace(/\n{3,}/g, '\n\n').trim();
  if (tail) blocks.push({kind: 'md', content: tail});

  const cells = [];
  const localeTag = locale === 'en' ? '' : ` (${locale})`;
  cells.push(code([
    '# ' + slug + localeTag,
    '# Generated companion notebook for the PyDA course project page.',
    '# Run cells top-to-bottom to build the project step by step.',
    '',
    'print("PyDA — ready 🚀")',
  ].join('\n')));
  const deps = projectDeps(blocks);
  if (deps.length) cells.push(projectDepsCell(deps));
  for (const b of blocks) {
    cells.push(b.kind === 'code' ? code(b.content) : md(b.content));
  }
  cells.push(code('# The end. Practice on your own — each cell is a minimal, runnable chunk.'));
  return notebook(cells);
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
console.log(`generated ${count} lesson notebooks`);

// Per-locale project notebooks into examples/<slug>/notebook.{locale}.ipynb.
// English keeps its hand-authored examples/<slug>/notebook.ipynb (written by
// hand for 124 projects); only missing ones get generated. For ar/es/fr every
// project gets a generated notebook so its badges can point at a localized
// version, and code cells stay Python (translations never translate code).
let projectCount = 0;
for (const name of readdirSync(PROJECTS_ROOT, {withFileTypes: true})) {
  if (!name.isFile() || !name.name.endsWith('.md')) continue;
  const slug = name.name.replace(/\.md$/, '');
  const enPath = join(PROJECTS_ROOT, name.name);
  const enOut = join(PROJECT_OUT_ROOT, slug, 'notebook.ipynb');
  if (!existsSync(enOut)) {
    mkdirSync(join(PROJECT_OUT_ROOT, slug), {recursive: true});
    writeFileSync(enOut, JSON.stringify(buildProject(enPath, slug, 'en'), null, 1) + '\n');
    projectCount++;
  }
  for (const loc of PROJECT_LOCALES) {
    const locPath = join(PROJECTS_ROOT, loc, name.name);
    if (!existsSync(locPath)) {
      console.warn(`SKIP ${loc}/${name.name}: no localized project page`);
      continue;
    }
    const out = join(PROJECT_OUT_ROOT, slug, `notebook.${loc}.ipynb`);
    mkdirSync(join(PROJECT_OUT_ROOT, slug), {recursive: true});
    writeFileSync(out, JSON.stringify(buildProject(locPath, slug, loc), null, 1) + '\n');
    projectCount++;
  }
}
console.log(`generated ${projectCount} project notebooks (EN only where missing)`);

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