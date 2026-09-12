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

## De la condition à la décision

L'arithmétique évalue ; la comparaison décide ; mais un programme qui ne fait qu'évaluer parcourt une ligne droite de haut en bas. La vie n'est pas une ligne droite. Une note est une *fonction par morceaux* : sa formule change à certains seuils. En mathématiques vous écrivez

$$
\mathrm{grade}(s) =
\begin{cases}
A & s \geq 90,\\
B & s \geq 80,\\
C & s \geq 70,\\
F & \text{sinon}.
\end{cases}
$$

Le `if`/`elif`/`else` de Python est la transcription d'une formule par morceaux. Chaque morceau garde sa plage, et exactement un morceau se déclenche.

## La fourche simple

La branche la plus simple exécute son corps seulement quand la condition est `True` :

```python
score = 85
if score >= 60:
    print("Passing!")
```

La déclaration commence par `if`, puis la condition, puis les deux points — les deux points disent à Python qu'un bloc arrive. Tout ce qui est indenté en dessous appartient à cette branche et ne s'exécute que si la condition tenait.

## La fourche double

`else` attrape tout ce que le `if` n'a pas :

```python
score = 45
if score >= 60:
    print("Passing!")
else:
    print("Needs more work")
```

Une branche double est une partition des issues : la condition divise l'espace des valeurs en deux moitiés, et chaque cas atterrit dans exactement une.

## La fourche multiple : elif

Les formules par morceaux réelles ont plus de deux morceaux. `elif` — contraction de « else if » — ajoute d'autres conditions, vérifiées dans l'ordre, s'arrêtant à la première qui est `True` :

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

Remarquez l'économie : chaque condition `elif` n'a besoin que d'une borne inférieure, car les cas au-dessus sont déjà tranchés. Avec $s = 85$, le premier morceau échoue et le second réussit — les branches suivantes ne s'exécutent jamais. Une seule **branche** peut se déclencher, ce qui en fait une vraie fonction.

## Véracité : des valeurs comme conditions

La condition après `if` n'a pas besoin d'être une comparaison. Python demande : *« cette valeur est-elle vraie ou fausse ? »* — et la réponse est uniforme :

```python
# Tous ces éléments sont falsy — ils se comportent comme False dans une condition :
bool(0)       # False
bool(0.0)     # False
bool("")      # False
bool([])      # False
bool(None)    # False

# Tout le reste est truthy — il se comporte comme True :
bool(1)       # True
bool("hello") # True
bool([1, 2])  # True
```

La collection des valeurs falsy est délibérément petite : zéro, texte vide, conteneurs vides et `None`. Tout le reste compte. Cela achète des conditions concises qui se lisent comme une vérification en langage naturel :

```python
name = ""
if not name:
    print("Name is empty")

items = [1, 2, 3]
if items:
    print("We have items")
```

Une chaîne vide est falsy, donc `not name` vaut `True` ; une liste non vide est truthy, donc `if items` se déclenche. Vous sautez le `== ""` et le `!= []` explicites — la vérification est le vide lui-même.

## Imbriquer : quand une question dépend d'une autre

Certaines décisions sont séquentielles : *d'abord*, êtes-vous majeur ? ; *ensuite*, portez-vous une pièce d'identité ? Cela s'imbrique :

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

L'imbrication fonctionne, mais chaque niveau double les chemins qu'un lecteur doit tenir en tête. Les chaînes `elif` plates se lisent comme la formule par morceaux elle-même ; prenez-les d'abord, et réservez l'imbrication aux questions réellement dépendantes.

## Un exemple travaillé : le thermostat

Un thermostat est une fonction par morceaux à trois morceaux. La chaîne la transcrit directement :

```python
temperature = 22

if temperature <= 10:
    state = "heating"
elif temperature >= 30:
    state = "cooling"
else:
    state = "steady"
print(state)  # steady
```

Il se lit comme la formule qu'il est. L'ordre des morceaux compte : chaque `elif` suppose que ceux au-dessus ont échoué, si bien qu'exactement une branche se déclenche et qu'exactement un état s'imprime.

## Pièges courants

- **Oublier les deux points** après `if`, `elif` ou `else` — sans eux, le bloc ne commence jamais.
- **`=` au lieu de `==`.** `if score = 60` est une erreur de syntaxe, exprès.
- **Sur-imbriquer** quand une chaîne `elif` (ou un retour anticipé) exposerait la forme de la formule d'un seul regard.
- **Le premier `True` gagne, pas la correspondance la plus spécifique.** Dans `if x > 5: ... elif x > 3: ...`, un `x = 4` entre dans la deuxième branche seulement si la première a déjà échoué — et une valeur sous 3 tombe dans `else`. Ordonner les morceaux du plus étroit au plus large est ce qui garde la formule correcte.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Écrivez `classify_temp(temp)` qui renvoie `"freezing"` sous $0$, `"cold"` dans $[0,15)$, `"warm"` dans $[15,30)$ et `"hot"` à partir de $30$.

<p class="challenge__answer">💡 <strong>Réponse :</strong> Une chaîne <code>elif</code>, en profitant du fait que chaque vérification suivante suppose que les précédentes ont échoué : <code>if temp &lt; 0: return "freezing" elif temp &lt; 15: return "cold" elif temp &lt; 30: return "warm" else: return "hot"</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Avec `text = "Hello, World!"`, imprimez `"uppercase"` si le texte est tout en majuscules, `"lowercase"` si tout en minuscules, `"mixed"` sinon.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>if text.isupper(): print("uppercase") elif text.islower(): print("lowercase") else: print("mixed")</code> — l'ensemble complet des conditions forme une partition.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi `elif` et pas `else if` ? Que ferait Python des deux mots apparaissant côte à côte ?
- Avec $s = 85$, combien de conditions la chaîne de notes évalue-t-elle avant d'entrer dans une branche ? (Indice : quel morceau échoue, et lequel se déclenche ?)
- Quelle est la différence entre `if x:` et `if x is not None:` ? Quand chacun importe-t-il ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-control-flow">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. Qu'est-ce que cela imprime ? <code>x = 0; if x: print("yes") else: print("no")</code></p>
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
      <button class="quiz-q__opt" data-idx="3">Elles tournent en parallèle</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>