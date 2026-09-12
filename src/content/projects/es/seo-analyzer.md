---
title: "Analizador SEO"
description: "Analiza sitios web en busca de problemas SEO, meta tags, encabezados, rendimiento y optimización de palabras clave."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["requests", "beautifulsoup4", "seo", "web-scraping", "pandas"]
learningObjectives:
  - "Obtén y analiza páginas web para extraer elementos relevantes para SEO"
  - "Audita meta tags, datos de Open Graph y jerarquía de encabezados"
  - "Calcula densidad de palabras clave y puntajes de contenido"
  - "Genera informes de comparación estructurados con pandas"
prerequisites:
  - "Conceptos básicos de Python (funciones, dicts, listas)"
  - "Conceptos básicos de HTML (tags, atributos, anidamiento)"
  - "Comodidad con `requests` o disposición a aprenderlo en la configuración"
---

# 🔍 Construye un Analizador SEO

Cada sitio web tiene señales SEO invisibles, meta descripciones, jerarquía de encabezados, tags de Open Graph, que determinan si los buscadores lo clasifican bien o lo entierran. Este proyecto construye un kit de herramientas que obtiene cualquier URL, extrae esas señales, las puntúa contra mejores prácticas y genera un informe estructurado que puedes comparar entre múltiples páginas, todo con librerías de Python puro que corren en cualquier lugar.

Esto asume conceptos básicos de Python, conceptos básicos de HTML y la librería `requests` (cubierta en Configuración), nada de Análisis de Datos se requiere. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Obtener cualquier URL y analizar su HTML con `requests` y BeautifulSoup.
2. Extraer y validar meta tags, títulos y datos de Open Graph.
3. Auditar la estructura de encabezados para la jerarquía H1–H6 correcta.
4. Calcular densidad de palabras clave y puntajes de relevancia de contenido.
5. Generar un informe de comparación lado a lado entre múltiples páginas con pandas.

## Dónde ejecutar esto

Este proyecto funciona casi en cualquier lugar, `requests`, `BeautifulSoup` y `pandas` son Python puro sin dependencias a nivel de sistema.

**JupyterLite playground** funciona bien: pega las celdas de código directamente en un notebook. Primero necesitarás `!pip install requests beautifulsoup4 pandas lxml` en una celda.

**Google Colab** funciona de fábrica, las tres librerías están pre-instaladas en el runtime de Colab.

**Localmente con `uv`** es el camino recomendado para construir un proyecto real con archivos, no solo celdas, sigue la sección de Configuración abajo.

**Binder y Kaggle Notebooks** también funcionan, ya que no se necesitan GPU ni dependencias nativas.

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo, ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/seo-analyzer/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/seo-analyzer/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fseo-analyzer%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de escribir una línea de análisis.

### Instala `uv`

`uv` es una sola herramienta que reemplaza la cadena habitual de "instalar Python, luego instalar pip, luego instalar una herramienta de entorno virtual, luego instalar paquetes", puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

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

### Configura el proyecto

```bash
uv init seo-analyzer
cd seo-analyzer
uv add requests beautifulsoup4 pandas lxml
```

`requests` obtiene páginas web; `beautifulsoup4` analiza HTML en un árbol navegable; `lxml` es un backend de análisis rápido para BeautifulSoup; `pandas` construye los informes de comparación. Las cuatro son Python puro, sin compilador, sin librerías del sistema necesarias.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `seo-analyzer/` existe con un `pyproject.toml`, y los cuatro paquetes están instalados.
- ✅ `uv run python -c "import requests, bs4, pandas; print('all good')"` imprime `all good`.

## Paso 1: Obtén una página y extrae meta tags

El primer bloque de construcción: dada una URL, obtén su HTML y extrae los metadatos críticos para SEO, título, descripción, tags de Open Graph, que los buscadores y las plataformas sociales leen.

### 1.1 Escribe el obtentor y el extractor de meta

```python
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def fetch_page(url: str) -> BeautifulSoup:
    """Fetch a URL and return a parsed BeautifulSoup tree."""
    try:
        headers = {"User-Agent": "SEOAnalyzer/1.0 (Educational Project)"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.text, "lxml")
    except requests.exceptions.Timeout:
        print(f"Timeout fetching {url}")
        raise
    except requests.exceptions.HTTPError as e:
        print(f"HTTP error: {e}")
        raise
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        raise

def extract_meta(soup: BeautifulSoup, url: str) -> dict:
    """Extract SEO-relevant metadata from a parsed page."""
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""

    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag["content"] if desc_tag and desc_tag.get("content") else ""

    og_title = soup.find("meta", property="og:title")
    og_desc = soup.find("meta", property="og:description")
    og_image = soup.find("meta", property="og:image")

    return {
        "url": url,
        "domain": urlparse(url).netloc,
        "title": title,
        "title_length": len(title),
        "description": description,
        "desc_length": len(description),
        "og_title": og_title["content"] if og_title and og_title.get("content") else "",
        "og_description": og_desc["content"] if og_desc and og_desc.get("content") else "",
        "og_image": og_image["content"] if og_image and og_image.get("content") else "",
    }

soup = fetch_page("https://example.com")
meta = extract_meta(soup, "https://example.com")
print(f"Title: {meta['title']!r} ({meta['title_length']} chars)")
print(f"Description: {meta['description'][:80]!r} ({meta['desc_length']} chars)")
```

**👟 Pista inicial:** `fetch_page` envía una solicitud con un encabezado `User-Agent` personalizado (buena práctica, identifica a tu rastreador) y devuelve un objeto BeautifulSoup. `extract_meta` luego usa `soup.find()` para extraer tags específicos: `<title>`, `<meta name="description">` y los tres tags `og:`. Cada extracción maneja con gracia el caso de "tag faltante" devolviendo un string vacío.

**🎯 Resultado esperado:**
```
Title: 'Example Domain' (14 chars)
Description: '' (0 chars)
```

**🩹 Si sale mal:** Un `requests.exceptions.ConnectionError` significa que la URL es incorrecta o inalcanzable, prueba `https://example.com` primero (siempre está activo). Un `Timeout` significa que el servidor tardó más de 10 segundos, aumenta el timeout o prueba un sitio más rápido. Si `title` está vacío donde esperabas contenido, la página podría estar renderizada por JavaScript (BeautifulSoup no puede verlo), prueba una página renderizada por servidor en su lugar.

### 1.2 Verifica la extracción de meta

**✅ Lista de verificación**

- ✅ `fetch_page("https://example.com")` devuelve un objeto BeautifulSoup sin errores.
- ✅ `extract_meta` devuelve un dict con las claves `title`, `title_length`, `description`, `desc_length` y los tres campos `og_*`.
- ✅ Una URL inexistente lanza un error claro, no un traceback confuso desde lo profundo de `requests`.

**🤔 Pregunta(s) socrática(s)**

- El encabezado `User-Agent` dice `SEOAnalyzer/1.0`. ¿Qué pasaría si lo eliminaras por completo, la mayoría de los servidores rechazarían la solicitud? ¿Por qué los rastreadores bien portados se identifican a sí mismos?
- BeautifulSoup con `lxml` puede analizar HTML malformado. ¿Qué pasaría con `"html.parser"` (el integrado) en su lugar, notarías una diferencia en una página bien formada? ¿En una rota?

## Paso 2: Audita la jerarquía de encabezados

Los tags de encabezado (`<h1>` hasta `<h6>`) le dicen a los buscadores la estructura del documento, una página sin `<h1>`, o con `<h3>` directamente después de `<h1>` (saltándose `<h2>`), señala una estructura pobre. Este paso construye un comprobador que cuenta cada nivel de encabezado y marca problemas estructurales.

### 2.1 Construye el analizador de encabezados

```python
def analyze_headings(soup: BeautifulSoup) -> dict:
    """Audit heading hierarchy for SEO best practices."""
    headings = {}
    for level in range(1, 7):
        headings[f"h{level}"] = [
            tag.get_text(strip=True)[:80] for tag in soup.find_all(f"h{level}")
        ]

    h1_count = len(headings["h1"])
    issues = []
    if h1_count == 0:
        issues.append("Missing H1 tag — every page should have exactly one H1")
    elif h1_count > 1:
        issues.append(f"Multiple H1 tags ({h1_count}) — use only one per page")

    used_levels = [int(k[1]) for k, v in headings.items() if v]
    if used_levels:
        full_range = set(range(min(used_levels), max(used_levels) + 1))
        if not full_range.issubset(set(used_levels)):
            issues.append(f"Skipped heading levels: h{sorted(full_range - set(used_levels))}")

    return {
        "headings": headings,
        "h1_count": h1_count,
        "total_headings": sum(len(v) for v in headings.values()),
        "issues": issues,
    }

heading_data = analyze_headings(soup)
print(f"H1 count: {heading_data['h1_count']}, Total: {heading_data['total_headings']}")
for issue in heading_data["issues"]:
    print(f"  ⚠ {issue}")
```

**👟 Pista inicial:** La función recorre de `h1` a `h6`, recolecta todos los tags en cada nivel y luego aplica dos reglas: exactamente un `<h1>` por página, y ningún nivel de encabezado saltado. `used_levels` rastrea qué niveles aparecen realmente, si `h1` y `h3` ambos aparecen pero `h2` no, ese es un nivel saltado. El corte `[:80]` mantiene el informe legible cuando los encabezados son largos.

**🎯 Resultado esperado:** Para `https://example.com` (que no tiene encabezados):
```
H1 count: 0, Total: 0
  ⚠ Missing H1 tag — every page should have exactly one H1
```

**🩹 Si sale mal:** Si `total_headings` es 0 para una página que sabes que tiene encabezados, la página podría estar renderizada por JavaScript, BeautifulSoup solo ve el HTML inicial, no el contenido cargado después del renderizado de la página. Si la comprobación de nivel saltado salta inesperadamente, confirma que `used_levels` está tirando de las claves correctas, un typo como `"h7"` en el rango desplazaría silenciosamente el min/max.

### 2.2 Verifica la auditoría de encabezados

**✅ Lista de verificación**

- ✅ `analyze_headings(soup)` devuelve un dict con `headings`, `h1_count`, `total_headings` e `issues`.
- ✅ Una página sin encabezados devuelve `h1_count=0` e incluye el problema "Missing H1".
- ✅ Puedes explicar por qué exactamente un `<h1>` es el estándar SEO (no cero, no múltiples).

**🤔 Pregunta(s) socrática(s)**

- Una página tiene `<h1>Title</h1>` y luego `<h3>Section</h3>` sin `<h2>` en medio. Tu analizador marca esto como un nivel saltado. ¿Por qué les importa a los buscadores que la jerarquía de encabezados sea consecutiva, aunque HTML no lo imponga?
- ¿Qué pasaría si buscara encabezados dentro de tags `<script>` o `<style>`? ¿Eso cambiaría el conteo? ¿Cómo ayuda (o no) `get_text(strip=True)` aquí?

## Paso 3: Calcula densidad de palabras clave y métricas de contenido

La densidad de palabras clave te dice con qué frecuencia aparece una palabra específica en relación con el conteo total de palabras, demasiado baja y la página no trata sobre ese tema; demasiado alta y se lee como relleno de palabras clave. Este paso también elimina el contenido no visible (scripts, barras de navegación, pies de página) antes de contar, para que los números reflejen lo que un lector humano realmente ve.

### 3.1 Construye el analizador de contenido y el comprobador de palabras clave

```python
import re

def keyword_density(text: str, keyword: str) -> dict:
    """Calculate keyword density in visible page text."""
    words = re.findall(r"\b\w+\b", text.lower())
    total_words = len(words)
    if total_words == 0:
        return {"keyword": keyword, "count": 0, "density": 0.0, "total_words": 0}
    count = sum(1 for w in words if w == keyword.lower())
    return {
        "keyword": keyword,
        "count": count,
        "density": round(count / total_words * 100, 2),
        "total_words": total_words,
    }

def analyze_content(soup: BeautifulSoup) -> dict:
    """Extract visible text and compute basic content metrics."""
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    words = re.findall(r"\b\w+\b", text)
    return {"text": text, "word_count": len(words), "char_count": len(text)}

content = analyze_content(soup)
print(f"Word count: {content['word_count']}")

for kw in ["example", "domain", "web"]:
    d = keyword_density(content["text"], kw)
    print(f"  '{kw}': {d['count']} occurrences ({d['density']}%)")
```

**👟 Pista inicial:** `analyze_content` usa `soup.decompose()` para eliminar tags no visibles (`script`, `style`, `nav`, `footer`, `header`) antes de extraer el texto, esto evita que los enlaces de navegación y el texto repetitivo inflen tu conteo de palabras. `keyword_density` luego hace una coincidencia de límite de palabra insensible a mayúsculas (`\b\w+\b`) para la palabra clave exacta, y divide por el total de palabras. Una densidad de 1–3% es típicamente saludable; por encima de 5% parece relleno.

**🎯 Resultado esperado:** Para `https://example.com`:
```
Word count: <some number around 20-40>
  'example': <count> occurrences (<density>%)
  'domain': <count> occurrences (<density>%)
  'web': <count> occurrences (<density>%)
```

**🩹 Si sale mal:** Si `word_count` es sospechosamente alto (miles), `decompose()` no eliminó lo suficiente, la página podría usar envoltorios `<div>` alrededor de la navegación en lugar de `<nav>`. Si `keyword_density` devuelve `0.0` para una palabra que puedes ver en la página, la palabra podría estar dividida entre tags o envuelta en un `<span>`, `get_text()` une el texto de tags anidados, pero `\b\w+\b` no coincide a través de límites de tags.

### 3.2 Verifica el análisis de contenido

**✅ Lista de verificación**

- ✅ `analyze_content(soup)` devuelve `text`, `word_count` y `char_count`, todos no nulos para una página con contenido visible.
- ✅ `keyword_density` devuelve `count=0` y `density=0.0` para una palabra que no aparece en la página.
- ✅ La llamada a `decompose()` elimina los tags `<script>`, `<style>`, `<nav>`, `<footer>` y `<header>` antes de la extracción de texto.

**🤔 Pregunta(s) socrática(s)**

- Estás contando la frecuencia de palabras con coincidencia exacta (`w == keyword.lower()`). ¿Qué cambiaría si quisieras coincidir "web" dentro de "website", sería mejor o peor para el análisis SEO, y por qué?
- Una página tiene 500 palabras de texto visible y 5,000 palabras dentro de tags `<script>`. ¿Por qué es importante eliminar los scripts para la densidad de palabras clave, y qué otro contenido no visible añadirías a la lista de eliminación?

## Paso 4: Genera un informe de puntuación

El pago: combina la extracción de meta, la auditoría de encabezados y el análisis de contenido en una función de puntuación que produce un solo número (0–100) para cualquier URL, luego compara múltiples páginas lado a lado en un DataFrame de pandas.

### 4.1 Construye la función de puntuación

```python
def analyze_url(url: str) -> dict:
    """Run a complete SEO audit on a single URL."""
    soup = fetch_page(url)
    meta = extract_meta(soup, url)
    headings = analyze_headings(soup)
    content = analyze_content(soup)

    scores = {}
    scores["title"] = 10 if 30 <= meta["title_length"] <= 60 else 5 if meta["title_length"] > 0 else 0
    scores["description"] = 10 if 120 <= meta["desc_length"] <= 160 else 5 if meta["desc_length"] > 0 else 0
    scores["h1"] = 10 if headings["h1_count"] == 1 else 0
    scores["headings"] = min(10, headings["total_headings"])
    scores["og_tags"] = sum(10 for k in ["og_title", "og_description", "og_image"] if meta[k])

    overall = sum(scores.values()) / (len(scores) * 10) * 100
    return {
        "url": url,
        "meta": meta,
        "headings": headings,
        "content": content,
        "scores": scores,
        "overall_score": round(overall, 1),
    }

report = analyze_url("https://example.com")
print(f"\n{'='*50}\nSEO Report: {report['url']}\n{'='*50}")
print(f"Overall Score: {report['overall_score']}/100")
for cat, score in report["scores"].items():
    print(f"  {cat}: {score}/10")
```

**👟 Pista inicial:** La rúbrica de puntuación es deliberada: la longitud del título obtiene 10 puntos si está en el punto dulce de 30–60 (5 si existe pero tiene la longitud equivocada, 0 si falta), la descripción obtiene 10 si es de 120–160 caracteres (el rango de visualización de Google), H1 obtiene 10 solo si hay exactamente uno, y los tags OG obtienen 10 cada uno por los tres que compruebas. `overall_score` divide la suma por el máximo posible (50) y multiplica por 100.

**🎯 Resultado esperado:**
```
==================================================
SEO Report: https://example.com
==================================================
Overall Score: <number>/100
  title: <score>/10
  description: <score>/10
  h1: <score>/10
  headings: <score>/10
  og_tags: <score>/10
```

**🩹 Si sale mal:** Si `overall_score` es 0.0 para una página que sabes que tiene algunos elementos SEO, uno de los sub-puntajes se está anulando, comprueba `meta["title_length"]` y `headings["h1_count"]` individualmente. Si `scores["og_tags"]` es 0 para una página con tags de Open Graph, verifica que el nombre del atributo `property="og:*"` coincide exactamente (algunos sitios usan `name=` en lugar de `property=`).

### 4.2 Construye el DataFrame de comparación

```python
import pandas as pd

def compare_urls(urls: list[str]) -> pd.DataFrame:
    """Audit multiple URLs and return a comparison table."""
    results = []
    for url in urls:
        try:
            r = analyze_url(url)
            results.append({
                "URL": url,
                "Score": r["overall_score"],
                "Title": r["meta"]["title"][:40],
                "Title Len": r["meta"]["title_length"],
                "Desc Len": r["meta"]["desc_length"],
                "H1 Count": r["headings"]["h1_count"],
                "Words": r["content"]["word_count"],
            })
        except Exception as e:
            results.append({"URL": url, "Score": 0, "Error": str(e)})
    return pd.DataFrame(results)

df = compare_urls(["https://example.com", "https://python.org"])
print(df.to_string(index=False))
```

**👟 Pista inicial:** `compare_urls` envuelve `analyze_url` en un try/except para que una URL que falla no mate toda la comparación, registra el error en el DataFrame en su lugar. Las columnas del DataFrame son deliberadamente planas (strings y números, no dicts anidados) para que pandas pueda ordenar, filtrar y exportarlas sin trabajo extra de manipulación.

**🎯 Resultado esperado:** Un DataFrame de pandas con dos filas (una por URL), columnas para `Score`, `Title`, `Title Len`, `Desc Len`, `H1 Count` y `Words`.

**🩹 Si sale mal:** Si el DataFrame muestra `Error` en la columna `Score` para una URL, ese sitio bloqueó o expiró el timeout, prueba una URL diferente. Si `compare_urls` tarda mucho, está corriendo secuencialmente, consulta la sección de Errores Comunes para una nota sobre la obtención paralela.

### 4.3 Verifica el informe de puntuación

**✅ Lista de verificación**

- ✅ `analyze_url("https://example.com")` devuelve un dict con `url`, `meta`, `headings`, `content`, `scores` y `overall_score`.
- ✅ `overall_score` está entre 0 y 100, y cada sub-puntaje está entre 0 y 10.
- ✅ `compare_urls` devuelve un DataFrame donde cada fila es una URL y cada columna es una métrica.

**🤔 Pregunta(s) socrática(s)**

- Una página con un título perfecto (30–60 caracteres) y una descripción faltante puntúa 50/100. Una página con ambos perfectos puntúa 70/100. ¿Qué te dice esto sobre el peso relativo de descripción vs título en esta rúbrica, y cambiarías esos pesos para una herramienta de auditoría real?
- Si ejecutaras `compare_urls` en 50 URLs y una expirara el timeout, aparece como `Score=0` con una columna `Error`. ¿Es `Score=0` el valor por defecto correcto para una obtención fallida, o usarías `NaN`, y qué cambiaría en el DataFrame si usaras `NaN`?

## ⚠️ Errores comunes

- **Las páginas renderizadas por JavaScript devuelven contenido vacío o equivocado.** `requests` + BeautifulSoup solo ven el HTML inicial, cualquier contenido cargado por JavaScript (apps de una sola página, imágenes con carga perezosa) no aparecerá en el árbol analizado. Si una página se ve vacía pero funciona en tu navegador, está renderizada por JS; usa un navegador sin pantalla (Playwright, Selenium) en su lugar, o elige una página renderizada por servidor para probar.
- **Bloqueo o limitación de tasa en solicitudes repetidas.** Algunos sitios bloquean el rastreo agresivo. El timeout de 10 segundos y el `User-Agent` personalizado ayudan, pero si estás auditando muchas páginas, añade `time.sleep(1)` entre solicitudes o usa `concurrent.futures.ThreadPoolExecutor` con un pool acotado para ser cortés.
- **Coincidencia frágil de tag `og:`.** El código usa `property="og:title"`, algunos sitios usan `name="og:title"` en su lugar (técnicamente incorrecto según la especificación de Open Graph, pero común). Si los tags OG faltan en un sitio que sabes que los tiene, prueba también buscar variantes `name=`.
- **El conteo de palabras incluye texto repetitivo.** La lista de `decompose()` elimina `script`, `style`, `nav`, `footer`, `header`, pero no todo el texto repetitivo vive en esos tags. Una página con un `<aside>` grande o un `<div class="sidebar">` lleno de enlaces inflará el conteo de palabras. Para conteos más precisos, necesitarías selectores específicos del sitio.

## Lo que acabas de construir

Un kit de auditoría SEO que obtiene cualquier URL, extrae sus meta tags y estructura de encabezados, los puntúa contra mejores prácticas establecidas y produce una tabla de comparación entre múltiples páginas, todo con cuatro librerías de Python puro y sin automatización de navegador. La rúbrica de puntuación es lo suficientemente simple para entenderla y extenderla, y la función `compare_urls` te da un DataFrame de pandas listo para ordenar, filtrar o exportar a CSV.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/seo-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/seo-analyzer) en el repositorio del curso es una versión más completa con auditoría de texto alternativo de imágenes, clasificación de enlaces internos/externos y un rastreador de sitemaps que audita cada página listada en un XML de sitemap. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Añade auditoría de texto alternativo de imágenes: encuentra cada tag `<img>`, reporta cuáles faltan `alt` y calcula el porcentaje de imágenes con texto alternativo, una victoria directa de accesibilidad y SEO.
- Añade clasificación de enlaces internos vs externos: extrae todos los enlaces `<a href>`, cuenta cada categoría y marca las páginas con demasiados pocos enlaces internos (por debajo de 3) como un posible problema SEO.
- Construye un rastreador de sitemaps: dada una URL de sitemap, obtén cada página listada en él, ejecuta la auditoría completa en cada una y exporta un CSV de resumen con `concurrent.futures.ThreadPoolExecutor` para la obtención paralela.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo, amigable para principiantes, para agregar el tuyo vía un **pull request**, incluso si nunca usaste git antes: hacer fork del repo, crear una rama, commitear tus archivos y abrir el PR, paso a paso. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓