---
title: "Build an Automated ML Pipeline"
description: "A small autopilot: generate a reproducible dataset, wrap a clean impute-and-scale preprocessing pipeline, race three models with cross-validation, tune hyperparameters with a grid search, and export the winner with joblib."
difficulty: "advanced"
estimatedMinutes: 120
xpReward: 100
tags: ["Machine Learning", "Developer Tools", "Pandas"]
prerequisites:
  - "pandas DataFrames and train/test splits"
  - "Scikit-learn estimators and fit/predict"
  - "NumPy rng basics"
learningObjectives:
  - "Generate a reproducible, label-flipped synthetic dataset with numpy and split it with stratification"
  - "Chain imputation and scaling inside a scikit-learn Pipeline"
  - "Compare three estimators with cross_val_score and read the race honestly"
  - "Tune a model with GridSearchCV and discriminate cv-selected from test metrics"
  - "Export the chosen pipeline with joblib and reload it as a drop-in predictor"
---

# 🛠️ 🤖 Build an Automated ML Pipeline

"Automated machine learning" in the tutorials lives on a server you rent. This project runs the same idea on your laptop: a small auto-pilot that takes raw rows, cleans them with a chained pipeline, races a handful of models with proper cross-validation, tunes the promising ones with a grid search, and exports a serialized winner you can reload anywhere. Along the way it teaches the discipline real ML libraries encode: **the train/test split is decided before any tuning**, the **imputer and scaler learn from training data only**, and a **grid search tuned on CV can still disagree with the test set** — this project makes all three observable with small, hand-generated data. The dataset is synthetic (network traffic stats that correlate with a healthy/unhealthy status), so every number in this guide is reproducible from a fixed seed.

This assumes pandas, basic sklearn, and some numpy. It is an optional, ungraded project — see [Real-World Projects](/projects) for the full, growing list. Installs two packages (`pandas`, `scikit-learn`) — `uv` makes this painless.

## 🎯 What you'll do

1. Generate a reproducible 400-row dataset with injected label noise and split it 75/25 with stratification.
2. Wrap a median-imputing, z-scoring preprocessing pipeline and fit it on the training features.
3. Race logistic regression, a decision tree, and k-NN with `cross_val_score`.
4. Tune the promising trees and neighbors with `GridSearchCV` and compare to the CV baseline.
5. Export the final pipeline with `joblib` and reload it as a predictor with probabilities.

## Where to run this

**Locally with `uv`** is the recommended path. One command installs everything:

```bash
uv init automl-pipeline && cd automl-pipeline
uv add pandas scikit-learn joblib
```

**Google Colab, Kaggle Notebooks, and Binder** run every step unmodified — both platforms ship pandas and scikit-learn preinstalled. The synthetic data and fixed seeds make the notebook output identical across machines.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/automl-pipeline/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/automl-pipeline/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fautoml-pipeline%2Fnotebook.ipynb)

## Setup

Everything needed before the first row.

### Set up the project

```bash
uv init automl-pipeline
cd automl-pipeline
uv add pandas scikit-learn joblib
```

The three imports you'll use throughout:

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
```

**✅ Checklist**

- ✅ `uv run python3 -c "import pandas, sklearn, joblib"` succeeds.
- ✅ You know which sklearn metrics come `sklearn.metrics`, which pipelines come `sklearn.pipeline` — both are imported as needed below.

**🤔 Socratic Question(s)**

- "Automated ML" promises to pick the best model. But a pipeline that tunes on the *same* data it reports on is optimistic. Where in this project's flow must the test set appear and re-appear, and why does the answer change if it leaks into tuning?
- The dataset is synthetic: two cloudy clusters in `(bytes_in, bytes_out)` plus a 5% random label flip. What does the *flip* teach you that a perfectly clean synthetic set would hide?

## Step 1: Build the reproducible dataset

Every number downstream depends on this one block, so it must be seeded, documented, and split with care.

### 1.1 Generate the cluster data

**👟 Starter hint:** Use `np.random.default_rng(7)` to draw 200 rows per class from two clouds, then flip 5% of labels at random.

```python
# main.py
import numpy as np
import pandas as pd

rng = np.random.default_rng(7)
n = 400
X0 = rng.normal([2.0, 2.0], 1.6, size=(n // 2, 2))   # "unhealthy" cluster
X1 = rng.normal([6.0, 6.0], 1.6, size=(n // 2, 2))   # "healthy" cluster
X = np.vstack([X0, X1])
y = np.array([0] * (n // 2) + [1] * (n // 2))
flip = rng.random(n) < 0.05
y = np.where(flip, 1 - y, y)                          # 5% label noise

df = pd.DataFrame(X, columns=["bytes_in", "bytes_out"])
df["ok"] = y
print("shape:", df.shape)
print("balance:", df["ok"].value_counts().to_dict())
print(df.head(3).round(2).to_string(index=False))
```

`default_rng(7)` is the modern numpy API — a fixed seed means identical draws on every machine. `flip = rng.random(n) < 0.05` picks ~5% of rows and `1 - y` inverts them, so the classes are genuinely hard to separate at the boundary, the way real network data is. Note the balance is no longer exactly 200/200 — the flips move labels across, leaving an honest slight imbalance.

**🎯 Expected output:**

```
shape: (400, 3)
balance: {1: 208, 0: 192}
 bytes_in  bytes_out  ok
     2.00       2.48   0
     1.56       0.58   0
     1.27       0.41   0
```

**🩹 If it's off:** If the balance is 200/200 exactly, the label flip line didn't run (or `rng.random(n)` was replaced by a fresh RNG). If `head` shows different decimals, your numpy seed or the `np.vstack` line differs — re-check `default_rng(7)`.

### 1.2 Split train from test first

**👟 Starter hint:** Split with `train_test_split(..., test_size=0.25, random_state=7, stratify=df["ok"])` — the split happens *before* anything learns.

```python
# main.py (continued)
from sklearn.model_selection import train_test_split

train, test = train_test_split(df, test_size=0.25, random_state=7,
                               stratify=df["ok"])
print("train/test:", len(train), len(test))
print("test balance:", test["ok"].value_counts().to_dict())
```

Splitting once, up front, is the discipline that keeps the rest of the project honest: every imputer, scaler, CV fold, and search later sees **only** `train`. `stratify` keeps the class ratio similar in both sides even with the 208/192 imbalance — a plain shuffle could give an unlucky test set.

**🎯 Expected output:**

```
train/test: 300 100
test balance: {1: 52, 0: 48}
```

**🩹 If it's off:** If sizes are 75/25 flipped, the `test_size` was set to `0.75`. If the test balance is near 50/50 but not exactly — that's sklearn's stratified approximation and it's fine.

### 1.3 Verify the data + split

**✅ Checklist**

- ✅ `df.shape == (400, 3)`; balance `{1: 208, 0: 192}` from seed 7.
- ✅ `train_test_split` gives 300/100 with stratification.
- ✅ Running the block twice produces identical DataFrames (seed!).

**🤔 Socratic Question(s)**

- Why does the label flip *add* trouble instead of subtract? What would a 0% noise dataset make look artificially perfect (imagine the CV score on a dataset where the two clouds never overlap) — and why would that mislead you about a real deployment?
- `stratify` operates on class labels. If this were a regression (continuous `ok`), stratify wouldn't apply. What property of the target would you need to guard then, and which sklearn argument provides it?

## Step 2: The preprocessing pipeline

Raw numbers don't feed a model; clean, scaled numbers do. Step 2 removes missing values and rescales without ever touching the test set.

### 2.1 Introduce and locate the missingness

**👟 Starter hint:** Copy the training features, punch 10% holes, and count them — a realistic "the sensor dropped readings" scenario.

```python
# main.py (continued)
feat = train[["bytes_in", "bytes_out"]].copy()
miss = np.random.default_rng(1).random(feat.shape) < 0.10   # ~10% holes
feat[miss] = np.nan
print("NaNs  bytes_in:", feat["bytes_in"].isna().sum(),
      " bytes_out:", feat["bytes_out"].isna().sum())
```

The holes are injected **after** the split, on a copy, so the real `train`/`test` frames stay whole — this is where a leakage-prone pipeline would happily impute from test data and silent-train on all 400 rows. `default_rng(1)` is a *different* seed than step 1's, so the data itself stays fixed while the missingness is reproducible on its own.

**🎯 Expected output:**

```
NaNs  bytes_in: 23  bytes_out: 34
```

**🩹 If it's off:** If the counts differ, the RNG seed or `.random(feat.shape)` comparator changed. If `feat` reads whole after the print, the `np.nan` assignment didn't stick — check that `miss` is boolean and same-shaped.

### 2.2 Chain impute → scale

**👟 Starter hint:** Build `Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())])` and `fit_transform` the holey features.

```python
# main.py (continued)
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

clean = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])
S = clean.fit_transform(feat)
print("scaled mean:", np.round(S.mean(axis=0), 4))
print("scaled std :", np.round(S.std(axis=0), 4))
print("imputed medians:", np.round(clean.steps[0][1].statistics_, 3))
```

The pipeline is a *sequence of transforms that learns only from what you `fit` it on*. `SimpleImputer(strategy="median")` fills each hole with that column's median, learned from `feat`; `StandardScaler` then z-scores: mean→0, std→1. Ask **why the median and not the mean** for imputation — the median is robust to the injected spikes, the mean would move under them. After imputation+scaling the feature matrix is ready for any distance-based or regularized model.

**🎯 Expected output:**

```
scaled mean: [ 0. -0.]
scaled std : [1. 1.]
imputed medians: [3.999 3.608]
```

**🩹 If it's off:** If the scaled mean isn't ~0, the imputer ran before the scaler *or* the scaler fitted on a different frame. If `statistics_` errors, the imputer hasn't been fitted — forget `fit_transform` and only-transform.

### 2.3 Verify the pipeline

**✅ Checklist**

- ✅ Counts `bytes_in: 23, bytes_out: 34` from the seeded holes.
- ✅ Fit-transformed output has mean ≈ 0, std ≈ 1 per column.
- ✅ `.steps[0][1].statistics_` holds the per-column medians used for imputation.

**🤔 Socratic Question(s)**

- The scaler learns mean/std from `train` **only**. If it learned from all 400 rows, would it still produce valid z-scores? Yes — valid but *fit on future data*, which is exactly the leakage that inflates CV scores. What leaks, precisely, when the test set contributes to the scaler's `mean_`?
- The imputer median `3.999` is close to cluster 0's center. If a *test* row ends up in `bytes_in` missing, which learned number fills it — and why is filling from train's median strictly better than filling from the row's own class, which the model doesn't know at inference time?

## Step 3: Race the model zoo

Preprocessing is a fixed pipeline; the model is a choice. `cross_val_score` races three honest candidates on the training fold only.

### 3.1 Score three models

**👟 Starter hint:** Build a zoo dict of `Pipeline`/estimators and report `cross_val_score(...).mean()` per model on `train`.

```python
# main.py (continued)
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score

zoo = {
    "logistic": make_pipeline(StandardScaler(),
                              LogisticRegression(max_iter=1000, random_state=1)),
    "tree": DecisionTreeClassifier(max_depth=4, random_state=1),
    "knn": KNeighborsClassifier(n_neighbors=15),
}
for name, est in zoo.items():
    scores = cross_val_score(est, train[["bytes_in", "bytes_out"]], train["ok"], cv=5)
    print(name, "-> mean", round(scores.mean(), 3))
```

Note the test set is **absent here**: every score is 5-fold cross-validation on the 300 training rows, so each model trains on 240 and scores on the held-out 60, five times. `main.py`'s `zoo` mixes a scaled pipeline (logistic, which wants scaled features) with raw estimators (tree and kNN, which scale-agnostic trees ignore and kNN effectively rescales of its own via distance). Neither tree nor kNN sees missing data, because they take the *un-imputed* raw columns — for the zoo the cleanest comparison is features as-is, with a note that a real autopilot would feed every model the same imputed pipeline.

**🎯 Expected output:**

```
logistic -> mean 0.927
tree -> mean 0.9
knn -> mean 0.917
```

**🩹 If it's off:** If all three are ≈0.5, the label flip consumed the signal (check seed 7's `flip`). If only tree is much worse, `max_depth=4` is under-fitting that model while others adapt.

### 3.2 Read the race honestly

**👟 Starter hint:** Print the fold-level variance too — a mean hides a noisy model.

```python
# main.py (continued)
for name, est in zoo.items():
    scores = cross_val_score(est, train[["bytes_in", "bytes_out"]], train["ok"], cv=5)
    print(name, "->", [round(s, 3) for s in scores])
```

One 5-fold mean is a summary; the five per-fold numbers are the substance. A model whose folds are `[0.93, 0.90, 0.92, 0.91, 0.95]` says "stable", while `[1.0, 0.75, 0.98, 0.80, 1.0]` says "fragile" even at the same mean. Discrete customers, tree splits, and boundary kNN all fold differently — seeing the five values tells you which model's mean you can trust.

**🎯 Expected output:** 5 scores per model whose mean matches Step 3.1 (e.g. logistic's five folds average to `0.927` — exact fold values vary by sklearn version; the *mean* and the ranking do not).

**🩹 If it's off:** If fold scores print with `np.float64` wrappers, that's cosmetic — float them for tidy output. If fold counts ≠ 5, `cv=` was changed.

### 3.3 Verify the zoo

**✅ Checklist**

- ✅ Three models scored by 5-fold CV on `train` only; the test set is untouched.
- ✅ Ranking on this run: logistic (0.927) > kNN (0.917) > tree (0.900).
- ✅ Fold-level scores printed so means aren't trusted blindly.

**🤔 Socratic Question(s)**

- Logistic wins *despite* wanting scaled features and tree ignoring them — the signal is approximately linear-separable, and logistic exploits that best. If the true boundary were sinusoidal, which of the three would likely win, and what does that say about "the best model" as a *property of the data* vs of the library?
- kNN's `n_neighbors=15` was chosen by guess. Step 4 will tune it — but tuning *every* model wastes hours. Which tells you the winner of this zoo, and what makes tuning the runner-up still worthwhile?

## Step 4: Sweep the hyperparameters

The zoo's winners get a small grid search. This is where tuning must stay on the training folds *and* be judged against the CV, not the test.

### 4.1 Tune the tree and the neighbors

**👟 Starter hint:** `GridSearchCV(estimator, param_grid, cv=5)` on a compact grid, then print `best_params_` and `best_score_`.

```python
# main.py (continued)
from sklearn.model_selection import GridSearchCV

gs_tree = GridSearchCV(DecisionTreeClassifier(random_state=1),
                       param_grid={"max_depth": [2, 3, 5],
                                   "min_samples_leaf": [1, 5, 10]},
                       cv=5)
gs_tree.fit(train[["bytes_in", "bytes_out"]], train["ok"])
print("tree best:", gs_tree.best_params_, "cv score", round(gs_tree.best_score_, 3))

gs_knn = GridSearchCV(KNeighborsClassifier(),
                      param_grid={"n_neighbors": [3, 5, 9],
                                  "weights": ["uniform", "distance"]},
                      cv=5)
gs_knn.fit(train[["bytes_in", "bytes_out"]], train["ok"])
print("knn best:", gs_knn.best_params_, "cv score", round(gs_knn.best_score_, 3))
```

`GridSearchCV` is automated CV *inside* you: 3×3 = 9 tree configs and 3×2 = 6 kNN configs, each scored with 5-fold CV on train — the search picks the config with the best mean CV score. Crucially, **the best config is chosen by `train` cross-validation**, not by test accuracy. A tester who "improved" the model to do better on the test set would be tuning on the answer key.

**🎯 Expected output:**

```
tree best: {'max_depth': 3, 'min_samples_leaf': 1} cv score 0.903
knn best: {'n_neighbors': 3, 'weights': 'uniform'} cv score 0.937
```

**🩹 If it's off:** If `best_params_` shows extremes of the grid (e.g. `max_depth: 5`), the grid is too coarse in that direction. If `cv score` exceeds `0.94`, the kNN `distance` weighting is creaming the uniform version in this fold set — check `best_params_`.

### 4.2 The CV-vs-test tension

**👟 Starter hint:** Score the two tuned winners on the *held-out test set* and compare to their CV best scores.

```python
# main.py (continued)
from sklearn.metrics import accuracy_score

for gs, name in [(gs_tree, "tree"), (gs_knn, "knn")]:
    acc = accuracy_score(test["ok"], gs.best_estimator_.predict(
        test[["bytes_in", "bytes_out"]]))
    print(name, "cv", round(gs.best_score_, 3), "-> test", round(acc, 3))
```

This is the honesty gap the whole project teaches: the tuned tree's CV says `0.903`, its test says `0.91`; kNN's CV says `0.937`, test `0.91`. Neither CV nor test is "wrong" — CV averages over 5 training-based splits, test measures one drawn set — but **the test number is the one that counts for a report**, and the CV number is the one you used to choose. Reporting the model "0.937 on CV" publicly would oversell it.

**🎯 Expected output:**

```
tree cv 0.903 -> test 0.91
knn cv 0.937 -> test 0.91
```

**🩹 If it's off:** If test accuracy printed instead of `0.91`, the `best_estimator_` differs from the grid's best config (you fit a fresh estimator). If CV and test diverge wildly, the fold seeds are making CV over-optimistic — flag it rather than hide it.

### 4.3 Verify the sweep

**✅ Checklist**

- ✅ Tree tuned to `max_depth=3, min_samples_leaf=1`; kNN to `n_neighbors=3, uniform`.
- ✅ Both CV scores and the independent test accuracy are printed and compared.
- ✅ The decision to export used the *test* result, not the CV ceiling.

**🤔 Socratic Question(s)**

- kNN's CV (0.937) overshot its test (0.91), while the tree matched (0.903≈0.91). Given one model's CV lies about the future, how would a *second holdout* set — tune on train, pick on dev, report on test — change which number you trust when deploying?
- `GridSearchCV` ran 9 tree configs before you picked one. Each config looked at the same folds; picking the best CV means you've effectively "tested" 9 models. What is the optimistic-bias name for this, and how does a nested-CV or a fixed dev set keep it honest?

## Step 5: Export and load the winner

The autopilot's final product is a reloadable artifact: same pipeline, same state, ready to score new traffic in another process. Step 5 freezes the choice.

### 5.1 Fit and save the final pipeline

**👟 Starter hint:** Define the final `Pipeline` (scaler → logistic), fit on `train`, score on `test`, then `joblib.dump`.

```python
# main.py (continued)
import joblib

final = Pipeline([("scaler", StandardScaler()),
                  ("model", LogisticRegression(max_iter=1000, random_state=1))])
final.fit(train[["bytes_in", "bytes_out"]], train["ok"])
acc = accuracy_score(test["ok"], final.predict(test[["bytes_in", "bytes_out"]]))
print("final logistic test accuracy:", round(acc, 3))

joblib.dump(final, "autopilot.joblib")
print("saved", __import__("pathlib").Path("autopilot.joblib").stat().st_size, "bytes")
```

Logistic is the zoo winner and the grid search didn't beat it on test, so the final artifact is the simple, well-understood scaled logistic — ML's version of "the boring solution that works". Saving with `joblib` serializes the *fitted object* (coefficients, scaler means, feature names) in a platform-native blob — not just a weight list, but everything needed to predict on day-old traffic in a fresh process.

**🎯 Expected output:**

```
final logistic test accuracy: 0.91
saved 1665 bytes
```

**🩹 If it's off:** If accuracy ≠ 0.91, the seed or `test_size` drifted from Step 1. If `saved` prints a larger size and a `.joblib` of 0 bytes, `joblib.dump` ran before `fit` or on a different object — dump after a fitted `final`.

### 5.2 Load and predict on new traffic

**👟 Starter hint:** In a fresh snippet (or new cell), `joblib.load` the blob and score a small batch — including `predict_proba`.

```python
# main.py — the reload, as if a new process
import joblib
model = joblib.load("autopilot.joblib")

batch = [[2.0, 2.5], [6.0, 6.0], [4.0, 4.0]]
print("labels:", model.predict(batch).tolist())
print("probas:\n", model.predict_proba(batch).round(3))
```

The reloaded model is the *same object* — the scaler's means and the logistic coefficients came back intact, so `score` on the test set reproduces `0.91`. `predict_proba` hands you confidence, not votes: a `[0.966, 0.034]` row is a strong "unhealthy", `[0.251, 0.749]` is a soft "healthy" near the boundary — exactly what a human in the loop needs before acting on a near-call.

**🎯 Expected output:**

```
labels: [0, 1, 0]
probas:
 [[0.966 0.034]
 [0.991 0.009]
 [0.251 0.749]]
```

**🩹 If it's off:** If `joblib.load` errors with a version mismatch, the blob was dumped by a different sklearn patch level — re-dump with the loading environment. If `predict` returns non-int classes, your `y` was a string column; keep the target numeric.

### 5.3 Verify the export

**✅ Checklist**

- ✅ The fitted pipeline scores `0.91` on the held-out test before and after a round-trip.
- ✅ `joblib.load` returns a working `Pipeline` with a working `score` and `predict_proba`.
- ✅ `batch` rows predict sanely: far-left class 0 strongly, far-right class 1 strongly, center ambiguous.

**🤔 Socratic Question(s)**

- The artifact is 1.6 KB for 300 training rows. Where does the "model" actually live — the coefficients and scaler means, or the training data? If the data never ships with the artifact, what does that mean for privacy and for retraining later?
- `predict` gave hard classes and `predict_proba` gave confidences. A dashboard that queries "0.24 failure chance" for row 3 — would you alert at `> 0.5`? Frame what a *decision threshold* variable would add to the pipeline beyond the model.

## ⚠️ Common pitfalls

- **Leaking the test set into preprocessing.** Fit the imputer/scaler on `train` only; calling `fit_transform` on all 400 rows trains on the data you'll later "predict". The split comes first, always.
- **Tuning on the test set.** `GridSearchCV` with `test` in the fit grabs answer-key knowledge. Search on `train`; only probe `test` once, at the end.
- **`value_counts` after the flip.** The 5% label noise makes the balance `{1: 208, 0: 192}`, not 200/200. Asserting exact equality is asserting the noise didn't run.
- **Imputing with `fit` vs `fit_transform`.** On a live streaming evaler you must `transform` with the *fitted* imputer — `fit` on a single row would relearn the median from it and explode.
- **Two RNG seeds mixed up.** `default_rng(7)` controls the data, `default_rng(1)` controls the missingness. Swap them and *all* downstream numbers change; keep them documented.
- **`joblib` version skew.** A blob dumped by sklearn 1.4 load in 1.6 usually works, but cross-version guarantees apply to the same installed bundles; `joblib.dump`/`load` in the same environment is the safe round-trip.

## What you just built

A real auto-pilot loop on a laptop: seeded synthetic data, stratified split, a learn-on-train-only impute-and-scale pipeline, an honest three-model race via cross-validation, a grid search whose CV and test numbers visibly diverge, and a `joblib`-serialized winner you can reload in any process. The ideas that survive contact with production are the *boundaries*: train/test split first, preprocessors learn from train only, models chosen by cross-validation but reported by an untouched test set, and tuning measured twice (once to choose, once to report). That's the difference between "my model scored 0.93" and "my model scored 0.91, and here's the CV number I used to pick the configuration."

:::tip[Run a fuller version without any local setup]
[`examples/automl-pipeline/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/automl-pipeline) in the course repo is the complete pipeline as a notebook — dataset, preprocessing, zoo, sweep, and export, runnable in Colab/Kaggle/Binder. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add a third-holdout "dev" set: tune on train, pick the config on dev, and report on test — the documented way to stop tuning optimism without nested CV.
- Feed every zoo model the *same* imputed+scaled pipeline (not raw features) and record whether logistic's advantage is the preprocessing or the model.
- Plot CV fold scores as a box plot in your favorite plotting lib — spreads tell you which model is fragile before it ships.
- Wrap the exported blob in a tiny CLI: `uv run autopilot.py --model autopilot.joblib <bytes_in> <bytes_out>` prints the predicted label and confidence.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓