"""
Local companion to the course's "Train Your First Machine Learning Model"
Real-World Project. Loads the same Titanic dataset used in Data Analysis
Week 10's guided EDA, prepares it for scikit-learn, and trains two binary
classifiers -- LogisticRegression and RandomForestClassifier -- comparing
accuracy and confusion matrices honestly on a held-out test set.

See docs/projects/ml-classifier/index.md for the full step-by-step walkthrough.
"""

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split

DATA_URL = (
    "https://raw.githubusercontent.com/abderrahim-lectures/"
    "python-data-analysis-course/main/static/datasets/titanic.csv"
)


def load_and_prepare_data() -> tuple[pd.DataFrame, pd.Series]:
    """Load the Titanic CSV and return (X, y), ready for scikit-learn.

    Mirrors the cleaning already covered in depth in Data Analysis Week 10 --
    fill missing Age/Embarked, drop identifier columns -- then adds the part
    that's new to this project: encoding categorical columns as numbers,
    since scikit-learn's models only accept numeric input.
    """
    df = pd.read_csv(DATA_URL)

    df["Age"] = df["Age"].fillna(df["Age"].median())
    df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])
    df = df.drop(columns=["PassengerId", "Name"])  # identifiers, not signal

    # One-hot encode categorical columns. drop_first=True avoids a redundant
    # column per category (e.g. Sex_female is fully implied by Sex_male=0).
    df = pd.get_dummies(df, columns=["Sex", "Embarked"], drop_first=True)

    X = df.drop(columns=["Survived"])
    y = df["Survived"]
    return X, y


def evaluate(name: str, y_test: pd.Series, predictions) -> None:
    """Print accuracy and a confusion matrix for one model's predictions."""
    accuracy = accuracy_score(y_test, predictions)
    print(f"\n{name}")
    print(f"  Accuracy: {accuracy:.1%}")
    print("  Confusion matrix (rows=actual, cols=predicted; order: died, survived):")
    for row in confusion_matrix(y_test, predictions):
        print(f"    {row}")


def main() -> None:
    X, y = load_and_prepare_data()

    # Held out BEFORE any model sees the data, so accuracy reflects
    # performance on passengers the model has genuinely never seen.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    logreg = LogisticRegression(max_iter=1000)
    logreg.fit(X_train, y_train)
    evaluate("Logistic Regression", y_test, logreg.predict(X_test))

    forest = RandomForestClassifier(n_estimators=100, random_state=42)
    forest.fit(X_train, y_train)
    evaluate("Random Forest", y_test, forest.predict(X_test))


if __name__ == "__main__":
    main()
