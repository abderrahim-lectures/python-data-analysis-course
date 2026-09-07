---
title: "Pipeline AutoML"
description: "Apprentissage automatique qui sélectionne les fonctionnalités, ajuste les modèles et génère du code prêt pour la production."
difficulty: "advanced"
estimatedMinutes: 120
xpReward: 100
tags: ["Machine Learning", "Developer Tools", "Pandas"]
prerequisites:
  - "Les DataFrames pandas et les divisions train/test"
  - "Les estimateurs scikit-learn et fit/predict"
  - "Les bases de NumPy rng"
learningObjectives:
  - "Générer un jeu de données synthétique reproductible à étiquettes retournées avec numpy et le diviser avec stratification"
  - "Enchaîner imputation et mise à l'échelle dans un Pipeline scikit-learn"
  - "Comparer trois estimateurs avec cross_val_score et lire la course honnêtement"
  - "Ajuster un modèle avec GridSearchCV et distinguer les métriques choisies par CV de celles du test"
  - "Exporter le pipeline choisi avec joblib et le recharger comme prédicteur prêt à l'emploi"
---

# 🛠️ 🤖 Construire un Pipeline AutoML

« L'apprentissage automatique automatisé » des tutoriels vit sur un serveur que tu loues. Ce projet fait tourner la même idée sur ton ordinateur portable : un petit pilote automatique qui prend des lignes brutes, les nettoie avec un pipeline chaîné, fait courir une poignée de modèles avec une vraie validation croisée, ajuste les plus prometteurs avec une recherche par grille, et exporte un vainqueur sérialisé que tu peux recharger n'importe où. En chemin, il enseigne la discipline que les vraies bibliothèques ML encodent : **la division train/test est décidée avant tout ajustement**, l'**imputer et le scaler apprennent uniquement des données d'entraînement**, et une **recherche par grille ajustée sur la validation croisée peut quand même diverger du jeu de test** — ce projet rend les trois observables avec des données petites et générées à la main. Le jeu de données est synthétique (des statistiques de trafic réseau qui corrèlent avec un statut sain/malsain), donc chaque nombre de ce guide est reproductible à partir d'une graine fixe.

Cela suppose pandas, sklearn de base, et un peu de numpy. C'est un projet facultatif et non noté — consulte [Projets du monde réel](/docs/projects) pour la liste complète et grandissante. Installe deux paquets (`pandas`, `scikit-learn`) — `uv` rend cela indolore.

## 🎯 Ce que tu vas faire

1. Générer un jeu de données reproductible de 400 lignes avec du bruit de label injecté et le diviser 75/25 avec stratification.
2. Envelopper un pipeline de prétraitement d'imputation par la médiane et de mise à l'échelle z-score, et l'ajuster sur les caractéristiques d'entraînement.
3. Faire courir la régression logistique, un arbre de décision et les k-NN avec `cross_val_score`.
4. Ajuster les arbres et voisins prometteurs avec `GridSearchCV` et comparer à la base de référence CV.
5. Exporter le pipeline final avec `joblib` et le recharger comme prédicteur avec probabilités.

## Où exécuter ceci

**Localement avec `uv`** est le chemin recommandé. Une commande installe tout :

```bash
uv init automl-pipeline && cd automl-pipeline
uv add pandas scikit-learn joblib
```

**Google Colab, Kaggle Notebooks et Binder** exécutent chaque étape sans modification — les deux plateformes livrent pandas et scikit-learn préinstallés. Les données synthétiques et les graines fixes rendent la sortie du notebook identique d'une machine à l'autre.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/automl-pipeline/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/automl-pipeline/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fautoml-pipeline%2Fnotebook.ipynb)

## Configuration

Tout ce qu'il faut avant la première ligne.

### Configure le projet

```bash
uv init automl-pipeline
cd automl-pipeline
uv add pandas scikit-learn joblib
```

Les trois imports que tu utiliseras partout :

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
```

**✅ Liste de vérification**

- ✅ `uv run python3 -c "import pandas, sklearn, joblib"` réussit.
- ✅ Tu sais quelles métriques sklearn viennent de `sklearn.metrics`, quels pipelines viennent de `sklearn.pipeline` — les deux sont importés au besoin ci-dessous.

**🤔 Question(s) socratique(s)**

- « Le ML automatisé » promet de choisir le meilleur modèle. Mais un pipeline qui ajuste sur les *mêmes* données qu'il rapporte est optimiste. Où, dans le flux de ce projet, le jeu de test doit-il apparaître et réapparaître, et pourquoi la réponse change-t-elle s'il fuit dans l'ajustement ?
- Le jeu de données est synthétique : deux amas flous dans `(bytes_in, bytes_out)` plus un retournement de label aléatoire de 5 %. Que t'apprend le *retournement* qu'un ensemble synthétique parfaitement propre cacherait ?

## Étape 1 : Construis le jeu de données reproductible

Chaque nombre en aval dépend de ce bloc, donc il doit être ensemencé, documenté, et divisé avec soin.

### 1.1 Génère les données d'amas

**👟 Indice de départ :** Utilise `np.random.default_rng(7)` pour tirer 200 lignes par classe depuis deux amas, puis retourne 5 % des étiquettes au hasard.

```python
# main.py
import numpy as np
import pandas as pd

rng = np.random.default_rng(7)
n = 400
X0 = rng.normal([2.0, 2.0], 1.6, size=(n // 2, 2))   # "unhealthy" cluster
X1 = rng.normal([6.0, 6.0], 1.6, size=(n // 2, 2))   # "healthy" cluster
X = np.vstack([X0, X1])
y = np.array([0] * (n // 2) + [1] * (n // 2))
flip = rng.random(n) < 0.05
y = np.where(flip, 1 - y, y)                          # 5% label noise

df = pd.DataFrame(X, columns=["bytes_in", "bytes_out"])
df["ok"] = y
print("shape:", df.shape)
print("balance:", df["ok"].value_counts().to_dict())
print(df.head(3).round(2).to_string(index=False))
```

`default_rng(7)` est l'API numpy moderne — une graine fixe signifie des tirages identiques sur chaque machine. `flip = rng.random(n) < 0.05` sélectionne ~5 % des lignes et `1 - y` les inverse, donc les classes sont réellement difficiles à séparer à la frontière, comme le vrai trafic réseau. Remarque que l'équilibre n'est plus exactement 200/200 — les retournements déplacent des étiquettes de l'autre côté, laissant un léger déséquilibre honnête.

**🎯 Résultat attendu :**

```
shape: (400, 3)
balance: {1: 208, 0: 192}
 bytes_in  bytes_out  ok
     2.00       2.48   0
     1.56       0.58   0
     1.27       0.41   0
```

**🩹 Si ça ne marche pas :** Si l'équilibre est exactement 200/200, la ligne de retournement d'étiquette n'a pas tourné (ou `rng.random(n)` a été remplacé par un RNG neuf). Si `head` montre d'autres décimales, ta graine numpy ou la ligne `np.vstack` diffère — revérifie `default_rng(7)`.

### 1.2 Divise l'entraînement du test en premier

**👟 Indice de départ :** Divise avec `train_test_split(..., test_size=0.25, random_state=7, stratify=df["ok"])` — la division se produit *avant* que quoi que ce soit apprenne.

```python
# main.py (continued)
from sklearn.model_selection import train_test_split

train, test = train_test_split(df, test_size=0.25, random_state=7,
                               stratify=df["ok"])
print("train/test:", len(train), len(test))
print("test balance:", test["ok"].value_counts().to_dict())
```

Diviser une fois, au début, est la discipline qui garde le reste du projet honnête : chaque imputer, scaler, pli CV et recherche plus tard ne voit **que** `train`. `stratify` garde le ratio de classes similaire des deux côtés même avec le déséquilibre 208/192 — un simple mélange pourrait donner un jeu de test malchanceux.

**🎯 Résultat attendu :**

```
train/test: 300 100
test balance: {1: 52, 0: 48}
```

**🩹 Si ça ne marche pas :** Si les tailles sont 75/25 inversées, `test_size` a été réglé à `0.75`. Si l'équilibre du test est proche de 50/50 mais pas exact — c'est l'approximation stratifiée de sklearn et c'est bien.

### 1.3 Vérifie les données + la division

**✅ Liste de vérification**

- ✅ `df.shape == (400, 3)` ; équilibre `{1: 208, 0: 192}` depuis la graine 7.
- ✅ `train_test_split` donne 300/100 avec stratification.
- ✅ Exécuter le bloc deux fois produit des DataFrames identiques (graine !).

**🤔 Question(s) socratique(s)**

- Pourquoi le retournement d'étiquette *ajoute*-t-il des difficultés au lieu d'en soustraire ? De quoi un jeu de données à 0 % de bruit ferait-il paraître artificiellement parfait (imagine le score CV sur un jeu où les deux amas ne se chevauchent jamais) — et pourquoi cela te tromperait-il sur un vrai déploiement ?
- `stratify` opère sur les étiquettes de classe. Si c'était une régression (`ok` continu), stratify ne s'appliquerait pas. Quelle propriété de la cible devrais-tu alors protéger, et quel argument sklearn la fournit ?

## Étape 2 : Le pipeline de prétraitement

Les nombres bruts n'alimentent pas un modèle ; les nombres propres et mis à l'échelle oui. L'Étape 2 retire les valeurs manquantes et remet les choses à l'échelle sans jamais toucher le jeu de test.

### 2.1 Introduis et localise la présence de valeurs manquantes

**👟 Indice de départ :** Copie les caractéristiques d'entraînement, perce 10 % de trous, et compte-les — un scénario réaliste « le capteur a perdu des lectures ».

```python
# main.py (continued)
feat = train[["bytes_in", "bytes_out"]].copy()
miss = np.random.default_rng(1).random(feat.shape) < 0.10   # ~10% holes
feat[miss] = np.nan
print("NaNs  bytes_in:", feat["bytes_in"].isna().sum(),
      " bytes_out:", feat["bytes_out"].isna().sum())
```

Les trous sont injectés **après** la division, sur une copie, donc les vrais blocs `train`/`test` restent entiers — c'est là qu'un pipeline qui fuit imputerait volontiers depuis les données de test et s'entraînerait en silence sur les 400 lignes. `default_rng(1)` est une graine *différente* de celle de l'étape 1, donc les données elles-mêmes restent fixes pendant que la présence de valeurs manquantes est reproductible en soi.

**🎯 Résultat attendu :**

```
NaNs  bytes_in: 23  bytes_out: 34
```

**🩹 Si ça ne marche pas :** Si les comptages diffèrent, la graine RNG ou le comparateur `.random(feat.shape)` a changé. Si `feat` se lit entier après l'impression, l'affectation `np.nan` n'a pas pris — vérifie que `miss` est booléen et de même forme.

### 2.2 Enchaîne imputation → mise à l'échelle

**👟 Indice de départ :** Construis `Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())])` et `fit_transform` sur les caractéristiques trouées.

```python
# main.py (continued)
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

clean = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])
S = clean.fit_transform(feat)
print("scaled mean:", np.round(S.mean(axis=0), 4))
print("scaled std :", np.round(S.std(axis=0), 4))
print("imputed medians:", np.round(clean.steps[0][1].statistics_, 3))
```

Le pipeline est une *séquence de transformations qui n'apprend que de ce sur quoi tu le `fit`*. `SimpleImputer(strategy="median")` remplit chaque trou avec la médiane de cette colonne, apprise de `feat` ; `StandardScaler` fait ensuite un z-score : moyenne→0, écart-type→1. Demande-toi **pourquoi la médiane et pas la moyenne** pour l'imputation — la médiane est robuste aux pointes injectées, la moyenne bougerait sous elles. Après imputation+mise à l'échelle, la matrice de caractéristiques est prête pour tout modèle basé sur la distance ou régularisé.

**🎯 Résultat attendu :**

```
scaled mean: [ 0. -0.]
scaled std : [1. 1.]
imputed medians: [3.999 3.608]
```

**🩹 Si ça ne marche pas :** Si la moyenne mise à l'échelle n'est pas ~0, l'imputer a tourné avant le scaler *ou* le scaler s'est ajusté sur un autre bloc. Si `statistics_` renvoie une erreur, l'imputer n'a pas été ajusté — oublie `fit_transform` et fais seulement un transform.

### 2.3 Vérifie le pipeline

**✅ Liste de vérification**

- ✅ Comptages `bytes_in: 23, bytes_out: 34` depuis les trous ensemencés.
- ✅ La sortie ajustée-transformée a moyenne ≈ 0, écart-type ≈ 1 par colonne.
- ✅ `.steps[0][1].statistics_` contient les médianes par colonne utilisées pour l'imputation.

**🤔 Question(s) socratique(s)**

- Le scaler apprend la moyenne/écart-type depuis `train` **seulement**. S'il apprenait des 400 lignes, produirait-il quand même des z-scores valides ? Oui — valides mais *ajustés sur des données futures*, ce qui est exactement la fuite qui gonfle les scores CV. Que fuit, précisément, quand le jeu de test contribue au `mean_` du scaler ?
- La médiane de l'imputer `3.999` est proche du centre de l'amas 0. Si une ligne *de test* finit avec `bytes_in` manquant, quel nombre appris la remplit — et pourquoi remplir depuis la médiane de train est-il strictement meilleur que remplir depuis la classe propre de la ligne, ce que le modèle ne connaît pas au moment de l'inférence ?

## Étape 3 : Fais courir le zoo de modèles

Le prétraitement est un pipeline fixe ; le modèle est un choix. `cross_val_score` fait courir trois candidats honnêtes sur le pli d'entraînement seulement.

### 3.1 Note trois modèles

**👟 Indice de départ :** Construis un dict zoo de `Pipeline`/estimateurs et signale `cross_val_score(...).mean()` par modèle sur `train`.

```python
# main.py (continued)
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score

zoo = {
    "logistic": make_pipeline(StandardScaler(),
                              LogisticRegression(max_iter=1000, random_state=1)),
    "tree": DecisionTreeClassifier(max_depth=4, random_state=1),
    "knn": KNeighborsClassifier(n_neighbors=15),
}
for name, est in zoo.items():
    scores = cross_val_score(est, train[["bytes_in", "bytes_out"]], train["ok"], cv=5)
    print(name, "-> mean", round(scores.mean(), 3))
```

Remarque que le jeu de test est **absent ici** : chaque score est une validation croisée à 5 plis sur les 300 lignes d'entraînement, donc chaque modèle s'entraîne sur 240 et note sur les 60 retenues, cinq fois. Le `zoo` de `main.py` mélange un pipeline mis à l'échelle (logistic, qui veut des caractéristiques mises à l'échelle) avec des estimateurs bruts (tree et kNN, que les arbres insensibles à l'échelle ignorent et que kNN ré-échelonne effectivement tout seul via la distance). Ni tree ni kNN ne voient les données manquantes, parce qu'ils prennent les colonnes brutes *non imputées* — pour le zoo la comparaison la plus propre est les caractéristiques telles quelles, avec la note qu'un vrai pilote automatique alimenterait chaque modèle avec le même pipeline imputé.

**🎯 Résultat attendu :**

```
logistic -> mean 0.927
tree -> mean 0.9
knn -> mean 0.917
```

**🩹 Si ça ne marche pas :** Si les trois sont ≈0,5, le retournement d'étiquette a consommé le signal (vérifie le `flip` de la graine 7). Si seulement tree est bien pire, `max_depth=4` sous-ajuste ce modèle pendant que les autres s'adaptent.

### 3.2 Lis la course honnêtement

**👟 Indice de départ :** Affiche aussi la variance au niveau du pli — une moyenne cache un modèle bruyant.

```python
# main.py (continued)
for name, est in zoo.items():
    scores = cross_val_score(est, train[["bytes_in", "bytes_out"]], train["ok"], cv=5)
    print(name, "->", [round(s, 3) for s in scores])
```

Une moyenne sur 5 plis est un résumé ; les cinq chiffres par pli sont la substance. Un modèle dont les plis sont `[0.93, 0.90, 0.92, 0.91, 0.95]` dit « stable », tandis que `[1.0, 0.75, 0.98, 0.80, 1.0]` dit « fragile » même à moyenne égale. Les clients discrets, les splits d'arbre et les kNN frontaliers se plient tous différemment — voir les cinq valeurs te dit quel modèle peut faire confiance à sa moyenne.

**🎯 Résultat attendu :** 5 scores par modèle dont la moyenne correspond à l'Étape 3.1 (par ex. les cinq plis de logistic aboutissent en moyenne à `0.927` — les valeurs exactes des plis varient selon la version de sklearn ; la *moyenne* et le classement, eux, ne varient pas).

**🩹 Si ça ne marche pas :** Si les scores de plis s'affichent avec des enveloppes `np.float64`, c'est cosmétique — flotatise-les pour une sortie propre. Si le nombre de plis ≠ 5, `cv=` a été changé.

### 3.3 Vérifie le zoo

**✅ Liste de vérification**

- ✅ Trois modèles notés par CV à 5 plis sur `train` seulement ; le jeu de test n'est pas touché.
- ✅ Classement sur cette exécution : logistic (0.927) > kNN (0.917) > tree (0.900).
- ✅ Scores au niveau des plis affichés pour ne pas faire confiance aveuglément aux moyennes.

**🤔 Question(s) socratique(s)**

- Logistic gagne *malgré* le fait de vouloir des caractéristiques mises à l'échelle et malgré le fait que tree les ignore — le signal est approximativement séparable linéairement, et logistic l'exploite le mieux. Si la vraie frontière était sinusoïdale, lequel des trois gagnerait probablement, et qu'est-ce que cela dit du « meilleur modèle » comme *propriété des données* plutôt que de la bibliothèque ?
- Le `n_neighbors=15` de kNN a été choisi au hasard. L'Étape 4 l'ajustera — mais ajuster *chaque* modèle gaspille des heures. Quelle est celle qui te dit le vainqueur de ce zoo, et pourquoi ajuster le second reste-t-il utile ?

## Étape 4 : Balaye les hyperparamètres

Les vainqueurs du zoo reçoivent une petite recherche par grille. C'est là que l'ajustement doit rester sur les plis d'entraînement *et* être jugé contre la CV, pas le test.

### 4.1 Ajuste l'arbre et les voisins

**👟 Indice de départ :** `GridSearchCV(estimator, param_grid, cv=5)` sur une grille compacte, puis affiche `best_params_` et `best_score_`.

```python
# main.py (continued)
from sklearn.model_selection import GridSearchCV

gs_tree = GridSearchCV(DecisionTreeClassifier(random_state=1),
                       param_grid={"max_depth": [2, 3, 5],
                                   "min_samples_leaf": [1, 5, 10]},
                       cv=5)
gs_tree.fit(train[["bytes_in", "bytes_out"]], train["ok"])
print("tree best:", gs_tree.best_params_, "cv score", round(gs_tree.best_score_, 3))

gs_knn = GridSearchCV(KNeighborsClassifier(),
                      param_grid={"n_neighbors": [3, 5, 9],
                                  "weights": ["uniform", "distance"]},
                      cv=5)
gs_knn.fit(train[["bytes_in", "bytes_out"]], train["ok"])
print("knn best:", gs_knn.best_params_, "cv score", round(gs_knn.best_score_, 3))
```

`GridSearchCV` est une CV automatisée *à l'intérieur* de toi : 3×3 = 9 configs d'arbre et 3×2 = 6 configs kNN, chacune notée avec une CV à 5 plis sur train — la recherche choisit la config avec le meilleur score CV moyen. De façon cruciale, **la meilleure config est choisie par la validation croisée de `train`**, pas par la précision sur le test. Un testeur qui a « amélioré » le modèle pour mieux faire sur le jeu de test ajusterait sur la feuille de réponses.

**🎯 Résultat attendu :**

```
tree best: {'max_depth': 3, 'min_samples_leaf': 1} cv score 0.903
knn best: {'n_neighbors': 3, 'weights': 'uniform'} cv score 0.937
```

**🩹 Si ça ne marche pas :** Si `best_params_` montre des extrêmes de la grille (par ex. `max_depth: 5`), la grille est trop grossière dans cette direction. Si `cv score` dépasse `0.94`, la pondération `distance` du kNN écrème la version uniforme dans ce jeu de plis — vérifie `best_params_`.

### 4.2 La tension CV-vs-test

**👟 Indice de départ :** Note les deux vainqueurs ajustés sur le *jeu de test retenu* et compare leurs meilleurs scores CV.

```python
# main.py (continued)
from sklearn.metrics import accuracy_score

for gs, name in [(gs_tree, "tree"), (gs_knn, "knn")]:
    acc = accuracy_score(test["ok"], gs.best_estimator_.predict(
        test[["bytes_in", "bytes_out"]]))
    print(name, "cv", round(gs.best_score_, 3), "-> test", round(acc, 3))
```

C'est l'écart d'honnêteté que tout le projet enseigne : la CV de l'arbre ajusté dit `0.903`, son test dit `0.91` ; la CV de kNN dit `0.937`, le test `0.91`. Ni CV ni test n'est « faux » — la CV moyenne sur 5 divisions basées sur l'entraînement, le test mesure un ensemble tiré — mais **le chiffre du test est celui qui compte pour un rapport**, et le chiffre CV est celui que tu as utilisé pour choisir. Rapporter le modèle « 0.937 sur la CV » publiquement serait le survendre.

**🎯 Résultat attendu :**

```
tree cv 0.903 -> test 0.91
knn cv 0.937 -> test 0.91
```

**🩹 Si ça ne marche pas :** Si la précision du test s'affiche au lieu de `0.91`, le `best_estimator_` diffère de la meilleure config de la grille (tu as ajusté un estimateur neuf). Si la CV et le test divergent sauvagement, les graines de plis rendent la CV sur-optimiste — signale-le plutôt que le cacher.

### 4.3 Vérifie le balayage

**✅ Liste de vérification**

- ✅ Arbre ajusté à `max_depth=3, min_samples_leaf=1` ; kNN à `n_neighbors=3, uniform`.
- ✅ Les deux scores CV et la précision de test indépendante sont affichés et comparés.
- ✅ La décision d'exporter a utilisé le résultat *du test*, pas le plafond CV.

**🤔 Question(s) socratique(s)**

- La CV de kNN (0.937) a dépassé son test (0.91), tandis que l'arbre a égalé (0.903≈0.91). Étant donné que la CV d'un modèle ment sur le futur, comment un *second* tenir-de-côté — ajuster sur train, choisir sur dev, rapporter sur test — changerait-il le chiffre auquel tu fais confiance au déploiement ?
- `GridSearchCV` a lancé 9 configs d'arbre avant que tu n'en choisisses une. Chaque config a regardé les mêmes plis ; choisir la meilleure CV signifie que tu as « testé » 9 modèles en pratique. Quel est le nom de ce biais optimiste, et comment une CV imbriquée ou un ensemble dev fixe le garde-t-il honnête ?

## Étape 5 : Exporte et charge le vainqueur

Le produit final du pilote automatique est un artefact rechargeable : même pipeline, même état, prêt à noter un nouveau trafic dans un autre processus. L'Étape 5 fige le choix.

### 5.1 Ajuste et sauvegarde le pipeline final

**👟 Indice de départ :** Définis le `Pipeline` final (scaler → logistic), ajuste sur `train`, note sur `test`, puis `joblib.dump`.

```python
# main.py (continued)
import joblib

final = Pipeline([("scaler", StandardScaler()),
                  ("model", LogisticRegression(max_iter=1000, random_state=1))])
final.fit(train[["bytes_in", "bytes_out"]], train["ok"])
acc = accuracy_score(test["ok"], final.predict(test[["bytes_in", "bytes_out"]]))
print("final logistic test accuracy:", round(acc, 3))

joblib.dump(final, "autopilot.joblib")
print("saved", __import__("pathlib").Path("autopilot.joblib").stat().st_size, "bytes")
```

Logistic est le vainqueur du zoo et la recherche par grille ne l'a pas battu sur le test, donc l'artefact final est le logistic mis à l'échelle simple et bien compris — la version ML de « la solution ennuyeuse qui marche ». Sauvegarder avec `joblib` sérialise l'*objet ajusté* (coefficients, moyennes du scaler, noms de caractéristiques) dans un blob natif de la plateforme — pas juste une liste de poids, mais tout ce qu'il faut pour prédire sur un trafic d'hier dans un processus neuf.

**🎯 Résultat attendu :**

```
final logistic test accuracy: 0.91
saved 1665 bytes
```

**🩹 Si ça ne marche pas :** Si la précision ≠ 0.91, la graine ou `test_size` a dérivé de l'Étape 1. Si `saved` affiche une taille plus grande et un `.joblib` de 0 octets, `joblib.dump` a tourné avant `fit` ou sur un objet différent — dump après un `final` ajusté.

### 5.2 Charge et prédit sur un nouveau trafic

**👟 Indice de départ :** Dans un extrait neuf (ou une nouvelle cellule), `joblib.load` le blob et note un petit lot — y compris `predict_proba`.

```python
# main.py — the reload, as if a new process
import joblib
model = joblib.load("autopilot.joblib")

batch = [[2.0, 2.5], [6.0, 6.0], [4.0, 4.0]]
print("labels:", model.predict(batch).tolist())
print("probas:\n", model.predict_proba(batch).round(3))
```

Le modèle rechargé est le *même objet* — les moyennes du scaler et les coefficients logistiques sont revenus intacts, donc `score` sur le jeu de test reproduit `0.91`. `predict_proba` te tend une confiance, pas des votes : une ligne `[0.966, 0.034]` est un fort « malsain », `[0.251, 0.749]` est un « sain » doux près de la frontière — exactement ce qu'un humain dans la boucle a besoin avant d'agir sur un appel serré.

**🎯 Résultat attendu :**

```
labels: [0, 1, 0]
probas:
 [[0.966 0.034]
 [0.991 0.009]
 [0.251 0.749]]
```

**🩹 Si ça ne marche pas :** Si `joblib.load` renvoie une erreur de désaccord de version, le blob a été dumpé par un autre niveau de correctif sklearn — re-dump avec l'environnement de chargement. Si `predict` retourne des classes non-entiers, ton `y` était une colonne de chaînes ; garde la cible numérique.

### 5.3 Vérifie l'export

**✅ Liste de vérification**

- ✅ Le pipeline ajusté note `0.91` sur le test retenu avant et après un aller-retour.
- ✅ `joblib.load` retourne un `Pipeline` fonctionnel avec un `score` et un `predict_proba` fonctionnels.
- ✅ Les lignes de `batch` prédisent sainement : tout à gauche classe 0 fortement, tout à droite classe 1 fortement, centre ambigu.

**🤔 Question(s) socratique(s)**

- L'artefact fait 1,6 Ko pour 300 lignes d'entraînement. Où « vit » réellement le modèle — les coefficients et moyennes du scaler, ou les données d'entraînement ? Si les données ne sont jamais expédiées avec l'artefact, qu'est-ce que cela signifie pour la vie privée et pour le ré-entraînement plus tard ?
- `predict` a donné des classes dures et `predict_proba` des confiances. Un tableau de bord qui interroge « 0.24 de chance de panne » pour la ligne 3 — alerterais-tu à `> 0.5` ? Formule ce qu'une variable de *seuil de décision* ajouterait au pipeline au-delà du modèle.

## ⚠️ Pièges courants

- **Laisser fuir le jeu de test dans le prétraitement.** Ajuste l'imputer/scaler sur `train` seulement ; appeler `fit_transform` sur les 400 lignes entraîne sur les données que tu « prédiras » plus tard. La division vient en premier, toujours.
- **Ajuster sur le jeu de test.** `GridSearchCV` avec `test` dans le fit attrape la connaissance de la feuille de réponses. Cherche sur `train` ; ne sonder `test` qu'une fois, à la fin.
- **`value_counts` après le retournement.** Le bruit d'étiquette de 5 % rend l'équilibre `{1: 208, 0: 192}`, pas 200/200. Affirmer l'égalité exacte revient à affirmer que le bruit n'a pas tourné.
- **Imputer avec `fit` contre `fit_transform`.** Sur un évaluateur en flux continu, tu dois `transform` avec l'imputer *ajusté* — `fit` sur une seule ligne réapprendrait la médiane depuis elle et exploserait.
- **Deux graines RNG mélangées.** `default_rng(7)` contrôle les données, `default_rng(1)` contrôle la présence de valeurs manquantes. Échange-les et *tous* les nombres en aval changent ; garde-les documentées.
- **Décalage de version `joblib`.** Un blob dumpé par sklearn 1.4 chargé dans 1.6 marche en général, mais les garanties inter-versions s'appliquent aux mêmes bundles installés ; `joblib.dump`/`load` dans le même environnement est l'aller-retour sûr.

## Ce que tu viens de construire

Une vraie boucle de pilote automatique sur un portable : données synthétiques ensemencées, division stratifiée, pipeline d'imputation-et-mise-à-l'échelle qui n'apprend que sur train, honnête course à trois modèles via validation croisée, recherche par grille dont les chiffres CV et test divergent visiblement, et un vainqueur sérialisé en `joblib` que tu peux recharger dans n'importe quel processus. Les idées qui survivent au contact de la production sont les *frontières* : division train/test d'abord, préprocesseurs qui apprennent seulement de train, modèles choisis par validation croisée mais rapportés par un jeu de test intact, et ajustement mesuré deux fois (une fois pour choisir, une fois pour rapporter). C'est la différence entre « mon modèle a marqué 0.93 » et « mon modèle a marqué 0.91, et voici le chiffre CV que j'ai utilisé pour choisir la configuration ».

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/automl-pipeline/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/automl-pipeline) dans le dépôt du cours est le pipeline complet comme notebook — jeu de données, prétraitement, zoo, balayage et export, exécutables dans Colab/Kaggle/Binder. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute un ensemble « dev » comme troisième tenir-de-côté : ajuste sur train, choisis la config sur dev, et rapporte sur test — la façon documentée d'arrêter l'optimisme d'ajustement sans CV imbriquée.
- Alimente chaque modèle du zoo avec le *même* pipeline imputé+mis à l'échelle (pas les caractéristiques brutes) et enregistre si l'avantage de logistic vient du prétraitement ou du modèle.
- Trace les scores de plis CV comme un diagramme en boîte dans ta bibliothèque de tracé préférée — les étalements te disent quel modèle est fragile avant qu'il ne parte en production.
- Enveloppe le blob exporté dans un minuscule CLI : `uv run autopilot.py --model autopilot.joblib <bytes_in> <bytes_out>` affiche l'étiquette prédite et la confiance.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier·e ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README contient un tutoriel complet, accessible aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, étape par étape. Aucune expérience git préalable n'est requise.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓