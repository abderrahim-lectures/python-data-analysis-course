---
title: "Monitor de Calidad del Agua"
description: "Registra muestras de agua con marca de tiempo a CSV, valídalas contra especificaciones de rango seguro, calcula tendencias móviles y deriva, emite alertas clasificadas por severidad y grafica los resultados con matplotlib."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["csv", "matplotlib", "automation"]
learningObjectives:
  - Almacenar lecturas de muestra con marca de tiempo en un CSV
  - Validar lecturas contra especificaciones de rango seguro
  - Calcular medias móviles y deriva a partir de una serie de datos
  - Emitir alertas clasificadas por severidad para muestras fuera de rango o a la deriva
  - Graficar tendencias con líneas guía de rango seguro rojas
prerequisites:
  - "Fundamentos de Python (funciones, bucles, diccionarios)"
  - "Matplotlib pyplot básico (subplots, axhline)"
  - "Comodidad escribiendo y leyendo archivos CSV"
---

# 🛠️ 💧 Monitor de Calidad del Agua

El monitoreo de agua dulce es un pipeline de datos en una caja fría: un sensor (tu registro de muestras) produce lecturas con marca de tiempo, una especificación (rangos seguros por parámetro) decide aprobar/fallar, las tendencias deciden "empeorando" y una lista de alertas decide la atención. Este proyecto construye todo el bucle con un CSV simple como sensor: define parámetros y sus rangos seguros, registra lecturas, valida cada muestra, calcula medias móviles y deriva, emite alertas clasificadas por severidad y termina con un gráfico matplotlib cuyas líneas discontinuas rojas son los límites del rango seguro.

Esto asume Python 101 más un toque de matplotlib, no se requiere nada más. Es opcional y no se califica; consulta [Proyectos del Mundo Real](/es/proyectos) para ver la lista completa y en crecimiento.

## 🎯 Lo que harás

1. Definir los cinco parámetros monitoreados y sus rangos seguros.
2. Registrar lecturas con marca de tiempo a un CSV con datos que conservan sus etiquetas.
3. Validar cada lectura contra los rangos e imprimir una tabla aprobar/fallar.
4. Calcular medias móviles y deriva para detectar tendencias lentas de "empeorando".
5. Alertar sobre fallas, valores límite y deriva, clasificados por severidad.
6. Graficar cada parámetro contra sus líneas guía rojas de rango seguro.

## Dónde ejecutar esto

**Localmente con `uv`** es un hogar principal, el CSV vive y crece en tu disco, y el gráfico se guarda como un archivo `.png` real. Todo el proyecto es simple de utf-8, y cada línea corre sin modificación también en los notebooks en la nube, donde la única diferencia es que el gráfico se renderiza *en línea* en lugar de guardarse en un archivo.

**Google Colab, Kaggle Notebooks y Binder** ejecutan los seis pasos de forma idéntica (sin datos externos, el CSV lo siembra tu propio script), con el gráfico en línea al final. La salvedad honesta: los gráficos en línea son geniales para explorar, pero una herramienta de monitoreo quiere el archivo en disco para que un operador pueda mirarlo más tarde. Usa las insignias para explorar; usa la ejecución local para la sensación de "dispositivo real".

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/water-quality/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/water-quality/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwater-quality%2Fnotebook.es.ipynb)

## Configuración

Crea el proyecto. El registro y el análisis usan solo la biblioteca estándar; matplotlib es la única dependencia real.

```bash
uv init water-quality
cd water-quality
```

```bash
uv add matplotlib
```

```bash
uv run python -c "import matplotlib; print('plt', matplotlib.__version__)"
```

`csv` convierte cada muestra en una fila con nombre (`timestamp`, `ph`, ...) para que los datos sigan siendo decodificables años después, y `pathlib` mantiene limpias las rutas de archivo. Diseñarás el *esquema* tú mismo en el Paso 1, ese esquema es lo que hace que cada paso posterior (validación, medias móviles, gráficos) sea una búsqueda por nombre en lugar de una pila de cadenas if-else.

**✅ Lista de verificación**

- ✅ `uv init water-quality` creó un proyecto con un `pyproject.toml`.
- ✅ `uv add matplotlib` tuvo éxito; la comprobación de import imprimió una versión de matplotlib.

## Paso 1: Define parámetros, rangos y el almacén CSV

Cada especificación de monitoreo empieza con la misma pregunta: *¿qué estamos vigilando, y cuál es un valor seguro?* Este paso codifica la respuesta como datos, un diccionario de parámetros, cada uno con un rango bajo/alto y una unidad, y escribe tus primeras lecturas en `readings.csv`.

### 1.1 Escribe `PARAMETERS`, `make_reading` y `write_reading`

**👟 Pista inicial :** Pon la especificación de cada parámetro (`low`, `high`, `unit`) en un dict `PARAMETERS`, luego construye lecturas como dicts simples y añádelas al CSV, `DictWriter` mantiene el orden de columnas por ti.

```python
# monitor.py
import csv
import json
from pathlib import Path

PARAMETERS = {
    "ph":          {"low": 6.5, "high": 8.5,    "unit": "pH"},
    "turbidity":   {"low": 0.0, "high": 5.0,    "unit": "NTU"},
    "tds":         {"low": 0.0, "high": 500.0,  "unit": "ppm"},
    "temperature": {"low": 5.0, "high": 25.0,   "unit": "C"},
    "chlorine":    {"low": 0.2, "high": 2.0,    "unit": "mg/L"},
}

def make_reading(t: str, ph: float, turb: float, tds: float,
                 temp: float, chlorine: float) -> dict:
    return {"timestamp": t, "ph": ph, "turbidity": turb, "tds": tds,
            "temperature": temp, "chlorine": chlorine}

FIELDNAMES = ["timestamp", "ph", "turbidity", "tds", "temperature", "chlorine"]

def write_reading(path: str, reading: dict) -> None:
    is_new = not Path(path).exists()
    with open(path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        if is_new:
            writer.writeheader()
        writer.writerow(reading)
```

Que `PARAMETERS` sea *datos en lugar de literales dispersos* es todo el diseño: "rango seguro" ahora es una búsqueda (`PARAMETERS["ph"]["high"]`), así que la validación (Paso 2), las alertas (Paso 4) y las líneas guía del gráfico (Paso 6) leen todas la misma única fuente de verdad. `make_reading` acepta un valor por campo en una firma fija, así que una lectura no puede ganar en silencio una columna que el esquema CSV no conoce. `DictWriter` con `writeheader()` escribe las etiquetas una vez, que es lo que mantiene legible el CSV más tarde.

### 1.2 Siembra seis lecturas de muestra

**👟 Pista inicial :** Media hora de muestras a intervalos de 15 minutos, con el agua *empeorando* al final, pH subiendo, cloro desplomándose, para que los pasos posteriores tengan algo real que detectar.

```python
# Seed the log (a sensor as data)
samples = [
    make_reading("08:00", 7.0, 1.1, 220,  17.5, 0.9),
    make_reading("08:15", 7.3, 1.4, 235,  18.0, 0.7),
    make_reading("08:30", 7.7, 4.8, 260,  18.2, 0.4),
    make_reading("08:45", 8.1, 2.1, 300,  18.5, 0.2),
    make_reading("09:00", 8.7, 1.8, 340,  18.6, 0.1),
    make_reading("09:15", 9.4, 1.9, 520,  18.7, 0.02),
]
for reading in samples:
    write_reading("readings.csv", reading)

print(Path("readings.csv").read_text())
```

Los datos sembrados están deliberadamente *no* todos limpios: para las 09:00 el pH está cruzando 8.5, el tds supera 500 y el cloro se desliza hacia cero. Eso es lo que hace que los siguientes pasos reporten algo significativo, un monitor que solo dice "todo está bien" no es un monitor en el que confíes.

**🎯 Resultado esperado :** Una fila de encabezado más seis filas en el archivo `/` memoria, terminando con `09:15,9.4,1.9,520,18.7,0.02`.

**🩹 Si sale mal :** Si el encabezado se repite en cada adición, `is_new` calculó `False`, pasar un archivo vacío pero existente hace que `DictWriter` añada encabezados para siempre. Si las columnas están revueltas, las claves del dict `reading` discrepan con `FIELDNAMES`, `DictWriter` escribe por clave, así que una clave mal escrita aterriza como celda vacía. Si falta `newline=""` en `open`, el archivo puede ganar líneas en blanco entre filas en Windows.

### 1.3 Verifica el almacén

**✅ Lista de verificación**

- ✅ `readings.csv` existe con exactamente una fila de encabezado y seis filas de datos.
- ✅ Ejecutar la siembra dos veces añade, no sobrescribe, el registro es solo de añadido.
- ✅ `PARAMETERS` contiene cada parámetro con `low`, `high` y `unit`.

**🤔 Pregunta(s) socrática(s)**

- El CSV almacena solo valores crudos, sin columna "alert!". Si *añadieras* una columna de estado al escribir, ¿qué podría volverse obsoleto sobre ella más tarde, y qué implica eso sobre almacenar *datos* versus almacenar *decisiones derivadas de los datos*?
- Los registros de sensores crecen para siempre. ¿Cuándo está bien este esquema CSV, y a qué volumen necesitarías una base de datos real, y qué decisiones (esquema, indexación, retención) está tomando un CSV *por ti* sin que lo notes?

## Paso 2: Valida lecturas contra los rangos seguros

Ahora la especificación hace trabajo. La validación es una función sobre `PARAMETERS`: por cada parámetro, ¿está el valor de la muestra entre bajo y alto? Este paso imprime una tabla legible aprobar/fallar por muestra.

### 2.1 Escribe `validate` y `print_validation`

**👟 Pista inicial :** Recorre los nombres de los parámetros, toma `value = reading[name]` y la especificación, y registra `ok`, un indicador, por parámetro; el impresor formatea la tabla.

```python
# monitor.py (continuación)
def validate(reading: dict) -> dict:
    results = {}
    for name, spec in PARAMETERS.items():
        value = reading[name]
        results[name] = {
            "value": value,
            "ok": spec["low"] <= value <= spec["high"],
            "spec": spec,
        }
    return results

def print_validation(reading: dict) -> None:
    print(f"--- {reading['timestamp']} ---")
    for name, result in validate(reading).items():
        status = "PASS" if result["ok"] else "FAIL"
        width = result["spec"]["high"] - result["spec"]["low"]
        position = (result["value"] - result["spec"]["low"]) / width
        bar = "#" * max(1, int(position * 10)) + "." * max(0, 10 - int(position * 10))
        print(f"{name:>12}: {result['value']:6.2f} {result['spec']['unit']:>4}"
              f"  [{bar}]  {status}")

print_validation(samples[-1])
```

El indicador `ok` dentro de cada resultado está deliberadamente *compuesto*: `low <= value <= high` en una expresión a la vez se lee como la especificación y no puede voltearse cuando alguien amplía un rango y olvida un segundo sitio. El mini gráfico de barras (`#`/`.`) es un visual barato de *dónde* dentro del rango se sienta la muestra, un "PASS" en el mismísimo borde del rango vale la pena mirarlo incluso antes de la lógica de límite del Paso 4.

**🎯 Resultado esperado :** `--- 09:15 ---` luego una tabla: `ph` FAIL (9.40 en el borde lejano de su barra), `turbidity` PASS en borde alto, `tds` FAIL más allá de 500, `temperature` PASS en rango medio, `chlorine` FAIL por debajo de 0.2.

**🩹 Si sale mal :** Si cada fila lee `PASS` para siempre, `validate` compara contra los propios valores de la muestra (un error de `spec` como `reading[name] <= reading[name]`). Si todas muestran `FAIL`, `value` es una cadena del CSV (se necesita `float("9.4")`), ejecutar `validate` en filas cargadas, no en dicts literales, suele tropezarse con esto. Si la barra muestra flancos negativos, un valor está por encima de `high`: `position > 1` porque la matemática del rango asumió el valor dentro de él.

### 2.2 Verifica la validación

**✅ Lista de verificación**

- ✅ La muestra de las 08:00 pasa los cinco parámetros.
- ✅ La muestra de las 09:15 falla `ph`, `tds` y `chlorine`.
- ✅ Un valor *exactamente igual* al borde de un rango (p. ej. `ph = 8.5`) cuenta como `PASS`, los límites son inclusivos.

**🤔 Pregunta(s) socrática(s)**

- Los límites inclusivos significan que `8.5` pasa pero `8.51` falla, una línea "segura" de un centímetro de ancho. ¿Dónde harían los errores de lectura (un sensor ruidoso) peligrosos los límites inclusivos estrictos, y qué añadirías?
- ¿Qué es más honesto en un registro de monitoreo: `ok` como booleano, o también registrar *cuánto fuera* del rango cayó el valor? ¿Dónde empieza esa distancia a tomar decisiones de severidad (Paso 4) por ti?

## Paso 3: Medias móviles y deriva

Una sola muestra puede ser ruido; una *tendencia* es una historia. Este paso calcula medias móviles (el promedio de las últimas pocas muestras) y un puntaje de deriva (media reciente menos una línea base temprana) para cada parámetro, detectando cambios lentos que una comprobación puntual se perdería.

### 3.1 Escribe `load_readings`, `rolling_mean` y `drift`

**👟 Pista inicial :** `csv.DictReader` devuelve filas cuyos valores son *cadenas*, convierte a float una vez. Luego la media móvil es `sum/length` con ventana, y la deriva es `recent_mean - baseline_mean`.

```python
# monitor.py (continuación)
def load_readings(path: str = "readings.csv") -> list[dict]:
    with open(path) as f:
        return list(csv.DictReader(f))

def values(readings: list[dict], name: str) -> list[float]:
    return [float(r[name]) for r in readings]

def rolling_mean(readings: list[dict], name: str, window: int = 3) -> list[float]:
    vals = values(readings, name)
    means = []
    for i in range(len(vals)):
        chunk = vals[max(0, i - window + 1) : i + 1]
        means.append(sum(chunk) / len(chunk))
    return means

def drift(readings: list[dict], name: str,
          baseline_window: int = 3, recent_window: int = 3) -> float:
    vals = values(readings, name)
    baseline = sum(vals[:baseline_window]) / baseline_window
    recent = sum(vals[-recent_window:]) / recent_window
    return recent - baseline

for name in PARAMETERS:
    print(f"{name:>12}: drift {drift(samples, name):+6.2f} "
          f"| rolling {rolling_mean(samples, name)[-1]:6.2f}")
```

Convertir cadenas a flotantes una vez, en `values()`, es la corrección de la trampa clásica del CSV: cada función posterior opera sobre números sin esparcir `float(...)` por todos lados. `rolling_mean` crece `window` solo cuando existen menos muestras (`max(0, i - window + 1)`), así que el primer punto tiene una ventana de 1 en lugar de bloquearse. `drift` es la comparación temprana-vs-reciente, con signo para que la *dirección* importe: `+` significa subiendo, `-` cayendo.

**🎯 Resultado esperado :** `ph: +1.40`, `tds: +148.3`, `chlorine: -0.56`, los tres parámetros que alertarán más tarde, con `turbidity: -0.50` y `temperature: +0.70` rezagados en magnitud.

**🩹 Si sale mal :** Si `drift` es `0.0` para todo, `values()` obtuvo cadenas y las comparaciones `float(r[name])` corrieron en ordenamiento de texto (`'220' > '500'` es vacuo). Si el primer valor de media móvil imprime como la media de toda la muestra, falta el truco de rebanada `max(0, ...)`. Si ocurre `KeyError: 'turbidity'`, la columna real del CSV difiere de `FIELDNAMES` (un error ortográfico de encabezado), inspecciona `DictReader.fieldnames`.

### 3.2 Verifica la detección de deriva

**✅ Lista de verificación**

- ✅ `rolling_mean(samples, "ph")[-1]` está alrededor de 8.7, jalado hacia arriba por las muestras altas tardías.
- ✅ `drift(samples, "chlorine")` es claramente negativa, señalando pérdida de cloro.
- ✅ Reemplazar la última lectura con una copia de `samples[0]` baja la deriva de `ph` de `+1.40` a cerca de `+0.60`, el cálculo reacciona realmente a los datos.

**🤔 Pregunta(s) socrática(s)**

- `drift` aquí compara *medias*, así que un gran pico único la infla. ¿Qué única estadística aislaría la deriva de un valor atípico mientras aún detecta una tendencia real, y a qué costo en sensibilidad?
- Una ventana de 3 muestras en un registro de 6 casi no tiene historia. Si en cambio compararas la media de *hoy* con la media de *toda la semana*, ¿qué nuevo modo de fallo aparece? (Piensa en lo que significa "línea base" cuando el agua ya está mala.)

## Paso 4: Alerta sobre fallas, valores límite y deriva

El monitoreo se gana el pan diciéndote *a qué mirar*. Este paso convierte la validación + deriva en alertas clasificadas: fallas duras primero (fuera de rango), luego valores límite que rozan una frontera, luego advertencias de deriva lenta, y un resumen final de "esto necesita un humano".

### 4.1 Escribe `issue_alerts`

**👟 Pista inicial :** Pasa la lectura *más reciente* más los resultados de deriva por parámetro; para cada uno, elige la alerta de severidad más alta que aplique (FAIL supera a BORDERLINE supera a DRIFT supera a OK).

```python
# monitor.py (continuación)
BORDERLINE_FRACTION = 0.05

def issue_alerts(readings: list[dict]) -> list[dict]:
    latest = readings[-1]
    drift_by_name = {name: drift(readings, name) for name in PARAMETERS}
    alerts = []
    for name, result in validate(latest).items():
        spec = result["spec"]
        value = result["value"]
        if not result["ok"]:
            alerts.append({"severity": "ALERT", "name": name,
                           "message": f"{value:.2f} {spec['unit']} outside "
                                      f"{spec['low']}-{spec['high']}"})
            continue
        low_gap = (value - spec["low"]) / (spec["high"] - spec["low"])
        if low_gap < BORDERLINE_FRACTION or low_gap > 1 - BORDERLINE_FRACTION:
            alerts.append({"severity": "BORDERLINE", "name": name,
                           "message": f"{value:.2f} {spec['unit']} hugging a boundary"})
            continue
        d = drift_by_name[name]
        if abs(d) > 1.0:
            alerts.append({"severity": "DRIFT", "name": name,
                           "message": f"drift {d:+.2f} {spec['unit']} over last samples"})
    return alerts

for alert in issue_alerts(samples):
    print(f"[{alert['severity']:9}] {alert['name']:>12}: {alert['message']}")
```

La escalera `continue` es un codificador de prioridad: cada parámetro dispara su alerta *peor* y pasa, porque apilar "DRIFT" sobre un pH que ya está en ALERT solo entierra el titular. `low_gap` normaliza la posición dentro del rango a `0..1`, así que "dentro del 5% de una frontera" es una comprobación que funciona para cualquier parámetro sin importar sus unidades. Los umbrales de `drift` aplican a cada parámetro, lo cual es tosco, la pregunta socrática después de la tabla pregunta dónde merece eso refinarse.

**🎯 Resultado esperado :** `[ALERT] ph: 9.40 pH outside 6.5-8.5`, `[ALERT] tds: 520.00 ppm outside 0.0-500.0`, `[ALERT] chlorine: 0.02 mg/L outside 0.2-2.0`, tres fallas duras, sin finalistas en las mismas muestras.

**🩹 Si sale mal :** Si nada dispara `ALERT` en `ph`, `validate` usó la *primera* muestra en lugar de `readings[-1]`. Si `BORDERLINE` nunca aparece, el `continue` antes de él se comió cada fila dentro de rango, comprueba el ordenamiento de la escalera de alertas. Si los mensajes de `drift` citan la unidad equivocada, `drift_by_name` se claueló por nombre pero leyó de un dict diferente.

### 4.2 Verifica las alertas

**✅ Lista de verificación**

- ✅ La muestra de las 09:15 produce tres `ALERT`s, `ph`, `tds` y `chlorine`.
- ✅ `temperature` no produce ninguna alerta, está en rango medio y es estable.
- ✅ Una muestra *exactamente en* `ph = 8.5` dispara `BORDERLINE` (pasa la comprobación de rango pero se sienta dentro del 5% de la frontera alta).
- ✅ La muestra de las 08:00 sola (re-siembra) produce cero alertas.

**🤔 Pregunta(s) socrática(s)**

- `BORDERLINE` usa un 5% plano del *ancho del rango*, para pH eso es 0.1 pH, para tds son 25 ppm. ¿Dónde agrupa el proporcional-al-rango realidades físicas muy diferentes, y qué umbral relativo a la unidad sería más justo?
- La escalera de alertas descarta `DRIFT` cuando ya se disparó `ALERT`. ¿Cuándo es una advertencia de deriva *más* accionable que la falla actual, y qué emitiría tu motor para decir "fallarás dentro de la hora"?

## Paso 5: Grafica las tendencias con líneas guía de rango seguro

Los gráficos convierten cinco tablas de parámetros en una sola mirada. Este paso grafica cada parámetro como su propio subplot con puntos marcadores, `axhline`s discontinuas rojas en los límites del rango seguro y un PNG guardado, la vista de la mañana del operador.

### 5.1 Escribe `plot_readings`

**👟 Pista inicial :** Un subplot por parámetro, `plot(timestamps, values, marker="o")`, luego un `axhline` por frontera; `tight_layout()` antes de guardar.

```python
# monitor.py (continuación)
import matplotlib.pyplot as plt

def plot_readings(readings: list[dict], path: str = "water_quality.png") -> None:
    timestamps = [r["timestamp"] for r in readings]
    names = list(PARAMETERS)
    fig, axes = plt.subplots(len(names), 1, figsize=(8, 2.0 * len(names)), sharex=True)
    for ax, name in zip(axes, names):
        series = [float(r[name]) for r in readings]
        ax.plot(timestamps, series, marker="o", label=name)
        ax.axhline(PARAMETERS[name]["high"], color="red", ls="--", lw=1)
        ax.axhline(PARAMETERS[name]["low"], color="red", ls="--", lw=1)
        ax.set_ylabel(f"{name} ({PARAMETERS[name]['unit']})")
        ax.legend(loc="best", fontsize=8)
    fig.suptitle("Water quality over the morning")
    fig.tight_layout()
    fig.savefig(path)
    print(f"saved {path}")

plot_readings(samples)
```

Las líneas guía de límite provienen del *mismo* dict `PARAMETERS` que usa el validador, así que un cambio de especificación redibuja el gráfico correctamente con cero mantenimiento, el pago del diseño de "única fuente de verdad" del Paso 1. `sharex=True` fuerza cada parámetro al mismo eje de tiempo, así que el ojo compara *cuándo* se apilan las fallas. `marker="o"` marca las muestras discretas, y guardar a PNG es lo que hace del gráfico un artefacto duradero en lugar de una ventana transitoria.

**🎯 Resultado esperado :** `saved water_quality.png`, una figura con cinco subplots apilados compartiendo el eje `08:00`..`09:15`, límites discontinuos rojos visibles en cada plot, y pH/tds/chlorine cruzando sus líneas rojas para el final de la mañana.

**🩹 Si sale mal :** Si la imagen está en blanco, `savefig` corrió sin una llamada `plot` previa o los ejes fueron sobrescritos por un segundo `subplots`. Si los subplots no comparten el eje, se eliminó `sharex=True`. Si la numeración se intercala raro (pasos verticales `01`), falta `tight_layout()` y las etiquetas chocan, llámalo antes de guardar.

### 5.2 Verifica el gráfico

**✅ Lista de verificación**

- ✅ Un subplot por parámetro, marcas de tiempo en el eje x compartido.
- ✅ `axhline`s discontinuas rojas muestran ambas fronteras en *cada* subplot.
- ✅ El archivo de imagen existe en disco y el pH cruza visiblemente su línea superior para las 09:15.

**🤔 Pregunta(s) socrática(s)**

- El gráfico reproduce la historia. Si una herramienta de monitoreo solo puede *almacenar* lecturas crudas y *recalcular* todo al renderizar, ¿qué significa eso para dónde viven la validación, la deriva y las alertas, en la ruta de escritura o la de lectura?
- Cinco subplots diminutos hacen obvios los valores atípicos pero difíciles de comparar las magnitudes. Si la turbidez (0-5 NTU) y el tds (0-500 ppm) compartieran un eje, ¿qué concluiría *erróneamente* el ojo, y eso argumenta a favor o en contra del escalado por parámetro?

## ⚠️ Errores comunes

- **Inflación de cadenas desde CSV.** `DictReader` devuelve cada celda como texto, así que `float(r["ph"]) > 9.0` ordena en silencio *cadenas* ("9.40" > "9.4"? poco confiable). Solución: convierte a float una vez al cargar, idealmente en `values()`.
- **Límites que excluyen en silencio.** `low < value < high` (estricto) se lee como la especificación pero rechaza una muestra *exactamente* en el borde. Solución: usa `<=`/`>=`, luego decide explícitamente si el borde es seguro.
- **Un "sensor" que falsifica la historia.** Sembrar el CSV a mano en modo Share sobrescribe los datos de la sesión de adición, el archivo se queda pero la secuencia miente. Solución: un `write_reading` solo de añadido y una separación entre "siembra" y "en vivo".
- **Ventanas móviles que miran hacia atrás a la nada.** `vals[i-window:i]` en el índice 0 produce una rebanada vacía → `sum/0`. Solución: sujeta la ventana con `max(0, i - window + 1)`.
- **Gráficos cuyas líneas rojas se desvían de la especificación.** Copiar y pegar números de límite en `axhline` significa que un cambio de especificación desdibuja en silencio el gráfico. Solución: siempre lee los límites de `PARAMETERS`.

## Lo que acabas de construir

Un pipeline de monitoreo en un archivo: un registro CSV duradero, validación impulsada por especificación, medias móviles y deriva, un motor de alertas clasificado por severidad y un gráfico con líneas guía derivadas de la especificación. La idea transferible es que *"vigilar esta cosa" es una forma de datos*: una fuente (muestras), un modelo (dict de especificación), señales derivadas (validación, deriva) y un lector (alertas, gráfico). Esa misma forma impulsa los paneles, los sistemas de anomalías y todo panel de estado de CI que hayas visto, ahora has construido uno de extremo a extremo.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/water-quality/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/water-quality) en el repo del curso es una versión más completa del código anterior, con un bucle de muestra en vivo y helpers de exportación. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Añade un campo *fuente* a cada lectura (grifo, pozo, río) y construye un filtro por fuente para que las alertas digan *cuál* fuente está fallando.
- Convierte el motor de alertas en una tabla de reglas, luego en un bucle `live()` que sondee un CSV cada N segundos y re-renderice el gráfico, un monitor de streaming real.
- Exporta las alertas a un segundo CSV (`alerts.csv`) y calcula su propia tasa móvil, la fatiga de alertas es en sí misma una métrica que vale la pena vigilar.
- Calcula un "puntaje de riesgo" agregado por fuente sumando pesos de severidad sobre todos los parámetros, y grafica *eso* como la línea principal.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
