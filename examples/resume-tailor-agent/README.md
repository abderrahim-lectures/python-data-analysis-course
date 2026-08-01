# Resume & Cover-Letter Tailoring Agent Example

The local companion to the course's [Build a Resume & Cover-Letter Tailoring Agent](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/resume-tailor-agent) lesson -- a real, runnable CLI that reads your resume and a job description from text files and asks a free-tier LLM to score the match, draft a tailored cover letter, and list concrete resume edits. It only ever works from what's already on your resume -- no invented experience.

## What's here

`tailor.py` -- a single-file CLI with:

- `load_text(path)` -- reads a resume or job description from a `.txt` or `.md` file with `pathlib`.
- `SYSTEM_PROMPT` -- a tailoring-specific system prompt with a hard **no-fabrication rule**: never invent skills, titles, or dates; never upgrade a bullet point beyond what the resume plainly supports; report genuine gaps instead of papering over them.
- `tailor(resume, job, provider=...)` -- sends both documents to whichever free-tier provider you've configured and returns the structured result (match score, cover letter draft, resume edits).
- `truncate(text)` -- caps oversized documents before they're sent, so a long posting doesn't silently blow past a free-tier context window or token quota.

`sample_resume.txt` and `sample_job.txt` -- a bundled pair to try the tool on immediately, with enough deliberate overlap and gap to make the output interesting (the sample resume has zero machine-learning experience; the posting is for a junior ML engineer).

**You're free to use whichever free-tier provider you like** -- this isn't locked to any one of them. Six are wired up already: **GitHub Models** (the default -- no separate signup, uses a GitHub account you already have), Gemini, Groq, Mistral, Cerebras, and OpenRouter, all through the same `openai` client pointed at each provider's own OpenAI-compatible endpoint.

## Running it

1. **Get a free-tier API key** from your chosen provider -- see the table in the [lesson's Setup section](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/resume-tailor-agent#get-a-free-llm-api-key) for where to get one for each.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider (and `LLM_PROVIDER` if you're not using the default):
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored -- never commit a real key.
3. **Run it with `uv`** -- no manual virtual environment setup needed:
   ```bash
   uv run python tailor.py sample_resume.txt sample_job.txt
   # or with your own documents:
   uv run python tailor.py my_resume.txt my_job.txt
   uv run python tailor.py my_resume.txt my_job.txt --provider groq
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

### The no-fabrication audit

Before you'd ever send a generated cover letter anywhere, do this once: print the draft to a file, and next to each claim write the resume line it comes from. Any claim with no supporting line is a fabrication -- and a sign you should tighten the system prompt or switch models.

## Running it in GitHub Codespaces

Click into a [Codespace for the whole repo](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are preinstalled) -- the bundled sample files are already there, so you can run every command above immediately, no setup beyond copying `.env.example` to `.env`.

## Try it with zero setup: `notebook.ipynb`

[`notebook.ipynb`](./notebook.ipynb) in this folder is a runnable notebook version of this same tool, for Colab, Kaggle, or Binder:

<!-- TODO: update these badge links to point at main once this PR merges -->
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/resume-tailor-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/resume-tailor-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fresume-tailor-agent%2Fnotebook.ipynb)

A notebook environment has no local files, which is this tool's whole premise -- so rather than pretending that gap doesn't exist, the notebook reads the bundled `sample_resume.txt` from the course repo, lets you paste a real job description (or fetch one from a URL), and asks for your API key interactively with `getpass`. Every other part of the tool -- the `pathlib` file reading, the system prompt, the LLM call, the structured output -- runs unmodified. It's a fast way to see the whole thing work end to end before setting it up locally; once you want to run it against your real resume, come back to `uv run python tailor.py` above or a Codespace.

## A note on staying current

Model names and provider free-tier terms change fast -- the model IDs and endpoints in `tailor.py`'s `PROVIDERS` dict were verified against a live run while writing this example, but check each provider's own docs before relying on them, since they may have drifted by the time you read this.

## Built your own version?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request -- no git experience required, it walks through every step.
