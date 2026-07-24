# Study-Buddy Agent Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

The local companion to the course's [Build a Study-Buddy Quiz Agent](../../docs/projects/study-buddy-agent/index.md) project — a small script that reads one of your own notes files, asks a free-tier LLM to write quiz questions grounded in that specific text, then quizzes you on them interactively in the terminal, with the same LLM judging whether your typed answers are correct.

## What's here

- `notes/` — three short sample notes files (cell biology, the Pacific theater of WWII, and Python dictionaries) so the script runs out of the box with no setup of your own.
- `study_buddy.py` — the whole thing: `generate_questions()` (grounded question generation, [Step 2](../../docs/projects/study-buddy-agent/index.md#step-2-generate-quiz-questions-grounded-in-your-notes) of the lesson), `judge_answer()` and `run_quiz()` (the interactive quiz loop, [Step 3](../../docs/projects/study-buddy-agent/index.md#step-3-build-the-interactive-quiz-loop)).

This script deliberately feeds the LLM one whole notes file as context, rather than chunking/embedding/retrieving like the course's [RAG project](../rag-notes/) — see the lesson's Step 1 for why that's a reasonable choice here, and when you'd want the RAG approach instead.

## Running it

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson's Setup section](../../docs/projects/study-buddy-agent/index.md#setup) for where to get one.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider:
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Run it**:
   ```bash
   uv run python study_buddy.py
   ```
   This quizzes you on `notes/cell-biology.txt` by default. Pass a different path to quiz on a different file:
   ```bash
   uv run python study_buddy.py notes/world-war-two-pacific.txt
   ```

`uv` reads `pyproject.toml` and creates an isolated environment for this project automatically on first run.

### Using your own notes

Add your own `.txt`/`.md` file to `notes/` (or anywhere else) and pass its path as the argument — no code changes needed. Keep a single file to a length you'd comfortably paste into a chat window; if your notes are much longer than that, see the "Where to go from here" section of the lesson for scaling this up with retrieval.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open, add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) (or `export` it for a one-off session), then:

```bash
cd examples/study-buddy-agent
uv run python study_buddy.py
```

## A note on staying current

Model names and library APIs in this space change fast — the model ID and GitHub Models endpoint used here were verified working while writing this example, but may have drifted by the time you read this. See the callout in the [lesson](../../docs/projects/study-buddy-agent/index.md#setup) for what to check before relying on this code.

## Built your own quiz agent?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
