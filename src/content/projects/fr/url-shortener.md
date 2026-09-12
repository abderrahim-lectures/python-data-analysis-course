---
title: "API Raccourcisseur d'URL"
description: "Créez un raccourcisseur d'URL avec analytics, suivez les clics, les référents et les données géographiques."
difficulty: "intermediate"
estimatedMinutes: 70
tags: ["api", "database", "sqlite"]
learningObjectives:
  - Modéliser les liens et les clics dans un schéma SQLite
  - "Générer des codes courts sans collision avec base62"
  - Résoudre les codes en URLs et enregistrer les événements de clic
  - "Interroger les analytics de clics : totaux, référents et séries par jour"
  - Exposer une couche FastAPI avec les routes shorten, redirect et analytics
prerequisites:
  - "Les bases de Python (fonctions, dictionnaires, exceptions)"
  - "Les bases des API REST : routes, codes de statut, JSON"
  - "Installer des paquets avec uv"
---

# 🛠️ 🔗 API Raccourcisseur d'URL

Chaque lien que tu partages dans un chat est une courte chaîne qui cache une plus longue, et une redirection qui dit à celui qui la possède exactement à quelle fréquence, d'où et quel jour elle est cliquée. Ce projet construit ce service de bout en bout : des codes courts base62 stockés dans SQLite, un clic enregistré à chaque redirection, des analytics que tu peux interroger, et enfin une vraie couche FastAPI pour pouvoir `curl` ton propre raccourcisseur. C'est une petite mais complète API adossée à une base de données, la forme derrière de nombreux services de production.

Cela suppose Python 101 et un peu de familiarité avec les API REST et `curl`, rien d'Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Concevoir un schéma SQLite pour les liens et les événements de clic.
2. Générer des codes courts sans collision avec base62.
3. Résoudre un code vers son URL tout en enregistrant un clic.
4. Interroger les analytics par lien, totaux, référents et une série jour par jour.
5. L'envelopper dans un service FastAPI que tu peux appeler avec `curl`.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal. Un raccourcisseur est un *serveur* : il doit lier un port et répondre aux requêtes HTTP, ce que `uvicorn` sur ta machine fait bien. Les étapes du moteur (1-4) tournent parfaitement n'importe où, mais la boucle `curl` de l'Étape 5 veut un vrai serveur en cours d'exécution.

**Google Colab, Kaggle Notebooks et Binder** exécutent tout le moteur (SQLite vit heureusement dans un notebook, et le notebook d'exemple exerce même l'API via le `TestClient` de FastAPI sans lier de port). L'honnêteté impose de préciser : un notebook est un chemin d'essai pour la partie *service*, tu n'y laisseras pas un serveur de longue durée tourner, et le fichier SQLite est éphémère. Utilise les badges pour l'expérience moteur + test-client, et exécute `uvicorn` en local quand tu veux la vraie chose.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/url-shortener/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/url-shortener/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Furl-shortener%2Fnotebook.fr.ipynb)

## Configuration

Crée le projet et installe la couche web. Le moteur utilise `sqlite3`, qui est livré avec Python.

```bash
uv init url-shortener
cd url-shortener
uv add fastapi uvicorn
```

```bash
uv run python -c "import fastapi, sqlite3; print('ok')"
```

`sqlite3` est la base de données du moteur, une base SQL complète dans un seul fichier, aucun serveur à installer. `fastapi` construit les routes HTTP avec une validation pilotée par les types, et `uvicorn` est le serveur ASGI qui lie réellement le port et répond à `curl`.

**✅ Liste de vérification**

- ✅ `uv add fastapi uvicorn` a terminé et le contrôle d'import affiche `ok`.
- ✅ Un projet `url-shortener/` neuf existe avec un `pyproject.toml`.

## Étape 1 : Conçois le schéma SQLite

Un raccourcisseur stocke deux choses : la correspondance code → URL, et chaque clic *sur* ce code. Une table `links`, une table `clicks`, et une clé étrangère entre elles.

### 1.1 Crée le schéma et un assistant de connexion

**👟 Indice de départ :** Connecte-toi via un petit assistant `get_conn()` avec `row_factory = sqlite3.Row`, et crée les deux tables avec `init_db()` en utilisant `CREATE TABLE IF NOT EXISTS` pour qu'il soit sûr de l'appeler de façon répétée.

```python
# shortener.py
import sqlite3
from contextlib import closing
from datetime import datetime

DB = "shortener.db"

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    with closing(get_conn()) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS links (
                code       TEXT PRIMARY KEY,
                url        TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS clicks (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                code       TEXT NOT NULL,
                clicked_at TEXT NOT NULL,
                referrer   TEXT
            );
            """
        )

init_db()
print("tables ready")
```

`row_factory = sqlite3.Row` est la ligne qualité-de-vie : les résultats de requête reviennent comme des lignes de type dict (`row["url"]`) au lieu de tuples anonymes, donc les analytics de l'Étape 4 se lisent comme du Python, pas comme un fouillis de positions. `code TEXT PRIMARY KEY` fait du code la clé naturelle, tu *veux* que les collisions d'insertion soient visibles. L'auto-incrément `clicks.id` est séparé, car un lien reçoit beaucoup de clics et un clic n'est pas un lien. Envelopper tout dans `closing(get_conn())` garantit que la connexion se ferme même si une requête lève.

**🎯 Résultat attendu :** `tables ready` affiché, et un fichier `shortener.db` apparaît dans le dossier du projet. Relancer affiche la même ligne sans erreur.

**🩹 Si ça ne marche pas :** Si la seconde exécution lève `OperationalError: table already exists`, c'est que les clauses `IF NOT EXISTS` manquent. Si `row["url"]` se comporte mal plus tard, `row_factory` est défini par connexion, vérifie qu'il est à l'intérieur de `get_conn()`, pas seulement dans une fonction appelante. Si le fichier apparaît ailleurs, la connexion utilise un chemin relatif et ton répertoire de travail diffère, affiche `DB` pour confirmer.

### 1.2 Vérifie le schéma

**✅ Liste de vérification**

- ✅ Exécuter `init_db()` deux fois est inoffensif.
- ✅ `shortener.db` existe et `sqlite3 shortener.db '.tables'` liste `clicks` et `links`.
- ✅ Tu peux nommer les trois colonnes de `links` et les quatre de `clicks`.

**🤔 Question(s) socratique(s)**

- La table des clics stocke `code` mais pas l'URL elle-même. Que t'achète ce choix de conception, et qu'est-ce qui doit rester vrai à propos des valeurs `code` pour que la jointure soit fiable ?
- `clicks.id` est `AUTOINCREMENT`, tandis que `links.code` est une clé primaire texte. Quand un id entier est essentiel, et quand une clé chaîne naturelle (comme `code`) est-elle le choix le plus honnête ?

## Étape 2 : Génère et crée des codes courts

Les codes courts viennent du comptage : chaque nouveau lien reçoit le nombre suivant, et base62 encode ce nombre en une chaîne courte et sûre pour une URL (`1`, `2`, …, `a`, `b`, …). Cette étape ajoute l'encodeur et la fonction `create_link`.

### 2.1 Écris l'encodage base62 et `create_link`

**👟 Indice de départ :** Utilise l'alphabet des 62 symboles, `divmod` pour réduire n'importe quel entier en chiffres en base 62, et dérive le code suivant du nombre de lignes actuel de la table pour qu'il ne collisionne jamais.

```python
# shortener.py (continuation)
ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

def encode_base62(n: int) -> str:
    if n == 0:
        return ALPHABET[0]
    chars = []
    while n > 0:
        n, remainder = divmod(n, 62)
        chars.append(ALPHABET[remainder])
    return "".join(reversed(chars))

def create_link(url: str, custom: str | None = None) -> str:
    with closing(get_conn()) as conn:
        if custom is None:
            row = conn.execute("SELECT COUNT(*) FROM links").fetchone()
            code = encode_base62(row[0] + 1)
        else:
            code = custom
        conn.execute(
            "INSERT INTO links (code, url, created_at) VALUES (?, ?, ?)",
            (code, url, datetime.now().isoformat(timespec="seconds")),
        )
    return code

print(create_link("https://example.com/very/long/path"))
print(create_link("https://python.org", custom="py"))
for i in range(1, 140):
    assert len(encode_base62(i)) <= 2
print("first 138 codes fit in 2 chars")
```

`divmod(n, 62)` est tout l'algorithme : il extrait un chiffre en base 62 par boucle (`remainder`) et réduit `n` d'un facteur 62, jusqu'à ce que `n` atteigne zéro, le même calcul de « retenue » derrière le comptage dans n'importe quelle base. Inverser les chiffres collectés met le plus significatif en premier, donc l'ordre des codes correspond à l'ordre numérique. `SELECT COUNT(*) from links` est une source d'id délibérément simple : monotone croissante à mesure que les liens sont ajoutés, donc ne collisionne jamais avec le code `A`. Le vrai gain de base62 est la densité, 138 liens tiennent en deux caractères, et la boucle `assert` le prouve empiriquement.

**🎯 Résultat attendu :** `A`, puis `py`, puis la boucle assert passant silencieusement (138 codes ≤ 2 caractères), aucun crash.

**🩹 Si ça ne marche pas :** Si les codes reviennent dans le mauvais ordre (`B` avant `A`), c'est que le `reversed(chars)` manque. Si le même `A` apparaît deux fois, c'est que `COUNT(*)` est lu sur la mauvaise table ou que le nombre n'est pas incrémenté de 1. Si un code personnalisé collisionne, `sqlite3.IntegrityError` s'échappe sans être géré, la route de l'Étape 5 devra l'attraper, mais au niveau du moteur, cette erreur *est* le signal honnête de « pris ».

### 2.2 Vérifie la génération de codes

**✅ Liste de vérification**

- ✅ Les codes sont en base62 : lettres d'abord, chiffres après, sûrs pour une URL.
- ✅ Les 138 premiers codes font 2 caractères ou moins, et les codes 62²+ fonctionnent toujours si tu en insères autant.
- ✅ Les codes personnalisés s'insèrent tels quels sans toucher au compteur.

**🤔 Question(s) socratique(s)**

- Les codes sont dérivés de *combien de liens existent*, donc supprimer un lien ne récupère jamais son code. Est-ce un bug ou une propriété délibérée, et que casserait `encode_base62(COUNT(*)+1)` si des codes étaient jamais supprimés ?
- L'alphabet commence par des lettres majuscules. Comment l'ordre des codes change-t-il si tu réordonnes l'alphabet (minuscules d'abord), et quelque chose en aval dépend-il de cet ordre ?

## Étape 3 : Résous les codes en URLs et suis les clics

Un raccourcisseur qui ne compte pas les clics est un demi-service. Cette étape résout un code vers son URL, l'opération qu'un redirect effectue, et enregistre une ligne de clic pour chaque résolution, pour que les analytics de l'Étape 4 aient de vraies données.

### 3.1 Écris `resolve_url`

**👟 Indice de départ :** Lis l'URL pour le code ; s'il existe, insère une ligne de clic avec un horodatage et un référent fourni par l'appelant, et retourne l'URL. S'il n'existe pas, retourne `None` pour que l'appelant puisse lever un 404.

```python
# shortener.py (continuation)
def resolve_url(code: str, referrer: str | None = None) -> str | None:
    with closing(get_conn()) as conn:
        row = conn.execute(
            "SELECT url FROM links WHERE code = ?", (code,)
        ).fetchone()
        if row is None:
            return None
        conn.execute(
            "INSERT INTO clicks (code, clicked_at, referrer) VALUES (?, ?, ?)",
            (code, datetime.now().isoformat(timespec="seconds"), referrer),
        )
    return row["url"]

# simulate a redirect being hit three times
resolve_url("A")
resolve_url("A", referrer="x.com")
resolve_url("A")
print("clicks:", resolve_url("missing-code"))
```

L'ordre est la conception : *regarde, enregistre, retourne*. Regarder d'abord laisse un mauvais code retourner `None` tôt sans polluer la table des clics ; enregistrer *à l'intérieur* de la même connexion garantit que le clic et la lecture voient les mêmes données ; et retourner l'URL est ce qu'un gestionnaire de redirect remettra à `RedirectResponse`. Le paramètre referrer est passé par la couche HTTP, pas deviné ici, donc chaque ligne de clic porte qui a envoyé le visiteur.

**🎯 Résultat attendu :** `clicks: None`, les trois appels `resolve_url("A")` ont enregistré trois lignes de clic, et `resolve_url("missing-code")` a retourné `None` au lieu de planter.

**🩹 Si ça ne marche pas :** Si un mauvais code plante avec un KeyError ou similaire, c'est que la fonction indexe `row["url"]` avant de vérifier `row is None`. Si les clics ne s'accumulent jamais dans la table, c'est que l'`INSERT` manque son chemin de commit (un `conn.execute` simple dans `closing` commit à la fermeture, retire le contexte de connexion et il s'annule silencieusement). Si `resolve_url` mute la base partagée pendant l'appel de *recherche*, tu as `UPDATE` au lieu d'`INSERT` dans le chemin de clic.

### 3.2 Vérifie la résolution et le suivi des clics

**✅ Liste de vérification**

- ✅ Les mauvais codes retournent `None` ; les bons codes retournent l'URL stockée.
- ✅ Chaque bonne résolution ajoute exactement une ligne à `clicks`.
- ✅ Un référent stocké atterrit dans la colonne `referrer` quand il est fourni.

**🤔 Question(s) socratique(s)**

- Compter les clics *à l'intérieur* de la résolution d'un redirect signifie que chaque redirect a besoin d'une écriture en base de données. Qu'est-ce qui changerait dans la latence sous un trafic intense, et quel traitement par lots ou cache un service à un million de clics par jour ajouterait-il ici en premier ?
- Le référent vient de l'appelant. Un appelant malveillant peut forger `referrer="victim.example"`. Que fait un vrai raccourcisseur d'URL à ce sujet, et qu'afficherais-tu dans les analytics si tu t'en souciais ?

## Étape 4 : Interroge les analytics de clics

Maintenant le vrai gain : agrège les clics enregistrés dans les trois nombres qu'un marketeur demande réellement, total, référents, et une série jour par jour, directement depuis SQL, sans boucle Python sur les données.

### 4.1 Écris la requête d'analytics

**👟 Indice de départ :** Exécute trois agrégats SQL indexés sur `code` : un `COUNT(*)`, un `GROUP BY referrer ORDER BY count`, et une troncature de chaîne `substr(clicked_at,1,10)` pour la série par jour.

```python
# shortener.py (continuation)
def click_stats(code: str) -> dict:
    with closing(get_conn()) as conn:
        total = conn.execute(
            "SELECT COUNT(*) FROM clicks WHERE code = ?", (code,)
        ).fetchone()[0]
        referrers = conn.execute(
            "SELECT referrer, COUNT(*) AS n FROM clicks "
            "WHERE code = ? GROUP BY referrer ORDER BY n DESC LIMIT 10",
            (code,),
        ).fetchall()
        per_day = conn.execute(
            "SELECT substr(clicked_at, 1, 10) AS day, COUNT(*) AS n "
            "FROM clicks WHERE code = ? GROUP BY day ORDER BY day",
            (code,),
        ).fetchall()
    return {
        "code": code,
        "total_clicks": total,
        "top_referrers": [dict(r) for r in referrers],
        "clicks_per_day": [dict(r) for r in per_day],
    }

print(click_stats("A"))
```

Trois agrégats, une forme. `total` est le nombre vedette ; `GROUP BY referrer … ORDER BY n DESC` classe d'où vient le trafic ; et `substr(clicked_at, 1, 10)` tronque l'horodatage ISO à sa date (`2026-09-06`), ce qui est la manière au rabais d'obtenir une série par jour sans fonction de date, SQLite est content de `GROUP BY` cette chaîne. Chaque ligne de résultat est `dict(r)` pour que la sortie soit des dictionnaires simples sérialisables en JSON, prêts pour l'API de l'Étape 5.

**🎯 Résultat attendu :** Un dict avec `total_clicks` = 3 pour le code `A`, deux entrées de référent (`x.com` puis le compartiment `None`), et une liste `clicks_per_day` avec une ligne de jour comptant les 3.

**🩹 Si ça ne marche pas :** Si `total_clicks` reste 0, l'insert de l'Étape 3 ne commit pas (voir le piège de l'Étape 3). Si `referrer` montre une ligne `None` qui refuse de se regrouper avec les autres, `GROUP BY referrer` traite le `NULL` SQL comme distinct de la chaîne vide, coalesce avec `IFNULL` si tu veux les fusionner. Si la série par jour regroupe tout en un seul jour, c'est que `substr(clicked_at,1,10)` découpe le mauvais format.

### 4.2 Vérifie les analytics

**✅ Liste de vérification**

- ✅ `click_stats("A")` retourne le total, les référents principaux et une série par jour pour les 3 clics enregistrés.
- ✅ Chaque compte de référent correspond au nombre d'appels `resolve_url` avec ce référent.
- ✅ Le dict retourné se convertit en JSON sans sérialiseur personnalisé.

**🤔 Question(s) socratique(s)**

- Les tranches de `referrer`, y compris `NULL`, fuient dans les analytics. Qu'implique une ligne `GROUP BY referrer` de `null: 0`, et *cacherais-tu* cette ligne ou la libellerais-tu pour l'utilisateur ?
- Ces trois agrégats s'exécutent comme trois requêtes séparées. Quel `GROUP BY` + `UNION` unique pourrait produire les trois, et quand la complexité SQL supplémentaire vaudrait-elle l'aller-retour unique ?

## Étape 5 : Expose-le comme un service FastAPI

Le moteur est complet, maintenant il devient quelque chose que tu peux `curl`. Cette étape enveloppe les trois opérations en routes HTTP : `POST /shorten`, `GET /u/{code}` (qui redirige, et enregistre le clic), et `GET /analytics/{code}`.

### 5.1 Écris l'application FastAPI

**👟 Indice de départ :** Construis les routes par-dessus les fonctions de moteur déjà écrites, mappe « mauvais code » vers un HTTP `404`, attrape l'`IntegrityError` du code personnalisé comme un `409`, et garde un garde-fou `__main__` pour que `uvicorn` puisse exécuter l'application.

```python
# shortener.py (continuation)
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
import uvicorn

app = FastAPI(title="URL Shortener")

@app.post("/shorten")
def shorten(url: str, custom: str | None = None) -> dict:
    code = create_link(url, custom=custom)
    return {"short_url": f"/u/{code}", "code": code}

@app.get("/u/{code}")
def go(code: str):
    url = resolve_url(code, referrer=None)
    if url is None:
        raise HTTPException(status_code=404, detail="Unknown short code.")
    return RedirectResponse(url)

@app.get("/analytics/{code}")
def analytics(code: str) -> dict:
    return click_stats(code)

if __name__ == "__main__":
    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

Chaque route est une ligne unique parce que le moteur possède déjà la logique. `@app.post("/shorten")` laisse FastAPI prendre l'URL comme paramètre de requête aujourd'hui et un corps JSON demain ; `@app.get("/u/{code}")` est le redirect que le suivi de clics de l'Étape 3 alimente, chaque hit sur cette route est un clic ; et `HTTPException(404)` est la façon dont un code manquant se manifeste comme une erreur *web* plutôt qu'un `None` Python. Exécuter `uvicorn.run(app, ...)` derrière `if __name__ == "__main__":` garde `shortener.py` importable par les tests et les notebooks tout en restant un serveur exécutable.

**🎯 Résultat attendu :** Exécuter `uv run python shortener.py` démarre un serveur sur `127.0.0.1:8000`. Dans un autre terminal, `curl -s "http://127.0.0.1:8000/shorten?url=https://example.com/x"` retourne `{"short_url":"/u/B","code":"B"}` (ou similaire), `curl -L` sur `/u/B` suit la redirection, et `/analytics/B` rapporte de vrais comptes de clics.

**🩹 Si ça ne marche pas :** Si `curl` obtient `Connection refused`, le serveur ne tourne pas ou a lié un autre port, vérifie le `port` de `uvicorn.run`. Si `POST /shorten` retourne `422 Unprocessable Entity`, c'est que le paramètre `url` n'a pas été fourni ou que l'annotation de type est fausse, `url: str` est requis, donc une clé de requête mal écrite fait 422. Si `/u/{code}` avec un code personnalisé lève 500 au lieu de 409 sur les doublons, c'est que l'`IntegrityError` n'est pas attrapée dans `create_link`, enveloppe l'insert.

### 5.2 Vérifie le service complet

**✅ Liste de vérification**

- ✅ `uv run python shortener.py` démarre le serveur sur le port 8000.
- ✅ `curl` sur `/shorten`, `/u/{code}` et `/analytics/{code}` retourne du JSON/des redirections sensés.
- ✅ Suivre `/u/{code}` incrémente le `total_clicks` de ce code.
- ✅ Un code inconnu retourne un HTTP 404 avec un détail JSON.

**🤔 Question(s) socratique(s)**

- Chaque hit sur `/u/{code}` enregistre un clic, y compris les humains qui cliquent le lien raccourci par accident. Qu'ajouterais-tu pour distinguer les clics « réels » (filtres de bots, attribution au premier clic, géo) et où ces données iraient-elles, si le schéma était rouvert ?
- `shorten` prend aujourd'hui l'URL comme paramètre de requête, ce qui fuit les URLs dans les journaux serveur. Que change le passage à un corps JSON `POST` en matière de caching, de journalisation et de la façon dont les navigateurs envoient la requête ?

## ⚠️ Pièges courants

- **Oublier `row_factory` par connexion.** Il est défini dans `get_conn()`, donc toute fonction qui crée son propre `sqlite3.connect` obtient des tuples et `row["url"]` plante. Correction : tout accès passe par `get_conn()`.
- **Ne pas committer le clic.** Un `INSERT` simple sur une connexion qui ne se ferme jamais proprement peut s'annuler silencieusement, laissant `resolve_url` retourner des URLs mais les analytics à zéro. Correction : utilise le contexte `closing(get_conn())` pour que le commit au moment de la fermeture s'exécute toujours.
- **Des codes personnalisés en collision.** `INSERT` avec un code existant lève `sqlite3.IntegrityError`, le signal est honnête mais brut. Correction : attrape-le dans `create_link` et mappe-le vers un `409 Conflict` à l'Étape 5.
- **Des codes qui ne cessent de grandir.** `COUNT(*) + 1` produit des codes uniquement pour les lignes *existantes* ; si tu supprimes des liens, les codes sont réutilisés, cassant les anciens redirects. Correction : réserve le code par unicité, ou garde un compteur monotone dans sa propre table.
- **Faire confiance aux en-têtes referrer.** Les référents viennent de l'appelant et sont forgeables. Correction : traite-les comme l'indice marketing qu'ils sont, et ne laisse jamais un `referrer` prétendu piloter des décisions de sécurité.

## Ce que tu viens de construire

Un raccourcisseur d'URL réellement adossé à une base de données : codes base62, persistance SQLite, suivi de clics sur chaque redirection, analytics pilotées par SQL, et un service FastAPI que tu as conduit toi-même avec `curl`. La compétence transférable est la *boucle API adossée à une base de données*, schéma d'abord, fonctions de moteur ensuite, enveloppe HTTP en dernier, qui est la même forme en trois couches derrière les apps de todo, les tableaux de bord, et la plupart des configurations de « collecter des données, les stocker, les exposer ».

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/url-shortener/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/url-shortener) dans le dépôt du cours est une version plus complète du code ci-dessus, avec la gestion du corps `POST`, le support d'expiration et une démo pilotée par `TestClient` que tu peux exécuter entièrement dans un notebook. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute une route `GET /latest` qui liste les liens les plus récents avec leurs totaux de clics, une requête `ORDER BY created_at DESC LIMIT 10`.
- Implémente l'expiration : une colonne stockant `expires_at`, et `resolve_url` retourne `404` quand `datetime.now()` l'a dépassée.
- Limite le débit de `/shorten` par IP pour qu'une clé récupérée ne puisse pas fabriquer mille liens par seconde.
- Génère des codes QR pour chaque URL courte (la bibliothèque `qrcode` est une installation) et sers-les depuis `/u/{code}.png`.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
