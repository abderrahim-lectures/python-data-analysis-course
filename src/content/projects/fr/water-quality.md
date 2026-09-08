---
title: "Moniteur de Qualité de l'Eau"
description: "Testez et suivez les paramètres de qualité de l'eau avec analyse de tendances et alertes de contamination."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["csv", "matplotlib", "automation"]
learningObjectives:
  - "Stocker les relevés d'échantillons horodatés dans un CSV"
  - Valider les relevés par rapport aux spécifications de plages sûres
  - "Calculer les moyennes mobiles et la dérive à partir d'une série de données"
  - "Émettre des alertes classées par sévérité pour les échantillons hors plage ou dérivants"
  - "Tracer les tendances avec des lignes guides rouges de plage sûre"
prerequisites:
  - "Les bases de Python (fonctions, boucles, dictionnaires)"
  - "matplotlib pyplot de base (subplots, axhline)"
  - "À l'aise pour écrire et lire des fichiers CSV"
---

# 🛠️ 💧 Moniteur de Qualité de l'Eau

La surveillance de l'eau douce est un pipeline de données dans une boîte froide : un capteur (ton journal d'échantillons) produit des relevés horodatés, une spécification (plages sûres par paramètre) décide du passage/échec, les tendances décident du « ça empire », et une liste d'alertes décide de l'attention. Ce projet construit toute la boucle avec un simple CSV comme capteur : définis les paramètres et leurs plages sûres, journalise les relevés, valide chaque échantillon, calcule les moyennes mobiles et la dérive, émet des alertes classées par sévérité, et termine avec un graphique matplotlib dont les lignes rouges en pointillés sont les limites de plages sûres.

Cela suppose Python 101 plus un peu de matplotlib — rien d'autre n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Définir les cinq paramètres surveillés et leurs plages sûres.
2. Journaliser des relevés horodatés dans un CSV avec des données qui gardent leurs étiquettes.
3. Valider chaque relevé par rapport aux plages et imprimer un tableau passe/échec.
4. Calculer les moyennes mobiles et la dérive pour attraper les tendances lentes de « ça empire ».
5. Alerter sur les échecs, les valeurs limites et la dérive — classés par sévérité.
6. Tracer chaque paramètre contre ses lignes guides rouges de plage sûre.

## Où exécuter ceci

**En local avec `uv`** est un foyer principal — le CSV vit et grandit sur ton disque, et le graphique se sauvegarde comme un vrai fichier `.png`. Tout le projet est simple en utf-8, et chaque ligne s'exécute sans modification dans les notebooks cloud aussi, où la seule différence est que le graphique se rend *en ligne* au lieu de se sauvegarder dans un fichier.

**Google Colab, Kaggle Notebooks et Binder** exécutent les six étapes de manière identique (aucune donnée externe — le CSV est ensemencé par ton propre script), avec le graphique en ligne à la fin. L'honnêteté impose de préciser : les graphiques en ligne sont parfaits pour explorer, mais un outil de surveillance veut le fichier sur le disque pour qu'un opérateur puisse le regarder plus tard. Utilise les badges pour explorer ; utilise l'exécution locale pour le sentiment de « vrai appareil ».

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/water-quality/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/water-quality/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwater-quality%2Fnotebook.ipynb)

## Configuration

Crée le projet. La journalisation et l'analyse n'utilisent que la bibliothèque standard ; matplotlib est la seule vraie dépendance.

```bash
uv init water-quality
cd water-quality
```

```bash
uv add matplotlib
```

```bash
uv run python -c "import matplotlib; print('plt', matplotlib.__version__)"
```

`csv` transforme chaque échantillon en une ligne nommée (`timestamp`, `ph`, ...) pour que les données restent décodables des années plus tard, et `pathlib` garde les chemins de fichiers propres. Tu concevras le *schéma* toi-même à l'Étape 1 — ce schéma est ce qui fait de chaque étape ultérieure (validation, moyennes mobiles, graphiques) une recherche de nom au lieu d'un tas de chaînes if-else.

**✅ Liste de vérification**

- ✅ `uv init water-quality` a créé un projet avec un `pyproject.toml`.
- ✅ `uv add matplotlib` a réussi ; le contrôle d'import a affiché une version de matplotlib.

## Étape 1 : Définis les paramètres, les plages et le stockage CSV

Chaque spécification de surveillance commence par la même question : *qu'est-ce que nous surveillons, et qu'est-ce qu'une valeur sûre ?* Cette étape encode la réponse comme données — un dictionnaire de paramètres, chacun avec une plage low/high et une unité — et écrit tes premiers relevés dans `readings.csv`.

### 1.1 Écris `PARAMETERS`, `make_reading` et `write_reading`

**👟 Indice de départ :** Mets la spécification de chaque paramètre (`low`, `high`, `unit`) dans un seul dict `PARAMETERS`, puis construis les relevés comme de simples dicts et ajoute-les au CSV — `DictWriter` garde l'ordre des colonnes pour toi.

```python
# monitor.py
import csv
import json
from pathlib import Path

PARAMETERS = {
    "ph":          {"low": 6.5, "high": 8.5,    "unit": "pH"},
    "turbidity":   {"low": 0.0, "high": 5.0,    "unit": "NTU"},
    "tds":         {"low": 0.0, "high": 500.0,  "unit": "ppm"},
    "temperature": {"low": 5.0, "high": 25.0,   "unit": "C"},
    "chlorine":    {"low": 0.2, "high": 2.0,    "unit": "mg/L"},
}

def make_reading(t: str, ph: float, turb: float, tds: float,
                 temp: float, chlorine: float) -> dict:
    return {"timestamp": t, "ph": ph, "turbidity": turb, "tds": tds,
            "temperature": temp, "chlorine": chlorine}

FIELDNAMES = ["timestamp", "ph", "turbidity", "tds", "temperature", "chlorine"]

def write_reading(path: str, reading: dict) -> None:
    is_new = not Path(path).exists()
    with open(path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        if is_new:
            writer.writeheader()
        writer.writerow(reading)
```

`PARAMETERS` étant *des données plutôt que des littéraux éparpillés*, c'est toute la conception : « plage sûre » est maintenant une recherche (`PARAMETERS["ph"]["high"]`), donc la validation (Étape 2), les alertes (Étape 4) et les lignes guides du graphique (Étape 6) lisent toutes la même source de vérité unique. `make_reading` accepte une valeur par champ dans une signature fixe, pour qu'un relevé ne puisse pas gagner silencieusement une colonne que le schéma CSV ne connaît pas. `DictWriter` avec `writeheader()` écrit les étiquettes une fois, ce qui garde le CSV lisible par un humain plus tard.

### 1.2 Ensenence six relevés d'échantillons

**👟 Indice de départ :** Une demi-heure d'échantillons à intervalles de 15 minutes, avec l'eau *dérivant vers le mauvais* à la fin — pH grimpant, chlore s'effondrant — pour que les étapes ultérieures aient quelque chose de réel à attraper.

```python
# Seed the log (a sensor as data)
samples = [
    make_reading("08:00", 7.0, 1.1, 220,  17.5, 0.9),
    make_reading("08:15", 7.3, 1.4, 235,  18.0, 0.7),
    make_reading("08:30", 7.7, 4.8, 260,  18.2, 0.4),
    make_reading("08:45", 8.1, 2.1, 300,  18.5, 0.2),
    make_reading("09:00", 8.7, 1.8, 340,  18.6, 0.1),
    make_reading("09:15", 9.4, 1.9, 520,  18.7, 0.02),
]
for reading in samples:
    write_reading("readings.csv", reading)

print(Path("readings.csv").read_text())
```

Les données ensemencées sont délibérément *pas* toutes propres : à 09:00, le pH traverse 8.5, le tds dépasse 500, et le chlore glisse vers zéro. C'est ce qui rend les étapes suivantes capables de rapporter quelque chose de significatif — un moniteur qui ne dit jamais que « tout va bien » n'est pas un moniteur auquel tu fais confiance.

**🎯 Résultat attendu :** Une ligne d'en-tête plus six lignes dans le fichier `/` la mémoire, se terminant par `09:15,9.4,1.9,520,18.7,0.02`.

**🩹 Si ça ne marche pas :** Si l'en-tête se répète à chaque ajout, c'est que `is_new` a calculé `False` — passer un fichier vide mais existant fait ajouter des titres à `DictWriter` pour toujours. Si les colonnes sont mélangées, c'est que les clés du dict `reading` sont en désaccord avec `FIELDNAMES` — `DictWriter` écrit par clé, donc une clé mal orthographiée atterrit comme une cellule vide. Si `newline=""` manque dans `open`, le fichier peut gagner des lignes vides entre les lignes sur Windows.

### 1.3 Vérifie le stockage

**✅ Liste de vérification**

- ✅ `readings.csv` existe avec exactement une ligne d'en-tête et six lignes de données.
- ✅ Exécuter l'ensemencement deux fois ajoute, n'écrase pas — le journal est en ajout seul.
- ✅ `PARAMETERS` contient chaque paramètre avec `low`, `high` et `unit`.

**🤔 Question(s) socratique(s)**

- Le CSV ne stocke que des valeurs brutes — pas de colonne « alerte ! ». Si tu ajoutais *vraiment* une colonne de statut au moment de l'écriture, qu'est-ce qui pourrait devenir périmé à son sujet plus tard, et qu'est-ce que cela implique sur le stockage des *données* versus le stockage des *décisions dérivées des données* ?
- Les journaux de capteurs grandissent pour toujours. Quand ce schéma CSV est-il correct, et à quel volume aurais-tu besoin d'une vraie base de données — et quelles décisions (schéma, indexation, conservation) un CSV prend-il *pour toi* sans que tu le remarques ?

## Étape 2 : Valide les relevés contre les plages sûres

Maintenant la spécification fait le travail. La validation est une fonction sur `PARAMETERS` : pour chaque paramètre, la valeur de l'échantillon est-elle entre low et high ? Cette étape imprime un tableau passe/échec lisible par échantillon.

### 2.1 Écris `validate` et `print_validation`

**👟 Indice de départ :** Boucle les noms de paramètres, tire `value = reading[name]` et la spécification, et enregistre `ok` — un drapeau — par paramètre ; l'imprimante formate le tableau.

```python
# monitor.py (continuation)
def validate(reading: dict) -> dict:
    results = {}
    for name, spec in PARAMETERS.items():
        value = reading[name]
        results[name] = {
            "value": value,
            "ok": spec["low"] <= value <= spec["high"],
            "spec": spec,
        }
    return results

def print_validation(reading: dict) -> None:
    print(f"--- {reading['timestamp']} ---")
    for name, result in validate(reading).items():
        status = "PASS" if result["ok"] else "FAIL"
        width = result["spec"]["high"] - result["spec"]["low"]
        position = (result["value"] - result["spec"]["low"]) / width
        bar = "#" * max(1, int(position * 10)) + "." * max(0, 10 - int(position * 10))
        print(f"{name:>12}: {result['value']:6.2f} {result['spec']['unit']:>4}"
              f"  [{bar}]  {status}")

print_validation(samples[-1])
```

Le drapeau `ok` dans chaque résultat est délibérément *composite* : `low <= value <= high` en une seule expression se lit comme la spécification et ne peut pas basculer quand quelqu'un élargit une plage et oublie un second site. Le mini graphique à barres (`#`/`.`) est un visuel bon marché *où* dans la plage l'échantillon se trouve — un « PASS » tout au bord de la plage vaut la peine d'être regardé même avant la logique de limite de l'Étape 4.

**🎯 Résultat attendu :** `--- 09:15 ---` puis un tableau : `ph` FAIL (9.40 au bord lointain de sa barre), `turbidity` PASS haut-bord, `tds` FAIL au-delà de 500, `temperature` PASS milieu de plage, `chlorine` FAIL sous 0.2.

**🩹 Si ça ne marche pas :** Si chaque ligne lit `PASS` pour toujours, c'est que `validate` compare aux propres valeurs de l'échantillon (une faute de `spec` comme `reading[name] <= reading[name]`). Si tout montre `FAIL`, c'est que `value` est une chaîne du CSV (`float("9.4")` nécessaire) — exécuter `validate` sur des lignes chargées, pas des dicts littéraux, déclenche habituellement ça. Si la barre montre des flancs négatifs, c'est qu'une valeur est au-dessus de `high` : `position > 1` parce que le calcul de plage supposait la valeur dedans.

### 2.2 Vérifie la validation

**✅ Liste de vérification**

- ✅ L'échantillon de 08:00 passe les cinq paramètres.
- ✅ L'échantillon de 09:15 échoue `ph`, `tds` et `chlorine`.
- ✅ Une valeur *exactement égale* à un bord de plage (ex. `ph = 8.5`) compte comme `PASS` — les frontières sont inclusives.

**🤔 Question(s) socratique(s)**

- Des frontières inclusives signifient que `8.5` passe mais que `8.51` échoue — une ligne « sûre » d'un centième de large. Où des erreurs de lecture (un capteur bruyant) rendraient-elles des bornes strictement inclusives dangereuses, et qu'ajouterais-tu ?
- Qu'est-ce qui est plus honnête dans un journal de surveillance : `ok` comme booléen, ou aussi enregistrer *à quelle distance* de la plage la valeur est tombée ? Où cette distance commence-t-elle à prendre les décisions de sévérité (Étape 4) pour toi ?

## Étape 3 : Moyennes mobiles et dérive

Un seul échantillon peut être du bruit ; une *tendance* est une histoire. Cette étape calcule les moyennes mobiles (la moyenne des derniers échantillons) et un score de dérive (moyenne récente moins une ligne de base précoce) pour chaque paramètre, attrapant les changements lents qu'un contrôle ponctuel raterait.

### 3.1 Écris `load_readings`, `rolling_mean` et `drift`

**👟 Indice de départ :** `csv.DictReader` retourne des lignes dont les valeurs sont des *chaînes* — convertit en float une fois. Ensuite la moyenne mobile est une `somme/longueur` fenêtrée, et la dérive est `moyenne_récente - moyenne_base`.

```python
# monitor.py (continuation)
def load_readings(path: str = "readings.csv") -> list[dict]:
    with open(path) as f:
        return list(csv.DictReader(f))

def values(readings: list[dict], name: str) -> list[float]:
    return [float(r[name]) for r in readings]

def rolling_mean(readings: list[dict], name: str, window: int = 3) -> list[float]:
    vals = values(readings, name)
    means = []
    for i in range(len(vals)):
        chunk = vals[max(0, i - window + 1) : i + 1]
        means.append(sum(chunk) / len(chunk))
    return means

def drift(readings: list[dict], name: str,
          baseline_window: int = 3, recent_window: int = 3) -> float:
    vals = values(readings, name)
    baseline = sum(vals[:baseline_window]) / baseline_window
    recent = sum(vals[-recent_window:]) / recent_window
    return recent - baseline

for name in PARAMETERS:
    print(f"{name:>12}: drift {drift(samples, name):+6.2f} "
          f"| rolling {rolling_mean(samples, name)[-1]:6.2f}")
```

Convertir les chaînes en flottants une fois, dans `values()`, est le correctif du piège CSV classique : chaque fonction ultérieure opère sur des nombres sans saupoudrer de `float(...)` partout. `rolling_mean` ne fait grandir `window` que quand il y a moins d'échantillons (`max(0, i - window + 1)`), donc le premier point a une fenêtre de 1 au lieu de planter. `drift` est la comparaison précoce-à-récent, signée pour que la *direction* compte : `+` signifie montée, `-` chute.

**🎯 Résultat attendu :** `ph: +1.40`, `tds: +148.3`, `chlorine: -0.56` — les trois paramètres qui alerteront plus tard — avec `turbidity: -0.50` et `temperature: +0.70` traînant derrière en magnitude.

**🩹 Si ça ne marche pas :** Si `drift` est `0.0` pour tout, c'est que `values()` a obtenu des chaînes et que les comparaisons `float(r[name])` ont tourné sur l'ordre du texte (`'220' > '500'` est vide de sens). Si la toute première valeur mobile s'imprime comme la moyenne de tout l'échantillon, c'est que l'astuce de découpage `max(0, ...)` manque. Si un `KeyError: 'turbidity'` se déclenche, c'est que la colonne réelle du CSV diffère de `FIELDNAMES` (une faute dans l'en-tête) — inspecte `DictReader.fieldnames`.

### 3.2 Vérifie la détection de dérive

**✅ Liste de vérification**

- ✅ `rolling_mean(samples, "ph")[-1]` est autour de 8.7, tiré vers le haut par les derniers échantillons élevés.
- ✅ `drift(samples, "chlorine")` est clairement négatif, signalant la perte de chlore.
- ✅ Remplacer le dernier relevé par une copie de `samples[0]` fait chuter la dérive de `ph` de `+1.40` à environ `+0.60` — le calcul réagit réellement aux données.

**🤔 Question(s) socratique(s)**

- `drift` compare ici des *moyennes*, donc un pic énorme l'inflate. Quelle statistique unique isolerait la dérive d'une valeur aberrante tout en détectant toujours une vraie tendance — et à quel coût en sensibilité ?
- Une fenêtre de 3 échantillons sur un journal de 6 n'a presque pas d'historique. Si tu comparais plutôt la moyenne d'*aujourd'hui* à la moyenne de *toute la semaine*, quel nouveau mode d'échec apparaîtrait ? (Pense à ce que « ligne de base » signifie quand l'eau est déjà mauvaise.)

## Étape 4 : Alerte sur les échecs, les valeurs limites et la dérive

La surveillance gagne sa place en te disant *quoi regarder*. Cette étape transforme la validation + la dérive en alertes classées : d'abord les échecs durs (hors plage), puis les valeurs limites qui frôlent une frontière, puis les avertissements de dérive lente, et un résumé final « il faut un humain ».

### 4.1 Écris `issue_alerts`

**👟 Indice de départ :** Passe le relevé *le plus récent* plus les résultats de dérive par paramètre ; pour chacun, choisis l'alerte de plus haute sévérité qui s'applique (FAIL bat BORDERLINE bat DRIFT bat OK).

```python
# monitor.py (continuation)
BORDERLINE_FRACTION = 0.05

def issue_alerts(readings: list[dict]) -> list[dict]:
    latest = readings[-1]
    drift_by_name = {name: drift(readings, name) for name in PARAMETERS}
    alerts = []
    for name, result in validate(latest).items():
        spec = result["spec"]
        value = result["value"]
        if not result["ok"]:
            alerts.append({"severity": "ALERT", "name": name,
                           "message": f"{value:.2f} {spec['unit']} outside "
                                      f"{spec['low']}-{spec['high']}"})
            continue
        low_gap = (value - spec["low"]) / (spec["high"] - spec["low"])
        if low_gap < BORDERLINE_FRACTION or low_gap > 1 - BORDERLINE_FRACTION:
            alerts.append({"severity": "BORDERLINE", "name": name,
                           "message": f"{value:.2f} {spec['unit']} hugging a boundary"})
            continue
        d = drift_by_name[name]
        if abs(d) > 1.0:
            alerts.append({"severity": "DRIFT", "name": name,
                           "message": f"drift {d:+.2f} {spec['unit']} over last samples"})
    return alerts

for alert in issue_alerts(samples):
    print(f"[{alert['severity']:9}] {alert['name']:>12}: {alert['message']}")
```

L'échelle `continue` est un encodeur de priorité : chaque paramètre déclenche son alerte la *pire* et passe à la suite, car empiler « DRIFT » par-dessus un pH déjà en ALERT ne fait qu'enterrer le titre. `low_gap` normalise la position dans la plage en `0..1`, donc « à moins de 5 % d'une frontière » est un seul contrôle qui fonctionne pour tout paramètre quelles que soient ses unités. Les seuils de `drift` s'appliquent à chaque paramètre, ce qui est grossier — la question socratique après le tableau demande où cela mérite un raffinement.

**🎯 Résultat attendu :** `[ALERT] ph: 9.40 pH outside 6.5-8.5`, `[ALERT] tds: 520.00 ppm outside 0.0-500.0`, `[ALERT] chlorine: 0.02 mg/L outside 0.2-2.0` — trois échecs durs, aucun concurrent sur les mêmes échantillons.

**🩹 Si ça ne marche pas :** Si rien ne déclenche `ALERT` sur `ph`, c'est que `validate` a utilisé le *premier* échantillon plutôt que `readings[-1]`. Si `BORDERLINE` ne s'affiche jamais, c'est que le `continue` avant lui a mangé chaque ligne en plage — vérifie l'ordre de l'échelle d'alertes. Si les messages de `drift` citent la mauvaise unité, c'est que `drift_by_name` a été clé par nom mais lu dans un dict différent.

### 4.2 Vérifie les alertes

**✅ Liste de vérification**

- ✅ L'échantillon de 09:15 produit trois `ALERT`s — `ph`, `tds` et `chlorine`.
- ✅ `temperature` ne produit aucune alerte — elle est en pleine plage et stable.
- ✅ Un échantillon *exactement à* `ph = 8.5` déclenche `BORDERLINE` (il passe le contrôle de plage mais se trouve à moins de 5 % de la limite haute).
- ✅ L'échantillon de 08:00 seul (re-ensemencé) produit zéro alerte.

**🤔 Question(s) socratique(s)**

- `BORDERLINE` utilise un plat 5 % de la *largeur de plage* — pour le pH c'est 0.1 pH, pour le tds c'est 25 ppm. Où le proportionnel-à-la-plage regroupe-t-il des réalités physiques très différentes, et quel seuil relatif à l'unité serait plus équitable ?
- L'échelle d'alertes laisse tomber `DRIFT` quand `ALERT` a déjà déclenché. Quand un avertissement de dérive est-il *plus* actionnable que l'échec actuel — et qu'émettrait ton moteur pour dire « tu échoueras dans l'heure » ?

## Étape 5 : Trace les tendances avec des lignes guides de plage sûre

Les graphiques transforment cinq tableaux de paramètres en un seul coup d'œil. Cette étape trace chaque paramètre comme son propre sous-tracé avec des points de marqueur, des `axhline` rouges en pointillés aux frontières de plage sûre, et un PNG sauvegardé — la vue du matin de l'opérateur.

### 5.1 Écris `plot_readings`

**👟 Indice de départ :** Un sous-tracé par paramètre, `plot(timestamps, values, marker="o")`, puis un `axhline` par frontière ; `tight_layout()` avant de sauvegarder.

```python
# monitor.py (continuation)
import matplotlib.pyplot as plt

def plot_readings(readings: list[dict], path: str = "water_quality.png") -> None:
    timestamps = [r["timestamp"] for r in readings]
    names = list(PARAMETERS)
    fig, axes = plt.subplots(len(names), 1, figsize=(8, 2.0 * len(names)), sharex=True)
    for ax, name in zip(axes, names):
        series = [float(r[name]) for r in readings]
        ax.plot(timestamps, series, marker="o", label=name)
        ax.axhline(PARAMETERS[name]["high"], color="red", ls="--", lw=1)
        ax.axhline(PARAMETERS[name]["low"], color="red", ls="--", lw=1)
        ax.set_ylabel(f"{name} ({PARAMETERS[name]['unit']})")
        ax.legend(loc="best", fontsize=8)
    fig.suptitle("Water quality over the morning")
    fig.tight_layout()
    fig.savefig(path)
    print(f"saved {path}")

plot_readings(samples)
```

Les lignes guides de bornes viennent du *même* dict `PARAMETERS` que le validateur utilise — donc un changement de spécification redessine le graphique correctement sans maintenance, le gain de la conception « source de vérité unique » de l'Étape 1. `sharex=True` force chaque paramètre sur le même axe temporel, pour que l'œil compare *quand* les échecs s'empilent. `marker="o"` marque les échantillons discrets, et sauvegarder en PNG est ce qui fait du graphique un artefact durable plutôt qu'une fenêtre transitoire.

**🎯 Résultat attendu :** `saved water_quality.png` — une figure avec cinq sous-tracés empilés partageant l'axe `08:00`..`09:15`, des frontières rouges en pointillés visibles sur chaque tracé, et pH/tds/chlorine traversant leurs lignes rouges à la fin du matin.

**🩹 Si ça ne marche pas :** Si l'image est vide, c'est que `savefig` a tourné sans appel `plot` préalable ou que les axes ont été écrasés par un second `subplots`. Si les sous-tracés ne partagent pas l'axe, c'est que `sharex=True` a été abandonné. Si la numérotation s'entrelace bizarrement (`01` foulées verticales), c'est que `tight_layout()` manque et que les étiquettes se collisionnent — appelle-le avant de sauvegarder.

### 5.2 Vérifie le graphique

**✅ Liste de vérification**

- ✅ Un sous-tracé par paramètre, horodatages sur l'axe x partagé.
- ✅ Des `axhline` rouges en pointillés montrent les deux frontières sur *chaque* sous-tracé.
- ✅ Le fichier image existe sur le disque et le pH traverse visiblement sa ligne supérieure vers 09:15.

**🤔 Question(s) socratique(s)**

- Le graphique rejoue l'historique. Si un outil de surveillance ne peut que *stocker* des relevés bruts et *recalculer* tout au moment du rendu, qu'est-ce que cela implique pour l'endroit où vivent validation, dérive et alertes — dans le chemin d'écriture ou le chemin de lecture ?
- Cinq petits sous-tracés rendent les valeurs aberrantes évidentes mais les magnitudes difficiles à comparer. Si la turbidité (0-5 NTU) et le tds (0-500 ppm) partageaient un axe, qu'est-ce que l'œil conclurait *à tort* — et cela plaide-t-il pour ou contre la mise à l'échelle par paramètre ?

## ⚠️ Pièges courants

- **Inflation de chaînes depuis le CSV.** `DictReader` retourne chaque cellule comme texte, donc `float(r["ph"]) > 9.0` trie silencieusement des *chaînes* (« 9.40 » > « 9.4 » ? peu fiable). Correction : convertis en float une fois au chargement, idéalement dans `values()`.
- **Des frontières qui excluent silencieusement.** `low < value < high` (strict) se lit comme la spécification mais rejette un échantillon *exactement* sur le bord. Correction : utilise `<=`/`>=`, puis décide explicitement si le bord est sûr.
- **Un « capteur » qui falsifie l'historique.** Ensenencer le CSV à la main en mode Partage écrase les données de la session d'ajout — le fichier reste mais la séquence ment. Correction : un `write_reading` en ajout seul et une séparation entre « ensemencement » et « en direct ».
- **Des fenêtres mobiles qui regardent en arrière dans le vide.** `vals[i-window:i]` à l'index 0 donne une tranche vide → `sum/0`. Correction : serre la fenêtre avec `max(0, i - window + 1)`.
- **Des graphiques dont les lignes rouges dérivent de la spécification.** Copier-coller les nombres de bornes dans `axhline` signifie qu'un changement de spécification dessine mal le graphique silencieusement. Correction : lis toujours les frontières depuis `PARAMETERS`.

## Ce que tu viens de construire

Un pipeline de surveillance dans un seul fichier : un journal CSV durable, une validation pilotée par spécification, des moyennes mobiles et une dérive, un moteur d'alertes classé par sévérité, et un graphique avec des lignes guides dérivées de la spécification. L'idée transférable est que *« surveiller cette chose » est une forme de données* : une source (échantillons), un modèle (dict de spécifications), des signaux dérivés (validation, dérive) et un lecteur (alertes, graphique). Cette même forme pilote les tableaux de bord, les systèmes d'anomalies et chaque panneau de statut CI que tu as jamais vu — tu en as maintenant construit un de bout en bout.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/water-quality/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/water-quality) dans le dépôt du cours est une version plus complète du code ci-dessus, avec une boucle d'échantillons en direct et des assistants d'exportation. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute un champ *source* à chaque relevé (robinet, puits, rivière) et construis un filtre par source pour que les alertes disent *quelle* source échoue.
- Transforme le moteur d'alertes en tableau de règles, puis en boucle `live()` qui interroge un CSV toutes les N secondes et re-rend le graphique — un vrai moniteur en streaming.
- Exporte les alertes vers un second CSV (`alerts.csv`) et calcule son propre taux mobile — la fatigue d'alerte est elle-même une métrique qui vaut d'être surveillée.
- Calcule un « score de risque » agrégé par source en sommant les poids de sévérité sur tous les paramètres, et trace *cela* comme la ligne principale.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
