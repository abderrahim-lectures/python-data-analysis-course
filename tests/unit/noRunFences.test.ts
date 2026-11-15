import {describe, expect, test} from 'vitest';
import {createMarkdownProcessor} from '@astrojs/markdown-remark';
import remarkNoRunFences from '../../src/lib/remark-no-run-fences.mjs';
import rehypeRunnablePython from '../../src/lib/rehype-runnable-python.mjs';

// A lesson fence marked `no-run` must render as a plain code block, because it
// is a fragment to paste into the script above rather than something that can
// run on its own (issue 07: the CLI generator's "Practice Challenge" cell
// raised NameError: name 'parser' is not defined on every visit).
async function render(markdown: string) {
  // The factories, not their return values: unified calls a plugin to get its
  // transformer, and handing it the transformer directly runs the body with an
  // undefined tree. This mirrors astro.config.mjs, which lists the plain
  // imports.
  const proc = await createMarkdownProcessor({
    remarkPlugins: [remarkNoRunFences],
    rehypePlugins: [rehypeRunnablePython],
  });
  const {code} = await proc.render(markdown);
  return String(code);
}

const FRAGMENT = 'parser.add_argument("--interactive", action="store_true")\nif args.interactive:\n    pass';
const STANDALONE = 'print("hello")\n';

describe('remark-no-run-fences', () => {
  test('a no-run fence stays a plain code block', async () => {
    const html = await render('```python no-run\n' + FRAGMENT + '\n```\n');
    expect(html).not.toContain('data-runnable');
    expect(html).not.toContain('cell__run');
    expect(html).toContain('parser.add_argument');
  });

  test('an unmarked fence still becomes a runnable cell', async () => {
    const html = await render('```python\n' + STANDALONE + '\n```\n');
    expect(html).toContain('data-runnable');
    expect(html).toContain('cell__run');
  });

  test('marking one fence leaves its neighbours runnable', async () => {
    const html = await render(
      '```python\n' + STANDALONE + '\n```\n\n```python no-run\n' + FRAGMENT + '\n```\n\n```python\nprint("bye")\n```\n',
    );
    expect(html.match(/data-runnable/g)).toHaveLength(2);
  });

  test('the marker is a flag, not a substring match on other words', async () => {
    // `no-runner` or a title containing "no-run" must not accidentally opt out.
    const html = await render('```python title="no-running"\n' + STANDALONE + '\n```\n');
    expect(html).toContain('data-runnable');
  });
});
