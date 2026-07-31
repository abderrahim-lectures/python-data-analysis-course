# Browser-Automation Agent Example

A real, runnable browser-automation agent — combines Python [Playwright](https://playwright.dev/python/)
(real browser control) with an LLM tool-calling agent built with LangChain's
[`deepagents`](https://github.com/langchain-ai/deepagents), the fuller version of the one built step
by step in the course's [Browser-Automation Agent project](../../docs/projects/browser-automation-agent/index.md).

## Objective

Fill out a real, stable practice form — [httpbin.org/forms/post](https://httpbin.org/forms/post), a
well-known form-testing sandbox with no login and no real data behind it — from a plain-English list
of details, without hardcoding which form field goes where:

- `scripted_fill.py` — the brittle, hand-written way: every field name and value hardcoded, no LLM.
- `agent.py` — the agent way: Playwright actions (`navigate`, `read_form_fields`, `fill_text_field`,
  `select_option`, `click_submit`, `read_page_text`) exposed as tools, and an LLM decides which tool
  to call, with what arguments, based on the real fields it reads off the live page.

## Running it

### 1. Install Python Playwright's browser binary

Playwright's Python *package* is just a pip/`uv` dependency, but it doesn't ship a browser — you need
to separately download one real browser binary the first time:

```bash
uv add playwright
uv run playwright install chromium
```

This is a one-time step (per machine) and is **separate from this repo's own Node-based Playwright**,
which is dev tooling used only for this site's end-to-end tests (see the repo root `package.json`) —
the two never interact, and you don't need Node installed to run anything in this folder.

### 2. Get a free-tier API key

**You're free to use whichever provider you like** — see the table in the
[project doc's Setup section](../../docs/projects/browser-automation-agent/index.md#setup) for where
to get one for each. Six are wired up already: **GitHub Models** (the default), Gemini, Groq, Mistral,
Cerebras, and OpenRouter.

### 3. Configure and run

```bash
cp .env.example .env
# then edit .env with your key
uv run python scripted_fill.py   # Step 1: the hardcoded version
uv run python agent.py           # Steps 2-4: the agent version
```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project
automatically on first run. Both scripts open a real, visible Chromium window (`headless=False`) so
you can watch what's happening — flip that to `True` in either script once you trust it.

## Running it in GitHub Codespaces

Click the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course)
to get a ready-to-go cloud dev environment. Browser install works fine there too — just run the same
`uv run playwright install chromium` step inside the Codespace terminal before running either script.

## No notebook version

Unlike this course's other agent examples, there's no Colab/Kaggle/Binder notebook for this one — a
real Playwright browser needs a real browser binary and (for a visible window) a display, neither of
which a hosted notebook can give you. See the project doc's
["Where to run this"](../../docs/projects/browser-automation-agent/index.md#where-to-run-this) section
for the reasoning, including what a notebook-friendly *partial* demo would look like if you want to
build one yourself.

## A note on staying current

Model names and library APIs in this space change fast — the model ID and `create_deep_agent()` call
here were both verified against a live run while writing this example, but may have drifted by the
time you read this. Playwright's own selector APIs are comparatively stable, but always worth a quick
check against [current docs](https://playwright.dev/python/docs/intro) too.

## Built your own agent for the capstone?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a
pull request — no git experience required, it walks through every step.
