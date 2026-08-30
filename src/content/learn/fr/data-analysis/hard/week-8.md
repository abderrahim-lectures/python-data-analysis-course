---
title: "Semaine 8 : Analyse bivariée et multivariée"
section: data-analysis
track: hard
week: 8
description: "Analysez les relations entre variables avec la corrélation, les nuages de points et les boîtes à moustaches groupées."
---


# Semaine 8 : Analyse bivariée et multivariée, corrélation

<span class="gamified-flourish">🔗 La semaine dernière : une variable à la fois. Cette semaine : comment deux (ou plus) variables évoluent-elles ensemble ?</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Calculer et interpréter un **coefficient de corrélation** entre deux variables numériques.
- Visualiser une relation entre deux variables numériques avec un nuage de points, et entre une variable numérique et catégorielle avec des boîtes à moustaches groupées.
- Utiliser une troisième variable (couleur, ou une seconde colonne catégorielle) pour ajouter une dimension à un graphique à deux variables.
- Comparer deux variables catégorielles avec un tableau croisé.
- Expliquer, précisément, pourquoi corrélation n'implique pas causalité.

## Leçon

### Corrélation : comment deux variables numériques évoluent-elles ensemble ?

Le **coefficient de corrélation de Pearson** $r$ mesure la force et la direction d'une relation *linéaire* entre deux variables numériques, allant de $-1$ (négative parfaite) en passant par $0$ (aucune relation linéaire) jusqu'à $+1$ (positive parfaite) :

```python
df["math_score"].corr(df["reading_score"])   # a single number between -1 and 1
```

Une règle empirique approximative (pas universellement admise, mais couramment utilisée) pour interpréter $|r|$ :

| $|r|$ | Interprétation approximative |
|---|---|
| 0.0 – 0.2 | Très faible / négligeable |
| 0.2 – 0.4 | Faible |
| 0.4 – 0.6 | Modérée |
| 0.6 – 0.8 | Forte |
| 0.8 – 1.0 | Très forte |

Traitez ceci comme une intuition de départ, pas un seuil rigide — ce qui compte comme « fort » peut dépendre fortement du domaine et de la question spécifique posée.

Pour tout l'ensemble des colonnes numériques à la fois, `.corr()` sur le DataFrame produit une matrice de corrélation complète — la valeur $r$ de chaque paire, y compris chaque variable trivialement corrélée à $1.0$ avec elle-même :

```python
df[["math_score", "reading_score", "writing_score"]].corr()
```

Une carte de chaleur (heatmap) visualise cette matrice en un coup d'œil, en utilisant l'intensité des couleurs pour la force de corrélation :

```python
import seaborn as sns
import matplotlib.pyplot as plt

corr_matrix = df[["math_score", "reading_score", "writing_score"]].corr()
sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", vmin=-1, vmax=1)
plt.title("Correlation between score types")
plt.show()
```

`annot=True` affiche les valeurs $r$ réelles sur chaque cellule ; `vmin=-1, vmax=1` fixe l'échelle de couleur à l'intervalle réel du coefficient, afin que l'intensité de couleur soit comparable entre différentes cartes de chaleur plutôt que remise à l'échelle selon l'intervalle qui apparaît par hasard dans cette matrice particulière.

### Nuages de points : visualiser une relation numérique-numérique

Un nuage de points montre la relation brute qu'un coefficient de corrélation ne fait que résumer par un nombre :

```python
plt.scatter(df["reading_score"], df["writing_score"], alpha=0.5)
plt.xlabel("Reading score")
plt.ylabel("Writing score")
plt.title("Reading vs. writing scores")
plt.show()
```

`alpha=0.5` rend les points semi-transparents, de sorte que les points qui se chevauchent (courant avec des scores entiers se répétant chez de nombreux étudiants) apparaissent comme des régions plus sombres au lieu de se cacher complètement les uns les autres.

### Ajouter une troisième variable avec la couleur

Un nuage de points ne montre directement que deux variables, mais le paramètre `hue` de `seaborn` colore chaque point selon une troisième colonne (généralement catégorielle), vous permettant de vérifier si une relation se maintient de la même façon à travers les groupes :

```python
sns.scatterplot(data=df, x="reading_score", y="writing_score", hue="gender", alpha=0.6)
plt.title("Reading vs. writing scores, by gender")
plt.show()
```

Si les deux nuages de points colorés semblent suivre la même tendance générale, la relation lecture/écriture ne dépend probablement pas beaucoup du genre ; si le nuage d'une couleur est clairement décalé ou formé différemment, cela mérite d'être investigué davantage — exactement le genre de question que les graphiques à facettes de la semaine 9 sont conçus pour approfondir.

### Boîtes à moustaches groupées : variable numérique à travers des catégories

Pour comparer la *distribution* d'une variable numérique à travers des catégories (pas seulement sa moyenne), utilisez la boîte à moustaches groupée de `seaborn` — l'extension multi-groupe de la boîte à moustaches unique de la semaine dernière :

```python
sns.boxplot(data=df, x="test_preparation_course", y="math_score")
plt.title("Math score by test preparation status")
plt.show()
```

Cela montre plus qu'une simple moyenne par groupby : si l'*étalement* diffère aussi entre les groupes, et si les valeurs aberrantes se regroupent davantage dans un groupe que dans un autre.

### Comparer deux variables catégorielles : tableau croisé

`.corr()` ne fonctionne que sur des colonnes numériques — pour deux variables *catégorielles*, `pd.crosstab` construit une table de la fréquence de chaque combinaison, l'analogue catégoriel d'une vérification de corrélation :

```python
pd.crosstab(df["gender"], df["test_preparation_course"])
pd.crosstab(df["gender"], df["test_preparation_course"], normalize="index")   # row proportions instead of counts
```

`normalize="index"` transforme chaque ligne en proportions qui somment à 1 — utile pour demander « au sein de chaque genre, quelle fraction a terminé la préparation au test ? » plutôt que de simples comptages bruts, qui peuvent être trompeurs si les tailles de groupe elles-mêmes diffèrent.

### Corrélation n'est pas causalité

Un $r$ proche de $1$ ou $-1$ vous dit que deux variables évoluent ensemble — cela ne dit rien sur si l'une *cause* l'autre, ou si les deux sont motivées par un troisième facteur. Un exemple classique de manuel : les ventes de glaces et les incidents de noyade sont fortement corrélés sur une année, mais la glace ne cause pas les noyades — les deux augmentent en été, motivées par un troisième facteur (temps chaud, plus de baignade). Chaque fois que vous trouvez une forte corrélation dans ce jeu de données, demandez-vous explicitement : existe-t-il un troisième facteur plausible qui pourrait expliquer que les deux variables évoluent ensemble ?

## ⚠️ Erreurs courantes

- **Traiter un $r$ élevé comme une preuve de causalité.** Cela mérite d'être répété aussi souvent que cela survient — la corrélation est une description d'association, jamais une preuve d'un mécanisme causal en soi.
- **Ignorer les différences de taille de groupe en lisant un tableau croisé.** Les comptages bruts de `pd.crosstab` peuvent sembler spectaculaires purement parce qu'un groupe est bien plus grand — `normalize="index"` (ou `"columns"`) corrige pour cela.
- **Ajouter trop de catégories `hue` à un seul nuage de points.** Plus de 4-5 couleurs sur un seul graphique devient généralement plus difficile à lire, pas plus facile — envisagez plutôt le facettage (panneaux séparés) de la semaine 9 une fois qu'un seul graphique codé par couleur devient surchargé.
- **Calculer `.corr()` sur un DataFrame qui inclut des colonnes non numériques sans sélectionner d'abord.** Les versions récentes de pandas gèrent cela en supprimant silencieusement les colonnes non numériques, mais il est plus clair (et plus sûr à travers les versions) de sélectionner explicitement seulement les colonnes numériques que vous voulez réellement, comme montré ci-dessus.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Calculez le coefficient de corrélation entre `math_score` et `writing_score`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df["math_score"].corr(df["writing_score"])</code> — un seul coefficient de corrélation de Pearson entre les deux colonnes.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Construisez la matrice de corrélation 3x3 complète pour les trois colonnes de score et visualisez-la comme une carte de chaleur avec les valeurs réelles annotées sur chaque cellule.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df[["math_score","reading_score","writing_score"]].corr()</code> puis <code>sns.heatmap(..., annot=True)</code> — la matrice par paire visualisée avec couleur et nombres imprimés ensemble.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Créez une boîte à moustaches groupée comparant les distributions de `math_score` à travers les deux catégories de `lunch`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>sns.boxplot(data=df, x="lunch", y="math_score")</code> — une boîte à moustaches groupée comparant la distribution de math_score entre les deux catégories de lunch côte à côte.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Si le type de `lunch` et `math_score` montrent une différence notable dans votre boîte à moustaches du défi précédent, proposez un *troisième facteur* plausible qui pourrait expliquer les deux sans que le type de `lunch` cause directement des différences de scores.

<p class="challenge__answer">💡 <strong>Answer:</strong> Un troisième facteur plausible est le statut socio-économique : il pourrait affecter indépendamment à la fois le type de <code>lunch</code> (les programmes de repas gratuits/réduits sont liés au revenu du foyer) et la préparation/les ressources académiques (affectant les scores) — donc le type de lunch et les scores pourraient être corrélés sans que le lunch lui-même cause les différences de scores.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Créez un nuage de points de `math_score` contre `reading_score`, coloré (`hue`) par `test_preparation_course`. La relation semble-t-elle similaire pour les deux groupes, ou les points d'un groupe semblent-ils décalés ?

<p class="challenge__answer">💡 <strong>Answer:</strong> sns.scatterplot(data=df, x="math_score", y="reading_score", hue="test_preparation_course", alpha=0.6) -- colore chaque point selon le statut de préparation au test, vous permettant de comparer visuellement si la relation math/lecture semble similaire pour les deux groupes.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

En utilisant `pd.crosstab` avec `normalize="index"`, vérifiez si le type de `lunch` et l'achèvement de `test_preparation_course` semblent liés l'un à l'autre.

<p class="challenge__answer">💡 <strong>Answer:</strong> pd.crosstab(df["lunch"], df["test_preparation_course"], normalize="index") montre, au sein de chaque catégorie de lunch, quelle fraction a terminé contre n'a pas terminé la préparation au test -- vous permettant de vérifier si les deux variables catégorielles semblent liées sans avoir besoin d'une corrélation numérique.</p>

</div>
</details>

## 🤔 Questions socratiques

- Les trois colonnes de score (`math`, `reading`, `writing`) sont très susceptibles d'être fortement corrélées entre elles. Quelle est une explication plausible pour cela — est-il plus probable que chaque matière améliore véritablement les autres, ou que les deux soient motivées par un facteur sous-jacent partagé (par ex. préparation académique générale, habitudes d'étude) ? Comment commenceriez-vous même à distinguer cela ?
- Un coefficient de corrélation proche de 0 signifie l'absence de relation *linéaire*. Deux variables pourraient-elles quand même avoir une relation forte, réelle, non linéaire (par ex. une forme en U) et quand même montrer $r \approx 0$ ? À quoi cela ressemblerait-il sur un nuage de points qu'un seul nombre manquerait complètement ?
- Pourquoi la carte de chaleur fixe-t-elle explicitement `vmin=-1, vmax=1`, plutôt que de laisser l'échelle de couleur s'ajuster automatiquement à l'intervalle de valeurs qui apparaît par hasard dans cette matrice particulière ? Qu'irait-il de travers en comparant deux cartes de chaleur différentes si leurs échelles de couleur n'étaient pas fixées de la même façon ?
- `pd.crosstab(..., normalize="index")` et `normalize="columns"` donnent des tables d'apparence différente à partir des mêmes données brutes. Quelle est la différence dans la *question* à laquelle chacune répond ?
- Ajouter `hue` à un nuage de points est une façon d'introduire une troisième variable. Que perdriez-vous, comparé au facettage de la semaine 9 (panneaux séparés côte à côte), si vous essayiez de coder par couleur une quatrième *et* cinquième variable sur le même graphique unique ?

## ✅ Quiz de la semaine

<div class="quiz" data-quiz="data-analysis-hard-week-8">
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">1. Un coefficient de corrélation de Pearson de -0.9 indique :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Aucune relation du tout</button>
        <button class="quiz-q__opt" data-idx="1">Une forte relation positive</button>
        <button class="quiz-q__opt" data-idx="2">Une forte relation négative</button>
        <button class="quiz-q__opt" data-idx="3">Qu'une variable cause l'autre</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">2. L'exemple des ventes de glaces / incidents de noyade illustre :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Une relation causale parfaite</button>
        <button class="quiz-q__opt" data-idx="1">Une corrélation sans causalité, les deux motivées par un troisième facteur (la météo)</button>
        <button class="quiz-q__opt" data-idx="2">Une corrélation négative</button>
        <button class="quiz-q__opt" data-idx="3">Une erreur de lecture de graphique, pas un concept statistique</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. Une boîte à moustaches groupée (variable numérique divisée par catégorie) montre plus qu'une moyenne par groupby car elle révèle aussi :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Seulement la taille exacte de l'échantillon</button>
        <button class="quiz-q__opt" data-idx="1">L'étalement/les valeurs aberrantes au sein de chaque groupe, pas seulement la moyenne</button>
        <button class="quiz-q__opt" data-idx="2">La causalité entre les variables</button>
        <button class="quiz-q__opt" data-idx="3">Elle montre exactement la même information qu'un diagramme à barres des moyennes</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">4. Que fait alpha=0.5 dans un nuage de points matplotlib ?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Change la forme du marqueur</button>
        <button class="quiz-q__opt" data-idx="1">Rend les points semi-transparents afin que les points qui se chevauchent soient visibles</button>
        <button class="quiz-q__opt" data-idx="2">Filtre la moitié des points de données</button>
        <button class="quiz-q__opt" data-idx="3">Définit le seuil de corrélation</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. pd.crosstab est le bon outil pour comparer :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Deux colonnes numériques, via un coefficient de corrélation</button>
        <button class="quiz-q__opt" data-idx="1">Deux colonnes catégorielles, via les comptages de chaque combinaison</button>
        <button class="quiz-q__opt" data-idx="2">La distribution d'une seule colonne numérique</button>
        <button class="quiz-q__opt" data-idx="3">L'ordre des lignes dans un DataFrame</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

