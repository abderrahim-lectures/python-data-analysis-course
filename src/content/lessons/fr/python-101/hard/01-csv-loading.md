---

title: "Chargement du corpus CSV"
description: "Ouvrez, analysez et vérifiez la structure de slm-corpus.csv avec le module csv de Python."
module: "loading-corpus"
order: 1
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Ouvrir et analyser un fichier CSV avec csv.reader et csv.DictReader"
  - "Inspecter les noms de colonnes, le nombre de lignes et les types de données d'un jeu de données CSV"
  - "Extraire le texte brut des lignes du corpus dans une seule chaîne"
  - "Gérer les pièges CSV courants : encodage, caractères de nouvelle ligne, valeurs manquantes"
prerequisites: []
tags: ["python", "csv", "corpus", "chargement-de-données"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Pourquoi devriez-vous passer newline lors de l'ouverture d'un fichier CSV pour le module csv ?"
    options:
      - text: "Cela empêche le fichier d'être lu en binaire"
      - text: "Cela permet au module csv de gérer correctement les fins de ligne"
        correct: true
      - text: "Cela accélère la lecture en contournant la mise en tampon des lignes"
      - text: "Cela convertit tout le texte en minuscules"
  - question: "Qu'est-ce que csv.DictReader utilise comme clés de dictionnaire pour chaque ligne ?"
    options:
      - text: "Les indices de colonnes (0, 1, 2...)"
      - text: "La première ligne de données"
      - text: "Les valeurs de la ligne d'en-tête"
        correct: true
      - text: "Des noms auto-générés comme field_1, field_2"
  - question: "Étant donné reader = csv.DictReader(f), que renvoie next(reader) ?"
    options:
      - text: "La ligne d'en-tête"
      - text: "La première ligne de données"
        correct: true
      - text: "La dernière ligne de données"
      - text: "Un tuple de toutes les lignes"
---
Pourquoi commencer par les données ?

Chaque projet d'apprentissage automatique commence par des données. Pour un modèle de langue à base de texte, ces données sont un **corpus** — une collection de texte à partir de laquelle le modèle apprendra des motifs. Notre corpus vit dans `slm-corpus.csv`, un petit fichier CSV fourni avec le cours dans `static/datasets/`.

Avant de pouvoir tokeniser, compter ou générer quoi que ce soit, vous devez charger ce fichier dans Python. Cette leçon couvre deux approches : `csv.reader` pour un accès brut et `csv.DictReader` pour un accès conscient des en-têtes.

## Concepts clés

### Ouvrir un fichier CSV

Le module `csv` de Python gère les parties désordonnées de l'analyse CSV (champs entre guillemets, virgules intégrées, caractères échappés). Ouvrez toujours les fichiers CSV en mode texte et laissez le module faire le travail :

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.reader(f)
    header = next(reader)  # first row = column names
    print(header)  # e.g. ['id', 'text']
```

L'argument `newline=""` est requis par la documentation du module `csv` — sans lui, vous pouvez obtenir des lignes vides sous Windows ou une sortie à double interligne.

### Lire avec DictReader

`csv.DictReader` mappe chaque ligne à un dictionnaire en utilisant la ligne d'en-tête comme clés. Cela rend votre code auto-documenté :

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["text"])  # access by column name, not index
```

Le premier appel à `next(reader)` est automatique — `DictReader` consomme la ligne d'en-tête lui-même.

### Extraire le texte complet

Pour construire un modèle de langue, vous avez besoin de tout le texte concaténé en une longue chaîne. Voici comment le collecter :

```python
import csv

texts = []
with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        texts.append(row["text"])

full_text = " ".join(texts)
print(f"Loaded {len(texts)} rows, {len(full_text)} characters")
```

La méthode `join()` concatène tous les textes des lignes avec un séparateur espace, produisant un bloc de texte continu.

### Vérifier le chargement

Vérifiez toujours vos données après les avoir chargées. Comptez les lignes, jetez un œil à quelques échantillons et cherchez des problèmes évidents :

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Total rows: {len(rows)}")
print(f"Columns: {rows[0].keys()}")
print(f"First row: {rows[0]}")
print(f"Last row:  {rows[-1]}")
```

Si le fichier est volumineux, évitez `list(reader)` — cela charge tout en mémoire. Au lieu de cela, itérez et traitez ligne par ligne.

## Essayez

Chargez `slm-corpus.csv` et affichez :
1. Le nombre de lignes du fichier
2. Les noms de colonnes
3. Le texte de la première ligne

Utilisez ce squelette :

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Rows: {len(rows)}")
print(f"Columns: {list(rows[0].keys())}")
print(f"Sample: {rows[0]['text'][:200]}")
```

## Points clés

- Ouvrez toujours les fichiers CSV avec `newline=""` quand vous utilisez le module `csv`
- `csv.DictReader` vous donne un accès par clés d'en-tête ; `csv.reader` vous donne un accès par indices
- Vérifiez votre chargement : contrôlez les nombres de lignes, les noms de colonnes et jetez un œil aux données d'échantillon
- Pour les fichiers volumineux, itérez ligne par ligne au lieu de convertir en liste

## Défi pratique

Écrivez une fonction `load_corpus(path)` qui prend un chemin de fichier CSV et renvoie une liste de chaînes — une par ligne de la colonne `text`. Gérez le cas où le fichier n'existe pas en affichant un message d'erreur et en renvoyant une liste vide.

```python
def load_corpus(path):
    import csv
    try:
        with open(path, newline="") as f:
            reader = csv.DictReader(f)
            return [row["text"] for row in reader]
    except FileNotFoundError:
        print(f"File not found: {path}")
        return []
```