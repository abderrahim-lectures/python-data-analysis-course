---

title: "Explorer le corpus"
description: "Calculez les nombres de lignes, les noms de colonnes et prévisualisez le texte d'échantillon pour comprendre votre jeu de données avant de le traiter."
module: "loading-corpus"
order: 2
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Calculer des statistiques de base : nombre de lignes, nombre de colonnes, longueur en caractères"
  - "Prévisualiser des lignes d'échantillon et inspecter le contenu du texte"
  - "Comprendre ce qui rend un corpus adapté à un modèle de langue"
  - "Identifier les problèmes de qualité des données : lignes vides, erreurs d'encodage, doublons"
prerequisites: ["01-csv-loading"]
tags: ["python", "corpus", "exploration-de-données", "analyse-de-texte"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Quelle est la première étape pour explorer un nouveau corpus CSV ?"
    options:
      - text: "Commencer à tokeniser immédiatement"
      - text: "Vérifier les noms de colonnes, le nombre de lignes et un échantillon des données"
        correct: true
      - text: "Le charger dans un DataFrame pandas"
      - text: "Supprimer les lignes avec des valeurs manquantes"
  - question: "Comment extrayez-vous la colonne de texte d'un csv.DictReader ?"
    options:
      - text: "reader[0]"
      - text: "reader.text"
      - text: "row text pour chaque row de reader"
        correct: true
      - text: "reader.get_text()"
  - question: "Que vous apprend len(list(reader)) ?"
    options:
      - text: "Le nombre de colonnes"
      - text: "Le nombre de lignes de données (hors en-tête)"
        correct: true
      - text: "La taille totale du fichier"
      - text: "Le nombre de caractères"
---
Explorez avant de traiter

Charger des données est l'étape un. L'étape deux consiste à comprendre ce que vous avez chargé. Un corpus peut avoir des valeurs manquantes, des lignes en double, des caractères encodés qui ressemblent à du charabia, ou du texte trop court pour être utile. Passer cinq minutes à explorer maintenant vous fait gagner des heures de débogage plus tard.

## Concepts clés

### Compter les lignes et les colonnes

Les statistiques les plus simples vous en disent beaucoup. Un corpus de 5 lignes ne produira pas un modèle utile ; un de 50 000 lignes pourrait nécessiter un chargement en blocs :

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Rows:    {len(rows)}")
print(f"Columns: {list(rows[0].keys())}")
```

### Mesurer la longueur du texte

Les modèles de langue ont besoin de suffisamment de texte pour apprendre des motifs. Vérifiez le nombre total de caractères et la longueur moyenne des lignes :

```python
total_chars = sum(len(row["text"]) for row in rows)
avg_len = total_chars / len(rows) if rows else 0

print(f"Total characters: {total_chars:,}")
print(f"Average row length: {avg_len:.0f} characters")
```

Un corpus avec une moyenne de 10 caractères par ligne est trop court, le modèle n'aura pas assez de contexte pour apprendre les séquences de mots.

### Prévisualiser le texte d'échantillon

Lisez quelques lignes pour vous faire une idée du contenu. Quelle langue est-ce ? Quels sujets couvre-t-il ? Le texte est-il propre ou bruité ?

```python
for i, row in enumerate(rows[:5]):
    preview = row["text"][:150].replace("\n", " ")
    print(f"[{i}] {preview}...")
```

### Trouver les doublons

Les lignes en double gonflent les comptes de mots sans ajouter de nouvelles informations. Détectez-les en convertissant les lignes en un ensemble :

```python
unique_texts = set(row["text"] for row in rows)
print(f"Unique rows: {len(unique_texts)} / {len(rows)}")

if len(unique_texts) < len(rows):
    print(f"Warning: {len(rows) - len(unique_texts)} duplicate rows found")
```

### Vérifier les lignes vides ou courtes

Les lignes vides ou très courtes n'apporteront pas de bigrammes utiles. Filtrez-les :

```python
short_rows = [row for row in rows if len(row["text"].split()) < 3]
print(f"Rows with fewer than 3 words: {len(short_rows)}")
```

Une fonction de résumé de corpus combine toutes ces vérifications :

```python
def corpus_summary(path):
    import csv
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    texts = [row["text"] for row in rows]
    total_chars = sum(len(t) for t in texts)
    unique = len(set(texts))

    print(f"Rows: {len(rows)}")
    print(f"Unique: {unique}")
    print(f"Total chars: {total_chars:,}")
    print(f"Avg length: {total_chars / len(rows):.0f}")
    print(f"Columns: {list(rows[0].keys())}")
```

## Essayez

Exécutez `corpus_summary("slm-corpus.csv")` et notez :
1. Combien de lignes le corpus contient-il ?
2. Y a-t-il des doublons ?
3. La longueur moyenne du texte est-elle suffisante pour construire des bigrammes significatifs (au moins 20+ mots par ligne) ?

## Points clés

- Explorez toujours vos données avant de les traiter, vérifiez les comptes, les longueurs et les doublons
- Les lignes courtes ou vides ajoutent du bruit ; filtrez-les sur la base d'un nombre minimum de mots
- Les lignes en double gonflent les comptes de fréquence sans ajouter de nouveaux motifs
- Une fonction de résumé rapide fait gagner du temps entre projets

## Défi pratique

Écrivez une fonction `corpus_quality(path)` qui charge un CSV et renvoie un dict avec ces clés : `"rows"`, `"unique"`, `"total_chars"`, `"avg_length"`, `"min_length"`, `"max_length"`. Utilisez-la pour évaluer si `slm-corpus.csv` convient à la modélisation par bigrammes.

```python
def corpus_quality(path):
    import csv
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    texts = [row["text"] for row in rows]
    lengths = [len(t.split()) for t in texts]

    return {
        "rows": len(rows),
        "unique": len(set(texts)),
        "total_chars": sum(len(t) for t in texts),
        "avg_length": sum(lengths) / len(lengths) if lengths else 0,
        "min_length": min(lengths) if lengths else 0,
        "max_length": max(lengths) if lengths else 0,
    }
```