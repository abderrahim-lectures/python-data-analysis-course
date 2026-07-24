# Meeting-Notes Summarizer Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

The local companion to the course's [Build a Meeting-Notes Summarizer](../../docs/projects/meeting-notes-summarizer/index.md) project — a small, complete structured-extraction pipeline that turns a plain-text meeting transcript into decisions, action items, and open questions, using a free-tier LLM and a carefully designed JSON-extraction prompt.

## What's here

- `sample_transcripts/` — three realistic sample transcripts (a daily standup, a product-planning meeting, and an incident review), so this runs with zero setup.
- `summarize.py` — the whole pipeline: loads a transcript, builds the structured-extraction prompt, calls the LLM, defensively parses and validates the JSON response, and writes both a `.json` and a `.md` output file. Supports all six free-tier providers from the lesson's table, selected with one environment variable — deliberately fuller than the lesson's step-by-step snippets, which split this file into `load_transcript.py`, `extract_prompt.py`, and `format_summary.py` for teaching purposes.

## Running it

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson's Setup section](../../docs/projects/meeting-notes-summarizer/index.md#3-get-a-free-llm-api-key) for where to get one for each.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider (and `LLM_PROVIDER` if you're not using the default):
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Run it with `uv`** — no manual virtual environment setup needed:
   ```bash
   uv run python summarize.py sample_transcripts/standup.txt
   uv run python summarize.py sample_transcripts/product_planning.txt
   uv run python summarize.py sample_transcripts/incident_review.txt
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run. Each run prints a readable Markdown summary and writes `<name>_summary.json` and `<name>_summary.md` next to the input transcript (both gitignored, since they're generated output).

### Using it on your own transcripts

Drop any plain-text, speaker-labeled transcript into `sample_transcripts/` (or point at it from anywhere) and run:

```bash
uv run python summarize.py path/to/your_transcript.txt
```

### Using it from your own code

```python
from summarize import summarize, format_markdown

result = summarize("sample_transcripts/standup.txt")
print(format_markdown(result, source="standup.txt"))
print(result["action_items"])  # a real Python list of dicts, ready to use
```

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open, add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) named for whichever provider you're using (`GITHUB_TOKEN` for the default), or just `export` it for a one-off session, then run:

```bash
cd examples/meeting-notes-summarizer
uv run python summarize.py sample_transcripts/standup.txt
```

## A note on staying current

Model names and library APIs in this space change fast — the model IDs used here were verified against a live run while writing this example, but may have drifted by the time you read this. See the callout in the [lesson](../../docs/projects/meeting-notes-summarizer/index.md#step-3-call-the-llm-and-parse-the-json-response) for what to check before relying on this code.

## Built your own summarizer?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
