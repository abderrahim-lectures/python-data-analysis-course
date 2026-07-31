---
id: job-aggregator
title: "Construire un Agrégateur d'Offres d'Emploi"
sidebar_label: "Agrégateur d'Offres d'Emploi"
slug: /projects/job-aggregator
description: "Scrape plusieurs sources façon plateforme d'emploi, déduplique les annonces entre elles, et alerte sur les nouvelles correspondances par rapport à un filtre de mots-clés — avec requests/BeautifulSoup et pandas, aucune clé API nécessaire."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Agrégateur d'Offres d'Emploi

<ProjectPublishedDate projectId="2027-job-aggregator" />

<ProjectGreeting />

[Scraper et Analyser un Site Web en Direct](/docs/projects/scrape-analyze) a récupéré un site et transformé son HTML en CSV. La vraie recherche d'emploi signifie surveiller *plusieurs* sources à la fois, dont aucune ne s'accorde sur le balisage, et ne se soucier que de ce qui est authentiquement nouveau depuis ta dernière vérification. Ce projet construit ça : analyse les annonces d'une poignée de pages « plateforme d'emploi » structurées différemment, combine-les en une seule table, déduplique les publications qui apparaissent sur plus d'une plateforme, filtre vers les postes qui correspondent à un mot-clé qui t'intéresse, et n'alerte que sur les nouvelles correspondances — pas les dix mêmes annonces à chaque exécution. Cela suppose du Python de niveau Python 101 et, pour l'étape de déduplication/filtrage, de l'aisance avec pandas au niveau Analyse de Données — filtrage, `drop_duplicates`, masques booléens.

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Analyser le HTML d'une seule page d'offre d'emploi en champs structurés avec BeautifulSoup.
2. Écrire un petit analyseur par source et combiner plusieurs sources structurées différemment en une seule table.
3. Dédupliquer les annonces publiées sur plus d'une plateforme, en utilisant pandas.
4. Filtrer par mot-clé et afficher/sauvegarder seulement les correspondances nouvelles depuis la dernière exécution.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et le recommandé — c'est du vrai Python tournant sur ta propre machine, le même mouvement « gradue vers du vrai Python » que tout autre projet de cette section. La section Configuration ci-dessous explique comment l'installer.

**GitHub Codespaces** est une alternative sans configuration si tu préfères ne rien installer localement pour l'instant : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute exactement les mêmes commandes `uv` depuis un terminal dans ton onglet de navigateur.

**Google Colab, Kaggle Notebooks, ou Binder** sont authentiquement bien adaptés à ce projet en particulier — pas de GPU, pas de clé API, pas de processus de longue durée à gérer, et tout le pipeline tient confortablement dans une poignée de cellules. Une version notebook réelle et exécutable (les mêmes analyseurs, clé de déduplication, et filtre de mots-clés que les étapes ci-dessous) vit dans [`examples/job-aggregator/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/notebook.ipynb). Clique sur un badge pour le lancer directement, sans aucune installation locale :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fjob-aggregator%2Fnotebook.ipynb)

Sois honnête avec toi-même sur le compromis, cependant : c'est une façon de moindre fidélité de vivre le projet qu'un vrai projet `uv` local — pas de fichiers séparés, pas de vraie structure de projet, juste des cellules dans un notebook. Traite-le comme une façon rapide d'expérimenter, pas le chemin principal.

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

Puis configure un projet local :

```bash
uv init job-aggregator
cd job-aggregator
uv add beautifulsoup4 pandas
```

Pas de clé API, pas d'inscription gratuite, rien à configurer avant de pouvoir exécuter une seule ligne de code.

## Une note sur ce que ce projet scrape

Les vraies plateformes d'emploi — LinkedIn, Indeed, et sites similaires — interdisent explicitement le scraping automatisé dans leurs conditions d'utilisation, détectent et bloquent activement les scrapers, et changent leur balisage assez souvent pour que toute leçon construite contre eux casse en quelques mois. Rien de tout ça n'est une bonne base pour un projet de cours censé continuer à fonctionner pendant des années.

À la place, ce projet est fourni avec son propre petit **jeu de données d'exemple intégré** : trois fichiers HTML statiques sous [`examples/job-aggregator/sample_data/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/job-aggregator/sample_data), chacun stylisé comme une « plateforme d'emploi » jouet différente (`board_alpha.html`, `board_beta.html`, `board_gamma.html`), chacun utilisant un HTML authentiquement différent pour ses annonces — une disposition de carte div-et-span, une liste à puces, et une `<table>` simple. Deux des dix annonces parmi elles sont le même emploi publié sur plus d'une plateforme, exprès, pour qu'il y ait quelque chose de réel à dédupliquer. Tu analyses du vrai HTML avec de vrais appels BeautifulSoup tout du long — la seule différence par rapport au scraping d'un site en direct est que `requests.get()` est remplacé par la lecture d'un fichier local, donc la leçon ne dépend jamais du temps de disponibilité, du balisage, ou de la tolérance au scraping d'un site externe.

:::tip[Vérifie toujours robots.txt et les conditions d'utilisation avant de scraper un vrai site]
Si tu étends ce projet pour pointer vers une vraie plateforme d'emploi en direct ou tout autre vrai site, vérifie d'abord le `robots.txt` de ce site (ex. `https://example.com/robots.txt`) et ses conditions d'utilisation. `robots.txt` indique quelles parties d'un site les outils automatisés sont et ne sont pas autorisés à récupérer. Beaucoup de plateformes d'emploi vont plus loin et interdisent explicitement le scraping dans leurs conditions — lis-les, pas juste `robots.txt`, puisqu'un site peut autoriser une URL dans `robots.txt` tout en interdisant l'accès automatisé dans ses conditions d'utilisation.
:::

## Étape 1 : Analyse une seule page d'annonces en champs structurés

Ouvre [`board_alpha.html`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/sample_data/board_alpha.html) dans un éditeur de texte. Chaque annonce se trouve dans un `<div class="job-card">`, avec le titre dans un `<h2 class="job-title">`, l'entreprise dans un `<span class="company">`, le lieu dans un `<span class="location">`, et une description dans un `<p class="description">`. C'est le même pattern `find`/`find_all` que Scraper et Analyser un Site Web en Direct, juste appliqué à un fichier local plutôt qu'à une réponse en direct :

```python
# aggregate.py
from pathlib import Path

from bs4 import BeautifulSoup

html = Path("sample_data/board_alpha.html").read_text(encoding="utf-8")
soup = BeautifulSoup(html, "html.parser")

for card in soup.find_all("div", class_="job-card"):
    title = card.find("h2", class_="job-title").get_text(strip=True)
    company = card.find("span", class_="company").get_text(strip=True)
    location = card.find("span", class_="location").get_text(strip=True)
    description = card.find("p", class_="description").get_text(strip=True)
    print(f"{title} @ {company} ({location})")
```

```bash
uv run python aggregate.py
```

Tu devrais voir quatre lignes affichées, une par annonce sur la plateforme d'Alpha.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python aggregate.py` s'exécute sans erreur.</StepChecklistItem>
<StepChecklistItem>Il affiche exactement 4 lignes, une par annonce dans `board_alpha.html`.</StepChecklistItem>
<StepChecklistItem>Chaque ligne a un vrai titre, entreprise, et lieu — pas `None` ou une chaîne vide.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `.get_text(strip=True)` retire les espaces en début/fin du texte d'une balise. Qu'est-ce qui pourrait mal tourner deux étapes plus tard, quand tu compares les titres entre plateformes pour dédupliquer, si tu avais laissé `strip=True` de côté ?
- Chaque champ ici est requis par l'analyseur (`card.find(...)` appelle immédiatement `.get_text(...)` sur le résultat). Que se passe-t-il si une annonce sur une plateforme formatée différemment n'a pas son `<span>` de lieu du tout ? Où exactement cela échouerait-il, et comment le message d'erreur t'aiderait-il à le trouver ?

## Étape 2 : Analyse plusieurs sources et combine-les

`board_beta.html` et `board_gamma.html` contiennent le même *type* de données — titre, entreprise, lieu, description — mais aucun n'utilise le balisage d'Alpha. Beta liste les emplois comme des éléments `<li class="listing">` avec un `<a class="position-title">` ; Gamma les liste comme des lignes de tableau `<tr class="job-row">` avec de simples cellules `<td>`. Un seul scraper « un sélecteur convient à toutes les plateformes » n'existe pas — à la place, écris une petite fonction analyseur par source, chacune retournant exactement la même forme de dict, pour que le reste du pipeline n'ait jamais besoin de savoir de quelle plateforme vient une annonce :

```python
# aggregate.py (continued)
def parse_board_alpha(html):
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for card in soup.find_all("div", class_="job-card"):
        listings.append({
            "title": card.find("h2", class_="job-title").get_text(strip=True),
            "company": card.find("span", class_="company").get_text(strip=True),
            "location": card.find("span", class_="location").get_text(strip=True),
            "description": card.find("p", class_="description").get_text(strip=True),
            "source": "board_alpha",
        })
    return listings


def parse_board_beta(html):
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for item in soup.find_all("li", class_="listing"):
        listings.append({
            "title": item.find("a", class_="position-title").get_text(strip=True),
            "company": item.find("div", class_="employer").get_text(strip=True),
            "location": item.find("div", class_="loc").get_text(strip=True),
            "description": item.find("div", class_="summary").get_text(strip=True),
            "source": "board_beta",
        })
    return listings


def parse_board_gamma(html):
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for row in soup.find_all("tr", class_="job-row"):
        cells = row.find_all("td")
        listings.append({
            "title": cells[0].get_text(strip=True),
            "company": cells[1].get_text(strip=True),
            "location": cells[2].get_text(strip=True),
            "description": cells[3].get_text(strip=True),
            "source": "board_gamma",
        })
    return listings


PARSERS = {
    "board_alpha.html": parse_board_alpha,
    "board_beta.html": parse_board_beta,
    "board_gamma.html": parse_board_gamma,
}


def scrape_all_boards():
    all_listings = []
    for filename, parser in PARSERS.items():
        html = (Path("sample_data") / filename).read_text(encoding="utf-8")
        all_listings.extend(parser(html))
    return all_listings


if __name__ == "__main__":
    listings = scrape_all_boards()
    print(f"Parsed {len(listings)} raw listings from {len(PARSERS)} boards")
```

```bash
uv run python aggregate.py
```

Tu devrais voir 10 annonces brutes au total (4 + 3 + 3) — « brutes » parce que rien n'a encore été dédupliqué.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`scrape_all_boards()` retourne 10 annonces.</StepChecklistItem>
<StepChecklistItem>Chaque dict d'annonce a les mêmes cinq clés (`title`, `company`, `location`, `description`, `source`), peu importe de quelle plateforme elle vient.</StepChecklistItem>
<StepChecklistItem>Le champ `source` identifie correctement de quelle plateforme vient chaque annonce.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `PARSERS` associe un nom de fichier à une fonction. Que devrais-tu ajouter pour supporter une quatrième plateforme, sans changer `scrape_all_boards` du tout ?
- `parse_board_gamma` accède à `cells[0]`, `cells[1]`, etc. par position plutôt que par nom de classe, contrairement aux deux autres analyseurs. Qu'est-ce qui casserait silencieusement si le tableau de Gamma ajoutait une nouvelle première colonne (disons, une date de publication) sans que tu le remarques ?

## Étape 3 : Déduplique les annonces avec pandas

Deux des dix annonces sont exactement le même emploi, publié sur deux plateformes différentes : un poste de « Senior Python Developer » chez Northwind Analytics apparaît à la fois sur Alpha et Beta, et un poste de « Data Analyst » chez Contoso Retail apparaît à la fois sur Alpha et Gamma. Laissée telle quelle, une alerte en aval rapporterait la même ouverture deux fois. La solution est une clé de déduplication — quelque chose d'assez stable pour reconnaître « le même emploi » à travers les sources même si le libellé de la description diffère légèrement d'une plateforme à l'autre :

```python
# aggregate.py (continued)
import hashlib
import re

import pandas as pd


def dedupe_key(listing):
    """A stable id for "the same job", independent of which board posted it."""
    normalized = f"{listing['title'].strip().lower()}|{listing['company'].strip().lower()}"
    normalized = re.sub(r"\s+", " ", normalized)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


listings = scrape_all_boards()
for listing in listings:
    listing["dedupe_key"] = dedupe_key(listing)

df = pd.DataFrame(listings)
before = len(df)
df = df.drop_duplicates(subset="dedupe_key", keep="first").reset_index(drop=True)
print(f"Deduped {before} listings -> {len(df)} unique jobs ({before - len(df)} duplicate posting(s) removed)")

df.to_csv("listings.csv", index=False)
```

```bash
uv run python aggregate.py
```

Tu devrais voir « Deduped 10 listings -> 8 unique jobs (2 duplicate posting(s) removed) ».

La clé de déduplication ici est le texte normalisé `title + company`, pas un hash de la ligne entière — délibérément. Hacher toute la ligne (y compris `description`) traiterait les descriptions légèrement différemment libellées d'Alpha et Beta du même emploi comme deux emplois *différents*, annulant le but.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`aggregate.py` affiche « 2 duplicate posting(s) removed ».</StepChecklistItem>
<StepChecklistItem>`listings.csv` a exactement 8 lignes (plus l'en-tête).</StepChecklistItem>
<StepChecklistItem>La ligne « Senior Python Developer » de Northwind Analytics et la ligne « Data Analyst » de Contoso Retail apparaissent chacune exactement une fois dans `listings.csv`.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `drop_duplicates(..., keep="first")` garde la ligne qui se trouve être en premier dans le DataFrame. Pour ces deux emplois dupliqués, la copie de quelle plateforme est gardée, et est-ce important laquelle l'emporte ici ? Quand est-ce que ça *serait* important ?
- Si deux entreprises différentes publiaient par hasard deux emplois différents avec exactement le même titre (ex. deux ouvertures « Data Analyst » sans rapport), cette clé de déduplication les fusionnerait-elle incorrectement ? Pourquoi ou pourquoi pas ?

## Étape 4 : Filtre par mot-clé et alerte sur les nouvelles correspondances

La dernière étape est la moitié « alerte » du projet : filtre les annonces dédupliquées vers celles correspondant à un mot-clé, puis souviens-toi de ce sur quoi tu as déjà alerté pour qu'une seconde exécution contre les mêmes données ne se répète pas :

```python
# filter_alerts.py
import json
from pathlib import Path

import pandas as pd

SEEN_FILE = Path("seen.json")
KEYWORDS = ["python"]


def load_seen():
    if SEEN_FILE.exists():
        return set(json.loads(SEEN_FILE.read_text(encoding="utf-8")))
    return set()


def save_seen(dedupe_keys):
    SEEN_FILE.write_text(json.dumps(sorted(dedupe_keys)), encoding="utf-8")


def keyword_filter(df, keywords):
    pattern = "|".join(keywords)
    text = df["title"].str.cat(df["description"], sep=" ")
    return df[text.str.contains(pattern, case=False, regex=True, na=False)]


if __name__ == "__main__":
    df = pd.read_csv("listings.csv")
    matches = keyword_filter(df, KEYWORDS)
    print(f"{len(matches)} unique listing(s) match keywords {KEYWORDS}")

    seen = load_seen()
    new_matches = matches[~matches["dedupe_key"].isin(seen)]

    if new_matches.empty:
        print("No new matches since the last run.")
    else:
        print(f"\n{len(new_matches)} NEW match(es):\n")
        for _, row in new_matches.iterrows():
            print(f"- {row['title']} @ {row['company']} ({row['location']}) [{row['source']}]")
        new_matches.to_csv("new_matches.csv", index=False)

    save_seen(seen | set(matches["dedupe_key"]))
```

```bash
uv run python filter_alerts.py
```

La première exécution devrait rapporter 6 nouvelles correspondances (chaque annonce dont le titre ou la description mentionne « python »). Relance-le sans rien changer, et il devrait rapporter zéro nouvelle correspondance — `seen.json` se souvient de ce sur quoi il a déjà alerté, exactement comme un vrai agrégateur planifié se connectant chaque matin en aurait besoin.

:::tip[Un filtre de mots-clés n'est que la version la plus simple de « correspond à ce qui m'intéresse »]
`str.contains` avec un pattern joint par `|` est intentionnellement le filtre le plus simple possible — assez bon pour prouver que la logique d'alerte fonctionne. Une version plus réaliste pourrait correspondre à plusieurs *groupes* de mots-clés (ex. « python » OU « django » pour les postes backend, « remote » comme filtre requis séparé sur `location`), ou noter une correspondance selon le nombre de mots-clés touchés plutôt que de la traiter comme réussite/échec. Fais fonctionner la version simple d'abord ; la logique de correspondance est la partie la plus facile à remplacer plus tard.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>La première exécution de `filter_alerts.py` rapporte 6 nouvelles correspondances et crée `new_matches.csv`.</StepChecklistItem>
<StepChecklistItem>Une seconde exécution, sans changement à `listings.csv`, rapporte « No new matches since the last run. »</StepChecklistItem>
<StepChecklistItem>Supprimer `seen.json` et relancer ramène les 6 correspondances comme « nouvelles ».</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si la `description` d'une annonce manquait (`NaN` après un `pd.read_csv`), que ferait `text.str.contains(..., na=False)` avec cette ligne, et pourquoi `na=False` compte-t-il spécifiquement ici ?
- `seen` est stocké comme une liste JSON de clés de déduplication, rechargée à neuf depuis le disque à chaque exécution. Qu'arriverait-il à la garantie « pas d'alertes répétées » si deux copies de ce script s'exécutaient simultanément et lisaient toutes les deux `seen.json` avant que l'une d'elles n'ait eu la chance de le réécrire ?

## ⚠️ Pièges courants

- **Écrire un analyseur universel au lieu d'un par source.** C'est tentant d'essayer un seul ensemble de sélecteurs qui « fonctionne globalement » entre les plateformes. Ça ne marchera pas — Alpha, Beta, et Gamma ne partagent pas un seul nom de classe. Une petite fonction par source, toutes retournant la même forme de dict, c'est moins de code au total que de lutter contre un sélecteur taille unique.
- **Dédupliquer sur la mauvaise clé.** Hacher toute l'annonce (y compris `description`) signifie que deux publications du même emploi avec un libellé légèrement différent ne correspondent jamais, annulant complètement le but de dédupliquer. Choisis une clé stable à travers *comment* un emploi est décrit, pas juste *si* c'est identique mot pour mot.
- **Perdre l'état « nouveau depuis la dernière exécution » entre les exécutions.** Sans quelque chose comme `seen.json` persisté sur disque, chaque exécution re-rapporte chaque correspondance comme nouvelle, ce qui est exactement le comportement bruyant qu'une vraie alerte devrait éviter. C'est aussi le premier endroit où un vrai job cron ou processus en arrière-plan diffère d'un script ponctuel : l'état doit survivre entre les invocations, pas juste vivre dans une variable.
- **Oublier `na=False` dans un filtre de chaîne pandas.** `Series.str.contains` sur une colonne avec des valeurs manquantes lève une exception ou produit des résultats `NaN` sans ça, ce qui peut silencieusement faire disparaître des lignes d'un masque booléen de façons faciles à manquer.

## Ce que tu viens de construire

Un pipeline complet analyser → combiner → dédupliquer → filtrer → alerter : une vraie analyse HTML à travers plusieurs sources structurées différemment, une stratégie de déduplication qui survit à un libellé presque dupliqué, et une alerte par mot-clé qui se souvient de ce qu'elle t'a déjà dit. Pointe les mêmes quatre étapes vers un ensemble différent de sources amicales au scraping (après avoir vérifié leur `robots.txt` et conditions d'utilisation) et le pipeline ne change pas — seules les fonctions analyseur par source changent.

## Où aller à partir d'ici

- Connecte une vraie notification au lieu d'afficher dans le terminal — `smtplib` pour un e-mail, ou un webhook `POST` vers un canal Discord ou Slack, déclenché seulement pour `new_matches`.
- Planifie tout le pipeline pour tourner périodiquement (un job cron, GitHub Actions sur un planning, ou une simple boucle avec `time.sleep()`) pour qu'il vérifie les nouvelles annonces par lui-même plutôt qu'à la main.
- Note les correspondances au lieu de traiter le filtre de mots-clés comme réussite/échec — ex. compte combien de plusieurs groupes de mots-clés une annonce touche, et trie `new_matches` par ce score avant d'alerter.
- Remplace les fichiers CSV/JSON par une petite base de données SQLite (le module intégré `sqlite3` de Python) une fois que tu suis assez d'historique pour vouloir l'interroger — ex. « combien de nouvelles annonces Python sont apparues chaque semaine ce mois-ci ? »

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

<ProjectProgressCheckbox projectId="2027-job-aggregator" />
