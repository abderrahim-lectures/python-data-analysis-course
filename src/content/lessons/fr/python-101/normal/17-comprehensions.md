---
title: "Compréhensions"
description: "Construisez des listes, des dicts et des sets de manière concise avec la syntaxe de compréhension."
module: "data-structures"
order: 17
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Écrire des compréhensions de liste avec filtrage et conditions"
  - "Créer des compréhensions de dict et de set"
  - "Utiliser des compréhensions imbriquées pour les structures 2D"
  - "Savoir quand utiliser une compréhension plutôt qu'une boucle normale"
prerequisites: ["16-dicts-and-sets"]
tags: ["compréhensions", "list-comp", "dict-comp", "set-comp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## La notation de construction d'ensembles faite code

Les mathématiques ont une manière compacte de décrire une collection bâtie depuis une autre : le constructeur d'ensembles. La compréhension est cette notation, tapée directement :

$$
\{x^2 \mid x \in \{0, 1, \ldots, 5\}\} = \{0, 1, 4, 9, 16, 25\}.
$$

Lisez *« l'ensemble des $x^2$, pour chaque $x$ dans cette source »* — et le Python est la même phrase inversée en code :

```python
# Boucle normale
squares = []
for x in range(6):
    squares.append(x ** 2)

# Compréhension
squares = [x ** 2 for x in range(6)]
# [0, 1, 4, 9, 16, 25]
```

La boucle épelle trois mouvements — démarrer vide, ajouter, répéter ; la compréhension énonce toute la collection en une ligne qui reflète l'anatomie du constructeur : l'expression en tête, la variable parcourue derrière.

## Filtrer avec des conditions

La notation ensembliste porte aussi des tests d'appartenance. $\{w \in words \mid |w| > 2\}$ devient un `if` final :

```python
evens = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]

long_words = [w.upper() for w in ["hi", "hello", "hey"] if len(w) > 2]
# ['HELLO', 'HEY']
```

Un `if` à la fin est un *filtre* : seuls les éléments qui le passent parviennent à l'expression. L'élément voyage expression → filtre → liste, dans l'ordre où la phrase se lit.

## If/else comme expression

Le `if...else` que vous connaissez déjà est une *expression* — il produit une valeur. En coller un *avant* le `for` le plante dans la ligne de construction, choisissant par élément plutôt que filtrant par élément :

```python
labels = ["even" if x % 2 == 0 else "odd" for x in range(5)]
# ['even', 'odd', 'even', 'odd', 'even']
```

Les deux positions sont une fourche aux emplois distincts : après le `for`, la clause *vote* sur les éléments ; avant le `for`, elle les *étiquette*. L'une écarte, l'autre transforme.

## Compréhensions de dict

La même forme construit des correspondances — l'expression à gauche des deux points devient la clé, celle de droite la valeur :

```python
squares_dict = {x: x**2 for x in range(6)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Inverse un dict
original = {"a": 1, "b": 2}
inverted = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b'}
```

L'inversion est le classique élégant : parcourez `items()` et échangez quelle moitié de chaque paire devient la clé.

## Compréhensions de set

Les accolades avec une compréhension donnent un set — l'unicité appliquée automatiquement :

```python
lengths = {len(word) for word in ["hello", "hi", "hey"]}
# {2, 3, 5}  (longueurs uniques)
```

Trois longueurs s'effondrent en un ensemble de valeurs, laissant tomber le doublon comme un set le doit.

## Compréhensions imbriquées : l'aplatisseur

Une matrice est une liste de lignes, et l'aplatir fait tenir deux boucles en une expression — lisez les clauses `for` de gauche à droite, l'extérieure d'abord :

```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

Chaque `for` déballe un niveau : `row` parcourt la liste extérieure, `num` parcourt chaque ligne, et l'ordre de la collection suit les boucles exactement.

## Un exemple travaillé : trois lignes depuis le constructeur d'ensembles

Les trois mouvements de la leçon — construire, filtrer, étiqueter — une ligne chacun :

```python
squares = [x ** 2 for x in range(2, 9)]
# [4, 9, 16, 25, 36, 49, 64]

numbers = [x for x in range(1, 11) if x % 3 == 0]
# [3, 6, 9]

labels = ["even" if x % 2 == 0 else "odd" for x in numbers]
# ['odd', 'even', 'odd']
```

Le premier est $\{x^2 \mid x \in [2, 9)\}$, tapé tel quel ; le second filtre les diviseurs de $3$ ; le troisième étiquette chaque survivant. Ce que le constructeur d'ensembles dicte d'un souffle, la compréhension l'épelle en une ligne.

## Quand NE PAS utiliser de compréhension

- Quand la logique devient nouée — une boucle `for` normale gagne sa lisibilité.
- Quand le corps a besoin de `try/except` — les compréhensions n'ont pas la place pour cela.
- Quand les effets de bord comptent — imprimer ou écrire des fichiers doit être des déclarations délibérées, pas des expressions silencieuses.
- **Mettre `if` avant le `for` étiquette au lieu de filtrer.** `[x if x % 2 == 0 else 'odd' for x in ...]` garde chaque élément, à peine renommé ; seul un `if` après le `for` élimine. Mis à la mauvaise place, les rejetés restent silencieusement.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Aplatissez `[[1, 2], [3, 4], [5, 6]]` en `[1, 2, 3, 4, 5, 6]` avec une compréhension.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>[num for row in matrix for num in row]</code> — le <code>for</code> extérieur ouvre chaque ligne, l'intérieur la déroule.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Reliez des mots à leurs longueurs avec une compréhension de dict : `["hi", "hello", "hey"]` → `{"hi": 2, "hello": 5, "hey": 3}`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>{w: len(w) for w in words}</code> — le mot est la clé et sa longueur la valeur, une paire par entrée.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi `if...else` se tient-il avant le `for` dans une compréhension tandis que le `if` de filtre se traîne après ?
- Où une compréhension franchit-elle la ligne vers une lecture plus dure qu'une boucle ? Où la tirez-vous ?
- `await` peut-il apparaître dans une compréhension — et quelle syntaxe rend possible toute une version asynchrone ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-comprehensions">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Que produit <code>[x * 2 for x in range(4) if x > 1]</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[0, 2, 4, 6]</button>
      <button class="quiz-q__opt" data-idx="1">[2, 4]</button>
      <button class="quiz-q__opt" data-idx="2">[4, 6]</button>
      <button class="quiz-q__opt" data-idx="3">[0, 2]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. Quelle est la bonne compréhension de dict ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{k: v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="1">{k, v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="2">{k: v in items}</button>
      <button class="quiz-q__opt" data-idx="3">dict(k: v for k, v in items)</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>