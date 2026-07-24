"""A Discord bot that answers questions about a docs/ folder using RAG.

Run with: uv run python bot.py

Reuses the exact retrieve() pipeline from retrieve.py (itself the same
approach as the course's rag-notes example) and wraps it in a discord.py
message handler: the bot answers when it's @-mentioned in a message, using
only the docs/ folder's content, the same "answer using ONLY the context
below" prompt from the RAG App project.

Uses GitHub Models by default (see .env.example) -- swap the OpenAI(...)
block below for your own provider's client if you picked a different one
from the table in the lesson.
"""

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

# "Message Content" is a privileged intent -- it must be turned on for this
# bot in the Discord Developer Portal (Bot -> Privileged Gateway Intents) in
# addition to being requested here, or on_message will only ever see empty
# content.
intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)
llm_client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(f"[{c['source']}] {c['text']}" for c in chunks)
    return PROMPT_TEMPLATE.format(context=context, question=question)


def answer(question: str, top_k: int = 3) -> str:
    """Retrieves relevant docs chunks and asks the LLM to answer using only
    that context -- the same two-stage RAG pipeline as the rag-notes
    example's ask(), just returning a string instead of printing it."""
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
    # Never answer the bot's own messages -- without this check, a bot that
    # replies to a mention could end up replying to itself in a loop.
    if message.author == client.user:
        return

    # Only respond when actually mentioned, so the bot doesn't try to answer
    # every single message it can see in a server.
    if client.user not in message.mentions:
        return

    question = message.content.replace(f"<@{client.user.id}>", "").strip()
    if not question:
        await message.reply("Mention me with a question, e.g. `@docs-qa-bot how do I install uv?`")
        return

    async with message.channel.typing():
        try:
            reply = answer(question)
        except Exception as error:  # keep the bot alive even if one answer fails
            print(f"Error answering question: {error!r}")
            reply = "Something went wrong answering that -- see the bot's console log for details."

    if len(reply) > MAX_DISCORD_MESSAGE_LENGTH:
        reply = reply[: MAX_DISCORD_MESSAGE_LENGTH - 1] + "…"
    await message.reply(reply)


if __name__ == "__main__":
    client.run(os.environ["DISCORD_BOT_TOKEN"])
