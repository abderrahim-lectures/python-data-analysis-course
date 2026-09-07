---
title: "Constructeur de Newsletters"
description: "Créez et envoyez des newsletters avec des modèles Markdown, gestion des abonnés et analytiques."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["markdown", "email", "templates", "data-management", "pandas"]
learningObjectives:
  - "Rendre des modèles Markdown avec la substitution {{variable}}"
  - "Gérer une liste d'abonnés CSV avec des tags et la segmentation"
  - "Suivre les ouvertures et les clics et calculer des taux d'ouverture/de clic honnêtes"
  - "Exécuter des tests A/B sur les objets et lire le gagnant"
  - "Rendre une édition personnalisée par abonné dans un segment"
prerequisites:
  - "Bases de Python (fonctions, boucles, dictionnaires)"
  - "Bases du CSV et installation de packages avec uv"
---

# 🛠️ 📰 Construire un Constructeur de Newsletters

Chaque liste d'e-mails fait face au même pipeline : prendre un modèle, le remplir pour chaque abonné, suivre qui a ouvert et cliqué, et découvrir quel objet fonctionne vraiment. Ce projet construit ce pipeline en Python — un moteur de modèles par regex, une liste d'abonnés CSV avec tags, un suivi d'ouvertures/clics qui calcule des taux honnêtes, un test A/B pour les objets, et une étape finale qui rend une édition personnalisée pour chaque abonné d'un segment.

Ceci suppose Python 101 et l'aisance avec les fonctions, les dictionnaires et les listes — tu rencontreras pandas dans une étape, mais rien au-delà n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Construire un moteur de modèles qui remplace les `{{placeholders}}` d'une newsletter Markdown par des valeurs d'un dictionnaire.
2. Gérer une liste d'abonnés CSV avec tags pour pouvoir t'adresser seulement aux lecteurs Python, pas à tout le monde.
3. Journaliser les ouvertures et les clics et calculer des taux d'ouverture/clic par rapport à la taille réelle de l'audience.
4. Exécuter un test A/B sur deux objets et choisir un gagnant à partir des données.
5. Rendre une édition personnalisée par abonné dans son propre fichier.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal. La seule dépendance externe est `pandas`, que tu utiliseras une fois, pour l'étape d'analytique — tout le reste est la bibliothèque standard (`re`, `csv`, `os`, `datetime`), et les fichiers CSV que tu génères sont des citoyens de première classe de ton propre dossier.

**Google Colab, Binder et Kaggle Notebooks** exécutent le tout à l'identique : `!pip install pandas` une fois, puis chaque étape ci-dessous, le notebook renvoyant les mêmes éditions rendues et tableaux d'analytique. **JupyterLite** peut exécuter les étapes de modèles et d'abonnés dans le navigateur, et pandas y est aussi disponible — l'avertissement honnête est le même que partout dans cette série : les fichiers créés dans le navigateur vivent sur un système de fichiers virtuel éphémère, donc considère-le comme un chemin d'essai et utilise `uv` en local quand tu veux que `subscribers.csv` et `issues/` persistent réellement.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/newsletter-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/newsletter-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fnewsletter-builder%2Fnotebook.ipynb)

## Configuration

Crée le projet et installe la seule dépendance que tu utiliseras pour l'analytique.

```bash
uv init newsletter-builder
cd newsletter-builder
uv add pandas
```

Les modules `re` et `csv` sont livrés avec Python, donc `pandas` est le seul package de ce projet — et il arrive exactement une fois, dans l'analytique de l'étape 3. Tout installer à l'avance garde les étapes suivantes concentrées sur les *idées* (modèles, suivi, tests) plutôt que sur les démarches de dépendances.

**✅ Liste de vérification**

- ✅ `uv add pandas` s'est terminé et `uv run python -c "import pandas"` sort en silence.
- ✅ Crée un projet vide `newsletter-builder/` qui exécute un script d'une ligne.

## Étape 1 : Rends un modèle Markdown

Une newsletter qui change pour chaque lecteur part d'un modèle avec des trous dedans. Les trous sont des placeholders `{{accolades}}`, et cette étape construit le minuscule moteur qui les échange contre de vraies valeurs — le cœur sans dépendance d'un système qui tirerait sinon une bibliothèque de modèles complète.

### 1.1 Écris la fonction de rendu

**👟 Indice de départ :** Utilise un seul appel `re.sub` avec un rappel qui cherche chaque placeholder dans un dictionnaire, et décide explicitement ce qui se passe quand un placeholder manque.

```python
# newsletter.py
import re

def render_template(template: str, variables: dict) -> str:
    """Replace {{variable}} placeholders with values from the variables dict."""
    def replacer(match):
        key = match.group(1).strip()
        return str(variables.get(key, f"[MISSING: {key}]"))

    return re.sub(r"\{\{(.+?)\}\}", replacer, template)

print(render_template(
    "Hello {{name}}, this is issue {{issue}}.",
    {"name": "Alice", "issue": "42"},
))
print(render_template("Hi {{name}}!", {}))
```

La ligne unique qui fait tout le travail est `re.sub(r"\{\{(.+?)\}\}", replacer, template)`. Le motif `\{\{(.+?)\}\}` correspond à une ouverture `{{`, capture tout ce qu'il y a dedans, puis se ferme au premier `}}` — le `.+?` est *non gourmand*, donc il s'arrête tôt au lieu d'avaler plusieurs placeholders d'un coup. Pour chaque correspondance, le rappel `replacer` cherche la clé capturée dans `variables`, et `str(...)` convertit les valeurs non-chaînes (comme l'entier `42`) pour que les modèles ne plantent jamais sur un nombre. Le repli explicite `variables.get(key, "[MISSING: {key}]")` est une décision de conception : une variable manquante devient un marqueur *visible* plutôt qu'un `None` silencieux.

**🎯 Résultat attendu :** Première impression : `Hello Alice, this is issue 42.` Deuxième impression : `Hi [MISSING: name]!`

**🩹 Si ça ne marche pas :** Si la sortie affiche `None` à la place des valeurs, le enveloppement `str()` manque sur la recherche. Si les placeholders survivent littéralement dans la sortie, les accolades échappées de la regex sont fausses — `\{\{` et pas `{{`. Si *chaque* variable affiche manquante, les clés de `variables` et les noms du modèle diffèrent (vérifie un espace égaré après `{{` — c'est pourquoi `.strip()` est là).

### 1.2 Rend une vraie édition depuis un modèle

**👟 Indice de départ :** Écris la newsletter comme une seule chaîne Markdown entre triples guillemets, donne-lui chaque placeholder du dict, et imprime l'édition entièrement rendue.

```python
# newsletter.py (continued)
from datetime import datetime

NEWSLETTER_TEMPLATE = """# {{title}}

**Issue #{{issue_number}}** | {{date}}

---

## Hello {{subscriber_name}}!

{{intro}}

### This Week's Highlights

{{highlights}}

### Featured Article

**{{article_title}}**

{{article_summary}}

---

*You received this because you subscribed to {{newsletter_name}}.*
*Unsubscribe: {{unsubscribe_url}}*
"""

variables = {
    "title": "Weekly Python Tips",
    "issue_number": "42",
    "date": datetime.now().strftime("%B %d, %Y"),
    "subscriber_name": "Reader",
    "intro": "Welcome to this week's edition of Python Tips. Here is what we covered.",
    "highlights": "- List comprehensions\n- Decorator patterns\n- Type hints deep dive",
    "article_title": "Understanding Decorators",
    "article_summary": "Decorators let you modify function behavior without changing the function itself.",
    "newsletter_name": "Python Tips Weekly",
    "unsubscribe_url": "https://example.com/unsubscribe",
}

rendered = render_template(NEWSLETTER_TEMPLATE, variables)
print(rendered)
```

Le modèle est des données, pas du code — il inclut même des puces Markdown à l'intérieur de `{{highlights}}`, parce que la valeur est insérée *textuellement* et que c'est le Markdown environnant qui lui donne sa structure. Le rendu et le contenu sont entièrement séparés : modifie le modèle, ajuste le dict, ou les deux, sans toucher à la fonction de rendu. La valeur `{{date}}` est calculée une fois, au moment du rendu, donc deux lecteurs de la même édition voient la même date.

**🎯 Résultat attendu :** Une édition Markdown complète imprimée sous un H1 `# Weekly Python Tips`, avec la date remplie, trois puces de points saillants, et le pied de page abonnement/désabonnement.

**🩹 Si ça ne marche pas :** Si la sortie contient un `{{...}}` brut, ce placeholder manque dans `variables` et le dictionnaire a une faute de frappe — le repli `[MISSING: ...]` de 1.1 te l'aurait dit, sauf si la clé diffère vraiment d'orthographe. Si les puces manquent, la valeur `highlights` ne contient pas les lignes jointes par `\n`.

### 1.3 Vérifie le moteur de modèles

**✅ Liste de vérification**

- ✅ Les placeholders inconnus se rendent en `[MISSING: key]`, jamais en `None`.
- ✅ Les valeurs non-chaînes (nombres, dates) se rendent sans erreur.
- ✅ Le modèle de newsletter complet se rend de bout en bout avec chaque placeholder rempli.

**🤔 Question(s) socratique(s)**

- Le motif utilise le `.+?` non gourmand. Que changerait dans la sortie rendue si tu écrivais `\{\{(.+)\}\}` (gourmand) à la place, dans un modèle contenant *deux* placeholders sur une même ligne ?
- Le repli pour une variable manquante est une chaîne visible `[MISSING: ...]`. Quand insérer silencieusement une chaîne vide est-il le comportement *meilleur* — et quel genre de bug de modèle ce choix cacherait-il ?

## Étape 2 : Gère les abonnés avec CSV

Une liste de personnes est une table plate : une ligne par abonné, quelques colonnes par ligne. Le CSV est le stockage honnête le plus simple pour cela — lisible par un humain, s'ouvre dans n'importe quelle feuille de calcul, et le module `csv` gère le citation pour toi. Cette étape construit des fonctions d'ajout/libération/segmentation autour d'un seul fichier d'abonnés.

### 2.1 Crée et ajoute des abonnés

**👟 Indice de départ :** Définis un ensemble fixe de noms de colonnes une seule fois, réutilise-le à la fois pour l'en-tête et pour chaque ligne, et laisse `datetime` estampiller la date d'abonnement.

```python
# newsletter.py (continued)
import csv
import os
from datetime import datetime

SUBSCRIBER_FIELDS = ["email", "name", "tags", "subscribed_at", "status"]

def create_subscriber_file(filepath: str = "subscribers.csv"):
    """Create a new subscriber CSV file with headers."""
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SUBSCRIBER_FIELDS)
        writer.writeheader()
    print(f"Created subscriber file: {filepath}")

def add_subscriber(email: str, name: str, tags: list[str], filepath: str = "subscribers.csv"):
    """Add a subscriber to the CSV file."""
    row = {
        "email": email,
        "name": name,
        "tags": ";".join(tags),
        "subscribed_at": datetime.now().isoformat(),
        "status": "active",
    }

    file_exists = os.path.exists(filepath)
    with open(filepath, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SUBSCRIBER_FIELDS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)
    print(f"Added subscriber: {email}")

create_subscriber_file()
add_subscriber("alice@example.com", "Alice", ["python", "data-science"])
add_subscriber("bob@example.com", "Bob", ["python", "web-dev"])
add_subscriber("carol@example.com", "Carol", ["data-science"])
```

La colonne `tags` stocke une liste comme chaîne jointe par des points-virgules, `";".join(tags)` — les cellules CSV sont plates, donc un champ à valeurs multiples doit être empaqueté d'une façon ou d'une autre, et `;` est choisi parce que les virgules sont déjà le séparateur de colonnes. La vérification `file_exists` est le détail de correction subtil : ajouter avec `"a"` à un fichier *existant* ne doit pas écrire une seconde ligne d'en-tête, tandis qu'un fichier *neuf* créé sans en-tête n'aurait aucun nom de colonne du tout. `csv.DictWriter` écrit les lignes selon les noms de colonnes, ce qui garantit que chaque ligne correspond à la forme de toutes les autres.

**🎯 Résultat attendu :** `Created subscriber file: subscribers.csv` suivi de trois lignes `Added subscriber: ...`, et un CSV dont l'en-tête est `email,name,tags,subscribed_at,status` avec trois lignes de données.

**🩹 Si ça ne marche pas :** Si le CSV a un en-tête après chaque ligne, chaque appel écrit des en-têtes parce que `file_exists` est évalué contre un chemin périmé ou que le fichier est supprimé entre les appels. Si un tag contient une virgule, `.join` n'a pas causé de casse *parce que le module csv cite ce champ* — mais si tu vois la ligne découpée, tu as construit la ligne à la main comme chaîne brute au lieu d'utiliser `DictWriter`. Si un horodatage manque, l'affectation `datetime.now().isoformat()` est absente du dict de ligne.

### 2.2 Charge et segmente la liste

**👟 Indice de départ :** Relis le fichier avec `csv.DictReader` et filtre en déballant les tags empaquetés — ou en comparant une seule colonne de statut.

```python
# newsletter.py (continued)
def load_subscribers(filepath: str = "subscribers.csv") -> list[dict]:
    """Load all subscribers from the CSV file."""
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r") as f:
        reader = csv.DictReader(f)
        return list(reader)

def filter_by_tag(subscribers: list[dict], tag: str) -> list[dict]:
    """Filter subscribers who have a specific tag."""
    return [s for s in subscribers if tag in s.get("tags", "").split(";")]

def filter_by_status(subscribers: list[dict], status: str) -> list[dict]:
    """Filter subscribers by status (active, unsubscribed, bounced)."""
    return [s for s in subscribers if s.get("status") == status]

subscribers = load_subscribers()
print(f"All subscribers: {len(subscribers)}")
print(f"Python subscribers: {len(filter_by_tag(subscribers, 'python'))}")
print(f"Data science subscribers: {len(filter_by_tag(subscribers, 'data-science'))}")
```

`csv.DictReader` transforme chaque ligne CSV en un dict indexé par les noms d'en-tête — l'inverse exact du `DictWriter` de 2.1, donc chargement et sauvegarde sont symétriques par construction. Les deux filtres sont de minuscules compréhensions de liste, mais ils s'appuient sur le choix d'empaquetage antérieur : `s.get("tags", "").split(";")` redéballe la chaîne stockée en liste pour que le test d'appartenance `in` soit par tag, pas une correspondance de sous-chaîne bâclée (qui ferait correspondre à tort « python » contre « python3🐍 »). Garder les filtres comme fonctions nommées séparées signifie que tu peux les composer — une étape ultérieure combine `filter_by_tag` et `filter_by_status` dans une seule expression.

**🎯 Résultat attendu :** `All subscribers: 3`, `Python subscribers: 2`, `Data science subscribers: 2` — Alice et Bob portent le tag `python`, Alice et Carol le tag `data-science`.

**🩹 Si ça ne marche pas :** Si « Python subscribers » affiche `0`, l'étape `.split(";")` manque et l'appartenance est testée contre la chaîne filaire brute. Si le chargement plante sur un fichier à l'en-tête inattendu, le fichier a été créé par autre chose que les fonctions de ce projet. Si les chargements renvoient une liste vide, le répertoire de travail diffère de l'endroit où vit `subscribers.csv` — des chemins absolus ou un chemin relatif fixe corrigent cela.

### 2.3 Vérifie la liste d'abonnés

**✅ Liste de vérification**

- ✅ Le CSV a exactement une ligne d'en-tête et trois lignes de données.
- ✅ `load_subscribers()` renvoie trois dicts, chacun avec les cinq champs.
- ✅ Le filtrage par tag renvoie 2, 1 ou 0 en correspondant exactement à la façon dont tu as tagué les gens.

**🤔 Question(s) socratique(s)**

- Les tags sont empaquetés avec `;`, et les filtres redéballe avec `.split(";")`. Qu'est-ce qui tournerait mal si un nom de tag *lui-même* contenait un point-virgule — et où dans le pipeline cette ambiguïté ferait-elle surface en premier ?
- `add_subscriber` n'écrit un en-tête que quand le fichier est neuf. Pourquoi cette branche est-elle meilleure que d'appeler toujours `create_subscriber_file()` d'abord — et qu'arrive-t-il aux sorties des deux fonctions si un appelant fait quand même les deux ?

## Étape 3 : Suis les ouvertures et les clics

Les fournisseurs d'e-mail rapportent les ouvertures et les clics parce qu'ils te disent si un objet valait la peine d'être lu. Ce projet n'envoie pas de vrais e-mails, donc tu journaliseras le même flux d'événements qu'un vrai expéditeur produit — abonné, édition, type d'événement, horodatage, URL — puis tu le reliras avec pandas pour calculer des taux qui veulent dire quelque chose.

### 3.1 Journalise les événements dans un CSV de suivi

**👟 Indice de départ :** Une fonction `log_event` ajoute une seule ligne à un fichier de suivi qui grandit — la même forme qu'un vrai service d'e-mail émettrait, juste écrite par toi.

```python
# newsletter.py (continued)
TRACK_FIELDS = ["subscriber_email", "newsletter_issue", "event_type", "timestamp", "url"]

def log_event(email: str, issue: str, event_type: str, url: str = "", filepath: str = "tracking.csv"):
    """Log an email event (open, click, bounce)."""
    row = {
        "subscriber_email": email,
        "newsletter_issue": issue,
        "event_type": event_type,
        "timestamp": datetime.now().isoformat(),
        "url": url,
    }

    file_exists = os.path.exists(filepath)
    with open(filepath, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=TRACK_FIELDS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)

def simulate_tracking(subscribers: list[dict], issue: str):
    """Simulate opens and clicks for demonstration purposes."""
    import random
    random.seed(42)

    for sub in subscribers:
        if random.random() < 0.7:  # 70% open rate
            log_event(sub["email"], issue, "open")
            if random.random() < 0.3:  # 30% of openers click the link
                log_event(sub["email"], issue, "click", "https://pyda.example/article")

simulate_tracking(subscribers, "Issue #42")
```

Le suiveur est en ajout-seul : chaque événement est une ligne, et les lignes ne sont jamais modifiées — c'est la forme d'un journal, et c'est ce qui rend l'analytique de 3.2 significative plus tard. `simulate_tracking` se substitue à un vrai expéditeur, et les appels à `log_event` qu'il fait sont exactement ce qu'un webhook de service de production produirait. `random.seed(42)` rend la simulation reproductible, donc les nombres que tu vois sont les nombres que chaque apprenant voit — ce qui rend le résultat attendu ci-dessous vérifiable plutôt que du feeling.

**🎯 Résultat attendu :** Un fichier `tracking.csv` créé avec les cinq en-têtes et plusieurs lignes d'événements : certains abonnés ont ouvert (et deux en plus ont aussi cliqué) l'édition « Issue #42 ».

**🩹 Si ça ne marche pas :** Si `tracking.csv` n'apparaît jamais, `simulate_tracking` n'a pas été appelé, ou le répertoire de travail a été recréé après la configuration. Si les événements n'ont pas d'horodatage, l'import `datetime` de l'étape 1 manque dans la portée de ce bloc. Si le fichier accumule des en-têtes dupliqués, la branche `file_exists` journalise dans un fichier existant mais écrit quand même l'en-tête.

### 3.2 Calcule des taux d'ouverture et de clic honnêtes

**👟 Indice de départ :** Charge le journal de suivi avec `pandas.read_csv`, groupe par édition, et divise par la *taille réelle de l'audience* — passe le vrai nombre d'abonnés, pour que les taux ne soient pas gonflés en ne comptant que les gens qui se sont présentés.

```python
# newsletter.py (continued)
import pandas as pd

def generate_analytics(filepath: str = "tracking.csv", total_subscribers: int = 0) -> pd.DataFrame:
    """Compute per-issue open and click rates from the tracking log."""
    if not os.path.exists(filepath):
        print("No tracking data found.")
        return pd.DataFrame()

    df = pd.read_csv(filepath)

    print("\n  Newsletter Analytics")
    print("  " + "=" * 50)

    for issue in df["newsletter_issue"].unique():
        issue_data = df[df["newsletter_issue"] == issue]
        opens = len(issue_data[issue_data["event_type"] == "open"])
        clicks = len(issue_data[issue_data["event_type"] == "click"])
        total = total_subscribers or len(df["subscriber_email"].unique())
        open_rate = (opens / total * 100) if total > 0 else 0
        click_rate = (clicks / total * 100) if total > 0 else 0

        print(f"\n  Issue: {issue}")
        print(f"    Opens:       {opens}/{total} ({open_rate:.1f}%)")
        print(f"    Clicks:      {clicks}/{total} ({click_rate:.1f}%)")

    return df

simulate_tracking(subscribers, "Issue #42")
analytics = generate_analytics(total_subscribers=len(subscribers))
```

La ligne qui porte toute l'étape est `total = total_subscribers or len(...)`. Le dénominateur d'un taux décide s'il est honnête : diviser les ouvertures par **tous ceux à qui l'édition a été envoyée** donne le vrai taux d'ouverture ; diviser par les 2 personnes qui se sont trouvées ouvrir le gonfle à ~100 % et n'apprend rien. Filtrer avec pandas — `df["newsletter_issue"] == issue` et `df["event_type"] == "open"` — produit des masques booléens, et `len` du cadre masqué compte les lignes correspondantes, ce qui est la façon idiomatique de compter avec pandas sans boucler. Le repli `or` garde la fonction utilisable sur un fichier sans taille d'audience connue.

**🎯 Résultat attendu :** Un bloc d'analytique pour « Issue #42 » — avec 3 abonnés, quelque chose comme `Opens: 2/3 (66.7%)` et `Clicks: 1/3 (33.3%)`, chaque taux étant les événements de cette édition divisés par 3.

**🩹 Si ça ne marche pas :** Si les taux d'ouverture se lisent `100.0%`, `total_subscribers` n'est pas passé (ou le repli `or` s'est déclenché parce que tu as passé `0`). Si plusieurs éditions apparaissent quand tu en attendais une, des lancements antérieurs ont laissé des événements dans `tracking.csv` — le journal est en ajout-seul exprès ; supprime le fichier pour une table rase. Si tu obtiens `FileNotFoundError`, `simulate_tracking` a tourné sur le mauvais chemin ou n'a jamais tourné — lance 3.1 d'abord.

### 3.3 Vérifie l'étape de suivi

**✅ Liste de vérification**

- ✅ `tracking.csv` contient une ligne par événement (pas d'en-têtes dupliqués, pas de lignes éditées à la main).
- ✅ `generate_analytics(total_subscribers=len(subscribers))` imprime les taux d'ouverture et de clic par édition.
- ✅ Le taux d'ouverture est calculé contre l'audience d'envoi, pas seulement contre les ouvreurs.

**🤔 Question(s) socratique(s)**

- Le code préfère délibérément `total_subscribers or len(df['subscriber_email'].unique())` au simple compte d'e-mails uniques. Quand ces deux nombres *divergeraient-ils* — et lequel des deux produit un taux d'ouverture trompeusement élevé ?
- Un journal de suivi est en ajout-seul : les lignes ne sont jamais mises à jour ni supprimées. Quel genre de réponse devient *impossible* à donner correctement avec un journal en ajout-seul si un abonné se désabonne puis se réabonne sous le même e-mail ?

## Étape 4 : Teste A/B les objets

Tu ne peux pas argumenter quelqu'un dans l'ouverture de ton e-mail, mais tu peux le mesurer. Un test A/B divise l'audience en deux, envoie l'objet A à une moitié et le B à l'autre, et laisse les taux d'ouverture décider. Cette étape mène cette expérience avec la machinerie de suivi que tu viens de construire.

### 4.1 Divise la liste et simule le test

**👟 Indice de départ :** Mélange une copie de la liste d'abonnés, divise-la au point médian en deux groupes, puis journalise les ouvertures de chaque groupe sous des étiquettes d'édition *distinctes* pour que l'analytique puisse les distinguer.

```python
# newsletter.py (continued)
import random

def ab_test_subject_lines(
    subscribers: list[dict],
    subject_a: str,
    subject_b: str,
    issue: str = "A/B Test",
) -> dict:
    """Run an A/B test by splitting subscribers and measuring open rates."""
    shuffled = subscribers.copy()
    random.shuffle(shuffled)
    mid = len(shuffled) // 2
    group_a = shuffled[:mid]
    group_b = shuffled[mid:]

    print(f"\n  A/B Test: Subject Line Comparison")
    print(f"  Version A: {subject_a}")
    print(f"  Version B: {subject_b}")
    print(f"  Group A: {len(group_a)} subscribers")
    print(f"  Group B: {len(group_b)} subscribers")

    for sub in group_a:
        if random.random() < 0.45:  # 45% open rate for A
            log_event(sub["email"], f"{issue}-A", "open")

    for sub in group_b:
        if random.random() < 0.62:  # 62% open rate for B
            log_event(sub["email"], f"{issue}-B", "open")

    df = pd.read_csv("tracking.csv")
    opens_a = len(df[(df["newsletter_issue"] == f"{issue}-A") & (df["event_type"] == "open")])
    opens_b = len(df[(df["newsletter_issue"] == f"{issue}-B") & (df["event_type"] == "open")])

    rate_a = (opens_a / len(group_a) * 100) if group_a else 0
    rate_b = (opens_b / len(group_b) * 100) if group_b else 0

    results = {
        "subject_a": subject_a,
        "subject_b": subject_b,
        "open_rate_a": round(rate_a, 1),
        "open_rate_b": round(rate_b, 1),
        "winner": "B" if rate_b > rate_a else "A",
    }

    print(f"  Version A open rate: {rate_a:.1f}%")
    print(f"  Version B open rate: {rate_b:.1f}%")
    print(f"  Winner: Version {results['winner']}")
    return results

results = ab_test_subject_lines(
    subscribers,
    subject_a="This Week in Python",
    subject_b="5 Python Tricks You Missed Last Week",
)
```

La décision cruciale est de taguer les événements de chaque groupe avec une *différente* étiquette d'édition (`A/B Test-A` vs `A/B Test-B`) au lieu d'écrire des deux côtés des lignes `open` que tu ne peux pas distinguer plus tard. Le loup de cette étape est le `&` dans `df[(df["newsletter_issue"] == f"{issue}-A") & (df["event_type"] == "open")]` : pandas exige le `&` élément-à-élément (pas le `and` de Python) parce que chaque comparaison produit un tableau de booléens, et `and` ne peut pas évaluer des tableaux. Le `shuffled = subscribers.copy()` empêche le mélange de réordonner la liste sur laquelle d'autres fonctions s'appuient encore.

**🎯 Résultat attendu :** Une bannière de test, des tailles de groupe qui totalisent l'audience, deux taux d'ouverture (B près de 62 %, A près de 45 %), un `winner: "B"`, et un dict `results` avec les deux taux arrondis.

**🩹 Si ça ne marche pas :** Si tu obtiens `ValueError: The truth value of a DataFrame is ambiguous`, un `and` nu a fui dans l'expression de masque — les deux filtres doivent se joindre avec `&` et chacun être entre parenthèses. Si les deux groupes ont la même taille que toute la liste, la liste n'a pas été découpée (`[:mid]`/`[mid:]`) depuis la copie mélangée. Si les taux sont exactement 0, les événements ont été journalisés sous des étiquettes qui ne correspondent pas aux étiquettes de relecture — compare `f"{issue}-A"` aux deux endroits caractère par caractère.

### 4.2 Raisonne sur le résultat

**👟 Indice de départ :** Avant de relancer, demande ce que les nombres sont *autorisés à dire* vu la petitesse de l'échantillon — le gagnant n'est digne de confiance que dans la mesure de son dénominateur.

**🎯 Résultat attendu :** Un dict `results` avec `winner` correspondant au taux le plus élevé, et une explication d'une phrase de si tu parierais ton prochain envoi sur ce gagnant.

**🩹 Si ça ne marche pas :** Si un second lancement fait basculer le gagnant, ce n'est pas un bug — c'est le comportement honnête d'un petit échantillon non ensemencé. Si cela te surprend, c'est le point : avec des groupes de trois personnes, 45 % contre 62 % est du bruit, et la correction (de plus grandes audiences, ou des lancements répétés) fait partie de l'apprentissage, pas d'un problème de code.

### 4.3 Vérifie le test A/B

**✅ Liste de vérification**

- ✅ Les tailles des groupes A et B totalisent le nombre complet d'abonnés.
- ✅ Les événements des deux versions sont distinguables dans `tracking.csv` par leurs étiquettes d'édition.
- ✅ Le dict `results` calculé contient les deux taux et un gagnant, et `tracking.csv` n'a pas été écrit deux fois avec des en-têtes dupliqués.

**🤔 Question(s) socratique(s)**

- `random.shuffle` opère sur la liste en place, c'est pourquoi 4.1 la copie d'abord. Que protégerait réellement `subscribers.copy()`, étant donné que la liste contient des *dictionnaires* — copie-t-il aussi les dicts ? (Indice : essaie de muter un abonné après la copie.)
- Le gagnant est `"B" if rate_b > rate_a else "A"` — note qu'A gagne les égalités. Avec cette audience de trois, ferais-tu confiance à ce départage ? De quoi une vraie expérience aurait-elle besoin (une p-value, un `n` plus grand, un intervalle de confiance) avant que tu changes ton objet par défaut sur sa foi ?

## Étape 5 : Livre une édition à un segment

Maintenant le pipeline boucle sa boucle : choisis un segment (disons les lecteurs Python actifs), rends le modèle une fois *par abonné* avec son propre nom, et écris chaque édition personnalisée dans son propre fichier. Tout des étapes 1 et 2 se rassemble dans une seule fonction réutilisable.

### 5.1 Rend et écrit les éditions personnalisées

**👟 Indice de départ :** Compose tes filtres existants en un segment, puis rends le modèle à répétition avec des variables par personne via une fusion de dicts — et laisse l'adresse e-mail générer des noms de fichiers sûrs.

```python
# newsletter.py (continued)
from pathlib import Path

def render_issue_to_files(subscribers: list[dict], template: str, variables: dict, out_dir: str = "issues") -> list[str]:
    """Render one personalized issue per subscriber and write it to disk."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    paths = []
    for sub in subscribers:
vars_for_sub = {**variables, "subscriber_name": sub.get("name", ""), "email": sub["email"]}
        rendered = render_template(template, vars_for_sub)
        safe_name = sub["email"].split("@")[0]
        path = out / f"{safe_name}.md"
        path.write_text(rendered)
        paths.append(str(path))
    return paths

targets = filter_by_status(filter_by_tag(load_subscribers(), "python"), "active")
written = render_issue_to_files(targets, NEWSLETTER_TEMPLATE, variables)
print(f"Rendered {len(written)} personalized issues into issues/")
print(open(written[0]).read())
```

La ligne `vars_for_sub = {**variables, "subscriber_name": sub["name"], "email": sub["email"]}` est une fusion de dicts : elle copie les variables partagées puis *écrase* les clés par personne, donc la même base pour tout le monde devient personnelle pour chaque personne — le `Hello {{subscriber_name}}!` du modèle salue le lecteur réel. Composer les filtres (`filter_by_status(filter_by_tag(...))`) est la récompense des fonctions nommées et composables de 2.2 : segmenter, c'est juste les emboîter. Le nom de fichier vient de `sub["email"].split("@")[0]`, qui transforme un e-mail en une racine sans danger pour le système de fichiers, et `Path.write_text` fait de l'entrée-sortie de fichier une ligne unique.

**🎯 Résultat attendu :** `Rendered 2 personalized issues into issues/` et le premier fichier s'imprime comme une édition complète qui salue `Hello Alice!` — avec le même corps que chaque autre édition mais cette ligne-là personnalisée.

**🩹 Si ça ne marche pas :** Si chaque fichier dit `Hello Reader!`, l'écrasement par personne perd contre `variables` — vérifie l'ordre de fusion dans `vars_for_sub` (les écrasements viennent *après* le dict partagé). Si un abonné a un `name` vide, la salutation se lit `Hello !` — `sub.get("name", "")` renvoie une chaîne vide pour une cellule CSV vide, et `[MISSING: subscriber_name]` n'apparaît que pour une clé vraiment absente. Si `written[0]` a la mauvaise audience, les filtres du segment composé tirent le mauvais tag.

### 5.2 Vérifie l'envoi personnalisé

**✅ Liste de vérification**

- ✅ Seuls les abonnés correspondant au segment (par exemple actif + tag `python`) obtiennent des fichiers dans `issues/`.
- ✅ Chaque fichier salue son propre abonné par son nom et partage le même corps d'édition.
- ✅ `issues/` ne contient aucun fichier parasite des lancements antérieurs que la boucle n'a pas touchés.

**🤔 Question(s) socratique(s)**

- La fusion par personne vit *à l'intérieur* de la boucle, mais le dict partagé `variables` est à l'extérieur. Que changerait dans la date rendue si l'appel `datetime.now()` tournait une fois dans la boucle pour chaque abonné — et pourquoi « calculé une fois, pas par identité » est-il généralement le bon choix ?
- La fusion est `{**variables, "subscriber_name": <name>, "email": <email>}` — l'ordre compte. Si `variables` contenait déjà une clé `subscriber_name`, la fusion l'écrase-t-elle, et comment garderais-tu *délibérément* le défaut du modèle pour les abonnés sans nom ?

## ⚠️ Pièges courants

- **La regex gourmande qui avale plusieurs placeholders.** `\{\{(.+?)\}\}` a besoin du `?` non gourmand — avec un simple `.+`, une ligne à deux placeholders s'effondre en une seule correspondance bidon. Correction : garde `+?`, et teste avec deux placeholders sur une ligne comme le fait 1.1.
- **Une correspondance de tag sans découpe.** Si tu testes `tag in s["tags"]` sans `split(";")`, « python » correspond en sous-chaîne à « python3🐍 » et des faux positifs fuient dans les segments. Correction : déballe toujours le champ empaqueté avec `.split(";")` avant l'appartenance.
- **Les en-têtes dupliqués dans les fichiers de journal.** Ajouter avec `"a"` et écrire un en-tête à chaque fois corrompt `tracking.csv` et `subscribers.csv`. Correction : garde `writeheader()` derrière la vérification `os.path.exists` exactement comme écrit en 2.1/3.1.
- **`and` au lieu de `&` dans les filtres pandas.** `df["event_type"] == "open" and ...` lève `ValueError: The truth value of a DataFrame is ambiguous`. Correction : mets chaque comparaison entre parenthèses et joins avec `&`.
- **Des taux calculés contre le mauvais dénominateur.** Diviser les ouvertures par les *ouvreurs* (e-mails uniques du journal) gonfle les taux d'ouverture vers 100 %. Correction : passe le vrai compte d'audience (`total_subscribers=len(subscribers)`), comme le fait 3.2.

## Ce que tu viens de construire

Un pipeline de newsletters complet, de bout en bout : un moteur de modèles regex qui remplit des éditions Markdown, un gestionnaire d'abonnés CSV avec segmentation par tags, une étape honnête d'analytique d'ouvertures/clics, un test A/B d'objets, et une passe finale qui écrit une édition personnalisée par lecteur. La compétence transférable est *le pipeline de contenu* : modèle + données + segment + mesure sont les quatre mêmes blocs derrière les vraies intégrations ESP (Mailchimp, SendGrid), l'automatisation marketing, et chaque script « envoyer un rapport aux bonnes personnes chaque semaine » que tu écriras en poste.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/newsletter-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/newsletter-builder) dans le dépôt du cours livre le pipeline complet avec un gestionnaire de désabonnement et une classe de segment nommée. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le de là.
:::

## Où aller à partir d'ici

- Ajoute la **gestion du désabonnement** : scanne `tracking.csv` pour les événements `"unsubscribe"` et bascule le statut de cet abonné à `unsubscribed` dans `subscribers.csv` — tu as déjà `filter_by_status` qui attend exactement cette valeur.
- Construis une **archive d'éditions** : change `render_issue_to_files` pour écrire chaque édition sous un nom de fichier daté (`newsletter-2026-09-06.md`) et émettre un `index.md` listant chaque édition passée — `datetime.now().strftime("%Y-%m-%d")` est tout le truc.
- Fais un **catalogue de segments nommés** : stocke les règles de segment comme `tag=python AND status=active` dans de petits fichiers JSON et évalue-les avec les deux filtres — le modèle « règles comme données » qui transforme des scripts one-off en un système.
- Trace un **graphique de croissance** : lis `subscribers.csv` et représente les comptes `subscribed_at` dans le temps avec matplotlib — une étape `value_counts` plus `plot()` qui transforme la liste d'abonnés en ligne de tendance.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README contient un guide complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python qui construit sa propre audience. 🎓