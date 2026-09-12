---
title: "Opérateurs de comparaison"
description: "Testez l'égalité, l'inégalité et l'ordre, et enchaînez les comparaisons dans une seule expression."
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

## L'ordinateur, mis en demeure de trancher

Une évaluation `2 + 3` produit un nombre. Mais la plus grande partie de ce qu'un programme a besoin de savoir n'est pas un nombre, c'est une *décision*. La note valide-t-elle ? Le nom d'utilisateur est-il pris ? La température est-elle dans la plage ? Les opérateurs de comparaison sont la branche de la famille arithmétique qui produit une réponse dans l'ensemble $\{\mathrm{True}, \mathrm{False}\}$ au lieu de $\mathbb{R}$.

## Les six opérateurs de comparaison

Chacun compare deux valeurs et produit un `bool` :

```python
5 == 5      # True   — égal
5 != 3      # True   — différent
5 < 10      # True   — inférieur à
5 <= 5      # True   — inférieur ou égal
5 > 10      # False  — supérieur à
5 >= 5      # True   — supérieur ou égal
```

En mathématiques vous écririez $\leq$, $\geq$, $\neq$ ; Python opte pour les `<=`, `>=`, `!=` compatibles avec un clavier. Le sens est inchangé. Le double égal `==` exige une pause délibérée : c'est la question *« sont-ils égaux ? »*, tandis qu'un seul `=` est un ordre d'affectation. Le signe doublé est ce qui les empêche de jamais entrer en collision.

## Enchaînez les comparaisons comme un mathématicien

Supposons que $x$ appartienne à l'intervalle $[0, 10)$. Sur papier vous écrivez la condition en trois parties d'un seul souffle, $0 \leq x < 10$. Python vous laisse l'écrire exactement ainsi :

```python
x = 5
0 <= x < 10    # True — les deux conditions tiennent
0 <= x < 3     # False — la seconde échoue
```

C'est une expression unique, évaluée par le même appariement que vous liriez : $0 \leq x$ puis $x < 10$, la valeur du milieu n'étant calculée qu'une fois. La comparaison enchaînée vaut $0 \leq x$ `and` $x < 10$, mais la forme enchaînée se lit comme les mathématiques dont elle sort.

## `==` interroge le contenu ; `is` interroge l'identité

Deux questions se ressemblent et répondent différemment :

```python
a = [1, 2, 3]
b = [1, 2, 3]
a == b    # True  — même contenu
a is b    # False — objets distincts en mémoire

c = a
a is c    # True  — le même objet
```

`==` compare les valeurs portées ; `is` compare les adresses mémoire. Plusieurs boîtes peuvent par hasard contenir la même liste ; il n'y a qu'un seul objet. Les deux coïncident pour les petites choses (comme les petits entiers que Python met en cache) et divergent pour tout le reste, donc la règle est stable : utilisez `==` pour le contenu, et réservez `is` au singleton unique qui n'a pas de contenu à comparer, `None` :

```python
if x is None:    # correct
if x == None:    # fonctionne, mais vous posez la mauvaise question
```

## Comparer entre types

Amener des valeurs d'ensembles différents dans une comparaison, $\mathbb{Z}$ contre $\mathbb{S}$, suit une politique fixe :

```python
5 == 5.0      # True  — l'égalité numérique ignore le type
"5" == 5      # False — une chaîne et un int ne sont jamais égaux
"5" < 6       # TypeError: '<' not supported between str and int
```

Deux règles en découlent. Pour l'égalité, les valeurs numériques se comparent par la valeur, pas par le type, tandis que des valeurs de familles étrangères ne sont simplement jamais égales. Pour l'ordre, Python refuse de deviner : il n'existe pas d'ordre total qui ait un sens entre une chaîne et un entier, donc il lève `TypeError` plutôt que d'en inventer un.

## Un exemple travaillé : la tolérance du reçu

Le piège du bruit de floats a une réponse constructive. Comparez avec tolérance comme le ferait un physicien, ou passez à des unités entières exactes :

```python
expected = 0.3
price = 0.1 + 0.2                    # 0.30000000000000004
price == expected                    # False — bruit du float
abs(price - expected) < 1e-9         # True — dans la tolérance
```

Le motif est une paire de questions et une décision : sont-ils exactement égaux ? `False`. Et dans une proximité raisonnable ? `True`. La seconde est celle que le monde réel entend souvent.

## Pièges courants

- **`=` contre `==`.** `if score = 60:` est une erreur de syntaxe, Python ne vous laisse pas affecter dans une condition par accident. Le signe doublé est un garde-fou, pas une formalité.
- **Égalité en virgule flottante.** `0.1 + 0.2 == 0.3` est `False`. La représentation binaire de $0.1$ est infinie, donc la somme tombe sur $0.30000000000000004$. Comparez dans une tolérance à la place : `abs((0.1 + 0.2) - 0.3) < 1e-10`.
- **`==` avec `None`.** `x == None` marche par hasard ; `x is None` est la question que vous posez vraiment.
- **L'égalité de floats demande une tolérance ; l'argent demande des unités entières.** `0.1 + 0.2 == 0.3` échoue (`False`), alors comparez dans `abs(a - b) < 1e-9` ou comptez en centimes, `120 == 12 * 10` est exact.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Prédisez chaque résultat sans exécuter : `5 == 5.0`, `"5" == 5`, `5 < "6"`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>5 == 5.0</code> → True (égalité numérique entre types), <code>"5" == 5</code> → False (une chaîne n'est jamais égale à un int), <code>5 &lt; "6"</code> → TypeError (l'ordre n'est pas défini entre int et str en Python 3).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Écrivez une seule comparaison enchaînée qui vérifie qu'un nombre $n$ est dans $[1, 100]$, sans `and`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>1 &lt;= n &lt;= 100</code>, la forme enchaînée se lit exactement comme l'intervalle $1 \leq n \leq 100$.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Pourquoi `0.1 + 0.2 == 0.3` renvoie-t-il `False` ? Comment écrirez-vous un test d'égalité en virgule flottante correct ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Ni $0.1$ ni $0.2$ n'ont de représentation binaire exacte, donc leur somme vaut $0.30000000000000004$, pas exactement $0.3$. Testez dans une tolérance : <code>abs((0.1 + 0.2) - 0.3) &lt; 1e-10</code>.</p>

</div>
</details>

## 🤔 Questions socratiques

- Si `a == b` est `True`, `a is b` doit-il l'être aussi ? Dans quelles circonstances deux objets peuvent-ils être égaux en contenu et distincts en identité ?
- Pourquoi Python interdit-il `5 < "6"` tout en laissant `5 == "5"` être `False` ? Quel principe de conception rend les deux comportements cohérents ?
- Quand `is` est-il vraiment le bon outil pour l'égalité ? Pensez au singleton `None`, et pourquoi comparer son contenu n'a pas de sens.

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
    <p class="quiz-q__prompt">2. Que vaut 0 <= 5 < 10 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">False</button>
      <button class="quiz-q__opt" data-idx="1">0</button>
      <button class="quiz-q__opt" data-idx="2">True</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. Quelle est la façon pythonique de vérifier si x est None ?</p>
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