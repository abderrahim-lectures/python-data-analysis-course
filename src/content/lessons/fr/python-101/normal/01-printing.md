---
title: "Impression et sortie"
description: "Affichez des résultats avec print(), formatez le texte avec les f-strings et contrôlez ce qui apparaît à l'écran."
module: "python-basics"
order: 1
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Utiliser print() pour afficher des valeurs et des messages"
  - "Formater la sortie avec les f-strings et les spécificateurs de format"
  - "Combiner plusieurs valeurs dans un seul appel à print()"
prerequisites: []
tags: ["sortie", "print", "f-strings", "formatage"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Imprimer des valeurs

`print()` envoie une sortie à l'écran. Passez-lui n'importe quelle valeur et Python la convertit en texte :

```python
print(42)         # 42
print(3.14)       # 3.14
print("hello")    # hello
```

Plusieurs arguments sont combinés avec une espace :

```python
print("Score:", 87)    # Score: 87
```

## F-strings : sortie formatée

Préfixez une chaîne avec `f` et placez des expressions entre `{ }` :

```python
name = "Amina"
score = 87.5
print(f"{name} scored {score}%")    # Amina scored 87.5%
```

Les spécificateurs de format contrôlent la précision et l'alignement :

```python
price = 19.999
print(f"Total: ${price:.2f}")       # Total: $20.00 — rounds to 2 decimal places
print(f"Double: {price * 2}")       # any expression works inside { }
```

Même les conditions fonctionnent en ligne :

```python
passing = "yes" if score >= 60 else "no"
print(f"Passing? {passing}")
```

## Pièges courants

- **Oublier que `print()` n'a pas de valeur de retour.** `print("hi")` affiche du texte, mais l'expression s'évalue à `None` — vous ne pouvez pas récupérer son résultat.
- **Mélanger les types dans une concaténation.** `print("Score: " + 87)` lève une `TypeError`. Utilisez plutôt les f-strings : `print(f"Score: {87}")`.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Affichez votre nom, votre âge et un nombre favori, chacun sur sa propre ligne, avec trois appels distincts à `print()`. Faites ensuite la même chose avec une seule f-string contenant des retours à la ligne (`\n`).

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>print(f"Name: {name}\nAge: {age}\nFavorite: {num}")</code> — le <code>\n</code> dans la f-string produit un retour à la ligne.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Étant donné `temperature = 23.7891`, affichez-la sous la forme `"Today: 23.8°C"` (une décimale).

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>print(f"Today: {temperature:.1f}°C")</code> — le spécificateur de format <code>:.1f</code> arrondit à une décimale.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi Python utilise-t-il `print()` comme une fonction (avec des parenthèses) plutôt que comme une instruction ? Quel avantage cela vous procure-t-il ?
- `print("A", "B", "C")` affiche `A B C` avec des espaces. Comment pourriez-vous les afficher sans espace ? Avec des virgules entre eux ?
- Si `x = 3.14`, que produit `f"{x}"` ? Et `f"{x:.0f}"` ? Expliquez la différence.

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-printing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Qu'affiche print(f"{'yes' if 5 > 3 else 'no'}") ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5 > 3</button>
      <button class="quiz-q__opt" data-idx="1">yes</button>
      <button class="quiz-q__opt" data-idx="2">no</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Comment imprimer 3.14159 sous la forme 3.14 (deux décimales) ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f"{x:2f}"</button>
      <button class="quiz-q__opt" data-idx="1">f"{x:.2f}"</button>
      <button class="quiz-q__opt" data-idx="2">f"{x:.2f}"</button>
      <button class="quiz-q__opt" data-idx="3">f"{x:2.0f}"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>