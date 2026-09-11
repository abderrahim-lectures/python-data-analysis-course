---
title: "Gestionnaire de Configuration"
description: "Gérer les configs d'applications à travers les environnements avec validation, chiffrement et détection de dérive."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["cli", "config", "toml", "stdlib"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions, dictionnaires)"
learningObjectives:
  - "Fusionner la config des valeurs par défaut, des fichiers et des variables d'environnement en un seul dict"
  - "Lire des fichiers de config TOML avec le tomllib de la bibliothèque standard"
  - "Valider les clés et types requis selon un schéma"
  - "Masquer automatiquement les valeurs secrètes dans tout affichage lisible par un humain"
  - "Envelopper chargement, validation et inspection dans une seule CLI"
---

# ⚙️ Construire un Gestionnaire de Configuration

Toute application réelle a une configuration qui ne devrait jamais être codée en dur : sur quel port se lier, quel niveau de log utiliser, quelles clés API faire confiance. La façon standard de l'organiser est *par couches* — des valeurs par défaut sensées, surchargées par un fichier de config par environnement, surchargées par les variables d'environnement — pour que « lancer en local » et « lancer en production » diffèrent sans que personne ne modifie du code. Ce projet construit exactement ce chargeur : une petite bibliothèque qui fusionne valeurs par défaut, JSON et TOML avec des surcharges de variables d'environnement, valide le résultat selon un schéma et — crucialement — n'affiche jamais un secret.

Ceci suppose Python 101 (dictionnaires, fonctions et `json` au niveau `import`) — rien de l'Analyse de Données n'est nécessaire. C'est facultatif et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Écrire une fusion récursive qui combine trois couches de config dans le bon ordre.
2. Charger un fichier de config TOML avec le module natif `tomllib` de Python.
3. Valider la config fusionnée contre un schéma de clés-et-types requis.
4. Détecter les clés à l'apparence de secret et les masquer de toute sortie.
5. Tout exécuter comme une CLI qui affiche un résumé de config sûr et validé.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — la version « réelle » de ce projet lit de vrais fichiers depuis le disque et de vraies variables d'environnement, ce qui est exactement ce qu'un notebook n'a pas, donc la CLI locale est son foyer honnête. La configuration est brève car tout le projet utilise la bibliothèque standard de Python (plus `tomllib`, fourni depuis Python 3.11).

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés) et exécute les mêmes commandes depuis un terminal de navigateur.

**Google Colab, Kaggle Notebooks ou Binder** sont un bon moyen d'*apprendre les concepts* — la version notebook dans [`examples/config-manager/notebook.fr.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.fr.ipynb) exécute chaque fonction avec des fichiers d'exemple fournis. La limite honnête : un notebook ne peut pas voir les variables d'environnement de ta propre machine, donc la couche variables d'environnement est démontrée avec une surcharge simulée à la place.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fconfig-manager%2Fnotebook.fr.ipynb)

## Configuration

`uv` est un outil unique qui remplace toute la chaîne « install Python, puis pip, puis un outil d'environnement virtuel » — et ce projet n'a aucun paquet tiers, donc une fois que tu as un Python tu es réellement prêt.

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
uv init config-manager
cd config-manager
uv python pin 3.12
```

`uv python pin 3.12` (ou n'importe quel 3.11+) compte ici : le lecteur TOML `tomllib` n'existe qu'à partir de Python 3.11, donc l'épinglage garantit que la fonctionnalité que tu utiliseras à l'Étape 2 est présente.

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `config-manager/` existe avec un `pyproject.toml`.
- ✅ `python -c "import tomllib"` réussit sur la version épinglée par `uv`.

## Étape 1 : Fusionner la configuration par couches

Les systèmes de config sont presque toujours un *pipeline de surcharges* : commence par `DEFAULTS`, superpose un fichier propre à chaque environnement, puis laisse les variables d'environnement gagner. La fusion est le cœur du système — et la subtilité est que la config est *imbriquée*, donc `{"app": {"port": 9000}}` doit mettre à jour `{"app": {"name": "demo", "port": 8000}}` sans écraser `name`.

### 1.1 Écris une fusion profonde et les deux premières couches

**👟 Indice de départ :** Écris `deep_merge` — en ne récursant que lorsque *les deux* côtés sont des dicts, sinon en remplaçant, ce qui préserve les clés non touchées — puis combine-la avec un fichier JSON et des variables d'environnement converties :

```python
# layers.py
import json
import os

DEFAULTS = {"app": {"name": "demo", "port": 8000}, "logging": {"level": "INFO"}}

def deep_merge(base: dict, override: dict) -> dict:
    """Merge override into a copy of base. Nested dicts merge recursively;
    anything on the right replaces the left for that key."""
    out = dict(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = value
    return out

def load_layer(path: str = "config.json") -> dict:
    with open(path) as f:
        return json.load(f)

def _coerce(raw: str):
    if raw.lower() in {"true", "false"}:
        return raw.lower() == "true"
    try:
        return int(raw)
    except ValueError:
        return raw

def apply_env(config: dict, prefix: str = "APP_") -> dict:
    """Overlay environment variables named APP_<KEY>, e.g. APP_PORT=9000.
    Double underscores mark nesting: APP_LOGGING__LEVEL=DEBUG."""
    for key, raw in os.environ.items():
        if not key.startswith(prefix):
            continue
        parts = key[len(prefix):].lower().split("__")
        target = config
        for part in parts[:-1]:
            target = target.setdefault(part, {})
        target[parts[-1]] = _coerce(raw)
    return config

if __name__ == "__main__":
    sample = json.dumps({"app": {"name": "api"}, "logging": {"level": "DEBUG"}})
    with open("config.json", "w") as f:
        f.write(sample)
    config = deep_merge(dict(DEFAULTS), load_layer("config.json"))
    config = apply_env(config)
    print(config)
```

La ligne `dict(base)` en haut de `deep_merge` est ce qui rend cette fonction *pure* : les appelants gardent leurs valeurs par défaut intactes et reçoivent un nouveau dict en retour, donc « exécuter une fois avec un mauvais fichier, recharger, réécrire à nouveau » est toujours sûr. La couche variables d'environnement démontre le cheval noir de la conception de config — *tout est une chaîne dans l'environnement* — d'où `_coerce` qui transforme `"9000"` en `9000` et `"true"` en `True` avant qu'ils n'atterrissent dans le dict.

**🎯 Résultat attendu :**

```
{'app': {'name': 'api', 'port': 8000}, 'logging': {'level': 'DEBUG'}}
```

**🩹 Si ça ne marche pas :** Si `app` n'a pas de `port`, ton `deep_merge` a aplati au lieu de récurser — vérifie la branche `isinstance(value, dict)`. Si la sortie *remplace* entièrement `logging`, tu as inversé l'ordre de fusion ; `deep_merge(base, override)` garde tout ce qui est dans `base` et que `override` ne touche pas.

### 1.2 Essaie la surcharge par variables d'environnement

```bash
APP_PORT=9000 APP_LOGGING__LEVEL=WARN uv run python layers.py
```

**👟 Indice de départ :** Relance avec deux variables d'environnement définies sur la ligne de commande et observe le port et le niveau de log changer, avec `app.name` non dérangé.

**🎯 Résultat attendu :** `{'app': {'name': 'api', 'port': 9000}, 'logging': {'level': 'WARN'}}` — les deux variables d'environnement surchargent exactement leurs clés, rien d'autre.

**🩹 Si ça ne marche pas :** Si rien ne change, le filtre de préfixe `APP_` ne correspond pas — confirme que les variables sont définies *dans la même commande* (`APP_PORT=9000 uv run ...`, pas un `export` séparé dans une autre fenêtre). Si `APP_LOGGING__LEVEL` atterrit comme une *nouvelle* clé de premier niveau au lieu de s'imbriquer sous `logging`, la boucle de transformation `__` → chemin pointé ne fractionne pas.

### 1.3 Vérifie

**✅ Liste de vérification**

- ✅ Sans variables d'environnement, la sortie fusionnée est `{'app': {'name': 'api', 'port': 8000}, 'logging': {'level': 'DEBUG'}}`.
- ✅ Avec `APP_PORT=9000`, le port change et `app.name` reste `'api'`.
- ✅ `apply_env` convertit `"9000"` en l'entier `9000`, pas en la chaîne.

**🤔 Question(s) socratique(s)**

- Pourquoi le remplacement-au-fusion (au lieu de toujours récurser) est-il le comportement *correct* pour une clé comme `port` ? Quelles données réelles s'écraseraient silencieusement si tu récursais dans une liste ou un non-dict ?
- Les variables d'environnement sont toutes des chaînes. Quelle classe de bug `_coerce` empêche-t-elle, et quel *nouveau* risque la conversion silencieuse introduit-elle quand une valeur comme `"0012"` (prévue comme un ID en chaîne) devient `12` ?

## Étape 2 : Lire des fichiers de config TOML

Le JSON souffre d'un problème pratique comme format de config : pas de commentaires, ce qui fait que les fichiers de config se lisent comme des dumps de données plutôt que comme des instructions. TOML — utilisé par `pyproject.toml`, Cargo et de nombreux outils modernes — ajoute des commentaires, des types conviviaux et la même structure imbriquée. Python 3.11+ le lit avec `tomllib`, de la même façon que `json` lit le JSON.

### 2.1 Écris la couche TOML

**👟 Indice de départ :** Écris un `config.toml` avec commentaires et imbrication, puis un `load_toml_layer` qui le lit en mode binaire (`tomllib` exige des octets) et le fusionne par-dessus les valeurs par défaut :

```python
# toml_layer.py
from pathlib import Path
import tomllib

from layers import DEFAULTS, apply_env, deep_merge

def load_toml_layer(path: str = "config.toml") -> dict:
    with Path(path).open("rb") as f:
        return tomllib.load(f)

if __name__ == "__main__":
    toml_text = '''
# Production-like overrides
[app]
name = "prod-api"
port = 8080

[logging]
level = "PROD"
'''
    Path("config.toml").write_text(toml_text)
    config = deep_merge(dict(DEFAULTS), load_toml_layer())
    config = apply_env(config)
    print(config)
```

Le motif `deep_merge(dict(DEFAULTS), layer)` est délibérément identique à la fusion JSON de l'Étape 1 — une fois la fonction de fusion existante, chaque nouvelle source est les mêmes deux lignes. Deux petites choses sont faciles à rater : `tomllib.load` exige le mode *binaire* (`Path.open("rb")`), une particularité partagée avec aucun autre format populaire, et les en-têtes `[logging]` de TOML produisent les mêmes dicts imbriqués que ton `deep_merge` gère déjà.

**🎯 Résultat attendu :**

```
{'app': {'name': 'prod-api', 'port': 8080}, 'logging': {'level': 'PROD'}}
```

**🩹 Si ça ne marche pas :** Une `TypeError: File must be opened in binary mode` signifie que tu as ouvert avec `"r"` au lieu de `"rb"`. Une `TOMLDecodeError` pointe d'habitude vers la ligne exacte — les virgules de fin *sont* autorisées en TOML, mais une seconde section `[app]` ou un `=` égaré est une erreur dure à l'analyse.

### 2.2 Vérifie

**✅ Liste de vérification**

- ✅ `load_toml_layer()` retourne `{'app': {'name': 'prod-api', 'port': 8080}, 'logging': {'level': 'PROD'}}`.
- ✅ Les réglages de `config.toml` surchargent `DEFAULTS`, et les champs que TOML ne mentionne pas (`app.port` non touché par le fichier resterait `8000`) survivent intacts.
- ✅ Tu peux dire pourquoi le fichier doit s'ouvrir en mode binaire.

**🤔 Question(s) socratique(s)**

- TOML te permet d'écrire `port = 8080` (un entier, sans guillemets). Comment le *type* de `port` changerait-il si le fichier disait `port = "8080"`, et où cette différence ferait-elle surface — cassant silencieusement quoi plus tard ? (Indice : repense au chemin sans validation de l'étape 1.)
- La fusion traite la couche TOML et la couche JSON comme interchangeables. Que devrais-tu changer si tu voulais « TOML bat toujours JSON, peu importe l'ordre de chargement » — et est-ce que l'intégrer en dur est une bonne idée ou un piège de maintenabilité ?

## Étape 3 : Valider la config fusionnée

Une fois que trois sources alimentent un seul dict, la fusion peut silencieusement produire une config avec une *clé manquante* ou une *valeur au mauvais type* — et celles-ci échouent plus tard, loin de la config, de façons déroutantes. La validation déplace l'échec au début : vérifie la config fusionnée contre un schéma et lève une liste d'erreurs lisible par un humain avant que quoi que ce soit ne s'exécute.

### 3.1 Écris l'aplatissement et le vérificateur

**👟 Indice de départ :** `flatten` transforme les dicts imbriqués en chemins dotés (`app.port`) pour qu'un schéma plat puisse nommer exactement où ça cloche ; `validate` compare contre un dict `REQUIRED` de chemin → type et retourne une liste de problèmes lisibles par un humain :

```python
# validate.py
REQUIRED = {
    "app.name": str,
    "app.port": int,
    "logging.level": str,
}

def flatten(config: dict, prefix: str = "") -> dict[str, object]:
    out = {}
    for key, value in config.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            out.update(flatten(value, path))
        else:
            out[path] = value
    return out

def validate(config: dict) -> list[str]:
    errors = []
    flat = flatten(config)
    for path, wanted in REQUIRED.items():
        if path not in flat:
            errors.append(f"missing required key: {path}")
        elif not isinstance(flat[path], wanted):
            errors.append(
                f"{path} should be {wanted.__name__}, got {type(flat[path]).__name__}"
            )
    return errors

if __name__ == "__main__":
    broken = {"app": {"name": "api", "port": "8000"}}
    for error in validate(broken):
        print(error)
```

`flatten` est le cheval de trait silencieux : il convertit « où est le problème ? » d'un labyrinthe de recherches imbriquées en une seule liste plate, et il réutilise le même parcours dans `secrets.py` (Étape 4) — un parcours, deux consommateurs. `isinstance(flat[path], wanted)` attrape les pièges de *type* dont la config est célèbre, comme un port en chaîne qui explosera dans une liaison de socket : `ValueError` plus tard au lieu d'une phrase claire maintenant.

**🎯 Résultat attendu :**

```
app.port should be int, got str
```

**🩹 Si ça ne marche pas :** Si rien n'est signalé pour le dict cassé, ton schéma `REQUIRED` épelle le chemin différemment de ce que `flatten` produit — vérifie qu'un décalage `logging.level` vs `logging__level` (le style variable d'environnement) ne fuit pas dans le schéma. Si tu obtiens `should be type, got str`, regarde si `got {type(...).__name__}` dans le f-string imprime le nom hérité d'une valeur sous-classée.

### 3.2 Vérifie

**✅ Liste de vérification**

- ✅ `validate({"app": {"name": "x", "port": "8000"}, "logging": {"level": 5}})` signale à la fois le `app.port` au mauvais type et le `logging.level` au mauvais type, une ligne chacun.
- ✅ Une config sans `app.name` signale `missing required key: app.name`.
- ✅ Une config entièrement correcte retourne une liste vide.

**🤔 Question(s) socratique(s)**

- `flatten` est partagé par la validation et (étape suivante) le masquage des secrets. Quel est l'argument de responsabilité unique pour un parcours — et qu'aurait-il fallu dupliquer si tu avais inliné le parcours deux fois ?
- Le schéma vérifie les *types*, pas les *plages*. Quel échec un `port` de `-1` ou `65536` traverserait-il quand même — et une vérification de plage vaut-elle d'être ajoutée au schéma ou est-ce la mauvaise couche pour cela ?

## Étape 4 : Masquer les secrets avant d'imprimer

Une config qui *contient* un secret est normale ; une config qui en *imprime* un est un incident. La règle de pouce dans les vrais outils : traite toute clé à l'apparence sensible (`password`, `token`, `api_key`, …) comme non imprimable par défaut, et ne la révèle que lorsqu'on le demande explicitement. Cette étape rend cela automatique.

### 4.1 Écris le détecteur et le masqueur

**👟 Indice de départ :** Utilise une regex compilée insensible à la casse sur les *noms* de clés (pas les valeurs — comparer les valeurs serait un jeu de devinettes), puis `flatten` + reconstruction comme chemins dotés masqués :

```python
# secrets.py
import re

from validate import flatten

SENSITIVE = re.compile(r"(password|passwd|token|secret|api[_-]?key|apikey)", re.I)

def is_sensitive(path: str) -> bool:
    return bool(SENSITIVE.search(path))

def redact(config: dict) -> dict[str, object]:
    return {path: "***" if is_sensitive(path) else value
            for path, value in flatten(config).items()}

if __name__ == "__main__":
    sample = {
        "app": {"name": "api", "port": 8000, "api_key": "sk-live-abc123"},
        "database": {"password": "hunter2", "host": "db.internal"},
    }
    for path, value in redact(sample).items():
        print(f"{path} = {value}")
```

La regex est délibérément ancrée de la façon dure mais sûre : elle correspond aux *sous-chaînes* d'un chemin (`database.password` contient `password`), ce qui attrape `db_password`, `github_token` et `api_key` sans exiger une taxonomie de chaque nom possible. Et parce que le masquage se fait sur la *clé*, pas la valeur, elle n'a jamais besoin de deviner à quoi ressemble un secret — une valeur de `"sk-…"` ou `"hunter2"` est masquée de façon identique en se basant purement sur l'endroit où elle vit.

**🎯 Résultat attendu :**

```
app.name = api
app.port = 8000
app.api_key = ***
database.host = db.internal
database.password = ***
```

**🩹 Si ça ne marche pas :** Si `api_key` s'imprime non masqué, ta regex utilisait l'ancrage `$` ou une frontière de mot que l'alternative `api[_-]?key` ne satisfait pas — `api_key` a un underscore, donc le motif doit le permettre (`[_-]?`). Si `host` est masqué, le motif est trop lâche — une alternative `key` nue correspond à la fin de `monkey` ; resserre-le aux formes de style `api[_-]?key` uniquement.

### 4.2 Vérifie

**✅ Liste de vérification**

- ✅ `database.password` et `app.api_key` s'impriment comme `***`.
- ✅ `app.name`, `app.port` et `database.host` impriment leurs vraies valeurs.
- ✅ Une valeur en forme de secret stockée sous une clé *non secrète* (ex. `app.notes = "contains sk-abc"`) n'est pas masquée — le masquage est basé sur la clé.

**🤔 Question(s) socratique(s)**

- Pourquoi comparer les *noms* de clés est-il fondamentalement plus fiable que comparer les *valeurs* de clés ? Quelle valeur réelle voudrais-tu garder visible mais qui contient par hasard la sous-chaîne `token` ?
- Le masquage retourne `***` plutôt que de supprimer la clé. Qu'est-ce qui casserait dans la CLI de l'Étape 5 (ou dans n'importe quel validateur de schéma) si le masquage *retirait* entièrement les chemins secrets au lieu de les masquer ?

## Étape 5 : La CLI finale

Chaque fonction jusqu'ici est une bibliothèque ; cette étape les transforme en un outil : `config.py --check` valide, `config.py --show` affiche une vue aplatie et masquée. La CLI est l'endroit où la promesse « n'imprime jamais un secret » devient un comportement qu'un humain touche réellement.

### 5.1 Construis `load_config` et la gestion des arguments

**👟 Indice de départ :** Compose le pipeline en une fonction — valeurs par défaut → JSON → TOML → variables d'environnement — puis câble `--check` et `--show` via `argparse` :

```python
# config.py
import argparse

from layers import DEFAULTS, apply_env, deep_merge, load_layer
from secrets import redact
from toml_layer import load_toml_layer
from validate import validate

def load_config(json_path: str = "config.json", toml_path: str = "config.toml") -> dict:
    config = deep_merge(dict(DEFAULTS), load_layer(json_path))
    config = deep_merge(config, load_toml_layer(toml_path))
    return apply_env(config)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load, validate, and inspect layered config.")
    parser.add_argument("--check", action="store_true", help="Validate against the schema")
    parser.add_argument("--show", action="store_true", help="Print the merged config with secrets masked")
    args = parser.parse_args()

    if args.check:
        errors = validate(load_config())
        print("\n".join(errors) if errors else "config OK")
    if args.show:
        for path, value in redact(load_config()).items():
            print(f"{path} = {value}")
```

```bash
uv run python config.py --show
```

Chaque drapeau ré-exécute `load_config()` de façon indépendante — peu coûteux ici, et cela signifie que `--show` n'imprime jamais un état périmé d'un passage `--check`. L'ordre de composition est le comportement entier du système dans une chaîne d'appels de fonction : `DEFAULTS < JSON < TOML < env`, donc la source de plus haute priorité est toujours la dernière fusion.

**🎯 Résultat attendu :** `app.name = prod-api`, `app.port = 8080`, `logging.level = PROD` (plus toute clé que tu ajoutes dont le nom correspond à un motif sensible imprimée comme `***`).

**🩹 Si ça ne marche pas :** Une `FileNotFoundError` pour `config.json` ou `config.toml` signifie que tu t'exécutes depuis le mauvais dossier — les fichiers sont dans le dossier où les Étapes 1–2 les ont écrits, donc lance la CLI depuis là-bas, ou passe le chemin. Si `--show` et `--check` ensemble impriment la config validée *et* le masquage ensemble, souviens-toi que les drapeaux `action="store_true"` sont indépendants — combine-les avec `&&`, ou ajoute un `--show` implicite quand `--check` passe.

### 5.2 Vérifie

**✅ Liste de vérification**

- ✅ `uv run python config.py --show` imprime uniquement des valeurs masquées-et-fusionnées, avec toute clé sensible masquée.
- ✅ `uv run python config.py --check` imprime `config OK` pour une config valide — ou une ligne `path should be…` par champ cassé.
- ✅ `uv run python config.py --help` liste les deux drapeaux et la description de l'outil.

**🤔 Question(s) socratique(s)**

- `--show` ré-exécute `load_config()` plutôt que de partager un objet config avec `--check`. Quand ce choix mordrait-il — qu'est-ce qui pourrait différer entre les deux exécutions dans un déploiement *réel* (indice : pense aux variables d'environnement qui changent en cours de processus) ?
- La CLI n'imprime les secrets que **comme** `***`. Si tu ajoutais un drapeau `--reveal` pour afficher les vraies valeurs, quelle garde voudrais-tu autour pour que personne ne vide par accident des identifiants de production dans les logs CI ?

## ⚠️ Pièges courants

- **Fusionner superficiellement et perdre les clés sœurs.** `dict(base) | override` (ou `base.update(override)`) remplace des dicts imbriqués entiers, écrasant `app.name` le moment où `app.port` surcharge. Fusionne toujours récursivement — la branche `isinstance(value, dict)` de l'Étape 1 n'est pas facultative.
- **Oublier que `tomllib` veut le mode binaire.** `tomllib.load(open("config.toml"))` échoue avec une `TypeError` ; le descripteur de fichier doit s'ouvrir en `"rb"`. C'est le seul chargeur de format de la bibliothèque standard avec cette particularité.
- **Codifier des secrets en dur dans le code « juste pour l'instant ».** Une `API_KEY` dans `DEFAULTS` est exactement la valeur que l'Étape 4 masquerait — ce qui est l'outil qui te dit qu'elle ne devrait pas être dans le code. Déplace-la vers une variable d'environnement avant que le masquage ne la cache de toute façon à ton propre débogage.
- **Valider après la première utilisation.** Si tu fais `socket.bind((host, port))` avant de vérifier `isinstance(port, int)`, un port en chaîne échoue trois fichiers plus loin dans ton programme. La validation appartient à la *frontière* de la config, pas après que les cent premières lignes ont tourné.
- **Détecter les secrets par la forme de la valeur.** Comparer les valeurs (regexer pour `sk-…`) a l'air malin et trompe : les vraies valeurs te surprennent constamment, et les noms de clés sont déjà la seule chose stable. Compare les noms.

## Ce que tu viens de construire

Un vrai système de config par couches — valeurs par défaut, JSON, TOML et variables d'environnement fusionnés dans le bon ordre de priorité, validés contre un schéma et rendus avec les secrets sûrement masqués — tout en Python de bibliothèque standard pur plus `tomllib`. La compétence transférable est l'architecture elle-même : un *pipeline de surcharges finissant à l'environnement*, la forme derrière les systèmes de config, des réglages de Django aux outils de déploiement, et une règle défendable qui vaut la peine d'être volée entière : les secrets ne s'impriment que lorsque le cœur du métier de l'outil est de les révéler.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/config-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/config-manager) dans le dépôt du cours contient ces scripts complets plus des fichiers d'exemple `config.json`/`config.toml`, exécutables de bout en bout. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute un drapeau `--env prod` qui charge `config.prod.toml` au lieu du fichier par défaut — les surcharges spécifiques à un environnement comme une sélection, pas un hack — et regarde le pipeline de fusion rester inchangé.
- Prends en charge une clé `include = ["shared.toml"]` pour qu'un fichier de config puisse en importer d'autres — ton `deep_merge` compose les inclus gratuitement.
- Émets la config fusionnée comme un **fichier `key=value` aplati unique** pour un outil de style 12 facteurs qui consomme des points, pas de l'imbrication — `flatten` de l'Étape 3 est ton point de départ.
- Écris le verdict du masquage comme un test `pytest` affirmant que `redact` ne retourne jamais une valeur contenant `sk-` — la même garantie que les systèmes CI exécutent maintenant sur le vrai scan de secrets.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓