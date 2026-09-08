---
title: "If / Elif / Else"
description: "Faites bifurquer votre code selon des conditions — le fondement de la prise de décision en Python."
module: "control-flow"
order: 8
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Écrire des blocs if/elif/else pour bifurquer la logique"
  - "Utiliser les opérateurs de comparaison et booléens dans les conditions"
  - "Comprendre les valeurs vraies et fausses en Python"
  - "Écrire des conditions imbriquées quand c'est nécessaire"
prerequisites: ["07-boolean-operators"]
tags: ["if", "elif", "else", "conditionnelles", "vraies-fausses"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Instructions if

Un bloc `if` exécute son corps seulement quand la condition est `True` :

```python
score = 85
if score >= 60:
    print("Passing!")
```

## Ajouter else

`else` rattrape tout ce que le `if` n'a pas pris :

```python
score = 45
if score >= 60:
    print("Passing!")
else:
    print("Needs more work")
```

## Elif pour plusieurs branches

`elif` (abréviation de « else if ») vérifie les conditions dans l'ordre et s'arrête à la première correspondance :

```python
score = 78
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
print(grade)  # B
```

Une seule branche s'exécute — la première condition qui vaut `True`.

## Valeurs vraies et fausses

Python traite certaines valeurs comme `True` et d'autres comme `False` dans un contexte booléen :

```python
# These are all "falsy":
bool(0)       # False
bool(0.0)     # False
bool("")      # False
bool([])      # False
bool(None)    # False

# Everything else is "truthy":
bool(1)       # True
bool("hello") # True
bool([1, 2])  # True
```

Cela signifie que vous pouvez écrire des conditions propres sans comparaisons explicites :

```python
name = ""
if not name:
    print("Name is empty")

items = [1, 2, 3]
if items:
    print("We have items")
```

## Imbrication

Vous pouvez placer des blocs `if` dans d'autres blocs `if`, mais gardez l'imbrication peu profonde pour la lisibilité :

```python
age = 25
has_id = True

if age >= 21:
    if has_id:
        print("Entry allowed")
    else:
        print("Need ID")
else:
    print("Too young")
```

## Pièges courants

- **Oublier les deux points** après `if`, `elif` ou `else`
- **Utiliser `=` au lieu de `==`** dans les conditions (`=` affecte, `==` compare)
- **Sur-imbriquer** quand un `elif` ou un `return` précoce serait plus propre

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez une fonction `classify_temp(temp)` qui renvoie :
- `"freezing"` si temp < 0
- `"cold"` si 0 <= temp < 15
- `"warm"` si 15 <= temp < 30
- `"hot"` si temp >= 30

<p class="challenge__answer">💡 <strong>Réponse :</strong> Utilisez une chaîne <code>elif</code> : <code>if temp &lt; 0: return "freezing" elif temp &lt; 15: return "cold" elif temp &lt; 30: return "warm" else: return "hot"</code></p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Étant donné `text = "Hello, World!"`, écrivez une vérification qui affiche `"uppercase"` si le texte est tout en majuscules, `"lowercase"` si tout en minuscules, ou `"mixed"` sinon.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>if text.isupper(): print("uppercase") elif text.islower(): print("lowercase") else: print("mixed")</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Pourquoi Python utilise-t-il `elif` au lieu de `else if` ? Que se passerait-il si vous écriviez `else if` ?
- Si `score = 85`, combien de conditions `if score >= 90: ... elif score >= 80: ... elif score >= 70: ...` évalue-t-il avant d'entrer dans une branche ?
- Quelle est la différence entre `if x:` et `if x is not None:` ? Quand chacune compte-t-elle ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

<div class="quiz" data-quiz="python-101-control-flow">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Qu'est-ce que ceci affiche ? <code>x = 0; if x: print("yes") else: print("no")</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">yes</button>
      <button class="quiz-q__opt" data-idx="1">Error</button>
      <button class="quiz-q__opt" data-idx="2">no</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. Quelle condition est vérifiée en premier ? <code>if x > 5: ... elif x > 10: ... elif x > 3: ...</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">x > 10</button>
      <button class="quiz-q__opt" data-idx="1">x > 5</button>
      <button class="quiz-q__opt" data-idx="2">x > 3</button>
      <button class="quiz-q__opt" data-idx="3">Ils s'exécutent en parallèle</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>