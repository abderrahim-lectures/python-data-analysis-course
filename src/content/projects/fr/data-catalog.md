---
title: "Catalogue de Données"
description: "Catalogue de métadonnées consultable qui indexe les jeux de données, schémas et lignée de données dans votre organisation."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "csv", "json", "metadata"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions, dictionnaires)"
  - "Lire des fichiers CSV avec le module csv"
learningObjectives:
  - "Extraire des métadonnées de schéma (colonnes, types inférés, comptes de lignes) des jeux de données CSV"
  - "Persister un index de catalogue consultable en JSON"
  - "Scorer et classer les résultats de recherche de jeux de données par correspondances de termes"
  - "Enregistrer les arêtes de lignée de données et parcourir les chaînes de dépendances en amont et en aval"
  - "Exposer add, search et lineage comme sous-commandes CLI"
---

# 🗂️ Construire un Catalogue de Données

Avant que quiconque puisse utiliser des données, quelqu'un doit être capable de les *trouver*, de faire confiance à ce qu'elles sont, et de savoir d'où elles viennent. C'est le travail d'un catalogue de données — l'index d'une organisation sur ses propres jeux de données. Ce projet construit un vrai catalogue, petit : il scanne des fichiers CSV et enregistre leur schéma (colonnes, types inférés, comptes de lignes) dans un index JSON persistant, répond à des recherches en texte libre sur les noms de jeux de données et de colonnes, et suit la *lignée* — quel jeu de données alimente quelle transformation, pour que tu puisses répondre à « qu'est-ce qui casse si ce CSV change ? » par un parcours au lieu d'une supposition.

Ceci suppose Python 101 plus une lecture de `csv` aisée — collections, dicts et fonctions. Rien du module Analyse de Données n'est nécessaire. C'est facultatif et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Écrire un extracteur de métadonnées qui transforme un fichier CSV en entrée de catalogue — noms de colonnes, types inférés, compte de lignes.
2. Construire un `CatalogIndex` persistant qui se sauvegarde et se recharge en JSON.
3. Implémenter une recherche en texte complet scorée sur les noms de jeux de données et de colonnes.
4. Enregistrer les arêtes de lignée et parcourir les chaînes de dépendances en marche avant et en marche arrière.
5. Envelopper le tout dans une CLI `catalog.py` avec les sous-commandes `add`, `search` et `lineage`.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — un catalogue concerne *tes* dossiers de CSV sur le disque, et tout l'intérêt de la CLI est d'être pointée sur de vrais fichiers. La configuration est uniquement bibliothèque standard (et sans `tomllib`, donc un Python récent simple suffit).

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés) et exécute les mêmes commandes — il y a plein de CSV dans `examples/` vers lesquels la pointer.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent bien pour la moitié *logique de recherche* de ce projet — le notebook dans [`examples/data-catalog/notebook.fr.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.fr.ipynb) exécute chaque étape sur des jeux de données d'exemple fournis. La note honnête : les CSV d'exemple d'un notebook sont fixes, donc la magie « scanner *mon* dossier » est une expérience `uv` locale.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-catalog%2Fnotebook.fr.ipynb)

## Configuration

`uv` est un outil unique qui remplace toute la chaîne « install Python, puis pip, puis un outil d'environnement virtuel » — et rien dans ce projet n'a besoin d'un paquet tiers.

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

Ensuite, configure le projet :

```bash
uv init data-catalog
cd data-catalog
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `data-catalog/` existe avec un `pyproject.toml`.
- ✅ `python -c "import csv, json"` réussit — aucun paquet tiers.

## Étape 1 : Extraire les métadonnées de schéma des CSV

Une entrée de catalogue est la *description d'un jeu de données*, pas les données elles-mêmes : quelles colonnes existent, quel type de valeurs chacune contient, combien de lignes. Extraire cela est le moment où un fichier brut devient un actif trouvable — et la partie la plus délicate est d'*inférer un type* depuis les valeurs d'une colonne sans se laisser mentir par un seul nombre égaré.

### 1.1 Écris l'extracteur et un helper d'inférence

**👟 Indice de départ :** Crée deux CSV d'exemple, puis `extract_metadata`, qui utilise `csv.DictReader` pour attraper les en-têtes et les lignes, et `_infer_type`, qui demande « est-ce que chaque valeur non vide peut devenir un flottant ? » avant d'oser étiqueter une colonne comme numérique :

```python
# metadata.py
import csv
from dataclasses import dataclass, field
from pathlib import Path

@dataclass
class CatalogEntry:
    name: str
    source: str
    columns: list[str] = field(default_factory=list)
    dtypes: list[str] = field(default_factory=list)
    row_count: int = 0

def _infer_type(values: list[str]) -> str:
    if not values:
        return "empty"
    if all(v.lower() in {"true", "false"} for v in values):
        return "boolean"
    try:
        for v in values:
            float(v)
        return "numeric"
    except ValueError:
        return "text"

def extract_metadata(path: str) -> CatalogEntry:
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames or []
        rows = list(reader)
    dtypes = [
        _infer_type([row[col] for row in rows if row.get(col, "").strip()])
        for col in columns
    ]
    return CatalogEntry(
        name=Path(path).stem,
        source=path,
        columns=columns,
        dtypes=dtypes,
        row_count=len(rows),
    )

if __name__ == "__main__":
    products = """id,name,price,stock,active\n1,Keyboard,49.99,120,true\n2,Mouse,24.50,300,false\n"""
    customers = """id,full_name,region\n7,Ada Wong,north\n8,Grace Hopper,south\n"""
    with open("products.csv", "w") as f:
        f.write(products)
    with open("customers.csv", "w") as f:
        f.write(customers)

    for csv_file in ["products.csv", "customers.csv"]:
        entry = extract_metadata(csv_file)
        print(f"{entry.name}: {entry.row_count} rows")
        for col, dtype in zip(entry.columns, entry.dtypes):
            print(f"  {col}: {dtype}")
```

L'ordre des vérifications dans `_infer_type` est un petit arbre de décision : les booléens sont un *sous-ensemble* de ce qu'on pourrait appeler numérique (`"true"` n'est pas un flottant, en fait — le `try float` le garde), donc le booléen est vérifié d'abord, et le cas `"empty"` retourne tôt pour qu'une colonne entièrement vide ne score jamais comme bizarrement-numérique. `reader.fieldnames or []` est une défense silencieuse : un fichier vide a des `fieldnames` `None`, et chaque boucle ultérieure suppose une liste.

**🎯 Résultat attendu :**

```
products: 2 rows
  id: numeric
  name: text
  price: numeric
  stock: numeric
  active: boolean
customers: 2 rows
  id: numeric
  full_name: text
  region: text
```

**🩹 Si ça ne marche pas :** Si `price` s'infère comme `text`, une cellule quelque part tient une valeur comme `"49,99"` ou `"$49.99"` que `float()` rejette — nettoie les données ou accepte « text » comme la réponse honnête. Si `active` s'infère comme `text`, une valeur n'est pas `true`/`false` — vérifie la présence d'un `"1"` littéral mélangé aux booléens.

### 1.2 Vérifie

**✅ Liste de vérification**

- ✅ Les deux CSV d'exemple produisent des entrées avec les bonnes listes de colonnes et de types ci-dessus.
- ✅ `row_count` égale le nombre de lignes de données, la ligne d'en-tête *non* incluse.
- ✅ `_infer_type([])` retourne `"empty"` sans crasher.

**🤔 Question(s) socratique(s)**

- Un verdict « tout numérique » vient d'*un seul* `float(...)` réussissant pour chaque valeur. Comment une colonne `id` de `["001", "002"]` est-elle classée — et pourquoi cela est-il sans doute *faux* dans un catalogue où les IDs sont censés être des étiquettes opaques, pas de l'arithmétique ?
- L'extracteur charge chaque ligne en mémoire (`rows = list(reader)`). Quelle partie du code devrait changer pour cataloguer un CSV de 50 Go, et quelles parties (en-têtes, types) survivent inchangées ?

## Étape 2 : Persister un index consultable

Un dict en mémoire d'entrées s'évapore quand le processus se termine, ce qui le rend inutile comme catalogue d'une *organisation*. La correction est un `CatalogIndex` qui se sérialise en JSON à chaque changement et se recharge au démarrage — le même truc de durabilité que les vrais catalogues obtiennent des bases de données, réduit à un fichier.

### 2.1 Écris l'index adossé au JSON

**👟 Indice de départ :** Une classe dont le constructeur essaie de charger `catalog.json` et se dégrade en dict vide quand le fichier manque ; `add`/`remove` mutent puis `_save` immédiatement :

```python
# index.py
import json
from pathlib import Path

from metadata import CatalogEntry, extract_metadata

class CatalogIndex:
    def __init__(self, path: str = "catalog.json"):
        self.path = path
        self.entries: dict[str, CatalogEntry] = self._load()

    def _load(self) -> dict[str, CatalogEntry]:
        p = Path(self.path)
        if not p.exists():
            return {}
        data = json.loads(p.read_text())
        return {name: CatalogEntry(**payload) for name, payload in data.items()}

    def add(self, entry: CatalogEntry) -> None:
        self.entries[entry.name] = entry
        self._save()

    def remove(self, name: str) -> bool:
        removed = self.entries.pop(name, None) is not None
        if removed:
            self._save()
        return removed

    def _save(self) -> None:
        payload = {name: entry.__dict__ for name, entry in self.entries.items()}
        Path(self.path).write_text(json.dumps(payload, indent=2))

if __name__ == "__main__":
    index = CatalogIndex()
    index.remove("products")
    index.add(extract_metadata("products.csv"))
    index.add(extract_metadata("customers.csv"))
    index.remove("customers")
    for name, entry in index.entries.items():
        print(f"{name}: {entry.columns}")
```

`entry.__dict__` est l'astuce de sérialisation à faible effort : les instances de dataclass stockent leurs champs dans un `__dict__` simple, donc `json.dumps` d'un dict-de-`__dict__` n'a besoin d'aucun encodeur personnalisé, et `CatalogEntry(**payload)` au retour le réhydrate avec les clés exactes. Le fichier JSON devient la *source de confiance* entre les exécutions — ferme le terminal, rouvre-le, et `CatalogIndex()` reconstruit le même dict.

**🎯 Résultat attendu :**

```
products: ['id', 'name', 'price', 'stock', 'active']
```

**🩹 Si ça ne marche pas :** Si une `TypeError: __init__() got an unexpected keyword argument` apparaît au rechargement, `catalog.json` tient une clé que la dataclass ne définit pas — supprime le fichier périmé ou renomme le champ pour correspondre. Si `catalog.json` n'apparaît jamais sur le disque, `_save()` n'est pas appelé depuis `add` — chaque chemin de mutation doit persister, sinon l'état « sauvegardé » est un mensonge.

### 2.2 Vérifie

**✅ Liste de vérification**

- ✅ `add` de deux entrées puis réouverture de `CatalogIndex()` (dans un *nouveau* processus) montre les deux sans ré-extraction.
- ✅ `remove` retourne `True` pour une entrée existante, `False` pour un nom jamais ajouté, et sauvegarde dans les deux cas.
- ✅ `catalog.json` est un JSON valide que `json.load` relit dans la même structure.

**🤔 Question(s) socratique(s)**

- Ajouter et retirer appellent tous deux `_save`. Pourquoi la sauvegarde à chaque mutation est-elle le défaut honnête pour un petit outil, et à quelle échelle deviendrait-elle assez coûteuse pour justifier un « sauvegarder à la sortie » à la place — et que *perd* cela sur un crash ?
- L'index mappe `name → CatalogEntry`, donc un second CSV dont le nom de fichier entre en collision écrase silencieusement le premier. `add` devrait-il refuser à la collision, ou l'écrasement est-il le bon comportement — et qui devrait décider ?

## Étape 3 : Rechercher avec scoring

Un catalogue qui ne peut pas être recherché est un musée. La version honnête et sans dépendance de la recherche : divise la requête en termes, compte combien de fois chaque terme apparaît dans un « tas de foin » par jeu de données composé de son nom plus ses noms de colonnes, et classe par ce compte. C'est la même forme que le comptage-tf d'un moteur de recherche à la plus petite échelle.

### 3.1 Écris le scoreur

**👟 Indice de départ :** Joins l'identité de chaque entrée en une chaîne en minuscules unique, somme les *occurrences* de termes à l'intérieur, et ne retourne que les entrées scorant au-dessus de zéro, le meilleur d'abord :

```python
# search.py
from index import CatalogIndex

def search(index: CatalogIndex, query: str, top_k: int = 5) -> list[tuple[str, int]]:
    terms = [term.lower() for term in query.split()]
    scored = []
    for name, entry in index.entries.items():
        haystack = " ".join([name, *entry.columns]).lower()
        score = sum(haystack.count(term) for term in terms)
        scored.append((name, score))
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return [(name, score) for name, score in scored if score > 0][:top_k]

if __name__ == "__main__":
    index = CatalogIndex()
    for query in ["price", "region", "id price"]:
        results = search(index, query)
        print(f"{query!r}: {results if results else 'no matches'}")
```

Le `haystack = " ".join([name, *entry.columns])` en minuscules unique est tout le moteur : la recherche score contre *à la fois* le nom du jeu de données et son schéma, ce qui permet à `"region"` de trouver `customers` sans que le mot n'apparaisse du tout dans le nom de fichier — la surface des colonnes est une métadonnée indexable. `haystack.count(term)` est délibérément libéral (compte les correspondances chevauchées) plutôt qu'attentionné aux jetons, car pour un catalogue de quelques centaines d'entrées la précision supplémentaire ne vaut pas le tokeniseur.

**🎯 Résultat attendu :**

```
'price': [('products', 1)]
'region': [('customers', 1)]
'id price': [('products', 2)]
```

**🩹 Si ça ne marche pas :** Si les requêtes multi-mots scorent bizarrement, souviens-toi que la somme compte chaque terme *séparément* — `'id price'` trouve 1 + 1 dans `products`. Si une requête ne correspond à rien alors qu'elle devrait, vérifie si un terme contient des majuscules ou de la ponctuation (ex. la mise en minuscules des deux côtés de `"Price"` est gérée — mais `"price,"` avec une virgule non).

### 3.2 Vérifie

**✅ Liste de vérification**

- ✅ Les trois requêtes ci-dessus retournent les tuples meilleur-d'abord attendus.
- ✅ Une requête comme `"zzz"` retourne `[]` plutôt qu'une erreur.
- ✅ Chercher par un nom de *colonne* (`region`) trouve le jeu de données dont le schéma a cette colonne, même si le nom de fichier ne l'a pas.

**🤔 Question(s) socratique(s)**

- Compter les *occurrences* récompense les colonnes qui répètent un terme. Quelle définition de « pertinent » cela rate-t-il — et que changerait un `count` qui pénalisait les tas de foin plus longs (en divisant par la taille du jeu de données, un mini-tf-idf) dans le classement ?
- La recherche est limitée au nom + colonnes. Quelle métadonnée *que tu as déjà calculée* à l'Étape 1 (types, compte de lignes) voudrais-tu pouvoir rechercher, et quelle requête répondrait-elle que cette version ne peut pas ?

## Étape 4 : Suivre la lignée de données

Savoir *ce qu'est un jeu de données* est la moitié du travail ; savoir *d'où il vient et ce qu'il alimente* est la partie qui sauve les migrations. La lignée est un graphe dirigé — `source → transform → dérivé` — et les opérations dont elle a besoin sont les deux parcours de graphe : en aval (« qu'est-ce qui casse si `products.csv` change ? ») et en amont (« de quoi dépend la table de ce tableau de bord ? »).

### 4.1 Écris le stockage de lignée et les deux parcours

**👟 Indice de départ :** Une liste de triplets `(source, transform, derived)`, plus deux recherches de style en largeur d'abord qui rayonnent depuis un nœud le long des arêtes sortantes ou entrantes, se gardant toutes deux des cycles avec un ensemble `seen` :

```python
# lineage.py
import json
from pathlib import Path

class Lineage:
    def __init__(self, path: str = "lineage.json"):
        self.path = path
        self.edges: list[tuple[str, str, str]] = []  # (source, transform, derived)
        if Path(path).exists():
            raw = json.loads(Path(path).read_text())
            self.edges = [(e["source"], e["transform"], e["derived"]) for e in raw]

    def record(self, source: str, transform: str, derived: str) -> None:
        self.edges.append((source, transform, derived))
        Path(self.path).write_text(json.dumps(
            [{"source": s, "transform": t, "derived": d} for s, t, d in self.edges],
            indent=2))

    def downstream(self, node: str) -> set[str]:
        seen, frontier = set(), {node}
        while frontier:
            current = frontier.pop()
            for src, _transform, derived in self.edges:
                if src == current and derived not in seen:
                    seen.add(derived)
                    frontier.add(derived)
        return seen

    def upstream(self, node: str) -> set[str]:
        seen, frontier = set(), {node}
        while frontier:
            current = frontier.pop()
            for src, _transform, derived in self.edges:
                if derived == current and src not in seen:
                    seen.add(src)
                    frontier.add(src)
        return seen

if __name__ == "__main__":
    lineage = Lineage("lineage.json")
    lineage.edges = []  # reset for a clean demo
    lineage.record("products.csv", "clean", "products_clean")
    lineage.record("products_clean", "aggregate", "revenue_by_category")
    lineage.record("customers.csv", "join", "rich_customers")
    lineage.record("products_clean", "join", "rich_customers")
    print("downstream of products.csv:", sorted(lineage.downstream("products.csv")))
    print("upstream of revenue_by_category:", sorted(lineage.upstream("revenue_by_category")))
```

La boucle `while frontier:` est un vrai parcours de graphe (de style BFS) caché dans du Python simple : chaque nœud sondé ajoute ses voisins non vus à la fois à `seen` (pour qu'ils soient rapportés) et à `frontier` (pour qu'ils soient explorés), ce qui est exactement ainsi que « ce qui dépend de `products.csv` » découvre la réponse *transitive* — `revenue_by_category` est en aval même si rien ne pointe directement dessus. L'ensemble `seen` servant de garde-cycle signifie qu'une boucle mal déclarée dans les données de lignée se termine au lieu de pendre ton rapport.

**🎯 Résultat attendu :**

```
downstream of products.csv: ['products_clean', 'revenue_by_category']
upstream of revenue_by_category: ['products.csv', 'products_clean']
```

**🩹 Si ça ne marche pas :** Si en aval retourne *seulement* `products_clean`, la boucle frontière ne revisite pas les nœuds nouvellement ajoutés — confirme que `frontier.add(derived)` existe à l'intérieur de la boucle, pas seulement `seen.add`. Si la démo ré-ajoute des arêtes à chaque exécution, la ligne de réinitialisation `lineage.edges = []` fait du vrai travail — un stockage persistant qui ne réinitialise jamais grandit indéfiniment.

### 4.2 Vérifie

**✅ Liste de vérification**

- ✅ Les deux parcours retournent exactement les ensembles triés ci-dessus (transitif dans les deux directions).
- ✅ Un nœud sans arêtes (ex. `"ghost.db"`) retourne un ensemble vide, pas une erreur.
- ✅ `lineage.json` se recharge dans la même liste d'arêtes dans un nouveau processus.

**🤔 Question(s) socratique(s)**

- Le parcours est *en largeur d'abord via un ensemble*. Que changerait-il si tu voulais le *chemin de dépendance le plus court* de `products.csv` à `revenue_by_category` — l'ensemble jette délibérément quelle information, et quelle structure la préserverait ?
- Les deux parcours vivent dans une seule classe sur les mêmes arêtes. Où `upstream` utilise-t-il `derived == current` alors que `downstream` utilise `src == current` — et comment expliquerais-tu « inverse la comparaison, réutilise toute la tuyauterie » à un coéquipier junior ?

## Étape 5 : La CLI du catalogue

La bibliothèque est terminée ; l'*outil* doit être une commande que quelqu'un peut taper. Les sous-commandes `argparse` transforment tout le projet en trois verbes — `add`, `search`, `lineage` — chacun réutilisant exactement une fonction des étapes ci-dessus.

### 5.1 Câble les sous-commandes

**👟 Indice de départ :** Crée l'analyseur avec `add_subparsers(required=True)`, enregistre un sous-analyseur par verbe, et distribue dans un `main()` qui instancie `CatalogIndex`/`Lineage` par commande :

```python
# catalog.py
import argparse

from index import CatalogIndex
from lineage import Lineage
from metadata import extract_metadata
from search import search

def main() -> None:
    parser = argparse.ArgumentParser(description="Catalog datasets; answer search and lineage queries.")
    sub = parser.add_subparsers(dest="command", required=True)

    add_cmd = sub.add_parser("add", help="Add a CSV dataset to the catalog")
    add_cmd.add_argument("csv_path")

    search_cmd = sub.add_parser("search", help="Search datasets by name or column")
    search_cmd.add_argument("query")

    lineage_cmd = sub.add_parser("lineage", help="Show what depends on, or feeds, a dataset")
    lineage_cmd.add_argument("dataset")
    lineage_cmd.add_argument("--direction", choices=["downstream", "upstream"], default="downstream")

    args = parser.parse_args()
    index = CatalogIndex()

    if args.command == "add":
        entry = extract_metadata(args.csv_path)
        index.add(entry)
        print(f"added {entry.name}: {len(entry.columns)} cols, {entry.row_count} rows")
    elif args.command == "search":
        for name, score in search(index, args.query):
            print(f"{name}  (score {score})")
        if not index.entries:
            print("catalog is empty -- run 'add' first")
    elif args.command == "lineage":
        lineage = Lineage()
        result = lineage.downstream(args.dataset) if args.direction == "downstream" \
            else lineage.upstream(args.dataset)
        print(f"{args.direction} of {args.dataset}:", sorted(result) or "nothing")

if __name__ == "__main__":
    main()
```

```bash
uv run python catalog.py add products.csv
uv run python catalog.py search price
uv run python catalog.py lineage products.csv --direction downstream
```

Le motif à intérioriser : chaque sous-commande *compose* les fonctions de bibliothèque antérieures plutôt que de les ré-implementer — `add` est `extract_metadata` + `index.add`, `search` est un appel de fonction, `lineage` est un appel de classe. Le `required=True` sur `add_subparsers` est la différence entre `catalog.py` sans verbe qui affiche une liste d'usage utile et un silence sans action.

**🎯 Résultat attendu :** `added products: 5 cols, 2 rows`, puis `products  (score 1)`, puis `downstream of products.csv: ['products_clean', 'revenue_by_category']`.

**🩹 Si ça ne marche pas :** Si exécuter `add` deux fois sur le même fichier affiche la même ligne deux fois, c'est *correct* — `add` écrase la même clé de catalogue. Si `--direction upstream` ne retourne rien, les arêtes sous `lineage.json` ont été enregistrées avec des rôles `derived`/`source` que tu attends dans l'autre sens — le parcours suit la direction enregistrée, donc re-vérifie les appels `record`.

### 5.2 Vérifie

**✅ Liste de vérification**

- ✅ `add` sur les deux CSV d'exemple, puis `search price`, reproduit le résultat de l'Étape 3 depuis le terminal.
- ✅ `catalog.py --help` et `catalog.py search --help` listent les verbes et drapeaux attendus.
- ✅ `lineage --direction upstream` sur `rich_customers` signale à la fois `customers.csv` et `products_clean`.

**🤔 Question(s) socratique(s)**

- `search` sur un catalogue vide affiche un indice, tandis que `lineage` sur un fichier vide signale tranquillement « nothing ». Pourquoi le cas vide est-il réellement *différent* pour les deux commandes — quelle est l'asymétrie entre « pas de données à chercher » et « pas de lignée enregistrée » ?
- Chaque commande construit son propre `CatalogIndex()`/`Lineage()`. Quand partager une seule instance importerait-il — et pour une CLI où chaque exécution est une commande, pourquoi l'état par-commande est-il le bon *défaut* ici ?

## ⚠️ Pièges courants

- **Étiqueter les colonnes comme numériques parce que *quelques* valeurs sont des nombres.** Un `"42"` ne rend pas une colonne numérique ; chaque valeur non vide doit s'analyser. Une colonne `id` de `["001", "002"]` est probablement un identifiant *texte* déguisé — infère prudemment ou laisse le catalogue dire « text » honnêtement.
- **Appeler `_save` ailleurs que sur la mutation.** Une recherche qui « oublie » de persister ou un chargement qui n'écrit jamais créent tous deux un catalogue dont l'état sur le disque est en désaccord avec son état en mémoire. Sauvegarde à chaque mutation, charge à chaque démarrage.
- **Rechercher sensible à la casse.** `Price` vs `price` est à un `.lower()` oublié d'« résultats vides ». Mets le tas de foin et la requête en minuscules ensemble.
- **Des parcours de graphe sans ensemble `seen`.** Chaque BFS/DFS sur un graphe avec n'importe quel cycle — la lignée réelle boucle parfois — pend pour toujours sans déduplication. La division `seen`/`frontier` n'est pas facultative.
- **Enregistrer la lignée mais ne jamais la rejouer.** Une API `record` sans consommateurs `downstream`/`upstream` produit un fichier JSON que personne ne lit. Construis le parcours dans la même étape que le stockage, comme fait ici.

## Ce que tu viens de construire

Un vrai catalogue de données : des fichiers CSV scannés en entrées de métadonnées structurées et typées ; un index JSON persistant qui survit aux redémarrages ; une recherche scorée sur les noms *et* les schémas ; et un graphe de lignée parcouru dans les deux directions pour que tu puisses répondre à « qu'est-ce qui casse si je change ceci ? » avec des preuves — tout en bibliothèque standard, tout exposé comme trois verbes CLI. La compétence transférable est l'architecture du catalogue elle-même : des descripteurs (métadonnées) gardés séparés des données, des index persistés avec une couche de requête, et des *arêtes de provenance explicites* qui transforment « je pense que c'est connecté » en un parcours de graphe que n'importe qui peut auditer.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/data-catalog/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-catalog) dans le dépôt du cours contient ces scripts complets plus des CSV d'exemple et un index pré-peuplé. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute une sous-commande `refresh` qui re-scanne chaque chemin `source` stocké dans l'index et met à jour comptes de lignes/types — la détection de dérive sur ton catalogue avec un parcours sur `entry.source`.
- Améliore `_infer_type` avec un verdict `date` (analyse avec `datetime.fromisoformat`) pour que les catalogues distinguent les vraies dates du texte — un changement de trois lignes dans l'arbre de décision.
- Inverse le scoreur de recherche vers le **tf-idf** (divise les comptes de termes par combien de jeux de données contiennent le terme) pour que les noms de colonnes génériques comme `id` cessent de dominer les résultats.
- Rends la lignée comme un bloc **Mermaid `graph TD`** (une ligne par arête) pour que `catalog.py lineage --format mermaid` produise un diagramme que n'importe quel issue GitHub peut intégrer.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓