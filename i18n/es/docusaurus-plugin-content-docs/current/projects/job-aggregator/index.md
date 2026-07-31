---
id: job-aggregator
title: "Construye un Agregador de Ofertas de Empleo"
sidebar_label: "Agregador de Ofertas de Empleo"
slug: /projects/job-aggregator
description: "Extrae datos de múltiples fuentes estilo bolsa de trabajo, elimina duplicados entre ellas, y alerta sobre nuevas coincidencias contra un filtro de palabras clave — con requests/BeautifulSoup y pandas, sin clave de API necesaria."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Agregador de Ofertas de Empleo

<ProjectPublishedDate projectId="2027-job-aggregator" />

<ProjectGreeting />

[Extrae y Analiza un Sitio Web en Vivo](/docs/projects/scrape-analyze) obtuvo un sitio y convirtió su HTML en un CSV. Buscar empleo de verdad significa vigilar *varias* fuentes a la vez, ninguna de las cuales concuerda en marcado, y preocuparse solo por lo que es genuinamente nuevo desde la última vez que revisaste. Este proyecto construye eso: analiza ofertas de un puñado de páginas de "bolsa de trabajo" estructuradas de forma diferente, combínalas en una tabla, elimina duplicados de las publicaciones que aparecen en más de una bolsa, filtra a los roles que coinciden con una palabra clave que te importa, y alerta solo sobre coincidencias nuevas — no las mismas diez ofertas cada ejecución. Asume Python a nivel 101 y, para el paso de eliminación de duplicados/filtrado, comodidad con pandas a nivel de Análisis de Datos — filtrado, `drop_duplicates`, máscaras booleanas.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Analizar el HTML de una sola página de ofertas de empleo en campos estructurados con BeautifulSoup.
2. Escribir un pequeño analizador por fuente y combinar varias fuentes estructuradas de forma diferente en una tabla.
3. Eliminar duplicados de ofertas publicadas en más de una bolsa, usando pandas.
4. Filtrar por palabra clave e imprimir/guardar solo las coincidencias que son nuevas desde la última ejecución.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino que siguen los pasos de esta lección, y el recomendado — es Python real corriendo en tu propia máquina, el mismo movimiento de "gradúate a Python real" que cualquier otro proyecto de esta sección. La sección de Configuración de abajo explica cómo instalarlo.

**GitHub Codespaces** es una alternativa de configuración cero si prefieres no instalar nada localmente todavía: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta los mismos comandos `uv` exactos desde una terminal en tu pestaña del navegador.

**Google Colab, Kaggle Notebooks, o Binder** son un ajuste genuinamente bueno para este proyecto en particular — sin GPU, sin clave de API, sin proceso de larga duración que gestionar, y todo el pipeline cabe cómodamente en un puñado de celdas. Una versión real y ejecutable en notebook (los mismos analizadores, clave de eliminación de duplicados, y filtro de palabras clave que los pasos de abajo) vive en [`examples/job-aggregator/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/notebook.ipynb). Haz clic en una insignia para lanzarlo directamente, sin instalación local en absoluto:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fjob-aggregator%2Fnotebook.ipynb)

Sé honesto contigo mismo sobre la compensación, sin embargo: esta es una forma de menor fidelidad de experimentar el proyecto que un proyecto `uv` local real — sin archivos separados, sin estructura de proyecto real, solo celdas en un notebook. Trátalo como una forma rápida de experimentar, no el camino principal.

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

Luego configura un proyecto local:

```bash
uv init job-aggregator
cd job-aggregator
uv add beautifulsoup4 pandas
```

Sin clave de API, sin registro de nivel gratuito, nada que configurar antes de poder ejecutar una sola línea de código.

## Una nota sobre lo que este proyecto extrae

Las bolsas de trabajo reales — LinkedIn, Indeed, y sitios similares — prohíben explícitamente el scraping automatizado en sus términos de servicio, activamente detectan y bloquean scrapers, y cambian su marcado con suficiente frecuencia como para que cualquier lección construida contra ellos se rompiera en meses. Nada de eso es una buena base para un proyecto de curso destinado a seguir funcionando durante años.

En su lugar, este proyecto viene con su propio pequeño **conjunto de datos de muestra incluido**: tres archivos HTML estáticos bajo [`examples/job-aggregator/sample_data/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/job-aggregator/sample_data), cada uno con estilo de una "bolsa de trabajo" de juguete diferente (`board_alpha.html`, `board_beta.html`, `board_gamma.html`), cada uno usando HTML genuinamente diferente para sus ofertas — un diseño de tarjeta div-y-span, una lista con viñetas, y una `<table>` simple. Dos de las diez ofertas entre ellos son el mismo trabajo publicado en más de una bolsa, a propósito, para que haya algo real que deduplicar. Estás analizando HTML real con llamadas reales de BeautifulSoup en todo momento — la única diferencia de extraer un sitio en vivo es que `requests.get()` se reemplaza por leer un archivo local, así que la lección nunca depende del tiempo de actividad, marcado, o tolerancia de algún sitio externo hacia ser extraído.

:::tip[Siempre verifica robots.txt y los términos de servicio antes de extraer cualquier sitio real]
Si extiendes este proyecto para apuntar a una bolsa de trabajo real y en vivo o cualquier otro sitio real, verifica primero el `robots.txt` de ese sitio (ej. `https://example.com/robots.txt`) y los términos de servicio. `robots.txt` indica qué partes de un sitio las herramientas automatizadas pueden y no pueden obtener. Muchas bolsas de trabajo van más allá y prohíben explícitamente el scraping en sus términos — lee esos, no solo `robots.txt`, ya que un sitio puede permitir una URL en `robots.txt` mientras aún prohíbe el acceso automatizado en sus términos de servicio.
:::

## Paso 1: Analiza una sola página de ofertas en campos estructurados

Abre [`board_alpha.html`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/sample_data/board_alpha.html) en un editor de texto. Cada oferta está dentro de un `<div class="job-card">`, con el título en un `<h2 class="job-title">`, la empresa en un `<span class="company">`, la ubicación en un `<span class="location">`, y una descripción en un `<p class="description">`. Ese es el mismo patrón `find`/`find_all` de Extrae y Analiza un Sitio Web en Vivo, solo aplicado a un archivo local en lugar de una respuesta en vivo:

```python
# aggregate.py
from pathlib import Path

from bs4 import BeautifulSoup

html = Path("sample_data/board_alpha.html").read_text(encoding="utf-8")
soup = BeautifulSoup(html, "html.parser")

for card in soup.find_all("div", class_="job-card"):
    title = card.find("h2", class_="job-title").get_text(strip=True)
    company = card.find("span", class_="company").get_text(strip=True)
    location = card.find("span", class_="location").get_text(strip=True)
    description = card.find("p", class_="description").get_text(strip=True)
    print(f"{title} @ {company} ({location})")
```

```bash
uv run python aggregate.py
```

Deberías ver cuatro líneas impresas, una por cada oferta en la bolsa de Alpha.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python aggregate.py` se ejecuta sin errores.</StepChecklistItem>
<StepChecklistItem>Imprime exactamente 4 líneas, una por cada oferta en `board_alpha.html`.</StepChecklistItem>
<StepChecklistItem>Cada línea tiene un título, empresa, y ubicación reales — no `None` o una cadena vacía.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `.get_text(strip=True)` elimina espacios en blanco al principio/final del texto de una etiqueta. ¿Qué podría salir mal dos pasos más adelante, cuando compares títulos entre bolsas para eliminar duplicados, si dejaras fuera `strip=True`?
- Cada campo aquí es requerido por el analizador (`card.find(...)` llama inmediatamente a `.get_text(...)` en el resultado). ¿Qué pasa si a una oferta en una bolsa con formato diferente le falta su `<span>` de ubicación por completo? ¿Dónde exactamente fallaría eso, y cómo te ayudaría el mensaje de error a encontrarlo?

## Paso 2: Analiza múltiples fuentes y combínalas

`board_beta.html` y `board_gamma.html` contienen el mismo *tipo* de datos — título, empresa, ubicación, descripción — pero ninguno usa el marcado de Alpha. Beta lista trabajos como elementos `<li class="listing">` con un `<a class="position-title">`; Gamma los lista como filas de tabla `<tr class="job-row">` con celdas `<td>` simples. Un solo scraper de "un selector para todas las bolsas" no existe — en su lugar, escribe una pequeña función analizadora por fuente, cada una devolviendo exactamente la misma forma de diccionario, para que el resto del pipeline nunca tenga que saber de qué bolsa vino una oferta:

```python
# aggregate.py (continued)
def parse_board_alpha(html):
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for card in soup.find_all("div", class_="job-card"):
        listings.append({
            "title": card.find("h2", class_="job-title").get_text(strip=True),
            "company": card.find("span", class_="company").get_text(strip=True),
            "location": card.find("span", class_="location").get_text(strip=True),
            "description": card.find("p", class_="description").get_text(strip=True),
            "source": "board_alpha",
        })
    return listings


def parse_board_beta(html):
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for item in soup.find_all("li", class_="listing"):
        listings.append({
            "title": item.find("a", class_="position-title").get_text(strip=True),
            "company": item.find("div", class_="employer").get_text(strip=True),
            "location": item.find("div", class_="loc").get_text(strip=True),
            "description": item.find("div", class_="summary").get_text(strip=True),
            "source": "board_beta",
        })
    return listings


def parse_board_gamma(html):
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for row in soup.find_all("tr", class_="job-row"):
        cells = row.find_all("td")
        listings.append({
            "title": cells[0].get_text(strip=True),
            "company": cells[1].get_text(strip=True),
            "location": cells[2].get_text(strip=True),
            "description": cells[3].get_text(strip=True),
            "source": "board_gamma",
        })
    return listings


PARSERS = {
    "board_alpha.html": parse_board_alpha,
    "board_beta.html": parse_board_beta,
    "board_gamma.html": parse_board_gamma,
}


def scrape_all_boards():
    all_listings = []
    for filename, parser in PARSERS.items():
        html = (Path("sample_data") / filename).read_text(encoding="utf-8")
        all_listings.extend(parser(html))
    return all_listings


if __name__ == "__main__":
    listings = scrape_all_boards()
    print(f"Parsed {len(listings)} raw listings from {len(PARSERS)} boards")
```

```bash
uv run python aggregate.py
```

Deberías ver 10 ofertas crudas en total (4 + 3 + 3) — "crudas" porque nada se ha deduplicado todavía.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`scrape_all_boards()` devuelve 10 ofertas.</StepChecklistItem>
<StepChecklistItem>Cada diccionario de oferta tiene las mismas cinco claves (`title`, `company`, `location`, `description`, `source`), sin importar de qué bolsa vino.</StepChecklistItem>
<StepChecklistItem>El campo `source` identifica correctamente de qué bolsa vino cada oferta.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `PARSERS` mapea un nombre de archivo a una función. ¿Qué necesitarías añadir para soportar una cuarta bolsa, sin cambiar `scrape_all_boards` en absoluto?
- `parse_board_gamma` accede a `cells[0]`, `cells[1]`, etc. por posición en lugar de por nombre de clase, a diferencia de los otros dos analizadores. ¿Qué se rompería silenciosamente si la tabla de Gamma añadiera una nueva primera columna (digamos, una fecha de publicación) sin que te dieras cuenta?

## Paso 3: Elimina duplicados de ofertas con pandas

Dos de las diez ofertas son exactamente el mismo trabajo, publicado en dos bolsas diferentes: un rol de "Senior Python Developer" en Northwind Analytics aparece tanto en Alpha como en Beta, y un rol de "Data Analyst" en Contoso Retail aparece tanto en Alpha como en Gamma. Dejado así, una alerta posterior reportaría la misma vacante dos veces. La solución es una clave de deduplicación — algo lo suficientemente estable como para reconocer "el mismo trabajo" entre fuentes aunque la redacción de la descripción difiera ligeramente de bolsa a bolsa:

```python
# aggregate.py (continued)
import hashlib
import re

import pandas as pd


def dedupe_key(listing):
    """A stable id for "the same job", independent of which board posted it."""
    normalized = f"{listing['title'].strip().lower()}|{listing['company'].strip().lower()}"
    normalized = re.sub(r"\s+", " ", normalized)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


listings = scrape_all_boards()
for listing in listings:
    listing["dedupe_key"] = dedupe_key(listing)

df = pd.DataFrame(listings)
before = len(df)
df = df.drop_duplicates(subset="dedupe_key", keep="first").reset_index(drop=True)
print(f"Deduped {before} listings -> {len(df)} unique jobs ({before - len(df)} duplicate posting(s) removed)")

df.to_csv("listings.csv", index=False)
```

```bash
uv run python aggregate.py
```

Deberías ver "Deduped 10 listings -> 8 unique jobs (2 duplicate posting(s) removed)".

La clave de deduplicación aquí es texto normalizado de `title + company`, no un hash de la fila completa — deliberadamente. Hacer hash de la fila completa (incluyendo `description`) trataría las descripciones ligeramente diferentes de Alpha y Beta del mismo trabajo como dos trabajos *diferentes*, derrotando el propósito.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`aggregate.py` imprime "2 duplicate posting(s) removed".</StepChecklistItem>
<StepChecklistItem>`listings.csv` tiene exactamente 8 filas (más el encabezado).</StepChecklistItem>
<StepChecklistItem>La fila "Senior Python Developer" de Northwind Analytics y la fila "Data Analyst" de Contoso Retail aparecen cada una exactamente una vez en `listings.csv`.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `drop_duplicates(..., keep="first")` mantiene la fila que resulte estar primero en el DataFrame. Para estos dos trabajos duplicados, ¿la copia de qué bolsa se mantiene, e importa cuál gane aquí? ¿Cuándo *importaría*?
- Si dos empresas diferentes resultaran publicar dos trabajos diferentes con exactamente el mismo título (ej. dos vacantes no relacionadas de "Data Analyst"), ¿esta clave de deduplicación las fusionaría incorrectamente? ¿Por qué sí o por qué no?

## Paso 4: Filtra por palabra clave y alerta sobre coincidencias nuevas

El último paso es la mitad de "alerta" del proyecto: filtra las ofertas deduplicadas a las que coinciden con una palabra clave, luego recuerda sobre qué ya has alertado para que una segunda ejecución contra los mismos datos no se repita a sí misma:

```python
# filter_alerts.py
import json
from pathlib import Path

import pandas as pd

SEEN_FILE = Path("seen.json")
KEYWORDS = ["python"]


def load_seen():
    if SEEN_FILE.exists():
        return set(json.loads(SEEN_FILE.read_text(encoding="utf-8")))
    return set()


def save_seen(dedupe_keys):
    SEEN_FILE.write_text(json.dumps(sorted(dedupe_keys)), encoding="utf-8")


def keyword_filter(df, keywords):
    pattern = "|".join(keywords)
    text = df["title"].str.cat(df["description"], sep=" ")
    return df[text.str.contains(pattern, case=False, regex=True, na=False)]


if __name__ == "__main__":
    df = pd.read_csv("listings.csv")
    matches = keyword_filter(df, KEYWORDS)
    print(f"{len(matches)} unique listing(s) match keywords {KEYWORDS}")

    seen = load_seen()
    new_matches = matches[~matches["dedupe_key"].isin(seen)]

    if new_matches.empty:
        print("No new matches since the last run.")
    else:
        print(f"\n{len(new_matches)} NEW match(es):\n")
        for _, row in new_matches.iterrows():
            print(f"- {row['title']} @ {row['company']} ({row['location']}) [{row['source']}]")
        new_matches.to_csv("new_matches.csv", index=False)

    save_seen(seen | set(matches["dedupe_key"]))
```

```bash
uv run python filter_alerts.py
```

La primera ejecución debería reportar 6 coincidencias nuevas (cada oferta cuyo título o descripción menciona "python"). Ejecútalo de nuevo sin cambiar nada, y debería reportar cero coincidencias nuevas — `seen.json` recuerda sobre qué ya alertó, exactamente como un agregador programado real revisando cada mañana necesitaría.

:::tip[Un filtro de palabra clave es solo la versión más simple de "coincide con lo que me importa"]
`str.contains` con un patrón unido por `|` es intencionalmente el filtro más simple posible — suficientemente bueno para probar que la lógica de alertas funciona. Una versión más realista podría coincidir contra varios *grupos* de palabras clave (ej. "python" O "django" para roles de backend, "remoto" como un filtro requerido separado en `location`), o puntuar una coincidencia por cuántas palabras clave coinciden en lugar de tratarla como pasa/no pasa. Haz que la versión simple funcione primero; la lógica de coincidencia es la parte más fácil de reemplazar después.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>La primera ejecución de `filter_alerts.py` reporta 6 coincidencias nuevas y crea `new_matches.csv`.</StepChecklistItem>
<StepChecklistItem>Una segunda ejecución, sin cambios a `listings.csv`, reporta "No new matches since the last run."</StepChecklistItem>
<StepChecklistItem>Eliminar `seen.json` y ejecutar de nuevo trae de vuelta las 6 coincidencias como "nuevas."</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si a la `description` de una oferta le faltara (`NaN` después de un `pd.read_csv`), ¿qué haría `text.str.contains(..., na=False)` con esa fila, y por qué importa `na=False` aquí específicamente?
- `seen` se almacena como una lista JSON de claves de deduplicación, cargada fresca desde disco en cada ejecución. ¿Qué le pasaría a la garantía de "sin alertas repetidas" si dos copias de este script corrieran concurrentemente y ambas leyeran `seen.json` antes de que cualquiera tuviera oportunidad de reescribirlo?

## ⚠️ Errores comunes

- **Escribir un analizador universal en lugar de uno por fuente.** Es tentador intentar un solo conjunto de selectores que "mayormente funciona" entre bolsas. No funcionará — Alpha, Beta, y Gamma no comparten un solo nombre de clase. Una pequeña función por fuente, todas devolviendo la misma forma de diccionario, es menos código en general que luchar contra un selector de talla única.
- **Deduplicar con la clave equivocada.** Hacer hash de la oferta completa (incluyendo `description`) significa que dos publicaciones del mismo trabajo con redacción ligeramente diferente nunca coinciden, derrotando el propósito de deduplicar en absoluto. Elige una clave estable a través de *cómo* se describe un trabajo, no solo *si* es idéntico palabra por palabra.
- **Perder el estado de "nuevo desde la última ejecución" entre ejecuciones.** Sin algo como `seen.json` persistido en disco, cada ejecución re-reporta cada coincidencia como nueva, que es exactamente el comportamiento ruidoso que una alerta real debería evitar. Este es también el primer lugar donde un trabajo cron real o proceso en segundo plano difiere de un script de una sola vez: el estado tiene que sobrevivir entre invocaciones, no solo vivir en una variable.
- **Olvidar `na=False` en un filtro de cadena de pandas.** `Series.str.contains` en una columna con cualquier valor faltante lanza o produce resultados `NaN` sin él, lo cual puede silenciosamente eliminar filas de una máscara booleana de formas fáciles de pasar por alto.

## Lo que acabas de construir

Un pipeline completo de analizar → combinar → deduplicar → filtrar → alertar: análisis HTML real a través de múltiples fuentes estructuradas de forma diferente, una estrategia de deduplicación que sobrevive a redacción casi duplicada, y una alerta de palabra clave que recuerda lo que ya te dijo. Apunta los mismos cuatro pasos a un conjunto diferente de fuentes amigables con el scraping (después de verificar su `robots.txt` y términos de servicio) y el pipeline no cambia — solo las funciones analizadoras por fuente lo hacen.

## A dónde ir desde aquí

- Conecta una notificación real en lugar de imprimir a la terminal — `smtplib` para un correo, o un webhook `POST` a un canal de Discord o Slack, disparado solo para `new_matches`.
- Programa el pipeline completo para correr periódicamente (un trabajo cron, GitHub Actions en un horario, o un bucle simple con `time.sleep()`) para que revise nuevas ofertas por sí mismo en lugar de manualmente.
- Puntúa las coincidencias en lugar de tratar el filtro de palabra clave como pasa/no pasa — ej. cuenta cuántos de varios grupos de palabras clave coinciden en una oferta, y ordena `new_matches` por esa puntuación antes de alertar.
- Cambia los archivos CSV/JSON por una pequeña base de datos SQLite (el módulo integrado `sqlite3` de Python) una vez que estés rastreando suficiente historial como para querer consultarlo — ej. "¿cuántas nuevas ofertas de Python aparecieron cada semana este mes?"

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

<ProjectProgressCheckbox projectId="2027-job-aggregator" />
