// Wraps each recognized "## <emoji> Heading" + everything up to the next
// heading into a styled <section class="lesson-section lesson-section--kind">
// card. Lesson content consistently uses a fixed set of these headings
// (Learning objectives, Common pitfalls, Socratic Questions, Weekly quiz —
// Challenges gets its own treatment via remark-admonitions-style <details>
// blocks already, so it's included here too for a matching card frame).
import {toString as hastToString} from 'hast-util-to-string';
import {h} from 'hastscript';

const KINDS = [
  {emoji: '🎯', kind: 'objectives'},
  {emoji: '⚠️', kind: 'pitfalls'},
  {emoji: '🧩', kind: 'challenges'},
  {emoji: '🤔', kind: 'socratic'},
  {emoji: '✅', kind: 'quiz'},
];

function matchKind(headingNode) {
  const text = hastToString(headingNode).trim();
  return KINDS.find(({emoji}) => text.startsWith(emoji));
}

// Deliberately NOT a generic `visit()` over the whole tree: these `## h2`
// section headings only ever appear at the document's top level, and a
// section this wraps a heading into contains that same heading as a child —
// visiting recursively would immediately re-match it and wrap it again,
// forever (this bit; don't "fix" it back to visit() without re-checking).
export default function rehypeSectionBlocks() {
  return (tree) => {
    const kids = tree.children;
    const out = [];
    let i = 0;
    while (i < kids.length) {
      const child = kids[i];
      const isH2 = child.type === 'element' && child.tagName === 'h2';
      const match = isH2 ? matchKind(child) : null;
      if (!match) {
        out.push(child);
        i++;
        continue;
      }
      const group = [child];
      let j = i + 1;
      while (j < kids.length) {
        const next = kids[j];
        const isNextHeading = next.type === 'element' && /^h[1-2]$/.test(next.tagName);
        if (isNextHeading) break;
        group.push(next);
        j++;
      }
      out.push(h(`section.lesson-section.lesson-section--${match.kind}`, group));
      i = j;
    }
    tree.children = out;
  };
}
