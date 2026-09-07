---
title: "Serveur Mock API"
description: "Générer des APIs mock réalistes à partir de spécifications OpenAPI pour le développement et tests frontend."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["APIs", "Developer Tools", "Testing"]
prerequisites:
  - "Les fonctions, classes et lambdas Python"
  - "La sérialisation JSON et l'accès aux dicts"
  - "Très peu de regex : ce qu'est un groupe nommé"
learningObjectives:
  - "Compiler des templates de routes en expressions régulières qui extraient les paramètres de chemin"
  - "Dispatcher les requêtes vers des fabriques de réponses avec paramètres, chaînes de requête et corps"
  - "Simuler les échecs avec une route instable à base de compteur et renvoyer un 404 propre"
  - "Lire, refléter et valider un corps JSON POST de bout en bout"
  - "Enregistrer chaque appel dans une transcription et la rejouer pour vérifier la stabilité des réponses"
---

# 🛠️ 🎛️ Construire un Serveur Mock API

Chaque vraie application finit tôt ou tard bloquée sur un backend qui n'est pas prêt — un service de paiement sans sandbox, un flux météo en panne, une API de collègue encore en conception. Un *mock server* est le substitut honnête : il tourne sur ta machine, parle HTTP sur localhost, et répond aux mêmes chemins que ton vrai backend répondra, pour que ton frontend, tes tests et ta démo n'attendent jamais le déploiement de quelqu'un d'autre. Ce projet construit ce serveur de zéro : des templates de routes comme `/users/<id>` deviennent des dispatchers qui extraient les paramètres, les chaînes de requête et les corps JSON se reflètent pour inspection, une route instable échoue selon un calendrier, et un enregistreur intégré rejoue chaque appel pour attraper les régressions avant que la production n'existe. Il tourne sur la bibliothèque standard. Chaque exemple de ce guide est déterministe — le même dispatch renvoie le même JSON à chaque fois — donc tu peux vérifier chaque affirmation au fur et à mesure que tu construis.

Cela suppose des fonctions, des classes et la gestion du JSON. C'est un projet facultatif et non noté — consulte [Projets du monde réel](/docs/projects) pour la liste complète et grandissante.

## 🎯 Ce que tu vas faire

1. Compiler des templates de routes en regex qui capturent les paramètres de chemin.
2. Construire un dispatcher qui route la méthode + le chemin vers une fabrique de réponses.
3. Refléter les chaînes de requête et les échecs simulés, dont un 500 planifié et un 404 propre.
4. Ajouter un endpoint d'écho JSON qui lit et retourne un corps POST.
5. Enregistrer chaque appel dans une transcription et la rejouer comme vérification de régression.

## Où exécuter ceci

**Localement avec `uv`** est le chemin recommandé — le mock server est pur bibliothèque standard (`http.server`, `http.client`, `urllib.parse`, `json`), donc un `uv init` est tout ce qu'il te faut.

**Google Colab, Kaggle Notebooks et Binder** exécutent chaque étape sans modification. Le réseau de notebook est assez permissif pour les parties dispatcher en processus ; le bloc optionnel de câblage en direct à la fin fonctionne aussi sur Binder et en local — garde-le éphémère (port `0`) pour qu'il ne heurte jamais un autre processus.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/api-mock-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/api-mock-server/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fapi-mock-server%2Fnotebook.ipynb)

## Configuration

Tout ce qu'il faut avant la première requête.

### Configure le projet

```bash
uv init api-mock-server
cd api-mock-server
```

Pas de dépendances. Les pièces : une table de routes (méthode + template + fabrique de réponses), un dispatcher `MockAPI`, et plus tard un enregistreur.

**✅ Liste de vérification**

- ✅ `uv init api-mock-server` crée le projet et un `main.py`.
- ✅ `uv run python3 -c "import json, re, http.server"` réussit — tout est bibliothèque standard.

**🤔 Question(s) socratique(s)**

- Un mock server renvoie des données *fausses* par définition. Qu'est-ce qui lui donne quand même de l'intégrité — la forme de la réponse, les codes de statut, la latence, ou la *promesse qu'il est déterministe* ? Lequel de ces éléments peut t'endormir dans une livraison qui casse contre le vrai backend ?
- Le mock annonce `{"status": "ok"}` sur une route que la vraie API n'a pas encore construite. Si ton frontend passe les tests contre le mock, quelle seule propriété du *vrai* backend pourrait encore le casser — et où un champ `version` aiderait-il ?

## Étape 1 : Les routes comme templates

Une route est trois choses : une méthode HTTP, un chemin (peut-être avec des `<params>`), et une fonction qui construit la réponse. L'Étape 1 définit la table de routes et le compilateur de templates.

### 1.1 Le compilateur de templates

**👟 Indice de départ :** Écris `route_regex(template)` qui convertit `/users/<uid>` en une regex avec un groupe de capture nommé `<uid>`.

```python
# main.py
import re
from urllib.parse import urlparse, parse_qs

def route_regex(template):
    pattern = re.sub(r"<(\w+)>", r"(?P<\1>[^/]+)", template)
    return re.compile("^" + pattern + "$")

m = route_regex("/users/<uid>").match("/users/42")
print(m.groupdict())
```

`re.sub(r"<(\w+)>", r"(?P<\1>[^/]+)", template)` réécrit chaque `<name>` en un groupe regex nommé : `/users/<uid>` devient `/users/(?P<uid>[^/]+)`. `[^/]+` correspond à n'importe quelle suite sans barre oblique, donc `42`, `grace` et `x-7` se lient tous à `uid`. Ancrer avec `^…$` rend la correspondance exacte, donc `/users/42/extra` ne correspondra pas à moitié.

**🎯 Résultat attendu :** `{'uid': '42'}`.

**🩹 Si ça ne marche pas :** Si la sortie est vide ou `{}`, `.match` est ancré à une position incompatible — vérifie le `^` initial. Si un `re.error` apparaît, les crochets du template ne sont pas équilibrés ou un nom de capture contient un caractère non mot.

### 1.2 Enregistre la route de santé

**👟 Indice de départ :** Définis `add(method, template, response)` qui stocke un matcher compilé plus la fabrique de réponses, puis enregistre un endpoint `/health`.

```python
# main.py (continued)
class MockAPI:
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []

    def add(self, method, template, response):
        self.routes.append({
            "method": method,
            "match": route_regex(self.base + template),
            "response": response,
        })
        return self

api = MockAPI()
api.add("GET", "/health", lambda **kwargs: {"healthy": True, "version": "1.0.0"})
print(len(api.routes), "route registered")
```

La table de routes est juste une liste de dicts — une configuration comme données. Chaque entrée associe un verbe HTTP au matcher compilé pour le chemin *préfixé* (`/api/v1` + `/health`), et une fonction qui construira la charge utile plus tard. Les lambdas gardent les définitions de routes sur une ligne ; une fonction nommée fonctionne à l'identique.

**🎯 Résultat attendu :** `1 route registered`.

**🩹 Si ça ne marche pas :** Si `len(api.routes)` vaut 0, `add` a oublié `self.routes.append(...)` ou a retourné avant le append. S'il affiche `2 routes`, une copie de la liste a fuité — vérifie un alias accidentel `routes = self.routes`.

### 1.3 Vérifie la couche template

**✅ Liste de vérification**

- ✅ `route_regex("/users/<uid>")` correspond à `/users/42` avec `groupdict() == {"uid": "42"}`.
- ✅ `route_regex("/users/<uid>")` ne correspond *pas* à `/users/42/orders`.
- ✅ `add` stocke méthode, matcher et fabrique ; le préfixe de base est appliqué à l'enregistrement.

**🤔 Question(s) socratique(s)**

- Pourquoi une *regex* plutôt que `path.split("/")` ? Convertis `/users/<uid>/orders/<oid>` en une recherche basée sur split dans ta tête — qu'est-ce qui casse sur des segments de longueur variable et sur les chaînes de requête ? La regex est la réponse compacte à « n'importe quel nombre de segments, avec des noms ».
- Les templates `/users/<uid>` et `/users/search` commencent tous deux par `/users/`. Si tu as enregistré `<uid>` d'abord, à laquelle une requête vers `/users/search` aboutirait-elle — et quelle règle la décide ?

## Étape 2 : Le dispatcher

Les templates restent inactifs jusqu'à ce que quelque chose cherche une requête. L'Étape 2 transforme la table de routes en dispatcher : méthode + chemin à l'entrée, `(statut, charge utile)` à la sortie.

### 2.1 Gère une route statique

**👟 Indice de départ :** Implémente `dispatch(method, path)` qui balaie les routes, fait correspondre la méthode puis le chemin, et appelle la fabrique choisie.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            return 200, route["response"](**kwargs)
        return 404, {"error": "not found"}

print(api.dispatch("GET", "/api/v1/health"))
print(api.dispatch("GET", "/api/v1/health"))
print(api.dispatch("GET", "/api/v1/missing"))
print(api.dispatch("POST", "/api/v1/health"))
```

`dispatch` est un balayage linéaire : deux filtres bon marché (`method ==`, matcher) avant l'appel coûteux. La première route correspondante gagne, donc l'ordre d'enregistrement est le bris d'égalité (voir la Socratic de l'Étape 1). Une requête entièrement manquée retourne une **charge utile** `404` — pas une exception — donc chaque appel a une réponse `(statut, charge utile)` définie.

**🎯 Résultat attendu :**

```
(200, {'healthy': True, 'version': '1.0.0'})
(200, {'healthy': True, 'version': '1.0.0'})
(404, {'error': 'not found'})
(404, {'error': 'not found'})
```

**🩹 Si ça ne marche pas :** Si la mauvaise route répond, l'ordre de première correspondance a choisi la mauvaise entrée — réordonne l'enregistrement. Si `/missing` lève au lieu de retourner `(404, …)`, la boucle est retombée sur un `routes[0]` non gardé.

### 2.2 Paramètres de chemin et chaînes de requête

**👟 Indice de départ :** Étends `dispatch` pour passer les paramètres de chemin *et* les paramètres de requête analysés dans la fabrique via `kwargs`.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            return 200, route["response"](**kwargs, params=query)
        return 404, {"error": "not found"}

api.add("GET", "/users/<uid>",
        lambda **kw: {"user": {"id": kw["uid"], "name": "Ada", "role": "admin"}})
api.add("GET", "/search",
        lambda **kw: {"query": kw["params"].get("q", ""),
                      "results": [f"result-{i+1}"
                                  for i in range(int(kw["params"].get("limit", "1")))]})

print(api.dispatch("GET", "/api/v1/users/42"))
print(api.dispatch("GET", "/api/v1/search?q=cats&limit=3"))
print(api.dispatch("GET", "/api/v1/search"))
```

`urlparse` sépare le chemin de la requête ; `parse_qs` transforme `?q=cats&limit=3` en `{"q": ["cats"], "limit": ["3"]}`, déballé en chaînes de première valeur. Les paramètres de chemin arrivent via `**kwargs` (depuis les groupes regex) ; les paramètres de requête arrivent via un dict `params`. La fabrique de réponses nomme les paramètres qu'elle veut et ajoute les défauts pour le reste.

**🎯 Résultat attendu :**

```
(200, {'user': {'id': '42', 'name': 'Ada', 'role': 'admin'}})
(200, {'query': 'cats', 'results': ['result-1', 'result-2', 'result-3']})
(200, {'query': '', 'results': ['result-1']})
```

**🩹 Si ça ne marche pas :** Si `uid` manque dans la réponse, `**kwargs` ne l'incluait pas — vérifie que le matcher a capturé `uid` (Étape 1.1). Si `limit=3` retourne 1 résultat, `parse_qs` a donné des listes et la fabrique a indexé une liste au lieu d'une chaîne — confirme le déballage `v[0]`.

### 2.3 Vérifie le dispatcher

**✅ Liste de vérification**

- ✅ `dispatch` retourne `(200, charge utile)` pour les GET enregistrés et `(404, {"error": "not found"})` pour le reste, en faisant correspondre aussi la méthode.
- ✅ `/users/<uid>` et `/search` se résolvent tous deux, avec les paramètres de chemin dans `kwargs` et les paramètres de requête dans `params`.
- ✅ Le même dispatcher répond de façon répétée — aucun état n'est consommé par un appel.

**🤔 Question(s) socratique(s)**

- Les caractères encodés de type `%7B` se trouvent dans le *chemin* ; les espaces dans la *requête*. Où `urlparse` trace-t-elle la ligne, et qu'est-ce qui casserait si tu analysais les paramètres de requête depuis `parsed.path` au lieu de `parsed.query` ?
- La fabrique de `/users/<uid>` retourne la même « Ada » pour chaque id. Pour un *mock*, est-ce un bug ou une fonctionnalité ? Cadre le compromis entre « variété réaliste » et « tests déterministes ».

## Étape 3 : Simule les modes d'échec

Les vraies API échouent. Un bon mock échoue *exprès*, selon un calendrier, pour que ton code ne puisse pas esquiver les chemins d'échec. L'Étape 3 ajoute les erreurs planifiées et un écho conscient du corps.

### 3.1 La route instable

**👟 Indice de départ :** Étends `add` avec un `flaky={"every": n, "message": ...}` optionnel ; compte les hits par chemin et retourne un 500 à chaque n-ième.

```python
# main.py (continued)
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []
        self._counter = {}

    def add(self, method, template, response, *, flaky=None):
        self.routes.append({"method": method,
                            "match": route_regex(self.base + template),
                            "response": response,
                            "flaky": flaky})

    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            if route["flaky"] is not None:
                n = self._counter.setdefault(path, 0) + 1
                self._counter[path] = n
                if n % route["flaky"]["every"] == 0:
                    return 500, {"error": route["flaky"]["message"]}
            return 200, route["response"](**kwargs, params=query)
        return 404, {"error": "not found"}

api.add("GET", "/flaky", lambda **kw: {"ok": True},
        flaky={"every": 3, "message": "Simulated outage"})
print(api.dispatch("GET", "/api/v1/flaky"))
print(api.dispatch("GET", "/api/v1/flaky"))
print(api.dispatch("GET", "/api/v1/flaky"))
```

`_counter` compte les hits *par chemin* (`setdefault(path, 0)`), donc une route instable échoue aux hits 3, 6, 9 — un calendrier déterministe que tes tests peuvent asserter. Les deux appels sains réussissent, puis le troisième échoue avec une charge utile d'erreur nette. C'est ainsi que tu testes une boucle de nouvelle tentative : donne-lui un rythme « réussit deux fois, échoue une fois ».

**🎯 Résultat attendu :**

```
(200, {'ok': True})
(200, {'ok': True})
(500, {'error': 'Simulated outage'})
```

**🩹 Si ça ne marche pas :** Si les trois échouent, `every` vaut `1` (ou le modulo est inversé — `n % every == 0` ne se déclenche que sur des multiples exacts). Si aucun n'échoue, la branche `flaky` ne tourne jamais parce que `add` n'a pas été appelé avec `flaky=` comme mot-clé.

### 3.2 Une mauvaise entrée est un 4xx, pas un crash

**👟 Indice de départ :** Enveloppe l'appel de fabrique dans un try/except pour qu'une *exception dans le mock* devienne une charge utile 422, jamais une trace de pile.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            if route["flaky"] is not None:
                n = self._counter.setdefault(path, 0) + 1
                self._counter[path] = n
                if n % route["flaky"]["every"] == 0:
                    return 500, {"error": route["flaky"]["message"]}
            try:
                payload = route["response"](**kwargs, params=query, body=body)
            except Exception as e:
                return 422, {"error": str(e)}
            return 200, payload
        return 404, {"error": "not found"}

api.add("GET", "/divide", lambda **kw: {"n": 1 / int(kw["params"]["by"])})
print(api.dispatch("GET", "/api/v1/divide?by=2"))
print(api.dispatch("GET", "/api/v1/divide?by=0"))
```

Le try/except trace une ligne dure : le *mock* a un bug ou l'appelant a envoyé des bêtises, et dans les deux cas la réponse est un JSON structuré avec le statut `422` — un client peut brancher dessus. Sans le garde, un mauvais `by=0` propagerait une `ZeroDivisionError` et ferait planter tout le thread du serveur.

**🎯 Résultat attendu :**

```
(200, {'n': 0.5})
(422, {'error': 'division by zero'})
```

**🩹 Si ça ne marche pas :** Si `by=0` plante, le try/except est hors de la boucle ou la fabrique est appelée ailleurs. S'il retourne `500` au lieu de `422`, le `except` a re-levé ou mappé le mauvais statut.

### 3.3 Vérifie les modes d'échec

**✅ Liste de vérification**

- ✅ Une route instable échoue exactement quand `n % every == 0` — le hit 3 d'un calendrier de 3 échoue.
- ✅ Les fabriques en échec retournent `(422, {"error": ...})` ; les chemins sans correspondance retournent `(404, ...)`.
- ✅ Tous les échecs simulés sont des données, jamais des exceptions levées.

**🤔 Question(s) socratique(s)**

- Le compteur d'instabilité est *par chemin*, pas par règle. Deux appelants qui frappent `/api/v1/flaky` partagent le compte. Voudrais-tu plutôt un compteur par *appelant* en mockant un système distribué — et sur quoi te baserais-tu pour dire quel appelant est lequel ?
- 422 vs 500 : l'un dit « la requête était fausse », l'autre « le serveur a échoué ». Quand tu **mockes**, tu contrôles les deux côtés — pourquoi alors s'embêter à les distinguer ?

## Étape 4 : Lire et renvoyer un corps JSON

Les GET portent leurs paramètres dans l'URL. Les POST portent un corps JSON. L'Étape 4 rend le mock conscient du corps : le lire, le refléter, et retourner l'objet — tout l'aller-retour dont un frontend a besoin pour se développer contre.

### 4.1 Renvoie un corps POST

**👟 Indice de départ :** Enregistre `/echo` ; la fabrique décode `body` (une chaîne brute) avec `json.loads` et retourne `{"echo": <décodé>}`.

```python
# main.py (continued)
api.add("POST", "/echo",
        lambda **kw: {"echo": json.loads(kw["body"]) if kw["body"] else {}})

print(api.dispatch("POST", "/api/v1/echo", body='{"name": "Grace"}'))
print(api.dispatch("POST", "/api/v1/echo", body=""))
```

`body` entre dans `dispatch` comme une chaîne brute (la couche HTTP la lit depuis la requête à l'Étape 5) ; `json.loads` la transforme en objet Python pour la réponse d'écho. Un corps manquant devient `{}` — toujours un écho valide, pas une exception.

**🎯 Résultat attendu :**

```
(200, {'echo': {'name': 'Grace'}})
(200, {'echo': {}})
```

**🩹 Si ça ne marche pas :** Si `json.loads` échoue sur une chaîne JSON valide, le corps est arrivé doublement encodé (cite le JSON deux fois) ou avec un octet parasite. Si un corps vide renvoie `None`, le ternaire falsy a basculé.

### 4.2 Paramètres enchaînés : corps + chemin + requête

**👟 Indice de départ :** Enregistre un endpoint de stockage dont la réponse combine le paramètre de chemin, un paramètre de requête et le corps décodé.

```python
# main.py (continued)
api.add("POST", "/users/<uid>/notes",
        lambda **kw: {"user": kw["uid"],
                      "tag": kw["params"].get("tag", "general"),
                      "note": json.loads(kw["body"]) or {"text": ""}})

print(api.dispatch("POST", "/api/v1/users/7/notes?tag=idea",
                   body='{"text": "ship by Friday"}'))
```

Une route exerce maintenant chaque canal d'entrée à la fois — le nom du chemin, une étiquette de requête et le corps JSON — exactement la forme qu'un vrai endpoint `/users/<id>/notes` a. Lire les trois dans une seule réponse prouve que le dispatcher porte chaque canal indépendamment.

**🎯 Résultat attendu :**

```
(200, {'user': '7', 'tag': 'idea', 'note': {'text': 'ship by Friday'}})
```

**🩹 Si ça ne marche pas :** Si `tag` manque, `query` n'a pas été threadée dans la fabrique. Si `user` est `None`, `kw["uid"]` n'a pas été capturé (le nom du groupe dans le template ne correspondait pas à la clé utilisée ici).

### 4.3 Vérifie le pipeline de corps

**✅ Liste de vérification**

- ✅ `/echo` retourne l'objet corps JSON décodé ; un corps vide renvoie `{}`.
- ✅ Le chemin, la requête et le corps peuvent être combinés dans la réponse d'une seule route.
- ✅ Un JSON malformé dans un corps est mappé à un 422 via le garde de l'Étape 3, pas un crash.

**🤔 Question(s) socratique(s)**

- La route d'écho *fait confiance* à `json.loads`. Si un client envoie `{"text": "ship by Friday"}` mais que la vraie API attend `{"content": ...}`, un écho mock de la mauvaise forme passe les tests en silence. Où placerais-tu une *vérification de schéma* — dans la fabrique de la route, ou dans le dispatcher — et pourquoi ?
- `json.loads(kw["body"])` retourne n'importe quel type JSON : liste, nombre, null. Si tu voulais que `/echo` *n'accepte que* des objets, quel changement d'une ligne rejetterait le reste ?

## Étape 5 : Enregistrer et rejouer

Un mock qui répond mais oublie ne peut pas vérifier. L'Étape 5 enregistre chaque appel dans une transcription, puis la rejoue — ré-exécuter exactement les requêtes et asserter que les réponses n'ont pas dérivé. C'est un test de régression né d'un mock.

### 5.1 Enregistre la transcription

**👟 Indice de départ :** Ajoute une liste `recorded` ; journalise la méthode, le chemin, le corps, le statut et la charge utile dans `dispatch`, amorcée par les appels que tu as déjà faits.

```python
# main.py (continued)
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []
        self._counter = {}
        self.recorded = []

    def _finish(self, method, path, body, status, payload):
        self.recorded.append({"method": method, "path": path, "body": body,
                              "status": status, "payload": payload})
        return status, payload

    def transcript(self):
        return json.loads(json.dumps(self.recorded))

    # Now route dispatch returns self._finish(...) on every path — the
    # matching routes and the fallback 404 alike (add that in this section).

print("calls recorded so far:", len(api.transcript()))
print(api.transcript()[0])
```

Enregistrer la *requête* (méthode, chemin, corps) à côté de la *réponse* (statut, charge utile) fait de la transcription une trace véridique — tu peux rejouer n'importe quelle entrée plus tard sans deviner ce qu'elle a envoyé. Une copie profonde via `json.dumps(json.loads(...))` garde la transcription retournée isolée de toute mutation ultérieure. (Pour que les comptages ci-dessous correspondent, fais que `dispatch` termine chaque chemin — correspondant ou 404 — par `return self._finish(method, path, body, status, payload)`, retournant directement soit `(status, payload)`.)

**🎯 Résultat attendu :**

```
calls recorded so far: 9
{'method': 'GET', 'path': '/api/v1/health', 'body': None, 'status': 200, 'payload': {'healthy': True, 'version': '1.0.0'}}
```

(Le comptage est 9 parce que chaque appel `dispatch` antérieur de ce guide a été enregistré.)

**🩹 Si ça ne marche pas :** Si la transcription est vide, `_finish` (ou le append à l'intérieur) n'est pas sur le chemin de retour de `dispatch`. Si des entrées mutent plus tard, la copie profonde dans `transcript()` manque.

### 5.2 Rejoue comme vérification de régression

**👟 Indice de départ :** Implémente `replay()` qui re-dispatche chaque requête enregistrée et collecte les chemins dont les réponses ont dérivé.

```python
# main.py (continued)
    def replay(self):
        mismatches = []
        for call in self.transcript():
            st, payload = self.dispatch(call["method"], call["path"],
                                        body=call["body"])
            if (st, payload) != (call["status"], call["payload"]):
                mismatches.append(call["path"])
        return mismatches

fresh = MockAPI()
fresh.add("GET", "/health", lambda **kw: {"healthy": True, "version": "1.0.0"})
fresh.add("GET", "/users/<uid>",
          lambda **kw: {"user": {"id": kw["uid"], "name": "Ada", "role": "admin"}})
fresh.add("GET", "/search", lambda **kw: {"query": kw["params"].get("q", ""),
                                          "results": [f"result-{i+1}"
                                                      for i in range(int(kw["params"].get("limit", "1")))]})
fresh.dispatch("GET", "/api/v1/health")
fresh.dispatch("GET", "/api/v1/search?q=cats&limit=3")
fresh.dispatch("GET", "/api/v1/users/7")

print("replay:", fresh.replay())
```

`replay` renvoie chaque *requête* enregistrée (avec son corps exact) et compare la réponse fraîche à celle enregistrée. Zéro écart signifie « le serveur se comporte toujours exactement comme pendant l'exécution » — ton test de régression bon marché et déterministe. (Une route instable bascule sur un compteur, donc rejoue-la sur une instance fraîche ou redémarre le compteur — cette non-déterminance est le but d'un test séparé.)

**🎯 Résultat attendu :** `replay: []`.

**🩹 Si ça ne marche pas :** Si un appel `search` diverge, les chaînes `limit` de la requête ne font pas l'aller-retour (int vs str). Si `users/7` diverge, la réponse dépend du temps réel ou d'un global — gèle-la.

### 5.3 Câble-le en direct (optionnel)

**👟 Indice de départ :** Branche le dispatcher dans `http.server` : un `BaseHTTPRequestHandler` lit le corps, appelle `dispatch`, et écrit le statut + le JSON — servi sur un port éphémère pour qu'il ne heurte jamais rien.

```python
# main.py (continued)
import json as _json, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class Handler(BaseHTTPRequestHandler):
    api = None
    def dispatch_here(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        body = self.rfile.read(length).decode() if length else None
        status, payload = self.api.dispatch(self.command, self.path, body=body)
        data = _json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
    do_GET = dispatch_here
    do_POST = dispatch_here
    def log_message(self, *args): pass

Handler.api = fresh
server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
port = server.server_address[1]
threading.Thread(target=server.serve_forever, daemon=True).start()

import http.client
conn = http.client.HTTPConnection("127.0.0.1", port)
conn.request("GET", "/api/v1/health")
r = conn.getresponse()
print("GET /health ->", r.status, _json.loads(r.read()))
conn.request("POST", "/api/v1/echo", body=_json.dumps({"name": "Grace"}),
             headers={"Content-Type": "application/json"})
r = conn.getresponse()
print("POST /echo  ->", r.status, _json.loads(r.read()))
server.shutdown()
```

Le port `0` demande un port libre à l'OS, donc `serve_forever` ne se bat jamais avec un processus existant. Le handler reflète le contrat de `dispatch` — lire le corps, dispatcher, encoder la charge utile en JSON — donc le serveur en direct et le dispatcher en processus répondent à l'identique. `log_message` est réduit au silence pour que la console reste propre.

**🎯 Résultat attendu :**

```
GET /health -> 200 {'healthy': True, 'version': '1.0.0'}
POST /echo  -> 200 {'echo': {'name': 'Grace'}}
```

**🩹 Si ça ne marche pas :** Si une `ConnectionRefusedError`, le thread du serveur est mort (une exception à l'intérieur de `serve_forever`) ou `shutdown()` a tourné trop tôt. Si le corps d'un POST est vide, l'en-tête `Content-Length` n'a pas atteint le handler — la plupart des clients l'envoient, certains outils ad hoc non.

### 5.4 Vérifie l'enregistreur

**✅ Liste de vérification**

- ✅ `transcript()` retourne une copie profonde isolée de chaque appel enregistré.
- ✅ `replay()` retourne `[]` sur un ensemble de routes stable sans dérive.
- ✅ Le handler en direct retourne exactement le même JSON que le dispatcher en processus.

**🤔 Question(s) socratique(s)**

- Le replay répond à « est-ce que la réponse a changé ? » mais pas à « est-ce que la réponse est *correcte* ? ». Qu'est-ce qu'une transcription livrée comme données dorées permet à un futur test d'asserter qu'un mock en direct seul ne peut jamais — et quel est le risque que les données dorées soient périmées ?
- Le handler en direct relit `self.rfile` par requête. `ThreadingHTTPServer` sert chaque connexion sur son propre thread — qu'est-ce qui casse si deux appels de replay se disputent `self._counter`, et l'état par instance de `BaseHTTPRequestHandler` survivrait-il proprement à cela ?

## ⚠️ Pièges courants

- **Des regex de routes non ancrées.** `/users/<uid>` correspondant sans `^…$` correspond aussi à `/api/v1/users/42/orders` et produit une requête à moitié capturée. Ancre toujours le motif compilé.
- **La méthode oubliée.** Ne faire correspondre que le chemin laisse un `POST /health` frapper la route `GET /health`. Filtre sur `route["method"] == method` *avant* la correspondance regex.
- **`parse_qs` retourne des listes.** `parse_qs("?limit=3")["limit"]` est `["3"]`, pas `"3"`. Ouvre avec `{k: v[0] …}` ou l'indexation casse chaque analyse à valeurs multiples.
- **Des fausses pannes qui plantent.** Une `ZeroDivisionError` non gardée à l'intérieur d'une route plante le thread du handler. Laisse le try/except mapper les exceptions vers une charge utile `422` — c'est le travail du mock.
- **Un état partagé dans le replay.** Le compteur d'instabilité est par chemin et monotone ; un `replay()` qui renvoie le 3ᵉ appel instable reçoit un 500 frais. Teste les routes instables sur une instance fraîche.
- **Des charges utiles non sérialisables.** `json.dumps` dans `transcript()` et le handler en direct s'étouffent tous deux sur un `datetime` ou un int numpy. Garde les charges utiles dans des types Python simples.

## Ce que tu viens de construire

Un serveur API local, déterministe, en bibliothèque standard : des templates de routes compilés en dispatchers regex, les paramètres de chemin et de requête qui coulent dans les fabriques de réponses, des échecs simulés selon un calendrier, des corps JSON renvoyés en écho, et une transcription complète de requêtes qui se rejoue comme vérification de régression. L'idée centrale est que *un mock remplace un système externe par une promesse que tu contrôles* — chaque `(statut, charge utile)` est une donnée, jamais une exception surprise, pour que ton code puisse être développé, démontré et testé en régression longtemps avant que le vrai backend n'existe. Échange la table de routes contre la vraie URL de base plus tard et le même client continue de fonctionner, ce qui est précisément la couture qu'un mock est censé tenir.

:::tip[Exécute une version plus complète sans configuration locale]
[`examples/api-mock-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/api-mock-server) dans le dépôt du cours est le serveur complet en notebook — le templating de routes, les échecs instables, l'endpoint d'écho, le replay de transcription et le handler optionnel câblé en direct, exécutables dans Colab/Kaggle/Binder. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute `latency_ms` aux routes et fais dormir le dispatcher avant de répondre, pour que les tests de nouvelle tentative exercent de vrais timeouts — puis enregistre les latences mesurées dans la transcription à côté du statut et de la charge utile.
- Implémente une vérification `Content-Type` dans `dispatch` qui rejette les corps non JSON avec 415 au lieu de laisser `json.loads` lever.
- Persiste la transcription dans un fichier JSON avec `json.dump` à l'arrêt et charge-la au démarrage, pour que l'enregistreur devienne des données de régression qui survivent aux redémarrages.
- Ajoute un mode `record = True/False` pour qu'une exécution d'enregistrement capture de vrais appels API (via `http.client`) et les rejoue comme mock plus tard — le classique proxy enregistre-et-rejoue.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier·e ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README contient un tutoriel complet, accessible aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, étape par étape. Aucune expérience git préalable n'est requise.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓