---
title: "Générateur de Palette de Couleurs"
description: "Générez des palettes de couleurs harmonieuses à partir de couleurs de base avec vérification de contraste d'accessibilité."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["colors", "cli", "stdlib", "design"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions)"
learningObjectives:
  - "Convertir entre les espaces colorimétriques hexadécimal, RVB et TSV"
  - "Générer des palettes complémentaires, analogues et triadiques à partir d'une teinte de base"
  - "Calculer les rapports de contraste WCAG et juger la conformité AA/AAA"
  - "Exporter les palettes comme variables CSS et en JSON"
  - "Envelopper tout l'outil dans une petite interface en ligne de commande"
---

# 🎨 Construire un Générateur de Palette de Couleurs

Choisir des couleurs qui vont réellement ensemble fait la différence entre une application à l'allure professionnelle et un cirque à roulettes, et pourtant « harmonieux » est d'habitude un ressenti, pas une formule. Il se trouve que la **roue chromatique** vous donne des règles précises : les couleurs complémentaires sont à 180° l'une de l'autre, les triadiques à 120°, les voisines analogues à 30°. Ce projet construit un outil qui applique ces règles à *n'importe quelle* couleur de base, puis vérifie chaque candidat selon les directives de contraste WCAG pour que vous ne donniez jamais à personne une palette où le texte disparaît dans l'arrière-plan.

Ceci suppose Python 101 — variables, boucles, fonctions et `print` de base — rien de l'Analyse de Données n'est nécessaire. C'est facultatif et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Convertir des couleurs entre hex (`#3366cc`), RVB `(51, 102, 204)` et l'espace teinte/saturation/valeur TSV en aller-retour.
2. Générer des palettes complémentaires, analogues et triadiques à partir d'une seule couleur de base.
3. Calculer le rapport de contraste WCAG entre deux couleurs et juger si elles passent l'AA.
4. Exporter n'importe quelle palette comme variables CSS et en JSON.
5. Envelopper le tout dans une petite CLI qui affiche une palette et son rapport de contraste en une commande.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — ce projet n'utilise que la bibliothèque standard de Python (le module `colorsys`), donc la configuration est réellement « prends un Python et un dossier de projet ». La section Configuration ci-dessous le détaille.

**GitHub Codespaces** est une alternative sans installation : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal dans ton onglet de navigateur.

**Google Colab, Kaggle Notebooks ou Binder** sont un bon moyen de *jouer* avec les calculs colorimétriques, car ils ne requièrent ni clés API ni GPU — un notebook exécutable se trouve dans [`examples/color-palette/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ipynb). Clique sur un badge pour le lancer sans aucune configuration locale :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcolor-palette%2Fnotebook.ipynb)

Sois honnête sur le compromis, cependant : un notebook exécute la *même* palette d'exemple à chaque fois. La CLI locale est là où tu tapes ta propre couleur de marque et obtiens un vrai rapport en retour.

## Configuration

`uv` est un outil unique qui remplace toute la chaîne « install Python, puis pip, puis un outil d'environnement virtuel » — et comme ce projet n'a besoin d'aucun paquet tiers, la configuration est vraiment « prends un Python et un dossier ».

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme son installation :

```bash
uv --version
```

Ensuite, configure le projet :

```bash
uv init color-palette
cd color-palette
```

C'est tout — pas de ligne `uv add`. Tout ce que ce projet importe (`colorsys`, `json`, `argparse`) est livré dans Python lui-même, ce qui vaut la peine d'être noté : une quantité surprenante d'outils réellement utiles n'a besoin d'aucune dépendance, et savoir où vivent les outils de couleur de la bibliothèque standard fait partie de ce projet.

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `color-palette/` existe avec un `pyproject.toml`.
- ✅ `python -c "import colorsys"` réussit sans rien installer.

## Étape 1 : Convertir les couleurs entre les espaces

Les couleurs existent dans plusieurs notations. L'hex (`#3366cc`) et le RVB `(51, 102, 204)` sont ceux que les humains tapent et que les navigateurs acceptent, mais *ni l'un ni l'autre* ne facilite la création d'une palette — « tourne cette couleur de 30° vers le vert » est du charabia en RVB, et pourtant un changement d'une ligne en **TSV**, où la teinte *est* la position sur la roue chromatique. Tout le projet repose donc sur un aller-retour : hex → RVB → TSV et retour, sans rien perdre en chemin.

### 1.1 Écris les quatre fonctions de conversion

**👟 Indice de départ :** Mets quatre petites fonctions dans `color_math.py` — `hex_to_rgb`, `rgb_to_hsv`, `hsv_to_rgb`, `rgb_to_hex` — et vérifie chacune avec un `print` dans le bloc `__main__` :

```python
# color_math.py
import colorsys

def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """'#1a2b3c' -> (26, 43, 60). A leading '#' is optional."""
    h = hex_color.lstrip("#")
    if len(h) != 6:
        raise ValueError(f"{hex_color!r} is not a 6-digit hex color")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb_to_hsv(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    """Return (hue_in_degrees, saturation, value), each rounded."""
    r, g, b = (v / 255.0 for v in rgb)
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return round(h * 360.0, 2), round(s, 3), round(v, 3)

def hsv_to_rgb(h: float, s: float, v: float) -> tuple[int, int, int]:
    """Inverse of rgb_to_hsv: hue in degrees, s/v in [0, 1]."""
    r, g, b = colorsys.hsv_to_rgb(h / 360.0, s, v)
    return tuple(round(c * 255.0) for c in (r, g, b))

def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)

if __name__ == "__main__":
    print(hex_to_rgb("#3366cc"))           # (51, 102, 204)
    print(rgb_to_hsv((51, 102, 204)))      # (220.0, 0.75, 0.8)
    print(rgb_to_hex(hsv_to_rgb(220.0, 0.75, 0.8)))  # #3366cc -- round trip
```

Les deux conversions qui méritent ton attention : `rgb_to_hsv` met chaque canal à l'échelle dans `[0, 1]` et le passe à `colorsys.rgb_to_hsv`, puis multiplie la teinte retournée par `360` pour obtenir des degrés — la bibliothèque standard travaille par défaut en fractions de la roue chromatique, et le ×360 est exactement l'étape « une formule, un changement d'unité ». `hsv_to_rgb` doit annuler cette même mise à l'échelle (÷360 avant d'appeler `colorsys.hsv_to_rgb`) sinon chaque palette que tu construis est silencieusement fausse.

**🎯 Résultat attendu :**

```
(51, 102, 204)
(220.0, 0.75, 0.8)
#3366cc
```

**🩹 Si ça ne marche pas :** Une `ValueError` disant « not a 6-digit hex color » signifie que tu as passé la couleur avec un `#` initial inattendu ou un espace blanc supplémentaire — `lstrip("#")` n'enlève qu'*un seul* préfixe, et un `.strip()` sur l'entrée d'abord corrige les espaces blancs. Si l'aller-retour affiche `#3266cb` ou similaire, ton `hsv_to_rgb` arrondit au mauvais endroit — ce `round(c * 255.0)` final appartient à `hsv_to_rgb`, pas à `rgb_to_hex`.

### 1.2 Vérifie

**✅ Liste de vérification**

- ✅ `hex_to_rgb("#3366cc")` retourne `(51, 102, 204)`.
- ✅ `rgb_to_hsv((51, 102, 204))` retourne `(220.0, 0.75, 0.8)`.
- ✅ Convertir hex → RVB → TSV → RVB → hex retourne exactement la couleur d'origine.

**🤔 Question(s) socratique(s)**

- En RVB, `(51, 102, 204)` devient `(51, 102, 205)` en incrémentant un canal. Que *signifie* ce même minuscule changement en termes TSV — est-ce un changement de teinte, de luminosité, ou les deux, et pourquoi cela fait-il du TSV le bon espace pour « décaler cette couleur de 30° » ?
- Pourquoi `rgb_to_hsv` retourne-t-il des flottants arrondis alors que `hsv_to_rgb` doit arrondir à des entiers entiers ? Où un `round` à virgule flottante briserait-il profondément la garantie d'aller-retour ?

## Étape 2 : Générer des palettes harmonieuses

Voici maintenant le gain de la conversion en TSV : les règles de palette deviennent de l'arithmétique sur un seul nombre. Les schémas standard sont tous de purs décalages de teinte avec saturation et valeur maintenues constantes — le complémentaire est `teinte + 180`, le triadique `teinte`/`+120`/`+240`, l'analogue `teinte ± 30`.

### 2.1 Écris les règles de décalage de teinte et le constructeur de palettes

**👟 Indice de départ :** Trois minuscules fonctions — `complementary`, `analogous`, `triadic` — retournant chacune une liste de teintes via le repliement `% 360`, plus `build_palette`, qui cherche la teinte/saturation/valeur de la couleur de base une fois et applique toutes les trois règles dessus :

```python
# palettes.py
from color_math import hex_to_rgb, hsv_to_rgb, rgb_to_hsv, rgb_to_hex

def complementary(base_hue: float) -> list[float]:
    return [base_hue, (base_hue + 180.0) % 360.0]

def analogous(base_hue: float, spread: float = 30.0) -> list[float]:
    return [(base_hue + offset) % 360.0 for offset in (-spread, 0.0, spread)]

def triadic(base_hue: float) -> list[float]:
    return [base_hue, (base_hue + 120.0) % 360.0, (base_hue + 240.0) % 360.0]

def build_palette(base_color: str) -> dict[str, list[str]]:
    base_hue, sat, val = rgb_to_hsv(hex_to_rgb(base_color))
    palettes = {}
    for name, hues in (
        ("complementary", complementary(base_hue)),
        ("analogous", analogous(base_hue)),
        ("triadic", triadic(base_hue)),
    ):
        palettes[name] = [rgb_to_hex(hsv_to_rgb(h, sat, val)) for h in hues]
    return palettes

if __name__ == "__main__":
    palette = build_palette("#3366cc")
    for name, colors in palette.items():
        print(f"{name}: {colors}")
```

Le `% 360` sur chaque décalage est toute l'astuce de la roue chromatique : `teinte + 180` sur une couleur à 250° n'est pas 430° (qu'aucun espace colorimétrique n'accepte), cela fait le repli chez 70°. Maintenir `sat` et `val` fixes pendant que seule la teinte bouge est aussi un choix de *conception*, pas juste un raccourci — cela garantit que chaque couleur de la palette partage la même vivacité et la même clarté, ce qui fait qu'un schéma paraît cohérent plutôt qu'aléatoire.

**🎯 Résultat attendu :**

```
complementary: ['#3366cc', '#cc9933']
analogous: ['#33b3cc', '#3366cc', '#4d33cc']
triadic: ['#3366cc', '#66cc33', '#cc3366']
```

**🩹 Si ça ne marche pas :** Si chaque palette est un gris plat, `sat` ou `val` est ressorti `0` de `rgb_to_hsv` — ce qui n'arrive que pour une entrée totalement désaturée comme `#ffffff`, donc vérifie ta couleur de base. Si les teintes sont bonnes mais que l'*ordre* semble mélangé, souviens-toi que `hsv_to_rgb` attend des degrés alors que `colorsys` veut une fraction — passer une valeur brute en degrés comme `220.0` directement dans `colorsys.hsv_to_rgb` fausse chaque conversion.

### 2.2 Vérifie

**✅ Liste de vérification**

- ✅ `build_palette("#3366cc")` retourne les cinq couleurs ci-dessus, dans cet ordre.
- ✅ Chaque couleur générée ne diffère de la base que par la teinte — saturation et valeur sont identiques partout.
- ✅ Donner ta propre couleur de base (essaie `#e63946`) produit une palette valide au lieu d'un crash.

**🤔 Question(s) socratique(s)**

- La règle analogue utilise `spread=30`. Que se passe-t-il sur la palette si tu la montes à `spread=60` — et où, sur la roue chromatique, deviendrait-elle *visuellement indiscernable* d'une palette triadique ? Pourquoi ?
- `complementary` retourne la couleur de base *et* son opposée. Si un designer ne veut que les deux nouvelles couleurs, pourquoi retourner la base quand même pourrait-il encore être le meilleur choix pour une fonction de bibliothèque ?

## Étape 3 : Vérifier le contraste WCAG

Une palette peut être mathématiquement parfaite et pourtant inutilisable si la couleur du texte ne se détache pas de l'arrière-plan. Le WCAG définit le contraste comme un *rapport* calculé à partir de la luminance relative de chaque couleur — un peu de maths de gamma par canal, puis `(L_claire + 0.05) / (L_foncée + 0.05)`. Les seuils sont fixes : 4,5:1 pour le texte AA normal, 3:1 pour le texte large, 7:1 pour l'AAA.

### 3.1 Écris luminance, rapport et le juge réussite/échec

**👟 Indice de départ :** Trois fonctions — `relative_luminance` (la transformée gamma par morceaux), `contrast_ratio` (qui doit trier les deux luminances pour diviser la plus grande), et `passes_wcag` avec un dictionnaire de seuils :

```python
# contrast.py
from color_math import hex_to_rgb

def relative_luminance(rgb: tuple[int, int, int]) -> float:
    def channel(c: int) -> float:
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast_ratio(fg: str, bg: str) -> float:
    l1 = relative_luminance(hex_to_rgb(fg))
    l2 = relative_luminance(hex_to_rgb(bg))
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def passes_wcag(ratio: float, level: str = "AA") -> bool:
    thresholds = {"AA": 4.5, "AA-large": 3.0, "AAA": 7.0, "AAA-large": 3.0}
    return ratio >= thresholds[level]

if __name__ == "__main__":
    ratio = contrast_ratio("#ffffff", "#3366cc")
    print(f"white on #3366cc: {ratio:.2f}:1")
    print("passes AA normal text:", passes_wcag(ratio, "AA"))
```

La ligne à fort poids, ce sont les coefficients `0.2126/0.7152/0.0722` : l'œil humain ne pèse pas le rouge, le vert et le bleu de façon égale, et le WCAG encode cela. Le tri `max/min` dans `contrast_ratio` compte aussi — la formule est asymétrique et produirait silencieusement un nombre *faux mais d'aspect valide* si tu divisais dans l'ordre d'appel arbitraire, donc la fonction normalise par précaution.

**🎯 Résultat attendu :**

```
white on #3366cc: 5.37:1
passes AA normal text: True
```

**🩹 Si ça ne marche pas :** Si `passes_wcag` continue de retourner `True` pour des paires manifestement foncé-sur-foncé, ton `relative_luminance` fond l'étape de gamma — vérifie le `** 2.4` contre la branche (`c <= 0.04045`), un `+0.055` manquant corrompt chaque couleur foncée. Si le rapport s'affiche exactement `1.00:1`, les deux luminances sont égales — tu as probablement oublié le tri `max/min` et divisé une couleur contre elle-même en passant deux fois le même hex.

### 3.2 Vérifie

**✅ Liste de vérification**

- ✅ `contrast_ratio("#ffffff", "#3366cc")` affiche `5.37:1`.
- ✅ `contrast_ratio("#ffffff", "#ffffff")` affiche `1.00:1` (une couleur contre elle-même).
- ✅ Tu peux expliquer pourquoi `0.2196*1.0` serait faux pour une entrée blanc pur.

**🤔 Question(s) socratique(s)**

- `contrast_ratio` trie les deux luminances par précaution. Où un appelant peut-il malgré tout obtenir une réponse à ~`1.00:1` *par conception* plutôt que par bug — et ce rapport est-il toujours le signe d'une palette cassée ?
- Le texte AAA normal exige 7:1. Étant donné que blanc-sur-`#3366cc` atterrit à 5.37:1, que doit-il changer sur le *premier plan* pour atteindre l'AAA, et contre quoi cela échange-t-il esthétiquement ?

## Étape 4 : Exporter les palettes en CSS et en JSON

Une palette que personne ne peut utiliser est académique. Les deux formats qui arrivent réellement dans les produits sont les propriétés personnalisées CSS (`--brand-1: #3366cc`) et le JSON (pour les fichiers de config, les thèmes Tailwind et les scripts). L'exportation enseigne la leçon plus profonde qu'un *modèle* (un dict de familles de couleurs nommées) et ses *rendus* (texte CSS, texte JSON) sont des couches séparées — tu peux ajouter dix exporteurs de plus sans toucher au code des couleurs.

### 4.1 Écris les deux exporteurs

**👟 Indice de départ :** Deux fonctions à une idée — `to_css` construit les lignes `:root { --family-N: ... }` avec une compréhension de liste, `to_json` passe tout le dict palette à `json.dumps` avec `indent=2` :

```python
# exporter.py
import json

def to_css(palette: dict[str, list[str]]) -> str:
    lines = [":root {"]
    for name, colors in palette.items():
        for i, color in enumerate(colors):
            lines.append(f"  --{name}-{i + 1}: {color};")
    lines.append("}")
    return "\n".join(lines)

def to_json(palette: dict[str, list[str]]) -> str:
    return json.dumps(palette, indent=2)

if __name__ == "__main__":
    from palettes import build_palette
    palette = build_palette("#3366cc")
    print(to_css(palette))
    with open("palette.json", "w") as f:
        f.write(to_json(palette))
    print("Saved palette.json")
```

La distinction données-vers-texte est l'idée à retenir : `build_palette` retourne un dict simple, et chaque exporteur ne possède *que* la question « dict → texte ». `f"  --{name}-{i + 1}: {color};"` est une belle vitrine d'un f-string qui fait du vrai travail — interpolation plus un décalage façon `enumerate` en une ligne. Note que le côté JSON fait le même travail avec *zéro* formatage de chaîne, ce qui est exactement pourquoi les formats structurés existent.

**🎯 Résultat attendu :** Le terminal affiche un bloc CSS de 16 lignes commençant par `:root {`, listant trois familles de variables de couleur ; un fichier `palette.json` est écrit, que `json.load(open("palette.json"))` peut relire comme le dict d'origine.

**🩹 Si ça ne marche pas :** Si le CSS affiche `--complementary-0` (basé sur 0), ton `enumerate(colors)` n'ajoute pas de `+ 1` — les auteurs CSS s'attendent à ce que les familles démarrent à 1. Si le fichier JSON diffère du `palette.json` affiché plus tôt, vérifie que `json.dumps(..., indent=2)` est ce qui a tourné au moment de l'écriture plutôt que la valeur par défaut sur une seule ligne.

### 4.2 Vérifie

**✅ Liste de vérification**

- ✅ La sortie de `to_css(palette)` commence par `:root {` et finit par `}` et inclut `--triadic-3: #cc3366`.
- ✅ `palette.json` existe et se recharge comme un dict avec les mêmes trois clés.
- ✅ Aucune valeur de couleur dans l'un ou l'autre export n'a de majuscule ni de `#` manquant.

**🤔 Question(s) socratique(s)**

- Le dict créé à l'Étape 2 est consommé par *deux* exporteurs ici. Que cela suggère-t-il sur l'endroit où tu ajouterais un troisième format — disons une config Tailwind — et pourquoi le code des couleurs n'a-t-il pas besoin de changer pour cela ?
- Pourquoi décrit-on le JSON comme nécessitant « zéro formatage de chaîne » alors que le CSS exige un f-string ? Quelle propriété le JSON a-t-il que le CSS écrit à la main n'a pas ?

## Étape 5 : Enveloppe-le dans une CLI

La finition finale consiste à transformer une bibliothèque en un outil que quelqu'un tape réellement : `python palette.py .e63946 --bg ffffff` affiche tout le rapport. Le module `argparse` gère l'analyse d'arguments, les valeurs par défaut et un texte `--help` utile gratuitement.

### 5.1 Construis la CLI de synthèse

**👟 Indice de départ :** Une fonction `summarize` qui affiche chaque famille puis le verdict de contraste pour chaque couleur unique contre l'arrière-plan choisi, câblée dans `argparse` avec une position `base` et un `--bg` par défaut :

```python
# palette.py
import argparse

from color_math import hex_to_rgb
from contrast import contrast_ratio, passes_wcag
from palettes import build_palette

def summarize(base_color: str, background: str) -> None:
    palettes = build_palette(base_color)
    for name, colors in palettes.items():
        print(f"{name}: {' '.join(colors)}")

    print()
    print(f"Contrast vs {background}:")
    for color in sorted({c for family in palettes.values() for c in family}):
        ratio = contrast_ratio(color, background)
        verdict = "AA" if passes_wcag(ratio, "AA") else "FAIL"
        print(f"  {color}: {ratio:.2f}:1  {verdict}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Palettes + WCAG contrast from one hex color.")
    parser.add_argument("base", help="Base hex color, e.g. #3366cc")
    parser.add_argument("--bg", default="#ffffff", help="Background to check against (default: #ffffff)")
    args = parser.parse_args()
    hex_to_rgb(args.base)  # validate before doing any work
    hex_to_rgb(args.bg)
    summarize(args.base, args.bg)
```

```bash
uv run python palette.py #3366cc
```

Deux touches délibérées : une validation de style `ValidationError` explicite *avant* toute génération (tu échoues vite avec une erreur lisible au lieu d'un crash en pleine palette), et une compréhension d'ensemble collectant chaque couleur exportée une seule fois pour que le rapport de contraste ne répète pas la même couleur pour chaque famille où elle apparaît.

**🎯 Résultat attendu :** Trois lignes de palettes (`complementary:` … jusqu'à `triadic:`), une ligne vide, puis une ligne `Contrast vs #ffffff:` par couleur unique — chacune se terminant par `AA` ou `FAIL`, avec `#3366cc: 5.37:1  AA` parmi elles.

**🩹 Si ça ne marche pas :** Si taper la couleur avec son `#` fait échouer l'analyseur, tu es sur un shell qui traite `#` comme un début de commentaire — cite l'argument (`"#3366cc"`) ou retire le `#`. Si `--bg 000000` signale encore la plupart des couleurs comme `FAIL`, c'est la réponse honnête, pas un bug — foncé-sur-noir est faible contraste *par conception* ; passe un arrière-plan plus clair.

### 5.2 Vérifie

**✅ Liste de vérification**

- ✅ `uv run python palette.py #3366cc` affiche trois palettes et un rapport de contraste qui inclut une ligne `5.37:1  AA`.
- ✅ `uv run python palette.py --help` liste la position `base` et l'option `--bg`.
- ✅ Un hex invalide comme `uv run python palette.py zzz` affiche une `ValueError` claire, pas un rapport vide silencieux.

**🤔 Question(s) socratique(s)**

- La compréhension d'ensemble déduplique les couleurs avant la boucle de contraste. Que se passerait-il sur la *sortie* si tu la retirais — et pourquoi le rapport dupliqué, plutôt qu'un crash, est-il exactement la classe de bug qu'un `set` prévient en silence ?
- `argparse` te donne `--bg` avec une valeur par défaut. Quelle situation réelle exige qu'un *utilisateur qui ne fournit rien* et un *utilisateur qui fournit la valeur par défaut explicitement* se comportent différemment, et cette CLI en a-t-elle une déjà ?

## ⚠️ Pièges courants

- **Oublier que `colorsys` travaille en fractions, pas en degrés.** `rgb_to_hsv` retourne la teinte dans `[0,1)` ; multiplie par 360 en entrant, divise par 360 en sortant. Le bug classique est de multiplier dans un sens et de ne pas l'annuler dans l'autre — chaque palette s'affiche alors mélangée et *rien* ne fait l'aller-retour.
- **Diviser le contraste dans le mauvais sens.** La formule WCAG divise la couleur claire par la foncée. Saute le tri `max/min` et `#ffffff` sur `#000000` te donne le *bon* rapport par chance, alors qu'un ordre d'appel inversé retourne un nombre faux qui *paraît* quand même plausible (comme `0.19:1`).
- **Traiter le RVB comme un bon espace pour les maths de palette.** « Analogue » est de l'arithmétique sur les teintes ; en RVB c'est du tâtonnement. Si tu te retrouves à soustraire 30 de chaque canal « pour que ça corresponde », tu as quitté le TSV et rentré dans le tâtonnement.
- **Sauter la validation et planter en plein rapport.** Le fait que `hex_to_rgb` valide `len(h) != 6` en amont signifie qu'une couleur mal tapée échoue comme une erreur claire, pas comme une palette de `None` ni un `TypeError` déroutant au fond de `colorsys`.
- **Codifier en dur le format de sortie dans le constructeur de palettes.** Le moment où `build_palette` affiche lui-même du CSS, l'export JSON exige une fonction dupliquée. Garde le modèle et les exporteurs séparés — cette séparation est l'idée réutilisable.

## Ce que tu viens de construire

Un vrai outil de palettes : il prend une couleur, applique de vraies règles de théorie des couleurs pour produire trois familles harmonieuses, vérifie chaque résultat selon les directives de contraste WCAG, et exporte à la fois des variables CSS et du JSON — tout en moins d'une centaine de lignes de Python de bibliothèque standard. La compétence transférable est le *pipeline* : convertir dans un espace de travail (TSV), faire les maths là-bas, reconvertir — la même forme derrière le travail des couleurs, des systèmes de coordonnées et de la gestion des fuseaux horaires partout.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/color-palette/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/color-palette) dans le dépôt du cours contient les scripts complets ci-dessus, exécutables de bout en bout. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et exécute-les depuis là-bas.
:::

## Où aller à partir d'ici

- Ajoute un drapeau `--levels` qui vérifie chaque couleur de palette contre **tous** les niveaux WCAG (AA, AA-large, AAA) et annote le rapport — tu as déjà le dictionnaire de seuils, c'est une boucle.
- Génère des *nuances* d'une couleur de base (même teinte, valeur décroissante) pour qu'une palette soit livrée avec des états survol, bordure et désactivé — réutilise `hsv_to_rgb` avec le constructeur de l'étape 2.
- Exporte vers une **config plate compatible Tailwind** ou un tableau d'échantillons Markdown — tu découvriras à quel point un nouvel exporteur consiste à choisir des chaînes.
- Ajoute une simulation de daltonisme : convertis chaque couleur dans un espace protanopie/deutéranopie approximatif et signale les palettes où deux entrées deviennent indiscernables.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓