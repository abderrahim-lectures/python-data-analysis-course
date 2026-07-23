# ML Classifier Example

The local companion to the course's [Train Your First Machine Learning Model](../../docs/projects/ml-classifier/index.md) Real-World Project — a real, runnable script that trains and compares two binary classifiers on the Titanic dataset with scikit-learn.

## What's here

- `train.py` — loads the same Titanic dataset used in Data Analysis Week 10's guided EDA, encodes its categorical columns, splits it into training and test sets, then trains and evaluates both a `LogisticRegression` and a `RandomForestClassifier`, printing accuracy and a confusion matrix for each.

Nothing here needs an API key, a GPU, or an internet connection beyond the one CSV download — everything runs locally, for free.

## Running it

```bash
uv run python train.py
```

`uv` reads `pyproject.toml` and creates an isolated environment for this project automatically on first run — no manual virtual environment setup needed.

## Expected output

Something like:

```
Logistic Regression
  Accuracy: 65.0%
  Confusion matrix (rows=actual, cols=predicted; order: died, survived):
    [12  0]
    [7  1]

Random Forest
  Accuracy: 65.0%
  Confusion matrix (rows=actual, cols=predicted; order: died, survived):
    [11  1]
    [6  2]
```

This course's Titanic CSV is a small (~100-row) sample, not the full ~900-row original, so the test set is tiny (~20 rows) and exact numbers will jump around noticeably between library versions and even between reruns without a fixed `random_state`. See the full lesson for how to read these numbers, and why a small gap between the two models isn't necessarily meaningful on a test set this size.

See the full [lesson](../../docs/projects/ml-classifier/index.md) for the step-by-step walkthrough, including why the categorical columns need encoding, why the train/test split matters, and what a confusion matrix actually shows.
