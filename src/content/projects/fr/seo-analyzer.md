---
title: "Analyseur SEO"
description: "Analyse les sites web pour les problèmes SEO, balises méta, en-têtes, densité de mots-clés et rapports structurés."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["requests", "beautifulsoup4", "seo", "web-scraping", "pandas"]
learningObjectives:
  - Récupérer et parser des pages web pour extraire les éléments pertinents pour le SEO
  - Auditer les balises méta, les données Open Graph et la hiérarchie des en-têtes
  - Calculer la densité de mots-clés et les scores de contenu
  - Générer des rapports de comparaison structurés avec pandas
prerequisites:
  - "Bases de Python (fonctions, dicts, listes)"
  - "Bases de HTML (balises, attributs, imbrication)"
  - "Aisance avec `requests` ou volonté de l'apprendre dans la configuration"
---

# 🔍 Construire un Analyseur SEO

Chaque site web a des signaux SEO invisibles, descriptions méta, hiérarchie des en-têtes, balises Open Graph, qui déterminent si les moteurs de recherche le classent bien ou l'enterrent. Ce projet construit une boîte à outils qui récupère n'importe quelle URL, extrait ces signaux, les score contre les meilleures pratiques, et génère un rapport structuré que tu peux comparer à travers plusieurs pages, le tout avec des bibliothèques Python pures qui tournent n'importe où.

Cela suppose les bases de Python, les bases de HTML, et la bibliothèque `requests` (couverte dans la Configuration), rien de l'Analyse de Données n'est requis. C'est optionnel et non noté ; vois [Projets du monde réel](/fr/projets) pour la liste complète, et grandissante.

## 🎯 Ce que tu vas faire

1. Récupérer n'importe quelle URL et parser son HTML avec `requests` et BeautifulSoup.
2. Extraire et valider les balises méta, les titres et les données Open Graph.
3. Auditer la structure des en-têtes pour une hiérarchie H1–H6 correcte.
4. Calculer la densité de mots-clés et les scores de pertinence du contenu.
5. Générer un rapport de comparaison côte à côte à travers plusieurs pages avec pandas.

## Où exécuter ceci

Ce projet fonctionne presque partout, `requests`, `BeautifulSoup` et `pandas` sont tous du Python pur sans dépendances au niveau système.

**Le terrain de jeu JupyterLite** fonctionne bien : colle les cellules de code directement dans un notebook. Tu devras `!pip install requests beautifulsoup4 pandas lxml` dans une cellule d'abord.

**Google Colab** fonctionne out of the box, les trois bibliothèques sont pré-installées sur l'environnement d'exécution de Colab.

**En local avec `uv`** est le chemin recommandé pour construire un vrai projet avec des fichiers, pas seulement des cellules, suis la section Configuration ci-dessous.

**Binder et les Notebooks Kaggle** fonctionnent aussi, puisque aucun GPU ni dépendance native n'est nécessaire.

- **Exécutez-le dans le navigateur.** Un compagnon notebook interactif est prêt, ouvrez-le dans Colab, Kaggle ou Binder et suivez les étapes dans l'ordre.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/seo-analyzer/notebook.fr.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/seo-analyzer/notebook.fr.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fseo-analyzer%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant d'écrire une ligne d'analyse.

### Installe `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis installer pip, puis installer un outil d'environnement virtuel, puis installer les paquets », il peut installer et gérer lui-même les versions de Python, en parallèle des dépendances de ton projet.

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
uv init seo-analyzer
cd seo-analyzer
uv add requests beautifulsoup4 pandas lxml
```

`requests` récupère les pages web ; `beautifulsoup4` parse le HTML en un arbre navigable ; `lxml` est un backend de parsing rapide pour BeautifulSoup ; `pandas` construit les rapports de comparaison. Les quatre sont du Python pur, aucun compilateur, aucune bibliothèque système requise.

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `seo-analyzer/` existe avec un `pyproject.toml`, et les quatre paquets sont installés.
- ✅ `uv run python -c "import requests, bs4, pandas; print('all good')"` imprime `all good`.

## Étape 1 : Récupère une page et extrait les balises méta

Le premier bloc de construction : étant donné une URL, récupère son HTML et en tire les métadonnées critiques pour le SEO, titre, description, balises Open Graph, que les moteurs de recherche et les plateformes sociales lisent.

### 1.1 Écris le récupérateur et l'extracteur de méta

```python
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def fetch_page(url: str) -> BeautifulSoup:
    """Fetch a URL and return a parsed BeautifulSoup tree."""
    try:
        headers = {"User-Agent": "SEOAnalyzer/1.0 (Educational Project)"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.text, "lxml")
    except requests.exceptions.Timeout:
        print(f"Timeout fetching {url}")
        raise
    except requests.exceptions.HTTPError as e:
        print(f"HTTP error: {e}")
        raise
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        raise

def extract_meta(soup: BeautifulSoup, url: str) -> dict:
    """Extract SEO-relevant metadata from a parsed page."""
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""

    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag["content"] if desc_tag and desc_tag.get("content") else ""

    og_title = soup.find("meta", property="og:title")
    og_desc = soup.find("meta", property="og:description")
    og_image = soup.find("meta", property="og:image")

    return {
        "url": url,
        "domain": urlparse(url).netloc,
        "title": title,
        "title_length": len(title),
        "description": description,
        "desc_length": len(description),
        "og_title": og_title["content"] if og_title and og_title.get("content") else "",
        "og_description": og_desc["content"] if og_desc and og_desc.get("content") else "",
        "og_image": og_image["content"] if og_image and og_image.get("content") else "",
    }

soup = fetch_page("https://example.com")
meta = extract_meta(soup, "https://example.com")
print(f"Title: {meta['title']!r} ({meta['title_length']} chars)")
print(f"Description: {meta['description'][:80]!r} ({meta['desc_length']} chars)")
```

**👟 Indice de départ :** `fetch_page` envoie une requête avec un en-tête `User-Agent` personnalisé (une bonne pratique, elle identifie ton robot d'indexation) et retourne un objet BeautifulSoup. `extract_meta` utilise ensuite `soup.find()` pour tirer des balises spécifiques : `<title>`, `<meta name="description">`, et les trois balises `og:`. Chaque extraction gère proprement le cas « balise manquante » en retournant une chaîne vide.

**🎯 Résultat attendu :**
```
Title: 'Example Domain' (14 chars)
Description: '' (0 chars)
```

**🩹 Si ça ne marche pas :** Une `requests.exceptions.ConnectionError` signifie que l'URL est fausse ou injoignable, essaie `https://example.com` d'abord (elle est toujours en ligne). Une `Timeout` signifie que le serveur a mis plus de 10 secondes, augmente le délai ou essaie un site plus rapide. Si `title` est vide là où tu attendais du contenu, la page est peut-être rendue par JavaScript (BeautifulSoup ne peut pas la voir), essaie une page rendue côté serveur à la place.

### 1.2 Vérifie l'extraction de méta

**✅ Liste de vérification**

- ✅ `fetch_page("https://example.com")` retourne un objet BeautifulSoup sans erreurs.
- ✅ `extract_meta` retourne un dict avec les clés `title`, `title_length`, `description`, `desc_length`, et les trois champs `og_*`.
- ✅ Une URL inexistante lève une erreur claire, pas un traceback confus depuis les profondeurs de `requests`.

**🤔 Question(s) socratique(s)**

- L'en-tête `User-Agent` dit `SEOAnalyzer/1.0`. Que se passerait-il si tu le retirais entièrement, la plupart des serveurs rejetteraient-ils la requête ? Pourquoi les robots d'indexation bien élevés s'identifient-ils ?
- BeautifulSoup avec `lxml` peut parser du HTML malformé. Que se passerait-il avec `"html.parser"` (l'intégré) à la place, remarquerais-tu une différence sur une page bien formée ? Sur une page cassée ?

## Étape 2 : Audite la hiérarchie des en-têtes

Les balises d'en-tête (`<h1>` à `<h6>`) disent aux moteurs de recherche la structure du document, une page sans `<h1>`, ou avec un `<h3>` directement après un `<h1>` (sautant `<h2>`), signale une mauvaise structure. Cette étape construit un vérificateur qui compte chaque niveau d'en-tête et signale les problèmes structurels.

### 2.1 Construis l'analyseur d'en-têtes

```python
def analyze_headings(soup: BeautifulSoup) -> dict:
    """Audit heading hierarchy for SEO best practices."""
    headings = {}
    for level in range(1, 7):
        headings[f"h{level}"] = [
            tag.get_text(strip=True)[:80] for tag in soup.find_all(f"h{level}")
        ]

    h1_count = len(headings["h1"])
    issues = []
    if h1_count == 0:
        issues.append("Missing H1 tag — every page should have exactly one H1")
    elif h1_count > 1:
        issues.append(f"Multiple H1 tags ({h1_count}) — use only one per page")

    used_levels = [int(k[1]) for k, v in headings.items() if v]
    if used_levels:
        full_range = set(range(min(used_levels), max(used_levels) + 1))
        if not full_range.issubset(set(used_levels)):
            issues.append(f"Skipped heading levels: h{sorted(full_range - set(used_levels))}")

    return {
        "headings": headings,
        "h1_count": h1_count,
        "total_headings": sum(len(v) for v in headings.values()),
        "issues": issues,
    }

heading_data = analyze_headings(soup)
print(f"H1 count: {heading_data['h1_count']}, Total: {heading_data['total_headings']}")
for issue in heading_data["issues"]:
    print(f"  ⚠ {issue}")
```

**👟 Indice de départ :** La fonction boucle de `h1` à `h6`, collecte toutes les balises à chaque niveau, puis applique deux règles : exactement un `<h1>` par page, et aucun niveau d'en-tête sauté. `used_levels` suit quels niveaux apparaissent réellement, si `h1` et `h3` apparaissent tous deux mais pas `h2`, c'est un niveau sauté. La découpe `[:80]` garde le rapport lisible quand les en-têtes sont longs.

**🎯 Résultat attendu :** Pour `https://example.com` (qui n'a aucun en-tête) :
```
H1 count: 0, Total: 0
  ⚠ Missing H1 tag — every page should have exactly one H1
```

**🩹 Si ça ne marche pas :** Si `total_headings` est 0 pour une page dont tu sais qu'elle a des en-têtes, la page est peut-être rendue par JavaScript, BeautifulSoup ne voit que le HTML initial, pas le contenu chargé après le chargement de la page. Si la vérification de niveau sauté se déclenche de façon inattendue, confirme que `used_levels` tire depuis les bonnes clés, une faute de frappe comme `"h7"` dans la plage décalerait silencieusement le min/max.

### 2.2 Vérifie l'audit des en-têtes

**✅ Liste de vérification**

- ✅ `analyze_headings(soup)` retourne un dict avec `headings`, `h1_count`, `total_headings`, et `issues`.
- ✅ Une page sans en-têtes retourne `h1_count=0` et inclut le problème « Missing H1 ».
- ✅ Tu peux expliquer pourquoi exactement un `<h1>` est la norme SEO (pas zéro, pas plusieurs).

**🤔 Question(s) socratique(s)**

- Une page a `<h1>Title</h1>` puis `<h3>Section</h3>` sans `<h2>` entre les deux. Ton analyseur signale un niveau sauté. Pourquoi les moteurs de recherche se soucient-ils que la hiérarchie des en-têtes soit consécutive, même si le HTML ne l'impose pas ?
- Que se passerait-il si tu cherchais des en-têtes à l'intérieur de balises `<script>` ou `<style>` ? Cela changerait-il le compte ? Comment `get_text(strip=True)` aide-t-il, ou pas, ici ?

## Étape 3 : Calcule la densité de mots-clés et les métriques de contenu

La densité de mots-clés te dit à quelle fréquence un mot spécifique apparaît par rapport au nombre total de mots, trop basse et la page ne parle pas de ce sujet ; trop haute et elle ressemble à du bourrage de mots-clés. Cette étape retire aussi le contenu non visible (scripts, barres de navigation, pieds de page) avant de compter, pour que les nombres reflètent ce qu'un lecteur humain voit réellement.

### 3.1 Construis l'analyseur de contenu et le vérificateur de mots-clés

```python
import re

def keyword_density(text: str, keyword: str) -> dict:
    """Calculate keyword density in visible page text."""
    words = re.findall(r"\b\w+\b", text.lower())
    total_words = len(words)
    if total_words == 0:
        return {"keyword": keyword, "count": 0, "density": 0.0, "total_words": 0}
    count = sum(1 for w in words if w == keyword.lower())
    return {
        "keyword": keyword,
        "count": count,
        "density": round(count / total_words * 100, 2),
        "total_words": total_words,
    }

def analyze_content(soup: BeautifulSoup) -> dict:
    """Extract visible text and compute basic content metrics."""
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    words = re.findall(r"\b\w+\b", text)
    return {"text": text, "word_count": len(words), "char_count": len(text)}

content = analyze_content(soup)
print(f"Word count: {content['word_count']}")

for kw in ["example", "domain", "web"]:
    d = keyword_density(content["text"], kw)
    print(f"  '{kw}': {d['count']} occurrences ({d['density']}%)")
```

**👟 Indice de départ :** `analyze_content` utilise `soup.decompose()` pour retirer les balises non visibles (`script`, `style`, `nav`, `footer`, `header`) avant d'extraire le texte, cela empêche les liens de navigation et le texte répétitif de gonfler ton compte de mots. `keyword_density` fait ensuite une correspondance de limite de mot insensible à la casse (`\b\w+\b`) pour le mot-clé exact, et divise par le nombre total de mots. Une densité de 1–3 % est typiquement saine ; au-dessus de 5 % ressemble à du bourrage.

**🎯 Résultat attendu :** Pour `https://example.com` :
```
Word count: <un nombre autour de 20 à 40>
  'example': <compte> apparitions (<densité>%)
  'domain': <compte> apparitions (<densité>%)
  'web': <compte> apparitions (<densité>%)
```

**🩹 Si ça ne marche pas :** Si `word_count` est suspect (des milliers), `decompose()` n'a pas retiré assez, la page utilise peut-être des enveloppes `<div>` autour de la navigation au lieu de `<nav>`. Si `keyword_density` retourne `0.0` pour un mot que tu vois sur la page, le mot est peut-être divisé entre balises ou enveloppé dans un `<span>`, `get_text()` joint le texte des balises imbriquées, mais `\b\w+\b` ne matchera pas à travers les frontières de balises.

### 3.2 Vérifie l'analyse de contenu

**✅ Liste de vérification**

- ✅ `analyze_content(soup)` retourne `text`, `word_count`, et `char_count`, tous non nuls pour une page avec du contenu visible.
- ✅ `keyword_density` retourne `count=0` et `density=0.0` pour un mot qui n'apparaît pas sur la page.
- ✅ L'appel `decompose()` retire les balises `<script>`, `<style>`, `<nav>`, `<footer>` et `<header>` avant l'extraction du texte.

**🤔 Question(s) socratique(s)**

- Tu comptes la fréquence des mots avec une correspondance exacte (`w == keyword.lower()`). Que changerait le fait de vouloir matcher « web » à l'intérieur de « website », serait-ce mieux ou pire pour l'analyse SEO, et pourquoi ?
- Une page a 500 mots de texte visible et 5 000 mots à l'intérieur de balises `<script>`. Pourquoi est-il important de retirer les scripts pour la densité de mots-clés, et quel autre contenu non visible ajouterais-tu à la liste de retrait ?

## Étape 4 : Génère un rapport de notation

Le gain : combine l'extraction de méta, l'audit des en-têtes et l'analyse de contenu dans une fonction de notation unique qui produit un nombre unique (0–100) pour n'importe quelle URL, puis compare plusieurs pages côte à côte dans un DataFrame pandas.

### 4.1 Construis la fonction de notation

```python
def analyze_url(url: str) -> dict:
    """Run a complete SEO audit on a single URL."""
    soup = fetch_page(url)
    meta = extract_meta(soup, url)
    headings = analyze_headings(soup)
    content = analyze_content(soup)

    scores = {}
    scores["title"] = 10 if 30 <= meta["title_length"] <= 60 else 5 if meta["title_length"] > 0 else 0
    scores["description"] = 10 if 120 <= meta["desc_length"] <= 160 else 5 if meta["desc_length"] > 0 else 0
    scores["h1"] = 10 if headings["h1_count"] == 1 else 0
    scores["headings"] = min(10, headings["total_headings"])
    scores["og_tags"] = sum(10 for k in ["og_title", "og_description", "og_image"] if meta[k])

    overall = sum(scores.values()) / (len(scores) * 10) * 100
    return {
        "url": url,
        "meta": meta,
        "headings": headings,
        "content": content,
        "scores": scores,
        "overall_score": round(overall, 1),
    }

report = analyze_url("https://example.com")
print(f"\n{'='*50}\nSEO Report: {report['url']}\n{'='*50}")
print(f"Overall Score: {report['overall_score']}/100")
for cat, score in report["scores"].items():
    print(f"  {cat}: {score}/10")
```

**👟 Indice de départ :** La grille de notation est délibérée : la longueur du titre obtient 10 points si elle est dans la plage de choix 30–60 (5 si elle existe mais a la mauvaise longueur, 0 si elle manque), la description obtient 10 si elle fait 120–160 caractères (la plage d'affichage de Google), le H1 obtient 10 seulement s'il y en a exactement un, et les balises OG obtiennent 10 chacune pour les trois que tu vérifies. `overall_score` divise la somme par le maximum possible (50) et multiplie par 100.

**🎯 Résultat attendu :**
```
==================================================
SEO Report: https://example.com
==================================================
Overall Score: <nombre>/100
  title: <score>/10
  description: <score>/10
  h1: <score>/10
  headings: <score>/10
  og_tags: <score>/10
```

**🩹 Si ça ne marche pas :** Si `overall_score` est 0.0 pour une page dont tu sais qu'elle a certains éléments SEO, un des sous-scores se met à zéro, vérifie `meta["title_length"]` et `headings["h1_count"]` individuellement. Si `scores["og_tags"]` est 0 pour une page avec des balises Open Graph, vérifie que le nom d'attribut `property="og:*"` correspond exactement (certains sites utilisent `name=` au lieu de `property=`).

### 4.2 Construis le DataFrame de comparaison

```python
import pandas as pd

def compare_urls(urls: list[str]) -> pd.DataFrame:
    """Audit multiple URLs and return a comparison table."""
    results = []
    for url in urls:
        try:
            r = analyze_url(url)
            results.append({
                "URL": url,
                "Score": r["overall_score"],
                "Title": r["meta"]["title"][:40],
                "Title Len": r["meta"]["title_length"],
                "Desc Len": r["meta"]["desc_length"],
                "H1 Count": r["headings"]["h1_count"],
                "Words": r["content"]["word_count"],
            })
        except Exception as e:
            results.append({"URL": url, "Score": 0, "Error": str(e)})
    return pd.DataFrame(results)

df = compare_urls(["https://example.com", "https://python.org"])
print(df.to_string(index=False))
```

**👟 Indice de départ :** `compare_urls` enveloppe `analyze_url` dans un try/except pour qu'une URL en échec ne tue pas toute la comparaison, elle journalise l'erreur dans le DataFrame à la place. Les colonnes du DataFrame sont délibérément plates (chaînes et nombres, pas de dicts imbriqués) pour que pandas puisse trier, filtrer et exporter sans traitement supplémentaire.

**🎯 Résultat attendu :** Un DataFrame pandas avec deux lignes (une par URL), des colonnes pour `Score`, `Title`, `Title Len`, `Desc Len`, `H1 Count` et `Words`.

**🩹 Si ça ne marche pas :** Si le DataFrame montre `Error` dans la colonne `Score` pour une URL, ce site a bloqué ou expiré, essaie une URL différente. Si `compare_urls` prend du temps, c'est qu'elle s'exécute séquentiellement, vois la section Pièges courants pour une note sur la récupération parallèle.

### 4.3 Vérifie le rapport de notation

**✅ Liste de vérification**

- ✅ `analyze_url("https://example.com")` retourne un dict avec `url`, `meta`, `headings`, `content`, `scores` et `overall_score`.
- ✅ `overall_score` est entre 0 et 100, et chaque sous-score est entre 0 et 10.
- ✅ `compare_urls` retourne un DataFrame où chaque ligne est une URL et chaque colonne une métrique.

**🤔 Question(s) socratique(s)**

- Une page avec un titre parfait (30–60 caractères) et une description manquante score 50/100. Une page avec les deux parfaits score 70/100. Qu'est-ce que cela te dit sur le poids relatif de la description contre le titre dans cette grille, et changerais-tu ces poids pour un vrai outil d'audit ?
- Si tu exécutais `compare_urls` sur 50 URLs et qu'une expirait, elle apparaît comme `Score=0` avec une colonne `Error`. `Score=0` est-il le bon défaut pour un échec de récupération, ou utiliserais-tu `NaN`, et que changerait-il dans le DataFrame si tu utilisais `NaN` ?

## ⚠️ Pièges courants

- **Les pages rendues par JavaScript retournent un contenu vide ou faux.** `requests` + BeautifulSoup ne voient que le HTML initial, tout contenu chargé par JavaScript (applications à page unique, images à chargement différé) n'apparaîtra pas dans l'arbre parsé. Si une page semble vide mais fonctionne dans ton navigateur, elle est rendue par JS, utilise un navigateur sans affichage (Playwright, Selenium) à la place, ou choisis une page rendue côté serveur pour tester.
- **Blocage ou limitation de débit sur les demandes répétées.** Certains sites bloquent le crawling agressif. Le délai de 10 secondes et le `User-Agent` personnalisé aident, mais si tu audites beaucoup de pages, ajoute `time.sleep(1)` entre les demandes ou utilise `concurrent.futures.ThreadPoolExecutor` avec un pool borné pour rester poli.
- **Correspondance fragile des balises `og:`.** Le code utilise `property="og:title"`, certains sites utilisent `name="og:title"` à la place (techniquement faux selon la spec Open Graph, mais courant). Si les balises OG manquent sur un site dont tu sais qu'il les a, essaie aussi de chercher les variantes `name=`.
- **Le compte de mots inclut du texte répétitif.** La liste `decompose()` retire `script`, `style`, `nav`, `footer`, `header`, mais tout le texte répétitif ne vit pas dans ces balises. Une page avec un grand `<aside>` ou un `<div class="sidebar">` plein de liens gonflera le compte de mots. Pour des comptes plus précis, tu aurais besoin de sélecteurs spécifiques au site.

## Ce que tu viens de construire

Une boîte à outils d'audit SEO qui récupère n'importe quelle URL, extrait ses balises méta et sa structure d'en-têtes, les score contre les meilleures pratiques établies, et produit un tableau de comparaison à travers plusieurs pages, le tout avec quatre bibliothèques Python pures et aucune automatisation de navigateur. La grille de notation est assez simple pour être comprise et étendue, et la fonction `compare_urls` te donne un DataFrame pandas prêt pour le tri, le filtrage ou l'export en CSV.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/seo-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/seo-analyzer) dans le dépôt du cours est une version plus complète avec l'audit du texte alternatif d'images, la classification des liens internes/externes, et un robot de sitemap qui audite chaque page listée dans un sitemap XML. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute l'audit du texte alternatif d'images : trouve chaque balise `<img>`, signale celles qui n'ont pas `alt`, et calcule le pourcentage d'images avec texte alternatif, un gain direct en accessibilité et en SEO.
- Ajoute la classification des liens internes contre externes : extrais tous les liens `<a href>`, compte chaque catégorie, et signale les pages avec trop peu de liens internes (moins de 3) comme un problème SEO potentiel.
- Construis un robot de sitemap : étant donné une URL de sitemap, récupère chaque page listée, exécute l'audit complet sur chacune, et exporte un CSV de synthèse avec `concurrent.futures.ThreadPoolExecutor` pour la récupération parallèle.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README contient un parcours complet, adapté aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, étape par étape. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓