# Dependency-Freshness Checker

<!-- Real, runnable companion code for the "Build a Dependency-Freshness Checker"
     Real-World Project: https://pyda-course.online/docs/projects/dependency-freshness-checker -->

A CLI tool that reads a `pyproject.toml`, checks PyPI's public API for the current version of every dependency, and reports what's outdated — no API key, no signup, no paid service.

## What's here

- `parse_deps.py` — reads a `pyproject.toml`'s `[project.dependencies]` list
- `check_pypi.py` — looks up each package's current published version via PyPI's public JSON API
- `compare.py` — real semantic-version comparison using the `packaging` library (the same one `pip` uses internally)
- `freshness_report.py` — ties it all together into a categorized ✅/⚠️/❓ report
- `notebook.ipynb` — a Colab/Kaggle/Binder-runnable notebook version, using an example `pyproject.toml` embedded directly in the notebook (since a hosted notebook session has no real project folder of yours to point at)

## Running it

```bash
uv sync
uv run python freshness_report.py pyproject.toml
```

Or point it at any other project's `pyproject.toml` on your machine:

```bash
uv run python freshness_report.py /path/to/some/other/project/pyproject.toml
```

Example output:

```
WARNING: 2 outdated:
   requests: pinned 'requests>=2.31', latest is 2.34.2
   packaging: pinned 'packaging>=24.0', latest is 26.2
```

## Notebook / hosted version

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-dependency-freshness-checker-project/examples/dependency-freshness-checker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-dependency-freshness-checker-project/examples/dependency-freshness-checker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-dependency-freshness-checker-project?filepath=examples%2Fdependency-freshness-checker%2Fnotebook.ipynb)
