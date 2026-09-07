---
title: "API Acortador de URLs"
description: "Construye un acortador de URLs como una API HTTP real: códigos cortos base62 en SQLite, seguimiento de clics en cada redirección, consultas de analítica y una capa FastAPI que puedes llamar con curl."
difficulty: "intermediate"
estimatedMinutes: 70
tags: ["api", "database", "sqlite"]
learningObjectives:
  - Modelar enlaces y clics en un esquema SQLite
  - Generar códigos cortos sin colisiones con base62
  - Resolver códigos a URLs y registrar eventos de clic
  - "Consultar analítica de clics: totales, referentes y series por día"
  - Exponer una capa FastAPI con rutas de acortar, redirigir y analítica
prerequisites:
  - "Fundamentos de Python (funciones, diccionarios, excepciones)"
  - "Fundamentos de API REST: rutas, códigos de estado, JSON"
  - "Instalar paquetes con uv"
---

# 🛠️ 🔗 API Acortador de URLs

Cada enlace que compartes en un chat es una cadena corta que esconde una más larga — y una redirección que le dice a quien la posee exactamente con qué frecuencia, de dónde y en qué día se hace clic. Este proyecto construye ese servicio de extremo a extremo: códigos cortos base62 almacenados en SQLite, un clic registrado en cada redirección, analítica que puedes consultar y, finalmente, una capa FastAPI real para que puedas `curl` tu propio acortador. Es una API pequeña pero completa respaldada por base de datos — la forma detrás de muchos servicios de producción.

Esto asume Python 101 y un toque ligero con API REST y `curl` — no se requiere nada de Análisis de Datos. Es opcional y no se califica; consulta [Proyectos del Mundo Real](/docs/projects) para ver la lista completa y en crecimiento.

## 🎯 Lo que harás

1. Diseñar un esquema SQLite para enlaces y eventos de clic.
2. Generar códigos cortos sin colisiones con base62.
3. Resolver un código a su URL mientras registras un clic.
4. Consultar analítica por enlace — totales, referentes y una serie día a día.
5. Envolverlo todo en un servicio FastAPI que puedas llamar con `curl`.

## Dónde ejecutar esto

**Localmente con `uv`** es la ruta principal. Un acortador es un *servidor*: necesita enlazar un puerto y responder peticiones HTTP, que es lo que `uvicorn` en tu máquina hace bien. Los pasos del motor (1–4) corren perfectamente bien en cualquier lugar, pero el bucle `curl` del Paso 5 quiere un servidor real en ejecución.

**Google Colab, Kaggle Notebooks y Binder** ejecutan todo el motor (SQLite vive feliz en un notebook, y el notebook de ejemplo incluso ejercita la API a través del `TestClient` de FastAPI sin enlazar un puerto). La salvedad honesta: un notebook es un camino de prueba para la parte de *servicio* — no dejarás un servidor de larga duración corriendo ahí, y el archivo SQLite es efímero. Usa las insignias para la experiencia del motor + test-client, y ejecuta `uvicorn` localmente cuando quieras lo real.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/url-shortener/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/url-shortener/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Furl-shortener%2Fnotebook.ipynb)

## Configuración

Crea el proyecto e instala la capa web. El motor usa `sqlite3`, que viene con Python.

```bash
uv init url-shortener
cd url-shortener
uv add fastapi uvicorn
```

```bash
uv run python -c "import fastapi, sqlite3; print('ok')"
```

`sqlite3` es la base de datos del motor — una base de datos SQL completa en un archivo, sin servidor que instalar. `fastapi` construye las rutas HTTP con validación impulsada por tipos, y `uvicorn` es el servidor ASGI que realmente enlaza el puerto y responde a `curl`.

**✅ Lista de verificación**

- ✅ `uv add fastapi uvicorn` terminó y la comprobación de import imprime `ok`.
- ✅ Existe un proyecto fresco `url-shortener/` con un `pyproject.toml`.

## Paso 1: Diseña el esquema SQLite

Un acortador almacena dos cosas: el mapa de código → URL, y cada clic *sobre* ese código. Una tabla `links`, una tabla `clicks` y una clave foránea entre ellas.

### 1.1 Crea el esquema y un helper de conexión

**👟 Pista inicial :** Conecta a través de un pequeño helper `get_conn()` con `row_factory = sqlite3.Row`, y crea ambas tablas con `init_db()` usando `CREATE TABLE IF NOT EXISTS` para que sea seguro llamarlo repetidamente.

```python
# shortener.py
import sqlite3
from contextlib import closing
from datetime import datetime

DB = "shortener.db"

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    with closing(get_conn()) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS links (
                code       TEXT PRIMARY KEY,
                url        TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS clicks (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                code       TEXT NOT NULL,
                clicked_at TEXT NOT NULL,
                referrer   TEXT
            );
            """
        )

init_db()
print("tables ready")
```

`row_factory = sqlite3.Row` es la línea de calidad de vida: los resultados de las consultas vuelven como filas tipo dict (`row["url"]`) en lugar de tuplas anónimas, así que la analítica del Paso 4 se lee como Python, no como una mezcolanza de posiciones. `code TEXT PRIMARY KEY` hace del código la clave natural — *quieres* que las colisiones de inserción sean visibles. El `clicks.id` autoincremento es separado, porque un enlace obtiene muchos clics y un clic no es un enlace. Envolver todo en `closing(get_conn())` garantiza que la conexión se cierre incluso si una consulta lanza una excepción.

**🎯 Resultado esperado :** Se imprime `tables ready`, y aparece un archivo `shortener.db` en la carpeta del proyecto. Ejecutarlo de nuevo imprime la misma línea sin error.

**🩹 Si sale mal :** Si la segunda ejecución lanza `OperationalError: table already exists`, faltan las cláusulas `IF NOT EXISTS`. Si `row["url"]` se comporta mal más tarde, `row_factory` se establece por conexión — verifica que esté dentro de `get_conn()`, no solo en una función llamante. Si el archivo aparece en otro lugar, la conexión usa una ruta relativa y tu directorio de trabajo difiere — imprime `DB` para confirmar.

### 1.2 Verifica el esquema

**✅ Lista de verificación**

- ✅ Ejecutar `init_db()` dos veces es inofensivo.
- ✅ `shortener.db` existe y `sqlite3 shortener.db '.tables'` lista `clicks` y `links`.
- ✅ Puedes nombrar las tres columnas de `links` y las cuatro de `clicks`.

**🤔 Pregunta(s) socrática(s)**

- La tabla de clics almacena `code` pero no la URL en sí. ¿Qué te compra esa elección de diseño, y qué debe seguir siendo verdad sobre los valores de `code` para que el join sea confiable?
- `clicks.id` es `AUTOINCREMENT`, mientras que `links.code` es una clave primaria de texto. ¿Cuándo es esencial un id entero, y cuándo una clave de cadena natural (como `code`) es la elección más honesta?

## Paso 2: Genera y crea códigos cortos

Los códigos cortos provienen de contar: cada nuevo enlace obtiene el siguiente número, y base62 codifica ese número en una cadena corta y segura para URLs (`1`, `2`, …, `a`, `b`, …). Este paso añade el codificador y la función `create_link`.

### 2.1 Escribe la codificación base62 y `create_link`

**👟 Pista inicial :** Usa el alfabeto de 62 símbolos, `divmod` para reducir cualquier entero a dígitos de base-62, y deriva el siguiente código del conteo de filas actual de la tabla para que nunca colisione.

```python
# shortener.py (continuación)
ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

def encode_base62(n: int) -> str:
    if n == 0:
        return ALPHABET[0]
    chars = []
    while n > 0:
        n, remainder = divmod(n, 62)
        chars.append(ALPHABET[remainder])
    return "".join(reversed(chars))

def create_link(url: str, custom: str | None = None) -> str:
    with closing(get_conn()) as conn:
        if custom is None:
            row = conn.execute("SELECT COUNT(*) FROM links").fetchone()
            code = encode_base62(row[0] + 1)
        else:
            code = custom
        conn.execute(
            "INSERT INTO links (code, url, created_at) VALUES (?, ?, ?)",
            (code, url, datetime.now().isoformat(timespec="seconds")),
        )
    return code

print(create_link("https://example.com/very/long/path"))
print(create_link("https://python.org", custom="py"))
for i in range(1, 140):
    assert len(encode_base62(i)) <= 2
print("first 138 codes fit in 2 chars")
```

`divmod(n, 62)` es todo el algoritmo: extrae un dígito de base-62 por bucle (`remainder`) y encoge `n` por un factor de 62, hasta que `n` llega a cero — la misma matemática de "llevar" detrás de contar en cualquier base. Invertir los dígitos recolectados pone el más significativo primero, así que el orden de los códigos coincide con el orden numérico. `SELECT COUNT(*) from links` es una fuente de ids deliberadamente simple: crece monótonamente a medida que se añaden enlaces, por lo que nunca colisiona con el código `A`. El pago real de base62 es la densidad — 138 enlaces caben en dos caracteres, y el bucle `assert` lo prueba empíricamente.

**🎯 Resultado esperado :** `A`, luego `py`, luego el bucle assert pasando en silencio (138 códigos ≤ 2 caracteres) — sin bloqueos.

**🩹 Si sale mal :** Si los códigos vuelven en el orden equivocado (`B` antes de `A`), falta `reversed(chars)`. Si el mismo `A` aparece dos veces, `COUNT(*)` se está leyendo de la tabla equivocada o el número no se incrementa en 1. Si un código personalizado colisiona, `sqlite3.IntegrityError` escapa sin manejar — la ruta del Paso 5 necesitará atraparlo, pero a nivel de motor, ese error *es* la señal honesta de "tomado".

### 2.2 Verifica la generación de códigos

**✅ Lista de verificación**

- ✅ Los códigos son base62: letras primero, dígitos después, seguros para URLs.
- ✅ Los primeros 138 códigos tienen 2 caracteres o menos, y los códigos 62²+ siguen funcionando si insertas esa cantidad.
- ✅ Los códigos personalizados se insertan tal cual sin tocar el contador.

**🤔 Pregunta(s) socrática(s)**

- Los códigos se derivan de *cuántos enlaces existen*, así que borrar un enlace nunca reclama su código. ¿Es eso un error o una propiedad deliberada, y qué se rompería con `encode_base62(COUNT(*)+1)` si los códigos alguna vez se borraran?
- El alfabeto empieza con letras mayúsculas. ¿Cómo cambia el orden de los códigos si reordenas el alfabeto (minúsculas primero), y algo aguas abajo depende de ese orden?

## Paso 3: Resuelve códigos a URLs y rastrea clics

Un acortador que no cuenta clics es medio servicio. Este paso resuelve un código a su URL — la operación que realiza una redirección — y registra una fila de clic por cada resolución, para que la analítica del Paso 4 tenga datos reales.

### 3.1 Escribe `resolve_url`

**👟 Pista inicial :** Lee la URL para el código; si existe, inserta una fila de clic con una marca de tiempo y el referente proporcionado por el llamante, y devuelve la URL. Si no existe, devuelve `None` para que el llamante pueda lanzar un 404.

```python
# shortener.py (continuación)
def resolve_url(code: str, referrer: str | None = None) -> str | None:
    with closing(get_conn()) as conn:
        row = conn.execute(
            "SELECT url FROM links WHERE code = ?", (code,)
        ).fetchone()
        if row is None:
            return None
        conn.execute(
            "INSERT INTO clicks (code, clicked_at, referrer) VALUES (?, ?, ?)",
            (code, datetime.now().isoformat(timespec="seconds"), referrer),
        )
    return row["url"]

# simulate a redirect being hit three times
resolve_url("A")
resolve_url("A", referrer="x.com")
resolve_url("A")
print("clicks:", resolve_url("missing-code"))
```

El orden es el diseño: *buscar, registrar, devolver*. Buscar primero deja que un código malo devuelva `None` temprano sin contaminar la tabla de clics; registrar *dentro* de la misma conexión asegura que el clic y la lectura vean los mismos datos; y devolver la URL es lo que un manejador de redirección le pasará a `RedirectResponse`. El parámetro de referente lo pasa la capa HTTP, no se adivina aquí, así que cada fila de clic lleva quién envió al visitante.

**🎯 Resultado esperado :** `clicks: None` — las tres llamadas a `resolve_url("A")` registraron tres filas de clic, y `resolve_url("missing-code")` devolvió `None` en lugar de bloquearse.

**🩹 Si sale mal :** Si un código malo se bloquea con un KeyError o similar, la función está indexando `row["url"]` antes de comprobar `row is None`. Si los clics nunca se acumulan en la tabla, al `INSERT` le falta su camino de commit (un `conn.execute` simple dentro de `closing` hace commit al cerrar — elimina el contexto de conexión y se revierte en silencio). Si `resolve_url` muta la base de datos compartida durante la llamada de *búsqueda*, tienes `UPDATE` en lugar de `INSERT` en el camino del clic.

### 3.2 Verifica la resolución y el seguimiento de clics

**✅ Lista de verificación**

- ✅ Los códigos malos devuelven `None`; los buenos devuelven la URL almacenada.
- ✅ Cada resolución buena añade exactamente una fila a `clicks`.
- ✅ Un referente almacenado aterriza en la columna `referrer` cuando se proporciona.

**🤔 Pregunta(s) socrática(s)**

- Contar clics *dentro* de la resolución de una redirección significa que cada redirección necesita una escritura de base de datos. ¿Qué cambiaría en la latencia bajo tráfico pesado — y qué estrategia de batching o caché añadiría primero un servicio de un millón de clics al día?
- El referente viene del llamante. Un llamante malicioso puede forjar `referrer="victim.example"`. ¿Qué hace un acortador de URLs real al respecto, y qué imprimirías en la analítica si te importara?

## Paso 4: Consulta la analítica de clics

Ahora el pago real: agrega los clics registrados en los tres números que un vendedor realmente pide — total, referentes y una serie día a día — directamente desde SQL sin bucle de Python sobre los datos.

### 4.1 Escribe la consulta de analítica

**👟 Pista inicial :** Ejecuta tres agregados SQL con clave en `code`: un `COUNT(*)`, un `GROUP BY referrer ORDER BY count` y una truncación de cadena `substr(clicked_at,1,10)` para la serie por día.

```python
# shortener.py (continuación)
def click_stats(code: str) -> dict:
    with closing(get_conn()) as conn:
        total = conn.execute(
            "SELECT COUNT(*) FROM clicks WHERE code = ?", (code,)
        ).fetchone()[0]
        referrers = conn.execute(
            "SELECT referrer, COUNT(*) AS n FROM clicks "
            "WHERE code = ? GROUP BY referrer ORDER BY n DESC LIMIT 10",
            (code,),
        ).fetchall()
        per_day = conn.execute(
            "SELECT substr(clicked_at, 1, 10) AS day, COUNT(*) AS n "
            "FROM clicks WHERE code = ? GROUP BY day ORDER BY day",
            (code,),
        ).fetchall()
    return {
        "code": code,
        "total_clicks": total,
        "top_referrers": [dict(r) for r in referrers],
        "clicks_per_day": [dict(r) for r in per_day],
    }

print(click_stats("A"))
```

Tres agregados, una forma. `total` es el número principal; `GROUP BY referrer … ORDER BY n DESC` clasifica de dónde viene el tráfico; y `substr(clicked_at, 1, 10)` trunca la marca de tiempo ISO a su fecha (`2026-09-06`), que es la forma barata de obtener una serie por día sin una función de fecha — SQLite está feliz de hacer `GROUP BY` de esa cadena. Cada fila de resultado es `dict(r)` para que la salida sean diccionarios simples serializables a JSON, listos para la API del Paso 5.

**🎯 Resultado esperado :** Un dict con `total_clicks` = 3 para el código `A`, dos entradas de referente (`x.com` luego el bucket `None`) y una lista `clicks_per_day` con una fila de día contando los 3.

**🩹 Si sale mal :** Si `total_clicks` permanece en 0, el insert del Paso 3 no está haciendo commit (ver el problema del Paso 3). Si `referrer` muestra una fila `None` que se niega a agruparse con otras, `GROUP BY referrer` trata el `NULL` de SQL distintamente de la cadena vacía — coalesce con `IFNULL` si quieres fusionarlos. Si la serie por día agrupa todo en un día, `substr(clicked_at,1,10)` está rebanando el formato equivocado.

### 4.2 Verifica la analítica

**✅ Lista de verificación**

- ✅ `click_stats("A")` devuelve el total, los referentes principales y una serie por día para los 3 clics registrados.
- ✅ Cada conteo de referente coincide con el número de llamadas a `resolve_url` con ese referente.
- ✅ El dict devuelto se convierte a JSON sin un serializador personalizado.

**🤔 Pregunta(s) socrática(s)**

- Las rebanadas de `referrer` — incluido el `NULL` — se filtran en la analítica. ¿Qué implica una fila de `GROUP BY referrer` de `null: 0`, y *ocultarías* esa fila o la etiquetarías para el usuario?
- Estos tres agregados corren como tres consultas separadas. ¿Qué `GROUP BY` + `UNION` único podría producir los tres, y cuándo valdría la pena la complejidad SQL extra por el viaje de ida y vuelta único?

## Paso 5: Expónlo como un servicio FastAPI

El motor está completo — ahora se convierte en algo que puedes `curl`. Este paso envuelve las tres operaciones en rutas HTTP: `POST /shorten`, `GET /u/{code}` (que redirige — y registra el clic) y `GET /analytics/{code}`.

### 5.1 Escribe la aplicación FastAPI

**👟 Pista inicial :** Construye las rutas sobre las funciones del motor ya escritas, mapea "código malo" a un `404` HTTP, atrapa el `IntegrityError` del código personalizado como un `409` y mantén un guard `__main__` para que `uvicorn` pueda ejecutar la app.

```python
# shortener.py (continuación)
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
import uvicorn

app = FastAPI(title="URL Shortener")

@app.post("/shorten")
def shorten(url: str, custom: str | None = None) -> dict:
    code = create_link(url, custom=custom)
    return {"short_url": f"/u/{code}", "code": code}

@app.get("/u/{code}")
def go(code: str):
    url = resolve_url(code, referrer=None)
    if url is None:
        raise HTTPException(status_code=404, detail="Unknown short code.")
    return RedirectResponse(url)

@app.get("/analytics/{code}")
def analytics(code: str) -> dict:
    return click_stats(code)

if __name__ == "__main__":
    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

Cada ruta es una línea porque el motor ya posee la lógica. `@app.post("/shorten")` deja que FastAPI tome la URL como un parámetro de consulta hoy y un cuerpo JSON mañana; `@app.get("/u/{code}")` es la redirección que alimenta el seguimiento de clics del Paso 3 — cada golpe en esta ruta es un clic; y `HTTPException(404)` es cómo un código faltante se manifiesta como un error *web* en lugar de un `None` de Python. Ejecutar `uvicorn.run(app, ...)` detrás de `if __name__ == "__main__":` mantiene `shortener.py` importable por tests y notebooks mientras sigue siendo un servidor ejecutable.

**🎯 Resultado esperado :** Ejecutar `uv run python shortener.py` inicia un servidor en `127.0.0.1:8000`. En otra terminal, `curl -s "http://127.0.0.1:8000/shorten?url=https://example.com/x"` devuelve `{"short_url":"/u/B","code":"B"}` (o similar), `curl -L` en `/u/B` sigue la redirección, y `/analytics/B` reporta conteos de clic reales.

**🩹 Si sale mal :** Si `curl` obtiene `Connection refused`, el servidor no está corriendo o enlazó un puerto diferente — comprueba el `port` de `uvicorn.run`. Si `POST /shorten` devuelve `422 Unprocessable Entity`, no se proporcionó el parámetro `url` o la anotación de tipo es errónea — `url: str` es obligatoria, así que una clave de consulta mal escrita da 422. Si `/u/{code}` con un código personalizado lanza 500 en lugar de 409 en duplicados, el `IntegrityError` no se está atrapando en `create_link` — envuelve el insert.

### 5.2 Verifica el servicio completo

**✅ Lista de verificación**

- ✅ `uv run python shortener.py` inicia el servidor en el puerto 8000.
- ✅ `curl` en `/shorten`, `/u/{code}` y `/analytics/{code}` devuelve JSON/redirecciones sensatas.
- ✅ Seguir `/u/{code}` incrementa el `total_clicks` de ese código.
- ✅ Un código desconocido devuelve HTTP 404 con un detalle JSON.

**🤔 Pregunta(s) socrática(s)**

- Cada golpe en `/u/{code}` registra un clic — incluidos los humanos que hacen clic en el enlace acortado por accidente. ¿Qué añadirías para distinguir los clics "reales" (filtros de bot, atribución de primer clic, geo) y a dónde irían esos datos, si se reabriera el esquema?
- `shorten` hoy toma la URL como un parámetro de consulta, que filtra las URLs en los logs del servidor. ¿Qué cambia al pasar a un cuerpo JSON `POST` en el caché, el registro y en cómo los navegadores envían la petición?

## ⚠️ Errores comunes

- **Olvidar `row_factory` por conexión.** Se establece dentro de `get_conn()`, así que cualquier función que cree su propio `sqlite3.connect` obtiene tuplas y `row["url"]` se bloquea. Solución: todo el acceso pasa por `get_conn()`.
- **No hacer commit del clic.** Un `INSERT` simple en una conexión que nunca se cierra limpiamente puede revertirse en silencio, dejando que `resolve_url` devuelva URLs pero la analítica en cero. Solución: usa el contexto `closing(get_conn())` para que el commit al cerrar siempre corra.
- **Códigos personalizados que colisionan.** `INSERT` con un código existente lanza `sqlite3.IntegrityError` — la señal es honesta pero cruda. Solución: atrápalo en `create_link` y mapealo a un `409 Conflict` en el Paso 5.
- **Códigos que nunca dejan de crecer.** `COUNT(*) + 1` produce códigos solo para las filas *existentes*; si borras enlaces, los códigos se reutilizan, rompiendo redirecciones antiguas. Solución: reserva el código por unicidad, o mantén un contador monótono en su propia tabla.
- **Confiar en los encabezados de referente.** Los referentes vienen del llamante y son falsificables. Solución: trátalos como la pista de marketing que son, y nunca dejes que un `referrer` declarado impulse decisiones de seguridad.

## Lo que acabas de construir

Un acortador de URLs genuinamente respaldado por base de datos: códigos base62, persistencia SQLite, seguimiento de clics en cada redirección, analítica impulsada por SQL y un servicio FastAPI que manejaste tú mismo con `curl`. La habilidad transferible es el *bucle de API respaldado por base de datos* — primero el esquema, segundo las funciones del motor, por último el envoltorio HTTP — que es la misma forma de tres capas detrás de las apps de tareas, los paneles y la mayoría de las configuraciones de "recolecta datos, guárdalos, exponlos."

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/url-shortener/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/url-shortener) en el repo del curso es una versión más completa del código anterior, con manejo de cuerpo `POST`, soporte de expiración y una demo impulsada por `TestClient` que puedes ejecutar por completo dentro de un notebook. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Añade una ruta `GET /latest` que liste los enlaces más recientes con sus totales de clics — una consulta `ORDER BY created_at DESC LIMIT 10`.
- Implementa la expiración: una columna que almacene `expires_at`, y que `resolve_url` devuelva `404` cuando `datetime.now()` la haya pasado.
- Limita la velocidad de `/shorten` por IP para que una clave raspada no pueda acuñar mil enlaces por segundo.
- Genera códigos QR para cada URL corta (la biblioteca `qrcode` es una instalación) y sírvelos desde `/u/{code}.png`.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
