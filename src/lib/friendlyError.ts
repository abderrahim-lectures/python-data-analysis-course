// Maps raw Pyodide error messages to beginner-friendly hints shown in the
// cell output. Purely string logic so it's unit-testable without a DOM.

export const BEGINNER_ERRORS: Record<string, string> = {
  'SyntaxError: invalid syntax': "Python can't understand that line. Check for missing colons (:), unmatched parentheses, or quotes.",
  'TypeError: can only concatenate': "You're trying to add text and a number. Use str() to convert the number first.",
  'NameError: name': "Python doesn't recognize that name. Did you spell it correctly? Names are case-sensitive.",
  'IndentationError: unexpected indent': "Python uses indentation. Check your spaces vs tabs — be consistent.",
  'IndentationError: expected an indented block': "After a colon (:), the next line must be indented.",
  'ZeroDivisionError': "You can't divide by zero. Check your denominator.",
  'ValueError: invalid literal for int()': "Can't convert that to a number. Make sure it's digits only.",
  'ModuleNotFoundError': "This package isn't available in the browser. Try importing built-in Python modules only.",
  // The cell's input fields were used up: the code asked input() for more
  // values than were supplied (typically a loop). Say what to do instead of
  // leaving the beginner with a bare traceback.
  'EOFError': 'This cell ran out of input values. Add one more value to the fields above the output, then run it again.',
  // Files are only preloaded when the page names them literally somewhere, so
  // a path built from a variable can 404 inside the virtual filesystem.
  'FileNotFoundError': "That file isn't loaded in this page. Check the spelling, and open it by its literal name once (e.g. open('data.csv')) so the page knows to load it.",
  'No such file or directory': "That file isn't loaded in this page. Check the spelling, and open it by its literal name once (e.g. open('data.csv')) so the page knows to load it.",
};

export function friendlyError(msg: string): string {
  for (const [pattern, hint] of Object.entries(BEGINNER_ERRORS)) {
    if (msg.includes(pattern)) return hint;
  }
  return msg;
}

export interface ExplainContext {
  /** Every *other* runnable cell's source on the page. */
  otherCellSources?: string;
  /** The cell that failed, so the cell that loads the data is not nagged. */
  code: string;
  /** Localized suffix for the "load the dataset first" hint. */
  loadDatasetFirstHint: string;
}

export interface ExplainedError {
  /** What the engine raised, verbatim — shown first, because a lesson may be
   *  teaching that exact exception. */
  raw: string;
  /** The beginner-facing sentence, shown after it. */
  hint: string;
}

/**
 * Turns a raw Pyodide error into the two lines the output panel shows.
 *
 * Beyond the static map above there is one context-dependent case: a name that
 * should exist but hasn't been created yet usually means the page's
 * dataset-loading cell hasn't been run. That is only worth saying when the
 * missing name is literally assigned by another cell (`df = pd.read_csv(...)`)
 * and this cell does not load data itself.
 */
export function explainRunError(raw: string, ctx: ExplainContext): ExplainedError {
  let hint = friendlyError(raw);
  const missing = raw.match(/NameError: name '([^']+)' is not defined/)?.[1];
  if (
    missing &&
    ctx.otherCellSources &&
    new RegExp(`\\b${missing}\\s*=\\s*(?:pd\\.read_csv|open\\s*\\(\\s*['"][^'"]+\\.csv)`).test(ctx.otherCellSources) &&
    !ctx.code.match(/pd\.read_csv\s*\(|open\s*\(\s*['"][^'"]+\.csv/)
  ) {
    hint += ` ${ctx.loadDatasetFirstHint}`;
  }
  return {raw, hint};
}