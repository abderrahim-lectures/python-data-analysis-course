---
title: "Semaine 2 : Structures de contrôle"
sidebar_position: 2
section: python-101
track: normal
week: 2
description: "Maîtrisez le flux de contrôle en Python : conditions if/else et boucles for/while, avec des défis pratiques directement dans votre navigateur."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semaine 2 : Structures de contrôle

<span className="gamified-flourish">🔀 Cette semaine, vos programmes arrêtent d'exécuter les trois mêmes lignes à chaque fois et commencent à prendre des décisions.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine, vous serez capable de :
- Ramifier le comportement d'un programme avec `if` / `elif` / `else`.
- Combiner des conditions avec `and`, `or` et `not`.
- Répéter des actions avec les boucles `while` et `for`, et choisir la bonne.
- Utiliser `range()` pour boucler un nombre fixe de fois, et `break`/`continue` pour contrôler une boucle en avance.
- Imbriquer boucles et conditions pour résoudre des problèmes comportant plusieurs éléments variables.

## Cours

### La ramification : `if` / `elif` / `else`

Une instruction `if` est une définition par morceaux. Comparez :

$$
f(x) = \begin{cases} \text{"negative"} & x < 0 \\ \text{"zero"} & x = 0 \\ \text{"positive"} & x > 0 \end{cases}
$$

```python
x = -3
if x < 0:
    print("negative")
elif x == 0:
    print("zero")
else:
    print("positive")
```

L'indentation n'est pas ici une simple question de style — elle **est** la syntaxe. Tout ce qui est indenté sous `if` appartient à cette branche ; Python n'a pas de `{ }` pour délimiter les blocs. Un bloc a besoin d'au moins une instruction — si vous voulez une branche qui ne fait volontairement rien (par exemple lorsque vous esquissez la structure d'un programme avant de le remplir), utilisez `pass`, une instruction dont le seul rôle est de ne rien faire :

```python
if x < 0:
    pass   # TODO: handle negative numbers later
else:
    print("non-negative")
```

### Combiner des conditions : `and`, `or`, `not`

Tout comme $\land$, $\lor$, $\neg$ en logique, Python dispose de `and`, `or`, `not` pour combiner des expressions booléennes :

```python
age = 20
has_ticket = True

if age >= 18 and has_ticket:
    print("Welcome in")

if age < 13 or age > 65:
    print("Discount applies")

if not has_ticket:
    print("Buy a ticket first")
```

Elles suivent les mêmes tables de vérité que vous attendez : `and` est vrai seulement quand *les deux* côtés sont vrais ; `or` est vrai quand *au moins un* côté est vrai ; `not` inverse un booléen. Python pratique aussi l'évaluation en court-circuit : dans `a and b`, si `a` est déjà `False`, Python n'évalue même jamais `b`, puisque l'expression entière doit être `False` quoi qu'il arrive. Cela compte lorsque l'évaluation de `b` pourrait être coûteuse ou dangereuse — par exemple `x != 0 and 10 / x > 1` ne risque jamais de diviser par zéro, car si `x != 0` vaut `False`, la division est entièrement sautée.

### `while` : répéter jusqu'à ce qu'une condition échoue

Une boucle `while` est ce qui se rapproche le plus d'une relation de récurrence mathématique avec une condition d'arrêt :

```python
n = 5
while n > 0:
    print(n)
    n = n - 1
print("liftoff!")
```

Ceci affiche `5 4 3 2 1 liftoff!`. La boucle revérifie `n > 0` avant chaque itération — si vous oubliez de mettre à jour `n` à l'intérieur de la boucle, elle ne devient jamais fausse, et vous obtenez une boucle infinie.

`while` est l'outil approprié quand vous ne connaissez pas à l'avance le nombre d'itérations nécessaires — la condition d'arrêt dépend de quelque chose qui se produit *pendant* la boucle, comme une saisie utilisateur ou une recherche pouvant se terminer plus tôt :

```python
guess = None
target = 42
while guess != target:
    guess = int(input("Guess the number: "))
print("Correct!")
```

### `for` : répéter sur une séquence connue

Une boucle `for` parcourt directement une séquence de valeurs — pensez-y comme à $\sum_{i \in S}$ où $S$ est ce que vous parcourez, sauf que vous exécutez du code pour chaque $i$ au lieu d'additionner des nombres :

```python
for letter in "cat":
    print(letter)   # c, a, t — un par ligne
```

`range(n)` produit la séquence $0, 1, \dots, n-1$ — exactement l'ensemble d'indices que vous utiliseriez pour $\sum_{i=0}^{n-1}$ :

```python
total = 0
for i in range(5):
    total = total + i
print(total)   # 0+1+2+3+4 = 10
```

`range(start, stop)` et `range(start, stop, step)` généralisent cela, en reflétant une suite arithmétique $a, a+d, a+2d, \dots$ :

```python
for i in range(2, 10, 2):
    print(i)   # 2, 4, 6, 8 — commence à 2, s'arrête avant 10, pas de 2
```

Un pas négatif compte à rebours : `range(5, 0, -1)` produit `5, 4, 3, 2, 1`, la même séquence que l'exemple de compte à rebours en `while` de la Semaine 1, construite à la main.

### `break` et `continue`

`break` quitte immédiatement une boucle ; `continue` passe à l'itération suivante sans terminer l'itération en cours :

```python
for i in range(10):
    if i == 5:
        break        # stop entirely once i reaches 5
    if i % 2 == 0:
        continue     # skip printing even numbers
    print(i)          # prints 1, 3
```

### Imbrication : boucles et conditions les unes dans les autres

Le corps d'une boucle — ou une branche `if` — peut contenir une autre boucle ou un autre `if`, exactement comme les cas d'une fonction définie par morceaux peuvent eux-mêmes comporter des conditions supplémentaires. Chaque niveau d'imbrication ajoute un niveau d'indentation supplémentaire :

```python
for row in range(1, 4):
    for col in range(1, 4):
        print(row * col, end=" ")   # end=" " prints a space instead of a newline
    print()                          # move to the next line after each row
```

Ceci affiche une petite table de multiplication 3×3 :

```
1 2 3
2 4 6
3 6 9
```

La boucle interne s'exécute entièrement à *chaque* itération de la boucle externe — pour 3 itérations externes et 3 itérations internes chacune, cela fait $3 \times 3 = 9$ instructions d'affichage au total, le même principe de comptage qui sous-tend une double somme $\sum_{r=1}^{3}\sum_{c=1}^{3}$.

## ⚠️ Pièges courants

- **Erreurs de décalage d'un cran avec `range`.** `range(1, 10)` s'arrête *avant* 10, ce qui donne `1..9`. Si vous voulez inclure 10, il vous faut `range(1, 11)`.
- **Oublier de mettre à jour la variable de boucle dans un `while`.** `while n > 0: print(n)` sans `n -= 1` à l'intérieur ne se termine jamais.
- **Utiliser `=` au lieu de `==` dans une condition.** Python détecte en fait cette erreur pour vous (`if x = 5:` déclenche une `SyntaxError`), contrairement à certains autres langages — mais il reste utile de comprendre pourquoi ce serait un bug si c'était autorisé.
- **Supposer que les chaînes `elif` vérifient toutes les branches.** Dès qu'une condition `elif`/`if` correspond, le reste est entièrement sauté — l'ordre compte, en particulier pour des conditions qui se chevauchent comme le cas « divisible à la fois par 3 et par 5 » de FizzBuzz.

## 🧩 Défis

<Challenge id="python101-normal-w2-c1" answer={<>Utilisez une boucle <code>for</code> sur <code>range(1, 11)</code>, et à l'intérieur une chaîne <code>if/elif/else</code> vérifiant la divisibilité par 15, puis par 3, puis par 5, avec un <code>else</code> final qui affiche le nombre lui-même.</>}>

Écrivez « FizzBuzz » pour les nombres de 1 à 10 : affichez `"Fizz"` si divisible par 3, `"Buzz"` si divisible par 5, `"FizzBuzz"` si divisible par les deux, sinon le nombre lui-même.

</Challenge>

<Challenge id="python101-normal-w2-c2" answer={<>Une boucle <code>while</code> qui continue d'appeler <code>input()</code> et de vérifier <code>== "quit"</code> pour décider si elle doit exécuter <code>break</code>, car vous ne savez pas à l'avance combien de fois l'étudiant répondra.</>}>

Écrivez une boucle qui continue de demander `"Type 'quit' to stop: "` jusqu'à ce que l'étudiant tape exactement `quit`. `for` ou `while` conviendrait-il mieux à cette tâche, et pourquoi ?

</Challenge>

<Challenge id="python101-normal-w2-c3" answer={<>Initialisez <code>total = 0</code>, bouclez avec <code>for i in range(1, 101)</code>, ajoutez <code>i</code> à <code>total</code> à chaque fois, puis affichez-le. La formule fermée n(n+1)/2 avec n=100 donne 5050, ce qui vous permet de vérifier la réponse de la boucle sans la ré-exécuter.</>}>

Additionnez les entiers de 1 à 100 à l'aide d'une boucle, et vérifiez la réponse de votre programme par rapport à la formule fermée $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$.

</Challenge>

<Challenge id="python101-normal-w2-c4" answer={<>Bouclez sur <code>range(2, n)</code> et vérifiez si <code>n % i == 0</code> pour l'un d'eux à l'aide d'un drapeau ou de <code>break</code> ; si aucun diviseur n'est trouvé, <code>n</code> est premier. C'est exactement la définition de la primalité « pour tout i de 2 à n-1, n modulo i n'est pas 0 » écrite sous forme de code.</>}>

Écrivez un programme qui lit un nombre `n` et affiche s'il est premier, en vérifiant si un entier quelconque de 2 jusqu'à (mais sans l'inclure) `n` le divise exactement.

</Challenge>

<Challenge id="python101-normal-w2-c5" answer={<>Utilisez des boucles for imbriquées comme dans l'exemple de la table de multiplication : une boucle externe pour les lignes et une boucle interne pour les colonnes, affichant un caractère fixe (par exemple <code>"*"</code>) avec <code>end=""</code> dans la boucle interne, et un <code>print()</code> simple après la boucle interne pour passer à la ligne suivante.</>}>

À l'aide de boucles imbriquées, affichez un carré d'astérisques, `n` lignes sur `n` colonnes, pour un nombre `n` de votre choix (par exemple un bloc 4×4 de caractères `*`).

</Challenge>

<Challenge id="python101-normal-w2-c6" answer={<>if 18 &lt;= age &lt; 65 and has_ticket: ... — en combinant la comparaison chaînée de la Semaine 1 avec and, ce qui reflète exactement 18 ≤ age {"<"} 65.</>}>

Écrivez une condition utilisant `and` qui vérifie si une variable `age` est comprise entre 18 et 65 (18 inclus, 65 exclu) *et* qu'un booléen `has_ticket` vaut `True`.

</Challenge>

## 🤔 Questions socratiques

- Que se passe-t-il si vous écrivez `while True:` sans `break` à l'intérieur ? Essayez prudemment dans le bac à sable (vous devrez peut-être arrêter l'exécution manuellement) — pourquoi cela diffère-t-il d'une boucle `for` sur un `range` fixe ?
- Dans FizzBuzz, pourquoi le cas divisible par les deux (`FizzBuzz`) doit-il être vérifié *avant* les vérifications séparées `Fizz`/`Buzz`, ou géré avec `and` ? Que se passerait-il de travers avec un ordre `elif` naïf ?
- `for i in range(5):` et `i = 0; while i < 5: ...; i += 1` font la même chose. Dans quelles circonstances seriez-vous *obligé* d'utiliser `while` parce que `for` ne peut vraiment pas l'exprimer ?
- L'évaluation en court-circuit signifie que `a and b` saute l'évaluation de `b` si `a` vaut déjà `False`. Pouvez-vous imaginer une situation (au-delà de l'exemple de la division par zéro ci-dessus) où cela compte pour plus qu'une simple question de performance — où évaluer `b` alors qu'il ne devrait pas l'être serait réellement *incorrect*, et pas seulement du gaspillage ?
- L'exemple de la table de multiplication imbrique un `for` dans un `for`. À quoi ressemblerait l'imbrication d'un `while` dans un `for`, et pouvez-vous imaginer une tâche réelle (pas juste un exemple inventé) où cette combinaison serait le choix naturel ?

## ✅ Quiz hebdomadaire

<WeeklyQuiz
  weekId="python-101-normal-week-2"
  questions={[
    {
      id: 'q1',
      prompt: 'Que produit range(5) ?',
      options: ['1,2,3,4,5', '0,1,2,3,4', '0,1,2,3,4,5', '5,4,3,2,1'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: "Quelle instruction quitte immédiatement la boucle englobante la plus proche ?",
      options: ['continue', 'return', 'break', 'pass'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: "Qu'est-ce qui détermine quelles lignes appartiennent à un bloc if en Python ?",
      options: ['Les accolades {}', "L'indentation", 'Les points-virgules', 'Les parenthèses'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Une boucle while dont la condition ne devient jamais False va :',
      options: [
        'Lever immédiatement une SyntaxError',
        "S'exécuter une fois puis s'arrêter",
        'Boucler indéfiniment (boucle infinie)',
        'Être automatiquement convertie en boucle for',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'Dans "a and b", si a s\'évalue à False, que se passe-t-il pour b ?',
      options: [
        'Il est quand même évalué, mais ignoré',
        "Il n'est jamais évalué (évaluation en court-circuit)",
        'Il lève une SyntaxError',
        "Il est évalué en premier, avant a",
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-normal-week-2" />
