# Habit-Streak Visualizer Example

The local companion to the course's [Build a Habit-Streak Visualizer](../../docs/projects/habit-streak-visualizer/index.md) Real-World Project — a real, runnable CLI that logs daily habit check-ins locally and renders a GitHub-contributions-graph-style calendar heatmap with pandas and matplotlib.

## What's here

- `log.py` — reads and writes the check-in log (a flat CSV: `date,habit,done`).
- `checkin.py` — a CLI for logging today's (or any date's) check-in for a habit.
- `streaks.py` — computes current streak and longest streak from a habit's history.
- `grid.py` — the interesting part: lays a date range out into a 7-row (weekday) x N-column (week) grid, GitHub-contributions-style, using a fixed-anchor day-offset instead of ISO week numbers so it doesn't break at year boundaries.
- `heatmap.py` — renders that grid as a matplotlib figure, colored by a sequential blue ramp that darkens as a streak builds.
- `visualize.py` — ties it together: load a log, print streak stats, save a heatmap PNG.
- `generate_sample_data.py` — one-off script (already run) that generated `sample_checkins.csv`.
- `sample_checkins.csv` — bundled sample data: two habits, ~7 months, with real streaks, a slump, and some gaps, so the heatmap looks genuinely interesting without logging anything by hand first.
- `notebook.ipynb` — a Colab/Kaggle/Binder-friendly notebook version of the same pipeline, using the bundled sample data.

Nothing here needs an API key, a GPU, or an internet connection — everything runs locally, for free, on data that never leaves your machine.

## Running it

```bash
# Log a real check-in for yourself
uv run python checkin.py "Exercise"

# Or just explore the bundled sample data
uv run python visualize.py --habit "Exercise"
uv run python visualize.py --habit "Read 10 pages"

# Once you have your own log going:
uv run python visualize.py checkins.csv --habit "Exercise"
```

`uv` reads `pyproject.toml` and creates an isolated environment for this project automatically on first run — no manual virtual environment setup needed.

## Expected output

Something like:

```
Habit: Exercise
  Logged range: 2026-01-01 -> 2026-07-22 (203 days)
  Days done: 140 / 203
  Current streak: 0 day(s)
  Longest streak: 19 day(s)
Saved heatmap to exercise_heatmap.png
```

...plus a PNG that looks like a GitHub contributions graph: seven rows (Mon–Sun), one column per week, cells shaded from pale to deep blue as a streak builds, and flat gray for days outside the logged range.

See the full [lesson](../../docs/projects/habit-streak-visualizer/index.md) for the step-by-step walkthrough, including why the grid uses a day-offset anchor instead of ISO week numbers, and how the streak math treats an unlogged day the same as an explicit "missed."
