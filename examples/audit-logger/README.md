# Build an Audit Logger

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audit-logger/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audit-logger/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Faudit-logger%2Fnotebook.ipynb)

Append-only event log with a SHA-256 hash chain: every entry links to its predecessor, a verify pass proves nothing was altered, queries filter by severity and source, retention prunes old entries while keeping the chain valid, and a compliance export ships JSONL for dashboards.

Run the [`notebook.ipynb`](./notebook.ipynb) version for a step-by-step, no-install walkthrough of the project.
