# [Your Agent's Name]

_Replace this with your own README before opening your PR — see [`examples/student-agents/README.md`](../README.md) for the full step-by-step._

## Objective

_One or two sentences: what does this agent actually do, and why is it useful?_

## Tools

_List the tools your agent has, one line each — what each one does, and whether it's read-only or can change something._

- `example_tool(arg)` — _what it does_

## Running it

```bash
cp .env.example .env   # then fill in your key -- defaults to GitHub Models
cd examples/student-agents/your-name
uv run python agent.py
```

You're free to use whichever free-tier provider you like (GitHub Models, Gemini, Groq, Mistral, Cerebras, OpenRouter, or another) — see the [Capstone Bonus doc](../../../docs/bonus/2026-ai-agent/index.md#step-2-get-a-free-ai-api-key)'s provider table. If you're not using the default, swap the client in `agent.py` for your provider's own (a couple of lines) and update `.env` accordingly.

## Notes

_Anything else worth knowing — known limitations, what you'd add next, etc. This section is optional._
