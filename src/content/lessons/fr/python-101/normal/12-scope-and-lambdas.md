---
title: "Portée et lambdas"
description: "Comprenez la portée des variables et écrivez des fonctions inline concises."
module: "functions"
order: 12
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Comprendre la portée locale contre globale"
  - "Utiliser les mots-clés global et nonlocal"
  - "Écrire des fonctions lambda pour des opérations courtes"
  - "Appliquer les lambdas avec sorted(), map(), filter()"
prerequisites: ["11-defining-functions"]
tags: ["portée", "global", "lambda", "sorted", "map", "filter"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Portée locale

Les variables créées dans une fonction sont locales — elles n'existent pas en dehors :

```python
def my_func():
    x = 10
    print(x)  # works

my_func()
# print(x)  # NameError: x is not defined
```

## Portée globale

Les variables définies au niveau du module sont accessibles partout :

```python
counter = 0

def increment():
    global counter
    counter += 1

increment()
print(counter)  # 1
```

**Préférez renvoyer des valeurs plutôt que d'utiliser `global`** — cela rend le code plus facile à tester et à raisonner.

## Portée imbriquée et nonlocal

Les fonctions internes peuvent lire les variables de la fonction externe, mais ne peuvent pas les réaffecter sans `nonlocal` :

```python
def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter = make_counter()
print(counter())  # 1
print(counter())  # 2
```

## Fonctions lambda

`lambda` crée une petite fonction anonyme en une ligne :

```python
add = lambda a, b: a + b
print(add(3, 5))  # 8
```

Équivalent à :

```python
def add(a, b):
    return a + b
```

## Lambdas avec des fonctions d'ordre supérieur

Les lambdas brillent quand elles sont passées en argument à d'autres fonctions :

```python
students = [("Alice", 85), ("Bob", 92), ("Charlie", 78)]

# Sort by score (second element)
by_score = sorted(students, key=lambda s: s[1])
print(by_score)  # [('Charlie', 78), ('Alice', 85), ('Bob', 92)]

# Map: apply a function to every item
nums = [1, 2, 3, 4]
doubled = list(map(lambda x: x * 2, nums))
# [2, 4, 6, 8]

# Filter: keep items that pass a test
evens = list(filter(lambda x: x % 2 == 0, nums))
# [2, 4]
```

## Pièges courants

- **Utiliser `global` quand vous devriez renvoyer une valeur** — cela masque les effets de bord
- **Abuser des lambdas** — s'il faut plus d'une expression, utilisez `def`
- **Confondre les portées dans les fonctions imbriquées** — vérifiez toujours où une variable est définie

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Triez cette liste de mots par leur longueur : `words = ["banana", "pie", "Washington", "a"]`

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>sorted(words, key=lambda w: len(w))</code> → <code>['a', 'pie', 'banana', 'Washington']</code></p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Utilisez `filter` avec une lambda pour extraire tous les mots de plus de 3 caractères de `["hi", "hello", "hey", "howdy", "yo"]`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>list(filter(lambda w: len(w) > 3, words))</code> → <code>['hello', 'howdy']</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Pourquoi Python utilise-t-il `nonlocal` au lieu de laisser simplement les fonctions internes réaffecter les variables externes ? Quel problème cela résout-il ?
- Quand utiliseriez-vous `map`/`filter` avec des lambdas plutôt qu'une compréhension de liste ? L'un est-il meilleur ?
- Une lambda peut-elle avoir plusieurs instructions ? Pourquoi ou pourquoi pas ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

<div class="quiz" data-quiz="python-101-scope-lambdas">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Que renvoie <code>sorted(["banana", "pie", "a"], key=len)</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">['a', 'pie', 'banana']</button>
      <button class="quiz-q__opt" data-idx="1">['banana', 'pie', 'a']</button>
      <button class="quiz-q__opt" data-idx="2">['a', 'pie', 'banana']</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. Quel mot-clé permet à une fonction interne de modifier une variable externe ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">nonlocal</button>
      <button class="quiz-q__opt" data-idx="1">global</button>
      <button class="quiz-q__opt" data-idx="2">outer</button>
      <button class="quiz-q__opt" data-idx="3">closure</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>