---
title: "Semaine 1 : Charger un corpus de texte depuis un CSV"
sidebar_position: 1
section: python-101
track: hard
week: 1
description: "Démarrez le parcours Difficile de Python 101 : chargez et explorez un petit corpus de texte depuis un CSV, première étape vers la construction d'un modèle de langage miniature."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semaine 1 : Construire un mini modèle de langage — charger le corpus

<span className="gamified-flourish">🧠 Au cours des 5 prochaines semaines, vous allez construire un mini modèle de langage — la même idée de base derrière des outils comme ChatGPT — en n'utilisant que du Python pur. Pas de bibliothèques, pas de raccourcis. À la semaine 5, vous ressentirez exactement pourquoi les vrais modèles de langage ne procèdent pas ainsi, et cet inconfort est tout l'intérêt de l'exercice : c'est votre motivation pour la Section 2.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Expliquer, à haut niveau, ce qu'est un modèle de langage : un système qui prédit le mot suivant à partir des mots précédents.
- Charger un petit corpus de texte depuis un fichier CSV dans une liste Python de phrases, en utilisant uniquement la bibliothèque standard.
- Découper des phrases en listes de mots (un premier tokeniseur naïf), et expliquer ses limites.
- Calculer des statistiques descriptives de base sur un corpus de texte : nombre de phrases, taille du vocabulaire, longueur moyenne.

## Leçon

### Qu'est-ce qu'un modèle de langage ?

Un modèle de langage attribue une probabilité à des séquences de mots — de façon informelle, il répond à « étant donné les mots jusqu'ici, quel mot est susceptible de venir ensuite ? » Si vous avez déjà vu la phrase « le chat s'est assis sur le ___ », vous avez déjà prédit « tapis » avant même de finir de lire cette phrase. C'est la tâche, formalisée : étant donné des mots $w_1, \dots, w_{n-1}$, estimer

$$
P(w_n \mid w_1, \dots, w_{n-1})
$$

Les vrais modèles (y compris les grands) estiment cette probabilité à l'aide d'immenses réseaux de neurones entraînés sur d'immenses jeux de données. Cette semaine démarre une version bien plus petite : nous allons l'estimer en n'utilisant rien d'autre que le **comptage**, sur un tout petit corpus écrit à la main, en Python pur. Cela fonctionnera, et dès la semaine 5, ce sera aussi lent — délibérément, pour que la *raison d'être* d'outils comme pandas et numpy cesse d'être une affirmation abstraite et devienne quelque chose que vous aurez ressenti personnellement.

Pourquoi le *comptage* permet-il d'estimer une probabilité ? Parce que la probabilité elle-même, dans son sens le plus simple (« fréquentiste »), n'est rien d'autre que « combien de fois cela s'est-il produit, sur tout ce qui aurait pu se produire » — $P(\text{événement}) \approx \frac{\text{nombre d'occurrences de cet événement}}{\text{nombre total d'événements}}$. Tout ce que ce parcours construit, des fréquences de mots de la semaine 2 jusqu'à la génération de texte de la semaine 4, n'est rien d'autre que ce même ratio, appliqué à différentes questions sur quel mot suit quel autre.

### Le corpus

Ce parcours utilise [`slm-corpus.csv`](pathname:///datasets/slm-corpus.csv), un petit ensemble de phrases simples écrites à la main, une par ligne sous une colonne `sentence`. Un « corpus » est simplement le jeu de données textuel à partir duquel un modèle de langage apprend — le nôtre est délibérément minuscule (20 phrases) pour que chaque étape reste assez rapide à exécuter et à inspecter à la main, à ce stade précoce du cours.

:::tip[Ce fichier est déjà disponible dans le bac à sable]
Le bac à sable du FAB a déjà `slm-corpus.csv` préchargé — pas besoin de copier-coller quoi que ce soit, `load_corpus("slm-corpus.csv")` ci-dessous le trouvera directement.
:::

### Le charger

Vous connaissez déjà `csv.DictReader` grâce à... en fait, pas encore — c'est la semaine 5 du parcours normal, une semaine en avance sur où en est le parcours difficile actuellement. Puisque ce parcours plonge directement dans un vrai projet, voici la même idée, en autonomie :

```python
import csv

def load_corpus(path):
    sentences = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sentences.append(row["sentence"])
    return sentences

corpus = load_corpus("slm-corpus.csv")
print(len(corpus), "sentences loaded")
print(corpus[0])
```

`load_corpus` retourne une simple `list[str]` — une chaîne par phrase. Chaque valeur issue de `csv.DictReader` est une `str`, tout comme `input()`. Remarquez que la fonction fait exactement un travail (transformer un chemin de fichier en liste de chaînes de phrases) et rien d'autre — elle ne tokenise pas, ne compte pas, n'affiche rien au-delà de ce que l'appelant demande. Garder chaque fonction ainsi étroitement délimitée est ce qui vous permettra de construire le reste du pipeline de ce parcours comme des pièces petites et testables séparément, plutôt qu'un long script enchevêtré.

### Un premier tokeniseur

Avant de pouvoir compter les mots, il faut découper une chaîne de phrase en une liste de mots individuels — cette étape s'appelle la **tokenisation**. Le tokeniseur le plus simple possible découpe simplement sur les espaces :

```python
def tokenize(sentence):
    return sentence.lower().split()

tokenize("The cat sat on the mat")
# ['the', 'cat', 'sat', 'on', 'the', 'mat']
```

`.lower()` compte : sans cela, `"The"` et `"the"` seraient comptés plus tard comme deux mots différents, ce qui rendrait nos comptages de mots (la semaine prochaine) moins pertinents. `.split()` sans argument découpe sur toute suite d'espaces, ce qui est suffisant pour les phrases simples et sans ponctuation de ce corpus.

Une version légèrement plus robuste retire la ponctuation de base avant de découper, ce qui compte dès que votre corpus cesse d'être délibérément propre :

```python
import string

def tokenize_robust(sentence):
    no_punct = sentence.translate(str.maketrans("", "", string.punctuation))
    return no_punct.lower().split()

tokenize_robust("The cat sat on the mat.")
# ['the', 'cat', 'sat', 'on', 'the', 'mat']  -- le point final a disparu
```

`string.punctuation` est une chaîne toute faite des caractères de ponctuation courants ; `str.maketrans("", "", string.punctuation)` construit une table de traduction qui fait correspondre chacun de ces caractères à rien, et `.translate(...)` l'applique, les supprimant effectivement. Ce parcours s'en tient au `tokenize` plus simple pour le reste des semaines (le corpus est sans ponctuation exprès), mais il vaut la peine de voir à quoi ressemble une « vraie » étape de prétraitement — cet écart précis est l'une des nombreuses raisons pour lesquelles les outils de NLP en production utilisent des bibliothèques de tokenisation dédiées plutôt qu'un simple appel à `.split()`.

### Statistiques de base du corpus

Avant de construire quoi que ce soit de probabiliste, il vaut la peine de simplement regarder les données — le même réflexe que le parcours d'analyse exploratoire de la Section 2 formalisera en toute une méthodologie :

```python
tokenized = [tokenize(s) for s in corpus]
lengths = [len(tokens) for tokens in tokenized]

print("Sentences:", len(corpus))
print("Shortest sentence:", min(lengths), "words")
print("Longest sentence:", max(lengths), "words")
print("Average sentence length:", sum(lengths) / len(lengths))
```

Même cette petite quantité de profilage vous apprend quelque chose d'utile : si chaque phrase du corpus avait exactement la même longueur, cela suggérerait un jeu de données très artificiel (ou très répétitif) — bon à savoir avant de faire confiance à toute statistique calculée à partir de lui plus tard.

## ⚠️ Erreurs courantes

- **Oublier `.lower()`.** Sans cela, `"The"` et `"the"` sont deux tokens différents pour Python, séparant silencieusement en deux ce qui devrait être le comptage d'un seul mot.
- **Supposer que `.split()` gère la ponctuation.** `"mat.".split()` sur une phrase entière vous donne un token `"mat."` (avec le point attaché) comme un seul morceau, pas `"mat"` et `"."` séparément — un vrai écart que les défis de cette semaine vous demandent de constater directement.
- **Relire le fichier à chaque fois que vous avez besoin du corpus.** `load_corpus` effectue des entrées/sorties fichier, relativement lentes — appelez-la une fois, stockez le résultat dans une variable, et réutilisez cette variable, plutôt que de rappeler `load_corpus(...)` à l'intérieur d'une boucle.

## 🧩 Défis

<Challenge id="python101-hard-w1-c1" answer={<>Appelez <code>load_corpus</code>, puis utilisez une compréhension de liste : <code>[tokenize(s) for s in corpus]</code>. Cela produit une liste de listes — chaque liste interne est constituée des tokens d'une phrase.</>}>

En utilisant `load_corpus` et `tokenize` ensemble, produisez une liste où chaque élément est la version tokenisée (liste de mots) d'une phrase du corpus.

</Challenge>

<Challenge id="python101-hard-w1-c2" answer={<>Parcourez les phrases tokenisées et prenez <code>len(tokens)</code> pour chacune, puis utilisez le motif <code>sum(...) / len(...)</code> sur l'ensemble — le même motif de moyenne qu'à la semaine 4/5 du parcours normal de Python 101, appliqué cette fois à des nombres de tokens plutôt qu'à des scores.</>}>

Calculez le nombre moyen de mots par phrase dans le corpus.

</Challenge>

<Challenge id="python101-hard-w1-c3" answer={<>Construisez un <code>set()</code> et ajoutez-y chaque token de chaque phrase tokenisée (ou utilisez une compréhension d'ensemble sur une liste aplatie) ; <code>len(...)</code> de cet ensemble est la taille du vocabulaire — le nombre de mots *distincts*, contrairement au nombre total de mots qui compte les répétitions.</>}>

Calculez la taille du **vocabulaire** du corpus — le nombre de mots *distincts* qui apparaissent n'importe où dans le corpus (sans compter les répétitions).

</Challenge>

<Challenge id="python101-hard-w1-c4" answer={<>Un tokeniseur naïf à base de <code>.split()</code> traiterait <code>"mat."</code> et <code>"mat"</code> comme des tokens différents, et <code>"Amina's"</code> resterait collé à son apostrophe — la ponctuation attachée à un mot n'est pas retirée. Les vrais tokeniseurs (et le corpus de ce cours) contournent cela en gardant les phrases sans ponctuation pour l'instant.</>}>

Les phrases du corpus ne contiennent délibérément aucune ponctuation. Qu'irait-il de travers avec l'approche simple de `.split()` de `tokenize` si une phrase contenait *effectivement* de la ponctuation, comme `"The cat sat on the mat."` ? Essayez-le sur cette chaîne et inspectez le résultat.

</Challenge>

<Challenge id="python101-hard-w1-c5" answer={<>Appelez <code>tokenize_robust("The cat sat on the mat.")</code> et comparez avec <code>tokenize("The cat sat on the mat.")</code> — la version robuste retire le point final avant de découper, produisant <code>"mat"</code> au lieu de <code>"mat."</code> comme dernier token.</>}>

Passez la même phrase ponctuée du Défi 4 par `tokenize_robust` cette fois. Produit-elle la liste de tokens attendue ?

</Challenge>

<Challenge id="python101-hard-w1-c6" answer={<>Parcourez les phrases tokenisées, construisez un comptage de fréquence des longueurs de phrase (par ex. un dict associant chaque longueur au nombre de phrases qui l'ont), et trouvez la longueur avec le comptage le plus élevé — le même motif « suivre un maximum courant dans un dict » qu'à la semaine 3 du parcours normal de Python 101.</>}>

Trouvez la longueur de phrase *la plus courante* dans le corpus (en mots) — pas la moyenne, la longueur qui apparaît le plus souvent.

</Challenge>

## 🤔 Questions socratiques

- $P(w_n \mid w_1, \dots, w_{n-1})$ conditionne sur *chaque* mot précédent. Notre petit corpus n'a que 20 phrases — pensez-vous que nous aurons assez de données pour estimer une probabilité conditionnée sur de longs historiques ? Que pourrions-nous devoir simplifier ?
- Pourquoi `tokenize` met-elle la phrase en minuscules avant de la découper ? Quelle question de fréquence de mots de la semaine prochaine donnerait une réponse trompeuse si nous sautions cette étape ?
- `load_corpus` et `tokenize` sont toutes deux de petites fonctions à but unique plutôt qu'une seule grande fonction qui fait tout. Qu'avez-vous appris à la semaine 4 du parcours normal de Python 101 qui explique pourquoi c'est utile ici, au-delà de « c'est plus propre » ?
- `tokenize_robust` retire *toute* la ponctuation, y compris les apostrophes à l'intérieur des contractions comme `"don't"`, la transformant en `"dont"`. Est-ce réellement le comportement correct pour un vrai tokeniseur ? Que faudrait-il changer pour traiter les contractions spécialement ?
- Étant donné l'idée fréquentiste que « probabilité ≈ comptage / total », que pensez-vous qu'il arrive à vos estimations de probabilité lorsque le corpus passe de 20 phrases à 20 000 ? Vous attendriez-vous à ce que les estimations deviennent plus ou moins fiables, et pourquoi ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="python-101-hard-week-1"
  questions={[
    {
      id: 'q1',
      prompt: 'Un modèle de langage estime lequel des éléments suivants ?',
      options: [
        'Le prochain mot exact avec une certitude de 100 %',
        'La probabilité du mot suivant étant donné les mots précédents',
        'Si une phrase est grammaticalement correcte',
        'Le nombre total de mots dans un document',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Pourquoi tokenize() appelle-t-elle .lower() avant .split() ?',
      options: [
        'Cela rend le code plus rapide',
        'Cela garantit que csv.DictReader fonctionne correctement',
        'Pour que "The" et "the" soient comptés comme le même mot plus tard',
        'Cela est requis par la syntaxe Python',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'Que retourne load_corpus() ?',
      options: [
        'Une seule longue chaîne',
        'Une liste de chaînes, une par phrase',
        'Un dict associant des mots à des comptages',
        'Un objet fichier CSV',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Que signifie la « taille du vocabulaire » pour un corpus ?',
      options: [
        'Le nombre total de mots, répétitions incluses',
        'Le nombre de phrases',
        'Le nombre de mots distincts',
        'La longueur moyenne des phrases',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'Que réalisent string.punctuation combiné à str.translate dans tokenize_robust ?',
      options: [
        'Cela convertit le texte en majuscules',
        'Cela retire les caractères de ponctuation avant le découpage',
        'Cela compte combien de marques de ponctuation sont présentes',
        'Cela traduit la phrase dans une autre langue',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-hard-week-1" />
