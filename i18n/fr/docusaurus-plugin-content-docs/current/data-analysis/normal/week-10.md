---
title: "Semaine 10 : EDA guidée — le jeu de données Titanic"
sidebar_position: 5
section: data-analysis
track: normal
week: 10
description: "Reproduisez de bout en bout un notebook classique d'analyse exploratoire du Titanic avec pandas."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semaine 10 : EDA guidée — le jeu de données Titanic

<span className="gamified-flourish">🚢 Chaque outil des semaines 6 à 9 se rassemble cette semaine sur l'un des jeux de données pour débutants les plus célèbres de la science des données.</span>

## 🎯 Objectifs d'apprentissage

À la fin de cette semaine vous serez capable de :
- Charger et nettoyer un jeu de données de forme réaliste ([`titanic.csv`](pathname:///datasets/titanic.csv)) de bout en bout.
- Répondre à des questions analytiques concrètes en utilisant sélection, filtrage, et `.groupby()` ensemble.
- Découper une colonne continue en tranches avec `pd.cut` pour une analyse groupée.
- Reproduire la structure d'un notebook d'EDA classique de style Kaggle, cellule par cellule, et résumer les constats en langage clair.

## Leçon

Cette semaine est délibérément moins « nouveau concept, nouvelle syntaxe » et davantage « appliquer tout, en séquence, sur un jeu de données ». Le jeu de données Titanic ([crédité ici](/credits)) est devenu une référence standard pour débutants exactement pour cette raison : il est petit, a une colonne de résultat claire (`Survived`), et a assez de texture réaliste et désordonnée (âges manquants, types mixtes) pour nécessiter chaque outil de cette section.

### Étape 1 : Charger et inspecter

```python
import pandas as pd

df = pd.read_csv("titanic.csv")
df.shape
df.head()
df.info()
df.describe()
```

Avant d'analyser quoi que ce soit, demandez toujours : combien de lignes, quelles colonnes, quels dtypes, qu'est-ce qui manque ? C'est le matériel des semaines 6 et 8, appliqué comme toute première étape de n'importe quelle analyse réelle — pas une formalité, mais la fondation dont tout ce qui suit dépend.

### Étape 2 : Gérer les données manquantes

```python
df.isna().sum()
```

`Age` a généralement des valeurs manquantes dans ce jeu de données. Plutôt que de supprimer ces lignes purement et simplement (perdant d'autres informations sur ces passagers), un choix courant est de remplir avec l'âge médian — la médiane, pas la moyenne, car les distributions d'âge sont souvent faussées par quelques passagers très jeunes ou très âgés :

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
```

### Étape 3 : Poser des questions, répondre avec filtrage + groupby

**Question : le taux de survie différait-il selon la classe des passagers ?**

```python
df.groupby("Pclass")["Survived"].mean()
```

La moyenne d'une colonne 0/1 pour chaque groupe est exactement le *taux* de survie pour ce groupe — la même astuce « moyenne d'une colonne de type booléen = proportion » que vous utiliserez constamment en analyse de données.

**Question : le taux de survie différait-il selon le sexe ?**

```python
df.groupby("Sex")["Survived"].mean()
```

**Question : parmi les passagers ayant payé les 25% de tarifs les plus élevés, quel était le taux de survie ?**

```python
fare_threshold = df["Fare"].quantile(0.75)
top_fare_passengers = df[df["Fare"] >= fare_threshold]
top_fare_passengers["Survived"].mean()
```

Ceci combine un filtre (semaine 7) avec un agrégat (`.mean()`, semaine 6) — le même motif en deux étapes que presque toute question que vous poserez à un vrai jeu de données : réduisez d'abord aux lignes qui vous intéressent, puis résumez-les.

### Étape 4 : Combiner les dimensions de regroupement

`.groupby()` accepte une *liste* de colonnes, partitionnant par chaque combinaison de leurs valeurs à la fois :

```python
df.groupby(["Pclass", "Sex"])["Survived"].mean()
```

Cela répond à une question plus spécifique que chaque regroupement pris isolément : l'effet de la classe sur la survie se maintient-il *au sein* de chaque sexe, ou disparaît-il une fois que vous contrôlez pour le sexe ?

### Étape 5 : Découper une colonne continue avec `pd.cut`

`Age` est continue, mais « taux de survie par âge exact » est trop finement granulaire pour se lire facilement — grouper par *tranches* d'âge (une discrétisation, la même idée que les classes d'un histogramme) est généralement plus utile. `pd.cut` fait exactement cela :

```python
df["age_group"] = pd.cut(df["Age"], bins=[0, 12, 18, 35, 60, 100],
                          labels=["Child", "Teen", "Adult", "Middle-aged", "Senior"])
df.groupby("age_group")["Survived"].mean()
```

`bins` donne les bornes de chaque tranche ; `labels` les nomme. Maintenant `age_group` est simplement une autre colonne catégorielle, utilisable avec `.groupby()` exactement comme `Pclass` ou `Sex`.

### Étape 6 : Résumer les constats en langage clair

Une vraie EDA n'est pas terminée tant que ses chiffres ne deviennent pas une phrase que quelqu'un d'autre peut lire sans réexécuter votre code — la même discipline que le cadre d'EDA du parcours difficile traite comme centrale :

```python
class_survival = df.groupby("Pclass")["Survived"].mean()
sex_survival = df.groupby("Sex")["Survived"].mean()

print(f"Overall survival rate: {df['Survived'].mean():.1%}")
print(f"1st class survival rate: {class_survival[1]:.1%}, "
      f"3rd class survival rate: {class_survival[3]:.1%}")
print(f"Female survival rate: {sex_survival['female']:.1%}, "
      f"male survival rate: {sex_survival['male']:.1%}")
```

`{value:.1%}` est une spécification de format f-string — la semaine 1 de Python 101 a introduit `:.2f` ; `.1%` signifie de façon similaire « en pourcentage, une décimale », transformant automatiquement `0.629` en `"62.9%"`.

## ⚠️ Erreurs courantes

- **Répondre à une question avec la mauvaise tranche de données.** Vérifiez toujours à deux fois que la condition booléenne d'un filtre dit réellement ce que vous vouliez — `df["Age"] < 18` et `df["Age"] <= 18` donnent des réponses différentes (bien que similaires), et la différence compte pour les cas limites.
- **Oublier que les tranches de `pd.cut` sont semi-ouvertes dans une direction spécifique.** Par défaut, les tranches de `pd.cut` sont `(gauche, droite]` — la borne gauche exclue, la borne droite incluse — à vérifier si une valeur pourrait plausiblement se situer exactement sur une frontière.
- **Rapporter la moyenne d'un groupe sans aussi rapporter sa taille.** Un taux de survie d'apparence spectaculaire pour un groupe de 3 passagers mérite bien moins de confiance que le même taux pour un groupe de 300 — regardez toujours `.count()` à côté de `.mean()` en comparant des groupes, la même prudence que la semaine 6 du parcours difficile met en avant.

## 🧩 Défis

<Challenge id="dataanalysis-normal-w10-c1" answer={<><code>df.groupby("Embarked")["Survived"].mean()</code> — le même motif en une ligne que classe/sexe, simplement groupé par la colonne du port d'embarquement à la place.</>}>

Calculez le taux de survie par port `Embarked`. Quel port avait le taux de survie le plus élevé dans ce jeu de données ?

</Challenge>

<Challenge id="dataanalysis-normal-w10-c2" answer={<><code>df[df["Age"] &lt; 18]["Survived"].mean()</code> comparé à <code>df[df["Age"] &gt;= 18]["Survived"].mean()</code> — deux sous-ensembles filtrés, chacun résumé avec le même agrégat.</>}>

Comparez le taux de survie des passagers de moins de 18 ans à celui des passagers de 18 ans et plus.

</Challenge>

<Challenge id="dataanalysis-normal-w10-c3" answer={<><code>df.groupby(["Pclass", "Sex"])["Survived"].mean()</code>, puis lisez les deux entrées où Sex est "female" à travers les trois valeurs de Pclass.</>}>

En utilisant le groupby combiné `["Pclass", "Sex"]`, la classe des passagers compte-t-elle encore pour la survie *au sein* des passagères spécifiquement ? Lisez les lignes pertinentes du résultat.

</Challenge>

<Challenge id="dataanalysis-normal-w10-c4" answer={<>Ajoutez une nouvelle colonne : <code>df["family_size"] = df["SibSp"] + df["Parch"] + 1</code> (le +1 compte le passager lui-même), puis groupez par elle : <code>df.groupby("family_size")["Survived"].mean()</code>.</>}>

Créez une nouvelle colonne `family_size` comme `SibSp + Parch + 1` (frères/sœurs-conjoints + parents/enfants + le passager lui-même), puis calculez le taux de survie groupé par `family_size`.

</Challenge>

<Challenge id="dataanalysis-normal-w10-c5" answer={<>Utilisez la colonne age_group de l'étape 5 et lisez son taux de survie ; comparez-le au filtre brut Age &lt; 18 du Défi 2 -- ils devraient être globalement cohérents, bien que la frontière exacte (12 contre 18) diffère, donc les chiffres ne correspondront pas exactement.</>}>

En utilisant la colonne `age_group` de l'étape 5, quel est le taux de survie pour la tranche `"Child"` ? Comment se compare-t-il à votre réponse du Défi 2 pour les passagers de moins de 18 ans ?

</Challenge>

<Challenge id="dataanalysis-normal-w10-c6" answer={<>Groupez par Pclass et utilisez .agg(["mean", "count"]) sur Survived, afin que le taux de survie et la taille du groupe soient visibles ensemble -- le taux d'un petit groupe peut alors être jugé avec la prudence appropriée.</>}>

Refaites le groupby de taux de survie par Pclass, mais cette fois incluez à la fois la moyenne *et* le nombre de passagers dans chaque classe, en un seul appel `.agg(...)` — afin que vous puissiez juger à quel point faire confiance au chiffre de chaque classe.

</Challenge>

## 🤔 Questions socratiques

- Le résultat combiné `.groupby(["Pclass", "Sex"])` montre généralement un écart *bien plus grand* selon le sexe que selon la classe seule. Que cela suggère-t-il sur quelle variable faisait le plus de « travail » dans les résultats de groupby à une seule variable vus plus tôt ?
- Remplir les valeurs manquantes d'`Age` avec la médiane suppose que les âges manquants ne sont pas systématiquement différents des âges connus. Pouvez-vous imaginer une raison pour laquelle cette hypothèse pourrait être fausse pour ce jeu de données spécifique (c'est-à-dire, une raison pour laquelle certains *types* de passagers pourraient être plus susceptibles d'avoir un âge manquant) ?
- Vous venez de répondre à plusieurs vraies questions analytiques en utilisant uniquement des outils des semaines 6 à 9. Quelle seule méthode (`.groupby()`, masquage booléen, `.fillna()`, `.merge()`) avez-vous fini par utiliser le plus ? Cela correspond-il à votre attente de quelle compétence pandas compte le plus en pratique ?
- Les bornes de tranches de `pd.cut` (`[0, 12, 18, 35, 60, 100]`) ont été choisies de façon quelque peu arbitraire dans cette leçon. À quel point pensez-vous que le taux de survie « Child » pourrait changer si vous déplaciez la frontière enfant/adolescent de 12 à, disons, 15 ? Que cela suggère-t-il sur le fait d'être transparent quant à vos choix de découpage dans un vrai rapport ?
- Le résumé en langage clair de l'étape 6 ne rapporte que deux variables (classe, sexe) même si vous en avez exploré plusieurs autres dans les défis. Si vous rédigiez cela pour quelqu'un qui n'a jamais vu les chiffres bruts, quel *unique* constat supplémentaire des défis considéreriez-vous le plus digne d'être inclus, et pourquoi celui-là ?

## ✅ Quiz de la semaine

<WeeklyQuiz
  weekId="data-analysis-normal-week-10"
  questions={[
    {
      id: 'q1',
      prompt: 'Pour une colonne 0/1 (a survécu/n\'a pas survécu), que représente .mean() au sein d\'un groupe ?',
      options: [
        'Le nombre total de survivants',
        'Le taux de survie (proportion) au sein de ce groupe',
        'La valeur la plus courante',
        'Rien de significatif — mean ne fonctionne que sur des données continues',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Pourquoi remplir l\'Age manquant avec la médiane plutôt que la moyenne dans cette leçon ?',
      options: [
        'La moyenne ne peut pas être calculée sur une colonne avec des valeurs manquantes',
        'La médiane est moins sensible à une distribution faussée avec des valeurs aberrantes',
        'Elles donnent toujours des résultats identiques',
        'pandas ne prend pas en charge .mean() en présence de NaN',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'df.groupby(["Pclass", "Sex"]) groupe les lignes par :',
      options: [
        'Pclass seulement, en ignorant Sex',
        'Chaque combinaison unique de Pclass et Sex',
        'Sex seulement, en ignorant Pclass',
        'Ni l\'un ni l\'autre — cela lève une erreur',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Le motif d\'EDA général utilisé de façon répétée cette semaine était :',
      options: [
        'Fusionner, puis trier',
        'Filtrer/grouper, puis agréger',
        'Supprimer toutes les données manquantes, puis tracer un graphique',
        'Convertir chaque colonne en chaîne',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'Que fait pd.cut ?',
      options: [
        'Supprime les lignes avec des valeurs manquantes',
        'Divise une colonne continue en tranches étiquetées (bins)',
        'Fusionne deux DataFrames',
        'Trie une colonne par ordre croissant',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-10" />

---

**🎉 Vous avez terminé le parcours normal de Pandas et analyse de données — et le cours entier, si vous avez suivi le parcours normal dans les deux sections.** Rendez-vous sur [Ma progression](/progress) pour voir vos badges et, si vous avez terminé chaque semaine, débloquez le [Capstone Bonus](/docs/bonus/capstone-ai-agent) : installer Python pour de vrai et construire votre premier agent IA.
