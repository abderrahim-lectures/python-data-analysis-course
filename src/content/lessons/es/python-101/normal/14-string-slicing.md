---
title: "Corte de cadenas"
description: "Extrae subcadenas con la potente notación de corte de Python."
module: "strings"
order: 14
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Usar la notación de corte [inicio:fin:paso] para extraer subcadenas"
  - "Invertir cadenas y saltar caracteres con paso"
  - "Usar índices negativos para contar desde el final"
  - "Aplicar el corte a listas (la misma sintaxis)"
prerequisites: ["13-string-methods"]
tags: ["corte", "subcadena", "índices", "paso"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## El lenguaje de las ventanas

Una cadena es una secuencia, y sus caracteres se hallan en las posiciones $0, 1, 2, \ldots, n-1$. El corte pide la ventana entre dos fronteras. La notación es `string[start:stop:step]`, y la única asimetría que memorizar es que **`start` está incluido y `stop` excluido**, la misma regla semiabierta que te enseñó `range`:

$$
s[a:b] = s_a s_{a+1} \cdots s_{b-1}, \qquad |s[a:b]| = \max(0, b - a).
$$

```python
text = "Python"
text[0:3]    # 'Pyt'
text[2:5]    # 'tho'
text[:4]     # 'Pyth'  (inicio por defecto = 0)
text[3:]     # 'hon'   (fin por defecto = final)
text[:]      # 'Python' (copia completa)
```

Omitir una frontera la manda a su defecto: `start` al principio, `stop` al final. `text[:]` lo toma todo, y además oficia de la clásica copia de una sola tecla.

## Índices negativos: contar desde el final

Las matemáticas indexan desde cero al frente. Python añade una segunda regla, contando hacia atrás desde el último carácter con números negativos:

```python
text = "Python"
text[-1]     # 'n'  (último carácter)
text[-3:]    # 'hon' (últimos 3 caracteres)
text[:-2]    # 'Pyth' (todo excepto los 2 últimos)
text[-4:-1]  # 'tho'
```

La posición $-k$ es el carácter $n - k$ desde el frente. Pedir los tres últimos es `text[-3:]`, un gesto mental pequeño que se lee con naturalidad: *los tres finales*.

## Paso: la zancada

Un tercer parámetro controla cuántas posiciones saltas entre selecciones:

```python
text = "abcdefghij"
text[::2]    # 'acegi'   (cada segundo carácter)
text[1::2]   # 'bdfhj'   (cada segundo, empezando en 1)
text[::-1]   # 'jihgfedcba'  (¡invertida!)
text[::-2]   # 'jhfdb'   (cada segundo, invertida)
```

Un paso negativo invierte el sentido del recorrido, es la aritmética de $a, a+d, a+2d, \ldots$ con $d$ negativa. La inversión canónica `[::-1]` merece una sola memorización firme, porque de ella todo lo más fino es una variación.

## El corte nunca da error

Indexar una posición que no existe lanza `IndexError`. El corte es más amable, se sujeta al intervalo disponible y devuelve lo que existe, sin exigir nada por el camino:

```python
text = "hi"
text[0:100]   # 'hi'  (sin error, solo se detiene al final)
text[100:200] # ''    (cadena vacía)
```

Es una generosidad deliberada: una ventana que se extiende más allá del final simplemente se encoge. Donde indexar es una reclamación, cortar es una petición.

## El mismo instrumento toca listas

El corte no es una especialidad de las cadenas; es la notación de las secuencias. Las listas responden a las mismas llamadas:

```python
nums = [0, 1, 2, 3, 4, 5]
nums[1:4]     # [1, 2, 3]
nums[::-1]    # [5, 4, 3, 2, 1, 0]
```

Lo que aprendiste sobre caracteres se transfiere a cualquier colección ordenada, y, más allá de la lectura, las listas aceptan asignación de rebanada donde las cadenas no: `nums[1:3] = [9, 9]` intercambia una ventana en su sitio.

## Un ejemplo resuelto: diseccionar un nombre de archivo

Los programas viven entre nombres de archivo como `"report_2026_summary.txt"`, y el corte es como los lees por partes. La extensión son los últimos tres caracteres:

```python
filename = "report_2026_summary.txt"
extension = filename[-3:]     # 'txt'
stem      = filename[:-4]     # 'report_2026_summary'
print(stem, extension)        # report_2026_summary txt
```

`[-3:]` lee *desde tres posiciones antes del final, hasta el final*, los últimos tres caracteres. `[:-4]` lee *desde el principio, hasta cuatro posiciones antes del final*, que es todo lo anterior al punto. La regla del intervalo semiabierto reaparece: `[:-4]` excluye la posición $n - 4$, el punto mismo, así que la cola `.txt` nunca se cuela en el tallo. Una regla, ambos extremos.

Y lo inverso de leer por partes es leer entero: la comprobación de palíndromo es una línea del mismo instrumento:

```python
word = "radar"
print(word == word[::-1])     # True
```

## Errores comunes

- **Confundir indexar con cortar.** `text[3]` es un carácter, una reclamación; `text[3:4]` es un carácter, una petición, y una cadena nueva.
- **Dar por incluido `stop`.** `text[0:3]` entrega los caracteres en $0, 1, 2$; la posición $3$ es donde se cierra la ventana.
- **Asignar rebanada a cadenas.** Las cadenas se niegan, esa mutabilidad es un privilegio de las listas.
- **El signo del paso debe concordar con la dirección.** `"abcdef"[0:5:-1]` está vacío, una ventana que camina a la derecha y un paso que apunta a la izquierda no se encuentran en ninguna parte. Mantén inicio, fin y paso apuntando en la misma dirección.

## 🧩 Desafíos

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

Invierte la cadena `"racecar"` con corte.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>"racecar"[::-1]</code> → <code>"racecar"</code>, se lee igual en ambos sentidos, que es exactamente por qué un palíndromo sobrevive a su propia inversión.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

De `"abcdefghij"`, extrae cada tercer carácter: `a`, `d`, `g`, `j`.

<p class="challenge__answer">💡 <strong>Respuesta:</strong> <code>"abcdefghij"[::3]</code> → <code>"adgj"</code>, el inicio por defecto te fija en el índice 0 y el paso 3 te hace avanzar por la progresión aritmética.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué el corte nunca lanza un error donde indexar sí? ¿Qué actitud separa a los dos?
- Usando solo asignación de rebanada, ¿cómo intercambiarías dos elementos de una lista?
- Si `text[::-1]` invierte, ¿qué línea de código te dice si una cadena es palíndromo?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="python-101-string-slicing">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. ¿Qué devuelve <code>"Python"[1:4]</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">'yth'</button>
      <button class="quiz-q__opt" data-idx="1">'Pyt'</button>
      <button class="quiz-q__opt" data-idx="2">'ytho'</button>
      <button class="quiz-q__opt" data-idx="3">'Pyth'</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ¿Cómo inviertes una cadena <code>s</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">s.reverse()</button>
      <button class="quiz-q__opt" data-idx="1">s[::-0]</button>
      <button class="quiz-q__opt" data-idx="2">s[::-1]</button>
      <button class="quiz-q__opt" data-idx="3">s[::1]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>