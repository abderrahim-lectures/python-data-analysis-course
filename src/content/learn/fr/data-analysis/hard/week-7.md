---
title: "Semaine 7 : Analyse univariée et visualisation"
section: data-analysis
track: hard
week: 7
description: "Réalisez une analyse univariée et construisez des visualisations matplotlib/seaborn de variables individuelles."
---


# Semaine 7 : Analyse univariée et visualisation

<span class="gamified-flourish">📈 « Univariée » sonne intimidant. Cela signifie simplement : regarder une variable à la fois, correctement, avant de la comparer à quoi que ce soit d'autre.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Visualiser la distribution d'une colonne numérique avec un histogramme, et celle d'une colonne catégorielle avec un diagramme à barres.
- Lire une boîte à moustaches comme un résumé compact des quartiles et des valeurs aberrantes d'une distribution.
- Choisir le bon type de graphique pour le type d'une variable, et étiqueter les graphiques pour qu'ils soient lisibles par eux-mêmes.
- Expliquer pourquoi le nombre de classes d'un histogramme est lui-même un choix significatif, pas une valeur par défaut arbitraire.

## Leçon

### Pourquoi visualiser, pas seulement résumer avec des nombres ?

`mean`/`median`/`std` de la semaine 6 décrivent une distribution avec trois nombres — mais des distributions très différentes peuvent partager la même moyenne et le même écart-type. Un graphique montre la *forme* : est-elle symétrique, asymétrique, bimodale (deux bosses), pleine de valeurs aberrantes ? C'est la raison centrale pour laquelle la visualisation univariée précède tout ce qui est plus avancé.

### Histogrammes : distribution d'une variable numérique

Un histogramme classe les valeurs d'une colonne numérique en tranches et montre combien tombent dans chaque tranche — une visualisation directe de la distribution de fréquence, la version tracée des nombres `mean`/`median`/`std` de la semaine dernière :

```python
import matplotlib.pyplot as plt

df["math_score"].hist(bins=20, edgecolor="black")
plt.xlabel("Math score")
plt.ylabel("Number of students")
plt.title("Distribution of math scores")
plt.show()
```

Étiquetez toujours vos axes et donnez un titre à votre graphique — un graphique qui n'a de sens qu'avec le code qui l'a produit juste à côté n'est pas terminé.

#### Le nombre de classes est un vrai choix, pas une valeur par défaut à ignorer

Trop peu de classes cache une structure réelle (tout se fond en un ou deux amas) ; trop de classes montre le bruit comme s'il s'agissait d'une structure significative (chaque classe a trop peu de points pour dire quoi que ce soit de fiable). Il n'existe pas un seul nombre universellement correct — essayez quelques valeurs et voyez laquelle raconte l'histoire la plus claire et la plus honnête :

```python
fig, axes = plt.subplots(1, 3, figsize=(12, 4))
for ax, n_bins in zip(axes, [5, 20, 50]):
    df["math_score"].hist(bins=n_bins, ax=ax, edgecolor="black")
    ax.set_title(f"{n_bins} bins")
plt.tight_layout()
plt.show()
```

`plt.subplots(1, 3, figsize=(12, 4))` crée une seule figure avec 3 panneaux côte à côte (`axes` devient alors une liste de 3 zones de tracé individuelles) — un motif utile chaque fois que vous voulez comparer quelques variations d'un même graphique à la fois, que vous réutiliserez à la semaine 9.

### Boîtes à moustaches : quartiles et valeurs aberrantes en un coup d'œil

Une boîte à moustaches dessine le 25e centile, la médiane, et le 75e centile comme une boîte, avec des « moustaches » s'étendant jusqu'à l'intervalle typique et des points individuels au-delà marqués comme valeurs aberrantes potentielles — une visualisation compacte d'exactement les nombres de quartiles que `.describe()` vous donnait déjà, et exactement la même règle $1.5 \times \text{IQR}$ de la semaine dernière, dessinée visuellement :

```python
df.boxplot(column="math_score")
plt.ylabel("Math score")
plt.title("Math score spread")
plt.show()
```

Les boîtes à moustaches deviennent particulièrement utiles une fois que vous comparez les distributions de *plusieurs* groupes côte à côte — exactement le sujet bivarié de la semaine prochaine.

### Diagrammes à barres : distribution d'une variable catégorielle

Pour une colonne catégorielle, `.value_counts()` (semaine 6) tracé directement comme diagramme à barres montre quelles catégories sont courantes ou rares :

```python
df["parental_level_of_education"].value_counts().plot(kind="bar")
plt.xlabel("Parental level of education")
plt.ylabel("Number of students")
plt.title("Parental education levels in the dataset")
plt.xticks(rotation=45, ha="right")
plt.tight_layout()
plt.show()
```

`plt.xticks(rotation=45, ha="right")` fait pivoter les longues étiquettes de catégorie pour qu'elles ne se chevauchent pas — une petite correction courante pour la lisibilité une fois que les étiquettes dépassent quelques caractères. `plt.tight_layout()` empêche les étiquettes pivotées/longues d'être coupées au bord de la figure.

### Choisir le bon graphique

| Type de variable | Graphique |
|---|---|
| Numérique, on veut la forme de distribution | Histogramme |
| Numérique, on veut quartiles/valeurs aberrantes, surtout entre groupes | Boîte à moustaches |
| Catégorielle, on veut la fréquence de chaque catégorie | Diagramme à barres |

Un diagramme à barres d'une colonne numérique (traitant chaque score unique comme sa propre « catégorie ») ou un histogramme d'une colonne catégorielle sont généralement tous deux de mauvais choix — faire correspondre le graphique au type réel de la variable est la première décision de conception, avant tout style.

## ⚠️ Erreurs courantes

- **Oublier les étiquettes d'axes et un titre.** Un graphique qui exige que le lecteur sache déjà ce qu'il montre n'est pas terminé — étiquetez toujours les deux axes et ajoutez un titre, même pour un graphique « juste pour explorer » que vous supprimerez plus tard.
- **Choisir un nombre de classes et ne jamais le remettre en question.** Comme montré ci-dessus, les mêmes données peuvent raconter des histoires visuelles notablement différentes à 5 contre 20 contre 50 classes — vérifiez toujours avec au moins deux nombres de classes avant de faire confiance à ce que la forme d'un histogramme semble dire.
- **Utiliser le mauvais graphique pour le type de variable.** Un histogramme d'une colonne catégorielle (comme `gender`) ou un diagramme à barres de valeurs numériques brutes non agrégées sont tous deux des signes que le tableau de choix de graphique ci-dessus n'a pas été consulté d'abord.
- **Oublier `plt.show()` (ou une expression finale nue) pour réellement afficher le graphique**, surtout en enchaînant plusieurs appels de tracé — selon votre environnement, un graphique construit sur plusieurs lignes pourrait ne pas s'afficher tant qu'il n'est pas explicitement montré.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Tracez un histogramme de `reading_score` avec des axes étiquetés et un titre.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df["reading_score"].hist(bins=20, edgecolor="black")</code> avec des étiquettes d'axes et un titre — un histogramme direct de la colonne numérique.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Créez une boîte à moustaches de `writing_score`. En la regardant, la distribution semble-t-elle symétrique, ou la médiane est-elle notablement plus proche d'un bord de la boîte ?

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.boxplot(column="writing_score")</code> — lisez les trois lignes de la boîte comme le 25e centile, la médiane, et le 75e centile, et tout point au-delà des moustaches comme une valeur aberrante potentielle.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Tracez un diagramme à barres des comptages de catégories de la colonne `test_preparation_course`, avec des axes étiquetés.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df["test_preparation_course"].value_counts().plot(kind="bar")</code> avec étiquettes d'axes/titre — puisque cette colonne n'a que deux catégories, la rotation n'est généralement pas nécessaire.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Quelqu'un trace `df["gender"].hist()`. Expliquez pourquoi c'est le mauvais choix de graphique, et ce qu'il devrait utiliser à la place.

<p class="challenge__answer">💡 <strong>Answer:</strong> Un histogramme de <code>gender</code> a peu de sens : c'est catégoriel (seulement "male"/"female"), donc le classer numériquement en tranches n'a pas de signification — le bon graphique est un diagramme à barres de <code>.value_counts()</code>, exactement comme <code>test_preparation_course</code> ci-dessus.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Tracez `writing_score` comme histogramme avec 5 classes, puis à nouveau avec 50 classes. Décrivez comment la forme apparente de la distribution change entre les deux.

<p class="challenge__answer">💡 <strong>Answer:</strong> Tracez writing_score avec un petit nombre de classes (par ex. 5) et un grand (par ex. 50), en les comparant côte à côte en utilisant le motif de subplots de la leçon. La version à 5 classes semble probablement plus lisse/plus générale ; la version à 50 classes peut sembler plus bruitée/en dents de scie, surtout dans les régions avec moins d'étudiants.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Créez une seule boîte à moustaches montrant les trois colonnes de score (`math_score`, `reading_score`, `writing_score`) côte à côte, afin que leurs étalements puissent être comparés en un coup d'œil.

<p class="challenge__answer">💡 <strong>Answer:</strong> Construisez une boîte à moustaches pour chacune des trois colonnes de score en utilisant df.boxplot(column=["math_score", "reading_score", "writing_score"]), qui dessine les trois côte à côte en un seul appel pour une comparaison visuelle directe.</p>

</div>
</details>

## 🤔 Questions socratiques

- Deux distributions peuvent avoir une moyenne et un écart-type identiques mais des formes très différentes (par ex. l'une symétrique, l'autre avec deux bosses séparées). Pourquoi un histogramme capture-t-il cette différence alors que `mean`/`std` seuls ne le peuvent pas ?
- Une boîte à moustaches marque les points au-delà des moustaches comme des « valeurs aberrantes » potentielles. Cela signifie-t-il automatiquement que ces points de données sont des erreurs à supprimer ? Qu'est-ce qui d'autre pourrait expliquer une valeur légitimement inhabituelle mais correcte ?
- Pourquoi `plt.xticks(rotation=45, ha="right")` compte-t-il davantage pour `parental_level_of_education` (noms de catégories longs) que pour `gender` (courts) ? Quelle règle générale sur la longueur des étiquettes et la lisibilité des graphiques cela suggère-t-il ?
- Si un collègue ne vous montrait qu'un histogramme à 50 classes d'une variable et affirmait voir « trois groupes distincts », que voudriez-vous vérifier avant de faire confiance à cette affirmation, étant donné ce que vous savez maintenant sur la sensibilité au nombre de classes ?

## ✅ Quiz de la semaine

<div class="quiz" data-quiz="data-analysis-hard-week-7">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. Un histogramme est le bon choix de graphique pour :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Les comptages de catégories d'une colonne catégorielle</button>
        <button class="quiz-q__opt" data-idx="1">La forme de distribution d'une colonne numérique</button>
        <button class="quiz-q__opt" data-idx="2">Comparer deux DataFrames</button>
        <button class="quiz-q__opt" data-idx="3">Montrer les comptages de valeurs manquantes</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">2. La boîte d'une boîte à moustaches représente :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Le minimum et le maximum seulement</button>
        <button class="quiz-q__opt" data-idx="1">Le 25e centile, la médiane, et le 75e centile</button>
        <button class="quiz-q__opt" data-idx="2">La moyenne et l'écart-type</button>
        <button class="quiz-q__opt" data-idx="3">Chaque point de donnée individuel</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">3. Pourquoi deux distributions avec la même moyenne et le même écart-type ont-elles quand même besoin d'un graphique pour être comparées correctement ?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Elles ne peuvent en fait pas avoir la même moyenne et le même écart-type</button>
        <button class="quiz-q__opt" data-idx="1">Les graphiques sont toujours plus précis que les nombres</button>
        <button class="quiz-q__opt" data-idx="2">La même moyenne/écart-type peut provenir de distributions de formes très différentes</button>
        <button class="quiz-q__opt" data-idx="3">pandas requiert un graphique avant de calculer des statistiques</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">4. Le bon graphique pour value_counts() d'une colonne catégorielle est :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Un histogramme</button>
        <button class="quiz-q__opt" data-idx="1">Une boîte à moustaches</button>
        <button class="quiz-q__opt" data-idx="2">Un diagramme à barres</button>
        <button class="quiz-q__opt" data-idx="3">Un nuage de points</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. Pourquoi vérifier un histogramme à plus d'un nombre de classes ?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Ce n'est pas nécessaire, un seul nombre de classes suffit toujours</button>
        <button class="quiz-q__opt" data-idx="1">Trop peu de classes peut cacher une structure, trop en montrer le bruit comme si c'était une structure</button>
        <button class="quiz-q__opt" data-idx="2">matplotlib requiert au moins deux nombres de classes différents pour s'afficher</button>
        <button class="quiz-q__opt" data-idx="3">Cela ne compte que pour les colonnes catégorielles</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

