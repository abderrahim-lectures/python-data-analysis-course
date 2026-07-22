# Section 2: Pandas & Data Analysis (Weeks 6–10)

**Section intro — "Why Pandas? The Speed Problem"** (`docs/data-analysis/index.md`, read by both tracks before Week 6): a short motivating demo — pure-Python word counting over a CSV (the Hard-track SLM students already timed this in Week 5; Normal-track students get a small equivalent snippet inline) run again with numpy/pandas, showing the wall-clock difference. This is the pitch for *why* vectorized tools exist, not a full lesson — it frames everything that follows.

**Normal track** (pandas 101 → reproduce a Kaggle-style notebook):
- Week 6: Series/DataFrame basics, reading CSV
- Week 7: selection, filtering, indexing
- Week 8: cleaning (missing values, dtypes, string ops)
- Week 9: groupby, aggregation, merging
- Week 10: guided end-to-end reproduction of a classic Titanic EDA notebook (loaded via a well-known public raw-CSV URL, e.g. the datasciencedojo Titanic mirror commonly used in tutorials)

**Hard track — PBL: full EDA with visualizations:**
- Week 6: EDA framework — framing questions, dataset overview/profiling
- Week 7: univariate analysis + matplotlib/seaborn visualizations
- Week 8: bivariate/multivariate analysis, correlation
- Week 9: advanced/storytelling visualizations
- Week 10: final deliverable — full EDA report on **"Students Performance in Exams"** (scores in math/reading/writing vs. gender, parental education, lunch type, test-prep completion) — one of Kaggle's most-voted beginner EDA datasets, and thematically on-topic for a course about education — loaded via a public raw-CSV URL, with a required set of charts

Every external dataset/tool used (Titanic mirror, the Students Performance in Exams dataset, JupyterLite/Pyodide) is credited on the `credits.tsx` page — good academic practice for a course aimed at students who'll be expected to cite sources themselves.
