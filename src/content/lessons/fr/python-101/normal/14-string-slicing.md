---
title: "Trancher les chaînes"
description: "Extrayez des sous-chaînes avec la puissante notation de tranche de Python."
module: "strings"
order: 14
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Utiliser la notation de tranche [start:stop:step] pour extraire des sous-chaînes"
  - "Inverser des chaînes et sauter des caractères avec step"
  - "Utiliser des indices négatifs pour compter depuis la fin"
  - "Appliquer le tranchage aux listes (même syntaxe)"
prerequisites: ["13-string-methods"]
tags: ["tranchage", "sous-chaîne", "indices", "step"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Le langage des fenêtres

Une chaîne est une séquence, et ses caractères se tiennent aux positions $0, 1, 2, \ldots, n-1$. Le tranchage demande la fenêtre entre deux frontières. La notation est `string[start:stop:step]`, et la seule asymétrie à mémoriser est que **`start` est inclus et `stop` exclu**, la même règle semi-ouverte que `range` vous a apprise :

$$
s[a:b] = s_a s_{a+1} \cdots s_{b-1}, \qquad |s[a:b]| = \max(0, b - a).
$$

```python
text = "Python"
text[0:3]    # 'Pyt'
text[2:5]    # 'tho'
text[:4]     # 'Pyth'  (start par défaut 0)
text[3:]     # 'hon'   (stop par défaut la fin)
text[:]      # 'Python' (copie entière)
```

Omette une frontière et elle part vers son défaut : `start` vers le début, `stop` vers la fin. `text[:]` prend tout, ce qui double la copie classique en une seule touche.

## Indices négatifs : compter depuis la fin

Les mathématiques indexent depuis zéro à l'avant. Python ajoute une seconde règle, comptant à rebours depuis le dernier caractère avec des nombres négatifs :

```python
text = "Python"
text[-1]     # 'n'  (dernier caractère)
text[-3:]    # 'hon' (les 3 derniers caractères)
text[:-2]    # 'Pyth' (tout sauf les 2 derniers)
text[-4:-1]  # 'tho'
```

La position $-k$ est le caractère $n - k$ depuis l'avant. Demander les trois derniers est `text[-3:]`, un petit geste mental qui se lit naturellement : *les trois finaux*.

## Step : l'enjambée

Un troisième paramètre contrôle combien de positions vous sautez entre sélections :

```python
text = "abcdefghij"
text[::2]    # 'acegi'   (chaque 2e caractère)
text[1::2]   # 'bdfhj'   (chaque 2e, en partant de l'indice 1)
text[::-1]   # 'jihgfedcba'  (inversé !)
text[::-2]   # 'jhfdb'   (chaque 2e, inversé)
```

Un step négatif inverse le sens du voyage, c'est l'arithmétique de $a, a+d, a+2d, \ldots$ avec $d$ négatif. L'inversion canonique `[::-1]` vaut une seule mémorisation ferme, car d'elle tout ce qui est plus fin est une variation.

## Le tranchage ne lève jamais d'erreur

Indexer une position inexistante lève `IndexError`. Le tranchage est plus doux, il se rabat sur la plage disponible et renvoie ce qui existe, sans rien demander au passage :

```python
text = "hi"
text[0:100]   # 'hi'  (pas d'erreur, s'arrête juste à la fin)
text[100:200] # ''    (chaîne vide)
```

C'est une générosité délibérée : une fenêtre qui dépasse la fin se rétrécit simplement. Là où indexer est une revendication, trancher est une requête.

## Le même instrument joue des listes

Le tranchage n'est pas une spécialité des chaînes ; c'est la notation des séquences. Les listes répondent aux mêmes appels :

```python
nums = [0, 1, 2, 3, 4, 5]
nums[1:4]     # [1, 2, 3]
nums[::-1]    # [5, 4, 3, 2, 1, 0]
```

Ce que vous avez appris sur les caractères se transfère à toute collection ordonnée, et au-delà de la lecture, les listes acceptent l'affectation par tranche là où les chaînes non : `nums[1:3] = [9, 9]` remplace une fenêtre sur place.

## Un exemple travaillé : disséquer un nom de fichier

Les programmes vivent parmi des noms de fichiers comme `"report_2026_summary.txt"`, et le tranchage est la façon de les lire en morceaux. L'extension est constituée des trois derniers caractères :

```python
filename = "report_2026_summary.txt"
extension = filename[-3:]     # 'txt'
stem      = filename[:-4]     # 'report_2026_summary'
print(stem, extension)        # report_2026_summary txt
```

`[-3:]` lit *de trois positions avant la fin, jusqu'à la fin*, les trois derniers caractères. `[:-4]` lit *du début, jusqu'à quatre positions avant la fin*, c'est-à-dire tout ce qui précède le point. La règle du demi-intervalle réapparaît : `[:-4]` exclut la position $n - 4$, le point lui-même, si bien que la queue `.txt` ne fuit jamais dans le radical. Une règle, les deux bouts.

Et l'inverse de lire en morceaux, c'est lire en entier : le test du palindrome tient en une ligne du même instrument :

```python
word = "radar"
print(word == word[::-1])     # True
```

## Pièges courants

- **Confondre indexation et tranchage.** `text[3]` est un caractère, une revendication ; `text[3:4]` est un caractère, une requête, et une nouvelle chaîne.
- **Supposer `stop` inclus.** `text[0:3]` livre les caractères aux positions $0, 1, 2$ ; la position $3$ est là où la fenêtre se ferme.
- **Affectation par tranche sur les chaînes.** Les chaînes refusent, cette mutabilité est un privilège des listes.
- **Le signe du pas doit concorder avec la direction.** `"abcdef"[0:5:-1]` est vide, une fenêtre qui marche à droite et un pas qui pointe à gauche ne se rencontrent nulle part. Gardez début, fin et pas alignés dans la même direction.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Inversez la chaîne `"racecar"` par tranchage.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>"racecar"[::-1]</code> → <code>"racecar"</code>, elle se lit pareil dans les deux sens, ce qui est précisément pourquoi un palindrome survit à sa propre inversion.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Depuis `"abcdefghij"`, extrayez chaque troisième caractère : `a`, `d`, `g`, `j`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>"abcdefghij"[::3]</code> → <code>"adgj"</code>, le start par défaut vous épingle à l'indice 0 et l'enjambée 3 vous fait traverser la progression arithmétique.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi le tranchage ne lève-t-il jamais d'erreur là où l'indexation en lève ? Quelle attitude sépare les deux ?
- En n'utilisant que l'affectation par tranche, comment échangeriez-vous deux éléments d'une liste ?
- Si `text[::-1]` inverse, quelle ligne vous dit si une chaîne est un palindrome ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-string-slicing">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. Que renvoie <code>"Python"[1:4]</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">'yth'</button>
      <button class="quiz-q__opt" data-idx="1">'Pyt'</button>
      <button class="quiz-q__opt" data-idx="2">'ytho'</button>
      <button class="quiz-q__opt" data-idx="3">'Pyth'</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Comment inversez-vous une chaîne <code>s</code> ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">s.reverse()</button>
      <button class="quiz-q__opt" data-idx="1">s[::-0]</button>
      <button class="quiz-q__opt" data-idx="2">s[::-1]</button>
      <button class="quiz-q__opt" data-idx="3">s[::1]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>