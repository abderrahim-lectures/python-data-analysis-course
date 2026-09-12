---
title: "Couteau Suisse JSON"
description: "Un outil CLI qui formate, valide, interroge et transforme des fichiers JSON avec la puissance de JQ."
tags: ["cli", "data-pipeline", "developer-tools"]
---

# 🔧 Construire un Couteau Suisse JSON

Tout développeur qui travaille avec du JSON a une douzaine de petites opérations : formater ce fichier, valider celui-là, extraire ce champ, convertir en YAML. Ce projet construit un seul CLI Click qui gère tout cela. C'est le genre d'outil qui fait gagner des minutes chaque jour et qui amortit son coût en une semaine.

Cela suppose Python 101 et l'aisance avec les flux de travail CLI issus de [Outils de développement](/fr/projets). C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Mettre en place un projet avec `uv` et installer les dépendances CLI et de conversion de formats.
2. Implémenter le formatage JSON avec une indentation configurable.
3. Ajouter la validation avec un rapport de localisation des erreurs.
4. Construire un moteur de requêtes en notation point style JQ.
5. Implémenter la conversion de formats entre JSON, YAML et TOML.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal, c'est un outil CLI qui lit et écrit des fichiers.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/json-swiss-army-knife/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/json-swiss-army-knife/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fjson-swiss-army-knife%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant de construire : un environnement Python, Click et les bibliothèques de formats.

### Installe `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Ferme et rouvre ton terminal, puis confirme :

```bash
uv --version
```

### Met en place le projet

```bash
uv init json-swiss-army-knife
cd json-swiss-army-knife
uv add click pyyaml tomli rich
```

`click` gère le routage du CLI. `pyyaml` et `tomli` gèrent la conversion de formats. `rich` fournit une sortie colorée.

### Crée la structure du projet

```bash
touch json_knife/__init__.py json_knife/formatter.py json_knife/validator.py json_knife/query.py json_knife/converter.py json_knife/cli.py
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `json-swiss-army-knife/` existe avec un `pyproject.toml`, et toutes les dépendances installées.
- ✅ Le répertoire `json_knife/` a tous les fichiers de modules requis.

## Étape 1 : Formate le JSON avec une indentation configurable

Le formatage rend le JSON minifié lisible par un humain. C'est la fonctionnalité la plus simple mais la plus fréquemment utilisée.

### 1.1 Implémente le formateur

**👟 Indice de départ :** Crée `json_knife/formatter.py` avec une fonction qui imprime joliment le JSON.

```python
# json_knife/formatter.py
import json

def format_json(data: str, indent: int = 2) -> str:
    parsed = json.loads(data)
    return json.dumps(parsed, indent=indent, ensure_ascii=False, sort_keys=False)
```

Ceci charge la chaîne JSON, puis la re-sérialise avec l'indentation spécifiée. `ensure_ascii=False` préserve les caractères Unicode.

**🎯 Résultat attendu :** `format_json('{"b":1,"a":2}', indent=2)` retourne :
```json
{
  "b": 1,
  "a": 2
}
```

**🩹 Si ça ne marche pas :** Si tu obtiens une `json.JSONDecodeError`, l'entrée n'est pas un JSON valide.

### 1.2 Vérifie le formateur

**✅ Liste de vérification**

- ✅ `format_json('{"a":1}')` retourne une sortie joliment imprimée.
- ✅ L'indentation personnalisée est respectée.

**🤔 Question(s) socratique(s)**

- Quelle est la différence entre `sort_keys=True` et le laisser à false ? Quand pourrais-tu vouloir des clés triées ?

## Étape 2 : Valide le JSON avec les localisations d'erreurs

La validation attrape les erreurs de syntaxe avant qu'elles ne se propagent. La valeur ajoutée est de signaler *où* l'erreur s'est produite.

### 2.1 Implémente le validateur

**👟 Indice de départ :** Crée `json_knife/validator.py`.

```python
# json_knife/validator.py
import json

def validate_json(data: str) -> tuple[bool, str]:
    try:
        json.loads(data)
        return True, "Valid JSON"
    except json.JSONDecodeError as e:
        return False, f"Line {e.lineno}, Column {e.colno}: {e.msg}"
```

`json.JSONDecodeError` inclut les attributs `lineno` et `colno` qui localisent précisément l'erreur.

**🎯 Résultat attendu :** `validate_json('{"a": 1,}')` retourne `(False, "Line 1, Column 10: ...")`.

**🩹 Si ça ne marche pas :** Si tu n'obtiens pas d'info de ligne/colonne, tu n'attrapes pas `JSONDecodeError`.

### 2.2 Vérifie le validateur

**✅ Liste de vérification**

- ✅ Un JSON valide retourne `(True, "Valid JSON")`.
- ✅ Un JSON invalide retourne `(False, ...)` avec ligne et colonne.

**🤔 Question(s) socratique(s)**

- Comment étendrais-tu ceci pour valider contre un JSON Schema ? Quelle bibliothèque utiliserais-tu ?

## Étape 3 : Construis un moteur de requêtes en notation point

C'est la fonctionnalité phare du Couteau Suisse : `$.users[*].name` pour extraire des valeurs imbriquées.

### 3.1 Implémente l'analyseur de requêtes

**👟 Indice de départ :** Crée `json_knife/query.py`.

```python
# json_knife/query.py
import json, re

def query_json(data: str, path: str) -> list:
    parsed = json.loads(data)
    tokens = re.findall(r'[\w\[\]*$]+', path)
    tokens = [t for t in tokens if t not in ("$", "")]
    results = _traverse(parsed, tokens)
    return results if isinstance(results, list) else [results]

def _traverse(obj, tokens):
    if not tokens:
        return obj
    key, *rest = tokens
    if key == "*":
        if isinstance(obj, list):
            return [_traverse(item, rest) for item in obj]
        elif isinstance(obj, dict):
            return [_traverse(v, rest) for v in obj.values()]
        return []
    elif key.endswith("]"):
        idx = int(key.rstrip("]"))
        return _traverse(obj[idx], rest) if isinstance(obj, list) and idx < len(obj) else []
    elif isinstance(obj, dict) and key in obj:
        return _traverse(obj[key], rest)
    return []
```

L'expression régulière extrait les jetons de chemin comme `"users"`, `"[*]"`, `"name"`. `_traverse` parcourt récursivement la structure. `[*]` s'étend à tous les éléments de liste.

**🎯 Résultat attendu :** `query_json('[{"name":"Alice"},{"name":"Bob"}]', '$[*].name')` retourne `["Alice", "Bob"]`.

**🩹 Si ça ne marche pas :** Si tu obtiens des résultats vides, vérifie que l'expression régulière découpe correctement les jetons.

### 3.2 Vérifie le moteur de requêtes

**✅ Liste de vérification**

- ✅ `$.users[*].name` extrait les noms d'une liste d'objets utilisateurs.
- ✅ Les chemins imbriqués comme `$.config.database.host` fonctionnent.
- ✅ Le joker `[*]` étend les éléments de liste.

**🤔 Question(s) socratique(s)**

- Comment ajouterais-tu le support de filtres comme `$.users[?(@.age > 30)]` ?
- Que se passe-t-il si le chemin contient des points dans les noms de clés ?

## Étape 4 : Implémente la conversion de formats

Convertir entre JSON, YAML et TOML évite de sauter d'outil en outil à la main.

### 4.1 Crée le convertisseur

**👟 Indice de départ :** Crée `json_knife/converter.py`.

```python
# json_knife/converter.py
import json, yaml, tomli

def convert_to_json(data: str, from_format: str) -> dict:
    if from_format == "yaml":
        return yaml.safe_load(data)
    elif from_format == "toml":
        return tomli.loads(data)
    elif from_format == "json":
        return json.loads(data)
    raise ValueError(f"Unknown format: {from_format}")

def convert_from_json(data: dict, to_format: str) -> str:
    if to_format == "yaml":
        return yaml.dump(data, default_flow_style=False, allow_unicode=True)
    elif to_format == "toml":
        import tomli_w
        return tomli_w.dumps(data)
    elif to_format == "json":
        return json.dumps(data, indent=2, ensure_ascii=False)
    raise ValueError(f"Unknown format: {to_format}")
```

**🎯 Résultat attendu :** Convertir du JSON en YAML et inversement produit des données équivalentes.

**🩹 Si ça ne marche pas :** Si la conversion TOML échoue, assure-toi d'avoir installé `tomli-w` pour l'écriture.

### 4.2 Vérifie le convertisseur

**✅ Liste de vérification**

- ✅ JSON → YAML préserve les types de données.
- ✅ YAML → JSON fait correctement l'aller-retour.
- ✅ TOML ↔ JSON fonctionne pour les structures simples.

**🤔 Question(s) socratique(s)**

- Quels types de données TOML peut représenter que JSON ne peut pas (et inversement) ?

## ⚠️ Pièges courants

- **Injection de chemin dans les requêtes.** Analyse toujours les chemins avec une expression régulière ou un tokenizer, ne passe jamais de chaînes brutes à `eval()` ou à un accès d'attribut dynamique.
- **Coercition de type par défaut de YAML.** YAML convertit silencieusement `yes` en `True` et `1.0` en flottant. Utilise `yaml.safe_load()` et jamais `yaml.load()` avec une entrée non fiable.
- **TOML ne supporte que les dictionnaires.** Les tableaux de premier niveau ne sont pas du TOML valide. Convertir un tableau JSON en TOML nécessite de l'envelopper dans un dict.
- **Streaming pour les gros fichiers.** Les quatre fonctionnalités chargent tout le fichier en mémoire. Pour les fichiers JSON de plus de 100 Mo, utilise `ijson` pour les requêtes en streaming.
- **Arguments vs options de Click.** Utilise des arguments pour le fichier d'entrée (positionnel, obligatoire) et des options pour les drapeaux comme `--indent` et `--output-format`. Cela correspond aux attentes des utilisateurs.

## Ce que tu viens de construire

Un seul outil CLI qui gère les quatre opérations JSON les plus courantes : formatage, validation, requêtes et conversion de formats. Le moteur de requêtes en notation point parcourt récursivement les structures imbriquées et étend les jokers. La conversion de formats relie JSON, YAML et TOML pour les flux de travail de pipelines de données. Cet outil résout une vraie douleur de développeur, chaque équipe a quelqu'un qui lance `python -m json.tool` et souhaite que ça en fasse plus.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/json-swiss-army-knife/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/json-swiss-army-knife) dans le dépôt du cours a une version plus riche avec des requêtes en streaming, un diff JSON, la validation de schéma et le CLI câblé de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute l'analyse JSON en streaming avec `ijson` pour interroger des fichiers de plusieurs Go sans les charger en mémoire.
- Implémente un diff JSON entre deux fichiers, montrant les clés ajoutées, supprimées et modifiées.
- Ajoute un drapeau `--jq` qui accepte de vraies expressions JQ, pas seulement la notation point.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓