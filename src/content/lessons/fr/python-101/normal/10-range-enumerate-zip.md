---
title: "Range, Enumerate et Zip"
description: "Générez des séquences de nombres, suivez les indices et combinez des itérables."
module: "control-flow"
order: 10
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Utiliser range() pour générer des séquences de nombres"
  - "Utiliser enumerate() pour obtenir l'indice et la valeur pendant l'itération"
  - "Utiliser zip() pour itérer sur plusieurs séquences en parallèle"
  - "Écrire des boucles pythoniques qui évitent le suivi manuel d'indices"
prerequisites: ["09-for-while-loops"]
tags: ["range", "enumerate", "zip", "itération"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Trois outils qui supplantent le comptage manuel

Les boucles vous ont donné la répétition ; cette leçon vous remet les trois aides qui vous ôtent le comptage des mains. Chacun remplace une habitude qu'on vous a apprise à la main, et chacun répond à une irritation récurrente : générer des nombres, avoir besoin de la position d'un élément, et apparier deux listes. Ensemble, ils font la différence entre une boucle qui tape et une boucle qui se lit.

## Range : la séquence arithmétique, paresseuse

Dans la leçon précédente vous avez sommée avec `range(5)`. Cet outil mérite un regard attentif — c'est l'outil classique du *« fais ceci un nombre connu de fois »* :

```python
for i in range(5):
    print(i)  # 0 1 2 3 4
```

`range` a trois formes, miroir de la progression arithmétique $a, a+d, a+2d, \ldots$ :

```python
range(5)        # 0, 1, 2, 3, 4
range(2, 8)     # 2, 3, 4, 5, 6, 7
range(0, 20, 3) # 0, 3, 6, 9, 12, 15, 18
```

Un argument donne $0, 1, \ldots, n-1$ ; deux donnent l'intervalle semi-ouvert $[\text{start}, \text{stop})$ ; trois ajoutent la différence commune $d$. Surtout, `range` est **paresseux** : il enregistre les paramètres et calcule chaque valeur seulement quand la boucle la demande. Demander un million de pas ne coûte pas plus de mémoire que d'en demander cinq — la séquence n'est jamais matérialisée.

## Enumerate : la position, sans le compteur

Vous voulez la position de chaque élément ? L'instinct de débutant est un compteur manuel :

```python
fruits = ["apple", "banana", "cherry"]

i = 0
for fruit in fruits:
    print(f"{i}: {fruit}")
    i += 1
```

Le `i += 1` est une tentation à se désynchroniser : oubliez-en un, et les étiquettes de position s'embrouillent. `enumerate` produit les deux moitiés en une étape — l'indice et l'élément — de sorte qu'il n'y a rien à synchroniser :

```python
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")

# Les sondeurs numérotent les gens à partir de 1 :
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}: {fruit}")
```

Là où un mathématicien écrit $b_i = a_i + i$ pour attacher la position à la valeur, `enumerate` remet la paire $(i, a_i)$ directement au corps de la boucle.

## Zip : un alignement par position

Deux listes parallèles — noms et scores — réclament d'être lues ensemble. `zip` les aligne élément par élément :

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Alice: 85
# Bob: 92
# Charlie: 78
```

L'appariement est le truc cartésien de courir le long des deux listes avec un seul curseur, formant les tuples $(n_0, s_0), (n_1, s_1), \ldots$. Quand les listes diffèrent en longueur, l'appariement s'arrête à la plus courte, si bien que rien n'est jamais à demi apparié. S'il vous faut aussi la queue tordue, `itertools.zip_longest` la comble :

```python
import itertools
for pair in itertools.zip_longest([1, 2], [3, 4, 5], fillvalue=0):
    print(pair)  # (1, 3), (2, 4), (0, 5) — aucune valeur n'est perdue
```

## Un exemple travaillé : le registre de la classe

Voyez les trois outils composer ensemble. Un enseignant tient une liste de noms et une liste parallèle de notes, et veut un rapport numéroté :

```python
names = ["Dina", "Omar", "Sara"]
scores = [78, 91, 85]

for i, (name, score) in enumerate(zip(names, scores), start=1):
    print(f"#{i} {name}: {score}")
# #1 Dina: 78
# #2 Omar: 91
# #3 Sara: 85

print(f"Top score: {max(scores)}")   # Top score: 91
```

Lisez l'en-tête de boucle de l'intérieur vers l'extérieur : `zip` apparie chaque nom à sa note ; les parenthèses `(name, score)` déballent cette paire ; `enumerate` numérote les paires à partir de un. Quatre gestes qui vous auraient coûté un compteur écrit à la main se lisent désormais comme la phrase qu'ils décrivent — la position s'attache à la valeur, paire par paire, exactement comme $b_i = a_i + i$ attache un indice à chaque terme.

## Pièges courants

- **`range` est exclusif en haut.** `range(5)` produit $0, 1, 2, 3, 4$ — cinq nombres, aucun égal à $5$. Pensez intervalle semi-ouvert, $[0, 5)$.
- **`enumerate` sur un dict.** Itérer un dict donne ses clés ; `enumerate` numéroterait les clés, pas les paires. Utilisez `dict.items()` pour la clé et la valeur.
- **`zip` avec des longueurs inégales.** Les éléments au-delà de l'entrée courte s'évanouissent en silence. Notez la perte, ou comblez avec `zip_longest`.
- **`zip` est un itérateur à usage unique.** En Python 3, `p = zip(a, b)` vous tend un itérateur, pas une liste : `list(p)` le consomme, et un second `list(p)` est vide. Convertissez sans tarder avec `list(zip(a, b))` quand vous revisiterez les paires.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Utilisez `enumerate` pour imprimer chaque couleur de `colors = ["red", "green", "blue"]` avec sa position commençant à 1.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>for i, color in enumerate(colors, 1): print(f"{i}. {color}")</code> — l'argument <code>start</code> renumérote les paires à partir de un.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Avec `keys = ["a", "b"]` et `values = [1, 2]`, utilisez `zip` pour construire un dictionnaire.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>dict(zip(keys, values))</code> → <code>{"a": 1, "b": 2}</code> — les paires alignées deviennent les entrées du mapping.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi préférer `range` à écrire la liste `[0, 1, 2, 3, 4]` ? Qu'est-ce qui change si la liste devait contenir un million de nombres ?
- Puisque `zip` s'arrête à l'entrée la plus courte, comment détecteriez-vous quel côté était le court ? Quand cette distinction importe-t-elle ?
- `enumerate` peut-il parcourir un dict ? Que numérotent exactement les indices ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-range-enumerate-zip">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que vaut <code>list(range(1, 10, 2))</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1, 2, 3, 4, 5, 6, 7, 8, 9]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 3, 5, 7, 9]</button>
      <button class="quiz-q__opt" data-idx="2">[2, 4, 6, 8]</button>
      <button class="quiz-q__opt" data-idx="3">[1, 2, 4, 8]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Que renvoie <code>list(zip([1, 2], [3, 4, 5]))</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[(1, 3), (2, 4), (5,)]</button>
      <button class="quiz-q__opt" data-idx="1">[(1, 3, 5), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="2">[(1, 3), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="3">[(1, 2), (3, 4, 5)]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>