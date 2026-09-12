---
title: "Build a Meal Planner"
description: "Plan a week of meals from a recipe database, tally daily calories and macros per meal, and generate a combined grocery list automatically."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "data-structures", "csv"]
learningObjectives:
  - "Model a recipe database as a list of dictionaries"
  - "Build a weekly meal plan by slotting one recipe per day"
  - "Sum per-recipe nutrition into daily totals with rolling accumulators"
  - "Derive a consolidated grocery list by merging repeating ingredients"
prerequisites: ["python-101/data-structures", "python-101/reading-files", "python-101/dicts-and-sets"]
---

# 🍽️ Build a Meal Planner

Meal planning looks simple on paper, decide seven dinners, write a grocery list, but the arithmetic is exactly where it falls apart: three recipes share rice, two share chicken, and the calories column quietly goes unchecked. This project builds a CLI that does the bookkeeping: a recipe database, a week-of-meals plan, per-day calorie and macro totals, and a grocery list that merges the shared ingredients into one consolidated summary instead of seven overlapping lists.

This assumes Python 101, lists, dicts, reading files, and functions. Nothing beyond that: no database, no web, no external services. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Store a small recipe database so each recipe has its dish name, servings, ingredients, and nutrition.
2. Plan a week by assigning one recipe per day and printing the plan.
3. Compute each day's total calories and macros from the recipes you chose.
4. Generate one consolidated grocery list that merges shared ingredients instead of repeating them.
5. Load the database from a CSV so you can grow it without editing code.

## Where to run this

**Locally with `uv`** is the primary path here and the only one with a real filesystem payoff: the recipe database lives for real on disk (CSV), and "add a recipe file, rerun, new grocery list" is a genuine loop. The steps below assume a small folder with `uv`.

**GitHub Codespaces** works identically: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and Node, Python, and `uv` are already installed in a real clone of the course repo.

**Google Colab, Kaggle Notebooks, and Binder can *run* every function, and for a pure-data project like this they're genuinely fine**, there are no secrets, no GPU, and no giant files. The only thing that doesn't transfer is "your session's files are ephemeral," which matters mostly if you wanted your personal recipe CSV to survive. The notebook below bundles a starter database so the whole plan → totals → grocery pipeline runs end to end with zero setup. Try it there first, then go local when you have recipes of your own.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meal-planner/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meal-planner/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeal-planner%2Fnotebook.ipynb)

## Setup

Everything you need before planning a single meal: `uv`, and a small recipe database you can extend.

### Install `uv` and scaffold

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then:

```bash
uv --version
mkdir meal-planner && cd meal-planner
uv init --bare
```

No extra packages, this project is pure standard library.

### Create the recipe database

Paste this into `recipes.py` as a starter database (four recipes, each with total calories and macros per serving, plus one ingredient list with a shared item to make the merging in Step 4 visible):

```python
# recipes.py
RECIPES = [
    {"name": "Chicken stir-fry", "servings": 2, "calories": 480, "protein": 38,
     "ingredients": ["chicken breast", "rice", "broccoli", "soy sauce"]},
    {"name": "Veggie curry", "servings": 4, "calories": 410, "protein": 16,
     "ingredients": ["chickpeas", "rice", "coconut milk", "curry powder"]},
    {"name": "Tacos", "servings": 4, "calories": 520, "protein": 24,
     "ingredients": ["ground beef", "tortillas", "lettuce", "salsa"]},
    {"name": "Tofu bowl", "servings": 2, "calories": 450, "protein": 30,
     "ingredients": ["tofu", "rice", "broccoli", "soy sauce"]},
]
```

Run:

```bash
uv run python -c "from recipes import RECIPES; print(len(RECIPES), 'recipes loaded')"
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `recipes.py` exists and `uv run python -c "from recipes import RECIPES; print(len(RECIPES))"` prints `4`.
- ✅ Notice that `rice`, `broccoli`, and `soy sauce` appear in *more than one* recipe, those are the ingredients Step 4 must merge.

## Step 1: Load and inspect the recipe database

"Data" here means a list of dicts, each dict one recipe. Before planning anything, you want a function that *shows* the database, because every later step (totals, merging) will be wrong if two recipes quietly disagree with each other's fields.

### 1.1 Query the database by name

```python
# planner.py
from recipes import RECIPES

def find_recipe(name: str) -> dict:
    matches = [r for r in RECIPES if r["name"].lower() == name.lower()]
    if not matches:
        raise ValueError(f"No recipe named {name!r}")
    return matches[0]

def list_recipes() -> None:
    for r in RECIPES:
        print(f"{r['name']:<18} {r['calories']:>4} kcal  {r['protein']:>3} g protein")

if __name__ == "__main__":
    list_recipes()
    print()
    print(find_recipe("tacos"))
```

`find_recipe` lowers both sides before comparing, so `find_recipe("TACOS")` and `find_recipe("tacos")` hit the same dict, a small but real robustness habit. The lookup is a list comprehension because four recipes don't need a dict index; if the database grew to thousands, the fix would be a dict keyed by name, not a faster comprehension.

**👟 Starter hint:** Run `planner.py` to list all four recipes, then call `find_recipe("tacos")` and inspect the dict that comes back field by field.

**🎯 Expected output:** The four recipes printed as a tidy table (name + calories + protein), then a dict named `Tacos` with all six keys, including `ingredients` as a list.

**🩹 If it's off:** If `ImportError: cannot import name 'RECIPES'`, the file is `recipes.py` but the module name is `recipes`, check you didn't name it `recipe.py`. If `find_recipe("tacos")` raises even though Tacos exists, the `.lower()` on both sides is comparing the right values, add a print statement to confirm the names before you "fix" the working version by deleting the lowercasing bug.

### 1.2 Verify the lookup

**✅ Checklist**

- ✅ `list_recipes()` prints all four recipes with calories and protein.
- ✅ `find_recipe` raises a clear `ValueError` for a name that doesn't exist, and returns the right dict regardless of case.
- ✅ Each recipe dict has the same keys, you can write a one-line check that all four share an identical key set.

**🤔 Socratic Question(s)**

- `find_recipe` returns a reference to the *actual dict* in `RECIPES`, not a copy. If some later code mutated what it returned, what silently corrupts, and is there an argument for returning a copy?
- Four recipes justify a linear scan. At what database size does "rename dict keyed by name" stop being optional, and what does that tell you about when to reach for a structure change versus when brute force is honestly fine?

## Step 2: Build the weekly plan

The plan is the simplest possible model of a week: one dictionary that maps each day to a recipe name. Everything later, totals, grocery list, takes this plan as its *only* input. Keeping the plan data separate from the totals functions is what makes each step independently testable.

### 2.1 Assign a recipe to each day

```python
# planner.py (continued)

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

def build_plan(assignments: dict[str, str]) -> dict[str, dict]:
    plan = {}
    for day, name in assignments.items():
        if day not in DAYS:
            raise ValueError(f"{day!r} is not a day of the week")
        plan[day] = find_recipe(name)
    return plan

if __name__ == "__main__":
    week = build_plan(
        {"Mon": "Chicken stir-fry", "Tue": "Tacos", "Wed": "Veggie curry",
         "Thu": "Tofu bowl", "Fri": "Chicken stir-fry", "Sat": "Tacos", "Sun": "Veggie curry"}
    )
    for day, recipe in week.items():
        print(f"{day}: {recipe['name']}")
```

`build_plan` validates two things before storing: the day is one of the seven known names (a typo like `"monday"` is caught loud), and every recipe resolves through `find_recipe` (so a plan referencing a deleted recipe fails at *planning time*, not at three-steps-later totals time). Mapping day → full recipe dict, rather than day → string, is the decision that lets Step 3 read nutrition off the plan without a second lookup.

**👟 Starter hint:** Keep the plan in a plain `dict[str, str]` for a minute *before* switching to `dict[str, dict]`, run the loop, then make the switch and re-run; feel the difference in what Step 3 will be able to access.

**🎯 Expected output:** Seven lines, `Mon: Chicken stir-fry` through `Sun: Veggie curry`, in day order, with no `KeyError` and all names matching the database.

**🩹 If it's off:** If `ValueError: 'monday' is not a day of the week`, your keys aren't the exact `DAYS` strings, the check is deliberately strict, so either fix the key or (better) let the check keep protecting you. If `find_recipe` raises `No recipe named 'Taco'`, your plan references a name the database doesn't have, the plan-time failure is the fix, not the bug.

### 2.2 Verify the plan

**✅ Checklist**

- ✅ `build_plan` returns a dict with exactly seven keys, one per day, each value a complete recipe dict.
- ✅ An unknown day name raises a `ValueError` instead of silently creating a phantom day.
- ✅ The same recipe name can appear on multiple days, the plan doesn't require seven distinct dishes.
- ✅ Editing the plan to reference a missing recipe fails *at build time*, not at totals time.

**🤔 Socratic Question(s)**

- The plan stores full recipe dicts, so the plan and `RECIPES` can drift apart: if you edit a recipe's calories, *old* plans built before the edit still hold the old dict, and new plans get the new one. Is that a feature or a bug for a meal planner, and which behavior would you want if recipes changed weekly?
- We chose day names as the plan's keys. What breaks if someone wants a plan only for weekdays, and how would `build_plan` change to accept "any iterable of (slot, recipe)"?

## Step 3: Total the day's nutrition

Each recipe's calories and macros are *per serving*; a plan is *meals*, and one meal is usually "the whole recipe" or a stated number of servings. This step is where meal planning becomes useful: not "I picked nice recipes" but "my week comes to 2,180 kcal a day."

### 3.1 Sum per-meal nutrition across a day

```python
# planner.py (continued)

def day_totals(recipes: list[dict]) -> dict:
    total = {"calories": 0, "protein": 0, "meals": 0}
    for r in recipes:
        total["calories"] += r["calories"]
        total["protein"] += r["protein"]
        total["meals"] += 1
    return total

def week_totals(plan: dict[str, dict]) -> dict:
    return {day: day_totals([r]) for day, r in plan.items()}

if __name__ == "__main__":
    week = build_plan(
        {"Mon": "Chicken stir-fry", "Tue": "Tacos", "Wed": "Veggie curry",
         "Thu": "Tofu bowl", "Fri": "Chicken stir-fry", "Sat": "Tacos", "Sun": "Veggie curry"}
    )
    totals = week_totals(week)
    for day, t in totals.items():
        print(f"{day}: {t['calories']:>4} kcal, {t['protein']:>2} g protein")
    daily_mean = sum(t["calories"] for t in totals.values()) / len(totals)
    print(f"daily mean: {daily_mean:.0f} kcal")
```

The accumulator is a plain dict you add into, the "rolling total" pattern, spelled out so the shape is visible (the first time you write it, you *see* that `+=` into a dict entry is legal, and that you must init the key to `0` first). `week_totals` is just `day_totals` applied to a one-recipe list per day, fitting `[r]` is a slightly awkward-looking but honest way to say "this day uses exactly one recipe," and it means `day_totals` can later accept several recipes (a real lunch *and* dinner) with zero changes.

**👟 Starter hint:** Add `day_totals(["a", "b"])` with two recipe dicts *before* building your week, confirm the function sums them correctly on its own, then wire it into `week_totals`.

**🎯 Expected output:** Seven lines of `Mon: 480 kcal, 38 g protein`-style totals, then one `daily mean: ... kcal` line, with our plan, exactly `(480+520+410+450+480+520+410)/7 = 467 kcal` as the mean.

**🩹 If it's off:** If calories silently sum to zero, the `+=` is writing to a key that was never initialized, every key must first appear as `total = {"calories": 0, ...}` before the loop. If the daily mean prints with trailing `.6666`, that's correct float behavior, cast to int or round explicitly when you want to display `467`.

### 3.2 Verify totals

**✅ Checklist**

- ✅ `day_totals` on two recipe dicts returns the arithmetic sum of both recipes, check by hand with two tiny made-up dicts.
- ✅ `week_totals` covers every day in the plan, no more and no fewer.
- ✅ The daily mean matches your hand-computed average of the seven per-day values.
- ✅ Running `day_totals([])` returns the all-zero accumulator, not an error.

**🤔 Socratic Question(s)**

- The per-serving nutrition is treated as "nutrients per whole dish." If a recipe has `servings: 4` and you only eat a quarter, what does our tool overreport by a factor of 4, and what's the one multiplication that fixes it?
- `day_totals` takes a *list* of recipes. What change to the plan's data model would let one day hold breakfast, lunch, and dinner, and what's the minimal rewrite of `week_totals` that supports it?

## Step 4: Merge ingredients into one grocery list

Planning and totals are bookkeeping; the grocery list is the payoff. A naive list "chicken stir-fry needs rice, tacos need rice, curry needs rice" hands you three bags of rice. Merging shared ingredients by name, summing how many recipes need them, turns that into one honest entry.

### 4.1 Count ingredient mentions across the week

```python
# planner.py (continued)

def grocery_list(week: dict[str, dict]) -> dict[str, int]:
    needed = {}
    for recipe in week.values():
        for ingredient in recipe["ingredients"]:
            needed[ingredient] = needed.get(ingredient, 0) + 1
    return dict(sorted(needed.items()))

if __name__ == "__main__":
    week = build_plan(
        {"Mon": "Chicken stir-fry", "Tue": "Tacos", "Wed": "Veggie curry",
         "Thu": "Tofu bowl", "Fri": "Chicken stir-fry", "Sat": "Tacos", "Sun": "Veggie curry"}
    )
    for ingredient, count in grocery_list(week).items():
        print(f"{ingredient:<14} x{count}")
```

`needed.get(ingredient, 0) + 1` is the standard "count occurrences with a dict" idiom, the `.get(key, 0)` returns the running total so far, defaulting to 0 on first sight, then one is added. Notice `rice` should now show `x3` (stir-fry, curry, tofu bowl): the merge is the whole feature, and a sorted final pass makes the list scannable regardless of plan order.

**👟 Starter hint:** Run the merge, then *manually* count `rice` across the plan and confirm your hand-count matches the `x3` the function printed, that stalemate is your "it works" moment.

**🎯 Expected output:** A sorted list where `rice x3`, `broccoli x2`, and `soy sauce x2` appear once each, not repeated per recipe, and single-use items like `tortillas x1` are still there.

**🩹 If it's off:** If `rice x1` shows up three times because a dict can't have duplicate keys, you're appending to a *list* instead of counting into a *dict*, the merge *is* the dict. If the count is wrong but keys are unique, check the `+1` is inside the `needed[ingredient] = ...` assignment and the `.get(..., 0)` default is spelled `0`, not `None` (which would crash on `None + 1`).

### 4.2 Verify the merge

**✅ Checklist**

- ✅ Shared ingredients (`rice`, `broccoli`, `soy sauce`) appear exactly once, with counts matching your hand-count of the plan.
- ✅ Every ingredient used by any recipe appears in the final list, nothing dropped.
- ✅ The output is sorted alphabetically regardless of the order recipes appear in the plan.

**🤔 Socratic Question(s)**

- This merge counts *how many recipes* need rice, not *how much* rice a grocery store should stock (that depends on servings and portions per person). What would a `grocery_stock(week, portion_per_person)` function need, per ingredient, that the current dict of `name -> count` can't answer, and what shape would the data need to be in?
- Two ingredients are the *same grocery item* under different names ("chicken breast" vs "chicken thighs") and the merge happily treats them separately. Should the tool merge them? What's the simplest data change (hint: a canonical name per ingredient) that lets it, and what problem does that introduce elsewhere?

## Step 5: Load recipes from CSV

Four recipes hardcoded into `recipes.py` was fine for learning; a real planner grows. Step 5 swaps the `RECIPES` literal for a CSV on disk, the same skill as "read a CSV," but applied to make the database a *file you can edit without touching code*.

### 5.1 Read the database from CSV

Create `recipes.csv`:

```csv
name,servings,calories,protein,ingredients
Chicken stir-fry,2,480,38,"chicken breast, rice, broccoli, soy sauce"
Veggie curry,4,410,16,"chickpeas, rice, coconut milk, curry powder"
Tacos,4,520,24,"ground beef, tortillas, lettuce, salsa"
Tofu bowl,2,450,30,"tofu, rice, broccoli, soy sauce"
```

```python
# csv_loader.py
import csv
from recipes_data import RECIPES  # same dict structure, now built by load_recipes_csv

def load_recipes_csv(path: str) -> list[dict]:
    recipes = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            recipes.append({
                "name": row["name"],
                "servings": int(row["servings"]),
                "calories": int(row["calories"]),
                "protein": int(row["protein"]),
                "ingredients": [i.strip() for i in row["ingredients"].split(",")],
            })
    return recipes
```

Two conversions make this cell different from "just read a file": numeric columns are cast with `int(...)` (the CSV reader returns *strings* by design, forgetting this produces `'480'` instead of `480` and a silent error in Step 3's arithmetic), and the single ingredients *string* becomes a list by splitting on commas and stripping spaces. The recipe dict now has exactly the shape the earlier steps expect, the loader is a drop-in replacement for the hardcoded `RECIPES`, which is the whole point of keeping a stable schema.

**👟 Starter hint:** Write the CSV, run `load_recipes_csv`, then *replace* `from recipes import RECIPES` in `planner.py` with `import csv_loader as recipes` and re-run `list_recipes`, identical output, new source of truth.

**🎯 Expected output:** `load_recipes_csv("recipes.csv")` returns four dicts identical to the hardcoded ones, and `planner.py`'s `list_recipes()` prints the same table as before, now sourced from the file.

**🩹 If it's off:** If totals print like `480 38` but the scanner shows strings, the `int(...)` casts were skipped, every numeric column needs them. If ingredients come out as one long string, `split(",")` wasn't applied or your CSV rows aren't quoting the ingredients column (unquoted commas split the *row*, so `csv` breaks the row at every comma). If `KeyError: 'name'`, your header row has a different first column name than `row["name"]` expects, print `row` from `DictReader` to see the real keys.

### 5.2 Verify the CSV loader

**✅ Checklist**

- ✅ `load_recipes_csv` returns recipes whose numeric fields are `int`, not `str`.
- ✅ Each dict's `ingredients` is a real list, with no stray leading/trailing spaces.
- ✅ Deleting a CSV row removes that recipe from `list_recipes()` on the *next* run, a file edit, not a code edit.
- ✅ Adding a new row with the same five columns loads without touching any Python.

**🤔 Socratic Question(s)**

- CSV gives you a database you can edit by hand. What does it *not* give you that a real database (or even a JSON file) would, think about quoting, escaping, and what happens when an ingredient itself contains a comma?
- `csv.DictReader` used the header row for keys. If the header changed to `dish` instead of `name`, every `row["name"]` breaks. Is that resistance good (schema honesty) or bad (fragile coupling)? What would make the loader fail *loud* instead of failing *wrong*?

## ⚠️ Common pitfalls

- **Forgetting the `int()` casts from CSV.** `csv` returns strings; `calories: "480"` summed against `protein: "38"` might not even raise, it can concatenate or quietly do string arithmetic, while a later `"480" * 4` lives in a world where everything is text. Always cast numeric fields at load time, in one place, and trust everything downstream.
- **Treating the recipe dict as its own authority.** `find_recipe` returning a live reference means one accidental mutation corrupts the whole database for every later step. Either return copies or, stricter, make the recipes `MappingProxyType`-read-only and design so the plan never needs to write.
- **One item per recipe in the grocery list.** The "merge by ingredient name" feature is exactly what separates a planner from a post-it note; a plan that produces three `rice` lines hasn't finished. If your merge output shows duplicates, you're counting into a list, not a dict (see Step 4's fix).
- **Per-serving math ignored.** A recipe is `servings: 4`; the plan treats meals as whole recipes. Decisions like "eat half the curry" need an explicit serving count per plan entry, build the slot in the plan model *before* you need it, or accept whole-dish totals as the documented default.
- **Ingredient name drift.** `"rice"` in four recipes is a delight to merge; `"rice "`, `"Rice"`, and `"basmati rice"` are three separate items. The real fix is a canonical ingredient list each recipe references (a foreign key, even in a CSV), and a normalization step at load time (strip + lowercase) as the cheap version.

## What you just built

A working meal planner: a four-recipe database, a seven-day plan, per-day calorie and protein totals, and a merged grocery list where `rice x3` means *one* honest shopping line. The transferable skill is the whole "plan → derive → report" pipeline: you keep one small source of truth (recipes), make a decision (the week), and compute every output (totals, grocery list) from those two, nothing stale, nothing hand-maintained. That same shape runs meal prep, budgets, rosters, and pretty much any "repeatable inputs, derived report" task you'll meet.

:::tip[Run a fuller version without any local setup]
[`examples/meal-planner/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meal-planner) in the course repo bundles the databases and a notebook that runs build → totals → grocery list cell by cell. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run the pipeline in a browser tab.
:::

## Where to go from here

- Add servings awareness: a plan entry like `("Veggie curry", 2)` that scales the ingredients and halves-or-doubles the nutrition, the one multiplication from Step 3.3 made real.
- Track shopping cost: give each ingredient a price-per-unit, and print a total for the week, a second derivation hanging off the same data.
- Add a random-week feature: `plan --random` picks seven recipes (no repetition, or deliberately weekday-homogenized) and prints the derived plan instantly.
- Port the database to JSON instead of CSV, `json.load` keeps numbers typed for free and handles comma-bearing ingredients without quoting headaches, and it's a five-minute swap now that the loader already has a stable schema.

## Share your project with the class

Built something you're proud of, a week plan, a grocery list, a recipe database you actually cook from? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓