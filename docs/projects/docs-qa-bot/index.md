---
id: docs-qa-bot
title: "Build a RAG-Backed Docs Q&A Discord Bot"
sidebar_label: "Build a Docs Q&A Discord Bot"
slug: /projects/docs-qa-bot
description: "Graduate from the in-browser playground to real Python: wrap the RAG App project's retrieval pipeline in a live Discord bot that answers questions from a folder of documentation."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a RAG-Backed Docs Q&A Discord Bot

<ProjectPublishedDate projectId="docs-qa-bot" />

<ProjectGreeting />

This project takes the retrieval-augmented generation pipeline from [Build a RAG App](/docs/projects/rag-notes) — local embeddings, NumPy cosine-similarity search, a free-tier LLM for the final answer — and puts a different front end on it: instead of a script you run from a terminal one question at a time, the same pipeline answers questions live, inside a Discord server, whenever someone mentions the bot. Nothing about *how* it retrieves or generates changes; only the interface does.

This assumes Python 101. Having built [Build a RAG App](/docs/projects/rag-notes) first is strongly recommended — this project reuses its embedding/retrieval code directly and moves quickly past the parts it already explained in depth.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Create a Discord bot application and grab its token from Discord's free developer portal.
2. Install `uv`, set up a project, and add `discord.py` alongside the same embedding/retrieval libraries from the RAG App project.
3. Reuse and adapt the RAG App's retrieval pipeline over a folder of documentation instead of personal notes.
4. Wire a `discord.py` message handler so the bot retrieves relevant docs and generates an answer whenever it's mentioned.
5. Invite the bot to a test server and ask it real questions, end to end.

## Where to run this

**Locally with `uv`** is really the only practical option here, more so than for most other projects in this series. A Discord bot isn't a script that runs once and exits — it holds an open connection to Discord and needs to keep running for as long as you want the bot to respond, which means a real, long-running local (or hosted) process, not a one-off command.

**GitHub Codespaces** works too, and is a reasonable substitute if you'd rather not install anything locally: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run `uv run python bot.py` in a terminal there — it stays running for as long as that terminal (and the Codespace) stays open, the same "long-running process" requirement as running it locally.

**Google Colab or Kaggle Notebooks are a poor fit for this one** — be honest with yourself about that rather than fighting it. Notebooks are built around running a cell, getting output, and moving to the next cell; they aren't meant for a background process that sits and waits for events indefinitely. You *can* start a bot's event loop in a notebook cell, but the moment the notebook's runtime recycles, disconnects, or you close the tab, the bot goes down with it — skip Colab/Kaggle for this project and use a real local process or Codespaces instead.

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

1. Sign in and click **New Application**, give it a name (e.g. "docs-qa-bot"), and create it.
2. Open the **Bot** tab on the left. Discord adds a bot user to your application automatically.
3. Click **Reset Token** (or **View Token** if this is the first time) and copy it. This token is exactly like a password — anyone with it can control your bot — so treat it the same way you already treat an LLM API key: never paste it into code, never commit it.
4. On the same **Bot** tab, scroll to **Privileged Gateway Intents** and turn on **Message Content**. This is required for the bot to actually see the text of messages it's mentioned in — without it, `discord.py` receives an empty string for every message's content no matter what code you write.

:::tip[A bot token is a secret, exactly like an API key]
Everything the [RAG App project](/docs/projects/rag-notes) taught about handling LLM API keys applies here too, for a second secret: never hardcode the bot token, never commit it, and keep it in a local `.env` file (below) instead.
:::

### Get a free LLM API key

The generation half of this pipeline needs the same kind of free-tier LLM key as the [RAG App project](/docs/projects/rag-notes) — **pick whichever provider you like**, none require a credit card at the time of writing:

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

If you already have a key from doing the RAG App project, the same one works here — no need to generate a second one.

### Set up the project

```bash
uv init docs-qa-bot
cd docs-qa-bot
uv add discord.py sentence-transformers numpy python-dotenv openai
```

`discord.py` is the library that actually talks to Discord — connecting to its Gateway, receiving message events, and sending replies. `sentence-transformers` and `numpy` are the same retrieval libraries from the RAG App project, doing the same job here: local embeddings and cosine-similarity search, just over documentation instead of notes. `openai` talks to GitHub Models' OpenAI-compatible endpoint for the default provider above; swap it for your provider's own package if you picked a different one, exactly as the RAG App project describes.

Create a `.env` file in the project folder (never commit this) with **both** secrets from this section:

```bash
# .env
DISCORD_BOT_TOKEN=your-bot-token-here
GITHUB_TOKEN=your-llm-key-here
```

`python-dotenv` reads this file into `os.environ` automatically, the same pattern as every other project in this series.

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

## Step 1: Prepare and embed a docs folder

This step is the RAG App project's Steps 2 and 3, unchanged in substance, just pointed at a `docs/` folder of documentation instead of personal notes:

```python
# prepare_docs.py
"""Splits every .md/.txt file in docs/ into a list of text chunks.

Run with: uv run python prepare_docs.py
Same chunking approach as prepare_notes.py in the RAG App project.
"""

from pathlib import Path

DOCS_DIR = Path("docs")
TARGET_CHUNK_SIZE = 500  # characters


def split_into_paragraphs(text: str) -> list[str]:
    paragraphs = [p.strip() for p in text.split("\n\n")]
    return [p for p in paragraphs if p]


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    chunks = []
    current = ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) > target_size:
            chunks.append(current)
            current = paragraph
        else:
            current = f"{current}\n\n{paragraph}" if current else paragraph
    if current:
        chunks.append(current)
    return chunks


def load_chunks() -> list[dict]:
    chunks = []
    for path in sorted(DOCS_DIR.glob("*.md")) + sorted(DOCS_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        paragraphs = split_into_paragraphs(text)
        for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
            chunks.append({"text": chunk_text, "source": path.name})
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {DOCS_DIR}/")
```

Put whatever documentation you want the bot to answer from into a `docs/` folder as `.md`/`.txt` files — a project's README and wiki pages, a team's internal runbook, this course's own lesson files, anything real. Then embed it, reusing the RAG App project's `build_index.py` verbatim (only the import changes, from `prepare_notes` to `prepare_docs`):

```python
# build_index.py
"""Embeds every chunk from prepare_docs.py and saves the vectors + text
locally. Run with: uv run python build_index.py
Re-run any time docs/ changes -- nothing rebuilds this automatically.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare_docs import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .md/.txt files to docs/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python prepare_docs.py
uv run python build_index.py
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>A `docs/` folder exists with at least a couple of real `.md`/`.txt` files in it.</StepChecklistItem>
<StepChecklistItem>`uv run python build_index.py` runs without errors and reports a nonzero chunk count.</StepChecklistItem>
<StepChecklistItem>`index.npy` and `chunks.json` now exist in your project folder.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- This is the exact same chunking and embedding code as the RAG App project, with only a folder name changed. What does that tell you about how reusable a RAG pipeline's retrieval half is across completely different use cases?
- If your documentation folder has a file with very inconsistent formatting (no blank lines, one giant block of text), what would you expect to happen to the quality of chunks it produces?

## Step 2: Retrieve relevant chunks

Retrieval is also unchanged from the RAG App project — embed the question with the same model, then rank every chunk by cosine similarity, which collapses to a plain dot product since every vector was already normalized to length 1 at embedding time:

```python
# retrieve.py
"""Given a question, finds the docs chunks most relevant to it.
Identical retrieval logic to the RAG App project's retrieve.py.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def retrieve(question: str, top_k: int = 3) -> list[dict]:
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("How do I enable the message content intent?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

If this feels too fast, that's deliberate — the [RAG App project](/docs/projects/rag-notes#step-4-retrieve-relevant-chunks) covers exactly why cosine similarity works this way, what normalization buys you, and how the math connects to a matrix-vector multiply, in much more depth than repeating it here would add.

:::tip[Test retrieval before touching Discord at all]
Get `retrieve.py` returning genuinely relevant chunks for a few test questions *before* writing any bot code. If retrieval is wrong, a bot wrapped around it will just confidently deliver wrong answers in a Discord channel — much harder to debug live than a quiet terminal script.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python retrieve.py` prints ranked results with real similarity scores.</StepChecklistItem>
<StepChecklistItem>The top result for an easy test question actually looks relevant when you read it.</StepChecklistItem>
<StepChecklistItem>You've tried at least one question your docs folder clearly doesn't cover, and confirmed the top score is noticeably lower.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- A Discord bot might get asked the same or very similar questions repeatedly by different users in a busy server. `retrieve()` currently re-embeds the question and reloads `index.npy`/`chunks.json` from disk on every call. What would you cache to make repeated questions cheaper, and what's the risk of caching too aggressively?
- If two documentation files say slightly conflicting things (an outdated one and an updated one), what would you expect `retrieve()` to do, and how would you notice the problem from the bot's answers alone?

## Step 3: Wire the bot's message handler

This is the actual new part of this project: a `discord.py` event handler that calls `retrieve()`, builds the same "answer using only this context" prompt as the RAG App project, and replies with the model's answer.

`discord.py`'s core pattern is an event loop: you create a `Client` with a set of `intents` (which categories of events it's allowed to receive), then register `async def` functions decorated with `@client.event` for the events you care about — most commonly `on_ready` (fires once, when the connection is established) and `on_message` (fires for every message the bot can see):

```python
# bot.py
import os

import discord
from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

PROMPT_TEMPLATE = """Answer the question using ONLY the context below. If the
context doesn't contain the answer, say so -- do not make something up.
Keep the answer concise; this will be posted in a Discord message.

Context:
{context}

Question: {question}

Answer:"""

MAX_DISCORD_MESSAGE_LENGTH = 2000  # Discord's hard cap on a single message

intents = discord.Intents.default()
intents.message_content = True  # requires the portal toggle from Setup, too

client = discord.Client(intents=intents)
llm_client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(f"[{c['source']}] {c['text']}" for c in chunks)
    return PROMPT_TEMPLATE.format(context=context, question=question)


def answer(question: str, top_k: int = 3) -> str:
    chunks = retrieve(question, top_k=top_k)
    prompt = build_prompt(question, chunks)
    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


@client.event
async def on_ready():
    print(f"Logged in as {client.user} -- ready in {len(client.guilds)} server(s).")


@client.event
async def on_message(message: discord.Message):
    if message.author == client.user:
        return  # never reply to yourself -- avoids an infinite reply loop

    if client.user not in message.mentions:
        return  # only answer when actually mentioned

    question = message.content.replace(f"<@{client.user.id}>", "").strip()
    if not question:
        await message.reply("Mention me with a question, e.g. `@docs-qa-bot how do I install uv?`")
        return

    async with message.channel.typing():
        try:
            reply = answer(question)
        except Exception as error:
            print(f"Error answering question: {error!r}")
            reply = "Something went wrong answering that -- see the bot's console log for details."

    if len(reply) > MAX_DISCORD_MESSAGE_LENGTH:
        reply = reply[: MAX_DISCORD_MESSAGE_LENGTH - 1] + "…"
    await message.reply(reply)


if __name__ == "__main__":
    client.run(os.environ["DISCORD_BOT_TOKEN"])
```

`answer()` is line-for-line the same idea as the RAG App project's `ask()` — retrieve, build a prompt, call the LLM — just returning a string instead of printing it, so `on_message` can hand that string to `message.reply(...)`. Everything above `on_ready`/`on_message` runs once at startup; everything inside those two functions runs once per event, for as long as `client.run(...)` keeps the connection alive.

The `if message.author == client.user: return` guard matters more than it might look: without it, if the bot's own reply happened to mention itself (it won't here, but it's an easy mistake in general), it would trigger `on_message` again on its own output — an infinite loop of a bot replying to itself.

:::tip[async def and await aren't optional here]
`discord.py` is built entirely on Python's `asyncio` — every event handler must be declared `async def`, and any call that waits on the network (sending a message, fetching data) must be `await`-ed. Forgetting either one is one of the most common first bugs: leaving off `async` on `on_message` raises an error immediately, and forgetting `await` on `message.reply(...)` silently does nothing at all, since it just creates an un-awaited coroutine instead of actually running it.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`bot.py` defines `on_ready` and `on_message`, both as `async def`, both decorated with `@client.event`.</StepChecklistItem>
<StepChecklistItem>`on_message` checks `message.author == client.user` before doing anything else.</StepChecklistItem>
<StepChecklistItem>`answer()` calls the same `retrieve()` from Step 2, unchanged.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why check `client.user not in message.mentions` rather than just checking whether the bot's name appears somewhere in `message.content` as a substring?
- The `try`/`except` around `answer(reply)` catches *any* exception and replies with a generic error message instead of crashing. What's the tradeoff of catching broadly like this in a long-running bot versus letting a real bug crash the process loudly?

## Step 4: Invite the bot and try it end to end

Back in the Discord Developer Portal, open **OAuth2 → URL Generator**. Under **Scopes**, check `bot`; under **Bot Permissions**, check at least **Send Messages** and **Read Message History**. Copy the generated URL, open it in a browser, and pick a server you control (create a free test server if you don't already have one) to add the bot to.

Run it:

```bash
uv run python bot.py
```

You should see `Logged in as docs-qa-bot#1234 -- ready in 1 server(s).` printed — silence after that is normal; the process is just sitting and waiting on Discord's Gateway for events, the same "no output means it's working" idea as an MCP server waiting on stdio. In the test server, mention the bot with a real question about whatever's in your `docs/` folder:

```
@docs-qa-bot how do I enable the message content intent?
```

Within a few seconds you should see a typing indicator, then a reply grounded in your actual documentation — not a guess from the model's general training data.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>The bot appears online in your test server's member list after running `uv run python bot.py`.</StepChecklistItem>
<StepChecklistItem>Mentioning it with a real question produces a typing indicator, then a reply.</StepChecklistItem>
<StepChecklistItem>The reply's content actually reflects your `docs/` folder, and a question your docs don't cover gets an honest "I don't know" instead of a confident guess.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If you stop `bot.py` (`Ctrl+C`) and mention the bot again, what happens on the Discord side? What does that tell you about where the bot's "presence" actually lives?
- You tested retrieval and the LLM call separately in Steps 1–2 before wiring them into Discord in Step 3. If the bot now gives a wrong answer, how would you use `retrieve.py` on its own to figure out whether the bug is in retrieval or in the Discord wiring around it?

## ⚠️ Common pitfalls

- **Forgetting the "Message Content" privileged intent.** This has to be enabled in *two* places — `intents.message_content = True` in code, **and** the toggle under Bot → Privileged Gateway Intents in the Developer Portal. Miss the portal toggle and `message.content` is silently an empty string for every message, with no error telling you why.
- **Rate limits on the free LLM tier, made worse by real bot traffic.** A CLI script like the RAG App project's `ask.py` only calls the LLM when you run it; a live bot can get several questions in quick succession from different people in a busy server, and each one is a separate call against your provider's free-tier quota. A 429 error under load isn't a bug — see the [RAG App project's pitfalls](/docs/projects/rag-notes#️-common-pitfalls) for the same rate-limit pattern and how to add a retry.
- **Not rebuilding the index after changing `docs/`.** Exactly like the RAG App project: `build_index.py` only runs when you run it. Add or edit a doc and the bot keeps answering from the *old* index until you re-run `uv run python build_index.py` and restart the bot.
- **Running the bot with a stale or wrong token after regenerating it.** Clicking "Reset Token" in the Developer Portal invalidates the old token immediately — if `.env` still has the old value, `client.run(...)` fails to log in. Update `.env` every time you reset the token, and never assume the value you copied once is still valid.

## What you just built

A live Discord bot that answers real questions from real documentation, grounded in retrieved text rather than the model's general knowledge — the exact same RAG pipeline as the [RAG App project](/docs/projects/rag-notes), with a `discord.py` event loop standing in for a CLI script as the interface. The retrieval and generation code didn't change in any meaningful way; only how a question gets in and an answer gets out did. That's a useful thing to notice generally: a RAG pipeline's core logic is interface-agnostic, and the same `retrieve()`/`answer()` pair here could just as easily sit behind a Slack bot, a web form, or an API endpoint instead.

## Where to go from here

- Add a **slash command** (`/ask <question>`) using `discord.py`'s `app_commands` alongside, or instead of, mention-based replies — slash commands show up in Discord's UI with autocomplete and don't require typing an `@mention`, at the cost of a small amount of extra registration code.
- Track which `docs/` source each answer actually cited, and have the bot include a "Source: filename.md" line in its reply — a small but real trust-building feature for anyone reading the answer.
- Once your docs folder outgrows what comfortably fits in memory, look at a real vector database like [ChromaDB](https://www.trychroma.com/), exactly as suggested in the [RAG App project's "Where to go from here"](/docs/projects/rag-notes#where-to-go-from-here) — nothing about the Discord layer needs to change to support it.
- Deploy the bot somewhere that stays up without your own laptop running — a small always-on VM, or a free tier on a platform like Railway or Fly.io — so it keeps answering questions even when you're not at your machine.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="docs-qa-bot" />
