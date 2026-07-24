"""Study-Buddy: generates quiz questions grounded in one of your own notes
files, then quizzes you on them interactively in the terminal.

Run with: uv run python study_buddy.py [notes/some-file.txt]
(defaults to notes/cell-biology.txt if no path is given)

Uses GitHub Models by default (see .env.example) -- swap the OpenAI(...)
client below for your own provider's client if you picked a different one
from the table in the lesson.

Design choice: this feeds the LLM the *entire* text of one notes file as
context, rather than chunking + embedding + retrieving like the course's
RAG project. That's deliberate -- see the lesson's Step 1 for the tradeoff.
It keeps this script simple and is a fine choice as long as a single note
file comfortably fits in the model's context window (a few thousand words
is no problem at all). If you outgrow that -- a notes folder with dozens of
long files -- reuse the RAG project's chunk-embed-retrieve pipeline instead
of pasting every file into every prompt.
"""

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

NOTES_DIR = Path("notes")
DEFAULT_NOTES_FILE = NOTES_DIR / "cell-biology.txt"
NUM_QUESTIONS = 5
MODEL = "gpt-4o-mini"  # confirm this still has a free tier before running

client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

GENERATE_PROMPT_TEMPLATE = """You are a study-buddy quiz generator. Read the
study notes below and write exactly {num_questions} quiz questions that can
ONLY be answered correctly by someone who has read THESE SPECIFIC notes --
not generic questions about the general subject. Base every question and
every expected answer strictly on facts stated in the text.

Reply with ONLY a JSON array, no other text, in this exact shape:
[
  {{"question": "...", "expected_answer": "..."}},
  ...
]

Study notes:
{notes_text}
"""

JUDGE_PROMPT_TEMPLATE = """You are grading a student's quiz answer. Judge
whether the student's answer is correct, partially correct, or incorrect,
compared to the expected answer below -- the student won't phrase it
identically, so judge on meaning, not exact wording.

Question: {question}
Expected answer: {expected_answer}
Student's answer: {student_answer}

Reply with ONLY JSON, no other text, in this exact shape:
{{"verdict": "correct" | "close" | "incorrect", "feedback": "one brief, encouraging sentence"}}
"""


def load_notes_text(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(
            f"Couldn't find {path} -- pass a path to one of your own notes files, "
            f"e.g. uv run python study_buddy.py notes/world-war-two-pacific.txt"
        )
    return path.read_text(encoding="utf-8")


def generate_questions(notes_text: str, num_questions: int = NUM_QUESTIONS) -> list[dict]:
    """Asks the LLM for a list of {"question", "expected_answer"} dicts,
    grounded in notes_text. expected_answer is kept by the program to judge
    against later -- it's never shown to the student before they answer."""
    prompt = GENERATE_PROMPT_TEMPLATE.format(num_questions=num_questions, notes_text=notes_text)
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    # Models occasionally wrap JSON in a ```json ... ``` fence despite being asked not to.
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)


def judge_answer(question: str, expected_answer: str, student_answer: str) -> dict:
    """Asks the LLM to grade one answer. Returns {"verdict": ..., "feedback": ...}."""
    prompt = JUDGE_PROMPT_TEMPLATE.format(
        question=question, expected_answer=expected_answer, student_answer=student_answer
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)


def run_quiz(questions: list[dict]) -> None:
    """The interactive loop: ask each question, take typed input, judge it,
    print feedback, and keep a running score."""
    score = 0
    for i, item in enumerate(questions, start=1):
        print(f"\nQuestion {i}/{len(questions)}: {item['question']}")
        student_answer = input("Your answer: ").strip()

        result = judge_answer(item["question"], item["expected_answer"], student_answer)
        verdict = result.get("verdict", "incorrect")
        feedback = result.get("feedback", "")

        if verdict == "correct":
            score += 1
            print(f"✅ Correct! {feedback}")
        elif verdict == "close":
            score += 0.5
            print(f"🟡 Close. {feedback}")
        else:
            print(f"❌ Not quite. {feedback}")
            print(f"   Expected answer: {item['expected_answer']}")

    print(f"\nFinal score: {score}/{len(questions)}")


def main() -> None:
    notes_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_NOTES_FILE
    notes_text = load_notes_text(notes_path)

    print(f"Generating {NUM_QUESTIONS} questions from {notes_path.name}...")
    questions = generate_questions(notes_text)
    print(f"Got {len(questions)} questions. Let's go!")

    run_quiz(questions)


if __name__ == "__main__":
    main()
