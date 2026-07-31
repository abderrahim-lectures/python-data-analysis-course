"""Correct semantic-version comparison, using the same library pip uses internally."""

from packaging.version import InvalidVersion, Version


def is_outdated(current: str, latest: str) -> bool | None:
    """Compare two version strings properly. Returns None (not True/False)
    if either string isn't a version packaging can parse — e.g. a git URL
    or a local path used as a 'version', which pyproject.toml permits."""
    try:
        return Version(current) < Version(latest)
    except InvalidVersion:
        return None


if __name__ == "__main__":
    print(is_outdated("2.9.0", "2.10.0"))  # True — real semantic comparison
    print(is_outdated("2.10.0", "2.9.0"))  # False
    print(is_outdated("2.10.0", "2.10.0"))  # False -- equal, not outdated
    print(is_outdated("not-a-version", "2.10.0"))  # None -- can't compare
