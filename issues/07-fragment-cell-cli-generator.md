# A lesson fence is a code fragment, so its runnable cell always fails with `NameError`

**Labels:** `type:bug`, `area:python-101`, `area:content`
**Severity:** low (one cell, visibly broken)

## What a learner saw

In `/learn/python-101/hard/lessons/10-cli-generator/`, the "Practice Challenge" cell runs and
fails immediately:

```
NameError: name 'parser' is not defined
```

The fence is a **fragment** to paste into the full script above it:

```python
parser.add_argument("--interactive", action="store_true", help="Interactive mode")

# In main():
if args.interactive:
    print("Interactive mode. Type 'quit' to exit.")
    while True:
        word = input("Start word: ").strip()
        …
```

Every ```python fence on a lesson page becomes a runnable cell
(`rehype-runnable-python.mjs`), so a fragment is presented as something a learner can run — and it
can never run: it needs `parser`, `args` and `model` from the earlier script.

## Fix options

1. Give the plugin an opt-out — e.g. a `python no-run` info string that keeps the highlighting but
   skips the Run button — and tag fragment fences with it. One implementation covers every lesson.
2. Retag the fragment as ```text (loses syntax highlighting), or inline it in prose.
3. Make the cell self-contained by including the `main()` scaffolding it belongs to.

(1) is the general fix; the tagging has to be repeated in all four locales.

## Evidence

A sweep that ran every cell of all 49 English lessons against the real engine (394 cells) found
six error cells: five are lessons *demonstrating* an exception on purpose (`int("hello")`,
`"5" < 6`, `{[1, 2]: "bad"}`, `age + 1`), one was the scipy bug (issue 6), and this one is the
only cell that is broken by construction.
