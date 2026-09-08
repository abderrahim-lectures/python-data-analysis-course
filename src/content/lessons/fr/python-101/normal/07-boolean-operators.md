---
title: "Opérateurs booléens"
description: "Combinez des conditions avec and, or et not — les connecteurs logiques de Python."
module: "operators"
order: 7
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Utiliser and, or et not pour combiner des expressions booléennes"
  - "Comprendre l'évaluation en court-circuit"
  - "Appliquer les lois de De Morgan en Python"
  - "Écrire des conditions complexes clairement"
prerequisites: ["06-comparison-operators"]
tags: ["booléen", "and", "or", "not", "court-circuit", "logique"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Trois opérateurs booléens

Python a `and`, `or` et `not` — les connecteurs logiques de la logique propositionnelle :

```python
True and True      # True
True and False     # False
False or True      # True
not True           # False
```

## Combiner des conditions

Ils sont surtout utiles avec les opérateurs de comparaison :

```python
age = 20
has_ticket = True

if age >= 18 and has_ticket:
    print("Welcome in")

temperature = 30
if temperature < 0 or temperature > 40:
    print("Extreme weather!")

is_weekend = False
if not is_weekend:
    print("Time to work")
```

## Évaluation en court-circuit

Python évalue `and` et `or` de gauche à droite et **s'arrête dès que le résultat est déterminé** :

- `A and B` — si `A` est `False`, `B` n'est jamais évalué (le résultat est déjà `False`)
- `A or B` — si `A` est `True`, `B` n'est jamais évalué (le résultat est déjà `True`)

```python
x = 0
# This is safe — division never happens because 0 is falsy
result = x != 0 and 10 / x > 2
```

C'est pourquoi Python utilise des mots (`and`, `or`) au lieu de symboles (`&&`, `||`) : le court-circuit permet de se protéger des erreurs sans instructions `if` supplémentaires.

## Lois de De Morgan

Les identités de la logique s'appliquent directement en Python :

- `not (A and B)` ≡ `(not A) or (not B)`
- `not (A or B)` ≡ `(not A) and (not B)`

```python
# These are equivalent:
not (age >= 18 and has_ticket)
age < 18 or not has_ticket
```

C'est utile pour simplifier des conditions négatives complexes.

## Tables de vérité

| `A` | `B` | `A and B` | `A or B` |
|-----|-----|-----------|----------|
| True | True | True | True |
| True | False | False | True |
| False | True | False | True |
| False | False | False | False |

`not` se contente d'inverser : `not True` → `False`, `not False` → `True`.

## Pièges courants

- **`and`/`or` ne renvoient pas `True`/`False` — ils renvoient l'un des opérandes.** `0 and 5` renvoie `0`, pas `False`. `0 or 5` renvoie `5`, pas `True`. Python utilise la valeur « vraie/fausse », pas un booléen.
- **Oublier la précédence de `not`.** `not a == b` se parse comme `not (a == b)`, pas `(not a) == b`. Utilisez des parenthèses en cas de doute.
- **Utiliser `and`/`or` au lieu du bit à bit `&`/`|`.** `True and False` vaut `False`, mais `True & False` lève une erreur. Utilisez `and`/`or` pour les booléens, `&`/`|` pour les bits.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Sans l'exécuter, prédisez : `0 and 5`, `0 or 5`, `3 and 5`, `3 or 5`. Quel schéma observez-vous ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>0 and 5</code> → 0, <code>0 or 5</code> → 5, <code>3 and 5</code> → 5, <code>3 or 5</code> → 3. Schéma : <code>and</code> renvoie la première valeur fausse (ou la dernière valeur si toutes sont vraies) ; <code>or</code> renvoie la première valeur vraie (ou la dernière si toutes sont fausses).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Réécrivez `not (x > 5 and y < 10)` avec la loi de De Morgan. La version réécrite est-elle plus facile à lire ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>not (x > 5 and y < 10)</code> ≡ <code>x <= 5 or y >= 10</code> — lisible directement sans nier une expression composée.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez une condition qui vérifie si une année est bissextile : divisible par 4, sauf les siècles (divisibles par 100) à moins d'être aussi divisibles par 400. Utilisez `and`, `or` et `not` pour l'exprimer clairement.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)</code> — divisible par 4 mais pas par 100, OU divisible par 400.</p>

</div>
</details>

## 🤔 Questions socratiques

- `0 and 5` renvoie `0`, pas `False`. Pourquoi Python renvoie-t-il la valeur réelle plutôt que de la convertir en booléen ? Quand ce comportement est-il utile ?
- Si `or` renvoie la première valeur vraie, que renvoie `"hello" or "world"` ? Et `"" or "world"` ?
- Pourquoi Python utilise-t-il des mots (`and`, `or`, `not`) au lieu de symboles (`&&`, `||`, `!`) ? Quel avantage cela procure-t-il pour la lisibilité ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-boolean">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que vaut True and False ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">None</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. À quoi s'évalue 0 or 5 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">0</button>
      <button class="quiz-q__opt" data-idx="2">True</button>
      <button class="quiz-q__opt" data-idx="3">False</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">3. Laquelle est équivalente à not (a and b) ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">not a and not b</button>
      <button class="quiz-q__opt" data-idx="1">a or b</button>
      <button class="quiz-q__opt" data-idx="2">not a or not b</button>
      <button class="quiz-q__opt" data-idx="3">a and not b</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>