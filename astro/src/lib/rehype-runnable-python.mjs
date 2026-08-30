// Upgrades fenced ```python code blocks (rendered by Shiki as <pre class="...language-python">)
// into the same markup RunnableCell.astro produces, so the shared runnable-cell
// script (mounted once in Base.astro) can hydrate them with a Run button + Pyodide
// output panel. Plain markdown content collections can't use Astro component
// overrides (that's an MDX-only feature), so this is the only way to make
// ```python fences in .md lesson files interactive.
import {visit} from 'unist-util-visit';
import {h} from 'hastscript';

export default function rehypeRunnablePython() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index == null) return;
      const code = node.children.find((c) => c.type === 'element' && c.tagName === 'code');
      if (!code) return;
      // Astro's Shiki transform runs before this plugin and rewrites the tree:
      // `<pre data-language="python" class="astro-code ...">` with per-token
      // spans inside `<code>` — no `language-python` class on `<code>` anymore.
      const shikiLang = node.properties?.['dataLanguage'] ?? node.properties?.['data-language'];
      const cls = code.properties?.className ?? [];
      const isPython =
        shikiLang === 'python' || shikiLang === 'py' ||
        (Array.isArray(cls) && cls.some((c) => /language-(python|py)$/.test(String(c))));
      if (!isPython) return;

      // Keep Shiki's highlighted spans (per-token inline `color:`) for syntax
      // colors, but drop the <pre>'s own inline background/class so our
      // .cell__code background wins — textContent still reconstructs the
      // plain source fine for the client script even with nested spans.
      const highlightedPre = h('pre.cell__code', [{...code, properties: {...code.properties, className: undefined}}]);

      parent.children[index] = h('div.cell', {dataRunnable: ''}, [
        h('div.cell__actions', [
          h('button.btn.btn-primary.cell__run', {dataRun: '', ariaLabel: 'Run this Python code'}, '▶ Run'),
          h('span.cell__lang', 'python'),
        ]),
        highlightedPre,
        h('div.cell__output', {dataOutput: '', hidden: true}, [
          h('div.cell__lines', {dataLines: ''}),
          h('button.cell__clear', {dataClear: '', hidden: true}, 'Clear'),
        ]),
      ]);
    });
  };
}
