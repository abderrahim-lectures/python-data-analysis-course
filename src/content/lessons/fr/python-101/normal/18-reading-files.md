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

## Le pont vers le disque

Les programmes qui ne calculent qu'avec ce que l'utilisateur tape sont encagés en mémoire. Les fichiers ouvrent la porte : un fichier est une séquence de lignes, et le lire, c'est marcher sur cette séquence. Le premier pas est `open()`, qui renvoie un objet fichier collé à la porte :

```python
f = open("data.txt", "r")  # mode lecture
content = f.read()
f.close()  # fermez toujours quand c'est fini !
```

`"r"` veut dire lecture seule. Et la discipline est lourde : `close()` doit courir quand vous avez fini, sinon le descripteur fuit, le fichier reste tenu longtemps après que vous avez cessé d'en avoir besoin. L'oublier, c'est la première génération de bugs de fichiers.

## L'instruction with : fermer comme une promesse

`with` rend la fermeture automatique, même quand une erreur fait irruption au milieu :

```python
with open("data.txt") as f:
    content = f.read()
# le fichier est fermé ici
```

Le bloc `with` déclare un contrat : ouvrez-le ici, et il sera fermé quand ce bloc se terminera, normalement ou par exception. La vie du descripteur est encadrée dans le bloc, donc il ne reste rien à oublier.

## Stratégies de lecture

Un fichier, trois appétits :

```python
# Lire le fichier entier comme une chaîne
with open("data.txt") as f:
    text = f.read()

# Lire ligne par ligne (économe en mémoire pour les gros fichiers)
with open("data.txt") as f:
    for line in f:
        print(line.rstrip())  # retire le saut de ligne final

# Lire toutes les lignes dans une liste
with open("data.txt") as f:
    lines = f.readlines()  # inclut \n dans chaque chaîne
```

`f.read()` prend tout d'un coup ; `readlines()` scinde en une liste ; et itérer `for line in f` avance dans le fichier une ligne à la fois, ne retenant que la ligne courante en mémoire. Le dernier est la prescription pour un fichier trop grand pour tenir : traitez chaque ligne et passez, sans jamais rassembler le tout.

## Pathlib : des chemins avec un vocabulaire

La concaténation de chemins avec `+` se lit comme de l'archéologie. `pathlib` vous tend un `Path` dont les méthodes *disent* ce qu'elles font :

```python
from pathlib import Path

p = Path("data") / "scores.txt"    # Path('data/scores.txt')
text = p.read_text()               # lit tout le fichier
lines = p.read_text().splitlines() # lignes sans \n

p.exists()   # True/False
p.is_file()  # True/False
p.suffix     # '.txt'
p.stem       # 'scores'
```

La `/` joint des morceaux en un chemin comme le système de fichiers joint des dossiers ; `exists`, `is_file`, `suffix` et `stem` interrogent ce que le chemin *est*. Les chemins deviennent des données avec des réponses plutôt que des chaînes à éplucher.

## Encodage : le contrat des lettres

Le texte est des octets jusqu'à ce qu'une convention les interprète. Épinglez cette convention pour la portabilité entre machines :

```python
with open("data.txt", encoding="utf-8") as f:
    text = f.read()
```

Sans `encoding`, Python retombe sur le défaut du système, qui varie selon la plateforme, le même fichier, illisible sur une machine Windows et propre sur Linux. Déclarer `utf-8` fait signifier aux octets les mêmes lettres partout.

## Un exemple travaillé : le fichier de notes, ligne par ligne

La marche sûre en mémoire, accumuler sans jamais tenir le fichier entier :

```python
with open("scores.txt", encoding="utf-8") as f:
    total = 0
    count = 0
    for line in f:
        total += int(line.strip())
        count += 1

print(f"Avg: {total / count}")
```

Chaque ligne est lue, débarrassée de son saut de ligne, convertie et lâchée avant l'arrivée de la suivante, le fichier s'écoule sans jamais se rassembler entier. La promesse de `with` ferme le fichier quand le bloc se termine, normalement ou par exception.

## Pièges courants

- **Oublier `with`.** Les descripteurs fuient quand rien ne les ferme ; laissez le bloc posséder la vie du fichier.
- **Avaler des fichiers énormes.** `f.read()` sur un gros fichier peut épuiser la mémoire, itérez `for line in f` à la place.
- **Ignorer l'encodage.** Les lettres non-ASCII deviennent des hiéroglyphes quand la convention est laissée au hasard.
- **Chemins codés en dur.** `pathlib.Path` fait marcher le même code sur chaque système d'exploitation.
- **Un fichier consommé se lit vide.** Après `f.read()`, la position est à la fin ; une deuxième lecture renvoie `''` et `readlines()` renvoie `[]`. Lisez une fois, ou rouvrez.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Comptez les lignes d'un fichier sans le charger en mémoire.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>count = 0; with open("file.txt") as f: for line in f: count += 1</code> ou le compact <code>sum(1 for _ in open("file.txt"))</code>, une ligne à la fois, jamais le tout.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Listez tous les fichiers `.txt` d'un répertoire avec `pathlib`.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>list(Path(".").glob("*.txt"))</code>, un unique glob parcourt pour vous les noms correspondants.</p>

</div>
</details>

## 🤔 Questions socratiques

- `for line in f` inclut-il le `\n` final ? Pourquoi la boucle a-t-elle cette allure, et comment retirez-vous le saut de ligne ?
- Que se passe-t-il quand vous lisez un fichier inexistant ? Comment `with` s'en sort-il contre l'exception ?
- Quand `f.read()` bat-il l'itération ligne par ligne ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="python-101-file-reading">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que fait <code>line.rstrip()</code> dans une boucle de fichiers ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Retire tous les espaces</button>
      <button class="quiz-q__opt" data-idx="1">Retire le saut de ligne final (et les espaces)</button>
      <button class="quiz-q__opt" data-idx="2">Retire le saut de ligne initial</button>
      <button class="quiz-q__opt" data-idx="3">Renvoie la longueur de la ligne</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Quelle est la bonne façon de lire un fichier ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f = open("x.txt"); f.read()</button>
      <button class="quiz-q__opt" data-idx="1">read("x.txt")</button>
      <button class="quiz-q__opt" data-idx="2">with open("x.txt") as f: content = f.read()</button>
      <button class="quiz-q__opt" data-idx="3">File.read("x.txt")</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>