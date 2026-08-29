import {useState, useCallback, useEffect, useRef} from 'react';
import {loadPyodideRuntime} from '@site/src/components/VsCodePlayground/pyodide';

interface BeginnerErrorHelp {
  friendly: string;
  hint: string;
  example: string;
  lessonLink?: string;
}

const BEGINNER_ERROR_HELP: Record<string, BeginnerErrorHelp> = {
  'SyntaxError: invalid syntax': {
    friendly: "Python can't understand that line.",
    hint: 'Check for missing colons (:), unmatched parentheses, or quotes.',
    example: '# Wrong:\nif x > 5\n# Right:\nif x > 5:',
    lessonLink: '/docs/python-101/normal/week-2#if-statements',
  },
  'SyntaxError: unexpected EOF while parsing': {
    friendly: 'Python reached the end of your code but something is incomplete.',
    hint: 'Check for missing closing parentheses, brackets, or quotes.',
    example: '# Wrong:\nprint("hello"\n# Right:\nprint("hello")',
  },
  'SyntaxError: EOL while scanning string literal': {
    friendly: 'A string is missing its closing quote.',
    hint: 'Every " must have a matching ". Check for missing quotes.',
    example: '# Wrong:\nprint("hello)\n# Right:\nprint("hello")',
  },
  'TypeError: can only concatenate str': {
    friendly: "You're trying to add text and a number together.",
    hint: 'Use str() to convert the number to text first.',
    example: '# Wrong:\nprint("Score: " + 87)\n# Right:\nprint("Score: " + str(87))',
  },
  "TypeError: unsupported operand type(s) for +": {
    friendly: "You're trying to add incompatible types.",
    hint: 'Check that both sides of + are the same type (both numbers or both strings).',
    example: '# Wrong:\nresult = "5" + 3\n# Right:\nresult = 5 + 3',
  },
  "NameError: name '...' is not defined": {
    friendly: "Python doesn't recognize that name.",
    hint: 'Did you spell it correctly? Names are case-sensitive (score ≠ Score).',
    example: '# "age" was never created:\nage = int(input("Age? "))',
  },
  'IndentationError: unexpected indent': {
    friendly: 'This line has extra spaces at the start.',
    hint: 'Python uses indentation to group code. Only indent after : (colon).',
    example: '# Wrong:\n  print("hello")\n# Right:\nprint("hello")',
  },
  'IndentationError: expected an indented block': {
    friendly: 'Python expected indented code after a colon.',
    hint: 'Add 4 spaces (or 1 tab) on the next line.',
    example: '# Wrong:\nif True:\nprint("yes")\n# Right:\nif True:\n    print("yes")',
  },
  'TabError: inconsistent use of tabs and spaces': {
    friendly: "You're mixing tabs and spaces for indentation.",
    hint: 'Use only spaces (4 spaces = 1 indent level). Never mix tabs and spaces.',
    example: '# Wrong:\nif True:\n→print("yes")\n# Right:\nif True:\n    print("yes")',
  },
  'ZeroDivisionError: division by zero': {
    friendly: 'You tried to divide by zero.',
    hint: 'Check if the denominator could be 0 before dividing.',
    example: '# Wrong:\nresult = 10 / 0\n# Right:\nif divisor != 0:\n    result = 10 / divisor',
  },
  'ZeroDivisionError: modulo by zero': {
    friendly: 'You tried to use % (modulo) with zero.',
    hint: 'The modulo operator (%) also cannot divide by zero.',
    example: '# Wrong:\nresult = 10 % 0\n# Right:\nif divisor != 0:\n    result = 10 % divisor',
  },
  'ValueError: invalid literal for int()': {
    friendly: "Can't convert that text to a number.",
    hint: 'int() only works on strings that look like whole numbers (e.g., "42", not "hello").',
    example: '# Wrong:\nnum = int("hello")\n# Right:\nnum = int("42")',
  },
  'ValueError: could not convert string to float': {
    friendly: "Can't convert that text to a decimal number.",
    hint: 'float() needs a string like "3.14", not "hello".',
    example: '# Wrong:\nnum = float("hello")\n# Right:\nnum = float("3.14")',
  },
  'TypeError: argument of type ... is not iterable': {
    friendly: "You're trying to check if something is in a non-list value.",
    hint: 'Make sure the variable is a list, string, or set before using "in".',
    example: '# Wrong:\nresult = 42 in my_number\n# Right:\nresult = 42 in [1, 2, 42]',
  },
  'TypeError: object is not subscriptable': {
    friendly: "You're trying to use [] on something that doesn't support indexing.",
    hint: 'Only lists, strings, and dicts support []. Check your variable type.',
    example: '# Wrong:\nmy_list = "hello"\nprint(my_list[0])\n# Right:\nmy_list = ["h", "e", "l"]\nprint(my_list[0])',
  },
  'IndexError: list index out of range': {
    friendly: "You're trying to access a position that doesn't exist.",
    hint: 'Lists start at 0. Use len(list) to check the size.',
    example: '# Wrong:\nmy_list = [1, 2, 3]\nprint(my_list[5])\n# Right:\nprint(my_list[2])  # Last item',
  },
  'KeyError': {
    friendly: "That key doesn't exist in the dictionary.",
    hint: 'Check the key spelling. Dictionaries are case-sensitive.',
    example: '# Wrong:\nmy_dict = {"name": "Alice"}\nprint(my_dict["age"])\n# Right:\nprint(my_dict.get("age", "unknown"))',
  },
  'AttributeError: ... object has no attribute': {
    friendly: "That object doesn't have that method or property.",
    hint: 'Check if you imported the right module. Common: pd.DataFrame, not pd.dataframe.',
    example: '# Wrong:\n"hello".append("x")\n# Right:\nmy_list = ["h", "e", "l"]\nmy_list.append("x")',
  },
  'ModuleNotFoundError': {
    friendly: "Python can't find that module.",
    hint: 'Check the spelling. Common modules: pandas, numpy, matplotlib.',
    example: '# Wrong:\nimport pondas\n# Right:\nimport pandas as pd',
  },
  'ImportError: cannot import name': {
    friendly: "That name doesn't exist in the module.",
    hint: 'Check the exact spelling. Use dir(module) to list available names.',
    example: '# Wrong:\nfrom pandas import DataFramee\n# Right:\nfrom pandas import DataFrame',
  },
  "TypeError: 'NoneType' object is not callable": {
    friendly: "You're trying to call something that doesn't return a value.",
    hint: 'This happens when you use () on a variable that is None.',
    example: '# Wrong:\nresult = print("hello")\nprint(result())\n# Right:\nprint("hello")',
  },
};

interface TerminalLine {
  id: number;
  kind: 'cmd' | 'out' | 'err' | 'info' | 'hint' | 'success';
  text: string;
}

interface UsePyodideRunnerProps {
  getCode: () => string;
  onOutput: (line: TerminalLine) => void;
  /** The command banner printed before each run (e.g. '$ python main.py'). */
  commandLabel?: string;
  /**
   * Synchronously returns one line of stdin for `input()`. Pyodide calls this
   * from the (main) thread while `runPythonAsync` blocks waiting, so it must
   * return a plain string (or null for EOF) without awaiting. Defaults to the
   * browser's native `prompt()`, which is exactly Pyodide's own default.
   */
  getStdin?: () => string | null;
}

export function usePyodideRunner({
  getCode,
  onOutput,
  commandLabel = '$ python main.py',
  getStdin,
}: UsePyodideRunnerProps) {
  const [busy, setBusy] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const prettifyError = useCallback((errorMsg: string): BeginnerErrorHelp | null => {
    for (const [pattern, help] of Object.entries(BEGINNER_ERROR_HELP)) {
      if (errorMsg.includes(pattern) || errorMsg.startsWith(pattern.split('...')[0])) {
        return help;
      }
    }
    return null;
  }, []);

  const run = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setLastError(null);
    setLoadingProgress(0);
    onOutput({id: Date.now(), kind: 'cmd', text: commandLabel});

    let hasOutput = false;
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    try {
      progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 200);

      const py = await loadPyodideRuntime();
      if (progressInterval) clearInterval(progressInterval);
      setLoadingProgress(100);

      py.setStdout({
        batched: (s) => {
          onOutput({id: Date.now() + Math.random(), kind: 'out', text: s});
          hasOutput = true;
        },
      });
      py.setStderr({
        batched: (s) => onOutput({id: Date.now() + Math.random(), kind: 'err', text: s}),
      });
      py.setStdin({stdin: getStdin ?? (() => window.prompt())});

      try {
        await py.loadPackagesFromImports(getCode());
      } catch {
        // Unknown/absent package names
      }

      await py.runPythonAsync(getCode());

      if (!hasOutput) {
        onOutput({id: Date.now(), kind: 'success', text: '✓ Code ran successfully'});
      }
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      onOutput({id: Date.now(), kind: 'err', text: errorMsg});
      setLastError(errorMsg);

      const help = prettifyError(errorMsg);
      if (help) {
        onOutput({id: Date.now() + 1, kind: 'hint', text: `💡 ${help.friendly}`});
        onOutput({id: Date.now() + 2, kind: 'hint', text: `   Try this: ${help.hint}`});
        onOutput({id: Date.now() + 3, kind: 'hint', text: `   Example:\n${help.example}`});
        if (help.lessonLink) {
          onOutput({id: Date.now() + 4, kind: 'hint', text: `   📖 See this in the lesson: ${help.lessonLink}`});
        }
      }
      return false;
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setBusy(false);
      setLoadingProgress(0);
      busyRef.current = false;
    }
  }, [getCode, onOutput, prettifyError, commandLabel, getStdin]);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {busy, loadingProgress, lastError, run, clearError};
}
