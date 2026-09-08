---

title: "صياغة أسئلة EDA"
description: "ترجمة المسائل التجارية الغامضة إلى أسئلة تحليلية منظمة وقابلة للاختبار ترشد تحليلك بالكامل."
module: "eda-framework"
order: 1
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "ترجمة بيان مشكلة غامض إلى أسئلة EDA مركّزة"
  - "التمييز بين التحليل الوصفي والاستكشافي والتأكيدي"
  - "صياغة فرضيات قابلة للاختبار من أسئلة تحليلية"
  - "بناء تسلسل هرمي للأسئلة ينظم سير عمل EDA كاملًا"
prerequisites: []
tags: ["eda", "framing", "hypotheses", "questions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "يسأل صاحب مصلحة عن سبب انخفاض المبيعات. ما أول شيء يجب فعله؟"
    options:
      - text: "تحميل بيانات المبيعات ورسم سلسلة زمنية فورًا"
      - text: "السؤال عن الفترة الزمنية وفئة المنتج المعنية"
        correct: true
      - text: "تشغيل نموذج انحدار على بيانات المبيعات"
      - text: "إخباره بأن تقلبات المبيعات أمر طبيعي"
  - question: "أي نوع من الأسئلة التحليلية يسأل عما إذا كانت دورة تجريبية تسبب درجات أعلى؟"
    options:
      - text: "وصفي"
      - text: "استكشافي"
      - text: "تأكيدي"
        correct: true
      - text: "إرشادي"
  - question: "ما الغرض من التسلسل الهرمي للأسئلة في EDA؟"
    options:
      - text: "جعل التحليل يبدو أكثر احترافية"
      - text: "تنظيم التحليل من العام إلى المحدد"
        correct: true
      - text: "تقليل عدد الأسئلة"
      - text: "تجنب مخاطبة أصحاب المصلحة"
---
يبدأ التحليل الجيد بسؤال، لا بمخطط بياني. قبل تحميل مجموعة بيانات، قبل استيراد matplotlib، تحتاج إلى معرفة ما تبحث عنه. يعلمك هذا الدرس كيف تترجم مشكلة تجارية غامضة إلى مجموعة منظمة من الأسئلة التحليلية ترشد كل قرار في خط أنابيب EDA الخاص بك.

## المفاهيم الأساسية

### من مشكلة غامضة إلى أسئلة منظمة

يقول صاحب مصلحة "هل تختلف درجات اختبارات الطلاب حسب الجنس؟" — يبدو ذلك سؤالًا، لكنه في الواقع واسع جدًا للإجابة المباشرة. أسئلة EDA الجيدة محددة وقابلة للقياس ومحدودة النطاق. قسّم السؤال الغامض إلى طبقات:

```python
# Vague question
"Do student test scores vary by gender?"

# Layer 1 — scope the variable
"What is the distribution of math scores across the dataset?"

# Layer 2 — introduce the comparison
"How do math score distributions differ between male and female students?"

# Layer 3 — add depth
"Does the gender gap in math scores change across different ethnic groups?"

# Layer 4 — actionable insight
"Which subgroups show the largest performance gaps, and what interventions might address them?"
```

### ثلاثة أنواع من الأسئلة التحليلية

| النوع | الغرض | مثال |
|------|---------|---------|
| **وصفي** | تلخيص ما حدث | "ما متوسط درجة القراءة؟" |
| **استكشافي** | اكتشاف الأنماط والعلاقات | "هل يرتبط نوع الغداء والتحضير للاختبار بالدرجات؟" |
| **تأكيدي** | اختبار فرضية محددة | "هل فرق درجة الرياضيات بين الجنسين ذو دلالة إحصائية؟" |

يمر تحليل EDA القوي عبر الأنواع الثلاثة جميعها: صف المشهد، استكشف الأنماط غير المتوقعة، ثم أكّد أهم النتائج.

### التسلسل الهرمي للأسئلة

نظّم أسئلتك في تسلسل هرمي يعكس سير عمل EDA:

1. **السؤال الأساسي** — السؤال الوحيد الذي يجب أن يجيبه التحليل
2. **الأسئلة الثانوية** — التفصيلات والمقارنات التي تدعم السؤال الأساسي
3. **الأسئلة الثالثية** — الحالات الحافة والمتغيرات المربكة ومسائل "وماذا عن X؟"

```python
# Example for Students Performance dataset

primary = "What factors most strongly predict student performance on exams?"

secondary = [
    "How do scores distribute across subjects (math, reading, writing)?",
    "Do gender and ethnicity interact to produce score differences?",
    "What role does parental education level play?",
    "Is test preparation course completion associated with higher scores?",
]

tertiary = [
    "Does lunch type (standard vs free/reduced) confound the ethnicity effect?",
    "Are the relationships linear or do they plateau?",
    "Do outliers represent data entry errors or genuine high performers?"
]
```

### صياغة الفرضيات

بمجرد امتلاكك أسئلة، حوّلها إلى فرضيات قابلة للاختبار. الفرضية الجيدة قابلة للدحض ومحددة:

```python
# Weak hypothesis (not testable)
"Gender affects scores."

# Strong hypothesis (testable, specific)
"Female students score higher on reading and writing, while male students score higher on math, with effect sizes greater than 0.2 standard deviations."

# Null hypothesis (for confirmatory analysis)
"There is no statistically significant difference in mean math scores between male and female students (p > 0.05)."
```

### توثيق إطار أسئلتك

أبقِ أسئلتك مرئية طوال التحليل. أُفُرة واضحة في دفترك تحافظ على صدقك:

```python
eda_questions = {
    "primary": "What factors most strongly predict student performance?",
    "secondary": {
        "score_distributions": "How do scores distribute across subjects?",
        "gender_effects": "Do gender and ethnicity interact?",
        "parental_education": "What role does education level play?",
        "test_prep": "Is test preparation associated with higher scores?",
    },
    "status": {}  # track which questions you've answered
}

for q in eda_questions["secondary"]:
    print(f"  [ ] {q}")
```

## جرّب بنفسك

افتح بيئة التدريب أدناه وتدرّب على صياغة أسئلة لمجموعة بيانات تريد استكشافها. اكتب سؤالًا أساسيًا واحدًا وثلاثة أسئلة ثانوية وحوّل سؤالًا واحدًا على الأقل إلى فرضية قابلة للاختبار.

```python
# Your turn: frame EDA questions for a dataset of your choice
# Replace the example below with your own

my_dataset = "Students Performance in Exams"

primary_question = "What factors most strongly predict student performance?"
secondary_questions = [
    "How do scores distribute across subjects?",
    "Do demographic factors correlate with performance gaps?",
    "What is the effect of test preparation course completion?",
]

# Convert one to a hypothesis
hypothesis = (
    "Students who complete a test preparation course will score "
    "at least 5 points higher on average across all three subjects."
)

print(f"Primary: {primary_question}")
print("Secondary:")
for i, q in enumerate(secondary_questions, 1):
    print(f"  {i}. {q}")
print(f"\nHypothesis: {hypothesis}")
```

## خلاصات رئيسية

- يبدأ تحليل EDA الجيد بأسئلة لا بكود — تقرر جودة أسئلتك جودة تحليلك
- قسّم المشاكل الغامضة إلى تسلسل هرمي: أسئلة أساسية وثانوية وثالثية
- حوّل الأسئلة إلى فرضيات قابلة للدحض قبل أن تبدأ الحساب
- يخدم التحليل الوصفي والاستكشافي والتأكيدي أغراضًا مختلفة؛ يستخدم تحليل EDA القوي الثلاثة معًا
- وثّق إطار أسئلتك وتتبع الأسئلة التي أجبت عنها

## تحدي التطبيق

حصلت على مجموعة بيانات اسمها `housing.csv` بأعمدة: `price`, `sqft`, `bedrooms`, `bathrooms`, `neighborhood`, `year_built`, `has_garage`. اكتب سؤالًا أساسيًا وثلاثة أسئلة ثانوية وفرضية واحدة قابلة للاختبار. ثم اكتب قاموس بايثون يخزّن التسلسل الهرمي لأسئلتك ويطبعه منسّقًا.

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

```python
eda_framework = {
    "dataset": "housing.csv",
    "primary": "What factors most strongly predict house price?",
    "secondary": [
        "How does price vary by neighborhood?",
        "Is there a linear relationship between sqft and price?",
        "Do bedrooms and bathrooms interact in their effect on price?",
    ],
    "hypothesis": (
        "Houses with a garage sell for at least 15% more than "
        "comparable houses without one, controlling for sqft and location."
    ),
}

for key, value in eda_framework.items():
    if isinstance(value, list):
        print(f"{key}:")
        for i, item in enumerate(value, 1):
            print(f"  {i}. {item}")
    else:
        print(f"{key}: {value}")
```

</div>
</details>