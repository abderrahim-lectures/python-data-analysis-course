---
title: "Définir des fonctions"
description: "Créez des blocs de code réutilisables avec def, les paramètres et les valeurs de retour."
module: "functions"
order: 11
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "Définir et appeler des fonctions avec def"
  - "Utiliser des paramètres positionnels, nommés et par défaut"
  - "Renvoyer des valeurs depuis les fonctions"
  - "Écrire des docstrings pour documenter les fonctions"
prerequisites: ["10-range-enumerate-zip"]
tags: ["def", "paramètres", "return", "docstrings"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## De la formule à la machine nommée

Les mathématiques abhorrent la répétition. Vous avez appris $f(x) = x^2 - 5x + 6$ comme une *règle*, une définition, employée mille fois, sur mille entrées différentes :

$$
f(x) = x^2 - 5x + 6, \qquad f(2) = 0.
$$

Le `def` de Python est le même geste : lier un nom à un calcul, pour que n'importe quel appelant puisse l'appliquer. La fonction est une machine avec des fentes d'entrée étiquetées et une porte de sortie :

```python
def add(a, b):
    return a + b

result = add(3, 5)  # 8
```

Le nom, les parenthèses tenant les paramètres $a, b$, les deux points qui amorcent la recette, voilà la définition. L'appel `add(3, 5)` consiste à appliquer la règle en $a=3$, $b=5$, exactement comme $f(2)$ applique une règle en $x=2$.

## Définir et appeler

La première fonction que vous écrivez change le monde un salut à la fois :

```python
def greet(name):
    """Print a greeting for the given name."""
    print(f"Hello, {name}!")

greet("Alice")  # Hello, Alice!
```

Trois parties méritent un nom. Les **paramètres** sont les variables de la définition, les fentes d'entrée $x$. Les **arguments** sont les valeurs concrètes fournies au site d'appel, l'entrée $2$. Et la ligne entre triples guillemets à l'intérieur est la **docstring** : de la documentation vivant à côté du code, pour que `help(greet)` puisse répondre ce que fait la fonction.

## Return : la porte de sortie

`print` envoie du texte à l'écran ; `return` rend une valeur à l'appelant. La distinction est subtile et décisive :

```python
def add(a, b):
    return a + b

result = add(3, 5)          # result == 8
printed = print("8")        # printed est None — print ne renvoie rien
```

Une fonction sans `return` renvoie silencieusement `None`, la machine ne produit aucune sortie. Quand vous voulez que le résultat arithmétique de votre fonction continue de circuler, souvenez-vous : `return`, pas `print`.

## Paramètres par défaut

Certains paramètres ont un réglage naturel que la plupart des appels garderont. Donnez-leur une valeur par défaut, et les appelants pourront la remplacer :

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))              # Hello, Alice!
print(greet("Bob", "Hey"))         # Hey, Bob!
```

La règle d'ordre est rigide : **les paramètres par défaut viennent après les autres.** `def f(x, y=5)` est légal ; `def f(x=1, y)` est une erreur de syntaxe, car Python résout les arguments par position depuis la gauche et un trou serait ambigu.

## Arguments nommés

Les arguments peuvent aussi arriver nommés, ce qui achète de la clarté quand l'ensemble des paramètres grandit :

```python
def create_user(name, age, role="student"):
    return {"name": name, "age": age, "role": role}

user = create_user(age=25, name="Alice", role="admin")
```

Les arguments nommés peuvent venir dans n'importe quel ordre, le nom du paramètre est l'étiquette de chaque paquet. Un appel qui nomme ses entrées se lit comme une phrase au lieu d'un code à décoder.

## *args et **kwargs

Et si le nombre d'entrées est inconnu d'avance ? Une somme ne sait pas combien de termes elle recevra. `*args` recueille tout nombre d'arguments positionnels dans un tuple ; `**kwargs` recueille les arguments nommés dans un dict :

```python
def total(*args):
    return sum(args)

print(total(1, 2, 3, 4))  # 10

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25)
```

L'étoile est le geste : `*` déplie la liste d'arguments en un faisceau. C'est la différence entre une somme à signature fixe et une somme qui accepte $\sum_{i=1}^{n} a_i$ pour tout $n$.

## Le retour anticipé comme garde

Certains codes commencent par vérifier l'unique cas qui ne doit pas aller plus loin. Les raisonnements de la forme *« sauf si $b=0$ »* s'énoncent comme une garde en haut, rendant immédiatement :

```python
def divide(a, b):
    if b == 0:
        return None
    return a / b
```

Une clause de garde aplatit une paire `if/else` en ligne droite : le cas d'échec sort tôt et le chemin honnête s'exécute sans imbrication.

## Un exemple travaillé : la machine f

La quadratique qui a ouvert la leçon devient trois instructions `return` :

```python
def quad(x):
    """Renvoie x² − 5x + 6."""
    return x * x - 5 * x + 6

quad(2)    # 0
quad(3)    # 0
quad(1)    # 2
```

La même règle, trois entrées. La formule $f(x) = x^2 - 5x + 6$ devient une machine réutilisable : on la définit une fois, on l'applique mille fois, et la docstring laisse écrit quelle règle elle enferme.

## Pièges courants

- **Arguments par défaut mutables.** `def f(items=[])` crée *une* liste partagée entre tous les appels, les éléments s'empilent d'un appel à l'autre. Mettez `None` par défaut et construisez la liste à l'intérieur.
- **Oublier `return`.** Une fonction sans retour rend `None` ; vous demandiez une valeur et avez reçu une ombre.
- **Trop de paramètres.** Passé trois ou quatre, les fentes deviennent un casse-tête. Regroupez les arguments affines dans un dict ou un dataclass.
- **Appeler une fonction définie plus bas.** Python exécute de haut en bas ; appeler `f()` avant que le `def f` n'atteigne l'interpréteur lève une `NameError`. Définissez avant d'appeler.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Écrivez `is_palindrome(text)` qui renvoie `True` quand la chaîne se lit pareil dans les deux sens ; ignorez la casse.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>def is_palindrome(text): return text.lower() == text.lower()[::-1]</code>, la mise en minuscules symétrise la comparaison, et la tranche inversée <code>[::-1]</code> est l'image miroir.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Écrivez `fizzbuzz(n)` qui renvoie une liste de 1 à $n$, remplaçant les multiples de 3 par `"Fizz"`, les multiples de 5 par `"Buzz"` et les multiples des deux par `"FizzBuzz"`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> Les multiples des deux sont des multiples de $\mathrm{lcm}(3,5) = 15$, alors testez ce cas d'abord : <code>["FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else i for i in range(1, n+1)]</code>.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi les paramètres par défaut doivent-ils suivre les autres ? Que se casserait-il si la règle était inversée ?
- Que vous donne `*args` qu'un unique paramètre liste ne donne pas ? Quand préférez-vous l'un à l'autre ?
- Comment Python décide-t-il quelle définition appliquer quand coexistent `def f(x)` et `def f(x, y=5)` ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-functions">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que renvoie ceci ? <code>def f(x, y=3): return x + y; f(5)</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">8</button>
      <button class="quiz-q__opt" data-idx="2">Error</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Quelle est la sortie ? <code>def f(a, b=[]): b.append(a); return b; print(f(1)); print(f(2))</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1] puis [2]</button>
      <button class="quiz-q__opt" data-idx="1">[1] puis [1, 2]</button>
      <button class="quiz-q__opt" data-idx="2">[1, 2] puis [1, 2]</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>