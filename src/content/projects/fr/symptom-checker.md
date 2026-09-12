---
title: "Vérificateur de Symptômes"
description: "Évaluation interactive des symptômes avec recommandations de santé et orientation pour visite médicale."
difficulty: "advanced"
estimatedMinutes: 75
tags: ["health", "cli", "domain-modeling"]
learningObjectives:
  - Modéliser une petite base de connaissances symptômes-conditions comme des données structurées
  - Noter les conditions par chevauchement pondéré des symptômes
  - "Calculer un score d'urgence borné à partir de la sévérité et de la durée"
  - Générer des recommandations de soins en langage courant, par bandes
  - Construire une CLI interactive avec une entrée de symptômes normalisée
prerequisites:
  - "Les bases de Python (fonctions, boucles, dictionnaires, ensembles)"
  - "Être à l'aise avec les dataclasses ou les dictionnaires simples pour les données de domaine"
  - "Gestion de base de l'entrée CLI (input et sys.argv)"
---

# 🛠️ 🩺 Vérificateur de Symptômes

Les vérificateurs de symptômes ont une mauvaise réputation pour de bonnes raisons : ils mélangent les vraies règles de triage avec une page d'accueil pleine d'issues les pires possibles. La version que tu construis ici contourne le drame en faisant la partie qu'un moteur peut faire *honnêtement*, faire correspondre les symptômes aux conditions avec un chevauchement pondéré, noter une bande d'urgence à partir de la sévérité et de la durée, et transformer cette bande en prochaines étapes en langage courant. C'est un moteur de règles sur une petite base de connaissances organisée, et il le dit : pas d'IA, pas de diagnostic, et un avertissement présent à chaque sortie.

Cela suppose Python 101 plus les dictionnaires et ensembles de base, rien au-delà n'est requis, et aucun paquet externe. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

> **À des fins éducatives uniquement.** Le résultat de ce projet n'est pas un avis médical, ne peut pas diagnostiquer, et doit toujours pointer vers un vrai clinicien. La construction enseigne la modélisation de domaine et les règles à plusieurs niveaux, les affirmations médicales s'arrêtent là où commence cet avertissement.

## 🎯 Ce que tu vas faire

1. Coder une base de connaissances organisée symptômes-vers-conditions comme des données, pas comme de la logique.
2. Noter les conditions par chevauchement pondéré des symptômes et classer les correspondances.
3. Combiner la sévérité et la durée en un score d'urgence 0-10 borné unique.
4. Mapper une bande d'urgence à des recommandations de soins en langage courant.
5. L'envelopper dans une CLI interactive avec une entrée de symptômes normalisée et un avertissement.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal. Le moteur est uniquement de la bibliothèque standard pure, donc `uv init` te fait démarrer immédiatement, et le mode `cli` interactif a besoin d'un vrai terminal (un script que tu exécutes, pas une cellule que tu exécutes) pour lire `input()`.

**Google Colab, Kaggle Notebooks et Binder** exécutent le moteur de notation à l'identique, les quatre étapes de notation sont de simples fonctions sur des données simples. L'honnêteté impose de préciser : l'interaction pilotée par `input()` est maladroite dans un notebook, donc ces chemins exécutent le mode *démo* seedé (la valeur par défaut de l'Étape 5) plutôt qu'un Q&R en direct. Utilise les badges pour voir le moteur fonctionner de bout en bout, et passe au `uv` local pour l'expérience interactive complète.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/symptom-checker/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/symptom-checker/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsymptom-checker%2Fnotebook.fr.ipynb)

## Configuration

Crée le projet. Le vérificateur n'a besoin que de la bibliothèque standard.

```bash
uv init symptom-checker
cd symptom-checker
```

```bash
uv run python -c "import sys, typing; print('ok')"
```

`sys` est utilisé par l'Étape 5 pour basculer entre les modes démo et interactif, et `typing` donne les signatures de fonctions plus petites (`dict[str, ...]`) qui gardent les données de domaine lisibles à mesure que la base de connaissances grandit au fil des étapes.

**✅ Liste de vérification**

- ✅ `uv init symptom-checker` a créé un dossier avec un `pyproject.toml`.
- ✅ `uv run python -c "import sys, typing"` affiche `ok`, zéro paquet ajouté.

## Étape 1 : Modélise la base de connaissances symptômes-conditions

Tout ce que ce vérificateur « sait » vit dans un seul dictionnaire. Garder les faits médicaux comme *données* plutôt que comme des instructions `if` est ce qui permet à la logique de notation de rester générique, ajoute une condition plus tard et le moteur la note avec zéro changement de code.

### 1.1 Code les conditions et leurs symptômes pondérés

**👟 Indice de départ :** Représente chaque condition comme un dict `symptôme → poids`, et donne à chaque symptôme une clé machine stable plus une étiquette lisible par un humain que la CLI peut afficher.

```python
# checker.py
KNOWLEDGE: dict[str, dict[str, int]] = {
    "Common cold":   {"cough": 3, "runny_nose": 3, "sore_throat": 2, "sneezing": 2, "fatigue": 1},
    "Seasonal allergies": {"sneezing": 3, "itchy_eyes": 3, "runny_nose": 3, "headache": 1},
    "Flu":           {"fever": 3, "body_aches": 3, "fatigue": 3, "cough": 2, "headache": 2},
    "Strep throat":  {"sore_throat": 3, "fever": 2, "swollen_lymph": 2},
    "Food poisoning": {"nausea": 3, "vomiting": 3, "diarrhea": 3, "stomach_pain": 2},
    "Migraine":      {"headache": 3, "light_sensitivity": 2, "nausea": 2},
    "UTI":           {"burning_urination": 3, "frequent_urination": 3},
    "Dehydration":   {"dry_mouth": 3, "dizziness": 2, "fatigue": 2, "headache": 1},
}

SYMPTOM_LABELS = {
    "cough": "cough", "runny_nose": "runny nose", "sore_throat": "sore throat",
    "sneezing": "sneezing", "fatigue": "fatigue", "itchy_eyes": "itchy eyes",
    "headache": "headache", "fever": "fever", "body_aches": "body aches",
    "swollen_lymph": "swollen glands", "nausea": "nausea", "vomiting": "vomiting",
    "diarrhea": "diarrhea", "stomach_pain": "stomach pain",
    "light_sensitivity": "light sensitivity", "burning_urination": "burning urination",
    "frequent_urination": "frequent urination", "dry_mouth": "dry mouth",
    "dizziness": "dizziness",
}

ALL_SYMPTOMS = {s for weights in KNOWLEDGE.values() for s in weights}
print(f"conditions: {len(KNOWLEDGE)}  distinct symptoms: {len(ALL_SYMPTOMS)}")
```

Deux formes de données font le vrai travail. Le `weight` par symptôme (1-3) code *à quel point* un symptôme pointe vers une condition, un 3 signifie « si typique qu'il est presque définitoire », un 1 signifie « apparaît mais non spécifique », donc une toux seule pousse moins vers la grippe que la fièvre. `SYMPTOM_LABELS` garde une clé machine stable (`"burning_urination"`) mappée à une phrase humaine, ce qui signifie que la CLI de l'Étape 5 peut afficher et accepter des symptômes sans jamais faire de correspondance de chaîne sur les mots que les gens pourraient taper. `ALL_SYMPTOMS` est dérivé de la base de connaissances elle-même plutôt que maintenu à la main, donc il ne peut pas dériver des données.

**🎯 Résultat attendu :** `conditions: 8  distinct symptoms: 19`.

**🩹 Si ça ne marche pas :** Si le compte est plus bas, un dict de condition manque ou deux clés de condition entrent en collision (espace vs underscore). Si `ALL_SYMPTOMS` fait une erreur, une valeur dans `KNOWLEDGE` n'est pas un dict, vérifie une chaîne égarée dans une condition. Si les comptes sont plus hauts, une condition contient une clé de symptôme qui n'est pas dans `SYMPTOM_LABELS`, que la CLI de l'Étape 5 refusera d'afficher.

### 1.2 Vérifie le modèle

**✅ Liste de vérification**

- ✅ `uv run python checker.py` affiche `conditions: 8  distinct symptoms: 19`.
- ✅ Chaque clé de symptôme dans `KNOWLEDGE` apparaît aussi comme clé dans `SYMPTOM_LABELS`.
- ✅ Tu peux décrire, dans tes propres mots, ce que le `3` à côté d'un symptôme *veut dire* comme décision de modélisation.

**🤔 Question(s) socratique(s)**

- Un éternuement pointe à peu près également vers les allergies et le rhume. Les deux sont notés 3 ci-dessus, quel changement de modélisation exprimerait « apparaît dans les deux, mais ne les distingue pas » ?
- Les poids sont des entiers. Que gagne l'utilisation de 1-3 par rapport à une simple liste binaire oui/non de symptômes, et quel *problème* un tel tableau de poids organisé par des experts crée-t-il pour un vrai produit médical quand de nouvelles preuves arrivent ?

## Étape 2 : Note les conditions par chevauchement pondéré

Maintenant le moteur décide : étant donné un petit ensemble de symptômes présents, vers quelles conditions pointe la preuve ? Le score est un ratio de la preuve typique de cette condition qui a correspondu, donc une correspondance partielle se classe sous une correspondance complète.

### 2.1 Classe les conditions par preuve correspondante

**👟 Indice de départ :** Pour chaque condition, additionne les poids des symptômes que l'utilisateur a, divise par le poids total de la condition, et trie par ordre décroissant, une compréhension, aucune logique branchée.

```python
# checker.py (continuation)
def score_conditions(present: set[str]) -> list[tuple[str, float]]:
    ranked = []
    for condition, symptom_weights in KNOWLEDGE.items():
        covered = sum(w for s, w in symptom_weights.items() if s in present)
        total = sum(symptom_weights.values())
        ratio = covered / total if total else 0.0
        ranked.append((condition, round(ratio, 2)))
    ranked.sort(key=lambda item: item[1], reverse=True)
    return ranked

demo = {"fever", "cough", "body_aches", "fatigue"}
for condition, ratio in score_conditions(demo):
    print(f"{ratio:>4.2f}  {condition}")
```

Le ratio est tout l'algorithme. `covered` compte les poids des symptômes *correspondants*, `total` est la signature complète de la condition, donc un utilisateur qui correspond à chaque symptôme pondéré d'une condition obtient exactement `1.0` et une correspondance partielle se situe entre les deux. Cette normalisation est la décision clé : une condition avec une grande signature (la grippe) est jugée par combien de *sa propre* preuve apparaît, pas par le nombre brut de symptômes, sinon la condition avec le plus de symptômes listés gagnerait toujours. `sorted(... reverse=True)` transforme les paires notées en une liste de classement que le reste du pipeline consomme.

**🎯 Résultat attendu :** `Flu` en premier à `1.00` (fièvre, courbatures, fatigue, toux sont exactement ses quatre premiers), `Common cold` en second, le reste en dessous.

**🩹 Si ça ne marche pas :** Si la grippe ne se classe pas première pour cet ensemble exact, un poids dans le dict de la grippe est mal saisi (ex. `cough` accidentellement 1). Si *tout* obtient `1.00`, c'est que `s in present` correspond mal parce que `present` contient des étiquettes alors que les clés de `KNOWLEDGE` sont des clés machine, garde `demo` en clés machine. Si les scores semblent minuscules, tu as divisé par le mauvais total et `covered`/`total` sont inversés.

### 2.2 Vérifie la notation

**✅ Liste de vérification**

- ✅ L'ensemble de démo classe `Flu` à `1.00`, `Common cold` en second.
- ✅ Un ensemble à un seul symptôme (`{"headache"}`) obtient un score *inférieur* à 1.0 pour chaque condition qui liste le mal de tête.
- ✅ Tu peux expliquer pourquoi la normalisation (diviser par le propre total de chaque condition) compte davantage quand les conditions diffèrent en taille de signature.

**🤔 Question(s) socratique(s)**

- `{"runny_nose", "sneezing", "itchy_eyes"}` devrait classer les allergies au-dessus du rhume, qui partage deux de ces symptômes. Fais le calcul du ratio et dis où les deux conditions divergent, et pourquoi une signature *plus courte* peut surclasser une plus longue.
- Cette notation ignore combien de temps les symptômes ont duré. Quel type de mauvaise décision un classeur aveugle à la durée prend-il, et est-ce un problème de notation ou un problème de notation-plus-urgence ?

## Étape 3 : Calcule un score d'urgence borné

Atteindre une liste de classement n'est pas atteindre une décision de triage. Cette étape ajoute les deux colonnes dont une vraie évaluation a besoin, à quel point chaque symptôme est sévère et combien de temps il a duré, et effondre tout en un score d'urgence 0-10 borné sur lequel les bandes de recommandation de l'Étape 4 peuvent agir.

### 3.1 Mélange la sévérité et la durée en un nombre

**👟 Indice de départ :** Commence par le ratio supérieur, ajoute de petites pénalités pour les symptômes sévères et pour les symptômes qui durent plus d'une semaine, et plafonne le résultat à 10, garde chaque contribution assez petite pour que la haute sévérité seule ne supplante jamais tout le reste.

```python
# checker.py (continuation)
WARNING_SYMPTOMS = {"difficulty_breathing", "chest_pain", "confusion", "faintish"}

def urgency_score(present: set[str], severities: dict[str, str],
                  durations_days: dict[str, float]) -> float:
    top_ratio = score_conditions(present)[0][1]
    base = top_ratio * 5
    severe_bonus = sum(1 for s in present if severities.get(s) == "severe") * 0.5
    chronic_bonus = sum(1 for s, d in durations_days.items() if d > 7) * 0.3
    warning_bonus = 4 if present & WARNING_SYMPTOMS else 0
    return round(min(10, base + severe_bonus + chronic_bonus + warning_bonus), 1)

demo_dur = {"fever": 2, "cough": 3, "body_aches": 1, "fatigue": 10}
demo_sev = {"fever": "high", "body_aches": "severe", "fatigue": "moderate"}
print("urgency:", urgency_score({"fever", "cough", "body_aches", "fatigue"},
                                demo_sev, demo_dur))
```

Chaque terme gagne sa place par ses paires. `base` évolue avec la force de la correspondance de preuve (le ratio de l'Étape 2 × 5, donc une correspondance parfaite commence à 5) ; `severe_bonus` et `chronic_bonus` ajoutent de petits incréments pour les symptômes signalés `severe` ou qui durent plus d'une semaine, délibérés et modérés pour qu'ils poussent, pas qu'ils dominent ; et `warning_bonus` est grand (4 points) parce que les quatre `WARNING_SYMPTOMS` signifient « cherche des soins urgents » indépendamment de toute correspondance de condition. Le plafond `min(10, …)` est ce qui rend la sortie un score *borné* auquel les bandes peuvent faire confiance. Remarque que `present & WARNING_SYMPTOMS` réutilise l'intersection d'ensembles, pas besoin de boucle pour demander « avons-nous un symptôme de drapeau rouge ? »

**🎯 Résultat attendu :** Un score unique entre 0 et 10, pour la démo ci-dessus, autour de `7.0-8.0`, car une correspondance grippe parfaite plus deux signes sévères/adjacents-au-drapeau-rouge atterrit dans la bande haute.

**🩹 Si ça ne marche pas :** Si le score dépasse 10, c'est que le plafond `min(10, …)` manque. Si il reste minuscule malgré les symptômes `severe`, c'est que `severities.get(s)` cherche des étiquettes de symptômes alors que `present` contient des clés machine. Si un cas *chronique mais léger* (un symptôme pendant 12 jours) surclasse un cas urgent, c'est que `warning_bonus` n'est pas ajouté, vérifie que les clés `WARNING_SYMPTOMS` correspondent à de vraies clés machine.

### 3.2 Vérifie le score d'urgence

**✅ Liste de vérification**

- ✅ La démo retourne un nombre strictement entre 0 et 10.
- ✅ Ajouter `"chest_pain"` à `present` augmente le score du même cas d'au moins 3.
- ✅ Les mêmes symptômes avec des durées plus courtes obtiennent un score plus bas qu'avec des plus longues.

**🤔 Question(s) socratique(s)**

- `warning_bonus` est un +4 plat quel que soit le symptôme d'avertissement qui apparaît. Pondérer chaque avertissement (ex. `difficulty_breathing` vaut plus que `faintish`) améliorerait-il l'honnêteté des bandes, et que cela coûterait-il en simplicité ?
- Le score est une somme de termes conçus indépendamment. Quel score un utilisateur obtiendrait-il avec *aucune* condition correspondante mais un symptôme d'avertissement sévère, et est-ce la réponse que tu veux qu'une bande de triage produise ?

## Étape 4 : Mappe les scores en recommandations en langage courant

Un score sans message est un nombre sur lequel une personne inquiète ne peut pas agir. Cette étape divise la plage 0-10 en quatre bandes, chacune liée à une prochaine étape concrète, et génère un résumé lisible depuis la condition la mieux classée plus la bande.

### 4.1 Écris le bandage des soins et le résumé

**👟 Indice de départ :** Définis les bandes par borne supérieure dans une liste ordonnée, parcours-la pour trouver la bande dans laquelle le score tombe, puis compose un résumé d'un paragraphe depuis la condition supérieure, le score et cette bande.

```python
# checker.py (continuation)
BANDS = [
    (8.0, "Seek urgent or emergency care now. Call your local emergency line."),
    (5.0, "Book an appointment with a doctor within 24 hours."),
    (3.0, "Monitor for 24-48 hours. Hydrate and rest; book a visit if it worsens."),
    (0.0, "Likely self-care. Rest, hydrate, and re-check if symptoms change."),
]

def recommendation(score: float) -> str:
    for cutoff, message in BANDS:
        if score >= cutoff:
            return message
    return BANDS[-1][1]

def summarize(present: set[str], severities: dict[str, str],
              durations_days: dict[str, float]) -> str:
    ranked = score_conditions(present)
    top_condition, _ = ranked[0]
    score = urgency_score(present, severities, durations_days)
    lines = [
        f"Top match: {top_condition}",
        f"Urgency score: {score}/10",
        "Next step: " + recommendation(score),
        "Consult a qualified health professional before acting on this.",
    ]
    return "\n".join(lines)

print(summarize(demo, demo_sev, demo_dur))
```

Le bandage garde la prudence médicale *dans les données*, pas dispersée dans des `if`. Chaque bande déclare une borne inférieure et une action ; `for` parcourt la liste en ordre décroissant et la première borne que le score franchit gagne, donc 9.5 atteint les soins urgents, 4.2 atteint « dans les 24 heures », et 2.5 atterrit dans surveiller/auto-soins. La ligne d'avertissement de clôture dans `summarize` est délibérée, pas décorative : chaque chemin hors de ce moteur, bande haute ou basse, la porte, parce que le moteur de règles qui a classé les conditions a exactement zéro autorité médicale.

**🎯 Résultat attendu :** Un bloc de 4 lignes nommant `Flu`, un score sur 10, un seul message de bande correspondant, et l'avertissement de consultation.

**🩹 Si ça ne marche pas :** Si un score de 9.9 route vers « auto-soins », c'est que la liste `BANDS` est ordonnée par ordre croissant et `score >= cutoff` atteint la borne basse d'abord. Si le score s'affiche mais que le message dit `None`, c'est que `recommendation` est tombé à travers sans retour, vérifie que la boucle couvre chaque score possible, avec la ligne `(0.0, …)` en dernier comme plancher. Si la condition supérieure semble fausse, `ranked[0]` dépaquète une liste non triée.

### 4.2 Vérifie le bandage

**✅ Liste de vérification**

- ✅ Les scores ≥ 8 mappent vers les soins urgents, ≥ 5 vers un rendez-vous sous 24 h, ≥ 3 vers la surveillance, en dessous vers l'auto-soin.
- ✅ Le résumé se termine toujours par la ligne d'avertissement de consultation.
- ✅ Tu peux expliquer ce que la structure de bandes achète par rapport à un score nu.

**🤔 Question(s) socratique(s)**

- Les bandes ont des bornes nettes, donc 4.9 dit « prends rendez-vous » et 5.0 dit la même chose, mais 5.0 déclenche aussi le *même* texte que 7.9. De quelle information ces deux utilisateurs ont-ils réellement besoin de diverger, et une bande de plus réglerait-elle cela ?
- Les vrais systèmes de triage utilisent des combinaisons `AND`/`OR` (fièvre ET éruption) plutôt que des scores purs. Où dans ce pipeline insérerais-tu une règle qui *remplace* le score, et pourquoi la logique médicale de premier niveau devrait-elle vivre en dehors du bandage numérique ?

## Étape 5 : Construis la CLI interactive

La dernière étape connecte tout à une personne : la CLI liste le catalogue, laisse l'utilisateur choisir des symptômes dans un menu numéroté, collecte sévérité et durée pour chacun, exécute tout le pipeline et affiche le résumé. Une valeur par défaut `demo` garde le script exécutable sans taper.

### 5.1 Ajoute la gestion d'entrée et une démo par défaut

**👟 Indice de départ :** Numérote les `SYMPTOM_LABELS` pour le menu, accepte des nombres séparés par des virgules, retraduis-les en clés machine, puis appelle `summarize`. Garde le chemin interactif derrière un argument `cli` explicite pour que l'exécution par défaut reste non interactive.

```python
# checker.py (continuation)
import sys

def run_cli() -> None:
    order = sorted(SYMPTOM_LABELS)
    print("Which symptoms? Enter numbers, comma-separated:")
    for i, key in enumerate(order, 1):
        print(f"  {i:>2}. {SYMPTOM_LABELS[key]}")

    raw = input("> ")
    try:
        picks = [int(x.strip()) for x in raw.split(",")]
    except ValueError:
        print("Please enter numbers like: 1, 3, 7"); return

    present = {order[p - 1] for p in picks if 1 <= p <= len(order)}
    if not present:
        print("No valid symptoms selected. Nothing to score."); return

    severities = {}
    durations_days = {}
    for key in present:
        sev = input(f"{SYMPTOM_LABELS[key]} severity (mild/moderate/severe): ").strip().lower()
        dur = input(f"{SYMPTOM_LABELS[key]} duration in days: ").strip()
        severities[key] = sev if sev in {"mild", "moderate", "severe"} else "moderate"
        try:
            durations_days[key] = float(dur)
        except ValueError:
            durations_days[key] = 1.0

    print("\n" + summarize(present, severities, durations_days))

def run_demo() -> None:
    severity = {"fever": "high", "body_aches": "severe", "fatigue": "moderate", "cough": "moderate"}
    duration = {"fever": 2, "cough": 3, "body_aches": 1, "fatigue": 10}
    print(summarize(demo, severity, duration))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "cli":
        run_cli()
    else:
        run_demo()
```

Le menu fait de l'*assainissement* d'entrée à trois endroits délibérés : `int(x.strip())` convertit les nombres tapés et ignore les espaces, `if 1 <= p <= len(order)` supprime silencieusement les choix hors plage au lieu de planter, et les mauvaises réponses de sévérité/durée retombent sur des valeurs par défaut enregistrées (`moderate`, `1 day`) plutôt que d'abandonner la session. Le chemin `demo` existe parce qu'un notebook, une exécution CI ou une première lecture a besoin d'un moyen zéro-entrée d'exercer tout le pipeline, le mode `cli` interactif a besoin d'un vrai humain devant un vrai clavier.

**🎯 Résultat attendu :** Exécuter `uv run python checker.py` affiche le résumé de démo (aucune entrée nécessaire). Exécuter `uv run python checker.py cli` montre le menu numéroté, collecte tes réponses et affiche un résumé pour les symptômes que tu as choisis.

**🩹 Si ça ne marche pas :** Si le mode `cli` plante sur un choix non numérique, c'est que le garde-fou `except ValueError` autour de la compréhension de liste manque. Si les clés du menu ne correspondent pas aux symptômes notés, c'est que `order` (depuis `SYMPTOM_LABELS`) et les clés machine de `KNOWLEDGE` divergent, le contrôle de l'Étape 1 aurait dû le détecter. Si `input()` bloque pour toujours dans un notebook, tu es dans le chemin interactif sans clavier, reste sur la démo sans argument là-bas.

### 5.2 Vérifie la CLI de bout en bout

**✅ Liste de vérification**

- ✅ `uv run python checker.py` affiche le résumé de démo sans aucune entrée.
- ✅ `uv run python checker.py cli` liste un menu numéroté, accepte des choix séparés par des virgules et affiche un résumé.
- ✅ Une entrée déchets comme `abc` ou `99` ne plante pas la CLI, elle avertit et continue.
- ✅ Exécuter les deux modes se termine par l'avertissement de consultation.

**🤔 Question(s) socratique(s)**

- Les utilisateurs taperont le même symptôme comme « sore throat », « Sore Throat » et « throat ». Le menu contourne cela avec des nombres, quel est le coût de ce nettoyage, et comment un matcheur de texte flou introduirait-il de *nouveaux* risques ici que les nombres n'ont pas ?
- Le chemin de démo est par défaut et le chemin interactif est opt-in. Dans un outil adjacent à la sécurité, pourquoi défaut-à-la-moindre-interactivité déterministe est-il le choix défendable, et qu'est-ce qui te tenterait de l'inverser ?

## ⚠️ Pièges courants

- **Mélanger les étiquettes humaines et les clés machine.** Les utilisateurs tapent « itchy eyes », la base de connaissances stocke `itchy_eyes` ; faire correspondre `s in present` contre l'un et afficher l'autre produit des non-correspondances silencieuses. Correction : garde `SYMPTOM_LABELS` comme seule traduction humain↔machine et ne donne jamais le texte brut de l'utilisateur à la notation.
- **Des scores qui dépassent 10 ou dérivent sans borne.** Chaque terme dans `urgency_score` doit être remboursé par un plafond `min(10, …)`, sinon un cas longue-durée + sévère fait exploser la plage conçue du bandage et un « score » de 12.4 correspond silencieusement à la bande urgente.
- **Un classement qui ignore la durée.** Un `{"headache"}` pendant 9 jours se classe comme un `{"headache"}` frais, le score ne peut pas expliquer un *n'importe quoi* chronique. Le terme `chronic_bonus` existe précisément pour que « dure plus d'une semaine » fasse bouger le score.
- **Des bornes de bande ordonnées dans le mauvais sens.** Si `BANDS` est croissant, un score élevé atteint la mauvaise bande (la première). Garde-les décroissantes et laisse le premier `score >= cutoff` gagner, comme à l'Étape 4.
- **Traiter le ratio supérieur comme un diagnostic.** Le moteur fait correspondre des symptômes à des motifs connus ; le chevauchement n'égale pas la causalité, et la ligne d'avertissement doit survivre à chaque chemin de code. Retire-la d'un seul résumé et tu dépasses ce qu'un moteur de règles peut prétendre.

## Ce que tu viens de construire

Un moteur de triage des symptômes fonctionnel avec un vrai modèle de données, une base de connaissances pondérée, des scores de correspondance normalisés, un score d'urgence borné mélangeant sévérité et durée, quatre bandes de soins, et une CLI interactive assainie, tout en Python pur avec un avertissement derrière chaque recommandation. La compétence transférable est *transformer la connaissance de domaine en structures de données notées* : le même motif chevauchement-pondéré-et-bande se généralise à la correspondance d'emplois, à la notation de quiz, au gating de fonctionnalités, et à tout endroit où un produit doit classer des options contre une preuve partielle.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/symptom-checker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/symptom-checker) dans le dépôt du cours est une version plus complète du code ci-dessus, avec un catalogue de symptômes plus riche et la démo CLI pré-exécutée dans le notebook. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute un onglet *historique* des symptômes : suis les scores de l'utilisateur sur la dernière semaine de réponses et fais remonter « va mieux / va moins bien » comme une bande à part entière.
- Laisse les utilisateurs taper une localisation corporelle (tête, gorge, ventre) et filtre le menu aux symptômes de cette zone, un simple champ de catégorie sur chaque condition.
- Persiste les conditions dans un `conditions.json` séparé que le moteur charge au démarrage, pour qu'ajouter une condition n'exige jamais d'éditer le code de notation.
- Écris un petit `test_checker.py` épinglant le score de cinq cas choisis à la main (y compris les deux exemples des questions de l'Étape 3), pour qu'un futur refactor ne puisse pas changer silencieusement les résultats de triage.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
