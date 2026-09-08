---
title: "Analyseur de Données Géospatiales"
description: "Analyser et visualiser les données géographiques avec clustering, cartes de chaleur et optimisation d'itinéraires."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["data-viz", "geospatial", "scikit-learn"]
learningObjectives:
  - "Charger et manipuler des données de coordonnées géographiques avec pandas"
  - "Regrouper des points spatiaux avec DBSCAN pour trouver des groupements naturels"
  - "Calculer des distances entre coordonnées avec la formule de Haversine"
  - "Générer une visualisation en carte de chaleur de la densité de points sur une vraie carte"
prerequisites: ["Python 101", "Data Analysis"]
---

# 🌍 Construis un Analyseur de Données Géospatiales

Chaque course de covoiturage, chaque livraison, chaque relevé de station météo est un point sur le globe décrit par deux nombres : latitude et longitude. Ce projet construit un outil d'analyse géospatiale qui prend des données de coordonnées brutes et répond à de vraies questions : où sont les grappes d'activité, à quelle distance deux lieux sont-ils l'un de l'autre, et à quoi ressemble la densité de points sur une carte. Tu utiliseras DBSCAN pour le regroupement spatial, la formule de Haversine pour les calculs de distance réels et Folium pour les visualisations cartographiques interactives — le tout ancré dans de véritables données géographiques.

Ceci suppose Python 101 et une aisance avec pandas de Data Analysis — rien de plus. Optionnel et non noté ; voir [Real-World Projects](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Configurer un projet avec `uv` et installer les dépendances géospatiales dont tu auras besoin.
2. Charger et nettoyer un jeu de données d'exemple de coordonnées géographiques.
3. Regrouper les points proches avec DBSCAN pour trouver des groupements naturels dans les données.
4. Calculer des distances réelles entre coordonnées avec la formule de Haversine.
5. Générer une carte de chaleur interactive montrant la densité de points sur une carte.
6. Trouver l'itinéraire optimal à travers plusieurs points de passage.

## Où exécuter ceci

**Localement avec `uv`** est la voie principale — la carte interactive Folium se rend dans ton navigateur, ce qui est plus fiable que le panneau de sortie d'un notebook.

**Google Colab, Kaggle Notebooks et Binder** fonctionnent bien pour essayer l'outil. Le notebook installe les mêmes packages et utilise le même code ; les cartes Folium se rendent en ligne dans Colab et Kaggle.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/geospatial-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/geospatial-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgeospatial-analyzer%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant d'analyser des coordonnées : un environnement Python, pandas, scikit-learn pour le regroupement, et Folium pour le rendu de cartes.

### Installer `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Ferme et rouvre ton terminal, puis confirme :

```bash
uv --version
```

### Initialiser le projet

```bash
uv init geospatial-analyzer
cd geospatial-analyzer
uv add pandas scikit-learn folium numpy
```

`pandas` gère les données, `scikit-learn` fournit le regroupement DBSCAN, `folium` rend les cartes interactives, et `numpy` est nécessaire pour les calculs Haversine. Aucune clé API externe requise — tout s'exécute en local.

### Créer la structure du projet

```bash
mkdir -p geo
touch geo/__init__.py geo/load.py geo/cluster.py geo/distance.py geo/visualize.py geo/route.py
```

**✅ Liste de vérification**

- ✅ `uv --version` imprime un numéro de version.
- ✅ `geospatial-analyzer/` existe avec un `pyproject.toml`, et `pandas`, `scikit-learn`, `folium` et `numpy` sont installés.
- ✅ Le répertoire `geo/` a tous les fichiers de modules requis.

## Étape 1 : Charger et nettoyer les données de coordonnées

Les données géographiques se présentent sous de nombreuses formes — fichiers CSV, API JSON, extractions de bases de données — mais pour l'analyse, elles finissent toujours par être un DataFrame avec au moins deux colonnes : `latitude` et `longitude`. Cette étape charge des données d'exemple et valide que les coordonnées sont réalistes.

### 1.1 Charger des données d'exemple

**👟 Indice de départ :** Crée un jeu de données d'exemple et charge-le dans un DataFrame, en validant les plages de coordonnées.

```python
# geo/load.py
import pandas as pd
import numpy as np

def generate_sample_locations(n: int = 50, seed: int = 42) -> pd.DataFrame:
    """Generate sample locations clustered around San Francisco."""
    rng = np.random.default_rng(seed)
    # Three cluster centers in the SF Bay Area
    centers = [(37.7749, -122.4194), (37.8044, -122.2712), (37.5585, -122.2711)]
    lats, lons = [], []
    for _ in range(n):
        center = centers[rng.integers(0, 3)]
        lats.append(center[0] + rng.normal(0, 0.01))
        lons.append(center[1] + rng.normal(0, 0.01))
    return pd.DataFrame({"latitude": lats, "longitude": lons, "label": [f"loc_{i}" for i in range(n)]})

def validate_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    """Filter out rows with invalid latitude or longitude."""
    before = len(df)
    df = df[(df["latitude"].between(-90, 90)) & (df["longitude"].between(-180, 180))]
    dropped = before - len(df)
    if dropped:
        print(f"Dropped {dropped} rows with out-of-range coordinates")
    return df.reset_index(drop=True)
```

La fonction `generate_sample_locations` crée des points regroupés autour de trois lieux réels de la Bay Area — cela rend les résultats de regroupement significatifs et les cartes reconnaissables. `validate_coordinates` filtre les coordonnées impossibles (latitude hors de -90 à 90, longitude hors de -180 à 180) avec un compte de ce qui a été retiré.

**🎯 Résultat attendu :** `generate_sample_locations(50)` renvoie un DataFrame avec 50 lignes et les colonnes `latitude`, `longitude`, `label`. `validate_coordinates` retire 0 ligne pour des données valides.

**🩹 Si ça ne marche pas :** Si les points générés ne se regroupent pas visiblement, vérifie la liste `centers` et l'écart-type (`0,01` degré équivaut à environ 1 km). Si les coordonnées sont hors des plages valides, l'étalement `rng.normal` est peut-être trop grand.

### 1.2 Vérifier le chargement des données

```python
# Quick test
df = generate_sample_locations(100)
assert len(df) == 100
assert df["latitude"].between(-90, 90).all()
assert df["longitude"].between(-180, 180).all()
print(df.head())
```

**🎯 Résultat attendu :** L'assertion réussit ; les 5 premières lignes montrent des coordonnées regroupées autour de la Bay Area de San Francisco.

**🩹 Si ça ne marche pas :** Si l'assertion échoue sur la plage de latitude, les coordonnées du centre sont peut-être inversées (lat vs lon).

### 1.3 Vérifier le chargement des données

**✅ Liste de vérification**

- ✅ `generate_sample_locations` renvoie un DataFrame avec les colonnes `latitude`, `longitude` et `label`.
- ✅ Toutes les coordonnées générées sont dans les plages géographiques valides.
- ✅ `validate_coordinates` retire les lignes invalides et rapporte le compte.

**🤔 Question(s) socratique(s)**

- Les données géographiques réelles ont souvent des valeurs manquantes, des points dupliqués ou des coordonnées à (0, 0). Comment étendrais-tu `validate_coordinates` pour attraper ces cas ?
- Si tu analyses des itinéraires de livraison, l'ordre des points compte — pourquoi l'ordre n'a-t-il pas d'importance pour l'étape de regroupement ?

---

## Étape 2 : Regrouper les points avec DBSCAN

DBSCAN regroupe les points qui sont proches et marque les points isolés comme du bruit — parfait pour les données spatiales où les grappes ont des formes irrégulières et où tu ne connais pas le nombre de grappes à l'avance. L'idée clé est que DBSCAN travaille sur la *distance*, pas seulement sur les coordonnées brutes, donc tu dois d'abord convertir lat/lon en kilomètres.

### 2.1 Convertir les coordonnées en radians et regrouper

**👟 Indice de départ :** Crée `geo/cluster.py` avec une fonction qui exécute DBSCAN sur des coordonnées géographiques en utilisant la métrique haversine.

```python
# geo/cluster.py
import numpy as np
from sklearn.cluster import DBSCAN

def cluster_locations(
    df,
    eps_km: float = 1.0,
    min_samples: int = 5,
) -> np.ndarray:
    """Cluster geographic points using DBSCAN with haversine distance.

    Args:
        df: DataFrame with 'latitude' and 'longitude' columns.
        eps_km: Maximum distance (km) between two points in the same cluster.
        min_samples: Minimum points to form a dense region.

    Returns:
        Array of cluster labels (-1 = noise).
    """
    coords_rad = np.radians(df[["latitude", "longitude"]].values)
    eps_rad = eps_km / 6371.0  # convert km to radians (Earth radius = 6371 km)
    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine")
    labels = db.fit_predict(coords_rad)
    return labels
```

La conversion de kilomètres en radians (`eps_km / 6371.0`) est cruciale — la métrique haversine de DBSCAN attend des radians, pas des degrés. Un degré de latitude fait environ 111 km à l'équateur, mais la formule de Haversine gère la courbure correctement. Les points étiquetés `-1` sont du bruit (n'appartenant à aucune grappe), et les grappes commencent à `0`.

**🎯 Résultat attendu :** `cluster_locations(df, eps_km=1.0, min_samples=5)` renvoie un tableau d'entiers où `-1` marque les points de bruit et `0, 1, 2, ...` marquent les affectations de grappes.

**🩹 Si ça ne marche pas :** Si chaque point est du bruit (`-1`), `eps_km` est trop petit — essaie de l'augmenter. Si tout est une gigantesque grappe, `eps_km` est trop grand ou `min_samples` est trop petit.

### 2.2 Attacher les étiquettes au DataFrame

```python
# geo/cluster.py (continued)
def add_cluster_labels(df, labels: np.ndarray):
    """Add cluster labels to the DataFrame and print summary."""
    df = df.copy()
    df["cluster"] = labels
    n_clusters = len(set(labels) - {-1})
    n_noise = (labels == -1).sum()
    print(f"Found {n_clusters} clusters, {n_noise} noise points")
    return df
```

**🎯 Résultat attendu :** Le résumé imprimé montre 3 grappes (correspondant aux trois centres des données d'exemple) et un petit nombre de points de bruit.

**🩹 Si ça ne marche pas :** Si le compte de grappes est faux, les paramètres `eps_km` ou `min_samples` ont besoin d'ajustement — le regroupement spatial exige toujours une exploration des paramètres.

### 2.3 Vérifier le regroupement

**✅ Liste de vérification**

- ✅ `cluster_locations` renvoie un tableau d'étiquettes entières avec `-1` pour le bruit.
- ✅ Les données d'exemple produisent environ 3 grappes correspondant aux trois centres.
- ✅ `add_cluster_labels` ajoute une colonne `cluster` au DataFrame.

**🤔 Question(s) socratique(s)**

- DBSCAN exige de choisir `eps_km` et `min_samples`. Comment écrirais-tu une recherche de paramètres automatisée qui choisit les valeurs produisant le regroupement le plus « intéressant » (ni trop de grappes, ni trop peu) ?
- K-means exige de spécifier `k` (le nombre de grappes) à l'avance. Qu'est-ce qui fait de DBSCAN un meilleur choix pour les données géographiques où tu ne sais pas combien de grappes existent ?

---

## Étape 3 : Calculer les distances avec la formule de Haversine

La formule de Haversine calcule la distance de grand cercle entre deux points sur une sphère — la distance la plus courte à la surface de la Terre, pas une approximation en ligne droite. C'est essentiel pour l'analyse géographique car une approximation en terre plate (distance euclidienne sur les coordonnées brutes) donne des résultats très faux à plus grande échelle.

### 3.1 Implémenter la formule de Haversine

**👟 Indice de départ :** Crée `geo/distance.py` avec une fonction Haversine vectorisée qui travaille sur des tableaux de coordonnées.

```python
# geo/distance.py
import numpy as np

EARTH_RADIUS_KM = 6371.0

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points in kilometers."""
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return EARTH_RADIUS_KM * 2 * np.arcsin(np.sqrt(a))

def distance_matrix(df) -> np.ndarray:
    """Compute pairwise distances (km) between all points in the DataFrame."""
    coords = np.radians(df[["latitude", "longitude"]].values)
    lat = coords[:, 0]
    lon = coords[:, 1]
    dlat = lat[:, None] - lat[None, :]
    dlon = lon[:, None] - lon[None, :]
    a = np.sin(dlat / 2) ** 2 + np.cos(lat[:, None]) * np.cos(lat[None, :]) * np.sin(dlon / 2) ** 2
    return EARTH_RADIUS_KM * 2 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))
```

La fonction `haversine` est la brique de base — elle convertit les degrés en radians, applique la formule et renvoie des kilomètres. La fonction `distance_matrix` vectorise cela avec la diffusion NumPy pour calculer toutes les distances par paires à la fois, ce qui est des ordres de grandeur plus rapide que de boucler en Python. `np.clip(a, 0, 1)` empêche l'arrondi en virgule flottante de pousser des valeurs légèrement au-dessus de 1 dans le domaine de `arcsin`.

**🎯 Résultat attendu :** `haversine(37.7749, -122.4194, 37.8044, -122.2712)` renvoie environ `13.5` km — la distance réelle entre le centre-ville de San Francisco et Oakland.

**🩹 Si ça ne marche pas :** Si la distance est très fausse (des milliers de km pour des points proches), tu as oublié de convertir les degrés en radians. Si la matrice a des valeurs négatives, le `np.clip` manque.

### 3.2 Trouver les voisins les plus proches

```python
# geo/distance.py (continued)
def nearest_neighbors(df, k: int = 5) -> list[dict]:
    """Find the k nearest neighbors for each point."""
    mat = distance_matrix(df)
    results = []
    for i, row in df.iterrows():
        dists = mat[i]
        indices = np.argsort(dists)[1:k + 1]  # skip self (distance 0)
        neighbors = [
            {"neighbor": df.iloc[j]["label"], "distance_km": round(dists[j], 2)}
            for j in indices
        ]
        results.append({"point": row["label"], "neighbors": neighbors})
    return results
```

**🎯 Résultat attendu :** `nearest_neighbors(df, k=3)` renvoie une liste de dictionnaires, chacun avec un nom `point` et une liste `neighbors` de 3 points les plus proches avec leurs distances.

**🩹 Si ça ne marche pas :** Si le premier voisin a une distance de 0, tu t'inclus toi-même dans les résultats — la note `skip self` dans le code gère cela avec `[1:k+1]`.

### 3.3 Vérifier les calculs de distance

**✅ Liste de vérification**

- ✅ `haversine` entre deux lieux connus de SF renvoie environ 13,5 km.
- ✅ `distance_matrix` renvoie une matrice carrée où les valeurs diagonales sont 0.
- ✅ `nearest_neighbors` renvoie k voisins par point avec des distances non nulles.

**🤔 Question(s) socratique(s)**

- La formule de Haversine suppose une sphère parfaite, mais la Terre est un sphéroïde aplati. Pour quels types d'analyse cette approximation serait-elle inacceptable, et quelle formule utiliserais-tu à la place ?
- Si tu calcules des distances entre des millions de points, la matrice de distances `O(n^2)` ne tiendra pas en mémoire. Quelle structure de données spatiale (indice : KD-tree, R-tree) réduirait l'espace de recherche ?

---

## Étape 4 : Générer une carte de chaleur sur une carte interactive

Une superposition de carte de chaleur sur une vraie carte rend la densité de points immédiatement visible — les zones denses brillent, les zones éparses s'estompent. Folium génère un fichier HTML avec une carte interactive Leaflet.js que tu peux zoomer, faire défiler et cliquer.

### 4.1 Construire la carte de chaleur

**👟 Indice de départ :** Crée `geo/visualize.py` avec une fonction qui génère une carte de chaleur Folium à partir d'un DataFrame de coordonnées.

```python
# geo/visualize.py
import folium
from folium.plugins import HeatMap

def create_heatmap(df, output: str = "heatmap.html", zoom_start: int = 12):
    """Generate an interactive heatmap HTML file from coordinate data."""
    center_lat = df["latitude"].mean()
    center_lon = df["longitude"].mean()
    m = folium.Map(location=[center_lat, center_lon], zoom_start=zoom_start)

    heat_data = df[["latitude", "longitude"]].values.tolist()
    HeatMap(heat_data, radius=15, blur=10).add_to(m)
    m.save(output)
    print(f"Heatmap saved to {output}")
    return output
```

La carte se centre sur la moyenne de toutes les coordonnées, qui est le centre naturel du jeu de données. `radius` et `blur` contrôlent l'apparence visuelle de la carte de chaleur — un rayon plus grand étend plus loin l'influence de chaque point, un flou plus grand adoucit les bords. La sortie est un fichier HTML autonome que tu peux ouvrir dans n'importe quel navigateur.

**🎯 Résultat attendu :** `create_heatmap(df)` crée `heatmap.html` — un fichier que tu peux ouvrir dans un navigateur montrant une carte interactive avec une superposition de chaleur centrée sur le centroïde des données.

**🩹 Si ça ne marche pas :** Si la carte est vide, les coordonnées sont peut-être dans le mauvais ordre (Folium attend `[lat, lon]`). Si la carte de chaleur est invisible, essaie d'augmenter `radius` ou `blur`.

### 4.2 Ajouter des marqueurs de grappes

```python
# geo/visualize.py (continued)
def create_cluster_map(df, output: str = "clusters.html", zoom_start: int = 12):
    """Generate a map with color-coded cluster markers."""
    center_lat = df["latitude"].mean()
    center_lon = df["longitude"].mean()
    m = folium.Map(location=[center_lat, center_lon], zoom_start=zoom_start)

    colors = ["red", "blue", "green", "orange", "purple", "cyan"]
    for _, row in df.iterrows():
        cluster = int(row.get("cluster", -1))
        color = "gray" if cluster == -1 else colors[cluster % len(colors)]
        folium.CircleMarker(
            location=[row["latitude"], row["longitude"]],
            radius=5,
            color=color,
            fill=True,
            popup=row.get("label", ""),
        ).add_to(m)

    m.save(output)
    print(f"Cluster map saved to {output}")
    return output
```

Chaque grappe reçoit une couleur distincte ; les points de bruit (`-1`) sont gris. Le `popup` de chaque marqueur montre l'étiquette du point au clic. Cela te donne deux vues des mêmes données : la carte de chaleur montre la densité, et la carte des grappes montre le regroupement.

**🎯 Résultat attendu :** `create_cluster_map(df)` crée `clusters.html` avec des marqueurs colorés — trois couleurs distinctes pour trois grappes, gris pour le bruit.

**🩹 Si ça ne marche pas :** Si tous les marqueurs sont de la même couleur, la colonne `cluster` n'est pas dans le DataFrame — exécute `add_cluster_labels` d'abord. Si le popup est vide, la colonne `label` manque.

### 4.3 Vérifier les visualisations

**✅ Liste de vérification**

- ✅ `create_heatmap` produit un fichier HTML valide avec une carte interactive.
- ✅ Le centre de la carte de chaleur est près de la moyenne des coordonnées.
- ✅ `create_cluster_map` produit une carte avec des marqueurs colorés correspondant aux affectations de grappes.

**🤔 Question(s) socratique(s)**

- La carte de chaleur montre la densité mais pas les points individuels. Pour quels cas d'usage une carte de points (marqueurs uniquement) serait-elle plus utile qu'une carte de chaleur ?
- Les cartes Folium sont des fichiers HTML. Comment en servirais-tu une depuis un serveur web Python pour qu'elle se mette à jour en temps réel à mesure que de nouvelles données arrivent ?

---

## Étape 5 : Trouver l'itinéraire optimal à travers les points de passage

L'optimisation d'itinéraires — trouver le chemin le plus court qui visite tous les points de passage — est un problème classique. Pour un petit nombre de points de passage, tu peux essayer toutes les permutations. Pour des ensembles plus grands, tu as besoin d'une heuristique. Cette étape implémente les deux.

### 5.1 Implémenter l'itinéraire en force brute et plus proche voisin

**👟 Indice de départ :** Crée `geo/route.py` avec un optimiseur en force brute pour les petits ensembles de points de passage.

```python
# geo/route.py
from itertools import permutations
import numpy as np
from geo.distance import haversine

def route_distance(df, order: list[int]) -> float:
    """Total distance of a route through waypoints in the given order."""
    total = 0.0
    for i in range(len(order) - 1):
        lat1, lon1 = df.iloc[order[i]][["latitude", "longitude"]]
        lat2, lon2 = df.iloc[order[i + 1]][["latitude", "longitude"]]
        total += haversine(lat1, lon1, lat2, lon2)
    return total

def optimal_route_bruteforce(df) -> tuple[list[int], float]:
    """Find the shortest route through all waypoints (exact, O(n!))."""
    indices = list(range(len(df)))
    best_order = indices
    best_dist = float("inf")
    for perm in permutations(indices):
        d = route_distance(df, list(perm))
        if d < best_dist:
            best_dist = d
            best_order = list(perm)
    return best_order, best_dist

def nearest_neighbor_route(df, start: int = 0) -> tuple[list[int], float]:
    """Greedy nearest-neighbor approximation for larger waypoint sets."""
    n = len(df)
    visited = [start]
    remaining = set(range(n)) - {start}
    while remaining:
        current = visited[-1]
        best_next = min(remaining, key=lambda j: haversine(
            df.iloc[current]["latitude"], df.iloc[current]["longitude"],
            df.iloc[j]["latitude"], df.iloc[j]["longitude"],
        ))
        visited.append(best_next)
        remaining.remove(best_next)
    return visited, route_distance(df, visited)
```

L'approche par force brute essaie chaque permutation — pour 10 points de passage, c'est 3,6 millions de permutations, ce qui prend quelques secondes. L'heuristique du plus proche voisin choisit le point non visité le plus proche à chaque étape — elle est en `O(n^2)` et passe à l'échelle des milliers de points de passage, mais ne garantit pas l'itinéraire optimal. Pour la planification d'itinéraires réelle, tu utiliserais un algorithme plus sophistiqué (Christofides, ou OR-Tools), mais ces deux-là te donnent l'idée clé : les solutions exactes sont exponentielles, les heuristiques sont polynomiales, et l'écart entre elles est le prix de la scalabilité.

**🎯 Résultat attendu :** Pour 8 points de passage, `optimal_route_bruteforce` renvoie l'itinéraire le plus court possible et sa distance totale en km. `nearest_neighbor_route` renvoie un itinéraire légèrement plus long en une fraction du temps.

**🩹 Si ça ne marche pas :** Si la distance en force brute est 0, les points de passage sont tous le même point. Si le plus proche voisin renvoie un itinéraire beaucoup plus long, le point de départ est peut-être un mauvais choix — essaie différents départs.

### 5.2 Visualiser l'itinéraire

```python
# geo/route.py (continued)
import folium

def visualize_route(df, order: list[int], output: str = "route.html"):
    """Generate a map showing the optimal route as a polyline."""
    center_lat = df["latitude"].mean()
    center_lon = df["longitude"].mean()
    m = folium.Map(location=[center_lat, center_lon], zoom_start=12)

    coords = [(df.iloc[i]["latitude"], df.iloc[i]["longitude"]) for i in order]
    folium.PolyLine(coords, color="blue", weight=3).add_to(m)
    for i, idx in enumerate(order):
        folium.Marker(
            location=coords[i],
            popup=f"Stop {i + 1}: {df.iloc[idx].get('label', '')}",
        ).add_to(m)

    m.save(output)
    print(f"Route saved to {output}")
    return output
```

**🎯 Résultat attendu :** `visualize_route(df, order)` crée `route.html` avec une polyligne bleue reliant tous les points de passage dans l'ordre, avec des marqueurs numérotés à chaque arrêt.

**🩹 Si ça ne marche pas :** Si la polyligne zigzague sauvagement, l'ordre de l'itinéraire est faux — vérifie que les indices `order` correspondent aux lignes du DataFrame.

### 5.3 Vérifier l'itinéraire

**✅ Liste de vérification**

- ✅ `optimal_route_bruteforce` trouve l'itinéraire le plus court pour ≤ 10 points de passage.
- ✅ `nearest_neighbor_route` produit un itinéraire valide qui visite chaque point de passage.
- ✅ `visualize_route` crée un fichier HTML avec l'itinéraire dessiné comme une polyligne.

**🤔 Question(s) socratique(s)**

- Pour 20 points de passage, `factorial(20) ≈ 2,4 × 10^18` permutations — la force brute est impossible. À partir de quel nombre de points de passage l'approximation du plus proche voisin devient-elle « assez bonne » pour ton cas d'usage, et comment mesurerais-tu l'écart ?
- Les itinéraires de livraison réels ont des fenêtres de temps, du trafic et des capacités de véhicules. Comment étendrais-tu ce modèle pour gérer des contraintes au-delà de la seule distance ?

---

## ⚠️ Pièges courants

- **Confondre degrés et radians dans les calculs de distance.** La formule de Haversine exige des radians. Une erreur courante est de passer les degrés bruts de latitude/longitude à `np.sin`/`np.cos`, ce qui produit des résultats dénués de sens. Convertis toujours avec `np.radians` d'abord.
- **Utiliser la distance euclidienne sur des coordonnées brutes.** À l'échelle d'une ville, la distance euclidienne sur les degrés est approximativement correcte. À l'échelle d'un pays ou d'un continent, elle est très fausse car un degré de longitude rétrécit à mesure qu'on se rapproche des pôles. Utilise Haversine pour tout ce qui dépasse quelques kilomètres.
- **Ajustement des paramètres DBSCAN sans visualisation.** Choisir `eps_km` au hasard n'est pas fiable. Trace la distribution des distances (graphe k-distance) et cherche le « coude » où les distances sautent — c'est une bonne valeur de départ pour `eps`.
- **Cartes de chaleur qui ne se rendent pas dans les notebooks.** Les cartes Folium sont des objets HTML — elles s'affichent en ligne dans Colab et Kaggle mais peuvent nécessiter `display(m)` dans certains environnements de notebook. Si la carte est vide, essaie `m._repr_html_()` ou enregistre dans un fichier et ouvre.
- **Oublier que l'optimisation d'itinéraires est NP-difficile.** La force brute fonctionne pour 8–10 points. Au-delà, tu as besoin du plus proche voisin, du recuit simulé ou d'une bibliothèque de solveurs. Ne laisse pas la solution en force brute te bercer en pensant que l'itinéraire est toujours rapide.

## Ce que tu viens de construire

Une boîte à outils d'analyse géospatiale qui charge des données de coordonnées, regroupe des points avec DBSCAN, calcule des distances réelles avec la formule de Haversine, génère des cartes de chaleur et des cartes de grappes interactives, et optimise des itinéraires à travers plusieurs points de passage. L'idée clé à travers les cinq étapes est que les données géographiques ont des contraintes uniques — la Terre est courbe, les distances ne sont pas euclidiennes, et la structure spatiale compte — et les bonnes formules et algorithmes font la différence entre le non-sens et la perspicacité.

:::tip[Exécute une version plus complète sans configuration locale]
[`examples/geospatial-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/geospatial-analyzer) dans le dépôt du cours a une version plus riche avec des données d'exemple du monde réel, des types de visualisation supplémentaires et la CLI câblée de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et lance-le depuis là.
:::

## Où aller ensuite

- Ajoute une étape de géocodage qui convertit des adresses postales en coordonnées avec une API gratuite, pour que l'outil puisse partir d'adresses brutes au lieu de données lat/lon préexistantes.
- Implémente une superposition de diagramme de Voronoï sur la carte pour montrer à quelle grappe chaque région de la carte appartient.
- Construis une version temps réel qui lit les coordonnées GPS depuis un flux CSV et met à jour la carte de chaleur périodiquement.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓