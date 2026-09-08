---
title: "Conversion de types"
description: "Convertissez explicitement entre int, float, str et bool — et comprenez quand les conversions échouent."
module: "python-basics"
order: 4
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Convertir des valeurs avec int(), float(), str() et bool()"
  - "Comprendre la troncature contre l'arrondi"
  - "Reconnaître quand les conversions lèvent une ValueError"
  - "Gérer correctement le type de retour de input()"
prerequisites: ["03-data-types"]
tags: ["conversion", "cast", "int", "float", "str", "input"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Fonctions de conversion explicite

Python fournit `int(...)`, `float(...)`, `str(...)` et `bool(...)` pour convertir entre types :

```python
int("42")       # 42        — str -> int
int(3.9)        # 3         — float -> int, truncates (does NOT round!)
float("3.14")   # 3.14      — str -> float
str(42)         # "42"      — int -> str
bool(0)         # False     — 0 (and 0.0, and "") are "falsy"
bool(1)         # True      — any nonzero number (and non-empty string) is "truthy"
```

## Troncature contre arrondi

`int(3.9)` donne `3`, pas `4` — la conversion en `int` **tronque toujours vers zéro** (elle supprime la partie décimale). Elle n'arrondit jamais :

```python
int(3.9)        # 3  — truncates
int(-3.9)       # -3 — truncates toward zero, not toward negative infinity
round(3.9)      # 4  — this is rounding
```

La distinction compte pour les nombres négatifs : `int(-3.9)` vaut `-3` (vers zéro), tandis que `math.floor(-3.9)` vaut `-4` (vers moins l'infini).

## Quand les conversions échouent

Toute conversion n'est pas possible :

```python
int("hello")    # ValueError: invalid literal for int()
int("3.14")     # ValueError: invalid literal for int() — use float() first
float("hello")  # ValueError: could not convert string to float
```

Python échoue ici de façon bruyante plutôt que de deviner en silence — un choix de conception que vous apprécierez une fois que vous débognerez de vraies données.

## Le piège de input()

`input()` renvoie **toujours une `str`**, même si l'utilisateur a tapé un nombre :

```python
age_text = input("How old are you? ")   # always a string
age = int(age_text)                      # convert explicitly
print(f"In 10 years you'll be {age + 10}")
```

Oublier cette conversion est l'un des bugs précoces les plus courants :

```python
age = input("Age? ")
print(age + 1)    # TypeError: can only concatenate str (not "int") to str
```

## Pièges courants

- **`int("3.14")` lève une erreur.** Vous ne pouvez pas analyser directement une chaîne flottante avec `int()`. Utilisez `int(float("3.14"))` ou `round(float("3.14"))`.
- **`int()` tronque, n'arrondit pas.** `int(4.7)` vaut `4`, pas `5`. Utilisez `round()` quand c'est l'arrondi que vous voulez.
- **`float("inf")` est valide.** Python représente l'infini comme `float('inf')` — utile dans certains algorithmes, mais cela peut surprendre.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Prédisez `int(-7.9)` et `-7.9 // 1`. Sont-ils identiques ? Expliquez toute différence.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>int(-7.9)</code> vaut <code>-7</code> (tronque vers zéro — supprime la partie décimale), tandis que <code>-7.9 // 1</code> vaut <code>-8.0</code> (arrondit vers moins l'infini). Ils donnent les mêmes résultats pour les nombres positifs, mais divergent pour les négatifs.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez un programme qui demande un nom et une année de naissance (deux invites `input()` distinctes), calcule un âge approximatif et affiche une phrase comme `"Amina, you are about 21 years old."`

<p class="challenge__answer">💡 <strong>Réponse :</strong> Lisez le nom et l'année de naissance avec deux appels à <code>input()</code>, convertissez l'année en <code>int</code>, soustrayez-la de l'année en cours (par ex. <code>2026</code>) et affichez avec une f-string : <code>print(f"{name}, you are about {2026 - year} years old.")</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Sans l'exécuter, calculez à la main `15 // 4` et `15 % 4`. Puis vérifiez : est-ce que `4 * (15 // 4) + (15 % 4)` vaut `15` ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> 15 // 4 vaut 3 (plancher de 3,75) et 15 % 4 vaut 3 (puisque 15 = 4·3 + 3). Ensemble : 4 × 3 + 3 = 15. C'est l'identité de l'algorithme de division.</p>

</div>
</details>

## 🤔 Questions socratiques

- `input()` renvoie toujours une `str`. Qu'est-ce qui irait de travers si vous essayiez `age + 10` sans d'abord convertir `age = int(input(...))` ? Que vous dit réellement le message d'erreur ?
- Si vous voulez convertir `"3.14"` en entier, pourquoi `int("3.14")` échoue-t-il alors que `int(float("3.14"))` fonctionne ? Que fait l'étape intermédiaire ?
- Python a `math.floor()` et `math.ceil()`. En quoi diffèrent-ils de `int()` pour les nombres négatifs ? Quand choisiriez-vous l'un plutôt que l'autre ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-conversion">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que vaut int(4.7) ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">4</button>
      <button class="quiz-q__opt" data-idx="2">4.7</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Que renvoie toujours input("Name: ") ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. Que se passe-t-il avec int("3.14") ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">ValueError</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">4</button>
      <button class="quiz-q__opt" data-idx="3">3.14</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>