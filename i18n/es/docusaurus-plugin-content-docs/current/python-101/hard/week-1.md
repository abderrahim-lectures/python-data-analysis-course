---
title: "Semana 1: Cargar un Corpus de Texto desde CSV"
sidebar_position: 1
section: python-101
track: hard
week: 1
description: "Comienza el recorrido Difícil de Python 101: carga y explora un pequeño corpus de texto desde un CSV, el primer paso para construir un modelo de lenguaje diminuto."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 1: Construyendo un Modelo de Lenguaje Diminuto — Cargando el Corpus

<span className="gamified-flourish">🧠 Durante las próximas 5 semanas construirás un modelo de lenguaje diminuto —la misma idea básica detrás de herramientas como ChatGPT— usando nada más que Python puro. Sin bibliotecas, sin atajos. Para la Semana 5 sentirás exactamente por qué los modelos de lenguaje reales no lo hacen de esta forma, y esa incomodidad es todo el punto: es tu motivación para la Sección 2.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Explicar, a alto nivel, qué es un modelo de lenguaje: un sistema que predice la siguiente palabra dadas las palabras anteriores.
- Cargar un pequeño corpus de texto desde un archivo CSV en una lista de Python de oraciones usando solo la biblioteca estándar.
- Dividir oraciones en listas de palabras (un primer tokenizador ingenuo), y explicar sus límites.
- Calcular estadísticas descriptivas básicas de un corpus de texto: número de oraciones, tamaño del vocabulario, longitud promedio.

## Lección

### ¿Qué es un modelo de lenguaje?

Un modelo de lenguaje asigna una probabilidad a secuencias de palabras — informalmente, responde a "dadas las palabras hasta ahora, ¿qué palabra es probable que venga a continuación?" Si has visto la frase "el gato se sentó sobre el ___", ya predijiste "tapete" antes de terminar de leer esta oración. Esa es la tarea, formalizada: dadas las palabras $w_1, \dots, w_{n-1}$, estimar

$$
P(w_n \mid w_1, \dots, w_{n-1})
$$

Los modelos reales (incluidos los grandes) estiman esta probabilidad usando enormes redes neuronales entrenadas con enormes conjuntos de datos. Esta semana empieza una versión mucho más pequeña: la estimaremos usando nada más que **conteo**, con un corpus diminuto escrito a mano, y Python puro. Funcionará, y para la Semana 5 también será lento —deliberadamente, para que la *razón* por la que existen herramientas como pandas y numpy deje de ser una afirmación abstracta y se convierta en algo que hayas sentido personalmente.

¿Por qué el *conteo* te permite estimar una probabilidad? Porque la probabilidad misma, en el sentido más simple ("frecuentista"), es solo "con qué frecuencia ocurrió esto, de todo lo que pudo haber ocurrido" — $P(\text{evento}) \approx \frac{\text{conteo de ese evento}}{\text{conteo de todos los eventos}}$. Todo lo que construye este track, desde las frecuencias de palabras de la Semana 2 hasta la generación de texto de la Semana 4, es exactamente esa razón, aplicada a distintas preguntas sobre qué palabra sigue a cuál.

### El corpus

Este track trabaja con [`slm-corpus.csv`](pathname:///datasets/slm-corpus.csv), un pequeño conjunto de oraciones simples escritas a mano, una por fila bajo una columna `sentence`. Un "corpus" es simplemente el conjunto de datos de texto del que aprende un modelo de lenguaje — el nuestro es deliberadamente diminuto (20 oraciones) para que cada paso siga siendo lo bastante rápido de ejecutar e inspeccionar a mano en esta etapa temprana del curso.

:::tip[Este archivo ya está disponible en el playground]
El playground del FAB ya tiene `slm-corpus.csv` precargado — no hace falta copiar ni pegar nada, `load_corpus("slm-corpus.csv")` de abajo lo encontrará directamente.
:::

### Cargándolo

Ya conoces `csv.DictReader` desde... en realidad, todavía no — eso es la Semana 5 del track Normal, una semana por delante de donde está ahora el track Difícil. Como este track salta directo a un proyecto real, aquí está la misma idea, autocontenida:

```python
import csv

def load_corpus(path):
    sentences = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sentences.append(row["sentence"])
    return sentences

corpus = load_corpus("slm-corpus.csv")
print(len(corpus), "sentences loaded")
print(corpus[0])
```

`load_corpus` devuelve una `list[str]` simple — un string por oración. Cada valor de `csv.DictReader` es un `str`, igual que `input()`. Fíjate en que la función hace exactamente un trabajo (convertir una ruta de archivo en una lista de strings de oraciones) y nada más — no tokeniza, no cuenta, no imprime nada más de lo que pide quien la llama. Mantener cada función con un alcance tan estrecho es lo que te permite construir el resto del pipeline de este track como piezas pequeñas y comprobables por separado, en lugar de un único script largo y enredado.

### Un primer tokenizador

Antes de poder contar palabras, necesitamos dividir un string de oración en una lista de palabras individuales — este paso se llama **tokenización**. El tokenizador más simple posible simplemente divide por espacios en blanco:

```python
def tokenize(sentence):
    return sentence.lower().split()

tokenize("The cat sat on the mat")
# ['the', 'cat', 'sat', 'on', 'the', 'mat']
```

`.lower()` importa: sin él, `"The"` y `"the"` se contarían más adelante como dos palabras distintas, lo que haría que nuestros conteos de palabras (la próxima semana) tuvieran menos sentido. `.split()` sin argumentos divide por cualquier secuencia de espacios en blanco, lo cual es suficiente para las oraciones simples y sin puntuación de este corpus.

Una versión ligeramente más robusta elimina la puntuación básica antes de dividir, lo cual importa en el momento en que tu corpus deja de ser deliberadamente limpio:

```python
import string

def tokenize_robust(sentence):
    no_punct = sentence.translate(str.maketrans("", "", string.punctuation))
    return no_punct.lower().split()

tokenize_robust("The cat sat on the mat.")
# ['the', 'cat', 'sat', 'on', 'the', 'mat']  -- el punto final desapareció
```

`string.punctuation` es un string ya preparado con los caracteres de puntuación comunes; `str.maketrans("", "", string.punctuation)` construye una tabla de traducción que asocia cada uno de esos caracteres con nada, y `.translate(...)` la aplica, eliminándolos efectivamente. Este track se queda con el `tokenize` más simple durante el resto de las semanas (el corpus está deliberadamente libre de puntuación), pero vale la pena ver cómo luce un paso de preprocesamiento "real" — esta brecha exacta es una de muchas razones por las que las herramientas de PLN (procesamiento de lenguaje natural) en producción usan bibliotecas de tokenización dedicadas en lugar de una simple llamada a `.split()`.

### Estadísticas básicas del corpus

Antes de construir nada probabilístico, vale la pena simplemente mirar los datos — el mismo instinto que el track de EDA de la Sección 2 formalizará en toda una metodología:

```python
tokenized = [tokenize(s) for s in corpus]
lengths = [len(tokens) for tokens in tokenized]

print("Sentences:", len(corpus))
print("Shortest sentence:", min(lengths), "words")
print("Longest sentence:", max(lengths), "words")
print("Average sentence length:", sum(lengths) / len(lengths))
```

Incluso esta pequeña cantidad de perfilado te dice algo útil: si cada oración del corpus tuviera exactamente la misma longitud, eso sugeriría un conjunto de datos muy artificial (o muy repetitivo) — algo que vale la pena saber antes de confiar en cualquier estadística calculada a partir de él más adelante.

## ⚠️ Errores comunes

- **Olvidar `.lower()`.** Sin él, `"The"` y `"the"` son dos tokens distintos en lo que respecta a Python, dividiendo silenciosamente en dos lo que debería ser el conteo de una sola palabra.
- **Asumir que `.split()` maneja la puntuación.** `"mat.".split()` sobre una oración completa te da un token `"mat."` (con el punto pegado) como una sola pieza, no `"mat"` y `"."` por separado — una brecha real que los retos de esta semana te piden notar directamente.
- **Releer el archivo cada vez que necesitas el corpus.** `load_corpus` hace E/S de archivos, que es comparativamente lenta — llámala una vez, guarda el resultado en una variable, y reutiliza esa variable, en lugar de volver a llamar a `load_corpus(...)` dentro de un bucle.

## 🧩 Retos

<Challenge id="python101-hard-w1-c1" answer={<>Llama a <code>load_corpus</code>, y luego usa una comprensión de lista: <code>[tokenize(s) for s in corpus]</code>. Esto produce una lista de listas — cada lista interna son los tokens de una oración.</>}>

Usando `load_corpus` y `tokenize` juntos, produce una lista donde cada elemento sea la versión tokenizada (lista de palabras) de una oración del corpus.

</Challenge>

<Challenge id="python101-hard-w1-c2" answer={<>Recorre las oraciones tokenizadas con un bucle y toma <code>len(tokens)</code> para cada una, luego usa <code>sum(...) / len(...)</code> sobre todas ellas — el mismo patrón de promedio de las Semanas 4/5 del track Normal de Python 101, solo que aplicado a conteos de tokens en lugar de calificaciones.</>}>

Calcula el número promedio de palabras por oración en el corpus.

</Challenge>

<Challenge id="python101-hard-w1-c3" answer={<>Construye un <code>set()</code> y agrega cada token de cada oración tokenizada a él (o usa una comprensión de conjunto sobre una lista aplanada); <code>len(...)</code> de ese conjunto es el tamaño del vocabulario — el conteo de palabras *distintas*, a diferencia del conteo total de palabras, que cuenta las repeticiones.</>}>

Calcula el tamaño del **vocabulario** del corpus — el número de palabras *distintas* que aparecen en cualquier parte del corpus (sin contar repeticiones).

</Challenge>

<Challenge id="python101-hard-w1-c4" answer={<>Un tokenizador ingenuo con <code>.split()</code> trataría <code>"mat."</code> y <code>"mat"</code> como tokens diferentes, y <code>"Amina's"</code> quedaría pegado a su apóstrofo — la puntuación adjunta a una palabra no se elimina. Los tokenizadores reales (y el corpus de este curso) evitan esto manteniendo las oraciones libres de puntuación por ahora.</>}>

Las oraciones del corpus deliberadamente no contienen puntuación. ¿Qué saldría mal con el enfoque simple de `.split()` de `tokenize` si una oración *sí* contuviera puntuación, como `"The cat sat on the mat."`? Pruébalo con ese string e inspecciona el resultado.

</Challenge>

<Challenge id="python101-hard-w1-c5" answer={<>Llama a <code>tokenize_robust("The cat sat on the mat.")</code> y compáralo con <code>tokenize("The cat sat on the mat.")</code> — la versión robusta elimina el punto final antes de dividir, produciendo <code>"mat"</code> en lugar de <code>"mat."</code> como último token.</>}>

Pasa la misma oración con puntuación del Reto 4 por `tokenize_robust` en su lugar. ¿Produce la lista de tokens que esperarías?

</Challenge>

<Challenge id="python101-hard-w1-c6" answer={<>Recorre las oraciones tokenizadas con un bucle, construye un conteo de frecuencias para las longitudes de oración (por ejemplo, un dict que asocie cada longitud con cuántas oraciones la tienen), y encuentra la longitud con el conteo más alto — el mismo patrón de "rastrear un máximo acumulado sobre un dict" de la Semana 3 del track Normal de Python 101.</>}>

Encuentra la longitud de oración *más común* en el corpus (en palabras) — no el promedio, la longitud que ocurre con más frecuencia.

</Challenge>

## 🤔 Preguntas socráticas

- $P(w_n \mid w_1, \dots, w_{n-1})$ condiciona sobre *cada* palabra anterior. Nuestro pequeño corpus tiene solo 20 oraciones — ¿crees que tendremos suficientes datos para estimar una probabilidad condicionada a historiales largos? ¿Qué podríamos tener que simplificar?
- ¿Por qué `tokenize` convierte la oración a minúsculas antes de dividirla? ¿Qué pregunta sobre frecuencia de palabras de la próxima semana daría una respuesta engañosa si nos saltáramos ese paso?
- `load_corpus` y `tokenize` son ambas funciones pequeñas y de propósito único, en lugar de una gran función que hace todo. ¿Qué aprendiste en la Semana 4 del track Normal de Python 101 que explica por qué esto es útil aquí, más allá de "es más ordenado"?
- `tokenize_robust` elimina *toda* la puntuación, incluyendo los apóstrofos dentro de contracciones como `"don't"`, convirtiéndola en `"dont"`. ¿Es realmente ese el comportamiento correcto para un tokenizador real? ¿Qué tendrías que cambiar para manejar las contracciones de forma especial?
- Dada la idea frecuentista de que "probabilidad ≈ conteo / total", ¿qué crees que le pasa a tus estimaciones de probabilidad a medida que el corpus crece de 20 oraciones a 20,000? ¿Esperarías que las estimaciones se vuelvan más o menos confiables, y por qué?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="python-101-hard-week-1"
  questions={[
    {
      id: 'q1',
      prompt: '¿Cuál de las siguientes estima un modelo de lenguaje?',
      options: [
        'La siguiente palabra exacta con 100% de certeza',
        'La probabilidad de la siguiente palabra dadas las palabras anteriores',
        'Si una oración es gramaticalmente correcta',
        'El número total de palabras en un documento',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: '¿Por qué tokenize() llama a .lower() antes de .split()?',
      options: [
        'Hace que el código se ejecute más rápido',
        'Asegura que csv.DictReader funcione correctamente',
        'Para que "The" y "the" se cuenten después como la misma palabra',
        'Lo requiere la sintaxis de Python',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: '¿Qué devuelve load_corpus()?',
      options: [
        'Un único string largo',
        'Una lista de strings, uno por oración',
        'Un dict que asocia palabras con conteos',
        'Un objeto de archivo CSV',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: '¿Qué significa "tamaño del vocabulario" para un corpus?',
      options: [
        'El conteo total de palabras incluyendo repeticiones',
        'El número de oraciones',
        'El número de palabras distintas',
        'La longitud promedio de las oraciones',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: '¿Qué logra string.punctuation combinado con str.translate en tokenize_robust?',
      options: [
        'Convierte el texto a mayúsculas',
        'Elimina los caracteres de puntuación antes de dividir',
        'Cuenta cuántos signos de puntuación están presentes',
        'Traduce la oración a otro idioma',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-hard-week-1" />
