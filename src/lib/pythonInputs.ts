// Finds the `input()` call sites in a cell's source so the UI can ask the
// learner for the values *before* the cell runs.
//
// Why this exists: Pyodide's stdin callback is synchronous — the interpreter
// blocks inside the wasm call until the JS side returns a line. A Web Worker
// therefore cannot ask the page for a value mid-run without
// SharedArrayBuffer/Atomics.wait, which needs COOP/COEP response headers
// GitHub Pages cannot set. (Keeping such cells on the main thread instead
// froze the whole tab for the duration of a browser prompt() dialog.) So the
// page collects the values up front and the worker replays them from a queue.
//
// The scan is deliberately small and string/comment-aware: `print("call
// input()")` is not a call site, and neither is a mention in a comment. It is
// still a *scan*, not a parser — a call site built by dynamic means (getattr,
// `input` passed as a value) is invisible to it. The runtime degrades honestly
// when the queue runs dry (Pyodide's stdin reports EOF, so Python raises
// EOFError) and the UI offers one more field, so a missed site costs the
// learner a second Run, never a hang.

export interface InputCallSite {
  /** The literal prompt when the call passes one (`input("Age? ")`), else ''. */
  prompt: string;
}

const IDENT_START = /[A-Za-z_]/;
const IDENT_PART = /[A-Za-z0-9_]/;
const QUOTES = new Set(['"', "'"]);
const ESCAPES: Record<string, string> = {n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', "'": "'"};

// Index just past the string literal that starts at `i` (a quote character),
// handling ''' / """ and backslash escapes. Returns src.length for an
// unterminated literal (the cell won't run anyway — SyntaxError).
function skipString(src: string, i: number): number {
  const quote = src[i];
  const triple = src.startsWith(quote.repeat(3), i);
  i += triple ? 3 : 1;
  while (i < src.length) {
    if (src[i] === '\\') {
      i += 2;
      continue;
    }
    if (triple) {
      if (src.startsWith(quote.repeat(3), i)) return i + 3;
      i++;
      continue;
    }
    if (src[i] === quote) return i + 1;
    if (src[i] === '\n') return i; // unterminated single-line string
    i++;
  }
  return src.length;
}

// The prompt of `input(...)` whose argument list starts at `i`: the decoded
// text of a leading string literal, or '' for anything else (no argument,
// a variable, or an f-string — an interpolated prompt has no static text to
// put in a label, so the field falls back to "Value 1/2/…").
function literalPrompt(src: string, i: number): string {
  while (i < src.length && /\s/.test(src[i])) i++;
  // A string prefix (`r"…"`, `rb"…"`) sits between the parenthesis and the
  // quote. An f-prefix means the text is interpolated, so there is no label.
  const prefix = /^([A-Za-z]{0,2})(?=['"])/.exec(src.slice(i, i + 3));
  if (prefix) {
    if (prefix[1].toLowerCase().includes('f')) return '';
    i += prefix[1].length;
  }
  if (i >= src.length || !QUOTES.has(src[i])) return '';
  const start = i;
  const end = skipString(src, i);
  const raw = src.slice(start, end);
  const body = raw.replace(/^('''|"""|'|")/, '').replace(/('''|"""|'|")$/, '');
  let out = '';
  for (let k = 0; k < body.length; k++) {
    const c = body[k];
    if (c !== '\\' || k + 1 >= body.length) {
      out += c;
      continue;
    }
    const next = body[k + 1];
    if (next in ESCAPES) {
      out += ESCAPES[next];
      k++;
      continue;
    }
    out += c;
  }
  // A prompt is a label here, not program output: keep it on one line and
  // drop the trailing space input("Age? ") carries for terminal readability.
  return out.replace(/\s+/g, ' ').trim();
}

// Every `input(...)` call site in `src`, in source order. A trailing
// parenthesis in a comment or a string does not count, and neither does a
// method call (`form.input(`) or a longer name (`my_input(`).
export function inputCallSites(src: string): InputCallSite[] {
  const sites: InputCallSite[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '#') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (QUOTES.has(ch)) {
      i = skipString(src, i);
      continue;
    }
    if (!IDENT_START.test(ch)) {
      i++;
      continue;
    }
    const start = i;
    while (i < src.length && IDENT_PART.test(src[i])) i++;
    if (src.slice(start, i) !== 'input') continue;
    if (start > 0 && src[start - 1] === '.') continue; // obj.input(...)
    let j = i;
    while (j < src.length && /\s/.test(src[j])) j++;
    if (src[j] !== '(') continue;
    sites.push({prompt: literalPrompt(src, j + 1)});
  }
  return sites;
}
