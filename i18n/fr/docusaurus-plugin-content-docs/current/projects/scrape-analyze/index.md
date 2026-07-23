---
id: scrape-analyze
title: "Scraper et analyser un site web en direct"
sidebar_label: "Scraper et analyser un site web"
slug: /projects/scrape-analyze
description: "Passez du bac à sable dans le navigateur à du vrai Python : scrapez un vrai site web, nettoyez les données avec pandas, et produisez vos propres graphiques — sans clé API nécessaire."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Scraper et analyser un site web en direct

<ProjectPublishedDate projectId="scrape-analyze" />

<ProjectGreeting />

Chaque jeu de données de la section Data Analysis jusqu'ici est arrivé sous forme de CSV prêt à l'emploi, déjà posé dans `static/datasets/`, attendant d'être chargé avec `pd.read_csv`. La vraie analyse commence rarement là — d'habitude, vous devez aller chercher les données vous-même. Ce projet est cette étape : récupérer une vraie page web en direct via HTTP, analyser le HTML en lignes structurées, nettoyer le résultat avec pandas, et produire votre propre petite analyse avec des graphiques. Il suppose une aisance avec pandas au niveau du track Normal de Data Analysis — sélection, filtrage, `groupby`, nettoyage de base — les mêmes compétences que vous avez déjà utilisées pour reproduire un notebook d'EDA guidé. Ce projet vous demande de pointer ces mêmes compétences vers des données que personne ne vous a données.

Ceci est optionnel et non noté. Voir [Projets concrets](/docs/projects) pour la liste complète, qui s'enrichit au fil du temps.

## 🎯 Ce que vous allez faire

1. Installer `uv` et configurer un projet local.
2. Récupérer une vraie page web avec `requests` et analyser son HTML avec `beautifulsoup4`.
3. Suivre les liens de pagination pour collecter les données de tout un site dans un CSV.
4. Charger ce CSV dans pandas et le nettoyer — en séparant une colonne de chaîne compacte, en vérifiant les espaces et les types de données.
5. Analyser les données nettoyées et produire quelques graphiques honnêtes et correctement étiquetés avec `matplotlib`.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et celui recommandé — c'est du vrai Python qui tourne sur votre propre machine, le même geste de « passage au vrai Python » que chaque autre projet de cette section. L'étape 1 ci-dessous explique comment l'installer.

**GitHub Codespaces** est une alternative sans configuration si vous préférez ne rien installer localement pour l'instant : ouvrez [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécutez exactement les mêmes commandes `uv` depuis un terminal dans votre onglet de navigateur.

**Google Colab ou les notebooks Kaggle** conviennent véritablement bien à ce projet en particulier, pas juste comme solution de repli — il n'y a pas de serveur de fichiers local, pas de GPU, et pas de processus de longue durée à gérer, et l'affichage en ligne des graphiques est exactement ce qu'un notebook fait bien. Exécutez `!pip install requests beautifulsoup4 pandas matplotlib` dans une cellule, puis collez les scripts ci-dessous comme cellules de notebook, en adaptant les chemins de fichiers (par ex. en sauvegardant `quotes.csv` dans le répertoire de travail du notebook plutôt que sur votre propre machine) selon le besoin. C'est une façon confortable et légitime de faire ce projet de bout en bout sans quitter le navigateur.

## Étape 1 : installer `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis installer pip, puis installer un outil d'environnement virtuel, puis installer les paquets » — il peut installer et gérer lui-même les versions de Python, en plus des dépendances de votre projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Fermez et rouvrez votre terminal, puis confirmez l'installation :

```bash
uv --version
```

Configurez ensuite un projet local :

```bash
uv init scrape-analyze
cd scrape-analyze
uv add requests beautifulsoup4 pandas matplotlib
```

Remarquez ce qui manque à cette liste : pas de clé API, pas d'inscription à un palier gratuit, rien à configurer avant de pouvoir exécuter une seule ligne de code — juste votre propre script et un vrai site web. C'est un contraste délibéré avec les projets à saveur IA de cette section, et l'une des raisons pour lesquelles le scraping est une bonne prochaine étape à essayer.

## Étape 2 : récupérer et analyser la page

Ce projet cible [quotes.toscrape.com](https://quotes.toscrape.com) — un site public construit et maintenu spécifiquement pour la pratique du scraping. Il n'a pas de mur de connexion, pas de limitation de débit à combattre, une structure HTML stable et bien organisée, et de la pagination, des tags, et des pages d'auteurs avec lesquels travailler. Cela compte : scraper un vrai site commercial soulève de vraies questions sur ses conditions d'utilisation et son `robots.txt`, que cette leçon contourne délibérément en utilisant un site construit exactement pour cet usage.

:::tip[Vérifiez toujours robots.txt avant de scraper ailleurs]
Avant de pointer ce code vers un autre site que quotes.toscrape.com, vérifiez le `robots.txt` de ce site (par ex. `https://example.com/robots.txt`) et ses conditions d'utilisation. `robots.txt` indique quelles parties d'un site les outils automatisés sont autorisés ou non à récupérer — le respecter est l'attente de base pour tout scraper, et certains sites interdisent explicitement le scraping dans leurs conditions même quand `robots.txt` reste silencieux.
:::

Une requête HTTP `GET` est la même chose que fait votre navigateur chaque fois que vous visitez une page — elle demande une URL à un serveur et récupère le HTML brut sous forme de texte. `requests` fait ça en une ligne :

```python
import requests

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()  # turns a 404/500 into a loud exception instead of a silent bad parse
html = response.text
```

Cette chaîne `html` est un arbre de balises imbriquées — `<div>`, `<span>`, `<a>` — chacune portant éventuellement des attributs comme `class` ou `href`. BeautifulSoup analyse ce texte en un arbre navigable et vous donne deux outils principaux pour le chercher : `find` (la première correspondance) et `find_all` (chaque correspondance), tous deux filtrables par nom de balise et par attributs comme `class_`. Ouvrez le code source de la page dans votre navigateur (« Afficher le code source de la page ») et vous verrez que chaque citation se trouve dans un `<div class="quote">`, avec le texte de la citation dans un `<span class="text">`, l'auteur dans un `<small class="author">`, et chaque tag dans un `<a class="tag">`.

```python
# scrape.py
import time

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

time.sleep(1)  # see the tip below
```

```bash
uv run python scrape.py
```

Vous devriez voir dix lignes affichées, une par citation de la page d'accueil.

:::tip[Limitez votre propre débit, même sur un site d'entraînement]
`time.sleep(1)` entre les requêtes n'est pas strictement requis par quotes.toscrape.com, mais c'est une habitude qui vaut la peine d'être prise maintenant plutôt qu'après avoir accidentellement bombardé un vrai serveur de dizaines de requêtes par seconde. Un court délai délibéré entre les requêtes est une étiquette standard de scraping — cela évite que votre script ressemble à (ou se comporte comme) une tentative de déni de service, et c'est une assurance bon marché contre le blocage temporaire de votre IP sur les sites qui font respecter des limites.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python scrape.py` s'exécute sans erreur.</StepChecklistItem>
<StepChecklistItem>Il affiche exactement 10 lignes, une par citation de la page d'accueil.</StepChecklistItem>
<StepChecklistItem>Chaque ligne affichée a un vrai texte, un vrai nom d'auteur, et une liste de tags non vide — pas `None` ni des chaînes vides.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `.get_text(strip=True)` et `.text` retournent tous deux le contenu texte d'une balise, mais un seul des deux supprime les espaces en début/fin. Qu'est-ce qui casserait plus tard dans ce projet — spécifiquement dans l'étape de nettoyage de l'étape 4 — si vous utilisiez `.text` partout à la place ?
- Le texte des citations sur la page est entouré de guillemets courbes (`« … »`), pas droits. Si vous comparez plus tard le texte d'une citation à une chaîne codée en dur, qu'est-ce qui pourrait mal tourner, et comment le remarqueriez-vous ?

## Étape 3 : gérer la pagination et collecter toutes les données

quotes.toscrape.com répartit ses citations sur plusieurs pages, avec un lien « Next » en bas de chaque page sauf la dernière. Plutôt que de coder en dur « boucler 10 fois », suivez le lien lui-même — ainsi le script continue de fonctionner même si le nombre de pages change :

```python
# scrape.py (continued)
import csv

BASE_URL = "https://quotes.toscrape.com"


def parse_quotes(soup):
    """Extracts {"text", "author", "tags"} for every quote on one parsed page."""
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
            # One failed request shouldn't kill a scrape that already collected
            # data from several pages -- log it and stop cleanly instead of crashing.
            print(f"Failed to fetch {url}: {exc}. Stopping here.")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        all_quotes.extend(parse_quotes(soup))

        next_li = soup.find("li", class_="next")
        url = requests.compat.urljoin(url, next_li.find("a")["href"]) if next_li else None
        if url is not None:
            time.sleep(1)

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

Le `try`/`except` autour de la requête est l'ajout important ici, pas une formalité : sans lui, une seule requête capricieuse à la page 7 sur 10 lèverait une exception non gérée et perdrait les six pages déjà récupérées, au lieu de sauvegarder ce que vous avez et de s'arrêter proprement. `requests.compat.urljoin` transforme le `href` relatif du lien « Next » (comme `/page/2/`) en une URL complète en la combinant avec l'URL de la page actuelle — la même chose que fait automatiquement votre navigateur quand vous cliquez sur un lien relatif.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python scrape.py` se termine et affiche une ligne « Saved N quotes ».</StepChecklistItem>
<StepChecklistItem>`quotes.csv` existe et a plus de 10 lignes (c'est-à-dire qu'il a effectivement suivi la pagination, pas juste la page d'accueil).</StepChecklistItem>
<StepChecklistItem>Ouvrir `quotes.csv` dans un éditeur de texte montre trois colonnes — `text`, `author`, `tags` — sans lignes manifestement cassées ou vides.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Que se passerait-il pour votre scraper si le site ajoutait un dixième champ à chaque citation — disons, une année de publication ? Comment le remarqueriez-vous, et comment adapteriez-vous `parse_quotes` pour le récupérer ?
- La boucle s'arrête quand `find("li", class_="next")` retourne `None`. Que se passerait-il si la dernière page du site avait quand même un lien « Next » (d'apparence désactivée) dans son HTML, juste non cliquable ? Comment vérifieriez-vous cela avant de faire confiance à cette condition d'arrêt sur un autre site ?

## Étape 4 : nettoyer et charger dans pandas

La section 2 a introduit pandas comme la solution aux boucles Python simples devenant lentes à mesure que les données grandissent — des opérations vectorisées en C au lieu d'une boucle `for` Python sur chaque ligne. Les données scrapées ajoutent une seconde raison, tout aussi réelle, d'y avoir recours : elles arrivent rarement propres, et les outils de chaînes de caractères et de vérification de types de pandas rendent le nettoyage rapide à écrire et facile à vérifier.

```python
# analyze.py
import pandas as pd

df = pd.read_csv("quotes.csv")

# tags was saved as a single "tag1, tag2, tag3" string -- split it into a real
# list column so each tag can be counted separately.
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)

# Whitespace and dtype sanity checks -- cheap to do, easy to skip, and the kind
# of thing that silently breaks a groupby later if left unchecked.
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
assert df["text"].notna().all(), "some quotes have no text -- check the scrape"

df["quote_length"] = df["text"].str.len()
print(df.head())
print(df.dtypes)
```

Deux choses à remarquer ici. D'abord, `tags` est stocké dans le CSV comme une seule chaîne jointe par des virgules parce que les cellules CSV ne peuvent pas contenir une vraie liste Python — reconstruire la liste au chargement, avec `.apply`, est le motif standard pour toute colonne « compactée » de ce genre. Ensuite, `df["text"].str.len()` calculant la longueur de chaque citation en un seul appel vectorisé, au lieu d'une boucle Python appelant `len()` ligne par ligne, est exactement l'argument de vitesse de la section 2 — juste appliqué à des données que vous avez récupérées vous-même plutôt qu'à un CSV fourni.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`df["tags"]` contient de vraies listes Python après l'appel `.apply`, pas des chaînes — vérifiez avec `type(df["tags"].iloc[0])`.</StepChecklistItem>
<StepChecklistItem>`df["quote_length"]` est une colonne numérique sans valeurs manquantes.</StepChecklistItem>
<StepChecklistItem>`df.head()` montre du texte propre sans espaces parasites en début/fin.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si la cellule `tags` d'une ligne était vide (une citation sans tags), que retournerait `raw.split(",")`, et le filtre `if tag.strip()` dans la liste en compréhension gère-t-il correctement ce cas ? Testez-le.
- Pourquoi calculer `quote_length` à partir de `text` après avoir supprimé les espaces plutôt qu'avant ? Quel nombre serait faux si vous le calculiez avant ?

## Étape 5 : analyser et visualiser

Avec des colonnes propres et typées, l'analyse elle-même tient en quelques lignes de `groupby`/`value_counts`, exactement comme les notebooks guidés de la section 2 — la différence est que ces données proviennent de votre propre scraper, pas d'un fichier fourni.

**Tags les plus courants** — `explode` transforme la colonne liste-de-tags en une ligne par tag, pour que `value_counts` puisse les compter individuellement :

```python
import matplotlib.pyplot as plt

exploded = df.explode("tags")
exploded = exploded[exploded["tags"] != ""]
tag_counts = exploded["tags"].value_counts().head(10)

fig, ax = plt.subplots(figsize=(8, 5))
tag_counts.sort_values().plot(kind="barh", ax=ax, color="#3b82f6")
ax.set_xlabel("Number of quotes")
ax.set_ylabel("Tag")
ax.set_title("Top 10 tags on quotes.toscrape.com")
ax.set_xlim(left=0)  # bar charts should start at 0 -- Data Analysis Hard Week 9's chart-honesty rule
fig.tight_layout()
fig.savefig("top_tags.png")
```

**Auteurs les plus cités :**

```python
most_quoted = df["author"].value_counts().head(5)
print(most_quoted)
```

**Distribution des longueurs de citation** — un histogramme, pour voir la forme des données plutôt qu'une simple moyenne :

```python
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(df["quote_length"], bins=20, color="#3b82f6", edgecolor="white")
ax.set_xlabel("Quote length (characters)")
ax.set_ylabel("Number of quotes")
ax.set_title("Distribution of quote lengths")
fig.tight_layout()
fig.savefig("quote_length_dist.png")
```

Les deux graphiques suivent les mêmes règles d'honnêteté de la semaine 9 du track Difficile de Data Analysis : les axes sont étiquetés, l'axe des x du graphique en barres commence à 0 plutôt que d'être tronqué pour exagérer de petites différences, et les titres disent exactement ce qui est compté plutôt que de le laisser deviner.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`top_tags.png` et `quote_length_dist.png` existent tous les deux et s'ouvrent comme de vraies images.</StepChecklistItem>
<StepChecklistItem>L'axe des x du graphique en barres commence à 0.</StepChecklistItem>
<StepChecklistItem>Les deux graphiques ont un titre et des axes étiquetés — pas de nombres nus sans unités.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si vous mettiez `ax.set_xlim(left=5)` au lieu de `0` pour le graphique en barres, comment la différence *visuelle* entre le premier et le dixième tag changerait-elle, même si les comptages sous-jacents n'ont pas du tout changé ?
- L'histogramme utilise `bins=20`. Essayez `bins=5` et `bins=50` sur les mêmes données. La forme de la distribution semble-t-elle significativement différente selon le nombre de bins — et si oui, qu'est-ce que cela vous dit sur à quel point les *paramètres* d'un histogramme, pas seulement ses données, façonnent l'histoire qu'il raconte ?

## ⚠️ Pièges courants

- **Scraper trop vite et se faire limiter ou bloquer.** Même un site conçu pour la pratique peut ralentir ou rejeter des requêtes envoyées sans aucun délai entre elles. Les appels `time.sleep()` des étapes 2-3 ne sont pas décoratifs — retirez-les et vous êtes plus susceptible de voir des erreurs de connexion ou des pages manquantes, surtout sur un vrai site (non conçu pour la pratique).
- **La structure HTML change et casse vos sélecteurs.** `find("div", class_="quote")` ne fonctionne que parce que c'est le nom de classe *actuel* sur quotes.toscrape.com. Les sites changent leur balisage avec le temps (une refonte, un test A/B, un nouveau framework CSS) ; un scraper qui fonctionnait hier peut silencieusement arrêter de trouver quoi que ce soit aujourd'hui. Si un scraping retourne zéro résultat, vérifiez le HTML de la page en direct avant de supposer que votre code est le problème.
- **Oublier `try`/`except` autour des appels réseau.** Une requête capricieuse ou un timeout, à la page 7 sur 10, sans `try`/`except`, lève une exception non gérée et perd tout ce qui a déjà été collecté. La version de l'étape 3 capture `requests.RequestException` et sauvegarde ce qu'elle a.
- **Confondre `.text` avec `.get_text(strip=True)`.** La propriété `.text` de BeautifulSoup retourne le contenu texte d'une balise tel quel, y compris tout espace environnant provenant de l'indentation propre du HTML ; `.get_text(strip=True)` le supprime. Sauter `strip=True` est une source courante de comparaisons de chaînes et de regroupements silencieusement cassés plus tard — deux noms d'auteur « identiques » qui ne correspondent pas parce que l'un a un espace de fin.

## Ce que vous venez de construire

Un pipeline complet et honnête récupération → analyse → nettoyage → analyse → visualisation, tournant contre un vrai site web en direct plutôt qu'un fichier que quelqu'un d'autre a préparé pour vous. Rien ici n'a été simplifié en un jouet qui ne se généralise pas : remplacez par un autre site adapté au scraping, et les cinq mêmes étapes — demander la page, analyser le HTML, suivre la pagination, nettoyer le résultat avec pandas, le représenter graphiquement — restent le pipeline entier.

## Où aller à partir d'ici

- Essayez de scraper un site différent, après avoir vraiment lu son `robots.txt` et ses conditions d'utilisation au préalable — la structure tag/auteur ici est un modèle raisonnable, mais le HTML de chaque site est différent, donc vous devrez inspecter son balisage vous-même plutôt que de réutiliser exactement ces sélecteurs.
- Remplacez le CSV par une petite **base de données SQLite** (le module intégré `sqlite3` de Python ne nécessite aucune installation séparée) — un meilleur choix une fois qu'un jeu de données dépasse ce qui tient confortablement dans un seul CSV, ou si vous voulez l'interroger avec SQL plutôt qu'avec pandas.
- Planifiez le scraper pour qu'il tourne périodiquement (une tâche cron, ou une simple boucle avec un long `time.sleep()`) et ajoutez les résultats de chaque exécution avec une colonne d'horodatage, pour pouvoir suivre comment les données changent au fil du temps — un jeu de données réel comme celui-ci reste rarement statique pour toujours.

## Partagez votre projet avec la classe

Vous avez construit quelque chose dont vous êtes fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README a un guide complet et accessible aux débutants pour ajouter le vôtre via une **pull request**, même si vous n'avez jamais utilisé git auparavant : forker le dépôt, créer une branche, valider vos fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est présumée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="scrape-analyze" />
