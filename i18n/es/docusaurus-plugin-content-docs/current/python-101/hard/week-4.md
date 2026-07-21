---
title: "Semana 4: Generando Texto"
sidebar_position: 4
section: python-101
track: hard
week: 4
description: "Genera texto muestreando probabilidades de bigramas con random.choices, completando el bucle central de tu modelo de lenguaje diminuto."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# Semana 4: Generando Texto por Muestreo

<span className="gamified-flourish">🎰 Una tabla de probabilidad es energía potencial. Esta semana la gastas — generando realmente oraciones nuevas, palabra por palabra.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Explicar la diferencia entre *siempre elegir la siguiente palabra más probable* y *muestrear* de la distribución.
- Usar `random.choices` para muestrear una siguiente palabra ponderada por probabilidades de bigrama.
- Escribir una función `generate_text()` que produzca una oración nueva, una palabra a la vez, a partir de la tabla de bigramas.
- Hacer que la generación aleatoria sea reproducible con `random.seed`, cuando eso sea útil.

## Lección

### Dos formas de elegir la "siguiente" palabra

Dado `probs_table["the"] = {"cat": 0.35, "dog": 0.3, "mouse": 0.1, "mat": 0.15, ...}`, hay dos estrategias distintas para elegir qué viene a continuación:

1. **Voraz (greedy)**: siempre toma la única palabra más probable (`"cat"`, con 35%). Esto es determinista — la misma entrada siempre produce la misma salida— y rápidamente se vuelve repetitivo, ya que la palabra de mayor probabilidad después de "cat" probablemente también sea siempre la misma.
2. **Muestreo (sampling)**: elige una palabra *al azar*, pero ponderada por su probabilidad — de modo que `"cat"` se elige alrededor del 35% de las veces, `"dog"` alrededor del 30%, y así sucesivamente, igual que lanzar un dado ponderado donde cada cara tiene un área de distinto tamaño, exactamente como muestrear de cualquier distribución discreta $P(w)$.

Esta semana usa el muestreo, porque es lo que hace que el texto generado varíe de una ejecución a otra — la misma razón por la que un modelo de lenguaje no te da la respuesta idéntica cada vez que le haces la misma pregunta.

### Muestreo con `random.choices`

`random.choices(population, weights)` de Python implementa exactamente esto: dada una lista de resultados posibles y una lista de pesos correspondiente, devuelve un resultado elegido con probabilidad proporcional a su peso.

```python
import random

def sample_next(word, probs_table):
    if word not in probs_table:
        return None   # sin continuación conocida — callejón sin salida
    next_words = list(probs_table[word].keys())
    weights = list(probs_table[word].values())
    return random.choices(next_words, weights=weights, k=1)[0]

sample_next("the", probs_table)   # p. ej. "cat" — pero no siempre
```

`weights` no necesita sumar exactamente 1 para que `random.choices` funcione correctamente (normaliza internamente) — pero los nuestros ya lo hacen, ya que vinieron directamente del `bigram_probabilities` de la semana pasada.

### Reproducibilidad con `random.seed`

La aleatoriedad es exactamente lo que queremos para tener variedad, pero hace que depurar y compartir resultados sea incómodo — "generó una oración rara" es difícil de investigar si no puedes reproducir exactamente la misma ejecución. `random.seed(n)` fija el generador de números aleatorios de Python en un punto de partida específico, de modo que cada llamada a `random.choices(...)` después de eso se vuelve determinista *para esa ejecución*:

```python
random.seed(42)
print(generate_text(probs_table, "the"))   # siempre el mismo resultado, cada vez que ejecutas esto

random.seed()   # vuelve a aleatorizar, de regreso al comportamiento impredecible normal
```

Esta es una técnica general, no específica de modelos de lenguaje — cada vez que necesitas "aleatorio, pero reproducible para pruebas", `random.seed` es la herramienta.

### Generar una oración completa

Empezando desde una palabra semilla, muestrea repetidamente la siguiente palabra y vuelve a introducirla como la nueva "palabra anterior" — un bucle, que se detiene ya sea al alcanzar una longitud fija o cuando `sample_next` llega a un callejón sin salida:

```python
def generate_text(probs_table, start_word, max_words=10):
    words = [start_word]
    current = start_word
    for _ in range(max_words - 1):
        next_word = sample_next(current, probs_table)
        if next_word is None:
            break
        words.append(next_word)
        current = next_word
    return " ".join(words)

generate_text(probs_table, "the")
# p. ej. "the cat sat on the rug" — variará entre ejecuciones
```

Este es el núcleo generativo de todo el modelo de lenguaje: nada más que muestreo ponderado repetido de una tabla construida a partir de conteo. Es un modelo de lenguaje real, funcional (aunque muy débil) — genuinamente la misma *idea* que el bucle de muestreo de siguiente-token dentro de modelos mucho más grandes, solo que estimada a partir de 20 oraciones de conteo en lugar de miles de millones de parámetros entrenados en enormes conjuntos de datos.

### Generar varios candidatos a la vez

Como cada llamada a `generate_text` es aleatoria, generar varias oraciones y revisarlas es una forma natural de explorar lo que el modelo puede producir — el mismo patrón de "muestrea unos cuantos, elige el mejor" usado al trabajar con cualquier sistema generativo:

```python
def generate_many(probs_table, start_word, n=5, max_words=10):
    return [generate_text(probs_table, start_word, max_words) for _ in range(n)]

for sentence in generate_many(probs_table, "the", n=5):
    print(sentence)
```

## ⚠️ Errores comunes

- **Olvidar comprobar `None` de `sample_next`.** Si `generate_text` no comprobara `if next_word is None: break`, fallaría la siguiente vez que intentara buscar `None` como clave en `probs_table`.
- **Asumir que `random.choices` necesita pesos que sumen exactamente 1.** No es así — normaliza cualquier peso que le des. Esto importa si alguna vez pasas conteos crudos en lugar de probabilidades ya normalizadas.
- **Olvidar que `random.seed()` (sin argumento) vuelve a aleatorizar.** Después de depurar con una semilla fija, olvidar volver a llamar a `random.seed()` significa que cada llamada "aleatoria" posterior en esa sesión sigue siendo determinista, lo que puede parecer un error en código no relacionado.
- **Esperar una salida gramaticalmente perfecta.** Un modelo bigrama no tiene ningún concepto de concordancia sujeto-verbo, significado a nivel de oración, ni nada más allá de "qué suele seguir a esta única palabra" — esto es una limitación genuina, no un error que arreglar, y es exactamente lo que las Preguntas Socráticas de abajo te piden notar directamente.

## 🧩 Retos

<Challenge id="python101-hard-w4-c1" answer={<>Llama a <code>generate_text(probs_table, "the")</code> cinco veces seguidas e imprime cada resultado — como el muestreo es aleatorio, deberías ver al menos algunas oraciones distintas incluso con exactamente la misma palabra inicial.</>}>

Llama a `generate_text` cinco veces con el mismo `start_word`. ¿Son idénticas las salidas? ¿Por qué sí o por qué no?

</Challenge>

<Challenge id="python101-hard-w4-c2" answer={<>Elige una palabra que nunca inicie un bigrama en el corpus (p. ej. una palabra que solo aparece como la última palabra de una oración) como <code>start_word</code>; <code>sample_next</code> devolverá inmediatamente <code>None</code> ya que esa palabra no es una clave en <code>probs_table</code>, así que <code>generate_text</code> devuelve solo esa única palabra semilla.</>}>

Llama a `generate_text` con un `start_word` que nunca aparezca como la *primera* palabra de un bigrama en ninguna parte del corpus (encontraste candidatos para esto en el Reto 3 de la semana pasada). ¿Qué ocurre, y por qué?

</Challenge>

<Challenge id="python101-hard-w4-c3" answer={<>Añade una comprobación: si <code>next_word == current</code> repetidamente (p. ej. rastrea las últimas palabras en una lista/deque pequeña y detente si la misma palabra se repite más de, digamos, 3 veces seguidas), detén la generación antes. Esto no ocurrirá a menudo en este pequeño corpus, pero es un modo de fallo real de los bucles de muestreo ingenuos en corpus más grandes.</>}>

Modifica `generate_text` para que se detenga antes si la misma palabra se elige 3 veces seguidas (una protección simple contra bucles repetitivos). ¿Bajo qué condiciones del corpus crees que esto realmente podría ocurrir?

</Challenge>

<Challenge id="python101-hard-w4-c4" answer={<>Cambia <code>sample_next</code> para elegir <code>max(probs_table[word], key=lambda w: probs_table[word][w])</code> en lugar de <code>random.choices</code> — esta es la estrategia "voraz" de la lección. Llamar a <code>generate_text</code> repetidamente con la misma palabra inicial ahora siempre producirá exactamente la misma oración.</>}>

Escribe un `sample_next_greedy(word, probs_table)` que siempre elija la única siguiente palabra *más probable* en lugar de muestrear al azar. Ejecuta `generate_text` (usando esta versión voraz) cinco veces con la misma palabra inicial — ¿qué notas?

</Challenge>

<Challenge id="python101-hard-w4-c5" answer={<>Llama a random.seed(1), luego generate_text(...), luego random.seed(1) de nuevo, y luego generate_text(...) con los mismos argumentos -- las dos salidas deberían ser idénticas, ya que reiniciar a la misma semilla reproduce exactamente la misma secuencia de elecciones "aleatorias".</>}>

Llama a `random.seed(1)` antes de generar una oración, anota el resultado, y luego llama a `random.seed(1)` de nuevo antes de generar otra oración con los mismos argumentos. ¿Son idénticos los dos resultados? ¿Por qué?

</Challenge>

<Challenge id="python101-hard-w4-c6" answer={<>Usa generate_many para producir, digamos, 20 oraciones, y luego elige la que tenga más palabras (usando max(..., key=len) sobre las oraciones divididas, o comparando len(sentence.split())) como un indicador simple de la salida "más desarrollada".</>}>

Usando `generate_many`, genera 20 oraciones candidatas a partir de la misma palabra inicial, y luego imprime la que sea *más larga* (tenga más palabras).

</Challenge>

## 🤔 Preguntas socráticas

- El muestreo introduce aleatoriedad a propósito. ¿Se te ocurre un caso de uso real para un modelo de lenguaje donde realmente *quisieras* el comportamiento voraz, siempre-la-misma-respuesta, en su lugar?
- `sample_next` devuelve `None` cuando la palabra actual no tiene continuación conocida. ¿Qué analogía del mundo real tiene este "callejón sin salida" — se parece más a que el modelo esté incierto, o a que el modelo literalmente nunca haya visto antes esta situación?
- Este modelo bigrama solo puede generar secuencias de palabras que son *estadísticamente plausibles dadas transiciones de una sola palabra* — no tiene ningún concepto de que la oración "tenga sentido" en su conjunto. Genera varias oraciones y busca alguna que sea gramaticalmente extraña o sin sentido a pesar de que cada par individual de palabras sea localmente plausible. ¿Qué sugiere esto sobre los límites de mirar solo una palabra hacia atrás?
- `random.seed` hace que un proceso aleatorio sea reproducible para depuración, pero las aplicaciones reales de modelos de lenguaje (como un chatbot) generalmente no fijan la semilla. ¿Por qué podría ser la elección correcta *no* fijarla ahí, aunque eso haga que los errores sean más difíciles de reproducir?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="python-101-hard-week-4"
  questions={[
    {
      id: 'q1',
      prompt: '¿Qué hace random.choices(population, weights=weights)?',
      options: [
        'Siempre devuelve el elemento con mayor peso',
        'Devuelve elementos con probabilidad proporcional a su peso',
        'Devuelve cada elemento exactamente una vez, en orden aleatorio',
        'Ignora los pesos y elige de forma uniformemente aleatoria',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: '¿Por qué llamar a generate_text() varias veces con la misma palabra inicial da resultados distintos?',
      options: [
        'Es un error',
        'probs_table cambia entre llamadas',
        'sample_next usa muestreo aleatorio, no una elección voraz fija',
        'Los dicts de Python no tienen orden',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'sample_next devuelve None cuando:',
      options: [
        'Los pesos no suman 1',
        'La palabra dada no es una clave en probs_table (sin continuación conocida)',
        'Se alcanza max_words',
        'random.choices siempre eventualmente devuelve None',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'La estrategia "voraz" para la siguiente palabra difiere del muestreo porque:',
      options: [
        'Es más rápida pero por lo demás idéntica',
        'Siempre elige la única palabra más probable, así que es determinista',
        'Elige uniformemente al azar ignorando las probabilidades',
        'Solo funciona con modelos unigrama, no bigrama',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: '¿Qué hace random.seed(42)?',
      options: [
        'Genera exactamente 42 números aleatorios',
        'Fija el generador de números aleatorios para que las llamadas aleatorias posteriores se vuelvan reproducibles',
        'Establece el valor máximo que puede devolver random.choices',
        'No tiene efecto sobre random.choices',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

## 🎁 Bono: manejo de errores para una palabra inicial inválida

<BonusContent weekId="python-101-hard-week-4">

Ahora mismo, llamar a `generate_text(probs_table, "zzz")` con una palabra que ni siquiera está en el vocabulario devuelve silenciosamente `"zzz"` — sin fallo, pero también sin ninguna señal útil de que algo anda mal. Una versión más defensiva podría lanzar un error claro en su lugar:

```python
def generate_text_safe(probs_table, start_word, max_words=10):
    if start_word not in probs_table:
        raise ValueError(f"'{start_word}' never appears as a starting word in this corpus")
    try:
        return generate_text(probs_table, start_word, max_words)
    except Exception as e:
        print(f"Generation failed: {e}")
        return start_word
```

Esto no forma parte del currículo principal, pero es la misma idea de `try`/`except` que la Semana 4 del track Normal de Python 101 introdujo, aplicada aquí a un pipeline de generación en lugar de un cálculo de promedio. Intenta activar el `ValueError` a propósito, y piensa en qué otro lugar del `generate_text` de esta semana podría valer la pena añadir una protección similar.

</BonusContent>

<ProgressCheckbox weekId="python-101-hard-week-4" />
