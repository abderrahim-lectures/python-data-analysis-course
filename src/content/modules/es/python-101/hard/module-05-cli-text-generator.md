---
title: "Generador de texto CLI y temperatura"
description: "Ensambla todas las piezas en un generador de texto de línea de comandos y añade un parámetro de temperatura para controlar la creatividad."
order: 5
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2.5
lessonCount: 2
tags: ["cli", "argparse", "temperatura", "generación-de-texto", "proyecto-final"]
prerequisites: ["module-04-generate-text"]
icon: "🖥️"
---

## Por qué es importante

Has construido cada pieza de un modelo de lenguaje desde cero — carga de corpus, tokenización, recuento de frecuencias, tablas de bigramas y generación de texto. Pero ahora mismo esas piezas viven en scripts y notebooks separados. Nadie puede usar tu modelo sin leer tu código y llamar a tus funciones manualmente. El módulo final convierte tu prototipo de investigación en una herramienta real que cualquiera pueda ejecutar desde la línea de comandos.

Esta es una habilidad crítica que separa los proyectos de aprendizaje del software desplegable. Toda herramienta seria de PLN — desde la API de OpenAI hasta la biblioteca de transformadores de Hugging Face y las utilidades locales pequeñas — expone una interfaz limpia. La línea de comandos es donde viven las personas desarrolladoras: es scriptable, automatizable y fácil de integrar en flujos de trabajo más grandes. Al final de este módulo, escribirás `python generate.py --word-count 50 --temperature 1.2` y verás a tu modelo producir texto creativo a pedido.

El parámetro de temperatura es la adición más importante. Controla la compensación entre creatividad y seguridad — la temperatura baja hace que el modelo elija palabras de alta probabilidad (texto conservador y repetitivo), mientras que la temperatura alta lo hace explorar opciones de baja probabilidad (texto sorprendente y creativo). Este es exactamente el mismo mecanismo que se usa en los modelos GPT, y comprenderlo te da una visión de cómo la IA moderna controla la calidad de la salida. El ajuste de temperatura es lo que transforma un mero predictor de palabras en un compañero de escritura creativa.

## Lo que aprenderás

- Integrar todas las etapas del pipeline (cargar → tokenizar → contar → bigramas → generar) en un solo script cohesionado
- Implementar un parámetro `temperature` que modifica la distribución de probabilidad antes del muestreo
- Usar `argparse` para aceptar argumentos de línea de comandos para el recuento de palabras, la palabra inicial y la temperatura
- Probar el pipeline completo de extremo a extremo y producir texto en inglés plausible
- Comprender cómo se relaciona la temperatura con la compensación "creatividad vs. coherencia" en los modelos de lenguaje

## El razonamiento

**El problema:** tienes una función `generate_text()` que funciona, pero no es una herramienta utilizable. Las personas usuarias no pueden ejecutarla sin modificar el código fuente, y la salida siempre tiene el mismo "sabor" — es demasiado predecible o demasiado aleatoria sin forma de controlarla.

**El enfoque ingenuo:** podrías codificar los parámetros al principio de tu script: `START_WORD = "the"`, `LENGTH = 30`, `TEMPERATURE = 1.0`. Esto funciona para ti, pero nadie más puede usarlo sin editar el archivo. No es una herramienta — es un script que solo tú sabes cómo ejecutar.

**La solución:** dos adiciones lo transforman en una aplicación real. Primero, `argparse` — el analizador de argumentos de línea de comandos integrado de Python. Maneja los mensajes de `--help`, la validación de tipos, los valores por defecto y los mensajes de error automáticamente. Segundo, el escalado de temperatura — un parámetro que remodela la distribución de probabilidad antes del muestreo. La temperatura funciona dividiendo cada log-probabilidad por un valor de temperatura T: un T bajo (p. ej., 0.5) hace la distribución más nítida (dominan las palabras de alta probabilidad), mientras que un T alto (p. ej., 2.0) la hace más plana (todas las palabras se vuelven más igualmente probables).

**Cómo funciona:** el script del pipeline encadena las cinco etapas en un solo flujo. `argparse` analiza los argumentos de línea de comandos en un objeto de configuración. El corpus se carga, tokeniza y alimenta al constructor de bigramas. El parámetro de temperatura se aplica durante el muestreo escalando los pesos antes de pasarlos a `random.choices()`. Cuando la temperatura es 1.0, la distribución no cambia. Cuando es 0.1, el modelo casi siempre elige la palabra más probable. Cuando es 5.0, hasta las palabras raras tienen una oportunidad de luchar. Este simple truco de escalado es el mismo mecanismo detrás del deslizador de "temperatura" en ChatGPT y otras herramientas modernas de IA.

## Gamificación

- **Recompensa de XP**: +150 XP por lección (bono de la pista avanzada)
- **Retos**: cada lección tiene retos interactivos — construye la CLI, ajusta la temperatura, prueba casos límite
- **Progreso**: completa ambas lecciones para ganar la insignia completa de generación de texto
- **Bono por racha**: completa este módulo después de los Módulos 1-4 para un bono de +15 XP
- **Hito de PBL**: ahora tienes un generador de texto de línea de comandos que funciona — ESTE es el proyecto final

## Proyectos que puedes crear

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 🤖 **Escritor de historias IA** — extiende la CLI con avisos de historias, selección de género y generación de capítulos
- 💬 **Creador de chatbots** — añade un bucle interactivo que tome la entrada del usuario y genere respuestas
- 📝 **Tutor IA** — construye una herramienta que genere oraciones de práctica y cuestionarios a partir de corpus educativos
- 🔍 **Motor de búsqueda semántica** — combina la generación de texto con la recuperación para un sistema de generación aumentada por recuperación (RAG)
- 📰 **Creador de boletines** — automatiza el redactado de artículos generando resúmenes de artículos fuente

## Lecciones

1. **Ajuste de temperatura** — modifica las probabilidades de muestreo con un parámetro de temperatura
2. **Generador de texto CLI** — construye la interfaz de línea de comandos final que lo une todo