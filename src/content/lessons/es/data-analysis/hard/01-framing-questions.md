---

title: "Formulando Preguntas de EDA"
description: "Traduce problemas empresariales vagos en preguntas analíticas estructuradas y comprobables que guíen todo tu análisis."
module: "eda-framework"
order: 1
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Traducir un enunciado vago de problema en preguntas de EDA enfocadas"
  - "Distinguir entre análisis descriptivo, exploratorio y confirmatorio"
  - "Formular hipótesis comprobables a partir de preguntas analíticas"
  - "Construir una jerarquía de preguntas que estructure todo el flujo de trabajo del EDA"
prerequisites: []
tags: ["eda", "framing", "hypotheses", "questions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "Una parte interesada pregunta por qué han bajado las ventas. ¿Qué deberías hacer primero?"
    options:
      - text: "Cargar los datos de ventas y graficar una serie de tiempo de inmediato"
      - text: "Preguntar qué período de tiempo y categoría de producto les interesan"
        correct: true
      - text: "Ejecutar un modelo de regresión sobre los datos de ventas"
      - text: "Decirles que las fluctuaciones de ventas son normales"
  - question: "¿Qué tipo de pregunta analítica pregunta si un curso de prueba causa puntajes más altos?"
    options:
      - text: "Descriptiva"
      - text: "Exploratoria"
      - text: "Confirmatoria"
        correct: true
      - text: "Prescriptiva"
  - question: "¿Cuál es el propósito de una jerarquía de preguntas en el EDA?"
    options:
      - text: "Hacer que el análisis parezca más profesional"
      - text: "Estructurar el análisis de lo general a lo específico"
        correct: true
      - text: "Reducir la cantidad de preguntas"
      - text: "Evitar preguntar a las partes interesadas"
---
Un buen análisis comienza con una pregunta, no con un gráfico. Antes de cargar un conjunto de datos, antes de importar matplotlib, necesitas saber qué estás buscando. Esta lección te enseña a traducir un problema empresarial vago en un conjunto estructurado de preguntas analíticas que guiarán cada decisión en tu proceso de EDA.

## Conceptos clave

### Del problema vago a las preguntas estructuradas

Una parte interesada dice "¿Los puntajes de las pruebas de los estudiantes varían según el género?", eso suena como una pregunta, pero en realidad es demasiado amplia para responderla directamente. Las buenas preguntas de EDA son específicas, medibles y acotadas. Divide la pregunta vaga en capas:

```python
# Vague question
"Do student test scores vary by gender?"

# Layer 1 — scope the variable
"What is the distribution of math scores across the dataset?"

# Layer 2 — introduce the comparison
"How do math score distributions differ between male and female students?"

# Layer 3 — add depth
"Does the gender gap in math scores change across different ethnic groups?"

# Layer 4 — actionable insight
"Which subgroups show the largest performance gaps, and what interventions might address them?"
```

### Tres tipos de preguntas analíticas

| Tipo | Propósito | Ejemplo |
|------|---------|---------|
| **Descriptiva** | Resumir lo que sucedió | "¿Cuál es el puntaje promedio de lectura?" |
| **Exploratoria** | Descubrir patrones y relaciones | "¿El tipo de almuerzo y la preparación para el examen se correlacionan con los puntajes?" |
| **Confirmatoria** | Probar una hipótesis específica | "¿La diferencia en puntajes de matemáticas entre géneros es estadísticamente significativa?" |

Un EDA sólido avanza por los tres: describe el panorama, explora patrones inesperados y luego confirma los hallazgos más importantes.

### La jerarquía de preguntas

Estructura tus preguntas en una jerarquía que refleje el flujo de trabajo del EDA:

1. **Pregunta primaria**, la única pregunta que el análisis debe responder
2. **Preguntas secundarias**, desgloses y comparaciones que respaldan la primaria
3. **Preguntas terciarias**, casos límite, variables de confusión y seguimientos de "¿y qué hay de X?"

```python
# Example for Students Performance dataset

primary = "What factors most strongly predict student performance on exams?"

secondary = [
    "How do scores distribute across subjects (math, reading, writing)?",
    "Do gender and ethnicity interact to produce score differences?",
    "What role does parental education level play?",
    "Is test preparation course completion associated with higher scores?",
]

tertiary = [
    "Does lunch type (standard vs free/reduced) confound the ethnicity effect?",
    "Are the relationships linear or do they plateau?",
    "Do outliers represent data entry errors or genuine high performers?"
]
```

### Formulación de hipótesis

Una vez que tienes preguntas, conviértelas en hipótesis comprobables. Una buena hipótesis es falsable y específica:

```python
# Weak hypothesis (not testable)
"Gender affects scores."

# Strong hypothesis (testable, specific)
"Female students score higher on reading and writing, while male students score higher on math, with effect sizes greater than 0.2 standard deviations."

# Null hypothesis (for confirmatory analysis)
"There is no statistically significant difference in mean math scores between male and female students (p > 0.05)."
```

### Documentando tu marco de preguntas

Mantén tus preguntas visibles a lo largo del análisis. Una lista de verificación simple en tu notebook te mantiene honesto:

```python
eda_questions = {
    "primary": "What factors most strongly predict student performance?",
    "secondary": {
        "score_distributions": "How do scores distribute across subjects?",
        "gender_effects": "Do gender and ethnicity interact?",
        "parental_education": "What role does education level play?",
        "test_prep": "Is test preparation associated with higher scores?",
    },
    "status": {}  # track which questions you've answered
}

for q in eda_questions["secondary"]:
    print(f"  [ ] {q}")
```

## Inténtalo

Abre el playground de abajo y practica la formulación de preguntas para un conjunto de datos que quieras explorar. Escribe una pregunta primaria, tres preguntas secundarias y convierte al menos una en una hipótesis comprobable.

```python
# Your turn: frame EDA questions for a dataset of your choice
# Replace the example below with your own

my_dataset = "Students Performance in Exams"

primary_question = "What factors most strongly predict student performance?"
secondary_questions = [
    "How do scores distribute across subjects?",
    "Do demographic factors correlate with performance gaps?",
    "What is the effect of test preparation course completion?",
]

# Convert one to a hypothesis
hypothesis = (
    "Students who complete a test preparation course will score "
    "at least 5 points higher on average across all three subjects."
)

print(f"Primary: {primary_question}")
print("Secondary:")
for i, q in enumerate(secondary_questions, 1):
    print(f"  {i}. {q}")
print(f"\nHypothesis: {hypothesis}")
```

## Conclusiones clave

- Un buen EDA comienza con preguntas, no con código, la calidad de tus preguntas determina la calidad de tu análisis
- Divide los problemas vagos en una jerarquía: preguntas primaria, secundarias y terciarias
- Convierte las preguntas en hipótesis falsables antes de empezar a calcular
- El análisis descriptivo, exploratorio y confirmatorio cumplen propósitos diferentes; un EDA sólido usa los tres
- Documenta tu marco de preguntas y rastrea qué preguntas has respondido

## Desafío de práctica

Te dan un conjunto de datos llamado `housing.csv` con las columnas: `price`, `sqft`, `bedrooms`, `bathrooms`, `neighborhood`, `year_built`, `has_garage`.

Escribe una pregunta primaria, tres preguntas secundarias y una hipótesis comprobable. Luego escribe un diccionario de Python que almacene tu jerarquía de preguntas y la imprima formateada.

<details class="challenge">
<summary>🧩 Desafío, piensa primero, luego revela</summary>
<div class="challenge__body">

```python
eda_framework = {
    "dataset": "housing.csv",
    "primary": "What factors most strongly predict house price?",
    "secondary": [
        "How does price vary by neighborhood?",
        "Is there a linear relationship between sqft and price?",
        "Do bedrooms and bathrooms interact in their effect on price?",
    ],
    "hypothesis": (
        "Houses with a garage sell for at least 15% more than "
        "comparable houses without one, controlling for sqft and location."
    ),
}

for key, value in eda_framework.items():
    if isinstance(value, list):
        print(f"{key}:")
        for i, item in enumerate(value, 1):
            print(f"  {i}. {item}")
    else:
        print(f"{key}: {value}")
```

</div>
</details>