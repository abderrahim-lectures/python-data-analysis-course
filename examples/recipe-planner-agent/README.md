# Recipe-Planner Agent Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-recipe-planner-agent-project/examples/recipe-planner-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-recipe-planner-agent-project/examples/recipe-planner-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-recipe-planner-agent-project?filepath=examples%2Frecipe-planner-agent%2Fnotebook.ipynb)

A real, runnable "recipe planner" agent — the example that accompanies the course's [Recipe-Planner Agent](../../docs/projects/recipe-planner-agent/index.md) project, built with LangChain's [`deepagents`](https://github.com/langchain-ai/deepagents).

## Objective

Given a list of ingredients you have on hand, suggest 2-3 real meals you could make, and produce a shopping list of anything extra needed for the best one — grounded in a real, local recipe database (`recipes.py`), not the model's own guesses:

- **`search_recipes_by_ingredients`** searches the 13 recipes in `recipes.py` for the ones that best overlap with your ingredients, and reports exactly what's missing from each.
- The agent's system prompt (in `planner.py`) explicitly forbids inventing a recipe that tool didn't return — every suggestion traces back to a real entry in `recipes.py`.

This is the same tool-calling pattern taught in the [AI Agent project](../../docs/projects/ai-agent/index.md), applied to a small, structured, local dataset instead of a toy topic list.

## Running it

1. **Get a free-tier API key** — see the six-provider table in the [lesson's Setup section](../../docs/projects/recipe-planner-agent/index.md#setup). Defaults to GitHub Models.
2. **Copy `.env.example` to `.env`** and fill in your key:
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Run it with `uv`** — no manual virtual environment setup needed:
   ```bash
   uv run python planner.py
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run. The script asks the agent for meal suggestions given a sample ingredient list, then asks it to build a shopping list for the first suggestion — printing each step of the conversation.

## Running it in a notebook

No local setup at all? [`notebook.ipynb`](./notebook.ipynb) is a self-contained Jupyter version of this same example — the recipe database, the search tool, and the agent, all in one notebook you can run cell-by-cell in Google Colab, Kaggle Notebooks, or Binder (badges above), or in Jupyter/JupyterLab locally. It asks for your API key with `getpass` instead of a `.env` file, so nothing gets written to disk.

## Running it in GitHub Codespaces

Click the badge above, or open [the whole repo in a free Codespace](https://github.com/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) named `GITHUB_TOKEN` (or `export` it for a one-off session), then:

```bash
cd examples/recipe-planner-agent
uv run python planner.py
```

## Try your own ingredients

Edit the `on_hand` string near the bottom of `planner.py`, or import and call it from your own script:

```python
from planner import build_agent, ask

agent = build_agent()
conversation = [{"role": "user", "content": "I have rice, onion, and eggs. What can I make?"}]
result = ask(agent, conversation)
print(result["messages"][-1].content)
```

## Grow the recipe database

`recipes.py` ships with 13 simple recipes. The bigger and more varied that list is, the better the agent's suggestions get — try adding a few of your own (same `name`/`ingredients`/`instructions` shape) and re-running.

## A note on staying current

Model names and library APIs in this space change fast — the model ID and `create_deep_agent()` call here were both verified against a live run while writing this example, but may have drifted by the time you read this. See the callout in the [lesson's Setup section](../../docs/projects/recipe-planner-agent/index.md#setup) for what to check before relying on this code.

## Built your own version for the class?

See [`examples/student-projects/`](../student-projects/) for how to share it — no git experience required, it walks through every step.
