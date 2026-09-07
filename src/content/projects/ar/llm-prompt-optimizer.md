---
title: "مُحسّن مطالبات LLM"
description: "تحسين المطالبات تلقائياً باستخدام اختبار A/B وأمثلة قليلة وأنماط التفكير التسلسلي."
---


# ✨ ابنِ مُحسّن مطالبات LLM

المطالبة المتوسطة تعطي إجابات متوسطة. يضبط المهندسون المطالبات يدويًا بالمحاولة والخطأ غالبًا، لكن ذلك بطيء وغير قابل للتكرار. يبني هذا المشروع أداة CLI تأخذ مطالبة خام، وتولّد عدة صيغ منظمة (أمثلة قليلة، تفكير تسلسلي، قائمة على الدور)، وتقيّمها مقابل مجموعة ذهبية من الإجابات، وتبلّغ أي صيغة تؤدي أفضل.

يفترض هذا إنهاء Python 101 وارتياحًا مع pandas من تحليل البيانات. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. إعداد مشروع باستخدام `uv` وتثبيت تبعيات التحسين.
2. تعريف حزام تقييم بمدخلات اختبار وإجابات متوقعة.
3. توليد صيغ مطالبات: أمثلة قليلة، وتفكير تسلسلي، وقائمة على الدور.
4. تقييم كل صيغة مقابل المجموعة الذهبية.
5. ترتيب الصيغ وتصدير أفضل مطالبة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — هذه أداة CLI تعمل دون اتصال مقابل نموذج محاكاة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/llm-prompt-optimizer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/llm-prompt-optimizer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fllm-prompt-optimizer%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل البناء: بيئة Python، وpandas، وclick. يعمل المشروع مقابل نموذج محاكاة بحيث تعمل الحلقة بأكملها دون اتصال، دون مفاتيح API.

### ثبّت `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

أغلق طرفيتك وأعد فتحها، ثم أكِّد:

```bash
uv --version
```

### هيّئ المشروع

```bash
uv init llm-prompt-optimizer
cd llm-prompt-optimizer
uv add pandas click
```

### أنشئ بنية المشروع

```bash
mkdir -p optimizer
touch optimizer/__init__.py optimizer/data.py optimizer/variants.py optimizer/model.py optimizer/scoring.py optimizer/cli.py
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ يوجد `llm-prompt-optimizer/` مع `pyproject.toml` والتبعيات مثبَّتة.
- ✅ يحتوي مجلد `optimizer/` على جميع ملفات الوحدات المطلوبة.

## الخطوة 1: حدّد مجموعة البيانات الذهبية

لتقييم المطالبات تحتاج مدخلات اختبار بإجابات معروفة الصحة. هذا هو المعيار الذي تُقاس عليه صيغ مطالباتك.

### 1.1 أنشئ المجموعة الذهبية

**👟 تلميح البداية :**

أنشئ `optimizer/data.py`.

```python
# optimizer/data.py
from dataclasses import dataclass

@dataclass
class Question:
    input: str
    expected: str

def gold_set() -> list[Question]:
    return [
        Question("What is 6 * 7?", "42"),
        Question("Capital of Japan?", "Tokyo"),
        Question("What is 9 + 4?", "13"),
        Question("How many sides does a triangle have?", "3"),
    ]
```

**🎯 الناتج المتوقع :**

تُرجع `gold_set()` أربعة أسئلة بإجابات متوقعة.

**🩹 إذا لم يعمل :**

إذا كانت الإجابات المتوقعة خاطئة، يصبح التقييم بلا معنى. تحقّق أن `6 * 7` تساوي `42`.

### 1.2 تحقّق من المجموعة الذهبية

**✅ قائمة التحقق**

- ✅ كل الأسئلة لها مدخلات وإجابات متوقعة غير فارغة.
- ✅ الإجابات تمتد عبر فئتي الرياضيات والحقائق.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا يهم أن تغطي المجموعة الذهبية أكثر من نوع سؤال واحد؟

## الخطوة 2: ولّد صيغ المطالبات

تستحث بنى المطالبات المختلفة سلوكًا مختلفًا. ولّد بضع صيغ معيارية برمجيًا.

### 2.1 ابنِ مولّد الصيغ

**👟 تلميح البداية :**

أنشئ `optimizer/variants.py`.

```python
# optimizer/variants.py
from dataclasses import dataclass

@dataclass
class PromptVariant:
    name: str
    build: object


def build_few_shot() -> PromptVariant:
    examples = (
        "Q: What is 2 + 2?\nA: 4\n"
        "Q: What is the capital of Italy?\nA: Rome\n"
    )
    def make(q: str) -> str:
        return f"{examples}Q: {q}\nA:"
    return PromptVariant("few-shot", make)


def build_chain_of_thought() -> PromptVariant:
    def make(q: str) -> str:
        return f"Think step by step.\nQ: {q}\nA:"
    return PromptVariant("chain-of-thought", make)


def build_role_based() -> PromptVariant:
    def make(q: str) -> str:
        return f"You are a precise mathematics and trivia assistant.\nQ: {q}\nA:"
    return PromptVariant("role-based", make)
```

**🎯 الناتج المتوقع :**

يُرجع كل `build_*` صيغة مسماة يحقن `build(prompt)` الخاص بها بنية حول السؤال الخام.

**🩹 إذا لم يعمل :**

إذا بدت الصيغ متطابقة، فالبنية المحقونة لا تفعل شيئًا مفيدًا — وسّع الفروقات.

### 2.2 تحقّق من الصيغ

**✅ قائمة التحقق**

- ✅ صيغ `few-shot` و`chain-of-thought` و`role-based` موجودة كلها.
- ✅ يقبل بانٍ كل صيغة سلسلة سؤال ويعيد مطالبة كاملة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- أمثلة الأسلوب القليل الثلث مكتوبة بثبات. متى يكون اختيار الأمثلة تلقائيًا لكل مدخل أفضل؟

## الخطوة 3: ابنِ النموذج المحاكى

نموذج يجيب بشكل صحيح عندما تحتوي المطالبة على تلميح (مثل الكلمة المفتاحية للإجابة) يتيح لك رؤية كيف تغيّر بنية المطالبة النتائج، دون اتصال.

### 3.1 حدّد النموذج

**👟 تلميح البداية :**

أنشئ `optimizer/model.py`.

```python
# optimizer/model.py
import re

class MockModel:
    name = "mock-llm"

    def generate(self, prompt: str) -> str:
        numbers = re.findall(r"(\d+)\s*[*+]\s*(\d+)", prompt)
        if numbers:
            a, b = numbers[-1]
            op = "*" if "*" in prompt else "+"
            a, b = int(a), int(b)
            return str(a * b) if op == "*" else str(a + b)
        if "capital" in prompt.lower():
            return "Tokyo"
        return "unknown"
```

يُرجع المحاكي نتيجة الرياضيات عندما يظهر تعبير حسابي وحقائق من بحث صغير. إنه ساذج عن عمد — ذلك يكفي لإثبات التحسين.

**🎯 الناتج المتوقع :**

يُرجع `MockModel().generate("Think step by step. Q: What is 6 * 7? A:")` قيمة `"42"`.

**🩹 إذا لم يعمل :**

إذا التقط كشف `*`/`+` العامل الخاطئ، تحقّق أن التعبير النمطي يلتقط كلا المعاملين.

### 3.2 تحقّق من النموذج

**✅ قائمة التحقق**

- ✅ يجيب النموذج عن الحساب من المطالبة.
- ✅ يجيب النموذج عن حقيقة معروفة.
- ✅ يُرجع `"unknown"` للمدخل غير المعترف به.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف سيحتاج المحاكي إلى التغيير لمحاكاة نموذج يتحسن *بفضل* التفكير التسلسلي؟

## الخطوة 4: قِس صيغ المطالبات

شغّل كل صيغة مقابل المجموعة الذهبية وقِس الدقة.

### 4.1 نفّذ المُقيِّم

**👟 تلميح البداية :**

أنشئ `optimizer/scoring.py`.

```python
# optimizer/scoring.py
import re
import pandas as pd
from optimizer.data import Question


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def evaluate(variant, model, gold: list[Question]) -> dict:
    correct = 0
    total = len(gold)
    for q in gold:
        full = variant.build(q.input)
        answer = model.generate(full)
        if normalize(answer) == normalize(q.expected):
            correct += 1
    return {"variant": variant.name, "correct": correct, "total": total,
            "accuracy": correct / total}


def evaluate_all(variants, model, gold: list[Question]) -> pd.DataFrame:
    rows = [evaluate(v, model, gold) for v in variants]
    return pd.DataFrame(rows).sort_values("accuracy", ascending=False, kind="stable")
```

**🎯 الناتج المتوقع :**

يُرجع `evaluate_all([v1, v2, v3], model, gold_set())` إطار بيانات يرتّب الصيغ حسب الدقة.

**🩹 إذا لم يعمل :**

إذا سجّلت كل الصيغ نفسها، فإجابات المحاكي لا تعتمد على بنية المطالبة — هذا مقبول للعرض، لكن أضف صيغة يستجيب لها المحاكي بشكل مختلف.

### 4.2 تحقّق من التقييم

**✅ قائمة التحقق**

- ✅ لكل صيغة دقة محسوبة.
- ✅ تُرتَّب النتائج من الأفضل أولًا.
- ✅ تُقيَّم كل صيغة على المجموعة الذهبية كاملة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تخلط الدقة وحدها بين «لم يُجب قط» و«أجاب خطأ». ما المقياس الثاني الذي ستتتبعه؟

## الخطوة 5: صدِّر أفضل مطالبة

التحسين مفيد فقط إذا غيّر ما تشغّله فعلًا. صدّر الصيغة الأولى للاستخدام اللاحق.

### 5.1 ابنِ المُصدِّر

**👟 تلميح البداية :**

أنشئ `optimizer/cli.py`.

```python
# optimizer/cli.py
import json
import click
from optimizer.data import gold_set
from optimizer.variants import build_few_shot, build_chain_of_thought, build_role_based
from optimizer.model import MockModel
from optimizer.scoring import evaluate_all


@click.command()
@click.option("--out", default="best_prompt.json", help="Output file")
def optimize(out: str):
    model = MockModel()
    variants = [build_few_shot(), build_chain_of_thought(), build_role_based()]
    result = evaluate_all(variants, model, gold_set())
    best = result.iloc[0]
    payload = {
        "best_variant": best["variant"],
        "accuracy": float(best["accuracy"]),
        "full_report": result.to_dict(orient="records"),
    }
    with open(out, "w") as f:
        json.dump(payload, f, indent=2)
    click.echo(click.style(f"Best: {best['variant']} ({best['accuracy']:.0%})", fg="green"))
```

**🎯 الناتج المتوقع :**

يجري `uv run python -m optimizer.cli` فيكتب `best_prompt.json` بالصيغة الفائزة والتقرير الكامل.

**🩹 إذا لم يعمل :**

إذا لم يظهر ملف مخرج، تحقّق من مجلد العمل وأن `out` يحل فيه.

### 5.2 تحقّق من CLI

**✅ قائمة التحقق**

- ✅ يجري `uv run python -m optimizer.cli` فيكتب `best_prompt.json`.
- ✅ يرتّب التقرير كل الصيغ حسب الدقة.
- ✅ تُحدَّد أفضل صيغة في مخرج الطرفية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تبلّغ تفاصيل لكل سؤال، وليس إجماليات فقط، لترى *أي* الأسئلة تفوز بها كل صيغة؟

## ⚠️ مآزق شائعة

- **استيرادات دائرية.** `optimizer/router.py` الذي يستورد النموذج والصيغ معًا قد يتجمد. استورد النموذج عميقًا داخل الدالة التي تحتاجه، أو أبقِ `cli.py` كمنسّق أعلى مستوى.
- **توقعات مفرطة في المحاكاة.** محاكي يجيب كل شيء بشكل مثالي يخفي فروق المطالبات الحقيقية. اجعل المحاكي يستجيب لبنية المطالبة بحيث يحسّن المُحسّن فعلًا.
- **فرز التعادلات.** إذا سجّلت كل الصيغ نفسها، فالفرز اعتباطي. أضف مقياسًا ثانويًا (مثل كفاءة الرموز) لكسر التعادلات.
- **أمثلة مكتوبة بثبات.** أمثلة قليلة تسرّب إجابة الاختبار («ما 6*7 → 42») تضخم الدقة. أبقِ المجموعة الذهبية منفصلة عن مجمع الأسلوب القليل.
- **حارس `__main__`.** `app.run` ونقاط دخول CLI تنفّذ فقط عندما تُشغَّل الوحدة مباشرةً. لفّها في `if __name__ == "__main__"` أو شغّلها عبر `python -m`.

## ما بنيته للتو

حلقة تحسين مطالبات: مجموعة بيانات ذهبية، ومولّدات صيغ برمجية (أمثلة قليلة، تفكير تسلسلي، قائمة على الدور)، ونموذج محاكاة دون اتصال، ومُقيِّم دقة، وCLI يرتّب الصيغ ويصدّر الأفضل. هذا هو الإصدار الآلي مما يفعله مهندسو المطالبات يدويًا — ويجعل العملية بأكملها قابلة للتكرار والقياس.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/llm-prompt-optimizer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/llm-prompt-optimizer) في مستودع الدورة نسخة أغنى بمحولات نماذج حقيقية وتقييم كفاءة الرموز وواجهة CLI موصولة من البداية للنهاية. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- وجّه المُحسّن إلى واجهة LLM حقيقية لتراه يحسّن على مهام معتمدة على النموذج فعلًا.
- أضف مقياسًا لعدد الرموز بحيث تفضّل أرخص مطالبة تحقق الدقة المستهدفة.
- ابنِ طبقة إصدارات تسجّل كل صيغة مطالبة ونتيجتها، مثل تاريخ git للمطالبات.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓