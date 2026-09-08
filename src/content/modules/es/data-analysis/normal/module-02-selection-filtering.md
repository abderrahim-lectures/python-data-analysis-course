---
title: "Selección, Filtrado e Indexación"
description: "Extrae los datos que necesitas: selecciona columnas, filtra filas con condiciones booleanas y usa loc/iloc para acceso preciso."
order: 2
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "selection", "filtering", "indexing"]
prerequisites: ["module-01-series-dataframe"]
icon: "🔍"
---

## Por qué importa

Cargar datos en un DataFrame es solo el comienzo. En cualquier análisis real, trabajas con un subconjunto: clientes de un rango de edad específico, transacciones por encima de un monto determinado, registros de una fecha particular. Sin pandas, extraer estos subconjuntos significa escribir bucles con verificaciones condicionales, añadir manualmente las filas coincidentes a una lista nueva y rezar para no haber introducido un desfase de índices. Con 100 000 filas, ese enfoque no solo es lento — es propenso a errores. Pandas te da indexación booleana, `loc` e `iloc` para que las selecciones complejas se conviertan en expresiones simples y legibles. "Dame todas las filas donde `age > 30` Y `salary < 50000`" es una línea. "Dame las primeras 100 filas y las columnas 2 a la 5" es otra. Estas operaciones son el puente entre los datos crudos y los subconjuntos enfocados que impulsan cada análisis.

La razón más profunda: el análisis de datos es una conversación iterativa con tu conjunto de datos. Lo cargas, miras unas filas, te haces una pregunta, filtras a las filas relevantes, calculas algo y luego refinas tu pregunta. Cada paso de refinamiento requiere selección. Si la selección es torpe, la conversación se estanca. Si es fluida, exploras más rápido y encuentras insights más rápido. Este módulo hace fluida la selección. Aprenderás a seleccionar columnas por nombre, filtrar filas con condiciones booleanas compuestas y usar `loc` e `iloc` para acceso preciso basado en etiquetas y en posiciones. Al final, navegarás un DataFrame con la misma naturalidad con que navegas una hoja de cálculo — pero con el poder de la lógica programática detrás de cada clic.

## Qué aprenderás

- Selecciona columnas individuales (devuelve una Series) y múltiples (devuelve un DataFrame) con la notación de corchetes
- Construye máscaras booleanas con operadores de comparación (`>`, `<`, `==`, `!=`) y combínalas con `&`, `|`, `~`
- Usa `loc` para selección de filas y columnas por etiqueta, incluida la notación de rebanadas con extremos inclusivos
- Usa `iloc` para selección por posición entera, independiente de las etiquetas del índice
- Encadena operaciones de selección y filtrado para construir extracciones de datos precisas paso a paso
- Comprende la diferencia entre devolver una copia vs. una vista y por qué importa `SettingWithCopyWarning`

## La derivación

Considera el problema: tienes un DataFrame con 50 000 filas y necesitas las filas donde la columna `status` es igual a `"active"`. El método contundente es un bucle for: iterar sobre cada fila, verificar la condición y añadir las filas coincidentes a una lista nueva. Son 50 000 iteraciones en Python — lento, verboso y difícil de leer. La indexación booleana de pandas resuelve esto permitiéndote expresar la condición una sola vez: `df[df['status'] == 'active']`. Internamente, pandas crea una Series booleana (True/False para cada fila) y la usa para seleccionar las filas donde el valor es True. Esto está vectorizado — la comparación corre en código C compilado, no en un bucle de Python — así que es varios órdenes de magnitud más rápido.

Pero ¿qué pasa si necesitas las filas donde `status == "active"` Y `age > 30`? La indexación booleana se extiende naturalmente: combina condiciones con `&` (y) u `|` (o), y envuelve cada condición entre paréntesis por la precedencia de operadores de Python: `df[(df['status'] == 'active') & (df['age'] > 30)]`. Ahora, ¿y si necesitas también columnas específicas? Ahí entran `loc` e `iloc`. `loc` usa acceso por etiqueta: `df.loc[df['age'] > 30, ['name', 'salary']]` te da las columnas `name` y `salary` para todas las filas donde la edad supera 30. Los extremos de la rebanada son inclusivos — `df.loc[0:5]` incluye la fila 5. `iloc` usa posiciones enteras: `df.iloc[0:5, 1:3]` te da las primeras 5 filas y las columnas en las posiciones 1 y 2 (exclusiva de la 3). La clave: `loc` piensa en etiquetas, `iloc` piensa en posiciones. Confundirlos es el error más común de pandas. Este módulo practica ambos hasta que la distinción sea automática.

## Gamificación

- **Recompensa de XP**: +100 XP por lección completada (200 XP en total para este módulo)
- **Desafíos**: Filtra un conjunto de datos de ventas para encontrar todas las transacciones superiores a $1 000 en la categoría Electrónica; usa `loc` para seleccionar filas y columnas específicas de un DataFrame de calificaciones de estudiantes; combina tres condiciones booleanas para aislar un segmento de nicho
- **Progreso**: Completa ambas lecciones para desbloquear el Módulo 03 (Limpieza de Datos)
- **Bono de racha**: Completa este módulo inmediatamente después del Módulo 01 para un bono de racha de +10 XP
- **Desafío de velocidad**: Dado un DataFrame de 10 000 filas, escribe un filtro de una sola línea que devuelva las filas que cumplen tres condiciones — hazlo en menos de 60 segundos

## Proyectos que puedes construir

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 📊 **Segmentación de clientes** — filtra clientes por edad, gasto y fecha de registro para construir segmentos dirigidos
- 🐼 **Analizador de logs** — selecciona niveles de log específicos (ERROR, WARNING) y ventanas de tiempo de los logs del servidor
- 🕷️ **Filtro de scrapeo de empleos** — extrae ofertas de empleo y filtra por rango salarial, ubicación y estado remoto
- 📈 **Filtro de acciones** — selecciona acciones que cumplan múltiples criterios financieros (ratio P/E, capitalización de mercado, volumen)
- 💰 **Filtro de presupuesto** — filtra transacciones por categoría, rango de montos y fecha para encontrar anomalías de gasto

## Lecciones

1. Seleccionando Columnas — Extrae columnas individuales o múltiples por nombre con la notación de corchetes
2. Filtrando Filas — Usa condiciones booleanas, expresiones compuestas, loc e iloc para conservar solo las filas que necesitas