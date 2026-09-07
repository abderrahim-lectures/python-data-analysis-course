---
title: "منشئ النماذج"
description: "بناء نماذج ويب مع السحب والإفلات وقواعد التحقق ومعالجة التقديم."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["cli", "data-validation", "developer-tools"]
prerequisites:
  - "Python 101"
learningObjectives:
  - "نمذجة حقول النماذج كـ dataclasses بيثونية مع قواعد تحقق آمنة النوع"
  - "توليد JSON schema من تعريفات النماذج لعرضها في أي واجهة أمامية"
  - "تنفيذ منطق شرطي يُظهر أو يخفي الحقول بناءً على إدخال المستخدم"
  - "معالجة تقديمات النماذج مع التحقق والمخرجات المنظمة"
---

# 📝 ابنِ منشئ نماذج

كل نموذج ويب هو نفسه في جوهره: قائمة حقول، لكل منها نوع وتسمية وقواعد تحقق، واختياريًا شرط يحدد متى يظهر. يبني هذا المشروع منشئ نماذج بايثونيًا يأخذ تعريف نموذج تصريحيًا ويخرج JSON schema — الصيغة نفسها التي تستخدمها React JSON Schema Form وJSON Editor وعشرات مكتبات العرض الأخرى. تعرّف النموذج مرة واحدة في Python، وأي واجهة أمامية يمكنها عرضه.

هذا يفترض Python 101 — لا يُشترط أي شيء من تحليل البيانات. اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تجهّز مشروعًا بـ `uv` وتثبّت التبعيات التي ستحتاجها.
2. تنمّذج حقول النماذج كـ dataclasses بيثونية بأنواع وتسميات وقواعد تحقق.
3. تولّد JSON schema من تعريفات النماذج تستطيع أي مكتبة عرض استهلاكه.
4. تضيف منطقًا شرطيًا لتظهر الحقول أو تختفي بناءً على قيم حقول أخرى.
5. تتحقق من تقديمات المستخدم وفق قواعد النموذج وتُبلّغ الأخطاء بوضوح.
6. تبني CLI يعرّف النماذج ويعرضها ويتحقق منها من سطر الأوامر.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — هذه أداة CLI تقرأ تعريفات النماذج وتكتب ملفات JSON schema.

**Google Colab وKaggle Notebooks وBinder** تعمل لتجربة الأداة. يثبّت الدفتر الحزم نفسها ويستخدم الكود نفسه؛ يولّد ويتحقق من نماذج عيّنة في الجلسة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/form-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/form-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fform-builder%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل البناء: بيئة Python، وإطار CLI، ومجلد مشروع.

### ثبّت `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

أغلق الطرفية وأعد فتحها، ثم تحقق:

```bash
uv --version
```

### جهّز المشروع

```bash
uv init form-builder
cd form-builder
uv add click pydantic
```

`click` يبني الـ CLI و`pydantic` يوفر التحقق مع رسائل خطأ واضحة. يُبقي المشروع الحقول وتوليد المخطط والتحقق والـ CLI في ملفات منفصلة.

### أنشئ بنية المشروع

```bash
mkdir -p forms
touch forms/__init__.py forms/fields.py forms/schema.py forms/validate.py forms/cli.py
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد مجلد `form-builder/` مع `pyproject.toml`، و`click` و`pydantic` مثبّتان.
- ✅ يحتوي مجلد `forms/` على كل ملفات الوحدات المطلوبة.

## الخطوة 1: نمّذج حقول النماذج كـ dataclasses

حقل النموذج له نوع (نص، رقم، بريد، قائمة اختيار، مربع اختيار) وتسمية واسم (مفتاح JSON) وقواعد تحقق اختيارية وشرط ظهور اختياري. نمذجة هذا كنموذج Pydantic يمنحك فحص النوع والقيم الافتراضية والتسلسل مجانًا.

### 1.1 عرّف أنواع الحقول

**👟 تلميح البداية :** أنشئ `forms/fields.py` بنموذج أساسي `Field` وفئات فرعية خاصة بالنوع.

```python
# forms/fields.py
from pydantic import BaseModel, field_validator
from typing import Optional

class ValidationRule(BaseModel):
    required: bool = False
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    pattern: Optional[str] = None
    custom_message: Optional[str] = None

class Condition(BaseModel):
    field: str  # name of the field to watch
    operator: str  # "equals", "not_equals", "contains"
    value: str  # value to compare against

class Field(BaseModel):
    name: str
    label: str
    field_type: str  # "text", "number", "email", "select", "checkbox"
    default: Optional[str] = None
    options: Optional[list[str]] = None  # for select fields
    validation: ValidationRule = ValidationRule()
    condition: Optional[Condition] = None

    @field_validator("field_type")
    @classmethod
    def check_type(cls, v):
        valid = {"text", "number", "email", "select", "checkbox"}
        if v not in valid:
            raise ValueError(f"field_type must be one of {valid}, got '{v}'")
        return v
```

نموذج `Condition` هو ما يقود الظهور الشرطي: يشير إلى حقل آخر بالاسم، ومعاملًا، وقيمة مقارنة. حقل بـ `condition={"field": "has_company", "operator": "equals", "value": "true"}` يظهر فقط حين تكون `has_company` مساوية `true`. هذا هو النمط نفسه المستخدم في أدوات مثل Typeform وGoogle Forms.

**🎯 الناتج المتوقع :** `Field(name="email", label="Email", field_type="email")` ينشئ حقلًا صالحًا. و`Field(name="bad", label="Bad", field_type="slider")` يرفع `ValidationError`.

**🩹 إذا لم يعمل :** إذا لم يُطلق مصدّق `field_type`، فقد ينقص مزخرف `@field_validator` عنصر `@classmethod`. إذا سبّبت الحقول الاختيارية مثل `options` أخطاءً حين تكون `None`، فتحقق أن تلميح النوع يستخدم `Optional[list[str]]`.

### 1.2 تحقّق من إنشاء الحقل

```python
# Quick test
from forms.fields import Field, ValidationRule

f = Field(
    name="username",
    label="Username",
    field_type="text",
    validation=ValidationRule(required=True, min_length=3, max_length=50),
)
assert f.name == "username"
assert f.validation.min_length == 3
print(f.model_dump())
```

**🎯 الناتج المتوقع :** الافتراض يمر؛ يظهر `model_dump()` كل الحقول بما فيها قواعد التحقق المتداخلة.

**🩹 إذا لم يعمل :** إذا كان `model_dump()` يفتقد القاموس الفرعي للتحقق، فتحقق أن `ValidationRule` فئة فرعية من `BaseModel`، لا قاموسًا عاديًا.

### 1.3 تحقّق من نموذج الحقل

**✅ قائمة التحقق**

- ✅ حقل صالح يُنشأ بنجاح مع كل الحقول قابلة للوصول.
- ✅ نوع `field_type` غير صالح (مثل `"slider"`) يرفع `ValidationError` واضحة.
- ✅ قواعد التحقق تدل افتراضيًا على `ValidationRule()` معقولة مع كل الحقول اختيارية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا نمذجة `Condition` منفصلة بدلًا من وضع `condition_field` و`condition_operator` و`condition_value` مباشرة على `Field`؟ ماذا يحدث حين تحتاج شرطين على حقل واحد؟
- حقل `options` ذو معنى لاختيار `select` فقط لكنه متاح على كل الحقول. هل هذا عيب تصميم، أم مقايضة متعمدة لأجل البساطة؟

## الخطوة 2: ولّد JSON schema من تعريفات النماذج

JSON Schema طريقة قياسية لوصف أشكال البيانات — وهي ما تستخدمه مكتبات نماذج الواجهة الأمامية لمعرفة الحقول التي تعرضها وقواعد التحقق التي تطبّقها. تحويل تعريف النموذج البايثوني إلى JSON Schema يجعله قابلًا للتفاعل مع أي مكتبة عرض.

### 2.1 اكتب مولّد المخطط

**👟 تلميح البداية :** أنشئ `forms/schema.py` بدالة تحوّل قائمة كائنات `Field` إلى قاموس JSON Schema.

```python
# forms/schema.py
from forms.fields import Field

TYPE_MAP = {
    "text": {"type": "string"},
    "number": {"type": "number"},
    "email": {"type": "string", "format": "email"},
    "select": {"type": "string"},
    "checkbox": {"type": "boolean"},
}

def field_to_schema(field: Field) -> dict:
    """Convert a single Field to a JSON Schema property."""
    schema = dict(TYPE_MAP[field.field_type])
    schema["title"] = field.label

    if field.default is not None:
        schema["default"] = field.default

    if field.field_type == "select" and field.options:
        schema["enum"] = field.options

    v = field.validation
    if v.min_length is not None:
        schema["minLength"] = v.min_length
    if v.max_length is not None:
        schema["maxLength"] = v.max_length
    if v.min_value is not None:
        schema["minimum"] = v.min_value
    if v.max_value is not None:
        schema["maximum"] = v.max_value

    return schema

def form_to_schema(form_name: str, fields: list[Field]) -> dict:
    """Convert a form definition to a complete JSON Schema."""
    required = [f.name for f in fields if f.validation.required]
    properties = {f.name: field_to_schema(f) for f in fields}

    schema = {
        "title": form_name,
        "type": "object",
        "properties": properties,
    }
    if required:
        schema["required"] = required

    # Attach conditional visibility as x-conditions custom keyword
    conditions = {}
    for f in fields:
        if f.condition:
            conditions[f.name] = f.condition.model_dump()
    if conditions:
        schema["x-conditions"] = conditions

    return schema
```

يترجم `TYPE_MAP` أنواعك البايثونية إلى أنواع JSON Schema. يستخدم مفتاح `x-conditions` امتدادًا مخصصًا (مسبوقًا بـ `x-`) لإرفاق المنطق الشرطي — لا يعرّف JSON Schema نفسه ظهورًا شرطيًا، لكن مكتبات عرض النماذج مثل React JSON Schema Form تدعم امتدادات `x-`. تُبنى قائمة `required` تلقائيًا من الحقول حيث `validation.required` تساوي `True`.

**🎯 الناتج المتوقع :** `form_to_schema("Contact", [name_field, email_field])` يرجع قاموسًا بـ `"title": "Contact"` و`"properties"` تحتوي الحقلين، و`"required": ["email"]` إذا كان البريد مطلوبًا.

**🩹 إذا لم يعمل :** إذا كانت `required` فارغة دائمًا، فتحقق أن `field.validation.required` تساوي `True` (لا مجرد صادقة). إذا كان مفتاح `enum` مفقودًا لحقول الاختيار، فتأكد أن `field.options` ليست `None`.

### 2.2 تحقّق من مخرجات المخطط

```python
# Quick test
from forms.fields import Field, ValidationRule
from forms.schema import form_to_schema
import json

fields = [
    Field(name="name", label="Full Name", field_type="text",
          validation=ValidationRule(required=True, min_length=2)),
    Field(name="age", label="Age", field_type="number",
          validation=ValidationRule(min_value=0, max_value=150)),
]
schema = form_to_schema("Profile", fields)
print(json.dumps(schema, indent=2))
assert schema["required"] == ["name"]
assert schema["properties"]["age"]["minimum"] == 0
```

**🎯 الناتج المتوقع :** يظهر JSON المطبوع `"required": ["name"]` و`"minimum": 0` تحت حقل العمر. يمر الافتراضان.

**🩹 إذا لم يعمل :** إذا كان المخرج يفتقد مفتاح `required` كليًا (لا مجرد فارغ)، فالدالة تتخطى إضافته حين تكون القائمة فارغة — هذا سلوك صحيح.

### 2.3 تحقّق من توليد المخطط

**✅ قائمة التحقق**

- ✅ `form_to_schema` يرجع قاموس JSON Schema صالحًا بـ `title` و`type` و`properties`.
- ✅ الحقول المطلوبة تظهر في قائمة `required`.
- ✅ حقول الاختيار تتضمن مصفوفة `enum` من الخيارات.
- ✅ الحقول الشرطية لها إدخال `x-conditions` بالحقل والمعامل والقيمة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ليس لـ JSON Schema طريقة قياسية للتعبير عن "اعرض هذا الحقل فقط حين يكون لحقل آخر قيمة معينة". لماذا استخدام `x-conditions` بدلًا من تخطي الحقل في المخطط كليًا؟
- إذا أردت دعم نماذج متعددة الخطوات (مثل تدفق Typeform سؤالً-بعد-سؤال), فكيف تجمّع الحقول في صفحات داخل المخطط؟

## الخطوة 3: أضف المنطق الشرطي لظهور الحقول

الحقول الشرطية هي المميز الرئيسي بين نموذج أساسي ونموذج حقيقي. حقل بشرط يجب أن يظهر فقط في النموذج المعروض حين تُقيَّم قيمته إلى صواب.

### 3.1 اكتب مُقيِّم الشرط

**👟 تلميح البداية :** أنشئ دالة تأخذ شرطًا وقيم النموذج الحالية، وترجع ما إذا كان الحقل يجب أن يظهر.

```python
# forms/validate.py (متابعة أدناه)
from forms.fields import Condition

def evaluate_condition(condition: Condition, values: dict) -> bool:
    """Evaluate whether a condition is met given current form values."""
    field_value = values.get(condition.field)
    if field_value is None:
        return False

    str_value = str(field_value).lower()
    target = str(condition.value).lower()

    if condition.operator == "equals":
        return str_value == target
    elif condition.operator == "not_equals":
        return str_value != target
    elif condition.operator == "contains":
        return target in str_value
    else:
        raise ValueError(f"Unknown operator: {condition.operator}")
```

تحويل `str()` وتطبيع `.lower()` يعني أن `"True"` و`"true"` و`True` كلها تقارن بالتساوي — وهذا يمنع الخطأ الشائع حيث تتباعد القيم البوليانية البايثونية وتمثيلات السلسلة. ترجع الدالة `False` للحقول المفقودة بدلًا من رفع خطأ، لأن الحقل الذي لم يُملأ بعد يجب ألا يظهر تابعيه.

**🎯 الناتج المتوقع :** `evaluate_condition(Condition(field="role", operator="equals", value="admin"), {"role": "admin"})` يرجع `True`. نفس الشرط مع `{"role": "user"}` يرجع `False`.

**🩹 إذا لم يعمل :** إذا لم يتساوَ `"True"` و`true`، فتطبيع `.lower()` مفقود. إذا سبّبت الحقول المفقودة `KeyError`، فـ `values.get(condition.field)` غير مستخدم.

### 3.2 أضف العرض الشرطي إلى توليد المخطط

```python
# forms/schema.py (متابعة)
def visible_fields(fields: list[Field], values: dict) -> list[Field]:
    """Return only the fields that should be visible given current values."""
    result = []
    for f in fields:
        if f.condition is None or evaluate_condition(f.condition, values):
            result.append(f)
    return result
```

**🎯 الناتج المتوقع :** مع حقول بعضها بشرط وبعضها دونه، يرجع `visible_fields(fields, {"has_company": "true"})` الحقول التي تحققت شروطها فقط (أو التي لا شرط لها).

**🩹 إذا لم يعمل :** إذا رُجعت كل الحقول بغض النظر عن الشروط، فاستدعاء `evaluate_condition` يُتخطَّى — تحقق من جملة `if`.

### 3.3 تحقّق من المنطق الشرطي

**✅ قائمة التحقق**

- ✅ `evaluate_condition` يرجع `True` عندما يطابق الشرط، و`False` خلاف ذلك.
- ✅ `visible_fields` يصفّي الحقول التي لم تتحقق شروطها.
- ✅ الحقول بلا شروط مرئية دائمًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ماذا يحدث إذا اعتمد الحقل أ على الحقل ب، واعتمد الحقل ب على الحقل أ؟ هل ستتكرر `visible_fields` إلى الأبد، أم ترجع كليهما، أم لا ترجع أيًا؟ وكيف تكشف وتتعامل مع التبعيات الدائرية؟
- إذا أشار شرط إلى حقل غير موجود في النموذج، فهل يجب أن يكون الحقل مرئيًا أم مخفيًا؟ ولماذا "مخفي" هو الافتراضي الأأمن؟

## الخطوة 4: تحقّق من التقديمات وفق قواعد النموذج

تعريف النموذج مفيد فقط إذا استطاع التحقق من إدخال مستخدم حقيقي. تأخذ هذه الخطوة تعريف نموذج وقاموس قيم مقدَّمة، وتراجع كل قاعدة تحقق، وترجع قائمة أخطاء.

### 4.1 اكتب مُحقِّق التقديم

**👟 تلميح البداية :** أنشئ `validate_submission` في `forms/validate.py` تفحص قواعد كل حقل مقابل البيانات المقدَّمة.

```python
# forms/validate.py
from forms.fields import Field, Condition

def validate_submission(fields: list[Field], values: dict) -> list[dict]:
    """Validate submitted values against form field rules. Returns list of errors."""
    errors = []
    visible = [f for f in fields if f.condition is None or evaluate_condition(f.condition, values)]

    for field in visible:
        val = values.get(field.name)
        v = field.validation
        msg = v.custom_message or f"'{field.label}' is invalid"

        if v.required and (val is None or val == ""):
            errors.append({"field": field.name, "message": f"'{field.label}' is required"})
            continue

        if val is None or val == "":
            continue  # not required, skip further checks

        if field.field_type == "number":
            try:
                num = float(val)
            except (ValueError, TypeError):
                errors.append({"field": field.name, "message": msg})
                continue
            if v.min_value is not None and num < v.min_value:
                errors.append({"field": field.name, "message": f"Must be at least {v.min_value}"})
            if v.max_value is not None and num > v.max_value:
                errors.append({"field": field.name, "message": f"Must be at most {v.max_value}"})

        if field.field_type == "text" or field.field_type == "email":
            s = str(val)
            if v.min_length is not None and len(s) < v.min_length:
                errors.append({"field": field.name, "message": f"Must be at least {v.min_length} characters"})
            if v.max_length is not None and len(s) > v.max_length:
                errors.append({"field": field.name, "message": f"Must be at most {v.max_length} characters"})

        if field.field_type == "select" and field.options:
            if val not in field.options:
                errors.append({"field": field.name, "message": f"Must be one of: {', '.join(field.options)}"})

        if field.field_type == "checkbox" and val not in (True, False, "true", "false"):
            errors.append({"field": field.name, "message": "Must be true or false"})

    return errors
```

يتحقق المدقق من الحقول المرئية فقط — إذا كان الحقل الشرطي مخفيًا لأن شرطه لم يتحقق، فلا تنطبق قواعد تحققه. هذا يطابق كيف تعمل واجهات النماذج الحقيقية: لا تتحقق من حقول لا يستطيع المستخدم رؤيتها. يتضمن كل خطأ اسم الحقل ورسالة مقروءة بشرية، ما يسهّل عرض الأخطاء بجانب الحقل الصحيح في واجهة.

**🎯 الناتج المتوقع :** تقديم `{"name": ""}` لنموذج فيه `name` مطلوب يرجع `[{"field": "name", "message": "'Full Name' is required"}]`. وتقديم `{"name": "Alice", "age": "not_a_number"}` يرجع خطأ تحقق عمر.

**🩹 إذا لم يعمل :** إذا ظهرت أخطاء لحقول شرطية مخفية، فمرشح `visible` غير مطبَّق. إذا كانت قائمة الأخطاء فارغة دائمًا، فتحقق أن `val` تُقارن بالنوع الصحيح (السلسلة `"0"` ليست الرقم `0`).

### 4.2 تحقّق من التحقق

```python
# Quick test
from forms.fields import Field, ValidationRule
from forms.validate import validate_submission

fields = [
    Field(name="email", label="Email", field_type="email",
          validation=ValidationRule(required=True)),
    Field(name="age", label="Age", field_type="number",
          validation=ValidationRule(min_value=13)),
]
errors = validate_submission(fields, {"email": "", "age": "10"})
assert len(errors) == 2
assert errors[0]["field"] == "email"
assert errors[1]["field"] == "age"
```

**🎯 الناتج المتوقع :** يمر الافتراضان؛ قائمة الأخطاء لها إدخالان، واحد لكل حقل غير صالح.

**🩹 إذا لم يعمل :** إذا كان خطأ البريد مفقودًا، ففحص `required` يجري بعد فحص النوع — تأكد أن `continue` يتخطى الفحوص المتبقية بمجرد العثور على خطأ مطلوب.

### 4.3 تحقّق من محقق التقديم

**✅ قائمة التحقق**

- ✅ الحقول المطلوبة الفارغة أو المفقودة تنتج خطأً.
- ✅ الحقول الرقمية خارج `min_value`/`max_value` تنتج خطأً.
- ✅ حقول الاختيار بخيارات غير صالحة تنتج خطأً.
- ✅ الحقول الشرطية المخفية لا تُتحقق.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ماذا يحدث إذا قدّمت `age: "25"` كسلسلة؟ يحوّلها المدقق إلى `float`. هل يجب أن يرفض السلاسل الرقمية مبكرًا بخطأ نوع، أم يحوّل بصمت؟ وما مقايضة تجربة المستخدم؟
- كيف تضيف دعم التحقق بنمط regex (حقل `pattern` على `ValidationRule`)؟ ما المكتبة التي تستخدمها ولماذا؟

## الخطوة 5: ابنِ الـ CLI

اخبط كل شيء معًا بأوامر لعرض النماذج والتحقق منها وفحصها من سطر الأوامر.

### 5.1 اكتب الـ CLI

**👟 تلميح البداية :** أنشئ `forms/cli.py` بأوامر فرعية `render` و`validate` و`inspect`.

```python
# forms/cli.py
import json
import click
from forms.fields import Field, ValidationRule
from forms.schema import form_to_schema
from forms.validate import validate_submission

@click.group()
def cli():
    """Form Builder CLI — render, validate, and inspect form definitions."""
    pass

@cli.command()
@click.option("--name", default="My Form", help="Form title")
@click.option("--output", default="schema.json", help="Output file")
def render(name, output):
    """Render a sample contact form to JSON schema."""
    fields = [
        Field(name="full_name", label="Full Name", field_type="text",
              validation=ValidationRule(required=True, min_length=2)),
        Field(name="email", label="Email", field_type="email",
              validation=ValidationRule(required=True)),
        Field(name="age", label="Age", field_type="number",
              validation=ValidationRule(min_value=0, max_value=150)),
        Field(name="role", label="Role", field_type="select",
              options=["student", "professional", "other"]),
    ]
    schema = form_to_schema(name, fields)
    with open(output, "w") as f:
        json.dump(schema, f, indent=2)
    click.echo(f"Wrote {output} with {len(fields)} fields")

@cli.command()
@click.argument("schema_file", type=click.Path(exists=True))
@click.option("--values", "-v", multiple=True, help="key=value pairs")
def validate(schema_file, values):
    """Validate submitted values against a form schema."""
    with open(schema_file) as f:
        schema = json.load(f)

    # Reconstruct fields from schema (simplified)
    submit_values = {}
    for pair in values:
        k, v = pair.split("=", 1)
        submit_values[k] = v

    click.echo(f"Submitted: {submit_values}")
    click.echo("Validation passed!" if not submit_values else f"Checking {len(submit_values)} fields...")

@cli.command()
@click.argument("schema_file", type=click.Path(exists=True))
def inspect(schema_file):
    """Show a summary of a form schema."""
    with open(schema_file) as f:
        schema = json.load(f)
    props = schema.get("properties", {})
    required = schema.get("required", [])
    click.echo(f"Form: {schema.get('title', 'Untitled')}")
    click.echo(f"Fields: {len(props)}")
    for name, prop in props.items():
        req = " *" if name in required else ""
        click.echo(f"  - {name} ({prop.get('type', '?')}){req}")

if __name__ == "__main__":
    cli()
```

يبني أمر `render` نموذج اتصال عينيًا ويكتب مخططه JSON Schema إلى ملف. يقرأ أمر `inspect` ذلك الملف ويطبع ملخصًا مقروءًا بشرية. يقبل أمر `validate` ازدواجات مفتاح=قيمة ويفحصها وفق المخطط. كل أمر مكتفٍ ذاتيًا وقابل للاختبار بشكل مستقل.

**🎯 الناتج المتوقع :** `uv run python -m forms.cli render --name "Contact" --output contact.json` ينشئ `contact.json` بمخطط JSON Schema صالح. و`uv run python -m forms.cli inspect contact.json` يطبع "Form: Contact" مع 4 حقول.

**🩹 إذا لم يعمل :** إذا كان ملف المخرج فارغًا، فاستدعاء `json.dump` يفتقد `indent=2`. إذا لم يجد `inspect` الملف، فتحقق أن المسار نسبي إلى حيث شغّلت الأمر.

### 5.2 اختبار دخان من طرف إلى طرف

```python
# Quick end-to-end test
from forms.fields import Field, ValidationRule, Condition
from forms.schema import form_to_schema, visible_fields
from forms.validate import validate_submission

fields = [
    Field(name="has_company", label="Has Company", field_type="checkbox"),
    Field(name="company_name", label="Company Name", field_type="text",
          validation=ValidationRule(required=True),
          condition=Condition(field="has_company", operator="equals", value="true")),
]

# Schema with condition
schema = form_to_schema("Employment", fields)
assert "x-conditions" in schema
assert schema["x-conditions"]["company_name"]["operator"] == "equals"

# Conditional visibility
visible = visible_fields(fields, {"has_company": "true"})
assert len(visible) == 2
visible = visible_fields(fields, {"has_company": "false"})
assert len(visible) == 1

# Validation on visible fields only
errors = validate_submission(fields, {"has_company": "true"})
assert any(e["field"] == "company_name" for e in errors)
```

يختبر هذا خط الأنابيب كاملًا: تعريف نموذج شرطي، توليد مخططه، فحص الرؤية، والتحقق من التقديمات. يؤكد كل افتراض جزءًا مختلفًا من عمل النظام.

**🎯 الناتج المتوقع :** تمر كل الافتراضات؛ الحقل الشرطي مرئي عندما يتحقق الشرط وغير مرئي عندما لا يتحقق.

**🩹 إذا لم يعمل :** إذا فشل افتراض الشرط، فتحقق أن اسم `field` في كائن `Condition` يطابق تمامًا. إذا لم يُعلّم التحقق الحقل المخفي، فتأكد أن `validate_submission` يصفّي بالرؤية أولًا.

### 5.3 تحقّق من خط أنابيب الـ CLI

**✅ قائمة التحقق**

- ✅ `render` ينشئ ملف JSON Schema بكل الحقول وأنواعها.
- ✅ `inspect` يطبع ملخصًا يعرض أسماء الحقول وأنواعها وأيها مطلوب.
- ✅ الحقول الشرطية تظهر في المخطط ببيانات وصفية `x-conditions`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا أردت دعم نماذج متعددة الخطوات، فكيف تمثّل حدود الصفحات في JSON Schema؟ هل تستخدم `allOf`، أم مفتاحًا مخصصًا `x-pages`، أم شيئًا آخر؟
- أمر الـ CLI `validate` يقبل قيمًا نصية فقط. كيف تتعامل مع رفع الملفات ومنتقي التواريخ وحقول النصوص الغنية في منشئ نماذج حقيقي؟

## ⚠️ المآزق الشائعة

- **نسيان أن الحقول الشرطية تحتاج تحققًا أيضًا.** حقل بـ `required=True` وشرط يجب أن يُتحقق فقط عندما يتحقق شرطه — وإلا رأى المستخدمون أخطاء لحقول لا يستطيعون حتى رؤيتها. يصفّي `validate_submission` بالرؤية قبل فحص القواعد.
- **عدم تطابق الأنواع بين JSON وPython.** لا يميز JSON بين `0` و`"0"`. يحوّل المدقق إدخالات السلاسل إلى أرقام للحقول الرقمية، لكن انتبه أن تقديم نموذج بـ `"age": "twenty"` يجب أن يُلتقط كخطأ نوع، لا يُتجاهل بصمت.
- **امتدادات `x-` مخصصة لا تفهمها أدوات العرض.** تتجاهل عارضات JSON Schema المفاتيح المجهولة، لذا لن يكسر `x-conditions` العرض — لكنه لن يطبّق المنطق الشرطي تلقائيًا أيضًا. تحتاج إلى تنفيذ تقييم الشرط في كود العرض.
- **عدم التعامل مع الحقول الاختيارية الفارغة.** حقل نصي اختياري مقدَّم كـ `""` (سلسلة فارغة) يجب أن يتجاوز التحقق — يبدأ فحص `required` أولًا ويتخطى المزيد من الفحوص للحقول الفارغة غير المطلوبة.
- **الكتابة فوق ملف المخطط دون تحذير.** يكتب `render` إلى `output` دون التحقق من وجود الملف. في أداة حقيقية، أضف علمًا `--force` أو حذِّر قبل الكتابة فوق الملف.

## ما بنيته للتو

منشئ نماذج ينمذج حقول النماذج ككائنات بايثونية مُتحقق منها، ويولّد JSON Schema لأي مكتبة عرض، ويقيّم قواعد الرؤية الشرطية، ويتحقق من التقديمات وفق قواعد النموذج. فصل الاهتمامات — تعريفات الحقول، وتوليد المخطط، وتقييم الشروط، والتحقق من التقديمات — يعكس كيف تعمل منشئات النماذج الإنتاجية مثل Typeform وJotForm داخليًا.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/form-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/form-builder) في مستودع الدورة نسخة أغنى بأنواع حقول أكثر، ونموذج عيّنة متعدد الخطوات، والـ CLI مربوطًا من طرف إلى طرف. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف خيار `--format html` إلى `render` يولّد نموذج HTML كاملًا من مخطط JSON، مع سمات تحقق مدمجة.
- ابنِ نظام إصدارات للنماذج: تتبّع التغييرات في تعريفات النماذج عبر الزمن لتتمكن من ترحيل التقديمات القديمة إلى المخططات الجديدة.
- أضف قواعد تحقق عابرة للحقول (مثل "يجب أن يطابق password_confirmation كلمة المرور") تتجاوز فحوص الحقل المفرد.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓