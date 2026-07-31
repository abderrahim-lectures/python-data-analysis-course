"""Looks up each package's current published version on PyPI's public JSON API."""

import re

import requests


def parse_package_name(specifier: str) -> str:
    """Extract just the package name from a specifier like 'requests>=2.31'
    or 'requests[socks]==2.31.0'."""
    match = re.match(r"^[A-Za-z0-9_.-]+", specifier.strip())
    if not match:
        raise ValueError(f"Could not parse a package name from {specifier!r}")
    return match.group(0)


def get_latest_version(package_name: str) -> str | None:
    """Query PyPI's public JSON API for a package's current published
    version. Returns None if the package isn't found (a typo, or a private
    package not on PyPI)."""
    url = f"https://pypi.org/pypi/{package_name}/json"
    response = requests.get(url, timeout=10)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()["info"]["version"]


if __name__ == "__main__":
    for specifier in ["requests>=2.31", "packaging", "not-a-real-package-xyz"]:
        name = parse_package_name(specifier)
        latest = get_latest_version(name)
        print(f"{name}: latest is {latest!r}")
