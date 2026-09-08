---

title: "Comptage de fréquence des mots"
description: "Comptez les jetons dans un dict de fréquence, extrayez les statistiques de vocabulaire et identifiez les mots les plus et les moins courants."
module: "tokenization-frequency"
order: 4
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Construire une fonction word_frequency(tokens) qui compte les occurrences de jetons dans un dict"
  - "Utiliser dict.get() ou collections.defaultdict pour un comptage sûr"
  - "Extraire des statistiques de vocabulaire : jetons totaux, mots uniques, top-N les plus fréquents"
  - "Comprendre la loi de Zipf et pourquoi quelques mots dominent les comptes de fréquence"
prerequisites: ["03-tokenization-basics"]
tags: ["python", "fréquence", "dict", "vocabulaire", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Selon la loi de Zipf, le mot le plus fréquent d'un texte anglais apparaît typiquement :"
    options:
      - text: "10 % du temps"
      - text: "Environ 7 % du temps"
        correct: true
      - text: "50 % du temps"
      - text: "1 % du temps"
  - question: "Quel est le but de trier les comptes de mots en ordre décroissant ?"
    options:
      - text: "Supprimer les doublons"
      - text: "Voir les mots les plus fréquents en premier"
        correct: true
      - text: "Compter les mots totaux"
      - text: "Calculer la longueur moyenne des mots"
  - question: "Si le mot A apparaît 1000 fois et le mot B 500 fois, quel est leur rapport de fréquence ?"
    options:
      - text: "1:2"
      - text: "2:1"
        correct: true
      - text: "1:1"
      - text: "1000:500"
---
Compter les mots

Une fois que vous avez des jetons, l'étape suivante consiste à compter combien de fois chaque mot apparaît. Ces comptes de fréquence disent au modèle de langue quels mots sont courants (susceptibles d'apparaître n'importe où) et lesquels sont rares (prédictifs quand ils apparaissent).

## Concepts clés

### Construire un dict de fréquence

Le motif de comptage utilise un dict où chaque clé est un mot et la valeur son compte. La méthode `get()` gère le cas « première fois que nous voyons ce mot » :

```python
def word_frequency(tokens):
    freq = {}
    for token in tokens:
        freq[token] = freq.get(token, 0) + 1
    return freq

tokens = ["the", "cat", "sat", "the", "dog", "sat", "the"]
freq = word_frequency(tokens)
print(freq)
# {'the': 3, 'cat': 1, 'sat': 2, 'dog': 1}
```

`freq.get(token, 0)` renvoie le compte actuel si le mot existe, ou `0` si c'est la première fois que nous le voyons. Ajouter 1 incrémente le compte.

### L'approche defaultdict

Une alternative utilise `collections.defaultdict`, qui crée automatiquement les clés manquantes :

```python
from collections import defaultdict

def word_frequency(tokens):
    freq = defaultdict(int)
    for token in tokens:
        freq[token] += 1
    return dict(freq)
```

Les deux approches produisent le même résultat. La version `defaultdict` est légèrement plus propre mais exige un import.

### Statistiques de vocabulaire

Avec un dict de fréquence, vous pouvez calculer des statistiques utiles :

```python
freq = word_frequency(tokenize(full_text))

total_tokens = sum(freq.values())
unique_words = len(freq)

print(f"Total tokens: {total_tokens:,}")
print(f"Unique words: {unique_words:,}")
print(f"Vocabulary richness: {unique_words / total_tokens:.4f}")
```

La **richesse de vocabulaire** (unique/total) mesure la diversité du texte. Une valeur proche de 1,0 signifie que presque chaque mot est unique ; une valeur proche de 0,0 signifie une forte répétition.

### Mots les plus et les moins fréquents

Triez le dict de fréquence pour trouver les extrêmes :

```python
sorted_words = sorted(freq.items(), key=lambda item: item[1], reverse=True)

print("Top 10 words:")
for word, count in sorted_words[:10]:
    print(f"  {word}: {count}")

print("\nBottom 10 words:")
for word, count in sorted_words[-10:]:
    print(f"  {word}: {count}")
```

Dans la plupart des textes anglais, « the », « of », « and », « to » et « a » dominent le sommet de la liste. Cela suit la **loi de Zipf** — le mot le plus fréquent apparaît environ deux fois plus souvent que le second, trois fois plus souvent que le troisième, et ainsi de suite.

### Pourquoi la fréquence compte pour la génération

Un modèle de langue utilise la fréquence pour pondérer les prédictions. Si « the » apparaît 500 fois et « platypus » 2 fois, « the » devrait être choisi plus souvent — mais pas toujours. Le modèle de bigrammes affine cela en conditionnant sur le mot précédent, c'est ce qui rend le texte généré lisible plutôt qu'un simple flux de « the the the ».

## Essayez

Chargez le corpus, tokenisez-le et construisez un dict de fréquence. Puis répondez :
1. Combien de jetons totaux y a-t-il ?
2. Quels sont les 5 mots les plus fréquents ?
3. Quel pourcentage du vocabulaire consiste en des mots qui n'apparaissent qu'une seule fois ?

```python
texts = load_corpus("slm-corpus.csv")
full_text = " ".join(texts)
tokens = tokenize(full_text)
freq = word_frequency(tokens)

total = sum(freq.values())
hapax = sum(1 for w, c in freq.items() if c == 1)
print(f"Total tokens: {total}")
print(f"Words appearing once: {hapax} ({hapax/len(freq)*100:.1f}%)")
```

## Points clés

- `dict.get(key, default)` est le fondement du comptage de fréquence
- La richesse de vocabulaire (unique/total) mesure la diversité du texte
- La loi de Zipf : un petit nombre de mots domine la distribution de fréquence
- Les comptes de fréquence sont la matière première des tables de probabilité de bigrammes

## Défi pratique

Écrivez une fonction `top_n(freq, n)` qui renvoie les N mots les plus fréquents sous forme de liste de tuples `(word, count)`. Utilisez-la ensuite pour trouver les 20 premiers mots du corpus.

```python
def top_n(freq, n):
    return sorted(freq.items(), key=lambda item: item[1], reverse=True)[:n]
```