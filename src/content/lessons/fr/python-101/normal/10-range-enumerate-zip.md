---
title: "Range, Enumerate et Zip"
description: "Générez des séquences de nombres, suivez les indices et combinez des itérables."
module: "control-flow"
order: 10
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Utiliser range() pour générer des séquences de nombres"
  - "Utiliser enumerate() pour obtenir l'indice et la valeur pendant l'itération"
  - "Utiliser zip() pour itérer sur plusieurs séquences en parallèle"
  - "Écrire des boucles pythoniques qui évitent le suivi manuel d'indices"
prerequisites: ["09-for-while-loops"]
tags: ["range", "enumerate", "zip", "itération"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Range

`range()` génère une séquence d'entiers — utile pour répéter du code un nombre précis de fois :

```python
for i in range(5):
    print(i)  # 0 1 2 3 4
```

Trois formes :

```python
range(5)       # 0, 1, 2, 3, 4
range(2, 8)    # 2, 3, 4, 5, 6, 7
range(0, 20, 3) # 0, 3, 6, 9, 12, 15, 18
```

`range` est paresseuse — elle ne crée pas tous les nombres d'un coup. C'est ce qui la rend économe en mémoire pour les grandes séquences.

## Enumerate

`enumerate()` ajoute un compteur à n'importe quel itérable, pour que vous n'ayez pas besoin de variables d'indice manuelles :

```python
fruits = ["apple", "banana", "cherry"]

# Clunky:
i = 0
for fruit in fruits:
    print(f"{i}: {fruit}")
    i += 1

# Pythonic:
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")

# Start counting from 1:
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}: {fruit}")
```

## Zip

`zip()` combine plusieurs itérables en appariant les éléments par position :

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Alice: 85
# Bob: 92
# Charlie: 78
```

Il s'arrête à l'itérable le plus court par défaut, ou utilisez `itertools.zip_longest` pour aller jusqu'au plus long.

## Pièges courants

- **Oublier que `range` est exclusive** à l'extrémité supérieure : `range(5)` donne 0-4, pas 0-5
- **Utiliser `enumerate` sur un `dict`** — itérer sur un dict donne les clés par défaut ; utilisez `.items()` pour les paires clé-valeur
- **Assembler des longueurs inégales** — vous perdez silencieusement des éléments ; envisagez `zip_longest` avec une valeur de remplissage

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Utilisez `enumerate` pour afficher chaque élément de `colors = ["red", "green", "blue"]` avec sa position en commençant à 1.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>for i, color in enumerate(colors, 1): print(f"{i}. {color}")</code></p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Étant donné `keys = ["a", "b"]` et `values = [1, 2]`, utilisez `zip` pour créer un dictionnaire.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>dict(zip(keys, values))</code> → <code>{"a": 1, "b": 2}</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Pourquoi `range` est-elle préférée à la création d'une liste `[0, 1, 2, 3, 4]` ? Que se passe-t-il quand vous avez besoin d'un million de nombres ?
- Si `zip` s'arrête à l'itérable le plus court, comment détecteriez-vous quelles entrées étaient plus courtes ? Quand cela aurait-il de l'importance ?
- Pouvez-vous `enumerate` un `dict` ? Que représentent les indices ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

<div class="quiz" data-quiz="python-101-range-enumerate-zip">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que vaut <code>list(range(1, 10, 2))</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1, 2, 3, 4, 5, 6, 7, 8, 9]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 3, 5, 7, 9]</button>
      <button class="quiz-q__opt" data-idx="2">[2, 4, 6, 8]</button>
      <button class="quiz-q__opt" data-idx="3">[1, 2, 4, 8]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Que renvoie <code>list(zip([1, 2], [3, 4, 5]))</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[(1, 3), (2, 4), (5,)]</button>
      <button class="quiz-q__opt" data-idx="1">[(1, 3, 5), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="2">[(1, 3), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="3">[(1, 2), (3, 4, 5)]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>