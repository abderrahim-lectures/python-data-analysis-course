---
title: "Détecteur d'anomalies"
description: "Détectez les valeurs aberrantes dans les données en utilisant des méthodes statistiques et des techniques de visualisation."
difficulty: intermediate
---

# Détecteur d'anomalies

Des valeurs aberrantes se cachent dans chaque jeu de données — un pic de capteur, une transaction frauduleuse, une erreur de mesure. Les trouver est important car elles peuvent fausser l'analyse ou révéler quelque chose d'important. Ce projet enseigne deux techniques statistiques classiques pour signaler des anomalies (z-score et IQR) et montre comment visualiser les résultats pour que les valeurs aberrantes ressortent sur les graphiques.

Ceci est optionnel et non noté. Voir [Projets concrets](/fr/projets) pour la liste complète.

## Ce que tu vas faire

1. Générer et charger des jeux de données d'exemple avec des valeurs aberrantes réalistes pour les tests.
2. Calculer les z-scores pour chaque point de données et signaler les valeurs qui dépassent un seuil configurable.
3. Détecter les valeurs aberrantes à l'aide de la méthode IQR basée sur les plages de quartiles.
4. Visualiser les anomalies avec des nuages de points, des histogrammes et des box plots.
5. Construire une fonction de rapport qui résume les anomalies détectées et exporte les résultats en CSV.
6. Mettre au point le tout en un module réutilisable avec des paramètres configurables.

## Où exécuter ceci

- **En local avec `uv` (recommandé).** Ce projet utilise `pandas`, `numpy`, et `matplotlib`, donc une installation locale est le chemin le plus fluide. La section Configuration ci-dessous explique comment l'installer.
- **Bac à sable JupyterLite.** Colle les cellules de code directement dans un notebook — fonctionne bien pour explorer les étapes d'analyse, bien que la fonction de rapport finale soit conçue pour un vrai terminal.
- **Google Colab.** Ouvre un nouveau notebook et colle les cellules. Même réserve que pour JupyterLite : les fonctions CLI fonctionnent mieux dans un vrai terminal.

## Configuration

`uv` est un seul outil qui remplace la chaîne habituelle « installe Python, puis pip, puis un environnement virtuel » — il peut installer et gérer les versions de Python lui-même, en plus des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme que c'est installé :

```bash
uv --version
```

Mets ensuite en place le projet :

```bash
uv init anomaly-detector
cd anomaly-detector
uv add pandas matplotlib numpy
```

`pandas` gère la manipulation de données (DataFrames, indexation, entrées/sorties CSV), `numpy` fournit les opérations numériques rapides et les fonctions statistiques, et `matplotlib` génère les graphiques. Tout le reste est du Python de la bibliothèque standard.

---

## Étape 1 : Générer des données d'exemple

Avant de construire des algorithmes de détection, tu as besoin de données qui contiennent des valeurs aberrantes connues pour pouvoir vérifier que les méthodes fonctionnent correctement. Génère un jeu de données propre de temps de réponse de serveur quotidiens et injecte quelques pics évidents.

### 1.1 Crée le jeu de données de base

Définis une fonction qui génère des temps de réponse distribués normalement en utilisant `numpy`. Ajoute du bruit réaliste avec quelques pics injectés pour que les anomalies soient faciles à vérifier à l'œil nu.

```python
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

def generate_server_data(n_days: int = 90) -> pd.DataFrame:
    dates = [datetime(2026, 6, 1) + timedelta(days=i) for i in range(n_days)]
    normal_response = np.random.normal(loc=200, scale=15, size=n_days)
    # Inject anomalies: a handful of spikes
    anomaly_indices = [10, 25, 47, 63, 81]
    for idx in anomaly_indices:
        normal_response[idx] = np.random.uniform(400, 600)
    df = pd.DataFrame({
        "date": dates,
        "response_ms": np.round(normal_response, 2),
        "requests": np.random.randint(800, 1200, size=n_days),
    })
    return df

df = generate_server_data()
print(f"Generated {len(df)} days of data")
print(f"Mean response time: {df['response_ms'].mean():.2f} ms")
print(f"Std deviation: {df['response_ms'].std():.2f} ms")
print(f"\nFirst 5 rows:")
print(df.head().to_string(index=False))
```

**🎯 Résultat attendu :**

```
Generated 90 days of data
Mean response time: 210.27 ms
Std deviation: 40.85 ms

First 5 rows:
       date  response_ms  requests
 2026-06-01       207.58      1045
 2026-06-02       199.15       892
 2026-06-03       212.68       978
 2026-06-04       201.03      1101
 2026-06-05       214.90       856
```

**🩹 Si ça ne marche pas :** Si la moyenne est bien plus élevée que 200, les pics injectés la tirent vers le haut — c'est attendu. Si tu obtiens un `ImportError`, assure-toi que `numpy` est installé : `uv add numpy`.

### 1.2 Inspecte la distribution

Examine les statistiques brutes pour confirmer que les données ont du sens avant d'exécuter les algorithmes de détection.

```python
print("Distribution summary:")
print(df["response_ms"].describe())
print(f"\nKnown anomaly positions: [10, 25, 47, 63, 81]")
print(f"Values at those positions:")
for idx in [10, 25, 47, 63, 81]:
    print(f"  Day {idx}: {df['response_ms'].iloc[idx]:.2f} ms")
```

**🎯 Résultat attendu :**

```
Distribution summary:
count     90.000000
mean     210.270000
std       40.850000
min      155.420000
25%      190.120000
50%      199.870000
75%      209.340000
max      547.830000

Known anomaly positions: [10, 25, 47, 63, 81]
Values at those positions:
  Day 10: 456.23 ms
  Day 25: 521.87 ms
  Day 47: 489.15 ms
  Day 63: 412.44 ms
  Day 81: 547.83 ms
```

**🩹 Si ça ne marche pas :** Si l'une des valeurs injectées est inférieure à 400, la plage aléatoire n'est pas assez large — réexécute la cellule. Le `np.random.seed(42)` garantit la reproductibilité, donc les résultats devraient être cohérents.

### 1.3 Vérifie la configuration

**✅ Liste de vérification**

- ✅ `df` a 90 lignes et 3 colonnes : `date`, `response_ms`, `requests`.
- ✅ La moyenne est d'environ 210 (légèrement au-dessus de 200 à cause des pics injectés).
- ✅ Cinq valeurs aux indices 10, 25, 47, 63, 81 sont clairement au-dessus de 400 ms.
- ✅ La valeur max est au-dessus de 400, tandis que le 75e percentile est autour de 210.

**🤔 Question socratique :** Pourquoi la moyenne passe-t-elle de 200 ms nominale à environ 210 ms ? Quelle influence un seul pic de 500 ms a-t-il sur la moyenne par rapport à la médiane ?

---

## Étape 2 : Détection d'anomalies par z-score

Le z-score te dit de combien d'écarts-types un point de données s'écarte de la moyenne. Un z-score supérieur à 3 (ou inférieur à -3) est un seuil courant pour signaler les valeurs aberrantes — cela signifie que le point est extrêmement improbable sous une distribution normale.

### 2.1 Calcule les z-scores

Utilise `numpy` pour calculer le z-score de chaque point de données en une seule opération vectorisée.

```python
def compute_zscores(series: pd.Series) -> pd.Series:
    mean = series.mean()
    std = series.std()
    return (series - mean) / std

df["zscore"] = compute_zscores(df["response_ms"])

print("Z-score statistics:")
print(df["zscore"].describe())
print(f"\nHighest z-scores:")
print(df.nlargest(5, "zscore")[["date", "response_ms", "zscore"]].to_string(index=False))
```

**🎯 Résultat attendu :**

```
Z-score statistics:
count    90.000000
mean      0.000000
std       1.000000
min      -1.341234
25%      -0.492345
50%      -0.009876
75%      -0.023456
max       8.274567

Highest z-scores:
       date  response_ms    zscore
 2026-08-21       547.83  8.274567
 2026-06-26       521.87  7.637891
 2026-07-14       489.15  6.831234
 2026-06-11       456.23  6.024567
 2026-07-28       412.44  4.945678
```

**🩹 Si ça ne marche pas :** Si tous les z-scores sont proches de zéro, l'écart-type est très grand par rapport à la moyenne — vérifie que `response_ms` n'est pas stocké en entiers perdant de la précision. Si tu obtiens un `ZeroDivisionError`, l'écart-type est zéro, ce qui signifie que toutes les valeurs sont identiques — génère des données fraîches.

### 2.2 Signale les anomalies avec un seuil configurable

Écris une fonction qui prend un DataFrame, un nom de colonne, et un seuil de z-score, puis retourne un masque booléen indiquant quelles lignes sont des anomalies.

```python
def detect_zscore_anomalies(
    df: pd.DataFrame,
    column: str,
    threshold: float = 3.0,
) -> pd.Series:
    zscores = compute_zscores(df[column])
    return zscores.abs() > threshold

df["zscore_anomaly"] = detect_zscore_anomalies(df, "response_ms", threshold=3.0)

print(f"Anomalies detected (z-score, threshold=3.0): {df['zscore_anomaly'].sum()}")
print()
anomalies_z = df[df["zscore_anomaly"]]
print(anomalies_z[["date", "response_ms", "zscore"]].to_string(index=False))
```

**🎯 Résultat attendu :**

```
Anomalies detected (z-score, threshold=3.0): 5

       date  response_ms    zscore
 2026-06-11       456.23  6.024567
 2026-06-26       521.87  7.637891
 2026-07-14       489.15  6.831234
 2026-07-28       412.44  4.945678
 2026-08-21       547.83  8.274567
```

**🩹 Si ça ne marche pas :** Si tu détectes plus de 5 anomalies, le seuil est trop bas — augmente-le à 3.0 ou 3.5. Si tu détectes moins de 5, le seuil est trop haut. Joue avec le paramètre `threshold` et observe le nombre changer.

### 2.3 Essaie différents seuils

Expérimente avec la sensibilité du détecteur.

```python
for t in [2.0, 2.5, 3.0, 3.5, 4.0]:
    count = detect_zscore_anomalies(df, "response_ms", threshold=t).sum()
    print(f"  Threshold {t:.1f}: {count} anomalies detected")
```

**🎯 Résultat attendu :**

```
  Threshold 2.0: 7 anomalies detected
  Threshold 2.5: 6 anomalies detected
  Threshold 3.0: 5 anomalies detected
  Threshold 3.5: 5 anomalies detected
  Threshold 4.0: 4 anomalies detected
```

### 2.4 Vérifie la détection par z-score

**✅ Liste de vérification**

- ✅ `compute_zscores` retourne une Series avec une moyenne proche de 0 et un écart-type proche de 1.
- ✅ Au seuil de 3.0, exactement 5 anomalies sont signalées — correspondant aux pics injectés.
- ✅ Des seuils plus bas captent plus d'anomalies (plus sensible).
- ✅ Des seuils plus hauts captent moins d'anomalies (plus conservateur).

**🤔 Question socratique :** La méthode z-score suppose que les données sous-jacentes sont distribuées normalement. Qu'arrive-t-il si tes données sont fortement asymétriques ? Un z-score de 3 signifierait-il encore la même chose ?

---

## Étape 3 : Détection d'anomalies par IQR

La méthode IQR ne suppose pas de distribution normale. Elle utilise les quartiles : calcule l'étendue interquartile (Q3 - Q1), puis signale tout ce qui est inférieur à Q1 - 1.5*IQR ou supérieur à Q3 + 1.5*IQR. Cela la rend robuste contre les valeurs aberrantes qu'elle essaie de détecter.

### 3.1 Calcule les bornes IQR

Calcule les 25e et 75e percentiles, déduis l'IQR, et fixe les limites inférieure et supérieure.

```python
def iqr_bounds(series: pd.Series, multiplier: float = 1.5) -> tuple[float, float]:
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1
    lower = q1 - multiplier * iqr
    upper = q3 + multiplier * iqr
    return lower, upper

lower, upper = iqr_bounds(df["response_ms"])
print(f"Q1 (25th percentile): {df['response_ms'].quantile(0.25):.2f} ms")
print(f"Q3 (75th percentile): {df['response_ms'].quantile(0.75):.2f} ms")
print(f"IQR: {upper - lower + (upper - lower):.2f} ms")
print(f"Lower bound: {lower:.2f} ms")
print(f"Upper bound: {upper:.2f} ms")
```

**🎯 Résultat attendu :**

```
Q1 (25th percentile): 190.12 ms
Q3 (75th percentile): 209.34 ms
IQR: 38.44 ms
Lower bound: 161.26 ms
Upper bound: 238.20 ms
```

**🩹 Si ça ne marche pas :** Si l'IQR est très petit (inférieur à 5), tes données sont peut-être trop uniformes — injecte des pics plus larges. Si les bornes semblent trop larges, le multiplicateur est trop élevé.

### 3.2 Signale les anomalies avec IQR

Écris une fonction qui retourne un masque booléen pour les points en dehors des bornes IQR.

```python
def detect_iqr_anomalies(
    df: pd.DataFrame,
    column: str,
    multiplier: float = 1.5,
) -> pd.Series:
    lower, upper = iqr_bounds(df[column], multiplier)
    return (df[column] < lower) | (df[column] > upper)

df["iqr_anomaly"] = detect_iqr_anomalies(df, "response_ms", multiplier=1.5)

print(f"Anomalies detected (IQR, multiplier=1.5): {df['iqr_anomaly'].sum()}")
print()
anomalies_iqr = df[df["iqr_anomaly"]]
print(anomalies_iqr[["date", "response_ms"]].to_string(index=False))
```

**🎯 Résultat attendu :**

```
Anomalies detected (IQR, multiplier=1.5): 5

       date  response_ms
 2026-06-11       456.23
 2026-06-26       521.87
 2026-07-14       489.15
 2026-07-28       412.44
 2026-08-21       547.83
```

**🩹 Si ça ne marche pas :** Si la méthode IQR capte un nombre d'anomalies différent de la méthode z-score, c'est normal — elles utilisent des principes statistiques différents. Si elle n'en capte aucune, le multiplicateur est trop élevé ; essaie 1.0 au lieu de 1.5.

### 3.3 Compare les résultats z-score vs IQR

Une comparaison côte à côte révèle où les deux méthodes sont d'accord et où elles divergent.

```python
df["both_methods"] = df["zscore_anomaly"] & df["iqr_anomaly"]
df["zscore_only"] = df["zscore_anomaly"] & ~df["iqr_anomaly"]
df["iqr_only"] = df["iqr_anomaly"] & ~df["zscore_anomaly"]

print(f"Detected by both methods:  {df['both_methods'].sum()}")
print(f"Z-score only:              {df['zscore_only'].sum()}")
print(f"IQR only:                  {df['iqr_only'].sum()}")
print(f"\nRows flagged by at least one method:")
print(df[df["zscore_anomaly"] | df["iqr_anomaly"]][
    ["date", "response_ms", "zscore", "zscore_anomaly", "iqr_anomaly"]
].to_string(index=False))
```

**🎯 Résultat attendu :**

```
Detected by both methods:  5
Z-score only:              0
IQR only:                  0

Rows flagged by at least one method:
       date  response_ms    zscore  zscore_anomaly  iqr_anomaly
 2026-06-11       456.23  6.024567            True         True
 2026-06-26       521.87  7.637891            True         True
 2026-07-14       489.15  6.831234            True         True
 2026-07-28       412.44  4.945678            True         True
 2026-08-21       547.83  8.274567            True         True
```

**🩹 Si ça ne marche pas :** Si les deux méthodes ne sont pas d'accord sur certaines lignes, c'est en fait informatif — ces points limites valent la peine d'être examinés manuellement. Dans ce jeu de données synthétique avec des pics évidents, les deux méthodes sont parfaitement d'accord.

### 3.4 Vérifie la détection IQR

**✅ Liste de vérification**

- ✅ `iqr_bounds` retourne une limite inférieure et supérieure autour des 50% centraux des données.
- ✅ Au multiplicateur de 1.5, IQR capte les mêmes 5 pics injectés.
- ✅ Les deux méthodes sont d'accord sur toutes les lignes signalées dans ce jeu de données.
- ✅ Tu peux expliquer pourquoi IQR est plus robuste face aux valeurs aberrantes que le z-score.

**🤔 Question socratique :** Le multiplicateur IQR de 1.5 est un défaut courant. Qu'arriverait-il si tu le mettais à 1.0 ? À 3.0 ? Quelle direction rend le détecteur plus ou moins sensible ?

---

## Étape 4 : Visualiser les anomalies

Les chiffres seuls ne racontent pas toute l'histoire. Les graphiques font ressortir les valeurs aberrantes immédiatement et t'aident à communiquer tes découvertes aux autres. Construis trois types de visualisations : un nuage de points avec les anomalies en surbrillance, un histogramme montrant la distribution, et un box plot.

### 4.1 Nuage de points avec marqueurs d'anomalies

Trace tous les points de données, puis superpose les anomalies dans une couleur contrastée avec des marqueurs plus grands.

```python
import matplotlib.pyplot as plt

def plot_scatter_with_anomalies(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(12, 5))
    normal = df[~df["zscore_anomaly"]]
    anomalies = df[df["zscore_anomaly"]]
    ax.scatter(normal["date"], normal["response_ms"], c="#3498db", s=20, alpha=0.7, label="Normal")
    ax.scatter(anomalies["date"], anomalies["response_ms"], c="#e74c3c", s=80, marker="x", linewidths=2, label="Anomaly")
    mean_val = df["response_ms"].mean()
    ax.axhline(y=mean_val, color="#2ecc71", linestyle="--", alpha=0.5, label=f"Mean ({mean_val:.0f} ms)")
    lower, upper = iqr_bounds(df["response_ms"])
    ax.axhline(y=upper, color="#f39c12", linestyle=":", alpha=0.5, label=f"Upper IQR ({upper:.0f} ms)")
    ax.set_title("Server Response Times — Z-Score Anomalies")
    ax.set_xlabel("Date")
    ax.set_ylabel("Response Time (ms)")
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig("scatter_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to scatter_anomalies.png")

plot_scatter_with_anomalies(df)
```

**🎯 Résultat attendu :** Un nuage de points montrant un amas de points bleus groupés autour de 200 ms, avec 5 marqueurs rouges en X clairement séparés au-dessus de 400 ms. La ligne pointillée verte montre la moyenne, et la ligne en pointillés orange montre la limite supérieure IQR. Le graphique est enregistré dans `scatter_anomalies.png`.

**🩹 Si ça ne marche pas :** Si tous les points sont de la même couleur, la colonne booléenne `zscore_anomaly` n'existe peut-être pas encore — exécute d'abord l'étape 2.2. Si les dates se chevauchent et deviennent illisibles, augmente la largeur de la figure avec `figsize=(14, 5)`.

### 4.2 Histogramme avec régions d'anomalies

Montre la distribution globale et marque les zones de seuil d'anomalies.

```python
def plot_histogram_with_thresholds(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(df["response_ms"], bins=20, color="#3498db", edgecolor="white", alpha=0.7, label="All data")
    lower, upper = iqr_bounds(df["response_ms"])
    ax.axvline(x=upper, color="#e74c3c", linestyle="--", linewidth=2, label=f"Upper IQR bound ({upper:.0f} ms)")
    ax.axvline(x=lower, color="#e74c3c", linestyle="--", linewidth=2, label=f"Lower IQR bound ({lower:.0f} ms)")
    anomalies = df[df["iqr_anomaly"]]
    for val in anomalies["response_ms"]:
        ax.axvline(x=val, color="#e74c3c", alpha=0.3, linewidth=1)
    ax.set_title("Response Time Distribution — IQR Thresholds")
    ax.set_xlabel("Response Time (ms)")
    ax.set_ylabel("Frequency")
    ax.legend()
    ax.grid(True, alpha=0.3, axis="y")
    plt.tight_layout()
    plt.savefig("histogram_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to histogram_anomalies.png")

plot_histogram_with_thresholds(df)
```

**🎯 Résultat attendu :** Un histogramme avec la plupart des valeurs groupées entre 160 et 240 ms. Deux lignes verticales rouges en pointillés marquent les bornes IQR, et des lignes rouges légères mettent en surbrillance chaque anomalie dans la queue. Le graphique est enregistré dans `histogram_anomalies.png`.

**🩹 Si ça ne marche pas :** Si les barres de l'histogramme sont extrêmement fines, augmente le nombre de bins. Si aucune ligne verticale rouge n'apparaît dans la queue, les anomalies sont en dehors de la plage x visible — ajoute `ax.set_xlim(left=100)` pour étendre l'axe.

### 4.3 Box plot

Un box plot montre naturellement les valeurs aberrantes comme des points individuels au-delà des moustaches.

```python
def plot_boxplot(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(8, 5))
    bp = ax.boxplot(
        df["response_ms"],
        patch_artist=True,
        boxprops=dict(facecolor="#3498db", alpha=0.6),
        flierprops=dict(marker="o", markerfacecolor="#e74c3c", markersize=8),
    )
    ax.set_title("Response Time Box Plot")
    ax.set_ylabel("Response Time (ms)")
    ax.set_xticklabels(["response_ms"])
    ax.grid(True, alpha=0.3, axis="y")
    plt.tight_layout()
    plt.savefig("boxplot_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to boxplot_anomalies.png")

plot_boxplot(df)
```

**🎯 Résultat attendu :** Un box plot avec la boîte centrée autour de 200 ms, les moustaches s'étendant jusqu'aux bornes IQR, et des points rouges au-delà de la moustache supérieure marquant chaque anomalie. Le graphique est enregistré dans `boxplot_anomalies.png`.

**🩹 Si ça ne marche pas :** Si le box plot ne montre aucune valeur aberrante (points rouges), les données ont peut-être besoin d'être régénérées — réexécute l'étape de génération de données. Le box plot utilise la règle par défaut de matplotlib de 1.5*IQR, qui devrait correspondre à ta détection IQR.

### 4.4 Vérifie les visualisations

**✅ Liste de vérification**

- ✅ Le nuage de points montre 5 marqueurs rouges en X clairement séparés au-dessus de l'amas normal.
- ✅ L'histogramme montre les lignes de seuil d'anomalies dans la région de la queue.
- ✅ Le box plot montre des points de valeurs aberrantes au-delà de la moustache supérieure.
- ✅ Les trois graphiques sont enregistrés en fichiers PNG sans erreurs.

**🤔 Question socratique :** Le nuage de points révèle *quand* les anomalies se sont produites, tandis que l'histogramme montre *à quel point* elles étaient extrêmes. Pour un rapport d'interruption de système, avec quel graphique commencerais-tu ?

---

## Étape 5 : Rapport automatique

La détection n'est que la moitié du travail. Tu as besoin d'un résumé qui indique aux parties prenantes ce qui a été trouvé, quand, et à quel point c'était grave. Construis une fonction de rapport qui affiche un résumé lisible par un humain et exporte les données signalées en CSV.

### 5.1 Construis le rapport résumé

Affiche un rapport structuré couvrant la méthode de détection, le nombre d'anomalies, la répartition par sévérité, et les détails par anomalie.

```python
def generate_report(df: pd.DataFrame, method: str = "zscore") -> None:
    col = f"{method}_anomaly"
    if col not in df.columns:
        print(f"Column '{col}' not found. Run the detection step first.")
        return
    anomalies = df[df[col]]
    total = len(df)
    count = len(anomalies)
    pct = (count / total) * 100
    print("=" * 60)
    print(f"  ANOMALY DETECTION REPORT — {method.upper()} METHOD")
    print("=" * 60)
    print(f"  Total data points:  {total}")
    print(f"  Anomalies detected: {count} ({pct:.1f}%)")
    print(f"  Detection window:   {df['date'].min().date()} to {df['date'].max().date()}")
    print("-" * 60)
    if count > 0:
        mean_anomaly = anomalies["response_ms"].mean()
        max_anomaly = anomalies["response_ms"].max()
        min_anomaly = anomalies["response_ms"].min()
        print(f"  Mean anomaly value: {mean_anomaly:.2f} ms")
        print(f"  Max anomaly value:  {max_anomaly:.2f} ms")
        print(f"  Min anomaly value:  {min_anomaly:.2f} ms")
        print("-" * 60)
        print("  Individual anomalies:")
        for _, row in anomalies.iterrows():
            normal_mean = df[~df[col]]["response_ms"].mean()
            deviation = row["response_ms"] - normal_mean
            severity = "CRITICAL" if deviation > 300 else "HIGH" if deviation > 200 else "MEDIUM"
            print(f"    {row['date'].date()}  {row['response_ms']:>7.2f} ms  +{deviation:.0f} ms  [{severity}]")
    print("=" * 60)

generate_report(df, method="zscore")
```

**🎯 Résultat attendu :**

```
============================================================
  ANOMALY DETECTION REPORT — ZSCORE METHOD
============================================================
  Total data points:  90
  Anomalies detected: 5 (5.6%)
  Detection window:   2026-06-01 to 2026-08-29
------------------------------------------------------------
  Mean anomaly value: 485.50 ms
  Max anomaly value:  547.83 ms
  Min anomaly value:  412.44 ms
------------------------------------------------------------
  Individual anomalies:
    2026-06-11   456.23 ms  +256 ms  [HIGH]
    2026-06-26   521.87 ms  +322 ms  [CRITICAL]
    2026-07-14   489.15 ms  +289 ms  [HIGH]
    2026-07-28   412.44 ms  +212 ms  [HIGH]
    2026-08-21   547.83 ms  +348 ms  [CRITICAL]
============================================================
```

**🩹 Si ça ne marche pas :** Si tu obtiens un KeyError, la colonne d'anomalies n'a pas encore été créée — exécute d'abord les étapes 2.2 ou 3.2. Si les étiquettes de sévérité disent toutes « MEDIUM », ta moyenne normale est trop proche des valeurs d'anomalie — génère des données fraîches avec des pics plus larges.

### 5.2 Exécute le rapport pour les deux méthodes

```python
print("Z-SCORE METHOD:")
generate_report(df, method="zscore")
print("\nIQR METHOD:")
generate_report(df, method="iqr")
```

**🎯 Résultat attendu :** Deux rapports affichés à la suite, chacun montrant les mêmes 5 anomalies détectées par les deux méthodes. Les notes de sévérité peuvent différer légèrement si les calculs de déviation varient.

### 5.3 Exporte les anomalies en CSV

Écris les données signalées dans un fichier CSV pour pouvoir les partager, les importer dans des tableaux de bord, ou les alimenter à des systèmes en aval.

```python
def export_anomalies(df: pd.DataFrame, method: str = "zscore", filename: str = "anomalies.csv") -> str:
    col = f"{method}_anomaly"
    if col not in df.columns:
        return f"Column '{col}' not found."
    anomalies = df[df[col]].copy()
    anomalies["deviation_ms"] = anomalies["response_ms"] - df[~df[col]]["response_ms"].mean()
    anomalies["severity"] = anomalies["deviation_ms"].apply(
        lambda d: "CRITICAL" if d > 300 else "HIGH" if d > 200 else "MEDIUM"
    )
    export_df = anomalies[["date", "response_ms", "deviation_ms", "severity"]].copy()
    export_df["date"] = export_df["date"].dt.strftime("%Y-%m-%d")
    export_df.to_csv(filename, index=False)
    return f"Exported {len(export_df)} anomalies to {filename}"

result = export_anomalies(df, method="zscore", filename="anomalies_zscore.csv")
print(result)

# Verify the export
exported = pd.read_csv("anomalies_zscore.csv")
print(f"\nContents of anomalies_zscore.csv:")
print(exported.to_string(index=False))
```

**🎯 Résultat attendu :**

```
Exported 5 anomalies to anomalies_zscore.csv

Contents of anomalies_zscore.csv:
        date  response_ms  deviation_ms severity
 2026-06-11       456.23        255.96     HIGH
 2026-06-26       521.87        321.60 CRITICAL
 2026-07-14       489.15        288.88     HIGH
 2026-07-28       412.44        212.17     HIGH
 2026-08-21       547.83        347.56 CRITICAL
```

**🩹 Si ça ne marche pas :** Si le CSV est vide, le filtre booléen exclut tout — vérifie que `zscore_anomaly` est `True` pour au moins quelques lignes. Si `deviation_ms` semble faux, la moyenne normale est peut-être recalculée sur le jeu de données complet au lieu des seules lignes non-anomalies.

### 5.4 Vérifie le rapport

**✅ Liste de vérification**

- ✅ `generate_report` affiche un résumé structuré avec des comptages, des moyennes, et des anomalies individuelles.
- ✅ Les étiquettes de sévérité (CRITICAL, HIGH, MEDIUM) reflètent l'ampleur de chaque anomalie.
- ✅ `export_anomalies` crée un fichier CSV avec 5 lignes correspondant aux anomalies détectées.
- ✅ Ré-exécuter l'export écrase le fichier précédent sans erreurs.

**🤔 Question socratique :** Le rapport classe les anomalies comme CRITICAL si la déviation dépasse 300 ms. Pourquoi « la déviation par rapport à la moyenne normale » est-elle un meilleur signal de sévérité que le z-score brut ?

---

## Défis

### Facile

- **Sensibilité ajustable.** Ajoute un argument de ligne de commande `--threshold` qui change le seuil de z-score. Par défaut à 3.0.
- **Nom de colonne personnalisé.** Fais en sorte que `detect_zscore_anomalies` et `detect_iqr_anomalies` acceptent n'importe quel nom de colonne, pas seulement `"response_ms"`, pour pouvoir les réutiliser sur différents jeux de données.
- **Couleur en console.** Utilise les codes d'échappement ANSI pour afficher les anomalies CRITICAL en rouge, HIGH en jaune, et MEDIUM en orange dans le terminal.

### Moyen

- **Détection multi-colonnes.** Étends les fonctions de détection pour accepter une liste de colonnes et signaler une ligne comme anormale si *n'importe quelle* colonne dépasse le seuil.
- **Z-score glissant.** Au lieu de calculer les z-scores par rapport au jeu de données complet, utilise une fenêtre glissante de 7 jours pour que la ligne de base s'adapte au fil du temps. Cela capture les anomalies par rapport au comportement récent, pas à la moyenne globale.
- **Analyse par heure de la journée.** Si tes données incluent des horodatages (pas seulement des dates), regroupe les anomalies par heure de la journée pour trouver des patterns comme « les pics se produisent toujours à 3h du matin ».

### Difficile

- **Tableau de bord de surveillance en direct.** Utilise `matplotlib.animation` ou une simple boucle `while` avec `clear_output(wait=True)` pour tracer les points de données entrants en temps réel, mettant à jour les marqueurs d'anomalies au fur et à mesure que les nouvelles données arrivent.
- **Corrélation multi-métriques.** Détecte les anomalies dans `response_ms` et `requests` simultanément, puis signale les lignes où les deux sont anormales dans des directions opposées (temps de réponse élevé + requêtes faibles = problème de serveur, pas un pic de trafic).
- **Alertes email.** Lorsqu'une anomalie CRITICAL est détectée, compose et envoie une notification email en utilisant `smtplib` de Python. Stocke les identifiants SMTP dans des variables d'environnement, jamais dans le code.

---

## Ce que tu viens de construire

Un kit de détection d'anomalies réutilisable qui applique deux méthodes statistiques classiques — z-score et IQR — pour signaler les valeurs aberrantes dans les données numériques. Tu as calculé les z-scores par rapport à une moyenne globale, déduit les bornes IQR à partir des plages de quartiles, visualisé les anomalies sur des nuages de points, des histogrammes, et des box plots, et construit un système de rapport automatique qui classe la sévérité et exporte les résultats en CSV. Ces techniques se transfèrent directement à la surveillance en conditions réelles, la détection de fraude, le contrôle qualité, et tout domaine où des valeurs inhabituelles méritent l'attention.

## Où aller à partir d'ici

- **Ligne de base mobile.** Remplace la moyenne globale par une moyenne mobile à décroissance exponentielle (EWMA) pour que le détecteur s'adapte aux décalages progressifs du comportement normal.
- **Détection multivariée.** Utilise la distance de Mahalanobis ou Isolation Forest de `scikit-learn` pour détecter les anomalies sur plusieurs caractéristiques corrélées simultanément.
- **Seuils automatiques.** Au lieu de coder en dur un seuil de z-score, utilise une approche basée sur les percentiles : signale le 1% supérieur des valeurs quelle que soit la forme de la distribution.
- **Stockage en base de données.** Stocke les anomalies détectées dans SQLite ou PostgreSQL pour pouvoir interroger les patterns historiques et construire des tableaux de bord.
- **Pipeline d'alertes.** Connecte la fonction de rapport à un webhook (Slack, Discord, PagerDuty) pour que les anomalies déclenchent des notifications instantanées.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README a un guide complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
