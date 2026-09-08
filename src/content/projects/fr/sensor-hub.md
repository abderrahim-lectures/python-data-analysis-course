---
title: "Hub de Capteurs IoT"
description: "Collecte et agrège les données de plusieurs capteurs — température, humidité, mouvement — dans un flux en direct simulé, puis trace des graphiques, envoie des alertes et sauvegarde l'historique."
difficulty: "intermediate"
estimatedMinutes: 120
tags: ["simulation", "matplotlib", "csv", "dictionaries", "scripting", "iot"]
learningObjectives:
  - "Représenter plusieurs types de capteurs et simuler leurs lectures sur une boucle de tick"
  - "Agréger les lectures brutes en un journal de séries temporelles normalisé"
  - "Déclencher des alertes de seuil et les persister avec le flux"
  - "Visualiser les données historiques de capteurs avec Matplotlib"
prerequisites: ["python-101/file-io", "python-101/dictionaries", "python-101/functions", "data-visualization/matplotlib"]
---

# 📡 Construire un Hub de Capteurs IoT

Entre dans une pièce et un thermostat lit 21,4 °C ; un détecteur de mouvement clignote à chaque fois que quelqu'un traverse ; une puce d'humidité mesure un coin humide. Un *hub de capteurs IoT* est la chose qui collecte toutes ces lectures de chaque capteur, les normalise en un seul flux, signale celles hors d'une plage sûre, et les stocke pour que tu puisses revenir sur un graphique. Les capteurs physiques sont optionnels — ce projet les simule honnêtement avec une boucle de tick configurable, donc tout le hub (agrégation, alertes, persistance et un tableau de bord Matplotlib) tourne sur du Python pur sans matériel et sans réseau. Tout ce que tu construis a la même forme qu'un vrai hub basé sur MQTT ; seule la source « capteur » est truquée, et tu le sauras, parce que remplacer le simulateur par un vrai flux est un échange documenté.

Cela suppose le Python 101 plus le module Matplotlib du cours. Optionnel et non noté ; vois [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Construire un registre de capteurs qui simule les lectures de température, humidité et mouvement sur un tick.
2. Agréger chaque tick en un journal de séries temporelles normalisé avec des colonnes unifiées.
3. Alerter quand une lecture franchit un seuil par capteur et enregistrer chaque alerte.
4. Persister le flux en CSV et la piste d'alertes à côté.
5. Tracer l'historique avec Matplotlib — le visuel « est-ce que ma pièce chauffe ? ».

## Où exécuter ceci

**En local avec `uv` est le chemin principal** — le hub est un script que tu exécutes, que tu regardes imprimer, et que tu relances pour ajouter ; le CSV et le `PNG` Matplotlib atterrissent comme de vrais fichiers que tu peux ouvrir, et le ressenti « exécute-le en direct et regarde les nombres défiler » est tout l'intérêt du bidouilleur. `uv add matplotlib` couvre la seule dépendance non-stdlib.

**GitHub Codespaces** exécute le script identique : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et exécute-le dans un onglet de navigateur, avec `history.csv` et `dashboard.png` visibles dans l'arborescence.

**Google Colab, les Notebooks Kaggle et Binder exécutent le pipeline honnêtement** — le hub est de la pure simulation et du calcul sans NumPy, et Matplotlib rend le graphique *en ligne* dans le notebook, donc `dashboard.png` devient une sortie de cellule en direct plutôt qu'un fichier. La seule chose qu'un notebook ne peut pas faire est de défiler en *temps d'horloge réel* comme le fait une boucle locale — mais la simulation est sous ton contrôle, donc « 1 seconde par tick » et « avance rapide de 100 ticks » fonctionnent tous deux, et c'est la place honnête où le notebook brille vraiment (tu obtiens tout le flux plus les graphiques dans un seul artefact).

[![Ouvrir dans Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sensor-hub/notebook.ipynb)
[![Ouvrir dans Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sensor-hub/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsensor-hub%2Fnotebook.ipynb)

## Configuration

Python plus Matplotlib, et aucun matériel.

### Installe `uv` et Matplotlib

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis :

```bash
uv --version
mkdir sensor-hub && cd sensor-hub
uv init --bare
uv add matplotlib
```

### Le simulateur de capteurs

Crée `sensors.py` — la pièce qui remplace le matériel physique :

```python
# sensors.py
import random

class Sensor:
    def __init__(self, name, base, noise, unit, low=None, high=None):
        self.name, self.base, self.noise = name, base, noise
        self.unit, self.low, self.high = unit, low, high

    def read(self):
        value = self.base + random.gauss(0, self.noise)
        return round(value, 1), self.unit, self.low, self.high

def make_registry():
    return [
        Sensor("thermostat", base=21.4, noise=0.5, unit="C", low=15, high=26),
        Sensor("humidity", base=43.0, noise=2.0, unit="%", low=20, high=70),
        Sensor("motion", base=0.0, noise=0.0, unit="bool", low=None, high=None),
    ]
```

`Sensor.read()` enveloppe la physique dans un objet : un nom, une valeur *base* au repos, un sigma de *noise*, une unité, et une plage sûre *low/high* optionnelle. `random.gauss(base, noise)` est le remplaçant honnête des vibrations d'un capteur — la température oscille autour de 21,4, l'humidité autour de 43, et le mouvement est un cas spécial (un détecteur binaire que tu fausseras dans un moment à la main). `low/high=None` exprime « ce capteur n'a pas de seuil » — le mouvement est, ou n'est pas, en mouvement.

**✅ Liste de vérification**

- ✅ `uv --version` affiche une version ; `matplotlib` installée via `uv add`.
- ✅ `sensors.py` s'importe et `make_registry()` retourne les trois capteurs.
- ✅ Tu peux expliquer pourquoi `random.gauss` modélise un vrai capteur (les vibrations autour d'une vraie valeur) mieux qu'un nombre fixe.

## Étape 1 : Simule une boucle de tick

Le cœur de tout hub est la *boucle d'échantillonnage* : à chaque tick, demande à chaque capteur sa lecture actuelle, et collecte tout le lot comme une seule ligne horodatée. Cette étape exécute un nombre fixe de ticks et les imprime avec des horodatages — le flux brut qu'une vraie passerelle pousserait.

**👟 Indice de départ :** Commence par écrire `sample()` qui horodate une heure UTC, boucle sur `make_registry()` en appelant le `.read()` de chaque capteur, et retourne une ligne dict avec `ts`, `source`, et une valeur plus une colonne `_unit` par capteur — puis imprime cinq ticks.

```python
# hub.py
from datetime import datetime, timezone
import os
from sensors import make_registry

SENSORS = make_registry()

def sample(force: dict = None) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    reading = {"ts": now, "source": "sim"}
    for s in SENSORS:
        value, unit, lo, hi = s.read()
        reading[s.name] = value
        reading[f"{s.name}_unit"] = unit
    if force:
        reading.update(force)
    return reading

for tick in range(5):
    print(sample())
```

`sample` construit une ligne de hub : un horodatage UTC, `source: "sim"` (pour que tu saches quelles lignes viennent de données simulées contre injectées), et une colonne par capteur plus son unité. Le dict `force` est la trappe d'injection — il te permet de *surcharger* une lecture (disons, mettre `motion=1` ou pousser `thermostat=28`) pour tester les seuils sans attendre qu'une marche aléatoire en dépasse un. Ce paramètre unique est pourquoi le hub est testable : tu peux déclencher de force une alerte à la demande au lieu d'espérer que le générateur de nombres aléatoires coopère.

**🎯 Résultat attendu :** Cinq lignes dict horodatées, chacune avec `ts`, `source`, `thermostat` (~21±0,5), `humidity` (~43±2), `motion` (0), et les colonnes `_unit`.

**🩹 Si ça ne marche pas :** Si les cinq thermostats sont identiques, `random.gauss` n'est pas appelé ou `SENSORS` a été figé avec la même graine de bruit — une instance `Sensors` fraîche est bien ; une `base` en cache signifie que tu as attrapé `base` au lieu de `read()`. Si les horodatages sont tous égaux, `timespec="seconds"` a peut-être tronqué plus vite que la boucle ne s'est exécutée — utilise `timespec="milliseconds"` pour voir l'étalement. Si `force` ne change jamais la sortie, tu as passé `force` avant la boucle de capteurs donc ses surcharges ont été écrasées — applique `force` *après* la boucle, comme écrit.

**✅ Liste de vérification**

- ✅ Cinq lignes distinctes, thermostats vibrant autour de 21,4, humidité autour de 43.
- ✅ `motion` est 0 avec l'unité `bool` ; la trappe `force` surcharge à la demande.
- ✅ Les horodatages diffèrent par tick à la précision de la milliseconde.

**🤔 Question(s) socratique(s)**

- La trappe `force` est délibérément séparée de la boucle de lecture. Si tu avais fusionné une surcharge *dans* `Sensor.read()`, quel superpouvoir de test perdrais-tu — et quel est le risque une fois que tu l'as acheté (un test qui passe parce qu'il a injecté `thermostat=28` pendant qu'une vraie exécution ne dépasse jamais 24) ?
- Le temps est enregistré en UTC, pas en local. Pourquoi un hub *insiste*-t-il sur l'UTC même dans une démo à une seule pièce — et à quel moment une colonne d'heure locale devient-elle un bug de correction (changement d'heure, une pièce dans un autre fuseau, un graphique analysé par un CDN) ?

## Étape 2 : Agrège en un journal normalisé

Les capteurs ne s'accordent pas sur la disposition des colonnes ; le travail du hub est de faire un *unique* journal de séries temporelles normalisé à partir de lectures hétérogènes. Cette étape transforme les dicts bruts de l'Étape 1 en une seule liste de lignes avec une forme fixe `(ts, sensor, value, unit)` — la forme que tu pourras ensuite pivoter, surveiller par alertes et tracer. Le remodelage est trivial ; la discipline (renommer vers un schéma canonique d'emblée) est ce qui empêche chaque étape ultérieure de re-parse.

**👟 Indice de départ :** Commence par écrire `normalize(row)` qui pivote une ligne de hub large en un dict étroit par capteur avec la forme fixe `ts, sensor, value, unit`, puis imprime quelques ticks normalisés.

```python
# hub.py (suite)

def normalize(row: dict) -> list[dict]:
    sensor_cols = [s.name for s in SENSORS]          # the numeric reading columns
    out = []
    for name in sensor_cols:
        out.append({
            "ts": row["ts"],
            "sensor": name,
            "value": row[name],
            "unit": row[f"{name}_unit"],
        })
    return out

for row in (sample(force={"thermostat": 21.4}) for _ in range(3)):
    for entry in normalize(row):
        print(f"{entry['ts'][11:]}  {entry['sensor']:<9} {entry['value']:>6} {entry['unit']}")
```

`normalize` est un pivot classique *long-vs-large* : la ligne de hub large (`thermostat`, `humidity`, `motion` comme colonnes) devient une ligne *étroite* par capteur (`sensor`, `value`, `unit`). C'est le format « long » canonique des séries temporelles — une observation par ligne — parce que c'est la forme que `pandas` pivote, que Matplotlib trace et que les seuils évaluent sans aucune ramification `if` par capteur. La colonne de nom `sensor` est la clé étrangère qui joint chaque opération future à quel appareil a produit la lecture.

**🎯 Résultat attendu :** Neuf lignes (3 ticks × 3 capteurs), chacune `HH:MM:SS  sensor  value  unit`, avec une ligne par capteur — thermostats en °C, humidité en %, mouvement en `bool`.

**🩹 Si ça ne marche pas :** Si une `KeyError` nomme `thermostat_unit`, la ligne large a été construite avant que la colonne `_unit` n'existe — tu as normalisé un dict qui n'a jamais rempli les unités (crée les unités dans `sample`, avant `normalize`). Si le mouvement apparaît avec un `float` 0.0 au lieu de `bool`, la colonne d'unité disait `bool` mais la valeur n'a pas été convertie — encode le mouvement comme `int(motion)` dans `sample`. Si l'*ordre* des lignes semble faux, trie par `(ts, sensor)` pour la reproductibilité.

**✅ Liste de vérification**

- ✅ Chaque ligne de hub devient exactement `len(SENSORS)` entrées normalisées.
- ✅ Le schéma étroit est `ts, sensor, value, unit` — une observation par ligne.
- ✅ Aucun `if` par capteur n'est nécessaire pour connaître l'unité d'une ligne ; la colonne `unit` la porte.

**🤔 Question(s) socratique(s)**

- Large-vers-long est le mouvement « canonicaliser une fois ». Qu'est-ce qui casse *plus tard* si tu le sautes et que tu gardes les colonnes `thermostat`, `humidity`, `motion` avec un `if name == "thermostat"` codé en dur dans ta logique d'alerte ? Nomme le futur capteur qui fait s'effondrer cette chaîne de `if`.
- `normalize` code en dur `sensor_cols` en itérant `SENSORS`. Si un nouveau type de capteur est ajouté au registre, `normalize` continue-t-il de fonctionner sans modifications — et pourquoi cette propriété (des colonnes pilotées par les données, pas codées en dur) est-elle le vrai test du « hub » ?

## Étape 3 : Alertes par seuil

Un hub qui se contente de stocker est un journal ; la partie *hub* est de décider que quelque chose est arrivé. L'alerte par seuil compare chaque lecture à la plage sûre `low/high` de son capteur et enregistre une ligne d'alerte quand elle tombe à l'extérieur. La trappe `force` de l'Étape 1 rend cela *testable* — tu déclenches une alerte de façon déterministe au lieu d'attendre le hasard.

**👟 Indice de départ :** Commence par écrire `ingest(row)` qui normalise la ligne, cherche le `low`/`high` de chaque capteur dans le registre, et ajoute une alerte `out_of_range` quand une valeur tombe à l'extérieur — puis force un pic avec `sample(force={"thermostat": 29.0})`.

```python
# hub.py (suite)

ALERTS = []

def ingest(row: dict) -> None:
    for entry in normalize(row):
        lo, hi = None, None
        for s in SENSORS:
            if s.name == entry["sensor"]:
                lo, hi = s.low, s.high
                break
        value = entry["value"]
        if (hi is not None and value > hi) or (lo is not None and value < lo):
            ALERTS.append({**entry, "event": "out_of_range"})
            print(f"ALERT {entry['sensor']}: {value}{entry['unit']} outside {lo}-{hi}")

# force a thermometer spike and a normal tick
ingest(sample(force={"thermostat": 29.0}))
ingest(sample())
print("alerts:", len(ALERTS))
```

`ingest` est le pipeline lire-et-réagir : normalise la ligne, cherche la plage de seuil de ce capteur, et ajoute une alerte (avec l'étiquette d'événement `out_of_range`) quand la valeur franchit. Parce que les thermostats sont sûrs à `low=15, high=26`, forcer 29.0 déclenche l'alerte ; le tick silencieux après ne le fait pas. L'étalement `{**entry, "event": ...}` copie la lecture *et* ajoute le marqueur d'alerte, donc une ligne d'alerte porte toutes les mêmes colonnes plus une raison — exactement ce que tu voudrais dans un journal que tu audites plus tard.

**🎯 Résultat attendu :** Une seule ligne `ALERT thermostat: 29.0C outside 15.0-26.0` pour le pic forcé, `alerts: 1`, et une ligne silencieuse pour le tick normal.

**🩹 Si ça ne marche pas :** Si le pic forcé *n'alerte pas*, `force` a frappé la mauvaise colonne ou le `high` de `SENSORS` est `None` — imprime `make_registry()` et confirme `high=26`. Si *chaque* tick alerte, la recherche de seuil compare au mauvais capteur (un échec `s.name == entry["sensor"]` par défaut à `None` signifie « pas de seuil », donc un bug `None is not None` alerterait sur tout) — vérifie que la branche de correspondance se résout. Si le tick silencieux a *aussi* piqué par chance, c'est du hasard honnête — relance avec un bruit plus bas ; le test du chemin forcé est ce sur quoi tu t'appuies.

**✅ Liste de vérification**

- ✅ Le `thermostat=29.0` forcé déclenche exactement une alerte avec `event="out_of_range"`.
- ✅ Un tick normal produit zéro alerte.
- ✅ Le dépassement (valeur > high) et la sous-passe (valeur < low) sont tous deux couverts par la vérification de plage.

**🤔 Question(s) socratique(s)**

- Les alertes vivent dans une liste Python (`ALERTS`) qui meurt quand le processus sort. Quel est l'argument de *persistance* pour écrire chaque alerte sur disque immédiatement, et le contre-argument de *latence* (une écriture disque par alerte contre le regroupement par lots) quand un minuscule hub embarqué ne doit pas bloquer la boucle de lecture ?
- La condition d'alerte `value > high` traite deux lectures de capteurs d'un pic *transitoire* comme un haut *soutenu*. À quoi ressemblerait un « anti-rebond » (exiger N ticks consécutifs dans la plage avant le silence) et pourquoi un seuil brut est-il bruité pour les capteurs binaires de type mouvement ?

## Étape 4 : Persiste l'historique et la piste d'alertes

Un hub en direct n'est utile que pendant que tu le regardes ; une couche de *stockage* en fait un enregistrement historique que tu peux ré-analyser a posteriori. Cette étape ajoute les lignes normalisées de chaque tick à `history.csv` et chaque alerte à `alerts.csv`, cadrant le CSV comme le choix honnête sans base de données pour une petite série temporelle.

**👟 Indice de départ :** Commence par écrire `append_rows(path, rows)` qui écrit l'en-tête une fois (`if not path.exists()`) puis ajoute avec `csv.DictWriter` en mode `"a"`, puis branche-la dans `run_ticks(n)`.

```python
# hub.py (suite)
import csv
from pathlib import Path

HIST = Path("history.csv")
ALERT_LOG = Path("alerts.csv")

def append_rows(path: Path, rows: list[dict]) -> None:
    if not rows:
        return
    if not path.exists():
        path.write_text(",".join(rows[0].keys()) + "\n")   # header once
    with path.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writerows(rows)

def run_ticks(n: int) -> None:
    for _ in range(n):
        row = sample()
        ingest(row)                       # alerts land on ALERTS + stdout
        append_rows(HIST, normalize(row))
        append_rows(ALERT_LOG, ALERTS)
        ALERTS.clear()

run_ticks(50)
print("history rows:", sum(1 for _ in open(HIST)) - 1)
print("alert rows  :", sum(1 for _ in open(ALERT_LOG)) - 1 if ALERT_LOG.exists() else 0)
```

`append_rows` écrit l'en-tête *une fois* (`if not path.exists()`), puis ajoute avec `csv.DictWriter` — le motif « écris une fois, ajoute pour toujours » qui garde une série temporelle croissante bon marché. `run_ticks(50)` est tout le hub sous un seul toit : échantillonne → ingère (qui ajoute les alertes dans le processus) → persiste l'historique et le lot d'alertes actuel → vide le tampon par tick. Sur 50 ticks × 3 capteurs tu obtiens ~150 lignes d'historique et (sauf si une marche aléatoire a piqué) 0 ligne d'alerte ; forcer un pic avant ajouterait des alertes à un vrai `alerts.csv`.

**🎯 Résultat attendu :** `history.csv` avec un en-tête + ~150 lignes (~50 ticks × 3 capteurs), `alerts.csv` avec un en-tête + autant d'alertes qui ont tourné ; les lignes de comptage impriment les comptes de lignes.

**🩹 Si ça ne marche pas :** Si l'en-tête est écrit à *chaque* ajout, `path.exists()` a été vérifié après l'écriture ou le fichier est ouvert en mode `w` (tronquer) — l'écriture `if not path.exists()` doit précéder l'ajout en mode `a`. Si `writerows` lève une `ValueError` sur une clé manquante, les dicts normalisés manquent un des `fieldnames` — le schéma `sensor`/`value`/`unit` a dérivé de `normalize` ; aligne-les. Si `alerts.csv` est vide après un pic forcé, `append_rows(ALERT_LOG, ALERTS)` a tourné avant que le pic soit ingéré — ordonne les appels `ingest` puis `append`.

**✅ Liste de vérification**

- ✅ `history.csv` détient exactement 1 + 3*n lignes de ticks avec un unique en-tête.
- ✅ `alerts.csv` a une ligne d'en-tête et une ligne par alerte via le test par `force`.
- ✅ Relancer `run_ticks(50)` *ajoute* plutôt que de tronquer les CSV.

**🤔 Question(s) socratique(s)**

- L'écriture de l'en-tête-une-fois est l'équivalent CSV d'une migration de schéma. Si la liste de colonnes d'un capteur change *à mi-fichier* (disons qu'un quatrième capteur est ajouté), qu'arrive-t-il aux colonnes des lignes existantes — et quel comportement de `DictWriter` masque ou expose cette dérive ?
- Le CSV est ami de l'ajout mais n'a pas de transactions — un plantage entre les `writerows` pour l'historique et pour les alertes laisse les deux fichiers désynchronisés. Pour un hub qui doit tolérer la coupure d'alimentation, quelle est l'alternative *atomique* (écris les deux dans un temp, renomme) qu'une couche de stockage à un seul fichier fournit gratuitement ?

## Étape 5 : Trace l'historique

Les nombres dans un CSV sont la matière première ; le *tableau de bord* est le produit qu'une personne lit réellement. Cette étape charge `history.csv` dans Matplotlib et dessine deux sous-tracés de séries temporelles — la température et l'humidité sur leurs seuils — transformant « est-ce que la pièce chauffe ? » en un coup d'œil.

**👟 Indice de départ :** Commence par régler `matplotlib.use("Agg")` d'abord, puis écris `chart()` pour lire `history.csv` avec `csv.DictReader`, grouper les lignes par capteur, et tracer les flux thermostat et humidité avec des clôtures de seuil `axhline` avant `plt.savefig(out)`.

```python
# hub.py (suite)
import matplotlib
matplotlib.use("Agg")                       # headless: save PNG, no window
import matplotlib.pyplot as plt
import csv

def chart(path: Path = HIST, out: str = "dashboard.png") -> None:
    rows = list(csv.DictReader(open(path)))
    by = {}
    for r in rows:
        by.setdefault(r["sensor"], []).append((r["ts"], float(r["value"])))
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8, 6), sharex=True)
    th = by.get("thermostat", [])
    hu = by.get("humidity", [])
    ax1.plot([t for t, _ in th], [v for _, v in th]  if th else [], marker="o", label="thermostat")
    ax2.plot([t for t, _ in hu], [v for _, v in hu]  if hu else [], marker="o", label="humidity")
    ax1.axhline(26, color="r", ls="--"); ax1.axhline(15, color="r", ls="--")
    ax2.axhline(70, color="r", ls="--"); ax2.axhline(20, color="r", ls="--")
    ax1.set_ylabel("°C"); ax2.set_ylabel("%")
    ax2.set_xlabel("time"); ax2.tick_params(axis="x", rotation=30)
    for ax in (ax1, ax2):
        ax.legend(); ax.grid(alpha=0.3)
    plt.tight_layout(); plt.savefig(out)
    print("wrote", out)

chart()
```

`matplotlib.use("Agg")` force un backend sans affichage — pas de fenêtre, juste un `dashboard.png` sauvegardé — ce qui fait de ce script un rapport *à la cron* plutôt qu'un outil interactif. Le code est délibérément explicite (`.setdefault` groupe par capteur ; `axhline` dessine les clôtures de plage sûre ; les heures sont des chaînes ISO brutes donc Matplotlib les traite comme des étiquettes). Les clôtures sont le message du tableau de bord : les lectures qui bondissent et franchissent la ligne pointillée rouge sont ce qu'un humain veut remarquer, et 50 ticks simulés sous `high` ne la franchiront pas la plupart du temps — mais un pic forcé le ferait.

**🎯 Résultat attendu :** `dashboard.png` écrit (sauvegardé, pas de popup) — deux sous-tracés : thermostat °C dans le temps avec des clôtures rouges à 15/26, humidité % à 20/70, tous deux vibrant autour de leurs bases.

**🩹 Si ça ne marche pas :** Si `plt.savefig` lève une `RuntimeError` à propos du backend, `Agg` n'a pas pris effet avant qu'une figure soit créée — règle-le comme le *premier* appel matplotlib (avant que `pyplot` soit utilisé). Si l'axe x est vide ou tourné bizarrement, les horodatages ISO se rendent comme des chaînes — cast `ts` vers `datetime.strptime` ou laisse les étiquettes de chaîne tenir ; pour un graphique vibrant de 50 points, les étiquettes de chaîne sont honnêtes. Si un sous-tracé est vide, `by.get("sensor")` a retourné `[]` pour un capteur manquant — confirme que le CSV contient réellement une colonne `humidity`.

**✅ Liste de vérification**

- ✅ `dashboard.png` existe et montre les deux sous-tracés avec des seuils rouges clairs.
- ✅ Le graphique se rend sans affichage (`Agg`) — aucune fenêtre ne bloque une exécution de script.
- ✅ Relire le fichier pilote le graphique, donc relancer après plus de ticks montre la tendance mise à jour.

**🤔 Question(s) socratique(s)**

- `sharex=True` force le même axe x sur les deux sous-tracés. Quand les dynamiques des deux flux de capteurs sont très différentes (la température rampe, le mouvement pique), qu'est-ce que partager l'axe *cache* sur le flux le plus bruité — et quand des axes indépendants raconteraient-ils l'histoire honnête mieux ?
- Un tableau de bord montre un jour de données, et un pic franchissant la clôture est évident. Quel est le signal *surprenant* qu'un graphique en ligne brut *ne peut pas* montrer mais qu'une *moyenne* glissante (moyenner les N derniers ticks) révèle de façon fiable — et quel est le coût de latence d'un lissage qui cache un pic rapide ?

## ⚠️ Pièges courants

- **Capteur aléatoire ≠ test déterministe.** `random.gauss` rend les relectures non reproductibles. Affirme les alertes via la trappe `force` (`sample(force={"thermostat": 29.0})`), jamais en espérant qu'une marche aléatoire franchisse un seuil dans les premiers 50 ticks.
- **Des lignes larges pour toujours.** Garder `thermostat`, `humidity`, `motion` comme colonnes et `if name == ...` par capteur signifie qu'ajouter un capteur veut dire éditer la boucle. Normalise vers `(ts, sensor, value, unit)` une fois et laisse les données piloter la logique.
- **Réécrire l'en-tête à chaque ajout.** Ouvrir en mode `w` tronque l'historique. Utilise l'ajout `a` et n'écris l'en-tête que quand le fichier n'existe pas encore — l'invariant d'un seul en-tête est ce qui garde les parses `csv.DictReader` ultérieures cohérentes.
- **Sauter le backend sans affichage.** Un `savefig` qui ouvre une fenêtre bloque la boucle sur une interface graphique que tu n'as peut-être pas. `matplotlib.use("Agg")` *d'abord* transforme le graphique en un fichier sans effet de bord que le hub peut émettre selon un calendrier.
- **Oublier l'ordre de `force`.** Passer `force` dans `sample` *avant* la boucle de capteurs signifie que la boucle écrase ta surcharge. Applique `force` *après* les lectures pour que l'injection atterrisse réellement.

## Ce que tu viens de construire

Un hub de capteurs IoT honnête : tu as modélisé trois types de capteurs, les as simulés sur une boucle de tick configurable, normalisé des lectures hétérogènes en un journal de séries temporelles unifié, déclenché des alertes de seuil avec une trappe d'injection, persisté l'historique et les alertes en CSV, et tracé le résultat avec un tableau de bord Matplotlib sans affichage. Les idées transférables dépassent le mock : le motif d'injection `force` est comment tu rends un système vivant *testable* ; la normalisation large-vers-long est la discipline de schéma que tout outil en aval attend ; et les habitudes « un en-tête, ajoute pour toujours, rends sans affichage » sont la différence entre un script de secours et un tableau de bord sur lequel un surveillant de pièce peut réellement compter.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/sensor-hub/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/sensor-hub) dans le dépôt du cours regroupe le module hub, le registre de capteurs, et un notebook qui défile, ingère, persiste et trace en ligne (le graphique se rend comme une sortie de cellule). Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et regarde la pièce chauffer à l'écran.
:::

## Où aller à partir d'ici

- **Du vrai MQTT (optionnel) :** installe `paho-mqtt` et remplace la simulation `sample()` par un gestionnaire `client.on_message` — la logique du hub reste la même ; seule la « source » passe de `sim` à `mqtt`, ce qui est l'échange exact que la conception anticipait.
- **Un rapport `dashboard` selon un calendrier :** enveloppe `run_ticks(60)` + `chart()` dans une boucle `while True: sleep(60)` (ou une ligne cron) pour qu'un surveillant de pièce émette un PNG frais chaque minute.
- **La détection d'anomalies (stretch) :** au lieu de seuils durs, calcule une moyenne/écart-type glissante et alerte quand une lecture dérive `> 3σ` de la fenêtre récente — le signal « surprenant » de l'accroche socratique de l'Étape 5.
- **Un registre de plugins :** transforme `make_registry` en API `register(name, reader)` pour que les nouveaux types de capteurs s'ajoutent eux-mêmes sans éditer `SENSORS` — la leçon des colonnes pilotées par les données, promue en architecture.

## Partage ton projet avec la classe

Tu as surveillé une pièce (simulée), attrapé un pic forcé, ou câblé un graphique que tu aimes ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README parcourt l'ajout du tien via une **pull request** du début à la fin : forker, créer une branche, commiter et ouvrir la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓