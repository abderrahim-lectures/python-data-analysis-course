"""Loads a base model plus a downloaded LoRA adapter and runs one prompt locally.

Run with: uv run python infer.py

Fill in BASE_MODEL_NAME to match whichever model you actually fine-tuned in
the Colab/Kaggle notebook (see README.md), and point ADAPTER_PATH at the
adapter folder you downloaded from there.
"""

from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE_MODEL_NAME = "unsloth/<the-base-model-you-fine-tuned>"
ADAPTER_PATH = "./my-adapter"

PROMPT = "Summarize this course in one sentence."


def main() -> None:
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)
    base_model = AutoModelForCausalLM.from_pretrained(BASE_MODEL_NAME)
    model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)

    inputs = tokenizer(PROMPT, return_tensors="pt")
    output = model.generate(**inputs, max_new_tokens=80)
    print(tokenizer.decode(output[0], skip_special_tokens=True))


if __name__ == "__main__":
    main()
