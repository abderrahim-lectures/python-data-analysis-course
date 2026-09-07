---
title: "Generador de Paleta de Colores"
description: "Genera paletas de colores armónicas desde colores base con verificación de contraste de accesibilidad."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["colors", "cli", "stdlib", "design"]
prerequisites:
  - "Fundamentos de Python (variables, loops, funciones)"
learningObjectives:
  - "Convertir entre los espacios de color hex, RGB y HSV"
  - "Generar paletas complementarias, análogas y triádicas desde un tono base"
  - "Calcular ratios de contraste WCAG y juzgar el cumplimiento AA/AAA"
  - "Exportar paletas como variables CSS y JSON"
  - "Envolver toda la herramienta en una pequeña interfaz de línea de comandos"
---

# 🎨 Construir un Generador de Paleta de Colores

Elegir colores que realmente combinen es la diferencia entre una app con aspecto profesional y una de circo, y sin embargo "armónico" suele ser una vibra, no una fórmula. Resulta que importa menos de lo que parece: la **rueda** de colores te da reglas precisas — los colores complementarios están a 180°, los triádicos a 120°, los vecinos análogos a 30°. Este proyecto construye una herramienta que aplica esas reglas a *cualquier* color base, y luego verifica cada candidato contra las guías de contraste WCAG para que nunca entregues una paleta donde el texto desaparezca dentro del fondo.

Esto asume Python 101 — variables, loops, funciones y `print` básico — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Convertir colores entre hex (`#3366cc`), RGB `(51, 102, 204)` y el espacio de tono/saturación/valor HSV con round-trip.
2. Generar paletas complementarias, análogas y triádicas desde un único color base.
3. Calcular el ratio de contraste WCAG entre dos colores cualesquiera y juzgar si pasan AA.
4. Exportar cualquier paleta como variables CSS y como JSON.
5. Envolver todo en un pequeño CLI que imprime una paleta y su reporte de contraste desde un solo comando.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — este proyecto usa solo la biblioteca estándar de Python (el módulo `colorsys`), así que el setup es literalmente "consigue un Python y una carpeta de proyecto". La sección Configuración de abajo lo recorre.

**GitHub Codespaces** es una alternativa sin instalar: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal en tu pestaña del navegador.

**Google Colab, Kaggle Notebooks o Binder** son una excelente forma de *jugar* con la matemática del color, ya que no necesita claves de API ni GPU — un notebook ejecutable vive en [`examples/color-palette/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ipynb). Haz clic en una insignia para lanzarlo con cero configuración local:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcolor-palette%2Fnotebook.ipynb)

Sé honesto sobre el tradeoff, de todos modos: un notebook ejecuta la *misma* paleta de muestra cada vez. El CLI local es donde escribes tu propio color de marca y obtienes un reporte real.

## Configuración

`uv` es una sola herramienta que reemplaza la cadena "instalar Python, luego pip, luego una herramienta de entorno virtual" — y como este proyecto no necesita ningún paquete de terceros, el setup es genuinamente solo "consigue un Python y una carpeta".

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, y confirma que quedó instalado:

```bash
uv --version
```

Luego configura el proyecto:

```bash
uv init color-palette
cd color-palette
```

Eso es todo — sin línea de `uv add`. Todo lo que importa este proyecto (`colorsys`, `json`, `argparse`) viaja dentro de Python mismo, lo que vale la pena notar: una cantidad sorprendente de herramientas genuinamente útiles necesita cero dependencias, y saber dónde viven las herramientas de color de la biblioteca estándar es parte de este proyecto.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `color-palette/` existe con un `pyproject.toml`.
- ✅ `python -c "import colorsys"` tiene éxito sin instalar nada.

## Paso 1: Convertir colores entre espacios

Los colores viven en varias notaciones. Hex (`#3366cc`) y RGB `(51, 102, 204)` son las que los humanos escriben y los navegadores aceptan, pero *ninguna* facilita crear una paleta — "gira este color 30° hacia el verde" es galimatías en RGB, y sin embargo es un cambio de una línea en **HSV**, donde el tono *es* la posición en la rueda de colores. Así que todo el proyecto descansa en un round-trip: hex → RGB → HSV y de vuelta, sin perder nada en el camino.

### 1.1 Escribir las cuatro funciones de conversión

**👟 Pista inicial :** Pon cuatro funciones pequeñas en `color_math.py` — `hex_to_rgb`, `rgb_to_hsv`, `hsv_to_rgb`, `rgb_to_hex` — y verifica cada una con un `print` en el bloque `__main__`:

```python
# color_math.py
import colorsys

def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """'#1a2b3c' -> (26, 43, 60). A leading '#' is optional."""
    h = hex_color.lstrip("#")
    if len(h) != 6:
        raise ValueError(f"{hex_color!r} is not a 6-digit hex color")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb_to_hsv(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    """Return (hue_in_degrees, saturation, value), each rounded."""
    r, g, b = (v / 255.0 for v in rgb)
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return round(h * 360.0, 2), round(s, 3), round(v, 3)

def hsv_to_rgb(h: float, s: float, v: float) -> tuple[int, int, int]:
    """Inverse of rgb_to_hsv: hue in degrees, s/v in [0, 1]."""
    r, g, b = colorsys.hsv_to_rgb(h / 360.0, s, v)
    return tuple(round(c * 255.0) for c in (r, g, b))

def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)

if __name__ == "__main__":
    print(hex_to_rgb("#3366cc"))           # (51, 102, 204)
    print(rgb_to_hsv((51, 102, 204)))      # (220.0, 0.75, 0.8)
    print(rgb_to_hex(hsv_to_rgb(220.0, 0.75, 0.8)))  # #3366cc -- round trip
```

Las dos conversiones que merecen tu atención: `rgb_to_hsv` escala cada canal a `[0, 1]` y se lo entrega a `colorsys.rgb_to_hsv`, luego multiplica el tono devuelto por `360` para obtener grados — la biblioteca estándar trabaja en fracciones de una rueda de colores por defecto, y el ×360 es exactamente el paso de "una fórmula, un cambio de unidad". `hsv_to_rgb` debe deshacer esa misma escala (÷360 antes de llamar a `colorsys.hsv_to_rgb`) o cada paleta que construyas queda silenciosamente mal.

**🎯 Resultado esperado :**

```
(51, 102, 204)
(220.0, 0.75, 0.8)
#3366cc
```

**🩹 Si sale mal :** Un `ValueError` que diga "not a 6-digit hex color" significa que pasaste el color con un `#` inicial inesperado o espacio adicional — `lstrip("#")` solo elimina *un* prefijo, y `.strip()` sobre la entrada primero arregla los espacios. Si el round-trip imprime `#3266cb` o similar, tu `hsv_to_rgb` redondea hacia abajo en el lugar equivocado — ese último `round(c * 255.0)` pertenece a `hsv_to_rgb`, no a `rgb_to_hex`.

### 1.2 Verifica el round-trip

**✅ Lista de verificación**

- ✅ `hex_to_rgb("#3366cc")` devuelve `(51, 102, 204)`.
- ✅ `rgb_to_hsv((51, 102, 204))` devuelve `(220.0, 0.75, 0.8)`.
- ✅ Convertir hex → RGB → HSV → RGB → hex devuelve el color original exactamente.

**🤔 Pregunta(s) socrática(s)**

- En RGB, `(51, 102, 204)` cambia a `(51, 102, 205)` al subir un canal. ¿Qué significa ese mismo cambio minúsculo *en términos HSV* — es un cambio de tono, de brillo, o ambos, y por qué eso hace de HSV el espacio correcto para "nudgar este color 30°"?
- ¿Por qué `rgb_to_hsv` devuelve floats redondeados mientras `hsv_to_rgb` tiene que redondear a enteros completos? ¿Dónde un `round` de punto flotante rompería en profundidad la garantía del round-trip?

## Paso 2: Generar paletas armónicas

Ahora la recompensa de convertir a HSV: las reglas de paleta se vuelven aritmética sobre un solo número. Los esquemas estándar son todos offsets puros de tono con saturación y valor constantes — complementario es `tono + 180`, triádico es `tono`/`+120`/`+240`, análogo es `tono ± 30`.

### 2.1 Escribir las reglas de offset de tono y el constructor de paletas

**👟 Pista inicial :** Tres funciones diminutas — `complementary`, `analogous`, `triadic` — cada una devolviendo una lista de tonos mediante el wraparound `% 360`, más `build_palette`, que mira el tono/saturación/valor del color base una vez y aplica las tres reglas:

```python
# palettes.py
from color_math import hex_to_rgb, hsv_to_rgb, rgb_to_hsv, rgb_to_hex

def complementary(base_hue: float) -> list[float]:
    return [base_hue, (base_hue + 180.0) % 360.0]

def analogous(base_hue: float, spread: float = 30.0) -> list[float]:
    return [(base_hue + offset) % 360.0 for offset in (-spread, 0.0, spread)]

def triadic(base_hue: float) -> list[float]:
    return [base_hue, (base_hue + 120.0) % 360.0, (base_hue + 240.0) % 360.0]

def build_palette(base_color: str) -> dict[str, list[str]]:
    base_hue, sat, val = rgb_to_hsv(hex_to_rgb(base_color))
    palettes = {}
    for name, hues in (
        ("complementary", complementary(base_hue)),
        ("analogous", analogous(base_hue)),
        ("triadic", triadic(base_hue)),
    ):
        palettes[name] = [rgb_to_hex(hsv_to_rgb(h, sat, val)) for h in hues]
    return palettes

if __name__ == "__main__":
    palette = build_palette("#3366cc")
    for name, colors in palette.items():
        print(f"{name}: {colors}")
```

`% 360` en cada offset es todo el truco de la rueda de colores: `tono + 180` en un color a 250° no es 430° (que ningún espacio de color acepta), se envuelve a 70°. Mantener `sat` y `val` fijos mientras solo se mueve el tono también es una elección de *diseño*, no solo un atajo — garantiza que cada color de la paleta comparte la misma viveza y luminosidad, que es lo que hace que un esquema se sienta cohesivo en lugar de aleatorio.

**🎯 Resultado esperado :**

```
complementary: ['#3366cc', '#cc9933']
analogous: ['#33b3cc', '#3366cc', '#4d33cc']
triadic: ['#3366cc', '#66cc33', '#cc3366']
```

**🩹 Si sale mal :** Si cada paleta es un gris plano, `sat` o `val` salió `0` de `rgb_to_hsv` — que solo pasa con una entrada puramente sin saturación como `#ffffff`, así que revisa tu color base. Si los tonos están bien pero el *orden* parece revuelto, recuerda que `hsv_to_rgb` espera grados mientras `colorsys` quiere una fracción — pasar un valor de grado crudo como `220.0` directo a `colorsys.hsv_to_rgb` descompone cada conversión.

### 2.2 Verifica las reglas de tono

**✅ Lista de verificación**

- ✅ `build_palette("#3366cc")` devuelve los cinco colores de arriba, en ese orden.
- ✅ Cada color generado difiere del base solo en tono — saturación y valor son idénticos en todas partes.
- ✅ Alimentar tu propio color base (prueba `#e63946`) produce una paleta válida en lugar de un crash.

**🤔 Pregunta(s) socrática(s)**

- La regla análoga usa `spread=30`. ¿Qué le pasa a la paleta si lo subes a `spread=60` — y dónde, en la rueda de colores, se volvería *visualmente indistinguible* de una paleta triádica? ¿Por qué?
- `complementary` devuelve el color base *y* su opuesto. Si una diseñadora solo quiere los dos colores nuevos, ¿por qué devolver el base de todos modos podría seguir siendo la mejor elección para una función de librería?

## Paso 3: Verificar el contraste WCAG

Una paleta puede ser matemáticamente perfecta y aun así inútil si el color del texto no se despega del fondo. WCAG define el contraste como un *ratio* calculado a partir de la luminancia relativa de cada color — un poco de matemática gamma por canal, luego `(L_clara + 0.05) / (L_oscura + 0.05)`. Los umbrales están fijos: 4.5:1 para texto AA normal, 3:1 para texto grande, 7:1 para AAA.

### 3.1 Escribir luminancia, ratio y el juez de pasa/falla

**👟 Pista inicial :** Tres funciones — `relative_luminance` (la transformación gamma por tramos), `contrast_ratio` (que debe ordenar las dos luminancias para que la mayor se divida), y `passes_wcag` con un diccionario de umbrales:

```python
# contrast.py
from color_math import hex_to_rgb

def relative_luminance(rgb: tuple[int, int, int]) -> float:
    def channel(c: int) -> float:
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast_ratio(fg: str, bg: str) -> float:
    l1 = relative_luminance(hex_to_rgb(fg))
    l2 = relative_luminance(hex_to_rgb(bg))
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def passes_wcag(ratio: float, level: str = "AA") -> bool:
    thresholds = {"AA": 4.5, "AA-large": 3.0, "AAA": 7.0, "AAA-large": 3.0}
    return ratio >= thresholds[level]

if __name__ == "__main__":
    ratio = contrast_ratio("#ffffff", "#3366cc")
    print(f"white on #3366cc: {ratio:.2f}:1")
    print("passes AA normal text:", passes_wcag(ratio, "AA"))
```

La línea de pesos enormes son los coeficientes `0.2126/0.7152/0.0722`: el ojo humano no pondera rojo, verde y azul por igual, y WCAG codifica eso. El orden `max/min` en `contrast_ratio` también importa — la fórmula es asimétrica y produciría silenciosamente un número *incorrecto pero de aspecto válido* si dividieras en el orden arbitrario de la llamada, así que la función normaliza defensivamente.

**🎯 Resultado esperado :**

```
white on #3366cc: 5.37:1
passes AA normal text: True
```

**🩹 Si sale mal :** Si `passes_wcag` sigue devolviendo `True` para pares obviamente oscuro-sobre-oscuro, tu `relative_luminance` está derritiendo el paso gamma — verifica el `** 2.4` contra la rama (`c <= 0.04045`); un `+0.055` faltante corrompe cada color oscuro. Si el ratio se imprime como `1.00:1` exacto, ambas luminancias son iguales — probablemente olvidaste el orden `max/min` y dividiste un color contra sí mismo al pasar el mismo hex dos veces.

### 3.2 Verifica la matemática del contraste

**✅ Lista de verificación**

- ✅ `contrast_ratio("#ffffff", "#3366cc")` imprime `5.37:1`.
- ✅ `contrast_ratio("#ffffff", "#ffffff")` imprime `1.00:1` (un color contra sí mismo).
- ✅ Puedes explicar por qué `0.2196*1.0` sería incorrecto para una entrada de blanco puro.

**🤔 Pregunta(s) socrática(s)**

- `contrast_ratio` ordena las dos luminancias defensivamente. ¿Dónde podría un llamador obtener una respuesta tipo `1.00:1` *por diseño* en lugar de por bug — y es ese ratio siempre señal de una paleta rota?
- El texto normal AAA necesita 7:1. Dado que blanco-sobre-`#3366cc` aterriza en 5.37:1, ¿qué tiene que cambiar del *primer plano* para llegar a AAA, y contra qué se sacrifica eso estéticamente?

## Paso 4: Exportar paletas como CSS y JSON

Una paleta que nadie puede usar es académica. Los dos formatos que de verdad llegan a los productos son las propiedades personalizadas CSS (`--brand-1: #3366cc`) y JSON (para archivos de config, temas de Tailwind y scripts). Exportar enseña la lección más profunda de que un *modelo* (un dict de familias de color nombradas) y sus *renderizados* (texto CSS, texto JSON) son capas separadas — puedes añadir diez exportadores más sin tocar el código del color.

### 4.1 Escribir los dos exportadores

**👟 Pista inicial :** Dos funciones de una idea — `to_css` construye líneas `:root { --family-N: ... }` con una comprensión de listas, `to_json` entrega todo el dict de la paleta a `json.dumps` con `indent=2`:

```python
# exporter.py
import json

def to_css(palette: dict[str, list[str]]) -> str:
    lines = [":root {"]
    for name, colors in palette.items():
        for i, color in enumerate(colors):
            lines.append(f"  --{name}-{i + 1}: {color};")
    lines.append("}")
    return "\n".join(lines)

def to_json(palette: dict[str, list[str]]) -> str:
    return json.dumps(palette, indent=2)

if __name__ == "__main__":
    from palettes import build_palette
    palette = build_palette("#3366cc")
    print(to_css(palette))
    with open("palette.json", "w") as f:
        f.write(to_json(palette))
    print("Saved palette.json")
```

La distinción datos-a-texto es la idea que debes retener: `build_palette` devuelve un dict plano, y cada exportador es dueño *solo* de la pregunta "dict → texto". `f"  --{name}-{i + 1}: {color};"` es una vitrina bonita de un f-string haciendo trabajo real — interpolación más un offset estilo `enumerate` en una línea. Nota que el lado JSON hace el mismo trabajo con *cero* formato de strings, que es exactamente por qué existen los formatos estructurados.

**🎯 Resultado esperado :** La terminal imprime un bloque CSS de 16 líneas que empieza con `:root {`, listando tres familias de variables de color; se escribe un archivo `palette.json` que `json.load(open("palette.json"))` puede leer de vuelta como el dict original.

**🩹 Si sale mal :** Si el CSS imprime `--complementary-0` (base cero), tu `enumerate(colors)` no está añadiendo `+ 1` — los autores de CSS esperan que las familias empiecen en 1. Si el archivo JSON difiere del `palette.json` impreso antes, verifica que `json.dumps(..., indent=2)` sea lo que se ejecutó al momento de escribir en lugar del predeterminado de una sola línea.

### 4.2 Verifica las exportaciones

**✅ Lista de verificación**

- ✅ La salida de `to_css(palette)` empieza con `:root {` y termina con `}` e incluye `--triadic-3: #cc3366`.
- ✅ `palette.json` existe y se carga como un dict con las mismas tres claves.
- ✅ Ningún valor de color en ninguna exportación tiene letra mayúscula ni un `#` faltante.

**🤔 Pregunta(s) socrática(s)**

- El dict creado en el Paso 2 lo consumen *dos* exportadores aquí. ¿Qué sugiere eso sobre dónde añadirías un tercer formato — digamos, una config de Tailwind — y por qué el código del color no necesita cambiar para eso?
- ¿Por qué se describe al JSON como necesitando "cero formato de strings" mientras el CSS necesita un f-string? ¿Qué propiedad tiene el JSON que el CSS escrito por humanos no tiene?

## Paso 5: Envolverlo en un CLI

El pulido final es convertir una librería en una herramienta que alguien realmente escribe: `python palette.py #e63946 --bg ffffff` imprime todo el reporte. El módulo `argparse` maneja el parseo de argumentos, los valores predeterminados y el útil texto de `--help` gratis.

### 5.1 Construir el CLI que resume

**👟 Pista inicial :** Una función `summarize` que imprime cada familia y luego el veredicto de contraste de cada color único contra el fondo elegido, cableada en `argparse` con el `base` posicional y un `--bg` con valor predeterminado:

```python
# palette.py
import argparse

from color_math import hex_to_rgb
from contrast import contrast_ratio, passes_wcag
from palettes import build_palette

def summarize(base_color: str, background: str) -> None:
    palettes = build_palette(base_color)
    for name, colors in palettes.items():
        print(f"{name}: {' '.join(colors)}")

    print()
    print(f"Contrast vs {background}:")
    for color in sorted({c for family in palettes.values() for c in family}):
        ratio = contrast_ratio(color, background)
        verdict = "AA" if passes_wcag(ratio, "AA") else "FAIL"
        print(f"  {color}: {ratio:.2f}:1  {verdict}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Palettes + WCAG contrast from one hex color.")
    parser.add_argument("base", help="Base hex color, e.g. #3366cc")
    parser.add_argument("--bg", default="#ffffff", help="Background to check against (default: #ffffff)")
    args = parser.parse_args()
    hex_to_rgb(args.base)  # validate before doing any work
    hex_to_rgb(args.bg)
    summarize(args.base, args.bg)
```

```bash
uv run python palette.py #3366cc
```

Dos toques deliberados: una validación explícita estilo `ValidationError` *antes* de cualquier generación (fallas rápido con un error legible en lugar de un crash a mitad de paleta), y una comprensión de set que recolecta cada color exportado una vez para que el reporte de contraste no repita el mismo color por cada familia en la que aparece.

**🎯 Resultado esperado :** Tres líneas de paleta (`complementary:` … hasta `triadic:`), una línea en blanco, luego una línea `Contrast vs #ffffff:` por cada color único — cada una terminando en `AA` o `FAIL`, con `#3366cc: 5.37:1  AA` entre ellas.

**🩹 Si sale mal :** Si escribir el color con su `#` falla el parser, estás en un shell que trata `#` como el inicio de un comentario — cita el argumento (`"#3366cc"`) o quita el `#`. Si `--bg 000000` aún reporta la mayoría de colores como `FAIL`, esa es la respuesta honesta, no un bug — oscuro-sobre-negro es bajo contraste *por diseño*; pasa un fondo más claro.

### 5.2 Verifica el CLI

**✅ Lista de verificación**

- ✅ `uv run python palette.py #3366cc` imprime tres paletas y un reporte de contraste que incluye una línea `5.37:1  AA`.
- ✅ `uv run python palette.py --help` lista el `base` posicional y la opción `--bg`.
- ✅ Un hex inválido como `uv run python palette.py zzz` imprime un `ValueError` claro, no un reporte vacío silencioso.

**🤔 Pregunta(s) socrática(s)**

- La comprensión de set deduplica los colores antes del bucle de contraste. ¿Qué pasaría con la *salida* si la eliminaras — y por qué el reporte duplicado, no un crash, es exactamente la clase de bug que un `set` previene silenciosamente?
- `argparse` te da `--bg` con un valor predeterminado. ¿Cuál es una situación real donde *un usuario que no pasa nada* y *un usuario que pasa el predeterminado explícitamente* deben comportarse distinto, y este CLI ya tiene una?

## ⚠️ Errores comunes

- **Olvidar que `colorsys` trabaja en fracciones, no grados.** `rgb_to_hsv` devuelve el tono en `[0,1)`; multiplica por 360 al entrar, divide por 360 al salir. El bug clásico es multiplicar en una dirección y no deshacerlo en la otra — cada paleta se renderiza entonces revuelta y *nada* hace round-trip.
- **Dividir el contraste al revés.** La fórmula WCAG divide la más clara entre la más oscura. Omite el orden `max/min` y `#ffffff` sobre `#000000` te da el *ratio correcto* por suerte, mientras un orden de llamada invertido devuelve un número incorrecto que aun así *parece* plausible (como `0.19:1`).
- **Tratar RGB como un buen espacio para la matemática de paletas.** "Análogo" es aritmética sobre tonos; en RGB son conjeturas. Si te encuentras restando 30 a cada canal "para que coincida", saliste de HSV y volviste a las conjeturas.
- **Saltarte la validación y reventar a mitad de reporte.** Que `hex_to_rgb` valide `len(h) != 6` por adelantado significa que un color mal escrito falla como un solo error claro, no como una paleta de `None`s o un `TypeError` confuso muy dentro de `colorsys`.
- **Codificar el formato de salida dentro del constructor de paletas.** En el momento en que `build_palette` imprime CSS por sí misma, la exportación JSON necesita una función duplicada. Mantén el modelo y los exportadores separados — esa separación es la idea reutilizable.

## Lo que acabas de construir

Una herramienta de paletas real: toma un color, aplica reglas genuinas de teoría del color para producir tres familias armónicas, verifica cada resultado contra las guías de contraste WCAG y exporta tanto variables CSS como JSON — todo en menos de cien líneas de Python de biblioteca estándar. La habilidad transferible es el *pipeline*: convertir a un espacio de trabajo (HSV), hacer la matemática ahí, convertir de vuelta — la misma forma detrás del trabajo con color, los sistemas de coordenadas y el manejo de zonas horarias en todas partes.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/color-palette/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/color-palette) en el repositorio del curso tiene los scripts completos de arriba, ejecutables de extremo a extremo. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y ejecútalos desde ahí.
:::

## A dónde ir desde aquí

- Añade una bandera `--levels` que verifique cada color de la paleta contra **cada** nivel WCAG (AA, AA-large, AAA) y anote el reporte — ya tienes el diccionario de umbrales, esto es un bucle.
- Genera *sombras* de un color base (mismo tono, valor decreciente) para que una paleta viaje con estados de hover, border y disabled — reutiliza `hsv_to_rgb` con el constructor del paso 2.
- Exporta a un **config plano compatible con Tailwind** o una tabla de muestras Markdown — descubrirás cuánto de un nuevo exportador es solo elegir strings.
- Añade simulación de daltonismo: convierte cada color a un espacio aproximado de protanopía/deuteranopía y marca las paletas donde dos entradas se vuelven indistinguibles.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓