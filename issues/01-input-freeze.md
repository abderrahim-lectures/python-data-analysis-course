## 1. Runnable cells that call `input()` freeze the page

**Labels:** `type:bug`, `area:playground`, `area:python-101`
**Severity:** high (the reported bug)

### What a learner saw

On `/learn/python-101/normal/lessons/04-type-conversion/`, pressing **Run** on

```python
year_text = input("Birth year? ")   # str, always
year = int(year_text)
print(f"About {2026 - year} years old")
```

froze the tab: several seconds of unresponsiveness while a *second* Python engine downloaded and
compiled on the main thread, then a browser `prompt()` dialog with no question in it — and while
that dialog was open the page could not paint, scroll or respond. Afterwards the prompt text the
code had written was absent from the output panel, so the transcript read `About 22 years old`
with no record of what was asked. Cells that call `input()` also could not see variables defined
by earlier cells — `NameError` for names that were plainly defined above.

### Why it happens

Pyodide's stdin callback is synchronous: the interpreter blocks inside the wasm call until
JavaScript returns a line. A Web Worker therefore cannot answer it with a value that arrives
later — there is no `window`, and a synchronous cross-thread handoff would need
`SharedArrayBuffer` + `Atomics.wait`, which needs COOP/COEP response headers GitHub Pages cannot
set. The old code sidestepped that by running input cells **on the main thread** with a second
engine (`pythonGuard.usesBlockingInput` → `py()` in `runnable-cell.client.ts`) and answering
stdin with `window.prompt('')` in `runCellCode`. That is where all four symptoms come from:
the second boot, the modal blocking the main thread, the empty prompt string, and the isolated
namespace.

### Expected

The cell asks for the value, the page stays interactive, and the transcript shows the question,
the answer and the output in order.

### Fix (PR #321)

Every cell now runs in the shared worker. `pythonInputs.ts` scans the cell for `input()` call
sites, the cell renders one labelled field per call between the code and the output, and the
worker replays the values through Pyodide's stdin callback, echoing each into the transcript.
Running out of values is EOF: Python raises `EOFError`, the friendly line explains it and the
form grows one more field, so a loop that reads lines still works. `CellRuntime.stdin` is now
required and nothing calls `window.prompt`.

### Evidence

- Live page headers confirm no COOP/COEP (`server: GitHub.com`), so `crossOriginIsolated` is false.
- Blast radius: 2 snippets × 4 locales on 04-type-conversion, plus one `--interactive` CLI snippet
  behind an argparse flag no cell can set.
- Browser transcript after the fix (Firefox 157 + real Pyodide 0.26.4, real worker):
  `$ python` / `Birth year?` / `2004` / `About 22 years old`.
