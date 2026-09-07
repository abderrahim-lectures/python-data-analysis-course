# Build a Code Review Bot

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-review-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-review-bot/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcode-review-bot%2Fnotebook.ipynb)

A deterministic review agent: a rule registry that flags line-length, trailing whitespace, bare excepts, debug prints, TODOs, and missing docstrings in a simulated PR diff, aggregates severity, emits an ordered comment list plus a JSON payload, and flips REJECT to APPROVE once a human fixes the blockers.

Run the [`notebook.ipynb`](./notebook.ipynb) version for a step-by-step, no-install walkthrough of the project.
