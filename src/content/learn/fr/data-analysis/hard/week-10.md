---
title: "Semaine 10 : Livrable final — rapport EDA Students Performance"
section: data-analysis
track: hard
week: 10
description: "Livrez un rapport complet d'analyse exploratoire sur le jeu de données Students Performance in Exams."
---


# Semaine 10 : Livrable final — rapport EDA Students Performance

<span class="gamified-flourish">🏁 Tout ce qui vient des semaines 6 à 9 — le cadre, les graphiques univariés, l'analyse de corrélation, le raffinement narratif — converge en un seul rapport cette semaine.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Planifier et exécuter indépendamment un projet d'EDA complet sur un nouveau jeu de données, de la formulation des questions aux graphiques finaux.
- Produire un court rapport écrit combinant constats, preuves (graphiques/statistiques), et interprétation avec la prudence appropriée.
- Identifier les limites réelles de ce jeu de données et les conclusions qu'il ne peut pas soutenir.
- Assembler une structure de rapport complète à partir des techniques individuelles des semaines 6 à 9.

## Leçon

### Le jeu de données : Students Performance in Exams

[`students-performance.csv`](/datasets/students-performance.csv) ([crédité ici](/fr/credits)) est l'un des jeux de données d'EDA pour débutants les plus utilisés sur Kaggle, avec 8 colonnes : `gender`, `race_ethnicity`, `parental_level_of_education`, `lunch`, `test_preparation_course`, et trois colonnes de résultat numériques — `math_score`, `reading_score`, `writing_score`.

### Le livrable requis

Produisez un court rapport d'EDA (un notebook avec des cellules markdown expliquant chaque étape, ou un résumé écrit accompagnant votre code) qui inclut, au minimum :

1. **Profil du jeu de données** (semaine 6) : forme, dtypes, valeurs manquantes, distributions de base de chaque colonne.
2. **Au moins 3 questions formulées**, écrites avant que vous ne les analysiez, couvrant à la fois :
   - une question univariée (semaine 7) — par ex. « à quoi ressemble la distribution de math_score ? »
   - une question bivariée ou multivariée (semaine 8/9) — par ex. « test_preparation_course est-il associé aux scores, et cela se maintient-il à travers les genres ? »
3. **Une analyse de corrélation** (semaine 8) des trois colonnes de score, avec une carte de chaleur.
4. **Au moins un graphique narratif à facettes ou annoté** (semaine 9).
5. **Une courte conclusion écrite** pour chaque question : ce que vous avez trouvé, à quel point vous en êtes confiant (en référençant la taille de l'échantillon par groupe, selon la semaine 6), et une explication alternative plausible que vous ne pouvez pas écarter (selon la discussion de la semaine 8 sur corrélation n'est pas causalité).

### La boîte à outils complète, en un coup d'œil

Chaque technique de cette section correspond à une partie du rapport :

| Section du rapport | Techniques (de) |
|---|---|
| Profil du jeu de données | `.shape`, `.dtypes`, `.isna().sum()`, `.value_counts()`, vérification d'asymétrie moyenne-médiane (semaine 6) |
| Question univariée | Histogramme, boîte à moustaches, diagramme à barres, sensibilité au nombre de classes (semaine 7) |
| Question bivariée/multivariée | `.corr()`, carte de chaleur, nuage de points avec `hue`, boîte à moustaches groupée, `pd.crosstab` (semaine 8) |
| Graphique narratif | Facettage (`col=`/`row=`), ordonnancement délibéré, palette sûre pour daltoniens, annotation (semaine 9) |
| Conclusion | Constat + confiance (taille de l'échantillon) + explication alternative, par question |

Traitez ce tableau comme le plan de votre rapport avant d'écrire la moindre cellule — la même discipline « structurer avant de plonger » que la semaine 6 a introduite pour des questions individuelles, maintenant appliquée à tout le livrable.

### Un exemple de départ résolu

Voici un mini-exemple complet du motif que chacune de vos questions devrait suivre — profiler → visualiser → interpréter avec la prudence appropriée :

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

df = pd.read_csv("students-performance.csv")

# Question: does completing test preparation associate with a higher average score
# across all three subjects?
df["average_score"] = df[["math_score", "reading_score", "writing_score"]].mean(axis=1)

summary = df.groupby("test_preparation_course")["average_score"].agg(["mean", "count"])
print(summary)

sns.boxplot(data=df, x="test_preparation_course", y="average_score")
plt.title("Average score by test preparation status")
plt.show()
```

> **Constat :** Les étudiants ayant terminé la préparation au test avaient un score moyen plus élevé que ceux ne l'ayant pas fait, basé sur un échantillon de taille raisonnable dans les deux groupes (voir `count`).
> **Réserve :** Ceci est une association, pas une preuve que la préparation au test *a causé* la différence — les étudiants suffisamment motivés pour terminer une préparation au test optionnelle pourraient différer de ceux qui ne l'ont pas fait sur d'autres aspects (par ex. habitudes d'étude générales, soutien familial) qui affectent indépendamment les scores.

`.mean(axis=1)` calcule une moyenne ligne par ligne à travers les trois colonnes de score (`axis=1` signifie « à travers les colonnes, pour chaque ligne » — par opposition au défaut `axis=0`, « le long de chaque colonne »), produisant un seul `average_score` combiné par étudiant.

### Un second exemple résolu : un graphique narratif multivarié

Combiner le travail de corrélation de la semaine 8 avec le facettage de la semaine 9 en une seule figure prête pour le rapport :

```python
sns.relplot(
    data=df, x="reading_score", y="writing_score",
    col="test_preparation_course", hue="lunch", palette="colorblind",
)
plt.show()
```

> **Constat :** La forte relation positive entre les scores de lecture et d'écriture se maintient dans les deux panneaux de préparation au test, suggérant qu'elle n'est spécifique à aucun des deux groupes — reflétant probablement un facteur sous-jacent partagé (compétence générale en littératie/verbale) plutôt qu'un score influençant directement l'autre.
> **Réserve :** Facetter par deux variables catégorielles (`col` et `hue`) à la fois commence à mettre à l'épreuve la quantité qu'un lecteur peut assimiler d'une seule figure — une phrase le reconnaissant vaut la peine, et il faut envisager si cela serait plus clair divisé en deux figures plus simples pour un vrai rapport.

### Conclure : ce que ce jeu de données ne peut pas vous dire

Avant de finaliser votre rapport, notez explicitement quelles conclusions ce jeu de données ne soutient *pas* : c'est un instantané unique (pas une étude dans le temps), la population exacte et la méthodologie de collecte ne sont pas spécifiées dans la version du jeu de données utilisée ici, et — comme souligné tout au long des semaines 8-9 — aucune de ces associations n'établit la causalité. Un rapport d'EDA rigoureux est honnête sur ces limites, pas seulement sur ce qu'il a trouvé.

## ⚠️ Erreurs courantes

- **Sauter l'étape de profilage parce que le jeu de données « semble propre ».** Exécutez toujours les étapes de profilage de la semaine 6 en premier, même sur un jeu de données qui semble ordonné — confirmer qu'il ne manque rien et que rien n'est mal codé fait partie du livrable, pas une formalité optionnelle.
- **Écrire des conclusions avant de vérifier les tailles d'échantillon.** Une différence d'apparence spectaculaire dans un petit sous-groupe (par ex. une catégorie de `race_ethnicity` avec peu d'étudiants) mérite une réserve sur la taille de l'échantillon, la même discipline que la semaine 6.
- **Traiter « corrélation n'est pas causalité » comme une note de bas de page plutôt que porteuse.** Chaque constat du livrable requis a besoin de sa propre réserve honnête, pas d'une seule clause de non-responsabilité générique à la toute fin couvrant tout.
- **Manquer de temps pour le raffinement avant de terminer le contenu requis.** Les 5 éléments du livrable (profil, 3 questions, analyse de corrélation, graphique narratif, conclusions) comptent plus que rendre un seul graphique parfait — obtenez d'abord un brouillon complet, puis améliorez-le.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Répondez à cette question pour votre rapport : `parental_level_of_education` est-il associé à `average_score` ? Suivez le motif complet — table récapitulative, graphique, constat, et réserve.

<p class="challenge__answer">💡 <strong>Answer:</strong> En suivant le motif de l'exemple résolu : groupez par <code>parental_level_of_education</code>, calculez la moyenne et le compte de <code>average_score</code> par groupe, puis visualisez avec un diagramme à barres ordonné ou une boîte à moustaches groupée (techniques de la semaine 9), et écrivez une paire constat + réserve comme l'exemple résolu.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Étendez la question sur la préparation au test de l'exemple résolu pour vérifier si l'effet semble le même à travers `gender` — la préparation au test semble-t-elle associée à un gain de score plus important pour un genre que pour l'autre ?

<p class="challenge__answer">💡 <strong>Answer:</strong> Utilisez <code>sns.relplot</code> ou <code>sns.boxplot</code> avec à la fois <code>col="gender"</code> (ou <code>hue="gender"</code>) et un groupement par <code>test_preparation_course</code>, en suivant le motif de facettage de la semaine 9, pour voir si l'effet de la préparation au test sur les scores semble similaire pour les deux genres ou diffère.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Produisez la carte de chaleur de corrélation requise pour les trois colonnes de score, et écrivez une phrase interprétant la corrélation par paire la plus forte, en étant explicite sur ce qu'elle implique et ce qu'elle n'implique pas.

<p class="challenge__answer">💡 <strong>Answer:</strong> Construisez la matrice de corrélation à 3 colonnes et la carte de chaleur exactement comme à la semaine 8, puis écrivez une courte interprétation notant quelle paire est la plus fortement corrélée et proposant une explication plausible de cause partagée (par ex. préparation académique générale) plutôt que d'affirmer qu'un score en cause un autre.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Écrivez un paragraphe pour la conclusion de votre rapport, listant au moins une limite spécifique de ce jeu de données qui devrait rendre un lecteur prudent quant à la généralisation de vos constats au-delà de celui-ci.

<p class="challenge__answer">💡 <strong>Answer:</strong> Une réponse raisonnable note au moins une limite réelle, par ex. : le jeu de données n'enregistre pas quand/où il a été collecté, donc les résultats pourraient ne pas se généraliser à d'autres écoles, régions, ou années ; les « scores de test » comme résultat ne capturent qu'une mesure étroite du succès éducatif ; et les tailles de groupe pour certaines catégories peuvent être assez petites pour que les moyennes portent une réelle incertitude.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Complétez la section « profil du jeu de données » requise pour votre rapport : utilisez la vérification d'asymétrie moyenne-vs-médiane et le compte de valeurs aberrantes par IQR de la semaine 6 sur la colonne `average_score`, et confirmez ce que vous trouvez avec un histogramme de la semaine 7.

<p class="challenge__answer">💡 <strong>Answer:</strong> Utilisez la vérification d'asymétrie moyenne-vs-médiane et le compte de valeurs aberrantes par IQR de la semaine 6 sur average_score, puis un histogramme de la semaine 7 pour confirmer visuellement -- combinant une vérification numérique « avant de tracer » avec le graphique qui la vérifie, exactement le flux de travail autour duquel la semaine 7 a été construite.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Assemblez tout ce qui vient des défis de cette semaine en un seul récit écrit continu (pas seulement une liste de cellules de code séparées) qu'un lecteur pourrait suivre du début à la fin sans avoir besoin de voir votre code.

<p class="challenge__answer">💡 <strong>Answer:</strong> Assemblez une seule section markdown/texte combinant : un résumé d'une phrase du profil, les 3+ questions avec constats et réserves, le constat principal de la carte de chaleur de corrélation, et le paragraphe de limites de clôture -- essentiellement en copiant les éléments requis du rapport dans un seul récit continu qu'un lecteur découvrant le sujet pourrait suivre du début à la fin.</p>

</div>
</details>

## 🤔 Questions socratiques

- À travers votre rapport complet, de quel constat vous sentez-vous le plus confiant, et duquel vous sentez-vous le moins confiant ? Qu'est-ce qui précisément (taille de l'échantillon, taille de l'effet, plausibilité d'un facteur de confusion) motive cette différence de confiance ?
- Si vous deviez choisir juste *un* graphique de tout votre rapport à montrer à quelqu'un disposant de 10 secondes d'attention, lequel serait-ce, et pourquoi ? Que vous dit ce choix sur quel constat est réellement le plus important ?
- Vous avez maintenant terminé un cycle d'EDA complet — question, preuve, interprétation honnête — sur un jeu de données de forme réaliste. Sur le contenu de quelle semaine précise (6 à 9) vous êtes-vous personnellement le plus appuyé en le faisant ? Cela correspond-il à ce que vous attendiez au départ ?
- La réserve du second exemple résolu admet que facetter par deux variables à la fois pourrait déjà être « trop » pour une figure. En revenant sur votre propre rapport, y a-t-il un graphique que vous avez construit que vous envisageriez maintenant de simplifier, après avoir traversé tout ce processus ?
- Maintenant que vous avez construit un rapport d'EDA complet depuis zéro, comment expliqueriez-vous la *différence* entre « analyse exploratoire des données » et « juste faire quelques graphiques » à quelqu'un qui n'a pas suivi ce cours — dans vos propres mots, pas ceux de la leçon ?

## ✅ Quiz de la semaine

<div class="quiz" data-quiz="data-analysis-hard-week-10">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. df[[&quot;math_score&quot;,&quot;reading_score&quot;,&quot;writing_score&quot;]].mean(axis=1) calcule :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">La moyenne de chaque colonne séparément</button>
        <button class="quiz-q__opt" data-idx="1">Une moyenne ligne par ligne à travers les trois colonnes, une valeur par étudiant</button>
        <button class="quiz-q__opt" data-idx="2">La moyenne globale de tout le DataFrame</button>
        <button class="quiz-q__opt" data-idx="3">Une matrice de corrélation</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">2. La conclusion d'un rapport d'EDA rigoureux devrait :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Énoncer les constats comme des faits prouvés sans réserve</button>
        <button class="quiz-q__opt" data-idx="1">Inclure les constats, le niveau de confiance, et des explications alternatives plausibles</button>
        <button class="quiz-q__opt" data-idx="2">N'inclure que des graphiques, aucune interprétation écrite</button>
        <button class="quiz-q__opt" data-idx="3">Éviter de mentionner les tailles d'échantillon</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">3. Lequel de ces éléments N'est PAS quelque chose que ce jeu de données peut soutenir, selon la leçon ?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Des associations entre la préparation au test et les scores</button>
        <button class="quiz-q__opt" data-idx="1">Une description des distributions de scores</button>
        <button class="quiz-q__opt" data-idx="2">Une affirmation causale selon laquelle la préparation au test cause directement des scores plus élevés</button>
        <button class="quiz-q__opt" data-idx="3">Une comparaison des scores moyens à travers les catégories</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">4. Le livrable requis cette semaine doit inclure au minimum :</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Seulement une carte de chaleur de corrélation</button>
        <button class="quiz-q__opt" data-idx="1">Profil du jeu de données, questions formulées, analyse de corrélation, un graphique narratif, et des conclusions écrites</button>
        <button class="quiz-q__opt" data-idx="2">Un modèle d'apprentissage automatique entraîné sur les données</button>
        <button class="quiz-q__opt" data-idx="3">Juste la sortie pandas brute sans interprétation</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">5. Selon la leçon, quand devriez-vous vérifier la taille d'échantillon (count) par groupe ?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Seulement pour le graphique final</button>
        <button class="quiz-q__opt" data-idx="1">Jamais — la moyenne seule est toujours suffisante</button>
        <button class="quiz-q__opt" data-idx="2">Chaque fois que vous comparez des moyennes de groupe, puisque les petits groupes méritent moins de confiance</button>
        <button class="quiz-q__opt" data-idx="3">Seulement si le jeu de données a des valeurs manquantes</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

---

**🎉 Vous avez terminé le parcours difficile de Pandas et analyse de données — et le cours entier, si vous avez suivi le parcours difficile/difficile ou toute combinaison à travers les deux sections.** Rendez-vous sur [Ma progression](/progress) pour voir vos badges, et découvrez les [projets concrets](/docs/projects) : installez Python pour de vrai et construisez quelque chose que le bac à sable n'a jamais pu exécuter.
