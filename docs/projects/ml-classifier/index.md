---
id: ml-classifier
title: "Train Your First Machine Learning Model"
sidebar_label: "Train an ML Classifier"
slug: /projects/ml-classifier
description: "Graduate from describing data to predicting from it: train a real binary classifier on the Titanic dataset with scikit-learn."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Train Your First Machine Learning Model

<ProjectPublishedDate projectId="ml-classifier" />

<ProjectGreeting />

This project assumes you're comfortable with pandas at roughly the level of Data Analysis's Normal track — filtering, `.groupby()`, handling missing values. In fact it assumes you've specifically done [Week 10's guided Titanic EDA](/docs/data-analysis/normal/week-10): you already loaded that dataset, cleaned it, and asked questions like "did survival rate differ by class or sex?" This project is the direct sequel. You already *described* this dataset. Now you'll *predict* from it — training a model that looks at a passenger it has never seen and guesses whether they survived.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv` and set up a local project with `scikit-learn` and `pandas`.
2. Load the same Titanic dataset from Week 10, and encode its categorical columns as numbers.
3. Split the data into a training set and a test set, and understand why that split matters.
4. Train a `LogisticRegression` classifier and use it to predict survival.
5. Evaluate it properly, then train a second model (`RandomForestClassifier`) and compare.

## Where to run this

Three reasonable ways to do this project — pick whichever fits your setup:

- **Locally with `uv` (recommended).** This project is small and needs no GPU, so it's a good candidate for actually installing Python for real on your own machine, same as the other Real-World Projects. Steps 1–5 below assume this path.
- **GitHub Codespaces.** Open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) to get a cloud dev environment with Node, Python, and `uv` already installed (see [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)) — the exact same commands below work from a browser tab, no local install at all.
- **Google Colab or Kaggle Notebooks.** A genuinely good fit here: training `LogisticRegression` or `RandomForestClassifier` on a dataset this small (a few hundred rows at most) needs no GPU, so a free notebook environment is more than enough.

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ml-classifier/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ml-classifier/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fml-classifier%2Fnotebook.ipynb)

  Click a badge above to open a ready-to-run notebook (`examples/ml-classifier/notebook.ipynb`) with the install cell, data loading/encoding, train/test split, and both classifiers already filled in. **Kaggle Notebooks specifically** is a nice full-circle choice — the Titanic dataset is itself one of Kaggle's original, most famous beginner competitions, so you'd be training a model on Kaggle's own platform, on Kaggle's own dataset.

## Step 1: Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

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

Then set up the project:

```bash
uv init ml-classifier
cd ml-classifier
uv add scikit-learn pandas
```

## Step 2: Load and prepare the data

Same dataset, same columns as Week 10's EDA — this time loaded from the course's raw dataset file instead of the in-browser sandbox:

```python
import pandas as pd

url = "https://raw.githubusercontent.com/abderrahim-lectures/python-data-analysis-course/main/static/datasets/titanic.csv"
df = pd.read_csv(url)
df.head()
```

Quick recap of the cleaning Week 10 already walked through in depth — just enough here to get a clean DataFrame, not re-taught:

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])
df = df.drop(columns=["PassengerId", "Name"])  # identifiers, not predictive signal
```

### Encoding categorical columns

This part is new. `Sex` and `Embarked` are strings ("male"/"female", "S"/"C"/"Q") — Week 10's `.groupby()` was perfectly happy grouping by a string column, but scikit-learn's models are not: every model in this project is, underneath, doing arithmetic on numbers, so every column that goes in has to already be numeric. `pd.get_dummies` handles this by turning one categorical column into several 0/1 columns, one per category:

```python
df = pd.get_dummies(df, columns=["Sex", "Embarked"], drop_first=True)
df.head()
```

`drop_first=True` drops one category per column (e.g. keeps `Sex_male` but not `Sex_female`) because the dropped category is fully implied by the others being 0 — keeping both would be redundant. `Sex` becomes one column (`Sex_male`, 1 or 0); `Embarked` becomes two (`Embarked_Q`, `Embarked_S`, both 0 meaning "C"). This is the same shape of transformation as `pd.cut` in Week 10 — turning one column into a form easier for the next step to consume — just going from text to numbers instead of from continuous to binned.

Finally, separate the columns you're predicting *from* (the features, `X`) from the column you're predicting (the target, `y`):

```python
X = df.drop(columns=["Survived"])
y = df["Survived"]
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`df.isna().sum()` shows zero missing values in every column you're about to feed the model.</StepChecklistItem>
<StepChecklistItem>`X.dtypes` shows no `object` columns left — everything is numeric.</StepChecklistItem>
<StepChecklistItem>`X` does not contain the `Survived` column; `y` does not contain anything else.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

`pd.get_dummies` was applied to `Sex` and `Embarked`, but not to `Pclass` (1, 2, or 3) — it was left as a single numeric column. `Pclass` is a category too (there's no meaningful sense in which class 2 is "twice" class 1), yet leaving it as-is is a defensible choice some real analyses make. Can you think of an argument for encoding `Pclass` the same way as `Sex`, and an argument for leaving it alone?

## Step 3: Split into training and test sets

Here's the core idea this step is built on: **a model's score on data it was trained on tells you almost nothing about how it'll do on data it hasn't seen.** A model can — and, given enough freedom, will — simply memorize the training rows rather than learn a genuine pattern. Imagine grading a student using the exact questions they were handed the answer key for beforehand: a perfect score wouldn't tell you whether they understood the material or just memorized those specific answers. Evaluating a model on its own training data has the same flaw. To get an honest measure of how the model performs on passengers it's never seen, you have to hold some data back and never let the model train on it.

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
```

`test_size=0.2` holds back 20% of the rows for testing, training on the remaining 80%. `random_state=42` fixes the random shuffle used to pick which rows go where — without it, you'd get a *different* split (and therefore a slightly different accuracy score) every time you rerun the script, making it hard to tell whether a change to your code actually helped or you just got a luckier split.

:::tip[Data leakage: prepare, then split — not the other way around]
Step 2's encoding was done on the *whole* dataset, before this split, which is fine here because `pd.get_dummies` only looks at each row's own category, not at any other row. But it's easy to get this wrong with transformations that *do* look across rows — for example, scaling a column using its mean and standard deviation. If you compute that mean/std on the full dataset and then split, the training set has quietly "seen" information from the test set (its rows contributed to that mean). This is called **data leakage**, and it's one of the most common real-world mistakes in applied machine learning — the fix is to always compute anything that summarizes the data (means, standard deviations, category lists) using the *training* set only, then apply that same transformation to the test set.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`X_train.shape` and `X_test.shape` show roughly an 80/20 split of the total row count.</StepChecklistItem>
<StepChecklistItem>Rerunning the split with the same `random_state` reproduces the exact same rows in `X_test` every time.</StepChecklistItem>
<StepChecklistItem>`y_train` and `y_test` are both a mix of 0s and 1s, not all one value.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

If you trained a model and evaluated it on `X_train`/`y_train` instead of `X_test`/`y_test` by mistake, would you expect the accuracy to look *better* or *worse* than the honest number — and why?

## Step 4: Train a classifier

`LogisticRegression`, despite the name, is a classifier, not a regression model in the usual sense. The idea: for each passenger, it computes a weighted sum of their features (age, fare, sex, class, ...) — the same shape of computation as an ordinary linear equation — and then squashes that sum through a function (the logistic/sigmoid function) that maps any number onto a value between 0 and 1. That output is interpreted as an estimated *probability* of survival. "Fitting the model" means finding the set of weights that makes those estimated probabilities line up as closely as possible with the actual 0/1 outcomes in the training data. A prediction is then just "probability ≥ 0.5 → predict survived."

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
```

`.fit(X_train, y_train)` is where the learning happens — it never sees `X_test` or `y_test`. `max_iter=1000` raises the cap on how many optimization steps the solver takes to converge; the default sometimes isn't enough for this data and scikit-learn will warn you if it stops early.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`model.fit(...)` runs without a convergence warning (or you've raised `max_iter` until it doesn't).</StepChecklistItem>
<StepChecklistItem>`predictions` is an array of the same length as `y_test`, containing only 0s and 1s.</StepChecklistItem>
<StepChecklistItem>You can print `model.predict_proba(X_test)[:5]` and see it return actual probabilities, not just the final 0/1 call.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

`predict_proba` might return something like 0.51 for one passenger and 0.98 for another — both get rounded to the same final prediction (1), but they represent very different levels of confidence. What real-world decision might change if you had access to that probability, instead of just the final yes/no prediction?

## Step 5: Evaluate and compare models

The single number to start with is accuracy — the fraction of test-set predictions that matched the real outcome:

```python
from sklearn.metrics import accuracy_score, confusion_matrix

accuracy = accuracy_score(y_test, predictions)
print(f"Logistic Regression accuracy: {accuracy:.1%}")
```

Accuracy alone hides *what kind* of mistakes the model makes. A confusion matrix breaks that down:

```python
cm = confusion_matrix(y_test, predictions)
print(cm)
```

The result is a 2×2 grid. Reading it in plain terms: it counts, separately, how many passengers who actually died were correctly predicted to die, how many who actually died were wrongly predicted to survive (a **false positive** for "survived"), how many who actually survived were wrongly predicted to die (a **false negative**), and how many who actually survived were correctly predicted to survive. Two models with identical accuracy can make very different *kinds* of mistakes — worth knowing, especially in domains where one kind of error (say, a missed medical diagnosis) is far costlier than the other.

Now train a second, different kind of model on the exact same split, and compare honestly:

```python
from sklearn.ensemble import RandomForestClassifier

rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)
rf_predictions = rf_model.predict(X_test)

rf_accuracy = accuracy_score(y_test, rf_predictions)
print(f"Random Forest accuracy: {rf_accuracy:.1%}")
print(confusion_matrix(y_test, rf_predictions))
```

A random forest trains many small decision trees, each on a slightly different random subset of the data and features, and has them vote on the final prediction — a different underlying idea from logistic regression's single weighted-sum-plus-probability approach. Compare the two accuracy numbers you now have. Don't assume the higher one is automatically "the better model" — see the pitfall below.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You have two accuracy numbers, computed on the *same* `X_test`/`y_test`, one per model.</StepChecklistItem>
<StepChecklistItem>You've printed both confusion matrices and can say, in a sentence, which kinds of mistakes each model made.</StepChecklistItem>
<StepChecklistItem>You haven't declared a "winner" without considering how small the gap between them actually is.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If your model scores 95% accuracy but the dataset is 95% one class, what does that number actually tell you? (Check: what fraction of Titanic passengers actually survived — is it close to 50/50, or skewed?)
- The two models' accuracy scores probably differ by only a few percentage points, computed on a test set of only around 20 rows (this course's version of the dataset has about 100 rows total, smaller than the original Kaggle Titanic dataset's ~900). How confident should you be that this specific gap would hold up on a *different* random 20% test split?

## ⚠️ Common pitfalls

- **Encoding train and test sets inconsistently.** If you split first and then run `pd.get_dummies` separately on each half, a category present in training but absent in test (or vice versa) can produce mismatched columns between `X_train` and `X_test`, breaking `.fit()`/`.predict()` or silently producing wrong results. Encode before splitting when the encoding only looks at each row's own values (as here), or fit the encoder on training data only and apply it to test data, never the reverse.
- **Data leakage** — fitting any transformation that summarizes the *whole* dataset (a scaler, an encoder with cross-row statistics) before splitting, instead of after. See the tip in Step 3; this is one of the most common real-world mistakes in applied machine learning, and it quietly inflates your test accuracy into an overly optimistic number.
- **Over-interpreting a small accuracy difference.** With a test set this small (around 20 rows, since this course's dataset has only about 100 rows total), a 2-3 percentage point gap — often just one or two flipped predictions — is well within the range you'd expect from random noise in *which* rows happened to land in the test split, not necessarily evidence one model is genuinely better. Cross-validation (see below) is the standard way to get a more trustworthy comparison, and matters even more on a dataset this size.
- **Forgetting `random_state`.** Without it, your split (and some models' internal randomness) changes every run, making it impossible to tell whether a change you made actually improved anything or you just got a different random split.

## What you just built

You took a dataset you had already explored and summarized with pandas, and pushed one step further: a model that generalizes from examples it saw to a prediction about examples it didn't. Nothing here is exotic — `LogisticRegression` and `RandomForestClassifier` are two of the most widely used classifiers in practice — but the shape of the workflow (prepare data, split honestly, fit, evaluate, compare) is the same shape used for far more sophisticated models.

:::tip[Check scikit-learn's current docs]
scikit-learn is a mature, stable library, but its API does shift between major versions occasionally — default parameter values change, and functions get deprecated in favor of newer ones. Before relying on this code beyond a course project, skim [scikit-learn's current documentation](https://scikit-learn.org/stable/) for the version you actually have installed (`uv pip show scikit-learn`).
:::

## Where to go from here

- **Feature engineering.** The `Name` column was dropped in Step 2, but it isn't useless — titles like "Mr.", "Mrs.", "Miss.", and "Master." (embedded in the name string) correlate strongly with age and sex, and extracting them as a new categorical column is a classic improvement to this exact dataset.
- **Cross-validation.** A single train/test split gives one accuracy number that depends partly on luck (which rows landed where). `sklearn.model_selection.cross_val_score` repeats the split-train-evaluate cycle several times on different slices and averages the result — a more trustworthy way to compare two models than the single comparison in Step 5.
- **A different dataset entirely.** Kaggle hosts hundreds of small, well-documented beginner datasets similar in spirit to Titanic — a good next step once this workflow feels routine.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="ml-classifier" />
