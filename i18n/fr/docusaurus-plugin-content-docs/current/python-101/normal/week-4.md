---
title: "Semaine 4 : Les fonctions"
sidebar_position: 4
section: python-101
track: normal
week: 4
description: "Écrivez et raisonnez sur les fonctions Python : paramètres, valeurs de retour et portée, avec de véritables défis de programmation."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# Semaine 4 : Les fonctions

<span className="gamified-flourish">🧮 Vous connaissez déjà $f(x)$. Cette semaine, vous apprenez à écrire votre propre $f$.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine, vous serez capable de :
- Définir une fonction avec `def`, des paramètres, et une valeur de `return`.
- Expliquer la différence entre la **valeur par défaut** d'un paramètre et l'argument passé au moment de l'appel.
- Raisonner sur la **portée (scope)** des variables : ce qu'une fonction peut et ne peut pas voir depuis l'extérieur d'elle-même.
- Retourner plus d'une valeur depuis une fonction, et documenter ce que fait une fonction avec une docstring.
- Reconnaître la récursivité, et savoir quand elle reflète naturellement une définition mathématique.

## Leçon

### Les fonctions comme $f(x)$

Vous savez déjà lire $f(x) = x^2 + 1$ comme « une règle qui prend un nombre et en renvoie un autre ». Une fonction Python, c'est exactement cela :

```python
def f(x):
    return x**2 + 1

f(3)   # 10
f(0)   # 1
```

`def` nomme la fonction et ses paramètres ; le corps calcule un résultat ; `return` renvoie ce résultat à l'appelant. Une fonction sans instruction `return` renvoie implicitement `None`.

C'est une bonne pratique de documenter ce que fait une fonction avec une **docstring** — une chaîne de caractères littérale placée juste après la ligne `def`, que les outils (et les autres programmeurs, y compris vous-même dans le futur) peuvent lire sans ouvrir le corps de la fonction :

```python
def f(x):
    """Return x squared, plus one."""
    return x**2 + 1
```

### Plusieurs paramètres, valeurs par défaut

Les fonctions peuvent prendre plusieurs entrées, certaines avec des valeurs par défaut — l'équivalent de $f(x, y) = x + y$ mais où $y$ a une valeur supposée si l'appelant n'en fournit pas :

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Amina")               # "Hello, Amina!"
greet("Youssef", "Hi")        # "Hi, Youssef!"
greet(name="Sara", greeting="Hey")   # arguments nommés (keyword arguments) — l'ordre n'a pas d'importance
```

Les paramètres avec une valeur par défaut doivent venir *après* les paramètres sans valeur par défaut — `def greet(greeting="Hello", name):` est une `SyntaxError`, car Python doit savoir quels arguments sont obligatoires avant de pouvoir déterminer lesquels sont optionnels.

### Retourner plusieurs valeurs

Une fonction ne peut `return` qu'une seule chose, mais cette « seule chose » peut être un `tuple` — et la syntaxe de dépaquetage de tuples de Python (vue en semaine 3) fait que cela se lit presque comme un retour direct de plusieurs valeurs :

```python
def min_and_max(numbers):
    return min(numbers), max(numbers)   # ceci construit un tuple : (min, max)

lowest, highest = min_and_max([4, 8, 1, 9, 3])
print(lowest, highest)   # 1 9
```

C'est le même schéma que vous utiliserez tout au long du reste du cours chaque fois qu'un calcul produit naturellement plusieurs résultats liés.

### La portée (scope) : ce qu'une fonction peut voir

Une variable créée *à l'intérieur* d'une fonction n'existe qu'à l'intérieur de celle-ci — c'est la **portée locale (local scope)** :

```python
def compute():
    total = 42
    return total

compute()
print(total)   # NameError : total n'existait qu'à l'intérieur de compute()
```

Une fonction *peut* lire des variables définies en dehors d'elle (**portée globale, global scope**), mais réaffecter une variable globale depuis l'intérieur d'une fonction sans syntaxe particulière crée à la place une nouvelle variable locale — une source fréquente de confusion :

```python
counter = 0

def increment():
    counter = counter + 1   # UnboundLocalError ! Python voit l'affectation
                             # et traite counter comme local *dans toute la fonction*,
                             # y compris lors de la lecture avant l'affectation.
```

La solution (`global counter`) existe mais est rarement le bon choix de conception — préférez passer les valeurs en entrée et retourner les résultats en sortie, ce qui est aussi plus facile à tester et à raisonner.

### Des fonctions qui appellent des fonctions

Comme une fonction n'est jamais qu'une valeur comme une autre, les fonctions peuvent appeler d'autres fonctions, construisant de la complexité à partir de petites briques — de la même manière que $h(x) = g(f(x))$ compose deux fonctions :

```python
def double(x):
    return x * 2

def add_one(x):
    return x + 1

def double_then_add_one(x):
    return add_one(double(x))

double_then_add_one(3)   # double(3)=6, add_one(6)=7
```

### La récursivité : une fonction qui s'appelle elle-même

Certaines fonctions se définissent le plus naturellement en termes d'elles-mêmes — exactement comme une relation de récurrence. La factorielle, $n! = n \cdot (n-1)!$ avec le cas de base $0! = 1$, se traduit presque mot pour mot :

```python
def factorial(n):
    if n == 0:
        return 1              # cas de base — arrête la récursivité
    return n * factorial(n - 1)   # cas récursif

factorial(5)   # 5 * factorial(4) = 5 * 4 * factorial(3) = ... = 120
```

Toute fonction récursive a besoin d'un **cas de base** qui ne s'appelle pas lui-même (sinon elle se répète indéfiniment, jusqu'à finir par planter avec une `RecursionError`) et d'un cas récursif qui se *rapproche* de ce cas de base à chaque appel — ici, `n - 1` se réduit vers `0` à chaque fois. Tout ce que la récursivité peut faire, une boucle peut aussi le faire (et souvent plus efficacement, car chaque appel récursif a un certain coût) — mais pour des définitions déjà naturellement récursives, comme la factorielle ou le pipeline de traitement CSV de la semaine 5, la version récursive peut être la plus claire à lire.

## ⚠️ Pièges courants

- **Oublier `return`.** Une fonction qui calcule une valeur mais ne la `return`e jamais renvoie `None` — `result = add(2, 3)` devient silencieusement `None` si `add` a oublié son instruction `return`, et le bug ne se manifeste souvent que bien plus tard, lorsque vous essayez d'utiliser `result`.
- **Utiliser un argument par défaut mutable.** `def add_item(item, items=[]):` semble raisonnable, mais cette liste par défaut n'est créée *qu'une seule fois*, au moment où la fonction est définie, et réutilisée à *chaque* appel qui ne fournit pas son propre `items` — des éléments d'un appel peuvent fuiter vers le suivant. La solution : mettre `None` par défaut et créer une liste fraîche à l'intérieur de la fonction si besoin.
- **Absence de cas de base dans une fonction récursive.** Oublier le `if n == 0: return 1` dans `factorial` signifie que chaque appel se répète encore et encore, sans fin, jusqu'à ce que Python abandonne avec une `RecursionError: maximum recursion depth exceeded`.
- **Masquer un nom prédéfini (built-in).** Nommer votre propre fonction `sum` ou `list` fonctionne, mais cela masque ensuite le véritable `sum()`/`list()` de Python pour le reste de ce fichier — un bug confus à traquer plus tard.

## 🧩 Défis

<Challenge id="python101-normal-w4-c1" answer={<><code>def is_even(n): return n % 2 == 0</code> — le corps de la fonction est exactement le même test de divisibilité que vous connaissez déjà, encapsulé pour être réutilisable.</>}>

Écrivez une fonction `is_even(n)` qui renvoie `True` si `n` est pair, `False` sinon.

</Challenge>

<Challenge id="python101-normal-w4-c2" answer={<><code>def average(numbers): return sum(numbers) / len(numbers)</code>. L'appeler avec une liste vide lève une <code>ZeroDivisionError</code> — à noter, même si la gérer élégamment est la matière bonus de la semaine prochaine.</>}>

Écrivez une fonction `average(numbers)` qui prend une liste de nombres et renvoie leur moyenne. Que se passe-t-il si vous l'appelez avec une liste vide ?

</Challenge>

<Challenge id="python101-normal-w4-c3" answer={<>Définissez <code>def is_prime(n): ...</code> en réutilisant la boucle de primalité de la semaine dernière à l'intérieur du corps de la fonction, puis appelez-la dans une compréhension : <code>[n for n in range(2, 50) if is_prime(n)]</code>.</>}>

Transformez la logique « ce nombre est-il premier ? » de la semaine dernière en une fonction `is_prime(n)`, puis utilisez-la dans une compréhension de liste pour construire une liste de tous les nombres premiers inférieurs à 50.

</Challenge>

<Challenge id="python101-normal-w4-c4" answer={<>def f(x, y=1): return x + y — l'appel f(5) utilise la valeur par défaut (6), f(5, 10) la remplace (15).</>}>

Écrivez une fonction `f(x, y=1)` qui renvoie `x + y`. Appelez-la une fois avec seulement `x`, puis une fois avec les deux arguments, et expliquez pourquoi les deux résultats diffèrent.

</Challenge>

<Challenge id="python101-normal-w4-c5" answer={<>def fibonacci(n): if n &lt;= 1: return n; return fibonacci(n - 1) + fibonacci(n - 2) — reflète directement la définition mathématique F(n) = F(n-1) + F(n-2), avec F(0)=0 et F(1)=1 comme deux cas de base.</>}>

Écrivez une fonction récursive `fibonacci(n)` qui renvoie le `n`-ième nombre de Fibonacci, en utilisant la définition $F(0) = 0$, $F(1) = 1$, $F(n) = F(n-1) + F(n-2)$.

</Challenge>

<Challenge id="python101-normal-w4-c6" answer={<>def stats(numbers): return min(numbers), max(numbers), sum(numbers) / len(numbers) — renvoie un tuple à 3 éléments, dépaqueté au moment de l'appel sous la forme lo, hi, avg = stats(numbers).</>}>

Écrivez une fonction `stats(numbers)` qui renvoie trois valeurs à la fois — le minimum, le maximum et la moyenne — et appelez-la en utilisant le dépaquetage de tuples pour capturer les trois dans des variables séparées.

</Challenge>

## 🤔 Questions socratiques

- Deux fonctions utilisent chacune en interne une variable nommée `total`. Interfèrent-elles l'une avec l'autre ? Pourquoi, ou pourquoi pas, au vu de ce que vous avez appris sur la portée ?
- Pourquoi `return` quitte-t-elle immédiatement une fonction, même s'il reste du code après elle ? Essayez d'écrire une fonction avec du code inaccessible après un `return` et observez ce que fait le bac à sable (playground) avec ça.
- `double_then_add_one` compose `double` et `add_one`. Pourriez-vous écrire une fonction générale `compose(f, g)` qui renvoie *une nouvelle fonction* combinant deux fonctions quelconques ? (Vous n'avez pas besoin de `class` pour cela — une fonction peut renvoyer une autre fonction.)
- Votre `factorial` récursive et une version itérative utilisant une boucle `for` calculent le même résultat. Essayez de chronométrer les deux sur une grande entrée (par exemple `factorial(900)`) — remarquez-vous une différence ? Que pensez-vous qu'il se passe à chaque appel récursif qu'une itération de boucle n'a pas besoin de faire ?
- Le piège de l'argument par défaut mutable se produit parce qu'une valeur par défaut est créée *une seule fois*, au moment de la définition de la fonction, et non recréée à chaque appel. Pourquoi Python a-t-il pu être conçu ainsi, plutôt que de recréer la valeur par défaut à chaque appel (ce qui éviterait le piège mais coûterait un peu plus de travail à chaque fois) ?

## ✅ Quiz hebdomadaire

<WeeklyQuiz
  weekId="python-101-normal-week-4"
  questions={[
    {
      id: 'q1',
      prompt: "Que renvoie une fonction si elle n'a pas d'instruction return explicite ?",
      options: ['0', 'Une chaîne vide', 'None', 'Une SyntaxError'],
      correctOptionIndex: 2,
    },
    {
      id: 'q2',
      prompt: 'Dans def greet(name, greeting="Hello"), que représente "Hello" ?',
      options: [
        'Un argument obligatoire',
        'Une valeur par défaut utilisée quand greeting n\'est pas fourni',
        'Une variable globale',
        'Une valeur de retour',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'Une variable créée à l\'intérieur d\'une fonction est, par défaut :',
      options: ['Globale', 'Locale à cette fonction', 'Partagée entre toutes les fonctions', 'Une constante'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: "Qu'utilise greet(name=\"Sara\") pour passer l'argument ?",
      options: ['Un argument positionnel', 'Un paramètre par défaut', 'Un argument nommé (keyword argument)', 'La portée globale'],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'Toute fonction récursive doit avoir :',
      options: ['Une boucle for à l\'intérieur', 'Un cas de base qui arrête la récursivité', 'Un paramètre par défaut', 'Une docstring'],
      correctOptionIndex: 1,
    },
  ]}
/>

## 🎁 Bonus : gérer les erreurs avec try/except

<BonusContent weekId="python-101-normal-week-4">

En l'état actuel, appeler `average([])` fait planter tout votre programme avec une `ZeroDivisionError`. Python vous permet de *capturer* les erreurs au lieu de planter :

```python
def average(numbers):
    try:
        return sum(numbers) / len(numbers)
    except ZeroDivisionError:
        return 0

average([])   # 0, au lieu d'un plantage
```

`try` englobe du code susceptible d'échouer ; `except <ErrorType>` capture cet échec spécifique et exécute à la place un code alternatif. Cela ne fait pas partie du programme principal (il est facile d'en abuser et de masquer de vrais bugs), mais c'est une suite naturelle une fois que les fonctions peuvent échouer de façon prévisible. Essayez d'englober vos fonctions `average` et `is_prime` des défis de cette semaine avec un `try`/`except` qui gère élégamment une mauvaise entrée, comme une valeur non numérique dans la liste.

</BonusContent>

<ProgressCheckbox weekId="python-101-normal-week-4" />
