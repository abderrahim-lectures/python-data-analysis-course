---
title: "Semaine 5 : Un générateur en CLI, la température, et le mur de vitesse"
sidebar_position: 5
section: python-101
track: hard
week: 5
description: "Assemblez un générateur de texte en ligne de commande avec un réglage de température, puis mesurez le temps d'exécution de votre code Python pur pour sentir où il ralentit."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# Semaine 5 : Assembler le CLI, régler la température, et ressentir le mur de vitesse

<span className="gamified-flourish">⏱️ C'est la semaine où toute la contrainte « Python pur, pas de numpy » cesse d'être un inconvénient et devient le point central.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Assembler chaque pièce des semaines 1 à 4 en un générateur de texte en ligne de commande complet, de bout en bout.
- Ajouter un paramètre de **température** qui contrôle à quel point le texte généré est aléatoire ou prévisible.
- Chronométrer votre pipeline en Python pur sur un corpus plus grand et expliquer, à partir d'une mesure de première main, pourquoi cela motive la Section 2.
- Raisonner de façon informelle sur la manière dont le temps d'exécution de votre pipeline évolue avec la taille des données d'entrée.

## Leçon

### Assembler le pipeline

Chaque fonction des semaines 1 à 4 se compose en un seul pipeline — charger, tokeniser, compter, convertir en probabilités, générer :

```python
import csv
import random

def load_corpus(path):
    with open(path, newline="") as f:
        return [row["sentence"] for row in csv.DictReader(f)]

def tokenize(sentence):
    return sentence.lower().split()

def bigrams(tokens):
    return [(tokens[i], tokens[i + 1]) for i in range(len(tokens) - 1)]

def build_bigram_probabilities(sentences):
    counts_table = {}
    for sentence in sentences:
        for first, second in bigrams(tokenize(sentence)):
            counts_table.setdefault(first, {})
            counts_table[first][second] = counts_table[first].get(second, 0) + 1
    probs_table = {}
    for word, next_counts in counts_table.items():
        total = sum(next_counts.values())
        probs_table[word] = {w: c / total for w, c in next_counts.items()}
    return probs_table

def generate_text(probs_table, start_word, max_words=10):
    words, current = [start_word], start_word
    for _ in range(max_words - 1):
        if current not in probs_table:
            break
        next_words = list(probs_table[current].keys())
        weights = list(probs_table[current].values())
        current = random.choices(next_words, weights=weights, k=1)[0]
        words.append(current)
    return " ".join(words)

if __name__ == "__main__":
    corpus = load_corpus("slm-corpus.csv")
    probs_table = build_bigram_probabilities(corpus)
    print(generate_text(probs_table, "the", max_words=8))
```

`dict.setdefault(key, {})` dans `build_bigram_probabilities` est un petit raccourci pour le motif `if key not in table: table[key] = {}` de la semaine 3 — il fait la même chose en une ligne. `if __name__ == "__main__":` est la façon standard de marquer « exécute ceci quand le fichier est lancé directement » — vous verrez cette convention constamment une fois que vous installerez Python en local pour l'un des [projets concrets](/docs/projects).

### Température : régler l'aléatoire

La **température** est un unique bouton qui étire ou aplatit une distribution de probabilité avant d'échantillonner dedans, sans changer quels résultats sont possibles — seulement à quel point l'échantillonnage se comporte de façon uniforme (plate) ou gloutonne (pointue) :

$$
P_T(w) = \frac{P(w)^{1/T}}{\sum_{w'} P(w')^{1/T}}
$$

- $T = 1$ : inchangé — échantillonnage normal depuis la distribution d'origine.
- $T < 1$ (par ex. $0.5$) : accentue la distribution — les mots à haute probabilité deviennent *encore* plus probables, poussant la génération vers le comportement glouton de la semaine dernière.
- $T > 1$ (par ex. $2.0$) : aplatit la distribution — les mots à faible probabilité deviennent relativement plus probables, produisant un texte plus surprenant, plus chaotique.

Pourquoi l'exponentiation, plutôt que simplement mettre les probabilités à l'échelle directement ? Parce qu'élever chaque $P(w)$ à une puissance $\frac{1}{T}$ affecte les grandes et les petites probabilités de manière *inégale*, exactement dans la direction voulue : pour $T < 1$ (donc $\frac{1}{T} > 1$), une probabilité comme $0.5$ élevée à une puissance supérieure à 1 rétrécit, mais une probabilité plus petite comme $0.05$ rétrécit d'une quantité relative bien plus grande — élargissant l'*écart* entre mots probables et improbables. L'étape de renormalisation (diviser par la nouvelle somme) est ce qui transforme cet ensemble de nombres remodelé en une distribution de probabilité valide qui somme à 1, la même propriété « somme à 1 » de la semaine 2.

```python
def apply_temperature(probs, temperature):
    adjusted = {w: p ** (1 / temperature) for w, p in probs.items()}
    total = sum(adjusted.values())
    return {w: v / total for w, v in adjusted.items()}

def sample_next(word, probs_table, temperature=1.0):
    if word not in probs_table:
        return None
    probs = probs_table[word]
    if temperature != 1.0:
        probs = apply_temperature(probs, temperature)
    return random.choices(list(probs.keys()), weights=list(probs.values()), k=1)[0]
```

C'est exactement le même concept de « température » que vous verrez référencé dans les vraies API de grands modèles de langage — vous implémentez une version simplifiée d'un vrai bouton de contrôle, largement utilisé.

### Le chronométrer : ressentir le mur de vitesse

Voici l'exercice vers lequel tout ce parcours a construit. Chronométrez votre pipeline sur un corpus **plus grand** — disons, une version du corpus répétée 200 fois pour simuler plus de données (`corpus * 200`, en utilisant la multiplication de liste) — en utilisant le module intégré `time` de Python :

```python
import time

big_corpus = corpus * 200   # simulate a much larger dataset
start = time.time()
big_probs_table = build_bigram_probabilities(big_corpus)
elapsed = time.time() - start
print(f"Built bigram table for {len(big_corpus)} sentences in {elapsed:.3f} seconds")
```

Exécutez cela dans le bac à sable et notez votre chiffre réel. C'est probablement encore rapide à cette taille — mais observez ce qui se passe quand vous multipliez encore la taille du corpus (`* 1000`, `* 5000`) : l'approche à boucles imbriquées et dict-de-dicts de la semaine 3 fait un vrai travail pour *chaque occurrence de mot individuelle*, sans aucun raccourci. Il n'y a aucun moyen de « vectoriser » une simple boucle `for` Python de la façon dont peuvent le faire des bibliothèques numériques spécialisées.

### Ce que le chronométrage montre réellement

Chaque phrase supplémentaire du corpus ajoute une quantité de travail à peu près constante : la tokeniser, former ses bigrammes, mettre à jour une poignée d'entrées de dict. Doubler le nombre de phrases double à peu près le nombre d'occurrences de mots à traiter, ce qui double à peu près le temps d'exécution — une relation **linéaire** entre la taille des données d'entrée et le temps, informellement $O(n)$ où $n$ est le nombre total de mots. C'est en réalité un *bon* comportement d'échelle, pas un mauvais — le vrai problème n'est pas que cet algorithme passe mal à l'échelle en théorie, c'est que chaque étape individuelle (un accès dict, un appel de fonction, une itération de boucle) coûte plus cher en Python simple, interprété, que l'étape équivalente ne coûterait dans le code compilé et vectorisé sous-jacent à numpy/pandas. Chiffres illustratifs (les vôtres différeront selon la machine, mais la *forme* devrait se ressembler) :

| Répétitions du corpus | Phrases approx. | Temps approx. |
|---|---|---|
| 1× | 20 | quelques millisecondes |
| 200× | 4 000 | encore largement sous la seconde |
| 5 000× | 100 000 | maintenant clairement perceptible |

**Cet écart — entre ce que le Python simple peut faire confortablement et ce dont les problèmes de texte/données de taille réelle ont besoin — est exactement ce que la Section 2 existe pour combler.** Pandas et numpy ne font pas que raccourcir le code ; ils font tourner des opérations comme celle-ci des ordres de grandeur plus vite, en repoussant la boucle réelle vers du code optimisé et compilé plutôt que la propre boucle d'interprétation de Python.

## ⚠️ Erreurs courantes

- **Chronométrer quelque chose qui inclut des coûts d'initialisation ponctuels.** Si votre code de chronométrage inclut accidentellement le temps de lecture de fichier de `load_corpus` en plus du calcul réel de `build_bigram_probabilities`, vous mesurez deux choses différentes à la fois — ne chronométrez que l'étape spécifique qui vous intéresse.
- **Comparer des chronométrages sous des charges machine très différentes.** Faire tourner d'autres programmes lourds en même temps peut fausser une mesure de temps ; si un résultat semble surprenant, relancez-le quelques fois.
- **Supposer qu'une mise à l'échelle linéaire signifie « aucun problème, quelle que soit la taille ».** $O(n)$ est bon, mais un facteur constant suffisamment grand par opération finit tout de même par s'accumuler — tout l'intérêt de cette semaine est que le *facteur constant* par opération est ce que le Python simple perd face au code vectorisé, même avec la même mise à l'échelle globale.

## 🧩 Défis

<Challenge id="python101-hard-w5-c1" answer={<>Enveloppez l'appel <code>generate_text</code> du CLI dans une boucle lisant <code>input("Start word: ")</code>, et utilisez <code>input("Max words: ")</code> converti avec <code>int(...)</code> — le même motif saisie-puis-conversion de la semaine 1 du parcours normal de Python 101, alimentant maintenant un pipeline de génération au lieu d'un simple calcul.</>}>

Étendez le bloc `if __name__ == "__main__":` pour qu'il demande à l'utilisateur (via `input()`) un mot de départ et un nombre maximal de mots, au lieu de les coder en dur.

</Challenge>

<Challenge id="python101-hard-w5-c2" answer={<>Appelez <code>generate_text</code> (en utilisant le <code>sample_next</code> sensible à la température) trois fois chacune à <code>temperature=0.5</code> et <code>temperature=2.0</code> avec le même mot de départ, et comparez : les exécutions à basse température devraient sembler plus répétitives/prévisibles, celles à haute température plus erratiques.</>}>

Générez du texte à `temperature=0.5` et `temperature=2.0` avec le même mot de départ, plusieurs fois chacune. Décrivez la différence qualitative que vous observez.

</Challenge>

<Challenge id="python101-hard-w5-c3" answer={<>Chronométrez <code>build_bigram_probabilities</code> à quelques multiplicateurs de répétition de corpus différents (par ex. 1x, 50x, 200x, 1000x) et affichez le temps écoulé pour chacun — la croissance devrait sembler à peu près linéaire (ou pire) en nombre d'occurrences de mots, puisque chaque occurrence déclenche des opérations de dict.</>}>

Chronométrez `build_bigram_probabilities` à des tailles de corpus croissantes (`corpus * 1`, `* 50`, `* 200`, `* 1000`) et affichez un petit tableau taille contre temps écoulé. La croissance semble-t-elle linéaire, ou pire que linéaire ?

</Challenge>

<Challenge id="python101-hard-w5-c4" answer={<>À une température exactement de 1.0, <code>apply_temperature</code> élève chaque probabilité à la puissance <code>1/1 = 1</code>, c'est-à-dire les laisse inchangées, puis renormalise en divisant par leur somme (déjà égale à 1) -- c'est donc mathématiquement une opération sans effet, ce qui est exactement pourquoi <code>sample_next</code> traite <code>temperature != 1.0</code> comme cas particulier pour éviter entièrement ce calcul (redondant).</>}>

Pourquoi `sample_next` traite-t-elle `temperature != 1.0` comme cas particulier plutôt que d'appeler toujours `apply_temperature` ? Que calcule réellement `apply_temperature` quand `temperature == 1.0` ?

</Challenge>

<Challenge id="python101-hard-w5-c5" answer={<>Divisez le temps écoulé à 1000x par le temps écoulé à 50x, et séparément divisez 1000 par 50 (=20). Si l'algorithme est vraiment linéaire, le ratio de temps devrait aussi être à peu près proche de 20 -- confirmant que 20 fois plus de phrases prend environ 20 fois plus de temps, pas 400 fois (quadratique) ni à peine plus longtemps (constant).</>}>

En utilisant vos chronométrages du Défi 3, calculez le *ratio* du temps à `1000x` sur le temps à `50x`. Comparez ce ratio au ratio des tailles de corpus (`1000/50 = 20`). Le ratio de temps correspond-il à peu près, confirmant une mise à l'échelle linéaire ?

</Challenge>

<Challenge id="python101-hard-w5-c6" answer={<>Écrivez generate_batch(probs_table, start_word, temperatures, max_words=10) qui parcourt la liste temperatures, appelant generate_text (ou la version sensible à la température) une fois par valeur et rassemblant les résultats dans une liste, par ex. [generate_text(...) for t in temperatures] avec le paramètre temperature de sample_next enfilé au travers.</>}>

Écrivez une fonction `generate_batch(probs_table, start_word, temperatures, max_words=10)` qui génère une phrase par valeur de température dans une liste donnée (par ex. `[0.5, 1.0, 1.5, 2.0]`) et les retourne toutes ensemble, afin que vous puissiez comparer l'effet de la température côte à côte en un seul appel.

</Challenge>

## 🤔 Questions socratiques

- Vous venez de mesurer personnellement les performances du Python pur sur une tâche de traitement de texte. Pensez-vous que le ralentissement observé vient principalement de la boucle `for` de Python, des opérations sur les dicts, ou d'autre chose ? Que devriez-vous tester pour isoler la cause ?
- La température remodèle une distribution de probabilité mais ne change jamais *quels* résultats sont possibles (un mot de probabilité 0 reste à probabilité 0 quelle que soit la température). Pourquoi est-ce une propriété importante pour un « bouton d'aléatoire » ?
- La Section 2 commence par une démonstration montrant le même genre de tâche de comptage de mots s'exécutant nettement plus vite avec numpy/pandas que la version en Python pur que vous venez de construire. D'après ce que vous savez maintenant sur le fonctionnement réel de votre `build_bigram_probabilities` (boucles imbriquées, accès aux dicts), que prédisez-vous qu'une version vectorisée devrait faire différemment pour être plus rapide ?
- La mise à l'échelle de cette semaine était linéaire ($O(n)$) en nombre total de mots — pas le pire comportement d'échelle possible. Pouvez-vous imaginer une étape de tout ce pipeline de 5 semaines qui aurait pu être bien pire (par ex. quadratique) si elle avait été écrite d'une autre façon, plus naïve ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="python-101-hard-week-5"
  questions={[
    {
      id: 'q1',
      prompt: 'Une température inférieure à 1.0 (par ex. 0.5) rend le texte généré :',
      options: [
        'Plus aléatoire/chaotique',
        'Plus prévisible/répétitif, plus proche du glouton',
        'Exactement identique à la température 1.0',
        'Impossible à générer (lève une erreur)',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Que fait dict.setdefault(key, {}) si key est déjà présente ?',
      options: [
        'Écrase la valeur existante par {}',
        'Lève une KeyError',
        'Laisse la valeur existante inchangée',
        'Supprime la clé',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'L\'exercice de chronométrage de cette semaine sur un corpus plus grand vise à démontrer :',
      options: [
        'Que Python est toujours trop lent pour être utile',
        'Une motivation concrète et ressentie pour l\'existence d\'outils vectorisés comme numpy/pandas',
        'Que les modèles bigrammes sont plus rapides que les modèles unigrammes',
        'Comment corriger du code lent avec le multithreading',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'if __name__ == "__main__": est utilisé pour :',
      options: [
        'Déclarer la classe principale du programme',
        'Marquer du code qui ne doit s\'exécuter que lorsque le fichier est lancé directement',
        'Importer la bibliothèque standard',
        'Accélérer le script',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'Doubler à peu près la taille du corpus et voir le temps de construction doubler à peu près est un exemple de :',
      options: ['Mise à l\'échelle en temps constant', 'Mise à l\'échelle en temps linéaire', 'Mise à l\'échelle en temps quadratique', 'Aucune relation du tout'],
      correctOptionIndex: 1,
    },
  ]}
/>

## 🎁 Bonus : empaqueter le modèle en une classe

<BonusContent weekId="python-101-hard-week-5">

Chaque fonction écrite dans ce parcours prend un `probs_table` comme argument explicite, transmis de fonction en fonction. Une `class` vous permet de regrouper la table et les fonctions qui opèrent dessus en un seul objet :

```python
class BigramModel:
    def __init__(self, corpus_path):
        sentences = load_corpus(corpus_path)
        self.probs_table = build_bigram_probabilities(sentences)

    def generate(self, start_word, max_words=10, temperature=1.0):
        return generate_text(self.probs_table, start_word, max_words)

model = BigramModel("slm-corpus.csv")
model.generate("the")
```

Cela ne fait pas partie du programme principal — tout ce parcours était délibérément réalisable avec des fonctions et des dicts, pour garder l'attention sur les *idées* (comptage, probabilité conditionnelle, échantillonnage) plutôt que sur la conception orientée objet. Mais maintenant que vous avez ressenti où les simples fonctions deviennent lourdes à manier (passer `probs_table` dans chaque appel), vous êtes bien placé pour apprécier ce qu'une classe vous apporte. Essayez d'envelopper le pipeline complet de cette semaine dans une classe `BigramModel`, puis comparez : cela semble-t-il plus propre, ou juste différent ?

</BonusContent>

<ProgressCheckbox weekId="python-101-hard-week-5" />

---

**🎉 Vous avez terminé Python 101.** Vous avez construit un modèle de langage fonctionnel (bien que simple) en n'utilisant rien d'autre que la bibliothèque standard de Python — et vous avez personnellement mesuré où il commence à peiner. C'est exactement la porte que la Section 2, **Pandas et analyse de données**, ouvre ensuite.
