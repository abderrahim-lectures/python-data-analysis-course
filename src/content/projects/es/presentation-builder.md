---
title: "Constructor de Presentaciones"
description: "Crear presentaciones de diapositivas desde Markdown con temas, animaciones y notas del presentador."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "frontend", "file-io"]
learningObjectives:
  - "Dividir una presentación Markdown en diapositivas, separadas por líneas ---"
  - "Derivar el título de la diapositiva del primer encabezado y renderizar el cuerpo a HTML"
  - "Aplicar un tema intercambiando una sola cadena CSS en la página"
  - "Extraer las notas del presentador de las diapositivas visibles con una convención de comentarios"
  - "Ensamblar un archivo HTML completo y autocontenido que se abra en cualquier navegador"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/functions"]
---

# 📽️ Construye un Constructor de Presentaciones

Las presentaciones se editan en una herramienta y se entregan en otra, y el viaje de ida y vuelta es donde mueren las diapositivas: cambian las fuentes, se rompen los diseños, y un keynote cargado de viñetas pelea contigo por cada píxel. Un constructor de prioridad Markdown se salta todo eso — escribes las diapositivas como texto plano con `---` entre ellas, y un comando convierte eso en un archivo HTML autocontenido que se abre en cualquier sitio, en cualquier navegador, sin necesidad de ninguna app. Este proyecto construye ese constructor: analiza un mazo en Markdown, renderiza cada diapositiva, aplica un tema, extrae tus notas del presentador y envía un único `deck.html`.

Esto asume Python 101 — E/S de archivos, cadenas y funciones. Nada más allá de eso: sin framework de JavaScript, sin base de datos, sin herramienta de build. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Definir un formato de mazo — diapositivas separadas por `---`, título como primer `#`, notas en comentarios `<!-- -->`.
2. Dividir una cadena de mazo en diapositivas limpiamente, incluso cuando el cuerpo de una diapositiva contiene líneas que parecen separadores.
3. Renderizar el markdown de cada diapositiva a HTML y derivar su título.
4. Aplicar un tema intercambiando una cadena CSS, y sacar las notas del presentador fuera de la página visible.
5. Ensamblar un `deck.html` totalmente autocontenido y abrirlo en un navegador.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — la recompensa es un `deck.html` real que abres en una pestaña del navegador, y todo el bucle "edita deck.md, ejecuta el comando, refresca la pestaña" es el punto de la herramienta. Los pasos asumen una carpeta pequeña con `uv` y una biblioteca de Markdown.

**GitHub Codespaces** es la misma experiencia: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y los comandos exactos se ejecutan en una pestaña del navegador con Node, Python y `uv` preinstalados — el HTML recién construido se abre directamente en un panel de vista previa.

**Google Colab, Kaggle Notebooks y Binder ejecutan todo el pipeline de análisis-y-renderizado de verdad** — nada aquí necesita una clave o una GPU. La salvedad honesta es la última milla: el notebook imprime el HTML generado y puede volcarlo a un archivo para descargarlo, pero el *bucle de refresco de pestaña del navegador* es donde un constructor de diapositivas gana su sustento, y eso es una experiencia de archivo local. Usa el notebook para aprender la maquinaria; construye tu mazo real localmente.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/presentation-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/presentation-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpresentation-builder%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de que se renderice la primera diapositiva: `uv`, la biblioteca `markdown` y un mazo inicial de dos diapositivas.

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
mkdir presentation-builder && cd presentation-builder
uv init --bare
uv add markdown
```

### Escribe un mazo inicial

Pega esto en `deck.md`:

```markdown
# Why short talks beat long decks

Short talks respect attention. The audience recovers mid-talk,
and you are forced to say the one thing you actually know.

<!-- Note: open with the "two-minute" icebreaker, then start the timer. -->

---

## The three-slide rule

1. One problem.
2. One change.
3. One next step.

Slides are a scaffold, not the talk. <!-- Note: the scaffold line lands best after a pause. -->
```

```bash
uv run python -c "import markdown; print('markdown ready')"
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `markdown` instalado vía `uv add markdown`.
- ✅ `deck.md` existe: 2 diapositivas separadas por una línea que contiene solo `---`, cada una con un encabezado, y dos comentarios HTML ocultos que servirán como notas.

## Paso 1: Divide un mazo en diapositivas

Un mazo es un archivo con `---` como separador de diapositivas. Todo el pipeline vive o muere por una división correcta, y las dos cosas que la gente hace mal están ambas aquí: una línea `---` *dentro* de un bloque de código con fence no debe partir el mazo, y las líneas en blanco anteriores/posteriores no deben convertirse en diapositivas fantasma.

### 1.1 Escribe el divisor de diapositivas

```python
# slides.py
from pathlib import Path

SEPARATOR = "---"

def split_deck(text: str) -> list[str]:
    slides, current, in_fence = [], [], False
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_fence = not in_fence
            current.append(line)
        elif line.strip() == SEPARATOR and not in_fence:
            slides.append("\n".join(current))
            current = []
        else:
            current.append(line)
    if current:
        slides.append("\n".join(current))
    return [s.strip() for s in slides]

if __name__ == "__main__":
    deck = Path("deck.md").read_text(encoding="utf-8")
    slides = split_deck(deck)
    print(f"{len(slides)} slides")
    for i, s in enumerate(slides, 1):
        print(f"  slide {i} starts: {s.splitlines()[0]!r}")
```

El indicador de fence es la pieza que separa un constructor real de un hack de quince segundos: las líneas ```` ``` ```` alternan `in_fence`, y `---` solo termina una diapositiva mientras está *fuera* de un bloque de código — así que una diapositiva que te muestra un `---` literal en código de ejemplo con fence sigue siendo una diapositiva. El `[s.strip() for s in slides]` final elimina silenciosamente el anillo en blanco alrededor de cada diapositiva sin tocar su diseño interior.

**👟 Pista inicial :** Ejecuta el divisor y cuenta — dos diapositivas para nuestro mazo. Luego envuelve temporalmente un `---` dentro de un bloque con fence en la diapositiva dos y vuelve a ejecutar: el conteo debe seguir siendo 2, y ese experimento es toda la lección de este paso.

**🎯 Resultado esperado :** `2 slides`, con `slide 1 starts: '# Why short talks beat long decks'` y `slide 2 starts: '## The three-slide rule'`.

**🩹 Si sale mal :** Si informa 3+ diapositivas, un `---` dentro de un fence partió el mazo — comprueba que la alternancia del fence está condicionada a `startswith("```")`, no `== "```"` (los espacios finales rompen la coincidencia estricta). Si falta la última diapositiva, se fue el `if current:` de agregado final — un mazo que termina justo en un `---` tiene una diapositiva final vacía que el `if` descarta correctamente, y debe ejecutarse *después* del bucle.

### 1.2 Verifica la división

**✅ Lista de verificación**

- ✅ `split_deck` devuelve exactamente `2` diapositivas para `deck.md`, cada una comenzando con su línea de encabezado.
- ✅ Añadir un bloque con fence que contenga `---` a una diapositiva no la parte; borrar el fence sí la parte.
- ✅ Las líneas en blanco iniciales/finales alrededor de una diapositiva se eliminan sin quitar las líneas en blanco interiores.
- ✅ Un mazo que termina en `---` descarta la diapositiva vacía final en lugar de producir una que no renderiza nada.

**🤔 Pregunta(s) socrática(s)**

- El separador es una línea cuyo contenido *recortado* es igual a `---`. Escribe la línea más pequeña que lo dispararía falsamente (`-- -`? `--- `? ¿espacio final?) y dime si el `strip()` la protege o la habilita — luego decide si la estrictez es lo que quieres.
- Tres guiones dentro de un fence son datos (estás mostrando un separador), fuera son control. ¿Cuál es un caso de *contenido* donde genuinamente querrías que un `---` sin fence dentro de una diapositiva *no* la partiera — y eso aboga por exigir un marcador `<!-- slide →` explícito? Nombra el intercambio.

## Paso 2: Renderiza una diapositiva y toma su título

Cada diapositiva es markdown destinado a HTML, y cada una necesita un título para los puntos de navegación del presentador y el `h1`. La regla es simple y vale la pena hacerla explícita: la *primera* línea de encabezado en la diapositiva es el título, cualquiera que sea su nivel (`#` o `##`), y el cuerpo es todo lo demás — renderizado con la misma biblioteca `markdown`, sin duplicar el encabezado del título en el cuerpo.

### 2.1 Renderiza el cuerpo y deriva el título

```python
# render.py
import re
import markdown as md

def render_slide(slide: str) -> dict:
    lines = slide.splitlines()
    title = "Untitled slide"
    body_lines = []
    for i, line in enumerate(lines):
        m = re.match(r"^(#{1,6})\s+(.+)", line)
        if m and not body_lines:
            title = m.group(2)
        else:
            body_lines.append(line)
    body_html = md.markdown("\n".join(body_lines), extensions=["fenced_code"])
    return {"title": title, "body_html": body_html}

if __name__ == "__main__":
    slide = "## Two words\n\nEverything else on the slide."
    print(render_slide(slide))
```

La protección `if m and not body_lines` es toda la regla "gana el primer encabezado" comprimida: el *primer* encabezado se convierte en el título, y una vez que se ha recogido cualquier texto que no sea encabezado, los encabezados posteriores son contenido ordinario. La regex es deliberadamente más laxa de lo necesario — `#{1,6}` coincide con niveles de encabezado 1–6 — pero la cláusula `not body_lines` significa que solo importa el primero aquí, y el cuerpo renderizado conserva los encabezados restantes como contenido donde corresponde.

**👟 Pista inicial :** Renderiza la diapositiva 1 del mazo y mira las dos claves — título `Why short talks beat long decks` (nota: el `#` se ha ido), HTML del cuerpo con `<p>` y el comentario de nota todavía lejos.

**🎯 Resultado esperado :** Para la diapositiva 1 del mazo: `{'title': 'Why short talks beat long decks', 'body_html': '<p>Short talks respect attention...</p>'}` — cualquier encabezado `##` en otras diapositivas permanece en el cuerpo como `<h2>`.

**🩹 Si sale mal :** Si `title` es `Untitled slide`, la regex no coincidió — comprueba un encabezado como `#Title` (sin espacio, falla `\s+`) o un carácter con acento en la línea del encabezado; el texto del encabezado debe capturarse con `(.+)` tal cual. Si el encabezado del título *también* aparece en el cuerpo, la protección `not body_lines` no lo está deteniendo — relee la lógica `if/else`: debe tomar la rama del encabezado solo cuando aún no se ha recogido nada.

### 2.2 Verifica el renderizado

**✅ Lista de verificación**

- ✅ El primer encabezado de cada diapositiva se convierte en `title`, con sus marcadores `#` eliminados.
- ✅ Los encabezados no-primeros se renderizan en el cuerpo como `<h2>`/`<h3>`, no como títulos.
- ✅ Los bloques de código con fence sobreviven a través de `fenced_code` y aparecen como `<pre><code>`.
- ✅ Una diapositiva sin encabezado en absoluto cae a `Untitled slide` sin bloquearse.

**🤔 Pregunta(s) socrática(s)**

- Nuestra regla "gana el primer encabezado" ignora el *nivel*: `## Two words` y `# Two Words` ambos titulan la diapositiva. ¿Importa que un `##` pueda convertirse en título de diapositiva mientras que `#` normalmente implica el título del mazo — y qué regla distinguiría inequívocamente "título del mazo" de "título de diapositiva"?
- El título se deriva del contenido, así que el texto de una diapositiva determina su etiqueta de navegación. ¿Qué pasa si dos diapositivas empiezan con el mismo encabezado — y es un problema cosmético o un problema de *corrección* para los puntos de la presentación?

## Paso 3: Aplica un tema al mazo

Un mazo es contenido más un aspecto. El aspecto aquí es una cadena CSS interpolada en la cabecera de la página — así que "temar" es tan simple como intercambiar la cadena — y la *interfaz* que hace seguro ese intercambio es un pequeño dict de temas nombrados entre los que puede elegir una bandera `--theme`.

### 3.1 Define temas y un renderizador

```python
# theme.py
THEMES = {
    "light": ("#f7f7f5", "#222", "Georgia, serif", "Helvetica, Arial, sans-serif"),
    "ink": ("#14161a", "#e8e6e3", "Georgia, serif", "Helvetica, Arial, sans-serif"),
    "paper": ("#fdf6e3", "#073642", "Comic Sans MS, monospace", "monospace"),
}

def css_for(theme: str) -> str:
    bg, fg, heading_font, body_font = THEMES[theme]
    return f"""
    <style>
      body {{ margin: 0; background: {bg}; color: {fg};
             font-family: {body_font}; }}
      section {{ min-height: 90vh; padding: 2.5em;
                 border-bottom: 1px solid {fg}; }}
      h1, h2, h3 {{ font-family: {heading_font}; }}
      code {{ background: {fg}22; padding: 0 0.3em; }}
    </style>"""

if __name__ == "__main__":
    for name in THEMES:
        print(name, "->", css_for(name)[:40], "...")
```

El tema es datos — cuatro valores por entrada, desempaquetados en un `f-string` de CSS — así que añadir un tema es *añadir una tupla*, no editar markup. Dos detalles de CSS cargan con la sensación: `min-height: 90vh` hace que cada diapositiva sea un bloque a pantalla completa (la disciplina de "una idea por pantalla"), y los `{{`/`}}` duplicados en el f-string son llaves literales, que todo aspirante a Python olvida una vez — donde un `{}` sin emparejar levanta `KeyError` sobre la cadena.

**👟 Pista inicial :** Llama a `css_for("light")` y lee el CSS como una persona que nunca ha visto CSS — cada diapositiva es un bloque de altura completa, los encabezados reciben la serif, el código recibe el chip translúcido. Luego llama a `css_for("nope")` y mira el `KeyError` probar que el dict es la única vía de entrada.

**🎯 Resultado esperado :** Tres líneas (`light ->`, `ink ->`, `paper ->`), cada una imprimiendo una cadena CSS recortada; `css_for("ink")` contiene la sustitución de fondo `#14161a`.

**🩹 Si sale mal :** Si aparece `KeyError: 'nope'`, eso es *correcto* — el dict de temas es una lista de permitidos. Si el CSS tiene `{` literal en la salida, entrecomillaste una vez un literal de f-string — cada `{`/`}` estructural debe duplicarse (`{{ background: ... }}`). Si los colores no se renderizan en el navegador, el hex estilo `8px` como `{fg}22` usa un hex de 8 dígitos que *los navegadores antiguos ignoran* — o usa 6 dígitos o mantén un div de superposición translúcido.

### 3.2 Verifica el temado

**✅ Lista de verificación**

- ✅ `css_for` devuelve texto de estilo válido para los tres temas, cada uno con el fondo y el primer plano propios del tema.
- ✅ Los nombres de tema desconocidos lanzan `KeyError` — el dict es el conjunto permitido completo.
- ✅ Las llaves estructurales del f-string se renderizan como `{...}` reales en la salida, no errores de Python ni `{` literales.
- ✅ `min-height: 90vh` aparece en cada tema — cada diapositiva es un bloque del tamaño de la ventana.

**🤔 Pregunta(s) socrática(s)**

- Los temas son tuplas codificadas. ¿Qué cambiaría una bandera `--theme-file custom.css` sobre quién puede temar un mazo — y cuál es el ángulo de seguridad de que el texto de `your.css` se inyecte en `deck.html` tal cual (pista: `expression()` de CSS está mayormente muerto, pero el *principio* de interpolación-desde-entrada-no-confiable está vivo)?
- Ponemos la cadena del *tema* en el `<style>` del documento. Si el mazo de un compañero necesita una fuente cargada desde un CDN (`<link rel="stylesheet" href="...">`), ¿lo acomoda `css_for` hoy, o necesita un segundo mecanismo? ¿Vale la pena arreglarlo antes del mazo o después de la solicitud de función?

## Paso 4: Saca las notas del presentador fuera de las diapositivas

La audiencia ve diapositivas; el presentador ve notas. Nuestra convención de notas es un comentario HTML — `<!-- Note: ... -->` — escondido en cualquier parte del código fuente de la diapositiva, y "sacar" significa: detectar los comentarios durante el renderizado, recogerlos en un campo `notes` y eliminarlos del HTML del cuerpo visible para que la audiencia nunca vea texto `<!-- ... -->`.

### 4.1 Extrae y elimina comentarios

```python
# notes.py
import re
from render import render_slide

COMMENT = re.compile(r"<!--\s*(.*?)\s*-->", re.DOTALL)

def extract_notes(slide: str) -> tuple[str, list[str]]:
    cleaned, notes = [], []
    for line in slide.splitlines():
        for match in COMMENT.finditer(line):
            notes.append(match.group(1))
        partial, n = COMMENT.subn("", line)
        cleaned.append(partial if not n else "")
    return "\n".join(cleaned), notes

if __name__ == "__main__":
    slide = "Visible line. <!-- Note: say this slowly -->"
    body, notes = extract_notes(slide)
    print("body:", repr(body))
    print("notes:", notes)
```

La regex `<!--\s*(.*?)\s*-->` encuentra el comentario con el `.*?` perezoso (se detiene en el *primer* `-->` de cierre), y el barrido `finditer` recoge cada nota mientras `subn` elimina cada comentario en el mismo pase. La línea ligeramente rara `partial if not n else ""` importa: una línea que era *enteramente* un comentario debe desaparecer por completo (convirtiéndose en una cadena vacía), mientras que una línea con un comentario incrustado conserva su texto visible limpiamente eliminado.

**👟 Pista inicial :** Ejecútalo sobre la diapositiva 1 del mazo — la línea `<!-- Note: open with... -->` debería producir exactamente una nota y una cadena vacía en su lugar, dejando `<p>Short talks...` limpio.

**🎯 Resultado esperado :** `body:` imprime una línea con `<!-- ... -->` eliminado y `Visible line.` intacto, y `notes:` imprime `['say this slowly']`.

**🩹 Si sale mal :** Si el comentario sobrevive en el cuerpo, la regex no coincidió con nada — comprueba que usaste `re.DOTALL` (si no, un comentario *multilínea* que abarca dos líneas nunca coincide en un pase por línea). Si una nota se captura dos veces, `finditer` + `subn` está contando el mismo comentario dos veces — deberían ejecutarse sobre la misma cadena una vez cada uno; una nota duplicada significa que el bucle de búsqueda corrió dos veces.

### 4.2 Verifica la extracción de notas

**✅ Lista de verificación**

- ✅ Un comentario de una línea se convierte en una nota y desaparece del cuerpo visible.
- ✅ Un comentario multilínea (`<!--\nnote\nmore note\n-->`) se convierte en una sola nota de varias partes, eliminada por completo.
- ✅ El texto antes y después de un comentario en línea en la misma línea sobrevive ambos, con solo el comentario eliminado.
- ✅ Un mazo sin comentarios en ningún sitio todavía se renderiza — `notes` es una lista vacía, el cuerpo no cambia.

**🤔 Pregunta(s) socrática(s)**

- Elegimos `comentarios HTML` como portador de notas. ¿Qué *garantiza* esa elección sobre las notas (son invisibles en un navegador hasta que ves el código fuente) y qué *pierde* (notas estructuradas como una señal-a-diapositiva)? ¿Hay un marcador nativo de markdown (`::notes::`) que sobreviviera al renderizado *y* fuera buscable — y qué romperías al añadirlo?
- Las notas se capturan con avidez (`.*?` se detiene en el primer `-->`). Escribe el comentario que hace que la coincidencia perezosa produzca una nota *parcial* — ¿es legítimo `-->` dentro de una nota alguna vez, y debería la convención prohibirlo?

## Paso 5: Ensambla y envía el mazo

Todo existe como piezas; el Paso 5 es el acto de hacer un archivo que se abre en un navegador. La plantilla de página completa interpola título, CSS del tema y diapositivas renderizadas — incluyendo un bloque de notas del presentador que la audiencia no puede ver — y escribe un único `deck.html` autocontenido.

### 5.1 Compón la página completa

```python
# build.py
from pathlib import Path
from slides import split_deck
from render import render_slide
from notes import extract_notes
from theme import css_for

PAGE = """<!doctype html><html><head><meta charset="utf-8">
<title>{deck_title}</title>{css}</head><body>{slides}{notes}</body></html>"""

def build(deck_path: str, theme: str = "light") -> str:
    slides = [render_slide(s) for s in split_deck(Path(deck_path).read_text())]
    rendered = []
    raw_notes = []
    for s in slides:
        body, notes = extract_notes(s["body_html"] if False else "")
        # simpler path: render content, then lift notes from the raw slide text
        rendered.append(f'<section><h1>{s["title"]}</h1>{s["body_html"]}</section>')
    return PAGE.format(
        deck_title="My deck",
        css=css_for(theme),
        slides="\n".join(rendered),
        notes="",
    )

if __name__ == "__main__":
    Path("deck.html").write_text(build("deck.md", "ink"), encoding="utf-8")
    print("wrote deck.html")
```

Aquí está el momento honesto de este ensamblaje: las notas no se pueden sacar de `body_html` — ya se eliminaron durante el renderizado, así que el pipeline correcto las saca del *texto de la diapositiva cruda* en su lugar. Por tanto, el paso `render_slide` debería recibir la diapositiva ya limpia de notas. Esa corrección de diseño es el punto pedagógico del paso: cuando compones herramientas reales, el *orden* de las transformaciones lo deciden las dependencias de datos, no el orden en que las imaginaste primero — y una rama muerta dejada como comentario es el residuo honesto de esa corrección.

```python
# build.py — the corrected pipeline
def build(deck_path: str, theme: str = "light", deck_title: str = "My deck") -> str:
    slides = []
    all_notes = []
    for raw in split_deck(Path(deck_path).read_text()):
        clean, notes = extract_notes(raw)
        s = render_slide(clean)
        slides.append(f'<section><h1>{s["title"]}</h1>{s["body_html"]}</section>')
        all_notes.extend(notes)
    notes_html = "\n".join(f"<p hidden>Note: {n}</p>" for n in all_notes)
    return PAGE.format(deck_title=deck_title, css=css_for(theme),
                       slides="\n".join(slides), notes=notes_html)

if __name__ == "__main__":
    Path("deck.html").write_text(build("deck.md", "ink"), encoding="utf-8")
    print("wrote deck.html")
```

El bucle corregido es el único pipeline verdadero: extraer → limpiar → renderizar → envolver. Cada diapositiva se convierte en un `<section>` que contiene un `<h1>` (el título) más su cuerpo, y las notas extraídas aterrizan en elementos `<p hidden>` al final de la página — presentes en el código fuente para el presentador, `display:none` para la audiencia. La llamada `PAGE.format(...)` nombra cada ranura, y las funciones de propósito único estilo Flask mantienen cada transformación separada y comprobable.

**👟 Pista inicial :** Construye el mazo con tema ink, abre `deck.html` en un navegador y desplázate — dos diapositivas a altura completa, el título `Why short talks` arriba de la primera, fondo oscuro, y las notas `<p hidden>` visibles solo si ves el Código fuente.

**🎯 Resultado esperado :** `wrote deck.html`; el archivo se abre como una página de dos diapositivas — fondo oscuro (`ink`), encabezados serif, cuerpos estilo `Visible line.`, chips de código en cualquier diapositiva de código y un bloque de notas oculto al final.

**🩹 Si sale mal :** Si las notas aparecen *visibles* en la página, no se está emitiendo `hidden` para el contenedor de notas — `<p hidden>` se renderiza como display:none en todos los navegadores modernos; mira la cadena literal en la unión de notas. Si el encabezado de una diapositiva aparece dos veces (una vez en `h1`, una vez en el cuerpo), `render_slide` recibió la diapositiva sin limpiar y la duplicación del encabezado en el cuerpo nunca se eliminó — asegúrate de que `extract_notes` corrió *antes* de `render_slide`, como en el bucle corregido.

### 5.2 Verifica el mazo enviado

**✅ Lista de verificación**

- ✅ `deck.html` se abre en un navegador como exactamente dos diapositivas con secciones a altura completa y un `<h1>` cada una.
- ✅ El tema `ink` se aplica visiblemente (fondo oscuro, texto claro) — el intercambio `--theme` es un solo argumento.
- ✅ Las notas aparecen en el Código fuente bajo `<p hidden>` y en ningún lugar de la página visible.
- ✅ Reconstruir después de editar `deck.md` produce un archivo actualizado — la salida se deriva, nunca se mantiene a mano.

**🤔 Pregunta(s) socrática(s)**

- El pipeline corregido ejecuta `extract_notes` antes de `render_slide`. Cronometra el modo de fallo del orden *incorrecto* concretamente: ¿en qué se convertiría una nota como `Note: underline the word "trust"` si sobreviviera al markdown (pista: `**trust**`), y por qué proteger el paso de renderizado eliminar primero?
- Los títulos de diapositiva vienen del contenido, y las notas se recogen planas — sin asociación con la diapositiva de la que vinieron. ¿Cuál es el cambio (un dict de `slide_index -> notes`, o un atributo `data-slide` en cada `<p hidden>`) que hace las notas *utilizables* por una herramienta de script del presentador, y preferirías tenerlo ahora o después de tu primer mazo de 20 diapositivas?

## ⚠️ Errores comunes

- **División ciega al fence.** Un `---` dentro de un bloque ```` ``` ```` con fence son datos (una diapositiva que muestra literalmente un separador), pero un divisor ingenuo lo convierte en dos diapositivas y cuenta doble el mazo silenciosamente. La alternancia `in_fence` debe vivir en el bucle del divisor, condicionada a `startswith("```")` para que los fences con espacios finales aún se cierren.
- **Comentarios que sobreviven al HTML visible.** Un `<!-- Note: ... -->` que escapa del paso de eliminación se renderiza como un comentario gris *visible* en las diapositivas — exactamente la nota que la audiencia nunca debe ver. Extrae con el patrón de dos pases (`finditer` para la recogida, `subn` para la eliminación) y prueba que una línea que es *solo* un comentario se vuelve vacía, no en blanco-pero-materializada.
- **Entrecomillar una vez un f-string.** `css_for` escribe CSS, y el CSS está lleno de llaves literales; `{ background: ... }` entrecomillado una vez lanza `KeyError` o peor, interpola. Duplicar cada llave estructural (`{{ }}`) es la única forma — o construye el CSS con concatenación de cadenas y esquiva toda la clase de bug.
- **Renderizar notas al markdown.** Si `extract_notes` corre *después* de `render_slide`, el texto de nota como `the word **trust**` alimenta al renderizador de markdown y se vuelve texto en negrita visible. El orden por dependencia de datos — eliminar comentarios primero, renderizar segundo — es una restricción real, no estilo de casa.
- **Interpolar contenido no confiable en HTML.** El texto de diapositiva se convierte en inner HTML de `<section>` vía f-string. El contenido de diapositiva es tuyo por ahora, pero el momento en que las notas o los títulos vengan de un archivo no confiable, la interpolación cruda es un inicio de XSS. La línea honesta: mantén los `decks` bajo tu propio control o añade un pase de escape, y nunca "mejores" metiendo una nueva fuente sin actualizar esa decisión.

## Lo que acabas de construir

Un constructor de presentaciones funcional: `deck.md` dentro, un solo `deck.html` autocontenido fuera — diapositivas divididas limpiamente incluso pasando separadores con fence, títulos derivados de los primeros encabezados, un tema que puedes intercambiar con un argumento, y notas del presentador ocultas de la audiencia pero presentes en el código fuente. La habilidad transferible es el instinto de *pipeline declarativo*: contenido como datos en texto plano, renderizado como transformaciones ordenadas y tema como configuración — la forma exacta detrás de toda herramienta de "escribe una vez, envía a muchos", desde generadores de sitios estáticos hasta frameworks de diapositivas y motores de informes. Tu próxima charla ya es un archivo `.md` que se renderiza a sí mismo.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/presentation-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/presentation-builder) en el repositorio del curso agrupa los módulos de divisor, renderizador, tema, notas y build más el mazo inicial y un notebook que ejecuta cada paso en orden. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y construye el mazo de muestra en una pestaña del navegador.
:::

## A dónde ir desde aquí

- **Una bandera CLI `--theme`** construida sobre `argparse` — el temado ya existe como `css_for`, así que la bandera son 4 líneas, y es la diferencia entre "editar el script" y "una herramienta real".
- **Puntos de progreso:** emite enlaces `<a href="#slide-2">` en una barra de pie — los presentadores obtienen navegación clicable, todavía cero JavaScript si te apoyas en anclas.
- **Vista del presentador:** un segundo `<section hidden>` al final que empareja las notas de cada diapositiva con un reloj en vivo, para que la presentación en curso conserve su guion a un scroll de distancia.
- **Un atajo `--pdf`:** después de escribir `deck.html`, invoca la impresión headless de tu SO (`chromium --headless --print-to-pdf`) desde Python — el pipeline sigue siendo un archivo, y los impresos aparecen sin una app.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso — un mazo que realmente presentaste desde HTML, un tema por el que tus compañeros preguntaron? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README recorre cómo agregar el tuyo vía un **pull request** de principio a fin: fork, rama, commit y abrir el PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
