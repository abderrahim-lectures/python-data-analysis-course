---
title: "Temporizador de Meditación"
description: "Construye un temporizador de meditación de terminal con campanas de intervalo, un ejercicio guiado de respiración de caja, registro de sesiones y seguimiento de rachas — una sola línea de comando honesta, cero distracciones."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["cli", "time", "file-io", "gamification"]
learningObjectives:
  - "Ejecutar esperas bloqueantes y no bloqueantes con time.sleep y espera cooperativa"
  - "Contar hacia atrás desde una duración y disparar una señal en cada intervalo"
  - "Pedir retroalimentación y añadir filas estructuradas a un registro de sesiones CSV"
  - "Calcular rachas entre fechas con datetime y aritmética de fechas"
prerequisites: ["python-101/loops", "python-101/functions", "python-101/file-io", "python-101/date-time"]
---

# 🧘 Construye un Temporizador de Meditación

Sentarse en una meditación cronometrada tiene un problema que ninguna app del mundo está autorizada a arreglar — el teléfono vibrando, los anuncios, la insistencia de la racha *antes* de que siquiera cierres los ojos. Un temporizador de terminal no tiene nada de eso: un prompt simple, una cuenta regresiva, una campana suave, repetir. Este proyecto construye un pequeño CLI que cuenta una sesión, repica en cada intervalo (para que no estés mirando el reloj), guía un ciclo de respiración de caja 4-4-4-4 y registra silenciosamente cada sesión para que puedas ver crecer tu racha con cero juicio sobre los días de descanso.

Esto asume Python 101 — bucles, funciones, leer y escribir archivos, y manejo básico de fechas. Nada más allá de eso: sin GUI, sin web, sin servicios externos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Contar una sesión de meditación desde minutos hasta una señal agradable de "inhala / exhala".
2. Disparar una campana (campana de terminal) cada N minutos para que nunca tengas que abrir los ojos para verificar.
3. Guiar un ciclo de respiración de caja donde cada fase tiene su propia cuenta regresiva.
4. Registrar cada sesión terminada en un CSV con fecha, duración y una nota de ánimo de una línea.
5. Leer el registro y reportar tu racha actual y los minutos totales meditados.
6. Manejar Ctrl+C con elegancia para que una salida a mitad de sesión recuerde los minutos de hoy — exactamente como una app de rachas que perdona.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — y honestamente el *único* donde los encantos del temporizador aterrizan, porque las campanas y las señales de respiración necesitan o un `time.sleep` real contra un terminal vivo o al menos un reloj de pared real para sentirse como un temporizador. Todo lo de abajo funciona bien también en cualquiera de los tres caminos de notebook, pero un temporizador de meditación en un notebook es como un metrónomo en una hoja de cálculo: la maquinaria está ahí, el punto no.

**GitHub Codespaces** es lo mismo que local — abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y un corto `uv run python meditate.py --minutes 1` hace una sesión real y honesta de un minuto en la pestaña del terminal.

**Google Colab, Kaggle Notebooks y Binder son una forma razonable de *ver el código funcionar* — la lógica de la cuenta regresiva, el ciclo de respiración, el registro CSV y la matemática de rachas se ejecutan de verdad** — pero el notebook ejecuta cada paso como una instantánea rápida y visible en lugar de como una experiencia real de reloj de pared (una celda de `time.sleep` de 10 minutos es una mala meditación). Usa el notebook para aprender la maquinaria; ejecuta el comando de verdad cuando quieras que el temporizador realmente cronometre algo.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meditation-timer/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meditation-timer/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeditation-timer%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de tu primera sesión: `uv` y una carpeta para tener el proyecto.

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
mkdir meditation-timer && cd meditation-timer
uv init --bare
```

Cero paquetes extra — este proyecto es pura biblioteca estándar (`time`, `datetime`, `csv`).

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `meditation-timer/` existe con un `pyproject.toml` de `uv init --bare`.
- ✅ Puedes ejecutar `uv run python -c "import time, datetime; print('time is real')"` y ver el mensaje.
- ✅ Sabes qué es una campana de terminal (en la mayoría de los sistemas es `\a` en una cadena y hace bip o parpadea). La oiremos en el Paso 2.

## Paso 1: Cuenta una sesión simple

Un temporizador es solo un bucle sobre los segundos que te quedan, imprimiendo el tiempo restante y durmiendo un segundo por tick. El modelo mental aquí es el que reutilizarás para descansos, intervalos y el ciclo de respiración: *decide cuánto duran las cosas, luego deja que el bucle drene esa duración un tick a la vez.*

### 1.1 Escribe un temporizador de conteo por minutos

```python
# meditate.py
import time

def countdown(minutes: int) -> None:
    total = minutes * 60
    print(f"Session: {minutes} min — begin. 🧘")
    for remaining in range(total, 0, -1):
        print(f"\r{remaining // 60:02d}:{remaining % 60:02d} left", end="", flush=True)
        time.sleep(1)
    print("\r00:00 left — done. Enjoy the quiet. 🙏")

if __name__ == "__main__":
    countdown(1)  # start with one real minute
```

`range(total, 0, -1)` camina *hacia abajo* desde los segundos completos hasta 1, y cada iteración imprime el tiempo restante y luego bloquea con `time.sleep(1)`. El retorno de carro `\r` (con `end=""` y `flush=True`) reescribe la misma línea en su lugar en lugar de imprimir 60 líneas, y `//` más `%` dividen los segundos en `MM:SS` para un reloj que lee como un temporizador real.

**👟 Pista inicial :** Ejecuta `countdown(1)` y *siéntate atravesando el minuto completo* — sentirás por qué `\r` vence a 60 líneas impresas, y por qué un `time.sleep` de un segundo dentro del bucle es todo el latido de un temporizador.

**🎯 Resultado esperado :** Una línea que muestra `01:00 left`, baja en su lugar hasta `00:00 left`, y luego imprime el mensaje de fin — un minuto completo de 60 segundos después.

**🩹 Si sale mal :** Si se imprimen 60 líneas en lugar de una línea sobrescrita, el trío `\r`/`end=""`/`flush=True` no está completo — el retorno de carro solo (sin `flush=True`) a menudo no se redibuja dentro de la salida capturada. Si la cuenta regresiva termina al instante, `time.sleep(1)` pudo haberse colocado *fuera* del bucle — debe hacer tick en cada iteración.

### 1.2 Verifica la cuenta regresiva

**✅ Lista de verificación**

- ✅ `countdown(1)` tarda unos reales 60 segundos y dibuja una sola línea `MM:SS` que llega a `00:00`.
- ✅ `countdown(5)` formatea `05:00` → `04:59` → … sin saltar — la matemática `// 60`/`% 60` es estable.
- ✅ `countdown(0)` imprime el mensaje de fin inmediatamente (una sesión-cero honestamente pitónica).

**🤔 Pregunta(s) socrática(s)**

- El bucle duerme exactamente 1 segundo por tick pero *imprimir también toma tiempo*, así que el tiempo real transcurrido siempre excede ligeramente `minutes * 60`. ¿Dónde se acumula la deriva — y cuál es una reescritura basada en `time.monotonic()` (calcula la fecha límite, luego `sleep` hasta ella) que mantenga honesto a un temporizador de 10 minutos al segundo?
- Después del bucle, `remaining` es `0` — pero nunca *ves* una iteración `00:00`, solo el mensaje posterior al bucle. ¿Qué cambio único haría que una línea real `00:00` se imprimiera como parte del progreso del bucle en lugar de como el mensaje de fin?

## Paso 2: Campana en cada intervalo

Un temporizador de meditación que no puede hacer campanas de intervalo no es un temporizador de meditación — todo el punto es una señal en puntos fijos para que nunca mires el reloj a mitad de sesión. En un terminal, "la campana" es el humilde carácter `\a` (BEL): en la mayoría de los terminales hace bip o parpadea invisible, e incluso donde no lo hace, el `bell()` de Python vía `print("\a", end="")` es la misma primitiva de la que las grandes apps extraen sonido bajo el capó.

### 2.1 Añade campanas de intervalo

```python
# meditate.py (continued)

def countdown_with_bells(minutes: int, bell_every: int = 5) -> None:
    total = minutes * 60
    print(f"Session: {minutes} min, bell every {bell_every} min — begin. 🧘")
    for remaining in range(total, 0, -1):
        el = total - remaining                        # seconds elapsed since the start
        if el % (bell_every * 60) == 0 and el > 0:    # exactly on an interval boundary
            print(f"\n   +bell at {el // 60:02d}:00   ({remaining // 60:02d}:{remaining % 60:02d} left)\a",
                  flush=True)
        print(f"\r{remaining // 60:02d}:{remaining % 60:02d} left", end="", flush=True)
        time.sleep(1)

if __name__ == "__main__":
    countdown_with_bells(2, bell_every=1)  # 2 minutes, chime at the 1-minute mark
```

La línea que hace funcionar las campanas es `el % (bell_every * 60) == 0` — segundos transcurridos módulo el intervalo, para que la campana suene *exactamente* cada `bell_every` minutos (y nunca en 0 gracias a `el > 0`). El `\a` viaja en el `end` de la línea de campana para que sea parte del segundo impreso, no una escritura invisible separada, y `el` se recalcula cada tick desde la cuenta regresiva para que la verificación siga siendo correcta sin importar cómo se reordene el bucle después.

**👟 Pista inicial :** Empieza con `bell_every=1` en una sesión corta — dos minutos, una campana — y confirma que la campana (un bip o un parpadeo) cae en la marca de 1:00, no en 0:59 ni en 1:01.

**🎯 Resultado esperado :** Una sesión donde en exactamente un minuto transcurrido se imprime una línea de campana (con el bip/parpadeo del terminal), la cuenta regresiva continúa, y el mensaje de fin llega al final.

**🩹 Si sale mal :** Si la campana nunca suena, `el % (bell_every * 60) == 0` está comparando contra el intervalo equivocado — revisa que multiplicaste `bell_every` por 60, no comparaste contra `bell_every`. Si las campanas suenan en cada tick, falta el guard `el > 0` — sin él, `el == 0` en el primer tick hace que `0 % anything == 0`, así que una campana "0 transcurrido" suena inmediatamente.

### 2.2 Maneja una interrupción con elegancia

```python
# meditate.py (continued)

def countdown_forgiving(minutes: int, bell_every: int = 5) -> None:
    total = minutes * 60
    done = 0.0
    try:
        print(f"Session: {minutes} min — begin. 🧘")
        for remaining in range(total, 0, -1):
            el = total - remaining
            if el % (bell_every * 60) == 0 and el > 0:
                print(f"\n   +bell at {el // 60:02d}:00\a", flush=True)
            print(f"\r{remaining // 60:02d}:{remaining % 60:02d} left", end="", flush=True)
            time.sleep(1)
            done = float(el + 1)
    except KeyboardInterrupt:
        pass
    finally:
        print(f"\n— interrupted or finished after {done:.0f}s ({done / 60:.1f} min) —")

if __name__ == "__main__":
    countdown_forgiving(2, bell_every=1)
```

La forma `try/finally` es el patrón de salida elegante: `Ctrl+C` lanza `KeyboardInterrupt`, el `except` lo traga, y el bloque `finally` *siempre* corre para reportar los segundos realmente completados. `done` se actualiza solo después de que cada segundo real completa, así que una interrupción a mitad de sleep aún cuenta los ticks completados y nunca miente sobre "0 minutos hechos" cuando realmente hiciste 42.

**👟 Pista inicial :** Ejecuta `countdown_forgiving(5, bell_every=2)`, espera ~15 segundos, luego presiona Ctrl+C — el terminal debería reportar la realidad al estilo `158s / 2.6 min`, no un traceback ni un falso `0s`.

**🎯 Resultado esperado :** Presionar Ctrl+C a mitad de sesión imprime una sola línea limpia diciendo cuántos segundos hiciste realmente — sin traceback, sin redibujo parcial — y `finally` garantiza que esa línea se imprima incluso si la interrupción cae exactamente en un tick de campana.

**🩹 Si sale mal :** Si Ctrl+C muestra un traceback, falta el `except KeyboardInterrupt` o está colocado en el `try` equivocado — debe envolver el bucle, no solo el `sleep`. Si los segundos reportados están mal, `done` se actualiza antes de que el sleep complete — solo súbelo *después* de que pase un segundo completo.

### 2.3 Verifica las campanas

**✅ Lista de verificación**

- ✅ `countdown_with_bells(2, 1)` dispara una línea de campana audible exactamente en la marca de 1 minuto.
- ✅ `countdown_forgiving` reporta segundos completados reales cuando lo interrumpes — nunca un traceback, nunca una mentira redondeada hacia arriba.
- ✅ Ninguna campana suena nunca en el primer tick (el guard `el > 0` se sostiene).
- ✅ Puedes explicar por qué `el` es *transcurrido* — calculado como `total - remaining` — en lugar de solo `remaining`.

**🤔 Pregunta(s) socrática(s)**

- Usando `time.sleep(1)` por tick, la verificación de campana corre a lo sumo una vez por segundo. Eso está bien — pero ¿qué deriva del mundo real introduciría un `sleep` de *30 segundos* si "optimizas" el bucle de esa manera, y qué capturaría correctamente `el` de todos modos?
- La campana imprime su propia línea, machacando el `\r` de la cuenta regresiva por un frame. ¿Cuál es el bug de orden de renderizado entre "imprimir la línea de campana" y "redibujar la cuenta regresiva" que un mensaje más largo podría exponer — y cómo sobreviviría tu salida?

## Paso 3: Guía un ciclo de respiración de caja

La respiración de caja es un ritmo fijo — inhala 4s, retén 4s, exhala 4s, retén 4s, repite — y es *el mismo bucle de cuenta regresiva* del Paso 1 con una idea extra: en lugar de un único temporizador que se drena una vez, el ciclo repite una *secuencia* fija de fases, imprimiendo una señal hablada para cada fase mientras corre.

### 3.1 Ejecuta el ciclo de cuatro fases

```python
# breathe.py
import time

BOX = [("Inhale", 4), ("Hold", 4), ("Exhale", 4), ("Hold", 4)]

def breath_cycle(rounds: int = 3, phase_seconds: int = 4) -> None:
    print("Box breathing: In 4 - Hold 4 - Out 4 - Hold 4. Begin. 🌬️")
    for r in range(rounds):
        for name, secs in BOX:
            for left in range(secs, 0, -1):
                print(f"\r{' ' * 20}  {name}… {left}", end="", flush=True)
                time.sleep(1)
    print(f"\r{' ' * 20}  Complete — {rounds} rounds. 👌")

if __name__ == "__main__":
    breath_cycle(rounds=2)
```

La lista de tuplas `BOX` *es* la técnica: el bucle interno sobre `(name, secs)` convierte cuatro fases codificadas en datos, así que un estilo 4-4-8 (la respiración de exhalación larga de los atletas) es un cambio de datos de una línea en lugar de un cambio de código. El relleno de ocho espacios `' ' * 20` en cada `\r` previene que los nombres cortos de fase ("Inhale") dejen caracteres fantasma de los más largos ("Complete").

**👟 Pista inicial :** Ejecuta `breath_cycle(rounds=1)` — una sola ronda de 16 segundos — y *haz la respiración de verdad*; notarás que la señal cambia de fase exactamente en la cuadrícula de 1 segundo, que es toda la experiencia que el bucle del Paso 1 hizo posible.

**🎯 Resultado esperado :** Dos rondas de `Inhale… 4` → `Hold… 4` → `Exhale… 4` → `Hold… 4`, cada fase contando un número por segundo, terminando con `Complete — 2 rounds`.

**🩹 Si sale mal :** Si los nombres de fase sangran entre sí (`Exhale… 3Exhale… 2`), el relleno `\r` es demasiado corto o falta — rellena al menos la longitud del mensaje más largo. Si las respiraciones saltan un número, el `range(secs, 0, -1)` interno está invertido (prueba `-1` vs. `1`) o `time.sleep(1)` se está saltando por un `continue` perdido.

### 3.2 Verifica la guía de respiración

**✅ Lista de verificación**

- ✅ `breath_cycle(1, 4)` tarda 16 segundos y muestra cuatro fases distintas, cada una contada 4→1 en su lugar.
- ✅ La secuencia coincide con `BOX`: Inhale → Hold → Exhale → Hold, nunca Out → In.
- ✅ Ejecutar `breath_cycle(2)` duplica el tiempo total sin repetir el texto de configuración — la configuración se imprime una vez, las fases se repiten.

**🤔 Pregunta(s) socrática(s)**

- `BOX` son datos, los bucles son código. Si quisieras un ciclo *basado en proporción* como 4-7-8, ¿cuál es la edición más pequeña a `BOX` — y qué dice eso sobre codificar la técnica como datos versus recompilar lógica?
- La señal se imprime *antes* del segundo que representa (`Inhale… 4` significa "habita los próximos 4 segundos"). ¿Dónde encaja `sleep` en esa redacción — e imprimir `0` al final de cada fase leería mejor o peor para una respiración real?

## Paso 4: Registra una sesión en CSV

Un rastreador de hábitos que olvida es un juguete; todo el valor de la racha de la meditación viene de un archivo que crece. El Paso 4 hace que cada sesión *terminada* (o interrumpida con elegancia) sea una fila: fecha, minutos y un ánimo de una palabra. Se elige CSV porque es un archivo que un humano puede abrir en cualquier hoja de cálculo y auditar — el código de registro que no puedes leer de vuelta es la forma más rápida de perder confianza.

### 4.1 Añade una fila de sesión

```python
# log.py
from datetime import date
import csv
from pathlib import Path

LOG = Path("sessions.csv")

def log_session(minutes: int, mood: str = "ok") -> None:
    header = ["date", "minutes", "mood"]
    exists = LOG.exists()
    with open(LOG, "a", newline="") as f:
        writer = csv.writer(f)
        if not exists:
            writer.writerow(header)
        writer.writerow([date.today().isoformat(), minutes, mood])

def show_log() -> None:
    with open(LOG, newline="") as f:
        for row in csv.reader(f):
            print(f"{row[0]} — {row[1]:>3} min — {row[2]}")

if __name__ == "__main__":
    log_session(5, "calm")
    log_session(2, "restless")
    show_log()
```

Las dos decisiones que cargan este paso: el encabezado se escribe solo cuando el archivo es *nuevo* (volver a ejecutar el script añade filas en lugar de duplicar el encabezado), y `date.today().isoformat()` guarda las fechas como `YYYY-MM-DD` — un formato que se ordena correctamente como una cadena simple, en la que la matemática de rachas del Paso 5 se apoyará fuerte.

**👟 Pista inicial :** Ejecuta `log.py` dos veces. Primera ejecución: dos filas más el encabezado son nuevos. Segunda ejecución: las mismas dos filas añadidas de nuevo, *sin* segundo encabezado — esa es la prueba de añadir-vs-encabezado pasando.

**🎯 Resultado esperado :** Ejecutar `log.py` dos veces imprime en la segunda ejecución un historial limpio de dos filas de datos (4 líneas en la primera ejecución, 4 líneas de nuevo en la segunda — no 6), cada fila `YYYY-MM-DD — N min — mood`.

**🩹 Si sale mal :** Si el encabezado reaparece en la segunda ejecución, `exists` se calculó *después* de abrir el archivo (que lo crea) — calcúlalo antes de `open(LOG, "a")`. Si las filas muestran basura al estilo `manual override`, una nueva línea final perdida en el CSV está dividiendo una fila en dos — revisa que el archivo termine con una sola nueva línea, no una fila en blanco.

### 4.2 Verifica el registro

**✅ Lista de verificación**

- ✅ Añadir dos veces agrega dos filas y nunca un encabezado duplicado.
- ✅ Cada fila es `date,minutes,mood` con una fecha ISO — puedes abrir `sessions.csv` en una hoja de cálculo y leerla.
- ✅ `show_log` renderiza el archivo de vuelta línea por línea, incluso después de una ejecución fresca.

**🤔 Pregunta(s) socrática(s)**

- Registramos solo la *fecha*, no la hora del día, así que dos sesiones en un día no sobrescriben nada (dos filas, misma fecha). ¿Querrías que la herramienta *fusionara* los minutos del mismo día? ¿Qué preferiría la matemática de rachas del Paso 5 — y qué revela tu respuesta sobre el cliente del modelo de datos?
- El modo `append` escribe una nueva línea al final. Si ejecutaras la herramienta en dos máquinas (una laptop y un teléfono), ¿qué desastre a nivel de sistema de archivos arriesga un log compartido solo-de-añadidos — y cuál es el arreglo barato (pista: lee el archivo, fusiona, reescribe)?

## Paso 5: Calcula tu racha

El log existe para leerse de vuelta; la racha es la lectura que te hace aparecer mañana. Este paso parsea el CSV, ordena las fechas y encuentra el tramo más largo de días consecutivos *y* la racha actual que termina hoy — los dos números que todo rastreador de hábitos muestra. La idea central es que "consecutivo" es solo aritmética de fechas: cada fecha es la anterior más un día.

### 5.1 Parsear y calcular la racha

```python
# streak.py
from datetime import date, timedelta
import csv
from pathlib import Path

LOG = Path("sessions.csv")

def session_dates(path: Path = LOG) -> list[date]:
    days = set()
    with open(path, newline="") as f:
        for row in csv.reader(f):
            if row and row[0].lower() != "date":
                days.add(date.fromisoformat(row[0]))
    return sorted(days)

def best_streak(days: list[date]) -> tuple[int, date]:
    best = 0
    run = 0
    end = None
    prev = None
    for d in days:
        run = run + 1 if prev is None or (d - prev).days == 1 else 1
        if run > best:
            best, end = run, d
        prev = d
    return best, end

if __name__ == "__main__":
    days = session_dates()
    print(f"{len(days)} meditated day(s) on record")
    print(f"longest streak: {best_streak(days)[0]} days")
```

La *definición* de la racha vive en una línea: `(d - prev).days == 1` — un día continúa una racha solo cuando es exactamente el siguiente día de calendario después del anterior. Un `set()` al inicio elimina las sesiones dobles del mismo día, y `sorted()` garantiza que el bucle siempre camine las fechas en orden creciente sin importar el orden de añadidos del CSV.

**👟 Pista inicial :** Escribe una batería rápida de listas de fechas diminutas (`["2026-08-03","2026-08-04","2026-08-05"]` debería dar `best == 3`) *antes* de apuntarla a sesiones reales — la función de racha es donde se esconden los off-by-one, y los fixtures verificados a mano los encuentran más rápido.

**🎯 Resultado esperado :** Con la muestra del Paso 4 (`08-03`, `08-05` — un hueco de un día), la salida es `2 meditated day(s) on record` y `longest streak: 1 days`, porque las dos fechas *no* son consecutivas.

**🩹 Si sale mal :** Si una racha de tres días reporta `2`, la verificación `== 1` está mal encasillada (decir `(d - prev).days >= 1` sí incluye huecos — debe ser exactamente `1`). Si la fila de encabezado del CSV contamina el set, falta el guard `row[0].lower() != "date"` o el encabezado no es `date`; imprime las primeras fechas parseadas para verlo.

### 5.2 Verifica la racha

**✅ Lista de verificación**

- ✅ `best_streak` sobre listas construidas a mano devuelve el tramo más largo correcto (3 para tres días consecutivos, 1 para dos fechas separadas por un día).
- ✅ Las filas de encabezado nunca se convierten en fechas de sesión.
- ✅ Dos sesiones en la misma fecha cuentan como un día — la deduplicación del `set` se sostiene.
- ✅ Puedes explicar si esto cuenta una racha que *terminó ayer* como igual a una que aún corre hoy.

**🤔 Pregunta(s) socrática(s)**

- `best_streak` devuelve la racha más larga *de todos los tiempos* pero no la "¿estoy en una racha ahora mismo?" actual. ¿Cuál es la verificación extra, comparando la última fecha con `date.today()`, que convierte `best` en "actual" — y qué debería reportar cuando hoy es un día de descanso pero ayer se meditó?
- La definición de racha trata *cualquier* hueco como un reinicio. Las apps de hábitos reales perdonan un día perdido (un "desliz" vs una "recaída"). ¿Cómo cambiaría la verificación para perdonar un solo hueco — y qué hace eso con el significado del número?

## ⚠️ Errores comunes

- **Olvidar el flush.** La cuenta regresiva funciona localmente pero se ve congelada en logs capturados o notebooks porque `print(..., end="")` almacena en buffer. `flush=True` en cada escritura `\r` no es opcional cuando la salida se canaliza o captura.
- **Off-by-one en la verificación de campana.** `el % interval == 0` dispara en `0`, lo que coloca la "primera campana" un tick temprano — el guard `el > 0` es todo el arreglo, y omitirlo hace que una sesión de 1 minuto aplauda raramente en el segundo 0.
- **Saltarse el `try/finally` en las interrupciones.** Un temporizador que muere con un traceback en Ctrl+C reporta mentiras ("hice 0 minutos") y corrompe la historia del registro de sesiones. El `finally` que siempre imprime los segundos completados es lo que hace que salir *no* sea un fallo.
- **Doble conteo de la misma fecha en las rachas.** Ejecutar el temporizador dos veces en un día añade dos filas, y un escáner ingenuo cuenta dos "días" — inflando la racha en dos por cero días extra. Deduplica fechas (un `set`) antes de cualquier matemática de días consecutivos.
- **Una fila de encabezado que se vuelve una fecha.** El CSV empieza con `date,minutes,mood`, y `date.fromisoformat("date")` lanza — convirtiendo una toma de log trivial en un crash. O salta el encabezado en el lector (el guard `!= "date"`) o separa las filas de datos de los encabezados; elige uno y sé consistente.
- **Deriva de `time.sleep` en sesiones largas.** Cada tick de 1 segundo más el overhead de impresión empuja una sesión de 30 minutos más allá de 30:00. Para la *meditación* esto es prácticamente irrelevante; si alguna vez cronometras con más precisión, un bucle de fecha límite absoluta con `time.monotonic()` elimina la deriva — y `sleep(1)` sigue feliz mientras tanto.

## Lo que acabas de construir

Un temporizador de meditación real: una cuenta regresiva que dibuja una línea limpia, campanas de intervalo que nunca tienes que verificar, una guía de respiración de caja, un registro de sesiones CSV solo-de-añadidos y una matemática de rachas honesta que no halaga. La habilidad transferible es todo el kit de *event-loop en un terminal*: contabilidad transcurrido-vs-restante, tick cooperativo de `time.sleep`, interrupción elegante y estado respaldado por archivos — las primitivas exactas detrás de cada temporizador de intervalos, monitor de uptime, app de cuenta regresiva y rastreador de hábitos que escribirás de aquí en adelante. Una sesión de 10 minutos de un amigo está a 600 segundos honestos, redibujados por print y con campana cuando debe, de distancia.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/meditation-timer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meditation-timer) en el repositorio del curso agrupa los módulos de temporizador, guía de respiración, registro y racha además de un notebook que ejecuta cada pieza como una instantánea visible. Clónalo, o abre el repositorio completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecuta las celdas en una pestaña del navegador.
:::

## A dónde ir desde aquí

- Añade una línea de **racha actual**: verifica la última fecha contra `date.today()` y reporta "vas en el día N" — una variante más de `best_streak`, y el número que realmente revisarás a diario.
- Añade un **informe semanal**: suma los minutos por semana ISO e imprime una pequeña gráfica de barras de ascii `▁▃▅▇` — el mismo hábito de agrupación del log, ahora sobre una ventana rodante de 8 semanas.
- Añade **comandos de historial** (`--last 7`, `--since 2026-08-01`) que filtren el CSV antes de la matemática de rachas, construidos sobre la misma lectura `csv` en la que ya confías.
- Cambia el `BOX` fijo por una bandera `--technique` — `box`, `478`, `long-exhale` — cada una una lista de tuplas diferente; los bucles no cambian, los datos sí.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso — un temporizador que realmente corrió, una racha que no rompiste, una sesión de respiración que terminaste? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README te guía para añadir el tuyo mediante una **pull request** de principio a fin: fork, rama, commit y apertura de la PR. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓