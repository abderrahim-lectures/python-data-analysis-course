---
title: "Semaine 9 : Visualisations avancées et narratives"
section: data-analysis
track: hard
week: 9
description: "Construisez des visualisations avancées et narratives : graphiques à facettes, ordonnancement délibéré et palettes adaptées au daltonisme."
---


# Semaine 9 : Visualisations avancées et narratives

<span class="gamified-flourish">🎨 Un graphique correct et un graphique *convaincant* ne sont pas automatiquement la même chose. Cette semaine porte sur la différence.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Construire des visualisations à facettes/multi-panneaux montrant une relation décomposée par une troisième variable catégorielle.
- Utiliser la couleur, l'ordre, et l'annotation délibérément pour rendre le point d'un graphique clair en un coup d'œil.
- Choisir une palette de couleurs adaptée aux daltoniens et intentionnelle plutôt que la première par défaut.
- Critiquer un graphique pour ce qu'il montre honnêtement et ce qu'il ne montre pas.
- Enregistrer un graphique terminé dans un fichier pour l'inclure dans un rapport.

## Leçon

### Le facettage : ajouter une troisième dimension avec des panneaux

Un nuage de points montre deux variables numériques ; les outils de facettage de `seaborn` ajoutent une troisième dimension — généralement catégorielle — en divisant en une grille de petits panneaux comparables plutôt que d'entasser tout dans un seul graphique :

```python
import seaborn as sns
import matplotlib.pyplot as plt

sns.relplot(
    data=df,
    x="reading_score",
    y="writing_score",
    col="test_preparation_course",   # one panel per category, side by side
    hue="gender",                     # color within each panel
)
plt.show()
```

Cela répond à une question véritablement multivariée en une seule figure : la relation lecture/écriture semble-t-elle différente pour les étudiants ayant terminé la préparation au test par rapport à ceux qui ne l'ont pas fait, *et* cela diffère-t-il selon le genre — tout à la fois, comparable côte à côte car chaque panneau partage les mêmes échelles d'axe. Ajouter `row=` à côté de `col=` étend cela en une grille complète — une dimension à travers les colonnes, une autre à travers les lignes :

```python
sns.relplot(
    data=df, x="reading_score", y="writing_score",
    col="test_preparation_course", row="lunch", hue="gender",
)
```

C'est maintenant une figure véritablement à 4 variables (lecture, écriture, préparation au test, lunch, genre — cinq, en fait) — impressionnant, mais qui mérite d'être pesé contre le piège « trop de dimensions sur un seul graphique » ci-dessous.

### Ordonner les catégories délibérément

Par défaut, les axes catégoriels sont souvent ordonnés alphabétiquement ou par ordre de première apparition — rarement l'ordre le plus lisible. Ordonner explicitement par une valeur significative (comme la moyenne du groupe) rend le motif d'un diagramme à barres immédiatement lisible au lieu d'exiger que le lecteur le cherche :

```python
order = df.groupby("parental_level_of_education")["math_score"].mean().sort_values().index

sns.barplot(data=df, x="parental_level_of_education", y="math_score", order=order)
plt.xticks(rotation=45, ha="right")
plt.title("Average math score by parental education level (ordered)")
plt.tight_layout()
plt.show()
```

`sns.barplot` (contrairement à un simple diagramme à barres matplotlib) calcule automatiquement la moyenne par catégorie et ajoute des barres d'erreur représentant l'incertitude — utile à savoir pour ne pas le confondre avec des comptages bruts.

### Choisir une palette intentionnelle, adaptée aux daltoniens

La palette par défaut de seaborn est un point de départ raisonnable, mais des choix de couleur intentionnels communiquent davantage : utilisez une palette **séquentielle** (clair à foncé) pour une variable numérique ordonnée, une palette **divergente** (deux couleurs se rejoignant en un point médian neutre) pour des valeurs qui vont de façon significative au-dessus et en dessous d'un certain centre (comme le `"coolwarm"` de la carte de chaleur de corrélation à la semaine 8), et une palette **qualitative** pour des catégories non ordonnées. La palette `"colorblind"` de seaborn est un défaut sûr et intentionnel chaque fois que la couleur doit distinguer des catégories de façon fiable pour chaque lecteur :

```python
sns.barplot(data=df, x="parental_level_of_education", y="math_score", order=order, palette="colorblind")
```

Environ 1 homme sur 12 a une forme de déficience de la vision des couleurs — utiliser par défaut une palette sûre pour les daltoniens ne coûte rien et n'exclut personne, c'est pourquoi c'est un défaut raisonnable plutôt qu'un choix pour cas particulier.

### Annoter le point directement

Un graphique avec une affirmation spécifique (« les étudiants ayant terminé la préparation au test ont obtenu, en moyenne, N points de plus ») est plus convaincant quand ce nombre est visible sur le graphique lui-même, plutôt que laissé au lecteur à calculer à partir des positions des axes :

```python
means = df.groupby("test_preparation_course")["math_score"].mean()
ax = means.plot(kind="bar")
for i, value in enumerate(means):
    ax.text(i, value + 1, f"{value:.1f}", ha="center")
plt.ylabel("Average math score")
plt.title("Average math score by test preparation status")
plt.show()
```

### Enregistrer un graphique pour votre rapport

Une fois qu'un graphique est terminé, `plt.savefig` l'écrit dans un fichier image — utile pour l'inclure dans un rapport écrit plutôt que de seulement le visualiser en ligne :

```python
plt.savefig("math_score_by_prep.png", dpi=150, bbox_inches="tight")
```

`dpi=150` contrôle la résolution de l'image (plus élevé = plus net, mais un fichier plus grand) ; `bbox_inches="tight"` supprime l'espace blanc excédentaire autour de la figure. Appelez `plt.savefig(...)` *avant* `plt.show()` dans la même cellule — certains environnements effacent la figure courante une fois qu'elle a été affichée.

### Des graphiques honnêtes : ce qu'il faut surveiller

Quelques façons courantes dont les graphiques induisent en erreur, même sans aucun chiffre fabriqué :
- **Axe des y tronqué** : démarrer l'axe des y d'un diagramme à barres au-dessus de 0 exagère visuellement de petites différences. Les diagrammes à barres devraient presque toujours commencer à 0 ; les graphiques en ligne/nuages de points comparant un *changement* sont une exception plus défendable.
- **Intervalle d'axe sélectionné avec parti pris** : zoomer sur un intervalle x étroit peut faire ressembler du bruit à une tendance significative.
- **Échelles de couleur non étiquetées ou trompeuses** : l'échelle de couleur d'une carte de chaleur devrait être étiquetée et, selon la semaine 8, fixée à un intervalle cohérent pour une comparabilité véritable.
- **Surtraçage (overplotting)** : trop de points qui se chevauchent (corrigé avec `alpha`, selon la semaine 8, ou l'agrégation) peuvent visuellement cacher la densité réelle d'une relation.

Un graphique narratif gagne la confiance en rendant son honnêteté facile à vérifier, pas seulement en ayant l'air soigné.

## ⚠️ Erreurs courantes

- **Empiler trop de dimensions sur un seul graphique.** `row=`/`col=`/`hue=` ensemble peuvent techniquement montrer 4-5 variables à la fois, mais un graphique qui nécessite un paragraphe d'explication pour être décodé a généralement dépassé le point d'être véritablement plus informatif que deux graphiques plus simples.
- **Choisir une palette pour l'esthétique plutôt que pour le sens.** Une palette arc-en-ciel sur une variable ordonnée (comme des scores d'examen divisés en 5 intervalles) rend l'*ordre* plus difficile à percevoir qu'une bonne palette séquentielle ne le ferait.
- **Oublier que `plt.savefig()` doit venir avant `plt.show()`.** Les appeler dans le mauvais ordre peut enregistrer une image vide dans certains environnements.
- **Confondre les barres d'erreur de `sns.barplot` avec autre chose.** Elles représentent l'incertitude dans la moyenne estimée (par défaut, un intervalle de confiance bootstrap) — pas l'étalement brut des données, ce qu'une boîte à moustaches (semaine 7/8) montre à la place.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Créez un nuage de points à facettes de `math_score` contre `reading_score`, avec un panneau par catégorie de `lunch`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>sns.relplot(data=df, x="math_score", y="reading_score", col="lunch")</code> — un panneau de nuage de points par catégorie de lunch, partageant les échelles d'axe pour une comparaison directe.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Construisez un diagramme à barres de `writing_score` moyen par `race_ethnicity`, avec les barres explicitement ordonnées de la moyenne la plus basse à la plus élevée.

<p class="challenge__answer">💡 <strong>Answer:</strong> Calculez <code>order = df.groupby("race_ethnicity")["writing_score"].mean().sort_values().index</code> puis passez <code>order=order</code> à <code>sns.barplot</code> — cela trie les barres de la moyenne la plus basse à la plus élevée au lieu d'un ordre par défaut arbitraire.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Prenez l'un de vos diagrammes à barres de cette semaine et définissez délibérément `plt.ylim(bottom=some_value_above_0)`. Comparez les deux versions côte à côte — comment la version tronquée induit-elle visuellement en erreur sur la taille de la différence ?

<p class="challenge__answer">💡 <strong>Answer:</strong> Un axe des y qui ne commence pas à 0 sur un diagramme à barres exagère la taille visuelle des différences entre les barres — deux barres qui diffèrent seulement de quelques points peuvent sembler dramatiquement différentes en hauteur si l'axe est tronqué près de leurs valeurs.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Prenez un diagramme à barres de moyennes de groupe et annotez chaque barre avec sa valeur numérique directement au-dessus, comme montré dans la leçon.

<p class="challenge__answer">💡 <strong>Answer:</strong> Bouclez avec <code>enumerate</code> sur les moyennes de groupe et appelez <code>ax.text(i, value + 1, f"{'{'}value:.1f{'}'}", ha="center")</code> pour chaque barre — plaçant la valeur numérique juste au-dessus de chaque barre, centrée horizontalement.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Prenez un graphique de cette semaine qui utilise la couleur pour distinguer des catégories, et refaites-le avec `palette="colorblind"`. La distinction entre les catégories se lit-elle encore clairement ?

<p class="challenge__answer">💡 <strong>Answer:</strong> Ajoutez palette="colorblind" à l'un des graphiques de cette semaine qui utilise hue ou des couleurs de catégorie, par ex. sns.barplot(..., palette="colorblind") ou sns.relplot(..., hue="gender", palette="colorblind"), et comparez visuellement à la palette par défaut.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Enregistrez l'un des graphiques terminés de cette semaine dans un fichier PNG en utilisant `plt.savefig`, avec `dpi=150` et `bbox_inches="tight"`.

<p class="challenge__answer">💡 <strong>Answer:</strong> Appelez plt.savefig("my_chart.png", dpi=150, bbox_inches="tight") juste après avoir construit un graphique et avant plt.show(), puis confirmez que le fichier existe (par ex. via une liste de fichiers) avec une taille raisonnable, non nulle.</p>

</div>
</details>

## 🤔 Questions socratiques

- Facetter par `test_preparation_course` et colorer par `gender` place quatre combinaisons d'information sur une seule figure. À quel point ajouter plus de dimensions à un seul graphique commence-t-il à le rendre *plus difficile* à lire plutôt que plus informatif ? Comment décideriez-vous quand diviser en figures séparées à la place ?
- `sns.barplot` montre des *moyennes avec barres d'erreur*, tandis qu'un simple diagramme à barres de comptages bruts montre quelque chose de totalement différent. Qu'irait-il de travers si un lecteur supposait qu'un `sns.barplot` montrait des comptages ?
- Vous connaissez maintenant plusieurs façons dont un graphique peut induire en erreur sans aucun chiffre fabriqué (axes tronqués, intervalles sélectionnés avec parti pris, échelles non étiquetées). Étant donné cela, quel est votre standard pour décider si un graphique que vous avez fait pour votre propre rapport de la semaine 10 est « honnête », au-delà de simplement « les chiffres sont corrects » ?
- Les palettes séquentielles, divergentes, et qualitatives correspondent chacune à un *type* différent de variable. Qu'irait-il de travers visuellement si vous utilisiez une palette divergente (deux couleurs se rejoignant en un point médian neutre) sur une simple variable catégorielle non ordonnée comme `race_ethnicity` ?
- Une palette adaptée aux daltoniens ne coûte rien à utiliser par défaut. Pouvez-vous penser à d'autres choix « accessibles par défaut, sans coût » des semaines précédentes (étiquettes d'axes, titres de graphiques, éviter que la couleur soit le *seul* moyen de distinguer des groupes) qui suivent le même principe ?

## ✅ Quiz de la semaine

<div class="quiz" data-quiz="data-analysis-hard-week-9">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. Le facettage (par ex. sns.relplot avec col=...) est utilisé pour :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Supprimer automatiquement les valeurs aberrantes</button>
        <button class="quiz-q__opt" data-idx="1">Ajouter une troisième dimension (souvent catégorielle) via une grille de panneaux comparables</button>
        <button class="quiz-q__opt" data-idx="2">Convertir des colonnes numériques en catégorielles</button>
        <button class="quiz-q__opt" data-idx="3">Calculer automatiquement la corrélation</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">2. Pourquoi l'axe des y d'un diagramme à barres devrait-il presque toujours commencer à 0 ?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">C'est une exigence de matplotlib</button>
        <button class="quiz-q__opt" data-idx="1">Commencer au-dessus de 0 exagère visuellement les différences entre les barres</button>
        <button class="quiz-q__opt" data-idx="2">Cela rend le graphique plus rapide à afficher</button>
        <button class="quiz-q__opt" data-idx="3">Ce n'est qu'une préférence de style sans effet réel</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. sns.barplot, contrairement à un simple diagramme à barres de valeurs brutes, montre automatiquement :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Seulement des comptages bruts</button>
        <button class="quiz-q__opt" data-idx="1">La moyenne par catégorie avec des barres d'erreur</button>
        <button class="quiz-q__opt" data-idx="2">Une matrice de corrélation</button>
        <button class="quiz-q__opt" data-idx="3">Une boîte à moustaches au lieu de barres</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">4. Ordonner explicitement les barres par leur valeur moyenne (plutôt qu'alphabétiquement) améliore principalement :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Les statistiques sous-jacentes</button>
        <button class="quiz-q__opt" data-idx="1">La lisibilité — le motif devient immédiatement visible</button>
        <button class="quiz-q__opt" data-idx="2">Rien — l'ordre n'affecte pas l'interprétation</button>
        <button class="quiz-q__opt" data-idx="3">Le coefficient de corrélation</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. Une palette « colorblind » est un choix par défaut raisonnable car :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">C'est la seule palette que seaborn prend en charge</button>
        <button class="quiz-q__opt" data-idx="1">Elle garantit que les distinctions de catégories restent visibles pour les lecteurs ayant une déficience de la vision des couleurs, sans coût réel</button>
        <button class="quiz-q__opt" data-idx="2">Elle ne fonctionne que pour les données numériques</button>
        <button class="quiz-q__opt" data-idx="3">Elle est requise par matplotlib</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

