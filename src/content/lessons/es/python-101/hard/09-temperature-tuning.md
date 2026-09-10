---

title: "Ajuste de temperatura"
description: "Modifica las probabilidades de muestreo con un parámetro de temperatura para controlar cuán creativa o conservadora es la salida del modelo."
module: "cli-text-generator"
order: 9
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Implementar un parámetro de temperatura que escala las log-probabilidades antes de muestrear"
  - "Comprender cómo la temperatura baja hace la salida más determinista"
  - "Comprender cómo la temperatura alta hace la salida más aleatoria"
  - "Aplicar el escalado de temperatura a las distribuciones de probabilidad del modelo de bigramas"
prerequisites: ["08-generate-text-impl"]
tags: ["python", "temperatura", "muestreo", "softmax", "generación-de-texto"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "¿Qué hace la temperatura con las probabilidades de muestreo?"
    options:
      - text: "Hace que todas las palabras sean igualmente probables"
      - text: "Acentúa o aplana la distribución de probabilidad"
        correct: true
      - text: "Solo afecta a la palabra más frecuente"
      - text: "No tiene efecto en la salida"
  - question: "¿Qué ocurre con la temperatura 0.1?"
    options:
      - text: "Una salida muy aleatoria"
      - text: "Una salida muy predecible y repetitiva"
        correct: true
      - text: "Una salida equilibrada"
      - text: "Ninguna salida"
  - question: "¿Qué ocurre con la temperatura 2.0?"
    options:
      - text: "Una salida muy predecible"
      - text: "Una salida muy aleatoria y creativa"
        correct: true
      - text: "Lo mismo que la temperatura 1.0"
      - text: "Ocurre un error"
---
Controlar la creatividad

Un modelo de lenguaje con probabilidades fijas siempre produce el mismo tipo de salida — sigue el corpus exactamente. Pero a veces quieres texto más creativo y sorprendente, y a veces quieres la salida más predecible y segura. La **temperatura** es la perilla que controla este equilibrio.

Las celdas siguientes reutilizan las funciones `load_corpus`, `tokenize`, `build_bigrams` y `normalize_bigrams` de las lecciones 01 a 06, la función `sample_next` de la lección 07 y un `generate_text` sensible a la temperatura (la misma implementación que verás ensamblada en la lección 10). Cada página de lección inicia una sesión de Python nueva, así que ejecuta primero esta celda de configuración:

```python
import csv
import string
import random
import math
from collections import defaultdict

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    texts = [row["text"] for row in reader]

def load_corpus(path):
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        return [row["text"] for row in reader]

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text.split()

def build_bigrams(tokens):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    return dict(bigrams)

def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        if not followers:
            continue
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized

def apply_temperature(probs, temperature):
    log_probs = [math.log(p + 1e-10) for p in probs]
    scaled = [lp / temperature for lp in log_probs]
    max_s = max(scaled)
    exp_s = [math.exp(s - max_s) for s in scaled]
    total = sum(exp_s)
    return [e / total for e in exp_s]

def sample_next(model, current_word, temperature=1.0):
    if current_word not in model:
        return None
    followers = model[current_word]
    words = list(followers.keys())
    probs = list(followers.values())
    if temperature != 1.0:
        probs = apply_temperature(probs, temperature)
    return random.choices(words, weights=probs, k=1)[0]

def generate_text(model, start_word, length=20, temperature=1.0):
    word = start_word
    result = [word]
    for _ in range(length - 1):
        next_word = sample_next(model, word, temperature)
        if next_word is None:
            next_word = random.choice(["the", "and", "to", "of", "a"])
        result.append(next_word)
        word = next_word
    return " ".join(result)

model = normalize_bigrams(build_bigrams(tokenize(" ".join(texts))))
```

## Conceptos clave

### ¿Qué es la temperatura?

La temperatura es un número (normalmente entre 0.1 y 2.0) que escala la distribución de probabilidad del modelo antes de muestrear:

- **Temperatura baja** (p. ej., 0.2): Acentúa la distribución — la palabra más probable se vuelve aún más probable, y las palabras raras casi imposibles. La salida es repetitiva y predecible.
- **Temperatura 1.0**: Sin cambios — se usan las probabilidades originales tal como están.
- **Temperatura alta** (p. ej., 1.5): Aplana la distribución — todas las palabras se vuelven más igualmente probables. La salida es más aleatoria, creativa y potencialmente sin sentido.

### La matemática: escalar log-probabilidades

La temperatura funciona dividiendo las log-probabilidades entre el valor de temperatura y luego convirtiendo de vuelta:

```python
import math

def apply_temperature(probabilities, temperature):
    """Apply temperature scaling to a probability distribution."""
    # Convert to log-probabilities
    log_probs = [math.log(p + 1e-10) for p in probabilities]  # add small epsilon to avoid log(0)

    # Scale by temperature
    scaled = [lp / temperature for lp in log_probs]

    # Convert back to probabilities (softmax-like)
    max_scaled = max(scaled)
    exp_scaled = [math.exp(s - max_scaled) for s in scaled]  # subtract max for numerical stability
    total = sum(exp_scaled)

    return [e / total for e in exp_scaled]
```

El truco de `math.exp(s - max_scaled)` evita el desbordamiento — sin restar el máximo, las exponenciales podrían ser astronómicamente grandes.

### Ejemplo: distribución de tres palabras

```python
words = ["cat", "dog", "bird"]
probs = [0.7, 0.2, 0.1]

# Low temperature: cat becomes even more dominant
cold = apply_temperature(probs, temperature=0.5)
print("Cold (0.5):", dict(zip(words, [f"{p:.3f}" for p in cold])))
# cat ≈ 0.876, dog ≈ 0.088, bird ≈ 0.036

# High temperature: more uniform distribution
hot = apply_temperature(probs, temperature=2.0)
print("Hot (2.0):", dict(zip(words, [f"{p:.3f}" for p in hot])))
# cat ≈ 0.524, dog ≈ 0.281, bird ≈ 0.195
```

### Integrar con sample_next()

Modifica la función de muestreo para aceptar un parámetro de temperatura:

```python
import random

def sample_next(model, current_word, temperature=1.0):
    if current_word not in model:
        return None

    followers = model[current_word]
    words = list(followers.keys())
    probs = list(followers.values())

    if temperature != 1.0:
        probs = apply_temperature(probs, temperature)

    return random.choices(words, weights=probs, k=1)[0]
```

Cuando `temperature=1.0`, se usan las probabilidades originales sin cambios. Los valores más bajos acentúan; los más altos aplanan.

### Efectos de la temperatura en la generación

```python
# Cold: repetitive, predictable
random.seed(42)
for _ in range(3):
    print(generate_text(model, "the", length=10, temperature=0.3))

# Hot: creative, surprising
random.seed(42)
for _ in range(3):
    print(generate_text(model, "the", length=10, temperature=1.5))
```

Con temperatura baja, verás repetidas las mismas frases comunes. Con temperatura alta, obtendrás combinaciones de palabras inusuales que podrían no tener sentido gramatical.

### Guía práctica de temperatura

| Temperatura | Efecto | Caso de uso |
|-------------|--------|-------------|
| 0.1–0.3 | Muy determinista | Reproducir texto conocido |
| 0.5–0.7 | Conservadora | Salida factual, segura |
| 0.8–1.0 | Equilibrada | Generación de propósito general |
| 1.0–1.5 | Creativa | Lluvia de ideas, escritura creativa |
| 1.5–2.0 | Muy aleatoria | Salida experimental, sorprendente |

Para un modelo de bigramas diminuto, las temperaturas por encima de 1.2 suelen producir galimatías porque el modelo no tiene suficiente contexto para mantener la coherencia cuando la aleatoriedad es alta.

## Inténtalo

Genera el mismo texto a tres temperaturas diferentes y compáralos:

```python
random.seed(42)
for temp in [0.3, 1.0, 1.5]:
    print(f"\n[temperature={temp}]")
    for _ in range(3):
        print(f"  {generate_text(model, 'the', length=12, temperature=temp)}")
```

¿Qué temperatura produce la salida más legible? ¿Cuál produce la más sorprendente?

## Conclusiones clave

- La temperatura escala las distribuciones de probabilidad: baja acentúa, alta aplana
- La temperatura 1.0 significa que no hay cambios sobre las probabilidades originales
- Se implementa escalando las log-probabilidades: `log_prob / temperature`
- Temperatura baja (0.3–0.7) para salida predecible; alta (1.0+) para salida creativa

## Reto de práctica

Escribe una función `compare_temperatures(model, word, temps)` que genere texto a cada temperatura e imprima una tabla comparativa:

```python
def compare_temperatures(model, word, temps=[0.3, 0.7, 1.0, 1.5], length=15):
    for temp in temps:
        random.seed(42)
        text = generate_text(model, word, length=length, temperature=temp)
        print(f"  T={temp:.1f}: {text}")
```