// Records whether a page contains math, so the KaTeX stylesheet can be loaded
// only where it is used.
//
// `katex.min.css` was imported unconditionally by LessonPage.astro and
// ProjectDetail.astro: 29.8 KB raw (8 KB gzip) on 1,141 pages, of which 1,035
// render no math at all. The import sits at page scope, so Astro could not
// tree-shake it per page -- the only thing that knows whether a given lesson
// has a formula is the markdown itself, at compile time.
//
// remarkMath turns `$...$` and `$$...$$` into `inlineMath`/`math` nodes, so
// this pass runs after it and records the answer on the vfile. The page
// component reads `render(entry).remarkPluginFrontmatter` and imports the CSS
// only when the flag is set.
export default function remarkRecordMath() {
  return (tree, file) => {
    let hasMath = false;
    const walk = (node) => {
      if (hasMath) return;
      if (node.type === 'math' || node.type === 'inlineMath') {
        hasMath = true;
        return;
      }
      (node.children ?? []).forEach(walk);
    };
    walk(tree);

    file.data = file.data ?? {};
    file.data.astro = file.data.astro ?? {};
    file.data.astro.frontmatter = file.data.astro.frontmatter ?? {};
    file.data.astro.frontmatter.hasMath = hasMath;
  };
}
