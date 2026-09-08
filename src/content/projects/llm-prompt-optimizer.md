---
title: "Build an LLM Prompt Optimizer"
description: "Automatically refine prompts using A/B testing, few-shot examples, and chain-of-thought patterns."
---
# ✨ Build an LLM Prompt Optimizer

A mediocre prompt gets mediocre answers. Engineers often hand-tune prompts by trial and error, but that's slow and unrepeatable. This project builds a CLI tool that takes a raw prompt, generates several structured variants (few-shot, chain-of-thought, role-based), scores them against a gold set of answers, and reports which variant performs best.

This assumes Python 101 and comfort with pandas from Data Analysis. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the optimization dependencies.
2. Define a scoring harness with test inputs and expected answers.
3. Generate prompt variants: few-shot, chain-of-thought, and role-based.
4. Score each variant against the gold set.
5. Rank variants and export the best prompt.

## Where to run this

**Locally with `uv`** is the primary path — this is a CLI tool that runs offline against a mock model.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/llm-prompt-optimizer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/llm-prompt-optimizer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fllm-prompt-optimizer%2Fnotebook.ipynb)

## Setup

Everything you need before building: a Python environment, pandas, and click. The project runs against a mock model so the whole loop works offline, with no API keys.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init llm-prompt-optimizer
cd llm-prompt-optimizer
uv add pandas click
```

### Create the project structure

```bash
mkdir -p optimizer
touch optimizer/__init__.py optimizer/data.py optimizer/variants.py optimizer/model.py optimizer/scoring.py optimizer/cli.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `llm-prompt-optimizer/` exists with `pyproject.toml` and dependencies installed.
- ✅ The `optimizer/` directory has all required module files.

## Step 1: Define the gold dataset

To score prompts you need test inputs with known-good answers. This is the benchmark your prompt variants are measured against.

### 1.1 Create the gold set

**👟 Starter hint:** Create `optimizer/data.py`.

```python
# optimizer/data.py
from dataclasses import dataclass

@dataclass
class Question:
    input: str
    expected: str

def gold_set() -> list[Question]:
    return [
        Question("What is 6 * 7?", "42"),
        Question("Capital of Japan?", "Tokyo"),
        Question("What is 9 + 4?", "13"),
        Question("How many sides does a triangle have?", "3"),
    ]
```

**🎯 Expected output:** `gold_set()` returns four questions with expected answers.

**🩹 If it's off:** If expected answers are wrong, scoring becomes meaningless. Verify `6 * 7` is `42`.

### 1.2 Verify the gold set

**✅ Checklist**

- ✅ All questions have non-empty inputs and expected answers.
- ✅ Answers span both math and fact categories.

**🤔 Socratic Question(s)**

- Why is it important that the gold set covers more than one kind of question?

## Step 2: Generate prompt variants

Different prompt structures elicit different behavior. Generate a few standard variants programmatically.

### 2.1 Build the variant generator

**👟 Starter hint:** Create `optimizer/variants.py`.

```python
# optimizer/variants.py
from dataclasses import dataclass

@dataclass
class PromptVariant:
    name: str
    build: object


def build_few_shot() -> PromptVariant:
    examples = (
        "Q: What is 2 + 2?\nA: 4\n"
        "Q: What is the capital of Italy?\nA: Rome\n"
    )
    def make(q: str) -> str:
        return f"{examples}Q: {q}\nA:"
    return PromptVariant("few-shot", make)


def build_chain_of_thought() -> PromptVariant:
    def make(q: str) -> str:
        return f"Think step by step.\nQ: {q}\nA:"
    return PromptVariant("chain-of-thought", make)


def build_role_based() -> PromptVariant:
    def make(q: str) -> str:
        return f"You are a precise mathematics and trivia assistant.\nQ: {q}\nA:"
    return PromptVariant("role-based", make)
```

**🎯 Expected output:** Each `build_*` returns a named variant whose `build(prompt)` injects structure around the raw question.

**🩹 If it's off:** If variants feel identical, the injected structure is doing nothing useful — widen the differences.

### 2.2 Verify variants

**✅ Checklist**

- ✅ `few-shot`, `chain-of-thought`, and `role-based` variants all exist.
- ✅ Each variant's builder accepts a question string and returns a full prompt.

**🤔 Socratic Question(s)**

- The few-shot examples are hard-coded. When would automatically selecting examples per-input be better?

## Step 3: Build the mock model

A model that answers correctly when the prompt contains a hint (like the answer keyword) lets you see how prompt structure changes outcomes, offline.

### 3.1 Define the model

**👟 Starter hint:** Create `optimizer/model.py`.

```python
# optimizer/model.py
import re

class MockModel:
    name = "mock-llm"

    def generate(self, prompt: str) -> str:
        numbers = re.findall(r"(\d+)\s*[*+]\s*(\d+)", prompt)
        if numbers:
            a, b = numbers[-1]
            op = "*" if "*" in prompt else "+"
            a, b = int(a), int(b)
            return str(a * b) if op == "*" else str(a + b)
        if "capital" in prompt.lower():
            return "Tokyo"
        return "unknown"
```

The mock returns the math result when an arithmetic expression appear and facts from a small lookup. It's deliberately naive — that's enough to demonstrate optimization.

**🎯 Expected output:** `MockModel().generate("Think step by step. Q: What is 6 * 7? A:")` returns `"42"`.

**🩹 If it's off:** If `*`/`+` detection picks the wrong operator, check the regex captures both operands.

### 3.2 Verify the model

**✅ Checklist**

- ✅ The model answers arithmetic from the prompt.
- ✅ The model answers a known fact.
- ✅ The model returns `"unknown"` for unrecognized input.

**🤔 Socratic Question(s)**

- How would the mock need to change to simulate a model that gets *better* with chain-of-thought?

## Step 4: Score prompt variants

Run every variant against the gold set and measure accuracy.

### 4.1 Implement the scorer

**👟 Starter hint:** Create `optimizer/scoring.py`.

```python
# optimizer/scoring.py
import re
import pandas as pd
from optimizer.data import Question


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def evaluate(variant, model, gold: list[Question]) -> dict:
    correct = 0
    total = len(gold)
    for q in gold:
        full = variant.build(q.input)
        answer = model.generate(full)
        if normalize(answer) == normalize(q.expected):
            correct += 1
    return {"variant": variant.name, "correct": correct, "total": total,
            "accuracy": correct / total}


def evaluate_all(variants, model, gold: list[Question]) -> pd.DataFrame:
    rows = [evaluate(v, model, gold) for v in variants]
    return pd.DataFrame(rows).sort_values("accuracy", ascending=False, kind="stable")
```

**🎯 Expected output:** `evaluate_all([v1, v2, v3], model, gold_set())` returns a DataFrame ranking variants by accuracy.

**🩹 If it's off:** If everything scores the same, the mock's answers don't depend on prompt structure — that's fine for the demo, but add a variant the mock responds to differently.

### 4.2 Verify scoring

**✅ Checklist**

- ✅ Each variant has a computed accuracy.
- ✅ Results are sorted best-first.
- ✅ Every variant is evaluated on the full gold set.

**🤔 Socratic Question(s)**

- Accuracy alone conflates "never answered" with "answered wrong". What second metric would you track?

## Step 5: Export the best prompt

Optimization is only useful if it changes what you actually run. Export the top variant for downstream use.

### 5.1 Build the exporter

**👟 Starter hint:** Create `optimizer/cli.py`.

```python
# optimizer/cli.py
import json
import click
from optimizer.data import gold_set
from optimizer.variants import build_few_shot, build_chain_of_thought, build_role_based
from optimizer.model import MockModel
from optimizer.scoring import evaluate_all


@click.command()
@click.option("--out", default="best_prompt.json", help="Output file")
def optimize(out: str):
    model = MockModel()
    variants = [build_few_shot(), build_chain_of_thought(), build_role_based()]
    result = evaluate_all(variants, model, gold_set())
    best = result.iloc[0]
    payload = {
        "best_variant": best["variant"],
        "accuracy": float(best["accuracy"]),
        "full_report": result.to_dict(orient="records"),
    }
    with open(out, "w") as f:
        json.dump(payload, f, indent=2)
    click.echo(click.style(f"Best: {best['variant']} ({best['accuracy']:.0%})", fg="green"))
```

**🎯 Expected output:** Running `uv run python -m optimizer.cli` writes `best_prompt.json` with the winning variant and full report.

**🩹 If it's off:** If no output file appears, check the working directory and that `out` resolves there.

### 5.2 Verify the CLI

**✅ Checklist**

- ✅ `uv run python -m optimizer.cli` writes `best_prompt.json`.
- ✅ The report ranks all variants by accuracy.
- ✅ The best variant is identified in the terminal output.

**🤔 Socratic Question(s)**

- How would you report per-question breakdowns, not just totals, so you can see *which* questions each variant wins on?

## ⚠️ Common pitfalls

- **Circular imports.** `optimizer/router.py` that imports both the model and the variants can deadlock. Import the model deep inside the function that needs it, or keep `cli.py` as the top-level orchestrator.
- **Over-mocked expectations.** A mock that perfectly answers everything hides real prompt differences. Make the mock respond to prompt structure so the optimizer actually optimizes.
- **Sorting ties.** If all variants score the same, sorting is arbitrary. Add a secondary metric (e.g., token efficiency) to break ties.
- **Hard-coded examples.** Few-shot examples that leak the test answer ("what is 6*7 → 42") inflate accuracy. Keep the gold set separate from the few-shot pool.
- **`__main__` guard.** `app.run` and CLI entry points only execute when the module is run directly. Wrap them in `if __name__ == "__main__"` or run via `python -m`.

## What you just built

A prompt optimization loop: a gold dataset, programmatic variant generators (few-shot, chain-of-thought, role-based), an offline mock model, an accuracy scorer, and a CLI that ranks variants and exports the best one. This is the automated version of what prompt engineers do by hand — and it makes the whole process repeatable and measurable.

:::tip[Run a fuller version without any local setup]
[`examples/llm-prompt-optimizer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/llm-prompt-optimizer) in the course repo has a richer version with real model adapters, token-efficiency scoring, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Point the optimizer at a real LLM API to see it optimize on genuinely model-dependent tasks.
- Add a token-count metric so you can prefer the cheapest prompt that still achieves target accuracy.
- Build a versioning layer that records every prompt variant and its score, like git history for prompts.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
