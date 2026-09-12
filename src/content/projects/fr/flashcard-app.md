---
title: "Application de Cartes Flash"
description: "Système de cartes flash à répétition espacée qui optimise le moment de révision pour une rétention maximale."
difficulty: "beginner"
estimatedMinutes: 40
xpReward: 50
tags: ["cli", "json", "spaced-repetition", "file-io"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions, dictionnaires)"
  - "Les bases d'entrée/sortie de fichiers"
---

# Application de Cartes Flash

Construis une application de cartes flash en terminal qui utilise l'algorithme de répétition espacée SM-2 pour programmer les révisions à des intervalles scientifiquement optimaux. Tu apprendras à modéliser des données avec des dictionnaires, à implémenter une boucle d'étude avec interaction utilisateur, à appliquer un algorithme qui s'adapte à ta performance, et à tout persister en JSON pour que ta progression survive entre les sessions.

## 🎯 Ce que tu vas apprendre

1. Modéliser des données avec des dictionnaires et des listes
2. Implémenter une session d'étude avec interaction utilisateur
3. Appliquer l'algorithme de répétition espacée SM-2
4. Suivre la progression de l'apprentissage avec des statistiques
5. Persister des données dans des fichiers JSON

## Ce que tu vas construire

Une application de cartes flash en terminal qui :
- Stocke des cartes flash avec contenu recto/verso et tags
- Exécute des sessions d'étude avec retournement pour révéler
- Utilise la répétition espacée pour programmer les révisions
- Suit la maîtrise et la précision au fil du temps
- Enregistre la progression entre les sessions

## Où exécuter ceci

- **Localement avec `uv` (recommandé).** Ce projet n'utilise que la bibliothèque standard, donc il s'exécute partout où Python tourne. La section Configuration ci-dessous le parcourt.
- **Google Colab ou Kaggle Notebooks.** Colle les cellules de code directement dans un notebook. Les appels `input()` fonctionnent pour les invites d'étude, mais l'entrée/sortie de fichiers (étape 6) fonctionne différemment dans le navigateur.
- **JupyterLite playground.** Colle les cellules de code directement dans un notebook, note que la persistance des fichiers (étape 6) fonctionne uniquement en local.

- **Exécutez-le dans le navigateur.** Un compagnon notebook interactif est prêt, ouvrez-le dans Colab, Kaggle ou Binder et suivez les étapes dans l'ordre.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/flashcard-app/notebook.fr.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/flashcard-app/notebook.fr.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fflashcard-app%2Fnotebook.fr.ipynb)

## Configuration

```bash
uv init flashcard-app
cd flashcard-app
```

## Étape 1 : Définir le modèle de données

Avant de construire des fonctionnalités, décide comment une carte vit en mémoire. Chaque carte est un dictionnaire avec des champs pour son contenu, ses métadonnées, et son état de répétition espacée. Une liste contient toutes les cartes d'un paquet. Cette structure plate garde les choses simples, pas encore besoin de classes.

### 1.1 Crée la structure de carte

**👟 Indice de départ :** Chaque carte a besoin de `front`, `back`, `tags`, et des champs SM-2 : `interval` (jours jusqu'à la prochaine révision), `ease_factor` (la vitesse à laquelle les intervalles grandissent), `repetitions` (révisions correctes consécutives), et `next_review` (quand la réafficher). Utilise `datetime.now().isoformat()` pour les horodatages.

```python
from datetime import datetime, timedelta

def create_card(front: str, back: str, tags: list[str] | None = None) -> dict:
    return {
        "front": front,
        "back": back,
        "tags": tags or [],
        "interval": 1,
        "ease_factor": 2.5,
        "repetitions": 0,
        "next_review": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
    }
```

**🎯 Résultat attendu :** `create_card("What is Python?", "A programming language")` renvoie un dict avec tous les champs :

```python
>>> card = create_card("What is Python?", "A programming language")
>>> card["front"]
'What is Python?'
>>> card["back"]
'A programming language'
>>> card["interval"]
1
>>> card["ease_factor"]
2.5
>>> card["tags"]
[]
```

**🩹 Si ça ne marche pas :** Si tu obtiens une `TypeError`, assure-toi que `datetime.now().isoformat()` est appelé avec des parenthèses, `datetime.now().isoformat()` est correct, `datetime.now.isoformat` (sans parenthèses) référence la méthode sans l'appeler. Si les tags prennent par défaut une liste mutable partagée, tu as utilisé `tags or []` incorrectement, assure-toi que le `or` est dans le corps de la fonction, pas dans l'argument par défaut.

### 1.2 Crée la structure de paquet

**👟 Indice de départ :** Un paquet est un dictionnaire avec un `name` et une liste `cards`. Commence avec une liste vide.

```python
def create_deck(name: str) -> dict:
    return {
        "name": name,
        "cards": [],
        "created_at": datetime.now().isoformat(),
    }
```

**🎯 Résultat attendu :**

```python
>>> deck = create_deck("Python Basics")
>>> deck["name"]
'Python Basics'
>>> len(deck["cards"])
0
```

**🩹 Si ça ne marche pas :** Si `deck["cards"]` est `None` au lieu de `[]`, tu as oublié d'inclure la clé `"cards"` dans le dict de retour.

### 1.3 Ajoute des cartes à un paquet

**👟 Indice de départ :** Ajoute une carte à la liste `cards` du paquet. Imprime un message de confirmation.

```python
def add_card(deck: dict, front: str, back: str, tags: list[str] | None = None) -> None:
    card = create_card(front, back, tags)
    deck["cards"].append(card)
    print(f"Added: {front}")
```

**🎯 Résultat attendu :**

```python
>>> deck = create_deck("Python Basics")
>>> add_card(deck, "What is Python?", "A programming language")
Added: What is Python?
>>> add_card(deck, "What is a list?", "An ordered mutable collection", tags=["data structures"])
Added: What is a list?
>>> len(deck["cards"])
2
```

**🩹 Si ça ne marche pas :** Si la carte n'apparaît pas dans le paquet, vérifie que tu ajoutes à `deck["cards"]`, pas à une variable locale. Si deux cartes partagent les mêmes données, tu réutilises la même référence de dict, assure-toi que `create_card` renvoie un nouveau dict à chaque fois.

### 1.4 Vérifie le modèle de données

**✅ Liste de vérification**

- ✅ `create_card` renvoie un dict avec `front`, `back`, `tags`, `interval`, `ease_factor`, `repetitions`, `next_review` et `created_at`.
- ✅ Les tags prennent par défaut une liste vide `[]` s'ils ne sont pas fournis.
- ✅ `next_review` est réglé sur l'heure courante comme chaîne ISO.
- ✅ `create_deck` renvoie un dict avec `name` et une liste `cards` vide.
- ✅ `add_card` crée une carte et l'ajoute au paquet.

**🤔 Question(s) socratique(s)**

Pourquoi stocker `next_review` comme une chaîne ISO au lieu d'un objet datetime ? Quel compromis la sérialisation JSON impose-t-elle, et que perdrais-tu si tu stockais un horodatage unix à la place ?

---

## Étape 2 : Créer et lister les cartes flash

Avec le modèle de données en place, construisons des fonctions pour peupler un paquet et afficher son contenu. C'est la fondation de tout ce qui suit.

### 2.1 Construis un paquet d'échantillon

**👟 Indice de départ :** Crée un paquet de 5–6 cartes couvrant différents sujets. Utilise des tags variés pour que le filtrage fonctionne plus tard.

```python
def build_sample_deck() -> dict:
    deck = create_deck("Python Basics")
    cards = [
        ("What is Python?", "A high-level interpreted programming language", ["fundamentals"]),
        ("What is a list?", "An ordered mutable collection", ["data structures"]),
        ("What does `len()` return?", "The number of items in a collection", ["functions"]),
        ("What is a dictionary?", "A collection of key-value pairs", ["data structures"]),
        ("What is a string?", "An immutable sequence of characters", ["data structures"]),
        ("What is a function?", "A reusable block of code that performs a task", ["fundamentals"]),
    ]
    for front, back, tags in cards:
        add_card(deck, front, back, tags)
    return deck
```

**🎯 Résultat attendu :**

```python
>>> deck = build_sample_deck()
Added: What is Python?
Added: What is a list?
Added: What does `len()` return?
Added: What is a dictionary?
Added: What is a string?
Added: What is a function?
>>> len(deck["cards"])
6
```

### 2.2 Liste toutes les cartes

**👟 Indice de départ :** Parcours `deck["cards"]` et imprime le recto, le verso et les tags de chaque carte. Numérote les cartes pour une référence facile.

```python
def list_cards(deck: dict) -> None:
    if not deck["cards"]:
        print("No cards in this deck.")
        return
    print(f"\n{'='*50}")
    print(f"  {deck['name']} ({len(deck['cards'])} cards)")
    print(f"{'='*50}")
    for i, card in enumerate(deck["cards"], 1):
        tags = ", ".join(card["tags"]) if card["tags"] else "no tags"
        print(f"  {i}. {card['front']}")
        print(f"     -> {card['back']}  [{tags}]")
    print(f"{'='*50}")
```

**🎯 Résultat attendu :**

```
==================================================
  Python Basics (6 cards)
==================================================
  1. What is Python?
     -> A high-level interpreted programming language  [fundamentals]
  2. What is a list?
     -> An ordered mutable collection  [data structures]
  3. What does `len()` return?
     -> The number of items in a collection  [functions]
  4. What is a dictionary?
     -> A collection of key-value pairs  [data structures]
  5. What is a string?
     -> An immutable sequence of characters  [data structures]
  6. What is a function?
     -> A reusable block of code that performs a task  [fundamentals]
==================================================
```

**🩹 Si ça ne marche pas :** Si les tags s'affichent comme `['data structures']` au lieu de `data structures`, tu as oublié de les joindre avec `", ".join(...)`. Si le compte est faux, vérifie que `enumerate` commence à 1, pas 0.

### 2.3 Vérifie la liste

**✅ Liste de vérification**

- ✅ `build_sample_deck` crée un paquet avec exactement 6 cartes.
- ✅ `list_cards` imprime le recto, le verso et les tags de chaque carte.
- ✅ Les paquets vides impriment « No cards in this deck. » sans planter.
- ✅ Les tags sont affichés comme des chaînes séparées par des virgules, pas des listes brutes.

**🤔 Question(s) socratique(s)**

Pourquoi stocker le paquet comme un simple dictionnaire au lieu d'une classe avec des méthodes ? Que gagnes-tu en gardant la structure de données simple à ce stade ?

---

## Étape 3 : Mode d'étude

Maintenant la partie amusante : une session d'étude où tu retournes les cartes, révèles la réponse, et évalues à quel point tu la connaissais. L'évaluation de qualité que tu donnes alimente directement l'algorithme SM-2 à l'étape suivante.

### 3.1 Écris la boucle de session d'étude

**👟 Indice de départ :** Filtre les cartes à celles dues pour révision (`next_review <= now`). Pour chaque carte, montre le recto, attends que l'utilisateur appuie sur Entrée, puis montre le verso. Après la révélation, demande une évaluation de qualité (0–5). Collecte les évaluations et renvoie-les.

```python
from datetime import datetime

def get_due_cards(deck: dict) -> list[dict]:
    now = datetime.now()
    due = []
    for card in deck["cards"]:
        next_review = datetime.fromisoformat(card["next_review"])
        if next_review <= now:
            due.append(card)
    return due

def study_session(deck: dict) -> list[dict]:
    due = get_due_cards(deck)
    if not due:
        print("\nNo cards due for review! Great job.")
        return []

    print(f"\n{'='*50}")
    print(f"  STUDY SESSION — {len(due)} card(s) due")
    print(f"{'='*50}")

    results = []
    for i, card in enumerate(due, 1):
        print(f"\n  Card {i}/{len(due)}")
        print(f"  Front: {card['front']}")
        input("  Press Enter to reveal the answer...")
        print(f"  Back:  {card['back']}")

        quality = get_quality_rating()
        results.append({"card": card, "quality": quality})
        print(f"  Rated: {quality}/5")

    print(f"\n  Session complete! Reviewed {len(results)} card(s).")
    return results
```

**🎯 Résultat attendu :** Quand tu exécutes `study_session(deck)` avec des cartes dues, tu verras le recto de chaque carte, tu appuies sur Entrée, tu vois le verso, puis tu tapes une note. Les cartes qui ne sont pas encore dues sont ignorées.

### 3.2 Obtiens l'évaluation de qualité de l'utilisateur

**👟 Indice de départ :** Invite l'utilisateur à donner une note de 0 à 5. Valide l'entrée, rejette tout ce qui n'est pas un nombre dans la plage. Redemande en cas de mauvaise entrée.

```python
def get_quality_rating() -> int:
    print("  How well did you know it?")
    print("  0 - Complete blank")
    print("  1 - Wrong, but recognized when shown")
    print("  2 - Wrong, but it was close")
    print("  3 - Correct with serious difficulty")
    print("  4 - Correct with hesitation")
    print("  5 - Perfect, instant recall")
    while True:
        try:
            rating = int(input("  Rating (0-5): ").strip())
            if 0 <= rating <= 5:
                return rating
            print("  Please enter a number between 0 and 5.")
        except ValueError:
            print("  Please enter a valid number.")
```

**🎯 Résultat attendu :**

```
  How well did you know it?
  0 - Complete blank
  1 - Wrong, but recognized when shown
  2 - Wrong, but it was close
  3 - Correct with serious difficulty
  4 - Correct with hesitation
  5 - Perfect, instant recall
  Rating (0-5): 4
```

**🩹 Si ça ne marche pas :** Si la boucle ne se termine jamais, tu ne renvoies pas depuis l'intérieur du `while True`, assure-toi que `return rating` est dans le bloc `if 0 <= rating <= 5`. Si saisir « abc » plante, tu as oublié le `try/except ValueError`.

### 3.3 Vérifie le mode d'étude

**✅ Liste de vérification**

- ✅ `get_due_cards` ne renvoie que les cartes dont `next_review` est dans le passé.
- ✅ `study_session` montre le recto, attend Entrée, puis révèle le verso.
- ✅ `get_quality_rating` rejette les entrées hors de 0–5 et redemande.
- ✅ La session imprime un résumé quand elle est terminée.
- ✅ Une liste de cartes dues vide imprime « No cards due for review! » sans planter.

**🤔 Question(s) socratique(s)**

Pourquoi l'utilisateur appuie-t-il sur Entrée pour révéler la réponse au lieu de la voir apparaître immédiatement ? Comment l'acte physique de se remémorer avant de voir la réponse améliore-t-il la rétention ?

---

## Étape 4 : Répétition espacée (SM-2)

L'algorithme SM-2 est le moteur qui fait de ceci plus qu'une simple application de cartes flash. Il ajuste l'intervalle et le facteur de facilité après chaque révision en fonction de la qualité de ta réponse. Les cartes avec lesquelles tu as du mal reviennent plus tôt ; les cartes que tu connais bien sont repoussées plus loin dans le futur.

### 4.1 Implémente la mise à jour SM-2

**👟 Indice de départ :** L'algorithme modifie trois champs de la carte : `repetitions`, `interval` et `ease_factor`. Si la qualité est >= 3 (correct), incrémente `repetitions` et fais grandir l'intervalle. Si la qualité est < 3 (oublié), réinitialise `repetitions` à 0 et remets l'intervalle à 1. Le facteur de facilité s'ajuste selon la qualité, il monte pour les réponses faciles et descend pour les difficiles.

```python
def update_card_sm2(card: dict, quality: int) -> dict:
    if quality >= 3:
        if card["repetitions"] == 0:
            card["interval"] = 1
        elif card["repetitions"] == 1:
            card["interval"] = 6
        else:
            card["interval"] = round(card["interval"] * card["ease_factor"])
        card["repetitions"] += 1
    else:
        card["repetitions"] = 0
        card["interval"] = 1

    card["ease_factor"] = max(
        1.3,
        card["ease_factor"] + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
    )

    card["next_review"] = (
        datetime.now() + timedelta(days=card["interval"])
    ).isoformat()

    return card
```

**🎯 Résultat attendu :** Tester l'algorithme sur une carte à travers plusieurs révisions :

```python
>>> card = create_card("Test", "Answer")
>>> # First review — correct (quality 4)
>>> update_card_sm2(card, 4)
>>> card["repetitions"]
1
>>> card["interval"]
1
>>> # Second review — correct (quality 4)
>>> update_card_sm2(card, 4)
>>> card["repetitions"]
2
>>> card["interval"]
6
>>> # Third review — correct (quality 4)
>>> update_card_sm2(card, 4)
>>> card["repetitions"]
3
>>> card["interval"]
15
>>> # Forgot — resets everything
>>> update_card_sm2(card, 1)
>>> card["repetitions"]
0
>>> card["interval"]
1
```

**🩹 Si ça ne marche pas :** Si l'intervalle ne grandit pas après la troisième révision, vérifie que tu as la branche `elif card["repetitions"] == 1` qui renvoie 6, sans elle, la formule `round(interval * ease_factor)` donne `round(1 * 2.5) = 2` au lieu de 6 pour la seconde réponse correcte. Si `ease_factor` descend sous 1.3, la pince `max(1.3, ...)` n'est pas là.

### 4.2 Applique SM-2 après chaque révision

**👟 Indice de départ :** Dans la boucle de session d'étude, après avoir obtenu l'évaluation de qualité, appelle `update_card_sm2` sur la carte. Imprime la prochaine date de révision pour que l'utilisateur sache quand il la reverra.

```python
def study_session(deck: dict) -> list[dict]:
    due = get_due_cards(deck)
    if not due:
        print("\nNo cards due for review! Great job.")
        return []

    print(f"\n{'='*50}")
    print(f"  STUDY SESSION — {len(due)} card(s) due")
    print(f"{'='*50}")

    results = []
    for i, card in enumerate(due, 1):
        print(f"\n  Card {i}/{len(due)}")
        print(f"  Front: {card['front']}")
        input("  Press Enter to reveal the answer...")
        print(f"  Back:  {card['back']}")

        quality = get_quality_rating()
        update_card_sm2(card, quality)
        next_review = card["next_review"][:10]
        print(f"  -> Next review: {next_review}")
        results.append({"card": card, "quality": quality})

    print(f"\n  Session complete! Reviewed {len(results)} card(s).")
    return results
```

**🎯 Résultat attendu :** Après avoir noté chaque carte, tu verras quand elle est programmée ensuite :

```
  Card 1/3
  Front: What is Python?
  Press Enter to reveal the answer...
  Back:  A high-level interpreted programming language
  How well did you know it?
  Rating (0-5): 4
  -> Next review: 2026-09-07
```

Les cartes notées 0–2 apparaissent à nouveau demain ; les cartes notées 3–5 sont repoussées selon le planning SM-2.

**🩹 Si ça ne marche pas :** Si la prochaine date de révision est toujours demain quelle que soit la note, `update_card_sm2` ne modifie pas l'`interval` de la carte, assure-toi de modifier `card["interval"]` en place, pas de créer une variable locale. Si la date est dans le passé, tu as oublié d'ajouter `timedelta(days=card["interval"])` à `datetime.now()`.

### 4.3 Vérifie SM-2

**✅ Liste de vérification**

- ✅ Une qualité >= 3 incrémente `repetitions` et fait grandir l'intervalle.
- ✅ Une qualité < 3 réinitialise `repetitions` à 0 et l'intervalle à 1.
- ✅ Le facteur de facilité ne descend jamais sous 1.3.
- ✅ `next_review` est réglé sur `now + interval` jours.
- ✅ Après la session d'étude, les champs de la carte reflètent le nouveau planning.

**🤔 Question(s) socratique(s)**

Pourquoi l'algorithme SM-2 utilise-t-il un facteur de facilité multiplicatif au lieu d'un incrément fixe ? Qu'arrive-t-il à la fréquence de révision si tu notes toujours une carte 3 (correct avec difficulté) contre toujours 5 (parfait) ?

---

## Étape 5 : Suivre la progression

Une session d'étude n'est utile que si tu peux voir ta progression au fil du temps. Construisons des statistiques qui montrent combien de cartes tu as maîtrisées, ta précision globale, et combien de cartes sont dues.

### 5.1 Calcule les statistiques du paquet

**👟 Indice de départ :** Parcours toutes les cartes et compte : total, maîtrisées (repetitions >= 3), en apprentissage (repetitions 1–2), et nouvelles (repetitions == 0). Calcule aussi le facteur de facilité moyen.

```python
def deck_stats(deck: dict) -> dict:
    cards = deck["cards"]
    if not cards:
        return {
            "total": 0, "mastered": 0, "learning": 0, "new": 0,
            "due": 0, "avg_ease": 0.0,
        }

    now = datetime.now()
    mastered = sum(1 for c in cards if c["repetitions"] >= 3)
    learning = sum(1 for c in cards if 1 <= c["repetitions"] < 3)
    new_cards = sum(1 for c in cards if c["repetitions"] == 0)
    due = sum(
        1 for c in cards
        if datetime.fromisoformat(c["next_review"]) <= now
    )
    avg_ease = sum(c["ease_factor"] for c in cards) / len(cards)

    return {
        "total": len(cards),
        "mastered": mastered,
        "learning": learning,
        "new": new_cards,
        "due": due,
        "avg_ease": round(avg_ease, 2),
    }
```

**🎯 Résultat attendu :**

```python
>>> deck = build_sample_deck()
>>> stats = deck_stats(deck)
>>> stats
{'total': 6, 'mastered': 0, 'learning': 0, 'new': 6, 'due': 6, 'avg_ease': 2.5}
```

Après une session d'étude, les nombres bougent, maîtrisées et en apprentissage montent, nouvelles descend, dues baisse.

**🩹 Si ça ne marche pas :** Si `due` est toujours 0 après l'étude, `get_due_cards` compare des chaînes au lieu de datetimes, assure-toi d'appeler `datetime.fromisoformat()` sur la chaîne `next_review`. Si `avg_ease` est faux, tu divises par le mauvais compte, utilise `len(cards)`, pas `sum(...)`.

### 5.2 Affiche les statistiques comme une barre de progression

**👟 Indice de départ :** Utilise un caractère de bloc Unicode pour dessiner une barre de progression. Montre les comptes maîtrisées, en apprentissage et nouvelles à côté.

```python
def show_stats(deck: dict) -> None:
    stats = deck_stats(deck)
    total = stats["total"]

    print(f"\n{'='*50}")
    print(f"  {deck['name']} — Progress")
    print(f"{'='*50}")
    print(f"  Total cards:   {stats['total']}")
    print(f"  Due now:       {stats['due']}")
    print(f"  Mastered:      {stats['mastered']}")
    print(f"  Learning:      {stats['learning']}")
    print(f"  New:           {stats['new']}")
    print(f"  Avg ease:      {stats['avg_ease']}")

    if total > 0:
        mastered_pct = stats["mastered"] / total * 100
        bar_len = 30
        filled = int(bar_len * stats["mastered"] / total)
        bar = "█" * filled + "░" * (bar_len - filled)
        print(f"\n  Progress: [{bar}] {mastered_pct:.0f}%")

    print(f"{'='*50}")
```

**🎯 Résultat attendu :**

```
==================================================
  Python Basics — Progress
==================================================
  Total cards:   6
  Due now:       6
  Mastered:      0
  Learning:      0
  New:           6
  Avg ease:      2.5

  Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0%
==================================================
```

Après avoir étudié toutes les cartes et noté 4–5 sur chacune, la barre de progression se remplit.

**🩹 Si ça ne marche pas :** Si la barre de progression déborde au-delà de 30 caractères, `filled` dépasse `bar_len`, ajoute `min(filled, bar_len)` comme pince de sécurité. Si les pourcentages ne s'additionnent pas, vérifie que `mastered + learning + new == total`.

### 5.3 Vérifie le suivi de progression

**✅ Liste de vérification**

- ✅ `deck_stats` renvoie total, mastered, learning, new, due et avg_ease.
- ✅ `show_stats` imprime un résumé formaté avec une barre de progression.
- ✅ Les paquets vides ne plantent pas, ils montrent tous des zéros.
- ✅ Après une session d'étude, les statistiques reflètent les états de cartes mis à jour.

**🤔 Question(s) socratique(s)**

Pourquoi SM-2 définit-il « maîtrisée » comme `repetitions >= 3` plutôt qu'un nombre plus élevé ? Qu'arriverait-il à ton planning de révision si tu relevais le seuil à 5 ?

---

## Étape 6 : Enregistrer et charger

Ta progression disparaît quand tu fermes le programme. Corrige cela en écrivant le paquet dans un fichier JSON sur disque et en le rechargeant au démarrage.

### 6.1 Enregistre le paquet en JSON

**👟 Indice de départ :** Utilise `json.dump` pour écrire le dict du paquet dans un fichier. Utilise `indent=2` pour une sortie lisible. Les objets `datetime` sont déjà stockés comme des chaînes ISO, donc ils se sérialisent sans problème.

```python
import json
from pathlib import Path

def save_deck(deck: dict, filename: str = "deck.json") -> None:
    with open(filename, "w") as f:
        json.dump(deck, f, indent=2)
    print(f"Saved {len(deck['cards'])} cards to {filename}")
```

**🎯 Résultat attendu :**

```python
>>> deck = build_sample_deck()
>>> save_deck(deck)
Saved 6 cards to deck.json
```

Le fichier `deck.json` contient désormais le paquet complet comme JSON lisible.

**🩹 Si ça ne marche pas :** Si tu obtiens `TypeError: Object of type datetime is not JSON serializable`, tu as stocké un objet `datetime` directement au lieu d'appeler `.isoformat()`, retourne à `create_card` et assure-toi que l'horodatage est une chaîne. Si le fichier est vide, tu l'as ouvert avec le mode `"w"` (qui tronque) avant d'appeler `json.dump`.

### 6.2 Charge le paquet depuis le JSON

**👟 Indice de départ :** Utilise `json.load` pour relire le fichier. Gère le cas où le fichier n'existe pas, commence avec un paquet vide dans ce cas.

```python
def load_deck(filename: str = "deck.json") -> dict:
    path = Path(filename)
    if not path.exists():
        print(f"No saved deck found — starting fresh.")
        return create_deck("My Deck")
    with path.open() as f:
        deck = json.load(f)
    print(f"Loaded {len(deck['cards'])} cards from {filename}")
    return deck
```

**🎯 Résultat attendu :** Au premier lancement (pas de fichier) : `No saved deck found, starting fresh.` Aux lancements suivants : `Loaded 6 cards from deck.json`.

**🩹 Si ça ne marche pas :** Si tu obtiens une `FileNotFoundError`, tu ne vérifies pas `path.exists()` avant d'ouvrir. Si le paquet chargé a `None` pour `cards`, le fichier JSON est malformé, ouvre-le dans un éditeur de texte pour vérifier.

### 6.3 Vérifie la persistance

**✅ Liste de vérification**

- ✅ Après l'enregistrement, `deck.json` existe et contient du JSON valide avec tous les champs de carte.
- ✅ Après le chargement, le paquet a les mêmes cartes, tags et état SM-2.
- ✅ Un fichier JSON manquant ne plante pas, il commence avec un paquet vide.
- ✅ Le fichier enregistré est lisible par l'humain avec `indent=2`.

**🤔 Question(s) socratique(s)**

Que se passe-t-il si tu édites `deck.json` à la main et introduis une faute de frappe dans le champ `ease_factor` ? Comment ajouterais-tu de la validation au chargement pour attraper des données corrompues ?

---

## Étape 7 : Polir la CLI

Rassemble tout dans un menu interactif. L'utilisateur choisit des actions dans une liste numérotée, l'entrée est validée, et l'expérience semble complète.

### 7.1 Construis le menu principal

**👟 Indice de départ :** Écris une fonction `main()` qui charge le paquet au démarrage, boucle avec un menu, et enregistre après chaque changement. Utilise une boucle `while True` qui se casse sur l'option « quitter ».

```python
def show_menu() -> None:
    print("\n=== Flashcard App ===")
    print("1. Study (due cards)")
    print("2. View all cards")
    print("3. Add a card")
    print("4. Show progress")
    print("5. Save deck")
    print("6. Quit")

def add_card_interactive(deck: dict) -> None:
    front = input("Front of card: ").strip()
    if not front:
        print("  Front cannot be empty.")
        return
    back = input("Back of card: ").strip()
    if not back:
        print("  Back cannot be empty.")
        return
    tags_input = input("Tags (comma-separated, or blank): ").strip()
    tags = [t.strip() for t in tags_input.split(",") if t.strip()] if tags_input else []
    add_card(deck, front, back, tags)

def main() -> None:
    deck = load_deck()

    while True:
        show_menu()
        choice = input("Choose (1-6): ").strip()

        if choice == "1":
            study_session(deck)
            save_deck(deck)
        elif choice == "2":
            list_cards(deck)
        elif choice == "3":
            add_card_interactive(deck)
            save_deck(deck)
        elif choice == "4":
            show_stats(deck)
        elif choice == "5":
            save_deck(deck)
        elif choice == "6":
            save_deck(deck)
            print("Goodbye!")
            break
        else:
            print("Invalid choice — pick 1 through 6.")

if __name__ == "__main__":
    main()
```

**🎯 Résultat attendu :** Exécuter `main()` montre un menu numéroté, effectue l'action sélectionnée, et revient au menu. Le paquet s'enregistre automatiquement après l'étude ou l'ajout de cartes.

```
=== Flashcard App ===
1. Study (due cards)
2. View all cards
3. Add a card
4. Show progress
5. Save deck
6. Quit
Choose (1-6): 1

No cards due for review! Great job.

=== Flashcard App ===
1. Study (due cards)
...
```

**🩹 Si ça ne marche pas :** Si tu obtiens une `UnboundLocalError`, la variable `deck` n'est pas définie avant la boucle `while True`, assure-toi que `deck = load_deck()` s'exécute d'abord. Si les cartes ne sont pas enregistrées après l'étude, tu as oublié `save_deck(deck)` dans la branche `"1"`.

### 7.2 Ajoute un retour coloré

**👟 Indice de départ :** Utilise des codes d'échappement ANSI pour les couleurs du terminal. Enveloppe le retour correct/faux en vert/rouge. Aucune bibliothèque externe nécessaire.

```python
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def coloured(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"
```

**🎯 Résultat attendu :** Après avoir noté une carte, le retour apparaît en couleur, vert pour les notes élevées (4–5), jaune pour le moyen (3), rouge pour les basses (0–2).

**🩹 Si ça ne marche pas :** Si tu vois des codes d'échappement bruts comme `[92m` au lieu des couleurs, la plupart des terminaux modernes supportent les codes ANSI, mais Windows Command Prompt peut avoir besoin de `os.system("")` appelé une fois au démarrage pour les activer.

### 7.3 Vérifie l'application complète

**✅ Liste de vérification**

- ✅ Le menu affiche six options et accepte l'entrée sans planter.
- ✅ « Study » exécute une session d'étude avec les mises à jour SM-2 et enregistre le paquet.
- ✅ « View all cards » liste chaque carte avec recto, verso et tags.
- ✅ « Add a card » valide un recto/verso non vide et enregistre immédiatement.
- ✅ « Show progress » affiche les statistiques et une barre de progression.
- ✅ « Save deck » écrit dans `deck.json` et confirme.
- ✅ « Quit » enregistre et sort proprement.
- ✅ Une entrée invalide imprime une erreur et revient au menu.

---

## ⚠️ Pièges courants

- **Oublier d'enregistrer après les changements.** Si tu étudies des cartes mais n'appelles pas `save_deck`, toutes les mises à jour SM-2 sont perdues à la sortie. Enregistre toujours juste après une opération qui change les données.
- **Comparaison de chaînes pour les dates.** Comparer des chaînes de dates ISO lexicographiquement fonctionne pour le format `YYYY-MM-DD`, mais `datetime.fromisoformat()` est plus sûr pour des calculs comme « cette carte est-elle due ? ».
- **Muter la liste par défaut.** Si `get_due_cards` modifie la liste `cards` du paquet au lieu de filtrer dans une nouvelle liste, tu retireras des cartes du paquet. Crée toujours une copie filtrée.
- **Facteur de facilité sous 1.3.** L'algorithme SM-2 peut pousser `ease_factor` sous 1.3 avec des notes très basses. La pince `max(1.3, ...)` empêche les intervalles de rétrécir pour toujours.
- **Écraser le JSON au chargement.** `load_deck` doit *lire* le fichier, pas y écrire. Un glissement courant est d'importer la mauvaise fonction ou d'appeler `save` dans `load`.

## 🧩 Défis

Prêt à aller plus loin ? Essaie ceci :

1. **Filtrage par tag**, Ajoute une commande pour étudier uniquement les cartes avec un tag spécifique. Filtre `get_due_cards` en vérifiant si le tag est dans `card["tags"]`.

2. **Import/export de paquet**, Laisse les utilisateurs exporter un paquet comme fichier texte brut (une carte par ligne, format front|back) et l'importer de retour. Cela rend les paquets partageables sans JSON.

3. **Historique de sessions**, Suis combien de cartes tu as révisées chaque jour, ta note moyenne, et ta précision. Stocke l'historique dans un fichier JSON séparé et montre un résumé hebdomadaire.

## Ce que tu as appris

- **Modélisation de données basée sur les dictionnaires**, Représenté les cartes et paquets comme de simples dicts Python avec des noms de champs et défauts clairs.
- **Répétition espacée SM-2**, Implémenté l'algorithme qui ajuste les intervalles de révision selon à quel point tu connais chaque carte.
- **Interaction utilisateur**, Construit une session d'étude avec retournement-pour-révéler, validation d'entrée et évaluations de qualité.
- **Suivi de progression**, Calculé des statistiques de maîtrise et visualisé la progression avec une barre de progression en terminal.
- **Persistance JSON**, Enregistré et chargé les données de paquet entre sessions avec `json.dump` et `json.load`.
- **Conception CLI**, Construit une interface pilotée par menu avec validation d'entrée, retour coloré et enregistrements automatiques.

Tu as maintenant une application de cartes flash pleinement fonctionnelle. L'architecture basée sur les dictionnaires la rend facile à étendre, ajoute des images en stockant des URLs dans un champ `"image"`, implémente des boîtes de Leitner en ajoutant un champ `"box"`, ou construis un système de paquets partagés en lisant du JSON depuis une URL.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants, et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓