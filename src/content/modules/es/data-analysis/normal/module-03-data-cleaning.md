---
title: "Limpieza de Datos"
description: "Arregla el desorden del mundo real: maneja valores faltantes, convierte dtypes, aplica operaciones de cadenas y usa loc/iloc para ediciones dirigidas."
order: 3
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "missing-values", "dtypes", "string-ops"]
prerequisites: ["module-02-selection-filtering"]
icon: "🧹"
---

## Por qué importa

Los datos del mundo real son un desastre. Una columna de encuesta destinada a contener números contiene cadenas `"N/A"`. Una columna de fechas se almacena como objeto en lugar de datetime. Una columna de nombres tiene espacios al inicio y mayúsculas inconsistentes. Un conjunto de datos financiero tiene valores faltantes en el 40% de sus filas. Si intentas calcular la media de una columna que contiene cadenas `"N/A"`, pandas lanza un error o devuelve silenciosamente basura. Los científicos de datos dedican el 60-80% de su tiempo a limpiar datos — no porque la limpieza sea glamorosa, sino porque todo análisis construido sobre datos sucios es incorrecto. Las consecuencias van de vergonzosas (promedios que incluyen literales de cadena) a peligrosas (registros médicos con dosis faltantes). Este módulo te enseña las técnicas centrales de limpieza que convierten importaciones crudas en DataFrames listos para analizar.

La filosofía es simple: no puedes analizar lo que no puedes confiar. Los valores faltantes distorsionan las estadísticas. Los dtypes incorrectos impiden la aritmética de fechas y las operaciones de cadenas. El formato inconsistente rompe las operaciones de agrupación. La limpieza no es una fase separada — es una conversación continua con tus datos. Los cargas, los inspeccionas, encuentras problemas, los arreglas y verificas el arreglo. Pandas te da un kit rico para esto: `isna()` para detectar valores faltantes, `fillna()` y `dropna()` para manejarlos, `astype()` y `pd.to_numeric()` para arreglar tipos, y el accesoor `.str` para limpiar columnas de texto. Combinado con `loc` e `iloc` del módulo anterior, puedes apuntar a celdas específicas para ediciones quirúrgicas. Este módulo te vuelve peligroso — en el buen sentido — para convertir el caos en datos limpios y confiables.

## Qué aprenderás

- Detecta valores faltantes con `isna()`, `isnull()` y sus inversos, y cuéntalos por columna
- Elimina valores faltantes con `dropna()` usando los parámetros `axis`, `thresh` y `subset` para control fino
- Rellena valores faltantes con `fillna()` usando constantes, relleno hacia adelante, relleno hacia atrás y estrategias específicas por columna
- Convierte tipos de columna con `astype()` y convierte de forma segura a numérico con `pd.to_numeric(errors='coerce')`
- Aplica operaciones de limpieza de cadenas con el accesoor `.str`: `strip()`, `lower()`, `replace()`, `contains()`, `split()`
- Usa `loc` e `iloc` para ediciones dirigidas en celdas específicas cuando las operaciones generales son demasiado amplias

## La derivación

Comienza con el problema: un archivo CSV donde la columna `age` contiene tipos mixtos — algunos números, algunas cadenas `"N/A"`, algunas cadenas vacías. Cuando la cargas con `pd.read_csv()`, pandas lee toda la columna con dtype `object` (cadenas). No puedes calcular la media, la mediana ni ninguna estadística. El primer paso es la detección: `df['age'].isna()` devuelve una Series booleana que marca qué celdas son NaN. `df.isna().sum()` te dice exactamente cuántos valores faltantes tiene cada columna. Este paso de diagnóstico es innegociable — necesitas conocer el alcance del problema antes de arreglarlo.

Ahora el arreglo. Eliminar es el instrumento contundente: `df.dropna(subset=['age'])` elimina toda fila donde la edad falte. Eso funciona si los valores faltantes son raros y aleatorios, pero si falta el 40% de tus datos de edad, acabas de perder el 40% de tu conjunto de datos. Rellenar es a menudo mejor: `df['age'].fillna(df['age'].median())` reemplaza las edades faltantes con la mediana — una estimación razonable que no sesga la distribución. Para datos de series de tiempo, el relleno hacia adelante (`method='ffill'`) propaga el último valor conocido hacia adelante, lo cual tiene sentido para métricas acumulativas. Para columnas de texto, `.str.strip()` elimina espacios en blanco, `.str.lower()` normaliza mayúsculas, y `.str.replace()` arregla problemas conocidos como reemplazar `"N/A"` con NaN real para que `isna()` pueda detectarlo. La clave: la limpieza no es una operación sino una secuencia — detectar, decidir, arreglar, verificar. Cada paso informa al siguiente. Este módulo te enseña la secuencia completa para que puedas manejar cualquier conjunto de datos sucio con confianza.

## Gamificación

- **Recompensa de XP**: +100 XP por lección completada (200 XP en total para este módulo)
- **Desafíos**: Limpia un conjunto de datos donde falte el 30% de los valores — elige la estrategia correcta para cada columna; arregla una columna donde las fechas son cadenas y conviértelas a datetime; aplica cinco operaciones de cadenas distintas para normalizar una columna de texto desordenada
- **Progreso**: Completa ambas lecciones para desbloquear el Módulo 04 (GroupBy, Agregación y Fusión)
- **Bono de racha**: Completa este módulo inmediatamente después del Módulo 02 para un bono de racha de +10 XP
- **Maratón de limpieza**: Dado un CSV deliberadamente sucio, identifica todos los problemas y arréglalos en un pipeline reproducible — apunta a menos de 10 líneas de código de limpieza

## Proyectos que puedes construir

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 📊 **Limpiador de encuestas** — construye un pipeline que ingiera respuestas de encuestas desordenadas y produzca un CSV limpio listo para analizar
- 🐼 **Preparación de datos de salud** — limpia registros de pacientes con tipos mixtos, diagnósticos faltantes y formato inconsistente
- 🕷️ **De scrapeo a análisis** — extrae datos web (a menudo tablas HTML sucias) y límpialos para análisis aguas abajo
- 📈 **Normalizador de datos financieros** — normaliza datos de acciones o cripto de múltiples fuentes con formatos diferentes
- 💰 **Categorizador de gastos** — limpia y estandariza descripciones de transacciones bancarias para categorización consistente

## Lecciones

1. loc e iloc — Acceso basado en etiquetas y en posición para ediciones dirigidas en celdas y rangos específicos
2. Manejando Valores Faltantes — Detecta, elimina y rellena valores NaN con estrategias adaptadas al rol de cada columna