// Minimal, dependency-free Python syntax highlighter for the live-editable
// code cells (playground + any cell after a user edit breaks Shiki's
// build-time spans). Colors match VS Code's Dark+ theme. Not a full
// tokenizer — good enough for readability on short teaching snippets, not
// meant to replace Shiki for the static, build-time lesson rendering.

const KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  'match', 'case',
]);

const BUILTINS = new Set([
  'print', 'len', 'range', 'int', 'float', 'str', 'bool', 'list', 'dict',
  'set', 'tuple', 'type', 'isinstance', 'enumerate', 'zip', 'map', 'filter',
  'sorted', 'reversed', 'sum', 'min', 'max', 'abs', 'round', 'open', 'input',
  'self', 'super', 'Exception', 'ValueError', 'TypeError', 'KeyError',
]);

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Ordered so longer/greedier alternatives (triple-quoted strings, f-strings)
// are tried before the shorter patterns they'd otherwise be split by.
const TOKEN_RE = new RegExp(
  [
    /#.*/.source, // comment
    /(?:[rRbBfFuU]{1,2})?'''[\s\S]*?'''/.source, // triple single
    /(?:[rRbBfFuU]{1,2})?"""[\s\S]*?"""/.source, // triple double
    /(?:[rRbBfFuU]{1,2})?'(?:\\.|[^'\\\n])*'/.source, // single
    /(?:[rRbBfFuU]{1,2})?"(?:\\.|[^"\\\n])*"/.source, // double
    /\b\d+\.?\d*(?:[eE][+-]?\d+)?\b/.source, // number
    /\b[A-Za-z_][A-Za-z0-9_]*\b/.source, // identifier/keyword
  ].join('|'),
  'g',
);

/** Tokenize and wrap `code` in colour-coded spans. Returns an HTML string. */
export function highlightPython(code: string): string {
  let out = '';
  let last = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(code))) {
    const tok = match[0];
    out += escapeHtml(code.slice(last, match.index));
    last = match.index + tok.length;

    if (tok[0] === '#') { out += `<span class="tok-com">${escapeHtml(tok)}</span>`; continue; }
    if (tok[0] === "'" || tok[0] === '"' || /^[a-zA-Z]/.test(tok) && /['"]/.test(tok[1] ?? '')) {
      out += `<span class="tok-str">${escapeHtml(tok)}</span>`; continue;
    }
    if (/^\d/.test(tok)) { out += `<span class="tok-num">${escapeHtml(tok)}</span>`; continue; }
    if (KEYWORDS.has(tok)) { out += `<span class="tok-kw">${escapeHtml(tok)}</span>`; continue; }
    if (BUILTINS.has(tok)) { out += `<span class="tok-builtin">${escapeHtml(tok)}</span>`; continue; }
    // `def foo(` / `class Foo(` — colour the name, not just the keyword.
    const before = code.slice(0, match.index).trimEnd();
    if (/\b(def|class)$/.test(before)) { out += `<span class="tok-def">${escapeHtml(tok)}</span>`; continue; }
    out += escapeHtml(tok);
  }
  out += escapeHtml(code.slice(last));
  return out;
}
