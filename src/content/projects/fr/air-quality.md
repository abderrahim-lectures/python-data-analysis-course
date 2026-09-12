---
title: "Tableau de Bord de Qualité de l'Air"
description: "Surveillez l'indice de qualité de l'air avec ventilation des polluants, recommandations de santé et cartographie."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Environment", "APIs", "Data Visualization"]
prerequisites:
  - "Bases de données ordonnées : DataFrames, dtypes, description d'une colonne"
  - "Appliquer une fonction Python à chaque ligne d'un DataFrame"
  - "Regrouper et compter avec pandas"
learningObjectives:
  - "Charger un jeu de données ordonné indexé par le temps et inspecter sa forme et ses dtypes"
  - "Traduire les concentrations brutes de PM2.5 en nombres AQI de l'EPA avec une formule par morceaux (points de rupture)"
  - "Étiqueter chaque heure avec une catégorie et trouver les lectures la pire et la meilleure"
  - "Agréger les lectures horaires sur une semaine et imprimer un rapport de santé en langage courant"
  - "Tracer l'AQI horaire contre les seuils de catégorie et enregistrer la figure sur disque"
---


# 🛠️ 🌬️ Construire un Tableau de Bord de Qualité de l'Air

La qualité de l'air est un problème de calcul de nombres caché dans un flux de capteurs. Ce projet prend une semaine de lectures de PM2.5, de minuscules particules en suspension qui sont le polluant urbain le plus courant, convertit chaque concentration horaire en valeur d'Index de Qualité de l'Air (AQI) de l'EPA, range ces valeurs dans des catégories de santé, et produit les deux choses qu'un citoyen concerné veut réellement : un rapport en langage courant (« la soirée de mardi a été le pire passage ») et un graphique qui montre la semaine d'un coup d'œil. Les données sont de forme réelle mais honnêtes : le projet tente de récupérer des lectures en direct depuis une API publique et retombe sur un échantillon déterministe que tu peux reproduire au nombre décimal près, donc tes chiffres rapportés sont toujours vérifiables.

Cela suppose les bases du travail avec des données ordonnées et rien de tout cela n'est noté ; c'est optionnel et non noté, voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Charger une semaine ordonnée de lectures de PM2.5 dans un DataFrame et vérifier sa forme et ses dtypes.
2. Écrire la formule de points de rupture de l'EPA qui transforme la concentration en un AQI en nombre entier.
3. Étiqueter chaque heure avec une catégorie, et trouver la pire heure et la meilleure heure de la semaine.
4. Agréger la semaine en un rapport texte lisible avec des conseils de santé.
5. Tracer l'AQI moyen par heure contre les lignes de seuil sûres et enregistrer un PNG.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé : ce projet vit et meurt sur pandas + matplotlib, tous deux à un seul `uv add`, et le `aqi_week.png` enregistré atterrit sur ton propre disque.

**Google Colab, Kaggle Notebooks et Binder** sont tous de première classe ici, pandas et matplotlib sont préinstallés dans chacun, `!pip install requests` couvre l'enveloppe de récupération en direct, et `matplotlib.use("Agg")` à l'Étape 5 garde les tracés compatibles sans interface graphique dans chaque environnement. Les notebooks sont un excellent choix si ta machine de cours manque d'un Python local ; souviens-toi juste que toute donnée d'API en direct changera entre les sessions, ce qui est exactement le but de l'échantillon déterministe.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/air-quality/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/air-quality/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fair-quality%2Fnotebook.fr.ipynb)

## Configuration

Tout ce qui est nécessaire avant que le tableau de bord ne s'exécute : un projet avec pandas, et une semaine déterministe de lectures à lui donner.

### Mets en place le projet

```bash
uv init air-quality
cd air-quality
uv add pandas numpy matplotlib requests
```

`pandas` fait le travail de dataframe, `numpy` construit l'échantillon déterministe, `matplotlib` dessine le graphique, et `requests` alimente la récupération en direct optionnelle. Si tu sautes `requests`, supprime `fetch_live()` à l'Étape 1, chaque Résultat attendu de ce projet est calculé depuis l'échantillon déterministe, donc rien en aval ne casse.

**✅ Liste de vérification**

- ✅ `uv add pandas numpy matplotlib requests` se termine sans erreurs.
- ✅ Tu peux faire `import pandas as pd` depuis l'intérieur du répertoire du projet.

**🤔 Question(s) socratique(s)**

- Pourquoi le chemin de récupération en direct de ce projet a-t-il *besoin* d'un repli, qu'est-ce qui fait d'une API une mauvaise garantie sur laquelle construire tout un rapport, et comment un échantillon déterministe garde-t-il malgré tout les nombres honnêtes ?
- Une semaine de lectures horaires, c'est 168 lignes. Avant d'écrire du code, que prédis-tu que seront la forme et les colonnes dtypes de ce frame ordonné ?

## Étape 1 : Charge une semaine ordonnée de lectures

Cette étape construit le DataFrame que chaque étape suivante consomme. Le cœur est une semaine *synthétique mais déterministe*, un rythme de 24 heures plus du bruit, placé en graine, pour que les mêmes nombres exacts apparaissent sur chaque machine. Une fine enveloppe de récupération en direct essaie l'API OpenAQ et est sautée quand le réseau ou l'API est indisponible.

### 1.1 Génère la semaine déterministe

**👟 Indice de départ :** Construis une semaine de pollution crédible : un profil sinusoïdal sur 24 heures (l'air de cette ville synthétique empire dans les petites heures, une « inversion matinale » classique), du bruit gaussien, des valeurs plafonnées pour ne jamais devenir négatives, et des lignes horaires horodatées.

```python
# aqi.py
import numpy as np
import pandas as pd

def load_week() -> pd.DataFrame:
    rng = np.random.default_rng(42)
    hours = np.arange(168)
    daily = 20 + 10 * np.sin(2 * np.pi * hours / 24)   # daily rhythm
    noise = rng.normal(0, 5, size=168)
    pm25 = np.clip(daily + noise, 0, None).round(1)    # µg/m³, never negative
    dates = pd.date_range("2025-03-03", periods=168, freq="h")
    return pd.DataFrame({"date": dates, "pm25": pm25})

df = load_week()
print(df.shape)
```

`np.random.default_rng(42)` est l'idiome du hasard reproductible : la même graine produit le même « bruit » sur chaque machine, ce qui est pourquoi chaque Résultat attendu de ce projet est exact. Le profil `20 + 10·sin(2πh/24)` rend la physique sous-jacente visible, et `.round(1)` garde les concentrations au dixième de µg/m³ comme un vrai moniteur les rapporte.

**🎯 Résultat attendu :** `(168, 2)`, sept jours de lectures horaires, deux colonnes (`date`, `pm25`).

**🩹 Si ça ne marche pas :** Si les *lignes* de la forme diffèrent de 168, vérifie `periods=168` et `freq="h"` dans `date_range`. Si c'est `(168, 3)` ou plus, une colonne errante (comme le `hour` d'une étape ultérieure) a fui dans `load_week`, garde le générateur qui construit exactement les deux colonnes ordonnées.

### 1.2 Inspecte le frame

**👟 Indice de départ :** Vérifie avec `describe()` et cherche l'histoire des dtypes : `date` devrait être datetime, `pm25` float, et l'étendue de concentration devrait ressembler à de l'air urbain réel.

```python
# aqi.py (continued)
print(df.info())
```

**🎯 Résultat attendu :** 168 entrées non nulles dans les deux colonnes ; `date` est `datetime64[ns]` (ou `datetime64[us]`), `pm25` est `float64`. Aucune valeur nulle, un frame ordonné.

**🩹 Si ça ne marche pas :** Si `date` s'affiche comme `object`, `date_range` n'a pas été affecté à la colonne (une simple liste de chaînes à la place). Si `pm25` montre 168 *non nulles* mais s'imprime comme `object`, le `.round(1)` a été appliqué à une liste de type mixte, reconstruis la colonne avec le tableau numpy.

### 1.3 Optionnel : sur quel chemin es-tu ?

**👟 Indice de départ :** Imprime une ligne pour déclarer franchement si tu analyses des données en direct ou l'échantillon déterministe, un rapport ne devrait jamais mentir sur sa source.

```python
# aqi.py (continued)
SOURCE = "sample (deterministic)"
try:
    import requests
    r = requests.get("https://api.openaq.org/v2/measurements",
                     params={"city": "Stockholm", "parameter": "pm25", "limit": 168},
                     timeout=10)
    r.raise_for_status()
    results = r.json().get("results", [])
    if results:
        live = pd.DataFrame({
            "date": pd.to_datetime([m["date"]["utc"] for m in results]),
            "pm25": [float(m["value"]) for m in results],
        })
        df = live.sort_values("date").reset_index(drop=True)
        SOURCE = "live OpenAQ"
except Exception:
    pass   # network down, key missing, or API changed — sample it is

print("analyzing:", SOURCE)
```

Le `try/except` général sur la récupération est délibéré : une API qui est en panne, déplacée ou qui a besoin d'une clé ne devrait jamais tuer un rapport. Quand le chemin en direct réussit, `df` devient le vrai air de Stockholm et les nombres du reste de ce projet différeront, chaque Résultat attendu ci-dessous *suppose l'échantillon déterministe*, donc la ligne de source te garde ancré.

**🎯 Résultat attendu :** `analyzing: sample (deterministic)` sur une machine sans accès fiable à OpenAQ, et `analyzing: live OpenAQ` sur une où la récupération atterrit.

**🩹 Si ça ne marche pas :** Si tu vois un `KeyError` sur `m["date"]` depuis un *appel d'API réussi*, la forme de la réponse d'OpenAQ a changé, imprimer `results[0].keys()` est le moyen le plus rapide de voir les nouveaux champs, et le chemin d'échantillon sauve quand même le projet.

### 1.4 Vérifie le chargement

**✅ Liste de vérification**

- ✅ `load_week()` retourne `(168, 2)` sans valeurs nulles et sans concentrations négatives.
- ✅ `df["pm25"].min()` est environ `3.1` et `df["pm25"].max()` environ `40.7` (µg/m³), une plage urbaine crédible.
- ✅ Une ligne de source déclare si tu exécutes des données d'échantillon ou en direct.

**🤔 Question(s) socratique(s)**

- Le profil de concentration de l'échantillon *culmine à 6 h du matin*, l'« inversion matinale » classique quand la couche où nous respirons est à son point le plus mince. Quels calculs d'une étape future changeraient si tu inversais le profil pour culminer à 15 h à la place, et pourquoi les étiquettes de *catégorie* seraient-elles le vrai casse-tête, pas la moyenne ?
- Pourquoi plafonner la récupération à 168 lignes (`limit=168`) au lieu de tirer « tout » ? Qu'est-ce qui casse dans un rapport hebdomadaire si le capteur d'un jour devient silencieux au milieu de l'archive ?

## Étape 2 : Transforme les concentrations en AQI

Le µg/m³ brut ne veut rien dire pour un non-scientifique. L'EPA le transforme en échelle AQI de 0 à 500 avec une **table de points de rupture** : des plages de concentrations mappent vers des plages d'AQI, reliées par des lignes droites. Cette étape écrit cette formule par morceaux comme une seule fonction Python honnête.

### 2.1 Écris la formule de points de rupture

**👟 Indice de départ :** Implémente `pm25_to_aqi(pm25)`, parcours la table de points de rupture PM2.5 de l'EPA en ordre, et pour la bande correspondante, mets à l'échelle linéairement la concentration dans sa plage d'AQI.

```python
# aqi.py (continued)
def pm25_to_aqi(pm25: float) -> int:
    breakpoints = [
        (0.0, 12.0,  0,  50),   # Good
        (12.1, 35.4, 51, 100),  # Moderate
        (35.5, 55.4, 101, 150), # USG
        (55.5, 150.4, 151, 200),# Unhealthy
        (150.5, 250.4, 201, 300),
    ]
    for low, high, aqi_low, aqi_high in breakpoints:
        if low <= pm25 <= high:
            return round((aqi_high - aqi_low) / (high - low) * (pm25 - low) + aqi_low)
    return round((300 - 201) / (250.4 - 150.5) * (pm25 - 150.5) + 201) if pm25 > 250.4 else 0

print(pm25_to_aqi(12.0), pm25_to_aqi(30.0), pm25_to_aqi(35.4), pm25_to_aqi(50.0))
```

`(aqi_high - aqi_low) / (high - low)` est la pente d'un segment de ligne AQI vs concentration ; mettre à l'échelle `(pm25 - low)` et ajouter `aqi_low` te fait glisser le long de cette ligne, de l'interpolation linéaire ordinaire sur la bande. C'est tout le « standard » de l'EPA encodé dans une boucle `for`, ce qui est exactement pourquoi l'EPA le publie lui-même comme une table : quatre nombres par bande, pas de magie.

**🎯 Résultat attendu :** `50 89 100 137`, les bords de bande propre mappent vers des entiers (12.0 → 50, 35.4 → 100) et les points de milieu de bande interpolent (30.0 → 89, 50.0 → 137).

**🩹 Si ça ne marche pas :** Si un bord de bande comme `pm25_to_aqi(12.0)` imprime `51` au lieu de `50`, ta limite de bande `(0.0, 12.0)` est exclusive à gauche, chaque bande doit être `low <= pm25 <= high`. Si la sortie est un float avec des décimales, `round(...)` manque ; l'AQI est un nombre entier par définition.

### 2.2 Applique-le à toute la semaine

**👟 Indice de départ :** `.apply(pm25_to_aqi)` sur la colonne `pm25`, une fonction, 168 lignes, une nouvelle colonne entière.

```python
# aqi.py (continued)
df["aqi"] = df["pm25"].apply(pm25_to_aqi)
print(df["aqi"].min(), df["aqi"].max())
print(df[df["date"] == "2025-03-04 06:00"])   # the worst hour, we suspect
```

`.apply` diffuse la *même* fonction pure sur chaque ligne, pas de boucles, et aucune façon de traiter accidentellement les lignes différemment. Parce que la fonction est sans état, elle est trivialement testable : vérifie trois valeurs calculées à la main une fois, et toute la colonne hérite de cette confiance.

**🎯 Résultat attendu :** `13 114`, et la ligne pour `2025-03-04 06:00` montre `aqi` = `114`, la pire lecture unique de la semaine, une heure « Mauvais pour les Groupes Sensibles ».

**🩹 Si ça ne marche pas :** Si `min`/`max` sont négatifs ou absurdes, `pm25_to_aqi` a retourné la branche `else 0` / repli pour la plupart des lignes, imprime `df["pm25"].describe()` et vérifie par échantillonnage un appel `pm25_to_aqi` contre un bord de bande connu. Si la ligne 06:00 imprime un `aqi` différent, ton échantillon est des données de chemin en direct (des nombres entièrement différents, l'échantillon est `(168, 2)` avec max pm25 `40.7`).

### 2.3 Vérifie la conversion

**✅ Liste de vérification**

- ✅ Les bords de bande vérifiés à la main tiennent : `12.0 → 50`, `35.4 → 100`.
- ✅ La plage de la colonne entière est `13..114`, entière, sans NaN.
- ✅ `.apply` a ajouté exactement une nouvelle colonne (`aqi`) sans perturber `date` ni `pm25`.

**🤔 Question(s) socratique(s)**

- La formule par morceaux interpole *à l'intérieur* d'une bande mais saute là où les bandes se rejoignent (12.0 → AQI 50, mais 12.1 → AQI 51). Invente une concentration, résous la formule, et dis-moi ce qu'un AQI 50.6 *signifierait* si l'EPA n'avait pas arrondi aux entiers, pourquoi l'arrondi à un nombre entier aide-t-il réellement *le message public* ?
- `pm25_to_aqi` retourne `0` pour tout ce qui est sous 0.0, et pourtant `.clip(0, None)` garantit une entrée non négative. Quand la branche `return 0` est-elle encore réellement atteignable, et que dirait un relecteur *fonctionnellement puriste* du fait de garder du code mort ?

## Étape 3 : Étiquette les catégories et chasse la pire heure

Maintenant le frame obtient ses troisième et quatrième colonnes : une catégorie humaine pour chaque AQI, puis les questions de synthèse, quelle heure de la semaine était la pire, laquelle la meilleure, et à quoi ressemblait la semaine par catégorie ?

### 3.1 Range les valeurs d'AQI en catégories

**👟 Indice de départ :** Écris `category(aqi)` en parcourant les seuils de catégorie de l'EPA, puis `.apply`-le et compte avec `value_counts()`.

```python
# aqi.py (continued)
def category(aqi: int) -> str:
    if aqi <= 50:   return "Good"
    if aqi <= 100:  return "Moderate"
    if aqi <= 150:  return "Unhealthy for Sensitive Groups"
    if aqi <= 200:  return "Unhealthy"
    return "Very Unhealthy"

df["category"] = df["aqi"].apply(category)
print(df["category"].value_counts())
```

Ordonner les `if` du plus propre au plus sale et utiliser `<=` à chaque seuil signifie que la *première* bande correspondante gagne, la règle classique du « compartiment mutuellement exclusif ». `value_counts()` descend par compte, donc la ligne numéro un de la sortie est simultanément la réponse à « quel genre de semaine était-ce ? ».

**🎯 Résultat attendu :** `Moderate 132`, `Good 33`, `Unhealthy for Sensitive Groups 3`, une semaine modérément polluée avec une poignée d'heures sensibles et aucun air vraiment mauvais.

**🩹 Si ça ne marche pas :** Si les comptes ne totalisent pas 168, les catégories se chevauchent ou présentent des trous, vérifie les bornes `<=` pour un chevauchement hors d'un, ou relance avec `df["category"].isna().sum()` pour attraper les lignes non étiquetées. Si tout est un seul compartiment, `category` a été appliqué à `aqi` mais un ordre de seuils (par ex. `<= 100` avant `<= 50`) a fait avaler tout par les retours précoces.

### 3.2 Trouve la pire et la meilleure heure

**👟 Indice de départ :** `idxmax`/`idxmin` sur la colonne `aqi`, puis recherche de ligne via ces index, l'histoire de la semaine en deux impressions.

```python
# aqi.py (continued)
worst = df.loc[df["aqi"].idxmax()]
best = df.loc[df["aqi"].idxmin()]
print("worst:", worst["date"], worst["pm25"], worst["aqi"])
print("best: ", best["date"], best["pm25"], best["aqi"])
```

`df["aqi"].idxmax()` retourne l'*étiquette d'index* de la ligne max, l'apparier avec `.loc` est l'idiome en deux étapes pour « trouver et montrer l'enregistrement » qui se généralise à toute recherche par clé. Avec un index datetime, cela devient natif des séries temporelles, ce qui est exactement comment un tableau de bord de surveillance tire « l'alerte était là, à cette seconde ».

**🎯 Résultat attendu :** `worst: 2025-03-04 06:00:00 40.7 114` et `best:  2025-03-07 17:00:00 3.1 13`, l'avant-aube du mardi contre la fin d'après-midi du vendredi.

**🩹 Si ça ne marche pas :** Si la mauvaise ligne s'affiche, `idxmax` a retourné le max d'une colonne *float* quand `.loc[...]` correspondait à un frame différent, confirme que `worst` est une ligne de `df`, pas d'une copie regroupée. Si les deux impriment la même date, la colonne `date` n'est pas l'index et `.loc[df["aqi"].idxmax()]` a réutilisé silencieusement l'étiquette entière.

### 3.3 Vérifie la chasse

**✅ Liste de vérification**

- ✅ Les comptes de catégories totalisent 168 avec trois compartiments distincts.
- ✅ L'`aqi` de la pire heure (114) est `USG`, celui de la meilleure heure (13) est `Good`.
- ✅ `worst` et `best` sont de vraies lignes de `df`, pas des frames regroupés ou copiés.

**🤔 Question(s) socratique(s)**

- Les moyennes de jour de semaine étaient toutes à quelques µg/m³ l'une de l'autre, et pourtant le *jour de pointe* se détache dans un rapport. Où « agréger par jour, puis classer les jours » commence-t-il à induire en erreur, et quel fait à une seule ligne (la pire heure) les moyennes quotidiennes cachent-elles activement ?
- `value_counts()` trie par défaut en ordre décroissant. Pourquoi l'ordre décroissant est-il le *défaut* correct pour ce rapport, et quelle question l'ordre croissant répondrait-il à la place ?

## Étape 4 : Imprime le rapport citoyen

Les graphiques sont pour jeter un œil ; un rapport est pour agir. Cette étape transforme les agrégats de l'Étape 3 en quelques lignes claires qu'un lecteur peut mettre en œuvre ce soir, des pourcentages, une heure de pointe, et le dictionnaire de conseils concrets qui va avec chaque catégorie.

### 4.1 Écris le dictionnaire de conseils

**👟 Indice de départ :** Associe chaque catégorie à une phrase actionnable, le « et alors » de santé publique de chaque AQI.

```python
# aqi.py (continued)
ADVICE = {
    "Good": "Open the windows — air is clean today.",
    "Moderate": "Fine for most people; sensitive folks, take it easy outside.",
    "Unhealthy for Sensitive Groups": "Sensitive groups: reduce prolonged outdoor exertion.",
    "Unhealthy": "Everyone: cut back prolonged or heavy outdoor effort.",
    "Very Unhealthy": "Stay indoors; keep windows shut.",
}
```

Un dictionnaire mappe les chaînes de catégories exactes vers des conseils, donc le rapport ne *décide* jamais quoi dire, il le recherche. Garder les conseils comme des données plutôt que de la prose `if/elif` signifie que le même dictionnaire pourrait piloter une alerte SMS, une pastille de tableau de bord ou une affiche, sans changement.

**🎯 Résultat attendu :** Aucune sortie de la définition seule, mais le dictionnaire doit contenir une clé pour exactement chaque chaîne que `category()` peut produire.

**🩹 Si ça ne marche pas :** Si le rapport lève plus tard une `KeyError`, une chaîne de catégorie dans `df["category"]` n'est pas dans `ADVICE`, exécute `set(df["category"]) - set(ADVICE)` pour imprimer les orphelins en une ligne.

### 4.2 Agrège et imprime

**👟 Indice de départ :** Calcule les pourcentages de catégories, l'heure avec le plus haut AQI *moyen*, et la pire lecture unique, puis `print` un rapport ordonné de 6 lignes.

```python
# aqi.py (continued)
df["hour"] = df["date"].dt.hour  # pull the clock value for hour-of-day aggregation

def print_report(df: pd.DataFrame, advice: dict[str, str]) -> None:
    counts = df["category"].value_counts()
    n = len(df)
    hourly_mean = df.groupby("hour")["aqi"].mean()
    peak_hour = int(hourly_mean.idxmax())
    peak_value = round(float(hourly_mean.max()))
    worst = df.loc[df["aqi"].idxmax()]

    print(f"Week: {n} hourly readings")
    print(f"Most common category: {counts.index[0]} ({counts.iloc[0]}h, {counts.iloc[0] / n * 100:.0f}%)")
    print(f"Peak pollution hour (avg AQI): {peak_hour:02d}:00 (~{peak_value})")
    print(f"Worst single hour: {worst['date']}  AQI {worst['aqi']}")
    print("Advice:", advice[counts.index[0]])

print_report(df, ADVICE)
```

`df["hour"] = df["date"].dt.hour` projette le timestamp vers la valeur d'horloge, un seul appel d'accesseur `.dt` qui transforme une colonne datetime en la partition à 24 façon dont le rapport a besoin. Puis `groupby("hour")["aqi"].mean()` réduit la semaine à 24 moyennes horaires, et `idxmax()` sur cette série trouve l'heure de pointe *par heure-du-jour*, un fait en langage naturel (« l'avant-aube est le pire passage ») plutôt qu'un artefact de tableur. `counts.index[0]` est la catégorie modale, que le rapport associe à sa ligne de conseil pour que le lecteur obtienne une phrase actionnable.

**🎯 Résultat attendu :**

```
Week: 168 hourly readings
Most common category: Moderate (132h, 79%)
Peak pollution hour (avg AQI): 06:00 (~94)
Worst single hour: 2025-03-04 06:00:00  AQI 114
Advice: Fine for most people; sensitive folks, take it easy outside.
```

**🩹 Si ça ne marche pas :** Si `counts.iloc[0] / n * 100` imprime `79.0%` au lieu de `79%`, le format `:.0f` a été abandonné. Si `peak_hour:02d` fait une erreur, `idxmax()` a retourné `numpy.float64`, enveloppe avec `int(...)`. Si le conseil est pour la mauvaise catégorie, `advice[counts.index[0]]` a recherché la ligne modale, mais un mauvais *mode* signifie que `value_counts` n'a pas été exécuté sur la semaine entière.

### 4.3 Vérifie le rapport

**✅ Liste de vérification**

- ✅ Les cinq lignes reproduisent le Résultat attendu avec l'échantillon.
- ✅ Les pourcentages totalisent ~100 sur les catégories.
- ✅ La ligne de conseil correspond à la catégorie modale, pas à celle de la pire heure.

**🤔 Question(s) socratique(s)**

- Le rapport imprime le conseil pour la catégorie *modale* tout en signalant la *pire* heure. Quand conseiller depuis le mode induit-il activement en erreur, et comment changerais-tu une ligne pour rendre le message actionnable unique du rapport honnête à la fois pour une semaine à 79% Modéré et pour un jour à 2% Très Mauvais ?
- `hourly_mean.idxmax()` ignore *quel* jour la pointe tombe, donc « 06:00 » apparaît même si la pire heure était le mardi. Reformule ce vide socratique en une opération pandas d'une ligne qui rapporte « mardi 06:00 » à la place, qu'est-ce que cela change conceptuellement ?

## Étape 5 : Trace la semaine et enregistre-la

Un rapport dit ; un graphique montre. Cette étape dessine 24 points d'AQI moyen horaire avec les lignes de seuil 50 et 100 annotées, et enregistre la figure comme PNG, l'artefact que tu peux réellement mettre dans des diapos ou envoyer à un ami.

### 5.1 Trace l'AQI moyen par heure

**👟 Indice de départ :** `groupby("hour")["aqi"].mean()` à nouveau, `plt.plot` avec des marqueurs, deux `axhline` de seuil, et `Agg` pour que le tracé se rende sans interface graphique (sans affichage) dans n'importe quel environnement.

```python
# aqi.py (continued)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def plot_week(df: pd.DataFrame, out: str = "aqi_week.png") -> None:
    hourly = df.groupby("hour")["aqi"].mean()
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(hourly.index, hourly.values, marker="o", label="mean AQI")
    ax.axhline(50, color="green", ls="--", lw=1, label="Good / Moderate")
    ax.axhline(100, color="orange", ls="--", lw=1, label="Moderate / USG")
    ax.set_xlabel("Hour of day")
    ax.set_ylabel("Mean AQI")
    ax.set_title("Average weekly AQI by hour of day")
    ax.legend()
    fig.tight_layout()
    fig.savefig(out)
    plt.close(fig)

plot_week(df)
```

`matplotlib.use("Agg")` sélectionne le moteur de rendu sans interface graphique, il dessine vers un buffer et `savefig` écrit le PNG, avec zéro dépendance à un système de fenêtres, ce qui est ce qui rend cette cellule à l'épreuve de la plateforme à travers les notebooks et les serveurs. Les deux `axhline` portent les mêmes bornes de points de rupture que tu as encodées numériquement à l'Étape 2, mais ici comme des lignes de coupe *visuelles* : tout point au-dessus de `100` est une violation de la ligne orange d'un coup d'œil.

**🎯 Résultat attendu :** La figure montre une bosse du petit matin traversant la frontière orange (USG) autour de 06:00 et des lectures de l'après-midi plongeant en territoire Good, correspondant à `hourly_mean.max()` ≈ 94 de l'Étape 4.

**🩹 Si ça ne marche pas :** Si aucun fichier n'apparaît, `plt.close(fig)` a tourné avant `savefig` ou le chemin est faux, mets `savefig` avant `close`. Si le tracé est vide, `hourly` est vide parce que la colonne `"hour"` n'existe pas, l'extraction `hour` s'est produite dans une copie, pas sur `df`. Si les axes sont échangés (heures sur l'axe des y), `hourly.index` et `hourly.values` sont partis vers les mauvais arguments.

### 5.2 Confirme l'artefact

**👟 Indice de départ :** Vérifie que le PNG existe et est non vide avant de signer, le fichier sur disque est la livraison.

```python
# aqi.py (continued)
import os
print("exists:", os.path.exists("aqi_week.png"), "size:", os.path.getsize("aqi_week.png"), "bytes")
```

**🎯 Résultat attendu :** `exists: True size: <quelques dizaines de kB> bytes`, un vrai PNG ouvrable.

**🩹 Si ça ne marche pas :** Si `exists: False`, la fonction de tracé n'a jamais tourné (vérifie le nom de fichier passé à `savefig` vs le nom vérifié). Si la taille est une poignée d'octets, le moteur de rendu a écrit un fichier vide ou de remplacement, relance la cellule et surveille une exception entre `plot_week(df)` et la vérification.

### 5.3 Vérifie le tracé

**✅ Liste de vérification**

- ✅ Le PNG existe, est non vide, et montre la bosse d'AQI avant l'aube traversant la ligne 100.
- ✅ Les lignes de seuil 50 et 100 ont des étiquettes, et la légende se rend.
- ✅ Le graphique est enregistré comme `aqi_week.png` dans le répertoire du projet.

**🤔 Question(s) socratique(s)**

- Les deux `axhline` encodent les *seuils* mais pas les *bandes*, le graphique ne peut pas montrer les « heures USG » comme ombrées indépendamment de là où les points se trouvent. Quel appel matplotlib unique ombrerait la bande entre 51 et 100, et pourquoi l'ombrage est-il généralement *plus* honnête que les lignes de coupe pour un lecteur profane ?
- `savefig` écrit des pixels, donc le graphique est figé au moment où il est fait. Si tu voulais que le *même* notebook livre un graphique dont les nombres se mettent à jour avec les données de la semaine prochaine, quelles parties de `plot_week` devraient rester pures, et quelle partie est intrinsèquement un effet de bord ?

## ⚠️ Pièges courants

- **Des bornes de bande qui se chevauchent.** Si une bande utilise `< low` et la suivante utilise `<= high`, les seuils de l'EPA comptent double et `value_counts` totalise plus de 168. Chaque bande doit être `low <= pm25 <= high` et les bandes doivent se toucher exactement.
- **Oublier `.round(1) → l'AQI est un entier.** L'AQI est des nombres entiers par définition ; retourner des floats depuis `pm25_to_aqi` passe les tests au vert mais rend les moyennes `groupby` absurdes (par ex. `94.3333`).
- **`idxmax` sur la mauvaise colonne.** `.idxmax` retourne une *étiquette d'index* ; utilise `.loc[label]` sur le *même* frame, ou tu afficheras silencieusement le recensement d'une autre ligne.
- **Des dtypes criants et muets dans le rapport.** `f"{peak_hour:02d}"` a besoin d'un `int` ; les floats numpy lèvent `TypeError` sur `:02d`. Enveloppe avec `int(...)`.
- **Tracer sur un exécuteur sans interface graphique sans `Agg`.** Les notebooks et les serveurs n'ont pas d'affichage ; `matplotlib.use("Agg")` avant d'importer `pyplot` est la différence entre un PNG enregistré et un `TclError`.
- **Dérive du dictionnaire de conseils.** `ADVICE` doit contenir une clé pour *chaque* chaîne que `category()` peut émettre ; une nouvelle catégorie ajoutée sans entrée de dictionnaire plante le rapport au moment de l'exécution.

## Ce que tu viens de construire

Un vrai pipeline de qualité de l'air : des données horaires ordonnées en entrée, un rapport humain et un graphique en sortie. En chemin tu as encodé un standard réglementaire entier (la table de points de rupture de l'EPA) comme données, transformé une colonne numérique de capteurs en perspective catégorielle, et produit les deux artefacts que les gens consomment réellement, une déclaration en texte clair de la semaine et un PNG qui la montre. La forme transférable, charger → transformer avec des fonctions pures → agréger → rapport + visualisation, est le même squelette derrière les moniteurs de capteurs, les tableaux de bord produits et les e-mails d'analytique hebdomadaires.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/air-quality/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/air-quality) dans le dépôt du cours est le tableau de bord complet en notebook, chemins d'échantillon et en direct, rapport et graphique, tout au même endroit. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute un second polluant (PM10 ou ozone) et un AQI *combiné*, le polluant qui obtient le pire score sur une heure donnée pilote la valeur rapportée, ce qui est comment fonctionne le vrai AQI de l'EPA.
- Re-clé le frame sur `df["date"]` et ajoute `resample("D").mean()` pour que le rapport hebdomadaire puisse signaler des *jours* entiers au-dessus d'un seuil.
- Construis la moitié d'alerte : une fonction qui retourne « envoie un SMS » quand une catégorie comme `Unhealthy` apparaît plus de N heures dans une fenêtre glissante de 24, puis câble-la à un job cron/Playwright.
- Échange la graine déterministe contre les vraies données OpenAQ de ta ville et diffère les deux rapports, une leçon mémorable sur combien les moyennes peuvent cacher.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓