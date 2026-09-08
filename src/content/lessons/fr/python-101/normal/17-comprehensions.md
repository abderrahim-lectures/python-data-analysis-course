---
title: "Compréhensions"
description: "Construisez des listes, des dicts et des sets de manière concise avec la syntaxe de compréhension."
module: "data-structures"
order: 17
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Écrire des compréhensions de liste avec filtrage et conditions"
  - "Créer des compréhensions de dict et de set"
  - "Utiliser des compréhensions imbriquées pour les structures 2D"
  - "Savoir quand utiliser une compréhension plutôt qu'une boucle normale"
prerequisites: ["16-dicts-and-sets"]
tags: ["compréhensions", "list-comp", "dict-comp", "set-comp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Compréhensions de liste

Une façon concise de créer des listes à partir d'itérables :

```python
# Regular loop
squares = []
for x in range(6):
    squares.append(x ** 2)

# Comprehension
squares = [x ** 2 for x in range(6)]
# [0, 1, 4, 9, 16, 25]
```

## Filtrage avec des conditions

Ajoutez une clause `if` pour filtrer les éléments :

```python
evens = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]

long_words = [w.upper() for w in ["hi", "hello", "hey"] if len(w) > 2]
# ['HELLO', 'HEY']
```

## If/else dans les compréhensions

Utilisez `if...else` **avant** le `for` (c'est une expression, pas un filtre) :

```python
labels = ["even" if x % 2 == 0 else "odd" for x in range(5)]
# ['even', 'odd', 'even', 'odd', 'even']
```

## Compréhensions de dict

```python
squares_dict = {x: x**2 for x in range(6)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Invert a dict
original = {"a": 1, "b": 2}
inverted = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b'}
```

## Compréhensions de set

```python
lengths = {len(word) for word in ["hello", "hi", "hey"]}
# {2, 3, 5}  (unique lengths)
```

## Compréhensions imbriquées

```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## Quand NE PAS utiliser de compréhensions

- Quand la logique est complexe — une boucle `for` normale est plus lisible
- Quand vous avez besoin de `try/except` dans la boucle
- Quand les effets de bord comptent (affichage, écriture de fichiers)

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Utilisez une compréhension de liste pour aplatir `[[1, 2], [3, 4], [5, 6]]` en `[1, 2, 3, 4, 5, 6]`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>[num for row in matrix for num in row]</code></p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Utilisez une compréhension de dict pour mapper des mots vers leurs longueurs : `["hi", "hello", "hey"]` → `{"hi": 2, "hello": 5, "hey": 3}`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>{w: len(w) for w in words}</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Pourquoi `if...else` va-t-il avant `for` dans une compréhension mais après `for` dans une boucle normale ?
- Quand une compréhension devient-elle plus difficile à lire qu'une boucle normale ? Où tracez-vous la ligne ?
- Pouvez-vous utiliser `await` dans une compréhension ? De quelle syntaxe spéciale avez-vous besoin ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

<div class="quiz" data-quiz="python-101-comprehensions">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Que produit <code>[x * 2 for x in range(4) if x > 1]</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[0, 2, 4, 6]</button>
      <button class="quiz-q__opt" data-idx="1">[2, 4]</button>
      <button class="quiz-q__opt" data-idx="2">[4, 6]</button>
      <button class="quiz-q__opt" data-idx="3">[0, 2]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. Quelle est la compréhension de dict correcte ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{k: v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="1">{k, v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="2">{k: v in items}</button>
      <button class="quiz-q__opt" data-idx="3">dict(k: v for k, v in items)</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>