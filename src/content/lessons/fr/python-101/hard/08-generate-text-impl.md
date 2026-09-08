---

title: "Implémenter generate_text()"
description: "Enchaînez la boucle d'échantillonnage dans une fonction complète qui construit une séquence de mots à partir du modèle de bigrammes."
module: "generate-text"
order: 8
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Écrire une fonction generate_text(bigrams, start_word, length)"
  - "Enchaîner des appels sample_next() dans une boucle pour construire des séquences de mots"
  - "Gérer les impasses (aucun mot suivant connu) avec grâce"
  - "Contrôler la longueur de sortie et déboguer la génération avec des journaux"
prerequisites: ["07-sampling-next-word"]
tags: ["python", "fonction", "génération-de-texte", "boucle", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Quelle est la boucle centrale de la génération de texte ?"
    options:
      - text: "Lire tout le fichier d'un coup"
      - text: "Chercher les bigrammes du mot courant, échantillonner le mot suivant, répéter"
        correct: true
      - text: "Choisir au hasard n'importe quel mot du vocabulaire"
      - text: "Trier tous les mots alphabétiquement"
  - question: "Comment le générateur sait-il quels mots peuvent suivre le mot courant ?"
    options:
      - text: "Il devine en fonction de la longueur du mot"
      - text: "Il cherche dans la table de bigrammes le mot courant"
        correct: true
      - text: "Il choisit toujours le mot le plus fréquent"
      - text: "Il lit le fichier d'origine à chaque fois"
  - question: "Qu'est-ce qui limite la longueur du texte généré ?"
    options:
      - text: "Un nombre fixe de mots (num_words)"
        correct: true
      - text: "La taille du fichier"
      - text: "La limite de récursion de Python"
      - text: "Le nombre de mots uniques"
---
Rassemblons tout

Vous savez charger des données, tokeniser, compter les mots, construire des bigrammes, normaliser les probabilités et échantillonner le mot suivant. Vous combinez maintenant cela dans une seule fonction qui génère du texte : choisissez un mot de départ, échantillonnez le mot suivant, renvoyez-le en entrée, et répétez jusqu'à avoir produit assez de mots.

## Concepts clés

### La boucle de génération

La logique centrale est une simple boucle :

```python
import random

def generate_text(model, start_word, length=20):
    word = start_word
    result = [word]

    for _ in range(length - 1):
        next_word = sample_next(model, word)
        if next_word is None:
            break  # dead end
        result.append(next_word)
        word = next_word

    return " ".join(result)
```

Commencez avec `start_word`, échantillonnez le mot suivant, ajoutez-le au résultat et définissez-le comme nouveau mot courant. Répétez `length - 1` fois (le premier mot est déjà dans la liste).

### Gérer les impasses

Quand `sample_next()` renvoie `None` (le mot courant n'a pas de mots suivants connus), vous avez trois options. La plus simple est de s'arrêter :

```python
if next_word is None:
    break
```

Cela produit une sortie plus courte mais dont l'exactitude est garantie. Pour une sortie plus longue, redémarrez depuis un mot courant :

```python
if next_word is None:
    next_word = random.choice(["the", "and", "to", "of", "a"])
```

### Choisir un mot de départ

Le mot de départ façonne fortement la sortie. Commencer par « the » produit de l'anglais générique ; commencer par un mot rare peut produire une sortie inhabituelle :

```python
def generate_from_random(model, length=20):
    start = random.choice(list(model.keys()))
    return generate_text(model, start, length)
```

Pour plus de contrôle, laissez l'utilisateur spécifier le mot de départ.

### Tester avec une graine fixe

Déboguer la génération exige une sortie reproductible. Définissez la graine avant d'appeler :

```python
random.seed(42)
print(generate_text(model, "the", length=10))
# Always produces the same output with seed 42
```

### Une version plus robuste

Ajoutez des journaux pour tracer ce qui se passe :

```python
def generate_text(model, start_word, length=20, verbose=False):
    word = start_word
    result = [word]

    for i in range(length - 1):
        next_word = sample_next(model, word)
        if verbose:
            print(f"  Step {i+1}: '{word}' → '{next_word}'")
        if next_word is None:
            if verbose:
                print(f"  Dead end at step {i+1}")
            break
        result.append(next_word)
        word = next_word

    return " ".join(result)
```

Avec `verbose=True`, vous pouvez regarder la génération pas à pas.

### À quoi ressemble la sortie

En l'exécutant sur le corpus :

```python
random.seed(123)
text = generate_text(model, "the", length=15)
print(text)
```

Cela pourrait produire quelque chose comme :

```
the old man had been a good teacher and he had a
```

La sortie ne sera pas grammaticalement parfaite — c'est un petit modèle avec seulement un contexte de bigrammes. Mais elle capture de vraies séquences de mots anglais parce que les probabilités de bigrammes proviennent de texte réel.

## Essayez

Générez 5 textes différents de longueur 20, chacun commençant par un mot différent :

```python
random.seed(42)
starts = ["the", "a", "he", "she", "it"]
for word in starts:
    text = generate_text(model, word, length=20)
    print(f"\n[{word}] {text}")
```

## Points clés

- `generate_text()` enchaîne les appels `sample_next()` dans une boucle pour construire des séquences de mots
- Les impasses surviennent quand un mot n'a pas de mots suivants connus — gérez-les en vous arrêtant ou en redémarrant
- Le choix du mot de départ affecte fortement la qualité de la sortie
- Utilisez `random.seed()` et `verbose=True` pour le débogage

## Défi pratique

Écrivez `generate_until(model, start_word, stop_words)` qui génère du texte jusqu'à atteindre un mot dans `stop_words` ou 50 mots. Utilisez-la pour générer du texte qui s'arrête aux mots de fin de phrase :

```python
def generate_until(model, start_word, stop_words=None, max_length=50):
    if stop_words is None:
        stop_words = set()
    word = start_word
    result = [word]
    for _ in range(max_length - 1):
        next_word = sample_next(model, word)
        if next_word is None or next_word in stop_words:
            break
        result.append(next_word)
        word = next_word
    return " ".join(result)
```