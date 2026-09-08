---
title: "Moteur d'Animation"
description: "Créez des animations programmatiques avec des fonctions d'easing, des timelines et une interpolation de keyframes."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Creative", "Frontend", "Utility"]
prerequisites:
  - "Les classes, méthodes et état d'instance Python"
  - "Mathématiques : arithmétique simple, saturation (clamping), ratios"
  - "Lire et écrire des fichiers texte"
learningObjectives:
  - "Modéliser l'easing avec une courbe smoothstep et interpoler entre des nombres avec lerp"
  - "Simuler le mouvement avec la vitesse et l'intégration basée sur dt, plus les rebonds sur les murs"
  - "Composer des sprites sur une grille 2D et rendre les scènes comme des frames de texte"
  - "Suivre un chemin keyframé avec une interpolation dans le temps et adoucie"
  - "Exporter une séquence de frames vers des fichiers et reconstruire la pellicule à partir d'eux"
---

# 🛠️ 🎬 Construire un Moteur d'Animation

L'animation ressemble à de la magie parce que chaque frame est simple ; la magie est la *mathématique dans les coulisses* qui relie frame à frame. Ce projet construit ces coulisses en Python pur : un easing `smoothstep` entre deux nombres, des sprites portant une vitesse et rebondissant sur les murs d'un canevas de 30×10, un moteur à pas de temps fixe qui avance toute la scène à chaque frame, des chemins keyframés avec interpolation adoucie, et des frames exportées comme fichiers texte que tu peux rejouer. Le moteur tourne de façon déterministe — les mêmes points atterrissent dans les mêmes cellules à chaque fois — donc tu peux vérifier chaque affirmation de ce guide avant de faire danser les points. C'est un moteur texte d'abord : la « vidéo » est une pile de frames `.txt` que tu peux coller n'importe où.

Cela suppose classes et méthodes plus une arithmétique de base avec des flottants. C'est un projet facultatif et non noté — consulte [Projets du monde réel](/fr/projets) pour la liste complète et grandissante.

## 🎯 Ce que tu vas faire

1. Écrire les fonctions d'aide mathématiques : `clamp`, `lerp`, et une courbe d'easing smoothstep.
2. Définir un `Sprite` qui se déplace avec une vitesse et rebondit sur les bords du canevas.
3. Construire une `Scene` qui rend les sprites sur une grille de texte, et un `Engine` qui avance et affiche les frames.
4. Ajouter des chemins de mouvement keyframés pour qu'un sprite soit adouci le long d'un itinéraire au lieu de dériver.
5. Exporter les frames vers des fichiers et les réassembler comme une pellicule.

## Où exécuter ceci

**Localement avec `uv`** est le chemin recommandé — le moteur est du Python pur (seul `pathlib` est nécessaire), donc `uv init` te donne tout.

**Google Colab, Kaggle Notebooks et Binder** exécutent chaque étape sans modification — le canevas et l'easing ne sont que des mathématiques et des chaînes, aucun appel spécifique à une plateforme, et un notebook cellule par cellule convient bien à la conception frame par frame.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/animation-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/animation-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fanimation-engine%2Fnotebook.ipynb)

## Configuration

Tout ce qu'il faut avant que la première frame n'existe.

### Configure le projet

```bash
uv init animation-engine
cd animation-engine
```

Aucune dépendance. Le canevas est une grille de chaînes ; l'export écrit de simples fichiers texte.

**✅ Liste de vérification**

- ✅ `uv init animation-engine` crée le projet et un `main.py`.
- ✅ `uv run python3 -c "from pathlib import Path"` réussit (pathlib est le seul import).

**🤔 Question(s) socratique(s)**

- Un canevas de points avec un personnage qui se déplace est ennuyeux — mais chaque moteur de rendu, de celui-ci au film, n'est qu'« une grille, mise à jour à fréquence fixe ». Qu'est-ce qui fait de la *mathématique* entre les mises à jour, pas la grille, le vrai moteur ?
- Le projet fonctionne dans un notebook, pourtant tu exportes les frames comme fichiers texte. Qu'est-ce qu'un *film* de 10 lignes de points t'apporte qu'une boucle de rendu en direct ne peut pas — et que perdrais-tu en allant dans l'autre direction ?

## Étape 1 : La mathématique derrière le mouvement

Chaque animation se réduit à de minuscules questions numériques : « déplace de 0 à 10, mais à quel point suis-je avancé à mi-chemin ? » L'Étape 1 écrit les trois réponses que tu réutiliseras partout.

### 1.1 Clamp, lerp et smoothstep

**👟 Indice de départ :** Écris `clamp(v, lo, hi)`, `lerp(a, b, t)` et `smoothstep(t)` — ce dernier est la fameuse courbe ease-in-out `t²·(3 − 2t)`.

```python
# main.py
def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def lerp(a, b, t):
    return a + (b - a) * t

def smoothstep(t):
    t = clamp(t, 0.0, 1.0)
    return t * t * (3 - 2 * t)

print("clamp(13, 0, 10)  =", clamp(13, 0, 10))
print("lerp(0, 10, 0.5)   =", lerp(0, 10, 0.5))
print("smoothstep(0, .25, .5, .75, 1):",
      smoothstep(0), smoothstep(0.25), smoothstep(0.5), smoothstep(0.75), smoothstep(1))
```

`lerp(a, b, t)` est le cheval de trait : à `t=0` tu es à `a`, à `t=1` à `b`, et linéairement entre les deux. `smoothstep` est la personnalité d'easing : il mappe toujours 0→0 et 1→1, mais il passe le milieu du mouvement *vite* et le tout début et la toute fin *lentement* — `smoothstep(0.5)` retourne exactement `0.5`, pourtant `smoothstep(0.25)` n'est que `0.15625`, donc il s'attarde, puis rattrape. Cette asymétrie est ce qui rend un mouvement adouci vivant au lieu de mécanique.

**🎯 Résultat attendu :**

```
clamp(13, 0, 10)  = 10
lerp(0, 10, 0.5)   = 5.0
smoothstep(0, .25, .5, .75, 1): 0.0 0.15625 0.5 0.84375 1.0
```

**🩹 Si ça ne marche pas :** Si `smoothstep(0.5)` n'est pas `0.5`, vérifie l'exposant — `t*t*(3-2*t)` pas `t*t*t`. Si les valeurs s'affichent comme `0` sans décimales, les arguments étaient des `int` et une division entière s'est glissée quelque part — fournis des flottants.

### 1.2 Adoucis toute une trajectoire

**👟 Indice de départ :** Enchaîne `smoothstep` dans `lerp` pour qu'un mouvement suive la courbe plutôt qu'une ligne droite.

```python
# main.py (continued)
def eased_lerp(a, b, t):
    return lerp(a, b, smoothstep(t))

print("eased_lerp(0, 10, .5) =", eased_lerp(0, 10, 0.5))
print("eased_lerp(0, 10, .25) =", eased_lerp(0, 10, 0.25))
```

`eased_lerp` correspond à l'échantillon smoothstep ci-dessus : à `t=0.25` tu n'as couvert que `1.5625` du trajet de 10 unités, pas 2.5. Le point démarre lentement, accélère au milieu et décélère à la fin.

**🎯 Résultat attendu :**

```
eased_lerp(0, 10, .5) = 5.0
eased_lerp(0, 10, .25) = 1.5625
```

**🩹 Si ça ne marche pas :** Si `eased_lerp(0, 10, .25)` affiche `2.5`, tu as appelé `lerp(a, b, t)` directement, en sautant l'easing.

### 1.3 Vérifie la mathématique

**✅ Liste de vérification**

- ✅ `clamp(13, 0, 10) == 10`, `clamp(-4, 0, 10) == 0`.
- ✅ `smoothstep` mappe 0→0, 1→1, 0.5→0.5 et est symétrique autour du milieu.
- ✅ `eased_lerp` et les nombres purs de `smoothstep` concordent.

**🤔 Question(s) socratique(s)**

- `smoothstep` est symétrique : `smoothstep(0.25) == 1 - smoothstep(0.75)` (ici `0.84375`). Quel mouvement du monde réel ressemble à cela — accélérer, croiser, ralentir — et quelle courbe choisirais-tu à la place pour un *lancé*, où le début est rapide et l'atterrissage un smash ?
- `clamp(t, 0, 1)` à l'intérieur de `smoothstep` corrige silencieusement une entrée hors limites. Pourquoi une correction silencieuse est-elle acceptable pour adoucir un point, mais dangereuse si le même clamp cachait un bug dans, disons, l'animation *d'un cadran critique pour la sécurité* ?

## Étape 2 : Les sprites — les choses qui bougent

La mathématique déplace des nombres ; les sprites déplacent des *choses*. L'Étape 2 donne à chaque chose une position, une vitesse et un caractère, et dit « fais-moi avancer de `dt` secondes ».

### 2.1 La classe Sprite

**👟 Indice de départ :** Écris `Sprite(ch, x, y, vx=0.0, vy=0.0)` avec un `update(dt)` qui intègre la position : `x += vx · dt`.

```python
# main.py (continued)
class Sprite:
    def __init__(self, ch, x, y, vx=0.0, vy=0.0):
        self.ch = ch
        self.x, self.y = float(x), float(y)
        self.vx, self.vy = float(vx), float(vy)

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt

s = Sprite("o", 0.0, 5.0, vx=4.0)
for _ in range(5):
    s.update(0.125)
print(round(s.x, 3), round(s.y, 3))
```

`x += vx * dt` est l'intégration d'Euler : la position avance de la vitesse multipliée par le temps écoulé. Un petit `dt` = un mouvement fluide ; `dt` est le pas de temps fixe que tu normaliseras à l'Étape 3. La position est gardée comme flottant ici et seulement collée aux cellules de la grille au moment du rendu — ce flottant est la vérité « entre les frames » que la grille ne peut pas tenir.

**🎯 Résultat attendu :** `2.5 5.0` — cinq pas de `0.125s` à `4 unités/s` parcourent `5 × 0.5 = 2.5` unités, exactement.

**🩹 Si ça ne marche pas :** Si la sortie est `0.0 5.0`, `update` n'a jamais tourné (boucle mal indentée) ou `vx` n'a jamais été définie. Si `40.0`, `dt` était `1.0` — tu as passé le *nombre* de frames comme temps.

### 2.2 Les rebonds sur les murs

**👟 Indice de départ :** Ajoute des limites de canevas fixes (`W=30, H=10`) au `Sprite` ; dans `update`, borne la position et inverse la vitesse au contact.

```python
# main.py (continued)
class Sprite:
    W, H = 30, 10

    def __init__(self, ch, x, y, vx=0.0, vy=0.0):
        self.ch = ch
        self.x, self.y = float(x), float(y)
        self.vx, self.vy = float(vx), float(vy)

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.x = clamp(self.x, 0.0, self.W - 1)
        self.y = clamp(self.y, 0.0, self.H - 1)
        if self.x == 0.0 or self.x == self.W - 1:
            self.vx = -self.vx
        if self.y == 0.0 or self.y == self.H - 1:
            self.vy = -self.vy

b = Sprite("*", 15.0, 2.0, vy=2.0)
for step in range(8):
    b.update(0.125)
    if step in (4, 7):
        print("step", step + 1, "y =", round(b.y, 3), "vy =", b.vy)
```

Borner garde le sprite sur le canevas ; tester *l'égalité* avec `0.0` ou `W-1` inverse la vitesse exactement une fois par contact. Le `*` tombe de `y=2.0`, et parce qu'il parcourt `0.25` unités par frame, il atteint le sol (`y=9`) proprement et s'inverse pour monter.

**🎯 Résultat attendu :**

```
step 5 y = 3.25 vy = 2.0
step 8 y = 4.0 vy = 2.0
```

(Le rebond atterrit plus tard dans le déroulement — la scène de l'Étape 3 le montre.)

**🩹 Si ça ne marche pas :** Si `y` s'arrête à `9.0` pour toujours, `vy` s'inverse mais se ré-inverse *la frame suivante* — la vérification d'égalité se déclenche à chaque frame pendant que le sprite repose contre le mur. La position doit quitter le mur avant que la vérification ne se réarme (c'est le cas ici, parce que la vitesse s'inverse).

### 2.3 Vérifie le sprite

**✅ Liste de vérification**

- ✅ `Sprite("o", 0, 5, vx=4)` avance de `2.5` après cinq pas de `0.125`.
- ✅ Un sprite avec une `vx` négative se déplace vers la gauche et est borné à `x=0`.
- ✅ Au contact avec un mur, la vitesse s'inverse exactement une fois, et le sprite repart vers l'intérieur.

**🤔 Question(s) socratique(s)**

- Le sprite ne heurte que des murs, pas *d'autres* sprites. Quel test supplémentaire la collision entre deux sprites exige-t-elle que la collision murale n'exige pas — et entre `x == 0` et `abs(x - mur) < eps`, lequel voudrais-tu pour elle ?
- La position est un flottant ; le rendu colle aux cellules. Si la vitesse est `1` et `dt` est `0.125`, le point semble « sauter » toutes les 8 frames. Est-ce fluide ou saccadé à 8 fps — et quels deux boutons pourrais-tu tourner pour le rendre plus fluide ?

## Étape 3 : Les scènes et la boucle du moteur

Un sprite est un rebond. Beaucoup de sprites sur une grille, avancés ensemble à fréquence fixe, c'est une animation. L'Étape 3 ajoute la `Scene` (grille + sprites) et l'`Engine` (pilote à pas de temps fixe).

### 3.1 Rends une scène en texte

**👟 Indice de départ :** Écris `Scene.render()` qui retourne une liste de chaînes — une grille remplie de points avec chaque sprite tamponné à sa cellule (arrondie).

```python
# main.py (continued)
class Scene:
    def __init__(self, W=30, H=10):
        self.W, self.H = W, H
        self.sprites = []

    def add(self, sprite):
        sprite.W, sprite.H = self.W, self.H
        self.sprites.append(sprite)
        return self

    def step(self, dt):
        for sprite in self.sprites:
            sprite.update(dt)

    def render(self):
        grid = [["."] * self.W for _ in range(self.H)]
        for sprite in self.sprites:
            gx, gy = int(sprite.x + 0.5), int(sprite.y + 0.5)
            grid[gy][gx] = sprite.ch
        return ["".join(row) for row in grid]

scene = Scene()
scene.add(Sprite("o", 0.0, 5.0, vx=4.0))
print("\n".join(scene.render()))
```

`int(x + 0.5)` est le collage arrondi-demi-vers-le-haut : les flottants sur la limite d'un mur atterrissent sur la cellule la plus proche de façon déterministe. `Scene.add` assigne son propre `W`/`H` à chaque sprite pour que les limites de rebond correspondent toujours au canevas, quelle que soit la façon dont le sprite a été construit.

**🎯 Résultat attendu :**

```
..............................
..............................
..............................
..............................
..............................
o.............................
..............................
..............................
..............................
..............................
```

**🩹 Si ça ne marche pas :** Si `o` est ailleurs, son `y` n'est pas `5.0`. Si la grille montre 10 lignes de 30 points, la scène va bien — c'est le canevas vide.

### 3.2 Le moteur à pas de temps fixe

**👟 Indice de départ :** Écris `Engine(scene, fps=8)` dont `play(frames)` avance la scène par `dt = 1/fps` et retourne une liste de frames rendues.

```python
# main.py (continued)
class Engine:
    def __init__(self, scene, fps=8):
        self.scene = scene
        self.fps = fps
        self.dt = 1.0 / fps

    def play(self, frames):
        out = []
        for _ in range(frames):
            self.scene.step(self.dt)
            out.append(self.scene.render())
        return out

scene = Scene().add(Sprite("o", 0.0, 5.0, vx=4.0)).add(Sprite("*", 15.0, 2.0, vy=2.0))
frames = Engine(scene).play(12)
print("\n".join(frames[4]))
print("-" * 30)
print("\n".join(frames[11]))
```

`play` est toute la bobine : `fps` fixe `dt`, donc 8 frames = 1 seconde, et la même scène rejouée avec les mêmes paramètres produit les mêmes frames — un déterminisme que tu peux tester. La frame 5 est juste avant et la frame 12 est un moment marquant pour les deux sprites.

**🎯 Résultat attendu :** la frame 5 (`frames[4]`) montre `o` dans la colonne 3 (après `4 × 0.5 = 2.0 → 2.5 → colle à 3`) et `*` à la ligne 3 ; la frame 12 (`frames[11]`) montre `o` dans la colonne 6 et `*` à la ligne 5.

**🩹 Si ça ne marche pas :** Si les deux sprites se chevauchent dans une cellule inattendue, l'un d'eux a une contradiction de direction de vitesse. Si les frames reviennent périmées, `scene.step` mute une copie de la scène, pas le même objet.

### 3.3 Vérifie le moteur

**✅ Liste de vérification**

- ✅ `play(12)` avec la scène ci-dessus retourne 12 frames ; les frames 5 et 12 correspondent aux colonnes/lignes attendues.
- ✅ `Engine(scene, fps=8).dt == 0.125`.
- ✅ Exécuter `play` deux fois sur une scène fraîche produit des frames identiques octet par octet.

**🤔 Question(s) socratique(s)**

- `dt` est `1/fps`, mais la boucle avance la scène puis affiche. Une fois avancé, la frame 1 est-elle « l'état après 0.125s » ou « au temps 0 » ? Choisis la sémantique et défends le décalage d'un que tu as choisi.
- Le moteur retourne les frames comme liste, ne les affichant jamais. Pourquoi la *donnée* (les frames) est-elle le produit ici, et l'*écran* juste un consommateur — que ce découplage te permet-il de remplacer plus tard ?

## Étape 4 : Les chemins keyframés

La vitesse te donne des lignes droites et des rebonds. Les vraies animations découpent le mouvement en *keyframes* — des poses à des moments choisis — et remplissent l'entre-deux avec une interpolation adoucie. L'Étape 4 ajoute le suiveur de chemin.

### 4.1 Échantillonne le long d'un chemin

**👟 Indice de départ :** Écris `Keyframed(ch, keys)` où `keys` est une liste d'arrêts `(t, (x, y))` ; `sample(t)` trouve le segment contenant `t` et s'adoucit à travers lui.

```python
# main.py (continued)
class Keyframed:
    def __init__(self, ch, keys):
        self.ch = ch
        self.keys = keys
        self.x, self.y = keys[0][1]

    def sample(self, t):
        for i in range(len(self.keys) - 1):
            t0, p0 = self.keys[i]
            t1, p1 = self.keys[i + 1]
            if t0 <= t <= t1:
                u = smoothstep((t - t0) / (t1 - t0))
                self.x = lerp(p0[0], p1[0], u)
                self.y = lerp(p0[1], p1[1], u)
                return (self.x, self.y)
        return self.keys[-1][1]

node = Keyframed("A", [(0.0, (0, 0)), (1.0, (10, 2)), (2.0, (10, 8))])
print("t=0.5 ", node.sample(0.5))
print("t=1.0 ", node.sample(1.0))
print("t=2.0 ", node.sample(2.0))
```

Le balayage de segments trouve les deux keyframes qui encadrent `t`, remet `t` à l'échelle dans ce segment (`u`), adoucit `u`, et lerpe les deux coordonnées. Un chemin est une *donnée* — une liste de `(temps, position)` — et `sample` est la fonction pure qui transforme le temps en pose. Après `t=1.0`, l'itinéraire vire du déplacement vers la droite au déplacement vers le bas, et `sample` gère la passation.

**🎯 Résultat attendu :**

```
t=0.5  (5.0, 1.0)
t=1.0  (10.0, 2.0)
t=2.0  (10.0, 8.0)
```

**🩹 Si ça ne marche pas :** Si `t=0.5` retourne `(5.0, 0.0)`, le segment `y` a croisé des keyframes trop tôt. Si des échantillons après `t=2.0` échouent, `sample` retombe sur `self.keys[-1][1]` seulement quand la boucle ne trouve aucun segment — confirme que le temps de la dernière keyframe est `2.0`, pas `< 2.0`.

### 4.2 Rends un chemin comme une bobine

**👟 Indice de départ :** Boucle `t = 0 … 2` au `dt` du moteur, échantillonne le chemin, tamponne le nœud sur une grille fraîche, et collecte les frames.

```python
# main.py (continued)
frames = []
for f in range(17):
    _x, _y = node.sample(f * 0.125)
    grid = [["."] * 30 for _ in range(10)]
    grid[int(_y + 0.5)][int(_x + 0.5)] = node.ch
    frames.append(["".join(r) for r in grid])

print("\n".join(frames[0]))
print("-" * 30)
print("\n".join(frames[16]))
```

La frame 0 est la pose à `t=0` : `A` en haut à gauche. La frame 17 est `t=2.0` : `A` à la ligne 8, colonne 10. Parce que `sample` a adouci les deux segments, le nœud s'attarde aux coins et file dans les lignes droites.

**🎯 Résultat attendu :** la frame 0 a `A` en haut à gauche ; la frame 16 a `A` à la ligne 8 (sur 0–9), colonne 10.

**🩹 Si ça ne marche pas :** Si `A` ne quitte jamais le coin supérieur gauche, `sample` a été bouclé avec `t` comme index de frame au lieu de `f * dt`. S'il atterrit à `(10, 2)` et s'arrête, le temps de fin du second segment a dépassé la plage `t` de la boucle.

### 4.3 Vérifie le chemin

**✅ Liste de vérification**

- ✅ `sample(0.5)` sur le chemin à deux segments retourne `(5.0, 1.0)` — le point médian adouci du segment un.
- ✅ `sample(1.5)` se trouve sur le second segment (entre `(10, 2)` et `(10, 8)`).
- ✅ Échantillonner au-delà de la dernière keyframe retourne la pose finale, sans crash.

**🤔 Question(s) socratique(s)**

- Le chemin n'a pas de vitesses — seulement des temps et des poses. Pourquoi une keyframe pose-uniquement est-elle plus facile à produire qu'une keyframe vitesse-uniquement, et quel est le compromis pour un mouvement où tu *veux* une vitesse d'entrée en vol explicite ?
- Smoothstep est appliqué par segment, donc le nœud « s'adoucit » aux deux extrémités de tout l'itinéraire. Regarde le coin à `t=1.0` : se déplace-t-il *jamais* à vitesse maximale, et cela correspond-il à la façon dont une vraie caméra coupe entre des plans ?

## Étape 5 : Exporte la bobine

Une liste de grilles en mémoire, ça va ; un répertoire de frames numérotées, c'est un *livrable*. L'Étape 5 écrit les frames et les réassemble comme une pellicule.

### 5.1 Sauvegarde les frames dans des fichiers

**👟 Indice de départ :** Utilise `pathlib` pour écrire chaque frame comme `frame_000.txt`, complétée à trois chiffres, et retourne le compte.

```python
# main.py (continued)
import pathlib

def save_frames(frames, outdir):
    outdir = pathlib.Path(outdir)
    outdir.mkdir(exist_ok=True)
    for i, frame in enumerate(frames):
        (outdir / f"frame_{i:03d}.txt").write_text("\n".join(frame) + "\n")
    return len(frames)

count = save_frames(frames, "reel")
print("wrote", count, "files")
print(list(pathlib.Path("reel").glob("frame_*.txt"))[:3])
```

`f"frame_{i:03d}"` est le rembourrage de zéros qui fait que les fichiers se trient correctement (`frame_009` avant `frame_010`), donc tout glob ou `ls` reproduit l'ordre chronologique. Le compte retourné permet à un pipeline de vérifier l'écriture : 17 frames entrent, 17 fichiers sortent.

**🎯 Résultat attendu :**

```
wrote 17 files
[PosixPath('reel/frame_000.txt'), PosixPath('reel/frame_001.txt'), PosixPath('reel/frame_002.txt')]
```

**🩹 Si ça ne marche pas :** Si une seconde exécution dit « déjà 17 fichiers », `mkdir(exist_ok=True)` manque (ou d'anciens frames traînent et se doublent). Si le glob est vide, le répertoire de travail actuel diffère d'`outdir` — vérifie dans quel répertoire `save_frames` a réellement écrit.

### 5.2 Réassemble une pellicule

**👟 Indice de départ :** Écris `read_reel(outdir)` qui recharge les frames numérotées dans l'ordre et les concatène avec des séparateurs `|` pour qu'un coup d'œil montre le mouvement à travers le temps.

```python
# main.py (continued)
def read_reel(outdir):
    outdir = pathlib.Path(outdir)
    files = sorted(outdir.glob("frame_*.txt"))
    frames = [f.read_text().splitlines() for f in files]
    rows_in = len(frames[0])
    return ["   ".join(frames[i][row] for i in range(len(frames)))
            for row in range(rows_in)]

film = read_reel("reel")
print("\n".join(film))
```

La pellicule transpose les lignes : la ligne du haut de *chaque* frame sur la ligne 1, puis la ligne suivante de chaque frame sur la ligne 2 — donc une bobine de 17 frames se rend comme une large bande que tu peux faire défiler horizontalement et voir le point voyager de gauche à droite. `sorted` sur les noms complétés de zéros garantit l'ordre des frames sans logique de tri de ton cru.

**🎯 Résultat attendu :** Une pellicule de ~510 colonnes sur 10 lignes où un `A` glisse de l'extrême gauche à l'extrême droite à travers les segments, avec des séparateurs de style `.|` gardant les frames distinctes.

**🩹 Si ça ne marche pas :** Si les frames sortent dans le désordre, les fichiers ont été nommés sans le rembourrage de zéros et `sorted` a mis `frame_10` avant `frame_2`. Si chaque ligne de frame est mal alignée, `splitlines` a laissé tomber un saut de ligne de fin et la dernière ligne a été complétée de façon inégale.

### 5.3 Vérifie l'export

**✅ Liste de vérification**

- ✅ `save_frames` retourne 17 et écrit 17 fichiers nommés `frame_000.txt` … `frame_016.txt`.
- ✅ `read_reel` reproduit frames[0] et frames[16] exactement depuis le disque.
- ✅ Changer la vitesse d'un sprite change les fichiers de frame, prouvant que la bobine reflète l'état, pas un art codé en dur.

**🤔 Question(s) socratique(s)**

- La pellicule est une vue *tranche de temps*. Quelle information te montre-t-elle sur l'animation que l'empilement frame par frame cache — et quel idiome de mouvement (rotation, échelle) une bande 2D ligne-de-temps ne capturerait *jamais* ?
- L'export écrit des fichiers texte que tu pourrais donner à un outil non Python. Quel est l'« format d'échange ouvert » équivalent dans ton outil vidéo préféré, et quelle est la valeur de garder la sortie du moteur dans un format que rien d'autre dans ta pile n'a besoin de traduire ?

## ⚠️ Pièges courants

- **La division entière dans l'easing.** `t / (t1 - t0)` en Python 3 est flottant — mais `t // (t1 - t0)` ou des arguments tout-entiers tronquent silencieusement et gèlent ta courbe. Fournis des flottants aux fonctions d'aide mathématiques.
- **Arrondi-demi-vers-le-haut vs arrondi bancaire.** `int(x + 0.5)` arrondit toujours `.5` vers le haut ; `round(x)` en Python arrondit `.5` au pair, donc un sprite à `x=2.5` atterrit à `2` avec `round` et `3` avec `int(x+0.5)` — et la dérive des flottants rend cela non déterministe dans la nature. Choisis-en un et garde-le partout.
- **Des serrages de mur dos à dos.** Si la vérification de rebond utilise `>=`/`<=` sur la valeur *bornée* chaque frame, un sprite posé contre un mur inverse sa vitesse à chaque mise à jour et vibre pour toujours. Exige de *franchir* la limite ou vérifie la position avant serrage.
- **Le décalage d'un dans les frames.** `for f in range(17)` produit 17 frames à travers `t = 16×dt` ; pour couvrir `t=0` jusqu'à `t=2.0` inclus, il te faut 17 *pas*, pas 16. Décide si les frames comptent les pas de temps ou les frames d'horloge murale.
- **Des exports désordonnés.** Les noms de fichiers non complétés de zéros trient `frame_10` avant `frame_2`. Complète à une largeur fixe (`:03d`) ou la pellicule se mélange.
- **Muter la scène à l'intérieur de play.** `scene.step` doit changer l'état du sprite en place ; recréer la scène à chaque frame perd la vitesse et les rebonds pour toujours.

## Ce que tu viens de construire

Un moteur d'animation texte d'abord : des maths d'easing, des sprites pilotés par la vitesse avec des rebonds de mur, une boucle de rendu à pas de temps fixe, des chemins de mouvement keyframés et une bobine basée sur fichiers. L'idée essentielle est que le mouvement est *décidé par de petites fonctions composables* — `clamp` garde les limites, `lerp` voyage, `smoothstep` ajoute la personnalité, et une classe enveloppe chacune comme état. Cadre n'importe quel problème de mouvement comme « quel nombre adoucir, et vers quoi » et ces cinq pièces y répondent — la même forme pilote les transitions CSS, les déplacements de sprites dans les jeux et les travellings de caméra dans la vidéo.

:::tip[Exécute une version plus complète sans configuration locale]
[`examples/animation-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/animation-engine) dans le dépôt du cours est le moteur complet en notebook — les rebonds de sprites, le chemin keyframé adouci et l'export en pellicule, exécutables dans Colab/Kaggle/Binder. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute une couche `Time Warp` : au lieu d'un `dt` global, donne à chaque sprite son propre multiplicateur `speed` pour qu'un `*` dérive paresseusement pendant qu'un `o` file.
- Modélise un rebond élastique entre deux sprites — quand les sprites entrent en collision, échange les vitesses et ajoute une oscillation `vx` pour un effet écrasement-étirement.
- Étends `Keyframed` pour tenir une fonction d'easing par segment (linéaire pour la première jambe, smoothstep pour la seconde) comme partie des données de keyframe.
- Écris les frames comme images PPM (P6) et assemble-les en GIF avec un minuscule écrivain Python pur, ou envoie la pellicule dans le scrollback de ton terminal pour un « film ».

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier·e ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README contient un tutoriel complet, accessible aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, étape par étape. Aucune expérience git préalable n'est requise.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓