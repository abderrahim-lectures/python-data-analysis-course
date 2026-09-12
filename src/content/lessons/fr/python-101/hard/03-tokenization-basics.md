---

title: "Bases de la tokenisation"
description: "Construisez une fonction tokenize() qui divise le texte brut en jetons de mots propres en utilisant uniquement les méthodes de chaîne."
module: "tokenization-frequency"
order: 3
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Écrire une fonction tokenize(text) utilisant str.lower(), str.split() et str.strip()"
  - "Supprimer la ponctuation du texte avant de le diviser"
  - "Comprendre pourquoi les décisions de tokenisation affectent la sortie du modèle"
  - "Comparer différentes stratégies de tokenisation et leurs compromis"
prerequisites: ["02-exploring-corpus"]
tags: ["python", "tokenisation", "méthodes-de-chaîne", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Que fait text.lower().split() ?"
    options:
      - text: "Divise sur la ponctuation puis met en minuscules"
      - text: "Met en minuscules puis divise sur les espaces blancs"
        correct: true
      - text: "Divise sur les espaces blancs puis supprime la ponctuation"
      - text: "Met en minuscules et supprime tous les caractères non alphabétiques"
  - question: "Pourquoi remplaçons-nous la ponctuation par des espaces au lieu de simplement la supprimer ?"
    options:
      - text: "C'est plus rapide"
      - text: "La suppression joindrait des mots adjacents entre eux"
        correct: true
      - text: "Les espaces sont nécessaires pour que split() fonctionne"
      - text: "Cela préserve la longueur du texte d'origine"
  - question: "Quel jeton la chaîne cant produit-elle avec notre fonction tokenize() ?"
    options:
      - text: "cant"
      - text: "cant"
      - text: "can, t"
        correct: true
      - text: "can, t"
---
Du texte brut aux jetons

Le texte brut n'est qu'une chaîne de caractères. Pour construire un modèle de langue, vous devez le diviser en unités discrètes, des **jetons**, que le modèle peut compter et prédire. Pour simplifier, nous utiliserons les mots comme jetons. Les modèles plus avancés utilisent des jetons de sous-mots (BPE, SentencePiece), mais la tokenisation au niveau des mots suffit pour démontrer les idées centrales.

## Concepts clés

### Le tokeniseur le plus simple

L'approche la plus basique est `str.split()` :

```python
text = "The cat sat on the mat"
tokens = text.split()
print(tokens)  # ['The', 'cat', 'sat', 'on', 'the', 'mat']
```

Cela fonctionne, mais remarquez : "The" et "the" sont traités comme des jetons différents à cause de la capitalisation. Pour un modèle basé sur la fréquence, nous voulons qu'ils soient comptés comme le même mot.

### Mise en minuscules

Convertir tout en minuscules fusionne les variantes de casse :

```python
text = "The cat sat on the Mat"
tokens = text.lower().split()
print(tokens)  # ['the', 'cat', 'sat', 'on', 'the', 'mat']
```

Maintenant, "The" et "mat" correspondent aux mêmes jetons que "the" et "Mat" ailleurs dans le corpus.

### Suppression de la ponctuation

La ponctuation attachée aux mots crée de faux jetons, "hello," et "hello" deviennent des mots différents. Supprimez-la avant de diviser :

```python
import string

def strip_punctuation(text):
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text

text = "Hello, world! How's it going?"
clean = strip_punctuation(text)
print(clean.lower().split())
# ['hello', 'world', 'how', 's', 'it', 'going']
```

Chaque caractère de ponctuation est remplacé par un espace, puis la division donne des jetons propres. Notez que "How's" devient deux jetons : "how" et "s". C'est un compromis connu de la tokenisation simple, les outils plus avancés traitent les contractions différemment.

### Combiner dans une fonction tokenize()

Rassemblez tout cela :

```python
import string

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text.split()

# Test it
sample = "The quick brown fox jumps over the lazy dog."
print(tokenize(sample))
# ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog']
```

Cette fonction fait trois choses en séquence : mettre en minuscules, supprimer la ponctuation, diviser sur les espaces blancs. Elle est simple, rapide et suffisante pour un petit modèle de langue.

### Pourquoi la tokenisation compte

Différentes stratégies de tokenisation produisent des vocabulaires différents et des comportements de modèle différents :

| Entrée | Résultat de division | Résultat en minuscules |
|-------|-------------|-----------------|
| "New York" | ["New", "York"] | ["new", "york"] |
| "can't" | ["can't"] | ["can't"] |
| "hello,world" | ["hello,world"] | ["hello,world"] |

Le dernier exemple montre un problème : sans supprimer la ponctuation d'abord, "hello,world" reste un jeton unique. Notre étape `strip_punctuation` gère cela. Il n'y a pas de tokenisation unique « correcte », cela dépend de ce que votre modèle doit apprendre.

## Essayez

Tokenisez le texte suivant et comptez les jetons obtenus :

```python
text = "To be, or not to be, that is the question. To be is to exist."
tokens = tokenize(text)
print(f"Tokens: {tokens}")
print(f"Count: {len(tokens)}")
```

Combien de jetons uniques obtenez-vous ? Quel mot apparaît le plus souvent ?

## Points clés

- `str.split()` divise sur les espaces blancs, le tokeniseur le plus simple
- La mise en minuscules fusionne les variantes de casse pour que "The" et "the" comptent comme un seul jeton
- La suppression de la ponctuation empêche des jetons comme "hello," et "hello" d'être différents
- La tokenisation est un choix de conception, il n'y a pas de réponse unique correcte pour tous les modèles

## Défi pratique

Étendez `tokenize()` pour aussi supprimer les jetons numériques (les mots qui ne sont que des chiffres). Écrivez un test :

```python
import string

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    tokens = text.split()
    return [t for t in tokens if not t.isdigit()]

sample = "I have 3 cats and 2 dogs in year 2024"
print(tokenize(sample))
# ['i', 'have', 'cats', 'and', 'dogs', 'in', 'year']
```