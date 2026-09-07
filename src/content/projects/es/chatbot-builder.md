---
title: "Constructor de Chatbots"
description: "Construye un chatbot basado en reglas con coincidencia de patrones, seguimiento de contexto y personalidad."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["Chatbots", "regex", "classes", "cli"]
prerequisites:
  - "Fundamentos de Python (variables, bucles, funciones, diccionarios, clases)"
  - "Regex básico"
learningObjectives:
  - "Comparar la entrada del usuario contra patrones usando el módulo re"
  - "Construir un sistema de generación de respuestas con plantillas y contexto"
  - "Seguir el estado de la conversación con una clase"
  - "Dar a un chatbot una personalidad y un estado de ánimo consistentes"
  - "Manejar entradas desconocidas con respaldos elegantes"
---

# Constructor de Chatbots

Construye un chatbot basado en reglas que reconoce saludos, preguntas y comandos — y responde con personalidad, no solo con datos. Este proyecto recorre la coincidencia de patrones con regex, la generación de respuestas, el contexto de conversación y un bucle CLI limpio, todo desde la biblioteca estándar.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## Lo que harás

1. Comparar la entrada del usuario contra patrones de regex para identificar la intención.
2. Construir un sistema de generación de respuestas con plantillas.
3. Seguir el contexto de la conversación a través de múltiples turnos.
4. Agregar personalidad y estado de ánimo al bot.
5. Manejar entradas desconocidas con respaldos elegantes.
6. Conectar todo en un bucle de chat que une las piezas.

## Dónde ejecutar esto

- **Localmente con `uv` (recomendado).** Este proyecto usa solo la biblioteca estándar — sin paquetes de terceros — pero `uv` mantiene la estructura del proyecto limpia. La sección de Configuración a continuación lo recorre.
- **Google Colab o Kaggle Notebooks.** Pega las celdas de código directamente en un notebook. `input()` funciona para los avisos de chat, aunque el bucle funciona mejor en una terminal real.
- **Playground de JupyterLite.** Pegar las celdas de código directamente en un notebook — el bucle de chat funciona, pero mantén las sesiones cortas ya que no hay terminal persistente.

## Configuración

`uv` es una sola herramienta que reemplaza la cadena habitual de "instalar Python, luego pip, luego un entorno virtual" — puede instalar y gestionar versiones de Python junto con las dependencias de tu proyecto.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y reabre tu terminal, luego confirma que se instaló:

```bash
uv --version
```

Crea el proyecto:

```bash
uv init chatbot
cd chatbot
```

Sin paquetes que agregar — el chatbot usa solo la biblioteca estándar de Python (`re`, `random`, `dataclasses`, `collections`).

## Paso 1 — Compara la entrada del usuario con regex

La coincidencia de patrones es cómo el bot descubre lo que el usuario quiere decir. Un usuario puede escribir "Hello!", "hi", "hey there" o "good morning" — pero la intención detrás de todos es un saludo. Regex nos permite colapsarlos en un solo patrón.

### 1.1 Define los patrones de intención

**👟 Pista inicial :** Crea un archivo `patterns.py` con un diccionario que mapea nombres de intención a listas de patrones de regex. Usa `re.IGNORECASE` para que "Hello", "hello" y "HELLO" coincidan con el mismo patrón.

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

**🎯 Resultado esperado :** Importar y revisar los patrones debería funcionar así:

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

Debe imprimir:

```
greeting
time
None
```

**🩹 Si sale mal :** Si cada entrada devuelve `None`, olvidaste `re.IGNORECASE` — "Hello" no coincidirá con `r"\bhi\b"` cuando el regex distingue mayúsculas y el usuario capitaliza la primera letra. Si `greeting` coincide con "good morning" pero no con "goodnight", revisa que `goodnight` no esté en tu lista de despedidas o en un patrón de saludo — no es un substring del patrón `good\s*(morning|afternoon|evening)`.

### 1.2 Maneja los grupos de regex para datos extraídos

Algunos patrones necesitan extraer información, no solo coincidir. El patrón de saludo podría querer saber *qué* saludo se usó, y los patrones de hora/fecha necesitan funcionar independientemente de la redacción.

**👟 Pista inicial :** Agrega una función `classify_with_matches` que devuelva tanto la intención como cualquier grupo capturado del regex:

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

**🎯 Resultado esperado :**

```python
result = classify_with_matches("good evening!")
print(result.intent, result.matched_text, result.groups)

result = classify_with_matches("what's your name")
print(result.intent, result.matched_text, result.groups)
```

Debe imprimir:

```
greeting good evening ('evening',)
name what's your name ()
```

**🩹 Si sale mal :** Si `groups` es `()` cuando esperas una captura, los paréntesis en tu regex son grupos no capturantes — usa `(...)` no `(?:...)` para los grupos que quieres extraer. Si `matched_text` está vacío, `re.search` encontró una coincidencia en la posición 0 pero el límite de palabra `\b` podría estar recortando la coincidencia — intenta quitar los anclajes `\b` del patrón específico.

### 1.3 Verifica el clasificador

**✅ Lista de verificación**

- ✅ `INTENT_PATTERNS` mapea nombres de intención a listas de strings de regex.
- ✅ `classify()` devuelve un nombre de intención o `None` para entrada desconocida.
- ✅ `classify_with_matches()` devuelve un `MatchResult` con intención, texto coincidente y grupos capturados.
- ✅ La coincidencia insensible a mayúsculas funciona para todos los patrones.
- ✅ La entrada desconocida como "purple elephant" devuelve `None`.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué cada intención se mapea a una *lista* de patrones en lugar de un solo patrón? ¿Qué pasa cuando un usuario escribe "hey" en lugar de "good afternoon"?
- ¿Cuál es la diferencia entre `re.search` y `re.match` aquí? ¿Rompería algo cambiar a `re.match`?

## Paso 2 — Genera respuestas desde plantillas

Ahora que el bot sabe *qué* quiere decir el usuario, necesita decir algo de vuelta. Un sistema de respuestas construido con plantillas y elecciones aleatorias evita que el bot suene robótico.

### 2.1 Construye el registro de respuestas

**👟 Pista inicial :** Crea `responses.py` con un diccionario que mapea intenciones a listas de plantillas de respuesta. Usa `random.choice` para elegir una al azar, para que la misma entrada no siempre produzca la misma respuesta.

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

**🎯 Resultado esperado :**

```python
from responses import get_response

print(get_response("greeting"))
print(get_response("greeting"))  # same intent, different response
```

Debe imprimir dos saludos diferentes (el texto exacto varía):

```
Hey there! How can I help?
Hi! Ready to chat.
```

**🩹 Si sale mal :** Si obtienes una cadena vacía, el nombre de la intención no coincide con ninguna clave de `RESPONSES` — revisa errores tipográficos como `"Greeting"` (G mayúscula) frente a `"greeting"`. Si la misma respuesta aparece cada vez, olvidaste `random.choice` y estás usando el índice `[0]` o una entrada fija.

### 2.2 Agrega respuestas dinámicas con f-strings

Algunas respuestas necesitan datos en vivo — la hora y la fecha cambian cada segundo. Usar f-strings en los strings de plantilla se evaluaría en el momento de importar, congelando los valores. En su lugar, usa respuestas invocables.

**👟 Pista inicial :** Reemplaza los strings estáticos con lambdas para las intenciones que necesitan datos dinámicos:

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

Luego actualiza `RESPONSES` para que las entradas de hora y fecha sean funciones:

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

**🎯 Resultado esperado :** Llamar a `get_response("time")` dos veces seguidas devuelve la hora actual, no la hora del momento en que el módulo se importó por primera vez:

```python
import time
print(get_response("time"))
time.sleep(2)
print(get_response("time"))
```

Ambas imprimen la misma hora (solo 2 segundos de diferencia), pero si esperas un minuto completo entre llamadas, las horas diferirán — prueba de que el lambda se evalúa en cada llamada, no una vez en la importación.

**🩹 Si sale mal :** Si `callable(choice)` devuelve `False` para un lambda, revisa que el lambda esté definido correctamente — `lambda: f"..."` no `f"..."` (un f-string desnudo es un string, no una función). Si obtienes `TypeError: 'str' object is not callable`, un string estático se mezcló en una lista que ahora se está llamando — asegúrate de que solo las entradas de lambda estén en las listas dinámicas.

### 2.3 Verifica la generación de respuestas

**✅ Lista de verificación**

- ✅ `get_response()` devuelve un string aleatorio de la lista de la intención.
- ✅ Las respuestas dinámicas (hora, fecha) devuelven el valor actual, no uno congelado.
- ✅ La verificación `callable()` maneja tanto strings como lambdas con elegancia.
- ✅ Cada intención en `INTENT_PATTERNS` tiene una entrada correspondiente en `RESPONSES`.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué usar `callable()` para revisar cada respuesta en lugar de poner todas las respuestas dinámicas en un diccionario separado? ¿Cuál es la ventaja de mezclar strings y lambdas en una sola lista?
- Si quisieras que el bot recordara *qué* preguntó el usuario (no solo la intención), ¿dónde almacenarías esa información?

## Paso 3 — Sigue el contexto de la conversación

Un chatbot que solo mira el mensaje actual es olvidadizo. El seguimiento de contexto deja que el bot recuerde lo que el usuario dijo antes — para que preguntas de seguimiento como "¿y mañana?" o "¿y tú?" tengan sentido.

### 3.1 Define la clase de contexto de conversación

**👟 Pista inicial :** Usa un dataclass para mantener el estado de la conversación. Sigue la última intención, los últimos mensajes, un contador de turnos y cualquier entidad extraída:

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

**🎯 Resultado esperado :**

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

Debe imprimir:

```
Turns: 3
Last intent: mood
Recent intents: ['greeting', 'time', 'mood']
Was recent greeting? True
```

**🩹 Si sale mal :** Si `turn_count` siempre es 1, olvidaste llamar a `update()` — no se incrementa automáticamente. Si `message_history` es más larga que 10 entradas, el límite `deque(maxlen=10)` no está funcionando — revisa que estés pasando `maxlen=10` en el `default_factory`, no en el cuerpo de la clase como valor por defecto.

### 3.2 Usa el contexto para mejorar las respuestas

**👟 Pista inicial :** Una función de respuesta consciente del contexto puede revisar la última intención para manejar seguimientos. Si el usuario pregunta "¿y mañana?" después de una pregunta de hora, el bot debería inferir que quiere la fecha.

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

**🎯 Resultado esperado :**

```python
ctx = ChatContext()
ctx.update("what time is it", "time", "It's 14:30.")

adjusted = context_adjusted_intent("question", "what about tomorrow?", ctx)
print(adjusted)  # "date" — context infers date intent
```

Debe imprimir:

```
date
```

**🩹 Si sale mal :** Si la intención ajustada sigue siendo `"question"` cuando esperas `"date"`, revisa `context.last_intent` — debe ser `"time"` para que se dispare la primera rama. Si `user_message.lower()` no contiene "tomorrow", la verificación de substring no coincidirá — asegúrate de que la entrada del usuario realmente contenga la palabra.

### 3.3 Verifica el seguimiento de contexto

**✅ Lista de verificación**

- ✅ `ChatContext.update()` registra cada turno e incrementa el contador.
- ✅ `get_recent_intents()` devuelve las últimas N intenciones como lista.
- ✅ `context_adjusted_intent()` usa la última intención para refinar las preguntas de seguimiento.
- ✅ El almacenamiento y la recuperación de entidades funcionan con `store_entity` y `get_entity`.
- ✅ `message_history` está limitada a 10 entradas vía `deque(maxlen=10)`.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué limitar `message_history` a 10 entradas con un `deque`? ¿Qué pasa con el uso de memoria si almacenas cada mensaje en una lista regular durante una conversación larga?
- `context_adjusted_intent` solo revisa `last_intent`. ¿Qué cambiaría si quisieras considerar las últimas *tres* intenciones en lugar de solo una?

## Paso 4 — Agrega personalidad

Un bot que responde cada pregunta con una declaración plana se siente sin vida. La personalidad viene de rasgos consistentes — un nombre, un tono, hábitos de pequeña charla y un seguimiento del estado de ánimo que cambia a lo largo de la conversación.

### 4.1 Crea una clase de personalidad

**👟 Pista inicial :** Define un dataclass `Personality` que mantenga el nombre del bot, tono, estado de ánimo y frases favoritas. Agrega métodos para cambios de estado de ánimo y respuestas basadas en rasgos.

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

**🎯 Resultado esperado :**

```python
from personality import Personality

bot = Personality(name="HAL")
print(bot.greet())
print(bot.greet())
print(bot.get_mood_response())
bot.shift_mood()
print(f"After shift: {bot.mood}")
```

Debe imprimir (varía):

```
Hi! I'm HAL. Nice to meet you!
Hey again! Back for more? I'm HAL.
I'm in a great mood! Ready to help.
After shift: curious
```

**🩹 Si sale mal :** Si el segundo saludo es idéntico al primero, `greeting_count` no se está incrementando — asegúrate de que `self.greeting_count += 1` esté dentro del método, no a nivel de módulo. Si `shift_mood` nunca produce "excited", su peso de 1 lo hace raro — ejecuta el cambio unas cuantas veces y aparecerá eventualmente.

### 4.2 Combina la personalidad con las respuestas

**👟 Pista inicial :** Actualiza el sistema de respuestas para que la personalidad matice la salida. Un bot "feliz" usa frases diferentes a uno "cansado":

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

**🎯 Resultado esperado :**

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

Debe imprimir saludos y respuestas de estado de ánimo matizados por la personalidad (varía):

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

**🩹 Si sale mal :** Si los prefijos de estado de ánimo nunca aparecen, `random.random() < 0.3` significa que solo aparecen el 30% de las veces — ejecútalo más a menudo. Si los saludos devuelven la plantilla estática en lugar de `personality.greet()`, olvidaste la rama `if intent == "greeting": return personality.greet()` en el `get_response` actualizado.

### 4.3 Verifica la personalidad

**✅ Lista de verificación**

- ✅ `Personality.greet()` devuelve mensajes distintos en llamadas sucesivas.
- ✅ `shift_mood()` cambia el estado de ánimo, con probabilidades ponderadas.
- ✅ `get_response("greeting", bot)` usa `personality.greet()` en lugar de la plantilla estática.
- ✅ Los prefijos influidos por el estado de ánimo aparecen ocasionalmente según el ánimo actual.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué usar elecciones aleatorias ponderadas para `shift_mood` en lugar de una elección aleatoria uniforme? ¿Qué modela eso sobre la personalidad real?
- Si quisieras que el bot recordara el nombre de un usuario de antes en la conversación, ¿dónde lo almacenarías — en `Personality` o en `ChatContext`? ¿Por qué?

## Paso 5 — Maneja los respaldos

Ningún patrón cubrirá jamás cada entrada posible. Un bot que se bloquea o responde con nada ante una entrada inesperada se siente roto. Los respaldos elegantes mantienen la conversación en marcha.

### 5.1 Construye un sistema de respuestas de respaldo

**👟 Pista inicial :** Crea un módulo `fallback.py` que genere respuestas útiles para entrada no coincidente. Sigue cuántos respaldos ocurren seguidos — si el bot falla en entender demasiadas veces seguidas, ofrece ayuda más directamente.

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

**🎯 Resultado esperado :**

```python
from fallback import FallbackTracker

tracker = FallbackTracker(help_threshold=3)
print(tracker.record_fallback())
print(tracker.record_fallback())
print(tracker.record_fallback())  # 3rd consecutive — triggers offer
print(tracker.get_stats())
```

Debe imprimir (varía):

```
I'm not sure I understand. Could you rephrase that?
Hmm, I don't have an answer for that. Try asking about the time or date!
It seems like we're having trouble connecting. Would you like me to list what I can do?
{'consecutive': 3, 'total': 3}
```

**🩹 Si sale mal :** Si la respuesta de ofrecer ayuda nunca aparece, revisa que `consecutive_fallbacks` se esté incrementando — si se llama a `record_success()` entre respaldos, el contador se reinicia. Si las estadísticas muestran `consecutive: 3` pero solo llamaste a `record_fallback` dos veces, revisa que `record_success` no se esté llamando cuando no debería.

### 5.2 Combina los respaldos con el clasificador principal

**👟 Pista inicial :** Conecta el rastreador de respaldos al bucle principal de clasificar-y-responder. Si `classify` devuelve `None`, usa el respaldo en su lugar:

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

Espera — eso reinicia el rastreador en el *éxito*, pero el rastreador de respaldo debería reiniciarse en el éxito, no en el fallo. Arreglemos eso:

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

**🎯 Resultado esperado :** Escribir tres entradas desconocidas seguidas produce mensajes de respaldo cada vez más útiles:

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

Después del "hello" exitoso, el contador consecutivo se reinicia — la siguiente entrada desconocida arranca de nuevo desde el primer mensaje de respaldo.

**🩹 Si sale mal :** Si el contador de respaldos nunca se reinicia después de una entrada exitosa, `tracker.record_success()` no se está llamando — asegúrate de que la rama `if match is None: ... else: tracker.record_success()` sea correcta. Si el bot responde con un string vacío para entrada desconocida, `record_fallback()` del rastreador de respaldos no está devolviendo un string — revisa el import.

### 5.3 Verifica el manejo de respaldos

**✅ Lista de verificación**

- ✅ La entrada desconocida dispara una respuesta de respaldo, no un string vacío ni un crash.
- ✅ Tres respaldos consecutivos disparan un mensaje de ofrecer-ayuda.
- ✅ Una entrada exitosa reinicia el contador de respaldos consecutivos.
- ✅ Las estadísticas de respaldo siguen tanto los conteos consecutivos como los totales.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué seguir los respaldos consecutivos en lugar de solo los totales? ¿Qué pasaría si el bot ofreciera ayuda después de cada entrada desconocida?
- Si quisieras que el bot registrara qué entradas dispararon respaldos (para un análisis posterior), ¿dónde almacenarías ese registro — en `FallbackTracker`, `ChatContext` o un módulo separado?

## Paso 6 — Construye el bucle de chat

Todas las piezas están listas. Este paso las conecta en una sola función `main()` con un bucle REPL limpio, validación de entrada y una salida elegante.

### 6.1 Crea el punto de entrada principal

**✏️ Archivo completo: `main.py`**

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

**🎯 Resultado esperado :** Ejecutar `uv run python main.py` produce:

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

**🩹 Si sale mal :** Si `main.py` se bloquea con `ModuleNotFoundError`, los otros módulos (`patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py`) no están en el mismo directorio — mantén todos los archivos en la raíz del proyecto. Si el REPL sale inmediatamente, `input()` está lanzando `EOFError` — esto pasa en algunos entornos de notebook; ejecútalo en una terminal real en su lugar.

### 6.2 Agrega validación de entrada y casos límite

**👟 Pista inicial :** Protégete contra errores comunes del usuario — entrada vacía, mensajes extremadamente largos y caracteres de control:

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

Conéctalo al bucle principal:

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

**🎯 Resultado esperado :** Presionar Enter sin escribir nada continúa el bucle en silencio. Escribir 600 caracteres trunca a 500. Los caracteres de control se eliminan.

**🩹 Si sale mal :** Si presionar Enter hace que el bot responda con un respaldo, la verificación de string vacío está después de `validate_input` en lugar de antes — asegúrate de que `validate_input` devuelva `None` para strings vacíos y de que el bucle principal omita los valores `None`.

### 6.3 Verifica el chatbot completo

**✅ Lista de verificación**

- ✅ `main.py` corre como un REPL que lee entrada e imprime respuestas.
- ✅ Saludos, hora, fecha, nombre, estado de ánimo, ayuda y despedidas funcionan.
- ✅ La entrada desconocida dispara respuestas de respaldo con ayuda escalada.
- ✅ La entrada vacía se ignora en silencio.
- ✅ `bye` o `exit` imprime una despedida y sale limpiamente.
- ✅ Un resumen de conversación se imprime al salir con el conteo de turnos, el conteo de respaldos y el estado de ánimo final.
- ✅ Los cinco módulos (`patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py`) están en el mismo directorio.

## ⚠️ Errores comunes

- **Olvidar `re.IGNORECASE`.** Sin él, "Hello" no coincidirá con `r"\bhi\b"` porque el regex distingue mayúsculas por defecto. Cada llamada a `re.search` y `re.match` en el clasificador necesita esta bandera.
- **Mezclar f-strings y lambdas en las plantillas de respuesta.** Un f-string como `f"The time is {datetime.now()}"` se evalúa *una vez en el momento de la importación*, congelando el valor. Usa `lambda: f"..."` en su lugar para que evalue en cada llamada.
- **El contador de respaldos se reinicia demasiado a menudo.** `record_success()` reinicia el contador consecutivo — si lo llamas para cada entrada (incluyendo los respaldos), el umbral de "3 seguidos" nunca se dispara. Solo llámalo cuando el clasificador coincida de verdad.
- **`deque(maxlen=10)` no funciona.** El `maxlen` debe pasarse al lambda del `default_factory`, no como valor por defecto a nivel de clase: `field(default_factory=lambda: deque(maxlen=10))`, no `deque: deque = deque(maxlen=10)`.
- **REX en notebooks.** `input()` en Colab/Kaggle funciona, pero el bucle de chat no sale limpiamente con `Ctrl+C` — lanza `KeyboardInterrupt` que necesitas capturar. El `try/except (EOFError, KeyboardInterrupt)` en `main.py` maneja esto.

## Lo que acabas de construir

Un chatbot basado en reglas construido enteramente con la biblioteca estándar de Python: coincidencia de patrones con regex para la clasificación de intenciones, generación de respuestas basada en plantillas con datos dinámicos, seguimiento del contexto de conversación a través de turnos, personalidad con cambios de estado de ánimo, y un sistema de respaldo que escala el ofrecimiento de ayuda después de fallos repetidos. Cinco módulos — `patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py` — cada uno probado de forma independiente antes de conectarse en `main.py`. El chatbot reconoce saludos, preguntas sobre hora/fecha/nombre/estado de ánimo, solicitudes de ayuda y despedidas, y responde con variación impulsada por la personalidad en lugar de strings fijos.

## A dónde ir desde aquí

- **Agrega una base de conocimiento simple.** Almacena hechos que el bot pueda consultar — "Python fue creado por Guido van Rossum" — y responde a las intenciones `question` buscando en la base de conocimiento en lugar de dar un genérico "no lo sé".
- **Historial de conversación persistente.** Guarda el registro del chat en un archivo JSON para poder revisar conversaciones pasadas, o carga el contexto de una sesión previa cuando el bot se reinicia.
- **Soporte multi-usuario.** Clave el `ChatContext` por ID de usuario en lugar de tener un contexto global — usuarios distintos obtienen historiales de conversación independientes.
- **Mejoras de regex.** Usa el modo `re.VERBOSE` para escribir patrones más legibles con comentarios, o compila patrones con `re.compile` para un mejor rendimiento en listas de patrones grandes.
- **Respaldo con LLM.** Cuando el clasificador de regex devuelva `None`, pasa la entrada a un LLM de nivel gratuito en lugar de una respuesta de respaldo estática — lo mejor de ambos mundos: coincidencia de patrones rápida para casos comunes, IA flexible para todo lo demás.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓