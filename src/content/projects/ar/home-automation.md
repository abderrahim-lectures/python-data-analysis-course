---
title: "مركز أتمتة المنزل"
description: "أتمتة أجهزة المنزل مع القواعد والجداول والأوامر الصوتية وكشف الحضور."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["iot", "cli", "async"]
learningObjectives:
  - "نمذجة أجهزة المنزل وقواعد الأتمتة كفئات بيانات Python"
  - "تنفيذ محرك محفز-فعل يقيم القواعد مقابل حالة الجهاز"
  - "بناء نظام جدولة للأتمتة المبنية على الوقت"
  - "كشف الحضور من أوامر ping على الشبكة وتفعيل سلاسل القواعد"
prerequisites: ["Python 101"]
---

# 🏠 ابنِ مركز أتمتة المنزل

منزلك الذكي ذكي بقدر القواعد التي تربط أجهزته — مستشعر حركة يشغّل ضوءًا، وثرموستات يضبط عند مغادرتك، وقفل باب يشغّل وقت النوم. يبني هذا المشروع محرك أتمتة منزلية مبنية على القواعد في Python: تعرّف أجهزة (أضواء، ثرموستات، أقفال)، وتكتب قواعد إذا-هذا-فإن-ذاك، وتجدول محفزات مبنية على الوقت، وتكشف الحضور من أوامر ping على الشبكة. يعمل المحرك محليًا، ويعالج الأحداث، وينفذ الأفعال — دون أي خدمة سحابية.

يفترض هذا معرفة Python 101 — لا يلزم شيء من تحليل البيانات. اختياري وغير مُقيَّم؛ انظر [مشاريع واقعية](/ar/مشاريع) للقائمة الكاملة.

## 🎯 ما ستفعله

1. إعداد مشروع بـ`uv` وتثبيت التبعيات التي ستحتاجها.
2. نمذجة أجهزة المنزل (أضواء، ثرموستات، أقفال) كفئات بايثونية بحالة.
3. بناء محرك قواعد يقيم أزواج المحفز-الفعل مقابل حالة الجهاز الحالية.
4. تنفيذ جدولة مبنية على الوقت للأتمتة المتكررة.
5. إضافة كشف حضور يراقب أوامر ping للأجهزة على الشبكة.
6. ربط كل شيء في CLI يسجّل الأجهزة، ويكتب القواعد، ويشغّل المحرك.

## أين تُشغّل هذا

**محليًا عبر `uv`** هو المسار الأساسي — هذا المشروع يحاكي أوامر ping للشبكة ويشغّل محرك قواعد يعالج الأحداث في حلقة. مصمَّم للعمل على جهاز متصل بشبكة منزلك.

**Google Colab وKaggle Notebooks وBinder** تعمل لتجربة الأداة. يستخدم الدفتر حالات جهاز محاكاة وأوامر ping وهمية بدل حركة شبكة حقيقية.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/home-automation/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/home-automation/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fhome-automation%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل البناء: بيئة Python، ومكتبة جدولة، ومجلد مشروع.

### ثبّت `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

أغلق الطرفية وأعد فتحها، ثم أكّد:

```bash
uv --version
```

### هيّئ المشروع

```bash
uv init home-automation
cd home-automation
uv add click schedule
```

`click` يبني واجهة CLI، و`schedule` يتولى جدولة المهام المبنية على الوقت. يُبقي المشروع الأجهزة والقواعد والجدولة والحضور وCLI في ملفات منفصلة.

### أنشئ بنية المشروع

```bash
mkdir -p hub
touch hub/__init__.py hub/devices.py hub/rules.py hub/scheduler.py hub/presence.py hub/engine.py hub/cli.py
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `home-automation/` مع `pyproject.toml`، و`click` و`schedule` مثبتتان.
- ✅ مجلد `hub/` يحوي كل ملفات الوحدات المطلوبة.

## الخطوة 1: نمذج أجهزة المنزل

لكل جهاز منزل ذكي نوع (ضوء، ثرموستات، قفل)، واسم، وموقع، وحالة (تشغيل/إيقاف، درجة حرارة، مقفل/غير مقفل). نمذجة الأجهزة كفئات بطرق مثل `turn_on()` و`set_temperature()` تمنحك API نظيفًا يدعوه محرك القواعد.

### 1.1 عرّف فئات الأجهزة

**👟 تلميح البداية :** أنشئ `hub/devices.py` بفئة `Device` أساسية وفئات فرعية خاصة بالنوع.

```python
# hub/devices.py
from dataclasses import dataclass, field

@dataclass
class Device:
    id: str
    name: str
    location: str
    device_type: str

    def set_state(self, **kwargs):
        for k, v in kwargs.items():
            if hasattr(self, f"_{k}"):
                setattr(self, f"_{k}", v)

@dataclass
class Light(Device):
    _is_on: bool = False
    _brightness: int = 100

    @property
    def is_on(self): return self._is_on

    def turn_on(self, brightness: int = 100):
        self._is_on = True
        self._brightness = brightness

    def turn_off(self):
        self._is_on = False

    def toggle(self):
        if self._is_on:
            self.turn_off()
        else:
            self.turn_on()

@dataclass
class Thermostat(Device):
    _temperature: float = 70.0
    _target: float = 72.0

    @property
    def temperature(self): return self._temperature

    @property
    def target(self): return self._target

    def set_target(self, temp: float):
        self._target = temp

@dataclass
class Lock(Device):
    _locked: bool = True

    @property
    def is_locked(self): return self._locked

    def lock(self):
        self._locked = True

    def unlock(self):
        self._locked = False
```

كل فئة جهاز تخزّن الحالة القابلة للتغيير في حقول مسبوقة بشرطة سفلية (`_is_on`، `_temperature`) مع لواصق الوصول `@property`. هذا يُبقي API العام نظيفًا (`light.is_on`) مع السماح بالتغيير عبر الطرائق (`light.turn_on()`). فئة `Device` الأساسية توفر `set_state` عامًا ليستخدمه محرك القواعد دون معرفة نوع الجهاز المحدد.

**🎯 الناتج المتوقع :** `Light(id="l1", name="Living Room", location="Living Room")` ينشئ ضوءًا يبدأ مطفأً. و`light.turn_on()` يضبط `light.is_on` على `True`.

**🩹 إذا لم يعمل :** إذا بقي `is_on` `False` دائمًا بعد `turn_on()`، فالخاصية تقرأ القيمة الافتراضية على مستوى الفئة لا `_is_on` الخاص بالمثيل. تأكد أن `@property` معرّفة على الفئة، لا في `__init__`.

### 1.2 ابنِ سجل أجهزة

```python
# hub/devices.py (متابعة)
class DeviceRegistry:
    def __init__(self):
        self.devices: dict[str, Device] = {}

    def register(self, device: Device):
        self.devices[device.id] = device

    def get(self, device_id: str) -> Device | None:
        return self.devices.get(device_id)

    def by_location(self, location: str) -> list[Device]:
        return [d for d in self.devices.values() if d.location == location]
```

**🎯 الناتج المتوقع :** `registry.register(light)` يجعل الضوء قابلًا للإيجاد بالمعرّف وبالموقع.

**🩹 إذا لم يعمل :** إذا رجعت `by_location` قائمة فارغة دائمًا، فتحقق أن خيوط المواقع تطابق بالضبط (حساسة لحالة الأحرف).

### 1.3 تحقق من نمذجة الأجهزة

**✅ قائمة التحقق**

- ✅ تبدأ `Light` و`Thermostat` و`Lock` بقيم افتراضية معقولة.
- ✅ طرائق مثل `turn_on()` و`set_target()` و`lock()` تغيّر حالة الجهاز.
- ✅ يجد `DeviceRegistry` الأجهزة بالمعرّف وبالموقع.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا استخدام `@property` لـ`is_on` بدل كشف `_is_on` مباشرةً؟ ماذا تشتريه الوسيطة حين تضيف لاحقًا تسجيلًا أو إصدار أحداث؟
- إذا أضفت نوع جهاز جديد (مثلًا `Speaker`)، فما أدنى واجهة يحتاج تنفيذها ليتحكم به محرك القواعد؟

## الخطوة 2: ابنِ محرك قواعد المحفز-الفعل

محرك القواعد دماغ المنزل: يراقب الأحداث (تشتعل السليم، انخفاض درجة الحرارة دون عتبة، انفتاح باب) وينفذ أفعالًا (إرسال إشعار، ضبط جهاز آخر، تسجيل إدخال). كل قاعدة زوج إذا-هذا-فإن-ذاك.

### 2.1 عرّف القواعد والمقيِّم

**👟 تلميح البداية :** أنشئ `hub/rules.py` بفئة بيانات `Rule` ودالة `evaluate_rules`.

```python
# hub/rules.py
from dataclasses import dataclass
from typing import Callable
from hub.devices import DeviceRegistry

@dataclass
class Condition:
    device_id: str
    attribute: str  # "is_on", "temperature", "is_locked"
    operator: str   # "equals", "not_equals", "greater_than", "less_than"
    value: str      # compared as string, cast internally

@dataclass
class Action:
    device_id: str
    method: str     # "turn_on", "turn_off", "set_target", "lock", "unlock"
    args: dict = None

@dataclass
class Rule:
    name: str
    trigger: str  # "state_change", "schedule", "presence"
    conditions: list[Condition]
    actions: list[Action]
    enabled: bool = True

def evaluate_condition(condition: Condition, registry: DeviceRegistry) -> bool:
    """Check if a single condition is true given current device state."""
    device = registry.get(condition.device_id)
    if device is None:
        return False
    attr_val = getattr(device, condition.attribute, None)
    if attr_val is None:
        return False

    target = condition.value
    if condition.operator == "equals":
        return str(attr_val) == target
    elif condition.operator == "not_equals":
        return str(attr_val) != target
    elif condition.operator == "greater_than":
        return float(attr_val) > float(target)
    elif condition.operator == "less_than":
        return float(attr_val) < float(target)
    return False

def evaluate_rules(
    rules: list[Rule],
    registry: DeviceRegistry,
    event_device_id: str | None = None,
) -> list[tuple[Rule, list[str]]]:
    """Evaluate all enabled rules and return those that fire with their action logs."""
    results = []
    for rule in rules:
        if not rule.enabled:
            continue
        all_met = all(evaluate_condition(c, registry) for c in rule.conditions)
        if not all_met:
            continue
        logs = []
        for action in rule.actions:
            device = registry.get(action.device_id)
            if device is None:
                logs.append(f"  SKIP: device {action.device_id} not found")
                continue
            method = getattr(device, action.method, None)
            if method is None:
                logs.append(f"  SKIP: {action.device_id} has no method {action.method}")
                continue
            args = action.args or {}
            method(**args)
            logs.append(f"  ACTION: {action.device_id}.{action.method}({args})")
        results.append((rule, logs))
    return results
```

تقارن دالة `evaluate_condition` سمة جهاز (`is_on`، `temperature`) مقابل قيمة الشرط باستخدام العامل المحدد. يشغّل `evaluate_rules` كل القواعد المفعّلة ويجمع تلك التي تحققت شروطها جميعًا — فحص "كل الشروط" يعني أنه يجب أن تكون كل شروط القاعدة صحيحة كي تشتعل القاعدة. حين تشتعل قاعدة، تنفذ كل فعلٍ باستدعاء الطريقة المسماة على الجهاز المستهدف.

**🎯 الناتج المتوقع :** قاعدة بشرط `thermostat.temperature < 68` تشعل `light.turn_on()` عندما يقرأ الثرموستات درجة 65.

**🩹 إذا لم يعمل :** إذا لم تشتعل القواعد أبدًا، تحقق أن `rule.enabled` هو `True` وأن أسماء سمات الشرط تطابق أسماء `@property` الخاصة بالجهاز بالضبط. إذا استُدعيت طريقة جهاز خاطئة، فخيط `action.method` لا يطابق اسم طريقة فئة الجهاز.

### 2.2 اختبر تقييم القواعد

```python
# Quick test
from hub.devices import Light, Thermostat, DeviceRegistry
from hub.rules import Rule, Condition, Action, evaluate_rules

reg = DeviceRegistry()
light = Light(id="l1", name="Living Room Light", location="Living Room")
thermo = Thermostat(id="t1", name="Living Room Thermostat", location="Living Room", _temperature=65.0)
reg.register(light)
reg.register(thermo)

rule = Rule(
    name="Warm up",
    trigger="state_change",
    conditions=[Condition(device_id="t1", attribute="temperature", operator="less_than", value="68")],
    actions=[Action(device_id="l1", method="turn_on")],
)
results = evaluate_rules([rule], reg)
assert len(results) == 1
assert light.is_on
```

**🎯 الناتج المتوقع :** ينجح التأكيد؛ الضوء مشتعل بعد تقييم القاعدة.

**🩹 إذا لم يعمل :** إذا لم يشتعل الضوء، فقد تقارن مقارنة الشرط `less_than` سلاسل بدل أعداد عائمة — تحقق من إلقاء `float()` في `evaluate_condition`.

### 2.3 تحقق من محرك القواعد

**✅ قائمة التحقق**

- ✅ قاعدة تشتعل حين تتحقق شروطها كلها.
- ✅ قاعدة لا تشتعل حين يفشل أي شرط.
- ✅ الأفعال تستدعي طرائق الأجهزة الصحيحة بالوسائط الصحيحة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تقيّم القواعد كل شروطها عند كل تغير حالة. لمنزل بخمسين جهازًا وعشرين قاعدة، ذلك 1000 فحص شرط لكل حدث. كيف تحسّن هذا — تقييم القواعد التي تشير شروطها إلى الجهاز المتغير فقط؟
- ماذا يحدث إذا حاولت قاعدتان ضبط الجهاز نفسه على حالتين متعارضتين؟ كيف تضيف أولويةً أو ترتيبًا لحل التعارضات؟

## الخطوة 3: نفّذ جدولة مبنية على الوقت

بعض الأتمتة لا تُحفَّز بحالة الجهاز — تعمل وفق جدول. "أطفئ كل الأضواء عند منتصف الليل" و"اخفض الثرموستات عند العاشرة مساءً" و"أقفل الأبواب وقت النوم". تستخدم هذه الخطوة مكتبة `schedule` لتشغيل قواعد في أوقات محددة.

### 3.1 ابنِ الجدولة

**👟 تلميح البداية :** أنشئ `hub/scheduler.py` بدوال تسجّل وتشغّل القواعد المجدولة.

```python
# hub/scheduler.py
import schedule
import time
from hub.rules import Rule, evaluate_rules
from hub.devices import DeviceRegistry

class AutomationScheduler:
    def __init__(self, registry: DeviceRegistry, rules: list[Rule]):
        self.registry = registry
        self.rules = rules

    def schedule_rule(self, rule: Rule, time_str: str):
        """Schedule a rule to run at a specific time (e.g., '22:00')."""
        def job():
            results = evaluate_rules([rule], self.registry)
            for r, logs in results:
                for log in logs:
                    print(f"  [{time_str}] {log}")

        schedule.every().day.at(time_str).do(job)
        print(f"Scheduled '{rule.name}' at {time_str}")

    def run_pending(self):
        schedule.run_pending()

    def clear(self):
        schedule.clear()
```

تتولى مكتبة `schedule` التوقيت — تسجّل دالة تعمل في وقت محدد كل يوم. يُستدعى `run_pending()` في حلقة لفحص ما إذا كانت أي من المهام المجدولة قد حان وقتها. تلتقط الإغلاقية `job` القاعدة والسجل، فعند حلول الوقت المجدول تقيّم القاعدة مقابل حالة الجهاز الحالية وتنفذ أي أفعال مطابقة.

**🎯 الناتج المتوقع :** يطبع `scheduler.schedule_rule(rule, "22:00")` النص `Scheduled 'Warm up' at 22:00` ويسجّل المهمة.

**🩹 إذا لم يعمل :** إذا لم تعمل المهمة أبدًا، فـ`run_pending()` لا يُستدعى في حلقة. إذا كان تنسيق الوقت خاطئًا، يرفع `schedule` `ValueError` — استخدم تنسيق `HH:MM` بوقت 24 ساعة.

### 3.2 اختبر بوقت محاكى

```python
# Quick test (skip actual waiting)
import schedule
from hub.devices import Light, DeviceRegistry
from hub.rules import Rule, Condition, Action

reg = DeviceRegistry()
light = Light(id="l1", name="Bedroom Light", location="Bedroom")
reg.register(light)

rule = Rule(
    name="Bedtime",
    trigger="schedule",
    conditions=[],
    actions=[Action(device_id="l1", method="turn_off")],
)

scheduler_job = lambda: print("  [22:00] ACTION: l1.turn_off({})")
schedule.every().day.at("22:00").do(scheduler_job)

# Simulate: run pending jobs immediately
schedule.run_pending()
```

**🎯 الناتج المتوقع :** يطبع `schedule.run_pending()` النص `ACTION: l1.turn_off({})` فورًا (لأن المهمة ستُنجز عند 22:00 ونحن نستدعيها في اختبار).

**🩹 إذا لم يعمل :** إذا لم يُطبع شيء، فالوقت المجدول لم يحل بعد في الاختبار — `schedule.run_pending()` يشغّل المهام التي انقضى موعدها منذ آخر استدعاء فقط.

### 3.3 تحقق من الجدولة

**✅ قائمة التحقق**

- ✅ يسجّل `schedule_rule` مهمة تطبع عند استدعاء `run_pending()`.
- ✅ قواعد بلا شروط تنفذ أفعالها دون قيد في الوقت المجدول.
- ✅ `clear()` يزيل كل المهام المجدولة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تشغّل مكتبة `schedule` المهام في حلقة حاجبة. كيف تشغّل الجدولة بجوار خادم ويب أو مستمع WebSocket لتحديثات جهاز لحظية؟
- إذا اشتعلت قاعدة مجدولة بينما كان جهاز في حالة غير متوقعة (ضوء أُطفئ يدويًا)، فهل يجب أن تنفذ القاعدة أفعالها مع ذلك؟ كيف تضيف وضع "تحقق قبل الفعل"؟

## الخطوة 4: أضف كشف الحضور

يكشف الحضور عن إجابة السؤال "هل أحد في المنزل؟" بمراقبة الأجهزة المتصلة بالشبكة. حين ينضم هاتف إلى WiFi، فثمة أحد في المنزل؛ حين يغادر، يمكن أن يدخل المنزل وضع "خارج".

### 4.1 ابنِ كاشف الحضور

**👟 تلميح البداية :** أنشئ `hub/presence.py` بدالة تفحص هل جهاز (هاتف) قابل للوصول عبر ping.

```python
# hub/presence.py
import subprocess
import time

class PresenceDetector:
    def __init__(self):
        self.known_devices: dict[str, str] = {}  # name -> IP
        self.status: dict[str, bool] = {}

    def register_device(self, name: str, ip: str):
        self.known_devices[name] = ip
        self.status[name] = False

    def ping(self, ip: str, timeout: int = 2) -> bool:
        """Ping an IP address and return True if reachable."""
        result = subprocess.run(
            ["ping", "-c", "1", "-W", str(timeout), ip],
            capture_output=True,
            text=True,
            check=False,
        )
        return result.returncode == 0

    def check_all(self) -> dict[str, bool]:
        """Check presence of all registered devices."""
        for name, ip in self.known_devices.items():
            self.status[name] = self.ping(ip)
        return dict(self.status)

    @property
    def anyone_home(self) -> bool:
        return any(self.status.values())
```

تستخدم دالة `ping` أداة `subprocess.run` لتنفيذ أمر ping نظامي حقيقي — نفس الأمر الذي كنت ستكتبه في طرفية. تمرّ `check_all` على كل الأجهزة المسجلة وتحدّث حالتها. `anyone_home` خاصية يسر convenience ترجع `True` إذا كان أي جهاز قابلًا للوصول. في الإنتاج، ستستطلع هذا دوريًا (كل 30 ثانية إلى دقيقة) وتفعّل القواعد عند تغير الحالة.

**🎯 الناتج المتوقع :** يرجع `detector.ping("127.0.0.1")` `True` (localhost دائمًا قابل للوصول). ويرجع `detector.ping("192.0.2.1")` `False` (عنوان TEST-NET لا يجب أن يستجيب).

**🩹 إذا لم يعمل :** إذا رجعت `ping` `False` دائمًا، تحقق أن `timeout` كبير كفاية وأن الـIP قابل للوصول من شبكتك. على بعض الأنظمة، يتطلب `ping` الخيار `-c 1` (العدّ) لتفادي ping لا نهائي.

### 4.2 اربط الحضور بالقواعد

```python
# hub/presence.py (متابعة)
from hub.rules import Rule, evaluate_rules
from hub.devices import DeviceRegistry

class PresenceRuleEvaluator:
    def __init__(self, detector: PresenceDetector, registry: DeviceRegistry):
        self.detector = detector
        self.registry = registry
        self.prev_home = None

    def evaluate_on_change(self, rules: list[Rule]) -> list[tuple[Rule, list[str]]]:
        """Evaluate rules when presence status changes."""
        current = self.detector.anyone_home
        if current == self.prev_home:
            return []  # no change, no rules to evaluate
        self.prev_home = current
        results = evaluate_rules(rules, self.registry)
        return results
```

يفعّل `PresenceRuleEvaluator` القواعد عند *تغيير* الحضور فقط — لا عند كل استطلاع. هذا يمنع القواعد من الاشتعال المتكرر بينما شخص في المنزل. تتبع `prev_home` هو المفتاح: حين ينقلب الوضع من `True` إلى `False` (غادر الجميع)، تشتعل قواعد شروط الحضور مرة واحدة.

**🎯 الناتج المتوقع :** يرجع `evaluate_on_change` القواعد حين ينتقل الحضور من الحضور إلى الغياب (أو العكس)، ويرجع قائمة فارغة حين لا يتغير شيء.

**🩹 إذا لم يعمل :** إذا اشتعلت القواعد عند كل استدعاء، فـ`prev_home` لا يُحدَّث. إذا لم تشتعل القواعد أبدًا، يبدأ `prev_home` كـ`None`، ما يعني أن أول استدعاء يفعّل دائمًا.

### 4.3 تحقق من كشف الحضور

**✅ قائمة التحقق**

- ✅ يرجع `ping("127.0.0.1")` `True`.
- ✅ يرجع `check_all` قاموس أسماء أجهزة إلى قيم منطقية.
- ✅ يرجع `evaluate_on_change` النتائج فقط عندما يتغير وضع الحضور/الغياب فعلًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لكشف الحضور القائم على ping تباطؤ: قد لا يستجيب هاتف لثلاثين ثانية بعد مغادرة الشبكة. كيف تضيف فترة سماح قبل إعلان "خارج" لتفادي التفعيلات الكاذبة؟
- إذا كان شخصان في المنزل وغادر أحدهما، فيبقى `anyone_home` `True`. كيف تتبع حضورًا لكل شخص بدل ثنائي بسيط؟

## الخطوة 5: اربط كل شيء في CLI

يربط CLI كل القطع: سجّل الأجهزة، واكتب القواعد، وأسس الجداول، وشغّل المحرك في حلقة.

### 5.1 ابنِ الـCLI

**👟 تلميح البداية :** أنشئ `hub/cli.py` بأوامر لتسجيل الأجهزة وإضافة القواعد وتشغيل المحرك.

```python
# hub/cli.py
import json
import click
from hub.devices import DeviceRegistry, Light, Thermostat, Lock
from hub.rules import Rule, Condition, Action, evaluate_rules
from hub.presence import PresenceDetector

@click.group()
def cli():
    """Home Automation Hub — register devices, write rules, run automations."""
    pass

@cli.command()
def demo():
    """Run a demo with sample devices and rules."""
    reg = DeviceRegistry()
    light = Light(id="l1", name="Living Room Light", location="Living Room")
    thermo = Thermostat(id="t1", name="Thermostat", location="Living Room", _temperature=65.0)
    lock = Lock(id="d1", name="Front Door", location="Entryway")
    reg.register(light)
    reg.register(thermo)
    reg.register(lock)

    rules = [
        Rule(
            name="Cold turns on light",
            trigger="state_change",
            conditions=[Condition("t1", "temperature", "less_than", "68")],
            actions=[Action("l1", "turn_on", {"brightness": 80})],
        ),
        Rule(
            name="Lock at bedtime",
            trigger="schedule",
            conditions=[],
            actions=[Action("d1", "lock")],
        ),
    ]

    click.echo(f"Devices: {len(reg.devices)}")
    click.echo(f"Rules: {len(rules)}")

    results = evaluate_rules(rules, reg)
    for rule, logs in results:
        click.echo(f"Rule '{rule.name}' fired:")
        for log in logs:
            click.echo(log)

    click.echo(f"Light is on: {light.is_on}")
    click.echo(f"Door is locked: {lock.is_locked}")

@cli.command()
@click.argument("device_type", type=click.Choice(["light", "thermostat", "lock"]))
@click.option("--id", "device_id", required=True)
@click.option("--name", required=True)
@click.option("--location", default="Unknown")
def add_device(device_type, device_id, name, location):
    """Register a new device."""
    click.echo(f"Added {device_type}: {name} ({device_id}) at {location}")

@cli.command()
def status():
    """Show current device states."""
    click.echo("Device status: (run 'demo' first to populate)")

if __name__ == "__main__":
    cli()
```

أمر `demo` الأكثر فائدةً للتعلم — يهيئ سيناريو كاملًا بثلاثة أجهزة وقاعدتين ويقيمهما دفعة واحدة. أمرا `add_device` و`status` هيكلان لتوسعة النظام. يُبقي الـCLI منطق الأتمتة قابلًا للاختبار دون تشغيل حلقة أحداث متصلة.

**🎯 الناتج المتوقع :** يطبع `uv run python -m hub.cli demo` النص `Rule 'Cold turns on light' fired` ويظهر أن الضوء مشتعل والباب مقفل.

**🩹 إذا لم يعمل :** إذا لم تشتعل قواعد، فقد لا تُقارن درجة حرارة الثرموستات (65.0) مقارنةً صحيحةً ضد `"68"` — تحقق من إلقاء `float()` في مقيّم الشرط.

### 5.2 اختبار دخان من طرف إلى طرف

```python
# Quick end-to-end test
from hub.devices import Light, Thermostat, Lock, DeviceRegistry
from hub.rules import Rule, Condition, Action, evaluate_rules

reg = DeviceRegistry()
light = Light(id="l1", name="Light", location="Room")
thermo = Thermostat(id="t1", name="Thermo", location="Room", _temperature=65.0)
lock = Lock(id="d1", name="Lock", location="Door")
reg.register(light)
reg.register(thermo)
reg.register(lock)

rules = [
    Rule(name="Cold", trigger="state_change",
         conditions=[Condition("t1", "temperature", "less_than", "68")],
         actions=[Action("l1", "turn_on")]),
    Rule(name="Away lock", trigger="presence",
         conditions=[Condition("t1", "temperature", "greater_than", "80")],
         actions=[Action("d1", "lock")]),
]
results = evaluate_rules(rules, reg)
assert len(results) == 1  # only "Cold" fires (thermo is 65 < 68)
assert results[0][0].name == "Cold"
assert light.is_on
```

**🎯 الناتج المتوقع :** ينجح التأكيد؛ قاعدة "Cold" وحدها تشتعل، والضوء مشتعل.

**🩹 إذا لم يعمل :** إذا اشتعلت القاعدتان معًا، فشرط "Away lock" `greater_than 80` يقارن بشكل خاطئ — تحقق من تحويل العدد العائم.

### 5.3 تحقق من مسار الـCLI الكامل

**✅ قائمة التحقق**

- ✅ `uv run python -m hub.cli demo` يشغّل سيناريو كاملًا بأجهزة وقواعد وأفعال.
- ✅ تشتعل القواعد بناءً على حالة الجهاز الحالية — لا بناءً على ما تتوقعه القاعدة.
- ✅ يطبع الـCLI مخرجات واضحة تعرض أي القواعد اشتعلت وأي الأفعال اتُخذت.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا شغّلت العروض مرتين، فسيكون الضوء مشتعلًا أصلًا من الجولة الأولى. كيف تعيد حالة الجهاز بين التقييمات ليبدأ كل تشغيل نظيفًا؟
- يقيّم العروض القواعد مرة واحدة. يعمل مركز أتمتة المنزل الحقيقي في حلقة متصلة. كيف تنظّم الحلقة الرئيسية لتتولى تغييرات الحالة والأحداث المجدولة وتحديثات الحضور في دورة واحدة؟

## ⚠️ المآزق الشائعة

- **قواعد تشتعل عند كل استطلاع لا عند تغير الحالة.** إذا أعاد محركك تقييم كل القواعد عند كل تقرير حساس (حتى دون تغير)، ستحصل على أفعال متكررة وإشعارات غير ضرورية. نمط `PresenceRuleEvaluator` — تتبع `prev_home` والاشتعال عند التحولات فقط — يمنع هذا.
- **مقارنات سلسلة مقابل عدد في الشروط.** شرط مثل `temperature > 68` يجب أن يقارن أعدادًا عائمة، لا سلاسل. تلقي دالة `evaluate_condition` القيم بـ`float()` للعوامل العددية، لكن من السهل نسيان ذلك عند إضافة عوامل جديدة.
- **أفعال تستدعي طرائق غير موجودة.** إذا كان `action.method` هو `"turn_on"` لكن فئة الجهاز تكتبه `"TurnOn"`، يرجع `getattr` `None` ويفشل الفعل بصمت. تحقق دائمًا أن الطريقة موجودة قبل استدعائها.
- **جدولة بحلقات حاجبة.** تستخدم مكتبة `schedule` `time.sleep(1)` داخليًا، ما يحجب الخيط كله. لمركز حقيقي يتولى أيضًا اتصالات WebSocket أو طلبات HTTP، ستحتاج جدولةً غير متزامنة (مثل `APScheduler`) بدلًا من ذلك.
- **يفترض كشف الحضور أن كل الأجهزة هواتف.** حاسوب محمول يبقى متصلًا دائمًا، ومكبر صوت ذكي لا يغادر أبدًا، أو هاتف ضيف — كلها تحرف حساب الحضور. علّم الأجهزة "متنقلة" مقابل "ثابتة" قبل استخدامها للحضور.

## ما بنيته للتو

محرك أتمتة منزلية مبنية على القواعد: أجهزة بحالة وطرائق، ومحرك قواعد محفز-فعل يقيّم الشروط مقابل حالة الجهاز الحية، وجدولة مبنية على الوقت للأتمتة المتكررة، وكشف حضور من أوامر ping للشبكة. البنية — الأجهزة، القواعد، الجدولة، الحضور — تعكس كيف تعمل منصات أتمتة المنزل مثل Home Assistant وHubitat، أصغر فحسب وتعمل بالكامل في Python.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/home-automation/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/home-automation) في مستودع الدورة يحوي نسخة أغنى بأنواع أجهزة أكثر ولوحة ويب وجدولة موصولة من طرف إلى طرف. استنسخه، أو افتح المستودع كله في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف API ويب (Flask أو FastAPI) يكشف حالات الأجهزة ويسمح بإنشاء قواعد من لوحة مبنية على المتصفح.
- نفّذ تسجيل أحداث: سجّل كل اشتعال قاعدة وكل فعل اتُخذ إلى قاعدة بيانات SQLite للتدقيق وتصحيح الأخطاء.
- أضف تكامل MQTT لتنشر أجهزة المنزل الذكي الحقيقية (Zigbee، Z-Wave) تغييرات الحالة التي يعالجها المحرك.

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — وملف README فيه جولة كاملة صديقة للمبتدئين لإضافة مشروعك عبر **طلب سحب**، حتى لو لم تستخدم git من قبل: استنساخ المستودع، وإنشاء فرع، والالتزام بملفاتك، وفتح الـPR، خطوة بخطوة. لا تُفترض أي خبرة git سابقة.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓