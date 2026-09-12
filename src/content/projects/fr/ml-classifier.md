---
title: "Entraînez votre premier modèle de machine learning"
description: "Construisez, entraînez, et évaluez un classificateur scikit-learn avec de vraies données, aucune expérience en ML requise."
difficulty: "intermediate"
estimatedMinutes: 60
xpReward: 50
tags: ["Machine Learning", "scikit-learn", "pandas", "matplotlib"]
prerequisites: ["Python basics", "Basic pandas", "Basic matplotlib"]
---

# 🧠 Entraînez votre premier modèle de machine learning

Le machine learning semble intimidant, mais l'idée centrale est simple : montrer à un ordinateur des exemples de paires entrée/sortie, et il apprend un motif qu'il peut appliquer à de nouvelles données inédites. Dans ce projet, vous allez faire exactement ça, charger un jeu de données classique, entraîner un classificateur d'arbre de décision, et évaluer sa qualité de prédiction. Aucune formation en mathématiques n'est requise.

## 🎯 Ce que vous allez faire

1. Charger et explorer un jeu de données réel.
2. Prétraiter des données pour le machine learning.
3. Diviser les données en ensembles d'entraînement et de test.
4. Entraîner un classificateur d'arbre de décision.
5. Évaluer la précision du modèle et créer une matrice de confusion.
6. Visualiser les résultats sous forme de matrice de confusion.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal recommandé pour celui-ci, tout comme les autres Projets concrets de cette série. Les étapes 1 à 6 ci-dessous supposent ce chemin.

**GitHub Codespaces** fonctionne bien aussi : ouvrez [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt), et les mêmes commandes `uv` fonctionnent depuis un onglet de navigateur, sans installation locale.

**Google Colab et les notebooks Kaggle** sont d'excellents choix ici, entraîner un arbre de décision sur un jeu de données aussi petit ne nécessite aucun GPU, donc un environnement de notebook gratuit est amplement suffisant. Exécutez `!pip install scikit-learn pandas matplotlib` dans une cellule, puis collez et adaptez le code des étapes ci-dessous.

- **Exécutez-le dans le navigateur.** Un compagnon notebook interactif est prêt, ouvrez-le dans Colab, Kaggle ou Binder et suivez les étapes dans l'ordre.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ml-classifier/notebook.fr.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ml-classifier/notebook.fr.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fml-classifier%2Fnotebook.fr.ipynb)

## Setup

```bash
uv init ml-classifier
cd ml-classifier
uv add scikit-learn pandas matplotlib
```

## Étape 1 : Charger et explorer les données

Le jeu de données Iris est l'un des plus célèbres du machine learning. Il contient des mesures (longueur du sépale, largeur du sépale, longueur du pétale, largeur du pétale) pour 150 fleurs d'iris de trois espèces différentes. Votre mission : apprendre à un modèle à prédire l'espèce à partir des mesures.

```python
import pandas as pd
from sklearn.datasets import load_iris

# Load the dataset
iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df["species"] = iris.target
df["species_name"] = df["species"].map({0: "setosa", 1: "versicolor", 2: "virginica"})

df.head()
```

Explorez les données pour comprendre ce avec quoi vous travaillez :

```python
# How many samples per species?
print(df["species_name"].value_counts())

# Basic statistics for each feature
df.describe()
```

**🎯 Résultat attendu :** Vous verrez 50 échantillons par espèce (classes équilibrées), et des statistiques montrant des plages comme la longueur du sépale d'environ 4,3 à 7,9 cm.

**🩹 Si ça ne marche pas :** Si `load_iris()` échoue, assurez-vous d'avoir exécuté `uv add scikit-learn` dans l'étape de configuration. Le jeu de données est inclus dans scikit-learn, aucune connexion Internet n'est requise.

### 1.1 Vérifie qu'il s'importe et se charge proprement

**✅ Liste de vérification**

- ✅ `df` contient 150 lignes et 6 colonnes (4 mesures + `species` + `species_name`).
- ✅ `df["species_name"].value_counts()` affiche 50 pour chaque espèce.
- ✅ `df.describe()` montre des statistiques raisonnables pour chaque mesure, pas de NaN, pas de valeurs absurdes.

**🤔 Question(s) socratique(s)**

- Pourquoi avons-nous ajouté `species_name` alors que `species` (0, 1, 2) suffit pour le modèle ? Dans quel cas l'un ou l'autre serait préférable ?
- Que se passerait-il si une espèce avait 150 échantillons et les deux autres seulement 10 ? Comment cela affecterait-il l'entraînement ?

## Étape 2 : Prétraiter les caractéristiques

Séparez les caractéristiques d'entrée (les mesures) de la cible (l'étiquette d'espèce). Chaque colonne entrant dans le modèle doit être numérique, heureusement, les caractéristiques de l'Iris le sont déjà, donc aucun encodage n'est nécessaire.

```python
X = df.drop(columns=["species", "species_name"])
y = df["species"]

print(f"Features shape: {X.shape}")
print(f"Target shape: {y.shape}")
```

**🎯 Résultat attendu :** `Features shape: (150, 4)` et `Target shape: (150,)`, 150 lignes, 4 colonnes de caractéristiques.

**🩹 Si ça ne marche pas :** Si vous voyez des colonnes de type `object` dans `X.dtypes`, vous avez accidentellement inclus des colonnes de chaînes. Supprimez tout ce qui n'est pas une mesure numérique.

### 2.1 Vérifie la séparation

**✅ Liste de vérification**

- ✅ `X.shape` est `(150, 4)`.
- ✅ `y.shape` est `(150,)`.
- ✅ `X.dtypes` montre uniquement des colonnes `float64`.
- ✅ `X` ne contient pas `species` ni `species_name`.

**🤔 Question(s) socratique(s)**

- Pourquoi ne garde-t-on pas `species_name` dans `X`, ne pourrait-il pas aider le modèle à prédire l'espèce ?
- Que se passerait-il si `X` contenait une colonne de type `object` non numérique ? Comment le modèle réagirait-il ?

## Étape 3 : Division entraînement/test

La précision d'un modèle sur les données sur lesquelles il a été entraîné ne vous dit presque rien. Vous devez mettre de côté des données que le modèle ne verra jamais pendant l'entraînement, puis évaluer sur cette portion mise de côté. C'est l'habitude la plus importante en machine learning.

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"Training set: {X_train.shape[0]} samples")
print(f"Test set: {X_test.shape[0]} samples")
```

`test_size=0.2` met de côté 20 % des lignes pour le test (30 échantillons). `random_state=42` rend la division reproductible, vous obtiendrez les mêmes lignes à chaque fois.

**🎯 Résultat attendu :** Training set: 120 samples, Test set: 30 samples.

**🩹 Si ça ne marche pas :** Si les chiffres n'additionnent pas 150, vérifiez votre `test_size`. Si `y_test` ne contient qu'une seule espèce, votre déséquilibrée, essayez un `random_state` différent ou vérifiez que `y` contient bien les trois classes.

:::tip[Fuite de données]
Toujours diviser *après* avoir chargé les données mais *avant* toute transformation qui résume le jeu de données (comme la mise à l'échelle ou l'encodage). Ici les caractéristiques de l'Iris sont déjà numériques et sur des échelles similaires, donc pas de risque de fuite, mais cette discipline compte pour des jeux de données plus sales.
:::

### 3.1 Vérifie la division

**✅ Liste de vérification**

- ✅ `X_train.shape[0]` + `X_test.shape[0]` égale 150.
- ✅ Relancer la division avec le même `random_state` reproduit exactement les mêmes lignes dans `X_test`.
- ✅ `y_train` et `y_test` contiennent tous les deux des 0, des 1, et des 2, pas une seule espèce.

**🤔 Question(s) socratique(s)**

- Si vous entraîniez un modèle et l'évaluiez sur `X_train`/`y_train` au lieu de `X_test`/`y_test` par erreur, vous attendriez-vous à une précision *meilleure* ou *pire* que le vrai chiffre, et pourquoi ?
- Que donnerait `test_size=0.5` ? Avantages et inconvénients ?

## Étape 4 : Entraîner un classificateur

Un arbre de décision pose une série de questions oui/non sur les caractéristiques (par ex. « la longueur du pétale est-elle > 2,5 ? ») et arrive à une prédiction. C'est intuitif, rapide, et fonctionne bien comme premier modèle.

```python
from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(random_state=42)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
```

`.fit(X_train, y_train)` est là où l'apprentissage a lieu, le modèle ne voit jamais `X_test` pendant cette étape. Ensuite `.predict(X_test)` applique ce qu'il a appris aux données mises de côté.

**🎯 Résultat attendu :** `predictions` est un tableau de longueur 30 ne contenant que des 0, 1, ou 2 (les étiquettes d'espèce).

**🩹 Si ça ne marche pas :** Si vous voyez un avertissement sur les noms de caractéristiques, vous avez peut-être passé un DataFrame avec des colonnes supplémentaires. Assurez-vous que `X_train` et `X_test` ne contiennent que les quatre colonnes numériques de caractéristiques.

### 4.1 Vérifie l'entraînement

**✅ Liste de vérification**

- ✅ `model.fit(...)` s'exécute sans erreur.
- ✅ `predictions` contient 30 valeurs, chacune étant 0, 1, ou 2.
- ✅ `predictions` est de la même longueur que `y_test`.

**🤔 Question(s) socratique(s)**

- `model.fit(X_train, y_train)` voit les vraies réponses (`y_train`) pendant l'entraînement, est-ce de la triche ? Pourquoi est-ce acceptable ici mais pas lors de l'évaluation ?
- Que se passerait-il si vous appeliez `model.predict(X_train)` au lieu de `model.predict(X_test)` ?

## Étape 5 : Évaluer le modèle

Commencez par la précision (accuracy), la fraction des prédictions correctes, puis creusez plus profond avec la précision (precision), le rappel (recall), et une matrice de confusion.

```python
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix

accuracy = accuracy_score(y_test, predictions)
precision = precision_score(y_test, predictions, average="weighted")
recall = recall_score(y_test, predictions, average="weighted")

print(f"Accuracy:  {accuracy:.1%}")
print(f"Precision: {precision:.1%}")
print(f"Recall:    {recall:.1%}")
```

La précision (accuracy) indique le taux de réussite global. La précision (precision) indique, pour chaque fois que le modèle a prédit une espèce, combien de fois il avait raison. Le rappel (recall) indique, pour chaque espèce réelle, combien le modèle en a trouvé. Le paramètre `average="weighted"` gère le cas multi-classes en moyennant sur les trois espèces.

**🎯 Résultat attendu :** Les trois métriques devraient être d'environ 90 à 100 % sur ce jeu de données, l'Iris est suffisamment séparé pour qu'un arbre de décision fonctionne très bien.

**🩹 Si ça ne marche pas :** Si la précision est exactement de 33 %, le modèle devine aléatoirement (niveau chance pour 3 classes). Vérifiez que `X_train` et `y_train` n'ont pas été mélangés indépendamment, ils doivent rester alignés.

### 5.1 Vérifie les métriques

**✅ Liste de vérification**

- ✅ Les trois scores (accuracy, precision, recall) sont tous supérieurs à 90 %.
- ✅ Vous comprenez la différence entre accuracy, precision, et recall.
- ✅ Vous pouvez expliquer pourquoi `average="weighted"` est nécessaire ici.

**🤔 Question(s) socratique(s)**

- Si la accuracy est de 95 % mais que le jeu de données est déséquilibré (95 % d'une seule classe), que vous dit vraiment ce chiffre ?
- Dans quel cas le rappel serait-il plus important que la précision (precision), par ex. dans un contexte médical ?

## Étape 6 : Visualiser les résultats

Une matrice de confusion montre exactement *quelles* espèces le modèle a confondues. La visualiser rend le motif évident en un coup d'œil.

```python
import matplotlib.pyplot as plt
import numpy as np

cm = confusion_matrix(y_test, predictions)

fig, ax = plt.subplots(figsize=(6, 5))
im = ax.imshow(cm, cmap="Blues")

ax.set_xticks(range(3))
ax.set_yticks(range(3))
ax.set_xticklabels(iris.target_names)
ax.set_yticklabels(iris.target_names)
ax.set_xlabel("Predicted")
ax.set_ylabel("Actual")
ax.set_title("Confusion Matrix")

# Add count labels in each cell
for i in range(3):
    for j in range(3):
        ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                color="white" if cm[i, j] > cm.max() / 2 else "black")

plt.colorbar(im)
plt.tight_layout()
plt.show()
```

Les cellules diagonales (de haut en gauche à droite en bas) montrent les prédictions correctes. Les cellules hors diagonale montrent les erreurs, par exemple, si versicolor et virginica sont parfois confondues, cette cellule s'allumera.

**🎯 Résultat attendu :** Une grille 3×3 avec des nombres élevés sur la diagonale et des zéros (ou presque) en dehors. Un modèle parfait n'aurait que des entrées diagonales.

**🩹 Si ça ne marche pas :** Si le graphique n'apparaît pas, assurez-vous de courir dans un environnement avec affichage (Jupyter, VS Code, ou un script local). Dans un terminal sans affichage, remplacez `plt.show()` par `plt.savefig("confusion_matrix.png")` pour sauvegarder la figure dans un fichier.

### 6.1 Vérifie la visualisation

**✅ Liste de vérification**

- ✅ Le graphique affiche une grille 3×3 avec les noms d'espèce sur les deux axes.
- ✅ La diagonale contient des nombres élevés (proches de 30) ; les autres cellules sont proches de zéro.
- ✅ La légende de couleur montre une échelle de blanc (zéro) à bleu foncé (maximum).

**🤔 Question(s) socratique(s)**

- Si versicolor et virginica étaient souvent confondues, quelle cellule de la matrice s'allumerait, et que dirait cela sur les caractéristiques de ces deux espèces ?
- La matrice de confusion montre les erreurs, mais pas leur * gravité *, dans quel contexte serait-il plus grave de confondre versicolor avec virginica que l'inverse ?

## 🧩 Défis

- **Essayez un classificateur différent.** Remplacez `DecisionTreeClassifier` par `RandomForestClassifier` (ajoutez `from sklearn.ensemble import RandomForestClassifier`). Comment la précision change-t-elle ?
- **Réglez l'arbre.** Définissez `max_depth=2` lors de la création du `DecisionTreeClassifier`. Que devient la précision ? Et avec `max_depth=10` ?
- **Importance des caractéristiques.** Après l'entraînement, affichez `model.feature_importances_` à côté de `iris.feature_names`. Quelle caractéristique compte le plus pour prédire l'espèce ?
- **Testez une autre division.** Changez `test_size` à 0,3 ou 0,1. Comment le chiffre de précision évolue-t-il ? Lancez la division 10 fois avec différentes valeurs de `random_state` et rapportez la fourchette des scores de précision.

## Ce que vous avez appris

Vous avez construit un flux de travail complet de machine learning : charger des données, préparer les caractéristiques, diviser en ensembles d'entraînement et de test, entraîner un classificateur, évaluer avec plusieurs métriques, et visualiser les résultats. Le flux de travail, préparer → diviser → entraîner → évaluer, est la même forme utilisée pour chaque tâche d'apprentissage supervisé, qu'il s'agisse d'un jeu de données de 150 lignes ou d'un système de production de millions de lignes. Les arbres de décision ne sont qu'une famille de modèles ; les mêmes étapes fonctionnent avec la régression logistique, les forêts aléatoires, les réseaux de neurones, et au-delà.

:::tip[Vérifiez la documentation actuelle de scikit-learn]
scikit-learn est stable, mais son API évolue entre les versions majeures, les valeurs de paramètres par défaut changent, et des fonctions sont dépréciées. Avant de vous fier à ce code au-delà d'un projet de cours, parcourez la [documentation actuelle de scikit-learn](https://scikit-learn.org/stable/) pour la version que vous avez réellement installée (`uv pip show scikit-learn`).
:::

## Où aller à partir d'ici

- **La validation croisée.** Une seule division train/test donne un chiffre de précision qui dépend en partie de la chance. `sklearn.model_selection.cross_val_score` répète le cycle division-entraînement-évaluation plusieurs fois et moyenne le résultat, une façon plus fiable de comparer deux modèles.
- **L'ingénierie de caractéristiques.** Essayez de créer de nouvelles colonnes à partir des mesures existantes (par ex. le ratio longueur/largeur du pétale) et regardez si cela améliore la précision.
- **Un jeu de données différent.** Kaggle héberge des centaines de petits jeux de données bien documentés pour débutants, une bonne prochaine étape une fois que ce flux de travail devient routinier.

## Partagez votre projet avec la classe

Vous avez construit quelque chose dont vous êtes fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis, et son README a un guide complet et accessible aux débutants pour ajouter le vôtre via une **pull request**, même si vous n'avez jamais utilisé git auparavant : forker le dépôt, créer une branche, valider vos fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est présumée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
