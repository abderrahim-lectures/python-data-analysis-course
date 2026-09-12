---
title: "Listes et tuples"
description: "Maîtrisez les séquences ordonnées de Python, les listes mutables et les tuples immuables."
module: "data-structures"
order: 15
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Créer et accéder à des listes et des tuples"
  - "Utiliser les méthodes de liste : append, extend, pop, sort, reverse"
  - "Comprendre l'immuabilité des tuples et quand utiliser les tuples"
  - "Déballer des séquences avec l'affectation et *rest"
prerequisites: ["14-string-slicing"]
tags: ["listes", "tuples", "append", "sort", "déballage"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## La séquence ordonnée et éditable

Une liste est une séquence que vous pouvez allonger, raccourcir et réarranger. L'accès obéit à tout ce que le tranchage vous a appris :

```python
fruits = ["apple", "banana", "cherry"]
print(fruits[0])       # apple
print(fruits[-1])      # cherry
print(fruits[0:2])     # ['apple', 'banana']
```

Indexer depuis $0$, indices négatifs comptant en arrière, tranches prenant des fenêtres, les trois mêmes compétences, désormais braquées sur une collection d'objets quelconques. Là où une chaîne était figée, la liste est de l'argile.

## La boîte à outils de la liste

Les méthodes sont un atelier d'éditions :

```python
nums = [3, 1, 4, 1, 5]
nums.append(9)       # [3, 1, 4, 1, 5, 9]
nums.insert(0, 0)    # [0, 3, 1, 4, 1, 5, 9]
nums.extend([2, 6])  # [0, 3, 1, 4, 1, 5, 9, 2, 6]
nums.pop()           # retire 9 et le renvoie
nums.remove(1)       # retire le premier 1
nums.sort()          # trie sur place
nums.reverse()       # inverse sur place
len(nums)            # longueur actuelle
```

`append` ajoute un élément à la fin ; `extend` verse toute une séquence ; `insert` en glisse un à une position choisie. `pop` retire de la fin (ou d'un indice donné) et vous tend la valeur retirée ; `remove` supprime le premier élément correspondant. La liste est le cousin mutable de chevaux de trait comme le développement décimal de $\pi$, une corde croissante de valeurs que vous ne cessez d'éditer.

## Listes de listes : tableaux et matrices

Les éléments d'une liste peuvent eux-mêmes être des listes, ce qui transforme une séquence plate en tableau, une matrice est une liste de lignes, et chaque ligne est une liste de nombres :

```python
matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]
print(matrix[1][2])     # 6  — ligne 1, colonne 2
print(matrix[1])        # [4, 5, 6]
```

`matrix[1]` choisit la deuxième ligne ; ajouter `[2]` descend dans cette ligne et en choisit le troisième élément. Deux indices adressent une cellule exactement comme l'indice $M_{1,2}$ nomme une entrée de matrice sur papier. Le même truc construit des grilles, des plateaux de jeu et des lignes de tableur.

## Mutation contre nouvelle liste : une fourche qui mord

Voici un décalage qui meurtrit les débutants. **Certaines méthodes mutent la liste et renvoient `None` ; d'autres renvoient une liste fraîche et laissent l'originale intacte.** La voix d'une méthode ne vous dit pas laquelle :

```python
nums = [3, 1, 2]
result = nums.sort()   # result est None ! nums est désormais [1, 2, 3]
result = sorted(nums)  # result est [1, 2, 3], nums inchangée
```

`nums.sort()` réordonne sur place et ne renvoie rien, la valeur de votre expression est `None`. `sorted(nums)` calcule une nouvelle liste ordonnée et laisse `nums` intacte. Le nom est le signal : les verbes comme `sort` et `reverse` touchent l'objet ; `sorted` et `list.copy()` produisent une copie pour un nouveau possesseur.

## Tuples : la séquence gelée

Un tuple est une séquence ordonnée, **immuable**, une liste qui a perdu ses outils d'édition :

```python
point = (3, 4)
print(point[0])   # 3
# point[0] = 5   # TypeError !
```

L'immuabilité n'est pas un handicap ; c'est une promesse. Le point $(3, 4)$ est un unique objet mathématique qui ne doit pas changer sous vos pieds. Les coordonnées, les couleurs RGB, les lignes de base de données, des données *fixées par définition* appartiennent aux tuples, où la réassignation accidentelle devient une exception au lieu d'une corruption silencieuse.

## Déballage : une ligne, beaucoup de noms

Une séquence peut se replier en plusieurs variables en une seule affectation. Python recueille même le surplus avec un nom étoilé :

```python
x, y = (3, 4)         # x=3, y=4
a, b, *rest = [1, 2, 3, 4, 5]  # a=1, b=2, rest=[3, 4, 5]
first, *_, last = (1, 2, 3, 4)  # first=1, last=4
```

`*rest` avale tout ce qui se trouve entre les fentes nommées ; `*_` est le même geste portant le nom conventionnel de « jette ceci ». C'est la version liste d'évaluer une fonction en un point, les entrées et les sorties s'alignent par position.

## Un exemple travaillé : le carnet de notes

Voyez la boîte à outils à l'œuvre sur une tâche réelle, les notes d'un contrôle du groupe :

```python
scores = []
scores.append(8)
scores.append(6)
scores.extend([9, 7, 10])

total = sum(scores)       # sum() additionne chaque élément
best = max(scores)        # max() trouve le plus grand
count = len(scores)       # len() les compte
average = total / count

print(average)            # 8.0
print(best)               # 10
```

Collectez avec `append`/`extend`, puis lisez avec `sum`, `max` et `len`. Remarquez la division : `total / count` est la moyenne arithmétique, le même $\frac{\text{somme}}{\text{nombre}}$ que vous connaissez en maths, désormais en une ligne de code. Une liste est un lieu pour *accumuler* des données, et la boucle entre la faire grandir et la lire est le motif que répète tout programme réel.

## Pièges courants

- **`sort()` renvoie `None`.** Si vous voulez une nouvelle liste, laissez `sorted()` porter la valeur.
- **Confusion de copie superficielle.** `a = b` fabrique deux noms pour une liste ; `a = b.copy()` ou `a = list(b)` construit une liste séparée.
- **Mélanger les types.** `[1, "two", 3.0]` est légal mais rend comparaisons et raisonnements plus durs ; gardez les collections honnêtes sur leur contenu.
- **`append` vs `extend`.** `nums.append([1, 2])` imbrique une liste comme un seul élément ; `nums.extend([1, 2])` verse ses éléments séparément.
- **`remove` ne supprime que la première occurrence.** `[1, 2, 1].remove(1)` laisse `[2, 1]` ; tout effacer demande une boucle (leçon pour plus tard).

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Supprimez les doublons en conservant l'ordre : `[1, 3, 2, 3, 1, 4, 2]` → `[1, 3, 2, 4]`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>list(dict.fromkeys(nums))</code>, un dict garde l'ordre d'insertion (depuis 3.7+), et les clés dupliquées s'effondrent sur leur première position.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Échangez deux variables sans variable temporaire, grâce au déballage de tuples.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>a, b = b, a</code>, le côté droit est évalué en tuple d'abord, donc l'échange est simultané, non séquentiel.</p>

</div>
</details>

## 🤔 Questions socratiques

- Quand atteindre un tuple plutôt qu'une liste, et que vous achète l'immuabilité ?
- Pourquoi `sort()` mute là où `sorted()` renvoie du neuf, et quand préférez-vous chacun ?
- Comment `*rest` recueille-t-il le surplus ? `*_` peut-il tenir lieu de rejet nommé ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-lists-tuples">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Qu'affiche <code>a = [1, 2]; b = a; b.append(3); print(a)</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1, 2]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 2, 3]</button>
      <button class="quiz-q__opt" data-idx="2">Error</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Laquelle est correcte ? <code>a, b, c = [1, 2]</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">a=1, b=2, c=None</button>
      <button class="quiz-q__opt" data-idx="1">a=1, b=2, c=0</button>
      <button class="quiz-q__opt" data-idx="2">ValueError</button>
      <button class="quiz-q__opt" data-idx="3">a=1, b=2, c=[]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>