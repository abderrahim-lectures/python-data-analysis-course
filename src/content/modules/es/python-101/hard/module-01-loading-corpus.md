---
title: "Carga de un corpus de texto"
description: "Carga, inspecciona y comprende la estructura de un corpus de texto almacenado en CSV, la materia prima para nuestro modelo de lenguaje diminuto."
order: 1
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 1.5
lessonCount: 2
tags: ["csv", "corpus", "carga-de-datos", "nlp", "generación-de-texto"]
prerequisites: []
icon: "📚"
---

## Por qué es importante

Todo modelo de lenguaje, desde el autocompletado de tu teléfono hasta ChatGPT, fue entrenado con un corpus: una gran colección de texto. Antes de que cualquier modelo pueda aprender patrones, predecir la siguiente palabra o generar poesía, alguien tiene que cargar ese texto en un programa. Este es el paso cero de todo procesamiento de lenguaje natural, y es donde la mayoría de principiantes se atascan.

Imagina que tienes un archivo CSV con miles de oraciones en inglés. Quieres alimentar esas oraciones a un programa de Python para que pueda aprender patrones del lenguaje. Pero un archivo CSV es solo bytes en disco, una corriente de caracteres separados por comas. Python necesita abrirlo, analizarlo y darte el texto en una forma utilizable. Si alguna vez intentaste cargar un conjunto de datos y obtuviste un `FileNotFoundError`, un `csv.Error` o una cadena confusa de caracteres Unicode, has sentido el dolor de este paso. Hacerlo bien no es negociable.

En este módulo cargarás un corpus pequeño en inglés (`slm-corpus.csv`) que viene con el curso. Al final, comprenderás el análisis CSV, cómo extraer texto crudo de filas estructuradas y cómo se ve un "corpus" cuando lo abres. Esta es la base sobre la que se construye todo lo demás en esta pista: la tokenización, las tablas de bigramas y, en última instancia, tu generador de texto, todos empiezan aquí.

## Lo que aprenderás

- Cargar un archivo CSV con `csv.reader` y `csv.DictReader` y comprender la diferencia entre ellos
- Inspeccionar la forma, los nombres de las columnas y filas de muestra de un conjunto de datos
- Extraer texto crudo de las filas del corpus y concatenarlo en una sola cadena
- Comprender qué es un corpus de texto y por qué el CSV es un formato de almacenamiento práctico para datos de entrenamiento
- Depurar errores comunes de carga de archivos: problemas de codificación, errores de ruta y filas malformadas

## El razonamiento

**El problema:** tienes un archivo lleno de texto y quieres trabajar con él en Python. ¿Por dónde empiezas?

**El enfoque ingenuo:** podrías intentar `open("data.csv").read()`, y a veces eso funciona. Pero para datos estructurados como el CSV, rápidamente encontrarás problemas. Las comas dentro de campos con comillas rompen la división ingenua. Diferentes sistemas operativos usan diferentes finales de línea. Algunos CSV tienen encabezados, otros no. Codificar divisiones de cadenas es frágil y falla en cuanto los datos cambian de forma.

**La solución:** el módulo `csv` integrado de Python maneja todo esto. Comprende las reglas de comillas, el manejo de delimitadores y los finales de línea en todas las plataformas. Puedes usar `csv.reader` para filas crudas (listas de cadenas) o `csv.DictReader` para columnas con nombre (dicts con claves de encabezado). La elección importa: `DictReader` es más legible cuando conoces los nombres de las columnas, mientras que `csv.reader` te da acceso posicional.

**Cómo funciona:** cuando llamas a `csv.DictReader(open("file.csv"))`, el módulo lee la primera fila como encabezados y produce cada fila posterior como un `OrderedDict` con claves de esos encabezados. Puedes iterar a través de él como cualquier iterador de Python, es eficiente en memoria porque no carga todo el archivo de una vez. Para un corpus, típicamente extraerás una columna (el texto) y concatenarás todas las filas en una sola cadena larga. Esa cadena se convierte en la entrada para la tokenización en el siguiente módulo.

## Gamificación

- **Recompensa de XP**: +60 XP por lección completada (120 XP en total para este módulo)
- **Retos**: cada lección tiene retos interactivos, carga un CSV, inspecciona su estructura, extrae y verifica el contenido de texto
- **Progreso**: completa ambas lecciones para terminar este módulo
- **Bono de racha**: +15 XP extra por día cuando tu racha supera los 3 días
- **Hito de PBL**: este es el punto de partida del pipeline completo del generador de texto, Módulo 1 de 5 hacia tu proyecto final

## Proyectos que puedes crear

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 🤖 **Escritor de historias IA**, necesita la carga del corpus como primer paso en cualquier pipeline de generación de texto
- 📰 **Creador de boletines**, carga datos de artículos desde CSV para generar contenido automáticamente
- 🔍 **Motor de búsqueda semántica**, la carga del corpus es el prerrequisito para construir índices de búsqueda
- 📊 **Panel de análisis de texto**, carga e inspecciona datos de texto antes del análisis
- 🗞️ **Analizador de sentimiento**, carga datos de texto etiquetados para entrenar un clasificador de sentimiento

## Lecciones

1. **Carga del corpus CSV**, abre, analiza y verifica la estructura de `slm-corpus.csv`
2. **Explorando el corpus**, calcula recuentos de filas, nombres de columnas y previsualiza texto de muestra