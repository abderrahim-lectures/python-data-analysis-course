---
title: "محلل البيانات الجغرافية"
description: "تحليل وتصور البيانات الجغرافية مع التجميع وخريطة الحرارة وتحسين المسارات."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["data-viz", "geospatial", "scikit-learn"]
prerequisites:
  - "Python 101"
  - "تحليل البيانات"
learningObjectives:
  - "تحميل بيانات الإحداثيات الجغرافية ومعالجتها باستخدام pandas"
  - "تجميع النقاط المكانية باستخدام DBSCAN لإيجاد تجميعات طبيعية"
  - "حساب المسافات بين الإحداثيات باستخدام معادلة هافرسين"
  - "توليد تصور خريطة حرارة لكثافة النقاط على خريطة حقيقية"
---

# 🌍 ابنِ محلل بيانات جغرافية

كل رحلة مشاركة ركوب، وكل توصيلة، وكل قراءة محطة أرصاد هي نقطة على الكرة الأرضية توصف برقمين: خط العرض وخط الطول. يبني هذا المشروع أداة تحليل جغرافي تأخذ بيانات إحداثيات خام وتجيب عن أسئلة حقيقية: أين عناقيد النشاط، وكم تبعد نقطتان عن بعضهما، وكيف يبدو كثافة النقاط على خريطة. ستستخدم DBSCAN للتجميع المكاني، ومعادلة هافرسين لحساب مسافات حقيقية، وFolium لتصورات خرائط تفاعلية — كل ذلك مرتكزًا على بيانات جغرافية فعلية.

هذا يفترض Python 101 وإلمامًا مريحًا بـ pandas من دورة تحليل البيانات — لا شيء بعد ذلك. اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تجهّز مشروعًا بـ `uv` وتثبّت تبعيات الجغرافيا التي ستحتاجها.
2. تحمّل وتنظّف مجموعة بيانات عينة من الإحداثيات الجغرافية.
3. تجمّع النقاط المتجاورة باستخدام DBSCAN لإيجاد تجميعات طبيعية في البيانات.
4. تحسب مسافات العالم الحقيقي بين الإحداثيات بمعادلة هافرسين.
5. تولّد خريطة حرارة تفاعلية تعرض كثافة النقاط على خريطة.
6. تجد المسار الأمثل عبر نقاط طريق متعددة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — خريطة Folium التفاعلية تُعرض في متصفحك، وهو أكثر موثوقية من لوحة مخرجات دفتر.

**Google Colab وKaggle Notebooks وBinder** تعمل جيدًا لتجربة الأداة. يثبّت الدفتر الحزم نفسها ويستخدم الكود نفسه؛ تُعرض خرائط Folium داخليًا في Colab وKaggle.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/geospatial-analyzer/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/geospatial-analyzer/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgeospatial-analyzer%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل تحليل الإحداثيات: بيئة Python، وpandas، وscikit-learn للتجميع، وFolium لعرض الخرائط.

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
uv init geospatial-analyzer
cd geospatial-analyzer
uv add pandas scikit-learn folium numpy
```

`pandas` يتعامل مع البيانات، و`scikit-learn` يوفر تجميع DBSCAN، و`folium` يعرض خرائط تفاعلية، و`numpy` مطلوب لرياضيات هافرسين. لا مفاتيح API خارجية مطلوبة — يعمل كل شيء محليًا.

### أنشئ بنية المشروع

```bash
mkdir -p geo
touch geo/__init__.py geo/load.py geo/cluster.py geo/distance.py geo/visualize.py geo/route.py
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد مجلد `geospatial-analyzer/` مع `pyproject.toml`، و`pandas` و`scikit-learn` و`folium` و`numpy` مثبّتة.
- ✅ يحتوي مجلد `geo/` على كل ملفات الوحدات المطلوبة.

## الخطوة 1: حمّل البيانات الإحداثية ونظّفها

تأتي البيانات الجغرافية بأشكال كثيرة — ملفات CSV، وواجهات JSON، وتفريغات قواعد بيانات — لكنها تنتهي دائمًا للتحليل كإطار بيانات بعمودين على الأقل: `latitude` و`longitude`. تحمّل هذه الخطوة بيانات عينة وتتحقق من واقعية الإحداثيات.

### 1.1 حمّل بيانات عينة

**👟 تلميح البداية :** أنشئ مجموعة بيانات عينة وحمّلها في إطار بيانات، متحققًا من نطاقات الإحداثيات.

```python
# geo/load.py
import pandas as pd
import numpy as np

def generate_sample_locations(n: int = 50, seed: int = 42) -> pd.DataFrame:
    """Generate sample locations clustered around San Francisco."""
    rng = np.random.default_rng(seed)
    # Three cluster centers in the SF Bay Area
    centers = [(37.7749, -122.4194), (37.8044, -122.2712), (37.5585, -122.2711)]
    lats, lons = [], []
    for _ in range(n):
        center = centers[rng.integers(0, 3)]
        lats.append(center[0] + rng.normal(0, 0.01))
        lons.append(center[1] + rng.normal(0, 0.01))
    return pd.DataFrame({"latitude": lats, "longitude": lons, "label": [f"loc_{i}" for i in range(n)]})

def validate_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    """Filter out rows with invalid latitude or longitude."""
    before = len(df)
    df = df[(df["latitude"].between(-90, 90)) & (df["longitude"].between(-180, 180))]
    dropped = before - len(df)
    if dropped:
        print(f"Dropped {dropped} rows with out-of-range coordinates")
    return df.reset_index(drop=True)
```

تنشئ `generate_sample_locations` نقاطًا متجمعة حول ثلاثة مواقع حقيقية في منطقة الخليج — وهذا يجعل نتائج التجميع ذات معنى والخرائط معروفة. يصفّي `validate_coordinates` الإحداثيات المستحيلة (خط عرض خارج -90 إلى 90، وخط طول خارج -180 إلى 180) مع عدّ لما أُزيل.

**🎯 الناتج المتوقع :** `generate_sample_locations(50)` يرجع إطار بيانات بـ50 صفًا وأعمدة `latitude` و`longitude` و`label`. و`validate_coordinates` يحذف 0 صفوف لبيانات صالحة.

**🩹 إذا لم يعمل :** إذا لم تظهر النقاط المولّدة متجمعة بصريًا، فتحقق من قائمة `centers` والانحراف المعياري (`0.01` درجة تساوي نحو 1 كم). إذا كانت الإحداثيات خارج النطاقات الصالحة، فقد يكون انتشار `rng.normal` أكبر من اللازم.

### 1.2 تحقّق من تحميل البيانات

```python
# Quick test
df = generate_sample_locations(100)
assert len(df) == 100
assert df["latitude"].between(-90, 90).all()
assert df["longitude"].between(-180, 180).all()
print(df.head())
```

**🎯 الناتج المتوقع :** الافتراض يمر؛ الصفوف الخمسة الأولى تعرض إحداثيات متجمعة حول منطقة خليج سان فرانسيسكو.

**🩹 إذا لم يعمل :** إذا فشل الافتراض على نطاق خط العرض، فقد تكون إحداثيات المركز متبدلة (خط عرض مقابل خط طول).

### 1.3 تحقّق من تحميل البيانات

**✅ قائمة التحقق**

- ✅ `generate_sample_locations` يرجع إطار بيانات بأعمدة `latitude` و`longitude` و`label`.
- ✅ كل الإحداثيات المولّدة ضمن النطاقات الجغرافية الصالحة.
- ✅ `validate_coordinates` يحذف الصفوف غير الصالحة ويُبلّغ عن العدد.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- البيانات الجغرافية الحقيقية غالبًا ما تحمل قيمًا مفقودة أو نقاطًا مكررة أو إحداثيات عند (0, 0). كيف تمدّ `validate_coordinates` لاصطياد هذه الحالات؟
- إذا كنت تحلل مسارات التوصيل، فترتيب النقاط مهم — ولماذا لا يهم الترتيب لخطوة التجميع؟

## الخطوة 2: تجميع النقاط باستخدام DBSCAN

يجمع DBSCAN النقاط المتقاربة ويعلّم النقاط المعزولة كضجيج — مثالي للبيانات المكانية حيث للتجمعات أشكال غير منتظمة ولا تعرف عدد التجمعات مسبقًا. الفكرة المفتاحية أن DBSCAN يعمل على *المسافة*، لا الإحداثيات الخام فقط، لذا تحتاج تحويل خط العرض/الطول إلى كيلومترات أولًا.

### 2.1 حوّل الإحداثيات إلى راديان وتجميع

**👟 تلميح البداية :** أنشئ `geo/cluster.py` بدالة تشغّل DBSCAN على الإحداثيات الجغرافية بمعيار haversine.

```python
# geo/cluster.py
import numpy as np
from sklearn.cluster import DBSCAN

def cluster_locations(
    df,
    eps_km: float = 1.0,
    min_samples: int = 5,
) -> np.ndarray:
    """Cluster geographic points using DBSCAN with haversine distance.

    Args:
        df: DataFrame with 'latitude' and 'longitude' columns.
        eps_km: Maximum distance (km) between two points in the same cluster.
        min_samples: Minimum points to form a dense region.

    Returns:
        Array of cluster labels (-1 = noise).
    """
    coords_rad = np.radians(df[["latitude", "longitude"]].values)
    eps_rad = eps_km / 6371.0  # convert km to radians (Earth radius = 6371 km)
    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine")
    labels = db.fit_predict(coords_rad)
    return labels
```

التحويل من كيلومترات إلى راديان (`eps_km / 6371.0`) حرج — يتوقع معيار haversine في DBSCAN راديانًا، لا درجات. درجة خط عرض واحدة تساوي نحو 111 كم عند خط الاستواء، لكن معادلة هافرسين تتعامل مع الانحناء بشكل صحيح. النقاط الموسومة `-1` ضجيج (خارج أي تجمع)، والتجمعات تبدأ من `0`.

**🎯 الناتج المتوقع :** `cluster_locations(df, eps_km=1.0, min_samples=5)` يرجع مصفوفة أعداد صحيحة حيث يعلّم `-1` نقاط الضجيج وتعلّم `0, 1, 2, ...` انتماءات التجمعات.

**🩹 إذا لم يعمل :** إذا كانت كل نقطة ضجيجًا (`-1`)، فـ `eps_km` أصغر من اللازم — جرّب زيادته. إذا كان كل شيء تجمعًا واحدًا عملاقًا، فـ `eps_km` أكبر من اللازم أو `min_samples` أصغر من اللازم.

### 2.2 ألحق التسميات بإطار البيانات

```python
# geo/cluster.py (متابعة)
def add_cluster_labels(df, labels: np.ndarray):
    """Add cluster labels to the DataFrame and print summary."""
    df = df.copy()
    df["cluster"] = labels
    n_clusters = len(set(labels) - {-1})
    n_noise = (labels == -1).sum()
    print(f"Found {n_clusters} clusters, {n_noise} noise points")
    return df
```

**🎯 الناتج المتوقع :** يظهر الملخص المطبوع 3 تجمعات (مطابقة للمراكز الثلاثة في بيانات العينة) وعددًا صغيرًا من نقاط الضجيج.

**🩹 إذا لم يعمل :** إذا كان عدد التجمعات خاطئًا، فمعاملات `eps_km` أو `min_samples` تحتاج ضبطًا — يتطلب التجميع المكاني دائمًا استكشاف المعاملات.

### 2.3 تحقّق من التجميع

**✅ قائمة التحقق**

- ✅ `cluster_locations` يرجع مصفوفة تسميات أعداد صحيحة مع `-1` للضجيج.
- ✅ تُنتج بيانات العينة نحو 3 تجمعات مطابقة للمراكز الثلاثة.
- ✅ `add_cluster_labels` يضيف عمود `cluster` إلى إطار البيانات.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يتطلب DBSCAN منك اختيار `eps_km` و`min_samples`. كيف تكتب بحث معاملات آليًا يختار القيم المنتجة لأكثر تجميع "إثارة للاهتمام" (لا تجمعات كثيرة جدًا ولا قليلة جدًا)؟
- يتطلب K-means تحديد `k` (عدد التجمعات) مسبقًا. ما الذي يجعل DBSCAN أنسب للبيانات الجغرافية حيث لا تعرف عدد التجمعات؟

## الخطوة 3: احسب المسافات بمعادلة هافرسين

تحسب معادلة هافرسين مسافة الدائرة العظمى بين نقطتين على كرة — أقصر مسافة عبر سطح الأرض، لا تقريب خط مستقيم. هذا ضروري للتحليل الجغرافي لأن تقريب الأرض المسطحة (مسافة إقليدية على الإحداثيات الخام) يعطي نتائج خاطئة تمامًا على المقاييس الأكبر.

### 3.1 نفّذ معادلة هافرسين

**👟 تلميح البداية :** أنشئ `geo/distance.py` بدالة هافرسين متجهة تعمل على مصفوفات الإحداثيات.

```python
# geo/distance.py
import numpy as np

EARTH_RADIUS_KM = 6371.0

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points in kilometers."""
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return EARTH_RADIUS_KM * 2 * np.arcsin(np.sqrt(a))

def distance_matrix(df) -> np.ndarray:
    """Compute pairwise distances (km) between all points in the DataFrame."""
    coords = np.radians(df[["latitude", "longitude"]].values)
    lat = coords[:, 0]
    lon = coords[:, 1]
    dlat = lat[:, None] - lat[None, :]
    dlon = lon[:, None] - lon[None, :]
    a = np.sin(dlat / 2) ** 2 + np.cos(lat[:, None]) * np.cos(lat[None, :]) * np.sin(dlon / 2) ** 2
    return EARTH_RADIUS_KM * 2 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))
```

`haversine` هي لبنة البناء — تحوّل الدرجات إلى راديان، وتطبق المعادلة، وترجع كيلومترات. تعمّم `distance_matrix` هذا ببث NumPy لحساب كل المسافات الثنائية دفعة واحدة، وهو أسرع بمراتب من الحلقات البايثونية. يمنع `np.clip(a, 0, 1)` تقريب الفاصلة العائمة من دفع القيم فوق 1 قليلًا إلى مجال `arcsin`.

**🎯 الناتج المتوقع :** `haversine(37.7749, -122.4194, 37.8044, -122.2712)` يرجع نحو `13.5` كم — المسافة الحقيقية بين وسط مدينة سان فرانسيسكو وأوكلاند.

**🩹 إذا لم يعمل :** إذا كانت المسافة خاطئة تمامًا (آلاف الكيلومترات لنقاط متقاربة)، فنسيت تحويل الدرجات إلى راديان. إذا كانت للمصفوفة قيم سالبة، فـ `np.clip` مفقود.

### 3.2 اعثر على أقرب الجيران

```python
# geo/distance.py (متابعة)
def nearest_neighbors(df, k: int = 5) -> list[dict]:
    """Find the k nearest neighbors for each point."""
    mat = distance_matrix(df)
    results = []
    for i, row in df.iterrows():
        dists = mat[i]
        indices = np.argsort(dists)[1:k + 1]  # skip self (distance 0)
        neighbors = [
            {"neighbor": df.iloc[j]["label"], "distance_km": round(dists[j], 2)}
            for j in indices
        ]
        results.append({"point": row["label"], "neighbors": neighbors})
    return results
```

**🎯 الناتج المتوقع :** `nearest_neighbors(df, k=3)` يرجع قائمة قواميس، لكل منها اسم `point` وقائمة `neighbors` من أقرب 3 نقاط مع مسافاتها.

**🩹 إذا لم يعمل :** إذا كان الجار الأول مسافته 0، فأنت تضمّن النقطة نفسها في النتائج — تعليق `skip self` في الكود يتعامل مع هذا بـ `[1:k+1]`.

### 3.3 تحقّق من حسابات المسافة

**✅ قائمة التحقق**

- ✅ `haversine` بين موقعين معروفين في سان فرانسيسكو يرجع نحو 13.5 كم.
- ✅ `distance_matrix` يرجع مصفوفة مربعة حيث القيم القطرية 0.
- ✅ `nearest_neighbors` يرجع k جيران لكل نقطة بمسافات غير صفرية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تفترض معادلة هافرسين كرة مثالية، لكن الأرض كروي مفلطح. لأي أنواع من التحليل يصبح هذا التقريب غير مقبول، وما المعادلة التي تستخدمها مكانه؟
- إذا كنت تحسب مسافات بين ملايين النقاط، فلن تتسع مصفوفة المسافات `O(n^2)` للذاكرة. أي بنية بيانات مكانية (تلميح: KD-tree، R-tree) ستقلّص فضاء البحث؟

## الخطوة 4: ولّد خريطة حرارة على خريطة تفاعلية

تراكب خريطة حرارة على خريطة حقيقية يجعل كثافة النقاط مرئية فورًا — المناطق الكثيفة تتوهج ساطعًا والمناطق المتناثرة تبهت. يولّد Folium ملف HTML بخريطة Leaflet.js تفاعلية يمكنك تكبيرها وتحريكها والنقر عليها.

### 4.1 ابنِ خريطة الحرارة

**👟 تلميح البداية :** أنشئ `geo/visualize.py` بدالة تولّد خريطة حرارة Folium من إطار بيانات الإحداثيات.

```python
# geo/visualize.py
import folium
from folium.plugins import HeatMap

def create_heatmap(df, output: str = "heatmap.html", zoom_start: int = 12):
    """Generate an interactive heatmap HTML file from coordinate data."""
    center_lat = df["latitude"].mean()
    center_lon = df["longitude"].mean()
    m = folium.Map(location=[center_lat, center_lon], zoom_start=zoom_start)

    heat_data = df[["latitude", "longitude"]].values.tolist()
    HeatMap(heat_data, radius=15, blur=10).add_to(m)
    m.save(output)
    print(f"Heatmap saved to {output}")
    return output
```

تتمركز الخريطة على متوسط كل الإحداثيات، وهو المركز الطبيعي لمجموعة البيانات. يتحكم `radius` و`blur` في المظهر البصري لخريطة الحرارة — نصف قطر أكبر ينشر تأثير كل نقطة أبعد، وتعتيم أكبر ينعّم الحواف. المخرج ملف HTML مستقل تفتحه في أي متصفح.

**🎯 الناتج المتوقع :** `create_heatmap(df)` ينشئ `heatmap.html` — ملف تفتحه في متصفح يعرض خريطة تفاعلية بتراكب حرارة متمركز على النقطة المركزية للبيانات.

**🩹 إذا لم يعمل :** إذا كانت الخريطة فارغة، فقد تكون الإحداثيات بالترتيب الخاطئ (يتوقع Folium `[lat, lon]`). إذا كانت خريطة الحرارة غير مرئية، فجرّب زيادة `radius` أو `blur`.

### 4.2 أضف علامات المجموعات

```python
# geo/visualize.py (متابعة)
def create_cluster_map(df, output: str = "clusters.html", zoom_start: int = 12):
    """Generate a map with color-coded cluster markers."""
    center_lat = df["latitude"].mean()
    center_lon = df["longitude"].mean()
    m = folium.Map(location=[center_lat, center_lon], zoom_start=zoom_start)

    colors = ["red", "blue", "green", "orange", "purple", "cyan"]
    for _, row in df.iterrows():
        cluster = int(row.get("cluster", -1))
        color = "gray" if cluster == -1 else colors[cluster % len(colors)]
        folium.CircleMarker(
            location=[row["latitude"], row["longitude"]],
            radius=5,
            color=color,
            fill=True,
            popup=row.get("label", ""),
        ).add_to(m)

    m.save(output)
    print(f"Cluster map saved to {output}")
    return output
```

يحصل كل تجمع على لون مميز؛ نقاط الضجيج (`-1`) رمادية. يظهر `popup` على كل علامة تسمية النقطة عند النقر. يمنحك هذا رؤيتين للبيانات نفسها: تظهر خريطة الحرارة الكثافة، وتظهر خريطة التجمعات التجمع.

**🎯 الناتج المتوقع :** `create_cluster_map(df)` ينشئ `clusters.html` بعلامات ملونة — ثلاثة ألوان مميزة لثلاثة تجمعات، ورمادية للضجيج.

**🩹 إذا لم يعمل :** إذا كانت كل العلامات بنفس اللون، فعمود `cluster` ليس في إطار البيانات — شغّل `add_cluster_labels` أولًا. إذا كانت النافذة المنبثقة فارغة، فعمود `label` مفقود.

### 4.3 تحقّق من التصورات

**✅ قائمة التحقق**

- ✅ `create_heatmap` ينتج ملف HTML صالحًا بخريطة تفاعلية.
- ✅ مركز خريطة الحرارة قريب من متوسط الإحداثيات.
- ✅ `create_cluster_map` ينتج خريطة بعلامات ملوّنة مطابقة لانتماءات التجمعات.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تظهر خريطة الحرارة الكثافة لكن لا النقاط الفردية. لأي حالات استخدام ستكون خريطة النقاط (علامات فقط) أنفع من خريطة الحرارة؟
- خرائط Folium ملفات HTML. كيف تخدمها من خادم ويب بايثوني بحيث تتحدث في الوقت الفعلي عند وصول بيانات جديدة؟

## الخطوة 5: اعثر على المسار الأمثل عبر نقاط الطريق

تحسين المسار — إيجاد أقصر مسار يزور كل نقاط الطريق — مسألة كلاسيكية. لعدد صغير من نقاط الطريق يمكنك تجربة كل التبديلات. لمجموعات أكبر تحتاج تخمينًا. تنفّذ هذه الخطوة كليهما.

### 5.1 نفّذ توجيه القوة الغاشمة وأقرب جار

**👟 تلميح البداية :** أنشئ `geo/route.py` بمحسّن قوة غاشمة لمجموعات نقاط الطريق الصغيرة.

```python
# geo/route.py
from itertools import permutations
import numpy as np
from geo.distance import haversine

def route_distance(df, order: list[int]) -> float:
    """Total distance of a route through waypoints in the given order."""
    total = 0.0
    for i in range(len(order) - 1):
        lat1, lon1 = df.iloc[order[i]][["latitude", "longitude"]]
        lat2, lon2 = df.iloc[order[i + 1]][["latitude", "longitude"]]
        total += haversine(lat1, lon1, lat2, lon2)
    return total

def optimal_route_bruteforce(df) -> tuple[list[int], float]:
    """Find the shortest route through all waypoints (exact, O(n!))."""
    indices = list(range(len(df)))
    best_order = indices
    best_dist = float("inf")
    for perm in permutations(indices):
        d = route_distance(df, list(perm))
        if d < best_dist:
            best_dist = d
            best_order = list(perm)
    return best_order, best_dist

def nearest_neighbor_route(df, start: int = 0) -> tuple[list[int], float]:
    """Greedy nearest-neighbor approximation for larger waypoint sets."""
    n = len(df)
    visited = [start]
    remaining = set(range(n)) - {start}
    while remaining:
        current = visited[-1]
        best_next = min(remaining, key=lambda j: haversine(
            df.iloc[current]["latitude"], df.iloc[current]["longitude"],
            df.iloc[j]["latitude"], df.iloc[j]["longitude"],
        ))
        visited.append(best_next)
        remaining.remove(best_next)
    return visited, route_distance(df, visited)
```

يجرّب نهج القوة الغاشمة كل تبديل — لنقاط طريق 10 يكون ذلك 3.6 مليون تبديل، ما يستغرق ثوانٍ. يختار تخمين أقرب جار أنقى نقطة غير مُزارة عند كل خطوة — إنه `O(n^2)` ويتوسع إلى آلاف نقاط الطريق، لكنه لا يضمن المسار الأمثل. لتخطيط مسارات العالم الحقيقي ستستخدم خوارزمية أكثر تطورًا (Christofides أو OR-Tools)، لكن هاتين تعطيانك الفكرة المفتاحية: الحلول الدقيقة أُسّية، والتخمينات حدودية، والفجوة بينهما ثمن قابلية التوسع.

**🎯 الناتج المتوقع :** لثماني نقاط طريق، يرجع `optimal_route_bruteforce` أقصر مسار ممكن ومسافته الإجمالية بالكيلومترات. ويرجع `nearest_neighbor_route` مسارًا أطول قليلًا في كسر من الزمن.

**🩹 إذا لم يعمل :** إذا كانت مسافة القوة الغاشمة 0، فكل نقاط الطريق هي النقطة نفسها. إذا رجع أقرب جار مسارًا أطول بكثير، فقد تكون نقطة البداية اختيارًا سيئًا — جرّب بدايات مختلفة.

### 5.2 صوّر المسار

```python
# geo/route.py (متابعة)
import folium

def visualize_route(df, order: list[int], output: str = "route.html"):
    """Generate a map showing the optimal route as a polyline."""
    center_lat = df["latitude"].mean()
    center_lon = df["longitude"].mean()
    m = folium.Map(location=[center_lat, center_lon], zoom_start=12)

    coords = [(df.iloc[i]["latitude"], df.iloc[i]["longitude"]) for i in order]
    folium.PolyLine(coords, color="blue", weight=3).add_to(m)
    for i, idx in enumerate(order):
        folium.Marker(
            location=coords[i],
            popup=f"Stop {i + 1}: {df.iloc[idx].get('label', '')}",
        ).add_to(m)

    m.save(output)
    print(f"Route saved to {output}")
    return output
```

**🎯 الناتج المتوقع :** `visualize_route(df, order)` ينشئ `route.html` بخط متعدد أزرق يربط نقاط الطريق كلها بالترتيب، وعلامات مرقمة عند كل توقف.

**🩹 إذا لم يعمل :** إذا تذبذب الخط المتعدد بعنف، فترتيب المسار خاطئ — تحقق أن مؤشرات `order` تطابق صفوف إطار البيانات.

### 5.3 تحقّق من التوجيه

**✅ قائمة التحقق**

- ✅ `optimal_route_bruteforce` يجد أقصر مسار لعدد ≤ 10 نقاط طريق.
- ✅ `nearest_neighbor_route` ينتج مسارًا صالحًا يزور كل نقطة طريق.
- ✅ `visualize_route` ينشئ ملف HTML بالمسار مرسومًا كخط متعدد.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لعدد 20 نقطة طريق، `factorial(20) ≈ 2.4 × 10^18` تبديلات — القوة الغاشمة مستحيلة. عند أي عدد نقاط تصبح مسافة تقريب أقرب جار "جيدة بما يكفي" لحالة استخدامك، وكيف تقيس الفجوة؟
- مسارات التوصيل الحقيقية لها نوافذ زمنية ومرور وسعة مركبات. كيف تمدّ هذا النموذج ليتعامل مع قيود تتجاوز المسافة فقط؟

## ⚠️ المآزق الشائعة

- **الخلط بين الدرجات والراديان في حسابات المسافة.** تتطلب معادلة هافرسين راديانًا. خطأ شائع تمرير درجات خط العرض/الطول الخام إلى `np.sin`/`np.cos`، ما ينتج نتائج بلا معنى. حوّل دائمًا بـ `np.radians` أولًا.
- **استخدام المسافة الإقليدية على الإحداثيات الخام.** عند مقياس مدينة، المسافة الإقليدية على الدرجات صحيحة تقريبًا. عند مقياس دولة أو قارة، خاطئة تمامًا لأن درجة خط الطول تتقلص أثناء ابتعادك نحو القطبين. استخدم هافرسين لأي شيء يتجاوز بضعة كيلومترات.
- **ضبط معاملات DBSCAN دون تصور.** اختيار `eps_km` بالتخمين غير موثوق. ارسم توزيع المسافات (رسم ك-المسافة) وابحث عن "الكوع" حيث تقفز المسافات — قيمة بداية جيدة لـ `eps`.
- **خرائط حرارة لا تُعرض في الدفاتر.** خرائط Folium كائنات HTML — تُعرض داخليًا في Colab وKaggle لكنها قد تحتاج `display(m)` في بعض بيئات الدفاتر. إذا كانت الخريطة فارغة، فجرّب `m._repr_html_()` أو احفظ للملف وافتحه.
- **نسيان أن تحسين المسار مسألة NP-صعبة.** القوة الغاشمة تعمل لـ8–10 نقاط. بعد ذلك، تحتاج أقرب جار أو تلدينًا محاكى أو مكتبة حلول. لا تدع حل القوة الغاشمة يوحي بأن التوجيه سريع دائمًا.

## ما بنيته للتو

مجموعة أدوات تحليل جغرافي تحمّل بيانات الإحداثيات، وتجمّع النقاط بـDBSCAN، وتحسب مسافات العالم الحقيقي بمعادلة هافرسين، وتولّد خرائط حرارة وخرائط تجمعات تفاعلية، وتحسّن المسارات عبر نقاط طريق متعددة. الفكرة المفتاحية عبر الخطوات الخمس كلها أن للبيانات الجغرافية قيودًا فريدة — الأرض منحنية، والمسافات ليست إقليدية، والبنية المكانية مهمة — والمعادلات والخوارزميات الصحيحة تصنع الفرق بين هراء وبصيرة.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/geospatial-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/geospatial-analyzer) في مستودع الدورة نسخة أغنى ببيانات عيّنة من العالم الحقيقي وأنواع تصور إضافية والـ CLI مربوطًا من طرف إلى طرف. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف خطوة ترميز جغرافي تحوّل عناوين الشوارع إلى إحداثيات باستخدام API مجاني، لتبدأ الأداة من عناوين خام بدلًا من بيانات خط عرض/طول موجودة مسبقًا.
- نفّذ تراكب مخطط فورونوي على الخريطة لإظهار أي تجمع تنتمي إليه كل منطقة من الخريطة.
- ابنِ نسخة زمن حقيقي تقرأ إحداثيات GPS من تدفق CSV وتحدّث خريطة الحرارة دوريًا.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓