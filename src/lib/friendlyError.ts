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
};

export function friendlyError(msg: string): string {
  for (const [pattern, hint] of Object.entries(BEGINNER_ERRORS)) {
    if (msg.includes(pattern)) return hint;
  }
  return msg;
}