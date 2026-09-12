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

## El puente hacia el disco

Los programas que solo calculan con lo que el usuario teclea están enjaulados en la memoria. Los archivos abren la puerta: un archivo es una secuencia de líneas, y leerlo es recorrer esa secuencia. El primer paso es `open()`, que devuelve un objeto de archivo pegado a la puerta:

```python
f = open("data.txt", "r")  # modo lectura
content = f.read()
f.close()  # ¡cierra siempre al terminar!
```

`"r"` significa solo lectura. Y la disciplina es pesada: `close()` debe ejecutarse cuando termines, o el manejador se fuga — el archivo queda agarrado mucho después de haber dejado de necesitarlo. Olvidarlo es la primera generación de errores de archivos.

## La instrucción with: cerrar como promesa

`with` hace automático el cierre, incluso cuando un error irrumpe por el medio:

```python
with open("data.txt") as f:
    content = f.read()
# el archivo se cierra aquí
```

El bloque `with` declara un contrato: ábrelo aquí, y se cerrará cuando este bloque termine — de forma normal o por excepción. La vida del manejador queda enmarcada en el bloque, así que no queda nada que olvidar.

## Estrategias de lectura

El mismo archivo, tres apetitos:

```python
# Lee el archivo entero como una cadena
with open("data.txt") as f:
    text = f.read()

# Lee línea por línea (eficiente en memoria para archivos grandes)
with open("data.txt") as f:
    for line in f:
        print(line.rstrip())  # retira el salto de línea final

# Lee todas las líneas en una lista
with open("data.txt") as f:
    lines = f.readlines()  # incluye \n en cada cadena
```

`f.read()` lo toma todo de golpe; `readlines()` lo escinde en una lista; e iterar `for line in f` avanza por el archivo línea a línea, reteniendo solo la línea actual en memoria. Esto último es la receta para un archivo demasiado grande para caber: procesa cada línea y sigue, sin reunir nunca el todo.

## Pathlib: rutas con vocabulario

La concatenación de rutas con `+` se lee como arqueología. `pathlib` te entrega un `Path` cuyos métodos *dicen* lo que hacen:

```python
from pathlib import Path

p = Path("data") / "scores.txt"    # Path('data/scores.txt')
text = p.read_text()               # lee el archivo entero
lines = p.read_text().splitlines() # líneas sin \n

p.exists()   # True/False
p.is_file()  # True/False
p.suffix     # '.txt'
p.stem       # 'scores'
```

La `/` une partes en una ruta como el sistema de archivos une directorios; `exists`, `is_file`, `suffix` y `stem` preguntan qué *es* la ruta. Las rutas se vuelven datos con respuestas, y no cadenas por desmenuzar.

## Codificación: el contrato de las letras

El texto es bytes hasta que una convención lo interpreta. Fija esa convención para portabilidad entre máquinas:

```python
with open("data.txt", encoding="utf-8") as f:
    text = f.read()
```

Sin `encoding`, Python cae al defecto del sistema, que varía por plataforma — el mismo archivo, ilegible en una máquina Windows y limpio en Linux. Declarar `utf-8` hace que los bytes signifiquen las mismas letras en todas partes.

## Un ejemplo resuelto: el archivo de notas, línea a línea

La caminata segura en memoria — acumular sin jamás sostener el archivo completo:

```python
with open("scores.txt", encoding="utf-8") as f:
    total = 0
    count = 0
    for line in f:
        total += int(line.strip())
        count += 1

print(f"Avg: {total / count}")
```

Cada línea se lee, se le pela el salto, se convierte y se suelta antes de que llegue la próxima — el archivo fluye sin juntarse nunca entero. La promesa de `with` cierra el archivo al terminar el bloque, normal o excepcional.

## Errores comunes

- **Olvidar `with`.** Los manejadores se fugan cuando nada los cierra; deja que el bloque posea la vida del archivo.
- **Tragar archivos enormes.** `f.read()` sobre un archivo gigante puede agotar la memoria — itera `for line in f` en su lugar.
- **Ignorar la codificación.** Las letras no ASCII se vuelven jeroglíficos cuando la convención se deja al azar.
- **Rutas codificadas a fuego.** `pathlib.Path` hace que el mismo código camine en todo sistema operativo.
- **Un archivo consumido se lee vacío.** Tras `f.read()`, la posición se sienta al final; una segunda lectura devuelve `''` y `readlines()` devuelve `[]`. Lee una vez, o reabre.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Cuenta las líneas de un archivo sin cargarlo en memoria.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>count = 0; with open("file.txt") as f: for line in f: count += 1</code> o el compacto <code>sum(1 for _ in open("file.txt"))</code> — una línea a la vez, nunca el todo.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

Enumera todos los archivos `.txt` de un directorio con `pathlib`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>list(Path(".").glob("*.txt"))</code> — un único glob recorre por ti los nombres coincidentes.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Incluye `for line in f` el `\n` final? ¿Por qué se ve el bucle como se ve — y cómo retiras el salto de línea?
- ¿Qué ocurre al leer un archivo que no existe? ¿Cómo se las arregla `with` contra la excepción?
- ¿Cuándo vence `f.read()` a iterar línea por línea?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-file-reading">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué hace <code>line.rstrip()</code> en un bucle de archivos?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Quita todos los espacios</button>
      <button class="quiz-q__opt" data-idx="1">Quita el salto de línea final (y los espacios)</button>
      <button class="quiz-q__opt" data-idx="2">Quita el salto de línea inicial</button>
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