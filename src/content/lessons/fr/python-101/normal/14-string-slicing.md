---
title: "Trancher les chaînes"
description: "Extrayez des sous-chaînes avec la puissante notation de tranche de Python."
module: "strings"
order: 14
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Utiliser la notation de tranche [start:stop:step] pour extraire des sous-chaînes"
  - "Inverser des chaînes et sauter des caractères avec step"
  - "Utiliser des indices négatifs pour compter depuis la fin"
  - "Appliquer le tranchage aux listes (même syntaxe)"
prerequisites: ["13-string-methods"]
tags: ["tranchage", "sous-chaîne", "indices", "step"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Tranchage de base

La syntaxe est `string[start:stop:step]` — `start` est inclusif, `stop` est exclusif :

```python
text = "Python"
text[0:3]    # 'Pyt'
text[2:5]    # 'tho'
text[:4]     # 'Pyth'  (start defaults to 0)
text[3:]     # 'hon'   (stop defaults to end)
text[:]      # 'Python' (full copy)
```

## Indices négatifs

Comptez depuis la fin avec des nombres négatifs :

```python
text = "Python"
text[-1]     # 'n'  (last character)
text[-3:]    # 'hon' (last 3 characters)
text[:-2]    # 'Pyth' (all except last 2)
text[-4:-1]  # 'tho'
```

## Step

Le troisième paramètre contrôle le pas :

```python
text = "abcdefghij"
text[::2]    # 'acegi'   (every 2nd character)
text[1::2]   # 'bdfhj'   (every 2nd, starting at index 1)
text[::-1]   # 'jihgfedcba'  (reversed!)
text[::-2]   # 'jhfdb'   (every 2nd, reversed)
```

## Le tranchage ne lève jamais d'erreur

Contrairement à l'indexation, le tranchage ne lève jamais d'`IndexError` — il renvoie simplement ce qu'il peut :

```python
text = "hi"
text[0:100]   # 'hi'  (no error, just stops at end)
text[100:200] # ''    (empty string)
```

## Le tranchage fonctionne aussi sur les listes

La même syntaxe fonctionne pour toute séquence :

```python
nums = [0, 1, 2, 3, 4, 5]
nums[1:4]     # [1, 2, 3]
nums[::-1]    # [5, 4, 3, 2, 1, 0]
```

## Pièges courants

- **Confondre `text[3]` (indexation, un caractère) avec `text[3:4]` (tranchage, toujours un caractère mais une nouvelle chaîne)**
- **Supposer que `stop` est inclusif** — `text[0:3]` donne les caractères en 0, 1, 2
- **Utiliser l'affectation de tranche sur des chaînes** — les chaînes ne la supportent pas (les listes le font : `nums[1:3] = [9, 9]`)

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Inversez la chaîne `"racecar"` avec le tranchage.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>"racecar"[::-1]</code> → <code>"racecar"</code> (c'est un palindrome !)</p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Étant donné `"abcdefghij"`, extrayez chaque 3e caractère : `a`, `d`, `g`, `j`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>"abcdefghij"[::3]</code> → <code>"adgj"</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Pourquoi le tranchage ne lève-t-il jamais d'erreur alors que l'indexation en lève ? Quelle philosophie de conception cela reflète-t-il ?
- Comment échangeriez-vous deux éléments dans une liste en utilisant uniquement l'affectation de tranche ?
- Si `text[::-1]` inverse une chaîne, comment vérifieriez-vous si une chaîne est un palindrome en une ligne ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

<div class="quiz" data-quiz="python-101-string-slicing">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. Que renvoie <code>"Python"[1:4]</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">'yth'</button>
      <button class="quiz-q__opt" data-idx="1">'Pyt'</button>
      <button class="quiz-q__opt" data-idx="2">'ytho'</button>
      <button class="quiz-q__opt" data-idx="3">'Pyth'</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Comment inversez-vous une chaîne <code>s</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">s.reverse()</button>
      <button class="quiz-q__opt" data-idx="1">s[::-0]</button>
      <button class="quiz-q__opt" data-idx="2">s[::-1]</button>
      <button class="quiz-q__opt" data-idx="3">s[::1]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>