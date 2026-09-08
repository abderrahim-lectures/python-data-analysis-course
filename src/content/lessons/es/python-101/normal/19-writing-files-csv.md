---
title: "Escribir archivos y CSV"
description: "Escribe texto en archivos y trabaja con datos CSV estructurados."
module: "file-io"
order: 19
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "Escribir y añadir a archivos de texto"
  - "Leer y escribir archivos CSV con el módulo csv"
  - "Usar pathlib para crear y manipular archivos"
  - "Comprender los modos de archivo (r, w, a, x)"
prerequisites: ["18-reading-files"]
tags: ["escribir", "csv", "append", "modos-de-archivo", "módulo-csv"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Modos de archivo

```python
open("file.txt", "r")   # read (default)
open("file.txt", "w")   # write (overwrites!)
open("file.txt", "a")   # append (adds to end)
open("file.txt", "x")   # create (errors if file exists)
```

## Escribir archivos de texto

```python
# "w" mode creates or overwrites
with open("output.txt", "w") as f:
    f.write("Hello, World!\n")
    f.write("Second line\n")

# writelines for multiple strings
lines = ["line 1\n", "line 2\n", "line 3\n"]
with open("output.txt", "w") as f:
    f.writelines(lines)
```

## Añadir

```python
with open("log.txt", "a") as f:
    f.write("New entry\n")  # adds to end, doesn't overwrite
```

## Trabajar con CSV

El módulo `csv` maneja las partes difíciles (comillas, delimitadores):

```python
import csv

# Writing CSV
with open("data.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Score"])
    writer.writerow(["Alice", 85])
    writer.writerow(["Bob", 92])

# Reading CSV
with open("data.csv") as f:
    reader = csv.reader(f)
    header = next(reader)  # ['Name', 'Score']
    for row in reader:
        print(f"{row[0]}: {row[1]}")
```

## DictReader y DictWriter

Asigna las filas de CSV a diccionarios para un código más limpio:

```python
import csv

# DictReader — rows become dicts with header keys
with open("data.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['Name']}: {row['Score']}")

# DictWriter — write from dicts
with open("output.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Name", "Score"])
    writer.writeheader()
    writer.writerow({"Name": "Charlie", "Score": 88})
```

## Pathlib para escribir

```python
from pathlib import Path

Path("output.txt").write_text("Hello!\n")
content = Path("output.txt").read_text()

# Create directories
Path("data/logs").mkdir(parents=True, exist_ok=True)
```

## Errores comunes

- **`"w"` sobrescribe en silencio** — pierdes los datos antiguos. Usa `"a"` para añadir
- **Olvidar `newline=""`** en CSV en Windows — causa filas en blanco
- **No llamar a `writeheader()`** con `DictWriter` — la salida no tiene fila de encabezado

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Retos</h2>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe una función que tome una lista de números y los escriba en un archivo, uno por línea.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>with open("nums.txt", "w") as f: for n in nums: f.write(f"{n}\n")</code></p>

</div>
</details>

<details class="challenge">
<summary>Reto — piensa primero, luego revela</summary>
<div class="challenge__body">

Lee un CSV de calificaciones de estudiantes e imprime la puntuación media.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>import csv; with open("grades.csv") as f: rows = list(csv.DictReader(f)); avg = sum(int(r["Score"]) for r in rows) / len(rows); print(f"Average: {avg:.1f}")</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Preguntas socráticas</h2>

- ¿Por qué escribir CSV necesita `newline=""` en Windows pero no en Linux? ¿Qué ocurre bajo el capó?
- ¿Cuál es la diferencia entre `csv.writer` y `csv.DictWriter`? ¿Cuándo preferirías uno?
- Si escribes un CSV que se abrirá en Excel, ¿qué precauciones adicionales deberías tomar?

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Comprobación rápida</h2>

<div class="quiz" data-quiz="python-101-file-writing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué modo crea un archivo o lo sobrescribe?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">"r"</button>
      <button class="quiz-q__opt" data-idx="1">"w"</button>
      <button class="quiz-q__opt" data-idx="2">"a"</button>
      <button class="quiz-q__opt" data-idx="3">"x"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. ¿Qué usa `csv.DictReader` como claves de diccionario?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La primera fila (los encabezados)</button>
      <button class="quiz-q__opt" data-idx="1">Los índices de columna (0, 1, 2...)</button>
      <button class="quiz-q__opt" data-idx="2">Nombres generados automáticamente</button>
      <button class="quiz-q__opt" data-idx="3">La última fila</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>