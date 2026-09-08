---
title: "La función generate_text()"
description: "Usa random.choices para muestrear la siguiente palabra de una tabla de bigramas y generar secuencias de texto coherentes."
order: 4
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2
lessonCount: 2
tags: ["random", "muestreo", "generación-de-texto", "función", "nlp"]
prerequisites: ["module-03-bigram-tables"]
icon: "🎲"
---

## Por qué es importante

Aquí es donde ocurre la magia. Has cargado datos, los has tokenizado, has contado frecuencias de palabras y has construido tablas de probabilidad de bigramas. Ahora puedes ver a tu modelo hablar de verdad. La función `generate_text()` es el momento en que la estadística abstracta se convierte en lenguaje — cuando un diccionario de números produce oraciones que un humano puede leer y comprender.

Cada vez que ves una "respuesta sugerida" en tu app de mensajería, una predicción de "siguiente oración" en una herramienta de escritura o una sugerencia de autocompletado mientras escribes — hay un mecanismo de muestreo detrás. La idea central es idéntica: dado una palabra actual, busca una distribución de probabilidad sobre lo que viene a continuación, y luego elige al azar uno de esos candidatos ponderado por su probabilidad. Las palabras de alta probabilidad se eligen a menudo, las de baja probabilidad raramente. El resultado se siente natural porque refleja los patrones de los datos de entrenamiento.

Lo que hace particularmente emocionante a este módulo es que es la primera vez que tu trabajo produce algo visible y tangible. Escribes una palabra semilla, y tu programa genera una secuencia de palabras que forman texto en inglés coherente (aunque a veces sorprendente). Este es el mismo mecanismo fundamental detrás de los modelos estilo GPT — la escala es diferente, pero el principio de muestrear de una distribución aprendida es idéntico.

## Lo que aprenderás

- Comprender cómo `random.choices(population, weights)` realiza el muestreo ponderado
- Escribir una función `generate_text(bigrams, length)` que encadene predicciones de palabras
- Manejar claves faltantes con elegancia cuando una palabra no tiene seguidores conocidos en el corpus
- Controlar la longitud de la salida y depurar la generación con una semilla para la reproducibilidad
- Comprender la relación entre el tamaño del corpus y la calidad de la generación

## El razonamiento

**El problema:** tienes una tabla de probabilidad de bigramas y quieres producir una secuencia de palabras que siga los patrones estadísticos de tu corpus. Necesitas encadenar predicciones: elige una palabra inicial, luego muestrea repetidamente la siguiente palabra de la distribución de la palabra actual.

**El enfoque ingenuo:** podrías usar `random.choice()` para elegir la siguiente palabra uniformemente al azar. Pero el muestreo uniforme ignora las probabilidades aprendidas — trata a "the" y "xylophone" como seguidoras igualmente probables de "the". El texto generado sería sin sentido porque no respeta la estructura estadística que trabajaste tan duro para construir.

**La solución:** `random.choices()` con el parámetro `weights`. Esta función toma una población (lista de palabras candidatas) y una lista paralela de pesos (sus probabilidades), y devuelve una selección aleatoria sesgada hacia los pesos más altos. Si "cat" tiene probabilidad 0.4 y "dog" tiene probabilidad 0.1, "cat" se elegirá aproximadamente 4 veces más a menudo. Este es el mecanismo central de muestreo.

**Cómo funciona:** la función `generate_text(bigrams, length)`: (1) Elige una palabra inicial (aleatoria o especificada por la persona usuaria). (2) Busca `bigrams[current_word]` para obtener la distribución de seguidoras. (3) Extrae las palabras candidatas y sus probabilidades en dos listas. (4) Llama a `random.choices(candidates, weights=probs, k=1)` para muestrear una seguidora. (5) Añádela a la salida, establécela como la nueva palabra actual y repite hasta alcanzar la longitud objetivo. Maneja el caso límite donde una palabra no tiene seguidoras conocidas deteniéndote temprano o eligiendo una palabra al azar. Con una semilla fija (`random.seed(42)`), obtienes salida reproducible para depurar y probar.

## Gamificación

- **Recompensa de XP**: +150 XP por lección (bono de la pista avanzada)
- **Retos**: cada lección tiene retos interactivos — muestrea de distribuciones, construye el generador, prueba casos límite
- **Progreso**: completa ambas lecciones para desbloquear el módulo final de CLI
- **Bono por racha**: completa este módulo después de los Módulos 1-3 para un bono de +15 XP
- **Hito de PBL**: tu función `generate_text()` produce inglés real y legible — has construido un modelo de lenguaje

## Proyectos que puedes crear

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 🤖 **Escritor de historias IA** — la función `generate_text()` es el núcleo de cualquier IA de escritura creativa
- 💬 **Creador de chatbots** — la generación de texto es cómo los chatbots producen respuestas a la entrada del usuario
- 📝 **Tutor IA** — genera explicaciones y ejemplos muestreando de corpus de texto educativo
- 📰 **Creador de boletines** — autogenera borradores de artículos y resúmenes a partir de material fuente
- 🎮 **Motor de ficción interactiva** — usa la generación de texto para crear juegos narrativos ramificados

## Lecciones

1. **Muestreando la siguiente palabra** — usa `random.choices()` para elegir palabras seguidoras ponderadas
2. **Implementando generate_text()** — encadena el bucle de muestreo en un generador de texto completo