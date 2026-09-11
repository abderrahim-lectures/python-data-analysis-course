---
title: "Motor de Analítica de Streaming"
description: "Procesa un flujo de eventos en vivo con agregaciones de ventana deslizante, detección de picos frente a una línea base móvil, joins de streams y presión de retroceso de buffer limitado — todo en generadores puros de Python."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["generators", "data-processing", "real-time"]
learningObjectives:
  - Construye un generador de eventos de estilo infinito con generadores de Python
  - Agrega un flujo con una ventana de tiempo deslizante
  - Detecta picos frente a una línea base móvil
  - Une dos flujos de eventos correlacionados
  - Aplica presión de retroceso de buffer limitado sin perder el pipeline central
prerequisites:
  - "Fundamentos de Python (funciones, bucles, diccionarios)"
  - "Comodidad con generadores y yield"
  - "Comprensión básica de listas y matemáticas de tiempo"
---

# 🛠️ ⚡ Motor de Analítica de Streaming

Los paneles que muestran "usuarios activos ahora mismo" no recalculan toda la base de datos en cada tic — consumen un flujo interminable de eventos y mantienen una pequeña ventana, actualizada constantemente, de lo que acaba de suceder. Este proyecto construye ese motor en Python puro: un generador que emite un flujo de eventos realista, una ventana deslizante que mantiene los promedios al día, detección de picos frente a una línea base móvil, un join que correlaciona las compras con las vistas de página que las precedieron y, por último, un buffer limitado para que un estallido de eventos ralentice el pipeline en lugar de reventar su memoria.

Esto asume Python 101 y comodidad con los generadores — no se requieren paquetes externos ni nada de Análisis de Datos más allá de eso. Es opcional y no se califica; consulta [Proyectos del Mundo Real](/es/proyectos) para ver la lista completa y en crecimiento.

## 🎯 Lo que harás

1. Escribir un generador que emita un feed de eventos con marca de tiempo de estilo ilimitado.
2. Mantener una ventana de tiempo deslizante y emitir un promedio actualizado por cada límite.
3. Marcas de eventos que se disparan por encima de una línea base móvil, no de un número fijo.
4. Unir los eventos de compra con la vista de página que un usuario hizo antes.
5. Acotar el pipeline con un buffer con tope y ejecutar cada etapa de principio a fin.

## Dónde ejecutar esto

**Localmente con `uv`** es la ruta principal. Este motor es biblioteca estándar pura — `uv init` y ya estás ejecutando — y cada etapa es una función que puedes llamar, inspeccionar y volver a ejecutar desde una terminal exactamente como está escrita abajo.

**Google Colab, Kaggle Notebooks y Binder** ejecutan cada paso de forma idéntica, porque no hay dependencias externas que instalar ni archivos que necesiten persistir entre celdas. La salvedad honesta: las celdas de un notebook reemplazan la *salida de terminal* de este motor por la salida del notebook, así que lo que pierdes es la sensación de "volver a ejecutar el flujo y ver cómo cambia". Usa las insignias para ver todo el pipeline en un clic, y cambia a `uv` local en cuanto quieras apuntar el generador a un archivo o socket real.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/streaming-analytics/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/streaming-analytics/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fstreaming-analytics%2Fnotebook.es.ipynb)

## Configuración

Crea el proyecto. Como el motor usa solo la biblioteca estándar, no hay nada que instalar.

```bash
uv init streaming-analytics
cd streaming-analytics
```

```bash
uv run python -c "from collections import deque; import random, datetime; print('ok')"
```

Los tres imports cubren toda la superficie de dependencias de este proyecto: `deque` para las ventanas deslizantes (del Paso 2 en adelante), `random` para el flujo sintético (Paso 1) y `datetime`/`timedelta` para las marcas de tiempo de los eventos contra las que se mide cada ventana.

**✅ Lista de verificación**

- ✅ `uv init streaming-analytics` creó una carpeta con un `pyproject.toml`.
- ✅ `uv run python -c "from collections import deque; import random, datetime"` imprime `ok` — cero paquetes añadidos.

## Paso 1: Construye un generador de flujo de eventos en vivo

Todo motor de analítica comienza en el mismo lugar: eventos llegando uno a la vez, para siempre. Los generadores de Python son la forma honesta de modelar eso — una función que `yield`s eventos de forma perezosa se ve exactamente como un feed en vivo para todo lo que está en el flujo aguas abajo, sin necesitar realmente un servidor.

### 1.1 Emite eventos con marca de tiempo

**👟 Pista inicial :** Crea un dataclass para la forma del evento y luego un generador que `yield`s un evento por iteración con una marca de tiempo sembrada y monótonamente creciente.

```python
# stream.py
import random
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class Event:
    ts: datetime
    kind: str
    value: float

def event_stream(events: int = 50, seed: int = 3):
    """Yield events lazily, as if arriving from a live feed."""
    random.seed(seed)
    now = datetime(2026, 1, 1, 9, 0, 0)
    for _ in range(events):
        kind = random.choice(["view", "click", "purchase"])
        value = {"view": random.randint(5, 15),
                 "click": random.randint(1, 4),
                 "purchase": random.choice([0, 1])}[kind]
        now += timedelta(seconds=random.randint(1, 3))
        yield Event(ts=now, kind=kind, value=value)

for ev in event_stream(5):
    print(ev.ts.strftime("%H:%M:%S"), ev.kind, ev.value)
```

El `@dataclass` te da un `Event` legible e inmutable sin escribir un constructor. El generador es la idea que carga con el peso: `event_stream` no computa nada hasta que se *itera*, y cada `yield` lo suspende a mitad del bucle — exactamente la forma de un feed que sigue produciendo después de que hayas consumido 50 eventos. Las marcas de tiempo avanzan por un random de 1–3 segundos por evento, así que las ventanas y los joins posteriores tienen tiempos desiguales y realistas con los que trabajar en lugar de un tic perfectamente regular.

**🎯 Resultado esperado :** Cinco líneas como `09:00:00 click 3`, cada una con una marca de tiempo posterior a la última y uno de los tres tipos de evento.

**🩹 Si sale mal :** Si cada marca de tiempo es idéntica, falta `now +=` así que el reloj nunca avanza. Si iterar dos veces da tipos diferentes, falta `random.seed(seed)`, lo que hace que el flujo no sea reproducible. Si `Event` aparece como no-picklable o verboso, falta el decorador `@dataclass` así que los atajos de igualdad/`__repr__` no existen.

### 1.2 Verifica el flujo

**✅ Lista de verificación**

- ✅ `event_stream(5)` imprime 5 eventos con marcas de tiempo estrictamente crecientes.
- ✅ La misma semilla produce la misma secuencia de eventos en ejecuciones repetidas.
- ✅ Puedes explicar por qué un *generador* modela un feed en vivo mejor que devolver una lista preconstruida.

**🤔 Pregunta(s) socrática(s)**

- Cuando llamas a `event_stream(50)`, aún no existen eventos — ¿dónde se gasta la memoria del código antes de la primera llamada a `next()`, y por qué es exactamente lo que quiere un consumidor de feed real?
- Cada evento avanza el reloj por un random de 1–3 segundos. ¿Qué cambiaría en las ventanas del Paso 2 si `timedelta` fuera siempre exactamente 2 segundos?

## Paso 2: Añade una ventana de tiempo deslizante

Un flujo que no puedes resumir es solo ruido. Este paso construye una ventana deslizante — "los últimos 10 segundos de eventos, mantenidos frescos" — y emite un promedio en ejecución cada vez que la ventana se desliza hacia adelante, que es la forma de un número de "actividad reciente" en vivo.

### 2.1 Agrega los últimos `window_s` segundos

**👟 Pista inicial :** Usa un `deque` como ventana, empuja cada evento a la derecha, haz `popleft` de cualquier cosa más antigua que `window_s` a la izquierda y emite el promedio cuando el reloj cruza un límite de paso.

```python
# stream.py (continuación)
from collections import deque

def windowed_average(stream, window_s: int = 10, step_s: int = 3):
    """Emit the average of the last window_s seconds at each step boundary."""
    window: deque[Event] = deque()
    boundary = None
    for ev in stream:
        window.append(ev)
        while (ev.ts - window[0].ts).total_seconds() > window_s:
            window.popleft()
        if boundary is None or ev.ts >= boundary:
            boundary = ev.ts + timedelta(seconds=step_s)
            avg = sum(e.value for e in window) / len(window)
            yield ev.ts, round(avg, 2)

for ts, avg in windowed_average(event_stream(30), window_s=10, step_s=4):
    print(ts.strftime("%H:%M:%S"), "window avg:", avg)
```

Dos cosas hacen que esto sea O(1)-ish por evento en lugar de un re-escaneo del historial: el `deque` — cuyo `.append` derecho y `.popleft` izquierdo son ambos de tiempo constante — y el bucle `while` que expulsa los eventos caducados comparándolos con `window[0]`, el superviviente más antiguo. Como los eventos llegan en orden de marca de tiempo, una comprobación contra el extremo izquierdo es suficiente para mantener toda la ventana fresca. La lógica de `boundary` es lo que convierte una ventana continua en *salida* periódica: solo emite cuando el evento más reciente ha pasado el siguiente límite de paso, así que obtienes un promedio legible por paso en lugar de uno por evento.

**🎯 Resultado esperado :** Unas pocas líneas impresas, p. ej. `09:00:13 window avg: 6.67`, una por límite de paso, cada una cubriendo aproximadamente los últimos 10 segundos simulados.

**🩹 Si sale mal :** Si el promedio de cada fila es enorme, falta el `while` de expulsión así que la ventana crece para siempre. Si no imprime nada, el flujo que pasaste tiene menos eventos que un paso — pasa un conteo de `events` mayor. Si las marcas de tiempo parecen solaparse de forma extraña, `window_s`/`step_s` están intercambiados, haciendo que la ventana sea más larga que la entrada.

### 2.2 Verifica la ventana

**✅ Lista de verificación**

- ✅ Se imprime un promedio por ~4 segundos simulados, cada uno cubriendo los ~10 segundos anteriores.
- ✅ El tamaño de la ventana permanece acotado: volver a ejecutar con más eventos nunca aumenta el número de eventos retenidos a la vez.
- ✅ Puedes explicar por qué `window[0]` es la única comprobación de caducidad necesaria.

**🤔 Pregunta(s) socrática(s)**

- La ventana emite promedios en un *límite de paso* fijo en lugar de por evento. ¿En qué panel real muestrear-en-límite se desviaría mal, y qué cambiarías para emitir exactamente por evento?
- La ventana almacena `value` y recalcula la suma en cada emisión. ¿Qué variables de ejecución separadas harían que la emisión del promedio fuera verdaderamente de tiempo constante sin importar la longitud de la ventana?

## Paso 3: Detecta picos frente a una línea base móvil

La detección de anomalías en un flujo no puede usar un umbral fijo — el tráfico naturalmente alcanza su pico al mediodía y muere a las 3am. Este paso marca los eventos que superan una *línea base móvil*, así que "demasiado alto" significa "alto para este momento".

### 3.1 Marca eventos por encima del promedio en vivo

**👟 Pista inicial :** Mantén un `deque` de valores recientes como línea base, calcula su media y emite cualquier cosa que supere la media por un multiplicador configurado.

```python
# stream.py (continuación)
def detect_spikes(stream, window_s: int = 15, multiplier: float = 3.0):
    """Yield events whose value exceeds `multiplier * recent-average`."""
    recent: deque[Event] = deque()
    for ev in stream:
        recent.append(ev)
        while (ev.ts - recent[0].ts).total_seconds() > window_s:
            recent.popleft()
        baseline = sum(e.value for e in recent) / len(recent)
        if baseline > 0 and ev.value > multiplier * baseline:
            yield ev.ts, ev.kind, ev.value, round(baseline, 2)

for ts, kind, value, baseline in detect_spikes(event_stream(200), window_s=15, multiplier=2.5):
    print(ts.strftime("%H:%M:%S"), f"{kind:>8} {value:>3} vs baseline {baseline}")
```

La idea es comparar contra *dónde está el flujo ahora mismo*, no contra un promedio global. Con `multiplier=2.5`, una `view` de 25 dispara una alerta cuando los últimos 15 segundos promediaron 10, pero el *mismo* valor queda en silencio si la línea base ya es 30 — porque un evento que es normal para un período ocupado es un pico en uno tranquilo. El guard `baseline > 0` importa: una ventana que por casualidad contiene solo ceros no debe convertir la comparación en un patológico `0 > 0` de dividir-por-cualquier-cosa.

**🎯 Resultado esperado :** Menos líneas de salida que eventos de entrada (200 → aproximadamente un puñado), cada una mostrando un valor de evento muy por encima de su propia línea base móvil — nunca una inundación de cada evento.

**🩹 Si sale mal :** Si se imprime *todos* los eventos, el multiplicador es demasiado bajo o la ventana de línea base es tan corta que solo contiene el único evento más fuerte. Si dos salidas consecutivas comparten la misma marca de tiempo, falta el `while` de expulsión así que la línea base incluye futuros... *pasados* eventos para siempre. Si no imprime nada en absoluto, `multiplier=2.5` es poco probable con la semilla que usaste — prueba 1.5 para ver dispararse las detecciones.

### 3.2 Verifica la detección de picos

**✅ Lista de verificación**

- ✅ `detect_spikes` imprime solo una pequeña fracción del flujo.
- ✅ El valor de cada evento marcado supera 2.5× su propia línea base móvil.
- ✅ Puedes explicar por qué el mismo valor absoluto a veces es un pico y a veces no.

**🤔 Pregunta(s) socrática(s)**

- Una semana lenta y constante significa que la línea base móvil *es* el pico — una rampa gradual nunca supera 2.5×. ¿Qué test extra detectaría una tendencia que va de 10 a 30 a lo largo de una hora?
- El multiplicador es constante. ¿Cómo se comportaría el detector en una plataforma que normalmente es tranquila pero tiene un estallido anual legítimo, y qué necesitarías para mantener la alerta útil durante ese estallido?

## Paso 4: Une dos flujos correlacionados

Una vista de página solitaria es intrascendente; una vista de página seguida rápidamente por una *compra* del mismo usuario es la historia. Los joins correlacionan eventos que referencian la misma clave (aquí, un usuario) dentro de un presupuesto de tiempo — el pariente tranquilo de un `JOIN` de SQL, hecho sobre el tiempo en lugar de sobre tablas.

### 4.1 Correlaciona compras con vistas anteriores

**👟 Pista inicial :** Dale al flujo una clave `user`, recuerda el tiempo de la vista de página más reciente de cada usuario y emite una fila de "convertido" cuando llega una compra dentro de la ventana de lookback.

```python
# stream.py (continuación)
def user_stream(events: int = 80, seed: int = 5):
    random.seed(seed)
    users = [f"u{i}" for i in range(8)]
    now = datetime(2026, 1, 1, 9, 0, 0)
    for _ in range(events):
        uid = random.choice(users)
        kind = random.choices(["page_view", "purchase"], weights=[80, 20])[0]
        now += timedelta(seconds=random.randint(1, 4))
        yield {"ts": now, "user": uid, "kind": kind}

def correlated_join(stream, lookback_s: int = 30):
    """Yield (user, seconds-after-view) for purchases within lookback_s of a view."""
    last_view: dict[str, datetime] = {}
    for ev in stream:
        if ev["kind"] == "page_view":
            last_view[ev["user"]] = ev["ts"]
        elif ev["kind"] == "purchase" and ev["user"] in last_view:
            age = (ev["ts"] - last_view[ev["user"]]).total_seconds()
            if age <= lookback_s:
                yield ev["user"], round(age, 1), "converted"

for user, age, label in correlated_join(user_stream(120)):
    print(f"{user} purchased {age}s after viewing -> {label}")
```

El join es un diccionario con clave por la clave de join (`user`) más un presupuesto de tiempo: `last_view` recuerda *solo* la vista más reciente de cada usuario, y una compra lo consulta en lugar de re-escanear todos los eventos anteriores. La comparación `age <= lookback_s` es lo que convierte una correlación incondicional en una acotada por tiempo — una compra cinco minutos después de una vista probablemente no es el mismo viaje. Como el buffer almacena una marca de tiempo por usuario activo, su memoria es proporcional al número de usuarios distintos, no al número de eventos — la misma razón por la que los motores reales mantienen estado por clave y expiran las claves obsoletas.

**🎯 Resultado esperado :** Un puñado de conversiones impresas (alrededor del 20% de los eventos son compras, y solo algunas tienen una vista dentro de 30s), cada una como `u3 purchased 12.3s after viewing -> converted`.

**🩹 Si sale mal :** Si cada compra se convierte, la comprobación `age <= lookback_s` no está o `lookback_s` es enorme. Si nada se convierte, los valores de `kind` de `user_stream` no coinciden con las cadenas que comprueba el join. Si la vista *antigua* de un usuario sigue emparejando compras minutos después, `last_view[user] = ev["ts"]` se sobrescribe solo en las vistas como se pretende — pero las claves obsoletas nunca se expulsan, que es la deriva a vigilar en un flujo largo.

### 4.2 Verifica el join

**✅ Lista de verificación**

- ✅ Cada conversión emitida muestra una compra que llega después de la vista de su usuario.
- ✅ El conteo de filas de salida está muy por debajo del conteo de compras (join acotado por tiempo).
- ✅ Puedes nombrar la clave de join (`user`) y el presupuesto de tiempo (`lookback_s`) sin mirar el código.

**🤔 Pregunta(s) socrática(s)**

- El join almacena en buffer solo la vista *más reciente* por usuario. ¿Qué cambiaría en las conversiones si en su lugar almacenaras en buffer la primera vista del usuario del día?
- Los joins de streams reales también deben *expirar* claves que nadie toca. Si `lookback_s` acotaba la ventana del join, ¿por qué el dict `last_view` no está ya acotado — y qué podría crecer sin límite en un join de larga duración?

## Paso 5: Acota el pipeline con presión de retroceso

Un stream real puede superar a su consumidor — un estallido de mil eventos impide que el proceso se mantenga al día, y la respuesta ingenua (guardarlo todo) es cómo un pico de un segundo se convierte en un fallo de memoria. La presión de retroceso significa que el consumidor *le dice* al productor que se ralentice, representada aquí honestamente como un buffer acotado que descarta en lugar de crecer.

### 5.1 Añade un buffer acotado y ejecuta todo

**👟 Pista inicial :** Pon un tope a la pila pendiente en `max_pending` eventos, llama a un hook cuando se alcanza el tope y luego compón cada etapa para que todo el motor corra desde un solo `__main__`.

```python
# stream.py (continuación)
def with_backpressure(stream, max_pending: int = 8, on_overflow=None):
    """Mirror a bounded queue: absorb up to max_pending events, drop the rest."""
    on_overflow = on_overflow or (lambda ev: None)
    pending: list = []
    for ev in stream:
        if len(pending) < max_pending:
            pending.append(ev)
        else:
            on_overflow(ev)
    return pending

def main() -> None:
    dropped: list = []
    def count_drop(ev): dropped.append(ev)

    feed = event_stream(300)
    buffered = with_backpressure(feed, max_pending=8, on_overflow=count_drop)

    windows = list(windowed_average(iter(buffered), window_s=10, step_s=4))
    spikes = list(detect_spikes(iter(buffered), window_s=15, multiplier=2.5))
    joins = list(correlated_join(user_stream(200)))

    print(f"buffered: {len(buffered)}  dropped: {len(dropped)}")
    print(f"windows emitted: {len(windows)}  spikes: {len(spikes)}  conversions: {len(joins)}")

if __name__ == "__main__":
    main()
```

`with_backpressure` hace visible el intercambio: hasta `max_pending` eventos esperan en la fila, cualquier cosa más allá se *descarta* y se reporta a través del hook `on_overflow` en lugar de perderse en silencio o acumularse en silencio. Componer cada etapa sobre `iter(buffered)` muestra la otra propiedad que vale la pena probar — cada función aguas abajo de los Pasos 2–4 consume cualquier iterable de forma perezosa, así que el pipeline sigue siendo una cadena de pequeños lectores en lugar de un bucle monolítico. Los conteos de `main()` te dan una señal de extremo a extremo: ventanas, picos y conversiones todos calculados desde el mismo feed acotado, con el desbordamiento visible como un número en lugar de un fallo.

**🎯 Resultado esperado :** Un bloque de resumen único, p. ej. `buffered: 300  dropped: 0  windows emitted: 54  spikes: 9  conversions: 4` — cada etapa corrió, nada lanzó una excepción.

**🩹 Si sale mal :** Si aparece un `TypeError` sobre un argumento faltante, a una etapa se le está entregando el *resultado* de una etapa en lugar de un iterable — pasa `iter(buffered)` de forma consistente. Si `dropped` es distinto de cero en un feed de 300 eventos, se está alcanzando `max_pending=8` a mitad del flujo, lo cual es un comportamiento correcto; confirma que el descarte coincidía con tu intención antes de entrar en pánico. Si `detect_spikes` necesita un feed más largo, aumenta el conteo de `events`, no el multiplicador.

### 5.2 Verifica de extremo a extremo

**✅ Lista de verificación**

- ✅ `uv run python stream.py` imprime el bloque de resumen sin traceback.
- ✅ Cada etapa de la lista consumió el mismo feed `buffered` acotado.
- ✅ `main()` está protegido por `if __name__ == "__main__":` así que importar `stream.py` en un test no ejecuta el pipeline.

**🤔 Pregunta(s) socrática(s)**

- `with_backpressure` descarta eventos en lugar de bloquear al productor. ¿Qué *pierde* un consumidor al descartar durante un estallido, y qué registrarías junto a cada evento descartado para hacer la pérdida auditable?
- Las cuatro etapas leen la misma lista `buffered` en secuencia, así que todo el pipeline debe terminar la Etapa 1 antes de que empiece la Etapa 2. ¿Qué cambiaría acerca de la latencia si las etapas corrieran *concurrentemente* — y qué problema de sincronización tendrías que resolver de pronto?

## ⚠️ Errores comunes

- **Re-generar tu flujo a mitad del pipeline.** Las etapas consumen los iteradores una vez; llamar a `event_stream()` una segunda vez produce un flujo (sembrado) nuevo, así que las ventanas y los picos se calculan sobre eventos *diferentes* y los números no coinciden. Solución: genera una vez y pásalo (o `iter(buffered)`) a cada etapa, como en el Paso 5.
- **Ventanas que nunca expulsan.** Olvidar el bucle `while … popleft` hace que la ventana crezca para siempre, así que el "promedio de los últimos 10 segundos" se convierte en silencio en "promedio de todo hasta ahora". Solución: siempre expulsa del extremo izquierdo después de añadir.
- **Comparar un umbral fijo en lugar de una línea base.** Un `value > 25` codificado dispara constantemente en las horas ocupadas y nunca en las tranquilas; `multiplier * rolling_average` del Paso 3 es lo que mantiene las detecciones relativas al tráfico actual.
- **Joins sobre un diccionario que nunca envejece.** `last_view` crece un slot por usuario distinto y nunca se encoge, así que un join de larga duración pierde memoria. Solución: expira las claves obsoletas que no hayas visto dentro de la ventana de lookback.
- **Buffers acotados que descartan en silencio.** Un diseño de presión de retroceso real no puede solo `discard`; debe hacer visible el desbordamiento. El hook `on_overflow` del Paso 5 es la diferencia entre un descarte instrumentado y una pérdida de datos silenciosa.

## Lo que acabas de construir

Un motor de analítica de streaming funcional: un generador de eventos, un resumidor de ventana deslizante, detección de picos de línea base móvil, un join acotado por tiempo y un buffer acotado con presión de retroceso visible — cada etapa una función pequeña y componible en Python puro, sin paquetes de terceros. La habilidad transferible es *procesar datos a medida que llegan en lugar de después de almacenarlos*: una vez que hayas construido una ventana `deque` y un generador, los paneles en vivo, los bucles de monitoreo y los procesadores de eventos dejan de ser misteriosos y se convierten en las mismas cinco funciones.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/streaming-analytics/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/streaming-analytics) en el repo del curso es una versión más completa del código anterior, incluido un feed de eventos imprimible y un desglose por etapa. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Apunta el generador a una fuente real — un archivo al que se le esté añadiendo, o un socket — para que el "flujo" sean eventos en vivo reales en lugar de aleatoriedad sembrada.
- Añade sesionización al join: agrupa las vistas de un usuario en una sesión lógica y luego atribuye una compra a la sesión en la que aterrizó (así es como las herramientas de atribución reales reportan "conversiones por sesión").
- Reemplaza la media recalculada de `windowed_average` por variables `count`/`sum` incrementales para que la emisión sea de tiempo constante a cualquier longitud de ventana.
- Persiste ventanas y picos en un archivo JSONL con un escritor de vaciado-por-lote, convirtiendo el pipeline en vivo en algo que un panel pueda leer.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
