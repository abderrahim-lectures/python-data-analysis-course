---
title: "Semana 2: Frecuencias de Palabras"
sidebar_position: 2
section: python-101
track: hard
week: 2
description: "Tokeniza texto y cuenta frecuencias de palabras con diccionarios de Python, presentando las tablas de frecuencia como distribuciones de probabilidad discretas."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 2: Frecuencias de Palabras como una Distribución Discreta

<span className="gamified-flourish">🎲 Una tabla de conteo de palabras parece contabilidad. En realidad es una distribución de probabilidad disfrazada.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Construir una tabla de frecuencia de palabras (`dict[str, int]`) a partir de un corpus tokenizado.
- Convertir conteos crudos en probabilidades, y explicar por qué forman una distribución de probabilidad discreta válida.
- Razonar sobre qué puede y qué no puede predecir este modelo "unigrama".
- Reconocer la forma de una distribución de frecuencia de palabras de Zipf (ley de potencias).

## Lección

### Contar palabras

Dada una lista de oraciones tokenizadas (de la semana pasada), contar cuántas veces aparece cada palabra es exactamente el patrón de tabla de frecuencias de la Semana 3 del track Normal de Python 101:

```python
def count_words(tokenized_sentences):
    counts = {}
    for tokens in tokenized_sentences:
        for word in tokens:
            counts[word] = counts.get(word, 0) + 1
    return counts

counts = count_words(tokenized)
counts["the"]   # cuántas veces aparece "the" en todo el corpus
```

La biblioteca estándar en realidad tiene una herramienta diseñada exactamente para este patrón, `collections.Counter` — vale la pena conocerla aunque en este track sigamos escribiéndola a mano para mantenernos libres de dependencias:

```python
from collections import Counter

counts = Counter(word for tokens in tokenized for word in tokens)
counts.most_common(5)   # los 5 pares (palabra, conteo) más frecuentes, ya ordenados
```

`Counter` es una subclase de `dict`, así que todo lo que ya sabes sobre diccionarios (`.get()`, `.items()`, pertenencia con `in`) sigue aplicando — solo añade un par de comodidades específicas para conteo, como `.most_common()`.

### De conteos a probabilidades

Una tabla de frecuencias se convierte en una **distribución de probabilidad** en cuanto divides cada conteo entre el número total de apariciones de palabras. Si $c(w)$ es el conteo de la palabra $w$ y $N = \sum_w c(w)$ es el conteo total de palabras, entonces:

$$
P(w) = \frac{c(w)}{N}
$$

```python
def to_probabilities(counts):
    total = sum(counts.values())
    return {word: count / total for word, count in counts.items()}

probs = to_probabilities(counts)
probs["the"]   # p. ej. 0.18 — una probabilidad del 18% de que cualquier posición de palabra elegida al azar sea "the"
```

Dos propiedades hacen que esto sea una distribución de probabilidad genuina, no solo "unos números":
1. Todo $P(w) \ge 0$ — un conteo nunca puede ser negativo.
2. $\sum_w P(w) = 1$ — cada aparición de palabra está contabilizada por exactamente una palabra, así que las probabilidades de todos los resultados posibles suman 1, el mismo requisito que cualquier distribución que hayas estudiado en un curso de estadística.

Puedes verificar la propiedad 2 directamente: `sum(probs.values())` debería ser (muy cercano a) `1.0` — "muy cercano" por la imprecisión de punto flotante de la Semana 1 del track Normal.

### Esto es un modelo *unigrama*

Estimar $P(w)$ de esta forma ignora todo el contexto — es la misma probabilidad para "the" ya sea que siga a "sat on" o que inicie una oración completamente nueva. Esto se llama un modelo **unigrama**: mira una palabra a la vez, sin memoria de lo que vino antes. Es un modelo de lenguaje real y válido — solo que extremadamente débil, ya que el lenguaje real depende fuertemente del contexto ("banco" después de "río" frente a después de "dinero" significa cosas distintas). La próxima semana arregla esto, un paso a la vez, condicionando en **una** palabra anterior — un modelo **bigrama**.

### Un patrón que verás en todas partes: la ley de Zipf

Ordena tus conteos de palabras de más a menos frecuentes y observa la forma: un puñado de palabras (como "the", "a", "on") representan una enorme proporción de todas las apariciones de palabras, mientras que la mayoría de las palabras del vocabulario aparecen solo una o dos veces. Esto no es específico de nuestro pequeño corpus — es un patrón empírico extremadamente robusto en texto real llamado **ley de Zipf**: la frecuencia de una palabra es aproximadamente inversamente proporcional a su rango, $c(w) \propto \frac{1}{\text{rango}(w)}$. La palabra más común aparece aproximadamente el doble de veces que la segunda más común, tres veces más que la tercera más común, y así sucesivamente. Puedes ver una versión aproximada de esta forma incluso en un corpus de 20 oraciones:

```python
ranked = sorted(counts.items(), key=lambda pair: pair[1], reverse=True)
for rank, (word, count) in enumerate(ranked[:10], start=1):
    print(rank, word, count)
```

`enumerate(ranked[:10], start=1)` numera las 10 primeras entradas empezando desde 1 en lugar del habitual 0 de Python — útil siempre que "rango" o "posición" se entienda en el sentido cotidiano, indexado desde uno.

## ⚠️ Errores comunes

- **Buscar una palabra directamente en lugar de con `.get()`.** `counts[word] + 1` en la primerísima aparición de una palabra lanza un `KeyError`, ya que la palabra todavía no es una clave — `.get(word, 0) + 1` maneja con elegancia el caso "todavía no he visto esto".
- **Olvidar que el denominador cambia según el corpus.** `probs["the"]` de un corpus y `probs["the"]` de otro corpus distinto, más grande, no son directamente comparables en general — cada una es relativa al conteo total de palabras $N$ de su propio corpus.
- **Confundir "tamaño del vocabulario" con "conteo total de palabras".** $N = \sum_w c(w)$ cuenta cada aparición (con repeticiones); el tamaño del vocabulario (Semana 1) cuenta solo palabras *distintas*. `to_probabilities` divide entre $N$, no entre el tamaño del vocabulario — confundir estos dos rompe la propiedad de "suma 1".

## 🧩 Retos

<Challenge id="python101-hard-w2-c1" answer={<>Usa <code>sorted(counts, key=lambda w: counts[w], reverse=True)[:5]</code>, o equivalentemente ordena los pares de <code>counts.items()</code> por conteo — el mismo patrón de ordenar-por-una-clave del programa de resumen de la Semana 5 del track Normal de Python 101.</>}>

Dado `counts` de `count_words`, encuentra las 5 palabras más frecuentes del corpus.

</Challenge>

<Challenge id="python101-hard-w2-c2" answer={<>Recorre <code>probs.values()</code> con un bucle y súmalos, o simplemente <code>sum(probs.values())</code>; debería imprimir algo extremadamente cercano a 1.0 (como 0.9999999999999999) por el redondeo de punto flotante, no exactamente 1.0.</>}>

Verifica la propiedad 2 de la lección: calcula `sum(probs.values())` para tu corpus y confirma que es (casi exactamente) `1.0`.

</Challenge>

<Challenge id="python101-hard-w2-c3" answer={<>Las palabras que aparecen solo una vez tendrán cada una la misma probabilidad, la más pequeña y distinta de cero — calculable como <code>1 / total</code>. Puedes encontrarlas filtrando <code>counts</code> por las entradas donde el conteo es igual a 1.</>}>

Las palabras que aparecen solo una vez en el corpus se llaman **hapax legomena**. Encuéntralas todas, y explica qué probabilidad les asigna `to_probabilities` a cada una.

</Challenge>

<Challenge id="python101-hard-w2-c4" answer={<>Una palabra nunca vista en el corpus tiene conteo 0, así que simplemente está ausente del dict <code>counts</code>/<code>probs</code> — buscarla directamente con <code>probs["giraffe"]</code> lanza un <code>KeyError</code> en lugar de devolver 0, que es por lo que <code>.get(word, 0)</code> también importa aquí.</>}>

¿Qué probabilidad asigna este modelo a una palabra que nunca apareció en ninguna parte del corpus, como `"giraffe"`? ¿Qué ocurre realmente si escribes `probs["giraffe"]` directamente?

</Challenge>

<Challenge id="python101-hard-w2-c5" answer={<>Usa collections.Counter directamente: Counter(word for tokens in tokenized for word in tokens).most_common(5). Compara su salida con tu respuesta del Reto 1 -- deberían listar las mismas 5 palabras en el mismo orden, solo que calculadas con una herramienta incorporada en lugar de sorted() a mano.</>}>

Reescribe el Reto 1 (las 5 palabras más frecuentes) usando `collections.Counter` y `.most_common()` en lugar de `sorted()`. ¿Obtienes la misma respuesta?

</Challenge>

<Challenge id="python101-hard-w2-c6" answer={<>Imprime rango y conteo lado a lado para las 10 palabras mejor rankeadas, luego calcula count / rank para cada una — para un corpus que sigue razonablemente bien la ley de Zipf, esta razón debería mantenerse más o menos similar (cercana al propio conteo de la palabra en primer lugar) a través de los rangos, ya que c(w) por rank es aproximadamente constante bajo c(w) ∝ 1/rank.</>}>

Usando la lista `ranked` del ejemplo de la ley de Zipf, calcula `count * rank` para cada una de las 10 palabras principales. La ley de Zipf predice que este producto debería ser más o menos constante. ¿Lo es, para nuestro pequeño corpus?

</Challenge>

## 🤔 Preguntas socráticas

- El modelo unigrama le da a "the" una probabilidad alta y constante en cualquier parte de una oración, incluso al principio. ¿Eso coincide con tu intuición sobre qué palabras tienden a *iniciar* una oración en inglés frente a aparecer en medio? ¿Qué le falta a este modelo que arreglaría eso?
- Dos oraciones distintas, "the cat sat on the mat" y "mat the on sat cat the" (las palabras revueltas), producen *exactamente la misma* tabla de frecuencia de palabras. ¿Qué te dice eso sobre qué información captura y qué información no captura un modelo unigrama?
- ¿Por qué dividir entre el conteo total de palabras $N$ (todas las apariciones de palabras) en lugar de entre el tamaño del vocabulario (palabras distintas) al calcular $P(w)$? ¿Qué saldría mal con la propiedad de "suma 1" si dividieras entre el tamaño del vocabulario en su lugar?
- La ley de Zipf aparece en mucho más que solo frecuencias de palabras — los tamaños de población de ciudades, la distribución de la riqueza y el tráfico de sitios web muestran una forma similar de "unos pocos enormes, muchos diminutos". ¿Por qué podrían los fenómenos basados en conteo en general tender a producir este patrón, en lugar de que todo sea más o menos igual?
- Nuestro corpus solo tiene 20 oraciones, así que la mayoría de las palabras son hapax legomena (aparecen exactamente una vez). ¿Qué crees que le pasa a la *proporción* de hapax legomena a medida que un corpus crece mucho más — se reduce hacia cero, o la ley de Zipf sugiere que se mantiene sorprendentemente alta incluso para corpus enormes?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="python-101-hard-week-2"
  questions={[
    {
      id: 'q1',
      prompt: 'Para una distribución de probabilidad válida sobre palabras, ¿a qué debe ser igual (aproximadamente) sum(probs.values())?',
      options: ['0', '1', 'El tamaño del vocabulario', 'El conteo total de palabras'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Un modelo "unigrama" estima la probabilidad de una palabra basándose en:',
      options: [
        'Las 2 palabras anteriores',
        'La oración completa hasta ahora',
        'Ningún contexto en absoluto — solo la frecuencia general',
        'Solo la siguiente palabra',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: '¿Qué probabilidad asigna el modelo unigrama a una palabra nunca vista en el corpus?',
      options: ['1.0', 'Un número positivo muy pequeño', '0 (simplemente está ausente de la tabla)', 'Lanza un error al construir el modelo'],
      correctOptionIndex: 2,
    },
    {
      id: 'q4',
      prompt: 'counts.get(word, 0) + 1 se usa en lugar de counts[word] + 1 porque:',
      options: [
        'Se ejecuta más rápido',
        'Evita un KeyError la primera vez que se ve una palabra',
        'Solo funciona con números',
        'Se comportan idénticamente, es solo estilo',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: "¿Qué tipo de relación describe la ley de Zipf entre el rango de una palabra y su frecuencia?",
      options: [
        'La frecuencia aumenta con el rango',
        'La frecuencia es más o menos constante sin importar el rango',
        'La frecuencia es aproximadamente inversamente proporcional al rango',
        'No hay una relación general',
      ],
      correctOptionIndex: 2,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-hard-week-2" />
