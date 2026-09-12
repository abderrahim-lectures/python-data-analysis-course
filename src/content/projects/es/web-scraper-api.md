---
title: "API de Scraping Web"
description: "Obtén páginas de forma responsable con limitación de tasa y reintentos, parselas en registros estructurados con BeautifulSoup, rastrea la paginación y envuelve todo el pipeline en una función reutilizable que produce JSON."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["requests", "beautifulsoup", "web-scraping", "html-parsing", "api"]
learningObjectives:
  - Obtener páginas con requests y manejar errores HTTP con elegancia
  - Parsear HTML con BeautifulSoup usando selectores CSS
  - Limitar la tasa y reintentar para rastrear de forma responsable
  - Rastrear sitios paginados en un único conjunto de datos
  - Envolver el pipeline en una función reutilizable que devuelva JSON estructurado
prerequisites:
  - "Fundamentos de Python (funciones, bucles, diccionarios)"
  - "Comprensión de HTTP y estructura básica de HTML"
  - "Familiaridad con el formato JSON"
---

# 🛠️ 🕷️ API de Scraping Web

La web es mayormente HTML servido a humanos, pero cada "conjunto de datos" que no puedes descargar empezó siendo alguien raspándolo. Este proyecto construye una API de scraping pequeña y responsable contra [books.toscrape.com](https://books.toscrape.com/), un sitio construido *para* practicar esto, con un cliente HTTP con limitación de tasa que reintenta con cortesía, un parser BeautifulSoup que convierte HTML en registros estructurados, un rastreador de paginación y una única función reutilizable que devuelve JSON limpio. El resultado es tu propia mini API de lectura sobre un sitio web público.

Esto asume Python 101 y suficiente HTML para reconocer un encabezado, un enlace y un `div`, no se requiere nada de Análisis de Datos. Es opcional y no se califica; consulta [Proyectos del Mundo Real](/es/proyectos) para ver la lista completa y en crecimiento.

## 🎯 Lo que harás

1. Construir un cliente HTTP con limitación de tasa que reintente fallas transitorias y respete el servidor objetivo.
2. Parsear HTML real en registros de libros estructurados con selectores CSS.
3. Rastrear la paginación del sitio y combinar páginas en un único conjunto de datos.
4. Envolver el pipeline en una función reutilizable que escriba y devuelva JSON.
5. Analizar los registros recolectados en estadísticas de resumen.

## Dónde ejecutar esto

**Localmente con `uv`** es la ruta principal, y aquí no solo es conveniente, es fundamental para la carga. La premisa completa de este proyecto es hacer solicitudes HTTP reales, lo que significa que el entorno tiene que tener acceso de red saliente. El `uv` local lo tiene, y `requests`, `beautifulsoup4` y `lxml` se instalan limpiamente para él.

**Google Colab y ejecuciones de notebook Binder** también funcionan, ambos tienen acceso de red, y el notebook refleja cada paso con un `!pip install` y solicitudes en vivo a books.toscrape.com. **JupyterLite** es genuinamente inadecuado: ejecuta Python en un sandbox de navegador sin red saliente general, así que un `requests.get` no tiene nada a lo que llegar. Usa las insignias de notebook o una ejecución local para este, honestamente.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/web-scraper-api/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/web-scraper-api/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fweb-scraper-api%2Fnotebook.es.ipynb)

## Configuración

Crea el proyecto e instala las tres bibliotecas sobre las que está construido este pipeline.

```bash
uv init web-scraper-api
cd web-scraper-api
uv add requests beautifulsoup4 lxml
```

**`requests`** hace el HTTP, **`beautifulsoup4`** parsea HTML y hace las consultas con selectores CSS, y **`lxml`** es el parser C rápido que BeautifulSoup usa por debajo, es lo que hace `soup.select` rápido en una página completa. Una nota de ética de scraping perfecta antes de empezar: solo raspa sitios que lo permitan. Este curso usa books.toscrape.com porque su nombre es su contrato, existe para ser raspado. Para cualquier cosa que escribas más allá de este proyecto, revisa `robots.txt` primero y mantén tu tasa de solicitudes humana; el limitador de tasa que estás a punto de construir es la versión *educada* de eso.

**✅ Lista de verificación**

- ✅ `uv add requests beautifulsoup4 lxml` terminó y `uv run python -c "import requests, bs4, lxml"` sale en silencio.
- ✅ Puedes alcanzar el objetivo: `uv run python -c "import requests; print(requests.get('https://books.toscrape.com/').status_code)"` imprime `200`.

## Paso 1: Construye un cliente HTTP resistente

Internet suelta paquetes, limita a los clientes y ocasionalmente devuelve una página rota. Un raspador que se bloquea ante el primer tropiezo es inútil, y uno que martillea un servidor es grosero, así que este paso construye un cliente con dos personalidades: espera con cortesía entre solicitudes (limitación de tasa) y reintenta con cortesía cuando algo transitorio falla (backoff).

### 1.1 Escribe el limitador de tasa

**👟 Pista inicial :** Aplica un intervalo mínimo entre solicitudes en una pequeña clase, rastrea el tiempo de la última solicitud y `sleep` la diferencia cuando sea necesario.

```python
# scraper.py
import time
import json
import requests

class RateLimiter:
    def __init__(self, requests_per_second: float = 1.0):
        self.min_interval = 1.0 / requests_per_second
        self.last_request = 0.0

    def wait(self) -> None:
        elapsed = time.time() - self.last_request
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request = time.time()

limiter = RateLimiter(requests_per_second=0.5)

limiter.wait()
print(f"Just waited; last_request={limiter.last_request:.2f}")
limiter.wait()
print(f"Immediate second call also waited; last_request={limiter.last_request:.2f}")
```

La conversión de unidades en el constructor es toda la idea: `requests_per_second=0.5` significa dos segundos entre solicitudes, y `1.0 / 0.5` calcula ese intervalo. `wait()` hace luego *dos* trabajos, dormir si estás demasiado temprano, y siempre estampar `last_request = time.time()`, así que la segunda llamada consecutiva no tiene más remedio que esperar. `last_request` empieza en `0.0`, lo que significa que el primer `wait()` nunca duerme (un tiempo transcurrido enorme) pero sin embargo prepara correctamente el reloj. Este es el patrón de texto adyacente a token-bucket detrás de todo rastreador respetuoso.

**🎯 Resultado esperado :** Ambos waits corren y cada línea imprime una `last_request` creciente monótonamente con marcas de tiempo a aproximadamente dos segundos de distancia.

**🩹 Si sale mal :** Si el segundo wait es instantáneo, la rama del `time.sleep` nunca se dispara porque `last_request` no se actualizó después del primer wait. Si los waits son mucho más largos que dos segundos, `requests_per_second` se pasa como una tasa entera pero se divide en otro lugar. Si la ortografía `rate_per_second` se filtra desde otro ejemplo, solo la firma `__init__` es autoritativa, la prueba anterior llama `RateLimiter(requests_per_second=0.5)`.

### 1.2 Obtén una página con reintentos

**👟 Pista inicial :** Envuelve `requests.get` en un bucle que reintente en fallas transitorias (timeouts, errores de conexión, 429/5xx) con demoras crecientes, y dale a la solicitud un User-Agent real.

```python
# scraper.py (continuación)
def fetch_page(url: str, max_retries: int = 3, timeout: int = 10) -> requests.Response:
    """Fetch a URL with retry logic and rate limiting."""
    headers = {"User-Agent": "PythonScraper/1.0 (educational project)"}

    for attempt in range(1, max_retries + 1):
        limiter.wait()
        try:
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response
        except requests.exceptions.HTTPError:
            if response.status_code == 429 or response.status_code >= 500:
                time.sleep(2 ** attempt)
            else:
                raise
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            time.sleep(2 ** attempt)

    raise RuntimeError(f"Failed to fetch {url} after {max_retries} retries")

response = fetch_page("https://books.toscrape.com/")
print(f"Status: {response.status_code}, Length: {len(response.text)} chars")
```

Tres decisiones hacen este cliente con forma de producción. **El User-Agent es explícito**, `PythonScraper/1.0 (educational project)` le dice al servidor *quién* llama en lugar de esconderse detrás del valor predeterminado de la biblioteca, que es lo que hace un rastreador educado. **Solo las fallas transitorias reintentan**: los errores 4xx como 404 son el servidor diciendo "esto es definitivo", así que se re-lanzan inmediatamente, mientras que 429 (limitado de tasa) y 5xx (tropiezo del servidor) y un timeout o error de conexión reciben todos `time.sleep(2 ** attempt)`, backoff exponencial, 2s, luego 4s, así que los reintentos se vuelven más suaves, no más enojados. Y `limiter.wait()` corre *antes* de cada intento, plegando la disciplina del Paso 1.1 en la obtención para que ningún llamante pueda saltarla.

**🎯 Resultado esperado :** `Status: 200, Length: ...`, un HTTP 200 real y el conteo de caracteres de la página de inicio. Apuntar `fetch_page` a una página deliberadamente inexistente (p. ej. `https://books.toscrape.com/nope`) lanza un error HTTP en lugar de devolver basura.

**🩹 Si sale mal :** Si obtienes `NameError: response is not defined` en la rama `HTTPError`, `requests.get` en sí lanzó antes de asignar `response`, pasar `timeout` en la llamada (ya está ahí) es lo que lo previene. Si un 404 repite para siempre, falta la rama `else: raise`, así que *cada* estado HTTP reintenta. Si los sleeps de reintento nunca esperan visiblemente, el tiempo `2 ** attempt` vuela en una red rápida, eso es correcto; prueba con `timeout=1` en un host inalcanzable para sentir el backoff.

### 1.3 Verifica el cliente HTTP

**✅ Lista de verificación**

- ✅ `RateLimiter(requests_per_second=0.5)` aplica brechas de ~2s entre llamadas `wait()` consecutivas.
- ✅ `fetch_page` devuelve una respuesta `200` para la página de inicio y lanza limpiamente para una ruta inexistente.
- ✅ Solo los estados transitorios (429, 5xx, timeouts, errores de conexión) disparan reintentos.

**🤔 Pregunta(s) socrática(s)**

- `limiter.wait()` duerme por la brecha *antes* de una solicitud. ¿Qué cambia si el sueño ocurriera en cambio después de que llegue la respuesta, y qué patrón es más amable con el servidor cuando las respuestas son lentas?
- El bucle de reintentos usa `time.sleep(2 ** attempt)`. ¿Por qué backoff *exponencial* en lugar de esperar un segundo fijo cada vez, y qué sentiría un servidor bajo sobrecarga de un reintentador de intervalo fijo que no sentiría de este?

## Paso 2: Parsear HTML en registros estructurados

Una página obtenida es una pared de texto; un conjunto de datos utilizable es una lista de dicts. Este paso construye el parser que convierte cada `article` en la página de la librería en un registro limpio, usando los selectores CSS de BeautifulSoup, que se leen como el CSS que escribirías para una hoja de estilos.

### 2.1 Escribe el parser de libros

**👟 Pista inicial :** Selecciona cada tarjeta de producto con un `select`, extrae cada campo con `select_one`, y siempre protege contra elementos faltantes para que un campo ausente no mate un registro.

```python
# scraper.py (continuación)
from bs4 import BeautifulSoup

def parse_books(html: str) -> list[dict]:
    """Extract book data from books.toscrape.com HTML."""
    soup = BeautifulSoup(html, "lxml")
    books = []

    for article in soup.select("article.product_pod"):
        title_tag = article.select_one("h3 a")
        price_tag = article.select_one(".price_color")
        availability_tag = article.select_one(".availability")
        rating_tag = article.select_one(".star-rating")

        rating_classes = rating_tag.get("class", []) if rating_tag else []
        rating_map = {"One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5}
        rating = rating_map.get(rating_classes[1], 0) if len(rating_classes) > 1 else 0

        books.append({
            "title": title_tag["title"] if title_tag else "Unknown",
            "url": "https://books.toscrape.com/" + title_tag["href"] if title_tag else "",
            "price": price_tag.text.strip() if price_tag else "N/A",
            "availability": availability_tag.text.strip() if availability_tag else "Unknown",
            "rating": rating,
        })
    return books

html = fetch_page("https://books.toscrape.com/").text
books = parse_books(html)
print(f"Found {len(books)} books")
for book in books[:3]:
    print(f"  {book['title']} -- {book['price']} -- {'*' * book['rating']}")
```

El selector `"article.product_pod"` es todo el vocabulario: le pide a la sopa cada elemento `<article>` que lleve la clase `product_pod`, que es exactamente cómo el sitio marca una tarjeta de libro. Cada `select_one` toma luego *una* coincidencia dentro de esa tarjeta: `"h3 a"` el enlace del título (cuyo atributo `title` contiene el nombre), `".price_color"` el precio, y `".star-rating"` una etiqueta cuya *segunda clase* nombra la calificación en palabras. El parser lee `rating_classes[1]` y mapea la palabra a un número, una demostración limpia de que a veces el HTML codifica datos en clases en lugar de texto. Cada campo está protegido contra ausencia (`if title_tag else ...`), porque un sitio que cambia una forma de clase no debería bloquear todo tu rastreo.

**🎯 Resultado esperado :** `Found 20 books` y una vista previa de tres filas como `A Light in the Attic -- £51.77 -- *****`.

**🩹 Si sale mal :** Si `Found 0 books`, el selector `"article.product_pod"` no coincide con el markup del sitio, inspecciona con `soup.select_one("article")` para ver qué hay realmente (el sitio puede haber cambiado). Si los precios vuelven vacíos, la clase es `.price_color` y el atributo `text` requiere que se haya encontrado la etiqueta. Si cada calificación es `0`, `rating_classes[1]` está vacío o el orden de la lista de clases cambió.

### 2.2 Verifica el parser en una forma conocida

**👟 Pista inicial :** Cuenta títulos distintos y confirma que los cinco campos están poblados por registro, una comprobación rápida de forma antes de confiar el parser a un rastreo completo.

```python
# scraper.py (continuación)
print(f"Records: {len(books)}")
print("Fields per record:", sorted(books[0].keys()))
print("Non-empty titles:", sum(1 for b in books if b["title"]))
print("Ratings seen:", sorted({b["rating"] for b in books}))
```

Verificar-antes-de-escalar es la disciplina aquí: una página, 20 registros, y compruebas que cada campo existe y que cada calificación mapea a 1–5 *antes* de que varias páginas de rastreo confíen en el parser. La comprensión de conjunto `{b["rating"] for b in books}` muestra, de un vistazo, si el mapeo de calificaciones produjo valores sensatos.

**🎯 Resultado esperado :** `Records: 20`, los cinco nombres de campo, `Non-empty titles: 20` y `Ratings seen: [1, 2, 3, 4, 5]` (o el subconjunto presente en esa página).

**🩹 Si sale mal :** Si un nombre de campo está mal escrito, el dict `books.append` del parser y la comprobación aquí discrepan, grepear ambos. Si `Ratings seen` incluye `0`, algunas tarjetas carecen de la clase star-rating y el fallback se las comió; eso es esperado para algunas listas, y el mapeo aun así funcionó.

### 2.3 Verifica el paso de parseo

**✅ Lista de verificación**

- ✅ `parse_books` en la página de inicio devuelve 20 registros con exactamente los cinco campos.
- ✅ El `rating` de cada registro es un entero 1–5, derivado de una palabra de clase.
- ✅ Un registro con un elemento faltante degrada a un marcador de posición en lugar de bloquear el bucle.

**🤔 Pregunta(s) socrática(s)**

- El parser extrae la URL concatenando `"https://books.toscrape.com/" + title_tag["href"]`. ¿Qué se rompe si el sitio cambia a hrefs *absolutos* como `/catalogue/foo.html`, y qué haría un `urljoin` robusto que la concatenación no puede?
- Las calificaciones se leen de un nombre de clase, no del texto visible. ¿Cuándo cambiarían los desarrolladores del sitio esos nombres de clase, y qué implica eso sobre cuánto tiempo un parser de selectores CSS se mantiene correcto en comparación con un parser que lee texto visible?

## Paso 3: Rastrea entre páginas

Una página es una muestra; el catálogo es el conjunto de datos. Books.toscrape pagina a 20 libros por página con un enlace `next`, y este paso sigue ese enlace, acotado por un tope `max_pages`, hasta que el rastreo termine o la paginación se agote.

### 3.1 Sigue la cadena de paginación

**👟 Pista inicial :** Haz un bucle página por página, parsea cada respuesta, extiende el acumulador, lee el enlace `next` del HTML de la página y resuélvelo en la siguiente URL.

```python
# scraper.py (continuación)
def scrape_books(base_url: str, max_pages: int = 3) -> list[dict]:
    """Scrape books across multiple pages with progress reporting."""
    all_books = []
    url = base_url

    for page in range(1, max_pages + 1):
        print(f"Scraping page {page}...")
        try:
            response = fetch_page(url)
            books = parse_books(response.text)
            all_books.extend(books)
            print(f"  Found {len(books)} books (total: {len(all_books)})")

            soup = BeautifulSoup(response.text, "lxml")
            next_btn = soup.select_one("li.next a")
            if next_btn:
                url = base_url.rsplit("/", 1)[0] + "/" + next_btn["href"]
            else:
                break
        except Exception as e:
            print(f"  Error on page {page}: {e}")
            break
    return all_books

books = scrape_books("https://books.toscrape.com/catalogue/page-1.html", max_pages=3)
print(f"\nTotal books scraped: {len(books)}")
```

Cada elección interesante está en una línea diferente. `all_books.extend(books)` es la primitiva de acumulación, convierte la lista por página en un conjunto de datos combinado, un `extend` a la vez. La línea de la siguiente URL, `url = base_url.rsplit("/", 1)[0] + "/" + next_btn["href"]`, es el rastreo en dos partes: `rsplit("/", 1)` corta el último segmento de ruta (`page-1.html`), y el `href` del enlace `next` (que es `catalogue/page-2.html`, relativo) se añade, una resolución de URL relativa hecha a mano. Y `max_pages` es el límite de cortesía *y* seguridad: exploras la página 1→2→3 y te detienes, para que ni el sitio ni tu presupuesto se sorprendan por un rastreo accidental de cien páginas.

**🎯 Resultado esperado :** Tres líneas de progreso (`Scraping page 1...`, `Found 20 books (total: 20)`, etc.), luego `Total books scraped: 60`.

**🩹 Si sale mal :** Si el rastreo se detiene después de una página, `li.next a` no coincidió (el markup del botón siguiente del sitio cambió) o el `break` se dispara incondicionalmente. Si *cada* página re-obtiene la página 1 en un bucle, `url` se actualiza a una cadena idéntica cada vez, comprueba que el `rsplit` realmente reemplaza el segmento, o imprime `url` antes de obtener. Si una excepción a mitad de camino mata toda la ejecución, falta el `try/except` por página que imprime y hace `break`.

### 3.2 Verifica el rastreo

**✅ Lista de verificación**

- ✅ `scrape_books(..., max_pages=3)` devuelve 60 registros con URLs únicas.
- ✅ El bucle se detiene en `max_pages` incluso cuando existen más páginas.
- ✅ El total impreso es igual a la suma de los conteos por página.

**🤔 Pregunta(s) socrática(s)**

- El bucle se rompe cuando no hay botón `next` *y* cuando se alcanza `max_pages`. Si un rastreo real necesitara reanudarse donde se detuvo (digamos, tras un choque), ¿qué tendrías que persistir para hacerlo reanudable, y está el código actual cerca de eso?
- Los rastreos de paginación tienden a ser secuenciales: no puedes saber la tercera URL hasta que has leído el enlace `next` de la segunda página. ¿Bajo qué circunstancia podría un rastreo paralelizar páginas, y qué nuevo problema crea eso para el limitador de tasa del Paso 1?

## Paso 4: Conviértelo en una función API reutilizable

El conjunto de funciones que has construido es un pipeline; uno *reutilizable* es una única función que ejecuta todo el pipeline y devuelve datos estructurados. Este paso envuelve rastrear → parsear → guardar en una llamada `scrape_books_to_json` y añade el volver-a-cargar, para que `books.json` se comporte como la respuesta de una pequeña API de lectura.

### 4.1 Envuelve el pipeline en una función

**👟 Pista inicial :** Haz que el envoltorio devuelva lo que guarda, escribe con `json.dump(indent=2)` y devuelve la lista para que los llamantes obtengan datos incluso si ignoran el archivo.

```python
# scraper.py (continuación)
def scrape_books_to_json(base_url: str, max_pages: int = 3, outfile: str = "books.json") -> list[dict]:
    """Crawl pages and write the combined records to a JSON file."""
    records = scrape_books(base_url, max_pages=max_pages)
    with open(outfile, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Wrote {len(records)} records to {outfile}")
    return records

books = scrape_books_to_json("https://books.toscrape.com/catalogue/page-1.html", max_pages=3)
print(f"Returned {len(records := books)} records ready to use in memory")
```

El contrato aquí es la parte interesante: `scrape_books_to_json` devuelve una `list[dict]` simple, exactamente lo que devolvería una llamada de API, *y* escribe lo mismo en disco. Envolver el pipeline cambia la superficie de la función de "tres herramientas separadas" a "una llamada que te da el conjunto de datos", que es la interfaz con forma de API detrás del nombre del proyecto. `json.dump(records, f, indent=2)` hace el archivo legible por humanos, y como cargar es un `json.load` puro, el archivo guardado se vuelve una instantánea portátil que puedes re-analizar sin tocar la red de nuevo.

**🎯 Resultado esperado :** Las líneas de progreso del rastreo, `Wrote 60 records to books.json` y `Returned 60 records ready to use in memory`.

**🩹 Si sale mal :** Si el archivo se escribe pero la función devuelve `None`, falta la línea `return records`. Si el archivo es una línea densa, se eliminó `indent=2`. Si una segunda llamada con `outfile="books2.json"` sigue sobrescribiendo `books.json`, el predeterminado codificado ganó el argumento, deben diferir en el sitio de la llamada.

### 4.2 Carga y cuenta desde el JSON guardado

**👟 Pista inicial :** Lee la instantánea con `json.load` para poder re-ejecutar el análisis sin golpear de nuevo la red y re-raspar.

```python
# scraper.py (continuación)
with open("books.json") as f:
    saved_books = json.load(f)

print(f"Reloaded {len(saved_books)} records from books.json")
print("First title:", saved_books[0]["title"])
```

El punto de persistir una instantánea es que el análisis se vuelve una operación de *lectura*: sin red, sin reintentos, sin limitador de tasa, solo un archivo. `json.load` trae de vuelta exactamente la lista que escribió el envoltorio, porque cada valor (cadenas, enteros, dicts) en los registros es serializable a JSON por construcción. Esta es la mitad offline de un flujo de raspar-y-qué-sigue: raspa una vez, analiza muchas veces.

**🎯 Resultado esperado :** `Reloaded 60 records from books.json` y el título del primer libro.

**🩹 Si sale mal :** Si el archivo falta, el envoltorio de 4.1 nunca corrió (ejecútalo primero). Si cargar lanza `json.decoder.JSONDecodeError`, el archivo se editó a mano o se escribió parcialmente, regenéralo con el envoltorio. Si `saved_books[0]` falla, el archivo contiene una estructura de nivel superior que no es una lista.

### 4.3 Verifica la API reutilizable

**✅ Lista de verificación**

- ✅ `scrape_books_to_json(".../page-1.html", max_pages=3)` devuelve 60 registros *y* escribe `books.json`.
- ✅ `json.load` re-lee los mismos 60 registros offline.
- ✅ El archivo guardado es legible por humanos y parece una lista de objetos de libro.

**🤔 Pregunta(s) socrática(s)**

- El envoltorio tanto escribe un archivo como devuelve datos. ¿Cuál es el argumento *en contra* de devolver datos cuando el propósito principal es un archivo en disco, y qué esperaría un llamante que solo quería el archivo que la función devuelva?
- El campo `url` en cada registro almacena la URL completa concatenada. En la pregunta socrática de 2.1, nos preocupamos por hrefs absolutos vs relativos. ¿Dónde aflora esa decisión de diseño ahora que re-cargas `books.json` más tarde, y por qué un conjunto de datos *almacenado* oculta esos errores si ya estaban horneados en las URLs al parsear?

## Paso 5: Analiza el conjunto de datos raspado

Raspar es solo la mitad del valor; la otra mitad es responder "¿y qué?". Este paso lee los registros y produce estadísticas de resumen, calificaciones, rangos de precio, stock, con protecciones cuidadosas para datos que faltan o no son numéricos.

### 5.1 Calcula estadísticas de resumen

**👟 Pista inicial :** Convierte las cadenas de precio a flotantes defensivamente, promedia las calificaciones y calcula el porcentaje en stock, cada uno protegido para que un registro malo no pueda matar el resumen.

```python
# scraper.py (continuación)
def analyze_books(records: list[dict]) -> dict:
    """Generate summary statistics from scraped book data."""
    if not records:
        return {"error": "No books to analyze"}

    ratings = [b["rating"] for b in records if b["rating"] > 0]
    prices = []
    for b in records:
        try:
            prices.append(float(b["price"].replace("\u00a3", "")))
        except (ValueError, AttributeError):
            continue

    in_stock = sum(1 for b in records if "in stock" in b["availability"].lower())
    return {
        "total_books": len(records),
        "average_rating": round(sum(ratings) / len(ratings), 2) if ratings else 0,
        "price_min": min(prices) if prices else None,
        "price_max": max(prices) if prices else None,
        "price_avg": round(sum(prices) / len(prices), 2) if prices else None,
        "in_stock_percent": round(in_stock / len(records) * 100, 1),
    }

print(json.dumps(analyze_books(books), indent=2))
```

La línea del precio es con la que vale la pena quedarse: `float(b["price"].replace("\u00a3", ""))`. El raspador almacenó los precios como cadenas vivas como `"£51.77"`, así que el análisis necesita quitar el signo de libra, escrito como su escape Unicode `\u00a3` para ser explícito sobre exactamente qué carácter, y luego parsear el número. El `try/except` aísla un registro malo: un precio que sobrevivió al parseo como `"N/A"` (el fallback "unknown" del Paso 2) falla `float()` limpiamente y se *omite*, no es fatal. Las calificaciones se promedian solo sobre libros que realmente tienen una calificación (`if b["rating"] > 0`), y cada agregado que podría dividir por cero lleva un guard `if ... else`, la misma forma defensiva que practicaste en los presupuestos del rastreador de subvenciones.

**🎯 Resultado esperado :** Un bloque JSON que reporta `total_books`, `average_rating`, precio min/max/avg e `in_stock_percent`, con números reales derivados de los 60 registros raspados (por ejemplo `"total_books": 60`, `"in_stock_percent": 100.0`).

**🩹 Si sale mal :** Si todos los precios son `None`, el `.replace("\u00a3", "")` no coincidió el carácter de moneda real (quizás tus datos usan un símbolo diferente), imprime un `b["price"]` crudo y revisa sus bytes. Si `in_stock_percent` es sospechosamente 0.0, la comparación en minúsculas de la cadena de disponibilidad no encuentra `"in stock"`, imprime una cadena de disponibilidad de muestra y ajusta la coincidencia. Si un registro obvio malo bloqueó la ejecución, falta el `try/except` alrededor de `float()`, es el guard que convierte una fila mala en una omisión.

### 5.2 Verifica el análisis

**✅ Lista de verificación**

- ✅ `analyze_books` devuelve las seis claves de resumen, ninguna lanzando en datos sucios.
- ✅ Los precios son numéricos (min ≤ avg ≤ max), las calificaciones promedian a una cifra 1–5.
- ✅ Una lista de registros vacía devuelve `{"error": "No books to analyze"}` en lugar de bloquearse.

**🤔 Pregunta(s) socrática(s)**

- El resumen *omite* en silencio los precios no parseables. ¿Cuándo es omitir la elección honesta, y cuándo produce silenciosamente un promedio engañoso, qué añadirías (un conteo de filas omitidas, una advertencia) para decirle a un lector que el número no es todo el conjunto de datos?
- `in_stock_percent` divide por `len(records)`. Si el texto de disponibilidad del sitio cambiara de `"In stock"` a `"Available"`, cada registro cuenta en silencio como no-en-stock. ¿Qué sugiere eso sobre la comparación de cadenas codificada en pipelines de análisis, y cómo harías la definición de "in stock" una constante única e inspeccionable?

## ⚠️ Errores comunes

- **Raspar sitios que no lo quieren.** La regla ética es concreta: revisa `robots.txt`, nota el ToS del sitio y mantén tu tasa humana. Solución: este proyecto apunta a books.toscrape.com *porque* está construido para practicar; para objetivos reales, respeta el archivo que existe en `/robots.txt` antes de escribir un solo selector.
- **Sin limitación de tasa, o el limitador eludido.** Solicitar en un bucle apretado te hace que te limiten la tasa (429) o te bloqueen por completo, y eventualmente los logs del dueño del sitio son tu problema. Solución: haz `limiter.wait()` parte de `fetch_page` misma (como hace el Paso 1) para que *cada* ruta de solicitud pague el peaje, no solo las que recordaste proteger.
- **Reintentar en errores permanentes.** Un 404 o 403 es definitivo; reintentarlo solo desperdicia tu cuota y molesta al servidor. Solución: solo haz backoff en 429, 5xx, timeouts y errores de conexión, re-lanza cualquier otra cosa, exactamente como ramifica `fetch_page`.
- **Fragmentación del selector CSS.** Un cambio de clase o un elemento faltante produce cero registros o un bloqueo. Solución: protege cada resultado de `select_one` (el patrón `if tag else default` del Paso 2), y re-verifica contra una página en vivo cuando el sitio cambie de forma.
- **Mojibake de codificación en texto raspado.** Texto que se decodifica como `"Â£51.77"` en lugar de `"£51.77"` viene de leer bytes bajo el códec equivocado. Solución: confía en `response.text` de `requests` (que usa el charset que declara el servidor), y si el mojibake aparece de todos modos, decodifica explícitamente (`response.content.decode("utf-8")`) y normaliza tu parseo alrededor del carácter real.

## Lo que acabas de construir

Una pequeña y educada API de scraping web: un cliente con limitación de tasa que reintenta solo fallas transitorias, un parser de selectores CSS que convierte HTML en registros limpios, un rastreador de paginación, una única función `scrape_books_to_json` que devuelve el conjunto de datos y lo guarda, y un pase de análisis sobre el resultado. La habilidad transferible es *la recolección responsable de datos*: convertir una página pública no estructurada en registros estructurados, almacenables y analizables, mientras tratas al servidor como quisieras que te trataran, es la habilidad exacta detrás de los rastreadores de precios, los agregadores de bolsas de trabajo y los conjuntos de datos de investigación.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/web-scraper-api/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/web-scraper-api) en el repo del curso incluye el pipeline completo con exportación CSV y una opción de proxy lista para activar. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Extrae la **categoría del libro** del breadcrumb de cada página (`Home > Books > Travel`) y añádela como campo, un `select` en la lista del breadcrumb y una división en el separador `>` es toda la función.
- Añade **exportación CSV** junto al JSON: `csv.DictWriter` con los cinco campos de registro te da una hoja de cálculo que cualquiera puede abrir, y el módulo `csv` entrecomilla los títulos llenos de comas por ti.
- Soporta **proxies y encabezados de reintento**: dale a `fetch_page` un dict `proxies={"http": ..., "https": ...}` opcional para `requests.get`, y un sleep consciente de `Retry-After` en 429, las dos perillas que convierten un raspador en un rastreador.
- Envuelve todo en un **endpoint FastAPI**: `@app.get("/books")` devolviendo `scrape_books_to_json(...)` convierte tu función en una API HTTP literal que otros programas pueden llamar.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a leer la web con Python. 🎓
