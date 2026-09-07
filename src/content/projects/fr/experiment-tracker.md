---
title: "Suiveur d'Expériences"
description: "Suivez les expériences de ML avec métriques, paramètres, artefacts et tableaux de bord de comparaison."
difficulty: "intermediate"
estimatedMinutes: 70
tags: ["cli", "json", "dataclasses", "logging"]
prerequisites:
  - "Les bases de Python (listes, dictionnaires, fonctions, classes)"
  - "À l'aise pour éditer et exécuter des scripts dans le terminal"
learningObjectives:
  - "Modéliser une exécution d'expérience comme dataclass"
  - "Ajouter des exécutions à un journal JSONL avec une garde contre les IDs dupliqués"
  - "Classer les exécutions et choisir la meilleure par métrique avec une table de direction"
  - "Enregistrer les fichiers d'artefacts avec des empreintes SHA-256"
  - "Piloter add / list / best depuis une petite interface en ligne de commande"
---

# 🧪 Construis un Suiveur d'Expériences

« Quel modèle a gagné ? » est la question récurrente de tout projet qui entraîne des modèles — et un simple `results.txt` ne peut pas y répondre : même nom d'exécution, relancée deux fois, des colonnes modifiées, et la réponse dérive avec ce que quelqu'un a tapé en dernier. Ce projet construit l'honnête alternative : un journal `runs.jsonl` où chaque exécution est une dataclass (modèle, métrique, valeur, chemin d'artefact), les IDs dupliqués sont refusés à la porte, la meilleure exécution par métrique vient d'une table de direction (« rmse plus bas est mieux, accuracy plus élevé est mieux »), les artefacts reçoivent une empreinte SHA-256 que tu peux vérifier plus tard, et une CLI à cinq commandes (`add`, `list`, `best`) donne à l'ensemble l'allure d'un vrai outil. Tout est standard library et basé sur des fichiers — pas de base de données, pas de bibliothèque ML requise.

Ceci suppose Python 101 — listes, dicts, fonctions — plus les dataclasses (`from dataclasses import dataclass`) et la manipulation aisée de fichiers. C'est facultatif et non noté ; consulte [Real-World Projects](/docs/projects) pour la liste complète et grandissante.

## 🎯 Ce que tu vas faire

1. Définir une dataclass `Run` et voir un véritable enregistrement.
2. Ajouter des exécutions en JSONL avec une garde anti-doublons qui bloque la re-journalisation.
3. Rapporter toutes les exécutions et choisir la meilleure pour une métrique à l'aide d'une table de direction.
4. Hacher un fichier d'artefact avec SHA-256 et le copier dans l'entrepôt.
5. Tout câbler dans une CLI et enregistrer une confrontation entre trois modèles.

## Où exécuter ceci

**Localement avec `uv`** est le chemin recommandé — un journal d'expériences est un outil de fichiers (des fichiers en entrée, `runs.jsonl` en sortie), et les fichiers appartiennent à ton terminal.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal de navigateur.

**Google Colab, Kaggle Notebooks, ou Binder** fonctionnent — le notebook à [`examples/experiment-tracker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.ipynb) exécute le suiveur sur des enregistrements de type `runs.jsonl` en mémoire, de même forme.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fexperiment-tracker%2Fnotebook.ipynb)

## Configuration

`uv` est un outil unique qui remplace « installer Python, puis pip, puis un outil d'environnement virtuel » — et ce projet est du pur standard library.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme l'installation :

```bash
uv --version
```

Puis configure le projet :

```bash
uv init experiment-tracker
cd experiment-tracker
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `experiment-tracker/` existe avec un `pyproject.toml`.
- ✅ `python -c "import json, hashlib, shutil"` réussit — stdlib, rien à installer.

## Étape 1 : Modéliser une exécution comme dataclass

Le vocabulaire du suiveur est un enregistrement : une **exécution** (run) — un modèle + un dataset + un score. La stocker comme un simple dict fonctionne, mais une `@dataclass` te donne les champs comme *attributs typés* : `run.model` au lieu de `run["model"]`, une liste requise sur la classe, et un `repr` gratuit pour l'affichage. Le champ `sha256` a pour défaut `""` pour qu'une exécution puisse être créée avant d'avoir une véritable empreinte d'artefact.

### 1.1 Définir l'enregistrement Run

**👟 Indice de départ :** `@dataclass` au-dessus d'une classe de champs ; `asdict(run)` le remettra plus tard à `json.dumps` :

```python
# tracker.py
import json
from dataclasses import asdict, dataclass
from pathlib import Path

LOG_FILE = "runs.jsonl"

@dataclass
class Run:
    run_id: str
    model: str
    metric: str
    value: float
    artifact: str
    sha256: str = ""

if __name__ == "__main__":
    run = Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib")
    print(run)
    print(run.model, run.value)
```

Exécute-le :

```bash
uv run tracker.py
```

La dataclass fait un travail structurel discret : `value: float` signifie qu'une exécution portant `value="3.42"` (chaîne) est typée à tort à la création, `sha256: str = ""` documente un état volontairement « non encore haché », et `print(run)` rend l'enregistrement entier d'une manière qu'un simple dict n'imprime qu'à travers des intermédiaires. Construire le vocabulaire comme un type — pas un commentaire — signifie que chaque fonction en aval (`log_run`, `best_run`) nomme ses attentes dans la signature.

**🎯 Résultat attendu :**

```
Run(run_id='run_001', model='ridge', metric='rmse', value=3.42, artifact='artifacts/run_001.joblib', sha256='')
ridge 3.42
```

**🩹 Si ça ne marche pas :** Si `print(run)` lève une erreur d'ordre positionnel, les champs de la dataclass ont été déclarés dans un ordre différent de celui de l'appel du constructeur — la position compte en l'absence d'arguments par mot-clé. Si `run.model` donne une `AttributeError`, la classe n'a pas réellement été décorée (la ligne `@dataclass` manque au-dessus de `class Run`).

### 1.2 Vérifie la forme de l'enregistrement

**✅ Liste de vérification**

- ✅ `run.run_id`, `run.model`, `run.metric`, `run.value`, `run.artifact` accèdent tous sans difficulté.
- ✅ `run.sha256 == ""` par défaut — le sentinelle « non enregistré » fonctionne.
- ✅ `asdict(run)` renvoie un simple dict avec les six champs, prêt pour JSON.

**🤔 Question(s) socratique(s)**

- Ce sont six attributs aujourd'hui. Que ferait un *septième* champ — `timestamp`, `params` comme dict imbriqué — à cette dataclass, et pourquoi JSONL survit-il au changement alors qu'un CSV à colonnes fixes ne le ferait pas ?
- `value: float` impose un nombre, mais pas quelle métrique c'est — `metric` est un champ frère, pas un type. Où est la ligne à partir de laquelle *une classe par métrique* (RmsRun, AccuracyRun) devient meilleure qu'un champ générique, et qu'est-ce qui casse quand tu la franchis (add, compare) ?

## Étape 2 : Journaliser les exécutions en JSONL avec une garde anti-doublons

Un journal qui accepte deux fois la même exécution est un journal qui ment — « run_001 ridge » puis dit « run_001 ridge, mieux ! » deux fois et tout le monde se fie à un compte doublé. JSONL (un JSON par ligne) est le format propice à l'ajout : `log_run` lit le journal existant, détermine si `run_id` existe déjà, et **lève** une exception si c'est le cas. Ajouter une ligne est atomique au niveau du fichier et survit à un `Ctrl+C`.

### 2.1 Écris le journaliseur et prouve la garde

**👟 Indice de départ :** `load_runs` lit chaque ligne existante ; `log_run` vérifie les doublons *avant* d'ajouter avec `"a"` (mode append) :

```python
# tracker.py
import json
from dataclasses import asdict, dataclass
from pathlib import Path

LOG_FILE = "runs.jsonl"

@dataclass
class Run:
    run_id: str
    model: str
    metric: str
    value: float
    artifact: str
    sha256: str = ""

def load_runs(path: str = LOG_FILE) -> list[Run]:
    if not Path(path).exists():
        return []
    return [Run(**json.loads(line)) for line in
            Path(path).read_text().splitlines() if line.strip()]

def log_run(run: Run, path: str = LOG_FILE) -> None:
    if any(r.run_id == run.run_id for r in load_runs(path)):
        raise ValueError(f"duplicate run_id: {run.run_id}")
    with open(path, "a") as f:
        f.write(json.dumps(asdict(run)) + "\n")

if __name__ == "__main__":
    log_run(Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib"))
    log_run(Run("run_002", "lasso", "rmse", 4.05, "artifacts/run_002.joblib"))
    print(Path("runs.jsonl").read_text())
    try:
        log_run(Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib"))
    except ValueError as e:
        print("duplicate blocked:", e)
    print("loaded runs:", [r.run_id for r in load_runs()])
```

`load_runs` renvoie `[]` pour un fichier manquant — un répertoire d'expériences *sans* journal encore est légitime, pas une erreur. `Run(**json.loads(line))` dépaquette chaque objet JSON directement dans la dataclass, donc sérialiser/désérialiser tient chacun en une ligne dans des directions opposées. La garde lit *tout* le journal d'abord — O(n) par ajout, correct pour des centaines d'exécutions à l'échelle d'un notebook — et `any(...)` se court-circuite sur la première correspondance `run_001`. Le `try/except` de la démo est délibéré : le refus est *audible* (`duplicate blocked:`), jamais une écriture silencieuse par-dessus ni une ligne doublée.

**🎯 Résultat attendu :**

```
{"run_id": "run_001", "model": "ridge", "metric": "rmse", "value": 3.42, "artifact": "artifacts/run_001.joblib", "sha256": ""}
{"run_id": "run_002", "model": "lasso", "metric": "rmse", "value": 4.05, "artifact": "artifacts/run_002.joblib", "sha256": ""}

duplicate blocked: duplicate run_id: run_001
loaded runs: ['run_001', 'run_002']
```

**🩹 Si ça ne marche pas :** Si le second `log_run("run_001")` ajoute au lieu de lever, le `if any(...)` ne lève que pour une correspondance *exacte* — vérifie que `r.run_id == run.run_id` est la comparaison et que `load_runs(path)` reçoit le même `path`. Si `Run(**json.loads(line))` lève une erreur de type, une ligne n'est pas un objet JSON (une ligne vide égarée est gérée par `if line.strip()`, mais un `{"run_id"` tronqué par un plantage ne l'est pas — supprime cette ligne à la main).

### 2.2 Vérifie le journaliseur

**✅ Liste de vérification**

- ✅ La première exécution de `tracker.py` crée `runs.jsonl` avec 2 lignes ; une seconde première-exécution est bloquée, pas doublée.
- ✅ `loaded runs: ['run_001', 'run_002']` — la désérialisation fait un aller-retour propre.
- ✅ `LOG_FILE` est une constante au niveau du module — changer le nom de fichier tient en une modification, utilisée partout.

**🤔 Question(s) socratique(s)**

- La garde est en O(n) — lire tout le journal à chaque ajout. À partir de combien d'exécutions cela devient-il assez lent pour compter, et quelle est l'amélioration en deux lignes (`run.ids in {r.run_id for r in load_runs()}` — même coût, histoire différente) par rapport à un fichier de hachage d'avance ?
- `log_run` *lève* sur les doublons. Nomme un flux où lever est le bon refus (une garde de rejeu) et un où un ID dupliqué devrait *remplacer* l'ancienne ligne (une relance avec une nouvelle `value`) — et ce dont le second a besoin que `add` n'a pas.

## Étape 3 : Rapporter les exécutions et choisir la meilleure

Maintenant le suiveur répond à sa question centrale. `report` imprime chaque exécution ; `best_run` prend une métrique et renvoie la gagnante — mais « meilleure » a besoin d'une *direction* : rmse est mieux en plus bas, accuracy est mieux en plus élevé. Une table `BEST_DIRECTION` transforme ce jugement en données, pour que `min` vs `max` découle d'une seule recherche au lieu d'être re-décidé à chaque appel.

### 3.1 Écris le classement

**👟 Indice de départ :** Filtre d'abord sur la métrique, puis `min(...) if direction == "min" else max(...)` — même forme, un seul bouton :

```python
# rank.py
from tracker import Run, load_runs

BEST_DIRECTION = {"rmse": "min", "mae": "min", "accuracy": "max"}

def report(runs: list[Run]) -> None:
    for r in runs:
        print(f"  {r.run_id}  {r.model:<18} {r.metric}={r.value:.2f}")

def best_run(runs: list[Run], metric: str) -> Run | None:
    candidates = [r for r in runs if r.metric == metric]
    if not candidates:
        return None
    is_min = BEST_DIRECTION[metric] == "min"
    return (min if is_min else max)(candidates, key=lambda r: r.value)

if __name__ == "__main__":
    runs = load_runs()
    report(runs)
    best = best_run(runs, "rmse")
    print("best:", best.run_id, best.model, best.value)
```

`best_run` fait deux travaux indépendants en ordre : **filtrer** sur les exécutions de la métrique (pour qu'une exécution `accuracy` ne dispute jamais face à une exécution `rmse`), puis **sélectionner** avec la table de direction. Le `| None` dans le type de retour déclare le cas vide volontairement erroné — une métrique sans aucune exécution renvoie `None`, jamais un crash `max([])`. `report` est purement affichage : mêmes enregistrements, aucune mutation, aucun re-classement.

**🎯 Résultat attendu :**

```
  run_001  ridge              rmse=3.42
  run_002  lasso              rmse=4.05
best: run_001 ridge 3.42
```

**🩹 Si ça ne marche pas :** Si « best » sélectionne `run_002` (la plus grande), `is_min` est inversé — `BEST_DIRECTION[metric] == "max"` sélectionnerait la plus grande pour rmse. Si ça plante sur une métrique vide, la garde `if not candidates: return None` manque sous le filtre.

### 3.2 Vérifie le classement

**✅ Liste de vérification**

- ✅ `best_run(load_runs(), "rmse")` renvoie run_001 (3.42 < 4.05).
- ✅ `report` imprime les deux exécutions avec `metric=value` alignées à 2 décimales.
- ✅ Ajouter `Run("x", "...", "accuracy", 0.9, ...)` fait choisir à `best_run(..., "accuracy")` *la plus grande* — direction respectée.

**🤔 Question(s) socratique(s)**

- « Meilleure » dépend de la métrique *et* de la direction — une table que l'appelant peut oublier (KeyError `BEST_DIRECTION[metric]` pour une métrique non suivie). Qu'est-ce qu'une `KeyError` ici *enseigne à l'opérateur* par opposition à un `min` silencieusement faux, et où le cas métrique inconnue devrait-il émerger (validation au moment de `add`) ?
- Les égalités sont silencieuses : deux exécutions avec la même `value` renvoient celle qui vient en premier dans le journal. Si le départage doit être *la plus récente*, de quel champ le journal a-t-il besoin, et que devient l'expression du filtre ?

## Étape 4 : Hacher et enregistrer les artefacts

Les scores mentent à eux seuls. « rmse 3.42 » ne veut plus rien dire si demain le journal annonce le même nombre pour un *autre* pickle. La solution est une **empreinte** : `sha256_of` hache le fichier d'artefact en une empreinte hexadécimale de 64 caractères, stockée *sur l'enregistrement de l'exécution*. Ensuite, re-hacher `artifacts/run_002.joblib` et le comparer à l'empreinte journalisée te dit instantanément si l'artefact a été touché depuis l'enregistrement.

### 4.1 Hache un artefact candidat

**👟 Indice de départ :** `hashlib.sha256(Path(path).read_bytes()).hexdigest()` — du contenu en entrée, 64 caractères hexadécimaux en sortie :

```python
# artifacts.py
import hashlib
import shutil
from pathlib import Path

def sha256_of(path: str) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

if __name__ == "__main__":
    src = "candidates/ridge.joblib"
    print("sha256 of artifact:", sha256_of(src))
    shutil.copy(src, "artifacts/run_candidate.joblib")
    print("copied:", Path("artifacts/run_candidate.joblib").exists())
    print("same digest after copy:",
          sha256_of(src) == sha256_of("artifacts/run_candidate.joblib"))
```

`read_bytes()` lit tout le fichier en octets — très bien pour un modèle sérialisé, le bon réflexe pour la vérification d'intégrité. Hacher après le `shutil.copy` prouve une propriété qui vaut la peine d'être connue : **la copie préserve le contenu**, donc l'empreinte est stable à travers la frontière de l'entrepôt. La chaîne hexadécimale de 64 caractères est la signature du *contenu* du fichier : change un octet du pickle et l'empreinte change au-delà de toute reconnaissance (effet avalanche) — et, pratiquement, des empreintes identiques signifient des fichiers identiques octet par octet.

**🎯 Résultat attendu :**

```
sha256 of artifact: ff863fe836434899105f08c56435c6bd35561416798f30465ccd22653e9ec950
copied: True
same digest after copy: True
```

**🩹 Si ça ne marche pas :** Si l'empreinte imprime moins de 64 caractères, `hexdigest()` a été échangé contre une vue tronquée (`digest()[:16]`) quelque part. Si `copied: False`, `artifacts/` n'existait pas avant la copie — `Path("artifacts").mkdir(exist_ok=True)` doit venir avant `shutil.copy`, sinon la copie échoue sur un répertoire manquant.

### 4.2 Vérifie le hachage

**✅ Liste de vérification**

- ✅ `ff863fe8...e9ec950` — l'empreinte *n'est pas* aléatoire : c'est le SHA-256 de cette chaîne d'octets précise, reproductible entre machines.
- ✅ L'empreinte de la copie correspond à celle de la source — deux chemins, un contenu.
- ✅ Modifier un octet de l'artefact change l'empreinte entièrement — la vérification « touché ? » fonctionne.

**🤔 Question(s) socratique(s)**

- L'empreinte vit *à côté* de l'artefact (dans le journal). Un attaquant capable de modifier `run_002.joblib` peut modifier `runs.jsonl` aussi — des chaînes de hachage dans le même dossier, c'est du « théâtre de la preuve ». Quelle est l'amélioration en une étape (hachage stocké dans un fichier `.sha256` séparé que tu ne régénères pas) et sa faiblesse résiduelle ?
- Le hachage lit tout le fichier. Pour un fichier de poids de 4 Go, c'est une lecture complète du disque par enregistrement — acceptable une fois. Où est la ligne où le hachage incrémental par morceaux (lecture par blocs de 1 Mo) bat le `read_bytes()` en un seul coup ?

## Étape 5 : Tout câbler dans une CLI

La dernière étape rassemble tout dans un outil que tu peux réellement exécuter : `add RIDGE RMSE 3.42 candidates/ridge.joblib` enregistre une exécution (copie l'artefact, calcule son empreinte), `list` imprime le tableau, `best rmse` couronne le gagnant. La tranche légère du pipeline — moins d'arguments, la lecture du journal, la table de direction — vit dans `cli.py`, qui importe le suiveur et réutilise tout ce qui a été construit ci-dessus.

### 5.1 Écris la CLI

**👟 Indice de départ :** `sys.argv[1:]` sépare le nom du programme ; chaque branche `cmd` est une opération :

```python
# cli.py
import hashlib
import shutil
import sys
from pathlib import Path

from tracker import Run, load_runs, log_run

ART_DIR = "artifacts"
BEST = {"rmse": "min", "mae": "min", "accuracy": "max"}

def digest(path: str) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def register(model: str, metric: str, value: float, src: str) -> Run:
    run_id = f"run_{len(load_runs()) + 1:03d}"
    Path(ART_DIR).mkdir(exist_ok=True)
    dest = f"{ART_DIR}/{run_id}.joblib"
    shutil.copy(src, dest)
    run = Run(run_id, model, metric, value, dest, digest(dest))
    log_run(run)
    return run

if __name__ == "__main__":
    cmd, *args = sys.argv[1:]
    if cmd == "add":
        run = register(args[0], args[1], float(args[2]), args[3])
        print(f"registered {run.run_id} ({run.model}) sha256={run.sha256[:16]}...")
    elif cmd == "list":
        for r in load_runs():
            print(f"{r.run_id:<9} {r.model:<18} {r.metric:<10} {r.value:>8.3f}  {r.artifact}")
    elif cmd == "best":
        cand = [r for r in load_runs() if r.metric == args[0]]
        if not cand:
            print(f"no runs tracked for metric {args[0]}")
        else:
            key = BEST[args[0]]
            best = min(cand, key=lambda r: r.value) if key == "min" \
                else max(cand, key=lambda r: r.value)
            print(f"best {args[0]} ({key}): {best.run_id} {best.model} = {best.value:.3f}")
    else:
        print("usage: cli.py add MODEL METRIC VALUE ARTIFACT | list | best METRIC")
```

`register` est le seul endroit qui *crée* de l'état : il numérote l'exécution à partir de la longueur du journal (`run_003` après deux exécutions), copie le candidat dans `artifacts/` sous le nom de l'exécution, hache la *copie entreposée* (`digest(dest)`, pas la source — ce qui vit est ce qui est empreinté), et appelle le `log_run` gardé de l'étape 2. Le `best` de la CLI garde le cas métrique vide (« no runs tracked for rmse » gère avec politesse un accuracy non suivi) et imprime la direction avec la gagnante pour que l'opérateur voie *pourquoi* (`best rmse (min)`).

### 5.2 Exécute la confrontation des trois modèles

**👟 Indice de départ :** Depuis un journal propre, trois artefacts candidats dans `candidates/`, puis trois `add`, un `list`, et la couronne (un `runs.jsonl` neuf garde la numérotation des exécutions qui commence à `run_001` — dans ton propre répertoire tu sauterais la première ligne, puisque la garde anti-doublons la protège de toute façon) :

```bash
rm -f runs.jsonl
mkdir -p candidates artifacts
printf 'serialized ridge weights [0.2, -0.1, 0.4]'  > candidates/ridge.joblib
printf 'serialized lasso weights [0.1, 0.3]'        > candidates/lasso.joblib
printf 'serialized gb weights   [0.15, -0.2, 0.5]'  > candidates/gb.joblib
uv run cli.py add ridge rmse 3.42 candidates/ridge.joblib
uv run cli.py add lasso rmse 4.05 candidates/lasso.joblib
uv run cli.py add gradient_boosting rmse 2.87 candidates/gb.joblib
uv run cli.py list
uv run cli.py best rmse
uv run cli.py best accuracy
```

**🎯 Résultat attendu :**

```
registered run_001 (ridge) sha256=ff863fe836434899...
registered run_002 (lasso) sha256=5ac5290c4de57d97...
registered run_003 (gradient_boosting) sha256=6a542a94df7113c3...
run_001   ridge              rmse          3.420  artifacts/run_001.joblib
run_002   lasso              rmse          4.050  artifacts/run_002.joblib
run_003   gradient_boosting  rmse          2.870  artifacts/run_003.joblib
best rmse (min): run_003 gradient_boosting = 2.870
no runs tracked for metric accuracy
```

**🩹 Si ça ne marche pas :** Si `add` rapporte deux empreintes identiques pour des modèles différents, le même fichier a été passé deux fois comme `src` (des candidats différents doivent être des *chaînes d'octets* différentes). Si `best accuracy` lève au lieu d'imprimer, la garde `if not cand` manque — `max([])` ne peut pas se produire avec elle en place.

### 5.3 Vérifie la confrontation

**✅ Liste de vérification**

- ✅ Trois exécutions enregistrées avec des IDs consécutifs `run_001/2/3` et des empreintes distinctes ; `list` les affiche en correspondance.
- ✅ `best rmse` choisit run_003 (2.87) — direction « min » respectée.
- ✅ `best accuracy` sur une métrique jamais journalisée imprime un message aimable, pas une traceback.
- ✅ `artifacts/` contient désormais trois copies `.joblib` empreintées plus les lignes de journal qui les référencent.

**🤔 Question(s) socratique(s)**

- `register` numérote les exécutions à partir de `len(load_runs())` — l'ordre dépend du journal, pas d'une garantie. Que se passe-t-il quand des exécutions sont *supprimées* du journal (run_002 retiré, le prochain ID est `run_003` à nouveau → la garde anti-doublons se déclenche), et quelle est l'alternative robuste (compteur par préfixe, IDs horodatés) ?
- La CLI lit le journal à chaque `best` et `list` — bon marché aujourd'hui, O(n) pour toujours. Quelle est la forme d'une *vue d'ensemble unique* qui pourrait être construite une fois et partagée (`best_of("rmse")` sur une session chargée) ? Est-ce un changement d'exactitude ou d'efficacité ?

## ⚠️ Pièges courants

- **Doublons de lignes par déduplication manquante.** `log_run` sans la vérification des doublons transforme une relance en mensonge. La garde est la fonctionnalité ; l'ajout est la plomberie.
- **Min vs. max de mémoire.** Choisir le *plus petit* rmse est évident ; choisir la *plus grande* accuracy est la même forme avec un `max`. Saute la table de direction et la réponse de « best » bascule par métrique, silencieusement.
- **Hacher le mauvais fichier.** Empreinter *avant* la copie, ou hacher le chemin source et le stocker contre la copie entreposée, ne vérifie rien une fois la copie divergée. Hache ce qui vit : `digest(dest)`.
- **Candidats vides.** `min([], key=...)` est un plantage, pas un verdict. Garde avant de sélectionner — « no runs tracked for metric accuracy » est une donnée sur laquelle un opérateur peut agir.
- **IDs séquentiels depuis la longueur du journal.** `len(load_runs()) + 1` réutilise un ID si des exécutions sont supprimées, et la garde anti-doublons se déclenche alors sur un ajout légitime. Les numéros d'ordre appartiennent à un compteur, pas à un compte.

## Ce que tu viens de construire

Un suiveur d'expériences à cinq commandes qui se comporte comme un vrai outil MLE : un enregistrement `Run` typé, un journal JSONL append-only avec une garde anti-doublons, un sélecteur `best` conscient de la direction, l'enregistrement d'artefacts avec des empreintes SHA-256, et une CLI qui rassemble le tout sans importer de framework. Les idées transférables — les enregistrements comme dataclasses, les journaux append-only, les tables de direction, les hachages de contenu — sont les atomes de tout système sérieux de gestion d'expériences, et tu les as construites en ~65 lignes de stdlib.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/experiment-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/experiment-tracker) dans le dépôt du cours contient les scripts complets plus les artefacts candidats d'échantillon. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller ensuite

- Ajoute une commande **`compare`** — `best` en choisit une ; `compare rmse` imprime le classement complet avec les écarts face au gagnant (`+0.55`, `+0.18`), la sortie qu'un graphique en vallée consommerait.
- Persiste **`params`** comme un dict imbriqué par exécution et journalise-le — `Run(... , params={"alpha": 0.1})` permet au suiveur de répondre « quelle configuration a gagné ? », pas seulement « quel modèle ? ».
- Ajoute une commande **`verify`** qui re-hache chaque `artifacts/*.joblib` et rapporte les écarts face au journal en une passe — la vérification d'intégrité devient une habitude planifiée, pas une intuition.
- Remplace l'ID de `register` par un **horodatage UTC** (`time.strftime("%Y%m%d_%H%M%S")`) — les collisions deviennent impossibles en pratique et les relances reçoivent une identité triable.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓