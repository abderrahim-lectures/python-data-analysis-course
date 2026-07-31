# 2027 Capstone: Fine-tune a Small Language Model with Unsloth

The local companion to the course's [2027 Capstone](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/bonus/2027-finetune-llm) lesson — the parts of the project that run on your own machine with `uv`. The GPU-heavy fine-tuning step itself doesn't live here; it runs on a free Google Colab or Kaggle notebook, since that step genuinely needs a GPU most laptops don't have.

## What's here

- `build_dataset.py` — writes a small instruction/response dataset (`dataset.jsonl`) that you upload into the Colab/Kaggle notebook for fine-tuning. Ships with a handful of starter examples about the course itself; replace them with your own for a real capstone project.
- `infer.py` — loads a base model plus a downloaded LoRA adapter and runs one prompt, entirely locally, once you have a fine-tuned adapter to try.
- `notebook.ipynb` — a hosted-notebook companion for students who'd rather try the **local** dataset-prep and inference steps in Colab or Kaggle instead of with `uv`. It covers the same two scripts above (`build_dataset.py` and `infer.py`), cell by cell. It does **not** cover the fine-tuning step itself — for that, use Unsloth's own official notebooks (see below), same as the local path.

## How to run this

```bash
uv sync
uv run python build_dataset.py
```

This produces `dataset.jsonl`. From here:

1. Open one of [Unsloth's official notebooks](https://docs.unsloth.ai/get-started/unsloth-notebooks) for a small (~1B parameter) model on Google Colab or Kaggle.
2. Upload `dataset.jsonl` into that notebook and point its data-loading cell at it instead of its own example dataset.
3. Run the notebook. It fine-tunes the model with LoRA and saves a small adapter folder — download that adapter to this directory (e.g. as `my-adapter/`).
4. Edit `infer.py`'s `BASE_MODEL_NAME` to match whichever base model the notebook actually used, then run:

```bash
uv run python infer.py
```

See the full [2027 Capstone lesson](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/bonus/2027-finetune-llm) for the complete walkthrough, including what LoRA actually does and how to read the notebook's training output.

## Prefer a hosted notebook for the local steps?

Open `notebook.ipynb` in Colab or Kaggle instead of running `build_dataset.py` / `infer.py` locally:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finetune-llm-unsloth/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finetune-llm-unsloth/notebook.ipynb)

This only covers the local dataset-prep and inference steps — the fine-tuning step still runs on Unsloth's own official notebook, as described above.

## A note on "check current docs"

Which specific base model Unsloth's notebooks recommend, and Unsloth's own API, both move fast. Before running any of this, check [Unsloth's current documentation](https://docs.unsloth.ai) rather than assuming this README's specifics still match exactly.
