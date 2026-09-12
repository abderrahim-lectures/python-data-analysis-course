---

title: "Generador de texto CLI"
description: "Conecta todas las etapas del pipeline en un único script de línea de comandos con argparse para una generación de texto amigable."
module: "cli-text-generator"
order: 10
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Integrar cargar → tokenizar → contar → bigramas → normalizar → generar en un solo script"
  - "Usar argparse para aceptar argumentos de línea de comandos para el recuento de palabras, la palabra inicial y la temperatura"
  - "Construir un pipeline completo de extremo a extremo que se ejecute desde la terminal"
  - "Probar el sistema completo y producir texto en inglés plausible"
prerequisites: ["09-temperature-tuning"]
tags: ["python", "cli", "argparse", "pipeline", "proyecto-final"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "¿Qué módulo de Python se usa para analizar argumentos de línea de comandos?"
    options:
      - text: "os"
      - text: "argparse"
        correct: true
      - text: "sys"
      - text: "cli"
  - question: "¿Qué crea argparse.ArgumentParser()?"
    options:
      - text: "Un identificador de archivo"
      - text: "Un analizador que puede leer argumentos de línea de comandos"
        correct: true
      - text: "Una conexión de red"
      - text: "Una conexión de base de datos"
  - question: "¿Cómo accedes a un argumento analizado llamado --words?"
    options:
      - text: "args['words']"
      - text: "args.words"
        correct: true
      - text: "args.getWords()"
      - text: "argparse.words"
---
El ensamblaje final

Cada pieza está construida y probada individualmente. Ahora las conectas en un solo script que una persona pueda ejecutar desde la línea de comandos. Este es el punto culminante de todo el proyecto, un modelo de lenguaje diminuto que lee un corpus CSV y genera texto nuevo.

## Conceptos clave

### El pipeline completo

Aquí está la integración completa en una función:

```python
import csv
import string
import random
import json
from collections import defaultdict

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
    import math
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
```

### Añadir argparse

`argparse` analiza los argumentos de línea de comandos para que las personas usuarias puedan controlar la salida:

```python
import argparse

def main():
    parser = argparse.ArgumentParser(description="Tiny Language Model Text Generator")
    parser.add_argument("--corpus", default="slm-corpus.csv", help="Path to CSV corpus")
    parser.add_argument("--start", default="the", help="Starting word")
    parser.add_argument("--words", type=int, default=20, help="Number of words to generate")
    parser.add_argument("--temperature", type=float, default=1.0, help="Temperature (0.1-2.0)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    parser.add_argument("--model", default=None, help="Path to save/load JSON model")

    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    # Load or build model
    if args.model:
        try:
            with open(args.model) as f:
                model = json.load(f)
            print(f"Loaded model from {args.model}")
        except FileNotFoundError:
            print(f"Model not found, building from {args.corpus}...")
            texts = load_corpus(args.corpus)
            tokens = tokenize(" ".join(texts))
            bigrams = build_bigrams(tokens)
            model = normalize_bigrams(bigrams)
            with open(args.model, "w") as f:
                json.dump(model, f)
            print(f"Model saved to {args.model}")
    else:
        texts = load_corpus(args.corpus)
        tokens = tokenize(" ".join(texts))
        bigrams = build_bigrams(tokens)
        model = normalize_bigrams(bigrams)

    # Generate
    output = generate_text(model, args.start, args.words, args.temperature)
    print(f"\n{output}")

if __name__ == "__main__":
    main()
```

### Ejecutar desde la terminal

```bash
# Default settings
python generate.py

# Custom options
python generate.py --start "the" --words 30 --temperature 0.7 --seed 42

# Save and reuse model
python generate.py --model bigram_model.json --start "he" --words 15
```

### Probar el pipeline

Ejecuta pruebas de extremo a extremo para verificar que todo funciona:

```python
def test_pipeline():
    texts = load_corpus("slm-corpus.csv")
    assert len(texts) > 0, "No data loaded"

    tokens = tokenize(" ".join(texts))
    assert len(tokens) > 0, "No tokens produced"

    bigrams = build_bigrams(tokens)
    assert len(bigrams) > 0, "No bigrams built"

    model = normalize_bigrams(bigrams)
    assert len(model) > 0, "Model is empty"

    text = generate_text(model, "the", length=10)
    assert len(text.split()) > 0, "No text generated"

    print("All tests passed!")
    print(f"Generated: {text}")

test_pipeline()
```

### Lo que has construido

En cinco semanas, has construido un pipeline completo de PLN desde cero:

1. **Semana 1**: Cargaste un corpus CSV en Python
2. **Semana 2**: Tokenizaste texto y contaste frecuencias de palabras
3. **Semana 3**: Construiste y normalizaste tablas de probabilidad de bigramas
4. **Semana 4**: Implementaste muestreo aleatorio ponderado para la generación de texto
5. **Semana 5**: Ensamblaste todo en una herramienta CLI con control de temperatura

Este es el mismo pipeline fundamental que se usa en los modelos de lenguaje de producción, solo que con más datos, más parámetros y redes neuronales en lugar de tablas de bigramas. Las ideas centrales (tokenizar → contar → probabilidad → muestrear) son idénticas.

## Inténtalo

Ejecuta el generador completo con diferentes configuraciones y observa la salida:

```bash
python generate.py --start "the" --words 20 --temperature 0.5 --seed 1
python generate.py --start "the" --words 20 --temperature 1.0 --seed 1
python generate.py --start "the" --words 20 --temperature 1.5 --seed 1
```

Compara las salidas. ¿Qué temperatura produce el texto más legible?

## Conclusiones clave

- El pipeline completo: cargar → tokenizar → contar → bigramas → normalizar → generar
- `argparse` proporciona una interfaz de línea de comandos limpia con argumentos `--flag valor`
- El almacenamiento en caché del modelo con JSON evita reconstruirlo desde cero en cada ejecución
- Este pipeline refleja la arquitectura de los modelos de lenguaje reales, solo que a una escala diminuta

## Reto de práctica

Extiende la CLI con una bandera `--interactive` que entre a un bucle REPL:

```python
parser.add_argument("--interactive", action="store_true", help="Interactive mode")

# In main():
if args.interactive:
    print("Interactive mode. Type 'quit' to exit.")
    while True:
        word = input("Start word: ").strip()
        if word == "quit":
            break
        temp = float(input("Temperature (0.1-2.0): ") or "1.0")
        text = generate_text(model, word, args.words, temp)
        print(f"\n{text}\n")
```