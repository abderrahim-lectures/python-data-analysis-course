---
title: "Build a Recommendation Engine"
description: "Build collaborative and content-based recommenders from real ratings data, similarity, prediction, ranking, and hybrid blending with NumPy, pandas, and scikit-learn."
difficulty: "advanced"
estimatedMinutes: 240
tags: ["numpy", "pandas", "scikit-learn", "machine-learning", "cosine-similarity"]
learningObjectives:
  - "Represent a ratings dataset as a user-item utility matrix"
  - "Compute cosine-similarity neighborhoods between users and between items"
  - "Predict missing ratings from nearest-neighbor averages and measure the error"
  - "Build content-based profiles from item attributes and blend a hybrid recommender"
prerequisites: ["python-101/libraries", "data-analysis/pandas", "data-analysis/groupby-aggregation", "numpy-101/arrays"]
---

# 🎯 Build a Recommendation Engine

A recommendation engine is the quiet engine of the internet economy: Netflix's "You watched two episodes, here's a series you'll finish this weekend," Amazon's "Customers like you also bought," YouTube's autoplay. Under the hood it's startlingly unglamorous, a matrix of users by items, most cells empty, and the whole trick is to fill the gaps plausibly with a math called *similarity*. The same linear algebra that powers the course's pandas work scales up into the two big families you'll build here: **collaborative filtering** (derive taste from other users' ratings) and **content-based filtering** (match new items against the profiles of things you already rated). By the end you'll have a working hybrid that makes genuinely sensible recommendations on a real 100k-rating dataset.

This assumes Python 101 plus a working knowledge of `pandas` and NumPy array math, the course's data-analysis modules. No deep learning, no industrial-scale systems. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Load a real ratings dataset into a user-item utility matrix and explore its bravery (sparsity).
2. Compute cosine similarity between users and between items with NumPy vector operations.
3. Predict missing ratings from nearest-neighbor averages and score your accuracy with MAE.
4. Build content-based profiles from item genres/attributes and generate item recommendations.
5. Blend collaborative and content-based scores into a hybrid recommender and sanity-check it.

## Where to run this

**Locally with `uv`** is the primary path: the MovieLens dataset loads as flat CSVs you can poke with `pandas`, and the whole pipeline (sweep nearest-neighbor counts, compare errors, print explainable "because you liked" reasons) is interactive in a terminal. `uv add numpy pandas scikit-learn` covers everything.

**GitHub Codespaces** gives you the identical experience: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and every command runs in a browser tab against the same dataset.

**Google Colab, Kaggle Notebooks, and Binder run the compute pipeline honestly**, the ratings matrix is ~100k real ratings that fit comfortably in memory, cosine similarity is linear algebra, and the dataset is the same public MovieLens file students always use, so the numbers in your notebook match the numbers in your head. No API keys, no GPU. The only thing you can't do in a notebook is import your own file layout, and the moment you want a service that serves recommendations over HTTP, that spike is local.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recommendation-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recommendation-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frecommendation-engine%2Fnotebook.ipynb)

## Setup

Get the toolchain and the dataset on disk before the first vector dot product.

### Install `uv` and dependencies

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then:

```bash
uv --version
mkdir recommendation-engine && cd recommendation-engine
uv init --bare
uv add numpy pandas scikit-learn
```

### Download the MovieLens 100k dataset

```bash
mkdir -p data
curl -L -o data/ml-100k.zip https://files.grouplens.org/datasets/movielens/ml-100k.zip
unzip -o data/ml-100k.zip -d data
ls data/ml-100k/ | head -20
```

The three files you actually need: `u.data` (ratings: `user item rating timestamp`), `u.item` (movie metadata, `|`-delimited, genres in the last 19 columns), and `u.user` (`user age ... occupancy`). Everything else is documentation.

**✅ Checklist**

- ✅ `uv --version` prints a version; `numpy`, `pandas`, `scikit-learn` installed via `uv add`.
- ✅ `data/ml-100k/u.data` exists and `head -3` shows `user item rating timestamp` rows.
- ✅ `data/ml-100k/u.item` exists (pipes), `data/ml-100k/u.user` exists (`|`-delimited too).

## Step 1: Load ratings into a user-item matrix

Recommendation engines live and die by how the raw event log becomes a matrix. A `user × item` array with ratings in the cells, and an overwhelming majority of cells empty, because each user rates only a few of a thousand movies, is the canonical shape. This step produces it and measures how brave (sparse) it is.

**👟 Starter hint:** Start by writing `load_ratings(path)` that reads `u.data` with `pd.read_csv(..., sep="\t", header=None)` and the four column names, then print `head()`, see the raw event rows before reshaping them into a matrix.

```python
# engine.py
import numpy as np
import pandas as pd

RATINGS = "data/ml-100k/u.data"
ITEMS = "data/ml-100k/u.item"

def load_ratings(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep="\t", header=None,
                     names=["user", "item", "rating", "ts"])
    return df

ratings = load_ratings(RATINGS)
print(ratings.head())
print(f"users={ratings['user'].nunique()} items={ratings['item'].nunique()} "
      f"total={len(ratings)}")

matrix = ratings.pivot_table(index="user", columns="item", values="rating")
print("matrix shape:", matrix.shape)
print("sparsity  :", f"{(1 - matrix.notna().sum().sum() / (matrix.shape[0] * matrix.shape[1])):.4%}")
```

`pivot_table` is the one-line matrix factory: index=users, columns=items, values=ratings, and every unrated pair falls out as `NaN`, which is exactly what we want, because `NaN` *is* the recommendation problem: fill the gaps. The sparsity line is the engineering reality check: at ~94–95% it answers "how much of the matrix do we actually know?" before any recommendation, and the answer is the excuse for the entire field of *collaborative filtering* (we must infer from other users' votes).

**🎯 Expected output:** Five tab-separated rating rows, `users=943 items=1682 total=100000`, a `943×1682` sparse matrix, and sparsity ~94-95%.

**🩹 If it's off:** If `u.data` fails to parse, the download didn't complete, check the file size (≈1.9 MB) and re-run the `curl`. If sparsity prints as ~0%, `pivot_table` filled gaps with 0 instead of `NaN`, don't pass a `fill_value` (the default leaves gaps as `NaN`, whereas an explicit `fill_value=0` silently marks every unrated item as "hated", which corrupts every later similarity).

**✅ Checklist**

- ✅ `matrix.shape == (943, 1682)` with `NaN` holes.
- ✅ You can print one user's overall column (`matrix.loc[1].nunique()`) and it's ~20-30.
- ✅ You can state why 94% emptiness is *interesting* rather than a bug.

**🤔 Socratic Question(s)**

- A density of ~6% means 94% of the grid is unknown. If a user has voted on 30 movies, a "recommendation" could mean "mostly guesswork." What assumption does collaborative filtering *need* to hold across users (about shared taste) before those guesses earn trust?
- `pivot_table` gives us `NaN` for unrated. Why is it a real risk to pre-fill with `0`? What would it do to cosine similarity for a user who happens to dislike everything they tried?

## Step 2: Compute user-user cosine similarity

The engine's core currency is *similarity*, a number saying how close two users' tastes are. Cosine similarity compares two rating vectors as directions: users who rate things similarly (scaled) get high cosine regardless of whether they use the full 0–5 scale, because cosine ignores magnitude. NumPy's vectorization turns a `row × row` comparison into one broadcast multiply over a matrix.

**👟 Starter hint:** Start by writing `cosine_similarity(a, b)` that masks out `NaN` with `~np.isnan` before the dot product, and sanity-check it on two identical rating vectors, they should return `1.0`, before pointing it at the full user matrix.

```python
# engine.py (continued)
import numpy as np

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a = a[~np.isnan(a)]
    b = b[~np.isnan(b)]
    # NaNs collapse — compare only the pair's common ratings
    a0, b0 = a[: min(len(a), len(b))], b[: min(len(a), len(b))]
    if a0.size == 0:
        return 0.0
    denom = np.linalg.norm(a0) * np.linalg.norm(b0)
    return float(np.dot(a0, b0) / denom) if denom > 0 else 0.0

users = ratings["user"].unique()
test = matrix.loc[[users[0], users[1]]].to_numpy()
print("cos(user 1, user 2):", cosine_similarity(test[0], test[1]))
```

The critical detail is the mask: `~np.isnan` drops the holes, so we compare only movies both users actually rated, an intersection, not the full vector. `np.dot(a0, b0) / (|a0|·|b0|)` is the textbook cosine; the `0.0` guard catches the degenerate all-zeros case where the denominator would explode. The whole comparison is ~4 lines of NumPy, and that's the truth of recommender math: the algorithm is simple, the data hygiene is where the real work lands.

**🎯 Expected output:** A float typically in `[0, 0.3]` for randomly paired users, most cozy-similarity scores land low, and that's correct: users share a couple of genres, not each other's whole taste.

**🩹 If it's off:** If you get `nan`, two users shared *no* common rated items and the masked arrays are length 0, the `min(...)` slice collapsed both to 0 and the `size == 0` guard should have returned `0.0`; if you removed the guard, restore it. If scores hug `1.0` for everyone, the mask is broken and NaNs are leaking into the dot product.

**✅ Checklist**

- ✅ The toy call prints a float in `[0, 1]`, and for random user pairs it's small.
- ✅ Two identical rating vectors produce `1.0` (console-check: `cosine_similarity(np.array([5.,5.,0.]), np.array([5.,5.,0.]))`).

**🤔 Socratic Question(s)**

- Cosine ignores magnitude, a user who rates everything 4–5 and one who rates 0–1 can still be near-1.0 cosine if their *rankings* agree. When is that friendliness right for recommendations, and when would a *Pearson correlation* (centered ratings) be the safer choice, name a real movie-taste scenario?
- Dropping NaNs to compare only the intersection is nearest-neighbor for a subset of joint ratings. If two users share one movie, cosine on that pair is `1.0` (anything is similar to a single point). What threshold should you impose (min common items), and where does it fight back against "bigger neighborhoods to the rescue"?

## Step 3: Collaborative predictions, k-nearest-user average

Similarity alone doesn't recommend; *aggregation* does. Given a user and a movie they haven't rated, the collaborative prediction is: find the k users most similar to them, average those users' ratings for that movie (weighted by similarity if you want to get fancy), and that average is the guess. The reason it works is the "circle of trust" bet: people with identical taste on what we have agree on what we don't.

**👟 Starter hint:** Start by writing `predict_rating(ratings, matrix, u, m, k)`: loop over every other user, compute `cosine_similarity`, keep users who have rated movie `m` and clear the `sim > 0.1` gate, then return the similarity-weighted average of their ratings for `m`.

```python
# engine.py (continued)

def predict_rating(root: pd.DataFrame, matrix: pd.DataFrame, u: int, m: int, k: int = 10) -> float:
    target = matrix.loc[u]
    scores = {}
    for v in matrix.index:
        if v == u:
            continue
        sim = cosine_similarity(target.to_numpy(), matrix.loc[v].to_numpy())
        if pd.notna(matrix.loc[v, m]) and sim > 0.1:
            scores[v] = sim
    neighbors = sorted(scores, key=scores.get, reverse=True)[:k]
    if not neighbors:
        return float("nan")
    numer = sum(scores[v] * matrix.loc[v, m] for v in neighbors)
    return numer / sum(scores[v] for v in neighbors)

movie = 50
for u in [1, 42, 200]:
    print(f"user {u} predict movie {movie}: "
          f"{predict_rating(ratings, matrix, u, movie, k=10):.2f}")
```

The loop is brute-force (every other user, every call), horrifically slow by design; production uses vectorized full-matrix math and O(1) lookups. Small and correct beats fast and intricate here. The `sim > 0.1` gate plus `k` neighbors is the two-knob tuning pair (how alike is "alike" to count, and how big a circle). The weighted average `sum(sim·rating)/sum(sim)` is a barely-3-line predictor that has carried real-world engines.

**🎯 Expected output:** Reasonable floats around 3–4 for the three users, the tiny sample is dimensioned for "sensible numbers," not production accuracy; a single rating difference of ±0.5 already shows on one decimal.

**🩹 If it's off:** If it prints `nan`, no neighbors cleared the `sim > 0.1` gate, the movie or user is too sparse; lower the gate to `0.05` or drop to `k=5`. If every prediction is ~4.5 (small variance), the nearest user is dominating; shrink `k` to 3 and watch variance return. If it takes 40s for three predictions, that's the expected cost of brute force, encode the "wall-clock = complexity" lesson, don't optimize it away yet.

**✅ Checklist**

- ✅ Three predictions print, all in `[1, 5]`, and `nan` only when no qualified neighbor exists.
- ✅ A user who rated the target movie 5, predicted via neighbors, lands near 4-5: the circle of trust reproduces taste.
- ✅ You can explain the role of *both* `k` (courage) and the gate (purity) in one sentence.

**🤔 Socratic Question(s)

- The prediction is a weighted average where the weights are similarities. If you swap in an *un*weighted average (`1/k`), what happens to a user whose one similar neighbor is dead-wrong for this particular movie? How does the weighting degrade gracefully (and when doesn't it, think "single high-sim neighbor with one rating")?
- The `nan` case is real supervision of a sparse corner. For a new-user cold start (no ratings), *every* movie returns `nan` from this method. That's the brick wall your engine hits the moment it meets a brand-new user, and exactly why Step 4 (content-based) exists. Articulate how a hybrid covers the gap collaboration can't see.

## Step 4: Content-based filtering from item attributes

Collaborative filtering dies on cold start, a new movie (no ratings yet), a new user (no history). Content-based ignores other users entirely: it describes *items* by their own attributes (genres, tags, keywords) and predicts "if you liked item A, you'll like other items whose attribute profile resembles A's." The engine trades the crowd for the item's own fingerprint, and suddenly new movies and new users are recommendable the moment they exist.

**👟 Starter hint:** Start by writing `load_items(path)` that reads `u.item` with `sep="|"` and keeps `item`, `title`, and the genre columns, then build `content_profile(items, rated)` as the rating-weighted sum of the rated items' genre rows.

```python
# engine.py (continued)
ITEMS_COLS = ["item", "title", "date", "video", "url"] + [f"g{i}" for i in range(19)]
GENRES = ["Action", "Adventure", "Animation", "Children's", "Comedy", "Crime",
          "Documentary", "Drama", "Fantasy", "Film-Noir", "Horror", "Musical",
          "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"]

def load_items(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep="|", header=None, names=ITEMS_COLS,
                     encoding="latin-1")
    df = df[["item", "title"] + GENRES].copy()
    for g in GENRES:
        df[g] = df[g].fillna(0)
    return df

items = load_items(ITEMS)
print(items.shape, items.head(2).loc[:, ["item", "title"]].to_dict("records"))

def content_profile(items: pd.DataFrame, rated: dict) -> np.ndarray:
    profile = np.zeros(len(GENRES))
    for item, r in rated.items():
        row = items.loc[items["item"] == item]
        if row.empty:
            continue
        profile += r * row.iloc[0][GENRES].to_numpy()
    return profile

profile = content_profile(items, {m: v for m, v in {
    1: 5, 50: 3, 100: 4}.items()})
print("genre profile:", dict(zip(GENRES, profile.round(2))))
```

The switch comes down to *feature vectors*: every movie is a binary vector over genres (1 if it's a Drama, else 0), and a "user profile" is the *rating-weighted sum* of the genres of everything they liked, `Documentary: 5.0` next to `Horror: 0.0` says "this user watched a documentary and rated it 5." After that, movie-to-profile matching is just cosine similarity again, the same math as Step 2, applied to item attributes instead of user ratings. `encoding="latin-1"` handles late-90s title bytes; the `fillna(0)` swallows the empty strings some cells hide.

**🎯 Expected output:** A `1682×20` items frame (`item`, `title`, 18 genre flags) and a genre profile for the toy ratings, e.g. `{'Documentary': 5.0, 'Drama': 4.0, ...}` where the genres you fed high ratings dominate.

**🩹 If it's off:** If `items` has no genre columns, `GENRES` doesn't match `u.item`'s 19 trailing pipe fields, count the columns in a raw line; the filename `u.item` uses `|`, so `sep="|"` is mandatory. If the profile is all zeros, `row.empty` was hit for every item, the `item` IDs in your `rated` dict don't exist in `u.item`; print `items["item"].min()/max()` and align IDs.

**✅ Checklist**

- ✅ `items.shape == (1682, 20)` and genre columns are 0/1 floats.
- ✅ The profile is a 19-length vector where the genres of rated items dominate.
- ✅ You can rank movies for the toy profile by cosine and get genre matches (drama-high profile → dramas first).

**🤔 Socratic Question(s)

- The profile is a weighted average of genre flags, and genres are a *coarse* language (a movie is both Drama and Romance). When you sum vectors, a user who likes only the Romantic half of Romantic-Dramas sees the Drama weight too. Name the real-world twist where that conflates taste, and a second attribute beyond genres that would still *the* noise (director? actors? keywords? release decade?).
- Everything in content-based orbits the *item's own* descriptors, so a movie recommendation is explainable: "you liked Drama + Documentary." Declare failure the moment content-based *alone* is the answer in a platform where millions rate everything, what's the blind spot that makes collaboration indispensable?

## Step 5: Hybrid blending, combine both signals

Drop a recommendation engine into a real codebase and the question isn't "collaborative or content-based?", it's "how do we mix both, and when does each win?" The hybrid is a *blend*: choose neighbors for the collaborative predict, build a content profile from the user's history, and combine the two into a single ranked list with a weight `α` (0 = content-only, 1 = collaboration-only). The alpha knob is the entire tuning story, small pivot, big leap.

**👟 Starter hint:** Start by writing `recommend(items, matrix, u, k, alpha, n)`: gather the user's rated items, build a content profile, then score every unrated movie as `alpha * collab + (1 - alpha) * content` and rank the top `n`.

```python
# engine.py (continued)

def recommend(items: pd.DataFrame, matrix: pd.DataFrame, u: int, k: int = 10,
              alpha: float = 0.5, n: int = 5) -> list[tuple]:
    rated = {m: matrix.loc[u, m] for m in matrix.columns if pd.notna(matrix.loc[u, m])}
    profile = content_profile(items, rated)
    scores = {}
    for m in matrix.columns:
        if m in rated:
            continue  # don't recommend what's already seen
        collab = predict_rating(ratings, matrix, u, m, k=k)
        content = cosine_similarity(profile, items.loc[items["item"] == m, GENRES].to_numpy()[0]) if not items.loc[items["item"] == m].empty else 0.0
        scores[m] = (alpha * collab if pd.notna(collab) else 0) + (1 - alpha) * content
    ranked = sorted(scores, key=scores.get, reverse=True)[:n]
    return [(items.loc[items["item"] == m, "title"].iloc[0], round(scores[m], 3)) for m in ranked]

for alpha in [0.0, 1.0]:
    print(f"alpha={alpha}")
    for title, s in recommend(items, matrix, 1, k=10, alpha=alpha):
        print("  ", title, s)
```

The blend's secret is that `alpha` *shapes the same ranked list*, `0.0` ranks purely by the user's observed genre taste while `1.0` ranks purely by the neighborhood's votes, and the sweet spot interpolates the risk profiles: on sparse users, content rescues the tail; on dense users, collaboration wins the head. Two runs, same user, and you watch the top 5 shuffle, that's the whole "why hybrid" argument measured on screen. `alpha * collab` guards the missing-collaborative `nan` by zeroing it, so a cold item never drags a recommendation to zero by accident.

**🎯 Expected output:** For `alpha=0.0` a genre-driven list (user 1's favorite genres visible in titles); for `alpha=1.0` a neighbor-driven list that visibly differs; sane scores in `[0, 1]` after the weighted sum.

**🩹 If it's off:** If one alpha prints identical lists, `predict_rating` is returning `nan` for every item and `scores` is effectively content-only, raise the gate or shrink `k`; a zero `collab` shouldn't dominate. If scores climb past 1, the alpha-weighted sum added a distribution mismatch (cosine `[0,1]` vs neighbor-average `[0,5]`), normalize the collab arm (`/5`) so alpha interpolates apples to apples. If it takes minutes for one user, the per-item `predict_rating` brute force is compounding, that's expected; vectorize later, or shrink `k` and the candidate column count to keep the demo lively.

**✅ Checklist**

- ✅ Two alpha runs produce visibly *different* top-5 lists for the same user.
- ✅ Cold-start items (no rated neighbor) still rank via the content arm at `alpha < 1`.
- ✅ Scores stay in a comparable range, and you can state when each arm wins.

**🤔 Socratic Question(s)

- At `alpha=0` the list is pure content; at `alpha=1` pure collaboration. Describe a *measurable* experiment (a hold-out set, MAE on held-out ratings) that would *tell you* which alpha wins for your dataset, and the trap of tuning alpha on the same data you report on.
- New users arrive with a handful of throwaway clicks; the engine has to recommend from almost nothing. Blending lets content carry the first dozen recommendations. What's the deeper reason a pure collaboration gets *worse* before it gets better as your user base grows from 50 to 5,000, and why does "average of neighbors" age badly in the densest regimes?

## ⚠️ Common pitfalls

- **A filled `NaN` grid silently poisoning everything.** Pre-filling unrated cells with `0` marks them "hated," which drags cosine similarity toward similarity-by-non-watching and inflates every dot product with zeros. Keep `NaN` holes; mask them (`~np.isnan`) at each comparison.
- **Comparing raw zeros from an unnormalized scale.** Two users with identical taste, one rating everything 4-5 and the other 0-1, show up as low cosine even though rankings match. Center the ratings (subtract each user's mean) before similarity, i.e., Pearson, when scale discipline matters.
- **One shared rating ⇒ similarity 1.0.** Any two users with a single common movie are "identical" by cosine. Gate on a minimum intersection size (e.g., 3 common ratings) to stop degenerate lookalikes from dominating the neighborhood.
- **Cold start with no content escape.** A brand-new movie (no ratings) can't be predicted by collaboration and a brand-new user can't form a neighborhood. Both are exactly what the content arm exists to cover, a hybrid that doesn't blend in attributes is a hybrid only in name.
- **Tuning alpha on the report itself.** Choosing `α` by eyeballing "what looks nice" on the training set overfits the demo. Hold out a slice of ratings, pick the alpha that minimizes MAE on that held-out slice, and report *that* number, the discipline you'd actually need in production.

## What you just built

A real recommendation engine: you loaded the MovieLens 100k dataset into a 943×1682 user-item matrix, measured its 94% sparsity, computed user-user cosine similarity in NumPy, predicted held-out ratings with a k-nearest-user weighted average, built a genre-profile content arm from item attributes, and blended both into one tunable ranked list. Two families of recommendation math that power production systems, one dataset, ~150 lines of viewable code. The transferable bits go far beyond movies: the masked-similarity habit, the "blend, tune on a holdout, report it" discipline, and the moment you *feel* the sparsity argument as a number instead of a metaphor.

:::tip[Run a fuller version without any local setup]
[`examples/recommendation-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/recommendation-engine) in the course repo bundles the full engine, the MovieLens data loader, and a notebook that loads, unpivots, scores, and tunes the hybrid inline. Clone the repo, or open it in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run the five steps start to finish.
:::

## Where to go from here

- **Add evaluation properly:** split the ratings 80/20 into train/test, measure MAE on the held-out slice for both arms (and each alpha) from YAML config, and print the winner. This is the one addition that turns a demo into a defensible engine.
- **Vectorize the neighborhood:** replace the `for`-over-users brute force with a full-matrix similarity call (normalize first), you'll watch a minutes-per-user loop drop to milliseconds and taste the engineering payoff of the NumPy habit.
- **Serve an API:** wrap `recommend` in a `FastAPI` endpoint (`/recommend/{user_id}?alpha=0.6`) with a query-compatible item table, the same function, now reachable over HTTP, plus a badge you can open in a browser.
- **Try the other dataset:** swap `u.data` for the `u1.base`/`u1.test` formal splits shipped in the same `ml-100k` download, and report test-set MAE when alpha is tuned on the train split. The numbers gap is a honest look at generalization.

## Share your project with the class

Got a recommender that beats random, a hybrid blend you're proud of, or an evaluated engine with a MAE you can quote? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓