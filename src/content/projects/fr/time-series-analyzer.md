---
title: "Analyseur de Séries Temporelles"
description: "Analyser les données temporelles avec décomposition, prévision et détection d'anomalies intégrés."
difficulty: "intermediate"
estimatedMinutes: 70
tags: ["pandas", "numpy", "data-viz"]
learningObjectives:
  - Générer et façonner une série indexée par datetime avec pandas
  - "Décomposer une série en tendance, saisonnalité et résidu"
  - "Prévoir vers l'avant avec un modèle tendance-plus-saison"
  - Noter l'erreur de prévision avec un backtest
  - Détecter les anomalies et corréler deux séries dans un graphique
prerequisites:
  - "Les bases de Python (fonctions, boucles)"
  - "Pandas DataFrames et Series (indexation, dtypes)"
  - "Installer des paquets avec uv"
---

# 🛠️ 📈 Analyseur de Séries Temporelles

Les relevés de température, la charge serveur, le trafic web, presque tout ce qui est réel arrive comme une séquence dans le temps, et les analystes passent leurs journées à séparer ce qu'une série *fait* en trois signaux : la dérive lente (tendance), le rythme répétitif (saisonnalité) et le bruit restant (résidu). Ce projet construit cette décomposition à partir de zéro avec pandas, puis utilise les pièces : il prévoit la semaine prochaine avec un modèle tendance-plus-saison, note la prévision contre un vrai holdout, signale les dates qui ne correspondent pas au motif, et corrèle deux séries dans un graphique que tu peux réellement sauvegarder.

Cela suppose Python 101 et une aisance avec les Series pandas, rien d'Analyse de Données au-delà n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Générer une série réaliste de clients de café avec un index datetime.
2. La décomposer en composantes tendance, saisonnière et résiduelle à la main.
3. Prévoir la semaine suivante avec un modèle tendance-plus-saison.
4. Backtester la prévision et mesurer son erreur sur des jours retenus.
5. Détecter les anomalies et tracer deux séries corrélées sur un PNG.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal. pandas et NumPy s'installent proprement, le backend `Agg` non interactif de matplotlib (Étape 5) rend les graphiques même sans affichage, et tes fichiers de graphique atterrissent réellement dans le dossier du projet.

**Google Colab, Kaggle Notebooks et Binder** exécutent chaque étape à l'identique, les trois bibliothèques y sont préinstallées. L'honnêteté impose de préciser l'habituel pour les projets de visualisation de données : le système de fichiers d'un notebook est éphémère, donc le PNG sauvegardé et tout CSV que tu écris peuvent ne pas survivre à un redémarrage de session. Traite-les comme des chemins d'essai et passe au `uv` local quand les artefacts doivent persister.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-series-analyzer/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-series-analyzer/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ftime-series-analyzer%2Fnotebook.fr.ipynb)

## Configuration

Crée le projet et installe les trois bibliothèques sur lesquelles l'analyseur est construit.

```bash
uv init time-series-analyzer
cd time-series-analyzer
uv add pandas numpy matplotlib
```

```bash
uv run python -c "import pandas, numpy, matplotlib; print('ok')"
```

`pandas` gère l'index datetime, le rééchantillonnage et le `groupby` utilisé pour la saisonnalité ; `numpy` fournit le hasard seedé et la régression `polyfit` de l'Étape 3 ; `matplotlib` dessine l'artefact final. Installer les trois d'avance garde chaque étape ultérieure concentrée sur les idées de *séries temporelles*.

**✅ Liste de vérification**

- ✅ `uv add pandas numpy matplotlib` a terminé et le contrôle d'import affiche `ok`.
- ✅ Un projet `time-series-analyzer/` neuf existe avec un `pyproject.toml`.

## Étape 1 : Construis et façonne une série indexée par datetime

L'analyse de séries temporelles vit ou meurt sur l'index : chaque fenêtre, jour de semaine et décalage en aval suppose que chaque ligne sait *quand* elle est. Cette étape génère une série quotidienne réaliste et lui donne un vrai `DatetimeIndex`.

### 1.1 Génère la série des clients de café

**👟 Indice de départ :** Construis la série à partir de trois parties nommées délibérément, une tendance linéaire, une saisonnalité sinusoïdale hebdomadaire indexée sur `dayofweek`, et du bruit seedé, pour que la décomposition de l'Étape 2 ait une vraie structure à récupérer.

```python
# series.py
import numpy as np
import pandas as pd

def make_cafe_guests(days: int = 365, seed: int = 42) -> pd.Series:
    rng = np.random.default_rng(seed)
    idx = pd.date_range("2025-01-01", periods=days, freq="D")
    trend = np.linspace(100, 140, days)
    weekly = 8 * np.sin(2 * np.pi * idx.dayofweek / 7)
    noise = rng.normal(0, 5, days)
    return pd.Series(trend + weekly + noise, index=idx, name="guests")

s = make_cafe_guests()
print(s.head(3))
print("index type:", type(s.index).__name__, "| dtype:", s.dtype)
```

`idx.dayofweek` est l'accesseur pandas crucial : il donne 0-6 (lundi-dimanche) pour chaque ligne, et multiplier par `2π/7` met en phase la sinusoïde pour que les jours de semaine alternent haut et bas, de la vraie *saisonnalité* hebdomadaire, pas une oscillation aléatoire. `np.random.default_rng(seed)` est l'API de seedage moderne de NumPy ; le seed fixe rend le bruit reproductible. Retourner une `Series` avec `index=idx, name="guests"` signifie que chaque fonction ultérieure (fenêtres glissantes, `groupby` sur le jour de semaine, tracé) obtient les horodatages gratuitement.

**🎯 Résultat attendu :** Trois lignes datées (commençant `2025-01-01`), des valeurs proches de 100, plus `index type: DatetimeIndex | dtype: float64`.

**🩹 Si ça ne marche pas :** Si le type d'index affiche `RangeIndex` ou `Index`, c'est que l'assignation `pd.Series(..., index=idx)` manque et que le calcul de jour de semaine en aval n'a rien sur quoi s'accrocher. Si les valeurs se situent près de 1000 plutôt que ~100-150, c'est que `trend` et `weekly` ont été inversés. Si la série n'est pas reproductible entre les exécutions, c'est que l'argument `seed` n'atteint pas `default_rng`.

### 1.2 Vérifie la forme de la série

**✅ Liste de vérification**

- ✅ `s` a un `DatetimeIndex` couvrant 365 jours en fréquence quotidienne.
- ✅ `s.index.dayofweek` parcourt 0-6 de façon répétée et `s.dtype` est un float.
- ✅ Le même `seed` produit la série identique à un second appel.

**🤔 Question(s) socratique(s)**

- La saisonnalité est construite à partir de `dayofweek`, donc elle se répète hebdomadairement. Comment le modèle différerait-il si la série utilisait plutôt `idx.dayofyear`, et lequel ferais-tu confiance pour les motifs annuels (vacances) ?
- Les valeurs sont des floats à une précision implicite, mais les vrais compteurs de café sont des entiers. Quand garder le bruit float compte-t-il pour la décomposition, et quand arrondirais-tu d'abord à des clients entiers ?

## Étape 2 : Décompose en tendance, saisonnalité et résidu

Une tendance est « ce que la série fait lentement » ; la saisonnalité est « le rythme qui se répète » ; le résidu est « tout le reste ». Cette étape calcule les trois directement, une moyenne glissante pour la tendance, des moyennes par jour de semaine pour la saisonnalité, et ce qui reste comme résidu.

### 2.1 Écris la décomposition additive

**👟 Indice de départ :** L'ordre d'un conservateur de musée compte, tendance d'abord (moyenne glissante), puis `series - trend` pour le reste désaisonnalisé de tendance, puis les moyennes par jour de semaine de ce reste comme saisonnalité, puis `detrended - seasonal` comme résidu.

```python
# series.py (continuation)
def decompose(series: pd.Series, window: int = 14) -> tuple[pd.Series, pd.Series, pd.Series]:
    trend = series.rolling(window, center=True).mean()
    detrended = series - trend
    seasonal = detrended.groupby(series.index.dayofweek).transform("mean")
    residual = detrended - seasonal
    return trend, seasonal, residual

trend, seasonal, residual = decompose(s)
print(seasonal.groupby(seasonal.index.dayofweek).first().to_string())
print("residual std: {:.2f}".format(residual.std()))
```

La moyenne glissante avec `center=True` est l'estimateur de tendance : chaque point devient la moyenne de son voisinage ±7 jours, ce qui lisse le cycle hebdomadaire tout en préservant la dérive lente. La soustraire (`detrended`) laisse le rythme pur plus le bruit, et `groupby(dayofweek).transform("mean")` est l'astuce de saisonnalité propre, il calcule la moyenne pour chaque jour de semaine *et la rediffuse* à chaque ligne avec ce jour de semaine, donc `seasonal` a la même longueur que `series`. Le résidu est juste ce qui a survécu à les deux soustractions, et son écart type est ton premier signal de correction : il devrait être bien en dessous du `std` de la série brute.

**🎯 Résultat attendu :** Sept lignes (une par jour de semaine) de décalage saisonnier, plus un `residual std` autour de 4-6, nettement plus petit que l'étendue de ~16 de la série brute.

**🩹 Si ça ne marche pas :** Si `seasonal` a des lignes `NaN` sur les bords, la fenêtre `center=True` laisse les 7 premiers/derniers jours indéfinis, attendu, filtre avec `.dropna()`. Si le std résiduel est proche de zéro, le terme de bruit n'a jamais atteint le générateur. Si les décalages de jour de semaine varient sauvagement entre les lignes du même jour, `transform` a été remplacé par `apply`, `transform` est ce qui rediffuse à chaque ligne.

### 2.2 Vérifie la décomposition

**✅ Liste de vérification**

- ✅ `trend + seasonal + residual` reconstruit la série d'origine (à l'erreur float près).
- ✅ Chacun des sept jours de semaine a exactement une valeur saisonnière.
- ✅ L'écart type du résidu est plus petit que le `std()` de la série.

**🤔 Question(s) socratique(s)**

- Une moyenne glissante est un *filtre passe-bas* sur la série. Qu'arrive-t-il à un vrai pic ponctuel dans le `residual` de l'Étape 4 si la fenêtre de tendance est énorme (disons 90 jours) au lieu de 14, et quand cela serait-il utile ou nuisible ?
- La valeur saisonnière est une moyenne par jour de semaine, donc elle traite tous les cinq lundis d'un mois comme identiques. Qu'est-ce qui changerait si la saisonnalité elle-même dérivait au fil de l'année (hiver vs été) ?

## Étape 3 : Prévois avec tendance plus saisonnalité

La décomposition se rentabilise ici : au lieu d'ajuster un modèle au bruit brut, tu prolonges la tendance apprise et y ajoutes le rythme appris. Cette étape prévoit les sept prochains jours à partir des deux composantes propres.

### 3.1 Ajuste une ligne sur la tendance et rajoute la saisonnalité

**👟 Indice de départ :** Ajuste `np.polyfit` au degré 1 sur les 30 dernières valeurs réelles, prolonge cette ligne de 30→37 jours en avant, puis ajoute le prix de `seasonal` pour chaque futur jour de semaine.

```python
# series.py (continuation)
def forecast_next(series: pd.Series, seasonal: pd.Series,
                  horizon: int = 7, window: int = 30) -> pd.Series:
    X = np.arange(window)
    y = series.tail(window).values
    slope, intercept = np.polyfit(X, y, 1)

    future = pd.date_range(series.index[-1] + pd.Timedelta(days=1),
                           periods=horizon, freq="D")
    linear = intercept + slope * np.arange(window, window + horizon)
    weekly = seasonal[future.dayofweek].values
    return pd.Series(linear + weekly, index=future, name="forecast")

fc = forecast_next(s, seasonal)
print(fc.round(1).to_string())
```

`np.polyfit(X, y, 1)` trouve la meilleure ligne droite à travers les dernières `window` valeurs réelles, tu obtiens la pente, et l'intercepte la place. La prévision est alors de l'arithmétique : prolonge cette ligne aux indices `window … window+horizon` (positions de l'axe X *après* la fenêtre d'entraînement), et ajoute `seasonal[future.dayofweek]` pour que le rythme hebdomadaire de chaque jour chevauche la ligne. Faire la tendance et le rythme séparément, plutôt que de prévoir des valeurs brutes bruitées avec un modèle, est tout l'intérêt de l'Étape 2.

**🎯 Résultat attendu :** Sept valeurs datées, environ 140-160 et *pas* une rampe droite, les jours de semaine chevauchent visiblement la sinusoïde hebdomadaire.

**🩹 Si ça ne marche pas :** Si la prévision est constante, c'est que `np.polyfit` a retourné une pente ~zéro parce que `window` était trop court ou que `y` n'était pas la queue. Si la prévision est un bruit irrégulier, c'est que `weekly` n'a pas été ajouté et seule la ligne a survécu. Si les dates atterrissent *avant* la fin de la série, c'est que le décalage `pd.Timedelta(days=1)` manque.

### 3.2 Vérifie la prévision

**✅ Liste de vérification**

- ✅ La prévision couvre exactement les 7 jours après la dernière date de la série.
- ✅ Les valeurs de prévision suivent le rythme hebdomadaire (pics/creux par jour de semaine), pas une ligne droite.
- ✅ Étendre l'horizon à 14 atterrit encore après une continuation plausible.

**🤔 Question(s) socratique(s)**

- Ajuster une ligne droite suppose un taux de croissance constant. Quelle forme la prévision prendrait-elle si la *vraie* tendance accélérait, et où l'hypothèse de ligne droite échoue-t-elle le plus visiblement sur des données réelles ?
- La prévision utilise la pente des 30 derniers points. Comment la prévision de la semaine prochaine changerait-elle si tu ajustais plutôt la ligne sur la composante de tendance de *toute* l'année, et quel choix semble plus robuste, et pourquoi ?

## Étape 4 : Backtest la prévision et mesure l'erreur

Une prévision que tu ne peux pas noter est une supposition. Le backtesting réajuste le modèle sur les données *avant* une semaine retenue et compare ses prédictions aux valeurs que cette semaine a réellement prises, la façon honnête de savoir si ton modèle est bon avant de lui faire confiance pour l'avenir.

### 4.1 Note la prévision contre le holdout

**👟 Indice de départ :** Répète la prévision de l'Étape 3 en utilisant seulement `series.iloc[:-horizon]` pour l'entraînement, puis calcule l'erreur absolue moyenne contre la dernière semaine retenue.

```python
# series.py (continuation)
def backtest(series: pd.Series, seasonal: pd.Series,
             horizon: int = 7, window: int = 30) -> float:
    train = series.iloc[:-horizon]
    fc = forecast_next(train, seasonal, horizon=horizon, window=window)
    actual = series.iloc[-horizon:]
    mae = float((fc - actual).abs().mean())
    return mae

print("MAE on held-out week: {:.2f} guests".format(backtest(s, seasonal)))
```

`series.iloc[:-horizon]` découpe la dernière semaine, le modèle ne peut littéralement pas voir ces jours, et `forecast_next` s'exécute sur ce qui reste, donc la comparaison `fc - actual` est un vrai test hors échantillon. Rapporter **l'erreur absolue moyenne** (`abs().mean()`) garde les unités humaines : « décalé de ~4 clients », pas un nombre au carré que personne ne ressent. La composante saisonnière est passée inchangée ; le raccourci honnête est que le *rythme* a été appris à partir de la série complète, tandis que la *tendance* a été réajustée sur les données tronquées, un resserrement réparable documenté comme tel.

**🎯 Résultat attendu :** Une MAE à un seul chiffre faible (environ 3-6 clients), constamment bien en dessous d'une supposition naïve comme prédire la moyenne globale.

**🩹 Si ça ne marche pas :** Si la MAE gonfle à 20+, la prévision inclut encore la saisonnalité de la semaine prochaine construite à partir de la série complète mais l'ajustement de tendance est calculé sur un cadre vide, vérifie que `train` n'est pas vide. Si `fc` et `actual` divergent, `forecast_next` produit des dates au-delà de `train.index[- horizon]`, confirme le décalage `days=1`. Si le score dérive entre les exécutions, `seasonal` vient d'une série seedée différemment.

### 4.2 Vérifie le backtest

**✅ Liste de vérification**

- ✅ `backtest` rapporte un seul float en unités de clients.
- ✅ L'ensemble d'entraînement se termine *avant* que la semaine retenue ne commence.
- ✅ Relancer avec `horizon=14` produit une erreur plus grande (ou égale) que 7.

**🤔 Question(s) socratique(s)**

- MAE traite la sur- et sous-prédiction également. Que soulignerait l'**erreur quadratique moyenne racine (RMSE)** à la place, et pourquoi un café avec des pics de vacances occasionnels énormes la préférerait-il malgré son caractère moins intuitif ?
- La tendance est réajustée sur `train` mais la saisonnalité fuit de la série complète. Dans quel flux de travail réel cette fuite est-elle acceptable, et comment la fermerais-tu complètement si un client demandait une évaluation stricte ?

## Étape 5 : Détecte les anomalies et trace la paire

Deux mouvements de clôture transforment l'analyseur en artefact fini : signaler les dates où la réalité ne correspondait pas au modèle (grands résidus), et tracer la série contre un pair corrélé, enregistré comme un fichier que tu peux partager.

### 5.1 Signale les anomalies et dessine le graphique de corrélation

**👟 Indice de départ :** Fais un z-score du résidu pour trouver les valeurs aberrantes, puis corrèle la série des clients avec une série de dépenses et sauvegarde la superposition comme PNG avec le backend `Agg` sans affichage.

```python
# series.py (continuation)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def detect_anomalies(residual: pd.Series, threshold: float = 2.5) -> pd.Series:
    z = (residual - residual.mean()) / residual.std()
    return z[z.abs() > threshold]

anoms = detect_anomalies(residual.dropna())
print(f"anomalies: {len(anoms)} -> {anoms.index[:8].tolist()}")

def make_spend(seed: int = 7) -> pd.Series:
    guests = make_cafe_guests(seed=seed)
    rng = np.random.default_rng(seed)
    return guests * 3.2 + rng.normal(0, 30, len(guests))

spend = make_spend()
print("correlation:", round(s.corr(spend), 2))

fig, ax = plt.subplots(figsize=(11, 4))
ax.plot(s.index, s.values, label="guests")
ax.plot(spend.index, spend.values / 3.2, alpha=0.5, label="spend / 3.2")
ax.legend(); ax.set_title("Café guests vs spend (scaled)")
fig.tight_layout()
fig.savefig("series.png", dpi=100)
```

`(residual - residual.mean()) / residual.std()` convertit chaque résidu en z-score, « à combien d'écarts types du motif cette journée est-elle ? », et le seuil `> 2.5` garde les valeurs aberrantes honnêtes (un jour à 3-sigma) sans signaler la moitié du fichier. La corrélation est la statistique de synthèse : `s.corr(spend)` retourne un nombre dans [-1, 1], et des valeurs proches de 0.9 te disent que les deux métriques bougent ensemble. Sur le graphique, diviser `spend` par son multiplicateur approximatif superpose les deux séries sur la même échelle, une affirmation visuelle que le nombre `.corr()` confirme ensuite.

**🎯 Résultat attendu :** Un compte d'anomalies (une poignée au plus), une corrélation proche de `0.9`, et un fichier `series.png` montrant les deux séries se suivre mutuellement.

**🩹 Si ça ne marche pas :** Si `detect_anomalies` signale des dizaines de jours, c'est que les données ont été décomposées avec une `window` trop petite pour lisser le bruit, élargis-la. Si la corrélation affiche `NaN`, une série a un alignement d'index différent après `.dropna()`, aligne avec `.align()` ou calcule sur l'index partagé. Si aucun PNG n'apparaît, `savefig` s'exécute depuis un répertoire de travail que tu ne peux pas voir, affiche `Path("series.png").resolve()` pour confirmer où il est atterri.

### 5.2 Vérifie l'analyseur fini

**✅ Liste de vérification**

- ✅ Le compte d'anomalies est petit (chiffres simples par année de données) et les dates signalées sont des surprises plausibles.
- ✅ `s.corr(spend)` est un float nettement au-dessus de 0.5.
- ✅ `series.png` existe sur disque montrant les deux séries bouger ensemble.
- ✅ Tout le pipeline s'exécute de haut en bas comme un seul script avec zéro modification.

**🤔 Question(s) socratique(s)**

- La série de dépenses a été *construite* à partir des clients, donc la corrélation quasi-1.0 est fabriquée. Qu'implique une vraie corrélation plus basse (disons 0.4) sur le fait qu'un café devrait planifier le personnel à partir des comptes de clients, et que ne prouve-t-elle *pas* sur l'un causant l'autre ?
- Les drapeaux d'anomalie pointent à la fois vers des échecs de modèle et des événements réels. Si le café fermait pour rénovation, cela apparaîtrait-il comme un z-score positif ou négatif, et comment distinguerais-tu « anomalie intéressante » d'un « modèle cassé » sans appeler le café ?

## ⚠️ Pièges courants

- **Un `RangeIndex` ordinaire au lieu d'un `DatetimeIndex`.** Les fenêtres glissantes tournent encore, mais `dayofweek`, le rééchantillonnage et la génération de dates futures cassent tous. Correction : construis chaque série avec `index=idx` depuis l'Étape 1 et vérifie `type(s.index)` tôt.
- **`NaN` provenant des fenêtres centrées.** `rolling(center=True)` laisse des bords indéfinis ; les introduire dans `groupby` ou le tracé fait chuter silencieusement des jours du graphique et des statistiques. Correction : `.dropna()` sur tendance, saisonnalité et résidu à la frontière dont tu as besoin.
- **Ajuster la tendance sur le bruit au lieu de la queue.** `polyfit` sur une `window` trop courte produit une pente qui est surtout du bruit. Correction : ajuste sur au moins un mois de valeurs réelles (30+) et laisse la saisonnalité être ajoutée après, pas pendant.
- **Une saisonnalité qui fuit dans un backtest « strict ».** Passer le `seasonal` de série complète dans `backtest` rend le score flatteur. Correction : recalcule la saisonnalité depuis `train` dans le backtest si le nombre est pour un client.
- **Une corrélation avec des index désalignés.** Après `.dropna()` ou une tranche matinale filtrée, deux séries peuvent être en désaccord sur les dates et `.corr()` retourne `NaN` ou un nombre trompeur. Correction : `.align()` ou découpe les deux à l'index partagé avant de noter.

## Ce que tu viens de construire

Un analyseur de séries temporelles complet : une série quotidienne générée, une décomposition additive construite à la main en tendance/saisonnalité/résidu, une prévision tendance-plus-saison avec une MAE backtestée, une détection d'anomalies sur le résidu, et un graphique de paire corrélée enregistré sur disque. La compétence transférable est *séparer le signal du bruit* : décompose toute séquence bruitée en dérive lente, rythme répétitif et résidu restant, puis prévois les parties et signale le reste, la même recette derrière la planification de la demande, la surveillance, et la question « qu'est-ce qui a réellement changé ? ».

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/time-series-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/time-series-analyzer) dans le dépôt du cours est une version plus complète du code ci-dessus, avec une décomposition à quatre composantes et un ajustement de tendance type SARIMA. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute la quatrième composante manquante, effets de jour de bourse ou de vacances, par un passage `groupby` de plus sur le résidu.
- Remplace l'ajustement de ligne manuel par `numpy.polyfit` au degré 2 et utilise la comparaison de type AIC pour décider si la courbe a gagné son paramètre supplémentaire.
- Balaye le `threshold` dans `detect_anomalies` de 1.5 à 4 et affiche combien de jours chacun signale, pour que le seuil cesse d'être magique.
- Écris la prévision plus les z-scores dans un seul CSV pour que le script shell qui envoie un courriel au gérant du café puisse lire un fichier, pas trois.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
