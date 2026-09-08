---
title: "Build an AI Test Generator"
description: "Point a generator at a pure Python function, have it read the signature and defaults, synthesize boundary and property test cases, optionally ask an LLM for intent tests, then run the whole suite and report green or red."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Developer Tools", "Testing", "LLMs"]
prerequisites:
  - "Functions, defaults/arguments, and list comprehensions"
  - "A basic mental model of what a unit test is (assert + expected output)"
  - "No pytest experience needed — the generator writes the tests for you"
learningObjectives:
  - "Read a function's signature and parameter metadata with inspect.signature"
  - "Derive boundary-value test inputs from parameter defaults instead of guessing by hand"
  - "Synthesize a pytest module programmatically from those inputs plus property checks"
  - "Compose an LLM 'intent test' prompt and degrade gracefully when no API key exists"
  - "Run the generated suite as a subprocess and turn its exit code into a verdict"
---

# 🛠️ 🧪 Build an AI Test Generator

Writing tests by hand feels like re-typing the function you just wrote, only slower. This project builds the inverse: a generator that *reads* a target function — its signature, defaults, and behavior — and produces a pytest suite that exercises real boundaries, real properties (like idempotence), and a swapped-arguments safety net. An optional LLM layer drafts "intent tests" that capture what the function is *supposed* to do, and the whole suite runs as a subprocess so your tool reports the verdict in one line. The target function is a tiny `clamp`, so every generated test is easy to eyeball — the machinery, not the math, is the point.

This assumes solid function defaults and list comprehension fluency; nothing here is graded, it's optional and ungraded — see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Inspect a function's signature and discover which parameters have defaults and which don't.
2. Generate boundary candidate inputs from those defaults — not from guessing.
3. Render those candidates into a real pytest module, including property and guard tests.
4. Compose an LLM "intent test" prompt and skip the API call gracefully when no key is configured.
5. Run the generated suite via subprocess and translate the output into a verdict.

## Where to run this

**Locally with `uv`** is the recommended path — the whole point is generating real `.py` test files on your disk and running them, which `uv add pytest` makes instant.

**Google Colab, Kaggle Notebooks, and Binder** will run every step: `!pip install pytest` then `import pytest` — the generator writes a `test_*.py` file into the notebook's working directory, and `subprocess` runs it against the same environment. Notebooks are a fine venue; the one thing they can't give you is a permanent `test_clamp_simple.py` after the session ends.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-test-generator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-test-generator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-test-generator%2Fnotebook.ipynb)

## Setup

Everything needed before generation: a project with pytest, and one gloriously simple target function to point the generator at.

### Set up the project

```bash
uv init ai-test-generator
cd ai-test-generator
uv add pytest
```

`pytest` powers both the generated suite *and* the naive case-list runner in Step 5. Later steps assume you write all code into one file, `testgen.py`.

**✅ Checklist**

- ✅ `uv add pytest` completes, and `uv run python -m pytest --version` prints a version.
- ✅ You have `testgen.py` created and ready for Step 1.

**🤔 Socratic Question(s)**

- The generator targets `clamp`, a function with defaulted params. Which part of `inspect.signature` tells you a parameter *requires* an argument, and why will the generator need to treat those two kinds of parameters differently?
- Every test the generator writes is *executed* at the end, but only by comparing behavior to an expected value it also generated. Where does "the machine tests the machine" become circular, and what kind of test can't be faked that way?

## Step 1: Read the target's signature

### 1.1 Define the target and dump its signature

**👟 Starter hint:** Write `clamp(value, low=0.0, high=1.0)` — the classic numeric guard — then ask `inspect.signature` what it knows.

```python
# testgen.py
import inspect

def clamp(value, low=0.0, high=1.0):
    """Clamp a number into [low, high]."""
    return max(low, min(value, high))

sig = inspect.signature(clamp)
for name, param in sig.parameters.items():
    print(name, "kind=", param.kind, "default=", param.default)
```

`clamp` returns `max(low, min(value, high))` — one line, but dense: it pins `value` from below at `low` and from above at `high`. `inspect.signature` hands back a `Signature` whose `.parameters` maps each argument name to a `Parameter` carrying `.kind` (how it may be passed) and `.default`.

**🎯 Expected output:**

```
value kind= POSITIONAL_OR_KEYWORD default= <class 'inspect._empty'>
low kind= POSITIONAL_OR_KEYWORD default= 0.0
high kind= POSITIONAL_OR_KEYWORD default= 1.0
```

**🩹 If it's off:** If `sig.parameters` is empty, the `for` loop is reading the wrong callable — print `sig` and check it says `(value, low=0.0, high=1.0)`. If `default=` prints nothing for `low`, `clamp` was defined without defaults.

### 1.2 Spot which defaults are real

**👟 Starter hint:** Write a tiny predicate `has_default(param)` — `inspect.Parameter.empty` is a *marker*, so the `is` test is the correct spelling.

```python
# testgen.py (continued)
def has_default(param: inspect.Parameter) -> bool:
    return param.default is not inspect.Parameter.empty

for name, param in sig.parameters.items():
    print(name, "requires argument:", not has_default(param))
```

Python's `is`/`is not` on singletons is the idiomatic comparison — `Parameter.empty` is a sentinel object, and `==` can be fooled by anything you accidentally name-identical. The generator needs this distinction so it knows `low`/`high` have usable seed values while `value` needs humans-style guesses.

**🎯 Expected output:** `value requires argument: True`, then `False` for both `low` and `high`.

**🩹 If it's off:** If `low` reports `requires argument: True`, you compared with `==` or `is` to a *fresh* `inspect.Parameter.empty` — use `param.default is not inspect.Parameter.empty` verbatim.

### 1.3 Verify the inspection

**✅ Checklist**

- ✅ All three parameter names, kinds, and defaults print exactly as in 1.1.
- ✅ `has_default` distinguishes `value` from `low`/`high` correctly.
- ✅ `sig.parameters["low"].default` is `0.0` (a float, not a string).

**🤔 Socratic Question(s)**

- `sig` is computed once and reused everywhere. What breaks if the generated tests are written against a *later*, edited version of `clamp` — and why is regenerating from the live signature safer than caching it?
- Parameter defaults are Python objects, so `clamp(value, low=0, high=1)` (ints) yields `0`/`1`, not `0.0`/`1.0`. Which generated-test line would silently differ, and is that a test difference or a type difference?

## Step 2: Generate boundary inputs from the defaults

Hand-writing test inputs means testing what you *imagined* was dangerous. This generator instead derives candidates from the signature itself: each default, nudged above and below, plus the canonical numeric edges.

### 2.1 Build the edge-value helper

**👟 Starter hint:** For a defaulted parameter, produce `[default-1, default-0.1, default, default+0.1, default+1]` plus `0.0` and `1.0`, deduplicated; for a no-default parameter, fall back to the classic `[-1.0, 0.0, 0.5, 1.0]` probe set.

```python
# testgen.py (continued)
def edge_values(param: inspect.Parameter) -> list[float]:
    if not has_default(param):
        return [-1.0, 0.0, 0.5, 1.0]
    d = param.default
    probes = {d - 1.0, d - 0.1, d, d + 0.1, d + 1.0, 0.0, 1.0}
    return sorted(round(x, 2) for x in probes)

for name, param in sig.parameters.items():
    print(name, "->", edge_values(param))
```

The probes are the *boundary vocabulary* of numeric functions: one step above and below a bound, the bound itself, and the two anchors `0.0`/`1.0`. `round(x, 2)` is the reality check — binary floating point makes `0.1` genuinely ugly (e.g. `0.10000000000000003`), and the generated tests should compare clean decimal literals.

**🎯 Expected output:**

```
value -> [-1.0, 0.0, 0.5, 1.0]
low -> [-1.0, -0.1, 0.0, 0.1, 1.0]
high -> [0.0, 0.9, 1.0, 1.1, 2.0]
```

**🩹 If it's off:** If a row shows `0.10000000000000003` instead of `0.1`, the `round` got dropped. If `value` shows floats built from `d` (it has no `d`), `has_default` returned `True` for a no-default parameter — the sentinel comparison reversed.

### 2.2 Explain the choices before running

**👟 Starter hint:** Print the *reason* each candidate was chosen — a generated test without a story is just noise.

```python
# testgen.py (continued)
for name, param in sig.parameters.items():
    values = edge_values(param)
    note = "handpicked probe set" if not has_default(param) else "nudged around the default"
    print(f"{name}: {values} ({note})")
```

Hanging an explicit reason on every candidate makes the generator auditable: when a future reviewer asks "why test `1.1`?", the note says "one step above `high`'s default". That auditability is the difference between generated tests and a test *oracle*.

**🎯 Expected output:** Two lines for `low`/`high` saying `nudged around the default`, and one for `value` saying `handpicked probe set`.

**🩹 If it's off:** If every line says "handpicked", the `has_default` branch is wrong. If a line says "nudged around the default" for `value`, `value`'s default is silently empty again.

### 2.3 Verify the inputs

**✅ Checklist**

- ✅ `edge_values` is deterministic — same call, same list, in any order of invocation.
- ✅ No duplicate floats appear within a candidate list, and every value is `round`ed to 2 decimals.
- ✅ Each candidate traceable to a reason (probe set or default-nudge).

**🤔 Socratic Question(s)**

- `edge_values` assumes numeric parameters. What does the same function return for a parameter whose default is `"hello"` — and how would you extend the helper so a later call could pass in a *string* probe set?
- Two of the generated candidates (e.g. `-1.0` and `1.0`) would test identical behavior for *some* functions. What does a smart disambiguator need to know that `edge_values` currently can't see?

## Step 3: Render a pytest module

Now the candidates become Python: a real `test_clamp_simple.py`, where each test is a `test_*` function that imports `clamp` and asserts a generated expectation.

### 3.1 Compose the test source as strings

**👟 Starter hint:** Render each `value` candidate into a `def test_<name>():` asserting `clamp(v) == max(low, min(v, high))`, using the signature's real default floats as the expected-value template.

```python
# testgen.py (continued)
def render_case(value: float) -> str:
    name = str(value).replace(".", "p").replace("-", "neg")
    low, high = sig.parameters["low"].default, sig.parameters["high"].default
    return (f"def test_value_at_{name}():\n"
            f"    assert clamp({value}) == max({low}, min({value}, {high}))\n")

parts = ["from testgen import clamp", ""]
for v in edge_values(sig.parameters["value"]):
    parts.append(render_case(v))
print(render_case(0.5))
```

The expected-value expression is *built from the same defaults the signature carries* — better than `== clamp(v)`, which would test a function against itself and prove nothing. The name transform `0.5 → value_at_0p5` maps floats into valid, readable identifiers; `-1.0 → value_at_neg1p0`.

**🎯 Expected output:**

```
def test_value_at_0p5():
    assert clamp(0.5) == max(0.0, min(0.5, 1.0))
```

**🩹 If it's off:** If the indentation is off, the f-string's `\n` line breaks are missing the four spaces. If the name contains a raw `.`, the `.replace(".", "p")` was skipped, and pytest will reject the identifier.

### 3.2 Add the property and guard tests

**👟 Starter hint:** Append two hand-rendered tests that *express intent*, not arithmetic — idempotence (applying `clamp` twice changes nothing) and a swapped-bounds guard.

```python
# testgen.py (continued)
parts.append("def test_idempotent():")
parts.append("    for v in " + str(edge_values(sig.parameters["value"])) + ":")
parts.append("        assert clamp(clamp(v)) == clamp(v)")
parts.append("")
parts.append("def test_swapped_bounds_guard():")
parts.append("    assert clamp(0.25, 0.5, 0.0) == 0.5")
open("test_clamp_simple.py", "w").write("\n".join(parts) + "\n")
print("wrote test_clamp_simple.py with", sum(1 for line in parts if line.startswith("def test_")), "tests")
```

Idempotence is a *property* — it holds for every input without needing a hand-computed expected value, which is the class of test that catches a broken bound without you having pre-guessed the result. `clamp(0.25, 0.5, 0.0)` documents what happens when the caller passes `low > high`: `max` wins, and the result is `low`, bit for bit — a decision the function makes silently, so the test makes it loudly.

**🎯 Expected output:** `wrote test_clamp_simple.py with 6 tests` — four value-boundary renders plus the property and guard tests.

**🩹 If it's off:** If the count is 4, the two appended `def test_...` lines were written without the `def test_` prefix or never appended. If the file contains only one test, `"\n".join(parts)` concatenated a single-element list — forget the `.append` inside the loop and you get the last case only.

### 3.3 Verify the render

**✅ Checklist**

- ✅ `test_clamp_simple.py` opens and parses as Python (no syntax errors in the generated names).
- ✅ It contains exactly 6 `test_*` functions, importing `clamp` from `testgen`.
- ✅ The expected expressions reference `max(0.0, min(v, 1.0))`, not a copy of `clamp`'s body.

**🤔 Socratic Question(s)**

- A test rendered as `assert clamp(v) == max(0.0, min(v, 1.0))` re-encodes `clamp`'s formula — it can only fail if the two *spellings* differ. What does the idempotence test verify that this tautological rendering would happily pass?
- The generator slaps `.replace` onto every float, but `-0.0` formats as `"-0.0"` → `neg0p0`. Why is that both harmless *now* and a clue that identifier generation deserves a `CASE_INDEX` counter instead?

## Step 4: Ask an LLM for intent tests (optional)

Boundary tests check math; intent tests check *meaning*. This step composes a deterministic prompt that asks an LLM what the function is supposed to do, and — the honest part — degrades to a saved file when no API key is configured.

### 4.1 Compose the prompt from the live signature

**👟 Starter hint:** Build a one-paragraph prompt embedding the real signature string, and ask for runnable pytest functions — nothing else.

```python
# testgen.py (continued)
def build_prompt(target: str, signature: inspect.Signature) -> str:
    return (
        f"You are reviewing a pure Python function `{target}{signature}`. "
        "List the three most important test cases that would catch a real regression. "
        "Answer as runnable pytest functions named test_* inside a fenced code block, nothing else."
    )

prompt = build_prompt("clamp", sig)
print(prompt[:90], "...")
```

Sending the *signature itself* (`clamp(value, low=0.0, high=1.0)`) is the whole trick — the model gets the contract in one line, so the "intent" it writes is anchored to real parameter names the generated tests can import. The deterministic suffix ("three most important...nothing else") keeps the prompt reproducible and the answer format-bounded.

**🎯 Expected output:** A single line starting `You are reviewing a pure Python function \`clamp(value, low=0.0, high=1.0)\`. List the three most important...` — with a `.` and `...` ellipsis from the print slice.

**🩹 If it's off:** If the prompt embeds a stale signature, `build_prompt` was called with a cached `sig` from before an edit — always pass `inspect.signature(clamp)` fresh. If the answer-format clause is missing, re-add the f-string's `...nothing else.` fragment.

### 4.2 Degrade gracefully without an API key

**👟 Starter hint:** Check `OPENAI_API_KEY` (env) then `getpass` (interactive), and when neither provides a key, save the prompt for manual use instead of failing.

```python
# testgen.py (continued)
def maybe_ask_llm(prompt_text: str) -> None:
    import getpass, os
    key = os.environ.get("OPENAI_API_KEY") or getpass.getpass("OpenAI key (blank to skip): ")
    if not key:
        with open("llm_prompt.txt", "w") as f:
            f.write(prompt_text)
        print("no key: prompt saved to llm_prompt.txt")
        return
    print("key present — an API call would go here, replacing this line")

maybe_ask_llm(prompt)
```

`or` chains the two key sources so a headless job can set `OPENAI_API_KEY` and a terminal user can type it in — and the empty-string check is what makes the whole thing *optional by default*. Saving `llm_prompt.txt` means the LLM step is never a blocker: paste it into any model later.

**🎯 Expected output:** `no key: prompt saved to llm_prompt.txt` (first run, no key configured).

**🩹 If it's off:** If `GetPassWarning` spews, the terminal can't prompt interactively (CI/notebook) — that's the *env-var path's* job; set `OPENAI_API_KEY` and rerun. If it prints `key present`, a key leaked into the env — the file path is still saved, but the API call line is intentionally a stub here.

### 4.3 Verify the prompt layer

**✅ Checklist**

- ✅ `build_prompt` embeds the *live* signature and constrains the answer format.
- ✅ With no key, `llm_prompt.txt` exists and its first line matches the printed prompt.
- ✅ The optional path never raises when no key is configured.

**🤔 Socratic Question(s)**

- The prompt asks an LLM for *three* cases but never executes what it returns. What is the single most dangerous thing about auto-executing model-written tests that the "save to file, paste manually" path sidesteps for free?
- `getpass` hides keystrokes but the key still lives in the process. Why is passing the key via environment variable *better* than typing it in — and for what class of function would you insist the LLM never see the source at all?

## Step 5: Run the suite and render the verdict

Tests exist to be executed. This step runs the generated `test_clamp_simple.py` with pytest as a subprocess, reads the exit code, and prints the judgment the whole project is about.

### 5.1 Run pytest from your process

**👟 Starter hint:** Use `sys.executable -m pytest` — not the bare `pytest` string — so the subprocess uses the *same* interpreter your project calls the generator from.

```python
# testgen.py (continued)
import subprocess, sys

def run_suite(path: str = "test_clamp_simple.py") -> int:
    result = subprocess.run(
        [sys.executable, "-m", "pytest", path, "-q"],
        capture_output=True, text=True, timeout=60,
    )
    print(result.stdout.strip().splitlines()[-1])
    return result.returncode

code = run_suite()
print("all green!" if code == 0 else "something failed — inspect and regenerate")
```

`sys.executable` is the address of the Python running *your* script, so the child process gets the same environment and site-packages — swapping in a bare shell `pytest` can silently run a different interpreter and a different `clamp`. `returncode` is pytest's exit gate: `0` means every test passed, anything else means a failure or collection error.

**🎯 Expected output:**

```
6 passed in 0.01s
all green!
```

**🩹 If it's off:** If the last line is `ERROR ... no tests ran`, pytest couldn't import `testgen` — run from the directory containing both files (or add `PYTHONPATH=.`). If it says `1 failed`, a rendered test's expected expression doesn't match `clamp`'s behavior — read the failing assertion and fix the template, not the function.

### 5.2 Introduce a real regression and watch the verdict flip

**👟 Starter hint:** Temporarily replace `testgen.py` with a *deliberately broken* clamp (one that forgets the low clamp), rerun the same suite, then restore the original file.

```python
# testgen.py (continued)
save = open("testgen.py").read()
open("testgen.py", "w").write(
    "def clamp(value, low=0.0, high=1.0):\n"
    "    return min(value, high)  # deliberately forgot the low clamp\n"
)
code = run_suite()
open("testgen.py", "w").write(save)   # restore the real function
print("caught the regression!" if code != 0 else "suite passed?!")
```

The child pytest process imports `clamp` *from disk*, so breaking the file is the one way to reach it — and restoring from the saved string afterward keeps your generator intact. Because the six tests were derived from real boundaries, forgetting the lower clamp trips exactly the probes that care about the lower side: the `-1.0` boundary case and the swapped-bounds guard both assert against `max(0.0, ...)`, and both go red with zero edits to the test file.

**🎯 Expected output:** `2 failed, 4 passed in 0.02s` with the two failing names `test_value_range_neg1p0` and `test_swapped_bounds_guard`, then `caught the regression!`.

**🩹 If it's off:** If the suite stays green, the "broken" string isn't actually broken — `min(value, high)` must be the entire body (no `max`, no `low` use). If pytest still passes after the write, `open(..., "w")` ran in a different directory than `test_clamp_simple.py` — write to the same absolute folder.

### 5.3 Verify the verdict

**✅ Checklist**

- ✅ Clean run: `6 passed` and `all green!/code == 0`.
- ✅ Regression run: at least one failure and a non-zero exit code, with zero edits to the test file.
- ✅ Both runs use `sys.executable -m pytest` so the test sees your real `clamp`.

**🤔 Socratic Question(s)**

- The deliberately broken `clamp` "forgot the low clamp", yet the idempotence test and the `0.0`/`0.5`/`1.0` range probes all still pass — only the `-1.0` probe and the swapped-bounds guard caught it. Which two *kinds* of tests were mandatory here, and what does that tell you about the value of a probe sitting *below* the default range like `-1.0`?
- `run_suite` prints only the last line of pytest's output. When a suite has 200 generated tests and one fails, what should a production tool print *instead of* the tail — and what does the exit code alone already guarantee?

## ⚠️ Common pitfalls

- **Testing a function against itself.** `assert clamp(v) == clamp(v)` passes no matter how broken `clamp` is. The generated expected value must be spelled from *another* expression (the `max/low/min` formula) or the test proves nothing.
- **`==` instead of `is` on `Parameter.empty`.** `param.default == inspect.Parameter.empty` can be fooled; the sentinel must be compared with `is`, or every "no default" parameter looks defaulted.
- **Bare `pytest` in a subprocess.** On a machine with multiple Pythons, `subprocess.run(["pytest", ...])` may run a different interpreter with no `clamp`. Always spawn `[sys.executable, "-m", "pytest", ...]`.
- **Floats leaking into function names.** `0.1` and `-1.0` are valid floats but invalid identifiers; the `.replace` mapping exists precisely because generated identifiers must round-trip.
- **Generated name/collection drift.** A test file that loses its leading `test_` prefix (or the `def test_` on the appends) gets *collected as nothing* — pytest reports "no tests ran" with exit code 5, and your pipeline says red for the wrong reason.
- **Caching the signature.** Rendering against a stale `sig` builds tests for code that changed; always regenerate from a fresh `inspect.signature(...)` call.

## What you just built

A test generator with three honest sources of truth: the signature (what arguments exist), the defaults (what the extremes are), and human-written intent (properties it must always hold). It renders a real pytest file, runs it as a subprocess, and can even call an LLM for intent tests when a key is present — and it proved itself by catching the intentionally broken clamp. The transferable idea is bigger than testing: "derive the harness from the interface, render it as text, execute it, and read the exit code" is the same skeleton as code generators, config renderers, and CI helpers.

:::tip[Run a fuller version without any local setup]
[`examples/ai-test-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-test-generator) in the course repo is the complete generator as a notebook — signature dump, edge probes, rendered tests, optional LLM prompt, and the red/green verdict all in one place. Clone it or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Generalize `render_case` to any parameter *type*: strings get `["", "a", "a"*N]` probes, lists get empty/singleton/sorted, and the expected value comes from a per-type property rather than a formula template.
- Add a `--limit` CLI flag so huge probe sets render a bounded random sample — generation stays fast while still fuzzing the boundary space.
- Wire the verdict into a git hook: on commit, regenerate the suite for changed modules and block the commit if `returncode != 0`.
- Turn `llm_prompt.txt` into a real, keyed call and *collect* the model's returned tests, appending them to the suite — while keeping the manual fallback intact.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓