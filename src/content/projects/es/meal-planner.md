---
title: "Planificador de Comidas"
description: "Planifica una semana de comidas desde una base de datos de recetas, suma las calorías y macros diarias por comida y genera una lista de compras combinada automáticamente."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "data-structures", "csv"]
learningObjectives:
  - "Modelar una base de datos de recetas como una lista de diccionarios"
  - "Construir un plan de comidas semanal asignando una receta por día"
  - "Sumar la nutrición por receta en totales diarios con acumuladores rodantes"
  - "Derivar una lista de compras consolidada fusionando ingredientes repetidos"
prerequisites: ["python-101/data-structures", "python-101/reading-files", "python-101/dicts-and-sets"]
---

# 🍽️ Construye un Planificador de Comidas

La planificación de comidas parece simple en papel — decidir siete cenas, escribir una lista de compras — pero la aritmética es exactamente donde se desmorona: tres recetas comparten arroz, dos comparten pollo, y la columna de calorías se queda silenciosamente sin revisar. Este proyecto construye un CLI que hace la contabilidad: una base de datos de recetas, un plan de comidas de una semana, totales diarios de calorías y macros, y una lista de compras que fusiona los ingredientes compartidos en un resumen consolidado en lugar de siete listas superpuestas.

Esto asume Python 101 — listas, dicts, leer archivos y funciones. Nada más allá de eso: sin base de datos, sin web, sin servicios externos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Guardar una pequeña base de datos de recetas para que cada receta tenga su nombre de plato, porciones, ingredientes y nutrición.
2. Planear una semana asignando una receta por día e imprimiendo el plan.
3. Calcular el total diario de calorías y macros a partir de las recetas que elegiste.
4. Generar una lista de compras consolidada que fusione los ingredientes compartidos en lugar de repetirlos.
5. Cargar la base de datos desde un CSV para que puedas hacerla crecer sin editar código.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal aquí y el único con una recompensa real de sistema de archivos: la base de datos de recetas vive de verdad en disco (CSV), y "añade un archivo de receta, vuelve a ejecutar, nueva lista de compras" es un bucle genuino. Los pasos de abajo asumen una carpeta pequeña con `uv`.

**GitHub Codespaces** funciona de forma idéntica: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y Node, Python y `uv` ya están instalados en un clon real del repositorio del curso.

**Google Colab, Kaggle Notebooks y Binder pueden *ejecutar* cada función, y para un proyecto de solo datos como este son genuinamente adecuados** — no hay secretos, ni GPU, ni archivos gigantes. Lo único que no se transfiere es que "los archivos de tu sesión son efímeros", lo que importa sobre todo si quisieras que tu CSV de recetas personal sobreviviera. El notebook de abajo agrupa una base de datos inicial para que toda la canalización plan → totales → compras se ejecute de principio a fin con cero configuración. Pruébalo ahí primero, luego pasa a local cuando tengas recetas propias.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meal-planner/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meal-planner/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeal-planner%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de planear una sola comida: `uv` y una pequeña base de datos de recetas que puedas ampliar.

### Instala `uv` y prepara el andamiaje

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego:

```bash
uv --version
mkdir meal-planner && cd meal-planner
uv init --bare
```

Sin paquetes extra — este proyecto es pura biblioteca estándar.

### Crea la base de datos de recetas

Pega esto en `recipes.py` como una base de datos inicial (cuatro recetas, cada una con calorías totales y macros por porción, más una lista de ingredientes con un elemento compartido para hacer visible la fusión del Paso 4):

```python
# recipes.py
RECIPES = [
    {"name": "Chicken stir-fry", "servings": 2, "calories": 480, "protein": 38,
     "ingredients": ["chicken breast", "rice", "broccoli", "soy sauce"]},
    {"name": "Veggie curry", "servings": 4, "calories": 410, "protein": 16,
     "ingredients": ["chickpeas", "rice", "coconut milk", "curry powder"]},
    {"name": "Tacos", "servings": 4, "calories": 520, "protein": 24,
     "ingredients": ["ground beef", "tortillas", "lettuce", "salsa"]},
    {"name": "Tofu bowl", "servings": 2, "calories": 450, "protein": 30,
     "ingredients": ["tofu", "rice", "broccoli", "soy sauce"]},
]
```

Ejecuta:

```bash
uv run python -c "from recipes import RECIPES; print(len(RECIPES), 'recipes loaded')"
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `recipes.py` existe y `uv run python -c "from recipes import RECIPES; print(len(RECIPES))"` imprime `4`.
- ✅ Nota que `rice`, `broccoli` y `soy sauce` aparecen en *más de una* receta — esos son los ingredientes que el Paso 4 debe fusionar.

## Paso 1: Carga e inspecciona la base de datos de recetas

"Data" aquí significa una lista de dicts, cada dict una receta. Antes de planear cualquier cosa, quieres una función que *muestre* la base de datos — porque cada paso posterior (totales, fusión) estará mal si dos recetas discrepan silenciosamente en los campos de la otra.

### 1.1 Consulta la base de datos por nombre

```python
# planner.py
from recipes import RECIPES

def find_recipe(name: str) -> dict:
    matches = [r for r in RECIPES if r["name"].lower() == name.lower()]
    if not matches:
        raise ValueError(f"No recipe named {name!r}")
    return matches[0]

def list_recipes() -> None:
    for r in RECIPES:
        print(f"{r['name']:<18} {r['calories']:>4} kcal  {r['protein']:>3} g protein")

if __name__ == "__main__":
    list_recipes()
    print()
    print(find_recipe("tacos"))
```

`find_recipe` baja ambos lados antes de comparar, así que `find_recipe("TACOS")` y `find_recipe("tacos")` golpean el mismo dict — un hábito de robustez pequeño pero real. La búsqueda es una comprensión de lista porque cuatro recetas no necesitan un índice de dict; si la base de datos creciera a miles, el arreglo sería un dict con clave por nombre, no una comprensión más rápida.

**👟 Pista inicial :** Ejecuta `planner.py` para listar las cuatro recetas, luego llama a `find_recipe("tacos")` e inspecciona el dict que regresa campo por campo.

**🎯 Resultado esperado :** Las cuatro recetas impresas como una tabla ordenada (nombre + calorías + proteína), luego un dict llamado `Tacos` con las seis llaves — incluido `ingredients` como una lista.

**🩹 Si sale mal :** Si `ImportError: cannot import name 'RECIPES'`, el archivo es `recipes.py` pero el nombre del módulo es `recipes` — revisa que no lo llamaste `recipe.py`. Si `find_recipe("tacos")` lanza aunque Tacos existe, el `.lower()` en ambos lados está comparando los valores correctos — añade un print para confirmar los nombres antes de "arreglar" la versión que funciona borrando el bug de minúsculas.

### 1.2 Verifica la búsqueda

**✅ Lista de verificación**

- ✅ `list_recipes()` imprime las cuatro recetas con calorías y proteína.
- ✅ `find_recipe` lanza un `ValueError` claro para un nombre que no existe, y devuelve el dict correcto sin importar las mayúsculas.
- ✅ Cada dict de receta tiene las mismas llaves — puedes escribir una verificación de una línea de que las cuatro comparten un conjunto de llaves idéntico.

**🤔 Pregunta(s) socrática(s)**

- `find_recipe` devuelve una referencia al *dict real* en `RECIPES`, no una copia. Si algún código posterior mutara lo que devolvió, ¿qué se corrompe silenciosamente — y hay un argumento para devolver una copia?
- Cuatro recetas justifican un escaneo lineal. ¿A qué tamaño de base de datos "renombra el dict con clave por nombre" deja de ser opcional — y qué te dice eso sobre cuándo recurrir a un cambio de estructura versus cuándo la fuerza bruta es honestamente suficiente?

## Paso 2: Construye el plan semanal

El plan es el modelo más simple posible de una semana: un diccionario que mapea cada día a un nombre de receta. Todo lo posterior — totales, lista de compras — toma este plan como su *único* input. Mantener los datos del plan separados de las funciones de totales es lo que hace que cada paso sea testeable independientemente.

### 2.1 Asigna una receta a cada día

```python
# planner.py (continued)

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

def build_plan(assignments: dict[str, str]) -> dict[str, dict]:
    plan = {}
    for day, name in assignments.items():
        if day not in DAYS:
            raise ValueError(f"{day!r} is not a day of the week")
        plan[day] = find_recipe(name)
    return plan

if __name__ == "__main__":
    week = build_plan(
        {"Mon": "Chicken stir-fry", "Tue": "Tacos", "Wed": "Veggie curry",
         "Thu": "Tofu bowl", "Fri": "Chicken stir-fry", "Sat": "Tacos", "Sun": "Veggie curry"}
    )
    for day, recipe in week.items():
        print(f"{day}: {recipe['name']}")
```

`build_plan` valida dos cosas antes de guardar: el día es uno de los siete nombres conocidos (un error tipográfico como `"monday"` se atrapa ruidosamente), y cada receta se resuelve a través de `find_recipe` (así que un plan que referencia una receta eliminada falla en *tiempo de planeación*, no en el tiempo de totales tres pasos después). Mapear día → dict de receta completo, en lugar de día → cadena, es la decisión que le permite al Paso 3 leer la nutrición del plan sin una segunda búsqueda.

**👟 Pista inicial :** Mantén el plan en un `dict[str, str]` simple por un minuto *antes* de cambiar a `dict[str, dict]` — ejecuta el bucle, luego haz el cambio y vuelve a ejecutar; siente la diferencia en lo que el Paso 3 podrá acceder.

**🎯 Resultado esperado :** Siete líneas, `Mon: Chicken stir-fry` hasta `Sun: Veggie curry`, en orden de día, sin `KeyError` y con todos los nombres coincidiendo con la base de datos.

**🩹 Si sale mal :** Si `ValueError: 'monday' is not a day of the week`, tus llaves no son las cadenas exactas de `DAYS` — la verificación es deliberadamente estricta, así que o arreglas la llave o (mejor) dejas que la verificación siga protegiéndote. Si `find_recipe` lanza `No recipe named 'Taco'`, tu plan referencia un nombre que la base de datos no tiene — el fallo en tiempo de planeación es el arreglo, no el bug.

### 2.2 Verifica el plan

**✅ Lista de verificación**

- ✅ `build_plan` devuelve un dict con exactamente siete llaves, una por día, cada valor un dict de receta completo.
- ✅ Un nombre de día desconocido lanza un `ValueError` en lugar de crear silenciosamente un día fantasma.
- ✅ El mismo nombre de receta puede aparecer en varios días — el plan no requiere siete platos distintos.
- ✅ Editar el plan para referenciar una receta faltante falla *en tiempo de build*, no en tiempo de totales.

**🤔 Pregunta(s) socrática(s)**

- El plan guarda dicts de receta completos, así que el plan y `RECIPES` pueden separarse: si editas las calorías de una receta, los planes *viejos* construidos antes de la edición aún guardan el dict viejo — y los planes nuevos obtienen el nuevo. ¿Es eso una característica o un bug para un planificador de comidas, y qué comportamiento querrías si las recetas cambiaran semanalmente?
- Elegimos nombres de días como llaves del plan. ¿Qué se rompe si alguien quiere un plan solo para días de semana — y cómo cambiaría `build_plan` para aceptar "cualquier iterable de (slot, receta)"?

## Paso 3: Totaliza la nutrición del día

Las calorías y macros de cada receta son *por porción*; un plan es *comidas*, y una comida suele ser "toda la receta" o un número declarado de porciones. Este paso es donde la planificación de comidas se vuelve útil: no "elegí buenas recetas" sino "mi semana da 2,180 kcal al día".

### 3.1 Suma la nutrición por comida a lo largo de un día

```python
# planner.py (continued)

def day_totals(recipes: list[dict]) -> dict:
    total = {"calories": 0, "protein": 0, "meals": 0}
    for r in recipes:
        total["calories"] += r["calories"]
        total["protein"] += r["protein"]
        total["meals"] += 1
    return total

def week_totals(plan: dict[str, dict]) -> dict:
    return {day: day_totals([r]) for day, r in plan.items()}

if __name__ == "__main__":
    week = build_plan(
        {"Mon": "Chicken stir-fry", "Tue": "Tacos", "Wed": "Veggie curry",
         "Thu": "Tofu bowl", "Fri": "Chicken stir-fry", "Sat": "Tacos", "Sun": "Veggie curry"}
    )
    totals = week_totals(week)
    for day, t in totals.items():
        print(f"{day}: {t['calories']:>4} kcal, {t['protein']:>2} g protein")
    daily_mean = sum(t["calories"] for t in totals.values()) / len(totals)
    print(f"daily mean: {daily_mean:.0f} kcal")
```

El acumulador es un dict simple al que sumas — el patrón de "total rodante", explicitado para que la forma sea visible (la primera vez que lo escribes, *ves* que `+=` en una entrada de dict es legal, y que debes inicializar la llave a `0` primero). `week_totals` es solo `day_totals` aplicado a una lista de una receta por día — encajar `[r]` es una forma ligeramente incómoda pero honesta de decir "este día usa exactamente una receta", y significa que `day_totals` puede aceptar luego varias recetas (un almuerzo real *y* una cena) sin cambios.

**👟 Pista inicial :** Añade `day_totals(["a", "b"])` con dos dicts de receta *antes* de construir tu semana — confirma que la función los suma correctamente por sí sola, luego conéctala en `week_totals`.

**🎯 Resultado esperado :** Siete líneas de totales al estilo `Mon: 480 kcal, 38 g protein`, luego una línea `daily mean: ... kcal` — con nuestro plan, exactamente `(480+520+410+450+480+520+410)/7 = 467 kcal` como media.

**🩹 Si sale mal :** Si las calorías suman silenciosamente a cero, el `+=` está escribiendo en una llave que nunca se inicializó — cada llave debe aparecer primero como `total = {"calories": 0, ...}` antes del bucle. Si la media diaria imprime con `.6666` final, ese es el comportamiento correcto de float — convierte a int o redondea explícitamente cuando quieras mostrar `467`.

### 3.2 Verifica los totales

**✅ Lista de verificación**

- ✅ `day_totals` sobre dos dicts de receta devuelve la suma aritmética de ambas recetas — compruébalo a mano con dos dicts diminutos inventados.
- ✅ `week_totals` cubre cada día del plan, ni más ni menos.
- ✅ La media diaria coincide con tu promedio calculado a mano de los siete valores diarios.
- ✅ Ejecutar `day_totals([])` devuelve el acumulador todo-ceros, no un error.

**🤔 Pregunta(s) socrática(s)**

- La nutrición por porción se trata como "nutrientes por plato entero". Si una receta tiene `servings: 4` y solo comes un cuarto, ¿qué sobrereporta nuestra herramienta por un factor de 4 — y cuál es la única multiplicación que lo arregla?
- `day_totals` toma una *lista* de recetas. ¿Qué cambio al modelo de datos del plan dejaría que un día contuviera desayuno, almuerzo y cena, y cuál es la reescritura mínima de `week_totals` que lo soporta?

## Paso 4: Fusióna los ingredientes en una sola lista de compras

Planear y totalizar son contabilidad; la lista de compras es la recompensa. Una lista ingenua "el salteado de pollo necesita arroz, los tacos necesitan arroz, el curry necesita arroz" te entrega tres bolsas de arroz. Fusionar los ingredientes compartidos por nombre — sumando cuántas recetas los necesitan — convierte eso en una entrada honesta.

### 4.1 Cuenta las menciones de ingredientes a lo largo de la semana

```python
# planner.py (continued)

def grocery_list(week: dict[str, dict]) -> dict[str, int]:
    needed = {}
    for recipe in week.values():
        for ingredient in recipe["ingredients"]:
            needed[ingredient] = needed.get(ingredient, 0) + 1
    return dict(sorted(needed.items()))

if __name__ == "__main__":
    week = build_plan(
        {"Mon": "Chicken stir-fry", "Tue": "Tacos", "Wed": "Veggie curry",
         "Thu": "Tofu bowl", "Fri": "Chicken stir-fry", "Sat": "Tacos", "Sun": "Veggie curry"}
    )
    for ingredient, count in grocery_list(week).items():
        print(f"{ingredient:<14} x{count}")
```

`needed.get(ingredient, 0) + 1` es el modismo estándar de "contar ocurrencias con un dict" — el `.get(key, 0)` devuelve el total acumulado hasta ahora, con valor por defecto 0 a la primera vista, y luego se suma uno. Nota que `rice` ahora debería mostrar `x3` (salteado, curry, bowl de tofu): la fusión es toda la característica, y una pasada final ordenada hace la lista escaneable sin importar el orden del plan.

**👟 Pista inicial :** Ejecuta la fusión, luego *cuenta a mano* `rice` a lo largo del plan y confirma que tu conteo manual coincide con el `x3` que imprimió la función — ese punto muerto es tu momento "funciona".

**🎯 Resultado esperado :** Una lista ordenada donde `rice x3`, `broccoli x2` y `soy sauce x2` aparecen una vez cada uno — no repetidos por receta — y los elementos de un solo uso como `tortillas x1` siguen ahí.

**🩹 Si sale mal :** Si `rice x1` aparece tres veces porque un dict no puede tener llaves duplicadas, estás añadiendo a una *lista* en lugar de contar en un *dict* — la fusión *es* el dict. Si el conteo está mal pero las llaves son únicas, revisa que el `+1` esté dentro de la asignación `needed[ingredient] = ...` y que el default `.get(..., 0)` esté escrito `0`, no `None` (que chocaría con `None + 1`).

### 4.2 Verifica la fusión

**✅ Lista de verificación**

- ✅ Los ingredientes compartidos (`rice`, `broccoli`, `soy sauce`) aparecen exactamente una vez, con conteos que coinciden con tu conteo manual del plan.
- ✅ Cada ingrediente usado por cualquier receta aparece en la lista final — nada se descarta.
- ✅ La salida está ordenada alfabéticamente sin importar el orden en que las recetas aparecen en el plan.

**🤔 Pregunta(s) socrática(s)**

- Esta fusión cuenta *cuántas recetas* necesitan arroz, no *cuánto arroz* debería tener un supermercado en stock (eso depende de las porciones y de cuánto come cada persona). ¿Qué necesitaría una función `grocery_stock(week, portion_per_person)`, por ingrediente, que el dict actual de `name -> count` no puede responder — y qué forma necesitarían los datos?
- Dos ingredientes son el *mismo artículo de supermercado* con nombres distintos ("chicken breast" vs "chicken thighs") y la fusión felizmente los trata por separado. ¿Debería la herramienta fusionarlos? ¿Cuál es el cambio de datos más simple (pista: un nombre canónico por ingrediente) que se lo permite — y qué problema introduce eso en otro lugar?

## Paso 5: Carga las recetas desde CSV

Cuatro recetas codificadas en `recipes.py` estuvo bien para aprender; un planificador real crece. El Paso 5 cambia el literal `RECIPES` por un CSV en disco — la misma habilidad que "leer un CSV", pero aplicada para hacer de la base de datos un *archivo que puedes editar sin tocar código*.

### 5.1 Lee la base de datos desde CSV

Crea `recipes.csv`:

```csv
name,servings,calories,protein,ingredients
Chicken stir-fry,2,480,38,"chicken breast, rice, broccoli, soy sauce"
Veggie curry,4,410,16,"chickpeas, rice, coconut milk, curry powder"
Tacos,4,520,24,"ground beef, tortillas, lettuce, salsa"
Tofu bowl,2,450,30,"tofu, rice, broccoli, soy sauce"
```

```python
# csv_loader.py
import csv
from recipes_data import RECIPES  # same dict structure, now built by load_recipes_csv

def load_recipes_csv(path: str) -> list[dict]:
    recipes = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            recipes.append({
                "name": row["name"],
                "servings": int(row["servings"]),
                "calories": int(row["calories"]),
                "protein": int(row["protein"]),
                "ingredients": [i.strip() for i in row["ingredients"].split(",")],
            })
    return recipes
```

Dos conversiones hacen que esta celda sea diferente de "solo leer un archivo": las columnas numéricas se convierten con `int(...)` (el lector CSV devuelve *cadenas* por diseño — olvidar esto produce `'480'` en lugar de `480` y un error silencioso en la aritmética del Paso 3), y la *cadena* única de ingredientes se convierte en una lista dividiendo por comas y recortando espacios. El dict de receta ahora tiene exactamente la forma que los pasos anteriores esperan — el cargador es un reemplazo directo del `RECIPES` codificado, que es todo el punto de mantener un esquema estable.

**👟 Pista inicial :** Escribe el CSV, ejecuta `load_recipes_csv`, luego *reemplaza* `from recipes import RECIPES` en `planner.py` con `import csv_loader as recipes` y vuelve a ejecutar `list_recipes` — salida idéntica, nueva fuente de verdad.

**🎯 Resultado esperado :** `load_recipes_csv("recipes.csv")` devuelve cuatro dicts idénticos a los codificados, y el `list_recipes()` de `planner.py` imprime la misma tabla de antes — ahora provista desde el archivo.

**🩹 Si sale mal :** Si los totales imprimen como `480 38` pero el escáner muestra cadenas, se saltaron las conversiones `int(...)` — cada columna numérica las necesita. Si los ingredientes salen como una sola cadena larga, no se aplicó `split(",")` o tus filas CSV no están entrecomillando la columna de ingredientes (las comas sin entrecomillar dividen la *fila*, así que `csv` rompe la fila en cada coma). Si `KeyError: 'name'`, tu fila de encabezado tiene un primer nombre de columna diferente al que `row["name"]` espera — imprime `row` de `DictReader` para ver las llaves reales.

### 5.2 Verifica el cargador CSV

**✅ Lista de verificación**

- ✅ `load_recipes_csv` devuelve recetas cuyos campos numéricos son `int`, no `str`.
- ✅ El `ingredients` de cada dict es una lista real, sin espacios iniciales/finales sueltos.
- ✅ Borrar una fila CSV elimina esa receta del `list_recipes()` en la *siguiente* ejecución — una edición de archivo, no de código.
- ✅ Añadir una nueva fila con las mismas cinco columnas carga sin tocar ningún Python.

**🤔 Pregunta(s) socrática(s)**

- CSV te da una base de datos que puedes editar a mano. ¿Qué es lo que *no* te da que una base de datos real (o incluso un archivo JSON) daría — piensa en entrecomillado, escapes y qué pasa cuando un ingrediente en sí mismo contiene una coma?
- `csv.DictReader` usó la fila de encabezado para las llaves. Si el encabezado cambiara a `dish` en lugar de `name`, cada `row["name"]` se rompe. ¿Esa resistencia es buena (honestidad de esquema) o mala (acoplamiento frágil)? ¿Qué haría que el cargador fallara *ruidosamente* en lugar de fallar *mal*?

## ⚠️ Errores comunes

- **Olvidar las conversiones `int()` del CSV.** `csv` devuelve cadenas; `calories: "480"` sumado contra `protein: "38"` podría ni siquiera lanzar — puede concatenar o hacer silenciosamente aritmética de cadenas — mientras que un `"480" * 4` posterior vive en un mundo donde todo es texto. Siempre convierte los campos numéricos en el momento de carga, en un solo lugar, y confía en todo lo río abajo.
- **Tratar el dict de receta como su propia autoridad.** Que `find_recipe` devuelva una referencia viva significa que una mutación accidental corrompe toda la base de datos para cada paso posterior. O devuelve copias o — más estricto — haz las recetas de solo lectura tipo `MappingProxyType` y diseña para que el plan nunca necesite escribir.
- **Un elemento por receta en la lista de compras.** La característica de "fusionar por nombre de ingrediente" es exactamente lo que separa a un planificador de una nota adhesiva; un plan que produce tres líneas de `rice` no ha terminado. Si tu salida de fusión muestra duplicados, estás contando en una lista, no en un dict (mira el arreglo del Paso 4).
- **Matemática por porción ignorada.** Una receta es `servings: 4`; el plan trata las comidas como recetas enteras. Decisiones como "comer medio curry" necesitan un conteo de porciones explícito por entrada del plan — construye el slot en el modelo del plan *antes* de necesitarlo, o acepta los totales de plato entero como el default documentado.
- **Deriva del nombre del ingrediente.** `"rice"` en cuatro recetas es un placer de fusionar; `"rice "`, `"Rice"` y `"basmati rice"` son tres elementos separados. El arreglo real es una lista canónica de ingredientes que cada receta referencia (una llave foránea, incluso en un CSV), y un paso de normalización en el momento de carga (recortar + minúsculas) como la versión barata.

## Lo que acabas de construir

Un planificador de comidas que funciona: una base de datos de cuatro recetas, un plan de siete días, totales diarios de calorías y proteína, y una lista de compras fusionada donde `rice x3` significa *una* línea de compra honesta. La habilidad transferible es toda la canalización "plan → deriva → reporta": mantienes una pequeña fuente de verdad (recetas), tomas una decisión (la semana) y calculas cada salida (totales, lista de compras) a partir de esos dos — nada obsoleto, nada mantenido a mano. Esa misma forma mueve la preparación de comidas, los presupuestos, las plantillas y prácticamente cualquier tarea de "entradas repetibles, informe derivado" que encontrarás.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/meal-planner/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meal-planner) en el repositorio del curso agrupa las bases de datos y un notebook que ejecuta build → totales → lista de compras celda por celda. Clónalo, o abre el repositorio completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecuta la canalización en una pestaña del navegador.
:::

## A dónde ir desde aquí

- Añade conciencia de porciones: una entrada de plan como `("Veggie curry", 2)` que escale los ingredientes y reduzca o duplique la nutrición — la única multiplicación del Paso 3.3 hecha real.
- Rastrea el costo de compras: dale a cada ingrediente un precio por unidad, e imprime un total para la semana — una segunda derivación colgando de los mismos datos.
- Añade una característica de semana aleatoria: `plan --random` elige siete recetas (sin repetición, o deliberadamente homogenizado por día de semana) e imprime el plan derivado al instante.
- Lleva la base de datos a JSON en lugar de CSV — `json.load` mantiene los números tipados gratis y maneja los ingredientes con comas sin dolores de entrecomillado, y es un cambio de cinco minutos ahora que el cargador ya tiene un esquema estable.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso — un plan semanal, una lista de compras, una base de datos de recetas de la que realmente cocinas? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README te guía para añadir el tuyo mediante una **pull request** de principio a fin: fork, rama, commit y apertura de la PR. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓