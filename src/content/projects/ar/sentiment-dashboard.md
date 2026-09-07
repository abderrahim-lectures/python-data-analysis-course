---
title: "لوحة تحليل المشاعر"
description: "حلّل مشاعر النصوص باستخدام TextBlob وابنِ لوحة معلومات فورية باستخدام matplotlib."
difficulty: "intermediate"
estimatedMinutes: 55
xpReward: 50
tags: ["NLP", "sentiment", "matplotlib", "pandas"]
prerequisites: ["أساسيات بايثون", "أساسيات pandas", "أساسيات matplotlib"]
---

# لوحة تحليل المشاعر

النصوص في كل مكان — المراجعات والتغريدات وتذاكر الدعم وردود الاستبيانات. معرفة ما إذا كان ذلك النص إيجابيًا أو سلبيًا أو محايدًا يساعدك على اتخاذ القرارات بسرعة. في هذا المشروع ستبني خط أنابيب لتحليل المشاعر باستخدام TextBlob وتصوّر النتائج في لوحة معلومات فورية بـ matplotlib تتحدّث مع وصول بيانات جديدة.

## ما ستتعلمه

1. تحليل مشاعر النصوص باستخدام TextBlob
2. تصنيف النص إلى إيجابي أو سلبي أو محايد
3. بناء لوحة معلومات تتحدّث في الوقت الفعلي
4. تصوير توزيع المشاعر عبر الزمن
5. توليد تقارير تلخيصية

## ما ستبنيه

لوحة مشاعر:

- تحلّل مدخلات النص لحساب قطبية المشاعر
- تصنّف المشاعر بتسجيل درجات ثقة
- تعرض رسومًا بيانية فورية لاتجاهات المشاعر
- تولّد تقارير تلخيصية دورية
- تصدّر النتائج إلى CSV

## الإعداد

```bash
uv init sentiment-dashboard
cd sentiment-dashboard
uv add textblob matplotlib pandas
```

ثم نزّل مجموعات نصوص TextBlob (مرة واحدة):

```bash
uv run python -m textblob.download_corpora
```

## الخطوة 1: تحليل المشاعر الأساسي

يلفّ TextBlob أدوات NLTK للمشاعر في واجهة برمجية بسيطة. يكشف كل كائن `TextBlob` عن namedtuple باسم `sentiment` بحقلين:

| الحقل | المدى | المعنى |
|-------------|-----------|----------------------------------------------|
| `polarity`  | -1 إلى 1   | -1 = سلبي جدًا، 1 = إيجابي جدًا        |
| `subjectivity` | 0 إلى 1 | 0 = حقيقة موضوعية، 1 = رأي خالص         |

أنشئ ملفًا باسم `sentiment.py`:

```python
from textblob import TextBlob


def analyze_sentiment(text: str) -> dict:
    """Return polarity, subjectivity, and a human-readable label."""
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    if polarity > 0.1:
        label = "positive"
    elif polarity < -0.1:
        label = "negative"
    else:
        label = "neutral"

    return {
        "text": text,
        "polarity": round(polarity, 3),
        "subjectivity": round(subjectivity, 3),
        "label": label,
    }


if __name__ == "__main__":
    samples = [
        "I absolutely love this product! It changed my life.",
        "Terrible experience. Will never buy again.",
        "The package arrived on Tuesday.",
        "The food was okay, nothing special.",
        "Best day ever! I'm so happy right now!",
    ]

    for text in samples:
        result = analyze_sentiment(text)
        print(f"{result['label']:>8} | pol={result['polarity']:+.3f} | {text}")
```

شغّله:

```bash
uv run python sentiment.py
```

الناتج المتوقع:

```
positive | pol=+0.625 | I absolutely love this product! It changed my life.
negative | pol=-0.850 | Terrible experience. Will never buy again.
 neutral | pol=+0.000 | The package arrived on Tuesday.
 neutral | pol=+0.500 | The food was okay, nothing special.
positive | pol=+0.625 | Best day ever! I'm so happy right now!
```

**استكشاف الأخطاء وإصلاحها:**

- `LookupError: resource not found` — تخطيت نزول مجموعات النصوص. شغّل `uv run python -m textblob.download_corpora`.
- كل النتائج تُظهر `neutral` بـ `pol=0.0` — يحتاج TextBlob إلى مجموعة نصوص `averaged_perceptron_tagger`. أعد تشغيل نزول المجموعات.

## الخطوة 2: المعالجة الدفعية

يعمل التحليل الحقيقي على مجموعات بيانات، لا على نصوص منفردة. يجعل pandas المعالجة الدفعية مباشرة.

أنشئ `batch.py`:

```python
import pandas as pd
from sentiment import analyze_sentiment


def process_texts(texts: list[str]) -> pd.DataFrame:
    """Analyze a list of texts and return a DataFrame with results."""
    results = [analyze_sentiment(text) for text in texts]
    return pd.DataFrame(results)


def load_and_analyze(csv_path: str) -> pd.DataFrame:
    """Load a CSV with a 'text' column, analyze each row, return results."""
    df = pd.read_csv(csv_path)
    if "text" not in df.columns:
        raise ValueError(f"CSV must have a 'text' column. Found: {list(df.columns)}")

    analyses = df["text"].apply(lambda t: pd.Series(analyze_sentiment(str(t))))
    return pd.concat([df, analyses], axis=1)


def summary_stats(df: pd.DataFrame) -> dict:
    """Return summary statistics for the analyzed DataFrame."""
    counts = df["label"].value_counts().to_dict()
    return {
        "total": len(df),
        "positive": counts.get("positive", 0),
        "negative": counts.get("negative", 0),
        "neutral": counts.get("neutral", 0),
        "avg_polarity": round(df["polarity"].mean(), 3),
        "avg_subjectivity": round(df["subjectivity"].mean(), 3),
    }


if __name__ == "__main__":
    reviews = [
        "Fantastic service, will definitely return!",
        "Worst experience of my life.",
        "Average, nothing to write home about.",
        "Staff was friendly but the food was cold.",
        "Absolutely stunning results!",
        "I waited two hours for nothing.",
        "It works. That's all I can say.",
        "Incredible value for the price!",
        "The app crashes every time I open it.",
        "Decent quality, fair price.",
    ]

    df = process_texts(reviews)
    print(df.to_string(index=False))
    print()
    stats = summary_stats(df)
    print(f"Total: {stats['total']}")
    print(f"Positive: {stats['positive']}  Negative: {stats['negative']}  Neutral: {stats['neutral']}")
    print(f"Avg polarity: {stats['avg_polarity']}  Avg subjectivity: {stats['avg_subjectivity']}")
```

شغّله:

```bash
uv run python batch.py
```

## الخطوة 3: بناء لوحة المعلومات

الآن صوّر النتائج. سننشئ شكل matplotlib متعدد اللوحات:

1. مخطط أعمدة بعدّاد المشاعر
2. بيان تكرارات لدرجات القطبية
3. مخطط خطي لسلسلة زمنية (محاكى بفهرس)
4. مخطط دائري لتوزيع التسميات

أنشئ `dashboard.py`:

```python
import matplotlib
matplotlib.use("Agg")  # non-interactive backend

import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import pandas as pd
import numpy as np
from datetime import datetime, timedelta


def create_dashboard(df: pd.DataFrame, output_path: str = "dashboard.png") -> None:
    """Generate a four-panel sentiment dashboard and save to disk."""
    fig = plt.figure(figsize=(14, 9))
    fig.suptitle("Sentiment Analysis Dashboard", fontsize=16, fontweight="bold", y=0.98)
    gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3)

    # --- Panel 1: Sentiment Counts Bar Chart ---
    ax1 = fig.add_subplot(gs[0, 0])
    counts = df["label"].value_counts()
    colors = {"positive": "#2ecc71", "neutral": "#95a5a6", "negative": "#e74c3c"}
    bar_colors = [colors.get(label, "#3498db") for label in counts.index]
    bars = ax1.bar(counts.index, counts.values, color=bar_colors, edgecolor="white", linewidth=0.8)
    ax1.set_title("Sentiment Counts", fontsize=12, fontweight="bold")
    ax1.set_ylabel("Count")
    for bar, val in zip(bars, counts.values):
        ax1.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.3,
                 str(val), ha="center", va="bottom", fontweight="bold")

    # --- Panel 2: Polarity Distribution ---
    ax2 = fig.add_subplot(gs[0, 1])
    ax2.hist(df["polarity"], bins=20, color="#3498db", edgecolor="white", alpha=0.85)
    ax2.axvline(0, color="#e74c3c", linestyle="--", linewidth=1, alpha=0.7, label="Neutral line")
    ax2.set_title("Polarity Distribution", fontsize=12, fontweight="bold")
    ax2.set_xlabel("Polarity")
    ax2.set_ylabel("Frequency")
    ax2.legend()

    # --- Panel 3: Running Average Over Time ---
    ax3 = fig.add_subplot(gs[1, 0])
    if "timestamp" in df.columns:
        ts = pd.to_datetime(df["timestamp"])
        ax3.plot(ts, df["polarity"], alpha=0.3, color="#3498db", linewidth=0.8, label="Per-message")
        if len(df) >= 5:
            rolling = df["polarity"].rolling(window=5, min_periods=1).mean()
            ax3.plot(ts, rolling, color="#e67e22", linewidth=2, label="5-message rolling avg")
        ax3.set_title("Sentiment Over Time", fontsize=12, fontweight="bold")
        ax3.set_xlabel("Time")
    else:
        ax3.plot(df.index, df["polarity"], alpha=0.3, color="#3498db", linewidth=0.8, label="Per-message")
        if len(df) >= 5:
            rolling = df["polarity"].rolling(window=5, min_periods=1).mean()
            ax3.plot(df.index, rolling, color="#e67e22", linewidth=2, label="5-message rolling avg")
        ax3.set_title("Sentiment Over Time (by index)", fontsize=12, fontweight="bold")
        ax3.set_xlabel("Message #")
    ax3.set_ylabel("Polarity")
    ax3.legend()

    # --- Panel 4: Label Pie Chart ---
    ax4 = fig.add_subplot(gs[1, 1])
    pie_counts = df["label"].value_counts()
    pie_colors = [colors.get(label, "#3498db") for label in pie_counts.index]
    wedges, texts, autotexts = ax4.pie(
        pie_counts.values,
        labels=pie_counts.index,
        colors=pie_colors,
        autopct="%1.1f%%",
        startangle=90,
        textprops={"fontsize": 10},
    )
    ax4.set_title("Sentiment Distribution", fontsize=12, fontweight="bold")

    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"Dashboard saved to {output_path}")


if __name__ == "__main__":
    np.random.seed(42)
    n = 50
    polarities = np.random.uniform(-1, 1, n)
    labels = []
    for p in polarities:
        if p > 0.1:
            labels.append("positive")
        elif p < -0.1:
            labels.append("negative")
        else:
            labels.append("neutral")

    base_time = datetime(2025, 1, 1, 8, 0, 0)
    timestamps = [base_time + timedelta(minutes=i * 5) for i in range(n)]

    texts = [f"Sample message {i}" for i in range(n)]

    df = pd.DataFrame({
        "text": texts,
        "polarity": polarities,
        "subjectivity": np.random.uniform(0, 1, n).round(3),
        "label": labels,
        "timestamp": timestamps,
    })

    create_dashboard(df)
```

شغّله:

```bash
uv run python dashboard.py
```

افتح `dashboard.png` لرؤية التخطيط رباعي اللوحات.

## الخطوة 4: التحديثات الفورية

حاكِ بثًّا مباشرًا بمعالجة نصوص جديدة دوريًا وإضافتها إلى مجموعة البيانات. نستخدم حلقة مع `time.sleep()` لمحاكاة بيانات واردة.

أنشئ `realtime.py`:

```python
import time
import random
import pandas as pd
import matplotlib
matplotlib.use("Agg")

from sentiment import analyze_sentiment
from dashboard import create_dashboard


SAMPLE_FEEDS = [
    ["Great product, highly recommend!", "Shipping was slow though."],
    ["I love the new update!", "App keeps crashing on Android."],
    ["Customer service was helpful.", "Price is too high for what you get."],
    ["Perfect for my needs.", "Not worth the money."],
    ["Fast delivery, item as described.", "Color was different from the picture."],
    ["Exceeded my expectations!", "Broke after one week of use."],
    ["The interface is so clean.", "Terrible documentation."],
    ["Five stars, no complaints.", "Had to return it."],
]


def run_realtime(duration: int = 20, interval: int = 5, output: str = "dashboard_live.png"):
    """Simulate a live sentiment stream for `duration` seconds."""
    all_results = []
    batch_num = 0
    start = time.time()

    print(f"Starting live feed for {duration}s (new batch every {interval}s)...")

    while time.time() - start < duration:
        batch = random.choice(SAMPLE_FEEDS)
        for text in batch:
            result = analyze_sentiment(text)
            result["batch"] = batch_num
            all_results.append(result)

        df = pd.DataFrame(all_results)
        create_dashboard(df, output_path=output)

        batch_num += 1
        elapsed = int(time.time() - start)
        pos = len(df[df["label"] == "positive"])
        neg = len(df[df["label"] == "negative"])
        neu = len(df[df["label"] == "neutral"])
        print(f"  [{elapsed:>3}s] batch {batch_num} | +{pos} / -{neg} / ~{neu} ({len(df)} total)")

        time.sleep(interval)

    print(f"\nFinal dashboard: {output}")
    df = pd.DataFrame(all_results)
    print(f"Total messages: {len(df)}")
    print(f"Avg polarity: {df['polarity'].mean():.3f}")
    return df


if __name__ == "__main__":
    run_realtime(duration=20, interval=5)
```

شغّله:

```bash
uv run python realtime.py
```

سترى `dashboard_live.png` يتحدّث كل 5 ثوانٍ ببيانات جديدة تُضاف. اضغط `Ctrl+C` للتوقف مبكرًا — يطبع الملخص النهائي على أي حال.

## الخطوة 5: تقارير تلخيصية

غلّف كل شيء في مولّد تقارير ينتج ملخصًا نصيًا وتصدير CSV.

أنشئ `report.py`:

```python
import pandas as pd
from datetime import datetime
from sentiment import analyze_sentiment
from dashboard import create_dashboard


def generate_report(texts: list[str], csv_path: str = "results.csv", dashboard_path: str = "report_dashboard.png") -> str:
    """Analyze texts, export CSV, generate dashboard, return text report."""
    results = [analyze_sentiment(t) for t in texts]
    df = pd.DataFrame(results)
    df["timestamp"] = datetime.now().isoformat()

    df.to_csv(csv_path, index=False)
    print(f"Results exported to {csv_path}")

    create_dashboard(df, output_path=dashboard_path)

    total = len(df)
    pos = len(df[df["label"] == "positive"])
    neg = len(df[df["label"] == "negative"])
    neu = len(df[df["label"] == "neutral"])
    avg_pol = df["polarity"].mean()
    avg_sub = df["subjectivity"].mean()

    report = f"""
{'=' * 50}
  SENTIMENT ANALYSIS REPORT
  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{'=' * 50}

  Total messages analyzed: {total}

  Breakdown:
    Positive: {pos} ({pos / total * 100:.1f}%)
    Negative: {neg} ({neg / total * 100:.1f}%)
    Neutral:  {neu} ({neu / total * 100:.1f}%)

  Averages:
    Polarity:     {avg_pol:.3f}  (scale: -1 to +1)
    Subjectivity: {avg_sub:.3f}  (scale: 0 to 1)

  Most positive: {df.loc[df['polarity'].idxmax(), 'text']}
  Most negative: {df.loc[df['polarity'].idxmin(), 'text']}

  Files generated:
    CSV:       {csv_path}
    Dashboard: {dashboard_path}
{'=' * 50}
"""
    return report


if __name__ == "__main__":
    sample_texts = [
        "Absolutely love this! Best purchase I've made all year.",
        "Horrible quality. Broke on the first day.",
        "It's fine. Does what it says.",
        "Customer support resolved my issue quickly. Thank you!",
        "Not worth the price. Very disappointed.",
        "Fast shipping and great packaging!",
        "The product is okay but the instructions were confusing.",
        "Exceeded all my expectations. Highly recommend!",
        "Waste of money. Save yourself the trouble.",
        "Average product. Nothing special, nothing terrible.",
        "Beautiful design and smooth performance!",
        "Arrived damaged and customer service was unhelpful.",
    ]

    report = generate_report(sample_texts)
    print(report)
```

شغّله:

```bash
uv run python report.py
```

افتح `results.csv` في جدول بيانات أو محرر نصي للتحقق من البيانات المُصدَّرة.

## التحديات

1. **إلحاق CSV حيّ.** عدّل `realtime.py` لإلحاق كل دفعة بـ `results.csv` بعد المعالجة، بدلًا من إبقاء كل شيء في الذاكرة. تلميح: استخدم `df.to_csv(path, mode="a", header=False)`.

2. **مرشح الموضوعية.** أضف علامة `--min-subjectivity` إلى `report.py` تتضمن فقط الرسائل الأعلى من عتبة الموضوعية قبل التحليل.

3. **توزيع فئات.** وسّع لوحة المعلومات بلوحة خامسة تجمّع القطبية حسب الفئة (تعرف الفئات عبر عمود `category` في CSV المدخل).

4. **وضع مراقبة الملفات.** راقب مجلدًا بحثًا عن ملفات `.txt` جديدة باستخدام `pathlib.Path.iterdir()`. عندما يظهر ملف جديد، حلّل محتواه وأضفه إلى لوحة المعلومات.

5. **ضبط العتبة.** عتبة الإيجابي/السلبي البالغة 0.1 اعتباطية. جرّب عتبات مختلفة (0.05 و0.15 و0.2) وقارن كيف يتغير توزيع التسميات. اكتب النتائج في ملف markdown.

## ما تعلمته

- **مشاعر TextBlob** تمنحك درجات القطبية والموضوعية بأقل إعداد
- **المعالجة الدفعية** بـ pandas تتيح لك تحليل آلاف النصوص بكفاءة
- **أشكال matplotlib متعددة اللوحات** تجمع الرسوم البيانية في عرض لوحة واحدة
- **المتوسطات المتدحرجة** تنعّم بيانات الرسائل المزعجة إلى اتجاهات مقروءة
- **تصدير CSV** يجعل تحليلك قابلاً للنقل والمشاركة
- **التحديثات الفورية** تحاكي تدفقات البيانات الحية لحالات المراقبة
