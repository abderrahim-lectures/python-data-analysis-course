---
title: "Moteur de Blog Markdown"
description: "Un générateur de site statique qui convertit des articles Markdown en un site publiable avec coloration syntaxique."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "frontend", "data-pipeline", "file-io"]
learningObjectives:
  - "Analyser le frontmatter YAML des fichiers Markdown à la main"
  - "Convertir du Markdown en HTML avec la bibliothèque markdown"
  - "Rendre des modèles avec les f-strings Python et string.Template"
  - "Assembler les articles et un index de tags en un site statique complet"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/data-structures", "python-101/functions"]
---

# 📝 Construire un Moteur de Blog Markdown

Le web est construit sur les sites statiques — un dossier d'articles en texte brut, une étape de rendu, et un amoncellement de fichiers HTML qui n'ont besoin ni de serveur, ni de base de données, ni de framework JavaScript pour être servis. Ce projet construit un générateur de site statique miniature : il lit un dossier `posts/` de fichiers Markdown, analyse le frontmatter YAML de chacun pour le titre/date/tags, rend le corps en HTML et produit un `site/` complet avec une page d'index et des listes d'articles filtrés par tag — la même forme que les moteurs derrière mille vrais blogs.

Cela suppose Python 101 — entrées-sorties de fichiers, chaînes, dictionnaires et fonctions. Rien de plus : pas de framework, pas de base de données, pas de services externes. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Concevoir un format de fichier Markdown-plus-frontmatter et le découper proprement en métadonnées et corps.
2. Analyser le frontmatter YAML en un dict Python — un petit analyseur qui gère les guillemets et les listes.
3. Rendre le corps Markdown en HTML avec une bibliothèque, et échapper tout ce qui est dangereux.
4. Construire une page d'index qui liste tous les articles, plus des pages filtrées par tag.
5. Exécuter le générateur sur un dossier de vrais articles et inspecter le site terminé dans un navigateur.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal ici. La récompense de ce projet est d'ouvrir `site/index.html` dans un vrai navigateur, et la boucle « écrire un dossier d'articles, exécuter une commande, site publié » est la plus honnête quand les articles et la sortie vivent sur un vrai système de fichiers que tu peux examiner.

**GitHub Codespaces** est un chemin tout aussi bon — ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et tout ce qui suit, y compris l'aperçu navigateur, fonctionne de la même façon depuis un onglet servi par Cloudflare ou `python -m http.server`. Il n'y a aucune prétention de GitHub Page locale ici — c'est juste une boîte de développement où les commandes sont identiques.

**Google Colab, Kaggle Notebooks et Binder sont un moyen correct de *voir la mécanique tourner*, mais faibles pour la récompense.** Le notebook ci-dessous génère un faux dossier `posts/` en mémoire et rend le site complet vers un répertoire que tu peux inspecter cellule par cellule — donc l'analyse, le templating et l'assemblage tournent tous honnêtement. Ce qu'il ne fait pas bien, c'est la vraie boucle de *toi qui écris ton propre post.md et qui actualises la page* ; c'est un exercice système-de-fichiers-plus-navigateur, ce que le chemin local ou Codespace te donne. Utilise le notebook pour apprendre les étapes ; passe à `uv` quand tu veux publier.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/markdown-blog-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/markdown-blog-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmarkdown-blog-engine%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant d'écrire le générateur : `uv` pour un Python moderne, une bibliothèque Markdown et un dossier `posts/` avec deux articles réalistes à mâchonner.

### Installe `uv` et la seule dépendance

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis :

```bash
uv --version
mkdir markdown-blog-engine && cd markdown-blog-engine
uv init --bare
uv add markdown
```

### Écris deux articles de démarrage

Colle ceci dans `posts/hello.md` et `posts/python-tips.md` :

```markdown
---
title: "Hello, world from Markdown"
date: "2026-08-03"
tags: "intro, meta"
---

A blog in **Markdown**? Sure. Here is the first post, rendered by *our own* tool.

## Why this exists

We are about to write a static site generator. This paragraph is **bold** on purpose, so the render step has something to do.
```

```markdown
---
title: "Three Python tips"
date: "2026-08-04"
tags: "python, tips"
---

1. Use `enumerate` instead of `range(len(...))`.
2. Prefer dicts to parallel lists.
3. **Test** your parser on bad input.
```

```bash
mkdir posts
# save the two blocks above as posts/hello.md and posts/python-tips.md
ls -la posts
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `markdown` installé via `uv add markdown`.
- ✅ `posts/hello.md` et `posts/python-tips.md` existent, chacun commençant par un bloc frontmatter délimité par `---`.

## Étape 1 : Découpe un fichier en frontmatter et corps

Un article de site statique est en réalité deux parties dans un seul fichier : un petit bloc YAML de métadonnées entre deux lignes `---`, puis le corps Markdown. La première tâche du générateur est un découpage propre et ennuyeux : jusqu'à la deuxième `---` c'est du frontmatter, tout ce qui suit c'est le corps. Rendre ce découpage *robuste* avant tout rendu fantaisiste est la différence entre un outil en qui tu as confiance et un qui laisse silencieusement tomber des articles.

### 1.1 Écris le découpeur

```python
# engine.py
from pathlib import Path

def read_post(path: str) -> dict:
    text = Path(path).read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{path}: no frontmatter block")
    lines = text.splitlines()
    end = next(i for i, l in enumerate(lines[1:], start=1) if l.strip() == "---")
    frontmatter = "\n".join(lines[1:end])
    body = "\n".join(lines[end + 1:])
    return {"path": path, "frontmatter": frontmatter, "body": body}

if __name__ == "__main__":
    for p in sorted(Path("posts").glob("*.md")):
        post = read_post(str(p))
        print(f"--- {p} ---")
        print("frontmatter:", post["frontmatter"].splitlines()[0])
        print("body starts:", repr(post["body"].splitlines()[0]))
```

`next((i for i, l in enumerate(...) if ...))` trouve la *deuxième* ligne `---` en une seule passe — la première est consommée par `startswith`, et tout ce qui est après la deuxième est le corps. L'expression génératrice lève `StopIteration` sur un fichier mal formé, ce qui est un échec fort et honnête plutôt que de la camelote à moitié analysée qui coule silencieusement en aval.

**👟 Indice de départ :** Exécute `engine.py` sur les deux articles de démarrage et confirme que le découpage place les bonnes premières lignes dans chaque moitié — la première ligne de frontmatter est un titre, la première ligne de corps est de la prose.

**🎯 Résultat attendu :** Pour chaque article, une ligne montrant une première ligne de `frontmatter` comme `title: "Hello, world from Markdown"` et une montrant une première ligne de `body` comme `'A blog in **Markdown**? Sure. ...'`.

**🩹 Si ça ne marche pas :** Si `StopIteration` remonte comme une traceback, un article n'a pas sa `---` fermante — ajoute-la (le découpage *doit* voir un second séparateur). Si le corps inclut la `---` fermante, ton index `end` est décalé d'un — vérifie que `lines[end + 1:]` commence *après* cette ligne, pas dessus.

### 1.2 Vérifie le découpage

**✅ Liste de vérification**

- ✅ Les deux articles de démarrage se découpent en une chaîne frontmatter et une chaîne corps sans qu'aucune ligne `---` ne fuie dans l'une ou l'autre.
- ✅ Retirer le `---` initial d'un fichier d'article fait lever à `read_post` une `ValueError` claire avec le nom du fichier.
- ✅ Tu peux prédire ce que `read_post` retourne pour un fichier avec *trois* lignes `---` (le découpage utilise la deuxième ; la troisième devient le corps).

**🤔 Question(s) socratique(s)**

- Nous trouvons la `---` fermante en cherchant une ligne exactement `---`. Qu'arriverait-il avec une ligne de corps qui est elle-même `---` ? Le mode d'échec est-il un mauvais découpage silencieux ou bruyant — et lequel préférerais-tu ?
- Le découpeur retourne la chaîne de frontmatter *brute*. Qu'est-ce que cela implique pour le cas limite de la chaîne vide quand deux articles ensemble ont des lignes vides parasites — et où dans le pipeline penses-tu que l'analyse devrait avoir lieu ?

## Étape 2 : Analyse le frontmatter YAML

Maintenant la chaîne frontmatter devient un vrai dict — `title`, `date`, `tags` — pour que le reste du moteur puisse faire `post["title"]` au lieu de ré-analyser le texte. YAML est un terrier de lapin ; un générateur n'a besoin que des ~4 règles qui couvrent nos propres fichiers : `key: value`, des valeurs entre guillemets avec des deux-points, et des listes séparées par des virgules.

### 2.1 Écris un minuscule analyseur de sous-ensemble YAML

```python
# engine.py (continued)

def parse_frontmatter(raw: str) -> dict:
    data = {}
    for line in raw.splitlines():
        if not line.strip():
            continue
        key, value = line.split(":", 1)
        value = value.strip()
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        elif "," in value:
            value = [v.strip() for v in value.split(",")]
        elif not value:
            value = []
        data[key.strip()] = value
    return data

if __name__ == "__main__":
    for p in sorted(Path("posts").glob("*.md")):
        meta = parse_frontmatter(read_post(str(p))["frontmatter"])
        print(p, "->", meta)
```

`line.split(":", 1)` est la ligne qui rend ceci sûr : découper une fois garde intacts tous les deux-points *dans la valeur* (comme `08:30` ou `https://...`), parce que la deuxième partie n'est pas re-découpée. La valeur prend ensuite l'une de trois formes — chaîne sans guillemets, chaîne entre guillemets avec guillemets retirés, ou liste à virgules — c'est tout le sous-ensemble YAML que nous avons promis.

**👟 Indice de départ :** Affiche le dict analysé pour les deux articles avant d'écrire une seule ligne du rendu — tu veux voir `tags` devenir une liste, pas une chaîne.

**🎯 Résultat attendu :** Deux lignes comme `posts/hello.md -> {'title': 'Hello, world from Markdown', 'date': '2026-08-03', 'tags': ['intro', 'meta']}` — note que `tags` est une vraie liste.

**🩹 Si ça ne marche pas :** Si `title` garde ses guillemets, la branche de retrait de guillemets `startswith/endswith` ne correspond pas — vérifie un espace de fin *après* le guillemet fermant dans le fichier (nous faisons `strip()` sur les guillemets mais la valeur était déjà stripée). Si `tags` sort comme une seule chaîne `'intro, meta'`, le contrôle `"," in value` a tourné avant le strip — l'ordre compte : strip d'abord, puis brancher.

### 2.2 Vérifie l'analyse YAML

**✅ Liste de vérification**

- ✅ `parse_frontmatter` retourne un dict où `tags` est une `list` et `title` une chaîne nue sans guillemets.
- ✅ Une valeur comme `date: "2026-08-04"` s'analyse en `'2026-08-04'` avec guillemets retirés.
- ✅ Une ligne de frontmatter *sans* valeur (`author:`) produit une liste vide — et tu peux expliquer pourquoi `[]` est choisi au lieu de `None`.

**🤔 Question(s) socratique(s)**

- Notre analyseur ne peut pas gérer une liste imbriquée ou un bloc `oneline: | ...`. Écris le plus petit frontmatter qui se *més-analyserait silencieusement* — et décide si c'est acceptable pour un moteur de blog personnel (indice : qualifie l'échec de bruyant vs silencieux).
- Un vrai analyseur YAML (comme `PyYAML`, la bibliothèque qu'utilisent les vrais outils) supporte les ancres, les chaînes multi-lignes et 100 autres fonctionnalités. Quel est le coût de traîner ça dans un projet dont tu contrôles les fichiers ? Quand « installe juste PyYAML » devient-il le bon choix ?

## Étape 3 : Rend le Markdown en HTML

L'analyse produit du texte ; le rendu produit une page. La bibliothèque `markdown` convertit `**bold**`, `# heading` et le code délimité en balises `<strong>`, `<h1>` et `<pre>`. Il y a un pli de sécurité dans le HTML qui en sort — le corps peut contenir du HTML brut, et un hostile peut transporter du JavaScript. Le correctif éprouvé, `bleach`, est peut-être déjà sur ta roue. Donc le rendu fait deux travaux : convertir, puis assainir.

### 3.1 Convertit et assainit

```python
# render.py
from pathlib import Path

try:
    from bleach import clean
except ImportError:
    def clean(text: str, **kwargs) -> str:
        return text

import markdown as md

def to_html(body: str) -> str:
    raw = md.markdown(body, extensions=["fenced_code", "tables"])
    return clean(raw, tags={"p", "h1", "h2", "h3", "em", "strong", "code",
                            "pre", "ul", "ol", "li", "blockquote", "img",
                            "a", "table", "thead", "tbody", "tr", "td", "th"},
                  attributes={"a": {"href", "title"}, "img": {"src", "alt"}})

if __name__ == "__main__":
    body = "**Bold here** with <script>alert('x')</script> and `code`."
    print(to_html(body))
```

`bleach` est l'état d'esprit *liste d'autorisation* en action : au lieu d'essayer d'attraper chaque chose malveillante (une partie perdue d'avance), tu déclares exactement quelles balises et attributs peuvent survivre, et tout le reste — le `<script>` — est jeté. L'import `try/except` est délibéré : le code tourne même sur une installation nue, dégradant vers aucune assainissement, et affiche une solution de repli sans avertissement pour que le notebook et l'installation complète partagent un seul fichier.

**👟 Indice de départ :** Installe bleach avec `uv add bleach`, puis exécute `render.py` et confirme que la balise `<script>` a disparu de la sortie pendant que `**Bold**` est devenu `<strong>`.

**🎯 Résultat attendu :** Du HTML où `<strong>Bold here</strong>` est présent et `<script>`/`alert(...)` sont entièrement absents — les balises script retirées par la liste d'autorisation.

**🩹 Si ça ne marche pas :** Si `<script>` apparaît encore dans la sortie, tu tombes sur la solution de repli dégradée `clean` — vérifie que `uv add bleach` a réussi et que le chemin d'import (`from bleach import clean`) est correct. Si le gras ne s'est pas rendu, `md.markdown` avec `extensions=["fenced_code", "tables"]` est appelé sur la *chaîne de corps qui contient encore le frontmatter* — assure-toi que `read_post` l'a découpé d'abord.

### 3.2 Vérifie le rendu

**✅ Liste de vérification**

- ✅ `to_html("**x**")` retourne du HTML contenant `<strong>x</strong>`.
- ✅ `to_html("<script>...")` retourne du HTML sans `<script>`, `<iframe>` ni attributs `onclick=`.
- ✅ Les blocs de code délimités (```` ```python ````) survivent au rendu comme `<pre>`/`<code>`.

**🤔 Question(s) socratique(s)**

- Nous retirons le HTML brut *après* la conversion Markdown. La plupart des vrais moteurs Markdown laissent passer le HTML brut intact, c'est pourquoi `md` + un assainisseur est l'ordre ceinture-et-bretelles « convertir, puis liste d'autorisation ». Quelle attaque survivrait si tu assainissais *avant* la conversion à la place (indice : chaque `<` dans un bloc de code est significatif pour le convertisseur) ?
- La liste d'autorisation garde `img` mais seulement les attributs `src`/`alt`. Quel est le risque concret si tu ajoutais `onerror` aux attributs autorisés — écris le HTML en une ligne qui le déclenche.

## Étape 4 : Assemble les pages

Maintenant le générateur gagne le mot « site » : chaque article devient son propre fichier `.html`, et les pages d'index/tags sont *dérivées* des articles. La dérivation est l'astuce centrale de la génération statique — tu n'écris jamais l'index à la main ; tu le calcules à chaque exécution, donc « ajouter un article, relancer, l'index se met à jour » est toujours vrai.

### 4.1 Construis le modèle de page et l'écrivain

```python
# sitegen.py
from pathlib import Path
from engine import read_post, parse_frontmatter
from render import to_html

PAGE = """<!doctype html>
<html><head><meta charset="utf-8">
<title>{title}</title></head>
<body>
<header><a href="index.html">All posts</a></header>
<h1>{title}</h1>
<p class="meta">{date} &middot; {tags}</p>
<article>{body_html}</article>
<footer><p><a href="index.html">&larr; back to index</a></p></footer>
</body></html>"""

def build_post(post_path: str, out_dir: Path) -> dict:
    raw = read_post(post_path)
    meta = parse_frontmatter(raw["frontmatter"])
    meta.setdefault("title", "Untitled")
    meta.setdefault("date", "unknown")
    tags = ", ".join(meta.get("tags", []))
    html = PAGE.format(title=meta["title"], date=meta["date"],
                       tags=tags, body_html=to_html(raw["body"]))
    out = out_dir / f"{Path(post_path).stem}.html"
    out.write_text(html, encoding="utf-8")
    return {"slug": Path(post_path).stem, "title": meta["title"],
            "date": meta["date"], "tags": meta.get("tags", [])}

if __name__ == "__main__":
    out = Path("site")
    out.mkdir(exist_ok=True)
    posts = sorted((build_post(str(p), out) for p in Path("posts").glob("*.md")),
                   key=lambda d: d["date"], reverse=True)
    print("built:", [p["slug"] for p in posts])
```

`PAGE` est un minuscule modèle avec des emplacements `{name}` remplis par `.format()` — modèle, vue et contrôleur écrasés en une seule chaîne, ce qui est *assez* pour un générateur de cette taille. Le tri par date (le plus récent d'abord) est la première *vue* qui dépend des métadonnées, et la valeur de retour de `build_post` — pas le fichier qu'il a écrit — est ce que la page d'index consommera, donc l'index ne ré-analyse jamais les fichiers deux fois.

**👟 Indice de départ :** Exécute `sitegen.py`, puis `open site/hello.html` (ou `start`/`xdg-open` selon ton OS) et regarde un vrai article rendu avant de construire l'index.

**🎯 Résultat attendu :** `built: ['python-tips', 'hello']` (le plus récent d'abord — `python-tips` date de 2026-08-04) et deux fichiers `.html` de taille humaine sous `site/` qui se rendent dans un navigateur avec un titre, une ligne de métadonnées et le corps de l'article.

**🩹 Si ça ne marche pas :** Si `KeyError: 'title'` se déclenche, le frontmatter d'un article manque `title` — les appels `setdefault` dans `build_post` existent pour absorber cela ; si tu vois l'erreur, les setdefault ont été placés *après* un `.format` qui a déjà tourné. Si `site/` accumule des pages périmées d'articles supprimés, c'est attendu pour l'instant : nettoie `site/` avant chaque construction, ou appelle ça une fonctionnalité et supprime à la main.

### 4.2 Construis l'index avec des liens par tag

```python
# sitegen.py (continued)

def build_index(posts: list[dict], out_dir: Path) -> None:
    items = "\n".join(
        f'<li><a href="{p["slug"]}.html">{p["title"]}</a> '
        f'<small>({p["date"]})</small></li>' for p in posts)
    (out_dir / "index.html").write_text(
        f"""<!doctype html><html><head><meta charset="utf-8"><title>My blog</title></head>
<body><h1>My blog</h1><ul>{items}</ul>
<p>Tags: {tags_block(posts)}</p></body></html>""", encoding="utf-8")

def tags_block(posts: list[dict]) -> str:
    by_tag = {}
    for p in posts:
        for t in p["tags"]:
            by_tag.setdefault(t, []).append(p["slug"])
    return " ".join(f'<a href="tag-{t}.html">{t}</a>' for t in sorted(by_tag))

if __name__ == "__main__":
    # ...build_post loop as above, then:
    build_index(posts, out)  # referenced 'posts' from the previous block
    print("index written")
```

`by_tag.setdefault(t, []).append(...)` est l'idiome « construire un dict de listes » en une ligne — l'alternative `if t not in by_tag: by_tag[t] = []` est la même chose écrite en toutes lettres. L'index est entièrement *dérivé* : il ne contient aucun HTML écrit à la main, donc il ne peut jamais être en désaccord avec le dossier des articles. Cet invariant est toute la raison pour laquelle la génération statique bat la maintenance manuelle d'un index.

**👟 Indice de départ :** Ajoute `build_index` et `tags_block`, relance, puis ouvre `index.html` et clique sur un lien de tag — *lis* le 404 avant de le corriger ; tu verras exactement ce que la prochaine micro-étape doit créer.

**🎯 Résultat attendu :** `site/index.html` liste les deux articles du plus récent au plus ancien, montre une ligne « Tags : » avec `intro`, `meta`, `python`, `tips` pointant vers `tag-intro.html` etc., et la page de chaque article renvoie à l'index.

**🩹 Si ça ne marche pas :** Si un lien de tag renvoie un 404, c'est un *comportement correct* — les pages cibles n'existent pas encore, et l'étape 5 est précisément la génération de `tag-*.html`. Si l'index montre les articles dans le mauvais ordre, le `sorted(..., key=lambda d: d["date"], reverse=True)` doit tourner sur la liste collectée *avant* `build_index`, pas après.

### 4.3 Vérifie l'assemblage

**✅ Liste de vérification**

- ✅ `site/hello.html` et `site/python-tips.html` s'ouvrent dans un navigateur avec un vrai titre, métadonnées et corps rendu.
- ✅ `index.html` liste les deux articles du plus récent au plus ancien et pointe vers les fichiers `.html` existants (les liens de tags peuvent renvoyer 404 jusqu'à l'étape 5).
- ✅ Relancer la construction après avoir modifié un article produit du HTML mis à jour — l'index et les pages ne sont jamais en désaccord avec `posts/`.

**🤔 Question(s) socratique(s)**

- `build_index` reçoit une *liste de dicts* plutôt que de relire le système de fichiers. Qu'est-ce qui casse — concrètement — si elle ré-analysait plutôt `posts/*.md` elle-même ? (Indice : deux sources de vérité et une incohérence de tri.)
- La page d'index et la page de tags dépendent toutes deux de `posts`. Si un article a les tags `["a", "b"]`, l'index les joint par une virgule mais la page de tags *groupe* par eux. Nomme un endroit où ces deux dérivations pourraient diverger, et quelle règle les garderait identiques.

## Étape 5 : Génère les pages par tag

L'index est une vue dérivée ; une page qui « montre seulement les articles avec le tag X » est une vue dérivée *filtrée*. La boucle qui écrit une page par tag a la même forme que chaque outil « générer un artefact par élément d'une collection » — un modèle par élément avec l'élément substitué dedans.

### 5.1 Écris les pages de tags

```python
# sitegen.py (continued)

def build_tag_pages(posts: list[dict], out_dir: Path) -> None:
    by_tag = {}
    for p in posts:
        for t in p["tags"]:
            by_tag.setdefault(t, []).append(p)
    for tag, tagged in sorted(by_tag.items()):
        items = "\n".join(
            f'<li><a href="{p["slug"]}.html">{p["title"]}</a></li>'
            for p in tagged)
        (out_dir / f"tag-{tag}.html").write_text(
            f"""<!doctype html><html><head><meta charset="utf-8"><title>tag: {tag}</title></head>
<body><h1>Posts tagged "{tag}"</h1><ul>{items}</ul>
<p><a href="index.html">&larr; index</a></p></body></html>""",
            encoding="utf-8")

if __name__ == "__main__":
    build_tag_pages(posts, out)
    print("tag pages written:", sorted(t for t in Path("site").glob("tag-*.html")))
```

Le groupement ici est encore `setdefault` — le même idiome qu'à l'étape 4, maintenant retenu par tag dans `tagged` qui est une liste de *dicts d'articles*, pas de slugs, pour que le modèle ait titre et slug sous la main. Chaque page de tag est un `<li>`-par-article, exactement comme l'index moins la date et moins chaque article non correspondant.

**👟 Indice de départ :** Relance la construction et clique sur chaque lien de tag de l'index — cette étape convertit chaque 404 précédent en une vraie page.

**🎯 Résultat attendu :** `tag-intro.html`, `tag-meta.html`, `tag-python.html`, `tag-tips.html` existent sous `site/`, chacun listant les articles correspondants, et chaque lien de tag de l'index se résout maintenant.

**🩹 Si ça ne marche pas :** Si une page de tag contient de mauvais articles, le groupement a ajouté `p` — le dict entier — pendant que `items` construit depuis `p["slug"]` ; un mauvais groupement signifie que tu as groupé par une copie périmée de `posts`. Si un tag sans article montre un `<ul>` vide, tu as construit `by_tag` depuis une liste d'articles vide — re-vérifie que `build_tag_pages` tourne *après* que `posts` soit collecté.

### 5.2 Vérifie le site terminé

**✅ Liste de vérification**

- ✅ Chaque lien de `index.html` — articles *et* tags — se résout vers un fichier existant.
- ✅ `tag-python.html` liste `Three Python tips` et non `Hello, world`.
- ✅ `site/` contient exactement : `hello.html`, `python-tips.html`, un `tag-*.html` par tag distinct, et `index.html`.

**🤔 Question(s) socratique(s)**

- Le modèle de page de tag répète le modèle de l'index avec deux différences. Ça fonctionne — mais quand refactoriserais-tu les deux en un seul `post_list_page(title, posts)` partagé ? Nomme l'odeur concrète qui déclenche la refactorisation.
- Nous écrivons `tag-{tag}.html` avec une chaîne de tag brute issue d'un frontmatter non fiable. Si le tag d'un article était `../evil`, que devient le chemin du fichier — et quelle est l'assainissement minimale que tu ajouterais avant d'utiliser un tag dans un nom de fichier ? (Indice : pense `slugify`.)

## ⚠️ Pièges courants

- **La recherche de la deuxième `---` décalée d'un.** `next(...)` et la tranche `lines[end + 1:]` doivent s'accorder sur quelle ligne est « le » séparateur ; un glissement d'une ligne attache silencieusement la `---` fermante au corps, que le rendu Markdown rend ensuite joyeusement comme un `<hr>`. Corrige-le en affirmant dans un petit test que `body` ne commence jamais par `---`.
- **Frontmatter non terminé.** Un article que tu étais en train d'éditer au milieu est enregistré sans sa `---` fermante ; le générateur ne peut alors pas trouver le découpage et meurt avec une traceback cryptique. Vérifier que le découpage *existe* en amont, et lever une `ValueError` avec le nom du fichier, transforme un mystère de 30 minutes en une correction de deux secondes.
- **Assainir *ou* rendre, pas les deux.** Rendre en HTML sans passer par `bleach` laisse un `post.md` transporter `<script>` dans les navigateurs de tes visiteurs ; assainir sans rendre laisse le Markdown visible comme texte brut. L'ordre ceinture-et-bretelles (convertir, puis liste d'autorisation) est tout l'intérêt de l'étape 3 — les vrais moteurs se trompent aussi là-dessus.
- **Deux sources de vérité.** Éditer à la main `index.html` « juste pour corriger une chose » pendant que le générateur le dérive encore de `posts/` garantit que ta prochaine construction écrase silencieusement la modification. Règle : le site est généré, jamais maintenu à la main — chaque artefact doit être reproductible depuis le seul dossier des articles.
- **Couverture de test manquante sur le « pipeline complet ».** Les étapes passent chacune seules, mais un article dont le frontmatter dit `date: "2026-08-04"` avec un *espace* après la clé, ou un tag avec une majuscule, est l'endroit où l'étape d'assemblage casse toute la construction. Un test de fumée de deux lignes (construire, puis affirmer que chaque fichier généré existe et que chaque `<a href>` se résout) attrape cette classe d'échecs avant que tu publies.

## Ce que tu viens de construire

Un générateur de site statique qui fonctionne : deux articles entrent, une commande, et un dossier `site/` de HTML lisible à la main — pages, index et listes par tag entièrement dérivés des articles pour que la construction ne puisse jamais être en désaccord avec la source. La compétence transférable est tout le *modèle mental de génération statique* : un petit pipeline pur (analyser → rendre → assembler) qui transforme des fichiers texte brut en un artefact déployable que tu peux héberger n'importe où, d'un simple dossier à un CDN, sans rien qui tourne au moment de la requête. Ce modèle est ce qui alimente Jekyll, Hugo, Gatsby et mille blogs personnels — et maintenant c'est le tien.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/markdown-blog-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/markdown-blog-engine) dans le dépôt du cours regroupe le moteur, les deux articles d'exemple et un notebook qui exécute chaque étape dans l'ordre. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et inspecte le `site/` généré directement dans l'arborescence.
:::

## Où aller à partir d'ici

- Ajoute un fil RSS — un fichier XML listant le titre, le lien et la date de chaque article, régénéré à chaque construction ; l'habitude dériver-depuis-les-articles en fait un ajout de 15 lignes.
- Ajoute des estimations de temps de lecture — compte les mots du corps, divise par ~200, arrondis au supérieur, et affiche « 4 min read » sur l'index ; le compteur fait une ligne, le templating est la partie amusante.
- Écris une archive consciente des dates (`archive-2026.html`) groupée par année — exactement le groupement `setdefault` de l'étape 5, une clé de plus.
- Déploie : pousse `site/` vers un dépôt GitHub Pages (ou une seule branche) et laisse un hébergeur web gratuit le servir — tout l'intérêt du modèle statique est que la sortie est expédiable avec zéro pièce mobile.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier — un moteur de blog qui a rendu tes propres articles ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README guide l'ajout du tien via une **pull request** du début à la fin : fork, branche, commit et ouverture de la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓