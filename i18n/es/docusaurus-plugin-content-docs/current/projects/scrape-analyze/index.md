---
id: scrape-analyze
title: "Extrae y Analiza un Sitio Web en Vivo"
sidebar_label: "Extrae y Analiza un Sitio Web"
slug: /projects/scrape-analyze
description: "Gradúate del playground en el navegador a Python de verdad: extrae datos de un sitio web real, límpialos con pandas, y produce tus propios gráficos — sin necesitar clave de API."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Extrae y Analiza un Sitio Web en Vivo

<ProjectPublishedDate projectId="scrape-analyze" />

<ProjectGreeting />

Cada dataset de la sección de Data Analysis hasta ahora llegó como un CSV ya listo, sentado en `static/datasets/`, esperando ser cargado con `pd.read_csv`. El análisis real rara vez empieza ahí — normalmente tienes que ir a buscar los datos tú mismo. Este proyecto es ese paso: obtén una página web real y en vivo por HTTP, transforma el HTML en filas estructuradas, limpia el resultado con pandas, y produce tu propio pequeño análisis con gráficos. Asume comodidad con pandas al nivel del track Normal de Data Analysis — selección, filtrado, `groupby`, limpieza básica — las mismas habilidades que ya usaste para reproducir un notebook de EDA guiado. Este proyecto te pide apuntar esas mismas habilidades a datos que nadie te entregó.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para ver la lista completa, que sigue creciendo.

## 🎯 Qué harás

1. Instalar `uv` y configurar un proyecto local.
2. Obtener una página web real con `requests` y analizar su HTML con `beautifulsoup4`.
3. Seguir enlaces de paginación para recolectar los datos de un sitio entero en un CSV.
4. Cargar ese CSV en pandas y limpiarlo — dividiendo una columna de string empaquetado, revisando espacios en blanco y dtypes.
5. Analizar los datos limpios y producir un par de gráficos honestos y correctamente etiquetados con `matplotlib`.

## Dónde ejecutar esto

**En local con `uv`** es el camino que siguen los pasos de esta lección, y el recomendado — es Python real corriendo en tu propia máquina, el mismo movimiento de "graduarse a Python real" que cada otro proyecto de esta sección. El Paso 1 de abajo te guía por la instalación.

**GitHub Codespaces** es una alternativa sin configuración si prefieres no instalar nada en local todavía: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta exactamente los mismos comandos de `uv` desde una terminal en tu pestaña del navegador.

**Google Colab o Kaggle Notebooks son un buen ajuste genuino para este proyecto en particular**, no solo un respaldo — no hay servidor de archivos local, ni GPU, ni proceso de larga duración que gestionar, y la salida de gráficos en línea es exactamente lo que un notebook hace bien. Ejecuta `!pip install requests beautifulsoup4 pandas matplotlib` en una celda, y luego pega los scripts de abajo como celdas del notebook, adaptando las rutas de archivo (p. ej. guardando `quotes.csv` en el directorio de trabajo del notebook en lugar de tu propia máquina) según sea necesario. Esta es una forma cómoda y legítima de hacer este proyecto de principio a fin sin salir del navegador.

## Paso 1: Instalar `uv`

`uv` es una única herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, y luego confirma que se instaló:

```bash
uv --version
```

Luego configura un proyecto local:

```bash
uv init scrape-analyze
cd scrape-analyze
uv add requests beautifulsoup4 pandas matplotlib
```

Fíjate en lo que falta en esa lista: ninguna clave de API, ningún registro de nivel gratuito, nada que configurar antes de poder ejecutar una sola línea de código — solo tu propio script y un sitio web real. Ese es un contraste deliberado con los proyectos de sabor IA de esta sección, y una de las razones por las que hacer scraping es un buen próximo paso a probar.

## Paso 2: Obtén y analiza la página

Este proyecto apunta a [quotes.toscrape.com](https://quotes.toscrape.com) — un sitio público construido y mantenido específicamente para practicar scraping. No tiene muro de inicio de sesión, ni límite de tasa contra el cual pelear, un diseño HTML estable y bien estructurado, y paginación, etiquetas y páginas de autor con las que trabajar. Eso importa: hacer scraping de un sitio comercial real plantea preguntas reales sobre sus términos de servicio y `robots.txt` que esta lección evita deliberadamente usando un sitio construido exactamente para este propósito.

:::tip[Siempre revisa robots.txt antes de hacer scraping en cualquier otro lugar]
Antes de apuntar este código a cualquier sitio que no sea quotes.toscrape.com, revisa el `robots.txt` de ese sitio (p. ej. `https://example.com/robots.txt`) y sus términos de servicio. `robots.txt` indica qué partes de un sitio las herramientas automatizadas pueden y no pueden obtener — respetarlo es la expectativa mínima para cualquier scraper, y algunos sitios prohíben explícitamente el scraping en sus términos incluso donde `robots.txt` se queda en silencio.
:::

Una solicitud HTTP `GET` es lo mismo que hace tu navegador cada vez que visitas una página — le pide a un servidor una URL y recibe de vuelta el HTML crudo como texto. `requests` hace esto en una línea:

```python
import requests

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()  # turns a 404/500 into a loud exception instead of a silent bad parse
html = response.text
```

Ese string `html` es un árbol de etiquetas anidadas — `<div>`, `<span>`, `<a>` — cada una llevando opcionalmente atributos como `class` o `href`. BeautifulSoup analiza ese texto en un árbol navegable y te da dos herramientas principales para buscar en él: `find` (la primera coincidencia) y `find_all` (todas las coincidencias), ambas filtrables por nombre de etiqueta y por atributos como `class_`. Abre el HTML de la página con "Ver código fuente de la página" en tu navegador y verás que cada cita está dentro de un `<div class="quote">`, con el texto de la cita en un `<span class="text">`, el autor en un `<small class="author">`, y cada etiqueta en un `<a class="tag">`.

```python
# scrape.py
import time

import requests
from bs4 import BeautifulSoup

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")

for quote_div in soup.find_all("div", class_="quote"):
    text = quote_div.find("span", class_="text").get_text(strip=True)
    author = quote_div.find("small", class_="author").get_text(strip=True)
    tags = [tag.get_text(strip=True) for tag in quote_div.find_all("a", class_="tag")]
    print(f"{author}: {text} {tags}")

time.sleep(1)  # see the tip below
```

```bash
uv run python scrape.py
```

Deberías ver diez líneas impresas, una por cada cita de la página principal.

:::tip[Autolimita tu tasa, incluso en un sitio de práctica]
`time.sleep(1)` entre solicitudes no lo exige estrictamente quotes.toscrape.com, pero es un hábito que vale la pena construir ahora en lugar de después de haber golpeado accidentalmente un servidor real con docenas de solicitudes por segundo. Un retraso corto y deliberado entre solicitudes es etiqueta estándar de scraping — evita que tu script parezca (o actúe como) un intento de denegación de servicio, y es un seguro barato contra que te bloqueen temporalmente la IP en sitios que sí imponen límites.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python scrape.py` se ejecuta sin errores.</StepChecklistItem>
<StepChecklistItem>Imprime exactamente 10 líneas, una por cada cita de la página principal.</StepChecklistItem>
<StepChecklistItem>Cada línea impresa tiene texto real, un nombre de autor real, y una lista de etiquetas no vacía — no `None` ni strings vacíos.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `.get_text(strip=True)` y `.text` ambos devuelven el contenido de texto de una etiqueta, pero solo uno de ellos elimina los espacios en blanco al inicio/final. ¿Qué se rompería más adelante en este proyecto — específicamente en el paso de limpieza del Paso 4 — si usaras `.text` en todas partes en su lugar?
- El texto de la cita en la página está envuelto en comillas curvas (`"…"`), no rectas. Si más adelante comparas el texto de una cita contra un string fijo en el código, ¿qué podría salir mal, y cómo lo notarías?

## Paso 3: Maneja la paginación y recolecta todos los datos

quotes.toscrape.com reparte sus citas en varias páginas, con un enlace "Next" al final de cada página excepto la última. En lugar de fijar en el código "recorre 10 veces", sigue el enlace mismo — así el script sigue funcionando aunque cambie el número de páginas:

```python
# scrape.py (continued)
import csv

BASE_URL = "https://quotes.toscrape.com"


def parse_quotes(soup):
    """Extracts {"text", "author", "tags"} for every quote on one parsed page."""
    quotes = []
    for quote_div in soup.find_all("div", class_="quote"):
        text = quote_div.find("span", class_="text").get_text(strip=True)
        author = quote_div.find("small", class_="author").get_text(strip=True)
        tags = [t.get_text(strip=True) for t in quote_div.find_all("a", class_="tag")]
        quotes.append({"text": text, "author": author, "tags": ", ".join(tags)})
    return quotes


def scrape_all_quotes():
    all_quotes = []
    url = f"{BASE_URL}/"

    while url is not None:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.RequestException as exc:
            # One failed request shouldn't kill a scrape that already collected
            # data from several pages -- log it and stop cleanly instead of crashing.
            print(f"Failed to fetch {url}: {exc}. Stopping here.")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        all_quotes.extend(parse_quotes(soup))

        next_li = soup.find("li", class_="next")
        url = requests.compat.urljoin(url, next_li.find("a")["href"]) if next_li else None
        if url is not None:
            time.sleep(1)

    return all_quotes


if __name__ == "__main__":
    quotes = scrape_all_quotes()
    with open("quotes.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "author", "tags"])
        writer.writeheader()
        writer.writerows(quotes)
    print(f"Saved {len(quotes)} quotes to quotes.csv")
```

```bash
uv run python scrape.py
```

El `try`/`except` alrededor de la solicitud es el agregado importante aquí, no una formalidad: sin él, una solicitud inestable en la página 7 de 10 lanzaría una excepción no manejada y perdería las seis páginas ya obtenidas, en lugar de guardar lo que tienes y detenerte limpiamente. `requests.compat.urljoin` convierte el `href` relativo del enlace "Next" (como `/page/2/`) en una URL completa combinándolo con la URL de la página actual — lo mismo que hace tu navegador automáticamente cuando haces clic en un enlace relativo.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python scrape.py` termina e imprime una línea "Saved N quotes".</StepChecklistItem>
<StepChecklistItem>`quotes.csv` existe y tiene más de 10 filas (es decir, realmente siguió la paginación, no solo la página principal).</StepChecklistItem>
<StepChecklistItem>Abrir `quotes.csv` en un editor de texto muestra tres columnas — `text`, `author`, `tags` — sin filas obviamente rotas o vacías.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Qué le pasaría a tu scraper si el sitio agregara un décimo campo a cada cita — digamos, un año de publicación? ¿Cómo lo notarías, y cómo adaptarías `parse_quotes` para captarlo?
- El bucle se detiene cuando `find("li", class_="next")` devuelve `None`. ¿Qué pasaría si la última página del sitio todavía tuviera un enlace "Next" (con apariencia deshabilitada) en su HTML, solo que no clicable? ¿Cómo verificarías eso antes de confiar en esta condición de parada en un sitio distinto?

## Paso 4: Limpia y carga en pandas

La Sección 2 presentó pandas como la solución a que los bucles planos de Python se vuelvan lentos a medida que crecen los datos — operaciones vectorizadas en C en lugar de un bucle `for` de Python sobre cada fila. Los datos extraídos por scraping agregan una segunda razón, igual de real, para recurrir a él: rara vez llegan limpios, y las herramientas de strings y verificación de tipos de pandas hacen que limpiarlos sea rápido de escribir y fácil de verificar.

```python
# analyze.py
import pandas as pd

df = pd.read_csv("quotes.csv")

# tags was saved as a single "tag1, tag2, tag3" string -- split it into a real
# list column so each tag can be counted separately.
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)

# Whitespace and dtype sanity checks -- cheap to do, easy to skip, and the kind
# of thing that silently breaks a groupby later if left unchecked.
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
assert df["text"].notna().all(), "some quotes have no text -- check the scrape"

df["quote_length"] = df["text"].str.len()
print(df.head())
print(df.dtypes)
```

Dos cosas vale la pena notar aquí. Primero, `tags` se guarda en el CSV como un solo string unido por comas porque las celdas de un CSV no pueden contener una lista real de Python — reconstruir la lista al cargar, con `.apply`, es el patrón estándar para cualquier columna "empaquetada" como esta. Segundo, que `df["text"].str.len()` calcule la longitud de cada cita en una sola llamada vectorizada, en lugar de un bucle de Python llamando a `len()` fila por fila, es exactamente el argumento de velocidad de la Sección 2 — solo que aplicado a datos que obtuviste tú mismo en lugar de un CSV empaquetado.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`df["tags"]` contiene listas reales de Python después de la llamada a `.apply`, no strings — verifica con `type(df["tags"].iloc[0])`.</StepChecklistItem>
<StepChecklistItem>`df["quote_length"]` es una columna numérica sin valores faltantes.</StepChecklistItem>
<StepChecklistItem>`df.head()` muestra texto limpio sin espacios en blanco perdidos al inicio/final.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si la celda `tags` de una fila estuviera vacía (una cita sin etiquetas), ¿qué devolvería `raw.split(",")`, y el filtro `if tag.strip()` en la comprensión de lista maneja ese caso correctamente? Pruébalo.
- ¿Por qué calcular `quote_length` a partir de `text` después de eliminar espacios en blanco en lugar de antes? ¿Qué número estaría mal si lo calcularas antes?

## Paso 5: Analiza y visualiza

Con columnas limpias y tipadas, el análisis en sí son unas pocas líneas de `groupby`/`value_counts`, exactamente como los notebooks guiados de la Sección 2 — la diferencia es que estos datos vinieron de tu propio scraper, no de un archivo empaquetado.

**Etiquetas más comunes** — `explode` convierte la columna de lista de etiquetas en una fila por etiqueta, para que `value_counts` pueda contarlas individualmente:

```python
import matplotlib.pyplot as plt

exploded = df.explode("tags")
exploded = exploded[exploded["tags"] != ""]
tag_counts = exploded["tags"].value_counts().head(10)

fig, ax = plt.subplots(figsize=(8, 5))
tag_counts.sort_values().plot(kind="barh", ax=ax, color="#3b82f6")
ax.set_xlabel("Number of quotes")
ax.set_ylabel("Tag")
ax.set_title("Top 10 tags on quotes.toscrape.com")
ax.set_xlim(left=0)  # bar charts should start at 0 -- Data Analysis Hard Week 9's chart-honesty rule
fig.tight_layout()
fig.savefig("top_tags.png")
```

**Autores más citados:**

```python
most_quoted = df["author"].value_counts().head(5)
print(most_quoted)
```

**Distribución de longitud de citas** — un histograma, para ver la forma de los datos en lugar de solo un único promedio:

```python
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(df["quote_length"], bins=20, color="#3b82f6", edgecolor="white")
ax.set_xlabel("Quote length (characters)")
ax.set_ylabel("Number of quotes")
ax.set_title("Distribution of quote lengths")
fig.tight_layout()
fig.savefig("quote_length_dist.png")
```

Ambos gráficos siguen las mismas reglas de honestidad de la Semana 9 del track Difícil de Data Analysis: los ejes están etiquetados, el eje x del gráfico de barras empieza en 0 en lugar de truncarse para exagerar diferencias pequeñas, y los títulos dicen exactamente qué se está contando en lugar de dejarlo a adivinar.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`top_tags.png` y `quote_length_dist.png` existen ambos y se abren como imágenes reales.</StepChecklistItem>
<StepChecklistItem>El eje x del gráfico de barras empieza en 0.</StepChecklistItem>
<StepChecklistItem>Ambos gráficos tienen título y ejes etiquetados — sin números pelados sin unidades.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si fijaras `ax.set_xlim(left=5)` en lugar de `0` para el gráfico de barras, ¿cómo cambiaría la diferencia *visual* entre la etiqueta más alta y la décima, aunque los conteos subyacentes no hayan cambiado en absoluto?
- El histograma usa `bins=20`. Prueba `bins=5` y `bins=50` sobre los mismos datos. ¿Se ve la forma de la distribución significativamente distinta según el número de bins — y si es así, qué te dice eso sobre cuánto los *parámetros* de un histograma, no solo sus datos, dan forma a la historia que cuenta?

## ⚠️ Errores comunes

- **Hacer scraping demasiado rápido y que te limiten o bloqueen la tasa.** Incluso un sitio amigable con la práctica puede ralentizarse o rechazar solicitudes disparadas sin ningún retraso entre ellas. Las llamadas a `time.sleep()` de los Pasos 2-3 no son decorativas — quítalas y es más probable que veas errores de conexión o páginas faltantes, especialmente en un sitio real (que no sea de práctica).
- **La estructura HTML cambia y rompe tus selectores.** `find("div", class_="quote")` solo funciona porque ese es el nombre de clase *actual* en quotes.toscrape.com. Los sitios cambian su markup con el tiempo (un rediseño, una prueba A/B, un nuevo framework de CSS); un scraper que funcionaba ayer puede dejar de encontrar cualquier cosa silenciosamente hoy. Si un scrape devuelve cero resultados, revisa el HTML de la página en vivo antes de asumir que tu código es el problema.
- **Olvidar `try`/`except` alrededor de las llamadas de red.** Una solicitud inestable o un timeout, en la página 7 de 10, sin un `try`/`except`, lanza una excepción no manejada y pierde todo lo ya recolectado. La versión del Paso 3 captura `requests.RequestException` y guarda lo que tiene.
- **Confundir `.text` con `.get_text(strip=True)`.** La propiedad `.text` de BeautifulSoup devuelve el contenido de texto de una etiqueta tal cual, incluyendo cualquier espacio en blanco circundante de la propia indentación del HTML; `.get_text(strip=True)` lo elimina. Omitir `strip=True` es una fuente común de comparaciones de strings y agrupaciones que se rompen silenciosamente más adelante — dos nombres de autor "idénticos" que no coinciden porque uno tiene espacio en blanco al final.

## Lo que acabas de construir

Un pipeline completo y honesto de obtener → analizar → limpiar → analizar → visualizar, corriendo contra un sitio web real y en vivo en lugar de un archivo que alguien más preparó para ti. Nada aquí fue simplificado a un juguete que no generaliza: cambia por un sitio distinto amigable con el scraping, y los mismos cinco pasos — solicitar la página, analizar el HTML, seguir la paginación, limpiar el resultado con pandas, graficarlo — siguen siendo todo el pipeline.

## A dónde ir desde aquí

- Prueba hacer scraping de un sitio distinto, después de realmente leer su `robots.txt` y sus términos de servicio primero — la estructura de etiqueta/autor de aquí es una plantilla razonable, pero el HTML de cada sitio es distinto, así que tendrás que inspeccionar su markup tú mismo en lugar de reutilizar exactamente estos selectores.
- Cambia el CSV por una pequeña **base de datos SQLite** (el módulo `sqlite3` incorporado de Python no necesita instalación separada) — un mejor ajuste una vez que un dataset crece más allá de lo que cabe cómodamente en un CSV, o si quieres consultarlo con SQL en lugar de pandas.
- Programa el scraper para ejecutarse periódicamente (un cron job, o un simple bucle con un `time.sleep()` largo) y agrega los resultados de cada ejecución con una columna de timestamp, para que puedas rastrear cómo cambian los datos con el tiempo — un dataset real como este rara vez se mantiene estático para siempre.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes para agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, hacer commit de tus archivos, y abrir el PR, un paso a la vez. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="scrape-analyze" />
