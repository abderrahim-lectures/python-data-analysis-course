---
title: "Constructeur de Presentations"
description: "Creer des presentateurs de diapositives depuis Markdown avec themes, animations et notes du presentateur."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "frontend", "file-io"]
learningObjectives:
  - Découper un deck Markdown en diapositives, séparées par des lignes ---
  - Déduire le titre de la diapositive de la première en-tête et rendre le corps en HTML
  - Appliquer un thème en remplaçant une chaîne CSS dans la page
  - Extraire les notes du présentateur hors des diapositives visibles avec une convention de commentaire
  - Assembler un fichier HTML complet et autonome que tu peux ouvrir dans n'importe quel navigateur
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/functions"]
---

# 📽️ Construire un Constructeur de Presentations

Les présentations sont éditées dans un outil et présentées dans un autre, et c'est dans l'aller-retour que les diapositives meurent : les polices changent, les mises en page cassent, et un keynote chargé de puces te dispute chaque pixel. Un constructeur Markdown-first évite tout cela — tu écris les diapositives en texte brut avec `---` entre elles, et une commande transforme cela en un fichier HTML autonome qui s'ouvre partout, dans n'importe quel navigateur, sans application requise. Ce projet construit ce constructeur : il analyse un deck markdown, rend chaque diapositive, applique un thème, extrait tes notes de présentateur, et livre un unique `deck.html`.

Cela suppose le Python 101 — entrées-sorties de fichiers, chaînes et fonctions. Rien au-delà de cela : pas de framework JavaScript, pas de base de données, pas d'outil de build. C'est optionnel et non noté ; vois [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Définir un format de deck — diapositives séparées par `---`, titre comme premier `#`, notes dans des commentaires `<!-- -->`.
2. Découper proprement une chaîne de deck en diapositives, même quand le corps d'une diapositive contient des lignes qui ressemblent à des séparateurs.
3. Rendre le markdown de chaque diapositive en HTML et en déduire son titre.
4. Thématiser le deck en remplaçant une chaîne CSS, et extraire les notes de présentateur hors de la page visible.
5. Assembler un `deck.html` totalement autonome et l'ouvrir dans un navigateur.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — la récompense est un vrai `deck.html` que tu ouvres dans un onglet de navigateur, et toute la boucle « modifie deck.md, exécute la commande, rafraîchis l'onglet » est le but de l'outil. Les étapes supposent un petit dossier avec `uv` et une bibliothèque Markdown.

**GitHub Codespaces** est la même expérience : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et les commandes exactes s'exécutent dans un onglet de navigateur avec Node, Python et `uv` préinstallés — le HTML fraîchement construit s'ouvre directement dans un volet d'aperçu.

**Google Colab, les notebooks Kaggle et Binder exécutent tout le pipeline d'analyse-et-rendu pour de vrai** — rien ici n'a besoin d'une clé ou d'un GPU. La réserve honnête concerne le dernier kilomètre : le notebook affiche le HTML généré et peut le déverser dans un fichier à télécharger, mais la *boucle de rafraîchissement d'onglet de navigateur* est là où un constructeur de diapositives gagne sa vie, et c'est une expérience de fichier local. Utilise le notebook pour apprendre la machinerie ; construis ton vrai deck en local.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/presentation-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/presentation-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpresentation-builder%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant que la première diapositive ne se rende : `uv`, la bibliothèque `markdown`, et un deck de démarrage de deux diapositives.

### Installe `uv` et l'unique dépendance

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
mkdir presentation-builder && cd presentation-builder
uv init --bare
uv add markdown
```

### Écris un deck de démarrage

Colle ceci dans `deck.md` :

```markdown
# Why short talks beat long decks

Short talks respect attention. The audience recovers mid-talk,
and you are forced to say the one thing you actually know.

<!-- Note: open with the "two-minute" icebreaker, then start the timer. -->

---

## The three-slide rule

1. One problem.
2. One change.
3. One next step.

Slides are a scaffold, not the talk. <!-- Note: the scaffold line lands best after a pause. -->
```

```bash
uv run python -c "import markdown; print('markdown ready')"
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `markdown` installé via `uv add markdown`.
- ✅ `deck.md` existe : 2 diapositives séparées par une ligne ne contenant que `---`, chacune avec une en-tête, et deux commentaires HTML cachés servant de notes.

## Étape 1 : Découpe un deck en diapositives

Un deck est un fichier avec `---` comme séparateur de diapositives. Tout le pipeline vit ou meurt sur un découpage correct, et les deux choses que les gens ratent sont toutes deux ici : une ligne `---` *à l'intérieur* d'un bloc de code délimité ne doit pas découper le deck, et les lignes vides de début/fin ne doivent pas devenir des diapositives fantômes.

### 1.1 Écris le découpeur de diapositives

```python
# slides.py
from pathlib import Path

SEPARATOR = "---"

def split_deck(text: str) -> list[str]:
    slides, current, in_fence = [], [], False
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_fence = not in_fence
            current.append(line)
        elif line.strip() == SEPARATOR and not in_fence:
            slides.append("\n".join(current))
            current = []
        else:
            current.append(line)
    if current:
        slides.append("\n".join(current))
    return [s.strip() for s in slides]

if __name__ == "__main__":
    deck = Path("deck.md").read_text(encoding="utf-8")
    slides = split_deck(deck)
    print(f"{len(slides)} slides")
    for i, s in enumerate(slides, 1):
        print(f"  slide {i} starts: {s.splitlines()[0]!r}")
```

Le drapeau de délimitation est la pièce qui sépare un vrai constructeur d'un hack de quinze secondes : les lignes ```` ``` ```` basculent `in_fence`, et `---` ne termine une diapositive que *hors* d'un bloc de code — donc une diapositive qui te montre un `---` littéral dans du code d'exemple délimité reste une diapositive. Le `[s.strip() for s in slides]` final retire silencieusement l'anneau de blanc autour de chaque diapositive sans toucher à sa mise en page intérieure.

**👟 Indice de départ :** Exécute le découpeur et compte — deux diapositives pour notre deck. Puis enveloppe temporairement un `---` dans un bloc délimité sur la diapositive deux et réexécute : le compte doit rester 2, et cette expérience est toute la leçon de cette étape.

**🎯 Résultat attendu :** `2 slides`, avec `slide 1 starts: '# Why short talks beat long decks'` et `slide 2 starts: '## The three-slide rule'`.

**🩹 Si ça ne marche pas :** S'il rapporte 3+ diapositives, un `---` dans une délimitation a découpé le deck — vérifie que la bascule est keynée sur `startswith("```")`, pas `== "```"` (les espaces de fin cassent la correspondance stricte). Si la dernière diapositive manque, l'ajout final `if current:` a disparu — un deck qui se termine juste sur un `---` a une diapositive finale vide que le `if` écarte correctement, et il doit s'exécuter *après* la boucle.

### 1.2 Vérifie le découpage

**✅ Liste de vérification**

- ✅ `split_deck` retourne exactement `2` diapositives pour `deck.md`, chacune commençant par sa ligne d'en-tête.
- ✅ Ajouter un bloc délimité contenant `---` à une diapositive ne la découpe pas ; supprimer la délimitation la découpe.
- ✅ Les lignes vides de début/fin autour d'une diapositive sont retirées sans supprimer les lignes vides intérieures.
- ✅ Un deck se terminant par `---` écarte la diapositive vide finale au lieu d'en produire une qui se rend en rien.

**🤔 Question(s) socratique(s)**

- Le séparateur est une ligne dont le contenu *dépouillé* égale `---`. Écris la plus petite ligne qui déclencherait faussement (`-- -` ? `--- ` ? un espace de fin ?) et dis-moi si le `strip()` protège ou encourage cela — puis décide si la rigueur est ce que tu veux.
- Trois tirets dans une délimitation sont des données (tu montres un séparateur), hors de la délimitation ils sont du contrôle. Quel est un cas de *contenu* où tu voudrais sincèrement qu'un `---` non délimité dans une diapositive ne *découpe* pas — et cela plaide-t-il pour exiger un marqueur explicite `<!-- slide →` à la place ? Nomme le compromis.

## Étape 2 : Rends une diapositive et tire son titre

Chaque diapositive est du markdown destiné au HTML, et chacune a besoin d'un titre pour les points de navigation du présentateur et le `h1`. La règle est simple et vaut la peine d'être rendue explicite : la *première* ligne d'en-tête de la diapositive est le titre, quel que soit son niveau (`#` ou `##`), et le corps est tout le reste — rendu avec la même bibliothèque `markdown`, sans que l'en-tête titre soit dupliquée dans le corps.

### 2.1 Rends le corps et dérive le titre

```python
# render.py
import re
import markdown as md

def render_slide(slide: str) -> dict:
    lines = slide.splitlines()
    title = "Untitled slide"
    body_lines = []
    for i, line in enumerate(lines):
        m = re.match(r"^(#{1,6})\s+(.+)", line)
        if m and not body_lines:
            title = m.group(2)
        else:
            body_lines.append(line)
    body_html = md.markdown("\n".join(body_lines), extensions=["fenced_code"])
    return {"title": title, "body_html": body_html}

if __name__ == "__main__":
    slide = "## Two words\n\nEverything else on the slide."
    print(render_slide(slide))
```

La garde `if m and not body_lines` est toute la règle « la première en-tête gagne » compressée : la *première* en-tête devient le titre, et dès que du texte non-titre a été collecté, les en-têtes suivantes sont du contenu ordinaire. Le regex est délibérément plus lâche que nécessaire — `#{1,6}` correspond aux niveaux d'en-tête 1 à 6 — mais la clause `not body_lines` signifie que seule la première compte ici, et le corps rendu garde les en-têtes restantes comme contenu, là où elles appartiennent.

**👟 Indice de départ :** Rends la diapositive 1 du deck et regarde les deux clés — titre `Why short talks beat long decks` (remarque : le `#` a disparu), HTML du corps avec `<p>` et le commentaire de note toujours loin.

**🎯 Résultat attendu :** Pour la diapositive 1 du deck : `{'title': 'Why short talks beat long decks', 'body_html': '<p>Short talks respect attention...</p>'}` — toute en-tête `##` sur d'autres diapositives reste dans le corps comme `<h2>`.

**🩹 Si ça ne marche pas :** Si `title` est `Untitled slide`, le regex n'a pas trouvé de correspondance — vérifie une en-tête comme `#Title` (sans espace, échoue sur `\s+`) ou un caractère accentué dans la ligne d'en-tête ; le texte de l'en-tête doit être capturé verbatim par `(.+)`. Si l'en-tête titre *apparaît aussi* dans le corps, la garde `not body_lines` ne l'arrête pas — relis la logique `if/else` : elle doit prendre la branche d'en-tête seulement quand rien n'a encore été collecté.

### 2.2 Vérifie le rendu

**✅ Liste de vérification**

- ✅ La première en-tête de chaque diapositive devient `title`, avec ses marqueurs `#` retirés.
- ✅ Les en-têtes non premières se rendent dans le corps comme `<h2>`/`<h3>`, pas comme titres.
- ✅ Les blocs de code délimités survivent à travers `fenced_code` et apparaissent comme `<pre><code>`.
- ✅ Une diapositive sans en-tête du tout retombe sur `Untitled slide` sans planter.

**🤔 Question(s) socratique(s)**

- Notre règle « la première en-tête gagne » ignore le *niveau* : `## Two words` et `# Two Words` titrent tous deux la diapositive. Est-ce que cela compte qu'un `##` puisse devenir un titre de diapositive alors que `#` implique normalement le titre du deck — et quelle règle distinguerait sans ambiguïté « titre du deck » de « titre de diapositive » ?
- Le titre est dérivé du contenu, donc le texte d'une diapositive détermine son étiquette de navigation. Que se passe-t-il si deux diapositives commencent par la même en-tête — et est-ce un problème cosmétique ou un problème de *correction* pour les points de présentation ?

## Étape 3 : Thématise le deck

Un deck est du contenu plus un aspect. L'aspect ici est une chaîne CSS interpolée dans la tête de la page — donc « thématiser » est aussi simple que de remplacer la chaîne — et l'*interface* qui rend ce remplacement sûr est un petit dict de thèmes nommés parmi lesquels un drapeau `--theme` peut choisir.

### 3.1 Définis les thèmes et un rendeur

```python
# theme.py
THEMES = {
    "light": ("#f7f7f5", "#222", "Georgia, serif", "Helvetica, Arial, sans-serif"),
    "ink": ("#14161a", "#e8e6e3", "Georgia, serif", "Helvetica, Arial, sans-serif"),
    "paper": ("#fdf6e3", "#073642", "Comic Sans MS, monospace", "monospace"),
}

def css_for(theme: str) -> str:
    bg, fg, heading_font, body_font = THEMES[theme]
    return f"""
    <style>
      body {{ margin: 0; background: {bg}; color: {fg};
             font-family: {body_font}; }}
      section {{ min-height: 90vh; padding: 2.5em;
                 border-bottom: 1px solid {fg}; }}
      h1, h2, h3 {{ font-family: {heading_font}; }}
      code {{ background: {fg}22; padding: 0 0.3em; }}
    </style>"""

if __name__ == "__main__":
    for name in THEMES:
        print(name, "->", css_for(name)[:40], "...")
```

Le thème est une donnée — quatre valeurs par entrée, dépaquetées dans un `f-string` CSS — donc ajouter un thème revient à *ajouter un tuple*, pas à éditer du balisage. Deux détails CSS portent la sensation : `min-height: 90vh` fait de chaque diapositive un bloc de la taille du viewport (la discipline « une idée par écran »), et les `{{`/`}}` doublés dans le f-string sont des accolades littérales, ce que toute personne pythonienne oublie une fois — où un `{}` non apparié lève `KeyError` sur la chaîne.

**👟 Indice de départ :** Appelle `css_for("light")` et lis le CSS comme une personne qui n'a jamais vu de CSS — chaque diapositive est un bloc pleine hauteur, les en-têtes reçoivent le serif, le code reçoit la pastille translucide. Puis appelle `css_for("nope")` et regarde le `KeyError` prouver que le dict est la seule voie d'entrée.

**🎯 Résultat attendu :** Trois lignes (`light ->`, `ink ->`, `paper ->`), chacune imprimant une chaîne CSS rognée ; `css_for("ink")` contient la substitution de fond `#14161a`.

**🩹 Si ça ne marche pas :** Si `KeyError: 'nope'`, c'est *correct* — le dict de thèmes est une liste blanche. Si le CSS a des `{` littéraux dans la sortie, tu as mis une seule accolade dans un littéral f-string — chaque `{`/`}` structurel doit être doublé (`{{ background: ... }}`). Si les couleurs ne se rendent pas dans le navigateur, le hex à 8 chiffres comme `{fg}22` utilise un hex à 8 chiffres que *les anciens navigateurs ignorent* — soit utilise 6 chiffres, soit garde un div de superposition translucide.

### 3.2 Vérifie la thématisation

**✅ Liste de vérification**

- ✅ `css_for` retourne du texte de style valide pour les trois thèmes, chacun avec son propre fond et premier plan.
- ✅ Les noms de thème inconnus lèvent `KeyError` — le dict est l'ensemble complet autorisé.
- ✅ Les accolades structurelles du f-string se rendent comme de vrais `{...}` dans la sortie, pas des erreurs Python ni des `{` littéraux.
- ✅ `min-height: 90vh` apparaît dans chaque thème — chaque diapositive est un bloc de la taille du viewport.

**🤔 Question(s) socratique(s)**

- Les thèmes sont des tuples codés en dur. Qu'est-ce qu'un drapeau `--theme-file custom.css` changerait sur qui peut thématiser un deck — et quel est l'angle de sécurité du texte de `your.css` injecté verbatim dans `deck.html` (indice : `expression()` du CSS est surtout mort, mais le *principe* d'interpolation depuis une entrée non fiable est vivant) ?
- Nous mettons la chaîne de *thème* dans le `<style>` du document. Si le deck d'un coéquipier a besoin d'une police chargée depuis un CDN (`<link rel="stylesheet" href="...">`), est-ce que `css_for` l'accommode aujourd'hui, ou faut-il un second mécanisme ? Vaut-il la peine de corriger cela avant le deck ou après la demande de fonctionnalité ?

## Étape 4 : Extrais les notes du présentateur hors des diapositives

Le public voit les diapositives ; le présentateur voit les notes. Notre convention de note est un commentaire HTML — `<!-- Note: ... -->` — niché n'importe où dans la source de la diapositive, et « extraire » signifie : détecter les commentaires pendant le rendu, les collecter dans un champ `notes`, et les retirer du HTML visible du corps pour que le public ne voie jamais de texte `<!-- ... -->`.

### 4.1 Extrais et retire les commentaires

```python
# notes.py
import re
from render import render_slide

COMMENT = re.compile(r"<!--\s*(.*?)\s*-->", re.DOTALL)

def extract_notes(slide: str) -> tuple[str, list[str]]:
    cleaned, notes = [], []
    for line in slide.splitlines():
        for match in COMMENT.finditer(line):
            notes.append(match.group(1))
        partial, n = COMMENT.subn("", line)
        cleaned.append(partial if not n else "")
    return "\n".join(cleaned), notes

if __name__ == "__main__":
    slide = "Visible line. <!-- Note: say this slowly -->"
    body, notes = extract_notes(slide)
    print("body:", repr(body))
    print("notes:", notes)
```

Le regex `<!--\s*(.*?)\s*-->` trouve le commentaire avec le `.*?` paresseux (il s'arrête à la *première* fermeture `-->`), et le balayage `finditer` collecte chaque note tandis que `subn` retire chaque commentaire dans la même passe. La ligne un peu étrange `partial if not n else ""` compte : une ligne qui était *entièrement* un commentaire doit disparaître complètement (devenir une chaîne vide), tandis qu'une ligne avec un commentaire embarqué garde son texte visible proprement nettoyé.

**👟 Indice de départ :** Exécute-le sur la diapositive 1 du deck — la ligne `<!-- Note: open with... -->` devrait produire exactement une note et une chaîne vide à sa place, laissant `<p>Short talks...` propre.

**🎯 Résultat attendu :** `body:` affiche une ligne avec `<!-- ... -->` disparu et `Visible line.` intact, et `notes:` affiche `['say this slowly']`.

**🩹 Si ça ne marche pas :** Si le commentaire survit dans le corps, le regex n'a rien trouvé — vérifie que tu as utilisé `re.DOTALL` (sinon un commentaire *sur plusieurs lignes* s'étendant sur deux lignes ne correspond jamais lors d'une passe ligne par ligne). Si une note est capturée deux fois, `finditer` + `subn` comptent deux fois le même commentaire — ils doivent s'exécuter sur la même chaîne une fois chacun ; une note dupliquée signifie que la boucle de recherche a tourné deux fois.

### 4.2 Vérifie l'extraction des notes

**✅ Liste de vérification**

- ✅ Un commentaire sur une ligne devient une note et disparaît du corps visible.
- ✅ Un commentaire sur plusieurs lignes (`<!--\nnote\nmore note\n-->`) devient une seule note en plusieurs parties, entièrement retirée.
- ✅ Le texte avant et après un commentaire en ligne sur la même ligne survit tous les deux, seul le commentaire disparaît.
- ✅ Un deck sans aucun commentaire se rend quand même — `notes` est une liste vide, le corps inchangé.

**🤔 Question(s) socratique(s)**

- Nous avons choisi les `commentaires HTML` comme porteur de notes. Que garantit ce choix sur les notes (elles sont invisibles dans un navigateur jusqu'à ce que tu affiches la source) et que perd-il (des notes structurées comme une réplique-de-diapositive) ? Y a-t-il un marqueur natif markdown (`::notes::`) qui survivrait au rendu *et* serait découvrable — et que casserais-tu en l'ajoutant ?
- Les notes sont capturées de façon gourmande (`.*?` s'arrête à la première `-->`). Écris le commentaire qui fait produire au match paresseux une note *partielle* — un `-->` à l'intérieur d'une note est-il jamais légitime, et la convention devrait-elle l'interdire ?

## Étape 5 : Assemble et livre le deck

Tout existe comme pièces ; l'Étape 5 est l'acte de faire un fichier qui s'ouvre dans un navigateur. Le gabarit de page complète interpole titre, CSS de thème et diapositives rendues — y compris un bloc de notes du présentateur que le public ne peut pas voir — et écrit un `deck.html` autonome.

### 5.1 Compose la page complète

```python
# build.py
from pathlib import Path
from slides import split_deck
from render import render_slide
from notes import extract_notes
from theme import css_for

PAGE = """<!doctype html><html><head><meta charset="utf-8">
<title>{deck_title}</title>{css}</head><body>{slides}{notes}</body></html>"""

def build(deck_path: str, theme: str = "light") -> str:
    slides = [render_slide(s) for s in split_deck(Path(deck_path).read_text())]
    rendered = []
    raw_notes = []
    for s in slides:
        body, notes = extract_notes(s["body_html"] if False else "")
        # simpler path: render content, then lift notes from the raw slide text
        rendered.append(f'<section><h1>{s["title"]}</h1>{s["body_html"]}</section>')
    return PAGE.format(
        deck_title="My deck",
        css=css_for(theme),
        slides="\n".join(rendered),
        notes="",
    )

if __name__ == "__main__":
    Path("deck.html").write_text(build("deck.md", "ink"), encoding="utf-8")
    print("wrote deck.html")
```

Voici le moment honnête de cet assemblage : les notes ne peuvent pas être extraites de `body_html` — elles ont déjà été retirées pendant le rendu, donc le pipeline correct les extrait du *texte de diapositive brut* à la place. L'étape `render_slide` devrait donc être nourrie de la diapositive entièrement nettoyée de ses notes. Cette correction de conception est le point pédagogique de l'étape : quand tu composes de vrais outils, l'*ordre* des transformations est décidé par les dépendances de données, pas par l'ordre où tu les as d'abord imaginées — et une branche morte laissée en commentaire est le résidu honnête de cette correction.

```python
# build.py — the corrected pipeline
def build(deck_path: str, theme: str = "light", deck_title: str = "My deck") -> str:
    slides = []
    all_notes = []
    for raw in split_deck(Path(deck_path).read_text()):
        clean, notes = extract_notes(raw)
        s = render_slide(clean)
        slides.append(f'<section><h1>{s["title"]}</h1>{s["body_html"]}</section>')
        all_notes.extend(notes)
    notes_html = "\n".join(f"<p hidden>Note: {n}</p>" for n in all_notes)
    return PAGE.format(deck_title=deck_title, css=css_for(theme),
                       slides="\n".join(slides), notes=notes_html)

if __name__ == "__main__":
    Path("deck.html").write_text(build("deck.md", "ink"), encoding="utf-8")
    print("wrote deck.html")
```

La boucle corrigée est le seul vrai pipeline : extraire → nettoyer → rendre → envelopper. Chaque diapositive devient un `<section>` contenant un `<h1>` (le titre) plus son corps, et les notes extraites atterrissent dans des éléments `<p hidden>` à la fin de la page — présentes dans la source pour le présentateur, `display:none` pour le public. L'appel `PAGE.format(...)` nomme chaque emplacement, et les fonctions à but unique de style Flask gardent chaque transformation séparée et testable.

**👟 Indice de départ :** Construis le deck au thème encre, ouvre `deck.html` dans un navigateur, et fais défiler — deux diapositives pleine hauteur, le titre `Why short talks` en haut de la première, fond sombre, et les notes `<p hidden>` visibles uniquement si tu affiches la source.

**🎯 Résultat attendu :** `wrote deck.html` ; le fichier s'ouvre comme une page de deux diapositives — fond sombre (`ink`), en-têtes serif, corps du type `Visible line.`, pastilles de code sur toute diapositive de code, et un bloc caché de notes à la fin.

**🩹 Si ça ne marche pas :** Si les notes apparaissent *visibles* sur la page, `hidden` n'est pas émis pour l'enveloppe des notes — `<p hidden>` se rend comme display:none dans tous les navigateurs modernes ; vois la chaîne littérale dans la jointure des notes. Si l'en-tête d'une diapositive apparaît deux fois (une fois dans `h1`, une fois dans le corps), `render_slide` a reçu la diapositive non nettoyée et la duplicata d'en-tête dans le corps n'a jamais été retirée — assure-toi que `extract_notes` a tourné *avant* `render_slide`, comme dans la boucle corrigée.

### 5.2 Vérifie le deck livré

**✅ Liste de vérification**

- ✅ `deck.html` s'ouvre dans un navigateur comme exactement deux diapositives avec des sections pleine hauteur et un `<h1>` chacune.
- ✅ Le thème `ink` est visiblement appliqué (fond sombre, texte clair) — le remplacement `--theme` est un seul argument.
- ✅ Les notes apparaissent dans la source sous `<p hidden>` et nulle part dans la page visible.
- ✅ Reconstruire après avoir édité `deck.md` produit un fichier mis à jour — la sortie est dérivée, jamais maintenue à la main.

**🤔 Question(s) socratique(s)**

- Le pipeline corrigé exécute `extract_notes` avant `render_slide`. Chronomètre concrètement le mode d'échec du *mauvais* ordre : que deviendrait une note comme `Note: underline the word "trust"` si elle survivait dans le markdown (indice : `**trust**`), et pourquoi retirer d'abord protège-t-il l'étape de rendu ?
- Les titres de diapositives viennent du contenu, et les notes sont collectées à plat — aucune association avec la diapositive dont elles proviennent. Quel est le changement (un dict `slide_index -> notes`, ou un attribut `data-slide` sur chaque `<p hidden>`) qui rendrait les notes *utilisables* par un outil de script de présentateur, et préférerais-tu cela maintenant ou après ton premier deck de 20 diapositives ?

## ⚠️ Pièges courants

- **Découpage aveugle à la délimitation.** Un `---` dans un bloc délimité ```` ``` ```` est une donnée (une diapositive montrant littéralement un séparateur), mais un découpeur naïf le transforme en deux diapositives et double silencieusement le compte du deck. La bascule `in_fence` doit vivre dans la boucle du découpeur, keynée sur `startswith("```")` pour que les délimitations à espace final se ferment quand même.
- **Commentaires survivant dans le HTML visible.** Un `<!-- Note: ... -->` qui échappe à l'étape de retrait se rend comme un commentaire gris *visible* dans les diapositives — exactement la note que le public ne doit jamais voir. Extrais avec le motif à deux passes (`finditer` pour la collecte, `subn` pour le retrait) et teste qu'une ligne qui n'est *qu'un* commentaire devient vide, pas vide-mais-matérialisée.
- **Mettre une seule accolade dans un f-string.** `css_for` écrit du CSS, et le CSS est plein d'accolades littérales ; un `{ background: ... }` à accolade unique lève `KeyError` ou, pire, interpole. Doubler chaque accolade structurelle (`{{ }}`) est la seule voie — ou construis le CSS par concaténation de chaînes et esquive toute la classe de bug.
- **Rendre les notes dans le markdown.** Si `extract_notes` tourne *après* `render_slide`, du texte de note comme `the word **trust**` alimente le rendeur markdown et devient du texte gras visible. L'ordre par dépendance de données — retirer les commentaires d'abord, rendre ensuite — est une vraie contrainte, pas un style maison.
- **Interpoler du contenu non fiable dans le HTML.** Le texte de diapositive devient du HTML intérieur `<section>` via f-string. Le contenu de diapositive est le tien pour l'instant, mais dès que les notes ou les titres viennent d'un fichier non fiable, l'interpolation brute est un début de XSS. La ligne honnête : garde les `decks` sous ton propre contrôle ou ajoute une passe d'échappement, et n'« améliore » jamais en poussant une nouvelle source sans mettre à jour cette décision.

## Ce que tu viens de construire

Un constructeur de présentations fonctionnel : `deck.md` en entrée, un `deck.html` autonome en sortie — diapositives découpées proprement même à travers des séparateurs délimités, titres dérivés des premières en-têtes, un thème que tu peux remplacer avec un argument, et des notes du présentateur cachées au public mais présentes dans la source. La compétence transférable est l'instinct de *pipeline déclaratif* : le contenu comme données en texte brut, le rendu comme transformations ordonnées, et le thème comme configuration — la forme exacte derrière chaque outil « écris une fois, livre plusieurs », des générateurs de sites statiques aux frameworks de diapositives en passant par les moteurs de rapport. Ta prochaine conférence est déjà un fichier `.md` qui se rend tout seul.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/presentation-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/presentation-builder) dans le dépôt du cours regroupe les modules de découpage, de rendu, de thème, de notes et de construction, plus le deck de démarrage et un notebook qui exécute chaque étape dans l'ordre. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et construis le deck d'exemple dans un onglet de navigateur.
:::

## Où aller à partir d'ici

- **Un drapeau CLI `--theme`** construit sur `argparse` — la thématisation existe déjà comme `css_for`, donc le drapeau fait 4 lignes, et c'est la différence entre « modifier le script » et « un vrai outil ».
- **Points de progression :** émets des liens `<a href="#slide-2">` dans une barre de pied — les présentateurs obtiennent une navigation cliquable, toujours zéro JavaScript si tu t'appuies sur les ancres.
- **Vue présentateur :** une seconde `<section hidden>` à la fin qui associe les notes de chaque diapositive à une horloge en direct, pour que la présentation en cours garde son script à un défilement près.
- **Un raccourci `--pdf` :** après avoir écrit `deck.html`, invoque l'impression sans tête de ton OS (`chromium --headless --print-to-pdf`) depuis Python — le pipeline reste un fichier, et les documents apparaissent sans application.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier — un deck que tu as réellement présenté depuis du HTML, un thème dont tes camarades ont parlé ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README t'accompagne dans l'ajout du tien via une **pull request** de bout en bout : forker, créer une branche, commiter, et ouvrir la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
