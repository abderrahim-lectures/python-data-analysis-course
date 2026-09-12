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

## Las cuatro puertas

Leer era una puerta de una sola dirección: `"r"` deja pasar los datos. Escribir necesita el vocabulario de la intención, porque cada modo promete algo distinto sobre el destino del archivo:

```python
open("file.txt", "r")   # leer (por defecto)
open("file.txt", "w")   # escribir (¡sobrescribe!)
open("file.txt", "a")   # añadir (agrega al final)
open("file.txt", "x")   # crear (error si el archivo existe)
```

`"w"` arroja el contenido viejo en el instante en que abre; `"a"` lo conserva y remienda al final; `"x"` se niega a tocar un archivo que ya existe. Elige el modo que declare lo que realmente quieres — el archivo se destruye o se preserva por esa elección.

## Escribir archivos de texto

```python
# El modo "w" crea o sobrescribe
with open("output.txt", "w") as f:
    f.write("Hello, World!\n")
    f.write("Second line\n")

# writelines para varias cadenas
lines = ["line 1\n", "line 2\n", "line 3\n"]
with open("output.txt", "w") as f:
    f.writelines(lines)
```

`write` entrega una cadena a la vez; `writelines` entrega una lista entera en una llamada. Ambas respetan el mismo contrato `with` que ya confías: cuando el bloque termina, el archivo se vacía y cierra. Nota el `\n` colándose en cada cadena escrita — el salto de línea no se agrega por ti, solo se almacena.

## Añadir

Los registros crecen y nunca reescriben la historia. `"a"` aparca el cursor al final:

```python
with open("log.txt", "a") as f:
    f.write("New entry\n")  # agrega al final, no sobrescribe
```

El modo añadir convierte el archivo en un acumulador: cada ejecución agrega una línea, y todo lo escrito antes sobrevive intacto.

## Trabajar con CSV

Un CSV es una tabla sobre el cable: filas separadas por saltos de línea, celdas separadas por comas. El módulo `csv` es dueño de las partes delicadas — comillas, escape de delimitadores, finales de línea:

```python
import csv

# Escribir CSV
with open("data.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Score"])
    writer.writerow(["Alice", 85])
    writer.writerow(["Bob", 92])

# Leer CSV
with open("data.csv") as f:
    reader = csv.reader(f)
    header = next(reader)  # ['Name', 'Score']
    for row in reader:
        print(f"{row[0]}: {row[1]}")
```

El escritor acepta una lista por fila e inserta las comas; el lector devuelve cada fila a una lista. `next(reader)` despega la línea de cabecera, y la iteración continúa con los datos — el mismo paseo que ya conoces, por un archivo cuyas filas son estructuras.

## DictReader y DictWriter

Las listas están bien, pero los campos con nombre te quitan el preguntar qué significaba `row[0]`. Los dicts nombran las columnas una vez, en la cabecera:

```python
import csv

# DictReader — las filas se vuelven dicts con las claves de la cabecera
with open("data.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['Name']}: {row['Score']}")

# DictWriter — escribir desde dicts
with open("output.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Name", "Score"])
    writer.writeheader()
    writer.writerow({"Name": "Charlie", "Score": 88})
```

`DictReader` lee la cabecera y convierte cada fila posterior en un dict con sus claves; `DictWriter` hace lo inverso — declara los `fieldnames`, escribe la cabecera y luego se alimenta de dicts cuyos valores caen bajo sus columnas nombradas.

## Pathlib para escribir

La ruta orientada a objetos trabaja ahora en ambas direcciones:

```python
from pathlib import Path

Path("output.txt").write_text("Hello!\n")
content = Path("output.txt").read_text()

# Crear directorios
Path("data/logs").mkdir(parents=True, exist_ok=True)
```

`write_text` comprime escribir-abrir-cerrar en una solo llamada, y `mkdir` con `parents=True` hace crecer árboles de carpetas enteros en un solo comando en lugar de un nivel a la vez.

## Un ejemplo resuelto: la libreta de notas, volcada a CSV

El mapeo va al disco como tabla — encabezado primero, luego una fila por entrada:

```python
import csv

scores = {"Alice": 85, "Bob": 92, "Charlie": 78}

with open("grades.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Score"])
    for name, score in scores.items():
        writer.writerow([name, score])
```

Los `items()` del dict se vuelven las filas; el encabezado nombra las columnas. `newline=""` fija los finales de línea, y el bloque `with` vacía y cierra el archivo al terminar.

## Errores comunes

- **`"w"` sobrescribe en silencio.** El archivo viejo se fue en el instante en que el modo abre. Si el pasado importa, elige `"a"`.
- **Olvidar `newline=""` en CSV.** En Windows el escritor duplica los finales de línea salvo que fijes `newline=""`; aparecen filas vacías entre los datos.
- **Saltarse `writeheader()`.** Un `DictWriter` alimentado de dicts no escribe ninguna fila de cabecera salvo que la llames — los lectores pierden sus claves.
- **`writerow` toma una secuencia — y una cadena es una secuencia de caracteres.** `writer.writerow("Alice")` esparce `A,l,i,c,e` en cinco celdas. Envuelve el valor en una lista cuando el campo es una sola cadena.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Escribe una función que tome una lista de números y los escriba a un archivo, uno por línea.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>with open("nums.txt", "w") as f: for n in nums: f.write(f"{n}\n")</code> — una cadena por número, cada una con su propio salto de línea.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Lee un CSV de notas de estudiantes e imprime el promedio.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>import csv; with open("grades.csv") as f: rows = list(csv.DictReader(f)); avg = sum(int(r["Score"]) for r in rows) / len(rows); print(f"Average: {avg:.1f}")</code></p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué la escritura CSV necesita `newline=""` en Windows pero no en Linux? ¿Qué sucede bajo el capó?
- ¿Dónde yace la diferencia entre `csv.writer` y `csv.DictWriter` — y cuándo alcanzas cada uno?
- Si el CSV se abrirá en Excel, ¿qué precauciones extra deberías tomar?

## ✅ Comprobación rápida

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
    <p class="quiz-q__prompt">2. ¿Qué usa <code>csv.DictReader</code> como claves de diccionario?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">La primera fila (cabeceras)</button>
      <button class="quiz-q__opt" data-idx="1">Índices de columna (0, 1, 2...)</button>
      <button class="quiz-q__opt" data-idx="2">Nombres autogenerados</button>
      <button class="quiz-q__opt" data-idx="3">La última fila</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>