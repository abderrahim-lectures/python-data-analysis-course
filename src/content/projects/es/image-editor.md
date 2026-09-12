---
title: "Editor de Imágenes"
description: "Procesa imágenes con filtros, redimensionado, marcas de agua, conversión de formato y operaciones por lotes."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["pillow", "image-processing", "filters", "batch-processing"]
learningObjectives:
  - "Cargar, inspeccionar y guardar imágenes en múltiples formatos con Pillow"
  - "Aplicar filtros y mejoras a través de una única tabla de despacho"
  - "Redimensionar y recortar conservando las relaciones de aspecto"
  - "Añadir marcas de agua de texto e imagen con transparencia"
  - "Procesar por lotes directorios enteros de imágenes"
prerequisites:
  - "Bases de Python (funciones, bucles, diccionarios)"
  - "Entrada/salida de archivos y trabajo con carpetas"
---

# 🛠️ 🖼️ Construye un Kit de Herramientas para Edición de Imágenes

Todos los dispositivos se llenan de fotos que necesitan el mismo tratamiento, un redimensionado aquí, una marca de agua allá, un aumento de brillo en todas partes. Este proyecto construye un kit de procesamiento de imágenes con Pillow que puede cargar e inspeccionar imágenes, aplicar filtros y mejoras de color, recortar y redimensionar sin distorsión, añadir marcas de agua transparentes y procesar una carpeta entera de imágenes en una sola pasada.

Esto asume Python 101 y comodidad básica con archivos y carpetas, no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Cargar imágenes reales e inspeccionar su formato, dimensiones y modo de color.
2. Aplicar efectos de desenfoque, nitidez, bordes, brillo y saturación a través de una única tabla de despacho.
3. Redimensionar y recortar sin estirar, conservando la relación de aspecto.
4. Añadir una marca de agua de texto semitransparente y la superposición de un logo de imagen.
5. Procesar por lotes toda tu carpeta de imágenes con un bucle.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal. Pillow es una librería nativa, sus rutas de `resize`, `filter` y decodificación se enlazan contra códecs de imagen compilados, y se instala limpiamente con `uv add`, dándote el toolkit completo más el sistema de archivos real que quiere el procesamiento por lotes.

**Los notebooks de Google Colab y Binder** también funcionan bien: el notebook refleja cada paso, Pillow se instala con un solo `!pip install Pillow`, y puedes subir una foto o usar las mismas imágenes de prueba deterministas que genera la configuración. **JupyterLite** es el único camino a evitar: ejecuta Python en el navegador sin una capa de paquetes nativa, así que Pillow no puede instalarse ahí, usa las insignias de notebook de abajo o el camino local.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-editor/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-editor/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fimage-editor%2Fnotebook.es.ipynb)

## Configuración

Crea el proyecto e instala Pillow, luego genera tres imágenes de prueba deterministas para que cada paso de este proyecto tenga material con el que trabajar, sin necesidad de internet ni de fotos personales.

```bash
uv init image-editor
cd image-editor
uv add Pillow
```

**👟 Pista inicial :** Escribe la configuración como un pequeño script que puedas volver a ejecutar: crea una carpeta y dibuja unas cuantas formas de colores por imagen, para que siempre tengas entradas frescas y conocidas.

```python
# make_sample_images.py
from pathlib import Path
from PIL import Image, ImageDraw
import random

def make_sample_images(output: str = "input_photos", count: int = 3, size: int = 480) -> None:
    """Generate `count` deterministic RGB test images for the editor to chew on."""
    out = Path(output)
    out.mkdir(parents=True, exist_ok=True)
    for i in range(1, count + 1):
        rng = random.Random(i)
        img = Image.new("RGB", (size, size), (rng.randint(20, 60), rng.randint(20, 60), rng.randint(20, 60)))
        draw = ImageDraw.Draw(img)
        for _ in range(rng.randint(6, 12)):
            x0, y0 = rng.randint(0, size), rng.randint(0, size)
            x1, y1 = rng.randint(x0, size), rng.randint(y0, size)
            color = (rng.randint(80, 255), rng.randint(80, 255), rng.randint(80, 255))
            if rng.random() < 0.5:
                draw.rectangle((x0, y0, x1, y1), fill=color)
            else:
                draw.ellipse((x0, y0, x1, y1), fill=color)
        img.save(out / f"photo{i}.jpg", quality=92)
    print(f"Generated {count} test images in {output}/")

make_sample_images()
```

El truco clave es `random.Random(i)`, un generador *sembrado por imagen* en lugar del global. Debido a que cada llamada vuelve a sembrar con el mismo `i`, ejecutar este script dos veces produce carpetas idénticas byte a byte, lo que significa que tus resultados esperados y tus comprobaciones de fallos se mantienen reproducibles en lugar de cambiar de forma en cada ejecución. `Image.new("RGB", (size, size), color)` inicia cada imagen como un fondo plano, y los proxies de `ImageDraw` (`draw.rectangle`, `draw.ellipse`) pintan las formas, tu primer sabor del bucle de Pillow de "abre una imagen, obtén una superficie de dibujo, guarda".

**🎯 Resultado esperado :** Una carpeta nueva `input_photos/` que contiene `photo1.jpg`, `photo2.jpg` y `photo3.jpg`, cada una de 480×480, y volver a ejecutar el script imprime el mismo mensaje sin cambiar ningún píxel.

**🩹 Si sale mal :** Si la carpeta está vacía, falta la línea `mkdir(parents=True, exist_ok=True)`, o la ruta de `save` no une `output` con el nombre del archivo. Si las imágenes cambian en cada ejecución, el generador no está sembrado por archivo, vuelve a poner `random.Random(i)` dentro del bucle.

**✅ Lista de verificación**

- ✅ `uv run python --version` funciona y `uv add Pillow` se instaló limpiamente.
- ✅ `input_photos/` contiene `photo1.jpg`, `photo2.jpg` y `photo3.jpg` (480×480 cada una).
- ✅ Las imágenes se ven distintas entre sí y son estables entre ejecuciones.

## Paso 1: Carga e inspecciona una imagen

Antes de editar una foto necesitas saber qué tienes entre manos: el formato, las dimensiones y el modo de color. Pillow abre una imagen de forma perezosa (lazy), lee el encabezado pero no decodifica los píxeles hasta que se le fuerza, así que este paso construye un cargador que detecta los problemas *temprano* e inspecciona lo que cargó.

### 1.1 Escribe un cargador seguro

**👟 Pista inicial :** `Image.open` puede tener éxito con un archivo que luego no se puede decodificar, así que fuerza la decodificación con `img.load()` dentro del mismo bloque protegido y lanza una excepción ante cualquier cosa inusual.

```python
# editor.py
from PIL import Image, ImageFilter, ImageEnhance

def load_image(path: str) -> Image.Image:
    """Load an image and handle common errors."""
    try:
        img = Image.open(path)
        img.load()  # force a real decode, so corrupt files fail here, not later
        return img
    except FileNotFoundError:
        print(f"Error: File '{path}' not found.")
        raise
    except Exception as e:
        print(f"Error loading image: {e}")
        raise

img = load_image("input_photos/photo1.jpg")
print(f"Format: {img.format}")
print(f"Size:   {img.width}x{img.height} pixels")
print(f"Mode:   {img.mode}")  # RGB, RGBA, L, etc.
```

La llamada `img.load()` después de `Image.open` es el núcleo filosófico de este bloque. `Image.open` solo lee el encabezado del archivo; los datos de los píxeles se decodifican de forma perezosa en el primer uso, lo que significa que un archivo truncado puede fallar en lo profundo de una llamada posterior a `save()` con un error confuso. Llamar a `.load()` dentro del `try` fuerza a que la decodificación suceda *ahora*, donde el bloque `except` puede informarla claramente. El `except FileNotFoundError` separado te da un mensaje específico y honesto de que el problema es un nombre de archivo faltante.

**🎯 Resultado esperado :** `Format: JPEG`, `Size:   480x480 pixels`, `Mode:   RGB`, y cargar una ruta inexistente imprime `Error: File '...' not found.` antes del traceback.

**🩹 Si sale mal :** Si solo obtienes `Format: None`, abriste la imagen pero nunca accediste a los datos de los píxeles, o guardaste una imagen nueva sin un formato explícito, cargar JPEG/PNG desde el disco siempre reporta un formato. Si un archivo genuinamente corrupto falla más tarde en un `save()`, `img.load()` no está dentro del `try`. Si el modo imprime `RGBA` o `L`, eso es correcto para tu entrada, no un bug, solo ten en cuenta que el modo mostrado difiere según el tipo de archivo.

### 1.2 Recorre toda la carpeta

**👟 Pista inicial :** Recorre con el cargador seguro cada JPEG de la carpeta e imprime una línea de inspección por cada uno, para que confirmes que todo el portafolio es cargable antes de editar nada.

```python
# editor.py (continued)
from pathlib import Path

for path in sorted(Path("input_photos").glob("*.jpg")):
    info = load_image(str(path))
    print(f"{path.name:12} {info.width}x{info.height} {info.mode}")
```

`Path("input_photos").glob("*.jpg")` devuelve un iterable de rutas de archivo; envolver cada una en `str()` y pasarla a `load_image` mantiene un único punto de entrada bien probado para abrir archivos. Recorrer aquí también detecta temprano un modo de fallo de toda la carpeta: si una imagen está corrupta, la encuentras en un informe de tres líneas en lugar de a mitad de un lote de trescientos archivos.

**🎯 Resultado esperado :** Tres líneas, `photo1.jpg    480x480 RGB`, `photo2.jpg    480x480 RGB`, `photo3.jpg    480x480 RGB`.

**🩹 Si sale mal :** Si ningún archivo coincide, estás haciendo glob del directorio equivocado o el filtro es `*.png` mientras que la configuración escribió `.jpg`. Si una línea lanza un error, ese archivo en particular está corrupto o es ilegible, una extensión `.jpg` falsa en un archivo de texto reproduce esto perfectamente.

### 1.3 Verifica

**✅ Lista de verificación**

- ✅ `load_image("input_photos/photo1.jpg")` devuelve una imagen e imprime su formato, tamaño y modo reales.
- ✅ Una ruta faltante cae en la rama `FileNotFoundError` con el mensaje claro.
- ✅ El bucle de la carpeta imprime las tres imágenes sin un traceback.

**🤔 Pregunta(s) socrática(s)**

- `img.load()` existe porque `Image.open` es perezoso. ¿Qué fallo específico, y en qué punto del programa, se vuelve mucho más difícil de diagnosticar si omites `load()` y dejas que la decodificación ocurra dentro de un `save()` posterior?
- La misma función `load_image` sirve tanto para el caso de imagen única como para el bucle de carpeta. ¿Qué cambiaría en el manejo de errores si quisieras que la carga *por lotes* reuniera los fallos y continuara, en lugar de lanzar una excepción en el primer archivo malo?

## Paso 2: Aplica filtros y mejoras

Pillow trae dos familias de ajustes: `ImageFilter`, que transforma los píxeles (desenfoque, nitidez, detección de bordes), e `ImageEnhance`, que escala aspectos de la imagen (brillo, contraste, color). Este paso las envuelve en una función que despacha por nombre y encadena dos efectos en una imagen final.

### 2.1 Construye la tabla de despacho de filtros

**👟 Pista inicial :** Pon la correspondencia de nombre → operación en un `dict` cuyos valores son pequeños callables, para que añadir un filtro nuevo después signifique añadir una línea, no otra rama `if`.

```python
# editor.py (continued)
def apply_filter(img: Image.Image, filter_name: str, **kwargs) -> Image.Image:
    """Apply a named filter to an image, returning a new image."""
    filters = {
        "blur": lambda: img.filter(ImageFilter.GaussianBlur(radius=kwargs.get("radius", 5))),
        "sharpen": lambda: img.filter(ImageFilter.SHARPEN),
        "edge": lambda: img.filter(ImageFilter.FIND_EDGES),
        "emboss": lambda: img.filter(ImageFilter.EMBOSS),
        "brightness": lambda: ImageEnhance.Brightness(img).enhance(kwargs.get("factor", 1.5)),
        "contrast": lambda: ImageEnhance.Contrast(img).enhance(kwargs.get("factor", 1.5)),
        "saturation": lambda: ImageEnhance.Color(img).enhance(kwargs.get("factor", 2.0)),
    }
    if filter_name not in filters:
        raise ValueError(f"Unknown filter: {filter_name}. Available: {', '.join(filters)}")
    return filters[filter_name]()
```

El `dict` de lambdas es una **tabla de despacho**: la clave *es* la rama, así que la búsqueda `filters[filter_name]()` reemplaza una larga cadena de `if/elif`. Los nombres desconocidos fallan con un error ruidoso (`ValueError`) en lugar de devolver silenciosamente la imagen sin cambios, que es lo que hace visibles los errores tipográficos en el procesamiento por lotes. Cada mejora envuelve la imagen *actual* y `.enhance(factor)` multiplica esa propiedad, un factor por encima de `1.0` la fortalece, por debajo de `1.0` la debilita.

**🎯 Resultado esperado :** `apply_filter(img, "blur", radius=8)` devuelve una imagen más suave; `apply_filter(img, "edge")` devuelve una imagen casi negra con contornos brillantes. `apply_filter(img, "nope")` lanza `ValueError: Unknown filter: nope. Available: blur, sharpen, edge, emboss, brightness, contrast, saturation`.

**🩹 Si sale mal :** Si `GaussianBlur` no se encuentra, importaste solo `ImageEnhance` en este bloque, `ImageFilter` debe estar en la misma línea `from PIL import ...` (o añadirse). Si el resultado de "edge" se ve como el original, estás reutilizando un original mostrable en lugar de la imagen *devuelta*, reasigna siempre `img = apply_filter(img, ...)` en una cadena.

### 2.2 Encadena dos efectos y guarda

**👟 Pista inicial :** Aplica un aumento de brillo, luego enfoca el *resultado*, y guarda con un ajuste de calidad JPEG, demostrando que los filtros componen cuando cada uno devuelve una imagen.

```python
# editor.py (continued)
bright = apply_filter(img, "brightness", factor=1.3)
sharp = apply_filter(bright, "sharpen")
sharp.save("enhanced.jpg", quality=95)
print("Saved enhanced.jpg")
```

El encadenamiento funciona porque cada filtro devuelve una imagen nueva en lugar de mutar la entrada, `sharp = apply_filter(bright, ...)` lee la salida *anterior* como su entrada. El argumento `quality=95` en `save()` importa específicamente para JPEG: intercambia tamaño de archivo por fidelidad, y a diferencia de PNG (sin pérdida, sin perilla de calidad), elegir un valor sensato es parte de producir una salida aceptable.

**🎯 Resultado esperado :** `Saved enhanced.jpg`, y el archivo nuevo es visiblemente más brillante y nítido que `photo1.jpg` al abrirlo.

**🩹 Si sale mal :** Si la imagen guardada se ve idéntica a la fuente, la cadena pasó `img` a ambas llamadas en lugar de pasar `bright` a la segunda. Si `save` lanza un error por el modo, la imagen fuente no es RGB (es `L` o `RGBA`), JPEG acepta RGB; conviértela con `.convert("RGB")` primero.

### 2.3 Verifica

**✅ Lista de verificación**

- ✅ `blur`, `sharpen`, `edge`, `emboss`, `brightness`, `contrast` y `saturation` producen todas imágenes visiblemente diferentes.
- ✅ Un nombre de filtro desconocido lanza un `ValueError` que lista los nombres válidos.
- ✅ La cadena de dos efectos guardó `enhanced.jpg`.

**🤔 Pregunta(s) socrática(s)**

- Las lambdas del dict de despacho capturan cada una `img` del ámbito envolvente. Si llamaras a `apply_filter` sin imagen y una lambda posterior referenciara `img`, ¿cuándo surgiría el error, y qué te dice eso sobre cuán ansiosamente se evalúa un dict de lambdas?
- `brightness` y `contrast` ambos vienen por defecto con `factor=1.5`. ¿Por qué un factor de `1.0` es el valor "neutral" para `ImageEnhance`, y en qué se diferencia de lo que un filtro como `FIND_EDGES` (que no tiene factor en absoluto) hace conceptualmente en su lugar?

## Paso 3: Redimensiona y recorta sin distorsión

Estirar una imagen para que quepa en un ancho produce el clásico aspecto de foto aplastada; redimensionar proporcionalmente no. Este paso construye un redimensionado que conserva la relación de aspecto y un recorte que toma el centro de la imagen, las dos operaciones detrás de cada miniatura y de cada hero de sitio web.

### 3.1 Redimensiona conservando la relación de aspecto

**👟 Pista inicial :** Calcula la relación entre el ancho objetivo y el ancho actual, aplícala a la altura, y pasa el tamaño nuevo completo a `resize` con un filtro de remuestreo de alta calidad.

```python
# editor.py (continued)
def resize_keep_ratio(img: Image.Image, max_width: int) -> Image.Image:
    """Resize to max_width, keeping the aspect ratio."""
    ratio = max_width / img.width
    new_height = int(img.height * ratio)
    return img.resize((max_width, new_height), Image.LANCZOS)

small = resize_keep_ratio(load_image("input_photos/photo1.jpg"), 640)
print(f"resized -> {small.size}")
```

Toda la idea vive en un paso aritmético: `ratio = max_width / img.width` te da la escala, y multiplicar la altura por esa misma relación garantiza que el ancho y la altura se reduzcan juntos, sin distorsión. `Image.LANCZOS` solicita el mejor filtro de reducción de muestreo de Pillow, lo cual importa sobre todo al encoger (suaviza los bordes irregulares). Esta es la receta canónica sin dimensiones de "caber dentro de un ancho" usada por todo generador de miniaturas.

**🎯 Resultado esperado :** `resized -> (640, 640)`, la imagen de prueba de 480×480 escala al ancho 640 con altura 640, relación intacta (pruébalo sobre el original y verifica que `height/width` no cambia).

**🩹 Si sale mal :** Si el resultado tiene una relación distinta a la fuente, `new_height` no se calculó desde `img.height * ratio`. Si obtienes `AttributeError: 'Image' object has no attribute 'resize'`, el objeto que se pasa no es una imagen de Pillow, pasa el resultado de `load_image(...)` directamente a esta función. Si `Image.LANCZOS` lanza un error en versiones muy antiguas de Pillow, actualiza Pillow (la constante es un alias de larga data).

### 3.2 Recorta el cuadrado central

**👟 Pista inicial :** Para una longitud de lado solicitada, calcula el recuadro que se centra sobre la imagen, y luego entrega esa tupla de cuatro a `crop`, recortar nunca redimensiona, solo rebana.

```python
# editor.py (continued)
def crop_center_square(img: Image.Image, side: int) -> Image.Image:
    """Crop the center square of `side` pixels from the middle of an image."""
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    return img.crop((left, top, left + side, top + side))

thumb = crop_center_square(load_image("input_photos/photo1.jpg"), 240)
thumb.save("thumb.jpg", quality=95)
print(f"thumb -> {thumb.size}")
```

`crop` toma un recuadro `(left, top, right, bottom)` y devuelve la rebanada, manteniendo la misma resolución de píxeles dentro de él, por eso una miniatura hecha de esta manera es *nítida*: recortas al centro *y luego* reduces la escala si quieres un cuadrado pequeño. La división entera `// 2` centra la ventana distribuyendo cualquier resto impar de forma uniforme. Este patrón de "encuentra el recuadro, mantenlo cuadrado" es el comportamiento de recorte de avatar por defecto en la mayoría de las apps.

**🎯 Resultado esperado :** `thumb -> (240, 240)`, guardado como `thumb.jpg`, mostrando la parte media del original en lugar de su esquina superior izquierda.

**🩹 Si sale mal :** Si el recorte no está centrado, uno de `left`/`top` usa división flotante con `/` simple, produciendo coordenadas fraccionarias. Si `side` excede la dimensión de la imagen, `left` se vuelve negativo y la ventana de recorte excede la imagen, protégete fijando un tope con `side = min(side, img.width, img.height)`. Si la miniatura es una rebanada diminuta, la aritmética del recuadro está invertida (`left + side` frente a `left - side`).

### 3.3 Verifica

**✅ Lista de verificación**

- ✅ `resize_keep_ratio(img, 640)` conserva la relación de aspecto (height/width sin cambios).
- ✅ `crop_center_square(img, 240)` devuelve una rebanada central enfocada de 240×240.
- ✅ Ambos resultados se guardan con éxito.

**🤔 Pregunta(s) socrática(s)**

- `resize_keep_ratio` redondea `new_height` con `int()`. Para un rectángulo cuya altura real escalada es fraccionaria, ¿redondear después de recortar o redimensionar produce alguna vez un error de relación de un píxel, y cuándo (si acaso) importa un solo píxel de distorsión en la práctica?
- Recortar al centro y luego reducir la escala es una forma de hacer una miniatura. ¿Cómo diferiría el *resultado visual* si primero redujeras la escala y segundo recortaras, y por qué los sistemas de avatar reales recortan antes de escalar en su lugar?

## Paso 4: Añade marcas de agua

Una marca de agua es marca (o protección de derechos de autor) que debe posarse visiblemente sobre la foto sin ocultarla. El truco en Pillow es que dibujar sobre la imagen *original* no puede producir transparencia parcial en un lienzo RGB, así que dibujas en una capa superpuesta RGBA separada y la compones.

### 4.1 Añade una marca de agua de texto transparente

**👟 Pista inicial :** Copia la imagen a RGBA, construye una superposición completamente transparente del mismo tamaño, dibuja texto blanco al 50% de alfa sobre la superposición, luego compone los dos con `alpha_composite` y aplana de vuelta a RGB para guardar.

```python
# editor.py (continued)
from PIL import ImageDraw, ImageFont

def add_text_watermark(img: Image.Image, text: str, position: str = "bottom-right") -> Image.Image:
    """Add a semi-transparent text watermark and flatten to RGB."""
    watermarked = img.copy().convert("RGBA")
    overlay = Image.new("RGBA", watermarked.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)

    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except (IOError, OSError):
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    margin = 20

    positions = {
        "bottom-right": (img.width - text_w - margin, img.height - text_h - margin),
        "bottom-left": (margin, img.height - text_h - margin),
        "top-right": (img.width - text_w - margin, margin),
        "center": ((img.width - text_w) // 2, (img.height - text_h) // 2),
    }
    x, y = positions.get(position, positions["bottom-right"])
    draw.text((x, y), text, fill=(255, 255, 255, 128), font=font)

    return Image.alpha_composite(watermarked, overlay).convert("RGB")

watermarked = add_text_watermark(load_image("input_photos/photo2.jpg"), "My Photo 2026", "bottom-right")
watermarked.save("watermarked.jpg", quality=95)
print("Saved watermarked.jpg")
```

El valor alfa en `fill=(255, 255, 255, 128)` es la recompensa: `128` en una escala RGBA de 0–255 es exactamente 50% de opacidad. Dibujar ese texto blanco semitransparente en una *superposición separada*, y luego llamar a `alpha_composite(watermarked, overlay)`, es lo que mantiene la foto de debajo intacta mientras el texto se transparenta, dibujar directamente sobre una imagen RGB tendría que reemplazar los píxeles por completo. `.convert("RGB")` al final aplana el alfa para que el codificador JPEG (que no almacena transparencia) acepte el archivo.

**🎯 Resultado esperado :** `Saved watermarked.jpg`, la foto con `My Photo 2026` flotando al 50% de opacidad en la parte inferior derecha, con un margen centrado a 20 px de los bordes.

**🩹 Si sale mal :** Si el texto es completamente sólido, el canal alfa es `255` (o el `.convert("RGB")` se ejecutó *antes* de componer, aplanando la transparencia). Si el texto queda parcialmente fuera del lienzo, `text_w`/`text_h` provienen de un `bbox` obsoleto y no coinciden con la fuente realmente usada. Si la fuente por defecto de respaldo se ve como un desenfoque de 1 píxel, la ruta de DejaVu no se encontró en tu sistema, apunta `truetype` a un archivo de fuente existente, o usa `load_default(size=...)` en Pillow 10+.

### 4.2 Superpone un logo de imagen

**👟 Pista inicial :** Reutiliza la miniatura del Paso 3 como logo, escálala a una fracción del ancho de la imagen, y pégalas con `paste` usando su propio canal alfa como máscara para que su transparencia se conserve.

```python
# editor.py (continued)
def add_image_watermark(img: Image.Image, logo: Image.Image, scale: float = 0.15, margin: int = 16) -> Image.Image:
    """Paste a scaled logo into the bottom-right corner, keeping its alpha."""
    base = img.convert("RGBA")
    logo_rgba = logo.convert("RGBA")
    new_w = max(1, int(base.width * scale))
    ratio = new_w / logo_rgba.width
    logo_rgba = logo_rgba.resize((new_w, int(logo_rgba.height * ratio)), Image.LANCZOS)
    x = base.width - logo_rgba.width - margin
    y = base.height - logo_rgba.height - margin
    base.paste(logo_rgba, (x, y), logo_rgba)  # third arg = alpha mask
    return base.convert("RGB")

logo = load_image("thumb.jpg")
with_logo = add_image_watermark(load_image("input_photos/photo3.jpg"), logo)
with_logo.save("logo_watermark.jpg", quality=95)
print("Saved logo_watermark.jpg")
```

`paste` con la imagen pasada *como su propia máscara* es la línea sutil: `base.paste(logo_rgba, (x, y), logo_rgba)` pega los píxeles, y el tercer argumento, el propio canal alfa de la imagen, decide píxel por píxel con qué fuerza se transparenta el logo. Un logo RGBA pegado sin máscara dejaría caer su rectángulo opaco; con una máscara, su transparencia sobrevive. `scale=0.15` dimensiona el logo en relación con la imagen, de modo que la misma función funciona en un archivo de prueba de 480 px y en una exportación DSLR de 6000 px.

**🎯 Resultado esperado :** `Saved logo_watermark.jpg`, `thumb.jpg` aparece en la parte inferior derecha de `photo3.jpg` a aproximadamente el 15% del ancho de la imagen, con sus esquinas sin mostrar una caja dura.

**🩹 Si sale mal :** Si el logo tiene una caja delimitadora opaca fea, falta el argumento de máscara (tercer argumento de `paste`). Si el logo es gigantesco o microscópico, `new_w` usa el ancho de la fuente en lugar de `base.width * scale`. Si el `paste` no hace nada silenciosamente, el logo fuente se cargó como una imagen *perezosa*, llama a `.load()` o referencia los píxeles antes de pegar.

### 4.3 Verifica

**✅ Lista de verificación**

- ✅ La marca de agua de texto se guarda como JPEG a ~50% de opacidad en las cuatro posiciones nombradas.
- ✅ Un logo pegado con su máscara alfa conserva las esquinas transparentes.
- ✅ Ambas salidas se abren limpiamente y el contenido de la foto sigue siendo visible bajo la marca de agua.

**🤔 Pregunta(s) socrática(s)**

- `fill=(255, 255, 255, 128)` es medio transparente. ¿Qué pasaría en términos textuales si dibujaras sobre la imagen RGB original con esa misma tupla de 4 en lugar de sobre una superposición RGBA, por qué un lienzo RGB no puede representar "a medias" en absoluto?
- La superposición es una imagen separada, completamente transparente, del mismo tamaño que la foto. ¿Por qué este diseño de dos capas en lugar de dibujar el texto una vez y guardar? ¿Qué tendrías que cambiar para re-posicionar después una marca de agua sin volver a dibujar la foto de debajo?

## Paso 5: Procesa por lotes un directorio

El sentido de un toolkit es la escala: los mismos cinco pasos, aplicados a cada imagen de una carpeta, sin abrir cada una a mano. Este paso construye el bucle que convierte tus funciones en un procesador de carpetas de un solo comando.

### 5.1 Procesa cada imagen de una carpeta

**👟 Pista inicial :** Reúne los archivos de imagen por extensión, crea una carpeta de salida y ejecuta la cadena de filtros por archivo mientras capturas los errores *por archivo* para que una imagen mala nunca aborte el lote.

```python
# editor.py (continued)
def batch_process(input_dir: str, output_dir: str, operations: list[dict]) -> None:
    """Apply a chain of named filter operations to every image in a directory."""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
    files = [f for f in Path(input_dir).iterdir() if f.suffix.lower() in extensions]

    print(f"Processing {len(files)} images...")
    for filepath in files:
        try:
            img = load_image(str(filepath))
            for op in operations:
                img = apply_filter(img, op["filter"], **op.get("params", {}))
            out_name = f"processed_{filepath.stem}.jpg"
            img.save(out / out_name, quality=90)
            print(f"  OK {filepath.name} -> {out_name}")
        except Exception as e:
            print(f"  SKIP {filepath.name}: {e}")

batch_process("input_photos", "output", [
    {"filter": "brightness", "params": {"factor": 1.2}},
    {"filter": "contrast", "params": {"factor": 1.1}},
    {"filter": "sharpen"},
])
```

El diseño que hace confiable un lote es el `try/except` interno *dentro* del bucle: un archivo corrupto, un modo equivocado, cualquier fallo por archivo imprime `SKIP photo2.jpg: ...` y el bucle continúa, una imagen mala no mata a las otras doscientas. `operations` es una lista de pequeños dicts que reutilizan exactamente el despacho de `apply_filter` del Paso 2, así que el pipeline por lotes y la ruta interactiva de imagen única comparten la misma semántica. El conjunto de extensiones más `suffix.lower()` respeta las mayúsculas (`JPG` frente a `jpg`) y omite los archivos no-imagen sueltos.

**🎯 Resultado esperado :** `Processing 3 images...` y luego una línea `OK photoN.jpg -> processed_photoN.jpg` por archivo, y una carpeta `output/` que contiene tres JPEG procesados.

**🩹 Si sale mal :** Si nada se procesa, la carpeta de salida existe pero la ruta de entrada es incorrecta o el filtro de extensiones excluye tus archivos. Si el lote se detiene en el primer error, el `try/except` está envuelto alrededor de todo el bucle en lugar de un solo archivo. Si cada salida es la versión por defecto de un filtro sin importar los `params`, falta el desempaquetado `**op.get("params", {})` en la llamada a `apply_filter`.

### 5.2 Verifica

**✅ Lista de verificación**

- ✅ Las tres imágenes de `input_photos/` se escriben en `output/` como `processed_*.jpg`.
- ✅ Un archivo deliberadamente roto en la carpeta causa una línea `SKIP` pero no detiene al resto.
- ✅ El lote usa el mismo diccionario `apply_filter` que los pasos interactivos.

**🤔 Pregunta(s) socrática(s)**

- El lote guarda cada resultado como JPEG. ¿Qué necesitarías cambiar para *conservar* el formato de origen (que PNG siga siendo PNG, que WebP siga siendo WebP), y qué te da `filepath.suffix` gratis aquí?
- `SKIP` imprime y continúa ante cualquier excepción, incondicionalmente. ¿Cuándo es *incorrecta* la elección de tragar-y-continuar, y qué tipo de contador (o de detenerse-después-de-N) permitiría al lote sacar a la superficie un problema sistémico en lugar de ocultarlo?

## ⚠️ Errores comunes

- **Guardar RGBA como JPEG.** JPEG no tiene canal alfa, así que una imagen con marca de agua (RGBA) falla o se aplana de forma impredecible. Solución: `.convert("RGB")` antes de cualquier `save()` JPEG, ambas funciones de marca de agua arriba lo hacen deliberadamente.
- **Olvidar `ImageFilter` en el import.** `from PIL import Image, ImageEnhance` funciona bien hasta que `ImageFilter.GaussianBlur` lanza `AttributeError` en lo profundo de una llamada de filtro. Solución: una línea de import para los tres (`Image`, `ImageFilter`, `ImageEnhance`), la configuración lo hace, mantenlo así.
- **Rutas de fuente específicas de la plataforma.** La ruta DejaVu es una ubicación bien conocida de Linux; en macOS o Windows `truetype` lanza un error y caes a una fuente por defecto diminuta. Solución: envuelve la búsqueda en `try/except` (como se muestra), o acepta un argumento de ruta de fuente para que los llamadores pasen la suya.
- **No reasignar los resultados encadenados.** `apply_filter(bright, "sharpen")` devuelve una imagen nueva; ignorar el retorno y guardar la variable intermedia deshace silenciosamente la mitad de la cadena. Solución: escribe siempre `img = apply_filter(img, ...)` o pasa el resultado anterior directamente a la siguiente llamada.
- **Un archivo malo que mata un lote.** Un bucle sin protección convierte un JPEG corrupto en cero salidas. Solución: mantén el `try/except` *dentro* del bucle (Paso 5), y considera registrar qué archivos se omitieron para poder inspeccionarlos después.

## Lo que acabas de construir

Un kit real de procesamiento de imágenes: carga e inspecciona imágenes de forma segura, aplica siete efectos de filtro/mejora a través de una tabla de despacho, redimensiona y recorta sin distorsión, superpone marcas de agua de texto y logo transparentes, y ejecuta toda la cadena sobre una carpeta automáticamente. La habilidad transferible es *el diseño de cadenas de transformación*: cada operación toma una imagen y devuelve una imagen, así que las ediciones individuales y los lotes de mil archivos usan bloques de construcción idénticos, el mismo patrón de composición detrás de toda librería de imágenes, desde las miniaturas hasta las suites de edición completas.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/image-editor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/image-editor) en el repositorio del curso incluye el script completo más un conversor de formato y una herramienta de comparación lado a lado. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Construye un **conversor de formato**: una función que tome una ruta de origen y una cadena de formato objetivo (`"webp"`, `"png"`) y guarde con la extensión correcta, una adición de seis líneas que convierte toda tu carpeta a WebP en una sola pasada. La pista pequeña: `img.save(path.with_suffix("." + target))` normalmente solo funciona.
- Crea una **herramienta de comparación lado a lado** que coloque las imágenes de antes y después una al lado de la otra con una línea separadora, crea un nuevo lienzo con `Image.new`, luego pega ambas imágenes sobre él en las dos mitades.
- Extrae **metadatos EXIF** (cámara, GPS, marca de tiempo) de los JPEG de smartphones con `img.getexif()`, un superpoder de solo lectura que reutiliza tu función `load_image` sin cambios.
- Añade **ajustes preestablecidos de recorte por aspecto**, `crop_center_square` ya se generaliza a recortes tipo "cover" para banners 16:9; generaliza la aritmética del recuadro una vez y cada tamaño es una llamada de función.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a hacer que las computadoras vean imágenes. 🎓