---
title: "Tableau de bord d'analyse de sentiment"
description: "Analysez le sentiment de textes avec TextBlob et construisez un tableau de bord en temps réel avec matplotlib."
difficulty: "intermediate"
estimatedMinutes: 55
xpReward: 50
tags: ["NLP", "sentiment", "matplotlib", "pandas"]
prerequisites: ["Python basics", "Basic pandas", "Basic matplotlib"]
---

# 📊 Tableau de bord d'analyse de sentiment

Le texte est partout — avis, tweets, tickets de support, réponses à des sondages. Savoir si ce texte est positif, négatif, ou neutre vous aide à prendre des décisions rapidement. Dans ce projet, vous construirez un pipeline d'analyse de sentiment avec TextBlob et visualiserez les résultats dans un tableau de bord matplotlib en temps réel qui se met à jour à mesure que de nouvelles données arrivent.

## 🎯 Ce que vous allez faire

1. Analyser le sentiment de textes avec TextBlob.
2. Classifier un texte comme positif, négatif, ou neutre.
3. Construire un tableau de bord qui se met à jour en temps réel.
4. Visualiser la distribution du sentiment dans le temps.
5. Générer des rapports récapitulatifs.

## Ce que vous allez construire

Un tableau de bord de sentiment qui :

- Analyse l'entrée de texte pour la polarité du sentiment.
- Classifie le sentiment avec des scores de confiance.
- Affiche des graphiques en temps réel des tendances de sentiment.
- Génère des rapports récapitulatifs périodiques.
- Exporte les résultats en CSV.

## Setup

```bash
uv init sentiment-dashboard
cd sentiment-dashboard
uv add textblob matplotlib pandas
```

Ensuite, téléchargez les corpus de TextBlob (une seule fois) :

```bash
uv run python -m textblob.download_corpora
```

## Étape 1 : Analyse de sentiment de base

TextBlob enveloppe les outils de sentiment de NLTK dans une API simple. Chaque objet `TextBlob` expose un namedtuple `sentiment` avec deux champs :

| Champ | Plage | Signification |
|-------------|-----------|----------------------------------------------|
| `polarity` | -1 à 1 | -1 = très négatif, 1 = très positif |
| `subjectivity` | 0 à 1 | 0 = fait objectif, 1 = pure opinion |

Créez un fichier appelé `sentiment.py` :

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

Exécutez-le :

```bash
uv run python sentiment.py
```

**🎯 Résultat attendu :**

```
positive | pol=+0.625 | I absolutely love this product! It changed my life.
negative | pol=-0.850 | Terrible experience. Will never buy again.
 neutral | pol=+0.000 | The package arrived on Tuesday.
 neutral | pol=+0.500 | The food was okay, nothing special.
positive | pol=+0.625 | Best day ever! I'm so happy right now!
```

**🩹 Si ça ne marche pas :**

- `LookupError: resource not found` — Vous avez sauté le téléchargement des corpus. Exécutez `uv run python -m textblob.download_corpora`.
- Tous les résultats affichent `neutral` avec `pol=0.0` — TextBlob a besoin du corpus `averaged_perceptron_tagger`. Relancez le téléchargement des corpus.

### 1.1 Vérifie

**✅ Liste de vérification**

- ✅ Chacune des cinq phrases d'exemple est classifiée avec le bon label (positif, négatif, ou neutre).
- ✅ Les polarités s'étendent sur les deux côtés de zéro — pas toutes à 0,000.
- ✅ Le script s'exécute sans `LookupError`.

**🤔 Question(s) socratique(s)**

- Le seuil du label est de 0,1 en valeur absolue. Que se passerait-il si vous le baissiez à 0,01 ou le montiez à 0,5 ? Comment le nombre de phrases « neutres » changerait-il ?
- Pourquoi une phrase comme « The package arrived on Tuesday. » obtient-elle exactement 0,000 alors que la phrase « The food was okay » obtient +0,500 ?

## Étape 2 : Traitement par lots

La vraie analyse travaille sur des jeux de données, pas sur des chaînes uniques. Pandas rend le traitement par lots simple.

Créez `batch.py` :

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

Exécutez-le :

```bash
uv run python batch.py
```

**🎯 Résultat attendu :** `process_texts` retourne un DataFrame avec une ligne par avis, et `summary_stats` affiche le total, les comptages par label, et les moyennes de polarité/subjectivité — tous calculés sur les 10 phrases d'exemple.

**🩹 Si ça ne marche pas :** Si `Summary Stats` affiche un total inférieur à 10, vérifiez que chaque phrase est bien passée par `analyze_sentiment`. Si `avg_polarity` semble absurde, vérifiez que `df["polarity"].mean()` calcule bien sur la colonne numérique, pas sur du texte.

### 2.1 Vérifie

**✅ Liste de vérification**

- ✅ `process_texts` produit exactement 10 lignes, une par avis.
- ✅ Le DataFrame a les colonnes `text`, `polarity`, `subjectivity`, et `label`.
- ✅ `summary_stats` affiche un total de 10 et des comptages dont la somme fait 10.
- ✅ Les moyennes de polarité et de subjectivité tombent dans leurs plages valides (-1 à 1, et 0 à 1).

**🤔 Question(s) socratique(s)**

- `load_and_analyze` utilise `pd.concat([df, analyses], axis=1)`. Pourquoi est-ce mieux que de modifier le DataFrame original ligne par ligne ?
- Dans `summary_stats`, pourquoi utiliser `counts.get("positive", 0)` plutôt que `counts["positive"]` ?

## Étape 3 : Construire le tableau de bord

Maintenant, visualisez les résultats. Nous créerons une figure matplotlib à plusieurs panneaux avec :

1. Un graphique à barres des comptages de sentiment.
2. Un histogramme des scores de polarité.
3. Un graphique en série temporelle (simulé avec un index).
4. Un graphique en camembert de la distribution des labels.

Créez `dashboard.py` :

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

Exécutez-le :

```bash
uv run python dashboard.py
```

**🎯 Résultat attendu :** Le script affiche `Dashboard saved to dashboard.png`. Ouvrez `dashboard.png` pour voir la disposition à quatre panneaux.

**🩹 Si ça ne marche pas :** Si le fichier ne s'enregistre pas, vérifiez que le répertoire courant est accessible en écriture. Si les panneaux semblent vides, vérifiez que `df` contient bien les colonnes `label`, `polarity`, et (`timestamp` ou un index).

### 3.1 Vérifie

**✅ Liste de vérification**

- ✅ `dashboard.png` existe et s'ouvre comme une vraie image.
- ✅ La disposition en 2×2 affiche quatre panneaux distincts : graphique à barres, histogramme, série temporelle, et camembert.
- ✅ Le graphique à barres affiche les trois labels avec leurs comptages.
- ✅ L'histogramme de polarité a une vraie forme, pas une seule barre plate.
- ✅ La série temporelle montre une ligne « 5-message rolling avg » quand le DataFrame a au moins 5 lignes.

**🤔 Question(s) socratique(s)**

- Le troisième panneau vérifie `if "timestamp" in df.columns`. Que se passe-t-il sur l'axe x quand cette colonne est absente, et en quoi est-ce différent quand elle est présente ?
- Pourquoi `matplotlib.use("Agg")` est-il nécessaire en haut du fichier ? Qu'arriverait-il si ce script tournait sur un serveur sans affichage ?

## Étape 4 : Mises à jour en temps réel

Simulez un flux en direct en traitant de nouveaux textes périodiquement et en les ajoutant au jeu de données. Nous utilisons une boucle avec `time.sleep()` pour imiter des données entrantes.

Créez `realtime.py` :

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

Exécutez-le :

```bash
uv run python realtime.py
```

**🎯 Résultat attendu :** Vous verrez `dashboard_live.png` se mettre à jour toutes les 5 secondes avec de nouvelles données ajoutées. Appuyez sur `Ctrl+C` pour arrêter tôt — le récapitulatif final s'affiche quoi qu'il arrive.

**🩹 Si ça ne marche pas :** Si le script se termine immédiatement sans passer de batches, vérifiez la valeur de `duration`. Si `dashboard_live.png` ne semble pas changer entre les batches, vérifiez que `analyze_sentiment` produit réellement des résultats différents selon les phrases de `SAMPLE_FEEDS`.

### 4.1 Vérifie

**✅ Liste de vérification**

- ✅ Le script tourne pendant environ 20 secondes et affiche plusieurs batches.
- ✅ Chaque ligne de batch affiche des comptages `+pos`, `-neg`, `~neu`, et le total.
- ✅ `dashboard_live.png` est ré-enregistré à chaque batch (la date de modification change).
- ✅ `Ctrl+C` arrête proprement et le récapitulatif final (Total messages, Avg polarity) s'affiche.

**🤔 Question(s) socratique(s)**

- Le nombre de messages total grandit avec chaque batch. Au bout de combien de batches le panneau « 5-message rolling avg » commence-t-il à apparaître dans le tableau de bord, et pourquoi ?
- Quelle est la limite de cette simulation par rapport à un vrai flux en direct ? Que devrait-on changer pour traiter de vrais messages entrants ?

## Étape 5 : Rapports récapitulatifs

Enveloppez tout dans un générateur de rapport qui produit un récapitulatif texte et un export CSV.

Créez `report.py` :

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

Exécutez-le :

```bash
uv run python report.py
```

**🎯 Résultat attendu :** Le script affiche un rapport texte encadré avec le nombre de messages, la répartition positive/négative/neutre, les moyennes, et les messages les plus positif et le plus négatif. Ouvrez `results.csv` dans un tableur ou un éditeur de texte pour vérifier les données exportées.

**🩹 Si ça ne marche pas :** Si le rapport plante avec une erreur de division par zéro, vérifiez que `texts` n'est pas vide. Si `df.loc[df['polarity'].idxmax(), 'text']` échoue, vérifiez que le DataFrame a bien une colonne `text`.

### 5.1 Vérifie

**✅ Liste de vérification**

- ✅ `results.csv` existe et contient une ligne par phrase d'exemple avec `text`, `polarity`, `subjectivity`, `label`, et `timestamp`.
- ✅ `report_dashboard.png` existe et s'ouvre comme une vraie image.
- ✅ Les pourcentages du rapport totalisent environ 100 %.
- ✅ Les lignes « Most positive » et « Most negative » montrent des phrases réellement classifiées de ces façons.

**🤔 Question(s) socratique(s)**

- Le rapport tronque les phrases affichées. Pourquoi `df.loc[df['polarity'].idxmax(), 'text']` pourrait-il être trompeur si deux messages avaient la même polarité maximale ?
- `df["timestamp"] = datetime.now().isoformat()` assigne la même valeur à toutes les lignes. Pourquoi est-ce acceptable ici, et dans quel cas faudrait-il des horodatages distincts ?

## 🧩 Défis

1. **Ajout CSV en direct.** Modifiez `realtime.py` pour ajouter chaque batch à `results.csv` après traitement, au lieu de tout garder en mémoire. Indice : utilisez `df.to_csv(path, mode="a", header=False)`.

2. **Filtre de subjectivité.** Ajoutez un drapeau `--min-subjectivity` à `report.py` qui n'inclut que les messages au-dessus d'un seuil de subjectivité avant l'analyse.

3. **Ventilation par catégorie.** Étendez le tableau de bord avec un cinquième panneau qui regroupe la polarité par catégorie (vous définissez les catégories via une colonne `category` dans le CSV d'entrée).

4. **Mode surveilleur de fichiers.** Surveillez un répertoire pour de nouveaux fichiers `.txt` en utilisant `pathlib.Path.iterdir()`. Quand un nouveau fichier apparaît, analysez son contenu et ajoutez-le au tableau de bord.

5. **Réglage du seuil.** Le seuil positif/négatif de 0,1 est arbitraire. Expérimentez avec différents seuils (0,05, 0,15, 0,2) et comparez comment la distribution des labels change. Écrivez vos conclusions dans un fichier markdown.

## Ce que vous avez appris

- **Le sentiment TextBlob** vous donne des scores de polarité et de subjectivité avec un minimum de configuration.
- **Le traitement par lots** avec pandas vous permet d'analyser des milliers de textes efficacement.
- **Les figures matplotlib à plusieurs panneaux** combinent des graphiques en une vue de tableau de bord unique.
- **Les moyennes mobiles** lissent des données bruitées par message en tendances lisibles.
- **L'export CSV** rend votre analyse portable et partageable.
- **Les mises à jour en temps réel** simulent des flux de données en direct pour des cas d'usage de surveillance.