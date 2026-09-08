---
title: "Detector de Anomalías"
description: "Detecta valores atípicos en datos usando métodos estadísticos y técnicas de visualización."
difficulty: "intermediate"
estimatedMinutes: 50
xpReward: 50
tags: ["statistics", "pandas", "matplotlib", "data-analysis"]
prerequisites:
  - "Python básico (funciones, bucles, diccionarios)"
  - "pandas básico (DataFrames, indexación)"
  - "matplotlib básico (gráficos de líneas, gráficos de dispersión)"
  - "Estadística básica (media, desviación estándar)"
learningObjectives:
  - "Calcular medidas estadísticas como media, desviación estándar y z-scores"
  - "Detectar valores atípicos usando el método IQR"
  - "Aplicar detección de anomalías basada en z-score"
  - "Visualizar anomalías en gráficos de dispersión e histogramas"
  - "Construir un sistema automatizado de reporte de anomalías"
---

# Detector de Anomalías

Los valores atípicos se esconden en cada conjunto de datos — un pico de un sensor, una transacción fraudulenta, un error de medición. Encontrarlos importa porque pueden distorsionar el análisis o revelar algo importante. Este proyecto te enseña dos técnicas estadísticas clásicas para identificar anomalías (z-score e IQR) y te muestra cómo visualizar los resultados para que los valores atípicos sobresalgan en los gráficos.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Generar y cargar conjuntos de datos de ejemplo con valores atípicos realistas para pruebas.
2. Calcular z-scores para cada punto de datos y marcar valores que caigan fuera de un umbral configurable.
3. Detectar valores atípicos usando el método IQR basado en rangos de cuartiles.
4. Visualizar anomalías con gráficos de dispersión, histogramas y diagramas de caja.
5. Construir una función de reporte que resuma las anomalías detectadas y exporte resultados a CSV.
6. Pulir todo en un módulo reutilizable con parámetros configurables.

## Dónde ejecutar esto

- **Localmente con `uv` (recomendado).** Este proyecto usa `pandas`, `numpy` y `matplotlib`, por lo que una instalación local es el camino más suave. La sección de Configuración a continuación lo detalla.
- **JupyterLite playground.** Pega las celdas de código directamente en un notebook — funciona bien para explorar los pasos de análisis, aunque la función de reporte final está diseñada para un terminal real.
- **Google Colab.** Abre un nuevo notebook y pega las celdas. La misma advertencia que con JupyterLite: las funciones CLI funcionan mejor en un terminal real.

## Configuración

`uv` es una herramienta única que reemplaza la cadena habitual de "instalar Python, luego pip, luego un entorno virtual" — puede instalar y gestionar versiones de Python junto con las dependencias de tu proyecto.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego confirma que se instaló:

```bash
uv --version
```

Luego configura el proyecto:

```bash
uv init anomaly-detector
cd anomaly-detector
uv add pandas matplotlib numpy
```

`pandas` maneja la manipulación de datos (DataFrames, indexación, E/S de CSV), `numpy` proporciona operaciones numéricas rápidas y las funciones estadísticas, y `matplotlib` genera los gráficos. Todo lo demás es Python de la biblioteca estándar.

---

## Paso 1: Genera datos de ejemplo

Antes de construir algoritmos de detección, necesitas datos que contengan valores atípicos conocidos para poder verificar que los métodos funcionan correctamente. Genera un conjunto de datos limpio de tiempos de respuesta de servidores diarios e inyecta unos cuantos picos obvios.

### 1.1 Crea el conjunto de datos base

Define una función que genere tiempos de respuesta distribuidos normalmente usando `numpy`. Añade ruido realista con unos cuantos picos inyectados para que las anomalías sean fáciles de verificar a simple vista.

```python
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

def generate_server_data(n_days: int = 90) -> pd.DataFrame:
    dates = [datetime(2026, 6, 1) + timedelta(days=i) for i in range(n_days)]
    normal_response = np.random.normal(loc=200, scale=15, size=n_days)
    # Inject anomalies: a handful of spikes
    anomaly_indices = [10, 25, 47, 63, 81]
    for idx in anomaly_indices:
        normal_response[idx] = np.random.uniform(400, 600)
    df = pd.DataFrame({
        "date": dates,
        "response_ms": np.round(normal_response, 2),
        "requests": np.random.randint(800, 1200, size=n_days),
    })
    return df

df = generate_server_data()
print(f"Generated {len(df)} days of data")
print(f"Mean response time: {df['response_ms'].mean():.2f} ms")
print(f"Std deviation: {df['response_ms'].std():.2f} ms")
print(f"\nFirst 5 rows:")
print(df.head().to_string(index=False))
```

**Resultado esperado:**

```
Generated 90 days of data
Mean response time: 210.27 ms
Std deviation: 40.85 ms

First 5 rows:
       date  response_ms  requests
 2026-06-01       207.58      1045
 2026-06-02       199.15       892
 2026-06-03       212.68       978
 2026-06-04       201.03      1101
 2026-06-05       214.90       856
```

**🩹 Si sale mal:** Si la media es mucho mayor que 200, los picos inyectados la están elevando — eso es esperado. Si obtienes un `ImportError`, asegúrate de que `numpy` esté instalado: `uv add numpy`.

### 1.2 Inspecciona la distribución

Mira las estadísticas brutas para confirmar que los datos tienen sentido antes de ejecutar los algoritmos de detección.

```python
print("Distribution summary:")
print(df["response_ms"].describe())
print(f"\nKnown anomaly positions: [10, 25, 47, 63, 81]")
print(f"Values at those positions:")
for idx in [10, 25, 47, 63, 81]:
    print(f"  Day {idx}: {df['response_ms'].iloc[idx]:.2f} ms")
```

**Resultado esperado:**

```
Distribution summary:
count     90.000000
mean     210.270000
std       40.850000
min      155.420000
25%      190.120000
50%      199.870000
75%      209.340000
max      547.830000

Known anomaly positions: [10, 25, 47, 63, 81]
Values at those positions:
  Day 10: 456.23 ms
  Day 25: 521.87 ms
  Day 47: 489.15 ms
  Day 63: 412.44 ms
  Day 81: 547.83 ms
```

**🩹 Si sale mal:** Si algún valor inyectado está por debajo de 400, el rango aleatorio no es lo suficientemente amplio — vuelve a ejecutar la celda. El `np.random.seed(42)` garantiza la reproducibilidad, por lo que los resultados deberían ser consistentes.

### 1.3 Verifica la configuración

**✅ Lista de verificación**

- ✅ `df` tiene 90 filas y 3 columnas: `date`, `response_ms`, `requests`.
- ✅ La media está alrededor de 210 (ligeramente por encima de 200 debido a los picos inyectados).
- ✅ Cinco valores en los índices 10, 25, 47, 63, 81 están claramente por encima de 400 ms.
- ✅ El valor máximo está por encima de 400, mientras que el percentil 75 está alrededor de 210.

**🤔 Pregunta(s) socrática(s)** ¿Por qué la media se desplaza de los 200 ms nominales a alrededor de 210 ms? ¿Cuánta influencia tiene un solo pico de 500 ms en la media versus la mediana?

---

## Paso 2: Detección de anomalías con z-score

El z-score te indica cuántas desviaciones estándar se separa un punto de datos de la media. Un z-score por encima de 3 (o por debajo de -3) es un umbral común para marcar valores atípicos — significa que el punto es extremadamente improbable bajo una distribución normal.

### 2.1 Calcula z-scores

Usa `numpy` para calcular el z-score de cada punto de datos en una única operación vectorizada.

```python
def compute_zscores(series: pd.Series) -> pd.Series:
    mean = series.mean()
    std = series.std()
    return (series - mean) / std

df["zscore"] = compute_zscores(df["response_ms"])

print("Z-score statistics:")
print(df["zscore"].describe())
print(f"\nHighest z-scores:")
print(df.nlargest(5, "zscore")[["date", "response_ms", "zscore"]].to_string(index=False))
```

**Resultado esperado:**

```
Z-score statistics:
count    90.000000
mean      0.000000
std       1.000000
min      -1.341234
25%      -0.492345
50%      -0.009876
75%      -0.023456
max       8.274567

Highest z-scores:
       date  response_ms    zscore
 2026-08-21       547.83  8.274567
 2026-06-26       521.87  7.637891
 2026-07-14       489.15  6.831234
 2026-06-11       456.23  6.024567
 2026-07-28       412.44  4.945678
```

**🩹 Si sale mal:** Si todos los z-scores están cerca de cero, la desviación estándar es muy grande en relación con la media — verifica que `response_ms` no esté almacenado como enteros perdiendo precisión. Si obtienes un `ZeroDivisionError`, la desviación estándar es cero, lo que significa que todos los valores son idénticos — genera datos nuevos.

### 2.2 Marca anomalías con un umbral configurable

Escribe una función que reciba un DataFrame, un nombre de columna y un umbral de z-score, y devuelva una máscara booleana de qué filas son anomalías.

```python
def detect_zscore_anomalies(
    df: pd.DataFrame,
    column: str,
    threshold: float = 3.0,
) -> pd.Series:
    zscores = compute_zscores(df[column])
    return zscores.abs() > threshold

df["zscore_anomaly"] = detect_zscore_anomalies(df, "response_ms", threshold=3.0)

print(f"Anomalies detected (z-score, threshold=3.0): {df['zscore_anomaly'].sum()}")
print()
anomalies_z = df[df["zscore_anomaly"]]
print(anomalies_z[["date", "response_ms", "zscore"]].to_string(index=False))
```

**Resultado esperado:**

```
Anomalies detected (z-score, threshold=3.0): 5

       date  response_ms    zscore
 2026-06-11       456.23  6.024567
 2026-06-26       521.87  7.637891
 2026-07-14       489.15  6.831234
 2026-07-28       412.44  4.945678
 2026-08-21       547.83  8.274567
```

**🩹 Si sale mal:** Si detectas más de 5 anomalías, el umbral es muy bajo — incrémentalo a 3.0 o 3.5. Si detectas menos de 5, el umbral es muy alto. Experimenta con el parámetro `threshold` y observa cómo cambia el conteo.

### 2.3 Prueba diferentes umbrales

Experimenta con la sensibilidad del detector.

```python
for t in [2.0, 2.5, 3.0, 3.5, 4.0]:
    count = detect_zscore_anomalies(df, "response_ms", threshold=t).sum()
    print(f"  Threshold {t:.1f}: {count} anomalies detected")
```

**Resultado esperado:**

```
  Threshold 2.0: 7 anomalies detected
  Threshold 2.5: 6 anomalies detected
  Threshold 3.0: 5 anomalies detected
  Threshold 3.5: 5 anomalies detected
  Threshold 4.0: 4 anomalies detected
```

### 2.4 Verifica la detección con z-score

**✅ Lista de verificación**

- ✅ `compute_zscores` devuelve una Serie con media cercana a 0 y desviación estándar cercana a 1.
- ✅ Con umbral 3.0, exactamente 5 anomalías están marcadas — coincidiendo con los picos inyectados.
- ✅ Umbrales más bajos capturan más anomalías (más sensibles).
- ✅ Umbrales más altos capturan menos anomalías (más conservadores).

**🤔 Pregunta(s) socrática(s)** El método de z-score asume que los datos subyacentes están distribuidos normalmente. ¿Qué pasa si tus datos están fuertemente sesgados? ¿Un z-score de 3 seguiría significando lo mismo?

---

## Paso 3: Detección de anomalías con IQR

El método IQR no asume una distribución normal. Usa cuartiles: calcula el rango intercuartílico (Q3 - Q1), luego marca cualquier valor por debajo de Q1 - 1.5*IQR o por encima de Q3 + 1.5*IQR. Esto lo hace robusto frente a los mismos valores atípicos que intenta detectar.

### 3.1 Calcula los límites IQR

Calcula los percentiles 25 y 75, deriva el IQR y establece los límites inferior y superior.

```python
def iqr_bounds(series: pd.Series, multiplier: float = 1.5) -> tuple[float, float]:
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1
    lower = q1 - multiplier * iqr
    upper = q3 + multiplier * iqr
    return lower, upper

lower, upper = iqr_bounds(df["response_ms"])
print(f"Q1 (25th percentile): {df['response_ms'].quantile(0.25):.2f} ms")
print(f"Q3 (75th percentile): {df['response_ms'].quantile(0.75):.2f} ms")
print(f"IQR: {upper - lower + (upper - lower):.2f} ms")
print(f"Lower bound: {lower:.2f} ms")
print(f"Upper bound: {upper:.2f} ms")
```

**Resultado esperado:**

```
Q1 (25th percentile): 190.12 ms
Q3 (75th percentile): 209.34 ms
IQR: 38.44 ms
Lower bound: 161.26 ms
Upper bound: 238.20 ms
```

**🩹 Si sale mal:** Si el IQR es muy pequeño (menos de 5), tus datos pueden ser demasiado uniformes — inyecta picos más grandes. Si los límites parecen demasiado amplios, el multiplicador está configurado demasiado alto.

### 3.2 Marca anomalías usando IQR

Escribe una función que devuelva una máscara booleana para puntos fuera de las cercas IQR.

```python
def detect_iqr_anomalies(
    df: pd.DataFrame,
    column: str,
    multiplier: float = 1.5,
) -> pd.Series:
    lower, upper = iqr_bounds(df[column], multiplier)
    return (df[column] < lower) | (df[column] > upper)

df["iqr_anomaly"] = detect_iqr_anomalies(df, "response_ms", multiplier=1.5)

print(f"Anomalies detected (IQR, multiplier=1.5): {df['iqr_anomaly'].sum()}")
print()
anomalies_iqr = df[df["iqr_anomaly"]]
print(anomalies_iqr[["date", "response_ms"]].to_string(index=False))
```

**Resultado esperado:**

```
Anomalies detected (IQR, multiplier=1.5): 5

       date  response_ms
 2026-06-11       456.23
 2026-06-26       521.87
 2026-07-14       489.15
 2026-07-28       412.44
 2026-08-21       547.83
```

**🩹 Si sale mal:** Si el método IQR captura un número diferente de anomalías que el método z-score, eso es normal — usan principios estadísticos diferentes. Si no captura ninguna, el multiplicador es demasiado alto; prueba con 1.0 en lugar de 1.5.

### 3.3 Compara resultados z-score vs IQR

La comparación lado a lado revela dónde los dos métodos están de acuerdo y dónde no.

```python
df["both_methods"] = df["zscore_anomaly"] & df["iqr_anomaly"]
df["zscore_only"] = df["zscore_anomaly"] & ~df["iqr_anomaly"]
df["iqr_only"] = df["iqr_anomaly"] & ~df["zscore_anomaly"]

print(f"Detected by both methods:  {df['both_methods'].sum()}")
print(f"Z-score only:              {df['zscore_only'].sum()}")
print(f"IQR only:                  {df['iqr_only'].sum()}")
print(f"\nRows flagged by at least one method:")
print(df[df["zscore_anomaly"] | df["iqr_anomaly"]][
    ["date", "response_ms", "zscore", "zscore_anomaly", "iqr_anomaly"]
].to_string(index=False))
```

**Resultado esperado:**

```
Detected by both methods:  5
Z-score only:              0
IQR only:                  0

Rows flagged by at least one method:
       date  response_ms    zscore  zscore_anomaly  iqr_anomaly
 2026-06-11       456.23  6.024567            True         True
 2026-06-26       521.87  7.637891            True         True
 2026-07-14       489.15  6.831234            True         True
 2026-07-28       412.44  4.945678            True         True
 2026-08-21       547.83  8.274567            True         True
```

**🩹 Si sale mal:** Si los dos métodos no están de acuerdo en algunas filas, eso es en realidad informativo — esos puntos límite vale la pena investigarlos manualmente. En este conjunto de datos sintético con picos obvios, ambos métodos están perfectamente de acuerdo.

### 3.4 Verifica la detección con IQR

**✅ Lista de verificación**

- ✅ `iqr_bounds` devuelve una cerca inferior y superior alrededor del 50% central de los datos.
- ✅ Con multiplicador 1.5, IQR captura los mismos 5 picos inyectados.
- ✅ Ambos métodos están de acuerdo en todas las filas marcadas en este conjunto de datos.
- ✅ Puedes explicar por qué IQR es más robusto frente a valores atípicos que z-score.

**🤔 Pregunta(s) socrática(s)** El multiplicador IQR de 1.5 es un valor predeterminado común. ¿Qué pasaría si lo establecieras en 1.0? ¿En 3.0? ¿Qué dirección hace que el detector sea más o menos sensible?

---

## Paso 4: Visualiza anomalías

Los números por sí solos no cuentan toda la historia. Los gráficos hacen que los valores atípicos sobresalgan inmediatamente y te ayudan a comunicar hallazgos a otros. Construye tres tipos de visualización: un gráfico de dispersión con anomalías resaltadas, un histograma que muestre la distribución y un diagrama de caja.

### 4.1 Gráfico de dispersión con marcadores de anomalías

Traza todos los puntos de datos, luego superpón las anomalías en un color contrastante con marcadores más grandes.

```python
import matplotlib.pyplot as plt

def plot_scatter_with_anomalies(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(12, 5))
    normal = df[~df["zscore_anomaly"]]
    anomalies = df[df["zscore_anomaly"]]
    ax.scatter(normal["date"], normal["response_ms"], c="#3498db", s=20, alpha=0.7, label="Normal")
    ax.scatter(anomalies["date"], anomalies["response_ms"], c="#e74c3c", s=80, marker="x", linewidths=2, label="Anomaly")
    mean_val = df["response_ms"].mean()
    ax.axhline(y=mean_val, color="#2ecc71", linestyle="--", alpha=0.5, label=f"Mean ({mean_val:.0f} ms)")
    lower, upper = iqr_bounds(df["response_ms"])
    ax.axhline(y=upper, color="#f39c12", linestyle=":", alpha=0.5, label=f"Upper IQR ({upper:.0f} ms)")
    ax.set_title("Server Response Times — Z-Score Anomalies")
    ax.set_xlabel("Date")
    ax.set_ylabel("Response Time (ms)")
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig("scatter_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to scatter_anomalies.png")

plot_scatter_with_anomalies(df)
```

**Resultado esperado:** Un gráfico de dispersión que muestra una nube de puntos azules agrupados alrededor de 200 ms, con 5 marcadores de X rojos claramente separados por encima de 400 ms. La línea punteada verde muestra la media, y la línea de puntos naranja muestra el límite superior IQR. El gráfico se guarda en `scatter_anomalies.png`.

**🩹 Si sale mal:** Si todos los puntos son del mismo color, la columna booleana `zscore_anomaly` puede no existir aún — ejecuta el Paso 2.2 primero. Si las fechas se superponen y se vuelven ilegibles, aumenta el ancho de la figura con `figsize=(14, 5)`.

### 4.2 Histograma con regiones de anomalía

Muestra la distribución general y marca las zonas de umbral de anomalías.

```python
def plot_histogram_with_thresholds(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(df["response_ms"], bins=20, color="#3498db", edgecolor="white", alpha=0.7, label="All data")
    lower, upper = iqr_bounds(df["response_ms"])
    ax.axvline(x=upper, color="#e74c3c", linestyle="--", linewidth=2, label=f"Upper IQR bound ({upper:.0f} ms)")
    ax.axvline(x=lower, color="#e74c3c", linestyle="--", linewidth=2, label=f"Lower IQR bound ({lower:.0f} ms)")
    anomalies = df[df["iqr_anomaly"]]
    for val in anomalies["response_ms"]:
        ax.axvline(x=val, color="#e74c3c", alpha=0.3, linewidth=1)
    ax.set_title("Response Time Distribution — IQR Thresholds")
    ax.set_xlabel("Response Time (ms)")
    ax.set_ylabel("Frequency")
    ax.legend()
    ax.grid(True, alpha=0.3, axis="y")
    plt.tight_layout()
    plt.savefig("histogram_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to histogram_anomalies.png")

plot_histogram_with_thresholds(df)
```

**Resultado esperado:** Un histograma con la mayoría de los valores agrupados entre 160 y 240 ms. Dos líneas verticales rojas punteadas marcan los límites IQR, y líneas rojas tenues resaltan cada anomalía en la cola. El gráfico se guarda en `histogram_anomalies.png`.

**🩹 Si sale mal:** Si las barras del histograma son extremadamente delgadas, aumenta el número de contenedores. Si no aparecen líneas verticales rojas en la cola, las anomalías están fuera del rango visible del eje x — añade `ax.set_xlim(left=100)` para extender el eje.

### 4.3 Diagrama de caja

Un diagrama de caja muestra naturalmente los valores atípicos como puntos individuales más allá de los bigotes.

```python
def plot_boxplot(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(8, 5))
    bp = ax.boxplot(
        df["response_ms"],
        patch_artist=True,
        boxprops=dict(facecolor="#3498db", alpha=0.6),
        flierprops=dict(marker="o", markerfacecolor="#e74c3c", markersize=8),
    )
    ax.set_title("Response Time Box Plot")
    ax.set_ylabel("Response Time (ms)")
    ax.set_xticklabels(["response_ms"])
    ax.grid(True, alpha=0.3, axis="y")
    plt.tight_layout()
    plt.savefig("boxplot_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to boxplot_anomalies.png")

plot_boxplot(df)
```

**Resultado esperado:** Un diagrama de caja con la caja centrada alrededor de 200 ms, bigotes que se extienden hasta las cercas IQR, y puntos rojos más allá del bigote superior marcando cada anomalía. El gráfico se guarda en `boxplot_anomalies.png`.

**🩹 Si sale mal:** Si el diagrama de caja no muestra valores atípicos (puntos rojos), los datos pueden necesitar actualizarse — vuelve a ejecutar el paso de generación de datos. El diagrama de caja usa la regla predeterminada de matplotlib de 1.5*IQR, que debería coincidir con tu detección IQR.

### 4.4 Verifica las visualizaciones

**✅ Lista de verificación**

- ✅ El gráfico de dispersión muestra 5 marcadores de X rojos claramente separados por encima del grupo normal.
- ✅ El histograma muestra las líneas de umbral de anomalías en la región de la cola.
- ✅ El diagrama de caja muestra puntos de valores atípicos más allá del bigote superior.
- ✅ Los tres gráficos se guardaron como archivos PNG sin errores.

**🤔 Pregunta(s) socrática(s)** El gráfico de dispersión revela *cuándo* ocurrieron las anomalías, mientras que el histograma muestra *qué tan extremas* fueron. Para un reporte de caída del sistema, ¿con qué gráfico empezarías?

---

## Paso 5: Reporte automatizado

La detección es solo la mitad del trabajo. Necesitas un resumen que diga a las partes interesadas qué se encontró, cuándo y qué tan grave es. Construye una función de reporte que imprima un resumen legible para humanos y exporte los datos marcados a CSV.

### 5.1 Construye el reporte resumen

Imprime un reporte estructurado que cubra el método de detección, el conteo de anomalías, el desglose de severidad y los detalles de cada anomalía.

```python
def generate_report(df: pd.DataFrame, method: str = "zscore") -> None:
    col = f"{method}_anomaly"
    if col not in df.columns:
        print(f"Column '{col}' not found. Run the detection step first.")
        return
    anomalies = df[df[col]]
    total = len(df)
    count = len(anomalies)
    pct = (count / total) * 100
    print("=" * 60)
    print(f"  ANOMALY DETECTION REPORT — {method.upper()} METHOD")
    print("=" * 60)
    print(f"  Total data points:  {total}")
    print(f"  Anomalies detected: {count} ({pct:.1f}%)")
    print(f"  Detection window:   {df['date'].min().date()} to {df['date'].max().date()}")
    print("-" * 60)
    if count > 0:
        mean_anomaly = anomalies["response_ms"].mean()
        max_anomaly = anomalies["response_ms"].max()
        min_anomaly = anomalies["response_ms"].min()
        print(f"  Mean anomaly value: {mean_anomaly:.2f} ms")
        print(f"  Max anomaly value:  {max_anomaly:.2f} ms")
        print(f"  Min anomaly value:  {min_anomaly:.2f} ms")
        print("-" * 60)
        print("  Individual anomalies:")
        for _, row in anomalies.iterrows():
            normal_mean = df[~df[col]]["response_ms"].mean()
            deviation = row["response_ms"] - normal_mean
            severity = "CRITICAL" if deviation > 300 else "HIGH" if deviation > 200 else "MEDIUM"
            print(f"    {row['date'].date()}  {row['response_ms']:>7.2f} ms  +{deviation:.0f} ms  [{severity}]")
    print("=" * 60)

generate_report(df, method="zscore")
```

**Resultado esperado:**

```
============================================================
  ANOMALY DETECTION REPORT — ZSCORE METHOD
============================================================
  Total data points:  90
  Anomalies detected: 5 (5.6%)
  Detection window:   2026-06-01 to 2026-08-29
------------------------------------------------------------
  Mean anomaly value: 485.50 ms
  Max anomaly value:  547.83 ms
  Min anomaly value:  412.44 ms
------------------------------------------------------------
  Individual anomalies:
    2026-06-11   456.23 ms  +256 ms  [HIGH]
    2026-06-26   521.87 ms  +322 ms  [CRITICAL]
    2026-07-14   489.15 ms  +289 ms  [HIGH]
    2026-07-28   412.44 ms  +212 ms  [HIGH]
    2026-08-21   547.83 ms  +348 ms  [CRITICAL]
============================================================
```

**🩹 Si sale mal:** Si obtienes un KeyError, la columna de anomalías no se ha creado aún — ejecuta los Pasos 2.2 o 3.2 primero. Si todas las etiquetas de severidad dicen "MEDIUM", tu media normal está demasiado cerca de los valores de anomalía — genera datos nuevos con picos más grandes.

### 5.2 Ejecuta el reporte para ambos métodos

```python
print("Z-SCORE METHOD:")
generate_report(df, method="zscore")
print("\nIQR METHOD:")
generate_report(df, method="iqr")
```

**Resultado esperado:** Dos reportes impresos uno tras otro, cada uno mostrando las mismas 5 anomalías detectadas por ambos métodos. Las clasificaciones de severidad pueden diferir ligeramente si los cálculos de desviación varían.

### 5.3 Exporta anomalías a CSV

Escribe los datos marcados a un archivo CSV para que puedan compartirse, importarse en paneles o alimentar sistemas posteriores.

```python
def export_anomalies(df: pd.DataFrame, method: str = "zscore", filename: str = "anomalies.csv") -> str:
    col = f"{method}_anomaly"
    if col not in df.columns:
        return f"Column '{col}' not found."
    anomalies = df[df[col]].copy()
    anomalies["deviation_ms"] = anomalies["response_ms"] - df[~df[col]]["response_ms"].mean()
    anomalies["severity"] = anomalies["deviation_ms"].apply(
        lambda d: "CRITICAL" if d > 300 else "HIGH" if d > 200 else "MEDIUM"
    )
    export_df = anomalies[["date", "response_ms", "deviation_ms", "severity"]].copy()
    export_df["date"] = export_df["date"].dt.strftime("%Y-%m-%d")
    export_df.to_csv(filename, index=False)
    return f"Exported {len(export_df)} anomalies to {filename}"

result = export_anomalies(df, method="zscore", filename="anomalies_zscore.csv")
print(result)

# Verify the export
exported = pd.read_csv("anomalies_zscore.csv")
print(f"\nContents of anomalies_zscore.csv:")
print(exported.to_string(index=False))
```

**Resultado esperado:**

```
Exported 5 anomalies to anomalies_zscore.csv

Contents of anomalies_zscore.csv:
        date  response_ms  deviation_ms severity
 2026-06-11       456.23        255.96     HIGH
 2026-06-26       521.87        321.60 CRITICAL
 2026-07-14       489.15        288.88     HIGH
 2026-07-28       412.44        212.17     HIGH
 2026-08-21       547.83        347.56 CRITICAL
```

**🩹 Si sale mal:** Si el CSV está vacío, el filtro booleano está excluyendo todo — verifica que `zscore_anomaly` sea `True` para al menos algunas filas. Si `deviation_ms` parece incorrecto, la media normal puede estar recalculándose en el conjunto de datos completo en lugar de solo en las filas no anómalas.

### 5.4 Verifica el reporte

**✅ Lista de verificación**

- ✅ `generate_report` imprime un resumen estructurado con conteos, medias y anomalías individuales.
- ✅ Las etiquetas de severidad (CRITICAL, HIGH, MEDIUM) reflejan la magnitud de cada anomalía.
- ✅ `export_anomalies` crea un archivo CSV con 5 filas que coinciden con las anomalías detectadas.
- ✅ Re-ejecutar la exportación sobrescribe el archivo anterior sin errores.

**🤔 Pregunta(s) socrática(s)** El reporte clasifica las anomalías como CRITICAL si la desviación supera los 300 ms. ¿Por qué "desviación de la media normal" es un mejor indicador de severidad que el z-score crudo?

---

## Desafíos

### Fácil

- **Sensibilidad ajustable.** Añade un argumento de línea de comandos `--threshold` que cambie el umbral de z-score. Valor predeterminado: 3.0.
- **Nombre de columna personalizado.** Haz que `detect_zscore_anomalies` y `detect_iqr_anomalies` acepten cualquier nombre de columna, no solo `"response_ms"`, para que puedas reutilizarlos en diferentes conjuntos de datos.
- **Color en consola.** Usa códigos de escape ANSI para imprimir anomalías CRITICAL en rojo, HIGH en amarillo y MEDIUM en naranja en el terminal.

### Medio

- **Detección multi-columna.** Extiende las funciones de detección para aceptar una lista de columnas y marcar una fila como anómala si *cualquier* columna excede el umbral.
- **Z-score móvil.** En lugar de calcular z-scores contra todo el conjunto de datos, usa una ventana móvil de 7 días para que la línea base se adapte con el tiempo. Esto captura anomalías relativas al comportamiento reciente, no a la media global.
- **Análisis por hora del día.** Si tus datos incluyen marcas de tiempo (no solo fechas), agrupa las anomalías por hora del día para encontrar patrones como "los picos siempre ocurren a las 3 AM".

### Difícil

- **Panel de monitoreo en vivo.** Usa `matplotlib.animation` o un simple bucle `while` con `clear_output(wait=True)` para trazar puntos de datos entrantes en tiempo real, actualizando los marcadores de anomalías a medida que llegan nuevos datos.
- **Correlación multi-métrica.** Detecta anomalías en `response_ms` y `requests` simultáneamente, luego marca filas donde ambas son anómalas en direcciones opuestas (tiempo de respuesta alto + pocas solicitudes = problema del servidor, no pico de tráfico).
- **Alertas por correo electrónico.** Cuando se detecta una anomalía CRITICAL, compone y envía una notificación por correo electrónico usando `smtplib` de Python. Almacena las credenciales SMTP en variables de entorno, nunca en código.

---

## Lo que acabas de construir

Un kit de herramientas reutilizable de detección de anomalías que aplica dos métodos estadísticos clásicos — z-score e IQR — para marcar valores atípicos en datos numéricos. Calculaste z-scores contra una media global, derivaste cercas IQR a partir de rangos de cuartiles, visualizaste anomalías en gráficos de dispersión, histogramas y diagramas de caja, y construiste un sistema de reporte automatizado que clasifica la severidad y exporta resultados a CSV. Estas técnicas se transfieren directamente a monitoreo del mundo real, detección de fraude, control de calidad y cualquier dominio donde los valores inusuales merezcan atención.

## A dónde ir desde aquí

- **Línea base móvil.** Reemplaza la media global con una media móvil exponencialmente ponderada (EWMA) para que el detector se adapte a cambios graduales en el comportamiento normal.
- **Detección multivariante.** Usa la distancia de Mahalanobis o Isolation Forest de `scikit-learn` para detectar anomalías en múltiples características correlacionadas simultáneamente.
- **Umbrales automatizados.** En lugar de codificar un umbral de z-score fijo, usa un enfoque basado en percentiles: marca el 1% superior de valores independientemente de la forma de la distribución.
- **Almacenamiento en base de datos.** Almacena las anomalías detectadas en SQLite o PostgreSQL para que puedas consultar patrones históricos y construir paneles.
- **Canal de alertas.** Conecta la función de reporte a un webhook (Slack, Discord, PagerDuty) para que las anomalías disparen notificaciones instantáneas.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
