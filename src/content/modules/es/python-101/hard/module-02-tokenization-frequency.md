---
title: "Tokenización y frecuencia de palabras"
description: "Divide el texto crudo en tokens, cuenta las frecuencias de palabras y construye el vocabulario para nuestro modelo de lenguaje."
order: 2
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2
lessonCount: 2
tags: ["tokenización", "frecuencia-de-palabras", "dict", "vocabulario", "nlp"]
prerequisites: ["module-01-loading-corpus"]
icon: "🔤"
---

## Por qué es importante

Cada vez que usas el autocompletado, le haces una pregunta a Siri o ves responder a un chatbot, hay un modelo de lenguaje detrás. Estos modelos aprenden patrones del texto. Pero las computadoras no leen palabras, leen caracteres. La tokenización es el puente entre el lenguaje humano y la comprensión de la máquina.

Cuando alimentas texto crudo a un modelo sin tokenizarlo primero, el modelo ve "The" y "the" como palabras completamente diferentes. Cuenta "running", "run" y "runs" como tres entradas de vocabulario separadas. Esto fragmenta la señal de aprendizaje e infla el vocabulario innecesariamente. Peor aún, si no manejas la puntuación y el uso de mayúsculas, el modelo piensa que "hello!" y "hello" no están relacionados. Estas decisiones aparentemente pequeñas se propagan por cada cálculo posterior, los recuentos de bigramas, las estimaciones de probabilidad y el texto generado dependen todos de hacer bien la tokenización.

El recuento de frecuencia de palabras es el siguiente paso crítico. Antes de que un modelo de lenguaje pueda predecir qué palabra viene después, necesita saber qué palabras existen y cuán comunes son. Una palabra que aparece 10 000 veces en el corpus es fundamentalmente diferente de una que aparece una vez. Las distribuciones de frecuencia son la primera huella estadística de cualquier texto, te dicen de qué trata el texto, qué vocabulario usa y dónde viven los patrones importantes. Sin este paso, vuelas a ciegas.

## Lo que aprenderás

- Escribir una función `tokenize(text)` que ponga en minúsculas, elimine la puntuación y divida el texto en una lista de tokens de palabras
- Construir una función `word_frequency(tokens)` que cuente las apariciones de cada token usando un dict
- Comprender por qué las decisiones de tokenización (minúsculas, manejo de puntuación) afectan la calidad del modelo aguas abajo
- Calcular estadísticas básicas del corpus: tokens totales, palabras únicas, palabras más/menos frecuentes
- Reconocer las compensaciones entre estrategias de tokenización agresivas y conservadoras

## El razonamiento

**El problema:** tienes una cadena de texto cruda, algo como `"The cat sat on the mat."`, y necesitas dividirla en palabras individuales para poder contarlas y analizarlas.

**El enfoque ingenuo:** podrías dividir por espacios: `"The cat sat on the mat.".split()` → `["The", "cat", "sat", "on", "the", "mat."]`. Esto casi funciona, pero nota: `"The"` ≠ `"the"` (mayúsculas), y `"mat."` incluye un punto (puntuación). Si construyes una tabla de frecuencias a partir de esto, "mat" y "mat." se cuentan como palabras diferentes, y "The" y "the" son entradas separadas. Tu vocabulario está inflado y tus recuentos son incorrectos.

**La solución:** una función `tokenize()` adecuada aplica una secuencia de transformaciones: (1) poner todo en minúsculas para que "The" y "the" colapsen en un solo token, (2) eliminar la puntuación de los bordes de cada palabra, (3) dividir por espacios en blanco para obtener tokens individuales. Esto produce una lista limpia donde cada elemento es una sola palabra normalizada.

**Cómo funciona en la práctica:** la función encadena métodos de cadena de Python, `.lower()` para la normalización de mayúsculas, `.strip(string.punctuation)` para eliminar la puntuación inicial/final, y `.split()` para tokenizar por espacios en blanco. Para el recuento de frecuencia de palabras, iteras a través de la lista de tokens, manteniendo un diccionario donde cada clave es una palabra y cada valor es su recuento. Este `dict` se convierte en el vocabulario, el conjunto completo de palabras que tu modelo conoce, ponderado por cuán a menudo aparecen. Estas dos funciones (`tokenize` y `word_frequency`) son el esqueleto de todo pipeline de PLN, desde los modelos simples de bigramas hasta las arquitecturas modernas de transformadores.

## Gamificación

- **Recompensa de XP**: +60 XP por lección completada (120 XP en total para este módulo)
- **Retos**: cada lección tiene retos interactivos, construye un tokenizador, cuenta frecuencias, calcula estadísticas del corpus
- **Progreso**: completa ambas lecciones para terminar este módulo
- **Bono de racha**: +15 XP extra por día cuando tu racha supera los 3 días
- **Hito de PBL**: tu vocabulario tokenizado es la base del modelo de bigramas del Módulo 3

## Proyectos que puedes crear

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 🤖 **Escritor de historias IA**, la tokenización alimenta directamente el pipeline de generación de texto
- 💬 **Creador de chatbots**, tokenizar la entrada del usuario es cómo los chatbots entienden los mensajes
- 📝 **Tutor IA**, el análisis de frecuencia de palabras ayuda a identificar conceptos clave en texto educativo
- 🔍 **Motor de búsqueda semántica**, la tokenización y el ponderado por frecuencia son el núcleo de la coincidencia de texto
- 📰 **Creador de boletines**, el análisis de frecuencia identifica los temas más importantes en el material fuente

## Lecciones

1. **Conceptos básicos de tokenización**, construye una función `tokenize()` a partir de métodos de cadena
2. **Recuento de frecuencia de palabras**, cuenta tokens en un dict de frecuencias y extrae estadísticas del vocabulario