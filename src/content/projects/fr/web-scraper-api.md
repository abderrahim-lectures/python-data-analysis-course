---
title: "API de Scraping Web"
description: "Construisez une API de scraping web réutilisable avec rotation de proxy, limitation de débit et extraction de données structurées."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["requests", "beautifulsoup", "web-scraping", "html-parsing", "api"]
learningObjectives:
  - Récupérer des pages avec requests et gérer les erreurs HTTP avec grâce
  - Analyser le HTML avec BeautifulSoup en utilisant des sélecteurs CSS
  - Limiter le débit et réessayer pour crawler de manière responsable
  - Crawler les sites paginés en un seul ensemble de données
  - Envelopper le pipeline dans une fonction réutilisable retournant du JSON structuré
prerequisites:
  - "Les bases de Python (fonctions, boucles, dictionnaires)"
  - "La compréhension de HTTP et de la structure HTML de base"
  - "La familiarité avec le format JSON"
---

# 🛠️ 🕷️ API de Scraping Web

Le web est surtout du HTML servi aux humains, mais chaque « ensemble de données » que tu ne peux pas télécharger a commencé par quelqu'un qui le scrappait. Ce projet construit une petite API de scraping responsable contre [books.toscrape.com](https://books.toscrape.com/) — un site construit *pour* s'y entraîner — avec un client HTTP limité en débit qui réessaie poliment, un parseur BeautifulSoup qui transforme le HTML en enregistrements structurés, un crawler de pagination, et une fonction réutilisable unique qui retourne un JSON propre. Le résultat est ta propre petite API de lecture sur un site web public.

Cela suppose Python 101 et assez de HTML pour reconnaître un titre, un lien et un `div` — rien d'Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Construire un client HTTP limité en débit qui réessaie les échecs transitoires et respecte le serveur cible.
2. Analyser du HTML réel en enregistrements de livres structurés avec des sélecteurs CSS.
3. Crawler la pagination du site et combiner les pages en un seul ensemble de données.
4. Envelopper le pipeline dans une fonction réutilisable qui écrit et retourne du JSON.
5. Analyser les enregistrements collectés en statistiques de synthèse.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — et ici ce n'est pas juste pratique, c'est porteur de charge. Toute la prémisse de ce projet est de faire de vraies requêtes HTTP, ce qui signifie que l'environnement doit avoir un accès réseau sortant. Le `uv` local l'a, et `requests`, `beautifulsoup4` et `lxml` s'installent proprement pour lui.

**Google Colab et les notebooks Binder** fonctionnent aussi — les deux ont un accès réseau, et le notebook reflète chaque étape avec un `!pip install` et des requêtes en direct vers books.toscrape.com. **JupyterLite** est réellement inadapté : il exécute Python dans un bac à sable navigateur sans réseau sortant général, donc un `requests.get` n'a rien à atteindre. Utilise les badges de notebook ou une exécution locale pour celui-ci, honnêtement.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/web-scraper-api/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/web-scraper-api/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fweb-scraper-api%2Fnotebook.ipynb)

## Configuration

Crée le projet et installe les trois bibliothèques sur lesquelles ce pipeline est construit.

```bash
uv init web-scraper-api
cd web-scraper-api
uv add requests beautifulsoup4 lxml
```

**`requests`** fait le HTTP, **`beautifulsoup4`** analyse le HTML et fait les requêtes par sélecteur CSS, et **`lxml`** est le parseur C rapide que BeautifulSoup utilise en dessous — c'est ce qui rend `soup.select` rapide sur une page complète. Une note de parfaite éthique de scraping avant de commencer : scrappe seulement les sites qui le permettent. Ce cours utilise books.toscrape.com parce que son nom est son contrat — il existe pour être scrappé. Pour tout ce que tu écris au-delà de ce projet, vérifie d'abord `robots.txt` et garde ton taux de requêtes humain ; le limiteur de débit que tu es sur le point de construire est la version *polie* de cela.

**✅ Liste de vérification**

- ✅ `uv add requests beautifulsoup4 lxml` a terminé et `uv run python -c "import requests, bs4, lxml"` sort silencieusement.
- ✅ Tu peux atteindre la cible : `uv run python -c "import requests; print(requests.get('https://books.toscrape.com/').status_code)"` affiche `200`.

## Étape 1 : Construis un client HTTP résilient

L'internet fait tomber des paquets, limite les clients, et retourne occasionnellement une page cassée. Un scraper qui plante au premier hoquet est inutile, et un qui martèle un serveur est impoli — donc cette étape construit un client à deux personnalités : il attend poliment entre les requêtes (limitation de débit) et réessaie poliment quand quelque chose de transitoire échoue (backoff).

### 1.1 Écris le limiteur de débit

**👟 Indice de départ :** Impose un intervalle minimum entre les requêtes dans une petite classe — suis l'heure de la dernière requête et `sleep` la différence au besoin.

```python
# scraper.py
import time
import json
import requests

class RateLimiter:
    def __init__(self, requests_per_second: float = 1.0):
        self.min_interval = 1.0 / requests_per_second
        self.last_request = 0.0

    def wait(self) -> None:
        elapsed = time.time() - self.last_request
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request = time.time()

limiter = RateLimiter(requests_per_second=0.5)

limiter.wait()
print(f"Just waited; last_request={limiter.last_request:.2f}")
limiter.wait()
print(f"Immediate second call also waited; last_request={limiter.last_request:.2f}")
```

La conversion d'unité dans le constructeur est toute l'idée : `requests_per_second=0.5` signifie deux secondes entre les requêtes, et `1.0 / 0.5` calcule cet intervalle. `wait()` fait ensuite *deux* travaux — dormir si on est trop en avance, et toujours tamponner `last_request = time.time()` — donc le second appel consécutif n'a pas d'autre choix que d'attendre. `last_request` commence à `0.0`, ce qui signifie que le tout premier `wait()` ne dort jamais (un temps écoulé énorme) mais amorce correctement l'horloge. C'est le motif texte-book adjacent au seau à jetons derrière chaque crawler respectueux.

**🎯 Résultat attendu :** Les deux attentes tournent et chaque ligne affiche un horodatage `last_request` croissant monotone d'environ deux secondes d'écart.

**🩹 Si ça ne marche pas :** Si la seconde attente est instantanée, c'est que la branche `time.sleep` ne se déclenche jamais parce que `last_request` n'a pas été mis à jour après la première attente. Si les attentes sont bien plus longues que deux secondes, c'est que `requests_per_second` est passé comme un taux entier mais divisé ailleurs. Si l'orthographe `rate_per_second` fuit d'un autre exemple, seule la signature `__init__` fait autorité — le test ci-dessus appelle `RateLimiter(requests_per_second=0.5)`.

### 1.2 Récupère une page avec des réessais

**👟 Indice de départ :** Enveloppe `requests.get` dans une boucle qui réessaie sur les échecs transitoires (timeouts, erreurs de connexion, 429/5xx) avec des délais croissants, et donne à la requête un vrai User-Agent.

```python
# scraper.py (continuation)
def fetch_page(url: str, max_retries: int = 3, timeout: int = 10) -> requests.Response:
    """Fetch a URL with retry logic and rate limiting."""
    headers = {"User-Agent": "PythonScraper/1.0 (educational project)"}

    for attempt in range(1, max_retries + 1):
        limiter.wait()
        try:
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response
        except requests.exceptions.HTTPError:
            if response.status_code == 429 or response.status_code >= 500:
                time.sleep(2 ** attempt)
            else:
                raise
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            time.sleep(2 ** attempt)

    raise RuntimeError(f"Failed to fetch {url} after {max_retries} retries")

response = fetch_page("https://books.toscrape.com/")
print(f"Status: {response.status_code}, Length: {len(response.text)} chars")
```

Trois décisions rendent ce client de forme production. **Le User-Agent est explicite** — `PythonScraper/1.0 (educational project)` dit au serveur *qui* appelle au lieu de se cacher derrière la valeur par défaut de la bibliothèque, ce que fait un crawler poli. **Seuls les échecs transitoires réessaient** : les erreurs 4xx comme 404 sont le serveur disant « c'est définitif », donc elles re-lèvent immédiatement, tandis que 429 (limité en débit) et 5xx (hoquet serveur) et un timeout/erreur de connexion obtiennent tous `time.sleep(2 ** attempt)` — un backoff exponentiel, 2s, puis 4s, pour que les réessais deviennent plus doux, pas plus colériques. Et `limiter.wait()` s'exécute *avant* chaque tentative, repliant la discipline de l'étape 1.1 dans la récupération pour qu'aucun appelant ne puisse la sauter.

**🎯 Résultat attendu :** `Status: 200, Length: ...` — un vrai HTTP 200 et le nombre de caractères de la page d'accueil. Pointer `fetch_page` vers une page délibérément inexistante (ex. `https://books.toscrape.com/nope`) lève une erreur HTTP plutôt que de retourner des ordures.

**🩹 Si ça ne marche pas :** Si tu obtiens `NameError: response is not defined` dans la branche `HTTPError`, c'est que `requests.get` lui-même a levé avant d'assigner `response` — passer `timeout` dans l'appel (déjà présent) est ce qui empêche cela. Si un 404 boucle pour toujours, c'est que la branche `else: raise` manque, donc *chaque* statut HTTP réessaie. Si les sommeils de réessai ne semblent jamais attendre visiblement, le timing `2 ** attempt` file sur un réseau rapide — c'est correct ; teste avec `timeout=1` sur un hôte inaccessible pour ressentir le backoff.

### 1.3 Vérifie le client HTTP

**✅ Liste de vérification**

- ✅ `RateLimiter(requests_per_second=0.5)` impose des écarts ~2s entre les appels `wait()` consécutifs.
- ✅ `fetch_page` retourne une réponse `200` pour la page d'accueil et lève proprement pour un chemin inexistant.
- ✅ Seuls les statuts transitoires (429, 5xx, timeouts, erreurs de connexion) déclenchent les réessais.

**🤔 Question(s) socratique(s)**

- `limiter.wait()` dort pour l'écart *avant* une requête. Que change le fait que le sommeil se produise après l'arrivée de la réponse — et quel motif est plus doux pour le serveur quand les réponses sont lentes ?
- La boucle de réessai utilise `time.sleep(2 ** attempt)`. Pourquoi un backoff *exponentiel* au lieu d'attendre une seconde fixe à chaque fois — et que ressentirait un serveur en surcharge d'un réessaier à intervalle fixe qu'il ne ressentirait pas de celui-ci ?

## Étape 2 : Analyse le HTML en enregistrements structurés

Une page récupérée est un mur de texte ; un ensemble de données utilisable est une liste de dicts. Cette étape construit le parseur qui transforme chaque `article` de la page de la librairie en un enregistrement propre — en utilisant les sélecteurs CSS de BeautifulSoup, qui se lisent comme le CSS que tu écrirais pour une feuille de style.

### 2.1 Écris le parseur de livres

**👟 Indice de départ :** Sélectionne chaque carte de produit avec un `select`, tire chaque champ avec `select_one`, et garde toujours une protection pour les éléments manquants pour qu'un champ absent ne tue pas un enregistrement.

```python
# scraper.py (continuation)
from bs4 import BeautifulSoup

def parse_books(html: str) -> list[dict]:
    """Extract book data from books.toscrape.com HTML."""
    soup = BeautifulSoup(html, "lxml")
    books = []

    for article in soup.select("article.product_pod"):
        title_tag = article.select_one("h3 a")
        price_tag = article.select_one(".price_color")
        availability_tag = article.select_one(".availability")
        rating_tag = article.select_one(".star-rating")

        rating_classes = rating_tag.get("class", []) if rating_tag else []
        rating_map = {"One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5}
        rating = rating_map.get(rating_classes[1], 0) if len(rating_classes) > 1 else 0

        books.append({
            "title": title_tag["title"] if title_tag else "Unknown",
            "url": "https://books.toscrape.com/" + title_tag["href"] if title_tag else "",
            "price": price_tag.text.strip() if price_tag else "N/A",
            "availability": availability_tag.text.strip() if availability_tag else "Unknown",
            "rating": rating,
        })
    return books

html = fetch_page("https://books.toscrape.com/").text
books = parse_books(html)
print(f"Found {len(books)} books")
for book in books[:3]:
    print(f"  {book['title']} -- {book['price']} -- {'*' * book['rating']}")
```

Le sélecteur `"article.product_pod"` est tout le vocabulaire : il demande au soup chaque élément `<article>` portant la classe `product_pod` — ce qui est exactement la façon dont le site marque une carte de livre. Chaque `select_one` attrape ensuite *une* correspondance dans cette carte : `"h3 a"` le lien du titre (dont l'attribut `title` contient le nom), `".price_color"` le prix, et `".star-rating"` un tag dont *la seconde classe* nomme la note en mots. Le parseur lit `rating_classes[1]` et mappe le mot à un nombre — une démonstration propre que le HTML encode parfois des données dans des classes plutôt que dans du texte. Chaque champ est protégé contre l'absence (`if title_tag else ...`), parce qu'un site qui change une forme de classe ne devrait pas planter tout ton crawl.

**🎯 Résultat attendu :** `Found 20 books` et un aperçu de trois lignes comme `A Light in the Attic -- £51.77 -- *****`.

**🩹 Si ça ne marche pas :** Si `Found 0 books`, c'est que le sélecteur `"article.product_pod"` ne correspond pas au markup du site — inspecte avec `soup.select_one("article")` pour voir ce qu'il y a réellement (le site a peut-être changé). Si les prix reviennent vides, la classe est `.price_color` et l'attribut `text` exige que le tag ait été trouvé. Si chaque note est `0`, c'est que `rating_classes[1]` est vide ou que l'ordre de la liste de classes a changé.

### 2.2 Vérifie le parseur sur une forme connue

**👟 Indice de départ :** Compte les titres distincts et confirme que les cinq champs sont peuplés par enregistrement — un contrôle de forme rapide avant de faire confiance au parseur avec un crawl complet.

```python
# scraper.py (continuation)
print(f"Records: {len(books)}")
print("Fields per record:", sorted(books[0].keys()))
print("Non-empty titles:", sum(1 for b in books if b["title"]))
print("Ratings seen:", sorted({b["rating"] for b in books}))
```

Vérifier-avant-de-mettre-à-l'échelle est la discipline ici : une page, 20 enregistrements, et tu vérifies que chaque champ existe et que chaque note se mappe à 1-5 *avant* que plusieurs pages de crawl ne fassent confiance au parseur. La compréhension d'ensemble `{b["rating"] for b in books}` montre, d'un coup d'œil, si le mappage de notes a produit des valeurs saines.

**🎯 Résultat attendu :** `Records: 20`, les cinq noms de champs, `Non-empty titles: 20`, et `Ratings seen: [1, 2, 3, 4, 5]` (ou le sous-ensemble présent sur cette page).

**🩹 Si ça ne marche pas :** Si un nom de champ est mal orthographié, le dict `books.append` du parseur et le contrôle ici sont en désaccord — grep les deux. Si `Ratings seen` inclut `0`, certaines cartes manquent la classe star-rating et le repli les a mangées ; c'est attendu pour quelques fiches, et le mappage a quand même fonctionné.

### 2.3 Vérifie l'étape d'analyse

**✅ Liste de vérification**

- ✅ `parse_books` sur la page d'accueil retourne 20 enregistrements avec exactement les cinq champs.
- ✅ La `rating` de chaque enregistrement est un entier 1-5, dérivé d'un mot de classe.
- ✅ Un enregistrement avec un élément manquant dégrade vers un emplacement réservé au lieu de planter la boucle.

**🤔 Question(s) socratique(s)**

- Le parseur extrait l'URL en concaténant en chaîne `"https://books.toscrape.com/" + title_tag["href"]`. Que casse le fait que le site passe à des hrefs *absolus* comme `/catalogue/foo.html` — et qu'est-ce qu'un `urljoin` robuste ferait que la concaténation ne peut pas ?
- Les notes sont lues depuis un nom de classe, pas le texte visible. Quand les développeurs du site changeraient-ils ces noms de classes, et qu'est-ce que cela implique sur combien de temps un parseur à sélecteur CSS reste correct par rapport à un parseur lisant le texte visible ?

## Étape 3 : Crawl à travers les pages

Une page est un échantillon ; le catalogue est l'ensemble de données. Books.toscrape pagine à 20 livres par page avec un lien `next`, et cette étape suit ce lien — borné par un plafond `max_pages` — jusqu'à ce que le crawl finisse ou que la pagination s'épuise.

### 3.1 Suis la chaîne de pagination

**👟 Indice de départ :** Boucle page par page, analyse chaque réponse, étends l'accumulateur, lis le lien `next` du HTML de la page, et résous-le dans l'URL suivante.

```python
# scraper.py (continuation)
def scrape_books(base_url: str, max_pages: int = 3) -> list[dict]:
    """Scrape books across multiple pages with progress reporting."""
    all_books = []
    url = base_url

    for page in range(1, max_pages + 1):
        print(f"Scraping page {page}...")
        try:
            response = fetch_page(url)
            books = parse_books(response.text)
            all_books.extend(books)
            print(f"  Found {len(books)} books (total: {len(all_books)})")

            soup = BeautifulSoup(response.text, "lxml")
            next_btn = soup.select_one("li.next a")
            if next_btn:
                url = base_url.rsplit("/", 1)[0] + "/" + next_btn["href"]
            else:
                break
        except Exception as e:
            print(f"  Error on page {page}: {e}")
            break
    return all_books

books = scrape_books("https://books.toscrape.com/catalogue/page-1.html", max_pages=3)
print(f"\nTotal books scraped: {len(books)}")
```

Chaque choix intéressant est dans une ligne différente. `all_books.extend(books)` est la primitive d'accumulation — transforme la liste par page en un ensemble de données combiné, un `extend` à la fois. La ligne d'URL suivante, `url = base_url.rsplit("/", 1)[0] + "/" + next_btn["href"]`, est le crawling en deux parties : `rsplit("/", 1)` coupe le dernier segment de chemin (`page-1.html`), et le `href` du lien `next` (qui est `catalogue/page-2.html`, relatif) est ajouté — une résolution d'URL relative faite à la main. Et `max_pages` est la borne de politesse *et* de sécurité : tu explores page 1→2→3 et tu t'arrêtes, pour que ni le site ni ton budget ne soient surpris par un crawl accidentel de cent pages.

**🎯 Résultat attendu :** Trois lignes de progression (`Scraping page 1...`, `Found 20 books (total: 20)`, etc.), puis `Total books scraped: 60`.

**🩹 Si ça ne marche pas :** Si le crawl s'arrête après une page, c'est que `li.next a` n'a pas correspondu (le markup du bouton suivant du site a changé) ou que le `break` se déclenche inconditionnellement. Si *chaque* page re-récupère la page 1 en boucle, c'est que `url` se met à jour en une chaîne identique à chaque fois — vérifie que le `rsplit` remplace réellement le segment, ou affiche `url` avant de récupérer. Si une exception à mi-chemin tue toute l'exécution, c'est que le `try/except` par page qui affiche et `break` manque.

### 3.2 Vérifie le crawl

**✅ Liste de vérification**

- ✅ `scrape_books(..., max_pages=3)` retourne 60 enregistrements avec des URLs uniques.
- ✅ La boucle s'arrête à `max_pages` même quand plus de pages existent.
- ✅ Le total affiché égale la somme des comptes par page.

**🤔 Question(s) socratique(s)**

- La boucle s'arrête quand il n'y a pas de bouton `next` *et* quand `max_pages` est atteint. Si un vrai crawl devait reprendre là où il s'est arrêté (disons, après un crash), que devrais-tu persister pour le rendre reprise-able — et le code actuel est-il proche de cela ?
- Les crawls de pagination ont tendance à être séquentiels : tu ne peux pas connaître la troisième URL avant d'avoir lu le lien `next` de la seconde page. Dans quelle circonstance un crawl pourrait-il paralléliser les pages — et quel nouveau problème cela crée-t-il pour le limiteur de débit de l'Étape 1 ?

## Étape 4 : Transforme-le en fonction d'API réutilisable

La récolte de fonctions que tu as construites est un pipeline ; un *réutilisable* est une fonction unique qui exécute tout le pipeline et redonne des données structurées. Cette étape enveloppe crawl → parse → sauvegarde en un seul appel `scrape_books_to_json` et ajoute le rechargement, pour que `books.json` se comporte comme la réponse d'une petite API de lecture.

### 4.1 Enveloppe le pipeline en une fonction

**👟 Indice de départ :** Fais retourner à l'enveloppe ce qu'elle sauvegarde, écris avec `json.dump(indent=2)`, et retourne la liste pour que les appelants obtiennent des données même s'ils ignorent le fichier.

```python
# scraper.py (continuation)
def scrape_books_to_json(base_url: str, max_pages: int = 3, outfile: str = "books.json") -> list[dict]:
    """Crawl pages and write the combined records to a JSON file."""
    records = scrape_books(base_url, max_pages=max_pages)
    with open(outfile, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Wrote {len(records)} records to {outfile}")
    return records

books = scrape_books_to_json("https://books.toscrape.com/catalogue/page-1.html", max_pages=3)
print(f"Returned {len(records := books)} records ready to use in memory")
```

Le contrat ici est la partie intéressante : `scrape_books_to_json` retourne une simple `list[dict]` — exactement ce qu'un appel API retournerait — *et* écrit la même chose sur le disque. Envelopper le pipeline change la surface de la fonction de « trois outils séparés » en « un appel qui te donne l'ensemble de données », ce qui est l'interface en forme d'API derrière le nom du projet. `json.dump(records, f, indent=2)` rend le fichier lisible par un humain, et parce que le chargement est un `json.load` pur, le fichier sauvegardé devient un instantané portable que tu peux ré-analyser sans toucher au réseau à nouveau.

**🎯 Résultat attendu :** Les lignes de progression du crawl, `Wrote 60 records to books.json`, et `Returned 60 records ready to use in memory`.

**🩹 Si ça ne marche pas :** Si le fichier s'écrit mais que la fonction retourne `None`, c'est que la ligne `return records` manque. Si le fichier est une ligne dense, c'est que `indent=2` a été abandonné. Si un second appel avec `outfile="books2.json"` écrase toujours `books.json`, c'est que la valeur par défaut codée en dur a gagné l'argument — elles doivent différer au site d'appel.

### 4.2 Charge et compte depuis le JSON sauvegardé

**👟 Indice de départ :** Lis l'instantané avec `json.load` pour pouvoir ré-exécuter l'analyse sans re-toucher le réseau et re-scrapper.

```python
# scraper.py (continuation)
with open("books.json") as f:
    saved_books = json.load(f)

print(f"Reloaded {len(saved_books)} records from books.json")
print("First title:", saved_books[0]["title"])
```

Le but de persister un instantané est que l'analyse devient une opération de *lecture* : pas de réseau, pas de réessais, pas de limiteur de débit — juste un fichier. `json.load` ramène exactement la liste que l'enveloppe a écrite, parce que chaque valeur (chaînes, entiers, dicts) dans les enregistrements est sérialisable en JSON par construction. C'est la moitié hors-ligne d'un flux de travail scrappe-et-ensuite : scrappe une fois, analyse beaucoup de fois.

**🎯 Résultat attendu :** `Reloaded 60 records from books.json` et le titre du premier livre.

**🩹 Si ça ne marche pas :** Si le fichier manque, c'est que l'enveloppe du 4.1 n'a jamais tourné (exécute-la d'abord). Si le chargement lève `json.decoder.JSONDecodeError`, c'est que le fichier a été édité à la main ou partiellement écrit — régénère-le avec l'enveloppe. Si `saved_books[0]` échoue, c'est que le fichier contient une structure de niveau supérieur qui n'est pas une liste.

### 4.3 Vérifie l'API réutilisable

**✅ Liste de vérification**

- ✅ `scrape_books_to_json(".../page-1.html", max_pages=3)` retourne 60 enregistrements *et* écrit `books.json`.
- ✅ `json.load` relie les mêmes 60 enregistrements hors-ligne.
- ✅ Le fichier sauvegardé est lisible par un humain et ressemble à une liste d'objets de livre.

**🤔 Question(s) socratique(s)**

- L'enveloppe écrit à la fois un fichier et retourne des données. Quel est l'argument *contre* le retour de données quand le but principal est un fichier sur le disque — et qu'attendrait d'une fonction un appelant qui ne voulait que le fichier ?
- Le champ `url` de chaque enregistrement stocke l'URL complète concaténée. Dans la question socratique du 2.1, nous nous inquiétions des hrefs absolus vs relatifs. Où cette décision de conception refait-elle surface maintenant que tu re-charges `books.json` plus tard — et pourquoi un ensemble de données *stocké* cache-t-il ces bugs s'ils étaient déjà cuits dans les URLs au moment de l'analyse ?

## Étape 5 : Analyse l'ensemble de données récupéré

Le scraping n'est que la moitié de la valeur ; l'autre moitié est de répondre « et alors ? ». Cette étape lit les enregistrements et produit des statistiques de synthèse — notes, plages de prix, stock — avec des garde-fous soignés pour les données manquantes ou non numériques.

### 5.1 Calcule les statistiques de synthèse

**👟 Indice de départ :** Convertis les chaînes de prix en flottants de manière défensive, moyenne les notes, et calcule le pourcentage en stock — chacun protégé pour qu'un mauvais enregistrement ne puisse pas tuer le résumé.

```python
# scraper.py (continuation)
def analyze_books(records: list[dict]) -> dict:
    """Generate summary statistics from scraped book data."""
    if not records:
        return {"error": "No books to analyze"}

    ratings = [b["rating"] for b in records if b["rating"] > 0]
    prices = []
    for b in records:
        try:
            prices.append(float(b["price"].replace("\u00a3", "")))
        except (ValueError, AttributeError):
            continue

    in_stock = sum(1 for b in records if "in stock" in b["availability"].lower())
    return {
        "total_books": len(records),
        "average_rating": round(sum(ratings) / len(ratings), 2) if ratings else 0,
        "price_min": min(prices) if prices else None,
        "price_max": max(prices) if prices else None,
        "price_avg": round(sum(prices) / len(prices), 2) if prices else None,
        "in_stock_percent": round(in_stock / len(records) * 100, 1),
    }

print(json.dumps(analyze_books(books), indent=2))
```

La ligne de prix est celle qui vaut la peine de s'arrêter : `float(b["price"].replace("\u00a3", ""))`. Le scraper a stocké les prix comme des chaînes en direct comme `"£51.77"`, donc l'analyse doit retirer le signe livre — écrit comme son échappement Unicode `\u00a3` pour être explicite sur exactement quel caractère — puis analyser le nombre. Le `try/except` isole un mauvais enregistrement : un prix qui a survécu à l'analyse comme `"N/A"` (le repli « inconnu » de l'Étape 2) échoue `float()` proprement et est *sauté*, pas fatal. Les notes sont moyennées seulement sur les livres qui ont réellement une note (`if b["rating"] > 0`), et chaque agrégat qui pourrait diviser par zéro porte un garde-fou `if ... else` — la même forme défensive que tu as pratiquée dans les budgets du grant-tracker.

**🎯 Résultat attendu :** Un bloc JSON rapportant `total_books`, `average_rating`, le prix min/max/moy, et `in_stock_percent` — avec des nombres réels dérivés des 60 enregistrements récupérés (par exemple `"total_books": 60`, `"in_stock_percent": 100.0`).

**🩹 Si ça ne marche pas :** Si tous les prix sont `None`, c'est que `.replace("\u00a3", "")` n'a pas correspondu au caractère de devise réel (peut-être que tes données utilisent un autre symbole) — affiche un `b["price"]` brut et vérifie ses octets. Si `in_stock_percent` est suspectement 0.0, c'est que la comparaison en minuscules de la chaîne de disponibilité ne trouve pas `"in stock"` — affiche une chaîne de disponibilité d'exemple et ajuste la correspondance. Si un mauvais enregistrement évident a planté l'exécution, c'est que le `try/except` autour de `float()` manque — c'est le garde-fou qui transforme une mauvaise ligne en un saut.

### 5.2 Vérifie l'analyse

**✅ Liste de vérification**

- ✅ `analyze_books` retourne les six clés de synthèse, aucune ne levant sur des données sales.
- ✅ Les prix sont numériques (min ≤ moy ≤ max), les notes moyennent vers une figure de 1-5.
- ✅ Une liste d'enregistrements vide retourne `{"error": "No books to analyze"}` plutôt que de planter.

**🤔 Question(s) socratique(s)**

- Le résumé *saute* silencieusement les prix non analysables. Quand sauter est-il le choix honnête, et quand produit-il tranquillement une moyenne trompeuse — qu'ajouterais-tu (un compte de lignes sautées, un avertissement) pour dire à un lecteur que le nombre n'est pas tout l'ensemble de données ?
- `in_stock_percent` divise par `len(records)`. Si le texte de disponibilité du site changeait de `"In stock"` à `"Available"`, chaque enregistrement compte silencieusement comme non-en-stock. Qu'est-ce que cela suggère sur la correspondance de chaîne codée en dur dans les pipelines d'analyse, et comment ferais-tu de la définition « en stock » une constante unique et inspectable ?

## ⚠️ Pièges courants

- **Scrapper des sites qui ne le veulent pas.** La règle éthique est concrète : vérifie `robots.txt`, note les CGU du site, et garde ton taux humain. Correction : ce projet cible books.toscrape.com *parce qu'il* est construit pour la pratique ; pour de vraies cibles, respecte le fichier qui existe au `/robots.txt` avant d'écrire un seul sélecteur.
- **Pas de limitation de débit, ou limiteur contourné.** Faire des requêtes dans une boucle serrée te fait limiter en débit (429) ou bloquer carrément, et éventuellement les journaux du propriétaire du site sont ton problème. Correction : fais de `limiter.wait()` une partie de `fetch_page` lui-même (comme le fait l'Étape 1) pour que *chaque* chemin de requête paie le péage, pas seulement ceux auxquels tu as pensé à protéger.
- **Réessayer sur des erreurs permanentes.** Un 404 ou 403 est définitif ; le réessayer gaspille juste ton quota et agace le serveur. Correction : ne fais de backoff que sur 429, 5xx, timeouts et erreurs de connexion — re-lève tout le reste, exactement comme `fetch_page` branche.
- **Fragilité des sélecteurs CSS.** Un renommage de classe ou un élément manquant donne zéro enregistrement ou un crash. Correction : protège chaque résultat `select_one` (le motif `if tag else default` de l'Étape 2), et re-vérifie contre une page en direct quand le site change de forme.
- **Mojibake d'encodage dans le texte récupéré.** Le texte qui se décode comme `"Â£51.77"` au lieu de `"£51.77"` vient de la lecture d'octets sous le mauvais codec. Correction : fie-toi au `response.text` de `requests` (qui utilise le charset que le serveur déclare), et si le mojibake apparaît quand même, décode explicitement (`response.content.decode("utf-8")`) et norme ton analyse autour du vrai caractère.

## Ce que tu viens de construire

Une petite API de scraping web polie : un client limité en débit qui ne réessaie que les échecs transitoires, un parseur à sélecteur CSS qui transforme le HTML en enregistrements propres, un crawler de pagination, une fonction `scrape_books_to_json` unique qui retourne l'ensemble de données et le sauvegarde, et un passage d'analyse sur le résultat. La compétence transférable est *la collecte de données responsable* : transformer une page publique non structurée en enregistrements structurés, stockables et analysables — tout en traitant le serveur comme tu voudrais être traité — est la compétence exacte derrière les traceurs de prix, les agrégateurs de tableaux d'emplois et les ensembles de données de recherche.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/web-scraper-api/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/web-scraper-api) dans le dépôt du cours livre le pipeline complet avec l'export CSV et une option proxy prête à s'activer. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Extrais la **catégorie de livre** du fil d'Ariane de chaque page (`Home > Books > Travel`) et ajoute-la comme champ — un `select` sur la liste du fil d'Ariane et un découpage sur le séparateur `>` est toute la fonctionnalité.
- Ajoute un **export CSV** à côté du JSON : `csv.DictWriter` avec les cinq champs d'enregistrement te donne une feuille de calcul que n'importe qui peut ouvrir, et le module `csv` te cite les titres chargés de virgules.
- Prends en charge les **proxies et les en-têtes de réessai** : donne à `fetch_page` un dict `proxies={"http": ..., "https": ...}` optionnel pour `requests.get`, et un sommeil conscient de `Retry-After` sur 429 — les deux boutons qui transforment un scraper en crawler.
- Enveloppe le tout dans un **endpoint FastAPI** : `@app.get("/books")` retournant `scrape_books_to_json(...)` transforme ta fonction en une API HTTP littérale que d'autres programmes peuvent appeler.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans la lecture du web avec Python. 🎓
