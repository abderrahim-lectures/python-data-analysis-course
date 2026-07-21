---
title: "Semaine 4 : Générer du texte"
sidebar_position: 4
section: python-101
track: hard
week: 4
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# Semaine 4 : Générer du texte par échantillonnage

<span className="gamified-flourish">🎰 Une table de probabilité est de l'énergie potentielle. Cette semaine, vous la dépensez — en générant réellement de nouvelles phrases, mot par mot.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Expliquer la différence entre *toujours choisir le mot suivant le plus probable* et *échantillonner* depuis la distribution.
- Utiliser `random.choices` pour échantillonner un mot suivant pondéré par les probabilités bigrammes.
- Écrire une fonction `generate_text()` qui produit une nouvelle phrase, un mot à la fois, à partir de la table de bigrammes.
- Rendre la génération aléatoire reproductible avec `random.seed`, quand c'est utile.

## Leçon

### Deux façons de choisir le mot « suivant »

Étant donné `probs_table["the"] = {"cat": 0.35, "dog": 0.3, "mouse": 0.1, "mat": 0.15, ...}`, il existe deux stratégies différentes pour choisir ce qui vient ensuite :

1. **Gloutonne (greedy)** : prendre toujours le seul mot le plus probable (`"cat"`, à 35%). C'est déterministe — la même entrée produit toujours la même sortie — et cela devient vite répétitif, puisque le mot de plus haute probabilité après « cat » est probablement, lui aussi, toujours le même.
2. **Échantillonnage (sampling)** : choisir un mot *au hasard*, mais pondéré par sa probabilité — de sorte que « cat » soit choisi environ 35% du temps, « dog » environ 30%, et ainsi de suite, comme un lancer de dé pondéré où chaque face a une aire de taille différente, exactement comme échantillonner depuis n'importe quelle distribution discrète $P(w)$.

Cette semaine utilise l'échantillonnage, car c'est ce qui fait varier le texte généré d'une exécution à l'autre — la même raison pour laquelle un modèle de langage ne vous donne pas la réponse identique à chaque fois que vous lui posez la même question.

### Échantillonner avec `random.choices`

`random.choices(population, weights)` de Python implémente exactement cela : étant donné une liste de résultats possibles et une liste de poids correspondante, elle retourne un résultat choisi avec une probabilité proportionnelle à son poids.

```python
import random

def sample_next(word, probs_table):
    if word not in probs_table:
        return None   # no known continuation — dead end
    next_words = list(probs_table[word].keys())
    weights = list(probs_table[word].values())
    return random.choices(next_words, weights=weights, k=1)[0]

sample_next("the", probs_table)   # e.g. "cat" — but not every time
```

Les `weights` n'ont pas besoin de sommer exactement à 1 pour que `random.choices` fonctionne correctement (elle normalise en interne) — mais les nôtres le font déjà, puisqu'ils proviennent directement de `bigram_probabilities` de la semaine dernière.

### Reproductibilité avec `random.seed`

L'aléatoire est exactement ce que nous voulons pour la variété, mais cela rend le débogage et le partage de résultats malcommodes — « ça a généré une phrase bizarre » est difficile à investiguer si vous ne pouvez pas reproduire exactement la même exécution. `random.seed(n)` fixe le générateur de nombres aléatoires de Python à un point de départ spécifique, de sorte que chaque appel à `random.choices(...)` après cela devient déterministe *pour cette exécution* :

```python
random.seed(42)
print(generate_text(probs_table, "the"))   # always the same output, every time you run this

random.seed()   # re-randomizes, back to normal unpredictable behavior
```

C'est une technique générale, pas spécifique aux modèles de langage — chaque fois que vous avez besoin de « aléatoire, mais reproductible pour les tests », `random.seed` est l'outil.

### Générer une phrase entière

En partant d'un mot de départ, échantillonnez le mot suivant de façon répétée et réinjectez-le comme nouveau « mot précédent » — une boucle, s'arrêtant soit à une longueur fixe, soit quand `sample_next` atteint une impasse :

```python
def generate_text(probs_table, start_word, max_words=10):
    words = [start_word]
    current = start_word
    for _ in range(max_words - 1):
        next_word = sample_next(current, probs_table)
        if next_word is None:
            break
        words.append(next_word)
        current = next_word
    return " ".join(words)

generate_text(probs_table, "the")
# e.g. "the cat sat on the rug" — will differ run to run
```

C'est le cœur génératif de tout le modèle de langage : rien d'autre que de l'échantillonnage pondéré répété depuis une table construite à partir du comptage. C'est un modèle de langage réel, fonctionnel (bien que très faible) — véritablement la même *idée* que la boucle d'échantillonnage de token suivant à l'intérieur de modèles bien plus grands, simplement estimée à partir de 20 phrases de comptage au lieu de milliards de paramètres entraînés sur d'immenses jeux de données.

### Générer plusieurs candidats à la fois

Comme chaque appel à `generate_text` est aléatoire, générer plusieurs phrases et les examiner est une façon naturelle d'explorer ce que le modèle peut produire — le même motif « échantillonner quelques-uns, choisir le meilleur » utilisé quand on travaille avec n'importe quel système génératif :

```python
def generate_many(probs_table, start_word, n=5, max_words=10):
    return [generate_text(probs_table, start_word, max_words) for _ in range(n)]

for sentence in generate_many(probs_table, "the", n=5):
    print(sentence)
```

## ⚠️ Erreurs courantes

- **Oublier de vérifier `None` en retour de `sample_next`.** Si `generate_text` ne vérifiait pas `if next_word is None: break`, elle planterait la prochaine fois qu'elle essaierait d'utiliser `None` comme clé dans `probs_table`.
- **Supposer que `random.choices` a besoin de poids qui somment exactement à 1.** Ce n'est pas le cas — elle normalise quels que soient les poids que vous lui donnez. Cela compte si vous passez un jour des comptages bruts au lieu de probabilités déjà normalisées.
- **Oublier que `random.seed()` (sans argument) réaléatoirise.** Après un débogage avec une graine fixe, oublier de rappeler `random.seed()` signifie que chaque appel « aléatoire » suivant dans cette session reste déterministe, ce qui peut ressembler à un bug dans du code sans rapport.
- **S'attendre à une sortie grammaticalement parfaite.** Un modèle bigramme n'a aucune notion d'accord sujet-verbe, de sens au niveau de la phrase, ou de quoi que ce soit au-delà de « ce qui suit habituellement ce seul mot » — c'est une vraie limitation, pas un bug à corriger, et c'est exactement ce que les questions socratiques ci-dessous vous demandent de constater directement.

## 🧩 Défis

<Challenge id="python101-hard-w4-c1" answer={<>Appelez <code>generate_text(probs_table, "the")</code> cinq fois de suite et affichez chaque résultat — puisque l'échantillonnage est aléatoire, vous devriez voir au moins quelques phrases différentes même avec exactement le même mot de départ.</>}>

Appelez `generate_text` cinq fois avec le même `start_word`. Les sorties sont-elles identiques ? Pourquoi, ou pourquoi pas ?

</Challenge>

<Challenge id="python101-hard-w4-c2" answer={<>Choisissez un mot qui ne démarre jamais de bigramme dans le corpus (par ex. un mot qui n'apparaît toujours que comme dernier mot d'une phrase) comme <code>start_word</code> ; <code>sample_next</code> retournera immédiatement <code>None</code> puisque ce mot n'est pas une clé dans <code>probs_table</code>, donc <code>generate_text</code> retourne seulement ce mot de départ.</>}>

Appelez `generate_text` avec un `start_word` qui n'apparaît jamais comme *premier* mot d'un bigramme nulle part dans le corpus (vous en avez trouvé des candidats au Défi 3 de la semaine dernière). Que se passe-t-il, et pourquoi ?

</Challenge>

<Challenge id="python101-hard-w4-c3" answer={<>Ajoutez une vérification : si <code>next_word == current</code> de façon répétée (par ex. gardez trace des derniers mots dans une petite liste/deque et interrompez si le même mot se répète plus de, disons, 3 fois de suite), arrêtez la génération plus tôt. Cela n'arrivera pas souvent sur ce petit corpus, mais c'est un vrai mode d'échec des boucles d'échantillonnage naïves sur des corpus plus grands.</>}>

Modifiez `generate_text` pour qu'elle s'arrête plus tôt si le même mot est choisi 3 fois de suite (une garde-fou simple contre les boucles répétitives). Dans quelles conditions de corpus pensez-vous que cela pourrait réellement se produire ?

</Challenge>

<Challenge id="python101-hard-w4-c4" answer={<>Changez <code>sample_next</code> pour choisir <code>max(probs_table[word], key=lambda w: probs_table[word][w])</code> au lieu de <code>random.choices</code> — c'est la stratégie « gloutonne » de la leçon. Appeler <code>generate_text</code> de façon répétée avec le même mot de départ produira maintenant toujours exactement la même phrase.</>}>

Écrivez une fonction `sample_next_greedy(word, probs_table)` qui choisit toujours le seul mot suivant le plus *probable* au lieu d'échantillonner aléatoirement. Exécutez `generate_text` (en utilisant cette version gloutonne) cinq fois avec le même mot de départ — que remarquez-vous ?

</Challenge>

<Challenge id="python101-hard-w4-c5" answer={<>Appelez random.seed(1), puis generate_text(...), puis random.seed(1) à nouveau, puis generate_text(...) avec les mêmes arguments -- les deux sorties devraient être identiques, puisque réinitialiser à la même graine rejoue exactement la même séquence de choix « aléatoires ».</>}>

Appelez `random.seed(1)` avant de générer une phrase, notez le résultat, puis rappelez `random.seed(1)` avant de générer une autre phrase avec les mêmes arguments. Les deux résultats sont-ils identiques ? Pourquoi ?

</Challenge>

<Challenge id="python101-hard-w4-c6" answer={<>Utilisez generate_many pour produire, disons, 20 phrases, puis choisissez celle avec le plus de mots (en utilisant max(..., key=len) sur les phrases découpées, ou en comparant len(sentence.split())) comme approximation simple de « sortie la plus développée ».</>}>

En utilisant `generate_many`, générez 20 phrases candidates à partir du même mot de départ, puis affichez celle qui est la plus *longue* (qui a le plus de mots).

</Challenge>

## 🤔 Questions socratiques

- L'échantillonnage introduit de l'aléatoire délibérément. Pouvez-vous imaginer un cas d'usage réel pour un modèle de langage où vous voudriez en réalité le comportement glouton, toujours-la-même-réponse à la place ?
- `sample_next` retourne `None` quand le mot courant n'a aucune continuation connue. Quelle analogie du monde réel cette « impasse » a-t-elle — est-ce plutôt le modèle étant incertain, ou le modèle n'ayant littéralement jamais vu cette situation auparavant ?
- Ce modèle bigramme ne peut jamais générer que des séquences de mots *statistiquement plausibles étant donné des transitions d'un seul mot* — il n'a aucune notion du fait que la phrase « ait un sens » dans son ensemble. Générez plusieurs phrases et cherchez-en qui sont grammaticalement étranges ou dénuées de sens malgré le fait que chaque paire de mots individuelle soit localement plausible. Que cela suggère-t-il sur les limites du fait de ne jamais regarder plus loin qu'un mot en arrière ?
- `random.seed` rend un processus aléatoire reproductible pour le débogage, mais les vraies applications des modèles de langage (comme un chatbot) ne fixent généralement pas la graine. Pourquoi *ne pas* la fixer pourrait-il être le bon choix là-bas, même si cela rend les bugs plus difficiles à reproduire ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="python-101-hard-week-4"
  questions={[
    {
      id: 'q1',
      prompt: 'Que fait random.choices(population, weights=weights) ?',
      options: [
        'Retourne toujours l\'élément avec le plus grand poids',
        'Retourne des éléments avec une probabilité proportionnelle à leur poids',
        'Retourne chaque élément exactement une fois, dans un ordre aléatoire',
        'Ignore les poids et choisit uniformément au hasard',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Pourquoi appeler generate_text() plusieurs fois avec le même mot de départ donne-t-il des résultats différents ?',
      options: [
        'C\'est un bug',
        'probs_table change entre les appels',
        'sample_next utilise un échantillonnage aléatoire, pas un choix glouton fixe',
        'Les dicts Python ne sont pas ordonnés',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'sample_next retourne None quand :',
      options: [
        'Les poids ne somment pas à 1',
        'Le mot donné n\'est pas une clé dans probs_table (aucune continuation connue)',
        'max_words est atteint',
        'random.choices retourne toujours None au bout d\'un moment',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'La stratégie « gloutonne » du mot suivant diffère de l\'échantillonnage car elle :',
      options: [
        'Est plus rapide mais identique par ailleurs',
        'Choisit toujours le seul mot le plus probable, elle est donc déterministe',
        'Choisit uniformément au hasard en ignorant les probabilités',
        'Ne fonctionne qu\'avec les modèles unigrammes, pas bigrammes',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'Que fait random.seed(42) ?',
      options: [
        'Génère exactement 42 nombres aléatoires',
        'Fixe le générateur de nombres aléatoires pour que les appels aléatoires suivants deviennent reproductibles',
        'Définit la valeur maximale que random.choices peut retourner',
        'N\'a aucun effet sur random.choices',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

## 🎁 Bonus : gestion des erreurs pour un mauvais mot de départ

<BonusContent weekId="python-101-hard-week-4">

Actuellement, appeler `generate_text(probs_table, "zzz")` pour un mot qui n'est même pas du tout dans le vocabulaire retourne silencieusement `"zzz"` — pas de plantage, mais pas non plus de signal utile indiquant que quelque chose ne va pas. Une version plus défensive pourrait plutôt lever une erreur claire :

```python
def generate_text_safe(probs_table, start_word, max_words=10):
    if start_word not in probs_table:
        raise ValueError(f"'{start_word}' never appears as a starting word in this corpus")
    try:
        return generate_text(probs_table, start_word, max_words)
    except Exception as e:
        print(f"Generation failed: {e}")
        return start_word
```

Cela ne fait pas partie du programme principal, mais c'est la même idée de `try`/`except` introduite à la semaine 4 du parcours normal de Python 101, appliquée ici à un pipeline de génération plutôt qu'à un calcul de moyenne. Essayez de déclencher la `ValueError` exprès, et réfléchissez à où ailleurs dans le `generate_text` de cette semaine une garde-fou similaire pourrait valoir la peine d'être ajoutée.

</BonusContent>

<ProgressCheckbox weekId="python-101-hard-week-4" />
