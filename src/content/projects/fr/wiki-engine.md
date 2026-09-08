---
title: "Moteur Wiki"
description: "Wiki légère avec pages Markdown, historique de versions et édition collaborative."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["markdown", "cli", "automation"]
learningObjectives:
  - "Stocker les pages wiki comme fichiers Markdown avec un schéma de nommage par slug"
  - Lire et rendre les pages en HTML avec un petit moteur de rendu Markdown-lite
  - "Garder un historique de versions en append-only et diff deux versions quelconques"
  - "Scanner les [[links]] pour calculer un index de backlinks inversé"
  - "Tokenizer et classer la recherche plein texte par fréquence de terme"
prerequisites:
  - "Les bases de Python (fonctions, dictionnaires, entrées/sorties de fichiers)"
  - "À l'aise avec les regex de base (findall, sub)"
  - "Usage des chemins pathlib pour lire et lister les fichiers"
---

# 🛠️ 📚 Moteur Wiki

Un wiki, ce sont *des pages sur disque plus trois index*. Les pages sont des fichiers Markdown ; les index sont les backlinks (quelles pages pointent ici ?), l'historique (que disait cette page avant ?) et la recherche (quelles pages mentionnent ces mots ?). Ce projet construit les trois de zéro avec la bibliothèque standard : un schéma de nommage par slug, un tout petit moteur de rendu Markdown-lite, un historique de versions en append-only avec diffs, une carte de backlinks `[[Page]]`, et une recherche qui tokenise et classe par fréquence de terme. Quand tu as fini, tu peux transformer tes propres notes en wiki.

Cela suppose Python 101 plus un peu de regex — rien d'Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Modéliser une page comme `slug + title + body` stockée dans un fichier Markdown.
2. Lire, écrire et rendre les pages en HTML avec un moteur de rendu Markdown-lite.
3. Créer un petit wiki et router les titres à travers un slugifier sans collision.
4. Garder un historique de versions en append-only et diff deux versions sauvegardées quelconques.
5. Scanner les liens `[[Page]]` et calculer l'index de backlinks inversé.
6. Tokenizer et classer la recherche plein texte par fréquence de terme.

## Où exécuter ceci

**En local avec `uv`** est la maison principale — un wiki, ce sont des fichiers sur disque, et tout l'intérêt de ce moteur est de faire un aller-retour à travers un dossier `wiki/` que tu peux ouvrir dans n'importe quel éditeur. Le moteur est purement bibliothèque standard, donc chaque cellule s'exécute à l'identique dans le cloud aussi.

**Google Colab, Kaggle Notebooks et Binder** exécutent les six étapes sans modification — les cellules créent un répertoire `wiki/` et l'inspectent au fur et à mesure, donc le notebook *démontre* le moteur contre ses propres pages. L'honnêteté impose de préciser : les systèmes de fichiers du cloud sont éphémères, donc un wiki que tu conserves réellement vit en local. Utilise les badges pour regarder le moteur travailler ; utilise `uv` là où vivent tes notes.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wiki-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wiki-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwiki-engine%2Fnotebook.ipynb)

## Configuration

Crée le projet. Le moteur n'utilise que la bibliothèque standard — `re` pour slugifier/analyser, `json` pour l'historique, `difflib` pour les diffs, et `pathlib` pour l'arborescence de fichiers. Pas de paquets à installer.

```bash
uv init wiki-engine
cd wiki-engine
```

```bash
uv run python -c "import re, json, difflib; from pathlib import Path; print('stdlib ok')"
```

Sérieusement, c'est toute la liste de dépendances. `difflib` te donne `unified_diff` gratuitement — la même sortie que montre `git diff` — `re` découpe des slugs et des `[[links]]` hors du texte, et `pathlib` fait de « lister chaque fichier `.md` » une ligne. Le répertoire `wiki/` que tu créeras à l'Étape 1 est la base de données.

**✅ Liste de vérification**

- ✅ `uv init wiki-engine` a créé un projet avec un `pyproject.toml`.
- ✅ Le contrôle d'import a affiché `stdlib ok` — aucun paquet ajouté.

## Étape 1 : Modélise une page et slugifie son nom

La vérité la plus simple d'un wiki est un fichier par page. Cette étape définit la dataclass `Page` (`slug`, `title`, `body`), décide où vivent les fichiers (`wiki/<slug>.md`), et écrit le slugifier — la fonction qui transforme « Data Analysis » en `data-analysis` unique et sûr pour les URL.

### 1.1 Écris `Page`, `slugify` et `page_path`

**👟 Indice de départ :** Slugifie en mettant en minuscules et en réduisant toute suite de non-alphanumériques en un seul trait d'union ; garde `Page` comme une valeur pure pour que la disposition des fichiers et le sens de la page restent séparés.

```python
# wiki.py
import re
from dataclasses import dataclass
from pathlib import Path

WIKI_DIR = Path("wiki")

@dataclass
class Page:
    slug: str
    title: str
    body: str

def slugify(title: str) -> str:
    slug = title.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")

def page_path(slug: str) -> Path:
    return WIKI_DIR / f"{slug}.md"

for title in ["Data Analysis", "Sci-kit & Tools!", "  Pandas  "]:
    print(f"{title!r:26} -> {slugify(title)}")
```

Le slug est l'*identité* du wiki : c'est sur lui que clés des noms de fichiers, des `[[links]]` et des résultats de recherche, donc le rendre déterministe (« Data Analysis » et « data analysis » atterrissent sur le même fichier) empêche les pages dupliquées pour la même idée. `re.sub(r"[^a-z0-9]+", "-", ...)` réduit les espaces, la ponctuation et même les séparateurs multiples en un trait d'union, et le `strip("-")` final garde les bords propres. Nester `WIKI_DIR / f"{slug}.md"` à l'intérieur de `page_path` canalise chaque écriture de fichier à travers une convention — aucune page ne peut s'échapper du dossier wiki.

**🎯 Résultat attendu :** `'Data Analysis'            -> data-analysis`, `'Sci-kit & Tools!'         -> sci-kit-tools`, `'  Pandas  '               -> pandas`.

**🩹 Si ça ne marche pas :** Si les trous de slug restent comme espaces, c'est que le `strip("-")` de bord a tourné mais pas la regex de réduction — vérifie le quantificateur `+`. Si `Sci-kit & Tools!` se rend comme `sci-kit--tools`, un double trait d'union n'a pas été fusionné — encore le `+`. Si un slug est vide, c'est que le titre était tout en non-ASCII/emoji ; décide d'un repli (`"page"`) avant que les pages ne commencent à entrer en collision.

### 1.2 Vérifie le slugging

**✅ Liste de vérification**

- ✅ Des titres ne différant que par la casse et la ponctuation produisent *un* slug.
- ✅ `slugify("Data Analysis") == slugify("Data Analysis!") == "data-analysis"`.
- ✅ `page_path("data-analysis")` se résout dans `wiki/` (`wiki/data-analysis.md`).

**🤔 Question(s) socratique(s)**

- Deux vrais pages « Plotting » et « Plotting & Plots » se slugifient dans le même fichier — l'une écrase silencieusement l'autre. À quoi ressemblerait un *contrôle de collision* au moment de la sauvegarde, et échouer bruyamment est-il mieux qu'écraser ?
- Les slugs sont ici dérivés des titres. Si un utilisateur renomme « Data Analysis » en « Analysis », que se passe-t-il pour chaque fichier et chaque lien `[[Data Analysis]]` ? Où cela plaide-t-il pour un slug *immuable* qui survit aux modifications de titre ?

## Étape 2 : Lis, écris et rends les pages

Les pages doivent survivre à l'aller-retour : `Page` → fichier sur disque → `Page` de nouveau, puis rendre en HTML. Cette étape écrit `save_page`/`load_page` (avec une ligne de première `# Title` comme convention) et un moteur de rendu Markdown-lite qui transforme `**bold**` et les `[[links]]` en HTML.

### 2.1 Écris `save_page`, `load_page` et `render_html`

**👟 Indice de départ :** Stocke le titre comme première ligne `# ` du fichier et le corps comme tout ce qui suit ; rends en substituant par regex le gras et le `[[link]]` par ligne, en enveloppant le reste dans `<p>`.

```python
# wiki.py (continuation)
def save_page(page: Page) -> Path:
    WIKI_DIR.mkdir(exist_ok=True)
    target = page_path(page.slug)
    target.write_text(f"# {page.title}\n\n{page.body}")
    return target

def load_page(slug: str) -> Page:
    lines = page_path(slug).read_text().splitlines()
    title = lines[0].lstrip("# ").strip()
    body = "\n".join(lines[2:]).strip()
    return Page(slug=slug, title=title, body=body)

def render_html(page: Page) -> str:
    html = [f"<h1>{page.title}</h1>"]
    for line in page.body.splitlines():
        line = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", line)
        line = re.sub(r"\[\[([^\]]+)\]\]", r'<a href="/\1">\1</a>', line)
        if line.strip():
            html.append(f"<p>{line}</p>")
    return "\n".join(html)

demo = Page("welcome", "Welcome", "This wiki covers **Python**. See [[Data Analysis]].")
save_page(demo)
print(render_html(load_page("welcome")))
```

La convention de première ligne `# Title` fait que le fichier est à la fois une spécification et une page : n'importe quel éditeur peut ouvrir `wiki/welcome.md`, changer le texte sous le titre, et le wiki le ramasse — pas de schéma de base de données caché. `render_html` convertit délibérément *exactement* `**bold**` et les `[[wiki-links]]` et enveloppe tout le reste dans `<p>` ; un sous-ensemble adapté aux enseignants bat un parseur Markdown complet à moitié cuit, et les deux regex sont tout le « moteur de rendu ». `load_page` fait l'aller-retour du corps tel quel, donc les modifications faites dans un éditeur de texte survivent aux suppositions.

**🎯 Résultat attendu :** `<h1>Welcome</h1>\n<p>This wiki covers <strong>Python</strong>. See <a href="/Data Analysis">Data Analysis</a>.</p>` — note que le lien cible le titre brut ; la résolution de lien vers *des slugs* vient à l'Étape 5.

**🩹 Si ça ne marche pas :** Si le titre fuit dans le corps, c'est que la tranche `lines[2:]` a supposé une ligne vide après `# Title` quand il n'y en a pas. Si rien ne se rend en gras, c'est que la regex `\*\*(.+?)\*\*` manque le `?` (gourmand) et s'étend sur des paragraphes entiers. Si `save_page` a levé `FileNotFoundError`, c'est que `WIKI_DIR.mkdir` n'a jamais tourné — crée le dossier une fois au départ.

### 2.2 Vérifie l'aller-retour

**✅ Liste de vérification**

- ✅ `render_html(load_page("welcome"))` correspond à la sortie ci-dessus mot pour mot.
- ✅ Modifier `wiki/welcome.md` dans n'importe quel éditeur de texte et recharger montre la modification — les fichiers sont la source de vérité, pas Python.
- ✅ Une page sans liens se rend comme des paragraphes `<p>` simples — aucun crash de la regex de lien en cas d'absence.

**🤔 Question(s) socratique(s)**

- L'ancre de lien rend le *titre*, mais le wiki clé sur *des slugs*. Où ces deux-là divergent-ils (une page liée qui est renommée), et de quoi un moteur de rendu correct a-t-il besoin de faire la recherche avant d'écrire le `<a href>` ?
- `render_html` substitue la regex sur chaque ligne, donc un marqueur `**bold**` à cheval sur deux lignes ne se rendra pas. Quand est-ce une *fonctionnalité* (sous-ensemble prévisible) et quand est-ce un piège pour les utilisateurs qui attendent du Markdown complet ?

## Étape 3 : Historique de versions et diffs

Un wiki qui oublie ce que disaient les pages ne peut pas être fiable. Cette étape ajoute un historique en append-only : chaque sauvegarde ajoute `{before, after}` à `wiki/history.json`, et `diff_versions` montre le changement entre deux versions quelconques en diff unifié de style `git`.

### 3.1 Écris `log_version`, `history_for` et `diff_versions`

**👟 Indice de départ :** Garde l'historique comme un dict JSON de `slug -> [{"before", "after"}]` ; ajoute-puis-écris sur tout le fichier, et laisse `difflib.unified_diff` produire le hunk lisible par l'humain.

```python
# wiki.py (continuation)
import json
import difflib

HISTORY_FILE = WIKI_DIR / "history.json"

def log_version(slug: str, before: str, after: str) -> None:
    history = json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else {}
    history.setdefault(slug, []).append({"before": before, "after": after})
    HISTORY_FILE.write_text(json.dumps(history, indent=2))

def history_for(slug: str) -> list[dict]:
    if not HISTORY_FILE.exists():
        return []
    return json.loads(HISTORY_FILE.read_text()).get(slug, [])

def diff_versions(slug: str, index: int = -1) -> str:
    entry = history_for(slug)[index]
    return "\n".join(difflib.unified_diff(
        entry["before"].splitlines(), entry["after"].splitlines(), lineterm=""))
```

L'*ajout* dans `history.setdefault(...).append(...)` est la discipline qui rend l'historique fiable : les versions plus anciennes ne sont jamais modifiées, seulement ajoutées, donc le journal est une piste d'audit plutôt qu'un cache. `difflib.unified_diff` est exactement l'algorithme qu'utilise `git diff` ; le retourner comme chaîne garde le formatage hors de la couche de données. Écrire tout le JSON à chaque sauvegarde est correct à l'échelle d'un wiki et rend le fichier inspectable à la main — un compromis que tout grand stockage de versions a déjà fait différemment, ce que la question ci-dessous titille.

**🎯 Résultat attendu :** Après deux modifications, `history_for("welcome")` a deux entrées, et `print(diff_versions("welcome", -1))` montre des lignes `-` et `+` marquant exactement ce qui a changé.

**🩹 Si ça ne marche pas :** Si l'historique ne grandit jamais au-delà d'une entrée, c'est que `log_version` est appelé avec le *même* `before` à chaque sauvegarde (l'ancien texte a été capturé trop tard). Si `diff_versions(-1)` montre une réécriture de fichier complet, c'est que le `after` a été sauvegardé comme un corps vide (capture le cas non vide). Si le JSON est écrit malformé, un corps contenant un `\n` brut n'a pas été échappé par `json.dumps` — il l'est toujours par `write_text(json.dumps(...))`, donc suspecte des modifications manuelles de `history.json`.

### 3.2 Vérifie l'historique

**✅ Liste de vérification**

- ✅ Modifier une page deux fois donne deux entrées ; le premier `before` égale le texte *original* de la page.
- ✅ La sortie de `diff_versions` commence par des marqueurs `-`/`+` (en-têtes `---`/`+++` optionnels) et ne montre que les lignes changées.
- ✅ Revenir à l'`index` `0` rejoue tout l'historique de changement en avant, dans l'ordre.

**🤔 Question(s) socratique(s)**

- L'historique stocke des instantanés `before`/`after` complets. Pour un grand wiki, c'est O(fichier × modifications) de disque. Qu'économise le stockage de *delta* (seulement les régions changées par version), et que coûte la reconstruction au moment de la lecture ?
- Cet historique enregistre le *texte* de la page mais pas *qui* a modifié ni *quand*. Lequel de ces deux latents — auteur ou horodatage — ajouterais-tu d'abord, et où l'historique d'un wiki cesse-t-il d'être un filet de sécurité pour devenir un enregistrement de gouvernance ?

## Étape 4 : Backlinks — la carte de pages inversée

Les liens ne sont que la moitié d'un wiki ; le *backlink* (qui pointe vers moi ?) est l'autre moitié, et c'est lui qui transforme les pages en un web navigable. Cette étape scanne le corps de chaque page pour les `[[Target]]` et construit la carte inversée `target -> [pages qui y pointent]`.

### 4.1 Écris `outbound_links` et `backlink_index`

**👟 Indice de départ :** `findall` chaque jeton `[[..]]`, puis parcours tous les fichiers `.md` un à un par lien sortant et enregistre le *source* sous le slug du *cible*.

```python
# wiki.py (continuation)
LINK_PATTERN = re.compile(r"\[\[([^\]]+)\]\]")

def outbound_links(page: Page) -> list[str]:
    return LINK_PATTERN.findall(page.body)

def backlink_index() -> dict[str, list[str]]:
    backlinks = {}
    for file in WIKI_DIR.glob("*.md"):
        page = load_page(file.stem)
        for target in outbound_links(page):
            backlinks.setdefault(slugify(target), []).append(page.slug)
    return backlinks

for slug, source in sorted(backlink_index().items()):
    print(f"{slug:16} <- {', '.join(source)}")
```

`outbound_links` répond à « où cette page pointe-t-elle ? » et `backlink_index` l'inverse en « qu'est-ce qui pointe ici ? » — l'inversion d'index standard, un file-glob et un `setdefault` à la fois. Clé par `slugify(target)` est le gain des slugs déterministes de l'Étape 1 : un corps disant `[[Data Analysis]]` et un autre disant `[[data-analysis]]` s'enregistrent tous deux sous `data-analysis`, donc l'index survit à la variance de nommage. Parcourir `WIKI_DIR.glob("*.md")` signifie que l'arborescence de fichiers *est* la liste des pages — aucun registre séparé à garder synchronisé.

**🎯 Résultat attendu :** Avec la page `welcome` (« See [[Data Analysis]] ») et une page `data-analysis` correspondante, l'affichage montre `data-analysis     <- welcome`.

**🩹 Si ça ne marche pas :** Si une cible se mappe à la liste vide, des pages backlinkées existent mais le scan de cible n'a trouvé aucune source — vérifie que les regex cibles viennent du texte du corps. Si les backlinks listent la page elle-même, c'est que `findall` lit la ligne de *titre* (les liens ne vivent que dans les corps ; `[[self]]` est honnêtement autoréférentiel — décide s'il compte). Si une liste de slug tuple-mais-mélangée apparaît, plusieurs sources lient une cible et c'est correct — l'ordre est juste l'ordre du glob.

### 4.2 Vérifie les backlinks

**✅ Liste de vérification**

- ✅ Deux pages dont chacune lie l'autre par `[[...]]` produisent une entrée par cible avec la source listée.
- ✅ Renommer une cible de lien dans le texte met à jour l'index via `slugify` sans changement de code.
- ✅ `backlink_index()` ne contient aucune clé qui ne soit pas une vraie page de destination (voir la question sur les liens cassés).

**🤔 Question(s) socratique(s)**

- Un lien vers `[[Missing Page]]` enregistre une entrée de backlink pour une page qui n'existe pas. Que rapporterait ton moteur pour les cibles « orphelines », et pourquoi un rapport de lien mort compte-t-il plus dans un wiki que dans un livre ?
- Les backlinks sont ici calculés à chaque appel. Si un wiki grandit jusqu'à des milliers de pages, que *mettrais-tu en cache* — et quel événement invaliderait ce cache pour qu'il ne serve jamais de liens périmés ?

## Étape 5 : Recherche plein texte

Le dernier index : étant donnée une requête, quelles pages mentionnent ces termes, classées par fréquence. Cette étape tokenise le texte en mots minuscules, retire une petite liste de stopwords, score chaque page par combien de termes de la requête elle contient, et retourne une liste classée.

### 5.1 Écris `tokenize` et `search`

**👟 Indice de départ :** Tokenise avec `re.findall` sur `[a-z0-9]+`, filtre les stopwords, puis score chaque page comme `sum(tokens.count(term) for term in query_terms)`.

```python
# wiki.py (continuation)
STOPWORDS = {"the", "a", "an", "and", "of", "to", "in", "for", "on",
             "with", "this", "that", "is", "it", "see", "use"}

def tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-z0-9]+", text.lower())
    return [word for word in words if word not in STOPWORDS and len(word) > 1]

def search(query: str) -> list[tuple[str, int]]:
    terms = tokenize(query)
    results = []
    for file in WIKI_DIR.glob("*.md"):
        page = load_page(file.stem)
        tokens = tokenize(page.title + "\n" + page.body)
        score = sum(tokens.count(term) for term in terms)
        if score:
            results.append((page.slug, score))
    return sorted(results, key=lambda item: -item[1])

save_page(Page("data-analysis", "Data Analysis",
               "Use pandas for grouping. Keep the visual step [[welcome]]."))
for slug, score in search("pandas grouping"):
    print(f"{score:3}  {slug}")
```

Tokenizer le titre *et* le corps signifie qu'une page dont le titre dit « Pandas » se classe pour une requête « pandas » même si le corps ne l'épelle jamais — les pages font leur propre publicité. Retirer les stopwords (« this », « see ») est le gain de précision le moins cher qu'un moteur de recherche fasse : `[[see]]` n'est pas quelque chose que quelqu'un cherche. Scorer par le compte de terme brut est délibérément naïf — la question ci-dessous pointe pourquoi « Pandas » apparaissant deux fois dans le *titre* fait trop confiance à une page de dix mots — mais c'est un classement complet et honnête où plus de mentions bat moins.

**🎯 Résultat attendu :** `search("pandas")` classe une page dont le titre/corps mentionne `pandas` (score 1+) au-dessus de toute page qui n'utilise jamais le mot ; `search("pandas grouping")` score la page `data-analysis` à 2 (un hit pour chaque terme de la requête) tandis que la page `welcome` score 0.

**🩹 Si ça ne marche pas :** Si un mot d'un caractère comme `R` (le langage !) disparaît, c'est que `len(word) > 1` l'a filtré — c'est une fuite de politique de stopword, retire le garde-fou de longueur pour un usage réel. Si rien ne correspond jamais, c'est que `tokenize` a reçu une non-chaîne (titre `None`) ou que la classe regex était `.`, correspondant à la ponctuation. Si les résultats reviennent dans l'ordre du glob quel que soit le score, c'est que le tri `key=lambda item: -item[1]` manque.

### 5.2 Vérifie la recherche

**✅ Liste de vérification**

- ✅ `search("pandas")` retourne la page `pandas` en premier avec un score ≥ 1.
- ✅ Une requête à deux termes retourne une page multi-termes au-dessus d'une page à terme unique.
- ✅ L'insensibilité à la casse tient : `search("PANDAS")` égale `search("pandas")`.

**🤔 Question(s) socratique(s)**

- Le scoring par compte de terme brut récompense les pages *longues* et punit les pages *concises*. Quels normalisateurs (diviser par la longueur de la page, plafonner les poids de titre) feraient battre « court et exactement sur le sujet » à « long et décousu » ?
- La recherche lit chaque page à chaque appel. À quelle taille de wiki un index inversé `terme -> [slugs]` préconstruit (construit une fois dans l'esprit de l'Étape 4) bat-il le rescoring de tous les fichiers, et que dois-tu mettre à jour quand une page est modifiée ?

## ⚠️ Pièges courants

- **Des collisions de slug qui écrasent les pages.** « Plotting » et « Plotting & Plots » mappent sur un fichier, s'écrasant silencieusement l'un l'autre. Correction : vérifie que `page_path(slug)` existe avant la sauvegarde, et échoue bruyamment au lieu d'écrire par-dessus.
- **Des liens pointant vers des titres, pas des slugs.** `[[Data Analysis]]` doit se résoudre en `data-analysis` ou le lien fait 404 dans n'importe quel vrai moteur de rendu. Correction : route `[[...]]` à travers `slugify` dans le moteur de rendu et l'index de backlinks (la mise à niveau du moteur de rendu de l'Étape 5).
- **Des corps qui ont perdu leur titre.** Analyser `lines[2:]` suppose une ligne vide après `# Title`. Correction : `load_page` lit la première ligne `# ` comme titre et *tout le reste* comme corps, tolérant les blancs manquants.
- **Un historique qui enregistre le mauvais « before ».** Capturer `before` *après* avoir sauvegardé le nouveau texte fait de chaque diff une opération nulle. Correction : lis d'abord l'ancien corps, puis `log_version` avant que la page ne soit écrasée.
- **Une recherche qui traite chaque mot également.** « , » et « the » dominent les classements. Correction : un ensemble de stopwords (et un plancher de longueur), puis monte à la pondération par fréquence de terme à partir de la question de l'Étape 5.

## Ce que tu viens de construire

Un moteur wiki complet et sans dépendance : des pages slugifiées sur disque, un moteur de rendu Markdown-lite, un historique de versions en append-only avec des diffs de style git, un index de `[[link]]` inversé, et une recherche plein texte classée. La leçon transférable est que *un wiki est trois index sur une arborescence de fichiers* — un scan du même fichier pour les backlinks, un journal pour l'historique, un compteur de jetons pour la recherche — et qu'indexer consiste simplement à « précalculer les réponses que personne ne veut recalculer ». Chaque générateur de site statique que tu as jamais utilisé est cette même boucle portant un front-end.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/wiki-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/wiki-engine) dans le dépôt du cours est une version plus complète du code ci-dessus, avec un moteur de rendu Markdown-lite qui résout les liens vers les slugs et un tableau de bord de comptage de pages. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Résous les `[[links]]` vers *des slugs* dans le moteur de rendu (la question de l'Étape 2), pour que les hits ne se rendent jamais comme `href="/Data Analysis"` mais comme `href="/data-analysis"`.
- Ajoute un rapport `broken_links()` qui signale les `[[Target]]` où `page_path(slugify(Target))` n'existe pas — le propre scanner de liens morts du wiki.
- Stocke des deltas au lieu d'instantanés complets dans l'historique, en reconstruisant un corps à la demande — la mise à niveau de la question de l'Étape 3 rendue réelle.
- Construis un index inversé précalculé pour la recherche (terme → slugs), reconstruis-le à la sauvegarde, et laisse les titres surpasser le texte du corps.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
