---
title: "Constructeur d'API REST"
description: "Échafaudez une API REST prête pour la production à partir d'un schéma YAML — générez automatiquement des routes FastAPI, l'authentification JWT, la validation Pydantic et la documentation OpenAPI."
difficulty: "advanced"
estimatedMinutes: 120
tags: ["fastapi", "pydantic", "rest-api", "jwt", "openapi"]
learningObjectives:
  - Parser des schémas YAML et construire des dataclasses Python à partir d'eux
  - Générer dynamiquement des routes FastAPI à partir de définitions de ressources
  - Implémenter l'authentification JWT avec un contrôle d'accès basé sur les rôles
  - Tester des points de terminaison d'API avec httpx et le TestClient de FastAPI
prerequisites:
  - "Bases de Python et POO intermédiaire"
  - "Connaissance des méthodes HTTP et des concepts REST"
  - "Compréhension des formats JSON et YAML"
---

# 🛠️ 🚀 Construire un Constructeur d'API REST

La plupart des API du monde réel suivent le même motif : des ressources avec des points de terminaison CRUD, l'authentification, la validation et la documentation. Écrire chacune à la main devient vite fastidieux — ce projet construit un générateur de code qui lit un schéma YAML et produit une application FastAPI complète avec authentification JWT, validation Pydantic et documentation OpenAPI auto-générée, pour que tu définisses ton API une fois en YAML et obtiennes un serveur fonctionnel.

Cela suppose les bases de Python, la POO intermédiaire, et assez de connaissances HTTP pour savoir ce que fait une requête POST — rien de l'Analyse de Données n'est requis. C'est optionnel et non noté ; vois [Projets du monde réel](/fr/projets) pour la liste complète, et grandissante.

## 🎯 Ce que tu vas faire

1. Définir des ressources API dans un schéma YAML et les parser en dataclasses Python.
2. Générer des modèles Pydantic depuis le schéma pour la validation automatique des requêtes.
3. Implémenter l'authentification JWT avec `python-jose` et `passlib`.
4. Construire des routes CRUD dynamiquement avec des vérifications de permissions basées sur les rôles.
5. Tester toute l'API de bout en bout avec `httpx` et le `TestClient` de FastAPI.

## Où exécuter ceci

**En local avec `uv`** est le seul chemin pratique — FastAPI a besoin d'un vrai serveur (uvicorn) pour tourner, ce qui signifie un vrai terminal et un vrai système de fichiers. Aucun terrain de jeu basé sur le navigateur ne peut héberger un serveur ASGI en cours d'exécution.

**GitHub Codespaces** fonctionne bien : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés) et exécute les mêmes commandes `uv` depuis un terminal.

**Google Colab** peut tester des points de terminaison individuels avec `nest_asyncio`, mais c'est un contournement, pas une approche naturelle — aucun serveur persistant, aucun vrai système de fichiers pour ton projet. Utilise-le pour essayer des choses, pas pour construire.

- **Exécutez-le dans le navigateur.** Un compagnon notebook interactif est prêt — ouvrez-le dans Colab, Kaggle ou Binder et suivez les étapes dans l'ordre.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rest-api-builder/notebook.fr.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rest-api-builder/notebook.fr.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frest-api-builder%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant d'écrire une ligne de l'API elle-même : un vrai Python, les bons paquets, et un dossier de projet fonctionnel.

### Installe `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis installer pip, puis installer un outil d'environnement virtuel, puis installer les paquets » — il peut installer et gérer lui-même les versions de Python, en parallèle des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme qu'il est installé :

```bash
uv --version
```

### Configure le projet

```bash
uv init rest-api-builder
cd rest-api-builder
uv add fastapi uvicorn pyyaml pydantic python-jose[cryptography] passlib[bcrypt] httpx
```

`fastapi` est le framework web ; `uvicorn` est le serveur ASGI qui l'exécute ; `pyyaml` parse ton schéma ; `pydantic` gère la validation requête/réponse ; `python-jose` et `passlib` gèrent les jetons JWT et le hachage des mots de passe ; `httpx` est le client HTTP asynchrone que tu utiliseras pour tester les points de terminaison.

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `rest-api-builder/` existe avec un `pyproject.toml`, et tous les six paquets sont installés.
- ✅ Tu peux exécuter `uv run python -c "import fastapi; print(fastapi.__version__)"` sans erreurs.

## Étape 1 : Parse un schéma YAML en dataclasses Python

Chaque API commence par une forme : quelles ressources existent, quels champs chacune a, et qui peut faire quoi avec elles. Un schéma YAML capture cette forme dans une forme lisible et modifiable par l'humain — et le parser en dataclasses Python est le pont entre une config en texte brut et le code réel qui génère des routes.

### 1.1 Définis et parse le schéma

```python
import yaml
from dataclasses import dataclass, field

SCHEMA_YAML = """
resources:
  user:
    fields:
      name: { type: string, required: true }
      email: { type: string, required: true, unique: true }
      role: { type: string, enum: [admin, editor, viewer], default: viewer }
    permissions:
      create: [admin]
      read: [admin, editor, viewer]
      update: [admin, editor]
      delete: [admin]
  post:
    fields:
      title: { type: string, required: true }
      content: { type: string, required: true }
      author_id: { type: integer, required: true }
    permissions:
      create: [admin, editor]
      read: [admin, editor, viewer]
      update: [admin, editor]
      delete: [admin]
"""

@dataclass
class FieldDef:
    name: str
    field_type: str
    required: bool = False
    unique: bool = False
    default: object = None
    enum: list[str] | None = None

@dataclass
class ResourceDef:
    name: str
    fields: list[FieldDef] = field(default_factory=list)
    permissions: dict[str, list[str]] = field(default_factory=dict)

def parse_schema(yaml_str: str) -> dict[str, ResourceDef]:
    data = yaml.safe_load(yaml_str)
    resources = {}
    for res_name, res_config in data["resources"].items():
        fields = [
            FieldDef(
                name=fname,
                field_type=fdef["type"],
                required=fdef.get("required", False),
                unique=fdef.get("unique", False),
                default=fdef.get("default"),
                enum=fdef.get("enum"),
            )
            for fname, fdef in res_config.get("fields", {}).items()
        ]
        resources[res_name] = ResourceDef(
            name=res_name,
            fields=fields,
            permissions=res_config.get("permissions", {}),
        )
    return resources

resources = parse_schema(SCHEMA_YAML)
for name, res in resources.items():
    print(f"Resource: {name}")
    for f in res.fields:
        print(f"  - {f.name}: {f.field_type} (required={f.required})")
```

**👟 Indice de départ :** Colle ce bloc tel quel — la chaîne `SCHEMA_YAML` définit deux ressources (`user` et `post`) avec des champs, des types et des règles de permissions. `yaml.safe_load` parse le YAML en un dict simple, et les deux dataclasses (`FieldDef`, `ResourceDef`) te donnent un accès typé à chaque pièce. La boucle en bas imprime ce qui a été parsé pour que tu puisses vérifier qu'il correspond au YAML.

**🎯 Résultat attendu :**
```
Resource: user
  - name: string (required=True)
  - email: string (required=True)
  - role: string (required=False)
Resource: post
  - title: string (required=True)
  - content: string (required=True)
  - author_id: integer (required=True)
```

**🩹 Si ça ne marche pas :** Un `yaml.YAMLError` signifie que la chaîne YAML a un problème de syntaxe — vérifie l'indentation et les deux-points. Un `KeyError: 'resources'` signifie que le YAML s'est chargé mais n'avait pas la clé de niveau supérieur attendue par ton code — vérifie que la clé extérieure `resources:` est présente. Si des champs manquent, le défaut `get("fields", {})` est vide, donc la structure YAML compte.

### 1.2 Vérifie l'analyse du schéma

**✅ Liste de vérification**

- ✅ `parse_schema(SCHEMA_YAML)` retourne un dict avec deux clés : `"user"` et `"post"`.
- ✅ Chaque `ResourceDef` a le bon nombre d'entrées `FieldDef` (3 pour user, 3 pour post).
- ✅ Le dict de permissions mappe chaque action (`"create"`, `"read"`, etc.) à une liste de rôles.

**🤔 Question(s) socratique(s)**

- Que se passerait-il si tu ajoutais une troisième ressource au YAML (disons `comment`) et relançais `parse_schema` — un code extérieur à la chaîne YAML elle-même aurait-il besoin de changer ? Pourquoi est-ce souhaitable ?
- Le YAML utilise `unique: true` sur `email`. Ton `FieldDef` stocke cela comme un booléen, mais rien dans le code n'impose encore l'unicité. Où dans le pipeline API ajouterais-tu cette vérification, et pourquoi est-il mieux de l'attraper là plutôt qu'au niveau de la base de données ?

## Étape 2 : Génère des modèles Pydantic depuis le schéma

Les modèles Pydantic sont ce que FastAPI utilise pour valider les requêtes entrantes et les réponses sortantes — ils transforment du JSON flou en objets Python typés et vérifiés. Les construire dynamiquement depuis ton schéma signifie qu'ajouter une nouvelle ressource au YAML génère automatiquement la bonne validation sans toucher au code Python.

### 2.1 Construis le générateur de modèles

```python
from pydantic import BaseModel

TYPE_MAP = {"string": str, "integer": int, "boolean": bool, "float": float}

def generate_pydantic_models(resources: dict[str, ResourceDef]) -> dict[str, type[BaseModel]]:
    models = {}
    for res_name, res in resources.items():
        fields = {}
        for f in res.fields:
            ftype = TYPE_MAP.get(f.field_type, str)
            if f.default is not None:
                fields[f.name] = (ftype, f.default)
            elif f.required:
                fields[f.name] = (ftype, ...)
            else:
                fields[f.name] = (ftype | None, None)
        models[res_name] = type(
            f"Create{res_name.title()}", (BaseModel,), {"__annotations__": fields}
        )
    return models

models = generate_pydantic_models(resources)
for name, model in models.items():
    print(f"{name}: {model.__name__} fields = {list(model.model_fields.keys())}")
```

**👟 Indice de départ :** L'appel `type(...)` crée une classe de modèle Pydantic dynamiquement — `type("CreateUser", (BaseModel,), {"__annotations__": {...}})` est exactement ce que fait `class CreateUser(BaseModel): ...`, mais le corps de la classe vient du schéma au lieu d'un code écrit à la main. Les champs requis obtiennent `...` (pointillés) comme valeur par défaut, ce que Pydantic traite comme « ce champ est obligatoire ».

**🎯 Résultat attendu :**
```
user: CreateUser fields = ['name', 'email', 'role']
post: CreatePost fields = ['title', 'content', 'author_id']
```

**🩹 Si ça ne marche pas :** Si `CreateUser` manque des champs, la recherche `TYPE_MAP` a peut-être silencieusement retombé sur `str` pour un type non reconnu. Vérifie les valeurs `type:` de ton YAML contre la carte. Si FastAPI se plaint de la validation plus tard, la ramification `(ftype, ...)` contre `(ftype | None, None)` est la partie à inspecter — un champ requis sans `...` devient optionnel par accident.

### 2.2 Vérifie la génération de modèle

**✅ Liste de vérification**

- ✅ `generate_pydantic_models(resources)` retourne deux classes de modèles : `CreateUser` et `CreatePost`.
- ✅ Chaque modèle a exactement les champs définis dans le schéma YAML.
- ✅ Les champs requis lèvent une `ValidationError` s'ils sont omis ; les champs optionnels ont pour défaut `None`.

**🤔 Question(s) socratique(s)**

- Qu'est-ce qui casserait si tu ajoutais un champ avec `type: datetime` au YAML ? Comment étendrais-tu `TYPE_MAP` pour le gérer ?
- Le `BaseModel` de Pydantic valide à l'instanciation. Pourquoi est-ce mieux que de valider à l'intérieur de chaque gestionnaire de route, où tu appellerais `model(**payload)` manuellement ?

## Étape 3 : Implémente l'authentification JWT

L'authentification sépare « n'importe qui peut utiliser ceci » de « seuls les utilisateurs connectés peuvent utiliser ceci ». Les jetons JWT sont la norme pour l'authentification d'API sans état : le serveur signe un jeton avec une clé secrète, le client le renvoie à chaque requête, et le serveur le vérifie sans recherche en base de données.

### 3.1 Configure la création et la vérification de jeton

```python
import secrets
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

SECRET_KEY = secrets.token_hex(32)
ALGORITHM = "HS256"
security = HTTPBearer()

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=30)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        return jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(401, "Invalid token")

print(f"SECRET_KEY set (first 8 chars): {SECRET_KEY[:8]}...")
```

**👟 Indice de départ :** `create_token` empaquette un dict (nom d'utilisateur, rôle) dans un JWT signé avec une expiration de 30 minutes. `verify_token` est une dépendance FastAPI — `Depends(security)` signifie que FastAPI lit l'en-tête `Authorization: Bearer <token>` automatiquement et passe la charge utile décodée à toute route qui déclare `user=Depends(verify_token)`.

**🎯 Résultat attendu :** `SECRET_KEY` imprime ses 8 premiers caractères. Créer un jeton et le décoder immédiatement fait un aller-retour sans erreur.

**🩹 Si ça ne marche pas :** Un `jose.JWTError` au décodage signifie que le jeton a été signé avec une clé différente — `secrets.token_hex(32)` génère une nouvelle clé à chaque chargement du module, donc les jetons d'une exécution précédente ne se décoderont pas. Un `403` de FastAPI (pas `401`) signifie que l'en-tête `Authorization` manque entièrement — le client n'envoie aucun jeton.

### 3.2 Vérifie l'authentification

**✅ Liste de vérification**

- ✅ `create_token({"sub": "alice", "role": "admin"})` retourne une chaîne que `verify_token` peut décoder de nouveau en le même dict.
- ✅ Un jeton signé avec une `SECRET_KEY` différente lève `HTTPException(401)`.
- ✅ Tu peux expliquer pourquoi `secrets.token_hex(32)` est généré au chargement du module, pas à l'intérieur de `create_token`.

**🤔 Question(s) socratique(s)**

- Les jetons JWT portent leur expiration dans le jeton lui-même (revendication `exp`). Que se passe-t-il si le jeton d'un utilisateur expire à mi-requête ? Est-ce un problème, et comment une vraie app gérerait-elle cela ?
- Ce projet ne stocke aucun mot de passe d'utilisateur — `verify_token` vérifie la signature du jeton, pas une base de données. Que devrais-tu ajouter pour vouloir aussi supporter une connexion par mot de passe ?

## Étape 4 : Construis des routes CRUD avec accès basé sur les rôles

Le cœur de l'API : générer dynamiquement des points de terminaison POST, GET et DELETE pour chaque ressource du schéma, avec des vérifications de permissions qui empêchent un spectateur de créer des posts ou un non-admin de supprimer des utilisateurs.

### 4.1 Crée l'app et la route de connexion

```python
from fastapi import FastAPI

db: dict[str, list[dict]] = {"user": [], "post": []}
id_counter: dict[str, int] = {"user": 0, "post": 0}

app = FastAPI(title="Auto-Generated API", version="1.0.0")

@app.post("/login")
def login(username: str, password: str):
    if username == "admin" and password == "secret":
        return {"access_token": create_token({"sub": username, "role": "admin"})}
    raise HTTPException(401, "Invalid credentials")
```

**👟 Indice de départ :** La route de connexion est codée en dur pour un seul utilisateur à des fins de démo — dans une vraie app, tu hacherais les mots de passe avec `passlib` et vérifierais contre une base de données. Le point clé : `/login` retourne un jeton JWT, que chaque requête suivante envoie dans l'en-tête `Authorization`.

**🎯 Résultat attendu :** `POST /login?username=admin&password=secret` retourne `{"access_token": "eyJ..."}`.

**🩹 Si ça ne marche pas :** Si la connexion retourne `401` pour des identifiants corrects, vérifie l'URL — `username` et `password` sont des paramètres de requête ici, pas un corps JSON. Si le jeton semble tronqué, `secrets.token_hex(32)` génère 64 caractères hexadécimaux ; le JWT lui-même sera beaucoup plus long (en-tête + charge utile + signature).

### 4.2 Génère des routes CRUD depuis le schéma

```python
def generate_crud_routes(resource: ResourceDef) -> None:
    name = resource.name

    @app.post(f"/{name}", status_code=201)
    def create_item(payload: dict, user=Depends(verify_token)):
        if user["role"] not in resource.permissions.get("create", []):
            raise HTTPException(403, "Insufficient permissions")
        id_counter[name] += 1
        item = {"id": id_counter[name], **payload}
        db[name].append(item)
        return item

    @app.get(f"/{name}")
    def list_items(user=Depends(verify_token)):
        return db[name]

    @app.get(f"/{name}/{{item_id}}")
    def get_item(item_id: int, user=Depends(verify_token)):
        for item in db[name]:
            if item["id"] == item_id:
                return item
        raise HTTPException(404, f"{name.title()} not found")

    @app.delete(f"/{name}/{{item_id}}")
    def delete_item(item_id: int, user=Depends(verify_token)):
        if user["role"] not in resource.permissions.get("delete", []):
            raise HTTPException(403, "Insufficient permissions")
        for i, item in enumerate(db[name]):
            if item["id"] == item_id:
                db[name].pop(i)
                return {"deleted": True}
        raise HTTPException(404, f"{name.title()} not found")

for res in resources.values():
    generate_crud_routes(res)
```

**👟 Indice de départ :** `generate_crud_routes` est une fonction qui *définit et enregistre* des routes FastAPI — `@app.post(f"/{name}")` est appelé à l'intérieur de la fonction, pas au niveau supérieur. C'est la partie de génération dynamique : une boucle sur `resources.values()` crée toutes les routes POST/GET/DELETE pour `user` et `post`. Chaque route déclare `user=Depends(verify_token)` pour que FastAPI exécute la vérification d'authentification avant d'exécuter le corps de la route.

**🎯 Résultat attendu :** `POST /user` crée un utilisateur (avec un jeton), `GET /user` liste tous les utilisateurs, `DELETE /user/1` supprime l'utilisateur avec l'id 1. Une requête sans jeton valide obtient un `401`.

**🩹 Si ça ne marche pas :** Un `405 Method Not Allowed` signifie que le chemin de route correspond mais pas la méthode HTTP — vérifie si tu envoies un GET à un point de terminaison à POST uniquement. Un `403 Insufficient permissions` signifie que le champ `role` du jeton n'est pas dans la liste de permissions de la ressource — vérifie la section `permissions` du YAML et quel rôle porte ton jeton. Si le dict `db` est vide entre les requêtes, tu exécutes le serveur en dehors du processus de ce script — `db` est en mémoire et se réinitialise quand le processus redémarre.

### 4.3 Vérifie les routes CRUD

**✅ Liste de vérification**

- ✅ `POST /user` avec un jeton admin valide retourne un utilisateur avec un `id` auto-incrémenté.
- ✅ `GET /user` liste tous les utilisateurs créés.
- ✅ `DELETE /user/1` avec un jeton admin retourne `{"deleted": true}`.
- ✅ Un jeton de rôle spectateur frappant `POST /user` obtient un `403 Insufficient permissions`.

**🤔 Question(s) socratique(s)**

- Le dict `db` est en mémoire — qu'arrive-t-il à tes données quand tu redémarres le serveur ? Par quoi l'échangerais-tu dans une vraie application ?
- Pourquoi `generate_crud_routes` prend-elle un objet `ResourceDef` plutôt que juste une chaîne de nom de ressource ? Quelle information manquerait si elle n'avait que le nom ?

## Étape 5 : Teste l'API de bout en bout

Le `TestClient` de FastAPI te permet de frapper chaque point de terminaison sans démarrer un vrai serveur — il exécute l'app dans le processus et retourne des objets de réponse de style `httpx`. C'est la vérification « est-ce que ça marche réellement ? ».

### 5.1 Exécute la séquence de test complète

```python
from fastapi.testclient import TestClient

client = TestClient(app)

# Connexion
resp = client.post("/login?username=admin&password=secret")
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Créer un utilisateur
resp = client.post(
    "/user",
    json={"name": "Alice", "email": "alice@example.com", "role": "admin"},
    headers=headers,
)
user = resp.json()
print(f"Created user: {user}")

# Lister les utilisateurs
resp = client.get("/user", headers=headers)
print(f"Users: {resp.json()}")

# Créer un post
resp = client.post(
    "/post",
    json={"title": "Hello World", "content": "My first post", "author_id": user["id"]},
    headers=headers,
)
post = resp.json()
print(f"Created post: {post}")

# Tester l'accès non autorisé
resp = client.get("/user", headers={"Authorization": "Bearer bad_token"})
print(f"Unauthorized: {resp.status_code}")
```

**👟 Indice de départ :** `TestClient(app)` enveloppe toute l'app FastAPI — tu peux faire un `POST` à `/login`, attraper le jeton, puis frapper chaque autre point de terminaison avec ce jeton dans les en-têtes. Exécute cela comme un script unique : la connexion a lieu d'abord, puis chaque test se construit sur la sortie du précédent.

**🎯 Résultat attendu :**
```
Created user: {'id': 1, 'name': 'Alice', 'email': 'alice@example.com', 'role': 'admin'}
Users: [{'id': 1, 'name': 'Alice', 'email': 'alice@example.com', 'role': 'admin'}]
Created post: {'id': 1, 'title': 'Hello World', 'content': 'My first post', 'author_id': 1}
Unauthorized: 401
```

**🩹 Si ça ne marche pas :** Un `422 Unprocessable Entity` signifie que la validation automatique de FastAPI a rejeté le corps de la requête — vérifie que les clés JSON correspondent exactement aux champs du modèle Pydantic. Un `401` aux étapes de création/listage signifie que le jeton n'a pas été passé correctement — vérifie le format `Authorization: Bearer <token>`, pas juste `Authorization: <token>`. Si `Users` retourne `[]` au lieu de l'utilisateur créé, le dict `db` n'a pas été partagé entre les routes de connexion et de création — confirme qu'elles sont toutes dans le même fichier de script.

### 5.2 Vérifie le bout en bout

**✅ Liste de vérification**

- ✅ La séquence complète s'exécute sans erreurs : connexion, création d'utilisateur, listage des utilisateurs, création de post, test d'accès non autorisé.
- ✅ La requête non autorisée retourne `401`, pas `403` ou `200`.
- ✅ Les éléments créés ont des champs `id` auto-incrémentés commençant à 1.

**🤔 Question(s) socratique(s)**

- Tu as testé avec un jeton admin. Qu'est-ce qui changerait si tu créais un second jeton avec `{"role": "viewer"}` et essayais un `POST /user` — quelle réponse attendrais-tu, et pourquoi tester les deux rôles est-il important ?
- `TestClient` s'exécute dans le processus avec aucun vrai HTTP. Quelle est une chose dans le comportement de ton API que ce test *ne peut pas* attraper et qu'un vrai client `httpx` contre un serveur en cours d'exécution pourrait ?

## ⚠️ Pièges courants

- **`secrets.token_hex(32)` se régénère à chaque chargement de module.** Les jetons signés avec une clé ne se décoderont pas avec la clé de l'exécution suivante — c'est correct pour le développement (cela te force à te reconnecter à chaque fois) mais casserait en production où la clé doit persister. Utilise un secret fixe depuis une variable d'environnement pour tout ce qui dépasse le test local.
- **Le `db` en mémoire perd tout au redémarrage.** Le dict `db` est une commodité pédagogique, pas une solution de stockage. Si tu testes la persistance (par ex. « crée un utilisateur, redémarre le serveur, vérifie qu'il a disparu »), c'est le comportement attendu — pas un bug.
- **`status_code=201` manquant sur les routes POST.** FastAPI a pour défaut `200 OK`. La spec HTTP dit que `201 Created` est correct pour la création de ressource — l'oublier rend les réponses de ton API techniquement fausses et plus dures à tester avec des clients qui vérifient les codes de statut.
- **Paramètres de requête contre corps JSON pour `/login`.** La démo utilise des paramètres de requête (`/login?username=admin&password=secret`) par simplicité, mais les vraies API envoient les identifiants dans un corps JSON. Changer cela exige de modifier la signature de la fonction pour accepter un modèle Pydantic à la place — un exercice utile mais un changement cassant pour la séquence de test.

## Ce que tu viens de construire

Un générateur de code qui transforme un schéma YAML lisible par l'humain en une application FastAPI fonctionnelle — authentifiée par JWT, validée par Pydantic et auto-documentée. Tu n'as pas écrit à la main une seule route ; le schéma a tout piloté. C'est le même motif derrière les vrais générateurs d'API : une forme déclarative, un générateur de code, et une application au moment de l'exécution des règles que tu as déclarées.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/rest-api-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/rest-api-builder) dans le dépôt du cours est une version plus complète du code ci-dessus, avec la documentation OpenAPI activée, le hachage des mots de passe avec `passlib`, et des points de terminaison supplémentaires pour les mises à jour PUT et le filtrage par requête. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute un point de terminaison `PUT /{resource}/{id}` qui valide le corps de la requête contre le schéma de la ressource et retourne l'élément mis à jour — la fonction `generate_crud_routes` est exactement là où cela va.
- Ajoute des paramètres de requête au point de terminaison de liste (`GET /user?role=admin`) pour que les utilisateurs puissent filtrer par n'importe quel champ sans écrire de nouveau code — le schéma sait déjà quels champs existent et leurs types.
- Essaie d'ajouter une troisième ressource au YAML (disons `comment` avec `text`, `author_id` et `post_id`) et regarde l'API grandir sans toucher à aucun Python — c'est le gain de l'approche pilotée par schéma.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README contient un parcours complet, adapté aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, étape par étape. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
