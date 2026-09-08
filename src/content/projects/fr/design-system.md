---
title: "Générateur de Système de Design"
description: "Génère un système de design complet à partir d'une seule couleur de marque : une palette cohérente, des vérifications de contraste WCAG, une échelle typographique, et des propriétés CSS personnalisées exportables."
difficulty: "beginner"
estimatedMinutes: 40
tags: ["design", "css", "color-theory", "data-visualization", "matplotlib"]
learningObjectives:
  - "Convertir entre les formats de couleur hex, RGB et HSL"
  - "Générer des palettes de couleurs harmonieuses à partir d'une seule couleur de base"
  - "Calculer les ratios de contraste WCAG et vérifier l'accessibilité"
  - "Construire une échelle typographique avec un ratio modulaire"
  - "Exporter les jetons de design comme propriétés CSS personnalisées"
prerequisites:
  - "Les bases des fonctions et boucles Python"
  - "Comprendre les codes de couleur hex"
  - "La familiarité avec les variables CSS (utile mais pas requise)"
---

# 🛠️ 🎨 Construire un Générateur de Système de Design

Chaque système de design commence au même endroit : quelqu'un choisit une couleur de marque puis demande, « à quoi ressemble la palette entière ? » Ce projet construit cette réponse en Python — tu dériveras une palette complète dans une seule famille de couleurs, vérifieras chaque paire que tu utiliserais vraiment contre les règles de contraste WCAG, construiras une échelle typographique et d'espacement qui reste mathématiquement cohérente, et exporteras tout comme des propriétés CSS personnalisées prêtes à être jetées dans une vraie feuille de style.

Ceci suppose Python 101 et une vague idée de ce qu'est une chaîne de couleur hex — rien de l'Analyse de Données n'est requis. C'est facultatif et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Convertir entre hex, RGB et HSL pour que chaque opération de couleur se passe dans le bon espace.
2. Dériver une palette complète et cohérente — ombres, teintes éclaircies, et gris — depuis un hex de marque unique.
3. Scorer les paires texte/fond contre les règles de contraste WCAG pour que l'accessibilité ne soit pas une devinette.
4. Construire une échelle typographique avec un ratio modulaire cohérent et une échelle d'espacement.
5. Rendre une carte d'échantillons de palette et la sauvegarder comme image partageable.
6. Exporter chaque jeton comme propriétés CSS personnalisées que tu peux coller dans n'importe quel projet web.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal recommandé — tous les calculs sont du Python pur, et les deux fichiers de sortie (`palette.png` et `design-tokens.css`) atterrissent directement dans ton répertoire de travail.

**GitHub Codespaces** fonctionne parfaitement aussi : ouvre [le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et lance depuis là-bas. Chaque étape se comporte de manière identique au local.

**Google Colab et Kaggle Notebooks** sont un ajustement naturel pour ce projet — pas de dépendances système, pas de fichiers sur le disque, tout se rend en ligne. Si tu parcours le cours sans configuration locale, c'est l'un des projets qui s'insère réellement proprement dans le modèle de notebook.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/design-system/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/design-system/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdesign-system%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin vit dans la bibliothèque standard de Python plus une bibliothèque de visualisation.

### Installer `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « install Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets » — il peut installer et gérer lui-même des versions de Python, aux côtés des dépendances de ton projet.

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

### Configurer le projet

```bash
uv init design-system
cd design-system
uv add matplotlib
```

`colorsys` vient avec Python et gère les calculs d'espace colorimétrique de l'Étape 1 ; `matplotlib` dessine la carte d'échantillons de palette de l'Étape 5. Tu n'as besoin que du seul paquet PyPI.

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `design-system/` existe avec un `pyproject.toml`, et `matplotlib` est installé.

## Étape 1 : Convertir entre les formats de couleur

Tu ne peux pas mélanger la luminosité et le RGB : le HSL est l'endroit où les humains ajustent la luminosité, le RGB est l'endroit où les écrans livrent la couleur, et le hex est comment tu les nommes en CSS. Avant tout travail de palette, construis les quatre traducteurs sur lesquels tu t'appuieras pour le reste du projet.

### 1.1 Écris les quatre fonctions de conversion

**👟 Indice de départ :** Travaille autour de `colorsys.rgb_to_hls` de Python (pas HSV) : son ordre de retour est `(hue, lightness, saturation)`, ce qui échange saturation et luminosité par rapport à toutes les autres API que tu rencontreras.

```python
# design_system.py
import colorsys

def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert a hex color string to an RGB tuple (0–255 per channel)."""
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert RGB values (0–255) to a lowercase hex string."""
    return f"#{r:02x}{g:02x}{b:02x}"

def hex_to_hsl(hex_color: str) -> tuple[float, float, float]:
    """Convert hex to HSL (h: 0–360, s: 0–100, l: 0–100)."""
    r, g, b = hex_to_rgb(hex_color)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return h * 360, s * 100, l * 100

def hsl_to_hex(h: float, s: float, l: float) -> str:
    """Convert HSL (h: 0–360, s: 0–100, l: 0–100) to hex."""
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return rgb_to_hex(int(r * 255), int(g * 255), int(b * 255))

# Round-trip test
brand = "#3b82f6"
r, g, b = hex_to_rgb(brand)
h, s, l = hex_to_hsl(brand)
print(f"  {brand} -> RGB({r}, {g}, {b}) -> HSL({h:.0f}\u00b0, {s:.0f}%, {l:.0f}%)")
print(f"  Back to hex: {hsl_to_hex(h, s, l)}")
```

`colorsys` utilise des flottants 0-1 pour chaque canal, et le nom `rgb_to_hls` révèle le secret : les deuxième et troisième sorties sont luminosité puis saturation, pas dans l'autre sens. Te tromper tôt là-dessus signifie que chaque ombre que tu génères plus tard a la mauvaise teinte ou la mauvaise ambiance — c'est le bug fondateur à tuer en premier. `hsl_to_hex` inverse le même chemin ; les deux conversions sont sans perte pour des valeurs RGB à nombre entier.

**🎯 Résultat attendu :** Affiche `#3b82f6 -> RGB(59, 130, 246) -> HSL(217°, 91%, 60%)` et `Back to hex: #3b82f6` (l'aller-retour correspond).

**🩹 Si ça ne marche pas :** Si le hex d'aller-retour ne correspond pas à l'entrée, tu passes saturation et luminosité à `hsl_to_hex` dans le mauvais ordre — échange les arguments `s` et `l` à l'intérieur de cette fonction. Si la teinte de sortie est clairement fausse pour une couleur connue (tu t'attends à du violet, tu obtiens du rouge), tu as probablement appelé `colorsys.rgb_to_hsv` au lieu de `rgb_to_hls` — les fonctions ont des formes de sortie différentes.

### 1.2 Vérifie les conversions

**✅ Liste de vérification**

- ✅ Faire l'aller-retour d'une couleur connue (`#3b82f6`) via `hex -> rgb -> hex` et `hex -> hsl -> hex` retourne exactement la chaîne originale.
- ✅ Tu peux expliquer pourquoi le HSL est le bon espace pour le travail de palette de l'Étape 2, tandis que le hex est le bon format pour le CSS.

**🤔 Question(s) socratique(s)**

- Pourquoi les appels `rgb_to_hex` et `hsl_to_hex` utilisent-ils tous deux `int(...)` sur les valeurs finales — qu'est-ce qui irait mal si tu passais un flottant directement ?
- Si tu éclaircissais une couleur en ajoutant 10 à chaque canal RGB au lieu d'ajuster la luminosité en HSL, la teinte changerait-elle ? Comment le HSL prévient-il cette classe de problème ?

## Étape 2 : Générer une palette de couleurs

Une palette est une famille de tons et d'ombres qui ont l'air d'appartenir ensemble. L'astuce est simple : fixe la teinte et la saturation (c'est l'*identité* de la couleur), puis parcours seulement l'axe de luminosité. Chaque échantillon résultant partage l'ADN avec la couleur de marque originale — le spectateur voit une famille, pas quatre couleurs sans rapport.

### 2.1 Construis le générateur de palette

**👟 Indice de départ :** Déplace la luminosité en HSL par des décalages fixes vers le haut et le bas depuis la base, en utilisant `min`/`max` pour garder les valeurs entre 0 et 100.

```python
# design_system.py (continued)
def generate_palette(base_hex: str) -> dict:
    """Generate a full palette from a single brand color."""
    h, s, l = hex_to_hsl(base_hex)

    palette = {
        "brand": base_hex,
        "lightest": hsl_to_hex(h, s, min(l + 35, 95)),
        "lighter":  hsl_to_hex(h, s, min(l + 20, 90)),
        "light":    hsl_to_hex(h, s, min(l + 10, 85)),
        "dark":     hsl_to_hex(h, s, max(l - 10, 10)),
        "darker":   hsl_to_hex(h, s, max(l - 20, 5)),
        "darkest":  hsl_to_hex(h, s, max(l - 35, 0)),
    }

    # Grays: desaturated tint of the brand hue, not pure neutral
    for name, lightness in [("gray-100", 96), ("gray-200", 90), ("gray-300", 80),
                            ("gray-400", 60), ("gray-500", 45), ("gray-600", 30),
                            ("gray-700", 20), ("gray-800", 12), ("gray-900", 6)]:
        palette[name] = hsl_to_hex(h, 5, lightness)

    return palette

palette = generate_palette("#3b82f6")
print("Brand palette:")
for name, color in palette.items():
    if not name.startswith("gray"):
        print(f"  {name:>10}: {color}")
```

Le plafond `min(l + 35, 95)` prévient les teintes éclaircies lavées à 100 % de luminosité — une palette qui garde un soupçon de teinte de marque dans son ombre la plus claire est toujours plus cohérente que du blanc pur. Les gris utilisent une saturation constante de 5 % à la teinte de la marque plutôt que 0 %, ce qui leur donne une teinte chaude au lieu d'un gris clinique ; c'est un petit choix de design qui rend silencieusement une palette chère à l'œil.

**🎯 Résultat attendu :** Affiche `brand: #3b82f6`, puis des ombres plus claires/plus sombres dans la même famille de teinte, avec le hex de marque suivi des six variantes à luminosité décalée.

**🩹 Si ça ne marche pas :** Si la variante la plus claire n'est pas reconnaissablement la même couleur, la saturation est trop basse ou le décalage de luminosité a dépassé 95 — tu es entré en territoire quasi-blanc où la teinte est invisible. Si deux ombres adjacentes (ex. `light` et `lighter`) se ressemblent presque, tes décalages sont trop proches — écarte-les.

### 2.2 Vérifie la palette

**✅ Liste de vérification**

- ✅ Chaque couleur de la palette partage le même angle de teinte (217° pour `#3b82f6`), confirmé en appelant `hex_to_hsl` sur chacune.
- ✅ L'échantillon le plus clair est clairement distinct du blanc pur, et le plus sombre n'est pas complètement noir.

**🤔 Question(s) socratique(s)**

- Pourquoi ne pas générer une palette en ajoutant 15 au canal rouge du RGB de la couleur de base au lieu de parcourir la luminosité HSL ? Qu'arrive-t-il à la couleur perçue quand tu changes R, G et B également ?
- Si un responsable de marque te donnait deux couleurs hex et te demandait de construire une palette avec *les deux* comme ancres, que fixerais-tu ou jetterais-tu dans `generate_palette` pour que cela fonctionne ?

## Étape 3 : Vérifier les ratios de contraste WCAG

L'accessibilité ne concerne pas le goût — elle concerne un ratio. WCAG 2.1 dit que le texte normal a besoin d'un ratio de contraste de 4.5:1 contre son fond (AA) et de 3:1 pour le texte large ; AAA augmente cela à 7:1. Ces seuils sont concrets, et tout outil qui génère des palettes *doit* les tester — sinon tu devines si la moitié de tes utilisateurs peuvent réellement lire les mots.

### 3.1 Écris les fonctions de vérification de contraste

**👟 Indice de départ :** La luminance relative WCAG n'est *pas* une simple moyenne — elle applique une linéarisation sRGB par morceaux plus généreuse envers les valeurs de canal sombres. Implémente les deux formules exactement comme la spec les énonce.

```python
# design_system.py (continued)
def relative_luminance(hex_color: str) -> float:
    """Calculate relative luminance per WCAG 2.1 (sRGB linearization)."""
    r, g, b = hex_to_rgb(hex_color)
    channels = []
    for val in (r, g, b):
        srgb = val / 255
        linear = srgb / 12.92 if srgb <= 0.03928 else ((srgb + 0.055) / 1.055) ** 2.4
        channels.append(linear)
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]

def contrast_ratio(color1: str, color2: str) -> float:
    """Calculate WCAG contrast ratio between two hex colors."""
    l1, l2 = relative_luminance(color1), relative_luminance(color2)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def check_accessibility(foreground: str, background: str) -> str:
    """Check if a color pair meets WCAG AA and AAA standards."""
    ratio = contrast_ratio(foreground, background)
    aa_normal = ratio >= 4.5
    aa_large  = ratio >= 3.0
    aaa       = ratio >= 7.0
    status = "AAA" if aaa else ("AA" if aa_normal else "Fail")
    size = "normal text" if aa_normal else ("large text" if aa_large else "insufficient")
    return f"  {foreground} on {background}: {ratio:.1f}:1 -> {status} ({size})"

# Test the most common palette combos
print(check_accessibility("#1e293b", "#ffffff"))
print(check_accessibility("#3b82f6", "#ffffff"))
print(check_accessibility("#64748b", "#ffffff"))
print(check_accessibility("#ffffff", "#1e293b"))
```

La formule de linéarisation — `srgb / 12.92` pour les valeurs sous 0.03928, `((srgb + 0.055) / 1.055) ** 2.4` sinon — semble arbitraire mais correspond à la courbe que ton moniteur dessine réellement. La moyenne pondérée `0.2126·R + 0.7152·G + 0.0722·B` reflète que le vert porte la plus grande luminance dans la vision humaine. Bien faire le ratio signifie pas de devinette sur le fait que `#3b82f6` sur blanc passe réellement AA (il le fait, tout juste à ~4.5:1) — tu l'as prouvé numériquement.

**🎯 Résultat attendu :** Quatre lignes : `#1e293b` sur blanc est **AAA** (texte normal) ; `#3b82f6` sur blanc est **AA** (texte normal — juste au seuil) ; `#64748b` sur blanc **échoue** le texte normal mais passe le texte large ; et `#ffffff` sur `#1e293b` reflète la première ligne.

**🩹 Si ça ne marche pas :** Si chaque ratio affiche 1.0:1, les deux couleurs sont identiques — tu as passé deux fois le même hex, ou `relative_luminance` retourne la même valeur pour les deux (re-vérifie la coupure de branche de la linéarisation). Si une paire qui *devrait* passer AA échoue, ta formule de luminance utilise probablement les canaux RGB dans le mauvais ordre (vérifie les poids `0.2126`/`0.7152`/`0.0722` — ils correspondent à R, G, B, pas à n'importe quel autre ordre).

### 3.2 Vérifie la vérification de contraste

**✅ Liste de vérification**

- ✅ Tu peux nommer un appariement de palette qui passe AAA et un qui échoue AA — et vérifier que les deux nombres correspondent à la spec.
- ✅ Tu peux expliquer pourquoi les deux cas « juste à 4.5 » autour de `#3b82f6` rendent les choix de luminosité du générateur de palette conséquents, pas décoratifs.

**🤔 Question(s) socratique(s)**

- Un designer choisit du texte `gray-400` sur un fond `gray-100`. Le ratio est ~5.2:1 — il passe AA. Devrait-il l'utiliser ? Qu'arrive-t-il à ce ratio sur un ordinateur portable bon marché avec un mauvais gamma, et qu'est-ce que cela suggère sur la construction de marges de sécurité dans la palette ?
- WCAG 2.2 a ajouté un niveau de contraste « renforcé ». Comment le code changerait-il, et quelle contrainte ajouterais-tu à `check_accessibility` pour produire trois niveaux au lieu de deux ?

## Étape 4 : Construire une échelle typographique et une échelle d'espacement

Une taille de police n'existe pas en isolation — c'est une *relation* à la taille de base. Une échelle modulaire rend cette relation mécanique : chaque pas multiplie par le même ratio, donc le rythme à travers une page reste visuellement cohérent. Associe cela à une échelle d'espacement arithmétique propre, et tous les jetons de mise en page du système de design viennent de deux nombres.

### 4.1 Génère les échelles

**👟 Indice de départ :** Utilise une taille de base de 16 px (un `rem` CSS par défaut) et un ratio de 1.25 (la « Tercia Majeure »), produisant exactement 8 étiquettes — `xs` à `3xl`.

```python
# design_system.py (continued)
def typography_scale(base: float = 16, ratio: float = 1.25, steps: int = 8) -> dict:
    """Generate a typographic scale from a base size and a modular ratio."""
    labels = ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl"]
    scale = {}
    for i, label in enumerate(labels[:steps]):
        size = base * (ratio ** (i - 2))
        scale[label] = {
            "size_px": round(size, 1),
            "size_rem": round(size / 16, 3),
            "line_height": round(1.2 + 0.1 * (steps - i) / steps, 2),
        }
    return scale

def spacing_scale(base: float = 4, steps: int = 10) -> dict:
    """Generate a linear spacing scale in pixels."""
    return {f"{i + 1}": base * (i + 1) for i in range(steps)}

typo = typography_scale()
spacing = spacing_scale()
for label, props in typo.items():
    print(f"  {label:>4}: {props['size_px']:>5.1f}px = {props['size_rem']}rem  (line-height {props['line_height']})")
print("  spacing:", spacing)
```

Le décalage `(i - 2)` signifie que `base` (indice 2) mappe exactement à 16 px, avec `xs` et `sm` plus petits et `lg`–`3xl` plus grands — la base se trouve juste au milieu, là où vit la plupart des copies de corps. `spacing_scale` est délibérément linéaire (1×, 2×, …, 10× la base) plutôt que géométrique car les marges et les rembourrages croissent additivement en mise en page, pas multiplicativement — c'est la différence entre « l'échelle croît comme les designers pensent » et « l'échelle croît comme les maths se sentent ».

**🎯 Résultat attendu :** Affiche `xs: 10.2px = 0.64rem` (le plus petit), `base: 16.0px = 1.0rem`, jusqu'à `3xl: 39.1px = 2.44rem` ; l'espacement affiche `{1: 4, 2: 8, …, 10: 40}`.

**🩹 Si ça ne marche pas :** Si `xs` et `sm` sortent inversés, ton décalage est `(i + 2)` au lieu de `(i - 2)`. Si les hauteurs de ligne sont toutes identiques, l'expression a été simplifiée en une constante — assure-toi que le terme `(steps - i)` varie.

### 4.2 Vérifie l'échelle

**✅ Liste de vérification**

- ✅ `base` dans l'échelle typographique est exactement 16 px et 1.0 rem.
- ✅ Chaque pas dans l'échelle typographique est exactement 1.25× le pas précédent (dans les arrondis).

**🤔 Question(s) socratique(s)**

- Qu'arrive-t-il si tu changes le ratio de 1.25 à 1.333 (« Parfaite Quarte ») — quels titres croissent le plus, et quand choisirais-tu l'un plutôt que l'autre ?
- Pourquoi ne pas simplement utiliser `spacing_scale` aussi pour les tailles de police ? Quelle propriété d'une échelle linéaire (12, 16, 20, 24…) la fait se dégrader pour les titres ?

## Étape 5 : Rendre une carte d'échantillons de palette

Un fichier de palette de chaînes hex est utile à un ordinateur, pas à une personne. Une carte d'échantillons est la même palette sous forme d'image — visuelle, immédiatement lisible, et partageable. Elle te donne aussi une chance de confirmer, en *regardant*, que la palette ressemble réellement à ce que les nombres promettaient.

### 5.1 Construis le moteur de rendu d'échantillons

**👟 Indice de départ :** Utilise `matplotlib.patches.Rectangle` pour dessiner un bloc rempli par couleur de palette, puis ajoute une étiquette de texte. Garde l'axe désactivé et la mise en page serrée.

```python
# design_system.py (continued)
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

def render_palette(palette: dict, filepath: str = "palette.png") -> None:
    """Render a vertical swatch card showing every color in the palette."""
    colors = list(palette.items())
    fig, ax = plt.subplots(figsize=(8, 0.55 * len(colors)))
    for i, (name, hex_color) in enumerate(colors):
        ax.add_patch(mpatches.Rectangle((0, i), 1, 1, color=hex_color, edgecolor="white", linewidth=2))
        ax.text(0.52, i + 0.3, f"{name}: {hex_color}", fontsize=8, color="#1e293b", fontfamily="monospace")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, len(colors))
    ax.axis("off")
    plt.tight_layout()
    plt.savefig(filepath, dpi=150)
    print(f"Saved {filepath}")
    plt.show()

render_palette(palette)
```

Chaque `Rectangle` occupe la pleine largeur (`0` à `1`) et une unité de hauteur (`i` à `i+1`), avec des bords blancs créant une gouttière visuelle entre les échantillons. La couleur de texte `#1e293b` (un charbon sombre, presque noir) est codée en dur pour rester lisible sur les échantillons clairs — pour un outil de production, tu basculerais conditionnellement vers un texte blanc sur les couleurs sombres. `plt.show()` affiche en ligne dans un notebook et ouvre une fenêtre en local ; `plt.savefig` écrit le PNG dans tous les cas.

**🎯 Résultat attendu :** Un PNG `palette.png` avec 15 échantillons verticaux (7 ombres de marque + 9 ombres de gris), chacun étiqueté en monospace, et soit une fenêtre matplotlib soit un affichage en ligne.

**🩹 Si ça ne marche pas :** Si les étiquettes dépassent du bord droit, la figure est trop étroite — augmente la largeur de `figsize`. Si les étiquettes sont illisibles sur les échantillons sombres, le texte `color="#1e293b"` doit basculer en blanc ; c'est une simplification connue et correcte pour la portée actuelle du générateur. Si la figure ne montre que 3 échantillons, le dict de palette a été tronqué dans l'affichage — assure-toi que les 15 clés existent avant d'appeler.

### 5.2 Vérifie la carte d'échantillons

**✅ Liste de vérification**

- ✅ `palette.png` contient exactement 15 rangées étiquetées et peut être ouvert dans n'importe quel visualiseur d'images.
- ✅ Tu peux confirmer visuellement que les échantillons `gray-*` partagent une teinte cohérente avec la couleur de marque, pas un gris neutre pur.

**🤔 Question(s) socratique(s)**

- Si un coéquipier dit « l'échantillon a l'air lavé », où dans le pipeline changerais-tu la saturation — et la changerais-tu globalement (Étape 2) ou seulement pour la sous-famille des gris ?
- Comment ajouterais-tu une étiquette hex qui sélectionne automatiquement le texte blanc ou sombre selon la luminance, et quelle fonction de l'Étape 3 fait déjà le calcul dont tu aurais besoin ?

## Étape 6 : Exporter les jetons de design en CSS

Le vrai test d'un système de design est de savoir si quelqu'un peut l'utiliser sans comprendre comment il a été construit. Les propriétés CSS personnalisées sont le livrable le plus portable : colle le fichier dans une balise `<link>` ou `@import` et chaque composant du projet peut référencer `--color-brand`, `--font-size-lg`, ou `--space-4` sans aucune connaissance du HSL ou des échelles modulaires.

### 6.1 Construis la fonction d'export

**👟 Indice de départ :** Parcours chaque dictionnaire (`palette`, `typo`, `spacing`), formate chaque valeur comme une ligne `--variable: value;`, et écris le résultat joint dans un fichier `.css`.

```python
# design_system.py (continued)
def export_css(palette: dict, typography: dict, spacing: dict, filepath: str = "design-tokens.css") -> str:
    """Export design tokens as a CSS custom properties file."""
    lines = [":root {", "  /* Brand Colors */"]
    for name, color in palette.items():
        lines.append(f"  --color-{name}: {color};")

    lines += ["", "  /* Typography */"]
    for label, props in typography.items():
        lines.append(f"  --font-size-{label}: {props['size_rem']}rem;")
        lines.append(f"  --line-height-{label}: {props['line_height']};")

    lines += ["", "  /* Spacing */"]
    for step, value in spacing.items():
        lines.append(f"  --space-{step}: {value}px;")

    lines += ["}"]
    css = "\n".join(lines)
    with open(filepath, "w") as f:
        f.write(css)
    print(f"Design tokens exported to {filepath}")
    return css

css_output = export_css(palette, typo, spacing)
print("\n" + css_output)
```

Chaque section commente sa catégorie (`/* Brand Colors */`, `/* Typography */`, `/* Spacing */`) car le fichier sera éventuellement collé dans une base de code où quelqu'un d'autre que toi le lit. `rem` plutôt que `px` pour les tailles de police est délibéré — il hérite des réglages de zoom du navigateur et est le standard pour un CSS accessible et responsive. Afficher le contenu du fichier sur stdout à la fin te donne une confirmation visuelle instantanée que la structure est correcte, même avant d'ouvrir le fichier CSS dans un éditeur.

**🎯 Résultat attendu :** `design-tokens.css` est écrit, et son contenu s'affiche sur stdout : `:root {` avec 15 propriétés personnalisées `--color-*`, 16 paires `--font-size-*` / `--line-height-*`, et 10 valeurs `--space-*` — 42 jetons au total.

**🩹 Si ça ne marche pas :** Si le fichier CSS est vide ou manque `:root`, vérifie que `lines` est joint et écrit — un `return` précoce avant `open()` est le coupable habituel. Si une ligne ressemble à `--color-brand: #3b82f6` sans point-virgule, il manque `;` au f-string — le jeton est syntaxiquement cassé et dévorera silencieusement chaque propriété qui le suit dans le même bloc de règle.

### 6.2 Vérifie l'export

**✅ Liste de vérification**

- ✅ `design-tokens.css` existe, commence par `:root {`, et contient 42 propriétés personnalisées dans les bonnes trois sections.
- ✅ Coller une ligne — `h1 { color: var(--color-brand); font-size: var(--font-size-xl); }` — dans n'importe quel fichier HTML se résout vers les bonnes valeurs.

**🤔 Question(s) socratique(s)**

- Le fichier exporté utilise `px` pour l'espacement et `rem` pour les tailles de police. Pourquoi mélanger les unités est correct ici, et qu'arriverait-il si tu utilisais `px` aussi pour `font-size` — spécifiquement, qu'arrive-t-il quand le réglage de zoom d'un navigateur augmente ?
- Si tu voulais le même système de design disponible en modes clair et sombre, où insérerais-tu dans ce pipeline un deuxième export de palette, et comment structurerais-tu le CSS pour basculer automatiquement ?

## ⚠️ Pièges courants

- **Confondre `colorsys.rgb_to_hls` avec `rgb_to_hsv`.** Les deux fonctions ont des formes de retour différentes et échangent l'endroit où la saturation apparaît. Si ta palette générée a des teintes complètement fausses, affiche la sortie brute de `hex_to_hsl` avant que quoi que ce soit en aval la touche — le bug est toujours là.
- **Le verrouillage de luminosité rend les ombres adjacentes indistinguables.** `min(l + 35, 95)` met un plafond sur l'ombre la plus claire, mais si la luminosité de la couleur de base est déjà haute (disons, une marque pastel à 80), toute la moitié supérieure de la palette s'effondre vers le quasi-blanc. Une correction pratique : réduis les tailles de pas ou élargis l'intervalle dynamiquement selon la luminosité de la base.
- **Les poids de luminance relative appliqués dans le mauvais ordre de canaux.** WCAG spécifie `0.2126·R + 0.7152·G + 0.0722·B` — pas n'importe quelle autre permutation. Le faire à l'envers produit des ratios subtilement faux qui peuvent retourner un AA passer en un AA échouer.
- **La confusion rem vs px dans l'échelle typographique.** `size_rem` est toujours `size_px / 16` — si tu sors accidentellement la valeur en pixels avec une étiquette `rem`, chaque taille sera exactement 16× trop grande et toute la page explosera.
- **Générer une palette sans considérer la luminosité existante de la couleur de base.** Une couleur de base sombre décalée vers le sombre de 35 points de luminosité est déjà noire — l'extrémité sombre de la palette devient illisible. Teste le générateur contre un hex de marque sombre et un clair avant de l'expédier.

## Ce que tu viens de construire

Un générateur de système de design autonome : tu as choisi une couleur de marque, et le script a produit une famille complète d'ombres et de gris, vérifié chaque paire texte/fond contre les règles d'accessibilité WCAG, généré une échelle typographique et d'espacement avec un ratio mathématiquement cohérent, rendu une carte d'échantillons de palette partageable en PNG, et exporté 42 propriétés CSS personnalisées prêtes à être jetées dans n'importe quel projet web. Rien dans la sortie ne requiert l'œil d'un designer pour être utilisé — n'importe quel développeur frontend peut importer le fichier CSS et référencer `--color-brand` sans jamais ouvrir la source Python.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/design-system/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/design-system) dans le dépôt du cours est une version notebook exécutable de chaque étape ci-dessus : colle une couleur de marque, exécute toutes les cellules, et obtiens l'image de palette et le fichier CSS dans une seule exécution de notebook. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là-bas.
:::

## Où aller à partir d'ici

- Ajoute une **variante mode sombre** : inverse les valeurs de luminosité (échange `l` avec `100 - l`) tout en gardant teinte et saturation fixes, puis exporte un deuxième fichier CSS sous une requête média `@media (prefers-color-scheme: dark)` pour que le système bascule automatiquement.
- Construis une **page HTML de prévisualisation de palette** : génère un guide de style vivant qui montre chaque couleur, chaque taille de police, et chaque valeur d'espacement en usage réel — des titres dans l'échelle, des démos de rembourrage à chaque niveau d'espacement — et sers-le localement pendant que tu règles le système de design.
- Ajoute des **jetons de composants** (rembourrage de bouton, rayon de bordure, hauteur d'entrée) comme nouvelle section `/* Components */` dans l'export CSS, rendant le système de design directement consommable par une bibliothèque de composants comme React ou Vue.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python qui fait penser le CSS tout seul. 🎓