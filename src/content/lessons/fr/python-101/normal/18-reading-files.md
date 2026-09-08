---
title: "Lire des fichiers"
description: "Ouvrez, lisez et traitez des fichiers texte en toute sécurité avec les gestionnaires de contexte."
module: "file-io"
order: 18
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Ouvrir et lire des fichiers avec l'instruction with"
  - "Lire ligne par ligne pour un traitement économe en mémoire"
  - "Utiliser pathlib pour des chemins de fichiers multiplateformes"
  - "Gérer les erreurs de fichier courantes avec grâce"
prerequisites: ["17-comprehensions"]
tags: ["fichiers", "read", "with", "gestionnaire-de-contexte", "pathlib"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Ouvrir des fichiers

Utilisez `open()` pour obtenir un objet fichier :

```python
f = open("data.txt", "r")  # read mode
content = f.read()
f.close()  # always close when done!
```

## L'instruction with

`with` ferme automatiquement le fichier, même si une erreur survient :

```python
with open("data.txt") as f:
    content = f.read()
# file is closed here
```

**Utilisez toujours `with`** — c'est plus sûr et plus propre.

## Stratégies de lecture

```python
# Read entire file as one string
with open("data.txt") as f:
    text = f.read()

# Read line by line (memory-efficient for large files)
with open("data.txt") as f:
    for line in f:
        print(line.rstrip())  # strip trailing newline

# Read all lines into a list
with open("data.txt") as f:
    lines = f.readlines()  # includes \n in each string
```

## Pathlib (approche moderne)

`pathlib` fournit des chemins orientés objet — plus lisibles que la concaténation de chaînes :

```python
from pathlib import Path

p = Path("data") / "scores.txt"    # Path('data/scores.txt')
text = p.read_text()               # read the whole file
lines = p.read_text().splitlines() # lines without \n

p.exists()   # True/False
p.is_file()  # True/False
p.suffix     # '.txt'
p.stem       # 'scores'
```

## Encodage

Spécifiez toujours l'encodage pour la portabilité :

```python
with open("data.txt", encoding="utf-8") as f:
    text = f.read()
```

Sans `encoding`, Python utilise la valeur par défaut du système, qui varie selon les plateformes.

## Pièges courants

- **Oublier `with`** : les descripteurs de fichier fuient si vous ne les fermez pas
- **Lire d'énormes fichiers en mémoire** : utilisez `for line in f` au lieu de `f.read()`
- **Ignorer l'encodage** : texte illisible sur des fichiers non ASCII
- **Chemins codés en dur** : utilisez `pathlib.Path` pour la compatibilité multiplateforme

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez du code qui compte le nombre de lignes d'un fichier sans tout charger en mémoire.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>count = 0; with open("file.txt") as f: for line in f: count += 1</code> ou simplement <code>sum(1 for _ in open("file.txt"))</code></p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Utilisez `pathlib` pour lister tous les fichiers `.txt` d'un répertoire.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>list(Path(".").glob("*.txt"))</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Pourquoi `for line in f` n'inclut-il pas le `\n` final ? Ou bien l'inclut-il ? Comment le retireriez-vous ?
- Que se passe-t-il si vous essayez de lire un fichier qui n'existe pas ? Comment `with` gère-t-il les exceptions ?
- Quand préféreriez-vous `f.read()` à l'itération ligne par ligne ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

<div class="quiz" data-quiz="python-101-file-reading">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que fait <code>line.rstrip()</code> dans une boucle de fichier ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Supprime tous les espaces blancs</button>
      <button class="quiz-q__opt" data-idx="1">Supprime le saut de ligne de fin (et les espaces)</button>
      <button class="quiz-q__opt" data-idx="2">Supprime le saut de ligne de début</button>
      <button class="quiz-q__opt" data-idx="3">Renvoie la longueur de la ligne</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Quelle est la façon correcte de lire un fichier ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f = open("x.txt"); f.read()</button>
      <button class="quiz-q__opt" data-idx="1">read("x.txt")</button>
      <button class="quiz-q__opt" data-idx="2">with open("x.txt") as f: content = f.read()</button>
      <button class="quiz-q__opt" data-idx="3">File.read("x.txt")</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>