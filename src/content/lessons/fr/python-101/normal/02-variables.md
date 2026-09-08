---
title: "Variables et nommage"
description: "Stockez des valeurs sous des noms, comprenez l'affectation et suivez les conventions de nommage de Python."
module: "python-basics"
order: 2
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Affecter des valeurs à des variables et les réaffecter"
  - "Expliquer pourquoi les variables sont des étiquettes, pas des boîtes"
  - "Utiliser les opérateurs d'affectation augmentée (+=, -=, *=, /=)"
  - "Suivre les conventions de nommage snake_case"
prerequisites: ["01-printing"]
tags: ["variables", "affectation", "nommage", "snake_case"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Les variables, des noms pour des valeurs

En mathématiques, « soit $x = 5$ » associe un nom à une valeur. Python fait exactement cela :

```python
x = 5
```

Le côté droit est d'abord évalué (`5`), puis le nom `x` est pointé vers cette valeur. Contrairement aux mathématiques, `x` peut être **réaffectée** :

```python
x = 5
x = x + 1  # x now names 6
```

Lisez `x = x + 1` comme « la nouvelle valeur de $x$ est l'ancienne valeur de $x$ plus un » — de la même façon que vous liriez une relation de récurrence $x_{n+1} = x_n + 1$.

## Affectation augmentée

Le schéma lire-calculer-réenregistrer est si courant que Python fournit un raccourci :

```python
x = 5
x += 1     # same as x = x + 1  -> 6
x -= 2     # same as x = x - 2  -> 4
x *= 3     # same as x = x * 3  -> 12
x /= 4     # same as x = x / 4  -> 3.0
```

## Conventions de nommage

Un nom (**identifiant**) doit commencer par une lettre ou un tiret bas, et ne peut contenir ensuite que des lettres, des chiffres et des tirets bas — `2nd_score` est invalide, `second_score` est correct.

La convention Python est le `snake_case` : des mots en minuscules séparés par des tirets bas (`student_name`, `total_score`), plutôt que `studentName` ou `TotalScore`. Quelques mots sont **réservés** par le langage (`if`, `for`, `class`, `True`, etc.) et ne peuvent pas être utilisés comme noms de variables.

Les noms doivent décrire *ce qu'une valeur signifie*. `x = 87.5` n'apprend rien au lecteur ; `quiz_score = 87.5` lui apprend tout. C'est plus important qu'il n'y paraît — vous relirez votre propre code bien plus souvent que vous ne l'écrirez.

## Pièges courants

- **Utiliser un mot réservé comme nom.** `class = "Math"` lève une `SyntaxError` — `class` est réservé.
- **Commencer par un chiffre.** `2nd_place = "B"` est invalide ; `second_place = "B"` est correct.
- **Confondre `=` et `==`.** `=` affecte ; `==` teste l'égalité. Tout le monde trébuche au moins une fois.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Si `x = 5`, puis `y = x`, puis `x = 10`, que vaut `y` ? Expliquez pourquoi en termes de « les noms pointent vers des valeurs » plutôt que « les boîtes contiennent des valeurs ».

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>y</code> vaut encore <code>5</code>. Quand <code>y = x</code> s'est exécuté, les deux noms pointaient vers la valeur <code>5</code>. Réaffecter <code>x</code> à <code>10</code> déplace le pointeur de <code>x</code> ; <code>y</code> pointe toujours vers <code>5</code>. Les noms sont des étiquettes, pas des boîtes.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez un court programme qui échange deux variables : `a = 7`, `b = 3`. Après l'échange, `a` doit valoir `3` et `b` doit valoir `7`. Faites-le sans variable temporaire (Python a une astuce élégante pour cela).

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>a, b = b, a</code> — Python évalue d'abord le côté droit, puis dépaquète dans le côté gauche. Aucune variable temporaire n'est nécessaire.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Lesquels de ces noms de variables sont valides ? Expliquez pourquoi les autres échouent : `_count`, `2nd`, `my-name`, `total`, `class`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>_count</code> ✓ (commencer par un tiret bas est permis), <code>2nd</code> ✗ (commence par un chiffre), <code>my-name</code> ✗ (le trait d'union est interdit — c'est l'opérateur moins), <code>total</code> ✓, <code>class</code> ✗ (mot-clé réservé).</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi Python utilise-t-il le `snake_case` plutôt que le `camelCase` ? Que suggère la métaphore visuelle du tiret bas sur la façon de lire les noms de variables ?
- `x += 1` et `x = x + 1` produisent le même résultat pour les nombres. Pouvez-vous imaginer une raison pour laquelle un langage fournirait quand même les deux formes ?
- Si les variables sont « des étiquettes, pas des boîtes », que se passe-t-il quand vous écrivez `a = [1, 2, 3]`, puis `b = a`, puis `b.append(4)` ? `a` voit-elle le `4` ? (Essayez — cela préfigure les objets mutables, vus plus loin.)

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-variables">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Quelle est la valeur de y après : x = 10; y = x; x = 20 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">20</button>
      <button class="quiz-q__opt" data-idx="1">10 and 20</button>
      <button class="quiz-q__opt" data-idx="2">10</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. Lequel est un nom de variable Python valide ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">_total</button>
      <button class="quiz-q__opt" data-idx="1">2nd</button>
      <button class="quiz-q__opt" data-idx="2">my-var</button>
      <button class="quiz-q__opt" data-idx="3">class</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. Que vaut x après : x = 5; x += 3; x -= 1 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">7</button>
      <button class="quiz-q__opt" data-idx="2">8</button>
      <button class="quiz-q__opt" data-idx="3">3</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>