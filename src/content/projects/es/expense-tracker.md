---
title: "Rastreador de Gastos"
description: "Rastrea gastos con categorías, presupuestos, escaneo de recibos e informes financieros."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["pandas", "matplotlib", "data-analysis", "visualization"]
prerequisites:
  - "Fundamentos de Python (variables, bucles, funciones, diccionarios)"
  - "pandas básico (DataFrames, groupby)"
  - "matplotlib básico"
learningObjectives:
  - "Modelar datos financieros con diccionarios y listas de Python"
  - "Convertir datos crudos en DataFrames de pandas para análisis"
  - "Agrupar y agregar gastos por categoría y por mes"
  - "Construir un sistema de alertas de presupuesto basado en umbrales"
  - "Crear gráficos de barras y de pastel con matplotlib"
  - "Persistir datos a CSV y cargarlos de vuelta entre sesiones"
---

# 💰 Rastreador de Gastos

Controla tu gasto, cíñete a los presupuestos y visualiza a dónde va tu dinero — todo desde la línea de comandos. Este proyecto te lleva de diccionarios Python crudos a través del análisis con pandas hasta los gráficos de matplotlib, construyendo una herramienta práctica que de verdad puedes usar para gestionar tus finanzas.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Definir un modelo de datos para gastos y presupuestos usando diccionarios y listas de Python simples.
2. Escribir funciones para registrar gastos nuevos con fecha, monto, categoría y descripción.
3. Convertir los datos de gastos en un DataFrame de pandas y calcular resúmenes por categoría y mensuales.
4. Construir un sistema de alertas de presupuesto que señale el gasto excesivo con umbrales configurables.
5. Generar gráficos de barras y de pastel que muestren a dónde va tu dinero.
6. Persistir los gastos en un archivo CSV y cargarlos de vuelta entre sesiones.
7. Pulir todo en una CLI interactiva con un menú, salida a color y validación de entrada.

## Dónde ejecutar esto

- **Localmente con `uv` (recomendado).** Este proyecto usa `pandas` y `matplotlib`, de modo que una instalación local es el camino más fluido. La sección Configuración de abajo lo recorre.
- **Playground de JupyterLite.** Pega las celdas de código directamente en un notebook — funciona bien para explorar los pasos de análisis (2–5), aunque el menú CLI (Paso 7) está diseñado para una terminal real.
- **Google Colab.** Abre un notebook nuevo y pega las celdas. Misma advertencia que JupyterLite: la CLI interactiva funciona mejor en una terminal real.

## Configuración

`uv` es una sola herramienta que reemplaza la cadena habitual de "instala Python, luego pip, luego un entorno virtual" — puede instalar y gestionar versiones de Python junto con las dependencias de tu proyecto.

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
uv init expense-tracker
cd expense-tracker
uv add pandas matplotlib
```

`pandas` maneja el análisis de datos (DataFrames, groupby, agregaciones) y `matplotlib` genera los gráficos. Todo lo demás es Python de la biblioteca estándar.

## Paso 1: Define el modelo de datos

Antes de escribir cualquier función, decide cómo viven los gastos y presupuestos en memoria. Cada gasto es un diccionario con cuatro campos — fecha, monto, categoría y descripción. Una lista contiene todos los gastos. Un diccionario separado mapea cada categoría a su límite de presupuesto mensual.

### 1.1 Crea los contenedores vacíos

**👟 Pista inicial :** Importa `pandas` y `date` de `datetime`. Crea una lista vacía llamada `expenses` y un diccionario llamado `budgets` con cuatro categorías: groceries, transport, dining y entertainment. Elige montos razonables en dólares para cada presupuesto.

```python
import pandas as pd
from datetime import date

expenses = []
budgets = {
    "groceries": 500,
    "transport": 200,
    "dining": 300,
    "entertainment": 150,
}
```

**🎯 Resultado esperado :** Aún no hay salida visible — acabas de crear dos contenedores vacíos. Ejecutar `print(expenses)` da `[]` y `print(budgets)` muestra las cuatro categorías con sus límites.

**🩹 Si sale mal :** Si obtienes un `NameError` en `pd`, asegúrate de que `import pandas as pd` está en la parte superior de la celda o del script. Si `budgets` muestra un diccionario vacío, verifica que incluiste los dos puntos entre los nombres de categoría y los montos.

### 1.2 Entiende la estructura del gasto

Cada gasto que registres será un diccionario que se ve así:

```python
{
    "date": "2026-09-06",
    "amount": 42.50,
    "category": "groceries",
    "description": "Weekly farmer's market",
}
```

El `date` se almacena como una cadena en formato ISO (`YYYY-MM-DD`) de modo que se ordene correctamente. El `amount` es un float redondeado a dos decimales. El `category` siempre está en minúsculas por consistencia. El `description` es texto libre.

**✅ Lista de verificación**

- ✅ `expenses` es una lista vacía `[]`.
- ✅ `budgets` tiene cuatro claves: `"groceries"`, `"transport"`, `"dining"`, `"entertainment"`.
- ✅ Puedes explicar qué representa cada campo en un diccionario de gasto.

---

## Paso 2: Agrega gastos

Escribe una función que tome un monto, una categoría y una descripción, construya un diccionario de gasto y lo anexe a la lista. Incluye normalización de fecha y validación básica.

### 2.1 Escribe la función `add_expense`

**👟 Pista inicial :** Define `add_expense(amount, category, description)` que anexe un diccionario a `expenses`. Usa `date.today().isoformat()` para la fecha. Redondea el monto a dos decimales. Pasa la categoría a minúsculas. Imprime un mensaje de confirmación después de cada alta.

```python
def add_expense(amount: float, category: str, description: str) -> None:
    expenses.append({
        "date": date.today().isoformat(),
        "amount": round(amount, 2),
        "category": category.lower(),
        "description": description,
    })
    print(f"Added: ${amount:.2f} in {category}")
```

### 2.2 Pruébalo con datos de muestra

**👟 Pista inicial :** Llama a `add_expense` cuatro veces con montos, categorías y descripciones diferentes. Luego imprime la lista `expenses` para confirmar que las cuatro están.

```python
add_expense(42.50, "groceries", "Weekly farmer's market")
add_expense(15.00, "transport", "Bus pass top-up")
add_expense(28.00, "dining", "Lunch with colleague")
add_expense(55.00, "groceries", "Pantry restock")
```

**🎯 Resultado esperado :**

```
Added: $42.50 in groceries
Added: $15.00 in transport
Added: $28.00 in dining
Added: $55.00 in groceries
```

Imprimir `expenses` muestra una lista de cuatro diccionarios, cada uno con las claves `date`, `amount`, `category` y `description`.

**🩹 Si sale mal :** Si la categoría no aparece en minúsculas en la salida, asegúrate de llamar `.lower()` sobre la entrada — esto evita que `"Groceries"` y `"groceries"` se conviertan en categorías separadas. Si la fecha muestra la fecha de hoy aunque entraste una distinta, eso es esperado: la función siempre estampa la fecha actual.

### 2.3 Verifica los datos

**✅ Lista de verificación**

- ✅ Hay cuatro gastos en la lista tras llamar `add_expense` cuatro veces.
- ✅ Cada gasto tiene las cuatro claves: `date`, `amount`, `category`, `description`.
- ✅ La categoría está en minúsculas sin importar cómo la escribiste.
- ✅ El monto está redondeado a dos decimales.

**🤔 Pregunta(s) socrática(s)**

¿Por qué poner la categoría en minúsculas dentro de la función en lugar de exigir que quien llama la escriba en minúsculas? ¿Qué pasaría con tu análisis de `groupby` en el Paso 3 si `"Groceries"` y `"groceries"` contaran como categorías separadas?

---

## Paso 3: Convierte a DataFrame y analiza

Las listas crudas de diccionarios están bien para registrar, pero el análisis real necesita pandas. Convierte la lista en un DataFrame, luego usa `groupby` para calcular totales por categoría y resúmenes mensuales.

### 3.1 Construye el DataFrame

**👟 Pista inicial :** Pasa la lista `expenses` directamente a `pd.DataFrame()`. Imprime el resultado con `to_string(index=False)` para una salida limpia — sin números de fila que ensucien la vista.

```python
df = pd.DataFrame(expenses)
print("All expenses:")
print(df.to_string(index=False))
```

**🎯 Resultado esperado :**

```
All expenses:
       date  amount    category                description
 2026-09-06   42.50   groceries  Weekly farmer's market
 2026-09-06   15.00   transport          Bus pass top-up
 2026-09-06   28.00      dining      Lunch with colleague
 2026-09-06   55.00   groceries          Pantry restock
```

**🩹 Si sale mal :** Si ves un DataFrame vacío con `RangeIndex(start=0, stop=0, step=0)`, la lista `expenses` está vacía — aún no has llamado `add_expense` en esta sesión. Si los nombres de columna se ven mal, verifica que tus diccionarios de gasto usen exactamente `"date"`, `"amount"`, `"category"` y `"description"` como claves.

### 3.2 Calcula totales por categoría

**👟 Pista inicial :** Usa `df.groupby("category")["amount"].sum()` para obtener una Serie donde el índice es el nombre de la categoría y los valores son el gasto total. Imprímela.

```python
category_totals = df.groupby("category")["amount"].sum()
print("\nSpending by category:")
print(category_totals)
```

**🎯 Resultado esperado :**

```
Spending by category:
category
groceries     97.50
dining        28.00
transport     15.00
```

**🩹 Si sale mal :** Si obtienes un `KeyError`, el nombre de la columna no coincide — verifica errores tipográficos como `"cat"` en lugar de `"category"`. Si los totales se ven mal, verifica que pasaste `["amount"]` antes de `.sum()` — sin él, intentarías sumar cada columna numérica, lo que podría incluir datos inesperados.

### 3.3 Agrega resúmenes mensuales

**👟 Pista inicial :** Convierte la columna `date` a datetime con `pd.to_datetime()`, luego extrae el periodo mensual con `.dt.to_period("M")`. Agrupa por eso y suma.

```python
df["date"] = pd.to_datetime(df["date"])
monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum()
print("\nMonthly totals:")
print(monthly)
```

**🎯 Resultado esperado :** Si todos los gastos son de septiembre de 2026, verás una sola fila:

```
Monthly totals:
date
2026-09    140.5
```

**🩹 Si sale mal :** Un `TypeError` en `pd.to_datetime` significa que las cadenas de fecha no están en un formato reconocible — vuelve a `add_expense` y confirma que estás usando `date.today().isoformat()`. Si las fechas de meses distintos no aparecen por separado, tus datos de prueba son todos del mismo mes — agrega un gasto con una fecha distinta para probar.

### 3.4 Verifica el análisis

**✅ Lista de verificación**

- ✅ `df` tiene exactamente cuatro columnas: `date`, `amount`, `category`, `description`.
- ✅ `category_totals` suma lo mismo que sumar todos los montos a mano.
- ✅ Los resúmenes mensuales agrupan los gastos correctamente por año-mes.
- ✅ Las categorías vacías no aparecen en la salida del groupby.

**🤔 Pregunta(s) socrática(s)**

¿Qué te diría `df.groupby("category")["amount"].mean()` que no te dice `.sum()`? ¿Cuándo importaría más el gasto promedio por gasto que el gasto total?

---

## Paso 4: Alertas de presupuesto

El análisis de gasto es interesante, pero un rastreador de presupuestos necesita *advertirte* cuando estás a punto de exceder tu gasto. Verifica cada categoría contra su límite de presupuesto e imprime alertas en un umbral configurable.

### 4.1 Escribe la función `check_budgets`

**👟 Pista inicial :** Define `check_budgets(spending, budgets, threshold=0.8)` que recorra cada categoría en `budgets`, busque cuánto se gastó, calcule el porcentaje e imprima una línea de estado: OK si está bajo el umbral, WARNING si está entre el umbral y 100%, OVER BUDGET si lo excede.

```python
def check_budgets(spending: dict, budgets: dict, threshold: float = 0.8) -> None:
    for category, limit in budgets.items():
        spent = spending.get(category, 0)
        pct = spent / limit if limit else 0
        if pct >= 1.0:
            print(f"  OVER BUDGET: {category} — ${spent:.0f} / ${limit:.0f}")
        elif pct >= threshold:
            print(f"  WARNING: {category} — ${spent:.0f} / ${limit:.0f} ({pct:.0%})")
        else:
            print(f"  OK: {category} — ${spent:.0f} / ${limit:.0f}")
```

### 4.2 Ejecútalo contra tus datos

**👟 Pista inicial :** Convierte `category_totals` a un dict con `.to_dict()` y pásalo a `check_budgets` junto con `budgets`.

```python
print("Budget status:")
check_budgets(category_totals.to_dict(), budgets)
```

**🎯 Resultado esperado :** (con los datos de muestra)

```
Budget status:
  OK: groceries — $97 / $500
  OK: transport — $15 / $200
  OK: dining — $28 / $300
  OK: entertainment — $0 / $150
```

Agrega un gasto más grande para ver la advertencia:

```python
add_expense(450.00, "groceries", "Big grocery run")
check_budgets(
    pd.DataFrame(expenses).groupby("category")["amount"].sum().to_dict(),
    budgets,
)
```

Ahora groceries muestra un WARNING al 90% ($547 / $500). Excede el límite e imprime OVER BUDGET.

**🩹 Si sale mal :** Si todas las categorías muestran `OK` incluso con gasto fuerte, verifica que estás pasando el dict de totales *sumados*, no la lista de gastos cruda. Si obtienes un `ZeroDivisionError`, uno de tus límites de presupuesto es cero — cada categoría en `budgets` necesita un límite positivo.

### 4.3 Prueba el umbral

**✅ Lista de verificación**

- ✅ Una categoría por debajo del 80% de su presupuesto muestra "OK".
- ✅ Una categoría entre el 80% y el 100% muestra "WARNING" con el porcentaje.
- ✅ Una categoría por encima del 100% muestra "OVER BUDGET".
- ✅ Las categorías que no están en el dict de gasto (como `entertainment` con gasto cero) muestran "OK" al 0%.

**🤔 Pregunta(s) socrática(s)**

¿Por qué usar el 80% como umbral de advertencia por defecto? ¿Qué tipos de gastos podrían necesitar un umbral más bajo (digamos 50%) frente a uno más alto (90%)? ¿Cómo dejarías que los usuarios fijaran umbrales por categoría en lugar de uno global único?

---

## Paso 5: Visualiza el gasto

Los números en una tabla son útiles, pero los gráficos hacen obvios los patrones de gasto de inmediato. Construye un gráfico de barras para los totales por categoría y un gráfico de pastel para las proporciones — lado a lado en una sola figura.

### 5.1 Crea los gráficos lado a lado

**👟 Pista inicial :** Importa `matplotlib.pyplot`. Usa `plt.subplots(1, 2, figsize=(12, 5))` para crear dos ejes. Dibuja un gráfico de barras a la izquierda y un gráfico de pastel a la derecha. Guarda la figura con `savefig`.

```python
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Bar chart
colors = ["#2ecc71", "#3498db", "#e74c3c", "#f39c12"]
category_totals.plot(kind="bar", ax=axes[0], color=colors[:len(category_totals)])
axes[0].set_title("Spending by Category")
axes[0].set_ylabel("Amount ($)")
axes[0].tick_params(axis="x", rotation=45)

# Pie chart
category_totals.plot(kind="pie", ax=axes[1], autopct="%1.1f%%", startangle=90)
axes[1].set_title("Spending Distribution")
axes[1].set_ylabel("")

plt.tight_layout()
plt.savefig("spending_report.png", dpi=150)
plt.show()
print("Chart saved to spending_report.png")
```

**🎯 Resultado esperado :** Se abre una ventana (o una imagen en línea en un notebook) que muestra dos gráficos: un gráfico de barras a la izquierda con una barra por categoría, y un gráfico de pastel a la derecha que muestra desgloses porcentuales. Un archivo llamado `spending_report.png` aparece en tu directorio de trabajo.

**🩹 Si sale mal :** Si el gráfico de pastel muestra etiquetas superpuestas, aumenta `figsize` a `(14, 6)` o reduce el tamaño de fuente con `plt.rcParams["font.size"] = 10` antes de dibujar. Si `savefig` guarda una imagen en blanco, asegúrate de que `plt.show()` viene *después* de `savefig` — algunos backends limpian la figura en `show()`. Si obtienes un `IndexError` en `colors[:len(category_totals)]`, tus datos de gasto tienen más categorías que colores — agrega más códigos hex a la lista.

### 5.2 Personaliza la apariencia

**👟 Pista inicial :** Agrega un título a la figura con `fig.suptitle("September 2026 Spending Report", fontsize=14)`. Usa `plt.tight_layout(rect=[0, 0, 1, 0.95])` para hacer espacio para el título.

```python
fig.suptitle("September 2026 Spending Report", fontsize=14, fontweight="bold")
plt.tight_layout(rect=[0, 0, 1, 0.95])
plt.savefig("spending_report.png", dpi=150, bbox_inches="tight")
plt.show()
```

### 5.3 Verifica los gráficos

**✅ Lista de verificación**

- ✅ El gráfico de barras tiene una barra por categoría con etiquetas en el eje x.
- ✅ El gráfico de pastel muestra etiquetas de porcentaje (ej., "69.4%") en cada rebanada.
- ✅ Se guarda un archivo PNG en disco y no está vacío.
- ✅ Los gráficos son legibles — sin texto superpuesto ni etiquetas recortadas.

**🤔 Pregunta(s) socrática(s)**

¿Cuándo sería más útil un gráfico de barras que uno de pastel, y viceversa? ¿Qué pasa con el gráfico de pastel si una categoría domina al 95% del gasto — puedes aún leer las rebanadas más pequeñas?

---

## Paso 6: Guarda y carga datos

Tus gastos desaparecen cuando el programa termina. Arrégialo escribiendo a un archivo CSV en disco y cargándolo de vuelta al arrancar.

### 6.1 Guarda los gastos a CSV

**👟 Pista inicial :** Escribe `save_expenses(df, filename)` que llame a `df.to_csv(filename, index=False)`. Usar `index=False` evita que pandas escriba números de fila que ensuciarían el archivo.

```python
def save_expenses(df: pd.DataFrame, filename: str = "expenses.csv") -> None:
    df.to_csv(filename, index=False)
    print(f"Saved {len(df)} expenses to {filename}")
```

**🎯 Resultado esperado :** Llamar a `save_expenses(df)` escribe `expenses.csv` e imprime `Saved 4 expenses to expenses.csv`. El archivo CSV tiene una fila de encabezado seguida de una fila por gasto.

### 6.2 Carga los gastos desde CSV

**👟 Pista inicial :** Escribe `load_expenses(filename)` que verifique primero si el archivo existe. Si existe, léelo con `pd.read_csv` y parsea la columna de fecha. Si no, devuelve un DataFrame vacío con las columnas correctas.

```python
from pathlib import Path

def load_expenses(filename: str = "expenses.csv") -> pd.DataFrame:
    path = Path(filename)
    if not path.exists():
        print(f"No existing data found — starting fresh.")
        return pd.DataFrame(columns=["date", "amount", "category", "description"])
    df = pd.read_csv(filename, parse_dates=["date"])
    print(f"Loaded {len(df)} expenses from {filename}")
    return df
```

**🎯 Resultado esperado :** En la primera ejecución (sin CSV aún): `No existing data found — starting fresh.` En ejecuciones posteriores: `Loaded 4 expenses from expenses.csv`.

**🩹 Si sale mal :** Si obtienes un `ParserError` en `pd.read_csv`, el CSV tiene filas malformadas — ábrelo en un editor de texto para revisar comas sueltas o comillas rotas. Si las fechas aparecen como cadenas en lugar de objetos datetime, asegúrate de incluir `parse_dates=["date"]`. Si el archivo existe pero `load_expenses` devuelve un DataFrame vacío, la ruta del archivo está mal — ejecuta tu script desde el mismo directorio donde guardaste el CSV.

### 6.3 Verifica la persistencia

**✅ Lista de verificación**

- ✅ Tras guardar, `expenses.csv` existe y contiene la fila de encabezado más las filas de datos.
- ✅ Tras cargar, el DataFrame tiene los mismos datos que guardaste.
- ✅ Que falte el archivo CSV no tumba el programa — arranca desde cero con elegancia.
- ✅ Las fechas se parsean como objetos datetime tras cargar, no como cadenas simples.

---

## Paso 7: Pule la CLI

Reúne todo en un sistema de menú interactivo. El usuario elige acciones de una lista numerada, la entrada se valida antes de procesarse, y la experiencia se siente pulida.

### 7.1 Construye el bucle del menú

**👟 Pista inicial :** Escribe una función `main()` que cargue los datos guardados al arrancar, luego repite: imprime un menú, lee la elección del usuario, despacha a la función correcta y guarda después de cada cambio. Usa un bucle `while True` que rompe con la opción de "salir".

```python
def show_menu() -> None:
    print("\n=== Expense Tracker ===")
    print("1. Add expense")
    print("2. View all expenses")
    print("3. Spending by category")
    print("4. Monthly summary")
    print("5. Budget status")
    print("6. Generate chart")
    print("7. Quit")

def view_expenses(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses recorded yet.")
        return
    print(df.to_string(index=False))

def show_category_summary(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses to summarize.")
        return
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    print("\nSpending by category:")
    for cat, amt in totals.items():
        print(f"  {cat:15s} ${amt:>8.2f}")

def show_monthly_summary(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses to summarize.")
        return
    monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum()
    print("\nMonthly totals:")
    for period, amt in monthly.items():
        print(f"  {period}  ${amt:.2f}")
```

### 7.2 Conecta la validación de entrada

**👟 Pista inicial :** Cuando el usuario agrega un gasto, valida que el monto sea un número positivo y que la categoría no esté vacía. Vuelve a pedir en entrada mala en lugar de estrellarte.

```python
def get_valid_amount() -> float:
    while True:
        try:
            amt = float(input("Amount: $"))
            if amt <= 0:
                print("  Amount must be positive.")
                continue
            return round(amt, 2)
        except ValueError:
            print("  Please enter a valid number.")

def get_valid_category() -> str:
    while True:
        cat = input("Category: ").strip().lower()
        if cat:
            return cat
        print("  Category cannot be empty.")
```

### 7.3 Arma el `main()` completo

**👟 Pista inicial :** Carga los datos en un `df` global al arrancar. Tras cada acción que modifique datos, recalcula `df` y guárdalo. El menú repite hasta que el usuario elija salir.

```python
def main() -> None:
    global expenses, df
    df = load_expenses()
    expenses = df.to_dict("records")

    while True:
        show_menu()
        choice = input("Choose (1-7): ").strip()

        if choice == "1":
            amt = get_valid_amount()
            cat = get_valid_category()
            desc = input("Description: ").strip()
            add_expense(amt, cat, desc)
            expenses = df.to_dict("records")
            expenses.append({
                "date": date.today().isoformat(),
                "amount": amt,
                "category": cat,
                "description": desc,
            })
            df = pd.DataFrame(expenses)
            df["date"] = pd.to_datetime(df["date"])
            save_expenses(df)
        elif choice == "2":
            view_expenses(df)
        elif choice == "3":
            show_category_summary(df)
        elif choice == "4":
            show_monthly_summary(df)
        elif choice == "5":
            print("\nBudget status:")
            check_budgets(
                df.groupby("category")["amount"].sum().to_dict(),
                budgets,
            )
        elif choice == "6":
            if df.empty:
                print("No data to chart yet.")
            else:
                category_totals = df.groupby("category")["amount"].sum()
                fig, axes = plt.subplots(1, 2, figsize=(12, 5))
                colors = ["#2ecc71", "#3498db", "#e74c3c", "#f39c12", "#9b59b6"]
                category_totals.plot(kind="bar", ax=axes[0], color=colors[:len(category_totals)])
                axes[0].set_title("Spending by Category")
                axes[0].set_ylabel("Amount ($)")
                axes[0].tick_params(axis="x", rotation=45)
                category_totals.plot(kind="pie", ax=axes[1], autopct="%1.1f%%", startangle=90)
                axes[1].set_title("Spending Distribution")
                axes[1].set_ylabel("")
                plt.tight_layout()
                plt.savefig("spending_report.png", dpi=150)
                plt.show()
                print("Chart saved to spending_report.png")
        elif choice == "7":
            print("Goodbye!")
            break
        else:
            print("Invalid choice — pick 1 through 7.")

if __name__ == "__main__":
    main()
```

**🎯 Resultado esperado :** El programa imprime un menú numerado, acepta tu elección, ejecuta la acción y vuelve al menú. Agregar un gasto actualiza el CSV de inmediato. La entrada inválida (letras donde se espera un número, categoría vacía) imprime un error y vuelve a pedir.

**🩹 Si sale mal :** Si obtienes `UnboundLocalError`, falta la declaración `global df` o `df` no está inicializado antes del bucle del menú. Si guardar produce un CSV vacío, asegúrate de que `save_expenses(df)` se llama *después* de anexar a la lista y reconstruir el DataFrame, no antes.

### 7.4 Ejecuta el programa completo

**✅ Lista de verificación**

- ✅ El menú se imprime al arrancar y reaparece tras cada acción.
- ✅ Agregar un gasto actualiza `expenses.csv` de inmediato.
- ✅ Los montos no numéricos y las categorías vacías se rechazan con un mensaje claro.
- ✅ Salir del programa y reiniciarlo carga los gastos de la sesión anterior.
- ✅ Las siete opciones del menú funcionan sin errores.

---

## ⚠️ Errores comunes

- **Olvidar guardar tras los cambios.** Si modificas `expenses` o `df` pero no llamas `save_expenses`, el CSV queda obsoleto. Guarda siempre justo después de una operación que cambie datos — no solo al salir del programa — de modo que un crash o un Ctrl+C solo pierda la acción actual.
- **Confusión entre cadena de fecha y datetime.** Cargar desde CSV sin `parse_dates=["date"]` te da cadenas como `"2026-09-06"` en lugar de objetos datetime. La llamada `.dt.to_period("M")` en el resumen mensual se estrellará con un `TypeError` sobre cadenas.
- **Mayúsculas inconsistentes en la categoría.** Si `"Groceries"` y `"groceries"` aparecen ambas en los datos, `groupby` las trata como categorías separadas. Pon siempre la categoría en minúsculas dentro de `add_expense`, no en el sitio de llamada.
- **Gráfico de pastel con demasiadas categorías.** Con 10+ categorías, el gráfico de pastel se vuelve ilegible. Considera filtrar a las 5 principales y agrupar el resto en "other" para el pastel, mientras mantienes el gráfico de barras completo.
- **Sobrescribir el CSV al cargar.** `load_expenses` debe *leer* el archivo, no escribir en él. Un desliz común es importar la función equivocada o llamar `save` dentro de `load`.

## Lo que acabas de construir

Un rastreador de gastos de línea de comandos funcional que registra gasto, lo analiza con pandas, monitorea presupuestos con alertas de umbral, genera gráficos con matplotlib y persiste todo a un archivo CSV. Modelaste datos financieros con diccionarios Python simples, los convertiste a DataFrames para análisis, construiste pipelines de agregación con `groupby`, implementaste lógica de alertas basada en umbrales y creaste gráficos de calidad de publicación — todas habilidades prácticas que se transfieren directamente al trabajo real de análisis financiero.

## A dónde ir desde aquí

- **Proyecciones de gastos recurrentes.** Agrega un campo `recurring` (semanal, mensual, ninguno) a cada gasto y proyecta el gasto total de los próximos 3 meses basándote en las entradas recurrentes.
- **Recomendaciones de categoría.** Cuando el usuario escriba una descripción, escanea los gastos registrados previamente y sugiere la categoría más común para descripciones similares usando coincidencia simple de cadenas.
- **Rastreador de metas de ahorro.** Agrega una meta de ahorro mensual (ej., $1000). Tras registrar cada gasto, imprime cuánto más se puede gastar mientras se sigue cumpliendo la meta.
- **Importación de extractos bancarios.** Lee exportaciones CSV de tu banco y auto-categoriza las transacciones según patrones de descripción.
- **GUI con tkinter.** Envuelve la misma lógica en una GUI de escritorio con campos de entrada, botones y un lienzo de gráfico integrado.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓