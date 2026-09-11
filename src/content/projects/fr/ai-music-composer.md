---
title: "Compositeur de Musique IA"
description: "Générez des mélodies, harmonies et arrangements musicaux originaux en utilisant l'apprentissage automatique."
difficulty: "advanced"
estimatedMinutes: 120
xpReward: 100
tags: ["Creative", "Audio", "Machine Learning"]
prerequisites:
  - "Bases de Python (listes, dicts, fonctions, boucles, random)"
  - "Une idée approximative des gammes occidentales et que le « do central » existe — aucune théorie musicale requise"
learningObjectives:
  - "Représenter les notes et les rythmes comme des nombres que la machine peut raisonner"
  - "Apprendre un modèle de transition à partir d'une mélodie de départ avec une chaîne de Markov"
  - "Générer une mélodie à variations graduelles qui respecte les statistiques de la graine"
  - "Dériver des accords de triade depuis les degrés de la gamme et les superposer comme accompagnement"
  - "Écrire un vrai fichier MIDI avec midiutil et le vérifier sur disque"
---


# 🛠️ 🎼 Construire un Compositeur de Musique IA

Composer une mélodie de rien est un problème de page blanche ; composer une *variation* d'une mélodie que tu aimes déjà est un problème statistique. Ce projet construit le deuxième type de compositeur : il lit une courte mélodie de départ, apprend comment chaque note a tendance à suivre la précédente, puis génère de nouvelles mélodies à partir de ce modèle appris, empile des accords en dessous, et exporte le résultat comme un vrai fichier MIDI — un fichier de chanson que tu peux ouvrir dans n'importe quel lecteur ou station de travail audio numérique. L'« IA » ici est élégante et honnête : une chaîne de Markov, qui n'est rien de plus que « d'après ce que j'ai entendu jusqu'ici, quelle note vient typiquement après ? ».

Cela suppose Python 101 et rien de l'Analyse de Données — et cela ne requiert aucune théorie musicale pour obtenir un résultat jouable, même si l'étape Harmonie aura bien plus de sens si tu fredonnes en même temps. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Modéliser la hauteur comme des numéros de note MIDI et le rythme comme des durées en temps — transformant la musique en une liste Python de nombres.
2. Construire une chaîne de Markov à partir d'une mélodie de départ et vérifier ce qu'elle a appris en lisant sa table de transition.
3. Générer une nouvelle mélodie de n'importe quelle longueur en parcourant cette chaîne.
4. Dériver des accords de triade depuis les degrés de la gamme et les placer sous la mélodie.
5. Exporter une pièce complète vers un vrai fichier `.mid` avec midiutil, et vérifier le fichier sur disque.

## Où exécuter ceci

**En local avec `uv`** est le chemin clairement recommandé — la sortie de ce projet est un fichier `.mid` sur ton propre disque que tu voudras ouvrir dans un lecteur local, et la dépendance (`midiutil`) est à un seul `uv add`.

**GitHub Codespaces** fonctionne bien aussi : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et chaque étape ci-dessous s'exécute sans changement ; le `.mid` généré est un artefact téléchargeable que tu peux récupérer depuis l'arborescence de fichiers.

**Google Colab, Kaggle Notebooks et Binder sont un moyen authentique d'exécuter chaque étape**, parce que le générateur lui-même est du Python pur plus une bibliothèque installable par pip (`!pip install midiutil`). L'avertissement honnête : le système de fichiers du notebook est éphémère, donc le `.mid` que tu exportes y vit — télécharge-le avant que la session ne se ferme. Il n'y a aussi aucune sortie audio dans un notebook, donc tu voudras quand même tirer le fichier en local pour réellement *entendre* le résultat.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-music-composer/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-music-composer/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-music-composer%2Fnotebook.fr.ipynb)

## Configuration

Tout ce qui est nécessaire avant la génération : un projet avec `midiutil`, et une ancre mentale pour ce que signifie un numéro de note MIDI.

### Mets en place le projet

```bash
uv init ai-music-composer
cd ai-music-composer
uv add midiutil
```

`midiutil` est une petite bibliothèque fiable qui transforme des objets Python en un fichier binaire `.mid` — le même format portable que chaque DAW, application de téléphone et lecteur multimédia peut ouvrir. Le compositeur lui-même n'en dépendra pas avant la dernière étape ; tout le reste est la bibliothèque standard de Python.

### Ancre-toi : note → nombre

**👟 Indice de départ :** Imprime un petit dictionnaire note-à-nombre pour que chaque nombre ultérieur de ce projet signifie quelque chose de musical au lieu d'être arbitraire.

```python
# composer.py
from collections import defaultdict
import random

NOTES = ["C", "D", "E", "F", "G", "A", "B"]
SEMITONES = [0, 2, 4, 5, 7, 9, 11]  # semitones of the major scale steps

MIDI: dict[str, int] = {}
for octave in range(3, 6):
    for i, name in enumerate(NOTES):
        MIDI[f"{name}{octave}"] = 60 + 12 * (octave - 4) + SEMITONES[i]

print(MIDI["C4"], MIDI["E4"], MIDI["A4"])
```

Les numéros MIDI sont des demi-tons comptés depuis le bas du clavier, et le do central est `60`. Construire la table depuis les étapes de la gamme majeure `[0, 2, 4, 5, 7, 9, 11]` — c'est ton-ton-demi-ton-ton-ton-ton-demi-ton, le même pattern que les touches blanches d'un piano — signifie que chaque nom de la table est une *classe de hauteur légale en do majeur* dès le départ.

**✅ Liste de vérification**

- ✅ `uv add midiutil` se termine sans erreurs.
- ✅ `MIDI["C4"]` imprime `60`, `MIDI["E4"]` imprime `64`, et `MIDI["A4"]` imprime `69`.
- ✅ `composer.py` tient la table note-nombre et les deux imports de la bibliothèque standard en haut.

## Étape 1 : Transforme une mélodie en nombres

Une partition est de la prose ; une chaîne de Markov a besoin de données. Cette étape convertit une petite mélodie de départ — que tu pourrais fredonner — en une liste plate de numéros MIDI, et présente le point de vue « une note suit une autre » sur lequel tout le compositeur est construit.

### 1.1 Écris la graine comme une liste de valeurs MIDI

**👟 Indice de départ :** Transcris la graine classique `C4 D4 E4 D4 C4 E4 F4 G4 A4 G4 F4 E4 D4 C4` (la première phrase d'une berceuse) en une liste des nombres de ta table `MIDI`.

```python
# composer.py (continued)
SEED = [MIDI["C4"], MIDI["D4"], MIDI["E4"], MIDI["D4"], MIDI["C4"], MIDI["E4"],
        MIDI["F4"], MIDI["G4"], MIDI["A4"], MIDI["G4"], MIDI["F4"], MIDI["E4"],
        MIDI["D4"], MIDI["C4"]]

print(SEED)
```

Une mélodie est une séquence, et les séquences sont l'entrée à partir de laquelle les chaînes de Markov sont construites. Faire de la graine une liste de *nombres* plutôt que de noms de notes est l'abstraction centrale : le générateur n'a jamais besoin de savoir à quoi « ressemble » `64`, seulement qu'il suit souvent `62`.

**🎯 Résultat attendu :** `[60, 62, 64, 62, 60, 64, 65, 67, 69, 67, 65, 64, 62, 60]` — 14 notes, commençant et se terminant sur `60`.

**🩹 Si ça ne marche pas :** Si un nombre semble faux, vérifie l'octave dans la construction de la table `MIDI` (un `C4` autre que `60` signifie que le décalage `(octave - 4)` est faux). Si la liste a des problèmes de longueur, compte les crochets — le retour à la ligne ci-dessus ne doit ni ajouter ni laisser tomber une valeur.

### 1.2 Divise la mélodie en observations

**👟 Indice de départ :** Apparie chaque note avec son successeur — `zip(SEED, SEED[1:])` — et confirme que les observations se lisent comme note → note.

```python
# composer.py (continued)
observations = list(zip(SEED, SEED[1:]))
print(observations[:4])
print("made", len(observations), "pairs from", len(SEED), "notes")
```

`zip(a, a[1:])` est le pattern qui sépare toute séquence en paires adjacentes — note qu'il produit exactement `len(SEED) - 1` paires, parce que la note finale n'a pas de successeur. Chaque paire est une unité de « grammaire » musicale : *étant donné 62, j'ai observé 64.*

**🎯 Résultat attendu :** `[(60, 62), (62, 64), (64, 62), (62, 60)]` et le compte `made 13 pairs from 14 notes`.

**🩹 Si ça ne marche pas :** Si les paires montrent des valeurs qui ne sont pas dans `SEED`, tu as zipé la mauvaise structure (`SEED[:-1]` et `SEED[1:]` est l'orthographe plus sûre qu'une tranche mixte). Si le nombre de paires égale le nombre de notes, une tranche a été inversée — il doit y avoir *une paire de moins* que de notes.

### 1.3 Vérifie l'encodage numérique

**✅ Liste de vérification**

- ✅ Les 14 notes de la graine produisent 13 paires adjacentes.
- ✅ Le deuxième élément de chaque paire est la note *suivante* dans la graine d'origine.
- ✅ Tu peux retraduire `SEED[5]` en nom de note à la main sans exécuter de code.

**🤔 Question(s) socratique(s)**

- La graine est en do majeur et chaque valeur reste dans un octave. Qu'est-ce qui change dans les paires d'observation si tu transposes toute la graine d'un octave plus haut — la structure, ou juste les nombres ? Qu'est-ce que cela dit de là où vit la « musique » ?
- `zip` apparie des notes strictement adjacentes, ignorant combien de temps chaque note tient. Quelle qualité musicale réelle — la forme de la phrase, par exemple — est invisible pour ce modèle, et où dans ce projet penses-tu qu'elle apparaîtra en premier ?

## Étape 2 : Apprends la chaîne de Markov

Une chaîne de Markov répond à une question par note : « étant donné la note actuelle, que disent les données qui vient probablement ensuite ? » La version du compositeur stocke chaque successeur observé pour chaque note dans un `defaultdict` de listes — bon marché, transparent et inspectable, exactement comme une table de fréquences que tu peux lire.

### 2.1 Construis la table de transition

**👟 Indice de départ :** Écris `build_chain(sequence)` qui retourne `{note: [successors]}` en utilisant un `defaultdict(list)`, puis imprime la ligne pour une note.

```python
# composer.py (continued)
from collections import defaultdict

def build_chain(sequence: list[int]) -> dict[int, list[int]]:
    chain: dict[int, list[int]] = defaultdict(list)
    for current, nxt in zip(sequence, sequence[1:]):
        chain[current].append(nxt)
    return chain

chain = build_chain(SEED)
print("after 64:", chain[64])
```

`chain[current].append(nxt)` dit « quand j'ai vu `current` la dernière fois, cette fois-ci il était suivi de `nxt` ». Itérer sur les paires une fois construit tout le modèle — la table est, en effet, une distribution de fréquences par note, et `defaultdict(list)` signifie que tu n'as jamais à traiter spécialement une note qui apparaît pour la première fois.

**🎯 Résultat attendu :** `after 64: [62, 65, 62]` — le `64` de la graine a été suivi de `62` une première fois près du début, de `65` dans la montée vers le sommet, et de `62` de nouveau dans la descente.

**🩹 Si ça ne marche pas :** Si la ligne est `[]` ou manquante, `64` n'est jamais apparu comme note *courante* — vérifie que tu construis depuis `SEED`, pas depuis une liste vide. Si une ligne liste des successeurs dramatiquement faux, le `zip` dans `build_chain` apparie les mauvais voisins — imprime `list(zip(sequence, sequence[1:]))[:3]` et compare à la graine.

### 2.2 Ajoute du hasard avec une graine aléatoire

**👟 Indice de départ :** Complète `generate_melody(chain, start, length)` — parcours la chaîne, et quand une note n'a pas de successeur enregistré, retombe sur la note de départ au lieu de planter.

```python
# composer.py (continued)
def generate_melody(chain: dict[int, list[int]], start: int, length: int) -> list[int]:
    melody = [start]
    current = start
    for _ in range(length - 1):
        successors = chain[current]
        current = random.choice(successors) if successors else start
        melody.append(current)
    return melody

random.seed(7)
print(generate_melody(chain, MIDI["C4"], 8))
```

`random.choice` est ce qui fait de chaque exécution un *compositeur* au lieu d'un enregistreur — la chaîne donne l'alphabet (quelles notes peuvent suivre), et le hasard choisit à l'intérieur. Le repli `if successors else start` est la soupape de sécurité pour les notes qui n'ont fait que terminer des phrases (comme le `C4` final, qui n'a pas de successeur dans la graine).

**🎯 Résultat attendu :** Une liste de longueur 8 commençant à `60`, dont les éléments ultérieurs sont tous tirés des réservoirs de successeurs de `chain` — avec `random.seed(7)` la sortie de ce projet est reproductible, mais change la graine et la mélodie change légitimement.

**🩹 Si ça ne marche pas :** Si `KeyError: ...` apparaît, une note a atteint la fin de la mélodie sans repli — la clause `else start` est manquante ou est sautée parce que tu as indexé `chain[current]` avec `[]` au lieu de `.get`. Si la sortie ne quitte jamais une note, `successors` se résout constamment en liste vide, ce qui signifie que la chaîne est construite depuis la mauvaise entrée.

### 2.3 Vérifie que le modèle a vraiment appris

**✅ Liste de vérification**

- ✅ `build_chain(SEED)` produit une ligne par note distincte, chaque ligne listant seulement les notes qui l'ont réellement suivi dans la graine.
- ✅ `generate_melody` s'exécute avec une graine aléatoire fixée et de façon répétée avec des graines variables.
- ✅ Chaque note générée est une note que la chaîne *pourrait* légitimement produire, jamais une hauteur inventée.

**🤔 Question(s) socratique(s)**

- La chaîne n'avance jamais que d'une note — elle n'a pas de mémoire de « il y a deux notes ». Quelle texture musicale serait visible pour une chaîne de *second ordre* (clé sur les paires) à laquelle la chaîne actuelle est aveugle ?
- `random.seed(7)` rend la sortie reproductible. Quel est le *danger* d'un compositeur qui prétend que chaque exécution doit différer — et que t'apporte la reproductibilité quand tu essaies de corriger une mélodie que tu avais aimée lors d'une exécution précédente ?

## Étape 3 : Donne un rythme à la mélodie

La chaîne produit jusqu'ici un flot de hauteurs sans timing. Cette étape apparie chaque hauteur avec une durée en temps, pour que la pièce cesse d'être une rafale de notes égales et devienne une phrase qu'un humain pourrait suivre en tapant du pied.

### 3.1 Modélise le rythme comme des durées en temps

**👟 Indice de départ :** Définis une annotation rythmique comme une liste de longueurs de temps — par exemple un pattern noire, noire, croche, croche — et une aide pour zip les hauteurs avec les durées en événements de note.

```python
# composer.py (continued)
def make_phrase(melody: list[int], durations: list[float]) -> list[tuple[int, float]]:
    return list(zip(melody, durations))

phrase = make_phrase(SEED, [1.0, 1.0, 0.5, 0.5, 1.0, 1.0, 1.0, 1.0,
                            0.5, 0.5, 1.0, 1.0, 1.0, 2.0])
print(phrase[:3])
print("phrase spans", sum(d for _n, d in phrase), "beats")
```

Les durées se mesurent en temps, l'unité que les fichiers MIDI stockent réellement : `0.5` est une croche, `1.0` une noire, `2.0` une blanche. `zip` reconstruit une mélodie en liste d'événements `(hauteur, temps)` sans toucher à la génération de hauteurs, et la `sum` de toutes les durées répond directement à la question évidente du compositeur — « combien de temps dure cette phrase ? ».

**🎯 Résultat attendu :** `[(60, 1.0), (62, 1.0), (64, 0.5)]` et `phrase spans 13.0 beats` (la dernière note tenue sur 2 temps pleins).

**🩹 Si ça ne marche pas :** Si la phrase a un nombre d'éléments différent de la mélodie, la liste des durées a une longueur différente — `zip` tronque silencieusement vers la plus courte, donc asserte `len(durations) >= len(melody)` tôt ou la queue de la mélodie disparaît. Si la somme semble fausse, vérifie que la durée finale `2.0` a réellement atterri sur la dernière note.

### 3.2 Boucle la phrase en structure de chanson

**👟 Indice de départ :** Répète la phrase quelques fois et réifie un compte entier de mesures de chanson, pour que l'étape d'export ait une longueur réelle à écrire.

```python
# composer.py (continued)
def make_song(phrase: list[tuple[int, float]], repeats: int, chain, start: int) -> list[tuple[int, float]]:
    song: list[tuple[int, float]] = []
    for _ in range(repeats):
        melody = generate_melody(chain, start, len(phrase))
        song.extend(make_phrase(melody, [d for _n, d in phrase]))
    return song

song = make_song(phrase, 4, chain, MIDI["C4"])
print(len(song), "notes =", sum(d for _n, d in song), "beats")
```

Réutiliser le même squelette rythmique pour chaque répétition est le moyen classique d'obtenir de la variété structurelle à bon marché : le *timing* reste reconnaissable pendant que la chaîne varie les hauteurs. Étendre la chanson note par note avec `list.extend` garde le total de temps exact — répétée quatre fois, une phrase de 13 temps fait exactement 52 temps.

**🎯 Résultat attendu :** `52 notes = 52.0 beats` — quatre copies de la phrase l'une derrière l'autre, chacune avec des hauteurs fraîchement générées (mais légales pour la chaîne).

**🩹 Si ça ne marche pas :** Si la chanson fait 14 notes au lieu de 56, le corps de boucle construit une phrase puis sort — vérifie `extend`, pas `append`, pour accumuler au lieu de remplacer. Si les temps dérivent vers 51 ou 53, une mélodie générée a retourné une longueur différente de `len(phrase)` et un `zip` a tronqué tôt.

### 3.3 Vérifie le rythme

**✅ Liste de vérification**

- ✅ Les phrases apparient les hauteurs avec des durées en temps, et les sommes de durées sont exactes.
- ✅ Les chansons multi-phrases répètent le squelette rythmique tout en laissant la chaîne de mélodie varier.
- ✅ Tu peux prédire le nombre total de temps d'une chanson depuis sa phrase et son compte de répétitions.

**🤔 Question(s) socratique(s)**

- Chaque répétition relance `generate_melody` avec le même `len(phrase)`. Qu'arrive-t-il à la *longueur* de la chanson si une mélodie génère jamais une note de plus que la phrase — et pourquoi `zip` avec un rythme fixe masque-t-il complètement ce bug ?
- Le rythme est actuellement codé en dur comme celui de la graine. Quelle note de `phrase` t'attendrais-tu à voir sur des temps forts versus des temps faibles, et quel effet compositionnel cette emphase a-t-elle sur une phrase qui *démarre* sur la note de levée `D4` ?

## Étape 4 : Empile des accords en dessous

Une mélodie seule est une esquisse ; la pièce obtient son corps de l'harmonie. Cette étape dérive des triades de la gamme majeure — chaque accord est les 1er, 3e et 5e degrés de la gamme au-dessus d'une fondamentale — et les superpose sous la mélodie pour que toute la pièce se lise comme une chanson, pas comme une onde.

### 4.1 Construis des triades depuis les degrés de la gamme

**👟 Indice de départ :** Définis `scale` comme une liste de hauteurs sur deux octaves, et `triad(degree)` comme `[scale[d], scale[d+2], scale[d+4]]` pour que l'accord « monte le long des touches blanches ».

```python
# composer.py (continued)
SCALE = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83]  # C4 up to B5

def triad(degree: int) -> list[int]:
    return [SCALE[degree], SCALE[degree + 2], SCALE[degree + 4]]

print(triad(0), triad(5), triad(3), triad(4))
```

`SCALE` couvre deux octaves pleines précisément pour que `degree + 4` reste légal pour chaque degré — aucun livre de comptes de bouclage d'octave nécessaire. Empiler trois étapes de gamme en sautant une produit la pile classique de tierces : `C` (`60,64,67`), `Am` (`69,72,76`), `F` (`65,69,72`), `G` (`67,71,74`). Une liste sur un seul octave tronquerait les accords hauts comme `Am` d'un octave trop bas, donc le second octave est ce qui rend l'harmonie réelle.

**🎯 Résultat attendu :** `[60, 64, 67]`, `[69, 72, 76]`, `[65, 69, 72]`, `[67, 71, 74]` — les triades C, la mineur, F et G de do majeur.

**🩹 Si ça ne marche pas :** Vérifie une triade qui semble fausse en comptant les demi-tons depuis la fondamentale — `Am` doit être `69, 72, 76` (la–do–mi). Si chaque accord atterrit dans l'octave *basse* comme `[69, 60, 64]`, `SCALE` est la liste en un seul octave de 7 entrées, donc `degree + 2` et `degree + 4` ont débordé hors de portée. Si chaque accord est petit comme `[60, 62, 64]`, tu as indexé `[d, d+1, d+2]` au lieu de sauter à chaque autre étape de la gamme.

### 4.2 Écris une progression d'accords qui s'adapte à la pièce

**👟 Indice de départ :** Choisis une courte progression de degrés — la classique `I–vi–IV–V` = degrés `[0, 5, 3, 4]` — et étends-la sur les phrases répétées de la chanson, un accord toutes les deux temps.

```python
# composer.py (continued)
def chord_schedule(song: list[tuple[int, float]], progression: list[int]) -> list[list[int]]:
    chords: list[list[int]] = []
    beat = 0.0
    for _n, dur in song:
        degree = progression[int(beat) // 2 % len(progression)]
        chords.append(triad(degree))
        beat += dur
    return chords

chords = chord_schedule(song, [0, 5, 3, 4])
print(chords[0], chords[2], chords[28], chords[55])
```

`int(beat) // 2` découpe la chanson en fenêtres de 2 temps — chaque fenêtre porte un accord, et le `% len(progression)` boucle la progression sur la longueur de la chanson. Le résultat est des étiquettes d'accord par note, ce qui est exactement ce que l'exportateur MIDI consommera à l'Étape 5. Note la simplification honnête : un vrai arrangement tient un accord par *mesure*, ce projet en tient un toutes les deux temps, et la différence est audiblement acceptable pour une pièce d'apprentissage.

**🎯 Résultat attendu :** `chords[0]` est la triade C `[60, 64, 67]`, `chords[2]` (qui démarre au temps 2.0, fenêtre 1) est `Am` `[69, 72, 76]`, `chords[5]` (démarre au temps 4.0, fenêtre 2) est `F` `[65, 69, 72]`, et `chords[8]` (démarre au temps 7.0, fenêtre 3) est `G` `[67, 71, 74]` — le retour complet I–vi–IV–V dans la première phrase de la chanson.

**🩹 Si ça ne marche pas :** Si un index d'accord imprime une triade en dehors des quatre de la progression, le bouclage `% len(progression)` ou la fenêtrage `// 2` est faux — recalcule à la main pour une entrée : `chords[8]` démarre au temps 7.0, donc `int(7.0) // 2 = 3`, `3 % 4 = 3`, degré `4`, triade `G`. Si tous les accords sont identiques, `progression` a été passé comme une liste à un élément.

### 4.3 Vérifie l'harmonie

**✅ Liste de vérification**

- ✅ Chaque degré produit une triade de trois notes empilées sur une tierce d'écart.
- ✅ La progression `[0, 5, 3, 4]` boucle proprement sur toute la chanson.
- ✅ Chaque note de la chanson a un accord assigné sans trous.

**🤔 Question(s) socratique(s)**

- L'accord suit une fenêtre fixe de 2 temps quelle que soit l'activité de la mélodie. Où dans `chord_schedule` injecterais-tu « ne change réellement l'accord que quand la mélodie atterrit sur un temps fort » — et quelle congestion musicale cela corrige-t-il ?
- Les quatre accords viennent d'une seule gamme majeure, donc chaque accord est « dans la tonalité ». Si tu autorisais un accord *emprunté* (une note accidentelle en dehors de `SCALE`), où le modèle de l'Étape 2 s'effondrerait-il silencieusement, et pourquoi l'écrivain MIDI ne se plaindrait-il pas ?

## Étape 5 : Exporte vers un vrai fichier MIDI

Tout ce qui précède vit dans des listes Python. Cette étape les écrit dans un fichier `.mid` réellement jouable avec `midiutil`, en utilisant deux pistes — mélodie puis harmonie — et vérifie le fichier sur disque pour que tu saches que l'export a fonctionné sans avoir à entendre une note.

### 5.1 Pose la chanson en événements MIDI

**👟 Indice de départ :** Écris `write_midi(song, chords, filename)` avec un `addTempo`, une piste de mélodie au temps 0, et une piste d'accords qui démarre légèrement plus tard pour ne pas chevaucher la levée.

```python
# composer.py (continued)
import os
from midiutil import MIDIFile

def write_midi(song: list[tuple[int, float]], chords: list[list[int]], filename: str = "song.mid") -> None:
    midi = MIDIFile(2)  # tracks 0 and 1: melody and chords
    tempo, volume = 120, 96

    melody_time = 0.0
    for note, dur in song:
        midi.addNote(0, 0, note, melody_time, dur, volume)
        melody_time += dur

    chord_time = 0.0
    for chord in chords:
        for note in chord:
            midi.addNote(1, 0, note, chord_time, 2.0, 48)
        chord_time += 2.0

    with open(filename, "wb") as f:
        midi.writeFile(f)

write_midi(song, chords, "song.mid")
print("wrote song.mid in", os.path.getsize("song.mid"), "bytes")
```

`MIDIFile(2)` crée les pistes `0` et `1` — la mélodie sur 0, les accords sur 1 — et `addTempo(0, 0, 120)` épingle l'événement de tempo sur la même piste de tête. Un caprice qui vaut la peine d'être connu : au format 1, le compte de pistes de l'en-tête est *`numTracks + 1`* parce que midiutil compte toujours une première piste de tempo, donc le fichier lui-même signalera `3` pistes même si le constructeur a dit `2` — le vérificateur en 5.2 confirmera exactement cela. `addNote(track, channel, pitch, time, duration, volume)` est ensuite toute la surface de traduction : hauteur, temps de départ et longueur en temps se mappent un-pour-un depuis les structures de données antérieures. Un volume d'accords plus faible (`48` contre le `96` de la mélodie) est la décision de mixage qui empêche une pièce d'apprentissage de se transformer en bruit, et écrire les octets avec `writeFile` vers un objet fichier ouvert est tout l'export.

**🎯 Résultat attendu :** `wrote song.mid in <quelques milliers> bytes`, et le fichier existe dans le dossier du projet, ouvrable par n'importe quel lecteur ou DAW compatible MIDI.

**🩹 Si ça ne marche pas :** Si `FileNotFoundError` ou un fichier vide apparaît, le chemin d'écriture est faux ou `writeFile` n'a jamais tourné — confirme que le contexte `open(..., "wb")` est le *seul* endroit qui écrit. Si un lecteur signale un fichier corrompu, un temps de note est parti en arrière (un `+=` cumulatif a été abandonné) et la ligne de temps de la piste est cassée.

### 5.2 Vérifie que le fichier est vraiment une chanson

**👟 Indice de départ :** Jette un œil dans les octets bruts du `.mid` — la magie d'en-tête `MThd`, le champ du compte de pistes de l'en-tête, et le compte des octets de statut note-on — pour confirmer que l'export est un vrai fichier MIDI structuré et non des octets aléatoires déguisés en extension `.mid`.

```python
# composer.py (continued)
def verify(midi_path: str = "song.mid") -> None:
    with open(midi_path, "rb") as f:
        data = f.read()
    n_tracks = int.from_bytes(data[10:12], "big")  # 'ntrks' header field
    note_ons = sum(1 for byte in data if (byte & 0xF0) == 0x90)
    print("is a MIDI file:", data[:4] == b"MThd")
    print("track count (header):", n_tracks)
    print("note-on events:", note_ons)

verify()
```

Chaque fichier MIDI standard s'ouvre avec la magie de 4 octets `MThd`, donc `data[:4]` est la vérification unique qui sépare un vrai `.mid` d'un fichier texte renommé. Le MIDI est un protocole au niveau des octets : un octet de statut dans la plage `0x90–0x9F` *est* un message note-on, donc scanner `data` avec `(byte & 0xF0) == 0x90` compte exactement les notes que tu as écrites. Les octets 10–12 de l'en-tête sont le compte de pistes, qui se lit `3` parce que le format 1 compte une piste de tempo de tête par-dessus tes deux (`numTracks + 1`).

**🎯 Résultat attendu :** `is a MIDI file: True`, `track count (header): 3` (tempo + mélodie + accords), et `note-on events: 224` — `len(song)` pour la mélodie plus `3 * len(chords)` pour les accords (56 + 168).

**🩹 Si ça ne marche pas :** Si la vérification d'en-tête échoue, le fichier n'est pas un fichier MIDI — vérifie ce qui a été écrit sous ce nom. Si `note-on events` est court, des notes d'accords ou de mélodie ont été abandonnées au moment de l'écriture ; s'il est *plus long* que prévu, un octet `0x90`-comme-statut s'est glissé depuis un événement tempo ou changement de programme et le compte de pistes de l'en-tête est la vérité terrain la plus fiable. Si le compte de pistes n'est pas `3`, l'export a utilisé une taille de `MIDIFile(...)` différente de celle que le lecteur suppose.

### 5.3 Vérifie l'export

**✅ Liste de vérification**

- ✅ `song.mid` existe, démarre avec `MThd`, signale 3 pistes dans son en-tête, et se scanne jusqu'aux 224 événements note-on attendus.
- ✅ La piste de mélodie et la piste d'accords sont séparées — et leurs comptes d'événements correspondent aux structures que les Étape 3 et Étape 4 ont produites.
- ✅ L'étendue en temps de la mélodie égale le total de temps calculé de la chanson.

**🤔 Question(s) socratique(s)**

- La spec MIDI stocke le temps en *ticks par noire* ; midiutil choisit une résolution pour toi. Quel changement côté import — la résolution de ticks d'un DAW différent, par exemple — pourrait faire paraître le tempo d'une pièce faux alors même que `addTempo` dit 120 ?
- 224 événements de note, c'est beaucoup d'écritures pour des données réglées à la main. Comment la fonction `chord_schedule` changerait-elle si tu voulais *omettre* entièrement la piste d'accords pour une ligne solo — et qu'est-ce que ta réponse révèle sur le couplage des deux pistes au moment de `write_midi` ?

## ⚠️ Pièges courants

- **Oublier que la note 60 est le do central.** Construire la table `MIDI` avec un mauvais décalage `(octave - 4)` produit un compositeur parfaitement légal qui écrit tout un octave trop haut ou trop bas — et le MIDI ne se plaindra pas, seules tes oreilles le feront.
- **`zip` qui tronque silencieusement.** `make_phrase(melody, durations)` avec des longueurs inadaptées laisse tomber des notes sans erreur. Ajoute une vérification de longueur explicite quand tu apprends au compositeur à apparier des hauteurs avec du timing.
- **Une chaîne sans repli pour les notes finales.** Le `C4` final de la graine n'a pas de successeur ; sans `if successors else start`, le générateur lève `KeyError` sur la mélodie même qu'il est censé étendre.
- **Fenêtres d'accords qui se chevauchent.** Si un accord reçoit une durée plus longue que sa fenêtre de 2 temps, les événements d'accord empiètent sur la fenêtre suivante et la pièce se transforme en bouillie — garde la durée d'accord un multiple exact de la taille de fenêtre.
- **Exporter sans vérifier l'en-tête.** Un `.mid` qui n'est pas vraiment un fichier MIDI (`MThd` manquant) aura l'air « terminé » dans l'arborescence et échouera partout ailleurs. La vérification de l'en-tête de quatre octets est la seule vérification bon marché qui l'attrape.

## Ce que tu viens de construire

Un compositeur statistique fonctionnel : il convertit une mélodie fredonnée en nombres, apprend un modèle de Markov des transitions note-à-note, génère des variations légales, pose une progression d'accords en dessous, et écrit toute la pièce vers un vrai fichier MIDI que tu peux ouvrir et écouter. La compétence transférable survit à la chanson : modéliser les séquences comme des observations de fréquence, générer à l'intérieur de ce que tu as observé, et garder le modèle assez petit pour être *lu* — ce pattern se transfère au texte, aux gestes, aux flux de capteurs, et à toute autre donnée qui se déploie dans le temps.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/ai-music-composer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-music-composer) dans le dépôt du cours est tout le compositeur en notebook, de la graine à un `song.mid` téléchargeable. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Passe à une chaîne de *second ordre* clé sur les paires `(current, previous)` — `chain[(60, 62)]` — et entends comment les mélodies gagnent des phrases qui se répètent réellement au lieu d'errer.
- Ajoute un drapeau CLI de contrôle de tempo (`--tempo 90`) et un argument `--degree-progression "0 5 3 4"` pour que le même code écrive des pièces de type valse ou entraînantes sans modifications.
- Étends le modèle de rythme à une chaîne de Markov sur les durées aussi, pour que le générateur choisisse *quand* une note démarre autant que quelle hauteur elle a.
- Exporte une ligne de basse un octave sous les fondamentales d'accords, puis superpose les trois pistes — le premier arrangement réellement multi-texturé que ce pipeline peut produire.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓