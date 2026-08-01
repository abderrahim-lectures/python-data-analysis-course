---
id: trivia-bot
title: "Build a Discord Trivia Bot"
sidebar_label: "Build a Discord Trivia Bot"
slug: /projects/trivia-bot
description: "Build a discord.py bot that runs trivia rounds in a server, tracks scores on a persistent leaderboard, and can generate fresh questions on any topic with a free-tier LLM."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Discord Trivia Bot

<ProjectPublishedDate projectId="trivia-bot" />

<ProjectGreeting />

A live `discord.py` bot that runs trivia rounds in a server: post a question, collect answers within a time limit, reveal who got it right, and keep a persistent leaderboard across rounds. Most trivia bots stop at a fixed question bank — this one adds a twist that fits a Python course: it can also generate a fresh question on any topic on the spot with a free-tier LLM, instead of only ever asking from a canned list.

This assumes Python 101. No other Real-World Project is required first, though if you've built [Build a RAG App](/docs/projects/rag-notes) already, the free-tier LLM setup below will feel familiar.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Create a Discord bot application and grab its token from Discord's free developer portal.
2. Install `uv`, set up a project, and add `discord.py` alongside a free-tier LLM client.
3. Build a fixed trivia question bank and a basic Discord slash command that posts one.
4. Add a persistent per-player leaderboard, stored across restarts.
5. Add an LLM-generated question mode: give the bot a topic, get back a fresh question.
6. Wire it all into a full round loop — post a question, collect answers within a time limit, reveal the answer, update the leaderboard.
7. Invite the bot to a test server and run real rounds, end to end.

## Where to run this

**Locally with `uv`** is really the only practical option here, more so than for most other projects in this series. A Discord bot isn't a script that runs once and exits — it holds an open connection to Discord and needs to keep running for as long as you want it to respond to `/trivia` and collect answers, which means a real, long-running local (or hosted) process, not a one-off command.

**GitHub Codespaces** works too, and is a reasonable substitute if you'd rather not install anything locally: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run `uv run python bot.py` in a terminal there — it stays running for as long as that terminal (and the Codespace) stays open, the same "long-running process" requirement as running it locally.

**Google Colab and Kaggle Notebooks are a poor fit for the actual bot** — be honest with yourself about that rather than fighting it. Notebooks are built around running a cell, getting output, and moving to the next cell; they aren't meant for a background process that sits and waits for events indefinitely. You *can* start a bot's event loop in a notebook cell, but the moment the notebook's runtime recycles, disconnects, or you close the tab, the bot goes down with it — skip Colab/Kaggle for the live bot and use a real local process or Codespaces instead.

That said, question generation and scoring *underneath* the bot are just regular functions that run a cell at a time, which is exactly what notebooks are good at. The badges below open a notebook that generates real LLM questions on a few sample topics and runs a few fake "players" through the scoring logic, so you can see both work without installing anything locally. It deliberately stops short of the Discord layer — for that, come back here and run `bot.py` locally or in Codespaces as described above.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/trivia-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/trivia-bot/notebook.ipynb)

## Setup

Everything in this section only needs to happen once, before you write a line of the bot itself: installing `uv`, creating the Discord bot application and grabbing its token, getting a free LLM key, and setting up the project. Every step after this one assumes all of it is already done.

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

### Create a Discord bot application and get a token

Discord's [Developer Portal](https://discord.com/developers/applications) is free and needs no card:

1. Sign in and click **New Application**, give it a name (e.g. "trivia-bot"), and create it.
2. Open the **Bot** tab on the left. Discord adds a bot user to your application automatically.
3. Click **Reset Token** (or **View Token** if this is the first time) and copy it. This token is exactly like a password — anyone with it can control your bot — so treat it the same way you'd treat an LLM API key: never paste it into code, never commit it.
4. On the same **Bot** tab, scroll to **Privileged Gateway Intents** and turn on **Message Content**. This is required for the bot to actually read the letter a player replies with — without it, `discord.py` receives an empty string for every message's content no matter what code you write.
5. Open **OAuth2 → URL Generator**. Under **Scopes**, check both `bot` and `applications.commands` (slash commands need the second one specifically); under **Bot Permissions**, check at least **Send Messages** and **Read Message History**. Keep the generated URL handy — you'll use it in the last step to actually invite the bot to a server.

:::tip[A bot token is a secret, exactly like an API key]
Never hardcode the bot token, never commit it, and keep it in a local `.env` file (below) instead — a leaked bot token lets anyone impersonate your bot in every server it's in, exactly like a leaked LLM key lets anyone spend your quota.
:::

### Get a free LLM API key

The question-generation mode needs a free-tier LLM key — **pick whichever provider you like**, none require a credit card at the time of writing:

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

The fixed question bank (Step 1) needs no LLM key at all — you only need one once you get to Step 3's topic-based question generation.

### Set up the project

```bash
uv init trivia-bot
cd trivia-bot
uv add discord.py openai python-dotenv
```

`discord.py` is the library that talks to Discord — connecting to its Gateway, registering slash commands, and receiving/sending messages. `openai` talks to GitHub Models' OpenAI-compatible endpoint for the default provider above; swap it for your provider's own package if you picked a different one. `python-dotenv` loads secrets from a local `.env` file.

Create a `.env` file in the project folder (never commit this) with **both** secrets from this section:

```bash
# .env
DISCORD_BOT_TOKEN=your-bot-token-here
GITHUB_TOKEN=your-llm-key-here
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>A Discord application and bot exist in the Developer Portal, and you've copied its token.</StepChecklistItem>
<StepChecklistItem>"Message Content" is turned on under Privileged Gateway Intents.</StepChecklistItem>
<StepChecklistItem>You have a free-tier LLM API key from a provider of your choice.</StepChecklistItem>
<StepChecklistItem>`uv init`/`uv add` completed without errors, and `.env` has both `DISCORD_BOT_TOKEN` and your LLM key set.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why does Discord require you to explicitly enable "Message Content" as a *privileged* intent, rather than giving every bot access to message text by default?
- The bot token and the LLM API key are both secrets, but they authenticate to two completely different services. What would go wrong if you accidentally swapped which environment variable held which value?

## Step 1: A fixed question bank and a basic slash command

Start with the simplest possible question source — a plain Python list of dicts — and just enough Discord wiring to post one:

```python
# questions.py
"""A small fixed bank of trivia questions. Every question, from this bank
or later generated by an LLM, is the same shape:
{"question": str, "options": list[str], "answer_index": int}."""

import random

QUESTION_BANK = [
    {
        "question": "What year was Python first released?",
        "options": ["1989", "1991", "1995", "2000"],
        "answer_index": 1,
    },
    {
        "question": "Which planet is known as the Red Planet?",
        "options": ["Venus", "Jupiter", "Mars", "Saturn"],
        "answer_index": 2,
    },
    # ... a handful more, see examples/trivia-bot/questions.py for the full bank
]


def random_question() -> dict:
    return random.choice(QUESTION_BANK)
```

`discord.py`'s modern interface for this is a **slash command**: instead of watching every message for something that looks like a command, you register `/trivia` with Discord itself, and Discord shows it in the UI with autocomplete. That needs a `Client` plus an `app_commands.CommandTree` attached to it:

```python
# bot.py (Step 1 version — grows through the rest of this project)
import os

import discord
from discord import app_commands
from dotenv import load_dotenv

from questions import random_question

load_dotenv()

intents = discord.Intents.default()
intents.message_content = True  # requires the portal toggle from Setup, too

client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)


@tree.command(name="trivia", description="Start a trivia round")
async def trivia_command(interaction: discord.Interaction) -> None:
    question = random_question()
    lines = [f"**{question['question']}**"]
    for letter, option in zip("ABCD", question["options"]):
        lines.append(f"{letter}) {option}")
    await interaction.response.send_message("\n".join(lines))


@client.event
async def on_ready() -> None:
    await tree.sync()  # registers /trivia with Discord -- can take a minute the first time
    print(f"Logged in as {client.user} -- ready in {len(client.guilds)} server(s).")


if __name__ == "__main__":
    client.run(os.environ["DISCORD_BOT_TOKEN"])
```

`tree.sync()` is what actually publishes `/trivia` to Discord so it shows up when someone types `/` in your server — skip it and the command exists in your code but nowhere Discord's UI can find it.

:::tip[Slash commands need a second OAuth2 scope]
A regular bot invite only needs the `bot` scope. Slash commands specifically need `applications.commands` too — if you generated your invite URL before adding `/trivia`, regenerate it with both scopes checked (see Setup above) or the command will silently never appear in your server.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`questions.py` defines `QUESTION_BANK` and `random_question()`.</StepChecklistItem>
<StepChecklistItem>`bot.py` registers a `/trivia` slash command via `app_commands.CommandTree`.</StepChecklistItem>
<StepChecklistItem>`on_ready` calls `await tree.sync()` before printing its ready message.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `tree.sync()` re-registers every slash command with Discord's servers, which is rate-limited. What would go wrong if you called it inside `trivia_command` instead of once in `on_ready`?
- The question dict's `answer_index` points into `options` by position rather than storing the correct answer's text directly. What's one advantage of storing it this way?

## Step 2: Score tracking, persisted across rounds

A leaderboard only means something if it survives the bot restarting, so scores go to a small JSON file rather than living only in memory:

```python
# scores.py
"""Per-player score persistence in scores.json. Keyed by Discord user id
(not username), so a player's score survives a nickname change."""

import json
from pathlib import Path

SCORES_PATH = Path("scores.json")


def load_scores() -> dict:
    if not SCORES_PATH.exists():
        return {}
    return json.loads(SCORES_PATH.read_text(encoding="utf-8"))


def save_scores(scores: dict) -> None:
    SCORES_PATH.write_text(json.dumps(scores, indent=2), encoding="utf-8")


def award_point(scores: dict, user_id: int, display_name: str) -> dict:
    key = str(user_id)
    entry = scores.get(key, {"name": display_name, "score": 0})
    entry["name"] = display_name
    entry["score"] += 1
    scores[key] = entry
    save_scores(scores)
    return scores


def leaderboard_text(scores: dict, top_n: int = 10) -> str:
    if not scores:
        return "No scores yet -- play a round with `/trivia`!"
    ranked = sorted(scores.values(), key=lambda entry: entry["score"], reverse=True)
    lines = [f"{i}. {entry['name']} — {entry['score']}" for i, entry in enumerate(ranked[:top_n], start=1)]
    return "\n".join(lines)
```

Test it standalone before wiring it into `bot.py` at all — the same "prove the piece works on its own first" pattern as any multi-part project:

```bash
uv run python -c "
from scores import award_point, leaderboard_text
s = {}
s = award_point(s, 111, 'Alice')
s = award_point(s, 222, 'Bob')
s = award_point(s, 111, 'Alice')
print(leaderboard_text(s))
"
```

Then add a second slash command that just reads the file:

```python
@tree.command(name="leaderboard", description="Show the trivia leaderboard")
async def leaderboard_command(interaction: discord.Interaction) -> None:
    scores = load_scores()
    await interaction.response.send_message(f"**Leaderboard:**\n{leaderboard_text(scores)}")
```

Nothing awards a point yet — `trivia_command` from Step 1 doesn't check answers at all — that's what Step 4's round loop adds. This step is deliberately just the storage half, tested and working on its own first.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`scores.py` defines `load_scores()`, `award_point()`, and `leaderboard_text()`.</StepChecklistItem>
<StepChecklistItem>Running `scores.py`'s standalone test prints a leaderboard with Alice ranked above Bob.</StepChecklistItem>
<StepChecklistItem>`/leaderboard` is registered in `bot.py` and replies with the (still-empty) leaderboard.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Scores are keyed by `str(user_id)` rather than by the player's display name. What real scenario would break a name-keyed leaderboard that a user-id-keyed one survives?
- `save_scores()` rewrites the entire file on every single point. For a small single-server bot this is fine — at what point would that stop being fine, and what would you reach for instead?

## Step 3: Generate a fresh question on any topic with an LLM

The fixed bank in Step 1 only ever asks from the same handful of questions. This step adds a second question source: give the bot a topic, and it asks an LLM for a brand-new multiple-choice question about it, on the spot.

```python
# generate.py
"""Generates a fresh trivia question on a topic via a free-tier LLM.
Returns the exact same shape as questions.py's bank entries, so the rest
of the bot doesn't need to know or care where a question came from."""

import json
import os

from openai import OpenAI

llm_client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

PROMPT_TEMPLATE = """Write one multiple-choice trivia question about: {topic}

Respond with ONLY a JSON object, no other text, in exactly this shape:
{{"question": "...", "options": ["...", "...", "...", "..."], "answer_index": 0}}

Requirements:
- Exactly 4 options.
- Exactly one is correct; put its index (0-3) in answer_index.
- The wrong options must be plausible, not obviously silly.
- Keep the question and every option short enough to fit in a Discord message."""


def generate_question(topic: str) -> dict:
    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(topic=topic)}],
        response_format={"type": "json_object"},
    )
    question = json.loads(response.choices[0].message.content)

    options = question.get("options")
    answer_index = question.get("answer_index")
    if not question.get("question") or not isinstance(options, list) or len(options) != 4:
        raise ValueError(f"LLM returned a malformed question: {question!r}")
    if not isinstance(answer_index, int) or not (0 <= answer_index < 4):
        raise ValueError(f"LLM returned an invalid answer_index: {question!r}")
    return question
```

The explicit shape check after parsing matters: `response_format={"type": "json_object"}` guarantees the LLM's output is *valid JSON*, not that it's the *right* JSON — it could still hand back three options instead of four, or omit `answer_index` entirely. Catching that here, with a clear error, beats discovering it later as a confusing Discord message with a missing option D.

Wire a `topic` parameter into `/trivia` so it can draw from either source:

```python
from round import pick_question  # combines random_question() and generate_question()
```

```python
# round.py
"""Non-Discord round logic shared by bot.py and the notebook."""

from generate import generate_question
from questions import random_question


def pick_question(topic: str | None = None) -> dict:
    if topic:
        return generate_question(topic)
    return random_question()
```

```python
@tree.command(name="trivia", description="Start a trivia round, optionally on a topic")
@app_commands.describe(topic="Optional topic for a freshly generated question")
async def trivia_command(interaction: discord.Interaction, topic: str | None = None) -> None:
    question = pick_question(topic)
    ...
```

Try both paths from a terminal before trusting them inside Discord:

```bash
uv run python -c "from round import pick_question; print(pick_question())"
uv run python -c "from round import pick_question; print(pick_question('classic video games'))"
```

:::tip[Validate LLM-generated content before it reaches a live channel]
An LLM asked for a trivia question can still get facts wrong, especially on obscure topics — there's no `try`/`except` that catches "confidently incorrect." The shape validation in `generate_question()` only guards against malformed *structure*; for a public server, skim a handful of generated questions on topics you actually know before trusting the mode on topics you don't.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`generate.py`'s `generate_question(topic)` returns a dict with 4 options and a valid `answer_index`, or raises a clear error.</StepChecklistItem>
<StepChecklistItem>`round.py`'s `pick_question()` returns a bank question when `topic` is empty, and a generated one otherwise.</StepChecklistItem>
<StepChecklistItem>`/trivia` accepts an optional `topic` argument and visibly uses it.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `generate_question()` validates that `answer_index` is an int in `0..3` and that there are exactly 4 options, but it doesn't validate that the *content* is actually correct trivia. Where's the line between what code can reasonably check and what only a human reviewing the output can?
- If a player picks an intentionally offensive or nonsensical topic, what's the worst plausible thing `generate_question()` could return, and what would you add to guard against it?

## Step 4: A full trivia round loop

Everything so far has been pieces tested in isolation: a question source, score storage, generation. This step wires them into what a round actually looks like live — post a question, wait for the first correct answer within a time limit, reveal it, update the leaderboard:

```python
# bot.py (relevant part -- see examples/trivia-bot/bot.py for the full file)
import asyncio

from round import OPTION_LETTERS, check_answer, format_question, pick_question
from scores import award_point, leaderboard_text, load_scores

ROUND_TIME_LIMIT = 30  # seconds


async def run_round(channel: discord.abc.Messageable, topic: str | None = None) -> None:
    question = pick_question(topic)
    valid_letters = OPTION_LETTERS[: len(question["options"])]
    await channel.send(
        f"{format_question(question)}\n\nYou have {ROUND_TIME_LIMIT}s -- "
        f"reply with just the letter ({'/'.join(valid_letters)})."
    )

    def is_candidate_answer(message: discord.Message) -> bool:
        return (
            message.channel == channel
            and not message.author.bot
            and message.content.strip().upper() in valid_letters
        )

    loop = asyncio.get_event_loop()
    deadline = loop.time() + ROUND_TIME_LIMIT
    winner = None

    while True:
        remaining = deadline - loop.time()
        if remaining <= 0:
            break
        try:
            message = await client.wait_for("message", check=is_candidate_answer, timeout=remaining)
        except asyncio.TimeoutError:
            break
        if check_answer(question, message.content):
            winner = message.author
            break
        await message.add_reaction("❌")

    correct_letter = OPTION_LETTERS[question["answer_index"]]
    correct_text = question["options"][question["answer_index"]]

    if winner is not None:
        scores = award_point(load_scores(), winner.id, str(winner.display_name))
        await channel.send(
            f"✅ {winner.mention} got it! The answer was **{correct_letter}) {correct_text}**.\n\n"
            f"**Leaderboard:**\n{leaderboard_text(scores)}"
        )
    else:
        await channel.send(f"⏰ Time's up! Nobody got it. The answer was **{correct_letter}) {correct_text}**.")
```

`client.wait_for("message", check=..., timeout=...)` is `discord.py`'s way of pausing an `async` function until a specific kind of event happens — here, any message in the same channel whose content is exactly one of the valid answer letters. The `while` loop re-calls it with a shrinking `remaining` timeout so the round's *total* time budget is `ROUND_TIME_LIMIT`, not `ROUND_TIME_LIMIT` per wrong guess — without recalculating `remaining`, a channel full of eager wrong guesses could keep the round open indefinitely.

Only the *first* correct answer scores; `break` as soon as `winner` is set. Wrong guesses get a ❌ reaction instead of an error message — free feedback without spamming the channel with replies.

Finally, `trivia_command` from Step 1 becomes a thin wrapper around `run_round`:

```python
@tree.command(name="trivia", description="Start a trivia round, optionally on a topic")
@app_commands.describe(topic="Optional topic for a freshly generated question")
async def trivia_command(interaction: discord.Interaction, topic: str | None = None) -> None:
    starting_text = f"🎲 Starting a round about **{topic}**..." if topic else "🎲 Starting a round..."
    await interaction.response.send_message(starting_text)
    try:
        await run_round(interaction.channel, topic)
    except Exception as error:  # keep the bot alive even if one round fails
        print(f"Error running trivia round: {error!r}")
        await interaction.channel.send("Something went wrong running that round -- see the bot's console log.")
```

:::tip[Test round timing with a short ROUND_TIME_LIMIT first]
Set `ROUND_TIME_LIMIT = 5` while you're getting the loop right, so you're not waiting 30 seconds per test cycle to find out `check_answer` has a bug. Bump it back up to something reasonable for real play once the loop itself works.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`/trivia` posts a question, then genuinely waits for an answer instead of resolving instantly.</StepChecklistItem>
<StepChecklistItem>The first correct answer within the time limit is announced as the winner and gets a point via `award_point()`.</StepChecklistItem>
<StepChecklistItem>Letting the timer run out with no correct answer reveals the answer without crashing or hanging.</StepChecklistItem>
<StepChecklistItem>Running `/trivia` twice in a row starts a fresh round each time, using the updated leaderboard.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `is_candidate_answer` checks `message.channel == channel` so answers from other channels in the server don't count. What would happen to a round in a busy server if that check were missing?
- The `try`/`except Exception` around `run_round(...)` catches *any* exception and posts a generic error instead of crashing. What's the tradeoff of catching that broadly in a long-running bot versus letting a real bug crash the process loudly?

## Invite the bot and play a real round

Using the OAuth2 URL you generated back in Setup (with both `bot` and `applications.commands` scopes), open it in a browser and pick a server you control — create a free test server if you don't already have one.

```bash
uv run python bot.py
```

You should see `Logged in as trivia-bot#1234 -- ready in 1 server(s).` printed. In the test server, type `/trivia` and pick it from Discord's autocomplete menu — with or without a `topic`. Within a few seconds you should see the question posted, and after answering correctly (or letting the timer run out) the answer revealed and the leaderboard updated. Run `/leaderboard` any time to check scores without starting a new round.

## ⚠️ Common pitfalls

- **Forgetting the "Message Content" privileged intent.** This has to be enabled in *two* places — `intents.message_content = True` in code, **and** the toggle under Bot → Privileged Gateway Intents in the Developer Portal. Miss the portal toggle and `message.content` is silently an empty string for every message, so `is_candidate_answer` never matches any reply no matter how it's typed.
- **Confusing the bot token with the OAuth2 client secret.** The Developer Portal shows both on different tabs. The bot token (Bot tab) is what `client.run(...)` needs; the client secret (OAuth2 tab) is for a completely different auth flow this project never uses. Pasting the client secret into `DISCORD_BOT_TOKEN` fails to log in with a confusing error.
- **`/trivia` never showing up in Discord's UI.** Usually one of two causes: `tree.sync()` was never called (or wasn't awaited) in `on_ready`, or the bot's invite URL was generated before adding the `applications.commands` scope. Regenerate the invite URL with both scopes and re-invite the bot if the second one is the issue.
- **Rate limits on the free LLM tier, worse with several rounds in a row.** Each `/trivia <topic>` call is a separate LLM request against your provider's free-tier quota, and a busy server running several rounds back-to-back can hit it faster than you'd expect from testing alone. A 429 error isn't a bug — add a short retry-with-backoff around `generate_question()`, or fall back to the fixed bank when generation fails.
- **A round that never ends because `remaining` isn't recalculated.** If you copy the round loop but call `client.wait_for(..., timeout=ROUND_TIME_LIMIT)` (the fixed constant) instead of the shrinking `remaining` value, every wrong guess effectively restarts the clock — the round can run far longer than `ROUND_TIME_LIMIT` actually promises.

## What you just built

A live Discord trivia bot with two question sources — a fixed bank and free-tier LLM generation on any topic — a full round loop with real timing, and a persistent per-player leaderboard that survives restarts. The question source, scoring, and round logic (`questions.py`, `generate.py`, `scores.py`, `round.py`) are all plain, `discord`-free Python, tested independently before ever touching a live channel; only `bot.py` knows Discord exists at all. That split is worth keeping in mind generally: the same four modules could sit behind a Slack bot, a web form, or a CLI game instead, with zero changes to any of them.

## Where to go from here

- Add a **multi-round game mode** — `/trivia rounds:5` that plays several questions back-to-back and announces an overall winner at the end, instead of one question per command.
- Track **difficulty or category tags** on generated questions (ask the LLM to include one in its JSON response) and let players pick a category with `/trivia topic:... difficulty:hard`.
- Add a **per-server leaderboard** instead of one global `scores.json` — key `scores.json` by `(guild_id, user_id)` instead of just `user_id`, so two different Discord servers running this bot don't share a leaderboard.
- Deploy the bot somewhere that stays up without your own laptop running — a small always-on VM, or a free tier on a platform like Railway or Fly.io — so it keeps hosting trivia nights even when you're not at your machine.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="trivia-bot" />
