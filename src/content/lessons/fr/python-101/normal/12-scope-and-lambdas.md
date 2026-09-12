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

## Où vit un nom ?

Une variable est un nom relié à une valeur — mais *où* cette liaison tient, c'est la portée. Les mathématiques le marquent aussi : dans $f(x) = x^2$, la lettre $x$ est un marque-place qui ne vit qu'à l'intérieur de la définition. Hors de là, $x$ peut signifier tout autre chose. Python dessine les mêmes murs autour des corps de fonctions : une variable créée dans une fonction est **locale** — elle existe à l'intérieur des murs et nulle part ailleurs.

```python
def my_func():
    x = 10
    print(x)  # fonctionne

my_func()
# print(x)  # NameError : x n'est pas définie
```

Les variables définies au niveau du module, en revanche, sont visibles partout en dessous — elles sont **globales** :

```python
counter = 0

def increment():
    global counter
    counter += 1

increment()
print(counter)  # 1
```

Le problème de `global`, c'est qu'il laisse une fonction réécrire le monde de l'intérieur. La liaison change là où rien dans l'appel ne vous avait annoncé qu'elle changerait. **Préférez renvoyer des valeurs plutôt que d'atteindre `global`** — une fonction qui renvoie est une fonction que vous pouvez tester et raisonner à l'isolement.

## Portée imbriquée et nonlocal

Les fonctions peuvent s'imbriquer, et une fonction interne peut *lire* une variable externe. La réassigner, en revanche, exige le mot-clé `nonlocal` — un aveu que le nom appartient à la portée englobante :

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

L'`increment` interne porte sa propre mémoire : chaque appel pousse le `count` capturé. C'est une fermeture — une fonction avec une poche d'état qu'elle traîne après que sa fonction englobante a fini.

## Lambda : la fonction en ligne

Une fonction qui tient sur une ligne a une sténographie. `lambda` crée une petite fonction anonyme — une formule sous forme d'expression :

```python
add = lambda a, b: a + b
print(add(3, 5))  # 8
```

C'est l'équivalent du `def` que vous connaissez déjà :

```python
def add(a, b):
    return a + b
```

La différence est une question de poids : `def` écrit toute la cérémonie pour n'importe quoi avec des étapes ; `lambda` reste en ligne pour une seule expression, sans docstring plus tard, sans `return` — l'expression après les deux points *est* la valeur renvoyée.

## Lambdas avec des fonctions d'ordre supérieur

Les lambdas gagnent leur vie lorsqu'elles sont données à des fonctions qui prennent une fonction en entrée. Trier par score, appliquer à chaque élément, garder ceux qui passent un test — chacune est la notation de construction d'ensembles en code :

```python
students = [("Alice", 85), ("Bob", 92), ("Charlie", 78)]

# Tri par score (deuxième élément)
by_score = sorted(students, key=lambda s: s[1])
print(by_score)  # [('Charlie', 78), ('Alice', 85), ('Bob', 92)]

# Map : appliquer une fonction à chaque élément — $\{2x \mid x \in \text{nums}\}$
nums = [1, 2, 3, 4]
doubled = list(map(lambda x: x * 2, nums))
# [2, 4, 6, 8]

# Filter : garder ceux qui passent un test — $\{x \in \text{nums} \mid x \equiv 0 \pmod{2}\}$
evens = list(filter(lambda x: x % 2 == 0, nums))
# [2, 4]
```

`map` transforme chaque élément ; `filter` conserve les éléments qu'un prédicat approuve ; `sorted` ordonne selon une clé choisie. Trois opérations courantes sur les données, chacune acceptant une minuscule fonction comme bouton de personnalisation.

## Un exemple travaillé : la fonction propre

Le conseil de la portée — préférer `return` à `global` — a une forme prête : un prix avec le taux comme paramètre :

```python
def price_with_tax(price, rate=0.2):
    return round(price * (1 + rate), 2)

price_with_tax(10.0)        # 12.0
price_with_tax(10.0, 0.08)  # 10.8
```

La fonction propre n'a pas besoin de `global` : le taux arrive comme paramètre, le monde extérieur reste intact, et la formule se lit — $\text{prix} \cdot (1 + \text{taux})$. Tout se passe dans les murs, et le résultat revient par `return`.

## Pièges courants

- **Utiliser `global` quand un `return` suffirait.** Cela cache l'effet de bord et couple la fonction à son environnement.
- **Abuser des lambdas.** Une seule expression ; dès qu'une lambda a besoin de deux étapes, faites-en un `def`.
- **Confondre la portée dans les fonctions imbriquées.** Quand une variable est lue, Python sort pour la chercher ; un cri `nonlocal` ou `global` change qui peut l'écrire. Lisez cette logique avant de supposer la liaison.
- **`sorted` sans `key` trie par l'élément lui-même.** Les tuples se trient lexicographiquement par leur premier élément d'abord ; pour trier par le second, la `key` est obligatoire — `sorted(students, key=lambda s: s[1])`.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Triez les mots `words = ["banana", "pie", "Washington", "a"]` par longueur.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>sorted(words, key=lambda w: len(w))</code> → <code>['a', 'pie', 'banana', 'Washington']</code> — la fonction clé élève chaque mot au nombre comparé.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Utilisez `filter` avec une lambda pour conserver les mots de plus de trois caractères de `["hi", "hello", "hey", "howdy", "yo"]`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>list(filter(lambda w: len(w) > 3, words))</code> → <code>['hello', 'howdy']</code> — le prédicat est votre condition d'appartenance, et <code>filter</code> est le constructeur d'ensemble.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi Python exige-t-il `nonlocal` plutôt que de laisser les fonctions internes réassigner librement une variable externe ? Quelles erreurs l'exigence prévient-elle ?
- `map`/`filter` avec une lambda contre une compréhension de liste — quand chacune est-elle l'orthographe la plus claire ?
- Une lambda n'accepte qu'une seule expression. Quelle limite se cache derrière cette règle ?

## ✅ Vérification rapide

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