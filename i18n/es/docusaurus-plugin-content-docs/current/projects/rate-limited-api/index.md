---
id: rate-limited-api
title: "Construye un Servicio de API con Límite de Tasa"
sidebar_label: "Servicio de API con Límite de Tasa"
slug: /projects/rate-limited-api
description: "Graduado del playground en el navegador a Python real: construye un servicio FastAPI que envuelve tu propio conjunto de datos, con autenticación genuina por clave de API y un limitador de tasa que construyes desde cero."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Servicio de API con Límite de Tasa

<ProjectPublishedDate projectId="2027-rate-limited-api" />

<ProjectGreeting />

Cada uno de los otros proyectos de esta sección construye un *cliente* de algún tipo — un script o agente que llama a la API de otra persona. Este lo invierte: tú construyes la API. Este proyecto levanta un servicio real de [FastAPI](https://fastapi.tiangolo.com/) que envuelve un conjunto de datos de unos cientos de citas y chistes que viene incluido con el proyecto, con las dos cosas que toda API pública real necesita y que los ejemplos de juguete suelen omitir — autenticación por clave de API y limitación de tasa — construidas a mano, no importadas de una biblioteca. Asume Python a nivel 101; no se requiere nada de Análisis de Datos.

Esto es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para ver la lista completa y creciente.

## 🎯 Lo que harás

1. Instalar `uv` y configurar un proyecto FastAPI local — sin necesidad de una clave de API externa, ya que este proyecto incluye su propio conjunto de datos.
2. Incluir un conjunto de datos y construir endpoints paginados de `list`/`get` sobre él.
3. Añadir filtrado por categoría y autor con parámetros de consulta.
4. Construir una emisión real de claves de API y una dependencia que valida una clave en los endpoints protegidos.
5. Implementar un limitador de tasa de ventana deslizante desde cero y devolver respuestas reales `429 Too Many Requests` con una cabecera `Retry-After` una vez que una clave excede su presupuesto.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado — el punto de todo este proyecto es ejecutar un proceso de servidor real y de larga duración y golpearlo con peticiones HTTP reales, de la misma manera que funciona cualquier API de producción.

**GitHub Codespaces** también funciona bien: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio), ejecuta el servidor igual que lo harías localmente y reenvía el puerto — Codespaces suele ofrecer hacerlo automáticamente en cuanto `uvicorn` comienza a escuchar. Una vez reenviado, puedes ejecutar `curl` desde la terminal de tu propia máquina, o abrir la página `/docs` de la URL reenviada en un navegador, exactamente como si se estuviera ejecutando localmente.

**Los notebooks son un ajuste genuinamente bueno aquí, a diferencia de la mayoría de los otros proyectos de servidor de larga duración de esta serie** — con una salvedad. Una celda de notebook no puede mantener abierto un puerto de escucha real de la forma en que Colab, Kaggle y Binder aíslan las redes, así que es una mala opción para *ejecutar de verdad* `uvicorn` y golpearlo por HTTP real. Pero FastAPI incluye un `TestClient` que habla con tu objeto `app` directamente, dentro del proceso, sin socket ni puerto de por medio — exactamente las mismas rutas, códigos de estado y cabeceras, solo que invocadas como llamadas a funciones de Python en lugar de peticiones de red. Es una demostración legítimamente buena de la lógica de paginación, filtrado, autenticación y limitación de tasa, y [`examples/rate-limited-api/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb) hace exactamente eso:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frate-limited-api%2Fnotebook.ipynb)

Trata el notebook como una forma de *ver* rápidamente el comportamiento de la API, no como un reemplazo para ejecutar `uvicorn` localmente y lanzar peticiones reales contra él — los pasos de abajo hacen lo real.

## Configuración

`uv` es una sola herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

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

Luego configura un proyecto e instala FastAPI y un servidor para ejecutarlo:

```bash
uv init rate-limited-api
cd rate-limited-api
uv add fastapi "uvicorn[standard]"
```

Fíjate en lo que *no* hay aquí: ninguna clave de API que solicitar, ningún registro de nivel gratuito, nada que configurar antes de tu primera petición. Este proyecto incluye su propio conjunto de datos y emite sus propias claves — estás construyendo la cosa que consumen los demás proyectos de esta serie.

## Paso 1: Empaca el conjunto de datos y construye los endpoints básicos

Las APIs reales sirven datos reales. Crea `quotes_data.py` con un conjunto de datos pequeño escrito a mano — una lista simple de Python de diccionarios es suficiente; no se necesita base de datos todavía:

```python
# quotes_data.py
_RAW_QUOTES = [
    # (text, author, category)
    ("Programs must be written for people to read, and only incidentally for machines to execute.", "Harold Abelson", "programming"),
    ("The unexamined life is not worth living.", "Socrates", "wisdom"),
    ("Why do programmers prefer dark mode? Because light attracts bugs.", "Anonymous", "humor"),
    # ... a few hundred more, spanning several categories
]

QUOTES = [
    {"id": i, "text": text, "author": author, "category": category}
    for i, (text, author, category) in enumerate(_RAW_QUOTES, start=1)
]

CATEGORIES = sorted({q["category"] for q in QUOTES})
```

Escribe el tuyo — unas pocas docenas bastan para empezar, apunta a un par de cientos para cuando termines, abarcando al menos tres o cuatro categorías. Luego crea `main.py` con la aplicación y dos endpoints de lectura:

```python
# main.py
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from quotes_data import QUOTES

app = FastAPI(title="Quotes API")


class QuoteOut(BaseModel):
    id: int
    text: str
    author: str
    category: str


class QuotesPage(BaseModel):
    items: list[QuoteOut]
    total: int
    limit: int
    offset: int


@app.get("/quotes", response_model=QuotesPage)
def list_quotes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> QuotesPage:
    page = QUOTES[offset : offset + limit]
    return QuotesPage(items=[QuoteOut(**q) for q in page], total=len(QUOTES), limit=limit, offset=offset)


@app.get("/quotes/{quote_id}", response_model=QuoteOut)
def get_quote(quote_id: int) -> QuoteOut:
    for quote in QUOTES:
        if quote["id"] == quote_id:
            return QuoteOut(**quote)
    raise HTTPException(status_code=404, detail=f"No quote with id {quote_id}.")
```

Ejecútalo:

```bash
uv run uvicorn main:app --reload
```

Luego, en otra terminal:

```bash
curl "http://127.0.0.1:8000/quotes?limit=3"
curl "http://127.0.0.1:8000/quotes/1"
curl -i "http://127.0.0.1:8000/quotes/99999"   # a real 404
```

La paginación `limit`/`offset` es el mismo patrón detrás del endpoint de lista de casi todas las APIs REST públicas — limita cuántos datos puede devolver una sola respuesta (`le=100` aquí) y permite que un cliente recorra el conjunto de datos completo página a página usando `total` para saber cuándo detenerse.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run uvicorn main:app --reload` arranca sin errores.</StepChecklistItem>
<StepChecklistItem>`GET /quotes?limit=3` devuelve exactamente 3 elementos y un `total` que coincide con el tamaño de tu conjunto de datos completo.</StepChecklistItem>
<StepChecklistItem>`GET /quotes/{a-real-id}` devuelve esa cita; `GET /quotes/99999` devuelve un `404` real, no un `500` ni un `200` vacío.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué limitar `limit` a 100 (`le=100`) en lugar de permitir que un cliente pida todas tus citas en una sola respuesta? ¿Qué haría de forma diferente un cliente con una conexión lenta, o uno malintencionado, si no hubiera límite?
- `get_quote` recorre toda la lista para encontrar un id. Con unos cientos de citas esto es instantáneo; con unos pocos millones no lo sería. ¿Qué estructura de datos haría rápido buscar por id independientemente del tamaño del conjunto de datos?

## Paso 2: Añade filtrado

Extiende `list_quotes` con parámetros de consulta opcionales para categoría y autor:

```python
@app.get("/categories", response_model=list[str])
def list_categories() -> list[str]:
    from quotes_data import CATEGORIES
    return CATEGORIES


@app.get("/quotes", response_model=QuotesPage)
def list_quotes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str | None = Query(default=None, description="Filter by exact category."),
    author: str | None = Query(default=None, description="Case-insensitive substring match on author."),
) -> QuotesPage:
    filtered = QUOTES
    if category is not None:
        filtered = [q for q in filtered if q["category"] == category]
    if author is not None:
        needle = author.lower()
        filtered = [q for q in filtered if needle in q["author"].lower()]

    page = filtered[offset : offset + limit]
    return QuotesPage(items=[QuoteOut(**q) for q in page], total=len(filtered), limit=limit, offset=offset)
```

```bash
curl "http://127.0.0.1:8000/quotes?category=science&limit=5"
curl "http://127.0.0.1:8000/quotes?author=sagan"
curl "http://127.0.0.1:8000/categories"
```

`total` en la respuesta refleja el recuento *filtrado*, no todo el conjunto de datos — eso importa para un cliente que intente paginar solo por las citas de ciencia, que de otro modo pensaría que quedan muchas más páginas de las que realmente hay.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`?category=<a-real-category>` devuelve solo citas de esa categoría, y `total` refleja el recuento filtrado.</StepChecklistItem>
<StepChecklistItem>`?author=<partial-name>` coincide sin distinguir mayúsculas/minúsculas (p. ej. `sagan` coincide con `Carl Sagan`).</StepChecklistItem>
<StepChecklistItem>Combinar `category` y `author` juntos reduce aún más los resultados, no solo uno u otro.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Qué debería devolver `GET /quotes?category=nonexistent` — una lista vacía con `total: 0`, o un `404`? ¿Cuál construiste, y por qué es esa la opción más RESTful para un endpoint de *colección* frente al de elemento único `GET /quotes/{id}`?
- Si añadieras un segundo filtro que también necesitara "cualquiera de varios valores" (p. ej. varias categorías a la vez), ¿cómo extenderías el parámetro de consulta para que aceptara una lista?

## Paso 3: Emisión y validación de claves de API

Una API real necesita saber quién la está llamando. Añade emisión de claves de autoservicio y una dependencia que verifica una clave en las rutas protegidas:

```python
import secrets

from fastapi import Depends, Header

_VALID_KEYS: set[str] = set()


class ApiKeyResponse(BaseModel):
    api_key: str


@app.post("/keys", response_model=ApiKeyResponse)
def issue_api_key() -> ApiKeyResponse:
    new_key = secrets.token_urlsafe(24)
    _VALID_KEYS.add(new_key)
    return ApiKeyResponse(api_key=new_key)


def require_api_key(x_api_key: str | None = Header(default=None)) -> str:
    if x_api_key is None or x_api_key not in _VALID_KEYS:
        raise HTTPException(status_code=401, detail="Missing or invalid API key. Get one from POST /keys.")
    return x_api_key


@app.get("/me")
def whoami(api_key: str = Depends(require_api_key)) -> dict:
    return {"api_key": api_key}
```

`secrets.token_urlsafe` — no `random`, que no es criptográficamente seguro — genera una clave que nadie puede adivinar. `Depends(require_api_key)` es el sistema de inyección de dependencias de FastAPI: cualquier ruta que tome `api_key: str = Depends(require_api_key)` como parámetro ejecuta `require_api_key` primero, y solo continúa si retorna con éxito en lugar de lanzar una excepción.

```bash
curl -i "http://127.0.0.1:8000/me"                                   # 401, no key
curl -X POST "http://127.0.0.1:8000/keys"                            # {"api_key": "..."}
curl -i -H "X-API-Key: <your-key>" "http://127.0.0.1:8000/me"        # 200
```

:::tip[Este almacén de claves en memoria lo olvida todo al reiniciar, y eso está bien aquí]
`_VALID_KEYS` vive en un `set` simple de Python en la memoria de este proceso — reinicia el servidor y toda clave emitida previamente deja de funcionar. Un producto real persistiría las claves en una base de datos (y almacenaría un *hash* de cada clave, no el valor crudo, de la misma manera que se hacen hash las contraseñas — para que una fuga de la base de datos no filtre claves utilizables directamente). Para un proyecto local de aprendizaje, la versión en memoria es honesta y suficiente; solo no te sorprendas cuando tu clave deje de funcionar después de que `--reload` reinicie el proceso.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`GET /me` sin cabecera `X-API-Key` devuelve un `401` real, con un cuerpo que dice cómo obtener una clave.</StepChecklistItem>
<StepChecklistItem>`POST /keys` devuelve una clave nueva cada vez que lo llamas.</StepChecklistItem>
<StepChecklistItem>`GET /me` con una clave válida en `X-API-Key` devuelve `200`; con una clave inventada sigue devolviendo `401`.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `require_api_key` lee la clave de una cabecera `X-API-Key` personalizada en lugar de un parámetro de consulta (`?api_key=...`). Los parámetros de consulta terminan habitualmente en los registros de acceso del servidor y en el historial del navegador. ¿Qué sugiere eso sobre cuál enfoque es más seguro para un valor secreto?
- Ahora mismo cualquiera puede llamar a `POST /keys` tantas veces como quiera sin ningún límite. ¿Es eso un problema para *este* proyecto? ¿Qué añadirías si fuera un servicio público real?

## Paso 4: Limitación de tasa real

Este es el auténtico punto del proyecto. Construye un limitador de tasa de ventana deslizante que rastrea las marcas de tiempo recientes de las peticiones de cada clave y rechaza las peticiones una vez que una clave excede su presupuesto dentro de una ventana:

```python
# rate_limit.py
import time
from collections import defaultdict, deque


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._history: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, now: float | None = None) -> tuple[bool, float]:
        now = time.monotonic() if now is None else now
        history = self._history[key]

        cutoff = now - self.window_seconds
        while history and history[0] <= cutoff:
            history.popleft()

        if len(history) < self.max_requests:
            history.append(now)
            return True, 0.0

        retry_after = history[0] + self.window_seconds - now
        return False, max(retry_after, 0.0)
```

Cada clave tiene su propio `deque` de marcas de tiempo, de más antigua a más reciente. En cada comprobación, las marcas de tiempo más antiguas que `window_seconds` se descartan por la izquierda antes de contar lo que queda — esta es una ventana deslizante **exacta**, no una aproximación por cubos que se reinicia en un límite de reloj fijo. Esa distinción importa: un limitador de *ventana fija* (digamos, "reinicia el contador cada 10 segundos según el reloj") permite que un cliente dispare su cuota completa justo al final de una ventana y su cuota completa de nuevo justo al inicio de la siguiente, alcanzando hasta 2x su tasa prevista en un par de segundos reales. Rastrear marcas de tiempo reales evita eso.

Conéctalo a una dependencia y úsalo en `/me`:

```python
from fastapi import Response

RATE_LIMIT_MAX_REQUESTS = 5
RATE_LIMIT_WINDOW_SECONDS = 10.0
limiter = SlidingWindowRateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS)


def enforce_rate_limit(response: Response, api_key: str = Depends(require_api_key)) -> str:
    allowed, retry_after = limiter.check(api_key, now=time.monotonic())
    if not allowed:
        retry_after_seconds = str(int(retry_after) + 1)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: max {RATE_LIMIT_MAX_REQUESTS} per {int(RATE_LIMIT_WINDOW_SECONDS)}s.",
            headers={"Retry-After": retry_after_seconds},
        )
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX_REQUESTS)
    return api_key


@app.get("/me")
def whoami(api_key: str = Depends(enforce_rate_limit)) -> dict:
    return {"api_key": api_key}
```

Fíjate en que las cabeceras se establecen de dos maneras diferentes según el resultado — no es una elección estilística, es necesario. Dispara seis peticiones en rápida sucesión con la misma clave:

```bash
KEY=$(curl -s -X POST "http://127.0.0.1:8000/keys" | python3 -c "import sys,json;print(json.load(sys.stdin)['api_key'])")
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code}\n" -H "X-API-Key: $KEY" "http://127.0.0.1:8000/me"; done
```

Las cinco primeras deberían imprimir `200`; la sexta debería imprimir `429`. Comprueba las cabeceras de esa última:

```bash
curl -i -H "X-API-Key: $KEY" "http://127.0.0.1:8000/me"
```

:::tip[Cabeceras de HTTPException, no `response.headers`, en la ruta de error]
Es tentador establecer `response.headers["Retry-After"] = ...` justo antes de lanzar `HTTPException`, de la misma manera que la ruta de éxito establece `X-RateLimit-Limit`. No lo hagas — cuando FastAPI convierte una `HTTPException` lanzada en una respuesta HTTP real, construye un objeto de respuesta **nuevo** a partir de la excepción, descartando por el camino lo que se haya escrito en el parámetro `response` inyectado. Cualquier cabecera que deba aparecer en una respuesta de error tiene que pasarse directamente a `HTTPException(..., headers={...})`, o nunca llega al cliente, en silencio. Esto mordió la primera versión del código de ejemplo de esta misma lección — verifica con `curl -i` que tu `429` realmente lleva `Retry-After`, no confíes simplemente en que establecer `response.headers` funcionó.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Las primeras `RATE_LIMIT_MAX_REQUESTS` peticiones de una clave dentro de la ventana tienen éxito con `200`.</StepChecklistItem>
<StepChecklistItem>La siguiente petición de esa misma clave, aún dentro de la ventana, devuelve un `429` real.</StepChecklistItem>
<StepChecklistItem>La respuesta `429` realmente lleva una cabecera `Retry-After` — verificada con `curl -i`, no asumida.</StepChecklistItem>
<StepChecklistItem>Esperar hasta que pase la ventana y reintentar vuelve a tener éxito (el límite no es permanente).</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué usar la clave de API como clave del historial del limitador de tasa en lugar de la dirección IP? ¿Qué cambiaría (para bien o para mal) si lo usaras por IP, especialmente para clientes detrás de un NAT corporativo compartido?
- El método `check` del limitador toma `now` como parámetro opcional en lugar de llamar siempre a `time.monotonic()` internamente. ¿Qué te compra eso al escribir un test para él — intenta escribir uno que finja el paso del tiempo sin un `time.sleep()` real?

:::tip[Este es un limitador a escala de juguete a propósito — la producción tiene una respuesta real]
`SlidingWindowRateLimiter` es genuinamente correcto, pero también es genuinamente de un solo proceso: el estado vive en un dict de Python, en un worker de `uvicorn`. Ejecútalo detrás de dos workers, o de dos réplicas de servidor detrás de un balanceador de carga, y cada uno rastrea su propio recuento independiente para la misma clave — un cliente podría alcanzar hasta N-veces-la-instancia la tasa prevista. La limitación de tasa en producción para un servicio multi-instancia casi siempre mueve este estado a algo compartido, como Redis (`INCR` con un `TTL` es un bloque de construcción común), para que cada instancia vea el mismo recuento. Bibliotecas como [`slowapi`](https://github.com/laurentS/slowapi) existen específicamente para envolver ese patrón en un decorador — vale la pena conocerlas, aunque esta lección construyó deliberadamente a mano la parte interesante en lugar de importarla.
:::

## ⚠️ Errores comunes

- **Establecer cabeceras en `response` antes de lanzar un `HTTPException`.** Como se cubrió arriba — se descartan. Pásalas a `HTTPException(headers={...})` en su lugar.
- **Olvidar que los checks tipo `raise_for_status` no aplican en ninguna parte aquí — este proyecto es el servidor, no el cliente.** Es fácil añadir por reflejo manejo de errores para *llamar* a una API cuando el punto de todo este proyecto es *ser* una; los errores que importan aquí son los que tus propios endpoints devuelven a los llamadores (`401`, `404`, `429`), no los que recibes tú.
- **Usar `random` en lugar de `secrets` para las claves de API.** `random` no es criptográficamente seguro y su salida puede, en principio, predecirse — `secrets.token_urlsafe()` está construido específicamente para tokens sensibles a la seguridad como este.
- **Probar la limitación de tasa a mano con peticiones espaciadas un segundo o más.** Escribir comandos `curl` uno a la vez, esperando cada resultado, fácilmente tarda más que una ventana de límite de tasa corta — la ventana sigue deslizándose y nunca verás un `429`. Dispara varias peticiones seguidas (un bucle de shell, o un script corto de Python) en su lugar.
- **Un límite de tasa tan bajo que bloquea la navegación normal por `/quotes` mientras pruebas.** Esta lección pone deliberadamente el limitador de tasa solo en `/me`, no en los endpoints abiertos `/quotes`, para que puedas explorar el conjunto de datos libremente mientras pruebas la autenticación y la limitación por separado. Ten en cuenta esa separación si lo extiendes.

## Lo que acabas de construir

Una API REST real: endpoints de lista y detalle paginados y filtrables sobre un conjunto de datos que escribiste tú mismo, emisión de claves de API de autoservicio, una dependencia que realmente aplica la autenticación, y un limitador de tasa que construiste línea por línea en lugar de importar — lógica de ventana deslizante, respuestas `429` y una cabecera `Retry-After` correcta incluidas. Es la misma forma de diseño de clave-de-API-más-límite-de-tasa que usan las APIs públicas reales en todas partes, solo que sin un servicio de terceros detrás.

## A dónde ir desde aquí

- Persiste las claves de API (con hash, no crudas) y los contadores de limitación de tasa en un almacén de datos real — SQLite para las claves, Redis para los contadores de tasa — para que ambos sobrevivan a un reinicio y funcionen correctamente entre más de un proceso de servidor.
- Añade niveles de límite de tasa por clave (una clave "free" obtiene 5 peticiones por 10 segundos, una clave "pro" obtiene 50) almacenando un nivel junto a cada clave emitida y consultándolo dentro de `enforce_rate_limit`.
- Despliega esto de verdad en algún lugar alcanzable desde fuera de tu propia máquina (un pequeño host siempre encendido, o una plataforma serverless que soporte apps ASGI) y golpéalo desde un teléfono o la máquina de un amigo — un proyecto como este solo está completo cuando algo distinto de `localhost` puede llamarlo.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2027-rate-limited-api" />
