---

title: "أساسيات GroupBy"
description: "قسّم البيانات إلى مجموعات واحسب الملخصات باستخدام نمط التقسيم-والتطبيق-والدمج مع groupby()."
module: "groupby-aggregation"
order: 7
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "فهم نمط التقسيم-والتطبيق-والدمج"
  - "تجميع البيانات حسب عمود واحد أو أكثر باستخدام groupby()"
  - "تطبيق عمليات التجميع مثل mean() و sum() و count() و describe()"
  - "استخدام agg() لعمليات تجميع متعددة دفعة واحدة"
prerequisites: ["data-cleaning"]
tags: ["pandas", "groupby", "aggregation", "split-apply-combine"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "ماذا يفعل df.groupby('col')؟"
    options:
      - text: "يرتب إطار البيانات"
      - text: "يجمع الصفوف حسب القيم الفريدة في العمود"
        correct: true
      - text: "يزيل التكرارات"
      - text: "ينشئ عمودًا جديدًا"
  - question: "كيف تحسب متوسط كل مجموعة؟"
    options:
      - text: "df.groupby('col').mean()"
        correct: true
      - text: "df.mean().groupby('col')"
      - text: "df.group('col').average()"
      - text: "df.groupby('col').sum() / df.groupby('col').count()"
  - question: "ماذا يُرجع df.groupby('col').size()؟"
    options:
      - text: "إجمالي عدد الصفوف"
      - text: "عدد الصفوف لكل مجموعة"
        correct: true
      - text: "حجم الذاكرة لكل مجموعة"
      - text: "عدد الأعمدة"
---

## نمط التقسيم-والتطبيق-والدمج

يعتبر GroupBy أحد أقوى ميزات pandas. يتبع نمطًا من ثلاث خطوات:

1. **التقسيم** ، قسّم إطار البيانات إلى مجموعات بناءً على عمود واحد أو أكثر
2. **التطبيق** ، احسب دالة على كل مجموعة بشكل مستقل
3. **الدمج** ، ادمج النتائج مرة أخرى في إطار بيانات واحد

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## التجميع حسب عمود واحد

```python
# Average survival rate by passenger class
print(df.groupby("Pclass")["Survived"].mean())
```

المخرجات:

```
Pclass
1    0.629630
2    0.472826
3    0.242363
Name: Survived, dtype: float64
```

كان معدل نجاة ركاب الدرجة الأولى 63%، مقارنة بـ 24% للدرجة الثالثة. كشف groupby عن فجوة طبقية صارخة في ثوانٍ.

**ما يحدث خطوة بخطوة:**

```python
# This is conceptually what groupby does:
for pclass, group_df in df.groupby("Pclass"):
    print(f"Class {pclass}: {group_df['Survived'].mean():.3f}")
```

## التجميع حسب أعمدة متعددة

```python
# Survival rate by class and sex
print(df.groupby(["Pclass", "Sex"])["Survived"].mean())
```

المخرجات:

```
Pclass  Sex   
1       female    0.968085
        male      0.368852
2       female    0.921053
        male      0.157407
3       female    0.500000
        male      0.135447
Name: Survived, dtype: float64
```

استخدم `unstack()` لجعل هذا أسهل قراءة:

```python
print(df.groupby(["Pclass", "Sex"])["Survived"].mean().unstack())
```

## أساليب التجميع

يدعم GroupBy جميع عمليات التجميع القياسية:

```python
# Mean fare by class
print(df.groupby("Pclass")["Fare"].mean())

# Total fare collected per class
print(df.groupby("Pclass")["Fare"].sum())

# Count of passengers per class
print(df.groupby("Pclass")["PassengerId"].count())
```

## عمليات تجميع متعددة باستخدام agg()

تطبق طريقة `agg()` دوال متعددة دفعة واحدة:

```python
print(df.groupby("Pclass")["Fare"].agg(["mean", "median", "min", "max", "count"]))
```

المخرجات:

```
              mean  median     min       max  count
Pclass                                             
1        84.154687  60.287  0.0000  512.3292    216
2        20.662183  19.575  0.0000   73.5000    184
3        13.675550   8.050  0.0000   56.4958    491
```

**عمليات تجميع مختلفة لكل عمود:**

```python
print(df.groupby("Pclass").agg({
    "Survived": "mean",
    "Fare": ["mean", "max"],
    "Age": "median",
    "Name": "count"
}))
```

## تجميع جميع الأعمدة الرقمية

```python
# Quick summary of all numeric columns per group
print(df.groupby("Pclass").mean(numeric_only=True))
```

## GroupBy مع الفلاتر

بعد التجميع، يمكنك تصفية مجموعات كاملة:

```python
# Keep only groups with more than 50 passengers
large_groups = df.groupby("Pclass").filter(lambda x: len(x) > 50)
print(large_groups["Pclass"].value_counts())
```

## جرّب بنفسك

باستخدام مجموعة بيانات تيتانيك، احسب:
1. متوسط الأجرة لكل ميناء إقلاع
2. معدل النجاة لكل توليفة من الجنس وميناء الإقلاع
3. إحصاءات العمر (المتوسط والوسيط والأدنى والأقصى) لكل درجة ركاب

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

print("Average fare by port:")
print(df.groupby("Embarked")["Fare"].mean())

print("\nSurvival by sex and port:")
print(df.groupby(["Sex", "Embarked"])["Survived"].mean().unstack())

print("\nAge stats by class:")
print(df.groupby("Pclass")["Age"].agg(["mean", "median", "min", "max"]))
```

## خلاصات رئيسية

- يتبع GroupBy نمط التقسيم-والتطبيق-والدمج: قسّم البيانات، طبق دالة، ادمج النتائج
- جمّع بعمود واحد للملخصات البسيطة، وبأعمدة متعددة لتحليل أعمق
- يتيح لك `agg()` حساب إحصاءات متعددة مرة واحدة، لكل عمود إذا لزم الأمر
- يكشف GroupBy أنماطًا غير مرئية في البيانات الخام

## تحدي التطبيق

من مجموعة بيانات تيتانيك، احسب معدل النجاة لكل توليفة من Pclass و Sex وما إذا كان الراكب يسافر بمفرده (SibSp + Parch == 0). أي مجموعة حققت أعلى معدل نجاة؟ وأيها الأدنى؟
