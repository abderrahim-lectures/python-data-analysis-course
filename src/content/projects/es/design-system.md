---
title: "Generador de Sistema de Diseño"
description: "Genera un sistema de diseño desde colores de marca — tipografía, espaciado, componentes y variables CSS."
difficulty: "beginner"
estimatedMinutes: 40
tags: ["design", "css", "color-theory", "data-visualization", "matplotlib"]
prerequisites:
  - "Funciones y bucles básicos de Python"
  - "Comprensión de los códigos de color hex"
  - "Familiaridad con las variables de CSS (útil pero no necesaria)"
learningObjectives:
  - "Convertir entre formatos de color hex, RGB y HSL"
  - "Generar paletas de colores armónicas a partir de un único color base"
  - "Calcular ratios de contraste WCAG y verificar la accesibilidad"
  - "Construir una escala tipográfica con un ratio modular"
  - "Exportar tokens de diseño como propiedades CSS personalizadas"
---

# 🛠️ 🎨 Construir un Generador de Sistema de Diseño

Todos los sistemas de diseño arrancan desde el mismo lugar: alguien elige un color de marca y luego pregunta "¿qué aspecto tiene toda la paleta?". Este proyecto construye esa respuesta en Python — derivarás una paleta completa en una familia de color, verificarás cada emparejamiento que realmente usarías contra las reglas de contraste WCAG, construirás una escala tipográfica y de espaciado que se mantiene matemáticamente consistente, y exportarás todo como propiedades CSS personalizadas listas para colocar en una hoja de estilos real.

Esto asume Python 101 y una noción general de qué es una cadena de color hex — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Convertir entre hex, RGB y HSL para que cada operación de color ocurra en el espacio correcto.
2. Derivar una paleta completa y cohesiva — matices, tintes y grises — a partir de un hex de marca.
3. Puntuar pares texto/fondo contra las reglas de contraste WCAG para que la accesibilidad no sea una conjetura.
4. Construir una escala tipográfica con un ratio modular consistente y una escala de espaciado.
5. Renderizar una tarjeta de muestras de paleta y guardarla como imagen compartible.
6. Exportar cada token como propiedades CSS personalizadas que puedes pegar en cualquier proyecto web.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado — toda la matemática es Python puro, y los dos archivos de salida (`palette.png` y `design-tokens.css`) aterrizan directamente en tu directorio de trabajo.

**GitHub Codespaces** también funciona perfectamente: abre [el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y ejecuta desde ahí. Cada paso se comporta igual que local.

**Google Colab y Kaggle Notebooks** encajan de forma natural con este proyecto — sin dependencias de sistema, sin archivos en disco, todo se renderiza en línea. Si estás trabajando el curso sin una configuración local, este es uno de los proyectos que en realidad se adapta limpiamente al modelo de notebook.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/design-system/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/design-system/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdesign-system%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas vive en la biblioteca estándar de Python más una biblioteca de visualización.

### Instalar `uv`

`uv` es una sola herramienta que reemplaza la cadena habitual de "instalar Python, luego pip, luego una herramienta de entornos virtuales, luego instalar paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

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

### Configura el proyecto

```bash
uv init design-system
cd design-system
uv add matplotlib
```

`colorsys` viene con Python y se encarga de la matemática de espacios de color en el Paso 1; `matplotlib` dibuja la tarjeta de muestras de paleta en el Paso 5. Solo necesitas ese único paquete de PyPI.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `design-system/` existe con un `pyproject.toml`, y `matplotlib` está instalado.

## Paso 1: Convertir entre formatos de color

No puedes mezclar luminosidad y RGB: HSL es donde los humanos ajustan el brillo, RGB es donde las pantallas entregan el color, y hex es cómo los nombras en CSS. Antes de cualquier trabajo de paleta, construye los cuatro traductores en los que te apoyarás durante el resto del proyecto.

### 1.1 Escribir las cuatro funciones de conversión

**👟 Pista inicial :** Trabaja alrededor de `colorsys.rgb_to_hls` de Python (no HSV): su orden de retorno es `(hue, lightness, saturation)`, que intercambia saturación y luminosidad en comparación con todas las demás APIs que conocerás.

```python
# design_system.py
import colorsys

def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert a hex color string to an RGB tuple (0–255 per channel)."""
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert RGB values (0–255) to a lowercase hex string."""
    return f"#{r:02x}{g:02x}{b:02x}"

def hex_to_hsl(hex_color: str) -> tuple[float, float, float]:
    """Convert hex to HSL (h: 0–360, s: 0–100, l: 0–100)."""
    r, g, b = hex_to_rgb(hex_color)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return h * 360, s * 100, l * 100

def hsl_to_hex(h: float, s: float, l: float) -> str:
    """Convert HSL (h: 0–360, s: 0–100, l: 0–100) to hex."""
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return rgb_to_hex(int(r * 255), int(g * 255), int(b * 255))

# Round-trip test
brand = "#3b82f6"
r, g, b = hex_to_rgb(brand)
h, s, l = hex_to_hsl(brand)
print(f"  {brand} -> RGB({r}, {g}, {b}) -> HSL({h:.0f}\u00b0, {s:.0f}%, {l:.0f}%)")
print(f"  Back to hex: {hsl_to_hex(h, s, l)}")
```

`colorsys` usa flotantes de 0–1 para cada canal, y el nombre `rgb_to_hls` revela el secreto: la segunda y la tercera salidas son luminosidad y luego saturación, no al revés. Fallar en eso temprano significa que cada matiz que generes después tendrá el hue equivocado o el estado de ánimo equivocado — es el bug fundacional que hay que matar primero. `hsl_to_hex` invierte el mismo camino; ambas conversiones son sin pérdida para valores RGB de número entero.

**🎯 Resultado esperado :** Imprime `#3b82f6 -> RGB(59, 130, 246) -> HSL(217°, 91%, 60%)` y `Back to hex: #3b82f6` (el round-trip coincide).

**🩹 Si sale mal :** Si el hex del round-trip no coincide con la entrada, estás pasando saturación y luminosidad a `hsl_to_hex` en el orden equivocado — intercambia los argumentos `s` y `l` dentro de esa función. Si el hue de salida está claramente mal para un color conocido (esperas morado, obtienes rojo), probablemente llamaste a `colorsys.rgb_to_hsv` en lugar de `rgb_to_hls` — las funciones tienen formas de salida diferentes.

### 1.2 Verifica las conversiones

**✅ Lista de verificación**

- ✅ Hacer round-trip de un color conocido (`#3b82f6`) a través de `hex -> rgb -> hex` y `hex -> hsl -> hex` devuelve la cadena original exactamente.
- ✅ Puedes explicar por qué HSL es el espacio correcto para el trabajo de paleta del Paso 2, mientras que hex es el formato correcto para CSS.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué tanto `rgb_to_hex` como `hsl_to_hex` usan `int(...)` en los valores finales — qué saldría mal si pasaras un flotante directamente?
- Si aclararas un color sumando 10 a cada canal RGB en lugar de ajustar la luminosidad en HSL, ¿se desplazaría el hue? ¿Cómo previene HSL esa clase de problema?

## Paso 2: Generar una paleta de colores

Una paleta es una familia de tonos y matices que se sienten como si pertenecieran juntos. El truco es simple: fija el hue y la saturación (esa es la *identidad* del color), y camina solo por el eje de luminosidad. Cada muestra resultante comparte ADN con el color de marca original — el espectador ve una familia, no cuatro colores inconexos.

### 2.1 Construye el generador de paleta

**👟 Pista inicial :** Desplaza la luminosidad en HSL por compensaciones fijas hacia arriba y hacia abajo desde la base, usando `min`/`max` para mantener los valores dentro de 0–100.

```python
# design_system.py (continuación)
def generate_palette(base_hex: str) -> dict:
    """Generate a full palette from a single brand color."""
    h, s, l = hex_to_hsl(base_hex)

    palette = {
        "brand": base_hex,
        "lightest": hsl_to_hex(h, s, min(l + 35, 95)),
        "lighter":  hsl_to_hex(h, s, min(l + 20, 90)),
        "light":    hsl_to_hex(h, s, min(l + 10, 85)),
        "dark":     hsl_to_hex(h, s, max(l - 10, 10)),
        "darker":   hsl_to_hex(h, s, max(l - 20, 5)),
        "darkest":  hsl_to_hex(h, s, max(l - 35, 0)),
    }

    # Grays: desaturated tint of the brand hue, not pure neutral
    for name, lightness in [("gray-100", 96), ("gray-200", 90), ("gray-300", 80),
                            ("gray-400", 60), ("gray-500", 45), ("gray-600", 30),
                            ("gray-700", 20), ("gray-800", 12), ("gray-900", 6)]:
        palette[name] = hsl_to_hex(h, 5, lightness)

    return palette

palette = generate_palette("#3b82f6")
print("Brand palette:")
for name, color in palette.items():
    if not name.startswith("gray"):
        print(f"  {name:>10}: {color}")
```

El tope `min(l + 35, 95)` evita tintes lavados al 100 % de luminosidad — una paleta que conserva un toque del hue de marca en su matiz más claro siempre es más cohesiva que el blanco puro. Los grises usan una saturación constante del 5 % al hue de la marca en lugar de 0 %, lo que les da un tinte cálido en lugar de un gris clínico; esa es una pequeña decisión de diseño que silenciosamente hace que una paleta luzca cara.

**🎯 Resultado esperado :** Imprime `brand: #3b82f6`, luego los matices más claros y más oscuros en la misma familia de hue, con el hex de marca seguido de las seis variantes desplazadas en luminosidad.

**🩹 Si sale mal :** Si la variante más clara no se reconoce como el mismo color, la saturación es demasiado baja o el desplazamiento de luminosidad pasó de 95 — entraste en territorio casi blanco donde el hue es invisible. Si dos matices adyacentes (p. ej., `light` y `lighter`) se ven casi idénticos, tus compensaciones están demasiado cerca — sepáralas.

### 2.2 Verifica la paleta

**✅ Lista de verificación**

- ✅ Cada color de la paleta comparte el mismo ángulo de hue (217° para `#3b82f6`), confirmado llamando a `hex_to_hsl` sobre cada uno.
- ✅ La muestra más clara es claramente distinta del blanco puro, y la más oscura no es completamente negra.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué no generar una paleta sumando 15 al canal rojo RGB del color base en lugar de recorrer la luminosidad HSL? ¿Qué le pasa al color percibido cuando cambias R, G y B por igual?
- Si un gerente de marca te diera dos colores hex y te pidiera construir una paleta con *ambos* como anclas, ¿qué arreglarías o descartarías en `generate_palette` para que funcionara?

## Paso 3: Verificar los ratios de contraste WCAG

La accesibilidad no es cuestión de gusto — es cuestión de ratios. WCAG 2.1 dice que el texto normal necesita un ratio de contraste de 4.5:1 contra su fondo (AA) y 3:1 para texto grande; AAA lo sube a 7:1. Estos umbrales son concretos, y cualquier herramienta que genere paletas *debe* probarlos — de lo contrario estás adivinando si la mitad de tus usuarios puede leer las palabras.

### 3.1 Escribir las funciones de verificación de contraste

**👟 Pista inicial :** La luminancia relativa de WCAG *no* es un promedio simple — aplica una linealización sRGB por tramos que es más generosa con los valores de canal oscuros. Implementa las dos fórmulas exactamente como las establece la especificación.

```python
# design_system.py (continuación)
def relative_luminance(hex_color: str) -> float:
    """Calculate relative luminance per WCAG 2.1 (sRGB linearization)."""
    r, g, b = hex_to_rgb(hex_color)
    channels = []
    for val in (r, g, b):
        srgb = val / 255
        linear = srgb / 12.92 if srgb <= 0.03928 else ((srgb + 0.055) / 1.055) ** 2.4
        channels.append(linear)
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]

def contrast_ratio(color1: str, color2: str) -> float:
    """Calculate WCAG contrast ratio between two hex colors."""
    l1, l2 = relative_luminance(color1), relative_luminance(color2)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def check_accessibility(foreground: str, background: str) -> str:
    """Check if a color pair meets WCAG AA and AAA standards."""
    ratio = contrast_ratio(foreground, background)
    aa_normal = ratio >= 4.5
    aa_large  = ratio >= 3.0
    aaa       = ratio >= 7.0
    status = "AAA" if aaa else ("AA" if aa_normal else "Fail")
    size = "normal text" if aa_normal else ("large text" if aa_large else "insufficient")
    return f"  {foreground} on {background}: {ratio:.1f}:1 -> {status} ({size})"

# Test the most common palette combos
print(check_accessibility("#1e293b", "#ffffff"))
print(check_accessibility("#3b82f6", "#ffffff"))
print(check_accessibility("#64748b", "#ffffff"))
print(check_accessibility("#ffffff", "#1e293b"))
```

La fórmula de linealización — `srgb / 12.92` para valores por debajo de 0.03928, `((srgb + 0.055) / 1.055) ** 2.4` en caso contrario — parece arbitraria pero coincide con la curva que tu monitor realmente dibuja. El promedio ponderado `0.2126·R + 0.7152·G + 0.0722·B` refleja que el verde transporta la mayor parte de la luminancia en la visión humana. Hacer bien el ratio significa no adivinar si `#3b82f6` sobre blanco en realidad pasa AA (sí lo hace, apenas con ~4.5:1) — lo has probado numéricamente.

**🎯 Resultado esperado :** Cuatro líneas: `#1e293b` sobre blanco es **AAA** (texto normal); `#3b82f6` sobre blanco es **AA** (texto normal — justo en el umbral); `#64748b` sobre blanco **falla** el texto normal pero pasa el grande; y `#ffffff` sobre `#1e293b` refleja la primera fila.

**🩹 Si sale mal :** Si cada ratio imprime 1.0:1, ambos colores son idénticos — pasaste el mismo hex dos veces, o `relative_luminance` devuelve el mismo valor para ambos (revisa el corte de la rama de linealización). Si un par que *debería* pasar AA falla, tu fórmula de luminancia probablemente usa los canales RGB en el orden equivocado (revisa los pesos `0.2126`/`0.7152`/`0.0722` — corresponden a R, G, B, no a cualquier otro orden).

### 3.2 Verifica el control de contraste

**✅ Lista de verificación**

- ✅ Puedes nombrar un emparejamiento de paleta que pase AAA y uno que falle AA — y verificar que ambos números coincidan con la especificación.
- ✅ Puedes explicar por qué los dos casos "justo en 4.5" alrededor de `#3b82f6` hacen que las elecciones de luminosidad del generador de paleta sean importantes, no decorativas.

**🤔 Pregunta(s) socrática(s)**

- Una diseñadora elige texto `gray-400` sobre un fondo `gray-100`. El ratio es ~5.2:1 — pasa AA. ¿Debería usarlo? ¿Qué le pasa a ese ratio en una pantalla de laptop barata con gamma pobre, y qué sugiere eso sobre construir márgenes de seguridad en la paleta?
- WCAG 2.2 añadió un nivel de contraste "mejorado". ¿Cómo cambiaría el código, y qué restricción añadirías a `check_accessibility` para emitir tres niveles en lugar de dos?

## Paso 4: Construir una escala tipográfica y una escala de espaciado

Un tamaño de fuente no existe en aislamiento — es una *relación* con el tamaño base. Una escala modular hace que esa relación sea mecánica: cada paso multiplica por el mismo ratio, así el ritmo de una página se mantiene visualmente consistente. Combínala con una escala de espaciado aritmética limpia, y todos los tokens de layout del sistema de diseño salen de dos números.

### 4.1 Genera las escalas

**👟 Pista inicial :** Usa un tamaño base de 16 px (un `rem` de CSS por defecto) y un ratio de 1.25 (la "Tercera Mayor"), produciendo exactamente 8 etiquetas — de `xs` a `3xl`.

```python
# design_system.py (continuación)
def typography_scale(base: float = 16, ratio: float = 1.25, steps: int = 8) -> dict:
    """Generate a typographic scale from a base size and a modular ratio."""
    labels = ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl"]
    scale = {}
    for i, label in enumerate(labels[:steps]):
        size = base * (ratio ** (i - 2))
        scale[label] = {
            "size_px": round(size, 1),
            "size_rem": round(size / 16, 3),
            "line_height": round(1.2 + 0.1 * (steps - i) / steps, 2),
        }
    return scale

def spacing_scale(base: float = 4, steps: int = 10) -> dict:
    """Generate a linear spacing scale in pixels."""
    return {f"{i + 1}": base * (i + 1) for i in range(steps)}

typo = typography_scale()
spacing = spacing_scale()
for label, props in typo.items():
    print(f"  {label:>4}: {props['size_px']:>5.1f}px = {props['size_rem']}rem  (line-height {props['line_height']})")
print("  spacing:", spacing)
```

La compensación `(i - 2)` significa que `base` (índice 2) mapea exactamente a 16 px, con `xs` y `sm` más pequeños y `lg`–`3xl` más grandes — la base se asienta justo en el medio, que es donde vive la mayor parte del texto de cuerpo. `spacing_scale` es deliberadamente lineal (1×, 2×, …, 10× la base) en lugar de geométrica porque los márgenes y los paddings crecen de forma aditiva en el layout, no multiplicativa — esa es la diferencia entre "la escala crece como piensan los diseñadores" y "la escala crece como se siente la matemática".

**🎯 Resultado esperado :** Imprime `xs: 10.2px = 0.64rem` (el más pequeño), `base: 16.0px = 1.0rem`, hasta `3xl: 39.1px = 2.44rem`; el espaciado imprime `{1: 4, 2: 8, …, 10: 40}`.

**🩹 Si sale mal :** Si `xs` y `sm` salen invertidos, tu compensación es `(i + 2)` en lugar de `(i - 2)`. Si las alturas de línea son todas idénticas, la expresión se simplificó a una constante — asegúrate de que el término `(steps - i)` varíe.

### 4.2 Verifica la escala

**✅ Lista de verificación**

- ✅ `base` en la escala tipográfica es exactamente 16 px y 1.0 rem.
- ✅ Cada paso de la escala tipográfica es exactamente 1.25× el paso anterior (dentro del redondeo).

**🤔 Pregunta(s) socrática(s)**

- ¿Qué pasa si cambias el ratio de 1.25 a 1.333 ("Cuarta Perfecta") — qué titulares crecen más, y cuándo elegirías uno sobre el otro?
- ¿Por qué no usar también `spacing_scale` para los tamaños de fuente? ¿Qué tiene una escala lineal (12, 16, 20, 24…) que la hace fallar para los titulares?

## Paso 5: Renderizar una tarjeta de muestras de paleta

Un archivo de paleta con cadenas hex es útil para una computadora, no para una persona. Una tarjeta de muestras es la misma paleta como imagen — visual, inmediatamente legible y compartible. También te da la oportunidad de confirmar, *mirándola*, que la paleta en realidad se ve como prometían los números.

### 5.1 Construye el renderizador de muestras

**👟 Pista inicial :** Usa `matplotlib.patches.Rectangle` para dibujar un bloque relleno por color de paleta, y luego añade una etiqueta de texto. Mantén el eje apagado y el layout compacto.

```python
# design_system.py (continuación)
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

def render_palette(palette: dict, filepath: str = "palette.png") -> None:
    """Render a vertical swatch card showing every color in the palette."""
    colors = list(palette.items())
    fig, ax = plt.subplots(figsize=(8, 0.55 * len(colors)))
    for i, (name, hex_color) in enumerate(colors):
        ax.add_patch(mpatches.Rectangle((0, i), 1, 1, color=hex_color, edgecolor="white", linewidth=2))
        ax.text(0.52, i + 0.3, f"{name}: {hex_color}", fontsize=8, color="#1e293b", fontfamily="monospace")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, len(colors))
    ax.axis("off")
    plt.tight_layout()
    plt.savefig(filepath, dpi=150)
    print(f"Saved {filepath}")
    plt.show()

render_palette(palette)
```

Cada `Rectangle` ocupa el ancho completo (`0` a `1`) y una unidad de altura (`i` a `i+1`), con bordes blancos creando un canal visual entre las muestras. El color del texto `#1e293b` (un carbón oscuro, casi negro) está codificado para mantenerse legible sobre muestras claras — para una herramienta de producción, cambiarías condicionalmente a texto blanco sobre colores oscuros. `plt.show()` muestra en línea en un notebook y abre una ventana localmente; `plt.savefig` escribe el PNG de todas formas.

**🎯 Resultado esperado :** Un PNG `palette.png` con 15 muestras verticales (7 matices de marca + 9 matices de gris), cada una etiquetada en monospace, y ya sea una ventana de matplotlib o una visualización en línea.

**🩹 Si sale mal :** Si las etiquetas se salen por el borde derecho, la figura es demasiado angosta — sube el ancho de `figsize`. Si las etiquetas son ilegibles sobre muestras oscuras, el texto `color="#1e293b"` debe darse vuelta a blanco; esta es una simplificación conocida y aceptable para el alcance actual del generador. Si la figura muestra solo 3 muestras, el dict de la paleta se truncó en el print — asegúrate de que existan las 15 claves antes de llamar.

### 5.2 Verifica la tarjeta de muestras

**✅ Lista de verificación**

- ✅ `palette.png` contiene exactamente 15 filas etiquetadas y puede abrirse en cualquier visor de imágenes.
- ✅ Puedes confirmar visualmente que las muestras `gray-*` comparten un tinte consistente con el color de marca, en lugar de un gris neutro puro.

**🤔 Pregunta(s) socrática(s)**

- Si un compañero de equipo dice "la muestra se ve lavada", ¿dónde en el pipeline cambiarías la saturación — y la cambiarías globalmente (Paso 2) o solo para la subfamilia de grises?
- ¿Cómo añadirías una etiqueta hex que seleccione automáticamente texto blanco u oscuro según la luminancia, y qué función del Paso 3 ya hace el cálculo que necesitarías?

## Paso 6: Exportar tokens de diseño como CSS

La prueba real de un sistema de diseño es si alguien puede usarlo sin entender cómo se construyó. Las propiedades CSS personalizadas son el entregable más portátil: pega el archivo en una etiqueta `<link>` o `@import` y cada componente del proyecto puede referenciar `--color-brand`, `--font-size-lg` o `--space-4` sin conocimiento de HSL ni de escalas modulares.

### 6.1 Construye la función de exportación

**👟 Pista inicial :** Recorre cada diccionario (`palette`, `typo`, `spacing`), formatea cada valor como una línea `--variable: value;`, y escribe el resultado unido en un archivo `.css`.

```python
# design_system.py (continuación)
def export_css(palette: dict, typography: dict, spacing: dict, filepath: str = "design-tokens.css") -> str:
    """Export design tokens as a CSS custom properties file."""
    lines = [":root {", "  /* Brand Colors */"]
    for name, color in palette.items():
        lines.append(f"  --color-{name}: {color};")

    lines += ["", "  /* Typography */"]
    for label, props in typography.items():
        lines.append(f"  --font-size-{label}: {props['size_rem']}rem;")
        lines.append(f"  --line-height-{label}: {props['line_height']};")

    lines += ["", "  /* Spacing */"]
    for step, value in spacing.items():
        lines.append(f"  --space-{step}: {value}px;")

    lines += ["}"]
    css = "\n".join(lines)
    with open(filepath, "w") as f:
        f.write(css)
    print(f"Design tokens exported to {filepath}")
    return css

css_output = export_css(palette, typo, spacing)
print("\n" + css_output)
```

Cada sección comenta su categoría (`/* Brand Colors */`, `/* Typography */`, `/* Spacing */`) porque el archivo eventualmente se pegará en una base de código donde otra persona lo está leyendo. Usar `rem` en lugar de `px` para los tamaños de fuente es deliberado — hereda la configuración de zoom del navegador y es el estándar para CSS accesible y responsivo. Imprimir el contenido del archivo en stdout al final te da una confirmación visual instantánea de que la estructura está bien, incluso antes de abrir el archivo CSS en un editor.

**🎯 Resultado esperado :** `design-tokens.css` se escribe, y su contenido se imprime en stdout: `:root {` con 15 propiedades `--color-*`, 16 pares `--font-size-*` / `--line-height-*`, y 10 valores `--space-*` — 42 tokens en total.

**🩹 Si sale mal :** Si el archivo CSS está vacío o le falta `:root`, verifica que `lines` se está uniendo y escribiendo — un `return` temprano antes de `open()` es el culpable habitual. Si una línea parece `--color-brand: #3b82f6` sin punto y coma, a la f-string le falta `;` — el token está sintácticamente roto y se comerá silenciosamente cada propiedad que le siga en el mismo bloque de regla.

### 6.2 Verifica la exportación

**✅ Lista de verificación**

- ✅ `design-tokens.css` existe, empieza con `:root {`, y contiene 42 propiedades personalizadas en las tres secciones correctas.
- ✅ Pegar una línea — `h1 { color: var(--color-brand); font-size: var(--font-size-xl); }` — en cualquier archivo HTML se resuelve a los valores correctos.

**🤔 Pregunta(s) socrática(s)**

- El archivo exportado usa `px` para el espaciado y `rem` para los tamaños de fuente. ¿Por qué mezclar unidades es correcto aquí, y qué pasaría si usaras `px` también para `font-size` — específicamente, qué pasa cuando se aumenta la configuración de zoom de un navegador?
- Si quisieras el mismo sistema de diseño disponible en modo claro y oscuro, ¿dónde en este pipeline insertarías una segunda exportación de paleta, y cómo estructurarías el CSS para que cambie automáticamente?

## ⚠️ Errores comunes

- **Confundir `colorsys.rgb_to_hls` con `rgb_to_hsv`.** Las dos funciones tienen formas de retorno diferentes e intercambian dónde aparece la saturación. Si tu paleta generada tiene hues completamente equivocados, imprime la salida cruda de `hex_to_hsl` antes de que cualquier cosa aguas abajo la toque — el bug siempre está ahí.
- **El recorte de luminosidad hace indistinguibles los matices adyacentes.** `min(l + 35, 95)` pone un techo al matiz más claro, pero si la luminosidad del color base ya es alta (digamos, una marca pastel al 80), toda la mitad superior de la paleta colapsa hacia el casi blanco. Una solución práctica: reducir los tamaños de paso o ampliar el rango dinámicamente según la luminosidad base.
- **Pesos de luminancia relativa aplicados en el orden de canal equivocado.** WCAG especifica `0.2126·R + 0.7152·G + 0.0722·B` — ninguna otra permutación. Aplicarlo al revés produce ratios sutilmente incorrectos que pueden dar vuelta un AA aprobado en un AA fallido.
- **Confusión de rem vs px en la escala tipográfica.** `size_rem` es siempre `size_px / 16` — si accidentalmente emites el valor en píxeles con una etiqueta `rem`, cada tamaño será exactamente 16× demasiado grande y toda la página se disparará.
- **Generar una paleta sin considerar la luminosidad existente del color base.** Un color base oscuro desplazado 35 puntos más oscuro ya es negro — el extremo oscuro de la paleta se vuelve ilegible. Prueba el generador contra un hex de marca oscuro y uno claro antes de enviarlo.

## Lo que acabas de construir

Un generador de sistemas de diseño autocontenido: elegiste un color de marca, y el script produjo una familia completa de matices y grises, verificó cada par texto/fondo contra las reglas de accesibilidad WCAG, generó una escala tipográfica y de espaciado con un ratio matemáticamente consistente, renderizó una tarjeta de muestras de paleta compartible como PNG, y exportó 42 propiedades CSS personalizadas listas para colocar en cualquier proyecto web. Nada de la salida requiere ojo de diseñador para usarse — cualquier desarrollador frontend puede importar el archivo CSS y referenciar `--color-brand` sin abrir nunca el código fuente de Python.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/design-system/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/design-system) en el repositorio del curso es una versión de notebook ejecutable de cada paso de arriba: pega un color de marca, ejecuta todas las celdas, y obtén la imagen de la paleta y el archivo CSS en una sola ejecución del notebook. Hazle un clone, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecuta desde ahí.
:::

## A dónde ir desde aquí

- Añade una **variante de modo oscuro**: invierte los valores de luminosidad (intercambia `l` por `100 - l`) manteniendo hue y saturación fijos, y luego exporta un segundo archivo CSS bajo un media query `@media (prefers-color-scheme: dark)` para que el sistema cambie automáticamente.
- Construye una **página HTML de vista previa de paleta**: genera una guía de estilo viva que muestra cada color, cada tamaño de fuente y cada valor de espaciado en uso real — titulares en la escala, demos de padding en cada nivel de espaciado — y sírvela localmente mientras ajustas el sistema de diseño.
- Añade **tokens de componentes** (padding de botones, radio de borde, altura de inputs) como una nueva sección `/* Components */` en la exportación CSS, haciendo que el sistema de diseño sea directamente consumible por una biblioteca de componentes como React o Vue.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python que hace que CSS piense por sí mismo. 🎓