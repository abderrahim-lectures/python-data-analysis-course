"""A Discord trivia bot: /trivia starts a round (optionally on a topic,
LLM-generated on the fly), players answer with a letter within a time
limit, and /leaderboard shows the running per-player scores.

Run with: uv run python bot.py

Wires together the non-Discord logic in round.py (pick/format/check a
question) and scores.py (persist points) with discord.py's slash-command
(app_commands) and event APIs -- neither of those two modules imports
discord at all, which is what makes them testable outside a live bot (see
notebook.ipynb).
"""

import asyncio
import os

import discord
from discord import app_commands
from dotenv import load_dotenv

from round import OPTION_LETTERS, check_answer, format_question, pick_question
from scores import award_point, leaderboard_text, load_scores

load_dotenv()

ROUND_TIME_LIMIT = 30  # seconds players have to answer

# "Message Content" is a privileged intent -- it must be turned on for this
# bot in the Discord Developer Portal (Bot -> Privileged Gateway Intents) in
# addition to being requested here, or on_message-based reads of answer
# letters will only ever see empty content.
intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)


async def run_round(channel: discord.abc.Messageable, topic: str | None = None) -> None:
    """Posts one question, waits (up to ROUND_TIME_LIMIT seconds total) for
    the first player to answer correctly, then reveals the answer and
    updates the leaderboard. Only the first correct answer scores -- later
    correct answers in the same round don't."""
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
    winner: discord.abc.User | None = None

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


@tree.command(name="trivia", description="Start a trivia round, optionally on a topic")
@app_commands.describe(topic="Optional topic for a freshly generated question (leave empty for a random one)")
async def trivia_command(interaction: discord.Interaction, topic: str | None = None) -> None:
    starting_text = f"🎲 Starting a round about **{topic}**..." if topic else "🎲 Starting a round..."
    await interaction.response.send_message(starting_text)
    try:
        await run_round(interaction.channel, topic)
    except Exception as error:  # keep the bot alive even if one round fails
        print(f"Error running trivia round: {error!r}")
        await interaction.channel.send("Something went wrong running that round -- see the bot's console log.")


@tree.command(name="leaderboard", description="Show the trivia leaderboard")
async def leaderboard_command(interaction: discord.Interaction) -> None:
    scores = load_scores()
    await interaction.response.send_message(f"**Leaderboard:**\n{leaderboard_text(scores)}")


@client.event
async def on_ready() -> None:
    await tree.sync()
    print(f"Logged in as {client.user} -- ready in {len(client.guilds)} server(s).")


if __name__ == "__main__":
    client.run(os.environ["DISCORD_BOT_TOKEN"])
