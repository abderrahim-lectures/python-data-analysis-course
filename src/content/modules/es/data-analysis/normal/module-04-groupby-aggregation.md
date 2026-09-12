---
title: "GroupBy, Agregación y Fusión"
description: "Dividir-aplicar-combinar con groupby, calcula agregaciones y combina DataFrames con merge, join y concat."
order: 4
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "groupby", "aggregation", "merge", "concat"]
prerequisites: ["module-03-data-cleaning"]
icon: "🔗"
---

## Por qué importa

Una vez que tus datos están limpios, comienza el análisis real, y casi toda pregunta de análisis es en realidad una pregunta de groupby. "¿Cuál es el ingreso promedio por región?" "¿Cuántos clientes se registraron cada mes?" "¿Cuál es la tasa de supervivencia por clase de pasajero?" Cada una exige dividir tus datos en grupos, calcular una estadística para cada grupo y combinar los resultados en un resumen. Sin pandas, escribirías bucles anidados: bucle externo sobre grupos, bucle interno para recolectar valores, y luego calcular la estadística manualmente. Con pandas, `df.groupby('region')['revenue'].mean()` hace todo el dividir-aplicar-combinar en una línea. Pero groupby es solo la mitad de la historia. Los conjuntos de datos reales rara vez vienen en una sola tabla. Tienes datos de clientes en un archivo y transacciones en otro. Cifras de ventas en una hoja y detalles de productos en otra. Fusionar, unir dos DataFrames por una clave compartida, es como reúnes datos relacionados. Juntos, groupby y merge son los caballos de batalla del análisis de datos. Convierten filas crudas en insights y tablas separadas en vistas unificadas.

La motivación más profunda: el análisis de datos trata de comparación. Comparas regiones, períodos de tiempo, segmentos de clientes, condiciones experimentales. Toda comparación exige agrupar. Y todo insight a nivel de grupo debe ponerse de nuevo en contexto, lo que exige fusionar. Un groupby sin merge te da tablas resumen. Un merge sin groupby te da DataFrames anchos y desestructurados. Juntos, te dan el poder de responder preguntas como: "¿Qué categoría de producto tiene la mayor tasa de crecimiento comparada con el trimestre anterior?", una pregunta que exige agrupar por categoría y tiempo, calcular el crecimiento y fusionar el resultado con los metadatos del producto. Este módulo te enseña ambas habilidades y muestra cómo se componen en pipelines analíticos.

## Qué aprenderás

- El paradigma dividir-aplicar-combinar: cómo `groupby()` divide los datos, aplica una función a cada grupo y combina los resultados
- Agregaciones comunes: `mean()`, `sum()`, `count()`, `min()`, `max()`, `std()` y agregaciones personalizadas con `agg()`
- Agrupar por múltiples columnas y calcular agregaciones diferentes por columna
- Fusionar dos DataFrames por una clave compartida con `merge()` usando uniones inner, left, right y outer
- Concatenar DataFrames verticalmente con `concat()` para apilar conjuntos de datos relacionados
- La diferencia entre `merge()` (unión por columnas) y `concat()` (apilado por filas) y cuándo usar cada uno

## La derivación

Comienza con el problema: tienes un DataFrame de ventas con las columnas `region`, `product`, `revenue` y `date`. Quieres el ingreso total por región. El método contundente es recolectar las regiones únicas, recorrer cada una en un bucle, filtrar las filas de esa región y sumar el ingreso. Son O(n * k) operaciones, lento para conjuntos de datos grandes y verboso en código. `groupby()` de pandas resuelve esto con el patrón dividir-aplicar-combinar. Primero, dividir: `df.groupby('region')` crea un objeto GroupBy que internamente particiona el DataFrame en grupos, uno por valor único de región. Segundo, aplicar: cuando llamas `['revenue'].sum()`, pandas aplica la función suma a la columna revenue de cada grupo de forma independiente. Tercero, combinar: los resultados se ensamblan en una nueva Series (o DataFrame) con las claves de grupo como índice. Toda la operación corre en código compilado, sin bucles de Python.

Ahora la segunda mitad: fusionar. Tienes un DataFrame `customers` con `customer_id`, `name` y `region`, y un DataFrame `transactions` con `customer_id`, `amount` y `date`. Quieres el gasto total por nombre de cliente. Necesitas unir estas tablas por `customer_id`. `pd.merge(customers, transactions, on='customer_id', how='inner')` hace esto, empareja las filas donde `customer_id` es igual en ambas tablas. El parámetro `how` controla qué filas sobreviven: `inner` conserva solo las coincidencias, `left` conserva todas las filas de la tabla izquierda (rellenando NaN donde no haya coincidencia), `right` conserva todas de la derecha, y `outer` conserva todo. La concatenación es más simple: `pd.concat([df1, df2])` apila DataFrames verticalmente, útil cuando tienes las mismas columnas en múltiples archivos (por ejemplo, archivos de ventas mensuales). La clave: groupby resume, merge conecta, concat apila. Todo pipeline de datos usa al menos dos de estas tres.

## Gamificación

- **Recompensa de XP**: +60 XP por lección completada (120 XP en total para este módulo)
- **Desafíos**: Calcula el salario promedio por departamento y encuentra cuál tiene el más alto; fusiona una tabla de clientes con una de pedidos y calcula el gasto total por cliente; concatena 12 archivos CSV mensuales en un solo DataFrame anual
- **Progreso**: completa ambas lecciones para terminar este módulo
- **Bono de racha**: +15 XP extra por día cuando tu racha supera los 3 días
- **Prueba de GroupBy**: Dado un conjunto de datos complejo, escribe una sola cadena de groupby → agg → merge que responda una pregunta analítica de varias partes

## Proyectos que puedes construir

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 📊 **Generador de informes de ventas**, agrupa datos de ventas por región y producto, calcula agregaciones y genera un informe resumen
- 🐼 **Consolidador de múltiples archivos**, fusiona tablas de clientes, pedidos y productos en un conjunto de datos de análisis unificado
- 🕷️ **Analítica de comercio electrónico**, extrae múltiples páginas de productos, concatena los resultados y agrupa por categoría para comparar
- 📈 **Agregador de portafolio financiero**, fusiona precios de acciones con datos de tenencias y calcula agregaciones a nivel de portafolio
- 💰 **Pronosticador de ingresos**, agrupa ingresos históricos por mes, calcula tendencias y fusiona con indicadores económicos

## Lecciones

1. Fundamentos de GroupBy, Divide los datos en grupos y calcula agregaciones con dividir-aplicar-combinar
2. Fusionando DataFrames, Combina conjuntos de datos relacionados con merge (uniones) y concat (apilado)