#!/usr/bin/env node
// After per-locale project notebooks are generated into examples/<slug>/notebook.{locale}.ipynb,
// this script:
// 1) retargets every existing badge and prose link in ar/es/fr copies from
//    notebook.ipynb → notebook.{locale}.ipynb, and
// 2) inserts a badge block into projects that currently have NO Colab/Kaggle badge
//    at all — in every locale — so every notebook is reachable from the project page.
import {readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const REPO = 'abderrahim-lectures/python-data-analysis-course';
const BLOB = 'https://github.com/' + REPO + '/blob/main';
const PROJECTS_ROOT = new URL('../src/content/projects', import.meta.url).pathname;
const LOCALES = ['ar', 'es', 'fr'];
const KNOWN_BADGE = 'open-in-kaggle.svg'; // used to detect whether badges already exist

// Localized section headings where "Where to run this" lives, so we insert
// the block inside the section when present rather than dumping it at the top.
const RUN_HEADINGS = {
  en: /## Where to run/i,
  ar: /## أين تُشغّل/i,
  es: /## Dónde ejecutar/i,
  fr: /## Où exécuter/i,
};

// Short, house-style lead-in sentence shown before the badge links.
const BADGE_LEADIN = {
  en: '- **Run it in your browser.** An interactive companion notebook is ready — open it in Colab, Kaggle, or Binder and follow along top-to-bottom.',
  ar: '- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز — افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.',
  es: '- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo — ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.',
  fr: '- **Exécutez-le dans le navigateur.** Un compagnon notebook interactif est prêt — ouvrez-le dans Colab, Kaggle ou Binder et suivez les étapes dans l\'ordre.',
};

// Build the 3-badge block that points at a given locale's notebook file.
function badgeBlock(slug, locale) {
  const nbFile = locale === 'en' ? 'notebook.ipynb' : `notebook.${locale}.ipynb`;
  const binderParam = 'examples%2F' + slug + '%2F' + nbFile;
  const lines = [
    `  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/${REPO}/blob/main/examples/${slug}/${nbFile})`,
    `  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/${REPO}/blob/main/examples/${slug}/${nbFile})`,
    `  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/${REPO}/main?filepath=${binderParam})`,
  ];
  return lines.join('\n');
}

// Identify the line index after the "Where to run" section ends (i.e. right
// before the next ## heading), or null if the section doesn't exist.
function runSectionEndIndex(lines, locale) {
  const re = RUN_HEADINGS[locale];
  if (!re) return null;
  let secStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) { secStart = i; break; }
  }
  if (secStart === -1) return null;
  for (let i = secStart + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) return i; // next heading
  }
  return lines.length;
}

// Find where to insert if there's NO run section: right before the first ## heading.
function firstHeadingIndex(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (/^## /.test(lines[i])) return i;
  }
  return lines.length;
}

let retargeted = 0;
let inserted = 0;

for (const name of readdirSync(PROJECTS_ROOT, {withFileTypes: true})) {
  if (!name.isFile() || !name.name.endsWith('.md')) continue;
  const slug = name.name.replace(/\.md$/, '');

  // --- 1) Retarget ar/es/fr locale copies ---
  for (const loc of LOCALES) {
    const p = join(PROJECTS_ROOT, loc, name.name);
    let t;
    try { t = readFileSync(p, 'utf8'); } catch { continue; }
    if (!t.includes('notebook.ipynb')) continue; // nothing to retarget
    // Replace the plain and URL-encoded paths. Scope is per-file (no cross-project refs).
    t = t.replaceAll(`examples/${slug}/notebook.ipynb`, `examples/${slug}/notebook.${loc}.ipynb`);
    t = t.replaceAll(`examples%2F${slug}%2Fnotebook.ipynb`, `examples%2F${slug}%2Fnotebook.${loc}.ipynb`);
    // Retarget the backticked display label whenever it sits in a link whose
    // target already points at this locale's notebook (keeps label == filename).
    t = t.replaceAll(
      new RegExp('`notebook\\.ipynb`\\]\\(https://github\\.com/' + REPO.replace(/\//g, '\\/') + '/blob/main/examples/' + slug + '/notebook\\.' + loc + '\\.ipynb\\)', 'g'),
      '`notebook.' + loc + '.ipynb`](https://github.com/' + REPO + '/blob/main/examples/' + slug + '/notebook.' + loc + '.ipynb)'
    );
    writeFileSync(p, t);
    retargeted++;
  }

  // --- 2) Insert badges into ALL locales if no badge is present yet ---
  const enPath = join(PROJECTS_ROOT, name.name);
  const enText = readFileSync(enPath, 'utf8');
  const needsEnBadge = !enText.includes(KNOWN_BADGE);
  const localeFiles = LOCALES.map(loc => {
    const p = join(PROJECTS_ROOT, loc, name.name);
    try { return {loc, path: p, text: readFileSync(p, 'utf8')}; } catch { return null; }
  }).filter(Boolean);

  if (!needsEnBadge && localeFiles.every(f => f.text.includes(KNOWN_BADGE))) continue;

  // Insert EN badges if missing
  const insertBlock = (path, text, loc) => {
    const lines = text.split('\n');
    const secEnd = runSectionEndIndex(lines, loc) ?? firstHeadingIndex(lines);
    const blockLines = [BADGE_LEADIN[loc], ...badgeBlock(slug, loc).split('\n'), ''];
    lines.splice(secEnd, 0, ...blockLines);
    writeFileSync(path, lines.join('\n'));
    inserted++;
  };

  if (needsEnBadge) insertBlock(enPath, enText, 'en');

  // Insert locale badges if missing
  for (const {loc, path: p, text: t} of localeFiles) {
    if (t.includes(KNOWN_BADGE)) continue;
    insertBlock(p, t, loc);
  }
}

console.log(`retargeted ${retargeted} locale files`);
console.log(`inserted badge blocks in ${inserted} files`);
