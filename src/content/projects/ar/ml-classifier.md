---
title: "درّب أول نموذج تعلّم آلي لك"
description: "ابنِ ودرّب وقيّم مصنِّف scikit-learn ببيانات حقيقية — لا حاجة لخلفية في تعلّم الآلة."
difficulty: "intermediate"
estimatedMinutes: 60
xpReward: 50
tags: ["Machine Learning", "scikit-learn", "pandas", "matplotlib"]
prerequisites: ["أساسيات بايثون", "أساسيات pandas", "أساسيات matplotlib"]
---

# درّب أول نموذج تعلّم آلي لك

يبدو التعلّم الآلي مخيفًا، لكن الفكرة الجوهرية بسيطة: أظهر للكمبيوتر أمثلة من أزواج المدخلات/المخرجات، فيتعلم نمطًا يمكنه تطبيقه على بيانات جديدة غير مسبوقة. في هذا المشروع ستفعل ذلك بالضبط — تحميل مجموعة بيانات كلاسيكية، وتدريب مصنِّف شجرة قرار، وتقييم مدى جودة توقعاته. لا حاجة لخلفية رياضية.

## ما ستتعلمه

1. تحميل واستكشاف مجموعة بيانات حقيقية
2. تجهيز البيانات للتعلّم الآلي
3. تقسيم البيانات إلى مجموعتي تدريب واختبار
4. تدريب مصنِّف شجرة قرار
5. تقييم دقة النموذج وإنشاء مصفوفة الالتباس

## ما ستبنيه

خط أنابيب تعلم آلي يقوم بما يلي:
- تحميل مجموعة بيانات Iris من scikit-learn
- استكشاف توزيعات السمات
- تقسيم البيانات بفصل مناسب بين التدريب والاختبار
- تدريب مصنِّف شجرة قرار
- التقييم بالدقة والدقة النوعية (precision) والاستدعاء (recall)
- تصوّر مصفوفة الالتباس

## الإعداد

```bash
uv init ml-classifier
cd ml-classifier
uv add scikit-learn pandas matplotlib
```

## الخطوة 1: تحميل البيانات واستكشافها

مجموعة بيانات Iris من أشهر مجموعات البيانات في التعلّم الآلي. تحتوي قياسات (طول الكأسية، عرض الكأسية، طول البتلة، عرض البتلة) لـ 150 زهرة سوسن عبر ثلاثة أنواع. مهمتك: تعليم نموذج التنبؤ بالنوع من القياسات.

```python
import pandas as pd
from sklearn.datasets import load_iris

# Load the dataset
iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df["species"] = iris.target
df["species_name"] = df["species"].map({0: "setosa", 1: "versicolor", 2: "virginica"})

df.head()
```

استكشف البيانات لفهم ما تتعامل معه:

```python
# How many samples per species?
print(df["species_name"].value_counts())

# Basic statistics for each feature
df.describe()
```

**الناتج المتوقع:** سترى 50 عينة لكل نوع (فئات متوازنة)، وإحصاءات تُظهر نطاقات مثل طول الكأسية من نحو 4.3 إلى 7.9 سم.

**استكشاف الأخطاء وإصلاحها:** إذا فشل `load_iris()`، تأكد من تشغيل `uv add scikit-learn` في خطوة الإعداد. المجموعة مرفقة مع scikit-learn — لا حاجة إلى إنترنت.

## الخطوة 2: تجهيز السمات

افصل السمات المدخلة (القياسات) عن الهدف (تسمية النوع). يجب أن يكون كل عمود يدخل إلى النموذج رقميًا — ولحسن الحظ، سمات Iris رقمية بالفعل، فلا حاجة إلى ترميز.

```python
X = df.drop(columns=["species", "species_name"])
y = df["species"]

print(f"Features shape: {X.shape}")
print(f"Target shape: {y.shape}")
```

**الناتج المتوقع:** `Features shape: (150, 4)` و`Target shape: (150,)` — 150 صفًا، 4 أعمدة سمات.

**استكشاف الأخطاء وإصلاحها:** إذا رأيت أعمدة من نوع `object` في `X.dtypes`، فقد أدرجت أعمدة نصية بالخطأ. أسقط أي شيء ليس قياسًا رقميًا.

## الخطوة 3: تقسيم التدريب/الاختبار

دقة نموذج على البيانات التي تدرب عليها لا تخبرك شيئًا تقريبًا. تحتاج إلى حجب بعض البيانات لا يراها النموذج أبدًا أثناء التدريب، ثم التقييم على ذلك الجزء المحجوب. هذه أهم عادة في التعلّم الآلي.

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"Training set: {X_train.shape[0]} samples")
print(f"Test set: {X_test.shape[0]} samples")
```

يحجب `test_size=0.2` 20% من الصفوف للاختبار (30 عينة). `random_state=42` يجعل التقسيم قابلًا لإعادة الإنتاج — ستحصل على نفس الصفوف في كل مرة.

**الناتج المتوقع:** مجموعة التدريب: 120 عينة، مجموعة الاختبار: 30 عينة.

**استكشاف الأخطاء وإصلاحها:** إذا لم يصل المجموع إلى 150، تحقق جيدًا من `test_size`. إذا احتوى `y_test` نوعًا واحدًا فقط، فالتقسيم غير متوازن — جرّب `random_state` مختلفًا أو تحقق أن `y` يحتوي الفئات الثلاث فعلًا.

:::tip[تسرّب البيانات]
قسّم دائمًا *بعد* تحميل البيانات لكن *قبل* أي تحويل يلخّص مجموعة البيانات (مثل التوسيع أو الترميز). هنا سمات Iris رقمية بالفعل وعلى مقاييس متشابهة، فلا خطر تسريب — لكن هذا الانضباط مهم لمجموعات بيانات أشد فوضى.
:::

## الخطوة 4: تدريب مصنِّف

تطرح شجرة القرار سلسلة من أسئلة نعم/لا حول السمات (مثلًا "هل طول البتلة > 2.5؟") وتصل إلى تنبؤ. إنها بديهية وسريعة وتعمل جيدًا كنموذج أول.

```python
from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(random_state=42)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
```

`.fit(X_train, y_train)` هو مكان حدوث التعلّم — لا يرى النموذج `X_test` أبدًا خلال هذه الخطوة. ثم يطبّق `.predict(X_test)` ما تعلمه على البيانات المحجوبة.

**الناتج المتوقع:** `predictions` مصفوفة طولها 30 تحتوي فقط 0 أو 1 أو 2 (تسميات الأنواع).

**استكشاف الأخطاء وإصلاحها:** إذا رأيت تحذيرًا بشأن أسماء السمات، فقد مررت DataFrame بأعمدة إضافية. تأكد أن `X_train` و`X_test` يحتويان فقط أربعة أعمدة سمات رقمية.

## الخطوة 5: تقييم النموذج

ابدأ بالدقة — نسبة التنبؤات الصحيحة — ثم تعمّق بالدقة النوعية والاستدعاء ومصفوفة الالتباس.

```python
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix

accuracy = accuracy_score(y_test, predictions)
precision = precision_score(y_test, predictions, average="weighted")
recall = recall_score(y_test, predictions, average="weighted")

print(f"Accuracy:  {accuracy:.1%}")
print(f"Precision: {precision:.1%}")
print(f"Recall:    {recall:.1%}")
```

تخبرك الدقة بمعدل الإصابة الإجمالي. تخبرك الدقة النوعية، من بين كل المرات التي تنبّأ فيها النموذج بنوع، كم مرة كان محقًا. يخبرك الاستدعاء، من بين كل الحالات الفعلية لنوع ما، كم حالة وجدها النموذج. يتعامل المعامل `average="weighted"` مع حالة الفئات المتعددة بالمتوسط عبر الأنواع الثلاثة.

**الناتج المتوقع:** يجب أن تكون المقاييس الثلاثة حول 90–100% على هذه المجموعة — Iris منفصلة جيدًا بما يكفي لأن شجرة القرار تعمل بشكل ممتاز.

**استكشاف الأخطاء وإصلاحها:** إذا كانت الدقة 33% بالضبط، فالنموذج يخمّن عشوائيًا (مستوى الصدفة للفئات الثلاث). تحقق أن `X_train` و`y_train` غير مُخلوطين بشكل مستقل — يجب أن يبقيا متوازيين.

## الخطوة 6: تصوّر النتائج

تُظهر مصفوفة الالتباس بالضبط *أي* الأنواع خلطها النموذج. جعلها مرئية يجعل النمط واضحًا في نظرة واحدة.

```python
import matplotlib.pyplot as plt
import numpy as np

cm = confusion_matrix(y_test, predictions)

fig, ax = plt.subplots(figsize=(6, 5))
im = ax.imshow(cm, cmap="Blues")

ax.set_xticks(range(3))
ax.set_yticks(range(3))
ax.set_xticklabels(iris.target_names)
ax.set_yticklabels(iris.target_names)
ax.set_xlabel("Predicted")
ax.set_ylabel("Actual")
ax.set_title("Confusion Matrix")

# Add count labels in each cell
for i in range(3):
    for j in range(3):
        ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                color="white" if cm[i, j] > cm.max() / 2 else "black")

plt.colorbar(im)
plt.tight_layout()
plt.show()
```

تُظهر خلايا القطر (من الأعلى إلى اليسار إلى الأسفل إلى اليمين) التنبؤات الصحيحة. تُظهر الخلايا خارج القطر الأخطاء — مثلًا، إذا أُخلط أحيانًا بين versicolor وvirginica، ستضيء تلك الخلية.

**الناتج المتوقع:** شبكة 3×3 بأرقام عالية على القطر وأصفار (أو قريبة من الصفر) خارجه. النموذج المثالي سيكون له إدخالات قطرية فقط.

**استكشاف الأخطاء وإصلاحها:** إذا لم يظهر الرسم، تأكد أنك تعمل في بيئة معروضة (Jupyter أو VS Code أو نص محلي). في طرفية بلا واجهة رسومية، استبدل `plt.show()` بـ `plt.savefig("confusion_matrix.png")` لحفظ الشكل في ملف بدلاً من ذلك.

## 🧩 التحديات

- **جرّب مصنِّفًا مختلفًا.** استبدل `DecisionTreeClassifier` بـ `RandomForestClassifier` (أضف `from sklearn.ensemble import RandomForestClassifier`). كيف تتغير الدقة؟
- **اضبط الشجرة.** عيّن `max_depth=2` عند إنشاء `DecisionTreeClassifier`. ماذا يحدث للدقة؟ وماذا عن `max_depth=10`؟
- **أهمية السمات.** بعد الضبط، اطبع `model.feature_importances_` بجانب `iris.feature_names`. أي سمة هي الأكثر أهمية للتنبؤ بالنوع؟
- **احجز تقسيمًا مختلفًا.** غيّر `test_size` إلى 0.3 أو 0.1. كيف يتحول رقم الدقة؟ شغّل التقسيم 10 مرات بقيم `random_state` مختلفة وأبلغ عن نطاق درجات الدقة.

## ما تعلمته

بنيت خط أنابيب تعلّم آلي كاملاً: تحميل البيانات، تجهيز السمات، التقسيم إلى تدريب/اختبار، تدريب مصنِّف، التقييم بمقاييس متعددة، وتصوّر النتائج. سير العمل — جهّز ← قسّم ← اضبط ← قيّم — هو نفس الشكل المستخدم في كل مهمة تعلّم خاضعة للإشراف، سواء كانت مجموعة ألعاب من 150 صفًا أو نظام إنتاج بملايين الصفوف. أشجار القرار مجرد عائلة واحدة من النماذج؛ تعمل نفس الخطوات مع الانحدار اللوجستي والغابات العشوائية والشبكات العصبية وما بعدها.

:::tip[تحقق من وثائق scikit-learn الحالية]
scikit-learn مكتبة مستقرة، لكن واجهتها البرمجية تتغيّر بين الإصدارات الرئيسية — تتغيّر القيم الافتراضية للمعاملات، وتُهجَر دوال. قبل الاعتماد على هذا الكود لما يتجاوز مشروع دورة دراسية، تصفّح [وثائق scikit-learn الحالية](https://scikit-learn.org/stable/) للإصدار الذي لديك فعليًا مثبَّتًا (`uv pip show scikit-learn`).
:::
