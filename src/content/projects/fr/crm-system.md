---
title: "Système CRM"
description: "Gestion de la relation client avec contacts, deals, suivi de pipeline et intégration email."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["classes", "sqlite3", "rich", "cli"]
learningObjectives:
  - "Modéliser les contacts, deals et activités comme des dataclasses typées"
  - "Concevoir et interroger une base de données SQLite avec des clés étrangères et du SQL paramétré"
  - "Insérer, rechercher et filtrer des enregistrements dans des tables liées"
  - "Suivre les étapes des deals avec validation et lire un résumé du pipeline par étape"
  - "Consigner des activités et reconstruire la ligne du temps chronologique d'un contact"
  - "Rendre chaque vue comme un tableau rich stylé"
prerequisites:
  - "Les bases de Python (classes, fonctions, dicts)"
  - "pip install rich"
---

# 🛠️ 🤝 Construire un Système CRM

Un CRM est la source de vérité partagée d'une équipe commerciale : chaque contact, chaque deal, chaque appel et email vit au même endroit pour que rien ne passe entre les mailles. Ce projet construit un CRM léger de zéro — tu modéliseras contacts, deals et activités comme des dataclasses Python typées, concevras un schéma SQLite avec de vraies clés étrangères, écriras des requêtes paramétrées pour la recherche et le filtrage, pousseras les deals à travers un pipeline validé, reconstruiras la ligne du temps d'un contact, et sortiras le tout en sortie `rich` en tableaux propres.

Ceci suppose Python 101 et assez d'aisance en SQL pour lire un SELECT — rien de l'Analyse de Données n'est nécessaire. C'est facultatif et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Modéliser contacts, deals et activités comme des types `@dataclass` propres avec date de remplissage automatique.
2. Concevoir un schéma SQLite avec trois tables liées et des clés étrangères entre elles.
3. Insérer des enregistrements avec des requêtes paramétrées et chercher par nom, email ou entreprise.
4. Pousser les deals à travers un pipeline validé et lire un résumé de valeur par étape.
5. Consigner des activités et reconstruire la ligne du temps chronologique complète d'un contact.
6. Rendre chaque vue comme des tableaux `rich` stylés dans le terminal.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal et recommandé — SQLite écrit sur le disque quand tu choisis un chemin de fichier, et `rich` ne rend les tableaux en couleurs complètes que dans un vrai terminal (les cellules de notebook les tronquent).

**GitHub Codespaces** fonctionne parfaitement aussi : ouvre [le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et exécute depuis là-bas. Un vrai terminal avec une vraie prise en charge des couleurs.

**Google Colab et Kaggle Notebooks** sont un moyen authentique d'exécuter ceci — SQLite fonctionne en mémoire (`:memory:`), et le code Python est entièrement compatible. L'avertissement honnête concerne `rich` : les cellules de notebook rendent les tableaux en texte brut (les couleurs disparaissent), et il n'y a pas de données persistantes entre les sessions. Le notebook ci-dessous utilise une base de données en mémoire peuplée de deux contacts d'exemple et leurs deals, donc chaque requête retourne des résultats d'allure réelle même si rien ne persiste après le redémarrage du noyau. Utilise-le pour voir le schéma et les requêtes fonctionner de bout en bout ; passe à `uv` local ou à un Codespace dès que tu veux que tes propres données restent en place.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/crm-system/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/crm-system/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcrm-system%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin vit dans deux paquets : une bibliothèque PyPI pour l'UI terminal, et un module de la bibliothèque standard pour le stockage.

### Installe `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « install Python, puis pip, puis un outil d'environnement virtuel, puis les paquets » — il peut installer et gérer les versions de Python lui-même, aux côtés des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme son installation :

```bash
uv --version
```

### Configure le projet

```bash
uv init crm-system
cd crm-system
uv add rich
```

`rich` fait ressembler les tableaux et panneaux de terminal à une vraie application — couleurs, bordures, colonnes alignées. `sqlite3` est livré avec Python ; aucune installation supplémentaire n'est nécessaire. Les données de ton CRM vivent dans un fichier `.db` vers lequel tu pointes le script, ou en mémoire si tu ne spécifies pas de chemin.

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `crm-system/` existe avec un `pyproject.toml`, et `rich` est installé.

## Étape 1 : Modéliser les données avec des dataclasses

Chaque enregistrement d'un CRM a une forme rigide — un contact a toujours un nom et un email ; un deal a toujours une valeur et une étape. `@dataclass` impose cette forme au moment de la définition, empêche la dérive accidentelle d'attributs, et te donne un `repr` lisible et une sérialisation en dict gratuitement. Le champ `Optional[int]` id reste `None` jusqu'à ce qu'un enregistrement soit inséré et que la base de données en assigne un.

### 1.1 Définis Contact, Deal et Activity

**👟 Indice de départ :** Donne à chaque classe l'ensemble exact de colonnes auquel elle correspond, rends `id` un `Optional[int]` nullable avec défaut `None`, et fixe des défauts de chaîne vide sensés pour les champs texte facultatifs.

```python
# crm_system.py
from dataclasses import dataclass
from datetime import date
from typing import Optional

@dataclass
class Contact:
    name: str
    email: str
    company: str = ""
    phone: str = ""
    id: Optional[int] = None

@dataclass
class Deal:
    contact_id: int
    title: str
    value: float
    stage: str = "lead"
    id: Optional[int] = None
    STAGES = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]

@dataclass
class Activity:
    contact_id: int
    deal_id: Optional[int]
    kind: str      # call, email, meeting
    summary: str
    activity_date: str = ""
    id: Optional[int] = None

    def __post_init__(self):
        if not self.activity_date:
            self.activity_date = date.today().isoformat()

c = Contact(name="Alice Chen", email="alice@acme.com", company="Acme Corp")
d = Deal(contact_id=1, title="Enterprise License", value=12_000, stage="proposal")
a = Activity(contact_id=1, deal_id=1, kind="meeting", summary="Discussed pricing")
print(f"Contact: {c.name} | Deal: {d.title} (${d.value:,.0f})")
```

Le `__post_init__` sur `Activity` est le seul morceau non trivial : il remplit automatiquement la date avec la chaîne ISO du jour quand tu l'oublies, donc chaque activité reçoit un horodatage valide même dans un test rapide. `Deal.STAGES` est une constante au niveau de la classe — pas un attribut d'instance — ce qui signifie que `Deal.STAGES` se lit proprement sans construire un `Deal`, et que chaque instance sait implicitement la progression autorisée.

**🎯 Résultat attendu :** Affiche `Contact: Alice Chen | Deal: Enterprise License ($12,000)`.

**🩹 Si ça ne marche pas :** Si `Optional` de `typing` n'est pas reconnu, ton Python est <3.10 — utilise `from __future__ import annotations` en haut, ou `Optional[int]` reste valide de toute façon. Si `__post_init__` ne s'exécute pas, vérifie qu'il est indenté sous `Activity`, pas comme une fonction autonome — c'est une méthode magique de dataclass, pas une méthode régulière.

### 1.2 Vérifie

**✅ Liste de vérification**

- ✅ Construire `Contact`, `Deal` et `Activity` avec des arguments mot-clé nommés produit un `repr` propre et aucune `TypeError`.
- ✅ Créer une `Activity` sans date remplit automatiquement `activity_date` avec la date ISO du jour.

**🤔 Question(s) socratique(s)**

- Un `dict` simple comme `{"name": "Alice", "email": "alice@acme.com"}` stockerait les mêmes données sans importer quoi que ce soit. Quelle *garantie* spécifique `@dataclass` ajoute-t-elle qu'un dict n'a pas, et quand cette garantie compte-t-elle ?
- `Deal.STAGES` est défini directement sur le corps de la classe. Pourquoi est-ce préférable à une liste `STAGES` de premier niveau, et qu'arrive-t-il à `move_deal` à l'Étape 4 si une chaîne d'étape ne correspond à aucune de ces valeurs ?

## Étape 2 : Concevoir le schéma SQLite et insérer des contacts

`sqlite3` est la plus petite base de données fiable qui existe — pas d'installation, pas de démon, pas de fichier de config — et elle est dans la bibliothèque standard de Python. Le schéma reflète tes dataclasses exactement : trois tables avec une clé étrangère de `deals` et `activities` vers `contacts`, pour que la base de données elle-même applique la relation dont ton code dépend.

### 2.1 Crée la base de données et le schéma

**👟 Indice de départ :** Utilise `conn.row_factory = sqlite3.Row` pour que chaque résultat de `SELECT` agisse comme un dictionnaire lisible, et `executescript` pour exécuter plusieurs instructions `CREATE TABLE` en un seul appel.

```python
# crm_system.py (continued)
import sqlite3

def init_db(db_path: str = ":memory:") -> sqlite3.Connection:
    """Create the three tables and return a ready-to-use connection."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            company TEXT DEFAULT '',
            phone TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS deals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER REFERENCES contacts(id),
            title TEXT NOT NULL,
            value REAL DEFAULT 0,
            stage TEXT DEFAULT 'lead'
        );
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER REFERENCES contacts(id),
            deal_id INTEGER,
            kind TEXT NOT NULL,
            summary TEXT NOT NULL,
            activity_date TEXT NOT NULL
        );
    """)
    conn.commit()
    return conn

conn = init_db()
```

`"references contacts(id)"` est une déclaration de clé étrangère, mais SQLite ne l'applique que si tu exécutes `PRAGMA foreign_keys = ON` — et délibérément, nous ne le faisons pas ici. L'application complète des FK est le bon défaut de production, mais pour un CRM pédagogique où tu pourrais temporairement insérer un deal avant que son contact n'existe, le choix pragmatique est de laisser le code Python posséder la contrainte. `conn.row_factory = sqlite3.Row` signifie que chaque ligne récupérée se comporte à la fois comme un dict et un objet — tu peux utiliser `row["name"]` et `row.name` de façon interchangeable, qui est la fonctionnalité `sqlite3` la plus utile.

**🎯 Résultat attendu :** `init_db()` retourne une `sqlite3.Connection` vivante sans erreurs ; appeler `conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()` affiche les trois noms de tables.

**🩹 Si ça ne marche pas :** Si `executescript` lève une `ProgrammingError`, tu as oublié `conn.commit()` — les écritures de schéma sont des transactions, et sans commit elles sont invisibles aux requêtes suivantes. Si une table existe déjà d'une exécution précédente sur un fichier (pas `:memory:`), `CREATE TABLE IF NOT EXISTS` ne fait silencieusement rien — supprime le fichier ou la table si tu veux un schéma frais.

### 2.2 Insère et cherche des contacts

**👟 Indice de départ :** Écris `add_contact` et `search_contacts` comme des fonctions pures de la connexion — jamais d'une variable globale — pour qu'elles soient trivialement testables et composables.

```python
# crm_system.py (continued)
def add_contact(conn: sqlite3.Connection, contact: Contact) -> int:
    cur = conn.execute(
        "INSERT INTO contacts (name, email, company, phone) VALUES (?, ?, ?, ?)",
        (contact.name, contact.email, contact.company, contact.phone),
    )
    conn.commit()
    return cur.lastrowid

def search_contacts(conn: sqlite3.Connection, query: str) -> list[dict]:
    """Search by name, email, or company using parameterized LIKE."""
    pattern = f"%{query}%"
    rows = conn.execute(
        "SELECT * FROM contacts WHERE name LIKE ? OR email LIKE ? OR company LIKE ?",
        (pattern, pattern, pattern),
    ).fetchall()
    return [dict(r) for r in rows]

alice_id = add_contact(conn, Contact(name="Alice Chen", email="alice@acme.com", company="Acme Corp"))
bob_id   = add_contact(conn, Contact(name="Bob Smith", email="bob@globex.com", company="Globex Inc"))
print(f"Added contacts: IDs {alice_id}, {bob_id}")
print(search_contacts(conn, "acme"))
```

Les espaces réservés `?` dans la chaîne SQL sont tout l'intérêt des requêtes paramétrées : la base de données n'interprète jamais tes valeurs de chaîne comme des fragments SQL, ce qui est à la fois une règle de sécurité (pas d'injection) et une règle de correction (pas de bugs d'échappement). `cur.lastrowid` est la clé primaire entière que la base de données vient d'assigner — c'est la valeur de clé étrangère dont tes deals et activités auront besoin aux étapes suivantes, donc `add_contact` qui la retourne est un choix de conception délibéré.

**🎯 Résultat attendu :** Affiche `Added contacts: IDs 1, 2` suivi d'une liste contenant un dict pour Alice Chen.

**🩹 Si ça ne marche pas :** Si `search_contacts(conn, "acme")` retourne une liste vide alors qu'Alice est insérée, vérifie que les deux appels `add_contact` ont tourné avant la requête — si `conn.commit()` manque à l'intérieur de `add_contact`, les insertions sont invisibles aux lectures suivantes. Si tu obtiens `ProgrammingError: wrong number of arguments`, la chaîne de requête a un nombre d'espaces réservés `?` différent de celui des valeurs dans le tuple — compte-les.

### 2.3 Vérifie

**✅ Liste de vérification**

- ✅ Deux contacts existent avec des IDs auto-assignés (`1` et `2`), et `search_contacts(conn, "Globex")` retourne exactement Bob.
- ✅ Tu peux expliquer pourquoi les espaces réservés `?` ne sont pas juste une bonne pratique mais une frontière de sécurité.

**🤔 Question(s) socratique(s)**

- `search_contacts` retourne `[dict(r) for r in rows]`, convertissant chaque `sqlite3.Row` en un dict simple. Que changerait-il si tu retournais directement les objets `Row` — y a-t-il un cas où c'est mieux, et un cas où cela casse quelque chose ?
- Un collègue junior suggère de stocker l'entreprise comme une clé étrangère entière vers une table `companies` « pour la normalisation ». Quels sont les compromis dans un petit CRM où un nom d'entreprise n'est vraiment qu'une étiquette ?

## Étape 3 : Rechercher et filtrer avec des jointures

Un CRM n'est pas utile tant que tu ne peux pas poser des questions relationnelles : « quels deals sont à l'étape proposal ? » « quels contacts sont associés à un deal de plus de 5 000 $ ? » Ce sont des JOINs — tirer des lignes de deux tables en utilisant la clé étrangère qui les connecte — et c'est le motif de requête qui rend une base de données réellement plus puissante qu'un fichier plat.

### 3.1 Écris des requêtes de deals filtrées

**👟 Indice de départ :** Écris une fonction qui compte les contacts par entreprise (un simple GROUP BY), et une fonction qui liste les deals filtrés par étape — les deux en utilisant des valeurs paramétrées.

```python
# crm_system.py (continued)
def contacts_by_company(conn: sqlite3.Connection, company: str) -> list[dict]:
    """Return all contacts whose company matches the query."""
    rows = conn.execute(
        "SELECT * FROM contacts WHERE company LIKE ?", (f"%{company}%",)
    ).fetchall()
    return [dict(r) for r in rows]

def deals_by_stage(conn: sqlite3.Connection, stage: str) -> list[dict]:
    """List deals at a given stage, joined with contact name."""
    rows = conn.execute(
        "SELECT d.id, d.title, d.value, d.stage, c.name AS contact_name "
        "FROM deals d JOIN contacts c ON d.contact_id = c.id "
        "WHERE d.stage = ? ORDER BY d.value DESC",
        (stage,),
    ).fetchall()
    return [dict(r) for r in rows]

# Demo: search contacts and list deals by stage
print("Acme contacts:", contacts_by_company(conn, "Acme"))
# (deals_by_stage will return [] until Step 4 inserts deals)
```

Le `JOIN contacts c ON d.contact_id = c.id` est la ligne clé : il fait correspondre chaque deal au contact qui le possède par clé étrangère entière, et `c.name AS contact_name` amène le nom dans le résultat pour que ta logique d'affichage n'ait pas besoin d'une seconde requête. Trier par `value DESC` est un biais délibéré vers l'information que tu voudrais en premier en parcourant un pipeline — les plus gros nombres en haut.

**🎯 Résultat attendu :** `Acme contacts: [{'id': 1, 'name': 'Alice Chen', ...}]` ; `deals_by_stage(conn, "proposal")` retourne une liste vide (les deals n'existent pas encore — ils arrivent à l'Étape 4).

**🩹 Si ça ne marche pas :** Si `contacts_by_company` retourne un décalage sensible à la casse (ex. chercher « ACME » pour « Acme »), le `LIKE` de SQLite est insensible à la casse uniquement pour les caractères ASCII ; utilise `LOWER()` dans la requête si tu travailles avec une entrée à casse mixte. Si `deals_by_stage` lève `OperationalError: no such column`, l'alias de colonne de ton JOIN ne correspond pas à la liste SELECT.

### 3.2 Vérifie

**✅ Liste de vérification**

- ✅ `contacts_by_company(conn, "Globex")` retourne exactement Bob, et `contacts_by_company(conn, "Nonexistent")` retourne `[]`.
- ✅ `deals_by_stage` retourne une liste vide avant qu'aucun deal ne soit inséré — confirmant qu'il ne réutilise pas silencieusement des données périmées.

**🤔 Question(s) socratique(s)**

- `search_contacts` et `contacts_by_company` filtrent toutes deux par un motif `LIKE ?`. Pourquoi ne pas écrire juste une fonction avec une clause `WHERE` qui vérifie chaque colonne avec `OR` — y a-t-il une raison de garder les deux séparées, ou est-ce juste du style de code ?
- `deals_by_stage` joint mais `contacts_by_company` non. Quand une requête à table unique fonctionne-t-elle, et quand omettre le JOIN te donne-t-il silencieusement la mauvaise réponse ?

## Étape 4 : Suivre les deals à travers le pipeline

L'*étape* d'un deal est sa position dans le pipeline de vente, et la faire avancer sans validation est ainsi que les CRM se transforment en poubelles. Cette étape construit la logique du pipeline : ajouter des deals, valider les transitions d'étapes, faire avancer un deal, et lire un résumé par étape de combien de deals et de quelle valeur se trouve à chaque point.

### 4.1 Insère des deals et fais-les avancer dans le pipeline

**👟 Indice de départ :** `add_deal` et `move_deal` doivent vivre sur les constantes de classe de `Deal` — `deal_id` et `new_stage` sont des arguments, pas des attributs — et `move_deal` doit rejeter les étapes invalides *avant* que l'UPDATE ne s'exécute.

```python
# crm_system.py (continued)
def add_deal(conn: sqlite3.Connection, deal: Deal) -> int:
    cur = conn.execute(
        "INSERT INTO deals (contact_id, title, value, stage) VALUES (?, ?, ?, ?)",
        (deal.contact_id, deal.title, deal.value, deal.stage),
    )
    conn.commit()
    return cur.lastrowid

def move_deal(conn: sqlite3.Connection, deal_id: int, new_stage: str) -> None:
    if new_stage not in Deal.STAGES:
        raise ValueError(f"Invalid stage: {new_stage}. Choose from {Deal.STAGES}")
    conn.execute("UPDATE deals SET stage = ? WHERE id = ?", (new_stage, deal_id))
    conn.commit()

deal1_id = add_deal(conn, Deal(contact_id=alice_id, title="Enterprise License", value=12_000, stage="proposal"))
deal2_id = add_deal(conn, Deal(contact_id=bob_id, title="Consulting Package", value=5_000, stage="lead"))
move_deal(conn, deal1_id, "negotiation")
```

La vérification de validation — `if new_stage not in Deal.STAGES` — s'exécute comme une garde au niveau Python, pas une contrainte de base de données, car SQLite n'a pas de contraintes `CHECK` en `DEFAULT`. C'est le compromis délibéré : tu obtiens une `ValueError` claire avec les options valides affichées, plutôt qu'un `UPDATE` silencieux qui écrit une chaîne sans signification et casse la vue pipeline plus tard.

**🎯 Résultat attendu :** Deux deals existent ; deal1 est maintenant à `"negotiation"` après le déplacement ; deal2 reste à `"lead"`.

**🩹 Si ça ne marche pas :** Si `move_deal` lève une `ValueError` pour une étape valide, la chaîne a une faute de frappe — la casse compte exactement comme listé dans `Deal.STAGES`. Si l'UPDATE tourne mais que `deals_by_stage` montre encore le deal à son ancienne étape, tu as oublié `conn.commit()` — l'écriture a eu lieu en mémoire mais n'a pas été persistée.

### 4.2 Lis le résumé du pipeline

**👟 Indice de départ :** Agrège avec `GROUP BY stage` et `ORDER BY stage` pour obtenir une ligne par étape dans l'ordre du pipeline, incluant un compte de deals et une valeur totale.

```python
# crm_system.py (continued)
def pipeline_summary(conn: sqlite3.Connection) -> dict:
    """Return {stage: {count, total_value}} for every stage in the pipeline."""
    rows = conn.execute(
        "SELECT stage, COUNT(*) AS deals, SUM(value) AS total "
        "FROM deals GROUP BY stage ORDER BY stage"
    ).fetchall()
    return {r["stage"]: {"count": r["deals"], "value": r["total"] or 0.0} for r in rows}

for stage, info in pipeline_summary(conn).items():
    print(f"  {stage:<15} {info['count']} deals  ${info['value']:>10,.0f}")
```

`r["total"] or 0.0` gère le cas où une étape n'a aucun deal du tout — `SUM` retourne `NULL` sur un groupe vide, et l'`or` de Python l'attrape. Trier par `stage` alphabétiquement est une simplification pour le pipeline pédagogique ; un CRM de production définirait un ordre explicite via `CASE WHEN stage = 'lead' THEN 1 ...`.

**🎯 Résultat attendu :** Affiche chaque étape avec son compte de deals et sa valeur totale — `negotiation` montre 1 deal (12 000 $), `lead` montre 1 deal (5 000 $), et toutes les autres étapes montrent 0 deal et 0 $.

**🩹 Si ça ne marche pas :** Si chaque étape montre 0 deal malgré les insertions, ton `GROUP BY` travaille contre une connexion ou un fichier de base de données différent — confirme que tu passes le même objet `conn`, pas une ré-initialisation à neuf. Si les noms d'étapes ne correspondent pas à la constante `STAGES`, `SUM` sur un groupe inexistant ne retourne rien — vérifie la présence d'espaces blancs égarés dans les chaînes d'étapes.

### 4.3 Vérifie

**✅ Liste de vérification**

- ✅ L'étape de `deal1_id` est `"negotiation"` après `move_deal`, et celle de `deal2_id` reste `"lead"`.
- ✅ `pipeline_summary(conn)` retourne un dict avec exactement deux étapes non nulles et leurs comptes de deals corrects.

**🤔 Question(s) socratique(s)**

- Un utilisateur veut faire reculer un deal de `"negotiation"` à `"qualified"`. La fonction actuelle `move_deal` est-elle correcte pour ce cas d'usage, et quelle logique supplémentaire empêcherait un abus si tu déployais cela comme un vrai outil de vente ?
- Le résumé du pipeline est ordonné alphabétiquement par nom d'étape. Qu'est-ce qui cloche dans cet ordre pour un vrai pipeline de vente, et comment le corrigerais-tu sans quitter SQL ?

## Étape 5 : Consigner les activités et lire une ligne du temps

Un deal sans contexte est un nombre ; un deal avec une ligne du temps d'appels, d'emails et de réunions est une *histoire*. Cette étape écrit des activités dans la base de données et reconstruit cette histoire pour n'importe quel contact — ordonnée par date, pour qu'un responsable puisse lire l'historique de la relation sans faire défiler.

### 5.1 Insère des activités et récupère la ligne du temps

**👟 Indice de départ :** `add_activity` est presque identique en forme à `add_deal` — le motif est toujours `INSERT avec ? espaces réservés, commit, retourne lastrowid`. Écris un `timeline_for_contact` qui joint les activités aux contacts et trie par `activity_date, id`.

```python
# crm_system.py (continued)
def add_activity(conn: sqlite3.Connection, activity: Activity) -> int:
    cur = conn.execute(
        "INSERT INTO activities (contact_id, deal_id, kind, summary, activity_date) "
        "VALUES (?, ?, ?, ?, ?)",
        (activity.contact_id, activity.deal_id, activity.kind, activity.summary, activity.activity_date),
    )
    conn.commit()
    return cur.lastrowid

def timeline_for_contact(conn: sqlite3.Connection, contact_id: int) -> list[dict]:
    """Return all activities for a contact, ordered by date then insertion order."""
    rows = conn.execute(
        "SELECT kind, summary, activity_date FROM activities "
        "WHERE contact_id = ? ORDER BY activity_date, id",
        (contact_id,),
    ).fetchall()
    return [dict(r) for r in rows]

add_activity(conn, Activity(contact_id=alice_id, deal_id=deal1_id, kind="meeting", summary="Reviewed contract"))
add_activity(conn, Activity(contact_id=bob_id,   deal_id=deal2_id, kind="call",    summary="Initial outreach call"))
add_activity(conn, Activity(contact_id=alice_id, deal_id=deal1_id, kind="email",   summary="Sent revised terms"))

print("Alice's timeline:")
for a in timeline_for_contact(conn, alice_id):
    print(f"  {a['activity_date']}  [{a['kind']}]  {a['summary']}")
```

`ORDER BY activity_date, id` est un tri en deux parties : les dates d'abord, puis l'ordre d'insertion pour les activités du même jour. Sans le départage `, id`, les activités du même jour apparaissent dans un ordre arbitraire, ce qui va pour un jouet mais déroute dans une vraie ligne du temps. Le `deal_id` étant `Optional[int]` compte ici — une activité peut concerner un contact en général, sans être liée à un deal spécifique.

**🎯 Résultat attendu :** Affiche la ligne du temps d'Alice : la réunion à la date du jour, puis l'email, tous deux listés avec l'étiquette de type et le résumé.

**🩹 Si ça ne marche pas :** Si les activités d'Alice montrent les entrées de Bob (ou l'inverse), la valeur `contact_id` passée à `timeline_for_contact` ne correspond pas — retrace les IDs retournés par `add_contact` à l'Étape 2. Si la ligne du temps est vide malgré les insertions, tu interroges une connexion différente qui n'a pas committé — utilise toujours le même objet `conn`.

### 5.2 Vérifie

**✅ Liste de vérification**

- ✅ Alice a exactement deux activités et Bob exactement une, chacune montrant le bon type, résumé et date du jour.
- ✅ Les activités du même jour sont ordonnées par leur ordre d'insertion (réunion avant email), pas alphabétiquement par résumé.

**🤔 Question(s) socratique(s)**

- `deal_id` est `Optional[int]` dans `Activity`, mais la table `activities` le stocke comme un `INTEGER` nu sans clause `REFERENCES`. Que pourrait mal tourner en production si quelqu'un insère une activité avec un `deal_id` qui n'existe pas dans la table `deals` ?
- Comment étendrais-tu `timeline_for_contact` pour inclure le titre du deal à côté de chaque activité (pour les activités qui ont un `deal_id`), et pourquoi cela exige-t-il un `LEFT JOIN` plutôt qu'un `JOIN` régulier ?

## Étape 6 : Tout rendre visible avec des tableaux rich

Le CRM est fonctionnel — les contacts sont stockés, les deals circulent dans un pipeline, les activités sont consignées. Mais toute la sortie jusqu'ici, ce sont des `print()` nus. `rich` transforme cela en une vraie application terminal : des tableaux colorés avec colonnes alignées, bordures visibles et en-têtes qui rendent le scan rapide.

### 6.1 Rends les contacts et le pipeline comme des tableaux rich

**👟 Indice de départ :** Importe `Console` et `Table` de `rich`, crée un tableau par vue, ajoute des colonnes avec `style` pour le codage en couleurs, et imprime chaque tableau avec `console.print(table)`.

```python
# crm_system.py (continued)
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()

def show_contacts(conn: sqlite3.Connection) -> None:
    table = Table(title="Contacts")
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="green")
    table.add_column("Email")
    table.add_column("Company", style="yellow")
    for row in conn.execute("SELECT * FROM contacts"):
        table.add_row(str(row["id"]), row["name"], row["email"], row["company"])
    console.print(table)

def show_pipeline(conn: sqlite3.Connection) -> None:
    table = Table(title="Deal Pipeline")
    table.add_column("Deal", style="cyan")
    table.add_column("Contact", style="green")
    table.add_column("Value", justify="right")
    table.add_column("Stage", style="yellow")
    for row in conn.execute(
        "SELECT d.title, d.value, d.stage, c.name AS contact_name "
        "FROM deals d JOIN contacts c ON d.contact_id = c.id "
        "ORDER BY d.stage, d.value DESC"
    ):
        table.add_row(row["title"], row["contact_name"], f"${row['value']:,.0f}", row["stage"])
    console.print(table)

show_contacts(conn)
show_pipeline(conn)
```

`style="cyan"` et `style="green"` sont des directives de couleur `rich` — elles ajoutent du sens sans surcharger la sortie : les IDs sont toujours d'une couleur, les noms d'une autre, les étapes d'une troisième. Le `justify="right"` sur Value fait aligner les montants en dollars par virgule décimale, pas par premier chiffre, ce qui est ce que ton œil attend d'un tableur. Une seule instance `Console()` partagée par toutes les fonctions garde les réglages de couleur et de largeur cohérents.

**🎯 Résultat attendu :** Deux tableaux `rich` dans le terminal — l'un listant les deux contacts avec colonnes ID/Nom/Entreprise colorées, le second montrant les deux deals avec le nom du contact joint, les montants en dollars alignés à droite et les étapes codées en couleur.

**🩹 Si ça ne marche pas :** Si la sortie est du texte brut grésillé, tu tournes dans une cellule de notebook plutôt que dans un vrai terminal — `rich` détecte la sortie non-TTY et ôte les couleurs. Utilise un terminal ou un Codespace. Si la colonne Value a des décimales mal alignées, le `justify="right"` manque ou les valeurs sont formatées comme des chaînes avant l'insertion.

### 6.2 Vérifie

**✅ Liste de vérification**

- ✅ Deux tableaux stylés se rendent en couleur — l'un pour les contacts, l'autre pour le pipeline de deals.
- ✅ Les montants en dollars du tableau pipeline sont alignés à droite, avec des virgules dans les milliers.

**🤔 Question(s) socratique(s)**

- `rich.Console()` auto-détecte la largeur du terminal et tronque les colonnes trop longues. Qu'arrive-t-il si l'email d'un contact fait 80 caractères, et comment le corrigerais-tu sans perdre de données ?
- Le tableau pipeline trie par `stage, value DESC`. Pourquoi ne pas trier seulement par étape, et quel problème visuel cela créerait-il en scannant un pipeline avec plusieurs deals à la même étape ?

## ⚠️ Pièges courants

- **Injection SQL via des f-strings.** `"SELECT * FROM contacts WHERE name LIKE f'%{query}%'"` est un vecteur d'injection classique — utilise toujours des espaces réservés `?` avec un tuple de paramètres séparé. La fonction `search_contacts` ci-dessus démontre la bonne forme ; toute requête qui interpole directement l'entrée utilisateur est fausse, quelle que soit la rapidité du prototype.
- **Oublier `conn.commit()`.** Chaque `INSERT` et `UPDATE` est une transaction ; sans commit, l'écriture est invisible au `SELECT` suivant et disparaît silencieusement. Le symptôme est « j'ai inséré une ligne mais la requête ne retourne rien » — presque toujours un commit manquant.
- **Des typos de chaînes d'étapes créent silencieusement de nouvelles étapes.** `move_deal` rejette les étapes invalides dans la garde Python, mais si tu la contournes avec un `UPDATE` brut, SQLite stockera volontiers n'importe quelle chaîne comme étape — et `deals_by_stage` ne trouvera jamais ces lignes sous le nom d'étape attendu. Garde la garde.
- **Ordre alphabétique des étapes du pipeline.** `ORDER BY stage` trie « lead » avant « negotiation » — ce qui *tombe* juste pour l'ordre du pipeline dans ce petit exemple, mais est fragile. Un CRM de production a besoin d'un ordre d'étapes explicite, via une expression `CASE` ou une table de correspondance.
- **`dict(row)` sur sqlite3.Row n'imbrique pas.** Les relations de clé étrangère (`contact_name` du JOIN) apparaissent comme des clés plates, pas une structure imbriquée `{"contact": {"name": ...}}`. Tout code qui attend de l'imbrication obtiendra silencieusement un `KeyError` ; travaille avec la forme plate du dict ou construis l'imbrication explicitement.

## Ce que tu viens de construire

Un CRM en ligne de commande fonctionnel : il stocke des contacts, suit des deals à travers un pipeline validé de six étapes, consigne des activités avec leurs dates, reconstruit les lignes du temps des contacts, et présente le tout via des tableaux `rich` stylés — le tout adossé à une vraie base SQLite avec requêtes paramétrées et clés étrangères. Pointe-le sur ton propre fichier `.db` et les données persistent entre les exécutions ; pas de simulation, pas de fausses données.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/crm-system/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/crm-system) dans le dépôt du cours est une version notebook exécutable : une base SQLite en mémoire peuplée de contacts et deals d'exemple, chaque requête et tableau des Étapes 1–6 s'exécutant de bout en bout, et la sortie rich rendue en ligne. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là-bas.
:::

## Où aller à partir d'ici

- Construis un **panneau de rapport de valeur du pipeline** : utilise `rich.panel.Panel` pour afficher la valeur totale du pipeline, le compte de deals ouverts et la taille moyenne des deals — tout depuis `pipeline_summary` — dans un panneau coloré unique qui tient en haut de chaque appel `show_pipeline`.
- Ajoute une **réaffectation de deal** : écris `reassign_deal(conn, deal_id, new_contact_id)` qui change le contact, puis consigne la réaffectation comme activité pour que la ligne du temps montre à qui le deal appartenait avant et après.
- Implémente **l'import/export CSV** : ajoute `import_csv(conn, path)` utilisant `csv.DictReader` de Python pour charger en masse les contacts, et `export_deals(conn, path)` pour vider le pipeline dans un tableur — le chemin le plus simple d'un CRM vers un outil de reporting.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python qui suit de vraies relations. 🎓