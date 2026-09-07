---
title: "Scrape y Analiza un Sitio Web en Vivo"
description: "Obtén datos web reales, límpialos con pandas, y produce gráficos — sin necesidad de clave de API."
difficulty: "intermediate"
estimatedMinutes: 60
xpReward: 50
tags: ["Web Scraping", "pandas", "matplotlib", "data-analysis"]
prerequisites: ["Python básico", "pandas básico", "matplotlib básico"]
---

# Scrape y Analiza un Sitio Web en Vivo

Cada conjunto de datos hasta ahora llegó como un CSV listo. El análisis real rara vez empieza ahí. Este proyecto te enseña a obtener una página web en vivo vía HTTP, parsear el HTML en filas estructuradas, limpiar el resultado con pandas y producir gráficos — sin clave de API, sin servicio externo, solo tu script y un servidor.

## 🎯 Lo que harás

1. Obtener páginas web con `requests`
2. Parsear HTML con `BeautifulSoup`
3. Manejar paginación a través de múltiples páginas
4. Limpiar datos obtenidos con `pandas`
5. Crear visualizaciones a partir de datos reales
6. Manejar desafíos comunes de scraping (codificación, límites de velocidad, selectores rotos)

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado aquí — la sección de Configuración a continuación detalla cómo instalarlo. Este proyecto usa `requests`, `beautifulsoup4`, `pandas` y `matplotlib`, por lo que una instalación local es el camino más suave.

**GitHub Codespaces** también funciona bien: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) — es un clon real con historial real, así que cada paso de abajo funciona exactamente igual que localmente.

**Google Colab** puede funcionar para probar partes individuales del pipeline, pero la configuración local es más confiable para el flujo completo de trabajo.

## Configuración

### Instala `uv`

`uv` gestiona versiones de Python y dependencias de proyecto en una sola herramienta.

**macOS / Linux:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell):**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Crea el proyecto

```bash
uv init scrape-analyze
cd scrape-analyze
uv add requests beautifulsoup4 pandas matplotlib
```

Sin clave de API. Sin registro de nivel gratuito. Solo tu script y un sitio web real.

---

## Paso 1: Obtén una Página Web

### Objetivo

Realizar una petición HTTP a un sitio web en vivo y recibir su contenido HTML crudo.

### Explicación

Una petición HTTP `GET` es lo mismo que tu navegador hace cada vez que visitas una página — le pide a un servidor una URL y recibe HTML crudo como texto. La librería `requests` hace esto sencillo en Python. Apuntamos a [quotes.toscrape.com](https://quotes.toscrape.com), un sitio construido específicamente para practicar scraping: sin muro de inicio de sesión, sin límite de velocidad, estructura HTML estable.

:::tip[Siempre revisa robots.txt antes de scrapeear cualquier otro sitio]
Antes de apuntar este código a cualquier sitio distinto de quotes.toscrape.com, revisa el `robots.txt` de ese sitio (por ejemplo, `https://example.com/robots.txt`) y sus términos de servicio. Respetar `robots.txt` es la expectativa mínima para cualquier scraper.
:::

### Pista inicial

`requests.get(url)` realiza la petición HTTP. Llama a `.raise_for_status()` inmediatamente después para convertir un 404 o 500 en una excepción evidente en lugar de dejar que contenido roto fluya silenciosamente hacia tu parser.

### Código funcional

```python
# scrape.py
import requests

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()  # turns a 404/500 into a loud exception
html = response.text

print(f"Fetched {len(html)} characters")
print(html[:100])
```

Ejecútalo:

```bash
uv run python scrape.py
```

### Resultado esperado

```
Fetched 12345 characters
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
```

El conteo exacto de caracteres varía, pero `html` debería ser una cadena larga que empiece con `<!DOCTYPE html>`.

### Solución de problemas

| Problema | Solución |
|---|---|
| `ConnectionError` | Estás sin conexión o la URL es incorrecta. Verifica tu internet y la escritura de la URL. |
| `HTTPError 404` | La ruta de la URL es incorrecta — usa exactamente `https://quotes.toscrape.com/` |
| `HTTPError 403` | Algunos sitios bloquean peticiones sin un encabezado User-Agent de navegador. Añade uno: `requests.get(url, headers={"User-Agent": "Mozilla/5.0"})` |

### ✅ Lista de verificación

- ✅ `uv run python scrape.py` se ejecuta sin errores
- ✅ La salida muestra un conteo de caracteres en los miles
- ✅ Los primeros 100 caracteres empiezan con `<!DOCTYPE html>`

### 🤔 Pregunta socrática

¿Qué pasa si omites `raise_for_status()` y el servidor devuelve un 404? ¿Cómo se manifestaría el error más adelante en tu pipeline, y por qué es más difícil de depurar?

---

## Paso 2: Parsea el Contenido HTML

### Objetivo

Convertir texto HTML crudo en un árbol navegable y extraer datos estructurados de él.

### Explicación

Esa cadena `html` es un árbol de etiquetas anidadas — `<div>`, `<span>`, `<a>` — cada una portando opcionalmente atributos como `class` o `href`. BeautifulSoup parsea ese texto en un árbol y te da `find` (primera coincidencia) y `find_all` (todas las coincidencias), ambos filtrables por nombre de etiqueta y atributos.

Abre la página en "Ver Código Fuente" de tu navegador y verás: cada cita está dentro de `<div class="quote">`, el texto está en `<span class="text">`, el autor en `<small class="author">`, y las etiquetas en `<a class="tag">`.

### Pista inicial

`find_all("div", class_="quote")` devuelve una etiqueta BeautifulSoup por cita. Dentro de cada una, `find` y `find_all` se reducen a los campos que necesitas, y `.get_text(strip=True)` extrae texto limpio.

### Código funcional

```python
# scrape.py
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
```

```bash
uv run python scrape.py
```

### Resultado esperado

Diez líneas, una por cada cita en la página principal:

```
Albert Einstein: "Life is like riding a bicycle..." ['change', 'deep-thoughts', 'thinking', 'world']
J.K. Rowling: "It is our choices..." ['abilities', 'choices', 'deep-thoughts', 'flying', 'harry-potter']
...
```

### Solución de problemas

| Problema | Solución |
|---|---|
| `AttributeError: 'NoneType' has no attribute 'get_text'` | `find(...)` devolvió `None` — el nombre de clase no coincide. Revisa "Ver Código Fuente" para los nombres de clase exactos. |
| Menos de 10 líneas impresas | El filtro de clase CSS es demasiado estrecho o tiene un error de escritura. Verifica que `class_="quote"` coincida con el HTML real. |
| La salida muestra caracteres distorsionados | Problema de codificación. Intenta con `soup = BeautifulSoup(response.content, "html.parser")` en lugar de `response.text`. |

### ✅ Lista de verificación

- ✅ `uv run python scrape.py` se ejecuta sin errores
- ✅ Se imprimen exactamente 10 líneas, una por cada cita
- ✅ Cada línea tiene texto real, un nombre de autor real y una lista no vacía de etiquetas

### 🤔 Pregunta socrática

`.get_text(strip=True)` y `.text` ambas devuelven el contenido de texto de una etiqueta, pero solo una elimina los espacios en blanco. ¿Qué se rompería más adelante si usaras `.text` en todas partes en su lugar? Piensa en comparaciones de cadenas y operaciones `groupby`.

---

## Paso 3: Extrae Datos Estructurados

### Objetivo

Convertir el análisis por página en una función reutilizable, seguir la paginación a través de todas las páginas y guardar los resultados en CSV.

### Explicación

quotes.toscrape.com distribuye las citas en 10 páginas, con un enlace "Next" en la parte inferior de cada página excepto la última. En lugar de hardcodear "iterar 10 veces", sigue el propio enlace — de esa forma el script funciona incluso si el conteo de páginas cambia. Dos sub-pasos: envuelve el bucle del Paso 2 en una función, luego sigue los enlaces hasta que no queden más.

### Pista inicial

La estructura del bucle: `while url is not None:`, obtiene y parsea cada página, luego busca `<li class="next">`. Su presencia o ausencia es tu señal de continuar/detener.

### Código funcional

```python
# scrape.py
import csv
import time

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://quotes.toscrape.com"


def parse_quotes(soup):
    """Extract {"text", "author", "tags"} for every quote on one parsed page."""
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
            print(f"Failed to fetch {url}: {exc}. Stopping here.")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        all_quotes.extend(parse_quotes(soup))

        next_li = soup.find("li", class_="next")
        url = (
            requests.compat.urljoin(url, next_li.find("a")["href"])
            if next_li
            else None
        )
        if url is not None:
            time.sleep(1)  # rate-limit yourself even on a practice site

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

### Resultado esperado

```
Saved 100 quotes to quotes.csv
```

Aparece un archivo real `quotes.csv` con una fila de encabezado más una fila por cada cita.

### Solución de problemas

| Problema | Solución |
|---|---|
| Solo se guardaron 10 citas | La URL de `next_li` no se está siguiendo. Verifica que `url = requests.compat.urljoin(...)` esté dentro del condicional, no reseteándose a la página principal. |
| El script se cuelga o es lento | Es esperado — `time.sleep(1)` entre ~10 páginas significa ~10 segundos en total. |
| `Failed to fetch ... Stopping here` | Un fallo de red o tiempo de espera. El script guarda lo que tiene hasta ahora en lugar de fallar. |
| `quotes.csv` tiene filas vacías | Un `None` o cadena vacía se metió en la lista de citas. Revisa la función `parse_quotes` para llamadas a `.get_text(strip=True)` faltantes. |

### ✅ Lista de verificación

- ✅ `uv run python scrape.py` termina e imprime "Saved N quotes"
- ✅ `quotes.csv` existe con más de 10 filas (prueba de que la paginación funcionó)
- ✅ Al abrir `quotes.csv` se muestran tres columnas limpias: `text`, `author`, `tags`

### 🤔 Pregunta socrática

¿Qué pasaría si la última página del sitio tuviera un enlace "Next" en su HTML pero no fuera clickeable? ¿Cómo verificarías eso antes de confiar en esta condición de parada en un sitio diferente?

---

## Paso 4: Limpia con pandas

### Objetivo

Cargar el CSV obtenido en pandas y limpiarlo para análisis.

### Explicación

Los datos obtenidos rara vez llegan limpios. La columna `tags` se almacena como una cadena unida por comas (las celdas de CSV no pueden contener listas de Python), y las inconsistencias de espacios en blanco son comunes. Las herramientas de cadenas y verificación de tipos de pandas hacen que la limpieza sea rápida de escribir y fácil de verificar.

### Pista inicial

Dos sub-pasos: separa la columna empaquetada `tags` de vuelta en una lista real, luego ejecuta verificaciones de espacios en blanco y tipo de datos para detectar problemas temprano.

### Código funcional

```python
# analyze.py
import pandas as pd

df = pd.read_csv("quotes.csv")

# Step 4a: Reconstruct the packed tags column
# tags was saved as "tag1, tag2, tag3" — split into a real list column
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)

# Step 4b: Whitespace and dtype sanity checks
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
assert df["text"].notna().all(), "some quotes have no text — check the scrape"

df["quote_length"] = df["text"].str.len()

print(df.head())
print()
print(df.dtypes)
```

```bash
uv run python analyze.py
```

### Resultado esperado

```
                                                text           author  \
0  "Life is like riding a bicycle. To keep your ba...  Albert Einstein
1  "It is our choices, Harry, that show what we tr...     J.K. Rowling
2  "Only two things are infinite, the universe and...  Albert Einstein
3  "The person, as well as the artist, strives for...  Albert Einstein
4  "Imagination is more important than knowledge. ...  Albert Einstein

                               tags  quote_length
0  [change, deep-thoughts, thinking, world]           123
1  [abilities, choices, deep-thoughts, flying, ...           106
2  [humor, infinite, universe]            89
3  [fake, inspectors, life, real]           93
4  [creativity, humor, imagination, life]           107

         text   author    tags  quote_length
0     object   object  object         int64
```

### Solución de problemas

| Problema | Solución |
|---|---|
| `AttributeError: 'float' has no attribute 'split'` | Un `NaN` se coló. Confirma que `.fillna("")` se ejecutó antes de `.apply`. |
| `df["tags"]` todavía contiene cadenas | El resultado de `.apply` no se reasignó. Verifica que no hayas eliminado el prefijo `df["tags"] =`. |
| `AssertionError: some quotes have no text` | Algo aguas arriba guardó una fila con texto faltante. Inspecciona `quotes.csv` directamente en busca de celdas `text` vacías. |
| `quote_length` muestra tipo `object` | `.str.len()` se llamó en la columna incorrecta o antes de eliminar espacios. Verifica que esté en la ya limpia `df["text"]`. |

### ✅ Lista de verificación

- ✅ `type(df["tags"].iloc[0])` imprime `<class 'list'>`, no `str`
- ✅ `df["quote_length"]` es una columna numérica sin valores faltantes
- ✅ `df.head()` muestra texto limpio sin espacios en blanco extraños al inicio o final

### 🤔 Pregunta socrática

Si la celda `tags` de una fila estuviera vacía (una cita sin etiquetas), ¿qué devolvería `raw.split(",")`? ¿El filtro `if tag.strip()` maneja ese caso correctamente? Prueba.

---

## Paso 5: Analiza y Visualiza

### Objetivo

Producir gráficos y estadísticas resumen a partir de los datos limpios.

### Explicación

Con columnas limpias y con tipo, el análisis son unas pocas líneas de `groupby` / `value_counts` — el mismo patrón de los cuadernos de pandas, solo apuntado a datos que obtuviste tú mismo. Tres gráficos: etiquetas más comunes, autores más citados y distribución de longitudes de citas.

### Pista inicial

Tres sub-pasos, uno por gráfico. Usa `explode` para la columna de etiquetas (una fila por etiqueta), `value_counts` para conteos categóricos e `hist` para la distribución numérica.

### Código funcional

```python
# analyze.py (continued)
import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("quotes.csv")

# Clean (same as Step 4)
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
df["quote_length"] = df["text"].str.len()

# Chart 1: Top 10 tags
exploded = df.explode("tags")
exploded = exploded[exploded["tags"] != ""]
tag_counts = exploded["tags"].value_counts().head(10)

fig, ax = plt.subplots(figsize=(8, 5))
tag_counts.sort_values().plot(kind="barh", ax=ax, color="#3b82f6")
ax.set_xlabel("Number of quotes")
ax.set_ylabel("Tag")
ax.set_title("Top 10 tags on quotes.toscrape.com")
ax.set_xlim(left=0)
fig.tight_layout()
fig.savefig("top_tags.png")
plt.close()

# Chart 2: Most-quoted authors
most_quoted = df["author"].value_counts().head(5)
print("Most-quoted authors:")
print(most_quoted)

# Chart 3: Quote-length distribution
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(df["quote_length"], bins=20, color="#3b82f6", edgecolor="white")
ax.set_xlabel("Quote length (characters)")
ax.set_ylabel("Number of quotes")
ax.set_title("Distribution of quote lengths")
fig.tight_layout()
fig.savefig("quote_length_dist.png")
plt.close()

print("\nSaved top_tags.png and quote_length_dist.png")
```

```bash
uv run python analyze.py
```

### Resultado esperado

```
Most-quoted authors:
author
Albert Einstein    10
André Gide          5
J.K. Rowling        3
...
dtype: int64

Saved top_tags.png and quote_length_dist.png
```

Aparecen dos archivos de imagen: `top_tags.png` (gráfico de barras horizontal, barra más larga arriba, eje x comenzando en 0) y `quote_length_dist.png` (histograma con forma real, la mayoría de las citas agrupadas en los cientos bajos de caracteres).

### Solución de problemas

| Problema | Solución |
|---|---|
| Gráfico de barras vacío o todo en ceros | `exploded["tags"] != ""` filtró todo. Verifica que el Paso 4 realmente eliminara las cadenas vacías al construir la lista. |
| El eje x no empieza en 0 | La línea `ax.set_xlim(left=0)` se omitió. |
| El histograma es una sola barra sólida | `quote_length` no tiene variación. Revisa que se calculara a partir de `text` ya limpio de espacios. |
| `top_tags.png` no se guarda | Confirma que `fig.savefig(...)` se llama en el mismo objeto `fig` que `plt.subplots()` devolvió. |
| Las barras se ven razonables pero difieren de lo esperado | El conjunto de datos es en vivo — los conteos cambian a medida que el sitio fuente se actualiza. |

### ✅ Lista de verificación

- ✅ `top_tags.png` y `quote_length_dist.png` ambos existen y se abren como imágenes reales
- ✅ El eje x del gráfico de barras empieza en 0
- ✅ Ambos gráficos tienen un título y ejes etiquetados
- ✅ El histograma muestra una forma de distribución real, no una sola barra plana

### 🤔 Pregunta socrática

Si establecieras `ax.set_xlim(left=5)` en lugar de `0` en el gráfico de barras, ¿cómo cambiaría la diferencia visual entre la primera y la décima etiqueta, aunque los conteos subyacentes no hayan cambiado en absoluto?

---

## Paso 6: Exporta Resultados

### Objetivo

Guardar el conjunto de datos limpio y listo para análisis para reutilización.

### Explicación

CSV es el formato de intercambio más simple, pero la versión limpia (con columnas de lista reales) no se serializa limpiamente. Dos enfoques: exportar una versión plana para uso en hojas de cálculo, o usar JSON para preservar las listas.

### Código funcional

```python
# analyze.py (continued)

# Flat CSV: tags joined back to a string for spreadsheet compatibility
df["tags_flat"] = df["tags"].apply(lambda t: ", ".join(t))
df[["text", "author", "tags_flat", "quote_length"]].to_csv(
    "quotes_clean.csv", index=False
)
print(f"Saved quotes_clean.csv with {len(df)} rows")

# JSON: preserves list structure
df.to_json("quotes_clean.json", orient="records", indent=2)
print("Saved quotes_clean.json")
```

### Resultado esperado

```
Saved quotes_clean.csv with 100 rows
Saved quotes_clean.json
```

Dos archivos nuevos: `quotes_clean.csv` (plano, compatible con hojas de cálculo) y `quotes_clean.json` (preserva las listas de etiquetas como arrays).

### ✅ Lista de verificación

- ✅ `quotes_clean.csv` existe y se abre en una hoja de cálculo o editor de texto
- ✅ `quotes_clean.json` contiene JSON válido con arrays para el campo `tags`

### 🤔 Pregunta socrática

¿Por qué la exportación CSV necesita `tags_flat` (una cadena) en lugar de escribir la lista directamente? ¿Qué formato es naturalmente adecuado para datos anidados como listas de cadenas, y qué compensaciones conlleva cada formato?

---

## Desafíos

Una vez que el pipeline básico funciona, prueba estas extensiones:

### Desafío 1: Extrae páginas de autores

Cada nombre de autor en quotes.toscrape.com enlaza a una página de biografía con fecha de nacimiento y lugar de nacimiento. Extiende `parse_quotes` para seguir cada enlace de autor, obtener la página de biografía y añadir las columnas `birth_date` y `birthplace` al DataFrame. Esto introduce resolución de URLs relativas y traversal de páginas multinivel.

### Desafío 2: Scrapea un sitio basado en tablas

Apunta a un sitio con elementos HTML `<table>` en lugar de tarjetas `<div>` — por ejemplo, una tabla comparativa de Wikipedia. Usa BeautifulSoup para encontrar etiquetas `<tr>` y `<td>`, luego alimenta las filas a un DataFrame con `pd.DataFrame(rows, columns=headers)`. La lógica de parseo cambia, pero el pipeline obtener-limpiar-analizar se mantiene igual.

### Desafío 3: Añade límite de velocidad y lógica de reintento

Reemplaza el `time.sleep(1)` fijo con retroceso exponencial: ante una petición fallida, espera 1 segundo, luego 2, luego 4, hasta un máximo. Combina esto con `requests.adapters.HTTPAdapter` para reintentos automáticos. Este es el patrón que usan los scrapers en producción.

### Desafío 4: Visualiza tendencias a lo largo del tiempo

Si has ejecutado el scraper múltiples veces con marcas de tiempo, traza cómo cambia la popularidad de las etiquetas o el conteo de autores entre ejecuciones. Usa `matplotlib` con múltiples líneas o un gráfico de área apilada.

---

## Lo que Aprendiste

1. **Peticiones HTTP** — `requests.get()` con `raise_for_status()` y tiempos de espera para obtención robusta
2. **Parseo de HTML** — `BeautifulSoup` con `find` / `find_all` y selectores de clase CSS
3. **Paginación** — seguir enlaces "Next" con `urljoin` en lugar de hardcodear conteos de páginas
4. **Manejo de errores** — `try`/`except` alrededor de llamadas de red para preservar progreso parcial
5. **Limpieza de datos** — separar columnas empaquetadas, eliminar espacios en blanco, afirmar invariantes
6. **Visualización** — gráficos de barras, histogramas y las reglas de honestidad (ejes etiquetados, eje x en 0, títulos descriptivos)
7. **Etiqueta de scraping** — límite de velocidad con `sleep`, respetar `robots.txt`

El pipeline se generaliza: cambia por un sitio diferente amigable para scraping, y los mismos cinco pasos — obtener, parsear, seguir paginación, limpiar, graficar — siguen siendo todo el pipeline.

## A Dónde Ir Desde Aquí

- **Sitios diferentes** — lee el `robots.txt` y los términos de servicio de cada sitio primero; el HTML de cada sitio es diferente, así que necesitarás inspeccionar su markup tú mismo
- **SQLite** — reemplaza CSV con el módulo incorporado `sqlite3` de Python una vez que los datos superen un solo archivo
- **Programación** — ejecuta el scraper periódicamente con cron o un bucle, añadiendo una columna de marca de tiempo para rastrear cómo cambian los datos a lo largo del tiempo
- **Scrapy** — un framework completo para scraping a gran escala con concurrencia incorporada, middleware y pipelines de exportación

---

## Comparte tu Proyecto

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado. Su README tiene un recorrido amigable para principiantes sobre cómo agregar el tuyo vía un pull request — hacer fork del repositorio, crear una rama, confirmar y abrir el PR. No se requiere experiencia previa con git.
