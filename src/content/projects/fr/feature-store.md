---
title: "Magasin de Features"
description: "Référentiel centralisé de features pour le ML avec versionnage, partage et service online/offline."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["ml", "data-pipeline", "database"]
learningObjectives:
  - "Concevoir un registre de features avec métadonnées versionnées"
  - "Calculer des features à partir de données brutes et les persister dans un magasin local"
  - "Servir les features par recherche par clé à un instant donné pour l'entraînement et l'inférence"
  - "Exposer une CLI simple pour enregistrer, calculer et récupérer des features"
prerequisites: ["Python 101", "Data Analysis"]
---

# 🗄️ Construis un Magasin de Features

Les modèles de machine learning cassent quand le code qui calcule les features pendant l'entraînement dérive du code qui les calcule en production. Un magasin de features corrige cela en calculant les features une fois, en les versionnant, et en servant les mêmes valeurs que tu ajustes un modèle ou que tu scores une requête. Ce projet construit un magasin de features léger, adossé à des fichiers, avec une CLI : tu enregistres des définitions de features, tu les calcules à partir de données brutes, et tu les récupères par clé d'entité avec une exactitude à un instant donné.

Ceci suppose Python 101 et une aisance avec pandas acquise en Analyse de données, rien au-delà. Facultatif et non noté ; consulte [Real-World Projects](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Monter un petit projet avec `uv` et installer les dépendances dont tu auras besoin.
2. Définir un registre de features qui stocke les noms, versions et descriptions de sources de features comme JSON.
3. Écrire une fonction de calcul de feature qui transforme des données brutes en un DataFrame réutilisable.
4. Persister les features calculées dans un magasin Parquet local avec des instantanés versionnés.
5. Récupérer des features par clé d'entité avec une exactitude à un instant donné pour que l'entraînement ne voie jamais de données futures.
6. Tout câbler dans une CLI qui enregistre, calcule et récupère depuis la ligne de commande.

## Où exécuter ceci

**Localement avec `uv`** est le chemin principal ici, ce projet lit et écrit des fichiers sur disque (instantanés Parquet, registre JSON), ce qui fonctionne le plus naturellement en dehors d'un notebook.

**Google Colab, Kaggle Notebooks, et Binder** fonctionnent bien pour essayer l'outil. Le notebook installe les mêmes dépendances et utilise le même code ; le stockage sur fichiers fonctionne dans le système de fichiers éphémère d'un notebook pendant la durée de la session.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/feature-store/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/feature-store/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffeature-store%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant de construire : un environnement Python, deux bibliothèques et un petit répertoire de projet.

### Installer `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Ferme et rouvre ton terminal, puis confirme :

```bash
uv --version
```

### Initialiser le projet

```bash
uv init feature-store
cd feature-store
uv add pandas pyarrow click
```

`pandas` gère le calcul des features, `pyarrow` nous permet d'écrire et de lire efficacement des fichiers Parquet, et `click` construit l'interface CLI. `python-dotenv` n'est pas nécessaire ici puisqu'aucune clé API n'est impliquée.

### Créer la structure du projet

```bash
mkdir -p store
touch store/__init__.py store/registry.py store/compute.py store/io.py store/cli.py
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `feature-store/` existe avec un `pyproject.toml`, et `pandas`, `pyarrow` et `click` sont installés.
- ✅ Le répertoire `store/` a `__init__.py`, `registry.py`, `compute.py`, `io.py` et `cli.py`.

## Étape 1 : Définir le registre de features

Un registre de features est le catalogue de tout ce que ton magasin sait calculer. Chaque entrée enregistre le nom de la feature, sa version, une description lisible par l'humain, et la clé d'entité sur laquelle elle est indexée. Garder ceci comme un simple fichier JSON signifie que tu peux l'inspecter à la main, le diffuser entre versions, et le charger vite.

### 1.1 Écris le schéma du registre

**👟 Indice de départ :** Crée une dataclass `Feature` et une classe `Registry` qui charge et enregistre un fichier JSON.

```python
# store/registry.py
import json
from dataclasses import dataclass, asdict
from pathlib import Path

REGISTRY_PATH = Path("feature_registry.json")

@dataclass
class Feature:
    name: str
    version: int
    description: str
    entity_key: str  # the column used to look up this feature

class Registry:
    def __init__(self, path: Path = REGISTRY_PATH):
        self.path = path
        self.features: dict[str, Feature] = {}
        if path.exists():
            self._load()

    def _load(self):
        raw = json.loads(self.path.read_text())
        for entry in raw:
            feat = Feature(**entry)
            self.features[feat.name] = feat

    def register(self, name: str, version: int, description: str, entity_key: str):
        feat = Feature(name, version, description, entity_key)
        self.features[name] = feat
        self._save()

    def _save(self):
        data = [asdict(f) for f in self.features.values()]
        self.path.write_text(json.dumps(data, indent=2))
```

Le registre est un dictionnaire indexé par nom de feature, adossé à un fichier JSON plat. Chaque `Feature` porte un `version` entier pour pouvoir avancer sans détruire les anciennes définitions. Le champ `entity_key` enregistre quelle colonne sert de clé de recherche, cela compte plus tard pour récupérer des features pour une entité spécifique.

**🎯 Résultat attendu :** `Registry().register("avg_order_value", 1, "Mean order value", "user_id")` crée un fichier `feature_registry.json` contenant une entrée avec les quatre champs.

**🩹 Si ça ne marche pas :** Si le fichier JSON n'apparaît pas, `self._save()` ne peut pas être appelé après `register()`. Si le chargement d'un fichier corrompu lève une erreur déroutante, ajoute un `try/except json.JSONDecodeError` autour de `_load()` et imprime un message clair.

### 1.2 Vérifie que le registre fait l'aller-retour

```python
# Quick smoke test
from store.registry import Registry

reg = Registry()
reg.register("avg_order_value", 1, "Mean order value per user", "user_id")
reg2 = Registry()  # re-load from disk
assert reg2.features["avg_order_value"].version == 1
```

Recharger le registre depuis le disque devrait produire la même `Feature` que tu viens d'enregistrer, cela confirme que l'aller-retour JSON fonctionne de bout en bout.

**🎯 Résultat attendu :** L'assertion passe silencieusement ; `feature_registry.json` contient l'entrée enregistrée.

**🩹 Si ça ne marche pas :** Si `reg2` est vide, le chemin `_load()` ne s'exécute pas, vérifie que `self.path.exists()` renvoie `True` au moment du chargement.

### 1.3 Vérifie le registre

**✅ Liste de vérification**

- ✅ `Registry().register(...)` crée un fichier `feature_registry.json` avec les bons champs.
- ✅ Recharger un `Registry()` depuis le même chemin redonne les mêmes données de feature.
- ✅ Deux features avec des noms différents peuvent coexister dans le même fichier de registre.

**🤔 Question(s) socratique(s)**

- Pourquoi utiliser un entier de version au lieu de simplement écraser la définition de feature en place ? Qu'est-ce qui casse si tu mutes toujours la dernière version ?
- Le registre stocke les métadonnées de features mais pas les valeurs calculées. Quel avantage la séparation métadonnées/données te donne-t-elle quand tu ajoutes plus tard un second backend de stockage ?

## Étape 2 : Calculer des features à partir de données brutes

Maintenant que le registre sait *quelles* features existent, tu as besoin d'un code qui les *calcule* à partir des données brutes. Une fonction de calcul de feature prend un DataFrame brut et renvoie un nouveau DataFrame avec la feature calculée comme colonne, jointe sur la clé d'entité.

### 2.1 Écris la première fonction de calcul

**👟 Indice de départ :** Écris une fonction qui regroupe des données de transactions brutes par `user_id` et calcule la valeur moyenne de commande.

```python
# store/compute.py
import pandas as pd

def compute_avg_order_value(transactions: pd.DataFrame) -> pd.DataFrame:
    """Compute the average order value per user from a transactions DataFrame."""
    return (
        transactions
        .groupby("user_id")["amount"]
        .mean()
        .reset_index(name="avg_order_value")
    )
```

Le calcul est un simple `groupby` + `mean` pandas, le même schéma que dans toute analyse de données. La fonction renvoie un DataFrame avec exactement deux colonnes : la clé d'entité (`user_id`) et la valeur de la feature (`avg_order_value`). Cette forme à deux colonnes est le format de sortie standard que chaque fonction de calcul devrait suivre.

**🎯 Résultat attendu :** Étant donné un DataFrame avec les colonnes `user_id` et `amount`, la fonction renvoie un DataFrame avec les colonnes `user_id` et `avg_order_value` où chaque ligne est la moyenne d'un utilisateur.

**🩹 Si ça ne marche pas :** Si la sortie a des colonnes en trop, le `groupby` sélectionne trop. Si l'index semble faux, assure-toi que `.reset_index(name="avg_order_value")` est bien enchaîné.

### 2.2 Ajoute une seconde fonction de calcul

```python
# store/compute.py (continued)
def compute_purchase_count(transactions: pd.DataFrame) -> pd.DataFrame:
    """Compute the total number of purchases per user."""
    return (
        transactions
        .groupby("user_id")
        .size()
        .reset_index(name="purchase_count")
    )
```

En ajoutant une seconde fonction tu confirmes le schéma : chaque calcul est une fonction autonome qui prend des données brutes et renvoie un DataFrame à deux colonnes indexé sur l'entité.

**🎯 Résultat attendu :** `compute_purchase_count(df)` renvoie un DataFrame avec les colonnes `user_id` et `purchase_count`.

**🩹 Si ça ne marche pas :** Si `.size()` renvoie une Series au lieu d'un DataFrame, tu as oublié `.reset_index(name="purchase_count")`.

### 2.3 Vérifie les calculs

**✅ Liste de vérification**

- ✅ `compute_avg_order_value(df)` renvoie un DataFrame à deux colonnes avec `user_id` et `avg_order_value`.
- ✅ `compute_purchase_count(df)` renvoie un DataFrame à deux colonnes avec `user_id` et `purchase_count`.
- ✅ Les deux fonctions travaillent sur le même DataFrame d'entrée sans le modifier.

**🤔 Question(s) socratique(s)**

- Pourquoi imposer une sortie à deux colonnes (clé d'entité + valeur de feature) plutôt que de renvoyer une Series ou un dict ? Comment cette forme simplifie-t-elle les étapes de stockage et de récupération ?
- Que se passe-t-il si deux tables brutes différentes partagent la même clé d'entité mais ont des types d'entité différents, disons `user_id` dans les commandes et `product_id` dans l'inventaire ?

## Étape 3 : Persister les features en Parquet avec des instantanés versionnés

Les features calculées doivent atterrir sur disque pour pouvoir être récupérées plus tard. Parquet est le bon format ici : il est columnar, rapide à lire, et pandas l'écrit avec un seul appel de fonction. Chaque version d'une feature obtient son propre fichier, donc récupérer « version 1 » signifie lire un fichier spécifique.

### 3.1 Écris la couche de persistance

**👟 Indice de départ :** Crée `store/io.py` avec des fonctions pour écrire un DataFrame dans un fichier Parquet versionné et le relire.

```python
# store/io.py
import pandas as pd
from pathlib import Path

STORE_DIR = Path("feature_store_data")

def save_features(feature_name: str, version: int, df: pd.DataFrame):
    """Write a feature DataFrame to a versioned Parquet file."""
    STORE_DIR.mkdir(exist_ok=True)
    path = STORE_DIR / f"{feature_name}_v{version}.parquet"
    df.to_parquet(path, index=False)

def load_features(feature_name: str, version: int) -> pd.DataFrame:
    """Read a feature DataFrame from a versioned Parquet file."""
    path = STORE_DIR / f"{feature_name}_v{version}.parquet"
    return pd.read_parquet(path)
```

La convention de nommage `{name}_v{version}.parquet` est simple et lisible par l'humain. `mkdir(exist_ok=True)` signifie que la fonction fonctionne au premier lancement sans étape de configuration séparée. Écrire avec `index=False` garde le fichier Parquet propre, la clé d'entité est une colonne régulière, pas un index, ce qui simplifie les jointures en aval.

**🎯 Résultat attendu :** `save_features("avg_order_value", 1, df)` crée `feature_store_data/avg_order_value_v1.parquet`, et `load_features("avg_order_value", 1)` renvoie un DataFrame identique.

**🩹 Si ça ne marche pas :** Si `load_features` lève une `FileNotFoundError`, le chemin du fichier ne correspond pas, vérifie que `STORE_DIR` et le schéma de nommage sont cohérents entre l'écriture et la lecture. Si le DataFrame chargé a une colonne `__index_level_0__` en trop, tu as enregistré avec `index=True` au lieu de `False`.

### 3.2 Vérifie l'aller-retour

```python
# Quick round-trip test
import pandas as pd
from store.io import save_features, load_features

df = pd.DataFrame({"user_id": [1, 2], "avg_order_value": [45.0, 82.5]})
save_features("avg_order_value", 1, df)
loaded = pd.read_parquet("feature_store_data/avg_order_value_v1.parquet")
assert loaded.equals(df)
```

Le fichier enregistré devrait se relire comme un DataFrame identique. Ce test d'aller-retour attrape tôt les écarts de format, les problèmes d'index et les incohérences de chemins.

**🎯 Résultat attendu :** L'assertion passe ; le fichier Parquet existe sur disque avec la bonne taille.

**🩹 Si ça ne marche pas :** Si l'assertion échoue, vérifie un écart de version pandas ou une colonne d'index non désirée.

### 3.3 Vérifie la persistance

**✅ Liste de vérification**

- ✅ `save_features` crée un fichier `.parquet` dans `feature_store_data/`.
- ✅ `load_features` relit un DataFrame identique depuis ce fichier.
- ✅ Deux versions différentes de la même feature existent comme fichiers séparés sur disque.

**🤔 Question(s) socratique(s)**

- Pourquoi des fichiers séparés par version au lieu d'un seul fichier avec une colonne `version` ? Quel compromis cela crée-t-il entre stockage et vitesse de lecture ?
- Parquet compresse les données par colonne. Pour un magasin de features avec de nombreuses features par entité, pourquoi le stockage columnar pourrait-il être plus rapide que le stockage par lignes comme CSV ?

## Étape 4 : Récupérer les features par clé d'entité avec une exactitude à un instant donné

La caractéristique critique d'un magasin de features est l'exactitude à un instant donné : lors de l'entraînement d'un modèle sur des données historiques, tu ne dois pas faire fuiter des valeurs futures de features dans le passé. Cette étape construit une fonction de récupération qui lit un fichier de features versionné et filtre sur exactement les clés d'entité que tu demandes.

### 4.1 Écris la fonction de récupération

**👟 Indice de départ :** Crée `fetch_features` dans `store/io.py` qui charge une feature versionnée et filtre sur les clés d'entité demandées.

```python
# store/io.py (continued)
def fetch_features(
    feature_name: str,
    version: int,
    entity_keys: list,
    key_column: str = "user_id",
) -> pd.DataFrame:
    """Fetch feature values for specific entity keys from a versioned snapshot."""
    df = load_features(feature_name, version)
    return df[df[key_column].isin(entity_keys)].reset_index(drop=True)
```

Le filtre `isin` est la forme la plus simple d'exactitude à un instant donné : tu charges un instantané écrit à un moment précis, et tu récupères uniquement les entités qui t'intéressent. Le paramètre `key_column` permet à cette fonction de travailler pour n'importe quel type d'entité, pas seulement `user_id`.

**🎯 Résultat attendu :** `fetch_features("avg_order_value", 1, [1, 3])` renvoie un DataFrame avec uniquement les lignes où `user_id` est 1 ou 3.

**🩹 Si ça ne marche pas :** Si le résultat inclut des clés que tu n'as pas demandées, le nom de la colonne de filtre est faux. Si le résultat est vide, les clés pourraient ne pas exister dans l'instantané stocké, vérifie le numéro de version.

### 4.2 Construis la façade `FeatureStore`

```python
# store/io.py (continued)
class FeatureStore:
    """Convenience wrapper tying registry, computation, and storage together."""

    def __init__(self, registry: "Registry"):
        self.registry = registry

    def compute_and_store(self, name: str, raw_df: pd.DataFrame, compute_fn):
        """Register a feature, compute it, and persist the result."""
        feat = self.registry.features[name]
        df = compute_fn(raw_df)
        save_features(name, feat.version, df)
        return df

    def get(self, name: str, entity_keys: list, key_column: str = "user_id") -> pd.DataFrame:
        """Fetch feature values for specific entity keys."""
        feat = self.registry.features[name]
        return fetch_features(name, feat.version, entity_keys, key_column)
```

La façade relie les trois couches : `compute_and_store` appelle la fonction de calcul et persiste le résultat sous la version du registre. `get` relit la feature stockée pour des entités spécifiques. Cette séparation calcul/stockage/récupération est la même architecture que celle des magasins de features de production, c'est juste plus petit ici.

**🎯 Résultat attendu :** `store.get("avg_order_value", [1, 2])` renvoie un DataFrame à deux colonnes avec les valeurs de ces deux utilisateurs.

**🩹 Si ça ne marche pas :** Si `get` lève une `KeyError`, la feature n'est pas dans le registre, enregistre-la avant de la récupérer. Si le DataFrame renvoyé a toutes les lignes au lieu des seules clés demandées, vérifie que `fetch_features` filtre, et ne renvoie pas le DataFrame complet.

### 4.3 Vérifie la récupération à un instant donné

**✅ Liste de vérification**

- ✅ `fetch_features` renvoie uniquement les clés d'entité demandées, pas le DataFrame stocké complet.
- ✅ `FeatureStore.get` lit la bonne version depuis le registre.
- ✅ Calculer et récupérer la même feature renvoie des valeurs cohérentes.

**🤔 Question(s) socratique(s)**

- Dans un vrai pipeline ML, tu pourrais entraîner sur des données de janvier mais servir des prédictions en mars. Comment le schéma de numérotation de versions t'aide-t-il à servir le modèle entraîné en janvier avec les valeurs de features de janvier, même si des valeurs de mars existent désormais ?
- Qu'est-ce qui casse si deux features partagent la même colonne de clé d'entité mais que le calcul de l'une regroupe sur une colonne différente ?

## Étape 5 : Tout câbler dans une CLI

Une CLI te permet d'enregistrer des features, de les calculer et de récupérer des résultats sans écrire de scripts Python. Cette étape utilise `click` pour construire trois sous-commandes.

### 5.1 Construis la CLI

**👟 Indice de départ :** Crée `store/cli.py` avec les sous-commandes `register`, `compute` et `fetch`.

```python
# store/cli.py
import click
import pandas as pd
from store.registry import Registry
from store.compute import compute_avg_order_value, compute_purchase_count
from store.io import FeatureStore

COMPUTE_MAP = {
    "avg_order_value": compute_avg_order_value,
    "purchase_count": compute_purchase_count,
}

@click.group()
def cli():
    """Feature Store CLI — register, compute, and fetch ML features."""
    pass

@cli.command()
@click.option("--name", required=True, help="Feature name")
@click.option("--version", default=1, help="Feature version")
@click.option("--description", default="", help="Human-readable description")
@click.option("--entity-key", default="user_id", help="Column to key on")
def register(name, version, description, entity_key):
    reg = Registry()
    reg.register(name, version, description, entity_key)
    click.echo(f"Registered '{name}' v{version}")

@cli.command()
@click.option("--name", required=True, help="Feature name to compute")
@click.option("--input", "input_file", required=True, help="Path to CSV input")
def compute(name, input_file):
    reg = Registry()
    store = FeatureStore(reg)
    fn = COMPUTE_MAP.get(name)
    if fn is None:
        click.echo(f"Unknown feature: {name}. Available: {list(COMPUTE_MAP)}")
        return
    df = pd.read_csv(input_file)
    result = store.compute_and_store(name, df, fn)
    click.echo(f"Computed {len(result)} rows for '{name}'")

@cli.command()
@click.option("--name", required=True, help="Feature name to fetch")
@click.option("--keys", required=True, help="Comma-separated entity keys")
@click.option("--key-column", default="user_id", help="Column to filter on")
def fetch(name, keys, key_column):
    reg = Registry()
    store = FeatureStore(reg)
    key_list = [int(k.strip()) for k in keys.split(",")]
    result = store.get(name, key_list, key_column)
    click.echo(result.to_string(index=False))

if __name__ == "__main__":
    cli()
```

Le dictionnaire `COMPUTE_MAP` est la table de distribution : il mappe les noms de features vers leurs fonctions de calcul. Ajouter une nouvelle feature signifie écrire une fonction de calcul et ajouter une ligne à cette table. La CLI est fine, elle analyse les arguments, délègue au code de bibliothèque, et imprime les résultats, ce qui facilite le test indépendant de chaque sous-commande.

**🎯 Résultat attendu :** `uv run python -m store.cli register --name avg_order_value --version 1 --description "Mean order value" --entity-key user_id` imprime « Registered 'avg_order_value' v1 » et crée le fichier de registre.

**🩹 Si ça ne marche pas :** Si `click` ne trouve pas la commande, tu peux avoir besoin de `if __name__ == "__main__": cli()` en bas. Si la commande compute échoue avec une feature manquante, enregistre-la d'abord.

### 5.2 Test de fumée de bout en bout

```python
# Quick end-to-end test
import pandas as pd
from store.registry import Registry
from store.compute import compute_avg_order_value, compute_purchase_count
from store.io import FeatureStore

raw = pd.DataFrame({
    "user_id": [1, 1, 2, 2, 3],
    "amount": [10, 20, 30, 40, 50],
})
reg = Registry()
reg.register("avg_order_value", 1, "Mean order value per user", "user_id")
reg.register("purchase_count", 1, "Total purchases per user", "user_id")

store = FeatureStore(reg)
store.compute_and_store("avg_order_value", raw, compute_avg_order_value)
store.compute_and_store("purchase_count", raw, compute_purchase_count)

avg = store.get("avg_order_value", [1, 3])
cnt = store.get("purchase_count", [2])
print(avg)
print(cnt)
```

Cela exécute le pipeline complet : enregistrer, calculer, stocker, récupérer. Chaque morceau a été testé individuellement dans les étapes précédentes ; cela confirme qu'ils fonctionnent ensemble.

**🎯 Résultat attendu :** La table de valeur moyenne de commande montre `user_id 1` à `15.0` et `user_id 3` à `50.0`. Le nombre d'achats pour `user_id 2` est `2`.

**🩹 Si ça ne marche pas :** Si les valeurs sont fausses, la fonction de calcul ne regroupe peut-être pas sur la bonne colonne. Si la récupération renvoie toutes les lignes, `fetch_features` ne filtre pas par clé.

### 5.3 Vérifie le pipeline CLI

**✅ Liste de vérification**

- ✅ `register` crée une entrée de registre ; `compute` lit un CSV et persiste des fichiers Parquet ; `fetch` imprime des valeurs de features filtrées.
- ✅ Exécuter les trois sous-commandes en séquence produit des résultats cohérents.
- ✅ La CLI imprime des messages d'erreur utiles pour les features inconnues ou les fichiers manquants.

**🤔 Question(s) socratique(s)**

- La CLI distribue le calcul de features via un `COMPUTE_MAP` codé en dur. Dans un vrai magasin de features avec des douzaines de features, comment éviterais-tu de modifier cette table à chaque ajout ?
- Si tu voulais ajouter un drapeau `--version` à la commande `fetch`, qu'est-ce qui changerait dans la façon dont le registre est consulté ?

## ⚠️ Pièges courants

- **Calculer des features sur le jeu de données complet y compris les lignes futures.** Lors de l'entraînement sur des données historiques, ton DataFrame brut doit être filtré sur la période d'entraînement *avant* de le passer à la fonction de calcul. L'exactitude à un instant donné vit dans les données d'entrée, pas dans la logique de récupération du magasin de features.
- **Écraser les fichiers de features sans versionner.** Si `save_features` écrit au même chemin à chaque fois, tu perds la capacité de servir les anciennes versions. Inclus toujours le numéro de version dans le nom de fichier et incrémente-le quand la logique de calcul change.
- **Fuite d'index dans les allers-retours Parquet.** Pandas écrit l'index du DataFrame en Parquet par défaut. Utilise `index=False` à l'enregistrement et `reset_index(drop=True)` à la récupération pour garder la clé d'entité comme une colonne simple, pas un index caché.
- **Codage en dur du nom de la colonne de clé d'entité.** Différentes features peuvent être indexées sur différentes colonnes (`user_id`, `product_id`, `session_id`). Le paramètre `key_column` existe pour cette raison, ne suppose pas que chaque feature utilise `user_id`.
- **Oublier d'enregistrer avant de calculer.** `FeatureStore.compute_and_store` lit la version depuis le registre. Si la feature n'est pas enregistrée, tu obtiens une `KeyError`, enregistre toujours d'abord.

## Ce que tu viens de construire

Un magasin de features léger mais réel : un registre qui catalogue les définitions de features avec versionnage, des fonctions de calcul qui transforment des données brutes en features réutilisables, une persistance Parquet pour les instantanés versionnés, et une CLI qui relie enregistrer-calculer-récupérer en un seul pipeline. L'architecture, séparer métadonnées, calcul, stockage et service, reflète le fonctionnement des magasins de features de production comme Feast et Tecton, juste avec des fichiers au lieu d'une base de données distribuée.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/feature-store/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/feature-store) dans le dépôt du cours a une version plus riche avec plus de fonctions de calcul de features, un jeu de données CSV d'échantillon, et la CLI câblée de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller ensuite

- Ajoute une vérification de fraîcheur qui horodate chaque instantané de feature et alerte quand les données sont plus anciennes qu'un seuil configurable.
- Construis une sous-commande `compare` qui fait un diff entre deux versions de la même feature pour détecter la dérive entraînement-service.
- Intègre un vrai script d'entraînement de modèle : récupère des features pour un ensemble de clés d'entité, passe-les à un modèle scikit-learn, et évalue si la dérive de version change l'exactitude.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants, et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓