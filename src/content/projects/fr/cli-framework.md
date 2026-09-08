---
title: "Constructeur de Framework CLI"
description: "Construire un framework CLI composable avec sous-commandes, aide auto-générée et support de plugins."
difficulty: "intermediate"
estimatedMinutes: 50
xpReward: 50
tags: ["cli", "argparse", "classes", "json"]
prerequisites: ["Bases de Python (variables, boucles, fonctions, classes)", "Familiarité avec les terminaux en ligne de commande"]
---

# Framework CLI

Chaque outil Python sérieux vit sur la ligne de commande. Dans ce projet, tu construiras un framework CLI réutilisable de zéro — un gestionnaire de tâches avec des sous-commandes pour ajouter, lister, supprimer et rechercher des tâches. En chemin, tu apprendras comment `argparse` analyse les arguments, comment router les sous-commandes, comment colorer la sortie du terminal, comment valider les entrées, comment charger des paramètres depuis un fichier JSON, et comment afficher des barres de progression pour les opérations lentes. Pas de frameworks tiers comme Click ou Typer — juste la bibliothèque standard de Python et quelques lignes de conception soignée.

Ce projet suppose que tu connais les bases de Python : variables, boucles, fonctions, classes et dictionnaires. Tu devrais aussi être à l'aise pour ouvrir un terminal et exécuter des scripts Python depuis la ligne de commande. C'est optionnel et non noté. Vois [Projets du monde réel](/fr/projets) pour la liste complète.

## Ce que tu vas faire

1. Analyser des arguments positionnels et optionnels avec `argparse`.
2. Construire une architecture de sous-commandes qui route des commandes comme `task add`, `task list`, `task remove` et `task search`.
3. Ajouter une sortie de terminal colorée grâce aux codes d'échappement ANSI bruts.
4. Implémenter la validation des entrées avec des messages d'erreur clairs et conviviaux.
5. Charger et sauvegarder des paramètres depuis un fichier de configuration JSON.
6. Ajouter des indicateurs de progression pour les opérations qui prennent du temps.

## Ce que tu vas construire

Un framework CLI qui :

- Analyse des arguments positionnels et optionnels
- Supporte les sous-commandes (add, list, remove, search)
- Affiche du texte coloré et une sortie formatée
- Valide les entrées avec des messages d'erreur clairs
- Charge les paramètres depuis un fichier de configuration
- Affiche des barres de progression pour les opérations longues

## Où exécuter ceci

- **En local avec `uv` (recommandé).** Les outils CLI ont besoin d'un vrai terminal — ce projet ne fonctionne pas dans les notebooks.
- **Google Colab.** Limité — tu peux tester des fonctions individuelles, mais l'expérience CLI complète exige un terminal local.
- **JupyterLite.** Ne convient pas à l'exécution de CLI.

## Configuration

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis pip, puis un environnement virtuel » — il gère les versions de Python et les dépendances ensemble.

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

Ensuite, mets en place le projet :

```bash
uv init cli-framework
cd cli-framework
```

Aucun paquet tiers n'est nécessaire — tout dans ce projet utilise la bibliothèque standard de Python.

## Étape 1 : Analyse les arguments avec argparse

### Objectif

Apprendre comment `argparse` lit la ligne de commande et convertit les chaînes brutes en un espace de noms structuré que ton code peut utiliser.

### Explication

Quand tu tapes `python task.py add "Buy milk" --priority high`, Python voit `sys.argv` comme la liste `["task.py", "add", "Buy milk", "--priority", "high"]`. `argparse` transforme cette liste en un objet nommé où tu peux accéder à `args.command == "add"`, `args.title == "Buy milk"` et `args.priority == "high"` — pas de découpage manuel de chaînes, pas d'erreurs d'index.

Les deux concepts clés sont les **arguments positionnels** (obligatoires, identifiés par leur position) et les **arguments optionnels** (des drapeaux comme `--priority` qui ont des valeurs par défaut).

### Indice de départ

Importe `argparse` et `sys`. Crée une fonction `build_parser()` qui retourne un `argparse.ArgumentParser`. Utilise `add_argument` pour définir ce que l'outil accepte. Appelle `parser.parse_args()` pour obtenir un objet espace de noms.

### Code fonctionnel

Crée un fichier appelé `task.py` :

```python
import argparse
import sys


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser for the task manager."""
    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    parser.add_argument(
        "title",
        nargs="?",
        help="Task title (interactive prompt if omitted)",
    )
    parser.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default="medium",
        help="Task priority (default: medium)",
    )
    parser.add_argument(
        "-c", "--category",
        default="general",
        help="Task category (default: general)",
    )
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.title:
        print(f"Task:      {args.title}")
        print(f"Priority:  {args.priority}")
        print(f"Category:  {args.category}")
    else:
        title = input("Enter task title: ").strip()
        if not title:
            print("Error: title cannot be empty.")
            sys.exit(1)
        print(f"Task:      {title}")
        print(f"Priority:  {args.priority}")
        print(f"Category:  {args.category}")


if __name__ == "__main__":
    main()
```

### Résultat attendu

Exécute depuis le terminal :

```bash
python task.py "Buy milk" --priority high --category shopping
```

```
Task:      Buy milk
Priority:  high
Category:  shopping
```

Omet le titre pour déclencher l'invite interactive :

```bash
python task.py -p low
```

```
Enter task title: Clean the garage
Task:      Clean the garage
Priority:  low
Category:  general
```

Passe `--help` pour voir le texte d'aide auto-généré :

```bash
python task.py --help
```

```
usage: task [-h] [-p {low,medium,high}] [-c CATEGORY] [title]

A simple task manager from the command line.

positional arguments:
  title                 Task title (interactive prompt if omitted)

options:
  -h, --help            show this help message and exit
  -p {low,medium,high}, --priority {low,medium,high}
                        Task priority (default: medium)
  -c CATEGORY, --category CATEGORY
                        Task category (default: general)
```

### Dépannage

**Erreur « unrecognized arguments ».** Tu as passé un drapeau avant un argument positionnel dans le mauvais ordre, ou tu as mal orthographié un nom de drapeau. Exécute `python task.py --help` pour voir les options valides.

**`title` est toujours `None`.** Le `nargs="?"` rend l'argument positionnel optionnel. Si tu le veux obligatoire, retire `nargs="?"` et la vérification `if args.title`.

**Le drapeau de priorité accepte des valeurs invalides.** La contrainte `choices=["low", "medium", "high"]` rejette tout le reste. Si tu as besoin de priorités personnalisées, utilise `type=str` au lieu de `choices`.

### Liste de vérification

- `python task.py "Write report" --priority high` affiche le titre, la priorité et la catégorie.
- `python task.py --help` affiche un message d'aide formaté avec tous les drapeaux.
- `python task.py -p low` sans titre invite l'utilisateur à saisir une entrée.
- Les valeurs de priorité invalides comme `--priority urgent` produisent une erreur claire.
- `python task.py` sans arguments et sans stdin déclenche l'invite.

### Question socratique

Pourquoi `argparse` gère-t-il automatiquement le drapeau `--help` ? Que devrais-tu écrire à la main si tu devais analyser `sys.argv` toi-même et détecter `-h` ou `--help` ?

## Étape 2 : Construis les sous-commandes

### Objectif

Étendre l'analyseur pour supporter plusieurs commandes — `add`, `list`, `remove`, `search` — chacune avec ses propres arguments, toutes routées via un point d'entrée unique.

### Explication

Les vrais outils CLI ne déversent pas tout dans un seul analyseur. Ils utilisent des sous-commandes : `git commit`, `docker run`, `pip install`. `argparse` supporte ceci avec `add_subparsers()`. Chaque sous-analyseur est son propre mini-analyseur avec ses propres arguments, mais ils vivent tous sous un parent unique. Le paramètre `dest="command"` stocke quelle sous-commande a été choisie.

### Indice de départ

Dans `build_parser()`, appelle `parser.add_subparsers(dest="command")`. Ajoute ensuite chaque sous-commande avec `sub.add_parser("add", ...)`. Donne à chaque sous-analyseur ses propres arguments. Dans `main()`, branche sur `args.command` pour distribuer au bon gestionnaire.

### Code fonctionnel

Remplace le contenu de `task.py` par :

```python
import argparse
import sys
import json
from datetime import datetime


TASKS_FILE = "tasks.json"


def load_tasks() -> list[dict]:
    """Load tasks from the JSON file."""
    try:
        with open(TASKS_FILE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_tasks(tasks: list[dict]) -> None:
    """Save tasks to the JSON file."""
    with open(TASKS_FILE, "w") as f:
        json.dump(tasks, f, indent=2)


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser with subcommands."""
    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # add
    add_p = sub.add_parser("add", help="Add a new task")
    add_p.add_argument("title", help="Task title")
    add_p.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default="medium",
        help="Task priority (default: medium)",
    )
    add_p.add_argument(
        "-c", "--category",
        default="general",
        help="Task category (default: general)",
    )

    # list
    list_p = sub.add_parser("list", help="List all tasks")
    list_p.add_argument(
        "--category",
        help="Filter by category",
    )
    list_p.add_argument(
        "--priority",
        choices=["low", "medium", "high"],
        help="Filter by priority",
    )
    list_p.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Maximum number of tasks to show (0 = all)",
    )

    # remove
    remove_p = sub.add_parser("remove", help="Remove a task by index")
    remove_p.add_argument("index", type=int, help="Task index (from list)")

    # search
    search_p = sub.add_parser("search", help="Search tasks by keyword")
    search_p.add_argument("keyword", help="Search term")

    return parser


def cmd_add(args):
    """Add a new task."""
    tasks = load_tasks()
    task = {
        "title": args.title,
        "priority": args.priority,
        "category": args.category,
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)
    print(f"Added: {task['title']} [{task['priority']}]")


def cmd_list(args):
    """List tasks with optional filters."""
    tasks = load_tasks()
    if not tasks:
        print("No tasks found.")
        return

    if args.category:
        tasks = [t for t in tasks if t["category"] == args.category]
    if args.priority:
        tasks = [t for t in tasks if t["priority"] == args.priority]
    if args.limit > 0:
        tasks = tasks[: args.limit]

    if not tasks:
        print("No tasks match the filters.")
        return

    print(f"\n  {'#':<4} {'Title':<30} {'Priority':<10} {'Category':<12} {'Status'}")
    print(f"  {'─'*4} {'─'*30} {'─'*10} {'─'*12} {'─'*10}")
    for i, t in enumerate(tasks, 1):
        status = "done" if t["done"] else "open"
        print(f"  {i:<4} {t['title']:<30} {t['priority']:<10} {t['category']:<12} {status}")
    print()


def cmd_remove(args):
    """Remove a task by its index."""
    tasks = load_tasks()
    if not tasks:
        print("No tasks to remove.")
        return

    idx = args.index - 1
    if idx < 0 or idx >= len(tasks):
        print(f"Error: index {args.index} is out of range (1-{len(tasks)}).")
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"Removed: {removed['title']}")


def cmd_search(args):
    """Search tasks by keyword in the title."""
    tasks = load_tasks()
    keyword = args.keyword.lower()
    matches = [t for t in tasks if keyword in t["title"].lower()]

    if not matches:
        print(f"No tasks contain '{args.keyword}'.")
        return

    print(f"\n  Found {len(matches)} task(s) matching '{args.keyword}':")
    for i, t in enumerate(matches, 1):
        print(f"  {i}. {t['title']} [{t['priority']}]")
    print()


def main():
    parser = build_parser()
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
```

### Résultat attendu

```bash
python task.py add "Buy milk" --priority high --category shopping
python task.py add "Write report" --category work
python task.py add "Clean garage" --priority low --category home
```

```
Added: Buy milk [high]
Added: Write report [medium]
Added: Clean garage [low]
```

```bash
python task.py list
```

```
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Buy milk                       high       shopping     open
  2    Write report                   medium     work         open
  3    Clean garage                   low        home         open
```

```bash
python task.py list --category work --priority medium
```

```
  Found 1 task(s):
  1. Write report [medium]
```

```bash
python task.py search milk
```

```
  Found 1 task(s) matching 'milk':
  1. Buy milk [high]
```

```bash
python task.py remove 2
```

```
Removed: Write report
```

```bash
python task.py list
```

```
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Buy milk                       high       shopping     open
  2    Clean garage                   low        home         open
```

### Dépannage

**Erreur « the following arguments are required: command ».** Tu as oublié le nom de la sous-commande. Chaque invocation doit commencer par une sous-commande : `python task.py add ...`, pas `python task.py ...`.

**Index hors limites lors de la suppression.** La commande `remove` utilise un indexage basé sur 1 (correspondant à ce que l'utilisateur voit dans `list`). Si tu passes `0` ou un nombre supérieur au nombre de tâches, tu obtiens une erreur claire. Vérifie la sortie de `list` pour confirmer le bon index.

**Erreur de décodage JSON au démarrage.** Si `tasks.json` contient du JSON invalide (peut-être l'as-tu édité à la main), la fonction `load_tasks` retourne une liste vide et repart de zéro. Pour récupérer, supprime le fichier et ré-ajoute les tâches.

**Les filtres ne retournent rien.** `--category work` est sensible à la casse. Une tâche avec la catégorie « Work » ne correspondra pas à « work ». Considère l'ajout d'une normalisation `.lower()` dans le filtre si tu veux une correspondance insensible à la casse.

### Liste de vérification

- `python task.py add "Test" --priority high` crée une tâche et confirme avec une sortie.
- `python task.py list` affiche toutes les tâches dans un tableau formaté.
- `python task.py list --category work` affiche uniquement les tâches de la catégorie « work ».
- `python task.py remove 1` supprime la première tâche et confirme le titre.
- `python task.py remove 99` affiche une erreur claire de dépassement de plage.
- `python task.py search keyword` trouve les tâches dont les titres correspondent.
- Les tâches persistent d'une commande à l'autre — ajoute-en trois, liste-les, et les trois apparaissent.

### Question socratique

Pourquoi la fonction `load_tasks` retourne-t-elle une liste vide sur `FileNotFoundError` au lieu de planter ? Quel pattern de conception cela représente-t-il — et comment cela change-t-il l'expérience utilisateur quand l'utilisateur exécute l'outil pour la première fois ?

## Étape 3 : Ajoute une sortie colorée

### Objectif

Rendre la sortie du terminal visuellement distincte en enveloppant le texte dans des codes de couleur ANSI — pour que les priorités, les statuts et les erreurs soient instantanément reconnaissables.

### Explication

Les terminaux interprètent des séquences d'échappement spéciales comme des commandes de couleur. La séquence `\033[91m` dit au terminal de passer au texte rouge, et `\033[0m` rétablit la valeur par défaut. En enveloppant la sortie dans ces codes, tu fais apparaître les tâches à haute priorité en rouge, les tâches à basse priorité en sombre, et les messages de succès en vert — sans aucune bibliothèque tierce.

### Indice de départ

Définis une classe `Color` avec des constantes de chaînes au niveau de la classe pour chaque couleur. Écris une fonction d'aide `colored(text, color)` qui enveloppe le texte dans les codes d'échappement. Utilise-la dans tes fonctions `cmd_list` et `cmd_add` pour surligner différentes parties de la sortie.

### Code fonctionnel

Ajoute la classe `Color` et la fonction `colored` suivantes en haut de `task.py`, après les imports :

```python
class Color:
    """ANSI color codes for terminal output."""
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def colored(text: str, color: str) -> str:
    """Wrap text in an ANSI color code."""
    return f"{color}{text}{Color.RESET}"
```

Maintenant, mets à jour `cmd_add` pour utiliser les couleurs :

```python
def cmd_add(args):
    """Add a new task with colored confirmation."""
    tasks = load_tasks()
    task = {
        "title": args.title,
        "priority": args.priority,
        "category": args.category,
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }
    p_color = priority_colors.get(args.priority, "")
    print(f"  {colored('+', Color.GREEN)} {task['title']} [{colored(args.priority, p_color)}]")
```

Mets à jour `cmd_list` pour coder en couleur les priorités et le statut :

```python
def cmd_list(args):
    """List tasks with colored output."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks found.", Color.DIM))
        return

    if args.category:
        tasks = [t for t in tasks if t["category"] == args.category]
    if args.priority:
        tasks = [t for t in tasks if t["priority"] == args.priority]
    if args.limit > 0:
        tasks = tasks[: args.limit]

    if not tasks:
        print(colored("  No tasks match the filters.", Color.DIM))
        return

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }

    print()
    header = f"  {'#':<4} {'Title':<30} {'Priority':<10} {'Category':<12} {'Status'}"
    print(colored(header, Color.BOLD))
    print(f"  {'─'*4} {'─'*30} {'─'*10} {'─'*12} {'─'*10}")

    for i, t in enumerate(tasks, 1):
        status = colored("done", Color.GREEN) if t["done"] else colored("open", Color.CYAN)
        p_color = priority_colors.get(t["priority"], "")
        p_display = colored(t["priority"], p_color)
        print(f"  {i:<4} {t['title']:<30} {p_display:<19} {t['category']:<12} {status}")
    print()
```

Mets à jour `cmd_remove` pour colorer la confirmation :

```python
def cmd_remove(args):
    """Remove a task with colored confirmation."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks to remove.", Color.DIM))
        return

    idx = args.index - 1
    if idx < 0 or idx >= len(tasks):
        print(colored(f"  Error: index {args.index} is out of range (1-{len(tasks)}).", Color.RED))
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"  {colored('-', Color.RED)} {removed['title']}")
```

Mets à jour `cmd_search` pour surligner les correspondances :

```python
def cmd_search(args):
    """Search tasks and highlight matches."""
    tasks = load_tasks()
    keyword = args.keyword.lower()
    matches = [t for t in tasks if keyword in t["title"].lower()]

    if not matches:
        print(colored(f"  No tasks contain '{args.keyword}'.", Color.DIM))
        return

    print(f"\n  {colored('Found', Color.GREEN)} {len(matches)} task(s) matching '{args.keyword}':")
    for i, t in enumerate(matches, 1):
        print(f"  {i}. {colored(t['title'], Color.CYAN)} [{t['priority']}]")
    print()
```

### Résultat attendu

```bash
python task.py add "Deploy to production" --priority high --category work
python task.py add "Read a book" --priority low --category personal
python task.py list
```

```
  + Deploy to production [high]
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Deploy to production           high       work         open
  2    Read a book                    low        personal     open
```

Sur un terminal qui supporte les couleurs ANSI, « high » apparaît en rouge, « low » est affaibli, « open » est en cyan, et la ligne d'en-tête est en gras. Le signe `+` est vert et le signe `-` lors de la suppression est rouge.

### Dépannage

**Les couleurs apparaissent comme des codes d'échappement bruts comme `[91m`.** Ton terminal n'interprète pas les codes ANSI. Essaie `export TERM=xterm-256color` avant d'exécuter. Sur Windows, utilise Windows Terminal ou PowerShell 7+ — l'ancien `cmd.exe` ne supporte pas ANSI par défaut.

**Les couleurs apparaissent dans les fichiers mais pas dans le terminal.** Tu rediriges peut-être la sortie vers un fichier (`python task.py list > output.txt`). Les codes ANSI sont destinés aux terminaux interactifs uniquement. Si tu dois écrire dans des fichiers, retire les codes ou utilise un drapeau comme `--no-color`.

**La fonction `colored` retourne une chaîne vide.** Vérifie que tu passes une constante de `Color`, pas un attribut de `Color` qui n'existe pas. Par exemple, `Color.RED` fonctionne, mais `Color.rED` non.

**Le texte en gras ne paraît pas gras.** Certains thèmes de terminal remplacent le gras ANSI par une teinte plus claire au lieu d'un vrai gras. Essaie un autre thème de terminal ou utilise `\033[1m` combiné à un code de couleur pour l'emphase.

### Liste de vérification

- Les tâches à haute priorité s'affichent en rouge dans la sortie de la liste.
- Les tâches à basse priorité sont affaiblies.
- La confirmation d'ajout `+` est verte.
- La confirmation de suppression `-` est rouge.
- La ligne d'en-tête du tableau est en gras.
- Le libellé de statut « open » est en cyan.
- Exécuter `python task.py list > out.txt` produit un fichier sans séquences d'échappement si la sortie passe par un outil qui les retire, ou avec les séquences d'échappement si le pipe les conserve — dans les deux cas, l'outil ne plante pas.

### Question socratique

Pourquoi les codes de couleur ne devraient-ils être appliqués qu'à la sortie du terminal et jamais écrits dans des fichiers journaux ou des fichiers de données ? Que se passe-t-il si un utilisateur redirige ta sortie colorée vers `less`, `grep` ou un analyseur de journaux CI/CD ?

## Étape 4 : Validation des entrées

### Objectif

Rejeter les mauvaises entrées tôt avec des messages d'erreur clairs et actionnables au lieu de laisser des données invalides corrompre ta liste de tâches.

### Explication

La validation des entrées est la frontière entre l'erreur de l'utilisateur et l'échec du programme. Une tâche avec un titre vide, une priorité hors de l'ensemble autorisé, ou une catégorie avec des caractères spéciaux devrait être attrapée *avant* d'être sauvegardée. Le but est de produire des messages d'erreur qui disent exactement à l'utilisateur ce qui ne va pas et comment le corriger — pas de tracebacks, pas de corruption silencieuse.

### Indice de départ

Écris une fonction `validate_task_input(title, priority, category)` qui vérifie chaque champ. Lève une `ValueError` avec un message descriptif pour toute entrée invalide. Appelle-la au début de `cmd_add` avant de sauvegarder.

### Code fonctionnel

Ajoute une fonction de validation et mets à jour `cmd_add` :

```python
def validate_task_input(title: str, priority: str, category: str) -> None:
    """Validate task fields before saving. Raises ValueError on failure."""
    if not title or not title.strip():
        raise ValueError("Title cannot be empty or whitespace.")
    if len(title) > 200:
        raise ValueError(f"Title is too long ({len(title)} chars, max 200).")
    if priority not in ("low", "medium", "high"):
        raise ValueError(f"Invalid priority '{priority}'. Use: low, medium, high.")
    if not category or not category.strip():
        raise ValueError("Category cannot be empty.")
    if len(category) > 50:
        raise ValueError(f"Category is too long ({len(category)} chars, max 50).")
    # Check for characters that break JSON storage or display
    forbidden = set('/\\:"*?<>|')
    bad_chars = set(category) & forbidden
    if bad_chars:
        raise ValueError(
            f"Category contains invalid characters: {''.join(bad_chars)}"
        )


def cmd_add(args):
    """Add a new task with input validation."""
    try:
        validate_task_input(args.title, args.priority, args.category)
    except ValueError as e:
        print(colored(f"  Error: {e}", Color.RED))
        sys.exit(1)

    tasks = load_tasks()
    task = {
        "title": args.title.strip(),
        "priority": args.priority,
        "category": args.category.strip(),
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }
    p_color = priority_colors.get(args.priority, "")
    print(f"  {colored('+', Color.GREEN)} {task['title']} [{colored(args.priority, p_color)}]")
```

Valide aussi l'index de `remove` dans `cmd_remove` :

```python
def cmd_remove(args):
    """Remove a task with input validation."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks to remove.", Color.DIM))
        return

    if args.index < 1:
        print(colored("  Error: index must be 1 or greater.", Color.RED))
        sys.exit(1)

    idx = args.index - 1
    if idx >= len(tasks):
        print(colored(
            f"  Error: index {args.index} is out of range (1-{len(tasks)}).",
            Color.RED,
        ))
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"  {colored('-', Color.RED)} {removed['title']}")
```

### Résultat attendu

```bash
python task.py add "" --priority high
```

```
  Error: Title cannot be empty or whitespace.
```

```bash
python task.py add "A" * 50 --priority extreme
```

```
  Error: Invalid priority 'extreme'. Use: low, medium, high.
```

```bash
python task.py add "Valid task" --category "work/special"
```

```
  Error: Category contains invalid characters: /
```

```bash
python task.py remove 0
```

```
  Error: index must be 1 or greater.
```

```bash
python task.py remove 999
```

```
  Error: index 999 is out of range (1-3).
```

Une entrée valide passe proprement :

```bash
python task.py add "Write documentation" --priority medium --category work
```

```
  + Write documentation [medium]
```

### Dépannage

**La validation passe mais les données sont corrompues.** Assure-toi que `validate_task_input` est appelée *avant* que la tâche soit ajoutée à la liste. Si tu valides après l'ajout, les mauvaises données sont déjà sauvegardées.

**Le message d'erreur est coupé.** Si le titre est très long, le message d'erreur inclut le nombre de caractères. C'est intentionnel — il dit exactement à l'utilisateur de combien il doit le raccourcir.

**`strip()` retire des espaces utiles.** Si un utilisateur saisit intentionnellement un titre avec des espaces de tête, `strip()` les retire. C'est habituellement le bon comportement pour un titre de tâche, mais si tu dois préserver les espaces, retire les appels `.strip()` et documente la politique.

**La validation de catégorie est trop stricte.** La liste des caractères interdits est prudente. Si tu as besoin de catégories avec des barres obliques (comme « work/urgent »), ajuste la validation pour autoriser `/` mais interdire `\`, `"` et les autres caractères qui cassent le JSON.

### Liste de vérification

- Un titre vide produit une erreur claire, pas un traceback.
- Un titre de plus de 200 caractères est rejeté avec le nombre de caractères.
- Les valeurs de priorité invalides sont rejetées avec la liste des options valides.
- Une catégorie vide produit une erreur.
- Une catégorie contenant des caractères interdits (`/`, `\`, `"`, etc.) est rejetée.
- Supprimer l'index 0 produit un message d'erreur utile.
- Supprimer un index supérieur au nombre de tâches affiche la plage valide.
- Une entrée valide est sauvegardée correctement et confirmée avec une sortie.

### Question socratique

Pourquoi est-il préférable de valider l'entrée à la frontière (quand l'utilisateur la fournit) plutôt qu'au fond de la fonction de sauvegarde ? Que devient la difficulté de débogage si la validation et le stockage sont entremêlés ?

## Étape 5 : Prise en charge du fichier de configuration

### Objectif

Laisser les utilisateurs personnaliser le comportement par défaut — priorité par défaut, catégorie par défaut, préférences de couleur — en chargeant les paramètres depuis un fichier JSON.

### Explication

Les valeurs par défaut codées en dur fonctionnent pour une démo, mais les vrais outils ont besoin de configuration. Un fichier de config JSON laisse les utilisateurs définir leurs préférences une fois et les oublier. Le pattern est : chercher un fichier de config à un chemin connu, le charger s'il existe, l'utiliser pour définir les valeurs par défaut, et revenir aux valeurs intégrées si le fichier est absent ou incomplet.

### Indice de départ

Écris une classe `Config` qui charge `~/.taskconfig.json` (ou un chemin que tu spécifies). La méthode `get(key, default)` retourne la valeur de config ou la valeur par défaut. Appelle-la dans `build_parser` pour écraser les valeurs par défaut de `--priority` et `--category`.

### Code fonctionnel

Ajoute une classe `Config` et branche-la dans le CLI :

```python
import os
from pathlib import Path


DEFAULT_CONFIG_PATH = Path.home() / ".taskconfig.json"

DEFAULT_SETTINGS = {
    "default_priority": "medium",
    "default_category": "general",
    "colors_enabled": True,
    "date_format": "%Y-%m-%d",
}


class Config:
    """Load and access settings from a JSON config file."""

    def __init__(self, path: str | Path | None = None):
        self.path = Path(path) if path else DEFAULT_CONFIG_PATH
        self.settings: dict = {}
        self.load()

    def load(self) -> None:
        """Load settings from disk, falling back to defaults."""
        self.settings = dict(DEFAULT_SETTINGS)
        if self.path.exists():
            try:
                with open(self.path) as f:
                    user_settings = json.load(f)
                self.settings.update(user_settings)
            except (json.JSONDecodeError, KeyError) as e:
                print(colored(f"  Warning: config file error ({e}), using defaults.", Color.YELLOW))

    def save(self) -> None:
        """Save current settings to disk."""
        with open(self.path, "w") as f:
            json.dump(self.settings, f, indent=2)

    def get(self, key: str, default=None):
        """Get a setting value with a fallback default."""
        return self.settings.get(key, default)


def build_parser(config: Config | None = None) -> argparse.ArgumentParser:
    """Build the argument parser, optionally using config for defaults."""
    default_priority = config.get("default_priority", "medium") if config else "medium"
    default_category = config.get("default_category", "general") if config else "general"

    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # add
    add_p = sub.add_parser("add", help="Add a new task")
    add_p.add_argument("title", help="Task title")
    add_p.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default=default_priority,
        help=f"Task priority (default: {default_priority})",
    )
    add_p.add_argument(
        "-c", "--category",
        default=default_category,
        help=f"Task category (default: {default_category})",
    )

    # list
    list_p = sub.add_parser("list", help="List all tasks")
    list_p.add_argument("--category", help="Filter by category")
    list_p.add_argument(
        "--priority",
        choices=["low", "medium", "high"],
        help="Filter by priority",
    )
    list_p.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Maximum number of tasks to show (0 = all)",
    )

    # remove
    remove_p = sub.add_parser("remove", help="Remove a task by index")
    remove_p.add_argument("index", type=int, help="Task index (from list)")

    # search
    search_p = sub.add_parser("search", help="Search tasks by keyword")
    search_p.add_argument("keyword", help="Search term")

    # config (new subcommand)
    cfg_p = sub.add_parser("config", help="Show or update configuration")
    cfg_p.add_argument(
        "--show",
        action="store_true",
        help="Show current configuration",
    )
    cfg_p.add_argument(
        "--set",
        nargs=2,
        metavar=("KEY", "VALUE"),
        help="Set a configuration value",
    )
    cfg_p.add_argument(
        "--init",
        action="store_true",
        help="Create a default config file",
    )

    return parser
```

Ajoute le gestionnaire de la sous-commande config :

```python
def cmd_config(args, config: Config):
    """Handle the config subcommand."""
    if args.init:
        if config.path.exists():
            print(colored(f"  Config already exists at {config.path}", Color.YELLOW))
        else:
            config.save()
            print(f"  Created config at {config.path}")
    elif args.show:
        print(f"\n  {colored('Configuration', Color.BOLD)} ({config.path})")
        print(f"  {'─' * 40}")
        for key, value in sorted(config.settings.items()):
            print(f"  {key:<25} {value}")
        print()
    elif args.set:
        key, value = args.set
        if key not in config.settings:
            print(colored(f"  Unknown setting: {key}", Color.RED))
            print(f"  Valid settings: {', '.join(sorted(config.settings.keys()))}")
            sys.exit(1)
        # Type-coerce value to match the default's type
        default = config.settings[key]
        if isinstance(default, bool):
            value = value.lower() in ("true", "1", "yes")
        elif isinstance(default, int):
            value = int(value)
        config.settings[key] = value
        config.save()
        print(f"  Set {key} = {value}")
    else:
        print(colored("  Use --show, --set KEY VALUE, or --init.", Color.DIM))
```

Mets à jour `main()` pour créer la config et la faire passer :

```python
def main():
    config = Config()
    parser = build_parser(config)
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
    }

    if args.command == "config":
        cmd_config(args, config)
    else:
        commands[args.command](args)
```

### Résultat attendu

Initialise un fichier de config :

```bash
python task.py config --init
```

```
  Created config at /home/you/.taskconfig.json
```

Vois la config :

```bash
python task.py config --show
```

```
  Configuration (/home/you/.taskconfig.json)
  ────────────────────────────────────────
  colors_enabled            True
  date_format               %Y-%m-%d
  default_category          general
  default_priority          medium
```

Change la priorité par défaut :

```bash
python task.py config --set default_priority high
```

```
  Set default_priority = high
```

Les nouvelles tâches utilisent maintenant la valeur par défaut configurée :

```bash
python task.py add "Urgent task"
```

```
  + Urgent task [high]
```

Si le fichier de config contient du JSON invalide, l'outil avertit et continue avec les valeurs par défaut :

```bash
echo "not json" > ~/.taskconfig.json
python task.py config --show
```

```
  Warning: config file error (...), using defaults.

  Configuration (/home/you/.taskconfig.json)
  ────────────────────────────────────────
  colors_enabled            True
  date_format               %Y-%m-%d
  default_category          general
  default_priority          medium
```

### Dépannage

**Fichier de config introuvable sur Windows.** `Path.home()` retourne `C:\Users\YourName` sur Windows. Le chemin `~/.taskconfig.json` se traduit correctement, mais si tu exécutes dans un conteneur ou WSL, le dossier personnel peut différer. Affiche `config.path` pour voir le chemin réel.

**La conversion de type échoue.** Si tu définis `default_priority` à `3` (une chaîne), elle reste une chaîne au lieu de devenir un entier. La logique de conversion vérifie le type de la valeur *par défaut* — si la valeur par défaut est une chaîne, la nouvelle valeur reste une chaîne. C'est intentionnel : tu ne peux pas changer un paramètre de type chaîne en entier via `--set`.

**Le fichier de config est écrasé à chaque sauvegarde.** La méthode `save` écrit tout le dictionnaire de paramètres. Si tu ajoutes manuellement des clés personnalisées, elles seront perdues à la prochaine sauvegarde. Seules les clés de `DEFAULT_SETTINGS` sont préservées.

**Erreur de permissions lors de l'écriture dans le dossier personnel.** Sur certains systèmes, le dossier personnel a des permissions strictes. Vérifie avec `ls -la ~` et assure-toi que ton utilisateur peut y écrire des fichiers.

### Liste de vérification

- `python task.py config --init` crée `~/.taskconfig.json` avec les valeurs par défaut.
- `python task.py config --show` affiche tous les paramètres avec leurs valeurs actuelles.
- `python task.py config --set default_priority low` met à jour le fichier.
- Après avoir changé `default_priority`, `python task.py add "Task"` utilise la nouvelle valeur par défaut.
- Un fichier de config corrompu produit un avertissement, pas un crash.
- Les noms de paramètres inconnus produisent une erreur avec la liste des clés valides.
- `python task.py add "Task"` sans fichier de config fonctionne avec les valeurs par défaut intégrées.

### Question socratique

Pourquoi le chargeur de config revient-il aux valeurs par défaut au lieu d'exiger que l'utilisateur répare le fichier ? Quel compromis cela fait-il entre robustesse et exactitude des données ?

## Étape 6 : Indicateurs de progression

### Objectif

Afficher une barre de progression pour les opérations qui prennent du temps — chargement, filtrage ou travail simulé — pour que l'utilisateur sache que l'outil fait quelque chose plutôt que d'être bloqué.

### Explication

Une barre de progression est un retour visuel. Elle dit à l'utilisateur combien de travail est fait et combien reste. Pour un gestionnaire de tâches, le cas d'usage le plus réaliste est les opérations en masse : importer des tâches depuis un fichier, exécuter une recherche sur un grand jeu de données, ou simuler une opération lente à des fins d'apprentissage. La technique est simple : imprimer une ligne avec `\r` (retour chariot) pour la réécrire au fur et à mesure que la progression se met à jour.

### Indice de départ

Écris une classe `ProgressBar` qui suit `current` et `total`. La méthode `update()` calcule le pourcentage, dessine une barre de caractères `#` et `-`, et l'affiche sur la même ligne en utilisant `\r`. Ajoute une méthode `finish()` qui affiche un saut de ligne quand c'est terminé.

### Code fonctionnel

Ajoute une classe `ProgressBar` et utilise-la dans une simulation d'import en masse :

```python
import time


class ProgressBar:
    """A simple terminal progress bar."""

    def __init__(self, total: int, label: str = "Progress"):
        self.total = total
        self.current = 0
        self.label = label
        self.bar_width = 30

    def update(self, increment: int = 1) -> None:
        """Advance the progress bar by the given amount."""
        self.current = min(self.current + increment, self.total)
        percent = self.current / self.total if self.total > 0 else 1
        filled = int(self.bar_width * percent)
        bar = "#" * filled + "-" * (self.bar_width - filled)
        sys.stdout.write(f"\r  {self.label}: [{bar}] {self.current}/{self.total}")
        sys.stdout.flush()

    def finish(self) -> None:
        """Complete the progress bar and print a newline."""
        self.current = self.total
        self.update(0)
        sys.stdout.write("\n")
        sys.stdout.flush()
```

Ajoute une sous-commande `cmd_import` et un générateur de fichier de données d'exemple :

```python
def generate_sample_data(filename: str, count: int = 50) -> None:
    """Generate a sample tasks file for import."""
    import random

    titles = [
        "Review pull request", "Write documentation", "Fix login bug",
        "Deploy to staging", "Update dependencies", "Run test suite",
        "Clean up unused imports", "Refactor database queries",
        "Add error handling", "Write unit tests",
    ]
    priorities = ["low", "medium", "high"]
    categories = ["work", "personal", "urgent", "learning"]

    tasks = []
    for _ in range(count):
        tasks.append({
            "title": random.choice(titles),
            "priority": random.choice(priorities),
            "category": random.choice(categories),
        })

    with open(filename, "w") as f:
        json.dump(tasks, f, indent=2)
```

Ajoute la sous-commande d'import dans `build_parser` :

```python
    # import (new subcommand)
    import_p = sub.add_parser("import", help="Import tasks from a JSON file")
    import_p.add_argument("file", help="JSON file with tasks to import")
    import_p.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be imported without saving",
    )
```

Ajoute le gestionnaire d'import :

```python
def cmd_import(args):
    """Import tasks from a JSON file with a progress bar."""
    try:
        with open(args.file) as f:
            new_tasks = json.load(f)
    except FileNotFoundError:
        print(colored(f"  Error: file '{args.file}' not found.", Color.RED))
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(colored(f"  Error: invalid JSON in '{args.file}': {e}", Color.RED))
        sys.exit(1)

    if not isinstance(new_tasks, list):
        print(colored("  Error: expected a JSON array of tasks.", Color.RED))
        sys.exit(1)

    print(f"  Importing {len(new_tasks)} tasks from {args.file}...")
    progress = ProgressBar(len(new_tasks), label="Importing")

    existing = load_tasks() if not args.dry_run else []
    imported = 0

    for task in new_tasks:
        # Validate each task before importing
        try:
            validate_task_input(
                task.get("title", ""),
                task.get("priority", "medium"),
                task.get("category", "general"),
            )
            cleaned = {
                "title": task["title"].strip(),
                "priority": task.get("priority", "medium"),
                "category": task.get("category", "general"),
                "created_at": task.get("created_at", datetime.now().isoformat()),
                "done": task.get("done", False),
            }
            if not args.dry_run:
                existing.append(cleaned)
            imported += 1
        except ValueError as e:
            print(f"\n  {colored('Skipped', Color.YELLOW)}: {task.get('title', '?')} — {e}")
        progress.update()

    progress.finish()

    if not args.dry_run:
        save_tasks(existing)

    status = "would import" if args.dry_run else "imported"
    print(f"  {colored('Done!', Color.GREEN)} {status} {imported}/{len(new_tasks)} tasks.")
```

Ajoute `import` au dictionnaire de commandes dans `main()` :

```python
def main():
    config = Config()
    parser = build_parser(config)
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
        "import": cmd_import,
    }

    if args.command == "config":
        cmd_config(args, config)
    else:
        commands[args.command](args)
```

### Résultat attendu

Génère un fichier de données d'exemple :

```bash
python -c "
import json, random
titles = ['Review PR', 'Write docs', 'Fix bug', 'Deploy', 'Refactor']
priorities = ['low', 'medium', 'high']
categories = ['work', 'personal']
tasks = [{'title': random.choice(titles), 'priority': random.choice(priorities), 'category': random.choice(categories)} for _ in range(40)]
with open('sample_tasks.json', 'w') as f:
    json.dump(tasks, f, indent=2)
print('Created sample_tasks.json with 40 tasks')
"
```

Import avec une barre de progression :

```bash
python task.py import sample_tasks.json
```

```
  Importing 40 tasks from sample_tasks.json...
  Importing: [##########################------] 34/40
```

(La barre s'anime au fur et à mesure qu'elle se remplit.)

```
  Importing: [##############################] 40/40
  Done! imported 40/40 tasks.
```

Le dry run montre ce qui se passerait sans sauvegarder :

```bash
python task.py import sample_tasks.json --dry-run
```

```
  Importing 40 tasks from sample_tasks.json...
  Importing: [##############################] 40/40
  Done! would import 40/40 tasks.
```

Les tâches avec des données invalides sont ignorées avec un avertissement :

```bash
python -c "
import json
bad = [{'title': '', 'priority': 'high'}, {'title': 'Good task', 'priority': 'low'}]
with open('bad_tasks.json', 'w') as f:
    json.dump(bad, f)
"
python task.py import bad_tasks.json
```

```
  Importing 2 tasks from bad_tasks.json...
  Skipped: ? — Title cannot be empty or whitespace.
  Importing: [##########################------] 2/2
  Done! imported 1/2 tasks.
```

### Dépannage

**La barre de progression ne s'anime pas.** `sys.stdout.write("\r...")` ne fonctionne que si stdout est un terminal. Si tu exécutes dans un panneau de sortie d'IDE ou en redirigeant vers un fichier, le caractère `\r` est traité comme littéral et la barre apparaît sur des lignes séparées. Exécute depuis un vrai terminal.

**Le texte de la barre de progression chevauche la sortie précédente.** Si tu affiches quelque chose après avoir appelé `update()` mais avant `finish()`, la ligne de la barre de progression se mélange avec la nouvelle sortie. Appelle toujours `finish()` avant d'afficher autre chose.

**L'import est trop rapide pour voir la barre de progression.** Pour les petits fichiers, l'import se termine instantanément. Pour voir la barre s'animer pendant les tests, ajoute `time.sleep(0.02)` dans la boucle d'import. Ne laisse pas le sleep dans le code de production.

**Les compteurs de la barre de progression sont faux.** Le `min()` dans `update()` empêche la barre de dépasser 100 %. Si le compte est faux, vérifie que `len(new_tasks)` correspond au nombre d'éléments dans la boucle.

### Liste de vérification

- `python task.py import sample_tasks.json` affiche une barre de progression animée qui se remplit de gauche à droite.
- La barre atteint `[##############################]` à l'achèvement.
- `--dry-run` importe sans sauvegarder dans `tasks.json`.
- Les tâches invalides dans le fichier d'import sont ignorées avec un avertissement, et le compte ne reflète que les imports valides.
- La barre de progression ne laisse pas de caractères `\r` orphelins ni de sauts de ligne supplémentaires.
- `python task.py import nonexistent.json` produit une erreur claire de fichier introuvable.

### Question socratique

Pourquoi la barre de progression utilise-t-elle `\r` (retour chariot) au lieu d'afficher une nouvelle ligne à chaque mise à jour ? À quoi ressemblerait la sortie si elle affichait 40 lignes séparées au lieu d'en réécrire une seule ?

## Défis

<details>
<summary><strong>Défi 1 : Marque les tâches comme terminées</strong></summary>

Ajoute une sous-commande `done` qui prend un index de tâche et la marque comme terminée. Mets à jour `cmd_list` pour afficher une coche ou un barré pour les tâches terminées. Gère les cas limites : tâches déjà terminées, index invalides.

</details>

<details>
<summary><strong>Défi 2 : Dates d'échéance et détection de retard</strong></summary>

Ajoute un drapeau `--due` à la sous-commande `add` qui accepte une chaîne de date (AAAA-MM-JJ). Lors de la liste des tâches, surligne les tâches en retard en rouge et les tâches dues aujourd'hui en jaune. Utilise `datetime.strptime` pour analyser les dates et les comparer à aujourd'hui.

</details>

<details>
<summary><strong>Défi 3 : Sortie d'aide colorée</strong></summary>

Remplace le formateur d'aide par défaut d'`argparse` pour produire un texte d'aide coloré. Les sous-commandes devraient apparaître en cyan, les drapeaux optionnels en jaune, et les descriptions dans la couleur par défaut. Cela exige d'écrire une sous-classe personnalisée `argparse.HelpFormatter`.

</details>

## Objectifs bonus

- [ ] Ajoute une sous-commande `stats` qui montre les comptes de tâches par priorité et par catégorie.
- [ ] Implémente l'édition de tâches : `task edit 3 --title "New title" --priority low`.
- [ ] Construis une commande `task export --format csv` qui écrit les tâches dans un fichier CSV.
- [ ] Ajoute la génération de complétions pour bash et zsh.
- [ ] Implémente une commande `task log` qui affiche un historique des opérations d'ajout/suppression.

## Ce que tu viens de construire

Un framework CLI réutilisable en Python pur : routage de sous-commandes avec `argparse`, sortie de terminal colorée grâce aux codes ANSI, validation des entrées avec des messages d'erreur clairs, prise en charge de fichiers de configuration JSON, et une barre de progression pour les opérations en masse. Chaque pièce n'utilise que la bibliothèque standard — pas de Click, pas de Typer, aucune dépendance tierce.

Les patterns ici s'étendent directement aux outils de production. Les sous-commandes `argparse` sont la façon dont `pip`, `git` et `docker` structurent leurs CLI. La validation des entrées à la frontière empêche les mauvaises données d'atteindre ta couche de stockage. Les fichiers de configuration séparent les préférences des utilisateurs du code. Les indicateurs de progression transforment les opérations opaques en opérations transparentes. Comprendre ces briques de base signifie que tu peux construire n'importe quel outil CLI — et savoir *pourquoi* chaque partie existe.

## Où aller à partir d'ici

- **Passe à Click ou Typer.** Maintenant que tu comprends les mécanismes bruts, explore comment les frameworks de plus haut niveau automatisent l'analyse des arguments, la validation et la génération d'aide. Tu apprécieras ce qu'ils font parce que tu l'as construit à la main.
- **Ajoute un backend de base de données.** Remplace le fichier JSON par SQLite pour l'accès concurrent, les requêtes et une meilleure performance sur les grandes listes de tâches.
- **Construis un système de plugins.** Charge des sous-commandes supplémentaires depuis des fichiers Python dans un dossier `plugins/`, comme dans la version originale de ce projet.
- **Ajoute un mode interactif.** Une commande `task interactive` qui lit les commandes dans une boucle — comme un REPL — sans relancer le processus à chaque fois.
- **Écris des tests.** Utilise `unittest` ou `pytest` pour tester chaque sous-commande en appelant directement les fonctions de gestion avec des espaces de noms `argparse` simulés.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur.