---
title: "Opérateurs arithmétiques"
description: "Additionnez, soustrayez, multipliez, divisez, divisez entièrement, module et puissances — les huit opérateurs arithmétiques."
module: "operators"
order: 5
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Utiliser les huit opérateurs arithmétiques : +, -, *, /, //, %, **"
  - "Comprendre la division entière contre la division réelle"
  - "Appliquer la précédence des opérateurs (PEMDAS)"
  - "Utiliser des parenthèses pour outrepasser la précédence"
prerequisites: ["04-type-conversion"]
tags: ["arithmétique", "division", "modulo", "puissance", "précédence"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Les huit opérateurs arithmétiques

Python a les quatre opérateurs standards plus quatre supplémentaires :

```python
7 + 2    # 9   — addition
7 - 2    # 5   — subtraction
7 * 2    # 14  — multiplication
7 / 2    # 3.5 — true division (always returns float)
7 // 2   # 3   — floor division (rounds toward -∞)
7 % 2    # 1   — modulo (remainder)
7 ** 2   # 49  — exponentiation (7²)
```

## Division entière contre division réelle

`/` donne toujours un `float`, même quand les deux opérandes sont des entiers et que le résultat est un nombre entier :

```python
4 / 2    # 2.0  — float, not int
```

`//` donne le quotient **arrondi vers le bas** — toujours vers moins l'infini :

```python
7 // 2    # 3   — floor(3.5)
-7 // 2   # -4  — floor(-3.5) = -4, not -3
```

Cette dernière ligne est une surprise fréquente. La division entière suit la fonction mathématique plancher $\lfloor x \rfloor$, qui arrondit vers le *bas* (vers $-\infty$), et non vers zéro.

## Modulo : le reste

`%` donne le reste après la division entière. L'identité clé :

```
a == (a // b) * b + (a % b)
```

```python
15 % 4    # 3   — since 15 = 4×3 + 3
15 // 4   # 3
4 * 3 + 3 # 15  ✓
```

## Précédence des opérateurs

Python suit PEMDAS — le même ordre que vous connaissez en mathématiques :

1. `**` en premier (puissance)
2. `*`, `/`, `//`, `%` (de gauche à droite)
3. `+`, `-` (de gauche à droite)

```python
2 + 3 * 4      # 14, not 20
(2 + 3) * 4    # 20 — parentheses override
2 ** 3 ** 2     # 512, not 64 — ** is right-associative: 2 ** (3 ** 2) = 2 ** 9
```

## Pièges courants

- **`/` contre `//`.** `7 / 2` vaut `3.5` (float), `7 // 2` vaut `3` (int). Utilisez `//` quand vous voulez un résultat entier.
- **La division entière avec des négatifs.** `-7 // 2` vaut `-4`, pas `-3`. Cela suit le plancher mathématique, pas la troncature.
- **`%` avec des floats.** `7.5 % 2` vaut `1.5` — le modulo fonctionne aussi avec les floats, pas seulement les entiers.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Sans l'exécuter, calculez à la main `15 // 4` et `15 % 4`. Puis vérifiez : est-ce que `4 * (15 // 4) + (15 % 4)` vaut `15` ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> 15 // 4 vaut 3 (plancher de 3,75) et 15 % 4 vaut 3 (puisque 15 = 4·3 + 3). Ensemble : 4 × 3 + 3 = 15. C'est l'identité de l'algorithme de division.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Comment extrairiez-vous le chiffre des centaines d'un nombre ? Par exemple, étant donné `n = 4567`, extrayez `5` avec l'arithmétique uniquement (sans chaînes).

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>(n // 100) % 10</code> — divisez d'abord par 100 pour décaler à droite (4567 → 45), puis prenez le modulo 10 pour obtenir le dernier chiffre (45 → 5).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Pourquoi Python utilise-t-il `**` pour la puissance au lieu de `^` ? Que fait réellement `^` en Python ? (Indice : ce n'est pas la puissance.)

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>^</code> est l'opérateur de XOR bit à bit en Python, pas la puissance. Python utilise <code>**</code> pour éviter l'ambiguïté avec les langages de style C où <code>^</code> signifie XOR.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi la division entière de Python arrondit-elle vers moins l'infini au lieu de vers zéro ? Quel avantage pratique cela vous donne-t-il (indice : pensez au fonctionnement de `divmod()`) ?
- `2 ** 3 ** 2` vaut `512`, pas `64`. Pourquoi `**` est-il associatif à droite alors que `+` et `*` sont associatifs à gauche ?
- Pouvez-vous imaginer un scénario réel où l'arithmétique modulaire est essentielle ? (Pensez aux horloges, aux jours du calendrier ou à l'indexation de tableaux.)

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-arithmetic">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Que vaut -7 // 2 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">-3</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">-4</button>
      <button class="quiz-q__opt" data-idx="3">-3.5</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. Quel est le résultat de 2 ** 3 ** 2 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">512</button>
      <button class="quiz-q__opt" data-idx="1">64</button>
      <button class="quiz-q__opt" data-idx="2">36</button>
      <button class="quiz-q__opt" data-idx="2">8</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. Que vaut 7 % 3 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">2</button>
      <button class="quiz-q__opt" data-idx="1">1</button>
      <button class="quiz-q__opt" data-idx="2">3</button>
      <button class="quiz-q__opt" data-idx="3">0</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>