---
title: "Moteur de Recommandations"
description: "Construisez des recommandeurs collaboratifs et basés sur le contenu à partir de vraies données de notations, similarité, prédiction, classement et fusion hybride avec NumPy, pandas, et scikit-learn."
difficulty: "advanced"
estimatedMinutes: 240
tags: ["numpy", "pandas", "scikit-learn", "machine-learning", "cosine-similarity"]
learningObjectives:
  - "Représenter un jeu de données de notations comme une matrice d'utilité utilisateur-élément"
  - "Calculer des voisinages de similarité cosinus entre utilisateurs et entre éléments"
  - "Prédire les notations manquantes à partir des moyennes des plus proches voisins et mesurer l'erreur"
  - "Construire des profils basés sur le contenu à partir des attributs d'éléments et fusionner un recommendeur hybride"
prerequisites: ["python-101/libraries", "data-analysis/pandas", "data-analysis/groupby-aggregation", "numpy-101/arrays"]
---

# 🎯 Construire un Moteur de Recommandations

Un moteur de recommandations est le moteur silencieux de l'économie internet : le « Vous avez regardé deux épisodes, voici une série que vous finirez ce week-end » de Netflix, le « Les clients comme vous ont aussi acheté » d'Amazon, l'autoplay de YouTube. Sous le capot, c'est étonnamment sans glamour, une matrice d'utilisateurs par éléments, la plupart des cellules vides, et tout l'art consiste à combler les trous de manière plausible avec une mathématique appelée *similarité*. La même algèbre linéaire qui alimente le travail pandas du cours monte d'échelle vers les deux grandes familles que tu construiras ici : le **filtrage collaboratif** (dériver le goût depuis les notations des autres utilisateurs) et le **filtrage basé sur le contenu** (apparier de nouveaux éléments aux profils des choses que tu as déjà notées). À la fin, tu auras un hybride fonctionnel qui fait des recommandations réellement sensées sur un vrai jeu de données de 100k notations.

Cela suppose le Python 101 plus une connaissance pratique de `pandas` et du calcul matriciel NumPy, les modules d'analyse de données du cours. Pas d'apprentissage profond, pas de systèmes à l'échelle industrielle. C'est optionnel et non noté ; vois [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Charger un vrai jeu de données de notations dans une matrice d'utilité utilisateur-élément et explorer sa rareté (sparsité).
2. Calculer la similarité cosinus entre utilisateurs et entre éléments avec des opérations vectorielles NumPy.
3. Prédire les notations manquantes à partir des moyennes des plus proches voisins et noter ta précision avec la MAE.
4. Construire des profils basés sur le contenu à partir des genres/attributs d'éléments et générer des recommandations d'éléments.
5. Fusionner les scores collaboratif et basé sur le contenu dans un recommendeur hybride et le vérifier par bon sens.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal : le jeu de données MovieLens se charge sous forme de CSV plats que tu peux fouiller avec `pandas`, et tout le pipeline (balayer les comptages de plus proches voisins, comparer les erreurs, imprimer des raisons expliquables « parce que tu as aimé ») est interactif dans un terminal. `uv add numpy pandas scikit-learn` couvre tout.

**GitHub Codespaces** te donne l'expérience identique : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et chaque commande s'exécute dans un onglet de navigateur contre le même jeu de données.

**Google Colab, les notebooks Kaggle et Binder exécutent honnêtement le pipeline de calcul**, la matrice de notations est ~100k vraies notations qui tiennent confortablement en mémoire, la similarité cosinus est de l'algèbre linéaire, et le jeu de données est le même fichier MovieLens public que les étudiants utilisent toujours, donc les nombres dans ton notebook correspondent aux nombres dans ta tête. Pas de clés API, pas de GPU. La seule chose que tu ne peux pas faire dans un notebook, c'est importer ton propre agencement de fichiers, et dès l'instant où tu veux un service qui sert des recommandations sur HTTP, ce pic est local.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recommendation-engine/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recommendation-engine/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frecommendation-engine%2Fnotebook.fr.ipynb)

## Configuration

Mets la boîte à outils et le jeu de données sur disque avant le premier produit scalaire vectoriel.

### Installe `uv` et les dépendances

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis :

```bash
uv --version
mkdir recommendation-engine && cd recommendation-engine
uv init --bare
uv add numpy pandas scikit-learn
```

### Télécharge le jeu de données MovieLens 100k

```bash
mkdir -p data
curl -L -o data/ml-100k.zip https://files.grouplens.org/datasets/movielens/ml-100k.zip
unzip -o data/ml-100k.zip -d data
ls data/ml-100k/ | head -20
```

Les trois fichiers dont tu as réellement besoin : `u.data` (notations : `user item rating timestamp`), `u.item` (métadonnées de films, délimité par `|`, genres dans les 19 dernières colonnes), et `u.user` (`user age ... occupancy`). Tout le reste est de la documentation.

**✅ Liste de vérification**

- ✅ `uv --version` affiche une version ; `numpy`, `pandas`, `scikit-learn` installés via `uv add`.
- ✅ `data/ml-100k/u.data` existe et `head -3` montre des lignes `user item rating timestamp`.
- ✅ `data/ml-100k/u.item` existe (pipes), `data/ml-100k/u.user` existe (délimité par `|` aussi).

## Étape 1 : Charge les notations dans une matrice utilisateur-élément

Les moteurs de recommandations vivent et meurent selon la façon dont le journal d'événements brut devient une matrice. Un tableau `utilisateur × élément` avec des notations dans les cellules, et une majorité écrasante de cellules vides, car chaque utilisateur ne note que quelques films parmi un millier, est la forme canonique. Cette étape la produit et mesure à quel point elle est rare (sparse).

**👟 Indice de départ :** Commence par écrire `load_ratings(path)` qui lit `u.data` avec `pd.read_csv(..., sep="\t", header=None)` et les quatre noms de colonnes, puis imprime `head()`, vois les lignes d'événements brutes avant de les remodeler en une matrice.

```python
# engine.py
import numpy as np
import pandas as pd

RATINGS = "data/ml-100k/u.data"
ITEMS = "data/ml-100k/u.item"

def load_ratings(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep="\t", header=None,
                     names=["user", "item", "rating", "ts"])
    return df

ratings = load_ratings(RATINGS)
print(ratings.head())
print(f"users={ratings['user'].nunique()} items={ratings['item'].nunique()} "
      f"total={len(ratings)}")

matrix = ratings.pivot_table(index="user", columns="item", values="rating")
print("matrix shape:", matrix.shape)
print("sparsity  :", f"{(1 - matrix.notna().sum().sum() / (matrix.shape[0] * matrix.shape[1])):.4%}")
```

`pivot_table` est la fabrique de matrices en une ligne : index=utilisateurs, colonnes=éléments, valeurs=notations, et chaque paire non notée retombe en `NaN`, ce qui est exactement ce que nous voulons, car `NaN` *est* le problème de recommandation : combler les trous. La ligne de sparsité est la vérification de réalité d'ingénierie : à ~94–95 %, elle répond à « combien de la matrice connaissons-nous réellement ? » avant toute recommandation, et la réponse est la justification de tout le domaine du *filtrage collaboratif* (nous devons inférer depuis les votes des autres utilisateurs).

**🎯 Résultat attendu :** Cinq lignes de notations séparées par des tabulations, `users=943 items=1682 total=100000`, une matrice sparse `943×1682`, et une sparsité ~94-95 %.

**🩹 Si ça ne marche pas :** Si `u.data` ne se parse pas, le téléchargement n'a pas abouti, vérifie la taille du fichier (≈1,9 Mo) et relance le `curl`. Si la sparsité s'imprime à ~0 %, `pivot_table` a comblé les trous avec 0 au lieu de `NaN`, ne passe pas de `fill_value` (le défaut laisse les trous en `NaN`, alors qu'un `fill_value=0` explicite marque silencieusement chaque élément non noté comme « détesté », ce qui corrompt chaque similarité ultérieure).

**✅ Liste de vérification**

- ✅ `matrix.shape == (943, 1682)` avec des trous `NaN`.
- ✅ Tu peux imprimer la colonne globale d'un utilisateur (`matrix.loc[1].nunique()`) et elle fait ~20-30.
- ✅ Tu peux énoncer pourquoi l'emptitude à 94 % est *intéressante* plutôt qu'un bug.

**🤔 Question(s) socratique(s)**

- Une densité de ~6 % signifie que 94 % de la grille est inconnue. Si un utilisateur a voté sur 30 films, une « recommandation » pourrait signifier « surtout du hasard ». Quelle hypothèse le filtrage collaboratif doit-il *tenir* d'un bout à l'autre des utilisateurs (à propos du goût partagé) avant que ces suppositions gagnent la confiance ?
- `pivot_table` nous donne `NaN` pour le non noté. Pourquoi est-ce un vrai risque de pré-remplir avec `0` ? Que ferait-ce à la similarité cosinus pour un utilisateur qui déteste par coïncidence tout ce qu'il a essayé ?

## Étape 2 : Calcule la similarité cosinus utilisateur-utilisateur

La monnaie centrale du moteur est la *similarité*, un nombre disant à quel point les goûts de deux utilisateurs sont proches. La similarité cosinus compare deux vecteurs de notations comme des directions : les utilisateurs qui notent des choses similaires (à l'échelle) obtiennent un cosinus élevé, qu'ils utilisent ou non toute l'échelle 0–5, car le cosinus ignore la magnitude. La vectorisation de NumPy transforme une comparaison `ligne × ligne` en une multiplication diffusée sur une matrice.

**👟 Indice de départ :** Commence par écrire `cosine_similarity(a, b)` qui masque `NaN` avec `~np.isnan` avant le produit scalaire, et vérifie-la sur deux vecteurs de notations identiques, ils devraient retourner `1.0`, avant de la pointer sur la matrice utilisateur complète.

```python
# engine.py (suite)
import numpy as np

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a = a[~np.isnan(a)]
    b = b[~np.isnan(b)]
    # NaNs collapse — compare seulement les notations communes de la paire
    a0, b0 = a[: min(len(a), len(b))], b[: min(len(a), len(b))]
    if a0.size == 0:
        return 0.0
    denom = np.linalg.norm(a0) * np.linalg.norm(b0)
    return float(np.dot(a0, b0) / denom) if denom > 0 else 0.0

users = ratings["user"].unique()
test = matrix.loc[[users[0], users[1]]].to_numpy()
print("cos(user 1, user 2):", cosine_similarity(test[0], test[1]))
```

Le détail critique est le masque : `~np.isnan` laisse tomber les trous, donc nous ne comparons que les films que les deux utilisateurs ont réellement notés, une intersection, pas le vecteur complet. `np.dot(a0, b0) / (|a0|·|b0|)` est le cosinus du manuel ; la garde `0.0` attrape le cas dégénéré tout-à-zéro où le dénominateur exploserait. Toute la comparaison fait ~4 lignes de NumPy, et c'est la vérité des mathématiques de recommendeur : l'algorithme est simple, l'hygiène des données est là où atterrit le vrai travail.

**🎯 Résultat attendu :** Un flottant typiquement dans `[0, 0.3]` pour des utilisateurs appariés au hasard, la plupart des scores de similarité-confort atterrissent bas, et c'est correct : les utilisateurs partagent quelques genres, pas tout le goût de l'autre.

**🩹 Si ça ne marche pas :** Si tu obtiens `nan`, deux utilisateurs n'ont partagé *aucun* élément noté en commun et les tableaux masqués font une longueur 0, la tranche `min(...)` a réduit les deux à 0 et la garde `size == 0` aurait dû retourner `0.0` ; si tu as retiré la garde, restaure-la. Si les scores s'accrochent à `1.0` pour tout le monde, le masque est cassé et les NaNs fuient dans le produit scalaire.

**✅ Liste de vérification**

- ✅ L'appel jouet imprime un flottant dans `[0, 1]`, et pour des paires d'utilisateurs aléatoires, il est petit.
- ✅ Deux vecteurs de notations identiques produisent `1.0` (vérification console : `cosine_similarity(np.array([5.,5.,0.]), np.array([5.,5.,0.]))`).

**🤔 Question(s) socratique(s)**

- Le cosinus ignore la magnitude, un utilisateur qui note tout 4–5 et un autre qui note 0–1 peuvent quand même être proches de 1.0 en cosinus si leurs *classements* concordent. Quand cette convivialité est-elle la bonne pour des recommandations, et quand une *corrélation de Pearson* (notations centrées) serait-elle le choix plus sûr, nomme un scénario réel de goût de films ?
- Laisser tomber les NaNs pour ne comparer que l'intersection est le plus proche voisin pour un sous-ensemble de notations conjointes. Si deux utilisateurs partagent un seul film, le cosinus sur cette paire est `1.0` (n'importe quoi est similaire à un point unique). Quel seuil devrais-tu imposer (minimum d'éléments communs), et où regimbe-t-il contre « des voisinages plus grands à la rescousse » ?

## Étape 3 : Prédictions collaboratives, moyenne des k plus proches utilisateurs

La similarité seule ne recommande pas ; *l'agrégation* le fait. Étant donné un utilisateur et un film qu'il n'a pas noté, la prédiction collaborative est : trouve les k utilisateurs les plus similaires à lui, moyenne leurs notations pour ce film (pondérée par la similarité si tu veux te faire plaisir), et cette moyenne est la supposition. La raison pour laquelle cela marche est le pari du « cercle de confiance » : les gens au goût identique sur ce que nous avons en commun concordent sur ce que nous n'avons pas.

**👟 Indice de départ :** Commence par écrire `predict_rating(ratings, matrix, u, m, k)` : boucle sur chaque autre utilisateur, calcule `cosine_similarity`, garde les utilisateurs qui ont noté le film `m` et franchissent la porte `sim > 0.1`, puis retourne la moyenne pondérée par la similarité de leurs notations pour `m`.

```python
# engine.py (suite)

def predict_rating(root: pd.DataFrame, matrix: pd.DataFrame, u: int, m: int, k: int = 10) -> float:
    target = matrix.loc[u]
    scores = {}
    for v in matrix.index:
        if v == u:
            continue
        sim = cosine_similarity(target.to_numpy(), matrix.loc[v].to_numpy())
        if pd.notna(matrix.loc[v, m]) and sim > 0.1:
            scores[v] = sim
    neighbors = sorted(scores, key=scores.get, reverse=True)[:k]
    if not neighbors:
        return float("nan")
    numer = sum(scores[v] * matrix.loc[v, m] for v in neighbors)
    return numer / sum(scores[v] for v in neighbors)

movie = 50
for u in [1, 42, 200]:
    print(f"user {u} predict movie {movie}: "
          f"{predict_rating(ratings, matrix, u, movie, k=10):.2f}")
```

La boucle est de la force brute (chaque autre utilisateur, chaque appel), horriblement lente par design ; la production utilise des mathématiques matricielles complètes vectorisées et des recherches O(1). Petit et correct bat rapide et compliqué ici. La porte `sim > 0.1` plus les k voisins est la paire de réglage à deux boutons (à quel point « similaire » compte comme « similaire », et quelle taille de cercle). La moyenne pondérée `sum(sim·rating)/sum(sim)` est un prédicteur d'à peine 3 lignes qui a porté de vrais moteurs du monde réel.

**🎯 Résultat attendu :** Des flottants raisonnables autour de 3–4 pour les trois utilisateurs, le minuscule échantillon est dimensionné pour des « nombres sensés », pas une précision de production ; une seule différence de notation de ±0,5 apparaît déjà sur une décimale.

**🩹 Si ça ne marche pas :** Si cela imprime `nan`, aucun voisin n'a franchi la porte `sim > 0.1`, le film ou l'utilisateur est trop sparse ; abaisse la porte à `0.05` ou descend à `k=5`. Si chaque prédiction fait ~4,5 (petite variance), le plus proche utilisateur domine ; réduis `k` à 3 et regarde la variance revenir. Si cela prend 40 s pour trois prédictions, c'est le coût attendu de la force brute, encode la leçon « horloge murale = complexité », ne l'optimise pas encore.

**✅ Liste de vérification**

- ✅ Trois prédictions s'impriment, toutes dans `[1, 5]`, et `nan` seulement quand aucun voisin qualifié n'existe.
- ✅ Un utilisateur qui a noté le film cible 5, prédit via ses voisins, atterrit près de 4-5 : le cercle de confiance reproduit le goût.
- ✅ Tu peux expliquer le rôle de *à la fois* `k` (le courage) et la porte (la pureté) en une phrase.

**🤔 Question(s) socratique(s)**

- La prédiction est une moyenne pondérée dont les poids sont des similarités. Si tu remplaces par une moyenne *non* pondérée (`1/k`), qu'arrive-t-il à un utilisateur dont l'unique voisin similaire se trompe complètement pour ce film particulier ? Comment la pondération se dégrade-t-elle gracieusement (et quand ne le fait-elle pas, pense « un seul voisin à haute similarité avec une notation ») ?
- Le cas `nan` est une supervision réelle d'un coin sparse. Pour un démarrage à froid de nouvel utilisateur (aucune notation), *chaque* film retourne `nan` depuis cette méthode. C'est le mur de briques que ton moteur frappe dès l'instant où il rencontre un tout nouvel utilisateur, et exactement pourquoi l'Étape 4 (basée sur le contenu) existe. Articule comment un hybride couvre le trou que la collaboration ne peut pas voir.

## Étape 4 : Filtrage basé sur le contenu à partir des attributs d'éléments

Le filtrage collaboratif meurt au démarrage à froid, un nouveau film (pas encore de notations), un nouvel utilisateur (pas d'historique). Le basé sur le contenu ignore complètement les autres utilisateurs : il décrit *les éléments* par leurs propres attributs (genres, étiquettes, mots-clés) et prédit « si tu as aimé l'élément A, tu aimeras d'autres éléments dont le profil d'attributs ressemble à celui d'A ». Le moteur échange la foule contre la propre empreinte de l'élément, et soudain les nouveaux films et les nouveaux utilisateurs sont recommandables dès qu'ils existent.

**👟 Indice de départ :** Commence par écrire `load_items(path)` qui lit `u.item` avec `sep="|"` et garde `item`, `title`, et les colonnes de genres, puis construis `content_profile(items, rated)` comme la somme pondérée par la notation des lignes de genres des éléments notés.

```python
# engine.py (suite)
ITEMS_COLS = ["item", "title", "date", "video", "url"] + [f"g{i}" for i in range(19)]
GENRES = ["Action", "Adventure", "Animation", "Children's", "Comedy", "Crime",
          "Documentary", "Drama", "Fantasy", "Film-Noir", "Horror", "Musical",
          "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"]

def load_items(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep="|", header=None, names=ITEMS_COLS,
                     encoding="latin-1")
    df = df[["item", "title"] + GENRES].copy()
    for g in GENRES:
        df[g] = df[g].fillna(0)
    return df

items = load_items(ITEMS)
print(items.shape, items.head(2).loc[:, ["item", "title"]].to_dict("records"))

def content_profile(items: pd.DataFrame, rated: dict) -> np.ndarray:
    profile = np.zeros(len(GENRES))
    for item, r in rated.items():
        row = items.loc[items["item"] == item]
        if row.empty:
            continue
        profile += r * row.iloc[0][GENRES].to_numpy()
    return profile

profile = content_profile(items, {m: v for m, v in {
    1: 5, 50: 3, 100: 4}.items()})
print("genre profile:", dict(zip(GENRES, profile.round(2))))
```

Le basculement se résume aux *vecteurs de caractéristiques* : chaque film est un vecteur binaire sur les genres (1 s'il s'agit d'un Drama, sinon 0), et un « profil utilisateur » est la *somme pondérée par la notation* des genres de tout ce qu'il a aimé, `Documentary: 5.0` à côté de `Horror: 0.0` dit « cet utilisateur a regardé un documentaire et l'a noté 5 ». Après cela, la correspondance film-vers-profil n'est plus, encore une fois, que de la similarité cosinus, la même mathématique qu'à l'Étape 2, appliquée aux attributs d'éléments au lieu des notations d'utilisateurs. `encoding="latin-1"` gère les octets de titres de la fin des années 90 ; le `fillna(0)` avale les chaînes vides que certaines cellules cachent.

**🎯 Résultat attendu :** Un cadre d'éléments `1682×20` (`item`, `title`, 18 drapeaux de genres) et un profil de genres pour les notations jouets, par ex. `{'Documentary': 5.0, 'Drama': 4.0, ...}` où les genres que tu as notés haut dominent.

**🩹 Si ça ne marche pas :** Si `items` n'a pas de colonnes de genres, `GENRES` ne correspond pas aux 19 champs pipe de fin de `u.item`, compte les colonnes dans une ligne brute ; le nom de fichier `u.item` utilise `|`, donc `sep="|"` est obligatoire. Si le profil est tout à zéro, `row.empty` a été atteint pour chaque élément, les IDs d'`item` dans ton dict `rated` n'existent pas dans `u.item` ; imprime `items["item"].min()/max()` et aligne les IDs.

**✅ Liste de vérification**

- ✅ `items.shape == (1682, 20)` et les colonnes de genres sont des flottants 0/1.
- ✅ Le profil est un vecteur de longueur 19 où les genres des éléments notés dominent.
- ✅ Tu peux classer les films pour le profil jouet par cosinus et obtenir des correspondances de genres (profil à drama élevé → drames en premier).

**🤔 Question(s) socratique(s)**

- Le profil est une moyenne pondérée de drapeaux de genres, et les genres sont un langage *grossier* (un film est à la fois Drama et Romance). Quand tu sommes des vecteurs, un utilisateur qui n'aime que la moitié romantique des Romantiques-Drames voit aussi le poids du Drama. Nomme la torsion du monde réel où cela confond le goût, et un second attribut au-delà des genres qui atténuerait *encore* le bruit (réalisateur ? acteurs ? mots-clés ? décennie de sortie ?).
- Tout dans le basé sur le contenu orbite autour des *propres* descripteurs de l'élément, donc une recommandation de film est expliquable : « tu as aimé Drama + Documentary ». Déclare l'échec le moment où le basé sur le contenu *seul* est la réponse dans une plateforme où des millions notent tout, quel est l'angle mort qui rend la collaboration indispensable ?

## Étape 5 : Fusion hybride, combine les deux signaux

Jette un moteur de recommandations dans un vrai codebase et la question n'est pas « collaboratif ou basé sur le contenu ? », c'est « comment mélangeons-nous les deux, et quand chacun gagne-t-il ? » L'hybride est une *fusion* : choisis des voisins pour la prédiction collaborative, construis un profil de contenu depuis l'historique de l'utilisateur, et combine les deux en une seule liste classée avec un poids `α` (0 = contenu seul, 1 = collaboration seule). Le bouton alpha est toute l'histoire du réglage, petit pivot, grand saut.

**👟 Indice de départ :** Commence par écrire `recommend(items, matrix, u, k, alpha, n)` : rassemble les éléments notés de l'utilisateur, construis un profil de contenu, puis note chaque film non noté comme `alpha * collab + (1 - alpha) * content` et classe le top `n`.

```python
# engine.py (suite)

def recommend(items: pd.DataFrame, matrix: pd.DataFrame, u: int, k: int = 10,
              alpha: float = 0.5, n: int = 5) -> list[tuple]:
    rated = {m: matrix.loc[u, m] for m in matrix.columns if pd.notna(matrix.loc[u, m])}
    profile = content_profile(items, rated)
    scores = {}
    for m in matrix.columns:
        if m in rated:
            continue  # ne recommande pas ce qui a déjà été vu
        collab = predict_rating(ratings, matrix, u, m, k=k)
        content = cosine_similarity(profile, items.loc[items["item"] == m, GENRES].to_numpy()[0]) if not items.loc[items["item"] == m].empty else 0.0
        scores[m] = (alpha * collab if pd.notna(collab) else 0) + (1 - alpha) * content
    ranked = sorted(scores, key=scores.get, reverse=True)[:n]
    return [(items.loc[items["item"] == m, "title"].iloc[0], round(scores[m], 3)) for m in ranked]

for alpha in [0.0, 1.0]:
    print(f"alpha={alpha}")
    for title, s in recommend(items, matrix, 1, k=10, alpha=alpha):
        print("  ", title, s)
```

Le secret de la fusion, c'est que `alpha` *façonne la même liste classée*, `0.0` classe purement par le goût de genre observé de l'utilisateur tandis que `1.0` classe purement par les votes du voisinage, et le point idéal interpole les profils de risque : sur les utilisateurs sparse, le contenu secourt la queue ; sur les utilisateurs denses, la collaboration gagne la tête. Deux exécutions, même utilisateur, et tu regardes le top 5 se mélanger, c'est tout l'argument « pourquoi hybride » mesuré à l'écran. `alpha * collab` protège le `nan` collaboratif manquant en le remettant à zéro, donc un élément froid ne tire jamais une recommandation à zéro par accident.

**🎯 Résultat attendu :** Pour `alpha=0.0`, une liste pilotée par les genres (les genres favoris de l'utilisateur 1 visibles dans les titres) ; pour `alpha=1.0`, une liste pilotée par les voisins qui diffère visiblement ; des scores sensés dans `[0, 1]` après la somme pondérée.

**🩹 Si ça ne marche pas :** Si un alpha imprime des listes identiques, `predict_rating` retourne `nan` pour chaque élément et `scores` est effectivement contenu-seul, relève la porte ou réduis `k` ; un `collab` nul ne devrait pas dominer. Si les scores dépassent 1, la somme pondérée par alpha a ajouté un décalage de distribution (cosinus `[0,1]` contre moyenne de voisins `[0,5]`), normalise le bras collab (`/5`) pour que alpha interpole des pommes avec des pommes. Si cela prend des minutes pour un utilisateur, la force brute `predict_rating` par élément se cumule, c'est attendu ; vectorise plus tard, ou réduis `k` et le nombre de colonnes candidates pour garder la démo vivante.

**✅ Liste de vérification**

- ✅ Deux exécutions d'alpha produisent des listes top-5 visiblement *différentes* pour le même utilisateur.
- ✅ Les éléments à démarrage à froid (aucun voisin noté) se classent quand même via le bras contenu à `alpha < 1`.
- ✅ Les scores restent dans une plage comparable, et tu peux dire quand chaque bras gagne.

**🤔 Question(s) socratique(s)**

- À `alpha=0`, la liste est du contenu pur ; à `alpha=1`, de la collaboration pure. Décris une expérience *mesurable* (un ensemble de retenue, une MAE sur les notations retenues) qui te *dirait* quel alpha gagne pour ton jeu de données, et le piège de régler alpha sur les mêmes données que tu rapportes.
- Les nouveaux utilisateurs arrivent avec une poignée de clics jetables ; le moteur doit recommander à partir de presque rien. La fusion laisse le contenu porter les premières douzaines de recommandations. Quelle est la raison plus profonde pour laquelle une collaboration pure devient *pire* avant de devenir meilleure à mesure que ta base d'utilisateurs grandit de 50 à 5 000, et pourquoi la « moyenne des voisins » vieillit mal dans les régimes les plus denses ?

## ⚠️ Pièges courants

- **Une grille `NaN` remplie qui empoisonne silencieusement tout.** Pré-remplir les cellules non notées avec `0` les marque « détestées », ce qui tire la similarité cosinus vers une similarité-par-non-regard et gonfle chaque produit scalaire de zéros. Garde les trous `NaN` ; masque-les (`~np.isnan`) à chaque comparaison.
- **Comparer des zéros bruts depuis une échelle non normalisée.** Deux utilisateurs au goût identique, l'un notant tout 4-5 et l'autre 0-1, apparaissent comme un cosinus bas même si les classements concordent. Centre les notations (soustrais la moyenne de chaque utilisateur) avant la similarité, c'est-à-dire Pearson, quand la discipline d'échelle compte.
- **Une notation partagée ⇒ similarité 1.0.** Deux utilisateurs avec un seul film commun sont « identiques » selon le cosinus. Restreins par une taille d'intersection minimale (par ex. 3 notations communes) pour empêcher les sosies dégénérés de dominer le voisinage.
- **Démarrage à froid sans échappatoire de contenu.** Un tout nouveau film (aucune notation) ne peut pas être prédit par la collaboration et un tout nouvel utilisateur ne peut pas former de voisinage. Les deux sont exactement ce que le bras contenu existe pour couvrir, un hybride qui ne mêle pas d'attributs n'est hybride que de nom.
- **Régler alpha sur le rapport lui-même.** Choisir `α` en regardant « ce qui a l'air joli » sur l'ensemble d'entraînement sur-ajuste la démo. Retiens une tranche de notations, choisis l'alpha qui minimise la MAE sur cette tranche retenue, et rapporte *ce* nombre, la discipline dont tu aurais réellement besoin en production.

## Ce que tu viens de construire

Un vrai moteur de recommandations : tu as chargé le jeu de données MovieLens 100k dans une matrice utilisateur-élément 943×1682, mesuré sa sparsité de 94 %, calculé la similarité cosinus utilisateur-utilisateur en NumPy, prédit des notations retenues avec une moyenne pondérée de k plus proches utilisateurs, construit un bras de contenu à profil de genres depuis les attributs d'éléments, et fusionné les deux en une liste classée réglable. Deux familles de mathématiques de recommandation qui alimentent des systèmes de production, un jeu de données, ~150 lignes de code visible. Les morceaux transférables vont bien au-delà des films : l'habitude de similarité masquée, la discipline « fusionne, règle sur un ensemble de retenue, rapporte-la », et le moment où tu *ressens* l'argument de sparsité comme un nombre au lieu d'une métaphore.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/recommendation-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/recommendation-engine) dans le dépôt du cours regroupe le moteur complet, le chargeur de données MovieLens, et un notebook qui charge, dépivote, note et règle l'hybride en intégré. Clone le dépôt, ou ouvre-le dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute les cinq étapes de bout en bout.
:::

## Où aller à partir d'ici

- **Ajoute une évaluation propre :** divise les notations 80/20 en entraînement/test, mesure la MAE sur la tranche retenue pour les deux bras (et chaque alpha) depuis une config YAML, et imprime le gagnant. C'est le seul ajout qui transforme une démo en un moteur défendable.
- **Vectorise le voisinage :** remplace la force brute `for`-sur-les-utilisateurs par un appel de similarité matricielle complète (normalise d'abord), tu verras une boucle de minutes-par-utilisateur tomber à des millisecondes et goûteras le gain d'ingénierie de l'habitude NumPy.
- **Sers une API :** enveloppe `recommend` dans un point de terminaison `FastAPI` (`/recommend/{user_id}?alpha=0.6`) avec une table d'éléments compatible requête, la même fonction, désormais joignable sur HTTP, plus un badge que tu peux ouvrir dans un navigateur.
- **Essaie l'autre jeu de données :** remplace `u.data` par les divisions formelles `u1.base`/`u1.test` expédiées dans le même téléchargement `ml-100k`, et rapporte la MAE de l'ensemble de test quand alpha est réglé sur la division d'entraînement. L'écart des nombres est un regard honnête sur la généralisation.

## Partage ton projet avec la classe

Tu as un recommendeur qui bat le hasard, une fusion hybride dont tu es fier, ou un moteur évalué avec une MAE que tu peux citer ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README t'accompagne dans l'ajout du tien via une **pull request** de bout en bout : forker, créer une branche, commiter, et ouvrir la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
