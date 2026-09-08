---
title: "Train Your First Machine Learning Model"
description: "Build, train, and evaluate a scikit-learn classifier with real data — no ML background needed."
difficulty: "intermediate"
estimatedMinutes: 60
xpReward: 50
tags: ["Machine Learning", "scikit-learn", "pandas", "matplotlib"]
prerequisites: ["Python basics", "Basic pandas", "Basic matplotlib"]
---

# Train Your First Machine Learning Model

Machine learning sounds intimidating, but the core idea is simple: show a computer examples of input/output pairs, and it learns a pattern it can apply to new, unseen data. In this project you'll do exactly that — load a classic dataset, train a decision tree classifier, and evaluate how well it predicts. No math background required.

## What You'll Learn

1. Load and explore a real dataset
2. Preprocess data for machine learning
3. Split data into train/test sets
4. Train a decision tree classifier
5. Evaluate model accuracy and create a confusion matrix

## What You'll Build

An ML pipeline that:
- Loads the Iris dataset from scikit-learn
- Explores feature distributions
- Splits data with proper train/test separation
- Trains a Decision Tree classifier
- Evaluates with accuracy, precision, recall
- Visualizes the confusion matrix

## Setup

```bash
uv init ml-classifier
cd ml-classifier
uv add scikit-learn pandas matplotlib
```

## Step 1: Load and Explore Data

The Iris dataset is one of the most famous datasets in machine learning. It contains measurements (sepal length, sepal width, petal length, petal width) for 150 iris flowers across three species. Your job: teach a model to predict the species from the measurements.

```python
import pandas as pd
from sklearn.datasets import load_iris

# Load the dataset
iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df["species"] = iris.target
df["species_name"] = df["species"].map({0: "setosa", 1: "versicolor", 2: "virginica"})

df.head()
```

Explore the data to understand what you're working with:

```python
# How many samples per species?
print(df["species_name"].value_counts())

# Basic statistics for each feature
df.describe()
```

**Expected output:** You'll see 50 samples per species (balanced classes), and statistics showing ranges like sepal length from roughly 4.3 to 7.9 cm.

**Troubleshooting:** If `load_iris()` fails, make sure you ran `uv add scikit-learn` in your setup step. The dataset is bundled with scikit-learn — no internet required.

## Step 2: Preprocess Features

Separate the input features (the measurements) from the target (the species label). Every column going into the model must be numeric —幸运ly, the Iris features already are, so no encoding is needed.

```python
X = df.drop(columns=["species", "species_name"])
y = df["species"]

print(f"Features shape: {X.shape}")
print(f"Target shape: {y.shape}")
```

**Expected output:** `Features shape: (150, 4)` and `Target shape: (150,)` — 150 rows, 4 feature columns.

**Troubleshooting:** If you see `object` dtype columns in `X.dtypes`, you accidentally included string columns. Drop anything that isn't a numeric measurement.

## Step 3: Train/Test Split

A model's accuracy on data it trained on tells you almost nothing. You need to hold back some data the model never sees during training, then evaluate on that held-out portion. This is the single most important habit in machine learning.

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"Training set: {X_train.shape[0]} samples")
print(f"Test set: {X_test.shape[0]} samples")
```

`test_size=0.2` holds back 20% of rows for testing (30 samples). `random_state=42` makes the split reproducible — you'll get the same rows every time.

**Expected output:** Training set: 120 samples, Test set: 30 samples.

**Troubleshooting:** If the numbers don't add up to 150, double-check your `test_size`. If `y_test` contains only one species, your split is unbalanced — try a different `random_state` or check that `y` actually has all three classes.

:::tip[Data leakage]
Always split *after* loading the data but *before* any transformation that summarizes the dataset (like scaling or encoding). Here the Iris features are already numeric and on similar scales, so no leakage risk — but this discipline matters for messier datasets.
:::

## Step 4: Train a Classifier

A Decision Tree asks a series of yes/no questions about the features (e.g., "is petal length > 2.5?") and arrives at a prediction. It's intuitive, fast, and works well as a first model.

```python
from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(random_state=42)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
```

`.fit(X_train, y_train)` is where learning happens — the model never sees `X_test` during this step. Then `.predict(X_test)` applies what it learned to the held-out data.

**Expected output:** `predictions` is an array of length 30 containing only 0, 1, or 2 (the species labels).

**Troubleshooting:** If you see a warning about feature names, you may have passed a DataFrame with extra columns. Make sure `X_train` and `X_test` contain only the four numeric feature columns.

## Step 5: Evaluate the Model

Start with accuracy — the fraction of predictions that were correct — then dig deeper with precision, recall, and a confusion matrix.

```python
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix

accuracy = accuracy_score(y_test, predictions)
precision = precision_score(y_test, predictions, average="weighted")
recall = recall_score(y_test, predictions, average="weighted")

print(f"Accuracy:  {accuracy:.1%}")
print(f"Precision: {precision:.1%}")
print(f"Recall:    {recall:.1%}")
```

Accuracy tells you the overall hit rate. Precision tells you, of all the times the model predicted a species, how often it was right. Recall tells you, of all the actual instances of a species, how many the model found. The `average="weighted"` parameter handles the multi-class case by averaging across all three species.

**Expected output:** All three metrics should be around 90–100% on this dataset — Iris is well-separated enough that a decision tree does very well.

**Troubleshooting:** If accuracy is exactly 33%, the model is guessing randomly (chance level for 3 classes). Check that `X_train` and `y_train` aren't shuffled independently — they must stay aligned.

## Step 6: Visualize Results

A confusion matrix shows exactly *which* species the model confused. Visualizing it makes the pattern obvious at a glance.

```python
import matplotlib.pyplot as plt
import numpy as np

cm = confusion_matrix(y_test, predictions)

fig, ax = plt.subplots(figsize=(6, 5))
im = ax.imshow(cm, cmap="Blues")

ax.set_xticks(range(3))
ax.set_yticks(range(3))
ax.set_xticklabels(iris.target_names)
ax.set_yticklabels(iris.target_names)
ax.set_xlabel("Predicted")
ax.set_ylabel("Actual")
ax.set_title("Confusion Matrix")

# Add count labels in each cell
for i in range(3):
    for j in range(3):
        ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                color="white" if cm[i, j] > cm.max() / 2 else "black")

plt.colorbar(im)
plt.tight_layout()
plt.show()
```

The diagonal cells (top-left to bottom-right) show correct predictions. Off-diagonal cells show mistakes — for example, if versicolor and virginica are sometimes confused, that cell will light up.

**Expected output:** A 3×3 grid with high numbers on the diagonal and zeros (or near-zeros) off it. A perfect model would have only diagonal entries.

**Troubleshooting:** If the plot doesn't appear, make sure you're running in an environment with a display (Jupyter, VS Code, or a local script). In a headless terminal, replace `plt.show()` with `plt.savefig("confusion_matrix.png")` to save the figure to a file instead.

## 🧩 Challenges

- **Try a different classifier.** Replace `DecisionTreeClassifier` with `RandomForestClassifier` (add `from sklearn.ensemble import RandomForestClassifier`). How does accuracy change?
- **Tune the tree.** Set `max_depth=2` when creating the `DecisionTreeClassifier`. What happens to accuracy? What about `max_depth=10`?
- **Feature importance.** After fitting, print `model.feature_importances_` alongside `iris.feature_names`. Which feature matters most for predicting species?
- **Hold out a different split.** Change `test_size` to 0.3 or 0.1. How does the accuracy number shift? Run the split 10 times with different `random_state` values and report the range of accuracy scores.

## What You Learned

You built a complete machine learning pipeline: load data, prepare features, split into train/test, train a classifier, evaluate with multiple metrics, and visualize results. The workflow — prepare → split → fit → evaluate — is the same shape used for every supervised learning task, whether it's a 150-row toy dataset or a million-row production system. Decision trees are just one family of models; the same steps work with logistic regression, random forests, neural networks, and beyond.

:::tip[Check scikit-learn's current docs]
scikit-learn is stable, but its API shifts between major versions — default parameter values change, and functions get deprecated. Before relying on this code beyond a course project, skim [scikit-learn's current documentation](https://scikit-learn.org/stable/) for the version you actually have installed (`uv pip show scikit-learn`).
:::
