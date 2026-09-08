---
title: "Opérateurs de comparaison"
description: "Testez l'égalité, l'inégalité et l'ordre — et enchaînez les comparaisons dans une seule expression."
module: "operators"
order: 6
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Utiliser ==, !=, <, <=, >, >= pour comparer des valeurs"
  - "Enchaîner des comparaisons comme 0 <= x < 10"
  - "Comprendre en quoi == diffère de is"
  - "Comparer des valeurs de types différents"
prerequisites: ["05-arithmetic"]
tags: ["comparaison", "égalité", "enchaînement", "bool"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Six opérateurs de comparaison

Les opérateurs de comparaison produisent un `bool` — `True` ou `False` :

```python
5 == 5      # True   — equal
5 != 3      # True   — not equal
5 < 10      # True   — less than
5 <= 5      # True   — less than or equal
5 > 10      # False  — greater than
5 >= 5      # True   — greater than or equal
```

## Comparaisons enchaînées

Python permet d'enchaîner les comparaisons comme vous le feriez en mathématiques :

```python
x = 5
0 <= x < 10    # True — both conditions hold
0 <= x < 3     # False — x < 3 fails
```

Cela est évalué comme une seule expression, pas comme deux expressions distinctes reliées par `and`. C'est équivalent à `0 <= x and x < 10`, mais se lit plus naturellement.

## `==` contre `is`

`==` teste **l'égalité de valeur** — ces deux choses ont-elles le même contenu ?
`is` teste **l'identité** — s'agit-il du même objet exact en mémoire ?

```python
a = [1, 2, 3]
b = [1, 2, 3]
a == b    # True  — same content
a is b    # False — different objects

c = a
a is c    # True  — same object
```

**Règle empirique :** utilisez toujours `==` pour comparer des valeurs. N'utilisez `is` que pour vérifier `None` :

```python
if x is None:    # correct
if x == None:    # works but non-idiomatic
```

## Comparer des types différents

Python permet de comparer des valeurs de types différents, mais le résultat peut surprendre :

```python
5 == 5.0      # True  — int and float compared numerically
"5" == 5      # False — string and int are never equal
"5" < 6       # TypeError: '<' not supported between str and int
```

En Python 3, les comparaisons d'ordre (`<`, `>`) entre types incompatibles lèvent une `TypeError`. Seuls `==` et `!=` fonctionnent entre types.

## Pièges courants

- **`=` contre `==`.** `if score = 60:` est une erreur de syntaxe — Python ne vous laissera pas affecter accidentellement dans une condition. Utilisez `==`.
- **La comparaison de nombres flottants.** `0.1 + 0.2 == 0.3` vaut `False` à cause de l'imprécision des nombres à virgule flottante. Utilisez plutôt `abs((0.1 + 0.2) - 0.3) < 1e-10`.
- **`==` avec `None`.** `x == None` fonctionne, mais `x is None` est la façon idiomatique Python.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body>

Prédisez le résultat de chacune sans l'exécuter : `5 == 5.0`, `"5" == 5`, `5 < "6"`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>5 == 5.0</code> → True (égalité numérique), <code>"5" == 5</code> → False (types différents), <code>5 < "6"</code> → TypeError (l'ordre entre int et str n'est pas permis en Python 3).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez une comparaison enchaînée qui vérifie si un nombre `n` est entre 1 et 100 inclus, en une seule expression (sans `and`).

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>1 <= n <= 100</code> — la comparaison enchaînée de Python lui fait lire comme une notation mathématique.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Pourquoi `0.1 + 0.2 == 0.3` s'évalue-t-il à `False` ? Comment écririez-vous un test d'égalité flottante correct ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> 0.1 et 0.2 n'ont pas de représentation binaire exacte, donc leur somme vaut 0.30000000000000004, pas exactement 0.3. Test correct : <code>abs((0.1 + 0.2) - 0.3) < 1e-10</code> — vérifiez si la différence est inférieure à une minuscule tolérance.</p>

</div>
</details>

## 🤔 Questions socratiques

- Si `a == b` vaut `True`, cela signifie-t-il que `a is b` doit aussi valoir `True` ? Dans quelles circonstances deux objets peuvent-ils être égaux sans être identiques ?
- Pourquoi Python interdit-il `5 < "6"` mais permet-il que `5 == "5.0"` vaille `False` ? Quel principe de conception est à l'œuvre ?
- Dans quels scénarios `is` pourrait-il être plus utile que `==` pour vérifier l'égalité ? (Pensez aux singletons comme `None`.)

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-comparison">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. Que vaut 5 == 5.0 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">TypeError</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. À quoi s'évalue 0 <= 5 < 10 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">False</button>
      <button class="quiz-q__opt" data-idx="1">0</button>
      <button class="quiz-q__opt" data-idx="2">True</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. Quelle est la façon idiomatique Python de vérifier si x est None ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">x == None</button>
      <button class="quiz-q__opt" data-idx="1">x is None</button>
      <button class="quiz-q__opt" data-idx="2">x = None</button>
      <button class="quiz-q__opt" data-idx="3">None is x</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>