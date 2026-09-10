---

title: "Réglage de la température"
description: "Modifiez les probabilités d'échantillonnage avec un paramètre de température pour contrôler à quel point la sortie du modèle est créative ou conservatrice."
module: "cli-text-generator"
order: 9
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Implémenter un paramètre de température qui met à l'échelle les log-probabilités avant l'échantillonnage"
  - "Comprendre comment une température basse rend la sortie plus déterministe"
  - "Comprendre comment une température élevée rend la sortie plus aléatoire"
  - "Appliquer la mise à l'échelle de température aux distributions de probabilité du modèle de bigrammes"
prerequisites: ["08-generate-text-impl"]
tags: ["python", "température", "échantillonnage", "softmax", "génération-de-texte"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Que fait la température aux probabilités d'échantillonnage ?"
    options:
      - text: "Elle rend tous les mots également probables"
      - text: "Elle aiguise ou aplatit la distribution de probabilité"
        correct: true
      - text: "Elle n'affecte que le mot le plus fréquent"
      - text: "Elle n'a aucun effet sur la sortie"
  - question: "Que se passe-t-il à une température de 0,1 ?"
    options:
      - text: "Une sortie très aléatoire"
      - text: "Une sortie très prévisible et répétitive"
        correct: true
      - text: "Une sortie équilibrée"
      - text: "Aucune sortie du tout"
  - question: "Que se passe-t-il à une température de 2,0 ?"
    options:
      - text: "Une sortie très prévisible"
      - text: "Une sortie très aléatoire et créative"
        correct: true
      - text: "La même chose qu'à une température de 1,0"
      - text: "Une erreur survient"
---
Contrôler la créativité

Un modèle de langue à probabilités fixes produit toujours le même genre de sortie — il suit le corpus exactement. Mais parfois vous voulez un texte plus créatif et surprenant, et parfois vous voulez la sortie la plus prévisible et sûre. La **température** est le bouton qui contrôle ce compromis.

Les cellules ci-dessous réutilisent les fonctions `load_corpus`, `tokenize`, `build_bigrams` et `normalize_bigrams` des leçons 01 à 06, la fonction `sample_next` de la leçon 07 et un `generate_text` sensible à la température (la même implémentation que vous verrez assemblée dans la leçon 10). Chaque page de leçon démarre une session Python vierge, alors exécutez d'abord cette cellule de mise en place :

```python
import csv
import string
import random
import math
from collections import defaultdict

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    texts = [row["text"] for row in reader]

def load_corpus(path):
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        return [row["text"] for row in reader]

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text.split()

def build_bigrams(tokens):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    return dict(bigrams)

def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        if not followers:
            continue
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized

def apply_temperature(probs, temperature):
    log_probs = [math.log(p + 1e-10) for p in probs]
    scaled = [lp / temperature for lp in log_probs]
    max_s = max(scaled)
    exp_s = [math.exp(s - max_s) for s in scaled]
    total = sum(exp_s)
    return [e / total for e in exp_s]

def sample_next(model, current_word, temperature=1.0):
    if current_word not in model:
        return None
    followers = model[current_word]
    words = list(followers.keys())
    probs = list(followers.values())
    if temperature != 1.0:
        probs = apply_temperature(probs, temperature)
    return random.choices(words, weights=probs, k=1)[0]

def generate_text(model, start_word, length=20, temperature=1.0):
    word = start_word
    result = [word]
    for _ in range(length - 1):
        next_word = sample_next(model, word, temperature)
        if next_word is None:
            next_word = random.choice(["the", "and", "to", "of", "a"])
        result.append(next_word)
        word = next_word
    return " ".join(result)

model = normalize_bigrams(build_bigrams(tokenize(" ".join(texts))))
```

## Concepts clés

### Qu'est-ce que la température ?

La température est un nombre (généralement entre 0,1 et 2,0) qui met à l'échelle la distribution de probabilité du modèle avant l'échantillonnage :

- **Température basse** (par ex., 0,2) : Aiguise la distribution — le mot le plus probable devient encore plus probable, et les mots rares deviennent presque impossibles. La sortie est répétitive et prévisible.
- **Température 1,0** : Aucun changement — les probabilités d'origine sont utilisées telles quelles.
- **Température élevée** (par ex., 1,5) : Aplatit la distribution — tous les mots deviennent plus également probables. La sortie est plus aléatoire, créative et potentiellement insensée.

### Les mathématiques : mise à l'échelle des log-probabilités

La température fonctionne en divisant les log-probabilités par la valeur de température, puis en reconvertissant :

```python
import math

def apply_temperature(probabilities, temperature):
    """Apply temperature scaling to a probability distribution."""
    # Convert to log-probabilities
    log_probs = [math.log(p + 1e-10) for p in probabilities]  # add small epsilon to avoid log(0)

    # Scale by temperature
    scaled = [lp / temperature for lp in log_probs]

    # Convert back to probabilities (softmax-like)
    max_scaled = max(scaled)
    exp_scaled = [math.exp(s - max_scaled) for s in scaled]  # subtract max for numerical stability
    total = sum(exp_scaled)

    return [e / total for e in exp_scaled]
```

L'astuce `math.exp(s - max_scaled)` empêche le dépassement numérique — sans soustraire le maximum, les exponentielles pourraient être astronomiquement grandes.

### Exemple : distribution à trois mots

```python
words = ["cat", "dog", "bird"]
probs = [0.7, 0.2, 0.1]

# Low temperature: cat becomes even more dominant
cold = apply_temperature(probs, temperature=0.5)
print("Cold (0.5):", dict(zip(words, [f"{p:.3f}" for p in cold])))
# cat ≈ 0.876, dog ≈ 0.088, bird ≈ 0.036

# High temperature: more uniform distribution
hot = apply_temperature(probs, temperature=2.0)
print("Hot (2.0):", dict(zip(words, [f"{p:.3f}" for p in hot])))
# cat ≈ 0.524, dog ≈ 0.281, bird ≈ 0.195
```

### Intégration avec sample_next()

Modifiez la fonction d'échantillonnage pour accepter un paramètre de température :

```python
import random

def sample_next(model, current_word, temperature=1.0):
    if current_word not in model:
        return None

    followers = model[current_word]
    words = list(followers.keys())
    probs = list(followers.values())

    if temperature != 1.0:
        probs = apply_temperature(probs, temperature)

    return random.choices(words, weights=probs, k=1)[0]
```

À `temperature=1.0`, les probabilités d'origine sont utilisées sans modification. Les valeurs plus basses aiguisent ; les valeurs plus élevées aplatissent.

### Effets de la température sur la génération

```python
# Cold: repetitive, predictable
random.seed(42)
for _ in range(3):
    print(generate_text(model, "the", length=10, temperature=0.3))

# Hot: creative, surprising
random.seed(42)
for _ in range(3):
    print(generate_text(model, "the", length=10, temperature=1.5))
```

Avec une température basse, vous verrez les mêmes phrases courantes répétées. Avec une température élevée, vous obtiendrez des combinaisons de mots inhabituelles qui pourraient ne pas avoir de sens grammatical.

### Lignes directrices pratiques de température

| Température | Effet | Cas d'utilisation |
|-------------|--------|----------|
| 0,1–0,3 | Très déterministe | Reproduire un texte connu |
| 0,5–0,7 | Conservateur | Sortie factuelle et sûre |
| 0,8–1,0 | Équilibré | Génération à usage général |
| 1,0–1,5 | Créatif | Brainstorming, écriture créative |
| 1,5–2,0 | Très aléatoire | Sortie expérimentale et surprenante |

Pour un petit modèle de bigrammes, les températures au-dessus de 1,2 produisent souvent du charabia parce que le modèle n'a pas assez de contexte pour maintenir la cohérence quand le hasard est élevé.

## Essayez

Générez le même texte à trois températures différentes et comparez :

```python
random.seed(42)
for temp in [0.3, 1.0, 1.5]:
    print(f"\n[temperature={temp}]")
    for _ in range(3):
        print(f"  {generate_text(model, 'the', length=12, temperature=temp)}")
```

Quelle température produit la sortie la plus lisible ? Quelle est la plus surprenante ?

## Points clés

- La température met à l'échelle les distributions de probabilité : basse aiguise, élevée aplatit
- La température 1,0 signifie aucun changement des probabilités d'origine
- Implémentez-la en mettant à l'échelle les log-probabilités : `log_prob / temperature`
- Température basse (0,3-0,7) pour une sortie prévisible ; élevée (1,0+) pour une sortie créative

## Défi pratique

Écrivez une fonction `compare_temperatures(model, word, temps)` qui génère du texte à chaque température et affiche un tableau de comparaison :

```python
def compare_temperatures(model, word, temps=[0.3, 0.7, 1.0, 1.5], length=15):
    for temp in temps:
        random.seed(42)
        text = generate_text(model, word, length=length, temperature=temp)
        print(f"  T={temp:.1f}: {text}")
```