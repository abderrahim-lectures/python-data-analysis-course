"""Reads a pyproject.toml and extracts its raw dependency specifier strings."""

import tomllib
from pathlib import Path


def load_dependencies(pyproject_path: str) -> list[str]:
    """Read a pyproject.toml and return its raw dependency specifier strings,
    e.g. ["requests>=2.31", "packaging"]."""
    with Path(pyproject_path).open("rb") as f:
        data = tomllib.load(f)
    return data.get("project", {}).get("dependencies", [])


if __name__ == "__main__":
    deps = load_dependencies("pyproject.toml")
    for dep in deps:
        print(dep)
