---

title: "Normaliser les comptes de bigrammes"
description: "Convertissez les comptes de bigrammes bruts en distributions de probabilité qui somment à 1,0 pour chaque mot."
module: "bigram-tables"
order: 6
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Normaliser les comptes de bigrammes bruts en probabilités en divisant par le total des mots suivants"
  - "Comprendre pourquoi les distributions de probabilité sont nécessaires pour l'échantillonnage pondéré"
  - "Gérer les cas limites : comptes nuls, mots à un seul mot suivant, clés manquantes"
  - "Vérifier que les probabilités somment à 1,0 pour chaque mot"
prerequisites: ["05-building-bigrams"]
tags: ["python", "probabilité", "normalisation", "bigrammes", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Pourquoi normaliser les comptes de bigrammes ?"
    options:
      - text: "Pour les faire ressembler à des pourcentages"
      - text: "Pour comparer des probabilités dans différents contextes"
        correct: true
      - text: "Pour réduire l'utilisation de mémoire"
      - text: "Pour les trier alphabétiquement"
  - question: "Que vaut P(mot2 | mot1) pour un bigramme ?"
    options:
      - text: "count(mot1, mot2) / count(mot1)"
        correct: true
      - text: "count(mot1) / count(mot2)"
      - text: "count(mot1, mot2) / total_mots"
      - text: "count(mot1) * count(mot2)"
  - question: "Si « the » apparaît 1000 fois et (the, cat) apparaît 50 fois, que vaut P(cat | the) ?"
    options:
      - text: "0,05"
        correct: true
      - text: "0,5"
      - text: "50"
      - text: "0,005"
---
Des comptes aux probabilités

Les comptes bruts vous disent que « the » → « cat » est apparu 15 fois et « the » → « dog » 5 fois. Mais pour **échantillonner** le mot suivant, vous avez besoin de probabilités : « cat » devrait être choisi 75 % du temps et « dog » 25 %. La normalisation convertit les comptes en une distribution où tous les mots suivants somment à 1,0.

## Concepts clés

### Normaliser avec une boucle

Pour chaque mot, additionnez ses comptes de mots suivants, puis divisez chaque compte par ce total :

```python
def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized
```

Maintenant, `normalized["the"]["cat"]` renvoie un float entre 0 et 1 — la probabilité que « cat » suive « the ».

### Exemple

```python
raw_bigrams = {"the": {"cat": 15, "dog": 5, "bird": 10}}
norm = normalize_bigrams(raw_bigrams)

print(norm["the"])
# {'cat': 0.5, 'dog': 0.1667, 'bird': 0.3333}
```

Les probabilités somment à 1,0 :
```python
print(sum(norm["the"].values()))  # 1.0
```

### Pourquoi la normalisation compte pour l'échantillonnage

`random.choices()` a besoin de poids qui représentent une vraisemblance relative. Si vous passez des comptes bruts (15, 5, 10), cela fonctionne — mais avoir de vraies probabilités (0,5, 0,167, 0,333) rend le modèle portable et comparable entre différentes tailles de corpus.

```python
import random

followers = list(norm["the"].keys())
weights = list(norm["the"].values())
next_word = random.choices(followers, weights=weights, k=1)[0]
print(f"Next word: {next_word}")
```

### Gérer les cas limites

Certains mots n'ont pas de mots suivants (le dernier mot du corpus, ou les mots qui n'apparaissent qu'à la fin d'une phrase). La table de bigrammes n'aura pas d'entrées pour eux :

```python
def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        if not followers:
            continue  # skip words with no followers
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized
```

Sauter les entrées vides évite les erreurs de division par zéro.

### Un pipeline complet

Voici comment la normalisation s'insère dans le pipeline complet :

```python
texts = load_corpus("slm-corpus.csv")
tokens = tokenize(" ".join(texts))
bigrams = build_bigrams(tokens)
model = normalize_bigrams(bigrams)

# Check a sample
print(f"Words in model: {len(model)}")
print(f"Followers of 'the': {list(model.get('the', {}).keys())[:5]}")
```

### Sauvegarder le modèle

Vous voudrez peut-être sauvegarder la table de bigrammes normalisée pour la réutiliser. Comme c'est un dict imbriqué de floats, `json` fonctionne bien :

```python
import json

with open("bigram_model.json", "w") as f:
    json.dump(model, f)

# Reload later
with open("bigram_model.json") as f:
    model = json.load(f)
```

## Essayez

Construisez et normalisez la table de bigrammes, puis vérifiez :
1. Les probabilités pour « the » somment-elles à 1,0 ?
2. Combien de mots ont zéro mot suivant ?
3. Quel est le mot le plus probable qui suit « the » ?

```python
model = normalize_bigrams(bigrams)
the_followers = model.get("the", {})
top_follower = max(the_followers, key=the_followers.get)
print(f"Most likely after 'the': '{top_follower}' ({the_followers[top_follower]:.3f})")
```

## Points clés

- La normalisation convertit les comptes bruts en probabilités qui somment à 1,0 par mot
- `random.choices()` utilise ces probabilités comme poids pour l'échantillonnage pondéré
- Sautez les mots sans mots suivants pour éviter la division par zéro
- Sauvegardez les modèles normalisés avec `json.dump()` pour les réutiliser entre scripts

## Défi pratique

Écrivez une fonction `bigram_stats(model)` qui affiche pour chaque mot : le mot, le nombre de mots suivants et le mot suivant le plus probable. Limitez la sortie aux 10 premiers mots par nombre total de mots suivants.

```python
def bigram_stats(model, top_n=10):
    words = sorted(model, key=lambda w: sum(model[w].values()), reverse=True)
    for word in words[:top_n]:
        followers = model[word]
        total = sum(followers.values())
        best = max(followers, key=followers.get)
        print(f"'{word}': {len(followers)} followers, best=''{best}'' ({followers[best]:.3f})")
```