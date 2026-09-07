---
title: "Constructeur de Sondages"
description: "Créez et analysez des sondages avec logique de branchement, collecte de réponses et analyse statistique."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["classes", "pandas", "statistics", "data-analysis"]
learningObjectives:
  - Modéliser les questions de sondage et la logique de branchement avec des classes
  - Collecter et stocker des données de réponse structurées
  - Calculer des distributions de fréquence et des tableaux croisés
  - Visualiser les résultats du sondage avec des graphiques en barres et des heatmaps
prerequisites:
  - "Les bases de Python (classes, listes, dicts)"
  - "Être à l'aise avec `input()` pour l'entrée terminal"
  - "pandas et matplotlib installés (couvert dans la Configuration)"
---

# 📋 Constructeur de Sondages

Les sondages sont partout — formulaires de retour, études de marché, évaluations de cours — et derrière chacun se cache un moteur structuré : types de questions, validation, branchement conditionnel et analyse. Ce projet construit ce moteur à partir de zéro : un ensemble de classes Python qui modélisent différents types de questions (choix multiple, échelles de notation, texte libre), un exécuteur qui enchaîne les questions avec une logique de branchement, et un pipeline pandas qui convertit les réponses brutes en graphiques de fréquence et tableaux croisés.

Cela suppose les bases de Python, y compris les classes, les listes et les dicts, ainsi qu'une aisance avec `input()` — rien au-delà. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Modéliser différents types de questions (choix multiple, échelle de notation, texte libre) comme des classes Python avec une validation et un comportement de branchement partagés.
2. Construire un exécuteur `Survey` qui enchaîne les questions, applique les règles de branchement et collecte les réponses.
3. Simuler des données de réponse réalistes quand `input()` n'est pas pratique pour des exécutions automatisées.
4. Convertir les réponses en DataFrame pandas et calculer les fréquences, moyennes et tableaux croisés.
5. Générer des graphiques en barres et des heatmaps qui rendent les résultats du sondage faciles à interpréter d'un coup d'œil.

## Où exécuter ceci

Ce projet tourne presque partout — pandas et matplotlib sont du Python pur, et la seule pièce interactive est `input()`, qui fonctionne dans n'importe quel terminal.

**Le playground JupyterLite** fonctionne bien — colle les cellules directement dans un notebook. Tu devras faire `!pip install pandas matplotlib` dans une cellule d'abord. Note que `input()` fonctionne différemment dans un notebook que dans un terminal — la fonction `simulate_responses()` de l'Étape 3 existe en partie à cause de cela.

**Google Colab** fonctionne clé en main — les deux bibliothèques sont préinstallées, et `input()` fonctionne nativement dans les notebooks.

**En local avec `uv`** est le chemin recommandé pour exécuter la vraie boucle de sondage interactive (Étape 2) où `input()` te demande question par question — suis la section Configuration ci-dessous.

## Configuration

Tout ce dont tu as besoin avant d'écrire une question de sondage.

### Installe `uv`

`uv` est un seul outil qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets » — il peut installer et gérer les versions de Python lui-même, en plus des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme que c'est installé :

```bash
uv --version
```

### Mets en place le projet

```bash
uv init survey-builder
cd survey-builder
uv add pandas matplotlib
```

`pandas` transforme les réponses brutes en DataFrame structuré pour les statistiques et les tableaux croisés ; `matplotlib` produit les graphiques. Les deux sont du Python pur (avec NumPy en dessous), donc ils s'installent proprement avec `uv`.

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `survey-builder/` existe avec un `pyproject.toml`, et `pandas` et `matplotlib` sont installés.
- ✅ `uv run python -c "import pandas, matplotlib; print('all good')"` affiche `all good`.

## Étape 1 : Définis les types de questions

Un sondage n'est pas un formulaire — c'est une série de questions différentes, chacune avec son propre format d'entrée, ses règles de validation et son comportement de branchement. Modéliser chaque type comme une classe te permet de partager les parties communes (affichage, validation, branchement) dans une classe de base tout en personnalisant les détails par type.

### 1.1 Crée la classe de base `Question` et deux sous-classes

```python
from dataclasses import dataclass, field
from typing import Any, Optional

@dataclass
class Question:
    text: str
    required: bool = True
    branch_rules: dict[str, str] = field(default_factory=dict)

    def display(self) -> None:
        print(f"\n  {self.text}")

    def validate(self, answer: Any) -> bool:
        return True

    def next_question_id(self, answer: Any) -> Optional[str]:
        return self.branch_rules.get(str(answer))

@dataclass
class MultipleChoice(Question):
    options: list[str] = field(default_factory=list)

    def display(self) -> None:
        print(f"\n  {self.text}")
        for i, opt in enumerate(self.options, 1):
            print(f"    {i}. {opt}")

    def validate(self, answer: str) -> bool:
        return answer in [str(i) for i in range(1, len(self.options) + 1)]

@dataclass
class RatingScale(Question):
    low_label: str = "Poor"
    high_label: str = "Excellent"
    scale_min: int = 1
    scale_max: int = 5

    def display(self) -> None:
        print(f"\n  {self.text}")
        print(f"    {self.scale_min} ({self.low_label}) — {self.scale_max} ({self.high_label})")

    def validate(self, answer: str) -> bool:
        try:
            return self.scale_min <= int(answer) <= self.scale_max
        except ValueError:
            return False

mc = MultipleChoice("How often do you exercise?", options=["Daily", "Weekly", "Monthly", "Rarely"])
rating = RatingScale("How satisfied are you?", low_label="Not at all", high_label="Very")
mc.display()
rating.display()
print(f"MC valid '2': {mc.validate('2')} | Rating valid '6': {rating.validate('6')}")
```

**👟 Indice de départ :** La classe de base `Question` ne fait que ce qui est commun à chaque question : stocker le texte, valider (trivialement, `True`), et chercher une règle de branchement. `MultipleChoice` et `RatingScale` en héritent et remplacent `display()` et `validate()` — exactement le motif d'héritage qui permet à un exécuteur `Survey` de traiter chaque question de la même façon. Remarque que `branch_rules` est un dict qui mappe une réponse à l'id de la question suivante.

**🎯 Résultat attendu :**
```
  How often do you exercise?
    1. Daily
    2. Weekly
    3. Monthly
    4. Rarely

  How satisfied are you?
    1 (Not at all) — 5 (Very)
MC valid '2': True | Rating valid '6': False
```

**🩹 Si ça ne marche pas :** Si `MultipleChoice.validate('2')` retourne `False`, vérifie que `options` a au moins 2 entrées — la validation construit `range(1, len(options)+1)`. Si `RatingScale.validate('6')` retourne `True`, c'est que `scale_max` n'est pas appliqué — confirme la conversion `int(answer)` et l'ordre de la comparaison `<=`.

### 1.2 Vérifie les classes de questions

**✅ Liste de vérification**

- ✅ `MultipleChoice.validate("2")` est `True`, `validate("5")` est `False` pour une question à 4 options.
- ✅ `RatingScale.validate("3")` est `True`, `validate("0")` et `validate("6")` sont tous deux `False`.
- ✅ Tu peux expliquer pourquoi `MultipleChoice` stocke les options comme une liste de chaînes plutôt que d'entiers.

**🤔 Question(s) socratique(s)**

- La classe `RatingScale` stocke `scale_min` et `scale_max` comme attributs de classe avec des valeurs par défaut. Si tu voulais une échelle de 1 à 10, que remplacerais-tu à l'instanciation — et `validate` aurait-il besoin de changer ?
- `MultipleChoice.validate` construit la liste des réponses valides à partir de `len(self.options)`. Que se passerait-il si tu avais 10 options — le code de validation devrait-il changer, ou s'adapte-t-il automatiquement ? Pourquoi ?

## Étape 2 : Construis l'exécuteur de sondage

Une `Question` isolée est inerte. La classe `Survey` les enchaîne, applique les règles de branchement pour décider quelle question vient ensuite, et collecte les réponses dans un objet `SurveyResponse` unique que tu pourras analyser plus tard.

### 2.1 Crée les classes `Survey` et `SurveyResponse`

```python
from dataclasses import dataclass
from typing import Any, Optional

@dataclass
class SurveyResponse:
    survey_title: str
    answers: dict[str, Any]
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            from datetime import datetime
            self.timestamp = datetime.now().isoformat()

class Survey:
    def __init__(self, title: str):
        self.title = title
        self.questions: dict[str, Question] = {}
        self.order: list[str] = []

    def add_question(self, q_id: str, question: Question) -> None:
        self.questions[q_id] = question
        self.order.append(q_id)

    def run(self) -> SurveyResponse:
        print(f"\n  Survey: {self.title}")
        answers: dict[str, Any] = {}
        idx = 0
        while idx < len(self.order):
            q_id = self.order[idx]
            question = self.questions[q_id]
            question.display()
            while True:
                answer = input("  Your answer: ").strip()
                if not question.required and answer == "":
                    break
                if question.validate(answer):
                    answers[q_id] = answer
                    break
                print("  Invalid answer, please try again.")
            branch = question.next_question_id(answer)
            idx = self.order.index(branch) if branch and branch in self.questions else idx + 1
        print("  Thank you for completing the survey!")
        return SurveyResponse(survey_title=self.title, answers=answers)
```

**👟 Indice de départ :** La boucle `while idx < len(self.order)` parcourt les questions dans l'ordre. Après chaque réponse, elle cherche `next_question_id(answer)` — si les règles de branchement disent « la réponse 2 saute à la question 'followup' », l'index saute là-bas ; sinon, il avance d'un. `SurveyResponse.__post_init__` appose un horodatage quand aucun n'est fourni — les dataclasses exécutent `__post_init__` juste après `__init__`, ce qui est l'endroit idiomatique pour une logique dépendante des valeurs par défaut.

**🎯 Résultat attendu :** Exécuter `Survey("Health Survey").run()` demande question par question et retourne un `SurveyResponse` avec les réponses collectées et un horodatage.

**🩹 Si ça ne marche pas :** Si l'exécuteur reste coincé dans une boucle infinie, `branch` pointe probablement vers un id de question qui n'est pas dans `self.questions` — le repli `else idx + 1` ne s'exécute que quand la branche est None ou introuvable, donc un id mal saisi dans `branch_rules` fait répéter la même question à la boucle. Si `input()` fait immédiatement une erreur dans un notebook, tu es dans une cellule non interactive — utilise à la place l'approche de simulation de l'Étape 3.

### 2.2 Vérifie l'exécuteur de sondage

**✅ Liste de vérification**

- ✅ `Survey.run()` se termine et retourne un `SurveyResponse` avec des clés correspondant à tes ids de questions.
- ✅ Une question obligatoire qui reçoit une réponse invalide redemande, n'acceptant jamais la mauvaise entrée.
- ✅ Une question facultative (`required=False`) accepte une réponse vide.

**🤔 Question(s) socratique(s)**

- L'exécuteur utilise une boucle `while idx < len(self.order)`, pas une boucle `for` sur `self.order`. Pourquoi une boucle `while` est-elle nécessaire quand une instruction de branchement peut faire sauter l'index en avant ou en arrière ?
- Si deux questions avaient le même texte d'affichage mais des ids différents, comment l'enregistrement du sondage les distinguerait-il ? Qu'est-ce que cela suggère sur pourquoi les ids de questions doivent être uniques ?

## Étape 3 : Collecte les réponses — en direct et simulées

Les vrais sondages ont besoin de nombreuses réponses, mais exécuter `input()` 30 fois dans un terminal est peu pratique. Cette étape construit les deux chemins : une boucle qui appelle `survey.run()` pour la collecte en direct, et une fonction `simulate_responses()` qui génère des réponses aléatoires réalistes pour que l'analyse ne dépende pas de quelqu'un assis devant un clavier.

### 3.1 Collecte les réponses en direct

```python
def collect_responses(survey: Survey, count: int) -> list[SurveyResponse]:
    responses = []
    for i in range(count):
        print(f"\n--- Participant {i + 1} of {count} ---")
        responses.append(survey.run())
    return responses
```

### 3.2 Simule les réponses pour une analyse automatisée

```python
def simulate_responses() -> list[dict]:
    import random
    return [{
        "exercise_freq": str(random.choice([1, 2, 3, 4])),
        "satisfaction": str(random.randint(1, 5)),
        "recommend": str(random.choice([1, 2, 3, 4, 5])),
        "feedback": random.choice(["Great service", "Needs improvement", "Excellent", "Could be better"]),
    } for _ in range(30)]

responses = simulate_responses()
print(f"Collected {len(responses)} simulated responses")
```

**👟 Indice de départ :** `collect_responses` est le chemin en direct — appelle-la avec un `Survey` et un compte et elle exécute le sondage autant de fois, chacune produisant un `SurveyResponse`. `simulate_responses` est le chemin automatisé — elle utilise `random` pour générer 30 réponses plausibles avec les mêmes clés que tes questions de sondage produiraient. Les clés doivent correspondre exactement à tes ids de questions, sinon l'étape pandas ci-dessous ne trouvera pas les bonnes colonnes.

**🎯 Résultat attendu :**
```
Collected 30 simulated responses
```

**🩹 Si ça ne marche pas :** Si `random.choice([1, 2, 3, 4])` retourne un int numpy qui casse le code en aval, les valeurs sont stockées comme chaînes (`str(...)`) — c'est délibéré. Si tu vois une `KeyError` en construisant le DataFrame plus tard, une réponse simulée manque d'une clé que tes questions de sondage produisent — vérifie que les clés du dict `simulate_responses` correspondent à tes ids de questions.

### 3.3 Vérifie la collecte des réponses

**✅ Liste de vérification**

- ✅ `simulate_responses()` retourne une liste de 30 dicts, chacun avec les mêmes quatre clés.
- ✅ Les valeurs de chaque réponse sont des chaînes (pas des entiers), correspondant à ce que `Survey.run()` produirait à partir de `input()`.
- ✅ `collect_responses` produit une liste d'objets `SurveyResponse` quand on lui donne un vrai `Survey`.

**🤔 Question(s) socratique(s)**

- Les réponses sont stockées comme chaînes (`"2"`, `"4"`) même si elles représentent des nombres. Pourquoi cela correspond-il à la réalité — que retourne `input()`, et comment le stocker brut préserve-t-il l'information ?
- `simulate_responses` utilise `random.choice` pour tout. À quoi ressemblerait la distribution si tu utilisais `random.randint(1, 4)` au lieu de `random.choice([1, 2, 3, 4])` ? Comment cela changerait-il l'analyse ?

## Étape 4 : Analyse les résultats avec pandas

Les données sont collectées — maintenant il faut en faire de l'intelligence. Cette étape convertit la liste de réponses en DataFrame, mappe les réponses numériques brutes en étiquettes lisibles, et calcule les fréquences et moyennes qui répondent à des questions comme « à quelle fréquence les gens font-ils de l'exercice ? » et « à quel point sont-ils satisfaits, en moyenne ? »

### 4.1 Convertit en DataFrame et calcule les statistiques

```python
import pandas as pd

df = pd.DataFrame(responses)

freq_map = {"1": "Daily", "2": "Weekly", "3": "Monthly", "4": "Rarely"}
df["exercise_label"] = df["exercise_freq"].map(freq_map)
exercise_counts = df["exercise_label"].value_counts()
satisfaction_counts = df["satisfaction"].value_counts().sort_index()

print("Exercise Frequency:")
print(exercise_counts)
print(f"\nAverage Satisfaction: {df['satisfaction'].astype(int).mean():.2f}")
```

**👟 Indice de départ :** `pd.DataFrame(responses)` transforme une liste de dicts en lignes et colonnes automatiquement. `.map(freq_map)` convertit le `"1"` brut en la chaîne lisible `"Daily"` — c'est l'étape classique de recherche/recodage dans l'analyse de sondage. `value_counts()` compte combien de fois chaque valeur apparaît, et `df[...].astype(int).mean()` calcule la moyenne numérique en convertissant d'abord la colonne de chaînes en entiers.

**🎯 Résultat attendu :**
```
Exercise Frequency:
Daily         <count>
Weekly        <count>
Monthly        <count>
Rarely        <count>
Name: exercise_label, dtype: int64

Average Satisfaction: <number between 1.0 and 5.0>
```

**🩹 Si ça ne marche pas :** Une `KeyError: 'exercise_freq'` signifie que `responses` n'a pas cette colonne — vérifie que les clés de `simulate_responses` correspondent exactement à `exercise_freq`, `satisfaction`, etc. Si `exercise_counts` est vide, `value_counts()` n'a trouvé que des valeurs NaN — vérifie si `df["exercise_freq"]` est None ou NaN dans certaines lignes. Si `.astype(int)` échoue, une valeur de réponse n'est pas une chaîne d'entier propre — vérifie les espaces ou caractères supplémentaires.

### 4.2 Construis un tableau croisé

```python
cross_tab = pd.crosstab(df["exercise_label"], df["satisfaction"])
print("\nExercise Frequency vs Satisfaction:")
print(cross_tab)
```

**🎯 Résultat attendu :** Un tableau de 4 lignes par 5 colonnes où chaque cellule est le nombre de répondants avec cette fréquence d'exercice et ce score de satisfaction.

**🩹 Si ça ne marche pas :** Si `pd.crosstab` retourne une erreur sur les index dupliqués, tu peux avoir des étiquettes d'exercice dupliquées — peu probable avec un `map` propre, mais vérifie les fautes de frappe dans `freq_map`. Si le tableau a des cellules NaN, `pd.crosstab` traite les combinaisons vides comme 0 par défaut — vérifie que tu ne regardes pas des données manquantes au lieu d'un vrai compte à zéro.

### 4.3 Vérifie l'analyse

**✅ Liste de vérification**

- ✅ `pd.DataFrame(responses)` crée un DataFrame avec les mêmes clés que les colonnes.
- ✅ `exercise_counts` montre une distribution de fréquence sur les quatre étiquettes — aucune étiquette n'est jamais manquante quand elle est représentée dans les données.
- ✅ `pd.crosstab(df["exercise_label"], df["satisfaction"])` produit un tableau non trivial (lignes > 1).

**🤔 Question(s) socratique(s)**

- `value_counts()` supprime les valeurs manquantes par défaut, tandis que `crosstab` traite une combinaison absente comme 0. Quand cette distinction compte-t-elle — peux-tu penser à un cas où tu *voudrais* qu'une ligne manquante reste manquante plutôt que de devenir 0 ?
- Si tu changeais l'échelle de satisfaction de 1-5 à 1-10, quel code casserait ? Le `crosstab` affichera automatiquement 10 colonnes — une autre étape aurait-elle besoin de changement ?

## Étape 5 : Visualise les résultats

Les nombres dans un DataFrame sont précis mais lents à absorber. Deux graphiques en barres — un pour la fréquence d'exercice, un pour la distribution de satisfaction — transforment les comptes en une image d'un coup d'œil.

### 5.1 Construis les graphiques

```python
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

colors_ex = ["#2ecc71", "#3498db", "#f39c12", "#e74c3c"]
exercise_counts.plot(kind="bar", ax=axes[0], color=colors_ex)
axes[0].set_title("Exercise Frequency")
axes[0].set_ylabel("Responses")
axes[0].tick_params(axis="x", rotation=45)

colors_sat = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"]
satisfaction_counts.plot(kind="bar", ax=axes[1], color=colors_sat[:len(satisfaction_counts)])
axes[1].set_title("Satisfaction Ratings")
axes[1].set_ylabel("Responses")

plt.tight_layout()
plt.savefig("survey_results.png", dpi=150)
plt.show()
```

**👟 Indice de départ :** `plt.subplots(1, 2, figsize=(12, 5))` crée une figure unique avec deux axes côte à côte. Chaque `Series.plot(kind="bar", ax=axes[n])` dessine sur un sous-plot spécifique ; les tableaux de couleurs sont ordonnés pour que la faible satisfaction soit rouge et la forte satisfaction soit verte — un choix visuel intentionnel qui correspond aux associations intuitives « rouge = mauvais, vert = bon ». `color=colors_sat[:len(satisfaction_counts)]` découpe la palette à la taille réelle du nombre de valeurs de notation présentes, donc un sondage où personne n'a choisi 5 ne montre pas de barre vide.

**🎯 Résultat attendu :** Deux graphiques en barres dans une figure : la fréquence d'exercice à gauche (4 barres colorées), les notations de satisfaction à droite (jusqu'à 5 barres colorées). La figure est enregistrée dans `survey_results.png` dans ton dossier de projet et affichée à l'écran.

**🩹 Si ça ne marche pas :** Une figure vide (sans barres) signifie que la Series que tu traces est vide — vérifie que `exercise_counts` et `satisfaction_counts` ont des données. Si le graphique de satisfaction ne montre que 3 couleurs mais 5 notations, c'est que `satisfaction_counts` a moins de 5 valeurs uniques — c'est de la donnée, pas un bug, et la découpe est ce qui garde la palette alignée. Si `plt.show()` ne montre rien dans un environnement sans affichage, le `savefig` a quand même écrit le fichier — vérifie celui-ci.

### 5.2 Vérifie la visualisation

**✅ Liste de vérification**

- ✅ `survey_results.png` existe dans ton dossier de projet (ou le notebook affiche la figure).
- ✅ Les deux sous-plots ont des titres (`Exercise Frequency`, `Satisfaction Ratings`) et des étiquettes d'axe y.
- ✅ Les barres de satisfaction utilisent un ordre de couleurs qui communique visuellement la satisfaction faible à forte.

**🤔 Question(s) socratique(s)**

- Les tableaux de couleurs sont codés en dur avec cinq codes hex. Que se passerait-il si tu exécutais le sondage avec une échelle de 10 points — les couleurs correspondraient-elles encore de façon sensée, ou devrais-tu les générer par programme ?
- `plt.savefig("survey_results.png")` écrit dans le répertoire courant. Qu'est-ce qui casserait si tu exécutais ce script depuis un répertoire de travail différent, et que te donne `Path(__file__).parent` à la place ?

## ⚠️ Pièges courants

- **Les ids de questions ne correspondent pas aux clés de réponse.** `Survey.run()` stocke les réponses sous les ids de questions que tu passes à `add_question`, et `simulate_responses()` retourne des dicts avec des clés codées en dur. Si l'id dans `add_question` est `"exercise_freq_x"` mais que la simulation utilise `"exercise_freq"`, ton DataFrame aura une colonne manquante. Garde les deux en phase — ou mieux, pilote les clés de simulation depuis le sondage lui-même.
- **La confusion chaîne vs entier.** `input()` retourne des chaînes, donc des commentaires comme « `6` n'est pas dans la plage » sont des comparaisons de chaînes. `df["satisfaction"].astype(int).mean()` convertit avant de moyenner ; une chaîne non numérique égarée (comme un blanc d'une question facultative) fait lever `.astype(int)`. Filtre ou remplis les NaN avant de convertir.
- **La boucle de branchement peut tourner pour toujours.** Si `branch_rules` mappe une réponse à un id de question qui n'est pas `in self.questions`, le `else idx + 1` ne se déclenche pas et l'exécuteur repose la même question. Les ids mal saisis sont la cause classique — garde une source unique de vérité pour les ids de questions.
- **La différence `value_counts` qui supprime les manquants vs `crosstab` qui compte 0.** Un répondant qui saute une question facultative disparaît de `value_counts()` mais apparaît comme compte 0 dans `crosstab` seulement si la catégorie existe ailleurs. Sache quel comportement ton analyse a besoin avant d'interpréter le graphique.

## Ce que tu viens de construire

Une plateforme de sondage complète : des classes de questions sûres avec validation, un exécuteur de sondage à branchement, une collecte de réponses en direct et simulée, et un pipeline d'analyse piloté par pandas qui transforme les réponses brutes en comptes de fréquence, moyennes, tableaux croisés et graphiques côte à côte. Tu as aussi appris le motif central de tout flux de travail d'analyse de données : brut → structuré → statistiques → visualisation.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/survey-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/survey-builder) dans le dépôt du cours est une version plus complète avec un heatmap de tableau croisé, des fonctions de filtrage des réponses (montre tous les pratiquants quotidiens et calcule leur satisfaction moyenne), et un branchement multi-niveaux. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute un heatmap de tableau croisé : utilise `pd.crosstab` + `matplotlib.imshow` (ou le `heatmap` de Seaborn) pour visualiser la fréquence d'exercice vs la satisfaction comme une grille de couleurs au lieu d'un tableau de nombres.
- Ajoute le filtrage des réponses : écris une fonction qui ne retourne que les répondants qui ont choisi une réponse spécifique (ex. tous les pratiquants quotidiens) et calcule leur satisfaction moyenne — le filtre révèle une intelligence de sous-groupe que l'agrégat manque.
- Étends le branchement multi-niveaux : quand la réponse A à la question 1 saute à la question X, et la réponse B à la question X saute à la question Y, ta logique `next_question_id` et `order.index(branch)` doit gérer des chaînes de branches, pas seulement des sauts uniques.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
