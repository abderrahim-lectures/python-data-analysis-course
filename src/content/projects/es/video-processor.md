---
title: "Procesador de Video"
description: "Procesa videos con recorte, superposición de texto, extracción de audio y conversión de formato usando MoviePy y ffmpeg."
difficulty: "advanced"
estimatedMinutes: 75
tags: ["moviepy", "video-processing", "ffmpeg", "subtitles"]
learningObjectives:
  - Recortar y cortar videos a rangos de tiempo específicos con precisión a nivel de cuadro
  - Aplicar superposiciones de texto con fuentes, posiciones y tiempos personalizados
  - Extraer pistas de audio y generar imágenes de miniatura desde cualquier cuadro
  - Convertir entre formatos de video y comprimir para diferentes casos de uso
prerequisites:
  - "Fundamentos de Python (funciones, cadenas, f-strings)"
  - "FFmpeg instalado en tu sistema (cubierto en Configuración)"
  - "Un archivo de video de muestra para trabajar (cualquier MP4 sirve)"
---

# 🎬 Procesador de Video

La edición de video es tradicionalmente de apuntar y hacer clic, pero cada operación — recortar, superponer texto, extraer audio, convertir formatos — es en realidad una función determinista aplicada a cuadros y rangos de tiempo. Este proyecto construye un kit de herramientas que envuelve MoviePy (que envuelve ffmpeg) en funciones Python limpias, para que puedas escribir scripts de tareas de procesamiento de video de la misma manera que escribirías scripts de cualquier otra transformación de datos: cargar, operar, guardar.

Esto asume fundamentos de Python y una instalación funcional de ffmpeg (cubierta en Configuración). Es opcional y no se califica; consulta [Proyectos del Mundo Real](/es/proyectos) para ver la lista completa y en crecimiento.

## 🎯 Lo que harás

1. Cargar un archivo de video e inspeccionar sus metadatos (duración, resolución, FPS, audio).
2. Recortar videos a rangos de tiempo precisos y extraer pistas de audio.
3. Generar imágenes de miniatura desde cualquier cuadro de un video.
4. Añadir superposiciones de texto con control de posición, tiempo y fuente.
5. Convertir entre formatos de video y comprimir para la entrega web.

## Dónde ejecutar esto

**Localmente con `uv`** es la ruta principal y recomendada — MoviePy requiere ffmpeg (un binario a nivel de sistema, no un paquete Python) y un sistema de archivos real para leer y escribir archivos de video. Ningún playground basado en navegador puede hacer esto.

**Google Colab** funciona con un paso de configuración menor — ffmpeg está preinstalado en el runtime de Colab, y puedes `!pip install moviepy` para empezar. Necesitarás subir tu video de muestra o descargar uno desde una URL. Este es un buen camino de "pruébalo primero" antes de comprometerte a una instalación local.

**JupyterLite no soporta MoviePy** — no hay acceso al sistema de archivos, ni binario ffmpeg, ni capacidad `write_videofile`. No lo uses para este proyecto.

**Binder** puede funcionar si ffmpeg está disponible en la imagen del runtime, pero es lento y poco confiable para E/S de video. Quédate con local o Colab.

## Configuración

Todo lo que necesitas antes de escribir una línea de procesamiento de video: Python, ffmpeg y MoviePy.

### Instala `uv`

`uv` es una herramienta única que reemplaza la cadena habitual de "instalar Python, luego instalar pip, luego instalar una herramienta de entorno virtual, luego instalar paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

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

### Instala ffmpeg

ffmpeg es un binario a nivel de sistema que MoviePy usa internamente — necesitas instalarlo por separado de cualquier paquete Python. MoviePy lanzará un `FileNotFoundError` claro si no puede encontrarlo.

**macOS** (Homebrew):

```bash
brew install ffmpeg
```

**Ubuntu / Debian:**

```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows** (Chocolatey):

```powershell
choco install ffmpeg
```

Confirma que se instaló:

```bash
ffmpeg -version
```

### Configura el proyecto

```bash
uv init video-processor
cd video-processor
uv add moviepy pillow
```

`moviepy` envuelve ffmpeg en una API amigable para Python para cargar, editar y exportar clips de video. `pillow` lo usa `generate_thumbnail` para guardar cuadros como imágenes. Ambos son paquetes Python puros sin dependencias nativas — pero requieren `ffmpeg` en tiempo de ejecución.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `ffmpeg -version` imprime la información de versión de ffmpeg (no "command not found").
- ✅ Existe `video-processor/` con un `pyproject.toml`, y `moviepy` y `pillow` están instalados.

## Paso 1: Carga un video e inspecciona sus metadatos

El primer paso en cualquier tarea de procesamiento de video es saber con qué estás trabajando: cuánto dura, cuál es la resolución, qué velocidad de cuadros tiene y si tiene una pista de audio. `VideoFileClip` carga el video y expone todo esto como atributos simples.

### 1.1 Escribe el cargador

```python
from moviepy import VideoFileClip, AudioFileClip, TextClip, concatenate_videoclips
from pathlib import Path

def load_video(path: str) -> VideoFileClip:
    """Load a video file and handle common errors."""
    try:
        clip = VideoFileClip(path)
        return clip
    except FileNotFoundError:
        print(f"Error: File '{path}' not found.")
        raise
    except Exception as e:
        print(f"Error loading video: {e}")
        raise

video = load_video("sample.mp4")
print(f"Duration: {video.duration:.1f} seconds")
print(f"Resolution: {video.size[0]}x{video.size[1]}")
print(f"FPS: {video.fps}")
print(f"Has audio: {video.audio is not None}")
```

**👟 Pista inicial :** `VideoFileClip(path)` carga el video de forma perezosa — los datos de cuadro reales se leen cuadro por cuadro según se necesitan, así que cargar un video de 10 minutos no consume 10 minutos de RAM. Los atributos `.duration`, `.size` y `.fps` los lee ffmpeg del encabezado del archivo. Siempre comprueba `video.audio is not None` antes de intentar acceder al audio — algunos videos son silenciosos.

**🎯 Resultado esperado :** Para un archivo MP4 típico:
```
Duration: 10.0 seconds
Resolution: 1920x1080
FPS: 30.0
Has audio: True
```

**🩹 Si sale mal :** Un `FileNotFoundError` significa que la ruta es incorrecta — usa una ruta completa o confirma que estás en el directorio correcto. Si obtienes un error de ffmpeg, ffmpeg no está instalado o no está en tu `PATH` — ejecuta `ffmpeg -version` para confirmar. Un video corrupto o descargado a medias puede cargar los metadatos pero fallar durante el acceso a los cuadros más tarde.

### 1.2 Verifica los metadatos

**✅ Lista de verificación**

- ✅ `load_video("sample.mp4")` devuelve un objeto `VideoFileClip` sin errores.
- ✅ `.duration` es un número positivo (segundos), `.size` es una lista `[width, height]`, `.fps` es un número positivo.
- ✅ `.audio` es un `AudioFileClip` o `None`, y puedes manejar ambos casos.

**🤔 Pregunta(s) socrática(s)**

- Un video tiene `.fps = 29.97` en lugar de 30. ¿Qué significa la diferencia de 0.03 para operaciones a nivel de cuadro como recortar exactamente en 5.0 segundos — obtendrías el cuadro exacto que esperabas?
- `.size` te da `[width, height]` (x primero), que es lo opuesto al orden matemático `[row, col]`. ¿Por qué las herramientas de video usan esta convención, y dónde podría el desajuste causar un error en tu código?

## Paso 2: Recorta videos y extrae audio

Recortar es la operación de edición de video más común — tomar un clip entre dos marcas de tiempo. Extraer audio es igualmente sencillo: separa la pista de sonido de los cuadros de video y guárdala como su propio archivo. Ambas operaciones producen nuevos archivos en disco.

### 2.1 Recorta y extrae audio

```python
def trim_video(video: VideoFileClip, start: float, end: float) -> VideoFileClip:
    """Extract a segment between start and end (in seconds)."""
    if start < 0 or end > video.duration:
        print(f"Warning: clamping to valid range (0–{video.duration:.1f}s)")
        start = max(0, start)
        end = min(video.duration, end)
    return video.subclipped(start, end)

def extract_audio(video: VideoFileClip, output_path: str) -> None:
    """Extract the audio track from a video."""
    if video.audio is None:
        print("No audio track found in this video.")
        return
    video.audio.write_audiofile(output_path)
    print(f"Audio saved to {output_path}")

def generate_thumbnail(video: VideoFileClip, timestamp: float, output_path: str) -> None:
    """Save a single frame as a thumbnail image."""
    frame = video.get_frame(timestamp)
    from PIL import Image
    img = Image.fromarray(frame)
    img.save(output_path, quality=90)
    print(f"Thumbnail at {timestamp}s saved to {output_path}")

clip = trim_video(video, 10, 25)
clip.write_videofile("trimmed.mp4", codec="libx264", audio_codec="aac")

extract_audio(video, "audio_track.wav")

generate_thumbnail(video, 5.0, "thumb.jpg")

video.close()
```

**👟 Pista inicial :** `video.subclipped(start, end)` devuelve un nuevo `VideoFileClip` que contiene solo los cuadros entre `start` y `end` segundos — no modifica el clip original. Luego `write_videofile` codifica y guarda el clip recortado en disco: `codec="libx264"` es el códec de video estándar, y `audio_codec="aac"` es el códec de audio estándar. `get_frame(timestamp)` devuelve un solo cuadro como un array NumPy, que PIL puede guardar como JPEG o PNG. Siempre `close()` los clips cuando termines para liberar el manejador del proceso de ffmpeg.

**🎯 Resultado esperado :**
```
trimmed.mp4 — un video de 15 segundos (de 10s a 25s del original)
audio_track.wav — la pista de audio completa
thumb.jpg — un solo cuadro en la marca de 5 segundos
```

**🩹 Si sale mal :** Si `trimmed.mp4` no tiene audio, es probable que el video original no tenga pista de audio (`video.audio is None`). Si `write_videofile` da error, ffmpeg no está instalado — los parámetros de códec (`libx264`, `aac`) son específicos de ffmpeg. Si `thumb.jpg` está mayormente negro, el cuadro en esa marca de tiempo es un fundido de entrada o una tarjeta de título — prueba una marca de tiempo diferente.

### 2.2 Verifica el recorte y la extracción

**✅ Lista de verificación**

- ✅ `trimmed.mp4` existe y tiene una duración igual a `end - start` segundos.
- ✅ `audio_track.wav` es un archivo de audio reproducible (o `extract_audio` imprimió "No audio track").
- ✅ `thumb.jpg` es una imagen JPEG válida de la resolución correcta.

**🤔 Pregunta(s) socrática(s)**

- `trim_video` sujeta `start` y `end` al rango válido en lugar de lanzar un error. ¿Es esa la elección correcta para una función de biblioteca, o sería mejor lanzar un error? ¿Cuáles son los tradeoffs en un script vs. una herramienta orientada al usuario?
- `video.close()` se llama al final. ¿Qué pasa si olvidas llamarla — el recolector de basura de Python eventualmente limpiaría, o ese proceso de ffmpeg se queda? ¿Cómo sabrías si fugaste un proceso?

## Paso 3: Añade superposiciones de texto

Las superposiciones de texto convierten un clip crudo en algo con contexto — títulos, etiquetas, subtítulos, marcas de agua. El `TextClip` de MoviePy crea una capa de texto, y componerla sobre el video la posiciona en coordenadas y tiempos específicos.

### 3.1 Construye la función de superposición

```python
def add_text_overlay(
    video_path: str,
    text: str,
    start: float,
    end: float,
    font_size: int = 24,
    position: str = "center",
    output_path: str = "overlay.mp4",
) -> None:
    """Add a text overlay to a video segment."""
    video = load_video(video_path)

    positions = {
        "center": ("center", "center"),
        "top": ("center", 40),
        "bottom": ("center", video.h - 60),
        "top-left": (40, 40),
    }

    txt_clip = (
        TextClip(
            text=text,
            font_size=font_size,
            color="white",
            bg_color="black",
            text_align="center",
            size=(video.w * 0.8, None),
            method="caption",
        )
        .with_position(positions.get(position, positions["center"]))
        .with_start(start)
        .with_end(end)
    )

    result = video.with_composite([txt_clip])
    result.write_videofile(output_path, codec="libx264", audio_codec="aac")
    video.close()
    print(f"Saved {output_path}")

add_text_overlay("sample.mp4", "Welcome to My Video", start=0, end=3, output_path="titled.mp4")
```

**👟 Pista inicial :** `TextClip` crea una capa de video a partir de una cadena — `method="caption"` ajusta el texto en `size=(video.w * 0.8, None)` (80% del ancho del video, altura automática), y `bg_color="black"` dibuja un fondo oscuro detrás del texto blanco para legibilidad. `.with_start(start).with_end(end)` hace que el texto aparezca solo durante esa ventana de tiempo. `video.with_composite([txt_clip])` superpone la capa de texto sobre el video; la pista de audio original pasa sin cambios.

**🎯 Resultado esperado :** `titled.mp4` reproduce el video con "Welcome to My Video" visible durante los primeros 3 segundos (0–3), luego desaparece por el resto.

**🩹 Si sale mal :** Si el texto aparece pero no tiene fondo, se está aplicando `bg_color` — comprueba que lo pasas como argumento de palabra clave de `TextClip`, no a `.with_position()`. Si `write_videofile` falla con un error de códec, confirma que ffmpeg está instalado (`ffmpeg -version`). Si el texto se corta o se ajusta de forma rara, el `size=(video.w * 0.8, None)` es demasiado estrecho — aumenta la proporción del ancho.

### 3.2 Verifica la superposición de texto

**✅ Lista de verificación**

- ✅ `titled.mp4` existe y tiene la misma duración que `sample.mp4`.
- ✅ El texto es visible durante la ventana de tiempo especificada y ausente fuera de ella.
- ✅ La pista de audio original se reproduce durante todo el video, sin verse afectada por la superposición de texto.

**🤔 Pregunta(s) socrática(s)**

- La función de superposición codifica texto `"white"` sobre fondo `"black"`. ¿Qué cambiarías para admitir colores dinámicos por llamada — y qué combinaciones de colores están garantizadas como legibles contra cualquier fondo de video?
- `method="caption"` ajusta el texto automáticamente. ¿Qué haría `method="label"` en cambio — y cuándo querrías texto sin ajustar en una superposición de video?

## Paso 4: Convierte entre formatos

Diferentes plataformas requieren diferentes formatos de video — YouTube acepta MP4, Discord prefiere WebM, algunos sistemas más antiguos necesitan AVI. Este paso construye un convertidor que recodifica un video a un formato objetivo, con compresión opcional para la entrega web.

### 4.1 Convierte un solo archivo

```python
def convert_video(
    input_path: str,
    output_path: str,
    codec: str = "libx264",
    fps: int = 24,
    bitrate: str = "5000k",
) -> None:
    """Convert a video to a different format or encoding."""
    video = load_video(input_path)
    video.write_videofile(
        output_path,
        codec=codec,
        fps=fps,
        bitrate=bitrate,
        audio_codec="aac",
    )
    video.close()
    print(f"Converted {input_path} → {output_path}")

convert_video("sample.mp4", "sample.webm", codec="libvpx-vp9")
convert_video("sample.mp4", "sample_low.mp4", bitrate="1000k")
```

**👟 Pista inicial :** `codec="libvpx-vp9"` produce archivos WebM (VP9 es el códec de video de Google para WebM); `bitrate="1000k"` produce un archivo mucho más pequeño que el `5000k` predeterminado al reducir la calidad — este es el tradeoff que controlas: bitrate más bajo = archivo más pequeño = calidad más baja. El parámetro `fps=24` remuestrea el video a 24fps si el original es mayor, que es una optimización web común.

**🎯 Resultado esperado :**
```
sample.webm — un archivo WebM (códec VP9, misma duración)
sample_low.mp4 — un MP4 comprimido a bitrate más bajo (tamaño de archivo menor)
```

**🩹 Si sale mal :** Si `sample.webm` no se reproduce, el decodificador no está disponible en tu sistema — VLC y la mayoría de los navegadores modernos manejan VP9, pero algunos reproductores más antiguos no. Si `sample_low.mp4` es apenas más pequeño que el original, `bitrate="1000k"` no es lo suficientemente bajo para la resolución del video — prueba `"500k"` o reduce la resolución (MoviePy tiene un método `resize`).

### 4.2 Convierte un directorio en lote

```python
def batch_convert(input_dir: str, output_dir: str, target_format: str = "mp4") -> None:
    """Convert all video files in a directory."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    extensions = {".avi", ".mov", ".webm", ".mkv", ".flv"}
    for filepath in Path(input_dir).iterdir():
        if filepath.suffix.lower() in extensions:
            out = output_path / f"{filepath.stem}.{target_format}"
            try:
                convert_video(str(filepath), str(out))
            except Exception as e:
                print(f"  ✗ {filepath.name}: {e}")

batch_convert("raw_videos", "converted")
```

**👟 Pista inicial :** `Path(input_dir).iterdir()` lista todos los archivos del directorio; `suffix.lower()` captura `.AVI` y `.avi` como la misma extensión; el `try/except` dentro del bucle evita que un archivo fallido mate todo el lote. Esta es la versión de "producción" del convertidor de un archivo — las operaciones en masa necesitan manejo de errores por elemento, no por lote.

**🎯 Resultado esperado :** Cada archivo `.avi`, `.mov`, `.webm`, `.mkv` o `.flv` en `raw_videos/` produce un equivalente `.mp4` en `converted/`, con cualquier error impreso por archivo.

**🩹 Si sale mal :** Si el directorio `converted/` no existe, el `mkdir(parents=True, exist_ok=True)` lo crea — confirma que no añadiste una variante `exist_ok=False`. Si algunos archivos fallan en silencio, el `try/except` imprime el error pero puede que no lo veas — redirige stdout a un archivo de log si ejecutas en masa.

### 4.3 Verifica la conversión

**✅ Lista de verificación**

- ✅ `convert_video` produce un archivo nuevo con la extensión correcta (`.webm`, `.mp4`, etc.).
- ✅ `batch_convert` produce un archivo de salida por archivo de entrada, con errores registrados por archivo en lugar de abortar todo el lote.
- ✅ El archivo convertido se reproduce correctamente en VLC o un navegador — duración y audio coinciden con el original.

**🤔 Pregunta(s) socrática(s)**

- `convert_video` acepta un `codec` y un `bitrate` como parámetros separados, pero establecer un bitrate alto con un códec de baja calidad (como `mpeg4`) podría no mejorar la calidad. ¿Cómo documentarías qué combinaciones de códec/bitrate son sensatas?
- `batch_convert` omite en silencio los archivos que no están en el conjunto de extensiones. ¿Qué pasaría si quisieras también procesar archivos `.mp4` (recodificando por calidad)? ¿Cómo evitarías volver a convertir archivos que ya están en el formato objetivo?

## ⚠️ Errores comunes

- **ffmpeg no instalado o no en `PATH`.** Los errores de MoviePy no siempre dicen "falta ffmpeg" — podrías ver un `OSError` o `FileNotFoundError` críptico en una ruta que no escribiste. Siempre ejecuta `ffmpeg -version` como primer paso de diagnóstico. MoviePy 2.x incluye su propio ffmpeg en algunas instalaciones, pero la instalación del sistema es más confiable.
- **Olvidar `video.close()`.** Cada `VideoFileClip` abre un subproceso de ffmpeg. Sin `close()`, esos procesos se acumulan — verás procesos `ffmpeg` zombis en tu monitor del sistema, y tu script mantendrá bloqueos de archivo que impiden recodificar el mismo archivo. Usa un bloque `try/finally` o administradores de contexto si procesas muchos archivos.
- **Desajuste de resolución de la superposición de texto.** `TextClip` renderiza texto a un tamaño de píxel fijo; si el video es 4K (3840×2160) y `font_size=24`, el texto será diminuto en relación con el cuadro. Escala `font_size` con `video.w / 1920` para mantener el texto proporcional entre resoluciones.
- **`write_videofile` bloquea el script.** La codificación es intensiva en CPU y síncrona — un video de 10 minutos puede tardar minutos en codificarse. En un notebook Jupyter, esto congela el kernel hasta que termina. En un pipeline real, ejecutarías la codificación en un subproceso o un hilo de fondo.
- **Códec WebM no disponible en todos los reproductores.** VP9 (`libvpx-vp9`) es ampliamente compatible en navegadores pero no en todos los reproductores multimedia. Si tu objetivo es un reproductor (no un navegador), quédate con `libx264` (MP4) — es el códec más universalmente compatible.

## Lo que acabas de construir

Un kit de herramientas de procesamiento de video que envuelve la API respaldada por ffmpeg de MoviePy en funciones Python limpias y reutilizables: recorte, extracción de audio, generación de miniaturas, superposiciones de texto y conversión de formato. Cada función maneja sus propios casos de error y documenta sus parámetros, para que puedas componerlas en pipelines más grandes. También aprendiste el modismo clave de MoviePy: cargar un clip, aplicar operaciones que devuelven nuevos clips y escribir el resultado en disco.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/video-processor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/video-processor) en el repo del curso es una versión más completa con una función de reel de destacados (extrae múltiples segmentos y hace cortinillas entre ellos), una marca de agua animada y una interfaz CLI para el procesamiento en lote. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Construye un reel de destacados: dada una lista de marcas de tiempo `(start, end)` de un video largo, extrae cada segmento, añade un fundido cruzado de 0.5s entre ellos y concaténalos en un solo reel usando `concatenate_videoclips(method="compose")`.
- Añade una marca de agua animada: crea una marca de agua que se mueve lentamente de izquierda a derecha a través del video usando una función `make_frame` con cálculos de desplazamiento x dependientes del tiempo.
- Construye un compresor de video: calcula el bitrate actual a partir del tamaño y la duración del archivo, calcula el bitrate objetivo para un tamaño de archivo deseado y recodifica — reporta la proporción de compresión.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
