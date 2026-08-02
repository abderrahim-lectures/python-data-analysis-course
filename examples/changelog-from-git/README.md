# Changelog from Git Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

The local companion to the course's [Build a Changelog Generator from Git History](../../docs/projects/changelog-from-git/index.md) project — fetch a repo's commit history with `git log`, synthesize a clean, categorized changelog (Added / Changed / Fixed) with a free-tier LLM, and verify every entry against the real commits.

## What's here

- `fetch_commits.py` — `load_commits(max_commits)`: runs `git log --format=...` (NUL-separated fields, so messy subjects can't break parsing) and returns one record per commit: hash, author, date, subject — [Step 1](../../docs/projects/changelog-from-git/index.md#step-1-fetch-the-commit-stream).
- `generate.py` — builds a prompt that demands categorization, noise-filtering, and a **commit-hash citation per entry**, then asks a free-tier LLM for the changelog — [Step 2](../../docs/projects/changelog-from-git/index.md#step-2-let-the-llm-synthesize-with-citations-required).
- `make_sample_repo.py` — creates `sample_repo/`, a small git repo with realistically messy history (features, fixes, "wip", a merge commit, "tweak") so the tool has something to chew on with no network access. The `sample_repo/` folder itself is gitignored and recreated by running this script.
- `notebook.ipynb` — a Colab/Kaggle/Binder-ready notebook that shallow-clones the course repo and generates a changelog from its recent commits. Launch it from the badges on the [lesson page](../../docs/projects/changelog-from-git/index.md#where-to-run-this), or open it directly: [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/changelog-from-git/notebook.ipynb) [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/changelog-from-git/notebook.ipynb) [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fchangelog-from-git%2Fnotebook.ipynb)

## Running it

First, create the bundled sample repo (no network, no API key needed for this step):

```bash
uv sync
uv run python make_sample_repo.py        # creates sample_repo/ with 14 messy commits
cd sample_repo
uv run python ../fetch_commits.py 50     # see the commit stream yourself
```

The generation step needs a free-tier API key:

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson's Setup](../../docs/projects/changelog-from-git/index.md#get-a-free-llm-api-key).
2. **Copy `.env.example` to `.env`** and fill in the key:
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Generate the changelog** from inside the sample repo:
   ```bash
   cd sample_repo
   uv run python ../generate.py 50
   ```

Every changelog entry ends with a short commit hash — verify a few with `git show <hash>` inside `sample_repo/`.

### Using a real repo

`cd` into any git repo you have locally (or shallow-clone the course repo) and run the same two commands from inside it:

```bash
git clone --depth 20 https://github.com/abderrahim-lectures/python-data-analysis-course
cd python-data-analysis-course
# copy the example scripts here (or run them with the --project flag)
uv run --project ../examples/changelog-from-git python ../examples/changelog-from-git/generate.py 20
```

`--depth 20` gives you enough history to make a changelog meaningful (a `--depth 1` clone has exactly one commit).

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open:

```bash
cd examples/changelog-from-git
uv run python make_sample_repo.py
cd sample_repo
uv run python ../generate.py 50
```

(add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) or `export` it for a one-off session).

## A note on staying current

Model names and APIs in this space change fast. The GitHub Models endpoint and `gpt-4o-mini` free tier used here were both verified working while writing this example, but may have drifted by the time you read it — see the callout in the [lesson](../../docs/projects/changelog-from-git/index.md#step-2-let-the-llm-synthesize-with-citations-required) for what to check before relying on this code.

## Built your own changelog tool?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
