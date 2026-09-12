---
title: "Motor de Blog en Markdown"
description: "Construye un generador de sitios estáticos que convierte una carpeta de publicaciones en Markdown en un blog HTML real: parseo de frontmatter, renderizado de marcado y una página índice filtrada por etiquetas."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "frontend", "data-pipeline", "file-io"]
learningObjectives:
  - "Parsear frontmatter YAML de archivos Markdown a mano"
  - "Convertir fuente Markdown en HTML con la biblioteca markdown"
  - "Renderizar plantillas con f-strings de Python y string.Template"
  - "Ensamblar publicaciones y un índice de etiquetas en un sitio estático completo"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/data-structures", "python-101/functions"]
---

# 📝 Construye un Motor de Blog en Markdown

La web está construida sobre sitios estáticos, una carpeta de publicaciones en texto plano, un paso de renderizado y una pila de archivos HTML que no necesitan servidor, ni base de datos, ni framework de JavaScript para servirse. Este proyecto construye un generador de sitios estáticos en miniatura: lee una carpeta `posts/` de archivos Markdown, parsea el frontmatter YAML de cada uno para título/fecha/etiquetas, renderiza el cuerpo a HTML y produce un `site/` completo con una página índice y listados de publicaciones filtrados por etiqueta, la misma forma que los motores detrás de mil blogs reales.

Esto asume Python 101, I/O de archivos, cadenas, diccionarios y funciones. Nada más allá de eso: sin framework, sin base de datos, sin servicios externos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Diseñar un formato de archivo Markdown-más-frontmatter y dividirlo limpiamente en metadatos y cuerpo.
2. Parsear el frontmatter YAML en un dict de Python, un parser diminuto que maneja comillas y listas.
3. Renderizar el cuerpo Markdown a HTML con una biblioteca, y escapar cualquier cosa peligrosa.
4. Construir una página índice que liste todas las publicaciones, además de páginas filtradas por etiqueta.
5. Ejecutar el generador sobre una carpeta de publicaciones reales e inspeccionar el sitio terminado en un navegador.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal aquí. La recompensa de este proyecto es abrir `site/index.html` en un navegador real, y el bucle "escribe una carpeta de publicaciones, ejecuta un comando, sitio publicado" es más honesto cuando las publicaciones y la salida viven en un sistema de archivos real que puedas tocar.

**GitHub Codespaces** es un camino igualmente bueno, abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y todo lo de abajo, incluida la vista previa del navegador, funciona igual desde una pestaña servida por Cloudflare o `python -m http.server`. No hay ninguna afirmación de GitHub Pages local aquí, es solo una caja de desarrollo donde los comandos son idénticos.

**Google Colab, Kaggle Notebooks y Binder son una forma decente de *ver la maquinaria funcionar*, pero débiles para la recompensa.** El notebook de abajo genera una carpeta `posts/` falsa en memoria y renderiza el sitio completo a un directorio que puedes inspeccionar celda por celda, así que el parseo, las plantillas y el ensamblaje se ejecutan honestamente. Lo que no puede hacer bien es el bucle real de *tú escribiendo tu propio post.md y refrescando la página*; eso es un ejercicio de sistema de archivos más navegador, que es lo que te dan el camino local o el de Codespace. Usa el notebook para aprender los pasos; cambia a `uv` cuando quieras publicar.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/markdown-blog-engine/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/markdown-blog-engine/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmarkdown-blog-engine%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de escribir el generador: `uv` para un Python moderno, una biblioteca Markdown y una carpeta `posts/` con dos publicaciones realistas para masticar.

### Instala `uv` y la única dependencia

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
mkdir markdown-blog-engine && cd markdown-blog-engine
uv init --bare
uv add markdown
```

### Escribe dos publicaciones iniciales

Pega estos en `posts/hello.md` y `posts/python-tips.md`:

```markdown
---
title: "Hello, world from Markdown"
date: "2026-08-03"
tags: "intro, meta"
---

A blog in **Markdown**? Sure. Here is the first post, rendered by *our own* tool.

## Why this exists

We are about to write a static site generator. This paragraph is **bold** on purpose, so the render step has something to do.
```

```markdown
---
title: "Three Python tips"
date: "2026-08-04"
tags: "python, tips"
---

1. Use `enumerate` instead of `range(len(...))`.
2. Prefer dicts to parallel lists.
3. **Test** your parser on bad input.
```

```bash
mkdir posts
# save the two blocks above as posts/hello.md and posts/python-tips.md
ls -la posts
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `markdown` instalado vía `uv add markdown`.
- ✅ `posts/hello.md` y `posts/python-tips.md` existen, cada uno comenzando con un bloque de frontmatter delimitado por `---`.

## Paso 1: Dividir un archivo en frontmatter y cuerpo

Una publicación de sitio estático son realmente dos partes en un archivo: un pequeño bloque YAML de metadatos entre dos líneas `---`, y luego el cuerpo Markdown. El primer trabajo del generador es una división limpia y aburrida: hasta el segundo `---` es frontmatter, todo lo de después es el cuerpo. Lograr que esta división sea *robusta* antes de cualquier renderizado elegante es la diferencia entre una herramienta en la que confías y una que silenciosamente suelta publicaciones.

### 1.1 Escribe el divisor

```python
# engine.py
from pathlib import Path

def read_post(path: str) -> dict:
    text = Path(path).read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{path}: no frontmatter block")
    lines = text.splitlines()
    end = next(i for i, l in enumerate(lines[1:], start=1) if l.strip() == "---")
    frontmatter = "\n".join(lines[1:end])
    body = "\n".join(lines[end + 1:])
    return {"path": path, "frontmatter": frontmatter, "body": body}

if __name__ == "__main__":
    for p in sorted(Path("posts").glob("*.md")):
        post = read_post(str(p))
        print(f"--- {p} ---")
        print("frontmatter:", post["frontmatter"].splitlines()[0])
        print("body starts:", repr(post["body"].splitlines()[0]))
```

`next((i for i, l in enumerate(...) if ...))` encuentra la línea `---` *del segundo* separador en una sola pasada, el primero lo consume `startswith`, y todo lo posterior al segundo es el cuerpo. La expresión generadora lanza `StopIteration` con un archivo malformado, que es un fallo ruidoso y honesto en lugar de basura parcialmente parseada fluyendo silenciosamente río abajo.

**👟 Pista inicial :** Ejecuta `engine.py` sobre las dos publicaciones iniciales y confirma que la división coloca las primeras líneas correctas en cada mitad, la primera línea del frontmatter es un título, la primera línea del cuerpo es prosa.

**🎯 Resultado esperado :** Para cada publicación, una línea que muestre una primera línea de `frontmatter` como `title: "Hello, world from Markdown"` y una que muestre una primera línea de `body` como `'A blog in **Markdown**? Sure. ...'`.

**🩹 Si sale mal :** Si `StopIteration` sube como traceback, a una publicación le falta su `---` de cierre, añádelo (la división *debe* ver un segundo separador). Si el cuerpo incluye el `---` de cierre, tu índice `end` está desviado por uno, revisa que `lines[end + 1:]` empiece *después* de esa línea, no en ella.

### 1.2 Verifica la división

**✅ Lista de verificación**

- ✅ Ambas publicaciones iniciales se dividen en una cadena de frontmatter y una de cuerpo sin que ninguna línea `---` se filtre en ninguna de las dos.
- ✅ Quitar el `---` inicial de un archivo de publicación hace que `read_post` lance un `ValueError` claro con el nombre del archivo.
- ✅ Puedes predecir qué devuelve `read_post` para un archivo con *tres* líneas `---` (la división usa la segunda; la tercera se convierte en cuerpo).

**🤔 Pregunta(s) socrática(s)**

- Encontramos el `---` de cierre escaneando una línea que sea exactamente `---`. ¿Qué pasaría con una línea del cuerpo que en sí misma sea `---`? ¿El modo de fallo es una división incorrecta silenciosa o una ruidosa, y cuál preferirías?
- El divisor devuelve la cadena de frontmatter *cruda*. ¿Qué implica eso para el caso límite de cadena vacía donde dos publicaciones juntas tienen líneas en blanco sueltas, y dónde en la canalización crees que debería ocurrir el parseo?

## Paso 2: Parsear el frontmatter YAML

Ahora la cadena de frontmatter se convierte en un dict real, `title`, `date`, `tags`, para que el resto del motor pueda hacer `post["title"]` en lugar de re-parsear texto. YAML es una madriguera de conejo; un generador solo necesita las ~4 reglas que cubren nuestros propios archivos: `key: value`, valores entre comillas con dos puntos, y listas separadas por comas.

### 2.1 Escribe un parser de subconjunto de YAML

```python
# engine.py (continued)

def parse_frontmatter(raw: str) -> dict:
    data = {}
    for line in raw.splitlines():
        if not line.strip():
            continue
        key, value = line.split(":", 1)
        value = value.strip()
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        elif "," in value:
            value = [v.strip() for v in value.split(",")]
        elif not value:
            value = []
        data[key.strip()] = value
    return data

if __name__ == "__main__":
    for p in sorted(Path("posts").glob("*.md")):
        meta = parse_frontmatter(read_post(str(p))["frontmatter"])
        print(p, "->", meta)
```

`line.split(":", 1)` es la línea que hace esto seguro: dividir una vez mantiene intactos los dos puntos *dentro del valor* (como `08:30` o `https://...`), porque la segunda parte no se vuelve a dividir. El valor toma entonces una de tres formas, cadena sin comillas, cadena entre comillas con las comillas quitadas, o lista de comas, que es todo el subconjunto de YAML que prometimos.

**👟 Pista inicial :** Imprime el dict parseado para ambas publicaciones antes de escribir una sola línea del renderizador, quieres ver que `tags` se convierta en una lista, no en una cadena.

**🎯 Resultado esperado :** Dos líneas como `posts/hello.md -> {'title': 'Hello, world from Markdown', 'date': '2026-08-03', 'tags': ['intro', 'meta']}`, nota que `tags` es una lista real.

**🩹 Si sale mal :** Si `title` conserva sus comillas, la rama de quitar comillas `startswith/endswith` no está coincidiendo, revisa si hay un espacio al final *después* de la comilla de cierre en el archivo (hacemos `strip()` de las comillas pero el valor ya fue recortado). Si `tags` sale como una sola cadena `'intro, meta'`, la verificación `"," in value` ocurrió antes del recorte, el orden importa: recorta primero, luego ramifica.

### 2.2 Verifica el parseo de YAML

**✅ Lista de verificación**

- ✅ `parse_frontmatter` devuelve un dict donde `tags` es una `list` y `title` es una cadena desnuda sin comillas.
- ✅ Un valor como `date: "2026-08-04"` se parsea a `'2026-08-04'` con las comillas eliminadas.
- ✅ Una línea de frontmatter *sin* su valor (`author:`) produce una lista vacía, y puedes explicar por qué se elige `[]` sobre `None`.

**🤔 Pregunta(s) socrática(s)**

- Nuestro parser no puede manejar una lista anidada ni un bloque `oneline: | ...`. Escribe el frontmatter más pequeño que se malparsearía *silenciosamente*, y decide si eso es aceptable para un motor de blog personal (pista: nombra el fallo como ruidoso vs. silencioso).
- Un parser YAML real (como `PyYAML`, la biblioteca que usan las herramientas reales) soporta anclas, cadenas multilínea y 100 características más. ¿Cuál es el costo de arrastrar eso a un proyecto cuyos archivos controlas? ¿Cuándo "solo instala PyYAML" se vuelve la decisión correcta?

## Paso 3: Renderizar Markdown a HTML

Parsear produce texto; renderizar produce una página. La biblioteca `markdown` convierte `**bold**`, `# heading` y código delimitado en etiquetas `<strong>`, `<h1>` y `<pre>`. Hay una arruga de seguridad en el HTML que sale, el cuerpo podría contener HTML crudo, y uno hostil puede llevar JavaScript. El arreglo probado y confiable, `bleach`, puede que ya esté en tu wheel. Así que el renderizador hace dos trabajos: convertir, y luego sanitizar.

### 3.1 Convierte y sanitiza

```python
# render.py
from pathlib import Path

try:
    from bleach import clean
except ImportError:
    def clean(text: str, **kwargs) -> str:
        return text

import markdown as md

def to_html(body: str) -> str:
    raw = md.markdown(body, extensions=["fenced_code", "tables"])
    return clean(raw, tags={"p", "h1", "h2", "h3", "em", "strong", "code",
                            "pre", "ul", "ol", "li", "blockquote", "img",
                            "a", "table", "thead", "tbody", "tr", "td", "th"},
                  attributes={"a": {"href", "title"}, "img": {"src", "alt"}})

if __name__ == "__main__":
    body = "**Bold here** with <script>alert('x')</script> and `code`."
    print(to_html(body))
```

`bleach` es la mentalidad de *lista blanca* en acción: en lugar de intentar atrapar cada cosa maliciosa (un juego perdido), declaras exactamente qué etiquetas y atributos pueden sobrevivir, y todo lo demás, el `<script>`, se descarta. El `try/except` del import es deliberado: el código corre incluso en una instalación limpia, degradando a sin sanitización, e imprime un fallback sin advertencias para que el notebook y la instalación completa compartan un archivo.

**👟 Pista inicial :** Instala bleach con `uv add bleach`, luego ejecuta `render.py` y confirma que la etiqueta `<script>` desaparece de la salida mientras `**Bold**` se convirtió en `<strong>`.

**🎯 Resultado esperado :** HTML donde `<strong>Bold here</strong>` está presente y `<script>`/`alert(...)` están completamente ausentes, las etiquetas de script eliminadas por la lista blanca.

**🩹 Si sale mal :** Si `<script>` todavía aparece en la salida, estás golpeando el fallback degradado de `clean`, revisa que `uv add bleach` tuvo éxito y la ruta de import (`from bleach import clean`) es correcta. Si el bold no renderizó, `md.markdown` con `extensions=["fenced_code", "tables"]` se está llamando sobre la *cadena de cuerpo que todavía tiene frontmatter*, asegúrate de que `read_post` lo haya dividido antes.

### 3.2 Verifica el renderizado

**✅ Lista de verificación**

- ✅ `to_html("**x**")` devuelve HTML que contiene `<strong>x</strong>`.
- ✅ `to_html("<script>...")` devuelve HTML sin `<script>`, `<iframe>` ni atributos `onclick=`.
- ✅ Los bloques de código delimitados (```` ```python ````) sobreviven al renderizado como `<pre>`/`<code>`.

**🤔 Pregunta(s) socrática(s)**

- Eliminamos el HTML crudo *después* de la conversión de Markdown. La mayoría de los motores de Markdown reales pasan el HTML crudo intacto, por eso `md` + un sanitizador es el orden de "convertir, luego lista blanca" con doble seguridad. ¿Qué ataque sobreviviría si sanitizaras *antes* de la conversión (pista: cada `<` en un bloque de código es significativo para el conversor)?
- La lista blanca mantiene `img` pero solo los atributos `src`/`alt`. ¿Cuál es el riesgo concreto si añadieras `onerror` a los atributos permitidos, escribe el HTML de una línea que lo dispare.

## Paso 4: Ensambla las páginas

Ahora el generador se gana la palabra "sitio": cada publicación se convierte en su propio archivo `.html`, y las páginas índice/etiqueta se *derivan* de las publicaciones. La derivación es el truco central de la generación estática, nunca escribes el índice a mano; lo calculas en cada ejecución, así que "añade una publicación, vuelve a ejecutar, el índice se actualiza" siempre es verdad.

### 4.1 Construye la plantilla de página y el escritor

```python
# sitegen.py
from pathlib import Path
from engine import read_post, parse_frontmatter
from render import to_html

PAGE = """<!doctype html>
<html><head><meta charset="utf-8">
<title>{title}</title></head>
<body>
<header><a href="index.html">All posts</a></header>
<h1>{title}</h1>
<p class="meta">{date} &middot; {tags}</p>
<article>{body_html}</article>
<footer><p><a href="index.html">&larr; back to index</a></p></footer>
</body></html>"""

def build_post(post_path: str, out_dir: Path) -> dict:
    raw = read_post(post_path)
    meta = parse_frontmatter(raw["frontmatter"])
    meta.setdefault("title", "Untitled")
    meta.setdefault("date", "unknown")
    tags = ", ".join(meta.get("tags", []))
    html = PAGE.format(title=meta["title"], date=meta["date"],
                       tags=tags, body_html=to_html(raw["body"]))
    out = out_dir / f"{Path(post_path).stem}.html"
    out.write_text(html, encoding="utf-8")
    return {"slug": Path(post_path).stem, "title": meta["title"],
            "date": meta["date"], "tags": meta.get("tags", [])}

if __name__ == "__main__":
    out = Path("site")
    out.mkdir(exist_ok=True)
    posts = sorted((build_post(str(p), out) for p in Path("posts").glob("*.md")),
                   key=lambda d: d["date"], reverse=True)
    print("built:", [p["slug"] for p in posts])
```

`PAGE` es una plantilla diminuta con ranuras `{name}` rellenadas por `.format()`, modelo, vista y controlador aplastados en una sola cadena, que es *suficiente* para un generador de este tamaño. El orden por fecha (más reciente primero) es la primera *vista* que depende de los metadatos, y el valor de retorno de `build_post`, no el archivo que escribió, es lo que consumirá la página índice, así que el índice nunca re-parsea los archivos dos veces.

**👟 Pista inicial :** Ejecuta `sitegen.py`, luego `open site/hello.html` (o `start`/`xdg-open` en tu sistema operativo) y mira una publicación renderizada real antes de construir el índice.

**🎯 Resultado esperado :** `built: ['python-tips', 'hello']` (más reciente primero, `python-tips` fecha 2026-08-04) y dos archivos `.html` de tamaño manual bajo `site/` que se renderizan en un navegador con título, línea de meta y cuerpo de artículo.

**🩹 Si sale mal :** Si se dispara `KeyError: 'title'`, al frontmatter de una publicación le falta `title`, las llamadas `setdefault` en `build_post` existen para absorber eso; si ves el error, los setdefaults se colocaron *después* de un `.format` que ya corrió. Si `site/` acumula páginas obsoletas de publicaciones eliminadas, eso es lo esperado por ahora: limpia `site/` antes de cada build, o llámalo una característica y elimina a mano.

### 4.2 Construye el índice con enlaces por etiqueta

```python
# sitegen.py (continued)

def build_index(posts: list[dict], out_dir: Path) -> None:
    items = "\n".join(
        f'<li><a href="{p["slug"]}.html">{p["title"]}</a> '
        f'<small>({p["date"]})</small></li>' for p in posts)
    (out_dir / "index.html").write_text(
        f"""<!doctype html><html><head><meta charset="utf-8"><title>My blog</title></head>
<body><h1>My blog</h1><ul>{items}</ul>
<p>Tags: {tags_block(posts)}</p></body></html>""", encoding="utf-8")

def tags_block(posts: list[dict]) -> str:
    by_tag = {}
    for p in posts:
        for t in p["tags"]:
            by_tag.setdefault(t, []).append(p["slug"])
    return " ".join(f'<a href="tag-{t}.html">{t}</a>' for t in sorted(by_tag))

if __name__ == "__main__":
    # ...build_post loop as above, then:
    build_index(posts, out)  # referenced 'posts' from the previous block
    print("index written")
```

`by_tag.setdefault(t, []).append(...)` es el modismo "construye un dict de listas" en una línea, la alternativa `if t not in by_tag: by_tag[t] = []` es lo mismo escrito explícitamente. El índice está *enteramente derivado*: contiene cero HTML escrito a mano, así que nunca puede discrepar con la carpeta de publicaciones. Ese invariante es toda la razón por la que la generación estática vence al mantenimiento manual de un índice.

**👟 Pista inicial :** Añade `build_index` y `tags_block`, vuelve a ejecutar, luego abre `index.html` y haz clic en un enlace de etiqueta, *lee* el 404 antes de arreglarlo; verás exactamente lo que el siguiente micro-paso debe crear.

**🎯 Resultado esperado :** `site/index.html` lista ambas publicaciones de más reciente a más antigua, muestra una línea "Tags:" con `intro`, `meta`, `python`, `tips` enlazando a `tag-intro.html` etc., y la propia página de cada publicación enlaza de vuelta al índice.

**🩹 Si sale mal :** Si un enlace de etiqueta da 404, ese es *el comportamiento correcto*, las páginas destino aún no existen, y el Paso 5 es específicamente la generación de `tag-*.html`. Si el índice muestra las publicaciones en el orden equivocado, el `sorted(..., key=lambda d: d["date"], reverse=True)` debe ejecutarse sobre la lista recopilada *antes* de `build_index`, no después.

### 4.3 Verifica el ensamblaje

**✅ Lista de verificación**

- ✅ `site/hello.html` y `site/python-tips.html` se abren en un navegador con título, meta y cuerpo renderizado reales.
- ✅ `index.html` lista ambas publicaciones de más reciente a más antigua y apunta a archivos `.html` existentes (los enlaces de etiqueta pueden dar 404 hasta el Paso 5).
- ✅ Re-ejecutar el build después de editar una publicación produce HTML actualizado, el índice y las páginas nunca discrepan con `posts/`.

**🤔 Pregunta(s) socrática(s)**

- `build_index` recibe una *lista de dicts* en lugar de volver a leer el sistema de archivos. ¿Qué se rompe, concretamente, si en su lugar re-parseara `posts/*.md` a sí mismo? (Pista: dos fuentes de verdad y una inconsistencia de ordenamiento.)
- La página índice y la página de etiquetas dependen ambas de `posts`. Si una publicación tiene etiquetas `["a", "b"]`, el índice las une con una coma pero la página de etiquetas las *agrupa*. Nombra un lugar donde estas dos derivaciones podrían divergir, y qué regla las mantendría idénticas.

## Paso 5: Genera las páginas por etiqueta

El índice es una vista derivada; una página que "muestra solo las publicaciones con la etiqueta X" es una vista derivada *filtrada*. El bucle que escribe una página por etiqueta tiene la misma forma que toda herramienta que "genera un artefacto por elemento de una colección", una plantilla por elemento con el elemento sustituido dentro.

### 5.1 Escribe las páginas de etiquetas

```python
# sitegen.py (continued)

def build_tag_pages(posts: list[dict], out_dir: Path) -> None:
    by_tag = {}
    for p in posts:
        for t in p["tags"]:
            by_tag.setdefault(t, []).append(p)
    for tag, tagged in sorted(by_tag.items()):
        items = "\n".join(
            f'<li><a href="{p["slug"]}.html">{p["title"]}</a></li>'
            for p in tagged)
        (out_dir / f"tag-{tag}.html").write_text(
            f"""<!doctype html><html><head><meta charset="utf-8"><title>tag: {tag}</title></head>
<body><h1>Posts tagged "{tag}"</h1><ul>{items}</ul>
<p><a href="index.html">&larr; index</a></p></body></html>""",
            encoding="utf-8")

if __name__ == "__main__":
    build_tag_pages(posts, out)
    print("tag pages written:", sorted(t for t in Path("site").glob("tag-*.html")))
```

La agrupación aquí es `setdefault` de nuevo, el mismo modismo del Paso 4, ahora retenido por etiqueta en `tagged`, que es una lista de *dicts de publicación*, no de slugs, para que la plantilla tenga a mano el título y el slug. Cada página de etiqueta es un `<li>` por publicación, exactamente como el índice menos la fecha y menos toda publicación que no coincida.

**👟 Pista inicial :** Vuelve a ejecutar el build y haz clic en cada enlace de etiqueta del índice, este paso convierte cada 404 anterior en una página real.

**🎯 Resultado esperado :** `tag-intro.html`, `tag-meta.html`, `tag-python.html`, `tag-tips.html` existen bajo `site/`, cada uno listando las publicaciones coincidentes, y cada enlace de etiqueta del índice ahora se resuelve.

**🩹 Si sale mal :** Si una página de etiqueta contiene publicaciones equivocadas, la agrupación añadió `p`, el dict completo, mientras `items` se construye desde `p["slug"]`; una agrupación incorrecta significa que agrupaste por una copia obsoleta de `posts`. Si una etiqueta sin publicaciones muestra un `<ul>` vacío, construiste `by_tag` desde una lista de posts vacía, re-visa que `build_tag_pages` se ejecute *después* de que `posts` se recolecte.

### 5.2 Verifica el sitio terminado

**✅ Lista de verificación**

- ✅ Cada enlace de `index.html`, publicaciones *y* etiquetas, se resuelve a un archivo existente.
- ✅ `tag-python.html` lista `Three Python tips` y no `Hello, world`.
- ✅ `site/` contiene exactamente: `hello.html`, `python-tips.html`, un `tag-*.html` por etiqueta distinta, y `index.html`.

**🤔 Pregunta(s) socrática(s)**

- La plantilla de la página de etiquetas repite la del índice con dos diferencias. Funciona, pero ¿cuándo refactorizarías ambas en una sola `post_list_page(title, posts)` compartida? Nombra el olor concreto que dispara la refactorización.
- Escribimos `tag-{tag}.html` con una cadena de etiqueta cruda de un frontmatter no confiable. Si la etiqueta de una publicación fuera `../evil`, ¿en qué se convierte la ruta del archivo, y cuál es la sanitización mínima que añadirías antes de usar cualquier etiqueta en un nombre de archivo? (Pista: piensa en `slugify`.)

## ⚠️ Errores comunes

- **La búsqueda del segundo `---` desviada por uno.** Tanto `next(...)` como el slice `lines[end + 1:]` deben coincidir sobre cuál línea es "el" separador; un desliz de una línea adjunta silenciosamente el `---` de cierre al cuerpo, que el renderizador de Markdown luego renderiza felizmente como un `<hr>`. Arrégialo afirmando en un pequeño test que `body` nunca empieza con `---`.
- **Frontmatter sin cerrar.** Una publicación que estabas editando a medias se guarda sin su `---` de cierre; el generador entonces no puede encontrar la división y muere con un traceback críptico. Verificar que la división *existe* desde el principio, y lanzar `ValueError` con el nombre del archivo, convierte un misterio de 30 minutos en un arreglo de dos segundos.
- **Sanitizar *o* renderizar, no ambos.** Renderizar a HTML sin pasar por `bleach` deja que un `post.md` lleve `<script>` a los navegadores de tus visitantes; sanitizar sin renderizar deja el Markdown visible como texto crudo. El orden de doble seguridad (convertir, luego lista blanca) es todo el punto del Paso 3, los motores reales también lo hacen mal.
- **Dos fuentes de verdad.** Editar a mano `index.html` "solo para arreglar una cosa" mientras el generador aún lo deriva de `posts/` garantiza que tu próximo build sobrescriba silenciosamente la edición. Regla: el sitio se genera, nunca se mantiene a mano, cada artefacto debe ser reproducible solo desde la carpeta de publicaciones.
- **Cobertura de test faltante en la "canalización completa".** Cada paso pasa solo, pero una publicación cuyo frontmatter dice `date: "2026-08-04"` con un *espacio* después de la llave, o una etiqueta con mayúscula, es donde el paso de ensamblaje rompe todo el build. Un smoke test de dos líneas (build, luego afirmar que cada archivo generado existe y cada `<a href>` se resuelve) atrapa esa clase de fallo antes de que publiques.

## Lo que acabas de construir

Un generador de sitios estáticos que funciona: dos publicaciones entran, un comando, y una carpeta `site/` de HTML legible a mano, páginas, índice y listados por etiqueta, todos derivados de las publicaciones para que el build nunca pueda discrepar con la fuente. La habilidad transferible es todo el *modelo mental de generación estática*: una canalización pequeña y pura (parsear → renderizar → ensamblar) que convierte archivos de texto plano en un artefacto desplegable que puedes alojar en cualquier parte, desde una carpeta sobrante hasta un CDN, con nada ejecutándose en el momento de la solicitud. Ese modelo es lo que impulsa a Jekyll, Hugo, Gatsby y mil blogs personales, y ahora es tuyo.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/markdown-blog-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/markdown-blog-engine) en el repositorio del curso agrupa el motor, ambas publicaciones de muestra y un notebook que ejecuta cada paso en orden. Clónalo, o abre el repositorio completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), e inspecciona el `site/` generado justo en el árbol.
:::

## A dónde ir desde aquí

- Añade un feed RSS, un archivo XML que liste el título, enlace y fecha de cada publicación, regenerado en cada build; el hábito de derivar de las publicaciones hace que eso sea una adición de 15 líneas.
- Añade estimaciones de tiempo de lectura, cuenta las palabras del cuerpo, divide por ~200, redondea hacia arriba, y muestra "4 min read" en el índice; el contador es una línea, el templating es la parte divertida.
- Escribe un archivo consciente de la fecha (`archive-2026.html`) agrupado por año, la agrupación exacta de `setdefault` del Paso 5, una llave más.
- Despliega: sube `site/` a un repositorio de GitHub Pages (o a una sola rama) y deja que un host web gratuito lo sirva, todo el punto del modelo estático es que la salida se puede enviar con cero partes móviles.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso, un motor de blog que renderizó tus propias publicaciones? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README te guía para añadir el tuyo mediante una **pull request** de principio a fin: fork, rama, commit y apertura de la PR. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓