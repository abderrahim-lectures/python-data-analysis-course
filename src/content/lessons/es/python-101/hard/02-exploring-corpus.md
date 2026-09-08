---

title: "Explorar el corpus"
description: "Calcula el número de filas, los nombres de columnas y obtén una vista previa del texto de muestra para comprender tu dataset antes de procesarlo."
module: "loading-corpus"
order: 2
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Calcular estadísticas básicas: número de filas, número de columnas, longitud en caracteres"
  - "Previsualizar filas de muestra e inspeccionar el contenido del texto"
  - "Comprender qué hace que un corpus sea adecuado para un modelo de lenguaje"
  - "Identificar problemas de calidad de datos: filas vacías, errores de codificación, duplicados"
prerequisites: ["01-csv-loading"]
tags: ["python", "corpus", "exploración-de-datos", "análisis-de-texto"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "¿Cuál es el primer paso al explorar un corpus CSV nuevo?"
    options:
      - text: "Empezar a tokenizar de inmediato"
      - text: "Comprobar nombres de columnas, número de filas y una muestra de los datos"
        correct: true
      - text: "Cargarlo en un DataFrame de pandas"
      - text: "Eliminar las filas con valores faltantes"
  - question: "¿Cómo extraes la columna de texto de un CSV DictReader?"
    options:
      - text: "reader[0]"
      - text: "reader.text"
      - text: "El texto de row para cada fila del reader"
        correct: true
      - text: "reader.get_text()"
  - question: "¿Qué te dice len(list(reader))?"
    options:
      - text: "El número de columnas"
      - text: "El número de filas de datos (excluyendo el encabezado)"
        correct: true
      - text: "El tamaño total del archivo"
      - text: "El número de caracteres"
---
Explora antes de procesar

Cargar datos es el paso uno. El paso dos es comprender lo que cargaste. Un corpus puede tener valores faltantes, filas duplicadas, caracteres codificados que parecen basura, o texto demasiado corto para ser útil. Dedica cinco minutos a explorar ahora y te ahorrarás horas de depuración después.

## Conceptos clave

### Contar filas y columnas

Las estadísticas más simples te dicen mucho. Un corpus con 5 filas no producirá un modelo útil; uno con 50 000 filas puede necesitar una carga por lotes:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Rows:    {len(rows)}")
print(f"Columns: {list(rows[0].keys())}")
```

### Medir la longitud del texto

Los modelos de lenguaje necesitan suficiente texto para aprender patrones. Comprueba la cantidad total de caracteres y la longitud promedio de las filas:

```python
total_chars = sum(len(row["text"]) for row in rows)
avg_len = total_chars / len(rows) if rows else 0

print(f"Total characters: {total_chars:,}")
print(f"Average row length: {avg_len:.0f} characters")
```

Un corpus con un promedio de 10 caracteres por fila es demasiado corto — el modelo no tendrá suficiente contexto para aprender secuencias de palabras.

### Previsualizar texto de muestra

Lee algunas filas para hacerte una idea del contenido. ¿En qué idioma está? ¿Qué temas cubre? ¿El texto está limpio o es ruidoso?

```python
for i, row in enumerate(rows[:5]):
    preview = row["text"][:150].replace("\n", " ")
    print(f"[{i}] {preview}...")
```

### Encontrar duplicados

Las filas duplicadas inflan los recuentos de palabras sin añadir información nueva. Detecta convertiendo las filas a un conjunto:

```python
unique_texts = set(row["text"] for row in rows)
print(f"Unique rows: {len(unique_texts)} / {len(rows)}")

if len(unique_texts) < len(rows):
    print(f"Warning: {len(rows) - len(unique_texts)} duplicate rows found")
```

### Comprobar si hay filas vacías o cortas

Las filas vacías o muy cortas no aportarán bigramas útiles. Fíltralas:

```python
short_rows = [row for row in rows if len(row["text"].split()) < 3]
print(f"Rows with fewer than 3 words: {len(short_rows)}")
```

Una función de resumen del corpus combina todas estas comprobaciones:

```python
def corpus_summary(path):
    import csv
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    texts = [row["text"] for row in rows]
    total_chars = sum(len(t) for t in texts)
    unique = len(set(texts))

    print(f"Rows: {len(rows)}")
    print(f"Unique: {unique}")
    print(f"Total chars: {total_chars:,}")
    print(f"Avg length: {total_chars / len(rows):.0f}")
    print(f"Columns: {list(rows[0].keys())}")
```

## Inténtalo

Ejecuta `corpus_summary("slm-corpus.csv")` y anota:
1. ¿Cuántas filas tiene el corpus?
2. ¿Hay duplicados?
3. ¿La longitud promedio del texto es suficiente para construir bigramas significativos (al menos 20+ palabras por fila)?

## Conclusiones clave

- Explora siempre tus datos antes de procesarlos — comprueba recuentos, longitudes y duplicados
- Las filas cortas o vacías añaden ruido; fíltralas según un recuento mínimo de palabras
- Las filas duplicadas inflan los recuentos de frecuencia sin añadir patrones nuevos
- Una función de resumen rápida ahorra tiempo en todos los proyectos

## Reto de práctica

Escribe una función `corpus_quality(path)` que cargue un CSV y devuelva un dict con estas claves: `"rows"`, `"unique"`, `"total_chars"`, `"avg_length"`, `"min_length"`, `"max_length"`. Úsala para evaluar si `slm-corpus.csv` es adecuado para el modelado de bigramas.

```python
def corpus_quality(path):
    import csv
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    texts = [row["text"] for row in rows]
    lengths = [len(t.split()) for t in texts]

    return {
        "rows": len(rows),
        "unique": len(set(texts)),
        "total_chars": sum(len(t) for t in texts),
        "avg_length": sum(lengths) / len(lengths) if lengths else 0,
        "min_length": min(lengths) if lengths else 0,
        "max_length": max(lengths) if lengths else 0,
    }
```