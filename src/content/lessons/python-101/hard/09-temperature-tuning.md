---

title: "Temperature Tuning"
description: "Modify sampling probabilities with a temperature parameter to control how creative or conservative the model's output is."
module: "cli-text-generator"
order: 9
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Implement a temperature parameter that scales log-probabilities before sampling"
  - "Understand how low temperature makes output more deterministic"
  - "Understand how high temperature makes output more random"
  - "Apply temperature scaling to the bigram model's probability distributions"
prerequisites: ["08-generate-text-impl"]
tags: ["python", "temperature", "sampling", "softmax", "text-generation"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "What does temperature do to sampling probabilities?"
    options:
      - text: "It makes all words equally likely"
      - text: "It sharpens or flattens the probability distribution"
        correct: true
      - text: "It only affects the most frequent word"
      - text: "It has no effect on output"
  - question: "What happens at temperature 0.1?"
    options:
      - text: "Very random output"
      - text: "Very predictable, repetitive output"
        correct: true
      - text: "Balanced output"
      - text: "No output at all"
  - question: "What happens at temperature 2.0?"
    options:
      - text: "Very predictable output"
      - text: "Very random, creative output"
        correct: true
      - text: "The same as temperature 1.0"
      - text: "An error occurs"
---
Controlling creativity

A language model with fixed probabilities always makes the same kind of output — it follows the corpus exactly. But sometimes you want more creative, surprising text, and sometimes you want the most predictable, safe output. **Temperature** is the knob that controls this trade-off.

## Key Concepts

### What is temperature?

Temperature is a number (usually between 0.1 and 2.0) that scales the model's probability distribution before sampling:

- **Low temperature** (e.g., 0.2): Sharpens the distribution — the most probable word becomes even more likely, and rare words become nearly impossible. Output is repetitive and predictable.
- **Temperature 1.0**: No change — the original probabilities are used as-is.
- **High temperature** (e.g., 1.5): Flattens the distribution — all words become more equally likely. Output is more random, creative, and potentially nonsensical.

### The math: scaling log-probabilities

Temperature works by dividing the log-probabilities by the temperature value, then converting back:

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

The `math.exp(s - max_scaled)` trick prevents overflow — without subtracting the maximum, the exponentials could be astronomically large.

### Example: three-word distribution

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

### Integrating with sample_next()

Modify the sampling function to accept a temperature parameter:

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

When `temperature=1.0`, the original probabilities are used unchanged. Lower values sharpen; higher values flatten.

### Temperature effects on generation

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

With low temperature, you'll see the same common phrases repeated. With high temperature, you'll get unusual word combinations that might not make grammatical sense.

### Practical temperature guidelines

| Temperature | Effect | Use case |
|-------------|--------|----------|
| 0.1–0.3 | Very deterministic | Reproducing known text |
| 0.5–0.7 | Conservative | Factual, safe output |
| 0.8–1.0 | Balanced | General-purpose generation |
| 1.0–1.5 | Creative | Brainstorming, creative writing |
| 1.5–2.0 | Very random | Experimental, surprising output |

For a tiny bigram model, temperatures above 1.2 often produce gibberish because the model doesn't have enough context to maintain coherence when randomness is high.

## Try It

Generate the same text at three different temperatures and compare:

```python
random.seed(42)
for temp in [0.3, 1.0, 1.5]:
    print(f"\n[temperature={temp}]")
    for _ in range(3):
        print(f"  {generate_text(model, 'the', length=12, temperature=temp)}")
```

Which temperature produces the most readable output? Which produces the most surprising?

## Key Takeaways

- Temperature scales probability distributions: low sharpens, high flattens
- Temperature 1.0 means no change to the original probabilities
- Implement by scaling log-probabilities: `log_prob / temperature`
- Low temperature (0.3–0.7) for predictable output; high (1.0+) for creative output

## Practice Challenge

Write a function `compare_temperatures(model, word, temps)` that generates text at each temperature and prints a comparison table:

```python
def compare_temperatures(model, word, temps=[0.3, 0.7, 1.0, 1.5], length=15):
    for temp in temps:
        random.seed(42)
        text = generate_text(model, word, length=length, temperature=temp)
        print(f"  T={temp:.1f}: {text}")
```
