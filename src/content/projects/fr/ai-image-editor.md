---
title: "Éditeur d'Images IA"
description: "Éditez des images avec des instructions en langage naturel — supprimez des objets, changez les arrière-plans, appliquez des styles."
difficulty: "advanced"
estimatedMinutes: 120
xpReward: 100
tags: ["Creative", "Machine Learning", "APIs"]
prerequisites:
  - "Bases de Python (fonctions, classes, dictionnaires, entrées/sorties de fichiers)"
  - "À l'aise pour importer et utiliser des bibliothèques tierces (pip ou uv)"
learningObjectives:
  - "Charger et inspecter des images avec Pillow et raisonner sur les pixels, les modes et les formats"
  - "Écrire chaque modification comme une fonction pure qui retourne une nouvelle image, en préservant l'originale"
  - "Analyser du texte d'instruction en anglais simple pour en tirer des opérations de modification paramétrées"
  - "Construire une pile d'historique annuler/rétablir pour que l'édition reste non destructive"
  - "Traiter par lot tout un dossier d'images avec une seule instruction cohérente"
  - "Livrer un CLI qui applique, vérifie et enregistre les modifications de bout en bout"
---


# 🛠️ 📷 Construire un Éditeur d'Images IA

Éditer des images à la main dans un outil de peinture va bien pour une photo ; cela s'effondre quand tu as besoin de la même correction — éclaircir, recadrer, ajouter une bordure — pour une centaine de photos qui arrivent selon un planning. Ce projet construit ce qu'un humain ne peut pas faire : un éditeur d'images Python qui lit une instruction en anglais simple comme `crop to 400x300 and brighten 25%`, l'applique à n'importe quelle image, et peut annuler son propre travail. Pillow fait la chirurgie de pixels ; le pipeline fait le jugement, la pile d'annulation et le traitement par lot.

Cela suppose Python 101 et l'aisance à exécuter des bibliothèques tierces — rien de l'Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Charger une vraie image avec Pillow et lire son format, sa taille, son mode et ses extrêmes de pixels avant de toucher à quoi que ce soit.
2. Implémenter chaque modification — recadrage, redimensionnement, rotation, luminosité — comme une fonction pure qui retourne une image *nouvelle*, sans jamais muter l'originale.
3. Écrire un analyseur qui transforme de courtes instructions en anglais en appels de modification paramétrés, et se comporte de façon prévisible quand une instruction est inconnue.
4. Construire une pile d'historique pour que chaque modification puisse être annulée et rétablie.
5. Appliquer une instruction à tout un dossier d'images et enregistrer les résultats avec un manifeste de ce que chaque fichier est devenu.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — Pillow fonctionne dans tout vrai Python, et tout l'intérêt de l'étape de traitement par lot est de toucher de nombreux fichiers `.png` sur ton propre disque, ce qui convient parfaitement à un dossier de projet local.

**GitHub Codespaces** fonctionne bien aussi : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et tout ce qui suit s'exécute sans changement.

**Google Colab, Kaggle Notebooks et Binder sont un moyen correct d'*essayer* le pipeline central.** Pillow est préinstallé dans Colab et Kaggle, et le notebook ci-dessous génère sa propre image d'exemple pour que chaque étape s'exécute pour de vrai. L'avertissement honnête : envoyer *tes propres* photos vers un notebook demande plus de friction que de pointer le CLI vers un dossier local, donc considère le chemin notebook comme le bac à sable et le `uv` local comme le vrai flux de travail.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-image-editor/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-image-editor/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-image-editor%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant d'écrire l'éditeur : un projet avec Pillow installé, et une image d'exemple à pointer (générée par du code, pour que tu ne cherches jamais une photo).

### Mets en place le projet

```bash
uv init ai-image-editor
cd ai-image-editor
uv add pillow
```

Pillow (PIL) est la bibliothèque d'images standard de l'industrie pour Python — la même bibliothèque qui se trouve derrière des dizaines de pipelines de vignettes, et une sans aucune dépendance GPU ou cloud. `uv add pillow` l'installe dans l'environnement propre du projet.

### Génère une image d'exemple

**👟 Indice de départ :** Crée `sample.png` avec un petit script qui dessine un dégradé de couleurs lisse — un sujet de test déterministe, pour que chaque modification que tu appliques ait un résultat connu et vérifiable.

```python
# make_sample.py
from PIL import Image

img = Image.new("RGB", (400, 300))
px = img.load()
for y in range(300):
    for x in range(400):
        px[x, y] = ((x * 255) // 400, (y * 255) // 300, 128)
img.save("sample.png")
```

`Image.new("RGB", (400, 300))` met en place un canevas vide et `img.load()` renvoie un objet d'accès aux pixels à travers lequel tu peux écrire avec des index pixel-parfait. Écrire une couleur pour chaque position `(x, y)` produit un dégradé dont tu peux prédire les valeurs exactes à l'avance — la propriété qui permet à chaque « Résultat attendu » ultérieur d'être un nombre précis au lieu d'une sensation.

**✅ Liste de vérification**

- ✅ `uv add pillow` se termine sans erreurs.
- ✅ `uv run python make_sample.py` crée `sample.png` dans ton dossier de projet, 400×300 pixels.

## Étape 1 : Regarde une image comme le fait Python

Un éditeur ne peut pas corriger une image qu'il ne peut pas décrire. Cette étape lit ce qu'une image *est* réellement — son format tel que stocké sur disque, ses dimensions de pixels, son mode de couleur, et le pixel le plus sombre et le plus clair de chaque canal — avant que toute opération ne s'exécute. Chaque étape suivante dépend de la véracité de ces quatre nombres.

### 1.1 Lis les métadonnées

**👟 Indice de départ :** Ouvre `sample.png` et imprime son format, sa taille, son mode et ses extrêmes par canal, plus quelques pixels de coin pour confirmer que tu comprends la géométrie.

```python
# editor.py
from PIL import Image

img = Image.open("sample.png")
print("format:", img.format)
print("size:", img.size)
print("mode:", img.mode)
print("extrema:", img.getextrema())
print("corner (0, 0):", img.getpixel((0, 0)))
print("corner (399, 299):", img.getpixel((399, 299)))
```

`Image.open` lit paresseusement — rien n'est décodé en mémoire tant qu'une opération sur les pixels ne le demande pas — ce qui est un détail du monde réel qui vaut la peine d'être gardé : ouvrir une vérification de métadonnées 400×400 n'a pas besoin d'un décodage complet. `img.getextrema()` retourne le min/max par canal, et `getpixel` confirme la géométrie en touchant un coin connu.

**🎯 Résultat attendu :** `format: PNG`, `size: (400, 300)`, `mode: RGB`, `extrema: ((0, 254), (0, 254), (128, 128))`, et les deux coins affichent `(0, 0, 128)` et `(254, 254, 128)`.

**🩹 Si ça ne marche pas :** Si `FileNotFoundError` apparaît, `sample.png` n'est pas dans le répertoire depuis lequel le script a été exécuté — vérifie le répertoire de travail, pas le fichier. Si le coin à `(399, 299)` diffère de `(254, 253, 128)`, ton dégradé écrit une formule différente — souviens-toi que les canaux rouge et vert plafonnent tous deux à 254 parce que `(399 * 255) // 400` et `(299 * 255) // 300` s'arrondissent à 254.

### 1.2 Distingue l'accès destructif de l'accès non destructif

**👟 Indice de départ :** Sonde la différence entre `ImageEnhance` qui retourne une nouvelle image versus `getpixel`/`putpixel` qui mutent l'objet chargé — cette distinction est la graine de la pile d'annulation de l'Étape 4.

```python
# editor.py (continued)
from PIL import Image, ImageEnhance

img = Image.open("sample.png")
original_id = id(img)

brighter = ImageEnhance.Brightness(img).enhance(1.5)
print("returns new object:", id(brighter) != original_id)
print("original untouched:", img.getpixel((0, 0)))
print("new is brighter:", brighter.getpixel((0, 0)))
```

`ImageEnhance.Brightness(img).enhance(1.5)` retourne un objet image *séparé* ; l'`img` d'origine lit toujours son ancien pixel à `(0, 0)`. Ce contrat — les opérations retournent de nouveaux objets tandis que les entrées restent immuables — est exactement ce qui rend une pile d'annulation possible. Dès qu'une opération mute en place, l'état « avant » est définitivement perdu.

**🎯 Résultat attendu :** `returns new object: True`, `original untouched: (0, 0, 128)`, et `new is brighter: (0, 0, 192)` — le canal bleu 128 multiplié par 1.5.

**🩹 Si ça ne marche pas :** Si `original untouched` affiche une valeur que tu n'as pas définie, l'image d'exemple a été écrasée par une exportation ultérieure — régénère-la avec `make_sample.py`. Si les ID des objets image *sont* égaux, tu as appelé une méthode mutante comme `.resize()` directement sur une instance `Image` au lieu de passer par l'amplificateur.

### 1.3 Vérifie l'inspection d'image

**✅ Liste de vérification**

- ✅ Tu peux énoncer les quatre lectures de métadonnées : format, taille, mode, extrêmes.
- ✅ Tu as vu de tes propres yeux qu'`enhance` retourne un nouvel objet et laisse la source intacte.
- ✅ Les pixels de coin du dégradé correspondent à la formule écrite par le script d'exemple.

**🤔 Question(s) socratique(s)**

- `format` a signalé `PNG` alors que l'image en mémoire est RGB sans alpha. D'où vient réellement la valeur `format`, et que serait `img.format` si tu créais une `Image` en mémoire sans la sauvegarder d'abord sur disque ?
- Le facteur de luminosité `1.5` a transformé le canal `128` en `192`. Qu'arrive-t-il à un pixel déjà à `200` quand tu amplifies par `2.0` ? Que fait Pillow avec des valeurs qui dépasseraient 255, et pourquoi cela dégrade-t-il silencieusement la précision de tout le canal ?

## Étape 2 : Écris les modifications comme fonctions pures

Chaque opération de modification devient une petite fonction avec une discipline : prendre une image, retourner une image *nouvelle*, ne jamais toucher à l'entrée. Les fonctions pures sont ce qui permet au pipeline de composer les opérations en sécurité et de les annuler plus tard — et elles rendent chaque modification trivialement testable en isolation.

### 2.1 Les quatre opérations centrales

**👟 Indice de départ :** Implémente `crop`, `resized`, `rotated` et `brightness` — quatre lignes ou moins chacune, chacune retournant une nouvelle `Image`.

```python
# editor.py (continued)
def crop(img: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return img.crop(box)

def resized(img: Image.Image, width: int, height: int) -> Image.Image:
    return img.resize((width, height))

def rotated(img: Image.Image, degrees: float) -> Image.Image:
    return img.rotate(degrees, expand=True)

def brightness(img: Image.Image, factor: float) -> Image.Image:
    return ImageEnhance.Brightness(img).enhance(factor)

sample = Image.open("sample.png")
print("crop:", crop(sample, (0, 0, 200, 150)).size)
print("resize:", resized(sample, 100, 100).size)
print("rotate:", rotated(sample, 90).size)
print("brighten 2x:", brightness(sample, 2.0).getpixel((100, 50)))
```

Les types sont le contrat : chaque fonction déclare `-> Image.Image` et retourne un objet frais. `rotate(..., expand=True)` redimensionne le canevas pour qu'une rotation de 90° d'une image 400×300 devienne 300×400 — la seule opération où la taille change visiblement, ce que ton résultat attendu devrait refléter. `brightness` prouve la revendication de pureté : elle lit `sample` à `(100, 50)` sans le changer.

**🎯 Résultat attendu :** Le script imprime `crop: (200, 150)`, `resize: (100, 100)`, `rotate: (300, 400)`, et `brighten 2x` montre le pixel à `(100, 50)` lu comme `(126, 84, 255)` — son rouge `63` doublé à `126` et son bleu `128` plafonné à `255`.

**🩹 Si ça ne marche pas :** Si `rotate` imprime `(400, 300)`, tu as laissé tomber `expand=True` et Pillow a rogné la rotation sur l'ancien canevas. Si `brighten 2x` lit `255` au lieu de `127`, la valeur a été plafonnée parce qu'elle était *déjà* près du sommet — échantillonne un pixel plus sombre ou utilise ton propre dégradé 400×300 au lieu d'une photo arbitraire.

### 2.2 Enchaîne les modifications et vérifie la pureté de bout en bout

**👟 Indice de départ :** Compose deux opérations et confirme que le résultat intermédiaire et le résultat enchaîné existent comme objets séparés, puis vérifie que l'originale est toujours identique octet par octet.

```python
# editor.py (continued)
result = resized(rotated(crop(sample, (0, 0, 200, 150)), 90), 100, 100)
print("chained size:", result.size)

edited_chain = [result]
print("all objects distinct:", all(id(sample) != id(o) for o in edited_chain))
print("source pixel untouched:", sample.getpixel((10, 10)))
print("edited pixel differs:", result.getpixel((10, 10)))
```

Emboîter les appels de fonction — `resized(rotated(crop(...), 90), 100, 100)` — se lit *de l'intérieur vers l'extérieur* : recadre d'abord, puis pivote, puis redimensionne. Parce que chaque étape retourne un objet frais, la chaîne laisse une piste d'images intermédiaires que tu peux inspecter ou jeter, et l'`sample` d'origine répond toujours sans avoir changé.

**🎯 Résultat attendu :** `chained size: (100, 100)`, `all objects distinct: True`, `source pixel untouched` correspond au dégradé d'origine, et le pixel `(10, 10)` du résultat modifié diffère de la source.

**🩹 Si ça ne marche pas :** Si `chained size` est faux, trace l'ordre : le recadrage rétrécit à 200×150, la rotation permute à 150×200, et le redimensionnement force 100×100. Si le pixel final correspond exactement à la source, le `(10, 10)` que tu as échantillonné a survécu par coïncidence aux trois transformations sans changer — échantillonne près d'un coin où le dégradé est raide.

### 2.3 Vérifie l'ensemble d'opérations pures

**✅ Liste de vérification**

- ✅ Les quatre opérations retournent de nouveaux objets `Image` et aucune ne mute son argument.
- ✅ `rotate(..., expand=True)` change visiblement les dimensions tandis que les autres préservent le contenu réel.
- ✅ Une modification enchaînée produit un objet final distinct et laisse `sample` intact.

**🤔 Question(s) socratique(s)**

- `resized` ignore entièrement `img.size`. Qu'est-ce qui casserait dans la *chaîne* si l'une de ces fonctions mutait silencieusement son entrée au lieu de retourner une copie ? Nomme le bug spécifique qu'un `crop`-qui-mute provoquerait dans `resized(rotated(crop(...), 90), 100, 100)`.
- L'une-ligne de luminosité n'a pas de vérification de bornes : `enhance(4.0)` plafonne tout à 255. Le plafonnement à 255 est-il acceptable, ou la fonction devrait-elle se plaindre ? Quelle information de couleur est définitivement perdue dans un plafonnement à 255 qu'un pipeline basé sur des flottants garderait ?

## Étape 3 : Apprends à l'éditeur à comprendre les instructions

La surface « IA » du pipeline est un petit analyseur de langage naturel : il lit une phrase comme `crop to 200x150 and rotate 90`, extrait les paramètres avec des regex, et construit la bonne séquence de fonctions pures de l'Étape 2. Un analyseur est une IA honnête : vocabulaire limité, comportement déterministe, et il échoue bruyamment quand il ne te comprend pas.

### 3.1 Un analyseur de commandes produisant une liste d'éditions stable

**👟 Indice de départ :** Écris `parse_instruction(text)` qui retourne une liste ordonnée de tuples `(operation, args)`, pour que « traduire l'anglais en éditions » soit découplé de « appliquer les éditions » — les deux peuvent être testés séparément.

```python
# editor.py (continued)
import re
from typing import Callable

OPS: dict[str, Callable] = {
    "crop": crop, "resize": resized,
    "rotate": rotated, "brightness": brightness,
}

def parse_instruction(text: str) -> list[tuple[str, tuple]]:
    text = text.lower()
    steps: list[tuple[str, tuple]] = []
    m = re.search(r"crop to (\d+)x(\d+)", text)
    if m:
        steps.append(("crop", (0, 0, int(m.group(1)), int(m.group(2)))))
    m = re.search(r"rotate (\d+)", text)
    if m:
        steps.append(("rotate", (float(m.group(1)),)))
    m = re.search(r"(brighten|darken) (\d+)%", text)
    if m and m.group(1) == "brighten":
        steps.append(("brightness", (1 + int(m.group(2)) / 100,)))
    elif m:
        steps.append(("brightness", (1 - int(m.group(2)) / 100,)))
    if not steps:
        raise ValueError(f"No recognised edit in: {text!r}")
    return steps

print(parse_instruction("crop to 200x150 and rotate 90 and brighten 25%"))
print(parse_instruction("flip horizontally"))
```

Chaque `re.search` cherche un pattern et ajoute une étape, donc « crop to 200x150, rotate 90 » correspond à une liste de deux éléments en ordre. Convertir une instruction intraduisible en `ValueError` au lieu d'un no-op silencieux est un choix de conception délibéré — un pipeline par lot qui ne dit rien à propos d'une instruction ratée corrompra un dossier tout en prétendant avoir réussi.

**🎯 Résultat attendu :** La première impression montre `[('crop', (0, 0, 200, 150)), ('rotate', (90.0,)), ('brightness', (1.25,))]` ; la seconde lève `ValueError: No recognised edit in: 'flip horizontally'`.

**🩹 Si ça ne marche pas :** Si `flip horizontally` retourne silencieusement une liste vide, ta garde `if not steps: raise` n'est pas à la fin de la fonction. Si `brighten 25%` produit `(1.25,)` mais `darken 25%` produit un ordre d'arguments cassé, vérifie le `elif` — `darken` doit *soustraire*, pas faire correspondre le pattern dans le calcul de brighten.

### 3.2 Applique une instruction analysée à une image

**👟 Indice de départ :** Écris `apply_steps(img, steps)` qui parcourt la liste analysée, appelle chaque opération via la table `OPS`, et retourne l'image finale plus un journal de ce qui a changé.

```python
# editor.py (continued)
def apply_steps(img: Image.Image, steps: list[tuple[str, tuple]]) -> tuple[Image.Image, list[str]]:
    current = img
    log: list[str] = []
    for name, args in steps:
        before = id(current)
        current = OPS[name](current, *args)
        log.append(f"{name}{args} -> new object: {id(current) != before}")
    return current, log

final, log = apply_steps(Image.open("sample.png"), parse_instruction("rotate 90 and crop to 300x200"))
print(final.size)
print(*log, sep="\n")
```

`OPS[name](current, *args)` est le cœur piloté par table : chercher une fonction par nom dans un dict convertit directement la sortie de l'analyseur en appel sans aucune échelle `if/elif`. Garder un journal de si chaque étape a produit un nouvel objet renforce le contrat de pureté de l'Étape 2 — et donne au manifeste un endroit pour enregistrer la provenance par modification.

**🎯 Résultat attendu :** `(300, 200)` — la rotation rend d'abord le canevas 300×400, puis le recadrage rogne la largeur — et le journal imprime deux lignes, chacune rapportant `True` pour une création d'objet frais.

**🩹 Si ça ne marche pas :** Si la taille finale est `(200, 300)`, les étapes se sont exécutées recadrage-avant-rotation (vérifie l'ordre de `parse_instruction`) parce que le recadrage attrape le `(0,0,300,200)` du canevas *pivoté*. Si le journal montre `False` pour une étape, une opération a muté son entrée — `crop` dans `Pillow` *découpe* réellement paresseusement, donc sa sortie peut partager de la mémoire ; utilise-la en conséquence.

### 3.3 Vérifie la couche d'instructions

**✅ Liste de vérification**

- ✅ `parse_instruction` transforme l'anglais connu en tuples `(name, args)` ordonnés et lève une erreur sur les instructions inconnues.
- ✅ `apply_steps` produit le même résultat que d'appeler les opérations à la main.
- ✅ Le journal des opérations enregistre la provenance de chaque étape.

**🤔 Question(s) socratique(s)**

- L'analyseur fait correspondre les patterns dans un ordre fixe et *ajoute* chacun de ceux qu'il trouve. Qu'arrive-t-il à une instruction avec deux recadrages — `crop to 200x150 and crop to 100x100` ? L'analyseur devrait-il se tromper sur l'ambiguïté, ou les appliquer en séquence, et pourquoi ton choix compte-t-il pour un pipeline par lot ?
- `apply_steps` traite `OPS[name](current, *args)` comme toujours valide. Qu'est-ce que `dict.get` vs `[]` change à l'erreur que ton code lève quand l'analyseur est plus tard étendu avec un nom d'étape que la table d'opérations n'a pas encore ?

## Étape 4 : Ajoute annuler et rétablir

Les fonctions pures signifient que chaque état est un instantané bon marché. Cette étape enveloppe le pipeline dans une classe `Retoucher` qui stocke chaque état d'image dans une liste d'historique, avec un curseur qui recule sur annuler et avance sur rétablir — le même modèle qu'un vrai éditeur, sans les secousses du disque.

### 4.1 La classe de pile d'historique

**👟 Indice de départ :** Construis `Retoucher` avec une `push`, une `undo`, une `redo` et une propriété `current` ; fais en sorte que `push` tronque la queue de rétablissement pour qu'une nouvelle modification après une annulation invalide l'historique avant.

```python
# editor.py (continued)
class Retoucher:
    def __init__(self, image: Image.Image) -> None:
        self.history: list[Image.Image] = [image]
        self.cursor: int = 0

    def push(self, image: Image.Image) -> Image.Image:
        self.history = self.history[: self.cursor + 1]
        self.history.append(image)
        self.cursor = len(self.history) - 1
        return image

    def undo(self) -> Image.Image:
        if self.cursor > 0:
            self.cursor -= 1
        return self.history[self.cursor]

    def redo(self) -> Image.Image:
        if self.cursor < len(self.history) - 1:
            self.cursor += 1
        return self.history[self.cursor]

    @property
    def current(self) -> Image.Image:
        return self.history[self.cursor]
```

`self.history = self.history[: self.cursor + 1]` est la ligne qui implémente « l'annulation est terminale » : une fois que tu annules puis fais une nouvelle modification, le futur abandonné est parti et le nouveau chemin prend le relais. Le curseur pointe toujours vers le cadre vivant, donc `undo`/`redo` sont des gardes autour d'un mouvement de curseur — une ligne chacun, et l'invariant « le curseur est toujours un index valide » tient par construction.

**🎯 Résultat attendu :** `push` après deux annulations laisse exactement trois états dans `history` ; l'annulation cesse de bouger à l'index 0 ; le rétablissement cesse de bouger au dernier index.

**🩹 Si ça ne marche pas :** Si le rétablissement ressuscite une modification qui devrait être morte, la tranche de troncature n'a pas été appliquée avant l'ajout — réordonne pour que `history` soit coupé *d'abord*. Si annuler retourne éternellement la même image, la garde du curseur `if self.cursor > 0` est manquante et tu indexes toujours `history[0]`.

### 4.2 Pilote la pile avec de vraies instructions

**👟 Indice de départ :** Construis une `Retoucher` depuis `sample.png`, applique deux instructions avec `push`, annule deux fois, rétablis une fois, et vérifie que la taille de chaque image retournée correspond à l'état attendu.

```python
# editor.py (continued)
rt = Retoucher(Image.open("sample.png"))
rt.push(apply_steps(rt.current, parse_instruction("crop to 200x150"))[0])
rt.push(apply_steps(rt.current, parse_instruction("rotate 90"))[0])
print("after 2 edits:", [id(rt.current)] and rt.current.size)
rt.undo()
print("back one:", rt.current.size)
rt.undo()
print("to origin:", rt.current.size)
rt.redo()
print("forward one:", rt.current.size)
```

`rt.current` alimente l'instruction suivante, donc les états de la pile suivent l'historique des modifications : 400×300 → 200×150 → 150×200 → retour à 200×150. Chaque état est une image complète, ce qui rend `undo` trivialement correct — tu parcours de vrais cadres, pas en rejouant des opérations qui pourraient rater.

**🎯 Résultat attendu :** `after 2 edits: (150, 200)`, `back one: (200, 150)`, `to origin: (400, 300)`, `forward one: (200, 150)` — exactement les quatre tailles canoniques, dans cet ordre.

**🩹 Si ça ne marche pas :** Si `to origin` signale une taille non-400, le constructeur a stocké une *référence* mais quelque chose l'a mutée, parce que les états partagent des objets quand tu pushes sans une reconstruction pure — vérifie que tu poushes les résultats d'`apply_steps`, pas en réutilisant une op mutante. Si annuler après un nouveau `push` saute un état, vérifie que la tranche de troncature s'exécute avant l'ajout.

### 4.3 Vérifie le comportement annuler/rétablir

**✅ Liste de vérification**

- ✅ Après 2 push et 2 undo, la pile tient les états que tu attends et toute annulation ultérieure est un no-op.
- ✅ Un push après annulation tronque la piste de rétablissement — rétablir ne peut pas ressusciter une modification morte.
- ✅ Tu peux expliquer pourquoi les fonctions pures de l'Étape 2 rendent toute cette pile une liste et un compteur.

**🤔 Question(s) socratique(s)**

- Cette pile stocke l'image complète à chaque étape. Pour un scan de gigapixels c'est idiot — que stockerais-tu à la place pour rendre l'annulation bon marché, et quelle information cette version jette-t-elle ?
- `push` tronque la queue en découpant `history[: cursor + 1]`. Décris le contenu exact de l'historique après la séquence modification, annulation, modification, annulation, rétablissement, rétablissement. Quel rétablissement est un no-op et pourquoi ?

## Étape 5 : Traite un dossier par lot avec un manifeste

Le travail final du pipeline est celui qu'un humain ne fera pas : appliquer la même instruction à chaque image d'un dossier, sauvegarder chaque résultat sans écraser la source, et laisser un manifeste enregistrant ce que chaque fichier entrant est devenu.

### 5.1 Traite chaque PNG d'un répertoire

**👟 Indice de départ :** Écris `batch_edit(folder, instruction, suffix)` qui parcourt `*.png`, saute son propre dossier de sortie, applique l'instruction analysée, et sauvegarde dans `output/`.

```python
# editor.py (continued)
import json
from pathlib import Path

def batch_edit(folder: str, instruction: str, suffix: str = "_edited") -> list[dict]:
    steps = parse_instruction(instruction)
    out = Path(folder) / "output"
    out.mkdir(exist_ok=True)
    manifest: list[dict] = []
    for src in sorted(Path(folder).glob("*.png")):
        if "output" in src.parts:
            continue
        edited, log = apply_steps(Image.open(src), steps)
        dest = out / f"{src.stem}{suffix}.png"
        edited.save(dest)
        manifest.append({"source": src.name, "dest": dest.name, "size": edited.size, "edits": log})
    return manifest

m = batch_edit(".", "crop to 200x150 and brighten 20%")
print(json.dumps(m, indent=2))
```

`Path.glob("*.png")` plus la garde `"output" in src.parts` empêche le lot de jamais modifier sa propre sortie précédente. Écrire chaque résultat sous `output/` avec un suffixe — jamais par-dessus la source — est la différence entre un conservateur et un destructeur de données, et le manifeste transforme l'exécution en un enregistrement auditable : source, destination, taille finale et le journal de modifications exact par fichier.

**🎯 Résultat attendu :** Un dossier `output/` apparaît contenant `sample_edited.png`, et le manifeste liste une entrée avec `size: (200, 150)` et un journal de modifications nommant les étapes de recadrage et de luminosité.

**🩹 Si ça ne marche pas :** Si `sample_edited.png` apparaît *deux fois* dans le manifeste — la seconde comme `output/sample_edited_edited.png` — la garde a manqué sa cible, ce qui signifie que tu ré-exécutes le lot sur un dossier qui contient déjà `output/` ; supprime-le d'abord ou renforce la garde avec `in src.relative_to(folder).parts`. Si le manifeste est vide, il n'y a pas de PNG à la racine — l'échantillon a été sauvegardé ailleurs que dans le dossier que tu as passé.

### 5.2 Câble le CLI

**👟 Indice de départ :** Donne au lot de vrais arguments de ligne de commande avec `argparse` — `--instruction` pour la modification, `--folder` pour la cible, `--suffix` pour le nommage de sortie.

```python
# editor.py (continued)
import argparse

def main() -> None:
    parser = argparse.ArgumentParser(description="Edit images by English instruction.")
    parser.add_argument("--instruction", required=True, help='e.g. "crop to 200x150 and rotate 90"')
    parser.add_argument("--folder", default=".", help="folder of PNGs to edit")
    parser.add_argument("--suffix", default="_edited")
    args = parser.parse_args()
    try:
        manifest = batch_edit(args.folder, args.instruction, args.suffix)
    except ValueError as exc:
        parser.error(str(exc))
    print(json.dumps(manifest, indent=2))

if __name__ == "__main__":
    main()
```

`argparse` te donne `--instruction`, `--folder` et `--suffix` gratuitement, y compris la sortie `-h/--help` et un chemin `parser.error(...)` gracieux quand l'instruction ne s'analyse pas. Attraper le `ValueError` de l'analyseur et le relancer via `parser.error` fait de l'échec une sortie propre avec message au lieu d'une traceback brute.

**🎯 Résultat attendu :** `uv run python editor.py --instruction "rotate 90"` imprime un manifeste dont l'entrée a `dest: sample_edited.png` et `size: (300, 400)`.

**🩹 Si ça ne marche pas :** Si le CLI lève `SystemExit` avec le message quand tu fournis une instruction absurde, c'est le chemin `parser.error` voulu — une traceback non attrapée signifie que le `try/except` a été abandonné. Si des fichiers de sortie manquent, confirme que `--folder` pointe vers le dossier qui tient réellement les PNG.

### 5.3 Vérifie le pipeline par lot

**✅ Liste de vérification**

- ✅ `batch_edit` produit `output/` avec un fichier modifié par PNG source et n'écrase jamais une source.
- ✅ Le manifeste enregistre par fichier la source, la destination, la taille finale et le journal de modifications.
- ✅ Le CLI accepte des paramètres via des drapeaux et échoue proprement sur les instructions non reconnues.

**🤔 Question(s) socratique(s)**

- Le manifeste enregistre actuellement la taille et les modifications mais pas la moyenne de pixels de chaque résultat. Quel futur bug de rendu — non détecté par tes vérifications aujourd'hui — une moyenne de pixels stockée attraperait-elle, et que coûte son stockage ?
- `--folder` peut être `"."` depuis un répertoire et un chemin absolu depuis un autre. Qu'arrive-t-il au nommage `output/` si tu exécutes le même lot depuis deux répertoires de travail différents contre le même dossier absolu ?

## ⚠️ Pièges courants

- **Muter en place, puis perdre le « avant ».** Le `putpixel` basé sur `.load()` de Pillow et d'autres patterns de réutilisation retournent ou mutent le même objet ; si une modification centrale oublie `-> new Image`, la pile d'annulation de l'Étape 4 réécrit silencieusement l'historique.
- **Oublier `expand=True` sur `rotate`.** Sans lui le canevas reste à la taille d'avant-rotation et les coins pivotés sont rognés — le bug classique « ma photo s'est fait découper » — et cela casse en silence le calcul des tailles à chaque étape suivante.
- **No-op silencieux sur des instructions inconnues.** Un analyseur qui retourne `[]` pour « flip horizontally » traitera joyeusement par lot un dossier sans rien faire. Lever `ValueError` est la garde qui rend l'échec visible.
- **Le traitement par lot modifie sa propre sortie.** Sans la garde `"output" in src.parts` (ou un saut basé sur un suffixe), une exécution répétée retraite les fichiers précédemment modifiés, accumulant les modifications jusqu'à les rendre méconnaissables.
- **Ouvrir des images avec la mauvaise attente de référence de fichier.** `Image.open` est paresseux — lire `.size` après que le descripteur de fichier soit fermé, ou réutiliser un curseur entre formats, produit des erreurs confuses ; rouvre par opération quand tu as besoin de garanties sur les données sous-jacentes.

## Ce que tu viens de construire

Un éditeur d'images complet piloté par instructions : il charge et inspecte de vraies images, applique recadrage/redimensionnement/rotation/luminosité comme fonctions pures, analyse des instructions en anglais simple en modifications ordonnées, supporte annuler/rétablir via une pile d'historique, et traite par lot des dossiers entiers vers `output/` avec un manifeste par fichier. La compétence transférable ici est la discipline derrière l'« IA » : analyser l'entrée en données validées, garder chaque transformation pure et réversible, et rendre les échecs bruyants au lieu de silencieux.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/ai-image-editor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-image-editor) dans le dépôt du cours est tout le pipeline en notebook — génération d'échantillon, sortie vérifiée de chaque étape, et l'exécution batch — prêt à lancer Run de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Étends la table `OPS` avec `grayscale`, `blur` et `flip` comme nouvelles fonctions pures — ajouter une opération coûte maintenant une fonction de cinq lignes et une entrée de dict, jamais une nouvelle branche `if`.
- Remplace l'analyseur regex par un appel à un LLM de niveau gratuit (voir le projet [Relecteur de Code Agentique](/projects/agentic-code-reviewer) pour le tableau des fournisseurs) pour que des instructions comme « fais-le paraître vintage » soient traduites en appels `OPS` paramétrés.
- Ajoute la *comparaison* d'images au manifeste : enregistre le hash perceptuel de chaque sortie, puis signale les exécutions par lot où des sources similaires ont produit des résultats dissemblables.
- Persiste la pile d'annulation sur disque comme fichier d'historique de modifications par image, pour que `Retoucher` survive à un redémarrage — le premier pas vers un véritable éditeur non destructif.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓