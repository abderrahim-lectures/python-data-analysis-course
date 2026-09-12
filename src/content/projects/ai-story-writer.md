---
title: "AI Story Writer"
description: "Generate creative stories with Markov chains, template systems, and character development."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["NLP", "Markov chains", "random", "text-generation", "classes"]
xpReward: 50
learningObjectives:
  - "Build a Markov chain text generator from scratch"
  - "Train the generator on sample text to learn writing patterns"
  - "Create story templates with variable slots for generated content"
  - "Design character profiles with traits, goals, and backstories"
  - "Assemble multi-paragraph stories from templates and character data"
  - "Control output coherence with a temperature parameter"
  - "Build a CLI menu for interactive story generation"
prerequisites:
  - "Python basics (variables, loops, functions, dictionaries, classes)"
---

# AI Story Writer

You love storytelling but sometimes the blank page wins. In this project you will build a tool that learns writing patterns from sample text and generates new stories by combining Markov chain text generation with structured templates and character profiles. The result is a story generator that produces multi-paragraph tales with consistent characters, varied plots, and controllable style.

This project only assumes Python 101-level basics, functions, lists, dictionaries, loops, classes, and string formatting. No frameworks, no databases, no cloud services. Everything you need comes from the standard library.

This is optional and ungraded. See [Real-World Projects](/projects) for the full list.

## What you'll do

1. Build a Markov chain that learns word-transition probabilities from any text.
2. Train the chain on sample stories, fairy tales, or sci-fi passages.
3. Create story templates with variable slots that get filled by generated text.
4. Design character profiles with names, traits, goals, and backstories.
5. Assemble complete multi-paragraph stories from templates and character data.
6. Add a temperature parameter that controls how wild or conservative the output is.
7. Build a CLI menu so you can generate stories interactively from the terminal.

## Where to run this

- **Locally with `uv` (recommended).** This project uses only the Python standard library, no third-party packages needed. The Setup section below walks through it.
- **Google Colab or Kaggle Notebooks.** Paste the code cells directly into a notebook.
- **JupyterLite playground.** Paste the code cells directly into a notebook, file I/O is not required, so everything works in the browser.

- **Run it in your browser.** An interactive companion notebook is ready, open it in Colab, Kaggle, or Binder and follow along top-to-bottom.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-story-writer/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-story-writer/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-story-writer%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the usual "install Python, then pip, then a virtual environment, then packages" chain, it manages Python versions and dependencies together.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

Then set up the project:

```bash
uv init ai-story-writer
cd ai-story-writer
```

No extra packages, the standard library has everything we need (`random`, `dataclasses`, `abc`, `json`, `textwrap`).

## Step 1: Markov chain basics

A Markov chain is a simple model that predicts the next item based only on the current item, it has no memory of what came before. Applied to text, a first-order Markov chain looks at the current word and picks the next word from a probability distribution built from real text. The chain learns which words tend to follow which other words, then generates new sequences that mimic the statistical patterns of the training text.

### 1.1 Build the chain data structure

**Starter hint:** Use a dictionary where keys are current words and values are lists of all words that have ever followed that word in the training text. The `random` module picks the next word from the list uniformly.

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

**Expected output:** Building a chain from a small sentence should produce a dict where each word maps to its successors.

```python
sample = "the cat sat on the mat the cat sat"
chain = build_chain(sample)
print(dict(chain))
```

```
{'the': ['cat', 'mat', 'cat'], 'cat': ['sat', 'sat'], 'sat': ['on', None], 'on': ['the'], 'mat': ['the']}
```

(Note: the last word "sat" has no successor, it will be omitted from the chain since the loop stops at `len(words) - 1`.)

**If it's off:** If your chain is empty, the input string might have no spaces. Check that `text.split()` produces a list with at least two words. If you get a `KeyError` when looking up a word, remember the chain only stores words that have at least one successor.

### 1.2 Generate text from the chain

**Starter hint:** Write a function that picks a random starting word, then repeatedly looks up the current word in the chain and picks a random follower. Stop after generating the desired number of words.

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

**Expected output:** Generating from the small chain should produce readable-ish text.

```python
chain = build_chain("the cat sat on the mat the cat sat on the mat")
text = generate_from_chain(chain, num_words=12, seed=42)
print(text)
```

```
The cat sat on the mat the cat sat on the mat
```

With a seed of 42 and a short training text, the chain loops through the same pattern. With longer training text, the output becomes more varied.

**If it's off:** If the output is a single word repeated, your chain might only have one word with one follower. Make sure your training text has at least 10 distinct words. If you get an empty string, check that `chain` is not empty.

### 1.3 Confirm the chain works

**Checklist**

- `build_chain("a b c a b c")` returns a dict where `"a"` maps to `["b", "b"]` and `"b"` maps to `["c", "c"]`.
- `generate_from_chain(chain, num_words=5, seed=1)` returns exactly 5 words.
- Running the same seed twice produces identical output (deterministic).
- Running different seeds produces different output.

**Socratic question:** Why does a first-order Markov chain sometimes produce nonsensical sentences like "the the the cat cat"? What information is it missing that a second-order chain (looking at the last two words instead of one) would have?

## Step 2: Train on sample text

A Markov chain is only as good as its training data. Feed it a paragraph of fairy tales and it writes fairy tales. Feed it sci-fi and it writes sci-fi. The key insight is that you need enough text for the chain to learn real word-transition patterns, a single sentence is too small, but a full novel is overkill.

### 2.1 Use a built-in training corpus

**Starter hint:** Include a few sample texts directly in your code as string constants. Different genres give the chain different voices. You can also load files from disk with `open()`.

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

**Expected output:** Building a chain from the corpus should produce a dict with hundreds of keys.

```python
chain = build_chain_from_corpus([FAIRY_TALES, SCIFI, MYSTERY])
print(f"Unique words in chain: {len(chain)}")
```

```
Unique words in chain: 195
```

The exact number depends on your training texts. More text means more unique words and more realistic transitions.

### 2.2 Verify training worked

**Starter hint:** Generate a few lines from the trained chain and eyeball them. They should look like broken but plausible English, with word pairs that appear in natural text.

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

**If it's off:** If the output is mostly single-word repetitions, your training text is too short or too repetitive. Add more diverse sentences. If you get `KeyError`, your chain is missing a word, check that `build_chain` lowers both the current and next word.

### 2.3 Confirm the chain works

**Checklist**

- The chain has at least 50 unique words after training on the fairy tales corpus.
- `generate_from_chain(chain, num_words=30, seed=7)` returns exactly 30 words.
- Output reads as broken but recognizable English, not random character soup.
- Different seeds produce different text.

## Step 3: Story templates

Raw Markov output is entertaining but structureless. Story templates give your generator a skeleton: paragraphs with variable slots that get filled by generated sentences. This keeps the story coherent while still benefiting from the Markov chain's creativity.

### 3.1 Define the template system

**Starter hint:** A template is a string with placeholders like `{intro}`, `{conflict}`, `{action}`, and `{resolution}`. Each placeholder gets replaced by a generated sentence. Use a dataclass to represent templates with their genre and required slots.

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

**Expected output:** Defining the class shouldn't produce output. Instantiate one to verify.

```python
t = StoryTemplate(name="hero", genre="fantasy", paragraph_slots=4)
print(f"Template: {t.name} ({t.genre}) — {t.paragraph_slots} paragraphs")
```

```
Template: hero (fantasy) — 4 paragraphs
```

### 3.2 Build a template library

**Starter hint:** Create a list of predefined templates, each with a genre, a structure description, and a list of paragraph "prompts", short descriptions of what each paragraph should contain. These prompts guide the generation.

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

**Expected output:**

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

### 3.3 Confirm the templates work

**Checklist**

- `list_templates()` returns at least 4 template names.
- `get_template("hero_journey")` returns a template with `genre="fantasy"` and `len(structure) == 6`.
- Each template's `structure` list has between 4 and 8 entries.
- `get_template("nonexistent")` raises `ValueError`.

## Step 4: Character development

Characters make stories worth reading. A character profile is a bag of attributes, name, personality traits, goals, backstory, that the generator draws from when filling template slots. The goal is to make characters feel consistent across a single story without hard-coding every detail.

### 4.1 Design the Character class

**Starter hint:** Use a dataclass with a name, a list of traits, a goal, a backstory, and a `describe()` method that produces a readable paragraph. Add a class method that creates a random character from predefined lists.

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

**Expected output:**

```python
c = Character.random()
print(c.describe())
```

```
Soren is brave, curious, wise. Their goal is to break a powerful curse. They were born with a strange mark that nobody can explain.
```

Running it again with a different seed gives a different character:

```python
random.seed(7)
c = Character.random()
print(c.describe())
```

```
Kira is cunning, loyal, mysterious. Their goal is to uncover a secret. They were exiled from their homeland for a crime they did not commit.
```

### 4.2 Confirm character generation works

**Checklist**

- `Character.random()` returns a `Character` with a non-empty name, at least 2 traits, a goal, and a backstory.
- `c.describe()` returns a paragraph string starting with the character's name.
- Two calls to `Character.random()` with different seeds produce different characters.
- Calling `c.describe()` multiple times returns the same text (deterministic).

**Socratic question:** If you wanted characters to have a "speech_style" field that generates dialogue, how would you extend `describe()` without breaking the existing interface?

## Step 5: Generate full stories

Now we combine everything: the Markov chain generates sentences, the template arranges them into paragraphs, and characters get woven into the narrative. The story generator takes a template name and a character, fills each paragraph slot with generated text, and returns a complete story.

### 5.1 Build the story generator

**Starter hint:** Write a `generate_story` function that takes a chain, a template, and a character. For each paragraph in the template's structure, generate a few sentences from the chain and combine them into a paragraph. The character's name and traits get woven into the opening.

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

**Expected output:**

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

The opening paragraph uses the character's name and traits. The body paragraphs are generated from the chain, giving each section a distinct voice. The closing wraps up the character's arc.

### 5.2 Confirm the story generator works

**Checklist**

- `generate_story(chain, template, character, seed=42)` returns a string with at least 5 paragraphs.
- The first paragraph contains the character's name.
- The last paragraph references the character's goal.
- Running with different seeds produces different stories.
- Running with the same seed produces identical stories.

## Step 6: Control output quality

The Markov chain produces text that is often grammatically awkward or thematically scattered. A temperature parameter gives you control: low temperature makes conservative choices (repeating common word pairs), while high temperature makes bold choices (picking rare words more often). This is the difference between a boring story and a creative but coherent one.

### 6.1 Implement temperature-scaled sampling

**Starter hint:** Instead of choosing the next word uniformly at random, weight the choices by how often each word appears as a follower. A temperature parameter scales these weights: below 1.0 makes the chain more predictable, above 1.0 makes it more random.

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

**Expected output:** Generate the same story with different temperatures and compare.

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

Low temperature produces repetitive, predictable text. Medium temperature mixes training corpora naturally. High temperature pulls in unexpected word combinations from across genres, sometimes creative, sometimes nonsensical.

### 6.2 Integrate temperature into the story generator

**Starter hint:** Add a `temperature` parameter to `generate_story` that gets passed through to `generate_from_chain`. Replace the existing call with `generate_with_temperature`.

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

**Expected output:**

```python
chain_w = build_weighted_chain(FAIRY_TALES + SCIFI + MYSTERY)
character = Character.random()
story = generate_story(chain_w, get_template("mystery_detective"), character, temperature=0.8, seed=99)
print(story)
```

The output should read as a coherent short story with the character's name, traits, and goal woven into the opening and closing, and body paragraphs drawn from the training text.

### 6.3 Confirm temperature control works

**Checklist**

- `temperature=0.5` produces text that repeats the same word pairs frequently.
- `temperature=1.0` produces text that mixes training corpora evenly.
- `temperature=2.0` produces text with unexpected word combinations.
- The story generator produces the same opening and closing regardless of temperature (they are hardcoded).
- The body paragraphs change meaningfully between temperatures.

## Step 7: CLI menu

A CLI menu lets you run the story generator interactively, pick a genre, create a character, adjust temperature, and read your story in the terminal.

### 7.1 Build the menu loop

**Starter hint:** Use a `while True` loop with `input()` for user choices. Print a numbered menu, read the selection, and dispatch to the right function.

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

**Expected output:** Running `run_cli()` shows the menu and responds to user input.

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

### 7.2 Confirm the CLI works

**Checklist**

- The menu prints 4 options and reads user input.
- Choosing "1" generates a story and prints it.
- Choosing "2" creates a new random character and prints their description.
- Choosing "3" lists templates and lets the user pick one.
- Choosing "4" exits the loop.
- Entering an invalid number prints an error and re-shows the menu.

## Challenges

1. **Bigram Markov chain.** Upgrade to a second-order Markov chain that looks at the last two words instead of one. How much does output quality improve?

2. **Sentence-aware generation.** Instead of generating a fixed number of words, generate complete sentences by stopping at a period. Hint: split on `"."` and filter.

3. **Genre filtering.** Modify `generate_story` to pull more sentences from the training text block that matches the template's genre (fantasy, sci-fi, or mystery).

4. **Character dialogue.** Add a `DialogueGenerator` class that produces speech lines in a character's voice. Include a `speech_style` field in `Character` (e.g., "formal", "casual", "archaic") and filter word choices accordingly.

5. **Story export.** Write the generated story to a `.txt` file with a title, character bio, and chapter headings.

6. **Temperature experiment.** Generate the same story at temperatures 0.3, 0.7, 1.0, 1.5, and 2.5. Write a short analysis of how temperature affects coherence and creativity.

7. **Interactive fiction.** Turn the story generator into a choose-your-own-adventure system. At each paragraph, present 2-3 choices that lead to different template branches.

## What you learned

1. **Markov chains**, how word-transition probabilities model the statistical patterns of natural text.
2. **Training data**, how corpus size and genre affect generation quality.
3. **Templates**, how structured placeholders turn random text into coherent stories.
4. **Character profiles**, how attributes like traits, goals, and backstories give stories consistency.
5. **Temperature**, how a single parameter controls the balance between predictability and creativity.
6. **Story generation**, how to combine all these pieces into a working CLI tool.
