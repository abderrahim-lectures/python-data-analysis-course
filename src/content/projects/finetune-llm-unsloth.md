---
title: "Fine-tune a Small Language Model with Unsloth"
description: "Graduate from the in-browser playground to real Python: fine-tune a small open-source language model with LoRA using Unsloth, on a free GPU."
---

# 🎛️ Fine-tune a Small Language Model with Unsloth

Back in Python 101's Hard track, you built a tiny language model completely from scratch — word counts, bigram probability tables, weighted sampling. This project picks up that exact thread: instead of building a language model's math from nothing, you'll take a real, pretrained open-source model and specialize it for a task of your choosing by *fine-tuning* it — nudging its existing weights with a small amount of your own data, using [Unsloth](https://unsloth.ai), a library built specifically to make this fast and (importantly) free.

This is optional and ungraded — a good fit once you've finished Python 101's Hard track (the from-scratch language model gives you the intuition this project builds on). See [Real-World Projects](/docs/projects) for the full, growing list, including the [AI Agent project](/docs/projects/ai-agent).

:::tip[One honest difference from the AI Agent project]
The AI Agent project runs entirely on your own machine. This one can't, fully — fine-tuning a language model, even a small one, needs a GPU, and most personal laptops don't have one suited to the job. So this project splits the work: project setup, data prep, and running your *finished* model happen locally with `uv`, same as the AI Agent project; the actual fine-tuning step runs on a free hosted GPU (Google Colab or Kaggle) instead. That's not a shortcut — it's the honest, standard way to do this without spending money.
:::

## 🎯 What you'll do

1. Install `uv` and set up a local project — same first step as every project.
2. Prepare a small dataset of examples that show the model the behavior you want it to learn.
3. Get free GPU access via Google Colab or Kaggle, and use Unsloth to LoRA-fine-tune a small open model (around 1 billion parameters) on your dataset.
4. Download the result — a small "adapter" file, not a whole new model — and run it locally to see your fine-tuned model in action.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one for Setup, dataset prep, and local inference (Steps 1 and 3) — the Setup section below walks through installing it. Step 2, the actual fine-tuning, needs a GPU and runs on Unsloth's own official Colab/Kaggle notebook regardless (see Step 2 below), since that step genuinely can't happen on most laptops.

If you'd rather try the local dataset-prep and inference steps in a hosted notebook instead of with `uv`, there's a companion notebook for exactly that:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finetune-llm-unsloth/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finetune-llm-unsloth/notebook.ipynb)

This badge covers the **local** steps only (dataset prep and inference) — the fine-tuning step itself still uses Unsloth's own official notebook, linked separately in Step 2.

## Setup

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

Then set up a local project for the data-prep and inference steps (the parts that don't need a GPU):

```bash
uv init finetune-llm
cd finetune-llm
uv add datasets huggingface_hub
```

## Step 1: Prepare a small dataset

Fine-tuning teaches a model a specific *behavior*, not new facts from scratch — it works best with a small, focused, well-formatted set of examples, not a huge pile of raw text. A common format is a list of instruction/response pairs. Pick a narrow, personal task — a few ideas: answering questions in a specific tone or persona, following a fixed output format (e.g. always replying in valid JSON), or summarizing text the way you personally would.

### 1.1 Write your examples and build the file

**👟 Starter hint:** Start from the two examples below, keep the exact `{"instruction": ..., "response": ...}` shape for every entry, and grow the list to 30-50 before you move on — one JSON object per line (`.jsonl`), not a single JSON array:

```python
# build_dataset.py
import json

examples = [
    {
        "instruction": "Summarize this course in one sentence.",
        "response": "A free, browser-based course teaching Python and pandas from first principles through a full data-analysis project.",
    },
    {
        "instruction": "Explain what a variable is, briefly.",
        "response": "A variable is a name that points to a value stored in memory, so you can refer to that value again by name instead of retyping it.",
    },
    # Add at least 30-50 more examples for the model to actually pick up a
    # pattern — a handful of examples is enough to see this code run, but not
    # enough to see a real behavior change once fine-tuned.
]

with open("dataset.jsonl", "w") as f:
    for example in examples:
        f.write(json.dumps(example) + "\n")

print(f"Wrote {len(examples)} examples to dataset.jsonl")
```

```bash
uv run python build_dataset.py
```

**🎯 Expected output:** `Wrote N examples to dataset.jsonl` where N matches your list's length, and opening `dataset.jsonl` in an editor shows one valid JSON object per line — no trailing comma issues, since each line is written independently.

**🩹 If it's off:** If `dataset.jsonl` has fewer lines than examples you wrote, check for a stray duplicate key in one of your dicts (Python silently keeps only the last value for a repeated key, which won't crash but will look wrong). Keep the list short (2-3 examples) just to confirm the script runs, then grow it to 30-50 before Step 2 — a 2-example dataset runs through the fine-tuning notebook fine but won't produce a visible behavior change afterward.

### 1.2 Verify the dataset

**✅ Checklist**

- ✅ `dataset.jsonl` exists with one JSON object per line, each carrying exactly `instruction` and `response`.
- ✅ The count printed by the script matches the number of examples you actually wrote.
- ✅ Every entry keeps the same `{"instruction": ..., "response": ...}` shape — no inconsistent keys or formats between entries.

**🤔 Socratic Question(s)**

The tip above warns that "50 carefully written, consistent examples teach a model a behavior far more reliably than 500 sloppy or inconsistent ones." If two of your examples answer the *same* kind of question in conflicting styles, what does the model have to learn — and why would adding more conflicting examples make the problem worse rather than better?

## Step 2: Fine-tune with Unsloth on a free GPU

This is the step that needs a GPU. [Unsloth](https://github.com/unslothai/unsloth) ships ready-to-run notebooks specifically designed for Google Colab's and Kaggle's **free** GPU tiers — you don't install anything locally for this part.

### 2.1 Confirm the stock notebook works first

**👟 Starter hint:** Run the notebook's cells top to bottom *unmodified* once, on its own example data, before you touch anything — confirming the stock notebook trains and produces an adapter first isolates "did Unsloth work at all" from "did my dataset swap work," the same way testing with known-good input helps everywhere else in this course.

1. Go to [Unsloth's notebooks page](https://docs.unsloth.ai/get-started/unsloth-notebooks) and open one of the beginner-friendly Colab notebooks for a small model (around 1B parameters — small enough to fine-tune quickly and to actually download and run afterward). A 1B-parameter open model, like a small Llama or Qwen release, is a reasonable, well-supported starting point; check Unsloth's notebook list for whichever small model has a current, working template, since which exact model is best-supported shifts over time.
2. Run the notebook's cells in order, end to end, without changing anything.

**🎯 Expected output:** The notebook's training cell prints a visibly decreasing training loss number (it won't hit zero, and shouldn't), and finishing produces a downloaded adapter folder that's tens of megabytes, not gigabytes.

**🩹 If it's off:** If training loss stays flat instead of decreasing, the notebook isn't training at all — rerun the data-loading and training cells and watch the logs rather than assuming a long cell is busy. If Colab disconnects mid-run, it's almost always a free-tier idle timeout — reconnect and rerun from the top; there's no partial-save to resume from in the beginner notebooks.

### 2.2 Swap in your own dataset

**👟 Starter hint:** Now connect your Step 1 work: upload the `dataset.jsonl` you built, and point the notebook's data-loading cell at it instead of the example dataset — then run the cells in order once more.

```text
# In the notebook's data-loading cell, point it at your dataset.jsonl
# instead of the notebook's bundled example dataset. Exactly which line
# changes depends on the notebook you opened — look for the cell that
# reads a .jsonl/.json dataset and give it your file's name/path.
```

**🎯 Expected output:** The training cell again shows a decreasing loss, and you can confirm from the notebook's loaded-data preview that it's now reading *your* `dataset.jsonl` entries (your instruction/response pairs), not the stock demo set.

**🩹 If it's off:** The single most common silent failure is the data-loading cell still reading the notebook's original example dataset — this step looks like it "succeeds" without ever training on your data. Check the loaded-data preview visibly contains your exact examples before the long training cell runs. Training loss staying flat usually traces back to this same wrong-dataset cause.

:::tip[Check the current docs before you start]
Which specific model, which specific notebook, and Unsloth's own API all move fast — faster than most software, since this is an actively developed research-adjacent tool. Before running anything, open [Unsloth's current documentation](https://docs.unsloth.ai) and use whichever notebook and model it currently recommends for beginners, rather than assuming last year's specifics still apply.
:::

The core fine-tuning step uses **LoRA** (Low-Rank Adaptation): instead of updating all of a model's billions of parameters (slow, needs a lot of memory), LoRA freezes the original model and trains a much smaller pair of low-rank matrices that get added on top — mathematically, if the original weight matrix is $W$, LoRA learns a low-rank update $\Delta W = BA$ (where $B$ and $A$ are much smaller matrices) and uses $W + \Delta W$ at inference time. This is the same idea as approximating a large matrix with a lower-dimensional one — a concept from linear algebra you already have the background for — applied to make fine-tuning cheap enough to run on a free GPU. Once training finishes, the notebook saves your result as a small **adapter** — just the $A$ and $B$ matrices, typically tens of megabytes, not a multi-gigabyte copy of the whole model. Download this adapter folder to your computer.

### 2.3 Verify the fine-tune

**✅ Checklist**

- ✅ The training cell ran on your own `dataset.jsonl` (confirmed via the loaded-data preview), not the notebook's demo data.
- ✅ Training loss visibly decreased over the run.
- ✅ You downloaded the resulting adapter folder to your computer — tens of megabytes, not gigabytes.
- ✅ You know which exact base model this notebook fine-tuned, since Step 3 needs that precise identifier.

**🤔 Socratic Question(s)**

Why is the adapter file only tens of megabytes while the full model it tunes is gigabytes? If LoRA only stored the low-rank matrices $A$ and $B$ instead of re-saving the whole base model, what would happen if you tried to use that downloaded adapter on a different model than the one it was trained against?

## Step 3: Run your fine-tuned model locally

Back on your own machine, load the base model plus your downloaded adapter and try it out.

### 3.1 Write and run the inference script

**👟 Starter hint:** Load the *base* model and tokenizer first with `AutoModelForCausalLM`/`AutoTokenizer`, exactly as named in Step 2's notebook, then wrap the base model with `PeftModel.from_pretrained(base_model, adapter_path)` — that's the one line that actually applies your fine-tuning on top:

```bash
uv add transformers peft torch --extra-index-url https://download.pytorch.org/whl/cpu
```

```python
# infer.py
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model_name = "unsloth/<the-base-model-you-fine-tuned>"  # match Step 2's notebook
adapter_path = "./my-adapter"  # the folder you downloaded from Colab

tokenizer = AutoTokenizer.from_pretrained(base_model_name)
base_model = AutoModelForCausalLM.from_pretrained(base_model_name)
model = PeftModel.from_pretrained(base_model, adapter_path)

prompt = "Summarize this course in one sentence."
inputs = tokenizer(prompt, return_tensors="pt")
output = model.generate(**inputs, max_new_tokens=80)
print(tokenizer.decode(output[0], skip_special_tokens=True))
```

```bash
uv run python infer.py
```

Running a ~1B-parameter model on CPU is slow (expect it to take real seconds, not milliseconds, per response) but works — this is your own machine actually running a fine-tuned language model, no API key, no internet connection required once the model files are downloaded.

**🎯 Expected output:** A generated response that leans noticeably toward the style or format of your training examples — not identical wording, but a visible shift from how the un-fine-tuned base model would answer the same prompt.

**🩹 If it's off:** A `size mismatch`/config error when loading the adapter almost always means `base_model_name` doesn't exactly match the base model Step 2's notebook actually fine-tuned — check the notebook's own model-loading cell for the precise identifier and copy it verbatim. If the response looks indistinguishable from an untrained model's, re-check that `adapter_path` points at the folder you downloaded (not an empty placeholder) and that Step 2 actually trained on your data, not the notebook's demo set.

### 3.2 Verify the fine-tuned output

**✅ Checklist**

- ✅ `uv run python infer.py` completes and prints a response, not a traceback.
- ✅ The response shows a visible shift toward your training examples' style or format, versus the base model's default behavior.
- ✅ The base model identifier in `infer.py` matches the one Step 2's notebook fine-tuned, exactly.

**🤔 Socratic Question(s)**

The response should show the *behavior* you trained, but not reproduce any example verbatim. Compare your output against your training data: is the model memorizing and repeating a stored example, or generalizing the underlying instruction/response pattern? How would you tell the difference, and which would you rather have?

## ⚠️ Common pitfalls

- **Too few or too inconsistent examples.** A dataset of 5 examples, or 50 examples that each answer similar questions differently, gives the model nothing reliable to generalize from — you'll get back something close to the un-fine-tuned base model.
- **Forgetting to actually swap in your own dataset.** It's easy to run a notebook end-to-end on its *example* dataset and conclude "it worked" without ever training on your own data — always confirm the data-loading cell is reading `dataset.jsonl`, not the notebook's original demo file.
- **Trying to fine-tune locally on a laptop GPU (or no GPU) instead of using the free hosted one.** Even a "small" 1B model needs real GPU memory to train efficiently — Colab/Kaggle's free tier exists specifically so you don't need your own.
- **Mismatching the base model between Steps 3 and 4.** The adapter you downloaded only makes sense loaded on top of the *exact* base model it was trained against — loading it onto a different model (even a similarly-named one) will either error or silently produce nonsense.

## What you just built

You didn't train a language model from zero — that's what Python 101's Hard track already walked you through, the honest, from-first-principles way. Here, you took a real pretrained model and *specialized* it: the same underlying idea (a model whose behavior is shaped by data) but at a scale and level of capability nothing built from scratch in a browser could reach, using a technique (LoRA) specifically designed to make that affordable on free hardware.

## Where to go from here

- Try a genuinely different task for your next fine-tune — a fixed output format, a specific tone, or a narrow domain (e.g. only answering questions about one topic) tends to show clearer, more convincing before/after differences than a broad, general-purpose change.
- Read Unsloth's own documentation on **quantization** — the free-tier notebooks already use 4-bit quantization to fit training into limited GPU memory; understanding what that trades away (a small amount of precision) for what it buys (fitting a model that wouldn't otherwise fit) is worth knowing before you rely on it for anything beyond a course project.
- Compare this to the [AI Agent project](/docs/projects/ai-agent): that one changes a model's *behavior* by giving it tools and instructions at request time (no training involved); this one changes the model's actual weights ahead of time. Both are real, current approaches to building with language models — knowing when you'd reach for one over the other is a genuinely useful thing to have felt firsthand, not just read about.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
