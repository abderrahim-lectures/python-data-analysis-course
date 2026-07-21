---
title: "Semana 5: Un Generador CLI, Temperatura, y el Muro de Velocidad"
sidebar_position: 5
section: python-101
track: hard
week: 5
description: "Ensambla un generador de texto en línea de comandos con un parámetro de temperatura, y luego mide el tiempo de tu código en Python puro para sentir dónde se vuelve lento."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# Semana 5: Ensamblando el CLI, Ajustando la Temperatura, y Sintiendo el Muro de Velocidad

<span className="gamified-flourish">⏱️ Esta es la semana en que toda la restricción de "Python puro, sin numpy" deja de ser un inconveniente y empieza a ser el punto central.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Ensamblar cada pieza de las Semanas 1 a 4 en un generador de texto de línea de comandos completo, de principio a fin.
- Añadir un parámetro de **temperatura** que controle cuán aleatorio frente a predecible es el texto generado.
- Cronometrar tu pipeline de Python puro en un corpus más grande y explicar, a partir de la medición de primera mano, por qué esto motiva la Sección 2.
- Razonar informalmente sobre cómo escala el tiempo de ejecución de tu pipeline con el tamaño de la entrada.

## Lección

### Ensamblando el pipeline

Cada función de las Semanas 1 a 4 se compone en un solo pipeline — cargar, tokenizar, contar, convertir a probabilidades, generar:

```python
import csv
import random

def load_corpus(path):
    with open(path, newline="") as f:
        return [row["sentence"] for row in csv.DictReader(f)]

def tokenize(sentence):
    return sentence.lower().split()

def bigrams(tokens):
    return [(tokens[i], tokens[i + 1]) for i in range(len(tokens) - 1)]

def build_bigram_probabilities(sentences):
    counts_table = {}
    for sentence in sentences:
        for first, second in bigrams(tokenize(sentence)):
            counts_table.setdefault(first, {})
            counts_table[first][second] = counts_table[first].get(second, 0) + 1
    probs_table = {}
    for word, next_counts in counts_table.items():
        total = sum(next_counts.values())
        probs_table[word] = {w: c / total for w, c in next_counts.items()}
    return probs_table

def generate_text(probs_table, start_word, max_words=10):
    words, current = [start_word], start_word
    for _ in range(max_words - 1):
        if current not in probs_table:
            break
        next_words = list(probs_table[current].keys())
        weights = list(probs_table[current].values())
        current = random.choices(next_words, weights=weights, k=1)[0]
        words.append(current)
    return " ".join(words)

if __name__ == "__main__":
    corpus = load_corpus("slm-corpus.csv")
    probs_table = build_bigram_probabilities(corpus)
    print(generate_text(probs_table, "the", max_words=8))
```

`dict.setdefault(key, {})` en `build_bigram_probabilities` es un pequeño atajo para el patrón `if key not in table: table[key] = {}` de la Semana 3 — hace lo mismo en una línea. `if __name__ == "__main__":` es la forma estándar de marcar "ejecuta esto cuando el archivo se ejecuta directamente" — verás esta convención constantemente una vez que instales Python localmente en el Bono Capstone.

### Temperatura: ajustando la aleatoriedad

La **temperatura** es un único mando que estira o aplana una distribución de probabilidad antes de muestrear de ella, sin cambiar qué resultados son posibles — solo qué tan cerca de uniforme (plana) o qué tan cerca de voraz (con picos) se comporta el muestreo:

$$
P_T(w) = \frac{P(w)^{1/T}}{\sum_{w'} P(w')^{1/T}}
$$

- $T = 1$: sin cambios — muestreo normal de la distribución original.
- $T < 1$ (p. ej. $0.5$): agudiza la distribución — las palabras de alta probabilidad se vuelven *aún* más probables, empujando la generación hacia el comportamiento voraz de la semana pasada.
- $T > 1$ (p. ej. $2.0$): aplana la distribución — las palabras de baja probabilidad se vuelven relativamente más probables, produciendo texto más sorprendente, más caótico.

¿Por qué exponenciación, en lugar de simplemente escalar las probabilidades directamente? Porque elevar cada $P(w)$ a una potencia $\frac{1}{T}$ afecta a las probabilidades grandes y pequeñas de forma *desigual*, exactamente en la dirección que quieres: para $T < 1$ (así que $\frac{1}{T} > 1$), una probabilidad como $0.5$ elevada a una potencia mayor que 1 se reduce, pero una probabilidad más pequeña como $0.05$ se reduce en una proporción mucho mayor — ampliando la *brecha* entre palabras probables e improbables. El paso de renormalización (dividir entre la nueva suma) es lo que convierte este conjunto reconfigurado de números de vuelta en una distribución de probabilidad válida que suma 1, la misma propiedad de "suma 1" de la Semana 2.

```python
def apply_temperature(probs, temperature):
    adjusted = {w: p ** (1 / temperature) for w, p in probs.items()}
    total = sum(adjusted.values())
    return {w: v / total for w, v in adjusted.items()}

def sample_next(word, probs_table, temperature=1.0):
    if word not in probs_table:
        return None
    probs = probs_table[word]
    if temperature != 1.0:
        probs = apply_temperature(probs, temperature)
    return random.choices(list(probs.keys()), weights=list(probs.values()), k=1)[0]
```

Este es exactamente el mismo concepto de "temperatura" que verás referenciado en las APIs reales de modelos de lenguaje grandes — estás implementando una versión simplificada de un mando de control real, ampliamente usado.

### Cronometrándolo: sintiendo el muro de velocidad

Aquí está el ejercicio hacia el que ha estado apuntando todo este track. Cronometra tu pipeline en un corpus **más grande** — digamos, una versión del corpus repetida 200 veces para simular más datos (`corpus * 200`, usando multiplicación de listas) — usando el módulo `time` incorporado de Python:

```python
import time

big_corpus = corpus * 200   # simula un conjunto de datos mucho más grande
start = time.time()
big_probs_table = build_bigram_probabilities(big_corpus)
elapsed = time.time() - start
print(f"Built bigram table for {len(big_corpus)} sentences in {elapsed:.3f} seconds")
```

Ejecuta esto en el playground y anota tu número real. Probablemente siga siendo rápido a este tamaño — pero observa qué pasa cuando multiplicas el tamaño del corpus de nuevo (`* 1000`, `* 5000`): el enfoque de bucles anidados y diccionario de diccionarios de la Semana 3 hace trabajo real por *cada aparición de palabra*, sin atajos. No hay forma de "vectorizar" un bucle `for` de Python puro de la forma en que pueden hacerlo las bibliotecas numéricas especializadas.

### Lo que la cronometración realmente muestra

Cada oración adicional en el corpus añade una cantidad de trabajo aproximadamente constante: tokenizarla, formar sus bigramas, actualizar un puñado de entradas de diccionario. Duplicar el número de oraciones duplica aproximadamente el número de apariciones de palabras a procesar, lo que duplica aproximadamente el tiempo de ejecución — una relación **lineal** entre el tamaño de la entrada y el tiempo, informalmente $O(n)$ donde $n$ es el conteo total de palabras. Eso en realidad es un *buen* comportamiento de escalado, no uno malo — el problema real no es que este algoritmo escale mal en teoría, es que cada paso individual (una búsqueda en un diccionario, una llamada a función, una iteración de bucle) cuesta más en Python puro e interpretado de lo que costaría el paso equivalente en el código compilado y vectorizado debajo de numpy/pandas. Números ilustrativos (los tuyos variarán según la máquina, pero la *forma* debería verse similar):

| Repeticiones del corpus | Oraciones aprox. | Tiempo aprox. |
|---|---|---|
| 1× | 20 | unos pocos milisegundos |
| 200× | 4,000 | todavía bien por debajo de un segundo |
| 5,000× | 100,000 | ahora claramente notable |

**Esa brecha —entre lo que Python puro puede hacer cómodamente y lo que los problemas de texto/datos de tamaño real necesitan— es exactamente lo que la Sección 2 existe para cerrar.** Pandas y numpy no solo hacen que el código sea más corto; hacen que operaciones como esta se ejecuten órdenes de magnitud más rápido, al empujar el bucle real hacia código optimizado y compilado en lugar del propio bucle del intérprete de Python.

## ⚠️ Errores comunes

- **Cronometrar algo que incluye costos de configuración de una sola vez.** Si tu código de cronometraje incluye accidentalmente el tiempo de lectura de archivo de `load_corpus` junto con el cómputo real de `build_bigram_probabilities`, estás midiendo dos cosas distintas a la vez — cronometra solo el paso específico que te interesa.
- **Comparar cronometrajes entre cargas de máquina muy distintas.** Ejecutar otros programas pesados al mismo tiempo puede sesgar una medición de tiempo; si un resultado se ve sorprendente, vuelve a ejecutarlo un par de veces.
- **Asumir que el escalado lineal significa "sin problema a ningún tamaño".** $O(n)$ es bueno, pero un factor constante suficientemente grande por operación igual se acumula — todo el punto de esta semana es que el *factor constante* por operación es lo que Python puro pierde frente al código vectorizado, incluso con el mismo escalado a grandes rasgos.

## 🧩 Retos

<Challenge id="python101-hard-w5-c1" answer={<>Envuelve la llamada a <code>generate_text</code> del CLI en un bucle que lea <code>input("Start word: ")</code>, y usa <code>input("Max words: ")</code> convertido con <code>int(...)</code> — el mismo patrón de entrada-y-luego-conversión de la Semana 1 del track Normal de Python 101, ahora alimentando un pipeline de generación en lugar de un cálculo simple.</>}>

Extiende el bloque `if __name__ == "__main__":` para que le pida al usuario (vía `input()`) una palabra inicial y un número máximo de palabras, en lugar de tenerlos fijos en el código.

</Challenge>

<Challenge id="python101-hard-w5-c2" answer={<>Llama a <code>generate_text</code> (usando el <code>sample_next</code> consciente de la temperatura) tres veces cada una con <code>temperature=0.5</code> y <code>temperature=2.0</code> con la misma palabra inicial, y compara: las ejecuciones de baja temperatura deberían verse más repetitivas/predecibles, las de alta temperatura más erráticas.</>}>

Genera texto con `temperature=0.5` y `temperature=2.0` con la misma palabra inicial, varias veces cada una. Describe la diferencia cualitativa que observas.

</Challenge>

<Challenge id="python101-hard-w5-c3" answer={<>Cronometra <code>build_bigram_probabilities</code> en algunos multiplicadores de repetición del corpus distintos (p. ej. 1x, 50x, 200x, 1000x) e imprime el tiempo transcurrido para cada uno — el crecimiento debería verse aproximadamente lineal (o peor) en el número de apariciones de palabras, ya que cada aparición dispara operaciones de diccionario.</>}>

Cronometra `build_bigram_probabilities` en tamaños de corpus crecientes (`corpus * 1`, `* 50`, `* 200`, `* 1000`) e imprime una pequeña tabla de tamaño frente a tiempo transcurrido. ¿El crecimiento se ve lineal, o peor que lineal?

</Challenge>

<Challenge id="python101-hard-w5-c4" answer={<>A temperatura exactamente 1.0, <code>apply_temperature</code> eleva cada probabilidad a la potencia <code>1/1 = 1</code>, es decir, las deja sin cambios, y luego renormaliza dividiendo entre su suma (ya 1) -- así que matemáticamente es una operación nula, que es exactamente por qué <code>sample_next</code> trata como caso especial <code>temperature != 1.0</code> para saltarse el cómputo (redundante) por completo.</>}>

¿Por qué `sample_next` trata como caso especial `temperature != 1.0` en lugar de siempre llamar a `apply_temperature`? ¿Qué calcula realmente `apply_temperature` cuando `temperature == 1.0`?

</Challenge>

<Challenge id="python101-hard-w5-c5" answer={<>Divide el tiempo transcurrido a 1000x entre el tiempo transcurrido a 50x, y por separado divide 1000 entre 50 (=20). Si el algoritmo es verdaderamente lineal, la razón de tiempos debería estar aproximadamente cerca de 20 también -- confirmando que 20 veces más oraciones toma aproximadamente 20 veces más tiempo, no 400 veces (cuadrático) ni apenas más tiempo (constante).</>}>

Usando tus cronometrajes del Reto 3, calcula la *razón* entre el tiempo a `1000x` y el tiempo a `50x`. Compara esa razón con la razón de los tamaños de corpus (`1000/50 = 20`). ¿La razón de tiempos coincide aproximadamente, confirmando un escalado lineal?

</Challenge>

<Challenge id="python101-hard-w5-c6" answer={<>Escribe generate_batch(probs_table, start_word, temperatures, max_words=10) que recorra con un bucle la lista temperatures, llamando a generate_text (o la versión consciente de la temperatura) una vez por valor y acumulando los resultados en una lista, p. ej. [generate_text(...) for t in temperatures] con el parámetro temperature de sample_next enhebrado a través.</>}>

Escribe una función `generate_batch(probs_table, start_word, temperatures, max_words=10)` que genere una oración por cada valor de temperatura en una lista dada (p. ej. `[0.5, 1.0, 1.5, 2.0]`) y devuelva todas juntas, para que puedas comparar el efecto de la temperatura lado a lado en una sola llamada.

</Challenge>

## 🤔 Preguntas socráticas

- Acabas de medir personalmente el rendimiento de Python puro en una tarea de procesamiento de texto. ¿Crees que la lentitud que viste se debe principalmente al bucle `for` de Python, a las operaciones de diccionario, o a otra cosa? ¿Qué necesitarías probar para aislar la causa?
- La temperatura reconfigura una distribución de probabilidad pero nunca cambia *cuáles* resultados son posibles (una palabra con probabilidad 0 se queda en probabilidad 0 sin importar la temperatura). ¿Por qué es esa una propiedad importante para que tenga un "mando de aleatoriedad"?
- La Sección 2 comienza con una demostración que muestra el mismo tipo de tarea de conteo de palabras ejecutándose dramáticamente más rápido con numpy/pandas que la versión en Python puro que acabas de construir. Basándote en lo que ahora sabes sobre cómo funciona realmente tu `build_bigram_probabilities` (bucles anidados, búsquedas en diccionarios), ¿qué predices que necesitaría hacer diferente una versión vectorizada para ser más rápida?
- El escalado de esta semana fue lineal ($O(n)$) en el conteo total de palabras — no el *peor* comportamiento de escalado posible. ¿Se te ocurre algún paso en todo este pipeline de 5 semanas que podría haber sido mucho peor (p. ej. cuadrático) si se hubiera escrito de una forma distinta, más ingenua?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="python-101-hard-week-5"
  questions={[
    {
      id: 'q1',
      prompt: 'Una temperatura por debajo de 1.0 (p. ej. 0.5) hace que el texto generado sea:',
      options: [
        'Más aleatorio/caótico',
        'Más predecible/repetitivo, más cercano a voraz',
        'Exactamente idéntico a temperatura 1.0',
        'Imposible de generar (lanza un error)',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: "¿Qué hace dict.setdefault(key, {}) si key ya está presente?",
      options: [
        'Sobrescribe el valor existente con {}',
        'Lanza un KeyError',
        'Deja el valor existente sin cambios',
        'Elimina la clave',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'El ejercicio de cronometraje de esta semana en un corpus más grande está pensado para demostrar:',
      options: [
        'Que Python siempre es demasiado lento para ser útil',
        'Una motivación concreta y sentida de por qué existen herramientas vectorizadas como numpy/pandas',
        'Que los modelos bigrama son más rápidos que los modelos unigrama',
        'Cómo arreglar código lento usando multihilos',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'if __name__ == "__main__": se usa para:',
      options: [
        'Declarar la clase principal del programa',
        'Marcar código que debería ejecutarse solo cuando el archivo se ejecuta directamente',
        'Importar la biblioteca estándar',
        'Acelerar el script',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: "Duplicar aproximadamente el tamaño del corpus y ver que el tiempo de construcción se duplica aproximadamente es un ejemplo de:",
      options: ['Escalado en tiempo constante', 'Escalado en tiempo lineal', 'Escalado en tiempo cuadrático', 'Ninguna relación en absoluto'],
      correctOptionIndex: 1,
    },
  ]}
/>

## 🎁 Bono: empaquetando el modelo como una clase

<BonusContent weekId="python-101-hard-week-5">

Cada función que escribió este track toma un `probs_table` como argumento explícito, pasado de función en función. Una `class` te permite agrupar la tabla y las funciones que operan sobre ella en un solo objeto:

```python
class BigramModel:
    def __init__(self, corpus_path):
        sentences = load_corpus(corpus_path)
        self.probs_table = build_bigram_probabilities(sentences)

    def generate(self, start_word, max_words=10, temperature=1.0):
        return generate_text(self.probs_table, start_word, max_words)

model = BigramModel("slm-corpus.csv")
model.generate("the")
```

Esto no forma parte del currículo principal — todo el track fue deliberadamente resoluble con funciones y diccionarios, para mantener el foco en las *ideas* (conteo, probabilidad condicional, muestreo) en lugar del diseño orientado a objetos. Pero ahora que has sentido dónde las funciones simples se vuelven difíciles de manejar (pasar `probs_table` en cada llamada), estás en una buena posición para apreciar lo que te da una clase. Intenta envolver el pipeline completo de esta semana como una clase `BigramModel`, y luego compara: ¿se siente más limpio, o solo diferente?

</BonusContent>

<ProgressCheckbox weekId="python-101-hard-week-5" />

---

**🎉 Terminaste Python 101.** Construiste un modelo de lenguaje funcional (aunque simple) usando nada más que la biblioteca estándar de Python — y mediste personalmente dónde empieza a tensarse. Esa es exactamente la puerta que la Sección 2, **Pandas y Análisis de Datos**, abre a continuación.
