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

## Les quatre portes

Lire était une porte à sens unique : `"r"` laisse entrer les données. Écrire exige le vocabulaire de l'intention, car chaque mode promet quelque chose de différent sur le sort du fichier :

```python
open("file.txt", "r")   # lecture (par défaut)
open("file.txt", "w")   # écriture (écrase !)
open("file.txt", "a")   # ajout (ajoute à la fin)
open("file.txt", "x")   # création (erreur si le fichier existe)
```

`"w"` jette l'ancien contenu à l'instant où il ouvre ; `"a"` le garde et raccroche à la fin ; `"x"` refuse de toucher un fichier qui existe déjà. Choisissez le mode qui énonce ce que vous voulez vraiment — le fichier est détruit ou préservé selon ce choix.

## Écrire des fichiers texte

```python
# Le mode "w" crée ou écrase
with open("output.txt", "w") as f:
    f.write("Hello, World!\n")
    f.write("Second line\n")

# writelines pour plusieurs chaînes
lines = ["line 1\n", "line 2\n", "line 3\n"]
with open("output.txt", "w") as f:
    f.writelines(lines)
```

`write` livre une chaîne à la fois ; `writelines` livre toute une liste en un appel. Les deux respectent le même contrat `with` que vous connaissez déjà — quand le bloc se termine, le fichier est vidé et fermé. Remarquez le `\n` qui se glisse dans chaque chaîne écrite — le saut de ligne n'est pas ajouté pour vous, seulement stocké.

## Ajouter

Les journaux grandissent et ne réécrivent jamais l'histoire. `"a"` gare le curseur à la fin :

```python
with open("log.txt", "a") as f:
    f.write("New entry\n")  # ajoute à la fin, n'écrase pas
```

Le mode ajout fait du fichier un accumulateur : chaque exécution ajoute une ligne, et tout ce qui a été écrit avant survit intact.

## Travailler avec CSV

Un CSV est une table sur un fil : lignes séparées par des sauts de ligne, cellules séparées par des virgules. Le module `csv` possède les parties délicates — guillemets, échappement des délimiteurs, fins de ligne :

```python
import csv

# Écrire un CSV
with open("data.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Score"])
    writer.writerow(["Alice", 85])
    writer.writerow(["Bob", 92])

# Lire un CSV
with open("data.csv") as f:
    reader = csv.reader(f)
    header = next(reader)  # ['Name', 'Score']
    for row in reader:
        print(f"{row[0]}: {row[1]}")
```

L'écrivain accepte une liste par ligne et insère les virgules ; le lecteur reparse chaque ligne en une liste. `next(reader)` enlève la ligne d'en-tête, et l'itération continue avec les données — la même marche que vous connaissez, sur un fichier dont les lignes sont des structures.

## DictReader et DictWriter

Les listes conviennent, mais des champs nommés vous épargnent de demander ce que voulait dire `row[0]`. Les dicts nomment les colonnes une fois, à l'en-tête :

```python
import csv

# DictReader — les lignes deviennent des dicts aux clés de l'en-tête
with open("data.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['Name']}: {row['Score']}")

# DictWriter — écrire depuis des dicts
with open("output.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Name", "Score"])
    writer.writeheader()
    writer.writerow({"Name": "Charlie", "Score": 88})
```

`DictReader` lit l'en-tête et transforme chaque ligne suivante en un dict indexé par elle ; `DictWriter` fait l'inverse — déclarez les `fieldnames`, écrivez l'en-tête, puis nourrissez-le de dicts dont les valeurs atterrissent sous leurs colonnes nommées.

## Pathlib pour écrire

Le chemin orienté objet travaille maintenant dans les deux sens :

```python
from pathlib import Path

Path("output.txt").write_text("Hello!\n")
content = Path("output.txt").read_text()

# Créer des répertoires
Path("data/logs").mkdir(parents=True, exist_ok=True)
```

`write_text` compresse ouvrir-écrire-fermer en un seul appel, et `mkdir` avec `parents=True` fait pousser des arbres de dossiers entiers en une commande plutôt qu'un niveau à la fois.

## Un exemple travaillé : le carnet de notes, versé en CSV

La correspondance va au disque comme un tableau — l'en-tête d'abord, puis une ligne par entrée :

```python
import csv

scores = {"Alice": 85, "Bob": 92, "Charlie": 78}

with open("grades.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Score"])
    for name, score in scores.items():
        writer.writerow([name, score])
```

Les `items()` du dict deviennent les lignes ; l'en-tête nomme les colonnes. `newline=""` épingle les fins de ligne, et le bloc `with` vide et ferme le fichier une fois terminé.

## Pièges courants

- **`"w"` écrase en silence.** L'ancien fichier est parti à l'instant où le mode ouvre. Si le passé compte, choisissez `"a"`.
- **Oublier `newline=""` en CSV.** Sur Windows l'écrivain double les fins de ligne sauf si vous épinglez `newline=""` ; des lignes vides apparaissent entre les données.
- **Sauter `writeheader()`.** Un `DictWriter` nourri de dicts n'écrit aucune ligne d'en-tête si vous ne l'appelez pas — les lecteurs perdent leurs clés.
- **`writerow` prend une séquence — et une chaîne est une séquence de caractères.** `writer.writerow("Alice")` éparpille `A,l,i,c,e` dans cinq cellules. Enveloppez la valeur dans une liste quand le champ est une seule chaîne.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Écrivez une fonction qui prend une liste de nombres et les écrit dans un fichier, un par ligne.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>with open("nums.txt", "w") as f: for n in nums: f.write(f"{n}\n")</code> — une chaîne par nombre, chacune finissant par son saut de ligne.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

Lisez un CSV de notes d'étudiants et imprimez la moyenne.

<p class="challenge__answer">💡 <strong>Réponse :</strong> <code>import csv; with open("grades.csv") as f: rows = list(csv.DictReader(f)); avg = sum(int(r["Score"]) for r in rows) / len(rows); print(f"Average: {avg:.1f}")</code></p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi l'écriture CSV a-t-elle besoin de `newline=""` sous Windows mais pas sous Linux ? Que se passe-t-il sous le capot ?
- Où gît la différence entre `csv.writer` et `csv.DictWriter` — et quand tendez-vous la main vers chacun ?
- Si le CSV sera ouvert dans Excel, quelles précautions supplémentaires devriez-vous prendre ?

## ✅ Vérification rapide

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
    <p class="quiz-q__prompt">2. Que utilise <code>csv.DictReader</code> comme clés de dictionnaire ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La première ligne (en-têtes)</button>
      <button class="quiz-q__opt" data-idx="1">Les indices de colonne (0, 1, 2...)</button>
      <button class="quiz-q__opt" data-idx="2">Des noms auto-générés</button>
      <button class="quiz-q__opt" data-idx="3">La dernière ligne</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>