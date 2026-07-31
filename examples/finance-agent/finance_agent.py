"""Real-World Project example: a personal finance agent.

Loads a synthetic bank CSV export, categorizes each transaction (first with
cheap keyword rules, then with an LLM tool-calling agent for whatever the
rules couldn't confidently label), flags statistical spending anomalies per
category, and asks the agent to summarize what it found in plain English.

See docs/projects/finance-agent/index.md for the full step-by-step walkthrough
this file accompanies.

You're free to use whichever free-tier provider you like -- this isn't
locked to any one of them. Set LLM_PROVIDER in a .env file (copy
.env.example) or a real environment variable to pick one; see PROVIDERS
below for the full list and which API key each one needs. Defaults to
"github" (GitHub Models) since it's free with no separate signup.

Never hardcode a real API key here or commit one to the repo. And never
point this script at a real, unredacted bank export -- see the privacy tip
in the project doc for why the CSV bundled here is entirely synthetic.
"""

import os
from pathlib import Path

import pandas as pd
from deepagents import create_deep_agent
from dotenv import load_dotenv

from anomalies import flag_anomalies, summarize_anomalies
from rules import categorize_rule_based

load_dotenv()  # reads a local .env file, if present; real env vars always win

THIS_DIR = Path(__file__).resolve().parent
CSV_PATH = THIS_DIR / "transactions.csv"


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
        # Pinned, versioned model ID -- deliberately not a "-latest" alias, which
        # Google has deprecated because it can silently hot-swap model versions.
        model="gemini-3.5-flash",
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

CATEGORIES = [
    "Income",
    "Housing",
    "Groceries",
    "Dining",
    "Transport",
    "Utilities",
    "Subscriptions",
    "Entertainment",
    "Shopping",
    "Healthcare",
    "Travel",
    "Fees",
    "Other",
]


def load_and_clean(csv_path: Path = CSV_PATH) -> pd.DataFrame:
    """Load the bank CSV export and get it into a shape the rest of the pipeline can trust.

    Real exports vary bank to bank, but "date, description, signed amount"
    is close to a universal shape -- this mirrors that, with expenses as
    negative numbers and deposits/income as positive, same convention your
    actual bank statement almost certainly uses.
    """
    df = pd.read_csv(csv_path, parse_dates=["date"])
    df["description"] = df["description"].str.strip()
    df = df.dropna(subset=["date", "description", "amount"])
    df = df.sort_values("date").reset_index(drop=True)
    return df


def apply_rule_based_categories(df: pd.DataFrame) -> pd.DataFrame:
    """Add a `category` column using the keyword rules, leaving unmatched rows as None."""
    df = df.copy()
    df["category"] = df["description"].apply(categorize_rule_based)
    return df


def categorize_transaction(description: str, amount: float) -> str:
    """Categorize one bank transaction into exactly one spending category.

    Use this only for transactions the rule-based pass couldn't confidently
    label -- typically payment-processor prefixes (SQ *, TST*, PAYPAL *,
    AMZN MKTP US*...) or peer-to-peer transfers (Venmo) where the merchant
    name isn't a plain, recognizable brand. `description` is the raw bank
    description string; `amount` is signed (negative = money out).

    Must return exactly one of: Income, Housing, Groceries, Dining,
    Transport, Utilities, Subscriptions, Entertainment, Shopping,
    Healthcare, Travel, Fees, Other.
    """
    # This is the tool's docstring the agent reads to decide when to call it
    # -- the actual "categorization" for this toy tool is a thin heuristic
    # over the well-known payment-processor prefixes bundled in the sample
    # data, standing in for what would be the LLM's own judgment call if this
    # function's body were removed and the agent asked to reason about the
    # description text directly (see the project doc's Step 3 for that
    # version). Kept deterministic here so the example is repeatable offline.
    text = description.lower()
    if text.startswith("sq *") or "coffee" in text or "bistro" in text.replace("tst* corner ", "corner "):
        return "Dining"
    if text.startswith("tst*"):
        return "Dining"
    if text.startswith("venmo") or text.startswith("paypal"):
        return "Other"
    if text.startswith("amzn mktp"):
        return "Shopping"
    return "Other"


def build_agent(provider: str | None = None):
    """Build the categorization + anomaly-explaining agent for the chosen provider."""
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")
    model = PROVIDERS[provider]()
    return create_deep_agent(
        model=model,
        tools=[categorize_transaction],
        system_prompt=(
            "You are a personal finance assistant. When asked to categorize a "
            "transaction, call the categorize_transaction tool rather than "
            "guessing -- it exists precisely for the ambiguous cases a simple "
            "keyword list can't handle. When asked to explain spending "
            "anomalies, summarize them for a non-technical reader in a "
            "short, plain-English paragraph: what happened, roughly how "
            "unusual it was compared to normal spending in that category, "
            "and nothing invented beyond the numbers you were given."
        ),
    )


def categorize_with_agent(agent, df: pd.DataFrame) -> pd.DataFrame:
    """Fill in `category` for every row the rule-based pass left as None, using the agent's tool."""
    df = df.copy()
    unresolved = df[df["category"].isna()]
    for idx, row in unresolved.iterrows():
        result = agent.invoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            f"Categorize this transaction: description="
                            f"{row['description']!r}, amount={row['amount']}"
                        ),
                    }
                ]
            }
        )
        # The agent's final text answer should just be the category name,
        # but LLMs are chatty -- fall back to checking which known category
        # name appears in the reply rather than trusting an exact match.
        text = str(result["messages"][-1].content)
        match = next((c for c in CATEGORIES if c.lower() in text.lower()), "Other")
        df.at[idx, "category"] = match
    return df


def explain_anomalies_with_agent(agent, anomaly_summary: str) -> str:
    """Ask the agent to turn the raw flagged-anomaly list into a short plain-English summary."""
    if anomaly_summary == "No anomalies found.":
        return anomaly_summary
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "Here are transactions flagged as statistically unusual "
                        "for their category (z-score = how many standard "
                        "deviations above that category's average spend):\n\n"
                        f"{anomaly_summary}\n\n"
                        "Summarize this for someone reviewing their bank statement, "
                        "in 2-4 plain-English sentences. No new numbers, no advice "
                        "beyond what the data supports."
                    ),
                }
            ]
        }
    )
    return str(result["messages"][-1].content)


def run_pipeline(provider: str | None = None) -> None:
    df = load_and_clean()
    df = apply_rule_based_categories(df)

    unresolved_count = df["category"].isna().sum()
    print(f"Rule-based pass: {len(df) - unresolved_count}/{len(df)} transactions categorized.")
    print(f"{unresolved_count} left ambiguous -- handing those to the agent.\n")

    agent = build_agent(provider)
    df = categorize_with_agent(agent, df)

    print("Spending by category:")
    print(df[df["amount"] < 0].groupby("category")["amount"].sum().sort_values().round(2))
    print()

    flagged = flag_anomalies(df)
    summary = summarize_anomalies(flagged)
    print("Flagged anomalies (raw):")
    print(summary)
    print()

    print("Agent's plain-English summary:")
    print(explain_anomalies_with_agent(agent, summary))


if __name__ == "__main__":
    run_pipeline()
