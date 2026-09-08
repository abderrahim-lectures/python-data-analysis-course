---
title: "Kit de Clonación de Voz"
description: "Construye la mitad de medición de la clonación de voz: lee audio WAV con numpy, extrae características de tono y energía, construye perfiles por hablante, compáralos y da forma a un clip hacia las estadísticas de otra voz. Enfoque ético primero."
difficulty: "advanced"
estimatedMinutes: 75
tags: ["audio", "numpy", "signal-processing"]
learningObjectives:
  - Leer y normalizar audio WAV en arrays numpy
  - Extraer características de tono, energía y cruces por cero por cuadro
  - Construir un perfil de voz por hablante a partir de las características
  - Comparar dos perfiles con una métrica de distancia
  - Desplazar un clip hacia un rango de tono objetivo y escribir el WAV
prerequisites:
  - "Fundamentos de Python (funciones, bucles)"
  - "Comodidad con arrays numpy, rebanadas y matemática pequeña"
  - "Intuición para frecuencia y tasa de muestreo (una hora de fundamentos de audio)"
---

# 🛠️ 🎙️ Kit de Clonación de Voz

La clonación de voz acapara titulares, pero debajo de la magia hay un problema de medición: ¿qué, precisamente, hace que una voz suene como *esa* persona? Este kit de herramientas construye la mitad honesta e interpretable de ese problema en numpy — leer audio como números crudos, medir tono y energía por cuadro, condensar un clip en un perfil de hablante, comparar dos perfiles y, finalmente, dar forma a un clip hacia las estadísticas de otra voz. Aquí no producirás la voz sintética de una celebridad; *entenderás* los números de los que parte todo sistema de clonación real.

Esto asume Python 101, comodidad con numpy y una familiaridad pasajera con la tasa de muestreo y la frecuencia — no se requiere nada de Análisis de Datos más allá de eso. Es opcional y no se califica; consulta [Proyectos del Mundo Real](/es/proyectos) para ver la lista completa y en crecimiento.

> **La cláusula de responsabilidad.** Clonar una voz sin consentimiento es suplantación de identidad y, en muchas jurisdicciones, fraude — este kit de herramientas está diseñado como un instrumento de *medición* y no incluye ningún modelo que reproduzca a una persona real a partir de una muestra. Úsalo en tus propias grabaciones, clips sintéticos y material de referencia claramente etiquetado. Recuerda lo que puede sostener un extractor de características: estadísticas, no identidad.

## 🎯 Lo que harás

1. Leer un archivo WAV en un array numpy normalizado e inspeccionar su forma.
2. Extraer características por cuadro — energía RMS, tasa de cruces por cero y tono mediante autocorrelación.
3. Condensar las características de un clip en un único perfil de hablante.
4. Comparar dos hablantes con una métrica de distancia para encontrar la coincidencia más cercana.
5. Dar forma al tono de un clip objetivo dentro del rango de una voz de referencia y escribir el WAV.

## Dónde ejecutar esto

**Localmente con `uv`** es la ruta principal. Es solo numpy, así que se instala limpiamente en cualquier lugar, y es la única ruta donde *tus* archivos WAV (tus propias grabaciones, audio de referencia claramente etiquetado) viven en un disco al que apuntas. El trabajo de audio real es trabajo local.

**Google Colab, Kaggle Notebooks y Binder** ejecutan cada paso de forma idéntica — numpy está preinstalado y la matemática de punto flotante es la misma en todos lados. La salvedad honesta: un notebook no tiene *los propios archivos de un hablante* por defecto, así que el notebook de ejemplo sintetiza clips de seno y estilo formante para demostrar la extracción de características (como hace esta guía abajo), en lugar de fingir clonar una grabación real. Usa las insignias para ver las características y los perfiles calculados de extremo a extremo; cambia a `uv` local cuando quieras apuntar el kit a audio real y éticamente propio.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-cloning-toolkit/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-cloning-toolkit/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fvoice-cloning-toolkit%2Fnotebook.ipynb)

## Configuración

Crea el proyecto e instala la única biblioteca sobre la que está construido el kit.

```bash
uv init voice-cloning-toolkit
cd voice-cloning-toolkit
uv add numpy
```

```bash
uv run python -c "import numpy; print('ok')"
```

`numpy` es todo el motor de audio: un archivo WAV se convierte en un array `float` 1-D, y cada característica de este proyecto — energía, tasa de cruces, tono — es una expresión numpy sobre ese array. `wave` (usado en el Paso 1) viene con Python y maneja el contenedor WAV.

**✅ Lista de verificación**

- ✅ `uv add numpy` terminó y la comprobación de import imprime `ok`.
- ✅ Existe un proyecto fresco `voice-cloning-toolkit/` con un `pyproject.toml`.

## Paso 1: Lee un archivo WAV en un array numpy

Cada medición de este kit empieza igual: un `.wav` en disco se convierte en un array 1-D de valores de −1 a 1, uno por muestra. Este paso escribe un pequeño tono de demostración, lo lee de vuelta y verifica la matemática que convierte bytes en sonido.

### 1.1 Escribe `read_wav` y un tono de demostración

**👟 Pista inicial :** Usa el módulo `wave` de la biblioteca estándar para abrir el contenedor, obtén `framerate` y el número de canales, decodifica los bytes crudos con `np.frombuffer` y normaliza los valores `int16` a `[-1, 1]`.

```python
# voicekit.py
import wave
import numpy as np

def read_wav(path: str) -> tuple[np.ndarray, int]:
    """Return (float samples in [-1,1], sample_rate)."""
    with wave.open(path, "rb") as wav:
        sample_rate = wav.getframerate()
        n_channels = wav.getnchannels()
        frames = wav.readframes(wav.getnframes())
    data = np.frombuffer(frames, dtype=np.int16).astype(np.float64)
    if n_channels > 1:
        data = data[::n_channels]
    return data / 32768.0, sample_rate

SR = 22050
seconds = 2
t = np.linspace(0, seconds, SR * seconds, endpoint=False)
tone = 0.3 * np.sin(2 * np.pi * 220 * t)

with wave.open("demo.wav", "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)          # 16-bit = 2 bytes/sample
    wav.setframerate(SR)
    wav.writeframes((tone * 32767).astype(np.int16).tobytes())

data, sr = read_wav("demo.wav")
print("shape:", data.shape, "sr:", sr, "peak:", round(float(np.abs(data).max()), 3))
```

El pipeline: `wave` lee el contenedor (cuánto dura, cuán ancho, cuántos canales); `np.frombuffer` reinterpreta la cadena de bytes cruda como números `int16` sin copiar; y dividir por `32768.0` reescala el rango completo de 16 bits en punto flotante `[-1, 1]` — la convención de unidades que comparten todas las bibliotecas de audio. El mono está a un salto de índice de lista (`data[::n_channels]` en un archivo de 2 canales toma cada segunda muestra). El seno a `220 Hz` está afinado en medio del rango de barítono, que el Paso 2 debería *medir de vuelta*.

**🎯 Resultado esperado :** `shape: (44100,) sr: 22050 peak: 0.3` — una muestra por cuadro a exactamente 0.3 de amplitud máxima.

**🩹 Si sale mal :** Si `shape` reporta `(88200,)`, se omitió `setnchannels(1)` o `read_wav` no está colapsando el estéreo. Si el pico es `0.03`, la amplitud `0.3` dividida por `100` significa que el paso de escalado `int16` se normalizó dos veces. Si `wave.ERROR` dice que el archivo no es una onda RIFF, `writeframes` escribió flotantes sin codificar — convierte a `.astype(np.int16)` primero.

### 1.2 Verifica el lector

**✅ Lista de verificación**

- ✅ `demo.wav` existe y `read_wav` devuelve `(44100 muestras, 22050 Hz)`.
- ✅ El valor absoluto máximo es igual al `0.3` que escribiste.
- ✅ Editar `SR` y volver a ejecutar cambia el conteo de muestras proporcionalmente.

**🤔 Pregunta(s) socrática(s)**

- El archivo almacena valores `int16`; el lector los convierte a flotantes en `[-1, 1]`. ¿Por qué un extractor de características *deliberadamente* evitaría los enteros para la matemática de energía — qué se rompe si calculas RMS en `int16` crudo y luego en flotantes?
- Un clip de 2 segundos a 22 050 Hz son 44 100 muestras. Si el audio es instantáneamente "sonido en un momento del tiempo", ¿por qué el kit necesita *cuadros* (Paso 2) en lugar de tratar todo el array como un número?

## Paso 2: Extrae características por cuadro

Una voz no es un tono único — es un *contorno* de tono que cambia 10 veces por segundo. Este paso trocea el audio en pequeños cuadros superpuestos y mide cada uno: cuán fuerte (`energía RMS`), cuán ruidoso (`tasa de cruces por cero`) y a qué fundamental vibra (`tono por autocorrelación`).

### 2.1 Enmarca la señal y calcula energía y cruces

**👟 Pista inicial :** Enmarca con ventanas de 20 ms y saltos de 10 ms (configuración estándar de habla), luego haz `rms` y `zero_crossings` funciones numpy de una línea.

```python
# voicekit.py (continuación)
def frame_signal(data: np.ndarray, frame_s: float = 0.02,
                 hop_s: float = 0.01, sr: int = SR):
    frame_n = int(frame_s * sr)
    hop_n = int(hop_s * sr)
    frames = [data[i:i + frame_n]
              for i in range(0, len(data) - frame_n + 1, hop_n)]
    return np.array(frames)

def rms(segment: np.ndarray) -> float:
    return float(np.sqrt(np.mean(segment ** 2)))

def zero_crossings(segment: np.ndarray) -> int:
    return int(np.mean(np.diff(np.sign(segment)) != 0) * len(segment))

frames = frame_signal(data)
energies = np.array([rms(f) for f in frames])
crossings = np.array([zero_crossings(f) for f in frames])
print("frames:", frames.shape[0], "| mean energy:", round(float(energies.mean()), 4))
print("mean crossings/frame:", round(float(crossings.mean()), 1))
```

`frame_signal` es la geometría clásica del análisis de habla: 20 ms por cuadro, deslizándose 10 ms hacia adelante — así que cada muestra se mide más de una vez, lo que mantiene suave el contorno de tono. `rms` es la definición de sonoridad (`mean(segment²)` y luego la raíz cuadrada); `zero_crossings` cuenta cuántas veces la forma de onda pasa por cero, un proxy barato de brillantez/ruidosidad — una 's' sibilante cruza constantemente, una 'o' cálida rara vez. La energía de un seno puro de 220 Hz es plana, que es exactamente lo que muestra la demo.

**🎯 Resultado esperado :** `frames: 199` (2 s con saltos de 10 ms), una energía media cercana a `0.21` y una media de cruces/cuadro cercana a 9 (un cuadro de 220 Hz abarca 4.4 ciclos, dos cruces cada uno).

**🩹 Si sale mal :** Si `frames: 200`, falta el límite `+ 1` en el rango, así que se coló el último cuadro parcial. Si la energía varía mucho por cuadro, `i:i + frame_n` tiene un desajuste de superposición y los cuadros comparten datos crudos de forma desigual. Si los cruces leen ~440, estás contando *ambos* bordes de cada ciclo — eso es el doble de la tasa esperada y debería dividirse en `zero_crossings`.

### 2.2 Estima el tono por autocorrelación

**👟 Pista inicial :** Autocorrelaciona el cuadro centrado, limita la búsqueda de lag a 80–400 Hz (la banda de la voz humana), encuentra el lag (en muestras) que pica y convierte `lag → Hz` con `sr / lag`.

```python
# voicekit.py (continuación)
def autocorr_pitch(segment: np.ndarray, sr: int = SR) -> float:
    seg = segment - segment.mean()
    corr = np.correlate(seg, seg, mode="full")[len(seg) - 1:]
    min_lag = int(sr / 400)   # highest pitch we accept
    max_lag = int(sr / 80)    # lowest pitch we accept
    region = corr[min_lag:max_lag + 1]
    if len(region) == 0 or region.max() <= 0:
        return 0.0
    peak_lag = min_lag + int(np.argmax(region))
    return sr / peak_lag

pitches = np.array([autocorr_pitch(f) for f in frames])
voiced = pitches[pitches > 0]
print("median pitch:", round(float(np.median(voiced)), 1), "Hz")
```

La autocorrelación hace una pregunta simple: *desplaza el cuadro contra sí mismo, ¿y con qué lag se parece más a su vecino?* Para un tono de 220 Hz muestreado a 22 050 Hz, un ciclo completo es ~100 muestras, así que la correlación pica en lag ≈ 100 → `sr / lag ≈ 220`. Restringir `min_lag`/`max_lag` a la banda de 80–400 Hz es la parte que evita que un cuadro entrecortado o silencioso coincida con ruido aleatorio en algún lag absurdo; cualquier cosa fuera de la banda de la voz humana no es un tono que valga la pena reportar, y `return 0.0` marca un cuadro como no sonoro.

**🎯 Resultado esperado :** Una `median pitch` muy cercana a `220.0` Hz — el kit midió el tono que se le dio.

**🩹 Si sale mal :** Si el tono lee ~110 Hz, `peak_lag` encontró el *segundo* pico (armónico de octava exacta) porque la región elegida es demasiado ancha — reduce `max_lag`, o toma el primer máximo local, no el global. Si el tono es `0.0` en todos lados, `region.max() <= 0` está filtrando todo porque la media del segmento no se restó. Si las frecuencias son inestables entre cuadros, el cuadro de 20 ms es tan largo que agrupa dos notas diferentes — acorta `frame_s`.

### 2.3 Verifica el conjunto de características

**✅ Lista de verificación**

- ✅ Cuadros = ~199, energía media cerca de 0.21, cruces cerca de 18, tono mediano ≈ 220 Hz.
- ✅ Los cuadros no sonoros (silencio) se reportan como `0.0`, no como un tono aleatorio.
- ✅ Puedes afirmar qué representa un *cuadro* y por qué ayuda la superposición.

**🤔 Pregunta(s) socrática(s)**

- La autocorrelación encontró el periodo del tono perfectamente en un seno puro. ¿Qué audio del mundo real (piensa: una 's' vocal o una risa) hace fallar o reducir a la mitad la autocorrelación, y cómo detectarías esa falla en el propio contorno de tono?
- La tasa de cruces por cero y el tono suben ambos para voces agudas. ¿Por qué las herramientas de habla calculan *ambos* en lugar de tratar la tasa de cruces como un sustituto del tono?

## Paso 3: Construye un perfil de hablante

Las características por cuadro son la materia prima; un *perfil* es la condensación que una comparación puede usar — la media y el rango del tono, y la energía media, exprimidos de un clip completo en un pequeño dict.

### 3.1 Escribe `build_profile`

**👟 Pista inicial :** Lee el archivo, enmárcalo, ejecuta las características del Paso 2 sobre cada cuadro y luego recolecta los tonos *sonoros* y la energía general en un único dict de resumen.

```python
# voicekit.py (continuación)
def build_profile(path: str) -> dict:
    data, sr = read_wav(path)
    frames = frame_signal(data, sr=sr)
    pitches = [autocorr_pitch(f, sr) for f in frames]
    voiced = [p for p in pitches if p > 0]
    energy = float(np.mean([rms(f) for f in frames]))
    return {
        "mean_pitch": float(np.mean(voiced)) if voiced else 0.0,
        "pitch_range": (float(min(voiced)), float(max(voiced))) if voiced else (0.0, 0.0),
        "mean_energy": energy,
    }

def make_tone(freq: float, seconds: float = 1.0, sr: int = SR) -> str:
    t = np.linspace(0, seconds, int(sr * seconds), endpoint=False)
    tone = 0.25 * np.sin(2 * np.pi * freq * t)
    path = f"tone_{int(freq)}Hz.wav"
    with wave.open(path, "wb") as wav:
        wav.setnchannels(1); wav.setsampwidth(2)
        wav.setframerate(sr)
        wav.writeframes((tone * 32767).astype(np.int16).tobytes())
    return path

prof_low = build_profile(make_tone(110))
prof_high = build_profile(make_tone(300))
print("low voice:", prof_low)
print("high voice:", prof_high)
```

Un perfil son exactamente cuatro números elegidos para ser *legibles*: `mean_pitch` ubica la voz en el rango humano, `pitch_range` captura la expresividad (monótona → amplia) y `mean_energy` es un proxy de la sonoridad. Filtrar `voiced` importa — los cuadros silenciosos arrastrarían la media hacia 0 y envenenarían la comparación si se dejaran. Reutilizar `make_tone` le da al kit voces de prueba controladas: dos tonos puros a 110 Hz y 300 Hz cuyos perfiles *deberían* diferir solo en `mean_pitch`, así que la extracción de perfiles es verificable antes de que el audio real la complique.

**🎯 Resultado esperado :** Dos perfiles cuyos centros de `pitch_range` difieren — `mean_pitch ≈ 110` para el tono grave, `≈ 300` para el agudo — con `mean_energy` aproximadamente igual (`≈ 0.18`).

**🩹 Si sale mal :** Si ambos tonos leen ~0, `voiced` está vacío porque `autocorr_pitch` nunca superó la prueba `region.max() > 0`. Si `mean_energy` difiere enormemente entre tonos, las amplitudes de `make_tone` difieren (la línea `tone = 0.25 * …` usa dos multiplicadores diferentes). Si `pitch_range` es un solo número en lugar de una tupla, faltan los paréntesis envolventes en el dict.

### 3.2 Verifica los perfiles

**✅ Lista de verificación**

- ✅ El perfil del tono grave reporta ~110 Hz y el del agudo ~300 Hz.
- ✅ Ambos valores de `mean_energy` coinciden dentro de unos pocos puntos porcentuales.
- ✅ Un clip de solo silencio se perfila a `mean_pitch: 0.0` sin bloquearse.

**🤔 Pregunta(s) socrática(s)**

- El perfil son cuatro números, y sin embargo los humanos distinguen cientos de voces. ¿Qué información *estás descartando* que conservaría un modelo deepfake real, y por qué descartarla es en realidad una característica de seguridad para este kit?
- `mean_energy` pliega la sonoridad en el perfil, pero una voz grabada de cerca versus de lejos la cambia. ¿Cómo harías el perfil justo entre distancias de grabación — y ese cambio hace las comparaciones más honestas?

## Paso 4: Compara dos hablantes con una métrica de distancia

Con los perfiles como puntos, "quién está más cerca de quién" se vuelve aritmética: una distancia relativa por característica, sumada. Este paso puntúa la distancia de una voz objetivo desde cada perfil candidato y clasifica el más cercano — la misma forma que usa la última capa de un sistema de identificación de voz.

### 4.1 Escribe `profile_distance` y clasifica candidatos

**👟 Pista inicial :** Normaliza cada diferencia de característica por el valor de referencia (así 10 Hz importan menos a 300 Hz que a 100 Hz), suma las dos diferencias normalizadas y elige el candidato con el total más pequeño.

```python
# voicekit.py (continuación)
def profile_distance(a: dict, b: dict) -> float:
    pitch_diff = abs(a["mean_pitch"] - b["mean_pitch"]) / (b["mean_pitch"] + 1e-9)
    energy_diff = abs(a["mean_energy"] - b["mean_energy"]) / (b["mean_energy"] + 1e-9)
    return pitch_diff + energy_diff

mid_tone = build_profile(make_tone(200))
candidates = {"low": prof_low, "high": prof_high}
for name, prof in candidates.items():
    print(f"{name:>5} distance: {profile_distance(mid_tone, prof):.3f}")

best = min(candidates, key=lambda n: profile_distance(mid_tone, candidates[n]))
print("closest match to 200 Hz:", best)
```

Dividir cada diferencia por la característica de referencia es el truco: `|110 − 200| / 110 ≈ 0.82` pero `|300 − 200| / 300 ≈ 0.33`, así que una brecha absoluta se juzga *relativa al tono en el que ocurre* — una deriva de 10 Hz en una voz de jefe debería doler menos que una deriva de 10 Hz en un susurro. Añadir `1e-9` contra una referencia cero evita que la fórmula divida por silencio. Sumar los dos términos normalizados produce una "cercanía" sin unidades que puedes comparar entre candidatos, y `min(..., key=...)` convierte la tabla de puntuación en un veredicto.

**🎯 Resultado esperado :** `low  distance: 0.82`, `high distance: 0.33`, y luego `closest match to 200 Hz: high` — el tono de 200 Hz está más cerca del perfil de 300 Hz.

**🩹 Si sale mal :** Si la distancia a 'low' y 'high' son iguales, el denominador en una línea `diff` está mal escalado (ambos usan `a` en lugar de `b`). Si el veredicto es siempre 'low', `min` eligió la distancia *máxima* porque `key=` devuelve `-distance`. Si la distancia imprime `inf`, un perfil tiene `mean_pitch == 0.0` y falta el guard `1e-9`.

### 4.2 Verifica las comparaciones

**✅ Lista de verificación**

- ✅ Un tono de 200 Hz se juzga más cercano al perfil de 300 Hz bajo esta métrica.
- ✅ Un tono de 150 Hz voltea el veredicto hacia low, y puedes predecir dónde está el límite.
- ✅ Puedes explicar *por qué* normalizar por la referencia supera a las diferencias absolutas crudas.

**🤔 Pregunta(s) socrática(s)**

- Esta métrica pondera tono y energía por igual (1:1). Para una clasificación real de "suena similar" añadirías una tercera característica, o ponderarías el tono más alto. ¿Qué pasa con el veredicto si `energy_diff` empieza a dominar — qué tipo de respuesta equivocada aparece?
- La métrica nunca usa el rango de tono. Dos voces con el mismo tono medio pero una monótona y otra animada obtienen distancia 0. ¿Cuándo importa realmente el rango para distinguir voces, y qué sacrificarías para incluirlo?

## Paso 5: Da forma a un clip hacia un rango objetivo

El movimiento final es el "clone" honesto del kit: medir el tono de cada cuadro, y si cae fuera del rango de un hablante de referencia, remuestrear ese cuadro para que se desplace hacia la referencia — luego escribir el resultado como un nuevo WAV. Las estadísticas se transfieren; la identidad no.

### 5.1 Escribe el paso de ajuste de tono y el escritor WAV

**👟 Pista inicial :** Remuestrea un cuadro por el factor `f` vía `np.interp` (acortar sube el tono, alargar lo baja), sujeta cada cuadro fuera de rango hacia el rango de referencia y reensambla los cuadros en un array.

```python
# voicekit.py (continuación)
def pitch_shift(segment: np.ndarray, factor: float) -> np.ndarray:
    n = int(len(segment) / factor)
    xs = np.linspace(0, len(segment) - 1, n)
    return np.interp(xs, np.arange(len(segment)), segment)

def fit_to_range(data: np.ndarray, sr: int, target: dict) -> np.ndarray:
    low, high = target["pitch_range"]
    frames = frame_signal(data, sr=sr)
    shaped = []
    for frame in frames:
        p = autocorr_pitch(frame, sr)
        if 0 < p < low:
            shaped.append(pitch_shift(frame, low / p))
        elif p > high:
            shaped.append(pitch_shift(frame, high / p))
        else:
            shaped.append(frame)
    return np.concatenate(shaped)

def write_wav(path: str, data: np.ndarray, sr: int = SR) -> None:
    with wave.open(path, "wb") as wav:
        wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(sr)
        clip = np.clip(data, -1, 1)
        wav.writeframes((clip * 32767).astype(np.int16).tobytes())

source = read_wav(make_tone(500))       # a 500 Hz tone
shaped_data, sr = source[0], source[1]
shaped = fit_to_range(shaped_data, sr, prof_low)   # target range ~110 Hz
write_wav("shaped.wav", shaped)
after = build_profile("shaped.wav")
print("before:", round(build_profile("tone_500Hz.wav")["mean_pitch"], 1), "Hz")
print("after:", round(after["mean_pitch"], 1), "Hz  (target ~min/mean of low)")
```

`pitch_shift` remuestrea: para `factor = 2`, conserva cada muestra ~2ª en la mitad de la longitud, lo que *sube* el tono percibido una octava — la física de reproducir una grabación más rápido es exactamente la misma transformación. `fit_to_range` la aplica solo donde se necesita: por debajo del borde bajo de `pitch_range` de la referencia, desplaza el cuadro hacia arriba hasta `low`; por encima del borde alto, hacia abajo. También revela el trade honesto — el remuestreo cambia también la *duración*, que es por qué la clonación de voz real re-sintetiza con un vocoder en lugar de remuestrear, y por qué la salida de este kit es una demo "con forma", nunca una copia parasitaria.

**🎯 Resultado esperado :** "before: 500.0 Hz", "after:" un valor cercano al rango del perfil grave (`~110–150`) y un `shaped.wav` reproducible en disco cuyo tono oirás descender.

**🩹 Si sale mal :** Si "after" sigue leyendo ~500 Hz, `build_profile` se está ejecutando sobre `tone_500Hz.wav` en lugar de `shaped.wav` (la variable `after`). Si el tono baja pero el archivo está en silencio, `write_wav` recortó todo más allá de `±1` — los cuadros remuestreados se desbordaron antes de `np.clip`. Si oyes artefactos en lugar de un tono, `np.concatenate` unió cuadros con longitudes desalineadas — cada `pitch_shift` debe reensamblarse limpiamente filtrando *solo cuadros completos*.

### 5.2 Verifica de extremo a extremo

**✅ Lista de verificación**

- ✅ Una fuente de 500 Hz cae dentro del rango de tono del perfil grave.
- ✅ `write_wav` produce un `shaped.wav` reproducible con `build_profile` consistente al re-leer.
- ✅ Los cuadros fuera de rango se desplazan; los cuadros dentro de rango pasan intactos.
- ✅ Has reflexionado sobre la clonación que *no* construiste: ningún modelo aprendido, ninguna identidad, ningún problema de consentimiento sin el dueño del clip.

**🤔 Pregunta(s) socrática(s)**

- El remuestreo desplaza tanto el tono como la velocidad, así que la voz con forma es más corta. Si quisieras preservar la duración en tiempo real, ¿qué tendrías que hacer con los *otros* cuadros (pista: el remuestreo inverso), y qué artefacto aparece cuando los dos ajustes chocan?
- El kit transfiere estadísticas y sin embargo explícitamente no puede reproducir una voz. ¿Dónde, precisamente, está la línea entre "medir una voz" e "hacerse pasar por una voz" — y cuál de las características actuales tendrías que *eliminar*, no añadir, para mantener esta herramienta en el lado seguro?

## ⚠️ Errores comunes

- **Leer el `int16` crudo como amplitud.** Olvidar la reescala `/ 32768.0` pasa enteros a la matemática de características; la energía y los cruces salen descomunalmente inflados. Solución: normaliza una vez en `read_wav`, confía en cada función aguas abajo.
- **Olvidar centrar los cuadros antes de la autocorrelación.** Un segmento con offset DC se correlaciona con *sí mismo* en lag 0 para siempre, produciendo picos falsos cerca de lag 0. Solución: resta `segment.mean()` antes de `np.correlate`.
- **Duplicación de tono/fallo de octava.** El argmax global de la región de correlación puede aterrizar en el segundo armónico. Solución: toma el *primer* pico local después del lag mínimo, o estrecha `max_lag`.
- **Mezclar características crudas con el filtro sonoro.** Alimentar cuadros no sonoros (silencio → tono `0.0`) a `np.mean(voiced)` sin filtrar arrastra cada perfil hacia cero. Solución: siempre descarta `pitch <= 0` como hace el Paso 3.
- **Confiar en el perfil como identidad.** Los promedios son estadísticas, no una persona. Cualquier uso de este kit que equipare "perfil más cercano" con "ese es el hablante" — para seguridad, suplantación o atribución — repite exactamente el error contra el que advierte el descargo de responsabilidad al inicio.

## Lo que acabas de construir

Un kit de medición de voz en numpy puro que lee audio WAV, extrae características de tono/energía/cruces por cuadro, condensa clips en perfiles comparables, clasifica la cercanía entre hablantes con una métrica de distancia normalizada y da forma al tono de un clip dentro del rango estadístico de otro — con el límite de clonación declarado honestamente en cada camino. La habilidad transferible es la *extracción de características sobre señales crudas*: audio, flujos de sensores y formas de onda recompensan la misma receta de enmarcar, medir y condensar antes de que cualquier capa de "inteligencia" alguna vez los vea.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/voice-cloning-toolkit/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-cloning-toolkit) en el repo del curso es una versión más completa del código anterior, con tonos de sintetizador estilo formante y un notebook que grafica el contorno de tono antes/después. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Añade una tercera característica — el centroide espectral vía una FFT de cada cuadro — y observa cómo se afila la métrica de distancia en dos voces que comparten un tono medio.
- Traza el contorno de tono sobre la duración del clip para que puedas *ver* el vibrato y la entonación en lugar de un solo número medio.
- Implementa una comprobación de brillantez por tasa de cruces por cero para rechazar cuadros mayormente no sonoros, haciendo el filtrado `voiced` más inteligente que "pitch > 0".
- Escribe `read_wav`, `build_profile` y `profile_distance` contra algunos tonos etiquetados a mano en un `test_voicekit.py` para que las regresiones de características no puedan colarse en silencio.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
