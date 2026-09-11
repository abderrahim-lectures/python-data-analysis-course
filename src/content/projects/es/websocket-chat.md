---
title: "App de Chat en Tiempo Real"
description: "Construye un servidor de chat en tiempo real con asyncio y websockets: manejador de eco, difusión por salas, reproducción de historial y presencia, y un cliente de chat de terminal."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["networking", "async", "cli"]
learningObjectives:
  - Mover mensajes sobre un WebSocket con un manejador de coroutine
  - Difundir a múltiples clientes conectados con asyncio
  - Enrutar mensajes dentro de salas usando la ruta de conexión
  - Reproducir historial y eventos de presencia a los recién llegados
  - Impulsar un cliente de chat desde stdin con run_in_executor
prerequisites:
  - "Fundamentos de Python (funciones, conjuntos, tuplas)"
  - "Fundamentos de asyncio (async def, await, asyncio.run, asyncio.gather)"
  - "Una segunda terminal abierta para la demo en vivo de dos terminales"
---

# 🛠️ 💬 App de Chat en Tiempo Real

Una app de chat es la introducción más suave posible a las redes: los mensajes salen por un socket, entran los mensajes, repetir. Casi toda experiencia "en vivo" — multijugador, notificaciones, cursores colaborativos — es este bucle con otras ropas. Este proyecto construye uno de verdad: un manejador de eco, luego difusión por salas, luego historial y reproducción de presencia para cualquiera que llegue tarde, y finalmente un cliente de terminal con el que puedes chatear de verdad entre dos terminales. Todo es asyncio + `websockets`, sin navegador y sin relleno.

Esto asume Python 101 más un poco de async — no se requiere nada de Análisis de Datos. Es opcional y no se califica; consulta [Proyectos del Mundo Real](/es/proyectos) para ver la lista completa y en crecimiento.

## 🎯 Lo que harás

1. Enviar y traer mensajes sobre un WebSocket con un manejador de coroutine.
2. Difundir el mensaje de un cliente a cada otro cliente conectado.
3. Enrutar mensajes dentro de salas separadas por ruta de conexión.
4. Reproducir historial de sala y eventos de presencia a un cliente que llega tarde.
5. Construir un cliente de terminal impulsado por stdin y chatear entre dos terminales.

## Dónde ejecutar esto

**Localmente con `uv`** es el único lugar donde funciona el *chat en vivo de dos terminales*, porque un servidor de chat es un proceso que debe permanecer corriendo. Pero cada paso hasta la demo en vivo final mantiene el servidor y sus clientes de prueba en un solo `asyncio.run()`, así que las mismas celdas corren sin modificación en la nube.

**Google Colab, Kaggle Notebooks y Binder** ejecutan cada demo en proceso exactamente como está escrita — servidor en un contexto de coroutine, clientes virtuales en otro, todo dentro de un único `asyncio.run`. La salvedad honesta: un notebook no puede mantener abiertas dos *terminales*, así que la demo final de "escribe desde la terminal B" se queda local. Usa las insignias para ver el bucle de mensajes; usa una terminal para la conversación real.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/websocket-chat/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/websocket-chat/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwebsocket-chat%2Fnotebook.es.ipynb)

## Configuración

Crea el proyecto. `websockets` es la única dependencia; `asyncio` es biblioteca estándar. El servidor se enlaza solo a `localhost`, lo que mantiene todo en tu máquina — un despliegue real ampliaría eso, y uno de los Errores comunes explica por qué.

```bash
uv init websocket-chat
cd websocket-chat
```

```bash
uv add websockets
```

```bash
uv run python -c "import websockets, asyncio; print('ws', websockets.__version__)"
```

`asyncio` te da coroutines — funciones `async def` que pueden pausarse en un `await` sin perder su lugar — que es exactamente lo que necesita un servidor mientras espera en muchos sockets a la vez. `websockets` convierte el TCP crudo en llamadas limpias `send`/`recv`, así que tu código se enfoca en *qué pasa en cada mensaje* en lugar del enmarcado de bytes. Se asume Python 3.11+ para `asyncio.timeout`; cualquier cosa más antigua intercambia las dos líneas de timeout.

**✅ Lista de verificación**

- ✅ `uv init websocket-chat` creó un proyecto con un `pyproject.toml`.
- ✅ `uv add websockets` tuvo éxito; la comprobación de versión imprimió `ws 1x.x`.
- ✅ Tienes una segunda terminal disponible para la demo final.

## Paso 1: Eco — el servidor más simple que habla

Todo servidor de chat empieza aquí: un manejador que corre una vez por conexión, hace un bucle sobre los mensajes entrantes y envía algo de vuelta. El nuestro hace eco. Como el servidor y su cliente de prueba viven en *un* `asyncio.run`, puedes ejecutarlo en cualquier lugar.

### 1.1 Escribe el servidor de eco y una demo en proceso

**👟 Pista inicial :** `async with websockets.serve(...)` inicia el servidor; dentro, `websockets.connect(...)` abre un cliente. Ambas coroutines comparten un bucle de eventos, así que `await` salta entre ellas.

```python
# chat.py
import asyncio

import websockets

async def echo(websocket):
    async for message in websocket:
        await websocket.send(f"echo: {message}")

async def demo_echo():
    async with websockets.serve(echo, "localhost", 8765):
        async with websockets.connect("ws://localhost:8765") as socket:
            await socket.send("hello")
            print(await socket.recv())

asyncio.run(demo_echo())
```

Todo el truco del async es *ceder sin renunciar a la posición*: `await socket.recv()` suspende esta coroutine mientras otras coroutines (como el propio `recv` del manejador de eco) proceden, y luego se reanuda exactamente donde se detuvo. `async for message in websocket` es ese bucle escrito con todas las letras — espera el siguiente mensaje, ejecuta el cuerpo, espera el siguiente. `websockets.serve` devuelve un objeto async cuyo administrador de contexto ejecuta el servidor *durante* el bloque y lo cierra después, así que el servidor y el cliente viven y mueren juntos en una llamada.

**🎯 Resultado esperado :** `echo: hello`.

**🩹 Si sale mal :** Si no se imprime nada, el `recv()` del cliente corrió contra el envio del manejador — con solo un mensaje en vuelo eso suele significar que el servidor nunca aceptó la conexión (comprueba la higiene del puerto 8765). Si ves `ConnectionRefusedError`, la línea `serve` lanzó antes de que corriera `connect` — el traceback que te dice qué coroutine falló es todo el diagnóstico. Si `await` aparece dentro de una función que no es `async def`, eso es un error de sintaxis con un mensaje muy específico: *"await outside async function"*.

### 1.2 Verifica el eco

**✅ Lista de verificación**

- ✅ `uv run python chat.py` imprime `echo: hello`.
- ✅ Enviar tres mensajes hace el viaje de ida y vuelta de tres ecos: `echo: one`, `echo: two`, `echo: three`.
- ✅ `websockets.connect` apunta al mismo host/puerto que `serve`.

**🤔 Pregunta(s) socrática(s)**

- El `async for` del manejador sigue esperando para siempre. ¿Qué haría el servidor si un cliente se conectara y *nunca enviara nada* — y qué está haciendo el bucle de eventos mientras tanto?
- echo responde a lo que recibe, pero tiene que *creer* que el mensaje es texto. ¿Qué pasa si un cliente envía bytes o una carga útil enorme de 100 MB, y dónde (en `websockets` o en tu manejador) te defenderías contra eso?

## Paso 2: Difusión — un emisor, muchos oyentes

Las salas de chat son envíos de grupo. Este paso rastrea cada socket conectado en un conjunto, y cuando un cliente habla, *todos excepto el hablante* reciben el mensaje. Ese conjunto es la semilla de todo lo que una sala necesita.

### 2.1 Escribe el manejador de difusión

**👟 Pista inicial :** Añade cada conexión a un conjunto `connections` a nivel de módulo, `await asyncio.gather(...)` los envíos para que los oyentes lentos no bloqueen a los rápidos, y `discard` el socket cuando salga.

```python
# chat.py (continuación)
connections: set[websockets.WebSocketServerProtocol] = set()

async def broadcast(websocket):
    connections.add(websocket)
    try:
        async for message in websocket:
            for peer in connections - {websocket}:
                await peer.send(message)
    finally:
        connections.discard(websocket)
```

El conjunto hace dos trabajos difíciles: deduplica (un socket solo puede unirse una vez, así que `add` es idempotente) y te da aritmética de conjuntos — `connections - {websocket}` es simplemente "todos los demás". `finally` no es opcional aquí: si un cliente se desconecta a mitad de mensaje, el conjunto se limpia sin importar cómo salga el bucle, de lo contrario los fantasmas siguen recibiendo para siempre. El `send` interno del `async for` es secuencial (un await a la vez); `asyncio.gather` llega en la versión por sala del Paso 3 cuando compiten varias salas.

**🎯 Resultado esperado :** Con dos clientes conectados, un mensaje de uno aparece solo en el otro — el emisor nunca ve su propia difusión.

**🩹 Si sale mal :** Si el *emisor* también recibe su copia, `connections - {websocket}` hizo mal la resta del conjunto (o el peer listado incluye verazmente a sí mismo). Si un cliente desconectado sigue apareciendo en el conteo de la sala, falta el bloque `finally`. Si un cliente lento detiene a todos, los envíos bloquean en secuencia — esa es la mejora de gather.

### 2.2 Verifica la difusión

**✅ Lista de verificación**

- ✅ Una demo de dos clientes muestra cada mensaje llegando exactamente una vez al *otro* cliente.
- ✅ El emisor no recibe su propio mensaje.
- ✅ Desconectar un cliente y luego reconectar muestra un intercambio bidireccional fresco — sin fantasmas.

**🤔 Pregunta(s) socrática(s)**

- La difusión es deliberadamente frágil: si el envío de un peer se cuelga, el `async for` bloquea todo el bucle. ¿Dónde cambiaría eso `asyncio.gather` (o `gather(return_exceptions=True)`), y qué trade-off esconde "enviar a todos, fallar en voz alta"?
- `connections - {websocket}` excluye al hablante de su propio mensaje. WhatsApp te muestra *tu* mensaje con estilo diferente en lugar de ocultarlo. Qué mensajes van al emisor depende del diseño — ¿qué se rompe si lo haces mal en un protocolo real?

## Paso 3: Salas — enrutamiento por ruta de conexión

Una app de chat son salas, no un blob. Este paso usa la ruta de la URL de conexión (`ws://localhost:8765/general` → sala `general`) como la clave de enrutamiento: cada sala es dueña de su propio conjunto de sockets, y los mensajes se reparten solo a los miembros de esa sala.

### 3.1 Escribe el enrutador de salas

**👟 Pista inicial :** Mantén un `dict[str, set]` de sala → sockets; lee la sala de `websocket.path`; únete, difunde y luego limpia en `finally`.

```python
# chat.py (continuación)
rooms: dict[str, set[websockets.WebSocketServerProtocol]] = {}

async def room_chat(websocket):
    room = websocket.path.strip("/") or "general"
    peers = rooms.setdefault(room, set())
    peers.add(websocket)
    try:
        async for message in websocket:
            targets = [peer for peer in peers if peer is not websocket]
            if targets:
                await asyncio.gather(*(peer.send(f"[{room}] {message}") for peer in targets))
    finally:
        peers.discard(websocket)

async def demo_rooms():
    seen = []

    async def listener(name, room):
        async with websockets.connect(f"ws://localhost:8765/{room}") as socket:
            await asyncio.sleep(0.05)  # let both clients join before anyone speaks
            await socket.send(f"{name} voted yes")
            try:
                with asyncio.timeout(1):
                    seen.append(await socket.recv())
            except TimeoutError:
                seen.append(f"{name} heard nothing")

    async with websockets.serve(room_chat, "localhost", 8765):
        await asyncio.gather(listener("alice", "general"), listener("bob", "off-topic"))

    print(sorted(seen))

asyncio.run(demo_rooms())
```

`websocket.path` es información de enrutamiento gratis: unirse a la sala `off-topic` es solo conectarse a esa URL, y la primera línea del manejador *deriva* la sala en lugar de almacenarla. `rooms.setdefault(room, set())` crea la sala en el primer ingreso sin una rama if. `asyncio.gather(*(...))` espera el envío de cada compañero de sala de forma concurrente, así que un oyente lento no puede tomar la sala como rehén — el costo es que un envío que falla lanza, y la limpieza del `finally` mantiene la sala ordenada de todos modos. El `timeout(1)` de la demo prueba el aislamiento: bob no oye nada porque el mensaje de alice honestamente fue a una sala diferente.

**🎯 Resultado esperado :** `['[general] alice voted yes', 'bob heard nothing']`.

**🩹 Si sale mal :** Si el mensaje de alice se filtra a la sala de bob, las claves de `room` nunca difirieron — la demo conectó ambos a la misma ruta. Si toda la demo se cuelga en lugar de hacer timeout, falta el guard `asyncio.timeout` o el `listener` no se unió antes de que se enviara el mensaje (sube el `sleep`). Si una sala crece para siempre, falta `peers.discard` en `finally`.

### 3.2 Verifica el enrutamiento de salas

**✅ Lista de verificación**

- ✅ `general` y `off-topic` reciben solo sus propios mensajes.
- ✅ Unirse a `ws://localhost:8765` desnudo aterriza en la sala fallback `general`.
- ✅ La desconexión de un oyente lo elimina de la sala: reconectar te trae de vuelta con un ingreso fresco.

**🤔 Pregunta(s) socrática(s)**

- Un nombre de sala es solo una cadena de forma libre en la URL. ¿Qué pasa cuando un cliente se conecta a `ws://localhost:8765/../../etc` — es una sala, o un agujero de seguridad? ¿Qué validarías antes de confiar en `websocket.path`?
- `serve` en un puerto maneja *todas* las salas. Los sistemas de chat reales reparten las salas *entre* servidores y enrutan un ingreso al correcto. ¿Cómo se ve un registro de salas compartido y siempre encendido comparado con solo tener cada sala en la memoria de un proceso?

## Paso 4: Historial y presencia — lo que merecen los que llegan tarde

Una sala que olvida su pasado es inútil para un recién llegado. Este paso le da a cada sala un registro de historial con tope y descarte, lo reproduce a cada recién llegado y anuncia los ingresos y partidas para que la presencia sobreviva al chisme.

### 4.1 Añade historial y presencia al manejador de salas

**👟 Pista inicial :** Mantén un deque por sala (maxlen=50) de `(sender, text)`; al unirse, reprodúcelo antes del bucle de chat; envía una línea de presencia envuelta en la misma difusión usada para el chat.

```python
# chat.py (continuación)
from collections import deque

history: dict[str, deque] = {}
HISTORY_SIZE = 50
PRESENCE = True

def log_message(room: str, sender: str, text: str) -> None:
    log = history.setdefault(room, deque(maxlen=HISTORY_SIZE))
    log.append((sender, text))

async def replay(websocket, room: str) -> None:
    for sender, text in history.get(room, deque()):
        await websocket.send(f"[history] {sender}: {text}")

async def room_chat_v2(websocket):
    room = websocket.path.strip("/") or "general"
    peers = rooms.setdefault(room, set())
    peers.add(websocket)
    sender = f"guest-{websocket.remote_address[1]}"
    log_message(room, "system", f"{sender} joined")
    await replay(websocket, room)
    for peer in peers - {websocket}:
        await peer.send(f"* {sender} joined {room}")
    try:
        async for message in websocket:
            log_message(room, sender, message)
            targets = [peer for peer in peers if peer is not websocket]
            if targets:
                await asyncio.gather(*(peer.send(f"{sender}: {message}") for peer in targets))
    finally:
        peers.discard(websocket)
        log_message(room, "system", f"{sender} left")
        for peer in peers:
            await peer.send(f"* {sender} left {room}")
```

`deque(maxlen=50)` es la estructura de datos perfecta para "mantén los últimos N": las adiciones más allá del tope descartan en silencio la más antigua, así que el historial no puede inflarse. El orden importa en la secuencia de ingreso — `replay` primero le da al recién llegado el pasado, *luego* la sala anuncia al recién llegado a todos los demás, para que nadie vea "alice joined" antes de que alice tenga contexto. `f"guest-{port}"` es un apodo honesto y barato: el puerto de origen del peer es único por conexión en la práctica, lo que supera a pedir nombres antes de tener un sistema de autenticación.

**🎯 Resultado esperado :** Conectar un segundo cliente imprime el historial reproducido (ingreso + los últimos mensajes) y luego la línea `* guest-XXXX joined` de la sala en vivo; su desconexión imprime `* guest-XXXX left`.

**🩹 Si sale mal :** Si el recién llegado ve el anuncio antes del historial, las líneas de `replay` y difusión se intercambiaron. Si el historial se reproduce *infinito*, falta `maxlen` — el deque crece para siempre. Si un ingreso se almacena como `system` pero se reproduce como `history`, el nombre `sender` derivado para los ingresos difiere de las líneas de chat por diseño; mantén ambos formateados igual o el registro se lee como dos voces.

### 4.2 Verifica historial y presencia

**✅ Lista de verificación**

- ✅ Un recién llegado recibe el respaldo *antes* de cualquier mensaje en vivo.
- ✅ Después de 60 mensajes, el historial se mantiene en 50 — el más antiguo se descarta, el más nuevo se conserva.
- ✅ Ingresar y salir producen cada uno exactamente una línea de presencia `* ...` para el resto de la sala.

**🤔 Pregunta(s) socrática(s)**

- Este historial es memoria por proceso: reinicia el servidor y la sala es sorda a su propio pasado. ¿Cómo se ve el paso "luego una base de datos", y dónde difieren realmente un historial *log-structured* y uno *event-sourced*?
- La presencia aquí es auto-reportada: un cliente que se desconecta sin que su `finally` corra (se cortó la energía) difunde un `left` solo si la limpieza corre. ¿Qué distingue "la conexión murió" de "el usuario se fue" a nivel de protocolo, y cuál es más seguro de mostrar como `left`?

## Paso 5: Un cliente de terminal real — chatea entre dos terminales

El servidor está listo; ahora la gente necesita una boca. Este paso escribe `chat_client.py`, un cliente impulsado por stdin que imprime lo que dice la sala y envía lo que escribes — ejecútalo en una segunda terminal mientras `chat.py` sirve en la primera, y estás chateando de verdad.

### 5.1 Escribe el cliente

**👟 Pista inicial :** Dos coroutines — una lee del socket para siempre, una lee `sys.stdin` vía el executor — y `asyncio.gather` deja que ambas vivan lado a lado.

```python
# chat_client.py
import asyncio
import sys

import websockets

async def print_incoming(socket):
    async for message in socket:
        print(f"\r{message}\n> ", end="")

async def read_stdin(socket):
    loop = asyncio.get_running_loop()
    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break
        await socket.send(line.strip())
        await asyncio.sleep(0)

async def main():
    url = sys.argv[1] if len(sys.argv) > 1 else "ws://localhost:8765/general"
    async with websockets.connect(url) as socket:
        await asyncio.gather(print_incoming(socket), read_stdin(socket))

asyncio.run(main())
```

`loop.run_in_executor(None, sys.stdin.readline)` es el truco que deja que el `input()` bloqueante coexista con el socket: la llamada bloqueante corre en un hilo de trabajo mientras el bucle de eventos hace todo lo demás, y `await` se reanuda cuando finalmente llega una línea. El hack del prompt `\r` + `> ` redibuja la línea del prompt para que los mensajes entrantes no se escriban sobre lo que estás tecleando. `gather` une los dos bucles, y cuando uno termina (cierras stdin con Ctrl+D), todo el cliente se desenrolla limpiamente.

**🎯 Resultado esperado :** La terminal A ejecuta `uv run python chat.py` y muestra un log de servidor en vivo; la terminal B ejecuta `uv run python chat_client.py`, escribe `hello`, y los clientes de A imprimen `guest-XXXX: hello` — con un prompt fresco cada vez.

**🩹 Si sale mal :** Si B se conecta pero A nunca muestra un mensaje, ambos procesos deben compartir el puerto exacto y la sala de la URL del cliente debe coincidir — comprueba que la línea `serve` de `room_chat_v2` es lo que *realmente* se sirve. Si teclear sobrescribe mensajes en vivo, falta el redibujado `\r` en `print_incoming`. Si cerrar B cuelga A, `gather` fue por defecto al cancel-en-primera-completación — el `readline` bloqueante no terminó, así que el Ctrl+D de B importa.

### 5.2 Verifica el chat en vivo

**✅ Lista de verificación**

- ✅ Terminal A: `uv run python chat.py` sirve `ws://localhost:8765`.
- ✅ Terminal B: `uv run python chat_client.py` se conecta y su prompt `> ` aparece.
- ✅ Escribir en B hace eco como `live guest-XXXX: <text>` en A; el mismo cliente imprime los mensajes de todos encima de un `> ` fresco.
- ✅ Unir un segundo cliente dispara las líneas `* guest-XXXX joined` de ambos clientes — tienes una sala.

**🤔 Pregunta(s) socrática(s)**

- Los mensajes aquí no están autenticados ni cifrados — cualquiera en la red podría leerlos o hablar. Recorre los tres lugares donde añadirías identidad (nombre al conectar), confidencialidad (TLS) y confianza (comprobaciones de origen) si enviaras esto a una LAN.
- El cliente y el prompt pelean por la misma línea. ¿Dónde se rompe este diseño con mensajes *binarios* o *más largos que el ancho de la terminal* — y qué requeriría una TUI apropiada (como `curses`) que este cliente de camino feliz se salta?

## ⚠️ Errores comunes

- **Sockets que nunca salen del conjunto.** Sin `finally: peers.discard(...)`, un cliente que se desconecta se queda "presente" y `send` a él lanza para siempre. Solución: la limpieza siempre corre, incluso en error.
- **Envíos bloqueantes que matan de hambre a la sala.** El `send` de un oyente lento retiene a todos si se espera uno a la vez. Solución: `asyncio.gather` por mensaje — y prepárate para que `gather` lance en la primera falla (`return_exceptions=True` si quieres que el resto termine).
- **Nombres de sala confiados a ciegas.** `websocket.path` es entrada suministrada por el atacante. Solución: lista blanca de nombres de sala al unirse, o la "sala" se vuelve un vector de inyección de ruta/sistema de archivos.
- **Anonimato del emisor.** Un apodo basado en puerto es único pero falsificable y olvidable. Solución: exige un `HELLO name` como primer mensaje y deja de confiar en él después de que exista la autenticación.
- **Historial sin límite.** `deque(maxlen=N)` limita en la escritura, nunca en la lectura — cualquier cosa sin él crece sin límite por sala.

## Lo que acabas de construir

Un sistema de chat de dos terminales funcional: un manejador de eco async, difusión por salas vía rutas URL, historial con tope reproducido a los que llegan tarde, anuncios de presencia y un cliente stdin — todo lo suficientemente pequeño como para tenerlo en la cabeza. La lección transferible es la *forma* de los sistemas en vivo: un bucle que espera, un conjunto de peers conectados, estado derivado (salas) y semántica de reproducción (historial/presencia). Cada juego multijugador, panel y editor colaborativo es el mismo esqueleto con más conveniencias.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/websocket-chat/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/websocket-chat) en el repo del curso es una versión más completa del código anterior, con un chat web de múltiples salas y un archivo de guía TLS. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Convierte la presencia en un evento *tipado* — `typing`, `online`, `away` — y renderiza `guest-XXXX is typing…` solo mientras sea verdad, con un timeout de 3 segundos.
- Reemplaza el apodo `guest-port` con un apretón de manos `HELLO` como primer mensaje, y luego rechaza los mensajes enviados antes de él.
- Persistir el historial a un archivo SQLite (o un archivo log-structured) para que los reinicios conserven la sala; la pregunta del Paso 4 lo enmarcó exactamente cómo.
- Envuelve el servidor en `uvicorn` con notas `wss`/TLS y una lista blanca de nombres de sala, y llámalo con forma de producción.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
