---
title: "Gradebook"
description: "Manage student grades with weighted GPA calculation, class statistics, and report cards."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["pandas", "csv", "classes", "statistics"]
prerequisites: ["Python basics (variables, loops, functions, dictionaries)", "Basic pandas (DataFrames, groupby)"]
---

# Gradebook

Every teacher needs a way to track student performance, calculate weighted averages, and turn raw scores into meaningful report cards. In this project, you'll build a complete gradebook system in Python that handles student records, weighted GPA calculation, class statistics, CSV persistence, and even basic visualization. You'll practice using classes to model real-world entities, pandas for data manipulation, and statistics for analysis.

## What You'll Learn

1. **Data modeling with classes** — Represent students, grades, and categories as objects with clear responsibilities
2. **Weighted average calculation** — Compute GPAs that respect assignment category weights
3. **Statistical analysis** — Find class averages, medians, and grade distributions
4. **CSV persistence** — Save and load gradebook data so it survives between sessions
5. **Visualization** — Generate bar charts for grade distributions using matplotlib

## What You'll Build

A command-line gradebook application that lets you add students, record grades across categories (homework, quizzes, exams), calculate weighted GPAs, generate formatted report cards, save everything to CSV, and visualize grade distributions with charts.

## Setup

```bash
mkdir gradebook && cd gradebook
pip install pandas matplotlib
touch gradebook.py
```

## Step 1: Define the Data Model

The foundation of any gradebook is its data model. We need to represent three core concepts:

- **Student** — a person with a name and a collection of grades
- **Grade** — a single score tied to a category and weight
- **Category** — a named grouping (like "homework" or "exam") with a weight toward the final grade

Using classes keeps this organized and makes each piece easy to test and extend.

### 1.1 Create the Grade class

**👟 Starter hint:** Create a `Grade` class with `category`, `score`, and `weight` attributes.

```python
class Grade:
    def __init__(self, category, score, weight):
        self.category = category
        self.score = score
        self.weight = weight

    def __repr__(self):
        return f"Grade(category='{self.category}', score={self.score}, weight={self.weight})"
```

**🎯 Expected output:**

```python
>>> g = Grade("homework", 95, 0.3)
>>> g
Grade(category='homework', score=95, weight=0.3)
>>> g.score
95
```

**🩹 If it's off:**
- Make sure `weight` is a decimal (0.3 for 30%), not a percentage (30)
- The `__repr__` method uses single quotes inside the f-string — make sure they match

### 1.2 Create the Student class

**👟 Starter hint:** The `Student` class stores a name and an empty list of grades. Add a method to add grades and another to list them.

```python
class Student:
    def __init__(self, name):
        self.name = name
        self.grades = []

    def add_grade(self, category, score, weight):
        grade = Grade(category, score, weight)
        self.grades.append(grade)

    def __repr__(self):
        return f"Student(name='{self.name}', grades={len(self.grades)})"
```

**🎯 Expected output:**

```python
>>> s = Student("Alice")
>>> s.add_grade("homework", 92, 0.3)
>>> s.add_grade("exam", 88, 0.7)
>>> s
Student(name='Alice', grades=2)
>>> s.grades
[Grade(category='homework', score=92, weight=0.3), Grade(category='exam', score=88, weight=0.7)]
```

**🩹 If it's off:**
- The `add_grade` method should create a new `Grade` object and append it to `self.grades`
- Don't forget `self.grades = []` in `__init__` — without it, all students would share the same list

**✅ Checklist**
- ✅ `Grade` stores category, score, and weight
- ✅ `Student` stores a name and list of grades
- ✅ `add_grade` creates a `Grade` and adds it to the student's list
- ✅ Both classes have `__repr__` methods

**🤔 Socratic Question(s)**
- Why store grades as a list on the student rather than as a dictionary keyed by category?

---

## Step 2: Add Grades

Now that we have the data model, let's build a system to actually enter grades. We'll create a `Gradebook` class that holds all students and provides methods to add students and grades.

### 2.1 Create the Gradebook class

**👟 Starter hint:** The `Gradebook` class holds a dictionary mapping student names to `Student` objects.

```python
class Gradebook:
    def __init__(self, name):
        self.name = name
        self.students = {}

    def add_student(self, name):
        if name in self.students:
            print(f"Student '{name}' already exists.")
            return self.students[name]
        student = Student(name)
        self.students[name] = student
        return student

    def get_student(self, name):
        if name not in self.students:
            print(f"Student '{name}' not found.")
            return None
        return self.students[name]

    def add_grade(self, student_name, category, score, weight):
        student = self.get_student(student_name)
        if student:
            student.add_grade(category, score, weight)

    def __repr__(self):
        return f"Gradebook(name='{self.name}', students={len(self.students)})"
```

**🎯 Expected output:**

```python
>>> gb = Gradebook("CS101 Fall 2025")
>>> gb.add_student("Alice")
Student(name='Alice', grades=0)
>>> gb.add_grade("Alice", "homework", 95, 0.3)
>>> gb.add_grade("Alice", "exam", 87, 0.7)
>>> gb.add_grade("Alice", "homework", 88, 0.3)
>>> gb.add_student("Bob")
Student(name='Bob', grades=0)
>>> gb.add_grade("Bob", "homework", 78, 0.3)
>>> gb.add_grade("Bob", "exam", 92, 0.7)
>>> gb
Gradebook(name='CS101 Fall 2025', students=2)
```

**🩹 If it's off:**
- `get_student` should print a message and return `None` when the student doesn't exist
- Make sure `add_student` checks for duplicates before creating a new student

**✅ Checklist**
- ✅ `Gradebook` stores students in a dictionary keyed by name
- ✅ `add_student` creates a student and handles duplicates
- ✅ `get_student` retrieves a student or prints a not-found message
- ✅ `add_grade` adds a grade to a specific student by name

**🤔 Socratic Question(s)**
- What would change if students could have the same name? How would you handle that?

---

## Step 3: Calculate GPA

The core feature of any gradebook is GPA calculation. A weighted GPA multiplies each score by its weight, sums those products, and divides by the total weight. This ensures exams count more than homework when they have higher weights.

### 3.1 Weighted average for a single student

**👟 Starter hint:** Iterate over a student's grades, multiply each score by its weight, sum them, and divide by the total weight.

```python
def weighted_average(grades):
    if not grades:
        return 0.0
    total_weighted = sum(g.score * g.weight for g in grades)
    total_weight = sum(g.weight for g in grades)
    if total_weight == 0:
        return 0.0
    return round(total_weighted / total_weight, 2)

# Add this method to the Student class:
# def gpa(self):
#     return weighted_average(self.grades)
```

**🎯 Expected output:**

```python
>>> alice = gb.get_student("Alice")
>>> alice.grades
[Grade(category='homework', score=95, weight=0.3), Grade(category='exam', score=87, weight=0.7), Grade(category='homework', score=88, weight=0.3)]
>>> weighted_average(alice.grades)
90.54
```

**🩹 If it's off:**
- Check that you're using `g.weight` not `g.score` as the divisor
- Make sure you handle the empty list case — divide-by-zero will crash the program
- The total weight here is 1.3 (0.3 + 0.7 + 0.3), not 1.0 — that's correct because homework appeared twice

### 3.2 Cumulative GPA across all students

**👟 Starter hint:** Add a method to `Gradebook` that averages all students' GPAs together.

```python
# Add this method to the Gradebook class:
def class_average(self):
    if not self.students:
        return 0.0
    averages = [weighted_average(s.grades) for s in self.students.values() if s.grades]
    if not averages:
        return 0.0
    return round(sum(averages) / len(averages), 2)
```

**🎯 Expected output:**

```python
>>> gb.class_average()
87.07
```

**🩹 If it's off:**
- Filter out students with no grades — an empty grade list should not count toward the average
- The class average is the average of student averages, not the average of all individual grades

**✅ Checklist**
- ✅ `weighted_average` handles empty grade lists gracefully
- ✅ Each score is multiplied by its weight before summing
- ✅ `class_average` returns the mean of all student GPAs
- ✅ Results are rounded to 2 decimal places

**🤔 Socratic Question(s)**
- If two homework assignments both have weight 0.3, should they each count 30% or should homework collectively count 30%? How would you redesign the model to handle both approaches?

---

## Step 4: Class Statistics

Raw GPA numbers are useful, but teachers also need to see the bigger picture: how is the class performing overall? What's the median score? How many students are getting A's versus F's?

### 4.1 Letter grade conversion

**👟 Starter hint:** Write a function that maps a numeric score to a letter grade using standard cutoffs.

```python
def letter_grade(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"
```

**🎯 Expected output:**

```python
>>> letter_grade(95)
'A'
>>> letter_grade(82)
'B'
>>> letter_grade(55)
'F'
```

### 4.2 Class statistics method

**👟 Starter hint:** Add a method to `Gradebook` that computes average, median, min, max, and grade distribution.

```python
import statistics

# Add this method to the Gradebook class:
def class_stats(self):
    student_averages = [
        weighted_average(s.grades)
        for s in self.students.values()
        if s.grades
    ]
    if not student_averages:
        return {"average": 0, "median": 0, "min": 0, "max": 0, "distribution": {}}

    dist = {}
    for avg in student_averages:
        lg = letter_grade(avg)
        dist[lg] = dist.get(lg, 0) + 1

    return {
        "average": round(statistics.mean(student_averages), 2),
        "median": round(statistics.median(student_averages), 2),
        "min": round(min(student_averages), 2),
        "max": round(max(student_averages), 2),
        "distribution": dist,
    }
```

**🎯 Expected output:**

```python
>>> stats = gb.class_stats()
>>> stats
{'average': 87.07, 'median': 87.07, 'min': 81.31, 'max': 92.83, 'distribution': {'A': 1, 'B': 1}}
```

**🩹 If it's off:**
- Make sure you import `statistics` at the top of the file
- The distribution counts letter grades based on each student's weighted average, not individual grades
- Use `dist.get(lg, 0) + 1` to handle the first occurrence of each letter grade

**✅ Checklist**
- ✅ `letter_grade` maps scores to A/B/C/D/F
- ✅ `class_stats` returns average, median, min, max, and distribution
- ✅ Empty grade lists are filtered out before computing statistics
- ✅ Grade distribution is a dictionary mapping letters to counts

**🤔 Socratic Question(s)**
- The median is 87.07 in this example. What does that tell you about the class that the average alone doesn't?

---

## Step 5: Generate Reports

A gradebook isn't useful unless you can present the information clearly. Let's build formatted report cards that show each student's grades, weighted average, and letter grade.

### 5.1 Individual student report

**👟 Starter hint:** Build a method that returns a formatted string showing all grades and the final average for one student.

```python
# Add this method to the Student class:
def report_card(self):
    lines = [f"Report Card: {self.name}", "=" * 40]
    if not self.grades:
        lines.append("No grades recorded.")
        return "\n".join(lines)

    by_category = {}
    for g in self.grades:
        by_category.setdefault(g.category, []).append(g)

    for cat, grades in sorted(by_category.items()):
        avg = weighted_average(grades)
        lines.append(f"  {cat.title():12s}  avg: {avg:.1f}  ({len(grades)} grades)")

    overall = weighted_average(self.grades)
    lines.append("-" * 40)
    lines.append(f"  Overall GPA: {overall:.2f} ({letter_grade(overall)})")
    return "\n".join(lines)
```

**🎯 Expected output:**

```python
>>> print(alice.report_card())
Report Card: Alice
========================================
  Exam         avg: 87.0  (1 grades)
  Homework     avg: 91.5  (2 grades)
----------------------------------------
  Overall GPA: 90.54 (A)
```

**🩹 If it's off:**
- Use `.title()` on category names so "homework" becomes "Homework"
- The overall GPA is the weighted average across all grades, not a simple mean of category averages

### 5.2 Full class report

**👟 Starter hint:** Add a method to `Gradebook` that prints every student's report card.

```python
# Add this method to the Gradebook class:
def full_report(self):
    print(f"\n{'=' * 50}")
    print(f"  {self.name} — Full Report")
    print(f"{'=' * 50}\n")
    for name in sorted(self.students):
        student = self.students[name]
        if student.grades:
            print(student.report_card())
            print()
    stats = self.class_stats()
    print(f"{'=' * 50}")
    print(f"  Class Statistics")
    print(f"{'=' * 50}")
    print(f"  Average: {stats['average']}")
    print(f"  Median:  {stats['median']}")
    print(f"  Min:     {stats['min']}")
    print(f"  Max:     {stats['max']}")
    print(f"  Distribution: {stats['distribution']}")
    print()
```

**🎯 Expected output:**

```
==================================================
  CS101 Fall 2025 — Full Report
==================================================

Report Card: Alice
========================================
  Exam         avg: 87.0  (1 grades)
  Homework     avg: 91.5  (2 grades)
----------------------------------------
  Overall GPA: 90.54 (A)

Report Card: Bob
========================================
  Exam         avg: 92.0  (1 grades)
  Homework     avg: 78.0  (1 grades)
----------------------------------------
  Overall GPA: 81.31 (B)

==================================================
  Class Statistics
==================================================
  Average: 87.07
  Median:  87.07
  Min:     81.31
  Max:     92.83
  Distribution: {'A': 1, 'B': 1}
```

**🩹 If it's off:**
- Sort students alphabetically by name before printing
- Skip students with no grades in the per-student section
- Make sure the statistics section appears at the bottom

**✅ Checklist**
- ✅ `report_card` shows grades grouped by category
- ✅ `full_report` prints all students and class statistics
- ✅ Category averages are displayed alongside overall GPA
- ✅ Output is neatly formatted with separators

**🤔 Socratic Question(s)**
- How would you modify the report to show each individual assignment score instead of just the category average?

---

## Step 6: Save and Load

A gradebook that loses all data when you close the program isn't very useful. Let's add CSV persistence so data survives between sessions. We'll save each grade as a row with the student name, category, score, and weight.

### 6.1 Save to CSV

**👟 Starter hint:** Iterate over all students and their grades, writing each as a CSV row.

```python
import csv

# Add this method to the Gradebook class:
def save(self, filename):
    with open(filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["student", "category", "score", "weight"])
        for name in sorted(self.students):
            student = self.students[name]
            for grade in student.grades:
                writer.writerow([
                    student.name,
                    grade.category,
                    grade.score,
                    grade.weight,
                ])
    print(f"Saved {len(self.students)} students to {filename}")
```

**🎯 Expected output:**

```python
>>> gb.save("grades.csv")
Saved 2 students to grades.csv
```

The CSV file will contain:

```
student,category,score,weight
Alice,homework,95,0.3
Alice,exam,87,0.7
Alice,homework,88,0.3
Bob,homework,78,0.3
Bob,exam,92,0.7
```

### 6.2 Load from CSV

**👟 Starter hint:** Read the CSV file and reconstruct students and grades. Handle the case where the file doesn't exist.

```python
# Add this class method to the Gradebook class:
@classmethod
def load(cls, filename):
    gb = cls(filename.replace(".csv", ""))
    try:
        with open(filename, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                gb.add_student(row["student"])
                gb.add_grade(
                    row["student"],
                    row["category"],
                    float(row["score"]),
                    float(row["weight"]),
                )
    except FileNotFoundError:
        print(f"File '{filename}' not found. Starting with empty gradebook.")
    return gb
```

**🎯 Expected output:**

```python
>>> loaded = Gradebook.load("grades.csv")
>>> loaded.class_average()
87.07
>>> len(loaded.students)
2
```

**🩹 If it's off:**
- Use `csv.DictReader` so you can access columns by name (`row["student"]`) rather than by index
- Convert `score` and `weight` to `float` — CSV reads everything as strings
- Use a `@classmethod` so you can call `Gradebook.load(...)` without having an existing instance

**✅ Checklist**
- ✅ `save` writes a header row plus one row per grade
- ✅ `load` uses `DictReader` and reconstructs the full gradebook
- ✅ Missing files are handled gracefully with a message
- ✅ Numeric values are converted from strings to floats

**🤔 Socratic Question(s)**
- What happens if you save a gradebook, edit the CSV by hand with an invalid score, and then load it? How would you add validation?

---

## Step 7: Visualize Results

Numbers in a terminal are fine, but a chart makes grade distributions immediately clear. We'll use matplotlib to create a bar chart showing how many students earned each letter grade.

### 7.1 Bar chart of grade distribution

**👟 Starter hint:** Use the distribution dictionary from `class_stats` and pass it to `plt.bar`.

```python
import matplotlib.pyplot as plt

# Add this method to the Gradebook class:
def plot_distribution(self):
    stats = self.class_stats()
    dist = stats["distribution"]
    if not dist:
        print("No data to plot.")
        return

    grades_order = ["A", "B", "C", "D", "F"]
    counts = [dist.get(g, 0) for g in grades_order]
    colors = ["#2ecc71", "#3498db", "#f1c40f", "#e67e22", "#e74c3c"]

    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(grades_order, counts, color=colors, edgecolor="white", linewidth=1.2)

    for bar, count in zip(bars, counts):
        if count > 0:
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.1,
                str(count),
                ha="center",
                va="bottom",
                fontweight="bold",
                fontsize=12,
            )

    ax.set_title(f"{self.name} — Grade Distribution", fontsize=14, fontweight="bold")
    ax.set_xlabel("Letter Grade")
    ax.set_ylabel("Number of Students")
    ax.set_ylim(0, max(counts) + 1)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    plt.savefig("grade_distribution.png", dpi=150)
    plt.show()
    print("Chart saved as grade_distribution.png")
```

**🎯 Expected output:**

A bar chart window will appear showing:

```
Number of Students
  2 |
  1 |        ■
    |     ■     ■
  0 +--+--+--+--+--
       A  B  C  D  F
     Letter Grade
```

The chart will also be saved as `grade_distribution.png`.

**🩹 If it's off:**
- Make sure you have `matplotlib` installed (`pip install matplotlib`)
- If no chart appears, try `plt.show()` in a separate terminal or use `plt.savefig` only
- The `tight_layout()` call prevents labels from being cut off

### 7.2 Student GPA comparison chart

**👟 Starter hint:** Create a horizontal bar chart comparing all students' GPAs.

```python
# Add this method to the Gradebook class:
def plot_student_comparison(self):
    names = []
    averages = []
    for name in sorted(self.students):
        student = self.students[name]
        if student.grades:
            names.append(name)
            averages.append(weighted_average(student.grades))

    if not names:
        print("No data to plot.")
        return

    fig, ax = plt.subplots(figsize=(8, max(3, len(names) * 0.6)))
    colors = ["#2ecc71" if avg >= 90 else "#3498db" if avg >= 80 else "#f1c40f" if avg >= 70 else "#e74c3c" for avg in averages]
    bars = ax.barh(names, averages, color=colors, edgecolor="white", height=0.5)

    for bar, avg in zip(bars, averages):
        ax.text(
            bar.get_width() + 0.5,
            bar.get_y() + bar.get_height() / 2,
            f"{avg:.1f} ({letter_grade(avg)})",
            va="center",
            fontsize=10,
        )

    ax.set_title(f"{self.name} — Student GPAs", fontsize=14, fontweight="bold")
    ax.set_xlabel("Weighted Average")
    ax.set_xlim(0, 100)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    plt.savefig("student_comparison.png", dpi=150)
    plt.show()
    print("Chart saved as student_comparison.png")
```

**🎯 Expected output:**

A horizontal bar chart showing each student's GPA with color coding (green for A, blue for B, yellow for C, red for below C).

**🩹 If it's off:**
- If bars are too thin, increase the `height` parameter in `barh`
- Colors are determined by GPA range — check the conditional list comprehension
- If names overlap, increase the figure height based on the number of students

**✅ Checklist**
- ✅ `plot_distribution` creates a bar chart of letter grade counts
- ✅ `plot_student_comparison` creates a horizontal bar chart of student GPAs
- ✅ Charts are saved as PNG files
- ✅ Empty data is handled gracefully

**🤔 Socratic Question(s)**
- How would you add a reference line at the class average to make it easier to see who's above or below average?

---

## 🧩 Challenges

Ready to push further? Try these:

1. **Weight validation** — Make sure category weights sum to 1.0 for each student. If they don't, warn the user and list the total.

2. **Category weights configuration** — Allow the teacher to define default category weights (e.g., homework = 30%, exam = 70%) so they don't have to specify the weight every time they add a grade.

3. **Export to HTML** — Generate a printable HTML report card with styled tables and colors for letter grades. Use Python's string formatting to build the HTML, then open it in a browser with `webbrowser.open`.

---

## What You Learned

- **Class-based data modeling** — Represented students, grades, and the gradebook itself as Python classes with clear methods
- **Weighted averages** — Calculated GPAs that respect category weights, handling edge cases like empty grade lists
- **Statistical analysis** — Used Python's `statistics` module for mean and median, and built a custom grade distribution counter
- **CSV persistence** — Saved and loaded gradebook data using `csv.DictReader` and `csv.writer`
- **Data visualization** — Created bar charts with matplotlib for grade distributions and student comparisons
- **Report generation** — Built formatted text report cards with grouped grades and summary statistics

You now have a fully functional gradebook that you can extend with features like email notifications, curve management, or a web interface. The class-based architecture makes each piece easy to test, modify, and reuse.
