---
title: "Semana 5: Trabajando con Archivos CSV"
sidebar_position: 5
section: python-101
track: normal
week: 5
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# Semana 5: Leer y Escribir Archivos CSV

<span className="gamified-flourish">📊 Todo lo que aprendiste este mes construía hacia una sola cosa: los datos reales viven en archivos, no en código que escribiste a mano.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Abrir y cerrar un archivo de forma segura con `with`, y explicar por qué eso importa.
- Leer las filas de un archivo CSV en Python usando el módulo incorporado `csv`, tanto como listas como diccionarios.
- Escribir tanto filas simples como filas con forma de diccionario de vuelta a un nuevo archivo CSV.
- Combinar listas, diccionarios, bucles y funciones para resumir un conjunto de datos real.
- Escribir un pequeño miniproyecto de principio a fin, sin ayuda, usando solo lo que aprendiste en las Semanas 1 a 4.

## Lección

### Abrir archivos de forma segura con `with`

Antes de tocar CSV específicamente, una nueva pieza de sintaxis: `with open(...) as f:` abre un archivo, te entrega un manejador (handle) hacia él como `f`, y lo cierra automáticamente en cuanto termina el bloque indentado — incluso si ocurre un error a mitad de camino. Esto importa porque un archivo sin cerrar puede perder escrituras almacenadas en búfer o bloquear el archivo para otros programas. La alternativa, `f = open(...)` seguido de un `f.close()` manual al final, es fácil de olvidar (especialmente si un error provoca una salida anticipada); `with` hace que "siempre cerrarlo" sea lo predeterminado, algo que no tienes que recordar.

### CSV: filas de valores separados por comas

Un archivo CSV (comma-separated values, valores separados por comas) es una tabla de texto plano — una línea por fila, valores separados por comas. El conjunto de datos de esta semana, [`students-normal.csv`](pathname:///datasets/students-normal.csv), tiene una fila de encabezado (`name,quiz1,quiz2,quiz3`) seguida de una fila por estudiante.

:::tip[Usar este archivo en el playground de Trinket]
El playground de Trinket del FAB es un editor de terceros en un entorno aislado (sandbox) — no puede acceder directamente a los archivos de este sitio. Abre el enlace del conjunto de datos de arriba, copia su contenido, y luego en Trinket crea un archivo nuevo llamado `students.csv` (usa el botón "+" del árbol de archivos) y pega el contenido ahí. Tus llamadas a `open("students.csv")` lo encontrarán entonces.
:::

```python
import csv

with open("students.csv", newline="") as f:
    reader = csv.reader(f)
    header = next(reader)          # primera fila: nombres de columnas
    for row in reader:
        print(row)                  # cada fila es una lista de strings
```

Todo valor leído de esta forma es un `str` — un número como `"87"` en el archivo llega como el string `"87"`, no como el int `87`. Debes convertirlo tú mismo, exactamente igual que con `input()` en la Semana 1. `next(reader)` extrae solo la primera fila (el encabezado) del reader antes de que empiece el bucle `for`, de modo que el bucle en sí solo ve las filas de datos reales. El argumento `newline=""` evita que el manejo propio de finales de línea del módulo `csv` choque con el de Python — es código repetitivo (boilerplate) que siempre deberías incluir al abrir un archivo para `csv.reader`/`csv.writer`, aunque explicar exactamente por qué es un nivel de detalle fuera del alcance de esta semana.

### `csv.DictReader`: filas como diccionarios

En lugar de rastrear las posiciones de columna por índice, `csv.DictReader` te entrega cada fila como un `dict` indexado por los nombres del encabezado — esta suele ser la opción más legible, y lee automáticamente la fila de encabezado por ti (no hace falta un `next(reader)` manual):

```python
with open("students.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["name"]
        score = int(row["quiz1"])   # sigue siendo un str hasta que lo conviertas
        print(name, score)
```

Compara esto con `csv.reader`: con `csv.reader`, `row[1]` significa "lo que sea que haya en la columna 1" — frágil si el orden de las columnas cambia alguna vez. Con `csv.DictReader`, `row["quiz1"]` dice exactamente lo que quieres decir sin importar el orden de las columnas, al pequeño costo de una búsqueda en diccionario en lugar de un índice de lista.

### Escribir archivos CSV

`csv.writer` y `csv.DictWriter` son la imagen especular de `csv.reader`/`csv.DictReader` — útiles para guardar un resumen que calculaste de vuelta en un archivo:

```python
with open("summary.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "average"])
    writer.writerow(["Amina", 91.5])
```

El `"w"` (modo escritura) es importante — `open("summary.csv", "w")` crea el archivo si no existe, y **lo sobrescribe por completo** si ya existe. `csv.DictWriter` refleja a `DictReader`: escribes diccionarios en lugar de listas simples, y necesita conocer los nombres de columna (`fieldnames`) de antemano para saber en qué orden escribirlos y poder producir una fila de encabezado correspondiente:

```python
with open("summary.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "average"])
    writer.writeheader()                              # escribe la fila de encabezado
    writer.writerow({"name": "Amina", "average": 91.5})
    writer.writerow({"name": "Youssef", "average": 74.3})
```

`DictWriter` es la contraparte natural si construiste tu resumen como una lista de diccionarios (la forma "anidar colecciones" de la Semana 3) en lugar de un diccionario simple de nombre → promedio.

### Juntándolo todo: un miniproyecto

El proyecto de esta semana combina todo lo de las Semanas 1 a 4: leer un CSV de calificaciones de estudiantes, calcular promedios por estudiante con una función, guardarlos en un `dict`, e imprimir un resumen ordenado de mayor a menor — usando `sorted()` con una función `key`, que a su vez toma una función como argumento, exactamente igual que `compose` de la pregunta socrática de la semana pasada:

```python
def average(scores):
    return sum(scores) / len(scores)

averages = {}   # name -> average
with open("students.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["name"]
        scores = [int(row["quiz1"]), int(row["quiz2"]), int(row["quiz3"])]
        averages[name] = average(scores)

for name in sorted(averages, key=lambda n: averages[n], reverse=True):
    print(name, round(averages[name], 1))
```

`lambda n: averages[n]` es una función pequeña, sin nombre — léela como "la regla que asocia un nombre con su promedio", usada solo para decirle a `sorted()` según qué ordenar. Una `lambda` es exactamente equivalente a un `def` pequeño (`lambda n: averages[n]` se comporta igual que una función de una línea `def key_fn(n): return averages[n]`); existe puramente para que no necesites nombrar y definir una función separada solo para entregarle a `sorted()` una regla simple y desechable.

## ⚠️ Errores comunes

- **Olvidar `newline=""`.** Sin esto, `csv.writer` puede insertar líneas en blanco adicionales entre filas en algunos sistemas (notablemente Windows) — inclúyelo siempre al leer o escribir CSVs.
- **Abrir en modo `"w"` por accidente cuando querías agregar datos.** `open("summary.csv", "w")` borra primero el contenido existente del archivo. Si quieres agregar filas a un archivo existente en su lugar, usa el modo `"a"` (append, agregar).
- **Asumir el orden de columnas en `csv.reader`.** `row[0]` solo es "el nombre" si la columna del nombre realmente es la primera *y sigue siendo* la primera — un `DictReader` evita toda esta clase de error.
- **No convertir columnas numéricas antes de hacer cálculos con ellas.** `row["quiz1"] + row["quiz2"]` con `DictReader` concatena dos strings (`"88" + "92"` → `"8892"`), no suma dos números — un eco directo del error de `input()` de la Semana 1.

## 🧩 Retos

<Challenge id="python101-normal-w5-c1" answer={<>Abre el archivo con <code>csv.DictReader</code>, recorre las filas, convierte la columna de calificación con <code>int(...)</code>, y mantén un <code>total</code> y un <code>count</code> corrientes (o usa una lista y <code>sum()</code>/<code>len()</code>) para calcular el promedio de la clase.</>}>

Dado un CSV con columnas `name,score`, escribe un programa que calcule e imprima el promedio de calificación entre *todos* los estudiantes del archivo.

</Challenge>

<Challenge id="python101-normal-w5-c2" answer={<>Recorre las filas del DictReader, mantén un par <code>best_name</code>/<code>best_score</code> corriente, y actualízalos cada vez que veas una calificación más alta — el mismo patrón de "seguir el máximo corriente" que encontrar el máximo de una lista.</>}>

Extiende el programa anterior para que también imprima el nombre del estudiante con la calificación individual *más alta*.

</Challenge>

<Challenge id="python101-normal-w5-c3" answer={<>Usa <code>csv.writer</code>, escribe una fila de encabezado, y luego recorre tu diccionario de promedios escribiendo una fila por estudiante — reflejando el lado de la lectura pero con <code>writerow</code> en lugar de iterar un reader.</>}>

Escribe los promedios por estudiante que calculaste arriba en un archivo nuevo `summary.csv` con columnas `name,average`.

</Challenge>

<Challenge id="python101-normal-w5-c4" answer={<>Envuelve la conversión con int(...) para que un valor faltante/en blanco se omita o se le asigne un valor por defecto (por ejemplo, tratarlo como 0, o excluir ese quiz del promedio) en lugar de hacer que todo el programa se caiga — esta es exactamente el tipo de situación para la que está diseñado try/except (el bono de esta semana).</>}>

¿Qué ocurriría si una fila del CSV tuviera una calificación faltante (un string vacío en lugar de un número)? Modifica tu programa para que no se caiga en esa fila.

</Challenge>

<Challenge id="python101-normal-w5-c5" answer={<>Reescribe el paso de escritura usando <code>csv.DictWriter</code> con <code>fieldnames=["name", "average"]</code>, llama a <code>writer.writeheader()</code> una vez, y luego <code>writer.writerow(...)</code> con un diccionario por estudiante dentro del bucle, en lugar de las filas de lista simples de <code>csv.writer</code>.</>}>

Rehaz el Reto 3 usando `csv.DictWriter` en lugar de `csv.writer`. ¿Qué versión te parece más fácil de leer, y por qué?

</Challenge>

<Challenge id="python101-normal-w5-c6" answer={<>Usa el modo "a" (append, agregar) en lugar de "w": with open("summary.csv", "a", newline="") as f — esto añade filas nuevas después de lo que ya contiene el archivo, en lugar de borrarlo primero. Ten en cuenta que solo llamarías a writer.writeheader() la primera vez que se crea el archivo, no en cada agregado.</>}>

Si quisieras añadir la fila de un estudiante más a `summary.csv` *sin* borrar lo que ya hay, ¿qué modo de archivo usarías en lugar de `"w"`? Pruébalo.

</Challenge>

## 🤔 Preguntas socráticas

- ¿Por qué todo lo que se lee de un CSV llega como un `str`, incluso las columnas que parecen numéricas? ¿Dónde más en este curso has visto este mismo patrón de "entra como texto, se requiere conversión"?
- `sorted(averages, key=lambda n: averages[n], reverse=True)` — ¿qué cambiaría si quitaras `reverse=True`? ¿Qué cambiaría si quitaras `key=...` por completo y simplemente escribieras `sorted(averages)`?
- Ahora has construido una pequeña canalización (pipeline): leer → transformar → resumir → escribir. ¿De qué conceptos de las Semanas 1 a 4 dependía realmente cada etapa? ¿Sin el material de qué semana habría sido imposible este proyecto?
- `with open(...) as f:` cierra automáticamente el archivo incluso si ocurre un error dentro del bloque. ¿Se te ocurre una razón por la que un programa que abre muchos archivos a lo largo de su vida, sin cerrarlos nunca correctamente, podría eventualmente empezar a fallar de formas extrañas?
- `csv.DictWriter` necesita `fieldnames` especificado de antemano, antes de escribir nada. ¿Por qué crees que lo exige, en lugar de simplemente deducir las columnas a partir del primer diccionario que le pases con `writerow`?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="python-101-normal-week-5"
  questions={[
    {
      id: 'q1',
      prompt: '¿Qué tipo tiene todo valor leído de un archivo CSV con el módulo csv, antes de convertirlo?',
      options: ['int', 'float', 'str', 'Depende de la columna'],
      correctOptionIndex: 2,
    },
    {
      id: 'q2',
      prompt: '¿Qué te entrega csv.DictReader para cada fila, comparado con csv.reader?',
      options: [
        'Una lista de strings, igual que csv.reader',
        'Un dict indexado por los nombres de columna del encabezado',
        'Una tupla de ints',
        'Un único string con toda la fila',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'En sorted(names, key=lambda n: averages[n]), ¿para qué sirve el argumento key?',
      options: [
        'Filtra algunos nombres',
        'Le dice a sorted() según qué valor ordenar cada elemento',
        'Convierte los nombres a números de forma permanente',
        'Invierte el orden',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: "¿Qué módulo de la biblioteca estándar de Python se usó esta semana para leer/escribir archivos CSV?",
      options: ['json', 'os', 'csv', 'io'],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'Abrir un archivo con open("data.csv", "w") cuando el archivo ya existe:',
      options: [
        'Se niega a abrir, lanzando un error',
        'Agrega contenido nuevo al final',
        'Sobrescribe por completo el contenido existente',
        'Lo abre en modo de solo lectura',
      ],
      correctOptionIndex: 2,
    },
  ]}
/>

## 🎁 Bono: una primera probada de las clases

<BonusContent weekId="python-101-normal-week-5">

Cada estudiante esta semana era una colección suelta de valores separados — un nombre en un diccionario, una lista de calificaciones en otro. Una `class` te permite agrupar datos y comportamiento relacionados en un solo objeto:

```python
class Student:
    def __init__(self, name, scores):
        self.name = name
        self.scores = scores

    def average(self):
        return sum(self.scores) / len(self.scores)

amina = Student("Amina", [88, 92, 79])
print(amina.average())   # 86.33...
```

`__init__` se ejecuta cuando creas un `Student(...)`; `self` se refiere a *este estudiante en particular*. Esto no forma parte del currículo principal —todo en las Semanas 1 a 5 fue deliberadamente resoluble con solo funciones, listas y diccionarios— pero las clases se vuelven genuinamente útiles una vez que un programa tiene muchas piezas relacionadas de estado y comportamiento que viajan juntas, algo que empezarás a sentir en los proyectos más grandes de la sección de **Análisis de Datos**. Intenta reescribir el miniproyecto de esta semana para que cada estudiante sea un objeto `Student` en lugar de un diccionario indexado por nombre.

</BonusContent>

<ProgressCheckbox weekId="python-101-normal-week-5" />
