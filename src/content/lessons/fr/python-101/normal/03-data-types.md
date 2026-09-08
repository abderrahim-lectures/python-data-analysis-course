---
title: "Types de données"
description: "Identifiez les types fondamentaux de Python — int, float, str, bool — et comprenez ce que chacun représente."
module: "python-basics"
order: 3
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Identifier les valeurs int, float, str et bool"
  - "Utiliser type() pour vérifier le type d'une valeur"
  - "Comprendre le typage dynamique en Python"
  - "Reconnaître les valeurs vraies et fausses"
prerequisites: ["02-variables"]
tags: ["types", "int", "float", "str", "bool", "typage-dynamique"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Chaque valeur a un type

Un type est l'ensemble auquel une valeur appartient — comme en mathématiques où l'on distingue les entiers des réels :

| Type | Analogue mathématique | Exemple |
|---|---|---|
| `int` | $\mathbb{Z}$ (entiers) | `42`, `-7` |
| `float` | $\mathbb{R}$ (réels, approchés) | `3.14`, `-0.5` |
| `str` | une suite finie de caractères | `"hello"` |
| `bool` | $\{\text{True}, \text{False}\}$ | `True`, `False` |

Vérifiez le type d'une valeur avec `type(...)` :

```python
type(42)      # <class 'int'>
type(3.14)    # <class 'float'>
type("hi")    # <class 'str'>
type(True)    # <class 'bool'>
```

## Typage dynamique

Python est **typé dynamiquement** : un nom n'est pas lié en permanence à un type. `x = 5` puis `x = "five"` est légal — `x` pointe simplement ailleurs :

```python
x = 5
print(type(x))    # <class 'int'>
x = "hello"
print(type(x))    # <class 'str'>
```

C'est pratique, mais cela signifie aussi que le *type* d'un nom ne peut être connu qu'en regardant vers quoi il pointe actuellement, sans le déclarer à l'avance.

## Valeurs vraies et fausses

`bool()` convertit n'importe quelle valeur en `True` ou `False`. La règle est simple :

- **Fausses** : `0`, `0.0`, `""` (chaîne vide), `None`
- **Vraies** : tout le reste

```python
bool(0)         # False
bool(1)         # True
bool(-1)        # True  — any nonzero number is truthy
bool("")        # False
bool("hello")   # True  — any non-empty string is truthy
```

Cela compte quand vous écrirez des conditions plus tard : `if score:` signifie « si score n'est pas nul ».

## Pièges courants

- **`4 / 2` vaut `2.0`, pas `2`.** En Python 3, la division réelle (`/`) renvoie toujours un `float`. Utilisez `4 // 2` pour la division entière.
- **`True + True` vaut `2`.** Les booléens sont des sous-classes de `int` en Python — `True` se comporte comme `1` et `False` comme `0` en arithmétique.
- **`type()` donne le type concret.** `type(True)` est `bool`, pas `int`, même si `True` agit comme `1` en mathématiques.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Qu'est-ce que `type(7 / 2)` ? Prédisez-le avant de l'exécuter, puis vérifiez.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>type(7 / 2)</code> est <code>float</code> — la division réelle (<code>/</code>) produit toujours un float en Python 3, même quand les deux opérandes sont des entiers et que le résultat est un nombre entier.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Prédisez `bool(0)`, `bool(0.0)`, `bool("")` et `bool("0")`. Lesquelles sont vraies et lesquelles sont fausses ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>bool(0)</code> → False, <code>bool(0.0)</code> → False, <code>bool("")</code> → False (chaîne vide), <code>bool("0")</code> → True (chaîne non vide, même si elle contient le caractère « 0 »).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

`0.1 + 0.2` en Python n'est **pas** égal exactement à `0.3`. Essayez. Pourquoi un `float` — qui approche $\mathbb{R}$ avec un nombre fini de chiffres binaires — ne peut-il pas représenter exactement $0.1$ ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> 0.1 n'a pas de représentation exacte en binaire (tout comme 1/3 n'a pas de représentation décimale exacte). Les floats utilisent des fractions binaires finies, donc 0.1 + 0.2 accumule une minuscule erreur d'arrondi : 0.30000000000000004, pas 0.3. C'est une limitation fondamentale de l'arithmétique à virgule flottante, pas un bug de Python.</p>

</div>
</details>

## 🤔 Questions socratiques

- Si `bool(-1)` est `True`, quelle règle unique explique pourquoi `-1` est vrai mais `0` faux ?
- Python a `isinstance(42, int)` qui renvoie `True`. `isinstance` serait-il plus fiable que `type(x) == int` pour vérifier des types ? Pourquoi ou pourquoi pas ?
- Pourquoi Python utilise-t-il `True` et `False` (avec majuscules) plutôt que `true` et `false` ? Quels autres mots en majuscule Python réserve-t-il ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-types">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Quel est le type de 3.14 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Quel est le résultat de True + True ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">2</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. Laquelle de ces valeurs est fausse ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">""</button>
      <button class="quiz-q__opt" data-idx="1">"0"</button>
      <button class="quiz-q__opt" data-idx="2">-1</button>
      <button class="quiz-q__opt" data-idx="3">1</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>