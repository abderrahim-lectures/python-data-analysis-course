"""Real-World Project example: a Recipe-Planner Agent.

See docs/projects/recipe-planner-agent/index.md for the step-by-step
walkthrough this file accompanies.

Given a list of ingredients the student has on hand, this agent suggests
2-3 real meals it can actually make -- grounded in the local RECIPES
database in recipes.py, never invented -- and produces a shopping list of
anything additional needed for the best suggestion.

You're free to use whichever free-tier provider you like. This defaults to
GitHub Models (no separate signup, uses a GitHub account you already have).
See the six-provider table in the lesson's Setup section, and swap the
ChatOpenAI(...) block below for your provider's own client if you picked a
different one -- the rest of the file stays the same.

Never hardcode a real API key here or commit one to the repo.
"""

import os

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from recipes import RECIPES

load_dotenv()  # reads a local .env file, if present; real env vars always win


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


def build_agent():
    model = ChatOpenAI(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    return create_deep_agent(
        model=model,
        tools=[search_recipes_by_ingredients],
        system_prompt=SYSTEM_PROMPT,
    )


def ask(agent, messages: list[dict]) -> dict:
    """Run the conversation so far through the agent and return the raw result.

    `messages` is the full running conversation, not just the latest
    question -- the agent has no memory of its own between calls, so each
    call replays everything said so far (same idea as re-reading the whole
    chat history before replying). Append the result's own messages back
    onto your list before asking a follow-up, as the __main__ block below
    does, or the agent won't know what "the first one" refers to.
    """
    return agent.invoke({"messages": messages})


if __name__ == "__main__":
    agent = build_agent()
    conversation: list[dict] = []

    on_hand = "I have eggs, tomatoes, garlic, bread, and cheese. What can I make?"
    print("🧑 You:", on_hand)
    conversation.append({"role": "user", "content": on_hand})
    result = ask(agent, conversation)
    conversation = result["messages"]  # carry the full history forward
    print("🤖 Agent:", conversation[-1].content)

    print()
    follow_up = "Great, let's go with the first one -- what's my shopping list?"
    print("🧑 You:", follow_up)
    conversation.append({"role": "user", "content": follow_up})
    result = ask(agent, conversation)
    conversation = result["messages"]
    print("🤖 Agent:", conversation[-1].content)
