---
title: "Listes et tuples"
description: "Maîtrisez les séquences ordonnées de Python — les listes mutables et les tuples immuables."
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

## Listes

Les listes sont des séquences ordonnées et mutables :

```python
fruits = ["apple", "banana", "cherry"]
print(fruits[0])       # apple
print(fruits[-1])      # cherry
print(fruits[0:2])     # ['apple', 'banana']
```

## Méthodes de liste

```python
nums = [3, 1, 4, 1, 5]
nums.append(9)       # [3, 1, 4, 1, 5, 9]
nums.insert(0, 0)    # [0, 3, 1, 4, 1, 5, 9]
nums.extend([2, 6])  # [0, 3, 1, 4, 1, 5, 9, 2, 6]
nums.pop()           # removes 9, returns it
nums.remove(1)       # removes first 1
nums.sort()          # sorts in place
nums.reverse()       # reverses in place
len(nums)            # current length
```

## Modifier en place contre renvoyer une nouvelle

Certaines méthodes modifient la liste (`append`, `sort`, `reverse`) et renvoient `None`.
D'autres renvoient une nouvelle liste (`sorted()`, `list.copy()`) :

```python
nums = [3, 1, 2]
result = nums.sort()   # result is None! nums is now [1, 2, 3]
result = sorted(nums)  # result is [1, 2, 3], nums unchanged
```

## Tuples

Les tuples sont des séquences ordonnées et **immuables** :

```python
point = (3, 4)
print(point[0])   # 3
# point[0] = 5   # TypeError!
```

Utilisez des tuples pour des données fixes : coordonnées, couleurs RGB, lignes de base de données.

## Déballage

Affectez les éléments d'une séquence à des variables en une ligne :

```python
x, y = (3, 4)         # x=3, y=4
a, b, *rest = [1, 2, 3, 4, 5]  # a=1, b=2, rest=[3, 4, 5]
first, *_, last = (1, 2, 3, 4)  # first=1, last=4
```

## Pièges courants

- **`sort()` renvoie None** — affectez plutôt le résultat de `sorted()` si vous voulez une nouvelle liste
- **Copies superficielles** : `a = b` ne copie pas la liste ; utilisez `a = b.copy()` ou `a = list(b)`
- **Mélanger les types** : `[1, "two", 3.0]` fonctionne mais rend le code plus difficile à raisonner

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Supprimez tous les doublons d'une liste en préservant l'ordre : `[1, 3, 2, 3, 1, 4, 2]` → `[1, 3, 2, 4]`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>list(dict.fromkeys(nums))</code> — un dict préserve l'ordre d'insertion en Python 3.7+.</p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Échangez deux variables sans variable temporaire en utilisant le déballage de tuples.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>a, b = b, a</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Quand choisiriez-vous un tuple plutôt qu'une liste ? Que vous apporte l'immuabilité ?
- Pourquoi `sort()` modifie-t-il en place alors que `sorted()` renvoie une nouvelle liste ? Quand préféreriez-vous chacun ?
- Comment fonctionne `*rest` dans le déballage ? Pouvez-vous utiliser `*_` pour écarter nommément des éléments ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

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
</section>