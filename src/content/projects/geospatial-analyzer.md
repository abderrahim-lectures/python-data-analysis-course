---
title: "Build a Geospatial Data Analyzer"
description: "Analyze and visualize geographic point data with clustering, distance calculations, heatmaps, and route optimization."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["data-viz", "geospatial", "scikit-learn"]
learningObjectives:
  - "Load and manipulate geographic coordinate data with pandas"
  - "Cluster spatial points using DBSCAN to find natural groupings"
  - "Calculate distances between coordinates using the Haversine formula"
  - "Generate a heatmap visualization of point density on a real map"
prerequisites: ["Python 101", "Data Analysis"]
---

# 🌍 Build a Geospatial Data Analyzer

Every rideshare trip, every delivery, every weather station reading is a point on the globe described by two numbers: latitude and longitude. This project builds a geospatial analysis tool that takes raw coordinate data and answers real questions: where are the clusters of activity, how far apart are two locations, and what does the density of points look like on a map. You'll use DBSCAN for spatial clustering, the Haversine formula for real distance calculations, and Folium for interactive map visualizations, all grounded in actual geographic data.

This assumes Python 101 and comfort with pandas from Data Analysis, nothing beyond. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the geospatial dependencies you'll need.
2. Load and clean a sample dataset of geographic coordinates.
3. Cluster nearby points using DBSCAN to find natural groupings in the data.
4. Calculate real-world distances between coordinates using the Haversine formula.
5. Generate an interactive heatmap showing point density on a map.
6. Find the optimal route through multiple waypoints.

## Where to run this

**Locally with `uv`** is the primary path, the interactive Folium map renders in your browser, which is more reliable than a notebook's output pane.

**Google Colab, Kaggle Notebooks, and Binder** work well for trying the tool. The notebook installs the same packages and uses the same code; Folium maps render inline in Colab and Kaggle.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/geospatial-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/geospatial-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgeospatial-analyzer%2Fnotebook.ipynb)

## Setup

Everything you need before analyzing coordinates: a Python environment, pandas, scikit-learn for clustering, and Folium for map rendering.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init geospatial-analyzer
cd geospatial-analyzer
uv add pandas scikit-learn folium numpy
```

`pandas` handles the data, `scikit-learn` provides DBSCAN clustering, `folium` renders interactive maps, and `numpy` is needed for the Haversine math. No external API keys required, everything runs locally.

### Create the project structure

```bash
mkdir -p geo
touch geo/__init__.py geo/load.py geo/cluster.py geo/distance.py geo/visualize.py geo/route.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `geospatial-analyzer/` exists with a `pyproject.toml`, and `pandas`, `scikit-learn`, `folium`, and `numpy` are installed.
- ✅ The `geo/` directory has all required module files.

## Step 1: Load and clean coordinate data

Geographic data comes in many shapes, CSV files, JSON APIs, database dumps, but for analysis it always ends up as a DataFrame with at least two columns: `latitude` and `longitude`. This step loads sample data and validates that the coordinates are realistic.

### 1.1 Load sample data

**👟 Starter hint:** Create a sample dataset and load it into a DataFrame, validating coordinate ranges.

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

The `generate_sample_locations` function creates points clustered around three real Bay Area locations, this makes the clustering results meaningful and the maps recognizable. `validate_coordinates` filters out impossible coordinates (latitude outside -90 to 90, longitude outside -180 to 180) with a count of what was removed.

**🎯 Expected output:** `generate_sample_locations(50)` returns a DataFrame with 50 rows and columns `latitude`, `longitude`, `label`. `validate_coordinates` drops 0 rows for valid data.

**🩹 If it's off:** If the generated points don't cluster visibly, check the `centers` list and the standard deviation (`0.01` degrees is about 1 km). If coordinates are outside valid ranges, the `rng.normal` spread may be too large.

### 1.2 Verify data loading

```python
# Quick test
df = generate_sample_locations(100)
assert len(df) == 100
assert df["latitude"].between(-90, 90).all()
assert df["longitude"].between(-180, 180).all()
print(df.head())
```

**🎯 Expected output:** The assertion passes; the first 5 rows show coordinates clustered around the SF Bay Area.

**🩹 If it's off:** If the assertion fails on latitude range, the center coordinates may be swapped (lat vs lon).

### 1.3 Verify data loading

**✅ Checklist**

- ✅ `generate_sample_locations` returns a DataFrame with `latitude`, `longitude`, and `label` columns.
- ✅ All generated coordinates are within valid geographic ranges.
- ✅ `validate_coordinates` drops invalid rows and reports the count.

**🤔 Socratic Question(s)**

- Real geographic data often has missing values, duplicate points, or coordinates at (0, 0). How would you extend `validate_coordinates` to catch these cases?
- If you're analyzing delivery routes, the order of points matters, why doesn't order matter for the clustering step?

## Step 2: Cluster points with DBSCAN

DBSCAN groups points that are close together and marks isolated points as noise, perfect for spatial data where clusters have irregular shapes and you don't know the number of clusters in advance. The key insight is that DBSCAN works on *distance*, not just raw coordinates, so you need to convert lat/lon to kilometers first.

### 2.1 Convert coordinates to radians and cluster

**👟 Starter hint:** Create `geo/cluster.py` with a function that runs DBSCAN on geographic coordinates using the haversine metric.

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

The conversion from kilometers to radians (`eps_km / 6371.0`) is critical, DBSCAN's haversine metric expects radians, not degrees. One degree of latitude is about 111 km at the equator, but the haversine formula handles the curvature correctly. Points labeled `-1` are noise (not part of any cluster), and clusters start from `0`.

**🎯 Expected output:** `cluster_locations(df, eps_km=1.0, min_samples=5)` returns an array of integers where `-1` marks noise points and `0, 1, 2, ...` mark cluster assignments.

**🩹 If it's off:** If every point is noise (`-1`), `eps_km` is too small, try increasing it. If everything is one giant cluster, `eps_km` is too large or `min_samples` is too small.

### 2.2 Attach labels to the DataFrame

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

**🎯 Expected output:** The printed summary shows 3 clusters (matching the three centers in the sample data) and a small number of noise points.

**🩹 If it's off:** If the cluster count is wrong, the `eps_km` or `min_samples` parameters need tuning, spatial clustering always requires parameter exploration.

### 2.3 Verify clustering

**✅ Checklist**

- ✅ `cluster_locations` returns an array of integer labels with `-1` for noise.
- ✅ The sample data produces approximately 3 clusters matching the three centers.
- ✅ `add_cluster_labels` adds a `cluster` column to the DataFrame.

**🤔 Socratic Question(s)**

- DBSCAN requires you to choose `eps_km` and `min_samples`. How would you write an automated parameter search that picks the values producing the most "interesting" clustering (not too many clusters, not too few)?
- K-means requires you to specify `k` (the number of clusters) in advance. What makes DBSCAN a better fit for geographic data where you don't know how many clusters exist?

## Step 3: Calculate distances with the Haversine formula

The Haversine formula calculates the great-circle distance between two points on a sphere, the shortest distance over the Earth's surface, not a flat-line approximation. This is essential for geographic analysis because a flat-earth approximation (Euclidean distance on raw coordinates) gives wildly wrong results at larger scales.

### 3.1 Implement the Haversine formula

**👟 Starter hint:** Create `geo/distance.py` with a vectorized Haversine function that works on arrays of coordinates.

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

The `haversine` function is the building block, it converts degrees to radians, applies the formula, and returns kilometers. The `distance_matrix` function vectorizes this with NumPy broadcasting to compute all pairwise distances at once, which is orders of magnitude faster than looping in Python. `np.clip(a, 0, 1)` prevents floating-point rounding from pushing values slightly above 1 into the domain of `arcsin`.

**🎯 Expected output:** `haversine(37.7749, -122.4194, 37.8044, -122.2712)` returns approximately `13.5` km, the real distance between downtown SF and Oakland.

**🩹 If it's off:** If the distance is wildly wrong (thousands of km for nearby points), you forgot to convert degrees to radians. If the matrix has negative values, the `np.clip` is missing.

### 3.2 Find nearest neighbors

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

**🎯 Expected output:** `nearest_neighbors(df, k=3)` returns a list of dictionaries, each with a `point` name and a `neighbors` list of 3 nearest points with distances.

**🩹 If it's off:** If the first neighbor has distance 0, you're including self in the results, the `skip self` comment in the code handles this with `[1:k+1]`.

### 3.3 Verify distance calculations

**✅ Checklist**

- ✅ `haversine` between two known SF locations returns approximately 13.5 km.
- ✅ `distance_matrix` returns a square matrix where diagonal values are 0.
- ✅ `nearest_neighbors` returns k neighbors per point with non-zero distances.

**🤔 Socratic Question(s)**

- The Haversine formula assumes a perfect sphere, but the Earth is an oblate spheroid. For what types of analysis would this approximation be unacceptable, and what formula would you use instead?
- If you're computing distances between millions of points, the `O(n^2)` distance matrix won't fit in memory. What spatial data structure (hint: KD-tree, R-tree) would reduce the search space?

## Step 4: Generate a heatmap on an interactive map

A heatmap overlay on a real map makes point density immediately visible, dense areas glow bright, sparse areas fade. Folium generates an HTML file with an interactive Leaflet.js map that you can zoom, pan, and click.

### 4.1 Build the heatmap

**👟 Starter hint:** Create `geo/visualize.py` with a function that generates a Folium heatmap from a DataFrame of coordinates.

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

The map centers on the mean of all coordinates, which is the natural center of the dataset. `radius` and `blur` control the heatmap's visual appearance, larger radius spreads each point's influence further, larger blur softens the edges. The output is a standalone HTML file you can open in any browser.

**🎯 Expected output:** `create_heatmap(df)` creates `heatmap.html`, a file you can open in a browser showing an interactive map with a heat overlay centered on the data's centroid.

**🩹 If it's off:** If the map is blank, the coordinates may be in the wrong order (Folium expects `[lat, lon]`). If the heatmap is invisible, try increasing `radius` or `blur`.

### 4.2 Add cluster markers

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

Each cluster gets a distinct color; noise points (`-1`) are gray. The `popup` on each marker shows the point's label when clicked. This gives you two views of the same data: the heatmap shows density, and the cluster map shows grouping.

**🎯 Expected output:** `create_cluster_map(df)` creates `clusters.html` with colored markers, three distinct colors for three clusters, gray for noise.

**🩹 If it's off:** If all markers are the same color, the `cluster` column isn't in the DataFrame, run `add_cluster_labels` first. If the popup is empty, the `label` column is missing.

### 4.3 Verify the visualizations

**✅ Checklist**

- ✅ `create_heatmap` produces a valid HTML file with an interactive map.
- ✅ The heatmap center is near the mean of the coordinates.
- ✅ `create_cluster_map` produces a map with color-coded markers matching cluster assignments.

**🤔 Socratic Question(s)**

- The heatmap shows density but not individual points. For what use cases would a point map (markers only) be more useful than a heatmap?
- Folium maps are HTML files. How would you serve one from a Python web server so it updates in real time as new data arrives?

## Step 5: Find the optimal route through waypoints

Route optimization, finding the shortest path that visits all waypoints, is a classic problem. For a small number of waypoints, you can try all permutations. For larger sets, you need a heuristic. This step implements both.

### 5.1 Implement brute-force and nearest-neighbor routing

**👟 Starter hint:** Create `geo/route.py` with a brute-force optimizer for small waypoint sets.

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

The brute-force approach tries every permutation, for 10 waypoints that's 3.6 million permutations, which takes a few seconds. The nearest-neighbor heuristic picks the closest unvisited point at each step, it's `O(n^2)` and scales to thousands of waypoints, but doesn't guarantee the optimal route. For real-world route planning, you'd use a more sophisticated algorithm (Christofides, or OR-Tools), but these two give you the key insight: exact solutions are exponential, heuristics are polynomial, and the gap between them is the price of scalability.

**🎯 Expected output:** For 8 waypoints, `optimal_route_bruteforce` returns the shortest possible route and its total distance in km. `nearest_neighbor_route` returns a slightly longer route in a fraction of the time.

**🩹 If it's off:** If the brute-force distance is 0, the waypoints are all the same point. If nearest-neighbor returns a wildly longer route, the starting point may be a poor choice, try different starts.

### 5.2 Visualize the route

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

**🎯 Expected output:** `visualize_route(df, order)` creates `route.html` with a blue polyline connecting all waypoints in order, numbered markers at each stop.

**🩹 If it's off:** If the polyline zigzags wildly, the route order is wrong, check that `order` indices match the DataFrame rows.

### 5.3 Verify routing

**✅ Checklist**

- ✅ `optimal_route_bruteforce` finds the shortest route for ≤ 10 waypoints.
- ✅ `nearest_neighbor_route` produces a valid route that visits every waypoint.
- ✅ `visualize_route` creates an HTML file with the route drawn as a polyline.

**🤔 Socratic Question(s)**

- For 20 waypoints, `factorial(20) ≈ 2.4 × 10^18` permutations, brute force is impossible. At what waypoint count does nearest-neighbor's approximation become "good enough" for your use case, and how would you measure the gap?
- Real delivery routes have time windows, traffic, and vehicle capacity. How would you extend this model to handle constraints beyond just distance?

## ⚠️ Common pitfalls

- **Confusing degrees and radians in distance calculations.** The Haversine formula requires radians. A common mistake is passing raw latitude/longitude degrees to `np.sin`/`np.cos`, which produces meaningless results. Always convert with `np.radians` first.
- **Using Euclidean distance on raw coordinates.** At the scale of a city, Euclidean distance on degrees is roughly correct. At the scale of a country or continent, it's wildly wrong because a degree of longitude shrinks as you move toward the poles. Use Haversine for anything beyond a few kilometers.
- **DBSCAN parameter tuning without visualization.** Choosing `eps_km` by guesswork is unreliable. Plot the distance distribution (k-distance graph) and look for the "elbow" where distances jump, that's a good starting value for `eps`.
- **Heatmaps that don't render in notebooks.** Folium maps are HTML objects, they display inline in Colab and Kaggle but may need `display(m)` in some notebook environments. If the map is blank, try `m._repr_html_()` or save to file and open.
- **Forgetting that route optimization is NP-hard.** Brute force works for 8–10 points. Beyond that, you need nearest-neighbor, simulated annealing, or a solver library. Don't let the brute-force solution lull you into thinking routing is always fast.

## What you just built

A geospatial analysis toolkit that loads coordinate data, clusters points with DBSCAN, calculates real-world distances with the Haversine formula, generates interactive heatmap and cluster maps, and optimizes routes through multiple waypoints. The key insight across all five steps is that geographic data has unique constraints, the Earth is curved, distances aren't Euclidean, and spatial structure matters, and the right formulas and algorithms make the difference between nonsense and insight.

:::tip[Run a fuller version without any local setup]
[`examples/geospatial-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/geospatial-analyzer) in the course repo has a richer version with real-world sample data, additional visualization types, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a geocoding step that converts street addresses to coordinates using a free API, so the tool can start from raw addresses instead of pre-existing lat/lon data.
- Implement a Voronoi diagram overlay on the map to show which cluster each region of the map belongs to.
- Build a real-time version that reads GPS coordinates from a CSV stream and updates the heatmap periodically.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
