---
title: "Dicts et sets"
description: "Mappez des clés vers des valeurs avec les dicts et stockez des éléments uniques avec les sets."
module: "data-structures"
order: 16
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Créer et accéder à des dictionnaires avec [] et .get()"
  - "Itérer sur les clés, les valeurs et les éléments des dicts"
  - "Utiliser les opérations d'ensemble : union, intersection, différence"
  - "Comprendre les exigences de hachage des dicts et des sets"
prerequisites: ["15-lists-and-tuples"]
tags: ["dict", "set", "clés", "valeurs", "items", "union", "intersection"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Dictionnaires

Les dicts mappent des clés vers des valeurs — comme un vrai dictionnaire mappe des mots vers des définitions :

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}
print(scores["Alice"])       # 85
print(scores.get("Dave", 0)) # 0 (default if key missing)
```

## Méthodes de dict

```python
scores = {"Alice": 85, "Bob": 92}

scores.keys()         # dict_keys(['Alice', 'Bob'])
scores.values()       # dict_values([85, 92])
scores.items()        # dict_items([('Alice', 85), ('Bob', 92)])

scores["Dave"] = 78   # add new pair
del scores["Bob"]     # remove by key
scores.pop("Alice")   # remove and return value

scores.update({"Eve": 95, "Frank": 88})  # merge
scores.setdefault("Grace", 0)  # set only if key missing
```

## Itérer sur les dicts

```python
for name in scores:           # keys
    print(name)

for name, score in scores.items():  # key-value pairs
    print(f"{name}: {score}")
```

## Sets

Les sets stockent des valeurs **uniques**, non ordonnées :

```python
colors = {"red", "blue", "green", "red"}
print(colors)  # {'red', 'blue', 'green'}  (duplicates removed)
```

## Opérations d'ensemble

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

a | b    # {1, 2, 3, 4, 5, 6}  (union)
a & b    # {3, 4}              (intersection)
a - b    # {1, 2}              (difference)
a ^ b    # {1, 2, 5, 6}       (symmetric difference)
```

Les sets sont rapides pour tester l'appartenance : `x in my_set` est en O(1) contre O(n) pour les listes.

## Exigence de hachage

Les clés de dict et les éléments de set doivent être **hapables** (immuables) : les chaînes, les nombres et les tuples fonctionnent. Les listes et les autres dicts non :

```python
{[1, 2]: "bad"}   # TypeError: unhashable type: 'list'
{(1, 2): "good"}  # Works — tuple is hashable
```

## Pièges courants

- **Accéder à des clés manquantes** : utilisez `.get()` ou `in` pour éviter un `KeyError`
- **L'ordre des dicts** : Python 3.7+ préserve l'ordre d'insertion, mais ne vous y fiez pas pour l'égalité
- **Les sets perdent l'ordre** : ne comptez jamais sur l'ordre d'itération d'un set

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Comptez la fréquence de chaque caractère de `"hello world"` en utilisant un dict.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>freq = {}; for c in "hello world": freq[c] = freq.get(c, 0) + 1</code></p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Étant donné deux listes, trouvez les éléments qui apparaissent dans les deux en utilisant un set.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>set(a) & set(b)</code> ou <code>set(a).intersection(b)</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Pourquoi ne pouvez-vous pas utiliser une liste comme clé de dict ? Quelle propriété une clé doit-elle avoir ?
- Quand utiliseriez-vous un set plutôt qu'une liste ? Que perdez-vous et que gagnez-vous ?
- En quoi `dict.get(key, default)` diffère-t-il de `dict[key]` ? Quand préféreriez-vous l'un ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

<div class="quiz" data-quiz="python-101-dicts-sets">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. Que renvoie <code>{"a": 1, "b": 2}.get("c", 0)</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0</button>
      <button class="quiz-q__opt" data-idx="1">None</button>
      <button class="quiz-q__opt" data-idx="2">KeyError</button>
      <button class="quiz-q__opt" data-idx="3">'c'</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Que vaut <code>{1, 2, 3} ^ {2, 3, 4}</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{2, 3}</button>
      <button class="quiz-q__opt" data-idx="1">{1, 4}</button>
      <button class="quiz-q__opt" data-idx="2">{1, 2, 3, 4}</button>
      <button class="quiz-q__opt" data-idx="3">{1, 2, 3}</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>