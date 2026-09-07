---
title: "Récupérer et analyser un site web en direct"
slug: /projects/scrape-analyze
description: "Récupérez de vraies données web, nettoyez-les avec pandas, et produisez des graphiques — aucune clé API requise."
difficulty: "intermediate"
estimatedMinutes: 60
xpReward: 50
tags: ["Web Scraping", "pandas", "matplotlib", "data-analysis"]
prerequisites: ["Python basics", "Basic pandas", "Basic matplotlib"]
---

# 🕷️ Récupérer et analyser un site web en direct

Jusqu'à présent, chaque jeu de données est arrivé sous forme de CSV prêt à l'emploi. La vraie analyse commence rarement là. Ce projet vous apprend à récupérer une page web en direct via HTTP, à analyser le HTML en lignes structurées, à nettoyer le résultat avec pandas, et à produire des graphiques — aucune clé API, aucun service externe, juste votre script et un serveur.

## 🎯 Ce que vous allez apprendre

1. Récupérer des pages web avec `requests`.
2. Analyser le HTML avec `BeautifulSoup`.
3. Gérer la pagination sur plusieurs pages.
4. Nettoyer des données récupérées avec `pandas`.
5. Créer des visualisations à partir de données réelles.
6. Gérer les défis courants du scraping (encodage, limites de taux, sélecteurs cassés).

## Ce que vous allez construire

Un scraper qui :

- Récupère une vraie page web via HTTP.
- Analyse des tableaux et listes HTML en données structurées.
- Suit les liens « Next » pour collecter toutes les pages.
- Nettoie et transforme les données avec pandas.
- Génère des graphiques et des statistiques récapitulatives.
- Exporte les résultats en CSV.

## Setup

### Installer `uv`

`uv` gère les versions de Python et les dépendances de projet en un seul outil.

**macOS / Linux :**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell) :**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Fermez et rouvrez votre terminal, puis confirmez :

```bash
uv --version
```

### Créer le projet

```bash
uv init scrape-analyze
cd scrape-analyze
uv add requests beautifulsoup4 pandas matplotlib
```

Pas de clé API. Pas d'inscription au palier gratuit. Juste votre script et un vrai site web.

---

## Étape 1 : Récupérer une page web

### Objectif

Effectuer une requête HTTP vers un site web en direct et recevoir son contenu HTML brut.

### Explication

Une requête HTTP `GET` est la même chose que votre navigateur fait à chaque fois que vous visitez une page — il demande une URL à un serveur et récupère le HTML brut sous forme de texte. La bibliothèque `requests` rend cela simple en Python. Nous ciblons [quotes.toscrape.com](https://quotes.toscrape.com), un site construit spécifiquement pour pratiquer le scraping : pas de mur de connexion, pas de limitation de taux, structure HTML stable.

:::tip[Toujours vérifier robots.txt avant de scraper ailleurs]
Avant de pointer ce code vers n'importe quel site autre que quotes.toscrape.com, vérifiez le `robots.txt` de ce site (par ex. `https://example.com/robots.txt`) et ses conditions d'utilisation. Respecter `robots.txt` est l'attente de base pour tout scraper.
:::

### Indice de départ

`requests.get(url)` effectue la requête HTTP. Appelez `.raise_for_status()` immédiatement après pour transformer une 404 ou une 500 en une exception bruyante au lieu de laisser un contenu cassé s'écouler silencieusement dans votre parseur.

### Code de travail

```python
# scrape.py
import requests

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()  # turns a 404/500 into a loud exception
html = response.text

print(f"Fetched {len(html)} characters")
print(html[:100])
```

Exécutez-le :

```bash
uv run python scrape.py
```

### Résultat attendu

```
Fetched 12345 characters
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
```

Le nombre exact de caractères varie, mais `html` devrait être une longue chaîne commençant par `<!DOCTYPE html>`.

### Résolution de problèmes

| Problème | Correction |
|---|---|
| `ConnectionError` | Vous êtes hors ligne ou l'URL est fausse. Vérifiez votre connexion Internet et l'orthographe de l'URL. |
| `HTTPError 404` | Le chemin de l'URL est faux — utilisez exactement `https://quotes.toscrape.com/` |
| `HTTPError 403` | Certains sites bloquent les requêtes sans en-tête User-Agent de navigateur. Ajoutez-en un : `requests.get(url, headers={"User-Agent": "Mozilla/5.0"})` |

### Liste de vérification

- [ ] `uv run python scrape.py` s'exécute sans erreur
- [ ] La sortie montre un nombre de caractères de l'ordre des milliers
- [ ] Les 100 premiers caractères commencent par `<!DOCTYPE html>`

### Question socratique

Que se passe-t-il si vous sautez `raise_for_status()` et que le serveur retourne une 404 ? Comment l'erreur remonterait-elle plus tard dans votre pipeline, et pourquoi cela est-il plus difficile à déboguer ?

---

## Étape 2 : Analyser le contenu HTML

### Objectif

Transformer le texte HTML brut en un arbre navigable et en extraire des données structurées.

### Explication

Cette chaîne `html` est un arbre de balises imbriquées — `<div>`, `<span>`, `<a>` — chacune portant éventuellement des attributs comme `class` ou `href`. BeautifulSoup analyse ce texte en un arbre et vous donne `find` (première correspondance) et `find_all` (chaque correspondance), filtrables tous deux par nom de balise et attributs.

Ouvrez la page dans « View Page Source » (Afficher la source de la page) de votre navigateur et vous verrez : chaque citation se trouve à l'intérieur d'un `<div class="quote">`, le texte est dans `<span class="text">`, l'auteur dans `<small class="author">`, et les tags dans `<a class="tag">`.

### Indice de départ

`find_all("div", class_="quote")` retourne une balise BeautifulSoup par citation. À l'intérieur de chacune, `find` et `find_all` réduisent aux champs dont vous avez besoin, et `.get_text(strip=True)` en extrait un texte propre.

### Code de travail

```python
# scrape.py
import requests
from bs4 import BeautifulSoup

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")

for quote_div in soup.find_all("div", class_="quote"):
    text = quote_div.find("span", class_="text").get_text(strip=True)
    author = quote_div.find("small", class_="author").get_text(strip=True)
    tags = [tag.get_text(strip=True) for tag in quote_div.find_all("a", class_="tag")]
    print(f"{author}: {text} {tags}")
```

```bash
uv run python scrape.py
```

### Résultat attendu

Dix lignes, une par citation sur la page d'accueil :

```
Albert Einstein: "Life is like riding a bicycle..." ['change', 'deep-thoughts', 'thinking', 'world']
J.K. Rowling: "It is our choices..." ['abilities', 'choices', 'deep-thoughts', 'flying', 'harry-potter']
...
```

### Résolution de problèmes

| Problème | Correction |
|---|---|
| `AttributeError: 'NoneType' has no attribute 'get_text'` | `find(...)` a retourné `None` — le nom de classe ne correspond pas. Revérifiez « View Page Source » pour les noms de classe exacts. |
| Moins de 10 lignes imprimées | Le filtre de classe CSS est trop étroit ou mal orthographié. Vérifiez que `class_="quote"` correspond au HTML réel. |
| La sortie montre des caractères illisibles | Problème d'encodage. Essayez `soup = BeautifulSoup(response.content, "html.parser")` au lieu de `response.text`. |

### Liste de vérification

- [ ] `uv run python scrape.py` s'exécute sans erreur
- [ ] Exactement 10 lignes sont imprimées, une par citation
- [ ] Chaque ligne a un vrai texte, un vrai nom d'auteur, et une liste de tags non vide

### Question socratique

`.get_text(strip=True)` et `.text` retournent tous deux le contenu textuel d'une balise, mais seul l'un supprime les espaces. Qu'est-ce qui casserait plus tard si vous utilisiez `.text` partout à la place ? Pensez aux comparaisons de chaînes et aux opérations `groupby`.

---

## Étape 3 : Extraire des données structurées

### Objectif

Transformer l'analyse par page en une fonction réutilisable, suivre la pagination sur toutes les pages, et sauvegarder les résultats en CSV.

### Explication

quotes.toscrape.com répartit les citations sur 10 pages, avec un lien « Next » en bas de chaque page sauf la dernière. Plutôt que de coder en dur « boucler 10 fois », suivez le lien lui-même — comme ça, le script fonctionne même si le nombre de pages change. Deux sous-étapes : envelopper la boucle de l'étape 2 dans une fonction, puis suivre les liens jusqu'à ce qu'il n'y en ait plus.

### Indice de départ

La structure de la boucle : `while url is not None:`, récupérez et analysez chaque page, puis vérifiez la présence de `<li class="next">`. Sa présence ou son absence est votre signal de continuer/arrêter.

### Code de travail

```python
# scrape.py
import csv
import time

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://quotes.toscrape.com"


def parse_quotes(soup):
    """Extract {"text", "author", "tags"} for every quote on one parsed page."""
    quotes = []
    for quote_div in soup.find_all("div", class_="quote"):
        text = quote_div.find("span", class_="text").get_text(strip=True)
        author = quote_div.find("small", class_="author").get_text(strip=True)
        tags = [t.get_text(strip=True) for t in quote_div.find_all("a", class_="tag")]
        quotes.append({"text": text, "author": author, "tags": ", ".join(tags)})
    return quotes


def scrape_all_quotes():
    all_quotes = []
    url = f"{BASE_URL}/"

    while url is not None:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.RequestException as exc:
            print(f"Failed to fetch {url}: {exc}. Stopping here.")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        all_quotes.extend(parse_quotes(soup))

        next_li = soup.find("li", class_="next")
        url = (
            requests.compat.urljoin(url, next_li.find("a")["href"])
            if next_li
            else None
        )
        if url is not None:
            time.sleep(1)  # rate-limit yourself even on a practice site

    return all_quotes


if __name__ == "__main__":
    quotes = scrape_all_quotes()
    with open("quotes.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "author", "tags"])
        writer.writeheader()
        writer.writerows(quotes)
    print(f"Saved {len(quotes)} quotes to quotes.csv")
```

```bash
uv run python scrape.py
```

### Résultat attendu

```
Saved 100 quotes to quotes.csv
```

Un vrai fichier `quotes.csv` apparaît avec une ligne d'en-tête plus une ligne par citation.

### Résolution de problèmes

| Problème | Correction |
|---|---|
| Seulement 10 citations sauvegardées | L'URL `next_li` n'est pas suivie. Vérifiez que `url = requests.compat.urljoin(...)` est à l'intérieur de la conditionnelle, et ne réinitialise pas vers la page d'accueil. |
| Le script se bloque ou est lent | Prévu — `time.sleep(1)` entre ~10 pages signifie ~10 secondes au total. |
| `Failed to fetch ... Stopping here` | Un hoquet réseau ou une expiration. Le script sauvegarde ce qu'il a jusqu'à présent au lieu de planter. |
| `quotes.csv` a des lignes vides | Un `None` ou une chaîne vide a atterri dans la liste des citations. Vérifiez dans la fonction `parse_quotes` les appels `.get_text(strip=True)` manquants. |

### Liste de vérification

- [ ] `uv run python scrape.py` se termine et affiche « Saved N quotes »
- [ ] `quotes.csv` existe avec plus de 10 lignes (preuve que la pagination a fonctionné)
- [ ] Ouvrir `quotes.csv` montre trois colonnes propres : `text`, `author`, `tags`

### Question socratique

Que se passerait-il si la dernière page du site avait encore un lien « Next » dans son HTML mais qu'il n'était pas cliquable ? Comment le vérifieriez-vous avant de vous fier à cette condition d'arrêt sur un autre site ?

---

## Étape 4 : Nettoyer avec pandas

### Objectif

Charger le CSV récupéré dans pandas et le nettoyer pour l'analyse.

### Explication

Les données récupérées arrivent rarement propres. La colonne `tags` est stockée comme une seule chaîne jointe par des virgules (les cellules CSV ne peuvent pas contenir des listes Python), et les incohérences d'espaces sont courantes. Les outils de chaînes et de vérification de types de pandas rendent le nettoyage rapide à écrire et facile à vérifier.

### Indice de départ

Deux sous-étapes : diviser la colonne `tags` compactée en une vraie liste, puis exécuter des vérifications d'espaces et de types pour détecter les problèmes tôt.

### Code de travail

```python
# analyze.py
import pandas as pd

df = pd.read_csv("quotes.csv")

# Step 4a: Reconstruct the packed tags column
# tags was saved as "tag1, tag2, tag3" — split into a real list column
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)

# Step 4b: Whitespace and dtype sanity checks
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
assert df["text"].notna().all(), "some quotes have no text — check the scrape"

df["quote_length"] = df["text"].str.len()

print(df.head())
print()
print(df.dtypes)
```

```bash
uv run python analyze.py
```

### Résultat attendu

```
                                                text           author  \
0  "Life is like riding a bicycle. To keep your ba...  Albert Einstein
1  "It is our choices, Harry, that show what we tr...     J.K. Rowling
2  "Only two things are infinite, the universe and...  Albert Einstein
3  "The person, as well as the artist, strives for...  Albert Einstein
4  "Imagination is more important than knowledge. ...  Albert Einstein

                               tags  quote_length
0  [change, deep-thoughts, thinking, world]           123
1  [abilities, choices, deep-thoughts, flying, ...           106
2  [humor, infinite, universe]            89
3  [fake, inspectors, life, real]           93
4  [creativity, humor, imagination, life]           107

         text   author    tags  quote_length
0     object   object  object         int64
```

### Résolution de problèmes

| Problème | Correction |
|---|---|
| `AttributeError: 'float' has no attribute 'split'` | Un `NaN` s'est glissé. Confirmez que `.fillna("")` a été exécuté avant `.apply`. |
| `df["tags"]` contient toujours des chaînes | Le résultat de `.apply` n'a pas été réassigné. Vérifiez que vous n'avez pas supprimé le préfixe `df["tags"] =`. |
| `AssertionError: some quotes have no text` | Quelque chose en amont a sauvegardé une ligne avec un texte manquant. Inspectez `quotes.csv` directement pour les cellules `text` vides. |
| `quote_length` montre le type `object` | `.str.len()` a été appelé sur la mauvaise colonne ou avant le dépouillement. Vérifiez qu'il est appliqué au `df["text"]` déjà dépouillé. |

### Liste de vérification

- [ ] `type(df["tags"].iloc[0])` affiche `<class 'list'>`, pas `str`
- [ ] `df["quote_length"]` est une colonne numérique sans valeurs manquantes
- [ ] `df.head()` montre un texte propre sans espaces parasites en tête ou en fin

### Question socratique

Si la cellule `tags` d'une ligne était vide (une citation sans tags), que retournerait `raw.split(",")` ? Le filtre `if tag.strip()` gère-t-il correctement ce cas ? Testez-le.

---

## Étape 5 : Analyser et visualiser

### Objectif

Produire des graphiques et des statistiques récapitulatives à partir des données nettoyées.

### Explication

Avec des colonnes propres et typées, l'analyse est quelques lignes de `groupby` / `value_counts` — le même modèle que les notebooks pandas, juste pointé sur des données que vous avez récupérées vous-même. Trois graphiques : les tags les plus courants, les auteurs les plus cités, et la distribution des longueurs de citations.

### Indice de départ

Trois sous-étapes, une par graphique. Utilisez `explode` pour la colonne `tags` (une ligne par tag), `value_counts` pour les comptages catégoriels, et `hist` pour la distribution numérique.

### Code de travail

```python
# analyze.py (continued)
import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("quotes.csv")

# Clean (same as Step 4)
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
df["quote_length"] = df["text"].str.len()

# Chart 1: Top 10 tags
exploded = df.explode("tags")
exploded = exploded[exploded["tags"] != ""]
tag_counts = exploded["tags"].value_counts().head(10)

fig, ax = plt.subplots(figsize=(8, 5))
tag_counts.sort_values().plot(kind="barh", ax=ax, color="#3b82f6")
ax.set_xlabel("Number of quotes")
ax.set_ylabel("Tag")
ax.set_title("Top 10 tags on quotes.toscrape.com")
ax.set_xlim(left=0)
fig.tight_layout()
fig.savefig("top_tags.png")
plt.close()

# Chart 2: Most-quoted authors
most_quoted = df["author"].value_counts().head(5)
print("Most-quoted authors:")
print(most_quoted)

# Chart 3: Quote-length distribution
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(df["quote_length"], bins=20, color="#3b82f6", edgecolor="white")
ax.set_xlabel("Quote length (characters)")
ax.set_ylabel("Number of quotes")
ax.set_title("Distribution of quote lengths")
fig.tight_layout()
fig.savefig("quote_length_dist.png")
plt.close()

print("\nSaved top_tags.png and quote_length_dist.png")
```

```bash
uv run python analyze.py
```

### Résultat attendu

```
Most-quoted authors:
author
Albert Einstein    10
André Gide          5
J.K. Rowling        3
...
dtype: int64

Saved top_tags.png and quote_length_dist.png
```

Deux fichiers image apparaissent : `top_tags.png` (graphique à barres horizontal, barre la plus longue en haut, axe x démarrant à 0) et `quote_length_dist.png` (histogramme avec une vraie forme, la plupart des citations regroupées dans les basses centaines de caractères).

### Résolution de problèmes

| Problème | Correction |
|---|---|
| Graphique à barres vide ou tout à zéro | `exploded["tags"] != ""` a tout filtré. Vérifiez que la construction de liste de l'étape 4 a bien supprimé les chaînes vides. |
| L'axe x ne démarre pas à 0 | La ligne `ax.set_xlim(left=0)` a été supprimée. |
| L'histogramme est une seule barre pleine | `quote_length` n'a pas de variation. Revérifiez qu'il a été calculé à partir du `text` dépouillé. |
| `top_tags.png` ne se sauvegarde pas | Confirmez que `fig.savefig(...)` est appelé sur le même objet `fig` que celui retourné par `plt.subplots()`. |
| Les barres semblent raisonnables mais diffèrent de l'attendu | Le jeu de données est en direct — les comptages changent au fil des mises à jour du site source. |

### Liste de vérification

- [ ] `top_tags.png` et `quote_length_dist.png` existent tous deux et s'ouvrent comme de vraies images
- [ ] L'axe x du graphique à barres commence à 0
- [ ] Les deux graphiques ont un titre et des axes étiquetés
- [ ] L'histogramme montre une vraie forme de distribution, pas une seule barre plate

### Question socratique

Si vous définissiez `ax.set_xlim(left=5)` au lieu de `0` sur le graphique à barres, comment la différence visuelle entre le premier et le dixième tag changerait-elle, même si les comptages sous-jacents n'ont pas du tout changé ?

---

## Étape 6 : Exporter les résultats

### Objectif

Sauvegarder le jeu de données nettoyé et prêt pour l'analyse pour le réutiliser.

### Explication

Le CSV est le format d'échange le plus simple, mais la version nettoyée (avec de vraies colonnes de listes) ne se sérialise pas proprement. Deux approches : exporter une version plate pour une utilisation dans un tableur, ou utiliser JSON pour préserver les listes.

### Code de travail

```python
# analyze.py (continued)

# Flat CSV: tags joined back to a string for spreadsheet compatibility
df["tags_flat"] = df["tags"].apply(lambda t: ", ".join(t))
df[["text", "author", "tags_flat", "quote_length"]].to_csv(
    "quotes_clean.csv", index=False
)
print(f"Saved quotes_clean.csv with {len(df)} rows")

# JSON: preserves list structure
df.to_json("quotes_clean.json", orient="records", indent=2)
print("Saved quotes_clean.json")
```

### Résultat attendu

```
Saved quotes_clean.csv with 100 rows
Saved quotes_clean.json
```

Deux nouveaux fichiers : `quotes_clean.csv` (plat, adapté au tableur) et `quotes_clean.json` (préserve les listes de tags comme tableaux).

### Liste de vérification

- [ ] `quotes_clean.csv` existe et s'ouvre dans un tableur ou un éditeur de texte
- [ ] `quotes_clean.json` contient du JSON valide avec des tableaux pour le champ `tags`

### Question socratique

Pourquoi l'export CSV a-t-il besoin de `tags_flat` (une chaîne) au lieu d'écrire la liste directement ? Quel format est naturellement adapté aux données imbriquées comme des listes de chaînes, et quels compromis chaque format implique-t-il ?

---

## Défis

Une fois le pipeline de base fonctionnel, essayez ces extensions :

### Défi 1 : Extraire les pages d'auteurs

Chaque nom d'auteur sur quotes.toscrape.com mène à une page bio avec une date de naissance et un lieu de naissance. Étendez `parse_quotes` pour suivre chaque lien d'auteur, récupérer la page bio, et ajouter des colonnes `birth_date` et `birthplace` au DataFrame. Cela introduit la résolution d'URL relatives et le parcours de pages multi-niveaux.

### Défi 2 : Récupérer un site basé sur des tableaux

Ciblez un site avec des éléments HTML `<table>` au lieu de cartes `<div>` — par exemple, un tableau comparatif de Wikipedia. Utilisez BeautifulSoup pour trouver les balises `<tr>` et `<td>`, puis alimentez les lignes dans un DataFrame avec `pd.DataFrame(rows, columns=headers)`. La logique d'analyse change, mais le pipeline récupérer-nettoyer-analyser reste le même.

### Défi 3 : Ajouter une limitation de taux et une logique de relance

Remplacez le `time.sleep(1)` fixe par un backoff exponentiel : sur une requête échouée, attendez 1 seconde, puis 2, puis 4, jusqu'à un maximum. Combinez cela avec `requests.adapters.HTTPAdapter` pour des relances automatiques. C'est le modèle utilisé par les scrapers de production.

### Défi 4 : Visualiser les tendances dans le temps

Si vous avez exécuté le scraper plusieurs fois avec des horodatages, tracez comment la popularité des tags ou les comptages d'auteurs changent entre les exécutions. Utilisez `matplotlib` avec plusieurs lignes ou un graphique en aires empilées.

---

## Ce que vous avez appris

1. **Les requêtes HTTP** — `requests.get()` avec `raise_for_status()` et des délais d'expiration pour une récupération robuste.
2. **L'analyse HTML** — `BeautifulSoup` avec `find` / `find_all` et les sélecteurs de classe CSS.
3. **La pagination** — suivre les liens « Next » avec `urljoin` au lieu de coder en dur les nombres de pages.
4. **La gestion des erreurs** — `try`/`except` autour des appels réseau pour préserver la progression partielle.
5. **Le nettoyage des données** — diviser les colonnes compactées, dépouiller les espaces, affirmer les invariants.
6. **La visualisation** — graphiques à barres, histogrammes, et les règles d'honnêteté (axes étiquetés, axe x à 0, titres descriptifs).
7. **L'étiquette du scraping** — limiter le taux avec `sleep`, respecter `robots.txt`.

Le pipeline se généralise : remplacez par un autre site favorable au scraping, et les mêmes cinq étapes — requête, analyse, suivi de la pagination, nettoyage, graphique — sont encore tout le pipeline.

## Où aller à partir d'ici

- **D'autres sites** — lisez d'abord le `robots.txt` et les conditions d'utilisation de chaque site ; le HTML de chaque site est différent, vous devrez donc inspecter son balisage vous-même.
- **SQLite** — remplacez le CSV par le module intégré `sqlite3` de Python une fois que les données dépassent un seul fichier.
- **La planification** — exécutez le scraper périodiquement avec cron ou une boucle, en ajoutant une colonne d'horodatage pour suivre comment les données changent dans le temps.
- **Scrapy** — un framework complet pour le scraping à grande échelle avec concurrence intégrée, middleware, et pipelines d'export.

---

## Partagez votre projet

Vous avez construit quelque chose dont vous êtes fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis. Son README a un guide accessible aux débutants pour ajouter le vôtre via une pull request — forker le dépôt, créer une branche, valider, et ouvrir la PR. Aucune expérience préalable de git requise.