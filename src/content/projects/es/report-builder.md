---
title: "Constructor de Informes"
description: "Genera informes empresariales a partir de datos con gráficos, tablas y programación automatizada."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["data-visualization", "matplotlib", "pandas", "reporting"]
learningObjectives:
  - "Carga y prepara datos con pandas para la generación de informes"
  - "Construye cuatro tipos de gráfico: de barras, de líneas, circular y de dispersión"
  - "Formatea datos en tablas de texto listas para publicación"
  - "Ensambla gráficos más resúmenes en un solo informe"
prerequisites:
  - "Conceptos básicos de Python (funciones, bucles, diccionarios)"
  - "Comprensión de listas y aritmética básica"
  - "Instalación de paquetes con uv"
---

# 🛠️ 📊 Construye un Constructor de Informes

El reporting empresarial es un bucle que nunca cambia de forma: toma datos crudos, resúmelos, muéstralos y compártelos. Este proyecto construye ese bucle con pandas y matplotlib — carga un CSV de ventas, calcula los totales que un gerente pide de verdad, dibuja un gráfico de barras, de líneas, circular y de dispersión, formatea todo en una tabla limpia y lo ensambla todo en un solo archivo de informe.

Esto asume Python 101 y comodidad con funciones básicas y listas — nada más allá de eso se requiere. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Generar un CSV de ventas realista y cargarlo en un DataFrame de pandas.
2. Agregar los ingresos por categoría con `groupby` para los totales principales.
3. Dibujar cuatro tipos de gráfico y guardar cada uno como un PNG de alta resolución.
4. Formatear una tabla resumen que se alinee en cualquier terminal.
5. Ensamblar gráficos + resumen + metadatos en una carpeta de informe.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal. `pandas` y `matplotlib` se instalan limpiamente, el backend `Agg` no interactivo de matplotlib (usado en el Paso 2) significa que los gráficos se renderizan incluso en una máquina sin pantalla, y los archivos de informe aterrizan genuinamente en tu carpeta de proyecto.

**Google Colab y ejecuciones de notebook Binder** funcionan igual — instala la pareja con una línea `!pip install pandas matplotlib`, y el notebook refleja cada paso con gráficos guardados en el entorno del notebook. **JupyterLite** puede ejecutar las porciones de pandas en el navegador, pero es el más débil de los tres para este proyecto: matplotlib corre ahí, pero guardar archivos PNG de gráficos en un disco real es incómodo, así que trátalo como una ruta de prueba y usa las insignias de notebook o `uv` local cuando quieras que los artefactos del informe persistan.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/report-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/report-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Freport-builder%2Fnotebook.ipynb)

## Configuración

Crea el proyecto e instala las dos librerías sobre las que se construye todo el proyecto.

```bash
uv init report-builder
cd report-builder
uv add pandas matplotlib
```

```bash
uv run python -c "import pandas, matplotlib; print('ok')"
```

`pandas` es la capa de datos — cargar, agregar, filtrar — y `matplotlib` es la capa de dibujo que convierte los agregados en gráficos. Empezar con ambos instalados significa que cada paso de abajo trata sobre las ideas *del reporting* en lugar de lidiar con dependencias.

**✅ Lista de verificación**

- ✅ `uv add pandas matplotlib` terminó y `uv run python -c "import pandas, matplotlib"` imprime `ok`.
- ✅ Existe un proyecto fresco `report-builder/` con un `pyproject.toml`.

## Paso 1: Carga y prepara los datos

Todo informe empieza con datos que pueden o no existir todavía. Este paso construye un cargador que genera un CSV de ventas realista cuando no hay ninguno presente — para que el proyecto funcione de fábrica — y analiza las fechas para que el reporting basado en tiempo funcione más tarde.

### 1.1 Escribe el generador y el cargador de datos

**👟 Pista inicial:** Crea un conjunto de datos de muestra determinista (aleatoriedad con semilla), guárdalo como CSV y luego cárgalo de vuelta con `parse_dates=["date"]` para que la columna de fecha sea un datetime real.

```python
# report.py
import os
import random
import pandas as pd

def create_sample_data(filepath: str = "sales_data.csv"):
    """Generate sample sales data for the report."""
    data = {
        "date": pd.date_range("2024-01-01", periods=100, freq="D"),
        "category": ["Electronics", "Clothing", "Food", "Books"] * 25,
        "revenue": [120.50, 89.99, 45.00, 23.50] * 25,
        "units_sold": [3, 5, 12, 8] * 25,
    }
    random.seed(42)
    data["revenue"] = [r * random.uniform(0.7, 1.3) for r in data["revenue"]]
    data["units_sold"] = [max(1, int(u * random.uniform(0.5, 1.5))) for u in data["units_sold"]]

    df = pd.DataFrame(data)
    df.to_csv(filepath, index=False)
    print(f"Sample data saved to {filepath} ({len(df)} rows)")
    return df

def load_data(filepath: str = "sales_data.csv") -> pd.DataFrame:
    """Load sales data from CSV, creating sample data if the file is missing."""
    if not os.path.exists(filepath):
        print("No data file found. Generating sample data...")
        return create_sample_data(filepath)

    df = pd.read_csv(filepath, parse_dates=["date"])
    print(f"Loaded {len(df)} rows from {filepath}")
    return df

df = load_data()
print(df.head(10).to_string(index=False))
```

`random.seed(42)` es lo que hace que los datos de muestra sean *reproducibles*: la misma semilla produce la misma variación "aleatoria" en cada ejecución, así que los gráficos y totales que produces son los gráficos y totales de los resultados esperados, no un informe diferente cada vez. `parse_dates=["date"]` le dice a pandas que decodifique la columna de fecha en objetos `datetime` reales al cargar — eso es lo que hace que "ingreso diario promedio" y el rango de fechas del informe del Paso 5 sean computables en lugar de un ordenamiento de strings. `index=False` en `to_csv` mantiene una columna de índice extraviada fuera del archivo, así que recargar produce un DataFrame limpio otra vez.

**🎯 Resultado esperado:** `Sample data saved to sales_data.csv (100 rows)` — o, en una segunda ejecución con el archivo presente, `Loaded 100 rows from sales_data.csv`. Luego una vista previa de 10 filas con las columnas `date`, `category`, `revenue`, `units_sold`.

**🩹 Si sale mal:** Si el archivo se regenera cada ejecución, `os.path.exists` está comprobando una ruta diferente de la que usa el generador — pasa el mismo valor por defecto de `filepath` a ambos. Si `df["date"]` imprime strings como `2024-01-01` sin una `T`, no está realmente analizado — confírmalo con `df.dtypes` (`date` debería ser `datetime64[ns]`). Si cada valor de ingresos es idéntico, la multiplicación de `random.seed(42)` no se aplicó a la lista.

### 1.2 Comprueba con qué estás trabajando

**👟 Pista inicial:** Pídele a pandas la forma y los conteos de filas por categoría, para que sepas la escala y el balance del conjunto de datos antes de dibujar nada.

```python
# report.py (continued)
print(f"Rows: {len(df)}, Columns: {list(df.columns)}")
print(df.groupby("category")["revenue"].count())
```

`df.groupby("category")["revenue"].count()` es tu primer agregado real: `groupby("category")` divide el marco en un grupo por categoría, el `["revenue"]` elige una columna para medir, y `.count()` cuenta las entradas no nulas por grupo. Es la misma forma de expresión que usarás en el Paso 2 para *sumar* ingresos por categoría — la única diferencia es el método final.

**🎯 Resultado esperado:** `Rows: 100, Columns: ['date', 'category', 'revenue', 'units_sold']`, luego un conteo por categoría de `25` para cada una de las cuatro categorías.

**🩹 Si sale mal:** Si un conteo no es 25, el patrón de mosaico `* 25` del generador no produjo un conjunto de datos equilibrado — comprueba la longitud de la lista original. Si `groupby` da error, el nombre de la columna `category` está mal escrito o falta en el CSV.

### 1.3 Verifica la capa de datos

**✅ Lista de verificación**

- ✅ Ejecutar una vez crea `sales_data.csv`; ejecutar otra vez lo carga en lugar de regenerarlo.
- ✅ `df.dtypes` muestra `date` como un tipo datetime.
- ✅ `groupby("category")["revenue"].count()` devuelve 25 por categoría.

**🤔 Pregunta(s) socrática(s)**

- Los datos de muestra usan un `random.seed(42)` fijo. ¿Qué *intercambiarías* si eliminaras la semilla — y en qué flujo de trabajo real (una demo, un registro de auditoría, un dashboard en vivo) querrías de hecho variación no sembrada?
- Las fechas se analizan con `parse_dates=["date"]`. ¿Qué tipo de bug golpearía un informe si la columna de fecha se quedara como strings — elige una operación concreta (ordenar, encontrar la fecha mínima, trazar una serie temporal) y di cómo se rompe?

## Paso 2: Dibuja tu primer gráfico

Un gráfico es un resumen que puedes ver. Este paso dibuja la primera de cuatro figuras — un gráfico de barras horizontal de ingresos por categoría — y establece el patrón que sigue cada gráfico posterior: construir una `figure` y `axes`, trazar, etiquetar, guardar, cerrar.

### 2.1 Guarda un gráfico de barras de ingresos por categoría

**👟 Pista inicial:** Cambia matplotlib al backend `Agg` (seguro sin pantalla), agrupa y suma los ingresos por categoría, y traza con un par de figura + eje para que controles el tamaño.

```python
# report.py (continued)
import matplotlib
matplotlib.use("Agg")  # non-interactive backend: render to files, not windows
import matplotlib.pyplot as plt

def chart_revenue_by_category(df: pd.DataFrame, output: str = "chart_bar.png"):
    """Bar chart of total revenue by category."""
    summary = df.groupby("category")["revenue"].sum().sort_values(ascending=True)

    fig, ax = plt.subplots(figsize=(8, 4))
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    summary.plot(kind="barh", ax=ax, color=colors[:len(summary)])
    ax.set_title("Revenue by Category", fontsize=14, fontweight="bold")
    ax.set_xlabel("Total Revenue ($)")
    ax.set_ylabel("")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Bar chart saved to {output}")

chart_revenue_by_category(df)
```

La llamada `matplotlib.use("Agg")`, colocada **antes** de importar `pyplot`, es lo que hace que este proyecto funcione en un servidor o en CI sin pantalla: `Agg` es el backend de ráster puro que renderiza directamente a archivos. `groupby("category")["revenue"].sum().sort_values()` combina la agregación con el orden, así que el gráfico de barras se renderiza *ordenado* — el más pequeño abajo con `barh`, que se lee de manera natural. `plt.savefig(output, dpi=150)` escribe un archivo en lugar de abrir una ventana, y el disciplinado `plt.close()` libera la memoria de la figura para que un bucle largo de gráficos no se filtre.

**🎯 Resultado esperado:** Un archivo `chart_bar.png`, más la impresión `Bar chart saved to chart_bar.png`. Abre la imagen: cuatro barras horizontales, una por categoría, ordenadas ascendente.

**🩹 Si sale mal:** Si obtienes `UserWarning: Starting a Matplotlib GUI outside of the main thread` o un `TclError` sobre no-display, `matplotlib.use("Agg")` se ejecuta *después* de que `pyplot` ya está importado — el `use` debe preceder a cada import de pyplot. Si el archivo está en blanco, `savefig` se llamó antes de que ocurriera cualquier trazado. Si los colores no se alinean con las categorías, el corte `colors[:len(summary)]` y la serie ordenada deben tener la misma longitud y orden.

### 2.2 Verifica el patrón de gráfico repetible

**👟 Pista inicial:** Vuelve a ejecutar la función y confirma que el archivo se reconstruye idénticamente — la salida idempotente (misma entrada → mismo PNG) es lo que hace confiable el reporting por lotes.

**🎯 Resultado esperado:** Volver a ejecutar el bloque sobrescribe `chart_bar.png` con el mismo gráfico e imprime `Bar chart saved to chart_bar.png` otra vez — sin error, sin ventana que aparezca.

**🩹 Si sale mal:** Si la segunda ejecución abre una ventana o da error sobre una pantalla, la línea del backend `Agg` se deslizó por debajo del import de pyplot en un re-pegado. Si aparece `FileNotFoundError` al guardar, el directorio de salida no existe — `savefig` no crea carpetas, así que debe hacerlo `os.makedirs` (o el paso del informe).

**✅ Lista de verificación**

- ✅ `chart_bar.png` existe y se abre como un gráfico de barras horizontal de cuatro barras ordenado ascendente.
- ✅ El backend `Agg` está activo antes de importar `pyplot`.
- ✅ Ejecutar la función dos veces reconstruye el mismo archivo sin errores.

**🤔 Pregunta(s) socrática(s)**

- El gráfico ordena ascendente y usa `barh`. ¿Qué cambia en la lectura del mismo dato por parte de un espectador si trazaras la serie *sin ordenar* como barras verticales — hay algún caso donde el orden "incorrecto" sea el honesto?
- `plt.close()` termina esta función, pero las iniciales `fig, ax = plt.subplots(...)` enlazan un par de objetos. ¿Qué pasaría si olvidaras el close en un bucle que construye 200 gráficos — y por qué ese fallo suele aparecer tarde, no inmediatamente?

## Paso 3: Añade los otros tres tipos de gráfico

Un gráfico muestra un ranking; un informe normalmente también necesita la tendencia, la participación y la relación. Este paso añade los gráficos de líneas (ingresos en el tiempo), circular (participación por categoría) y de dispersión (ingresos vs. unidades), cada uno siguiendo el patrón figura/trazar/guardar/cerrar del Paso 2.

### 3.1 Dibuja la tendencia de ingresos como gráfico de líneas

**👟 Pista inicial:** Remuestrea los ingresos diarios sumando por fecha, luego traza con un relleno debajo de la curva.

```python
# report.py (continued)
def chart_revenue_trend(df: pd.DataFrame, output: str = "chart_line.png"):
    """Line chart of daily revenue trend."""
    daily = df.groupby("date")["revenue"].sum()

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(daily.index, daily.values, color="#3b82f6", linewidth=1.5)
    ax.fill_between(daily.index, daily.values, alpha=0.1, color="#3b82f6")
    ax.set_title("Daily Revenue Trend", fontsize=14, fontweight="bold")
    ax.set_xlabel("Date")
    ax.set_ylabel("Revenue ($)")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Line chart saved to {output}")

chart_revenue_trend(df)
```

`daily = df.groupby("date")["revenue"].sum()` colapsa el marco en un punto por fecha — porque `groupby` agrupa *valores de fecha únicos*, y cada fecha aparece exactamente una vez en los datos, esto es efectivamente una serie temporal de resolución completa. `ax.plot(daily.index, daily.values, ...)` es la forma no-nativa-de-pandas de trazar (sacamos el resumen del DataFrame), lo que te permite pasar el índice de fechas directamente a matplotlib. `fill_between` con un `alpha=0.1` bajo tiñe el área debajo de la línea — una ganancia de legibilidad barata que convierte una línea en una forma.

**🎯 Resultado esperado:** Un `chart_line.png` que muestra una línea de ingresos diarios a lo largo del rango de 100 días, con un relleno azul claro debajo y etiquetas de fecha rotadas a lo largo del eje x.

**🩹 Si sale mal:** Si las etiquetas del eje x se superponen en una mancha, falta `rotation=45, ha="right"`. Si matplotlib traza un índice de enteros crudos en lugar de fechas, el `parse_dates` del Paso 1 no se aplicó. Si la línea está completamente plana, `groupby("date")` puede no estar sumando — comprueba `daily.describe()` para ver la varianza.

### 3.2 Añade el circular y el de dispersión

**👟 Pista inicial:** Para el circular, suma las unidades por categoría y deja que matplotlib renderice porcentajes; para el de dispersión, dibuja una serie coloreada por categoría y confía en el archivo guardado de la figura para su inspección.

```python
# report.py (continued)
def chart_category_distribution(df: pd.DataFrame, output: str = "chart_pie.png"):
    """Pie chart of units sold by category."""
    units = df.groupby("category")["units_sold"].sum()

    fig, ax = plt.subplots(figsize=(6, 6))
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    ax.pie(units, labels=units.index, autopct="%1.1f%%", colors=colors, startangle=90)
    ax.set_title("Units Sold by Category", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Pie chart saved to {output}")

def chart_price_vs_units(df: pd.DataFrame, output: str = "chart_scatter.png"):
    """Scatter chart of price vs units sold."""
    fig, ax = plt.subplots(figsize=(8, 5))
    categories = df["category"].unique()
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]

    for cat, color in zip(categories, colors):
        subset = df[df["category"] == cat]
        ax.scatter(subset["revenue"], subset["units_sold"], label=cat, alpha=0.6, color=color, s=50)

    ax.set_title("Revenue vs Units Sold", fontsize=14, fontweight="bold")
    ax.set_xlabel("Revenue ($)")
    ax.set_ylabel("Units Sold")
    ax.legend()
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Scatter chart saved to {output}")

chart_category_distribution(df)
chart_price_vs_units(df)
```

El `autopct="%1.1f%%"` del circular es un mini especificador de formato — matplotlib llama a ese string con el porcentaje de cada rebanada y renderiza un decimal más un `%` literal, así que una rebanada de `0.27` se convierte en `27.0%` (el `%%` duplicado escapa al `%` único). El bucle `for cat, color in zip(...)` del de dispersión divide el marco por categoría y dibuja cada una como su propia serie coloreada, así que una leyenda puede distinguir cuatro grupos — y `alpha=0.6` hace visibles los puntos superpuestos en lugar de manchas sólidas. Ambas funciones mantienen la disciplina del Paso 2: entrada idempotente, un PNG de salida.

**🎯 Resultado esperado:** `chart_pie.png` que muestra las participaciones de unidades de las cuatro categorías con etiquetas de porcentaje, y `chart_scatter.png` con cuatro series coloreadas, etiquetas de eje y una leyenda.

**🩹 Si sale mal:** Si las etiquetas del circular se superponen o desaparecen, hay demasiadas rebanadas o demasiado similares para una etiqueta limpia — `autopct` no elimina rebanadas pequeñas, solo las etiqueta. Si el de dispersión muestra un solo color o una leyenda vacía, el emparejamiento `zip(categories, colors)` no coincidió — ambas secuencias deben tener el mismo orden. Si `%1.1f%%` imprime un `1.1f` literal, al string de formato le falta el escape del operador `%`.

### 3.3 Verifica los cuatro gráficos

**✅ Lista de verificación**

- ✅ Existen cuatro PNG: `chart_bar.png`, `chart_line.png`, `chart_pie.png`, `chart_scatter.png`.
- ✅ Cada uno se abre para revelar el tipo de gráfico que promete su nombre.
- ✅ La disciplina del backend `Agg` y de `plt.close()` se mantuvo en las cuatro funciones.

**🤔 Pregunta(s) socrática(s)**

- El circular y el de barras muestran ambos resúmenes por categoría, desde los mismos datos. ¿Cuándo es un gráfico circular genuinamente la elección incorrecta para una comparación de categorías, aunque se muestre bien — y qué pierde un *lector* que un de barras transmite?
- Cada función de gráfico codifica su propio título. Si un informe necesitara que cada gráfico fuera temático (misma fuente, mismo formato de encabezado), ¿qué cambiaría estructuralmente — y por qué el patrón `fig, ax = plt.subplots(...)` lo hace más fácil que trazar en una figura global implícita?

## Paso 4: Formatea una tabla resumen

Los gráficos responden "¿qué dicen los números de un vistazo?"; una tabla responde "¿qué son exactamente?". Este paso construye una tabla de texto con columnas alineadas, totales y formato de dólares — salida lista para soltar en un informe, un email o una terminal.

### 4.1 Agrega y alinea la tabla

**👟 Pista inicial:** Usa un solo `groupby().agg()` para calcular las cuatro columnas de resumen a la vez, luego preséntalas con anchos de campo de f-strings para que las columnas se alineen al carácter.

```python
# report.py (continued)
def format_summary_table(df: pd.DataFrame) -> str:
    """Create a formatted summary table of sales by category."""
    summary = df.groupby("category").agg(
        total_revenue=("revenue", "sum"),
        avg_revenue=("revenue", "mean"),
        total_units=("units_sold", "sum"),
        num_transactions=("revenue", "count"),
    ).round(2)

    lines = []
    header = f"{'Category':<15} {'Revenue':>12} {'Avg Sale':>10} {'Units':>8} {'Sales':>8}"
    lines.append(header)
    lines.append("-" * len(header))

    for cat, row in summary.iterrows():
        line = f"{cat:<15} ${row['total_revenue']:>10,.2f} ${row['avg_revenue']:>8,.2f} {int(row['total_units']):>8} {int(row['num_transactions']):>8}"
        lines.append(line)

    lines.append("-" * len(header))
    total_rev = summary["total_revenue"].sum()
    total_units = int(summary["total_units"].sum())
    total_sales = int(summary["num_transactions"].sum())
    lines.append(f"{'TOTAL':<15} ${total_rev:>10,.2f} {'':>10} {total_units:>8} {total_sales:>8}")

    return "\n".join(lines)

table = format_summary_table(df)
print(table)
```

`df.groupby("category").agg(...)` ejecuta *cuatro* agregaciones en una pasada — cada entrada nombra una columna de salida y el par `(columna-origen, operación)` que la produce, lo que está mucho más listo que cuatro llamadas `groupby` separadas. Los anchos de f-string están haciendo trabajo de diseño real: `:>12` alinea a la derecha el ingreso en 12 caracteres y `,` en `:>10,.2f` añade separadores de miles, así que `2984.5` se convierte en `  $2,984.50` y cada fila se alinea en la misma columna. La fila final `TOTAL` reutiliza los mismos especificadores de ancho con un string de relleno vacío para que el pie se alinee con las filas de datos de arriba.

**🎯 Resultado esperado:** Un encabezado de cinco líneas, luego cuatro filas de datos (una por categoría) que terminan en una fila `TOTAL` — cada columna alineada verticalmente y los valores en dólares con comas.

**🩹 Si sale mal:** Si las columnas se desalinean visiblemente, los números de ancho del encabezado y de las filas del cuerpo no coinciden — ambos deben usar los mismos especificadores. Si `TOTAL` se desvía a la derecha, su campo de relleno vacío tiene un ancho diferente al de la columna `Avg Sale`. Si los valores aparecen como `2984.5` sin comas, falta la bandera `,` en el formato `.2f`.

### 4.2 Verifica la tabla

**✅ Lista de verificación**

- ✅ La tabla tiene una fila por categoría más una fila `TOTAL` destacada.
- ✅ Las columnas de ingresos están alineadas a la derecha, agrupadas con comas y con dos decimales.
- ✅ Volver a ejecutar la función produce un string idéntico para los mismos datos.

**🤔 Pregunta(s) socrática(s)**

- La tabla se construye con f-strings de ancho fijo, lo que funciona porque los *nombres* de columna caben en esos anchos. ¿Qué rompe la alineación si un nombre de categoría tiene 30 caracteres — y cuáles son las dos o tres opciones (truncar, ancho dinámico, una librería) cuando los datos reales superan tus columnas?
- `int(row['total_units'])` redondea hacia abajo deliberadamente los conteos fraccionarios de unidades. El `.round(2)` de arriba redondea los promedios primero. ¿Por qué es normalmente la elección de reporting más segura redondear de manera independiente los valores de *visualización*, en lugar del agregado subyacente?

## Paso 5: Ensambla el informe

El paso final es la recompensa: ejecuta los cuatro gráficos y la tabla en un solo archivo de informe — completo con una marca de tiempo generada y el rango de fechas cubierto — para que un gerente pueda abrir una carpeta y ver toda la historia.

### 5.1 Genera la carpeta del informe

**👟 Pista inicial:** Haz que el ensamblador cree su propio directorio de salida, regenere cada artefacto dentro de él y escriba un informe de texto que referencie cada gráfico por nombre.

```python
# report.py (continued)
from datetime import datetime

def generate_report(df: pd.DataFrame, output_dir: str = "report"):
    """Generate a complete report with charts and tables."""
    os.makedirs(output_dir, exist_ok=True)

    chart_revenue_by_category(df, f"{output_dir}/chart_bar.png")
    chart_revenue_trend(df, f"{output_dir}/chart_line.png")
    chart_category_distribution(df, f"{output_dir}/chart_pie.png")
    chart_price_vs_units(df, f"{output_dir}/chart_scatter.png")

    table = format_summary_table(df)

    report_lines = [
        "=" * 65,
        "  SALES REPORT",
        f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"  Period: {df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}",
        "=" * 65,
        "",
        "  SUMMARY",
        "  " + "-" * 40,
        f"  Total Revenue:     ${df['revenue'].sum():>12,.2f}",
        f"  Average Sale:      ${df['revenue'].mean():>12,.2f}",
        f"  Total Units Sold:  {df['units_sold'].sum():>12,}",
        f"  Transactions:      {len(df):>12,}",
        "",
        "  REVENUE BY CATEGORY",
        "  " + "-" * 40,
        table,
        "",
        "  CHARTS",
        "  " + "-" * 40,
        "  chart_bar.png     - Revenue by category (bar chart)",
        "  chart_line.png    - Daily revenue trend (line chart)",
        "  chart_pie.png     - Units distribution (pie chart)",
        "  chart_scatter.png - Revenue vs units (scatter chart)",
        "",
        "=" * 65,
    ]

    report_text = "\n".join(report_lines)
    report_path = f"{output_dir}/report.txt"
    with open(report_path, "w") as f:
        f.write(report_text)

    print(f"\nReport generated in {output_dir}/")
    print(report_text)

generate_report(df)
```

Dos elecciones de diseño hacen de esto una herramienta de informe genuina en lugar de una demo. Es *regenerable*: el ensamblador recrea cada artefacto en su propio directorio, así que el mismo comando sobre datos actualizados produce un informe actualizado, y el directorio siempre contiene exactamente el conjunto actual. Lleva *metadatos*: `datetime.now()` marca cuándo se ejecutó y `df['date'].min() ... max()` registra el período cubierto, así que un lector (o un destinatario de email) puede distinguir si el informe es actual o obsoleto de un vistazo. Cada función que este proyecto construyó ahora está ensamblada en un solo lugar — todo el pipeline del Paso 1→4, invocado por una sola llamada.

**🎯 Resultado esperado:** Una carpeta `report/` que contiene `report.txt` y los cuatro PNG de gráficos. El informe de texto se abre con el encabezado con marca de tiempo, las estadísticas de resumen, la tabla de categorías alineada y un manifiesto de gráficos.

**🩹 Si sale mal:** Si el encabezado imprime `Period: NaT to NaT`, las fechas no se analizaron al cargar (falta el `parse_dates` del Paso 1). Si faltan gráficos en la carpeta, una de las cuatro funciones de gráfico falló antes de guardar — ejecuta el "si sale mal" de cada función de manera independiente. Si un sistema de email rechaza `report.txt` por caracteres extraños, comprueba si los f-strings insertaron un campo extraviado; volver a ejecutar debería ser atómico.

### 5.2 Verifica el informe ensamblado

**✅ Lista de verificación**

- ✅ `report/` contiene `report.txt` y los cuatro PNG de gráficos.
- ✅ La línea `Period:` del informe coincide con el rango de fechas real en `df`.
- ✅ Volver a ejecutar `generate_report(df)` sobrescribe la carpeta limpiamente con los artefactos actuales.

**🤔 Pregunta(s) socrática(s)**

- El informe escribe gráficos y texto *juntos* en cada ejecución. ¿Qué deja en disco una ejecución rota — digamos, una excepción a mitad de la sección de gráficos — y qué dos cambios pequeños (directorio temporal + renombrado, o try/finally) harían atómica la regeneración?
- La marca de tiempo es la señal de frescura del informe. Si el informe se ejecutara en un cronograma cada lunes, ¿te diría `Generated:` solo a ti, lector, si los *datos* eran actuales? ¿Qué segundo campo añadirías para separar "cuándo se hizo el informe" de "qué tan antiguos son los datos"?

## ⚠️ Errores comunes

- **Orden de importación de `Agg`.** `matplotlib.use("Agg")` debe ejecutarse *antes* de `import matplotlib.pyplot as plt`, o gana el backend de GUI y las ejecuciones sin pantalla se bloquean con un error de "no display". Arreglo: mantén la línea `use` físicamente encima del import de pyplot — el bloque de imports del archivo lo hace deliberadamente.
- **Fechas sin analizar.** Sin `parse_dates=["date"]`, la columna de fecha se queda como strings, así que `df['date'].min()` ordena textualmente y los gráficos de líneas ponen ticks extraños en el eje. Arreglo: analiza al cargar (Paso 1) y confírmalo con `df.dtypes`.
- **Ejecutar gráficos sin pantalla.** El backend `Agg` renderiza a archivos — es toda la razón por la que se activa aquí. Arreglo: nunca elimines la línea `use` para este proyecto; los gráficos se guardan, no se muestran.
- **Tablas desalineadas.** Mezclar anchos de encabezado y anchos de cuerpo rompe silenciosamente la alineación de columnas. Arreglo: mantén idénticos los strings de formato del encabezado y de las filas de datos, y deja que la fila `TOTAL` los reutilice.
- **Columnas extra de un índice.** `df.to_csv(...)` sin `index=False` escribe una columna de índice sin nombre que se carga de vuelta como ruido. Arreglo: pasa siempre `index=False`, como hace el generador.

## Lo que acabas de construir

Un generador de informes que toma un CSV de ventas crudo y produce un paquete completo: un DataFrame limpio, cuatro tipos de gráfico intencionales, una tabla resumen lista para publicación y un archivo de informe con marca de tiempo que nombra cada artefacto. La habilidad transferible es el *bucle de datos-a-entrega* — cargar, agregar, visualizar, ensamblar — que es el esqueleto idéntico detrás de dashboards, resúmenes ejecutivos y cualquier automatización de "mándame los números de esta semana por email" que encontrarás en un trabajo.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/report-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/report-builder) en el repositorio del curso incluye el ensamblador completo más una exportación PDF basada en `reportlab` y filtrado por rango de fechas. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Añade una **exportación PDF** con `reportlab` — el resumen en la página uno y un gráfico por página. El pequeño aviso: `uv add reportlab` y `from reportlab.platypus import SimpleDocTemplate, Paragraph, Image` cubre ~90% de lo que necesitas.
- Dale a `generate_report` **filtrado por fechas** — acepta `start_date`/`end_date` y rebanar `df` antes de graficar, así que una función produce informes semanales, mensuales o trimestrales desde la misma fuente.
- Añade una sección **trimestre-sobre-trimestre**: agrega los ingresos en dos trimestres e imprime el porcentaje de crecimiento más una flecha arriba/abajo — una adición de seis líneas al hermano de `format_summary_table`'s.
- Prográmalo con el paquete `schedule` para que el `generate_report(df)` del lunes se ejecute solo — luego mueve la ruta del informe de texto a un email vía `smtplib` y has construido el pipeline clásico de "auto-reporting a stakeholders".

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo, amigable para principiantes, para agregar el tuyo vía un **pull request**, incluso si nunca usaste git antes: hacer fork del repo, crear una rama, commitear tus archivos y abrir el PR, paso a paso. No se asume experiencia previa con git.

Bienvenido a convertir hojas de cálculo en historias. 🎓
