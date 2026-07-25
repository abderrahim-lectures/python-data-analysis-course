---
id: 2027-finetune-llm
title: "Fine-tune a Small Language Model with Unsloth"
sidebar_label: "Fine-tune a Small LM"
slug: /projects/finetune-llm-unsloth
description: "Graduate from the in-browser playground to real Python: fine-tune a small open-source language model with LoRA using Unsloth, on a free GPU."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';

# 🌍 Fine-tune a Small Language Model with Unsloth

<ProjectPublishedDate projectId="2027-finetune-llm" />

<ProjectGreeting />

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

Write your examples locally as a small JSON file:

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

:::tip[Quality over quantity]
Unsloth's own documentation and most fine-tuning guides agree on this: 50 carefully written, consistent examples teach a model a behavior far more reliably than 500 sloppy or inconsistent ones. If your examples contradict each other (answering the same kind of question differently each time), the model has nothing consistent to learn.
:::

## Step 2: Fine-tune with Unsloth on a free GPU

This is the step that needs a GPU. [Unsloth](https://github.com/unslothai/unsloth) ships ready-to-run notebooks specifically designed for Google Colab's and Kaggle's **free** GPU tiers — you don't install anything locally for this part.

1. Go to [Unsloth's notebooks page](https://docs.unsloth.ai/get-started/unsloth-notebooks) and open one of the beginner-friendly Colab notebooks for a small model (around 1B parameters — small enough to fine-tune quickly and to actually download and run afterward). A 1B-parameter open model, like a small Llama or Qwen release, is a reasonable, well-supported starting point; check Unsloth's notebook list for whichever small model has a current, working template, since which exact model is best-supported shifts over time.
2. In the notebook, replace its example dataset with your own: upload the `dataset.jsonl` you built in Step 1 (Colab's file-upload panel, or mount Google Drive), and point the notebook's data-loading cell at it instead.
3. Run the notebook's cells in order. The core fine-tuning step uses **LoRA** (Low-Rank Adaptation): instead of updating all of a model's billions of parameters (slow, needs a lot of memory), LoRA freezes the original model and trains a much smaller pair of low-rank matrices that get added on top — mathematically, if the original weight matrix is $W$, LoRA learns a low-rank update $\Delta W = BA$ (where $B$ and $A$ are much smaller matrices) and uses $W + \Delta W$ at inference time. This is the same idea as approximating a large matrix with a lower-dimensional one — a concept from linear algebra you already have the background for — applied to make fine-tuning cheap enough to run on a free GPU.
4. Once training finishes, the notebook saves your result as a small **adapter** — just the $A$ and $B$ matrices, typically tens of megabytes, not a multi-gigabyte copy of the whole model. Download this adapter folder to your computer.

:::tip[Check the current docs before you start]
Which specific model, which specific notebook, and Unsloth's own API all move fast — faster than most software, since this is an actively developed research-adjacent tool. Before running anything, open [Unsloth's current documentation](https://docs.unsloth.ai) and use whichever notebook and model it currently recommends for beginners, rather than assuming last year's specifics still apply.
:::

## Step 3: Run your fine-tuned model locally

Back on your own machine, load the base model plus your downloaded adapter and try it out:

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

<ProjectProgressCheckbox projectId="2027-finetune-llm" />
