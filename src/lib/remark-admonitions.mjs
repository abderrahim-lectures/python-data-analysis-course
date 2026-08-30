// Converts Docusaurus-style admonitions:
//   :::tip[Optional Title]
//   body...
//   :::
// into a div the site can style: <div class="admonition admonition--tip">
// <p class="admonition__title">Title</p>...</div>
//
// Without a blank line separating the ::: markers from the body (the form
// used throughout this course's content), remark parses the whole block as a
// single paragraph with the markers embedded as literal text at the start/end
// of its first/last child (soft line breaks inside one paragraph, not
// separate paragraphs) — so this operates within one paragraph's children,
// not across siblings.
import {visit} from 'unist-util-visit';

const OPEN_RE = /^:::(\w+)(?:\[(.*?)\])?[ \t]*\n?/;
const CLOSE_RE = /\n?[ \t]*:::[ \t]*$/;

export default function remarkAdmonitions() {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || index == null || !node.children?.length) return;
      const first = node.children[0];
      if (first.type !== 'text') return;
      const openMatch = first.value.match(OPEN_RE);
      if (!openMatch) return;

      const last = node.children[node.children.length - 1];
      if (last.type !== 'text') return;
      const sameNode = first === last;
      const closeSource = sameNode ? first.value.slice(openMatch[0].length) : last.value;
      const closeMatch = closeSource.match(CLOSE_RE);
      if (!closeMatch) return;

      const [, kind, title] = openMatch;
      const children = [];
      if (sameNode) {
        const body = closeSource.slice(0, closeSource.length - closeMatch[0].length);
        if (body) children.push({type: 'text', value: body});
      } else {
        const headRemainder = first.value.slice(openMatch[0].length);
        const tailRemainder = last.value.slice(0, last.value.length - closeMatch[0].length);
        if (headRemainder) children.push({type: 'text', value: headRemainder});
        children.push(...node.children.slice(1, -1));
        if (tailRemainder) children.push({type: 'text', value: tailRemainder});
      }

      const bodyParagraph = {type: 'paragraph', children: children.length ? children : [{type: 'text', value: ''}]};
      const wrapper = {
        type: 'admonition',
        data: {hName: 'div', hProperties: {className: ['admonition', `admonition--${kind}`]}},
        children: [
          ...(title ? [{
            type: 'admonitionTitle',
            data: {hName: 'p', hProperties: {className: ['admonition__title']}},
            children: [{type: 'text', value: title}],
          }] : []),
          bodyParagraph,
        ],
      };
      parent.children[index] = wrapper;
    });
  };
}
