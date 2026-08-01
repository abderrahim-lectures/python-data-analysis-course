---
id: mcp-sqlite-server
title: "Interroger une base de données en langage naturel avec MCP"
sidebar_label: "Interroger une base de données en langage naturel avec MCP"
slug: /projects/mcp-sqlite-server
description: "Construisez un serveur MCP qui expose une base de données SQLite locale, puis observez un client LLM écrire et exécuter son propre SQL pour répondre à des questions en langage naturel à son sujet."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Interroger une base de données en langage naturel avec MCP

<ProjectPublishedDate projectId="2027-mcp-sqlite-server" />

<ProjectGreeting />

Les bases de données se trouvent généralement derrière un mur de SQL que seules les personnes qui l'ont écrit peuvent interroger confortablement. MCP change cette donne : au lieu d'enseigner le SQL à tout le monde, vous exposez une base de données via une poignée d'outils bien décrits, et laissez un client LLM écrire et exécuter le SQL lui-même, en votre nom, une question à la fois. Ce projet construit exactement cela — une petite base de données SQLite locale (une bibliothèque de quartier : livres, auteurs, membres, emprunts) et un serveur MCP qui permet à un assistant IA de lister ses tables, d'inspecter le schéma d'une table et d'exécuter des requêtes **en lecture seule** sur celle-ci, afin que vous puissiez poser une question comme « quels livres la bibliothèque n'a-t-elle pas encore récupérés ? » en langage naturel et la voir correctement répondue.

Ce projet suppose Python 101, idéalement aussi Analyse de données (être à l'aise avec les tables, les colonnes et l'interrogation de données structurées fera comprendre plus vite la partie SQL), et avoir déjà construit le projet [Construire un serveur MCP](/docs/projects/mcp-server) — celui-ci réutilise la configuration `FastMCP` de ce projet et ne la réexplique pas depuis le début. Il est facultatif et non noté ; consultez [Projets concrets](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que vous allez faire

1. Construire une petite base de données SQLite réaliste avec quelques tables liées entre elles, en n'utilisant que le module `sqlite3` de la bibliothèque standard.
2. Écrire des fonctions Python simples pour lister les tables, décrire le schéma d'une table et exécuter une requête — avec une vraie vérification de sécurité, pas de la poudre aux yeux, qui rejette tout ce qui n'est pas un `SELECT` en lecture seule.
3. Connecter ces fonctions comme outils MCP avec `FastMCP`, la même API basée sur des décorateurs que dans le projet Construire un serveur MCP.
4. Connecter votre serveur à Claude Desktop et lui poser une véritable question en langage naturel, en observant comment il écrit et exécute son propre SQL via vos outils.

## Où exécuter cela

**Localement avec `uv`** est la voie principale recommandée, pour la même raison que dans le projet Construire un serveur MCP : la récompense ici est de connecter votre serveur à Claude Desktop, et Claude Desktop est une application installée sur votre propre machine — il n'y a pas moyen d'éviter de faire au moins l'étape finale localement. Il s'agit d'un processus local de longue durée censé attendre qu'un vrai client MCP s'y connecte, pas de quelque chose qu'un notebook hébergé peut être.

**GitHub Codespaces** fonctionne pour construire la base de données et écrire les fonctions d'outils ainsi que le serveur lui-même : ouvrez [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés), écrivez `seed.py`, `db_tools.py` et `server.py`, et testez avec le MCP Inspector via le port transféré du Codespace. Ce qu'il ne peut pas être, c'est votre point de connexion final avec Claude Desktop, pour la même raison que le projet MCP précédent.

**Google Colab et Kaggle ne peuvent pas non plus exécuter le vrai serveur** — même raisonnement que pour Construire un serveur MCP : une cellule de notebook ne peut pas être un processus local persistant auquel un client de bureau se connecte. Ce qu'un notebook *peut* faire ici, c'est démontrer les fonctions sous-jacentes de requête et d'inspection de schéma de manière isolée, avec de simples appels de fonctions et sans aucun protocole MCP impliqué — c'est à cela que sert [`examples/mcp-sqlite-server/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb). Cliquez sur un badge pour le lancer directement, sans aucune installation locale :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb)

## Configuration

Si vous avez déjà `uv` du projet Construire un serveur MCP, passez directement à la suite. Sinon :

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Fermez et rouvrez votre terminal, puis confirmez que l'installation a réussi :

```bash
uv --version
```

Configurez ensuite un projet et installez le SDK Python officiel de MCP, avec son extra optionnel `cli` :

```bash
uv init mcp-sqlite-server
cd mcp-sqlite-server
uv add "mcp[cli]"
```

`sqlite3`, la bibliothèque de base de données que ce projet interroge réellement, fait partie de la bibliothèque standard de Python — rien à installer pour elle. Aucune clé API externe n'est nécessaire non plus pour exécuter le serveur lui-même : c'est un outil purement local, et le client LLM qui s'y connecte (Claude Desktop, à l'étape 4) fournit son propre modèle et, s'il en a besoin, sa propre clé.

## Étape 1 : construire une petite base de données d'exemple

Créez `seed.py` — un script qui construit une petite base de données de bibliothèque avec quatre tables liées entre elles :

```python
# seed.py
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "library.db"

SCHEMA = """
CREATE TABLE authors (
    id      INTEGER PRIMARY KEY,
    name    TEXT NOT NULL,
    country TEXT
);

CREATE TABLE books (
    id         INTEGER PRIMARY KEY,
    title      TEXT NOT NULL,
    author_id  INTEGER NOT NULL REFERENCES authors(id),
    year       INTEGER,
    genre      TEXT
);

CREATE TABLE members (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    joined_on  TEXT NOT NULL
);

CREATE TABLE loans (
    id          INTEGER PRIMARY KEY,
    book_id     INTEGER NOT NULL REFERENCES books(id),
    member_id   INTEGER NOT NULL REFERENCES members(id),
    borrowed_on TEXT NOT NULL,
    returned_on TEXT
);
"""

def build_database(db_path: Path = DB_PATH) -> None:
    if db_path.exists():
        db_path.unlink()
    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(SCHEMA)
        # ... insert a handful of authors, books, members, and loans here —
        # see examples/mcp-sqlite-server/seed.py for a full sample dataset.
        conn.commit()
    finally:
        conn.close()

if __name__ == "__main__":
    build_database()
    print(f"Built sample database at {DB_PATH}")
```

Exécutez-le une fois :

```bash
uv run python seed.py
```

Le fait que `returned_on` soit `NULL` pour une ligne est délibéré — c'est ce qui fait de « quels livres sont encore empruntés ? » une question réelle et répondable plus tard, au lieu que chaque emprunt se ressemble.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python seed.py` s'exécute sans erreur et crée `library.db`.</StepChecklistItem>
<StepChecklistItem>La base de données comporte au moins trois tables liées, reliées par des clés étrangères (pas une seule table plate).</StepChecklistItem>
<StepChecklistItem>Au moins une ligne a un `NULL` dans une colonne nullable (par exemple un emprunt non retourné) — les données réelles ont des lacunes.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi ce projet utilise-t-il plusieurs petites tables liées entre elles plutôt qu'une seule table large avec toutes les colonnes ? À quoi ressemblerait une requête pour « quel membre a emprunté quel livre » dans chaque forme ?
- Que se passerait-il, plus tard, si `book_id` dans `loans` ne référençait pas réellement une vraie ligne dans `books` ?

## Étape 2 : écrire les fonctions de requête et de schéma, en toute sécurité

Créez `db_tools.py` — des fonctions Python simples, sans aucun import de `mcp`, que le serveur enveloppera à l'étape 3 :

```python
# db_tools.py
import re
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "library.db"

_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|DETACH|PRAGMA|VACUUM)\b",
    re.IGNORECASE,
)


class UnsafeQueryError(ValueError):
    """Raised when a query isn't a single, read-only SELECT."""


def list_tables(db_path: Path = DB_PATH) -> list[str]:
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()


def run_read_only_query(sql: str, db_path: Path = DB_PATH) -> list[dict]:
    stripped = sql.strip().rstrip(";")
    if not stripped:
        raise UnsafeQueryError("Empty query.")
    if ";" in stripped:
        raise UnsafeQueryError("Only a single statement is allowed -- no ';' inside the query.")
    if not stripped.upper().startswith("SELECT"):
        raise UnsafeQueryError("Only SELECT queries are allowed.")
    if _FORBIDDEN_KEYWORDS.search(stripped):
        raise UnsafeQueryError("Query contains a write/DDL keyword, which isn't allowed.")

    # A second, independent layer of defense: open the file itself read-only
    # at the OS/SQLite level, so even a query that slipped past the text
    # checks above still can't write anything.
    uri = f"file:{Path(db_path).resolve()}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(stripped).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
```

Deux choses à remarquer. D'abord, `run_read_only_query` n'essaie pas d'être un analyseur SQL complet — il ne peut pas l'être, pas en quelques lignes — mais il n'a pas besoin de l'être non plus : rejeter tout ce qui contient une seconde instruction enchaînée par un point-virgule, tout ce qui n'est pas un `SELECT`, et tout ce qui contient un mot-clé d'écriture ou de schéma ferme les moyens réalistes par lesquels une requête composée par un modèle pourrait causer des dégâts, sans prétendre attraper toutes les astuces SQL concevables. Ensuite, ouvrir la connexion elle-même avec le paramètre URI `mode=ro` de SQLite est une seconde couche réelle, indépendante de la vérification textuelle — si l'expression régulière venait à manquer quelque chose, le fait que le fichier de base de données soit véritablement en lecture seule au niveau du système d'exploitation empêche quand même une écriture de se produire. (`describe_table`, la troisième fonction dont ce projet a besoin, est un ajout court — voir `examples/mcp-sqlite-server/db_tools.py` pour la version complète, qui l'inclut.)

:::tip[Ne sautez pas l'application de la lecture seule, même pour une base de données jouet]
Il est tentant de penser « ce n'est qu'une démo, personne ne va taper `DROP TABLE` ». Le problème n'est pas un *utilisateur* malveillant — c'est que le texte de la requête ici est écrit par un LLM, pas par vous, et les LLM produisent parfois exactement la requête qui semblait raisonnable compte tenu d'une demande ambiguë, mais qui fait quelque chose que vous n'aviez pas prévu. Traitez tout outil qui exécute du SQL composé par un modèle contre une vraie base de données comme ayant réellement besoin de cette vérification, pas comme une réflexion après coup — c'est la même discipline qui compte (avec des enjeux bien plus élevés) la première fois que vous pointez un outil comme celui-ci vers une base de données qui n'est pas juste un échantillon que vous avez construit pour une leçon.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`db_tools.py` ne contient aucun `import` de `mcp` où que ce soit — c'est du pur `sqlite3` et bibliothèque standard.</StepChecklistItem>
<StepChecklistItem>`run_read_only_query("DROP TABLE books")` lève `UnsafeQueryError` au lieu de s'exécuter.</StepChecklistItem>
<StepChecklistItem>`run_read_only_query("SELECT * FROM books; DROP TABLE books")` lève aussi `UnsafeQueryError` — la vérification du point-virgule détecte les instructions enchaînées.</StepChecklistItem>
<StepChecklistItem>Une vraie requête `SELECT` contre votre base de données renvoie les bonnes lignes sous forme de liste de dictionnaires.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- La vérification par URI `mode=ro` et la vérification par mots-clés basée sur le texte rejettent toutes deux les requêtes dangereuses. Si vous ne deviez en garder qu'une, laquelle garderiez-vous, et que perdriez-vous en abandonnant l'autre ?
- `describe_table` construit une requête avec une f-string (`f"PRAGMA table_info({table_name})"`) plutôt qu'un espace réservé paramétré `?`. Pourquoi les noms de tables et de colonnes ne peuvent-ils pas utiliser la même approche de placeholder `?` que les valeurs, et que faut-il faire à la place pour que cela reste sûr ?

## Étape 3 : connecter les fonctions comme outils MCP

Créez `server.py`, en important les fonctions de l'étape 2 et en enveloppant chacune avec `@mcp.tool()`, exactement comme le modèle `FastMCP` du projet Construire un serveur MCP :

```python
# server.py
from mcp.server.fastmcp import FastMCP

from db_tools import DB_PATH, UnsafeQueryError, describe_table, list_tables, run_read_only_query

mcp = FastMCP("library-db")


@mcp.tool()
def list_db_tables() -> list[str]:
    """List every table in the library database.

    Call this first when you don't yet know what data is available.
    """
    return list_tables(DB_PATH)


@mcp.tool()
def describe_db_table(table_name: str) -> list[dict]:
    """Describe a table's columns: name, type, nullability, and primary key.

    Call this after list_db_tables() to learn a table's shape before
    writing a SELECT query against it.
    """
    return describe_table(table_name, DB_PATH)


@mcp.tool()
def query_db(sql: str) -> list[dict]:
    """Run a read-only SELECT query against the library database.

    Only a single SELECT statement is allowed -- no chained statements and
    no write/DDL keywords. Call list_db_tables() and describe_db_table()
    first if you're unsure what tables or columns exist.
    """
    try:
        return run_read_only_query(sql, DB_PATH)
    except UnsafeQueryError as exc:
        return [{"error": str(exc)}]


if __name__ == "__main__":
    mcp.run()
```

Testez-le exactement comme dans le projet MCP précédent, avec l'Inspector, avant de toucher à un vrai client :

```bash
uv run mcp dev server.py
```

Appelez `list_db_tables`, puis `describe_db_table` avec `"books"`, puis `query_db` avec un vrai `SELECT` — et, délibérément, une fois avec quelque chose comme `DROP TABLE books`, pour le voir revenir sous forme de rejet clair plutôt qu'une erreur au niveau de l'Inspector.

Remarquez que `query_db` capture lui-même `UnsafeQueryError` et renvoie un simple résultat `{"error": ...}`, plutôt que de laisser l'exception se propager à travers MCP. C'est un choix de conception petit mais réel : une exception non gérée provenant d'un appel d'outil apparaît généralement au client comme un échec opaque au niveau du protocole, tandis qu'un message d'erreur renvoyé est quelque chose que le modèle peut lire, comprendre et auquel réagir — par exemple, en reformulant sa propre requête.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run mcp dev server.py` démarre proprement et l'Inspector liste les trois outils.</StepChecklistItem>
<StepChecklistItem>`list_db_tables` et `describe_db_table` renvoient toutes deux des données réelles et correctes dans l'Inspector.</StepChecklistItem>
<StepChecklistItem>`query_db` avec un vrai `SELECT` renvoie des lignes ; `query_db` avec une requête d'écriture/DDL renvoie un clair `{"error": ...}` au lieu de planter.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- La docstring de chaque outil indique au modèle à la fois ce qu'il fait et, dans le cas de `list_db_tables`, à peu près quand l'appeler en premier. Qu'arriverait-il aux choix d'outils du modèle si les trois docstrings disaient simplement `"""Database tool."""` ?
- Pourquoi envelopper `UnsafeQueryError` dans une valeur renvoyée `{"error": ...}` plutôt que de la laisser se propager jusqu'en haut ?

## Étape 4 : se connecter à Claude Desktop et poser une vraie question

Ajoutez votre serveur à `claude_desktop_config.json` (le même fichier utilisé par le projet Construire un serveur MCP ; macOS : `~/Library/Application Support/Claude/claude_desktop_config.json` ; Windows : `%APPDATA%\Claude\claude_desktop_config.json`) :

```json
{
  "mcpServers": {
    "library-db": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-sqlite-server", "python", "server.py"]
    }
  }
}
```

**Quittez complètement puis rouvrez Claude Desktop.** Une fois de retour, posez une véritable question en langage naturel qui nécessite plus d'une table pour y répondre, par exemple :

> En utilisant les outils de library-db, quels livres sont actuellement empruntés et n'ont pas encore été retournés ? Donne-moi les titres et qui les a.

Observez ce qui se passe : Claude devrait appeler `list_db_tables`, puis `describe_db_table` sur `books`, `loans` et `members` pour connaître les noms des colonnes, puis composer et exécuter son propre `SELECT ... JOIN ...` via `query_db` — et répondre en utilisant le vrai résultat, pas une supposition. C'est la véritable récompense de tout le projet : vous n'avez jamais écrit cette jointure vous-même.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`library-db` apparaît dans la liste d'outils de Claude Desktop après un redémarrage complet.</StepChecklistItem>
<StepChecklistItem>Poser la question d'exemple ci-dessus montre Claude appelant réellement `list_db_tables`, `describe_db_table` et `query_db` en séquence, pas seulement en répondant de mémoire.</StepChecklistItem>
<StepChecklistItem>Le SQL écrit par Claude (visible dans les détails développés de l'appel d'outil) est une véritable jointure multi-tables, et la réponse correspond à ce que vous obtiendriez en exécutant cette requête vous-même.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Claude a écrit son propre SQL ici, sans que vous ne lui montriez jamais de requête à imiter. Qu'est-ce que dans les docstrings des outils et le schéma renvoyé par `describe_db_table` lui a donné suffisamment matière pour travailler ?
- Si vous posiez une question ambiguë — « montre-moi les livres populaires », disons, sans aucune définition de « populaire » dans votre schéma — que vous attendriez-vous à ce que Claude fasse : deviner une définition, vous demander de clarifier, ou autre chose ? Essayez.

## ⚠️ Pièges courants

- **Faire confiance directement à `table_name` dans une f-string sans le vérifier d'abord contre `list_tables()`.** `PRAGMA table_info(...)` ne peut pas accepter un espace réservé `?` pour un nom de table, il est donc tentant de simplement l'interpoler — mais seulement après avoir confirmé que c'est un vrai nom de table déjà connu de votre propre code, jamais une chaîne brute fournie par le modèle sans vérification.
- **Oublier la vérification du point-virgule.** Un filtre de mots-clés seul (bloquant `DROP`, `DELETE`, etc.) n'arrête pas `SELECT * FROM books; DROP TABLE books` si vous ne scannez les mots-clés que dans la *première* instruction — rejetez tout point-virgule dans la requête, pas seulement les mots-clés interdits.
- **Un chemin relatif, ou oublier de redémarrer complètement Claude Desktop, à l'étape 4.** Les deux mêmes pièges que dans le projet Construire un serveur MCP — Claude Desktop a besoin d'un chemin absolu dans la configuration et ne le relit qu'après un redémarrage complet, pas une simple fermeture/réouverture de fenêtre.
- **Exécuter le serveur avec `python server.py` au lieu de `uv run python server.py`.** Sans `uv run`, vous risquez de ne pas être dans l'environnement virtuel où `uv add` a installé `mcp`, et d'obtenir une `ModuleNotFoundError`.

## Ce que vous venez de construire

Une instance réelle, quoique petite, d'un modèle véritablement utile au-delà d'une leçon : un client LLM répondant à des questions en langage naturel sur des données structurées qu'il n'a jamais vues auparavant, en découvrant le schéma et en écrivant son propre SQL via des outils que vous avez exposés — avec une véritable frontière de sécurité entre « lecture » et « écriture » appliquée dans votre propre code, pas simplement supposée. La base de données ici est une bibliothèque jouet, mais rien dans `list_db_tables`, `describe_db_table`, ou l'application de la lecture seule dans `query_db` n'est spécifique au jouet — pointez le même serveur vers un fichier SQLite différent et il fonctionne sans modification.

## Pour aller plus loin

- Pointez ce serveur vers une vraie base de données SQLite que vous utilisez réellement — un export de finances personnelles, les données d'un petit projet, tout ce que vous avez déjà comme fichier `.db` — et voyez comment les trois mêmes outils se comportent face à un schéma réel et de vraies questions.
- Ajoutez une limite de nombre de lignes ou de taille de résultat à `run_read_only_query`, afin qu'un `SELECT *` large sur une table beaucoup plus grande ne puisse pas renvoyer un résultat déraisonnablement volumineux au modèle.
- Lisez sur les **ressources** MCP — ce projet ne couvre que les *outils*, mais les informations de schéma renvoyées par `describe_db_table` conviennent sans doute mieux à une ressource (données lisibles) qu'à un outil (une action). La [documentation du SDK lui-même](https://github.com/modelcontextprotocol/python-sdk) couvre cette différence.

:::tip[Exécutez une version plus complète sans aucune installation locale — au moins pour la logique des outils]
[`examples/mcp-sqlite-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-sqlite-server) dans le dépôt du cours contient les `seed.py`, `db_tools.py` et `server.py` complets de cette leçon, ainsi qu'un notebook démontrant les fonctions de requête/schéma de manière isolée. Clonez-le, ou ouvrez tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), pour essayer les trois outils avec `uv run mcp dev server.py` — en vous rappelant que la vraie connexion Claude Desktop doit quand même se faire localement, selon « Où exécuter cela » ci-dessus.
:::

## Partagez votre projet avec la classe

Vous avez construit quelque chose dont vous êtes fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README propose un parcours complet et accessible aux débutants pour ajouter le vôtre via une **pull request**, même si vous n'avez jamais utilisé git auparavant : forker le dépôt, créer une branche, committer vos fichiers et ouvrir la PR, étape par étape. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'art de laisser une IA écrire son propre SQL — avec précaution. 🎓

<ProjectProgressCheckbox projectId="2027-mcp-sqlite-server" />
