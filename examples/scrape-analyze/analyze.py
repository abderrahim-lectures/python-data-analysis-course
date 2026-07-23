"""Loads quotes.csv (written by scrape.py) into pandas, cleans it, and produces
a short written summary plus two charts: top_tags.png and quote_length_dist.png.

Run with: uv run python analyze.py
"""

import matplotlib.pyplot as plt
import pandas as pd

INPUT_PATH = "quotes.csv"
BAR_COLOR = "#3b82f6"  # one consistent hue -- this is magnitude, not identity, so one color is correct


def load_and_clean(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)

    # tags was saved as a single "tag1, tag2, tag3" string -- split it into a
    # real list column so it can be exploded into one row per tag below.
    df["tags"] = df["tags"].fillna("").apply(
        lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
    )

    # Whitespace and dtype sanity checks -- cheap to do, easy to skip, and the
    # kind of thing that silently breaks a groupby later if left unchecked.
    df["text"] = df["text"].str.strip()
    df["author"] = df["author"].str.strip()
    assert df["text"].notna().all(), "some quotes have no text -- check the scrape"
    assert df["author"].notna().all(), "some quotes have no author -- check the scrape"

    df["quote_length"] = df["text"].str.len()
    return df


def top_tags(df: pd.DataFrame, n: int = 10) -> pd.Series:
    """One row per (quote, tag) pair, then count how often each tag appears."""
    exploded = df.explode("tags")
    exploded = exploded[exploded["tags"] != ""]
    return exploded["tags"].value_counts().head(n)


def plot_top_tags(tag_counts: pd.Series, path: str) -> None:
    fig, ax = plt.subplots(figsize=(8, 5))
    tag_counts.sort_values().plot(kind="barh", ax=ax, color=BAR_COLOR)
    ax.set_xlabel("Number of quotes")
    ax.set_ylabel("Tag")
    ax.set_title(f"Top {len(tag_counts)} tags on quotes.toscrape.com")
    ax.set_xlim(left=0)  # bar charts must start at 0 -- truncating exaggerates differences
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


def plot_quote_length_distribution(df: pd.DataFrame, path: str) -> None:
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(df["quote_length"], bins=20, color=BAR_COLOR, edgecolor="white")
    ax.set_xlabel("Quote length (characters)")
    ax.set_ylabel("Number of quotes")
    ax.set_title("Distribution of quote lengths")
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


def main() -> None:
    df = load_and_clean(INPUT_PATH)

    print(f"Loaded {len(df)} quotes from {INPUT_PATH}")
    print(f"Unique authors: {df['author'].nunique()}")
    print(f"Average quote length: {df['quote_length'].mean():.0f} characters")

    tag_counts = top_tags(df)
    print("\nTop tags:")
    print(tag_counts.to_string())

    most_quoted = df["author"].value_counts().head(5)
    print("\nMost-quoted authors:")
    print(most_quoted.to_string())

    plot_top_tags(tag_counts, "top_tags.png")
    plot_quote_length_distribution(df, "quote_length_dist.png")
    print("\nSaved top_tags.png and quote_length_dist.png")


if __name__ == "__main__":
    main()
