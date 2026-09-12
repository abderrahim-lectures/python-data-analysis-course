---

title: "Cargar el corpus CSV"
description: "Abre, analiza y verifica la estructura de slm-corpus.csv con el módulo csv de Python."
module: "loading-corpus"
order: 1
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Abrir y analizar un archivo CSV con csv.reader y csv.DictReader"
  - "Inspeccionar nombres de columnas, cantidad de filas y tipos de datos en un dataset CSV"
  - "Extraer el texto crudo de las filas del corpus en una sola cadena"
  - "Manejar errores comunes de CSV: codificación, caracteres de nueva línea, valores faltantes"
prerequisites: []
tags: ["python", "csv", "corpus", "carga-de-datos"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "¿Por qué deberías pasar newline al abrir un archivo CSV para el módulo csv?"
    options:
      - text: "Evita que el archivo se lea como binario"
      - text: "Permite que el módulo csv maneje los finales de línea correctamente"
        correct: true
      - text: "Acelera la lectura al omitir el almacenamiento en búfer de líneas"
      - text: "Convierte todo el texto a minúsculas"
  - question: "¿Qué usa csv.DictReader como claves de diccionario para cada fila?"
    options:
      - text: "Índices de columna (0, 1, 2...)"
      - text: "La primera fila de datos"
      - text: "Los valores de la fila de encabezado"
        correct: true
      - text: "Nombres generados automáticamente como field_1, field_2"
  - question: "Dado reader = csv.DictReader(f), ¿qué devuelve next(reader)?"
    options:
      - text: "La fila de encabezado"
      - text: "La primera fila de datos"
        correct: true
      - text: "La última fila de datos"
      - text: "Una tupla con todas las filas"
---
¿Por qué empezar con los datos?

Todo proyecto de aprendizaje de máquina comienza con datos. Para un modelo de lenguaje basado en texto, esos datos son un **corpus**, una colección de texto de la que el modelo aprenderá patrones. Nuestro corpus vive en `slm-corpus.csv`, un pequeño archivo CSV que viene con el curso en `static/datasets/`.

Antes de poder tokenizar, contar o generar nada, necesitas cargar este archivo en Python. Esta lección cubre dos enfoques: `csv.reader` para el acceso crudo y `csv.DictReader` para el acceso consciente del encabezado.

## Conceptos clave

### Abrir un archivo CSV

El módulo `csv` de Python maneja las partes complejas del análisis CSV (campos entre comillas, comas incrustadas, caracteres escapados). Abre siempre los archivos CSV en modo texto y deja que el módulo haga el trabajo:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.reader(f)
    header = next(reader)  # first row = column names
    print(header)  # e.g. ['id', 'text']
```

El argumento `newline=""` es requerido por la documentación del módulo `csv`, sin él, puedes obtener filas en blanco en Windows o una salida con doble espaciado.

### Leer con DictReader

`csv.DictReader` asigna cada fila a un diccionario usando la fila de encabezado como claves. Esto hace que tu código se autodocumente:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["text"])  # access by column name, not index
```

La primera llamada a `next(reader)` es automática, `DictReader` consume la fila de encabezado por sí mismo.

### Extraer el texto completo

Para construir un modelo de lenguaje, necesitas todo el texto concatenado en una sola cadena larga. Así lo recoges:

```python
import csv

texts = []
with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        texts.append(row["text"])

full_text = " ".join(texts)
print(f"Loaded {len(texts)} rows, {len(full_text)} characters")
```

El método `join()` concatena todos los textos de las filas con un separador de espacio, produciendo un bloque continuo de texto.

### Verificar la carga

Comprueba siempre tus datos después de cargarlos. Cuenta las filas, echa un vistazo a algunas muestras y busca problemas evidentes:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Total rows: {len(rows)}")
print(f"Columns: {rows[0].keys()}")
print(f"First row: {rows[0]}")
print(f"Last row:  {rows[-1]}")
```

Si el archivo es grande, evita `list(reader)`, carga todo en memoria. En su lugar, itera y procesa fila por fila.

## Inténtalo

Carga `slm-corpus.csv` e imprime:
1. El número de filas del archivo
2. Los nombres de las columnas
3. El texto de la primera fila

Usa este esqueleto:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Rows: {len(rows)}")
print(f"Columns: {list(rows[0].keys())}")
print(f"Sample: {rows[0]['text'][:200]}")
```

## Conclusiones clave

- Abre siempre los archivos CSV con `newline=""` al usar el módulo `csv`
- `csv.DictReader` te da acceso por claves del encabezado; `csv.reader` te da acceso por índices
- Verifica tu carga: comprueba el número de filas, los nombres de las columnas y observa datos de muestra
- Para archivos grandes, itera fila por fila en lugar de convertir a una lista

## Reto de práctica

Escribe una función `load_corpus(path)` que tome la ruta de un archivo CSV y devuelva una lista de cadenas, una por la columna `text` de cada fila. Maneja el caso de que el archivo no exista imprimiendo un mensaje de error y devolviendo una lista vacía.

```python
def load_corpus(path):
    import csv
    try:
        with open(path, newline="") as f:
            reader = csv.DictReader(f)
            return [row["text"] for row in reader]
    except FileNotFoundError:
        print(f"File not found: {path}")
        return []
```