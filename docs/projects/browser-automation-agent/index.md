---
id: 2027-browser-automation-agent
title: "Build a Browser-Automation Agent"
sidebar_label: "Browser-Automation Agent"
slug: /projects/browser-automation-agent
description: "Combine Playwright browser automation with a free-tier LLM tool-calling agent that fills out a real practice web form on its own."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Browser-Automation Agent

<ProjectPublishedDate projectId="2027-browser-automation-agent" />

<ProjectGreeting />

Every other project in this section either talks to an API or reads local files. This one drives an
actual browser — clicking, typing, and reading a real page — and then hands that control to an LLM
agent, so it can decide *which* field to fill with *what*, instead of you hardcoding every selector by
hand. Assumed background: Python 101, plus having already built the [AI Agent project](/docs/projects/ai-agent)
— this one reuses its tool-calling pattern (`deepagents`, a free-tier API key) and adds real browser
control on top, so it isn't the place to start with agents from scratch.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. **Install** Python [Playwright](https://playwright.dev/python/) and a real Chromium browser binary.
2. **Author** a hardcoded script that fills out a real practice form by hand — and **analyze** exactly how brittle that approach is.
3. **Design** page-reading and field-filling as **tools** an LLM agent can call.
4. **Direct** the agent with a plain-English goal ("fill this form with these details"), let it decide which fields map to which tool calls, then run it end-to-end and **verify** the real submission.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the only fully faithful way to do
this project: Playwright needs a real, installed browser binary to drive, which means an actual
machine with a real (or virtual) display. The Setup section below walks through installing both `uv`
and that browser binary.

**GitHub Codespaces** works well here too, and is a genuine zero-setup alternative if you'd rather not
install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)
(Node, Python, and `uv` are already installed) and run `uv run playwright install chromium` from a
terminal in your browser tab — browser installation works exactly the same there as on your own
machine, headless mode doesn't need a real display either way.

**Google Colab, Kaggle Notebooks, or Binder are a poor fit for this particular project**, and this page
deliberately skips a notebook version rather than force one — a real Playwright browser needs a real
browser binary plus a persistent process it controls step by step, which doesn't map cleanly onto a
notebook's stateless-cell, no-local-browser-window model the way, say, the [scrape-and-analyze project](/docs/projects/scrape-analyze)'s
`requests` calls do. If you want to experiment in a notebook anyway, the honest version of that is
**not** real browser control at all: mock a fake "page" as a plain Python dict of field names and
types, hand the agent tools that read/write that dict instead of a real Playwright page, and use it to
demo only the agent's *decision-making* — which field it thinks matches which piece of information —
with no actual browser opened anywhere. That's a legitimate way to explore Step 3's reasoning in
isolation, but it is not this project; treat it as a toy, not a substitute for Setup below.

**opencode** *(optional)* — a free, open-source AI coding agent that runs in your terminal. If you'd rather have an agent write and run this project for you than type the code yourself, install it with `curl -fsSL https://opencode.ai/install | bash` (or `npm install -g opencode-ai`) and point it at this repo with the same API key from Setup below. It's optional — this project's whole point is building it yourself, so treat it as a bonus, not a shortcut.
## Setup

### Install `uv`

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

### Set up the project and install Playwright's browser binary

```bash
uv init browser-automation-agent
cd browser-automation-agent
uv add playwright deepagents langchain-openai python-dotenv
uv run playwright install chromium
```

That last command is the step it's easy to forget, and the one that's specific to Playwright: the
`playwright` package you just installed with `uv add` is only the Python driver — it doesn't bundle an
actual browser. `playwright install chromium` downloads a real, pinned build of Chromium (matching the
exact Playwright version you have) into a local cache the package then drives. Skip it, and every
script below fails immediately with an error telling you a browser executable is missing.

:::tip[This is Python Playwright, not this repo's own Node Playwright]
If you've looked around this course's own repository, you may have noticed `playwright` already
listed as a Node dev dependency in the root `package.json` — that copy is unrelated tooling this site
uses for its own end-to-end tests, written in JavaScript/TypeScript. The `playwright` **pip package**
you just installed with `uv add` is a completely separate Python library with its own install, its own
browser cache, and its own API (`sync_playwright()`, not `require('playwright')`). They happen to share
a name and a underlying browser-automation engine, but neither installation affects the other, and you
don't need Node.js installed at all to do this project.
:::

### Get a free-tier AI API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option; used in earlier drafts of this page. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

Same rule as every other project here: **never** paste a key directly into code or commit it — set it
as an environment variable, or put it in a local `.env` file (never commit that either) and load it
with `python-dotenv`, same as the AI Agent project.

```bash
# .env
GITHUB_TOKEN=your-key-here
```

## Step 1: A hardcoded script, no LLM yet

Before reaching for an agent, write the plain, hand-rolled version — it's worth feeling exactly how
brittle it is before you fix that problem. The target for this whole project is
[httpbin.org/forms/post](https://httpbin.org/forms/post), a small, well-known, stable "pizza order"
form built specifically for testing tools like this — no login, no real customer data, nothing behind
authorization, and a public, ToS-friendly form-testing sandbox students and tutorials have used for
years.

Create `scripted_fill.py`:

```python
from playwright.sync_api import sync_playwright

FORM_URL = "https://httpbin.org/forms/post"

ORDER = {
    "custname": "Ada Lovelace",
    "custtel": "555-0100",
    "custemail": "ada@example.com",
    "size": "medium",
    "topping": ["bacon", "cheese"],
    "delivery": "18:30",
    "comments": "Please ring the bell twice.",
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False, slow_mo=250)
    page = browser.new_page()
    page.goto(FORM_URL)

    page.fill('input[name="custname"]', ORDER["custname"])
    page.fill('input[name="custtel"]', ORDER["custtel"])
    page.fill('input[name="custemail"]', ORDER["custemail"])
    page.check(f'input[name="size"][value="{ORDER["size"]}"]')
    for topping in ORDER["topping"]:
        page.check(f'input[name="topping"][value="{topping}"]')
    page.fill('input[name="delivery"]', ORDER["delivery"])
    page.fill('textarea[name="comments"]', ORDER["comments"])
    page.click('button[type="submit"]')

    page.wait_for_selector("pre")
    print(page.locator("pre").inner_text())
    browser.close()
```

Run it:

```bash
uv run python scripted_fill.py
```

A real, visible Chromium window pops up (`headless=False`), types into each field, and submits —
httpbin echoes the submitted data back as JSON, which you should see printed in your terminal.

Now imagine the form's owner renames `custname` to `customer_name`, or adds a new required field. This
script breaks immediately, with no idea *why* — it never looked at the page, it just replayed a fixed
sequence of selectors. That fragility is the actual problem this project solves.

<StepChecklist>
  <StepChecklistItem>`uv run python scripted_fill.py` opens a visible browser, fills the form, and prints the submitted JSON.</StepChecklistItem>
  <StepChecklistItem>You can point to at least one field name or selector in the script that would silently break if the form changed.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**: If you didn't control the target website and it changed its form tomorrow, how would you even *find out* this script broke, short of running it and reading the error?

## Step 2: Wrap the browser as tools

An LLM agent can't call Playwright's Python API directly — `deepagents` tools are plain functions with
simple, JSON-friendly arguments, the same shape you saw in the AI Agent project. So the fix for Step
1's brittleness is to give the model a small, fixed set of *capabilities* instead of a fixed script,
and let it decide when to use each one.

Create `browser_tools.py` (or add this to the top of `agent.py` — either works):

```python
from playwright.sync_api import sync_playwright

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
    """Open a URL in the browser. Always call this first."""
    _page().goto(url)
    return f"Navigated to {url}"

def read_form_fields() -> str:
    """List every form field on the current page: its name, type, and (for
    radio/checkbox groups) its available option values."""
    fields = _page().eval_on_selector_all(
        "input, textarea, select",
        "els => els.map(el => ({name: el.getAttribute('name'), "
        "type: el.getAttribute('type') || el.tagName.toLowerCase(), "
        "value: el.getAttribute('value')}))",
    )
    return "\n".join(f"- name={f['name']!r} type={f['type']} value={f['value']!r}" for f in fields)

def fill_text_field(name: str, value: str) -> str:
    """Type a value into a text-like field (text, email, tel, time, textarea) by its name."""
    _page().fill(f'[name="{name}"]', value)
    return f"Filled '{name}' with '{value}'"

def select_option(name: str, value: str) -> str:
    """Check a radio button or checkbox by its name and option value."""
    _page().check(f'input[name="{name}"][value="{value}"]')
    return f"Selected '{value}' for '{name}'"

def click_submit() -> str:
    """Click the form's submit button."""
    _page().click('button[type="submit"], input[type="submit"]')
    _page().wait_for_load_state("networkidle")
    return "Submitted."

def read_page_text() -> str:
    """Read back the visible text of the current page -- use this to verify what happened."""
    return _page().inner_text("body")[:2000]
```

Notice what changed from Step 1: nothing here mentions `custname` or `size` or any specific field.
`read_form_fields` discovers whatever fields actually exist on whatever page it's pointed at — the
agent, not this code, is responsible for matching "customer name" to `name="custname"`.

<StepChecklist>
  <StepChecklistItem>You can explain, in one sentence, why these tool functions take plain strings (a URL, a field name, a value) instead of a Playwright `Page` object as an argument.</StepChecklistItem>
  <StepChecklistItem>`read_form_fields()` called manually against a real page returns a real list of the page's actual field names — not a hardcoded guess.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**: `read_form_fields` truncates nothing and returns the *real* page structure to the model. What could go wrong if you instead trusted the model to guess field names without ever calling it?

## Step 3: Give the agent a plain-English goal

Now wire those tools into a `deepagents` agent, the same `create_deep_agent` pattern as the AI Agent
project, and hand it a goal in ordinary language instead of a step-by-step script:

```python
import os
from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[navigate, read_form_fields, fill_text_field, select_option, click_submit, read_page_text],
    system_prompt=(
        "You are a browser-automation agent. Navigate to the given URL, call "
        "read_form_fields to see the real fields on the page, then map the given "
        "details onto the real field names and types you found -- never guess a "
        "field name read_form_fields didn't show you. Fill what you can confidently "
        "match, submit, then read the page back to confirm."
    ),
)

_session = BrowserSession(headless=False)
goal = (
    "Go to https://httpbin.org/forms/post and fill it out with these details: "
    "Customer name: Grace Hopper. Phone: 555-0199. Email: grace@example.com. "
    "Pizza size: large. Toppings: mushroom and cheese. Delivery time: 19:00. "
    "Comments: leave at the front desk. Then submit it."
)
result = agent.invoke({"messages": [{"role": "user", "content": goal}]})
print(result["messages"][-1].content)
_session.close()
```

Run it and watch the browser window: the agent calls `navigate`, then `read_form_fields`, then a
sequence of `fill_text_field`/`select_option` calls it chose itself — in an order it chose itself,
using field names it read off the real page rather than ones you told it about in the goal text.

<StepChecklist>
  <StepChecklistItem>The agent's tool calls (print `result["messages"]` and look for `AIMessage` tool-call entries, same as the AI Agent project's trace) show it calling `read_form_fields` before any `fill_text_field`/`select_option` call.</StepChecklistItem>
  <StepChecklistItem>You changed one detail in the plain-English goal (e.g. a different topping) and re-ran it without touching any tool code, and the submission changed accordingly.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**: The system prompt explicitly says "never guess a field name `read_form_fields` didn't show you." Why does that instruction matter more here than it did for the toy tools in the AI Agent project?

## Step 4: Run it end-to-end and verify the real submission

Run the full script and confirm the whole loop actually worked, not just that it didn't crash:

```bash
uv run python agent.py
```

Check the final printed page text (from `read_page_text`) against what httpbin actually echoes back —
it should be a JSON blob under `"form"` containing every value you asked for, using the real field
names the agent discovered, not the plain-English names from your goal.

<StepChecklist>
  <StepChecklistItem>The final page text shown by the agent contains every value from your goal, correctly matched to the right field.</StepChecklistItem>
  <StepChecklistItem>You ran it a second time with `headless=True` and it completed with no visible window, confirming it doesn't secretly depend on you watching it.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**: If the agent had submitted the form with one field wrong — say, the wrong topping — how would you know, short of reading the confirmation text yourself? What would it take to have the agent check its own work?

:::tip[Only ever automate sites you have permission to]
`httpbin.org/forms/post` is deliberately chosen because it's a public tool built *for* this exact kind
of practice — automating it is expected, not a violation of anything. That is not true of most
websites. Never point browser-automation code at a real production site's login, checkout, or account
pages without the site owner's explicit authorization — most sites' Terms of Service prohibit
automated form submission, scraping, or bulk account actions, and "the form was technically publicly
reachable" is not the same as "I was allowed to automate it." Treat this the same way you'd treat any
other credential or account: get explicit permission before automating real, non-practice targets.
:::

:::tip[Selectors are a contract with a page you don't control]
Every `page.fill(...)` and `page.check(...)` call above depends on the target site's actual HTML not
changing — a renamed `name` attribute, a swapped `<div>` for a real `<button>`, or a redesigned form
breaks a hardcoded script instantly and silently. That's exactly why Step 2's `read_form_fields` tool
exists: an agent that *reads* the page before acting adapts to small changes a hardcoded script can't,
though it's still not immune to a page that changes its whole structure or meaning.
:::

## ⚠️ Common pitfalls

- **Forgetting `uv run playwright install chromium`** — the single most common failure. `uv add
  playwright` only installs the Python driver; the error message ("Executable doesn't exist...") tells
  you exactly this, but it's easy to miss on a first read.
- **Selector brittleness** — a selector like `input[name="custname"]` only works because that's the
  real attribute on *this* page today. Copying selectors from one site to a different one, or reusing
  them after a redesign, is the single most common source of a script that "used to work."
- **Headless vs. headed mode confusion** — `headless=False` (a visible window) is great for
  development and debugging, but slower and requires a real display; `headless=True` (the default) is
  what you want for anything unattended, like CI, but makes debugging a failure harder since you can't
  watch it happen. Toggle deliberately, don't leave it on whichever you started with.
- **Timing and race conditions** — clicking submit before a page has finished loading, or reading page
  text before a redirect completes, produces flaky, hard-to-reproduce failures. Playwright's
  `wait_for_load_state`, `wait_for_selector`, and its built-in auto-waiting on most actions exist
  specifically to avoid hand-rolled `time.sleep()` calls, which paper over timing bugs rather than
  fixing them.

## What you just built

An agent that doesn't just *talk* — it takes real, verifiable actions in a real browser, deciding
which of a small set of capabilities to use and in what order, based on what it actually observes on
the page rather than a script you wrote in advance. That's the same tool-calling loop from the AI
Agent project, but now the "tools" have side effects in the real world instead of just returning text,
which is exactly the shape of most genuinely useful automation agents.

## Where to go from here

- Add a tool that reads back the *specific* value in a field after filling it (not just the whole
  page), so the agent can verify each fill before moving to the next one, instead of only checking at
  the very end.
- Try a form with more field types — a `<select>` dropdown, a multi-page form, a field with real-time
  client-side validation — and see which of Step 2's tools need to grow to handle it.
- Compare this to the [AI Agent project](/docs/projects/ai-agent): that one's tools only ever return
  text; these tools change real browser state. Think through what that difference means for how
  carefully you'd want to test an agent's tool set before trusting it unattended.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="2027-browser-automation-agent" />

