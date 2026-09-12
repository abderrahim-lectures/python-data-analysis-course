---
title: "Éditeur d'Images"
description: "Traitez des images avec filtres, redimensionnement, filigranes, conversion de format et opérations par lots."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["pillow", "image-processing", "filters", "batch-processing"]
learningObjectives:
  - "Charger, inspecter et enregistrer des images dans plusieurs formats avec Pillow"
  - "Appliquer des filtres et des améliorations via une table de dispatch"
  - "Redimensionner et recadrer en préservant les ratios d'aspect"
  - "Ajouter des filigranes texte et image avec transparence"
  - "Traiter par lots des répertoires entiers d'images"
prerequisites:
  - "Les bases de Python (fonctions, boucles, dictionnaires)"
  - "La lecture/écriture de fichiers et le travail avec les dossiers"
---

# 🛠️ 🖼️ Construire une Boîte à Outils d'Édition d'Images

Chaque appareil se remplit de photos qui méritent toutes le même traitement, un redimensionnement ici, un filigrane là, un coup de luminosité partout. Ce projet construit une boîte à outils de traitement d'images avec Pillow qui sait charger et inspecter des images, appliquer des filtres et des améliorations de couleurs, recadrer et redimensionner sans déformer, ajouter des filigranes transparents et traiter un dossier entier d'images en une seule passe.

Cela suppose Python 101 et une aisance de base avec les fichiers et les dossiers, rien de Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Charger de vraies images et inspecter leur format, leurs dimensions et leur mode de couleur.
2. Appliquer des effets de flou, de netteté, de contour, de luminosité et de saturation via une seule table de dispatch.
3. Redimensionner et recadrer sans étirer, en préservant le ratio d'aspect.
4. Ajouter un filigrane texte semi-transparent et une surimpression de logo image.
5. Traiter par lots tout ton dossier d'images avec une seule boucle.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal. Pillow est une bibliothèque native, ses chemins `resize`, `filter` et de décodage se lient à des codecs d'images compilés, et elle s'installe proprement avec `uv add`, te donnant la boîte à outils complète plus le vrai système de fichiers que veut le traitement par lots.

**Les notebooks Google Colab et Binder** fonctionnent bien aussi : le notebook reproduit chaque étape, Pillow s'installe avec un simple `!pip install Pillow`, et tu peux téléverser une photo ou utiliser les mêmes images de test déterministes que la configuration génère. **JupyterLite** est le seul chemin à éviter : il exécute Python dans le navigateur sans couche de paquets native, donc Pillow ne peut pas s'y installer, utilise les badges de notebook ci-dessous ou le chemin local à la place.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-editor/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-editor/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fimage-editor%2Fnotebook.fr.ipynb)

## Configuration

Crée le projet et installe Pillow, puis génère trois images de test déterministes pour que chaque étape de ce projet ait de la matière sur laquelle travailler, aucun accès internet ni photos personnelles requis.

```bash
uv init image-editor
cd image-editor
uv add Pillow
```

**👟 Indice de départ :** Écris la configuration comme un petit script ré-exécutable : il crée un dossier et dessine quelques formes colorées par image, pour que tu aies toujours une entrée fraîche et connue.

```python
# make_sample_images.py
from pathlib import Path
from PIL import Image, ImageDraw
import random

def make_sample_images(output: str = "input_photos", count: int = 3, size: int = 480) -> None:
    """Generate `count` deterministic RGB test images for the editor to chew on."""
    out = Path(output)
    out.mkdir(parents=True, exist_ok=True)
    for i in range(1, count + 1):
        rng = random.Random(i)
        img = Image.new("RGB", (size, size), (rng.randint(20, 60), rng.randint(20, 60), rng.randint(20, 60)))
        draw = ImageDraw.Draw(img)
        for _ in range(rng.randint(6, 12)):
            x0, y0 = rng.randint(0, size), rng.randint(0, size)
            x1, y1 = rng.randint(x0, size), rng.randint(y0, size)
            color = (rng.randint(80, 255), rng.randint(80, 255), rng.randint(80, 255))
            if rng.random() < 0.5:
                draw.rectangle((x0, y0, x1, y1), fill=color)
            else:
                draw.ellipse((x0, y0, x1, y1), fill=color)
        img.save(out / f"photo{i}.jpg", quality=92)
    print(f"Generated {count} test images in {output}/")

make_sample_images()
```

L'astuce clé est `random.Random(i)`, un générateur *initialisé par image* au lieu du générateur global. Parce que chaque appel ré-initialise avec le même `i`, exécuter ce script deux fois produit des dossiers byte-identiques, ce qui veut dire que tes sorties attendues et tes vérifications d'échecs restent reproductibles au lieu de changer de formes à chaque exécution. `Image.new("RGB", (size, size), color)` démarre chaque image comme un fond plat, et les proxys `ImageDraw` (`draw.rectangle`, `draw.ellipse`) peignent les formes, ton premier aperçu de la boucle « ouvre une image, obtiens une surface de dessin, enregistre » de Pillow.

**🎯 Résultat attendu :** Un nouveau dossier `input_photos/` contenant `photo1.jpg`, `photo2.jpg` et `photo3.jpg`, chacun en 480×480, et ré-exécuter le script affiche le même message sans changer aucun pixel.

**🩹 Si ça ne marche pas :** Si le dossier est vide, la ligne `mkdir(parents=True, exist_ok=True)` est manquante, ou le chemin `save` ne joint pas `output` et le nom de fichier. Si les images changent à chaque exécution, le générateur n'est pas initialisé par fichier, remets `random.Random(i)` dans la boucle.

**✅ Liste de vérification**

- ✅ `uv run python --version` fonctionne et `uv add Pillow` s'est installé proprement.
- ✅ `input_photos/` contient `photo1.jpg`, `photo2.jpg` et `photo3.jpg` (480×480 chacun).
- ✅ Les images se distinguent les unes des autres et sont stables d'une exécution à l'autre.

## Étape 1 : Charge et inspecte une image

Avant de modifier une photo, tu dois savoir ce que tu tiens : le format, les dimensions et le mode de couleur. Pillow ouvre une image paresseusement, il lit l'en-tête mais ne décodera les pixels que si on l'y force, donc cette étape construit un chargeur qui attrape les problèmes *tôt* et inspecte ce qu'il a chargé.

### 1.1 Écris un chargeur sûr

**👟 Indice de départ :** `Image.open` peut réussir sur un fichier qui ne peut ensuite pas être décodé, donc force le décodage avec `img.load()` dans le même bloc protégé et lève une erreur sur tout ce qui est inhabituel.

```python
# editor.py
from PIL import Image, ImageFilter, ImageEnhance

def load_image(path: str) -> Image.Image:
    """Load an image and handle common errors."""
    try:
        img = Image.open(path)
        img.load()  # force a real decode, so corrupt files fail here, not later
        return img
    except FileNotFoundError:
        print(f"Error: File '{path}' not found.")
        raise
    except Exception as e:
        print(f"Error loading image: {e}")
        raise

img = load_image("input_photos/photo1.jpg")
print(f"Format: {img.format}")
print(f"Size:   {img.width}x{img.height} pixels")
print(f"Mode:   {img.mode}")  # RGB, RGBA, L, etc.
```

L'appel `img.load()` après `Image.open` est le cœur philosophique de ce morceau. `Image.open` lit seulement l'en-tête du fichier ; les données de pixels sont décodées paresseusement à la première utilisation, ce qui veut dire qu'un fichier tronqué peut échouer profondément dans un appel `save()` ultérieur avec une erreur confuse. Appeler `.load()` dans le `try` force le décodage à se produire *maintenant*, là où le bloc `except` peut le rapporter clairement. Le `except FileNotFoundError` séparé te donne un message spécifique et honnête signalant qu'un nom de fichier manquant est le problème.

**🎯 Résultat attendu :** `Format: JPEG`, `Size:   480x480 pixels`, `Mode:   RGB`, et charger un chemin inexistant affiche `Error: File '...' not found.` avant la traceback.

**🩹 Si ça ne marche pas :** Si tu obtiens seulement `Format: None`, tu as ouvert l'image mais n'as jamais accédé aux données de pixels, ou tu as enregistré une nouvelle image sans format explicite, charger un JPEG/PNG depuis le disque rapporte toujours un format. Si un fichier réellement corrompu plante plus tard dans un `save()`, `img.load()` n'est pas dans le `try`. Si le mode affiche `RGBA` ou `L`, c'est correct pour ton entrée, pas un bug, note juste que le mode affiché diffère selon le type de fichier.

### 1.2 Fais le tour du dossier entier

**👟 Indice de départ :** Boucle le chargeur sûr sur chaque JPEG du dossier et affiche une ligne d'inspection chacun, pour confirmer que tout le portfolio est chargeable avant de modifier quoi que ce soit.

```python
# editor.py (continued)
from pathlib import Path

for path in sorted(Path("input_photos").glob("*.jpg")):
    info = load_image(str(path))
    print(f"{path.name:12} {info.width}x{info.height} {info.mode}")
```

`Path("input_photos").glob("*.jpg")` retourne un itérable de chemins de fichiers ; en enveloppant chacun dans `str()` et en le passant à `load_image`, tu gardes un point d'entrée unique et bien testé pour ouvrir les fichiers. Boucler ici attrape aussi tôt un mode d'échec à l'échelle du dossier : si une image est corrompue, tu la trouves dans un rapport de trois lignes plutôt qu'à mi-chemin d'un lot de trois cents fichiers.

**🎯 Résultat attendu :** Trois lignes, `photo1.jpg    480x480 RGB`, `photo2.jpg    480x480 RGB`, `photo3.jpg    480x480 RGB`.

**🩹 Si ça ne marche pas :** Si aucun fichier ne correspond, tu globbes sur le mauvais répertoire ou le filtre est `*.png` alors que la configuration a écrit des `.jpg`. Si une ligne lève une erreur, ce fichier unique est corrompu ou illisible, une fausse extension `.jpg` sur un fichier texte reproduit cela très bien.

### 1.3 Vérifie le chargement et l'inspection

**✅ Liste de vérification**

- ✅ `load_image("input_photos/photo1.jpg")` retourne une image et affiche son vrai format, sa taille et son mode.
- ✅ Un chemin manquant atteint la branche `FileNotFoundError` avec le message clair.
- ✅ La boucle de dossier affiche les trois images sans traceback.

**🤔 Question(s) socratique(s)**

- `img.load()` existe parce que `Image.open` est paresseux. Quelle panne spécifique, et à quel moment du programme, devient beaucoup plus difficile à diagnostiquer si tu sautes `load()` et laisses le décodage se faire dans un `save()` ultérieur ?
- La même fonction `load_image` sert à la fois le cas mono-image et la boucle de dossier. Qu'est-ce qui changerait dans la gestion d'erreur si tu voulais que le chargement *par lots* collecte les échecs et continue, au lieu de lever une erreur sur le premier mauvais fichier ?

## Étape 2 : Applique des filtres et des améliorations

Pillow embarque deux familles de réglages : `ImageFilter`, qui transforme les pixels (flou, netteté, détection de contours), et `ImageEnhance`, qui met à l'échelle des aspects de l'image (luminosité, contraste, couleur). Cette étape les enveloppe dans une seule fonction qui dispatch par nom, et enchaîne deux effets dans une image finale.

### 2.1 Construis la table de dispatch des filtres

**👟 Indice de départ :** Mets la correspondance nom → opération dans un `dict` dont les valeurs sont de petits callables, pour qu'ajouter un filtre plus tard signifie ajouter une ligne, pas une autre branche `if`.

```python
# editor.py (continued)
def apply_filter(img: Image.Image, filter_name: str, **kwargs) -> Image.Image:
    """Apply a named filter to an image, returning a new image."""
    filters = {
        "blur": lambda: img.filter(ImageFilter.GaussianBlur(radius=kwargs.get("radius", 5))),
        "sharpen": lambda: img.filter(ImageFilter.SHARPEN),
        "edge": lambda: img.filter(ImageFilter.FIND_EDGES),
        "emboss": lambda: img.filter(ImageFilter.EMBOSS),
        "brightness": lambda: ImageEnhance.Brightness(img).enhance(kwargs.get("factor", 1.5)),
        "contrast": lambda: ImageEnhance.Contrast(img).enhance(kwargs.get("factor", 1.5)),
        "saturation": lambda: ImageEnhance.Color(img).enhance(kwargs.get("factor", 2.0)),
    }
    if filter_name not in filters:
        raise ValueError(f"Unknown filter: {filter_name}. Available: {', '.join(filters)}")
    return filters[filter_name]()
```

Le `dict` de lambdas est une **table de dispatch** : la clé *est* la branche, donc la recherche `filters[filter_name]()` remplace une longue chaîne `if/elif`. Les noms inconnus échouent bruyamment (`ValueError`) plutôt que de retourner l'image inchangée en silence, ce qui rend les fautes de frappe visibles dans le traitement par lots. Chaque amélioration enveloppe l'image *courante* et `.enhance(factor)` multiplie cette propriété, un facteur au-dessus de `1.0` la renforce, en dessous de `1.0` l'atténue.

**🎯 Résultat attendu :** `apply_filter(img, "blur", radius=8)` retourne une image plus douce ; `apply_filter(img, "edge")` retourne une image presque noire avec des contours lumineux. `apply_filter(img, "nope")` lève `ValueError: Unknown filter: nope. Available: blur, sharpen, edge, emboss, brightness, contrast, saturation`.

**🩹 Si ça ne marche pas :** Si `GaussianBlur` n'est pas trouvé, tu n'as importé que `ImageEnhance` dans ce morceau, `ImageFilter` doit être dans la même ligne `from PIL import ...` (ou ajouté). Si le résultat « edge » ressemble à l'original, tu réutilises un original affichable au lieu de l'image *retournée*, réaffecte toujours `img = apply_filter(img, ...)` dans une chaîne.

### 2.2 Enchaîne deux effets et enregistre

**👟 Indice de départ :** Applique une hausse de luminosité, puis affine le *résultat*, et enregistre avec un réglage de qualité JPEG, prouvant que les filtres composent quand chacun retourne une image.

```python
# editor.py (continued)
bright = apply_filter(img, "brightness", factor=1.3)
sharp = apply_filter(bright, "sharpen")
sharp.save("enhanced.jpg", quality=95)
print("Saved enhanced.jpg")
```

L'enchaînement fonctionne parce que chaque filtre retourne une nouvelle image plutôt que de muter l'entrée, `sharp = apply_filter(bright, ...)` lit la sortie *précédente* comme entrée. L'argument `quality=95` sur `save()` compte pour JPEG spécifiquement : il échange la taille du fichier contre la fidélité, et contrairement au PNG (sans perte, sans bouton de qualité), choisir une valeur sensée fait partie de la production d'un rendu acceptable.

**🎯 Résultat attendu :** `Saved enhanced.jpg`, et le nouveau fichier est visiblement plus lumineux et plus net que `photo1.jpg` à l'ouverture.

**🩹 Si ça ne marche pas :** Si l'image enregistrée ressemble à la source, la chaîne a passé `img` aux deux appels au lieu de passer `bright` au second. Si `save` lève une erreur à propos du mode, l'image source n'est pas en RGB (c'est `L` ou `RGBA`), JPEG accepte RGB ; convertis avec `.convert("RGB")` d'abord.

### 2.3 Vérifie le pipeline de filtres

**✅ Liste de vérification**

- ✅ `blur`, `sharpen`, `edge`, `emboss`, `brightness`, `contrast` et `saturation` produisent tous des images visiblement différentes.
- ✅ Un nom de filtre inconnu lève une `ValueError` qui liste les noms valides.
- ✅ La chaîne à deux effets a enregistré `enhanced.jpg`.

**🤔 Question(s) socratique(s)**

- Les lambdas du dict de dispatch capturent chacune `img` depuis la portée englobante. Si tu appelais `apply_filter` sans image et qu'une lambda ultérieure référençait `img`, quand l'erreur surgirait-elle, et que te dit cela sur l'évaluation d'un dict de lambdas ?
- `brightness` et `contrast` ont tous deux `factor=1.5` par défaut. Pourquoi un facteur de `1.0` est-il la valeur « neutre » pour `ImageEnhance`, et en quoi cela diffère-t-il de ce qu'un filtre comme `FIND_EDGES` (qui n'a aucun facteur du tout) fait conceptuellement à la place ?

## Étape 3 : Redimensionne et recadre sans déformation

Étirer une image pour la faire tenir dans une largeur produit le look classique de photo écrasée ; redimensionner proportionnellement ne produit pas ce look. Cette étape construit un redimensionnement qui préserve le ratio d'aspect et un recadrage qui saisit le centre de l'image, les deux opérations derrière chaque miniature et chaque image hero de site.

### 3.1 Redimensionne en gardant le ratio d'aspect

**👟 Indice de départ :** Calcule le ratio entre la largeur cible et la largeur actuelle, applique-le à la hauteur, et passe toute la nouvelle taille à `resize` avec un filtre de rééchantillonnage de haute qualité.

```python
# editor.py (continued)
def resize_keep_ratio(img: Image.Image, max_width: int) -> Image.Image:
    """Resize to max_width, keeping the aspect ratio."""
    ratio = max_width / img.width
    new_height = int(img.height * ratio)
    return img.resize((max_width, new_height), Image.LANCZOS)

small = resize_keep_ratio(load_image("input_photos/photo1.jpg"), 640)
print(f"resized -> {small.size}")
```

Toute l'idée tient dans une seule étape arithmétique : `ratio = max_width / img.width` te donne l'échelle, et multiplier la hauteur par ce même ratio garantit que la largeur et la hauteur rétrécissent ensemble, aucune distorsion. `Image.LANCZOS` demande le meilleur filtre de réduction d'échantillonnage de Pillow, ce qui compte le plus en rétrécissement (il lisse les bords en escalier). C'est la recette dimensionnelle canonique « tenir dans une largeur » utilisée par chaque générateur de miniatures.

**🎯 Résultat attendu :** `resized -> (640, 640)`, l'image de test 480×480 se met à l'échelle à la largeur 640 avec une hauteur de 640, ratio intact (essaie sur l'original et vérifie que `height/width` est inchangé).

**🩹 Si ça ne marche pas :** Si le résultat a un ratio différent de la source, `new_height` n'a pas été calculé depuis `img.height * ratio`. Si tu obtiens `AttributeError: 'Image' object has no attribute 'resize'`, l'objet passé n'est pas une image Pillow, exécute le résultat de `load_image(...)` directement dans cette fonction. Si `Image.LANCZOS` erre sur de très vieilles versions de Pillow, mets à jour Pillow (la constante est un alias de longue date).

### 3.2 Recadre le carré central

**👟 Indice de départ :** Pour une longueur de côté demandée, calcule la boîte centrée sur l'image, puis donne ce quadruple à `crop`, le recadrage ne redimensionne jamais, il découpe seulement.

```python
# editor.py (continued)
def crop_center_square(img: Image.Image, side: int) -> Image.Image:
    """Crop the center square of `side` pixels from the middle of an image."""
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    return img.crop((left, top, left + side, top + side))

thumb = crop_center_square(load_image("input_photos/photo1.jpg"), 240)
thumb.save("thumb.jpg", quality=95)
print(f"thumb -> {thumb.size}")
```

`crop` prend une boîte `(left, top, right, bottom)` et retourne la découpe, en gardant la même résolution de pixels à l'intérieur, c'est pourquoi une miniature faite ainsi est *nette* : tu centre-recadres *puis* réduis si tu veux un petit carré. La division entière `// 2` centre la fenêtre en répartissant uniformément tout reste impair. Ce motif « trouve la boîte, garde-la carrée » est le comportement de recadrage d'avatar par défaut dans la plupart des applications.

**🎯 Résultat attendu :** `thumb -> (240, 240)`, enregistré comme `thumb.jpg`, représentant le milieu de l'original plutôt que son coin supérieur gauche.

**🩹 Si ça ne marche pas :** Si le recadrage n'est pas centré, l'un des `left`/`top` utilise la division flottante simple `/`, produisant des coordonnées fractionnaires. Si `side` dépasse la dimension de l'image, `left` devient négatif et la fenêtre de recadrage dépasse l'image, protège en bornant `side = min(side, img.width, img.height)`. Si la miniature est une fine tranche, l'arithmétique de la boîte est inversée (`left + side` contre `left - side`).

### 3.3 Vérifie le redimensionnement et le recadrage

**✅ Liste de vérification**

- ✅ `resize_keep_ratio(img, 640)` préserve le ratio d'aspect (height/width inchangé).
- ✅ `crop_center_square(img, 240)` retourne une tranche centrale 240×240 focalisée.
- ✅ Les deux résultats s'enregistrent avec succès.

**🤔 Question(s) socratique(s)**

- `resize_keep_ratio` arrondit `new_height` avec `int()`. Pour un rectangle dont la hauteur réelle mise à l'échelle est fractionnaire, recadrer ou redimensionner *puis* arrondir produit-il déjà une erreur de ratio d'un pixel, et quand (si jamais) un pixel unique de distorsion compte-t-il en pratique ?
- Centre-recadrer puis réduire est une façon de faire une miniature. En quoi le *résultat visuel* différerait-il si tu réduisais d'abord et recadrais ensuite, et pourquoi les vrais systèmes d'avatars recadrent-ils avant de mettre à l'échelle ?

## Étape 4 : Ajoute des filigranes

Un filigrane est une signature de marque (ou une protection du droit d'auteur) qui doit se poser visiblement sur la photo sans la cacher. L'astuce dans Pillow est que dessiner sur l'image *originale* ne peut pas produire de transparence partielle sur un canevas RGB, donc tu dessines sur une couche de surimpression RGBA séparée et tu la composites.

### 4.1 Ajoute un filigrane texte transparent

**👟 Indice de départ :** Copie l'image en RGBA, construis une surimpression entièrement transparente de la même taille, dessine un texte blanc à 50 % d'alpha sur la surimpression, puis `alpha_composite` les deux et aplatit en RGB pour l'enregistrement.

```python
# editor.py (continued)
from PIL import ImageDraw, ImageFont

def add_text_watermark(img: Image.Image, text: str, position: str = "bottom-right") -> Image.Image:
    """Add a semi-transparent text watermark and flatten to RGB."""
    watermarked = img.copy().convert("RGBA")
    overlay = Image.new("RGBA", watermarked.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)

    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except (IOError, OSError):
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    margin = 20

    positions = {
        "bottom-right": (img.width - text_w - margin, img.height - text_h - margin),
        "bottom-left": (margin, img.height - text_h - margin),
        "top-right": (img.width - text_w - margin, margin),
        "center": ((img.width - text_w) // 2, (img.height - text_h) // 2),
    }
    x, y = positions.get(position, positions["bottom-right"])
    draw.text((x, y), text, fill=(255, 255, 255, 128), font=font)

    return Image.alpha_composite(watermarked, overlay).convert("RGB")

watermarked = add_text_watermark(load_image("input_photos/photo2.jpg"), "My Photo 2026", "bottom-right")
watermarked.save("watermarked.jpg", quality=95)
print("Saved watermarked.jpg")
```

La valeur alpha dans `fill=(255, 255, 255, 128)` est la récompense : `128` sur une échelle RGBA de 0 à 255 est exactement 50 % d'opacité. Dessiner ce texte blanc à moitié transparent sur une *surimpression séparée*, puis appeler `alpha_composite(watermarked, overlay)`, est ce qui garde la photo en dessous intacte pendant que le texte transparaît, dessiner directement sur une image RGB devrait remplacer les pixels complètement. `.convert("RGB")` à la fin aplatit l'alpha pour que l'encodeur JPEG (qui ne stocke pas de transparence) accepte le fichier.

**🎯 Résultat attendu :** `Saved watermarked.jpg`, la photo avec `My Photo 2026` flottant à 50 % d'opacité dans le coin inférieur droit, marge centrée à 20 px des bords.

**🩹 Si ça ne marche pas :** Si le texte est totalement opaque, le canal alpha est `255` (ou `.convert("RGB")` a tourné *avant* la composition, aplatissant la transparence). Si le texte repose partiellement hors du canevas, `text_w`/`text_h` viennent d'un `bbox` obsolète et ne correspondent pas à la police réellement utilisée. Si la police de secours par défaut ressemble à un flou d'un pixel, le chemin DejaVu n'a pas été trouvé sur ton système, pointe `truetype` vers un fichier de police existant, ou utilise `load_default(size=...)` sur Pillow 10+.

### 4.2 Superpose un logo image

**👟 Indice de départ :** Réutilise la miniature de l'Étape 3 comme logo, mets-la à l'échelle d'une fraction de la largeur de l'image, et `paste`-la avec son propre canal alpha comme masque pour que sa transparence soit préservée.

```python
# editor.py (continued)
def add_image_watermark(img: Image.Image, logo: Image.Image, scale: float = 0.15, margin: int = 16) -> Image.Image:
    """Paste a scaled logo into the bottom-right corner, keeping its alpha."""
    base = img.convert("RGBA")
    logo_rgba = logo.convert("RGBA")
    new_w = max(1, int(base.width * scale))
    ratio = new_w / logo_rgba.width
    logo_rgba = logo_rgba.resize((new_w, int(logo_rgba.height * ratio)), Image.LANCZOS)
    x = base.width - logo_rgba.width - margin
    y = base.height - logo_rgba.height - margin
    base.paste(logo_rgba, (x, y), logo_rgba)  # third arg = alpha mask
    return base.convert("RGB")

logo = load_image("thumb.jpg")
with_logo = add_image_watermark(load_image("input_photos/photo3.jpg"), logo)
with_logo.save("logo_watermark.jpg", quality=95)
print("Saved logo_watermark.jpg")
```

`paste` avec l'image passée *comme son propre masque* est la ligne subtile : `base.paste(logo_rgba, (x, y), logo_rgba)` colle les pixels, et le troisième argument, le propre canal alpha de l'image, décide pixel par pixel à quel point le logo transparaît. Un logo RGBA collé sans masque poserait son rectangle opaque ; avec un masque, sa transparence survit. `scale=0.15` dimensionne le logo relativement à l'image, donc la même fonction fonctionne sur un fichier de test de 480 px et sur une exportation de reflex de 6000 px.

**🎯 Résultat attendu :** `Saved logo_watermark.jpg`, `thumb.jpg` apparaît en bas à droite de `photo3.jpg` à environ 15 % de la largeur de l'image, sans que ses coins montrent une boîte dure.

**🩹 Si ça ne marche pas :** Si le logo a une vilaine boîte englobante opaque, l'argument masque (troisième argument `paste`) est manquant. Si le logo est gigantesque ou microscopique, `new_w` utilise la largeur source plutôt que `base.width * scale`. Si le paste ne fait silencieusement rien, le logo source s'est chargé comme une image *paresseuse*, appelle `.load()` ou référence les pixels avant de coller.

### 4.3 Vérifie l'étape de filigrane

**✅ Liste de vérification**

- ✅ Le filigrane texte s'enregistre en JPEG à ~50 % d'opacité dans les quatre positions nommées.
- ✅ Un logo collé avec son masque alpha garde des coins transparents.
- ✅ Les deux sorties s'ouvrent proprement et le contenu de la photo est encore visible sous le filigrane.

**🤔 Question(s) socratique(s)**

- `fill=(255, 255, 255, 128)` est à moitié transparent. Que se passerait-il textuellement si tu dessinais sur l'image RGB originale avec ce même quadruple au lieu de sur une surimpression RGBA, pourquoi un canevas RGB ne peut-il pas représenter « à moitié-là » du tout ?
- La surimpression est une image séparée, entièrement transparente, de la même taille que la photo. Pourquoi cette conception à deux couches au lieu de dessiner le texte une fois et de l'enregistrer ? Que devrais-tu changer pour repositionner plus tard un filigrane sans redessiner la photo en dessous ?

## Étape 5 : Traite un répertoire par lots

Le but même d'une boîte à outils est le passage à l'échelle : les cinq mêmes étapes, appliquées à chaque image d'un dossier, sans en ouvrir chacune à la main. Cette étape construit la boucle qui transforme tes fonctions en processeur de dossier à une commande.

### 5.1 Traite chaque image d'un dossier

**👟 Indice de départ :** Collecte les fichiers d'images par extension, crée un dossier de sortie et exécute la chaîne de filtres par fichier en attrapant les erreurs *par fichier* pour qu'une seule mauvaise image n'arrête jamais le lot.

```python
# editor.py (continued)
def batch_process(input_dir: str, output_dir: str, operations: list[dict]) -> None:
    """Apply a chain of named filter operations to every image in a directory."""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
    files = [f for f in Path(input_dir).iterdir() if f.suffix.lower() in extensions]

    print(f"Processing {len(files)} images...")
    for filepath in files:
        try:
            img = load_image(str(filepath))
            for op in operations:
                img = apply_filter(img, op["filter"], **op.get("params", {}))
            out_name = f"processed_{filepath.stem}.jpg"
            img.save(out / out_name, quality=90)
            print(f"  OK {filepath.name} -> {out_name}")
        except Exception as e:
            print(f"  SKIP {filepath.name}: {e}")

batch_process("input_photos", "output", [
    {"filter": "brightness", "params": {"factor": 1.2}},
    {"filter": "contrast", "params": {"factor": 1.1}},
    {"filter": "sharpen"},
])
```

La conception qui rend un lot fiable est le `try/except` interne *dans* la boucle : un fichier corrompu, un mauvais mode, n'importe quel échec par fichier affiche `SKIP photo2.jpg: ...` et la boucle continue, une mauvaise image ne tue pas les deux cents autres. `operations` est une liste de petits dicts qui réutilisent exactement le dispatch `apply_filter` de l'Étape 2, donc le pipeline par lots et le chemin interactif mono-image partagent la même sémantique. L'ensemble d'extensions plus `suffix.lower()` respecte la casse (`JPG` contre `jpg`) et saute les fichiers non-image errants.

**🎯 Résultat attendu :** `Processing 3 images...` puis une ligne `OK photoN.jpg -> processed_photoN.jpg` par fichier, et un dossier `output/` contenant trois JPEG traités.

**🩹 Si ça ne marche pas :** Si rien ne se traite, le dossier de sortie existe mais le chemin d'entrée est faux ou le filtre d'extensions exclut tes fichiers. Si le lot s'arrête à la première erreur, le `try/except` enveloppe toute la boucle au lieu d'un seul fichier. Si chaque sortie est la version par défaut du filtre peu importe `params`, l'extraction `**op.get("params", {})` manque dans l'appel `apply_filter`.

### 5.2 Vérifie la passe par lots

**✅ Liste de vérification**

- ✅ Les trois images de `input_photos/` sont écrites dans `output/` comme `processed_*.jpg`.
- ✅ Un fichier délibérément cassé dans le dossier provoque une ligne `SKIP` mais n'arrête pas le reste.
- ✅ Le lot utilise le même dictionnaire `apply_filter` que les étapes interactives.

**🤔 Question(s) socratique(s)**

- Le lot enregistre chaque résultat en JPEG. Que devrais-tu changer pour *préserver* le format source (le PNG reste PNG, le WebP reste WebP), et que te donne `filepath.suffix` gratuitement ici ?
- `SKIP` affiche et continue sur toute exception, inconditionnellement. Quand avaler-et-continuer est-il le *mauvais* choix, et quel genre de compteur (ou arrêt-après-N) laisserait le lot faire surface un problème systémique au lieu de le cacher ?

## ⚠️ Pièges courants

- **Enregistrer du RGBA en JPEG.** JPEG n'a pas de canal alpha, donc une image avec filigrane (RGBA) échoue ou aplatit de façon imprévisible. Correctif : `.convert("RGB")` avant tout `save()` JPEG, les deux fonctions de filigrane ci-dessus font cela délibérément.
- **Oublier `ImageFilter` dans l'import.** `from PIL import Image, ImageEnhance` fonctionne très bien jusqu'à ce que `ImageFilter.GaussianBlur` lève `AttributeError` profondément dans un appel de filtre. Correctif : une ligne d'import pour les trois (`Image`, `ImageFilter`, `ImageEnhance`), la configuration le fait, garde-le ainsi.
- **Des chemins de polices spécifiques à la plateforme.** Le chemin DejaVu est un emplacement bien connu de Linux ; sur macOS ou Windows, `truetype` lève une erreur et tu retombes sur une minuscule police par défaut. Correctif : enveloppe la recherche dans `try/except` (comme montré), ou accepte un argument de chemin de police pour que les appelants passent la leur.
- **Ne pas réaffecter les résultats enchaînés.** `apply_filter(bright, "sharpen")` retourne une nouvelle image ; ignorer la valeur de retour et enregistrer la variable intermédiaire défait silencieusement la moitié de la chaîne. Correctif : écris toujours `img = apply_filter(img, ...)` ou passe le résultat précédent directement dans l'appel suivant.
- **Un mauvais fichier qui tue un lot.** Une boucle non protégée transforme un JPEG corrompu en zéro sortie. Correctif : garde le `try/except` *dans* la boucle (Étape 5), et envisage de journaliser quels fichiers ont été sautés pour pouvoir les inspecter plus tard.

## Ce que tu viens de construire

Une vraie boîte à outils de traitement d'images : elle charge et inspecte des images en toute sécurité, applique sept effets de filtres/améliorations via une table de dispatch, redimensionne et recadre sans déformation, superpose des filigranes texte et logo transparents, et exécute toute la chaîne sur un dossier automatiquement. La compétence transférable est *la conception de chaîne de transformations* : chaque opération prend une image et retourne une image, donc les modifications uniques et les lots de mille fichiers utilisent des blocs de construction identiques, le même motif de composition derrière chaque bibliothèque d'images, des miniatures aux suites d'édition complètes.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/image-editor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/image-editor) dans le dépôt du cours livre le script complet plus un convertisseur de format et un outil de comparaison côte à côte. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Construis un **convertisseur de format** : une fonction qui prend un chemin source et une chaîne de format cible (`"webp"`, `"png"`) et enregistre avec la bonne extension, un ajout de six lignes qui convertit tout ton dossier en WebP en une passe. Le petit indice : `img.save(path.with_suffix("." + target))` fonctionne généralement tel quel.
- Fais un **outil de comparaison côte à côte** qui place les images avant et après l'une à côté de l'autre avec une ligne de séparation, crée un nouveau canevas avec `Image.new`, puis `paste` les deux images dessus dans les deux moitiés.
- Extrais les **métadonnées EXIF** (appareil, GPS, horodatage) des JPEG de smartphones avec `img.getexif()`, un superpouvoir en lecture seule qui réutilise ta fonction `load_image` inchangée.
- Ajoute des **préréglages de recadrage d'aspect**, `crop_center_square` se généralise déjà aux rognages « cover » pour les bannières 16:9 ; généralise l'arithmétique de boîte une fois et chaque taille devient un appel de fonction.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'art de faire voir les images aux ordinateurs. 🎓