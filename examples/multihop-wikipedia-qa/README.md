# Multi-Hop Wikipedia QA Example

The local companion to the course's [Build a Multi-Hop Question-Answering Tool Over a Small Wikipedia Sample](../../docs/projects/multihop-wikipedia-qa/index.md) project — a two-round retrieval pipeline that answers questions whose facts live in *two different* documents, and shows you the exact evidence chain it used to do it.

## What's here

- `data/articles/` — six short, plain-text Wikipedia-style articles (fictional but realistic: biographies, companies, cities, an event), committed so the retrieval steps run out of the box with no setup. They're *crafted* so a few questions genuinely need facts from two articles at once.
- `data/test_questions.json` — six bundled test questions, three of them genuinely multi-hop (the answer only exists once two articles' facts are combined), each with an `expected` answer so you can audit the tool's output against a known ground truth.
- `main.py` — the whole tool in one file:
  - `build_index()` — splits the articles into chunks and embeds them locally with `sentence-transformers`, saving `data/index.npy` + `data/chunks.json` (both gitignored).
  - `retrieve(question, ...)` — cosine-similarity search over the chunks with `numpy`.
  - `single_hop(...)` — the baseline: retrieve the top-K chunks once and answer from only those.
  - `multi_hop(...)` — the point of the project: retrieve, ask the model whether the evidence is enough, and if not retrieve a **second round** guided by the model's own follow-up query, then answer from the merged evidence.
  - Side-by-side output — both answers printed as aligned columns with every evidence chunk each one used.
- `notebook.ipynb` — a Colab/Kaggle/Binder-ready notebook that mirrors the same pipeline with the articles embedded directly in it (no local files needed).

## Running it

```bash
uv sync
uv run python main.py --rebuild      # embeds data/articles/ -- local, no API key
uv run python main.py                # runs the six bundled test questions, single-hop vs multi-hop
```

Retrieval is fully local; only the answer generation calls a hosted model, which needs a free-tier API key:

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson's Setup section](../../docs/projects/multihop-wikipedia-qa/index.md#get-a-free-llm-api-key) for where to get one for each.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider:
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Run it**:
   ```bash
   uv run python main.py                # bundled test questions + scoreboard
   uv run python main.py --question "Who founded the company that powered TransLisboa's electric buses?"
   uv run python main.py --query        # interactive mode
   uv run python main.py --provider groq  # pick a non-default provider
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run. The embedding model (`all-MiniLM-L6-v2`, ~80MB) also downloads on first run.

## What the comparison is supposed to show

Run the default `uv run python main.py` and watch the three multi-hop questions: single-hop retrieves the *clue* article but not the *fact* article, so it either says "the context doesn't say" or guesses a plausible-sounding answer; multi-hop spots the gap, writes a follow-up search query, pulls the second article, and answers correctly. Every chunk is printed beside each answer so you can see exactly why.

Two honest caveats, spelled out in the lesson too: this is a deliberately minimal version of what researchers call **iterative retrieval** — real multi-hop QA systems do far more — and on such a small corpus single-hop will sometimes *accidentally* land the right chunks and get a multi-hop question right by luck. The scoreboard prints both pipelines' totals against the expected answers, so you can see the trend rather than trusting any single question.

## Running it in GitHub Codespaces

Click into a [Codespace for the whole repo](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are preinstalled per `.devcontainer/devcontainer.json`), then:

```bash
cd examples/multihop-wikipedia-qa
uv sync
uv run python main.py --rebuild
uv run python main.py
```

(add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) or `export` it for a one-off session before the answer-generation step).

## A note on staying current

Model names, provider free-tier terms, and library APIs change fast. `all-MiniLM-L6-v2` and the six provider endpoints in `main.py`'s `PROVIDERS` dict were verified against live runs while writing this example, but check each provider's own docs before relying on them — they may have drifted by the time you read this.

## Built your own version?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
