---

title: "Générateur de texte en ligne de commande"
description: "Branchez toutes les étapes du pipeline dans un seul script en ligne de commande avec argparse pour une génération de texte conviviale."
module: "cli-text-generator"
order: 10
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Intégrer chargement → tokenisation → comptage → bigrammes → normalisation → génération dans un seul script"
  - "Utiliser argparse pour accepter des arguments en ligne de commande pour le nombre de mots, le mot de départ et la température"
  - "Construire un pipeline de bout en bout complet qui s'exécute depuis le terminal"
  - "Tester le système complet et produire du texte anglais plausible"
prerequisites: ["09-temperature-tuning"]
tags: ["python", "cli", "argparse", "pipeline", "projet-final"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Quel module Python est utilisé pour analyser les arguments de la ligne de commande ?"
    options:
      - text: "os"
      - text: "argparse"
        correct: true
      - text: "sys"
      - text: "cli"
  - question: "Que crée argparse.ArgumentParser() ?"
    options:
      - text: "Un descripteur de fichier"
      - text: "Un analyseur qui peut lire les arguments de la ligne de commande"
        correct: true
      - text: "Une connexion réseau"
      - text: "Une connexion de base de données"
  - question: "Comment accédez-vous à un argument analysé nommé --words ?"
    options:
      - text: "args['words']"
      - text: "args.words"
        correct: true
      - text: "args.getWords()"
      - text: "argparse.words"
---
L'assemblage final

Chaque pièce est construite et testée individuellement. Vous les branchez maintenant dans un seul script qu'un utilisateur peut exécuter depuis la ligne de commande. C'est l'aboutissement de tout le projet — un petit modèle de langue qui lit un corpus CSV et génère du nouveau texte.

## Concepts clés

### Le pipeline complet

Voici l'intégration complète en une seule fonction :

```python
import csv
import string
import random
import json
from collections import defaultdict

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
    import math
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
```

### Ajouter argparse

`argparse` analyse les arguments de la ligne de commande pour que les utilisateurs puissent contrôler la sortie :

```python
import argparse

def main():
    parser = argparse.ArgumentParser(description="Tiny Language Model Text Generator")
    parser.add_argument("--corpus", default="slm-corpus.csv", help="Path to CSV corpus")
    parser.add_argument("--start", default="the", help="Starting word")
    parser.add_argument("--words", type=int, default=20, help="Number of words to generate")
    parser.add_argument("--temperature", type=float, default=1.0, help="Temperature (0.1-2.0)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    parser.add_argument("--model", default=None, help="Path to save/load JSON model")

    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    # Load or build model
    if args.model:
        try:
            with open(args.model) as f:
                model = json.load(f)
            print(f"Loaded model from {args.model}")
        except FileNotFoundError:
            print(f"Model not found, building from {args.corpus}...")
            texts = load_corpus(args.corpus)
            tokens = tokenize(" ".join(texts))
            bigrams = build_bigrams(tokens)
            model = normalize_bigrams(bigrams)
            with open(args.model, "w") as f:
                json.dump(model, f)
            print(f"Model saved to {args.model}")
    else:
        texts = load_corpus(args.corpus)
        tokens = tokenize(" ".join(texts))
        bigrams = build_bigrams(tokens)
        model = normalize_bigrams(bigrams)

    # Generate
    output = generate_text(model, args.start, args.words, args.temperature)
    print(f"\n{output}")

if __name__ == "__main__":
    main()
```

### Exécuter depuis le terminal

```bash
# Default settings
python generate.py

# Custom options
python generate.py --start "the" --words 30 --temperature 0.7 --seed 42

# Save and reuse model
python generate.py --model bigram_model.json --start "he" --words 15
```

### Tester le pipeline

Exécutez des tests de bout en bout pour vérifier que tout fonctionne :

```python
def test_pipeline():
    texts = load_corpus("slm-corpus.csv")
    assert len(texts) > 0, "No data loaded"

    tokens = tokenize(" ".join(texts))
    assert len(tokens) > 0, "No tokens produced"

    bigrams = build_bigrams(tokens)
    assert len(bigrams) > 0, "No bigrams built"

    model = normalize_bigrams(bigrams)
    assert len(model) > 0, "Model is empty"

    text = generate_text(model, "the", length=10)
    assert len(text.split()) > 0, "No text generated"

    print("All tests passed!")
    print(f"Generated: {text}")

test_pipeline()
```

### Ce que vous avez construit

En cinq semaines, vous avez construit un pipeline NLP complet à partir de zéro :

1. **Semaine 1** : Chargé un corpus CSV dans Python
2. **Semaine 2** : Tokenisé le texte et compté les fréquences de mots
3. **Semaine 3** : Construit et normalisé des tables de probabilité de bigrammes
4. **Semaine 4** : Implémenté l'échantillonnage aléatoire pondéré pour la génération de texte
5. **Semaine 5** : Assemblé le tout dans un outil en ligne de commande avec contrôle de la température

C'est le même pipeline fondamental que celui utilisé dans les modèles de langue de production — juste avec plus de données, plus de paramètres et des réseaux de neurones au lieu de tables de bigrammes. Les idées centrales (tokenisation → comptage → probabilité → échantillonnage) sont identiques.

## Essayez

Exécutez le générateur complet avec différents réglages et observez la sortie :

```bash
python generate.py --start "the" --words 20 --temperature 0.5 --seed 1
python generate.py --start "the" --words 20 --temperature 1.0 --seed 1
python generate.py --start "the" --words 20 --temperature 1.5 --seed 1
```

Comparez les sorties. Quelle température produit le texte le plus lisible ?

## Points clés

- Le pipeline complet : chargement → tokenisation → comptage → bigrammes → normalisation → génération
- `argparse` fournit une interface en ligne de commande propre avec des arguments `--flag valeur`
- La mise en cache du modèle avec JSON évite de tout reconstruire à chaque exécution
- Ce pipeline reflète l'architecture des vrais modèles de langue, juste à une échelle minuscule

## Défi pratique

Étendez l'interface en ligne de commande avec un indicateur `--interactive` qui entre dans une boucle REPL :

```python
parser.add_argument("--interactive", action="store_true", help="Interactive mode")

# In main():
if args.interactive:
    print("Interactive mode. Type 'quit' to exit.")
    while True:
        word = input("Start word: ").strip()
        if word == "quit":
            break
        temp = float(input("Temperature (0.1-2.0): ") or "1.0")
        text = generate_text(model, word, args.words, temp)
        print(f"\n{text}\n")
```