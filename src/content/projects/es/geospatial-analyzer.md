---
title: "Analizador de Datos Geoespaciales"
description: "Analizar y visualizar datos geográficos con clustering, mapas de calor y optimización de rutas."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["data-viz", "geospatial", "scikit-learn"]
learningObjectives:
  - "Cargar y manipular datos de coordenadas geográficas con pandas"
  - "Agrupar puntos espaciales usando DBSCAN para encontrar agrupaciones naturales"
  - "Calcular distancias entre coordenadas usando la fórmula de Haversine"
  - "Generar una visualización de mapa de calor de la densidad de puntos en un mapa real"
prerequisites:
  - "Python 101"
  - "Análisis de Datos"
---

# 🌍 Analizador de Datos Geoespaciales

Cada viaje de rideshare, cada entrega, cada lectura de estación meteorológica es un punto en el globo descrito por dos números: latitud y longitud. Este proyecto construye una herramienta de análisis geoespacial que toma datos crudos de coordenadas y responde preguntas reales: dónde están los clústeres de actividad, qué tan separados están dos puntos y cómo se ve la densidad de puntos en un mapa. Usarás DBSCAN para el agrupamiento espacial, la fórmula de Haversine para cálculos de distancia reales y Folium para visualizaciones de mapas interactivas — todo anclado en datos geográficos reales.

Esto asume Python 101 y comodidad con pandas de Análisis de Datos — nada más allá. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias geoespaciales que necesitarás.
2. Cargar y limpiar un conjunto de datos de muestra de coordenadas geográficas.
3. Agrupar puntos cercanos usando DBSCAN para encontrar agrupaciones naturales en los datos.
4. Calcular distancias del mundo real entre coordenadas usando la fórmula de Haversine.
5. Generar un mapa de calor interactivo que muestre la densidad de puntos en un mapa.
6. Encontrar la ruta óptima a través de múltiples waypoints.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — el mapa interactivo de Folium se renderiza en tu navegador, que es más fiable que el panel de salida de un notebook.

**Google Colab, Kaggle Notebooks y Binder** funcionan bien para probar la herramienta. El notebook instala los mismos paquetes y usa el mismo código; los mapas de Folium se renderizan en línea en Colab y Kaggle.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/geospatial-analyzer/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/geospatial-analyzer/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgeospatial-analyzer%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de analizar coordenadas: un entorno de Python, pandas, scikit-learn para el agrupamiento y Folium para el renderizado de mapas.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Crea el scaffold del proyecto

```bash
uv init geospatial-analyzer
cd geospatial-analyzer
uv add pandas scikit-learn folium numpy
```

`pandas` maneja los datos, `scikit-learn` proporciona el agrupamiento DBSCAN, `folium` renderiza mapas interactivos y `numpy` es necesario para las matemáticas de Haversine. No se requieren claves de API externas — todo corre localmente.

### Crea la estructura del proyecto

```bash
mkdir -p geo
touch geo/__init__.py geo/load.py geo/cluster.py geo/distance.py geo/visualize.py geo/route.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `geospatial-analyzer/` existe con un `pyproject.toml`, y `pandas`, `scikit-learn`, `folium` y `numpy` están instalados.
- ✅ El directorio `geo/` tiene todos los archivos de módulo requeridos.

## Paso 1: Carga y limpia datos de coordenadas

Los datos geográficos vienen en muchas formas — archivos CSV, APIs JSON, dumps de bases de datos — pero para el análisis siempre terminan como un DataFrame con al menos dos columnas: `latitude` y `longitude`. Este paso carga datos de muestra y valida que las coordenadas sean realistas.

### 1.1 Carga datos de muestra

**👟 Pista inicial :** Crea un conjunto de datos de muestra y cárgalo en un DataFrame, validando los rangos de las coordenadas.

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

La función `generate_sample_locations` crea puntos agrupados alrededor de tres ubicaciones reales del Área de la Bahía — esto hace que los resultados del agrupamiento sean significativos y los mapas reconocibles. `validate_coordinates` filtra las coordenadas imposibles (latitud fuera de -90 a 90, longitud fuera de -180 a 180) con un conteo de lo que se eliminó.

**🎯 Resultado esperado :** `generate_sample_locations(50)` devuelve un DataFrame con 50 filas y las columnas `latitude`, `longitude`, `label`. `validate_coordinates` elimina 0 filas para datos válidos.

**🩹 Si sale mal :** Si los puntos generados no se agrupan visiblemente, revisa la lista `centers` y la desviación estándar (`0.01` grados son aproximadamente 1 km). Si las coordenadas están fuera de los rangos válidos, la dispersión de `rng.normal` puede ser demasiado grande.

### 1.2 Verifica la carga de datos

```python
# Quick test
df = generate_sample_locations(100)
assert len(df) == 100
assert df["latitude"].between(-90, 90).all()
assert df["longitude"].between(-180, 180).all()
print(df.head())
```

**🎯 Resultado esperado :** La aserción pasa; las primeras 5 filas muestran coordenadas agrupadas alrededor del Área de la Bahía de SF.

**🩹 Si sale mal :** Si la aserción falla en el rango de latitud, las coordenadas del centro pueden estar intercambiadas (lat vs. lon).

### 1.3 Verifica la carga de datos

**✅ Lista de verificación**

- ✅ `generate_sample_locations` devuelve un DataFrame con las columnas `latitude`, `longitude` y `label`.
- ✅ Todas las coordenadas generadas están dentro de los rangos geográficos válidos.
- ✅ `validate_coordinates` elimina las filas inválidas y reporta el conteo.

**🤔 Pregunta(s) socrática(s)**

- Los datos geográficos reales a menudo tienen valores faltantes, puntos duplicados o coordenadas en (0, 0). ¿Cómo extenderías `validate_coordinates` para atrapar estos casos?
- Si estás analizando rutas de entrega, el orden de los puntos importa — ¿por qué no importa el orden para el paso de agrupamiento?

## Paso 2: Agrupa puntos con DBSCAN

DBSCAN agrupa los puntos que están cerca y marca los puntos aislados como ruido — perfecto para datos espaciales donde los clústeres tienen formas irregulares y no sabes el número de clústeres de antemano. La idea clave es que DBSCAN trabaja sobre *distancia*, no solo sobre coordenadas crudas, así que necesitas convertir lat/lon a kilómetros primero.

### 2.1 Convierte coordenadas a radianes y agrupa

**👟 Pista inicial :** Crea `geo/cluster.py` con una función que ejecute DBSCAN sobre coordenadas geográficas usando la métrica haversine.

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

La conversión de kilómetros a radianes (`eps_km / 6371.0`) es crítica — la métrica haversine de DBSCAN espera radianes, no grados. Un grado de latitud es aproximadamente 111 km en el ecuador, pero la fórmula de Haversine maneja la curvatura correctamente. Los puntos etiquetados como `-1` son ruido (no pertenecen a ningún clúster), y los clústeres empiezan desde `0`.

**🎯 Resultado esperado :** `cluster_locations(df, eps_km=1.0, min_samples=5)` devuelve un array de enteros donde `-1` marca los puntos de ruido y `0, 1, 2, ...` marcan las asignaciones de clúster.

**🩹 Si sale mal :** Si cada punto es ruido (`-1`), `eps_km` es demasiado pequeño — intenta aumentarlo. Si todo es un clúster gigante, `eps_km` es demasiado grande o `min_samples` es demasiado pequeño.

### 2.2 Adjunta etiquetas al DataFrame

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

**🎯 Resultado esperado :** El resumen impreso muestra 3 clústeres (coincidiendo con los tres centros de los datos de muestra) y un pequeño número de puntos de ruido.

**🩹 Si sale mal :** Si el conteo de clústeres es incorrecto, los parámetros `eps_km` o `min_samples` necesitan ajuste — el agrupamiento espacial siempre requiere exploración de parámetros.

### 2.3 Verifica el agrupamiento

**✅ Lista de verificación**

- ✅ `cluster_locations` devuelve un array de etiquetas enteras con `-1` para el ruido.
- ✅ Los datos de muestra producen aproximadamente 3 clústeres que coinciden con los tres centros.
- ✅ `add_cluster_labels` agrega una columna `cluster` al DataFrame.

**🤔 Pregunta(s) socrática(s)**

- DBSCAN requiere que elijas `eps_km` y `min_samples`. ¿Cómo escribirías una búsqueda de parámetros automatizada que elija los valores que produzcan el agrupamiento más "interesante" (no demasiados clústeres, no demasiado pocos)?
- K-means requiere que especifiques `k` (el número de clústeres) de antemano. ¿Qué hace que DBSCAN sea un mejor ajuste para datos geográficos donde no sabes cuántos clústeres existen?

## Paso 3: Calcula distancias con la fórmula de Haversine

La fórmula de Haversine calcula la distancia del círculo máximo entre dos puntos en una esfera — la distancia más corta sobre la superficie de la Tierra, no una aproximación de línea plana. Esto es esencial para el análisis geográfico porque una aproximación de tierra plana (distancia euclidiana sobre coordenadas crudas) da resultados terriblemente equivocados a escalas mayores.

### 3.1 Implementa la fórmula de Haversine

**👟 Pista inicial :** Crea `geo/distance.py` con una función de Haversine vectorizada que trabaje sobre arrays de coordenadas.

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

La función `haversine` es el bloque de construcción — convierte grados a radianes, aplica la fórmula y devuelve kilómetros. La función `distance_matrix` vectoriza esto con broadcasting de NumPy para calcular todas las distancias por pares de una vez, que es varias órdenes de magnitud más rápido que hacer un bucle en Python. `np.clip(a, 0, 1)` evita que el redondeo de punto flotante empuje los valores ligeramente por encima de 1 dentro del dominio de `arcsin`.

**🎯 Resultado esperado :** `haversine(37.7749, -122.4194, 37.8044, -122.2712)` devuelve aproximadamente `13.5` km — la distancia real entre el centro de SF y Oakland.

**🩹 Si sale mal :** Si la distancia es terriblemente equivocada (miles de km para puntos cercanos), olvidaste convertir grados a radianes. Si la matriz tiene valores negativos, falta `np.clip`.

### 3.2 Encuentra vecinos más cercanos

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

**🎯 Resultado esperado :** `nearest_neighbors(df, k=3)` devuelve una lista de diccionarios, cada uno con un nombre de `point` y una lista `neighbors` de los 3 puntos más cercanos con sus distancias.

**🩹 Si sale mal :** Si el primer vecino tiene distancia 0, estás incluyendo el propio punto en los resultados — el comentario `skip self` en el código maneja esto con `[1:k+1]`.

### 3.3 Verifica los cálculos de distancia

**✅ Lista de verificación**

- ✅ `haversine` entre dos ubicaciones conocidas de SF devuelve aproximadamente 13.5 km.
- ✅ `distance_matrix` devuelve una matriz cuadrada donde los valores diagonales son 0.
- ✅ `nearest_neighbors` devuelve k vecinos por punto con distancias distintas de cero.

**🤔 Pregunta(s) socrática(s)**

- La fórmula de Haversine asume una esfera perfecta, pero la Tierra es un esferoide oblato. ¿Para qué tipos de análisis sería inaceptable esta aproximación, y qué fórmula usarías en su lugar?
- Si estás calculando distancias entre millones de puntos, la matriz de distancias `O(n^2)` no cabrá en memoria. ¿Qué estructura de datos espacial (pista: KD-tree, R-tree) reduciría el espacio de búsqueda?

## Paso 4: Genera un mapa de calor en un mapa interactivo

Una superposición de mapa de calor en un mapa real hace que la densidad de puntos sea inmediatamente visible — las áreas densas brillan, las áreas dispersas se desvanecen. Folium genera un archivo HTML con un mapa interactivo de Leaflet.js que puedes acercar, desplazar y hacer clic.

### 4.1 Construye el mapa de calor

**👟 Pista inicial :** Crea `geo/visualize.py` con una función que genere un mapa de calor de Folium a partir de un DataFrame de coordenadas.

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

El mapa se centra en la media de todas las coordenadas, que es el centro natural del conjunto de datos. `radius` y `blur` controlan la apariencia visual del mapa de calor — un radio mayor dispersa la influencia de cada punto más lejos, un blur mayor suaviza los bordes. La salida es un archivo HTML independiente que puedes abrir en cualquier navegador.

**🎯 Resultado esperado :** `create_heatmap(df)` crea `heatmap.html` — un archivo que puedes abrir en un navegador mostrando un mapa interactivo con una superposición de calor centrada en el centroide de los datos.

**🩹 Si sale mal :** Si el mapa está en blanco, las coordenadas pueden estar en el orden equivocado (Folium espera `[lat, lon]`). Si el mapa de calor es invisible, intenta aumentar `radius` o `blur`.

### 4.2 Agrega marcadores de clúster

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

Cada clúster recibe un color distinto; los puntos de ruido (`-1`) son grises. El `popup` de cada marcador muestra la etiqueta del punto al hacer clic. Esto te da dos vistas de los mismos datos: el mapa de calor muestra la densidad, y el mapa de clústeres muestra el agrupamiento.

**🎯 Resultado esperado :** `create_cluster_map(df)` crea `clusters.html` con marcadores de colores — tres colores distintos para tres clústeres, gris para el ruido.

**🩹 Si sale mal :** Si todos los marcadores son del mismo color, la columna `cluster` no está en el DataFrame — ejecuta `add_cluster_labels` primero. Si el popup está vacío, falta la columna `label`.

### 4.3 Verifica las visualizaciones

**✅ Lista de verificación**

- ✅ `create_heatmap` produce un archivo HTML válido con un mapa interactivo.
- ✅ El centro del mapa de calor está cerca de la media de las coordenadas.
- ✅ `create_cluster_map` produce un mapa con marcadores codificados por color que coinciden con las asignaciones de clúster.

**🤔 Pregunta(s) socrática(s)**

- El mapa de calor muestra densidad pero no puntos individuales. ¿Para qué casos de uso sería un mapa de puntos (solo marcadores) más útil que un mapa de calor?
- Los mapas de Folium son archivos HTML. ¿Cómo servirías uno desde un servidor web de Python para que se actualice en tiempo real a medida que llegan datos nuevos?

## Paso 5: Encuentra la ruta óptima a través de waypoints

La optimización de rutas — encontrar el camino más corto que visite todos los waypoints — es un problema clásico. Para un pequeño número de waypoints, puedes probar todas las permutaciones. Para conjuntos más grandes, necesitas una heurística. Este paso implementa ambas.

### 5.1 Implementa el enrutamiento de fuerza bruta y vecino más cercano

**👟 Pista inicial :** Crea `geo/route.py` con un optimizador de fuerza bruta para conjuntos pequeños de waypoints.

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

El enfoque de fuerza bruta prueba cada permutación — para 10 waypoints eso son 3,6 millones de permutaciones, que toma unos segundos. La heurística de vecino más cercano elige el punto no visitado más cercano en cada paso — es `O(n^2)` y escala a miles de waypoints, pero no garantiza la ruta óptima. Para planificación de rutas del mundo real, usarías un algoritmo más sofisticado (Christofides u OR-Tools), pero estos dos te dan la idea clave: las soluciones exactas son exponenciales, las heurísticas son polinomiales, y la brecha entre ellas es el precio de la escalabilidad.

**🎯 Resultado esperado :** Para 8 waypoints, `optimal_route_bruteforce` devuelve la ruta más corta posible y su distancia total en km. `nearest_neighbor_route` devuelve una ruta ligeramente más larga en una fracción del tiempo.

**🩹 Si sale mal :** Si la distancia de fuerza bruta es 0, los waypoints son todos el mismo punto. Si el vecino más cercano devuelve una ruta terriblemente más larga, el punto de inicio puede ser una mala elección — prueba con inicios diferentes.

### 5.2 Visualiza la ruta

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

**🎯 Resultado esperado :** `visualize_route(df, order)` crea `route.html` con una polilínea azul que conecta todos los waypoints en orden, con marcadores numerados en cada parada.

**🩹 Si sale mal :** Si la polilínea zigzaguea terriblemente, el orden de la ruta es incorrecto — revisa que los índices de `order` coinciden con las filas del DataFrame.

### 5.3 Verifica el enrutamiento

**✅ Lista de verificación**

- ✅ `optimal_route_bruteforce` encuentra la ruta más corta para ≤ 10 waypoints.
- ✅ `nearest_neighbor_route` produce una ruta válida que visita cada waypoint.
- ✅ `visualize_route` crea un archivo HTML con la ruta dibujada como polilínea.

**🤔 Pregunta(s) socrática(s)**

- Para 20 waypoints, `factorial(20) ≈ 2.4 × 10^18` permutaciones — la fuerza bruta es imposible. ¿En qué cantidad de waypoints la aproximación del vecino más cercano se vuelve "suficientemente buena" para tu caso de uso, y cómo medirías la brecha?
- Las rutas de entrega reales tienen ventanas de tiempo, tráfico y capacidad de vehículos. ¿Cómo extenderías este modelo para manejar restricciones más allá de solo la distancia?

## ⚠️ Errores comunes

- **Confundir grados y radianes en los cálculos de distancia.** La fórmula de Haversine requiere radianes. Un error común es pasar grados de latitud/longitud crudos a `np.sin`/`np.cos`, lo que produce resultados sin sentido. Siempre convierte primero con `np.radians`.
- **Usar distancia euclidiana sobre coordenadas crudas.** A la escala de una ciudad, la distancia euclidiana sobre grados es aproximadamente correcta. A la escala de un país o continente, es terriblemente equivocada porque un grado de longitud se encoge a medida que te acercas a los polos. Usa Haversine para cualquier cosa más allá de unos pocos kilómetros.
- **Ajuste de parámetros de DBSCAN sin visualización.** Elegir `eps_km` por conjetura no es fiable. Grafica la distribución de distancias (gráfico de k-distancia) y busca el "codo" donde las distancias saltan — ese es un buen valor inicial para `eps`.
- **Mapas de calor que no se renderizan en notebooks.** Los mapas de Folium son objetos HTML — se muestran en línea en Colab y Kaggle, pero pueden necesitar `display(m)` en algunos entornos de notebook. Si el mapa está en blanco, prueba con `m._repr_html_()` o guarda en un archivo y ábrelo.
- **Olvidar que la optimización de rutas es NP-difícil.** La fuerza bruta funciona para 8–10 puntos. Más allá de eso, necesitas vecino más cercano, recocido simulado o una librería de solvers. No dejes que la solución de fuerza bruta te haga creer que el enrutamiento siempre es rápido.

## Lo que acabas de construir

Un kit de herramientas de análisis geoespacial que carga datos de coordenadas, agrupa puntos con DBSCAN, calcula distancias del mundo real con la fórmula de Haversine, genera mapas interactivos de calor y de clústeres y optimiza rutas a través de múltiples waypoints. La idea clave en los cinco pasos es que los datos geográficos tienen restricciones únicas — la Tierra es curva, las distancias no son euclidianas y la estructura espacial importa — y las fórmulas y algoritmos correctos marcan la diferencia entre sinsentido y comprensión.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/geospatial-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/geospatial-analyzer) en el repositorio del curso tiene una versión más rica con datos de muestra del mundo real, tipos de visualización adicionales y la CLI conectada de extremo a extremo. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Agrega un paso de geocodificación que convierta direcciones de calles en coordenadas usando una API gratuita, para que la herramienta pueda partir de direcciones crudas en lugar de datos de lat/lon existentes.
- Implementa una superposición de diagrama de Voronoi en el mapa para mostrar a qué clúster pertenece cada región del mapa.
- Construye una versión en tiempo real que lea coordenadas GPS de un stream CSV y actualice el mapa de calor periódicamente.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓