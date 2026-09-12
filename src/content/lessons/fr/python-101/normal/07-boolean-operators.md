---
title: "Opérateurs booléens"
description: "Combinez des conditions avec and, or, not, les connecteurs logiques de Python."
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

## Construire des conditions à partir de conditions

Les opérateurs de comparaison vous donnent une seule valeur de vérité : `True` ou `False`. La porte de la boîte pose deux questions à la fois, *« êtes-vous majeur, et tenez-vous un billet ? »*, et cette conjonction est elle-même une condition. Python, comme la logique rencontrée en mathématiques, offre les trois connecteurs qui combinent des propositions :

- $A \land B$ s'écrit `and`
- $A \lor B$ s'écrit `or`
- $\lnot A$ s'écrit `not`

## Les trois connecteurs

Leur comportement est la table de vérité que vous connaissez déjà. Écrivez-la en Python et elle se lit à l'identique :

```python
True and True      # True
True and False     # False
False or True      # True
not True           # False
```

Leur intérêt est de coller des comparaisons dans une seule porte. Un lieu, une alerte météo, un jour de travail :

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

Chacune est une question unique assemblée de plus petites, exactement comme $0 \leq x < 10$ assemblait des intervalles dans la leçon précédente.

## L'évaluation en court-circuit

La table de vérité complète liste quatre lignes, mais Python n'en a pas toujours besoin. Évaluez $A$ `and` $B$ avec $A = \mathrm{False}$ : la réponse est `False` quel que soit $B$, donc $B$ n'est jamais calculé. Le même mur vaut pour `or` : dès que $A$ est `True`, le résultat est tranché. Python lit de gauche à droite et **s'arrête à la première réponse décisive**.

Ce n'est pas un confort de performance ; c'est un dispositif de sécurité :

```python
x = 0
# Aucune division n'a lieu — 0 est faux, la seconde moitié est sautée
result = x != 0 and 10 / x > 2
```

Si Python évaluait les deux côtés, $10/x$ planterait sur une division par zéro. Le mot `and` est une porte de pré-vol : il refuse de faire voler la seconde condition tant que la première ne l'autorise pas. C'est pourquoi Python écrit `and`/`or` là où les langages de la famille C écrivent `&&`/`||`, les mots portent le même court-circuit sans les symboles cryptiques.

## Les deux échanges de De Morgan

Les identités les plus réutilisables de la logique font traverser une négation à travers un connecteur :

- $\neg(A \land B) \equiv (\neg A) \lor (\neg B)$, `not (A and B)` ≡ `not A or not B`
- $\neg(A \lor B) \equiv (\neg A) \land (\neg B)$, `not (A or B)` ≡ `not A and not B`

En Python, la négation d'une condition jointe devient une condition jointe de négations :

```python
# Elles sont équivalentes :
not (age >= 18 and has_ticket)
age < 18 or not has_ticket
```

La forme réécrite se lit d'un trait : la porte n'ouvre à aucun mineur et à aucun sans billet. Les lois de De Morgan sont l'outil pour transformer un dense `not (…)` à démêler en une lecture franche.

## Les tables de vérité, d'un coup d'œil

| $A$ | $B$ | $A \land B$ | $A \lor B$ |
|-----|-----|-------------|------------|
| True | True | True | True |
| True | False | False | True |
| False | True | False | True |
| False | False | False | False |

Et $\lnot$ retourne l'unique valeur de vérité : `not True` → `False`, `not False` → `True`.

## Un exemple travaillé : la porte du club, racontée deux fois

Une porte, un verdict, deux formulations. La règle d'admission refuse quiconque n'est pas majeur ou n'a pas de billet :

```python
age = 20
has_ticket = True

denied = not (age >= 18 and has_ticket)      # False
denied_again = age < 18 or not has_ticket    # False — De Morgan, équivalent
```

La première ligne dit « il n'est pas vrai que (majeur ET avec billet) » ; la seconde dit « mineur OU sans billet », les deux faces de la loi de De Morgan, et toutes deux répondent pareil. La version dénouée se lit comme la phrase qu'elle décrit.

## Pièges courants

- **`and`/`or` renvoient un opérande, pas un booléen.** `0 and 5` vaut `0` ; `0 or 5` vaut `5`. Python rend la valeur qui a décidé. Le 0 faux a décidé, donc c'est 0 qui revient.
- **`not` se lie plus fort que `==`.** `not a == b` se lit `not (a == b)`, pas `(not a) == b`. Parenthèsez dans le doute.
- **Des mots, pas des symboles bit à bit.** `True and False` vaut `False` ; `True & False` est une opération bit à bit sur des booléens, de comportement différent. Réservez `&`/`|` au travail au niveau des bits.
- **`and`/`or` sont paresseux d'une façon qui cache des bogues.** Si le côté décisif est déjà truthy/falsy, l'autre côté ne s'exécute jamais, `1 or missing_function()` n'appelle jamais la fonction. Une moitié morte qui n'a pas planté peut cacher un nom oublié.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Sans l'exécuter, prédisez : `0 and 5`, `0 or 5`, `3 and 5`, `3 or 5`. Quel motif voyez-vous ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>0 and 5</code> → 0, <code>0 or 5</code> → 5, <code>3 and 5</code> → 5, <code>3 or 5</code> → 3. Motif : <code>and</code> rend le premier opérande faux (ou le dernier si tous sont vrais) ; <code>or</code> rend le premier vrai (ou le dernier si tous sont faux).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Réécrivez `not (x > 5 and y < 10)` avec la loi de De Morgan. La version réécrite est-elle plus lisible ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>not (x &gt; 5 and y &lt; 10)</code> ≡ <code>x &lt;= 5 or y &gt;= 10</code>, une lecture directe, sans négation composée à démêler.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Écrivez la condition d'année bissextile : divisible par 4, sauf les siècles (divisibles par 100) à moins d'être aussi divisibles par 400. Utilisez `and`, `or`, `not`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)</code>, divisible par 4 mais pas par 100, ou divisible par 400.</p>

</div>
</details>

## 🤔 Questions socratiques

- `0 and 5` donne `0`, pas `False`. Pourquoi Python rend-il la valeur qui décide plutôt qu'un booléen ? Quand cela devient-il utile ?
- Si `or` rend le premier opérande vrai, que vaut `"hello" or "world"` ? Et `"" or "world"` ?
- Pourquoi Python préfère-t-il les mots `and`, `or`, `not` aux symboles `&&`, `||`, `!` ? Qu'achète l'anglais en clair au lecteur ?

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
    <p class="quiz-q__prompt">2. Que vaut 0 or 5 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">0</button>
      <button class="quiz-q__opt" data-idx="2">True</button>
      <button class="quiz-q__opt" data-idx="3">False</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">3. Lequel équivaut à not (a and b) ?</p>
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