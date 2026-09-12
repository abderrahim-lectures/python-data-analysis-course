---
title: "سجل الدرجات"
description: "أدر درجات الطلاب مع فئات مرجحة، حساب المعدل التراكمي، وبوابات أولياء الأمور."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["pandas", "csv", "classes", "statistics"]
prerequisites:
  - "أساسيات Python (المتغيرات، الحلقات، الدوال، القواميس)"
  - "أساسيات pandas (إطارات البيانات، groupby)"
---

# سجل الدرجات

كل معلم يحتاج طريقة لتتبع أداء الطلاب، وحساب المتوسطات المرجحة، وتحويل الدرجات الخام إلى كروت درجات ذات معنى. في هذا المشروع، ستبني نظام سجل درجات كاملًا في Python يتعامل مع سجلات الطلاب، وحساب المعدل التراكمي المرجح، وإحصائيات الصف، وحفظ CSV، وحتى تصورًا أساسيًا. ستتمرن على استخدام الفئات لنمذجة كيانات العالم الحقيقي، وpandas لمعالجة البيانات، والإحصاءات للتحليل.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز ، افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/gradebook/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/gradebook/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgradebook%2Fnotebook.ar.ipynb)

## ما الذي ستتعلمه

1. **نمذجة البيانات بالفئات** ، مثل الطلاب والدرجات والفئات ككائنات بمسؤوليات واضحة
2. **حساب المتوسط المرجح** ، احسب معدلات تراكمية تراعي أوزان فئات المهام
3. **التحليل الإحصائي** ، ابحث عن متوسطات الفصل والوسيطات وتوزيعات الدرجات
4. **حفظ CSV** ، احفظ وحمّل بيانات سجل الدرجات لتبقى بين الجلسات
5. **التصور** ، ولّد مخططات أعمدة لتوزيعات الدرجات باستخدام matplotlib

## ما الذي ستبنيه

تطبيق سجل درجات من سطر الأوامر يتيح لك إضافة طلاب، وتسجيل درجات عبر الفئات (واجبات منزلية، اختبارات قصيرة، امتحانات)، وحساب معدلات تراكمية مرجحة، وتوليد كروت درجات منسقة، وحفظ كل شيء إلى CSV، وتصور توزيعات الدرجات بمخططات.

## الإعداد

```bash
mkdir gradebook && cd gradebook
pip install pandas matplotlib
touch gradebook.py
```

## الخطوة 1: عرّف نموذج البيانات

أساس أي سجل درجات هو نموذج بياناته. نحتاج تمثيل ثلاثة مفاهيم جوهرية:

- **الطالب** ، الشخص باسمه ومجموعة من الدرجات
- **الدرجة** ، نقاط مفردة مربوطة بفئة ووزن
- **الفئة** ، تجميع مسمى (مثل "واجب منزلي" أو "امتحان") بوزن نحو الدرجة النهائية

استخدام الفئات يُبقي هذا منظمًا ويجعل كل قطعة سهلة الاختبار والتوسعة.

### 1.1 أنشئ فئة Grade

**👟 تلميح البداية :** أنشئ فئة `Grade` بخصائص `category` و`score` و`weight`.

```python
class Grade:
    def __init__(self, category, score, weight):
        self.category = category
        self.score = score
        self.weight = weight

    def __repr__(self):
        return f"Grade(category='{self.category}', score={self.score}, weight={self.weight})"
```

**🎯 الناتج المتوقع :**

```python
>>> g = Grade("homework", 95, 0.3)
>>> g
Grade(category='homework', score=95, weight=0.3)
>>> g.score
95
```

**🩹 إذا لم يعمل :**
- تأكد أن `weight` عدد عشري (0.3 لـ30%)، لا نسبة مئوية (30)
- تستخدم طريقة `__repr__` اقتباسات مفردة داخل f-string ، تأكد أنها متطابقة

### 1.2 أنشئ فئة Student

**👟 تلميح البداية :** تخزّن فئة `Student` اسمًا وقائمة درجات فارغة. أضف طريقة لإضافة الدرجات وأخرى لعرضها.

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

**🎯 الناتج المتوقع :**

```python
>>> s = Student("Alice")
>>> s.add_grade("homework", 92, 0.3)
>>> s.add_grade("exam", 88, 0.7)
>>> s
Student(name='Alice', grades=2)
>>> s.grades
[Grade(category='homework', score=92, weight=0.3), Grade(category='exam', score=88, weight=0.7)]
```

**🩹 إذا لم يعمل :**
- يجب أن تنشئ طريقة `add_grade` كائن `Grade` جديدًا وتلحقه بـ `self.grades`
- لا تنسَ `self.grades = []` في `__init__` ، بدونها سيتشارك كل الطلاب القائمة نفسها

**✅ قائمة التحقق**
- ✅ تخزّن `Grade` الفئة والنقاط والوزن
- ✅ تخزّن `Student` اسمًا وقائمة درجات
- ✅ تنشئ `add_grade` كائن `Grade` وتضيفه لقائمة الطالب
- ✅ للفئتين طريقة `__repr__`

**🤔 سؤال (أسئلة) سقراطي(ة)**
- لماذا تخزين الدرجات كقائمة على الطالب بدلًا من قاموس مفتاحه الفئة؟

---

## الخطوة 2: أضف الدرجات

بعد اكتمال نموذج البيانات، لنبنِ نظامًا لإدخال الدرجات فعلًا. سننشئ فئة `Gradebook` تحمل كل الطلاب وتوفر طرقًا لإضافة الطلاب والدرجات.

### 2.1 أنشئ فئة Gradebook

**👟 تلميح البداية :** تحمل فئة `Gradebook` قاموسًا يربط أسماء الطلاب بكائنات `Student`.

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

**🎯 الناتج المتوقع :**

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

**🩹 إذا لم يعمل :**
- يجب أن تطبع `get_student` رسالة وترجع `None` عند غياب الطالب
- تأكد أن `add_student` يفحص التكرارات قبل إنشاء طالب جديد

**✅ قائمة التحقق**
- ✅ يخزّن `Gradebook` الطلاب في قاموس مفتاحه الاسم
- ✅ ينشئ `add_student` طالبًا ويتعامل مع التكرارات
- ✅ يسترجع `get_student` طالبًا أو يطبع رسالة "غير موجود"
- ✅ تضيف `add_grade` درجةً لطالب محدد بالاسم

**🤔 سؤال (أسئلة) سقراطي(ة)**
- ما الذي سيتغير إذا كان بإمكان الطلاب مشاركة الاسم نفسه؟ كيف تتعامل مع ذلك؟

---

## الخطوة 3: احسب المعدل التراكمي

الميزة الجوهرية لأي سجل درجات هي حساب المعدل التراكمي. يضرب المعدل التراكمي المرجح كل درجة في وزنها، ويجمع هذه الحواصل، ويقسم على الوزن الإجمالي. يضمن هذا احتساب الامتحانات بنسبة أكبر من الواجبات حين تكون أوزانها أعلى.

### 3.1 المتوسط المرجح لطالب واحد

**👟 تلميح البداية :** مرّر عبر درجات الطالب، واضرِب كل نقطة في وزنها، واجمعها، واقسم على الوزن الإجمالي.

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

**🎯 الناتج المتوقع :**

```python
>>> alice = gb.get_student("Alice")
>>> alice.grades
[Grade(category='homework', score=95, weight=0.3), Grade(category='exam', score=87, weight=0.7), Grade(category='homework', score=88, weight=0.3)]
>>> weighted_average(alice.grades)
90.54
```

**🩹 إذا لم يعمل :**
- تحقق أنك تستخدم `g.weight` لا `g.score` كقاسمٍ
- تأكد من معالجة حالة القائمة الفارغة ، القسمة على صفر ستحطم البرنامج
- الوزن الإجمالي هنا 1.3 (0.3 + 0.7 + 0.3)، لا 1.0 ، وهذا صحيح لأن الواجب المنزلي ظهر مرتين

### 3.2 المعدل التراكمي عبر كل الطلاب

**👟 تلميح البداية :** أضف إلى `Gradebook` طريقةً تحسب متوسط معدلات الطلاب كلهم معًا.

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

**🎯 الناتج المتوقع :**

```python
>>> gb.class_average()
87.07
```

**🩹 إذا لم يعمل :**
- صفِّ الطلاب الذين لا درجات لهم ، لا يجب أن تُحتسب قائمة الدرجات الفارغة في المتوسط
- متوسط الصف هو متوسط معدلات الطلاب، لا متوسط كل الدرجات الفردية

**✅ قائمة التحقق**
- ✅ يتعامل `weighted_average` مع قوائم الدرجات الفارغة برشاقة
- ✅ تُضرب كل نقطة في وزنها قبل الجمع
- ✅ يرجع `class_average` متوسط كل معدلات الطلاب التراكمية
- ✅ تُقرَّب النتائج إلى منزلتين عشريتين

**🤔 سؤال (أسئلة) سقراطي(ة)**
- إذا كان لواجبين منزليين كلاهما وزن 0.3، فهل يجب أن يحتسب كل منهما 30% أم تحتسب الواجبات مجتمعة 30%؟ كيف تعيد تصميم النموذج للتعامل مع النهجين؟

---

## الخطوة 4: إحصائيات الصف

أرقام المعدل التراكمي الخام مفيدة، لكن المعلمين يحتاجون أيضًا رؤية الصورة الأكبر: كيف يؤدي الصف إجمالًا؟ ما متوسط الدرجات؟ كم طالبًا يحصل على A مقابل F؟

### 4.1 تحويل درجة الحرف

**👟 تلميح البداية :** اكتب دالة تحوّل درجةً رقمية إلى درجة حرف باستخدام عتبات قياسية.

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

**🎯 الناتج المتوقع :**

```python
>>> letter_grade(95)
'A'
>>> letter_grade(82)
'B'
>>> letter_grade(55)
'F'
```

### 4.2 طريقة إحصائيات الصف

**👟 تلميح البداية :** أضف إلى `Gradebook` طريقةً تحسب المتوسط والوسيط والأدنى والأقصى وتوزيع الدرجات.

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

**🎯 الناتج المتوقع :**

```python
>>> stats = gb.class_stats()
>>> stats
{'average': 87.07, 'median': 87.07, 'min': 81.31, 'max': 92.83, 'distribution': {'A': 1, 'B': 1}}
```

**🩹 إذا لم يعمل :**
- تأكد من استيراد `statistics` في أعلى الملف
- يعدّ التوزيع درجات الحروف بناءً على المتوسط المرجح لكل طالب، لا الدرجات الفردية
- استخدم `dist.get(lg, 0) + 1` للتعامل مع أول ظهور لكل درجة حرف

**✅ قائمة التحقق**
- ✅ تحوّل `letter_grade` الدرجات إلى A/B/C/D/F
- ✅ ترجع `class_stats` المتوسط والوسيط والأدنى والأقصى والتوزيع
- ✅ تُصفّى قوائم الدرجات الفارغة قبل حساب الإحصاءات
- ✅ توزيع الدرجات قاموس يربط الحروف بالأعداد

**🤔 سؤال (أسئلة) سقراطي(ة)**
- الوسيط 87.07 في هذا المثال. ماذا يخبرك عن الصف بما لا يخبرك به المتوسط وحده؟

---

## الخطوة 5: أنشئ التقارير

سجل الدرجات غير مفيد ما لم تقدم المعلومات بوضوح. لنبنِ كروت درجات منسقة تعرض درجات كل طالب ومتوسطه المرجح ودرجة حرفه.

### 5.1 تقرير طالب فردي

**👟 تلميح البداية :** ابنِ طريقةً ترجع سلسلة منسقة تعرض كل الدرجات والمتوسط النهائي لطالب واحد.

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

**🎯 الناتج المتوقع :**

```python
>>> print(alice.report_card())
Report Card: Alice
========================================
  Exam         avg: 87.0  (1 grades)
  Homework     avg: 91.5  (2 grades)
----------------------------------------
  Overall GPA: 90.54 (A)
```

**🩹 إذا لم يعمل :**
- استخدم `.title()` على أسماء الفئات لتتحول "homework" إلى "Homework"
- المعدل التراكمي الإجمالي هو المتوسط المرجح عبر كل الدرجات، لا متوسطًا بسيطًا لمتوسطات الفئات

### 5.2 تقرير الصف الكامل

**👟 تلميح البداية :** أضف إلى `Gradebook` طريقةً تطبع كرت درجات كل طالب.

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

**🎯 الناتج المتوقع :**

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

**🩹 إذا لم يعمل :**
- رتّب الطلاب أبجديًا بالاسم قبل الطباعة
- تجاوز الطلاب الذين لا درجات لهم في قسم كل طالب
- تأكد أن قسم الإحصاءات يظهر في الأسفل

**✅ قائمة التحقق**
- ✅ يعرض `report_card` الدرجات مجمعة بالفئة
- ✅ يطبع `full_report` كل الطلاب وإحصائيات الصف
- ✅ تُعرض متوسطات الفئات جانب المعدل التراكمي الإجمالي
- ✅ المخرجات منسقة بدقة بفواصل

**🤔 سؤال (أسئلة) سقراطي(ة)**
- كيف تعدّل التقرير لعرض درجة كل مهمة فردية بدلًا من متوسط الفئة فقط؟

---

## الخطوة 6: احفظ وحمّل

سجل درجات يفقد كل بياناته عند إغلاق البرنامج ليس مفيدًا. لنضف حفظ CSV لتبقى البيانات بين الجلسات. سنحفظ كل درجة كصف باسم الطالب والفئة والنقاط والوزن.

### 6.1 احفظ إلى CSV

**👟 تلميح البداية :** مرّر عبر كل الطلاب ودرجاتهم، كاتبًا كل درجة كصف CSV.

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

**🎯 الناتج المتوقع :**

```python
>>> gb.save("grades.csv")
Saved 2 students to grades.csv
```

سيحتوي ملف CSV على:

```
student,category,score,weight
Alice,homework,95,0.3
Alice,exam,87,0.7
Alice,homework,88,0.3
Bob,homework,78,0.3
Bob,exam,92,0.7
```

### 6.2 حمّل من CSV

**👟 تلميح البداية :** اقرأ ملف CSV وأعد بناء الطلاب والدرجات. تعامل مع حالة غياب الملف.

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

**🎯 الناتج المتوقع :**

```python
>>> loaded = Gradebook.load("grades.csv")
>>> loaded.class_average()
87.07
>>> len(loaded.students)
2
```

**🩹 إذا لم يعمل :**
- استخدم `csv.DictReader` لتصل إلى الأعمدة بالاسم (`row["student"]`) لا بالمؤشر
- حوّل `score` و`weight` إلى `float` ، يقرأ CSV كل شيء كسلاسل
- استخدم `@classmethod` لتستطيع استدعاء `Gradebook.load(...)` دون امتلاك كائن موجود

**✅ قائمة التحقق**
- ✅ يكتب `save` صف رأس ثم صفًّا لكل درجة
- ✅ يستخدم `load` `DictReader` ويعيد بناء سجل الدرجات كاملًا
- ✅ تُعالج الملفات المفقودة برشاقة مع رسالة
- ✅ تُحوّل القيم الرقمية من سلاسل إلى أعداد عائمة

**🤔 سؤال (أسئلة) سقراطي(ة)**
- ماذا يحدث إذا حفظت سجل درجات وعدّلت CSV يدويًا بنقاط غير صالحة ثم حملته؟ كيف تضيف تحققًا؟

---

## الخطوة 7: صوّر النتائج

الأرقام في الطرفية جيدة، لكن المخطط يجعل توزيع الدرجات واضحًا فورًا. سنستخدم matplotlib لإنشاء مخطط أعمدة يظهر عدد الطلاب الذين حصلوا على كل درجة حرف.

### 7.1 مخطط أعمدة لتوزيع الدرجات

**👟 تلميح البداية :** استخدم قاموس التوزيع من `class_stats` ومرّره إلى `plt.bar`.

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

**🎯 الناتج المتوقع :**

ستظهر نافذة مخطط أعمدة تعرض:

```
Number of Students
  2 |
  1 |        ■
    |     ■     ■
  0 +--+--+--+--+--
       A  B  C  D  F
     Letter Grade
```

سيُحفظ المخطط أيضًا كـ `grade_distribution.png`.

**🩹 إذا لم يعمل :**
- تأكد أن `matplotlib` مثبّتة (`pip install matplotlib`)
- إذا لم يظهر أي مخطط، فجرّب `plt.show()` في طرفية منفصلة أو استخدم `plt.savefig` فقط
- يمنع استدعاء `tight_layout()` قصّ التسميات

### 7.2 مخطط مقارنة المعدلات التراكمية للطلاب

**👟 تلميح البداية :** أنشئ مخطط أعمدة أفقيًا يقارن معدلات الطلاب كلهم التراكمية.

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

**🎯 الناتج المتوقع :**

مخطط أعمدة أفقي يعرض معدل كل طالب مع ترميز لوني (أخضر لـA، أزرق لـB، أصفر لـC، أحمر لدون C).

**🩹 إذا لم يعمل :**
- إذا كانت الأعمدة رفيعة جدًا، فزِد معامل `height` في `barh`
- تُحدَّد الألوان بنطاق المعدل ، تحقق من فهم القائمة الشرطية
- إذا تداخلت الأسماء، فزِد ارتفاع الشكل بناءً على عدد الطلاب

**✅ قائمة التحقق**
- ✅ ينشئ `plot_distribution` مخطط أعمدة لعدد درجات الحروف
- ✅ ينشئ `plot_student_comparison` مخطط أعمدة أفقيًا لمعدلات الطلاب التراكمية
- ✅ تُحفظ المخططات كملفات PNG
- ✅ تُعالج البيانات الفارغة برشاقة

**🤔 سؤال (أسئلة) سقراطي(ة)**
- كيف تضيف خطًا مرجعيًا عند متوسط الفصل ليسهل رؤية من فوق المتوسط ومن دونه؟

---

## 🧩 تحديات

مستعد للمضي أبعد؟ جرّب هذه:

1. **التحقق من الأوزان** ، تأكد أن أوزان الفئات تجمع إلى 1.0 لكل طالب. إذا لم تفعل، فحذّر المستخدم واعرض المجموع.

2. **إعداد أوزان الفئات** ، اسمح للمعلم بتحديد أوزان فئات افتراضية (مثل الواجبات = 30%، والامتحانات = 70%) حتى لا يضطر لتحديد الوزن كل مرة يضيف درجة.

3. **التصدير إلى HTML** ، ولّد كرت درجة HTML قابلًا للطباعة بجداول منسقة وألوان لدرجات الحروف. استخدم تنسيق السلاسل في Python لبناء HTML، ثم افتحه في متصفح بـ `webbrowser.open`.

---

## ما تعلمته

- **نمذجة البيانات بالفئات** ، مثلت الطلاب والدرجات وسجل الدرجات نفسه كفئات بايثونية بطرق واضحة
- **المتوسطات المرجحة** ، حسبت معدلات تراكمية تراعي أوزان الفئات، متعاملًا مع حالات حدية مثل قوائم الدرجات الفارغة
- **التحليل الإحصائي** ، استخدمت وحدة `statistics` في Python للمتوسط والوسيط، وبنيت عدّاد توزيع درجات مخصصًا
- **حفظ CSV** ، حفظت وحمّلت بيانات سجل الدرجات باستخدام `csv.DictReader` و`csv.writer`
- **تصور البيانات** ، أنشأت مخططات أعمدة باستخدام matplotlib لتوزيعات الدرجات ومقارنات الطلاب
- **توليد التقارير** ، بنيت كروت درجات نصية منسقة بدرجات مجمعة وإحصاءات ملخصة

لديك الآن سجل درجات يعمل بكامل وظائفه يمكنك توسيعه بميزات مثل إشعارات البريد الإلكتروني أو إدارة الانحناء أو واجهة ويب. تجعل البنية القائمة على الفئات كل قطعة سهلة الاختبار والتعديل وإعادة الاستخدام.