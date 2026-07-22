"""Builds a small instruction/response dataset for fine-tuning.

Run with: uv run python build_dataset.py

This is a starter set of examples about the course itself, so the fine-tuned
model has something to say. Replace these with your own examples for your
own capstone project -- more (aim for 30-50+), and consistent in tone/format,
will teach the model a much clearer behavior than a handful of varied ones.
"""

import json

EXAMPLES = [
    {
        "instruction": "Summarize this course in one sentence.",
        "response": "A free, browser-based course teaching Python and pandas from first principles through a full data-analysis project.",
    },
    {
        "instruction": "What is a variable in Python?",
        "response": "A variable is a name that points to a value stored in memory, so you can refer to that value again by name instead of retyping it.",
    },
    {
        "instruction": "What is a for loop used for?",
        "response": "A for loop repeats a block of code once for each item in a sequence, like each row of a CSV file or each character in a string.",
    },
    {
        "instruction": "What does pandas' groupby do?",
        "response": "groupby splits a DataFrame into groups based on a column's values, so you can compute a summary statistic (like a mean or count) separately for each group.",
    },
    {
        "instruction": "Why does correlation not imply causation?",
        "response": "Two variables can move together because a third, unmeasured factor drives both of them -- a correlation alone can't rule that out, so it never proves one variable causes the other.",
    },
    {
        "instruction": "What is a LoRA adapter?",
        "response": "A LoRA adapter is a small pair of low-rank matrices trained on top of a frozen pretrained model, letting you specialize the model's behavior without retraining all of its original parameters.",
    },
]


def main() -> None:
    with open("dataset.jsonl", "w", encoding="utf-8") as f:
        for example in EXAMPLES:
            f.write(json.dumps(example) + "\n")
    print(f"Wrote {len(EXAMPLES)} examples to dataset.jsonl")


if __name__ == "__main__":
    main()
