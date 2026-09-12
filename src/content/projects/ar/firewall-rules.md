---
title: "مدير قواعد جدار النار"
description: "أدر قواعد جدار النار مع التحقق والمحاكاة والنشر المبني على الفروقات."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["cli", "security", "data-validation"]
learningObjectives:
  - "تمثيل قواعد جدار النار كصفوف بيانات Python مع التحقق"
  - "اكتشاف تعارضات القواعد ونطاقات المنافذ المتداخلة"
  - "محاكاة حركة المرور ضد مجموعة قواعد للتنبؤ بنتائج القبول/الرفض"
  - "توليد فروقات النشر والتراجع إلى مجموعات القواعد السابقة"
prerequisites: ["Python 101"]
---

# 🔥 ابنِ مدير قواعد جدار النار

قواعد جدار النار هي حواجز الأمان للشبكة ، قاعدة واحدة مضبوطة خطأ يمكن أن تفتح منفذًا للإنترنت أو تحجب حركة مرور مشروعة بصمت. يبني هذا المشروع أداة سطر أوامر تدير مجموعة قواعد كبيانات منظمة: تكتب القواعد في Python، وتتحقق منها بحثًا عن التعارضات، وتحاكي كيف ستمر حركة المرور الحقيقية عبر القواعد، وتنشر التغييرات كفارق مقابل الحالة الحالية مع تراجع بأمر واحد. الهدف أداة تجعل إدارة جدار النار قابلة للتدقيق والعكس بدلًا من أن تكون مخيفة وغامضة.

هذا يفترض أساسيات Python ، لا شيء من تحليل البيانات مطلوب. المشروع اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. تعدّ مشروعًا بـ `uv` وتثبّت التبعيات التي ستحتاجها.
2. تمثّل قواعد جدار النار كصفوف بيانات Python بحقول للإجراء والبروتوكول ونطاق المنفذ والمصدر.
3. تكتب أداة تحقق تكتشف القواعد المتعارضة ونطاقات المنافذ غير الصالحة.
4. تبني محاكي حركة مرور يطابق الحزم الواردة ضد مجموعة قواعد.
5. تنفّذ نشرًا مبنيًا على الفروقات يعرض بالضبط ما يتغير قبل التطبيق.
6. تضيف أمر تراجع يعيد إلى مجموعة القواعد السابقة بخطوة واحدة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي ، هذه أداة سطر أوامر تقرأ وتكتب ملفات القواعد على القرص وتحاكي أنماط حركة المرور.

**Google Colab وKaggle Notebooks وBinder** تعمل لتجربة الأداة. يثبّت الدفتر الحزم نفسها ويستخدم الكود نفسه؛ ويستخدم قواعد نموذجية وحركة مرور محاكاة بدلًا من لمس إعدادات جدار النار الحقيقية.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/firewall-rules/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/firewall-rules/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffirewall-rules%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل كتابة قاعدة واحدة: بيئة Python، وحزمة لبناء واجهة سطر الأوامر، ودليل مشروع.

### ثبّت `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

أغلق طرفيتك وأعد فتحها، ثم تأكد:

```bash
uv --version
```

### أعدّ هيكل المشروع

```bash
uv init firewall-rules
cd firewall-rules
uv add click pydantic
```

يبني `click` واجهة سطر الأوامر، ويمنحنا `pydantic` تحققًا من القواعد مع رسائل خطأ واضحة. تُبقي بنية المشروع القواعد والتحقق والمحاكاة والنشر في ملفات منفصلة للوضوح.

### أنشئ بنية المشروع

```bash
mkdir -p fw
touch fw/__init__.py fw/rules.py fw/validate.py fw/simulate.py fw/deploy.py fw/cli.py
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `firewall-rules/` مع `pyproject.toml`، ومثبَّتة `click` و`pydantic`.
- ✅ يحتوي دليل `fw/` على كل ملفات الوحدات المطلوبة.

## الخطوة 1: تمثّل قواعد جدار النار كبيانات

كل قاعدة جدار نار لها الشكل نفسه: إجراء (سماح أو رفض)، وبروتوكول (TCP أو UDP أو ICMP)، ونطاق منافذ، ومصدر IP أو CIDR اختياري. تمثيل هذا كنموذج Pydantic يمنحك تحققًا تلقائيًا ، قاعدة بمنفذ `99999` أو إجراء `"maybe"` تفشل فورًا بدلًا من إفساد مجموعة القواعد بصمت.

### 1.1 عرّف مخطط القاعدة

**👟 تلميح البداية :** أنشئ `fw/rules.py` بنموذج Pydantic يتحقق من كل حقل عند الإنشاء.

```python
# fw/rules.py
from enum import Enum
from pydantic import BaseModel, field_validator
from ipaddress import ip_network

class Action(str, Enum):
    ALLOW = "allow"
    DENY = "deny"

class Protocol(str, Enum):
    TCP = "tcp"
    UDP = "udp"
    ICMP = "icmp"

class FirewallRule(BaseModel):
    name: str
    action: Action
    protocol: Protocol
    port_start: int
    port_end: int
    source: str = "0.0.0.0/0"  # CIDR, defaults to all

    @field_validator("port_start", "port_end")
    @classmethod
    def check_port(cls, v):
        if not 1 <= v <= 65535:
            raise ValueError(f"Port must be 1-65535, got {v}")
        return v

    def model_post_init(self, __context):
        if self.port_start > self.port_end:
            raise ValueError(
                f"port_start ({self.port_start}) must be <= port_end ({self.port_end})"
            )
        ip_network(self.source, strict=False)  # validates CIDR syntax
```

يلتقط Pydantic البيانات السيئة وقت الإنشاء ، فـ`port_start > port_end` وكتل CIDR غير الصالحة والبروتوكولات غير المعترف بها تثير جميعًا `ValueError` برسالة واضحة. يضبط حقل `source` افتراضيًا على `0.0.0.0/0` (أي IP)، وهو الحالة الشائعة لمعظم القواعد.

**🎯 الناتج المتوقع :** `FirewallRule(name="web", action="allow", protocol="tcp", port_start=80, port_end=443)` ينشئ قاعدة صالحة. و`FirewallRule(name="bad", action="allow", protocol="tcp", port_start=99999, port_end=99999)` يثير `ValidationError`.

**🩹 إذا لم يعمل :** إذا لم يلتقط `ip_network` كتلة CIDR سيئة، فقد تستورد من الوحدة الخطأ ، استخدم `from ipaddress import ip_network`. إذا لم يشغّل Pydantic أداة التحقق من المنفذ، فتأكد من وجود مصمِّم `@field_validator`.

### 1.2 تحقّق من إنشاء القاعدة

```python
# Quick test
from fw.rules import FirewallRule

r = FirewallRule(name="ssh", action="allow", protocol="tcp", port_start=22, port_end=22)
assert r.action.value == "allow"
assert r.port_start == 22
print(r.model_dump())
```

يُرجع النموذج الجولة نظيفة: أنشئ قاعدة، وادخل إلى حقولها، وسلسّلها مرة أخرى إلى قاموس.

**🎯 الناتج المتوقع :** يمر التأكيد؛ ويطبع `model_dump()` قاموسًا بكل الحقول.

**🩹 إذا لم يعمل :** إذا كان `model_dump()` غير موجود، فأنت على إصدار Pydantic أقدم ، استخدم `.dict()` بدلًا منه.

### 1.3 تحقّق من نموذج القاعدة

**✅ قائمة التحقق**

- ✅ قاعدة صالحة تُنشأ بنجاح مع كل الحقول قابلة للوصول.
- ✅ منفذ غير صالح (خارج 1–65535) يثير `ValidationError` واضحًا.
- ✅ مصدر CIDR غير صالح (مثل `"not-an-ip"`) يثير خطأ واضحًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا تمثيل القواعد كنماذج Pydantic بدلًا من قواميس عادية؟ ما ضمانات التحقق التي تحصل عليها مجانًا؟
- إذا كانت لقاعدتين الاسم نفسه لكن إجراءين مختلفين، فهل ذلك تعارض أم حالة صالحة؟ كيف ستقرر؟

## الخطوة 2: اكتشف تعارضات القواعد

مجموعة القواعد مفيدة فقط إذا لم تتعارض قواعدها مع بعضها. إجرا قاعدتان تطابقان حركة المرور نفسها بإجراءين مختلفين يخلق غموضًا ، يتعامل معظم جدران النار مع هذا بنظام «أول تطابق يفوز»، لكنك لا تزال بحاجة إلى تحذير المستخدم.

### 2.1 اكتب كاشف التعارضات

**👟 تلميح البداية :** أنشئ `fw/validate.py` بدالة تقارن كل زوج من القواعد وتعلّم نطاقات المنافذ المتداخلة على البروتوكول نفسه.

```python
# fw/validate.py
from fw.rules import FirewallRule

def find_conflicts(rules: list[FirewallRule]) -> list[tuple[FirewallRule, FirewallRule, str]]:
    """Find pairs of rules that overlap in protocol and port range."""
    conflicts = []
    for i, a in enumerate(rules):
        for b in rules[i + 1:]:
            if a.protocol != b.protocol:
                continue
            ports_overlap = a.port_start <= b.port_end and b.port_start <= a.port_end
            if not ports_overlap:
                continue
            if a.source == b.source or a.source == "0.0.0.0/0" or b.source == "0.0.0.0/0":
                reason = f"Both match {a.protocol.value} ports {max(a.port_start, b.port_start)}-{min(a.port_end, b.port_end)}"
                conflicts.append((a, b, reason))
    return conflicts
```

فحص التداخل `a.port_start <= b.port_end and b.port_start <= a.port_end` هو اختبار تداخل الفترات القياسي. فحص المصدر مهم: قاعدتان بمصدر IP مختلفين يمكن أن تتداخلا دون تعارض لأنهما تطابقان حركة مرور مختلفة. لكن عندما تغطي قاعدة واحدة جميع المصادر (`0.0.0.0/0`)، فهي تتداخل مع كل شيء.

**🎯 الناتج المتوقع :** قاعدتان تطابقان TCP 80–443 من أي مصدر تنتجان تعارضًا واحدًا. وقاعدتان تطابقان TCP 80 لكن من عناوين IP محددة مختلفة تنتجان لا تعارض.

**🩹 إذا لم يعمل :** إذا عُلِّمت قواعد ببروتوكولات مختلفة كمتضاربة، ففحص البروتوكول مفقود. إذا عُلِّمت قواعد بمصادر محددة مختلفة، فمنطق تداخل المصادر صارم جدًا.

### 2.2 أضف ملخصًا للتحقق

```python
# fw/validate.py (continued)
def validate_ruleset(rules: list[FirewallRule]) -> dict:
    """Validate a full rule set and return a summary."""
    conflicts = find_conflicts(rules)
    issues = []
    for a, b, reason in conflicts:
        issues.append(f"CONFLICT: '{a.name}' vs '{b.name}': {reason}")
    return {"valid": len(issues) == 0, "issues": issues, "rule_count": len(rules)}
```

**🎯 الناتج المتوقع :** مجموعة قواعد بلا تداخلات ترجع `{"valid": True, "issues": [], "rule_count": N}`. ومجموعة متضاربة ترجع `{"valid": False, "issues": [...], ...}` مع أوصاف تعارض قابلة للقراءة البشرية.

**🩹 إذا لم يعمل :** إذا أظهر الملخص دائمًا `"valid": True`، فقائمة `issues` لا تُملأ ، تحقق أن `find_conflicts` ترجع الصفوف الصحيحة.

### 2.3 تحقّق من اكتشاف التعارضات

**✅ قائمة التحقق**

- ✅ قاعدتان تطابقان البروتوكول ونطاق المنافذ نفسه من المصدر نفسه تُعلَّمان.
- ✅ القواعد المطابقة لبروتوكولات أو مصادر مختلفة لا تُعلَّم.
- ✅ ملخص التحقق يرجع `"valid": False` مع أوصاف مشاكل قابلة للقراءة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستخدم معظم جدران النار الحقيقية ترتيب «أول تطابق يفوز». كيف سيغير إضافة أولوية قواعد منطق اكتشاف التعارضات ، هل ستظل القواعد المتداخلة تعارضات، أم مجرد مسائل ترتيب؟
- ماذا يحدث إذا كانت مجموعة القواعد تحتوي قاعدة `deny all` في المنتصف؟ هل سيعلّم المحقق القواعد تحتها على أنها زائدة؟

## الخطوة 3: حاكِ حركة المرور ضد مجموعة القواعد

التحقق يخبرك إن كانت القواعد متسقة داخليًا؛ والمحاكاة تخبرك بما تفعله *فعليًا*. بمعلومية قائمة بحزم حركة مرور محاكاة (مصدر IP، بروتوكول، منفذ)، يمكنك السير عبر القواعد بالترتيب والتنبؤ بما إذا كانت كل حزمة مسموحة أم مرفوضة.

### 3.1 ابنِ المحاكي

**👟 تلميح البداية :** أنشئ `fw/simulate.py` بدالة تسير عبر القواعد بالترتيب لكل حزمة وترجع الإجراء المطابق الأول.

```python
# fw/simulate.py
from ipaddress import ip_address
from fw.rules import FirewallRule

def simulate_packet(
    rules: list[FirewallRule],
    source_ip: str,
    protocol: str,
    port: int,
) -> tuple[str, FirewallRule | None]:
    """Simulate one packet. Returns (action, matching_rule) or ('deny', None)."""
    for rule in rules:
        if rule.protocol.value != protocol:
            continue
        if not (rule.port_start <= port <= rule.port_end):
            continue
        src_net = ip_address(source_ip) in __import__("ipaddress").ip_network(rule.source, strict=False)
        if src_net:
            return rule.action.value, rule
    return "deny", None  # default: deny if no rule matches
```

السير عبر القواعد بالترتيب والعودة عند أول تطابق هو كيف تعمل معظم جدران النار فعلًا. إذا لم تطابق أي قاعدة، فالإجراء الافتراضي هو الرفض ، هذا هو الافتراضي الآمن. يتعامل وحدة `ipaddress` مع مطابقة CIDR بشكل صحيح، بما فيها الحالات الحدية مثل `192.168.1.0/24`.

**🎯 الناتج المتوقع :** مجموعة قواعد بها `allow tcp 80-80` و`deny tcp 1-1023` تنتج `("allow", rule)` لحزمة إلى المنفذ 80 من أي مصدر، و`("deny", rule)` للمنفذ 22 من أي مصدر.

**🩹 إذا لم يعمل :** إذا أرجع المنفذ 80 `deny`، فالقواعد ليست مرتبة صحيحًا ، أول تطابق هو المهم. إذا لم تعمل مطابقة CIDR، فتحقق أنك تستخدم `ip_network` مع `strict=False`.

### 3.2 أضف محاكاة دفعة

```python
# fw/simulate.py (continued)
def simulate_traffic(rules: list[FirewallRule], packets: list[dict]) -> list[dict]:
    """Simulate multiple packets and return results."""
    results = []
    for pkt in packets:
        action, matched = simulate_packet(rules, pkt["source"], pkt["protocol"], pkt["port"])
        results.append({
            **pkt,
            "action": action,
            "matched_rule": matched.name if matched else None,
        })
    return results
```

**🎯 الناتج المتوقع :** دفعة من ثلاث حزم تنتج ثلاثة قواميس نتائج، كلٌّ منها بحقول الحزمة الأصلية إضافة إلى `action` و`matched_rule`.

**🩹 إذا لم يعمل :** إذا كانت قائمة النتائج فارغة، فقائمة الإدخال لا تُمرَّر بالتكرار. إذا كان `matched_rule` دائمًا `None`، فدالة `simulate_packet` لا ترجع القاعدة المطابقة.

### 3.3 تحقّق من المحاكي

**✅ قائمة التحقق**

- ✅ حزمة تطابق القاعدة الأولى تحصل على إجراء تلك القاعدة.
- ✅ حزمة لا تطابق أي قاعدة تحصل على `"deny"` مع `matched_rule=None`.
- ✅ ترجع `simulate_traffic` نتيجة واحدة لكل حزمة إدخال.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا عكست ترتيب القواعد، أي الحزم ستغيّر نتيجتها؟ هل يخبرك هذا شيئًا عن سبب أهمية ترتيب القواعد في جدران النار الحقيقية؟
- ما الذي يتطلبه إضافة تسجيل ، تسجيل *أي* القواعد فُحصت لكن لم تطابق ، بحيث يمكنك تصحيح حزمة مرفوضة لاحقًا؟

## الخطوة 4: نشر مبني على الفروقات مع التراجع

نشر قواعد جدار النار بأمان يعني إظهار المستخدم بالضبط ما يتغير قبل تطبيق أي تغيير، والقدرة على التراجع عنه فورًا. تبني هذه الخطوة ناشرًا يلتقط لقطة للقواعد الحالية، ويحسب فرقًا مقابل المجموعة الجديدة، ويخزّن الإصدار السابق للتراجع.

### 4.1 ابنِ الناشر

**👟 تلميح البداية :** أنشئ `fw/deploy.py` مع `deploy` (لقطة + فرق + تطبيق) و`rollback` (استعادة اللقطة السابقة).

```python
# fw/deploy.py
import json
from pathlib import Path
from fw.rules import FirewallRule

RULES_FILE = Path("rules.json")
HISTORY_DIR = Path("rule_history")

def save_rules(rules: list[FirewallRule]):
    """Save the current rule set to disk."""
    RULES_FILE.write_text(json.dumps([r.model_dump() for r in rules], indent=2))

def load_rules() -> list[FirewallRule]:
    """Load the current rule set from disk."""
    if not RULES_FILE.exists():
        return []
    data = json.loads(RULES_FILE.read_text())
    return [FirewallRule(**r) for r in data]

def deploy(new_rules: list[FirewallRule]) -> dict:
    """Snapshot current rules, compute diff, and apply new rules."""
    HISTORY_DIR.mkdir(exist_ok=True)
    old_rules = load_rules()

    # Snapshot old rules
    import time
    snapshot_name = f"snapshot_{int(time.time())}.json"
    (HISTORY_DIR / snapshot_name).write_text(
        json.dumps([r.model_dump() for r in old_rules], indent=2)
    )

    # Compute diff
    old_names = {r.name for r in old_rules}
    new_names = {r.name for r in new_rules}
    added = new_names - old_names
    removed = old_names - new_names
    changed = []
    old_map = {r.name: r for r in old_rules}
    for r in new_rules:
        if r.name in old_map and r.model_dump() != old_map[r.name].model_dump():
            changed.append(r.name)

    save_rules(new_rules)
    return {
        "added": sorted(added),
        "removed": sorted(removed),
        "changed": sorted(changed),
        "snapshot": snapshot_name,
        "total_rules": len(new_rules),
    }
```

تلتقط دالة النشر لقطة أولًا، ثم تحسب، ثم تطبّق ، هذا الترتيب يضمن أن لديك دائمًا نقطة تراجع حتى لو كانت القواعد الجديدة مشوهة. يخبر تقرير الفروق المشغِّل بالضبط بما تغير: أي القواعد جديدة، وأيها اختفت، وأيها عُدّلت.

**🎯 الناتج المتوقع :** نشر قواعد يضيف واحدة ويحذف واحدة ويعدّل واحدة ينتج قاموس فرق مع `added: ["new_rule"]` و`removed: ["old_rule"]` و`changed: ["modified_rule"]`.

**🩹 إذا لم يعمل :** إذا لم يُنشأ ملف اللقطة، فـ `HISTORY_DIR.mkdir()` لا يُستدعى قبل الكتابة. إذا أظهر الفرق كل شيء كمضاف، فـ `old_rules` حُمّلت كقائمة فارغة ، تحقق أن `rules.json` موجود قبل النشر.

### 4.2 أضف التراجع

```python
# fw/deploy.py (continued)
def rollback() -> str:
    """Restore the most recent snapshot."""
    if not HISTORY_DIR.exists():
        return "No history to rollback."
    snapshots = sorted(HISTORY_DIR.glob("snapshot_*.json"))
    if not snapshots:
        return "No snapshots found."
    latest = snapshots[-1]
    rules_data = json.loads(latest.read_text())
    rules = [FirewallRule(**r) for r in rules_data]
    save_rules(rules)
    return f"Rolled back to {latest.name} ({len(rules)} rules)"
```

يقرأ التراجع أحدث لقطة ويكتبها مرة أخرى إلى `rules.json`. يجعل التسمية القائمة على الطابع الزمني الترتيب لا لبس فيه، ويمنح إرجاع اسم اللقطة المشغِّل سجلًّا لأي إصدار استُعيد.

**🎯 الناتج المتوقع :** استدعاء `rollback()` بعد نشر يعيد `rules.json` إلى الإصدار السابق ويرجع اسم اللقطة.

**🩹 إذا لم يعمل :** إذا أرجع التراجع "No snapshots found"، فدليل `rule_history/` فارغ ، يجب أن يشغَّل النشر قبل التراجع. إذا كانت القواعد المستعادة خاطئة، فتسمية اللقطات غير مرتّبة ترتيبًا زمنيًا.

### 4.3 تحقّق من النشر

**✅ قائمة التحقق**

- ✅ ينشئ `deploy` لقطة بطابع زمني في `rule_history/` قبل تطبيق التغييرات.
- ✅ يحدد تقرير الفروق بشكل صحيح القواعد المضافة والمحذوفة والمعدلة.
- ✅ يعيد `rollback` أحدث لقطة ويكتب فوق `rules.json`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- في جدار نار إنتاجي، قد يعني «التطبيق» تشغيل أمر نظام بتأثير شبكة حقيقي. كيف يحميك ترتيب اللقطة-ثم-التطبيق إذا فشلت خطوة التطبيق في المنتصف؟
- إذا نشر شخصان في الوقت نفسه، فماذا يحدث للقطات؟ كيف ستتعامل مع النشر المتزامن؟

## الخطوة 5: ابنِ واجهة سطر الأوامر

اربط كل شيء معًا بثلاثة أوامر: `validate` و`deploy` و`rollback`.

### 5.1 اكتب واجهة سطر الأوامر

**👟 تلميح البداية :** أنشئ `fw/cli.py` بأوامر `click` لكل عملية.

```python
# fw/cli.py
import json
import click
from fw.rules import FirewallRule
from fw.validate import validate_ruleset
from fw.simulate import simulate_traffic
from fw.deploy import deploy, rollback

@click.group()
def cli():
    """Firewall Rule Manager — validate, deploy, rollback."""
    pass

@cli.command()
@click.argument("rules_file", type=click.Path(exists=True))
def validate(rules_file):
    """Validate a rules file for conflicts."""
    data = json.loads(open(rules_file).read())
    rules = [FirewallRule(**r) for r in data]
    result = validate_ruleset(rules)
    if result["valid"]:
        click.echo(f"Valid: {result['rule_count']} rules, no conflicts.")
    else:
        for issue in result["issues"]:
            click.echo(f"  {issue}")
        raise SystemExit(1)

@cli.command()
@click.argument("rules_file", type=click.Path(exists=True))
def deploy_cmd(rules_file):
    """Deploy a new ruleset (snapshot + diff + apply)."""
    data = json.loads(open(rules_file).read())
    rules = [FirewallRule(**r) for r in data]
    result = deploy(rules)
    click.echo(f"Deployed {result['total_rules']} rules.")
    click.echo(f"  Added: {result['added']}")
    click.echo(f"  Removed: {result['removed']}")
    click.echo(f"  Changed: {result['changed']}")
    click.echo(f"  Snapshot: {result['snapshot']}")

@cli.command()
def rollback_cmd():
    """Rollback to the most recent snapshot."""
    msg = rollback()
    click.echo(msg)

if __name__ == "__main__":
    cli()
```

واجهة سطر الأوامر رقيقة ، كل أمر بضعة أسطر تحلل الإدخال وتستدعي دالة المكتبة وتطبع النتيجة. هذا الفصل يعني أن كود المكتبة (`rules.py` و`validate.py` و`simulate.py` و`deploy.py`) قابل للاختبار دون الواجهة، وأن الواجهة تافهة التوسعة بأوامر جديدة.

**🎯 الناتج المتوقع :** يطبع `uv run python -m fw.cli validate rules.json` العبارة "Valid: N rules, no conflicts" لمجموعة قواعد نظيفة، أو يسرد التعارضات ويخرج برمز 1.

**🩹 إذا لم يعمل :** إذا لم تستطع واجهة سطر الأوامر العثور على `click`، فتحقق أن `click` في `pyproject.toml`. إذا أظهر `validate` دائمًا valid، فالقواعد لا تُحمَّل من الملف ، تحقق من مسار قراءة الملف.

### 5.2 اختبار دخان من طرف إلى طرف

```python
# Quick end-to-end test
from fw.rules import FirewallRule
from fw.validate import validate_ruleset
from fw.simulate import simulate_traffic
from fw.deploy import deploy

rules = [
    FirewallRule(name="web", action="allow", protocol="tcp", port_start=80, port_end=443),
    FirewallRule(name="ssh", action="allow", protocol="tcp", port_start=22, port_end=22),
    FirewallRule(name="block_trojan", action="deny", protocol="tcp", port_start=4444, port_end=4444),
]

# Validate
result = validate_ruleset(rules)
assert result["valid"]

# Simulate
packets = [
    {"source": "10.0.0.1", "protocol": "tcp", "port": 80},
    {"source": "10.0.0.1", "protocol": "tcp", "port": 22},
    {"source": "10.0.0.1", "protocol": "tcp", "port": 4444},
]
results = simulate_traffic(rules, packets)
assert results[0]["action"] == "allow"
assert results[1]["action"] == "allow"
assert results[2]["action"] == "deny"

# Deploy
diff = deploy(rules)
assert diff["total_rules"] == 3
```

يشغّل هذا خط الأنابيب كاملًا: تحقق، محاكاة، نشر. اختُبرت كل قطعة بشكل مستقل؛ وهذا يؤكد أن التسليم بينها نظيف.

**🎯 الناتج المتوقع :** تمر كل التأكيدات؛ ويبلغ النشر عن 3 قواعد بلا قواعد مضافة أو محذوفة أو معدلة (أول نشر دائمًا فرق «نظيف»).

**🩹 إذا لم يعمل :** إذا أنتجت المحاكاة إجراءات خاطئة، فتحقق من ترتيب القواعد. إذا أظهر النشر قواعد مضافة/محذوفة غير متوقعة، فقد يحتوي ملف `rules.json` على بيانات قديمة من تشغيل سابق.

### 5.3 تحقّق من خط أنابيب واجهة سطر الأوامر

**✅ قائمة التحقق**

- ✅ يكتشف `validate` القواعد المتعارضة ويخرج برمز 1.
- ✅ ينشئ `deploy` لقطة ويبلغ عن القواعد المضافة/المحذوفة/المعدلة.
- ✅ يعيد `rollback` أحدث لقطة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ما الذي يتطلبه إضافة أمر `simulate` إلى واجهة سطر الأوامر يقرأ ملف قواعد وملف CSV لحركة المرور، ثم يطبع جدولًا بنتائج السماح/الرفض؟
- إذا كتب أمر النشر `rules.json` جزئيًا ثم انهار، ففي أي حالة يكون الملف؟ كيف ستجعل الكتابة ذرّية؟

## ⚠️ المآزق الشائعة

- **نسيان أن ترتيب القواعد مهم.** يسير المحاكي عبر القواعد من الأعلى إلى الأسفل ويعود عند أول تطابق. قاعدة `deny all` فوق قاعدة `allow http` تحجب حركة مرور HTTP. ضع دائمًا قواعد السماح المحددة قبل قواعد الرفض الواسعة.
- **نطاقات منافذ تنطوي بصمت.** قاعدة بـ`port_start=80` و`port_end=80` صحيحة؛ و`port_start=443` و`port_end=80` يجب أن تفشل في التحقق لكنها لن تفعل إذا غاب فحص النطاق. تحقق دائمًا من `port_start <= port_end`.
- **عدم التقاط لقطة قبل النشر.** إذا طبّقت قواعد جديدة دون حفظ القديمة أولًا، فلا توجد نقطة تراجع. تلتقط دالة النشر اللقطة دائمًا أولًا ، لا تتخطَّ هذه الخطوة.
- **مطابقة CIDR دون `strict=False`.** يثير `ip_network("192.168.1.1/24")` خطأ `ValueError` لأن بتات المضيف مضبوطة. استخدام `strict=False` يقنّع بتات المضيف بصمت، وهو السلوك الصحيح لمطابقة مصدر جدار النار.
- **معاملة التحقق كأنه نشر.** مجموعة قواعد تمرّ بالتحقق يمكن أن تسبب مشاكل إنتاجية مع ذلك (ترتيب خاطئ، افتراضيات مفقودة). التحقق يلتقط التعارضات؛ والمحاكاة تلتقط الأخطاء المنطقية. شغّل الاثنين قبل النشر.

## ما بنيته للتو

أداة إدارة قواعد جدار نار تمثّل القواعد ككائنات Python متحقَّق منها، وتكتشف التعارضات قبل بلوغها الإنتاج، وتحاكي حركة المرور الحقيقية ضد مجموعة القواعد، وتنشر التغييرات بسير عمل لقطة-وفرق يجعل كل تغيير قابلاً للتدقيق والعكس. البنية ، النموذج، والتحقق، والمحاكاة، والنشر ، هي النمط نفسه المستخدم في أدوات البنية التحتية ككود مثل Terraform وPulumi.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/firewall-rules/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/firewall-rules) في مستودع الدورة يحتوي نسخة أغنى بأنواع قواعد أكثر، وملف CSV لحركة المرور للمحاكاة الدفعية، وملفات قواعد نموذجية. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف علامة `--dry-run` إلى أمر النشر تعرض الفرق دون تطبيقه.
- ابنِ نظام قوالب للقواعد: قوالب معرّفة مسبقًا لأنماط شائعة مثل «السماح بـ HTTP» و«السماح بـ SSH» و«حجب كل الوارد» التي تولّد قواعد منظمة صحيحة البنية.
- نفّذ أولوية/ترتيب القواعد: رتّب القواعد تلقائيًا بحيث تأتي المطابقات الأكثر تحديدًا أولًا، مما يقلل فرصة أخطاء الترتيب.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓