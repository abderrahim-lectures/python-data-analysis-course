---
title: "Analizador de Series Temporales"
description: "Descompone una serie temporal en tendencia, estacionalidad y residuo con pandas; pronostica hacia adelante, puntúa el pronóstico, marca anomalías frente a una línea base y correlaciona dos series en un gráfico guardado."
difficulty: "intermediate"
estimatedMinutes: 70
tags: ["pandas", "numpy", "data-viz"]
learningObjectives:
  - Generar y dar forma a una serie temporal indexada por datetime con pandas
  - Descomponer una serie en tendencia, estacionalidad y residuo
  - Pronosticar hacia adelante con un modelo de tendencia-más-estación
  - Puntuar el error de pronóstico con un backtest
  - Detectar anomalías y correlacionar dos series en un gráfico
prerequisites:
  - "Fundamentos de Python (funciones, bucles)"
  - "Pandas DataFrames y Series (indexación, dtypes)"
  - "Instalar paquetes con uv"
---

# 🛠️ 📈 Analizador de Series Temporales

Registros de temperatura, carga de servidores, tráfico web — casi todo lo real llega como una secuencia a lo largo del tiempo, y los analistas pasan sus días separando lo que una serie *hace* en tres señales: la deriva lenta (tendencia), el ritmo repetitivo (estacionalidad) y el ruido sobrante (residuo). Este proyecto construye esa descomposición desde cero con pandas, y luego usa las piezas: pronostica la próxima semana con un modelo de tendencia-más-estación, puntúa el pronóstico contra un holdout real, marca las fechas que no encajan en el patrón y correlaciona dos series en un gráfico que puedes guardar de verdad.

Esto asume Python 101 y comodidad con las Series de pandas — no se requiere nada de Análisis de Datos más allá de eso. Es opcional y no se califica; consulta [Proyectos del Mundo Real](/docs/projects) para ver la lista completa y en crecimiento.

## 🎯 Lo que harás

1. Generar una serie realista de clientes de una cafetería con un índice de datetime.
2. Descomponerla en componentes de tendencia, estacional y residuo a mano.
3. Pronosticar la próxima semana con un modelo de tendencia-más-estación.
4. Hacer backtest del pronóstico y medir su error en los días retenidos.
5. Detectar anomalías y graficar dos series correlacionadas a un PNG.

## Dónde ejecutar esto

**Localmente con `uv`** es la ruta principal. pandas y NumPy se instalan limpiamente, el backend no interactivo `Agg` de matplotlib (Paso 5) renderiza los gráficos incluso sin pantalla, y tus archivos de gráfico aterrizan de verdad en la carpeta del proyecto.

**Google Colab, Kaggle Notebooks y Binder** ejecutan cada paso de forma idéntica — las tres bibliotecas están preinstaladas ahí. La salvedad honesta es la habitual para los proyectos de visualización de datos: el sistema de archivos de un notebook es efímero, así que el PNG guardado y cualquier CSV que escribas pueden no sobrevivir a un reinicio de sesión. Trátalos como caminos de prueba y cambia a `uv` local cuando los artefactos necesiten persistir.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-series-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-series-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ftime-series-analyzer%2Fnotebook.ipynb)

## Configuración

Crea el proyecto e instala las tres bibliotecas sobre las que está construido el analizador.

```bash
uv init time-series-analyzer
cd time-series-analyzer
uv add pandas numpy matplotlib
```

```bash
uv run python -c "import pandas, numpy, matplotlib; print('ok')"
```

`pandas` se encarga del índice de datetime, el remuestreo y el `groupby` usado para la estacionalidad; `numpy` proporciona la aleatoriedad sembrada y la regresión `polyfit` del Paso 3; `matplotlib` dibuja el artefacto final. Instalar los tres por adelantado mantiene cada paso posterior enfocado en las ideas de las *series temporales*.

**✅ Lista de verificación**

- ✅ `uv add pandas numpy matplotlib` terminó y la comprobación de import imprime `ok`.
- ✅ Existe un proyecto fresco `time-series-analyzer/` con un `pyproject.toml`.

## Paso 1: Construye y da forma a una serie indexada por datetime

El análisis de series temporales vive o muere por el índice: cada ventana, día de la semana y rezago aguas abajo asume que cada fila sabe *cuándo* es. Este paso genera una serie diaria realista y le da un `DatetimeIndex` adecuado.

### 1.1 Genera la serie de clientes de la cafetería

**👟 Pista inicial :** Construye la serie a partir de tres partes deliberadamente nombradas — una tendencia lineal, una estacionalidad semanal sinusoidal clave basada en `dayofweek` y ruido sembrado — para que la descomposición del Paso 2 tenga estructura real que recuperar.

```python
# series.py
import numpy as np
import pandas as pd

def make_cafe_guests(days: int = 365, seed: int = 42) -> pd.Series:
    rng = np.random.default_rng(seed)
    idx = pd.date_range("2025-01-01", periods=days, freq="D")
    trend = np.linspace(100, 140, days)
    weekly = 8 * np.sin(2 * np.pi * idx.dayofweek / 7)
    noise = rng.normal(0, 5, days)
    return pd.Series(trend + weekly + noise, index=idx, name="guests")

s = make_cafe_guests()
print(s.head(3))
print("index type:", type(s.index).__name__, "| dtype:", s.dtype)
```

`idx.dayofweek` es el accessor crucial de pandas: produce 0–6 (lunes–domingo) para cada fila, y multiplicar por `2π/7` desfasa el seno para que los días de la semana alternen alto y bajo — *estacionalidad* semanal real, no una fluctuación aleatoria. `np.random.default_rng(seed)` es la API moderna de sembrado de NumPy; la semilla fija hace que el ruido sea reproducible. Devolver una `Series` con `index=idx, name="guests"` significa que cada función posterior (ventanas móviles, `groupby` por día de la semana, trazado) obtiene las marcas de tiempo de forma gratuita.

**🎯 Resultado esperado :** Tres filas con fecha (empezando `2025-01-01`), valores cerca de 100, más `index type: DatetimeIndex | dtype: float64`.

**🩹 Si sale mal :** Si el tipo de índice imprime `RangeIndex` o `Index`, falta la asignación `pd.Series(..., index=idx)` y la matemática de días de la semana aguas abajo no tiene dónde engancharse. Si los valores rondan 1000 en lugar de ~100–150, `trend` y `weekly` están invertidos. Si la serie no es reproducible entre ejecuciones, el argumento `seed` no está llegando a `default_rng`.

### 1.2 Verifica la forma de la serie

**✅ Lista de verificación**

- ✅ `s` tiene un `DatetimeIndex` que cubre 365 días a frecuencia diaria.
- ✅ `s.index.dayofweek` recorre 0–6 repetidamente y `s.dtype` es un float.
- ✅ La misma `seed` produce la serie idéntica en una segunda llamada.

**🤔 Pregunta(s) socrática(s)**

- La estacionalidad está construida desde `dayofweek`, así que se repite semanalmente. ¿Cómo diferiría el modelo si la serie usara en su lugar `idx.dayofyear`, y en cuál confiarías para los patrones anuales (vacacionales)?
- Los valores son flotantes a una precisión implícita, pero los contadores reales de cafetería son enteros. ¿Cuándo importa mantener el ruido flotante para la descomposición, y cuándo redondearías primero a clientes enteros?

## Paso 2: Descompón en tendencia, estacionalidad y residuo

Una tendencia es "lo que la serie hace lentamente"; la estacionalidad es "el ritmo que se repite"; el residuo es "todo lo demás". Este paso calcula los tres directamente — una media móvil para la tendencia, promedios por día de la semana para la estacionalidad y lo que quede como el residuo.

### 2.1 Escribe la descomposición aditiva

**👟 Pista inicial :** El orden de curador de museo importa — primero la tendencia (media móvil), luego `series - trend` para el resto des-tendencializado, luego los promedios por día de la semana de ese resto como estacionalidad, y luego `detrended - seasonal` como residuo.

```python
# series.py (continuación)
def decompose(series: pd.Series, window: int = 14) -> tuple[pd.Series, pd.Series, pd.Series]:
    trend = series.rolling(window, center=True).mean()
    detrended = series - trend
    seasonal = detrended.groupby(series.index.dayofweek).transform("mean")
    residual = detrended - seasonal
    return trend, seasonal, residual

trend, seasonal, residual = decompose(s)
print(seasonal.groupby(seasonal.index.dayofweek).first().to_string())
print("residual std: {:.2f}".format(residual.std()))
```

La media móvil con `center=True` es el estimador de tendencia: cada punto se convierte en el promedio de su vecindario de ±7 días, lo que suaviza el ciclo semanal mientras preserva la deriva lenta. Restarlo (`detrended`) deja el puro ritmo más el ruido, y `groupby(dayofweek).transform("mean")` es el truco ordenado de la estacionalidad — calcula el promedio para cada día de la semana *y lo transmite* de vuelta a cada fila con ese día de la semana, así que `seasonal` tiene la misma longitud que `series`. El residuo es solo lo que sobrevivió a ambas restas, y su desviación estándar es tu primera señal de corrección: debería estar muy por debajo del `std` de la serie cruda.

**🎯 Resultado esperado :** Siete filas (una por día de la semana) de desplazamiento estacional, más un `residual std` alrededor de 4–6 — claramente más pequeño que la dispersión de ~16 de la serie cruda.

**🩹 Si sale mal :** Si `seasonal` tiene filas `NaN` en los bordes, la ventana `center=True` deja los primeros/últimos 7 días indefinidos — esperado, filtra con `.dropna()`. Si el std del residuo es casi cero, el término de ruido nunca llegó al generador. Si los desplazamientos semanales varían mucho entre filas del mismo día de la semana, `transform` se reemplazó por `apply` — `transform` es lo que transmite a cada fila.

### 2.2 Verifica la descomposición

**✅ Lista de verificación**

- ✅ `trend + seasonal + residual` reconstruye la serie original (dentro del error flotante).
- ✅ Cada uno de los siete días de la semana tiene exactamente un valor estacional.
- ✅ La desviación estándar del residuo es más pequeña que el `std()` de la serie.

**🤔 Pregunta(s) socrática(s)**

- Una media móvil es un *filtro de paso bajo* sobre la serie. ¿Qué le sucede a un pico genuino de una sola vez en el `residual` del Paso 4 si la ventana de tendencia es enorme (digamos 90 días) en lugar de 14 — y cuándo sería eso útil o perjudicial?
- El valor estacional es un promedio por día de la semana, así que trata los cinco lunes de un mes como idénticos. ¿Qué cambiaría si la estacionalidad misma se desviara a lo largo del año (invierno vs verano)?

## Paso 3: Pronostica con tendencia más estacionalidad

La descomposición se paga a sí misma aquí: en lugar de ajustar un modelo al ruido crudo, extiendes la tendencia aprendida y le añades de vuelta el ritmo aprendido. Este paso pronostica los próximos siete días a partir de los dos componentes limpios.

### 3.1 Ajusta una línea sobre la tendencia y añade de vuelta la estacionalidad

**👟 Pista inicial :** Ajusta `np.polyfit` de grado 1 sobre los últimos 30 valores reales, extiende esa línea 30→37 días hacia adelante y luego añade el valor de `seasonal` para cada día de la semana futuro.

```python
# series.py (continuación)
def forecast_next(series: pd.Series, seasonal: pd.Series,
                  horizon: int = 7, window: int = 30) -> pd.Series:
    X = np.arange(window)
    y = series.tail(window).values
    slope, intercept = np.polyfit(X, y, 1)

    future = pd.date_range(series.index[-1] + pd.Timedelta(days=1),
                           periods=horizon, freq="D")
    linear = intercept + slope * np.arange(window, window + horizon)
    weekly = seasonal[future.dayofweek].values
    return pd.Series(linear + weekly, index=future, name="forecast")

fc = forecast_next(s, seasonal)
print(fc.round(1).to_string())
```

`np.polyfit(X, y, 1)` encuentra la mejor línea recta a través de los últimos `window` valores reales — obtienes la pendiente, y la intersección la sitúa. Pronosticar es entonces aritmética: extiende esa línea a los índices `window … window+horizon` (posiciones del eje X *después* de la ventana de entrenamiento) y añade `seasonal[future.dayofweek]` para que el ritmo semanal de cada día cabalgue sobre la línea. Hacer la tendencia y el ritmo por separado — en lugar de pronosticar valores ruidosos crudos con un solo modelo — es todo el punto del Paso 2.

**🎯 Resultado esperado :** Siete valores con fecha, aproximadamente 140–160 y *no* una rampa recta — los días de la semana cabalgan visiblemente el seno semanal.

**🩹 Si sale mal :** Si el pronóstico es constante, `np.polyfit` devolvió una pendiente ~cero porque `window` era demasiado corto o `y` no era la cola. Si el pronóstico es ruido dentado, no se ha añadido `weekly` y solo sobrevivió la línea. Si las fechas aterrizan *antes* del final de la serie, falta el desplazamiento `pd.Timedelta(days=1)`.

### 3.2 Verifica el pronóstico

**✅ Lista de verificación**

- ✅ El pronóstico cubre exactamente los 7 días posteriores al último día de la serie.
- ✅ Los valores del pronóstico siguen el ritmo semanal (picos/valles por día de la semana), no una línea recta.
- ✅ Extender el horizonte a 14 sigue aterrizando después de una continuación plausible.

**🤔 Pregunta(s) socrática(s)**

- Ajustar una línea recta asume una tasa constante de crecimiento. ¿Qué forma tomaría el pronóstico si la *verdadera* tendencia se estuviera acelerando, y dónde falla la suposición de la línea recta de forma más visible en los datos reales?
- El pronóstico usa la pendiente de los últimos 30 puntos. ¿Cómo cambiaría el pronóstico de la próxima semana si en su lugar ajustaras la línea sobre el componente de tendencia de todo el *año* — y qué elección se siente más robusta, y por qué?

## Paso 4: Haz backtest del pronóstico y mide el error

Un pronóstico que no puedes puntuar es una conjetura. El backtesting re-ajusta el modelo sobre los datos *anteriores* a una semana retenida y compara sus predicciones con los valores que esa semana realmente tuvo — la forma honesta de saber si tu modelo es bueno antes de confiar en él hacia adelante.

### 4.1 Puntúa el pronóstico contra el holdout

**👟 Pista inicial :** Repite el pronóstico del Paso 3 usando solo `series.iloc[:-horizon]` para el entrenamiento, y luego calcula el error absoluto medio contra la última semana retenida.

```python
# series.py (continuación)
def backtest(series: pd.Series, seasonal: pd.Series,
             horizon: int = 7, window: int = 30) -> float:
    train = series.iloc[:-horizon]
    fc = forecast_next(train, seasonal, horizon=horizon, window=window)
    actual = series.iloc[-horizon:]
    mae = float((fc - actual).abs().mean())
    return mae

print("MAE on held-out week: {:.2f} guests".format(backtest(s, seasonal)))
```

`series.iloc[:-horizon]` corta la última semana — el modelo literalmente no puede ver esos días — y `forecast_next` corre sobre lo que queda, así que la comparación `fc - actual` es una prueba genuina fuera de muestra. Reportar el **error absoluto medio** (`abs().mean()`) mantiene las unidades humanas: "equivocado por ~4 clientes", no un número al cuadrado que nadie siente. El componente estacional se pasa sin cambios; el atajo honesto es que el *ritmo* se aprendió de la serie completa, mientras que la *tendencia* se re-ajustó sobre los datos truncados — un ajuste solucionable documentado como tal.

**🎯 Resultado esperado :** Un MAE de un solo dígito bajo (aproximadamente 3–6 clientes), consistentemente muy por debajo de una conjetura ingenua como predecir el promedio general.

**🩹 Si sale mal :** Si el MAE se infla a 20+, el pronóstico todavía incluye la estacionalidad de la próxima semana construida desde la serie completa pero el ajuste de tendencia se está calculando sobre un marco vacío — comprueba que `train` no esté vacío. Si `fc` y `actual` se desalinean, `forecast_next` produce fechas más allá de `train.index[- horizon]` — confirma el desplazamiento `days=1`. Si el puntaje se desvía entre ejecuciones, `seasonal` vino de una serie sembrada de forma diferente.

### 4.2 Verifica el backtest

**✅ Lista de verificación**

- ✅ `backtest` reporta un solo float en unidades de clientes.
- ✅ El conjunto de entrenamiento termina *antes* de que empiece la semana retenida.
- ✅ Re-ejecutar con `horizon=14` produce un error mayor (o igual) que 7.

**🤔 Pregunta(s) socrática(s)**

- El MAE trata la sobre-predicción y la sub-predicción por igual. ¿Qué enfatizaría en su lugar el **error cuadrático medio raíz (RMSE)**, y por qué una cafetería con picos vacacionales ocasionales y enormes lo preferiría a pesar de ser menos intuitivo?
- La tendencia se re-ajusta en `train` pero la estacionalidad se filtra desde la serie completa. ¿En qué flujo de trabajo real es aceptable esa fuga, y cómo la cerrarías por completo si un cliente pidiera una evaluación estricta?

## Paso 5: Detecta anomalías y grafica el par

Dos movimientos finales convierten el analizador en un artefacto terminado: marca las fechas donde la realidad no encajó en el modelo (residuos grandes) y grafica la serie contra un par correlacionado — guardado como un archivo que puedes compartir.

### 5.1 Marca anomalías y dibuja el gráfico de correlación

**👟 Pista inicial :** Calcula la z-score del residuo para encontrar valores atípicos, luego correlaciona la serie de clientes con una serie de gasto y guarda el superpuesto como un PNG con el backend sin pantalla `Agg`.

```python
# series.py (continuación)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def detect_anomalies(residual: pd.Series, threshold: float = 2.5) -> pd.Series:
    z = (residual - residual.mean()) / residual.std()
    return z[z.abs() > threshold]

anoms = detect_anomalies(residual.dropna())
print(f"anomalies: {len(anoms)} -> {anoms.index[:8].tolist()}")

def make_spend(seed: int = 7) -> pd.Series:
    guests = make_cafe_guests(seed=seed)
    rng = np.random.default_rng(seed)
    return guests * 3.2 + rng.normal(0, 30, len(guests))

spend = make_spend()
print("correlation:", round(s.corr(spend), 2))

fig, ax = plt.subplots(figsize=(11, 4))
ax.plot(s.index, s.values, label="guests")
ax.plot(spend.index, spend.values / 3.2, alpha=0.5, label="spend / 3.2")
ax.legend(); ax.set_title("Café guests vs spend (scaled)")
fig.tight_layout()
fig.savefig("series.png", dpi=100)
```

`(residual - residual.mean()) / residual.std()` convierte cada residuo en una z-score — "¿cuántas desviaciones estándar lejos del patrón está este día?" — y el corte `> 2.5` mantiene los valores atípicos honestos (un día de 3 sigma) sin marcar la mitad del archivo. La correlación es la estadística de resumen: `s.corr(spend)` devuelve un número en [-1, 1], y los valores cerca de 0.9 te dicen que las dos métricas se mueven juntas. En el gráfico, dividir `spend` por su multiplicador aproximado superpone ambas series en la misma escala — una afirmación visual que el número `.corr()` luego confirma.

**🎯 Resultado esperado :** Un conteo de anomalías (un puñado como máximo), una correlación cerca de `0.9` y un archivo `series.png` que muestra las dos series siguiéndose la una a la otra.

**🩹 Si sale mal :** Si `detect_anomalies` marca docenas de días, los datos se descompusieron con un `window` demasiado pequeño para suavizar el ruido — amplíalo. Si la correlación imprime `NaN`, una serie tiene una alineación de índice diferente después de `.dropna()` — alinea con `.align()` o calcula sobre el índice compartido. Si no aparece ningún PNG, `savefig` se ejecuta desde un directorio de trabajo que no puedes ver — imprime `Path("series.png").resolve()` para confirmar dónde aterrizó.

### 5.2 Verifica el analizador terminado

**✅ Lista de verificación**

- ✅ El conteo de anomalías es pequeño (de un solo dígito por año de datos) y las fechas marcadas son sorpresas plausibles.
- ✅ `s.corr(spend)` es un float claramente por encima de 0.5.
- ✅ `series.png` existe en disco mostrando ambas series moviéndose juntas.
- ✅ Todo el pipeline corre de arriba a abajo como un script único con cero ediciones.

**🤔 Pregunta(s) socrática(s)**

- La serie de gasto se *construyó* a partir de los clientes, así que la correlación casi-1.0 está diseñada. ¿Qué implica una correlación real y más baja (digamos 0.4) sobre si una cafetería debería planificar personal a partir de los conteos de clientes — y qué *no* prueba sobre que uno cause al otro?
- Las marcas de anomalía apuntan a fallos del modelo y a eventos reales al mismo tiempo. Si la cafetería cerrara por renovación, ¿aparecería eso como una z-score positiva o negativa, y cómo distinguirías una "anomalía interesante" de un "modelo roto" sin llamar a la cafetería?

## ⚠️ Errores comunes

- **Un `RangeIndex` simple en lugar de `DatetimeIndex`.** Las ventanas móviles aún corren, pero `dayofweek`, el remuestreo y la generación de fechas futuras se rompen. Solución: construye cada serie con `index=idx` del Paso 1 y verifica `type(s.index)` al principio.
- **`NaN` de las ventanas centradas.** `rolling(center=True)` deja bordes indefinidos; pasarlos a `groupby` o al trazado hace que el gráfico y las estadísticas descarten días en silencio. Solución: `.dropna()` sobre trend, seasonal y residual en el límite que necesites.
- **Ajustar la tendencia sobre ruido en lugar de sobre la cola.** `polyfit` sobre un `window` demasiado corto produce una pendiente que es sobre todo ruido. Solución: ajusta sobre al menos un mes de valores reales (30+) y deja que la estacionalidad se añada después, no durante.
- **Estacionalidad que se filtra a un backtest "estricto".** Pasar el `seasonal` de la serie completa a `backtest` hace que el puntaje sea halagador. Solución: recalcula `seasonal` desde `train` dentro del backtest si el número es para un cliente.
- **Correlación con índices desalineados.** Después de `.dropna()` o una rebanada matutina filtrada, dos series pueden discrepar en fechas y `.corr()` devuelve `NaN` o un número engañoso. Solución: `.align()` o rebanar ambos al índice compartido antes de puntuar.

## Lo que acabas de construir

Un analizador de series temporales completo: una serie diaria generada, una descomposición aditiva construida a mano en tendencia/estacionalidad/residuo, un pronóstico de tendencia-más-estación con un MAE con backtest, detección de anomalías sobre el residuo y un gráfico de par correlacionado guardado en disco. La habilidad transferible es *separar la señal del ruido*: divide cualquier secuencia ruidosa en deriva lenta, ritmo repetitivo y residuo sobrante, luego pronostica las partes y marca el resto — la misma receta detrás de la planificación de demanda, el monitoreo y la pregunta de "¿qué cambió realmente?"

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/time-series-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/time-series-analyzer) en el repo del curso es una versión más completa del código anterior, con una descomposición de cuatro componentes y un ajuste de tendencia estilo SARIMA. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Añade el cuarto componente faltante — efectos de día de trading o de día festivo — con una pasada más de `groupby` sobre el residuo.
- Reemplaza el ajuste de línea manual por `numpy.polyfit` de grado 2 y usa la comparación estilo AIC para decidir si la curva mereció su parámetro extra.
- Barre el `threshold` en `detect_anomalies` de 1.5 a 4 e imprime cuántos días marca cada uno, para que el corte deje de ser mágico.
- Escribe el pronóstico más las z-scores en un solo CSV para que el script de shell que envía el email al gerente de la cafetería pueda leer un archivo, no tres.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
