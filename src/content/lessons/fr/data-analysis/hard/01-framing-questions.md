---

title: "Formuler les questions d'EDA"
description: "Transformer des problèmes métier vagues en questions analytiques structurées et testables qui guident toute votre analyse."
module: "eda-framework"
order: 1
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Transformer un énoncé de problème vague en questions d'EDA ciblées"
  - "Distinguer l'analyse descriptive, exploratoire et confirmatoire"
  - "Formuler des hypothèses testables à partir de questions analytiques"
  - "Construire une hiérarchie de questions qui structure tout le flux de travail EDA"
prerequisites: []
tags: ["eda", "formulation", "hypothèses", "questions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "Une partie prenante demande pourquoi les ventes baissent. Que devez-vous faire d'abord ?"
    options:
      - text: "Charger les données de ventes et tracer immédiatement une série temporelle"
      - text: "Demander quelle période et quelle catégorie de produits les intéressent"
        correct: true
      - text: "Exécuter un modèle de régression sur les données de ventes"
      - text: "Leur dire que les fluctuations de ventes sont normales"
  - question: "Quel type de question analytique demande si un cours pilote produit des scores plus élevés ?"
    options:
      - text: "Descriptive"
      - text: "Exploratoire"
      - text: "Confirmatoire"
        correct: true
      - text: "Prescriptive"
  - question: "Quel est l'intérêt d'une hiérarchie de questions dans une EDA ?"
    options:
      - text: "Rendre l'analyse plus professionnelle"
      - text: "Structurer l'analyse du général au spécifique"
        correct: true
      - text: "Réduire le nombre de questions"
      - text: "Éviter de consulter les parties prenantes"
---
Une bonne analyse commence par une question, pas par un graphique. Avant de charger un jeu de données, avant d'importer matplotlib, vous devez savoir ce que vous cherchez. Cette leçon vous apprend à transformer un problème métier vague en un ensemble structuré de questions analytiques qui guideront chaque décision de votre pipeline EDA.

## Concepts clés

### Du problème vague aux questions structurées

Une partie prenante dit « Les résultats des tests varient-ils selon le genre ? », cela ressemble à une question, mais c'est en réalité trop vaste pour être répondu directement. Les bonnes questions d'EDA sont spécifiques, mesurables et délimitées. Décomposez la question vague en couches :

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

### Trois types de questions analytiques

| Type | Objectif | Exemple |
|------|---------|---------|
| **Descriptive** | Résumer ce qui s'est passé | « Quelle est la note moyenne en lecture ? » |
| **Exploratoire** | Découvrir des schémas et des relations | « Le type de repas et la préparation aux tests sont-ils corrélés aux scores ? » |
| **Confirmatoire** | Tester une hypothèse spécifique | « La différence de score en maths entre les genres est-elle statistiquement significative ? » |

Une EDA solide parcourt les trois : décrire le paysage, explorer les schémas inattendus, puis confirmer les constats les plus importants.

### La hiérarchie des questions

Structurez vos questions en une hiérarchie qui reflète le flux de travail EDA :

1. **Question principale**, la question unique à laquelle l'analyse doit répondre
2. **Questions secondaires**, découpages et comparaisons qui appuient la question principale
3. **Questions tertiaires**, cas limites, facteurs de confusion et suites du type « et si X ? »

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

### Formulation d'hypothèses

Une fois vos questions posées, convertissez-les en hypothèses testables. Une bonne hypothèse est falsifiable et spécifique :

```python
# Weak hypothesis (not testable)
"Gender affects scores."

# Strong hypothesis (testable, specific)
"Female students score higher on reading and writing, while male students score higher on math, with effect sizes greater than 0.2 standard deviations."

# Null hypothesis (for confirmatory analysis)
"There is no statistically significant difference in mean math scores between male and female students (p > 0.05)."
```

### Documenter votre cadre de questions

Gardez vos questions visibles tout au long de l'analyse. Une simple liste de contrôle dans votre cahier vous tient honnête :

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

## Essayez-le

Ouvrez le bac à sable ci-dessous et entraînez-vous à formuler des questions pour un jeu de données que vous souhaitez explorer. Écrivez une question principale, trois questions secondaires et convertissez au moins l'une d'elles en hypothèse testable.

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

## Points clés à retenir

- Une bonne EDA commence par des questions, pas par du code, la qualité de vos questions détermine la qualité de votre analyse
- Décomposez les problèmes vagues en une hiérarchie : questions principale, secondaires et tertiaires
- Convertissez les questions en hypothèses falsifiables avant de commencer à calculer
- L'analyse descriptive, exploratoire et confirmatoire sert chacune un but différent ; une EDA solide utilise les trois
- Documentez votre cadre de questions et suivez celles auxquelles vous avez répondu

## Défi pratique

On vous donne un jeu de données appelé `housing.csv` avec les colonnes : `price`, `sqft`, `bedrooms`, `bathrooms`, `neighborhood`, `year_built`, `has_garage`.

Écrivez une question principale, trois questions secondaires et une hypothèse testable. Ensuite, écrivez un dictionnaire Python qui stocke votre hiérarchie de questions et l'affiche de manière formatée.

<details class="challenge">
<summary>🧩 Défi, réfléchissez d'abord, puis révélez</summary>
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