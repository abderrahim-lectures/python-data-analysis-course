# Section 1: Python 101 (Weeks 1–5)

**Normal track** (no classes):
- Week 1: variables, types, operators, input/output
- Week 2: control flow (if/else, loops)
- Week 3: data structures (lists, dicts, tuples, sets)
- Week 4: functions
- Week 5: working with CSV files (`csv` module, read/write) + mini wrap-up project

**Hard track — PBL: "Build a Tiny Language Model from a CSV corpus"** (functional style, no classes, **built-in types only — deliberately no numpy**, so students feel plain-Python's limits firsthand):
- Week 1: recap + loading a small text corpus from CSV
- Week 2: tokenization functions, word-frequency counting with dicts (math framing: frequency table ≈ a discrete distribution)
- Week 3: building bigram probability tables as nested dicts (`dict[str, dict[str, float]]`)
- Week 4: a `generate_text()` function sampling the next word via `random.choices` weighted by those probabilities
- Week 5: assembling the pieces into a simple CLI text generator + a "temperature" tuning knob, then **timing it** on a slightly larger corpus to feel it get sluggish — this timing becomes the hook picked up at the start of Section 2

A small hand-authored sentence corpus (public-domain/original, avoiding copyright issues) ships in `static/datasets/slm-corpus.csv`.
