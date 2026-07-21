---
title: "Semaine 1 : Variables, types et E/S"
sidebar_position: 1
section: python-101
track: normal
week: 1
description: "Apprenez les variables, types de données, opérateurs et entrées/sorties en Python — la première semaine du parcours Normal de Python 101, sans aucune installation."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semaine 1 : Variables, types et E/S

<span className="gamified-flourish">🐍 Chaque langage commence par nommer les choses. Cette semaine, vous découvrez la version Python de « soit $x$... ».</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine, vous serez capable de :
- Stocker une valeur sous un nom (une **variable**) et expliquer pourquoi ce nom est juste une étiquette, pas une boîte.
- Identifier les types de base intégrés à Python : `int`, `float`, `str`, `bool`.
- Utiliser correctement les opérateurs arithmétiques, de comparaison et d'affectation composée.
- Lire une saisie clavier de l'utilisateur et afficher une sortie formatée.
- Écrire un premier petit programme interactif complet combinant tout ce qui précède.

## Leçon

### Les variables comme noms de valeurs

En mathématiques, quand vous écrivez « soit $x = 5$ », vous liez un nom à une valeur pour le reste du raisonnement. Python fait exactement cela :

```python
x = 5
```

Le membre de droite est évalué en premier (`5`), puis le nom `x` y est rattaché. Contrairement aux mathématiques, `x` peut être **réaffecté** — `x = 5` suivi plus tard de `x = x + 1` ne se contredit pas, cela redirige simplement l'étiquette :

```python
x = 5
x = x + 1  # x désigne maintenant 6
```

Lisez `x = x + 1` comme « la nouvelle valeur de $x$ est l'ancienne valeur de $x$ plus un », de la même manière que vous liriez une relation de récurrence $x_{n+1} = x_n + 1$.

Vous verrez ce motif — lire la valeur actuelle, calculer quelque chose à partir d'elle, la restocker sous le même nom — si souvent que Python lui donne un raccourci, les opérateurs d'**affectation composée** :

```python
x = 5
x += 1     # équivalent à x = x + 1  -> 6
x -= 2     # équivalent à x = x - 2  -> 4
x *= 3     # équivalent à x = x * 3  -> 12
x /= 4     # équivalent à x = x / 4  -> 3.0
```

#### Nommer vos variables

Un nom (un **identifiant**) doit commencer par une lettre ou un tiret bas, et ne peut ensuite contenir que des lettres, des chiffres et des tirets bas — `2nd_score` est invalide, `second_score` est correct. La convention Python (et le style de ce cours dans son ensemble) est le `snake_case` : des mots en minuscules séparés par des tirets bas, comme `student_name` ou `total_score`, plutôt que `studentName` ou `TotalScore`. Certains mots sont **réservés** par le langage lui-même (`if`, `for`, `class`, `True`, et d'autres) et ne peuvent jamais être utilisés comme noms de variables.

Les noms doivent décrire *ce que signifie une valeur*, pas seulement satisfaire la syntaxe. `x = 87.5` ne dit rien au lecteur ; `quiz_score = 87.5` lui dit tout ce dont il a besoin en un coup d'œil. Cela compte plus qu'il n'y paraît — vous relirez votre propre code bien plus souvent que vous ne l'écrirez.

### Types : de quel genre de valeur s'agit-il ?

Chaque valeur a un type — l'ensemble auquel elle appartient, en termes mathématiques :

| Type | Analogue mathématique | Exemple |
|---|---|---|
| `int` | $\mathbb{Z}$ (les entiers) | `42`, `-7` |
| `float` | $\mathbb{R}$ (les réels, approximés) | `3.14`, `-0.5` |
| `str` | une séquence finie de caractères | `"hello"` |
| `bool` | $\{\text{True}, \text{False}\}$ | `True`, `False` |

Vérifiez le type d'une valeur avec `type(...)` :

```python
type(42)      # <class 'int'>
type(3.14)    # <class 'float'>
type("hi")    # <class 'str'>
type(True)    # <class 'bool'>
```

Python est un langage à **typage dynamique** : un nom n'est pas lié en permanence à un seul type. Écrire `x = 5` puis `x = "five"` est légal — `x` pointe simplement ailleurs. C'est pratique, mais cela signifie aussi que le *type* d'un nom ne peut être connu qu'en regardant ce vers quoi il pointe actuellement, et non en le déclarant à l'avance.

#### Convertir entre les types

Vous pouvez convertir explicitement une valeur d'un type à un autre en utilisant `int(...)`, `float(...)`, `str(...)` et `bool(...)` comme des fonctions :

```python
int("42")       # 42        — str -> int
int(3.9)        # 3         — float -> int, tronque (n'arrondit PAS !)
float("3.14")   # 3.14      — str -> float
str(42)         # "42"      — int -> str
bool(0)         # False     — 0 (ainsi que 0.0 et "") sont "falsy"
bool(1)         # True      — tout nombre non nul (et toute chaîne non vide) est "truthy"
```

Le fait que `int(3.9)` donne `3`, et non `4`, déroute constamment les débutants — la conversion en `int` tronque toujours vers zéro, elle n'arrondit jamais. Utilisez la fonction intégrée `round(3.9)` (qui donne `4`) si c'est réellement un arrondi que vous voulez.

Toute conversion n'est pas possible : `int("hello")` lève une `ValueError`, puisque `"hello"` n'est un nombre dans aucune base. Python échoue ici bruyamment plutôt que de deviner silencieusement — un choix de conception que vous apprendrez à apprécier lorsque vous déboguerez de vraies données en Section 2.

### Opérateurs

Les opérateurs arithmétiques reflètent ceux que vous connaissez déjà, avec deux ajouts propres à Python :

```python
7 // 2   # 3   — division entière : floor(7/2)
7 % 2    # 1   — le reste, c'est-à-dire 7 mod 2
7 ** 2   # 49  — l'exponentiation, c'est-à-dire 7^2
-7 // 2  # -4  — la division entière arrondit toujours vers moins l'infini, pas vers zéro
```

Cette dernière ligne est une surprise fréquente : `-7 // 2` vaut `-4`, pas `-3`, car la division entière suit la fonction plancher mathématique $\lfloor x \rfloor$, qui arrondit *vers le bas* (vers $-\infty$), et non vers zéro.

Les opérateurs de comparaison (`==`, `!=`, `<`, `<=`, `>`, `>=`) produisent un `bool`. Notez que `==` (test d'égalité) n'est pas `=` (affectation) — une erreur de débutant très courante. Vous pouvez aussi enchaîner les comparaisons comme en mathématiques : `0 <= x < 10` signifie exactement ce que signifie $0 \le x < 10$, évalué comme une seule expression, et non deux expressions séparées qu'il faudrait relier avec `and` (vous découvrirez `and`/`or` en bonne et due forme la semaine prochaine).

Les opérateurs se combinent selon la priorité habituelle : `**` d'abord, puis `*`, `/`, `//`, `%`, puis `+`, `-`, de gauche à droite — le même ordre PEMDAS que vous connaissez déjà. Les parenthèses priment sur cet ordre exactement comme en mathématiques :

```python
2 + 3 * 4      # 14, et non 20
(2 + 3) * 4    # 20
```

### Entrée et sortie

`input()` lit une ligne de texte saisie par l'utilisateur — elle **retourne toujours une `str`**, même si un nombre a été saisi :

```python
name = input("What's your name? ")
print("Hello,", name)
```

Puisque `input()` donne toujours une `str`, convertir est courant :

```python
age_text = input("How old are you? ")
age = int(age_text)      # str -> int
print("In 10 years you'll be", age + 10)
```

`print()` accepte plusieurs arguments séparés par des virgules (joints par un espace) ou une f-string pour plus de contrôle :

```python
score = 87.5
print(f"Your score is {score}%")   # les f-strings interpolent {des expressions} directement
```

Une f-string peut contenir plus qu'un simple nom de variable — n'importe quelle expression fonctionne à l'intérieur des `{ }`, et vous pouvez formater les nombres avec précision :

```python
price = 19.999
print(f"Total: ${price:.2f}")        # "Total: $20.00" — :.2f arrondit à 2 décimales
print(f"Double: {price * 2}")         # n'importe quelle expression, pas seulement une variable
print(f"{'yes' if price > 10 else 'no'}")  # même une expression conditionnelle fonctionne en ligne
```

### ⚠️ Erreurs courantes

- **Confondre `=` et `==`.** `if score = 60:` est une erreur de syntaxe (vous découvrirez `if` en bonne et due forme la semaine prochaine) — Python ne permet pas d'affecter par accident dans une condition, mais le réflexe de taper `=` en voulant dire « égal » est courant au début.
- **Oublier que `input()` retourne une chaîne.** `age = input("Age? ")` puis `age + 1` lève `TypeError: can only concatenate str (not "int") to str` — convertissez d'abord : `age = int(input("Age? "))`.
- **S'attendre à ce que `int()` arrondisse.** `int(4.7)` vaut `4`, pas `5`. Utilisez `round(4.7)` pour arrondir.
- **Confondre `/` et `//`.** `/` donne toujours un `float` (même `4 / 2` vaut `2.0`) ; `//` donne le quotient tronqué vers le bas.

## Exemple pratique : un petit programme interactif

En rassemblant tout ce que vous avez appris cette semaine — variables, types, conversion, opérateurs et E/S — dans un court programme qui calcule un pourboire :

```python
bill = float(input("Bill amount: $"))
tip_percent = int(input("Tip percent (e.g. 15): "))

tip_amount = bill * tip_percent / 100
total = bill + tip_amount

print(f"Tip: ${tip_amount:.2f}")
print(f"Total: ${total:.2f}")
```

Remarquez comment chaque ligne fait une seule chose claire : lire une valeur, la convertir dans le bon type, calculer avec elle, et afficher un résultat formaté. Ce motif « lire → calculer → afficher » est un motif que vous réutiliserez constamment tout au long de ce cours.

## 🧩 Défis

<Challenge id="python101-normal-w1-c1" answer={<><code>type(7 / 2)</code> est <code>float</code> — la division réelle (<code>/</code>) produit toujours un float en Python 3, même quand les deux opérandes sont des int et que le résultat est un nombre entier.</>}>

Quel est `type(7 / 2)` ? Prédisez-le avant de l'exécuter dans le bac à sable, puis vérifiez.

</Challenge>

<Challenge id="python101-normal-w1-c2" answer={<>Oui : <code>"3" + "4"</code> est la chaîne <code>"34"</code> (concaténation), pas <code>7</code>. Additionner directement un <code>str</code> et un <code>int</code> (<code>"3" + 4</code>) lève une <code>TypeError</code> — il faut convertir d'abord.</>}>

Prédisez le résultat de `"3" + "4"`. Est-ce le même que `3 + 4` ?

</Challenge>

<Challenge id="python101-normal-w1-c3" answer={<>Écrivez un petit programme : lisez un nom et une année de naissance avec deux appels à <code>input()</code>, convertissez l'année en <code>int</code>, soustrayez-la de l'année courante, et affichez une phrase avec une f-string, par ex. <code>{"f\"{name}, you are about {age} years old.\""}</code>.</>}>

Écrivez un programme qui demande un nom et une année de naissance (comme deux invites `input()` séparées), calcule un âge approximatif, et affiche une phrase du type `"Amina, you are about 21 years old."` Essayez-le dans le bac à sable.

</Challenge>

<Challenge id="python101-normal-w1-c4" answer={<>15 // 4 vaut 3 (plancher de 3,75), et 15 % 4 vaut 3 (car 15 = 4·3 + 3). Ensemble, ils vérifient 15 = 4·(15 // 4) + (15 % 4), la même identité que l'algorithme de division que vous connaissez en théorie des nombres.</>}>

Sans l'exécuter, calculez `15 // 4` et `15 % 4` à la main. Puis vérifiez : `4 * (15 // 4) + (15 % 4)` vaut-il `15` ?

</Challenge>

<Challenge id="python101-normal-w1-c5" answer={<>int(-7.9) vaut -7 (tronque vers zéro — supprime la partie décimale), tandis que -7.9 // 1 vaut -8.0 (arrondit vers moins l'infini). Ils s'accordent pour les nombres positifs mais divergent pour les négatifs, exactement le piège dont avertit la section « Erreurs courantes » ci-dessus.</>}>

Prédisez `int(-7.9)` et `-7.9 // 1`. Sont-ils identiques ? Essayez les deux dans le bac à sable et expliquez toute différence en utilisant ce que vous avez appris sur la troncature par rapport à l'arrondi vers le bas.

</Challenge>

<Challenge id="python101-normal-w1-c6" answer={<>Étendez la calculatrice de pourboire : lisez une troisième entrée pour le nombre de personnes, convertissez-la en <code>int</code>, et divisez <code>total</code> par ce nombre pour obtenir <code>per_person</code>, affiché avec le format <code>:.2f</code> comme les autres montants.</>}>

Étendez la calculatrice de pourboire de l'exemple pratique pour aussi demander combien de personnes se partagent l'addition, et affichez la part de chacun.

</Challenge>

## 🤔 Questions socratiques

- `input()` retourne toujours une `str`. Que se passerait-il si vous essayiez `age + 10` *sans* d'abord convertir avec `age = int(input(...))` ? Que vous dit réellement le message d'erreur ?
- Si `x = 5` puis `y = x`, puis `x = 10`, quelle est la valeur de `y` ? Expliquez cela du point de vue « les noms pointent vers des valeurs » plutôt que « les boîtes contiennent des valeurs ».
- En Python, `0.1 + 0.2` ne s'affiche pas **exactement** comme `0.3`. Essayez-le dans le bac à sable. Pourquoi un `float` — qui approxime $\mathbb{R}$ avec un nombre fini de chiffres binaires — pourrait-il ne pas représenter $0.1$ exactement, de la même façon que $\frac{1}{3}$ n'a pas de développement décimal fini ?
- `bool(0)` est `False` et `bool(1)` est `True` — mais que prédisez-vous pour `bool(-1)` et `bool(2)` ? Testez votre prédiction. Quelle règle unique explique les quatre résultats ?
- L'affectation composée `x += 1` et la forme classique `x = x + 1` produisent le même résultat pour les nombres. Pouvez-vous imaginer une raison pour laquelle un langage proposerait quand même les deux formes, plutôt que d'exiger que tout le monde écrive toujours `x = x + 1` ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="python-101-normal-week-1"
  questions={[
    {
      id: 'q1',
      prompt: "Quel est le type du résultat de 7 / 2 en Python 3 ?",
      options: ['int', 'float', 'str', 'bool'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: "Que retourne toujours input(), quoi que l'utilisateur saisisse ?",
      options: ['int', 'float', 'str', 'bool'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'Que vaut 17 % 5 ?',
      options: ['3', '2', '5', '0'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: "Quel opérateur teste l'égalité (et non l'affectation) ?",
      options: ['=', '==', '===', 'is'],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'Que vaut int(4.9) ?',
      options: ['5', '4', '4.9', 'Une TypeError'],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-normal-week-1" />
