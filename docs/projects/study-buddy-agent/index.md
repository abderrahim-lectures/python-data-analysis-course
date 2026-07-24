---
id: study-buddy-agent
title: "Build a Study-Buddy Quiz Agent"
sidebar_label: "Study-Buddy Quiz Agent"
slug: /projects/study-buddy-agent
description: "Graduate from the in-browser playground to real Python: build a terminal app that turns your own study notes into a quiz, using a free-tier LLM to write the questions and judge your answers."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Study-Buddy Quiz Agent

<ProjectPublishedDate projectId="study-buddy-agent" />

<ProjectGreeting />

Everything in the course so far ran in a sandboxed, in-browser playground — so you could start writing Python on day one with zero setup. This project is the graduation step: install Python for real on your own machine, then use it to build a tool you might actually keep using for a different class entirely — a quiz app that reads your own study notes, writes questions grounded in what's actually in them (not generic trivia), quizzes you one question at a time in the terminal, and has a language model judge whether your typed answer is close enough, with brief feedback either way.

This is optional and ungraded — a good fit once you've finished Python 101; nothing from Data Analysis is required. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv` and get a free-tier LLM API key.
2. Load one of your own notes files and decide how much of it to hand the model as context.
3. Write a prompt that generates quiz questions grounded in that specific text, along with an expected answer the program keeps to itself.
4. Build the interactive loop: ask a question, take your typed answer, have the model judge it and give feedback.
5. Track a running score and report it at the end.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — it's real Python running on your own machine, the same "graduate to real Python" move as every other project in this section.

**GitHub Codespaces** is a zero-setup alternative if you'd rather not install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab, Kaggle Notebooks, or Binder** work fine too — this project is just a terminal script that calls a hosted API, no GPU or heavy local package involved. A ready-to-run notebook version lives at [`examples/study-buddy-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-study-buddy-agent-project/examples/study-buddy-agent/notebook.ipynb) — it mirrors the same `generate_questions()` / `judge_answer()` / `run_quiz()` logic, uses `input()` in a cell the same way you would in a terminal, and embeds one of the sample notes files directly so it runs with no file upload needed. Launch it with one of the badges below:

{/* TODO: update these badge links to point at main once this PR merges */}
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-study-buddy-agent-project/examples/study-buddy-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-study-buddy-agent-project/examples/study-buddy-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-study-buddy-agent-project?filepath=examples%2Fstudy-buddy-agent%2Fnotebook.ipynb)

It's a lower-fidelity way to experience it than a real local project (no real file structure, no separate `.py` files), but it's a reasonable way to try the idea quickly.

## Setup

Everything you need before Step 1 — installing `uv`, creating the project, and getting an API key — lives here, all up front, so the steps below can focus purely on the quiz logic.

### Install `uv`

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

### Create the project

```bash
uv init study-buddy-agent
cd study-buddy-agent
uv add openai python-dotenv
```

`uv init` creates a small project (a `pyproject.toml` tracking your dependencies) and `uv add` installs packages into an isolated environment for that project — no manual virtual-environment setup. `openai` is the client library this lesson uses (GitHub Models, the suggested default provider below, exposes an OpenAI-compatible API); `python-dotenv` lets you keep your API key in a local `.env` file instead of `export`-ing it every session.

### Get a free AI API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another. The example script in the course repo ([`examples/study-buddy-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/study-buddy-agent)) uses GitHub Models by default; swapping to another provider is a small, well-documented change.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

Whichever you pick, the process is the same:

1. Sign in and generate an API key on that provider's site.
2. **Never paste this key directly into code or commit it to a repository.** Put it in a `.env` file instead:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

`python-dotenv` reads this file into `os.environ` automatically, the same pattern used throughout the [AI Agent](/docs/projects/ai-agent) and [RAG](/docs/projects/rag-notes) projects if you've done either of those. An API key is a secret, exactly like a password — anyone with it can use your account's quota.

:::tip[A .env file is often more convenient than export]
Instead of `export`-ing a key in every new terminal session, put it in a `.env` file in your project folder (see the repo example's `.env.example`) and load it with `load_dotenv()`, called once near the top of your script.
:::

With `uv`, `openai`, `python-dotenv`, and a key in `.env`, setup is done — everything from here is quiz logic.

## Step 1: Load your notes and choose a context strategy

Put a `.txt` or `.md` file of your own study notes somewhere in your project — a `notes/` folder, same convention as the [RAG project](/docs/projects/rag-notes), is a reasonable place. Reading it is nothing new:

```python
from pathlib import Path

notes_text = Path("notes/cell-biology.txt").read_text(encoding="utf-8")
```

Here's the design decision this project asks you to make explicitly, rather than skip past: **how much of your notes should the model actually see?**

- **Option A — feed the whole file as context.** Simplest possible approach: read one file, hand its entire text to the model in the prompt, done. This works great as long as a single file comfortably fits in the model's context window — a few thousand words is no problem at all for any modern free-tier model.
- **Option B — chunk, embed, and retrieve**, exactly like the [RAG project](/docs/projects/rag-notes) does: split your notes into small pieces, embed them locally, and retrieve only the most relevant ones for each question. This scales to a notes folder with dozens of long files that would never fit in one prompt.

**This lesson picks Option A** and is explicit about the tradeoff: it's less scalable, but it's a full lesson simpler to write, read, and debug — no embedding model, no vector search, no separate index-building step, just a string. That tradeoff is worth naming out loud, the same grounding principle as the RAG project either way: a good quiz question has to come from text the model was actually given, not text it's guessing might be relevant from training data. If your own notes outgrow a single file, don't reinvent retrieval — reuse `retrieve.py` from the RAG project's example and swap Step 2's prompt to use retrieved chunks instead of a whole file.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You have a `notes/` folder with at least one real `.txt`/`.md` file of your own study notes in it.</StepChecklistItem>
<StepChecklistItem>Reading the file and printing its length shows a real character count, not `0` or an error.</StepChecklistItem>
<StepChecklistItem>You can explain, in one sentence, why this lesson feeds the whole file to the model instead of retrieving chunks.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If your notes file were 50 pages long instead of one page, what specifically would go wrong with Option A first — an error, a truncated prompt, or something more subtle like the model only actually using the beginning of the file?
- The RAG project's chunking step exists to make each embedded piece of text *specific*. Does skipping chunking here lose that specificity, or does handing the model the whole file actually give it *more* to work with? Under what circumstances would each answer be right?

## Step 2: Generate quiz questions grounded in your notes

Ask the model for a fixed number of questions, each paired with an expected answer — and be explicit in the prompt that both must come from the specific text you're handing it, not general knowledge about the subject:

```python
import json

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

def generate_questions(notes_text: str, num_questions: int = 5) -> list[dict]:
    prompt = GENERATE_PROMPT_TEMPLATE.format(num_questions=num_questions, notes_text=notes_text)
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)
```

Two details worth noticing:

- **`expected_answer` is generated now, but never shown to the student before they answer.** The program keeps it in memory (in the dict returned by `generate_questions`) purely so Step 3 has something to judge against later — this is the same "grounded, not guessed" idea as the RAG project's retrieved context, just used to *check* an answer instead of *write* one.
- **Asking the model to reply with only JSON, then parsing it, is a fragile but common pattern.** Models occasionally wrap their answer in a ` ```json ` code fence even when told not to — the `removeprefix`/`removesuffix` calls above strip that off before `json.loads` runs. If parsing still fails, printing the raw response before parsing is the fastest way to see what actually came back.

:::tip[Ask for more questions than you need, if quality is inconsistent]
Small free-tier models occasionally produce a vague or oddly-phrased question. If you notice this on your own notes, a simple fix without any new code is to ask for a few extra questions in the prompt and only keep the first `N` — or just re-run generation, since it's a single API call.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`generate_questions(notes_text)` returns a Python list of dicts, each with a `"question"` and `"expected_answer"` key.</StepChecklistItem>
<StepChecklistItem>Reading a couple of the generated questions, they clearly reference specifics from your notes file, not generic facts about the topic a search engine could have written.</StepChecklistItem>
<StepChecklistItem>You understand why `expected_answer` is generated but not printed to the screen yet.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If you handed the model a notes file about a topic it already knows extremely well from training (say, basic photosynthesis), how would you tell whether a generated question is actually grounded in *your* notes versus the model's own prior knowledge? Is there a way to test this?
- What would happen to question quality if `notes_text` were empty or just a single short sentence? Try it — does the model produce a graceful response or something obviously broken?

## Step 3: Build the interactive quiz loop

Now the part that makes this a quiz and not just a question generator: ask each question, read the student's typed answer, and have the model judge it — free-text answers won't match the expected answer word-for-word, so an exact string comparison (`==`) would mark almost everything wrong.

```python
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

def judge_answer(question: str, expected_answer: str, student_answer: str) -> dict:
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
```

A three-way verdict (`correct` / `close` / `incorrect`) is deliberately more forgiving than a binary right/wrong — a student who has the right idea but misses a detail gets partial credit and useful feedback, rather than a flat "wrong" that doesn't say why.

:::tip[input() blocks until the student presses Enter]
`input("Your answer: ")` pauses the whole script at that line until you type something and hit Enter — exactly like `input()` back in Python 101, just now sitting inside a loop that also happens to make network calls before and after. If the terminal seems to hang after a question is printed, that's normal: it's waiting on you, not the API.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`run_quiz(questions)` prints one question at a time and actually waits for typed input before continuing.</StepChecklistItem>
<StepChecklistItem>A deliberately correct answer gets marked correct, and a deliberately wrong one gets marked incorrect, with the expected answer shown.</StepChecklistItem>
<StepChecklistItem>An answer that's roughly right but not exact wording (e.g. paraphrased) gets a reasonable verdict, not an unfair "incorrect".</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why judge with a *second* LLM call per question instead of asking the model to generate the question, expected answer, *and* a verdict all in one call at quiz-generation time? What would that approach get wrong, given that the student hasn't answered yet at generation time?
- The `"close"` verdict awards half credit. What's a case where a student's answer should clearly be "close" rather than fully correct or fully incorrect — and would your own answer to a real question from your notes land there?

## Step 4: Track the score and run it end to end

`run_quiz` above already tracks `score` as it goes and prints a final `score/total` line once the loop finishes. Wire the whole thing together in a `main()`:

```python
def main() -> None:
    notes_text = Path("notes/cell-biology.txt").read_text(encoding="utf-8")

    print("Generating questions...")
    questions = generate_questions(notes_text)
    print(f"Got {len(questions)} questions. Let's go!")

    run_quiz(questions)


if __name__ == "__main__":
    main()
```

Run it:

```bash
uv run python study_buddy.py
```

You should see a short "Generating questions..." pause (one API call), then five questions one at a time, each waiting for your typed answer before moving on, ending with a final score line like `Final score: 3.5/5`.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python study_buddy.py` runs end to end: generation, then all questions, then a final score line.</StepChecklistItem>
<StepChecklistItem>The final score number matches what you'd expect from your own answers (correct = +1, close = +0.5, incorrect = +0).</StepChecklistItem>
<StepChecklistItem>Running it again on the same notes file produces a *different* set of questions — confirming generation isn't hardcoded or cached.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If you ran the whole script twice in a row on the same notes file, would you expect the exact same five questions both times? Why or why not, given how `generate_questions` calls the model?
- Right now, a bad `judge_answer` call (a parsing failure, a network error) would crash the whole quiz mid-way, losing the student's progress on remaining questions. What's a minimal change to `run_quiz` that would let the quiz continue past one bad judgment instead of stopping entirely?

## ⚠️ Common pitfalls

- **Thin notes produce thin questions.** If your notes file is just a few short bullet points, the model has very little to ground five distinct questions in, and you'll get repetitive or overly easy ones ("What is the name of...?"). More detailed, prose-style notes produce noticeably better questions — this mirrors the RAG project's chunking lesson: better input text means a better result, not a smarter prompt.
- **The judge can be too strict or too lenient.** A small free-tier model grading free-text answers is not a precise instrument — it may mark a correct-but-oddly-phrased answer wrong, or wave through an answer that's actually missing a key detail. If you notice a consistent bias, tighten the `JUDGE_PROMPT_TEMPLATE` wording (e.g. "partial credit only counts if at least one specific fact is correct") rather than trying to work around it in Python.
- **Rate limits from two calls per question.** Unlike a single-shot RAG answer, this script makes *two* model calls per question by the time you finish a quiz — one for generation (once, per quiz) and one for judging (once, per question). A 5-question quiz is 6 calls total; run several quizzes back to back on a free tier and you may hit a 429 rate-limit error. This isn't a bug — see the [AI Agent project](/docs/projects/ai-agent#handling-rate-limits) for the same pattern and a retry approach you can copy.
- **Malformed JSON from the model breaks `json.loads`.** Even with an explicit "reply with ONLY JSON" instruction, a model occasionally adds a stray sentence before or after the JSON, or leaves a trailing comma. If you hit a `JSONDecodeError`, print the raw response before parsing it — that's almost always enough to see exactly what went wrong and adjust the prompt.

## What you just built

A small but complete "generate, then interact, then grade" pipeline: one LLM call turns your own notes into grounded questions with answers only the program can see, a loop collects your typed responses, and a second LLM call judges each one on meaning rather than exact wording, with a running score tallied across the whole session. Nothing here was faked into a toy that doesn't generalize — point it at a genuinely useful notes file for another class you're taking, and it's a real study tool, not just a course exercise.

## Where to go from here

- Once a single notes file stops being enough — a full semester's worth of notes across many files — reuse the [RAG project's](/docs/projects/rag-notes) `prepare_notes.py`/`build_index.py`/`retrieve.py` pipeline: retrieve the most relevant chunks for a *topic* you want to be quizzed on, and feed those to `generate_questions` instead of one whole file.
- Track missed questions across runs (write them to a small JSON file) and build a "review my weak spots" mode that re-quizzes you specifically on topics you got wrong before.
- Add a difficulty setting to `GENERATE_PROMPT_TEMPLATE` ("easy recall questions" vs. "questions requiring you to connect two ideas from the notes") and compare how much harder the harder mode actually feels.
- Revisit the bonus `try`/`except` content from Python 101 — wrapping `judge_answer` so one malformed response doesn't end the whole quiz (see the Socratic question in Step 4) is exactly that pattern.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="study-buddy-agent" />
