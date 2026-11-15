// Lets a lesson fence opt out of becoming a runnable cell.
//
// Every ```python fence on a lesson page is upgraded to a Run button by
// rehype-runnable-python.mjs. That is right for a self-contained snippet and
// wrong for a *fragment*: a few exercises quote three lines to paste into the
// script above ("add this to main()"), and running those on their own raises
// NameError before the learner has read anything.
//
// The opt-out has to survive Shiki, which rewrites the tree and drops any
// hProperties a remark plugin sets, and the fence's metastring never reaches
// rehype at all. So this pass records the *source* of every fence marked
// `no-run` on the vfile, and the rehype pass skips a fence whose text matches.
// Text is the only thing that comes through intact.
//
// Usage in a lesson:
//
//     ```python no-run
//     parser.add_argument("--interactive", ...)
//     ```
const MARKER = /(?:^|\s)no-run(?:\s|$)/;

export default function remarkMarkNoRunFences() {
  return (tree, file) => {
    const noRun = new Set();
    const walk = (node) => {
      if (node.type === 'code' && typeof node.meta === 'string' && MARKER.test(node.meta)) {
        noRun.add(node.value);
      }
      (node.children ?? []).forEach(walk);
    };
    walk(tree);
    if (noRun.size > 0) {
      file.data = file.data ?? {};
      file.data.noRunFences = noRun;
    }
  };
}
