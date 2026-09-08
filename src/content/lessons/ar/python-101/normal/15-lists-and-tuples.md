---
title: "القوائم والجداول (Lists and Tuples)"
description: "خزّن المتتاليات واستكشف توماس الغوص في القوائم والجداول."
module: "data-structures"
order: 15
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "إنشاء القوائم والوصول إلى عناصرها وتعديلها"
  - "استخدام الجداول كمتتاليات غير قابلة للتعديل"
  - "اختيار بين القوائم والجداول"
  - "نسخ التسلسلات دون المشاركة المريبة لمراجع الكائنات"
prerequisites: ["14-string-slicing"]
tags: ["list", "tuple", "sequence", "mutable", "immutable"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## القوائم

القوائم متتاليات مرتبة وقابلة للتعديل:

```python
fruits = ["apple", "banana", "cherry"]
print(fruits[0])       # apple
print(fruits[-1])      # cherry
print(fruits[0:2])     # ['apple', 'banana']
```

## طرق القوائم

```python
nums = [3, 1, 4, 1, 5]
nums.append(9)       # [3, 1, 4, 1, 5, 9]
nums.insert(0, 0)    # [0, 3, 1, 4, 1, 5, 9]
nums.extend([2, 6])  # [0, 3, 1, 4, 1, 5, 9, 2, 6]
nums.pop()           # removes 9, returns it
nums.remove(1)       # removes first 1
nums.sort()          # sorts in place
nums.reverse()       # reverses in place
len(nums)            # current length
```

## التعديل في المكان مقابل إرجاع قائمة جديدة

بعض الطرق تعدّل القائمة (`append`، `sort`، `reverse`) وتُرجع `None`.
وأخرى تُرجع قائمة جديدة (`sorted()`، `list.copy()`):

```python
nums = [3, 1, 2]
result = nums.sort()   # result is None! nums is now [1, 2, 3]
result = sorted(nums)  # result is [1, 2, 3], nums unchanged
```

## الجداول

الجداول متتاليات **غير قابلة للتعديل** ومرتبة:

```python
point = (3, 4)
print(point[0])   # 3
# point[0] = 5   # TypeError!
```

استخدم الجداول للبيانات الثابتة: الإحداثيات، ألوان RGB، صفوف قاعدة البيانات.

## التفكيك

عيّن عناصر المتتالية إلى متغيرات في سطر واحد:

```python
x, y = (3, 4)         # x=3, y=4
a, b, *rest = [1, 2, 3, 4, 5]  # a=1, b=2, rest=[3, 4, 5]
first, *_, last = (1, 2, 3, 4)  # first=1, last=4
```

## المزالق الشائعة

- **خلط الفهرس والمؤشر**: لا تنس أن المؤشر يبدأ من الصفر
- **صفّ الجداول الفارغة**: `()` هي جدول، لكن `(3)` عدد صحيح
- **مشاركة النسخ**: `list2 = list1` لا تُنشئ نسخة — تحصل على список متشارك، فافحص ما تعتزم فعله

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

بالنظر إلى قائمة درجات سداسية، اطبع المتوسط بخطأ عشري واحد. ثم أضف درجة جديدة وأعد الطباعة.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>scores = [85, 92, 78, 90]; avg = round(sum(scores) / len(scores), 1); print(avg)</code> ثم <code>scores.append(88); avg = round(sum(scores) / len(scores), 1)</code>.</p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

افترض `a = [1, 2, 3]` و`b = a` و`c = a.copy()`. بعد `b.append(4)`، ماهي `a` و`c`؟

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>a</code> تصبح <code>[1, 2, 3, 4]</code> لأن <code>b</code> تشير إلى الكائن نفسه، بينما تبقى <code>c</code> كما هي: <code>[1, 2, 3]</code>.</p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- متى تختار قائمة على جدول؟ تحت أي ظروف تكون القائمة أفضل؟ متى تحمي الجدول مشروعك من أخطاء التعديل غير المقصود؟
- لماذا تفرض بايثون الفاصلة في الجدول ذي العنصر الواحد؟ وماذا يحدث بدونها؟
- كيف تعرف أن الأقواس المتداخلة في القوائم تصبح عناصر قابلة للفهرسة؟ وما النتائج العملية على النسخ العميقة؟

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-lists-tuples">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ماذا تُرجع <code>[1, 2, 3][-1]</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">1</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">Error</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. هل الجدول المتداخل "نفس" القائمة المتداخلة كمفهوم قابلية للتعديل؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">نعم</button>
      <button class="quiz-q__opt" data-idx="1">لا</button>
      <button class="quiz-q__opt" data-idx="2">فقط إذا كانا في نفس المجموعة</button>
      <button class="quiz-q__opt" data-idx="3">غير محدد</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>