---
title: "Linter de Code Python"
description: "Moteur de règles de linting personnalisé pour Python avec capacités de correction automatique et intégration IDE."
difficulty: "advanced"
estimatedMinutes: 90
tags: ["cli", "ast", "static-analysis", "tooling"]
learningObjectives:
  - Analyser du code source Python en arbre de syntaxe abstraite avec le module ast
  - Parcourir l'arbre avec un ast.NodeVisitor et collecter les nœuds par type
  - Associer les noms importés à leurs usages pour détecter les imports inutilisés
  - Classer les résultats par sévérité et émettre un rapport avec code de sortie pour la CI
prerequisites: ["python-101/functions", "python-101/data-structures", "python-101/file-io", "python-101/scope-and-lambdas"]
---

# 🧹 Construire un Linter de Code Python

Chaque projet Python sérieux exécute un linter avant de fusionner, et la première tâche du linter n'est pas de la science de fusée — c'est *lire la forme du code*. Python fournit un module de bibliothèque standard nommé `ast` qui analyse un fichier `.py` en un arbre de nœuds — imports, définitions de fonctions, appels, exceptions — que tu peux parcourir et inspecter. Ce projet construit un linter fonctionnel par-dessus : analyser un fichier, parcourir l'arbre, et signaler trois vrais problèmes — imports inutilisés, clauses `except:` nues, et fonctions plus longues qu'une limite de nombre de lignes — avec un niveau de sévérité par résultat et un code de sortie qui permet à un script de CI d'échouer dessus. Tu construis le moteur, et il est assez petit pour qu'on en comprenne chaque ligne.

Cela suppose le Python 101 — fonctions, dicts, entrées-sorties de fichiers, et une idée de la portée des variables. Rien au-delà de cela : pas de paquets, pas de framework, pas de services externes. C'est optionnel et non noté ; vois [Projets du monde réel](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Analyser un fichier Python en un AST et inspecter à quoi ressemble réellement l'arbre.
2. Parcourir l'arbre avec `ast.NodeVisitor` pour trouver les imports et les définitions de fonctions.
3. Élargir cela en motif de linting : collecter chaque nom qu'un fichier définit et chaque nom qu'il *utilise*, puis faire le diff.
4. Transformer les résultats collectés en rapport noté avec numéros de ligne.
5. Envelopper le rapport dans un CLI qui retourne un code de sortie non nul quand les résultats sont sévères — l'habitude d'intégration en CI.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — la raison d'être entière d'un linter est de le pointer sur un vrai fichier `.py` dans un vrai dépôt, et rien dans `ast` ne se soucie de l'endroit où vit le fichier. Les étapes ci-dessous écrivent le linter dans un petit dossier avec `uv` ; le pointer sur tes autres projets de cours est le self-test évident.

**GitHub Codespaces** fonctionne à l'identique : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et les commandes exactement identiques s'exécutent dans un onglet de navigateur — tu peux même linter les scripts racine du dépôt du cours.

**Google Colab, les notebooks Kaggle et Binder exécutent honnêtement chaque étape du moteur** — `ast` est de la pure stdlib, pas de GPU, pas de clés — mais le *produit* ici est un CLI sur des fichiers, et les notebooks sont le mauvais support pour « exécute ceci sur tout mon dossier de projet ». Le notebook linter son propre fichier brouillon fourni pour que tu puisses voir le moteur fonctionner de bout en bout ; passe en local pour le vrai cas d'usage façon `python -m pylint`.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/python-linter/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/python-linter/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpython-linter%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant la première analyse : `uv`, et un fichier de test délibérément négligé qui démontre les trois règles à la fois.

### Installe `uv` et structure le projet

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
mkdir python-linter && cd python-linter
uv init --bare
```

Zéro paquet supplémentaire — `ast` est dans la bibliothèque standard.

### Écris un fichier de test négligé

Colle ceci dans `sloppy.py` :

```python
import os
from math import sqrt, floor

def compute(x):
    unused = 42
    result = sqrt(x) + floor(x)
    return result

def process(data):
    try:
        return data["key"]
    except:
        return None

# 11+ line function, to blow past any sane limit
def long_function_start(a, b, c, d):
    one = a
    two = b
    three = c
    four = d
    five = one + two
    six = three + four
    seven = five + six
    eight = seven
    nine = eight
    ten = nine + a
    eleven = ten
    return eleven
```

```bash
uv run python -c "import ast; print('ast ready')"
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `sloppy.py` existe avec un `import os` inutilisé, une variable `unused` inutilisée, un `except:` nu, et une `long_function_start` trop longue.
- ✅ `uv run python -c "import ast"` réussit — tout le projet est la bibliothèque de cette seule ligne.

## Étape 1 : Analyse un fichier en un AST

Un linter voit le code comme un compilateur : un arbre de nœuds, pas des lignes de texte. `ast.parse` convertit la source en cet arbre, et `ast.dump` te montre la forme — le moyen le plus rapide de croire à toute l'approche est un `print(ast.dump(tree))`.

### 1.1 Analyse et inspecte

```python
# parse_ast.py
import ast
from pathlib import Path

def parse_source(path: str) -> ast.Module:
    source = Path(path).read_text(encoding="utf-8")
    return ast.parse(source)

if __name__ == "__main__":
    tree = parse_source("sloppy.py")
    print("module body has", len(tree.body), "statements")
    for node in tree.body:
        print(f"  {type(node).__name__}: {node.__dict__.get('name', '')!r} at line {node.lineno}")
```

`ast.parse` retourne un `ast.Module` dont le `.body` est une liste de nœuds d'instructions de niveau supérieur — `Import`, `ImportFrom`, `FunctionDef`. Chaque nœud porte un attribut `.lineno`, ce qui te permet de signaler des *numéros de ligne* sans les suivre toi-même ; le coup d'œil `node.__dict__.get('name', '')` montre que différents types de nœuds ont différents champs, ce qui explique pourquoi les linters se ramifient sur le type de nœud plutôt que d'espérer une forme uniforme.

**👟 Indice de départ :** Exécute-le et *lis* simplement les cinq lignes de sortie — imports, deux fonctions et `long_function_start` sont tous revenus comme nœuds typés avec numéros de ligne, avant même qu'on ait pensé à un linting quelconque.

**🎯 Résultat attendu :** `module body has 3 statements`, puis des lignes nommant `Import` / `ImportFrom` / `FunctionDef` / `FunctionDef` / `FunctionDef` avec les bons numéros de ligne de départ (1, 2, 4, 9, 14).

**🩹 Si ça ne marche pas :** Si `SyntaxError` se déclenche, le fichier de test a un problème de syntaxe — `ast.parse` est un analyseur strict par conception ; corrige la source (c'est aussi la toute première tâche d'un linter : un fichier qui ne parse pas est le résultat de plus haute sévérité). Si `AttributeError: 'Import' object has no attribute 'name'`, ta garde `.get('name', '')` n'est pas utilisée partout — chaque branche d'affichage de nœud doit utiliser `.get`, pas `.name`, car les nœuds `Import` portent `names`, pas `name`.

### 1.2 Vérifie l'analyse

**✅ Liste de vérification**

- ✅ `ast.parse` réussit sur `sloppy.py` et retourne un module dont le `.body` a exactement 3 instructions de niveau supérieur.
- ✅ Chaque nœud affiché montre `type.__name__` et un `lineno` numérique.
- ✅ `node.__dict__` pour un `ImportFrom` montre `module='math'` et `names` contenant `sqrt` et `floor`.
- ✅ Tu peux expliquer pourquoi l'arbre est préféré au regex sur le texte source (indice : indentation et chaînes).

**🤔 Question(s) socratique(s)**

- Pourquoi un linter construit sur du regex échouerait-il là où `ast` réussit — pointe une chose concrète dans `sloppy.py` (indice : `import os` à l'intérieur d'une *chaîne* correspondrait à un regex mais n'est pas un import). Qu'est-ce qui rend l'arbre immunisé ?
- Le `linting` lit l'arbre, donc ton linter ne peut voir que ce que l'analyseur pouvait. Quelle propriété réelle du code est invisible à `ast` par conception (indice : elle concerne des noms qui n'existent pas encore) ? Cela te rend-il *à l'aise* pour limiter d'abord les règles que tu écris ?

## Étape 2 : Parcours l'arbre avec NodeVisitor

La récursion manuelle sur `tree.body` fonctionne pour un niveau et s'effondre en profondeur : un import dans une fonction, ou une fonction dans une classe, est imbriqué deux niveaux plus bas. `ast.NodeVisitor` est la réponse de la bibliothèque standard — tu dis « appelle cette méthode à chaque fois que tu vois un nœud X », et il fait la récursion pour toi.

### 2.1 Visite les imports et les définitions de fonctions

```python
# walk.py
import ast
from parse_ast import parse_source

class ImportVisitor(ast.NodeVisitor):
    def __init__(self):
        self.imports = []
        self.functions = []

    def visit_Import(self, node):
        self.imports.append((node.lineno, node.names[0].name))

    def visit_ImportFrom(self, node):
        self.imports.append((node.lineno, f"{node.module}.{node.names[0].name}"))

    def visit_FunctionDef(self, node):
        self.functions.append((node.lineno, node.name, len(node.body)))

if __name__ == "__main__":
    v = ImportVisitor()
    v.visit(parse_source("sloppy.py"))
    print("imports:", v.imports)
    print("functions:", v.functions)
```

Le motif est les méthodes `visit_X` + un appel `.visit(tree)` : le framework du visiteur répartit chaque type de nœud vers sa méthode et redescend automatiquement dans l'arbre — y compris les imports imbriqués dans des fonctions, que `tree.body` seul ne voit jamais. Chaque méthode est libre de *collecter* dans une liste simple ; la séparation « callbacks comme méthodes, parcours d'arbre comme convention » est tout le design, et elle est plus forte que la marche manuelle parce que la profondeur ne coûte rien.

**👟 Indice de départ :** Exécute-le et vérifie que `long_function_start` a été enregistré avec son `len(node.body)` complet — le visiteur a récursé dans son `body`, ce qui est exactement ce que l'itération manuelle de niveau supérieur ne pouvait pas faire.

**🎯 Résultat attendu :** `imports: [(1, 'os'), (2, 'math.sqrt')]`, `functions: [(4, 'compute', 4), (9, 'process', 4), (14, 'long_function_start', 11)]` — remarque le `11` pour la fonction longue.

**🩹 Si ça ne marche pas :** Si `functions` est vide, `.visit()` n'a jamais été appelé — le visiteur ne fait que *définir* les méthodes ; la répartition se produit quand tu lui passes l'arbre. Si seules les fonctions de niveau supérieur apparaissent, ton visiteur a récursé manuellement au lieu d'hériter de `ast.NodeVisitor` — la traversée `super()` (que NodeVisitor fait gratuitement) est ce qui descend dans les corps imbriqués.

### 2.2 Vérifie la marche

**✅ Liste de vérification**

- ✅ `ImportVisitor` collecte à la fois un `Import` et un `ImportFrom` depuis le niveau supérieur *et* depuis toute position imbriquée.
- ✅ Le `len(node.body)` de chaque fonction reflète son vrai compte d'instructions (11 pour `long_function_start`).
- ✅ Le visiteur récurse — ajouter une fonction dans une fonction dans une fonction la fait toujours remonter.
- ✅ Tu peux expliquer pourquoi `visit_FunctionDef` collecte mais ne *récuse* pas lui-même (NodeVisitor fait la récursion).

**🤔 Question(s) socratique(s)**

- `NodeVisitor` répartit sur le nom du type de nœud. Si deux versions différentes de Python ajoutent un *nouveau* type d'instruction pour lequel ton linter n'a pas de méthode `visit_`, qu'en fait le visiteur — et ignorer silencieusement une nouvelle syntaxe est-il une fonctionnalité ou une falaise pour un outil de linting ?
- Notre visiteur enregistre `(lineno, name, body_len)`. Que devrais-tu stocker à la place si tu veux plus tard linter des fonctions *imbriquées* dans un `ClassDef` — et est-ce que `.visit()` te le donne gratuitement ? Quoi que tu stockes, que cela *ne* capture-t-il pas ?

## Étape 3 : Détecte les imports inutilisés

Le lint le plus savoureux. Un `import os` en haut ne veut rien dire si rien ne l'utilise ; le détecteur est un diff de noms : collecter chaque nom que le fichier *définit* en important, collecter chaque nom que le fichier *utilise* comme un nom (`ast.Name`), et les imports dont les alias n'apparaissent jamais dans l'ensemble utilisé sont inutilisés. C'est de l'arithmétique d'ensembles sur des arbres.

### 3.1 Construis le diff de noms

```python
# unused.py
import ast
from parse_ast import parse_source

class NameCollector(ast.NodeVisitor):
    def __init__(self):
        self.imported = {}
        self.used = set()

    def visit_Import(self, node):
        for alias in node.names:
            self.imported[alias.asname or alias.name.split(".")[0]] = node.lineno

    def visit_ImportFrom(self, node):
        for alias in node.names:
            self.imported[alias.asname or alias.name] = node.lineno

    def visit_Name(self, node):
        self.used.add(node.id)

def find_unused_imports(src_path: str) -> list[tuple]:
    v = NameCollector()
    v.visit(parse_source(src_path))
    return [(name, lineno) for name, lineno in v.imported.items()
            if name not in v.used]

if __name__ == "__main__":
    for name, line in find_unused_imports("sloppy.py"):
        print(f"line {line}: unused import {name!r}")
```

Les deux collections ont grandi symétriquement : `imported` est un `dict` d'alias → ligne (les alias sont ce à quoi l'autre code se réfère — `import os` lie `os`, `import math.sqrt` lie `sqrt` comme `asname or name.split(".")[0]`, et `from math import sqrt` lie `sqrt` directement), et `used` est l'ensemble de chaque id `ast.Name` que le fichier mentionne. Un import est « inutilisé » exactement quand son alias lié est absent de l'ensemble utilisé — et un nom *ré-exporté* délibérément (`__all__`) est le faux positif classique que cette version simple invite (voir les pièges).

**👟 Indice de départ :** Avant d'exécuter, prédis ce qui devrait être signalé : `os` a été importé (ligne 1) et jamais utilisé — un résultat. `sqrt` et `floor` sont tous deux utilisés dans `compute`. Confirme que l'outil est d'accord, puis ajoute `print(floor(2.7))` quelque part et regarde `math.floor` devenir « utilisé » — voir l'ensemble se mettre à jour est tout le modèle.

**🎯 Résultat attendu :** Exactement une ligne : `line 1: unused import 'os'`. `sqrt` et `floor` n'apparaissent pas.

**🩹 Si ça ne marche pas :** Si `sqrt` est faussement signalé inutilisé, ton `visit_Name` a collecté délibérément *uniquement* les noms de niveau supérieur ou tu n'as jamais visité les corps des `FunctionDef` — le visiteur doit collecter l'usage `Name` depuis *chaque* portée ; la récursion via `NodeVisitor` gère cela. Si `os` n'est pas signalé, tu fais le diff de la mauvaise collection — `os` est dans `imported`, mais `used` doit *ne pas* le contenir ; affiche les deux ensembles et le diff se filtre de lui-même.

### 3.2 Vérifie la règle d'import inutilisé

**✅ Liste de vérification**

- ✅ `sloppy.py` produit exactement le seul résultat `os`.
- ✅ Utiliser `floor` n'importe où dans un corps de fonction retire `floor` des résultats — la portée n'a pas d'importance.
- ✅ `from x import y as z` lie `z`, pas `y` — le repli `asname or ...` fait son travail.
- ✅ Tu peux énoncer la règle en une phrase : un import est inutilisé ssi son alias lié n'apparaît jamais comme un nom utilisé.

**🤔 Question(s) socratique(s)**

- Un nom utilisé dans une *chaîne* (`"os.path.join..."`) ou comme *littéral* n'est pas un `ast.Name` — mais un fichier qui fait `__all__ = ["os"]` *est* un usage. Quelle direction est le faux positif, et que devrait ajouter le code pour traiter `__all__` correctement ? Quel est le plus petit changement qui garde ta version simple ?
- `visit_Name` collecte *chaque* nom, y compris les lectures sans effet de bord comme la variable nue `unused = 42`, dont la *définition* est aussi un `Name`. « Le nom apparaît quelque part » suffit-il pour « l'import est utilisé » — ou ta règle doit-elle distinguer les *lectures* des *écritures* (indice : `ast.Name` a un champ `ctx` — `Store` contre `Load`) ?

## Étape 4 : Note et rapporte les résultats

Les linters gagnent leur vie en *notant* : un `except:` nu est pire qu'une fonction longue, et un candidat à la maintenance est pire qu'un détail de style. Cette étape élargit le collecteur d'une règle à trois, assigne une sévérité à chacune, et produit le rapport imprimable que ton CLI rendra.

### 4.1 Collecte trois familles de règles

```python
# rules.py
from unused import NameCollector, find_unused_imports
from walk import ImportVisitor
from parse_ast import parse_source
import ast

SEVERITY = {"error": 2, "warning": 1, "suggestion": 0}
LIMIT_FUNCTION_LINES = 10

def bare_excepts(src_path: str) -> list[tuple]:
    findings = []
    for node in ast.walk(parse_source(src_path)):
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            findings.append((node.lineno, "bare except: catches everything"))
    return findings

def long_functions(src_path: str, limit: int = LIMIT_FUNCTION_LINES) -> list[tuple]:
    v = ImportVisitor()
    v.visit(parse_source(src_path))
    return [(ln, f"{name} is {bl} lines (>{limit})")
            for ln, name, bl in v.functions if bl > limit]

def lint(src_path: str) -> list[tuple[str, int, str]]:
    report = []
    for name, line in find_unused_imports(src_path):
        report.append(("suggestion", line, f"unused import {name!r}"))
    for line, msg in bare_excepts(src_path):
        report.append(("error", line, msg))
    for line, msg in long_functions(src_path):
        report.append(("warning", line, msg))
    return sorted(report, key=lambda r: (-SEVERITY[r[0]], r[1]))

if __name__ == "__main__":
    for sev, line, msg in lint("sloppy.py"):
        print(f"{sev:>10}  line {line:>3}  {msg}")
```

`ast.walk` est le jumeau non visité de `NodeVisitor` — un générateur à usage unique qui produit *chaque* nœud de l'arbre, parfait pour une règle qui ne s'intéresse qu'à un seul type de nœud n'importe où dans le fichier (`ExceptHandler` sans `type`). Le rapport est une liste triée de triplets `(severity, line, message)` — triée d'abord par poids de sévérité, ensuite par ligne — donc les `error` remontent avant les `suggestion` dans une passe unique cohérente. Les fonctions de règles restent indépendantes et ne partagent que la liste de rapport, ce qui fait qu'un moteur de règles reste *additif* : les nouvelles règles sont de nouveaux tests indépendants, pas des modifications d'une fonction spaghetti.

**👟 Indice de départ :** Exécute le rapport et confirme que les trois *familles* de règles se déclenchent sur `sloppy.py` — l'import inutilisé, l'except nu (error, le plus élevé), et la fonction longue (warning). Puis ajoute `os.getcwd()` dans `compute` et regarde la suggestion d'import inutilisé disparaître tandis que les deux autres restent — chaque règle est indépendante.

**🎯 Résultat attendu :** Trois lignes — `error  line 11: bare except: catches everything`, `warning  line 14: long_function_start is 11 lines (>10)`, `suggestion  line 1: unused import 'os'` — dans exactement cet ordre de sévérité.

**🩹 Si ça ne marche pas :** Si l'ordre de sévérité sort faux, la clé de tri `(-SEVERITY[r[0]], r[1])` évalue `error=2` → `-2`, et les poids supérieurs doivent se trier en premier — vérifie que les nombres du dict `SEVERITY` correspondent au sens. Si la fonction longue rapporte `11 (>10)` mais tu as défini `LIMIT_FUNCTION_LINES = 10`, le compte `body = 11` est correct — la limite est un *seuil*, donc `> limit` est juste ; change `>` en `>=` uniquement si tu veux qu'exactement-10 compte comme trop long.

### 4.2 Vérifie le rapport noté

**✅ Liste de vérification**

- ✅ Les trois familles de règles se déclenchent sur `sloppy.py`, aucune règle n'en supprime une autre.
- ✅ Les lignes du rapport se trient par sévérité (error → warning → suggestion), chacune avec un vrai numéro de ligne.
- ✅ Supprimer la ligne `except` nue retire l'erreur et rien d'autre — les règles sont des fonctions indépendantes.
- ✅ Le choix `ast.walk` contre `NodeVisitor` est délibéré : `walk` pour les balayages complets à usage unique, un visiteur quand une règle a besoin d'un état accumulé (comme le diff de noms).

**🤔 Question(s) socratique(s)**

- Élever `LIMIT_FUNCTION_LINES` est un bouton de config dans la signature de la fonction. Si un projet veut des limites *par fichier*, quel est le plus petit changement (indice : un dict `config` passé à `lint`) qui garde chaque règle pure ? Quand « config » commence-t-il à valoir la peine — 3 règles ou 30 ?
- Notre `ast.walk` pour les excepts nus balaye tout l'arbre pour un type de nœud. La règle d'import inutilisé *a besoin* de la collecte en deux passes de l'Étape 3. Que coûterait une session de linting qui devait ré-analyser le fichier pour *chaque règle* à 50 règles — et quel est le refactor (analyser une fois, passer l'arbre à chaque règle) qui l'évite ?

## Étape 5 : Livre le CLI

Un linter que personne ne peut exécuter depuis un terminal est une feuille d'exercices, pas un outil. L'Étape 5 enveloppe `lint` dans une vraie commande : `argparse` pour le chemin, une impression orientée humain, un compte, et — le chef-d'œuvre des CI — un code de sortie non nul quand un résultat `error`-ou-pire est présent, pour qu'un script de build puisse *échouer* sur le rapport.

### 5.1 Écris le point d'entrée avec code de sortie

```python
# linter.py
import argparse
import sys
from rules import lint, SEVERITY

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="lint a Python file with ast-based rules")
    parser.add_argument("path", help="path to the .py file to lint")
    parser.add_argument("--fail-on", choices=["error", "warning", "suggestion"],
                        default="error", help="minimum severity that sets a non-zero exit")
    args = parser.parse_args(argv)
    report = lint(args.path)
    for sev, line, msg in report:
        print(f"{args.path}:{line}: {sev}: {msg}")
    failures = [r for r in report if SEVERITY[r[0]] >= SEVERITY[args.fail_on]]
    print(f"{len(report)} finding(s), {len(failures)} at/above '{args.fail_on}'")
    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())
```

Le contrat de code de sortie est toute l'étape : `main` *retourne* un entier (0 propre, 1 sale) et la garde `sys.exit(main())` transforme la valeur de retour en statut de processus. `--fail-on` fait du seuil une décision que l'appelant possède — `linter.py sloppy.py` sort en 1 par défaut (une erreur existe) tandis que `--fail-on suggestion` sortirait en 1 pour le seul import inutilisé, donnant à la CI exactement la bascule dont un projet a besoin à mesure que ses standards évoluent.

**👟 Indice de départ :** Exécute `uv run python linter.py sloppy.py` et vérifie immédiatement `$?` (ou imprime la valeur de retour) — le fichier *a* une erreur, donc le code de sortie doit être 1. Puis corrige l'except nu dans `sloppy.py` et réexécute pour voir la sortie retomber à 0.

**🎯 Résultat attendu :** Cinq lignes au total — trois résultats, puis `3 finding(s), 1 at/above 'error'` — et le `$?` du shell (équivalemment, la valeur de retour de `main()`) est `1`. Après la correction de l'except : la sortie devient `0`.

**🩹 Si ça ne marche pas :** Si le code de sortie est toujours 0 malgré les résultats, `sys.exit(main())` n'est pas la dernière ligne — la valeur de retour doit atterrir dans `sys.exit`, pas dans un print. Si `--fail-on suggestion` ne bascule pas la sortie, la comparaison `>=` contre les poids de sévérité est inversée ou les nombres de `SEVERITY` sont inversés — vérifie en imprimant `SEVERITY[args.fail_on]`.

### 5.2 Vérifie le CLI

**✅ Liste de vérification**

- ✅ `uv run python linter.py sloppy.py` affiche les résultats avec `path:line: severity: message` et sort en `1`.
- ✅ `--fail-on warning` et `--fail-on suggestion` élargissent tous deux l'ensemble d'échec ; `--fail-on error` le garde étroit.
- ✅ Un fichier propre (ou un `sloppy.py` corrigé) sort en `0` avec `0 finding(s)`.
- ✅ Un fichier à *erreur de syntaxe* — s'il ne parse pas, le `SyntaxError` de l'Étape 1 se propage réellement comme un crash bruyant plutôt qu'un rapport vide silencieux ; tu décides plus tard de l'attraper et d'afficher un message plus joli.

**🤔 Question(s) socratique(s)**

- Le code de sortie distingue « 0 résultats » de « résultats sous mon seuil » — les deux peuvent retourner 0. Pour un script de CI, est-ce le contrat que tu veux, ou préférerais-tu des codes de sortie 0/1/2 pour distinguer propre-des-avertissements de propre-pur ? Qu'est-ce qui casse dans le shell dans les deux cas ?
- `--fail-on` bascule la *rigueur* à l'exécution. Quel est l'argument pour garder les seuils dans la source du linter (config par projet) à la place — et quel est l'inconvénient concret du drapeau quand le linter tourne dans un pipeline de 30 jobs, chacun avec son propre seuil ?

## ⚠️ Pièges courants

- **Sauter le cas d'échec d'analyse.** Le premier résultat d'un vrai linting est « le fichier ne parse pas » — le `SyntaxError` de `ast.parse` est un crash, et un linter qui plante sur une mauvaise syntaxe est pire qu'un qui la rapporte. Décide tôt : attrape `SyntaxError` et affiche-le comme résultat de plus haute sévérité (le choix honnête), ou laisse-le planter bruyamment (tolérable tant que tu possèdes chaque fichier d'entrée).
- **Les règles basées sur les noms qui trébuchent sur `__all__` et les ré-exports.** Un module qui fait `from .utils import retry` *pour le ré-exporter* a un nom à l'air utilisé seulement dans `__all__` — le diff naïf le signale inutilisé et un vrai codebase se noie de faux positifs. La correction est d'autoriser explicitement les noms listés dans `__all__`, ou de documenter que ton linter échange cette précision contre la simplicité.
- **Confondre `Store` et `Load`.** `unused = 42` *définit* un nom dans un contexte `Store` ; `print(the_name)` *le lit* dans un contexte `Load`. Une règle qui compte tout `ast.Name` comme un « usage » ne peut pas distinguer « importé et lu » de « importé et écrasé » — vérifie `node.ctx` et décide par règle si les deux côtés comptent.
- **Ré-analyser par règle.** Une `ast.parse` par règle est très bien à 3 règles et au ressenti quadratique à 50. Puisque *chaque* règle veut le même arbre, analyse une fois et passe l'arbre (ou mets-le en cache par chemin) dans chaque règle indépendante — la même discipline que la composition du rapport de l'Étape 4.
- **L'amnésie du code de sortie.** Un linter qui *affiche* des résultats mais sort en 0 est du théâtre en CI — le pipeline voit vert et fusionne le `except` nu. Le code de sortie est le produit ; le retourner depuis `main()` et le `sys.exit`-er est l'inséparable dernier 1 % qui fait que les autres 99 % comptent.

## Ce que tu viens de construire

Un linter Python fonctionnel : `ast.parse` en entrée, un rapport noté avec numéros de ligne en sortie, avec trois règles indépendantes — imports inutilisés via un diff de noms, excepts nus via des balayages d'arbre entier, fonctions surdimensionnées via des comptages de visiteurs — et un CLI dont le code de sortie peut réellement bloquer un build. Chaque résultat est directement traçable à un nœud de l'arbre, donc rien ici n'est magique ; tu peux pointer le même moteur sur une toute nouvelle règle en dix minutes. La compétence transférable est la programmation d'AST elle-même — parcourir un arbre d'instructions est le backend des linters, formateurs, transpileurs, couvreurs de tests et générateurs de code, et le motif « analyser une fois, parcourir délibérément, différer les noms » vit désormais dans tes mains pour chacun d'eux.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/python-linter/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/python-linter) dans le dépôt du cours regroupe les modules visiteur, diff de noms, règles et CLI, plus `sloppy.py` et un notebook qui exécute le moteur étape par étape. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et linter le fichier fourni dans un onglet de navigateur.
:::

## Où aller à partir d'ici

- **Ajoute une quatrième règle :** détecte le code inatteignable avec une analyse de style `ast.After` — parcours pour un `return` suivi d'autres instructions dans le même corps, la règle qui attrape les `print` morts avant qu'ils ne soient livrés.
- **Auto-corrige la plus facile :** un `--fix` qui réécrit le fichier avec les lignes d'import inutilisées retirées — tu connais déjà leurs numéros de ligne, et retirer tout en *continuant* de linter est l'honnête procédure en deux temps.
- **Multi-fichiers avec `--recursive` :** parcours un répertoire avec `pathlib.Path.rglob("*.py")` et fusionne le rapport de chaque fichier en un seul flux, trié globalement par sévérité — l'étape qui en fait un vrai linter de projet plutôt qu'un jouet mono-fichier.
- **Linter ton propre code :** pointe `linter.py` sur `examples/` du dépôt du cours et vois ce que les règles disent d'un codebase mûr — puis choisis le résultat que tu corrigerais en premier et fais-en une PR dans ton propre fork.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier — une règle qui a attrapé un vrai bug dans ton propre code, un linter que tes coéquipiers ont adopté ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README t'accompagne dans l'ajout du tien via une **pull request** de bout en bout : forker, créer une branche, commiter, et ouvrir la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
