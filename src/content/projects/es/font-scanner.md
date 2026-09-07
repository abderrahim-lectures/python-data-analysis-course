---
title: "Herramienta de Emparejamiento de Fuentes"
description: "Encuentra emparejamientos de fuentes complementarias con vista previa y alternativas seguras para web."
difficulty: "beginner"
estimatedMinutes: 40
tags: ["fonts", "design-tools", "google-fonts", "pillow"]
learningObjectives:
  - "Escanear fuentes del sistema y extraer metadatos con Pillow"
  - "Clasificar fuentes por categoría tipográfica usando reglas heurísticas"
  - "Puntuar y clasificar emparejamientos de fuentes según contraste y equilibrio de peso"
  - "Renderizar imágenes de vista previa que muestran texto de encabezado y cuerpo"
  - "Generar cadenas de respaldo CSS font-family con genéricos seguros para web"
prerequisites:
  - "Fundamentos de Python"
  - "Conceptos básicos de Pillow"
---

# 🛠️ 🔤 Herramienta de Emparejamiento de Fuentes

La tipografía es la decisión de diseño más visible en cualquier página web, y emparejar bien dos fuentes — una para encabezados, otra para el texto del cuerpo — es una habilidad respaldada por un pequeño número de reglas concretas: contraste en categoría (serif vs. sans-serif) y contraste en peso (encabezado en negrita, cuerpo regular). Este proyecto construye una herramienta que aplica esas reglas mecánicamente: escanea los archivos de fuentes realmente instalados en tu sistema, clasifica cada una, puntúa cada par posible, clasifica los mejores, renderiza una imagen de vista previa mostrando el emparejamiento y exporta una pila `font-family` CSS lista para producción con respaldos multiplataforma.

Esto asume Python 101 y familiaridad básica con PIL/Pillow — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Escanear archivos de fuentes reales de tu sistema con Pillow y extraer nombre de familia, peso y estilo.
2. Clasificar cada fuente como serif, sans-serif, monospace o display.
3. Puntuar cada par de fuentes por contraste de categoría y equilibrio de peso, y clasificar los mejores.
4. Renderizar una imagen de vista previa de encabezado/cuerpo de un emparejamiento para confirmar el resultado visualmente.
5. Generar pilas CSS `font-family` con respaldos genéricos seguros para web.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado — el paso de escaneo lee los archivos de fuentes de los directorios de tu sistema (`/usr/share/fonts`, `~/.fonts`, `/System/Library/Fonts`), y los resultados dependen de lo que tengas instalado.

**GitHub Codespaces** funciona bien: abre [el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course). Las imágenes de contenedor basadas en Debian traen un puñado de fuentes DejaVu y Liberation — menos que un escritorio típico, pero suficientes para ejercitar cada paso.

**Google Colab y Kaggle Notebooks** son una forma genuina de ejecutar esto — un notebook tiene un pequeño conjunto de fuentes incluidas en su imagen Linux. La salvedad honesta es que el escaneo de fuentes devolverá menos resultados que un escritorio con un DE completo instalado, lo cual en realidad es *útil*: te deja ver cómo se comporta la herramienta cuando las fuentes son escasas, y el paso de vista previa/renderización sigue funcionando con lo que haya disponible. El notebook de abajo usa las fuentes del propio sistema del notebook, así que cada pieza de la herramienta corre sobre archivos reales. Úsalo para ver el pipeline funcionar de principio a fin; cambia a `uv` local o a un Codespace cuando quieras un escaneo más rico.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/font-scanner/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/font-scanner/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffont-scanner%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas es un paquete de PyPI — sin claves de API, sin servicios externos.

### Instala `uv`

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

### Configura el proyecto

```bash
uv init font-scanner
cd font-scanner
uv add Pillow
```

`Pillow` es el único paquete que necesitas — lee archivos TrueType y OpenType, renderiza texto en imágenes y carga fuentes por defecto para etiquetar. Todo lo demás viene de `pathlib` y `colorsys` de Python.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `font-scanner/` existe con un `pyproject.toml`, y `Pillow` está instalado.

## Paso 1: Escanea las fuentes de tu sistema

Una fuente es solo un archivo — `.ttf` o `.otf` — ubicado en un directorio conocido. `ImageFont.truetype(path)` de Pillow lo carga con éxito o lanza un error, lo que te da un filtro natural: todo archivo que se carga sin errores es una fuente que tu sistema puede renderizar de verdad. El escaneo recorre los directorios comunes, lee una muestra a 20px (suficiente para verificar que es real) y construye una lista de dicts con ruta, nombre de familia, peso y estilo.

### 1.1 Construye el escáner de fuentes

**👟 Pista inicial :** Recorre `~/.fonts`, `/usr/share/fonts`, `/System/Library/Fonts` (macOS) y `C:/Windows/Fonts` (Windows); para cada archivo `.ttf`/`.otf`, intenta `ImageFont.truetype` y atrapa `OSError` para los archivos rotos o ilegibles.

```python
# font_scanner.py
from pathlib import Path
from PIL import ImageFont

def scan_system_fonts(limit: int = 60) -> list[dict]:
    """Find loadable fonts in common system directories."""
    font_dirs = [
        Path.home() / ".fonts",
        Path("/usr/share/fonts"),
        Path("/System/Library/Fonts"),
        Path("C:/Windows/Fonts"),
    ]
    fonts = []
    for font_dir in font_dirs:
        if not font_dir.exists():
            continue
        for ext in ("*.ttf", "*.otf", "*.ttc"):
            for font_path in font_dir.rglob(ext):
                try:
                    _font = ImageFont.truetype(str(font_path), size=20)
                except OSError:
                    continue
                family = font_path.stem.replace("-", " ").replace("_", " ").title()
                fonts.append({
                    "path": str(font_path),
                    "family": family,
                    "weight": "bold" if any(w in family.lower() for w in ("bold", "black", "heavy")) else "regular",
                    "style": "italic" if "italic" in family.lower() else "normal",
                })
                if len(fonts) >= limit:
                    return fonts
    return fonts

fonts = scan_system_fonts()
print(f"Found {len(fonts)} fonts")
for f in fonts[:5]:
    print(f"  {f['family']} — {f['weight']}, {f['style']}")
```

El tope `limit=60` es una salvaguarda práctica: algunos sistemas tienen miles de archivos de fuentes (especialmente macOS), y cargar cada uno solo para clasificar los 10 mejores pares es lento e innecesario. La extracción del nombre de familia — reemplazar guiones y guiones bajos con espacios y luego poner cada palabra en mayúscula inicial — es una heurística que funciona bien para nombres de fuente estándar (DejaVu Sans, Liberation Serif), pero no para todos; es lo bastante buena para la clasificación, que es el siguiente paso. El `except OSError` atrapa los archivos que Pillow no puede analizar (archivos corruptos, formatos de fuente que Pillow no soporta) sin bloquear todo el escaneo.

**🎯 Resultado esperado :** Imprime `Found N fonts` donde N está entre 5 (contenedor escaso) y 60 (con tope), seguido de las primeras cinco familias de fuentes con su peso y estilo inferidos.

**🩹 Si sale mal :** Si obtienes `Found 0 fonts` en un sistema que con seguridad tiene fuentes instaladas, los directorios de fuentes no son estándar — agrega la ruta real de fuentes de tu sistema a `font_dirs`. Si el escaneo es muy lento, el `limit` es demasiado alto o un directorio es enorme — redúcelo a 30 y mira qué directorios contribuyen más. Si `ImageFont.truetype` lanza `OSError` en cada archivo, tu instalación de Pillow puede estar incompleta — ejecuta `uv add Pillow` de nuevo para reconstruirla.

### 1.2 Verifica el escaneo

**✅ Lista de verificación**

- ✅ `fonts` es una lista de dicts, cada uno con las claves `path`, `family`, `weight` y `style`.
- ✅ Puedes explicar por qué `limit=60` es un tope razonable — ¿qué pasa si lo quitas en una Mac con más de 5.000 fuentes del sistema?

**🤔 Pregunta(s) socrática(s)**

- El nombre de familia se deriva del nombre del archivo (`font_path.stem`), no de los metadatos internos de la fuente. ¿Qué tipo de discrepancia introduciría eso, y qué API de Pillow te daría el nombre de familia *real* codificado dentro del archivo?
- Los archivos `.ttc` (TrueType Collections) contienen varias fuentes en un solo archivo. ¿Cómo los maneja `ImageFont.truetype`, y cuál es el riesgo si la primera fuente de un `.ttc` no es la que usarías?

## Paso 2: Clasifica las fuentes por categoría

Las fuentes caen en cuatro familias amplias — serif, sans-serif, monospace y display — y un buen emparejamiento siempre contrasta dos familias distintas. Este clasificador usa el nombre de la fuente (tal como se extrajo en el Paso 1) como una heurística rápida: la palabra "Mono" en el nombre casi siempre significa monospace, "Serif" significa serif, y así sucesivamente. No es perfecto, pero es correcto las suficientes veces como para producir clasificaciones útiles.

### 2.1 Escribe `classify_font`

**👟 Pista inicial :** Revisa el nombre de familia en minúsculas para detectar palabras clave en un orden específico — monospace primero (es el más distintivo), luego serif, luego display, con sans-serif como el predeterminado de captura.

```python
# font_scanner.py (continued)
def classify_font(font_info: dict) -> str:
    """Classify a font as sans-serif, serif, monospace, or display based on its family name."""
    name = font_info["family"].lower()
    if any(kw in name for kw in ("mono", "code", "courier", "console")):
        return "monospace"
    if any(kw in name for kw in ("serif", "times", "georgia", "bodoni")):
        return "serif"
    if any(kw in name for kw in ("display", "script", "decorative")):
        return "display"
    return "sans-serif"

for f in fonts[:5]:
    print(f"  {f['family']:>30s} -> {classify_font(f)}")
```

Las listas de palabras clave son deliberadamente pequeñas y conservadoras: "Times" atrapa a Times New Roman y Times; "Georgia" atrapa a la serif más común y segura para web. Ampliar demasiado la lista arriesga falsos positivos — una fuente llamada "Playfair Display" es atrapada correctamente por "display", pero una fuente llamada "Open Sans" *no* debería coincidir con "serif" solo porque la cadena contiene la palabra por casualidad. El paso por defecto a `sans-serif` es correcto porque sans-serif es el valor predeterminado más común en los sistemas modernos — la mayoría de las fuentes del sistema que no son obviamente otra cosa son sans-serif.

**🎯 Resultado esperado :** Una línea por fuente mostrando su nombre de familia y la categoría asignada — p. ej., `DejaVu Sans -> sans-serif`, `Liberation Serif -> serif`, `DejaVu Sans Mono -> monospace`.

**🩹 Si sale mal :** Si una fuente que sabes que es serif se clasifica como sans-serif, su nombre no contiene ninguna de las palabras clave heurísticas — agrega el nombre de la fuente a la lista, o acepta que la clasificación basada en nombres tiene límites (anotado en los errores comunes). Si una fuente sans-serif se clasifica mal como serif, revisa las coincidencias accidentales de substrings (el operador `in` distingue mayúsculas aquí, pero el nombre se pasa a minúsculas primero).

### 2.2 Verifica la clasificación

**✅ Lista de verificación**

- ✅ Cada fuente en `fonts` tiene una `category` que es una de las cuatro cadenas esperadas.
- ✅ Al menos una fuente del escaneo se clasifica como `sans-serif` — el predeterminado más común.

**🤔 Pregunta(s) socrática(s)**

- Una fuente llamada "Source Code Pro" — ¿qué devuelve el clasificador, y es correcto? ¿Y "Source Sans Pro"?
- ¿Cuál es la limitación fundamental de la clasificación basada en nombres, y qué necesitaría hacer en su lugar un clasificador *preciso*? (Pista: tendría que leer algo dentro del propio archivo de la fuente.)

## Paso 3: Puntúa y clasifica emparejamientos

Las dos reglas tipográficas centrales para emparejar son: (1) las dos fuentes deben pertenecer a categorías *diferentes* (contraste en forma), y (2) una debe estar en negrita mientras la otra es regular (contraste en peso). Este paso aplica esas reglas mecánicamente: puntúa cada par, clasifica por total y saca a la superficie las mejores coincidencias.

### 3.1 Escribe `score_pairing` y encuentra los mejores pares

**👟 Pista inicial :** Puntúa el contraste de categoría con 10 (diferente) vs. 3 (igual), y el equilibrio de peso con 8 (una en negrita + una regular) vs. 4 (ambas con el mismo peso) — el total es sobre 20.

```python
# font_scanner.py (continued)
def score_pairing(font_a: dict, font_b: dict) -> dict:
    """Score a font pairing based on contrast and weight-balance rules."""
    class_a = classify_font(font_a)
    class_b = classify_font(font_b)

    contrast = 10 if class_a != class_b else 3
    weight_a = 1 if font_a["weight"] == "bold" else 0
    weight_b = 1 if font_b["weight"] == "bold" else 0
    weight_balance = 8 if weight_a != weight_b else 4

    total = contrast + weight_balance
    rating = "excellent" if total >= 16 else "good" if total >= 10 else "fair"

    return {
        "font_a": font_a["family"],
        "font_b": font_b["family"],
        "class_a": class_a,
        "class_b": class_b,
        "contrast": contrast,
        "weight_balance": weight_balance,
        "total_score": total,
        "rating": rating,
    }

results = []
for i, fa in enumerate(fonts[:10]):
    for fb in fonts[i + 1:15]:
        score = score_pairing(fa, fb)
        if score["rating"] == "excellent":
            results.append(score)

results.sort(key=lambda x: x["total_score"], reverse=True)
print(f"\nTop pairings ({len(results)} excellent):")
for r in results[:3]:
    print(f"  {r['font_a']} + {r['font_b']} — {r['rating']} ({r['total_score']}/20)")
```

El bucle anidado `for i, fa in enumerate(fonts[:10]): for fb in fonts[i + 1:15]:` limita deliberadamente el espacio de búsqueda — comparar las primeras 10 fuentes contra las siguientes 5 te da 45 pares para evaluar, lo suficiente para sacar a la superficie resultados significativos sin explosión combinatoria. `results.sort(key=lambda x: x["total_score"], reverse=True)` asegura que los mejores puntajes aparezcan primero, y filtrar a `rating == "excellent"` (puntaje ≥ 16) mantiene la salida enfocada en emparejamientos genuinamente sólidos en lugar de una larga lista de mediocres.

**🎯 Resultado esperado :** Una lista ordenada de emparejamientos excelentes, cada uno imprimiendo dos nombres de fuentes, una calificación de "excellent" y un puntaje sobre 20. El par superior tiene un puntaje de 18 (categoría diferente = 10 + equilibrio de peso = 8).

**🩹 Si sale mal :** Si la lista de resultados está vacía, ningún par puntuó ≥ 16 — o todas las fuentes del escaneo son de la misma categoría, o ninguna tiene pesos contrastantes. Amplía el rango de búsqueda (`fonts[:20]` en lugar de `[:10]`). Si un par que sabes que es excelente puntuó solo "fair", el clasificador o la heurística de peso fallaron para ambas fuentes — rastrea `classify_font` y el campo de peso para ambas.

### 3.2 Verifica las clasificaciones

**✅ Lista de verificación**

- ✅ El par mejor puntuado tiene un total de 18 (10 de contraste + 8 de equilibrio de peso) — confirmando que ambas reglas se activaron.
- ✅ Puedes nombrar un par que puntuó "good" pero no "excellent" y explicar por qué el total cayó por debajo de 16.

**🤔 Pregunta(s) socrática(s)**

- Dos fuentes son ambas sans-serif pero una está en `bold` — el puntaje es 3 + 8 = 11 ("good"). Una guía de emparejamiento de fuentes aún llamaría a esto usable. ¿Cuál es el costo de que tu herramienta lo *excluya* de "excellent", y cómo cambiarías los umbrales si quisieras incluirlo?
- La función de puntuación trata todos los contrastes de categoría por igual (serif vs. sans-serif y monospace vs. display ambos puntúan 10). ¿Es eso realista — qué emparejamientos crean en realidad el contraste visual más fuerte, y cómo codificarías esa diferencia?

## Paso 4: Renderiza una vista previa del emparejamiento

Un puntaje es un número; una vista previa es una imagen. Las mismas fuentes que acabas de clasificar se pueden renderizar como un encabezado en la primera fuente y un párrafo de cuerpo en la segunda, dispuestos como una página real — y guardados como un PNG que puedes enviar a un diseñador. Este paso es la confirmación visual de que la puntuación de verdad produjo un resultado de buen aspecto.

### 4.1 Construye `render_preview`

**👟 Pista inicial :** Crea una `Image` de Pillow blanca de 800×500, dibuja el encabezado en la primera fuente a 36px, dibuja una regla horizontal y ajusta el texto del cuerpo manualmente para que no desborde el ancho del lienzo.

```python
# font_scanner.py (continued)
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

def render_preview(heading_font_path: str, body_font_path: str,
                   heading_text: str = "The Quick Brown Fox Jumps",
                   body_text: str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
                                   "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                   output_path: str = "preview.png") -> None:
    """Render a heading + body font pairing preview image."""
    width, height = 800, 500
    img = Image.new("RGB", (width, height), "#ffffff")
    draw = ImageDraw.Draw(img)

    try:
        heading_font = ImageFont.truetype(heading_font_path, 36)
        body_font    = ImageFont.truetype(body_font_path, 18)
    except OSError as e:
        print(f"Error loading fonts: {e}")
        return

    draw.text((40, 40), heading_text, fill="#1a1a1a", font=heading_font)
    draw.line([(40, 100), (760, 100)], fill="#cccccc", width=1)

    y = 130
    line = ""
    for word in body_text.split():
        test = f"{line} {word}".strip()
        if draw.textbbox((0, 0), test, font=body_font)[2] > 720:
            draw.text((40, y), line, fill="#333333", font=body_font)
            y += 28
            line = word
        else:
            line = test
    if line:
        draw.text((40, y), line, fill="#333333", font=body_font)

    label_font = ImageFont.load_default()
    draw.text((40, height - 50), f"Heading: {Path(heading_font_path).stem}", fill="#888888", font=label_font)
    draw.text((400, height - 50), f"Body: {Path(body_font_path).stem}", fill="#888888", font=label_font)

    img.save(output_path, quality=95)
    print(f"Preview saved to {output_path}")

if len(fonts) >= 2:
    render_preview(fonts[0]["path"], fonts[1]["path"], output_path="my_pairing.png")
```

El bucle de ajuste de texto es la parte más interesante: construye una línea palabra por palabra, prueba su ancho con `draw.textbbox` (que devuelve el cuadro delimitador) y solo confirma la línea cuando la siguiente palabra excedería 720 px. Este es el algoritmo de ajuste correcto más simple — versiones más sofisticadas manejan guiones y espacios de ancho variable, pero para una imagen de vista previa, esto produce una salida limpia y legible. El `label_font = ImageFont.load_default()` al final usa la fuente de mapa de bits de 10px integrada de Pillow — es fea pero está garantizado que se carga en cada instalación de Pillow, que es exactamente el equilibrio correcto para una etiqueta pequeña.

**🎯 Resultado esperado :** Un archivo `my_pairing.png` que muestra un encabezado grande en la primera fuente, una regla horizontal delgada y un párrafo de cuerpo ajustado en la segunda fuente, con etiquetas diminutas en la parte inferior.

**🩹 Si sale mal :** Si la imagen está en blanco o el texto no aparece, la ruta del archivo de fuente es incorrecta o la fuente no soporta los caracteres que estás renderizando — prueba con una fuente diferente de la lista `fonts`. Si el texto del cuerpo se desborda verticalmente, el límite de ajuste (720) es demasiado grande para el tamaño de fuente, o el texto es demasiado largo para un lienzo de 500px de alto — acorta el texto del cuerpo o aumenta la altura del lienzo. Si `render_preview` sale temprano con un `OSError`, una de las dos rutas de fuentes es inválida.

### 4.2 Verifica la vista previa

**✅ Lista de verificación**

- ✅ `my_pairing.png` existe y muestra fuentes claramente diferentes para el texto del encabezado y del cuerpo.
- ✅ El texto del encabezado es más grande que el del cuerpo y ambos son legibles en sus respectivos tamaños.

**🤔 Pregunta(s) socrática(s)**

- La vista previa usa un fondo blanco con texto oscuro — la convención web más común. ¿Qué cambios harías en `render_preview` para probar el emparejamiento sobre un fondo oscuro (texto blanco sobre `#1a1a1a`), y cuál de las funciones de verificación de contraste del proyecto de sistema de diseño usarías para verificarlo?
- Las fuentes de encabezado y cuerpo se renderizan a tamaños fijos (36px y 18px). En una página web real, esos tamaños los controla CSS, no la imagen. ¿Qué te dice en realidad la vista previa sobre el emparejamiento que solo CSS no te diría?

## Paso 5: Genera pilas CSS font-family

Un nombre de fuente en tu sistema no es lo mismo que un nombre de fuente en el sistema de un visitante. Una pila `font-family` lista la fuente deseada primero, luego una cadena de respaldos seguros para web que se vuelven progresivamente más genéricos — el navegador usa la primera que puede encontrar. Este paso convierte tus fuentes escaneadas y emparejadas en pilas CSS que funcionan multiplataforma.

### 5.1 Construye `generate_css_stack`

**👟 Pista inicial :** Mapea cada categoría a su familia de respaldo segura para web estándar, y devuelve una cadena separada por comas: `'Desired Font', fallback1, fallback2, generic-category`.

```python
# font_scanner.py (continued)
FALLBACKS = {
    "sans-serif": "Arial, Helvetica, sans-serif",
    "serif":      "Georgia, 'Times New Roman', Times, serif",
    "monospace":  "'Courier New', Courier, monospace",
    "display":    "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
}

def generate_css_stack(font_family: str, category: str) -> str:
    """Build a CSS font-family stack with web-safe fallbacks."""
    generic = FALLBACKS.get(category, FALLBACKS["sans-serif"])
    return f"'{font_family}', {generic}"

print("/* Recommended font stacks */")
for r in results[:3]:
    css_heading = generate_css_stack(r["font_a"], r["class_a"])
    css_body    = generate_css_stack(r["font_b"], r["class_b"])
    print(f"h1 {{ font-family: {css_heading}; }}")
    print(f"body {{ font-family: {css_body}; }}")
    print()
```

El orden de respaldo importa: la fuente *específica* primero, luego las progresivamente más comunes, terminando con la categoría genérica (`sans-serif`, `serif`, etc.) como captura final. Si el navegador no puede encontrar "DejaVu Sans" en la máquina del usuario, cae a Arial, luego a Helvetica, luego al sans-serif por defecto del navegador — esa cadena garantiza que la página *siempre* se vea aceptable, incluso si no se ve idéntica a tu diseño. Las comillas simples alrededor de `'Courier New'` son obligatorias porque el nombre de la fuente contiene un espacio.

**🎯 Resultado esperado :** Un bloque CSS con declaraciones `h1` y `body` para cada uno de los tres mejores emparejamientos, cada una usando el nombre de fuente escaneado seguido de la cadena de respaldo estándar.

**🩹 Si sale mal :** Si el CSS usa un nombre de fuente con una coma (algunas fuentes la tienen), necesita comillas simples alrededor del nombre completo — el actual `f"'{font_family}'"` maneja esto correctamente, pero si lo reescribiste sin comillas, la coma se analizaría como un separador de pila. Si el genérico de respaldo no coincide con la categoría, revisa el dict `FALLBACKS` por errores tipográficos.

### 5.2 Verifica las pilas CSS

**✅ Lista de verificación**

- ✅ Cada línea `font-family` generada empieza con un nombre de fuente entre comillas simples y termina con una palabra clave genérica desnuda (`sans-serif`, `serif`, `monospace` o `display`).
- ✅ Puedes explicar por qué la palabra clave genérica siempre va al final de la cadena — ¿qué pasa si la pones primero?

**🤔 Pregunta(s) socrática(s)**

- Si un visitante web tiene tu fuente exacta instalada pero en una versión diferente (p. ej., DejaVu Sans v2.35 vs. tu v2.37), ¿cambiaría el CSS — y qué te dice eso sobre los límites de las pilas de fuentes para la consistencia visual?
- ¿Cómo modificarías la herramienta para detectar cuándo una fuente de tu sistema *no* tiene un respaldo seguro para web conocido, y sugerir uno? ¿Qué significaría "conocido" en este contexto?

## ⚠️ Errores comunes

- **La clasificación basada en nombres es una heurística, no una garantía.** Una fuente llamada "Source Sans Pro" se clasifica correctamente como sans-serif, pero una fuente llamada "Fira" (que en realidad es sans-serif) se clasifica como `sans-serif` por pasar a través en lugar de por identificación positiva. Para uso en producción, lee los metadatos internos de la fuente (`font.getname()`) o su tabla `sfnt` para determinar la categoría real.
- **Los archivos `.ttc` pueden cargar la cara incorrecta.** Una TrueType Collection agrupa varias fuentes en un solo archivo; `ImageFont.truetype(path, index=0)` carga la primera por defecto, que puede no ser la que querrías para encabezados. Para trabajo de emparejamiento, prefiere archivos `.ttf` o `.otf` individuales donde la cara no es ambigua.
- **Recuento de fuentes cero en sistemas mínimos.** Un contenedor recién creado o una VM cloud mínima puede no tener fuentes del sistema en absoluto — el escáner devuelve `[]` y cada paso posterior se bloquea con una lista vacía. Protégete con `if not fonts: print("No fonts found; install DejaVu or Liberation fonts.")` y sal temprano, o proporciona una fuente de respaldo incluida con el proyecto.
- **Desbordamiento de la vista previa en lienzos pequeños.** El texto del cuerpo demasiado largo para un lienzo de 500px de alto se recortará con Pillow sin previo aviso. Acorta el parámetro `body_text` por defecto o aumenta la altura del lienzo — no dependas de que quien llama adivine la longitud correcta.
- **Los pesos de fuente inferidos de los nombres no son fiables.** Una fuente llamada "DejaVu Sans" puede en realidad contener una variante en negrita en una ruta diferente — tu escáner la trata como "regular" porque "bold" no está en el nombre del archivo. Para una detección de peso precisa, intenta cargar la fuente en un peso más pesado y atrapa el `OSError`, o analiza la tabla de `name` de la fuente.

## Lo que acabas de construir

Una herramienta funcional de análisis y emparejamiento de fuentes: escanea archivos de fuentes reales de tu sistema, los clasifica por categoría usando heurísticas basadas en nombres, puntúa cada par con dos reglas tipográficas concretas, clasifica los mejores emparejamientos, renderiza una imagen de vista previa de encabezado/cuerpo que confirma el resultado visualmente y genera pilas CSS `font-family` listas para producción con respaldos multiplataforma. Nada aquí es un simulacro — las rutas de fuentes son archivos reales, la imagen de vista previa usa las tipografías reales y la salida CSS se puede copiar y pegar en una hoja de estilos viva.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/font-scanner/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/font-scanner) en el repositorio del curso es una versión ejecutable de notebook: el escaneo, la clasificación, la puntuación y la vista previa se ejecutan en una sola pasada del notebook usando las propias fuentes del sistema del kernel. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- **Consulta la API de Google Fonts**: obtén las 50 fuentes principales de Google Fonts por popularidad, filtra por categoría y devuélvelas como una lista de dicts con `family`, `category` y `variants` — extiende la herramienta más allá de las fuentes locales hacia el catálogo web completo.
- **Construye una hoja de especímenes de fuentes**: dada una sola fuente, renderiza el alfabeto completo (mayúsculas y minúsculas), los números del 0 al 9, la puntuación común y un párrafo de texto de muestra a varios tamaños (12, 18, 24, 36, 48px) en una sola imagen — el entregable estándar para la evaluación de fuentes.
- **Agrega un analizador de contraste**: renderiza una muestra de texto blanco sobre blanco a diferentes proporciones de contraste y compara cada una contra WCAG AA (4.5:1) y AAA (7:1) usando luminancia relativa — conectando este proyecto con las matemáticas de accesibilidad del Generador de Sistemas de Diseño.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a hacer que Python lea tus fuentes. 🎓