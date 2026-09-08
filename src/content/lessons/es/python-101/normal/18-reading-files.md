---
title: "Leer archivos"
description: "Abre, lee y procesa archivos de texto de forma segura con administradores de contexto."
module: "file-io"
order: 18
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Abrir y leer archivos con la instrucción with"
  - "Leer línea por línea para un procesamiento eficiente en memoria"
  - "Usar pathlib para rutas de archivo multiplataforma"
  - "Manejar errores comunes de archivos con elegancia"
prerequisites: ["17-comprehensions"]
tags: ["archivos", "lectura", "with", "administrador-de-contexto", "pathlib"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Abrir archivos

Usa `open()` para obtener un objeto de archivo:

```python
f = open("data.txt", "r")  # read mode
content = f.read()
f.close()  # always close when done!
```

## La instrucción with

`with` cierra el archivo automáticamente, incluso si ocurre un error:

```python
with open("data.txt") as f:
    content = f.read()
# file is closed here
```

**Usa siempre `with`** — es más seguro y limpio.

## Estrategias de lectura

```python
# Read entire file as one string
with open("data.txt") as f:
    text = f.read()

# Read line by line (memory-efficient for large files)
with open("data.txt") as f:
    for line in f:
        print(line.rstrip())  # strip trailing newline

# Read all lines into a list
with open("data.txt") as f:
    lines = f.readlines()  # includes \n in each string
```

## Pathlib (enfoque moderno)

`pathlib` proporciona rutas orientadas a objetos — más legibles que la concatenación de cadenas:

```python
from pathlib import Path

p = Path("data") / "scores.txt"    # Path('data/scores.txt')
text = p.read_text()               # read the whole file
lines = p.read_text().splitlines() # lines without \n

p.exists()   # True/False
p.is_file()  # True/False
p.suffix     # '.txt'
p.stem       # 'scores'
```

## Codificación

Especifica siempre la codificación para la portabilidad:

```python
with open("data.txt", encoding="utf-8") as f:
    text = f.read()
```

Sin `encoding`, Python usa la configuración predeterminada del sistema, que varía entre plataformas.

## Errores comunes

- **Olvidar `with`**: los identificadores de archivo se filtran si no los cierras
- **Leer archivos enormes en memoria**: usa `for line in f` en lugar de `f.read()`
- **Ignorar la codificación**: texto ilegible en archivos no ASCII
- **Rutas codificadas de forma fija**: usa `pathlib.Path` para la compatibilidad multiplataforma

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe código que cuente el número de líneas de un archivo sin cargarlo entero en memoria.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>count = 0; with open("file.txt") as f: for line in f: count += 1</code> o simplemente <code>sum(1 for _ in open("file.txt"))</code></p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Usa `pathlib` para listar todos los archivos `.txt` de un directorio.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>list(Path(".").glob("*.txt"))</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Por qué `for line in f` no incluye el `\n` final? ¿O sí? ¿Cómo lo eliminarías?
- ¿Qué ocurre si intentas leer un archivo que no existe? ¿Cómo maneja `with` las excepciones?
- ¿Cuándo preferirías `f.read()` a iterar línea por línea?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

<div class="quiz" data-quiz="python-101-file-reading">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué hace <code>line.rstrip()</code> en un bucle de archivo?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Elimina todo el espacio en blanco</button>
      <button class="quiz-q__opt" data-idx="1">Elimina el salto de línea final (y los espacios)</button>
      <button class="quiz-q__opt" data-idx="2">Elimina el salto de línea inicial</button>
      <button class="quiz-q__opt" data-idx="3">Devuelve la longitud de la línea</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Cuál es la forma correcta de leer un archivo?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f = open("x.txt"); f.read()</button>
      <button class="quiz-q__opt" data-idx="1">read("x.txt")</button>
      <button class="quiz-q__opt" data-idx="2">with open("x.txt") as f: content = f.read()</button>
      <button class="quiz-q__opt" data-idx="3">File.read("x.txt")</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>