---
title: "Chatbot Builder"
description: "Build a rule-based chatbot with pattern matching, context tracking, and personality."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["Chatbots", "regex", "classes", "cli"]
prerequisites:
  - "Python basics (variables, loops, functions, dictionaries, classes)"
  - "Basic regex"
learningObjectives:
  - "Match user input against patterns using the re module"
  - "Build a response generation system with templates and context"
  - "Track conversation state with a class"
  - "Give a chatbot a consistent personality and mood"
  - "Handle unknown inputs with graceful fallbacks"
---

# Chatbot Builder

Build a rule-based chatbot that recognises greetings, questions, and commands — and responds with personality, not just data. This project walks through regex pattern matching, response generation, conversation context, and a clean CLI loop, all from the standard library.

This is optional and ungraded. See [Real-World Projects](/projects) for the full list.

## What you'll do

1. Match user input against regex patterns to identify intent.
2. Build a response generation system with templates.
3. Track conversation context across multiple turns.
4. Add personality and mood to the bot.
5. Handle unknown inputs with graceful fallbacks.
6. Wire everything into a chat loop that ties the pieces together.

## Where to run this

- **Locally with `uv` (recommended).** This project uses only the standard library — no third-party packages — but `uv` keeps the project structure clean. The Setup section below walks through it.
- **Google Colab or Kaggle Notebooks.** Paste the code cells directly into a notebook. `input()` works for chat prompts, though the loop works best in a real terminal.
- **JupyterLite playground.** Paste the code cells directly into a notebook — the chat loop works, but keep sessions short since there's no persistent terminal.

- **Run it in your browser.** An interactive companion notebook is ready — open it in Colab, Kaggle, or Binder and follow along top-to-bottom.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chatbot-builder/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chatbot-builder/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fchatbot-builder%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the usual "install Python, then pip, then a virtual environment" chain — it can install and manage Python versions alongside your project's dependencies.

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

Create the project:

```bash
uv init chatbot
cd chatbot
```

No packages to add — the chatbot uses only the Python standard library (`re`, `random`, `dataclasses`, `collections`).

## Step 1 — Match user input with regex

Pattern matching is how the bot figures out what the user means. A user can type "Hello!", "hi", "hey there", or "good morning" — but the intent behind all of them is a greeting. Regex lets us collapse those into one pattern.

### 1.1 Define intent patterns

**👟 Starter hint:** Create a `patterns.py` file with a dictionary mapping intent names to lists of regex patterns. Use `re.IGNORECASE` so "Hello", "hello", and "HELLO" all match the same pattern.

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

**🎯 Expected output:** Importing and checking patterns should work like this:

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

Should print:

```
greeting
time
None
```

**🩹 If it's off:** If every input returns `None`, you forgot `re.IGNORECASE` — "Hello" won't match `r"\bhi\b"` when the regex is case-sensitive and the user capitalises the first letter. If `greeting` matches "good morning" but not "goodnight", check that `goodnight` isn't in your farewell list or a greeting pattern — it's not a substring of the pattern `good\s*(morning|afternoon|evening)`.

### 1.2 Handle regex groups for extracted data

Some patterns need to pull out information, not just match. The greeting pattern might want to know *which* greeting was used, and the time/date patterns need to work regardless of phrasing.

**👟 Starter hint:** Add a `classify_with_matches` function that returns both the intent and any captured groups from the regex:

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

**🎯 Expected output:**

```python
result = classify_with_matches("good evening!")
print(result.intent, result.matched_text, result.groups)

result = classify_with_matches("what's your name")
print(result.intent, result.matched_text, result.groups)
```

Should print:

```
greeting good evening ('evening',)
name what's your name ()
```

**🩹 If it's off:** If `groups` is `()` when you expect a capture, the parentheses in your regex are non-capturing groups — use `(...)` not `(?:...)` for groups you want to extract. If `matched_text` is empty, `re.search` found a match at position 0 but the `\b` word boundary might be stripping the match — try removing the `\b` anchors from the specific pattern.

### 1.3 Verify the classifier

**✅ Checklist**

- ✅ `INTENT_PATTERNS` maps intent names to lists of regex strings.
- ✅ `classify()` returns an intent name or `None` for unknown input.
- ✅ `classify_with_matches()` returns a `MatchResult` with intent, matched text, and captured groups.
- ✅ Case-insensitive matching works for all patterns.
- ✅ Unknown input like "purple elephant" returns `None`.

**🤔 Socratic Question(s)**

- Why does each intent map to a *list* of patterns instead of a single pattern? What happens when a user types "hey" versus "good afternoon"?
- What's the difference between `re.search` and `re.match` here? Would switching to `re.match` break anything?

## Step 2 — Generate responses from templates

Now that the bot knows *what* the user means, it needs to say something back. A response system built from templates and random choices keeps the bot from sounding robotic.

### 2.1 Build the response registry

**👟 Starter hint:** Create `responses.py` with a dictionary mapping intents to lists of response templates. Use `random.choice` to pick one at random, so the same input doesn't always produce the same reply.

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

**🎯 Expected output:**

```python
from responses import get_response

print(get_response("greeting"))
print(get_response("greeting"))  # same intent, different response
```

Should print two different greetings (exact text varies):

```
Hey there! How can I help?
Hi! Ready to chat.
```

**🩹 If it's off:** If you get an empty string, the intent name doesn't match any key in `RESPONSES` — check for typos like `"Greeting"` (capital G) versus `"greeting"`. If the same response appears every time, you forgot `random.choice` and are using index `[0]` or a fixed entry instead.

### 2.2 Add dynamic responses with f-strings

Some responses need live data — the time and date change every second. Using f-strings in the template strings would evaluate at import time, freezing the values. Instead, use callable responses.

**👟 Starter hint:** Replace static strings with lambdas for intents that need dynamic data:

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

Then update `RESPONSES` so time and date entries are functions:

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

**🎯 Expected output:** Calling `get_response("time")` twice in a row returns the current time, not the time from when the module was first imported:

```python
import time
print(get_response("time"))
time.sleep(2)
print(get_response("time"))
```

Both print the same time (only 2 seconds apart), but if you wait a full minute between calls, the times will differ — proof the lambda is evaluated on each call, not once at import.

**🩹 If it's off:** If `callable(choice)` returns `False` for a lambda, check that the lambda is defined correctly — `lambda: f"..."` not `f"..."` (a bare f-string is a string, not a function). If you get `TypeError: 'str' object is not callable`, a static string got mixed into a list that's now being called — make sure only lambda entries are in the dynamic lists.

### 2.3 Verify response generation

**✅ Checklist**

- ✅ `get_response()` returns a random string from the intent's list.
- ✅ Dynamic responses (time, date) return the current value, not a frozen one.
- ✅ `callable()` check handles both strings and lambdas gracefully.
- ✅ Every intent in `INTENT_PATTERNS` has a matching entry in `RESPONSES`.

**🤔 Socratic Question(s)**

- Why use `callable()` to check each response instead of putting all dynamic responses in a separate dictionary? What's the advantage of mixing strings and lambdas in one list?
- If you wanted the bot to remember *what* the user asked about (not just the intent), where would you store that information?

## Step 3 — Track conversation context

A chatbot that only looks at the current message is forgetful. Context tracking lets the bot remember what the user said earlier — so follow-up questions like "what about tomorrow?" or "and you?" make sense.

### 3.1 Define the conversation context class

**👟 Starter hint:** Use a dataclass to hold conversation state. Track the last intent, the last few messages, a turn counter, and any extracted entities:

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

**🎯 Expected output:**

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

Should print:

```
Turns: 3
Last intent: mood
Recent intents: ['greeting', 'time', 'mood']
Was recent greeting? True
```

**🩹 If it's off:** If `turn_count` is always 1, you forgot to call `update()` — it doesn't increment automatically. If `message_history` is longer than 10 entries, the `deque(maxlen=10)` limit isn't working — check that you're passing `maxlen=10` in the `default_factory`, not in the class body as a default value.

### 3.2 Use context to improve responses

**👟 Starter hint:** A context-aware response function can check the last intent to handle follow-ups. If the user asks "what about tomorrow?" after a time question, the bot should infer they want the date.

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

**🎯 Expected output:**

```python
ctx = ChatContext()
ctx.update("what time is it", "time", "It's 14:30.")

adjusted = context_adjusted_intent("question", "what about tomorrow?", ctx)
print(adjusted)  # "date" — context infers date intent
```

Should print:

```
date
```

**🩹 If it's off:** If the adjusted intent is still `"question"` when you expect `"date"`, check the `context.last_intent` — it must be `"time"` for the first branch to trigger. If `user_message.lower()` doesn't contain "tomorrow", the substring check won't match — make sure the user's input actually contains the word.

### 3.3 Verify context tracking

**✅ Checklist**

- ✅ `ChatContext.update()` records each turn and increments the counter.
- ✅ `get_recent_intents()` returns the last N intents as a list.
- ✅ `context_adjusted_intent()` uses the last intent to refine follow-up questions.
- ✅ Entity storage and retrieval work with `store_entity` and `get_entity`.
- ✅ `message_history` is capped at 10 entries via `deque(maxlen=10)`.

**🤔 Socratic Question(s)**

- Why cap `message_history` at 10 entries with a `deque`? What happens to memory usage if you store every message in a regular list for a long conversation?
- `context_adjusted_intent` only checks `last_intent`. What would change if you wanted to consider the last *three* intents instead of just one?

## Step 4 — Add personality

A bot that answers every question with a flat statement feels lifeless. Personality comes from consistent traits — a name, a tone, small talk habits, and mood tracking that shifts over the conversation.

### 4.1 Create a personality class

**👟 Starter hint:** Define a `Personality` dataclass that holds the bot's name, tone, mood, and favourite phrases. Add methods for mood changes and trait-based responses.

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

**🎯 Expected output:**

```python
from personality import Personality

bot = Personality(name="HAL")
print(bot.greet())
print(bot.greet())
print(bot.get_mood_response())
bot.shift_mood()
print(f"After shift: {bot.mood}")
```

Should print (varies):

```
Hi! I'm HAL. Nice to meet you!
Hey again! Back for more? I'm HAL.
I'm in a great mood! Ready to help.
After shift: curious
```

**🩹 If it's off:** If the second greet is identical to the first, `greeting_count` isn't incrementing — make sure `self.greeting_count += 1` is inside the method, not at module level. If `shift_mood` never produces "excited", its weight of 1 makes it rare — run the shift a few times and it will appear eventually.

### 4.2 Combine personality with responses

**👟 Starter hint:** Update the response system so personality flavours the output. A "happy" bot uses different phrasing than a "tired" one:

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

**🎯 Expected output:**

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

Should print personality-flavoured greetings and mood responses (varies):

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

**🩹 If it's off:** If mood prefixes never appear, `random.random() < 0.3` means they only show up 30% of the time — run it more often. If greetings return the static template instead of `personality.greet()`, you forgot the `if intent == "greeting": return personality.greet()` branch in the updated `get_response`.

### 4.3 Verify personality

**✅ Checklist**

- ✅ `Personality.greet()` returns different messages on successive calls.
- ✅ `shift_mood()` changes the mood, with weighted probabilities.
- ✅ `get_response("greeting", bot)` uses `personality.greet()` instead of the static template.
- ✅ Mood-influenced prefixes appear occasionally based on the current mood.

**🤔 Socratic Question(s)**

- Why use weighted random choices for `shift_mood` instead of a uniform random pick? What does that model about real personality?
- If you wanted the bot to remember a user's name from earlier in the conversation, where would you store it — in `Personality` or in `ChatContext`? Why?

## Step 5 — Handle fallbacks

No pattern will ever cover every possible input. A bot that crashes or responds with nothing on unexpected input feels broken. Graceful fallbacks keep the conversation going.

### 5.1 Build a fallback response system

**👟 Starter hint:** Create a `fallback.py` module that generates helpful responses for unmatched input. Track how many fallbacks happen in a row — if the bot fails to understand too many times in a row, offer to help more directly.

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

**🎯 Expected output:**

```python
from fallback import FallbackTracker

tracker = FallbackTracker(help_threshold=3)
print(tracker.record_fallback())
print(tracker.record_fallback())
print(tracker.record_fallback())  # 3rd consecutive — triggers offer
print(tracker.get_stats())
```

Should print (varies):

```
I'm not sure I understand. Could you rephrase that?
Hmm, I don't have an answer for that. Try asking about the time or date!
It seems like we're having trouble connecting. Would you like me to list what I can do?
{'consecutive': 3, 'total': 3}
```

**🩹 If it's off:** If the offer-help response never appears, check that `consecutive_fallbacks` is being incremented — if `record_success()` is called between fallbacks, the counter resets. If the stats show `consecutive: 3` but you only called `record_fallback` twice, check that `record_success` isn't being called when it shouldn't be.

### 5.2 Combine fallbacks with the main classifier

**👟 Starter hint:** Wire the fallback tracker into the main classify-and-respond loop. If `classify` returns `None`, use the fallback instead:

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

Wait — that resets the tracker on *success*, but the fallback tracker should reset on success, not on failure. Let's fix that:

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

**🎯 Expected output:** Typing three unknown inputs in a row produces increasingly helpful fallback messages:

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

After the successful "hello", the consecutive counter resets — the next unknown input starts from the first fallback message again.

**🩹 If it's off:** If the fallback counter never resets after a successful input, `tracker.record_success()` isn't being called — make sure the `if match is None: ... else: tracker.record_success()` branch is correct. If the bot responds with an empty string for unknown input, the fallback tracker's `record_fallback()` isn't returning a string — check the import.

### 5.3 Verify fallback handling

**✅ Checklist**

- ✅ Unknown input triggers a fallback response, not an empty string or crash.
- ✅ Three consecutive fallbacks trigger an offer-to-help message.
- ✅ A successful input resets the consecutive fallback counter.
- ✅ Fallback stats track both consecutive and total counts.

**🤔 Socratic Question(s)**

- Why track consecutive fallbacks instead of just total fallbacks? What would happen if the bot offered help after every single unknown input?
- If you wanted the bot to log which inputs triggered fallbacks (for later analysis), where would you store that log — in `FallbackTracker`, `ChatContext`, or a separate module?

## Step 6 — Build the chat loop

All the pieces are ready. This step wires them into a single `main()` function with a clean REPL loop, input validation, and a graceful exit.

### 6.1 Create the main entry point

**✏️ Full file: `main.py`**

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

**🎯 Expected output:** Running `uv run python main.py` produces:

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

**🩹 If it's off:** If `main.py` crashes with `ModuleNotFoundError`, the other modules (`patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py`) aren't in the same directory — keep all files in the project root. If the REPL exits immediately, `input()` is raising `EOFError` — this happens in some notebook environments; run it in a real terminal instead.

### 6.2 Add input validation and edge cases

**👟 Starter hint:** Guard against common user mistakes — empty input, extremely long messages, and control characters:

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

Wire it into the main loop:

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

**🎯 Expected output:** Pressing Enter without typing anything silently continues the loop. Typing 600 characters truncates to 500. Control characters are stripped.

**🩹 If it's off:** If pressing Enter causes the bot to respond with a fallback, the empty-string check is after `validate_input` instead of before — make sure `validate_input` returns `None` for empty strings and the main loop skips `None` values.

### 6.3 Verify the complete chatbot

**✅ Checklist**

- ✅ `main.py` runs as a REPL that reads input and prints responses.
- ✅ Greetings, time, date, name, mood, help, and farewell all work.
- ✅ Unknown input triggers fallback responses with escalating help.
- ✅ Empty input is silently ignored.
- ✅ `bye` or `exit` prints a farewell and exits cleanly.
- ✅ A conversation summary prints on exit with turn count, fallback count, and final mood.
- ✅ All five modules (`patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py`) are in the same directory.

## ⚠️ Common pitfalls

- **Forgetting `re.IGNORECASE`.** Without it, "Hello" won't match `r"\bhi\b"` because regex is case-sensitive by default. Every `re.search` and `re.match` call in the classifier needs this flag.
- **Mixing f-strings and lambdas in response templates.** An f-string like `f"The time is {datetime.now()}"` evaluates *once at import time*, freezing the value. Use `lambda: f"..."` instead so it evaluates on each call.
- **The fallback counter resetting too often.** `record_success()` resets the consecutive counter — if you call it for every input (including fallbacks), the "3 in a row" threshold never triggers. Only call it when the classifier actually matches.
- **`deque(maxlen=10)` not working.** The `maxlen` must be passed to the `default_factory` lambda, not as a class-level default: `field(default_factory=lambda: deque(maxlen=10))`, not `deque: deque = deque(maxlen=10)`.
- **REX in notebooks.** `input()` in Colab/Kaggle works, but the chat loop doesn't exit cleanly on `Ctrl+C` — it raises `KeyboardInterrupt` which you need to catch. The `try/except (EOFError, KeyboardInterrupt)` in `main.py` handles this.

## What you just built

A rule-based chatbot built entirely from the Python standard library: regex pattern matching for intent classification, template-based response generation with dynamic data, conversation context tracking across turns, personality with mood shifts, and a fallback system that escalates help after repeated misses. Five modules — `patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py` — each tested independently before being wired together in `main.py`. The chatbot recognises greetings, questions about time/date/name/mood, help requests, and farewells, and responds with personality-driven variation instead of fixed strings.

## Where to go from here

- **Add a simple knowledge base.** Store facts the bot can look up — "Python was created by Guido van Rossum" — and respond to `question` intents by searching the knowledge base instead of giving a generic "I don't know."
- **Persistent conversation history.** Save the chat log to a JSON file so you can review past conversations, or load a previous session's context when the bot restarts.
- **Multi-user support.** Key the `ChatContext` by user ID instead of having one global context — different users get independent conversation histories.
- **Regex improvements.** Use `re.VERBOSE` mode to write more readable patterns with comments, or compile patterns with `re.compile` for better performance on large pattern lists.
- **LLM fallback.** When the regex classifier returns `None`, pass the input to a free-tier LLM instead of a static fallback response — the best of both worlds: fast pattern matching for common cases, flexible AI for everything else.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
