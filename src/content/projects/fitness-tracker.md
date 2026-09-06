---
title: "Fitness Tracker"
description: "Track workouts, nutrition, and health metrics with progress visualization and goal setting."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["classes", "pandas", "matplotlib", "data-analysis"]
learningObjectives:
  - "Design classes to model real-world entities like exercises and meals"
  - "Log structured workout and nutrition data"
  - "Compute daily calorie intake and macros"
  - "Plot progress over time with matplotlib"
prerequisites: ["Python basics (classes, dictionaries, lists)", "pip install pandas matplotlib"]
---

# Fitness Tracker

Log your workouts, track your meals, and watch your progress unfold on charts.

## What You'll Learn

1. Use classes to model exercises, meals, and workout sessions
2. Store and query structured data with pandas
3. Calculate calorie intake and macronutrient breakdowns
4. Build line charts and grouped bar charts to visualize trends

## What You'll Build

A fitness logging application that lets you:

- **Log workouts** — record exercise name, sets, reps, weight, and duration
- **Track meals** — log food items with calories, protein, carbs, and fat
- **Set goals** — define weekly workout targets and calorie budgets
- **Visualize progress** — line charts for weight and strength trends, bar charts for daily macros

## Where to Run It

- **JupyterLite playground** — paste the code cells directly into a notebook
- **Local with uv** — run as a standalone script
- **Google Colab** — open a new notebook and paste the cells

## Setup

```bash
uv init fitness-tracker
cd fitness-tracker
uv add pandas matplotlib
```

## Step 1 — Define the Exercise and Meal Classes

Create classes to represent individual exercises and meals with useful methods.

```python
from datetime import date
from dataclasses import dataclass

@dataclass
class Exercise:
    name: str
    sets: int
    reps: int
    weight_kg: float
    duration_min: int = 0

    @property
    def volume(self) -> float:
        return self.sets * self.reps * self.weight_kg

    def summary(self) -> str:
        return f"{self.name}: {self.sets}x{self.reps} @ {self.weight_kg}kg (vol: {self.volume:.0f})"

@dataclass
class Meal:
    name: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float

    def summary(self) -> str:
        return f"{self.name}: {self.calories} kcal (P:{self.protein_g}g C:{self.carbs_g}g F:{self.fat_g}g)"

# Test the classes
bench = Exercise("Bench Press", sets=4, reps=8, weight_kg=60)
print(bench.summary())
print(f"Volume: {bench.volume:.0f} kg")

chicken = Meal("Grilled Chicken", calories=350, protein_g=40, carbs_g=5, fat_g=10)
print(chicken.summary())
```

## Step 2 — Build the Workout Logger

Create a `WorkoutSession` class that aggregates exercises for a single day and computes totals.

```python
class WorkoutSession:
    def __init__(self, session_date: str | None = None):
        self.date = session_date or date.today().isoformat()
        self.exercises: list[Exercise] = []

    def add_exercise(self, exercise: Exercise) -> None:
        self.exercises.append(exercise)
        print(f"Added: {exercise.summary()}")

    def total_volume(self) -> float:
        return sum(ex.volume for ex in self.exercises)

    def duration(self) -> int:
        return sum(ex.duration_min for ex in self.exercises)

    def display(self) -> str:
        lines = [f"Workout — {self.date}", "-" * 40]
        for ex in self.exercises:
            lines.append(f"  {ex.summary()}")
        lines.append(f"  Total volume: {self.total_volume():.0f} kg")
        return "\n".join(lines)

# Log a sample session
session = WorkoutSession()
session.add_exercise(Exercise("Bench Press", 4, 8, 60, 15))
session.add_exercise(Exercise("Overhead Press", 3, 10, 30, 10))
session.add_exercise(Exercise("Lateral Raise", 3, 15, 10, 8))
print(session.display())
```

## Step 3 — Track Daily Nutrition

Build a `DailyLog` that collects meals and computes totals and macro percentages.

```python
class DailyLog:
    def __init__(self, log_date: str | None = None):
        self.date = log_date or date.today().isoformat()
        self.meals: list[Meal] = []

    def add_meal(self, meal: Meal) -> None:
        self.meals.append(meal)

    def totals(self) -> dict:
        return {
            "calories": sum(m.calories for m in self.meals),
            "protein": sum(m.protein_g for m in self.meals),
            "carbs": sum(m.carbs_g for m in self.meals),
            "fat": sum(m.fat_g for m in self.meals),
        }

    def display(self) -> str:
        t = self.totals()
        lines = [f"Daily Log — {self.date}", "-" * 40]
        for m in self.meals:
            lines.append(f"  {m.summary()}")
        lines.append(f"  TOTAL: {t['calories']} kcal | P:{t['protein']}g C:{t['carbs']}g F:{t['fat']}g")
        return "\n".join(lines)

log = DailyLog()
log.add_meal(Meal("Breakfast Oats", 300, 10, 50, 8))
log.add_meal(Meal("Grilled Chicken", 350, 40, 5, 10))
log.add_meal(Meal("Protein Shake", 120, 25, 5, 1))
print(log.display())
```

## Step 4 — Visualize Progress Over Time

Use pandas and matplotlib to plot weight trends and strength progression.

```python
import pandas as pd
import matplotlib.pyplot as plt

# Simulate a week of data
workouts = [
    {"date": "2025-01-06", "bench_vol": 1920, "squat_vol": 2400, "weight_kg": 82},
    {"date": "2025-01-08", "bench_vol": 2080, "squat_vol": 2600, "weight_kg": 81.5},
    {"date": "2025-01-10", "bench_vol": 2240, "squat_vol": 2800, "weight_kg": 81},
    {"date": "2025-01-12", "bench_vol": 2240, "squat_vol": 3000, "weight_kg": 80.8},
    {"date": "2025-01-14", "bench_vol": 2400, "squat_vol": 3200, "weight_kg": 80.5},
]

df = pd.DataFrame(workouts)
df["date"] = pd.to_datetime(df["date"])

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Weight trend
axes[0].plot(df["date"], df["weight_kg"], marker="o", color="#2ecc71")
axes[0].set_title("Body Weight Trend")
axes[0].set_ylabel("kg")
axes[0].tick_params(axis="x", rotation=45)

# Strength volume
axes[1].plot(df["date"], df["bench_vol"], marker="o", label="Bench", color="#3498db")
axes[1].plot(df["date"], df["squat_vol"], marker="s", label="Squat", color="#e74c3c")
axes[1].set_title("Lifting Volume Over Time")
axes[1].set_ylabel("Volume (kg)")
axes[1].legend()
axes[1].tick_params(axis="x", rotation=45)

plt.tight_layout()
plt.savefig("fitness_progress.png", dpi=150)
plt.show()
print("Chart saved to fitness_progress.png")
```

## 🧩 Challenges

**Challenge 1 — Workout streaks**
Write a function that takes a list of workout dates and returns the current consecutive-day streak and the longest streak ever recorded.

**Challenge 2 — Macro pie chart**
For a given `DailyLog`, generate a pie chart showing the calorie percentage from protein, carbs, and fat.

**Challenge 3 — Goal tracker**
Add a `WeeklyGoal` class that defines a target number of workouts per week and target weekly calories. Compare actual logged data against the goal and print a summary.

## Stretch Goals

- [ ] Add heart rate and sleep tracking integration
- [ ] Implement workout plan generation based on goals
- [ ] Build a social feature for sharing achievements
- [ ] Export workout history to CSV for long-term tracking
- [ ] Add a 1RM calculator using the Epley formula

## What You Learned

- Modeling data with classes and dataclasses
- Aggregating structured data with pandas
- Computing derived properties like training volume and macro ratios
- Building multi-panel charts to track multiple metrics at once
