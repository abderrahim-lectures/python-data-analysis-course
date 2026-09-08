---
title: "Boucles For et While"
description: "Répétez des actions sur des séquences et jusqu'à ce que des conditions changent."
module: "control-flow"
order: 9
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Itérer sur des listes, des chaînes et des ranges avec des boucles for"
  - "Utiliser les boucles while pour une répétition basée sur des conditions"
  - "Contrôler le flux des boucles avec break, continue et pass"
  - "Éviter les boucles infinies"
prerequisites: ["08-if-elif-else"]
tags: ["for", "while", "boucles", "break", "continue"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Boucles for

Une boucle `for` itère sur chaque élément d'une séquence :

```python
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
# apple
# banana
# cherry
```

Cela fonctionne aussi avec les chaînes — elle itère sur les caractères :

```python
for letter in "Python":
    print(letter)
```

## Boucles while

Une boucle `while` s'exécute tant que sa condition est `True` :

```python
count = 0
while count < 5:
    print(count)
    count += 1
# 0 1 2 3 4
```

**Assurez-vous toujours que la condition finit par devenir `False`**, sinon vous créez une boucle infinie.

## Break et continue

`break` quitte la boucle immédiatement. `continue` passe à l'itération suivante :

```python
# break — stop at the first even number
for n in [1, 3, 4, 7, 8]:
    if n % 2 == 0:
        print(f"Found even: {n}")
        break

# continue — skip odd numbers
for n in range(6):
    if n % 2 != 0:
        continue
    print(n)  # 0 2 4
```

## Pass

`pass` est un espace réservé qui ne fait rien. Utilisez-le quand vous avez besoin d'un bloc syntaxiquement valide :

```python
for n in range(10):
    if n % 3 == 0:
        pass  # TODO: handle multiples of 3 later
    else:
        print(n)
```

## Pièges courants

- **Boucles `while` infinies** : oublier de mettre à jour la variable de condition
- **Modifier une liste pendant l'itération** : utilisez plutôt une copie ou une compréhension de liste
- **`for` avec `range(len(...))`** : le code pythonique itère généralement directement sur la séquence

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez une boucle `for` qui affiche les 10 premiers nombres divisibles par 3 (3, 6, 9, ..., 30).

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>for i in range(3, 31, 3): print(i)</code> — <code>range(3, 31, 3)</code> commence à 3, va jusqu'à 30, en avançant par pas de 3.</p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez une boucle `while` qui demande une entrée en répétition (simulez avec une liste) et qui s'arrête quand elle voit `"quit"`. Affichez chaque entrée.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>inputs = ["hello", "world", "quit"]; i = 0; while i < len(inputs) and inputs[i] != "quit": print(inputs[i]); i += 1</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Quand choisiriez-vous `while` plutôt que `for` ? Donnez un exemple réel de chacun.
- Que se passe-t-il si vous modifiez une liste dans une boucle `for` qui itère dessus ? Comment éviteriez-vous le problème ?
- Pourquoi Python n'a-t-il pas de boucle `do...while` comme C ou JavaScript ? Comment simule-t-on une telle boucle ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

<div class="quiz" data-quiz="python-101-loops">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Qu'affiche <code>for i in range(0, 10, 3): print(i, end=" ")</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0 1 2 3 4 5 6 7 8 9</button>
      <button class="quiz-q__opt" data-idx="1">0 3 6 9</button>
      <button class="quiz-q__opt" data-idx="2">3 6 9</button>
      <button class="quiz-q__opt" data-idx="3">0 3 6</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Quel mot-clé saute le reste de l'itération de boucle en cours ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">break</button>
      <button class="quiz-q__opt" data-idx="1">pass</button>
      <button class="quiz-q__opt" data-idx="2">continue</button>
      <button class="quiz-q__opt" data-idx="3">skip</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>