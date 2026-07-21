---
title: "Semaine 3 : Tables de probabilité bigramme"
sidebar_position: 3
section: python-101
track: hard
week: 3
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semaine 3 : Tables de probabilité bigramme

<span className="gamified-flourish">🔗 La semaine dernière : « quel mot est probable, tout court ? » Cette semaine : « quel mot est probable *juste après celui-ci* ? »</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Extraire des **bigrammes** (paires de mots consécutifs) à partir de phrases tokenisées.
- Construire un dictionnaire imbriqué `dict[str, dict[str, float]]` associant chaque mot à une distribution de probabilité sur les mots qui le suivent.
- Expliquer, avec un exemple, pourquoi les bigrammes capturent un contexte que le modèle unigramme ne pouvait pas.
- Gérer le problème du « contexte jamais vu » : que faire quand un mot n'a absolument aucun successeur connu.

## Leçon

### Bigrammes : des paires de mots consécutifs

Un **bigramme** est une paire de mots consécutifs. Pour la phrase tokenisée `["the", "cat", "sat"]`, les bigrammes sont `("the", "cat")` et `("cat", "sat")` — une paire pour chaque position adjacente :

```python
def bigrams(tokens):
    return [(tokens[i], tokens[i + 1]) for i in range(len(tokens) - 1)]

bigrams(["the", "cat", "sat"])
# [('the', 'cat'), ('cat', 'sat')]
```

C'est le même motif `range(len(...) - 1)` qui apparaît chaque fois que vous devez examiner des paires de voisins dans une séquence — le `-1` existe car le *dernier* mot n'a pas de mot après lui avec lequel se coupler. Pour une phrase de $k$ tokens, il y a toujours exactement $k - 1$ bigrammes.

### Une table de probabilité conditionnelle

Nous estimons maintenant $P(w_n \mid w_{n-1})$ — la probabilité du mot suivant, *étant donné seulement le mot immédiatement précédent*. C'est un **modèle bigramme** : un contexte toujours limité (mémoire d'exactement un mot), mais strictement plus que la mémoire nulle du modèle unigramme.

La structure de données naturelle est un dict de dicts : pour chaque mot $w_{n-1}$, un dict imbriqué associant chaque mot suivant possible $w_n$ à sa probabilité, conditionnée par le fait d'être précédé de $w_{n-1}$ :

```python
def bigram_counts(tokenized_sentences):
    table = {}   # word -> {next_word: count}
    for tokens in tokenized_sentences:
        for first, second in bigrams(tokens):
            if first not in table:
                table[first] = {}
            table[first][second] = table[first].get(second, 0) + 1
    return table

def bigram_probabilities(counts_table):
    probs_table = {}
    for word, next_counts in counts_table.items():
        total = sum(next_counts.values())
        probs_table[word] = {w: c / total for w, c in next_counts.items()}
    return probs_table
```

`bigram_probabilities` réutilise exactement la même idée « comptages → diviser par le total » que `to_probabilities` la semaine dernière — la seule différence est qu'elle s'applique séparément à *chaque* ligne de la table propre à un mot, puisque chaque mot a sa propre distribution sur ce qui le suit. Chaque dict interne `probs_table[word]` somme à 1 de lui-même, la même propriété « somme à 1 » que la semaine dernière, simplement une distribution par mot au lieu d'une distribution pour tout le vocabulaire.

```python
probs_table["the"]
# {'cat': 0.35, 'dog': 0.3, 'mouse': 0.1, 'mat': 0.15, ...}
```

Lisez `probs_table["the"]["cat"]` comme $P(\text{"cat"} \mid \text{"the"})$ : sachant que le mot précédent était « the », quelle est la probabilité que « cat » vienne ensuite ?

### Le problème du contexte jamais vu

Un mot qui n'apparaît toujours qu'à la *fin* d'une phrase ne démarre jamais de bigramme, il est donc simplement absent en tant que clé de premier niveau dans `probs_table` — il n'y a aucune ligne pour lui du tout, puisque `bigram_counts` n'ajoute une clé que pour les mots qui apparaissent comme *premier* élément d'un bigramme. Cela compte beaucoup pour la semaine 4, où vous devrez vérifier `word in probs_table` avant d'accéder à quoi que ce soit, exactement le même motif défensif que vérifier qu'une clé existe avant d'indexer un dict ordinaire.

```python
def next_word_distribution(word, probs_table):
    if word not in probs_table:
        return None   # this word never starts a bigram in our corpus
    return probs_table[word]
```

Ce cas « le modèle n'a littéralement jamais vu cette situation » est une limitation réelle et inévitable de toute approche basée sur le comptage — elle ne peut jamais dire quoi que ce soit sur des motifs qu'elle n'a pas réellement observés dans les données d'entraînement, un thème qui reviendra explicitement à la semaine 4.

## ⚠️ Erreurs courantes

- **Supposer que chaque mot est une clé de premier niveau dans `probs_table`.** Seuls les mots qui apparaissent comme *premier* élément d'au moins un bigramme obtiennent une ligne — voir « le problème du contexte jamais vu » ci-dessus.
- **Confondre `probs_table[word]` avec `probs_table[word][other_word]`.** Le premier est une distribution entière (un dict) ; le second est une seule probabilité (un float). Oublier lequel des deux vous avez mène à des `TypeError` déroutantes plus loin.
- **Construire la table de comptages et la table de probabilités dans la même passe.** Garder `bigram_counts` et `bigram_probabilities` comme deux fonctions séparées (plutôt que de les fusionner) signifie que vous avez toujours les comptages bruts disponibles ensuite — utile pour des vérifications de cohérence, et pour l'expérience de chronométrage de la semaine 5, qui s'intéresse spécifiquement à l'étape de *comptage*.

## 🧩 Défis

<Challenge id="python101-hard-w3-c1" answer={<>Construisez la table de bigrammes complète avec <code>bigram_counts</code> puis <code>bigram_probabilities</code>, et consultez directement <code>probs_table["the"]["cat"]</code> et <code>probs_table["the"]["dog"]</code>. Celui qui a la probabilité la plus grande est le plus susceptible de suivre « the » dans ce corpus.</>}>

En utilisant le corpus de la semaine 1, calculez la table de probabilité bigramme. Lequel est le plus susceptible de suivre directement « the » : « cat » ou « dog » ?

</Challenge>

<Challenge id="python101-hard-w3-c2" answer={<>Parcourez <code>probs_table</code> et affichez <code>len(probs_table[word])</code> pour chacun, ou utilisez <code>max(probs_table, key=lambda w: len(probs_table[w]))</code> pour trouver directement le mot avec le plus de successeurs distincts.</>}>

Quel mot du corpus est suivi par le *plus* de mots distincts différents (c'est-à-dire a le plus grand dict interne dans `probs_table`) ?

</Challenge>

<Challenge id="python101-hard-w3-c3" answer={<>Le dernier mot d'une phrase n'apparaît jamais comme <code>premier</code> élément d'un bigramme (seulement comme <code>second</code>), il est donc absent en tant que clé de premier niveau dans <code>probs_table</code>, à moins qu'il n'apparaisse aussi en milieu de phrase ailleurs dans le corpus. Y accéder directement, par ex. <code>probs_table["mat"]</code>, lèverait une <code>KeyError</code> si « mat » ne démarre jamais de bigramme nulle part dans le corpus.</>}>

Choisissez un mot qui n'apparaît toujours que comme *dernier* mot d'une phrase dans le corpus. Est-ce une clé de premier niveau dans `probs_table` ? Pourquoi, ou pourquoi pas, étant donné comment `bigrams()` est définie ?

</Challenge>

<Challenge id="python101-hard-w3-c4" answer={<>Étendez <code>bigrams</code> en une fonction générale <code>ngrams(tokens, n)</code> qui retourne des tuples de <code>n</code> tokens consécutifs en utilisant <code>range(len(tokens) - n + 1)</code> et le découpage, par ex. <code>tuple(tokens[i:i+n])</code>. Les bigrammes ne sont que le cas particulier n=2.</>}>

Généralisez `bigrams(tokens)` en une fonction `trigrams(tokens)` qui retourne tous les *triplets* consécutifs de mots. Comment la généraliseriez-vous davantage en une fonction `ngrams(tokens, n)` ?

</Challenge>

<Challenge id="python101-hard-w3-c5" answer={<>Utilisez l'assistant next_word_distribution : appelez-le avec un mot dont vous savez qu'il n'est jamais une clé de premier niveau (par ex. un mot qui ne fait que terminer des phrases), et confirmez qu'il retourne None au lieu de lever une KeyError, puis gérez explicitement ce cas None partout où vous l'appelez.</>}>

Utilisez `next_word_distribution` pour consulter en toute sécurité un mot que vous avez déjà identifié au Défi 3 comme ne démarrant jamais de bigramme. Confirmez qu'elle retourne `None` au lieu de planter.

</Challenge>

<Challenge id="python101-hard-w3-c6" answer={<>Pour chaque clé de la table de comptages de bigrammes, sommez les valeurs de son dict interne pour obtenir le total des occurrences en bigramme de ce mot, et comparez-le au comptage de ce même mot dans le dict de comptages unigramme de la semaine 2 -- ils devraient correspondre exactement, puisque chaque occurrence d'un mot (sauf peut-être le tout dernier mot d'une phrase) démarre exactement un bigramme.</>}>

Pour un mot qui apparaît à la fois dans le `counts` unigramme de la semaine 2 et dans le `bigram_counts` de cette semaine, comparez son comptage unigramme à la somme des valeurs de sa ligne bigramme (`sum(bigram_counts[word].values())`). Devraient-ils correspondre ? Vérifiez quelques mots et expliquez tout petit écart que vous trouvez.

</Challenge>

## 🤔 Questions socratiques

- Consultez `probs_table["the"]` et comparez-la au `probs` global de la semaine dernière. S'agit-il de la même distribution ? Que cela vous apprend-il sur le fait que « the » change ou non ce qui est susceptible de venir ensuite ?
- Un modèle trigramme (conditionnant sur les *deux* mots précédents) capture plus de contexte qu'un modèle bigramme. Étant donné à quel point notre corpus de 20 phrases est petit, quel problème pratique prédisez-vous que les comptages de trigrammes rencontreraient, que les comptages de bigrammes évitent en grande partie ?
- `bigram_probabilities` construit une distribution de probabilité complète *par mot* du vocabulaire. Si le vocabulaire a $V$ mots distincts, combien de nombres environ la table de bigrammes complète pourrait-elle contenir dans le pire des cas (chaque mot suivant chaque autre mot au moins une fois) ? Qu'est-ce que cela suggère sur la façon dont la taille de la table évolue avec la taille du vocabulaire ?
- Le problème du contexte jamais vu signifie qu'un modèle bigramme peut rester complètement silencieux sur des mots qu'il n'a jamais vus démarrer un bigramme. Pouvez-vous imaginer un moyen de faire en sorte que le modèle ait *toujours* quelque chose à dire, même pour un mot jamais vu — peut-être en se rabattant sur quelque chose de la semaine dernière ?
- Le Défi 6 vous demande de comparer les comptages unigrammes aux comptages bigrammes sommés. Pour la plupart des mots, ils correspondent, mais le tout *dernier* mot d'une phrase est systématiquement sous-compté d'une unité dans la version bigramme. Pourquoi exactement une unité, et pourquoi seulement le dernier mot ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="python-101-hard-week-3"
  questions={[
    {
      id: 'q1',
      prompt: 'Un bigramme est :',
      options: [
        'Un seul mot',
        'Une paire de mots consécutifs',
        'Le vocabulaire complet d\'un corpus',
        'Un seuil de probabilité',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'probs_table["the"]["cat"] représente :',
      options: [
        'P(the)',
        'P(cat)',
        'P(cat | the) — la probabilité de "cat" sachant que le mot précédent était "the"',
        'Le comptage total de "the" dans le corpus',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'À quoi somme (approximativement) chaque dict interne probs_table[word] ?',
      options: ['0', '1', 'La taille du vocabulaire', 'Cela varie selon le mot, sans total fixe'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Comparé à un modèle unigramme, un modèle bigramme :',
      options: [
        'Utilise moins de contexte (aucune mémoire du tout)',
        'Utilise un mot de contexte précédent',
        'Utilise la phrase entière comme contexte',
        'Ne peut pas être représenté comme un dict',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'Un mot qui n\'apparaît jamais comme PREMIER élément d\'un quelconque bigramme dans le corpus est :',
      options: [
        'Automatiquement assigné une probabilité de 0 pour chaque mot suivant possible',
        'Totalement absent en tant que clé de premier niveau dans probs_table',
        'Tout de même inclus, avec une distribution vide {}',
        'Impossible -- chaque mot démarre au moins un bigramme',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-hard-week-3" />
