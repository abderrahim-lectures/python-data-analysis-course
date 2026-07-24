---
id: recipe-planner-agent
title: "Build a Recipe-Planner Agent"
sidebar_label: "Build a Recipe-Planner Agent"
slug: /projects/recipe-planner-agent
description: "Graduate from the in-browser playground to real Python: build a tool-using AI agent with LangChain's deepagents that suggests meals from the ingredients you have on hand, grounded in a real local recipe database."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Recipe-Planner Agent

<ProjectPublishedDate projectId="recipe-planner-agent" />

<ProjectGreeting />

You type in a list of ingredients you actually have on hand — say, eggs, tomatoes, garlic, and bread — and an agent suggests 2-3 real meals you could make with them, then builds a shopping list of whatever's missing for the best one. The twist that makes this a genuinely useful agent, not just a chatbot: it never invents a recipe. It calls a tool that searches a real, local recipe database and can only suggest what that tool actually returns — the same grounding idea behind far more serious "don't let the model make things up" systems, shrunk down to something you can build in an afternoon.

This assumes Python 101. Having done the [AI Agent project](/docs/projects/ai-agent) first is a real help, not a hard requirement — this project reuses the same `deepagents` framework and the same tool-calling pattern, just with a more structured, real-world-shaped tool. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv`, get a free-tier AI API key, and set up a small project with `deepagents` — all up front, in Setup below.
2. Define a small local "recipe database" — a plain Python list of dicts, 10-15 recipes, each with its own ingredient list.
3. Write a tool function the agent can call to search that database by ingredients you have on hand.
4. Wire that tool into a `deepagents` agent with a system prompt that keeps it grounded in real recipes only.
5. Ask the agent for meal suggestions from a real ingredient list, then have it build a shopping list for the one you pick.

## Where to run this

**Locally with `uv`** is the primary, recommended path — real Python installed on your own machine, the same "graduate to real Python" move as every other project in this section. Steps 1 onward below assume this path.

**GitHub Codespaces** works just as well: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab, Kaggle Notebooks, or Binder** are fine too — this is a lightweight script that just calls an API, no GPU or heavy install involved. A ready-to-run notebook version of this project ([`examples/recipe-planner-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recipe-planner-agent/notebook.ipynb)) is one click away:

{/* TODO: update these badge links to point at main once this PR merges */}
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-recipe-planner-agent-project/examples/recipe-planner-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-recipe-planner-agent-project/examples/recipe-planner-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-recipe-planner-agent-project?filepath=examples%2Frecipe-planner-agent%2Fnotebook.ipynb)

It's a lower-fidelity way to experience the project than a real local `uv` project — no separate files, no real project structure — but perfectly workable for trying the idea out. Set your API key with `os.environ["GITHUB_TOKEN"] = "..."` in the getpass cell (or use Colab's Secrets panel).

## Setup

Everything needed before you write a single line of the agent itself lives here — installing `uv`, getting an API key, creating the project, and setting up your `.env` file. Steps 1 onward assume all of this is already done.

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

If you don't already have a real Python interpreter installed and managed by `uv` (from an earlier project in this series), grab one now:

```bash
uv python install 3.12
```

### Get a free AI API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

Whichever you pick, the process is the same: sign in, generate a key on that provider's site, and **never paste it directly into code or commit it to a repository**. This project keeps it in a `.env` file (below) instead.

### Set up the project with `uv`

```bash
uv init recipe-planner-agent
cd recipe-planner-agent
uv add deepagents langchain-openai python-dotenv
```

`uv init` creates a small project (a `pyproject.toml` tracking your dependencies) and `uv add` installs packages into an isolated environment for it automatically, with no manual virtual-environment setup. `deepagents` is LangChain's framework for building agents with tool use built in — the same one used in the [AI Agent project](/docs/projects/ai-agent); `langchain-openai` is the integration package this example uses to talk to GitHub Models (its API is OpenAI-compatible, so the OpenAI integration package works for it too — see the tip below if you picked a different provider); `python-dotenv` lets you keep your API key in a local `.env` file.

If you picked a different provider above, swap `langchain-openai` for that provider's own package — `langchain-google-genai` (Gemini), `langchain-groq` (Groq), or `langchain-mistralai` (Mistral). Cerebras and OpenRouter are also OpenAI-compatible, so they use `langchain-openai` too, just with a different `base_url`.

:::tip[Check the current docs — and the model name]
Agent frameworks move fast, and so do model names: they get renamed and retired on a timescale of months, not years. Use an explicit, versioned model ID rather than a `-latest` alias — several providers, including Google, have deprecated those because they silently hot-swap to a new model version, which can break working code with no warning. Before running this, check your provider's current pricing/model page, and skim `deepagents`' own README for its current API.
:::

### Create your `.env` file

In your project folder, create a file named `.env` (never commit this) with the key for whichever provider you picked:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

`python-dotenv` (installed above) reads this file into `os.environ` at the top of your script, so your code never has the key typed into it directly.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv --version` prints a version number.</StepChecklistItem>
<StepChecklistItem>You have a real API key from one provider, and it's saved in a `.env` file — not pasted into any `.py` file.</StepChecklistItem>
<StepChecklistItem>`uv add deepagents langchain-openai python-dotenv` (or your provider's package) completed without errors.</StepChecklistItem>
</StepChecklist>

## Step 1: Build your local recipe database

Everything the agent will ever suggest comes from this one data structure — a plain Python list of dicts, no database server, no external API. Create `recipes.py`:

```python
# recipes.py
RECIPES = [
    {
        "name": "Tomato Egg Stir-Fry",
        "ingredients": ["eggs", "tomatoes", "garlic", "salt", "oil"],
        "instructions": "Scramble the eggs, set aside. Saute garlic and chopped tomatoes "
        "until soft, stir the eggs back in, season with salt.",
    },
    {
        "name": "Garlic Butter Pasta",
        "ingredients": ["pasta", "butter", "garlic", "parmesan", "salt"],
        "instructions": "Boil the pasta. Melt butter with minced garlic, toss the pasta "
        "in it, top with grated parmesan and salt.",
    },
    {
        "name": "Classic Grilled Cheese",
        "ingredients": ["bread", "cheese", "butter"],
        "instructions": "Butter one side of each bread slice, add cheese between the "
        "unbuttered sides, grill in a pan until golden on both sides.",
    },
    {
        "name": "Simple Fried Rice",
        "ingredients": ["rice", "eggs", "soy sauce", "onion", "oil"],
        "instructions": "Scramble the eggs and set aside. Fry chopped onion in oil, add "
        "cooked rice, stir in soy sauce and the eggs.",
    },
    {
        "name": "Chickpea Salad",
        "ingredients": ["chickpeas", "cucumber", "tomatoes", "olive oil", "lemon", "salt"],
        "instructions": "Drain the chickpeas, dice the cucumber and tomatoes, toss "
        "everything with olive oil, lemon juice, and salt.",
    },
    # ... a real database keeps going. See examples/recipe-planner-agent/recipes.py
    # in the course repo for the full 13-recipe version this lesson uses.
]
```

Each recipe is just a dict with a `name`, an `ingredients` list (lowercase, no quantities — just what's needed), and short `instructions`. This is the exact same shape as the toy `topics` list from the AI Agent project's `search_course_topics`, just richer: a list of structured records your tool function can search over.

:::tip[Bigger is genuinely better here]
A recipe database with 3-4 entries will make your agent look broken even when the code is fine — most ingredient lists a student types in just won't overlap with anything. Aim for the full 10-15 recipes (the repo copy has 13), covering a real mix of proteins, carbs, and vegetables, so a typical "what's in my fridge" list actually has a decent chance of matching something.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`recipes.py` defines `RECIPES` as a list of at least 10 dicts.</StepChecklistItem>
<StepChecklistItem>Every recipe has `name`, `ingredients` (a list), and `instructions`.</StepChecklistItem>
<StepChecklistItem>Ingredient names are lowercase and consistent across recipes (e.g. always `"tomatoes"`, never a mix of `"tomatoes"` and `"Tomato"`).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why a list of dicts instead of, say, a dict keyed by recipe name? What would you gain or lose either way?
- If two recipes share almost all their ingredients, how might that affect which one the agent tends to suggest first?

## Step 2: Write a tool the agent can search recipes with

The agent doesn't get to read `recipes.py` directly — it can only see what a tool function returns, exactly like `search_course_topics` in the AI Agent project. Add this to `recipes.py`, or a new file that imports `RECIPES`:

```python
def search_recipes_by_ingredients(ingredients: list[str]) -> str:
    """Search the local recipe database for recipes that best match the given ingredients.

    `ingredients` should be a list of ingredient names the caller already
    has on hand (e.g. ["eggs", "tomatoes", "garlic"]). Returns the top
    matching recipes, ranked by how many of their ingredients are already
    covered, each with its full ingredient list and the ingredients still
    missing -- so a shopping list can be built from the result without
    guessing. Returns a plain "no matches" message if nothing overlaps at
    all, so the caller never has to invent a recipe out of thin air.
    """
    have = {i.strip().lower() for i in ingredients}
    scored = []
    for recipe in RECIPES:
        needed = {i.lower() for i in recipe["ingredients"]}
        overlap = have & needed
        if not overlap:
            continue
        missing = sorted(needed - have)
        scored.append((len(overlap), recipe, missing))

    if not scored:
        return "No matching recipes found in the database for those ingredients."

    scored.sort(key=lambda row: row[0], reverse=True)
    top = scored[:5]

    lines = []
    for _, recipe, missing in top:
        missing_text = ", ".join(missing) if missing else "nothing -- you have it all!"
        lines.append(
            f"- {recipe['name']} | full ingredient list: {', '.join(recipe['ingredients'])} "
            f"| missing: {missing_text}"
        )
    return "Matching recipes (best match first):\n" + "\n".join(lines)
```

The core idea: `have & needed` (set intersection) counts how many of a recipe's ingredients you already have, `needed - have` (set difference) is exactly what's still missing. Sorting by overlap size, biggest first, means the recipes closest to "ready to cook right now" come first — and because the tool returns the missing ingredients for *every* candidate, not just the top one, the agent has everything it needs to build a shopping list later without a second lookup.

Notice the return type is a plain string, same as `search_course_topics` and `count_words` in the earlier projects — the model reads text, not Python objects, so a clearly formatted string is what a tool should hand back.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`search_recipes_by_ingredients(["eggs", "tomatoes", "garlic"])` called directly in Python (no agent yet) returns a real, non-empty string.</StepChecklistItem>
<StepChecklistItem>Calling it with ingredients that match nothing in `RECIPES` returns the "no matching recipes" message, not an error.</StepChecklistItem>
<StepChecklistItem>The docstring explains what the function does and what it returns — not a placeholder.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why does the tool return the missing ingredients for the top 5 matches, not just the single best one? What would the agent lose if it only got the best match?
- What happens right now if someone passes `["Tomatoes"]` (capitalized) — does it still match `"tomatoes"` in the database? Why?

## Step 3: Wire the tool into a `deepagents` agent

Create `planner.py`:

```python
import os

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from recipes import RECIPES, search_recipes_by_ingredients

load_dotenv()  # reads .env into the environment, if present

SYSTEM_PROMPT = """You are a helpful recipe-planning assistant.

You have exactly one source of truth for what recipes exist: the
search_recipes_by_ingredients tool. Never invent, guess, or recall a recipe
from your own training data -- only suggest recipes that tool actually
returned in its results for this conversation.

When a student lists what they have on hand:
1. Call search_recipes_by_ingredients with that ingredient list.
2. Suggest 2-3 recipes from the tool's results, explaining briefly why each
   is a good fit (how much they already have).
3. If the tool returns no matches, say so plainly and suggest the student
   try listing a few more ingredients -- do not make up a recipe to fill
   the gap.
4. If asked to build a shopping list for a specific recipe, use the
   "missing" ingredients the tool already reported for that recipe -- don't
   recompute or guess at what's missing.
"""

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running -- see the tip above
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[search_recipes_by_ingredients],
    system_prompt=SYSTEM_PROMPT,
)
```

This is the same `create_deep_agent(model=..., tools=[...], system_prompt=...)` shape from the AI Agent project, with one tool instead of two. What's different, and worth sitting with, is the **system prompt**: it doesn't just describe the tool, it explicitly forbids the failure mode this whole project is designed to demonstrate — suggesting a recipe the tool never returned. A tool being *available* doesn't guarantee the model always uses it; the system prompt is where you tell it that using the tool, and only the tool, is not optional here.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`planner.py` imports `RECIPES` and `search_recipes_by_ingredients` from `recipes.py` without errors.</StepChecklistItem>
<StepChecklistItem>`agent = create_deep_agent(...)` runs without raising — this alone doesn't call the model yet, just builds the agent.</StepChecklistItem>
<StepChecklistItem>The system prompt explicitly says not to suggest a recipe the tool didn't return.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The system prompt tells the model what to do if the tool returns no matches. What do you think happens if you leave that instruction out entirely — where might the model's answer come from instead?
- Why pass `tools=[search_recipes_by_ingredients]` (the function itself) rather than, say, `tools=[RECIPES]` (the raw data)? What would the model actually be able to do with a raw list of dicts as a "tool"?

## Step 4: Ask for meal suggestions

Add a run block at the bottom of `planner.py`:

```python
if __name__ == "__main__":
    on_hand = "I have eggs, tomatoes, garlic, bread, and cheese. What can I make?"
    print("🧑 You:", on_hand)
    result = agent.invoke({"messages": [{"role": "user", "content": on_hand}]})
    print("🤖 Agent:", result["messages"][-1].content)
```

Run it:

```bash
uv run python planner.py
```

You should see the agent's final answer: 2-3 real recipe names pulled straight from `RECIPES`, each with a short reason it fits your ingredients. If you're curious *how* it got there — which tool call happened, with what arguments, and what the tool actually returned before the model wrote its answer — print the full `result["messages"]` list instead of just the last one, same technique covered in the AI Agent project's "Understanding the full internal trace" section: a `HumanMessage` (your question), an `AIMessage` requesting the tool call, a `ToolMessage` with the real string `search_recipes_by_ingredients` returned, then a final `AIMessage` with the answer.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Running `uv run python planner.py` prints a real answer, not a traceback.</StepChecklistItem>
<StepChecklistItem>Every recipe name in the answer actually appears in `RECIPES` — check by eye, or by searching `recipes.py`.</StepChecklistItem>
<StepChecklistItem>You tried at least one ingredient list that matches poorly, and the agent handled it reasonably (said so, or suggested loosely-related options) instead of inventing something.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If you change `on_hand` to ingredients that don't overlap with anything in your database, what does the agent say? Does it follow the system prompt's instruction, or does it slip back into guessing?
- The tool returns its top 5 matches, but the system prompt asks for 2-3 suggestions. Where does that narrowing down happen — in your Python code, or inside the model's reasoning?

## Step 5: Build a shopping list and run it end to end

Because `search_recipes_by_ingredients` already computed the missing ingredients for every candidate recipe, getting a shopping list is just a follow-up question in the same conversation — no new tool needed. Extend the run block to continue the conversation instead of starting a fresh one each time:

```python
if __name__ == "__main__":
    conversation = []

    on_hand = "I have eggs, tomatoes, garlic, bread, and cheese. What can I make?"
    print("🧑 You:", on_hand)
    conversation.append({"role": "user", "content": on_hand})
    result = agent.invoke({"messages": conversation})
    conversation = result["messages"]  # carry the full history forward
    print("🤖 Agent:", conversation[-1].content)

    print()
    follow_up = "Great, let's go with the first one -- what's my shopping list?"
    print("🧑 You:", follow_up)
    conversation.append({"role": "user", "content": follow_up})
    result = agent.invoke({"messages": conversation})
    conversation = result["messages"]
    print("🤖 Agent:", conversation[-1].content)
```

`conversation = result["messages"]` is the important line: each `agent.invoke(...)` call is stateless on its own, so the *only* way the second question knows what "the first one" refers to is if you hand back the entire message history — including the model's own previous answer and any tool calls it made — as part of the next call's input. Drop that line and re-run: the second question will fail to resolve "the first one" to anything, because as far as that call knows, no first message ever happened.

Run it again with `uv run python planner.py` and you should see a full, real exchange: a suggestion, then a shopping list built from the exact "missing" ingredients the tool reported for whichever recipe you picked — not a fresh guess.

:::tip[Try a deliberately sparse ingredient list]
Run it again with only one or two ingredients, something like `"I have onions and salt. What can I make?"` This is the best way to actually see your system prompt's guardrail do something: with almost nothing to match, you'll either get honest "not much of a match, but here's the closest option" suggestions, or (if the overlap is too thin) the tool's "no matches" message passed straight through — either way, watch for whether the agent still resists inventing something that isn't in `RECIPES`.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>The second question in the conversation correctly refers back to "the first one" from the earlier answer.</StepChecklistItem>
<StepChecklistItem>The shopping list it produces matches the "missing" ingredients the tool reported for that recipe — not a different or invented list.</StepChecklistItem>
<StepChecklistItem>You ran the sparse-ingredient test above and the agent didn't invent a recipe not present in `RECIPES`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- What would break about the follow-up question if you started a brand-new `conversation = []` for it instead of reusing the one from the first question?
- The shopping list step doesn't call any new tool — it reuses data the first tool call already returned. What does that suggest about designing a tool's return value with more than just the immediate question in mind?

## ⚠️ Common pitfalls

- **A recipe database that's too small.** With only a handful of recipes, most ingredient lists a student types in won't overlap with anything, and the agent will look broken even when the code is correct. Aim for the full 10-15 recipes covering a real variety.
- **Ingredient names that don't match.** `"tomato"` in your typed list won't match `"tomatoes"` in the database with this simple set-based tool — there's no fuzzy matching here. Keep ingredient names consistent (always plural, always lowercase) across both the database and what you ask the agent for, or extend the tool with basic normalization (e.g. stripping a trailing `"s"`) if you want to go further.
- **The agent inventing a recipe when the tool returns nothing.** This is the exact failure mode the system prompt in Step 3 exists to prevent. If you skip that instruction, or word it too vaguely, a capable model will often "helpfully" suggest something plausible-sounding instead of admitting it has nothing — test the sparse-ingredient case from the tip above specifically to catch this.
- **Losing conversation history between questions.** If a follow-up like "what's the shopping list for the first one" gets a confused or generic answer, check that you're passing the accumulated `conversation` list (Step 5) into `agent.invoke(...)`, not just the newest message on its own.

## What you just built

An agent that answers a genuinely open-ended question — "what can I make?" — by grounding every part of its answer in real, structured local data instead of its own training knowledge, and that refuses to fill gaps with invented details when the data doesn't support one. That grounding pattern (a tool backed by real data, a system prompt that forbids answering outside it) is the same shape behind much more serious systems that need an AI to stay factual: a support bot restricted to real documentation, a coding assistant restricted to a real codebase, a research tool restricted to real retrieved sources. You just built the smallest version of that idea, with recipes.

## Where to go from here

- Grow `recipes.py` well past 13 entries, or load it from a real JSON file or CSV instead of a hardcoded Python list — the tool function barely has to change.
- Add a second tool, e.g. `get_recipe_instructions(name: str) -> str`, so the agent can walk a student through cooking the recipe it just suggested, not just name it.
- Improve the matching in `search_recipes_by_ingredients` — handle simple plurals, ignore common pantry staples like salt and oil when scoring overlap (most kitchens already have them), or let the student say what they explicitly *don't* want.
- Revisit the AI Agent project's section on **sub-agents** — you could split this into a "recipe-finder" sub-agent and a "shopping-list" sub-agent, each with a narrower job.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="recipe-planner-agent" />
