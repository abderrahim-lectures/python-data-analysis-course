---
title: "Conversion de types"
description: "Convertissez explicitement entre int, float, str et bool — et comprenez quand les conversions échouent."
module: "python-basics"
order: 4
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Convertir des valeurs avec int(), float(), str() et bool()"
  - "Comprendre la troncature contre l'arrondi"
  - "Reconnaître quand les conversions lèvent une ValueError"
  - "Gérer correctement le type de retour de input()"
prerequisites: ["03-data-types"]
tags: ["conversion", "cast", "int", "float", "str", "input"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Pourquoi une valeur devrait-elle changer d'ensemble ?

Vous tapez votre année de naissance dans un formulaire. Le `input()` de Python vous rend une **chaîne** — `"2004"`. Mais `"2004"` n'est pas un nombre au sens arithmétique : essayez `"2004" + 26` et Python répond `"200426"`, car pour une chaîne, `+` veut dire *joindre*, pas *additionner*.

Vous tenez les chiffres d'un nombre sans tenir le nombre. Son ensemble d'appartenance est le mauvais. Une valeur qui traverse le clavier jusqu'à un programme arrive comme texte, et le texte ne sait pas faire de l'arithmétique.

Un programme doit donc **convertir** sans cesse une valeur d'un ensemble à un autre : de `str` vers `int` avant de calculer une année, de `int` vers `str` avant de l'imprimer à côté d'une étiquette. Python vous donne quatre fonctions pour cela, une par ensemble de destination.

## Quatre fonctions de conversion

Chacune porte le nom de l'ensemble qu'elle produit :

```python
int("42")       # 42     — str -> int   "42" était des chiffres ; c'est maintenant un nombre
float("3.14")   # 3.14   — str -> float
str(42)         # "42"   — int -> str    le nombre devient texte
bool(0)         # False  — nombre -> valeur de vérité
```

Les lire à voix haute dit ce qu'elles sont : `str(42)` signifie « donne-moi la version chaîne de $42$ ». Le nom de la fonction est le nom de l'ensemble de destination, et les parenthèses sont la machine de conversion elle-même.

## Convertir ne consiste pas à arrondir — c'est tronquer

Voici une subtilité qui coûte de vrais bugs aux débutants. Vous voulez la partie entière de $3.9$. Quelle réponse faut-il donner ?

$$
3.9 = 3 + 0.9
$$

L'instinct naturel est d'arrondir : $4$. Le `int(3.9)` de Python renvoie en revanche **$3$** :

```python
int(3.9)        # 3   — la partie décimale est coupée, pas arrondie
round(3.9)      # 4   — ceci est un arrondi
```

`int()` **tronque** : il jette la partie fractionnaire et garde le reste, en se déplaçant **vers zéro**. La différence surgit dès que les nombres deviennent négatifs :

```python
int(-3.9)       # -3  — vers zéro
import math
math.floor(-3.9)  # -4 — vers moins l'infini
```

La droite numérique tranche : tronquer marche vers $0$, `math.floor` descend (vers $-\infty$), et `round` va vers l'entier le plus proche. Choisissez celui qui correspond à ce que *vous* vouliez dire par « la partie entière ».

## Certaines conversions doivent échouer

Passer d'un ensemble à l'autre n'est pas toujours possible. Lesquelles de ces conversions voyez-vous fonctionner ?

```python
int("hello")    # ValueError: invalid literal for int()
int("3.14")     # ValueError: invalid literal for int()  ("3.14" : des chiffres avec un point)
float("hello")  # ValueError: could not convert string to float
```

`"hello"` ne contient aucun chiffre — rien à convertir, donc Python refuse. `int("3.14")` est plus retors : il *contient* des chiffres, mais la fonction `int` n'accepte qu'un littéral entier, or $3.14$ n'est pas entier. Il faut passer par `float` pour le réduire :

```python
int(float("3.14"))   # 3  — analyse 3.14, tronque à 3
```

Remarquez la philosophie : Python échoue bruyamment plutôt que de deviner tout bas. Une devinette silencieuse corromprait vos données ; une erreur sonore arrête le programme pour que *vous* décidiez.

## Le piège quotidien : `input()` renvoie une chaîne

À chaque fois, sans exception, `input()` renvoie un `str` — même quand l'utilisateur tape `2004`. Le nombre que vous vouliez est encore de l'autre côté d'une conversion :

```python
year_text = input("Birth year? ")   # str, toujours
year = int(year_text)                # maintenant il sait faire de l'arithmétique
print(f"About {2026 - year} years old")
```

Oublier la conversion est l'une des erreurs initiales les plus courantes, et voici à quoi ressemble exactement l'oubli :

```python
age = input("Age? ")
print(age + 1)    # TypeError: can only concatenate str (not "int") to str
```

L'erreur est la machine qui joue franc jeu : `age` vit dans $\mathbb{S}$ (les chaînes), et `+` sur une chaîne ne veut pas dire addition. La leçon est une habitude : *si une valeur vient de l'extérieur, convertissez-la avant de faire des mathématiques avec.*

## Un exemple travaillé : la mesure tronquée

Un capteur signale `"3.9"` comme du texte, et un afficheur ne montre que des unités entières. Deux conversions, une intention chacune :

```python
raw = "3.9"
numeric = float(raw)     # 3.9 — analyse le nombre réel
whole = int(numeric)     # 3   — tronque vers zéro
print(f"{whole} units")  # 3 units — le .9 est coupé, pas arrondi
```

L'entonnoir compte parce que chaque étape est une promesse différente : `float(...)` change le texte en valeur réelle, `int(...)` tranche ensuite vers zéro, et vous ne demandez jamais à une fonction de faire les deux. Dites quelle promesse vous entendez et la conversion cesse de surprendre.

## Pièges courants

- **`int("3.14")` lève une erreur.** Vous ne pouvez pas parser une chaîne décimale directement en `int()`. Réduisez-la à la main : `int(float("3.14"))`, ou `round(float("3.14"))`.
- **`int()` tronque ; `round()` arrondit.** `int(4.7)` vaut `4`, pas `5`. Demandez-vous quelle opération vous décrivez vraiment en disant « convertis ceci en entier ».
- **`float("inf")` est valide.** Python connaît l'infini : `float('inf')`. Pratique dans les algorithmes d'optimisation ; troublant lorsqu'il s'invite dans un résultat que vous attendiez fini.
- **`int()` et `bool()` tronquent et réinterprètent en silence.** `int(3.9)` tranche la fraction en silence ; `bool("")` renvoie `False` en silence. Analyser du texte échoue bruyamment (`ValueError`), mais les conversions nombre-à-nombre sont calmes — ce sont celles à vérifier deux fois.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Prédisez `int(-7.9)` et `-7.9 // 1`. Sont-ils identiques ? Expliquez toute différence.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>int(-7.9)</code> vaut <code>-7</code> (tronque vers zéro — coupe la partie décimale), tandis que <code>-7.9 // 1</code> vaut <code>-8.0</code> (plancher vers moins l'infini). Ils concordent pour les positifs et divergent pour les négatifs.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Écrivez un programme qui demande un nom et une année de naissance (deux invites `input()` distinctes), calcule un âge approximatif et affiche une phrase comme `"Amina, you are about 21 years old."`

<p class="challenge__answer">💡 <strong>Réponse :</strong> Lisez le nom et l'année avec deux appels à <code>input()</code>, convertissez l'année avec <code>int()</code>, soustrayez-la de l'année courante (p. ex. <code>2026</code>) et affichez avec une f-string : <code>print(f"{name}, you are about {2026 - year} years old.")</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Sans l'exécuter, calculez `15 // 4` et `15 % 4` à la main, puis vérifiez si $4 \cdot (15 // 4) + (15 \% 4)$ reproduit $15$.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>15 // 4</code> vaut <code>3</code> (le plancher de $3.75$), et <code>15 % 4</code> vaut <code>3</code>, puisque $15 = 4 \cdot 3 + 3$. Ensemble, <code>4 * 3 + 3 = 15</code> — l'identité de la division $\text{dividende} = \text{diviseur} \cdot \text{quotient} + \text{reste}$.</p>

</div>
</details>

## 🤔 Questions socratiques

- `input()` renvoie toujours un `str`. Qu'est-ce qui cloche avec `age + 10` si vous sautez la conversion ? Que dit exactement le message d'erreur ?
- Pour convertir `"3.14"` en entier, pourquoi `int("3.14")` échoue-t-il mais `int(float("3.14"))` réussit-il ? Que fait l'étape intermédiaire ?
- Python a `math.floor()` et `math.ceil()`. En quoi diffèrent-ils de `int()` sur les nombres négatifs ? Quand choisiriez-vous chacun ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-conversion">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que vaut int(4.7) ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">4</button>
      <button class="quiz-q__opt" data-idx="2">4.7</button>
      <button class="quiz-q__opt" data-idx="3">Erreur</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Que renvoie toujours input("Name: ") ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. Que se passe-t-il avec int("3.14") ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">ValueError</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">4</button>
      <button class="quiz-q__opt" data-idx="3">3.14</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>