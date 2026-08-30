// Content files open with `# <title>`, which duplicates the frontmatter title
// the page layout already renders as the page <h1>. That shipped every lesson
// and project page with two <h1>s and the title printed twice.
//
// Dropping it here rather than editing ~200 markdown files keeps the content
// readable on its own (on GitHub, in an editor) while giving the rendered page
// a single, correct heading.
export default function rehypeDropLeadingH1() {
  return (tree) => {
    const first = tree.children.findIndex(
      (n) => n.type === 'element' && /^h[1-6]$/.test(n.tagName),
    );
    if (first !== -1 && tree.children[first].tagName === 'h1') {
      tree.children.splice(first, 1);
    }
  };
}
