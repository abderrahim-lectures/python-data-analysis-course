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

## Définir une fonction

Utilisez `def` suivi d'un nom, de parenthèses et de deux points :

```python
def greet(name):
    """Print a greeting for the given name."""
    print(f"Hello, {name}!")

greet("Alice")  # Hello, Alice!
```

## Paramètres et arguments

Les paramètres sont les variables listées dans la définition de la fonction. Les arguments sont les valeurs que vous passez en l'appelant.

```python
def add(a, b):
    return a + b

result = add(3, 5)  # 8
```

## Paramètres par défaut

Donnez une valeur par défaut aux paramètres — les appelants peuvent la remplacer optionnellement :

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))              # Hello, Alice!
print(greet("Bob", "Hey"))         # Hey, Bob!
```

**Règle** : les paramètres par défaut doivent venir après les paramètres sans défaut.

## Arguments nommés

Appelez les fonctions par nom de paramètre pour plus de clarté :

```python
def create_user(name, age, role="student"):
    return {"name": name, "age": age, "role": role}

user = create_user(age=25, name="Alice", role="admin")
```

## *args et **kwargs

Acceptez tout nombre d'arguments positionnels ou nommés :

```python
def total(*args):
    return sum(args)

print(total(1, 2, 3, 4))  # 10

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25)
```

## Retours précoces

Renvoyez tôt pour les clauses de garde — cela réduit l'imbrication :

```python
def divide(a, b):
    if b == 0:
        return None
    return a / b
```

## Pièges courants

- **Arguments par défaut mutables** : `def f(items=[])` partage la même liste entre les appels. Utilisez `None` à la place : `def f(items=None): items = items or []`
- **Oublier le `return`** : une fonction sans `return` produit `None`
- **Trop de paramètres** (4+) : envisagez d'utiliser un dictionnaire ou une dataclass

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez une fonction `is_palindrome(text)` qui renvoie `True` si la chaîne se lit de la même façon dans les deux sens (ignorer la casse).

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>def is_palindrome(text): return text.lower() == text.lower()[::-1]</code></p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez une fonction `fizzbuzz(n)` qui renvoie une liste de 1 à n, en remplaçant les multiples de 3 par "Fizz", les multiples de 5 par "Buzz" et les multiples des deux par "FizzBuzz".

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>["FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else i for i in range(1, n+1)]</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Pourquoi Python exige-t-il que les paramètres par défaut viennent après les paramètres sans défaut ? Que se passerait-il si la règle était inversée ?
- Quel problème `*args` résout-il qu'un paramètre de liste ne résout pas ? Quand préféreriez-vous l'un à l'autre ?
- Comment Python décide-t-il quelle fonction appeler quand vous avez à la fois `def f(x)` et `def f(x, y=5)` ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

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

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Quelle est la sortie ? <code>def f(a, b=[]): b.append(a); return b; print(f(1)); print(f(2))</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1] then [2]</button>
      <button class="quiz-q__opt" data-idx="1">[1] then [1, 2]</button>
      <button class="quiz-q__opt" data-idx="2">[1, 2] then [1, 2]</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>