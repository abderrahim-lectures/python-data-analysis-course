---
id: habit-streak-visualizer
title: "Construire un Visualiseur de Séries d'Habitudes"
sidebar_label: "Visualiseur de Séries d'Habitudes"
slug: /projects/habit-streak-visualizer
description: "Suis les pointages quotidiens d'habitudes en local et affiche une carte de chaleur calendaire façon graphe de contributions GitHub, avec pandas et matplotlib — pas de ML, pas de clé API."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Visualiseur de Séries d'Habitudes

<ProjectPublishedDate projectId="2027-habit-streak-visualizer" />

<ProjectGreeting />

Ce projet suppose que tu es à l'aise avec Python 101 — variables, fonctions, lecture et écriture de fichiers, boucles basiques. Un peu de pandas et matplotlib de Analyse de Données (`DataFrame`s, `.groupby()`, tracer un graphique simple) rendra quelques étapes familières, mais rien ici n'a besoin de plus que ça : pas de machine learning, pas d'API externe, et aucun jeu de données à télécharger. Tu apportes tes propres données, un jour à la fois.

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Concevoir un format simple de journal de pointage (un CSV : date, habitude, fait) et écrire un CLI pour y ajouter.
2. Calculer la série en cours et la plus longue série d'une habitude à partir de ce journal.
3. Disposer une plage de jours dans une grille façon graphe de contributions GitHub : sept lignes de jour de semaine sur autant de colonnes de semaine que la plage l'exige.
4. Afficher cette grille comme une carte de chaleur matplotlib, colorée selon la durée de la série qui se construisait chaque jour, en utilisant plusieurs mois de données d'exemple d'apparence réelle pour que l'image soit vraiment intéressante à regarder.

## Où exécuter ceci

Trois façons raisonnables de faire ce projet — choisis celle qui convient à ta configuration :

- **En local avec `uv` (recommandé).** Ce projet a zéro dépendance externe au-delà de `pandas` et `matplotlib`, pas de clé API, pas de GPU — à peu près aussi sans friction qu'un « vrai projet Python sur ta propre machine » peut l'être. Les Étapes 1–4 ci-dessous supposent ce chemin, et ton journal de pointage vit comme un simple fichier CSV auquel tu continues d'ajouter au fil du temps.
- **GitHub Codespaces.** Ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) pour obtenir un environnement de développement cloud avec Node, Python, et `uv` déjà installés (voir [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)) — exactement les mêmes commandes ci-dessous fonctionnent depuis un onglet de navigateur, sans aucune installation locale.
- **Google Colab, Kaggle Notebooks, ou Binder.** Un choix authentiquement bon : rien ici n'a besoin d'un GPU ou d'une clé API, et tout le pipeline (charger un journal, calculer les séries, construire une grille, afficher une carte de chaleur) tient confortablement en quelques cellules de notebook contre les données d'exemple fournies par le cours.

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fhabit-streak-visualizer%2Fnotebook.ipynb)

  Sois honnête avec toi-même sur le compromis, cependant : un notebook est une façon de moindre fidélité de vivre ce projet qu'un vrai projet `uv` local avec son propre `checkins.csv` auquel tu ajoutes jour après jour — traite-le comme une façon rapide d'explorer le code, pas le chemin principal.

## Configuration

`uv` est un seul outil qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets » — il peut installer et gérer les versions de Python lui-même, en plus des dépendances de ton projet.

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

Puis configure le projet :

```bash
uv init habit-streak-visualizer
cd habit-streak-visualizer
uv add pandas matplotlib
```

Aucune clé API nécessaire nulle part dans ce projet — tout tourne sur des données qui vivent entièrement sur ta propre machine.

## Étape 1 : Conçois le journal de pointage et un CLI pour l'écrire

Le journal est un CSV simple avec trois colonnes : `date`, `habit`, `done`. Une ligne par pointage. Un fichier plat comme celui-ci — plutôt que, disons, un fichier séparé par habitude — signifie que plusieurs habitudes peuvent partager un journal et pouvoir quand même être filtrées indépendamment avec l'indexation booléenne ordinaire de pandas plus tard.

```python
# log.py
import csv
from pathlib import Path

COLUMNS = ["date", "habit", "done"]

def ensure_log(path: Path) -> None:
    if not path.exists():
        with path.open("w", newline="") as f:
            csv.writer(f).writerow(COLUMNS)

def append_checkin(path: Path, date: str, habit: str, done: bool) -> None:
    ensure_log(path)
    with path.open("a", newline="") as f:
        csv.writer(f).writerow([date, habit, "y" if done else "n"])
```

Un petit CLI enveloppe ça avec l'interaction « l'as-tu fait aujourd'hui ? y/n » :

```python
# checkin.py
import argparse
import datetime as dt
from pathlib import Path
from log import append_checkin

LOG_PATH = Path(__file__).parent / "checkins.csv"

parser = argparse.ArgumentParser()
parser.add_argument("habit")
parser.add_argument("--date", default=None)
parser.add_argument("--done", choices=["y", "n"], default=None)
args = parser.parse_args()

date = args.date or dt.date.today().isoformat()
answer = args.done or input(f"Did you do '{args.habit}' on {date}? (y/n): ").strip().lower()
append_checkin(LOG_PATH, date, args.habit, answer.startswith("y"))
print(f"Logged: {date} — {args.habit} — {'done' if answer.startswith('y') else 'missed'}")
```

```bash
uv run python checkin.py "Exercise"
```

Exécute ça une poignée de fois avec `--date`/`--done` pour différents jours pour accumuler un peu d'historique à tester, avant de continuer.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Exécuter `checkin.py` deux fois pour la même habitude et date, une fois « y » et une fois « n », laisse le journal avec les deux lignes — tu devras décider (étape suivante) laquelle l'emporte.</StepChecklistItem>
<StepChecklistItem>Ouvrir `checkins.csv` dans un éditeur de texte montre exactement trois colonnes, une ligne par pointage, lisible par un humain.</StepChecklistItem>
<StepChecklistItem>Tu peux enregistrer un pointage pour une date passée avec `--date` et `--done`, sans le prompt interactif.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Si tu enregistres la même habitude deux fois pour la même date (une fois par erreur, une fois pour la corriger), le journal devrait-il garder les deux lignes, écraser la première, ou autre chose ? Qu'est-ce que chaque choix ferait à un `.groupby("date")` ultérieur sur ce fichier ?

## Étape 2 : Calcule les séries

Une série est une suite de *jours calendaires consécutifs* enregistrés comme faits, sans trou. La décision de conception importante : un jour jamais enregistré du tout est traité exactement comme un jour explicitement enregistré « n » — les deux cassent la série. C'est plus simple qu'ajouter un troisième état « inconnu », au prix de punir l'oubli d'enregistrer de la même façon que réellement sauter l'habitude.

Lire un journal épars (seulement les jours que quelqu'un a pris la peine d'enregistrer) doit devenir une série *dense* jour par jour avant que les séries aient un sens — sinon un trou dans le journal ressemble identiquement à une vraie coupure, mais tu ne peux pas savoir quel jour c'est arrivé sans un calendrier complet pour vérifier :

```python
import pandas as pd

df = pd.read_csv("checkins.csv", parse_dates=["date"])
df["done"] = df["done"].astype(str).str.lower().isin(["y", "yes", "true", "1"])
df = df.drop_duplicates(subset=["date", "habit"], keep="last")  # last logged answer wins

habit_df = df[df["habit"] == "Exercise"].set_index("date")["done"]
daily = habit_df.reindex(pd.date_range(df["date"].min(), df["date"].max(), freq="D"), fill_value=False)
```

`reindex` fait le vrai travail ici : elle prend une `Series` avec seulement les dates réellement présentes et l'étend sur *chaque* date de la plage, remplissant tout ce qui manque avec `False`. Maintenant les séries sont un simple parcours séquentiel :

```python
def compute_streaks(daily: pd.Series) -> dict:
    longest = 0
    current_run = 0
    for i, done in enumerate(daily):
        current_run = current_run + 1 if done else 0
        longest = max(longest, current_run)
        if i == len(daily) - 1:
            streak_ending_at_last_day = current_run
    return {
        "current_streak": streak_ending_at_last_day,
        "longest_streak": longest,
        "total_done": int(daily.sum()),
        "total_days": len(daily),
    }
```

`current_streak` est la série se terminant le *dernier* jour de la série (aujourd'hui, si ton journal est à jour) — elle se remet à 0 dès que tu vérifies le jour après une omission. `longest_streak` est la meilleure série n'importe où dans tout l'historique, qui peut évidemment être bien plus grande, et ne rétrécit jamais.

:::tip[`current_streak` a besoin d'un journal à jour pour signifier quelque chose]
Si tu n'as pas encore pointé aujourd'hui, le dernier jour de `daily` est `False` par défaut (du remplissage de `reindex`), donc `current_streak` rapporte 0 même si hier a prolongé une vraie série. Soit pointe chaque jour avant de vérifier ta série, soit calcule `current_streak` contre hier plutôt que « la dernière ligne de la série » si tu veux qu'elle tolère qu'aujourd'hui ne soit pas encore pointé.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`daily.index` contient chaque jour calendaire entre ta première et dernière entrée de journal, sans trous — `len(daily)` correspond exactement à ce compte de jours.</StepChecklistItem>
<StepChecklistItem>Compter manuellement une série connue de jours « y » consécutifs dans ton journal de test correspond à ce que `compute_streaks` rapporte pour `longest_streak`.</StepChecklistItem>
<StepChecklistItem>Enregistrer un « n » (ou sauter un jour) remet `current_streak` à 0 la prochaine fois que tu le calcules.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Pourquoi `daily = habit_df.reindex(...)` doit-il se produire *avant* la boucle de comptage de séries, plutôt que de simplement boucler sur les lignes de `df` directement ? Qu'est-ce qui irait spécifiquement mal avec `longest_streak` si tu le sautais ?

## Étape 3 : Dispose les jours dans une grille façon GitHub

C'est le vrai moment pédagogique du projet. Un graphe de contributions GitHub est une grille : sept lignes (une par jour de semaine) sur autant de colonnes qu'une année en a besoin (environ 52-53), lues de haut en bas puis de gauche à droite. Transformer une simple liste de dates en cette disposition 2D nécessite deux morceaux d'arithmétique de dates :

**La ligne** est juste le jour de la semaine : `date.weekday()` retourne 0 pour lundi jusqu'à 6 pour dimanche, directement utilisable comme index de ligne.

**La colonne** est la partie délicate. Le raccourci tentant est `date.isocalendar()[1]`, le numéro de semaine ISO — mais les numéros de semaine ISO se remettent à 1 chaque janvier. Un journal d'habitude qui s'étend sur une frontière d'année (disons, décembre à janvier) aurait des dates de fin décembre et début janvier tombant dans les *mêmes numéros de semaine bas*, brouillant la grille en colonnes qui se chevauchent au lieu d'une chronologie propre de gauche à droite. La solution : choisis une date d'ancrage fixe — le lundi le ou avant le tout premier jour enregistré — et calcule chaque colonne comme un simple décalage en jours depuis cet ancrage :

```python
import numpy as np

def build_grid(daily: pd.Series):
    dates = daily.index
    anchor = dates[0] - pd.Timedelta(days=dates[0].weekday())  # Monday on/before the first day
    weeks = (dates - anchor).days // 7
    rows = dates.weekday

    num_weeks = int(weeks.max()) + 1
    grid = np.full((7, num_weeks), np.nan)
    for row, week, done in zip(rows, weeks, daily):
        grid[row, week] = 1.0 if done else 0.0

    return grid, dates
```

`(dates - anchor).days // 7` ne fait qu'augmenter — elle se moque que le journal s'étende sur une ou cinq années. Les cellules qui tombent hors de la plage réellement enregistrée (parce que le premier jour enregistré n'est pas nécessairement un lundi, ou le dernier n'est pas nécessairement un dimanche) sont laissées comme `NaN`, pour qu'elles puissent être dessinées différemment d'un vrai jour « manqué » à l'étape suivante.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`grid.shape[0]` vaut exactement 7 (une ligne par jour de semaine), peu importe la longueur de la plage de dates.</StepChecklistItem>
<StepChecklistItem>Donner à `build_grid` une plage de dates qui traverse un 1er janvier ne produit *pas* deux groupes de colonnes à numéros de semaine bas — les colonnes augmentent régulièrement à travers la frontière.</StepChecklistItem>
<StepChecklistItem>Les premières et dernières cellules de la grille (avant le premier jour enregistré, après le dernier) sont `NaN`, pas `0`.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Le propre graphe de contributions de GitHub commence les semaines le dimanche, pas le lundi. Qu'est-ce que tu devrais changer dans `build_grid` pour correspondre à cette convention — et cela changerait-il dans quelle *colonne* tombe une date donnée, dans quelle *ligne*, ou les deux ?

## Étape 4 : Affiche-la comme une carte de chaleur

L'intensité de couleur ne devrait pas être juste binaire (fait/pas fait) — un jour qui est le 15ème d'une série devrait se lire comme visuellement différent du tout premier jour d'une nouvelle série, même si les deux sont « faits ». Calcule l'intensité comme une fonction de la longueur de la série *en cours* à chaque jour, plafonnée pour qu'elle ne continue pas à s'assombrir indéfiniment :

```python
def streak_intensity(daily: pd.Series, cap: int = 10) -> list[float]:
    values, run = [], 0
    for done in daily:
        run = run + 1 if done else 0
        values.append(min(run, cap) / cap if done else 0.0)
    return values
```

Passe ça dans `build_grid` à la place du simple remplissage 0/1, puis affiche avec matplotlib — une rampe séquentielle à une seule teinte (bleu clair à foncé), pas un arc-en-ciel, puisque c'est une magnitude continue unique, pas plusieurs catégories :

```python
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, ListedColormap

sequential_blue = LinearSegmentedColormap.from_list(
    "habit_blue", ["#eaf2fc", "#9ec5f4", "#3987e5", "#0d366b"]
)

fig, ax = plt.subplots(figsize=(max(6, grid.shape[1] * 0.32), 2.4))
display = np.where(np.isnan(grid), 0.0, grid)
ax.imshow(display, cmap=sequential_blue, vmin=0, vmax=1, aspect="equal")

no_data = np.ma.masked_where(~np.isnan(grid), np.ones_like(grid))
ax.imshow(no_data, cmap=ListedColormap(["#e8e8ea"]), aspect="equal")

ax.set_yticks(range(7))
ax.set_yticklabels(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
fig.savefig("habit_heatmap.png", bbox_inches="tight")
```

La version complète — avec des étiquettes de mois le long de l'axe x et des lignes de grille entre les cellules — vit dans [`examples/habit-streak-visualizer/heatmap.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/heatmap.py). Exécute-la contre les données d'exemple fournies (plusieurs mois, deux habitudes, de vraies séries et une vraie baisse) pour voir l'image complète immédiatement, sans rien enregistrer à la main d'abord :

```bash
uv run python visualize.py --habit "Exercise"
```

:::tip[Le gris « pas de données » n'est pas la même chose que le bleu « intensité 0 »]
Dessiner les cellules non enregistrées à l'étape la plus pâle de la même rampe bleue qu'une vraie omission réclamerait visuellement « cette habitude existait et tu l'as sautée » pour des jours avant même que tu aies commencé à suivre. Les peindre d'un gris neutre plat, superposé avec un appel `imshow` séparé et un tableau masqué, garde « pas de données » honnêtement distinct de « données, et la réponse était non ».
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>La carte de chaleur affichée s'assombrit visiblement à travers une vraie série de plusieurs jours dans tes données, plutôt que chaque cellule « faite » se ressemble identiquement.</StepChecklistItem>
<StepChecklistItem>Les cellules hors de ta plage de dates enregistrée s'affichent en gris plat, distinguables au premier coup d'œil d'un jour « manqué » bleu pâle.</StepChecklistItem>
<StepChecklistItem>Exécuter le visualiseur contre les données d'exemple fournies produit une grille reconnaissable comme ayant la forme de contributions GitHub : sept lignes, plusieurs colonnes, un axe de temps clair de gauche à droite.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Si tu suivais deux habitudes et voulais les comparer côte à côte, préférerais-tu voir deux cartes de chaleur séparées empilées verticalement, ou une carte de chaleur où chaque cellule encode *les deux* habitudes d'une certaine façon ? Que perdrais-tu dans les deux cas ?

## ⚠️ Pièges courants

- **Bugs de décalage d'un jour de la semaine/date.** `date.weekday()` est indexé à partir de 0 en commençant le lundi ; `date.isoweekday()` est indexé à partir de 1 en commençant le lundi ; `date.strftime("%w")` est indexé à partir de 0 en commençant le *dimanche*. Confondre ces éléments est la façon la plus facile de finir avec une grille subtilement décalée d'une ligne.
- **Problèmes de fuseau horaire de `datetime.now()`.** Si ton CLI calcule « aujourd'hui » avec `datetime.now()` au lieu de `date.today()`, un pointage enregistré tard le soir peut tomber sur le mauvais jour calendaire selon le fuseau horaire de la machine, particulièrement si tu exécutes un jour le script depuis un fuseau horaire différent (ou un notebook cloud, qui est très probablement en UTC). Reste avec de simples objets `date` pour tout ce qui est censé représenter un jour calendaire plutôt qu'un moment dans le temps.
- **Bugs de frontière d'année dans la disposition de la grille**, couverts à l'Étape 3 — utiliser le numéro de semaine de `isocalendar()` directement comme colonne de grille au lieu d'un décalage en jours à ancrage fixe. Teste ça explicitement avec une plage de dates qui traverse un 1er janvier, puisqu'il est facile d'écrire du code qui semble correct contre une seule année de données d'exemple et ne casse qu'une fois que la plage s'étend sur deux.
- **Oublier `drop_duplicates(..., keep="last")`** en chargeant le journal — si une habitude/date est enregistrée deux fois (une vraie correction, ou une exécution double accidentelle du CLI), laisser les deux lignes signifie qu'un `.groupby()` ou reindex ultérieur peut silencieusement choisir celle qui est arrivée en premier, pas la réponse finale voulue.

## Ce que tu viens de construire

Un petit outil local avec deux vraies pièces séparables : une couche de persistance de données (CSV ajout-seul, dédupliqué au chargement) et une visualisation de grille calendaire à partir de zéro, du genre normalement caché derrière un appel de bibliothèque. Construire la disposition de la grille toi-même — plutôt que d'importer un paquet « carte de chaleur GitHub » tout fait — est ce qui fait vraiment retenir l'arithmétique de dates de l'Étape 3 : la différence entre un numéro de semaine ISO et un décalage en jours à ancrage fixe est un vrai bug que tu rencontrerais dans n'importe quel projet qui dispose des données de séries temporelles sur un calendrier, pas seulement celui-ci.

:::tip[Ce même format de journal s'étend au-delà d'une carte de chaleur]
Rien dans `checkins.csv` n'est spécifique à la carte de chaleur — c'est juste un journal d'événements daté. Le même fichier pourrait alimenter un graphique en barres de taux de complétion hebdomadaire, un résumé mensuel avec `.groupby(df["date"].dt.month)`, ou un simple compte à rebours « combien de jours avant de battre ma plus longue série ». La carte de chaleur est une vue sur des données qui sont utiles sous pas mal d'autres formes aussi.
:::

## Où aller à partir d'ici

- **Plusieurs habitudes côte à côte.** Étends `visualize.py` pour afficher une carte de chaleur par habitude, empilées dans une seule figure avec `plt.subplots(nrows=...)`, pour que tu puisses comparer la cohérence entre habitudes d'un coup d'œil.
- **Une version ASCII terminal uniquement.** Saute complètement matplotlib et affiche la grille comme des blocs Unicode colorés (`░▒▓█` ou des couleurs de fond ANSI) directement dans le terminal — exactement la même logique de disposition de grille de l'Étape 3, juste un rendu différent, et une bonne façon de vérifier ta série sans ouvrir une image.
- **Exporter comme une image partageable.** `fig.savefig(..., dpi=300)` pour un PNG net, ou connecte un petit script qui régénère la carte de chaleur automatiquement après chaque exécution de `checkin.py`, pour qu'il y ait toujours une image à jour prête à partager.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="2027-habit-streak-visualizer" />
