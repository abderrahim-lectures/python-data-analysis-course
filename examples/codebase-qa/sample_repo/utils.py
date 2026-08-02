"""Helper module for the sample training pipeline."""


def split_data(features, labels, ratio: float = 0.8):
    """Splits features/labels into train and test portions by index ratio."""
    n = len(features)
    cut = int(n * ratio)
    return (
        features[:cut],
        features[cut:],
        labels[:cut],
        labels[cut:],
    )


def shuffle(data, seed: int = 42):
    """A pretend in-place shuffle (kept trivial so the demo stays readable)."""
    return data
