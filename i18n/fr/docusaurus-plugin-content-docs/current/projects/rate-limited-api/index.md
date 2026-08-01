---
id: rate-limited-api
title: "Construis un Service d'API à Débit Limité"
sidebar_label: "Service d'API à Débit Limité"
slug: /projects/rate-limited-api
description: "Passe du terrain de jeu dans le navigateur à du vrai Python : construis un service FastAPI qui enveloppe ton propre jeu de données, avec une authentification par clé API authentique et un limiteur de débit que tu construis de zéro."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construis un Service d'API à Débit Limité

<ProjectPublishedDate projectId="2027-rate-limited-api" />

<ProjectGreeting />

Chaque autre projet de cette section construit un *client* d'une sorte ou d'une autre — un script ou un agent qui appelle l'API de quelqu'un d'autre. Celui-ci inverse ça : c'est toi qui construis l'API. Ce projet met en place un vrai service [FastAPI](https://fastapi.tiangolo.com/) qui enveloppe un jeu de données de quelques centaines de citations et de blagues livré avec le projet, avec les deux choses dont toute vraie API publique a besoin et que les exemples jouets ignorent habituellement — l'authentification par clé API et la limitation de débit — construites à la main, pas importées d'une bibliothèque. Cela suppose du Python de niveau Python 101 ; rien de l'Analyse de Données n'est requis.

C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Installer `uv` et configurer un projet FastAPI local — aucune clé API externe nécessaire, puisque ce projet fournit son propre jeu de données.
2. Emballer un jeu de données et construire des endpoints paginés `list`/`get` par-dessus.
3. Ajouter un filtrage par catégorie et par auteur avec des paramètres de requête.
4. Construire une véritable émission de clés API et une dépendance qui valide une clé sur les endpoints protégés.
5. Implémenter un limiteur de débit à fenêtre glissante de zéro et retourner de vraies réponses `429 Too Many Requests` avec un en-tête `Retry-After` une fois qu'une clé dépasse son budget.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal et recommandé — tout l'intérêt de ce projet, c'est de faire tourner un vrai processus serveur de longue durée et de le frapper avec de vraies requêtes HTTP, exactement comme fonctionne n'importe quelle API de production.

**GitHub Codespaces** fonctionne bien aussi : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt), lance le serveur de la même façon que tu le ferais en local, et redirige le port — Codespaces propose généralement de le faire automatiquement dès que `uvicorn` commence à écouter. Une fois redirigé, tu peux lui faire un `curl` depuis le terminal de ta propre machine, ou ouvrir la page `/docs` de l'URL redirigée dans un navigateur, exactement comme s'il tournait en local.

**Les notebooks sont un ajustement authentiquement bon ici, contrairement à la plupart des autres projets de serveur de longue durée de cette série** — avec une réserve. Une cellule de notebook ne peut pas maintenir ouvert un vrai port d'écoute comme Colab, Kaggle et Binder isolent les réseaux, donc c'est un mauvais choix pour *faire tourner réellement* `uvicorn` et le frapper en vrai HTTP. Mais FastAPI fournit un `TestClient` qui parle à ton objet `app` directement, dans le processus, sans socket ni port du tout — exactement les mêmes routes, codes de statut et en-têtes, juste invoqués comme des appels de fonctions Python plutôt que des requêtes réseau. C'est une démonstration légitimement bonne de la logique de pagination, de filtrage, d'authentification et de limitation de débit, et [`examples/rate-limited-api/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb) fait exactement cela :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frate-limited-api%2Fnotebook.ipynb)

Considère le notebook comme un moyen de *voir* rapidement le comportement de l'API, pas comme un remplaçant pour faire tourner réellement `uvicorn` en local et envoyer de vraies requêtes dessus — les étapes ci-dessous font la vraie chose.

## Configuration

`uv` est un seul outil qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets » — il peut installer et gérer les versions de Python lui-même, en plus des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme que c'est installé :

```bash
uv --version
```

Puis configure un projet et installe FastAPI et un serveur pour le faire tourner :

```bash
uv init rate-limited-api
cd rate-limited-api
uv add fastapi "uvicorn[standard]"
```

Remarque ce qui n'est *pas* là : aucune clé API à demander, aucune inscription gratuite, rien à configurer avant ta première requête. Ce projet fournit son propre jeu de données et émet ses propres clés — tu construis la chose que consomment les autres projets de cette série.

## Étape 1 : Emballer le jeu de données et construire les endpoints de base

Les vraies API servent de vraies données. Crée `quotes_data.py` avec un petit jeu de données écrit à la main — une simple liste Python de dicts suffit ; pas de base de données nécessaire pour l'instant :

```python
# quotes_data.py
_RAW_QUOTES = [
    # (text, author, category)
    ("Programs must be written for people to read, and only incidentally for machines to execute.", "Harold Abelson", "programming"),
    ("The unexamined life is not worth living.", "Socrates", "wisdom"),
    ("Why do programmers prefer dark mode? Because light attracts bugs.", "Anonymous", "humor"),
    # ... a few hundred more, spanning several categories
]

QUOTES = [
    {"id": i, "text": text, "author": author, "category": category}
    for i, (text, author, category) in enumerate(_RAW_QUOTES, start=1)
]

CATEGORIES = sorted({q["category"] for q in QUOTES})
```

Écris le tien — quelques dizaines suffisent pour commencer, vise quelques centaines une fois terminé, répartis sur au moins trois ou quatre catégories. Puis crée `main.py` avec l'application et deux endpoints de lecture :

```python
# main.py
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from quotes_data import QUOTES

app = FastAPI(title="Quotes API")


class QuoteOut(BaseModel):
    id: int
    text: str
    author: str
    category: str


class QuotesPage(BaseModel):
    items: list[QuoteOut]
    total: int
    limit: int
    offset: int


@app.get("/quotes", response_model=QuotesPage)
def list_quotes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> QuotesPage:
    page = QUOTES[offset : offset + limit]
    return QuotesPage(items=[QuoteOut(**q) for q in page], total=len(QUOTES), limit=limit, offset=offset)


@app.get("/quotes/{quote_id}", response_model=QuoteOut)
def get_quote(quote_id: int) -> QuoteOut:
    for quote in QUOTES:
        if quote["id"] == quote_id:
            return QuoteOut(**quote)
    raise HTTPException(status_code=404, detail=f"No quote with id {quote_id}.")
```

Lance-le :

```bash
uv run uvicorn main:app --reload
```

Puis, dans un autre terminal :

```bash
curl "http://127.0.0.1:8000/quotes?limit=3"
curl "http://127.0.0.1:8000/quotes/1"
curl -i "http://127.0.0.1:8000/quotes/99999"   # a real 404
```

La pagination `limit`/`offset` est le même pattern derrière l'endpoint de liste de presque chaque API REST publique — elle plafonne la quantité de données qu'une seule réponse peut retourner (`le=100` ici), et permet à un client de parcourir tout le jeu de données page par page en utilisant `total` pour savoir quand s'arrêter.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run uvicorn main:app --reload` démarre sans erreur.</StepChecklistItem>
<StepChecklistItem>`GET /quotes?limit=3` retourne exactement 3 éléments et un `total` correspondant à la taille de ton jeu de données complet.</StepChecklistItem>
<StepChecklistItem>`GET /quotes/{a-real-id}` retourne cette citation ; `GET /quotes/99999` retourne un vrai `404`, pas un `500` ni un `200` vide.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi plafonner `limit` à 100 (`le=100`) plutôt que laisser un client demander toutes tes citations en une seule réponse ? Que ferait différemment un client avec une connexion lente, ou un client malveillant, s'il n'y avait pas de plafond ?
- `get_quote` parcourt toute la liste pour trouver un id. Avec quelques centaines de citations c'est instantané ; avec quelques millions ça ne le serait pas. Quelle structure de données rendrait la recherche par id rapide quelle que soit la taille du jeu de données ?

## Étape 2 : Ajoute le filtrage

Étends `list_quotes` avec des paramètres de requête optionnels pour la catégorie et l'auteur :

```python
@app.get("/categories", response_model=list[str])
def list_categories() -> list[str]:
    from quotes_data import CATEGORIES
    return CATEGORIES


@app.get("/quotes", response_model=QuotesPage)
def list_quotes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str | None = Query(default=None, description="Filter by exact category."),
    author: str | None = Query(default=None, description="Case-insensitive substring match on author."),
) -> QuotesPage:
    filtered = QUOTES
    if category is not None:
        filtered = [q for q in filtered if q["category"] == category]
    if author is not None:
        needle = author.lower()
        filtered = [q for q in filtered if needle in q["author"].lower()]

    page = filtered[offset : offset + limit]
    return QuotesPage(items=[QuoteOut(**q) for q in page], total=len(filtered), limit=limit, offset=offset)
```

```bash
curl "http://127.0.0.1:8000/quotes?category=science&limit=5"
curl "http://127.0.0.1:8000/quotes?author=sagan"
curl "http://127.0.0.1:8000/categories"
```

`total` dans la réponse reflète le nombre *filtré*, pas tout le jeu de données — cela compte pour un client qui essaie de paginer à travers seulement les citations scientifiques, qui penserait sinon qu'il reste bien plus de pages qu'il n'y en a réellement.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`?category=<a-real-category>` retourne seulement les citations de cette catégorie, et `total` reflète le nombre filtré.</StepChecklistItem>
<StepChecklistItem>`?author=<partial-name>` fait une correspondance insensible à la casse (ex. `sagan` correspond à `Carl Sagan`).</StepChecklistItem>
<StepChecklistItem>Combiner `category` et `author` ensemble réduit encore plus les résultats, pas juste l'un ou l'autre.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Que devrait retourner `GET /quotes?category=nonexistent` — une liste vide avec `total: 0`, ou un `404` ? Lequel as-tu construit, et pourquoi est-ce le choix le plus RESTful pour un endpoint de *collection* par rapport au `GET /quotes/{id}` à élément unique ?
- Si tu ajoutais un second filtre qui a aussi besoin de « l'un de plusieurs valeurs » (ex. plusieurs catégories à la fois), comment étendrais-tu le paramètre de requête pour qu'il accepte une liste ?

## Étape 3 : Émission et validation des clés API

Une vraie API a besoin de savoir qui l'appelle. Ajoute une émission de clés en libre-service et une dépendance qui vérifie une clé sur les routes protégées :

```python
import secrets

from fastapi import Depends, Header

_VALID_KEYS: set[str] = set()


class ApiKeyResponse(BaseModel):
    api_key: str


@app.post("/keys", response_model=ApiKeyResponse)
def issue_api_key() -> ApiKeyResponse:
    new_key = secrets.token_urlsafe(24)
    _VALID_KEYS.add(new_key)
    return ApiKeyResponse(api_key=new_key)


def require_api_key(x_api_key: str | None = Header(default=None)) -> str:
    if x_api_key is None or x_api_key not in _VALID_KEYS:
        raise HTTPException(status_code=401, detail="Missing or invalid API key. Get one from POST /keys.")
    return x_api_key


@app.get("/me")
def whoami(api_key: str = Depends(require_api_key)) -> dict:
    return {"api_key": api_key}
```

`secrets.token_urlsafe` — pas `random`, qui n'est pas cryptographiquement sûr — génère une clé que personne ne peut deviner. `Depends(require_api_key)` est le système d'injection de dépendances de FastAPI : toute route qui prend `api_key: str = Depends(require_api_key)` comme paramètre exécute `require_api_key` d'abord, et ne continue que si elle retourne avec succès au lieu de lever une exception.

```bash
curl -i "http://127.0.0.1:8000/me"                                   # 401, no key
curl -X POST "http://127.0.0.1:8000/keys"                            # {"api_key": "..."}
curl -i -H "X-API-Key: <your-key>" "http://127.0.0.1:8000/me"        # 200
```

:::tip[Ce magasin de clés en mémoire oublie tout au redémarrage, et c'est très bien ici]
`_VALID_KEYS` vit dans un simple `set` Python dans la mémoire de ce processus — redémarre le serveur et chaque clé émise précédemment cesse de fonctionner. Un vrai produit persisterait les clés dans une base de données (et stockerait un *hash* de chaque clé, pas la valeur brute, de la même façon que les mots de passe sont hachés — pour qu'une fuite de la base ne fuite pas des clés utilisables directement). Pour un projet d'apprentissage local, la version en mémoire est honnête et suffisante ; ne sois juste pas surpris quand ta clé cesse de fonctionner après que `--reload` a redémarré le processus.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`GET /me` sans en-tête `X-API-Key` retourne un vrai `401`, avec un corps qui dit comment obtenir une clé.</StepChecklistItem>
<StepChecklistItem>`POST /keys` retourne une nouvelle clé à chaque fois que tu l'appelles.</StepChecklistItem>
<StepChecklistItem>`GET /me` avec une clé valide dans `X-API-Key` retourne `200` ; avec une clé inventée, il retourne toujours `401`.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `require_api_key` lit la clé depuis un en-tête `X-API-Key` personnalisé plutôt qu'un paramètre de requête (`?api_key=...`). Les paramètres de requête finissent couramment dans les journaux d'accès du serveur et l'historique du navigateur. Qu'est-ce que cela suggère sur l'approche la plus sûre pour une valeur secrète ?
- En ce moment, n'importe qui peut appeler `POST /keys` autant de fois qu'il veut, sans aucune limite. Est-ce un problème pour *ce* projet ? Qu'ajouterais-tu si c'était un vrai service public ?

## Étape 4 : Une vraie limitation de débit

C'est le vrai but du projet. Construis un limiteur de débit à fenêtre glissante qui suit les horodatages récents des requêtes de chaque clé et rejette les requêtes une fois qu'une clé dépasse son budget dans une fenêtre :

```python
# rate_limit.py
import time
from collections import defaultdict, deque


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._history: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, now: float | None = None) -> tuple[bool, float]:
        now = time.monotonic() if now is None else now
        history = self._history[key]

        cutoff = now - self.window_seconds
        while history and history[0] <= cutoff:
            history.popleft()

        if len(history) < self.max_requests:
            history.append(now)
            return True, 0.0

        retry_after = history[0] + self.window_seconds - now
        return False, max(retry_after, 0.0)
```

Chaque clé a son propre `deque` d'horodatages, du plus ancien au plus récent. À chaque vérification, les horodatages plus anciens que `window_seconds` sont retirés par la gauche avant de compter ce qui reste — c'est une fenêtre glissante **exacte**, pas une approximation par compartiments qui se réinitialise à une frontière d'horloge fixe. Cette distinction compte : un limiteur à *fenêtre fixe* (disons, « réinitialise le compteur toutes les 10 secondes sur l'horloge ») laisse un client envoyer toute sa quote-part juste à la fin d'une fenêtre et toute sa quote-part de nouveau juste au début de la suivante, atteignant jusqu'à 2x son débit prévu en quelques vraies secondes. Suivre les horodatages réels évite cela.

Branche-le dans une dépendance et utilise-le sur `/me` :

```python
from fastapi import Response

RATE_LIMIT_MAX_REQUESTS = 5
RATE_LIMIT_WINDOW_SECONDS = 10.0
limiter = SlidingWindowRateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS)


def enforce_rate_limit(response: Response, api_key: str = Depends(require_api_key)) -> str:
    allowed, retry_after = limiter.check(api_key, now=time.monotonic())
    if not allowed:
        retry_after_seconds = str(int(retry_after) + 1)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: max {RATE_LIMIT_MAX_REQUESTS} per {int(RATE_LIMIT_WINDOW_SECONDS)}s.",
            headers={"Retry-After": retry_after_seconds},
        )
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX_REQUESTS)
    return api_key


@app.get("/me")
def whoami(api_key: str = Depends(enforce_rate_limit)) -> dict:
    return {"api_key": api_key}
```

Remarque que les en-têtes sont définis de deux façons différentes selon le résultat — ce n'est pas un choix stylistique, c'est requis. Envoie six requêtes en rapide succession avec la même clé :

```bash
KEY=$(curl -s -X POST "http://127.0.0.1:8000/keys" | python3 -c "import sys,json;print(json.load(sys.stdin)['api_key'])")
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code}\n" -H "X-API-Key: $KEY" "http://127.0.0.1:8000/me"; done
```

Les cinq premières devraient afficher `200` ; la sixième devrait afficher `429`. Vérifie les en-têtes sur cette dernière :

```bash
curl -i -H "X-API-Key: $KEY" "http://127.0.0.1:8000/me"
```

:::tip[En-têtes HTTPException, pas `response.headers`, sur le chemin d'erreur]
C'est tentant de définir `response.headers["Retry-After"] = ...` juste avant de lever `HTTPException`, de la même façon que le chemin de succès définit `X-RateLimit-Limit`. Ne le fais pas — quand FastAPI transforme une `HTTPException` levée en une véritable réponse HTTP, il construit un objet de réponse **neuf** à partir de l'exception, jetant au passage tout ce qui a été écrit dans le paramètre `response` injecté. Tout en-tête qui doit apparaître sur une réponse d'erreur doit être passé directement à `HTTPException(..., headers={...})`, sinon il n'atteint jamais le client, en silence. Cela a mordu la toute première version du code d'exemple de cette leçon elle-même — vérifie avec `curl -i` que ton `429` porte réellement `Retry-After`, ne fais pas simplement confiance au fait que définir `response.headers` a fonctionné.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Les premières `RATE_LIMIT_MAX_REQUESTS` requêtes d'une clé dans la fenêtre réussissent avec `200`.</StepChecklistItem>
<StepChecklistItem>La requête suivante de cette même clé, toujours dans la fenêtre, retourne un vrai `429`.</StepChecklistItem>
<StepChecklistItem>La réponse `429` porte réellement un en-tête `Retry-After` — vérifié avec `curl -i`, pas supposé.</StepChecklistItem>
<StepChecklistItem>Attendre que la fenêtre soit passée et réessayer réussit de nouveau (la limite n'est pas permanente).</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi rattacher l'historique du limiteur à la clé API plutôt qu'à l'adresse IP ? Qu'est-ce qui changerait (en mieux ou en pire) si tu le rattachais à l'IP, surtout pour des clients derrière un NAT d'entreprise partagé ?
- La méthode `check` du limiteur prend `now` comme paramètre optionnel au lieu d'appeler toujours `time.monotonic()` en interne. Qu'est-ce que cela t'apporte quand tu écris un test pour elle — essaie d'en écrire un qui simule le passage du temps sans un vrai `time.sleep()`.

:::tip[C'est un limiteur à l'échelle jouet exprès — la production a une vraie réponse]
`SlidingWindowRateLimiter` est authentiquement correct, mais il est aussi authentiquement mono-processus : l'état vit dans un seul dict Python, dans un seul worker `uvicorn`. Fais-le tourner derrière deux workers, ou deux répliques de serveur derrière un load balancer, et chacun suit son propre comptage indépendant pour la même clé — un client pourrait atteindre jusqu'à N-fois-les-instances le débit prévu. La limitation de débit en production pour un service multi-instances déplace presque toujours cet état vers quelque chose de partagé, comme Redis (`INCR` avec un `TTL` est un bloc de construction courant), pour que chaque instance voie le même comptage. Des bibliothèques comme [`slowapi`](https://github.com/laurentS/slowapi) existent spécifiquement pour envelopper ce pattern dans un décorateur — bon à savoir, même si cette leçon a délibérément construit la partie intéressante à la main plutôt que de l'importer.
:::

## ⚠️ Pièges courants

- **Définir des en-têtes sur `response` avant de lever un `HTTPException`.** Comme couvert ci-dessus — ils sont jetés. Passe-les à `HTTPException(headers={...})` à la place.
- **Oublier que les contrôles de style `raise_for_status` n'appliquent nulle part ici — ce projet est le serveur, pas le client.** C'est facile d'ajouter par réflexe une gestion d'erreurs pour *appeler* une API alors que tout l'intérêt de ce projet est d'en *être* une ; les erreurs qui comptent ici sont celles que tes propres endpoints retournent aux appelants (`401`, `404`, `429`), pas celles que tu reçois.
- **Utiliser `random` au lieu de `secrets` pour les clés API.** `random` n'est pas cryptographiquement sûr et sa sortie peut, en principe, être prédite — `secrets.token_urlsafe()` est construit spécifiquement pour des jetons sensibles à la sécurité comme celui-ci.
- **Tester la limitation de débit avec des requêtes espacées d'une seconde ou plus, à la main.** Taper les commandes `curl` une par une, en attendant chaque résultat, prend facilement plus de temps qu'une courte fenêtre de débit — la fenêtre ne cesse de glisser et tu ne verras jamais de `429`. Envoie plutôt plusieurs requêtes coup sur coup (une boucle shell, ou un court script Python).
- **Une limite de débit si basse qu'elle bloque la navigation normale sur `/quotes` pendant les tests.** Cette leçon met délibérément le limiteur de débit uniquement sur `/me`, pas sur les endpoints ouverts `/quotes`, pour que tu puisses parcourir le jeu de données librement tout en testant l'authentification et la limitation séparément. Garde cette séparation à l'esprit si tu l'étends.

## Ce que tu viens de construire

Une vraie API REST : des endpoints de liste et de détail paginés et filtrables par-dessus un jeu de données que tu as écrit toi-même, une émission de clés API en libre-service, une dépendance qui applique réellement l'authentification, et un limiteur de débit que tu as construit ligne par ligne au lieu de l'importer — logique à fenêtre glissante, réponses `429`, et un en-tête `Retry-After` correct inclus. C'est la même forme de conception clé-API-plus-limitation-de-débit utilisée par les vraies API publiques partout, juste sans un service tiers derrière.

## Où aller à partir d'ici

- Persiste les clés API (hachées, pas brutes) et les compteurs de limitation de débit dans un vrai magasin de données — SQLite pour les clés, Redis pour les compteurs de débit — pour que les deux survivent à un redémarrage et fonctionnent correctement sur plus d'un processus serveur.
- Ajoute des paliers de débit par clé (une clé « free » obtient 5 requêtes par 10 secondes, une clé « pro » en obtient 50) en stockant un palier à côté de chaque clé émise et en le consultant dans `enforce_rate_limit`.
- Déploie réellement ceci quelque part d'atteignable depuis l'extérieur de ta propre machine (un petit hôte toujours allumé, ou une plateforme serverless qui supporte les apps ASGI) et frappe-le depuis un téléphone ou la machine d'un ami — un projet comme celui-ci n'est complet que lorsqu'autre chose que `localhost` peut l'appeler.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue à l'écriture de Python hors du navigateur. 🎓

<ProjectProgressCheckbox projectId="2027-rate-limited-api" />
