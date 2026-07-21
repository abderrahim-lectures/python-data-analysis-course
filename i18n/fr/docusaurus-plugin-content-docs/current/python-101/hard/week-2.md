---
title: "Semaine 2 : Fréquences des mots"
sidebar_position: 2
section: python-101
track: hard
week: 2
description: "Tokenisez du texte et comptez les fréquences de mots avec des dictionnaires Python, en présentant les tables de fréquence comme des distributions de probabilité discrètes."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semaine 2 : Les fréquences de mots comme distribution discrète

<span className="gamified-flourish">🎲 Une table de comptage de mots ressemble à de la comptabilité. C'est en réalité une distribution de probabilité déguisée.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Construire une table de fréquence de mots (`dict[str, int]`) à partir d'un corpus tokenisé.
- Convertir des comptages bruts en probabilités, et expliquer pourquoi ils forment une distribution de probabilité discrète valide.
- Raisonner sur ce que ce modèle « unigramme » peut et ne peut pas prédire.
- Reconnaître la forme d'une distribution de fréquence de mots zipfienne (loi de puissance).

## Leçon

### Compter les mots

Étant donné une liste de phrases tokenisées (de la semaine dernière), compter combien de fois chaque mot apparaît est exactement le motif de table de fréquence de la semaine 3 du parcours normal de Python 101 :

```python
def count_words(tokenized_sentences):
    counts = {}
    for tokens in tokenized_sentences:
        for word in tokens:
            counts[word] = counts.get(word, 0) + 1
    return counts

counts = count_words(tokenized)
counts["the"]   # le nombre de fois où "the" apparaît dans tout le corpus
```

La bibliothèque standard possède en fait un outil conçu exactement pour ce motif, `collections.Counter` — utile à connaître même si nous continuerons à l'écrire à la main dans ce parcours pour rester sans dépendance :

```python
from collections import Counter

counts = Counter(word for tokens in tokenized for word in tokens)
counts.most_common(5)   # les 5 paires (mot, comptage) les plus fréquentes, déjà triées
```

`Counter` est une sous-classe de `dict`, donc tout ce que vous savez déjà sur les dicts (`.get()`, `.items()`, l'appartenance avec `in`) s'y applique toujours — elle ajoute simplement quelques commodités spécifiques au comptage comme `.most_common()`.

### Des comptages aux probabilités

Une table de fréquence devient une **distribution de probabilité** dès que vous divisez chaque comptage par le nombre total d'occurrences de mots. Si $c(w)$ est le comptage du mot $w$ et $N = \sum_w c(w)$ est le comptage total de mots, alors :

$$
P(w) = \frac{c(w)}{N}
$$

```python
def to_probabilities(counts):
    total = sum(counts.values())
    return {word: count / total for word, count in counts.items()}

probs = to_probabilities(counts)
probs["the"]   # par ex. 0.18 — 18% de chances qu'un emplacement de mot choisi au hasard soit "the"
```

Deux propriétés font de ceci une véritable distribution de probabilité, et pas juste « des nombres » :
1. Chaque $P(w) \ge 0$ — un comptage ne peut jamais être négatif.
2. $\sum_w P(w) = 1$ — chaque occurrence de mot est attribuée à exactement un mot, donc les probabilités de tous les résultats possibles somment à 1, la même exigence que pour toute distribution que vous avez étudiée dans un cours de statistiques.

Vous pouvez vérifier la propriété 2 directement : `sum(probs.values())` devrait être (très proche de) `1.0` — « très proche » à cause de l'imprécision des flottants vue à la semaine 1 du parcours normal.

### C'est un modèle *unigramme*

Estimer $P(w)$ de cette façon ignore tout contexte — c'est la même probabilité pour « the » qu'il suive « sat on » ou qu'il commence une toute nouvelle phrase. Cela s'appelle un modèle **unigramme** : il regarde un mot à la fois, sans mémoire de ce qui précédait. C'est un modèle de langage réel et valide — juste extrêmement faible, puisque le langage réel est fortement dépendant du contexte (« banque » après « rivière » contre après « argent » signifie des choses différentes). La semaine prochaine corrige cela, une étape à la fois, en conditionnant sur **un** mot précédent — un modèle **bigramme**.

### Un motif que vous verrez partout : la loi de Zipf

Triez vos comptages de mots du plus au moins fréquent et regardez la forme : une poignée de mots (comme « the », « a », « on ») représentent une énorme part de toutes les occurrences de mots, tandis que la plupart des mots du vocabulaire n'apparaissent qu'une ou deux fois. Ce n'est pas propre à notre minuscule corpus — c'est un motif empirique extrêmement robuste dans le texte réel appelé la **loi de Zipf** : la fréquence d'un mot est à peu près inversement proportionnelle à son rang, $c(w) \propto \frac{1}{\text{rang}(w)}$. Le mot le plus fréquent apparaît environ deux fois plus souvent que le deuxième plus fréquent, trois fois plus souvent que le troisième, et ainsi de suite. Vous pouvez voir une version approximative de cette forme même dans un corpus de 20 phrases :

```python
ranked = sorted(counts.items(), key=lambda pair: pair[1], reverse=True)
for rank, (word, count) in enumerate(ranked[:10], start=1):
    print(rank, word, count)
```

`enumerate(ranked[:10], start=1)` numérote les 10 premières entrées en commençant à 1 plutôt qu'au 0 habituel de Python — utile chaque fois que « rang » ou « position » est entendu au sens courant, indexé à partir de 1.

## ⚠️ Erreurs courantes

- **Accéder directement à un mot plutôt qu'avec `.get()`.** `counts[word] + 1` lors de la toute première apparition d'un mot lève une `KeyError`, puisque le mot n'est pas encore une clé — `.get(word, 0) + 1` gère élégamment le cas « pas encore vu ce mot ».
- **Oublier que le dénominateur change selon le corpus.** `probs["the"]` d'un corpus et `probs["the"]` d'un corpus différent, plus grand, ne sont en général pas directement comparables — chacun est relatif au compte total de mots $N$ de son propre corpus.
- **Confondre « taille du vocabulaire » et « compte total de mots ».** $N = \sum_w c(w)$ compte chaque occurrence (avec répétitions) ; la taille du vocabulaire (semaine 1) compte uniquement les mots *distincts*. `to_probabilities` divise par $N$, pas par la taille du vocabulaire — confondre les deux brise la propriété « somme à 1 ».

## 🧩 Défis

<Challenge id="python101-hard-w2-c1" answer={<>Utilisez <code>sorted(counts, key=lambda w: counts[w], reverse=True)[:5]</code>, ou de façon équivalente triez les paires de <code>counts.items()</code> par comptage — le même motif de tri par clé que dans le programme récapitulatif de la semaine 5 du parcours normal de Python 101.</>}>

Étant donné `counts` issu de `count_words`, trouvez les 5 mots les plus fréquents du corpus.

</Challenge>

<Challenge id="python101-hard-w2-c2" answer={<>Parcourez <code>probs.values()</code> et sommez-les, ou plus simplement <code>sum(probs.values())</code> ; cela devrait afficher quelque chose d'extrêmement proche de 1.0 (comme 0.9999999999999999) à cause de l'arrondi en virgule flottante, et non exactement 1.0.</>}>

Vérifiez la propriété 2 de la leçon : calculez `sum(probs.values())` pour votre corpus et confirmez qu'elle vaut (presque exactement) `1.0`.

</Challenge>

<Challenge id="python101-hard-w2-c3" answer={<>Les mots qui n'apparaissent qu'une fois auront chacun la même, plus petite, probabilité non nulle — calculable comme <code>1 / total</code>. Vous pouvez les trouver en filtrant <code>counts</code> pour les entrées où le comptage vaut 1.</>}>

Les mots qui n'apparaissent qu'une seule fois dans le corpus sont appelés **hapax legomena**. Trouvez-les tous, et expliquez quelle probabilité `to_probabilities` attribue à chacun.

</Challenge>

<Challenge id="python101-hard-w2-c4" answer={<>Un mot jamais vu dans le corpus a un comptage de 0, il est donc simplement absent du dict <code>counts</code>/<code>probs</code> — y accéder directement avec <code>probs["giraffe"]</code> lève une <code>KeyError</code> plutôt que de retourner 0, c'est pourquoi <code>.get(word, 0)</code> compte ici aussi.</>}>

Quelle probabilité ce modèle attribue-t-il à un mot qui n'est jamais apparu nulle part dans le corpus, comme `"giraffe"` ? Que se passe-t-il réellement si vous écrivez `probs["giraffe"]` directement ?

</Challenge>

<Challenge id="python101-hard-w2-c5" answer={<>Utilisez directement collections.Counter : Counter(word for tokens in tokenized for word in tokens).most_common(5). Comparez son résultat à votre réponse du Défi 1 -- elles devraient lister les mêmes 5 mots dans le même ordre, simplement calculés avec un outil intégré plutôt qu'avec sorted() à la main.</>}>

Réécrivez le Défi 1 (les 5 mots les plus fréquents) en utilisant `collections.Counter` et `.most_common()` au lieu de `sorted()`. Obtenez-vous la même réponse ?

</Challenge>

<Challenge id="python101-hard-w2-c6" answer={<>Affichez le rang et le comptage côte à côte pour les 10 premiers mots classés, puis calculez count / rank pour chacun -- pour un corpus suivant raisonnablement bien la loi de Zipf, ce ratio devrait rester à peu près similaire (proche du comptage propre du mot en tête) à travers les rangs, puisque c(w) fois le rang est approximativement constant sous c(w) ∝ 1/rang.</>}>

En utilisant la liste `ranked` de l'exemple sur la loi de Zipf, calculez `count * rank` pour chacun des 10 premiers mots. La loi de Zipf prédit que ce produit devrait être à peu près constant. L'est-il, pour notre petit corpus ?

</Challenge>

## 🤔 Questions socratiques

- Le modèle unigramme donne à « the » une probabilité élevée et constante partout dans une phrase, y compris tout au début. Cela correspond-il à votre intuition sur les mots qui ont tendance à *commencer* une phrase en anglais par rapport à ceux qui apparaissent au milieu ? Que manque-t-il à ce modèle pour corriger cela ?
- Deux phrases différentes, « the cat sat on the mat » et « mat the on sat cat the » (les mots mélangés), produisent *exactement* la même table de fréquence de mots. Que cela vous apprend-il sur l'information qu'un modèle unigramme capture et ne capture pas ?
- Pourquoi diviser par le compte total de mots $N$ (toutes les occurrences de mots) plutôt que par la taille du vocabulaire (mots distincts) lors du calcul de $P(w)$ ? Qu'irait-il de travers avec la propriété « somme à 1 » si vous divisiez par la taille du vocabulaire à la place ?
- La loi de Zipf apparaît dans bien plus que les seules fréquences de mots — la taille des populations urbaines, la distribution des richesses et le trafic des sites web montrent tous une forme similaire « quelques énormes, beaucoup minuscules ». Pourquoi les phénomènes basés sur le comptage en général auraient-ils tendance à produire ce motif, plutôt que tout soit à peu près égal ?
- Notre corpus n'a que 20 phrases, donc la plupart des mots sont des hapax legomena (apparaissent exactement une fois). Que pensez-vous qu'il arrive à la *proportion* de hapax legomena à mesure qu'un corpus grandit beaucoup plus — rétrécit-elle vers zéro, ou la loi de Zipf suggère-t-elle qu'elle reste étonnamment élevée même pour d'immenses corpus ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="python-101-hard-week-2"
  questions={[
    {
      id: 'q1',
      prompt: 'Pour une distribution de probabilité valide sur des mots, que doit valoir (approximativement) sum(probs.values()) ?',
      options: ['0', '1', 'La taille du vocabulaire', 'Le compte total de mots'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Un modèle « unigramme » estime la probabilité d\'un mot en se basant sur :',
      options: [
        'Les 2 mots précédents',
        'La phrase entière jusqu\'ici',
        'Aucun contexte du tout — juste la fréquence globale',
        'Le mot suivant seulement',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'Quelle probabilité le modèle unigramme attribue-t-il à un mot jamais vu dans le corpus ?',
      options: ['1.0', 'Un très petit nombre positif', '0 (il est simplement absent de la table)', 'Cela lève une erreur au moment de la construction du modèle'],
      correctOptionIndex: 2,
    },
    {
      id: 'q4',
      prompt: 'counts.get(word, 0) + 1 est utilisé plutôt que counts[word] + 1 parce que :',
      options: [
        'Cela s\'exécute plus rapidement',
        'Cela évite une KeyError la première fois qu\'un mot est vu',
        'Cela ne fonctionne que pour les nombres',
        'Ils se comportent de façon identique, c\'est juste une question de style',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'La loi de Zipf décrit quel type de relation entre le rang d\'un mot et sa fréquence ?',
      options: [
        'La fréquence augmente avec le rang',
        'La fréquence est à peu près constante quel que soit le rang',
        'La fréquence est à peu près inversement proportionnelle au rang',
        'Il n\'existe pas de relation générale',
      ],
      correctOptionIndex: 2,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-hard-week-2" />
