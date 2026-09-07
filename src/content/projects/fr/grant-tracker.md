---
title: "Suiveur de Demandes de Subventions"
description: "Gérez les demandes de subventions avec dates limites, budgets et flux de travail collaboratifs."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["data-management", "csv", "datetime", "json", "cli"]
learningObjectives:
  - Modéliser des entités du monde réel avec des dictionnaires et des listes imbriqués
  - Analyser, comparer et formater des dates pour le suivi des échéances
  - Persister et recharger des données structurées avec JSON et CSV
  - Construire une application CLI pilotée par un menu avec validation des entrées
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions)"
  - "Les dictionnaires et les listes"
---

# 🛠️ 💰 Construis un Suiveur de Demandes de Subventions

Les bureaux de recherche jonglent avec des dizaines de propositions à la fois, chacune avec un financeur, une date limite stricte, un budget, une équipe et un historique de dépenses. Ce projet construit un suiveur de subventions en ligne de commande qui modélise chaque demande comme un dictionnaire imbriqué, surveille les dépenses par rapport au budget, trie les échéances à venir et sauvegarde tout sur disque pour que ton travail survive d'une session à l'autre.

Ce projet suppose que tu maîtrises Python 101 et que tu es à l'aise avec les dictionnaires et les listes — rien de la formation Data Analysis n'est requis. Il est facultatif et non noté ; consulte [Real-World Projects](/docs/projects) pour la liste complète, qui ne cesse de s'allonger.

## 🎯 Ce que tu vas faire

1. Modéliser une demande de subvention comme un dictionnaire imbriqué contenant une équipe, un budget et un registre de dépenses.
2. Ajouter des dépenses avec validation pour qu'une proposition ne puisse jamais dépasser son budget en silence.
3. Construire un tableau de bord des échéances qui signale les demandes en retard et celles à venir, triées par urgence.
4. Tout persister en JSON et exporter un CSV ouvrable dans un tableur.
5. Piloter le tout depuis une CLI interactive pilotée par menu qui survit aux mauvaises saisies.

## Où exécuter ceci

**Localement avec `uv`** est le chemin principal — mais contrairement à la plupart des projets de cette série, celui-ci a zéro dépendance externe : tout utilise la bibliothèque standard (`datetime`, `json`, `csv`, `os`). C'est donc l'un des projets les plus accueillants pour tester pour de vrai le flux de travail local du cours : un vrai dossier de projet, un vrai script et de vrais fichiers écrits sur disque à chaque exécution.

**Google Colab, Binder et Kaggle Notebooks** l'exécutent aussi confortablement — le notebook reflète chaque étape ci-dessous et, comme aucune installation de paquet n'est nécessaire, le parcours navigateur est en pleine fidélité plutôt qu'en simulation dégradée. **JupyterLite**, l'aire de jeu dans le navigateur, exécutera aussi les étapes du modèle de données et du tableau de bord, car rien ici ne nécessite de bibliothèques natives. Un avertissement honnête : le fichier JSON que tu sauvegardes vit sur le système de fichiers éphémère du notebook dans le navigateur, donc considère ce parcours comme un essai et utilise un dossier local lorsque tu veux que les données persistent réellement entre les sessions.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/grant-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/grant-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgrant-tracker%2Fnotebook.ipynb)

## Configuration

Crée le dossier du projet. Il n'y a aucune dépendance à installer — chaque module utilisé par ce projet est fourni avec Python.

```bash
uv init grant-tracker
cd grant-tracker
```

```bash
uv run python --version
```

Chaque module utilisé par ce projet — `datetime`, `json`, `csv`, `os` — fait partie de la bibliothèque standard, donc il n'y a pas d'étape `uv add` ni de `requirements.txt` à mal configurer. C'est une fonctionnalité délibérée : le même `grant_tracker.py` s'exécute dans ton terminal, dans le notebook du cours et dans le navigateur, car aucun d'entre eux n'a besoin d'un paquet natif.

**✅ Liste de vérification**

- ✅ `uv run python --version` affiche Python 3.9 ou plus récent (le code utilise les annotations de type `list[str]`).
- ✅ `grant-tracker/` existe et `uv init grant-tracker` s'est terminé sans erreurs.
- ✅ `uv run python -c "import json, csv, datetime, os"` sort en silence — toute la chaîne d'outils est présente.

## Étape 1 : Modèle une subvention comme un dictionnaire imbriqué

Une demande de subvention est plus qu'une simple rangée de champs : elle a un budget, une équipe de personnes et une liste croissante de dépenses. La forme Python naturelle pour cela est un **dictionnaire imbriqué** — un `dict` dont les valeurs sont elles-mêmes des listes et des chaînes — car il te permet de transporter toute une demande comme un objet unique, de la passer à des fonctions et de la persister directement en JSON plus tard.

### 1.1 Écris la fabrique de subventions

**👟 Indice de départ :** Écris une fonction qui renvoie un dictionnaire de subvention entièrement formé, afin que chaque subvention que tu crées ait les mêmes clés dès le départ — la cohérence bat la commodité quand tu boucleras ensuite sur des centaines de celles-ci.

```python
# grant_tracker.py
from datetime import datetime

def create_grant(
    title: str,
    funder: str,
    deadline: str,
    total_budget: float,
    team: list[str] | None = None,
) -> dict:
    """Create a new grant application record."""
    return {
        "id": datetime.now().strftime("%Y%m%d%H%M%S"),
        "title": title,
        "funder": funder,
        "deadline": deadline,
        "total_budget": total_budget,
        "spent": 0.0,
        "team": team or [],
        "status": "draft",
        "created": datetime.now().isoformat(),
        "expenses": [],
    }

grant = create_grant(
    "NSF Career Development",
    "National Science Foundation",
    "2026-10-15",
    500000.00,
    ["Alice", "Bob"],
)
print(grant)
```

Les deux lignes qui portent la conception sont `"team": team or []` et `"expenses": []`. `team or []` ramène `None` et une liste vide au même état de départ sûr, afin que les appelants puissent ne rien passer et obtenir quand même une liste — jamais un `None` sur lequel buter plus tard. Et `"expenses": []` démarre un registre vide auquel l'étape 2 ajoutera ; le garder à l'intérieur du dictionnaire de subvention, plutôt que dans une liste globale parallèle, est ce qui rend chaque subvention autonome.

**🎯 Résultat attendu :** Un dictionnaire dont `id` et `created` correspondent à l'heure actuelle, avec `spent: 0.0`, `status: "draft"`, `team: ["Alice", "Bob"]` et `expenses: []`.

**🩹 Si ça ne marche pas :** Si `team` affiche `[]` alors que tu as passé `["Alice", "Bob"]`, tu imprimes probablement la mauvaise variable — `create_grant` *renvoie* un nouveau dict, donc réaffecte le résultat (`grant = create_grant(...)`) au lieu d'imprimer un dictionnaire stocké sous un autre nom. Si `NameError: name 'datetime' is not defined`, la ligne `from datetime import datetime` manque ou se trouve sous la fonction. Si l'indication `list[str]` elle-même génère une erreur, tu es sur un Python antérieur à 3.9 — passe au point de contrôle de version dans Configuration.

### 1.2 Crée le portefeuille que tu vas suivre

**👟 Indice de départ :** Crée trois subventions avec des financeurs, des budgets et des échéances différents — dont une dans les 30 prochains jours, pour que le tableau de bord de l'étape 3 ait une vraie variété.

```python
# grant_tracker.py (continued)
grants = [
    create_grant("NSF Career Development", "National Science Foundation", "2026-10-15", 500000.00, ["Alice", "Bob"]),
    create_grant("NIH R01 Proposal", "National Institutes of Health", "2026-11-01", 350000.00, ["Carol"]),
    create_grant("Local Community Grant", "City Foundation", "2026-09-30", 25000.00, ["Bob", "Carol"]),
]

for g in grants:
    print(f"{g['title']:28} {g['funder']:28} {g['deadline']}  ${g['total_budget']:>12,.2f}")
```

Une liste de dictionnaires est l'unité de base que prendra chaque fonction ultérieure : la trier, la filtrer, la sauvegarder. Les spécificateurs de largeur des f-strings (`:28`, `:>12`) rembourrent chaque valeur pour que les colonnes s'alignent — une petite astuce de formatage qui transforme des dictionnaires bruts en quelque chose de lisible d'un coup d'œil, sans aucune bibliothèque de rapports.

**🎯 Résultat attendu :** Trois lignes alignées, une par subvention, montrant le titre, le financeur, l'échéance et un budget formaté — par exemple `Local Community Grant      City Foundation          2026-09-30  $    25,000.00`.

**🩹 Si ça ne marche pas :** Si les colonnes se chevauchent, tes nombres de largeur sont plus petits que la valeur la plus longue — augmente `:28`. Si tu vois des budgets numériquement corrects mais étrangement espacés, c'est le séparateur de milliers `,` plus la largeur de champ qui font leur travail ; ajuste la largeur, pas la spécification de format.

### 1.3 Vérifie le modèle de données

**✅ Liste de vérification**

- ✅ `create_grant(...)` renvoie un dictionnaire avec chaque clé attendue : `id`, `title`, `funder`, `deadline`, `total_budget`, `spent`, `team`, `status`, `created`, `expenses`.
- ✅ L'appeler sans argument `team` produit `team: []`, jamais `None`.
- ✅ `grants` est une liste de trois dictionnaires et la boucle imprime trois rangées alignées.

**🤔 Question(s) socratique(s)**

- `team or []` traite `None` et `[]` de façon identique — mais que ferait-il si quelqu'un passait la *chaîne* `"Bob"` comme équipe au lieu d'une liste ? Pourquoi cela prépare-t-il un bug déroutant plus tard, et quelle vérification unique à l'intérieur de `create_grant` le détecterait ?
- L'échéance est stockée sous forme de chaîne `"2026-10-15"`, pas d'objet `datetime`. Qu'est-ce qui casse dès que tu essaies de stocker un vrai `datetime` dans un fichier JSON — et pourquoi, alors, une simple chaîne ISO est-elle la représentation la plus honnête ici ?

## Étape 2 : Garde le budget tout en suivant les dépenses

Le budget d'une subvention est une contrainte stricte : la dépense n'est légitime que tant qu'elle reste à l'intérieur de `total_budget`. Cette étape construit un registre de dépenses qui applique cette règle au moment de l'insertion, pour qu'un dépassement devienne une erreur sonore et immédiate au lieu d'un nombre négatif silencieux dans un rapport des mois plus tard.

### 2.1 Enregistre une dépense avec validation

**👟 Indice de départ :** Une fonction, trois tâches : vérifier que le montant est positif, vérifier qu'il tient dans le budget restant, et seulement ensuite l'ajouter au registre de la subvention et mettre à jour `spent`.

```python
# grant_tracker.py (continued)
def add_expense(grant: dict, description: str, amount: float, phase: str) -> dict:
    """Record an expense against a grant."""
    if amount <= 0:
        raise ValueError("Expense amount must be positive")
    if amount > grant["total_budget"] - grant["spent"]:
        raise ValueError("Expense exceeds remaining budget")

    expense = {
        "date": datetime.now().isoformat(),
        "description": description,
        "amount": amount,
        "phase": phase,
    }
    grant["expenses"].append(expense)
    grant["spent"] = round(grant["spent"] + amount, 2)
    return expense

expense = add_expense(grant, "Statistician consultation", 4500.00, "writing")
print(grant["spent"])
print(grant["expenses"][-1]["description"])
```

La validation se produit **avant** toute mutation : les deux vérifications `if` lèvent une erreur avant qu'un seul champ ne change, donc une dépense rejetée ne peut pas corrompre le total `spent` de la subvention. Cet ordre — tout vérifier, puis muter — est la même discipline que tu verras dans le code de grand livre bancaire et les transactions de base de données. Le `round(..., 2)` empêche l'arithmétique flottante (qui accumule de minuscules erreurs comme `0.1 + 0.2`) de dériver en centimes sur des centaines d'entrées.

**🎯 Résultat attendu :** Affiche `4500.0`, puis `Statistician consultation`. Appeler `add_expense(grant, "Over", 999999, "writing")` lève `ValueError: Expense exceeds remaining budget` et laisse `spent` intact.

**🩹 Si ça ne marche pas :** Si une dépense trop grande *ajoute* à `spent` au lieu de lever une erreur, le second `if` manque ou le `raise` se produit après la mutation. Si tu vois `4500.0` là où tu attendais `4500.00`, c'est l'affichage flottant, pas un bug — imprime `f"{grant['spent']:.2f}"`. Si tu obtiens `KeyError: 'spent'`, le dictionnaire que tu passes n'a pas été construit par `create_grant` (étape 1), donc ses clés ne correspondent pas.

### 2.2 Résume l'état du budget

**👟 Indice de départ :** Écris une fonction *pure* qui lit une subvention et renvoie son instantané budgétaire — total, dépensé, restant, pourcentage utilisé — pour que chaque écran ultérieur affiche des nombres identiques.

```python
# grant_tracker.py (continued)
def budget_summary(grant: dict) -> dict:
    """Return a budget summary for a single grant."""
    remaining = round(grant["total_budget"] - grant["spent"], 2)
    pct_used = 0.0
    if grant["total_budget"] > 0:
        pct_used = round((grant["spent"] / grant["total_budget"]) * 100, 1)
    return {
        "title": grant["title"],
        "total": grant["total_budget"],
        "spent": grant["spent"],
        "remaining": remaining,
        "percent_used": pct_used,
    }

print(budget_summary(grant))
```

Les fonctions pures — entrée en entrée, nombres dérivés en sortie, aucun état touché — sont le cœur d'un script de données maintenable. `budget_summary` ne change pas le budget ; il le rapporte, c'est pourquoi l'étape 3 peut l'appeler dans une boucle sans effets secondaires. La garde explicite `if grant["total_budget"] > 0`, au lieu de diviser aveuglément, gère la proposition encore en cours d'écriture avec un budget de zéro pour que tu obtiennes `0.0` plutôt qu'une `ZeroDivisionError`.

**🎯 Résultat attendu :** Un dictionnaire comme `{'title': 'NSF Career Development', 'total': 500000.0, 'spent': 4500.0, 'remaining': 495500.0, 'percent_used': 0.9}`.

**🩹 Si ça ne marche pas :** Si tu tombes sur `ZeroDivisionError`, la garde du budget total manque. Si `percent_used` est un long flottant comme `0.8999999...`, le `round` manque dans la ligne de division — applique `round(x, 1)` au pourcentage final.

### 2.3 Vérifie la garde budgétaire

**✅ Liste de vérification**

- ✅ Une dépense valide s'ajoute à `grant["expenses"]` et fait monter `grant["spent"]`.
- ✅ Un montant de `0`, un montant négatif ou un montant supérieur au budget restant lève une `ValueError`, et `spent` reste inchangé ensuite.
- ✅ `budget_summary(grant)` renvoie `total`, `spent`, `remaining` et `percent_used`, et ne divise jamais par zéro.

**🤔 Question(s) socratique(s)**

- La vérification du dépassement utilise `amount > grant["total_budget"] - grant["spent"]`. Que se passerait-il si tu déplaçais le `round(...)` dans cette soustraction plutôt que dans la mise à jour — une séquence de petites dépenses valides pourrait-elle *paraître* dépensée en trop ? (Essaie `0.1 + 0.2` dans un REPL pour voir pourquoi c'est une vraie question.)
- Un remboursement est économiquement une dépense négative. `add_expense` devrait-elle accepter des montants négatifs, ou les autoriser affaiblirait-il la garde ? De quoi le site d'appel aurait-il besoin pour distinguer un remboursement légitime d'une faute de frappe ?

## Étape 3 : Construis le tableau de bord des échéances

Les échéances sont ce qui décide réellement qui est financé. Cette étape transforme les chaînes ISO brutes en décisions temporelles : combien de jours avant chaque échéance, quelles subventions sont déjà en retard, et dans quel ordre tu devrais travailler.

### 3.1 Calcule les jours avant chaque échéance

**👟 Indice de départ :** Analyse chaque échéance avec `datetime.fromisoformat`, soustrais *aujourd'hui*, attache une étiquette `status` lisible par un humain, puis trie toute la liste par urgence.

```python
# grant_tracker.py (continued)
from datetime import timedelta

def upcoming_deadlines(grants: list[dict], days_ahead: int = 30) -> list[dict]:
    """Return grants with deadlines within the next N days, sorted soonest first."""
    today = datetime.now()
    cutoff = today + timedelta(days=days_ahead)

    results = []
    for grant in grants:
        deadline = datetime.fromisoformat(grant["deadline"])
        days_left = (deadline - today).days
        results.append({
            "title": grant["title"],
            "funder": grant["funder"],
            "deadline": grant["deadline"],
            "days_left": days_left,
            "status": "OVERDUE" if days_left < 0 else f"{days_left} days left",
            "budget_status": budget_summary(grant),
        })

    results.sort(key=lambda g: g["days_left"])
    return results

for item in upcoming_deadlines(grants):
    print(f"{item['status']:>16}  {item['title']}  ({item['budget_status']['percent_used']}% used)")
```

`datetime.fromisoformat` analyse la chaîne ISO en un vrai `datetime` pour que la soustraction ait un sens : `(deadline - today).days` produit un simple entier, négatif quand c'est en retard et positif quand c'est à venir. Trier sur `days_left` ordonne la liste du plus en retard au plus éloigné en une ligne, car la clé de tri encode déjà l'urgence. Imbriquer `budget_status` dans chaque élément est le fruit de la fonction pure de l'étape 2 : un appel, et le tableau de bord obtient le contexte budgétaire gratuitement.

**🎯 Résultat attendu :** Trois lignes, une par subvention, affichant `OVERDUE` ou `N days left` plus le pourcentage du budget utilisé — avec la subvention en retard ou la plus urgente en premier.

**🩹 Si ça ne marche pas :** Si tu obtiens `ValueError: Invalid isoformat string`, une échéance de tes données n'est pas une chaîne `YYYY-MM-DD` propre — la sévérité de `fromisoformat` est précisément la raison pour laquelle l'étape 1 stocke les dates dans ce format unique. Si chaque ligne affiche `0 days left`, tu compares peut-être un `date` à un `datetime` ou tu analyses à un minuit différent — inspecte avec `print(type(today), type(deadline))`. Si l'ordre semble aléatoire, le tri `key=` n'est pas réellement appliqué à la liste que tu imprimes.

### 3.2 Affiche le tableau de bord

**👟 Indice de départ :** Formate la liste déjà calculée en rapport lisible — une bannière, un bloc par subvention et un marqueur `!!!` appuyé sur tout ce qui est en retard.

```python
# grant_tracker.py (continued)
def print_dashboard(grants: list[dict]) -> None:
    """Display a formatted deadline dashboard."""
    upcoming = upcoming_deadlines(grants)
    print("\n" + "=" * 60)
    print("GRANT DEADLINE DASHBOARD")
    print("=" * 60)
    for item in upcoming:
        marker = "!!!" if item["days_left"] < 0 else "   "
        print(f"{marker} {item['title']}")
        print(f"     Funder: {item['funder']}")
        print(f"     Deadline: {item['deadline']} -- {item['status']}")
        budget = item["budget_status"]
        print(f"     Budget: ${budget['spent']:.2f} / ${budget['total']:.2f} ({budget['percent_used']}% used)")
        print()

print_dashboard(grants)
```

`print_dashboard` a exactement une tâche — transformer des données déjà calculées en sortie lisible — et il ne fait délibérément *aucun* calcul par lui-même. Séparer « calculer » et « afficher » signifie que tu peux plus tard remplacer ce rendu texte par une page HTML ou un graphique sans toucher à `upcoming_deadlines` du tout.

**🎯 Résultat attendu :** Une bannière `GRANT DEADLINE DASHBOARD`, puis un bloc par subvention triée par urgence, avec `!!!` préfixé à toute subvention en retard et des lignes budgétaires comme `Budget: $4,500.00 / $500,000.00 (0.9% used)`.

**🩹 Si ça ne marche pas :** Si le tableau de bord s'imprime dans l'ordre de création, `print_dashboard` boucle sur la liste brute `grants` au lieu d'appeler `upcoming_deadlines`. Si `!!!` n'apparaît jamais, aucune échéance n'est avant aujourd'hui — ajoute une date délibérément passée pour tester le marqueur. Si les budgets montrent des dollars entiers, les spécificateurs `:.2f` manquent dans les f-strings budgétaires.

### 3.3 Vérifie le tableau de bord

**✅ Liste de vérification**

- ✅ `upcoming_deadlines(grants)` renvoie des éléments triés du plus en retard à l'échéance la plus lointaine.
- ✅ Une subvention en retard affiche `OVERDUE` dans son `status` et un marqueur `!!!` dans `print_dashboard`.
- ✅ Chaque élément du tableau de bord porte un instantané `budget_status` imbriqué issu de l'étape 2.

**🤔 Question(s) socratique(s)**

- Le tableau de bord trie *par échéance la plus proche en premier*, donc la subvention la plus en retard est en tête. Pour un vrai bureau de recherche, « le plus en retard en premier » est-il toujours le bon ordre — ou peux-tu imaginer un critère (budget à risque, priorité du financeur) qui devrait le battre ? Comment trierais-tu par `days_left` puis par une seconde clé ?
- `(deadline - today).days` ignore complètement l'heure de la journée. Si une échéance était `2026-10-15 23:59`, à quel moment `days_left` passe-t-il de `0` à `-1` ? Est-ce un avertissement précoce ou tardif ?

## Étape 4 : Persister en JSON et exporter en CSV

Actuellement, tes subventions disparaissent à la fin du processus. Cette étape les écrit sur disque avec JSON — le format naturel pour les dictionnaires imbriqués — et exporte un CSV aplati pour que quiconque a un tableur puisse travailler avec les mêmes données.

### 4.1 Sauvegarde et charge les subventions

**👟 Indice de départ :** Deux petites fonctions, un fichier, aucune dépendance : `json.dump` pour écrire, `json.load` pour relire, et une vérification d'existence pour qu'un fichier manquant se charge comme une liste vide au lieu de planter.

```python
# grant_tracker.py (continued)
import json
import os

DATA_FILE = "grants.json"

def save_grants(grants: list[dict]) -> None:
    """Save all grants to a JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump(grants, f, indent=2)
    print(f"Saved {len(grants)} grants to {DATA_FILE}")

def load_grants() -> list[dict]:
    """Load grants from disk, returning an empty list if the file is missing."""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)

save_grants(grants)
print(load_grants() == grants)
```

`json.dump(grants, f, indent=2)` écrit la structure imbriquée — dépenses, équipes, budgets — en texte lisible par un humain qui préserve exactement les formes produites par `create_grant`, car dictionnaires, listes, chaînes et flottants ont tous des représentations JSON. L'aller-retour est le vrai test ici : `print(load_grants() == grants)` devrait donner `True`, ce qui prouve que rien n'a été perdu en réécrivant les données en texte puis inversement.

**🎯 Résultat attendu :** Affiche `Saved 3 grants to grants.json`, puis `True` (les subventions chargées égales aux originales, dict pour dict).

**🩹 Si ça ne marche pas :** Si la comparaison affiche `False`, isole la dérive — `load_grants()[0] == grants[0]` te dit si c'est toute la liste ou une seule subvention. Si tu obtiens `TypeError: Object of type datetime is not JSON serializable`, un objet `datetime` s'est glissé dans une subvention ; JSON ne peut pas en représenter un, ce qui est précisément la raison pour laquelle l'étape 1 stocke `created` comme chaîne. Si le fichier s'ouvre sur une seule longue ligne, `indent=2` a été abandonné.

### 4.2 Exporte un CSV adapté au tableur

**👟 Indice de départ :** Aplatis chaque subvention imbriquée dans les six colonnes qu'un bureau de financement veut réellement, et écris-les avec le module `csv` pour que les virgules à l'intérieur des valeurs soient entre guillemets pour toi.

```python
# grant_tracker.py (continued)
import csv

def export_grants_csv(grants: list[dict], filepath: str = "grants.csv") -> None:
    """Write grant data to CSV with one row per grant."""
    fieldnames = ["title", "funder", "deadline", "total_budget", "spent", "status"]
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for grant in grants:
            writer.writerow({name: grant.get(name, "") for name in fieldnames})
    print(f"Exported {len(grants)} grants to CSV: {filepath}")

export_grants_csv(grants)
```

CSV est un format *plat* — il ne peut pas contenir une liste `team` imbriquée ni un registre `expenses` dans une cellule — donc l'exportation est une simplification délibérée : tu choisis les six colonnes scalaires qui survivent à l'aplatissement. `csv.DictWriter` prend un dictionnaire par rangée et gère lui-même les guillemets (un titre contenant une virgule reste un seul champ), ce qui est exactement la classe de bug que la construction manuelle de chaînes CSV invite.

**🎯 Résultat attendu :** Un fichier `grants.csv` avec une ligne d'en-tête plus trois lignes de données, et l'affichage `Exported 3 grants to CSV: grants.csv`.

**🩹 Si ça ne marche pas :** Si le CSV s'ouvre sur une seule ligne à rallonge, il manque `newline=""` au `open` — un artefact de fin de ligne que le module `csv` ne corrige pas à ta place. Si les colonnes arrivent dans le mauvais ordre, `fieldnames` est l'autorité d'ordonnancement — réordonne-le, pas le dictionnaire. Si `writerow` se plaint d'une clé manquante, un dictionnaire de subvention n'a pas l'un des champs listés ; `.get(name, "")` couvre exactement cela.

### 4.3 Vérifie la persistance et l'exportation

**✅ Liste de vérification**

- ✅ `grants.json` existe et son contenu survit à une nouvelle exécution — `load_grants()` renvoie les mêmes subventions que tu as sauvegardées.
- ✅ `grants.csv` s'ouvre dans un tableur avec les six colonnes attendues et une rangée par subvention.
- ✅ `load_grants()` renvoie `[]` sans planter quand le fichier est absent.

**🤔 Question(s) socratique(s)**

- L'aller-retour JSON a prouvé `load_grants() == grants`, pourtant l'export CSV jette délibérément l'équipe et les dépenses. Qu'est-ce que le fichier CSV fait utilement que JSON ne peut pas, et que perdrais-tu si CSV était le seul format que tu conserves ?
- Expérience de réflexion sur le versionnage : six mois plus tard, tu ajoutes une clé `cost_share` à `create_grant`. Que se passe-t-il quand `load_grants()` lit l'ancien fichier dans lequel cette clé n'existe pas du tout — et que cela implique-t-il sur l'endroit où les migrations de données devraient vivre à mesure qu'un schéma stocké évolue ?

## Étape 5 : Pilote le tout depuis une CLI pilotée par menu

Les fonctions que tu as construites constituent une bibliothèque ; une CLI les rend utilisables par une personne. Cette étape les enveloppe dans une boucle qui affiche un menu, lit un choix, le valide et l'achemine vers la bonne action — le même squelette derrière des dizaines de vrais outils d'administration.

### 5.1 Écris la boucle du menu principal

**👟 Indice de départ :** Démarre une boucle `while True`, affiche des choix numérotés, lis l'entrée et achemine. Valide toujours avant de toucher aux données, et compare les choix comme des chaînes pour qu'un `"q"` égaré ne puisse rien casser.

```python
# grant_tracker.py (continued)
grants = load_grants() or grants  # pick up any saves from earlier runs

def menu() -> None:
    while True:
        print("\n--- GRANT TRACKER MENU ---")
        print("1. Show deadline dashboard")
        print("2. Add an expense")
        print("3. Export to CSV")
        print("4. Save")
        print("5. Quit")
        choice = input("> ").strip()

        if choice == "1":
            print_dashboard(grants)
        elif choice == "2":
            title = input("Grant title: ").strip()
            grant = next((g for g in grants if g["title"] == title), None)
            if grant is None:
                print(f"No grant titled '{title}'.")
                continue
            desc = input("Description: ").strip()
            amount = input("Amount: ").strip()
            try:
                add_expense(grant, desc, float(amount), input("Phase: ").strip())
                print("Expense recorded.")
            except ValueError as exc:
                print(f"Invalid: {exc}")
        elif choice == "3":
            export_grants_csv(grants)
        elif choice == "4":
            save_grants(grants)
        elif choice == "5":
            save_grants(grants)
            print("Bye!")
            break
        else:
            print(f"Unknown choice: {choice}")

menu()
```

Trois décisions rendent cette boucle tolérante aux erreurs. L'entrée est lue comme une **chaîne** et comparée à des littéraux de chaîne, donc des caractères égarés ne peuvent pas casser le système de types. `float(amount)` est enveloppé dans `try/except ValueError`, capturant l'échec *attendu* ("abc" n'est pas un nombre) et montrant à l'utilisateur un message au lieu d'une traceback. Et `next((g for g in grants if g["title"] == title), None)` cherche dans la liste par un champ unique — `title` ici, bien qu'un outil de production utiliserait l'`id` de subvention de l'étape 1 pour survivre aux noms en double.

**🎯 Résultat attendu :** Le menu s'affiche ; l'option `1` montre le tableau de bord de l'étape 3, l'option `2` avec un vrai titre et un vrai montant enregistre une dépense (levant `ValueError` en cas de dépassement), l'option `3` écrit `grants.csv`, et `5` sauvegarde avant de quitter.

**🩹 Si ça ne marche pas :** Si un montant non numérique produit une traceback, `try/except ValueError` n'enveloppe pas `float(amount)`. Si taper `1` ne fait rien, compare la branche brute — un `.rstrip()` égaré a pu manger le chiffre, ou le code du menu n'a jamais été sauvegardé. Si le menu ne montre jamais les données du jour, la ligne `grants = load_grants() or grants` n'est pas au-dessus de la boucle.

### 5.2 Vérifie l'application interactive

**✅ Liste de vérification**

- ✅ Chaque option du menu exécute son action : tableau de bord, ajout de dépense, export CSV, sauvegarde.
- ✅ Un mauvais choix de menu affiche un message amical au lieu de planter.
- ✅ Un mauvais montant (`"abc"`, négatif, au-delà du budget) est capté et signalé sans quitter la boucle ni corrompre `spent`.
- ✅ Quitter sauvegarde les subventions actuelles dans `grants.json`.

**🤔 Question(s) socratique(s)**

- L'option 5 sauvegarde et interrompt à la fois. Que se passe-t-il si l'utilisateur ferme le terminal au lieu de la choisir — et que t'apporterait un `try/finally` autour de la boucle que la sauvegarde du chemin heureux ne t'apporte pas ?
- Le menu valide le *montant* mais te demande de taper le titre de la subvention à la main. Si deux subventions partageaient un titre, quelle ambiguïté cela créerait-il, et pourquoi indexer les subventions par l'`id` de `create_grant` serait-il la conception la plus robuste ?

## ⚠️ Pièges courants

- **Dépenser en trop corrompt silencieusement le registre.** Si la validation ne vit pas *à l'intérieur* de `add_expense`, une mauvaise entrée fait simplement passer `remaining` en négatif — et le tableau de bord rapporte gaiement `-12.3% used`. Correctif : garde les deux gardes `ValueError` avant toute mutation (étape 2) et traite un `remaining` négatif comme un bug, pas comme un rapport.
- **Des chaînes d'échéance incohérentes cassent `fromisoformat`.** Une subvention stockée comme `"Oct 15, 2026"` et une autre comme `"2026-10-15"` font lever `datetime.fromisoformat` sur la première. Correctif : impose le format ISO à la source — valide la chaîne à l'intérieur de `create_grant` avec `datetime.fromisoformat(deadline)`, et n'écris jamais les échéances que par cette fonction unique.
- **L'argent en flottants bruts.** `round(0.1 + 0.2, 2)` est très bien pour l'affichage, mais les flottants non arrondis dérivent sur des centaines de dépenses. Correctif : arrondis à chaque mutation (comme le fait `add_expense`), garde le formatage d'affichage (`:.2f`) séparé des valeurs stockées, et atteins `decimal.Decimal` quand les centimes comptent vraiment.
- **Oublier de sauvegarder.** Chaque action du menu mute la liste en mémoire ; un plantage en pleine session perd tout depuis le dernier `save_grants`. Correctif : sauvegarde après chaque action de mutation (l'option 5 du menu le fait), et envisage de sauvegarder avant d'accepter une dépense.
- **Stocker des `datetime` dans JSON.** Un `datetime` n'est pas sérialisable en JSON (tu obtiens une `TypeError` au dump) et se chaîne mal au rechargement. Correctif : stocke des chaînes ISO dès le début (étape 1) et analyse en `datetime` uniquement dans les fonctions qui ont besoin de vraies mathématiques de dates.

## Ce que tu viens de construire

Un suiveur de demandes de subventions fonctionnel : des dictionnaires imbriqués modélisent chaque proposition, `add_expense` applique les limites budgétaires au moment de l'écriture, `datetime` transforme les échéances en tableau de bord trié par urgence, et JSON plus CSV laissent les données persister et interopérer. La compétence transférable est *la modélisation des données combinée à la discipline de persistance* : représenter une entité du monde réel comme des données imbriquées, garder ses invariants et la faire circuler entre mémoire et disque — la même forme derrière les carnets de contacts, les systèmes de commandes et les outils d'inventaire.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/grant-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/grant-tracker) dans le dépôt du cours fournit le script complet avec un flux de travail de statut et un rapport de charge d'équipe déjà inclus. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le de là.
:::

## Où aller ensuite

- Ajoute un **flux de travail de statut** pour que les subventions évoluent dans un ordre légal — `draft` → `submitted` → `review` → `funded`/`rejected`. Un dictionnaire `VALID_TRANSITIONS` (une clé par statut, valeurs = étapes suivantes autorisées) est toute la spécification ; le suiveur refuse alors les sauts illégaux comme un chargé de programme sceptique.
- Construis un **rapport de charge d'équipe** comptant les subventions et le budget total géré par membre de l'équipe — un ajout d'un `Counter` à la fonction de résumé de l'étape 2, et réellement la façon dont un bureau repère un collaborateur surchargé.
- Envoie des **rappels par courriel** pour les échéances qui approchent avec `smtplib` — tu as déjà `upcoming_deadlines()` qui produit exactement la liste dont une tâche de rappel a besoin. Le petit indice : `smtplib` a besoin d'identifiants et d'un serveur réel ou de test, donc pointe-le d'abord vers un serveur SMTP local.
- Échange le stockage JSON pour `sqlite3` une fois que les requêtes deviennent complexes (filtrer par financeur plus statut). `load_grants` devient un `SELECT`, et tout ce qui est en aval — chaque fonction au-dessus — reste exactement identique.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans la gestion de données comme un bureau de recherche. 🎓