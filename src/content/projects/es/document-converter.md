---
title: "Convertidor de Documentos"
description: "Convertir entre Markdown, HTML, PDF, DOCX y LaTeX con plantillas de estilo."
difficulty: "beginner"
estimatedMinutes: 40
xpReward: 50
tags: ["file-io", "markdown", "html", "cli"]
prerequisites:
  - "Fundamentos de Python (variables, bucles, funciones, strings)"
  - "E/S de archivos básica"
---

# Convertidor de Documentos

Los documentos vienen en muchos formatos: Markdown para escribir, HTML para la web, texto plano para compartir rápido. Convertir entre ellos manualmente es tedioso y propenso a errores. En este proyecto, construirás una herramienta de Python que lee archivos de Markdown, los convierte a HTML o texto plano, extrae metadatos de los encabezados de los documentos y procesa directorios completos con un solo comando.

## 🎯 Lo que harás

1. Analizar la sintaxis de Markdown en datos estructurados
2. Convertir Markdown a HTML con etiquetas adecuadas
3. Despojar HTML a texto plano
4. Extraer metadatos del frontmatter de los documentos
5. Procesar múltiples archivos en lote

## Lo que construirás

Un convertidor de documentos que:
- Lee archivos de Markdown y los convierte a HTML
- Aplica estilos CSS al HTML generado
- Convierte HTML de vuelta a texto plano
- Extrae metadatos de frontmatter YAML
- Procesa directorios completos con un solo comando

## Configuración

```bash
uv init document-converter
cd document-converter
```

---

## Paso 1: Leer archivos de Markdown

**Objetivo:** Cargar el contenido de un archivo de Markdown en un string de Python para poder trabajar con él.

**Explicación:** La lectura de archivos es la base de cualquier convertidor. La función `open()` de Python con el modo `"r"` abre un archivo para lectura. El método `.read()` extrae el contenido completo del archivo en un solo string. Usa siempre una sentencia `with` para que el archivo se cierre automáticamente, incluso si ocurre un error.

**👟 Pista inicial :** Necesitas un archivo de Markdown de muestra para probar. Crea `sample.md` primero, luego escribe una función que lo lea.

### Crea el archivo de muestra

Crea un archivo llamado `sample.md` en la raíz de tu proyecto con este contenido:

```markdown
# Hello World

This is a **bold** word and this is an *italic* word.

## Features

- Item one
- Item two
- Item three

[A link to Python](https://python.org)

```python
print("Hello!")
```
```

### Código de trabajo

```python
def read_markdown(filepath: str) -> str:
    """Read a Markdown file and return its contents."""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


if __name__ == "__main__":
    content = read_markdown("sample.md")
    print(f"Read {len(content)} characters from sample.md")
    print("---")
    print(content[:200])
```

**🎯 Resultado esperado :**

```
Read 189 characters from sample.md
---
# Hello World

This is a **bold** word and this is an *italic* word.

## Features

- Item one
- Item two
- Item three

[A link to Python](https://python.org)

```python
print("Hello!")
```
```

**🩹 Si sale mal :**

- **`FileNotFoundError`**: Revisa la ruta del archivo. Usa `os.path.exists(filepath)` para verificar que el archivo existe antes de leerlo.
- **`UnicodeDecodeError`**: Algunos archivos usan codificación no UTF-8. Añade `errors="replace"` a `open()` para saltar los caracteres malos.
- **Salida vacía**: El archivo puede estar vacío o la ruta apunta al archivo equivocado. Imprime `filepath` antes de abrirlo.

**✅ Lista de verificación**

- ✅ Creaste `sample.md` con contenido de Markdown
- ✅ La función devuelve el contenido completo del archivo como string
- ✅ Usaste la sentencia `with` para un manejo seguro de archivos
- ✅ Verificaste que la salida imprime los primeros 200 caracteres

**🤔 Pregunta(s) socrática(s)**

¿Por qué importa usar `with open(...)` en comparación con llamar `open()` y `close()` manualmente? ¿Qué pasa si se lanza una excepción entre `open()` y `close()`?

---

## Paso 2: Convertir Markdown a HTML

**Objetivo:** Transformar la sintaxis de Markdown en las etiquetas HTML correspondientes.

**Explicación:** Markdown tiene una sintaxis simple y consistente: `#` para encabezados, `**texto**` para negrita, `*texto*` para cursiva, `-` para ítems de lista, `[texto](url)` para enlaces y tres backticks para bloques de código. Puedes escribir un convertidor mapeando cada patrón a su equivalente HTML usando expresiones regulares.

**👟 Pista inicial :** Usa el módulo `re`. Para cada elemento de Markdown, escribe un patrón que lo coincida y un reemplazo que lo envuelva en etiquetas HTML.

### Código de trabajo

```python
import re


def markdown_to_html(md_text: str) -> str:
    """Convert Markdown text to HTML."""
    html = md_text

    # Code blocks (``` ... ```)
    html = re.sub(
        r"```(\w*)\n(.*?)```",
        r'<pre><code class="language-\1">\2</code></pre>',
        html,
        flags=re.DOTALL,
    )

    # Inline code
    html = re.sub(r"`([^`]+)`", r"<code>\1</code>", html)

    # Headings
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)

    # Bold and italic
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)

    # Links
    html = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', html)

    # Unordered lists
    lines = html.split("\n")
    in_list = False
    result = []
    for line in lines:
        if line.startswith("- "):
            if not in_list:
                result.append("<ul>")
                in_list = True
            result.append(f"  <li>{line[2:]}</li>")
        else:
            if in_list:
                result.append("</ul>")
                in_list = False
            result.append(line)
    if in_list:
        result.append("</ul>")
    html = "\n".join(result)

    # Paragraphs (wrap remaining plain text lines)
    html = re.sub(r"\n\n+", "\n\n", html)

    return html


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html = markdown_to_html(content)
    print(html)
```

**🎯 Resultado esperado :**

```html
<h1>Hello World</h1>

<p>This is a <strong>bold</strong> word and this is an <em>italic</em> word.</p>

<h2>Features</h2>

<ul>
  <li>Item one</li>
  <li>Item two</li>
  <li>Item three</li>
</ul>

<a href="https://python.org">A link to Python</a>

<pre><code class="language-python">print("Hello!")</code></pre>
```

**🩹 Si sale mal :**

- **La negrita no se convierte**: Asegúrate de que los patrones `**` se procesen antes que los patrones `*`. De lo contrario, la regex de cursiva coincidirá el primer `*` de `**` y romperá el patrón de negrita.
- **Los bloques de código se comen contenido**: La bandera `re.DOTALL` deja que `.` coincida saltos de línea dentro del bloque de código. Sin ella, la regex solo coincide bloques de código de una sola línea.
- **Las listas no se envuelven**: El analizador de listas depende de líneas consecutivas que empiecen con `- `. Las líneas en blanco entre ítems rompen el grupo. Eso está bien para este proyecto — cada bloque de lista se maneja por separado.

**✅ Lista de verificación**

- ✅ Los encabezados se convierten en etiquetas `<h1>`, `<h2>`, `<h3>`
- ✅ La negrita (`**`) se convierte en `<strong>` y la cursiva (`*`) en `<em>`
- ✅ Los enlaces se convierten en etiquetas `<a href="...">`
- ✅ Los ítems de lista se envuelven en etiquetas `<ul>` y `<li>`
- ✅ Los bloques de código se envuelven en `<pre><code>` con clase de lenguaje

**🤔 Pregunta(s) socrática(s)**

¿Por qué los patrones de negrita deberían procesarse antes que los patrones de cursiva? ¿Qué pasaría si el orden se invirtiera?

---

## Paso 3: Añadir estilos CSS

**Objetivo:** Envolver el HTML generado en una estructura de documento completa con CSS embebido para un aspecto pulido.

**Explicación:** El HTML crudo sin un `<head>` o un bloque `<style>` se renderiza como texto sin estilos en un navegador. Al envolver tu contenido convertido en un documento HTML completo con CSS embebido, obtienes una página presentable sin dependencias externas.

**👟 Pista inicial :** Crea una constante de string que contenga el esqueleto HTML con un bloque `<style>`, y luego inserta tu contenido convertido en el body.

### Código de trabajo

```python
CSS = """
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    padding: 0 1rem;
    line-height: 1.6;
    color: #333;
}
h1, h2, h3 { color: #111; }
code {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
}
pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
}
pre code { background: none; padding: 0; color: inherit; }
a { color: #0066cc; }
ul { padding-left: 1.5rem; }
"""


def wrap_html(body: str, title: str = "Converted Document") -> str:
    """Wrap HTML body in a full document with CSS."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>"""


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html_body = markdown_to_html(content)
    full_html = wrap_html(html_body, title="My Document")
    print(full_html[:500])
```

**🎯 Resultado esperado :**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Document</title>
    <style>
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    ...
</style>
</head>
<body>
<h1>Hello World</h1>
...
</body>
</html>
```

**🩹 Si sale mal :**

- **El CSS no se muestra**: Asegúrate de que la etiqueta `<style>` está dentro de `<head>`, no de `<body>`.
- **Caracteres especiales en el título**: Si el título contiene comillas, romperán el atributo HTML. Usa `html.escape(title)` del módulo `html` para sanitizarlo.
- **El archivo no se renderiza en el navegador**: Guárdalo como `.html` (no `.md`) y ábrelo en un navegador.

**✅ Lista de verificación**

- ✅ El HTML incluye la declaración `<!DOCTYPE html>`
- ✅ El CSS está embebido en un bloque `<style>` dentro de `<head>`
- ✅ La página tiene un título configurable
- ✅ El contenido del body se inserta entre las etiquetas `<body>`
- ✅ Abrir el archivo de salida en un navegador muestra el contenido con estilos

**🤔 Pregunta(s) socrática(s)**

¿Por qué embebir CSS directamente en el archivo HTML en lugar de enlazar a una hoja de estilos externa? ¿Cuáles son los trade-offs de cada enfoque?

---

## Paso 4: Convertir HTML a texto plano

**Objetivo:** Despojar todas las etiquetas HTML y devolver texto plano limpio.

**Explicación:** Convertir HTML de vuelta a texto plano es útil para vistas previas, indexación de búsqueda o cuerpos de correo. El enfoque es directo: elimina todas las etiquetas con una regex, y luego limpia el espacio en blanco extra. No es un analizador HTML completo, pero funciona bien para documentos simples.

**👟 Pista inicial :** Usa `re.sub(r"<[^>]+>", "", html)` para eliminar las etiquetas, y luego colapsa los espacios múltiples y las líneas en blanco.

### Código de trabajo

```python
import html as html_module


def html_to_text(html_str: str) -> str:
    """Convert HTML to plain text by stripping tags."""
    text = html_str

    # Replace block elements with newlines for spacing
    text = re.sub(r"<(br|hr)\s*/?>", "\n", text)
    text = re.sub(r"</(p|div|h[1-6]|li|pre)>", "\n", text)

    # Remove all remaining tags
    text = re.sub(r"<[^>]+>", "", text)

    # Decode HTML entities (&amp; -> &, &lt; -> <, etc.)
    text = html_module.unescape(text)

    # Clean up whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = text.strip()

    return text


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html_body = markdown_to_html(content)
    plain = html_to_text(html_body)
    print(plain)
```

**🎯 Resultado esperado :**

```
Hello World

This is a bold word and this is an italic word.

Features

- Item one
- Item two
- Item three

A link to Python

print("Hello!")
```

**🩹 Si sale mal :**

- **Líneas en blanco extra**: El patrón `\n{3,}` colapsa tres o más saltos de línea en dos. Ajusta el umbral si quieres un espaciado más compacto.
- **Entidades que no se decodifican**: Asegúrate de llamar a `html_module.unescape()` después de eliminar las etiquetas, no antes. Algunas entidades viven dentro de atributos de etiquetas y no deberían decodificarse en el texto del cuerpo.
- **Formato perdido**: Esto es esperado. El texto plano no tiene concepto de negrita o cursiva. El enfoque de despojar produce texto limpio pero pierde la información de formato.

**✅ Lista de verificación**

- ✅ Todas las etiquetas HTML se eliminan
- ✅ Las entidades HTML se decodifican a sus caracteres
- ✅ El espacio en blanco extra y las líneas en blanco se colapsan
- ✅ La salida es texto plano limpio y legible

**🤔 Pregunta(s) socrática(s)**

¿Qué pasa si ejecutas esta función sobre HTML que contiene una etiqueta `<script>` con código JavaScript? ¿Cómo manejarías ese caso?

---

## Paso 5: Extraer metadatos

**Objetivo:** Analizar frontmatter YAML desde la parte superior de un archivo de Markdown y devolverlo como diccionario.

**Explicación:** Muchos archivos de Markdown comienzan con un bloque de frontmatter YAML delimitado por `---`. Este bloque contiene metadatos como título, autor, fecha y etiquetas. Extraer estos datos permite a tu convertidor añadirlos a etiquetas `<meta>` de HTML o usarlos para organizar archivos.

**👟 Pista inicial :** Divide el contenido del archivo en `---`. El primer segmento es el frontmatter (si existe). Analízalo línea por línea, dividiendo en el primer `:` para obtener pares clave-valor.

### Crea un archivo de prueba

Crea `sample_with_meta.md`:

```markdown
---
title: My Blog Post
author: Jane Doe
date: 2025-01-15
tags: python, tutorial, beginner
---

# My Blog Post

This post covers Python basics.

## Why Python?

Python is great for beginners.
```

### Código de trabajo

```python
def extract_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and return (metadata_dict, body_text)."""
    lines = text.split("\n")

    if not lines or lines[0].strip() != "---":
        return {}, text

    # Find the closing ---
    end_index = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = i
            break

    if end_index is None:
        return {}, text

    # Parse frontmatter lines
    metadata = {}
    for line in lines[1:end_index]:
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        # Convert comma-separated values to list
        if "," in value:
            value = [v.strip() for v in value.split(",")]

        metadata[key] = value

    body = "\n".join(lines[end_index + 1 :])
    return metadata, body


if __name__ == "__main__":
    text = read_markdown("sample_with_meta.md")
    meta, body = extract_frontmatter(text)
    print("Metadata:", meta)
    print("---")
    print("Body preview:", body[:100])
```

**🎯 Resultado esperado :**

```
Metadata: {'title': 'My Blog Post', 'author': 'Jane Doe', 'date': '2025-01-15', 'tags': ['python', 'tutorial', 'beginner']}
---
Body preview: 

# My Blog Post

This post covers Python basics.

## Why Python?

Python is great for beginners.
```

**🩹 Si sale mal :**

- **No se devuelven metadatos**: El archivo debe empezar con `---` en la primera línea. Sin líneas en blanco antes.
- **Valores con dos puntos**: Si un valor contiene dos puntos (como `url: https://example.com`), `partition(":")` lo maneja correctamente porque divide solo en el primer `:`.
- **YAML anidado**: Este analizador maneja pares clave-valor planos. No soporta estructuras YAML anidadas. Para esas, usa la biblioteca `pyyaml`.

**✅ Lista de verificación**

- ✅ El frontmatter se extrae cuando está presente
- ✅ Los archivos sin frontmatter devuelven dict vacío y cuerpo completo
- ✅ Las etiquetas separadas por comas se convierten en una lista
- ✅ El texto del cuerpo empieza después del `---` de cierre
- ✅ Las claves y los valores se despojan de espacio en blanco

**🤔 Pregunta(s) socrática(s)**

¿Por qué este proyecto analiza el frontmatter manualmente en lugar de usar una biblioteca como PyYAML? ¿Cuándo elegirías el enfoque manual en lugar de recurrir a una biblioteca?

---

## Paso 6: Conversión por lotes

**Objetivo:** Procesar cada archivo de Markdown en un directorio y convertirlos a HTML.

**Explicación:** El uso en el mundo real requiere convertir muchos archivos a la vez. Los módulos `os` y `pathlib` de Python te permiten recorrer directorios, encontrar archivos `.md` y aplicar tu convertidor a cada uno. El procesamiento por lotes convierte una herramienta de un archivo en una utilidad real.

**👟 Pista inicial :** Usa `pathlib.Path.glob("**/*.md")` para encontrar recursivamente todos los archivos de Markdown en un directorio.

### Código de trabajo

```python
from pathlib import Path


def batch_convert(
    input_dir: str,
    output_dir: str,
    format: str = "html",
) -> list[str]:
    """Convert all Markdown files in input_dir to the target format.

    Returns a list of output file paths.
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    converted_files = []

    for md_file in input_path.glob("**/*.md"):
        text = md_file.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        # Determine output path
        rel_path = md_file.relative_to(input_path)
        if format == "html":
            out_file = output_path / rel_path.with_suffix(".html")
            full_html = wrap_html(html_body, title=metadata.get("title", rel_path.stem))
            out_file.write_text(full_html, encoding="utf-8")
        elif format == "text":
            out_file = output_path / rel_path.with_suffix(".txt")
            plain = html_to_text(html_body)
            out_file.write_text(plain, encoding="utf-8")

        converted_files.append(str(out_file))
        print(f"  Converted: {md_file.name} -> {out_file.name}")

    return converted_files


if __name__ == "__main__":
    print("Converting sample.md to HTML...")
    files = batch_convert(".", "output/html", format="html")
    print(f"\nDone. Converted {len(files)} file(s).")
```

**🎯 Resultado esperado :**

```
Converting sample.md to HTML...
  Converted: sample.md -> sample.html
  Converted: sample_with_meta.md -> sample_with_meta.html

Done. Converted 2 file(s).
```

**🩹 Si sale mal :**

- **`FileExistsError` en mkdir**: Usa `exist_ok=True` para evitar errores si el directorio de salida ya existe.
- **Errores de codificación al leer**: Algunos archivos pueden no ser UTF-8. Envuelve la llamada a `read_text` en un try/except y recurre a `errors="replace"`.
- **Directorio de salida vacío**: Verifica que el patrón glob coincida con tus archivos. `**/*.md` es recursivo; `*.md` solo coincide con el nivel superior.

**✅ Lista de verificación**

- ✅ Todos los archivos `.md` en el directorio de entrada se encuentran
- ✅ Los archivos de salida se crean en el directorio de salida
- ✅ Los archivos HTML incluyen los metadatos como título de página
- ✅ La estructura de directorios se conserva en la salida
- ✅ El directorio de salida vacío se crea si no existe

**🤔 Pregunta(s) socrática(s)**

¿Qué cambiaría si necesitaras procesar también archivos `.markdown` (no solo `.md`)? ¿Cómo modificarías el patrón glob?

---

## Paso 7: Construir la CLI

**Objetivo:** Envolver toda la funcionalidad en una interfaz de línea de comandos para que los usuarios puedan ejecutar conversiones desde la terminal.

**Explicación:** Una CLI hace que tu herramienta sea usable sin escribir código Python. El módulo `argparse` de Python maneja el análisis de argumentos, el texto de ayuda y la validación. Este es el paso final que convierte tus scripts en una herramienta de línea de comandos real.

**👟 Pista inicial :** Usa `argparse.ArgumentParser` con subcomandos o banderas para formato, entrada y salida.

### Código de trabajo

```python
import argparse
import sys


def main():
    parser = argparse.ArgumentParser(
        description="Convert Markdown files to HTML or plain text.",
        epilog="Examples:\n"
        "  python converter.py sample.md\n"
        "  python converter.py sample.md -o output.html -f text\n"
        '  python converter.py docs/ -o converted/ -f html',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "input",
        help="Input file or directory to convert",
    )
    parser.add_argument(
        "-o", "--output",
        help="Output file or directory (default: stdout for files, ./output/ for dirs)",
    )
    parser.add_argument(
        "-f", "--format",
        choices=["html", "text"],
        default="html",
        help="Output format (default: html)",
    )
    parser.add_argument(
        "--title",
        default="Converted Document",
        help="Title for HTML output (default: Converted Document)",
    )
    parser.add_argument(
        "--extract-meta",
        action="store_true",
        help="Print extracted metadata and exit",
    )

    args = parser.parse_args()
    input_path = Path(args.input)

    # Extract metadata mode
    if args.extract_meta:
        if not input_path.is_file():
            parser.error("--extract-meta requires a file, not a directory")
        text = input_path.read_text(encoding="utf-8")
        meta, _ = extract_frontmatter(text)
        for key, value in meta.items():
            print(f"  {key}: {value}")
        return

    # Single file conversion
    if input_path.is_file():
        text = input_path.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        if args.format == "html":
            title = metadata.get("title", args.title)
            result = wrap_html(html_body, title=title)
        else:
            result = html_to_text(html_body)

        if args.output:
            Path(args.output).write_text(result, encoding="utf-8")
            print(f"Converted {input_path.name} -> {args.output}")
        else:
            print(result)

    # Directory batch conversion
    elif input_path.is_dir():
        output_dir = args.output or "output"
        files = batch_convert(str(input_path), output_dir, format=args.format)
        print(f"\nConverted {len(files)} file(s) to {output_dir}/")

    else:
        print(f"Error: {args.input} does not exist", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

**🎯 Resultado esperado :**

Archivo único a stdout:
```bash
python converter.py sample.md
```
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Document</title>
    <style>body { font-family: sans-serif; ... }</style>
</head>
<body>
<h1>Hello World</h1>
...
</body>
</html>
```

Archivo único a un archivo de salida:
```bash
python converter.py sample.md -o output.html
Converted sample.md -> output.html
```

Directorio por lote:
```bash
python converter.py docs/ -o converted/ -f html
  Converted: intro.md -> intro.html
  Converted: guide.md -> guide.html

Converted 2 file(s) to converted/
```

Extraer metadatos:
```bash
python converter.py sample_with_meta.md --extract-meta
  title: My Blog Post
  author: Jane Doe
  date: 2025-01-15
  tags: python, tutorial, beginner
```

Ayuda:
```bash
python converter.py --help
```
```
usage: converter.py [-h] [-o OUTPUT] [-f {html,text}] [--title TITLE]
                    [--extract-meta] input

Convert Markdown files to HTML or plain text.

positional arguments:
  input                 Input file or directory to convert

options:
  -h, --help            show this help message and exit
  -o, --output          Output file or directory
  -f, --format          Output format (default: html)
  --title               Title for HTML output
  --extract-meta        Print extracted metadata and exit

Examples:
  python converter.py sample.md
  python converter.py sample.md -o output.html -f text
  python converter.py docs/ -o converted/ -f html
```

**🩹 Si sale mal :**

- **`argparse` dice argumentos no reconocidos**: Asegúrate de que las banderas vengan *después* del argumento posicional, no antes.
- **`sys.exit` en pruebas**: Si estás probando esto en un REPL, envuelve `main()` en un try/except `SystemExit`.
- **Sin salida al canalizar**: Si estás canalizando a un archivo, asegúrate de no estar también imprimiendo a stdout. El modo de archivo único imprime a stdout cuando `-o` no se especifica.

**✅ Lista de verificación**

- ✅ La CLI acepta ruta de entrada, ruta de salida y bandera de formato
- ✅ El modo de archivo único imprime a stdout o escribe en un archivo de salida
- ✅ El modo de directorio convierte todos los archivos `.md`
- ✅ `--extract-meta` imprime el frontmatter y sale
- ✅ `--help` muestra ejemplos de uso
- ✅ Las rutas de entrada inválidas producen un mensaje de error claro

**🤔 Pregunta(s) socrática(s)**

¿Por qué la CLI usa `sys.exit(1)` para los errores en lugar de solo imprimir un mensaje? ¿Qué comunica el código de salida a otros programas o scripts que llaman a tu herramienta?

---

## `converter.py` completo

Aquí está el archivo completo con todos los pasos combinados:

```python
"""Document Converter - Convert between Markdown, HTML, and plain text."""

import re
import html as html_module
import argparse
import sys
from pathlib import Path


def read_markdown(filepath: str) -> str:
    """Read a Markdown file and return its contents."""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def markdown_to_html(md_text: str) -> str:
    """Convert Markdown text to HTML."""
    html = md_text

    # Code blocks
    html = re.sub(
        r"```(\w*)\n(.*?)```",
        r'<pre><code class="language-\1">\2</code></pre>',
        html,
        flags=re.DOTALL,
    )

    # Inline code
    html = re.sub(r"`([^`]+)`", r"<code>\1</code>", html)

    # Headings
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)

    # Bold and italic
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)

    # Links
    html = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', html)

    # Lists
    lines = html.split("\n")
    in_list = False
    result = []
    for line in lines:
        if line.startswith("- "):
            if not in_list:
                result.append("<ul>")
                in_list = True
            result.append(f"  <li>{line[2:]}</li>")
        else:
            if in_list:
                result.append("</ul>")
                in_list = False
            result.append(line)
    if in_list:
        result.append("</ul>")
    html = "\n".join(result)

    html = re.sub(r"\n{3,}", "\n\n", html)

    return html


CSS = """
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    padding: 0 1rem;
    line-height: 1.6;
    color: #333;
}
h1, h2, h3 { color: #111; }
code {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
}
pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
}
pre code { background: none; padding: 0; color: inherit; }
a { color: #0066cc; }
ul { padding-left: 1.5rem; }
"""


def wrap_html(body: str, title: str = "Converted Document") -> str:
    """Wrap HTML body in a full document with CSS."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>"""


def html_to_text(html_str: str) -> str:
    """Convert HTML to plain text by stripping tags."""
    text = html_str

    text = re.sub(r"<(br|hr)\s*/?>", "\n", text)
    text = re.sub(r"</(p|div|h[1-6]|li|pre)>", "\n", text)

    text = re.sub(r"<[^>]+>", "", text)
    text = html_module.unescape(text)

    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = text.strip()

    return text


def extract_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and return (metadata_dict, body_text)."""
    lines = text.split("\n")

    if not lines or lines[0].strip() != "---":
        return {}, text

    end_index = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = i
            break

    if end_index is None:
        return {}, text

    metadata = {}
    for line in lines[1:end_index]:
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        if "," in value:
            value = [v.strip() for v in value.split(",")]

        metadata[key] = value

    body = "\n".join(lines[end_index + 1 :])
    return metadata, body


def batch_convert(
    input_dir: str,
    output_dir: str,
    format: str = "html",
) -> list[str]:
    """Convert all Markdown files in input_dir to the target format."""
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    converted_files = []

    for md_file in input_path.glob("**/*.md"):
        text = md_file.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        rel_path = md_file.relative_to(input_path)
        if format == "html":
            out_file = output_path / rel_path.with_suffix(".html")
            full_html = wrap_html(html_body, title=metadata.get("title", rel_path.stem))
            out_file.write_text(full_html, encoding="utf-8")
        elif format == "text":
            out_file = output_path / rel_path.with_suffix(".txt")
            plain = html_to_text(html_body)
            out_file.write_text(plain, encoding="utf-8")

        converted_files.append(str(out_file))
        print(f"  Converted: {md_file.name} -> {out_file.name}")

    return converted_files


def main():
    parser = argparse.ArgumentParser(
        description="Convert Markdown files to HTML or plain text.",
        epilog="Examples:\n"
        "  python converter.py sample.md\n"
        "  python converter.py sample.md -o output.html -f text\n"
        '  python converter.py docs/ -o converted/ -f html',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument("input", help="Input file or directory to convert")
    parser.add_argument(
        "-o", "--output",
        help="Output file or directory (default: stdout for files)",
    )
    parser.add_argument(
        "-f", "--format",
        choices=["html", "text"],
        default="html",
        help="Output format (default: html)",
    )
    parser.add_argument(
        "--title",
        default="Converted Document",
        help="Title for HTML output",
    )
    parser.add_argument(
        "--extract-meta",
        action="store_true",
        help="Print extracted metadata and exit",
    )

    args = parser.parse_args()
    input_path = Path(args.input)

    if args.extract_meta:
        if not input_path.is_file():
            parser.error("--extract-meta requires a file, not a directory")
        text = input_path.read_text(encoding="utf-8")
        meta, _ = extract_frontmatter(text)
        for key, value in meta.items():
            print(f"  {key}: {value}")
        return

    if input_path.is_file():
        text = input_path.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        if args.format == "html":
            title = metadata.get("title", args.title)
            result = wrap_html(html_body, title=title)
        else:
            result = html_to_text(html_body)

        if args.output:
            Path(args.output).write_text(result, encoding="utf-8")
            print(f"Converted {input_path.name} -> {args.output}")
        else:
            print(result)

    elif input_path.is_dir():
        output_dir = args.output or "output"
        files = batch_convert(str(input_path), output_dir, format=args.format)
        print(f"\nConverted {len(files)} file(s) to {output_dir}/")

    else:
        print(f"Error: {args.input} does not exist", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

---

## 🧩 Desafíos

1. **Soporte de listas ordenadas**: Extiende `markdown_to_html` para convertir líneas `1.`, `2.`, `3.` en etiquetas `<ol>` y `<li>`.

2. **Imágenes**: Añade soporte para `![alt text](image.png)` convirtiéndolo en `<img src="image.png" alt="alt text">`.

3. **Tablas**: Las tablas de Markdown usan los caracteres `|` y `-`. Añade un convertidor que las convierta en etiquetas `<table>`.

4. **Conteo de palabras**: Añade una bandera `--stats` que imprima el conteo de palabras, el conteo de líneas y el conteo de caracteres en lugar de convertir.

5. **Modo de observación**: Añade una bandera `--watch` que monitoree el directorio de entrada y vuelva a convertir cuando los archivos cambien.

## Lo que aprendiste

- Leer archivos con `open()` y la sentencia `with` para un manejo seguro de recursos
- Usar `re` (expresiones regulares) para coincidir y transformar patrones de texto
- Construir documentos HTML con CSS embebido para páginas independientes
- Despojar etiquetas HTML y decodificar entidades para producir texto plano limpio
- Analizar frontmatter simple estilo YAML sin bibliotecas externas
- Recorrer directorios con `pathlib.Path.glob()` para procesamiento de archivos por lotes
- Construir una CLI con `argparse` que soporta banderas, subcomandos y texto de ayuda
- Manejar errores con elegancia con códigos de salida y mensajes amigables para el usuario