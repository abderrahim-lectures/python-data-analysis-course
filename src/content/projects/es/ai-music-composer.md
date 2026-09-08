---
title: "Compositor de Música con IA"
description: "Genera melodías, armonías y arreglos musicales originales usando aprendizaje automático."
difficulty: "advanced"
estimatedMinutes: 120
xpReward: 100
tags: ["Creative", "Audio", "Machine Learning"]
prerequisites:
  - "Conceptos básicos de Python (listas, dicts, funciones, loops, random)"
  - "Una noción aproximada de las escalas occidentales y de que el 'do central' existe — no se requiere teoría musical"
learningObjectives:
  - "Representar notas y ritmos como números sobre los que la máquina pueda razonar"
  - "Aprender un modelo de transición a partir de una melodía semilla con una cadena de Markov"
  - "Generar una melodía variada de paso en paso que respete las estadísticas de la semilla"
  - "Derivar acordes triada a partir de los grados de la escala y superponerlos como acompañamiento"
  - "Escribir un archivo MIDI real con midiutil y verificarlo en disco"
---

# 🛠️ 🎼 Construye un Compositor de Música con IA

Componer una melodía desde la nada es un problema de página en blanco; componer una *variación* de una melodía que ya te gusta es un problema de estadística. Este proyecto construye el segundo tipo de compositor: lee una melodía semilla corta, aprende cómo tiende a seguir cada nota a la anterior, luego genera melodías nuevas a partir de ese modelo aprendido, apila acordes debajo y exporta el resultado como un archivo MIDI genuino — un archivo de canción que puedes abrir en cualquier reproductor o estación de trabajo de audio digital. La "IA" aquí es elegante y honesta: una cadena de Markov, que no es más que "según lo que he escuchado hasta ahora, ¿qué nota suele venir después?"

Esto asume Python 101 y nada de Análisis de Datos — y requiere cero teoría musical para obtener un resultado reproducible, aunque el paso de Armonía tendrá mucho más sentido si tarareas la melodía. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Modelar el tono como números de nota MIDI y el ritmo como duraciones en tiempos — convirtiendo la música en una lista de números de Python.
2. Construir una cadena de Markov a partir de una melodía semilla y verificar lo que aprendió leyendo su tabla de transiciones.
3. Generar una melodía nueva de cualquier longitud caminando por esa cadena.
4. Derivar acordes triada a partir de los grados de la escala y colocarlos bajo la melodía.
5. Exportar una pieza completa a un archivo `.mid` real con midiutil, y verificar el archivo en disco.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino claramente recomendado — la salida de este proyecto es un archivo `.mid` en tu propio disco que querrás abrir en un reproductor local, y la dependencia (`midiutil`) está a un `uv add` de distancia.

**GitHub Codespaces** también funciona bien: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y cada paso de abajo se ejecuta sin cambios; el `.mid` generado es un artefacto descargable que puedes tomar del árbol de archivos.

**Google Colab, Kaggle Notebooks y Binder son una forma genuina de ejecutar cada paso**, porque el generador en sí es Python puro más una librería instalable con pip (`!pip install midiutil`). La advertencia honesta: el sistema de archivos del notebook es efímero, así que el `.mid` que exportas vive ahí — descárgalo antes de que la sesión se cierre. Tampoco hay salida de audio en un notebook, así que igual querrás traer el archivo a tu máquina local para *escuchar* de verdad el resultado.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-music-composer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-music-composer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-music-composer%2Fnotebook.ipynb)

## Configuración

Todo lo necesario antes de la generación: un proyecto con `midiutil`, y un ancla mental de qué significa un número de nota MIDI.

### Configura el proyecto

```bash
uv init ai-music-composer
cd ai-music-composer
uv add midiutil
```

`midiutil` es una librería pequeña y confiable que convierte objetos de Python en un archivo `.mid` binario — el mismo formato portable que abre cualquier DAW, aplicación de teléfono y reproductor de medios. El compositor en sí no dependerá de ella hasta el último paso; todo lo demás es la librería estándar de Python.

### Ancla tu punto de referencia: nota → número

**👟 Pista inicial :** Imprime un diccionario pequeño de nota-a-número para que cada número posterior en este proyecto signifique algo musical en lugar de algo arbitrario.

```python
# composer.py
from collections import defaultdict
import random

NOTES = ["C", "D", "E", "F", "G", "A", "B"]
SEMITONES = [0, 2, 4, 5, 7, 9, 11]  # semitones of the major scale steps

MIDI: dict[str, int] = {}
for octave in range(3, 6):
    for i, name in enumerate(NOTES):
        MIDI[f"{name}{octave}"] = 60 + 12 * (octave - 4) + SEMITONES[i]

print(MIDI["C4"], MIDI["E4"], MIDI["A4"])
```

Los números MIDI son semitonos contados desde la parte inferior del teclado, y el do central es `60`. Construir la tabla a partir de los pasos de la escala mayor `[0, 2, 4, 5, 7, 9, 11]` — eso es tono-tono-semitono-tono-tono-tono-semitono, el mismo patrón que las teclas blancas de un piano — significa que cada nombre de la tabla es una *clase de tono legal en do mayor* desde el principio.

**✅ Lista de verificación**

- ✅ `uv add midiutil` termina sin errores.
- ✅ `MIDI["C4"]` imprime `60`, `MIDI["E4"]` imprime `64` y `MIDI["A4"]` imprime `69` — cada uno exactamente cuatro semitonos por encima del último salto que esperarías.
- ✅ `composer.py` contiene la tabla de números-de-nota y ambos imports de la librería estándar en la parte superior.

## Paso 1: Convierte una melodía en números

Una partitura es prosa; una cadena de Markov necesita datos. Este paso convierte una melodía semilla pequeña — una que podrías tararear — en una lista plana de números MIDI, e introduce el punto de vista "una nota sigue a la otra" sobre el que se construye todo el compositor.

### 1.1 Escribe la semilla como una lista de valores MIDI

**👟 Pista inicial :** Transcribe la semilla clásica `C4 D4 E4 D4 C4 E4 F4 G4 A4 G4 F4 E4 D4 C4` (la primera frase de una canción de cuna) a una lista de los números de tu tabla `MIDI`.

```python
# composer.py (continued)
SEED = [MIDI["C4"], MIDI["D4"], MIDI["E4"], MIDI["D4"], MIDI["C4"], MIDI["E4"],
        MIDI["F4"], MIDI["G4"], MIDI["A4"], MIDI["G4"], MIDI["F4"], MIDI["E4"],
        MIDI["D4"], MIDI["C4"]]

print(SEED)
```

Una melodía es una secuencia, y las secuencias son la entrada a partir de la cual se construyen las cadenas de Markov. Hacer que la semilla sea una lista de *números* en lugar de nombres de notas es la abstracción central: el generador nunca necesita saber cómo "suena" `64`, solo que a menudo sigue a `62`.

**🎯 Resultado esperado :** `[60, 62, 64, 62, 60, 64, 65, 67, 69, 67, 65, 64, 62, 60]` — 14 notas, empezando y terminando en `60`.

**🩹 Si sale mal :** Si un número parece incorrecto, verifica la octava en la construcción de la tabla `MIDI` (un `C4` distinto de `60` significa que el desplazamiento `(octave - 4)` está mal). Si la lista tiene problemas de longitud, cuenta los corchetes — el salto de línea de arriba no debe agregar ni quitar un valor.

### 1.2 Divide la melodía en observaciones

**👟 Pista inicial :** Empareja cada nota con su sucesora — `zip(SEED, SEED[1:])` — y confirma que las observaciones se leen como nota → nota.

```python
# composer.py (continued)
observations = list(zip(SEED, SEED[1:]))
print(observations[:4])
print("made", len(observations), "pairs from", len(SEED), "notes")
```

`zip(a, a[1:])` es el patrón que separa cualquier secuencia en pares adyacentes — nótese que produce exactamente `len(SEED) - 1` pares, porque la nota final no tiene sucesora. Cada par es una unidad de "gramática" musical: *dado 62, observé 64.*

**🎯 Resultado esperado :** `[(60, 62), (62, 64), (64, 62), (62, 60)]` y el conteo `made 13 pairs from 14 notes`.

**🩹 Si sale mal :** Si los pares muestran valores que no están en `SEED`, comprimiste la estructura equivocada (`SEED[:-1]` y `SEED[1:]` es la grafía más segura que una rebanada mixta). Si el conteo de pares es igual al conteo de notas, una rebanada se invirtió — debe haber *un par menos* que notas.

### 1.3 Verifica la codificación numérica

**✅ Lista de verificación**

- ✅ Las 14 notas de la semilla producen 13 pares adyacentes.
- ✅ El segundo elemento de cada par es la nota *siguiente* en la semilla original.
- ✅ Puedes traducir `SEED[5]` de vuelta a un nombre de nota a mano sin ejecutar código.

**🤔 Pregunta(s) socrática(s)**

- La semilla está en do mayor y cada valor se mantiene en una octava. ¿Qué cambia en los pares de observación si transpones toda la semilla una octava arriba — la estructura, o solo los números? ¿Qué dice eso sobre dónde vive la "música"?
- `zip` empareja notas estrictamente adyacentes, ignorando cuánto tiempo se sostiene cada nota. ¿Qué cualidad musical real — la forma de la frase, por ejemplo — es invisible para este modelo, y dónde piensas que aparecerá primero en este proyecto?

## Paso 2: Aprende la cadena de Markov

Una cadena de Markov responde una pregunta por nota: "dada la nota actual, ¿qué dice el dato que es probable que siga?" La versión del compositor almacena cada sucesor observado para cada nota en un `defaultdict` de listas — barato, transparente e inspeccionable, exactamente como una tabla de frecuencias que puedes leer.

### 2.1 Construye la tabla de transiciones

**👟 Pista inicial :** Escribe `build_chain(sequence)` que devuelva `{note: [successors]}` usando un `defaultdict(list)`, y luego imprime la fila de una nota.

```python
# composer.py (continued)
from collections import defaultdict

def build_chain(sequence: list[int]) -> dict[int, list[int]]:
    chain: dict[int, list[int]] = defaultdict(list)
    for current, nxt in zip(sequence, sequence[1:]):
        chain[current].append(nxt)
    return chain

chain = build_chain(SEED)
print("after 64:", chain[64])
```

`chain[current].append(nxt)` dice "cuando vi por última vez `current`, esta vez fue seguido por `nxt`". Iterar sobre los pares una vez construye el modelo completo — la tabla es, en efecto, una distribución de frecuencias por nota, y `defaultdict(list)` significa que nunca tienes que tratar de forma especial a una nota que aparece por primera vez.

**🎯 Resultado esperado :** `after 64: [62, 65, 62]` — el `64` de la semilla fue seguido por `62` una primera vez cerca del inicio, por `65` en la subida hacia el pico y por `62` otra vez en el descenso.

**🩹 Si sale mal :** Si la fila es `[]` o falta, `64` nunca apareció como nota *actual* — verifica que estás construyendo a partir de `SEED`, no de una lista vacía. Si una fila lista sucesores claramente equivocados, el `zip` en `build_chain` empareja vecinos incorrectos — imprime `list(zip(sequence, sequence[1:]))[:3]` y compáralo con la semilla.

### 2.2 Agrega aleatoriedad con una semilla

**👟 Pista inicial :** Completa `generate_melody(chain, start, length)` — camina por la cadena y, cuando una nota no tiene sucesor registrado, recurre a la nota inicial en lugar de fallar.

```python
# composer.py (continued)
def generate_melody(chain: dict[int, list[int]], start: int, length: int) -> list[int]:
    melody = [start]
    current = start
    for _ in range(length - 1):
        successors = chain[current]
        current = random.choice(successors) if successors else start
        melody.append(current)
    return melody

random.seed(7)
print(generate_melody(chain, MIDI["C4"], 8))
```

`random.choice` es lo que hace que cada ejecución sea un *compositor* en lugar de una grabadora — la cadena da el alfabeto (qué notas pueden seguir) y el azar elige dentro de él. El recurso `if successors else start` es la válvula de seguridad para las notas que solo terminaron frases (como el `C4` final, que no tiene sucesor en la semilla).

**🎯 Resultado esperado :** Una lista de longitud 8 que empieza en `60`, cuyos elementos posteriores provienen todos de los grupos de sucesores de `chain` — con `random.seed(7)` la salida de este proyecto es reproducible, pero cambia la semilla y la melodía cambia legalmente.

**🩹 Si sale mal :** Si aparece `KeyError: ...`, una nota llegó al final de la melodía sin un recurso — falta la cláusula `else start` o se está omitiendo porque indexaste `chain[current]` con `[]` en lugar de `.get`. Si la salida nunca sale de una nota, `successors` se resuelve a una lista vacía constantemente, lo que significa que la cadena se construyó a partir de la entrada equivocada.

### 2.3 Verifica que el modelo realmente aprendió

**✅ Lista de verificación**

- ✅ `build_chain(SEED)` produce una fila por cada nota distinta, listando cada fila solo las notas que realmente la siguieron en la semilla.
- ✅ `generate_melody` corre con una semilla de aleatoriedad fija y repetidamente con semillas variables.
- ✅ Cada nota generada es una nota que la cadena *podría* producir legítimamente, nunca un tono inventado.

**🤔 Pregunta(s) socrática(s)**

- La cadena solo avanza una nota a la vez — no tiene memoria de "hace dos notas". ¿Qué textura musical sería visible para una cadena de *segundo orden* (clave en pares) a la que la actual es ciega?
- `random.seed(7)` hace reproducible la salida. ¿Cuál es el *peligro* de un compositor que finge que cada ejecución debe diferir — y qué te compra la reproducibilidad cuando intentas arreglar una melodía que te gustó de una ejecución anterior?

## Paso 3: Dale un ritmo a la melodía

La cadena hasta ahora produce un flujo de tonos sin tiempo. Este paso empareja cada tono con una duración en tiempos, para que la pieza deje de ser una ráfaga de notas iguales y se convierta en una frase que un humano podría seguir con palmas.

### 3.1 Modela el ritmo como duraciones de tiempos

**👟 Pista inicial :** Define una anotación rítmica como una lista de longitudes de tiempos — por ejemplo, un patrón de blanca, negra, negra, corchea — y un helper que comprima los tonos con las duraciones en eventos de notas.

```python
# composer.py (continued)
def make_phrase(melody: list[int], durations: list[float]) -> list[tuple[int, float]]:
    return list(zip(melody, durations))

phrase = make_phrase(SEED, [1.0, 1.0, 0.5, 0.5, 1.0, 1.0, 1.0, 1.0,
                            0.5, 0.5, 1.0, 1.0, 1.0, 2.0])
print(phrase[:3])
print("phrase spans", sum(d for _n, d in phrase), "beats")
```

Las duraciones se miden en tiempos, la unidad que realmente almacenan los archivos MIDI: `0.5` es una corchea, `1.0` una negra, `2.0` una blanca. `zip` reconstruye una melodía en una lista de eventos `(pitch, beats)` sin tocar la generación de tonos, y `sum` de todas las duraciones responde directamente a la pregunta obvia del compositor — "¿cuánto dura esta frase?"

**🎯 Resultado esperado :** `[(60, 1.0), (62, 1.0), (64, 0.5)]` y `phrase spans 13.0 beats` (la última nota se sostuvo un total de 2 tiempos).

**🩹 Si sale mal :** Si la frase tiene un número de elementos diferente al de la melodía, la lista de duraciones tiene una longitud distinta — `zip` trunca silenciosamente a la más corta, así que verifica `len(durations) >= len(melody)` temprano o la cola de la melodía desaparecerá. Si la suma parece equivocada, revisa que la duración final de `2.0` realmente aterrizó en la última nota.

### 3.2 Convierte la frase en una estructura de canción en un loop

**👟 Pista inicial :** Repite la frase unas cuantas veces y *melodiza* la cantidad de compases de una canción completa, para que el paso de exportación tenga una longitud real que escribir.

```python
# composer.py (continued)
def make_song(phrase: list[tuple[int, float]], repeats: int, chain, start: int) -> list[tuple[int, float]]:
    song: list[tuple[int, float]] = []
    for _ in range(repeats):
        melody = generate_melody(chain, start, len(phrase))
        song.extend(make_phrase(melody, [d for _n, d in phrase]))
    return song

song = make_song(phrase, 4, chain, MIDI["C4"])
print(len(song), "notes =", sum(d for _n, d in song), "beats")
```

Reutilizar el mismo esqueleto rítmico para cada repetición es la forma clásica de obtener variedad estructural barata: el *tempo* se mantiene reconocible mientras la cadena varía los tonos. Extender la canción nota por nota con `list.extend` mantiene exacto el total de tiempos — repetida cuatro veces, una frase de 13 tiempos son exactamente 52 tiempos.

**🎯 Resultado esperado :** `52 notes = 52.0 beats` — cuatro copias de la frase una tras otra, cada una con tonos recién generados (pero legales para la cadena).

**🩹 Si sale mal :** Si la canción tiene 14 notas en lugar de 56, el cuerpo del loop construye una frase y luego sale — verifica `extend`, no `append`, para que acumules en lugar de reemplazar. Si los tiempos se desvían a 51 o 53, una melodía generada devolvió una longitud diferente a `len(phrase)` y un `zip` se truncó temprano.

### 3.3 Verifica el ritmo

**✅ Lista de verificación**

- ✅ Las frases emparejan tonos con duraciones de tiempos, y las sumas de duraciones son exactas.
- ✅ Las canciones multifrase repiten el esqueleto rítmico mientras dejan que la cadena de melodía varíe.
- ✅ Puedes predecir el conteo total de tiempos de una canción a partir de su frase y su cantidad de repeticiones.

**🤔 Pregunta(s) socrática(s)**

- Cada repetición re-ejecuta `generate_melody` con el mismo `len(phrase)`. ¿Qué pasa con la *longitud* de la canción si una melodía genera alguna vez una nota más que la frase — y por qué `zip` con un ritmo fijo enmascara por completo ese bug?
- El ritmo está actualmente fijo como el de la semilla. ¿Qué nota de `phrase` esperarías que cayera en tiempos fuertes versus débiles, y qué efecto compositivo tiene ese énfasis en una frase que *empieza* en la nota de anacrusa `D4`?

## Paso 4: Apila acordes debajo

Una melodía sola es un boceto; la pieza obtiene su cuerpo de la armonía. Este paso deriva triadas de la escala mayor — cada acorde son el 1º, 3º y 5º paso de la escala por encima de una raíz — y las coloca bajo la melodía para que toda la pieza se lea como canción, no como seno.

### 4.1 Construye triadas a partir de los grados de la escala

**👟 Pista inicial :** Define `scale` como una lista de tonos que abarca una octava y `triad(degree)` como `[scale[d], scale[d+2], scale[d+4]]` para que el acorde "suba por las teclas blancas".

```python
# composer.py (continued)
SCALE = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83]  # C4 up to B5

def triad(degree: int) -> list[int]:
    return [SCALE[degree], SCALE[degree + 2], SCALE[degree + 4]]

print(triad(0), triad(5), triad(3), triad(4))
```

`SCALE` abarca dos octavas completas precisamente para que `degree + 4` siga siendo legal para cada grado — sin contabilidad de envoltura de octava. Apilar tres pasos de escala alternados produce la clásica pila de terceras: C (`60,64,67`), Am (`69,72,76`), F (`65,69,72`), G (`67,71,74`). Una lista de una sola octava truncaría acordes altos como `Am` una octava abajo, así que la segunda octava es lo que hace real la armonía.

**🎯 Resultado esperado :** `[60, 64, 67]`, `[69, 72, 76]`, `[65, 69, 72]`, `[67, 71, 74]` — las triadas de do mayor, la menor, fa y sol.

**🩹 Si sale mal :** Verifica una triada de aspecto incorrecto contando semitonos desde la raíz — `Am` debe ser `69, 72, 76` (A–C–E). Si cada acorde aterriza en la octava *baja* como `[69, 60, 64]`, `SCALE` es la lista de 7 entradas de una sola octava, así que `degree + 2` y `degree + 4` se envolvieron fuera de rango. Si cada acorde es pequeño como `[60, 62, 64]`, indexaste `[d, d+1, d+2]` en lugar de saltear cada segundo paso de escala.

### 4.2 Escribe una progresión de acordes que encaje con la pieza

**👟 Pista inicial :** Elige una progresión corta de grados — la clásica `I–vi–IV–V` = grados `[0, 5, 3, 4]` — y expándela a través de las frases repetidas de la canción, un acorde cada dos tiempos.

```python
# composer.py (continued)
def chord_schedule(song: list[tuple[int, float]], progression: list[int]) -> list[list[int]]:
    chords: list[list[int]] = []
    beat = 0.0
    for _n, dur in song:
        degree = progression[int(beat) // 2 % len(progression)]
        chords.append(triad(degree))
        beat += dur
    return chords

chords = chord_schedule(song, [0, 5, 3, 4])
print(chords[0], chords[2], chords[28], chords[55])
```

`int(beat) // 2` rebaña la canción en ventanas de 2 tiempos — cada ventana lleva un acorde, y el `% len(progression)` envuelve la progresión alrededor de la longitud de la canción. El resultado son etiquetas de acorde por nota, que es exactamente lo que el exportador MIDI consumirá en el Paso 5. Nótese la simplificación honesta: un arreglo real sostiene un acorde por *compás*; este proyecto sostiene uno cada dos tiempos, y la diferencia es audiblemente aceptable para una pieza de aprendizaje.

**🎯 Resultado esperado :** `chords[0]` es la triada de do `[60, 64, 67]`, `chords[2]` (que empieza en el tiempo 2.0, ventana 1) es `Am` `[69, 72, 76]`, `chords[5]` (empieza en el tiempo 4.0, ventana 2) es `F` `[65, 69, 72]` y `chords[8]` (empieza en el tiempo 7.0, ventana 3) es `G` `[67, 71, 74]` — el giro completo I–vi–IV–V en la primera frase de la canción.

**🩹 Si sale mal :** Si un índice de acorde imprime una triada fuera de las cuatro de la progresión, la envoltura `% len(progression)` o la ventana `// 2` están mal — recalcula a mano una entrada: `chords[8]` empieza en el tiempo 7.0, así que `int(7.0) // 2 = 3`, `3 % 4 = 3`, grado `4`, triada `G`. Si todos los acordes son idénticos, `progression` se pasó como una lista de un solo elemento.

### 4.3 Verifica la armonía

**✅ Lista de verificación**

- ✅ Cada grado produce un acorde de tres notas apilado a una tercera de distancia.
- ✅ La progresión `[0, 5, 3, 4]` cicla limpiamente a través de una canción completa.
- ✅ Cada nota de la canción tiene un acorde asignado sin huecos.

**🤔 Pregunta(s) socrática(s)**

- El acorde sigue una ventana fija de 2 tiempos sin importar lo que esté haciendo la melodía. ¿Dónde en `chord_schedule` inyectarías "solo cambia el acorde cuando la melodía aterriza en un tiempo fuerte" — y qué congestión musical corrige eso?
- Los cuatro acordes provienen de una sola escala mayor, así que todo acorde está "en clave". Si permitieras un acorde *prestado* (una nota accidental fuera de `SCALE`), ¿dónde colapsaría silenciosamente el modelo del Paso 2, y por qué el escritor MIDI no se quejaría?

## Paso 5: Exporta a un archivo MIDI real

Todo lo anterior vive en listas de Python. Este paso las escribe en un archivo `.mid` genuinamente reproducible con `midiutil`, usando dos pistas — melodía y luego armonía — y verifica el archivo en disco para que sepas que la exportación funcionó sin necesidad de oír una nota.

### 5.1 Coloca la canción en eventos MIDI

**👟 Pista inicial :** Escribe `write_midi(song, chords, filename)` con un `addTempo`, una pista de melodía en el tiempo 0 y una pista de acordes que empiece ligeramente después para que no se superponga con la anacrusa.

```python
# composer.py (continued)
import os
from midiutil import MIDIFile

def write_midi(song: list[tuple[int, float]], chords: list[list[int]], filename: str = "song.mid") -> None:
    midi = MIDIFile(2)  # tracks 0 and 1: melody and chords
    tempo, volume = 120, 96

    melody_time = 0.0
    for note, dur in song:
        midi.addNote(0, 0, note, melody_time, dur, volume)
        melody_time += dur

    chord_time = 0.0
    for chord in chords:
        for note in chord:
            midi.addNote(1, 0, note, chord_time, 2.0, 48)
        chord_time += 2.0

    with open(filename, "wb") as f:
        midi.writeFile(f)

write_midi(song, chords, "song.mid")
print("wrote song.mid in", os.path.getsize("song.mid"), "bytes")
```

`MIDIFile(2)` crea las pistas `0` y `1` — melodía en 0, acordes en 1 — y `addTempo(0, 0, 120)` fija el evento de tempo a la misma pista principal. Una peculiaridad que vale la pena conocer: en el formato 1, el conteo de pistas del encabezado es *`numTracks + 1`* porque midiutil siempre cuenta una primera pista de tempo, así que el archivo en sí reportará `3` pistas aunque el constructor dijera `2` — el verificador en 5.2 confirmará exactamente eso. `addNote(track, channel, pitch, time, duration, volume)` es entonces toda la superficie de traducción: tono, tiempo de inicio y longitud en tiempos se mapean uno a uno desde las estructuras de datos anteriores. Un volumen de acorde más bajo (`48` frente al `96` de la melodía) es la decisión de mezcla que evita que una pieza de aprendizaje se convierta en ruido, y escribir bytes con `writeFile` a un objeto de archivo abierto es toda la exportación.

**🎯 Resultado esperado :** `wrote song.mid in <unos cuantos miles> bytes`, y el archivo existe en la carpeta del proyecto, abrible por cualquier reproductor o DAW con capacidad MIDI.

**🩹 Si sale mal :** Si aparece `FileNotFoundError` o un archivo vacío, la ruta de escritura es incorrecta o `writeFile` nunca se ejecutó — confirma que el contexto `open(..., "wb")` es el *único* lugar que escribe. Si un reproductor reporta un archivo corrupto, un tiempo de nota retrocedió (se perdió un `+=` acumulativo) y la línea de tiempo de la pista quedó rota.

### 5.2 Verifica que el archivo realmente es una canción

**👟 Pista inicial :** Mira dentro de los bytes crudos del `.mid` — la magia `MThd` del encabezado, el campo de conteo de pistas del encabezado y el conteo de bytes de estado de nota-on — para confirmar que la exportación es un archivo MIDI real y estructurado, no bytes aleatorios con extensión `.mid`.

```python
# composer.py (continued)
def verify(midi_path: str = "song.mid") -> None:
    with open(midi_path, "rb") as f:
        data = f.read()
    n_tracks = int.from_bytes(data[10:12], "big")  # 'ntrks' header field
    note_ons = sum(1 for byte in data if (byte & 0xF0) == 0x90)
    print("is a MIDI file:", data[:4] == b"MThd")
    print("track count (header):", n_tracks)
    print("note-on events:", note_ons)

verify()
```

Todo Archivo MIDI Estándar abre con la magia de 4 bytes `MThd`, así que `data[:4]` es la única comprobación que separa un `.mid` real de un archivo de texto renombrado. MIDI es un protocolo a nivel de bytes: un byte de estado en el rango `0x90–0x9F` *es* un mensaje de nota-on, así que escanear `data` con `(byte & 0xF0) == 0x90` cuenta exactamente las notas que escribiste. Los bytes 10–12 del encabezado son el conteo de pistas, que lee `3` porque el formato 1 cuenta una pista de tempo inicial además de tus dos (`numTracks + 1`).

**🎯 Resultado esperado :** `is a MIDI file: True`, `track count (header): 3` (tempo + melodía + acordes) y `note-on events: 224` — `len(song)` para la melodía más `3 * len(chords)` para los acordes (56 + 168).

**🩹 Si sale mal :** Si la comprobación del encabezado falla, el archivo no es un archivo MIDI — mira qué se escribió bajo ese nombre. Si `note-on events` es corto, acordes o notas de melodía se descartaron al escribir; si es *más largo* de lo esperado, se coló un byte `0x90`-como-estado de un evento de tempo o cambio de programa, y el conteo de pistas del encabezado es la verdad de fondo más confiable. Si el conteo de pistas no es `3`, la exportación usó un tamaño `MIDIFile(...)` diferente del que asume el lector.

### 5.3 Verifica la exportación

**✅ Lista de verificación**

- ✅ `song.mid` existe, empieza con `MThd`, reporta 3 pistas en su encabezado y escanea a los 224 eventos de nota-on esperados.
- ✅ La pista de melodía y la pista de acordes están separadas — y sus conteos de eventos coinciden con las estructuras que produjeron el Paso 3 y el Paso 4.
- ✅ La extensión en tiempos de la melodía es igual al total de tiempos calculado de la canción.

**🤔 Pregunta(s) socrática(s)**

- La especificación MIDI almacena el tiempo en *ticks por negra*; midiutil elige una resolución por ti. ¿Qué cambio en el lado de la importación — la resolución de ticks de otro DAW, por ejemplo — podría hacer que el tempo de una pieza suene mal aunque `addTempo` diga 120?
- 224 eventos de nota es una gran cantidad de escrituras para datos afinados a mano. ¿Cómo cambiaría la función `chord_schedule` si quisieras *omitir* por completo la pista de acordes para una línea solista — y qué revela tu respuesta sobre cuán acopladas están las dos pistas en el momento de `write_midi`?

## ⚠️ Errores comunes

- **Olvidar que la nota 60 es el do central.** Construir la tabla `MIDI` con un desplazamiento `(octave - 4)` incorrecto produce un compositor perfectamente legal que escribe todo una octava mal — y MIDI no se quejará, solo lo harán tus oídos.
- **`zip` truncando silenciosamente.** `make_phrase(melody, durations)` con longitudes disparejas descarta notas sin error. Agrega una comprobación explícita de longitud cuando enseñes al compositor a emparejar tonos con el tiempo.
- **Una cadena sin recurso para las notas finales.** El `C4` final de la semilla no tiene sucesor; sin el `if successors else start`, el generador lanza `KeyError` justo en la melodía que se supone que debe extender.
- **Ventanas de acordes superpuestas.** Si a un acorde se le da una duración más larga que su ventana de 2 tiempos, los eventos de acorde se adentran en la siguiente ventana y la pieza se convierte en papilla — mantén la duración del acorde como un múltiplo exacto del tamaño de la ventana.
- **Exportar sin verificar el encabezado.** Un `.mid` que no es realmente un archivo MIDI (sin `MThd`) se verá "listo" en el árbol de archivos y fallará en todos lados. La comprobación del encabezado de cuatro bytes es la única verificación barata que lo detecta.

## Lo que acabas de construir

Un compositor estadístico funcional: convierte una melodía tarareada en números, aprende un modelo de Markov de transiciones nota-a-nota, genera variaciones legales, coloca una progresión de acordes debajo y escribe toda la pieza a un archivo MIDI real que puedes abrir y escuchar. La habilidad transferible sobrevive a la canción: modela secuencias como observaciones de frecuencia, genera dentro de lo que observaste y mantén el modelo lo suficientemente pequeño para poder *leerlo* — ese patrón se transfiere a texto, gestos, feeds de sensores y cualquier otro dato que se despliegue en el tiempo.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/ai-music-composer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-music-composer) en el repositorio del curso es todo el compositor como notebook, desde la semilla hasta un `song.mid` descargable. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Mejora a una cadena de *segundo orden* con clave en pares `(current, previous)` — `chain[(60, 62)]` — y escucha cómo las melodías ganan frases que realmente se repiten en lugar de solo deambular.
- Agrega una bandera CLI de control de tempo (`--tempo 90`) y un argumento `--degree-progression "0 5 3 4"` para que el mismo código escriba piezas tipo vals o piezas enérgicas sin ediciones.
- Extiende el modelo de ritmo a una cadena de Markov sobre duraciones también, para que el generador elija *cuándo* empieza una nota además de qué tono tiene.
- Exporta una línea de bajo una octava por debajo de las raíces de los acordes y luego superpone las tres pistas — el primer arreglo genuinamente multifuente que este pipeline puede producir.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓