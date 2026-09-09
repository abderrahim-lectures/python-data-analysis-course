---

title: "Principes de la narration de données"
description: "Transformer vos constats en un récit exploitable : structurer l'analyse, donner du contexte, dire le « et alors » et adapter le message à l'auditoire."
module: "storytelling-viz"
order: 8
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Structurer l'analyse pour produire des constats, pas seulement des sorties"
  - "Transformer les visualisations en preuves d'une thèse explicative"
  - "Déterminer le « et alors » de chaque conclusion en amont de l'analyse"
  - "Adapter les constats à l'auditoire (technique vs décisionnel)"
prerequisites: ["07-advanced-plots"]
tags: ["narration", "constats", "communication", "présentation"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "Qu'est-ce qu'un « constat daté » (dated finding) ?"
    options:
      - text: "Un constat véridique sans échéance gravée dans la donnée"
        correct: true
      - text: "Un constat associé à la date de l'analyse"
      - text: "Une observation unique d'une seule variable"
      - text: "Un constat inexploitable"
  - question: "À qui convient la superposition des analyses par couches, des tables de synthèse aux graphiques les plus grands ?"
    options:
      - text: "À l'auditoire décisionnel, qui préfère lire en diagonale les constats puis les détails"
        correct: true
      - text: "À l'auditoire technique, qui préfère les graphiques denses"
      - text: "Aux deux de manière égale"
      - text: "À aucun — les tables sont toujours pires que les graphiques"
  - question: "Savez-vous écrire un constat exploitable ?"
    options:
      - text: "Oui — un constat exploitable répond au « et alors » avec une action possible du décideur"
        correct: true
      - text: "Oui — il suffit de réciter les nombres de l'analyse"
      - text: "Oui — un constat exploitable décrit les variables en valeurs exactes"
      - text: "Non — les constats ne servent qu'à la compréhension du code"
---

Un graphique que personne ne lit est pire que pas de graphique du tout. La narration de données est la compétence qui transforme une analyse en idée qui change les décisions. Cette leçon couvre la structure narrative, les techniques d'annotation, les choix de couleurs et les principes de conception de tableaux de bord qui rendent vos visualisations convaincantes.

## Concepts clés

### L'arc narratif

Toute histoire de données suit une structure en trois parties :

1. **Situation** : quel est le contexte ? Que sait déjà l'auditoire ?
2. **Complication** : quel est le problème, la surprise ou la tension que révèlent les données ?
3. **Résolution** : que suggèrent les données de faire ?

```python
# Example narrative for Students Performance analysis
narrative = {
    "situation": "We analyzed exam scores for 1000 students across math, reading, and writing.",
    "complication": "Students who didn't complete test preparation scored 7-10 points lower on average.",
    "resolution": "Expanding test preparation access could close the performance gap."
}
```

### Concevoir avec l'annotation en premier

Les meilleurs graphiques s'expliquent d'eux-mêmes sans légende. Ajoutez des annotations directement sur le graphique :

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig, ax = plt.subplots(figsize=(10, 6))

# Box plot
sns.boxplot(data=df, x="test preparation course", y="math score", ax=ax, palette="Set2")

# Annotation: mean difference
mean_completed = df[df["test preparation course"] == "completed"]["math score"].mean()
mean_none = df[df["test preparation course"] == "none"]["math score"].mean()
diff = mean_completed - mean_none

ax.annotate(
    f"Average difference: +{diff:.1f} points",
    xy=(1, mean_completed),
    xytext=(0.5, mean_completed + 5),
    fontsize=12,
    fontweight="bold",
    color="darkgreen",
    arrowprops=dict(arrowstyle="->", color="darkgreen", lw=2),
    bbox=dict(boxstyle="round,pad=0.3", facecolor="lightyellow", edgecolor="darkgreen")
)

ax.set_title("Test Preparation Impact on Math Scores", fontsize=14, fontweight="bold")
ax.set_xlabel("Test Preparation Course")
ax.set_ylabel("Math Score")
plt.tight_layout()
plt.show()
```

### Choix des palettes de couleurs

La couleur n'est pas de la décoration — c'est de la communication. Choisissez les palettes selon le type de vos données :

```python
# Sequential: for ordered data (low to high)
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Sequential
sns.color_palette("Blues_r", n_colors=5)
axes[0, 0].bar(range(5), range(5), color=sns.color_palette("Blues_r", 5))
axes[0, 0].set_title("Sequential (ordered)")

# Diverging: for data with a meaningful midpoint
sns.color_palette("RdBu_r", n_colors=5)
axes[0, 1].bar(range(5), [3, 1, 4, 2, 5], color=sns.color_palette("RdBu_r", 5))
axes[0, 1].set_title("Diverging (midpoint)")

# Qualitative: for categorical data
sns.color_palette("Set2", n_colors=5)
axes[1, 0].bar(range(5), [4, 2, 5, 3, 1], color=sns.color_palette("Set2", 5))
axes[1, 0].set_title("Qualitative (categorical)")

# Custom palette
custom = ["#2E86AB", "#A23B72", "#F18F01", "#C73E1D", "#3B1F2B"]
axes[1, 1].bar(range(5), [3, 5, 2, 4, 1], color=custom)
axes[1, 1].set_title("Custom Brand Palette")

plt.tight_layout()
plt.show()
```

Règles de couleur :
- **Séquentielle** pour les valeurs numériques (plus foncé = plus élevé)
- **Divergente** lorsqu'on compare à un point médian (rouge = mauvais, bleu = bon)
- **Qualitative** pour les catégories (couleurs distinctes, sans ordre inhérent)
- **N'utilisez jamais la couleur comme seule encodage** — ajoutez toujours des étiquettes ou des motifs pour l'accessibilité aux personnes daltoniennes

### Conception des titres et sous-titres

Les bons titres énoncent l'idée, pas le type de graphique :

```python
# Bad title
ax.set_title("Math Score Distribution by Gender")

# Good title
ax.set_title("Female Students Score 6 Points Higher on Reading Tests")

# Even better: subtitle with context
fig, ax = plt.subplots(figsize=(10, 6))
fig.suptitle("Gender Gap Varies by Subject", fontsize=16, fontweight="bold", y=1.02)
ax.set_title("Female students outperform in reading (+6.2) and writing (+5.6),\n"
             "while male students lead in math (+3.2)", fontsize=11, style="italic")
```

### Structure d'un tableau de bord

Un tableau de bord est un ensemble de graphiques qui racontent une histoire cohérente. Structurez-le comme un récit :

```python
import matplotlib.gridspec as gridspec

fig = plt.figure(figsize=(16, 12))
gs = gridspec.GridSpec(3, 3, hspace=0.4, wspace=0.3, height_ratios=[0.5, 1.5, 1.5])

# Title banner
ax_title = fig.add_subplot(gs[0, :])
ax_title.axis("off")
ax_title.text(0.5, 0.5,
              "Students Performance in Exams — Key Findings",
              fontsize=18, fontweight="bold", ha="center", va="center",
              transform=ax_title.transAxes)
ax_title.text(0.5, 0.1,
              "Analysis of 1000 students across demographics and exam scores",
              fontsize=12, ha="center", va="center", style="italic",
              transform=ax_title.transAxes)

# Finding 1: Test prep impact
ax1 = fig.add_subplot(gs[1, 0])
sns.boxplot(data=df, x="test preparation course", y="math score",
            ax=ax1, palette="Set2")
ax1.set_title("Finding 1: Test Prep Boosts Scores", fontsize=10, fontweight="bold")

# Finding 2: Gender differences
ax2 = fig.add_subplot(gs[1, 1])
scores_by_gender = df.groupby("gender")[["math score", "reading score", "writing score"]].mean()
scores_by_gender.plot(kind="bar", ax=ax2, rot=0)
ax2.set_title("Finding 2: Gender Patterns by Subject", fontsize=10, fontweight="bold")
ax2.legend(fontsize=8)

# Finding 3: Lunch type matters
ax3 = fig.add_subplot(gs[1, 2])
sns.boxplot(data=df, x="lunch", y="math score", ax=ax3, palette="Set3")
ax3.set_title("Finding 3: Lunch Type Correlates with Scores", fontsize=10, fontweight="bold")

# Insight banner
ax_insight = fig.add_subplot(gs[2, :])
ax_insight.axis("off")
ax_insight.text(0.5, 0.5,
                "KEY INSIGHT: Test preparation and lunch type are the strongest predictors.\n"
                "Targeted interventions in these areas could improve outcomes for underserved students.",
                fontsize=14, ha="center", va="center",
                bbox=dict(boxstyle="round,pad=1", facecolor="lightyellow", edgecolor="orange"),
                transform=ax_insight.transAxes)

plt.tight_layout()
plt.show()
```

### Concevoir selon l'auditoire

Concevez pour votre auditoire :

| Auditoire | Ce qui les intéresse | Approche de conception |
|----------|---------------------|-----------------|
| Dirigeants | Résultats et actions à mener | Constats audacieux, détail minimal |
| Analystes | Méthode, reproductibilité | Code, statistiques, méthodologie |
| Grand public | Histoires claires et simples | Moins de graphiques, langage simple |

```python
# Executive-friendly: big numbers with context
fig, axes = plt.subplots(1, 3, figsize=(14, 4))

metrics = {
    "Avg Math Score": df["math score"].mean(),
    "Avg Reading Score": df["reading score"].mean(),
    "Test Prep Effect": diff,
}

for i, (label, value) in enumerate(metrics.items()):
    axes[i].text(0.5, 0.6, f"{value:.1f}", fontsize=48, fontweight="bold",
                 ha="center", va="center", transform=axes[i].transAxes)
    axes[i].text(0.5, 0.2, label, fontsize=14,
                 ha="center", va="center", transform=axes[i].transAxes, style="italic")
    axes[i].axis("off")

plt.suptitle("Students Performance Dashboard — Executive Summary", fontsize=16, fontweight="bold")
plt.tight_layout()
plt.show()
```

## Essayez-le

Créez un graphique annoté qui raconte une histoire de données sur le jeu de données Students Performance.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Story: Test preparation closes the gap
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle("Test Preparation Impact Across Subjects", fontsize=16, fontweight="bold")

for i, subject in enumerate(["math score", "reading score", "writing score"]):
    means = df.groupby("test preparation course")[subject].mean()
    diff = means["completed"] - means["none"]

    sns.boxplot(data=df, x="test preparation course", y=subject,
                ax=axes[i], palette="Set2")
    axes[i].set_title(subject.replace(" score", "").title())

    axes[i].annotate(
        f"+{diff:.1f} points",
        xy=(1, means["completed"]),
        xytext=(1.3, means["completed"] + 2),
        fontsize=11, fontweight="bold", color="darkgreen",
        arrowprops=dict(arrowstyle="->", color="darkgreen"),
        bbox=dict(boxstyle="round,pad=0.3", facecolor="lightyellow", edgecolor="darkgreen")
    )

plt.tight_layout()
plt.show()
```

## Points clés à retenir

- Suivez l'arc narratif : situation → complication → résolution
- Annotez directement les graphiques — le graphique doit s'expliquer de lui-même sans légende
- Choisissez les palettes de couleurs selon le type de données : séquentielle pour les données ordonnées, divergente pour la comparaison au point médian, qualitative pour les catégories
- Les titres doivent énoncer l'idée, pas le type de graphique
- Structurez les tableaux de bord comme des histoires : gros titre → preuves → conclusion
- Concevez pour votre auditoire — les dirigeants veulent des idées, les analystes veulent une méthodologie

## Défi pratique

Créez un tableau de bord à 3 panneaux qui raconte une histoire sur l'écart de genre dans les notes d'examen : (1) un graphique en barres groupées des notes moyennes par genre et par matière, (2) un box plot de l'écart de notes (maths moins rédaction) par genre et (3) une bande d'idée clé résumant le constat. Utilisez des annotations sur chaque graphique.

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig = plt.figure(figsize=(16, 10))
gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3, height_ratios=[1.5, 1])

# Panel 1: Grouped bar chart
ax1 = fig.add_subplot(gs[0, 0])
means = df.groupby("gender")[["math score", "reading score", "writing score"]].mean()
means.plot(kind="bar", ax=ax1, rot=0, colormap="Set2")
ax1.set_title("Average Scores by Gender and Subject", fontweight="bold")
ax1.set_ylabel("Mean Score")
ax1.legend(title="Subject")

# Panel 2: Score gap box plot
ax2 = fig.add_subplot(gs[0, 1])
df["math_writing_gap"] = df["math score"] - df["writing score"]
sns.boxplot(data=df, x="gender", y="math_writing_gap", ax=ax2, palette="Set1")
ax2.axhline(0, color="gray", linestyle="--", alpha=0.5)
ax2.set_title("Math-Writing Score Gap by Gender", fontweight="bold")
gap_means = df.groupby("gender")["math_writing_gap"].mean()
for i, gender in enumerate(["female", "male"]):
    ax2.annotate(
        f"Mean: {gap_means[gender]:+.1f}",
        xy=(i, gap_means[gender]),
        xytext=(i + 0.3, gap_means[gender] + 0.5),
        fontsize=10, fontweight="bold",
        arrowprops=dict(arrowstyle="->", color="black"),
    )

# Insight banner
ax_insight = fig.add_subplot(gs[1, :])
ax_insight.axis("off")
ax_insight.text(0.5, 0.5,
    "INSIGHT: Female students outperform in reading (+6.2) and writing (+5.6),\n"
    "while male students lead in math (+3.2). The math-writing gap is +8.8 for males\n"
    "and -5.0 for females — a 13.8 point swing. Interventions should target subject-specific gaps.",
    fontsize=13, ha="center", va="center",
    bbox=dict(boxstyle="round,pad=1", facecolor="lightyellow", edgecolor="orange"),
    transform=ax_insight.transAxes)

fig.suptitle("Gender Performance Gap — Data Story", fontsize=16, fontweight="bold", y=1.02)
plt.show()
```

</div>
</details>
