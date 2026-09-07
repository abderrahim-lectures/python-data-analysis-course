---
title: "Analizador y Visualizador de Logs"
description: "Domina un log de aplicación desordenado: parsea líneas en registros estructurados, filtra por severidad, cuenta patrones con regex y renderiza una gráfica de línea de tiempo — una habilidad real de depuración operativa."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "data-viz", "regex", "file-io"]
learningObjectives:
  - "Parsear líneas de log heterogéneas en diccionarios de Python estructurados"
  - "Buscar y filtrar logs por severidad, fuente y palabra clave"
  - "Detectar patrones recurrentes y anomalías con collections.Counter"
  - "Renderizar una línea de tiempo de eventos por hora con matplotlib"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/data-structures", "data-analysis/groupby-aggregation"]
---

# 📊 Construye un Analizador y Visualizador de Logs

Todo servicio en ejecución produce un archivo de log que crece sin piedad — miles de líneas por minuto, la mitad de ellas ruido, hasta que una tarde algo se rompe y necesitas encontrar las tres líneas relevantes entre un millón. Este proyecto construye la primera herramienta a la que recurre un ingeniero real: un CLI que parsea un archivo de log en registros estructurados, filtra por severidad y palabra clave, cuenta los patrones que se repiten y dibuja una línea de tiempo de eventos por hora para que puedas *ver* cuándo las cosas salieron mal.

Esto asume Python 101 — I/O de archivos, cadenas, diccionarios y funciones — además de algo de comodidad leyendo DataFrames de Análisis de Datos. Nada más allá de eso: sin frameworks, sin APIs, sin servicios externos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Definir un formato de línea para un log desordenado y parsear cada línea en un registro estructurado (timestamp, nivel, fuente, mensaje).
2. Buscar y filtrar registros por severidad, fuente y palabra clave de texto libre.
3. Detectar los mensajes más frecuentes con un `Counter` — los patrones que dominan tu log.
4. Contar eventos por hora y renderizar una gráfica de línea de tiempo que muestra la interrupción de un vistazo.
5. Apuntar la herramienta terminada a un `app.log` de muestra realista que generes tú mismo y encontrar la anomalía.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal aquí — todo el sentido de la herramienta es apuntar a un archivo de log real en disco y leerlo, y eso es lo más natural en un terminal donde el archivo realmente vive. Los pasos de abajo asumen una carpeta pequeña con `uv`, lo que también convierte la tortuosa instalación de `matplotlib` en un solo comando.

**GitHub Codespaces** funciona igual de bien: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y tendrás Node, Python y `uv` preinstalados en un clon real del repositorio.

**Google Colab, Kaggle Notebooks y Binder son una buena forma de *probar* la maquinaria de parseo y conteo, pero el Paso 1 centrado en archivos (`pathlib` + I/O real) brilla menos en un notebook efímero.** El notebook de abajo refleja los pasos con un log de muestra incluido para que todo — parsear, filtrar, contar, graficar — se ejecute de principio a fin con cero configuración. Úsalo para ver funcionar la canalización; cambia a `uv` local o a un Codespace cuando quieras apuntar la herramienta a logs que realmente sean tuyos.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/log-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/log-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flog-analyzer%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de una sola línea del analizador: un Python moderno vía `uv`, un paquete de gráficos y un log de muestra realista para practicar.

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
mkdir log-analyzer && cd log-analyzer
uv init --bare
uv add matplotlib
```

### Genera un log de muestra realista

Necesitas un log para analizar que se vea como el real — ruido, repetición y un pico enterrado de errores. Pega esto en `make_sample_log.py`:

```python
# make_sample_log.py
from datetime import datetime, timedelta
from pathlib import Path
import random

random.seed(7)
START = datetime(2026, 8, 3, 0, 0)
LINES = [
    ("INFO", "api", "GET /health 200 {}ms"),
    ("INFO", "api", "GET /api/users 200 {}ms"),
    ("INFO", "db", "query OK {}ms"),
    ("DEBUG", "cache", "hit key=user:{}"),
    ("WARN", "db", "slow query {}ms (>1000ms)"),
    ("ERROR", "api", "500 on /api/orders: KeyError 'total'"),
    ("ERROR", "db", "connection reset by peer"),
]

out = []
t = START
for _ in range(1200):
    t += timedelta(seconds=random.randint(1, 12))
    level, src, msg = random.choice(LINES)
    n = random.randint(1, 9999)
    if random.random() < 0.03:
        level, src, msg = "ERROR", "api", "500 on /api/orders: KeyError 'total'"
    out.append(f"{t:%Y-%m-%d %H:%M:%S} {level:<5} [{src}] {msg.format(n)}")

Path("app.log").write_text("\n".join(out) + "\n")
print(f"wrote {len(out)} lines to app.log")
```

Ejecútalo:

```bash
uv run python make_sample_log.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `matplotlib` instalado vía `uv add matplotlib`.
- ✅ `make_sample_log.py` escribe `app.log` con 1200 líneas — aproximadamente dos horas de timestamps con unas pocas decenas de líneas ERROR salpicadas.

## Paso 1: Parsear una línea de log en un registro estructurado

El texto no estructurado es inútil para el análisis, así que el primer movimiento es convertir cada línea en un `dict` con campos con nombre. Nuestro formato es fijo a propósito: `timestamp LEVEL [source] message`. Verás este par "define un formato parseable, luego pársalo" en todo sistema de logging del mundo real — incluido el propio módulo `logging` de Python.

### 1.1 Escribe un parser de una línea

```python
# parse.py
from pathlib import Path

def parse_line(line: str) -> dict:
    """Turns '2026-08-03 10:14:03 INFO  [api] GET /health 200 12ms' into a dict."""
    parts = line.split(None, 3)
    ts, level, source = parts[0] + " " + parts[1], parts[2], parts[3].strip("[]")
    message = parts[4] if len(parts) > 4 else ""
    return {"timestamp": ts, "level": level, "source": source, "message": message}

def load_log(path: str) -> list[dict]:
    return [parse_line(line) for line in Path(path).read_text().splitlines() if line.strip()]

if __name__ == "__main__":
    records = load_log("app.log")
    print(f"parsed {len(records)} records")
    print(records[0])
```

`line.split(None, 3)` es el caballo de batalla aquí: dividir por espacios en blanco con un `maxsplit` de 3 mantiene intacto el espacio interno del timestamp (`parts[1]` de otro modo separaría `10:14` y `03`) y captura todo el mensaje como un último fragmento. El nivel siempre tiene exactamente 5 caracteres de ancho en nuestro generador (`INFO ` con relleno), así que sobrevive limpio a la división también.

**👟 Pista inicial :** Copia `parse.py` exactamente, ejecuta `uv run python parse.py` y confirma que el primer registro es un dict con cuatro llaves antes de tocar nada más.

**🎯 Resultado esperado :** `parsed 1200 records`, seguido de un solo dict como `{'timestamp': '2026-08-03 00:00:00', 'level': 'INFO', 'source': 'api', 'message': 'GET /health 200 691ms'}`.

**🩹 Si sale mal :** Si obtienes `ValueError: not enough values`, se coló una línea en blanco o una línea con menos de 4 partes separadas por espacios en blanco — por eso `load_log` filtra las líneas vacías según `line.strip()`. Si el mensaje está vacío en cada línea, el generador escribió un formato sin separación de mensaje; vuelve a ejecutar `make_sample_log.py` (la llamada `{msg.format(n)}` colapsa cuando el mensaje no tiene un placeholder `{}` — verifica que siga haciéndolo después de editar).

### 1.2 Verifica el parser

**✅ Lista de verificación**

- ✅ `parse.py` imprime `parsed 1200 records` desde `app.log`.
- ✅ El primer registro impreso es un `dict` real con las llaves `timestamp`, `level`, `source` y `message`.
- ✅ Puedes explicar por qué `split(None, 3)` limita la división a tres — y qué se rompe sin el `3`.

**🤔 Pregunta(s) socrática(s)**

- Nuestro parser asume una columna de nivel de ancho fijo (`{level:<5}` en el generador). ¿Qué cambiaría en `parse_line` si el log usara niveles de ancho variable como `[ERROR] api` — y existe una reescritura que sobreviva a ambos?
- El timestamp se guarda como cadena. ¿Qué se rompería más adelante si intentaras ordenar registros *por tiempo* con cadenas como `2026-08-03 00:00:00`? (Pista: piensa en los ceros a la izquierda y en lo que un objeto `datetime` te da gratis.)

## Paso 2: Filtrar y buscar los registros

Parsear te da estructura; filtrar es donde empiezas a responder preguntas. "Cada ERROR en los últimos 10 minutos" y "cada línea que mencione `orders`" son las dos consultas que una sesión de depuración realmente ejecuta — una por campo exacto, otra por texto libre.

### 2.1 Consulta por campo y por palabra clave

```python
# query.py
from parse import load_log

def by_level(records: list[dict], level: str) -> list[dict]:
    return [r for r in records if r["level"] == level]

def by_source(records: list[dict], source: str) -> list[dict]:
    return [r for r in records if r["source"] == source]

def by_keyword(records: list[dict], keyword: str) -> list[dict]:
    return [r for r in records if keyword.lower() in r["message"].lower()]

if __name__ == "__main__":
    records = load_log("app.log")
    errors = by_level(records, "ERROR")
    print(f"ERROR lines: {len(errors)}")
    print(f"first error message: {errors[0]['message']}")
    caches = by_keyword(records, "cache hit")
    print(f"messages containing 'cache hit': {len(caches)}")
```

Cada filtro es una comprensión de lista sobre los registros con un predicado, y la búsqueda por palabra clave pliega ambos lados a minúsculas para que `ERROR` coincida con `error`. Como el registro es un dict, `by_level` y `by_source` son en realidad *la misma* función disfrazada — ambas solo prueban un campo contra un valor.

**👟 Pista inicial :** Empieza solo con `by_level`; verifica el conteo de ERROR, y luego añade `by_source` y `by_keyword` de una en una, volviendo a ejecutar después de cada una.

**🎯 Resultado esperado :** Tres líneas: `ERROR lines: <un número alrededor de 40>`, el texto de un error `500 on /api/orders`, y un conteo de `messages containing 'cache hit'` — algo cómodamente por encima de cero.

**🩹 Si sale mal :** Si `errors[0]` lanza `IndexError`, tu log de muestra tiene cero líneas ERROR — vuelve a ejecutar el generador: la rama `random.random() < 0.03` es la que las inyecta. Si el conteo de palabras clave es 0 pero *sabes* que el texto está ahí, revisa que estás buscando en `records` y no en un módulo recargado obsoleto — reinicia el intérprete después de editar `parse.py`.

### 2.2 Verifica el filtrado

**✅ Lista de verificación**

- ✅ `by_level(records, "ERROR")` devuelve una lista no vacía cuyos miembros tienen todos `level == "ERROR"`.
- ✅ `by_keyword(records, "orders")` devuelve cada línea cuyo mensaje contiene esa palabra — y devuelve el mismo resultado sin importar las mayúsculas.
- ✅ Puedes predecir, antes de ejecutar, cuántos registros superpondrían `by_level` + `by_source` en una fuente que solo emite líneas INFO.

**🤔 Pregunta(s) socrática(s)**

- `by_keyword` hace una coincidencia literal de subcadena. ¿Cuál es la primera consulta que podrías escribir y que *fallaría* — por ejemplo, querer todos los mensajes sobre "orders" *o* "payments"? ¿Qué sugiere eso sobre componer predicados simples?
- ¿Debería `by_level` tratar `"error"` (minúsculas) como igual a `"ERROR"`? ¿Cuál es un cambio de una línea que haga la comparación insensible a mayúsculas — y cuándo podrías *no* querer eso?

## Paso 3: Cuenta patrones con un `Counter`

Filtrar encuentra las líneas que ya sospechas; contar encuentra los problemas que no. El mensaje más repetido en un log casi siempre es lo que hay que mirar — un solo bucle de backoff reintentando cada segundo generará miles de líneas idénticas mientras un error real se dispara una vez.

### 3.1 Cuenta mensajes repetidos

```python
# count.py
from collections import Counter
from parse import load_log

def top_messages(records: list[dict], n: int = 5) -> list[tuple]:
    return Counter(r["message"] for r in records).most_common(n)

def error_rate(records: list[dict]) -> float:
    if not records:
        return 0.0
    errors = sum(1 for r in records if r["level"] == "ERROR")
    return errors / len(records)

if __name__ == "__main__":
    records = load_log("app.log")
    for msg, count in top_messages(records):
        print(f"{count:>4}  {msg}")
    print(f"\nerror rate: {error_rate(records):.2%}")
```

`Counter(...).most_common(n)` hace todo el trabajo de "agrupar por mensaje, ordenar por frecuencia, tomar los n primeros" en una línea — de otro modo escribirías un bucle de `defaultdict(int)` más un ordenamiento. Nota que el mensaje se vuelve casi una *plantilla* cuando se usa una cadena de formato real (`{n}` reemplazado en tiempo de generación), así que los valores de parámetros distintos aún colapsan en un solo cubo, que es exactamente lo que quieres para detectar un patrón repetido.

**👟 Pista inicial :** Importa `Counter` de `collections` (stdlib — sin instalación) e imprime los 5 mensajes principales con sus conteos; el one-liner de `error_rate` es un extra que responde "¿qué fracción de mi log es fallo?"

**🎯 Resultado esperado :** Cinco líneas como ` 213  query OK 1234ms` con conteos descendentes, y luego `error rate: 3.4%` (tus números exactos varían — la semilla los hace reproducibles).

**🩹 Si sale mal :** Si cada línea muestra un conteo de 1, `{msg.format(n)}` en el generador le dio a cada línea un parámetro único y el "agrupamiento" por plantilla no colapsó nada — ese es un comportamiento correcto, pero para ver repetición, vuelve a ejecutar el generador donde `random.seed(7)` hace que algunos mensajes se repitan. Si `error_rate` imprime `0.00%`, falta la rama ERROR en tu generador (mira la corrección del Paso 2).

### 3.2 Verifica el conteo

**✅ Lista de verificación**

- ✅ `top_messages` imprime 5 filas con conteos descendentes que suman las 1200 líneas completas.
- ✅ `error_rate` devuelve un porcentaje entre 0% y 100% que coincide con `len(by_level(records, "ERROR")) / len(records)`.
- ✅ Puedes nombrar el tipo que devuelve cada elemento de `top_messages` — y por qué una `list` simple no puede hacer `most_common`.

**🤔 Pregunta(s) socrática(s)**

- `Counter` está construido sobre un `dict` simple. ¿Qué se perdería si reemplazaras el one-liner con `dict.fromkeys(records, 0)` para "poner todo a cero primero" — y cuál es el conteo real cuando falta una llave en un dict normal?
- `error_rate` divide por el total de registros. Si el log fuera 90% líneas DEBUG, ¿los mismos 40 ERROR se verían mejor o peor como porcentaje? ¿Cuál sería un *mejor* denominador para "qué tan rota está esta hora"?

## Paso 4: Visualiza los eventos en el tiempo

Un número puede ocultar un patrón; una gráfica rara vez. "Cada hora tuvo 2 errores excepto las 11:00, que tuvo 140" es un *dashboard que puedes ver*, y es el paso que lleva la herramienta de "buscar" a "analizar".

### 4.1 Cuenta eventos por hora y grafica

```python
# timeline.py
from collections import Counter
from datetime import datetime
from parse import load_log
import matplotlib.pyplot as plt

def events_per_hour(records: list[dict], level: str = None) -> Counter:
    hours = Counter()
    for r in records:
        if level is not None and r["level"] != level:
            continue
        hour = datetime.strptime(r["timestamp"], "%Y-%m-%d %H:%M:%S").replace(
            minute=0, second=0, microsecond=0
        )
        hours[hour] += 1
    return hours

if __name__ == "__main__":
    records = load_log("app.log")
    totals = events_per_hour(records)
    errors = events_per_hour(records, "ERROR")
    hours = sorted(set(totals) | set(errors))
    x = range(len(hours))
    plt.bar([h for h in x], [totals[h] for h in hours], label="all events")
    plt.bar([h for h in x], [errors[h] for h in hours], color="red", label="errors")
    plt.xticks(list(x), [h.strftime("%H:%M") for h in hours], rotation=45)
    plt.xlabel("hour")
    plt.ylabel("events")
    plt.title("Log events per hour")
    plt.legend()
    plt.tight_layout()
    plt.savefig("timeline.png", dpi=120)
    print("wrote timeline.png")
    print("error peak:", errors.most_common(1))
```

Dos barras sumadas en el mismo eje es el truco de una gráfica apilada: el total muestra el volumen, y la superposición roja muestra *dónde del volumen eran errores*. Ambas se construyen desde el mismo `events_per_hour` — el filtro de `level` es una parada opcional dentro del bucle de conteo, así que una sola función responde "qué tan ocupado" y "qué tan roto" sin una segunda implementación.

**👟 Pista inicial :** Consigue que se imprima `wrote timeline.png` y abre el archivo antes de preocuparte por las etiquetas — una barra azul plana y aburrida con un pico rojo es la primera salida esperada y correcta.

**🎯 Resultado esperado :** `wrote timeline.png` y `error peak: (<un datetime cerca de las 11:00>, <un conteo en los cientos>)` — una barra roja que domina una hora en la imagen guardada.

**🩹 Si sale mal :** Si `plt.bar` falla con longitudes no coincidentes, `x` y las dos listas de valores deben tener la misma longitud — la línea de unión `hours = sorted(set(totals) | set(errors))` existe para garantizar eso, así que no la reemplaces con solo `set(totals)`. Si `strptime` lanza `ValueError: time data ... does not match format`, tu `parse_line` guardó milisegundos o un timestamp solo de fecha — revisa que el formato `%H:%M:%S` del generador coincida con `"%Y-%m-%d %H:%M:%S"` en `strptime`.

### 4.2 Verifica la línea de tiempo

**✅ Lista de verificación**

- ✅ `timeline.png` existe y muestra una hora con una barra roja alta — la anomalía es visible sin leer un número.
- ✅ Las barras de cada otra hora están casi planas, reflejando un flujo de fondo uniforme.
- ✅ La hora del pico de errores coincide con que `error_rate` sea notablemente más alto en ese segmento de hora.

**🤔 Pregunta(s) socrática(s)**

- La gráfica apila total y errores en el mismo eje, lo que visualmente *oculta* la línea base de errores donde el rojo es minúsculo. ¿Cuál es una codificación alternativa (pista: dos subplots, o errores en escala logarítmica) que sacaría a la superficie una tasa de error pequeña en un log de alto volumen?
- Agrupamos por hora de calendario. Si una interrupción ocurre a las 11:59 y se arregla a las 12:01, la agrupación estándar de `replace(minute=0)` la esparce entre dos barras. ¿Cómo agruparías si quisieras que la gráfica se alineara con "un estallido", no con "dos horas parciales"?

## Paso 5: Apunta el analizador a una anomalía real

Toda la herramienta es más que la suma de sus pasos cuando la ejecutas sobre un log en el que *no* has leído ya la respuesta. Este paso genera un log con un estallido oculto y luego usa tus propios filtros, tu contador y tu gráfica para encontrarlo — el flujo de trabajo genuino.

### 5.1 Encuentra el pico enterrado

```python
# analyze.py
from parse import load_log
from query import by_level
from count import top_messages
from timeline import events_per_hour

if __name__ == "__main__":
    records = load_log("app.log")
    errors = by_level(records, "ERROR")
    print(f"total lines: {len(records)} | errors: {len(errors)}")
    print("\nmost common error-level messages:")
    for msg, cnt in top_messages(errors, 3):
        print(f"  {cnt:>3}  {msg}")
    peak_hour, peak_count = events_per_hour(errors).most_common(1)[0]
    print(f"\nerror peak at {peak_hour:%H:%M} with {peak_count} errors")
```

**👟 Pista inicial :** `analyze.py` toma prestado de cada módulo anterior — ejecútalo y luego *ve a leer* el conteo y la hora del pico, y confirma que son consistentes con `timeline.png` del Paso 4. Leer los dos juntos es la recompensa.

**🎯 Resultado esperado :** Tres conclusiones claras que coinciden entre sí — un conteo de ERROR cerca de 40 en total, un mensaje recurrente `500 on /api/orders` que domina la lista de errores, y una hora de pico de errores que coincide visiblemente con el pico rojo de la gráfica guardada.

**🩹 Si sale mal :** Si la hora del pico parece aleatoria (conteos de 1–3 en todas partes), tu generador alcanzó la inyección del 0.03 demasiado uniformemente o no lo hizo — vuelve a ejecutar `make_sample_log.py`; la semilla garantiza un estallido. Si `top_messages(errors, 3)` muestra tres mensajes *diferentes* de conteo uno, el patrón de error es demasiado variado para ser "un bug" — eso en sí mismo es un hallazgo que vale la pena anotar.

### 5.2 Verifica el análisis completo

**✅ Lista de verificación**

- ✅ Los tres hechos impresos (total/errores, mensaje de error principal, hora del pico) son mutuamente consistentes y coinciden con `timeline.png`.
- ✅ Puedes nombrar, para cada hecho, exactamente la función de qué paso lo produjo — parsear, filtrar, contar o agrupar.
- ✅ Has borrado y regenerado `app.log` al menos una vez para confirmar que la herramienta lee el archivo fresco, no un resultado en caché.

**🤔 Pregunta(s) socrática(s)**

- El pico se diseñó con `random.random() < 0.03` — una inyección del 3%. Si la cambiaras a `0.5`, ¿cuál de las cuatro funciones *seguiría* siendo la correcta para detectarlo, y qué salida dejaría de ser confiable?
- Esta herramienta responde "qué pasó" pero no "por qué". ¿Cuál es la única siguiente consulta que te gustaría ejecutar contra la hora del pico — y qué construirías (pista: un drill-down que muestre las líneas crudas) para responderla?

## ⚠️ Errores comunes

- **Deriva del formato de parseo.** En el momento en que un log real cambia su formato de mensaje (un campo nuevo, un nivel más largo), `split(None, 3)` produce silenciosamente registros mal etiquetados y cada conteo posterior miente. La solución es una verificación de esquema en `load_log`: lanza un error claro cuando una línea no puede dividirse en 4+ partes, listando la línea ofensiva, en lugar de dejar pasar basura.
- **Contar mensajes crudos en lugar de plantillas.** Contar `r["message"]` agrupado por texto exacto explota de repente en miles de entradas únicas en el momento en que un mensaje incrusta un valor por solicitud (`user:4311` vs `user:4312`). Para el análisis de logs normalmente quieres normalizar los números antes de contar — un regex que reemplace `\d+` con `{N}` — para que `user:{N}` cuente como un patrón. Esa normalización es lo que hacen las herramientas reales de agregación de errores.
- **Llamar a `strptime` en cada línea.** Parsear 10,000 cadenas para una gráfica de 5 líneas está bien; parsear 10 millones ralentiza toda la canalización. Compra un `datetime` real para ordenar y agrupar, pero haz benchmark antes de asumir — y considera un `sorted(records, key=lambda r: r["timestamp"])` único si todo lo que necesitas es orden, ya que los timestamps de estilo ISO se ordenan correctamente como cadenas.
- **La trampa del log vacío.** `error_rate` y `most_common(1)[0]` ambos explotan (`IndexError`) con un archivo vacío, y las herramientas de estilo `dataframe` son peores — calculan silenciosamente sobre cero filas. Protege todo punto de entrada: `if not records: print("empty log")` antes del primer filtro, no después de que tres pasos ya hayan asumido que existen datos.
- **Guardar un PNG y llamarlo dashboard.** Un archivo estático es un gran punto de control, pero "ver la anomalía" a las 3 a.m. normalmente significa una alerta. El siguiente paso natural (y una trampa clásica) es olvidar que una gráfica que *tú* miras semanalmente no es un sistema de alertas — establece una verificación de umbral (`if errors > 100: print("ALERT")`) mucho antes de construir dashboards más elegantes.

## Lo que acabas de construir

Una canalización real de análisis de logs: `parse.py` convierte 1200 líneas crudas en dicts estructurados, `query.py` las filtra, `count.py` encuentra los patrones que se repiten y la tasa de error, y `timeline.py` renderiza la única hora con picos donde todo salió mal. Nada aquí es un andamiaje — genera un log nuevo, apunta la herramienta a él, y la anomalía salta a la vista. La habilidad transferible es más grande que los logs: parsear → normalizar → contar → visualizar es el esqueleto exacto de toda tarea de "dar sentido a una fuente de texto desordenada", desde logs de servidor hasta respuestas de encuestas o mensajes de commit de git.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/log-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/log-analyzer) en el repositorio del curso agrupa los cinco módulos además de un `app.log` de muestra y un notebook listo para ejecutar. Clónalo, o abre el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y ejecútalo desde allí.
:::

## A dónde ir desde aquí

- Normaliza los valores que rompen el conteo antes de contar — reemplaza `\d+` con `{N}` para que `user:4311` y `user:4312` colapsen en un patrón, y mira a tu `Counter` empezar a encontrar repeticiones reales.
- Añade una regla de alerta: `warn_threshold.py` que imprima `ALERT: <n> errors in the last hour` cuando `events_per_hour` cruce un número — la semilla de un pager, sin el pager.
- Añade un mapa de calor fuente-por-hora (una fila por `source`, una columna por hora, color de celda = conteo) — la forma clásica de detectar "la db estaba afectada a las 02:00 mientras la api estaba bien".
- Lleva la canalización al módulo `logging` de Python: emite registros *estructurados* (ya dicts y un formato documentado) en lugar de parsear el texto de otro — el tú del futuro nunca necesitará el Paso 1.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso — un log real que domesticaste, una gráfica que encontró un pico real? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README te guía para añadir el tuyo mediante una **pull request** de principio a fin: fork, rama, commit y apertura de la PR. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓