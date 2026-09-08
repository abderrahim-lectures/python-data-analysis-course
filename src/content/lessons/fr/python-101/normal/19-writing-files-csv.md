---
title: "Écrire des fichiers et CSV"
description: "Écrivez du texte dans des fichiers et travaillez avec des données CSV structurées."
module: "file-io"
order: 19
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Écrire et ajouter à des fichiers texte"
  - "Lire et écrire des fichiers CSV avec le module csv"
  - "Utiliser pathlib pour la création et la manipulation de fichiers"
  - "Comprendre les modes de fichier (r, w, a, x)"
prerequisites: ["18-reading-files"]
tags: ["write", "csv", "append", "modes-de-fichier", "module-csv"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Modes de fichier

```python
open("file.txt", "r")   # read (default)
open("file.txt", "w")   # write (overwrites!)
open("file.txt", "a")   # append (adds to end)
open("file.txt", "x")   # create (errors if file exists)
```

## Écrire des fichiers texte

```python
# "w" mode creates or overwrites
with open("output.txt", "w") as f:
    f.write("Hello, World!\n")
    f.write("Second line\n")

# writelines for multiple strings
lines = ["line 1\n", "line 2\n", "line 3\n"]
with open("output.txt", "w") as f:
    f.writelines(lines)
```

## Ajouter

```python
with open("log.txt", "a") as f:
    f.write("New entry\n")  # adds to end, doesn't overwrite
```

## Travailler avec le CSV

Le module `csv` gère les parties délicates (guillemets, délimiteurs) :

```python
import csv

# Writing CSV
with open("data.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Score"])
    writer.writerow(["Alice", 85])
    writer.writerow(["Bob", 92])

# Reading CSV
with open("data.csv") as f:
    reader = csv.reader(f)
    header = next(reader)  # ['Name', 'Score']
    for row in reader:
        print(f"{row[0]}: {row[1]}")
```

## DictReader et DictWriter

Mappez les lignes CSV vers des dictionnaires pour un code plus propre :

```python
import csv

# DictReader — rows become dicts with header keys
with open("data.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['Name']}: {row['Score']}")

# DictWriter — write from dicts
with open("output.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Name", "Score"])
    writer.writeheader()
    writer.writerow({"Name": "Charlie", "Score": 88})
```

## Pathlib pour écrire

```python
from pathlib import Path

Path("output.txt").write_text("Hello!\n")
content = Path("output.txt").read_text()

# Create directories
Path("data/logs").mkdir(parents=True, exist_ok=True)
```

## Pièges courants

- **`"w"` écrase silencieusement** — vous perdez les anciennes données. Utilisez `"a"` pour ajouter
- **Oublier `newline=""`** en CSV sous Windows — provoque des lignes vides
- **Ne pas appeler `writeheader()`** avec `DictWriter` — la sortie n'a pas de ligne d'en-tête

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Défis</h2>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Écrivez une fonction qui prend une liste de nombres et les écrit dans un fichier, un par ligne.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>with open("nums.txt", "w") as f: for n in nums: f.write(f"{n}\n")</code></p>

</div>
</details>

<details class="challenge">
<summary>Défi — réfléchissez d'abord, puis découvrez</summary>
<div class="challenge__body">

Lisez un CSV de notes d'étudiants et affichez le score moyen.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>import csv; with open("grades.csv") as f: rows = list(csv.DictReader(f)); avg = sum(int(r["Score"]) for r in rows) / len(rows); print(f"Average: {avg:.1f}")</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Questions socratiques</h2>

- Pourquoi l'écriture CSV a-t-elle besoin de `newline=""` sous Windows mais pas sous Linux ? Que se passe-t-il sous le capot ?
- Quelle est la différence entre `csv.writer` et `csv.DictWriter` ? Quand préféreriez-vous l'un ?
- Si vous écrivez un CSV qui sera ouvert dans Excel, quelles précautions supplémentaires devriez-vous prendre ?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Vérification rapide</h2>

<div class="quiz" data-quiz="python-101-file-writing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Quel mode crée un fichier ou l'écrase ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">"r"</button>
      <button class="quiz-q__opt" data-idx="1">"w"</button>
      <button class="quiz-q__opt" data-idx="2">"a"</button>
      <button class="quiz-q__opt" data-idx="3">"x"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. Qu'est-ce que <code>csv.DictReader</code> utilise comme clés de dictionnaire ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La première ligne (les en-têtes)</button>
      <button class="quiz-q__opt" data-idx="1">Les indices de colonnes (0, 1, 2...)</button>
      <button class="quiz-q__opt" data-idx="2">Des noms auto-générés</button>
      <button class="quiz-q__opt" data-idx="3">La dernière ligne</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>