---
title: "Fundamentos de Series y DataFrame"
description: "Estructuras de datos centrales de pandas: crear Series a partir de listas y diccionarios, construir DataFrames, leer archivos CSV e inspeccionar tus datos."
order: 1
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "series", "dataframe", "csv"]
prerequisites: ["module-01-python-basics"]
icon: "📊"
---

## Por qué importa

Todo proyecto de análisis de datos comienza con una pregunta simple: ¿cómo guardo mis datos para poder trabajar con ellos? Podrías almacenar números en listas de Python, nombres en variables separadas y columnas en diccionarios, pero en el momento en que necesites combinarlos, filtrarlos o calcular estadísticas, estarás escribiendo bucles frágiles e ilegibles. Imagina una hoja de cálculo con 10 000 filas de transacciones de ventas. Necesitas calcular los ingresos totales por región, encontrar los 5 clientes principales y detectar tendencias a lo largo del tiempo. Hacerlo con Python puro exigiría bucles anidados, seguimiento manual de índices y decenas de líneas fáciles de romper. Pandas resuelve esto ofreciéndote dos estructuras fundacionales, Series y DataFrame, que envuelven tus datos en contenedores etiquetados, indexados y vectorizados. Una línea de `df.groupby('region')['revenue'].sum()` reemplaza cincuenta líneas de trabajo manual.

La verdadera potencia es que estas estructuras no son solo envoltorios convenientes. Están diseñadas para reflejar cómo los humanos piensan realmente sobre los datos. Una Series es una columna única con nombre e índice, como una lista donde cada elemento tiene una etiqueta. Un DataFrame es una tabla donde cada columna es una Series, cada fila tiene un índice, y las operaciones se propagan automáticamente por toda la estructura. Cuando cargas un archivo CSV con `pd.read_csv()`, obtienes un DataFrame al instante: los nombres de las columnas se convierten en claves, las filas en entradas indexadas, y cada operación, filtrar, ordenar, agrupar, se expresa en una línea legible. Este módulo construye el modelo mental que hace que todo lo demás en pandas se sienta natural.

## Qué aprenderás

- Qué es una Series y cómo crear una a partir de una lista, un diccionario o un valor escalar
- Cómo funciona la indexación en las Series y por qué los índices etiquetados importan para la alineación y la búsqueda
- Qué es un DataFrame y cómo construir uno a partir de diccionarios, listas de diccionarios o arreglos de NumPy
- Cómo leer archivos CSV en DataFrames con `pd.read_csv()` y manejar problemas comunes de importación como encabezados, dtypes y codificación
- Métodos esenciales de inspección: `head()`, `tail()`, `info()`, `describe()`, `shape`, `columns` y `dtypes`
- La relación entre Series y DataFrame, cómo un DataFrame es solo un diccionario de Series alineadas

## La derivación

Comienza con el problema: tienes datos y quieres analizarlos. El enfoque ingenuo es almacenar cada columna como una lista separada de Python. Eso funciona hasta que necesitas filtrar filas según una condición de una columna mientras conservas los valores de otra. Ahora estás rastreando índices manualmente entre listas, una receta para errores de desfase. Pandas introduce las Series para resolverlo. Una Series es un arreglo unidimensional etiquetado. Le das una lista de valores y un índice, las etiquetas que identifican cada elemento. Cuando creas una Series a partir de un diccionario, las claves se convierten automáticamente en el índice. Esto significa que `series['Alice']` recupera el valor de Alice, igual que un diccionario pero con matemática vectorizada: `series * 2` duplica todos los elementos a la vez.

Ahora imagina que tienes diez Series, una por columna de una tabla. Necesitas todas alineadas por el mismo índice. Eso es exactamente lo que es un DataFrame: una colección de Series que comparten un índice común. Puedes crear uno pasando un diccionario cuyas claves son nombres de columnas y cuyos valores son listas (o Series). La alineación de índices hace que las operaciones del DataFrame mantengan las filas coherentes automáticamente. Cuando lees un CSV, pandas hace esa alineación por ti: analiza cada columna, asigna un índice numérico (0, 1, 2, ...) y te entrega un DataFrame donde cada celda es accesible por etiqueta de fila y nombre de columna. El método `info()` te muestra la forma y los tipos de tus datos. `describe()` te da un resumen estadístico. `head()` muestra las primeras filas para que puedas verificar la estructura de un vistazo. Estas herramientas de inspección no son opcionales, son cómo verificas que los datos se cargaron correctamente antes de empezar a analizar.

## Gamificación

- **Recompensa de XP**: +60 XP por lección completada (120 XP en total para este módulo)
- **Desafíos**: Cada lección incluye ejercicios prácticos, construye una Series a partir de un diccionario y calcula su media, carga un CSV e informa su forma y tipos de columna, crea un DataFrame manualmente e inspecciónalo con `info()`
- **Progreso**: completa ambas lecciones para terminar este módulo
- **Bono de racha**: +15 XP extra por día cuando tu racha supera los 3 días
- **Hito del capstone**: Al final, verifica que puedas cargar cualquier archivo CSV, inspeccionarlo y describir en lenguaje simple qué contiene cada columna

## Proyectos que puedes construir

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 📊 **Panel de ventas**, carga un CSV de ventas, inspecciona su estructura y calcula estadísticas resumidas por región
- 🐼 **Inspector de CSV**, construye una utilidad que lea cualquier CSV e imprima un perfil de datos formateado (tipos, conteos de faltantes, estadísticas básicas)
- 🕷️ **Extraer y cargar**, extrae una tabla de la web y cárgala en un DataFrame para su análisis
- 📈 **Registro meteorológico**, lee registros climáticos diarios en un DataFrame y calcula promedios mensuales
- 💰 **Rastreador de gastos**, importa CSV de transacciones bancarias e inspecciona la estructura antes de limpiar

## Lecciones

1. Creando Series, Construye arreglos unidimensionales etiquetados a partir de listas, diccionarios y escalares
2. Creando DataFrames, Datos tabulares a partir de diccionarios, listas de diccionarios y archivos CSV con `pd.read_csv()`