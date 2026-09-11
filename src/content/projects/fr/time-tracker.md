---
title: "Suivi de Temps"
description: "Suivre le temps passé sur les tâches avec rapports, facturation et analytiques de productivité."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["cli", "csv", "productivity"]
learningObjectives:
  - Modéliser une entrée de temps et persister les entrées en CSV
  - "Suivre une session avec des horodatages de début et de fin"
  - Calculer les durées à partir de deux horodatages
  - "Rapporter les totaux quotidiens et hebdomadaires"
  - Résumer le temps passé par tâche
prerequisites:
  - "Les bases de Python (fonctions, listes, dictionnaires)"
  - "Être à l'aise avec les bases de date et datetime"
  - "Facultatif : un peu d'expérience à exécuter des scripts depuis le terminal"
---

# 🛠️ ⏱️ Suivi de Temps

Personne ne sait où va une journée de travail tant qu'on ne l'a pas notée. Ce projet construit un minuscule suivi du temps : démarre une session, travaille, arrête-la, et les minutes atterrissent dans un CSV ; ajoute une entrée manquée à la main, puis tire des rapports quotidiens et hebdomadaires et un résumé des « 3 tâches principales ». C'est uniquement de la bibliothèque standard — dataclasses, `csv` et `datetime` — donc tu apprendras le rythme charger/ajouter/sauvegarder et le vrai calcul d'horodatages, et tu finiras avec un outil pour une réponse à « où va réellement mon temps ? ».

Cela suppose Python 101 et une aisance avec les bases de `datetime` — rien au-delà n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Modéliser une entrée de temps et persister une liste d'entrées en CSV.
2. Démarrer et arrêter une session, en calculant sa durée automatiquement.
3. Ajouter une entrée manquée à la main et lister le travail récent.
4. Rapporter les totaux par jour et par semaine.
5. Résumer où le temps est allé, par tâche.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — et honnête. Toute la valeur d'un suivi du temps est *la persistance plus ta vraie horloge*, qui nécessitent toutes deux un disque et un `datetime.now()` qui veut dire quelque chose. Exécute-le sur ta propre machine.

**Google Colab, Kaggle Notebooks et Binder** exécutent chaque cellule de code parfaitement (bibliothèque standard pure), et le notebook reflète chaque étape avec un exemple seedé. L'honnêteté impose de préciser : le système de fichiers éphémère d'un notebook et son horloge en bac à sable en font un chemin d'essai — le `.csv` de *tes sessions* ne survivra pas, et `datetime.now()` dans un notebook reste une vraie horloge si tu le veux. Utilise les badges pour voir la logique, et passe au `uv` local pour l'outil auquel tu confies ta semaine.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-tracker/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-tracker/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ftime-tracker%2Fnotebook.fr.ipynb)

## Configuration

Crée le projet. Le suivi n'utilise que la bibliothèque standard, donc il n'y a rien à installer.

```bash
uv init time-tracker
cd time-tracker
```

```bash
uv run python -c "import csv, json; from datetime import datetime; print('ok')"
```

`csv` est ta couche de persistance — un `entries.csv` lisible par un humain qu'Excel ou n'importe quel éditeur de texte peut ouvrir. `json` n'est pas strictement requis ici, mais il apparaît dans les exemples de notebook pour des données de type configuration, et `datetime` est le module qui transforme deux moments d'horloge murale en « minutes travaillées ».

**✅ Liste de vérification**

- ✅ `uv init time-tracker` a créé un dossier avec un `pyproject.toml`.
- ✅ Le contrôle d'import affiche `ok` — zéro paquet ajouté.

## Étape 1 : Modélise une entrée de temps et persiste-la en CSV

Chaque commande de cet outil lit et écrit le même magasin. D'abord tu as besoin d'une forme pour une entrée — une tâche, un moment de début, un moment de fin facultatif et une durée calculée — plus une paire sauvegarder/charger autour d'un fichier CSV.

### 1.1 Crée la dataclass `Entry` et le magasin CSV

**👟 Indice de départ :** Définis une dataclass `Entry` avec `id`, `task`, `start`, `end`, `minutes` ; puis charge via `csv.DictReader` et sauvegarde via `csv.DictWriter` plus `asdict`.

```python
# tracker.py
import csv
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

FILE = "entries.csv"
FIELDS = ["id", "task", "start", "end", "minutes"]

@dataclass
class Entry:
    id: int
    task: str
    start: str        # ISO-like: "2026-09-06 09:15" or "manual"
    end: str = ""
    minutes: int = 0

def load_entries() -> list[Entry]:
    """Load all entries from entries.csv, or [] if the file doesn't exist."""
    if not Path(FILE).exists():
        return []
    with open(FILE, newline="") as f:
        return [Entry(**row) for row in csv.DictReader(f)]

def save_entries(entries: list[Entry]) -> None:
    """Write all entries to entries.csv."""
    with open(FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(asdict(e) for e in entries)

print(load_entries())
```

`csv.DictWriter` avec `fieldnames=FIELDS` écrit une ligne d'en-tête que `csv.DictReader` remappe ensuite sur chaque ligne future — donc le fichier lui-même documente le schéma, et `Entry(**row)` reconstruit les objets avec zéro analyse de chaîne manuelle. `asdict(e)` convertit chaque dataclass en dict simple, ce qui est exactement ce que `writerows` veut. Stocker les horodatages comme chaînes de type ISO (`"2026-09-06 09:15"`) garde le fichier greppable et le trie lexicalement par date — l'ordre chronologique est gratuit jusqu'à ce que l'Étape 4 ait besoin d'une vraie analyse.

**🎯 Résultat attendu :** `[]` sur un projet tout neuf — une liste d'entrées vide, aucun crash.

**🩹 Si ça ne marche pas :** Si `csv.DictReader` retourne des lignes vides, la ligne d'en-tête de `writeheader()` manque donc les clés n'existent pas. Si `Entry(**row)` lève `TypeError`, une ligne sauvegardée manque d'un des cinq `FIELDS`. Si les nombres arrivent comme chaînes (`id: "1"`), c'est normal pour du CSV — la conversion int peut se produire au point d'usage ou via une étape `Entry(**{...cast...})`.

### 1.2 Vérifie le magasin

**✅ Liste de vérification**

- ✅ `uv run python tracker.py` affiche `[]` lors d'une première exécution.
- ✅ Sauvegarder une seule `Entry`, puis `load_entries()`, fait un aller-retour des cinq champs.
- ✅ Tu peux dire ce que fait `asdict(e)` et pourquoi `fieldnames` compte.

**🤔 Question(s) socratique(s)**

- Le CSV stocke `end` comme une chaîne vide pour une session en cours. Pourquoi est-ce une représentation *meilleure* que de stocker un sentinelle comme `-1` pour « toujours en cours », et qu'est-ce qui casse à l'Étape 4 si un sentinelle s'insinue ?
- `writerows(asdict(e) for e in entries)` écrit chaque entrée, à chaque fois. Quel est le scénario exact où cette approche de remplacement total perd des données, et que changerais-tu pour ajouter à la place ?

## Étape 2 : Démarre et arrête une session

Le cœur d'un suivi du temps : `start` tamponne une entrée avec le moment courant ; `stop` trouve la session en cours, tamponne sa fin et calcule la durée.

### 2.1 Écris `start_task`, `stop_active` et `compute_minutes`

**👟 Indice de départ :** Suis l'heure courante avec un `datetime.now()` par tampon, trouve l'entrée en cours en balayant pour un `end` vide, et calcule les minutes comme `(end - start) // 60s`.

```python
# tracker.py (continuation)
def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")

def next_id(entries: list[Entry]) -> int:
    return max((e.id for e in entries), default=0) + 1

def start_task(entries: list[Entry], task: str) -> None:
    entries.append(Entry(id=next_id(entries), task=task, start=now_str()))
    save_entries(entries)
    print(f"started #{entries[-1].id}: {task} at {entries[-1].start}")

def compute_minutes(start: str, end: str) -> int:
    start_t = datetime.strptime(start, "%Y-%m-%d %H:%M")
    end_t = datetime.strptime(end, "%Y-%m-%d %H:%M")
    return max(0, int((end_t - start_t).total_seconds() // 60))

def stop_active(entries: list[Entry]) -> None:
    for e in reversed(entries):
        if e.end == "":
            e.end = now_str()
            e.minutes = compute_minutes(e.start, e.end)
            save_entries(entries)
            print(f"stopped #{e.id}: {e.task} ({e.minutes} min)")
            return
    print("nothing is running.")
```

`now_str()` normalise l'horloge murale dans le même format `"%Y-%m-%d %H:%M"` que l'Étape 1 a choisi, donc les tampons de début et de fin s'analysent toujours en retour. `stop_active` balaie la liste *à l'envers* pour attraper la session en cours la plus récente d'abord. La ligne clé est `compute_minutes` : `strptime` analyse les deux tampons en vrais objets `datetime`, les soustraire donne un `timedelta`, et `.total_seconds() // 60` convertit en minutes entières — avec `max(0, ...)` comme garde-fou pour qu'une horloge déplacée manuellement en arrière ne puisse pas produire un temps négatif.

**🎯 Résultat attendu :** Lors d'une première exécution `nothing is running.` Après `start_task(load_entries(), "Learn dataclasses")` puis `stop_active(...)`, une ligne `stopped #1: Learn dataclasses (N min)` où N est les minutes réelles écoulées.

**🩹 Si ça ne marche pas :** Si `strptime` lève `ValueError`, un tampon stocké n'est pas sous la forme `%Y-%m-%d %H:%M` (les mois vs les noms de mois sont la non-correspondance classique). Si l'arrêt rapporte `0 min` même après un vrai temps écoulé, c'est que les deux tampons viennent du même appel `now_str()` — chaque tampon doit l'appeler séparément. Si le balayage `reverse` arrête la mauvaise session, c'est que l'`end` d'une entrée terminée n'est pas réellement `""` ; les sessions plus anciennes ont besoin d'être effacées ou la boucle doit vérifier la *dernière* entrée d'abord.

### 2.2 Vérifie démarrage/arrêt

**✅ Liste de vérification**

- ✅ Un aller-retour démarrer puis arrêter écrit `start`, `end` et un `minutes` positif dans le CSV.
- ✅ Démarrer deux sessions et en arrêter une laisse exactement une entrée en cours.
- ✅ `stop_active` sur une liste entièrement arrêtée affiche `nothing is running.`

**🤔 Question(s) socratique(s)**

- `start_task` ne refuse rien — tu peux démarrer une seconde session pendant qu'une tourne. Qu'arriverait-il au balayage de `stop_active` si un utilisateur en démarrait deux et n'en arrêtait qu'une, et quelle règle ajouterais-tu au moment de `start` pour l'empêcher ?
- La durée utilise des minutes entières, tronquant les secondes (`// 60`). Quand une session fait 2 minutes 59 secondes, que prétend le rapport — et est-ce un bug d'arrondi ou une conception raisonnable pour un suivi humain ?

## Étape 3 : Ajoute des entrées à la main et liste-les

Les sessions s'oublient. Cette étape ajoute le chemin d'entrée manuelle — `add` te laisse journaliser une tâche et des minutes directement, avec `start="manual"` — et une vue `list` qui montre tes entrées les plus récentes.

### 3.1 Écris `add_manual` et `list_entries`

**👟 Indice de départ :** Construis une `Entry` avec `minutes` fournies et `start="manual"` (un marqueur délibéré), et liste les entrées triées de la plus récente à la plus ancienne avec un format lisible sur une ligne.

```python
# tracker.py (continuation)
from datetime import timedelta

def add_manual(entries: list[Entry], task: str, minutes: int) -> None:
    entries.append(Entry(id=next_id(entries), task=task,
                         start="manual", minutes=int(minutes)))
    save_entries(entries)
    print(f"added #{entries[-1].id}: {task} ({minutes} min)")

def list_entries(entries: list[Entry], n: int = 8) -> None:
    recent = sorted(entries, key=lambda e: e.id, reverse=True)[:n]
    for e in recent:
        when = e.start[:10] if e.start != "manual" else "manual"
        marker = f"{e.minutes:>4} min" if e.minutes else "running"
        print(f"#{e.id:>3}  {marker:>7}  {e.task:<24} {when}")

add_manual(load_entries(), "Write tracker docs", 25)
list_entries(load_entries())
```

`start="manual"` est un sentinelle délibéré — il marque une entrée *sans* vraie horloge de session, et l'Étape 4 se branchera dessus. Stocker un `minutes` simple pour les entrées manuelles est le compromis honnête : tu as journalisé le nombre directement, donc il n'y a pas de calcul d'horodatage à refaire. Trier par `e.id` décroissant donne l'ordre de la plus récente à la plus ancienne gratuitement (les ids sont monotones), et la colonne de format `{e.minutes:>4}` aligne à droite les nombres pour qu'une liste mixte de `running`/`25 min` se lise proprement.

**🎯 Résultat attendu :** `added #1: Write tracker docs (25 min)`, puis une sortie `list` avec `25 min` visible et un marqueur `manual` dans la colonne de date.

**🩹 Si ça ne marche pas :** Si `int(minutes)` lève sur `"25"` vs `25`, le code appelant a passé une chaîne — convertis une fois à la frontière. Si les entrées manuelles montrent `0 min`, c'est que le cast `int` a tourné avant que l'assignation de dataclass n'atterrisse. Si le listing n'est pas le plus récent en premier, c'est que la clé de tri `reverse=True` est inversée.

### 3.2 Vérifie l'entrée manuelle et le listing

**✅ Liste de vérification**

- ✅ `add_manual(...)` persiste une entrée avec `start="manual"` et les bonnes minutes.
- ✅ `list_entries` montre les sessions manuelles et minutées dans une vue lisible unique.
- ✅ Tronquer à `n=3` ne lève jamais sur un fichier à 1 entrée.

**🤔 Question(s) socratique(s)**

- Une entrée manuelle n'a ni début ni fin, pourtant elle partage le type `Entry`. Quelle logique de rapport devient *plus simple* parce que les entrées manuelles se déclarent avec `"manual"`, et qu'est-ce qui pourrait encore mal tourner si tu ne validais jamais ce sentinelle ?
- `list_entries` montre `running` pour minutes==0. Ce marqueur est-il fiable — et quand une entrée légitime aurait-elle aussi exactement 0 minute ?

## Étape 4 : Rapporte les totaux quotidiens et hebdomadaires

Les rapports transforment les entrées brutes en le résumé qu'un audit du temps lit réellement : combien de minutes ce jour, cette semaine. La discipline clé — sauter les entrées `"manual"` lors de la division par date — est enseignée de front parce que les vraies données ne seront pas toujours propres.

### 4.1 Écris les rapports quotidiens et hebdomadaires

**👟 Indice de départ :** Pour les rapports basés sur la date, analyse chaque `start` réel, regroupe les minutes par date (quotidien) ou par ISO `(année, semaine)` (hebdomadaire) ; garde les entrées manuelles hors des deux.

```python
# tracker.py (continuation)
from collections import defaultdict

def daily_total(entries: list[Entry]) -> dict:
    total = defaultdict(int)
    for e in entries:
        if e.start == "manual":
            continue
        day = datetime.strptime(e.start, "%Y-%m-%d %H:%M").date()
        total[day] += e.minutes
    return dict(total)

def weekly_total(entries: list[Entry]) -> dict:
    total = defaultdict(int)
    for e in entries:
        if e.start == "manual":
            continue
        day = datetime.strptime(e.start, "%Y-%m-%d %H:%M").date()
        y, w, _ = day.isocalendar()
        total[(y, w)] += e.minutes
    return dict(total)

for day, minutes in sorted(daily_total(load_entries()).items()):
    print(day.isoformat(), minutes, "min")
print("---")
for (y, w), minutes in sorted(weekly_total(load_entries()).items()):
    print(f"{y}-W{w:02d}", minutes, "min")
```

Le `if e.start == "manual": continue` en haut des deux fonctions est la conception : le `start` d'une entrée manuelle est le sentinelle, pas une date, donc l'analyser lèverait — le sauter rend le rapport robuste *et* honnête (les minutes sont quand même comptées ailleurs, dans le résumé de tâches de l'Étape 5). `defaultdict(int)` fait de « ajouter des minutes à une date peut-être invisible » une ligne unique au lieu d'une danse de `get`. `day.isocalendar()` retourne `(année ISO, semaine ISO, jour de semaine)` — regrouper sur les deux premiers est la façon standard de dire « cette semaine » à travers les frontières d'année.

**🎯 Résultat attendu :** Une ligne par date de session réelle et une par semaine ISO, les minutes additionnées — avec les entrées manuelles absentes des deux tableaux, et aucun `ValueError`.

**🩹 Si ça ne marche pas :** Si une entrée `Manual` plante le rapport, c'est que le garde-fou `continue` manque ou vérifie l'`e.keyword` épelé différemment de `"manual"`. Si le total d'une semaine disparaît la veille du Nouvel An, les bords `(y, w)` de `day.isocalendar()` ne s'alignent pas avec l'année calendaire — c'est le caprice standard cuit dans les semaines ISO, pas un bug. Si tout s'additionne en un seul jour géant, c'est que `day.isocalendar()` n'a pas été appelé et que le regroupement s'est effondré sur le tuple `(y, w)` entier.

### 4.2 Vérifie les rapports

**✅ Liste de vérification**

- ✅ Les tableaux quotidiens et hebdomadaires s'affichent sans planter, entrées manuelles exclues.
- ✅ Additionner les sessions d'un jour connu correspond à ce que tu as tapé.
- ✅ Tu peux expliquer le trip `(year, week)` de `isocalendar()` et pourquoi « semaine » est ambigu.

**🤔 Question(s) socratique(s)**

- Ces rapports gardent les entrées manuelles complètement à l'écart. Pourquoi les cacher est-il un choix *pire* pour un vrai audit du temps que de les montrer sous un compartiment `(manual)` explicite — et qu'afficherais-tu pour rendre l'omission visible ?
- Une session qui commence lundi 23:50 et se termine mardi 00:40 est divisée par **l'heure de début** en lundi. Quels rapports méritent une division par minute à travers les jours, et pourquoi cela ne compte-t-il qu'à la granularité quotidienne ?

## Étape 5 : Construis le résumé des tâches principales et le routeur CLI

La dernière fonctionnalité répond à la question qui a lancé le projet : *où est allé mon temps ?* — plus un minuscule routeur de commandes pour que chaque fonction soit accessible depuis le terminal avec un mot.

### 5.1 Écris `summarize` et le routeur `main`

**👟 Indice de départ :** Agrège les minutes par tâche sur toutes les entrées (manuelles incluses — c'est un vrai travail), et route `start` / `stop` / `add` / `list` / `daily` / `weekly` / `summary` depuis `sys.argv`.

```python
# tracker.py (continuation)
import sys

def summarize(entries: list[Entry], n: int = 3) -> None:
    by_task = defaultdict(int)
    for e in entries:
        by_task[e.task] += e.minutes
    print("top", n, "tasks by time:")
    for task, minutes in sorted(by_task.items(), key=lambda x: x[1], reverse=True)[:n]:
        print(f"  {minutes:>5} min  {task}")
    print(f"  TOTAL {sum(by_task.values())} min across {len(by_task)} tasks")

def main() -> None:
    args = sys.argv[1:]
    entries = load_entries()
    cmd = args[0] if args else "list"
    if cmd == "start":
        start_task(entries, args[1])
    elif cmd == "stop":
        stop_active(load_entries())
    elif cmd == "add":
        add_manual(entries, args[1], int(args[2]))
    elif cmd == "list":
        list_entries(entries)
    elif cmd == "daily":
        for day, m in sorted(daily_total(entries).items()):
            print(day.isoformat(), m, "min")
    elif cmd == "weekly":
        for (y, w), m in sorted(weekly_total(entries).items()):
            print(f"{y}-W{w:02d}", m, "min")
    elif cmd == "summary":
        summarize(entries)
    else:
        print("commands: start <task> | stop | add <task> <min> | list | daily | weekly | summary")

if __name__ == "__main__":
    main()
```

`summarize` compte délibérément les entrées manuelles aux côtés des minutées — contrairement aux rapports de dates — parce que « la tâche a pris 125 minutes au total » est vrai que ce soit venu d'un chronomètre ou d'une note. Le routeur est intentionnellement mince : chaque commande sur une ligne, chacune réutilisant la même `entries` chargée. Remarque que `stop_active(load_entries())` recharge plutôt que de muter la copie de l'appelant — une asymétrie délibérée pour que « stop » voie toujours l'état de disque le plus frais, et un bon exemple de pourquoi les routeurs de commandes rechargent à chaque frontière.

**🎯 Résultat attendu :** `uv run python tracker.py summary` affiche les tâches principales avec les minutes plus un total ; chaque autre commande ci-dessus fonctionne à l'identique depuis un shell.

**🩹 Si ça ne marche pas :** Si `summary` montre le `TOTAL 0` vide, le fichier chargé n'a pas d'entrées ou `e.minutes` est lu comme une chaîne — les chaînes CSV ont besoin d'un cast `int()` dans la boucle de résumé. Si `start` avec deux mots comme `"Learn dataclasses"` ne consomme que `args[1]`, tu as besoin de `" ".join(args[1:])` pour les tâches multi-mots. Si `stop` depuis la CLI n'affecte pas la session interactive, les deux tiennent des listes différentes — recharge après toute écriture.

### 5.2 Vérifie le suivi fini

**✅ Liste de vérification**

- ✅ `uv run python tracker.py summary` affiche les tâches principales et un total.
- ✅ `start` / `stop` / `add` / `list` / `daily` / `weekly` répondent tous depuis le terminal.
- ✅ Les entrées manuelles comptent dans `summary` mais sont exclues de `daily`/`weekly`.
- ✅ Tu as enregistré toi-même au moins une session réelle et une entrée manuelle.

**🤔 Question(s) socratique(s)**

- Le routeur recharge pour chaque commande ; `stop` recharge même deux fois. Quel **bug de données obsolètes** apparaîtrait si le routeur partageait plutôt une liste entre deux commandes (ex. `add` puis immédiatement `list`), et pourquoi recharge-par-commande est-il l'immunité bon marché contre lui ?
- `summary` classe les tâches par minutes totales, donc une session de 5 heures bat huit sessions de 30 minutes. Que tracerais-tu à la place pour montrer la *cohérence* plutôt que la masse brute — et qu'est-ce qui changerait pour un utilisateur qui veut les deux ?

## ⚠️ Pièges courants

- **Des tampons dans des formats incompatibles.** `now_str()` écrit `%Y-%m-%d %H:%M` ; si un CSV édité à la main utilise `%m/%d/%Y`, `strptime` lève. Correction : une constante de format, utilisée par l'écrivain et chaque analyseur.
- **Double-tampon d'une session.** Appeler `now_str()` une fois et réutiliser la valeur pour `start` *et* `end` produit une session de 0 minute après un vrai temps écoulé. Correction : tamponne chaque horodatage à son propre moment.
- **Des entrées manuelles avec un `start` d'apparence réelle.** Si les entrées manuelles réutilisent l'heure courante au lieu de `"manual"`, les totaux quotidiens prétendent silencieusement qu'un 25 minutes collé s'est produit aujourd'hui. Correction : garde le sentinelle `"manual"`, pas la date d'aujourd'hui.
- **Compter des chaînes comme des nombres.** Le CSV livre tout comme chaînes ; `sum(by_task.values())` sur des minutes en chaîne concatène (`"25" + "10"` = `"2510"`). Correction : convertis `int()` une fois au chargement ou dans `summarize`.
- **Une liste partagée entre les commandes.** Muter la même liste Python dans `add` puis la lire dans `list` sans re-sauvegarder/recharger produit des vues obsolètes. Correction : recharge à chaque frontière de commande comme le fait `main`.

## Ce que tu viens de construire

Un suivi du temps fonctionnel et CSV : suivi de session démarrer/arrêter avec un vrai calcul d'horodatages, entrée manuelle, rapports quotidiens et ISO-hebdomadaires, et un résumé des tâches principales routé entièrement à travers une CLI à un mot. La compétence transférable est *enregistrer la réalité plutôt que de la deviner* : le même motif « tamponne un moment, stocke une ligne, agrège des groupes » alimente les journaux d'habitudes, les worklogs Jira, les historiques de livraison de colis — toute question de la forme « combien, et quand, et pour quoi ? ».

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/time-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/time-tracker) dans le dépôt du cours est une version plus complète du code ci-dessus, avec un journal éditable et une option de résumé jour-sur-jour. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute `edit <id> <minutes>` pour qu'une session oubliée puisse être corrigée sur place, en réutilisant le motif charger-modifier-sauvegarder de l'Étape 1.
- Rends le rapport quotidien comme un graphique en barres textuel (`10 min ██`) pour que les tendances soient visibles d'un coup d'œil sans aucune bibliothèque de traçage.
- Divise les sessions à travers minuit pour qu'un bloc 23:50-00:40 contribue aux deux jours — la correction honnête pour la question socratique de l'Étape 4.
- Écris les totaux hebdomadaires dans un `report.csv` que ton document de facturation peut importer, bouclant la boucle que le pitch promettait initialement.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
