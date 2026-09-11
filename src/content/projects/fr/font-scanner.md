---
title: "Outil d'Appariement de Polices"
description: "Trouvez des appariements de polices complémentaires avec prévisualisation et alternatives web-safe."
difficulty: "beginner"
estimatedMinutes: 40
tags: ["fonts", "design-tools", "google-fonts", "pillow"]
learningObjectives:
  - "Analyser les polices système et extraire des métadonnées avec Pillow"
  - "Classer les polices par catégorie de typos en utilisant des règles heuristiques"
  - "Noter et classer les appariements de polices selon le contraste et l'équilibre des graisses"
  - "Générer des images d'aperçu montrant le texte des titres et du corps"
  - "Générer des chaînes de repli CSS font-family avec des génériques web-safe"
prerequisites: ["Les bases de Python", "Les bases de Pillow"]
---

# 🛠️ 🔤 Construis un Outil d'Appariement de Polices

La typographie est la décision de design la plus visible de toute page web, et bien apparier deux polices — une pour les titres, une pour le corps du texte — est une compétence soutenue par un petit nombre de règles concrètes : le contraste de catégorie (serif vs. sans-serif) et le contraste de graisse (titre en gras, corps en normal). Ce projet construit un outil qui applique ces règles mécaniquement : il analyse les fichiers de polices réellement installés sur ton système, classe chacune, note chaque paire possible, classe les meilleures, génère une image d'aperçu montrant l'appariement et exporte une pile CSS `font-family` prête pour la production avec des replis multiplateformes.

Ce projet suppose que tu maîtrises Python 101 et que tu as une familiarité de base avec PIL/Pillow — rien de la formation Data Analysis n'est requis. Il est facultatif et non noté ; consulte [Real-World Projects](/fr/projets) pour la liste complète, qui ne cesse de s'allonger.

## 🎯 Ce que tu vas faire

1. Analyser de vrais fichiers de polices sur ton système avec Pillow et extraire le nom de famille, la graisse et le style.
2. Classer chaque police comme serif, sans-serif, monospace ou display.
3. Noter chaque paire de polices selon le contraste de catégorie et l'équilibre des graisses, et classer les meilleures.
4. Générer une image d'aperçu titre/corps d'un appariement pour confirmer visuellement le résultat.
5. Générer des piles CSS `font-family` avec des génériques de repli web-safe.

## Où exécuter ceci

**Localement avec `uv`** est le chemin principal, recommandé — l'étape d'analyse lit les fichiers de polices de tes répertoires système (`/usr/share/fonts`, `~/.fonts`, `/System/Library/Fonts`), et les résultats dépendent de ce que tu as installé.

**GitHub Codespaces** fonctionne bien : ouvre [le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course). Les images de conteneur basées sur Debian sont livrées avec une poignée de polices DejaVu et Liberation — moins qu'un bureau typique, mais assez pour exercer chaque étape.

**Google Colab et Kaggle Notebooks** sont un vrai moyen d'exécuter ceci — un notebook a un petit ensemble de polices fournies avec son image Linux. L'avertissement honnête est que l'analyse de polices renverra moins de résultats qu'un bureau avec un DE complet installé, ce qui est en fait *utile* : cela te permet de voir comment l'outil se comporte quand les polices sont rares, et l'étape d'aperçu/rendu fonctionne toujours avec ce qui est disponible. Le notebook ci-dessous utilise les polices système du notebook lui-même pour que chaque pièce de l'outil s'exécute sur de vrais fichiers. Utilise-le pour voir le pipeline fonctionner de bout en bout ; passe au `uv` local ou à un Codespace une fois que tu veux une analyse plus riche.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/font-scanner/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/font-scanner/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffont-scanner%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin est un seul paquet PyPI — aucune clé API, aucun service externe.

### Installe `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis installer pip, puis installer un outil d'environnement virtuel, puis installer les paquets » — il peut installer et gérer lui-même les versions de Python, aux côtés des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme l'installation :

```bash
uv --version
```

### Configure le projet

```bash
uv init font-scanner
cd font-scanner
uv add Pillow
```

`Pillow` est le seul paquet dont tu as besoin — il lit les fichiers TrueType et OpenType, rend du texte en images et charge des polices par défaut pour les étiquettes. Tout le reste vient de `pathlib` et `colorsys` de Python.

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `font-scanner/` existe avec un `pyproject.toml`, et `Pillow` est installé.

## Étape 1 : Analyse les polices de ton système

Une police n'est qu'un fichier — `.ttf` ou `.otf` — situé dans un répertoire connu. `ImageFont.truetype(path)` de Pillow le charge soit avec succès, soit lève une erreur, ce qui te donne un filtre naturel : chaque fichier qui se charge sans erreur est une police que ton système peut réellement rendre. L'analyse parcourt les répertoires courants, lit un échantillon à 20 px (assez pour vérifier qu'elle est réelle) et construit une liste de dictionnaires avec le chemin, le nom de famille, la graisse et le style.

### 1.1 Construis l'analyseur de polices

**👟 Indice de départ :** Parcours `~/.fonts`, `/usr/share/fonts`, `/System/Library/Fonts` (macOS) et `C:/Windows/Fonts` (Windows) ; pour chaque fichier `.ttf`/`.otf`, tente `ImageFont.truetype` et attrape `OSError` pour les fichiers cassés ou illisibles.

```python
# font_scanner.py
from pathlib import Path
from PIL import ImageFont

def scan_system_fonts(limit: int = 60) -> list[dict]:
    """Find loadable fonts in common system directories."""
    font_dirs = [
        Path.home() / ".fonts",
        Path("/usr/share/fonts"),
        Path("/System/Library/Fonts"),
        Path("C:/Windows/Fonts"),
    ]
    fonts = []
    for font_dir in font_dirs:
        if not font_dir.exists():
            continue
        for ext in ("*.ttf", "*.otf", "*.ttc"):
            for font_path in font_dir.rglob(ext):
                try:
                    _font = ImageFont.truetype(str(font_path), size=20)
                except OSError:
                    continue
                family = font_path.stem.replace("-", " ").replace("_", " ").title()
                fonts.append({
                    "path": str(font_path),
                    "family": family,
                    "weight": "bold" if any(w in family.lower() for w in ("bold", "black", "heavy")) else "regular",
                    "style": "italic" if "italic" in family.lower() else "normal",
                })
                if len(fonts) >= limit:
                    return fonts
    return fonts

fonts = scan_system_fonts()
print(f"Found {len(fonts)} fonts")
for f in fonts[:5]:
    print(f"  {f['family']} — {f['weight']}, {f['style']}")
```

La limite `limit=60` est une garde pratique : certains systèmes ont des milliers de fichiers de polices (surtout macOS), et charger chacun d'eux uniquement pour classer les 10 meilleures paires est lent et inutile. L'extraction du nom de famille — remplacer les traits d'union et les tirets bas par des espaces, puis mettre en titre — est une heuristique qui fonctionne bien pour les noms de polices standard (DejaVu Sans, Liberation Serif) mais pas pour tous ; elle est assez bonne pour la classification, qui est l'étape suivante. Le `except OSError` attrape les fichiers que Pillow ne peut pas analyser (fichiers corrompus, formats de polices que Pillow ne supporte pas) sans faire planter toute l'analyse.

**🎯 Résultat attendu :** Affiche `Found N fonts` où N est entre 5 (conteneur épars) et 60 (plafonné), suivi des cinq premières familles de polices avec leur graisse et leur style déduits.

**🩹 Si ça ne marche pas :** Si `Found 0 fonts` sur un système qui a définitivement des polices installées, les répertoires de polices sont non standard — ajoute le vrai chemin de polices de ton système à `font_dirs`. Si l'analyse est très lente, le `limit` est trop élevé ou un répertoire est énorme — réduis-le à 30 et vois quels répertoires contribuent le plus. Si `ImageFont.truetype` lève `OSError` sur chaque fichier, ton installation Pillow est peut-être incomplète — refais `uv add Pillow` pour la reconstruire.

### 1.2 Vérifie l'analyse

**✅ Liste de vérification**

- ✅ `fonts` est une liste de dictionnaires, chacun avec les clés `path`, `family`, `weight` et `style`.
- ✅ Tu peux expliquer pourquoi `limit=60` est un plafond raisonnable — que se passe-t-il si tu le retires sur un Mac avec plus de 5 000 polices système ?

**🤔 Question(s) socratique(s)**

- Le nom de famille est dérivé du nom de fichier (`font_path.stem`), pas des métadonnées internes de la police. Quel genre de décalage cela introduirait-il, et quelle API Pillow te donnerait le *vrai* nom de famille encodé dans le fichier ?
- Les fichiers `.ttc` (TrueType Collections) contiennent plusieurs polices dans un seul fichier. Comment `ImageFont.truetype` les gère-t-il, et quel est le risque si la première police d'un `.ttc` n'est pas celle que tu utiliserais ?

## Étape 2 : Classe les polices par catégorie

Les polices se répartissent en quatre grandes familles — serif, sans-serif, monospace et display — et un bon appariement contraste toujours deux familles différentes. Ce classifieur utilise le nom de la police (comme extrait à l'étape 1) comme heuristique rapide : le mot « Mono » dans le nom signifie presque toujours monospace, « Serif » signifie serif, et ainsi de suite. Ce n'est pas parfait, mais c'est assez souvent juste pour produire des classements utiles.

### 2.1 Écris `classify_font`

**👟 Indice de départ :** Vérifie le nom de famille en minuscules pour des occurrences de mots-clés dans un ordre précis — monospace d'abord (c'est le plus distinctif), puis serif, puis display, avec le sans-serif comme défaut fourre-tout.

```python
# font_scanner.py (continued)
def classify_font(font_info: dict) -> str:
    """Classify a font as sans-serif, serif, monospace, or display based on its family name."""
    name = font_info["family"].lower()
    if any(kw in name for kw in ("mono", "code", "courier", "console")):
        return "monospace"
    if any(kw in name for kw in ("serif", "times", "georgia", "bodoni")):
        return "serif"
    if any(kw in name for kw in ("display", "script", "decorative")):
        return "display"
    return "sans-serif"

for f in fonts[:5]:
    print(f"  {f['family']:>30s} -> {classify_font(f)}")
```

Les listes de mots-clés sont délibérément petites et prudentes : « Times » attrape Times New Roman et Times ; « Georgia » attrape le serif web-safe commun le plus utilisé. Élargir la liste trop loin risque de faux positifs — une police nommée « Playfair Display » est correctement attrapée par « display », mais une police nommée « Open Sans » ne devrait *pas* correspondre à « serif » simplement parce que la chaîne s'y trouve par hasard. Le repli vers `sans-serif` est correct parce que le sans-serif est le défaut le plus courant des systèmes modernes — la majorité des polices système qui ne sont pas manifestement autre chose sont des sans-serif.

**🎯 Résultat attendu :** Une ligne par police montrant son nom de famille et sa catégorie assignée — par ex. `DejaVu Sans -> sans-serif`, `Liberation Serif -> serif`, `DejaVu Sans Mono -> monospace`.

**🩹 Si ça ne marche pas :** Si une police que tu sais être serif est classée sans-serif, son nom ne contient aucun des mots-clés heuristiques — ajoute le nom de la police à la liste, ou accepte que la classification par nom a des limites (notées dans les pièges). Si une police sans-serif est mal classée serif, vérifie les correspondances de sous-chaîne accidentelles (l'opérateur `in` est ici sensible à la casse, mais le nom est d'abord mis en minuscules).

### 2.2 Vérifie la classification

**✅ Liste de vérification**

- ✅ Chaque police de `fonts` a une `category` qui est l'une des quatre chaînes attendues.
- ✅ Au moins une police de l'analyse est classée `sans-serif` — le défaut le plus courant.

**🤔 Question(s) socratique(s)**

- Une police nommée « Source Code Pro » — que renvoie le classifieur, et est-ce correct ? Et « Source Sans Pro » ?
- Quelle est la limite fondamentale de la classification par nom, et que devrait faire un classifieur *précis* à la place ? (Indice : il devrait lire quelque chose à l'intérieur du fichier de police lui-même.)

## Étape 3 : Note et classe les appariements

Les deux règles typographiques fondamentales pour apparier sont : (1) les deux polices devraient appartenir à des catégories *différentes* (contraste de forme), et (2) l'une devrait être en gras pendant que l'autre est en normal (contraste de graisse). Cette étape applique ces règles mécaniquement : note chaque paire, classe par total et remonte les meilleures correspondances.

### 3.1 Écris `score_pairing` et trouve les meilleures paires

**👟 Indice de départ :** Note le contraste de catégorie à 10 (différent) contre 3 (identique), et l'équilibre des graisses à 8 (un gras + un normal) contre 4 (même graisse des deux côtés) — le total est sur 20.

```python
# font_scanner.py (continued)
def score_pairing(font_a: dict, font_b: dict) -> dict:
    """Score a font pairing based on contrast and weight-balance rules."""
    class_a = classify_font(font_a)
    class_b = classify_font(font_b)

    contrast = 10 if class_a != class_b else 3
    weight_a = 1 if font_a["weight"] == "bold" else 0
    weight_b = 1 if font_b["weight"] == "bold" else 0
    weight_balance = 8 if weight_a != weight_b else 4

    total = contrast + weight_balance
    rating = "excellent" if total >= 16 else "good" if total >= 10 else "fair"

    return {
        "font_a": font_a["family"],
        "font_b": font_b["family"],
        "class_a": class_a,
        "class_b": class_b,
        "contrast": contrast,
        "weight_balance": weight_balance,
        "total_score": total,
        "rating": rating,
    }

results = []
for i, fa in enumerate(fonts[:10]):
    for fb in fonts[i + 1:15]:
        score = score_pairing(fa, fb)
        if score["rating"] == "excellent":
            results.append(score)

results.sort(key=lambda x: x["total_score"], reverse=True)
print(f"\nTop pairings ({len(results)} excellent):")
for r in results[:3]:
    print(f"  {r['font_a']} + {r['font_b']} — {r['rating']} ({r['total_score']}/20)")
```

La boucle imbriquée `for i, fa in enumerate(fonts[:10]): for fb in fonts[i + 1:15]:` limite délibérément l'espace de recherche — comparer les 10 premières polices aux 5 suivantes te donne 45 paires à évaluer, ce qui est assez pour faire remonter des résultats significatifs sans explosion combinatoire. `results.sort(key=lambda x: x["total_score"], reverse=True)` garantit que les meilleurs scores apparaissent en premier, et le filtrage à `rating == "excellent"` (score ≥ 16) garde la sortie concentrée sur des appariements réellement forts plutôt qu'une longue liste de médiocres.

**🎯 Résultat attendu :** Une liste triée des appariements excellents, chacun imprimant deux noms de polices, une note « excellent » et un score sur 20. La meilleure paire a un score de 18 (catégorie différente = 10 + équilibre des graisses = 8).

**🩹 Si ça ne marche pas :** Si la liste de résultats est vide, aucune paire n'a marqué ≥ 16 — soit toutes les polices de l'analyse sont de la même catégorie, soit aucune n'a des graisses contrastées. Élargis la plage de recherche (`fonts[:20]` au lieu de `[:10]`). Si une paire que tu sais être excellente ne marque que « fair », le classifieur ou l'heuristique de graisse a eu les deux polices faux — trace `classify_font` et le champ de graisse pour les deux.

### 3.2 Vérifie les classements

**✅ Liste de vérification**

- ✅ La meilleure paire a un total de 18 (10 contraste + 8 équilibre des graisses) — confirmant que les deux règles ont été déclenchées.
- ✅ Tu peux nommer une paire qui a marqué « good » mais pas « excellent » et expliquer pourquoi le total est descendu sous 16.

**🤔 Question(s) socratique(s)**

- Deux polices sont toutes deux sans-serif mais l'une est `bold` — le score est 3 + 8 = 11 (« good »). Un guide d'appariement de polices appellerait quand même ceci utilisable. Quel est le coût du fait que ton outil l'*exclue* de « excellent », et comment changerais-tu les seuils si tu voulais l'inclure ?
- La fonction de notation traite tous les contrastes de catégorie de façon égale (serif vs. sans-serif et monospace vs. display marquent tous deux 10). Est-ce réaliste — quels appariements créent réellement le plus fort contraste visuel, et comment encoderais-tu cette différence ?

## Étape 4 : Génère l'aperçu d'un appariement

Un score est un nombre ; un aperçu est une image. Les mêmes polices que tu viens de classer peuvent être rendues avec un titre dans la première police et un paragraphe de corps dans la seconde, disposées comme une vraie page — et sauvegardées en PNG que tu peux envoyer à un designer. Cette étape est la confirmation visuelle que la notation a réellement produit un résultat agréable à regarder.

### 4.1 Construis `render_preview`

**👟 Indice de départ :** Crée une `Image` Pillow blanche de 800×500, dessine le titre dans la première police à 36 px, dessine une règle horizontale et retourne à la ligne le texte du corps manuellement pour qu'il ne déborde pas de la largeur du canevas.

```python
# font_scanner.py (continued)
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

def render_preview(heading_font_path: str, body_font_path: str,
                   heading_text: str = "The Quick Brown Fox Jumps",
                   body_text: str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
                                   "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                   output_path: str = "preview.png") -> None:
    """Render a heading + body font pairing preview image."""
    width, height = 800, 500
    img = Image.new("RGB", (width, height), "#ffffff")
    draw = ImageDraw.Draw(img)

    try:
        heading_font = ImageFont.truetype(heading_font_path, 36)
        body_font    = ImageFont.truetype(body_font_path, 18)
    except OSError as e:
        print(f"Error loading fonts: {e}")
        return

    draw.text((40, 40), heading_text, fill="#1a1a1a", font=heading_font)
    draw.line([(40, 100), (760, 100)], fill="#cccccc", width=1)

    y = 130
    line = ""
    for word in body_text.split():
        test = f"{line} {word}".strip()
        if draw.textbbox((0, 0), test, font=body_font)[2] > 720:
            draw.text((40, y), line, fill="#333333", font=body_font)
            y += 28
            line = word
        else:
            line = test
    if line:
        draw.text((40, y), line, fill="#333333", font=body_font)

    label_font = ImageFont.load_default()
    draw.text((40, height - 50), f"Heading: {Path(heading_font_path).stem}", fill="#888888", font=label_font)
    draw.text((400, height - 50), f"Body: {Path(body_font_path).stem}", fill="#888888", font=label_font)

    img.save(output_path, quality=95)
    print(f"Preview saved to {output_path}")

if len(fonts) >= 2:
    render_preview(fonts[0]["path"], fonts[1]["path"], output_path="my_pairing.png")
```

La boucle de retour à la ligne est la pièce la plus intéressante : elle construit une ligne mot par mot, teste sa largeur avec `draw.textbbox` (qui renvoie la boîte englobante) et ne valide la ligne que lorsque le mot suivant dépasserait 720 px. C'est l'algorithme de retour à la ligne correct le plus simple — des versions plus sophistiquées gèrent les traits d'union et les espaces de largeur variable, mais pour une image d'aperçu, cela produit une sortie propre et lisible. Le `label_font = ImageFont.load_default()` en bas utilise la police bitmap 10 px intégrée de Pillow — elle est moche mais garantie de se charger sur chaque installation Pillow, ce qui est exactement le bon compromis pour une petite étiquette.

**🎯 Résultat attendu :** Un fichier `my_pairing.png` montrant un grand titre dans la première police, une fine règle horizontale et un paragraphe de corps avec retour à la ligne dans la seconde police, avec de minuscules étiquettes en bas.

**🩹 Si ça ne marche pas :** Si l'image est vide ou le texte n'apparaît pas, le chemin du fichier de police est faux ou la police ne supporte pas les caractères que tu rends — essaie une autre police de la liste `fonts`. Si le texte du corps déborde verticalement, la limite de retour à la ligne (720) est trop grande pour la taille de police, ou le texte est trop long pour un canevas de 500 px de haut — raccourcis le texte du corps ou augmente la hauteur du canevas. Si `render_preview` sort tôt avec une `OSError`, l'un des deux chemins de polices est invalide.

### 4.2 Vérifie l'aperçu

**✅ Liste de vérification**

- ✅ `my_pairing.png` existe et montre clairement des polices différentes pour le texte du titre et du corps.
- ✅ Le texte du titre est plus grand que le texte du corps et les deux sont lisibles à leurs tailles respectives.

**🤔 Question(s) socratique(s)**

- L'aperçu utilise un fond blanc avec un texte sombre — la convention web la plus courante. Quels changements ferais-tu à `render_preview` pour tester l'appariement sur un fond sombre (texte blanc sur `#1a1a1a`), et laquelle des fonctions de vérification de contraste du projet design-system utiliserais-tu pour le vérifier ?
- Les polices de titre et de corps sont rendues à des tailles fixes (36 px et 18 px). Sur une vraie page web, ces tailles sont contrôlées par CSS, pas par l'image. Que t'apprend *réellement* l'aperçu sur l'appariement que CSS seul ne t'apprendrait pas ?

## Étape 5 : Génère les piles CSS font-family

Un nom de police sur ton système n'est pas la même chose qu'un nom de police sur le système d'un visiteur. Une pile `font-family` liste la police souhaitée en premier, puis une chaîne de replis web-safe de plus en plus génériques — le navigateur utilise la première qu'il peut trouver. Cette étape transforme tes polices analysées et appariées en piles CSS qui fonctionnent multiplateforme.

### 5.1 Construis `generate_css_stack`

**👟 Indice de départ :** Mappe chaque catégorie à sa famille de repli web-safe standard et renvoie une chaîne séparée par des virgules : `'Desired Font', fallback1, fallback2, generic-category`.

```python
# font_scanner.py (continued)
FALLBACKS = {
    "sans-serif": "Arial, Helvetica, sans-serif",
    "serif":      "Georgia, 'Times New Roman', Times, serif",
    "monospace":  "'Courier New', Courier, monospace",
    "display":    "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
}

def generate_css_stack(font_family: str, category: str) -> str:
    """Build a CSS font-family stack with web-safe fallbacks."""
    generic = FALLBACKS.get(category, FALLBACKS["sans-serif"])
    return f"'{font_family}', {generic}"

print("/* Recommended font stacks */")
for r in results[:3]:
    css_heading = generate_css_stack(r["font_a"], r["class_a"])
    css_body    = generate_css_stack(r["font_b"], r["class_b"])
    print(f"h1 {{ font-family: {css_heading}; }}")
    print(f"body {{ font-family: {css_body}; }}")
    print()
```

L'ordre des replis compte : la police *spécifique* d'abord, puis des polices progressivement plus courantes, se terminant par la catégorie générique (`sans-serif`, `serif`, etc.) comme ultime fourre-tout. Si le navigateur ne trouve pas « DejaVu Sans » sur la machine de l'utilisateur, il retombe sur Arial, puis Helvetica, puis le sans-serif par défaut du navigateur — cette chaîne garantit que la page *toujours* semble acceptable, même si elle ne ressemble pas à l'identique de ton design. Les guillemets simples autour de `'Courier New'` sont requis parce que le nom de police contient un espace.

**🎯 Résultat attendu :** Un bloc CSS avec des déclarations `h1` et `body` pour chacune des trois meilleures paires, chacune utilisant le nom de police analysé suivi de la chaîne de repli standard.

**🩹 Si ça ne marche pas :** Si le CSS utilise un nom de police avec une virgule dedans (certaines polices en ont), il a besoin de guillemets simples autour du nom entier — le `f"'{font_family}'"` actuel gère cela correctement, mais si tu le réécrivais sans guillemets, la virgule serait analysée comme un séparateur de pile. Si le générique de repli ne correspond pas à la catégorie, vérifie les fautes de frappe dans le dictionnaire `FALLBACKS`.

### 5.2 Vérifie les piles CSS

**✅ Liste de vérification**

- ✅ Chaque ligne `font-family` générée commence par un nom de police entre guillemets simples et se termine par un mot-clé générique nu (`sans-serif`, `serif`, `monospace` ou `display`).
- ✅ Tu peux expliquer pourquoi le mot-clé générique est toujours en dernier dans la chaîne — que se passe-t-il si tu le mets en premier ?

**🤔 Question(s) socratique(s)**

- Si un visiteur web a exactement ta police installée mais à une version différente (par ex., DejaVu Sans v2.35 contre ton v2.37), le CSS changerait-il — et que cela t'apprend-il sur les limites des piles de polices pour la cohérence visuelle ?
- Comment modifierais-tu l'outil pour détecter quand une police de ton système n'a *pas* de repli web-safe bien connu, et en suggérer un ? Que signifierait même « bien connu » dans ce contexte ?

## ⚠️ Pièges courants

- **La classification par nom est une heuristique, pas une garantie.** Une police nommée « Source Sans Pro » est correctement classée sans-serif, mais une police nommée « Fira » (qui est en fait sans-serif) est classée `sans-serif` par repli plutôt que par identification positive. Pour un usage en production, lis les métadonnées internes de la police (`font.getname()`) ou sa table `sfnt` pour déterminer la vraie catégorie.
- **Les fichiers `.ttc` peuvent charger la mauvaise face.** Une TrueType Collection regroupe plusieurs polices dans un seul fichier ; `ImageFont.truetype(path, index=0)` charge la première par défaut, qui n'est peut-être pas celle que tu voudrais pour les titres. Pour le travail d'appariement, préfère les fichiers `.ttf` ou `.otf` individuels où la face est sans ambiguïté.
- **Un compte de polices de zéro sur les systèmes minimaux.** Un conteneur frais ou une VM cloud minimale peut n'avoir aucune police système — l'analyseur renvoie `[]` et chaque étape en aval plante sur une liste vide. Garde avec `if not fonts: print("No fonts found; install DejaVu or Liberation fonts.")` et sors tôt, ou fournis une police de repli fournie avec le projet.
- **Débordement de l'aperçu sur de petits canevas.** Un texte du corps trop long pour un canevas de 500 px de haut sera rogné par Pillow sans avertissement. Raccourcis le paramètre par défaut `body_text` ou augmente la hauteur du canevas — ne compte pas sur l'appelant pour deviner la bonne longueur.
- **Les graisses de polices déduites des noms sont peu fiables.** Une police nommée « DejaVu Sans » peut en réalité contenir une variante grasse à un chemin différent — ton analyseur la traite comme « regular » parce que « bold » n'est pas dans le nom de fichier. Pour une détection précise de la graisse, essaie de charger la police à une graisse plus lourde et attrape l'`OSError`, ou analyse la table `name` de la police.

## Ce que tu viens de construire

Un outil d'analyse et d'appariement de polices fonctionnel : il analyse de vrais fichiers de polices sur ton système, les classe par catégorie en utilisant des heuristiques par nom, note chaque paire selon deux règles typographiques concrètes, classe les meilleurs appariements, génère une image d'aperçu titre/corps confirmant visuellement le résultat et produit des piles CSS `font-family` prêtes pour la production avec des replis multiplateformes. Rien ici n'est un simulacre — les chemins de polices sont de vrais fichiers, l'image d'aperçu utilise les véritables typos et la sortie CSS est copiable-collable dans une feuille de style vivante.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/font-scanner/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/font-scanner) dans le dépôt du cours est une version notebook exécutable : l'analyse, la classification, la notation et l'aperçu s'exécutent tous en un seul passage de notebook en utilisant les polices système du noyau. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le de là.
:::

## Où aller ensuite

- **Interroge l'API Google Fonts** : récupère les 50 meilleures polices Google par popularité, filtre par catégorie et renvoie-les comme une liste de dictionnaires avec `family`, `category` et `variants` — étends l'outil au-delà des polices locales vers le catalogue web complet.
- **Construis une feuille de spécimens de polices** : pour une seule police, rends l'alphabet complet (majuscules et minuscules), les chiffres 0–9, la ponctuation courante et un paragraphe de texte d'échantillon à plusieurs tailles (12, 18, 24, 36, 48 px) sur une seule image — le livrable standard pour l'évaluation des polices.
- **Ajoute un analyseur de contraste** : rends un échantillon de texte blanc-sur-blanc à différents ratios de contraste et vérifie chacun contre WCAG AA (4,5:1) et AAA (7:1) en utilisant la luminance relative — reliant ce projet aux mathématiques d'accessibilité du Design System Generator.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans le monde où Python lit tes polices. 🎓