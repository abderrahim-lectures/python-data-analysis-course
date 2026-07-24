## Discord bot basics

A Discord bot is a normal application that connects to Discord's Gateway
(a persistent WebSocket connection) using a bot token generated in the
Discord Developer Portal. Once connected, it receives events -- a message
being sent, a reaction being added, a member joining -- and can react to
them by calling Discord's REST API, most commonly to send a message back.

The `discord.py` library wraps this connection in a Python `Client` (or the
higher-level `commands.Bot`) with decorator-based event handlers. The two
most common ones are `on_message`, which fires for every message the bot
can see, and `on_ready`, which fires once when the bot finishes connecting.

Bots need explicit permission to read message content. This is a
"privileged intent" that must be turned on in the Developer Portal under
Bot settings, in addition to being requested in code via `intents.message_content
= True` -- forgetting the portal toggle is one of the most common reasons a
bot silently receives empty message content.
