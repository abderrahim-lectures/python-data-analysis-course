---
title: "Analyseur de Dépendances"
description: "Lis les dépendances déclarées d'un projet, scanne ses vrais imports, et signale ce qui est inutilisé ou hors politique."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["cli", "re", "dependency-management", "file-scanning"]
prerequisites:
  - "Les bases de Python (ensembles, chemins, regex)"
  - "Être à l'aise pour exécuter des fichiers Python depuis un shell"
learningObjectives:
  - "Analyser requirements.txt en enregistrements de dépendances structurés avec types de spec"
  - "Scanner une arborescence source pour les imports et classifier stdlib vs tierce partie vs local"
  - "Croiser déclaré vs importé pour trouver les dépendances inutilisées"
  - "Vérifier les versions déclarées contre une ligne de base d'advisories locale"
  - "Emballer le pipeline comme une CLI dont le code de sortie porte une porte de build"
---

# 🧩 Construire un Analyseur de Dépendances

Un `requirements.txt` dit qu'une équipe a *l'intention* d'utiliser cinq paquets. Les fichiers réellement écrits disent quels paquets sont *réellement* importés. La différence entre les deux est là où vivent le gaspillage et le risque : des pins inutilisés gonflent les installations à ce jour, et un `numpy==1.26.0` épinglé peut s'asseoir deux versions mineures derrière le minimum de sécurité sans que personne ne le remarque jusqu'à ce qu'un bot scanne le manifeste. Ce projet construit le petit analyseur qui referme l'écart — analyse le manifeste, scanne les imports, et rapporte ce sur quoi les deux divergent, tout avec la bibliothèque standard.

Ceci suppose Python 101 plus une lecture confortable de `pathlib` et `re`. Rien du module Analyse de Données n'est nécessaire. C'est facultatif et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Analyser `requirements.txt` en enregistrements `(name, spec)` et classifier chaque pin comme épinglé, borné, ou non épinglé.
2. Scanner une arborescence source `myapp/`, classifier chaque import comme stdlib, tierce partie, ou local.
3. Croiser les deux : les dépendances déclarées mais jamais importées.
4. Comparer les versions déclarées contre une ligne de base d'advisories locale de versions minimales.
5. En faire une CLI avec des codes de sortie (`0` = sain, `1` = deps inutilisées, `2` = violation de politique) pour qu'un build puisse agir sans analyser du texte.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — tout le travail de l'outil est de parcourir *ton* répertoire, et un scanneur de répertoires fonctionne mieux comme CLI locale.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent pour chaque étape — le notebook dans [`examples/dependency-analyzer/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ipynb) exécute le même analyseur sur un projet d'échantillon fourni. Le compromis honnête : les notebooks ne peuvent pas parcourir un référentiel arbitraire comme une CLI locale le peut.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdependency-analyzer%2Fnotebook.ipynb)

## Configuration

`uv` est un outil unique qui remplace toute la chaîne « install Python, puis pip, puis un outil d'environnement virtuel » — et ce projet est pure bibliothèque standard.

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
uv init dependency-analyzer
cd dependency-analyzer
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `dependency-analyzer/` existe avec un `pyproject.toml`.
- ✅ `python -c "import re, sys, pathlib"` réussit — aucun paquet tiers.

## Étape 1 : Analyser `requirements.txt`

Tout commence du manifeste : une dépendance par ligne, parfois épinglée (`==2.31.0`), parfois bornée (`>=2.0`, `~=3.0`), parfois lâche (aucune spec du tout). Analyser signifie extraire `(name, spec)` et classifier la spec, car « ce pin est-il vieux ? » veut dire des choses différentes pour une version verrouillée que pour un intervalle ouvert.

### 1.1 Écris l'analyseur

**👟 Indice de départ :** Sépare les commentaires en ligne et les lignes d'options, prends le nom du paquet avant le premier espace, et classifie la spec avec deux petites regex :

```python
# parse_req.py
import re

def parse_requirements(path: str) -> list[dict]:
    deps: list[dict] = []
    with open(path) as f:
        for line in f:
            line = line.split("#", 1)[0].strip()
            if not line or line.startswith(("-", ".", "[")):
                continue
            m = re.match(r"^([A-Za-z0-9_.\-]+)\s*(.*)$", line)
            if not m:
                continue
            deps.append({"name": m.group(1).lower(), "spec": m.group(2).strip()})
    return deps

def classify_spec(spec: str) -> str:
    if re.fullmatch(r"==[\d.]+", spec):
        return "pinned"
    return "ranged" if spec else "unpinned"

if __name__ == "__main__":
    for d in parse_requirements("myapp/requirements.txt"):
        print(f"{d['name']:<12} {d['spec'] or '<any>':<16} {classify_spec(d['spec'])}")
```

`line.split("#", 1)[0]` retire les commentaires en ligne (`requests==2.31.0  # prod`) avant tout le reste ; la garde `line.startswith(...)` saute les lignes de machinerie comme `--index-url` et `.` (une dépendance de chemin local). La regex `classify_spec` est délibérément stricte sur ce qui compte comme un pin : `==2.31.0` est verrouillé, tandis que `>=2.0` et `~=3.0` sont des intervalles qui dérivent.

**🎯 Résultat attendu :**

```
requests     ==2.31.0         pinned
pandas       >=2.0            ranged
numpy        ==1.26.0         pinned
flask        ~=3.0            ranged
click        >=8.0            ranged
```

**🩹 Si ça ne marche pas :** Si les noms sortent capitalisés, le `.lower()` sur `m.group(1)` manque — les noms de paquets sont insensibles à la casse sur PyPI mais les chemins de fichiers ne le sont pas, donc normalise en minuscules par avance. Si `--index-url https://...` finit comme une « dépendance », la garde `-` ne se déclenche qu'avant que `.strip()` l'ait découpée — vérifie l'ordre des gardes : split → strip → sauter les vides → sauter les lignes qui ressemblent à des options.

### 1.2 Vérifie l'analyseur

**✅ Liste de vérification**

- ✅ Un commentaire `#` sur sa propre ligne et en ligne après un pin sont tous deux ignorés.
- ✅ Le style `pip freeze` `package==1.2.3` et le PEP 440 `package>=1.2,<2` produisent tous deux des paires `(name, spec)`.
- ✅ Les lignes jamais vues dans `requirements.txt` — vides, options, `-r other.txt` — sont sautées sans crasher.

**🤔 Question(s) socratique(s)**

- Épinglé vs borné vs non épinglé est une classification *d'un bit*. Un `~=3.0` (version compatible) et un `>=20,<21` (borne supérieure) pin différemment mais disent tous deux « ranged ». Que devrait ajouter un analyseur de spec plus riche pour distinguer « dérive bornée » de « dérive ouverte » — et lequel des deux un scan de sécurité devrait-il traiter comme plus risqué ?
- `-e .` (installations locales éditables) et `-r base.txt` (inclut un autre fichier) commencent tous deux par `-` et sont sautés. Qu'est-ce qui est faux à les ranger sous « options » — que signifient ces deux-là *réellement* pour l'ensemble de dépendances ?

## Étape 2 : Scanner les imports

Le manifeste est un côté de la vérité ; le code est l'autre. Scanner signifie parcourir chaque `.py` sous ta racine de projet, tirer le nom de module de chaque `import x` / `from x import y`, et classifier chaque nom comme *stdlib* (vérifie contre `sys.stdlib_module_names`), *le tien* (un préfixe de projet), ou *tierce partie*. Le troisième groupe est celui qui est comparé au manifeste.

### 2.1 Écris le scanneur

**👟 Indice de départ :** Une regex ancrée à la ligne pour les instructions d'import, `Path.rglob("*.py")` pour le parcours, et `sys.stdlib_module_names` pour la classification — tout en stdlib :

```python
# scan.py
import re
import sys
from pathlib import Path

IMPORT_RE = re.compile(r"^\s*(?:import|from)\s+([\w.]+)", re.M)
STDLIB = set(sys.stdlib_module_names)

def scan_directory(root: str) -> set[str]:
    imports: set[str] = set()
    for path in Path(root).rglob("*.py"):
        imports |= {m for m in IMPORT_RE.findall(path.read_text())}
    return {name.split(".")[0] for name in imports}

def classify(imports: set[str], project: str) -> tuple[set[str], set[str], set[str]]:
    stdl, third, local = set(), set(), set()
    for name in imports:
        if name in STDLIB:
            stdl.add(name)
        elif name == project or name.startswith(project + "."):
            local.add(name)
        else:
            third.add(name)
    return stdl, third, local

if __name__ == "__main__":
    Path("myapp").mkdir(exist_ok=True)
    Path("myapp/app.py").write_text(
        "import os\nimport sys\nimport requests\nimport pandas as pd\n"
        "from myapp.utils import normalize\n")
    Path("myapp/utils.py").write_text(
        "import datetime\nimport numpy as np\n"
        "def normalize(value):\n    return value\n")

    imports = scan_directory("myapp")
    stdl, third, local = classify(imports, project="myapp")
    print("stdlib:", sorted(stdl))
    print("third-party:", sorted(third))
    print("local:", sorted(local))
```

Le scan normalise `from pandas import DataFrame` et `import pandas as pd` vers le même nom de premier niveau `pandas` — `name.split(".")[0]` réduit aussi `myapp.utils` à `myapp`, donc chaque import s'effondre vers le mot unique que le manifeste déclarerait. `sys.stdlib_module_names` est tout l'intérêt de cette génération de Python : un ensemble curé de noms stdlib, aucune liste codée en dur à maintenir. Les deux fichiers de démo existent pour être *scannés*, pas exécutés — `app.py` utilise `pandas` qui n'est pas installé ici, et c'est exactement pourquoi tu n'exécutes pas le code que tu analyses.

**🎯 Résultat attendu :**

```
stdlib: ['datetime', 'os', 'sys']
third-party: ['numpy', 'pandas', 'requests']
local: ['myapp']
```

**🩹 Si ça ne marche pas :** Si `myapp` apparaît dans le groupe stdlib, `sys.stdlib_module_names` n'est pas présent (Python < 3.10) — tout l'ensemble `STDLIB` est alors vide, donc tout retombe en tierce partie ; exécute sur 3.10+. Si les imports au milieu d'un fichier sont ratés, `IMPORT_RE` utilise `^` *avec* le drapeau `re.M` — retire `re.M` et seuls les `import` en *début de ligne* correspondent, ce qui sautera silencieusement les imports indentés à l'intérieur des fonctions (du Python valide, et la regex ne peut pas les distinguer).

### 2.2 Vérifie le scan

**✅ Liste de vérification**

- ✅ Les noms de bibliothèque standard (`os`, `sys`, `datetime`) atterrissent en stdlib, pas en tierce partie — la classification utilise `sys.stdlib_module_names`, pas une devinette de machine à écrire.
- ✅ `import pandas as pd`, `from myapp.utils import normalize`, et `import requests` s'effondrent tous vers `pandas`/`myapp`/`requests`.
- ✅ Un répertoire sans fichier `.py` produit un ensemble d'imports vide, pas un crash.

**🤔 Question(s) socratique(s)**

- Le scanneur est basé sur le texte : il lit des *jetons* `import`, pas du code. `import numpy as np  # dans un commentaire` serait attrapé, et `if False: import numpy` aussi. Qu'un scanneur basé sur AST (le module `ast`) ajoute-t-il au-delà de la regex — et que ne connaît-il *toujours pas* qu'un profil d'exécution (`import foo` puis `foo()` au moment de l'exécution) le ferait ?
- Les imports relatifs (`from . import x`, `from ..y import z`) disparaissent silencieusement de ce scanneur. Pourquoi `.` échoue la regex ancrée `\w` — et rater un import relatif est-il un échec *sûr* pour un rapport « dépendance inutilisée » ou un échec *dangereux* ?

## Étape 3 : Trouver les dépendances inutilisées

Voici maintenant le paiement d'avoir les deux côtés : **déclaré** (depuis `requirements.txt`) moins **importé** (ce que le code tire réellement). Tout ce qui est déclaré-mais-pas-importé est soit du poids mort à couper soit un signe que le scan manque quelque chose — les deux valent un regard humain. La vérification est une différence d'ensembles ; l'honnêteté est dans le fait d'admettre que la différence d'ensembles n'est aussi bonne que le scanneur.

### 3.1 Écris `find_unused`

**👟 Indice de départ :** Une fonction, une soustraction d'ensemble, une liste triée à la sortie — la valeur n'est pas l'arithmétique, c'est que tu *as* deux ensembles fiables à soustraire :

```python
# unused.py
def find_unused(declared: set[str], imported: set[str]) -> list[str]:
    return sorted(declared - imported)
```

### 3.2 Lance-le sur le projet

```python
# step3.py
from parse_req import parse_requirements
from scan import scan_directory
from unused import find_unused

declared = {d["name"] for d in parse_requirements("myapp/requirements.txt")}
imported = scan_directory("myapp")
for name in find_unused(declared, imported):
    print(f"unused: {name}")
```

Trois paquets importés (`requests`, `pandas`, `numpy`) correspondent à trois déclarés ; `flask` et `click` sont déclarés mais jamais importés. La direction inverse — *importé mais pas déclaré* — est tout aussi juteuse et un changement d'une ligne (`imported - declared`), mais c'est un bug différent : ton code ne s'installera pas dans un environnement frais du tout. La portée décidée ici est « déclaré mais inutilisé », car c'est la branche sur laquelle tu peux agir immédiatement (supprime les lignes) et parce que le travail frère d'environnement frais est souvent le travail d'un outil séparé.

**🎯 Résultat attendu :**

```
unused: click
unused: flask
```

**🩹 Si ça ne marche pas :** Si pandas apparaît comme inutilisé, le classifieur l'a envoyé vers le groupe *local* (le préfixe de projet a-t-il correspondu à `pandas.` ?) — puis il n'atterrit jamais dans `imported` pour la soustraction. Vérifie l'ordre des `elif` de `classify`. Si *tout* est inutilisé, `scan_directory` a parcouru la mauvaise racine — la démo scanne `myapp/`, donc confirme que le chemin `requirements.txt` et le `--dir` sont le même arbre.

### 3.3 Vérifie la liste d'inutilisés

**✅ Liste de vérification**

- ✅ L'ensemble déclaré est `{requests, pandas, numpy, flask, click}` ; l'ensemble importé est `{os, sys, datetime, requests, pandas, numpy, myapp}` ; la différence est exactement `{click, flask}`.
- ✅ La sortie des inutilisés est alphabétisée (triée), donc les tests peuvent dépendre de l'ordre.
- ✅ Retirer `flask~=3.0` et `click>=8.0` de `requirements.txt` vide la liste d'inutilisés — l'outil trouve les pins morts, il ne les imagine pas.

**🤔 Question(s) socratique(s)**

- Collision de nom régionale : tu déclares `requests` (le paquet PyPI) mais tu *as aussi* un module local `requests/` — la soustraction d'ensembles voit une dépendance utilisée et reste silencieuse. Qu'un outil doit-il ajouter (scénario : vérifie *comment* un nom est importé, ex. `from requests import Session` vs `import requests.utils` qui choisit un fichier local) avant de pouvoir appeler cette colonne « utilisé vérifié » ?
- `click` et `flask` sont « inutilisés » selon le scan, mais `flask` charge souvent un autre plugin déclaré par *point d'entrée*, pas par import. Qu'est-ce que cela dit d'un analyseur qui ne voit que les lignes `import` — « inutilisé » est-il un verdict ou une alerte ?

## Étape 4 : Vérifier les versions contre la ligne de base d'advisories

Inutilisé est du gaspillage ; *hors politique* est du risque. Cette étape compare chaque spec déclarée contre un registre d'advisories local — un dict de versions minimales acceptables. Il se tient en lieu et place des tuyaux du monde réel (`pip-audit`, OSV, métadonnées PyPI), qui ont besoin d'appels réseau ; même forme, honnête sur la substitution. Un `==1.26.0` épinglé sous le plancher `>=1.30` reçoit la ligne rouge.

### 4.1 Écris le vérificateur de versions

**👟 Indice de départ :** Extrais une version numérique de chaque côté de spec avec une regex lâche, compare comme tuples d'entiers, et décris le résultat par dépendance :

```python
# health.py
import re

ADVISORY = {
    "requests": ">=2.28",
    "numpy": ">=1.30",
    "flask": ">=2.2",
    "pandas": ">=1.5",
}

def version_tuple(spec_part: str) -> tuple[int, ...]:
    m = re.search(r"\d+(?:\.\d+)*", spec_part)
    return tuple(int(p) for p in m.group(0).split(".")) if m else (0,)

def check_advisories(name: str, spec: str) -> str:
    rule = ADVISORY.get(name)
    if not rule:
        return "not in advisory registry"
    mine = version_tuple(spec) if spec else (0,)
    minimum = version_tuple(rule)
    state = "ok" if mine >= minimum else "BELOW ADVISORY MINIMUM"
    have = ".".join(map(str, mine))
    return f"{state} (have {have}, min {'.'.join(map(str, minimum))})"
```

```python
# step4.py
from parse_req import parse_requirements
from health import check_advisories

for d in sorted(parse_requirements("myapp/requirements.txt"), key=lambda d: d["name"]):
    print(f"{d['name']:<12} {d['spec'] or '<any>':<16} {check_advisories(d['name'], d['spec'])}")
```

`version_tuple` est toute la comparaison en huit lignes : il attrape la première course `major.minor(.patch)` de n'importe quelle chaîne de spec, donc `==2.31.0`, `~=3.0`, et `>=2.28` deviennent tous des tuples d'entiers valant la comparaison. La comparaison de tuples d'entiers est l'ordre de versions intégré de Python : `(2, 31, 0) >= (2, 28)` vaut `True`, `(1, 26, 0) >= (1, 30)` vaut `False` — aucun piège de tri de chaînes. Une dep déclarée *non épinglée* (`click` sans spec) reçoit `(0, ...)` — traitée comme « pourrait être n'importe quoi », donc la lettre du registre la décide.

**🎯 Résultat attendu :**

```
click        >=8.0            not in advisory registry
flask        ~=3.0            ok (have 3.0, min 2.2)
numpy        ==1.26.0         BELOW ADVISORY MINIMUM (have 1.26.0, min 1.30)
pandas       >=2.0            ok (have 2.0, min 1.5)
requests     ==2.31.0         ok (have 2.31.0, min 2.28)
```

**🩹 Si ça ne marche pas :** Si `version_tuple("~=3.0")` retourne `(0,)`, la regex cherche des chiffres *ancrés* (`^\d+`) au lieu d'une recherche — `~` précède le `3`. Si `click` montre `ok` au lieu de `not in advisory registry`, `ADVISORY.get(name)` prend le défaut, ce qui signifie qu'une clé style `numpy` n'est pas `click` — les clés de chaîne sont exactes ; les manques de registre sont le résultat *conçu*, pas un repli.

### 4.2 Vérifie la vérification d'advisories

**✅ Liste de vérification**

- ✅ Un paquet sous son minimum (`numpy`) est signalé ; un à/au-dessus (`requests`, `flask`, `pandas`) est « ok ».
- ✅ Un paquet sans entrée de registre (`click`) est rapporté comme non revu, pas silencieusement absent.
- ✅ Pas de trucs de chaîne ad hoc : `~=3.1` et `>=3.1` comparent égaux comme tuples, et `2.28` ≠ `2.28.1` — la longueur du tuple fait partie de l'ordre.

**🤔 Question(s) socratique(s)**

- `version_tuple("~=3.0")` retourne `(3, 0)` et le compare comme *au moins* 3.0. En PEP 440, `~=3.0` signifie vraiment `>=3.0, <4` — « version compatible ». Qu'ignorer la borne supérieure fait prétendre à ton analyseur qu'il ne peut pas réellement promettre ?
- Le registre est un dict local. Dans un vrai projet, il viendrait d'un flux interrogeable (JSON PyPI, OSV). Que la *forme* de la comparaison change quand la source de vérité est une API vivante — et qu'est-ce qui commence à échouer quand il n'y a pas de réseau dans la CI ?

## Étape 5 : La CLI et le code de sortie

Le travail de l'analyseur est terminé quand un script de build peut traiter la réponse comme un *verdict*, pas un vidage de texte. La CLI prend `--dir`, compose analyse → scan → inutilisé → advisory, affiche trois lignes de résumé, et retourne `0` (sain), `1` (deps inutilisées), ou `2` (violation d'advisory) — donc la CI peut échouer sur `$?` sans lire ton rapport du tout.

### 5.1 Écris `analyze.py`

**👟 Indice de départ :** `argparse` pour `--dir`, réutilise chaque fonction des étapes précédentes, et règle `sys.exit` depuis les deux groupes d'échec :

```python
# analyze.py
import argparse
import sys
from pathlib import Path

from health import check_advisories
from parse_req import parse_requirements
from scan import scan_directory
from unused import find_unused

def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze a project's Python dependencies.")
    parser.add_argument("--dir", default=".")
    args = parser.parse_args()

    root = Path(args.dir)
    req = parse_requirements(root / "requirements.txt")
    imported = scan_directory(str(root))
    declared = {d["name"] for d in req}

    unused = find_unused(declared, imported)
    policy_budget = 0
    warnings = []
    for d in sorted(req, key=lambda d: d["name"]):
        report = check_advisories(d["name"], d["spec"])
        if "BELOW" in report:
            policy_budget = 2
            warnings.append(f"{d['name']} {d['spec']}: {report}")

    print(f"declared: {len(req)}  used: {len(declared & imported)}  unused: {len(unused)}")
    for name in unused:
        print(f"unused: {name}")
    for w in warnings:
        print(f"advisory: {w}")
    print("result:", "FAIL" if (unused or policy_budget) else "OK")
    sys.exit(1 if unused else policy_budget)

if __name__ == "__main__":
    main()
```

```bash
uv run python analyze.py --dir myapp
```

La politique de code de sortie est un *choix*, écrit là où un réviseur peut le voir : inutilisé gagne (`1`) sur advisory (`2`) ; propre gagne (`0`). Composer tout le pipeline depuis des fonctions que tu possèdes signifie qu'un futur réglage « bloquer sur inutilisé » est un changement `.py` d'une ligne, pas une réécriture.

**🎯 Résultat attendu :**

```
declared: 5  used: 3  unused: 2
unused: click
unused: flask
advisory: numpy ==1.26.0: BELOW ADVISORY MINIMUM (have 1.26.0, min 1.30)
result: FAIL
```

Relance la commande shell et `echo $?` affiche `1`.

**🩹 Si ça ne marche pas :** Si `FileNotFoundError` se déclenche pour `requirements.txt`, `--dir` pointe vers un répertoire qui n'en contient pas un — la CLI attend ton manifeste *à l'intérieur* de la racine scannée, correspondant à ce que l'analyseur vérifie. Si `exit code: 0` s'affiche malgré des paquets inutilisés, `sys.exit(1 if unused else policy_budget)` manque — la ligne `print("result: ...")` est véridique, le code de sortie est le contrat.

### 5.2 Vérifie la CLI

**✅ Liste de vérification**

- ✅ `uv run python --dir myapp` affiche le résumé ci-dessus et `echo $?` est `1`.
- ✅ Supprimer `click`/`flask` de `requirements.txt` transforme l'exécution en `result: OK`, sortie `0`.
- ✅ Élever le pin de `numpy` à `==1.30.0` efface l'advisory *et* garde `unused` à zéro — le code de sortie dérive à la fois des données et lit les mêmes fichiers que tu survoles.

**🤔 Question(s) socratique(s)**

- Les codes de sortie 1 et 2 s'effondrent quand les deux conditions tiennent (résolu, `1` gagne). Si un build veut distinguer « code mort, bloque » de « release de sécurité en attente, préviens », les codes doivent se composer (ex. 1 = inutilisé, 2 = advisory, 3 = les deux). Qu'est-ce qui change dans `sys.exit(...)` pour faire 3 = les deux une one-liner — et la CI s'en soucie-t-elle ?
- `declared & imported` compte un paquet utilisé *une fois* comme utilisé ; il n'y a pas de signal d'intensité « importé onze fois dans neuf fichiers ». Qu'une dimension *fréquence* ajouterait-elle au tri du rapport — et qui est le lecteur du rapport qui l'utiliserait réellement ?

## ⚠️ Pièges courants

- **Correspondance d'import par sous-chaîne.** Correspondre `import os` contre `os.path` ou `osx-tools` a besoin de frontières de mots — la regex de jetons `([\w.]+)` juste après `import|from` te donne déjà le nom de premier niveau, donc ne teste pas les noms de modules avec `in`.
- **Faire confiance à un seul côté.** Déclaré-sans-importé = inutilisé ; importé-sans-déclaré = fresh installs cassés. Un analyseur qui ne répond qu'à une direction écrit un demi-rapport. (Inverse la soustraction et le deuxième bug est gratuit.)
- **Bruit de manifeste.** `--index-url`, `-r`, `.`, les lignes `#comment` ne sont pas des dépendances. Un analyseur qui frappe une « dépendance » appelée `--index-url` corrompt chaque nombre en aval.
- **Les tuples de versions ne sont pas des chaînes.** `"9.0" < "10.0"` est `False` lexicalement mais `(9,0) < (10,0)` est `True` numériquement — compare toujours via des tuples d'entiers dans ce projet.
- **Avale les préfixes de spec.** `version_tuple` attrapant `29` depuis `>=29,<30` rate la casquette `<30` et l'écart de mapping des noms (`python-dateutil` importé comme `dateutil`) signifie qu'un analyseur « inoffensif » bénit silencieusement un paquet réellement utilisé comme inutilisé. Le rapport se lit comme un scan, juge comme un humain.

## Ce que tu viens de construire

Un analyseur de dépendances sans dépendances de lui-même : analyseur de manifeste, scanneur d'imports, différenciateur par différence d'ensembles, vérificateur de versions d'advisories, et une porte de code de sortie — cinq fichiers, un verbe CLI, et un rapport que trois lignes résument. La leçon transférable est la *triangulation* : un manifeste et un scan de code racontent chacun une histoire partielle, et la valeur de l'outil est précisément les endroits où les deux ne sont pas d'accord — des pins inutilisés à tailler, des versions hors politique à élever, et (avec la soustraction inversée) des dépendances que tu as oublié de déclarer du tout.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/dependency-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/dependency-analyzer) dans le dépôt du cours contient les scripts complets, le projet d'échantillon `myapp/`, et un registre d'advisories d'échantillon. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Scanne la **direction inverse** (`imported - declared`) comme deuxième colonne de rapport : « déclaré nulle part mais importé partout = les fresh installs plantent » — gratteur de bugs gratuit maintenant que la machinerie existe.
- Publie le **résumé en JSON** (`--json`), pour qu'un tableau de bord ou un bot de PR puisse rendre les verdicts sans re-analyser ton rapport humain.
- Ajoute un **scanneur basé sur `ast`** comme deuxième source d'imports, et signale les paquets où les scanneurs regex et AST sont en désaccord — trie les endroits où vivent les imports douteux.
- Colle l'**écart de mapping des noms** avec un dict d'alias (`python-dateutil` → `dateutil`, `beautifulsoup4` → `bs4`) pour que la différence d'ensembles cesse de raté sur la moitié des noms de PyPI.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓