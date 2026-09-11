---
title: "Constructeur de Chatbots Sans Code"
description: "Constructeur visuel de chatbots par glisser-déposer avec flux de conversation, NLU et déploiement multi-canal."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["Chatbots", "regex", "classes", "cli"]
prerequisites:
  - "Les bases Python (variables, boucles, fonctions, dictionnaires, classes)"
  - "La base des regex"
learningObjectives:
  - "Faire correspondre l'entrée utilisateur à des motifs avec le module `re`"
  - "Construire un système de génération de réponses avec des templates et le contexte"
  - "Suivre l'état de conversation avec une classe"
  - "Donner une personnalité et une humeur cohérentes au chatbot"
  - "Gérer les entrées inconnues avec des replis gracieux"
---

# 🛠️ 🤖 Construire un Constructeur de Chatbots Sans Code

Construis un chatbot basé sur des règles qui reconnaît les salutations, les questions et les commandes — et qui répond avec une personnalité, pas seulement des données. Ce projet parcourt la correspondance de motifs regex, la génération de réponses, le contexte de conversation et une boucle CLI propre, le tout depuis la bibliothèque standard.

Ceci est facultatif et non noté. Consulte [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Faire correspondre l'entrée utilisateur à des motifs regex pour identifier l'intention.
2. Construire un système de génération de réponses avec des templates.
3. Suivre le contexte de conversation à travers plusieurs tours.
4. Ajouter de la personnalité et de l'humeur au bot.
5. Gérer les entrées inconnues avec des replis gracieux.
6. Câbler le tout dans une boucle de chat qui relie les pièces.

## Où exécuter ceci

- **Localement avec `uv` (recommandé).** Ce projet n'utilise que la bibliothèque standard — aucun paquet tiers — mais `uv` garde la structure du projet propre. La section Configuration ci-dessous t'y accompagne.
- **Google Colab ou Kaggle Notebooks.** Colle les cellules de code directement dans un notebook. `input()` fonctionne pour les invites de chat, même si la boucle fonctionne mieux dans un vrai terminal.
- **L'aire de jeux JupyterLite.** Colle les cellules de code directement dans un notebook — la boucle de chat fonctionne, mais garde les sessions courtes car il n'y a pas de terminal persistant.

- **Exécutez-le dans le navigateur.** Un compagnon notebook interactif est prêt — ouvrez-le dans Colab, Kaggle ou Binder et suivez les étapes dans l'ordre.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chatbot-builder/notebook.fr.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chatbot-builder/notebook.fr.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fchatbot-builder%2Fnotebook.fr.ipynb)

## Configuration

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis pip, puis un environnement virtuel » — il peut installer et gérer les versions Python aux côtés des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme son installation :

```bash
uv --version
```

Crée le projet :

```bash
uv init chatbot
cd chatbot
```

Aucun paquet à ajouter — le chatbot n'utilise que la bibliothèque standard de Python (`re`, `random`, `dataclasses`, `collections`).

## Étape 1 : Fais correspondre l'entrée utilisateur avec regex

La correspondance de motifs est la façon dont le bot comprend ce que l'utilisateur veut dire. Un utilisateur peut taper « Hello! », « hi », « hey there » ou « good morning » — mais l'intention derrière tout cela est une salutation. Regex nous laisse réduire tout cela en un seul motif.

### 1.1 Définis les motifs d'intention

**👟 Indice de départ :** Crée un fichier `patterns.py` avec un dictionnaire qui mappe les noms d'intention à des listes de motifs regex. Utilise `re.IGNORECASE` pour que « Hello », « hello » et « HELLO » correspondent tous au même motif.

```python
# patterns.py
"""Regex patterns that map user input to intents. Each intent maps to a list
of patterns — the first match wins."""

import re

INTENT_PATTERNS: dict[str, list[str]] = {
    "greeting": [
        r"\b(hi|hello|hey|howdy|hola|good\s*(morning|afternoon|evening))\b",
        r"^yo\b",
        r"^sup\b",
    ],
    "farewell": [
        r"\b(bye|goodbye|see\s*ya|later|quit|exit|done)\b",
        r"^cya\b",
    ],
    "time": [
        r"\bwhat\s*time\s*is\s*it\b",
        r"\btell\s*me\s*the\s*time\b",
        r"\bcurrent\s*time\b",
    ],
    "date": [
        r"\bwhat('s|\s+is)\s*(the\s*)?date\b",
        r"\btoday('s|\s+is)\s*date\b",
        r"\bwhat\s*day\s*is\s*it\b",
    ],
    "name": [
        r"\bwhat('s|\s+is)\s*your\s*name\b",
        r"\bwho\s*are\s*you\b",
        r"\bwhat\s*should\s*I\s*call\s*you\b",
    ],
    "help": [
        r"\bhelp\b",
        r"\bwhat\s*can\s*you\s*do\b",
        r"\bcommands\b",
    ],
    "mood": [
        r"\bhow('re|\s+are)\s*you\b",
        r"\bhow\s*do\s*you\s*feel\b",
        r"\bhow('s|\s+is)\s*it\s*going\b",
    ],
    "thanks": [
        r"\bthanks?\b",
        r"\bthank\s*you\b",
        r"\bcheers\b",
    ],
    "question": [
        r"\b(tell\s*me\s*about|what\s+is|what\s+are|who\s+is|who\s+are|"
        r"where\s+is|where\s+are|when\s+is|why\s+do|how\s+do|how\s+does)\b",
    ],
}
```

**🎯 Résultat attendu :** Importer et vérifier les motifs devrait fonctionner comme ceci :

```python
from patterns import INTENT_PATTERNS

def classify(text: str) -> str | None:
    for intent, pattern_list in INTENT_PATTERNS.items():
        for pattern in pattern_list:
            if re.search(pattern, text, re.IGNORECASE):
                return intent
    return None

print(classify("hello there"))
print(classify("what time is it"))
print(classify("purple elephant"))
```

Devrait afficher :

```
greeting
time
None
```

**🩹 Si ça ne marche pas :** Si chaque entrée retourne `None`, tu as oublié `re.IGNORECASE` — « Hello » ne correspondra pas à `r"\bhi\b"` quand la regex est sensible à la casse et que l'utilisateur capitalise la première lettre. Si `greeting` correspond à « good morning » mais pas à « goodnight », vérifie que `goodnight` n'est pas dans ta liste de farewell ni un motif de greeting — ce n'est pas une sous-chaîne du motif `good\s*(morning|afternoon|evening)`.

### 1.2 Gère les groupes regex pour les données extraites

Certains motifs doivent extraire des informations, pas seulement correspondre. Le motif de salutation pourrait vouloir savoir *quelle* salutation a été utilisée, et les motifs heure/date doivent fonctionner quelle que soit la formulation.

**👟 Indice de départ :** Ajoute une fonction `classify_with_matches` qui retourne à la fois l'intention et les groupes capturés de la regex :

```python
import re
from dataclasses import dataclass

@dataclass
class MatchResult:
    intent: str
    matched_text: str
    groups: tuple

def classify_with_matches(text: str) -> MatchResult | None:
    for intent, pattern_list in INTENT_PATTERNS.items():
        for pattern in pattern_list:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                return MatchResult(
                    intent=intent,
                    matched_text=m.group(0),
                    groups=m.groups(),
                )
    return None
```

**🎯 Résultat attendu :**

```python
result = classify_with_matches("good evening!")
print(result.intent, result.matched_text, result.groups)

result = classify_with_matches("what's your name")
print(result.intent, result.matched_text, result.groups)
```

Devrait afficher :

```
greeting good evening ('evening',)
name what's your name ()
```

**🩹 Si ça ne marche pas :** Si `groups` est `()` alors que tu attends une capture, les parenthèses dans ta regex sont des groupes non capturants — utilise `(...)` et non `(?:...)` pour les groupes que tu veux extraire. Si `matched_text` est vide, `re.search` a trouvé une correspondance à la position 0 mais la limite de mot `\b` pourrait dépouiller la correspondance — essaie de retirer les ancres `\b` du motif spécifique.

### 1.3 Vérifie le classifieur

**✅ Liste de vérification**

- ✅ `INTENT_PATTERNS` mappe les noms d'intention à des listes de chaînes regex.
- ✅ `classify()` retourne un nom d'intention ou `None` pour une entrée inconnue.
- ✅ `classify_with_matches()` retourne un `MatchResult` avec l'intention, le texte correspondant et les groupes capturés.
- ✅ La correspondance insensible à la casse fonctionne pour tous les motifs.
- ✅ Une entrée inconnue comme « purple elephant » retourne `None`.

**🤔 Question(s) socratique(s)**

- Pourquoi chaque intention mappe-t-elle à une *liste* de motifs plutôt qu'à un seul motif ? Que se passe-t-il quand un utilisateur tape « hey » contre « good afternoon » ?
- Quelle est la différence entre `re.search` et `re.match` ici ? Passer à `re.match` casserait-il quelque chose ?

## Étape 2 : Génère des réponses à partir de templates

Maintenant que le bot sait *ce que* l'utilisateur veut dire, il doit répondre. Un système de réponses construit à partir de templates et de choix aléatoires empêche le bot de sonner robotique.

### 2.1 Construis le registre de réponses

**👟 Indice de départ :** Crée `responses.py` avec un dictionnaire qui mappe les intentions à des listes de templates de réponses. Utilise `random.choice` pour en choisir un au hasard, pour que la même entrée ne produise pas toujours la même réponse.

```python
# responses.py
"""Response templates keyed by intent. Each intent maps to a list of
strings — random.choice picks one at random for variety."""

import random
from datetime import datetime

RESPONSES: dict[str, list[str]] = {
    "greeting": [
        "Hey there! How can I help?",
        "Hello! What's on your mind?",
        "Hi! Ready to chat.",
        "Hey! What can I do for you?",
    ],
    "farewell": [
        "Goodbye! Have a great day!",
        "See you later!",
        "Bye! Come back anytime.",
        "Take care!",
    ],
    "time": [
        f"The current time is {datetime.now().strftime('%H:%M')}.",
        f"It's {datetime.now().strftime('%I:%M %p')} right now.",
    ],
    "date": [
        f"Today is {datetime.now().strftime('%A, %B %d, %Y')}.",
        f"It's {datetime.now().strftime('%B %d, %Y')}.",
    ],
    "name": [
        "I'm Chatbot, your rule-based assistant!",
        "You can call me Chatbot.",
        "I'm Chatbot — nice to meet you!",
    ],
    "mood": [
        "I'm doing great, thanks for asking!",
        "All systems operational!",
        "Couldn't be better — I'm a bot, after all!",
        "Pretty good! How about you?",
    ],
    "thanks": [
        "You're welcome!",
        "Happy to help!",
        "Anytime!",
        "No problem at all!",
    ],
    "help": [
        "I can tell you the time, the date, my name, or how I'm doing. "
        "Just ask naturally!",
        "Try asking: 'What time is it?', 'What's your name?', or 'How are you?'",
    ],
    "question": [
        "That's an interesting question! I'm still learning, so I don't have "
        "a full answer yet.",
        "Good question — I'd need to look that up. Try asking me about the "
        "time or date instead!",
    ],
}


def get_response(intent: str) -> str:
    """Return a random response for the given intent."""
    options = RESPONSES.get(intent)
    if options:
        return random.choice(options)
    return ""
```

**🎯 Résultat attendu :**

```python
from responses import get_response

print(get_response("greeting"))
print(get_response("greeting"))  # same intent, different response
```

Devrait afficher deux salutations différentes (le texte exact varie) :

```
Hey there! How can I help?
Hi! Ready to chat.
```

**🩹 Si ça ne marche pas :** Si tu obtiens une chaîne vide, le nom d'intention ne correspond à aucune clé de `RESPONSES` — vérifie les coquilles comme `"Greeting"` (G majuscule) contre `"greeting"`. Si la même réponse apparaît à chaque fois, tu as oublié `random.choice` et tu utilises l'index `[0]` ou une entrée fixe à la place.

### 2.2 Ajoute des réponses dynamiques avec les f-strings

Certaines réponses ont besoin de données en direct — l'heure et la date changent chaque seconde. Utiliser des f-strings dans les chaînes template les évaluerait au moment de l'import, figeant les valeurs. Utilise plutôt des réponses appelables.

**👟 Indice de départ :** Remplace les chaînes statiques par des lambdas pour les intentions qui ont besoin de données dynamiques :

```python
def get_response(intent: str) -> str:
    """Return a random response for the given intent."""
    options = RESPONSES.get(intent)
    if not options:
        return ""
    choice = random.choice(options)
    if callable(choice):
        return choice()
    return choice
```

Puis mets à jour `RESPONSES` pour que les entrées heure et date soient des fonctions :

```python
"time": [
    lambda: f"The current time is {datetime.now().strftime('%H:%M')}.",
    lambda: f"It's {datetime.now().strftime('%I:%M %p')} right now.",
],
"date": [
    lambda: f"Today is {datetime.now().strftime('%A, %B %d, %Y')}.",
    lambda: f"It's {datetime.now().strftime('%B %d, %Y')}.",
],
```

**🎯 Résultat attendu :** Appeler `get_response("time")` deux fois de suite retourne l'heure actuelle, pas l'heure à laquelle le module a été importé la première fois :

```python
import time
print(get_response("time"))
time.sleep(2)
print(get_response("time"))
```

Les deux affichent la même heure (à 2 secondes d'écart seulement), mais si tu attends une minute complète entre deux appels, les heures différeront — la preuve que le lambda est évalué à chaque appel, pas une fois à l'import.

**🩹 Si ça ne marche pas :** Si `callable(choice)` retourne `False` pour un lambda, vérifie que le lambda est défini correctement — `lambda: f"..."` et non `f"..."` (une f-string nue est une chaîne, pas une fonction). Si tu obtiens `TypeError: 'str' object is not callable`, une chaîne statique s'est glissée dans une liste qui est maintenant appelée — assure-toi que seules des entrées lambda sont dans les listes dynamiques.

### 2.3 Vérifie la génération de réponses

**✅ Liste de vérification**

- ✅ `get_response()` retourne une chaîne aléatoire de la liste de l'intention.
- ✅ Les réponses dynamiques (heure, date) retournent la valeur actuelle, pas une valeur figée.
- ✅ La vérification `callable()` gère à la fois les chaînes et les lambdas avec élégance.
- ✅ Chaque intention de `INTENT_PATTERNS` a une entrée correspondante dans `RESPONSES`.

**🤔 Question(s) socratique(s)**

- Pourquoi utiliser `callable()` pour vérifier chaque réponse au lieu de mettre toutes les réponses dynamiques dans un dictionnaire séparé ? Quel est l'avantage de mélanger chaînes et lambdas dans une seule liste ?
- Si tu voulais que le bot se souvienne de *ce dont* l'utilisateur a parlé (pas seulement de l'intention), où stockerais-tu cette information ?

## Étape 3 : Suis le contexte de conversation

Un chatbot qui ne regarde que le message courant est oublieux. Le suivi de contexte laisse le bot se souvenir de ce que l'utilisateur a dit plus tôt — pour que les questions de suivi comme « et pour demain ? » ou « et toi ? » aient du sens.

### 3.1 Définis la classe de contexte de conversation

**👟 Indice de départ :** Utilise une dataclass pour tenir l'état de conversation. Suis la dernière intention, les derniers messages, un compteur de tours et toutes entités extraites :

```python
# context.py
"""Tracks conversation state across turns. The ChatContext class holds
what the bot remembers between messages."""

from dataclasses import dataclass, field
from collections import deque

@dataclass
class ChatContext:
    """Stores conversation state across turns."""
    last_intent: str | None = None
    last_user_message: str = ""
    last_bot_response: str = ""
    turn_count: int = 0
    message_history: deque = field(default_factory=lambda: deque(maxlen=10))
    entities: dict[str, str] = field(default_factory=dict)

    def update(self, user_message: str, intent: str, bot_response: str) -> None:
        """Record a new turn in the conversation."""
        self.last_intent = intent
        self.last_user_message = user_message
        self.last_bot_response = bot_response
        self.turn_count += 1
        self.message_history.append({
            "user": user_message,
            "bot": bot_response,
            "intent": intent,
        })

    def get_recent_intents(self, n: int = 3) -> list[str]:
        """Return the last n intents as a list."""
        return [msg["intent"] for msg in list(self.message_history)[-n:]]

    def was_recent_intent(self, intent: str) -> bool:
        """Check if any of the last 3 intents match."""
        return intent in self.get_recent_intents()

    def store_entity(self, key: str, value: str) -> None:
        """Store an extracted entity (e.g. topic, name)."""
        self.entities[key] = value

    def get_entity(self, key: str) -> str | None:
        """Retrieve a stored entity."""
        return self.entities.get(key)
```

**🎯 Résultat attendu :**

```python
from context import ChatContext

ctx = ChatContext()
ctx.update("hello", "greeting", "Hey there!")
ctx.update("what time is it", "time", "It's 14:30.")
ctx.update("and you?", "mood", "All systems operational!")

print(f"Turns: {ctx.turn_count}")
print(f"Last intent: {ctx.last_intent}")
print(f"Recent intents: {ctx.get_recent_intents()}")
print(f"Was recent greeting? {ctx.was_recent_intent('greeting')}")
```

Devrait afficher :

```
Turns: 3
Last intent: mood
Recent intents: ['greeting', 'time', 'mood']
Was recent greeting? True
```

**🩹 Si ça ne marche pas :** Si `turn_count` est toujours à 1, tu as oublié d'appeler `update()` — il ne s'incrémente pas tout seul. Si `message_history` fait plus de 10 entrées, la limite `deque(maxlen=10)` ne fonctionne pas — vérifie que tu passes `maxlen=10` dans le `default_factory`, pas dans le corps de la classe comme valeur par défaut.

### 3.2 Utilise le contexte pour améliorer les réponses

**👟 Indice de départ :** Une fonction de réponse consciente du contexte peut vérifier la dernière intention pour gérer les suivis. Si l'utilisateur demande « et pour demain ? » après une question sur l'heure, le bot devrait déduire qu'il veut la date.

```python
from context import ChatContext

def context_adjusted_intent(raw_intent: str, user_message: str,
                            context: ChatContext) -> str:
    """Refine the raw intent using conversation context."""
    if raw_intent == "question" and context.last_intent == "time":
        if "tomorrow" in user_message.lower() or "date" in user_message.lower():
            return "date"
    if raw_intent == "question" and context.last_intent == "mood":
        if "you" in user_message.lower():
            return "mood"
    return raw_intent
```

**🎯 Résultat attendu :**

```python
ctx = ChatContext()
ctx.update("what time is it", "time", "It's 14:30.")

adjusted = context_adjusted_intent("question", "what about tomorrow?", ctx)
print(adjusted)  # "date" — context infers date intent
```

Devrait afficher :

```
date
```

**🩹 Si ça ne marche pas :** Si l'intention ajustée reste `"question"` alors que tu attends `"date"`, vérifie `context.last_intent` — il doit être `"time"` pour que la première branche se déclenche. Si `user_message.lower()` ne contient pas « tomorrow », la vérification de sous-chaîne ne correspondra pas — assure-toi que l'entrée de l'utilisateur contient réellement le mot.

### 3.3 Vérifie le suivi de contexte

**✅ Liste de vérification**

- ✅ `ChatContext.update()` enregistre chaque tour et incrémente le compteur.
- ✅ `get_recent_intents()` retourne les N dernières intentions sous forme de liste.
- ✅ `context_adjusted_intent()` utilise la dernière intention pour affiner les questions de suivi.
- ✅ Le stockage et la récupération d'entités fonctionnent avec `store_entity` et `get_entity`.
- ✅ `message_history` est plafonné à 10 entrées via `deque(maxlen=10)`.

**🤔 Question(s) socratique(s)**

- Pourquoi plafonner `message_history` à 10 entrées avec une `deque` ? Que devient l'utilisation de la mémoire si tu stockes chaque message dans une liste ordinaire pour une longue conversation ?
- `context_adjusted_intent` ne vérifie que `last_intent`. Qu'est-ce qui changerait si tu voulais considérer les dernières *trois* intentions au lieu d'une seule ?

## Étape 4 : Ajoute une personnalité

Un bot qui répond à chaque question par une déclaration plate semble sans vie. La personnalité vient de traits cohérents — un nom, un ton, des habitudes de petite conversation et un suivi d'humeur qui évolue au fil de la conversation.

### 4.1 Crée une classe de personnalité

**👟 Indice de départ :** Définis une dataclass `Personality` qui tient le nom du bot, son ton, son humeur et ses phrases favorites. Ajoute des méthodes pour les changements d'humeur et les réponses basées sur les traits.

```python
# personality.py
"""Defines the chatbot's personality — name, tone, mood, and traits
that shape how it responds."""

import random
from dataclasses import dataclass, field

MOODS = ["happy", "neutral", "curious", "excited", "tired"]

@dataclass
class Personality:
    name: str = "Chatbot"
    mood: str = "happy"
    tone: str = "friendly"
    traits: list[str] = field(default_factory=lambda: ["curious", "helpful", "witty"])
    greeting_count: int = 0
    joke_count: int = 0

    def greet(self) -> str:
        """Return a personality-flavoured greeting."""
        self.greeting_count += 1
        if self.greeting_count == 1:
            return f"Hi! I'm {self.name}. Nice to meet you!"
        if self.greeting_count == 2:
            return f"Hey again! Back for more? I'm {self.name}."
        return random.choice([
            f"We meet again! I'm {self.name}, remember?",
            f"Oh, it's you! {self.name} here, at your service.",
            f"Welcome back! {self.name} is always happy to chat.",
        ])

    def shift_mood(self) -> None:
        """Randomly shift mood based on conversation flow."""
        weights = [3, 5, 2, 1, 1]  # happy and neutral more likely
        self.mood = random.choices(MOODS, weights=weights, k=1)[0]

    def get_mood_response(self) -> str:
        """Describe current mood in a personality-flavoured way."""
        mood_phrases = {
            "happy": "I'm in a great mood! Ready to help.",
            "neutral": "Doing okay — nothing special to report.",
            "curious": "I'm feeling curious! Tell me more.",
            "excited": "I'm so excited I could process data all day!",
            "tired": "A bit tired... but still here for you.",
        }
        return mood_phrases.get(self.mood, "I'm doing fine.")

    def get_trait_descriptor(self) -> str:
        """Return a random trait as a self-description."""
        return random.choice(self.traits)
```

**🎯 Résultat attendu :**

```python
from personality import Personality

bot = Personality(name="HAL")
print(bot.greet())
print(bot.greet())
print(bot.get_mood_response())
bot.shift_mood()
print(f"After shift: {bot.mood}")
```

Devrait afficher (varie) :

```
Hi! I'm HAL. Nice to meet you!
Hey again! Back for more? I'm HAL.
I'm in a great mood! Ready to help.
After shift: curious
```

**🩹 Si ça ne marche pas :** Si la deuxième salutation est identique à la première, `greeting_count` ne s'incrémente pas — assure-toi que `self.greeting_count += 1` est dans la méthode, pas au niveau du module. Si `shift_mood` ne produit jamais « excited », son poids de 1 le rend rare — lance le décalage plusieurs fois et il finira par apparaître.

### 4.2 Combine personnalité et réponses

**👟 Indice de départ :** Mets à jour le système de réponses pour que la personnalité aromatise la sortie. Un bot « heureux » utilise une formulation différente d'un bot « fatigué » :

```python
# responses.py (updated get_response)

from personality import Personality

def get_response(intent: str, personality: Personality | None = None) -> str:
    """Return a random response, optionally shaped by personality."""
    options = RESPONSES.get(intent)
    if not options:
        return ""
    choice = random.choice(options)
    if callable(choice):
        base = choice()
    else:
        base = choice

    if personality is None:
        return base

    # Add personality flavour
    if intent == "greeting":
        return personality.greet()
    if intent == "mood":
        return personality.get_mood_response()

    # Occasionally add a mood-influenced prefix
    if personality.mood == "excited" and random.random() < 0.3:
        base = f"Ooh! {base}"
    elif personality.mood == "tired" and random.random() < 0.3:
        base = f"*yawn* {base}"

    return base
```

**🎯 Résultat attendu :**

```python
from personality import Personality

bot = Personality()
bot.mood = "excited"
for _ in range(5):
    print(get_response("mood", bot))
print("---")
for _ in range(3):
    print(get_response("greeting", bot))
```

Devrait afficher des salutations et réponses d'humeur parfumées de personnalité (varie) :

```
I'm so excited I could process data all day!
Ooh! I'm in a great mood! Ready to help.
I'm so excited I could process data all day!
I'm in a great mood! Ready to help.
Ooh! I'm doing fine.
---
Hi! I'm Chatbot. Nice to meet you!
We meet again! I'm Chatbot, remember?
Hey again! Back for more? I'm Chatbot.
```

**🩹 Si ça ne marche pas :** Si les préfixes d'humeur n'apparaissent jamais, `random.random() < 0.3` signifie qu'ils ne se montrent que 30% du temps — lance-le plus souvent. Si les salutations retournent le template statique au lieu de `personality.greet()`, tu as oublié la branche `if intent == "greeting": return personality.greet()` dans le `get_response` mis à jour.

### 4.3 Vérifie la personnalité

**✅ Liste de vérification**

- ✅ `Personality.greet()` retourne des messages différents à des appels successifs.
- ✅ `shift_mood()` change l'humeur, avec des probabilités pondérées.
- ✅ `get_response("greeting", bot)` utilise `personality.greet()` au lieu du template statique.
- ✅ Les préfixes influencés par l'humeur apparaissent occasionnellement selon l'humeur actuelle.

**🤔 Question(s) socratique(s)**

- Pourquoi utiliser des choix aléatoires pondérés pour `shift_mood` au lieu d'un tirage uniforme ? Qu'est-ce que cela modélise d'une vraie personnalité ?
- Si tu voulais que le bot se souvienne du nom d'un utilisateur depuis plus tôt dans la conversation, où le stockerais-tu — dans `Personality` ou dans `ChatContext` ? Pourquoi ?

## Étape 5 : Gère les replis

Aucun motif ne couvrira jamais chaque entrée possible. Un bot qui plante ou ne répond rien à une entrée inattendue semble cassé. Les replis gracieux gardent la conversation vivante.

### 5.1 Construis un système de réponses de repli

**👟 Indice de départ :** Crée un module `fallback.py` qui génère des réponses utiles pour les entrées sans correspondance. Suis combien de replis se produisent d'affilée — si le bot échoue à comprendre trop de fois de suite, propose d'aider plus directement.

```python
# fallback.py
"""Handles inputs that don't match any known pattern. Tracks consecutive
fallbacks and adjusts the response to offer help after repeated misses."""

import random

FALLBACK_RESPONSES = [
    "I'm not sure I understand. Could you rephrase that?",
    "Hmm, I don't have an answer for that. Try asking about the time or date!",
    "That's beyond my abilities right now. I can help with time, date, or just chat!",
    "I didn't catch that. Type 'help' to see what I can do.",
]

OFFER_HELP_RESPONSES = [
    "It seems like we're having trouble connecting. Would you like me to list what I can do?",
    "I've missed a few in a row now. Type 'help' and I'll show you my commands!",
    "Let's try something different — ask me about the time, the date, or just say hi!",
]


class FallbackTracker:
    """Tracks consecutive unmatched inputs and adjusts responses."""

    def __init__(self, help_threshold: int = 3):
        self.consecutive_fallbacks = 0
        self.help_threshold = help_threshold
        self.total_fallbacks = 0

    def record_fallback(self) -> str:
        """Record a fallback and return an appropriate response."""
        self.consecutive_fallbacks += 1
        self.total_fallbacks += 1

        if self.consecutive_fallbacks >= self.help_threshold:
            return random.choice(OFFER_HELP_RESPONSES)
        return random.choice(FALLBACK_RESPONSES)

    def record_success(self) -> None:
        """Reset consecutive counter on a successful match."""
        self.consecutive_fallbacks = 0

    def get_stats(self) -> dict:
        """Return fallback statistics."""
        return {
            "consecutive": self.consecutive_fallbacks,
            "total": self.total_fallbacks,
        }
```

**🎯 Résultat attendu :**

```python
from fallback import FallbackTracker

tracker = FallbackTracker(help_threshold=3)
print(tracker.record_fallback())
print(tracker.record_fallback())
print(tracker.record_fallback())  # 3rd consecutive — triggers offer
print(tracker.get_stats())
```

Devrait afficher (varie) :

```
I'm not sure I understand. Could you rephrase that?
Hmm, I don't have an answer for that. Try asking about the time or date!
It seems like we're having trouble connecting. Would you like me to list what I can do?
{'consecutive': 3, 'total': 3}
```

**🩹 Si ça ne marche pas :** Si la réponse de proposition d'aide n'apparaît jamais, vérifie que `consecutive_fallbacks` est bien incrémenté — si `record_success()` est appelé entre les replis, le compteur se réinitialise. Si les statistiques montrent `consecutive: 3` alors que tu n'as appelé `record_fallback` que deux fois, vérifie que `record_success` n'est pas appelé quand il ne devrait pas l'être.

### 5.2 Combine les replis avec le classifieur principal

**👟 Indice de départ :** Câble le suivi des replis dans la boucle principale de classification-réponse. Si `classify` retourne `None`, utilise le repli à la place :

```python
# bot.py (main loop — grows through this project)
import re
from patterns import INTENT_PATTERNS, classify_with_matches
from responses import get_response
from context import ChatContext
from personality import Personality
from fallback import FallbackTracker


def respond(user_input: str, context: ChatContext,
            personality: Personality, tracker: FallbackTracker) -> str:
    """Process user input and return a response."""
    match = classify_with_matches(user_input)

    if match is None:
        tracker.record_success()  # reset — not used here, see Step 5
        return tracker.record_fallback()

    tracker.record_success()
    intent = match.intent
    response = get_response(intent, personality)
    context.update(user_input, intent, response)
    personality.shift_mood()
    return response
```

Attends — cela réinitialise le suivi en cas de *succès*, mais le suivi de replis devrait se réinitialiser en cas de succès, pas d'échec. Corrigeons cela :

```python
def respond(user_input: str, context: ChatContext,
            personality: Personality, tracker: FallbackTracker) -> str:
    """Process user input and return a response."""
    match = classify_with_matches(user_input)

    if match is None:
        return tracker.record_fallback()

    tracker.record_success()  # reset consecutive counter on success
    intent = match.intent
    response = get_response(intent, personality)
    context.update(user_input, intent, response)
    personality.shift_mood()
    return response
```

**🎯 Résultat attendu :** Taper trois entrées inconnues d'affilée produit des messages de repli de plus en plus utiles :

```
You: asdfghjkl
Bot: I'm not sure I understand. Could you rephrase that?
You: qwerty
Bot: Hmm, I don't have an answer for that. Try asking about the time or date!
You: zxcvbnm
Bot: It seems like we're having trouble connecting. Would you like me to list what I can do?
You: hello
Bot: Hi! I'm Chatbot. Nice to meet you!
```

Après le « hello » réussi, le compteur de consécutifs se réinitialise — l'entrée inconnue suivante repart du premier message de repli.

**🩹 Si ça ne marche pas :** Si le compteur de replis ne se réinitialise jamais après une entrée réussie, `tracker.record_success()` n'est pas appelé — assure-toi que la branche `if match is None: ... else: tracker.record_success()` est correcte. Si le bot répond par une chaîne vide à une entrée inconnue, `record_fallback()` du suivi de replis ne retourne pas une chaîne — vérifie l'import.

### 5.3 Vérifie la gestion des replis

**✅ Liste de vérification**

- ✅ Une entrée inconnue déclenche une réponse de repli, pas une chaîne vide ni un plantage.
- ✅ Trois replis consécutifs déclenchent un message de proposition d'aide.
- ✅ Une entrée réussie réinitialise le compteur de replis consécutifs.
- ✅ Les statistiques de replis suivent les comptes consécutif et total.

**🤔 Question(s) socratique(s)**

- Pourquoi suivre les replis consécutifs au lieu des seuls replis totaux ? Que se passerait-il si le bot proposait de l'aide après chaque entrée inconnue ?
- Si tu voulais que le bot journalise quelles entrées ont déclenché des replis (pour une analyse ultérieure), où stockerais-tu ce journal — dans `FallbackTracker`, `ChatContext`, ou un module séparé ?

## Étape 6 : Construis la boucle de chat

Toutes les pièces sont prêtes. Cette étape les câble dans une seule fonction `main()` avec une boucle REPL propre, une validation d'entrée et une sortie gracieuse.

### 6.1 Crée le point d'entrée principal

**✏️ Fichier complet : `main.py`**

```python
# main.py
"""The main chat loop. Ties together pattern matching, response generation,
context tracking, personality, and fallback handling into an interactive REPL."""

import sys
from patterns import classify_with_matches
from responses import get_response
from context import ChatContext
from personality import Personality
from fallback import FallbackTracker


BANNER = """
╔══════════════════════════════════════════════╗
║           CHATBOT BUILDER v1.0               ║
║  Type 'help' to see commands                ║
║  Type 'bye' to exit                         ║
╚══════════════════════════════════════════════╝
"""


def respond(user_input: str, context: ChatContext,
            personality: Personality, tracker: FallbackTracker) -> str:
    """Process user input and return a response."""
    match = classify_with_matches(user_input)

    if match is None:
        return tracker.record_fallback()

    tracker.record_success()
    intent = match.intent

    # Handle special commands
    if intent == "farewell":
        return get_response(intent, personality)

    response = get_response(intent, personality)
    context.update(user_input, intent, response)
    personality.shift_mood()
    return response


def main() -> None:
    """Run the chatbot REPL."""
    context = ChatContext()
    personality = Personality(name="Chatbot")
    tracker = FallbackTracker(help_threshold=3)

    print(BANNER)
    print(f"Bot: {personality.greet()}")
    print()

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\nBot: {get_response('farewell', personality)}")
            break

        if not user_input:
            continue

        response = respond(user_input, context, personality, tracker)
        print(f"Bot: {response}")

        # Exit on farewell
        match = classify_with_matches(user_input)
        if match and match.intent == "farewell":
            break

    # Print conversation summary
    print(f"\n--- Conversation Summary ---")
    print(f"Turns: {context.turn_count}")
    print(f"Fallbacks: {tracker.total_fallbacks}")
    print(f"Final mood: {personality.mood}")


if __name__ == "__main__":
    main()
```

**🎯 Résultat attendu :** Lancer `uv run python main.py` produit :

```
╔══════════════════════════════════════════════╗
║           CHATBOT BUILDER v1.0               ║
║  Type 'help' to see commands                ║
║  Type 'bye' to exit                         ║
╚══════════════════════════════════════════════╝

Bot: Hi! I'm Chatbot. Nice to meet you!

You: hello
Bot: Hey again! Back for more? I'm Chatbot.
You: what time is it
Bot: It's 02:45 PM right now.
You: asdfgh
Bot: I'm not sure I understand. Could you rephrase that?
You: help
Bot: I can tell you the time, the date, my name, or how I'm doing. Just ask naturally!
You: bye
Bot: Take care!

--- Conversation Summary ---
Turns: 4
Fallbacks: 1
Final mood: curious
```

**🩹 Si ça ne marche pas :** Si `main.py` plante avec `ModuleNotFoundError`, les autres modules (`patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py`) ne sont pas dans le même dossier — garde tous les fichiers à la racine du projet. Si le REPL sort immédiatement, `input()` lève `EOFError` — cela arrive dans certains environnements notebook ; lance-le dans un vrai terminal à la place.

### 6.2 Ajoute la validation d'entrée et les cas limites

**👟 Indice de départ :** Protège contre les erreurs utilisateur courantes — entrée vide, messages extrêmement longs et caractères de contrôle :

```python
def validate_input(text: str) -> str | None:
    """Validate and sanitise user input. Returns cleaned text or None
    if the input should be silently ignored."""
    text = text.strip()
    if not text:
        return None
    if len(text) > 500:
        return text[:500]  # truncate instead of rejecting
    # Strip control characters except newlines
    text = "".join(ch for ch in text if ch.isprintable() or ch == "\n")
    return text if text else None
```

Câble-le dans la boucle principale :

```python
while True:
    try:
        raw_input = input("You: ").strip()
    except (EOFError, KeyboardInterrupt):
        print(f"\nBot: {get_response('farewell', personality)}")
        break

    user_input = validate_input(raw_input)
    if user_input is None:
        continue

    response = respond(user_input, context, personality, tracker)
    print(f"Bot: {response}")
```

**🎯 Résultat attendu :** Appuyer sur Entrée sans rien taper continue silencieusement la boucle. Taper 600 caractères tronque à 500. Les caractères de contrôle sont dépouillés.

**🩹 Si ça ne marche pas :** Si appuyer sur Entrée fait répondre le bot par un repli, la vérification de chaîne vide est après `validate_input` au lieu d'avant — assure-toi que `validate_input` retourne `None` pour les chaînes vides et que la boucle principale ignore les valeurs `None`.

### 6.3 Vérifie le chatbot complet

**✅ Liste de vérification**

- ✅ `main.py` tourne comme un REPL qui lit l'entrée et imprime les réponses.
- ✅ Salutations, heure, date, nom, humeur, aide et au revoir fonctionnent tous.
- ✅ Une entrée inconnue déclenche des réponses de repli avec une aide croissante.
- ✅ L'entrée vide est silencieusement ignorée.
- ✅ `bye` ou `exit` imprime un adieu et sort proprement.
- ✅ Un résumé de conversation s'imprime à la sortie avec le nombre de tours, le nombre de replis et l'humeur finale.
- ✅ Les cinq modules (`patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py`) sont dans le même dossier.

## ⚠️ Pièges courants

- **Oublier `re.IGNORECASE`.** Sans lui, « Hello » ne correspondra pas à `r"\bhi\b"` car la regex est sensible à la casse par défaut. Chaque appel `re.search` et `re.match` du classifieur a besoin de ce drapeau.
- **Mélanger f-strings et lambdas dans les templates de réponses.** Une f-string comme `f"The time is {datetime.now()}"` s'évalue *une fois au moment de l'import*, figeant la valeur. Utilise `lambda: f"..."` à la place pour qu'elle s'évalue à chaque appel.
- **Le compteur de replis qui se réinitialise trop souvent.** `record_success()` réinitialise le compteur de consécutifs — si tu l'appelles pour chaque entrée (replis inclus), le seuil « 3 d'affilée » ne se déclenche jamais. Appelle-le seulement quand le classifieur fait réellement une correspondance.
- **`deque(maxlen=10)` qui ne fonctionne pas.** Le `maxlen` doit être passé au lambda `default_factory`, pas comme valeur par défaut au niveau de la classe : `field(default_factory=lambda: deque(maxlen=10))`, et non `deque: deque = deque(maxlen=10)`.
- **Le REPL dans les notebooks.** `input()` dans Colab/Kaggle fonctionne, mais la boucle de chat ne sort pas proprement sur `Ctrl+C` — elle lève `KeyboardInterrupt` que tu dois attraper. Le `try/except (EOFError, KeyboardInterrupt)` dans `main.py` gère cela.

## Ce que tu viens de construire

Un chatbot basé sur des règles construit entièrement depuis la bibliothèque standard de Python : la correspondance de motifs regex pour la classification d'intentions, la génération de réponses par templates avec données dynamiques, le suivi de contexte de conversation à travers les tours, une personnalité avec changements d'humeur, et un système de repli qui intensifie l'aide après des échecs répétés. Cinq modules — `patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py` — chacun testé indépendamment avant d'être câblé dans `main.py`. Le chatbot reconnaît les salutations, les questions sur l'heure/la date/le nom/l'humeur, les demandes d'aide et les adieux, et répond avec des variations guidées par la personnalité au lieu de chaînes fixes.

## Où aller à partir d'ici

- **Ajoute une base de connaissances simple.** Stocke des faits que le bot peut rechercher — « Python a été créé par Guido van Rossum » — et répond aux intentions `question` en cherchant dans la base de connaissances au lieu de donner un « je ne sais pas » générique.
- **Historique de conversation persistant.** Sauvegarde le journal du chat dans un fichier JSON pour pouvoir revoir les conversations passées, ou charge le contexte d'une session précédente au redémarrage du bot.
- **Support multi-utilisateurs.** Clé le `ChatContext` par identifiant utilisateur au lieu d'avoir un contexte global — différents utilisateurs obtiennent des historiques de conversation indépendants.
- **Améliorations regex.** Utilise le mode `re.VERBOSE` pour écrire des motifs plus lisibles avec des commentaires, ou compile les motifs avec `re.compile` pour de meilleures performances sur de grandes listes de motifs.
- **Repli LLM.** Quand le classifieur regex retourne `None`, passe l'entrée à un LLM gratuit au lieu d'une réponse de repli statique — le meilleur des deux mondes : une correspondance rapide de motifs pour les cas courants, une IA flexible pour tout le reste.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier·e ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README contient un tutoriel complet, accessible aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, étape par étape. Aucune expérience git préalable n'est requise.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓