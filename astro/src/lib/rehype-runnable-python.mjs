// Upgrades fenced ```python code blocks (rendered by Shiki as <pre class="...language-python">)
// into the same markup RunnableCell.astro produces, so the shared runnable-cell
// script (mounted once in Base.astro) can hydrate them with a Run button + Pyodide
// output panel. Plain markdown content collections can't use Astro component
// overrides (that's an MDX-only feature), so this is the only way to make
// ```python fences in .md lesson files interactive.
import {visit} from 'unist-util-visit';
import {toString} from 'hast-util-to-string';

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

      const source = toString(code);
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: {className: ['cell'], 'data-runnable': ''},
        children: [
          {
            type: 'element', tagName: 'div', properties: {className: ['cell__actions']},
            children: [
              {type: 'element', tagName: 'button', properties: {className: ['btn', 'btn-primary', 'cell__run'], 'data-run': '', 'aria-label': 'Run this Python code'}, children: [{type: 'text', value: '▶ Run'}]},
              {type: 'element', tagName: 'span', properties: {className: ['cell__lang']}, children: [{type: 'text', value: 'python'}]},
            ],
          },
          {type: 'element', tagName: 'pre', properties: {className: ['cell__code']}, children: [
            {type: 'element', tagName: 'code', properties: {}, children: [{type: 'text', value: source}]},
          ]},
          {
            type: 'element', tagName: 'div', properties: {className: ['cell__output'], 'data-output': '', hidden: true},
            children: [
              {type: 'element', tagName: 'div', properties: {className: ['cell__lines'], 'data-lines': ''}, children: []},
              {type: 'element', tagName: 'button', properties: {className: ['cell__clear'], 'data-clear': '', hidden: true}, children: [{type: 'text', value: 'Clear'}]},
            ],
          },
        ],
      };
    });
  };
}
