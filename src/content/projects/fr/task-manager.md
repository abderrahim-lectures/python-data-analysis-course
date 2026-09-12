---
title: "Gestionnaire de Tâches CLI"
description: "Gestion de tâches style Kanban depuis le terminal avec priorités, dates limites et regroupement par projet."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["cli", "json", "productivity"]
learningObjectives:
  - Modéliser une tâche avec une dataclass et la persister en JSON
  - Ajouter des tâches avec les champs priorité, projet et date limite
  - "Lister et filtrer les tâches par projet"
  - Marquer les tâches comme terminées et détecter les dates limites dépassées
  - Rendre les tâches comme un tableau regroupé par statut
prerequisites:
  - "Les bases de Python (fonctions, listes, dictionnaires)"
  - "Être à l'aise avec sys.argv et l'exécution de scripts depuis un terminal"
  - "Facultatif : un peu de datetime et de date"
---

# 🛠️ 🗂️ Gestionnaire de Tâches CLI

Une tâche qui ne vit nulle part n'est pas faite. Ce projet construit le plus petit gestionnaire de tâches réellement utile : un outil en ligne de commande qui stocke les tâches dans un fichier JSON, te permet de les ajouter avec une priorité, un projet et une date limite, de les lister et de les filtrer, de les marquer comme faites, et de rendre tout le backlog comme un tableau style kanban directement dans le terminal. C'est uniquement de la bibliothèque standard, tu apprendras les dataclasses, la persistance JSON et un peu de calcul de dates, et tu finiras avec un outil que tu utiliseras réellement au quotidien.

Cela suppose Python 101 et une aisance à exécuter des scripts depuis un terminal, rien au-delà n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Modéliser une tâche comme une dataclass et sauvegarder les tâches dans un fichier JSON.
2. Ajouter des tâches avec priorité, projet et date limite.
3. Lister les tâches et les filtrer par projet.
4. Marquer les tâches comme faites et signaler les dates limites dépassées.
5. Rendre le backlog comme un tableau style kanban par statut.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal, et honnêtement, le seul *réel*, pour celui-ci. Tout le but d'un gestionnaire de tâches est de survivre entre les sessions de terminal, et cela signifie écrire `tasks.json` sur un disque que tu conserves. Exécute-le là pour que tes tâches persistent.

**Google Colab, Kaggle Notebooks et Binder** peuvent chacun exécuter les cellules de code parfaitement, ils ont tous Python et la bibliothèque standard. L'honnêteté impose de préciser que le système de fichiers d'un notebook est éphémère : ton `tasks.json` peut ne pas survivre entre les sessions, donc traite ces chemins comme « voir la logique s'exécuter une fois » plutôt que « garder mes vraies tâches ». Utilise les badges pour essayer le code, et passe au `uv` local pour l'outil sur lequel tu comptes vraiment.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/task-manager/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/task-manager/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ftask-manager%2Fnotebook.fr.ipynb)

## Configuration

Crée le projet. Cet outil n'utilise que la bibliothèque standard, donc il n'y a rien à installer.

```bash
uv init task-manager
cd task-manager
```

```bash
uv run python -c "import json; from pathlib import Path; print('ok')"
```

`json` est toute ta couche de base de données, tes tâches vivront dans un fichier `tasks.json` lisible par un humain dans le dossier du projet. `pathlib.Path` te donne un moyen propre et multiplateforme de vérifier si ce fichier existe déjà.

**✅ Liste de vérification**

- ✅ `uv init task-manager` a créé un dossier avec un `pyproject.toml`.
- ✅ `uv run python -c "import json; from pathlib import Path"` affiche `ok`, zéro paquet ajouté.

## Étape 1 : Modélise une tâche et persiste-la en JSON

Chaque commande de cet outil, ajouter, lister, terminer, tableau, lit et écrit dans le même magasin. D'abord tu as besoin d'une forme pour une tâche, et d'une paire de fonctions qui sauvegardent et chargent une liste de tâches.

### 1.1 Crée la dataclass `Task` et le magasin JSON

**👟 Indice de départ :** Définis une dataclass `Task` avec les champs dont tu auras besoin (id, titre, projet, priorité, date limite, fait), puis écris `load_tasks`/`save_tasks` autour d'un fichier `tasks.json`.

```python
# tasks.py
import json
from dataclasses import dataclass, asdict
from pathlib import Path

DB = "tasks.json"

@dataclass
class Task:
    id: int
    title: str
    project: str = "Inbox"
    priority: str = "medium"
    deadline: str = ""
    done: bool = False

def load_tasks() -> list[Task]:
    """Load all tasks from tasks.json, or [] if the file doesn't exist yet."""
    if not Path(DB).exists():
        return []
    with open(DB) as f:
        return [Task(**row) for row in json.load(f)]

def save_tasks(tasks: list[Task]) -> None:
    """Write the task list to tasks.json."""
    with open(DB, "w") as f:
        json.dump([asdict(t) for t in tasks], f, indent=2)

print(load_tasks())
```

`@dataclass` écrit les méthodes `__init__`, `__repr__` et d'égalité pour toi, tu décris les champs une fois et tu obtiens un vrai objet. La paire de persistance est toute la couche de stockage : `asdict(t)` transforme chaque `Task` en un dictionnaire simple que JSON peut comprendre, `json.dump(..., indent=2)` écrit un fichier lisible, et au retour, `Task(**row)` dépaquète chaque dictionnaire sauvegardé dans un `Task`. Le garde-fou `if not Path(DB).exists()` est ce qui rend la *première* exécution sûre : pas encore de fichier signifie pas de tâches, pas une erreur.

**🎯 Résultat attendu :** `[]` sur un projet tout neuf, une liste de tâches vide, aucun crash.

**🩹 Si ça ne marche pas :** Si tu obtiens une `FileNotFoundError`, c'est que le garde-fou `exists()` manque. Si la sortie de sauvegarde est une seule ligne géante illisible, c'est que `indent=2` manque du `json.dump`. Si `Task(**row)` lève `TypeError: unexpected keyword argument`, le dict sauvegardé a une clé que la dataclass n'a pas, vérifie que les champs sont épelés de la même façon des deux côtés.

### 1.2 Vérifie le magasin

**✅ Liste de vérification**

- ✅ `uv run python tasks.py` affiche `[]` lors d'une première exécution.
- ✅ `save_tasks([Task(id=1, title="hi")])` puis `load_tasks()` fait un aller-retour intact de la tâche.
- ✅ Tu peux expliquer à quoi sert `asdict(t)`, dans tes propres mots.

**🤔 Question(s) socratique(s)**

- Après `save_tasks`, les données de tâche existent comme texte littéral que tu pourrais ouvrir dans n'importe quel éditeur. Que te donne cela qu'une sauvegarde basée sur `pickle` ne donnerait pas, et qu'est-ce que cela coûte en vitesse ?
- `Task(**row)` dépaquette un dictionnaire en arguments nommés. Que casse-t-il si un `tasks.json` sauvegardé manque le champ `done` sur une ligne, étant donné que `done` a une valeur par défaut mais que `id` et `title` n'en ont pas ?

## Étape 2 : Ajoute des tâches avec priorité, projet et date limite

Avec un magasin fonctionnel, tu peux commencer à le remplir. Cette étape ajoute la commande `add` : elle donne à chaque nouvelle tâche un id frais, l'insère dans la liste, sauvegarde et te dit ce qui s'est passé.

### 2.1 Écris la commande `add_task` et un générateur d'id auxiliaire

**👟 Indice de départ :** Calcule le prochain id à partir du plus grand id déjà présent (par défaut 0 sur une liste vide), construis une `Task`, ajoute-la, sauvegarde et affiche une confirmation.

```python
# tasks.py (continuation)
def next_id(tasks: list[Task]) -> int:
    return max((t.id for t in tasks), default=0) + 1

def add_task(tasks: list[Task], title: str,
             project: str = "Inbox", priority: str = "medium",
             deadline: str = "") -> None:
    task = Task(id=next_id(tasks), title=title,
                project=project, priority=priority, deadline=deadline)
    tasks.append(task)
    save_tasks(tasks)
    print(f"Added #{task.id}: {task.title} [{task.priority}] ({task.project})")

add_task(load_tasks(), "Review pull requests", project="Work", priority="high")
add_task(load_tasks(), "Buy groceries", project="Home", deadline="2026-09-10")
```

Deux détails rendent cela sûr plutôt que mignon. `max((t.id for t in tasks), default=0)` satisfait deux cas à la fois, une liste vide n'a pas d'ids, donc `default=0` fait de la première tâche `#1`, et recalculer depuis la liste stockée signifie que l'id ne peut jamais entrer en collision avec un que tu as déjà sauvegardé. Ajouter *avant* de sauvegarder est intentionnel : si quoi que ce soit dans cette liste change au cours d'une session, seul l'état final écrit importe.

**🎯 Résultat attendu :** Lors de la première exécution, `Added #1: Review pull requests [high] (Work)` et `Added #2: Buy groceries [medium] (Home)`.

**🩹 Si ça ne marche pas :** Si les deux tâches s'affichent comme `#1`, c'est que `next_id` ne recalcule pas contre la liste *sauvegardée*, vérifie que chaque appel `add_task` charge des tâches fraîches plutôt que de réutiliser le même objet liste. Si les ids sautent à de grands nombres, c'est que le `default=0` de liste-vide manque. Si les priorités n'apparaissent jamais dans la confirmation, c'est que la f-string a `task.priority` échangé contre `priority`.

### 2.2 Vérifie `add`

**✅ Liste de vérification**

- ✅ Exécuter les deux appels `add_task` deux fois de suite produit les ids `1, 2`, puis `3, 4`, aucune collision.
- ✅ `tasks.json` contient maintenant deux objets de tâche lisibles.
- ✅ Le projet et la date limite vides retombent sur `"Inbox"` et `""` sans erreur.

**🤔 Question(s) socratique(s)**

- L'argument `priority` a une valeur par défaut, donc un utilisateur qui oublie de le passer obtient `"medium"` silencieusement. Est-ce une valeur par défaut conviviale ou un piège de qualité de données, et qu'ajouterais-tu pour garder de mauvaises priorités hors du fichier ?
- Une date limite est stockée comme une simple chaîne. Quand penses-tu que cette chaîne cessera de suffire (indice : pense à l'Étape 4), et quel type utiliserais-tu à la place ?

## Étape 3 : Liste et filtre les tâches par projet

Ajouter des tâches est inutile si tu ne peux pas les voir. Cette étape ajoute la liste, triée par priorité pour que l'important remonte, et un filtre `project` pour que chaque projet soit sa propre vue claire.

### 3.1 Écris la commande de listing et de filtrage

**👟 Indice de départ :** Trie les tâches chargées par un ordre de priorité que tu définis, puis éventuellement restreins à un seul projet avant d'afficher chaque ligne.

```python
# tasks.py (continuation)
PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}

def list_tasks(tasks: list[Task], project: str | None = None) -> None:
    items = tasks if project is None else [t for t in tasks if t.project == project]
    items.sort(key=lambda t: (PRIORITY_ORDER[t.priority], t.id))
    if not items:
        print("Nothing here yet.")
        return
    for t in items:
        flag = "[x]" if t.done else "[ ]"
        print(f"{t.id:>3} {flag} {t.priority:<6} {t.project:<8} {t.title}")

print("-- all --")
list_tasks(load_tasks())
print("-- Home only --")
list_tasks(load_tasks(), project="Home")
```

La clé de tri `(PRIORITY_ORDER[t.priority], t.id)` fait deux travaux : le tri primaire par la carte de priorité numérique (donc `high` vient avant `medium`, l'ordre alphabétique obtiendrait cela à l'envers), et un tri secondaire stable par id pour que les tâches de priorité égale gardent l'ordre d'insertion. Le drapeau `[x]`/`[ ]` est un marqueur de fait-style-tableau sur lequel tu t'appuieras à l'Étape 5. Filtrer avec une compréhension de liste garde la boucle d'affichage simple, un chemin de code, deux entrées.

**🎯 Résultat attendu :** « all » montre les deux tâches avec `#1 Review pull requests [high]` au-dessus de `#2 Buy groceries [medium]` ; « Home only » montre juste la tâche de courses.

**🩹 Si ça ne marche pas :** Si `low` se trie au-dessus de `high`, c'est que la clé de tri utilise la chaîne brute au lieu de `PRIORITY_ORDER`. Si « Home only » affiche aussi la tâche de travail, c'est que la compréhension compare `t.project == project` mais que les valeurs de projet ont des espaces de fin. Si `t.priority:<6` semble irrégulier, c'est que la largeur du spécificateur de format manque.

### 3.2 Vérifie le listing et le filtrage

**✅ Liste de vérification**

- ✅ `list_tasks` trie en premier les tâches à haute priorité sur tous les projets.
- ✅ Passer `project="Home"` ne montre que les tâches de la maison.
- ✅ Un résultat vide affiche `Nothing here yet.` au lieu d'un en-tête vide.

**🤔 Question(s) socratique(s)**

- Le tri est *stable* sur l'id une fois la priorité égale. Pourquoi compter sur un tri stable compte-t-il pour l'ordre d'insertion, et où un tri instable surprendrait-il visiblement un utilisateur ?
- Le filtrage se produit avant le tri. Serait-il jamais correct de trier d'abord et de filtrer après, et qu'impliquerait l'ordre de sortie sur la façon dont l'outil « lit » tes projets ?

## Étape 4 : Termine les tâches et signale les dates limites dépassées

Un gestionnaire de tâches qui ne fait qu'ajouter et lister n'est qu'une étagère. Cette étape ajoute `done`, terminer réellement une tâche, plus le calcul de dates qui signale les dates limites qui ont dépassé.

### 4.1 Écris `complete_task` et le contrôle de dépassement

**👟 Indice de départ :** Trouve la tâche par id, bascule son drapeau `done`, sauvegarde et confirme. Puis ajoute `is_overdue`, qui retourne `False` pour les tâches terminées et sans date limite et compare une vraie date analysée à celle d'aujourd'hui.

```python
# tasks.py (continuation)
from datetime import date, datetime

def complete_task(tasks: list[Task], task_id: int) -> None:
    for t in tasks:
        if t.id == task_id:
            t.done = True
            save_tasks(tasks)
            print(f"Completed #{task_id}: {t.title}")
            return
    print(f"No task with id {task_id}.")

def is_overdue(t: Task) -> bool:
    if t.done or not t.deadline:
        return False
    deadline = datetime.strptime(t.deadline, "%Y-%m-%d").date()
    return deadline < date.today()

tasks = load_tasks()
complete_task(tasks, 2)
for t in tasks:
    status = "OVERDUE" if is_overdue(t) else ("done" if t.done else "open")
    print(f"#{t.id} {t.title}: {status}")
```

`complete_task` est délibérément linéaire, scanne pour l'id, mute en place, sauvegarde une fois, retourne. Le `return` anticipé dans la boucle est tout le chemin de succès : il empêche à la fois la double-sauvegarde et laisse le `print` de fin servir de branche « introuvable ». `is_overdue` prend deux décisions de garde délibérées d'abord : une tâche terminée ne peut pas être en retard, et une tâche sans date limite ne peut pas être en retard, les deux sont *absence de planification*, pas des échecs de planification. `strptime` qui convertit la chaîne stockée en vraie `date` est ce qui rend la comparaison `<` possible du tout.

**🎯 Résultat attendu :** `Completed #2: Buy groceries` ; la boucle affiche `#1 Review pull requests: open` et `#2 Buy groceries: done`, plus `OVERDUE` pour toute tâche dont la date limite précède aujourd'hui.

**🩹 Si ça ne marche pas :** Si `strptime` lève `ValueError`, une date limite stockée n'est pas sous la forme `%Y-%m-%d` (ex. `"2026/09/10"`), c'est le piège de date-limite-en-chaîne de l'Étape 2. Si *chaque* tâche lit OVERDUE, c'est que `is_overdue` compare un `datetime` à une `date` ou rate le garde-fou `not t.deadline` pour que les chaînes vides analysent et échouent. Si terminer une tâche en marque plusieurs comme faites, la boucle mute la mauvaise comparaison, les ids doivent correspondre exactement.

### 4.2 Vérifie la logique de terminaison et de dépassement

**✅ Liste de vérification**

- ✅ Terminer un vrai id bascule `done` à `true` dans `tasks.json`.
- ✅ Terminer un id inexistant affiche `No task with id …` et n'écrit rien.
- ✅ Une tâche avec une date limite passée et `done=False` rapporte `OVERDUE` ; la même tâche marquée terminée ne le fait pas.

**🤔 Question(s) socratique(s)**

- `is_overdue` ignore une date limite qui est *aujourd'hui*, seul `< today` compte. Une tâche due aujourd'hui ressemble exactement à une tâche due la semaine prochaine dans cette sortie. Qu'afficherais-tu à la place pour faire de « due aujourd'hui » un état distinct et urgent ?
- La date limite est comparée au `date.today()` de ta machine. Dans quel scénario réel l'horloge de la machine est-elle la *mauvaise* horloge, et comment les fuseaux horaires changeraient-ils ce que « en retard » veut dire ?

## Étape 5 : Rends un tableau style kanban

Le tableau est la récompense, la vue quotidienne qu'un utilisateur de kanban regarde réellement. Il regroupe le backlog en colonnes de statut, signale les éléments urgents, et sert aussi de commande principale de l'outil.

### 5.1 Écris le tableau et un petit routeur de commandes

**👟 Indice de départ :** Partitionne les tâches en colonnes « À faire » et « Faites », marque les éléments en retard dans la colonne À faire, et construis un `main` qui route `add` / `done` / `board` depuis `sys.argv`.

```python
# tasks.py (continuation)
import sys

def show_board(tasks: list[Task]) -> None:
    todo = [t for t in tasks if not t.done]
    done = [t for t in tasks if t.done]

    print("┌─ TO DO ─────────────────────────────┐")
    for t in sorted(todo, key=lambda t: (is_overdue(t) is not True,
                                         PRIORITY_ORDER[t.priority], t.id)):
        flag = "OVERDUE!" if is_overdue(t) else "        "
        print(f"  {t.id:>2} {flag} {t.title}")
    if not todo:
        print("  (nothing to do)")

    print("┌─ DONE ──────────────────────────────┐")
    for t in done:
        print(f"  {t.id:>2}  [x] {t.title}")

def main() -> None:
    args = sys.argv[1:]
    if not args or args[0] == "board":
        show_board(load_tasks())
    elif args[0] == "add":
        title = " ".join(args[1:])
        add_task(load_tasks(), title)
    elif args[0] == "done":
        complete_task(load_tasks(), int(args[1]))
    else:
        print("Commands: board | add <title> | done <id>")

if __name__ == "__main__":
    main()
```

La clé de tri dans `show_board` est la ligne intéressante : `(is_overdue(t) is not True, PRIORITY_ORDER[t.priority], t.id)` met `False` avant `True` dans un tri booléen, donc les tâches *non* en retard se trient d'abord et les tâches `OVERDUE!` flottent en haut de la colonne, devant même la haute priorité. Rendre le tableau comme du texte de dessin de boîte est de la pure présentation, mais la partition (`todo`/`done`) réutilise le même drapeau `done` que l'Étape 4 a muté, donc le tableau *est* les données. Le routeur `main` garde chaque commande sur une seule ligne pour que l'outil se lise comme une petite application plutôt qu'un script.

**🎯 Résultat attendu :** `uv run python tasks.py` affiche un tableau à deux colonnes : les tâches en retard d'abord dans TO DO avec un marqueur `OVERDUE!`, les tâches terminées sous DONE. `board`, `add` et `done` fonctionnent tous depuis le terminal.

**🩹 Si ça ne marche pas :** Si une erreur de tri mentionne de trier `bool` contre `int`, c'est que le tuple de clé est assemblé de travers, `is_overdue(t) is not True` doit rester un bool. Si le routeur n'atteint jamais `done`, c'est que `sys.argv[1]` a été consommé par `args[0] == "add"` qui correspond à un titre vide. Si le tableau semble déformé dans certains terminaux, c'est que les caractères de dessin de boîte `┌─` ne s'affichent pas, des lignes `==` simples sont le repli portable.

### 5.2 Vérifie l'application de bout en bout

**✅ Liste de vérification**

- ✅ `uv run python tasks.py board` (ou sans argument) rend le tableau à deux colonnes.
- ✅ `uv run python tasks.py add "Ship v1"`, `done 3` et `board` font un aller-retour à travers `tasks.json`.
- ✅ Les tâches en retard apparaissent en haut de TO DO avec le marqueur.
- ✅ Tu as utilisé l'outil sur au moins une fois tes propres vraies tâches.

**🤔 Question(s) socratique(s)**

- Le tableau a exactement deux colonnes parce qu'une `Task` ne stocke qu'un booléen `done`. Quel champ unique ajouterait une troisième colonne « En cours », et quel changement de flux de travail cela suggérerait-il aux utilisateurs ?
- `show_board` appelle `is_overdue` trois fois par tâche à faire. Pour quelques dizaines de tâches, ce n'est rien, à quelle échelle mettrais-tu ce résultat en cache, et comment le mettrais-tu en cache *correctement* (pour qu'il recalcule quand une tâche se termine) ?

## ⚠️ Pièges courants

- **Lire une fois, utiliser la même liste pour tout.** Appeler `add_task(load_tasks(), …)` deux fois dans une session, réutilise le même objet liste chargé pour les deux appels, et la seconde sauvegarde écrase le travail neuf de la première. Correction : recharge (ou re-sauvegarde) à chaque frontière de commande, exactement comme le fait `main`.
- **Des dates limites comme chaînes en forme libre.** `"9/10/2026"` et `"next week"` analysent tous deux dans un `ValueError` lors du `strptime` de l'Étape 4. Correction : accepte un seul format canonique `%Y-%m-%d` et rejette tout le reste au moment de l'ajout.
- **Supprimer le fichier entre les exécutions.** Un gestionnaire de tâches qui plante sur un `tasks.json` manquant est cassé dès son premier démarrage. Le garde-fou `exists()` dans `load_tasks` est ce qui fait d'un fichier vide une liste vide.
- **Des ids devinés au lieu de dérivés.** Coder en dur `id=1` garantit une collision la deuxième fois que tu ajoutes. Dérive de `max(..., default=0) + 1` pour que le magasin soit la source unique de vérité.
- **Trier la priorité alphabétiquement.** `"high"` se trie *avant* `"medium"` comme texte mais une correction `low` se trie après les deux, le mauvais ordre pour une liste de choses à faire. Trie toujours à travers une carte explicite `PRIORITY_ORDER`.

## Ce que tu viens de construire

Un vrai gestionnaire de tâches fonctionnel qui survit aux redémarrages : modélisation par dataclass, persistance JSON, listing trié par priorité, filtres de projet, terminaison, détection de dépassement, et un rendu de tableau kanban, toute l'application dans un seul script de bibliothèque standard que tu exécuteras vraiment. La compétence transférable est la *persistance* : le trio charger/modifier/sauvegarder derrière `tasks.json` est la même forme derrière tes futurs fichiers de configuration, apps de notes, et tout « fais survivre mes changements à un redémarrage ».

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/task-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/task-manager) dans le dépôt du cours est une version plus complète du code ci-dessus, avec les commandes d'édition et de suppression et un tableau plus riche. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute les commandes `rm <id>` et `edit <id>` avec le même motif charger/sauvegarder, la suppression n'est qu'un filtre de liste et une sauvegarde.
- Montre « due aujourd'hui » séparément de OVERDUE en affichant la date réelle, pas juste le drapeau.
- Trie chaque colonne aussi par *date limite*, pour qu'une tâche à haute priorité en retard et une moyenne due demain se trient par pression temporelle.
- Ajoute une vue `--due` qui n'affiche que les tâches non terminées avec des dates limites, le filtre matinal par excellence une fois que tu as de vraies tâches dans le fichier.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
