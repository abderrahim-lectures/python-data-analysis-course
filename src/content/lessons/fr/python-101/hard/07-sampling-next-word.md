---

title: "Échantillonner le mot suivant"
description: "Utilisez random.choices() pour choisir le mot suivant dans une distribution de probabilité pondérée par les probabilités de bigrammes."
module: "generate-text"
order: 7
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Utiliser random.choices(population, weights) pour une sélection aléatoire pondérée"
  - "Comprendre comment les poids influencent la probabilité de chaque résultat"
  - "Définir une graine aléatoire pour des résultats reproductibles"
  - "Échantillonner dans une table de bigrammes pour choisir le mot suivant étant donné un mot courant"
prerequisites: ["06-normalizing-bigrams"]
tags: ["python", "random", "échantillonnage", "pondéré", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Que fait random.choices() pour l'échantillonnage de mots ?"
    options:
      - text: "Choisit un mot au hasard"
      - text: "Sélectionne un mot pondéré par sa probabilité"
        correct: true
      - text: "Trie les mots par fréquence"
      - text: "Supprime les mots en double"
  - question: "Pourquoi utiliser des poids au lieu de probabilités égales pour l'échantillonnage ?"
    options:
      - text: "C'est plus rapide"
      - text: "Les mots plus fréquents devraient avoir plus de chances d'être choisis"
        correct: true
      - text: "Cela utilise moins de mémoire"
      - text: "Cela rend la sortie plus courte"
  - question: "Que se passe-t-il si vous échantillonnez avec weights=[0.5, 0.3, 0.2] ?"
    options:
      - text: "Chaque mot a une chance égale"
      - text: "Le premier mot a 50 % de chances, le second 30 %, le troisième 20 %"
        correct: true
      - text: "Les mots sont triés par poids"
      - text: "Seul le premier mot est jamais choisi"
---
Le moteur de la génération de texte

La génération de texte est, au fond, un problème d'échantillonnage. Étant donné un mot courant, vous devez choisir le mot suivant dans une distribution de possibilités — certains mots sont probables, d'autres rares, mais tous sont possibles. `random.choices()` fait exactement cela.

## Concepts clés

### Les bases de random.choices()

`random.choices()` choisit un ou plusieurs éléments d'une liste, pondérés par leurs probabilités :

```python
import random

words = ["cat", "dog", "bird"]
weights = [0.5, 0.3, 0.2]  # probabilities must sum to 1

# Pick one word
result = random.choices(words, weights=weights, k=1)
print(result[0])  # e.g. 'cat'
```

Le paramètre `k` contrôle combien d'éléments choisir. Pour la génération de texte, vous choisissez un mot à la fois.

### Échantillonnage répété

Pour voir la distribution en action, échantillonnez de nombreuses fois :

```python
import random

words = ["cat", "dog", "bird"]
weights = [0.5, 0.3, 0.2]

counts = {w: 0 for w in words}
for _ in range(1000):
    pick = random.choices(words, weights=weights, k=1)[0]
    counts[pick] += 1

print(counts)
# e.g. {'cat': 502, 'dog': 298, 'bird': 200}
```

Avec 1000 échantillons, « cat » devrait apparaître environ 500 fois (50 %), « dog » environ 300 fois (30 %) et « bird » environ 200 fois (20 %).

### Échantillonner dans le modèle de bigrammes

Étant donné un mot courant, cherchez ses mots suivants dans le modèle normalisé et échantillonnez :

```python
def sample_next(model, current_word):
    if current_word not in model:
        return None  # no followers known
    followers = model[current_word]
    words = list(followers.keys())
    weights = list(followers.values())
    return random.choices(words, weights=weights, k=1)[0]

# Example
current = "the"
next_word = sample_next(model, current)
print(f"After '{current}' comes '{next_word}'")
```

Si le mot courant n'est pas dans le modèle (il n'a pas de mots suivants connus), renvoyez `None`. L'appelant doit gérer ce cas — soit arrêter la génération, soit choisir un mot aléatoire pour continuer.

### Reproductibilité avec les graines

`random.choices()` utilise l'état aléatoire global de Python. Définir une graine rend la sortie reproductible — utile pour le débogage et les tests :

```python
random.seed(42)
print(sample_next(model, "the"))  # always the same word with seed 42

random.seed(99)
print(sample_next(model, "the"))  # might be different
```

### Gérer le cas limite : pas de mots suivants

Certains mots n'apparaissent qu'à la fin du corpus et n'ont pas de mots suivants connus. Quand `sample_next` renvoie `None`, vous avez des options :

1. **Arrêter la génération** — le choix le plus conservateur
2. **Redémarrer depuis un mot aléatoire** — maintient la sortie en cours
3. **Redémarrer depuis un mot courant** — choisissez parmi les N mots les plus fréquents

L'option 3 produit généralement les meilleurs résultats :

```python
import random

top_words = ["the", "and", "to", "of", "a"]

def sample_next_or_restart(model, current_word):
    result = sample_next(model, current_word)
    if result is None:
        return random.choice(top_words)  # restart
    return result
```

## Essayez

Chargez le modèle de bigrammes normalisé et échantillonnez le mot suivant 10 fois après « the » :

```python
random.seed(42)
model = load_model("bigram_model.json")  # from previous lesson

for _ in range(10):
    next_word = sample_next(model, "the")
    print(f"the → {next_word}")
```

À quel point les résultats sont-ils cohérents ? Essayez de changer la graine — obtenez-vous des mots différents ?

## Points clés

- `random.choices(population, weights, k=1)` effectue une sélection aléatoire pondérée
- Les poids doivent sommer à 1,0 pour une interprétation correcte des probabilités
- `random.seed()` rend la sortie reproductible pour le débogage
- Gérez les mots suivants manquants en redémarrant depuis un mot courant

## Défi pratique

Écrivez une fonction `sample_n(model, word, n)` qui renvoie une liste de n mots suivants échantillonnés pour un mot courant donné. Utilisez-la pour voir la distribution des mots suivants de « the » :

```python
def sample_n(model, word, n=100):
    results = []
    for _ in range(n):
        results.append(sample_next(model, word))
    from collections import Counter
    return Counter(results).most_common()
```