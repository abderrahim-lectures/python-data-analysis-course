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

## Pourquoi une valeur a-t-elle besoin d'un nom ?

Écrivez un programme qui calcule la moyenne de trois notes d'interrogation :

$$
\bar{x} = \frac{7.5 + 8.5 + 9.0}{3} = \frac{25.0}{3} \approx 8,33.
$$

Supposez maintenant que les notes changent — le professeur veut la moyenne de $9.5, 8.5, 10.0$. Sans noms, l'expression de la moyenne apparaît à plusieurs endroits et vous devez en localiser et en modifier chacun à la main. C'est une recette pour en oublier un.

Un mathématicien résout cela en *nommant les quantités* : écrivez $x_1, x_2, x_3$ une fois, puis référez-vous-y pour toujours. Un programme a le même besoin : les valeurs apparaissent sans cesse, et la machine doit retrouver la valeur actuelle à chaque fois. La réponse de Python est la **variable** — un nom qui pointe vers une valeur. Dès que `score1` nomme le $7.5$, vous pouvez écrire `score1` autant de fois que vous voulez, et Python cherche sa valeur actuelle à chaque fois.

## `=` relie un nom à une valeur

En mathématiques, « soit $x = 5$ » fixe le symbole $x$ au nombre $5$. Python fait la même chose avec exactement le même symbole :

```python
score1 = 7.5
score2 = 8.5
score3 = 9.0

average = (score1 + score2 + score3) / 3
print(f"{average:.2f}")    # 8.33
```

Le membre de droite est évalué *d'abord*, et seulement ensuite le nom de gauche commence à pointer vers le résultat. Si vous changez les notes et relancez le fichier, le même calcul utilisera les nouvelles valeurs — les noms donnent à la machine un endroit où chercher « la valeur actuelle de $7.5$ ».

## Les noms peuvent être redirigés

C'est ici qu'une variable ne ressemble *pas* à un symbole mathématique. En mathématiques, $x = x + 1$ est une affirmation sans solution. En Python, c'est une instruction parfaitement ordinaire, qui se lit de droite à gauche :

$$
x_{n+1} = x_n + 1
$$

signifie « la valeur suivante de $x$ est la valeur actuelle, plus un ». Dès que vous voyez cela en Python, vous comptez :

```python
count = 0
count = count + 1    # l'ancienne valeur 0 a été lue, 1 a été calculé, le nom pointe maintenant vers 1
count = count + 1    # désormais count nomme 2
```

Réaffecter consiste à *rediriger une étiquette*, pas à remplir une boîte. L'ancienne valeur n'est ni « modifiée » ni « remplacée » — le nom regarde simplement une autre valeur.

## Lire-modifier-stocker en un seul geste : `+=`

Le schéma ci-dessus — lire `count`, ajouter `1`, faire pointer `count` vers le résultat — est si répandu que Python offre un raccourci. Disons que le pas vaut $h$ et que vous parcourez une suite générique :

$$
x_{n+1} = x_n + h.
$$

Écrite, la mise à jour se lit `x = x + h`. Python fusionne la lecture et le stockage en un seul opérateur :

```python
x = 5
x += 1     # identique à x = x + 1   -> 6
x -= 2     # identique à x = x - 2   -> 4
x *= 3     # identique à x = x * 3   -> 12
x /= 4     # identique à x = x / 4   -> 3.0
```

Lisez `x += h` à voix haute comme *« avance x de h »* — un seul mouvement, comme le fait la récurrence.

## Un nom que l'on peut prononcer

Presque n'importe quel mot peut servir de nom, mais *être valide* n'est pas la même chose qu'*être bon*. Qu'est-ce qui est le plus instructif en relisant un script de notes ?

```python
x = 87.5                 # nomme un nombre, rien de plus
quiz_score = 87.5        # nomme la grandeur
```

Quelques règles et une habitude :

- Un nom commence par une lettre ou un tiret bas et ne peut contenir ensuite que des lettres, des chiffres et des tirets bas — `second_score` ✓, `2nd_score` ✗.
- La convention de Python est le **snake_case** : des mots en minuscules reliés par `_`, donc `student_name`, pas `studentName`. Cela correspond à la lecture à voix haute : `quiz_score`, c'est la note de l'interrogation.
- Un petit ensemble de mots est **réservé** — `if`, `for`, `class`, `True`, `False` — et ne peut pas servir de nom.

Vous relirez votre propre code plus souvent que vous ne l'écrivez ; le nom que vous choisissez en écrivant est ce qui fera ressortir le sens quand vous lirez plus tard.

## Un exemple travaillé : le total cumulé

Réassigner paie dès qu'une quantité doit se construire pas à pas — la récurrence $x_{n+1} = x_n + h$ avec la somme en cours comme $x_n$ :

```python
total = 0
total += 8.5     # total devient 8.5
total += 9.0     # puis 17.5
total += 10.0    # puis 27.5
average = total / 3
print(f"{average:.2f}")   # 9.17
```

Chaque `+=` avance d'un pas : lire la valeur actuelle, additionner, re-pointer le nom vers le résultat. Les noms `total` et `average` maintiennent les deux quantités distinctes, si bien que la recette se lit comme ce qu'elle fait.

## Pièges courants

- **Utiliser un mot réservé comme nom.** `class = "Math"` lève une `SyntaxError` — `class` est réservé.
- **Commencer par un chiffre.** `2nd_place = "B"` est invalide ; `second_place = "B"` est correct.
- **Confondre `=` et `==`.** `=` fait pointer un nom vers une valeur ; `==` demande si deux valeurs sont égales. Un glissement d'un caractère transforme une affirmation en question.
- **`+=` écrit sur un nom qui doit déjà exister.** `total += 1` sur un nom jamais assigné lève une `NameError`. Le geste lit d'abord la valeur actuelle ; un nom sans valeur n'a rien à lire.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Si `x = 5`, puis `y = x`, puis `x = 10`, que vaut `y` ? Expliquez pourquoi en termes de « les noms pointent vers des valeurs » et non « les boîtes contiennent des valeurs ».

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>y</code> vaut toujours <code>5</code>. Quand <code>y = x</code> s'est exécuté, les deux noms pointaient vers <code>5</code>. Rediriger <code>x</code> vers <code>10</code> déplace l'étiquette de <code>x</code> ; <code>y</code> pointe toujours vers <code>5</code>. Les étiquettes pointent ; rien n'est « copié dans une boîte ».</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Écrivez un programme qui échange deux variables : `a = 7`, `b = 3`. Après l'échange, `a` doit valoir `3` et `b` doit valoir `7`. Faites-le sans variable temporaire (Python a un petit truc élégant).

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>a, b = b, a</code> — Python évalue d'abord le membre de droite (les deux anciennes valeurs), puis fait pointer les noms de gauche vers elles. Pas de variable temporaire.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Lesquels de ces noms de variable sont valides, et pourquoi les invalides échouent-ils : `_count`, `2nd`, `my-name`, `total`, `class` ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>_count</code> ✓ (commencer par un tiret bas est permis), <code>2nd</code> ✗ (commence par un chiffre), <code>my-name</code> ✗ (le trait d'union est l'opérateur de soustraction, interdit dans un nom), <code>total</code> ✓, <code>class</code> ✗ (mot réservé).</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi Python choisit-il le `snake_case` plutôt que le `camelCase` ? Que suggère la métaphore visuelle du tiret bas sur la façon de lire les noms de variables ?
- `x += 1` et `x = x + 1` donnent le même résultat pour les nombres. Pouvez-vous imaginer une raison pour laquelle un langage offrirait quand même les deux formes ?
- Si les variables sont des *étiquettes, pas des boîtes*, que se produit-il avec `a = [1, 2, 3]`, puis `b = a`, puis `b.append(4)` ? Est-ce que `a` voit le `4` ? (Essayez — cela annonce les objets mutables, vus bien plus tard.)

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-variables">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Que vaut y après : x = 10; y = x; x = 20 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">20</button>
      <button class="quiz-q__opt" data-idx="1">10 et 20</button>
      <button class="quiz-q__opt" data-idx="2">10</button>
      <button class="quiz-q__opt" data-idx="3">Erreur</button>
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