---
title: "منشئ رسم المعرفة"
description: "استخراج الكيانات والعلاقات من النص لبناء رسوم معرفة تفاعلية."
---


# 🕸️ ابنِ منشئ رسم المعرفة

يحوّل رسم المعرفة النص غير المنظم إلى شبكة من الحقائق المترابطة: «Ada Lovelace» و«المحرك التحليلي» يصبحان عقدًا، و«صمّمت» تصبح الحافة بينهما. يبني هذا المشروع خط أنابيب يستخرج الكيانات المسماة من الجمل، ويرصد العلاقات بينها، ويرسم كل شيء كرسم تفاعلي يمكنك استكشافه والاستعلام عنه.

يفترض هذا إنهاء Python 101 وارتياحًا مع pandas من تحليل البيانات. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. إعداد مشروع باستخدام `uv` وتثبيت تبعيات NLP والرسوم البيانية.
2. استخراج الكيانات المسماة من النص باستخدام نموذج NLP مُدرَّب مسبقًا.
3. رصد العلاقات بين الكيانات المستخرجة.
4. تصوير الرسم بمخطط روابط عقد تفاعلي.
5. الاستعلام عن الرسم للمسارات المتصلة والجيران.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-graph-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-graph-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fknowledge-graph-builder%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل البناء: بيئة Python، وspaCy، وNetworkX.

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
uv init knowledge-graph-builder
cd knowledge-graph-builder
uv add spacy networkx matplotlib
```

يوفّر `spacy` التعرف على الكيانات المسماة. يحمل `networkx` بنية الرسم. يرسمه `matplotlib`. ستحتاج أيضًا إلى نموذج spaCy:

```bash
uv run python -m spacy download en_core_web_sm
```

### أنشئ بنية المشروع

```bash
mkdir -p kgraph
touch kgraph/__init__.py kgraph/entities.py kgraph/graph.py kgraph/build.py
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ يوجد `knowledge-graph-builder/` مع `pyproject.toml` وكل التبعيات مثبَّتة.
- ✅ يكتمل `spacy download en_core_web_sm` دون أخطاء.
- ✅ يحتوي مجلد `kgraph/` على جميع ملفات الوحدات المطلوبة.

## الخطوة 1: استخرج الكيانات المسماة

يحلّل التعرف على الكيانات المسماة الأشخاص (PER) والمؤسسات (ORG) والمواقع (LOC) في النص. spaCy يفعل هذا جاهزًا.

### 1.1 حمِّل النموذج واستخرج الكيانات

**👟 تلميح البداية :**

أنشئ `kgraph/entities.py`.

```python
# kgraph/entities.py
import spacy

class EntityExtractor:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")

    def extract(self, text: str) -> list[dict]:
        doc = self.nlp(text)
        entities = []
        for ent in doc.ents:
            entities.append({"label": ent.label_, "text": ent.text})
        return entities

    def unique_entities(self, text: str) -> list[dict]:
        seen = {}
        for ent in self.extract(text):
            key = (ent["label"], ent["text"].lower())
            if key not in seen:
                seen[key] = {"label": ent["label_"], "id": len(seen) + 1}
        return list(seen.values())
```

**🎯 الناتج المتوقع :**

يُرجع `EntityExtractor().extract("Ada Lovelace worked at Babbage's Analytical Engine in London.")` كيانات تتضمن شخصًا وموقعًا.

**🩹 إذا لم يعمل :**

إذا لم تحصل على كيانات، فقد لا يتعرف النموذج على الأسماء العلم في جملة العينات — جرّب جملة أغنى.

### 1.2 تحقّق من استخراج الكيانات

**✅ قائمة التحقق**

- ✅ تُرجع `extract` قائمة غير فارغة لجملة بها أسماء علم.
- ✅ تظهر تسميات الكيانات مثل `PER` و`ORG` و`LOC`.
- ✅ تُزيل `unique_entities` الذكر المكرر.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يتعرف النموذج الصغير على الشخصيات السياسية أفضل من أسماء التقنية المتخصصة. كيف توسّعه بقواعد مخصصة لمجالك؟

## الخطوة 2: ابنِ بنية الرسم

تصبح الكيانات عقدًا؛ والتواجد المشترك داخل جملة يصبح حافة.

### 2.1 أنشئ الرسم

**👟 تلميح البداية :**

أنشئ `kgraph/graph.py`.

```python
# kgraph/graph.py
import networkx as nx

class KnowledgeGraph:
    def __init__(self):
        self.graph = nx.Graph()

    def add_node(self, entity_id: int, label: str, text: str):
        self.graph.add_node(entity_id, label=label, text=text)

    def add_edge(self, a: int, b: int, sentence: str):
        if self.graph.has_edge(a, b):
            self.graph[a][b]["weight"] += 1
        else:
            self.graph.add_edge(a, b, sentence=sentence, weight=1)

    def neighbors(self, entity_text: str) -> list[str]:
        node = self._find(entity_text)
        if node is None:
            return []
        return [self.graph.nodes[n]["text"] for n in self.graph.neighbors(node)]

    def _find(self, entity_text: str) -> int | None:
        lower = entity_text.lower()
        for n, data in self.graph.nodes(data=True):
            if data["text"].lower() == lower:
                return n
        return None
```

**🎯 الناتج المتوقع :**

إضافة بضع كيانات وحواف تبني رسمًا يمكنك الاستعلام عنه بـ `neighbors()`.

**🩹 إذا لم يعمل :**

إذا أعاد `neighbors` فارغًا، فالنص الكيان لا يطابق أي عقدة — تحقّق من حالة الأحرف والإملاء الدقيق.

### 2.2 تحقّق من الرسم

**✅ قائمة التحقق**

- ✅ تنشئ `add_node` عقد رسم مع `label` و`text`.
- ✅ تزيد `add_edge` من `weight` عند اتصالات متكررة.
- ✅ يُرجع `neighbors` النصوص الكيانية المتصلة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا نتتبع وزن الحافة؟ ما البصيرة التي يمنحك إياها الوزن المرتفع عن رسم المعرفة؟

## الخطوة 3: اربط الاستخراج بالرسم

الآن اربط الاثنين: حلّل الجمل، واستخرج الكيانات من كل جملة، وأنشئ حوافًا للكيانات التي تتشارك جملة.

### 3.1 ابنِ خط الأنابيب

**👟 تلميح البداية :**

أنشئ `kgraph/build.py`.

```python
# kgraph/build.py
import re
from kgraph.entities import EntityExtractor
from kgraph.graph import KnowledgeGraph


def build_graph(text: str) -> KnowledgeGraph:
    extractor = EntityExtractor()
    graph = KnowledgeGraph()
    for sentence in re.split(r'[.!?\n]+', text):
        sentence = sentence.strip()
        if not sentence:
            continue
        ents = extractor.unique_entities(sentence)
        for ent in ents:
            graph.add_node(ent["id"], ent["label"], ent["text"])
        for i in range(len(ents)):
            for j in range(i + 1, len(ents)):
                if ents[i]["id"] != ents[j]["id"]:
                    graph.add_edge(ents[i]["id"], ents[j]["id"], sentence)
    return graph
```

**🎯 الناتج المتوقع :**

يُرجع `build_graph(long_text)` رسمًا تتصل فيه الكيانات الموجودة في الجملة نفسها.

**🩹 إذا لم يعمل :**

إذا لم تتشكل حواف، فقد ينتج التعبير النمطي للتقسيم جملًا فارغة.

### 3.2 تحقّق من خط الأنابيب

**✅ قائمة التحقق**

- ✅ تُضاف الكيانات كعقد.
- ✅ تُربط الكيانات المتشاركة في جملة بحافة.
- ✅ تزيد الأزواج المكررة من الوزن.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- التواجد المشترك كاشف علاقات ساذج لكنه فعّال. ماذا تضيف المقاربة القائمة على تحليل التبعية؟

## الخطوة 4: صوّر الرسم

رسم الرسم يجعل البنية مقروءة: تظهر العقد المحورية فورًا.

### 4.1 ارسم المخطط

**👟 تلميح البداية :**

أضف دالة تصوير.

```python
# kgraph/graph.py (continued)
import matplotlib.pyplot as plt

class KnowledgeGraph:
    # ... existing methods ...

    def draw(self, title="Knowledge Graph", figsize=(12, 8)):
        pos = nx.spring_layout(self.graph, seed=42)
        labels = {n: data["text"] for n, data in self.graph.nodes(data=True)}
        plt.figure(figsize=figsize)
        nx.draw_networkx_edges(self.graph, pos, alpha=0.3)
        nx.draw_networkx_nodes(self.graph, pos, node_size=800,
                               node_color="skyblue", alpha=0.9)
        nx.draw_networkx_labels(self.graph, pos, labels, font_size=9)
        plt.title(title)
        plt.axis("off")
        plt.tight_layout()
        return plt
```

**🎯 الناتج المتوقع :**

يرسم `graph.draw()` مخطط تخطيط نابضي تفاعليًا بعقد معنونة.

**🩹 إذا لم يعمل :**

إذا تداخلت العقد بشكل سيئ، زد `figsize` أو عدّل `k` في `spring_layout`.

### 4.2 تحقّق من التصوير

**✅ قائمة التحقق**

- ✅ تُرسم العقد بتسميات نص الكيان.
- ✅ تربط الحواف الكيانات ذات الصلة.
- ✅ التخطيط مقروء (بدون تداخل عقد شديد).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- أي عقدة ستكون «محورية» في رسمك، ولماذا قد يكون هذا الكيان مركزيًا؟

## ⚠️ مآزق شائعة

- **نسيان تحميل النموذج.** يرفع `spacy.load("en_core_web_sm")` خطأ `OSError` إذا تخطيت `spacy download`. ثبّت النموذج قبل التشغيل.
- **عمليات بحث حساسة لحالة الأحرف.** لن يطابق الكيان «Lovelace» سلسلة «lovelace» ما لم توحّد حالة الأحرف في عمليات البحث. تتعامل الدالة المساعدة `_find` مع هذا — أعد استخدامها في كل مكان.
- **رسوم مفككة.** كثيرًا ما ينتج المدخل القصير عقدًا معزولة دون حواف. استخدم نصًا بعدة كيانات متواجدة مشتركًا لرؤية بنية مثيرة.
- **حجم النموذج مقابل الدقة.** `en_core_web_sm` صغير وسريع لكنه يضيَّع الكيانات المتخصصة. جرّب `en_core_web_md` أو `_lg` لاسترجاع أفضل على حساب الذاكرة.
- **تكرار معرفات الكيانات.** تعيّن `unique_entities` المعرفات لكل استدعاء. عبر الجمل قد يحصل الشخص نفسه على معرفات مختلفة ما لم تزيل التكرار عالميًا — يبني خط الأنابيب مستخرجًا واحدًا لكن معرفات كل جملة تُصفَّر.

## ما بنيته للتو

خط أنابيب نص-إلى-رسم: يستخرج spaCy الكيانات المسماة، ويعزل مُقسِّم التعبيرات النمطية الجمل، ويحوّل التواجد المشترك الجمل المتشاركة إلى حواف موزونة، ويخزّن NetworkX النتيجة ويرسمها matplotlib. يمكنك الآن أخذ أي فقرة وتحويلها إلى شبكة قابلة للاستكشاف من الحقائق المترابطة — النمط نفسه الكامن وراء أنظمة الإجابة عن الأسئلة ومحركات التوصية.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/knowledge-graph-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/knowledge-graph-builder) في مستودع الدورة نسخة أغنى باكتشاف أنواع العلاقات وإيجاد المجتمعات وواجهة CLI موصولة من البداية للنهاية. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- استخدم تحليل التبعية في spaCy لتسمية الحواف بالفعل («صمّمت»، «تقع في») بدلًا من التواجد المشترك غير المبني.
- شغّل كشف المجتمعات بـ `networkx.algorithms.community` لإيجاد مجموعات المواضيع.
- صدّر الرسم إلى GraphML وحمّله في Gephi للاستكشاف المتقدم.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓