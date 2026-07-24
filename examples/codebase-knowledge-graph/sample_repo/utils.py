"""Small math/formatting helpers used by the rest of this sample repo."""


def add(a, b):
    """Add two numbers."""
    return a + b


def multiply(a, b):
    """Multiply two numbers."""
    return a * b


class Formatter:
    """Formats numbers as human-readable strings."""

    def format(self, value):
        """Formats `value` as a two-decimal string, e.g. 19.99."""
        return f"{value:.2f}"
