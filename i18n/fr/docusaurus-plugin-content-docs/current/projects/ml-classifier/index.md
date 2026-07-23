---
id: ml-classifier
title: "Entraînez votre premier modèle de machine learning"
sidebar_label: "Entraîner un classificateur ML"
slug: /projects/ml-classifier
description: "Passez de décrire des données à prédire à partir d'elles : entraînez un vrai classificateur binaire sur le jeu de données Titanic avec scikit-learn."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Entraînez votre premier modèle de machine learning

<ProjectPublishedDate projectId="ml-classifier" />

<ProjectGreeting />

Ce projet suppose que vous êtes à l'aise avec pandas à peu près au niveau du track Normal de Data Analysis — filtrage, `.groupby()`, gestion des valeurs manquantes. En fait, il suppose que vous avez précisément fait l'[EDA Titanic guidée de la semaine 10](/docs/data-analysis/normal/week-10) : vous avez déjà chargé ce jeu de données, l'avez nettoyé, et posé des questions comme « le taux de survie différait-il selon la classe ou le sexe ? ». Ce projet en est la suite directe. Vous avez déjà *décrit* ce jeu de données. Maintenant, vous allez *prédire* à partir de lui — en entraînant un modèle qui regarde un passager qu'il n'a jamais vu et devine s'il a survécu.

Ceci est optionnel et non noté. Voir [Projets concrets](/docs/projects) pour la liste complète, qui s'enrichit au fil du temps.

## 🎯 Ce que vous allez faire

1. Installer `uv` et configurer un projet local avec `scikit-learn` et `pandas`.
2. Charger le même jeu de données Titanic que la semaine 10, et encoder ses colonnes catégorielles en nombres.
3. Diviser les données en un ensemble d'entraînement et un ensemble de test, et comprendre pourquoi cette division compte.
4. Entraîner un classificateur `LogisticRegression` et l'utiliser pour prédire la survie.
5. L'évaluer correctement, puis entraîner un second modèle (`RandomForestClassifier`) et comparer.

## Où exécuter ceci

Trois façons raisonnables de faire ce projet — choisissez celle qui convient à votre configuration :

- **En local avec `uv` (recommandé).** Ce projet est petit et ne nécessite aucun GPU, donc c'est un bon candidat pour vraiment installer Python pour de vrai sur votre propre machine, comme les autres Projets concrets. Les étapes 1 à 5 ci-dessous supposent ce chemin.
- **GitHub Codespaces.** Ouvrez [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) pour obtenir un environnement de développement cloud avec Node, Python, et `uv` déjà installés (voir [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)) — exactement les mêmes commandes ci-dessous fonctionnent depuis un onglet de navigateur, sans aucune installation locale.
- **Google Colab ou les notebooks Kaggle.** Un choix véritablement bon ici : entraîner `LogisticRegression` ou `RandomForestClassifier` sur un jeu de données aussi petit (quelques centaines de lignes au maximum) ne nécessite aucun GPU, donc un environnement de notebook gratuit est amplement suffisant. Exécutez `!pip install scikit-learn pandas` dans une cellule, puis collez et adaptez le code des étapes ci-dessous. **Les notebooks Kaggle en particulier** sont un joli choix qui boucle la boucle — le jeu de données Titanic est lui-même l'une des compétitions originales pour débutants les plus célèbres de Kaggle, donc vous entraîneriez un modèle sur la propre plateforme de Kaggle, avec le propre jeu de données de Kaggle.

## Étape 1 : installer `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis installer pip, puis installer un outil d'environnement virtuel, puis installer les paquets » — il peut installer et gérer lui-même les versions de Python, en plus des dépendances de votre projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Fermez et rouvrez votre terminal, puis confirmez l'installation :

```bash
uv --version
```

Configurez ensuite le projet :

```bash
uv init ml-classifier
cd ml-classifier
uv add scikit-learn pandas
```

## Étape 2 : charger et préparer les données

Même jeu de données, mêmes colonnes que l'EDA de la semaine 10 — cette fois chargé depuis le fichier brut du jeu de données du cours plutôt que depuis le bac à sable dans le navigateur :

```python
import pandas as pd

url = "https://raw.githubusercontent.com/abderrahim-lectures/python-data-analysis-course/main/static/datasets/titanic.csv"
df = pd.read_csv(url)
df.head()
```

Rapide rappel du nettoyage déjà détaillé en profondeur à la semaine 10 — juste assez ici pour obtenir un DataFrame propre, pas ré-enseigné :

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])
df = df.drop(columns=["PassengerId", "Name"])  # identifiers, not predictive signal
```

### Encoder les colonnes catégorielles

Cette partie est nouvelle. `Sex` et `Embarked` sont des chaînes de caractères (« male »/« female », « S »/« C »/« Q ») — le `.groupby()` de la semaine 10 était parfaitement heureux de regrouper par une colonne de chaînes, mais les modèles de scikit-learn ne le sont pas : chaque modèle de ce projet fait, en dessous, de l'arithmétique sur des nombres, donc chaque colonne qui entre doit déjà être numérique. `pd.get_dummies` gère cela en transformant une colonne catégorielle en plusieurs colonnes 0/1, une par catégorie :

```python
df = pd.get_dummies(df, columns=["Sex", "Embarked"], drop_first=True)
df.head()
```

`drop_first=True` supprime une catégorie par colonne (par ex. garde `Sex_male` mais pas `Sex_female`) parce que la catégorie supprimée est totalement impliquée par le fait que les autres valent 0 — garder les deux serait redondant. `Sex` devient une colonne (`Sex_male`, 1 ou 0) ; `Embarked` en devient deux (`Embarked_Q`, `Embarked_S`, les deux à 0 signifiant « C »). C'est la même forme de transformation que `pd.cut` à la semaine 10 — transformer une colonne en une forme plus facile à consommer pour l'étape suivante — juste en passant du texte aux nombres au lieu du continu au discrétisé.

Enfin, séparez les colonnes à partir desquelles vous prédisez (les caractéristiques, `X`) de la colonne que vous prédisez (la cible, `y`) :

```python
X = df.drop(columns=["Survived"])
y = df["Survived"]
```

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`df.isna().sum()` montre zéro valeur manquante dans chaque colonne que vous êtes sur le point de donner au modèle.</StepChecklistItem>
<StepChecklistItem>`X.dtypes` ne montre plus aucune colonne `object` — tout est numérique.</StepChecklistItem>
<StepChecklistItem>`X` ne contient pas la colonne `Survived` ; `y` ne contient rien d'autre.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

`pd.get_dummies` a été appliqué à `Sex` et `Embarked`, mais pas à `Pclass` (1, 2, ou 3) — elle a été laissée comme une seule colonne numérique. `Pclass` est aussi une catégorie (il n'y a pas de sens significatif dans lequel la classe 2 est « le double » de la classe 1), pourtant la laisser telle quelle est un choix défendable que font certaines vraies analyses. Pouvez-vous penser à un argument pour encoder `Pclass` de la même façon que `Sex`, et un argument pour la laisser telle quelle ?

## Étape 3 : diviser en ensembles d'entraînement et de test

Voici l'idée centrale sur laquelle repose cette étape : **le score d'un modèle sur les données sur lesquelles il a été entraîné ne vous dit presque rien sur ses performances sur des données qu'il n'a jamais vues.** Un modèle peut — et, avec assez de liberté, va — simplement mémoriser les lignes d'entraînement plutôt qu'apprendre un vrai motif. Imaginez évaluer un étudiant en lui donnant à l'avance les questions exactes accompagnées du corrigé : un score parfait ne vous dirait pas s'il a compris la matière ou juste mémorisé ces réponses spécifiques. Évaluer un modèle sur ses propres données d'entraînement a le même défaut. Pour obtenir une mesure honnête de la performance du modèle sur des passagers qu'il n'a jamais vus, vous devez mettre de côté une partie des données et ne jamais laisser le modèle s'entraîner dessus.

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
```

`test_size=0.2` met de côté 20 % des lignes pour le test, en entraînant sur les 80 % restants. `random_state=42` fixe le mélange aléatoire utilisé pour choisir quelles lignes vont où — sans ça, vous obtiendriez une division *différente* (et donc un score de précision légèrement différent) à chaque fois que vous relancez le script, ce qui rendrait difficile de savoir si un changement dans votre code a vraiment aidé ou si vous avez juste eu une division plus chanceuse.

:::tip[Fuite de données : préparez, puis divisez — pas l'inverse]
L'encodage de l'étape 2 a été fait sur l'ensemble *complet* des données, avant cette division, ce qui est correct ici parce que `pd.get_dummies` ne regarde que la propre catégorie de chaque ligne, pas les autres lignes. Mais il est facile de se tromper avec des transformations qui *regardent* effectivement à travers les lignes — par exemple, mettre à l'échelle une colonne en utilisant sa moyenne et son écart-type. Si vous calculez cette moyenne/écart-type sur l'ensemble complet des données puis divisez, l'ensemble d'entraînement a silencieusement « vu » des informations de l'ensemble de test (ses lignes ont contribué à cette moyenne). Cela s'appelle la **fuite de données** (data leakage), et c'est l'une des erreurs les plus courantes en machine learning appliqué dans le monde réel — la solution est de toujours calculer tout ce qui résume les données (moyennes, écarts-types, listes de catégories) en utilisant uniquement l'ensemble *d'entraînement*, puis d'appliquer cette même transformation à l'ensemble de test.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`X_train.shape` et `X_test.shape` montrent à peu près une division 80/20 du nombre total de lignes.</StepChecklistItem>
<StepChecklistItem>Relancer la division avec le même `random_state` reproduit exactement les mêmes lignes dans `X_test` à chaque fois.</StepChecklistItem>
<StepChecklistItem>`y_train` et `y_test` sont tous deux un mélange de 0 et de 1, pas tous une seule valeur.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Si vous entraîniez un modèle et l'évaluiez sur `X_train`/`y_train` au lieu de `X_test`/`y_test` par erreur, vous attendriez-vous à ce que la précision paraisse *meilleure* ou *pire* que le vrai chiffre honnête — et pourquoi ?

## Étape 4 : entraîner un classificateur

`LogisticRegression`, malgré son nom, est un classificateur, pas un modèle de régression au sens habituel. L'idée : pour chaque passager, il calcule une somme pondérée de ses caractéristiques (âge, tarif, sexe, classe, ...) — la même forme de calcul qu'une équation linéaire ordinaire — puis fait passer cette somme dans une fonction (la fonction logistique/sigmoïde) qui projette n'importe quel nombre sur une valeur entre 0 et 1. Cette sortie est interprétée comme une *probabilité* estimée de survie. « Ajuster le modèle » (fitting) signifie trouver l'ensemble de poids qui fait s'aligner ces probabilités estimées aussi précisément que possible avec les vrais résultats 0/1 des données d'entraînement. Une prédiction est alors simplement « probabilité ≥ 0,5 → prédire survécu ».

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
```

`.fit(X_train, y_train)` est là où l'apprentissage a lieu — il ne voit jamais `X_test` ni `y_test`. `max_iter=1000` relève le plafond du nombre d'étapes d'optimisation que le solveur effectue pour converger ; la valeur par défaut n'est parfois pas suffisante pour ces données et scikit-learn vous avertira s'il s'arrête trop tôt.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`model.fit(...)` s'exécute sans avertissement de convergence (ou vous avez relevé `max_iter` jusqu'à ce que ce ne soit plus le cas).</StepChecklistItem>
<StepChecklistItem>`predictions` est un tableau de la même longueur que `y_test`, ne contenant que des 0 et des 1.</StepChecklistItem>
<StepChecklistItem>Vous pouvez afficher `model.predict_proba(X_test)[:5]` et voir qu'il retourne de vraies probabilités, pas juste la décision finale 0/1.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

`predict_proba` pourrait retourner quelque chose comme 0,51 pour un passager et 0,98 pour un autre — les deux sont arrondis à la même prédiction finale (1), mais ils représentent des niveaux de confiance très différents. Quelle décision du monde réel pourrait changer si vous aviez accès à cette probabilité, au lieu de juste la prédiction finale oui/non ?

## Étape 5 : évaluer et comparer les modèles

Le premier chiffre à considérer est la précision (accuracy) — la fraction des prédictions de l'ensemble de test qui correspondaient au vrai résultat :

```python
from sklearn.metrics import accuracy_score, confusion_matrix

accuracy = accuracy_score(y_test, predictions)
print(f"Logistic Regression accuracy: {accuracy:.1%}")
```

La précision seule cache *quel type* d'erreurs commet le modèle. Une matrice de confusion décompose cela :

```python
cm = confusion_matrix(y_test, predictions)
print(cm)
```

Le résultat est une grille 2×2. En termes simples : elle compte, séparément, combien de passagers réellement morts ont été correctement prédits comme morts, combien de passagers réellement morts ont été à tort prédits comme survivants (un **faux positif** pour « survécu »), combien de passagers réellement survivants ont été à tort prédits comme morts (un **faux négatif**), et combien de passagers réellement survivants ont été correctement prédits comme survivants. Deux modèles avec une précision identique peuvent commettre des *types* d'erreurs très différents — ça vaut la peine de le savoir, surtout dans des domaines où un type d'erreur (disons, un diagnostic médical manqué) est bien plus coûteux que l'autre.

Entraînez maintenant un second modèle, d'un type différent, sur exactement la même division, et comparez honnêtement :

```python
from sklearn.ensemble import RandomForestClassifier

rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)
rf_predictions = rf_model.predict(X_test)

rf_accuracy = accuracy_score(y_test, rf_predictions)
print(f"Random Forest accuracy: {rf_accuracy:.1%}")
print(confusion_matrix(y_test, rf_predictions))
```

Une forêt aléatoire (random forest) entraîne de nombreux petits arbres de décision, chacun sur un sous-ensemble aléatoire légèrement différent des données et des caractéristiques, et les fait voter pour la prédiction finale — une idée sous-jacente différente de l'approche à somme pondérée unique plus probabilité de la régression logistique. Comparez les deux chiffres de précision que vous avez maintenant. Ne supposez pas que le plus élevé est automatiquement « le meilleur modèle » — voir le piège ci-dessous.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Vous avez deux chiffres de précision, calculés sur les *mêmes* `X_test`/`y_test`, un par modèle.</StepChecklistItem>
<StepChecklistItem>Vous avez affiché les deux matrices de confusion et pouvez dire, en une phrase, quels types d'erreurs chaque modèle a commis.</StepChecklistItem>
<StepChecklistItem>Vous n'avez pas déclaré de « gagnant » sans considérer à quel point l'écart entre eux est réellement petit.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si votre modèle obtient 95 % de précision mais que le jeu de données est à 95 % d'une seule classe, que vous dit vraiment ce chiffre ? (Vérifiez : quelle fraction des passagers du Titanic a réellement survécu — est-ce proche de 50/50, ou déséquilibré ?)
- Les scores de précision des deux modèles diffèrent probablement de seulement quelques points de pourcentage, calculés sur un ensemble de test d'à peine une vingtaine de lignes (la version de ce cours du jeu de données a environ 100 lignes au total, plus petite que le jeu de données Titanic original de Kaggle d'environ 900 lignes). À quel point devriez-vous avoir confiance que cet écart spécifique se maintiendrait sur une *autre* division test aléatoire de 20 % ?

## ⚠️ Pièges courants

- **Encoder les ensembles d'entraînement et de test de façon incohérente.** Si vous divisez d'abord puis exécutez `pd.get_dummies` séparément sur chaque moitié, une catégorie présente à l'entraînement mais absente au test (ou l'inverse) peut produire des colonnes non concordantes entre `X_train` et `X_test`, cassant `.fit()`/`.predict()` ou produisant silencieusement des résultats faux. Encodez avant de diviser quand l'encodage ne regarde que les propres valeurs de chaque ligne (comme ici), ou ajustez l'encodeur sur les données d'entraînement uniquement et appliquez-le aux données de test, jamais l'inverse.
- **Fuite de données** — ajuster une transformation qui résume l'ensemble *complet* des données (un scaler, un encodeur avec des statistiques inter-lignes) avant de diviser, au lieu d'après. Voir l'astuce de l'étape 3 ; c'est l'une des erreurs les plus courantes en machine learning appliqué dans le monde réel, et elle gonfle silencieusement votre précision de test en un chiffre trop optimiste.
- **Surinterpréter une petite différence de précision.** Avec un ensemble de test aussi petit (une vingtaine de lignes, puisque le jeu de données de ce cours n'a qu'environ 100 lignes au total), un écart de 2-3 points de pourcentage — souvent juste une ou deux prédictions inversées — se situe bien dans la plage à laquelle vous vous attendriez à cause du simple hasard sur *quelles* lignes se sont retrouvées dans la division de test, pas nécessairement une preuve qu'un modèle est réellement meilleur. La validation croisée (voir ci-dessous) est la façon standard d'obtenir une comparaison plus fiable, et compte encore plus sur un jeu de données de cette taille.
- **Oublier `random_state`.** Sans lui, votre division (et le caractère aléatoire interne de certains modèles) change à chaque exécution, rendant impossible de savoir si un changement que vous avez fait a vraiment amélioré quelque chose ou si vous avez juste eu une division aléatoire différente.

## Ce que vous venez de construire

Vous avez pris un jeu de données que vous aviez déjà exploré et résumé avec pandas, et vous êtes allé une étape plus loin : un modèle qui généralise à partir d'exemples qu'il a vus vers une prédiction sur des exemples qu'il n'a pas vus. Rien ici n'est exotique — `LogisticRegression` et `RandomForestClassifier` sont deux des classificateurs les plus largement utilisés en pratique — mais la forme du flux de travail (préparer les données, diviser honnêtement, ajuster, évaluer, comparer) est la même forme utilisée pour des modèles bien plus sophistiqués.

:::tip[Vérifiez la documentation actuelle de scikit-learn]
scikit-learn est une bibliothèque mature et stable, mais son API évolue tout de même occasionnellement entre les versions majeures — les valeurs de paramètres par défaut changent, et des fonctions sont dépréciées en faveur de nouvelles. Avant de vous fier à ce code au-delà d'un projet de cours, parcourez la [documentation actuelle de scikit-learn](https://scikit-learn.org/stable/) pour la version que vous avez réellement installée (`uv pip show scikit-learn`).
:::

## Où aller à partir d'ici

- **L'ingénierie de caractéristiques (feature engineering).** La colonne `Name` a été supprimée à l'étape 2, mais elle n'est pas inutile — des titres comme « Mr. », « Mrs. », « Miss. », et « Master. » (intégrés dans la chaîne du nom) sont fortement corrélés à l'âge et au sexe, et les extraire comme une nouvelle colonne catégorielle est une amélioration classique de ce jeu de données précis.
- **La validation croisée.** Une seule division train/test donne un chiffre de précision qui dépend en partie de la chance (quelles lignes se sont retrouvées où). `sklearn.model_selection.cross_val_score` répète le cycle division-entraînement-évaluation plusieurs fois sur différentes tranches et moyenne le résultat — une façon plus fiable de comparer deux modèles que la comparaison unique de l'étape 5.
- **Un jeu de données complètement différent.** Kaggle héberge des centaines de petits jeux de données bien documentés pour débutants, dans le même esprit que Titanic — une bonne prochaine étape une fois que ce flux de travail devient routinier.

## Partagez votre projet avec la classe

Vous avez construit quelque chose dont vous êtes fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README a un guide complet et accessible aux débutants pour ajouter le vôtre via une **pull request**, même si vous n'avez jamais utilisé git auparavant : forker le dépôt, créer une branche, valider vos fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est présumée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="ml-classifier" />
