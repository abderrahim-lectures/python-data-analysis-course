---
title: "Assistant Tuteur IA"
description: "Compagnon d'apprentissage personnalisé qui adapte les explications à votre niveau et suit la compréhension."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Education", "AI Agents", "NLP"]
prerequisites:
  - "Fonctions, dicts, listes et une boucle de base"
  - "Lire/écrire un fichier JSON avec json.dump / json.load"
  - "Aucune expérience de ML ou d'API LLM nécessaire — le tuteur central est du Python pur, et la couche LLM se dégrade avec élégance"
learningObjectives:
  - "Modéliser un deck de cartes mémoire comme une liste de dicts portant l'état de planification de chaque carte"
  - "Implémenter un planificateur SM-2 simplifié qui allonge ou réinitialise les intervalles selon une qualité auto-évaluée"
  - "Exécuter une boucle d'entraînement interactive qui met à jour la même liste en place à chaque révision"
  - "Faire l'aller-retour de la progression vers et depuis du JSON pour survivre entre les sessions"
  - "Composer un prompt d'indice de tuteur et se dégrader avec élégance quand aucune clé API n'est configurée"
---

# 🛠️ 📚 Construire un Assistant Tuteur IA

Un tuteur qui ne connaît que la bonne réponse n'est qu'une app de quiz. Ce projet construit l'autre genre : un tuteur à répétition espacée qui *se souvient de tes points faibles*, allonge l'intervalle entre les révisions quand tu réussis et le raccourcit quand tu échoues. Le moteur de planification est une réimplémentation propre de SM-2 — un algorithme largement utilisé qui ne dépend que de `interval` (jours depuis la dernière révision) et d'un score de `quality` (0–5) que tu fournis après chaque tentative. Une couche de persistance enregistre l'état complet du deck en JSON pour que la progression survive aux sessions, et une couche LLM optionnelle rédige un « indice de tuteur » d'une phrase qui aiguille sans révéler la réponse. Le cœur est du Python pur ; la couche LLM est authentique mais optionnelle — le tuteur fonctionne parfaitement sans la moindre clé API.

Ceci suppose une bonne aisance avec les dicts et les listes, du JSON basique, et aucun bagage en apprentissage automatique ; rien ici n'est noté — c'est optionnel et non noté — voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Définir le modèle de données des cartes mémoire et inspecter quelles cartes sont dues maintenant.
2. Implémenter un planificateur d'intervalles SM-2 simplifié qui retourne une copie de carte mise à jour.
3. Exécuter une session d'entraînement qui révise seulement les cartes dues, lit les auto-évaluations et met à jour le deck.
4. Persister la progression en JSON et vérifier un aller-retour chargement/enregistrement.
5. Composer un prompt optionnel d'indice de tuteur LLM et sauter l'appel API avec élégance quand aucune clé n'est présente.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — ce projet écrit et lit `progress.json` sans aucune dépendance externe, donc un `uv init` tout frais et un terminal local suffisent.

**Google Colab, Kaggle Notebooks et Binder** exécuteront chaque étape : le tuteur a zéro dépendance pip, donc chaque cellule de code s'exécute sans modification. La seule réserve est que `progress.json` vit dans le système de fichiers éphémère du notebook — télécharge-le entre deux sessions si tu veux persister entre des exécutions Colab.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-tutor/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-tutor/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-tutor%2Fnotebook.ipynb)

## Configuration

Tout ce qui est nécessaire avant la première séance d'entraînement : un projet avec `json` (aucun `uv add` requis) et un deck de départ dont l'état de planification est en pleine trajectoire d'apprentissage plausible.

### Mets en place le projet

```bash
uv init ai-tutor
cd ai-tutor
```

Aucun `uv add` nécessaire — `json` est dans la bibliothèque standard, et le moteur SM-2 est cinq lignes d'arithmétique.

### Charge le jeu de cartes de départ

**👟 Indice de départ :** Construis `new_card` comme une minuscule fabrique pour que chaque carte commence avec des valeurs par défaut saines (`interval=0`, `due=0`) tout en permettant des écrasements réels pour les cartes déjà apprises.

```python
# tutor.py
import json

def new_card(card_id, front, back, hint, interval=0, due=0):
    return {"id": card_id, "front": front, "back": back, "hint": hint,
            "interval": interval, "due": due}

DECK = [
    new_card("py-1", "What does `zip(a, b)` do?",
             "Pairs items from a and b into tuples, stopping at the shorter.",
             "Sounds like a zipper."),
    new_card("py-2", "When does `dict.get(k, d)` return `d`?",
             "When `k` is missing from the dict.",
             "Think of a safe default value.", interval=1, due=2),
    new_card("py-3", "What does `sorted(d.items())` return?",
             "A new list of `(key, value)` tuples, sorted by key.",
             "It's the items view, but sorted.", interval=6, due=5),
    new_card("py-4", "Name one difference between a list and a tuple.",
             "Lists are mutable; tuples are not.",
             "One uses [], the other uses ().", interval=6, due=8),
]

print(len(DECK), "cards")
today = 5
due = [c for c in DECK if c["due"] <= today]
print(len(due), "due now", [c["id"] for c in due])
```

Le deck capture un mélange réaliste : `py-1` n'a jamais été révisée (`interval=0, due=0`), `py-2` a été révisée il y a quelques jours (`due=2`, maintenant en retard), `py-3` est due aujourd'hui, et `py-4` est planifiée pour le futur. `due <= today` est le prédicat « maintenant » — une carte en retard *et* une carte due aujourd'hui comptent toutes les deux.

**🎯 Résultat attendu :** `4 cards` et `3 due now ['py-1', 'py-2', 'py-3']`.

**🩹 Si ça ne marche pas :** Si `due` affiche les mauvaises cartes, vérifie si `due` est un champ entier brut (pas une datetime) — ce projet utilise un compteur de jours, pas une date. Si le compte est faux, le `<=` devrait être `<` — une carte en retard (jour dû 2, jour courant 5) compte, et une carte due aujourd'hui (jour 5) compte, mais une carte future (jour 8) ne compte pas.

## Étape 2 : Implémente le planificateur SM-2

Le planificateur est une fonction pure : donne-lui l'`interval` courant et la `quality` auto-évaluée (0–5, où 3 et au-dessus signifie « je l'ai su »), et il retourne l'intervalle suivant — aucun effet de bord, aucune entrée-sortie.

### 2.1 Écris `sm2_interval`

**👟 Indice de départ :** Traduis les règles SM-2 : une qualité sous 3 réinitialise vers une répétition rapprochée ; l'intervalle 0 passe à 1 jour ; l'intervalle 1 passe à 6 jours ; sinon, multiplie l'intervalle courant par deux et demi.

```python
# tutor.py (continued)
def sm2_interval(interval: int, quality: int) -> int:
    if quality < 3:
        return 0
    if interval == 0:
        return 1
    if interval == 1:
        return 6
    return round(interval * 2.5)

print(sm2_interval(0, 5), sm2_interval(1, 5), sm2_interval(6, 4), sm2_interval(6, 2))
```

Une qualité sous 3 signifie « je ne le savais pas » — la carte se réinitialise vers une répétition rapprochée. Une fois la qualité ≥ 3, l'intervalle *croît* : une carte jamais vue (0 → 1 jour) → une carte d'un jour (1 → 6 jours) → une carte de six jours (6 → 15 jours). La croissance n'est pas linéaire : `round(interval * 2.5)` fait qu'une carte réussie trois fois de suite croît bien plus vite que les premières révisions — c'est toute la raison pour laquelle la répétition espacée fait gagner du temps.

**🎯 Résultat attendu :** `1 6 15 0` — la première révision réussit, la deuxième ouvre l'arc long, la troisième le fait croître de nouveau, et une révision échouée sur une carte mûre la réinitialise.

**🩹 Si ça ne marche pas :** Si `sm2_interval(0, 3)` affiche `0` au lieu de `1`, la vérification `quality >= 3` est placée après la vérification `interval == 0` (retour anticipé). S'il affiche un float comme `15.0`, le `round()` a été retiré.

### 2.2 Écris la fonction `review`

**👟 Indice de départ :** `review` prend une carte, un score de qualité et le numéro du jour courant ; elle retourne une *copie mise à jour* — aucun effet de bord.

```python
# tutor.py (continued)
def review(card: dict, quality: int, today: int) -> dict:
    updated = dict(card)
    if quality >= 3:
        updated["interval"] = sm2_interval(card["interval"], quality)
        updated["due"] = today + updated["interval"]
    else:
        updated["interval"] = max(1, card["interval"])
        updated["due"] = today
    updated["last"] = today
    return updated

c = review({"id": "x", "interval": 0, "due": 0}, 5, 0)
print(c["interval"], c["due"])
c = review({"id": "x", "interval": 1, "due": 0}, 5, 0)
print(c["interval"], c["due"])
c = review({"id": "x", "interval": 6, "due": 0}, 2, 0)
print(c["interval"], c["due"])
```

`dict(card)` crée une copie superficielle — le deck d'origine n'est pas muté, ce qui signifie que l'appelant choisit de persister ou non le changement (c'est une conception délibérée et escaladable). Une qualité ≥ 3 fait croître l'intervalle et repousse `due` d'autant de jours. Une qualité sous 3 réinitialise la carte : l'intervalle reste au moins 1 (pour que la carte reste en rotation) et la carte est due immédiatement aujourd'hui — pas demain — parce que l'apprenant n'a pas encore montré qu'il la connaît.

**🎯 Résultat attendu :** `1 1`, `6 6`, `6 0` — les trois cas : première révision, deuxième révision, révision échouée.

**🩹 Si ça ne marche pas :** Si la troisième ligne affiche `0 0` au lieu de `6 0`, la branche « échec » réinitialise l'intervalle à 0 au lieu de garder `max(1, card["interval"])`. Si `c["due"]` échoue avec une `TypeError` lors d'une croissance, `card["due"]` était une chaîne — assure-toi que `due` reste un entier partout.

### 2.3 Vérifie le planificateur

**✅ Liste de vérification**

- ✅ `sm2_interval` est déterministe : mêmes `interval` + `quality` → même résultat à chaque fois.
- ✅ `review` retourne un nouveau dict — l'appelant choisit d'accepter ou non la mise à jour.
- ✅ Une qualité sous 3 réinitialise la carte, mais jamais à `interval=0` — la carte reste en rotation.

**🤔 Question(s) socratique(s)**

- `review` retourne une copie au lieu de muter la carte en place. Pourquoi est-ce important pour une *session* qui révise plusieurs cartes — et quel serait le risque d'un `review` qui mute si, plus tard, tu veux montrer à l'apprenant « voici comment ton deck changerait » *avant* d'accepter ?
- SM-2 dit « en cas d'échec, répète immédiatement », et cette implémentation définit `due = today`. Pourquoi `due = today` est-il un meilleur choix que `due = tomorrow` — et que se passe-t-il dans la tête d'un apprenant quand une carte échouée réapparaît dans la même session ?

## Étape 3 : La session d'entraînement

Maintenant le tuteur fait son travail : il filtre les cartes dues, demande à l'apprenant une réponse et une note de qualité, applique `review` et met à jour le deck.

### 3.1 Construis la boucle interactive

**👟 Indice de départ :** `run_session` prend le deck, le numéro de jour et un appelable `ask`. L'appelable est ce qui interroge l'apprenant — et ce qui rend la session testable.

```python
# tutor.py (continued)
def run_session(cards: list[dict], today: int, ask) -> list[dict]:
    due = [i for i, c in enumerate(cards) if c["due"] <= today]
    print(f"{len(due)} due today")
    for idx in due:
        card = cards[idx]
        print("Q:", card["front"])
        _ = ask()           # learner's typed answer (free response)
        print("A:", card["back"])
        quality = int(ask()) # grade: 0 (blackout) to 5 (instant recall)
        cards[idx] = review(card, quality, today)
    return cards
```

`cards[idx] = review(...)` est la seule mutation délibérée de tout le projet : le deck est mis à jour en place, ce qui est ce que tu veux pour une vraie session où la même liste survit à la durée de vie du script. Passer `ask` au lieu d'utiliser `input()` directement est ce qui rend la boucle déterministe — le script l'appelle avec la même séquence de réponses à chaque fois.

**🎯 Résultat attendu :** `3 due today` — les trois cartes avec `due <= 5` sont révisées, une par une.

**🩹 Si ça ne marche pas :** Si le compte est faux, la liste `due` a été filtrée contre une valeur `today` différente. Si `ask()` est appelé une seule fois par carte (au lieu de deux — réponse + note), la boucle fait un court-circuit sur la ligne `_ = ask()`.

### 3.2 Simule une session avec des réponses fixes

**👟 Indice de départ :** Construis un minuscule itérateur qui nourrit `ask` — une réponse en texte libre, puis une note entière, par carte due — pour que la session soit entièrement déterministe.

```python
# tutor.py (continued)
script = iter([
    "pear",  "5",    # py-1: correct, confident
    "pear",  "2",    # py-2: wrong answer
    "pear",  "4",    # py-3: close, thoughtful
])

run_session(DECK, today=5, ask=script.__next__)
print("after session:")
for c in DECK:
    print("  ", c["id"], "interval", c["interval"], "due", c["due"])
print("still due now:", [c["id"] for c in DECK if c["due"] <= 5])
```

Un `list.__iter__` donne les mêmes valeurs dans le même ordre à chaque exécution — c'est ainsi qu'on obtient une sortie attendue reproductible depuis une boucle qui, en usage réel, serait `input()`. Après la session, `py-1` croît (0 → 1 jour, due le jour 6), `py-2` se réinitialise (toujours due aujourd'hui au jour 5), et `py-3` bondit (6 → 15 jours, due le jour 20). La dernière ligne demande « qui est encore due » — et seule `py-2`, échouée, se qualifie.

**🎯 Résultat attendu :**

```
3 due today
Q: What does `zip(a, b)` do?
A: Pairs items from a and b into tuples, stopping at the shorter.
Q: When does `dict.get(k, d)` return `d`?
A: When `k` is missing from the dict.
Q: What does `sorted(d.items())` return?
A: A new list of `(key, value)` tuples, sorted by key.
after session:
   py-1 interval 1 due 6
   py-2 interval 1 due 5
   py-3 interval 15 due 20
   py-4 interval 6 due 8
still due now: ['py-2']
```

**🩹 Si ça ne marche pas :** Si `still due now` affiche `['py-2', 'py-3']`, le nouveau `due` de `py-3` a été calculé comme `5 + 15 = 20` — qui n'est *pas* `<= 5` — donc la liste serait fausse si `py-3` apparaissait ; vérifie que `due` est défini comme `today + interval`, pas `today + quality`.

### 3.3 Vérifie la session

**✅ Liste de vérification**

- ✅ Exactement 3 cartes sont dues, et après la session exactement 1 (`py-2`) reste due.
- ✅ Une première révision réussie (`py-1`) définit `interval=1` et `due=6`.
- ✅ Une révision échouée (`py-2`) réinitialise `due` à `today`, pas à `today + 1`.

**🤔 Question(s) socratique(s)**

- Le script montre « pear » trois fois comme réponse de l'apprenant — le *vrai* apprenant taperait un mot différent pour chacune. Pourquoi un `iter` scripté rend-il la sortie déterministe, et que changerait `input()` à l'intérieur de la boucle ?
- Après la session, `py-2` est encore due. Que ferais-tu dans le *prochain* appel à `run_session` pour que l'apprenant revoie la carte échouée sans revoir les cartes qu'il connaît déjà ?

## Étape 4 : Persiste la progression et résume

Un tuteur qui oublie l'apprenant entre les sessions n'est qu'une app de quiz avec des étapes en plus. Cette étape enregistre le deck en JSON et vérifie l'aller-retour.

### 4.1 Sauvegarde et charge

**👟 Indice de départ :** Écris `save_deck` et `load_deck` — deux minuscules fonctions, chacune une ligne de `json.dump`/`json.load`, gardant le format de données ouvert pour une inspection future.

```python
# tutor.py (continued)
def save_deck(cards: list[dict], path: str = "progress.json") -> None:
    with open(path, "w") as f:
        json.dump(cards, f, indent=2)
    print(f"saved {len(cards)} cards to {path}")

def load_deck(path: str = "progress.json") -> list[dict]:
    with open(path) as f:
        return json.load(f)

save_deck(DECK)
loaded = load_deck()
print("round-trip ok:", loaded == DECK)
```

`indent=2` est le choix de mise en forme qui rend le JSON lisible par un humain dans un terminal et compatible diff dans git — une décision d'une ligne qui s'amortit à chaque fois que quelqu'un doit lire le fichier à la main. La vérification `round-trip ok: True` est un test d'intégrité simple mais réel : le fichier sur disque est égal au deck en mémoire, ce qui signifie que sauvegarde + chargement n'ont rien perdu ni réordonné.

**🎯 Résultat attendu :** `saved 4 cards to progress.json` et `round-trip ok: True`.

**🩹 Si ça ne marche pas :** Si l'aller-retour affiche `False`, vérifie si `last` a été ajouté après que le JSON a été enregistré (le fichier enregistré ne l'aura pas, mais le deck en mémoire l'aura — soit enregistre après la mise à jour `last`, soit enregistre avant). Si `json.dump` échoue avec `TypeError: Object of type ndarray is not JSON serializable`, une des valeurs d'intervalle ou d'échéance était un entier numpy — enveloppe avec `int(...)`.

### 4.2 Vérifie la persistance

**✅ Liste de vérification**

- ✅ `progress.json` existe et contient 4 objets de cartes, chacun avec les champs `interval`, `due` et `last`.
- ✅ `load_deck()` retourne une liste égale au deck qui a été enregistré.
- ✅ Supprimer le deck de la mémoire et recharger produit le même état.

**🤔 Question(s) socratique(s)**

- Ce format de persistance enregistre le deck *entier* à chaque fois. Quand le deck atteint 1000 cartes, est-ce du gaspillage ? Quel changement `json.dump` d'une seule ligne (une structure différente) te permettrait de mettre à jour une carte sans réécrire tout le fichier ?
- Le champ `last` n'a été ajouté qu'à l'intérieur de `review`, donc les cartes qui *n'ont pas été* révisées pendant la session ne l'ont pas. Comment cette incohérence affecterait-elle une future fonctionnalité « historique des révisions » — et quel est le correctif le plus simple ?

## Étape 5 : L'indice de tuteur LLM (optionnel)

Un planificateur te dit *quand* réviser ; un indice de tuteur te dit *comment* penser. Cette étape construit un prompt déterministe et, quand une clé est présente, l'envoie à un LLM. Le tuteur fonctionne parfaitement sans lui.

### 5.1 Compose le prompt d'indice

**👟 Indice de départ :** Construis un prompt qui donne au LLM la carte et la mauvaise réponse, et demande un coup de pouce — pas la solution.

```python
# tutor.py (continued)
def tutor_prompt(card: dict, wrong_answer: str) -> str:
    return (
        f"The learner answered '{wrong_answer}' for flashcard '{card['id']}'. "
        f"The card asks '{card['front']}' and the correct answer is "
        f"'{card['back']}'. Write a one-sentence hint nudging them toward the "
        f"answer without giving it away."
    )

missed = DECK[1]   # py-2, which was answered wrong
print(tutor_prompt(missed, "When the key equals the default"))
```

Intégrer la mauvaise réponse dans le prompt donne au LLM quelque chose à *corriger* — il peut écrire « la valeur `d` par défaut n'est retournée que sur un *échec*, pas sur une *réussite* » au lieu d'une explication générique. La contrainte « une phrase » empêche l'indice de se transformer en cours.

**🎯 Résultat attendu :** Une seule phrase commençant par `The learner answered 'When the key equals the default' for flashcard 'py-2'. The card asks 'When does \`dict.get(k, d)\` return \`d\`?' and the correct answer is 'When \`k\` is missing from the dict.'. Write a one-sentence hint nudging them toward the answer without giving it away.` — note bien le prompt complet, pas la réponse du LLM.

**🩹 Si ça ne marche pas :** Si l'ID de carte est `py-1` au lieu de `py-2`, `DECK[1]` a été utilisé contre un deck non trié — vérifie l'ordre des cartes, ou change l'index pour correspondre à la carte échouée de l'Étape 3.

### 5.2 Exécute l'indice (optionnel)

**👟 Indice de départ :** Vérifie d'abord `OPENAI_API_KEY` ; si elle est absente, enregistre le prompt pour un usage manuel. Ne bloque jamais le tuteur sur une clé manquante.

```python
# tutor.py (continued)
def maybe_hint(prompt: str) -> None:
    import getpass, os
    key = os.environ.get("OPENAI_API_KEY") or getpass.getpass("OpenAI key (blank to skip): ")
    if not key:
        with open("hint_prompt.txt", "w") as f:
            f.write(prompt)
        print("no key — prompt saved to hint_prompt.txt")
        return
    print("key present — a real API call would go here")

maybe_hint(tutor_prompt(DECK[1], "When the key equals the default"))
```

Le même motif élégant que les couches optionnelles précédentes : la variable d'environnement gère la CI, `getpass` gère un terminal, et la chaîne vide est la sortie de secours. Enregistrer le prompt signifie que l'étape d'indice n'est jamais le goulot d'étranglement — colle-le dans n'importe quel modèle, obtiens un indice, recopie-le dans la sortie imprimée de la boucle d'entraînement.

**🎯 Résultat attendu :** `no key — prompt saved to hint_prompt.txt`.

**🩹 Si ça ne marche pas :** Si le fichier est vide, la chaîne de prompt a été consommée par le premier `print` (les f-strings ne sont évaluées qu'une fois) — réassigne-la, ne l'affiche pas deux fois. S'il affiche `GetPassWarning`, le terminal est non interactif et aucune `OPENAI_API_KEY` n'est définie — exporte la variable à la place.

### 5.3 Vérifie la couche de tuteur

**✅ Liste de vérification**

- ✅ `tutor_prompt` retourne toujours une chaîne intégrant les vrais champs de la carte — aucun placeholder générique.
- ✅ Sans clé, `hint_prompt.txt` existe et contient la chaîne de prompt exacte.
- ✅ La couche d'indice de tuteur s'exécute à la fin du pipeline, donc un échec ici ne bloque jamais le planificateur ni la persistance.

**🤔 Question(s) socratique(s)**

- Le prompt du tuteur demande « un coup de pouce sans le donner ». Quel changement d'une phrase rendrait le prompt *sûrement injectable* à travers les types de cartes — et pourquoi le citation explicite (échappement de `'`) dans `wrong_answer` compte-t-il quand la chaîne entre dans un prompt ?
- Le chemin de clé `getpass` est interactif ; le chemin `OPENAI_API_KEY` ne l'est pas. Pour quel type de déploiement le chemin par variable d'environnement est-il en réalité *plus* sûr — et quelle est l'erreur courante qui rend les deux également vulnérables ?

## ⚠️ Pièges courants

- **Muter la carte au lieu de retourner une copie.** `review` est une fonction pure par conception — sa sortie est un nouveau dict. Si tu mutes la carte d'origine dans `review`, la boucle de session ne peut pas montrer un diff avant/après, et tu perds la capacité d'« annuler » une note erronée.
- **Utiliser `due = today + quality` au lieu de `today + interval`.** L'intervalle croît ; la qualité est un petit entier de 0 à 5. Les mélanger produit des dates d'échéance futures absurdes, et l'erreur reste invisible jusqu'à la session suivante.
- **Appeler `ask()` à l'intérieur de `input()` pour la boucle scriptable.** `input()` dans un script de test pend. Passe `ask` comme appelable et construis un vrai wrapper à base de `input` pour l'usage interactif — c'est le motif qui rend le tuteur à la fois testable et utilisable.
- **Persister avant que `last` soit défini.** Le champ `last` n'est ajouté que pendant `review`, donc les cartes non révisées dans une session ne l'auront pas dans le fichier enregistré — et un futur chargement verra une incohérence de schéma. Soit initialise `last` dans `new_card`, soit n'enregistre qu'après une session complète.
- **Enregistrer comme liste plate.** Une liste de dicts fonctionne pour un petit deck, mais deux apprenants ne peuvent pas partager le même fichier, et il n'y a pas de métadonnées par deck. Un dict indexé par nom de deck est une amélioration à faible effort qui pérennise le format.

## Ce que tu viens de construire

Un tuteur qui se souvient de tes points faibles, planifie les révisions avec de vraies maths, persiste son état honnêtement et peut rédiger un indice quand un LLM est disponible. Le moteur SM-2 est une fonction de cinq lignes ; le reste est de la plomberie de données propre — un deck de dicts, une boucle qui filtre et mute, et un fichier JSON. La forme transférable — *fonction pure pour la logique centrale, boucle de session mutable pour les mises à jour d'état, JSON pour la persistance, LLM optionnel pour l'intelligence* — est le même squelette derrière les planificateurs, les traceurs d'habitudes et tout outil d'état léger.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/ai-tutor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-tutor) dans le dépôt du cours est le tuteur complet en notebook — le même deck de départ, la session scriptée, la vérification de persistance et l'indice LLM optionnel, tout exécutable dans Colab/Kaggle/Binder. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute une ligne de repli `hint = card["hint"]` : quand l'apprenant se trompe sur une carte et qu'il n'y a pas de clé API, affiche immédiatement l'indice *stocké* — le tuteur aide désormais même sans LLM.
- Construis une fonction `stats()` qui lit `progress.json` et affiche la plus longue série de réussites de l'apprenant, la qualité moyenne et les cartes dues dans les 7 prochains jours.
- Ajoute un deuxième deck (par ex. un deck de vocabulaire) et un drapeau `--deck` pour que le même CLI serve plusieurs matières.
- Stocke un journal de session comme second fichier JSON avec une liste de lignes `{id, quality, timestamp}` — les données brutes d'un futur graphique de progression.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓