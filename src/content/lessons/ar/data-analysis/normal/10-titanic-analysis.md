---

title: "تحليل EDA لبيانات تيتانيك"
description: "نظّف بيانات تيتانيك وحلل أنماط النجاة باستخدام groupby واستخلص استنتاجات قابلة للتنفيذ من استكشافك."
module: "titanic-eda"
order: 10
difficulty: "intermediate"
estimatedMinutes: 30
learningObjectives:
  - "تنظيف مجموعة بيانات تيتانيك بمعالجة القيم المفقودة وحذف الأعمدة عديمة الفائدة"
  - "تحليل معدلات النجاة حسب درجة الركاب والجنس والفئة العمرية"
  - "إنشاء جداول ملخصية باستخدام groupby والتجميع"
  - "استخلاص استنتاجات مبنية على البيانات من التحليل الاستكشافي"
prerequisites: ["titanic-loading"]
tags: ["pandas", "eda", "titanic", "analysis", "conclusions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "ما النسبة المئوية لركاب تيتانيك الذين نجوا؟"
    options:
      - text: "حوالي 25%"
      - text: "حوالي 38%"
        correct: true
      - text: "حوالي 50%"
      - text: "حوالي 75%"
  - question: "أي درجة حققت أعلى معدل نجاة؟"
    options:
      - text: "الدرجة الثالثة"
      - text: "الدرجة الأولى"
        correct: true
      - text: "الدرجة الثانية"
      - text: "جميع الدرجات حققت معدلات متساوية"
  - question: "ماذا يُظهر pd.crosstab(df.pclass, df.survived)؟"
    options:
      - text: "متوسط الأجرة حسب الدرجة"
      - text: "عدد الركاب حسب الدرجة وحالة النجاة"
        correct: true
      - text: "إجمالي الإيرادات لكل درجة"
      - text: "التوزيع العمري"
---

## تحليل شامل من البداية إلى النهاية

يجمع هذا الدرس كل ما تعلمته في الوحدات السابقة. سنحمّل وننظف ونستكشف ونحلل مجموعة بيانات تيتانيك في سير عمل كامل.

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)
```

## الخطوة 1: تنظيف البيانات

```python
# Drop Cabin — 77% missing, not useful
df = df.drop(columns=["Cabin"])

# Fill Age with median
df["Age"] = df["Age"].fillna(df["Age"].median())

# Fill Embarked with mode (most common port)
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])

# Verify no missing values remain
print(df.isna().sum().sum())   # 0
```

## الخطوة 2: هندسة الميزات

أنشئ أعمدة مشتقة مفيدة:

```python
# Travel alone indicator
df["IsAlone"] = ((df["SibSp"] + df["Parch"]) == 0).astype(int)

# Age groups
df["AgeGroup"] = pd.cut(df["Age"], bins=[0, 12, 18, 35, 60, 100],
                         labels=["Child", "Teen", "Adult", "Middle-aged", "Senior"])

# Family size
df["FamilySize"] = df["SibSp"] + df["Parch"] + 1
```

## الخطوة 3: النجاة حسب الدرجة

```python
print(df.groupby("Pclass")["Survived"].agg(["mean", "count"]))
```

المخرجات:

```
            mean  count
Pclass                 
1       0.629630    216
2       0.472826    184
3       0.242363    491
```

نجا ركاب الدرجة الأولى بمعدل يقارب ثلاثة أمثال معدل ركاب الدرجة الثالثة.

## الخطوة 4: النجاة حسب الجنس

```python
print(df.groupby("Sex")["Survived"].agg(["mean", "count"]))
```

المخرجات:

```
            mean  count
Sex                    
female  0.742038    314
male    0.188908    577
```

نجت 74% من النساء مقابل 19% من الرجال — سياسة "النساء والأطفال أولًا" تنعكس بوضوح.

## الخطوة 5: تحليل مدمج — الدرجة والجنس

```python
print(df.groupby(["Pclass", "Sex"])["Survived"].mean().unstack())
```

المخرجات:

```
Sex      female      male
Pclass                   
1       0.968085  0.368852
2       0.921053  0.157407
3       0.500000  0.135447
```

حققت نساء الدرجة الأولى معدل نجاة 97%. ورجال الدرجة الثالثة معدلًا بلغ 14% فقط.

## الخطوة 6: النجاة حسب الفئة العمرية

```python
print(df.groupby("AgeGroup", observed=True)["Survived"].agg(["mean", "count"]))
```

المخرجات:

```
                mean  count
AgeGroup                   
Child       0.580645     62
Teen        0.347826     46
Adult       0.339869    306
Middle-aged 0.385965    228
Senior      0.227273     22
```

حققت فئة الأطفال أعلى معدل نجاة بلغ 58%.

## الخطوة 7: النجاة حسب حجم العائلة

```python
print(df.groupby("FamilySize")["Survived"].agg(["mean", "count"]))
```

المخرجات:

```
                mean  count
FamilySize                  
1           0.303538    537
2           0.552795    161
3           0.578431     89
4           0.724138     58
5           0.200000     20
6           0.166667     12
7           0.333333      6
8           0.000000      5
```

حققت العائلات المؤلفة من 2-4 أفراد أفضل معدلات النجاة. وكان أداء المسافرين بمفردهم والعائلات الكبيرة جدًا أسوأ.

## الخطوة 8: توزيع الأجرة حسب النجاة

```python
print(df.groupby("Survived")["Fare"].describe().round(2))
```

المخرجات:

```
         count   mean    std  min   25%   50%    75%      max
Survived                                                     
0        549.0  22.12  31.42  0.0  7.85  10.5  26.00   263.00
1        342.0  48.40  66.33  0.0  12.48  26.0  57.01  512.33
```

دفع الناجون أُجرًا أعلى بكثير في المتوسط.

## الخطوة 9: ميناء الإقلاع

```python
print(df.groupby("Embarked")["Survived"].agg(["mean", "count"]))
```

المخرجات:

```
            mean  count
Embarked               
C       0.553571    168
Q       0.389610     77
S       0.368821    646
```

حقّق الركاب القادمون من شيربورغ أعلى معدل نجاة — على الأرجح لأن ركاب الدرجة الأولى الأكثر صعدوا هناك.

## الخطوة 10: ملخص النتائج

```python
# Create a final summary table
summary = df.groupby(["Pclass", "Sex"]).agg(
    passengers=("Survived", "count"),
    survival_rate=("Survived", "mean"),
    avg_fare=("Fare", "mean"),
    avg_age=("Age", "mean")
).round(3)

print(summary)
```

## الاستنتاجات الرئيسية

1. **كانت الدرجة أقوى مؤشر على النجاة** — نجا ركاب الدرجة الأولى بنسبة 63% مقابل 24% للدرجة الثالثة
2. **كان الجنس قويًا بنفس القدر** — نجت 74% من النساء مقابل 19% من الرجال
3. **التوليفة هي الأهم** — نساء الدرجة الأولى: نجاة 97%; رجال الدرجة الثالثة: 14%
4. **كانت للأطفال أفضلية** — معدل نجاة 58%، وهو الأعلى بين جميع الفئات العمرية
5. **ساعدت أحجام العائلات المعتدلة** — نجت العائلات المكوّنة من 2-4 أفراد أكثر من المسافرين بمفردهم
6. **ارتبطت الأجرة المدفوعة بالنجاة** — نجا الركاب الأعلى أجرًا أكثر، ما يعكس على الأرجح الدرجة وموقع المقصورة

## جرّب بنفسك

أعد إنتاج هذا التحليل بسؤال مختلف: هل أدت مرافقة أحد (فرد من العائلة) إلى تحسين فرص النجاة؟ قارن المسافرين بمفردهم (FamilySize == 1) بالعائلات الصغيرة (2-4 أفراد) والعائلات الكبيرة (5 أفراد فأكثر).

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)

df["FamilySize"] = df["SibSp"] + df["Parch"] + 1
df["Group"] = pd.cut(df["FamilySize"], bins=[0, 1, 4, 20], labels=["Solo", "Small", "Large"])

print(df.groupby("Group")["Survived"].agg(["mean", "count"]))
```

## خلاصات رئيسية

- يسير التحليل الاستكشافي الكامل وفق خط أنابيب: تحميل → تنظيف → هندسة ميزات → تجميع → تحليل → استنتاج
- يجب أن يسبق التنظيف التحليل — القيم المفقودة تحرّف نتائج groupby
- هندسة الميزات (الفئات العمرية، مؤشرات العزلة) تكشف أنماطًا مخفية في الأرقام الخام
- زوايا groupby المتعددة (الدرجة، الجنس، العمر، العائلة) تبني صورة كاملة

## تحدي التطبيق

أجرِ تحليل EDA مصغرًا خاصًا بك على مجموعة بيانات تيتانيك. اختر سؤالًا واحدًا غير مطروق أعلاه (مِثال: "هل حظي الركاب بألقاب مثل 'Dr' أم 'Rev' بمعدلات نجاة مختلفة؟") وأجب عنه باستخدام مهارات pandas من هذه الدورة. اكتب نتائجك في 3-5 جمل.