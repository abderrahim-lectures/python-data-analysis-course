---
title: "Explorador de Visualización de Datos"
description: "Crea gráficos interactivos y paneles con matplotlib, seaborn y plotly."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["matplotlib", "seaborn", "plotly", "data-visualization", "pandas"]
prerequisites:
  - "Conceptos básicos de Python (variables, bucles, funciones)"
  - "pandas básico (DataFrames, groupby)"
  - "matplotlib básico"
learningObjectives:
  - "Crear gráficos de barras, líneas y dispersión con matplotlib"
  - "Construir visualizaciones estadísticas con seaborn"
  - "Crear gráficos interactivos con plotly"
  - "Personalizar estilos de gráficos y temas de color"
  - "Combinar varios gráficos en paneles"
---

# 📊 Explorador de Visualización de Datos

Los números enterrados en tablas son difíciles de interpretar. Los gráficos hacen que los patrones, los valores atípicos y las tendencias salten a la vista de inmediato. Este proyecto te lleva desde los gráficos básicos con matplotlib, pasando por las visualizaciones estadísticas de seaborn, hasta los paneles interactivos de plotly — construyendo un conjunto de herramientas que puedes reutilizar con cualquier conjunto de datos que encuentres.

Esto es opcional y no se califica. Consulta [Proyectos del Mundo Real](/es/proyectos) para ver la lista completa.

## Qué harás

1. Crear gráficos de barras, líneas y dispersión con matplotlib
2. Construir visualizaciones estadísticas con seaborn (diagramas de caja, mapas de calor, gráficos de pares)
3. Crear gráficos HTML interactivos con plotly
4. Personalizar estilos de gráficos, temas de color y tipografía
5. Combinar varios gráficos en paneles de múltiples secciones
6. Exportar gráficos como archivos PNG y HTML interactivos

## Dónde ejecutarlo

- **Localmente con `uv` (recomendado).** Este proyecto utiliza `matplotlib`, `seaborn` y `plotly`, así que una instalación local es el camino más sencillo. La sección de configuración más abajo te lo explica paso a paso.
- **Playground de JupyterLite.** Pega las celdas de código directamente en un cuaderno — funciona bien para explorar los pasos de análisis (1–5), aunque el diseño del panel (Paso 5) se beneficia de una terminal real para guardar archivos.
- **Google Colab.** Abre un cuaderno nuevo y pega las celdas. Misma advertencia que con JupyterLite: guardar archivos funciona mejor en una terminal real.

## Configuración

`uv` es una sola herramienta que reemplaza la cadena habitual de "instalar Python, luego pip, luego un entorno virtual" — puede instalar y gestionar versiones de Python junto con las dependencias de tu proyecto.

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
uv init data-viz
cd data-viz
uv add matplotlib seaborn plotly pandas
```

`pandas` carga y transforma tus datos. `matplotlib` es la base sobre la que construyen seaborn y otros. `seaborn` añade gráficos estadísticos sobre matplotlib. `plotly` crea gráficos HTML interactivos que puedes abrir en un navegador.

## Paso 1: Crear datos de muestra y cargarlos

Construye un CSV con datos de ventas multicategoría y cárgalo en un DataFrame. Cada paso posterior utiliza este mismo conjunto de datos — lo bastante variado para mostrar distintos tipos de gráficos, y lo bastante pequeño para leerlo a mano.

### 1.1 Escribir el CSV y cargarlo

**👟 Pista inicial:** Define una cadena multilínea con columnas `month`, `category`, `region`, `units`, `revenue` y `cost`. Escríbela en disco y luego léela con `pd.read_csv`. Imprime la forma y las primeras filas para confirmar que se cargó.

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px

csv_data = """month,category,region,units,revenue,cost
2026-01,Electronics,North,120,54000,32000
2026-01,Clothing,South,95,14250,8500
2026-01,Electronics,South,80,36000,21000
2026-02,Electronics,North,135,60750,36000
2026-02,Clothing,North,110,16500,9900
2026-02,Home,South,70,21000,13000
2026-03,Electronics,North,150,67500,40000
2026-03,Clothing,South,125,18750,11250
2026-03,Home,North,95,28500,17000
2026-04,Electronics,South,140,63000,37000
2026-04,Clothing,North,160,24000,14400
2026-04,Home,South,100,30000,18000
2026-05,Electronics,North,170,76500,45000
2026-05,Clothing,South,130,19500,11700
2026-05,Home,North,115,34500,20000
2026-06,Electronics,South,155,69750,41000
2026-06,Clothing,North,145,21750,13050
2026-06,Home,South,120,36000,21600"""

with open("sales.csv", "w") as f:
    f.write(csv_data.strip())

df = pd.read_csv("sales.csv")
print(f"Shape: {df.shape}")
print(f"\nColumn types:\n{df.dtypes}")
print(f"\nFirst 5 rows:\n{df.head()}")
print(f"\nBasic stats:\n{df.describe()}")
```

**🎯 Salida esperada:**

```
Shape: (18, 6)

Column types:
month      object
category   object
region     object
units       int64
revenue     int64
cost        int64

First 5 rows:
    month     category region  units  revenue   cost
0  2026-01  Electronics  North    120    54000  32000
1  2026-01    Clothing   South     95    14250   8500
2  2026-01  Electronics  South     80    36000  21000
3  2026-02  Electronics  North    135    60750  36000
4  2026-02    Clothing   North    110    16500   9900

Basic stats:
            units        revenue          cost
count   18.000000      18.000000     18.000000
mean   123.888889   41083.333333  24227.777778
...
```

**🩹 Si algo falla:** Si obtienes `FileNotFoundError`, tu directorio de trabajo es incorrecto — ejecuta `pwd` para comprobarlo. Si la forma muestra `(0, 6)`, la cadena CSV tiene un problema de comillas — asegúrate de que no haya comillas sueltas dentro de las filas de datos. Si `units` muestra `float64` en lugar de `int64`, uno de tus valores podría tener un punto decimal.

### 1.2 Verificar que los datos cargaron correctamente

**✅ Lista de verificación**

- ✅ `df.shape` es `(18, 6)` — 18 filas, 6 columnas.
- ✅ Aparecen los seis nombres de columna: `month`, `category`, `region`, `units`, `revenue`, `cost`.
- ✅ `df.dtypes` muestra tres columnas object (texto) y tres columnas int64 (números).
- ✅ `df.describe()` produce estadísticas para las columnas numéricas sin errores.

**🤔 Preguntas socráticas**

¿Por qué almacenar `month` como cadena (`"2026-01"`) en lugar de un objeto datetime? ¿Qué ventaja tiene la forma de cadena para las operaciones groupby, y qué desventaja para el trazado de series temporales?

---

## Paso 2: Gráficos básicos con matplotlib

Matplotlib es la base — toda otra biblioteca de visualización de Python la envuelve o imita su API. Domina aquí los cuatro tipos de gráfico esenciales: barras, líneas, dispersión y pastel.

### 2.1 Gráfico de barras: ingresos por categoría

**👟 Pista inicial:** Agrupa por `category` y suma `revenue`, y traza con `ax.bar()`. Añade etiquetas de valor sobre cada barra con `ax.text()`. Elimina los bordes superior y derecho para un aspecto más limpio.

```python
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = ["#2196F3", "#FF9800", "#4CAF50"]
bars = ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")

for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2.0, height, f"${height:,.0f}",
            ha="center", va="bottom", fontweight="bold")

ax.set_title("Total Revenue by Category", fontsize=14, fontweight="bold")
ax.set_ylabel("Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("revenue_by_category.png", dpi=150)
plt.show()
print("Saved: revenue_by_category.png")
```

**🎯 Salida esperada:** Un gráfico de barras con tres barras (Clothing, Electronics, Home). Electronics es la más alta con aproximadamente 367.500$. Los importes en dólares se sitúan sobre cada barra. Se guarda en disco el archivo `revenue_by_category.png`.

**🩹 Si algo falla:** Si las barras se ven aplastadas, aumenta `figsize` a `(10, 6)`. Si las etiquetas de dólares se superponen a las barras, comprueba que esté `va="bottom"` — esto empuja el texto por encima de la parte superior de la barra. Si `tight_layout()` lanza una advertencia, significa que tus subgráficos tienen tamaños fijos que no pueden ajustarse — es normal, la advertencia es segura de ignorar.

### 2.2 Gráfico de líneas: tendencia de ingresos mensuales

**👟 Pista inicial:** Agrupa por `month` y suma `revenue`. Usa `ax.plot()` con `marker="o"` para mostrar los puntos de datos. Añade una región sombreada con `ax.fill_between()` para resaltar la brecha entre ingresos y costos.

```python
monthly = df.groupby("month")[["revenue", "cost"]].sum().sort_index()

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(monthly.index, monthly["revenue"], marker="o", linewidth=2, label="Revenue", color="#4CAF50")
ax.plot(monthly.index, monthly["cost"], marker="s", linewidth=2, label="Cost", color="#F44336")
ax.fill_between(monthly.index, monthly["revenue"], monthly["cost"], alpha=0.1, color="#4CAF50")

ax.set_title("Monthly Revenue vs. Cost", fontsize=14, fontweight="bold")
ax.set_ylabel("Amount ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
ax.legend()
ax.grid(axis="y", alpha=0.3)
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("monthly_trend.png", dpi=150)
plt.show()
print("Saved: monthly_trend.png")
```

**🎯 Salida esperada:** Dos líneas — verde para ingresos y roja para costos — con la brecha sombreada entre ellas representando la ganancia. Los ingresos están por encima de los costos todos los meses. Se guarda el archivo `monthly_trend.png`.

**🩹 Si algo falla:** Si las líneas se ven dentadas o desordenadas, tu columna `month` no está ordenada — añade `.sort_index()` después del groupby. Si el área sombreada rellena la región equivocada, comprueba que `fill_between` use `monthly["revenue"]` primero y `monthly["cost"]` segundo — el orden determina qué línea es el límite superior.

### 2.3 Gráfico de dispersión: ingresos vs. costos

**👟 Pista inicial:** Traza cada categoría como una serie separada con `ax.scatter()`, usando colores distintos. Añade una línea diagonal de equilibrio con `ax.plot()` donde los ingresos igualan los costos.

```python
cat_colors = {"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"}

fig, ax = plt.subplots(figsize=(8, 6))
for category in df["category"].unique():
    subset = df[df["category"] == category]
    ax.scatter(subset["cost"], subset["revenue"], s=100, alpha=0.8,
               label=category, color=cat_colors[category], edgecolors="white")

max_val = max(df["revenue"].max(), df["cost"].max())
ax.plot([0, max_val], [0, max_val], linestyle="--", color="gray", alpha=0.5, label="Break-even")

ax.set_title("Revenue vs. Cost by Category", fontsize=14, fontweight="bold")
ax.set_xlabel("Cost ($)")
ax.set_ylabel("Revenue ($)")
ax.legend()
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("revenue_vs_cost.png", dpi=150)
plt.show()
```

**🎯 Salida esperada:** Puntos de colores agrupados por encima de la línea de equilibrio discontinua — significando que cada registro es rentable. Los puntos de Electronics están más lejos de la línea (mayores márgenes). Se guarda el archivo `revenue_vs_cost.png`.

**🩹 Si algo falla:** Si los puntos se superponen mucho, aumenta `alpha` a `0.6` para más transparencia o aumenta `s` a `150` para puntos más grandes. Si la línea de equilibrio no aparece diagonal, tus ejes x e y tienen escalas distintas — llama a `ax.set_aspect("equal")` para corregirlo, aunque puede comprimir uno de los ejes.

### 2.4 Gráfico de pastel: participación por categoría

**👟 Pista inicial:** Agrupa por `category`, suma `revenue` y usa `ax.pie()` con `autopct` para etiquetas de porcentaje y `startangle` para una rotación limpia.

```python
cat_share = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(7, 7))
wedges, texts, autotexts = ax.pie(
    cat_share, labels=cat_share.index, autopct="%1.1f%%",
    startangle=90, colors=["#2196F3", "#FF9800", "#4CAF50"],
    textprops={"fontsize": 12}
)
for autotext in autotexts:
    autotext.set_fontweight("bold")

ax.set_title("Revenue Share by Category", fontsize=14, fontweight="bold")
plt.tight_layout()
plt.savefig("category_share.png", dpi=150)
plt.show()
```

**🎯 Salida esperada:** Un gráfico de pastel dividido en tres porciones con etiquetas de porcentaje. Electronics domina con aproximadamente 56%, Clothing alrededor del 19% y Home alrededor del 25%.

**🩹 Si algo falla:** Si las etiquetas del pastel se superponen, aumenta `figsize` a `(9, 9)`. Si los porcentajes suman más del 100%, tu groupby no se guardó correctamente — comprueba que llamaste `.sum()` y no `.count()`.

**✅ Lista de verificación**

- ✅ Se generan cuatro tipos de gráfico: barras, líneas, dispersión y pastel.
- ✅ Cada gráfico tiene un título claro, etiquetas de ejes (donde aplique) y una leyenda (donde aplique).
- ✅ Los cuatro archivos PNG están guardados en disco y no están vacíos.
- ✅ Sin texto superpuesto, etiquetas recortadas ni puntos de datos faltantes.

**🤔 Preguntas socráticas**

¿Cuándo sería un gráfico de barras más informativo que un gráfico de pastel para los mismos datos? ¿Qué le ocurre al gráfico de pastel si tienes diez categorías en lugar de tres — todavía puedes leer las porciones más pequeñas?

---

## Paso 3: Gráficos estadísticos con seaborn

Seaborn se construye sobre matplotlib para darte visualizaciones estadísticas con llamadas de una sola línea. Los diagramas de caja muestran las distribuciones. Los mapas de calor revelan correlaciones. Los gráficos de pares exponen relaciones entre todas las variables a la vez.

### 3.1 Diagrama de caja: distribución de ingresos por categoría

**👟 Pista inicial:** Usa `sns.boxplot()` con `x="category"` y `y="revenue"`. Configura primero un tema de seaborn con `sns.set_theme()` para un estilo consistente.

```python
sns.set_theme(style="whitegrid")

fig, ax = plt.subplots(figsize=(8, 5))
sns.boxplot(data=df, x="category", y="revenue", palette="Set2", ax=ax)
ax.set_title("Revenue Distribution by Category", fontsize=14, fontweight="bold")
ax.set_xlabel("Category")
ax.set_ylabel("Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig("revenue_boxplot.png", dpi=150)
plt.show()
print("Saved: revenue_boxplot.png")
```

**🎯 Salida esperada:** Tres diagramas de caja y bigotes lado a lado. Electronics tiene el rango más amplio (mayor variabilidad). La línea mediana dentro de cada caja muestra los ingresos típicos por registro. Se guarda el archivo `revenue_boxplot.png`.

**🩹 Si algo falla:** Si las tres cajas se ven idénticas, tus datos podrían tener filas duplicadas — vuelve al Paso 1 y compruébalo. Si las cajas están descentradas, puede que `sns.set_theme(style="whitegrid")` no se haya ejecutado antes del trazado — llámalo de nuevo justo antes de la figura.

### 3.2 Mapa de calor: matriz de correlación

**👟 Pista inicial:** Selecciona solo columnas numéricas, calcula `.corr()` y pasa el resultado a `sns.heatmap()`. Usa `annot=True` para mostrar los valores de correlación dentro de cada celda y `cmap="RdYlGn"` para una escala rojo-amarillo-verde.

```python
numeric_cols = df[["units", "revenue", "cost"]]
corr = numeric_cols.corr()

fig, ax = plt.subplots(figsize=(6, 5))
sns.heatmap(corr, annot=True, cmap="RdYlGn", vmin=-1, vmax=1,
            center=0, fmt=".2f", linewidths=0.5, ax=ax)
ax.set_title("Correlation Matrix", fontsize=14, fontweight="bold")
plt.tight_layout()
plt.savefig("correlation_heatmap.png", dpi=150)
plt.show()
print("Saved: correlation_heatmap.png")
```

**🎯 Salida esperada:** Una cuadrícula de colores donde `revenue` y `cost` muestran una fuerte correlación positiva (cerca de 1.0 — mayor costo significa mayor ingreso). `units` se correlaciona con ambos pero con menos fuerza. Se guarda el archivo `correlation_heatmap.png`.

**🩹 Si algo falla:** Si el mapa de calor es de un solo color, tu rango `vmin`/`vmax` es demasiado amplio para los valores de correlación reales — prueba `vmin=corr.values.min() - 0.1` y `vmax=corr.values.max() + 0.1`. Si obtienes `ValueError: correlation matrix is not symmetric`, pasaste el DataFrame crudo en lugar del resultado de `.corr()`.

### 3.3 Gráfico de pares: todas las relaciones numéricas

**👟 Pista inicial:** Usa `sns.pairplot()` con `hue="category"` para colorear los puntos por categoría. Esto crea una matriz de gráficos de dispersión para cada par de columnas numéricas, con histogramas en la diagonal.

```python
pair = sns.pairplot(df, hue="category", palette="Set2", diag_kind="kde",
                    plot_kws={"alpha": 0.7, "s": 80})
pair.figure.suptitle("Pair Plot — All Numeric Relationships", y=1.02, fontsize=14, fontweight="bold")
pair.savefig("pair_plot.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: pair_plot.png")
```

**🎯 Salida esperada:** Una cuadrícula 3x3 de gráficos. Las celdas fuera de la diagonal son gráficos de dispersión que muestran cómo se relacionan `units`, `revenue` y `cost` entre sí. Las celdas diagonales son curvas de densidad (KDE) que muestran la distribución de cada variable, coloreadas por categoría. Se guarda el archivo `pair_plot.png`.

**🩹 Si algo falla:** Si el gráfico de pares es enorme y difícil de leer, tu conjunto de datos tiene demasiadas columnas numéricas — limítalo a 3–4 con `df[["units", "revenue", "cost"]]` antes de pasarlo a `pairplot`. Si los colores no coinciden entre subgráficos, asegúrate de que esté `hue="category"` — sin él, todos los puntos son del mismo color.

**✅ Lista de verificación**

- ✅ El diagrama de caja muestra tres distribuciones distintas con diferentes medianas y rangos.
- ✅ El mapa de calor tiene celdas anotadas con valores de correlación entre -1 y 1.
- ✅ El gráfico de pares muestra dispersiones fuera de la diagonal y curvas de densidad en la diagonal.
- ✅ Los tres archivos PNG de seaborn están guardados en disco.

**🤔 Preguntas socráticas**

La matriz de correlación muestra que `revenue` y `cost` están fuertemente correlacionados. ¿Implica correlación causación aquí — gastar más *causa* mayores ingresos, o hay una explicación más simple?

---

## Paso 4: Gráficos interactivos con plotly

Los PNG estáticos son excelentes para informes, pero plotly genera gráficos HTML interactivos que puedes ampliar, sobre los que puedes pasar el cursor y hacer paneo dentro de un navegador. Aquí es donde tus visualizaciones empiezan a sentirse como paneles reales.

### 4.1 Gráfico de barras interactivo

**👟 Pista inicial:** Usa `px.bar()` con los parámetros `x`, `y` y `color`. Configura `barmode="group"` para colocar las barras lado a lado en lugar de apilarlas. Exporta a HTML con `fig.write_html()`.

```python
monthly_cat = df.groupby(["month", "category"])["revenue"].sum().reset_index()

fig = px.bar(monthly_cat, x="month", y="revenue", color="category",
             barmode="group", title="Monthly Revenue by Category",
             labels={"revenue": "Revenue ($)", "month": "Month"},
             color_discrete_map={"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"})
fig.update_layout(yaxis_tickformat="$,.0f", xaxis_title="Month", yaxis_title="Revenue ($)")
fig.show()
fig.write_html("interactive_bar.html")
print("Saved: interactive_bar.html")
```

**🎯 Salida esperada:** Se abre una ventana del navegador (o una celda de cuaderno) con un gráfico de barras agrupadas. Pasa el cursor sobre cualquier barra para ver el mes, la categoría y el importe de ingresos exactos. Amplía haciendo clic y arrastrando. Se guarda el archivo `interactive_bar.html` — ábrelo en cualquier navegador.

**🩹 Si algo falla:** Si las barras se apilan en lugar de agruparse, olvidaste `barmode="group"` — el valor predeterminado es `"relative"`, que apila. Si el archivo HTML se abre pero no muestra nada, tu navegador podría estar bloqueando JavaScript de archivos locales — prueba abrirlo desde un servidor local o usa `fig.show()` en un cuaderno.

### 4.2 Gráfico de dispersión interactivo

**👟 Pista inicial:** Usa `px.scatter()` con `x`, `y`, `color` y `size` para codificar cuatro dimensiones a la vez — costo en x, ingresos en y, categoría como color y `units` como tamaño del punto.

```python
fig = px.scatter(df, x="cost", y="revenue", color="category", size="units",
                 hover_data=["month", "region"],
                 title="Revenue vs. Cost (dot size = units sold)",
                 labels={"cost": "Cost ($)", "revenue": "Revenue ($)", "units": "Units Sold"},
                 color_discrete_map={"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"})
fig.update_layout(xaxis_tickformat="$,.0f", yaxis_tickformat="$,.0f")
fig.show()
fig.write_html("interactive_scatter.html")
print("Saved: interactive_scatter.html")
```

**🎯 Salida esperada:** Puntos de colores de tamaños variados. Los puntos más grandes significan más unidades vendidas. Pasa el cursor sobre cualquier punto para ver mes, región, costo, ingresos y unidades. Se guarda el archivo `interactive_scatter.html`.

**🩹 Si algo falla:** Si todos los puntos son del mismo tamaño, `size="units"` no se está aplicando — comprueba que `units` es numérico, no una cadena. Si los datos del cursor muestran `NaN`, el nombre de la columna tiene un error de tipeo o la columna no existe.

### 4.3 Gráfico de líneas interactivo con control deslizante de rango

**👟 Pista inicial:** Usa `px.line()` para el gráfico base, y luego añade `fig.update_xaxes(rangeslider_visible=True)` para un selector de rango temporal arrastrable en la parte inferior.

```python
monthly_total = df.groupby("month")[["revenue", "cost"]].sum().reset_index()

fig = px.line(monthly_total, x="month", y=["revenue", "cost"],
              title="Revenue vs. Cost Over Time (drag to zoom)",
              labels={"value": "Amount ($)", "month": "Month", "variable": "Metric"})
fig.update_layout(yaxis_tickformat="$,.0f", legend_title_text="")
fig.update_xaxes(rangeslider_visible=True)
fig.show()
fig.write_html("interactive_line.html")
print("Saved: interactive_line.html")
```

**🎯 Salida esperada:** Dos líneas (ingresos y costos) con un control deslizante de rango arrastrable en la parte inferior. Agarra las asas del control para acercarte a un rango mensual concreto. Se guarda el archivo `interactive_line.html`.

**🩹 Si algo falla:** Si el control deslizante de rango no aparece, podrías estar usando una versión antigua de plotly — ejecuta `uv add --upgrade plotly`. Si la leyenda muestra `variable` como título en lugar de un espacio en blanco, comprueba que esté configurado `legend_title_text=""`.

**✅ Lista de verificación**

- ✅ Los tres gráficos de plotly se renderizan en el navegador con información al pasar el cursor.
- ✅ El gráfico de barras agrupa las barras lado a lado, no apiladas.
- ✅ El gráfico de dispersión codifica cuatro dimensiones (x, y, color, tamaño).
- ✅ El gráfico de líneas tiene un control deslizante de rango funcional.
- ✅ Los tres archivos HTML están guardados y se abren en un navegador.

**🤔 Preguntas socráticas**

¿Cuándo elegirías un gráfico interactivo de plotly sobre un PNG estático de matplotlib? ¿Y cuándo elegirías el PNG estático en su lugar? Piensa en tu audiencia — ¿quién ve el gráfico y cómo lo consume?

---

## Paso 5: Estilos personalizados y temas

Los gráficos se ven poco profesionales con colores y fuentes predeterminados. Construye un tema consistente y aplícalo a cada gráfico del proyecto.

### 5.1 Definir una paleta de colores personalizada y ajustes de fuente

**👟 Pista inicial:** Crea un diccionario de códigos de color hex y una función que aplique un estilo consistente a cualquier eje de matplotlib. Usa `plt.rcParams` para configurar tamaños de fuente globales.

```python
THEME = {
    "primary": "#2563EB",
    "secondary": "#F59E0B",
    "accent": "#10B981",
    "danger": "#EF4444",
    "bg": "#F8FAFC",
    "text": "#1E293B",
    "grid": "#E2E8F0",
}

plt.rcParams.update({
    "figure.facecolor": THEME["bg"],
    "axes.facecolor": THEME["bg"],
    "axes.edgecolor": THEME["grid"],
    "axes.labelcolor": THEME["text"],
    "text.color": THEME["text"],
    "xtick.color": THEME["text"],
    "ytick.color": THEME["text"],
    "font.size": 11,
    "axes.titlesize": 14,
    "axes.titleweight": "bold",
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.color": THEME["grid"],
})

CATEGORY_COLORS = {
    "Electronics": THEME["primary"],
    "Clothing": THEME["secondary"],
    "Home": THEME["accent"],
}

def style_ax(ax, title: str, xlabel: str = "", ylabel: str = "") -> None:
    ax.set_title(title)
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)
    ax.spines[["top", "right"]].set_visible(False)
```

### 5.2 Aplicar el tema a un gráfico

**👟 Pista inicial:** Usa `style_ax()` en cualquier objeto de ejes para aplicar un estilo limpio al instante. Los cambios de `plt.rcParams` se aplican globalmente desde este punto en adelante.

```python
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
bars = ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white", linewidth=0.5)

for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2.0, height, f"${height:,.0f}",
            ha="center", va="bottom", fontweight="bold", fontsize=10)

style_ax(ax, "Revenue by Category", ylabel="Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig("themed_bar.png", dpi=150)
plt.show()
print("Saved: themed_bar.png")
```

**🎯 Salida esperada:** El mismo gráfico de barras del Paso 2, pero ahora con un fondo gris claro, sin bordes superior/derecho, tamaños de fuente consistentes y la paleta de colores personalizada. Se guarda el archivo `themed_bar.png`.

**🩹 Si algo falla:** Si el fondo sigue siendo blanco, `plt.rcParams.update()` no se ha llamado en esta sesión — vuelve a ejecutar todo el bloque 5.1. Si los colores no coinciden con el tema, estás usando valores hex fijos en lugar del diccionario `CATEGORY_COLORS` — reemplázalos.

### 5.3 Construir un tema de seaborn para los gráficos estadísticos

**👟 Pista inicial:** Usa `sns.set_theme()` con `context="talk"` para fuentes más grandes y `style="whitegrid"` para una cuadrícula limpia. Combínalo con `palette` para un mapeo de colores consistente.

```python
sns.set_theme(style="whitegrid", context="talk", palette="Set2")

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

sns.boxplot(data=df, x="category", y="revenue", ax=axes[0])
style_ax(axes[0], "Revenue Distribution", ylabel="Revenue ($)")

sns.violinplot(data=df, x="category", y="units", ax=axes[1])
style_ax(axes[1], "Units Sold Distribution", ylabel="Units")

plt.tight_layout()
plt.savefig("seaborn_styled.png", dpi=150)
plt.show()
print("Saved: seaborn_styled.png")
```

**🎯 Salida esperada:** Diagramas de caja y violín lado a lado con el tema whitegrid de seaborn. El gráfico de violín muestra la forma de densidad de la distribución — más ancho donde se agrupan más puntos de datos. Se guarda el archivo `seaborn_styled.png`.

**🩹 Si algo falla:** Si el gráfico de violín se ve vacío o colapsado, tus datos podrían tener muy pocos puntos para la estimación de densidad de kernel — prueba `inner="quartile"` para mostrar las líneas de cuartiles dentro del violín, lo que hace más legibles los conjuntos de datos pequeños.

**✅ Lista de verificación**

- ✅ El diccionario `THEME` está definido con seis claves de color.
- ✅ Los ajustes globales de `plt.rcParams` producen un estilo consistente en todos los gráficos posteriores.
- ✅ `style_ax()` funciona como un helper reutilizable para cualquier eje de matplotlib.
- ✅ Los gráficos estadísticos de seaborn coinciden con el tema visual general.

**🤔 Preguntas socráticas**

¿Por qué eliminar los bordes superior y derecho (`spines[["top", "right"]].set_visible(False)`) hace que los gráficos sean más legibles? ¿Qué información transmitían alguna vez esos bordes — y valía la pena el desorden visual?

---

## Paso 6: Paneles de múltiples secciones

Los paneles del mundo real combinan varios tipos de gráficos en una sola figura. Usa `plt.subplots()` para organizar los gráficos en un diseño de cuadrícula.

### 6.1 Construir un panel 2x2

**👟 Pista inicial:** Crea una cuadrícula de subgráficos 2x2 con `plt.subplots(2, 2, figsize=(14, 10))`. Asigna un tipo de gráfico a cada cuadrante: barras (arriba-izquierda), líneas (arriba-derecha), dispersión (abajo-izquierda), pastel (abajo-derecha).

```python
category_revenue = df.groupby("category")["revenue"].sum()
monthly = df.groupby("month")[["revenue", "cost"]].sum().sort_index()

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle("Sales Dashboard — H1 2026", fontsize=16, fontweight="bold", y=1.01)

# Top-left: Bar chart
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
axes[0, 0].bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")
style_ax(axes[0, 0], "Revenue by Category", ylabel="Revenue ($)")
axes[0, 0].yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))

# Top-right: Line chart
axes[0, 1].plot(monthly.index, monthly["revenue"], marker="o", linewidth=2, label="Revenue", color=THEME["primary"])
axes[0, 1].plot(monthly.index, monthly["cost"], marker="s", linewidth=2, label="Cost", color=THEME["danger"])
axes[0, 1].fill_between(monthly.index, monthly["revenue"], monthly["cost"], alpha=0.1, color=THEME["primary"])
style_ax(axes[0, 1], "Monthly Trend", ylabel="Amount ($)")
axes[0, 1].yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
axes[0, 1].legend()

# Bottom-left: Scatter plot
for category in df["category"].unique():
    subset = df[df["category"] == category]
    axes[1, 0].scatter(subset["cost"], subset["revenue"], s=80, alpha=0.8,
                        label=category, color=CATEGORY_COLORS[category], edgecolors="white")
max_val = max(df["revenue"].max(), df["cost"].max())
axes[1, 0].plot([0, max_val], [0, max_val], linestyle="--", color="gray", alpha=0.5)
style_ax(axes[1, 0], "Revenue vs. Cost", xlabel="Cost ($)", ylabel="Revenue ($)")
axes[1, 0].legend(fontsize=9)

# Bottom-right: Pie chart
wedges, texts, autotexts = axes[1, 1].pie(
    category_revenue, labels=category_revenue.index, autopct="%1.1f%%",
    startangle=90, colors=[CATEGORY_COLORS[cat] for cat in category_revenue.index]
)
for autotext in autotexts:
    autotext.set_fontweight("bold")
axes[1, 1].set_title("Revenue Share", fontsize=14, fontweight="bold")

plt.tight_layout()
plt.savefig("dashboard.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: dashboard.png")
```

**🎯 Salida esperada:** Una sola figura grande con cuatro gráficos dispuestos en una cuadrícula 2x2. La fila superior tiene un gráfico de barras y uno de líneas. La fila inferior tiene un gráfico de dispersión y uno de pastel. Se guarda el archivo `dashboard.png`.

**🩹 Si algo falla:** Si los gráficos se superponen, `tight_layout()` se llama antes de que todos los ejes estén configurados — muévelo al final. Si `suptitle` se superpone con los gráficos superiores, ajusta `y=1.02` para empujarlo más arriba o usa `plt.subplots_adjust(top=0.93)` en su lugar. Si el pastel se ve aplastado en un óvalo, añade `axes[1, 1].set_aspect("equal")`.

### 6.2 Construir un panel estilo seaborn con FacetGrid

**👟 Pista inicial:** Usa `sns.FacetGrid()` para crear una cuadrícula de pequeños múltiples — un gráfico de dispersión por región, compartiendo los mismos ejes para comparación directa.

```python
g = sns.FacetGrid(df, col="region", hue="category", palette="Set2", height=4, aspect=1.2)
g.map(sns.scatterplot, "cost", "units", alpha=0.8, s=100, edgecolor="white")
g.add_legend(title="Category")
g.set_axis_labels("Cost ($)", "Units Sold")
g.figure.suptitle("Units vs. Cost by Region", fontsize=14, fontweight="bold", y=1.02)
g.savefig("facet_dashboard.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: facet_dashboard.png")
```

**🎯 Salida esperada:** Dos gráficos de dispersión lado a lado — uno para North y otro para South — con la misma escala x/y para compararlos fácilmente. Cada punto está coloreado por categoría. Se guarda el archivo `facet_dashboard.png`.

**🩹 Si algo falla:** Si las columnas de tipo facet tienen diferentes rangos de eje x, `sharex=True` y `sharey=True` no están configurados — son los valores predeterminados de `FacetGrid`, pero si los sobreescribiste, elimina la sobreescritura. Si la leyenda se superpone a un panel facet, usa `g.add_legend(loc="upper right", bbox_to_anchor=(1, 0))`.

**✅ Lista de verificación**

- ✅ El panel matplotlib 2x2 tiene cuatro tipos de gráfico distintos en una sola figura.
- ✅ El título principal es legible y no se superpone con el contenido de los gráficos.
- ✅ FacetGrid crea paneles separados por región con ejes compartidos.
- ✅ Ambos archivos PNG del panel están guardados y no están vacíos.

**🤔 Preguntas socráticas**

¿Cuándo sería un panel de múltiples secciones más útil que mostrar cada gráfico por separado? ¿Cuál es la compensación entre meter muchos gráficos en una sola figura frente a darle a cada gráfico su propio espacio?

---

## Paso 7: Exportar y compartir

Tus gráficos deben salir de la terminal. Guárdalos como PNG de alta calidad para informes y como archivos HTML interactivos para compartirlos con cualquiera que tenga un navegador.

### 7.1 Guardar todos los gráficos como PNG de alta resolución

**👟 Pista inicial:** Usa `dpi=300` para calidad de impresión y `bbox_inches="tight"` para evitar recortes. Crea un directorio dedicado `exports/` para mantener las cosas organizadas.

```python
from pathlib import Path

exports = Path("exports")
exports.mkdir(exist_ok=True)

# Regenerate key charts and save to exports/
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")
style_ax(ax, "Revenue by Category", ylabel="Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig(exports / "revenue_bar.png", dpi=300, bbox_inches="tight")
plt.close()

print(f"Exported to {exports}/")
for f in exports.iterdir():
    print(f"  {f.name} ({f.stat().st_size:,} bytes)")
```

**🎯 Salida esperada:**

```
Exported to exports/
  revenue_bar.png (45,231 bytes)
```

Cada archivo tiene al menos 30KB — los PNG diminutos significan que algo salió mal con el renderizado.

**🩹 Si algo falla:** Si el PNG tiene menos de 5KB, la figura estaba vacía cuando se ejecutó `savefig` — asegúrate de llamar a `savefig` antes que a `plt.close()`. Si el texto se recorta en los bordes, añade `bbox_inches="tight"` a la llamada de `savefig`.

### 7.2 Crear un informe HTML interactivo

**👟 Pista inicial:** Combina todos los gráficos de plotly en un solo archivo HTML generándolos en secuencia y usando `plotly.io.to_html()` para incrustar cada uno.

```python
import plotly.io as pio

monthly_cat = df.groupby(["month", "category"])["revenue"].sum().reset_index()

fig1 = px.bar(monthly_cat, x="month", y="revenue", color="category",
              barmode="group", title="Monthly Revenue by Category")
fig1.update_layout(yaxis_tickformat="$,.0f")

fig2 = px.scatter(df, x="cost", y="revenue", color="category", size="units",
                  hover_data=["month", "region"],
                  title="Revenue vs. Cost")
fig2.update_layout(xaxis_tickformat="$,.0f", yaxis_tickformat="$,.0f")

html_parts = [
    "<html><head><title>Sales Dashboard Report</title>",
    "<style>body{font-family:sans-serif;max-width:900px;margin:0 auto;padding:20px;}"
    "h1{color:#1E293B;} h2{color:#475569;margin-top:40px;}</style></head><body>",
    "<h1>Sales Dashboard — H1 2026</h1>",
    "<h2>Monthly Revenue by Category</h2>",
    pio.to_html(fig1, full_html=False),
    "<h2>Revenue vs. Cost</h2>",
    pio.to_html(fig2, full_html=False),
    "</body></html>",
]

with open("dashboard_report.html", "w") as f:
    f.write("".join(html_parts))

print("Saved: dashboard_report.html")
```

**🎯 Salida esperada:** Un archivo `dashboard_report.html` se abre en tu navegador con una página con estilo que contiene ambos gráficos interactivos — desplázate para verlos, pasa el cursor para inspeccionar valores, amplía con clic-arrastre.

**🩹 Si algo falla:** Si el archivo HTML muestra código crudo en lugar de gráficos, `pio.to_html()` podría estar devolviendo una página HTML completa en lugar de un fragmento — comprueba que esté `full_html=False`. Si la página se ve sin estilo, el bloque `<style>` tiene un error de sintaxis — comprueba las llaves o etiquetas no cerradas.

**✅ Lista de verificación**

- ✅ El directorio `exports/` contiene al menos un archivo PNG superior a 30KB.
- ✅ `dashboard_report.html` se abre en un navegador con gráficos interactivos funcionales.
- ✅ Los gráficos se renderizan a 300 DPI — aptos para impresión sin pixelación.
- ✅ Sin texto recortado, etiquetas faltantes ni áreas de gráfico en blanco en las exportaciones.

**🤔 Preguntas socráticas**

Ahora tienes dos formatos de exportación: PNG (estático, alta resolución) y HTML (interactivo, menor resolución). Si fueras a presentar ante un consejo de administración que imprime folletos, ¿qué formato usarías? ¿Y si se lo enviaras a un compañero que quiere explorar los datos por su cuenta?

---

## 🧩 Desafíos

<details>
<summary><strong>Desafío 1: Carrera de gráficos de barras animados</strong></summary>

Usa el parámetro `animation_frame` de plotly para crear un gráfico de barras animado que muestre cómo cambian los ingresos mes a mes. Las barras deben crecer y encogerse mientras reproduces la línea temporal.

```python
fig = px.bar(monthly_cat, x="category", y="revenue", color="category",
             animation_frame="month", range_y=[0, monthly_cat["revenue"].max() * 1.1],
             title="Revenue by Category — Month by Month",
             color_discrete_map=CATEGORY_COLORS)
fig.show()
```

</details>

<details>
<summary><strong>Desafío 2: Mapa de calor del margen de beneficio</strong></summary>

Calcula el margen de beneficio como `(revenue - cost) / revenue * 100`. Convierte los datos en una matriz con las categorías como filas y los meses como columnas. Usa `sns.heatmap()` para visualizar qué combinaciones categoría-mes tuvieron los márgenes más altos.

```python
df["margin"] = ((df["revenue"] - df["cost"]) / df["revenue"] * 100).round(1)
pivot = df.pivot_table(index="category", columns="month", values="margin")

fig, ax = plt.subplots(figsize=(10, 3))
sns.heatmap(pivot, annot=True, fmt=".1f", cmap="RdYlGn", center=50, ax=ax)
ax.set_title("Profit Margin (%) by Category and Month")
plt.tight_layout()
plt.savefig("margin_heatmap.png", dpi=150)
plt.show()
```

</details>

<details>
<summary><strong>Desafío 3: Panel interactivo con menú desplegable</strong></summary>

Usa `updatemenus` de plotly para añadir un menú desplegable que permita al usuario alternar entre ver ingresos, costos y unidades en el eje y de un solo gráfico — tres vistas en una figura interactiva.

```python
import plotly.graph_objects as go

monthly_all = df.groupby("month")[["revenue", "cost", "units"]].sum().sort_index().reset_index()

fig = go.Figure()
for col, color in [("revenue", "#4CAF50"), ("cost", "#F44336"), ("units", "#2196F3")]:
    fig.add_trace(go.Scatter(x=monthly_all["month"], y=monthly_all[col],
                             name=col.title(), visible=True if col == "revenue" else False,
                             line=dict(color=color, width=3), mode="lines+markers"))

fig.update_layout(
    updatemenus=[dict(
        buttons=[
            dict(label="Revenue", method="update", args=[{"visible": [True, False, False]}, {"yaxis.title": "Revenue ($)"}]),
            dict(label="Cost", method="update", args=[{"visible": [False, True, False]}, {"yaxis.title": "Cost ($)"}]),
            dict(label="Units", method="update", args=[{"visible": [False, False, True]}, {"yaxis.title": "Units Sold"}]),
        ],
        direction="down", showactive=True,
    )],
    title="Monthly Metrics (select one)",
    yaxis_title="Revenue ($)",
)
fig.show()
```

</details>

## Qué aprendiste

- Creaste gráficos de barras, líneas, dispersión y pastel con matplotlib
- Construiste diagramas de caja, mapas de calor, gráficos de pares y violines con seaborn
- Generaste gráficos HTML interactivos con plotly (barras, dispersión y líneas con control deslizante de rango)
- Definiste un tema de color personalizado y lo aplicaste de forma consistente a todos los tipos de gráficos
- Ensamblaste paneles de múltiples secciones usando `plt.subplots()` y `sns.FacetGrid()`
- Exportaste gráficos como PNG de alta resolución (300 DPI) e informes HTML interactivos
- Aprendiste cuándo cada biblioteca de visualización y formato es la elección correcta

## Dónde seguir desde aquí

- **Panel de Streamlit.** Envuelve los mismos gráficos en una aplicación de Streamlit con `st.pyplot()` y `st.plotly_chart()` para un panel web en vivo que se actualiza a medida que los datos cambian.
- **Animación con matplotlib.** Usa `matplotlib.animation.FuncAnimation` para crear gráficos animados que muestran cómo cambian los datos con el tiempo — excelente para presentaciones.
- **Altair o Vega-Lite.** Explora visualización declarativa donde describes *qué* trazar en lugar de *cómo* trazarlo — un paradigma distinto del enfoque imperativo de matplotlib.
- **Datos geográficos.** Usa `plotly.express.choropleth()` o `folium` para mapear datos en regiones geográficas — ventas por país, clima por ciudad, etc.
- **Datos reales.** Reemplaza el CSV de muestra con conjuntos de datos reales de [Kaggle](https://www.kaggle.com/datasets), [data.gov](https://data.gov) o tus propias hojas de cálculo. El mismo código de gráficos funciona con cualquier dato tabular.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estés orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa y amigable para principiantes para añadir el tuyo mediante una **pull request**, incluso si nunca has usado git: forkear el repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓