---
title: "Serveur d'API GraphQL"
description: "Construisez une API GraphQL flexible avec des résolveurs, des abonnements et DataLoader pour la prévention N+1."
difficulty: "advanced"
estimatedMinutes: 70
tags: ["api", "graphql", "async"]
learningObjectives:
  - "Définir un schéma GraphQL avec des requêtes, des mutations et des types"
  - "Écrire des résolveurs qui récupèrent les données depuis un stockage sous-jacent"
  - "Utiliser DataLoader pour regrouper les requêtes de base de données et prévenir les problèmes N+1"
  - "Implémenter des abonnements en temps réel pour les mises à jour de données en direct"
prerequisites: ["Python 101", "Data Analysis"]
---

# 🔷 Construis un Serveur d'API GraphQL

Les API REST te forcent à concevoir un point de terminaison par ressource, mais les clients réels ont souvent besoin des données de cinq ressources différentes dans un seul chargement d'écran. GraphQL résout cela en laissant le client demander exactement ce dont il a besoin dans une seule requête. Ce projet construit un serveur d'API GraphQL de zéro : tu définis un schéma avec des types et des requêtes, tu écris des résolveurs qui récupèrent de vraies données, tu utilises DataLoader pour regrouper les recherches en base de données et prévenir le problème de requêtes N+1, et tu ajoutes des abonnements pour les mises à jour en temps réel. Le serveur s'exécute sur Strawberry (une bibliothèque GraphQL Python) avec un stockage de données en mémoire.

Ceci suppose Python 101 et une aisance avec pandas de Data Analysis — rien de plus. Optionnel et non noté ; voir [Real-World Projects](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Configurer un projet avec `uv` et installer les dépendances GraphQL dont tu auras besoin.
2. Définir un schéma GraphQL avec des types, des requêtes et des mutations en utilisant Strawberry.
3. Écrire des résolveurs qui renvoient de vraies données depuis un stockage en mémoire.
4. Implémenter DataLoader pour regrouper plusieurs recherches en une seule requête par requête HTTP.
5. Ajouter des abonnements qui poussent les mises à jour en direct quand les données changent.
6. Exécuter le serveur et le tester avec GraphQL Playground.

## Où exécuter ceci

**Localement avec `uv`** est la voie principale — c'est un serveur qui s'exécute sur `localhost` et sert des requêtes HTTP. Tu interagiras avec lui via un GraphQL Playground basé sur le navigateur ou un outil comme `curl`.

**GitHub Codespaces** fonctionne bien : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) — Python, `uv` et le réseau sont déjà configurés, donc chaque étape fonctionne exactement comme en local.

**Google Colab, Kaggle Notebooks et Binder** peuvent exécuter le serveur pour un test rapide, mais le GraphQL Playground ne se rend peut-être pas dans le panneau de sortie d'un notebook. Le notebook démarre le serveur sur un port et le teste avec `curl` à la place.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/graphql-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/graphql-server/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgraphql-server%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant d'écrire un schéma : un environnement Python, la bibliothèque GraphQL Strawberry et un framework web asynchrone pour le servir.

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
uv init graphql-server
cd graphql-server
uv add strawberry-graphql uvicorn
```

`strawberry-graphql` est une bibliothèque GraphQL code-first pour Python — tu définis ton schéma comme des types Python, et elle génère le schéma GraphQL et les résolveurs automatiquement. `uvicorn` est le serveur ASGI qui exécute l'application. `asyncio` est dans la bibliothèque standard et alimente le regroupement DataLoader.

### Créer la structure du projet

```bash
mkdir -p gql
touch gql/__init__.py gql/types.py gql/schema.py gql/dataloaders.py gql/store.py gql/server.py
```

**✅ Liste de vérification**

- ✅ `uv --version` imprime un numéro de version.
- ✅ `graphql-server/` existe avec un `pyproject.toml`, et `strawberry-graphql` et `uvicorn` sont installés.
- ✅ Le répertoire `gql/` a tous les fichiers de modules requis.

## Étape 1 : Définir le stockage de données et les types GraphQL

Avant de pouvoir écrire un schéma, tu as besoin de données à servir et de types pour les décrire. Cette étape crée un simple stockage en mémoire d'utilisateurs et de publications, puis définit les types GraphQL qui les reflètent.

### 1.1 Créer le stockage de données en mémoire

**👟 Indice de départ :** Crée `gql/store.py` avec des utilisateurs et des publications d'exemple.

```python
# gql/store.py
from dataclasses import dataclass, field

@dataclass
class User:
    id: int
    name: str
    email: str

@dataclass
class Post:
    id: int
    author_id: int
    title: str
    body: str
    published: bool = False

# In-memory "database"
USERS: dict[int, User] = {
    1: User(id=1, name="Alice", email="alice@example.com"),
    2: User(id=2, name="Bob", email="bob@example.com"),
    3: User(id=3, name="Carol", email="carol@example.com"),
}

POSTS: dict[int, Post] = {
    101: Post(id=101, author_id=1, title="First Post", body="Hello world", published=True),
    102: Post(id=102, author_id=1, title="Draft", body="Work in progress", published=False),
    103: Post(id=103, author_id=2, title="GraphQL Tips", body="Use DataLoader!", published=True),
}
```

Le stockage est volontairement simple — des dictionnaires ordinaires avec des valeurs dataclass. Cela garde le focus sur la mécanique GraphQL plutôt que sur les pilotes de base de données. En production, tu remplacerais ces dictionnaires par une base de données, mais la couche GraphQL reste identique.

**🎯 Résultat attendu :** `USERS[1].name` renvoie `"Alice"` ; `POSTS[101].author_id` renvoie `1`.

**🩹 Si ça ne marche pas :** Si `USERS` est vide après l'avoir défini, vérifie que la syntaxe du dictionnaire est correcte (pas de virgules manquantes entre les entrées).

### 1.2 Définir les types GraphQL Strawberry

```python
# gql/types.py
import strawberry

@strawberry.type
class UserType:
    id: int
    name: str
    email: str

@strawberry.type
class PostType:
    id: int
    title: str
    body: str
    published: bool
    author: "UserType"  # resolved lazily, not eagerly

@strawberry.type
class Query:
    pass  # extended in schema.py

@strawberry.type
class Mutation:
    pass  # extended in schema.py
```

Strawberry utilise les annotations de type Python pour générer le schéma GraphQL. Chaque classe `@strawberry.type` devient un `type` GraphQL, et chaque champ devient un champ GraphQL. Le champ `author` de `PostType` est marqué comme un `UserType` — sa résolution réelle (charger l'utilisateur par `author_id`) se fait dans un résolveur, pas dans la définition de type. Cette séparation est ce qui rend GraphQL flexible : le client peut demander `post.author.name` ou juste `post.title`, et seuls les résolveurs nécessaires aux champs demandés s'exécutent réellement.

**🎯 Résultat attendu :** `UserType(id=1, name="Alice", email="alice@example.com")` crée un type Strawberry qui se sérialise correctement.

**🩹 Si ça ne marche pas :** Si `@strawberry.type` n'est pas reconnu, vérifie que `strawberry` est importé depuis le bon chemin. Si la chaîne de type de champ `author` `"UserType"` cause une erreur, utilise `from __future__ import annotations` en haut du fichier.

### 1.3 Vérifier les types

**✅ Liste de vérification**

- ✅ `USERS` et `POSTS` stockent les données comme des dictionnaires ordinaires.
- ✅ `UserType` et `PostType` sont des types Strawberry avec les bons champs.
- ✅ Le champ `author` de `PostType` référence `UserType`.

**🤔 Question(s) socratique(s)**

- En REST, tu aurais `/users/1` et `/posts/101` comme points de terminaison séparés. En GraphQL, les deux sont des champs sur la même racine `Query`. Quel avantage cela donne-t-il à un client qui a besoin des données utilisateur et publication ensemble ?
- Le champ `author` est typé mais pas encore résolu. Comment la résolution paresseuse de GraphQL fait-elle en sorte que le serveur ne charge jamais plus de données que le client ne demande réellement ?

## Étape 2 : Écrire les résolveurs pour les requêtes

Les résolveurs sont des fonctions qui récupèrent des données pour chaque champ. Quand un client demande `posts { author { name } }`, le résolveur de `posts` renvoie la liste des publications, et le résolveur de `author` sur chaque publication renvoie l'utilisateur correspondant.

### 2.1 Écrire les résolveurs de requêtes

**👟 Indice de départ :** Crée `gql/schema.py` avec des résolveurs pour les requêtes `users`, `posts` et `user`.

```python
# gql/schema.py
import strawberry
from gql.types import UserType, PostType, Query, Mutation
from gql.store import USERS, POSTS

def resolve_users(root, info) -> list[UserType]:
    return [UserType(id=u.id, name=u.name, email=u.email) for u in USERS.values()]

def resolve_user(root, info, id: int) -> UserType | None:
    u = USERS.get(id)
    return UserType(id=u.id, name=u.name, email=u.email) if u else None

def resolve_posts(root, info, author_id: int | None = None) -> list[PostType]:
    posts = POSTS.values()
    if author_id is not None:
        posts = [p for p in posts if p.author_id == author_id]
    return [
        PostType(id=p.id, title=p.title, body=p.body, published=p.published, author=None)
        for p in posts
    ]

def resolve_author(post: PostType, info) -> UserType | None:
    u = USERS.get(post.author_id)
    return UserType(id=u.id, name=u.name, email=u.email) if u else None

# Attach resolvers to the types
Query.users = resolve_users
Query.user = resolve_user
Query.posts = resolve_posts
PostType.author = resolve_author

schema = strawberry.Schema(query=Query, mutation=Mutation)
```

L'objet `schema` est le point d'entrée — Strawberry génère le schéma GraphQL complet à partir de lui, y compris l'introspection. La fonction `resolve_author` est attachée directement à `PostType.author`, donc quand un client demande `post.author`, cette fonction s'exécute. Quand le client ne demande pas `author`, elle ne s'exécute jamais — c'est l'efficacité centrale de GraphQL.

**🎯 Résultat attendu :** `schema.execute_sync("{ users { name } }")` renvoie la liste des utilisateurs. `schema.execute_sync("{ posts { title author { name } } }")` renvoie les publications avec les noms de leurs auteurs.

**🩹 Si ça ne marche pas :** Si `resolve_posts` renvoie `author=None` même quand le client le demande, le résolveur `PostType.author` n'est pas attaché. Si `schema.execute_sync` lève une erreur de champ manquant, la chaîne de requête ne correspond pas aux noms de champs du schéma.

### 2.2 Ajouter une requête avec des arguments

```python
# gql/schema.py (continued)
# The resolve_user resolver already takes an id argument.
# Strawberry infers the GraphQL argument from the Python function signature.
```

Le paramètre `id: int` sur `resolve_user` devient automatiquement un argument GraphQL requis `user(id: Int!)`. Aucune configuration supplémentaire nécessaire — Strawberry lit la signature de la fonction.

**🎯 Résultat attendu :** `schema.execute_sync("{ user(id: 1) { name email } }")` renvoie les données d'Alice. `schema.execute_sync("{ user(id: 999) { name } }")` renvoie `null` pour l'utilisateur.

**🩹 Si ça ne marche pas :** Si l'argument n'est pas reconnu dans le schéma, le nom du paramètre de la fonction ou l'annotation de type ne correspond pas à ce que Strawberry attend.

### 2.3 Vérifier les résolveurs

**✅ Liste de vérification**

- ✅ `schema.execute_sync("{ users { name } }")` renvoie les trois utilisateurs.
- ✅ `schema.execute_sync("{ user(id: 1) { name } }")` renvoie Alice.
- ✅ `schema.execute_sync("{ posts { title } }")` renvoie toutes les publications.
- ✅ Seuls les champs demandés sont renvoyés — pas de sur-chargement.

**🤔 Question(s) socratique(s)**

- Si un client demande `posts { author { email } }`, le résolveur `resolve_posts` s'exécute d'abord (renvoyant toutes les publications avec `author=None`), puis `resolve_author` s'exécute pour chaque publication. C'est trois appels séparés à `USERS.get`. Comment DataLoader regrouperait-il cela en un seul appel ?
- Que se passe-t-il si `resolve_user` renvoie `None` pour un ID inconnu ? GraphQL renvoie-t-il `null` dans la réponse, ou une erreur ? En quoi cela diffère-t-il d'un 404 REST ?

## Étape 3 : Implémenter DataLoader pour prévenir le problème N+1

Le problème N+1 : récupérer une liste de 100 publications puis résoudre l'auteur de chaque publication individuellement signifie 101 requêtes en base de données (1 pour les publications + 100 pour les auteurs). DataLoader résout cela en collectant tous les ID d'auteurs d'un cycle de requête et en les groupant en une seule recherche.

### 3.1 Construire le DataLoader

**👟 Indice de départ :** Crée `gql/dataloaders.py` avec un `UserLoader` qui regroupe les recherches d'utilisateurs par ID.

```python
# gql/dataloaders.py
from asyncio import gather
from gql.store import USERS, User

class DataLoader:
    """A simplified DataLoader that batches and caches lookups per request."""

    def __init__(self, batch_fn):
        self.batch_fn = batch_fn
        self.cache: dict = {}
        self.pending: dict[int, "Future"] = {}

    async def load(self, key: int):
        if key in self.cache:
            return self.cache[key]
        # In a real DataLoader, you'd collect keys and batch at the end of the tick.
        # Here we call batch_fn directly for simplicity.
        result = await self.batch_fn([key])
        self.cache[key] = result[0]
        return result[0]

class UserLoader:
    def __init__(self):
        self.loader = DataLoader(self._batch_load)

    async def _batch_load(self, ids: list[int]) -> list[User]:
        """Batch load users by IDs — one call for all IDs."""
        print(f"  [DataLoader] Batch loading users: {ids}")
        return [USERS.get(uid) for uid in ids]

    async def load(self, user_id: int) -> User | None:
        return await self.loader.load(user_id)
```

La vraie magie est dans `_batch_load` : au lieu d'appeler `USERS.get` une fois par publication, DataLoader collecte tous les ID d'utilisateurs d'un cycle de requête et appelle `_batch_load` une fois avec tous. L'instruction `print` prouve le regroupement — tu devrais voir une seule ligne de log avec tous les ID, pas une par publication. En production, ce motif DataLoader (popularisé par la bibliothèque `dataloader` de Facebook pour JavaScript) réduit les allers-retours en base de données de N+1 à 2.

**🎯 Résultat attendu :** `await loader.load(1)` renvoie `USERS[1]` et imprime une seule ligne de log de regroupement. Charger les utilisateurs 1, 2, 3 en séquence imprime une seule ligne de log avec `[1, 2, 3]`.

**🩹 Si ça ne marche pas :** Si tu vois plusieurs lignes de log (une par appel de chargement), le regroupement ne fonctionne pas — vérifie que le DataLoader collecte les ID avant d'appeler `batch_fn`.

### 3.2 Intégrer DataLoader dans les résolveurs

```python
# gql/schema.py (continued, replace resolve_author)
from gql.dataloaders import UserLoader

# Create a loader per request (in practice, use context)
_user_loader = UserLoader()

async def resolve_author_with_loader(post: PostType, info) -> UserType | None:
    user = await _user_loader.load(post.author_id)
    return UserType(id=user.id, name=user.name, email=user.email) if user else None

PostType.author = resolve_author_with_loader
```

**🎯 Résultat attendu :** Interroger `posts { author { name } }` imprime une seule ligne de log de regroupement (pas trois), confirmant que DataLoader a fusionné les recherches.

**🩹 Si ça ne marche pas :** Si le résolveur est encore synchrone, ajoute `async` et `await`. Si le log montre plusieurs appels de regroupement, le loader n'est pas partagé entre les résolveurs.

### 3.3 Vérifier le regroupement DataLoader

**✅ Liste de vérification**

- ✅ Charger plusieurs utilisateurs imprime une seule ligne de log de regroupement, pas une par utilisateur.
- ✅ Chaque utilisateur chargé correspond aux données attendues du stockage.
- ✅ Le DataLoader met en cache les résultats — charger deux fois le même ID ne re-regroupe pas.

**🤔 Question(s) socratique(s)**

- Dans une vraie application, `_batch_load` frapperait une base de données. Si deux requêtes arrivent simultanément, elles partageraient le même `_user_loader` et mélangeraient leurs ID. Comment limiterais-tu le loader à une seule requête ?
- DataLoader met en cache par clé au sein d'une requête. Que se passe-t-il si l'utilisateur 1 change de nom entre deux requêtes dans la même session ? Les données obsolètes sont-elles un problème, et comment le corrigerais-tu ?

## Étape 4 : Ajouter des abonnements en temps réel

Les abonnements poussent des mises à jour aux clients quand les données changent — contrairement aux requêtes (tire une fois) ou aux mutations (pousse une fois), les abonnements maintiennent une connexion ouverte. Cette étape ajoute un abonnement qui notifie les clients quand une nouvelle publication est publiée.

### 4.1 Définir un abonnement

**👟 Indice de départ :** Crée un abonnement `post_published` qui produit les nouvelles publications à mesure qu'elles sont créées.

```python
# gql/schema.py (continued)
import asyncio
from typing import AsyncGenerator
import strawberry
from gql.types import PostType

@strawberry.type
class Subscription:
    @strawberry.field
    async def post_published(self) -> AsyncGenerator[PostType, None]:
        """Yields new posts as they are published."""
        # In production, this would read from a message queue or WebSocket.
        # For demo, yield a fake post after a short delay.
        await asyncio.sleep(1)
        yield PostType(id=999, title="Live Post", body="This appeared in real time!", published=True, author=None)
```

Les abonnements utilisent la syntaxe `generator asynchrone` de Python — `yield` envoie chaque mise à jour au client. En production, tu remplacerais le `asyncio.sleep` par une vraie source d'événements (pub/sub Redis, un déclencheur de base de données ou une file de messages). Strawberry gère le protocole WebSocket qui garde la connexion ouverte et délivre chaque valeur produite.

**🎯 Résultat attendu :** `schema.execute_sync` n'est pas utilisé pour les abonnements — à la place, l'abonnement s'exécute de manière asynchrone et produit la publication après 1 seconde.

**🩹 Si ça ne marche pas :** Si l'abonnement ne produit rien, le `generator asynchrone` n'est pas configuré correctement — vérifie l'annotation de type `AsyncGenerator` et l'instruction `yield`.

### 4.2 Câbler l'abonnement dans le schéma

```python
# gql/schema.py (update the schema creation)
schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)
```

**🎯 Résultat attendu :** `schema.as_str()` inclut `type Subscription { postPublished: PostType! }` dans la définition du schéma.

**🩹 Si ça ne marche pas :** Si le type d'abonnement n'apparaît pas dans le schéma, la classe `Subscription` n'est pas passée à `strawberry.Schema`.

### 4.3 Vérifier les abonnements

**✅ Liste de vérification**

- ✅ Le schéma inclut un type `Subscription` avec le champ `postPublished`.
- ✅ Un generator asynchrone produit des publications quand l'abonnement s'exécute.
- ✅ L'objet `schema` inclut les abonnements quand il est imprimé.

**🤔 Question(s) socratique(s)**

- Les abonnements maintiennent une connexion WebSocket ouverte. Que devient cette connexion si le serveur redémarre ? Comment un client détecterait-il et récupérerait-il d'un abonnement interrompu ?
- Pour une application de chat, tu aurais besoin d'abonnements pour les nouveaux messages, les indicateurs de frappe et la présence. Comment combinerais-tu plusieurs types d'abonnements sans créer un WebSocket séparé pour chacun ?

## Étape 5 : Exécuter le serveur et le tester

Tout se rassemble dans le serveur : le schéma, les résolveurs, le DataLoader et l'abonnement. Strawberry embarque un GraphQL Playground intégré pour les tests interactifs.

### 5.1 Écrire le point d'entrée du serveur

**👟 Indice de départ :** Crée `gql/server.py` qui exécute le serveur Strawberry avec le playground activé.

```python
# gql/server.py
import uvicorn
import strawberry
from gql.types import UserType, PostType, Query, Mutation
from gql.store import USERS, POSTS

def resolve_users(root, info):
    return [UserType(id=u.id, name=u.name, email=u.email) for u in USERS.values()]

def resolve_user(root, info, id: int):
    u = USERS.get(id)
    return UserType(id=u.id, name=u.name, email=u.email) if u else None

def resolve_posts(root, info, author_id: int | None = None):
    posts = POSTS.values()
    if author_id is not None:
        posts = [p for p in posts if p.author_id == author_id]
    return [
        PostType(id=p.id, title=p.title, body=p.body, published=p.published, author=None)
        for p in posts
    ]

def resolve_author(post, info):
    u = USERS.get(post.author_id)
    return UserType(id=u.id, name=u.name, email=u.email) if u else None

Query.users = resolve_users
Query.user = resolve_user
Query.posts = resolve_posts
PostType.author = resolve_author

schema = strawberry.Schema(query=Query, mutation=Mutation)

if __name__ == "__main__":
    print("Starting GraphQL server at http://localhost:8000/graphql")
    uvicorn.run("gql.server:app", host="0.0.0.0", port=8000, reload=True)
```

L'intégration de Strawberry avec ASGI signifie que tu peux l'exécuter directement avec `uvicorn`. Le drapeau `reload=True` surveille les changements de fichiers pendant le développement. Le GraphQL Playground est disponible à `http://localhost:8000/graphql` dans ton navigateur — il fournit l'auto-complétion, la documentation du schéma et un historique de tes requêtes.

**🎯 Résultat attendu :** Exécuter `uv run python -m gql.server` démarre un serveur à `http://localhost:8000/graphql`. Ouvrir cette URL dans un navigateur montre le GraphQL Playground.

**🩹 Si ça ne marche pas :** Si le port 8000 est déjà utilisé, change le numéro de port. Si le playground ne charge pas, vérifie que `strawberry[fastapi]` ou la bonne intégration est installée.

### 5.2 Tester avec curl

```bash
# Test a query
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ users { name email } }"}'

# Test with author resolution
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ posts { title author { name } } }"}'
```

Les tests `curl` confirment que le serveur fonctionne en dehors du navigateur — utiles pour le scription, la CI et le débogage. La réponse est un objet JSON avec une clé `data` contenant les résultats de la requête.

**🎯 Résultat attendu :** Le premier curl renvoie `{"data": {"users": [{"name": "Alice", ...}, ...]}}`. Le second renvoie les publications avec les noms d'auteurs résolus.

**🩹 Si ça ne marche pas :** Si `curl` renvoie une erreur de connexion, le serveur ne tourne pas. Si la réponse a une clé `errors`, la chaîne de requête ne correspond pas au schéma.

### 5.3 Vérifier le serveur

**✅ Liste de vérification**

- ✅ `uv run python -m gql.server` démarre un serveur à `http://localhost:8000/graphql`.
- ✅ Le GraphQL Playground se charge dans un navigateur avec auto-complétion et documentation du schéma.
- ✅ Les requêtes `curl` renvoient des réponses JSON correctes avec les champs demandés.

**🤔 Question(s) socratique(s)**

- L'introspection GraphQL permet aux clients de découvrir tout le schéma en interrogeant `__schema`. En production, c'est un risque de sécurité — que ferais-tu pour désactiver l'introspection tout en gardant l'API fonctionnelle ?
- Si tu ajoutais une mutation `createPost`, comment déclencherais-tu l'abonnement `post_published` pour que tous les clients connectés voient la nouvelle publication apparaître en temps réel ?

## ⚠️ Pièges courants

- **Le problème de requêtes N+1.** Sans DataLoader, la résolution de l'auteur de chaque publication est un appel séparé en base de données. Pour une page montrant 50 publications, c'est 51 requêtes. Utilise toujours DataLoader pour la résolution des relations en GraphQL — c'est le plus gros gain de performance.
- **Sur-chargement dans les résolveurs.** Tout l'intérêt de GraphQL est que les clients ne demandent que ce dont ils ont besoin. Si ton résolveur charge toute la table de la base de données et la convertit entièrement en types Strawberry, tu as perdu le gain d'efficacité. Filtre et pagine dans le résolveur.
- **Abonnements qui gardent les connexions ouvertes.** Chaque abonnement maintient une connexion WebSocket. Si tu as des milliers d'abonnés simultanés, tu as besoin de passer à l'échelle horizontalement (pub/sub Redis ou un courtier de messages) — un seul serveur ne peut pas tenir efficacement des milliers de connexions persistantes.
- **Oublier que les erreurs GraphQL n'arrêtent pas l'exécution.** Un résolveur de champ qui lève une exception renvoie `null` pour ce champ plus une erreur dans le tableau `errors` — le reste de la requête renvoie quand même les données. C'est différent de REST, où un 500 tue toute la réponse.
- **Introspection en production.** L'introspection GraphQL permet à quiconque de découvrir tout le schéma de ton API. En production, désactive-la sauf si tu construis une API publique.

## Ce que tu viens de construire

Un serveur d'API GraphQL complet : un schéma avec des types et des requêtes, des résolveurs qui récupèrent les données depuis un stockage en mémoire, un regroupement DataLoader pour prévenir les requêtes N+1, des abonnements en temps réel pour les mises à jour en direct et un playground interactif pour les tests. L'architecture — conception schéma-en-premier, un résolveur par champ, DataLoader pour le regroupement — est le même modèle utilisé par les serveurs GraphQL de production chez des entreprises comme GitHub, Shopify et Airbnb.

:::tip[Exécute une version plus complète sans configuration locale]
[`examples/graphql-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/graphql-server) dans le dépôt du cours a une version plus riche avec des mutations, un backend de base de données réel et le DataLoader câblé de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et lance-le depuis là.
:::

## Où aller ensuite

- Ajoute une mutation `createPost` qui accepte `title`, `body` et `authorId`, stocke la nouvelle publication et déclenche l'abonnement `post_published`.
- Implémente la pagination avec une pagination de style relay basée sur curseur (arguments `first`, `after`) pour que les grands ensembles de résultats se chargent par morceaux.
- Ajoute un middleware d'authentification qui vérifie un jeton Bearer sur chaque requête et expose l'utilisateur courant aux résolveurs via `info.context`.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓