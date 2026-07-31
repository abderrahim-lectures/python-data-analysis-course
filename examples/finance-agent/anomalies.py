"""Statistical anomaly detection over categorized transactions.

Flags a transaction as anomalous when it's unusually large *for its own
category* -- a $400 restaurant charge is unremarkable for "Travel" but a
clear outlier for "Dining", so comparing every transaction against one
global threshold would miss it (or flag half of "Housing" instead). This
uses a per-category z-score: how many standard deviations a transaction's
amount sits above that category's own mean spend.

See docs/projects/finance-agent/index.md Step 4 for the walkthrough.
"""

import pandas as pd

Z_SCORE_THRESHOLD = 2.0


def flag_anomalies(df: pd.DataFrame, z_threshold: float = Z_SCORE_THRESHOLD) -> pd.DataFrame:
    """Return `df` with two new columns: `z_score` and `is_anomaly`.

    Expects `df` to already have `category` and `amount` columns (amount in
    the "expense is negative" convention used throughout this project).
    Only spending (negative amounts) is scored -- income deposits aren't
    "anomalies" in the sense this project cares about.
    """
    df = df.copy()
    spend = df["amount"].where(df["amount"] < 0, other=pd.NA)
    df["spend_abs"] = spend.abs()

    stats = df.groupby("category")["spend_abs"].agg(["mean", "std"])
    stats = stats.rename(columns={"mean": "category_mean", "std": "category_std"})
    df = df.join(stats, on="category")

    # A category with only one or two transactions has an undefined or
    # near-zero std -- guard against dividing by that (or by NaN for
    # categories that are all income) rather than raising or flagging
    # everything as infinitely anomalous.
    safe_std = df["category_std"].replace(0, pd.NA)
    df["z_score"] = (df["spend_abs"] - df["category_mean"]) / safe_std
    df["is_anomaly"] = (df["z_score"] >= z_threshold).fillna(False)

    return df


def summarize_anomalies(df: pd.DataFrame) -> str:
    """Plain-text summary of flagged rows, for a human (or an LLM prompt) to read."""
    flagged = df[df["is_anomaly"]].sort_values("z_score", ascending=False)
    if flagged.empty:
        return "No anomalies found."
    lines = []
    for _, row in flagged.iterrows():
        lines.append(
            f"- {row['date'].date()} | {row['description']} | "
            f"${row['spend_abs']:.2f} in {row['category']} "
            f"(category average: ${row['category_mean']:.2f}, z-score: {row['z_score']:.1f})"
        )
    return "\n".join(lines)
