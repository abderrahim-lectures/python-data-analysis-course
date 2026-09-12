---
title: "Types de données"
description: "Identifiez les types fondamentaux de Python, int, float, str, bool, et comprenez ce que chacun représente."
module: "python-basics"
order: 3
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Identifier les valeurs int, float, str et bool"
  - "Utiliser type() pour vérifier le type d'une valeur"
  - "Comprendre le typage dynamique en Python"
  - "Reconnaître les valeurs vraies et fausses"
prerequisites: ["02-variables"]
tags: ["types", "int", "float", "str", "bool", "typage-dynamique"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## L'ensemble auquel appartient un nombre

Répondez à deux questions : vous tenez $7$ pommes et vous en coupez une en deux. Tenez-vous maintenant $7 + \frac{1}{2}$ pommes *au même sens* que vous teniez $7$ ? Une demi-pomme n'est pas un nombre entier de pommes, le $7$ vit dans $\mathbb{Z}$, et le $7\frac{1}{2}$ vit dans $\mathbb{Q}$.

Un mathématicien répond en demandant à quel **ensemble** une valeur appartient. La même distinction poursuit chaque programme : la machine stocke $42$ différemment de $42.5$, et $42$ différemment de `"42"`. Le mot que Python emploie pour « dans quel ensemble vit cette valeur » est **type**.

Alors : combien d'ensembles vaut-il la peine de distinguer ? Quatre, pour commencer.

| Type | Ce que c'est, mathématiquement | Exemples |
|---|---|---|
| `int` | $\mathbb{Z}$, les entiers, stockés exactement | `42`, `-7` |
| `float` | $\mathbb{R}$, approché avec un nombre fixe de chiffres binaires | `3.14`, `-0.5` |
| `str` | une séquence finie de caractères | `"hello"` |
| `bool` | $\{\text{True}, \text{False}\}$ | `True`, `False` |

La ligne `float` contient une réserve délibérée, *approché*. Un entier est stocké exactement, à chaque fois. Un nombre réel, presque jamais : comment stockeriez-vous $1/3 = 0.333\ldots$ avec un nombre fini de chiffres ? Impossible, donc Python conserve une approximation finie, et les comptes divergent sur les derniers chiffres. Ce seul fait explique une surprise célèbre que vous allez bientôt rencontrer.

## Demander l'ensemble d'appartenance

Devant une valeur, vous pouvez demander son type directement :

```python
type(42)      # <class 'int'>
type(3.14)    # <class 'float'>
type("hi")    # <class 'str'>
type(True)    # <class 'bool'>
```

Deux remarques de notation. D'abord, `type(...)` *est* une fonction, vous lui confiez une valeur et elle vous rend l'*objet de type* auquel cette valeur appartient. Ensuite, la réponse s'affiche `<class 'int'>` ; le mot `class` est le terme de Python pour type, et le mot entre guillemets est le nom de l'ensemble. Lisez `<class 'float'>` comme *« appartient à l'ensemble float »*.

## Un nom ne s'engage pas envers un ensemble

C'est ici que les dividendes commencent. Dans un langage à typage statique, vous déclareriez à l'avance : *x est un entier*. Python, lui, laisse un nom pointer où il veut :

```python
x = 5
print(type(x))    # <class 'int'>
x = "hello"
print(type(x))    # <class 'str'>
```

Rediriger un nom vers un autre ensemble est légal, si bien que le type de `x` ne se lit dans aucune déclaration, seulement en demandant envers quoi il pointe actuellement. C'est le **typage dynamique**. C'est commode, et c'est aussi la raison pour laquelle votre programme peut silencieusement confier une chaîne à une fonction qui attend des nombres : rien ne l'en empêche jusqu'à ce que l'opération elle-même échoue.

## Quelles valeurs se comportent comme True ?

Toute valeur est **vraie** ou **fausse** (truthy / falsy), ou bien elle se comporte comme `True` dans une condition, ou bien comme `False`. La règle est compacte, et il vaut la peine de la vérifier :

- **Falsy** : le $0$, le $0.0$, la chaîne vide `""` et `None`
- **Truthy** : tout le reste

```python
bool(0)         # False
bool(1)         # True
bool(-1)        # True   — tout nombre non nul est truthy
bool("")        # False
bool("hello")   # True   — toute chaîne non vide est truthy
```

Observez ce qui est dans la liste et ce qui en est exclu. `-1` est True ; `0` ne l'est pas. La chaîne `"0"` est True, elle est non vide, et pour les chaînes le critère est la vacuité, pas la valeur de leur contenu. Cette règle se rembourse dès votre premier `if` : `if score:` signifie *si score n'est pas nul*.

## Un exemple travaillé : auditer une expression

Les ensembles paient dès qu'une expression les mélange. Lisez le reçu ligne par ligne et demandez l'ensemble de chaque résultat :

```python
unit_price = 4.75
quantity = 4
bill = unit_price * quantity     # float : le float absorbe l'int
type(bill)                       # <class 'float'>
bool(bill)                       # True — tout non-nul est truthy

type(10 / 2)                     # <class 'float'> — la division réelle ne rend jamais int
```

Lisez `bill` comme le produit de deux ensembles distincts. Les ensembles ne se « mélangent » pas, le `float` l'emporte, car la proportion n'est un nombre entier d'aucune échelle et l'ensemble le plus large doit la contenir. L'habitude d'audit consiste à demander directement à l'ensemble : `type(...)` confirme ce que vous soupçonniez au lieu de parier sur la chance.

## Pièges courants

- **`4 / 2` vaut `2.0`, pas `2`.** La division réelle (`/`) renvoie toujours un `float` en Python 3, même quand la division est exacte. Pour un résultat entier, demandez la division entière : `4 // 2` → `2`.
- **`True + True` vaut `2`.** `bool` est une sous-classe de `int` en Python : `True` se comporte comme $1$ et `False` comme $0$ en arithmétique. Les deux ensembles se recouvrent, mais `type(True)` répond toujours `bool`.
- **`type()` indique le type concret.** `type(True)` est `bool`, pas `int`, si à l'aise que `True` soit dans les sommes.
- **`type()` décrit le résultat, pas les opérandes.** `type(2 * 3.0)` est `float`, un `int` multiplié par un `float` vit dans l'ensemble `float`. Ne le prédisez pas à partir des pièces ; demandez à la réponse.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Prédisez `type(7 / 2)`, puis vérifiez.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>type(7 / 2)</code> est <code>float</code>, la division réelle (<code>/</code>) produit toujours un float en Python 3, même quand les deux opérandes sont des entiers et que le quotient est un nombre entier.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Prédisez `bool(0)`, `bool(0.0)`, `bool("")` et `bool("0")`. Lesquelles sont vraies, lesquelles fausses ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>bool(0)</code> → False, <code>bool(0.0)</code> → False, <code>bool("")</code> → False (chaîne vide), <code>bool("0")</code> → True (chaîne non vide, même si son contenu est le caractère « 0 »).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

En Python, `0.1 + 0.2` n'est **pas** égal à `0.3`. Voici le même problème sur papier : que se passe-t-il quand vous représentez $1/3 = 0.333\ldots$ avec deux décimales ? Expliquez maintenant pourquoi un `float`, qui approche $\mathbb{R}$ avec un nombre fini de chiffres binaires, ne peut pas représenter $0.1$ exactement.

<p class="challenge__answer">💡 <strong>Réponse :</strong> Avec deux décimales, le $1/3$ doit devenir $0.33$, une perte déjà actée avant tout calcul. De même, $0.1$ n'a pas de forme binaire exacte ; le float stocke une valeur proche, et additionner deux de ces valeurs traîne de minuscules erreurs : <code>0.1 + 0.2</code> donne <code>0.30000000000000004</code>, pas <code>0.3</code>. Précision finie, pas un bug de Python.</p>

</div>
</details>

## 🤔 Questions socratiques

- Si `bool(-1)` est `True`, quelle règle unique explique que $-1$ soit vrai mais $0$ faux ? La règle se généralise-t-elle des nombres aux chaînes ?
- Python possède `isinstance(42, int)` qui renvoie `True`. `isinstance` serait-il plus fiable que `type(x) == int` pour vérifier des types ? Pourquoi ?
- Pourquoi Python écrit-il `True` et `False` en majuscules plutôt que `true` et `false` ? Quels autres mots en majuscules Python réserve-t-il ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-types">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Quel est le type de 3.14 ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Quel est le résultat de True + True ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">2</button>
      <button class="quiz-q__opt" data-idx="3">Erreur</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. Laquelle de ces valeurs est fausse (falsy) ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">""</button>
      <button class="quiz-q__opt" data-idx="1">"0"</button>
      <button class="quiz-q__opt" data-idx="2">-1</button>
      <button class="quiz-q__opt" data-idx="3">1</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>