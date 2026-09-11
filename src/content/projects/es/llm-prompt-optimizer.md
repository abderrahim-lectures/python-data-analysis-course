---
title: "Optimizador de Prompts LLM"
description: "Refina prompts automáticamente usando pruebas A/B, ejemplos few-shot y patrones de cadena de pensamiento."
---

# ✨ Construye un Optimizador de Prompts LLM

Un prompt mediocre obtiene respuestas mediocres. Los ingenieros a menudo ajustan los prompts a mano por prueba y error, pero eso es lento e irrepetible. Este proyecto construye una herramienta CLI que toma un prompt crudo, genera varias variantes estructuradas (few-shot, cadena de pensamiento, basada en roles), las puntúa contra un conjunto de respuestas dorado y reporta qué variante rinde mejor.

Esto asume Python 101 y comodidad con pandas de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias de optimización.
2. Definir un arnés de puntuación con entradas de prueba y respuestas esperadas.
3. Generar variantes de prompt: few-shot, cadena de pensamiento y basada en roles.
4. Puntuar cada variante contra el conjunto de oro.
5. Ordenar las variantes y exportar el mejor prompt.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — es una herramienta CLI que se ejecuta fuera de línea contra un modelo mock.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/llm-prompt-optimizer/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/llm-prompt-optimizer/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fllm-prompt-optimizer%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de construir: un entorno de Python, pandas y click. El proyecto se ejecuta contra un modelo mock para que todo el bucle funcione fuera de línea, sin llaves de API.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Configura el proyecto

```bash
uv init llm-prompt-optimizer
cd llm-prompt-optimizer
uv add pandas click
```

### Crea la estructura del proyecto

```bash
mkdir -p optimizer
touch optimizer/__init__.py optimizer/data.py optimizer/variants.py optimizer/model.py optimizer/scoring.py optimizer/cli.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `llm-prompt-optimizer/` existe con un `pyproject.toml` y las dependencias instaladas.
- ✅ El directorio `optimizer/` tiene todos los archivos de módulo requeridos.

## Paso 1: Define el conjunto de datos de oro

Para puntuar prompts necesitas entradas de prueba con respuestas correctas conocidas. Este es el benchmark contra el que se miden tus variantes de prompt.

### 1.1 Crea el conjunto de oro

**👟 Pista inicial :** Crea `optimizer/data.py`.

```python
# optimizer/data.py
from dataclasses import dataclass

@dataclass
class Question:
    input: str
    expected: str

def gold_set() -> list[Question]:
    return [
        Question("What is 6 * 7?", "42"),
        Question("Capital of Japan?", "Tokyo"),
        Question("What is 9 + 4?", "13"),
        Question("How many sides does a triangle have?", "3"),
    ]
```

**🎯 Resultado esperado :** `gold_set()` devuelve cuatro preguntas con respuestas esperadas.

**🩹 Si sale mal :** Si las respuestas esperadas están mal, la puntuación no tiene sentido. Verifica que `6 * 7` es `42`.

### 1.2 Verifica el conjunto de oro

**✅ Lista de verificación**

- ✅ Todas las preguntas tienen entradas y respuestas esperadas no vacías.
- ✅ Las respuestas abarcan tanto categorías de matemáticas como de hechos.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué es importante que el conjunto de oro cubra más de un tipo de pregunta?

## Paso 2: Genera variantes de prompt

Diferentes estructuras de prompt provocan diferentes comportamientos. Genera algunas variantes estándar programáticamente.

### 2.1 Construye el generador de variantes

**👟 Pista inicial :** Crea `optimizer/variants.py`.

```python
# optimizer/variants.py
from dataclasses import dataclass

@dataclass
class PromptVariant:
    name: str
    build: object


def build_few_shot() -> PromptVariant:
    examples = (
        "Q: What is 2 + 2?\nA: 4\n"
        "Q: What is the capital of Italy?\nA: Rome\n"
    )
    def make(q: str) -> str:
        return f"{examples}Q: {q}\nA:"
    return PromptVariant("few-shot", make)


def build_chain_of_thought() -> PromptVariant:
    def make(q: str) -> str:
        return f"Think step by step.\nQ: {q}\nA:"
    return PromptVariant("chain-of-thought", make)


def build_role_based() -> PromptVariant:
    def make(q: str) -> str:
        return f"You are a precise mathematics and trivia assistant.\nQ: {q}\nA:"
    return PromptVariant("role-based", make)
```

**🎯 Resultado esperado :** Cada `build_*` devuelve una variante con nombre cuyo `build(prompt)` inyecta estructura alrededor de la pregunta cruda.

**🩹 Si sale mal :** Si las variantes se sienten idénticas, la estructura inyectada no está haciendo nada útil — amplía las diferencias.

### 2.2 Verifica las variantes

**✅ Lista de verificación**

- ✅ Las variantes `few-shot`, `chain-of-thought` y `role-based` existen.
- ✅ El constructor de cada variante acepta una cadena de pregunta y devuelve un prompt completo.

**🤔 Pregunta(s) socrática(s)**

- Los ejemplos few-shot están codificados. ¿Cuándo sería mejor seleccionar ejemplos automáticamente por entrada?

## Paso 3: Construye el modelo mock

Un modelo que responde correctamente cuando el prompt contiene una pista (como la palabra clave de la respuesta) te deja ver cómo la estructura del prompt cambia los resultados, fuera de línea.

### 3.1 Define el modelo

**👟 Pista inicial :** Crea `optimizer/model.py`.

```python
# optimizer/model.py
import re

class MockModel:
    name = "mock-llm"

    def generate(self, prompt: str) -> str:
        numbers = re.findall(r"(\d+)\s*[*+]\s*(\d+)", prompt)
        if numbers:
            a, b = numbers[-1]
            op = "*" if "*" in prompt else "+"
            a, b = int(a), int(b)
            return str(a * b) if op == "*" else str(a + b)
        if "capital" in prompt.lower():
            return "Tokyo"
        return "unknown"
```

El mock devuelve el resultado matemático cuando aparece una expresión aritmética y los hechos de una pequeña tabla de búsqueda. Es deliberadamente ingenuo — eso es suficiente para demostrar la optimización.

**🎯 Resultado esperado :** `MockModel().generate("Think step by step. Q: What is 6 * 7? A:")` devuelve `"42"`.

**🩹 Si sale mal :** Si la detección de `*`/`+` elige el operador equivocado, revisa que el regex capture ambos operandos.

### 3.2 Verifica el modelo

**✅ Lista de verificación**

- ✅ El modelo responde operaciones aritméticas desde el prompt.
- ✅ El modelo responde un hecho conocido.
- ✅ El modelo devuelve `"unknown"` para una entrada no reconocida.

**🤔 Pregunta(s) socrática(s)**

- ¿Cómo tendría que cambiar el mock para simular un modelo que mejora *con* cadena de pensamiento?

## Paso 4: Puntúa las variantes de prompt

Ejecuta cada variante contra el conjunto de oro y mide la precisión.

### 4.1 Implementa el puntuador

**👟 Pista inicial :** Crea `optimizer/scoring.py`.

```python
# optimizer/scoring.py
import re
import pandas as pd
from optimizer.data import Question


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def evaluate(variant, model, gold: list[Question]) -> dict:
    correct = 0
    total = len(gold)
    for q in gold:
        full = variant.build(q.input)
        answer = model.generate(full)
        if normalize(answer) == normalize(q.expected):
            correct += 1
    return {"variant": variant.name, "correct": correct, "total": total,
            "accuracy": correct / total}


def evaluate_all(variants, model, gold: list[Question]) -> pd.DataFrame:
    rows = [evaluate(v, model, gold) for v in variants]
    return pd.DataFrame(rows).sort_values("accuracy", ascending=False, kind="stable")
```

**🎯 Resultado esperado :** `evaluate_all([v1, v2, v3], model, gold_set())` devuelve un DataFrame que ordena las variantes por precisión.

**🩹 Si sale mal :** Si todo puntúa igual, las respuestas del mock no dependen de la estructura del prompt — eso está bien para la demo, pero añade una variante a la que el mock responda de manera diferente.

### 4.2 Verifica la puntuación

**✅ Lista de verificación**

- ✅ Cada variante tiene una precisión calculada.
- ✅ Los resultados se ordenan de mejor a peor.
- ✅ Cada variante se evalúa sobre el conjunto de oro completo.

**🤔 Pregunta(s) socrática(s)**

- La precisión sola confunde "nunca respondió" con "respondió mal". ¿Qué segunda métrica seguirías?

## Paso 5: Exporta el mejor prompt

La optimización solo es útil si cambia lo que realmente ejecutas. Exporta la mejor variante para su uso posterior.

### 5.1 Construye el exportador

**👟 Pista inicial :** Crea `optimizer/cli.py`.

```python
# optimizer/cli.py
import json
import click
from optimizer.data import gold_set
from optimizer.variants import build_few_shot, build_chain_of_thought, build_role_based
from optimizer.model import MockModel
from optimizer.scoring import evaluate_all


@click.command()
@click.option("--out", default="best_prompt.json", help="Output file")
def optimize(out: str):
    model = MockModel()
    variants = [build_few_shot(), build_chain_of_thought(), build_role_based()]
    result = evaluate_all(variants, model, gold_set())
    best = result.iloc[0]
    payload = {
        "best_variant": best["variant"],
        "accuracy": float(best["accuracy"]),
        "full_report": result.to_dict(orient="records"),
    }
    with open(out, "w") as f:
        json.dump(payload, f, indent=2)
    click.echo(click.style(f"Best: {best['variant']} ({best['accuracy']:.0%})", fg="green"))
```

**🎯 Resultado esperado :** Ejecutar `uv run python -m optimizer.cli` escribe `best_prompt.json` con la variante ganadora y el informe completo.

**🩹 Si sale mal :** Si no aparece ningún archivo de salida, revisa el directorio de trabajo y que `out` se resuelva ahí.

### 5.2 Verifica el CLI

**✅ Lista de verificación**

- ✅ `uv run python -m optimizer.cli` escribe `best_prompt.json`.
- ✅ El informe ordena todas las variantes por precisión.
- ✅ La mejor variante se identifica en la salida del terminal.

**🤔 Pregunta(s) socrática(s)**

- ¿Cómo reportarías desgloses por pregunta, no solo totales, para poder ver *cuáles* preguntas gana cada variante?

## ⚠️ Errores comunes

- **Imports circulares.** Un `optimizer/router.py` que importa tanto el modelo como las variantes puede bloquearse. Importa el modelo dentro de la función que lo necesita o mantén `cli.py` como el orquestador de nivel superior.
- **Mocks demasiado perfectos.** Un mock que responde todo perfectamente oculta las diferencias reales entre prompts. Haz que el mock responda a la estructura del prompt para que el optimizador realmente optimice.
- **Empates en la ordenación.** Si todas las variantes puntúan igual, la ordenación es arbitraria. Añade una métrica secundaria (por ejemplo, eficiencia de tokens) para romper los empates.
- **Ejemplos codificados.** Los ejemplos few-shot que filtran la respuesta del test ("what is 6*7 → 42") inflan la precisión. Mantén el conjunto de oro separado del conjunto few-shot.
- **Guard de `__main__`.** `app.run` y los puntos de entrada del CLI solo se ejecutan cuando el módulo se ejecuta directamente. Envuélvelos en `if __name__ == "__main__"` o ejecútalos con `python -m`.

## Lo que acabas de construir

Un bucle de optimización de prompts: un conjunto de datos de oro (gold), generadores de variantes programáticos (few-shot, cadena de pensamiento, basado en roles), un modelo mock fuera de línea, un puntuador de precisión y un CLI que ordena las variantes y exporta la mejor. Es la versión automatizada de lo que los ingenieros de prompts hacen a mano — y hace todo el proceso repetible y medible.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/llm-prompt-optimizer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/llm-prompt-optimizer) en el repositorio del curso tiene una versión más rica con adaptadores de modelos reales, puntuación de eficiencia de tokens y el CLI conectado de principio a fin. Clónalo, o abre el repositorio completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde allí.
:::

## A dónde ir desde aquí

- Apunta el optimizador a una API de LLM real para verlo optimizar en tareas genuinamente dependientes del modelo.
- Añade una métrica de recuento de tokens para poder preferir el prompt más barato que aún alcance la precisión objetivo.
- Construye una capa de versionado que registre cada variante de prompt y su puntuación, como un historial de git para prompts.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa y apta para principiantes sobre cómo añadir el tuyo mediante una **pull request**, incluso si nunca has usado git: hacer un fork del repositorio, crear una rama, hacer commit de tus archivos y abrir la PR, paso a paso. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓