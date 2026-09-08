---
title: "Méthodes de chaînes"
description: "Divisez, joignez, remplacez et transformez du texte avec la boîte à outils de chaînes de Python."
module: "strings"
order: 13
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Utiliser split() et join() pour convertir entre chaînes et listes"
  - "Appliquer strip(), replace(), find(), startswith(), endswith()"
  - "Formater des chaînes avec la syntaxe f-string avancée"
  - "Comprendre l'immuabilité — les méthodes de chaîne renvoient de nouvelles chaînes"
prerequisites: ["12-scope-and-lambdas"]
tags: ["chaînes", "méthodes", "split", "join", "strip", "replace"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Les chaînes sont immuables

Chaque méthode de chaîne renvoie une **nouvelle** chaîne — l'originale n'est jamais modifiée :

```python
name = "alice"
upper = name.upper()
print(name)    # alice  (unchanged)
print(upper)   # ALICE
```

## Diviser et joindre

Convertissez entre chaînes et listes :

```python
sentence = "hello world python"
words = sentence.split()       # ['hello', 'world', 'python']
back = " ".join(words)         # 'hello world python'

csv_line = "apple,banana,cherry"
fruits = csv_line.split(",")   # ['apple', 'banana', 'cherry']
```

## Chercher et tester

```python
text = "Hello, World!"

text.startswith("Hello")   # True
text.endswith("!")         # True
text.find("World")         # 7  (index of first match, -1 if not found)
text.count("l")            # 3
text.replace("World", "Python")  # 'Hello, Python!'
```

## Casse et espaces blancs

```python
"hello".upper()        # 'HELLO'
"HELLO".lower()        # 'hello'
"  hi  ".strip()       # 'hi'  (removes leading/trailing whitespace)
"  hi  ".lstrip()      # 'hi ' (left only)
"  hi  ".rstrip()      # '  hi' (right only)
"hello world".title()  # 'Hello World'
```

## Formatage f-string avancé

```python
price = 19.999
name = "Widget"

# Width and alignment
print(f"|{name:<15}|")   # |Widget          |  (left-align, width 15)
print(f"|{name:>15}|")   # |          Widget|  (right-align)
print(f"|{name:^15}|")   # |     Widget     |  (center)

# Number formatting
print(f"{price:.2f}")     # 20.00
print(f"{42:05d}")        # 00042  (zero-padded)
print(f"{0.857:.1%}")     # 85.7%  (percentage)
```

## Pièges courants

- **Oublier que split() sans arguments** divise sur les espaces blancs, pas sur la chaîne vide
- **S'attendre à ce que find() lève une erreur** — elle renvoie -1 à la place
- **Essayer de modifier une chaîne en place** — réaffectez toujours le résultat

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez une fonction `title_case(s)` qui met en majuscule la première lettre de chaque mot : `title_case("hello world")` → `"Hello World"`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>return s.title()</code> — la fonction intégrée de Python fait exactement cela.</p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Étant donné `"one,two,,three"`, écrivez du code qui divise sur les virgules et supprime les chaînes vides.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>[x for x in s.split(",") if x]</code> ou <code>list(filter(None, s.split(",")))</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Pourquoi `find()` renvoie-t-il -1 au lieu de lever une erreur ? Quel est le compromis ?
- Comment inverseriez-vous une chaîne en Python ? Existe-t-il une méthode pour cela, ou faut-il une approche différente ?
- Quand `str.replace()` est-elle le mauvais outil pour la tâche ? Qu'utiliseriez-vous à la place ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

<div class="quiz" data-quiz="python-101-string-methods">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que renvoie <code>"a,b,c".split(",")</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">['abc']</button>
      <button class="quiz-q__opt" data-idx="1">['a', 'b', 'c']</button>
      <button class="quiz-q__opt" data-idx="2">'abc'</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Que renvoie <code>"hello".find("xyz")</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0</button>
      <button class="quiz-q__opt" data-idx="1">None</button>
      <button class="quiz-q__opt" data-idx="2">-1</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>