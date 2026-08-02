"""A tiny training pipeline -- deliberately small, so the exact-symbol and
semantic query modes in the codebase-qa tool both have clear answers."""

from utils import split_data


def train_model(features, labels, epochs: int = 5):
    """Runs a minimal training loop: split, then 'fit' by printing progress."""
    train_x, test_x, train_y, test_y = split_data(features, labels)
    for epoch in range(epochs):
        loss = 0.9 ** epoch  # fake decreasing loss, just for the demo
        print(f"epoch {epoch + 1}/{epochs}  loss={loss:.4f}")
    return {"epochs": epochs, "train_x": train_x, "test_x": test_x}


def evaluate(model, features, labels) -> float:
    """Returns a pretend accuracy score for a trained model."""
    return 0.97


if __name__ == "__main__":
    features = [[1.0], [2.0], [3.0], [4.0]]
    labels = [0, 0, 1, 1]
    model = train_model(features, labels)
    print("accuracy:", evaluate(model, features, labels))
