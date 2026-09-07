---
title: "Écrivain d'Histoires IA"
description: "Écriture de fiction collaborative avec IA qui maintient la cohérence des personnages et de l'intrigue."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["NLP", "Markov chains", "random", "text-generation", "classes"]
xpReward: 50
learningObjectives:
  - "Construire un générateur de texte à chaînes de Markov à partir de zéro"
  - "Entraîner le générateur sur un texte d'exemple pour apprendre les schémas d'écriture"
  - "Créer des modèles d'histoires avec des emplacements de variables pour le contenu généré"
  - "Concevoir des profils de personnages avec des traits, des objectifs et des histoires passées"
  - "Assembler des histoires multi-paragraphes à partir de modèles et de données de personnages"
  - "Contrôler la cohérence de la sortie avec un paramètre de température"
  - "Construire un menu CLI pour la génération interactive d'histoires"
prerequisites:
  - "Bases de Python (variables, boucles, fonctions, dictionnaires, classes)"
---

# Écrivain d'Histoires IA

Tu adores raconter des histoires, mais parfois la page blanche gagne. Dans ce projet, tu vas construire un outil qui apprend les schémas d'écriture d'un texte d'exemple et génère de nouvelles histoires en combinant la génération de texte par chaînes de Markov avec des modèles structurés et des profils de personnages. Le résultat est un générateur d'histoires qui produit des contes multi-paragraphes avec des personnages cohérents, des intrigues variées et un style contrôlable.

Ce projet suppose seulement des bases de niveau Python 101 — fonctions, listes, dictionnaires, boucles, classes et mise en forme de chaînes. Pas de frameworks, pas de bases de données, pas de services cloud. Tout ce dont tu as besoin vient de la bibliothèque standard.

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Construire une chaîne de Markov qui apprend les probabilités de transition de mots depuis n'importe quel texte.
2. Entraîner la chaîne sur des histoires d'exemple, des contes de fées ou des passages de science-fiction.
3. Créer des modèles d'histoires avec des emplacements de variables remplis par du texte généré.
4. Concevoir des profils de personnages avec des noms, des traits, des objectifs et des histoires passées.
5. Assembler des histoires multi-paragraphes complètes à partir de modèles et de données de personnages.
6. Ajouter un paramètre de température qui contrôle à quel point la sortie est sauvage ou conservatrice.
7. Construire un menu CLI pour générer des histoires de façon interactive depuis le terminal.

## Où exécuter ceci

- **En local avec `uv` (recommandé).** Ce projet utilise uniquement la bibliothèque standard de Python — aucun paquet tiers n'est nécessaire. La section Configuration ci-dessous te guide pas à pas.
- **Google Colab ou Kaggle Notebooks.** Colle les cellules de code directement dans un notebook.
- **Aire de jeux JupyterLite.** Colle les cellules de code directement dans un notebook — aucune lecture/écriture de fichier n'est requise, donc tout fonctionne dans le navigateur.

## Configuration

`uv` est un outil unique qui remplace la chaîne habituelle « installe Python, puis pip, puis un environnement virtuel, puis les paquets » — il gère ensemble les versions de Python et les dépendances.

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

Puis mets en place le projet :

```bash
uv init ai-story-writer
cd ai-story-writer
```

Aucun paquet supplémentaire — la bibliothèque standard a tout ce qu'il faut (`random`, `dataclasses`, `abc`, `json`, `textwrap`).

## Étape 1 : Les bases de la chaîne de Markov

Une chaîne de Markov est un modèle simple qui prédit l'élément suivant en se basant uniquement sur l'élément courant — elle n'a aucune mémoire de ce qui l'a précédée. Appliquée au texte, une chaîne de Markov de premier ordre regarde le mot courant et choisit le mot suivant depuis une distribution de probabilités construite sur du vrai texte. La chaîne apprend quels mots ont tendance à suivre quels autres mots, puis génère de nouvelles séquences qui imitent les schémas statistiques du texte d'entraînement.

### 1.1 Construis la structure de données de la chaîne

**👟 Indice de départ :** Utilise un dictionnaire dont les clés sont les mots courants et les valeurs sont les listes de tous les mots qui ont jamais suivi ce mot dans le texte d'entraînement. Le module `random` choisit le mot suivant dans la liste, de façon uniforme.

```python
import random
from collections import defaultdict


def build_chain(text: str) -> dict[str, list[str]]:
    """Build a first-order Markov chain from text.

    Returns a dict mapping each word to a list of words that followed it.
    """
    words = text.split()
    chain: dict[str, list[str]] = defaultdict(list)

    for i in range(len(words) - 1):
        current = words[i].lower()
        next_word = words[i + 1].lower()
        chain[current].append(next_word)

    return dict(chain)
```

**🎯 Résultat attendu :** Construire une chaîne depuis une petite phrase devrait produire un dictionnaire où chaque mot pointe vers ses successeurs.

```python
sample = "the cat sat on the mat the cat sat"
chain = build_chain(sample)
print(dict(chain))
```

```
{'the': ['cat', 'mat', 'cat'], 'cat': ['sat', 'sat'], 'sat': ['on', None], 'on': ['the'], 'mat': ['the']}
```

(Remarque : le dernier mot « sat » n'a pas de successeur — il sera omis de la chaîne puisque la boucle s'arrête à `len(words) - 1`.)

**🩹 Si ça ne marche pas :** Si ta chaîne est vide, la chaîne de caractères d'entrée n'a peut-être pas d'espaces. Vérifie que `text.split()` produit une liste d'au moins deux mots. Si tu obtiens une `KeyError` quand tu cherches un mot, souviens-toi que la chaîne ne stocke que les mots qui ont au moins un successeur.

### 1.2 Génère du texte depuis la chaîne

**👟 Indice de départ :** Écris une fonction qui choisit un mot de départ aléatoire, puis cherche à plusieurs reprises le mot courant dans la chaîne et choisit un successeur aléatoire. Arrête-toi après avoir généré le nombre de mots souhaité.

```python
def generate_from_chain(
    chain: dict[str, list[str]],
    num_words: int = 50,
    seed: int | None = None,
) -> str:
    """Generate text by walking the Markov chain."""
    rng = random.Random(seed)
    words = list(chain.keys())
    if not words:
        return ""

    current = rng.choice(words)
    result = [current.capitalize()]

    for _ in range(num_words - 1):
        followers = chain.get(current, [])
        if not followers:
            current = rng.choice(words)
            result.append(current.capitalize())
        else:
            current = rng.choice(followers)
            result.append(current)

    return " ".join(result)
```

**🎯 Résultat attendu :** Générer depuis la petite chaîne devrait produire du texte à peu près lisible.

```python
chain = build_chain("the cat sat on the mat the cat sat on the mat")
text = generate_from_chain(chain, num_words=12, seed=42)
print(text)
```

```
The cat sat on the mat the cat sat on the mat
```

Avec une graine de 42 et un texte d'entraînement court, la chaîne boucle sur le même schéma. Avec un texte d'entraînement plus long, la sortie devient plus variée.

**🩹 Si ça ne marche pas :** Si la sortie est un seul mot répété, ta chaîne n'a peut-être qu'un seul mot avec un seul successeur. Assure-toi que ton texte d'entraînement a au moins 10 mots distincts. Si tu obtiens une chaîne vide, vérifie que `chain` n'est pas vide.

### 1.3 Vérifie que la chaîne fonctionne

**✅ Liste de vérification**

- ✅ `build_chain("a b c a b c")` retourne un dictionnaire où `"a"` pointe vers `["b", "b"]` et `"b"` vers `["c", "c"]`.
- ✅ `generate_from_chain(chain, num_words=5, seed=1)` retourne exactement 5 mots.
- ✅ Exécuter deux fois la même graine produit une sortie identique (déterministe).
- ✅ Des graines différentes produisent des sorties différentes.

**🤔 Question(s) socratique(s)**

- Pourquoi une chaîne de Markov de premier ordre produit-elle parfois des phrases sans queue ni tête comme « the the the cat cat » ? Quelle information lui manque qu'une chaîne de second ordre (qui examine les deux derniers mots au lieu d'un) aurait ?

## Étape 2 : Entraîne-toi sur un texte d'exemple

Une chaîne de Markov n'est bonne que dans la mesure de ses données d'entraînement. Donne-lui un paragraphe de contes de fées et elle écrit des contes de fées. Donne-lui de la science-fiction et elle écrit de la science-fiction. L'idée clé, c'est qu'il te faut assez de texte pour que la chaîne apprenne de vrais schémas de transition de mots — une seule phrase est trop courte, mais un roman complet est excessif.

### 2.1 Utilise un corpus d'entraînement intégré

**👟 Indice de départ :** Inclus quelques textes d'exemple directement dans ton code comme constantes de chaînes. Des genres différents donnent des voix différentes à la chaîne. Tu peux aussi charger des fichiers depuis le disque avec `open()`.

```python
FAIRY_TALES = """
Once upon a time there was a young princess who lived in a castle on a hill.
The princess loved to wander through the enchanted forest near her home.
One day she discovered a secret door hidden behind a waterfall.
Behind the door she found a magical garden filled with glowing flowers.
A wise old owl lived in the garden and told her of a great adventure.
The princess set out on her journey with nothing but a lantern and courage.
She crossed rivers and mountains and forests until she reached the crystal tower.
At the top of the tower she found a sleeping prince under a spell.
She woke him with a gentle kiss and they returned to the castle together.
The kingdom celebrated their return with a feast that lasted seven days.
"""

SCIFI = """
The starship drifted through the asteroid field with its shields flickering.
Captain Reyes gripped the console as another rock scraped the hull.
The navigation computer calculated a path through the densest cluster.
A bright flash lit up the cockpit as a meteor streaked past the viewport.
The crew held their breath as the ship squeezed through the gap.
Engineering reported minor damage to the port thruster array.
Reyes ordered a course correction toward the distant blue planet.
The ship's sensors detected an artificial signal coming from the surface.
It was a transmission in a language no one on board recognized.
The signal repeated every eleven seconds with perfect mathematical precision.
"""

MYSTERY = """
Detective Morgan arrived at the scene just after midnight.
The study was locked from the inside with no signs of forced entry.
A single red rose lay on the desk beside an open envelope.
Inside the envelope was a letter addressed to no one.
The handwriting matched the victim's own but the date was three years in the future.
Morgan noted the timestamp on the letter and checked the victim's calendar.
Every appointment for the next week had been crossed out with black ink.
The only entry that remained unmarked was a meeting at the harbour.
Morgan drove to the harbour and found a boat with the engine running.
On the seat was a photograph of the victim standing next to a stranger.
"""


def build_chain_from_corpus(texts: list[str]) -> dict[str, list[str]]:
    """Build a Markov chain from multiple text blocks."""
    combined = " ".join(texts)
    return build_chain(combined)
```

**🎯 Résultat attendu :** Construire une chaîne depuis le corpus devrait produire un dictionnaire avec des centaines de clés.

```python
chain = build_chain_from_corpus([FAIRY_TALES, SCIFI, MYSTERY])
print(f"Unique words in chain: {len(chain)}")
```

```
Unique words in chain: 195
```

Le nombre exact dépend de tes textes d'entraînement. Plus de texte signifie plus de mots uniques et des transitions plus réalistes.

### 2.2 Vérifie que l'entraînement a fonctionné

**👟 Indice de départ :** Génère quelques lignes depuis la chaîne entraînée et regarde-les attentivement. Elles devraient ressembler à de l'anglais approximatif mais plausible, avec des paires de mots qui apparaissent dans du texte naturel.

```python
chain = build_chain_from_corpus([FAIRY_TALES])
for i in range(3):
    text = generate_from_chain(chain, num_words=20, seed=i)
    print(f"  [{i}] {text}")
```

```
  [0] The princess set out on her journey with a gentle kiss and they returned to the castle
  [1] The wise old owl lived in the enchanted forest near her home
  [2] She found a secret door hidden behind a waterfall behind the door
```

**🩹 Si ça ne marche pas :** Si la sortie est surtout des répétitions d'un seul mot, ton texte d'entraînement est trop court ou trop répétitif. Ajoute des phrases plus variées. Si tu obtiens une `KeyError`, il manque un mot à ta chaîne — vérifie que `build_chain` met en minuscules à la fois le mot courant et le mot suivant.

### 2.3 Vérifie que la chaîne fonctionne

**✅ Liste de vérification**

- ✅ La chaîne a au moins 50 mots uniques après l'entraînement sur le corpus de contes de fées.
- ✅ `generate_from_chain(chain, num_words=30, seed=7)` retourne exactement 30 mots.
- ✅ La sortie se lit comme un anglais approximatif mais reconnaissable, pas comme une soupe de caractères aléatoire.
- ✅ Des graines différentes produisent des textes différents.

## Étape 3 : Les modèles d'histoires

La sortie brute de Markov est divertissante mais sans structure. Les modèles d'histoires donnent un squelette à ton générateur : des paragraphes avec des emplacements de variables remplis par des phrases générées. Cela garde l'histoire cohérente tout en profitant de la créativité de la chaîne de Markov.

### 3.1 Définis le système de modèles

**👟 Indice de départ :** Un modèle est une chaîne avec des espaces réservés comme `{intro}`, `{conflict}`, `{action}` et `{resolution}`. Chaque espace réservé est remplacé par une phrase générée. Utilise une dataclass pour représenter les modèles avec leur genre et les emplacements requis.

```python
from dataclasses import dataclass, field


@dataclass
class StoryTemplate:
    name: str
    genre: str
    structure: list[str] = field(default_factory=list)
    paragraph_slots: int = 3

    def render(self, paragraphs: list[str]) -> str:
        """Render the story by combining paragraphs."""
        return "\n\n".join(paragraphs)
```

**🎯 Résultat attendu :** Définir la classe ne devrait produire aucune sortie. Instancie-en une pour vérifier.

```python
t = StoryTemplate(name="hero", genre="fantasy", paragraph_slots=4)
print(f"Template: {t.name} ({t.genre}) — {t.paragraph_slots} paragraphs")
```

```
Template: hero (fantasy) — 4 paragraphs
```

### 3.2 Construis une bibliothèque de modèles

**👟 Indice de départ :** Crée une liste de modèles prédéfinis, chacun avec un genre, une description de structure et une liste d'« indices » de paragraphes — de courtes descriptions de ce que chaque paragraphe devrait contenir. Ces indices guident la génération.

```python
TEMPLATES = [
    StoryTemplate(
        name="hero_journey",
        genre="fantasy",
        structure=[
            "A character in an ordinary world",
            "A call to adventure or discovery",
            "Crossing the threshold into the unknown",
            "Facing a challenge or enemy",
            "A moment of transformation or revelation",
            "Returning home changed",
        ],
        paragraph_slots=6,
    ),
    StoryTemplate(
        name="mystery_detective",
        genre="mystery",
        structure=[
            "A crime or puzzle is introduced",
            "The detective examines the scene",
            "Clues are discovered and suspects appear",
            "A false lead or red herring",
            "The truth is revealed",
            "Justice or resolution",
        ],
        paragraph_slots=6,
    ),
    StoryTemplate(
        name="space_odyssey",
        genre="sci-fi",
        structure=[
            "A ship or crew in deep space",
            "An anomaly or discovery",
            "First contact or exploration",
            "A crisis or malfunction",
            "A choice with consequences",
            "Arrival or aftermath",
        ],
        paragraph_slots=6,
    ),
    StoryTemplate(
        name="fairy_tale",
        genre="fantasy",
        structure=[
            "Once upon a time in a distant land",
            "A character with a wish or problem",
            "A helper or guide appears",
            "A test or journey",
            "The reward or lesson learned",
            "Happily ever after",
        ],
        paragraph_slots=6,
    ),
]


def get_template(name: str) -> StoryTemplate:
    """Find a template by name."""
    for t in TEMPLATES:
        if t.name == name:
            return t
    raise ValueError(f"Unknown template: {name}")


def list_templates() -> list[str]:
    """Return names of all available templates."""
    return [t.name for t in TEMPLATES]
```

**🎯 Résultat attendu :**

```python
print("Available templates:")
for name in list_templates():
    t = get_template(name)
    print(f"  {name} ({t.genre}) — {len(t.structure)} sections")
```

```
Available templates:
  hero_journey (fantasy) — 6 sections
  mystery_detective (mystery) — 6 sections
  space_odyssey (sci-fi) — 6 sections
  fairy_tale (fantasy) — 6 sections
```

### 3.3 Vérifie que les modèles fonctionnent

**✅ Liste de vérification**

- ✅ `list_templates()` retourne au moins 4 noms de modèles.
- ✅ `get_template("hero_journey")` retourne un modèle avec `genre="fantasy"` et `len(structure) == 6`.
- ✅ La liste `structure` de chaque modèle a entre 4 et 8 entrées.
- ✅ `get_template("nonexistent")` lève une `ValueError`.

## Étape 4 : Le développement des personnages

Les personnages rendent les histoires dignes d'être lues. Un profil de personnage est un ensemble d'attributs — nom, traits de personnalité, objectifs, histoire passée — dans lequel le générateur puise quand il remplit les emplacements du modèle. L'objectif est de rendre les personnages cohérents tout au long d'une seule histoire sans coder en dur chaque détail.

### 4.1 Conçois la classe `Character`

**👟 Indice de départ :** Utilise une dataclass avec un nom, une liste de traits, un objectif, une histoire passée et une méthode `describe()` qui produit un paragraphe lisible. Ajoute une méthode de classe qui crée un personnage aléatoire à partir de listes prédéfinies.

```python
import random
from dataclasses import dataclass, field


NAMES = [
    "Aria", "Bram", "Celia", "Dorian", "Elara", "Finn",
    "Gwen", "Hector", "Iris", "Jasper", "Kira", "Liam",
    "Mara", "Nolan", "Opal", "Percy", "Quinn", "Rosalind",
    "Soren", "Tessa", "Ursa", "Viktor", "Wren", "Xander",
]

TRAITS = [
    "brave", "cunning", "gentle", "stubborn", "curious",
    "loyal", "mysterious", "optimistic", "sarcastic", "shy",
    "bold", "compassionate", "patient", "reckless", "wise",
]

GOALS = [
    "find a lost artifact",
    "solve an ancient mystery",
    "protect their village",
    "escape a dangerous situation",
    "discover the truth about their past",
    "unite warring factions",
    "break a powerful curse",
    "reach a distant land",
    "prove their worth",
    " uncover a secret",
]

BACKSTORIES = [
    "raised by wolves in the northern forest",
    "a former ship captain who lost everything at sea",
    "the last descendant of a forgotten royal line",
    "a scholar who wandered too deep into forbidden archives",
    "a thief who stole something they should not have",
    "born with a strange mark that nobody can explain",
    "exiled from their homeland for a crime they did not commit",
    "taught by a master who vanished without explanation",
]


@dataclass
class Character:
    name: str
    traits: list[str] = field(default_factory=list)
    goal: str = ""
    backstory: str = ""

    def describe(self) -> str:
        """Return a character description paragraph."""
        trait_str = ", ".join(self.traits) if self.traits else "unremarkable"
        return (
            f"{self.name} is {trait_str}. "
            f"Their goal is to {self.goal}. "
            f"They were {self.backstory}."
        )

    @classmethod
    def random(cls) -> "Character":
        """Create a random character from predefined lists."""
        name = random.choice(NAMES)
        num_traits = random.randint(2, 4)
        traits = random.sample(TRAITS, min(num_traits, len(TRAITS)))
        goal = random.choice(GOALS)
        backstory = random.choice(BACKSTORIES)
        return cls(name=name, traits=traits, goal=goal, backstory=backstory)
```

**🎯 Résultat attendu :**

```python
c = Character.random()
print(c.describe())
```

```
Soren is brave, curious, wise. Their goal is to break a powerful curse. They were born with a strange mark that nobody can explain.
```

En le relançant avec une graine différente, tu obtiens un personnage différent :

```python
random.seed(7)
c = Character.random()
print(c.describe())
```

```
Kira is cunning, loyal, mysterious. Their goal is to uncover a secret. They were exiled from their homeland for a crime they did not commit.
```

### 4.2 Vérifie que la génération de personnages fonctionne

**✅ Liste de vérification**

- ✅ `Character.random()` retourne un `Character` avec un nom non vide, au moins 2 traits, un objectif et une histoire passée.
- ✅ `c.describe()` retourne une chaîne de paragraphe commençant par le nom du personnage.
- ✅ Deux appels à `Character.random()` avec des graines différentes produisent des personnages différents.
- ✅ Appeler `c.describe()` plusieurs fois retourne le même texte (déterministe).

**🤔 Question(s) socratique(s)**

- Si tu voulais que les personnages aient un champ `speech_style` qui génère des dialogues, comment étendrais-tu `describe()` sans casser l'interface existante ?

## Étape 5 : Génère des histoires complètes

Maintenant, on combine tout : la chaîne de Markov génère des phrases, le modèle les arrange en paragraphes, et les personnages sont tissés dans le récit. Le générateur d'histoires prend un nom de modèle et un personnage, remplit chaque emplacement de paragraphe avec du texte généré et retourne une histoire complète.

### 5.1 Construis le générateur d'histoires

**👟 Indice de départ :** Écris une fonction `generate_story` qui prend une chaîne, un modèle et un personnage. Pour chaque paragraphe de la structure du modèle, génère quelques phrases depuis la chaîne et combine-les en un paragraphe. Le nom et les traits du personnage sont tissés dans l'ouverture.

```python
def generate_story(
    chain: dict[str, list[str]],
    template: StoryTemplate,
    character: Character,
    sentences_per_paragraph: int = 3,
    seed: int | None = None,
) -> str:
    """Generate a complete story using a chain, template, and character."""
    rng = random.Random(seed)
    paragraphs = []

    # Opening paragraph introduces the character
    opening = f"{character.name} {random.choice(['stood at the edge', 'wandered through', 'arrived at', 'discovered'])} "
    opening += f"the {template.genre} world with {character.traits[0] if character.traits else 'determination'}. "
    opening += f"Their goal was to {character.goal}."
    paragraphs.append(opening)

    # Generate body paragraphs from template structure
    for section in template.structure:
        words_needed = sentences_per_paragraph * 8
        raw = generate_from_chain(chain, num_words=words_needed, seed=rng.randint(0, 99999))
        sentences = raw.split(". ")
        # Capitalize first letter of each sentence
        sentences = [s[0].upper() + s[1:] if s else s for s in sentences]
        paragraph = ". ".join(sentences[:sentences_per_paragraph])
        if not paragraph.endswith("."):
            paragraph += "."
        paragraphs.append(paragraph)

    # Closing paragraph
    closing = (
        f"And so {character.name}'s journey came to an end. "
        f"They had set out to {character.goal}, and in the end they learned "
        f"that the real adventure was the one inside themselves."
    )
    paragraphs.append(closing)

    return "\n\n".join(paragraphs)
```

**🎯 Résultat attendu :**

```python
chain = build_chain_from_corpus([FAIRY_TALES, SCIFI, MYSTERY])
template = get_template("hero_journey")
character = Character.random()
story = generate_story(chain, template, character, seed=42)
print(story)
```

```
Quinn stood at the edge the fantasy world with bold. Their goal was to break a powerful curse.

The princess set out on her journey with a gentle kiss and they returned to the castle. She found a secret door hidden behind a waterfall behind the door. The wise old owl lived in the enchanted forest near her home.

Captain reyes gripped the console as another rock scraped the hull. The navigation computer calculated a path through the densest cluster. A bright flash lit up the cockpit as a meteor streaked past the viewport.

Detective morgan arrived at the scene just after midnight. The study was locked from the inside with no signs of forced entry. A single red rose lay on the desk beside an open envelope.

The starship drifted through the asteroid field with its shields flickering. Engineering reported minor damage to the port thruster array. Reyes ordered a course correction toward the distant blue planet.

The princess loved to wander through the enchanted forest near her home. One day she discovered a secret door hidden behind a waterfall. Behind the door she found a magical garden filled with glowing flowers.

She crossed rivers and mountains and forests until she reached the crystal tower. At the top of the tower she found a sleeping prince under a spell. She woke him with a gentle kiss and they returned to the castle together.

And so Quinn's journey came to an end. They had set out to break a powerful curse, and in the end they learned that the real adventure was the one inside themselves.
```

Le paragraphe d'ouverture utilise le nom et les traits du personnage. Les paragraphes du corps sont générés depuis la chaîne, ce qui donne une voix distincte à chaque section. La clôture boucle l'arc du personnage.

### 5.2 Vérifie que le générateur d'histoires fonctionne

**✅ Liste de vérification**

- ✅ `generate_story(chain, template, character, seed=42)` retourne une chaîne avec au moins 5 paragraphes.
- ✅ Le premier paragraphe contient le nom du personnage.
- ✅ Le dernier paragraphe fait référence à l'objectif du personnage.
- ✅ Des graines différentes produisent des histoires différentes.
- ✅ La même graine produit des histoires identiques.

## Étape 6 : Contrôle la qualité de la sortie

La chaîne de Markov produit souvent du texte grammaticalement maladroit ou thématiquement éparpillé. Un paramètre de température te donne le contrôle : une température basse fait des choix conservateurs (répéter les paires de mots courantes), tandis qu'une température haute fait des choix audacieux (choisir des mots rares plus souvent). C'est la différence entre une histoire ennuyeuse et une histoire créative mais cohérente.

### 6.1 Implémente l'échantillonnage à température réglable

**👟 Indice de départ :** Au lieu de choisir le mot suivant de façon uniformément aléatoire, pondère les choix par la fréquence à laquelle chaque mot apparaît comme successeur. Un paramètre de température met ces poids à l'échelle : dessous de 1.0 il rend la chaîne plus prévisible, au-dessus de 1.0 il la rend plus aléatoire.

```python
import math


def build_weighted_chain(text: str) -> dict[str, dict[str, int]]:
    """Build a chain that counts follower frequencies."""
    words = text.lower().split()
    chain: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for i in range(len(words) - 1):
        current = words[i]
        next_word = words[i + 1]
        chain[current][next_word] += 1

    return {k: dict(v) for k, v in chain.items()}


def generate_with_temperature(
    chain: dict[str, dict[str, int]],
    num_words: int = 50,
    temperature: float = 1.0,
    seed: int | None = None,
) -> str:
    """Generate text with temperature-controlled sampling."""
    rng = random.Random(seed)
    words = list(chain.keys())
    if not words:
        return ""

    current = rng.choice(words)
    result = [current.capitalize()]

    for _ in range(num_words - 1):
        followers = chain.get(current, {})
        if not followers:
            current = rng.choice(words)
            result.append(current.capitalize())
            continue

        tokens = list(followers.keys())
        counts = [followers[t] for t in tokens]

        # Apply temperature scaling
        if temperature == 0:
            # Greedy: pick the most common follower
            best = tokens[0]
            for i, c in enumerate(counts):
                if c > counts[tokens.index(best)]:
                    best = tokens[i]
            next_word = best
        else:
            weights = [math.exp(c / temperature) for c in counts]
            total = sum(weights)
            probs = [w / total for w in weights]
            next_word = rng.choices(tokens, weights=probs, k=1)[0]

        result.append(next_word)
        current = next_word

    return " ".join(result)
```

**🎯 Résultat attendu :** Génère la même histoire avec différentes températures et compare.

```python
chain_weighted = build_weighted_chain(FAIRY_TALES + SCIFI + MYSTERY)

print("=== Temperature 0.5 (conservative) ===")
text = generate_with_temperature(chain_weighted, num_words=40, temperature=0.5, seed=10)
print(text[:200])

print("\n=== Temperature 1.0 (normal) ===")
text = generate_with_temperature(chain_weighted, num_words=40, temperature=1.0, seed=10)
print(text[:200])

print("\n=== Temperature 2.0 (creative) ===")
text = generate_with_temperature(chain_weighted, num_words=40, temperature=2.0, seed=10)
print(text[:200])
```

```
=== Temperature 0.5 (conservative) ===
The princess set out on her journey with a gentle kiss and they returned to the castle together the kingdom celebrated their return with a feast that lasted seven days the princess loved to wander through the enchanted

=== Temperature 1.0 (normal) ===
The princess set out on her journey with a gentle kiss and the ship drifted through the asteroid field with its shields flickering a bright flash lit up the cockpit as a meteor streaked past the viewport captain reyes

=== Temperature 2.0 (creative) ===
The princess set out on her journey the kingdom crossed out with black ink the only entry that remained unmarked was a meeting at the harbour morgan drove to the harbour and found a boat with the engine running on the
```

Une température basse produit un texte répétitif et prévisible. Une température moyenne mélange naturellement les corpus d'entraînement. Une température haute fait entrer des combinaisons de mots inattendues entre les genres — parfois créatif, parfois absurde.

### 6.2 Intègre la température dans le générateur d'histoires

**👟 Indice de départ :** Ajoute un paramètre `temperature` à `generate_story` qui est transmis à `generate_from_chain`. Remplace l'appel existant par `generate_with_temperature`.

```python
def generate_story(
    chain: dict[str, dict[str, int]],
    template: StoryTemplate,
    character: Character,
    sentences_per_paragraph: int = 3,
    temperature: float = 1.0,
    seed: int | None = None,
) -> str:
    """Generate a complete story with temperature control."""
    rng = random.Random(seed)
    paragraphs = []

    opening = f"{character.name} {random.choice(['stood at the edge', 'wandered through', 'arrived at', 'discovered'])} "
    opening += f"the {template.genre} world with {character.traits[0] if character.traits else 'determination'}. "
    opening += f"Their goal was to {character.goal}."
    paragraphs.append(opening)

    for section in template.structure:
        words_needed = sentences_per_paragraph * 8
        raw = generate_with_temperature(
            chain, num_words=words_needed,
            temperature=temperature, seed=rng.randint(0, 99999),
        )
        sentences = raw.split(". ")
        sentences = [s[0].upper() + s[1:] if s else s for s in sentences]
        paragraph = ". ".join(sentences[:sentences_per_paragraph])
        if not paragraph.endswith("."):
            paragraph += "."
        paragraphs.append(paragraph)

    closing = (
        f"And so {character.name}'s journey came to an end. "
        f"They had set out to {character.goal}, and in the end they learned "
        f"that the real adventure was the one inside themselves."
    )
    paragraphs.append(closing)

    return "\n\n".join(paragraphs)
```

**🎯 Résultat attendu :**

```python
chain_w = build_weighted_chain(FAIRY_TALES + SCIFI + MYSTERY)
character = Character.random()
story = generate_story(chain_w, get_template("mystery_detective"), character, temperature=0.8, seed=99)
print(story)
```

La sortie devrait se lire comme une nouvelle cohérente avec le nom, les traits et l'objectif du personnage tissés dans l'ouverture et la clôture, et des paragraphes de corps tirés du texte d'entraînement.

### 6.3 Vérifie que le contrôle de température fonctionne

**✅ Liste de vérification**

- ✅ `temperature=0.5` produit un texte qui répète les mêmes paires de mots fréquemment.
- ✅ `temperature=1.0` produit un texte qui mélange les corpus d'entraînement de façon égale.
- ✅ `temperature=2.0` produit un texte avec des combinaisons de mots inattendues.
- ✅ Le générateur d'histoires produit la même ouverture et la même clôture quelle que soit la température (elles sont codées en dur).
- ✅ Les paragraphes du corps changent de façon significative entre les températures.

## Étape 7 : Le menu CLI

Un menu CLI te permet d'exécuter le générateur d'histoires de façon interactive — choisis un genre, crée un personnage, règle la température et lis ton histoire dans le terminal.

### 7.1 Construis la boucle de menu

**👟 Indice de départ :** Utilise une boucle `while True` avec `input()` pour les choix de l'utilisateur. Affiche un menu numéroté, lis la sélection et envoie vers la bonne fonction.

```python
def print_menu():
    print("\n" + "=" * 50)
    print("  AI Story Writer")
    print("=" * 50)
    print("  1. Generate a story")
    print("  2. View character")
    print("  3. List templates")
    print("  4. Quit")
    print("=" * 50)


def run_cli():
    """Run the interactive story generator."""
    print("\nWelcome to the AI Story Writer!")
    print("Training the Markov chain on sample text...")
    chain = build_weighted_chain(FAIRY_TALES + SCIFI + MYSTERY)
    print(f"Chain trained. {len(chain)} unique words learned.\n")

    character = Character.random()
    current_template = "hero_journey"

    while True:
        print_menu()
        choice = input("Choose an option (1-4): ").strip()

        if choice == "1":
            print(f"\nCurrent character: {character.name}")
            print(f"Current template: {current_template}")
            temp_input = input("Temperature (0.1-3.0, default 1.0): ").strip()
            temperature = float(temp_input) if temp_input else 1.0
            seed_input = input("Random seed (blank for random): ").strip()
            seed = int(seed_input) if seed_input else None

            story = generate_story(
                chain, get_template(current_template),
                character, temperature=temperature, seed=seed,
            )
            print("\n" + "=" * 50)
            print(story)
            print("=" * 50)

        elif choice == "2":
            character = Character.random()
            print(f"\nNew character: {character.name}")
            print(character.describe())

        elif choice == "3":
            print("\nAvailable templates:")
            for name in list_templates():
                t = get_template(name)
                print(f"  - {name} ({t.genre})")
            pick = input("Choose a template name: ").strip()
            if pick in list_templates():
                current_template = pick
                print(f"Template set to: {current_template}")
            else:
                print("Invalid template name.")

        elif choice == "4":
            print("Goodbye!")
            break

        else:
            print("Invalid choice. Please enter 1-4.")
```

**🎯 Résultat attendu :** Exécuter `run_cli()` affiche le menu et répond à l'entrée de l'utilisateur.

```
Welcome to the AI Story Writer!
Training the Markov chain on sample text...
Chain trained. 195 unique words learned.

==================================================
  AI Story Writer
==================================================
  1. Generate a story
  2. View character
  3. List templates
  4. Quit
==================================================
Choose an option (1-4): 1

Current character: Wren
Current template: hero_journey
Temperature (0.1-3.0, default 1.0): 0.7
Random seed (blank for random): 42

==================================================
Wren stood at the edge the fantasy world with bold. Their goal was to prove their worth.

The princess set out on her journey with a gentle kiss and they returned to the castle together. The kingdom celebrated their return with a feast that lasted seven days. The wise old owl lived in the enchanted forest near her home.
...
==================================================
```

### 7.2 Vérifie que le CLI fonctionne

**✅ Liste de vérification**

- ✅ Le menu affiche 4 options et lit l'entrée de l'utilisateur.
- ✅ Choisir « 1 » génère une histoire et l'affiche.
- ✅ Choisir « 2 » crée un nouveau personnage aléatoire et affiche sa description.
- ✅ Choisir « 3 » liste les modèles et laisse l'utilisateur en choisir un.
- ✅ Choisir « 4 » quitte la boucle.
- ✅ Saisir un nombre invalide affiche une erreur et réaffiche le menu.

## Défis

1. **Chaîne de Markov Bigram.** Passe à une chaîne de Markov de second ordre qui examine les deux derniers mots au lieu d'un. De combien la qualité de la sortie s'améliore-t-elle ?

2. **Génération consciente des phrases.** Au lieu de générer un nombre fixe de mots, génère des phrases complètes en t'arrêtant à un point. Indice : divise sur `"."` et filtre.

3. **Filtrage par genre.** Modifie `generate_story` pour tirer plus de phrases du bloc de texte d'entraînement qui correspond au genre du modèle (fantasy, sci-fi ou mystery).

4. **Dialogue des personnages.** Ajoute une classe `DialogueGenerator` qui produit des répliques dans la voix d'un personnage. Inclus un champ `speech_style` dans `Character` (par ex. « formel », « décontracté », « archaïque ») et filtre les choix de mots en conséquence.

5. **Export d'histoires.** Écris l'histoire générée dans un fichier `.txt` avec un titre, une bio de personnage et des en-têtes de chapitre.

6. **Expérience de température.** Génère la même histoire aux températures 0,3, 0,7, 1,0, 1,5 et 2,5. Écris une courte analyse de la façon dont la température affecte la cohérence et la créativité.

7. **Fiction interactive.** Transforme le générateur d'histoires en système de livre dont vous êtes le héros. À chaque paragraphe, présente 2-3 choix qui mènent à différentes branches de modèles.

## Ce que tu as appris

1. **Les chaînes de Markov** — comment les probabilités de transition de mots modélisent les schémas statistiques du texte naturel.
2. **Les données d'entraînement** — comment la taille du corpus et le genre affectent la qualité de génération.
3. **Les modèles** — comment des espaces réservés structurés transforment du texte aléatoire en histoires cohérentes.
4. **Les profils de personnages** — comment des attributs comme les traits, les objectifs et les histoires passées donnent de la cohérence aux histoires.
5. **La température** — comment un paramètre unique contrôle l'équilibre entre prédictibilité et créativité.
6. **La génération d'histoires** — comment combiner toutes ces pièces en un outil CLI fonctionnel.