---
title: "Analizador de Sueño"
description: "Analiza patrones de sueño con puntuación de calidad, detección de tendencias y sugerencias de mejora."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "csv", "datetime", "statistics", "scripting"]
learningObjectives:
  - "Analiza y valida la entrada de hora de acostarse y despertarse con el módulo datetime"
  - "Calcula la duración del sueño a través de un límite de medianoche"
  - "Puntúa la calidad nocturna a partir de la duración y un componente de consistencia"
  - "Lee un historial CSV de vuelta y compara promedios semana a semana"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/datetime", "python-101/functions"]
---

# 😴 Construye un Analizador de Sueño

Cada rastreador de sueño en su núcleo es una pequeña hoja de cálculo con criterio: registra cuándo te acostaste y cuándo te despertaste, resta para obtener la duración, compárala con un objetivo y observa si tu promedio se acerca o se aleja de lo saludable a lo largo de una semana. Este proyecto construye eso — un CLI que registra una noche, atrapa la clásica trampa de acostarse-pasada-la-medianoche, puntúa cada noche por duración y consistencia, y lee todo el historial de vuelta para comparar semana a semana. Sin wearable, sin EEG: el "sensor" eres tú escribiendo dos horas, y el análisis es `datetime` de Python puro y aritmética. Es lo más pequeño de este curso que aún se siente como una herramienta real que de verdad usarías.

Esto asume Python 101 — strings, datetime, E/S de archivos, funciones. Opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Pedir una hora de acostarse y una de despertarse y analizarlas en objetos `datetime`.
2. Calcular la duración del sueño que cruza la medianoche correctamente.
3. Puntuar la noche contra una duración objetivo y una regla de consistencia.
4. Guardar cada noche registrada en un historial CSV.
5. Leer el historial de vuelta e imprimir una comparación de promedio semana a semana.

## Dónde ejecutar esto

**Localmente con `uv` es el camino principal** — toda la herramienta es un script que ejecutas (`uv run python sleep.py --log`), y el historial CSV es un archivo real que puedes abrir en cualquier editor. La victoria es la honestidad: registras *tus propias* noches, así que ejecutarlo en un laptop o en el navegador de Codespaces es donde sea que realmente escribirías tu hora de acostarte.

**GitHub Codespaces** ejecuta el CLI idéntico: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y cada invocación de `sleep.py` se comporta exactamente como localmente, con `sleep_log.csv` viviendo en el árbol de archivos.

**Google Colab, Kaggle Notebooks y Binder manejan el *análisis* honestamente** — la matemática de duración, la puntuación de calidad y el promediado CSV son Python puro y corren de forma idéntica en un notebook, donde el gráfico de tendencia o la tabla de promedios se renderiza como salida de celda. Lo único que un notebook no puede hacer es *preguntar interactivamente* como lo hace una terminal — así que en un notebook alimentarías una lista de entradas codificada a mano o escrita a mano (o cargada del CSV) en lugar de `input()`. Ambos son el mismo motor; solo la fuente de entrada difiere.

[![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sleep-analyzer/notebook.ipynb)
[![Abrir en Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sleep-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsleep-analyzer%2Fnotebook.ipynb)

## Configuración

Solo `uv` y un CSV vacío esperando tu primera noche.

### Instala `uv`

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
mkdir sleep-analyzer && cd sleep-analyzer
uv init --bare
```

Sin dependencias de terceros — todo el proyecto corre en la librería estándar.

### Pre-siembra un encabezado CSV

```bash
mkdir -p data
printf "date,bedtime,waketime,hours,score\n" > data/sleep_log.csv
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `data/sleep_log.csv` existe con el encabezado `date,bedtime,waketime,hours,score`.
- ✅ Tienes dos horas reales en mente (la de anoche, acostarte y despertarte) para probar.

## Paso 1: Analiza y valida una noche

Cada registro de sueño comienza con un error de escritura siendo atrapado antes de que se vuelva una fila envenenada. El analizador lee una hora de acostarse y una de despertarse como `"HH:MM"`, las convierte en `datetime.time` y *rechaza* cualquier cosa que no sea una hora de reloj válida con un mensaje claro en lugar de un crash silencioso. Esta es la disciplina de "basura adentro, ruido afuera" aplicada a un prompt de dos líneas.

**👟 Pista inicial:** Empieza escribiendo `parse_time(label)`: un bucle `while True` que hace `input()` de un string `HH:MM`, devuelve `datetime.strptime(raw, "%H:%M").time()` al tener éxito e imprime un re-prompt amigable en `ValueError`.

```python
# sleep.py
from datetime import datetime, time, timedelta
import csv, sys
from pathlib import Path

LOG = Path("data/sleep_log.csv")
TARGET_H = 7.5

def parse_time(label: str) -> time:
    while True:
        raw = input(f"{label} (HH:MM): ").strip()
        try:
            return datetime.strptime(raw, "%H:%M").time()
        except ValueError:
            print(f"  '{raw}' isn't a valid clock time. Try e.g. 22:30 or 06:15.")

def log_night() -> dict:
    date = datetime.now().strftime("%Y-%m-%d")
    bed = parse_time("Bedtime")
    wake = parse_time("Wake time")
    hours, score = duration_and_score(bed, wake)
    return {"date": date, "bedtime": bed.strftime("%H:%M"),
            "waketime": wake.strftime("%H:%M"), "hours": round(hours, 1),
            "score": round(score, 1)}
```

`parse_time` recorre hasta obtener un `"HH:MM"` válido — `datetime.strptime(raw, "%H:%M")` produce una hora al tener éxito y lanza `ValueError` en cualquier otra cosa, que el `while True` atrapa imprimiendo la entrada ofensiva y preguntando de nuevo. La forma de retorno es un solo dict con las cinco columnas que el encabezado CSV prometió, calculadas a través de un helper `duration_and_score` que escribirás después. Atrapar la entrada mala *en la puerta* (antes de que llegue a la fila) es toda la lección: un `strptime` y un `try/except` mantienen el log limpio para siempre.

**🎯 Resultado esperado:** Para un `22:30` y `06:15` válidos, un dict como `{'date': '2026-09-06', 'bedtime': '22:30', 'waketime': '06:15', 'hours': 7.8, 'score': 8.7}`; para un typo como `25:99`, un mensaje de "no es una hora de reloj válida" y un re-prompt.

**🩹 Si sale mal:** Si un `"23:00"` válido lanza `ValueError`, pasaste el formato mal — `"%H:%M"` es H-mayúscula, de 24 horas; `%h` minúscula no es una directiva válida. Si una entrada mala *crasea* el script en lugar de re-promptear, el bucle `while True` no está realmente en bucle (el `return` está dentro del `try` solo) — el `except` debe dejar que el bucle continúe. Si la fecha está mal, `datetime.now()` está bien para una demo pero es consciente de la hora local, no UTC — esa es una elección deliberada aquí ya que "hoy" es lo que el usuario quiere decir.

**✅ Lista de verificación**

- ✅ Una entrada válida de dos horas devuelve el dict completo de cinco campos.
- ✅ Una hora malformada re-promptea sin crashear.
- ✅ Las claves del dict coinciden exactamente con el encabezado CSV de la Configuración.

**🤔 Pregunta(s) socrática(s)**

- `parse_time` recorre hasta que *la entrada* es válida, pero ¿y si el usuario presiona Enter con entrada vacía? Tu `.strip()` convierte `""` en un fallo de `strptime` que re-promptea — pero una *hora de acostarse vacía* podría ser una señal legítima de "olvidé". ¿Qué comportamiento elegiría una herramienta amigable, y por qué (re-promptear para siempre vs dejarlos saltar)?
- Este analizador acepta cualquier hora de 24h, incluyendo `13:00`. Una "hora de acostarse" de 13:00 es una siesta o un typo — pero la herramienta no puede saberlo. ¿Qué *comprobación de rango* (p. ej. hora de acostarse entre 18:00 y 04:00) añadiría significado, y dónde pertenece: en `parse_time` o después?

## Paso 2: Calcula la duración cruzando medianoche

El primer "gotcha" de la matemática del sueño: si te acuestas a las 23:00 y despiertas a las 06:30, no dormiste un *negativo* de 16.5 horas — cruzaste medianoche. Este helper calcula la duración correctamente detectando el giro y añadiendo los minutos de un día, luego convierte a horas. La resta ingenua `wake - bed` es el bug que todo principiante golpea; este paso lo nombra y lo arregla.

**👟 Pista inicial:** Empieza escribiendo la conversión de minutos dentro de `duration_and_score`: detecta el giro de medianoche con `if wake_min >= bed_min`, añade `24 * 60 - bed_min + wake_min` en la rama de cruce, luego convierte a horas antes de puntuar.

```python
# sleep.py (continuación)

def duration_and_score(bed: time, wake: time) -> tuple[float, float]:
    bed_min = bed.hour * 60 + bed.minute
    wake_min = wake.hour * 60 + wake.minute
    if wake_min >= bed_min:           # same-day: went to bed and woke later the SAME day
        minutes = wake_min - bed_min
    else:                             # crossed midnight
        minutes = (24 * 60 - bed_min) + wake_min
    hours = minutes / 60.0

    duration_score = min(hours / TARGET_H, 1.0)          # 100% when you hit target
    consistency = 0.8 if hours >= TARGET_H else 0.9      # small bonus for doctor nudge
    score = (100 * duration_score) * consistency
    if hours >= TARGET_H:
        score = 100.0 + min((hours - TARGET_H) * 10, 25)  # a little bonus for sleeping in
    return hours, score
```

El pivote de duración es el `if wake_min >= bed_min`: mismo-día (acostarse a las 06:00, despertar a las 09:00, una siesta de turno nocturno) resta normalmente; la rama de *cruzar-medianoche* suma los minutos desde la hora de acostarse hasta medianoche (`24*60 - bed_min`) más los minutos desde medianoche hasta despertar (`wake_min`). La puntuación dobla un porcentaje simple de dos maneras — una calificación de letra de "alcanza el objetivo" (capeada en 100 por duración, una pequeña bonificación por dormir dentro de una banda saludable) y un descuento de *consistencia* por dormir de menos — así que una noche de 7.5 horas puntúa más alto que una de 4 horas *y* una rutina algo corta pero regular puntúa más alto que un vaivén.

**🎯 Resultado esperado:** `bed=23:00, wake=06:30` → `(7.5, 100.0)`; `bed=23:00, wake=05:00` → `(6.0, 72.0)`; `bed=01:00, wake=01:30` (una siesta de 30 min) → `(0.5, 5.3…)`; cruzar medianoche siempre produce un valor de horas positivo y sensato.

**🩹 Si sale mal:** Si una noche que cruza medianoche devuelve un número *negativo* o *enorme*, la rama `if wake_min >= bed_min` saltó cuando debería haber caído a la rama de cruzar-medianoche — la condición de giro es sobre *minutos*, no horas; verifica que la comparación es `wake_min >= bed_min` (ambos minutos). Si `bed=23:00, wake=06:30` produce `16.5`, restaste sin el giro — ese es exactamente el bug del "negativo 16.5"; re-ejecuta por la rama else. Si los puntajes exceden 100 o caen de forma rara, la lógica de máscara/bonificación contó doble — imprime `duration_score` y `consistency` por separado para ver qué término sobrescribió.

**✅ Lista de verificación**

- ✅ Cruzar medianoche siempre produce un valor de horas positivo en un rango sensato.
- ✅ `7.5` horas → puntaje 100 (objetivo alcanzado); `6.0` → visiblemente menor; una siesta → muy bajo.
- ✅ Dormir más del objetivo gana una bonificación modesta capeada, no una inflación descontrolada.

**🤔 Pregunta(s) socrática(s)**

- El arreglo de cruzar-medianoche funciona para un par `HH:MM` *único*. Pero un trabajador cuyo turno pasa del amanecer (acostarse 08:00, despertar 18:00) — ¿la rama `wake_min >= bed_min` lo maneja como un *sueño largo de 10 horas*, o lo maletiqueta? Traza el límite donde "mismo-día" deja de ser la suposición correcta (¿qué tal un sueño de 20 horas?).
- La puntuación capea el término de duración en 100 y añade una bonificación por dormir de más. ¿Una noche de 10 horas es genuinamente "mejor" que una sana de 8, o es la bonificación una *ficción conveniente*? Argumenta qué puntuaría un *investigador* del sueño para una noche de 5 horas vs una de 10, y cómo la simplicidad de tu fórmula esconde ese matiz médico.

## Paso 3: Guarda en un historial CSV

Una noche registrada es un hecho; un *historial* es la materia de la que están hechas las tendencias. Este paso añade el dict analizado del Paso 1 al CSV, creciendo el archivo en una fila por llamada. El patrón de "escribe una vez, añade para siempre" es el mismo que mantiene barato un log de varias semanas — y ya tocaste el encabezado en la Configuración.

**👟 Pista inicial:** Empieza escribiendo `append_row(row)` con `csv.DictWriter` y una lista explícita de `fieldnames` en modo `"a"`, luego conecta `main_entry` para registrar una noche e imprimir de vuelta la fila guardada.

```python
# sleep.py (continuación)

def append_row(row: dict) -> None:
    header = ["date", "bedtime", "waketime", "hours", "score"]
    with LOG.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=header)
        w.writerow(row)

def main_entry() -> None:
    row = log_night()
    append_row(row)
    print(f"saved {row['date']}: {row['hours']}h, score {row['score']}")

if __name__ == "__main__":
    main_entry()
```

`append_row` abre el log en modo añadir (`"a"`) y usa `csv.DictWriter` con una lista explícita de `fieldnames`, así que cada fila nueva se escribe *en el orden del encabezado* independientemente del orden de claves del dict — una victoria pequeña pero real de corrección (un dict barajado de otro modo desordenaría las columnas). La guardia `if __name__ == "__main__"` es el interruptor script/import: ejecútalo y registra una noche; impórtalo y las funciones son reutilizables sin efectos secundarios. La línea de "imprime lo que guardaste" cierra el bucle — el usuario ve la fila exacta que aterrizó en el CSV.

**🎯 Resultado esperado:** Una línea de terminal `saved 2026-09-06: 7.5h, score 100.0`, y una fila nueva añadida a `data/sleep_log.csv` con las cinco columnas en orden de encabezado, con la columna de fecha poblada.

**🩹 Si sale mal:** Si el encabezado está *duplicado* en cada fila, `append_row` está escribiendo el encabezado cada vez — estás llamando a `w.writeheader()` dentro del añadido; escribe encabezados solo en la creación del archivo (Configuración), no por añadido. Si las columnas aparecen desordenadas, `fieldnames` no coincide con el orden del string del encabezado — alinea la lista con el encabezado de la Configuración exactamente. Si aparece `TypeError: not enough fields`, el dict tiene una clave que no está en `fieldnames` o le falta una — el dict del Paso 1 _debe_ contener exactamente esas cinco claves.

**✅ Lista de verificación**

- ✅ Un añadido agrega exactamente una línea de pie al CSV, coincidiendo con el encabezado.
- ✅ Re-ejecutar el script *añade* historial en lugar de truncarlo.
- ✅ El resumen impreso coincide con lo que `DictWriter` realmente escribió.

**🤔 Pregunta(s) socrática(s)**

- Añadir en modo `"a"` significa que dos *programas* añadiendo al mismo CSV (un notebook y un CLI) podrían intercalar filas. ¿Qué sacrifica el CSV comparado con un almacén con bloqueo de filas, y cuándo vale la pena tolerar la pérdida de integridad para un log personal?
- Cada fila almacena `hours` y `score` aunque ambos son *derivables* de `bedtime`/`waketime`. ¿Cuál es el argumento para almacenarlos (idempotente, autodescriptivo) versus recomputarlos al leer (fuente única de verdad)? Elige un lado que un analista pequeño defendería.

## Paso 4: Lee el historial y calcula promedios

Un log que nunca lees es un diario que no abres. Este paso carga cada fila de vuelta del CSV, convierte la columna `hours` a flotantes e imprime la duración y el puntaje promedio — la primera respuesta genuina de "cómo me está yendo" que la herramienta produce.

**👟 Pista inicial:** Empieza escribiendo `summarize(history)` que protege los casos de archivo faltante y CSV vacío con mensajes amigables, luego convierte las columnas `hours` y `score` e imprime sus promedios.

```python
# sleep.py (continuación)

def summarize(history: Path = LOG) -> None:
    if not history.exists():
        print("no log yet")
        return
    rows = list(csv.DictReader(history.open()))
    if not rows:
        print("no entries yet")
        return
    durations = [float(r["hours"]) for r in rows]
    scores = [float(r["score"]) for r in rows]
    avg_h = sum(durations) / len(durations)
    avg_s = sum(scores) / len(scores)
    print(f"{len(rows)} nights logged")
    print(f"avg duration: {avg_h:.2f} h   (target {TARGET_H})")
    print(f"avg score   : {avg_s:.1f} / 100")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--summary":
        summarize()
    else:
        main_entry()
```

`csv.DictReader` devuelve cada fila como un dict claveado por el encabezado, así que los mismos `fieldnames` del Paso 3 se vuelven las *claves* al leer — el round-trip es simétrico. Las dos líneas de promediado (`sum(durations)/len(durations)`) son todo el "análisis" para este paso, pero la disciplina está en las guardias: un archivo ausente ("`no log yet`") y un cuerpo vacío ("`no entries yet`") ambos devuelven mensajes ruidosos y amigables en lugar de un `ZeroDivisionError` por dividir entre cero. La bandera `--summary` es una pequeña puerta CLI — ejecuta con `--summary` para leer, sin ella para registrar — que convierte el script en una herramienta de dos modos.

**🎯 Resultado esperado:** Después de registrar 2–3 noches, `summary` imprime `3 nights logged`, `avg duration: 7.28 h (target 7.5)`, `avg score: 92.6 / 100`.

**🩹 Si sale mal:** Si `float(r["hours"])` lanza `ValueError`, la celda `hours` de una fila está corrupta (una letra descarriada de una edición manual) — `DictReader` es un analizador delgado; añade un `try/except float(...)` para saltar-y-advertir en lugar de morir. Si el divisor falla, `rows` está vacío y la guardia `len(rows)` no lo atrapó — la guardia de lista vacía debe venir *antes* de la división. Si `--summary` se ignora, el análisis de `sys.argv` corrió *después* de que la rama else llamara a `main_entry` — comprueba el orden de `if __name__`.

**✅ Lista de verificación**

- ✅ Ejecutar `--summary` imprime conteos y promedios correctos sobre las filas registradas.
- ✅ Los casos de archivo faltante y CSV vacío devuelven mensajes amigables, no crashes.
- ✅ Solo `--summary` lee; sin `--summary` registra — los dos modos son distintos.

**🤔 Pregunta(s) socrática(s)**

- El promedio esconde la *extensión*: un promedio de 7.0 podría ser siete noches de 7.0 h o tres de 10 h y cuatro de 4 h. ¿Qué única estadística (p. ej. el rango `max-min` o la `std` de las duraciones) expondría esa diferencia que una media simple suaviza — y por qué es la *variabilidad* la señal más reveladora para el sueño que el promedio solo?
- Un usuario que registra una noche de 5 horas y una de 10 obtiene el mismo promedio de 7.5 que uno que registra dos noches de 7.5 — pero a un *clínico del sueño* le importa cuál. ¿Qué métrica semanal (menos horas, peor noche única o varianza) necesitaría la herramienta para contrarrestar esa ilusión?

## Paso 5: Compara semana a semana

El último paso actualiza "cómo me está yendo" a "¿me está yendo *mejor* que la semana pasada?" Divide el historial por semana, promedia las dos más recientes y reporta la diferencia — la línea de tendencia que un rastreador de hábitos existe para dibujar. Aquí es donde el registro crudo se vuelve *autoconocimiento*.

**👟 Pista inicial:** Empieza escribiendo `trend(history)` que agrupa filas por el grupo de mes `date[:7]`, promedia las horas de cada grupo y resta los dos últimos promedios para imprimir un delta con signo más un veredicto de `improving`/`declining`/`steady`.

```python
# sleep.py (continuación)
from collections import defaultdict

def trend(history: Path = LOG, weeks: int = 2) -> None:
    rows = list(csv.DictReader(history.open()))
    weekly: dict[str, list[float]] = defaultdict(list)
    for r in rows:
        week = r["date"][:7]                      # "2026-09" month-group as a cheap week proxy
        weekly[week].append(float(r["hours"]))
    keys = sorted(weekly)[-weeks:]
    avgs = {k: sum(v) / len(v) for k, v in weekly.items()}
    if len(avgs) < 2:
        print("need at least two distinct weeks to compare")
        return
    k0, k1 = keys[0], keys[1]
    delta = avgs[k1] - avgs[k0]
    print(f"week {k0} → {k1}")
    print(f"avg hours {avgs[k0]:.2f} → {avgs[k1]:.2f}  ({delta:+.2f})")
    print("improving" if delta > 0 else "declining" if delta < 0 else "steady")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--trend":
        trend()
    elif len(sys.argv) > 1 and sys.argv[1] == "--summary":
        summarize()
    else:
        main_entry()
```

`groupby-mes` es el sustituto honesto de "semana": agrupa filas por los primeros 7 caracteres de la fecha ISO (`"2026-09"`), así que un mes de noches se vuelve un grupo. Promediar cada grupo y restar los últimos dos da el delta — y el veredicto impreso `+0.45`/`-0.30` (improving, declining, steady) es el resumen de una palabra de la tendencia. La guardia `len(avgs) < 2` mantiene la función honesta cuando solo hay un mes de datos. Es ingenuo (un mes no es una semana), pero es la *forma* del análisis de tendencias real: divide por grupo, promedia, resta y juzga.

**🎯 Resultado esperado:** Con filas extendidas a través de dos valores `YYYY-MM` diferentes, `trend` imprime los dos promedios y un delta con signo más una etiqueta `improving`/`declining`/`steady`; con datos PM en un solo mes, imprime `need at least two distinct weeks to compare`.

**🩹 Si sale mal:** Si cada fecha colapsa en un grupo, tu CSV no tiene variación de fechas — `trend` sobre un solo mes es un no-op (`need at least two`), que es *correcto*; añade a mano una fila con una fecha anterior para probar. Si el signo del delta se voltea, las claves de orden se están ordenando descendente (`sorted(weekly)[-weeks:]` elige las *últimas* dos) — confirma que `keys` ordena antigua→nueva para que `k1 - k0` signifique "nueva menos antigua". Si un `KeyError` salta, la fecha de una fila golpeó un `float()` en un no numérico — el proxy-semanas `[:7]` es seguro, pero una celda `hours` corrupta otra vez; protégela.

**✅ Lista de verificación**

- ✅ Con ≥2 grupos de mes distintos, la tendencia imprime ambos promedios, un delta con signo y un veredicto.
- ✅ El historial de un solo grupo devuelve el mensaje amigable `need at least two`.
- ✅ La dirección del veredicto (`improving` vs `declining`) coincide con el signo del delta.

**🤔 Pregunta(s) socrática(s)**

- La clave de grupo es `date[:7]` — un *mes*, no una semana real de 7 días. ¿Cuál es el bug exacto que emerge si registras todos los días durante 45 días (un grupo de 15 días y uno de 30 promediados como si fueran iguales)? ¿Cómo lo arreglaría un ancla semanal `(date - datetime.timedelta(days=weekday))`?
- El veredicto es un solo `+`/`-`/`0` de *promedios*, que de nuevo esconde la varianza. Formula la frase que diría un coach de sueño usando *ambos* el promedio de la tendencia *y* su extensión (p. ej. "tu promedio está estable, pero tu peor noche bajó") — y nombra los dos números que necesitarías del Paso 5 para decirla.

## ⚠️ Errores comunes

- **El bug del "sueño negativo".** `wake - bed` cuando la hora de acostarse cruza la medianoche produce un negativo enorme. Siempre pivotea en `wake_min >= bed_min` para añadir los minutos de un día — el error de matemática del sueño más común de todos.
- **Añadir el encabezado en cada fila.** Escribir `writeheader()` dentro de `append_row` duplica el encabezado y corrompe `DictReader` al leer. Escribe el encabezado solo al crear el archivo (Configuración), luego añade filas de solo datos.
- **Un typo desnudo `%H:%M`.** `%h` minúscula o `%I` (12 horas) analiza o da error silenciosamente. `"%H:%M"` es de 24 horas; úsalo consistentemente tanto para entrada como para salida o tus horas almacenadas y promedios dejarán de coincidir.
- **Codificar a mano claves que pueden desviarse.** Los `fieldnames` al escribir, el encabezado CSV y las claves del dict de `log_night` deben permanecer en sincronía — tres copias de los mismos cinco nombres. Define el encabezado una vez (una constante de módulo) y reutilízalo tanto para escribir como para leer.
- **Confiar en `avg` sobre la extensión.** Un promedio de 7.0 puede esconder vaivenes de 10+4. Una vez que tengas varias semanas, reporta el *delta* (Paso 5) y, si puedes, la varianza — nunca dejes que una sola media cuente toda la historia del hábito.

## Lo que acabas de construir

Un analizador de sueño pequeño y genuinamente útil: analizaste y validaste dos horas de reloj, calculaste la duración que cruza media noche correctamente, puntuaste cada noche contra un objetivo con un empujón de consistencia y una bonificación por dormir de más, añadiste cada noche a un CSV, leíste el historial de vuelta en promedios y comparaste grupos de mes para llamar una tendencia. El código transferible es más amplio que el sueño: el bucle de entrada `parse_time` con errores ruidosos, la matemática del giro de medianoche, la disciplina CSV de "encabezado una vez / añade para siempre" y el escepticismo de "el promedio no es la extensión" son todos hábitos que usarás en cualquier script con forma de datos.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/sleep-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/sleep-analyzer) en el repositorio del curso agrupa el módulo del analizador, un `sleep_log.csv` sembrado y un notebook que calcula duraciones, puntajes, promedios y una tendencia en línea (con gráficos como salidas de celda). Clónalo, o abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y empieza a registrar.
:::

## A dónde ir desde aquí

- **Una semana real, no un mes:** agrupa por `(datetime - timedelta(days=date.weekday()))` para grupos genuinos de 7 días — el arreglo del Paso 5, codificado.
- **Reporta la extensión también:** añade `min`/`max` (o un `statistics.stdev`) de las duraciones por semana para que la línea de tendencia lleve su variabilidad, cerrando la brecha de "el promedio esconde el vaivén".
- **Un gráfico:** carga el CSV en Matplotlib y dibuja horas-sobre-el-tiempo con el objetivo como una línea punteada — el mismo archivo, ahora una imagen visualizable de un vistazo.
- **Edición multi-semana del CSV:** conecta un pequeño camino de "editar anoche" para que una hora de acostarse corregida reescriba su fila en su lugar, manteniendo el historial veraz después de un error de registro.

## Comparte tu proyecto con la clase

¿Atrapaste tu propia tendencia de sueño mejorando, o construiste un gráfico de tus semanas? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README recorre cómo añadir el tuyo vía un **pull request** de principio a fin: fork, rama, commit y abrir el PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓