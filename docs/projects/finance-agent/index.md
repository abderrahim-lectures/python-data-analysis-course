---
id: 2027-finance-agent
title: "Build a Personal Finance Agent"
sidebar_label: "Build a Personal Finance Agent"
slug: /projects/finance-agent
description: "Categorize a bank CSV export and flag spending anomalies, combining pandas data-wrangling with an LLM tool-calling agent for smart categorization."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Personal Finance Agent

<ProjectPublishedDate projectId="2027-finance-agent" />

<ProjectGreeting />

This project assumes you're comfortable with Python 101, and it leans on ideas from two other Real-World Projects without strictly requiring either: pandas data-cleaning at roughly the level of [Train Your First Machine Learning Model](/docs/projects/ml-classifier) (loading a CSV, handling messy columns), and the tool-calling agent pattern from [Build an AI Agent](/docs/projects/ai-agent) (a language model that decides to call your Python functions instead of just replying with text). Having seen either helps, but the steps below re-explain what they need as they go.

This is optional and ungraded — a good fit once you've finished Python 101. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Load and clean a sample bank CSV export with pandas.
2. Build a fast, rule-based baseline categorizer — and see exactly where keyword rules run out of road.
3. Build an LLM agent tool that categorizes the transactions the rules couldn't confidently label, and explains its reasoning.
4. Flag statistically unusual transactions (an unusually large purchase compared to that category's typical spend) and have the agent summarize what it found in plain English.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — real Python on your own machine, same as every other project in this section. The Setup section below walks through installing it.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab, Kaggle Notebooks, or Binder** also work — this project needs no GPU, just pandas and one LLM API call per ambiguous transaction. A real, runnable notebook version (the same pipeline as the steps below, working on the same synthetic sample CSV) lives at [`examples/finance-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb). Click a badge to launch it directly, no local install at all:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffinance-agent%2Fnotebook.ipynb)

Be honest with yourself about the tradeoff, though: this is a lower-fidelity way to experience the project than a real local `uv` project — no separate files, no real project structure, just cells in a notebook. Treat it as a quick way to experiment, not the primary path.

## Setup

### Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain.

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

### Set up the project

```bash
uv init finance-agent
cd finance-agent
uv add pandas deepagents langchain-openai python-dotenv
```

`pandas` handles loading and cleaning the CSV; `deepagents` is LangChain's framework for building tool-calling agents; `langchain-openai` talks to GitHub Models (its API is OpenAI-compatible — see the tip below if you picked a different provider); `python-dotenv` reads your API key from a local `.env` file.

### Get a free AI API key

**Pick whichever provider you like** — none require a credit card at the time of writing. The full example in the course repo ([`examples/finance-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent)) supports all six out of the box, selected with one setting.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

Create a `.env` file (never commit this) with the key for whichever provider you picked:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

:::tip[A .env file is often more convenient than export]
Instead of `export`-ing a key in every new terminal session, put it in a `.env` file (see the repo example's `.env.example`) and load it automatically with `python-dotenv`, as the steps below do.
:::

## Step 1: Load and clean a sample bank CSV export

:::tip[Never send real, unredacted bank data to a third-party API]
This project works on a **synthetic** sample CSV — fake dates, fake merchant names, fake amounts, bundled at [`examples/finance-agent/transactions.csv`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/transactions.csv). Steps 3 and 4 send transaction descriptions and amounts to a third-party LLM API. Doing that with your *real* bank export means a copy of your actual financial history — merchant names, spending amounts, potentially more if you exported extra columns — now sits on that provider's servers, subject to whatever retention and training policies they currently have, entirely outside your control. If you ever adapt this to your real spending, redact or synthesize first: strip account numbers, generalize merchant names that reveal something sensitive, round or jitter amounts. This is a genuinely important habit, not a course formality — treat any script that calls an external API as something that will see everything you hand it.
:::

Download the sample CSV, or copy it from [`examples/finance-agent/transactions.csv`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/transactions.csv) into your project folder. It looks like a real export: one row per transaction, a date, a raw merchant description exactly as a bank would print it (abbreviated, sometimes cryptic), and a signed amount — negative for money out, positive for deposits.

```python
import pandas as pd

df = pd.read_csv("transactions.csv", parse_dates=["date"])
df["description"] = df["description"].str.strip()
df = df.dropna(subset=["date", "description", "amount"]).sort_values("date").reset_index(drop=True)
df.head()
```

`parse_dates=["date"]` gets you real `Timestamp` objects instead of plain strings, so later steps can group by month or sort chronologically without re-parsing anything. `.str.strip()` cleans up the stray whitespace real bank exports are full of. Dropping rows missing any of the three essential columns is a cheap, honest way to handle a genuinely malformed row without guessing what it meant.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`df["date"].dtype` shows a datetime type, not `object`.</StepChecklistItem>
<StepChecklistItem>`df["amount"]` contains both negative (expenses) and positive (income) values.</StepChecklistItem>
<StepChecklistItem>`df.isna().sum()` shows no missing values in `date`, `description`, or `amount`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

A real bank export might also include a running `balance` column. Nothing in this project uses it — but can you think of a sanity check you could run using `balance` that `date`, `description`, and `amount` alone can't give you?

## Step 2: Build a rule-based baseline categorizer — and see its limits

The cheapest way to categorize a transaction is a keyword lookup: if `"STARBUCKS"` appears in the description, call it `"Dining"`. This is fast, free, and needs no API key at all — a good instinct to reach for before adding any AI to a pipeline.

```python
RULES = {
    "starbucks": "Dining",
    "trader joes": "Groceries",
    "netflix.com": "Subscriptions",
    "shell oil": "Transport",
    "pacific gas electric": "Utilities",
    # ... see examples/finance-agent/rules.py for the full list
}


def categorize_rule_based(description: str) -> str | None:
    text = description.lower()
    for keyword, category in RULES.items():
        if keyword in text:
            return category
    return None


df["category"] = df["description"].apply(categorize_rule_based)
resolved = df["category"].notna().sum()
print(f"Rule-based pass: {resolved}/{len(df)} categorized. {len(df) - resolved} left ambiguous.")
```

Run this against the sample data and a solid majority of rows get categorized instantly. But look at what's left in `df[df["category"].isna()]`: descriptions like `SQ *JOES COFFEE CART`, `TST* CORNER BISTRO`, `PAYPAL *MERCHXYZ123`, `AMZN MKTP US*1H8KX2LP2`, and `VENMO PAYMENT JSMITH`. A human glancing at `SQ *JOES COFFEE CART` recognizes "coffee cart" instantly — but no fixed keyword list can anticipate every payment-processor prefix (`SQ *`, `TST*`, `PAYPAL *`) or peer-to-peer transfer a bank export will ever contain. This is a real, common limitation of rule-based approaches to messy real-world text, not a contrived one — it's exactly the gap the next step exists to close.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You can print the exact rows `categorize_rule_based` left as `None`, and see why each one is genuinely ambiguous (a payment-processor prefix or a P2P transfer, not just a typo in your rules dict).</StepChecklistItem>
<StepChecklistItem>You resisted the urge to just add more keywords for every case — a handful of remaining unresolved rows is expected, not a bug to rules-patch away.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

If you kept adding keywords forever, could you eventually cover every possible bank description a person might ever see? What does your answer imply about when a purely rule-based approach stops being worth maintaining?

## Step 3: Build an LLM agent tool that categorizes ambiguous transactions

This is the same tool-calling shape from [Build an AI Agent](/docs/projects/ai-agent): a Python function with a docstring, handed to `create_deep_agent`, which the model decides to call on its own.

```python
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from deepagents import create_deep_agent

load_dotenv()

CATEGORIES = [
    "Income", "Housing", "Groceries", "Dining", "Transport", "Utilities",
    "Subscriptions", "Entertainment", "Shopping", "Healthcare", "Travel", "Fees", "Other",
]


def categorize_transaction(description: str, amount: float) -> str:
    """Categorize one bank transaction the rule-based pass couldn't confidently label.

    `description` is the raw bank description string; `amount` is signed
    (negative = money out). Must return exactly one of: Income, Housing,
    Groceries, Dining, Transport, Utilities, Subscriptions, Entertainment,
    Shopping, Healthcare, Travel, Fees, Other.
    """
    # A real version of this tool could just let the model itself reason
    # about the description text and return a category directly, with no
    # body here at all -- see the tip below. This version keeps a small,
    # deterministic heuristic so the example stays fully repeatable offline.
    text = description.lower()
    if text.startswith("sq *") or text.startswith("tst*") or "coffee" in text or "bistro" in text:
        return "Dining"
    if text.startswith("venmo") or text.startswith("paypal"):
        return "Other"
    if text.startswith("amzn mktp"):
        return "Shopping"
    return "Other"


model = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[categorize_transaction],
    system_prompt=(
        "You are a personal finance assistant. When asked to categorize a "
        "transaction, call the categorize_transaction tool rather than "
        "guessing -- it exists precisely for the ambiguous cases a simple "
        "keyword list can't handle."
    ),
)

unresolved = df[df["category"].isna()]
for idx, row in unresolved.iterrows():
    result = agent.invoke({
        "messages": [{
            "role": "user",
            "content": f"Categorize this transaction: description={row['description']!r}, amount={row['amount']}",
        }]
    })
    text = str(result["messages"][-1].content)
    match = next((c for c in CATEGORIES if c.lower() in text.lower()), "Other")
    df.at[idx, "category"] = match

df["category"].value_counts()
```

Notice the loop calls `agent.invoke(...)` once per unresolved row, each a separate round trip to the model — the same rate-limit consideration from the AI Agent project applies here: run this against a large CSV and you can hit a free tier's per-minute cap. See that project's "Handling rate limits" section, and `ask()` in [`examples/ai-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent/agent.py), for a retry pattern you can reuse here.

:::tip[Let the model reason, don't just re-hide the rules in the tool]
The `categorize_transaction` body above is deliberately still a small heuristic, not a hardcoded lookup — but you can go further: give the agent's `system_prompt` the full category list and ask it to reason about an unfamiliar description directly (`"SQ *"` is Square's point-of-sale prefix; `"TST*"` is Toast's — a model that's seen enough real-world payment data can often infer "this is probably a small restaurant or cart" from the shape of the string alone, the same way a human would). The repo's fuller example at [`examples/finance-agent/finance_agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent) is written to make this swap easy — see its comments.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Every row that was `None` after Step 2 now has a non-null `category` after this step runs.</StepChecklistItem>
<StepChecklistItem>You've printed at least one agent response and can point to which tool call produced which category.</StepChecklistItem>
<StepChecklistItem>`df["category"].value_counts()` shows categories that make sense for what you know about each merchant.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

The tool's docstring lists all 13 valid categories, and the code that reads the model's answer (`match = next((c for c in CATEGORIES if c.lower() in text.lower()), "Other")`) still falls back to `"Other"` if none of them appear. Why keep that fallback even though the tool is *supposed* to always return one of the 13? What could go wrong without it?

## Step 4: Flag statistical anomalies and summarize them in plain English

"Anomaly" here means: unusually large *for that category*. A $400 hotel charge is unremarkable for Travel but a clear outlier for Dining — so instead of one global dollar threshold, compute a per-category **z-score**: how many standard deviations a transaction sits above its own category's mean spend.

```python
spend = df["amount"].where(df["amount"] < 0)
df["spend_abs"] = spend.abs()

stats = df.groupby("category")["spend_abs"].agg(["mean", "std"]).rename(
    columns={"mean": "category_mean", "std": "category_std"}
)
df = df.join(stats, on="category")

safe_std = df["category_std"].replace(0, pd.NA)  # avoid dividing by 0/undefined std for tiny categories
df["z_score"] = (df["spend_abs"] - df["category_mean"]) / safe_std
df["is_anomaly"] = (df["z_score"] >= 2.0).fillna(False)

flagged = df[df["is_anomaly"]].sort_values("z_score", ascending=False)
flagged[["date", "description", "spend_abs", "category", "category_mean", "z_score"]]
```

A z-score of 2.0 means "more than two standard deviations above this category's average" — a common, if somewhat arbitrary, statistical rule of thumb for "unusual." Run this on the sample data and you should see a couple of transactions stand out clearly: an outsized electronics purchase relative to typical Shopping spend, and one restaurant charge far above typical Dining spend (a big group dinner, maybe — the data can't say why, only that it's unusual).

Now hand the raw flagged list to the same agent and ask it to explain what it found, in plain language:

```python
summary_lines = [
    f"- {row['date'].date()} | {row['description']} | ${row['spend_abs']:.2f} in {row['category']} "
    f"(category average: ${row['category_mean']:.2f}, z-score: {row['z_score']:.1f})"
    for _, row in flagged.iterrows()
]
anomaly_summary = "\n".join(summary_lines) if summary_lines else "No anomalies found."

result = agent.invoke({
    "messages": [{
        "role": "user",
        "content": (
            "Here are transactions flagged as statistically unusual for their category "
            "(z-score = how many standard deviations above that category's average spend):\n\n"
            f"{anomaly_summary}\n\n"
            "Summarize this for someone reviewing their bank statement, in 2-4 plain-English "
            "sentences. No new numbers, no advice beyond what the data supports."
        ),
    }]
})
print(result["messages"][-1].content)
```

The prompt deliberately says "no new numbers, no advice beyond what the data supports" — a real guard against a common failure mode of LLM summaries: inventing a plausible-sounding but unsupported explanation ("this was probably a birthday dinner") instead of sticking to what the statistics actually show.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`flagged` contains the transaction(s) you'd expect to stand out by eye, and excludes ordinary ones.</StepChecklistItem>
<StepChecklistItem>You understand why the z-score is computed *per category*, not globally across all spending.</StepChecklistItem>
<StepChecklistItem>The agent's plain-English summary mentions only categories/amounts that actually appear in `anomaly_summary` — nothing invented.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

A category with only one or two transactions has an undefined or near-zero standard deviation — the code above guards against dividing by that with `.replace(0, pd.NA)`. What would happen to a category's z-scores if that guard weren't there, and why might a category with very few transactions be a poor candidate for this kind of anomaly detection in the first place?

## ⚠️ Common pitfalls

- **Sending real financial data to a third-party API.** Covered above, worth repeating: this project is built around a synthetic CSV specifically so you build the habit of treating any script that calls an external API as something that will see everything you hand it.
- **Re-running the categorization loop needlessly.** Calling `agent.invoke(...)` once per unresolved row burns real API quota every time you rerun your script — cache results (e.g. to a local CSV or dict keyed by description) instead of re-categorizing the same rows on every run while you're iterating on Step 4.
- **A global anomaly threshold instead of a per-category one.** Flagging "any transaction over $200" would miss a $150 outlier in a category that normally spends $20, and would flag ordinary rent or travel charges constantly. Compare each transaction to its own category's typical spend, as Step 4 does.
- **Letting the summary agent invent explanations.** An LLM asked to "explain" an anomaly will happily fabricate a plausible-sounding reason if you let it. Constrain the prompt to the actual numbers, as in Step 4, and treat anything beyond that as the model guessing, not reporting.
- **Trusting `is_anomaly` from a category with 1-2 transactions.** A category almost every value came from a tiny sample doesn't tell you much about what's "normal" for it yet — see the Socratic question above.

## What you just built

A small but genuinely useful pipeline: a rule-based pass that handles the easy 80% of transactions for free, an LLM agent that picks up the ambiguous remainder a fixed keyword list structurally can't cover, and a statistical anomaly check that turns "does anything here look off?" into an actual, defensible answer — then a plain-English summary a non-technical reader could act on. This "cheap deterministic pass first, AI for the genuinely ambiguous remainder" shape generalizes well beyond finance — it's the same instinct behind a lot of real-world data pipelines that use LLMs.

:::tip[Run a fuller version without any local setup]
[`examples/finance-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent) in the course repo has the full pipeline as separate, reusable files (`rules.py`, `anomalies.py`, `finance_agent.py`) plus a synthetic sample CSV, and supports all six providers from the table above, selected with one setting. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and run it from there.
:::

## Where to go from here

- **A confusion-free summary across months.** Group by `date.dt.to_period("M")` and compare each month's category totals — is spending trending up somewhere specific, beyond any single flagged transaction?
- **A smarter anomaly check.** A z-score assumes spending within a category is roughly bell-shaped, which isn't always true (rent is nearly constant; dining varies a lot). Look into more robust measures like the median and interquartile range (IQR) for categories where a few large values skew the mean.
- **A real categorization budget.** Instead of re-categorizing every unresolved row on every run, persist categorized results (a local SQLite file or a CSV cache keyed by description) so re-running the script only calls the agent on genuinely new transactions.
- **Multiple months, multiple accounts.** Real finances span more than one account. Try extending the pipeline to load several CSVs and reconcile categories consistently across them.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="2027-finance-agent" />
