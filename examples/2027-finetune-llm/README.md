# 2027 Capstone: Fine-tune a Small Language Model with Unsloth

The local companion to the course's [2027 Capstone](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/bonus/2027-finetune-llm) lesson — the parts of the project that run on your own machine with `uv`. The GPU-heavy fine-tuning step itself doesn't live here; it runs on a free Google Colab or Kaggle notebook, since that step genuinely needs a GPU most laptops don't have.

## What's here

- `build_dataset.py` — writes a small instruction/response dataset (`dataset.jsonl`) that you upload into the Colab/Kaggle notebook for fine-tuning. Ships with a handful of starter examples about the course itself; replace them with your own for a real capstone project.
- `infer.py` — loads a base model plus a downloaded LoRA adapter and runs one prompt, entirely locally, once you have a fine-tuned adapter to try.

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

## A note on "check current docs"

Which specific base model Unsloth's notebooks recommend, and Unsloth's own API, both move fast. Before running any of this, check [Unsloth's current documentation](https://docs.unsloth.ai) rather than assuming this README's specifics still match exactly.
