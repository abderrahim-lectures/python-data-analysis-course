---
title: "Generador de Descripciones de Imágenes"
description: "Genera descripciones en lenguaje natural para imágenes usando modelos de visión y lenguaje."
difficulty: "intermediate"
estimatedMinutes: 45
tags: ["ai", "computer-vision", "cli"]
learningObjectives:
  - "Cargar y preprocesar imágenes para la entrada del modelo de visión y lenguaje"
  - "Enviar imágenes a una API de visión de nivel gratuito y analizar las respuestas de descripción"
  - "Procesar lotes de imágenes con seguimiento de progreso"
  - "Incrustar las descripciones generadas en los metadatos EXIF de las imágenes"
prerequisites: ["Python 101"]
---

# 🖼️ Construye un Generador de Descripciones de Imágenes

Cada foto en la web necesita una descripción de texto, para la accesibilidad, para los motores de búsqueda, para las personas que no pueden cargar la imagen. Escribir descripciones a mano es lento; un modelo de visión y lenguaje puede generarlas en segundos. Este proyecto construye una herramienta CLI que toma una imagen (desde una ruta de archivo o una URL) y produce una descripción legible para humanos usando una API de visión de nivel gratuito. Te encargarás del preprocesamiento de imágenes, las llamadas a la API, el procesamiento por lotes con seguimiento de progreso, e incluso escribirás las descripciones de vuelta en los metadatos de la imagen.

Esto asume Python 101, no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias que necesitarás.
2. Cargar y redimensionar imágenes para su consumo por parte de la API usando Pillow.
3. Enviar una imagen a un modelo de visión y lenguaje de nivel gratuito y analizar la descripción.
4. Construir un procesador por lotes que maneje directorios de imágenes con seguimiento de progreso.
5. Incrustar las descripciones generadas en los metadatos EXIF de las imágenes para su almacenamiento portátil.
6. Conectar todo en un CLI que genera descripciones de imágenes individuales o de carpetas enteras.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal, esta herramienta lee archivos de imagen del disco y escribe imágenes modificadas con metadatos incrustados.

**Google Colab, Kaggle Notebooks y Binder** funcionan para probar la herramienta. El notebook usa el mismo código e incluye imágenes de muestra para las pruebas. Necesitarás una clave de API de nivel gratuito (GitHub Models, Gemini o Groq) configurada como variable de entorno.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-caption-generator/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-caption-generator/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fimage-caption-generator%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de generar descripciones: un entorno de Python, una librería de imágenes, un cliente HTTP y una clave de API gratuita.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Configura el proyecto

```bash
uv init image-caption-generator
cd image-caption-generator
uv add Pillow requests click python-dotenv
```

`Pillow` se encarga de cargar las imágenes, redimensionarlas y de los metadatos EXIF. `requests` envía las imágenes a la API de visión. `click` construye el CLI, y `python-dotenv` carga tu clave de API desde un archivo `.env`.

### Obtén una clave gratuita de API de visión

Necesitas un proveedor que admita entradas de imágenes. GitHub Models y Gemini funcionan ambos:

| Proveedor | Dónde obtener una clave | Modelo de visión |
|---|---|---|
| **GitHub Models** *(sugerido)* | [github.com/settings/tokens](https://github.com/settings/tokens) con el scope `models: read` | `gpt-4o-mini` |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | `gemini-1.5-flash` |

```bash
# .env
GITHUB_TOKEN=your-key-here
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `image-caption-generator/` existe con un `pyproject.toml`, y `Pillow`, `requests`, `click` y `python-dotenv` están instalados.
- ✅ Tienes un archivo `.env` con una clave de API válida, no pegada en ningún script.

## Paso 1: Carga y preprocesa imágenes

Las APIs de visión tienen límites de tamaño, enviar una foto cruda de 20 MB desperdicia ancho de banda y puede ser rechazada. El preprocesamiento carga la imagen, la redimensiona a una dimensión razonable y la convierte a un formato que la API acepta (JPEG o PNG codificado en base64).

### 1.1 Carga y redimensiona una imagen

**👟 Pista inicial :** Crea `caption/preprocess.py` con una función que cargue una imagen y la redimensione para que quepa dentro de 1024×1024 píxeles.

```python
# caption/preprocess.py
from PIL import Image
import base64
from io import BytesIO
from pathlib import Path

MAX_DIMENSION = 1024

def load_and_resize(image_path: str) -> Image.Image:
    """Load an image and resize it to fit within MAX_DIMENSION."""
    img = Image.open(image_path)
    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
    return img

def image_to_base64(img: Image.Image, format: str = "JPEG") -> str:
    """Convert a PIL Image to a base64-encoded string."""
    buffer = BytesIO()
    img.convert("RGB").save(buffer, format=format)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
```

El método `thumbnail` redimensiona la imagen conservando su relación de aspecto, una foto de 4000×3000 se convierte en 1024×768, no en un 1024×1024 distorsionado. La llamada `convert("RGB")` garantiza que la imagen esté en un formato que JPEG pueda codificar, incluso si el original era RGBA (PNG transparente) o en escala de grises. La cadena base64 es lo que la API espera en el cuerpo de la solicitud.

**🎯 Resultado esperado :** `load_and_resize("photo.jpg")` devuelve una imagen PIL con ambas dimensiones ≤ 1024. `image_to_base64(img)` devuelve una cadena larga de caracteres (A-Z, a-z, 0-9, +, /).

**🩹 Si sale mal :** Si `thumbnail` no redimensiona, la imagen ya es más pequeña que el máximo, ese es el comportamiento correcto, no un bug. Si la codificación `base64` falla, el formato de la imagen puede no ser compatible con PIL.

### 1.2 Verifica el preprocesamiento

```python
from caption.preprocess import load_and_resize, image_to_base64
from PIL import Image

# Create a test image
img = Image.new("RGB", (2000, 1500), color="red")
img.save("/tmp/test_large.jpg")

# Resize
small = load_and_resize("/tmp/test_large.jpg")
assert small.width <= 1024
assert small.height <= 1024

# Encode
b64 = image_to_base64(small)
assert len(b64) > 100  # base64 string is non-trivial
```

**🎯 Resultado esperado :** Todas las afirmaciones (assertions) pasan; la imagen redimensionada cabe dentro de 1024×1024 y la cadena base64 no está vacía.

**🩹 Si sale mal :** Si el ancho o el alto sigue por encima de 1024, `thumbnail` no se está llamando, comprueba que el método esté encadenado al objeto `img`.

### 1.3 Verifica

**✅ Lista de verificación**

- ✅ `load_and_resize` devuelve una imagen con ambas dimensiones ≤ 1024.
- ✅ Se conserva la relación de aspecto (no estirada ni aplastada).
- ✅ `image_to_base64` devuelve una cadena base64 válida.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué redimensionar a 1024×1024 en lugar de enviar la imagen a resolución completa? ¿Cuál es el costo de enviar una foto de 20 MB a una API de visión frente a una versión redimensionada de 200 KB?
- Si la imagen de entrada es una captura de pantalla (1920×1080), el thumbnail es 1024×576. ¿Qué cambiaría si necesitaras recortes cuadrados para una app de redes sociales?

## Paso 2: Envía una imagen a una API de visión y analiza la descripción

La API de visión recibe una imagen y un prompt de texto, y devuelve una descripción. Usarás el endpoint compatible con OpenAI (que funciona para GitHub Models, Gemini y otros) para enviar la imagen como un data URL en base64.

### 2.1 Escribe el llamador de la API

**👟 Pista inicial :** Crea `caption/api.py` con una función que envíe una imagen al modelo de visión y devuelva la descripción.

```python
# caption/api.py
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def get_client() -> OpenAI:
    """Create an OpenAI-compatible client for GitHub Models."""
    return OpenAI(
        api_key=os.environ.get("GITHUB_TOKEN", ""),
        base_url="https://models.github.ai/inference",
    )

def caption_image(client: OpenAI, image_b64: str, prompt: str = "Describe this image in one detailed sentence.") -> str:
    """Send a base64 image to the vision model and return the caption."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
            ],
        }],
        max_tokens=200,
    )
    return response.choices[0].message.content.strip()
```

El formato `data:image/jpeg;base64,{image_b64}` es como las APIs de visión aceptan imágenes en línea, el modelo recibe los datos de píxeles crudos codificados como texto, no una URL que deba buscar. El `max_tokens=200` mantiene las descripciones concisas. El prompt es configurable para que puedas pedir diferentes estilos de descripción ("una oración", "párrafo detallado", "texto alternativo para lectores de pantalla").

**🎯 Resultado esperado :** `caption_image(client, cadena_base64)` devuelve una cadena como "A red bicycle parked against a brick wall on a sunny afternoon."

**🩹 Si sale mal :** Si la API devuelve un error, comprueba que la variable de entorno `GITHUB_TOKEN` esté configurada. Si la respuesta está vacía, el modelo puede no admitir visión, prueba con un nombre de modelo diferente.

### 2.2 Maneja los errores con elegancia

```python
# caption/api.py (continued)
def safe_caption(client: OpenAI, image_b64: str, prompt: str = "Describe this image.") -> str:
    """Caption an image with error handling."""
    try:
        return caption_image(client, image_b64, prompt)
    except Exception as e:
        return f"[Error: {e}]"
```

**🎯 Resultado esperado :** Si la llamada a la API tiene éxito, devuelve la descripción. Si falla (error de red, clave inválida, límite de tasa), devuelve una cadena de error en lugar de fallar (crash).

**🩹 Si sale mal :** Si los errores no se capturan, falta el bloque `try/except` o el tipo de excepción no es lo suficientemente amplio.

### 2.3 Verifica

**✅ Lista de verificación**

- ✅ `caption_image` devuelve una cadena (la descripción) para una imagen válida.
- ✅ `safe_caption` devuelve un mensaje de error en lugar de fallar ante un error.
- ✅ El cliente se puede crear desde un archivo `.env` sin codificar (hardcodear) la clave.

**🤔 Pregunta(s) socrática(s)**

- La descripción es una cadena. Si quisieras salida estructurada (objetos, colores, tipo de escena), ¿cómo cambiarías el prompt para obtener JSON analizable del modelo?
- Si envías la misma imagen dos veces con prompts diferentes, obtienes descripciones diferentes. ¿Cómo harías un benchmark para saber qué prompt produce las descripciones más útiles para tu caso de uso?

## Paso 3: Construye un procesador por lotes con seguimiento de progreso

Generar la descripción de una imagen es directo; generar la de un directorio de 500 imágenes necesita seguimiento de progreso, manejo de errores por imagen y un resumen de lo que funcionó.

### 3.1 Escribe el procesador por lotes

**👟 Pista inicial :** Crea `caption/batch.py` con una función que procese un directorio de imágenes.

```python
# caption/batch.py
from pathlib import Path
from caption.preprocess import load_and_resize, image_to_base64
from caption.api import get_client, safe_caption

def caption_directory(
    directory: str,
    extensions: tuple[str, ...] = (".jpg", ".jpeg", ".png", ".webp"),
) -> list[dict]:
    """Caption all images in a directory. Returns a list of {path, caption, error} dicts."""
    client = get_client()
    results = []
    image_files = sorted(
        p for p in Path(directory).iterdir()
        if p.suffix.lower() in extensions
    )
    total = len(image_files)
    for i, path in enumerate(image_files, 1):
        print(f"[{i}/{total}] {path.name}...", end=" ", flush=True)
        try:
            img = load_and_resize(str(path))
            b64 = image_to_base64(img)
            caption = safe_caption(client, b64)
            results.append({"path": str(path), "caption": caption, "error": None})
            print("OK")
        except Exception as e:
            results.append({"path": str(path), "caption": None, "error": str(e)})
            print(f"FAIL: {e}")
    print(f"\nDone: {total - len([r for r in results if r['error']])}/{total} succeeded")
    return results
```

La función recorre el directorio, filtra por extensión de imagen y procesa cada archivo con un contador de progreso. El `end=" "` y `flush=True` en el print mantienen el progreso en una sola línea. Cada resultado es un diccionario con la ruta, la descripción y el error (si lo hay), esto facilita filtrar los éxitos de los fallos después.

**🎯 Resultado esperado :** Para un directorio con 5 imágenes, la salida muestra `[1/5] photo1.jpg... OK` hasta `[5/5] photo5.jpg... OK`, terminando con "Done: 5/5 succeeded".

**🩹 Si sale mal :** Si no se encuentran archivos, comprueba que la ruta sea correcta y que los archivos tengan extensiones de imagen. Si todos los archivos fallan con el mismo error, la clave de API probablemente sea inválida.

### 3.2 Añade limitación de tasa

```python
# caption/batch.py (continued)
import time

def caption_directory_with_delay(
    directory: str,
    delay_seconds: float = 1.0,
    **kwargs,
) -> list[dict]:
    """Caption with a delay between API calls to respect rate limits."""
    client = get_client()
    results = []
    image_files = sorted(
        p for p in Path(directory).iterdir()
        if p.suffix.lower() in kwargs.get("extensions", (".jpg", ".jpeg", ".png", ".webp"))
    )
    total = len(image_files)
    for i, path in enumerate(image_files, 1):
        print(f"[{i}/{total}] {path.name}...", end=" ", flush=True)
        try:
            img = load_and_resize(str(path))
            b64 = image_to_base64(img)
            caption = safe_caption(client, b64)
            results.append({"path": str(path), "caption": caption, "error": None})
            print("OK")
        except Exception as e:
            results.append({"path": str(path), "caption": None, "error": str(e)})
            print(f"FAIL: {e}")
        if i < total:
            time.sleep(delay_seconds)
    return results
```

Los proveedores de API de nivel gratuito suelen tener límites de tasa (solicitudes por minuto). La llamada `time.sleep(delay_seconds)` entre solicitudes evita que alcances esos límites y te apliquen throttling. Un segundo entre solicitudes es suficientemente conservador para la mayoría de los proveedores.

**🎯 Resultado esperado :** El procesador por lotes hace una pausa breve entre cada imagen, y todas las solicitudes tienen éxito sin errores 429 (límite de tasa).

**🩹 Si sale mal :** Si sigues alcanzando los límites de tasa, aumenta el retraso. Si el lote es demasiado lento, dismínyelo, pero vigila los errores.

### 3.3 Verifica

**✅ Lista de verificación**

- ✅ `caption_directory` procesa todos los archivos de imagen de un directorio.
- ✅ El progreso se imprime como `[i/total] nombre_de_archivo... OK/FAIL`.
- ✅ Los resultados incluyen tanto descripciones exitosas como mensajes de error.

**🤔 Pregunta(s) socrática(s)**

- Si un lote de 1000 imágenes se interrumpe a la mitad (error de red, Ctrl+C), ¿cómo lo reanudarías desde donde quedó en lugar de volver a generar las descripciones de las primeras 500?
- El procesador por lotes imprime el progreso en stdout. Para una herramienta real, ¿cómo añadirías una barra de progreso (como `tqdm`) que muestre ETA y rendimiento?

## Paso 4: Incrusta las descripciones en los metadatos EXIF de las imágenes

Guardar las descripciones como archivos de texto separados es frágil, la descripción se separa de la imagen. Los metadatos EXIF están incrustados en el propio archivo de imagen, así que la descripción viaja con la imagen a dondequiera que vaya.

### 4.1 Escribe metadatos EXIF

**👟 Pista inicial :** Crea `caption/metadata.py` con una función que escriba una descripción en el campo EXIF UserComment de una imagen.

```python
# caption/metadata.py
from PIL import Image
from PIL.ExifTags import Base as ExifBase
import piexif

def write_caption_to_exif(image_path: str, caption: str, output_path: str | None = None):
    """Write a caption into an image's EXIF UserComment field."""
    output = output_path or image_path
    img = Image.open(image_path)

    # Build EXIF data
    exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}}

    # UserComment tag (0x9286)
    exif_dict["Exif"][piexif.ExifIFD.UserComment] = caption.encode("utf-8")

    # Write back
    exif_bytes = piexif.dump(exif_dict)
    img.save(output, exif=exif_bytes, quality=95)
    print(f"Caption written to {output}")
```

La etiqueta EXIF `UserComment` (0x9286) es el campo estándar para metadatos de texto arbitrarios en imágenes. Usar `piexif` te da acceso directo a la estructura EXIF cruda en lugar de depender del soporte EXIF limitado de Pillow. El parámetro `output_path` te permite escribir en un archivo nuevo en lugar de modificar el original.

**🎯 Resultado esperado :** `write_caption_to_exif("photo.jpg", "A sunset over the ocean")` guarda la imagen con la descripción incrustada en sus datos EXIF.

**🩹 Si sale mal :** Si `piexif` no está instalado, añádelo: `uv add piexif`. Si los datos EXIF se pierden después de guardar, el parámetro `quality` puede estar causando una re-codificación, prueba con `quality=100`.

### 4.2 Lee las descripciones EXIF

```python
# caption/metadata.py (continued)
def read_caption_from_exif(image_path: str) -> str | None:
    """Read the caption from an image's EXIF UserComment field."""
    try:
        img = Image.open(image_path)
        exif = img.getexif()
        if piexif.ExifIFD.UserComment in exif:
            return exif[piexif.ExifIFD.UserComment].decode("utf-8")
    except Exception:
        pass
    return None
```

**🎯 Resultado esperado :** Leer la descripción de vuelta devuelve la cadena exacta que se escribió.

**🩹 Si sale mal :** Si la lectura devuelve `None` después de escribir, el número de la etiqueta EXIF puede no coincidir, comprueba `piexif.ExifIFD.UserComment`.

### 4.3 Verifica

**✅ Lista de verificación**

- ✅ `write_caption_to_exif` incrusta la descripción en el archivo de imagen.
- ✅ `read_caption_from_exif` devuelve la cadena de descripción exacta.
- ✅ La imagen modificada es visualmente idéntica a la original.

**🤔 Pregunta(s) socrática(s)**

- La mayoría de las plataformas de redes sociales y aplicaciones de mensajería eliminan los metadatos EXIF. Si necesitaras que las descripciones sobrevivieran a la subida, ¿dónde más las almacenarías?
- Si quisieras incrustar descripciones en varios idiomas, ¿cómo las almacenarías en EXIF sin sobrescribir el idioma anterior?

## Paso 5: Construye el CLI

Conecta todo con comandos para generar la descripción de una sola imagen, el procesamiento por lotes y las operaciones de metadatos.

### 5.1 Construye el CLI

**👟 Pista inicial :** Crea `caption/cli.py` con los subcomandos `caption`, `batch` y `embed`.

```python
# caption/cli.py
import json
import click
from caption.preprocess import load_and_resize, image_to_base64
from caption.api import get_client, safe_caption
from caption.batch import caption_directory
from caption.metadata import write_caption_to_exif

@click.group()
def cli():
    """Image Caption Generator — caption images with AI vision models."""
    pass

@cli.command()
@click.argument("image_path", type=click.Path(exists=True))
@click.option("--prompt", default="Describe this image in one detailed sentence.")
def caption(image_path, prompt):
    """Generate a caption for a single image."""
    client = get_client()
    img = load_and_resize(image_path)
    b64 = image_to_base64(img)
    result = safe_caption(client, b64, prompt)
    click.echo(f"Caption: {result}")

@cli.command()
@click.argument("directory", type=click.Path(exists=True))
@click.option("--output", "-o", default="captions.json", help="Output JSON file")
def batch(directory, output):
    """Caption all images in a directory."""
    results = caption_directory(directory)
    with open(output, "w") as f:
        json.dump(results, f, indent=2)
    click.echo(f"Results saved to {output}")

@cli.command()
@click.argument("image_path", type=click.Path(exists=True))
@click.option("--caption-text", "-c", required=True, help="Caption to embed")
def embed(image_path, caption_text):
    """Embed a caption into an image's EXIF metadata."""
    write_caption_to_exif(image_path, caption_text)
    click.echo("Caption embedded successfully")

if __name__ == "__main__":
    cli()
```

Los tres comandos corresponden a los tres casos de uso principales: generar la descripción de una imagen (prueba rápida), generar la de un directorio (trabajo por lotes) e incrustar una descripción (gestión de metadatos). Cada comando delega en el código de la librería e imprime un resultado legible para humanos.

**🎯 Resultado esperado :** `uv run python -m caption.cli caption photo.jpg` imprime "Caption: A red bicycle parked against a wall."

**🩹 Si sale mal :** Si `get_client()` falla, revisa tu archivo `.env`. Si la ruta de la imagen no se encuentra, ejecuta el comando desde el directorio que contiene la imagen.

### 5.2 Prueba de humo de punta a punta

```python
from caption.preprocess import load_and_resize, image_to_base64
from caption.metadata import write_caption_to_exif, read_caption_from_exif
from PIL import Image

# Create a test image
img = Image.new("RGB", (800, 600), color="blue")
img.save("/tmp/test_caption.jpg")

# Preprocess
small = load_and_resize("/tmp/test_caption.jpg")
b64 = image_to_base64(small)
assert len(b64) > 100

# Metadata round-trip
write_caption_to_exif("/tmp/test_caption.jpg", "A blue rectangle")
capt = read_caption_from_exif("/tmp/test_caption.jpg")
assert capt == "A blue rectangle"
```

Esto prueba el pipeline completo: crear, preprocesar, codificar, incrustar y leer de vuelta. Cada pieza se probó individualmente; esto confirma que la entrega entre ellas es limpia.

**🎯 Resultado esperado :** Todas las afirmaciones pasan; la descripción hace el recorrido completo a través de los metadatos EXIF.

**🩹 Si sale mal :** Si la lectura EXIF falla, comprueba que `piexif` esté instalado y que el archivo no se haya corrompido con la escritura.

### 5.3 Verifica

**✅ Lista de verificación**

- ✅ `caption` genera una descripción de texto para una sola imagen.
- ✅ `batch` procesa todas las imágenes de un directorio y guarda los resultados en JSON.
- ✅ `embed` escribe una descripción en los metadatos EXIF que se puede leer de vuelta.

**🤔 Pregunta(s) socrática(s)**

- Si quisieras generar descripciones de imágenes desde URLs en lugar de archivos locales, ¿qué cambiaría del paso de preprocesamiento?
- ¿Cómo añadirías un comando `--compare` que genere la descripción de la misma imagen con dos prompts diferentes y muestre las diferencias lado a lado?

## ⚠️ Errores comunes

- **Enviar imágenes a resolución completa a la API.** Una foto de 20 MB desperdicia ancho de banda, cuesta más tokens y puede exceder el límite de tamaño de la API. Redimensiona siempre a ≤ 1024 píxeles en el lado más largo antes de enviar.
- **Olvidar que los datos EXIF se eliminan al subir.** La mayoría de las plataformas de redes sociales y aplicaciones de mensajería eliminan los metadatos EXIF. Si tus descripciones necesitan sobrevivir a la subida, guárdalas también en un archivo sidecar o en una base de datos.
- **No manejar los límites de tasa de la API en modo lote.** Los proveedores de nivel gratuito limitan las solicitudes por minuto. Sin un retraso entre solicitudes en el procesamiento por lotes, recibirás errores 429 después de unas pocas imágenes.
- **Enviar imágenes RGBA a la codificación JPEG.** JPEG no admite transparencia. La llamada `convert("RGB")` en `image_to_base64` maneja esto, pero olvidarla causa el error `cannot write mode RGBA as JPEG`.
- **Confiarte de la primera descripción como verdad absoluta.** Los modelos de visión a veces alucinan objetos que no están en la imagen o pasan por alto detalles obvios. Para uso en producción, añadirías un paso de verificación o revisión humana.

## Lo que acabas de construir

Un generador de descripciones de imágenes que toma cualquier imagen y produce una descripción legible para humanos usando un modelo de visión de nivel gratuito. El pipeline, preprocesar, codificar, generar descripción, incrustar metadatos, maneja el ciclo de vida completo del texto alternativo generado por IA. El procesador por lotes convierte una carpeta de cientos de imágenes en un archivo JSON de descripciones en minutos, y la incrustación EXIF garantiza que las descripciones permanezcan unidas a sus imágenes.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/image-caption-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/image-caption-generator) en el repositorio del curso tiene una versión más rica con soporte de múltiples proveedores, imágenes de muestra y el CLI conectado de punta a punta. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Añade un modo `--compare` que envíe la misma imagen a dos modelos diferentes y muestre las descripciones lado a lado para comparar la calidad.
- Construye una interfaz web con Gradio o Streamlit que te permita arrastrar y soltar imágenes y ver las descripciones al instante.
- Implementa una puntuación de calidad de descripciones: usa un segundo modelo para calificar la precisión, el detalle y la gramática de la descripción en una escala del 1 al 5.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓