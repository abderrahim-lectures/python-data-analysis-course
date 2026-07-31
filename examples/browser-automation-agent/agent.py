"""
Steps 2-4: wrap Playwright as tools, then let an LLM agent decide how to use
them to fill out the httpbin.org practice form from a plain-English goal --
instead of the hardcoded field-by-field script in scripted_fill.py.

You're free to use whichever free-tier provider you like -- this isn't
locked to any one of them. Set LLM_PROVIDER in a .env file (copy
.env.example) or a real environment variable to pick one; see PROVIDERS
below. Defaults to "github" (GitHub Models), same as this course's other
agent examples.

Never hardcode a real API key here or commit one to the repo.

Run with:
    uv run playwright install chromium   # once, before the first run
    uv run python agent.py
"""

import os
import time

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from playwright.sync_api import sync_playwright

load_dotenv()  # reads a local .env file, if present; real env vars always win

FORM_URL = "https://httpbin.org/forms/post"

# The details we want the agent to put into the form, in plain, everyday
# language -- not tied to the form's actual field names. Figuring out which
# field is which is the agent's job, not ours.
ORDER_DETAILS = """
- Customer name: Grace Hopper
- Phone number: 555-0199
- Email address: grace@example.com
- Pizza size: large
- Toppings: mushroom and cheese
- Preferred delivery time: 19:00
- Special instructions: leave at the front desk
"""


# --------------------------------------------------------------------------
# A tiny wrapper around one live Playwright page. The agent's tools below are
# plain functions (LangChain/deepagents tools take simple, JSON-friendly
# arguments -- not a raw Playwright Page object), so they close over a single
# module-level BrowserSession instance instead of passing `page` around.
# --------------------------------------------------------------------------
class BrowserSession:
    def __init__(self, headless: bool = True) -> None:
        self._playwright = sync_playwright().start()
        self.browser = self._playwright.chromium.launch(headless=headless)
        self.page = self.browser.new_page()

    def close(self) -> None:
        self.browser.close()
        self._playwright.stop()


_session: BrowserSession | None = None


def _page():
    if _session is None:
        raise RuntimeError("No active browser session -- call navigate() first.")
    return _session.page


def navigate(url: str) -> str:
    """Open a URL in the browser. Always call this first, before any other tool."""
    _page().goto(url)
    return f"Navigated to {url}"


def read_form_fields() -> str:
    """Inspect the current page and list every fillable form field it contains.

    Returns each field's HTML `name` attribute, its input type (text, email,
    tel, time, radio, checkbox, textarea, ...), and for radio/checkbox groups,
    the available `value` options -- exactly the information needed to decide
    which tool call fills which field. Always call this before filling
    anything on a page you haven't inspected yet.
    """
    page = _page()
    fields = page.eval_on_selector_all(
        "input, textarea, select",
        """
        (elements) => elements.map((el) => ({
            tag: el.tagName.toLowerCase(),
            name: el.getAttribute('name'),
            type: el.getAttribute('type') || el.tagName.toLowerCase(),
            value: el.getAttribute('value'),
        }))
        """,
    )
    if not fields:
        return "No form fields found on this page."
    lines = []
    for f in fields:
        if f["type"] in ("radio", "checkbox"):
            lines.append(f"- name={f['name']!r} type={f['type']} option value={f['value']!r}")
        else:
            lines.append(f"- name={f['name']!r} type={f['type']}")
    return "Form fields on this page:\n" + "\n".join(lines)


def fill_text_field(name: str, value: str) -> str:
    """Type a value into a text-like field (text, email, tel, time, textarea) by its `name` attribute."""
    page = _page()
    selector = f'[name="{name}"]'
    page.fill(selector, value)
    return f"Filled field '{name}' with '{value}'"


def select_option(name: str, value: str) -> str:
    """Check a radio button or checkbox by its `name` attribute and option `value` (from read_form_fields)."""
    page = _page()
    selector = f'input[name="{name}"][value="{value}"]'
    page.check(selector)
    return f"Selected option '{value}' for field '{name}'"


def click_submit() -> str:
    """Click the form's submit button."""
    page = _page()
    page.click('button[type="submit"], input[type="submit"]')
    page.wait_for_load_state("networkidle")
    return "Clicked submit."


def read_page_text() -> str:
    """Read back the visible text of the current page -- use this after submitting to verify what actually happened."""
    return _page().inner_text("body")[:2000]


TOOLS = [navigate, read_form_fields, fill_text_field, select_option, click_submit, read_page_text]


# --------------------------------------------------------------------------
# Model providers -- identical pattern to examples/ai-agent/agent.py.
# --------------------------------------------------------------------------
def _build_github_model():
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model="gpt-4o-mini",
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )


def _build_gemini_model():
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",  # pinned, versioned ID -- not a "-latest" alias
        google_api_key=os.environ["GOOGLE_API_KEY"],
    )


def _build_groq_model():
    from langchain_groq import ChatGroq

    return ChatGroq(model="llama-3.3-70b-versatile", api_key=os.environ["GROQ_API_KEY"])


def _build_mistral_model():
    from langchain_mistralai import ChatMistralAI

    return ChatMistralAI(model="mistral-small-latest", api_key=os.environ["MISTRAL_API_KEY"])


def _build_cerebras_model():
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model="llama-3.3-70b",
        api_key=os.environ["CEREBRAS_API_KEY"],
        base_url="https://api.cerebras.ai/v1",
    )


def _build_openrouter_model():
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model="meta-llama/llama-3.3-70b-instruct:free",
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url="https://openrouter.ai/api/v1",
    )


PROVIDERS = {
    "github": _build_github_model,
    "gemini": _build_gemini_model,
    "groq": _build_groq_model,
    "mistral": _build_mistral_model,
    "cerebras": _build_cerebras_model,
    "openrouter": _build_openrouter_model,
}


def build_agent(provider: str | None = None):
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")
    model = PROVIDERS[provider]()
    return create_deep_agent(
        model=model,
        tools=TOOLS,
        system_prompt=(
            "You are a browser-automation agent. You are given a URL and a plain-English "
            "description of details to enter into a web form. Navigate to the page, call "
            "read_form_fields to see what's actually on it, then map the given details onto "
            "the real field names and types you found -- never guess a field name that "
            "read_form_fields didn't show you. Fill every field you can confidently match, "
            "submit the form, then read the resulting page back to confirm what was submitted."
        ),
    )


_RATE_LIMIT_SIGNALS = ("429", "RESOURCE_EXHAUSTED", "rate_limit", "Too Many Requests", "rate limit")


def ask(agent, goal: str, max_retries: int = 1) -> dict | None:
    """Run one goal through the agent, retrying once on a free-tier rate limit."""
    try:
        return agent.invoke({"messages": [HumanMessage(content=goal)]})
    except Exception as error:
        message = str(error)
        if not any(signal in message for signal in _RATE_LIMIT_SIGNALS):
            raise
        if max_retries <= 0:
            print(f"⚠️  Rate limited and out of retries. ({message[:200]})")
            return None
        print("⚠️  Rate limited by the free tier. Waiting 30s before retrying...")
        time.sleep(30)
        return ask(agent, goal, max_retries=max_retries - 1)


def print_conversation(result: dict) -> None:
    for message in result["messages"]:
        if isinstance(message, HumanMessage):
            print(f"🧑 Goal: {message.content}")
        elif isinstance(message, ToolMessage):
            content = str(message.content)
            if len(content) > 300:
                content = content[:300] + "…"
            print(f"🔧 Tool result ({message.name}): {content}")
        elif isinstance(message, AIMessage):
            for call in message.tool_calls:
                print(f"🤖 Agent → calling {call['name']}({call['args']})")
            text = message.content
            if isinstance(text, list):
                text = "".join(block.get("text", "") for block in text if isinstance(block, dict))
            if text:
                print(f"🤖 Agent: {text}")


if __name__ == "__main__":
    # headless=False so you can watch it work; flip to True once you trust it.
    _session = BrowserSession(headless=False)
    try:
        agent = build_agent()
        goal = f"Go to {FORM_URL} and fill out the form with these details:\n{ORDER_DETAILS}\nThen submit it."
        result = ask(agent, goal)
        if result is not None:
            print_conversation(result)
    finally:
        _session.close()
