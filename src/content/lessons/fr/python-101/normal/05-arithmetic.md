---
title: "Opérateurs arithmétiques"
description: "Additionnez, soustrayez, multipliez, divisez, divisez entièrement, module et puissances — les huit opérateurs arithmétiques."
module: "operators"
order: 5
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Utiliser les huit opérateurs arithmétiques : +, -, *, /, //, %, **"
  - "Comprendre la division entière contre la division réelle"
  - "Appliquer la précédence des opérateurs (PEMDAS)"
  - "Utiliser des parenthèses pour outrepasser la précédence"
prerequisites: ["04-type-conversion"]
tags: ["arithmétique", "division", "modulo", "puissance", "précédence"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Les opérateurs qu'une machine vole aux mathématiques

Vous avez écrit des fonctions auxiliaires dans les leçons précédentes : stocker une valeur, l'imprimer, changer son type. Rien de tout cela n'est utile tant qu'un programme ne peut *faire quelque chose* avec les nombres. Faites donc une pause : un ordinateur existe pour évaluer des expressions, et toute expression se construit avec des **opérateurs** qui joignent des valeurs. Vous connaissez déjà ceux de l'arithmétique sur papier — mais la machine coupe deux d'entre eux en morceaux.

## Les opérateurs et leurs significations

Python en fournit huit. Les quatre premiers sont exactement ce que vous attendez :

```python
7 + 2    # 9   — addition
7 - 2    # 5   — soustraction
7 * 2    # 14  — multiplication
7 / 2    # 3.5 — division réelle (renvoie toujours un float)
```

Viennent ensuite trois qui répondent à des questions que vous ne posiez qu'en devoir :

```python
7 // 2   # 3   — division entière (arrondit vers −∞)
7 % 2    # 1   — modulo (le reste)
7 ** 2   # 49  — puissance (7²)
```

`**` est l'écriture par Python d'une puissance : $7^2 = 49$. Les deux nouveaux venus sont `//` et `%`, et ce ne sont pas des variantes — ce sont les deux moitiés d'une seule question légitime.

## Deux moitiés d'une seule division

Posez une question réelle : *combien de groupes entiers de 4 tiennent dans 15, et que reste-t-il ?*

$$
15 = 4 \cdot 3 + 3.
$$

La réponse comporte deux parties — le quotient $3$ et le reste $3$. Le `//` de Python répond à la première et le `%` à la seconde :

$$
a = (a \mathbin{//} b) \cdot b + (a \mathbin{\%} b)
$$

```python
15 // 4   # 3   — combien de groupes de 4
15 % 4    # 3   — ce qui reste
4 * 3 + 3 # 15  ✓ l'identité se vérifie
```

Cette identité n'est pas une décoration — c'est la définition des deux opérateurs, et elle ne peut faillir tant que la même machine calcule les deux parties.

Il y a un pli. Quel quotient Python rapporte-t-il pour $-7 \div 2$ ? Écrivez-le comme une question de groupement :

$$
-7 = 2 \cdot ? + ?.
$$

Les options sont $2 \cdot (-3) + (-1)$ ou $2 \cdot (-4) + 1$. Python prend le plancher, comme la fonction mathématique $\lfloor x \rfloor$ :

```python
-7 // 2   # -4 — floor(-3.5) = -4, pas -3
-7 % 2    # 1  — cohérent avec le plancher : -7 = 2·(-4) + 1
```

Les deux opérateurs restent fidèles l'un à l'autre : l'identité $a = (a//b)\cdot b + (a\%b)$ tient sans exception, et cela vaut mieux que « la réponse intuitive ».

## L'ordre des opérations, tranché

Dans une expression à plusieurs opérateurs, il faut un ordre fixe, sinon chaque lecteur calculerait une valeur différente pour $2 + 3 \cdot 4$. Python adopte l'ordre appris sous le nom PEMDAS :

- `**` d'abord (puissance)
- puis `*`, `/`, `//`, `%` (de gauche à droite)
- puis `+`, `-` (de gauche à droite)

```python
2 + 3 * 4      # 14, pas 20
(2 + 3) * 4    # 20 — les parenthèses outrepassent
2 ** 3 ** 2    # 512, pas 64
```

Ce dernier est une vraie surprise. `**` est **associatif à droite**, donc `2 ** 3 ** 2` se lit $2^{(3^2)} = 2^9 = 512$, comme dans la notation empilée où les puissances grimpent dans une seule direction. Dans le doute, écrivez les parenthèses — un lecteur qui ne les voit pas ne devinera pas votre intention.

## Un exemple travaillé : le reste du plan de lecture

La paire quotient/reste fait tourner un plan de lecture :

```python
pages = 301
per_day = 30
days = pages // per_day      # 10 — jours entiers de lecture
leftover = pages % per_day   # 1  — le reste du onzième jour

print(f"{days} full days, {leftover} leftover")
days * per_day + leftover    # 301 — l'identité tient
```

L'identité de division $a = (a \mathbin{//} b) \cdot b + (a \mathbin{\%} b)$ devient un grand livre : `days` et `leftover` sont ses deux colonnes, et l'identité est le reçu qui prouve qu'aucune perte n'a eu lieu.

## Pièges courants

- **`/` contre `//`.** `7 / 2` vaut `3.5` (un float) ; `7 // 2` vaut `3` (un int). Prenez `//` seulement quand le quotient entier est ce que le problème demande.
- **Division entière avec des négatifs.** `-7 // 2` vaut `-4`, pas `-3`. Le plancher va vers $-\infty$, pas vers zéro.
- **`%` fonctionne aussi sur les floats.** `7.5 % 2` vaut `1.5` — l'identité ci-dessus vaut pour les réels comme pour les entiers.
- **`**` lie plus fort que `*`.** `2 * 3 ** 2` vaut `18`, pas `36` — la puissance se calcule d'abord. Mettez des parenthèses quand vous voulez dire `(2 * 3) ** 2` = 36.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Sans l'exécuter, calculez `15 // 4` et `15 % 4` à la main, puis vérifiez que $4 \cdot (15 // 4) + (15 \% 4)$ reproduit $15$.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>15 // 4</code> vaut <code>3</code> (le plancher de $3.75$), et <code>15 % 4</code> vaut <code>3</code>, puisque $15 = 4\cdot 3 + 3$. Ensemble, <code>4 * 3 + 3 = 15</code> — l'identité de la division, vérifiée.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Comment extrairiez-vous le chiffre des centaines d'un nombre ? Avec `n = 4567`, obtenez `5` en n'utilisant que l'arithmétique, sans chaînes.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>(n // 100) % 10</code> — divisez d'abord par 100 pour déplacer le chiffre vers la droite (<code>4567 → 45</code>), puis modulo 10 pour ne garder que le dernier (<code>45 → 5</code>).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Pourquoi Python emploie-t-il `**` pour la puissance au lieu de `^` ? Que fait `^` en réalité en Python ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>^</code> est l'opérateur XOR bit à bit en Python, pas la puissance. Python utilise <code>**</code> pour éviter le conflit avec la convention des langages où <code>^</code> signifie XOR.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi la division entière arrondit-elle vers moins l'infini plutôt que vers zéro ? Quel bénéfice pratique découle de ce choix (indice : pensez à `divmod()` qui renvoie un couple cohérent) ?
- `2 ** 3 ** 2` vaut `512`, pas `64`. Pourquoi `**` est-il associatif à droite quand `+` et `*` le sont à gauche ?
- Où la modular arithmétique gagne-t-elle son sel dans la vie réelle ? Pensez aux horloges, aux jours du calendrier ou aux indices de tableaux.

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-arithmetic">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Que vaut -7 // 2 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">-3</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">-4</button>
      <button class="quiz-q__opt" data-idx="3">-3.5</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. Quel est le résultat de 2 ** 3 ** 2 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">512</button>
      <button class="quiz-q__opt" data-idx="1">64</button>
      <button class="quiz-q__opt" data-idx="2">36</button>
      <button class="quiz-q__opt" data-idx="2">8</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. Que vaut 7 % 3 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">2</button>
      <button class="quiz-q__opt" data-idx="1">1</button>
      <button class="quiz-q__opt" data-idx="2">3</button>
      <button class="quiz-q__opt" data-idx="3">0</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>