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

## Les deux machines qui répètent

Écrivez un programme pour additionner les cent premiers entiers et vos mains s'engourdissent. Les mathématiciens ont abstrait la répétition en un symbole bien avant l'existence des ordinateurs :

$$
\sum_{i=1}^{100} i = 1 + 2 + \cdots + 100
$$

Le signe $\sum$ est une instruction de répéter. Une boucle est le $\sum$ de l'ordinateur — et Python scinde l'idée en deux machines pour deux sortes de répétition. `for` répète sur une *séquence connue*. `while` répète *jusqu'à ce qu'une condition cesse d'être vraie*.

## For : une répétition sur une séquence

Une boucle `for` visite chaque élément d'une séquence, un par tour :

```python
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
# apple
# banana
# cherry
```

Lisez-la comme elle s'exécute : *« pour chaque fruit **dans** la liste, fais ceci. »* La variable de boucle, `fruit`, prend une nouvelle valeur à chaque tour jusqu'à épuiser la liste.

Les chaînes sont aussi des séquences — les éléments sont des caractères :

```python
for letter in "Python":
    print(letter)
```

Puisqu'un caractère est un élément unique, la mathématique et la machine s'accordent : itérer sur une chaîne de longueur $n$ exécute exactement $n$ tours.

## La séquence numérique : range

La plupart des sommes portent sur des nombres, donc Python fournit `range` — une séquence que vous pouvez parcourir à pas :

```python
for n in range(5):
    print(n)   # 0 1 2 3 4
```

`range(5)` produit la progression arithmétique $0, 1, 2, 3, 4$, comme l'ensemble des indices de $\sum_{i=0}^{4} a_i$. Deux arguments de plus lui donnent la forme voulue : `range(start, stop, step)` marche depuis `start`, par pas de `step`, s'arrêtant avant `stop` :

```python
for n in range(10, 0, -2):
    print(n)   # 10 8 6 4 2
```

La règle d'arrêt mérite un énoncé exact : $n$ voyage tant que $n < \text{stop}$ (ou $n > \text{stop}$ avec un pas négatif), comme un intervalle semi-ouvert $[\text{start}, \text{stop})$.

## While : une répétition jusqu'à une condition

Certaines tâches ne peuvent pas énumérer leurs tours à l'avance — on continue jusqu'à ce qu'une condition bascule. L'approximation de Newton est le prototype : on raffine jusqu'à ce que le changement tombe sous une tolérance. C'est une boucle `while` :

```python
count = 0
while count < 5:
    print(count)
    count += 1
# 0 1 2 3 4
```

La condition est en haut et se revérifie à chaque tour. **Assurez-vous qu'elle finisse par devenir `False`** — si rien dans le corps ne change les variables que la condition lit, la boucle ne finit jamais. Une somme qui se doit de terminer s'écrit en `for` ; une recherche qui ne finit qu'en trouvant sa réponse s'écrit en `while`.

## Break et continue

Deux mots-clés ajustent le flux depuis l'intérieur.

`break` abandonne la boucle immédiatement, quel que soit le nombre de tours restants :

```python
for n in [1, 3, 4, 7, 8]:
    if n % 2 == 0:
        print(f"Found even: {n}")
        break
```

`continue` n'abandonne que *ce* tour, sautant au suivant :

```python
for n in range(6):
    if n % 2 != 0:
        continue
    print(n)  # 0 2 4
```

Entre eux, les concepts épousent la droite numérique : `break` tranche la queue $\{n \in \mathbb{Z} : n \geq m\}$ ; `continue` excave un sous-ensemble de tours, comme filtrer une progression avec un crible.

## Pass : un marqueur vide

Tout corps de `if`, `for`, `while` et de fonction doit contenir au moins une instruction, mais parfois vous ne l'avez pas encore écrite. `pass` est le no-op qui occupe la place :

```python
for n in range(10):
    if n % 3 == 0:
        pass  # TODO: handle multiples of 3 later
    else:
        print(n)
```

Il ne fait rien — ce qui est précisément son rôle : garder le bloc syntaxiquement valide pendant que la vraie instruction est en cours de rédaction.

## Un exemple travaillé : la machine Σ au travail

Les outils de cette leçon se composent dans le symbole de sommation de l'ouverture :

```python
total = 0
for n in range(1, 11):
    if n % 2 != 0:
        continue          # pairs seulement
    total += n
print(total)              # 2 + 4 + 6 + 8 + 10 = 30
```

La boucle est $\sum$ mécanisé : chaque tour additionne un terme, `continue` tamise les tours impairs, et `total` s'accumule comme le total cumulé de la leçon 02.

## Pièges courants

- **Boucles `while` infinies.** Oubliez de mettre à jour la variable lue par la condition et la boucle tournera à jamais. Vérifiez que le corps fait avancer l'état vers `False`.
- **Modifier une liste pendant qu'on l'itère.** Trancher ou supprimer des éléments en cours de route déplace les indices sous vos pieds. Itérez sur une copie, ou construisez une nouvelle liste.
- **`for i in range(len(items))`.** Sauf si vous avez besoin de l'indice lui-même, itérez directement sur la séquence — `for fruit in fruits` dit ce que vous voulez.
- **`continue` saute le tour ; `break` abandonne la boucle.** `continue` ne saute que l'itération actuelle ; `break` termine la boucle entière. Les confondre, c'est ainsi qu'une boucle qui devait s'arrêter continue de tourner.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Écrivez une boucle `for` qui imprime les dix premiers multiples de 3 : $3, 6, 9, \ldots, 30$.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>for i in range(3, 31, 3): print(i)</code> — <code>range(3, 31, 3)</code> commence à 3, avance de 3 en 3 et s'arrête avant 31, tombant exactement sur $3, 6, \ldots, 30$.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Écrivez une boucle `while` qui parcourt une file d'attente (simulez-la avec une liste) et s'arrête à l'élément `"quit"`, en imprimant chaque élément qu'elle franchit.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>inputs = ["hello", "world", "quit"]; i = 0; while inputs[i] != "quit": print(inputs[i]); i += 1</code> — la condition garde le sentinelle et l'indice fait avancer l'état vers lui.</p>

</div>
</details>

## 🤔 Questions socratiques

- Quand tendez-vous vers `while` plutôt que `for` ? Donnez une vraie tâche pour chacun — une qui se compte à l'avance, une qui ne se compte pas.
- Qu'arrive-t-il à une liste que vous modifiez pendant qu'une boucle `for` la parcourt ? Comment l'éviter ?
- Python n'a pas de `do…while` comme C. Comment écrivez-vous un corps qui doit s'exécuter au moins une fois avant toute vérification de condition ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-loops">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Qu'imprime <code>for i in range(0, 10, 3): print(i, end=" ")</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0 1 2 3 4 5 6 7 8 9</button>
      <button class="quiz-q__opt" data-idx="1">0 3 6 9</button>
      <button class="quiz-q__opt" data-idx="2">3 6 9</button>
      <button class="quiz-q__opt" data-idx="3">0 3 6</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Quel mot-clé saute le reste de l'itération actuelle de la boucle ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">break</button>
      <button class="quiz-q__opt" data-idx="1">pass</button>
      <button class="quiz-q__opt" data-idx="2">continue</button>
      <button class="quiz-q__opt" data-idx="3">skip</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>