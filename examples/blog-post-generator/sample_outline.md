# Why I Started Tracking My Habits as a Calendar Heatmap

## Intro
- Hook: I kept quitting habits within two weeks and never really knew why.
- Thesis: seeing streaks on a heatmap changed how I stick with things.

## What I tried before
- Habit apps with reminders -- they nag, I ignore them.
- Paper checklists -- fine until I lost the notebook.
- Conclusion: the missing piece was a visible, long-term record.

## The heatmap idea
- GitHub's contribution graph as a model.
- One square per day, green = did the thing.
- Streak becomes a pattern you don't want to break.

## How I built it (the fun part)
- A tiny script logs a check-in per day to a JSON/CSV file.
- matplotlib renders a year of squares.
- TODO: add the exact pandas code snippet here.
- Lesson: the build was simpler than I expected.

## What changed
- Two months of visible squares is its own motivation.
- The graph showed me *when* I usually slip (weekends).
- Honest note: some squares are fake -- I logged days I didn't really do it.

## Where to go next
- Auto-detect missed days instead of trusting my self-reports.
- Add a second habit and compare the two graphs.
- Open question: does public accountability (sharing it) help or hurt?
