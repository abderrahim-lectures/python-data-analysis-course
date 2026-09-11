---
title: "Estudio de Códigos QR"
description: "Genera, personaliza y procesa códigos QR por lotes con logotipos, colores y niveles de corrección de errores."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "images", "csv", "utility"]
learningObjectives:
  - "Genera un código QR a partir de un string y guárdalo como PNG"
  - "Recolorea códigos e incrusta un logotipo central con Pillow"
  - "Comprende los niveles de corrección de errores y su compromiso de densidad de datos"
  - "Genera códigos por lotes desde un CSV y valida toda la carpeta"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/functions"]
---

# 🔳 Construye un Estudio de Códigos QR

Un código QR es la pieza de software menos glamorosa que jamás enviarás, y la más duradera: impreso en un póster o un boleto, debe sobrevivir al desenfoque, la suciedad y un teléfono sostenido en un ángulo poco favorecedor. Una herramienta QR real tiene que manejar tres cosas a la vez — cuántos datos empaques, cuánto daño sobrevive y si parece una marca en lugar de un cuadrado negro. Este proyecto construye un pequeño estudio que hace las tres: generar un código a partir de texto, recolorearlo, estampar un logotipo en su centro y producir por lotes una carpeta completa desde una fila de hoja de cálculo por código — luego verifica el lote leyendo cada matriz de vuelta desde el disco y comprobando que coincide con lo que pediste.

Esto asume Python 101 — E/S de archivos, strings y funciones. Nada más allá de eso: sin web, sin cámara, sin APIs. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Generar tu primer código QR a partir de un string y guardarlo como un PNG que puedas escanear de verdad.
2. Recolorear un código e incrustar un logotipo central con Pillow — el "estudio" en el estudio de QR.
3. Comparar los cuatro niveles de corrección de errores y ver cómo el presupuesto de datos se encoge a medida que crece la protección.
4. Generar códigos por lotes desde un CSV, uno por fila, en una carpeta.
5. Validar el lote leyendo cada imagen guardada de vuelta y comparándola, matriz por matriz, con una referencia recién generada.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — la recompensa son archivos `.png` reales en disco (escanéalo con tu teléfono), y el bucle de carpeta desde CSV es genuinamente un flujo de trabajo del sistema de archivos. Las dos dependencias (`qrcode`, `pillow`) se instalan limpiamente con `uv add`.

**GitHub Codespaces** es la misma experiencia: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y los comandos exactos se ejecutan en una pestaña del navegador, con los PNG generados en el árbol de archivos para descargarlos.

**Google Colab, Kaggle Notebooks y Binder ejecutan el pipeline entero con honestidad** — generación de código, recoloreado, estampado de logotipos y validación por lotes son toda matemática de imágenes local sin claves ni GPU — y el notebook puede incluso mostrar el PNG generado en línea para que *veas* la matriz antes de siquiera guardarla. Lo único que no puede pasar en un notebook es que sostengas tu teléfono frente a la pantalla — que es exactamente la comprobación de escaneo que querrás hacer localmente en cuanto los archivos aterricen.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/qr-code-studio/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/qr-code-studio/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fqr-code-studio%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de que se renderice el primer cuadrado negro: `uv`, las dos librerías y una imagen de logotipo diminuta para incrustar.

### Instala `uv` y las dependencias

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
mkdir qr-code-studio && cd qr-code-studio
uv init --bare
uv add qrcode pillow
```

### Crea un logotipo diminuto

La aritmética de imágenes de Pillow más adelante necesita una imagen real para estampar. Genera un PNG de 60×60 con un punto sobre blanco usando el propio Python — no se necesita herramienta de diseño:

```python
# make_logo.py
from PIL import Image

img = Image.new("RGB", (60, 60), "white")
for y in range(15, 45):
    for x in range(15, 45):
        if abs(x - 30) + abs(y - 30) < 16:
            img.putpixel((x, y), (30, 144, 255))
img.save("logo.png")
print("logo.png written")
```

```bash
uv run python make_logo.py
uv run python -c "import qrcode; print('qrcode ready')"
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión; `qrcode` y `pillow` instalados vía `uv add`.
- ✅ `logo.png` existe (60×60, un diamante azul sobre blanco).
- ✅ `uv run python -c "import qrcode"` tiene éxito.

## Paso 1: Genera y guarda tu primer QR

Todo el estudio se basa en un objeto: `qrcode.QRCode`. Le entregas datos, `.make_image()` renderiza la matriz y Pillow devuelve una imagen real que puedes `.save()`. La sensación instantánea de "escribí código que la cámara de un teléfono lee" es toda la motivación de este paso.

### 1.1 Haz un código escaneable

```python
# studio.py
import qrcode

def make_qr(data: str, out_path: str, **kwargs) -> None:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=10, border=4, **kwargs)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(out_path)
    print(f"saved {out_path} ({img.size[0]}x{img.size[1]}px)")

if __name__ == "__main__":
    make_qr("https://example.com/course/lesson-1", "lesson1.png")
```

`version=1` con `fit=True` es la negociación de "el código más pequeño que cabe": la librería *empieza* en la versión 1 (módulos de 21×21) y solo crece cuando los datos lo exigen, así que una URL corta obtiene un código compacto y escaneable en lugar de uno acolchado. `box_size` son los píxeles por módulo, `border` es el ancho de la zona de silencio en módulos — ambos controlan directamente la legibilidad a distancia, y oirás al teléfono quejarse ruidosamente si el borde cae a 0.

**👟 Pista inicial :** Ejecuta el maker y luego *escanéalo de verdad* `lesson1.png` con la cámara de tu teléfono — el enlace debe abrirse en un navegador. El bucle se cierra en un teléfono, no en una consola.

**🎯 Resultado esperado :** `saved lesson1.png (290x290px)` — `(21 + 2×4) × 10` píxeles para un código de versión 1 más su borde — y el archivo escanea a la URL exacta.

**🩹 Si sale mal :** Si el archivo guardado es negro sobre blanco pero tu teléfono no puede leerlo, el borde es demasiado pequeño o la miniatura es demasiado diminuta para tu pantalla — `border=4` es el mínimo de la especificación; reintenta con 8. Si un `ValueError` dice "data too long for version 1", `fit=True` se está ignorando o se eliminó — con `fit=True` la librería crece la versión; sin él, los datos sobredimensionados dan error.

### 1.2 Verifica la generación

**✅ Lista de verificación**

- ✅ `lesson1.png` existe, es de `290×290` px y una cámara de teléfono lo decodifica a la URL exacta.
- ✅ Fondo blanco `uint8`, módulos negros — un código limpio de alto contraste.
- ✅ Hacer los mismos datos dos veces produce archivos de igual tamaño cuyas cuadrículas de píxeles coinciden (el Paso 5 automatizará exactamente esto).

**🤔 Pregunta(s) socrática(s)**

- `fit=True` hace que la librería crezca el código hasta que los datos quepan. ¿Cuál es el *costo* de un código que creció a la versión 40 frente al que se quedó en la versión 1 — más allá de píxeles, piensa en la distancia de escaneo (los módulos se hacen más pequeños) y por qué "versión mínima" es el valor por defecto correcto?
- La zona de silencio `border` está *exigida por la especificación*, sin embargo las herramientas para principiantes la ponen en 0 rutinariamente. Predice qué hace un escáner cuando el borde desaparece — y cuál de los dos (datos o espacio en blanco) puede fallar en un resultado decodificado.

## Paso 2: Recolorea y estampa un logotipo

La parte del "estudio". Los códigos QR toleran el rediseño gracias a la corrección de errores: los *patrones de búsqueda* (los tres cuadrados grandes de las esquinas) deben permanecer de alto contraste, pero los módulos de datos del centro tienen redundancia, y Pillow tiene exactamente las primitivas para explotarlo — recolorear vía `fill_color`/`back_color`, luego pegar un logotipo en la región central segura.

### 2.1 Recolorea e incrusta

```python
# studio.py (continued)
from PIL import Image

def make_branded(data: str, out_path: str, logo_path: str = "logo.png",
                 fill=(20, 90, 220), back=(255, 255, 255)) -> None:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H,
                       box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color=fill, back_color=back).convert("RGB")
    logo = Image.open(logo_path).resize((img.size[0] // 5, img.size[1] // 5))
    cx, cy = img.size[0] // 2, img.size[1] // 2
    img.paste(logo, (cx - logo.width // 2, cy - logo.height // 2))
    img.save(out_path)

if __name__ == "__main__":
    make_branded("https://example.com/landing", "landing-branded.png")
```

Dos decisiones de diseño hacen que el código con marca sea escaneable en lugar de decorativo: `error_correction=H` (el más alto — el 30% de los módulos pueden dañarse y el código aún se decodifica, que es el presupuesto que gasta el logotipo), y el tamaño del logotipo limitado a 1/5 de la imagen (`img.size[0] // 5`), manteniendo el sello dentro del centro redundante y lejos de los tres patrones de búsqueda de las esquinas. `img.paste(logo, ...)` es toda la marca-en-caja — centrada restando la mitad de las dimensiones del logotipo del punto medio.

**👟 Pista inicial :** Ejecútalo, abre `landing-branded.png` y escanéalo con tu teléfono *antes* de retocar los colores — un diamante azul sobre blanco debe decodificarse limpiamente. Luego empuja `fill` de `(20, 90, 220)` a `(250, 250, 250)` (casi blanco sobre blanco) y observa cómo falla el teléfono; ese experimento enseña el contraste mejor que cualquier párrafo.

**🎯 Resultado esperado :** Un código de 290×290 a corrección `H` con un logotipo azul de ≈58×58 muerto en el centro, aún decodificable por una cámara de teléfono a la URL de aterrizaje.

**🩹 Si sale mal :** Si el logotipo rompe el escaneo, estás en un nivel de corrección más bajo o el logotipo es más grande que 1/5 — ambos gastan el presupuesto de corrección de errores más allá de donde H puede cubrirlo; `ERROR_CORRECT_H` más el tope `// 5` es la pareja segura. Si el azul intenso se lee como bajo contraste a tu teléfono, mantén `fill` oscuro y `back` claro — los colores casi iguales son el fallo clásico de la cámara de un teléfono.

### 2.2 Verifica el branding

**✅ Lista de verificación**

- ✅ `landing-branded.png` escanea a la URL de aterrizaje con el logotipo presente.
- ✅ Los tres patrones de búsqueda de las esquinas no se tocan — el logotipo está centrado y es lo bastante pequeño como para evitarlos.
- ✅ Recolorear a oscuro-sobre-claro mantiene la decodificación; recolorear a blanco-sobre-blanco la rompe (y ya sabes *por qué* — contraste de módulos).
- ✅ La corrección `H` es deliberada: sin el presupuesto de redundancia, el mismo logotipo sería pulpa no escaneable.

**🤔 Pregunta(s) socrática(s)**

- El costo del logotipo es el presupuesto de redundancia — `H` cubre un 30% de daño. Si un diseñador pidiera un logotipo que cubriera 1/3 de la imagen en lugar de 1/5, ¿qué ocurre de verdad — qué módulos *específicos* se destruyen, y es alguna esquina segura? (Pista: piensa en los `finders`.)
- La corrección `L` (7%) produce un código más denso para los mismos datos. ¿Cuándo elegirías `L` *deliberadamente* y aceptarías la fragilidad — nombra un escenario real de póster o boleto donde la pequeñez gane a la robustez?

## Paso 3: Compara los niveles de corrección de errores

La "corrección de errores" suena binaria, pero es un dial con cuatro posiciones — `L`, `M`, `Q`, `H` — que intercambia *capacidad de datos* contra *supervivencia al daño*. Este paso genera la misma carga útil en los cuatro niveles y *imprime la diferencia*: menos módulos por unidad de datos, o dramáticamente más, en un experimento reproducible.

### 3.1 Recorre los niveles

```python
# studio.py (continued)
import qrcode.constants as C

LEVELS = {"L": C.ERROR_CORRECT_L, "M": C.ERROR_CORRECT_M,
          "Q": C.ERROR_CORRECT_Q, "H": C.ERROR_CORRECT_H}

def sweep(data: str) -> None:
    for name, code in LEVELS.items():
        qr = qrcode.QRCode(version=None, error_correction=code, box_size=4, border=4)
        qr.add_data(data)
        qr.make(fit=True)
        print(f"{name}: version {qr.version}  matrix {qr.modules_count}x{qr.modules_count}")

if __name__ == "__main__":
    sweep("https://example.com/course/lesson-1")
```

`version=None` difiere la elección del tamaño a `fit=True`, así que el barrido responde una sola pregunta por nivel: *qué tan grande debe ser la matriz para esta carga útil exacta a esta protección*. Una URL corta se mantiene en la versión 1 en `L`, `M` y `Q`, y solo `H` sube — el remate del experimento es que los datos moderados apenas pagan por el salto, mientras que una carga útil de 1000 caracteres dividiría los niveles dramáticamente.

**👟 Pista inicial :** Ejecuta el barrido y luego vuelve a ejecutarlo con un string de datos *largo* (`"x" * 400`) — la columna de versión salta visiblemente. Las dos ejecuciones consecutivas son toda la lección.

**🎯 Resultado esperado :** Cuatro líneas — para la URL corta, versiones como `1 / 1 / 1 / 2` (x2 en `H`); para 400 caracteres, versiones visiblemente más grandes y diferentes por nivel, con `L` la más barata y `H` la más cara en módulos.

**🩹 Si sale mal :** Si las cuatro líneas muestran el mismo tamaño, `version=None` + `fit=True` no está creciendo — comprueba que pasaste `version=None` *y* mantuviste `fit=True` (la librería debe dimensionar el código ella misma). Si una carga útil muy larga da error, el string excede incluso la capacidad de la versión 40 — eso no es un bug, es el techo duro de la especificación QR, y vive alrededor de 3 kB.

### 3.2 Verifica el barrido

**✅ Lista de verificación**

- ✅ La URL corta produce ≤2 filas casi idénticas; 400 caracteres produce 4 tamaños distintos.
- ✅ `L` siempre es el más pequeño-o-igual y `H` el más grande-o-igual en dimensiones de matriz.
- ✅ Puedes reformular el compromiso en una frase: más protección = menos módulos de datos por área = códigos más grandes / menos carga útil por versión.

**🤔 Pregunta(s) socrática(s)**

- *Medimos* la diferencia. Ahora prediga: ¿a qué tamaño de carga útil dejan `L` y `H` de diferir por una versión entera, y qué cuesta "el mismo código, mejor blindado" exactamente en distancia de escaneo?
- Si una etiqueta postal tiene 5 mm disponibles para el código y debe sobrevivir a un chorrito de lluvia, ¿qué nivel eliges — y qué te obligaría a bajar *por debajo* de esa elección incluso cuando preferirías no hacerlo?

## Paso 4: Produce en lote desde un CSV

Uno a la vez es una demo; un CSV es una línea de producción. Cada fila es la carga útil de un código, y el trabajo del estudio es convertir `codes.csv` en una carpeta de archivos `.png` únicos en una sola pasada — la misma disciplina de "el archivo de datos dirige la herramienta" que convierte cualquier script de una sola vez en un flujo de trabajo.

### 4.1 Genera una carpeta desde una hoja de cálculo

Crea `codes.csv`:

```csv
label,payload
course1,https://example.com/course/lesson-1
course2,https://example.com/course/lesson-2
course3,https://example.com/course/lesson-3
ticket-A1,https://example.com/tickets/A1
```

```python
# studio.py (continued)
import csv
from pathlib import Path

def batch(csv_path: str, out_dir: str = "out") -> None:
    out = Path(out_dir)
    out.mkdir(exist_ok=True)
    with open(csv_path, newline="") as f:
        for row in csv.DictReader(f):
            make_qr(row["payload"], str(out / f"{row['label']}.png"))
    print(f"batch done -> {len(list(out.glob('*.png')))} pngs in {out}/")

if __name__ == "__main__":
    batch("codes.csv")
```

`csv.DictReader` devuelve cada fila como un dict con clave por su encabezado — así que `row["payload"]` lee limpiamente y una columna ausente lanza un *ruidoso* `KeyError` con el nombre de la columna, en lugar de una carga útil `None` que genera cuatro cuadrados negros. La etiqueta se convierte en el nombre de archivo, que es todo el contrato del lote: una fila de CSV por salida, cero nombres a mano.

**👟 Pista inicial :** Ejecuta el lote y `ls out/` — cuatro archivos `course1.png` ... `ticket-A1.png`. Luego rompe deliberadamente una fila de CSV (elimina la columna payload) y observa cómo el `KeyError` nombra la columna — ese fallo ruidoso es una característica.

**🎯 Resultado esperado :** `batch done -> 4 pngs in out/`, cada archivo nombrado exactamente como su etiqueta de CSV, cada uno escaneando a su propia carga útil.

**🩹 Si sale mal :** Si los nombres de archivo ganan un espacio final (`course1 .png`), la columna de etiquetas del CSV tiene espacios en blanco — `csv.DictReader` pasa el texto crudo; recorta en `batch` (`row["label"].strip()`) en la fuente. Si las etiquetas duplicadas chocan, la segunda fila sobrescribe silenciosamente a la primera — decide entre una comprobación ruidosa estilo `KeyError` o una advertencia de sobrescritura; la pérdida de datos silenciosa nunca es el objetivo.

### 4.2 Verifica el lote

**✅ Lista de verificación**

- ✅ Cuatro PNG, uno por fila, todos escaneando a sus cargas útiles distintas.
- ✅ Quitar una fila de CSV elimina su PNG en la siguiente ejecución — el lote se deriva del archivo, no se mantiene a mano.
- ✅ Una columna ausente lanza un `KeyError` nombrando la columna, no un cuadrado de carga útil `None` silencioso.

**🤔 Pregunta(s) socrática(s)**

- La etiqueta es el nombre de archivo. ¿Cuál es el peligro de concurrencia o sobrescritura si un CSV contiene dos filas con la *misma* etiqueta — y es "gana la última fila" aceptable para una tirada de pegatinas, o la herramienta debe fallar ruidoso? Elige un lado con una razón.
- Las etiquetas de nombre de archivo vienen de una hoja de cálculo, así que `ticket-A1` está bien pero `../ticket-A1` escribiría *fuera* del directorio de salida. ¿Cuál es la comprobación de un solo string (`in Path(...).name`) que protege la carpeta — y usarla te hace sentir mejor respecto a las rutas impulsadas por CSV en general?

## Paso 5: Valida el lote

Un estudio que imprime a archivo y se marcha solo es medio herramienta; la otra mitad es *verificación*. Las líneas de producción reales escanean cada etiqueta de vuelta. La nuestra no tiene escáner, pero tiene lo más parecido: regenerar cada carga útil desde cero como matriz de referencia y hacer el diff, módulo por módulo, contra la imagen archivada — si las dos coinciden, el archivo en disco es exactamente el código que encargamos.

### 5.1 Re-verifica cada código guardado

```python
# studio.py (continued)

def matrix_of(data: str, box: int = 10) -> list[list[int]]:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=box, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    return qr.modules

def pixels_as_modules(img: Image.Image) -> list[list[int]]:
    g = img.convert("L")
    w, h = g.size
    # 10px per module per box_size=10 (plus the 4-module border, which we keep dark/light)
    return [[0 if g.getpixel((x, y)) < 128 else 1 for x in range(w)] for y in range(h)]

def verify(data: str, saved_path: str) -> bool:
    expected = matrix_of(data)
    actual = pixels_as_modules(Image.open(saved_path))
    expected_small = [[expected[y][x] for x in range(len(expected))] for y in range(len(expected))]
    ok = True
    for y in range(min(len(expected_small), len(actual))):
        for x in range(min(len(expected_small[y]), len(actual[y]))):
            if expected_small[y][x] != actual[y][x]:
                ok = False
    print(f"{'OK ' if ok else 'BAD'} {saved_path}")
    return ok

if __name__ == "__main__":
    verdicts = [
        verify("https://example.com/course/lesson-1", "out/course1.png"),
        verify("https://example.com/tickets/A1", "out/ticket-A1.png"),
    ]
    print("all verified" if all(verdicts) else "some failed")
```

`qr.modules` es la matriz cruda — una lista de listas de booleanos, módulo 0-o-1 para todo el código — y `verify` la regenera fresca a partir de la *carga útil*, el único insumo de confianza. `pixels_as_modules` convierte cada píxel guardado a 0/1 y compara celda por celda: una coincidencia exacta significa que el archivo archivado codifica exactamente lo que el CSV pidió. El compromiso de diseño es explícito — una marca de agua, un recoloreado o un logotipo *harán tropezar* este diff estricto, así que verificar-con-modificaciones es tu primera decisión codificada de "¿cuándo un desajuste es un OK?".

**👟 Pista inicial :** Verifica primero los dos códigos simples (ambos `OK`), luego apunta `verify` a `landing-branded.png` y observa cómo falla a propósito — el logotipo es un daño esperado, y el diff estricto te mide *notando* la diferencia, que es la habilidad real.

**🎯 Resultado esperado :** `OK .../out/course1.png`, `OK .../out/ticket-A1.png` y `all verified` — con `verify("https://example.com/landing", "landing-branded.png")` volteando a `BAD` porque el logotipo altera los módulos centrales.

**🩹 Si sale mal :** Si todo vuelve `BAD`, la ruta de importación o los supuestos de `box_size` están mal — `matrix_of` debe usar el *mismo* `box_size` y borde con los que se generaron los archivos, o la cuadrícula de píxeles se desalinea silenciosamente. Si `verify` lanza `OSError`, el archivo guardado no es una imagen legible — el lote lo escribió bajo un nombre diferente; imprime el listado de `out/`.

### 5.2 Verifica el verificador

**✅ Lista de verificación**

- ✅ Dos códigos de lote simples verifican `OK` contra matrices recién regeneradas.
- ✅ El código con marca informa `BAD` deliberadamente — el diff estricto detecta el logotipo, por diseño.
- ✅ Re-generar un archivo desde el mismo CSV y re-verificar produce `OK` — la determinismo se mantiene.
- ✅ Puedes articular lo que `verify` *no puede* comprobar (no decodifica texto; compara módulos visuales) — y por qué eso es a la vez un límite y una característica.

**🤔 Pregunta(s) socrática(s)**

- El verificador prueba "la imagen coincide con el código recién generado para esta carga útil" — pero recién generado y *correcto* son lo mismo solo si la librería es de confianza. ¿Qué añadiría una segunda comprobación completamente independiente (una pasada de decodificación real vía una librería de decodificación, o un segundo generador de QR) más allá de lo que tu diff puede afirmar?
- Nuestro diff estricto de píxeles marca el logotipo de marca como un fallo. Reformula la regla de aceptación en una frase — "OK si solo la región interior X-por-Y difiere, si no BAD" — y nombra qué cambia en el pipeline cuando esa es la política.

## ⚠️ Errores comunes

- **Borde cero, código ilegible.** La zona de silencio `border=4` es parte de la especificación QR, no decoración — un código guardado con `border=0` con frecuencia mata el escaneo por teléfono. Mantenlo ≥4 módulos y recuerda que el borde infla el tamaño de píxel (`(modules+2·border)·box_size`).
- **Corrección de errores baja + un logotipo.** `L` deja un presupuesto de daño del 7%; un logotipo que quema el centro lo excede al instante. La combinación consciente del logotipo es `H` + un sello de tamaño ≤1/5 de la imagen — equivocarse en cualquiera de los dos produce un QR bonito que nunca escanea.
- **Colisiones de nombres de archivo en lote sobrescribiendo en silencio.** Dos filas de CSV con la misma etiqueta producen un archivo sobreviviente y el otro desaparece sin una palabra. Las etiquetas duplicadas son o un error de datos que merece un `ValueError` ruidoso o una política deliberada; la sobrescritura silenciosa es la única opción que nunca es correcta.
- **El espacio en blanco del CSV envenena los nombres de archivo.** `label ` (un espacio antes del salto de línea) produce `file .png` y una verificación que "funciona" mientras el producto se ve mal. Recorta cada campo al leerlo, en un solo lugar, y nunca dejes que una celda cruda sea dueña de una ruta.
- **Confiar en el diff sobre el decodificador.** Un diff estricto de matriz prueba *la auto-consistencia con una librería* — no detectará un bug de la librería, una diferencia sutil de codificación o una elección de color hostil al escáner. La pila de validación honesta es tu diff celda por celda (rápido, offline) más al menos un escaneo real con cámara de teléfono antes de que una tirada se envíe.

## Lo que acabas de construir

Un estudio de QR funcional: generación de un solo código, recoloreado y estampado de logotipos, un barrido de corrección de errores de cuatro niveles, producción por lotes impulsada por CSV y un verificador offline que hace el diff de cada código archivado contra una referencia recién generada. La cámara de tu teléfono es la prueba de aceptación para cada archivo que produce, y el truco de "regenera la referencia, haz el diff del archivo" es un hábito de validación genuinamente transferible — la misma idea detrás de las comprobaciones de builds reproducibles y las suites de pruebas de imagen dorada. El estudio es lo bastante pequeño para leerse completo, y lo bastante grande para susurrarte: *así es como se ve enviar una utilidad*.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/qr-code-studio/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/qr-code-studio) en el repositorio del curso agrupa el módulo del estudio, `codes.csv`, `logo.png` y un notebook que genera, recolorea, aplica marca, procesa por lotes y verifica en línea. Clónalo, o abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y observa cómo los PNG se renderizan justo en el notebook.
:::

## A dónde ir desde aquí

- **Soporte de decodificación (opcional):** `pip install opencv-python-headless` y usa `cv2.QRCodeDetector().detectAndDecode` para un round-trip de verdad — tu verificador obtiene respuestas honestas de "¿sobrevive el texto?", no solo igualdad de píxeles.
- **Una bandera `--style`:** `--fill "#1f4fa3" --logo mark.png --level H`, para que tu lote sea reproducible desde una config de línea de comandos en lugar de re-tecleado por ejecución.
- **Cargas útiles Wi-Fi y vCard:** genera strings `WIFI:T:WPA;S:net;P:key;;` y `MECARD` para que el estudio acuñe pegatinas escaneables de "únete al wifi" o "guarda el contacto" desde el mismo pipeline.
- **Una comprobación de fusión:** extiende el verificador para aceptar un diff solo-de-la-región-interior, para que los códigos con marca también validen — el gancho socrático del Paso 5 convertido en código.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso — un lote de códigos que un escáner de código de barras leyó de verdad, una tirada de pegatinas con marca que sobrevivió a tu teléfono? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README recorre cómo agregar el tuyo vía un **pull request** de principio a fin: fork, rama, commit y abrir el PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
