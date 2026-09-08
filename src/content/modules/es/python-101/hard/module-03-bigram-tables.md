---
title: "Tablas de probabilidad de bigramas"
description: "Construye y normaliza tablas de recuentos de bigramas que mapean cada palabra a las palabras que la siguen."
order: 3
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2
lessonCount: 2
tags: ["bigramas", "probabilidad", "dict-anidado", "condicional", "nlp"]
prerequisites: ["module-02-tokenization-frequency"]
icon: "🔗"
---

## Por qué es importante

Un modelo de unigramas solo cuenta frecuencias de palabras — "the" aparece 100 veces, "cat" aparece 5 veces. Pero esto no nos dice nada sobre el ORDEN de las palabras. Si sabes que "the" aparece con frecuencia, eso es útil, pero no te dice qué viene DESPUÉS de "the". Los bigramas capturan transiciones: ¿qué palabra sigue a "the"? Esta es la base de todos los modelos de lenguaje secuenciales.

Piensa en cómo lees esta oración: no procesas cada palabra de forma aislada. Tu cerebro predice qué viene a continuación según lo que acabas de leer. Después de ver "the", esperas un sustantivo — "cat", "dog", "house". Después de "I love", esperas un objeto. Los bigramas formalizan esta intuición: cuentan cuán a menudo la palabra B sigue a la palabra A en todo el corpus. De estos recuentos derivas probabilidades — "dado que la palabra actual es 'the', hay un 40% de probabilidad de que la siguiente palabra sea 'cat', un 20% de que sea 'dog', y así sucesivamente".

Este es el salto conceptual de contar a predecir. El recuento de frecuencias te dice qué palabras existen. Las tablas de bigramas te dicen cómo se conectan las palabras. Sin esta información de transición, no puedes generar texto coherente — solo estarías extrayendo palabras aleatorias del vocabulario sin importar si tienen sentido juntas. Los bigramas son el modelo más simple que captura las relaciones palabra a palabra, y el mismo principio escala a trigramas, n-gramas e incluso los mecanismos de atención en los transformadores modernos.

## Lo que aprenderás

- Comprender qué captura un modelo de bigramas sobre las secuencias de palabras
- Construir un dict anidado `bigrams = {"the": {"cat": 3, "dog": 1}, ...}` a partir de una lista de tokens
- Normalizar recuentos crudos en probabilidades dividiendo por el total de seguidores por palabra
- Manejar casos límite: palabras que nunca aparecen como seguidoras, corpus de una sola palabra y tokens de fin de secuencia
- Reconocer cómo se relacionan los modelos de bigramas con los modelos de lenguaje n-grama y neuronales más avanzados

## El razonamiento

**El problema:** tienes una lista de tokens y quieres saber qué palabras tienden a seguirse entre sí. Necesitas pasar de una lista plana de palabras a una representación estructurada de las transiciones de palabras.

**El enfoque ingenuo:** podrías iterar a través de la lista de tokens y revisar manualmente cada par: para cada posición `i`, mira `tokens[i]` y `tokens[i+1]`. Cuenta cuántas veces aparece cada par. Esto funciona, pero ¿cómo almacenas el resultado? Una lista de todos los pares explota combinatoriamente. Un diccionario plano con claves de tupla como `("the", "cat"): 3` es difícil de consultar — no puedes preguntar fácilmente "¿cuáles son TODAS las palabras que siguen a 'the'?"

**La solución:** un diccionario anidado. El diccionario externo mapea cada palabra a un diccionario interno. El diccionario interno mapea cada palabra seguidora a su recuento. Así que `bigrams["the"]["cat"]` te da el recuento de cuán a menudo "cat" sigue a "the". Esta estructura es natural para búsquedas condicionales — preguntas "dada la palabra X, ¿cuáles son sus seguidoras?" en tiempo O(1).

**Cómo funciona:** recorre la lista de tokens una vez. Para cada posición `i` de 0 a `len(tokens) - 2`, toma el par `(tokens[i], tokens[i+1])`. Si `tokens[i]` aún no está en el diccionario externo, créalo. Luego incrementa `bigrams[tokens[i]][tokens[i+1]]`. Después de contar, normaliza: para cada palabra, divide cada recuento de seguidores por el recuento total de esa palabra, produciendo una distribución de probabilidad que suma 1.0. Esta tabla normalizada es el motor detrás de la generación de texto — cuando necesitas elegir "la siguiente palabra después de X", muestreas de esta distribución.

## Gamificación

- **Recompensa de XP**: +150 XP por lección (bono de la pista avanzada)
- **Retos**: cada lección tiene retos interactivos — construye tablas de bigramas, normaliza recuentos, verifica las sumas de probabilidad
- **Progreso**: completa ambas lecciones para desbloquear el módulo de generación de texto
- **Bono por racha**: completa este módulo después de los Módulos 1-2 para un bono de +15 XP
- **Hito de PBL**: tu tabla de bigramas es el cerebro del generador de texto que construirás en el Módulo 4

## Proyectos que puedes crear

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 🤖 **Escritor de historias IA** — las tablas de bigramas impulsan la generación de texto palabra por palabra
- 💬 **Creador de chatbots** — las probabilidades de transición ayudan a los chatbots a producir respuestas coherentes
- 📝 **Tutor IA** — el análisis de bigramas identifica patrones gramaticales comunes para la enseñanza
- 🔍 **Motor de búsqueda semántica** — la co-ocurrencia de palabras y las transiciones mejoran la clasificación de relevancia
- 📰 **Creador de boletines** — los modelos de bigramas ayudan a generar resúmenes con sonido natural

## Lecciones

1. **Construyendo tablas de bigramas** — cuenta pares de palabras consecutivas en un diccionario anidado
2. **Normalizando recuentos de bigramas** — convierte recuentos crudos en distribuciones de probabilidad