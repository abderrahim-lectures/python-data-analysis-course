---
title: "Editor de Imágenes con IA"
description: "Edita imágenes con instrucciones en lenguaje natural — elimina objetos, cambia fondos, aplica estilos."
difficulty: "advanced"
estimatedMinutes: 120
xpReward: 100
tags: ["Creative", "Machine Learning", "APIs"]
prerequisites:
  - "Conceptos básicos de Python (funciones, clases, diccionarios, entrada/salida de archivos)"
  - "Comodidad para importar y usar librerías de terceros (pip o uv)"
learningObjectives:
  - "Cargar e inspeccionar imágenes con Pillow y razonar sobre píxeles, modos y formatos"
  - "Escribir cada edición como una función pura que devuelve una imagen nueva, preservando la original"
  - "Analizar texto de instrucciones en lenguaje natural en operaciones de edición parametrizadas"
  - "Construir una pila de historial de deshacer/rehacer para que la edición se mantenga no destructiva"
  - "Procesar por lotes una carpeta completa de imágenes con una sola instrucción consistente"
  - "Entregar un CLI que aplica, verifica y guarda ediciones de principio a fin"
---

# 🛠️ 📷 Construye un Editor de Imágenes con IA

Editar imágenes a mano en un programa de pintura está bien para una foto; colapsa cuando necesitas la misma corrección — aclarar, recortar, agregar un borde — en cien fotos que llegan según un horario. Este proyecto construye lo que un humano no puede hacer: un editor de imágenes en Python que lee una instrucción en inglés llano como `crop to 400x300 and brighten 25%`, la aplica a cualquier imagen y puede deshacer su propio trabajo. Pillow hace la cirugía de píxeles; el pipeline hace el criterio, la pila de deshacer y el procesamiento por lotes.

Esto asume Python 101 y comodidad ejecutando librerías de terceros — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Cargar una imagen real con Pillow y leer su formato, tamaño, modo y extremos de píxeles antes de tocar nada.
2. Implementar cada edición — recorte, redimensionado, rotación, brillo — como una función pura que devuelve una imagen *nueva*, nunca mutando la original.
3. Escribir un parser que convierta instrucciones cortas en inglés en llamadas de edición parametrizadas, y que se comporte de forma predecible cuando una instrucción es desconocida.
4. Construir una pila de historial para que toda edición pueda deshacerse y rehacerse.
5. Aplicar una instrucción a una carpeta entera de imágenes y guardar los resultados con un manifiesto de en qué se convirtió cada archivo.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — Pillow funciona en cualquier Python real, y el punto entero del paso de lotes es tocar muchos archivos `.png` en tu propio disco, lo que encaja perfectamente con una carpeta de proyecto local.

**GitHub Codespaces** también funciona bien: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y todo lo de abajo se ejecuta sin cambios.

**Google Colab, Kaggle Notebooks y Binder son una forma decente de *probar* el pipeline central.** Pillow está preinstalado en Colab y Kaggle, y el notebook de abajo genera su propia imagen de muestra para que cada paso se ejecute de verdad. La advertencia honesta: subir tus *propias* fotos a un notebook es más fricción que apuntar el CLI a una carpeta local, así que trata el camino del notebook como el arenero y el `uv` local como el flujo de trabajo real.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-image-editor/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-image-editor/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-image-editor%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de escribir el editor: un proyecto con Pillow instalado y una imagen de muestra a la que apuntarlo (generada por código, para que nunca tengas que buscar una foto).

### Configura el proyecto

```bash
uv init ai-image-editor
cd ai-image-editor
uv add pillow
```

Pillow (PIL) es la librería de imágenes estándar de la industria para Python — la misma librería detrás de docenas de pipelines de miniaturas, y una sin dependencia de GPU ni de nube. `uv add pillow` la instala en el entorno propio del proyecto.

### Genera una imagen de muestra

**👟 Pista inicial :** Crea `sample.png` con un pequeño script que dibuje un gradiente de color suave — un sujeto de prueba determinista, así que cada edición que apliques tiene un resultado conocido y comprobable.

```python
# make_sample.py
from PIL import Image

img = Image.new("RGB", (400, 300))
px = img.load()
for y in range(300):
    for x in range(400):
        px[x, y] = ((x * 255) // 400, (y * 255) // 300, 128)
img.save("sample.png")
```

`Image.new("RGB", (400, 300))` prepara un lienzo vacío y `img.load()` devuelve un objeto de acceso a píxeles a través del cual puedes escribir con índices de píxel exactos. Escribir un color para cada posición `(x, y)` produce un gradiente cuyos valores exactos puedes predecir de antemano — la propiedad que permite que cada "Resultado esperado" posterior sea un número preciso en lugar de una sensación.

**✅ Lista de verificación**

- ✅ `uv add pillow` termina sin errores.
- ✅ `uv run python make_sample.py` crea `sample.png` en tu carpeta de proyecto, de 400×300 píxeles.

## Paso 1: Mira una imagen como lo hace Python

Un editor no puede corregir una imagen que no puede describir. Este paso lee lo que una imagen *realmente* es — su formato tal como se almacena en disco, sus dimensiones de píxeles, su modo de color y los valores de píxel más oscuros y más brillantes en cada canal — antes de que corra cualquier operación. Cada paso posterior depende de que estos cuatro números sean veraces.

### 1.1 Lee los metadatos

**👟 Pista inicial :** Abre `sample.png` e imprime su formato, tamaño, modo y extremos por canal, más un par de píxeles de esquina para confirmar que entiendes la geometría.

```python
# editor.py
from PIL import Image

img = Image.open("sample.png")
print("format:", img.format)
print("size:", img.size)
print("mode:", img.mode)
print("extrema:", img.getextrema())
print("corner (0, 0):", img.getpixel((0, 0)))
print("corner (399, 299):", img.getpixel((399, 299)))
```

`Image.open` lee de forma perezosa — nada se decodifica en memoria hasta que una operación de píxeles lo pide —, un detalle del mundo real que vale la pena conservar: abrir una comprobación de metadatos 400×400 no necesita una decodificación completa. `img.getextrema()` devuelve el min/max por canal, y `getpixel` confirma la geometría tocando una esquina conocida.

**🎯 Resultado esperado :** `format: PNG`, `size: (400, 300)`, `mode: RGB`, `extrema: ((0, 254), (0, 254), (128, 128))`, y las dos esquinas imprimen `(0, 0, 128)` y `(254, 254, 128)`.

**🩹 Si sale mal :** Si aparece `FileNotFoundError`, `sample.png` no está en el directorio desde el que se ejecutó el script — verifica el directorio de trabajo, no el archivo. Si la esquina en `(399, 299)` difiere de `(254, 253, 128)`, tu gradiente escribe una fórmula diferente — recuerda que los canales rojo y verde ambos llegan al máximo en 254 porque `(399 * 255) // 400` y `(299 * 255) // 300` redondean hacia abajo a 254.

### 1.2 Distingue el acceso destructivo del no destructivo

**👟 Pista inicial :** Sondea la diferencia entre `ImageEnhance` devolviendo una imagen nueva versus `getpixel`/`putpixel` mutando el objeto cargado — esta distinción es la semilla de la pila de deshacer del Paso 4.

```python
# editor.py (continued)
from PIL import Image, ImageEnhance

img = Image.open("sample.png")
original_id = id(img)

brighter = ImageEnhance.Brightness(img).enhance(1.5)
print("returns new object:", id(brighter) != original_id)
print("original untouched:", img.getpixel((0, 0)))
print("new is brighter:", brighter.getpixel((0, 0)))
```

`ImageEnhance.Brightness(img).enhance(1.5)` devuelve un objeto de imagen *separado*; la `img` original todavía lee su viejo píxel en `(0, 0)`. Ese contrato — las operaciones devuelven objetos nuevos mientras las entradas permanecen inmutables — es exactamente lo que hace posible una pila de deshacer. En el momento en que una operación muta en el lugar, el estado "antes" desaparece para siempre.

**🎯 Resultado esperado :** `returns new object: True`, `original untouched: (0, 0, 128)` y `new is brighter: (0, 0, 192)` — el canal azul de 128 escalado por 1.5.

**🩹 Si sale mal :** Si `original untouched` imprime un valor que no estableciste, la imagen de muestra fue sobrescrita por una exportación posterior — regenérala con `make_sample.py`. Si los IDs de los objetos de imagen *son* iguales, llamaste a un método mutador como `.resize()` directamente sobre una instancia `Image` en lugar de pasar por el enhancer.

### 1.3 Verifica la inspección de la imagen

**✅ Lista de verificación**

- ✅ Puedes enunciar las cuatro lecturas de metadatos: formato, tamaño, modo, extremos.
- ✅ Has visto con tus propios ojos que `enhance` devuelve un objeto nuevo y deja la fuente intacta.
- ✅ Los píxeles de esquina del gradiente coinciden con la fórmula que escribió el script de muestra.

**🤔 Pregunta(s) socrática(s)**

- `format` reportó `PNG` mientras que la imagen en memoria es RGB sin alfa. ¿De dónde viene realmente el valor de `format`, y qué sería `img.format` si crearas una `Image` en memoria sin guardarla primero en disco?
- El factor de brillo `1.5` convirtió el canal `128` en `192`. ¿Qué le pasa a un píxel que ya está en `200` cuando realzas con `2.0`? ¿Qué hace Pillow con los valores que excederían 255, y por qué eso degrada silenciosamente la precisión del canal completo?

## Paso 2: Escribe ediciones como funciones puras

Cada operación de edición se convierte en una función pequeña con una disciplina: toma una imagen, devuelve una imagen *nueva*, nunca toca la entrada. Las funciones puras son lo que permite que el pipeline componga operaciones de forma segura y las deshaga luego — y hacen que cada edición sea trivialmente testeable de forma aislada.

### 2.1 Las cuatro operaciones centrales

**👟 Pista inicial :** Implementa `crop`, `resized`, `rotated` y `brightness` — cada una de cuatro líneas o menos, devolviendo cada una un `Image` nuevo.

```python
# editor.py (continued)
def crop(img: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return img.crop(box)

def resized(img: Image.Image, width: int, height: int) -> Image.Image:
    return img.resize((width, height))

def rotated(img: Image.Image, degrees: float) -> Image.Image:
    return img.rotate(degrees, expand=True)

def brightness(img: Image.Image, factor: float) -> Image.Image:
    return ImageEnhance.Brightness(img).enhance(factor)

sample = Image.open("sample.png")
print("crop:", crop(sample, (0, 0, 200, 150)).size)
print("resize:", resized(sample, 100, 100).size)
print("rotate:", rotated(sample, 90).size)
print("brighten 2x:", brightness(sample, 2.0).getpixel((100, 50)))
```

Los tipos son el contrato: cada función declara `-> Image.Image` y devuelve un objeto fresco. `rotate(..., expand=True)` redimensiona el lienzo para que un giro de 90° de 400×300 se convierta en 300×400 — la única operación donde el tamaño cambia visiblemente, lo que tu resultado esperado debería reflejar. `brightness` demuestra el reclamo de pureza: lee `sample` en `(100, 50)` sin cambiarlo.

**🎯 Resultado esperado :** El script imprime `crop: (200, 150)`, `resize: (100, 100)`, `rotate: (300, 400)` y `brighten 2x` muestra el píxel en `(100, 50)` leído como `(126, 84, 255)` — su rojo `63` duplicado a `126` y su azul `128` sujeto a 255.

**🩹 Si sale mal :** Si `rotate` imprime `(400, 300)`, omitiste `expand=True` y Pillow recortó el giro al lienzo anterior. Si `brighten 2x` lee `255` en lugar de `127`, el valor fue sujetado porque *ya* estaba cerca del máximo — muestrea un píxel más oscuro o usa tu propio gradiente 400×300 en lugar de una foto arbitraria.

### 2.2 Encadena ediciones y verifica la pureza de principio a fin

**👟 Pista inicial :** Compón dos operaciones y confirma que tanto el resultado intermedio como el encadenado existen como objetos separados; luego verifica que el original sigue siendo idéntico byte a byte.

```python
# editor.py (continued)
result = resized(rotated(crop(sample, (0, 0, 200, 150)), 90), 100, 100)
print("chained size:", result.size)

edited_chain = [result]
print("all objects distinct:", all(id(sample) != id(o) for o in edited_chain))
print("source pixel untouched:", sample.getpixel((10, 10)))
print("edited pixel differs:", result.getpixel((10, 10)))
```

Anidar llamadas de función — `resized(rotated(crop(...), 90), 100, 100)` — se lee *de adentro hacia afuera*: recorta primero, luego rota, luego redimensiona. Como cada etapa devuelve un objeto fresco, la cadena deja un rastro de imágenes intermedias que puedes inspeccionar o descartar, y el `sample` original todavía responde sin cambios.

**🎯 Resultado esperado :** `chained size: (100, 100)`, `all objects distinct: True`, `source pixel untouched` coincide con el gradiente original, y el píxel `(10, 10)` del resultado editado difiere de la fuente.

**🩹 Si sale mal :** Si `chained size` es incorrecto, rastrea el orden: el recorte reduce a 200×150, la rotación intercambia a 150×200 y el redimensionado fuerza 100×100. Si el píxel final coincide exactamente con la fuente, el `(10, 10)` que muestreaste sobrevivió a las tres transformaciones sin cambios por coincidencia — muestrea cerca de una esquina donde el gradiente es empinado.

### 2.3 Verifica el conjunto de operaciones puras

**✅ Lista de verificación**

- ✅ Las cuatro operaciones devuelven objetos `Image` nuevos y ninguna muta su argumento.
- ✅ `rotate(..., expand=True)` cambia visiblemente las dimensiones mientras las otras preservan el contenido real.
- ✅ Una edición encadenada produce un objeto final distinto y deja `sample` intacto.

**🤔 Pregunta(s) socrática(s)**

- `resized` ignora por completo `img.size`. ¿Qué se rompería en la *cadena* si una de estas funciones mutara silenciosamente su entrada en lugar de devolver una copia? Nombra el bug específico que un `crop`-que-muta causaría en `resized(rotated(crop(...), 90), 100, 100)`.
- El one-liner de brillo no tiene verificación de límites: `enhance(4.0)` recorta todo a 255. ¿Es aceptable recortar en 255, o debería la función quejarse? ¿Qué información de color se pierde permanentemente en un recorte a 255 que un pipeline basado en floats conservaría?

## Paso 3: Enséñale al editor a entender instrucciones

La superficie "IA" del pipeline es un parser pequeño de lenguaje natural: lee una oración como `crop to 200x150 and rotate 90`, extrae los parámetros con regex y construye la secuencia correcta de funciones puras del Paso 2. Un parser es IA honesta: vocabulario limitado, comportamiento determinista y falla con estrépito cuando no te entiende.

### 3.1 Un parser de comandos que produce una lista de ediciones estable

**👟 Pista inicial :** Escribe `parse_instruction(text)` que devuelva una lista ordenada de tuplas `(operation, args)`, para que "traducir inglés a ediciones" quede desacoplado de "aplicar ediciones" — los dos pueden probarse por separado.

```python
# editor.py (continued)
import re
from typing import Callable

OPS: dict[str, Callable] = {
    "crop": crop, "resize": resized,
    "rotate": rotated, "brightness": brightness,
}

def parse_instruction(text: str) -> list[tuple[str, tuple]]:
    text = text.lower()
    steps: list[tuple[str, tuple]] = []
    m = re.search(r"crop to (\d+)x(\d+)", text)
    if m:
        steps.append(("crop", (0, 0, int(m.group(1)), int(m.group(2)))))
    m = re.search(r"rotate (\d+)", text)
    if m:
        steps.append(("rotate", (float(m.group(1)),)))
    m = re.search(r"(brighten|darken) (\d+)%", text)
    if m and m.group(1) == "brighten":
        steps.append(("brightness", (1 + int(m.group(2)) / 100,)))
    elif m:
        steps.append(("brightness", (1 - int(m.group(2)) / 100,)))
    if not steps:
        raise ValueError(f"No recognised edit in: {text!r}")
    return steps

print(parse_instruction("crop to 200x150 and rotate 90 and brighten 25%"))
print(parse_instruction("flip horizontally"))
```

Cada `re.search` busca un patrón y agrega un paso, así que "crop to 200x150, rotate 90" se mapea a una lista de dos elementos en orden. Convertir una instrucción intraducible en `ValueError` en lugar de un no-op silencioso es una elección de diseño deliberada — un pipeline de lotes que no dice nada sobre una instrucción fallida corromperá una carpeta mientras finge haber tenido éxito.

**🎯 Resultado esperado :** El primer print muestra `[('crop', (0, 0, 200, 150)), ('rotate', (90.0,)), ('brightness', (1.25,))]`; el segundo lanza `ValueError: No recognised edit in: 'flip horizontally'`.

**🩹 Si sale mal :** Si `flip horizontally` devuelve silenciosamente una lista vacía, tu guarda `if not steps: raise` no está al final de la función. Si `brighten 25%` produce `(1.25,)` pero `darken 25%` produce un orden de argumentos roto, revisa el `elif` — `darken` debe *restar*, no coincidir con el patrón de la matemática de brighten.

### 3.2 Aplica una instrucción analizada a una imagen

**👟 Pista inicial :** Escribe `apply_steps(img, steps)` que recorra la lista analizada, llamando a cada operación vía la tabla `OPS`, y devuelva la imagen final más un log de lo que cambió.

```python
# editor.py (continued)
def apply_steps(img: Image.Image, steps: list[tuple[str, tuple]]) -> tuple[Image.Image, list[str]]:
    current = img
    log: list[str] = []
    for name, args in steps:
        before = id(current)
        current = OPS[name](current, *args)
        log.append(f"{name}{args} -> new object: {id(current) != before}")
    return current, log

final, log = apply_steps(Image.open("sample.png"), parse_instruction("rotate 90 and crop to 300x200"))
print(final.size)
print(*log, sep="\n")
```

`OPS[name](current, *args)` es el núcleo guiado por tabla: buscar una función por nombre en un dict convierte la salida del parser directamente en una llamada sin ninguna escalera `if/elif`. Mantener un log de si cada paso produjo un objeto nuevo refuerza el contrato de pureza del Paso 2 — y le da al manifiesto un lugar para registrar la procedencia de cada edición.

**🎯 Resultado esperado :** `(300, 200)` — la rotación primero hace el lienzo 300×400, luego el recorte recorta la anchura — y el log imprime dos líneas, cada una reportando `True` por una creación de objeto fresco.

**🩹 Si sale mal :** Si el tamaño final es `(200, 300)`, los pasos corrieron recorte-antes-rotación (revisa el orden de `parse_instruction`) porque el recorte toma el `(0,0,300,200)` del lienzo *rotado*. Si el log muestra `False` para cualquier paso, una operación mutó su entrada — `crop` en `Pillow` en realidad *rebaña* de forma perezosa, así que su salida puede compartir memoria; úsalo en consecuencia.

### 3.3 Verifica la capa de instrucciones

**✅ Lista de verificación**

- ✅ `parse_instruction` mapea inglés conocido a tuplas `(name, args)` ordenadas y lanza una excepción con instrucciones desconocidas.
- ✅ `apply_steps` produce el mismo resultado que llamar a las operaciones a mano.
- ✅ El log de operaciones registra la procedencia de cada paso.

**🤔 Pregunta(s) socrática(s)**

- El parser coincide con patrones en un orden fijo y *agrega* cada uno que encuentra. ¿Qué pasa con una instrucción con dos recortes — `crop to 200x150 and crop to 100x100`? ¿Debería el parser dar error ante la ambigüedad, o aplicarlos secuencialmente, y por qué importa tu elección para un pipeline de lotes?
- `apply_steps` trata `OPS[name](current, *args)` como siempre válido. ¿Qué cambia `dict.get` versus `[]` en el error que levanta tu código cuando el parser se extiende luego con un nombre de paso que la tabla de ops aún no tiene?

## Paso 4: Agrega deshacer y rehacer

Las funciones puras significan que cada estado es una instantánea barata. Este paso envuelve el pipeline en una clase `Retoucher` que almacena cada estado de imagen en una lista de historial, con un cursor que se mueve hacia atrás en deshacer y hacia adelante en rehacer — el mismo modelo que usa un editor real, sin el traqueteo de disco.

### 4.1 La clase de pila de historial

**👟 Pista inicial :** Construye `Retoucher` con `push`, `undo`, `redo` y una propiedad `current`; haz que `push` trunque la cola de rehacer para que una edición nueva después de un deshacer invalide el historial hacia adelante.

```python
# editor.py (continued)
class Retoucher:
    def __init__(self, image: Image.Image) -> None:
        self.history: list[Image.Image] = [image]
        self.cursor: int = 0

    def push(self, image: Image.Image) -> Image.Image:
        self.history = self.history[: self.cursor + 1]
        self.history.append(image)
        self.cursor = len(self.history) - 1
        return image

    def undo(self) -> Image.Image:
        if self.cursor > 0:
            self.cursor -= 1
        return self.history[self.cursor]

    def redo(self) -> Image.Image:
        if self.cursor < len(self.history) - 1:
            self.cursor += 1
        return self.history[self.cursor]

    @property
    def current(self) -> Image.Image:
        return self.history[self.cursor]
```

`self.history = self.history[: self.cursor + 1]` es la línea que implementa "deshacer es terminal": una vez que deshaces y luego haces una edición nueva, el futuro abandonado desaparece y el nuevo camino toma el mando. El cursor siempre apunta al frame vivo, así que `undo`/`redo` son guardas alrededor de un movimiento de cursor — una línea cada una, y el invariante "el cursor siempre es un índice válido" se mantiene por construcción.

**🎯 Resultado esperado :** `push` después de dos deshaceres deja exactamente tres estados en `history`; deshacer deja de moverse en el índice 0; rehacer deja de moverse en el último índice.

**🩹 Si sale mal :** Si rehacer resucita una edición que debería estar muerta, el slice de truncado no se aplicó antes de agregar — reordena de modo que `history` se corte *primero*. Si deshacer devuelve la misma imagen para siempre, falta la guarda de cursor `if self.cursor > 0` y siempre indexas `history[0]`.

### 4.2 Conduce la pila con instrucciones reales

**👟 Pista inicial :** Construye un `Retoucher` a partir de `sample.png`, aplica dos instrucciones con `push`, deshaz dos veces, rehaz una vez y verifica que el tamaño de cada imagen devuelta coincida con el estado esperado.

```python
# editor.py (continued)
rt = Retoucher(Image.open("sample.png"))
rt.push(apply_steps(rt.current, parse_instruction("crop to 200x150"))[0])
rt.push(apply_steps(rt.current, parse_instruction("rotate 90"))[0])
print("after 2 edits:", [id(rt.current)] and rt.current.size)
rt.undo()
print("back one:", rt.current.size)
rt.undo()
print("to origin:", rt.current.size)
rt.redo()
print("forward one:", rt.current.size)
```

`rt.current` alimenta la siguiente instrucción, así que los estados de la pila siguen el historial de ediciones: 400×300 → 200×150 → 150×200 → de vuelta a 200×150. Cada estado es una imagen completa, lo que hace que `undo` sea trivialmente correcto — estás caminando sobre frames reales, no reproduciendo operaciones que podrían fallar.

**🎯 Resultado esperado :** `after 2 edits: (150, 200)`, `back one: (200, 150)`, `to origin: (400, 300)`, `forward one: (200, 150)` — exactamente los cuatro tamaños canónicos, en ese orden.

**🩹 Si sale mal :** Si `to origin` reporta un tamaño no-400, el constructor almacenó una *referencia* pero algo la mutó, porque los estados comparten objetos cuando haces push sin una reconstrucción pura — verifica que estás haciendo push de los resultados de `apply_steps`, no re-utilizando una operación mutadora. Si deshacer después de un nuevo `push` se salta un estado, revisa que el slice de truncado se ejecute antes del append.

### 4.3 Verifica el comportamiento de deshacer/rehacer

**✅ Lista de verificación**

- ✅ Después de 2 pushes y 2 deshaceres, la pila contiene los estados que esperas y un deshacer adicional es un no-op.
- ✅ Un push después de deshacer trunca el rastro de rehacer — rehacer no puede resucitar una edición muerta.
- ✅ Puedes explicar por qué las funciones puras del Paso 2 hacen que toda esta pila sea una lista y un contador.

**🤔 Pregunta(s) socrática(s)**

- Esta pila almacena la imagen completa en cada paso. Para un escaneo de gigapíxeles eso es idiota — ¿qué almacenarías en su lugar para hacer barato el deshacer, y qué información tira esa versión?
- `push` trunca la cola rebanando `history[: cursor + 1]`. Describe el contenido exacto del historial después de la secuencia editar, deshacer, editar, deshacer, rehacer, rehacer. ¿Cuál rehacer es un no-op y por qué?

## Paso 5: Edita por lotes una carpeta con un manifiesto

El trabajo final del pipeline es el que un humano no hará: aplicar la misma instrucción a cada imagen de una carpeta, guardar cada resultado sin pisar la fuente y dejar un manifiesto que registre en qué se convirtió cada archivo entrante.

### 5.1 Procesa cada PNG en un directorio

**👟 Pista inicial :** Escribe `batch_edit(folder, instruction, suffix)` que recorra `*.png`, omita su propia carpeta de salida, aplique la instrucción analizada y guarde dentro de `output/`.

```python
# editor.py (continued)
import json
from pathlib import Path

def batch_edit(folder: str, instruction: str, suffix: str = "_edited") -> list[dict]:
    steps = parse_instruction(instruction)
    out = Path(folder) / "output"
    out.mkdir(exist_ok=True)
    manifest: list[dict] = []
    for src in sorted(Path(folder).glob("*.png")):
        if "output" in src.parts:
            continue
        edited, log = apply_steps(Image.open(src), steps)
        dest = out / f"{src.stem}{suffix}.png"
        edited.save(dest)
        manifest.append({"source": src.name, "dest": dest.name, "size": edited.size, "edits": log})
    return manifest

m = batch_edit(".", "crop to 200x150 and brighten 20%")
print(json.dumps(m, indent=2))
```

`Path.glob("*.png")` más la guarda `"output" in src.parts` impiden que el lote edite alguna vez su propia salida anterior. Escribir cada resultado bajo `output/` con un sufijo — nunca de vuelta sobre la fuente — es la diferencia entre un curador y un destructor de datos, y el manifiesto convierte la ejecución en un registro auditable: fuente, destino, tamaño final y el log de ediciones exacto por archivo.

**🎯 Resultado esperado :** Aparece una carpeta `output/` que contiene `sample_edited.png`, y el manifiesto lista una entrada con `size: (200, 150)` y un log de ediciones que nombra el paso de recorte y el de brillo.

**🩹 Si sale mal :** Si `sample_edited.png` aparece *dos veces* en el manifiesto — la segunda como `output/sample_edited_edited.png` —, la guarda falló, lo que significa que estás re-ejecutando el lote sobre una carpeta que ya contiene `output/`; bórrala primero o refuerza la guarda con `in src.relative_to(folder).parts`. Si el manifiesto está vacío, no hay PNGs de nivel superior — la muestra se guardó en otro lugar distinto a la carpeta que pasaste.

### 5.2 Conecta el CLI

**👟 Pista inicial :** Dale al lote argumentos reales de línea de comandos con `argparse` — `--instruction` para la edición, `--folder` para el objetivo, `--suffix` para el nombre de salida.

```python
# editor.py (continued)
import argparse

def main() -> None:
    parser = argparse.ArgumentParser(description="Edit images by English instruction.")
    parser.add_argument("--instruction", required=True, help='e.g. "crop to 200x150 and rotate 90"')
    parser.add_argument("--folder", default=".", help="folder of PNGs to edit")
    parser.add_argument("--suffix", default="_edited")
    args = parser.parse_args()
    try:
        manifest = batch_edit(args.folder, args.instruction, args.suffix)
    except ValueError as exc:
        parser.error(str(exc))
    print(json.dumps(manifest, indent=2))

if __name__ == "__main__":
    main()
```

`argparse` te da `--instruction`, `--folder` y `--suffix` gratis, incluida la salida `-h/--help` y una ruta elegante de `parser.error(...)` cuando la instrucción no se analiza. Capturar el `ValueError` del parser y re-lanzarlo a través de `parser.error` convierte la falla en una salida limpia con mensaje en lugar de un traceback crudo.

**🎯 Resultado esperado :** `uv run python editor.py --instruction "rotate 90"` imprime un manifiesto cuya entrada tiene `dest: sample_edited.png` y `size: (300, 400)`.

**🩹 Si sale mal :** Si el CLI levanta `SystemExit` con el mensaje cuando le das una instrucción sin sentido, ese es el camino deseado de `parser.error` — un traceback no capturado significa que se eliminó el `try/except`. Si faltan archivos de salida, confirma que `--folder` apunta a la carpeta que realmente contiene los PNGs.

### 5.3 Verifica el pipeline de lotes

**✅ Lista de verificación**

- ✅ `batch_edit` produce `output/` con un archivo editado por cada PNG fuente y nunca sobrescribe una fuente.
- ✅ El manifiesto registra por archivo: fuente, destino, tamaño final y log de ediciones.
- ✅ El CLI acepta parámetros vía flags y falla limpiamente con instrucciones no reconocidas.

**🤔 Pregunta(s) socrática(s)**

- El manifiesto registra actualmente tamaño y ediciones pero no la media de píxeles de cada resultado. ¿Qué bug futuro de renderizado — indetectado por tus comprobaciones de hoy — capturaría una media de píxeles almacenada, y qué cuesta almacenarla?
- `--folder` puede ser `"."` desde un directorio y una ruta absoluta desde otro. ¿Qué pasa con el nombre `output/` si ejecutas el mismo lote desde dos directorios de trabajo diferentes contra la misma carpeta absoluta?

## ⚠️ Errores comunes

- **Mutar en el lugar y luego perder el "antes".** El `putpixel` basado en `.load()` de Pillow y otros patrones de reutilización devuelven o mutan el mismo objeto; si alguna edición central olvida `-> new Image`, la pila de deshacer del Paso 4 reescribe silenciosamente el historial.
- **Olvidar `expand=True` en `rotate`.** Sin él, el lienzo conserva el tamaño previo a la rotación y las esquinas rotadas se recortan — el clásico bug de "me cortaron la foto" — y rompe silenciosamente la matemática de tamaños en cada paso posterior.
- **No-ops silenciosos con instrucciones desconocidas.** Un parser que devuelve `[]` para "flip horizontally" procesará felizmente una carpeta por lotes sin hacer nada. Lanzar `ValueError` es la guarda que hace visible la falla.
- **El lote editando su propia salida.** Sin la guarda `"output" in src.parts` (o una omisión basada en sufijo), una ejecución repetida re-procesa archivos ya editados, componiendo ediciones hasta que son irreconocibles.
- **Abrir imágenes con la expectativa equivocada de la referencia del archivo.** `Image.open` es perezoso — leer `.size` después de que el manejador del archivo se cerró, o reutilizar un cursor entre formatos, produce errores confusos; vuelve a abrir por operación cuando necesites garantías sobre los datos subyacentes.

## Lo que acabas de construir

Un editor de imágenes completo conducido por instrucciones: carga e inspecciona imágenes reales, aplica crop/resize/rotate/brightness como funciones puras, analiza instrucciones en inglés llano en ediciones ordenadas, soporta deshacer/rehacer mediante una pila de historial y procesa carpetas enteras por lotes hacia `output/` con un manifiesto por archivo. La habilidad transferible aquí es la disciplina debajo de la "IA": analizar la entrada en datos validados, mantener cada transformación pura y reversible, y hacer que los fallos sean ruidosos en lugar de silenciosos.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/ai-image-editor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-image-editor) en el repositorio del curso es todo el pipeline como notebook — generación de muestras, salida verificada de cada paso y la ejecución por lotes — listo para darle a Run de principio a fin. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Extiende la tabla `OPS` con `grayscale`, `blur` y `flip` como nuevas funciones puras — agregar una operación ahora cuesta una función de cinco líneas y una entrada de dict, nunca una rama `if` nueva.
- Cambia el parser de regex por una llamada a un LLM de nivel gratuito (consulta el proyecto [Revisor de Código Agéntico](/projects/agentic-code-reviewer) para la tabla de proveedores) para que instrucciones como "haz que se vea vintage" se traduzcan en llamadas `OPS` parametrizadas.
- Agrega *comparación* de imágenes al manifiesto: registra el hash perceptual de cada salida y luego marca ejecuciones por lotes donde fuentes similares produjeron resultados disímiles.
- Persiste la pila de deshacer en disco como un archivo de historial de ediciones por imagen, para que `Retoucher` sobreviva a un reinicio — el primer paso hacia un editor no destructivo real.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓