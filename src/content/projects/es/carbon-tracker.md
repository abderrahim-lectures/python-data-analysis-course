---
title: "Rastreador de Huella de Carbono"
description: "Un rastreador de huella de línea de comandos: factores de emisión por actividad, una semana de muestra de transporte/comida/energía, totales diarios y por categoría, un gráfico de barras ASCII, una verificación de presupuesto semanal, persistencia en CSV y comandos add/report/reset."
difficulty: "beginner"
estimatedMinutes: 60
xpReward: 100
tags: ["Environment", "Data Visualization", "CLI Tools"]
prerequisites:
  - "Listas, diccionarios y bucles for de Python"
  - "Leer y escribir un CSV de texto plano"
  - "Ejecutar un script de Python desde la terminal"
learningObjectives:
  - "Convertir cantidades de actividad en CO2e con factores de emisión por actividad"
  - "Agregar filas por día y por categoría con diccionarios planos"
  - "Renderizar totales como gráfico de barras ASCII y verificar un presupuesto semanal"
  - "Persistir las filas de actividad en un CSV y recargarlas"
  - "Envolver el análisis en subcomandos CLI add / report / reset"
---

# 🛠️ 🌍 Construye un Rastreador de Carbono

Tus elecciones diarias emiten carbono: conducir 10 km no es lo mismo que andar 10 km o tomar el tren 10 km, y comer carne no es lo mismo que comer plantas. Este proyecto construye un pequeño y honesto **rastreador de carbono** en la terminal — un único script de Python que sabe cuántos kg de CO2-equivalente cuesta cada actividad, trabaja una semana de muestra de entradas de transporte/comida/electricidad, totaliza todo por día y por categoría, dibuja un gráfico de barras ASCII, verifica la semana contra un presupuesto, guarda todo en un CSV y finalmente se convierte en un comando real con los subcomandos `add`, `report` y `reset`. Usa solo la biblioteca estándar — sin instalaciones, sin aleatoriedad, así que los números que ves aquí son exactamente los números que verás.

Esto asume listas, diccionarios, bucles `for` de Python y uso básico de terminal. Es un proyecto opcional y no calificado — consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente. Cada pieza corre en una instalación básica de Python (3.10+).

## 🎯 Lo que harás

1. Definir factores de emisión y una semana de muestra; calcular el CO2e de cada actividad.
2. Totalizar la semana por día y por categoría, y dibujar un gráfico de barras ASCII.
3. Verificar la semana contra un presupuesto semanal.
4. Guardar todas las filas en `activities.csv` y cargarlas de vuelta.
5. Convertir el script en un CLI con `add`, `report` y `reset`.

## Dónde ejecutar esto

**Localmente** es el hogar real de una herramienta CLI: crea cualquier directorio vacío y un archivo.

```bash
mkdir carbon-tracker && cd carbon-tracker
touch carbon_tracker.py
```

**Google Colab, Kaggle Notebooks y Binder** también funcionan — cada bloque es Python plano, sin paquetes de terceros. Una ejecución tipo terminal (`% python3 carbon_tracker.py …`) no está disponible en notebooks; allí puedes llamar a las funciones del CLI directamente. El CSV y los valores son idénticos en todas partes.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/carbon-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/carbon-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcarbon-tracker%2Fnotebook.ipynb)

## Configuración

Un directorio vacío, un archivo, cero paquetes.

### Verifica el entorno

```bash
python3 --version
```

Cualquier 3.10+ está bien. Luego crea el archivo del proyecto:

```bash
mkdir carbon-tracker && cd carbon-tracker
touch carbon_tracker.py
```

**✅ Lista de verificación**

- ✅ `python3 --version` imprime 3.10 o más nuevo.
- ✅ `carbon_tracker.py` existe en la carpeta `carbon-tracker`.
- ✅ Sin `pip install` — todo el proyecto es `import csv`, `import sys` y built-ins de Python.

**🤔 Pregunta(s) socrática(s)**

- El rastreador convierte *cantidades* (km, kWh, comidas) en *kg de CO2e* multiplicando por un factor por actividad. ¿Quién puede elegir esos factores, y por qué dos rastreadores podrían discrepar sobre el mismo viaje en auto?
- Este proyecto no tiene nada de aleatoriedad. ¿Por qué importa más la reproducibilidad para una herramienta climática que para un juego?

## Paso 1: Factores de emisión y una semana de muestra

Toda la matemática del carbono vive en dos diccionarios: `emissions` (kg CO2e por *una* unidad) y `week` (las actividades registradas).

### 1.1 Los factores

**👟 Pista inicial :** Un dict que mapea cada actividad a kg de CO2e por unidad — km para transporte, kWh para electricidad, por comida para alimentos.

```python
# carbon_tracker.py
import csv
import sys

emissions = {
    "car": 0.18, "bus": 0.10, "train": 0.04, "bike": 0.0,
    "flight": 0.25, "electricity": 0.42,
    "meal_meat": 2.2, "meal_veg": 0.8,
}
```

Cada número posterior fluye de esta tabla. `bike: 0.0` es el cero que hace que el resto tenga sentido — los números miden el carbono *extra* que cuesta cada elección, no el "valor".

**🎯 Resultado esperado :** Ninguno aún — los factores son solo datos. Verifica a ojo: una comida grande `meal_meat` (2.2) cuesta casi tres comidas veganas (0.8); una hora de electricidad (0.42 por kWh) le gana a una comida con carne.

### 1.2 La semana de muestra

**👟 Pista inicial :** `week` es una lista de tuplas `(day, category, amount)` — transporte, comida y electricidad para siete días.

```python
# carbon_tracker.py (continued)
week = [
    ("Mon", "car", 12), ("Mon", "meal_meat", 2), ("Mon", "electricity", 6),
    ("Tue", "bike", 8), ("Tue", "meal_veg", 3), ("Tue", "electricity", 5),
    ("Wed", "train", 25), ("Wed", "meal_meat", 1), ("Wed", "electricity", 6),
    ("Thu", "bus", 9), ("Thu", "meal_veg", 2), ("Thu", "electricity", 7),
    ("Fri", "car", 8), ("Fri", "meal_meat", 2), ("Fri", "electricity", 5),
    ("Sat", "train", 60), ("Sat", "meal_veg", 3), ("Sat", "electricity", 4),
    ("Sun", "bike", 20), ("Sun", "meal_veg", 2), ("Sun", "electricity", 4),
]
```

Tres modos de transporte (sin vuelos todavía), unas cuantas comidas, algunos kWh. Los números se mantienen pequeños para que la aritmética sea comprobable a mano.

**🎯 Resultado esperado :** Ninguno aún — los datos están definidos, no impresos.

### 1.3 Calcula las filas de carbono

**👟 Pista inicial :** Una fila por actividad → aplana `(day, category, amount)` a través de `emissions` a `(day, category, amount, kg)`, redondeando el producto a 2 decimales.

```python
# carbon_tracker.py (continued)
rows = []
for day, category, amount in week:
    kg = round(emissions[category] * amount, 2)
    rows.append({"day": day, "category": category, "amount": amount, "kg": kg})

for r in rows[:3]:
    print(r)
total = round(sum(r["kg"] for r in rows), 2)
print("WEEK TOTAL:", total, "kg CO2e")
```

El patrón de dos diccionarios y un bucle — una *tabla de hechos* de filas `(day, category, amount, kg)` — es la misma forma que usarán `csv` y, más tarde, `add`. Todo lo que sigue (gráficos, presupuestos, CSV) lee esta lista, no las tuplas crudas.

**🎯 Resultado esperado :**

```
{'day': 'Mon', 'category': 'car', 'amount': 12, 'kg': 2.16}
{'day': 'Mon', 'category': 'meal_meat', 'amount': 2, 'kg': 4.4}
{'day': 'Mon', 'category': 'electricity', 'amount': 6, 'kg': 2.52}
WEEK TOTAL: 42.44 kg CO2e
```

**🩹 Si sale mal :** Si el `kg` de `car 12` no es `2.16`, la clave del factor se descarrió (`0.18 × 12 = 2.16`). Si el total imprime `84.88`, se concatenaron dos listas `weeks` — mantén exactamente 21 tuplas.

### 1.4 Verifica las filas

**✅ Lista de verificación**

- ✅ Exactamente 21 filas (7 días × 3 entradas), cada una con `day`, `category`, `amount`, `kg`.
- ✅ `WEEK TOTAL: 42.44 kg CO2e` — determinista, sin aleatoriedad en ninguna parte.
- ✅ Lunes: 2.16 (auto) + 4.4 (carne) + 2.52 (electricidad) = 9.08.

**🤔 Pregunta(s) socrática(s)**

- Método: los factores de emisión multiplican *unidades*. Si registras solo "conduje" sin los kilómetros, ¿qué no puedes calcular — y qué dice eso sobre la vía más barata para *mejorar* la calidad de datos (más columnas, no más filas)?
- Las comidas con carne del lunes (4.4 kg) cuestan lo que dos días veganos completos juntos. ¿Cuándo una semana sin carne roja emitiría aun así más que una con ella?

## Paso 2: Agrega por día y por categoría

Las filas individuales son ruido; el trabajo del rastreador es resumir. El Paso 2 totaliza por día y por categoría.

### 2.1 Totales diarios

**👟 Pista inicial :** Un dict con clave por día, sumando el `kg` de cada fila.

```python
# carbon_tracker.py (continued)
daily = {}
for r in rows:
    daily[r["day"]] = round(daily.get(r["day"], 0) + r["kg"], 2)

for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
    print(f"{day}  {daily[day]:>5} kg")
```

`daily.get(day, 0)` es el idiom del acumulador: la primera aparición de un día arranca en 0, toda fila posterior suma su parte. El redondeo al *final* (no por paso) mantiene honesta la suma.

**🎯 Resultado esperado :**

```
Mon   9.08 kg
Tue    4.5 kg
Wed   5.72 kg
Thu   5.44 kg
Fri   7.94 kg
Sat   6.48 kg
Sun   3.28 kg
```

**🩹 Si sale mal :** Si Tue imprime `8.6` en lugar de `4.5`, el paseo en bici de cero carbono (8 km × 0.0 = 0 kg) se contó como un 8 — verifica que `bike: 0.0` esté en `emissions`. Si los totales se descarrián por 0.01, redondear el `kg` por fila y luego sumar difiere de sumar y luego redondear — elige una regla y mantentla.

### 2.2 El gráfico de barras ASCII

**👟 Pista inicial :** Mapea el total de cada día a `"#" * round(v / max * 40)`.

```python
# carbon_tracker.py (continued)
mx = max(daily.values())
for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
    bar = "#" * round(daily[day] / mx * 40)
    print(f"{day}  {daily[day]:>5}  {bar}")
```

`v / mx * 40` re-escala el día más pesado (Mon, 9.08) a una barra completa de 40 caracteres y a todos los demás proporcionalmente — un gráfico de barras imprimible sin biblioteca de gráficos. El punto no es la precisión; es el patrón — Tue a Sun son visiblemente más delgados que la corrida del lunes.

**🎯 Resultado esperado :**

```
Mon   9.08  ########################################
Tue    4.5  ####################
Wed   5.72  #########################
Thu   5.44  ########################
Fri   7.94  ###################################
Sat   6.48  #############################
Sun   3.28  ##############
```

**🩹 Si sale mal :** Si la barra de Mon es corta, `max` se calculó sobre las *claves* (nombres de día) en lugar de los valores. Si las barras tienen 0 caracteres, `round` de una razón diminuta llegó a 0 — aquí todos los días son no-cero, así que una barra vacía significa un bug de datos más arriba.

### 2.3 Verifica los agregados

**✅ Lista de verificación**

- ✅ Los totales diarios reproducen la tabla de arriba (Mon 9.08 … Sun 3.28).
- ✅ Las barras escalan a 40 `#` para el máximo (Mon) y se encogen de forma justa.
- ✅ Verificación por categoría para la sanidad: transporte `7.9` (4.31+1.0+0.9+3.4… espera — mira el Socrático de abajo).

**🤔 Pregunta(s) socrática(s)**

- Aproxima a mano los totales por categoría: auto 20 km (`0.18`), bus 9 km (`0.10`), tren 85 km (`0.04`), bicis (0), carne 5 comidas (`2.2`), vegano 10 comidas (`0.8`), electricidad 37 kWh (`0.42`). ¿Suma 42.44 — y qué categoría carga con la mayor parte?
- Tu gráfico escala a *Monday*, el día más pesado. Cambia el denominador a la *semana total* (42.44) en lugar de `max`. Las barras se encogen a ~20 `#`. ¿Cuál es el intercambio entre "muestra el patrón" y "muestra la fracción verdadera"? ¿Qué escala le mostrarías a un compañero de clase?

## Paso 3: Verifica el presupuesto semanal

Un presupuesto convierte los totales en decisiones. Elige 40 kg/semana como el tope.

### 3.1 ¿Sobre o bajo?

**👟 Pista inicial :** Compara `total` con el presupuesto y reporta tanto el exceso/faltante absoluto como porcentual.

```python
# carbon_tracker.py (continued)
budget = 40.0
diff = round(total - budget, 2)
percent = round(total / budget * 100)
print(f"BUDGET: {budget} kg CO2e/week")
print(f"USED : {total} kg  ({percent}% of budget)")
print(f"OVER : {diff} kg" if diff > 0 else f"UNDER: {-diff} kg saved")
```

El porcentaje es el número más informativo de la herramienta: `106%` ya dice "un poco por encima" antes de que leas el `42.44` absoluto. La línea `OVER`/`UNDER` es el veredicto orientado al humano.

**🎯 Resultado esperado :**

```
BUDGET: 40 kg CO2e/week
USED : 42.44 kg  (106% of budget)
OVER : 2.44 kg
```

**🩹 Si sale mal :** Si ves `UNDER: -2.44` el signo se volteó — las ramas del ternario están en los brazos equivocados. Si imprime `105%` después de redondear, redondeaste `total` a un dígito en alguna parte y la comparación cambió; calcula `percent` desde el `total` *sin redondear*.

### 3.2 Haz útil el veredicto

**👟 Pista inicial :** Imprime el día más pesado y una pista para el arreglo más barato dentro de la semana.

```python
# carbon_tracker.py (continued)
worst = max(daily, key=daily.get)
print(f"Biggest day: {worst} ({daily[worst]} kg)")
train_swap = 0.18 - 0.04
print(f"Ride the train: swap one 10-km car trip and save {round(train_swap * 10, 2)} kg")
```

Reportar el *porqué* es la mitad de la herramienta ambiental. Un veredicto de presupuesto sin el día más grande es una calificación sin retroalimentación. `daily.get` como argumento `key` de `max` selecciona la *clave de mayor valor* — no la primera alfabéticamente — que es el uso clásico de `key=`.

**🎯 Resultado esperado :**

```
Biggest day: Mon (9.08 kg)
Ride the train: swap one 10-km car trip and save 1.4 kg
```

**🩹 Si sale mal :** Si `Biggest day` imprime `Sun`, pasaste `max(daily)` en lugar de `max(daily, key=daily.get)` — el primero devuelve el *string de clave* más grande. Si el ahorro del intercambio muestra `0.14`, la diferencia de factores es `0.18 − 0.04 = 0.14` por km — ×10 km = 1.4 kg; mantén la multiplicación en la misma línea.

### 3.3 Verifica el presupuesto

**✅ Lista de verificación**

- ✅ 42.44 usado vs 40.0 presupuesto → `OVER : 2.44 kg`, `106%`.
- ✅ Día más grande Mon (9.08), arreglo de 10-km más barato 1.4 kg (tren vs auto).
- ✅ La verificación del presupuesto es una función pura de `total` — cambia `budget`, consigue un veredicto nuevo, ningún otro código se mueve.

**🤔 Pregunta(s) socrática(s)**

- 106% significa "2.44 kg por encima". Supón que el presupuesto fuera 25 kg. ¿Qué cambio único llevaría la semana entera *bien por debajo*? ¿Serían las comidas con carne, la conducción, o algo más?
- Un presupuesto fijado en 40 kg/semana oculta *quién* emite: tu semana de muestra asume un auto, un bus, trenes, tres comidas con carne. Si reconstruyeras la semana con un vuelo, el veredicto para el mismo presupuesto de 40 kg sería absurdo — ¿qué dice eso sobre igualar un presupuesto al estilo de vida que se está midiendo?

## Paso 4: Guarda y recarga las filas

Ninguna herramienta sobrevive un reinicio re-tecleando datos. El Paso 4 escribe `rows` en `activities.csv` y lo lee de vuelta.

### 4.1 Escribe el CSV

**👟 Pista inicial :** `csv.DictWriter` con `writeheader()` y luego todas las filas.

```python
# carbon_tracker.py (continued)
with open("activities.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["day", "category", "amount", "kg"])
    writer.writeheader()
    writer.writerows(rows)
print("Saved", len(rows), "rows to activities.csv")
```

La lista `rows` y el CSV son las mismas cuatro columnas, así que `DictWriter` mapea cada dict directamente a una línea. `newline=""` detiene las líneas en blanco entre registros en Windows.

**🎯 Resultado esperado :** `Saved 21 rows to activities.csv` — y un archivo cuyas primeras líneas se ven así

```
day,category,amount,kg
Mon,car,12,2.16
Mon,meal_meat,2,4.4
```

**🩹 Si sale mal :** Si falta el encabezado o las columnas están intercambiadas, la lista `fieldnames` no coincide con las claves del dict. Si ves líneas en blanco dentro del CSV, quita `newline=""`.

### 4.2 Recarga y recalcula la semana

**👟 Pista inicial :** `csv.DictReader`, suma sobre la columna `kg` (strings → floats).

```python
# carbon_tracker.py (continued)
with open("activities.csv", newline="") as f:
    loaded = list(csv.DictReader(f))

reload_total = round(sum(float(r["kg"]) for r in loaded), 2)
print("Reloaded", len(loaded), "rows, week total", reload_total, "kg")
```

El round-trip prueba que el guardado fue sin pérdidas: las filas cargadas producen el mismo 42.44. Nota el cast — el CSV almacena texto, así que `float(r["kg"])` debe convertir `"2.16"` en un número antes de sumar.

**🎯 Resultado esperado :** `Reloaded 21 rows, week total 42.44 kg`

**🩹 Si sale mal :** Si la recarga lanza `ValueError: could not convert string…`, se coló una línea sin encabezado o editada a mano; revisa el CSV con un editor de texto. Si el total difiere de 42.44, el cast float o una fila en blanco extra está re-entrando en la suma.

### 4.3 Verifica el round-trip

**✅ Lista de verificación**

- ✅ `activities.csv` tiene 4 columnas × 21 filas de datos + encabezado.
- ✅ La recarga reproduce `WEEK TOTAL: 42.44 kg`.
- ✅ El CSV es un entregable legible por humanos — cualquiera puede abrirlo en una hoja de cálculo.

**🤔 Pregunta(s) socrática(s)**

- El programa actualmente *escribe* desde `rows` en cada ejecución, sobrescribiendo el archivo. Una vez que exista el `add` del CLI del Paso 5, re-ejecutar borraría las entradas nuevas. Cuando llegues a eso, ¿cuál es el cambio mínimo — escribir *una vez*, y luego añadir?
- `DictReader` devuelve strings; las variantes son fáciles de confundir con números. Nombra otra conversión de tipo de columna, como analizar fechas, que una app "real" necesitaría antes de que este CSV sea confiable.

## Paso 5: Conviértelo en un CLI

El último paso convierte el rastreador en una herramienta real: subcomandos `add`, `report` y `reset` manejados por `sys.argv`.

### 5.1 Report

**👟 Pista inicial :** Un `report()` que lee el CSV, recalcula totales, el gráfico y el veredicto de presupuesto.

```python
# carbon_tracker.py (continued)
def load_rows():
    with open("activities.csv", newline="") as f:
        return list(csv.DictReader(f))

def report():
    loaded = load_rows()
    total = round(sum(float(r["kg"]) for r in loaded), 2)
    daily = {}
    for r in loaded:
        daily[r["day"]] = round(daily.get(r["day"], 0) + float(r["kg"]), 2)
    print(f"WEEK TOTAL: {total} kg ({round(total / 40.0 * 100)}% of budget)")
    mx = max(daily.values())
    for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
        print(f"{day}  {daily.get(day, 0):>5}  {'#' * round(daily.get(day, 0) / mx * 40)}")
```

`report()` es el mismo cálculo que los Pasos 2–3, pero lee del archivo guardado — el CLI y el análisis son una sola función. `daily.get(day, 0)` sigue reportando un día faltante como 0 kg en lugar de reventar.

**🎯 Resultado esperado :**

```
WEEK TOTAL: 42.44 kg (106% of budget)
Mon   9.08  ########################################
Tue    4.5  ####################
Wed   5.72  #########################
Thu   5.44  ########################
Fri   7.94  ###################################
Sat   6.48  #############################
Sun   3.28  ##############
```

**🩹 Si sale mal :** Si el CLI no imprime nada, `report()` nunca fue *llamado* — el dispatch de `sys.argv` (5.3) viene después; por ahora, ejecuta `python3 carbon_tracker.py` y agrega una llamada plana `report()` al final del archivo temporalmente.

### 5.2 Add y reset

**👟 Pista inicial :** `add(day, category, amount)` añade una fila calculada al CSV; `reset()` reescribe la semana de muestra.

```python
# carbon_tracker.py (continued)
def add(day, category, amount):
    kg = round(emissions[category] * float(amount), 2)
    with open("activities.csv", "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["day", "category", "amount", "kg"])
        writer.writerow({"day": day, "category": category, "amount": amount, "kg": kg})
    report()

def reset():
    rows = [{"day": d, "category": c, "amount": a,
             "kg": round(emissions[c] * a, 2)} for d, c, a in week]
    with open("activities.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["day", "category", "amount", "kg"])
        writer.writeheader()
        writer.writerows(rows)
```

`add` abre en modo append (`"a"`) para que *no* sobrescriba el archivo — las filas nuevas se unen a la historia, y `report()` re-suma desde el disco. `reset` reconstruye deliberadamente la semana de muestra prístina para que cada ejemplo de aula arranque de la misma línea base de 42.44.

**🎯 Resultado esperado :** Ninguna salida por sí solos — `add` y `reset` re-llaman `report()` al final, así que su salida es el gráfico que viste en 5.1.

### 5.3 El despachador

**👟 Pista inicial :** Mapea el primer argumento de `sys.argv` a la función correcta con un pequeño `if/elif`.

```python
# carbon_tracker.py (continued)
if __name__ == "__main__":
    if len(sys.argv) < 2:
        report()
    elif sys.argv[1] == "report":
        report()
    elif sys.argv[1] == "add":
        add(sys.argv[2], sys.argv[3], sys.argv[4])
    elif sys.argv[1] == "reset":
        reset()
    else:
        print("Commands: report | add <day> <category> <amount> | reset")
```

`if __name__ == "__main__"` significa que el archivo corre como *programa* cuando se ejecuta directamente (`python3 carbon_tracker.py …`) pero sigue siendo importable como funciones cuando se usa en un notebook. El despachador es la puerta de entrada del CLI: una cadena entra, una función sale.

**🎯 Vamos a ejecutarlo.** Muestra fresca:

```bash
python3 carbon_tracker.py report
```

**🎯 Resultado esperado :**

```
WEEK TOTAL: 42.44 kg (106% of budget)
Mon   9.08  ########################################
Tue    4.5  ####################
Wed   5.72  #########################
Thu   5.44  ########################
Fri   7.94  ###################################
Sat   6.48  #############################
Sun   3.28  ##############
```

Luego un viaje en auto de 5 km agregado el viernes:

```bash
python3 carbon_tracker.py add Fri car 5
```

**🎯 Resultado esperado (cabecera, y el total nuevo):**

```
WEEK TOTAL: 43.34 kg (108% of budget)
Fri   8.84  ####################################
…
```

Espera — un manejo de 5 km después del reset cambia el resultado limpiamente: `42.44 + 0.90 = 43.34`. Ahora la *única* elección que importa:

```bash
python3 carbon_tracker.py reset
python3 carbon_tracker.py add Sat flight 450
```

**🎯 Resultado esperado (cabecera):**

```
WEEK TOTAL: 154.94 kg (387% of budget)
```

Un solo vuelo de 450 km es `0.25 × 450 = 112.5 kg` — casi tres veces el presupuesto de toda esta semana, y la barra de 40 `#` del gráfico ahora pertenece al sábado. Ese es el titular honesto que el rastreador existe para entregar.

**🩹 Si sale mal :** Si `add` muestra `108%` la primera vez y `387%` ya en la segunda, el archivo de muestra no se reinició entre ejecuciones (los appends se acumulan). `reset` primero, luego `add` — la muestra es tu ancla reproducible.

**🤔 Pregunta(s) socrática(s)**

- `add` toma una *etiqueta de día* (`Fri`) — los días de la semana de muestra son etiquetas, no fechas. ¿Qué cambiaría si `day` se volviera un `YYYY-MM-DD` real? ¿Qué partes de `report()` (la leyenda del gráfico, la ventana semanal) tendrían que dejar de codificar a mano las siete etiquetas?
- Esta herramienta reporta kg por *semana* para una persona. Los hogares de Massachusetts emiten del orden de 15,000 kg/año. ¿Más o menos cuántas semanas de muestra es eso — y qué te dice la razón entre la huella de un individuo y un *promedio nacional* sobre lo significativos que son en realidad los presupuestos personales?

### 5.4 Verifica el CLI

**✅ Lista de verificación**

- ✅ `report` desde un `reset` fresco → `42.44 kg (106%)`.
- ✅ `add Fri car 5` después del reset → `43.34 kg (108%)`; la barra del viernes crece una muesca.
- ✅ `add Sat flight 450` después del reset → `154.94 kg (387%)`, el sábado es dueño de la barra de 40 caracteres.
- ✅ Los comandos desconocidos imprimen la línea de uso, no un crash.

## ⚠️ Errores comunes

- **`max(daily)` vs `max(daily, key=daily.get)`.** El primero elige el *string de clave* más grande ("Wed"), el segundo el *valor* más grande. Mezclarlos mal-etiqueta el día más pesado.
- **Orden de redondeo.** Redondear `rows` a 2 decimales y luego sumar está bien — pero redondear *otro* intermedio (como el total diario) antes de comparar con honestidad cambia la respuesta por 0.01. Elige una política de redondeo y mantentla.
- **Append vs sobrescritura.** `open(..., "w")` opta por sobrescribir; `open(..., "a")` añade. `reset` debe usar `"w"`, `add` debe usar `"a"` — intercámbialos y la demo se rompe (borrando historia o apilándola).
- **Olvidar el cast float.** `DictReader` devuelve strings; `sum(float(r["kg"]) for r in loaded)` es obligatorio. Sumar strings o revienta o concatena "2.164.4…".
- **Un presupuesto que ignora la categoría.** 106% del presupuesto es el veredicto — pero la categoría de flota (transporte) y la categoría de comida suman más de la mitad de la semana; arregla la equivocada y el presupuesto sigue explotado.
- **Sin `reset` entre demos del CLI.** Las ejecuciones repetidas de `add` crecen el CSV sin límite. Reinicia — o documenta la línea base — o tu "semana" se convierte silenciosamente en un mes.

## Lo que acabas de construir

Un rastreador de carbono de terminal de punta a punta: factores de emisión, una tabla de hechos de filas `(day, category, amount, kg)`, agregación diaria y por categoría desde diccionarios planos, un gráfico de barras ASCII sin dependencias, un veredicto de presupuesto expresado como porcentaje, persistencia en CSV con un round-trip sin pérdidas, y un CLI de tres comandos sobre `sys.argv`. Las ideas transferibles aquí son el *patrón*: una **tabla de unidades** que convierte cantidades arbitrarias de actividad en un número comparable; **fundir filas estrechas en totales diarios y por categoría** con un dict acumulador; **dejar que el veredicto sea un porcentaje**, no kg crudos; **hacer del CSV el sistema de registro** para que el reporte sea siempre una función del archivo; y **superficializar una comparación dramática** (el vuelo de 450 km) porque una herramienta que solo imprime sus propios totales olvida lo que significan los números.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/carbon-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/carbon-tracker) en el repositorio del curso contiene el rastreador completo como notebook — factores, la semana de muestra, gráfico, presupuesto, round-trip de CSV y el CLI add/report/reset, ejecutable en Colab/Kaggle/Binder. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Rastrea una semana *real*: mantén el mismo esquema, reemplaza `week` con tus propias entradas, y mira tu número real contra un presupuesto de 40 kg que ajustes a tu realidad.
- Cambia de etiquetas de día a fechas reales con `datetime.date`, y haz que `report` envenere "los últimos 7 días" en lugar de la leyenda Mon–Sun codificada a mano.
- Agrega un recomendador de "intercambios": encuentra la única actividad cuyo reemplazo (`car → train`, `meal_meat → meal_veg`) recorta más kg bajo el presupuesto.
- Grafica con matplotlib en lugar de `#`: el mismo dict `daily` alimenta `plt.bar(days, values)` con mucho menos esfuerzo que dibujar las barras tú mismo.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓