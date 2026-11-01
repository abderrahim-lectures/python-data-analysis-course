# Runtime audit — November 2026

**Scope:** the in-browser Python runtime — `runnable-cell.client.ts`, `pyodide.worker.ts`,
`pythonRunnerCore.ts`, `pyodideWorkerClient.ts`, `pythonGuard.ts`, `datasetMount.ts`,
`gameState.ts` — plus the toolchain needed to check them.
**Method:** source reading, targeted probes run in this VM (Node 24.9.0 on `PATH` from
`~/.local/bin`, CPython 3 for Python semantics), and the repo's own unit suite
(`vitest run tests/unit`: **1238 passed, 24 files**).
**Not available here:** a browser and an Astro build (see §6) — so nothing in this report
rests on a rendered page; every claim is either read from source or reproduced by a command
quoted next to it.

| # | Severity | State | Finding |
|---|----------|-------|---------|
| B1 | HIGH | **fixed in this tree** | Cells calling `input()` booted a second Pyodide on the main thread and froze the tab behind `window.prompt('')` |
| B2 | MED | **fixed in this tree** | Input cells ran in a *separate* engine, so they could not see variables defined by earlier cells |
| B3 | HIGH (security) | **fixed (guardrail; boundary still structural)** | `pythonGuard.usesJsBridge` was bypassable at least nine ways; every demonstrated route is now refused, and the four payloads are regression tests |
| B4 | LOW | **fixed** | `lessonReward` was read from the DOM in `runnable-cell.client.ts` and never used — removed |
| B5 | LOW | **fixed** | `FileNotFoundError` had no friendly mapping — the dataset hint now explains the literal-name rule |
| B6 | LOW | **fixed** | Enter in an input field now runs the cell; loop-driven `input()` still costs one Run per value (by design) |

---

## B1 — `input()` froze the page (fixed)

**Symptom, as reported:** on `/learn/python-101/normal/lessons/04-type-conversion/`, pressing
Run on a cell that calls `input()` froze the page.

**Cause.** `pythonGuard.usesBlockingInput(src)` matched `\binput\s*\(`, and
`runnable-cell.client.ts` routed such cells to `py()` — a *second* Pyodide engine created on
the **main thread** — where `runCellCode` answered stdin with
`window.prompt('') ?? ''`. Three costs stacked: (1) the second engine's download/compile ran
on the main thread (the freeze the report describes), (2) `prompt()` is a modal that blocks the
main thread for as long as it is open, and (3) the prompt string passed to it was `''`, so the
question the code wrote to stdout was never in the dialog.

**Blast radius, counted from the content:** two runnable snippets in
`python-101/normal/04-type-conversion.md` × 4 locales = 8 rendered cells, plus the
`--interactive` CLI snippet in `python-101/hard/10-cli-generator.md` (its `input()` sits behind
an argparse flag no cell can set).

**Fix (in this tree).** Every cell, `input()` included, runs in the shared worker.
`pythonInputs.ts` scans a cell for `input()` call sites (string/comment-aware, prompt literals
decoded), the cell renders one labelled field per call (`cell__stdin`) between the code and the
output, and the worker replays the values through Pyodide's synchronous stdin callback,
echoing each into the transcript (`o-line--in`). Running out of values is EOF → Python raises
`EOFError` → a friendly line plus one extra field. `CellRuntime.stdin` is now required and no
code path calls `window.prompt`.

**Tests added:** `tests/unit/pythonInputs.test.ts` (9 cases), `tests/unit/stdinQueue.test.ts`
(4), three DOM-wiring cases in `tests/unit/runnable-cell.test.ts`, one `EOFError` mapping case
in `tests/unit/dataset-mount.test.ts`.

## B2 — input cells were isolated from the rest of the page (fixed as a consequence)

Two engines meant two Python namespaces: `year = 2004` in cell 1 was a `NameError` in cell 2 if
cell 2 called `input()`. The worker path keeps one engine per page, so cells now share globals
as a notebook would; the only remaining reason a cell runs in-page is a test-injected engine.

## B3 — the bridge guard is bypassable (open, security)

`pythonGuard.ts` refuses five classes of source before executing it: `import js|pyodide`,
`from js|pyodide import`, `__import__("js")`, `importlib.import_module("js")`, dynamic
execution (`exec|eval|compile(` anchored on `[^\w.]`), and a list of introspection dunders.
It is a text scan, and `audit-report.md` F10 records it as "bypassable via Unicode escapes",
rated **INFO** because "impact is self-only (attacker on their own page accessing their own
`localStorage`)".

That severity is wrong, and the bypass is worse than a Unicode curiosity:

1. **Threat model.** The guard exists for shared links: `notFoundPlayground.client.ts` renders
   `/playground/<base64-gzip-code>` as a runnable cell (the old `?code=` route is gone, though
   `pythonGuard.ts` and `codeShare.ts` still mention it in comments), so the code is
   **attacker-written** and runs on **the viewer's** origin after one Run click. That origin holds the viewer's
   `localStorage` (XP, streak, completed lessons, quests) and the anonymous Supabase session;
   `fetch` from the cell reaches the same-origin Supabase endpoints with the page's anon key.
   None of that is the attacker's own data.
2. **Four payloads pass the scan** (verified with `usesJsBridge` in this VM — all `ALLOWED`):

   ```python
   m = __import__("\u006a\u0073"); print(m.window.localStorage.getItem("pyda-state"))
   __import__("builtins").exec("from " + "js import window")
   E = __import__("builtins").exec; E("import " + "js")
   __import__("builtins").exec(__import__("base64").b64decode("ZnJvbSBqcyBpbXBvcnQgd2luZG93").decode())
   ```

   Why each passes: `DYNAMIC_EXEC` deliberately excludes a receiver preceded by `.`, so
   `builtins.exec(...)` and `obj.exec(...)` never match; `builtins\s*\.\s*__import__` only
   catches that exact attribute order; and `__import__` is deliberately allowed by the dunder
   list. `"\u006a\u0073"` is decoded by CPython at compile time to `js`, so the bridge regex
   sees no `"js"` literal. The last two payloads also defeat any rule that keys on the words
   `from js import` by splitting them.
3. **Python semantics confirmed** (CPython 3 in this VM): `__import__('\u006f\u0073')` resolves
   to `os`; `__import__('builtins').exec(<decoded base64>)` executes and mutates the caller's
   globals.

**Impact, stated precisely — and corrected after measuring it.** No passwords or emails are
involved (auth is anonymous), so this is not account takeover. The original paragraph here said
a bypass reads the viewer's `localStorage` and rewrites the DOM; that was true of the old
main-thread engine. Since every cell now runs in the worker, the reachable globals are
`fetch`, `indexedDB`, `caches`, `location`, `self`, `navigator` and `importScripts` — measured,
not assumed (R10). So an attacker gets same-origin `fetch` (the site's own endpoints, the
public anon key), origin caches, and code loading into the worker: spam and reconnaissance, not
the learner's saved progress. Still worth refusing — the guard is what makes a shared link
inert — but the rating should reflect the worker boundary.

**Fixed (November 2026), as a guardrail.** `pythonGuard.ts` now refuses every route listed above, in
the *form that escapes* rather than as bare words: `__import__`, `builtins`/`importlib`/`marshal`/`sys`/`types`
by `import x`, `x.` or `x(`, and `vars`/`globals`/`locals` by call (so `sns.pairplot(df, vars=[...])` and a
comment saying "column names and types" still pass). The dunder list grew to the introspection hooks that
walk an object to the class graph (`__self__`, `__class__`, `__dict__`, `__getattribute__`, `__code__`,
`__reduce__`, …) while leaving `__name__`/`__main__` alone, since lessons use `if __name__ == "__main__":`.
Those payloads — plus the lexical variants a review of the guard itself turned up (below) — are tests in
`tests/unit/pythonGuard.test.ts`, and all **1576** lesson python fences were replayed through the guard:
**0 refused**, so no lesson cell changes behaviour.

That is a guardrail, not a boundary — the arms race continues (`marshal`+`types` was one I had to add, and
another bytecode-shaped route probably exists). The real fix is still structural:

1. **Structural (recommended): stop executing shared code in the site's origin.** The threat
   is a link, so isolate the link: render `/playground/<code>` in a
   `<iframe sandbox="allow-scripts">` — an opaque origin with no access to the parent's
   `localStorage` or cookies. GitHub Pages sends `access-control-allow-origin: *`, so the frame
   can still fetch `/pyodide/*` from the same host. Lesson cells stay in the main document
   (they are trusted, first-party content). Two things to prototype rather than assume: a
   same-origin `new Worker(...)` is blocked from an opaque origin, so the frame either runs
   Pyodide on its own main thread (a separate thread from the top document, so a slow frame
   does not freeze the lesson) or boots the worker from a `blob:` URL and pays the CORS cost;
   and `?code=`/`/playground` would need its own copy of the cell chrome. Still the only option
   that removes the class instead of shrinking it.
2. **If shared code must stay in-origin: harden at the import layer, and test it against a real
   engine.** A `sys.meta_path` finder that refuses `js`/`pyodide` (and submodules) plus a
   whitelist-checking `__import__` in the cell's `__builtins__`, with `exec`/`eval`/`compile`
   removed. Two traps to handle: Pyodide imports `js` itself during boot, so `sys.modules['js']`
   already exists and a plain `import js` would never consult the hook — the hook must also
   guard that lookup; and a cell can reach the real builtins through `sys.modules`, so `sys`
   needs the same treatment. This is the kind of change that has to be exercised against the
   vendored engine, not reasoned about — which is why it is not in this batch.
3. Keep the regex as a cheap first screen (it stops the obvious payload before the engine ever
   sees it) and treat it as UX, not as the boundary. Add the four payloads above to
   `tests/unit/pythonGuard.test.ts` as *documented known bypasses* only in the same change that
   lands (1) or (2) — asserting them today would encode the bypass as intended behaviour.

**Also worth noting (false positives, low cost):** any cell that mentions `compile(` as a bare
name, or the words `__builtins__`/`__subclasses__` in prose, is refused. That is the documented
trade for a regex screen and is fine once the real boundary is fix (1).

## B4 — `lessonReward` was dead (fixed, LOW)

`runnable-cell.client.ts` read `data-lesson-xp` into `lessonReward` and never used it;
`awardLessonXp()` calls `addXP(lessonId)`, which awards `XP.LESSON_RUN` (5 XP). The frontmatter
`xpReward` in the lesson header ("⚡ +50 XP") is only honoured by `completeLesson()` (the "Mark
complete" button), which is a separate action. The dead read is gone; wiring it into the cell-run
award would be an economy change, not a bug fix, so it stays a deliberate split: running code
pays 5 XP, completing the lesson pays `xpReward`.

## B5 — dataset mounting only sees literals (fixed, LOW)

`DATASET_FILE_RE` requires a quoted filename, so `open(path)` / `pd.read_csv(path)` mount
nothing. Nine lessons use a variable path (`python-101/hard/*`), but every one of them also
mentions the file literally somewhere on the page, and mounting is page-wide, so no lesson is
currently broken by this. It *is* the failure mode waiting for the first lesson that only does
`path = "x.csv"; open(path)`: the page fetches nothing and the learner gets a bare
`FileNotFoundError` — `friendlyError` has no mapping for it, and the "load the dataset first"
hint only fires for `NameError`. Fixed by the cheap half: `friendlyError` now maps `FileNotFoundError` / `No such file or
directory` to that explanation, so the learner sees "open it by its literal name once ... so the
page knows to load it" instead of a raw errno. Mounting the whole manifest on first run remains
the alternative if a lesson ever needs it.

## B6 — residual limits of the new input path (fixed where it can be)

- **Enter now submits.** A `keydown` listener on each `cell__stdin-input` routes Enter to Run,
  which is what a field asking a question should do (covered by a DOM-wiring test).
- **Loops cost one Run per value.** A statically-visible call site gets one field; a loop that
  reads more hits `EOFError`, grows the form by one field, and needs another Run. Honest and
  non-hanging, but the `while` CLI generator is a many-Run cell.
- **Interpolated prompts get a numbered label.** `input(f"{name}: ")` has no static text, so the
  field reads "Value 1"; `input(DYNAMIC)` likewise. The transcript still prints the real prompt
  when Python writes it.
- **The values are asked for before the run**, so a cell that prints context before asking
  cannot use that context to label the field. Accepted trade — see §6 for the alternative and
  why it is not shipping.

---

## Review round — what reviewing this change found

The fixes above were themselves reviewed before being called done. Five defects, all fixed and covered:

| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| R1 | **HIGH** | The guard was defeated by *backslash line continuation*: Python deletes `\`+newline before tokenizing, so `import \⏎js`, `exe⏎c("...")` and `__imp⏎ort__("js")` all passed every rule. | `usesJsBridge` now joins continuations (`/\\\r?\n/g` → `''`) before testing — the text the interpreter actually sees. Tests for `import`/`exec`/`__import__`/`sys`, CRLF included. |
| R2 | **HIGH** | `import os, sys` was not caught (the import rule required the dangerous module to be *first* in the list); `x = sys` then `x.modules["js"]` reached the bridge. | The import rule now matches a dangerous name anywhere in the statement (`\bimport\b[^\n]*…`), so `import json, sys`, `from os import path, sys` and `import json, types` are refused. |
| R3 | MED | Enter in a *non-last* input field ran the cell immediately, so a two-question cell executed with the second answer empty (`int('')` → ValueError). | Enter now advances to the next field and only runs from the last one — what a terminal does. DOM test covers both halves. |
| R4 | LOW | `rb"…"` / `br"…"` string prefixes were not recognised (the prefix window was 2 characters), so the field fell back to "Value 1" instead of the prompt. | Prefix window widened; tests for `r`, `rb`, `R`. |
| R5 | LOW | `CellRuntime.stdin` became required but three test literals omitted it, so `tsc` flagged the test file; the fake engine also lacked `FS.mkdirTree`. | Fixed — `tsc --noEmit` now reports only the four files that need `astro sync`'s generated types. |
| R7 | **MED** | **Found in the real-user pass**: the friendly-error layer *replaced* the exception text, so `int("hello")` and `age + 1` showed only the hint — while 04-type-conversion quotes `ValueError: invalid literal for int()` and `TypeError: can only concatenate str (not "int") to str` verbatim. The lesson's own point never appeared in the panel. | The raw exception is printed first, the hint after it. |
| R8 | **MED** | **Found in the real-user pass**: pressing Enter in an editable cell put the caret *before* the newline (a caret cannot sit after a trailing newline inside a `<pre>`), so the next characters landed on the previous line — "a = 1" + Enter + "b = 2" ran as `a = 1b = 2` with an empty second line, and `b = 2` was silently part of the first statement. | A trailing `<br>` gives the caret a home after the newline when the source ends with one; verified by typing two lines and running them in the browser. |
| R9 | **HIGH** | **Found by fuzzing the guard, confirmed in the browser**: two whole families still reached `js`. (a) `E = exec` / `E = eval` binds the builtin to a name, so no `exec(` ever appears. (b) stdlib modules that compile and run strings: `code.InteractiveInterpreter().runsource(...)`, `timeit.timeit(...)`, `profile`/`cProfile.run(...)`, `trace.Trace().run(...)`, `runpy.run_module(...)`, `pdb.Pdb().runsource(...)`. With `"import " + "js"` split across literals, each of them executed `import js` against the real engine (the error was `AttributeError: window`, i.e. the module had been obtained). | The bare names `exec`/`eval`/`compile` are refused (attributes like `re.compile`/`model.eval()` still pass), and imports of those seven stdlib modules plus `_pyodide` are refused. 24-payload fuzz corpus: 13 escapes before, 0 after (the two survivors are `unittest` loading a module and `ast.literal_eval`, neither of which executes a string). |
| R10 | **MED — corrects B3's impact** | The B3 impact paragraph (inherited from the pre-fix main-thread design) says a bypass reads the viewer's `localStorage` and rewrites the DOM. In the **worker**, `js` exposes `fetch`, `indexedDB`, `caches`, `location`, `self`, `navigator`, `importScripts` — and **not** `localStorage` or `document`. Measured in the browser with the `E = exec` route: `CAP ['fetch', 'indexedDB', 'caches', 'location', 'self', 'navigator', 'importScripts']`. | The guard still matters (same-origin `fetch` with the page's credentials, Cache Storage, `importScripts`), but the rating drops from "can read the learner's progress" to "can call the origin's endpoints and read origin caches". The structural fix (opaque-origin iframe) remains the boundary. |
| R6 | **MED** | **Found only in a real browser**: the transcript read `2004` *above* `Birth year?`, with the prompt glued to the next line (`Birth year? About 22 years old`). Pyodide's batched stdout only hands JS a complete line — a flushed partial one stays buffered (`print("X", end="", flush=True); print("Y")` renders as `XY`), so `input()`'s newline-less prompt arrived after the echoed answer. | `input()` is wrapped at engine boot (`INPUT_SHIM_SRC`) to write the prompt as a whole line before reading, so the panel reads prompt → answer → output. Verified in the browser (§6). |

Two dead exports found in the same pass (`needsStdin` in `pythonInputs.ts`, `remaining()` on the stdin queue) were removed rather than left as API nobody calls.


---

## 6 — Toolchain: what this VM can and cannot run, measured

- **Node is installed and on `PATH` for every project**: `~/.local/bin/node` →
  `~/.local/lib/node-v24.9.0-linux-x64` (`node -v` → `v24.9.0`, `npm` → `11.6.0`). The VM ships
  no Node, so this is what makes `vitest`/`tsc`/`npm` usable at all — and **Node 22.14 cannot
  run this repo's vitest**: it dies before any test with `RangeError: WebAssembly.instantiate():
  Out of memory`. Node 24 runs the full suite.
- **`astro build` / `astro dev` / `astro sync` cannot run here**, for an environment reason
  worth recording because it will bite anyone else in this VM:

  ```
  $ node --require .scratch/wasm-trace.cjs node_modules/astro/bin/astro.mjs sync
  [wasm] #1 size=Module vm=3301MB   → ok, vm=11493MB
  [wasm] #2 size=Module vm=11493MB  → ok, vm=19685MB
  [wasm] #3 size=3105  vm=28216MB   → FAILED: Cannot allocate Wasm memory for new instance
  ```

  Every wasm memory costs ~**8.2 GB of address space** in V8 (a fixed guard region; the
  module's declared maximum does not change it — I rewrote `astro.wasm`'s memory section to
  declare a 256 MB max and the reservation stayed at 8.2 GB). The process instantiates the
  5 MB compiler binary **twice** and then `xxhash-wasm` (3 KB, from `xxhash-wasm/esm`); a build
  would add Shiki's `onig.wasm` on top. `ulimit -v` is **32 GB** and cannot be raised
  (`ulimit -v unlimited` → `Operation not permitted`), so the third instance is where it
  dies. This is why there is no
  browser check in this report: no build, no `astro preview`, no e2e (`tests/e2e/*` all need
  `BASE_URL`), and no headless Chrome (`chrome-headless-shell` traps on startup in this VM,
  even for `--version`).
- **A browser does exist here — Firefox, not Chromium.** Playwright's Firefox 157 launches;
  Playwright's Chromium 156 (headless shell and full build) and chrome-for-testing 141 both die
  with `SIGTRAP` before printing `--version`, so no Chromium-family engine can run in this VM.
- **What that leaves verifiable here:** the unit suite, `tsc` on the modules (still noisy from
  the *pre-existing* missing `astro:content`/`import.meta.env` types, which `astro sync` would
  generate), Python-semantics probes like the ones in B3 — and, via Vite + Playwright Firefox, the
  real cell runtime (below).

### Browser check actually performed

`public/pyodide/` was vendored (`scripts/vendor-pyodide.mjs`) and Vite served a harness page that
mounts the **real** `runnable-cell.client.ts` and therefore the real `pyodide.worker.ts`, the real
engine and the real form; Firefox drove it. Results:

| Scenario | Observed |
|---|---|
| The reported lesson cell (`year_text = input("Birth year? ")`, then `int`, then an f-string) | field labelled `Birth year?`; transcript `$ python` / `Birth year?` / `2004` / `About 22 years old` — prompt, echoed answer, output, in that order |
| Two questions (`Name?`, `Year?`) | Enter moved focus to the second field; Enter there ran the cell; `Amina was born in 2004` |
| One call site, three calls (`for _ in range(3): print(input("Value? "))`) | first answer consumed, then `EOFError` → friendly line, form grew from 1 field to 2 |
| `import js` | refused: "Blocked: this snippet uses something the in-browser sandbox refuses…" |

Then a full pass over the reported lesson as a learner sees it — **all eight** code fences of
`04-type-conversion.md` rendered as cells from the lesson's own markdown and run in order — plus
the lesson's three quiz questions:

| Surface | Observed |
|---|---|
| Cells 1–3, 5, 8 (`int`/`float`/`str`/`bool`, truncation vs round, `math.floor`, the sensor example) | the documented output: `False`, `4`, `-4`, `3`, `3 units` |
| Cell 4 `int("hello")`, cell 7 `age = input(); age + 1` | the traceback the lesson quotes (`ValueError`, `TypeError`) followed by the hint |
| Cell 6 `year_text = input("Birth year? ")` | `Birth year?` / `2004` / `About 22 years old` |
| Quiz (one wrong, two right) | per-question feedback, the question locks after answering, summary `You got 2/3 right.`, `pda:state` written |
| Editing a cell (type two lines, add an `input()` call, run) | newline stays on its line, gutter renumbers, the new field appears labelled with the new prompt, cell runs |

No console errors in any of the runs.

### Link check

The branch changes no page content, so the rendered link graph is the published one. A crawl of
the live site from `/` — **1047 pages fetched, every internal link followed** — found **three**
broken links, all the same mistake: the localized learn hubs linked the *English* cheatsheet
slug with a locale prefix (`/es/cheatsheets`, `/ar/cheatsheets`, `/fr/cheatsheets`) instead of
the localized routes (`/es/referencias`, `/ar/ملخصات`, `/fr/antiseche`). The three
`learn_hub_cheatsheets_hint` messages are fixed; everything else resolved 200. That is what caught R6: the ordering bug is invisible to a
DOM stub, because the stub never had a real Pyodide stream to buffer the prompt.

## 7 — Re-checked against the September audit

- F1 (XP display ≠ awarded): partly addressed since — `LESSON_COMPLETE` is now the fallback
  `10`, and `completeLesson(lessonId, reward)` accepts the frontmatter value — but the
  cell-run path still pays a flat `LESSON_RUN` (B4 above).
- F2/F3: `STREAK_MILESTONE` is now paid in `evaluateMilestones` (`gameState.ts:382`);
  `awardDailyLogin` has a caller (`gamestrip.client.ts:161`). Both look closed.
- F10 (guard bypassable): fixed as a guardrail — nine routes refused and covered by tests, with the
  structural boundary still recommended (B3). Its "impact is self-only" reading is still wrong: the
  vector is a shared `/playground/<code>` link running on the *viewer's* origin.
