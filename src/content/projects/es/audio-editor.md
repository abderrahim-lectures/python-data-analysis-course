---
title: "Editor de Audio"
description: "Construir un editor de audio de línea de comandos en Python: sintetiza un tono de prueba, recorta y funde clips con precisión de milisegundos, convierte formatos, empalma montajes y renderiza formas de onda."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["pydub", "audio-processing", "matplotlib", "waveform", "numpy"]
learningObjectives:
  - "Sintetizar un tono de prueba limpio a partir de matemática cruda de muestras"
  - "Recortar y empalmar archivos de audio con precisión de milisegundos"
  - "Aplicar fundidos, normalización de volumen y conversión de formato"
  - "Combinar varios clips en una sola pista"
  - "Generar visualizaciones de forma de onda para análisis de audio"
prerequisites: ["Conceptos básicos de Python", "E/S de archivos"]
---

# 🛠️ 🎧 Construye un Editor de Audio

Cada episodio de podcast, tono de llamada y efecto de sonido de videojuego pasó por el mismo pipeline: alguien recortó las partes buenas, fundió los bordes para que nada haga clic, ajustó el volumen y cosió las piezas. Los estudios profesionales hacen esto en apps pesadas; este proyecto construye un pequeño editor de audio de línea de comandos en Python que hace todo eso con archivos de audio reales usando `pydub` — recorte con precisión de milisegundos, fundidos, normalización de volumen, conversión de formato, empalme de clips y una imagen de forma de onda para que puedas *ver* exactamente lo que cambiaste.

Esto asume Python 101 y E/S básica de archivos — nada de Análisis de Datos es requerido. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Instalar `uv`, el stack `pydub`/`numpy`/`matplotlib` y un `ffmpeg` funcional para que los formatos comprimidos tengan un codificador real detrás.
2. Sintetizar un tono de prueba limpio desde cero — una fuente garantizada de audio sin importar qué archivos poseas.
3. Recortar, fundir y normalizar el volumen de un clip con precisión de milisegundos.
4. Convertir entre WAV, MP3 y OGG y empalmar varios clips en un montaje sin costuras.
5. Renderizar una forma de onda para que puedas ver exactamente lo que tus ediciones le hicieron al sonido.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado — `pydub` delega la codificación de MP3/OGG al binario `ffmpeg`, y esa es la única dependencia que este proyecto no puede instalar por ti desde PyPI. Instalarás `ffmpeg` a través del gestor de paquetes de tu sistema en Configuración; todo después corre desde tu terminal.

**GitHub Codespaces** funciona bien también: abre [el repositorio completo del curso en un Codespace gratis](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) — `ffmpeg` ya está instalado ahí, así que cada paso de abajo (incluidas las conversiones de formato del paso 3) corre sin tocar el sistema.

**Google Colab, Kaggle Notebooks y Binder son una forma genuina de ejecutar esto casi de extremo a extremo** — más honesto que la mayoría de los proyectos, porque nada aquí depende de tu historial git local. La salvedad honesta es la entrada de audio: un notebook no tiene ninguno de tus archivos de audio, así que el notebook de abajo *sintetiza el mismo tono de prueba* que construyes en el paso 1 y trabaja con ese. También puede instalar un binario `ffmpeg` para el paso de conversión de formato, así que incluso la conversión a MP3/OGG funciona — solo está convirtiendo un tono que nadie grabó, en lugar de un clip que te importa. Úsalo para ver correr todo el pipeline con cero configuración; cambia a `uv` local o a un Codespace una vez que quieras apuntarlo a tus propias grabaciones.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audio-editor/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audio-editor/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Faudio-editor%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de escribir una línea del editor mismo: un toolchain de Python moderno, las bibliotecas de audio y el único binario de sistema del que `pydub` no puede vivir sin.

### Instala `uv`

`uv` es una sola herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes" — puede instalar y gestionar versiones de Python él mismo, junto con las dependencias de tu proyecto.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y reabre tu terminal, luego confirma que se instaló:

```bash
uv --version
```

### Configura el proyecto

```bash
uv init audio-editor
cd audio-editor
uv add pydub numpy matplotlib
```

`pydub` es el editor de audio mismo — carga, corta y exporta audio. `numpy` convierte las muestras crudas del audio en un arreglo que puedes analizar, y `matplotlib` dibuja la forma de onda que renderizarás en el paso 5. Los tres se instalan desde PyPI con un solo comando.

### Instala `ffmpeg`

`pydub` solo maneja WAV sin comprimir de forma nativa. En el momento en que exportes MP3 u OGG (paso 3), se apoya en el binario `ffmpeg` de tu sistema:

- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt install ffmpeg`
- **Windows** (choco): `choco install ffmpeg` — o instala la compilación de ffmpeg.org y agrégala a tu PATH

Confirma que tu shell lo ve:

```bash
ffmpeg -version
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `audio-editor/` existe con un `pyproject.toml`, y `pydub`, `numpy` y `matplotlib` están instalados.
- ✅ `ffmpeg -version` imprime el banner de versión de FFmpeg (Está bien saltárselo si solo tocas WAV — de lo contrario chocarás contra la pared en el paso 3).

## Paso 1: Sintetiza e inspecciona un tono de prueba

La mayoría de los proyectos de audio comienzan con "carga un archivo que tengas" — lo que falla en silencio en el momento en que el aprendiz no tiene un `.mp3` a la mano. Así que este proyecto arranca al revés: *construirás* una onda senoidal limpia de 3 segundos a partir de números crudos, y luego la inspeccionarás como si fuera cualquier archivo importado. Generar audio es también la forma más rápida posible de entender qué es realmente una muestra: un entero con signo por fotograma, y el "tono" es apenas lo rápido que ese entero oscila.

### 1.1 Construye un tono a partir de muestras crudas

**👟 Pista inicial :** Comienza con una onda senoidal mono de 16 bits y 44.1 kHz a 440 Hz (la A de concierto) usando solo el módulo `array` de la biblioteca estándar, y luego envuelve los bytes resultantes en un `AudioSegment` de `pydub`.

```python
# audio_editor.py
import math
from array import array
from pathlib import Path

from pydub import AudioSegment

def make_test_tone(freq: float = 440.0, ms: int = 3000, gain_db: float = -12.0, sample_rate: int = 44100) -> AudioSegment:
    """A clean 16-bit sine wave: `freq` Hz, `ms` milliseconds long, at `gain_db` dB."""
    n_samples = int(ms / 1000 * sample_rate)
    raw = array("h", (int(32767 * 0.5 * math.sin(2 * math.pi * freq * t / sample_rate)) for t in range(n_samples)))
    return AudioSegment(raw.tobytes(), frame_rate=sample_rate, sample_width=2, channels=1).apply_gain(gain_db)

tone = make_test_tone()
print(f"Duration: {len(tone) / 1000:.1f} seconds")
print(f"Channels: {tone.channels} (mono)")
print(f"Sample rate: {tone.frame_rate} Hz")
print(f"Sample width: {tone.sample_width} bytes (16-bit)")
print(f"Loudness: {tone.dBFS:.1f} dBFS")
tone.export(Path("tone.wav"), format="wav")
print("Saved tone.wav")
```

Cada línea aquí enseña un concepto de audio real. `array("h", ...)` escribe enteros con signo de 16 bits — los dos bytes (`sample_width=2`) que componen cada muestra en un archivo estándar de calidad CD. La expresión de adentro computa `sin(2π·freq·t / sample_rate)`: multiplicar el argumento del seno por `t/sample_rate` convierte *muestras* transcurridas en *segundos* transcurridos, así que 440 Hz significa que la onda completa 440 ciclos completos por segundo. `apply_gain` escala la sonoridad en el dominio de decibelios, que es como los oídos (y el resto de este proyecto) hablan del volumen.

**🎯 Resultado esperado :** Imprime `Duration: 3.0 seconds`, `Channels: 1 (mono)`, `Sample rate: 44100 Hz`, `Sample width: 2 bytes (16-bit)`, una lectura de sonoridad alrededor de **-21 dBFS** y `Saved tone.wav`.

**🩹 Si sale mal :** Si `apply_gain` u otra llamada de pydub lanza un error opaco, puedes tener una versión obsoleta de pydub — corre `uv add pydub` de nuevo para obtener una reciente. Si la impresión de sonoridad no está cerca de -21 dBFS, recuerda que `dBFS` es sonoridad *RMS*: una senoidal a media escala pica en -6 dBFS pero lee ~3 dB más bajo en promedio, y tu ganancia `-12` desplaza toda esa lectura hacia abajo. Si la exportación WAV falla, no es ffmpeg — WAV es la ruta nativa de pydub; revisa que la ruta del archivo sea escribible.

### 1.2 Verifica el tono

**✅ Lista de verificación**

- ✅ `make_test_tone()` devuelve un `AudioSegment` de 3.0 s, mono, 44.1 kHz, 16 bits, y `tone.wav` existe.
- ✅ Puedes leer de vuelta, con tus propias palabras, cómo `t / sample_rate` convierte el índice de muestra en segundos.
- ✅ Puedes decir por qué el audio de 16 bits almacena cada muestra en 2 bytes.

**🤔 Pregunta(s) socrática(s)**

- ¿Qué cambiaría del tono si quitaras el `* 0.5` antes de `int(...)` en la expresión del seno? (Esa es una forma rápida de sentir la diferencia entre "recorte" y "audio silencioso".)
- ¿Por qué duplicar la frecuencia de 440 a 880 Hz *dividiría a la mitad* el periodo del tono pero mantendría idéntica la duración de exactamente 3 segundos?

## Paso 2: Recorta, funde y normaliza un clip

El audio real nunca es uniformemente fuerte y nunca arranca en un cruce por cero conveniente. Tres ediciones arreglan eso: **recortar** quita las partes que no quieres, **fundir** rampa el volumen en los bordes para que no escuches un clic, y la **normalización** desplaza la sonoridad general a un nivel objetivo para que tu clip se asiente consistentemente junto a otros.

### 2.1 Escribe las tres funciones de edición

**👟 Pista inicial :** Escribe funciones planas — `trim_audio(audio, start_ms, end_ms)`, `apply_fades(...)` y `normalize_volume(...)` — cada una devolviendo un `AudioSegment` *nuevo*, nunca mutando la entrada.

```python
# audio_editor.py (continued)
def trim_audio(audio: AudioSegment, start_ms: int, end_ms: int) -> AudioSegment:
    """Extract the segment between start_ms and end_ms, clamped to valid bounds."""
    start_ms = max(0, start_ms)
    end_ms = min(len(audio), end_ms)
    return audio[start_ms:end_ms]

def apply_fades(audio: AudioSegment, fade_in_ms: int = 1000, fade_out_ms: int = 1000) -> AudioSegment:
    """Ramp volume up over fade_in_ms and back down over fade_out_ms to avoid clicks."""
    return audio.fade_in(fade_in_ms).fade_out(fade_out_ms)

def normalize_volume(audio: AudioSegment, target_db: float = -20.0) -> AudioSegment:
    """Shift the whole clip so its average (RMS) loudness lands on target_db."""
    return audio.apply_gain(target_db - audio.dBFS)
```

Rebanar un `AudioSegment` con `[start_ms:end_ms]` funciona exactamente como rebanar una lista, pero las unidades son milisegundos — y a diferencia de un humano con una navaja, Python siempre hace una *copia*, así que tu `tone` original sobrevive a cada recorte. Fundir al inicio no es decoración: una forma de onda que arranca a plena amplitud pasa del silencio a un grito en una sola muestra, lo que suena como un clic; un fundido de unos pocos cientos de milisegundos deja que el oído siga el cambio. La normalización es una sola resta en el dominio de decibelios — los decibelios son logarítmicos, así que `target_db - audio.dBFS` es precisamente la corrección necesaria (no se requiere multiplicación, porque sumar decibelios es multiplicar amplitudes).

**🎯 Resultado esperado :** Las funciones están definidas; `len(trim_audio(tone, 500, 2500))` devuelve 2000 (2.0 segundos) aunque pediste medio segundo dentro de un tono de 3 segundos.

**🩹 Si sale mal :** Si un recorte devuelve un segmento (casi) vacío, tu `start_ms` es mayor o igual que `end_ms` — la rebanada está vacía, y pydub no se quejará. Si normalizar un clip *silencioso* lanza o imprime un número bizarro, es porque el silencio tiene `dBFS = -inf`: restar `-inf` da infinito, que está indefinido como ganancia — normaliza siempre audio que realmente tenga sonido.

### 2.2 Aplica las ediciones y exporta

**👟 Pista inicial :** Corta el tono a 500–2500 ms, funde 200 ms de entrada y 400 ms de salida, normaliza a -18 dBFS y exporta `clip.wav`.

```python
clip = trim_audio(tone, 500, 2500)
clip = apply_fades(clip, fade_in_ms=200, fade_out_ms=400)
clip = normalize_volume(clip, target_db=-18.0)
clip.export("clip.wav", format="wav")
print(f"Exported clip.wav ({len(clip) / 1000:.1f}s)")
```

**🎯 Resultado esperado :** Imprime `Exported clip.wav (2.0s)` y escribe un WAV de 2 segundos cuya forma de onda rampa hacia arriba al inicio.

**🩹 Si sale mal :** Si imprime `0.0s`, la rebanada de recorte estaba al revés (ver 2.1). Si el clip es *cegadoramente* fuerte o silencioso después de la normalización, el `target_db` que elegiste está lejos de donde arrancó el tono — `apply_gain` lo empujará ahí encantado, lo que es correcto pero puede sorprenderte; marca `target_db` en -18 y escucha un nivel cómodo.

### 2.3 Verifica las ediciones

**✅ Lista de verificación**

- ✅ `clip.wav` dura exactamente 2.0 segundos y reproduce con un fundido de entrada y salida suaves.
- ✅ El `tone.wav` original está intacto en 3.0 segundos — el recorte no mutó la fuente.
- ✅ Puedes explicar por qué la normalización es *suma/resta en dB* en lugar de multiplicación de las muestras crudas.

**🤔 Pregunta(s) socrática(s)**

- Si aplicaras el fundido *después* de normalizar, ¿mediría la sonoridad final aún -18 dBFS? ¿Por qué el *orden* de fundir-luego-normalizar (o normalizar-luego-fundir) es una decisión real con un resultado diferente?
- `apply_fades` devuelve `audio.fade_in(...).fade_out(...)`, encadenando dos llamadas. ¿Qué se rompería si `fade_in` devolviera `None` — y qué te dice eso sobre por qué los métodos de pydub devuelven segmentos nuevos?

## Paso 3: Convierte entre formatos

Un solo archivo WAV es el equivalente de audio de un `.txt` — sin comprimir y gigante. Compartir normalmente significa MP3 (para las personas), OGG (para pipelines de código abierto) o FLAC (para archivos sin pérdida). La conversión de formato es el único paso de este proyecto que llama a un binario separado: `pydub` escribe lo que le pidas, pero `ffmpeg` hace la codificación real.

### 3.1 Escribe `convert_format`

**👟 Pista inicial :** Escribe una función que cargue *cualquier* ruta legible y la re-exporte bajo un formato diferente, tomando el formato explícitamente para que no haya adivinanzas a partir de extensiones.

```python
# audio_editor.py (continued)
def convert_format(input_path: str, output_path: str, fmt: str = "wav") -> None:
    """Load any pydub-supported file and re-save it as `fmt`."""
    audio = AudioSegment.from_file(input_path)
    audio.export(output_path, format=fmt)
    print(f"Converted {input_path} -> {Path(output_path).name}")

convert_format("clip.wav", "clip.mp3", fmt="mp3")
convert_format("clip.wav", "clip.ogg", fmt="ogg")
```

`AudioSegment.from_file` olfatea el formato del archivo, así que el cargador se mantiene genérico — y pasar `format=` a `export` elimina cualquier ambigüedad sobre lo que pediste. Nota que no hay manejo de errores alrededor de las exportaciones respaldadas por `ffmpeg`: si el binario falta, `pydub` lanza un `FileNotFoundError` claro que lo nombra, que es el fallo que queremos que veas *una vez* para que nunca olvides que el paso 1 se tradujo a este momento.

**🎯 Resultado esperado :** Imprime `Converted clip.wav -> clip.mp3` y `Converted clip.wav -> clip.ogg`, y ambos archivos nuevos existen con tamaños **mucho más pequeños** que `clip.wav` (MP3/OGG son compresión con pérdida).

**🩹 Si sale mal :** Si obtienes `FileNotFoundError: ffmpeg not found` (o similar), `ffmpeg` no está en el PATH — corre el paso de Configuración que te saltaste y verifica `ffmpeg -version`. Si la exportación MP3 tiene éxito pero la OGG falla, tu compilación de ffmpeg puede carecer del codificador OGG, que es una brecha específica de la compilación; convierte a `.ogg` vía `ffmpeg` directamente una vez en una terminal para confirmar que el códec está presente.

### 3.2 Verifica la conversión

**✅ Lista de verificación**

- ✅ `clip.mp3` y `clip.ogg` existen y ambos son dramáticamente más pequeños que `clip.wav`.
- ✅ Puedes nombrar qué paso de este proyecto genuinamente no puede correr sin un binario no-Python.

**🤔 Pregunta(s) socrática(s)**

- WAV → MP3 pierde información; MP3 → WAV la preserva pero *no* restaura lo que se perdió. ¿Qué implica eso sobre convertir un archivo de ida y vuelta repetidamente, y cuándo sería cada dirección la llamada correcta?
- ¿Por qué la función de carga no necesita un argumento `format=` mientras que la de exportación se beneficia de uno?

## Paso 4: Combina clips en un montaje

Editar no es solo cortar — también es juntar piezas. El mismo operador `+` que usaste para sentir el rebanado une segmentos de punta a punta, y un `AudioSegment.silent(...)` explícito te deja insertar huecos deliberados de aire muerto entre ellos, como un podcast inserta un beat entre segmentos.

### 4.1 Escribe `combine_clips`

**👟 Pista inicial :** Maneja el caso de lista vacía primero, y luego pliega los clips con `+=`, insertando `gap_ms` de silencio entre clips consecutivos.

```python
# audio_editor.py (continued)
def combine_clips(clips: list[AudioSegment], gap_ms: int = 0) -> AudioSegment:
    """Concatenate clips with `gap_ms` of silence between consecutive ones."""
    if not clips:
        return AudioSegment.empty()
    silence = AudioSegment.silent(duration=gap_ms)
    combined = clips[0]
    for clip in clips[1:]:
        combined += silence + clip
    return combined

intro = trim_audio(tone, 0, 1000)
middle = trim_audio(tone, 1200, 2200)
outro = trim_audio(tone, 2400, 3000)
montage = combine_clips([intro, middle, outro], gap_ms=250)
montage.export("montage.wav", format="wav")
print(f"Montage: {len(montage) / 1000:.1f}s")
```

El hábito importante aquí es la comprobación de lista vacía primero: concatenar una lista vacía colapsaría en el momento en que indexas `clips[0]`, y un *editor de audio* que colapsa ante el silencio es embarazoso. El patrón de construcción — comenzar con `clips[0]` y luego anexar `silence + clip` por cada uno restante — es una versión falsy de un pliegue estilo `sum`, y es idiomático para cualquier cosa (audio, listas, fragmentos HTML) donde el elemento de unión no es la identidad.

**🎯 Resultado esperado :** Imprime `Montage: 3.1s` — tres segmentos que totalizan 2.6 s *más* dos huecos de silencio de 250 ms — y escribe `montage.wav`.

**🩹 Si sale mal :** Si `combine_clips([])` colapsa con un error de índice, la guardia se cayó — trae de vuelta el temprano `if not clips: return`. Si la longitud total no es 2.6 s + (n-1)·gap, una de tus rebanadas de `trim_audio` se extiende fuera del tono y fue ajustada (pediste más de 3.0 s), así que revisa las duraciones crudas de `intro`/`middle`/`outro`.

### 4.2 Verifica el montaje

**✅ Lista de verificación**

- ✅ `montage.wav` dura exactamente 3.1 s y reproduce tres segmentos de tono separados por huecos silenciosos.
- ✅ `combine_clips([], gap_ms=250)` devuelve un segmento vacío válido sin colapsar.

**🤔 Pregunta(s) socrática(s)**

- `montage` se construyó sin fundidos entre segmentos. Enlista los dos problemas que esperarías *escuchar* en cada unión, y dónde en las funciones del paso 2 insertarías un arreglo.
- El hueco se agrega como `combined += silence + clip`, pero nunca entre el primer clip y nada. ¿Cómo ajustarías el bucle para poner silencio *uniforme* de `gap_ms` entre cada par de segmentos?

## Paso 5: Visualiza la forma de onda

Para este punto has transformado el audio de cuatro maneras pero no has *visto* nada de él. Una forma de onda convierte la historia de la amplitud en una figura — puedes diagnosticar literalmente un mal recorte (acantilado abrupto), un fundido faltante (caída vertical) o un clip normalizado (altura uniforme) con un vistazo. Este es el paso de la recompensa: los números se vuelven una imagen.

### 5.1 Escribe `plot_waveform`

**👟 Pista inicial :** Extrae las muestras crudas del segmento con `get_array_of_samples()`, mapea el *índice* de muestra a *segundos* con `np.linspace`, y grafica la amplitud contra el tiempo — luego guarda y muestra el resultado.

```python
# audio_editor.py (continued)
import numpy as np
import matplotlib.pyplot as plt

def plot_waveform(audio: AudioSegment, title: str = "Waveform") -> None:
    """Plot sample amplitude against time and save a PNG."""
    samples = np.array(audio.get_array_of_samples())
    if audio.channels == 2:
        samples = samples[::2]
    times = np.linspace(0, len(audio) / 1000, num=len(samples))
    plt.figure(figsize=(12, 4))
    plt.plot(times, samples, linewidth=0.5, color="#2563eb")
    plt.fill_between(times, samples, alpha=0.3, color="#2563eb")
    plt.title(title)
    plt.xlabel("Time (seconds)")
    plt.ylabel("Amplitude")
    plt.tight_layout()
    plt.savefig("waveform.png", dpi=150)
    print("Saved waveform.png")

plot_waveform(clip, "Trimmed + Faded + Normalized Clip")
```

`get_array_of_samples()` te entrega los mismos enteros de 16 bits subyacentes que *creaste* en el paso 1 — análisis y síntesis son dos caras de una moneda. El truco estéreo `samples[::2]` diezma: tomar cada segunda muestra extrae exactamente un canal, porque los canales están intercalados izquierda-derecha-izquierda-derecha. `linspace(0, len(audio)/1000, num=len(samples))` reutiliza la idea del paso 1 — el índice de muestra se mapea al tiempo dividiendo por la tasa de muestreo — así que el eje de tiempo está en segundos honestos.

**🎯 Resultado esperado :** Una ventana de matplotlib más `waveform.png` mostrando un rastro de 2 segundos que se estrecha cerca de `t=0` (el fundido de entrada) y se estrecha cerca de `t≈1.6 s` (el fundido de salida).

**🩹 Si sale mal :** Si no se abre ninguna ventana en una máquina headless o en un notebook, eso es esperado — `plt.savefig` ya escribió el PNG, y los usuarios de notebook obtienen el gráfico en línea en su lugar; nada está roto. Si el gráfico muestra un bloque azul sólido, el tono es demasiado denso a 44.1 kHz para resolverse — haz zoom, o grafica una rebanada más corta como `tone[0:200]`. Si dos canales se emborronan entre sí, falta la diezma `[::2]`.

### 5.2 Verifica la visualización

**✅ Lista de verificación**

- ✅ `waveform.png` existe y muestra una rampa de fundido de entrada clara, una rampa de fundido de salida y un medio relativamente plano.
- ✅ Puedes señalar el fundido en la imagen *antes* de mirar el código que lo hizo.

**🤔 Pregunta(s) socrática(s)**

- ¿Cómo se vería `plot_waveform(tone, ...)` (3 segundos, sin fundidos) diferente de `plot_waveform(clip, ...)`, y qué te dice esa comparación sobre usar formas de onda para verificar tus propias ediciones?
- La forma de onda muestra amplitud, no sonoridad. Un golpe de 20 Hz silencioso y un siseo de 20 kHz fuerte oscilan ambos entre ±0.5 — ¿qué *medición adicional* (pista: ya se imprime en el paso 1) los distingue, y por qué?

## ⚠️ Errores comunes

- **`ffmpeg` faltante.** La exportación MP3/OGG es el único paso que depende de un binario no-Python. `pydub` lanza un `FileNotFoundError` que nombra a `ffmpeg` — un fallo honesto e instructivo — pero puedes saltarte toda la clase de errores corriendo la comprobación de Configuración `ffmpeg -version` una vez antes del paso 3.
- **Recortar más allá del final ajusta en silencio.** `audio[start:end]` nunca se queja cuando `end` excede la duración; solo devuelve menos audio del que pediste. Depurar "mi montaje es más corto de lo esperado" comienza sumando las longitudes de las piezas, no con la lógica de combinación.
- **Normalizar silencio lanza un error extraño.** Un clip silencioso tiene `dBFS = -inf`, así que `target_db - audio.dBFS` es `inf`, y `apply_gain(inf)` está indefinido. Guarda con una comprobación `if audio.dBFS == float('-inf')` antes de normalizar, o nunca normalices un segmento que no hayas verificado que tenga sonido.
- **Visualizar archivos largos con arreglos enormes.** `get_array_of_samples()` en un archivo estéreo largo devuelve millones de muestras; graficarlas todas es lento y se ve como un blob sólido. Sub-rebana el segmento (`audio[start:end]`) o reduce la muestra antes de graficar.
- **Olvidar que dB es logarítmico.** Una ganancia de `+6 dB` no duplica los valores de muestra — duplica la *potencia*. Duplicar numéricamente los valores `int(...)` es un aumento de ~6 dB, y confundir los dos es como los volúmenes terminan 6 dB fuera de un objetivo.
- **Asumir que el estéreo son dos copias de los mismos datos.** Canales intercalados significan que `samples[::2]` es *un* canal, no "los datos pares". Saltarte la diezma emborrona tu forma de onda.

## Lo que acabas de construir

Un editor de audio funcional de línea de comandos: sintetiza sonido a partir de matemática cruda de muestras, lo recorta con precisión de milisegundos, lo funde y normaliza en el dominio de decibelios, convierte formatos a través de un codificador externo real, empalma varios clips en un montaje y prueba cada edición visualmente con una forma de onda renderizada. Nada de aquí es una simulación — `tone.wav`, `clip.wav` y `montage.wav` son archivos de audio reproducibles que puedes abrir en cualquier reproductor multimedia.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/audio-editor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/audio-editor) en el repositorio del curso es una versión más completa del código de arriba como un solo notebook ejecutable: sintetiza el tono de prueba, corre cada edición de los pasos 1–5 y muestra la forma de onda en línea. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Construye un **detector de silencio**: `split_on_silence(tone)` segmenta un archivo de audio en puntos silenciosos e imprime el `(start_ms, end_ms)` de cada segmento — pydub trae `audio.split_on_silence(...)` listo para usar, y hace casi gratis el auto-división de una grabación larga.
- Escribe un **combinador de podcasts** que una una intro, varios segmentos de episodio y un outro con `clip.crossfade(duration)` para transiciones suaves en lugar de huecos duros — ya tienes `combine_clips`, así que reemplazar `AudioSegment.silent(...)` por `crossfade` es una línea de pensamiento.
- Agrega **control de velocidad que preserva el tono**: `audio._spawn(data, overrides={'frame_rate': new_rate}).set_frame_rate(original_rate)` reproduce el mismo audio más rápido sin voz de ardilla — la matemática de muestras del paso 1 hace que esto se sienta como una vuelta de la victoria.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a hacer que Python haga ruido. 🎓