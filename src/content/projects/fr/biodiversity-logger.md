---
title: "Journal de Biodiversité"
description: "Enregistrez les observations de la faune avec identification des espèces, cartographie des emplacements et statut de conservation."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Environment", "AI Agents", "Data Visualization"]
prerequisites:
  - "Le groupby, le filtrage et la fusion de pandas"
  - "Les fonctions et listes en Python"
  - "Lire un CSV comme livrable"
learningObjectives:
  - "Générer un journal d'observations synthétique déterministe avec un RNG numpy et des dates pandas"
  - "Dériver les bases de référence d'espèces et les fenêtres récentes d'un seul DataFrame"
  - "Appliquer une règle de seuil (SURVEY/WATCH/OK) comme fonction de décision de l'agent"
  - "Ingérer des lots d'observations hebdomadaires et journaliser les décisions par espèce en CSV"
  - "Visualiser les totaux d'espèces comme un diagramme à barres ASCII et ordonner une file de recensement prioritaire"
---

# 🛠️ 🦉 Construire un Journal de Biodiversité

Les écologues ne surveillent pas chaque individu, ils surveillent des *signaux*. Un déclin de 30 % ou plus des oiseaux observés sur une saison est un déclencheur de recensement ; un vacillement près de la base de référence mérite d'être surveillé ; un décompte stable signifie « laisse-le tranquille ». Ce projet construit cette boucle de décision comme un petit **agent de recensement** : il détient un journal d'observations long d'une saison (synthétique, donc reproductible), calcule la base de référence et la fenêtre récente de chaque espèce, applique une règle de seuil pour marquer `SURVEY` / `WATCH` / `OK`, ingère les nouveaux lots hebdomadaires et journalise chaque décision dans un CSV, puis rend un diagramme à barres ASCII des totaux d'espèces et affiche une file de recensement priorisée. Tout tourne dans pandas et la bibliothèque standard, avec une graine fixe, la même exécution signale les mêmes espèces à chaque fois, sur n'importe quelle machine.

Cela suppose le `groupby`, le filtrage et la fusion de pandas. C'est un projet facultatif et non noté, consulte [Projets du monde réel](/fr/projets) pour la liste complète et grandissante. Une installation : `pandas`.

## 🎯 Ce que tu vas faire

1. Générer un journal d'observations déterministe de 111 jours pour cinq espèces sur trois sites.
2. Écrire le cerveau de l'agent : fenêtres de base de référence et récente plus une règle de seuil à trois niveaux.
3. Faire tourner la boucle d'ingestion : absorber trois lots hebdomadaires, ajouter une ligne de décision par espèce.
4. Visualiser les totaux d'espèces comme un diagramme à barres ASCII.
5. Prioriser : ordonner les espèces pour le prochain recensement, SURVEY en premier.

## Où exécuter ceci

**Localement avec `uv`** est le chemin recommandé :

```bash
uv init biodiversity-logger && cd biodiversity-logger
uv add pandas
```

**Google Colab, Kaggle Notebooks et Binder** exécutent chaque étape sans modification, pandas est préinstallé sur les deux plateformes, et le `default_rng(11)` fixe rend la sortie identique partout.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/biodiversity-logger/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/biodiversity-logger/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fbiodiversity-logger%2Fnotebook.fr.ipynb)

## Configuration

Tout ce qu'il faut avant la première observation.

### Configure le projet

```bash
uv init biodiversity-logger
cd biodiversity-logger
uv add pandas
```

Les imports que tu utiliseras partout :

```python
import numpy as np
import pandas as pd
```

**✅ Liste de vérification**

- ✅ `uv run python3 -c "import pandas, numpy"` réussit.
- ✅ Tu peux visualiser une ligne comme `date | site | species | count` avant de taper quoi que ce soit.

**🤔 Question(s) socratique(s)**

- Un « journal » qui ne fait que stocker des lignes est une feuille de calcul. Qu'est-ce que ce projet ajoute qui en fait un *agent*, un décideur qui réagit aux données plutôt que de juste les enregistrer ?
- Les décomptes d'espèces sont synthétiques, avec deux espèces délibérément dotées d'une tendance à la baisse. Si chaque espèce déclinait de 10 % *simultanément*, un ratio récent-vs-base-de-référence le détecterait-il même, et quel angle mort cela révèle-t-il sur le suivi basé sur les ratios ?

## Étape 1 : Génère le journal d'observations

Chaque nombre en aval vient de ce bloc, donc il est déterministe : un RNG, une graine, une plage de jours.

### 1.1 Le bloc saison

**👟 Indice de départ :** Construis un bloc de 111 jours avec `pd.date_range` ; trois sites ; cinq espèces avec décomptes de base par espèce, multiplicateurs de site et deux tendances à la baisse.

```python
# main.py
import numpy as np
import pandas as pd

rng = np.random.default_rng(11)
species = ["acorn_woodpecker", "blue_jay", "eastern_bluebird",
           "northern_cardinal", "tree_swallow"]
sites = ["riverside", "meadow", "forest"]
base = {"acorn_woodpecker": 48, "blue_jay": 62, "eastern_bluebird": 70,
        "northern_cardinal": 55, "tree_swallow": 60}
trend = {"acorn_woodpecker": -2.0, "blue_jay": 0.0, "eastern_bluebird": 0.0,
         "northern_cardinal": 0.0, "tree_swallow": -1.5}
site_mult = {"riverside": 1.2, "meadow": 0.8, "forest": 1.4}

day = pd.date_range("2025-04-01", periods=111, freq="D")
rows = []
for s in species:
    for site in sites:
        for i, d in enumerate(day):
            week = i // 7
            mu = base[s] * site_mult[site] + trend[s] * week
            rows.append({"date": d, "site": site, "species": s,
                         "count": max(0, round(mu + rng.normal(0, 4)))})
full = pd.DataFrame(rows)
print(full.head(3).to_string(index=False))
print("shape:", full.shape)
```

Les deux entrées `trend`, acorn woodpecker −2 par semaine, tree swallow −1.5, sont les espèces que l'agent doit finalement *remarquer*. Le terme `rng.normal(0, 4)` est un bruit journalier réaliste : les décomptes vacillent de ±4 même sur une tendance stable, donc un strict « le décompte a baissé aujourd'hui » se déclencherait en permanence. La logique de ratio de l'Étape 2 moyenne ce bruit.

**🎯 Résultat attendu :**

```
        date      site          species  count
0 2025-04-01 riverside acorn_woodpecker     58
1 2025-04-02 riverside acorn_woodpecker     63
2 2025-04-03 riverside acorn_woodpecker     62
shape: (1665, 4)
```

**🩹 Si ça ne marche pas :** Si le premier décompte de la tête diffère de 58, la graine RNG ou l'ordre des appels a changé. Si `shape` n'est pas `(1665, 4)`, la boucle a mal calculé `5 espèces × 3 sites × 111 jours = 1665`.

### 1.2 Retiens les semaines « entrantes »

**👟 Indice de départ :** Garde les jours avant 2025-06-30 (`<2025-06-30`) comme saison *observée* ; les trois dernières semaines seront remises à l'agent comme « nouveaux lots de capteurs » à l'Étape 3.

```python
# main.py (continued)
observed = full[full["date"] < pd.Timestamp("2025-06-30")].copy()
print("observed rows (days 1–90):", len(observed))
```

L'Étape 3 a besoin de lots frais que l'agent *n'a pas vus*. Plutôt que de les régénérer depuis zéro (un second flux RNG), le script génère une saison de 111 jours d'un coup et ne fait que retenir la fin : le même bloc est le livrable, et le découpage est la fiction d'« arrivée de nouvelles données ». Cela garde tout sur une seule graine, pas de second flux aléatoire à documenter.

**🎯 Résultat attendu :** `observed rows (days 1–90): 1350`, 90 jours × 30 lignes/jour.

**🩹 Si ça ne marche pas :** Si 1350 s'affiche comme 1665, le `<` est devenu `<=` (incluant le 91e jour) ou la copie a perdu le filtre. Si un autre compte s'affiche, la comparaison de dates mélange les fuseaux horaires, compare des objets `Timestamp`, pas des chaînes.

### 1.3 Vérifie la couche de données

**✅ Liste de vérification**

- ✅ `full.shape == (1665, 4)` ; chaque espèce a `270` lignes (espèces `distinctes` comptées dans `groupby`).
- ✅ Les lignes de tête et les décomptes sont déterministes (même exécution, mêmes nombres).
- ✅ `observed` est exactement les 90 premiers jours, `1350` lignes.

**🤔 Question(s) socratique(s)**

- Trois sites multiplient le décompte de base différemment (`forest` 1,4×, `meadow` 0,8×). Quand l'agent compare les totaux *d'espèces*, doit-il compter les oiseaux bruts ou les oiseaux-par-site ? Qu'arrive-t-il au ratio d'une espèce concentrée en forêt si tu compares des décomptes bruts à travers des régions d'effort inégal ?
- Le bruit journalier `rng.normal(0, 4)` signifie qu'un seul jour peut faire tomber 8 oiseaux par hasard. Combien de jours de moyenne faut-il avant que la tendance −2/semaine commence à dominer le bruit ±4, et qu'est-ce que cela dit sur la raison pour laquelle l'agent utilise des *fenêtres*, pas des jours isolés ?

## Étape 2 : Le cerveau de l'agent

La règle de décision est tout l'agent. L'Étape 2 définit les fenêtres et le seuil à trois niveaux.

### 2.1 Fenêtres de base de référence et récente

**👟 Indice de départ :** Calcule les décomptes moyens par espèce pour la base de référence (les 28 premiers jours) et la fenêtre récente (à partir du 1er juin), puis leur ratio.

```python
# main.py (continued)
BASE_END = pd.Timestamp("2025-04-29")
RECENT_START = pd.Timestamp("2025-06-01")

base_mean = observed[observed["date"] < BASE_END].groupby("species")["count"].mean()
recent_mean = observed[observed["date"] >= RECENT_START].groupby("species")["count"].mean()
ratio = recent_mean / base_mean
print(ratio.round(3))
```

La base de référence est la « normale » de l'espèce, les décomptes de printemps des quatre premières semaines. La fenêtre récente est « ce qui se passe maintenant », les décomptes de juin et après. Diviser récent par base donne un ratio sans dimension : `0.66` signifie « les observations récentes sont un tiers plus basses que la base de référence », `1.0` signifie « au même niveau », `1.2` signifie « en plein essor ». Les ratios effacent l'échelle, donc une seule règle de seuil fonctionne à travers les espèces quelle que soit leur abondance.

**🎯 Résultat attendu :**

```
acorn_woodpecker     0.659
blue_jay             1.003
eastern_bluebird     1.004
northern_cardinal    1.003
tree_swallow         0.804
Name: count, dtype: float64
```

**🩹 Si ça ne marche pas :** Si les espèces stables montrent des ratios comme `1.20`, la fenêtre récente a attrapé le pic de saison pendant que la base de référence attrapait le creux, les bornes des fenêtres comptent. Si acorn montre ~1.0, le dict `trend` n'a pas été appliqué (vérifie `trend[s] * week`).

### 2.2 La règle à niveaux

**👟 Indice de départ :** Transforme le ratio en niveau avec `alert_level(r)`, `< 0.7` SURVEY, `< 1.0` WATCH, sinon OK.

```python
# main.py (continued)
def alert_level(r):
    if r < 0.7:
        return "SURVEY"
    if r < 1.0:
        return "WATCH"
    return "OK"

for s in species:
    print(f"{s:<20} {ratio[s]:.3f}  {alert_level(ratio[s])}")
```

Les seuils sont la *politique* de l'agent : un tiers en dessous de la base de référence justifie d'envoyer un recensement de terrain ; tout creux sous le niveau par déclenche une surveillance ; au niveau par ou au-dessus, on laisse tranquille. Deux espèces tombent sous 1.0 : acorn woodpecker à 0.659 (assez profond pour SURVEY) et tree swallow à 0.804 (un WATCH). Les stables se tiennent juste à 1.00, le plancher de bruit, pas un vrai signal (note que le seuil ne se soucie pas que la différence entre 1.003 et 0.999 soit du pur bruit).

**🎯 Résultat attendu :**

```
acorn_woodpecker     0.659  SURVEY
blue_jay             1.003  OK
eastern_bluebird     1.004  OK
northern_cardinal    1.003  OK
tree_swallow         0.804  WATCH
```

**🩹 Si ça ne marche pas :** Si la colonne de niveau est tout `OK`, `alert_level` a comparé une `str` à un `float` (passe le ratio, pas l'étiquette). Si les statuts SURVEY montrent `WATCH`, la frontière `0.7` est `<` contre `<=`, choisis-en une et sois cohérent.

### 2.3 Vérifie le cerveau

**✅ Liste de vérification**

- ✅ Les ratios sont des comparaisons récent/base sans dimension ; les espèces stables se tiennent ≈ 1.00.
- ✅ Niveaux : acorn SURVEY (0.659), swallow WATCH (0.804), trois OK.
- ✅ `alert_level` est une fonction pure, même ratio, même niveau, chaque appel.

**🤔 Question(s) socratique(s)**

- Les ratios des espèces stables planent à ±0.005 de 1.00, c'est du bruit de mesure, pas une tendance. Un utilisateur de `alert_level` voit `WATCH` pour 0.999 et `OK` pour 1.001. Quelle *bande morte* (par ex. traiter 0.95–1.05 comme « pas de changement ») réduirait les fausses alertes, et comment l'implémenterais-tu sans changer l'esprit des trois niveaux ?
- `ratio` divise récent par base. Si une espèce était *absente* de la base de référence (base = 0), le ratio explose en `inf`. Quel garde ajouterais-tu, et que ferait une alerte sensée pour « espèce nouvellement apparue » ?

## Étape 3 : La boucle d'ingestion

L'agent n'évalue pas une fois, il reçoit de nouvelles données et redécide. L'Étape 3 lui donne trois semaines de « nouveaux » lots et journalise chaque décision.

### 3.1 Alimente un lot, redécide

**👟 Indice de départ :** Pour chacune des trois semaines retenues, fusionne le morceau dans `observed`, recalcule le ratio/niveau par espèce, et ajoute une ligne `(checked, species, ratio, level)` par espèce.

```python
# main.py (continued)
BASE_END = pd.Timestamp("2025-04-29")
RECENT_START = pd.Timestamp("2025-06-01")

def alert_level(r):
    return "SURVEY" if r < 0.7 else ("WATCH" if r < 1.0 else "OK")

def status_of(obs, checked):
    base_mean = obs[obs["date"] < BASE_END].groupby("species")["count"].mean()
    recent_mean = obs[obs["date"] >= RECENT_START].groupby("species")["count"].mean()
    rows = []
    for s in species:
        r = recent_mean[s] / base_mean[s]
        rows.append({"checked_after_days": checked, "species": s,
                     "ratio": round(r, 3), "level": alert_level(r)})
    return pd.DataFrame(rows)

decisions = pd.DataFrame()
weeks = [(pd.Timestamp("2025-06-30"), pd.Timestamp("2025-07-06")),
         (pd.Timestamp("2025-07-07"), pd.Timestamp("2025-07-13")),
         (pd.Timestamp("2025-07-14"), pd.Timestamp("2025-07-20"))]

for week, (start, end) in enumerate(weeks, start=1):
    chunk = full[(full["date"] >= start) & (full["date"] <= end)]
    observed = pd.concat([observed, chunk], ignore_index=True)
    status = status_of(observed, checked=90 + 7 * week)
    decisions = pd.concat([decisions, status], ignore_index=True)

print(decisions.head(10).to_string(index=False))
```

Chaque passage est une *redécision* : la base de référence reste épinglée aux quatre premières semaines (un contrat historique), pendant que la fenêtre récente absorbe le nouveau lot, donc le ratio bouge continuellement à mesure que les semaines fraîches arrivent. Les décisions sont une table croissante, une ligne par espèce et par vérification : 5 espèces × 3 vérifications = 15 lignes à la fin.

**🎯 Résultat attendu :**

```
 checked_after_days           species  ratio level
                 97  acorn_woodpecker  0.644 SURVEY
                 97          blue_jay  1.001    OK
                 97  eastern_bluebird  1.003    OK
                 97 northern_cardinal  1.003    OK
                 97      tree_swallow  0.789 WATCH
                104  acorn_woodpecker  0.626 SURVEY
                104          blue_jay  1.000 WATCH
                104  eastern_bluebird  1.001    OK
                104 northern_cardinal  0.998 WATCH
                104      tree_swallow  0.779 WATCH
```

**🩹 Si ça ne marche pas :** Si `chunk` a fusionné mais les nombres n'ont pas bougé, `status_of` a utilisé un ratio global mis en cache, recalcule depuis `obs` à chaque passage. Si les décisions ont 10 lignes en tête au lieu de 5, `status_of` a tourné par semaine *et* par espèce deux fois.

### 3.2 Persiste les décisions

**👟 Indice de départ :** `to_csv("decisions.csv", index=False)` et relis-le pour prouver que le livrable survit à la session.

```python
# main.py (continued)
decisions.to_csv("decisions.csv", index=False)
print(pd.read_csv("decisions.csv").shape)
print(pd.read_csv("decisions.csv").tail(5).to_string(index=False))
```

Un CSV de décisions est ce qu'une partie prenante non Python consomme réellement : 15 lignes, cinq par vérification, chacune avec `checked_after_days`, espèce, ratio, niveau. Le relire avec pandas fait l'aller-retour du livrable, la file priorisée de l'étape suivante lira depuis ce même fichier.

**🎯 Résultat attendu :**

```
(15, 4)
 checked_after_days           species  ratio level
                111  acorn_woodpecker  0.607 SURVEY
                111          blue_jay  0.999 WATCH
                111  eastern_bluebird  0.999 WATCH
                111 northern_cardinal  0.996 WATCH
                111      tree_swallow  0.767 WATCH
```

**🩹 Si ça ne marche pas :** Si la forme de l'aller-retour n'est pas `(15, 4)`, `to_csv`/`read_csv` a laissé tomber une colonne (le drapeau `index` a écrit une colonne sans nom en plus). Si la queue montre des lignes périmées d'une exécution précédente, vide le CSV avant la boucle.

### 3.3 Vérifie la boucle

**✅ Liste de vérification**

- ✅ Trois fusions → 15 lignes de décision ; jours de vérification `97, 104, 111`.
- ✅ Acorn woodpecker est `SURVEY` à chaque vérification ; son ratio *tombe* 0.644 → 0.626 → 0.607 (déclin qui s'accélère).
- ✅ `decisions.csv` fait l'aller-retour `(15, 4)`.

**🤔 Question(s) socratique(s)**

- Le ratio d'acorn *a chuté* à travers les trois vérifications pendant que les espèces stables vacillaient `OK ↔ WATCH` près de 1.00. Quel motif est le signal, et lequel est le bruit, et qu'est-ce que le déclin monotone du ratio te dit qu'un simple instantané au jour 97 ne pourrait jamais ?
- La base de référence est épinglée **aux quatre premières semaines pour toujours**. Une espèce qui s'est rétablie à 2,0× le niveau de base se compare encore au printemps. Quand une base de référence *glissante* (recalculée depuis les 90 derniers jours) est-elle meilleure qu'une base fixe, et quel nouveau risque (un glissement vers un déclin auto-réalisateur) introduit-elle ?

## Étape 4 : Visualise les totaux

Les décisions te disent *quelles* espèces ; un graphique te dit *combien* chacune compte. L'Étape 4 rend les totaux d'espèces comme un diagramme à barres ASCII, une visualisation adaptée au terminal.

### 4.1 Observations totales par espèce

**👟 Indice de départ :** `groupby("species")["count"].sum()` sur la saison de 111 jours, trié en ordre croissant pour le graphique.

```python
# main.py (continued)
totals = full.groupby("species")["count"].sum().sort_values()
print(totals.to_dict())
```

Les totaux répondent « qui est abondant, qui est rare », un réflexe de rapport, pas une règle de décision. Les deux espèces signalées (acorn 13 223 et swallow 18 954) sont en plein milieu du peloton : pas les plus rares, ce qui est exactement pourquoi le ratio compte, une espèce *rare* *et* une espèce *commune* méritent toutes deux un recensement quand leurs décomptes tombent sous la base de référence.

**🎯 Résultat attendu :**

```
{'acorn_woodpecker': 13223, 'tree_swallow': 18954, 'northern_cardinal': 20705, 'blue_jay': 23398, 'eastern_bluebird': 26435}
```

**🩹 Si ça ne marche pas :** Si les valeurs totalisent sauvagement au-dessus de 1665×~50, `concat` a dupliqué des morceaux (l'Étape 4 tourne avant la boucle, calcule sur `full`, pas `observed` en pleine ingestion).

### 4.2 Rends les barres ASCII

**👟 Indice de départ :** Mappe chaque total à `"#" * round(v / max * 40)` pour un graphique à largeur fixe de 40 barres.

```python
# main.py (continued)
mx = totals.max()
for s, v in totals.items():
    bar = "#" * round(v / mx * 40)
    print(f"  {s:<20} {v:6d}  {bar}")
```

`v / mx * 40` remet à l'échelle la plus grande espèce (eastern bluebird, 26 435) à 40 caractères et tout le reste proportionnellement, un diagramme à barres qui ne dépend pas de la magnitude absolue. C'est une primitive de visualisation qui fonctionne dans n'importe quel terminal, n'importe quel notebook, n'importe quelle plateforme, et qui rend l'abondance *relative* visible d'un coup d'œil.

**🎯 Résultat attendu :**

```
  acorn_woodpecker      13223  ####################
  tree_swallow          18954  #############################
  northern_cardinal     20705  ###############################
  blue_jay              23398  ###################################
  eastern_bluebird      26435  ########################################
```

**🩹 Si ça ne marche pas :** Si une barre est vide (`""`) le total de l'espèce a touché 0 (le garde de ratio du Socratic de l'Étape 2 devrait avertir). Si les barres débordent la ligne, `round(v / mx * 40)` plafonne à 40 seulement si `v <= mx`, c'est le cas, par définition de `max`.

### 4.3 Vérifie le graphique

**✅ Liste de vérification**

- ✅ Les totaux correspondent au dict trié : acorn 13 223 … bluebird 26 435.
- ✅ La barre la plus longue (40 `#`) appartient au total le plus grand (eastern bluebird).
- ✅ Signaux et barres viennent du même bloc déterministe, le graphique et les décisions ne peuvent pas diverger.

**🤔 Question(s) socratique(s)**

- Le graphique classe par *total*, l'agent par *ratio*. Eastern bluebird domine le graphique (26 435) mais est `OK` ; acorn est l'avant-dernier (13 223) mais est `SURVEY`. Où un graphique qui ne montrerait que les totaux enverrait-il un recensement, et qu'est-ce que cela enseigne sur « le plus d'oiseaux » contre « le plus en danger » ?
- 40 `#` donnent 2,6 % de résolution par caractère, 13 223 et 13 223+300 ne peuvent pas être distingués. Pour la *signalisation* de décision, tu voudrais une plus grande échelle ou une échelle logarithmique. Quand le diagramme à barres ASCII est-il la *mauvaise* visualisation à mettre à côté d'une file priorisée ?

## Étape 5 : La file de recensement priorisée

Décisions + totaux ne font pas un plan d'action ; l'agent doit dire *qui passe en premier*. Les espèces `SURVEY` d'abord, puis les espèces `WATCH` par gravité (ratio le plus bas), puis OK.

### 5.1 Ordonne les espèces

**👟 Indice de départ :** Lis les dernières décisions, mappe les niveaux à un nombre de priorité (`SURVEY=0 < WATCH=1 < OK=2`), et trie par `(priority, ratio, species)`.

```python
# main.py (continued)
latest = pd.read_csv("decisions.csv")
latest = latest[latest["checked_after_days"] == latest["checked_after_days"].max()]
prio = {"SURVEY": 0, "WATCH": 1, "OK": 2}
latest["priority"] = latest["level"].map(prio)
latest = latest.sort_values(["priority", "ratio", "species"])

for i, row in latest.iterrows():
    print(f"{i+1:>2}. {row['level']:<6} {row['species']:<20} ratio {row['ratio']:.3f}")
```

Filtrer sur la vérification la plus récente (`checked_after_days == max`) garde seulement l'image *actuelle*, les décisions de la semaine 1 sont de l'histoire, pas des priorités. Mapper le niveau à un nombre laisse `sort_values` faire le travail de politique : tout `SURVEY` devant tout `WATCH` devant tout `OK`, égalités départagées par gravité (ratio plus bas = pire) puis par nom pour le déterminisme.

**🎯 Résultat attendu :**

```
 1. SURVEY  acorn_woodpecker      ratio 0.607
 2. WATCH   tree_swallow          ratio 0.767
 3. WATCH   northern_cardinal     ratio 0.996
 4. WATCH   blue_jay              ratio 0.999
 5. WATCH   eastern_bluebird      ratio 0.999
```

**🩹 Si ça ne marche pas :** Si acorn n'est pas en premier, la carte de priorité ou les clés de tri sont échangées (trie par `("priority", "ratio")`, pas par nom). Si plus de 5 lignes s'affichent, le filtre sur le `checked_after_days` maximal n'a pas tourné.

### 5.2 Expédie le plan

**👟 Indice de départ :** Émets une chaîne de plan d'une ligne pour que le livrable fasse aussi office de message actionnable.

```python
# main.py (continued)
plan = "; ".join(f"{row['level']}:{row['species']}"
                 for _, row in latest.iterrows())
print("SURVEY PLAN ->", plan)
```

La ligne de plan est ce qu'un écologue lit réellement : `SURVEY:acorn_woodpecker; WATCH:tree_swallow; …`. Le tour complet de l'agent, ingérer → décider → journaliser → prioriser → envoyer, est maintenant une sortie de pipeline unique sur laquelle un humain peut agir.

**🎯 Résultat attendu :** `SURVEY PLAN -> SURVEY:acorn_woodpecker; WATCH:tree_swallow; WATCH:northern_cardinal; WATCH:blue_jay; WATCH:eastern_bluebird`

**🩹 Si ça ne marche pas :** Si le plan liste les espèces dans l'ordre du fichier, le `sort_values` avant la ligne de plan a été laissé tomber. Les désaccords de nom de colonne (`ratio` contre `Ratios`) cassent la jointure en silence, garde le schéma CSV de l'Étape 3.2 exact.

### 5.3 Vérifie la file

**✅ Liste de vérification**

- ✅ Ordre de priorité : SURVEY (acorn) avant tout WATCH ; WATCH triés par ratio croissant.
- ✅ La ligne `plan` enchaîne chaque espèce dans le même ordre que la liste imprimée.
- ✅ Tout lit depuis `decisions.csv`, le fichier **est** le système d'enregistrement.

**🤔 Question(s) socratique(s)**

- La file trie `WATCH` par ratio, donc tree swallow (0.767) précède northern cardinal (0.996). Mais une espèce *rare* à 0.996 peut être plus fragile qu'une commune à 0.767. Quel poids combinerait le ratio **et** l'abondance absolue en un seul score de priorité, et qu'est-ce que cela coûte en explicabilité ?
- Cet agent a décidé par des seuils qu'un humain a choisis (0.7/1.0). Un pipeline « automatisé » avec des seuils choisis à la main est une automatisation avec un humain dans la boucle. Où, dans ce projet, *enregistrerais-tu* le choix de seuil pour qu'une future exécution d'agent ne soit pas une boîte noire silencieuse ?

## ⚠️ Pièges courants

- **Deux flux aléatoires.** Si les morceaux sont régénérés avec leur propre RNG, les « nouvelles » données cassent la reproductibilité et l'historique des décisions devient inexplicable. Garde toute la saison sur un seul `default_rng(11)` et découpe.
- **Des fenêtres qui incluent le futur.** `date >= 2025-06-01` où le bloc observé se termine déjà le 29-06 est bien ; mais filtrer avec `<=` sur la *fenêtre de morceau* peut double-compter des jours partagés entre fusion et statut. Utilise des comparaisons semi-ouvertes (`>= start & < end_next`).
- **Un ratio sur une base de référence de zéro.** Une espèce absente au printemps donne un ratio `inf` et un mauvais niveau. Garde avec une branche `baseline == 0` (toujours `SURVEY` pour une base de référence disparue).
- **`concat` contre mutation.** `pd.concat([observed, chunk])` réattribue le nom, une habitude d'`.append` en place rejoue silencieusement les anciens morceaux et gonfle les ratios. Réattribue toujours explicitement et supprime les doublons si tu relances.
- **Lire `decisions.csv` en pleine boucle.** Si le fichier existe déjà depuis une exécution précédente, `to_csv` sans sémantique d'écrasement double les lignes. Tronque ou reconstruis avant chaque boucle.
- **Trier les mauvaises clés.** Prioriser par `ratio` seul met un OK à 0.60 avant un SURVEY à 0.90. L'ordre de politique est `level` d'abord, puis `ratio`, puis le nom d'espèce.

## Ce que tu viens de construire

Un agent de recensement qui transforme un flux d'observations en un plan de conservation actionnable : journaux de saison synthétiques, bases de référence et fenêtres récentes par espèce, une politique de seuil à trois niveaux, une boucle d'ingestion qui redécide à mesure que de nouvelles semaines atterrissent et ajoute chaque décision à un CSV, un diagramme à barres ASCII qui classe l'abondance, et une file priorisée qui dit qui recenser en premier. Les idées centrales se transfèrent partout où des seuils + des fenêtres de temps apparaissent : **compare le comportement récent à une base de référence épinglée, décide avec une petite politique lisible par un humain, journalise chaque décision comme donnée, et accouple toujours un signal (le ratio) avec sa magnitude (les totaux)**, parce que « en baisse de 40 % » ne veut rien dire tant que tu ne sais pas que c'est l'acorn woodpecker, et qu'une espèce stable est une raison de regarder ailleurs, pas de détourner le regard.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/biodiversity-logger/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/biodiversity-logger) dans le dépôt du cours est l'agent complet comme notebook, génération de saison, fenêtres, boucle d'ingestion de trois semaines, graphique ASCII et plan priorisé, exécutables dans Colab/Kaggle/Binder. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute une **bande morte** à `alert_level` (`WATCH` seulement pour les ratios dans `[0.7, 0.95)`, traite `0.95–1.05` comme `OK`) pour que le bruit de frontière cesse de retourner la file.
- Ajoute des ruptures par site : au lieu d'un ratio par espèce, signale les paires *site×espèce* (par ex. `tree_swallow@meadow`), et empile le graphique ASCII par site.
- Visualise avec une vraie bibliothèque de tracé : `totals.plot.barh()` ou `sevplot`, les mêmes données groupby alimentent le graphique ASCII et une figure matplotlib.
- Planifie la boucle : enveloppe les étapes 3–5 dans une fonction `run_check(observed, new_chunk)` et appelle-la chaque nuit, chargeant `observed` depuis le CSV précédent au lieu de le régénérer.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier·e ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis, et son README contient un tutoriel complet, accessible aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, étape par étape. Aucune expérience git préalable n'est requise.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓