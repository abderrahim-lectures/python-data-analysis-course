import {describe, expect, test} from 'vitest';
import {transform} from '@astrojs/compiler-rs';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

// Static checks on the .astro sources, run through the same compiler the build
// uses (@astrojs/compiler-rs as of astro 7.4, the version pinned in
// package.json — it stopped being a hoisted transitive dependency when the
// build switched from the wasm compiler, which is how this test found out). `astro build` and
// `astro sync` cannot run in this VM (the wasm address-space reservation plus a
// hard 32 GB `ulimit -v`), so without these two invariants nothing in the
// test suite can see a template that compiles fine and renders wrong.
//
// Both catch a class of bug that is invisible in review because the source
// reads exactly like the JSX it looks like. Each was found in real components
// in this tree:
//   - `class="station{done ? ' station--done' : ''}"` (ProgressPage) shipped the
//     literal text `station{done ? ' station--done' : ''}` as a class list;
//   - `[dir='rtl'] .arrow::before { … }` (ModuleNav and five more) compiled to
//     `:where(.astro-x)[dir=rtl] …`, and `[dir]` lives on <html>, which carries
//     Base.astro's scope, so the rule could never match.

const COMPONENT_DIRS = ['src/components', 'src/layouts', 'src/pages'];

function astroFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) astroFiles(path, out);
    else if (path.endsWith('.astro')) out.push(path);
  }
  return out;
}

const FILES = COMPONENT_DIRS.flatMap((dir) => astroFiles(dir)).sort();

async function compile(file: string) {
  return transform(readFileSync(file, 'utf8'), {filename: file});
}

describe('astro templates', () => {
  test('the compiler finds the component tree', () => {
    expect(FILES.length).toBeGreaterThan(50);
  });

  // The compiler reports syntax errors as diagnostics rather than throwing, so
  // without this a template with an unclosed tag or an unparsable script would
  // still satisfy the two invariants below (it replaces an esbuild gate that
  // died with astro 7.4). Severity is numeric in the Rust binding.
  test('no template has a compiler error', async () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      const {diagnostics} = await compile(file);
      for (const d of diagnostics ?? []) {
        if (d.severity !== 'error') continue;
        offenders.push(`${file}: ${d.text}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  // A quoted attribute is a string literal to the compiler: `{…}` inside it is
  // never evaluated. Anything dynamic has to be a whole-value expression
  // (`class={…}` / `class={`…`}`), or the markup ships the source text.
  // Scanned on the source's template half rather than the compiled output: the
  // frontmatter's own comments mention the bug being fixed in prose
  // (SceneBg.astro), and a compiled template literal legitimately carries
  // `${…}` substitutions inside quoted attributes.
  test('no quoted attribute ships a literal {…} expression', async () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      const src = readFileSync(file, 'utf8');
      // Template half only: frontmatter comments mention the bug in prose, and
      // the client scripts' own template literals (`[data-week="${i + 1}"]`)
      // are JS, not markup.
      const template = src
        .replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<style[\s\S]*?<\/style>/g, '');
      for (const m of template.matchAll(/([\w:@-]+)="([^"\n]*\{[^"\n]*)"/g)) {
        offenders.push(`${file}: ${m[1]}="${m[2].slice(0, 90)}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  // `dir` and `data-theme` are set on <html> by Base.astro. A scoped component
  // style cannot reach <html>: the compiler prefixes every compound selector
  // with `:where(.astro-<thisComponent>)`, and <html> carries Base's scope.
  // The fix in each case is `:global([dir='rtl']) …`.
  test('scoped styles never scope an html-level attribute selector', async () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      const {css} = await compile(file);
      const text = (css ?? []).join('');
      for (const m of text.matchAll(/:where\(\.astro-[a-z0-9]+\)\[(?:dir|data-theme)=/g)) {
        offenders.push(`${file}: ${m[0]}…`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
