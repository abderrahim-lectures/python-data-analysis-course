---

title: "Construire des tables de bigrammes"
description: "Comptez les paires de mots consécutives dans un dictionnaire imbriqué qui mappe chaque mot à sa distribution de mots suivants."
module: "bigram-tables"
order: 5
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Comprendre ce qu'un bigramme capture sur les transitions de mot à mot"
  - "Construire un dict imbriqué bigrams = {'the': {'cat': 3, 'dog': 1}, ...} à partir d'une liste de jetons"
  - "Gérer les frontières de phrase et les mots de départ inconnus"
  - "Inspecter la table de bigrammes pour vérifier l'exactitude"
prerequisites: ["04-word-frequency"]
tags: ["python", "bigrammes", "dict-imbriqué", "transitions", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Qu'est-ce qu'un bigramme ?"
    options:
      - text: "Un mot avec deux syllabes"
      - text: "Une paire de mots consécutifs"
        correct: true
      - text: "Un mot de deux lettres"
      - text: "Un mot qui apparaît deux fois"
  - question: "Comment créez-vous des bigrammes à partir d'une liste de jetons ?"
    options:
      - text: "tokens[0:2]"
      - text: "zip(tokens, tokens[1:])"
        correct: true
      - text: "tokens * 2"
      - text: "tokens.split()"
  - question: "Si tokens = the, cat, sat, quels bigrammes obtenez-vous ?"
    options:
      - text: "the, cat, sat"
      - text: "(the, cat), (cat, sat)"
        correct: true
      - text: "(the, the), (cat, cat), (sat, sat)"
      - text: "(the, cat, sat)"
---
Des comptes de mots aux transitions de mots

La fréquence des mots vous dit *quels* mots apparaissent. Les bigrammes vous disent *ce qui suit quoi*. « The cat » est bien plus courant que « the refrigerator » — une table de bigrammes capture cette relation. C'est la forme la plus simple d'un modèle de langue : étant donné un mot, quels mots ont tendance à venir ensuite ?

## Concepts clés

### Qu'est-ce qu'un bigramme ?

Un bigramme est une paire de mots consécutifs. Dans la phrase « the cat sat on the mat », les bigrammes sont :

```
(the, cat), (cat, sat), (sat, on), (on, the), (the, mat)
```

Chaque paire représente une transition d'un mot au suivant. En comptant toutes les transitions du corpus, vous construisez un modèle statistique des séquences de mots.

### Construire le dict imbriqué

La table de bigrammes est un dict de dicts. La clé externe est le mot courant ; le dict interne mappe les mots suivants à leurs comptes :

```python
def build_bigrams(tokens):
    bigrams = {}
    for i in range(len(tokens) - 1):
        current = tokens[i]
        next_word = tokens[i + 1]
        if current not in bigrams:
            bigrams[current] = {}
        bigrams[current][next_word] = bigrams[current].get(next_word, 0) + 1
    return bigrams
```

Parcourez la liste de jetons avec une fenêtre glissante de taille 2. Pour chaque paire `(tokens[i], tokens[i+1])`, incrémentez le compte dans `bigrams[tokens[i]][tokens[i+1]]`.

### Exemple de parcours

Pour les jetons `["the", "cat", "sat", "the", "dog"]` :

```
i=0: current="the", next="cat" → bigrams["the"]["cat"] = 1
i=1: current="cat", next="sat" → bigrams["cat"]["sat"] = 1
i=2: current="sat", next="the" → bigrams["sat"]["the"] = 1
i=3: current="the", next="dog" → bigrams["the"]["dog"] = 1
```

Résultat :
```python
{
    "the": {"cat": 1, "dog": 1},
    "cat": {"sat": 1},
    "sat": {"the": 1},
}
```

### Utiliser defaultdict pour un code plus propre

```python
from collections import defaultdict

def build_bigrams(tokens):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    return dict(bigrams)
```

La `lambda: defaultdict(int)` crée automatiquement un nouveau dict interne pour chaque nouveau mot, pour que vous n'ayez jamais besoin de vérifier si une clé existe.

### Inspecter la table de bigrammes

Vérifiez que votre table semble raisonnable :

```python
bigrams = build_bigrams(tokens)

# How many words have followers?
print(f"Words with followers: {len(bigrams)}")

# Show the top word's followers
top_word = max(bigrams, key=lambda w: sum(bigrams[w].values()))
print(f"Most connected word: '{top_word}'")
print(f"  Followers: {bigrams[top_word]}")
```

### Frontières de phrase

En construisant des bigrammes à partir de plusieurs phrases, le dernier mot d'une phrase et le premier mot de la suivante deviennent un bigramme. C'est généralement acceptable pour un petit modèle — le modèle ne connaît pas la structure de phrase de toute façon. Mais si vous voulez des résultats plus propres, vous pouvez ajouter des marqueurs de frontière de phrase :

```python
def build_bigrams(tokens, add_boundaries=True):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    if add_boundaries:
        bigrams["<END>"] = defaultdict(int)
        bigrams[tokens[-1]]["<END>"] = bigrams[tokens[-1]].get("<END>", 0) + 1
    return dict(bigrams)
```

Cela vous permet de suivre quels mots terminent couramment des phrases.

## Essayez

Construisez une table de bigrammes à partir du corpus et répondez :
1. Combien de paires de bigrammes uniques existent ?
2. Quelles sont les 3 paires (mot, mot suivant) les plus courantes ?
3. Est-ce que « the » a plus de mots suivants que n'importe quel autre mot ?

```python
from collections import defaultdict

texts = load_corpus("slm-corpus.csv")
tokens = tokenize(" ".join(texts))
bigrams = build_bigrams(tokens)

total_pairs = sum(sum(f.values()) for f in bigrams.values())
print(f"Unique bigram pairs: {total_pairs}")
```

## Points clés

- Un bigramme est une paire de mots consécutifs — le modèle de séquence le plus simple
- La table de bigrammes est un dict imbriqué : `bigrams[word] = {follower: count}`
- `defaultdict(lambda: defaultdict(int))` simplifie le comptage imbriqué
- Les frontières de phrase peuvent être suivies avec des jetons spéciaux comme `<END>`

## Défi pratique

Écrivez une fonction `most_common_bigram(bigrams)` qui renvoie la paire `(word, follower)` la plus fréquente sous forme de tuple. Utilisez-la ensuite pour trouver le bigramme le plus courant du corpus.

```python
def most_common_bigram(bigrams):
    best = (None, None)
    best_count = 0
    for word, followers in bigrams.items():
        for follower, count in followers.items():
            if count > best_count:
                best = (word, follower)
                best_count = count
    return best, best_count
```