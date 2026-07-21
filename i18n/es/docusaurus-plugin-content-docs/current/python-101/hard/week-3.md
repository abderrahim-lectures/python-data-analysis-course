---
title: "Semana 3: Tablas de Probabilidad de Bigramas"
sidebar_position: 3
section: python-101
track: hard
week: 3
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 3: Tablas de Probabilidad de Bigramas

<span className="gamified-flourish">🔗 La semana pasada: "¿qué palabra es probable en general?" Esta semana: "¿qué palabra es probable justo *después de esta*?"</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Extraer **bigramas** (pares de palabras consecutivas) de oraciones tokenizadas.
- Construir un diccionario anidado `dict[str, dict[str, float]]` que asocie cada palabra con una distribución de probabilidad sobre las palabras que la siguen.
- Explicar, con un ejemplo, por qué los bigramas capturan contexto que el modelo unigrama no podía.
- Manejar el problema del "contexto nunca visto": qué hacer cuando una palabra no tiene sucesores conocidos en absoluto.

## Lección

### Bigramas: pares de palabras consecutivas

Un **bigrama** es un par de palabras consecutivas. Para la oración tokenizada `["the", "cat", "sat"]`, los bigramas son `("the", "cat")` y `("cat", "sat")` — un par por cada posición adyacente:

```python
def bigrams(tokens):
    return [(tokens[i], tokens[i + 1]) for i in range(len(tokens) - 1)]

bigrams(["the", "cat", "sat"])
# [('the', 'cat'), ('cat', 'sat')]
```

Este es el mismo patrón `range(len(...) - 1)` que aparece cada vez que necesitas mirar pares de vecinos en una secuencia — el `-1` existe porque la *última* palabra no tiene una palabra después con la cual emparejarse. Para una oración con $k$ tokens, siempre hay exactamente $k - 1$ bigramas.

### Una tabla de probabilidad condicional

Ahora estimamos $P(w_n \mid w_{n-1})$ — la probabilidad de la siguiente palabra, *dada solo la palabra inmediatamente anterior*. Esto es un **modelo bigrama**: sigue siendo un contexto limitado (memoria de exactamente una palabra), pero estrictamente más que la memoria de ninguna del modelo unigrama.

La estructura de datos natural es un diccionario de diccionarios: para cada palabra $w_{n-1}$, un diccionario anidado que asocia cada posible siguiente palabra $w_n$ con su probabilidad, condicionada a estar precedida por $w_{n-1}$:

```python
def bigram_counts(tokenized_sentences):
    table = {}   # word -> {next_word: count}
    for tokens in tokenized_sentences:
        for first, second in bigrams(tokens):
            if first not in table:
                table[first] = {}
            table[first][second] = table[first].get(second, 0) + 1
    return table

def bigram_probabilities(counts_table):
    probs_table = {}
    for word, next_counts in counts_table.items():
        total = sum(next_counts.values())
        probs_table[word] = {w: c / total for w, c in next_counts.items()}
    return probs_table
```

`bigram_probabilities` reutiliza exactamente la misma idea de "conteos → dividir entre el total" que el `to_probabilities` de la semana pasada — la única diferencia es que se aplica por separado a la propia fila de la tabla de *cada* palabra, ya que cada palabra tiene su propia distribución sobre lo que la sigue. Cada diccionario interno `probs_table[word]` suma 1 por su cuenta, la misma propiedad de "suma 1" de la semana pasada, solo que una distribución por palabra en lugar de una distribución para todo el vocabulario.

```python
probs_table["the"]
# {'cat': 0.35, 'dog': 0.3, 'mouse': 0.1, 'mat': 0.15, ...}
```

Lee `probs_table["the"]["cat"]` como $P(\text{"cat"} \mid \text{"the"})$: dado que la palabra anterior fue "the", ¿qué tan probable es que "cat" venga a continuación?

### El problema del contexto nunca visto

Una palabra que solo aparece al *final* de una oración nunca inicia un bigrama, así que simplemente falta como clave de nivel superior en `probs_table` — no hay ninguna fila para ella en absoluto, ya que `bigram_counts` solo añade una clave para las palabras que aparecen como el *primer* elemento de algún bigrama. Esto importa mucho para la Semana 4, donde necesitarás comprobar `word in probs_table` antes de buscar algo, exactamente el mismo patrón defensivo que comprobar que una clave existe antes de indexar un diccionario simple.

```python
def next_word_distribution(word, probs_table):
    if word not in probs_table:
        return None   # esta palabra nunca inicia un bigrama en nuestro corpus
    return probs_table[word]
```

Este caso de "el modelo literalmente nunca ha visto esta situación" es una limitación real e inevitable de cualquier enfoque basado en conteo — solo puede decir algo sobre patrones que realmente observó en los datos de entrenamiento, un tema que volverá explícitamente en la Semana 4.

## ⚠️ Errores comunes

- **Asumir que cada palabra es una clave de nivel superior en `probs_table`.** Solo las palabras que aparecen como el *primer* elemento de al menos un bigrama obtienen una fila — ver "el problema del contexto nunca visto" arriba.
- **Confundir `probs_table[word]` con `probs_table[word][other_word]`.** El primero es una distribución completa (un diccionario); el segundo es una única probabilidad (un float). Olvidar cuál de los dos tienes lleva a `TypeError`s confusos más adelante.
- **Construir la tabla de conteos y la tabla de probabilidades en un mismo paso.** Mantener `bigram_counts` y `bigram_probabilities` como dos funciones separadas (en lugar de fusionarlas) significa que después sigues teniendo disponibles los conteos crudos — útil para verificaciones de cordura, y para el experimento de cronometraje de la Semana 5, que se interesa específicamente en el paso de *conteo*.

## 🧩 Retos

<Challenge id="python101-hard-w3-c1" answer={<>Construye la tabla de bigramas completa con <code>bigram_counts</code> y luego <code>bigram_probabilities</code>, y busca directamente <code>probs_table["the"]["cat"]</code> y <code>probs_table["the"]["dog"]</code>. La que tenga mayor probabilidad es más probable que siga a "the" en este corpus.</>}>

Usando el corpus de la Semana 1, calcula la tabla de probabilidad de bigramas. ¿Cuál es más probable que siga directamente a "the": "cat" o "dog"?

</Challenge>

<Challenge id="python101-hard-w3-c2" answer={<>Recorre <code>probs_table</code> con un bucle e imprime <code>len(probs_table[word])</code> para cada una, o usa <code>max(probs_table, key=lambda w: len(probs_table[w]))</code> para encontrar directamente la palabra con más sucesores distintos.</>}>

¿Qué palabra del corpus es seguida por el *mayor* número de otras palabras distintas (es decir, tiene el diccionario interno más grande en `probs_table`)?

</Challenge>

<Challenge id="python101-hard-w3-c3" answer={<>La última palabra de una oración nunca aparece como el elemento <code>first</code> de un bigrama (solo como el <code>second</code>), así que falta como clave de nivel superior en <code>probs_table</code> a menos que también aparezca en medio de una oración en otra parte del corpus. Buscarla directamente, p. ej. <code>probs_table["mat"]</code>, lanzaría un <code>KeyError</code> si "mat" nunca inicia un bigrama en ninguna parte del corpus.</>}>

Elige una palabra que solo aparezca como la *última* palabra de una oración en el corpus. ¿Es una clave de nivel superior en `probs_table`? ¿Por qué sí o por qué no, dado cómo está definida `bigrams()`?

</Challenge>

<Challenge id="python101-hard-w3-c4" answer={<>Extiende <code>bigrams</code> a un <code>ngrams(tokens, n)</code> general que devuelva tuplas de <code>n</code> tokens consecutivos usando <code>range(len(tokens) - n + 1)</code> y slicing, p. ej. <code>tuple(tokens[i:i+n])</code>. Los bigramas son solo el caso especial n=2.</>}>

Generaliza `bigrams(tokens)` en una función `trigrams(tokens)` que devuelva todos los *tríos* consecutivos de palabras. ¿Cómo la generalizarías aún más en una función `ngrams(tokens, n)`?

</Challenge>

<Challenge id="python101-hard-w3-c5" answer={<>Usa el ayudante next_word_distribution: llámalo con una palabra que sepas que nunca es una clave de nivel superior (p. ej. una palabra que solo termina oraciones), y confirma que devuelve None en lugar de lanzar un KeyError, luego maneja ese caso None explícitamente donde sea que la llames.</>}>

Usa `next_word_distribution` para buscar de forma segura una palabra que ya identificaste en el Reto 3 como una que nunca inicia un bigrama. Confirma que devuelve `None` en lugar de fallar.

</Challenge>

<Challenge id="python101-hard-w3-c6" answer={<>Para cada clave en la tabla de conteos de bigramas, suma los valores de su diccionario interno para obtener el total de apariciones en bigramas de esa palabra, y compáralo con el conteo de esa misma palabra en el diccionario de conteos unigrama de la Semana 2 -- deberían coincidir exactamente, ya que cada aparición de una palabra (excepto posiblemente la última palabra de una oración) inicia exactamente un bigrama.</>}>

Para una palabra que aparece tanto en el `counts` unigrama de la Semana 2 como en el `bigram_counts` de esta semana, compara su conteo unigrama con la suma de los valores de su fila de bigramas (`sum(bigram_counts[word].values())`). ¿Deberían coincidir? Comprueba algunas palabras y explica cualquier pequeña discrepancia que encuentres.

</Challenge>

## 🤔 Preguntas socráticas

- Busca `probs_table["the"]` y compáralo con el `probs` general de la semana pasada. ¿Son la misma distribución? ¿Qué te dice eso sobre si "the" cambia lo que es probable que venga a continuación?
- Un modelo trigrama (condicionando en las *dos* palabras anteriores) captura más contexto que un modelo bigrama. Dado lo pequeño que es nuestro corpus de 20 oraciones, ¿qué problema práctico predices que enfrentarían los conteos de trigramas que los conteos de bigramas mayormente evitan?
- `bigram_probabilities` construye una distribución de probabilidad completa *por cada palabra* del vocabulario. Si el vocabulario tiene $V$ palabras distintas, ¿aproximadamente cuántos números podría contener la tabla de bigramas completa en el peor caso (cada palabra siguiendo a cada otra palabra al menos una vez)? ¿Qué sugiere eso sobre cómo escala el tamaño de la tabla con el tamaño del vocabulario?
- El problema del contexto nunca visto significa que un modelo bigrama puede quedarse completamente callado sobre palabras que nunca vio iniciar un bigrama. ¿Se te ocurre una forma de hacer que el modelo *siempre* tenga algo que decir, incluso para una palabra nunca vista — quizás recurriendo a algo de la semana pasada?
- El Reto 6 te pide comparar conteos unigrama con conteos de bigramas sumados. Para la mayoría de las palabras estos coinciden, pero la *última* palabra de una oración está sistemáticamente subcontada por uno en la versión bigrama. ¿Por qué exactamente uno, y por qué solo la última palabra?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="python-101-hard-week-3"
  questions={[
    {
      id: 'q1',
      prompt: 'Un bigrama es:',
      options: [
        'Una sola palabra',
        'Un par de palabras consecutivas',
        'Todo el vocabulario de un corpus',
        'Un umbral de probabilidad',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'probs_table["the"]["cat"] representa:',
      options: [
        'P(the)',
        'P(cat)',
        'P(cat | the) — la probabilidad de "cat" dado que la palabra anterior fue "the"',
        'El conteo total de "the" en el corpus',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: "¿A qué suma (aproximadamente) cada diccionario interno probs_table[word]?",
      options: ['0', '1', 'El tamaño del vocabulario', 'Varía por palabra sin un total fijo'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Comparado con un modelo unigrama, un modelo bigrama:',
      options: [
        'Usa menos contexto (ninguna memoria en absoluto)',
        'Usa una palabra de contexto anterior',
        'Usa la oración completa como contexto',
        'No puede representarse como un dict',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'Una palabra que nunca aparece como el PRIMER elemento de ningún bigrama en el corpus:',
      options: [
        'Se le asigna automáticamente probabilidad 0 para cada posible siguiente palabra',
        'Falta por completo como clave de nivel superior en probs_table',
        'Aun así se incluye, con una distribución vacía {}',
        'Es imposible -- cada palabra inicia al menos un bigrama',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-hard-week-3" />
