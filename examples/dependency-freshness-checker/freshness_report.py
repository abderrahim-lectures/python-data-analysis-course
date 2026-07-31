"""Ties parsing, PyPI lookup, and version comparison together into a real report."""

from dataclasses import dataclass

from check_pypi import get_latest_version, parse_package_name
from compare import is_outdated
from parse_deps import load_dependencies


@dataclass
class DependencyStatus:
    name: str
    current_specifier: str
    latest: str | None
    outdated: bool | None


def build_report(pyproject_path: str) -> list[DependencyStatus]:
    report = []
    for specifier in load_dependencies(pyproject_path):
        name = parse_package_name(specifier)
        latest = get_latest_version(name)
        # A specifier with no pinned version (just "requests") has nothing
        # concrete to compare against -- treat that case as "unknown" too.
        pinned = specifier[len(name) :].lstrip(">=<~! ")
        outdated = is_outdated(pinned, latest) if pinned and latest else None
        report.append(DependencyStatus(name, specifier, latest, outdated))
    return report


def print_report(report: list[DependencyStatus]) -> None:
    outdated = [d for d in report if d.outdated is True]
    fresh = [d for d in report if d.outdated is False]
    unknown = [d for d in report if d.outdated is None]

    if outdated:
        print(f"WARNING: {len(outdated)} outdated:")
        for d in outdated:
            print(f"   {d.name}: pinned {d.current_specifier!r}, latest is {d.latest}")
    if fresh:
        print(f"OK: {len(fresh)} up to date: {', '.join(d.name for d in fresh)}")
    if unknown:
        print(f"UNKNOWN: {len(unknown)} could not be checked: {', '.join(d.name for d in unknown)}")


if __name__ == "__main__":
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "pyproject.toml"
    print_report(build_report(path))
