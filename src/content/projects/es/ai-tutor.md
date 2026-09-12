---
title: "Asistente de Tutor con IA"
description: "Carga un mazo pequeño de fichas, ejecuta una sesión de práctica de repetición espaciada que actualiza intervalos reales con SM-2, persiste el progreso a JSON y adjunta una 'pista de tutor' opcional de LLM que empuja sin revelar la respuesta."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Education", "AI Agents", "NLP"]
prerequisites:
  - "Funciones, dicts, listas y un bucle básico"
  - "Leer/escribir un archivo JSON con json.dump / json.load"
  - "No se necesita experiencia en ML o APIs de LLM, el tutor central es Python puro, y la capa de LLM degrada con elegancia"
learningObjectives:
  - "Modelar un mazo de fichas como una lista de dicts que llevan el estado de programación por tarjeta"
  - "Implementar un programador SM-2 simplificado que alarga o reinicia intervalos según la calidad autocalificada"
  - "Ejecutar un bucle de práctica interactivo que actualiza la misma lista in-place por revisión"
  - "Hacer ida y vuelta del progreso hacia y desde JSON para sobrevivir entre sesiones"
  - "Componer un prompt de pista de tutor y degradar con elegancia cuando no hay una clave de API configurada"
---

# 🛠️ 📚 Construye un Asistente de Tutor con IA

Un tutor que solo conoce la respuesta correcta es apenas una app de cuestionarios. Este proyecto construye la otra clase: un tutor de repetición espaciada que *recuerda en qué eres débil*, alarga el intervalo entre revisiones cuando te va bien y lo acorta cuando no. El motor de programación es una reimplementación limpia de SM-2, un algoritmo ampliamente usado que depende solo de `interval` (días desde la última revisión) y de una puntuación de `quality` (0–5) que tú provees después de cada intento. Una capa de persistencia guarda el estado completo del mazo a JSON para que el progreso sobreviva entre sesiones, y una capa opcional de LLM redacta una "pista de tutor" de una oración que empuja sin revelar la respuesta. El núcleo es Python puro; la capa de LLM es genuina pero opcional, el tutor funciona por completo sin ninguna clave de API.

Esto asume soltura con dicts y listas, JSON básico y ningún conocimiento de machine learning; nada de esto es calificado, es opcional y no calificado, consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Definir el modelo de datos de la ficha e inspeccionar qué tarjetas deben repasarse ahora mismo.
2. Implementar un programador de intervalos SM-2 simplificado que devuelva una copia de la tarjeta actualizada.
3. Ejecutar una sesión de práctica que revise solo las tarjetas pendientes, lea las autopuntuaciones y actualice el mazo.
4. Persistir el progreso a JSON y verificar un ida y vuelta de carga/volcado.
5. Componer un prompt opcional de pista de tutor para LLM y omitir la llamada a la API con elegancia cuando no hay clave presente.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado, este proyecto escribe y lee `progress.json` y no tiene dependencias externas, así que un `uv init` fresco y una terminal local son todo lo que necesitas.

**Google Colab, Kaggle Notebooks y Binder** ejecutarán cada paso: el tutor tiene cero dependencias de pip, así que cada celda de código se ejecuta sin modificaciones. La única advertencia es que `progress.json` vive en el sistema de archivos efímero del notebook, descárgalo entre sesiones si quieres persistir entre ejecuciones de Colab.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-tutor/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-tutor/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-tutor%2Fnotebook.es.ipynb)

## Configuración

Todo lo necesario antes de la primera ejecución de práctica: un proyecto con `json` (no se requiere `uv add`) y un mazo inicial cuyo estado de programación está a mitad de un arco de aprendizaje plausible.

### Crea el proyecto

```bash
uv init ai-tutor
cd ai-tutor
```

No se necesita `uv add`, `json` está en la biblioteca estándar, y el motor SM-2 son cinco líneas de aritmética.

### Carga el mazo inicial

**👟 Pista inicial :** Construye `new_card` como una fábrica diminuta para que cada tarjeta comience con valores por defecto sensatos (`interval=0`, `due=0`) mientras sigue permitiendo sobreescrituras del mundo real para tarjetas ya aprendidas.

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

El mazo captura una mezcla realista: `py-1` nunca se revisó (`interval=0, due=0`), `py-2` se revisó hace unos días (`due=2`, ahora vencida), `py-3` vence hoy, y `py-4` está programada para el futuro. `due <= today` es el predicado de "ahora", una tarjeta vencida *y* una tarjeta que vence hoy cuentan ambas.

**🎯 Resultado esperado :** `4 cards` y `3 due now ['py-1', 'py-2', 'py-3']`.

**🩹 Si sale mal :** Si `due` imprime las tarjetas equivocadas, verifica si `due` es un campo entero crudo (no un datetime), este proyecto usa un conteo de días, no una fecha. Si el conteo está mal, el `<=` debería ser `<`, una tarjeta vencida (día 2, hoy día 5) cuenta, y una tarjeta que vence hoy (día 5) cuenta, pero una tarjeta futura (día 8) no.

## Paso 2: Implementa el programador SM-2

El programador es una función pura: dale el `interval` actual y la `quality` autocalificada (0–5, donde 3 y más significa "lo sabía"), y devuelve el siguiente intervalo, sin efectos secundarios, sin I/O.

### 2.1 Escribe `sm2_interval`

**👟 Pista inicial :** Traduce las reglas de SM-2: calidad por debajo de 3 reinicia a repetición corta; intervalo 0 pasa a 1 día; intervalo 1 pasa a 6 días; si no, el doble y mitad del intervalo actual.

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

Calidad por debajo de 3 significa "no lo sabía", la tarjeta se reinicia para una repetición corta. Una vez que la calidad es ≥ 3, el intervalo *crece*: una tarjeta nunca vista (0 → 1 día) → una tarjeta de un día (1 → 6 días) → una tarjeta de seis días (6 → 15 días). El crecimiento no es lineal: `round(interval * 2.5)` hace que una tarjeta correcta tres veces seguidas crezca mucho más rápido que las primeras revisiones, que es toda la razón por la que la repetición espaciada ahorra tiempo.

**🎯 Resultado esperado :** `1 6 15 0`, la primera revisión tiene éxito, la segunda abre el arco largo, la tercera lo vuelve a crecer, y una revisión fallida en una tarjeta madura la reinicia.

**🩹 Si sale mal :** Si `sm2_interval(0, 3)` imprime `0` en lugar de `1`, la comprobación de `quality >= 3` está colocada después de la comprobación de `interval == 0` (retorno temprano). Si imprime un float como `15.0`, se eliminó `round()`.

### 2.2 Escribe la función `review`

**👟 Pista inicial :** `review` toma una tarjeta, una puntuación de calidad y el conteo de días de hoy; devuelve una *copia actualizada*, sin efectos secundarios.

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

`dict(card)` crea una copia superficial, el mazo original no se muta, lo que significa que el llamador elige si persiste el cambio (es un diseño deliberado y escalonable). Calidad ≥ 3 crece el intervalo y empuja `due` hacia adelante ese número de días. Calidad por debajo de 3 reinicia la tarjeta: el intervalo se mantiene al menos en 1 (para que la tarjeta siga en rotación) y la tarjeta vence hoy mismo, no mañana, porque el estudiante aún no ha demostrado que la sabe.

**🎯 Resultado esperado :** `1 1`, `6 6`, `6 0`, los tres casos: primera revisión, segunda revisión, revisión fallida.

**🩹 Si sale mal :** Si la tercera línea imprime `0 0` en lugar de `6 0`, la rama de "fallo" está reiniciando el intervalo a 0 en lugar de mantener `max(1, card["interval"])`. Si `c["due"]` en un crecimiento falla con `TypeError`, `card["due"]` era un string, asegúrate de que `due` permanezca entero en todo momento.

### 2.3 Verifica el programador

**✅ Lista de verificación**

- ✅ `sm2_interval` es determinista: mismo `interval` + `quality` → mismo resultado cada vez.
- ✅ `review` devuelve un dict nuevo, el llamador elige si acepta la actualización.
- ✅ La calidad por debajo de 3 reinicia la tarjeta, pero nunca a `interval=0`, la tarjeta se mantiene en rotación.

**🤔 Pregunta(s) socrática(s)**

- `review` devuelve una copia en lugar de mutar la tarjeta en su sitio. ¿Por qué es importante esto para una *sesión* que revisa varias tarjetas, y cuál sería el riesgo de un `review` mutante si luego quieres mostrarle al estudiante "así cambiaría tu mazo" *antes* de aceptarlo?
- SM-2 dice "repite inmediatamente al fallar", y esta implementación configura `due = today`. ¿Por qué `due = today` es una mejor elección que `due = tomorrow`, y qué pasa en el cerebro de un estudiante cuando una tarjeta fallida aparece de nuevo en la misma sesión?

## Paso 3: Sesión de práctica

Ahora el tutor hace su trabajo: filtra las tarjetas pendientes, le pregunta al estudiante por una respuesta y una nota de calidad, aplica `review` y actualiza el mazo.

### 3.1 Construye el bucle interactivo

**👟 Pista inicial :** `run_session` toma el mazo, el conteo de días y un callable `ask`. El callable es lo que le pregunta al estudiante, y lo que hace comprobable la sesión.

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

`cards[idx] = review(...)` es la única mutación deliberada de todo el proyecto: el mazo se actualiza in-place, que es lo que quieres para una sesión real donde la misma lista sobrevive durante la vida del script. Pasar `ask` en lugar de usar `input()` directamente es lo que hace determinista el bucle, el script lo llama con la misma secuencia de respuestas cada vez.

**🎯 Resultado esperado (guionizado) :** `3 due today`, las tres tarjetas con `due <= 5` se revisan, una por una.

**🩹 Si sale mal :** Si el conteo está mal, la lista `due` se filtró contra un valor de `today` diferente. Si `ask()` se llama solo una vez por tarjeta (en lugar de dos, respuesta + nota), el bucle está cortocircuitando en la línea `_ = ask()`.

### 3.2 Simula una sesión con respuestas fijas

**👟 Pista inicial :** Construye un iterador diminuto que alimente a `ask`, una respuesta de respuesta libre, luego una nota entera, por tarjeta pendiente, para que la sesión sea completamente determinista.

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

Un `list.__iter__` da los mismos valores en el mismo orden cada ejecución, así se obtiene una salida esperada reproducible de un bucle que, en uso real, sería `input()`. Después de la sesión, `py-1` crece (0 → 1 día, vence el día 6), `py-2` se reinicia (sigue venciendo hoy, día 5) y `py-3` salta (6 → 15 días, vence el día 20). La línea final pregunta "¿quién sigue pendiente?", y solo el `py-2` fallido califica.

**🎯 Resultado esperado :**

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

**🩹 Si sale mal :** Si `still due now` muestra `['py-2', 'py-3']`, el nuevo `due` de `py-3` se calculó como `5 + 15 = 20`, que *no* es `<= 5`, así que la lista estaría mal si apareciera `py-3`; verifica que `due` se fije en `today + interval`, no en `today + quality`.

### 3.3 Verifica la sesión

**✅ Lista de verificación**

- ✅ Exactamente 3 tarjetas vencen, y después de la sesión exactamente 1 (`py-2`) sigue vencida.
- ✅ Una primera revisión exitosa (`py-1`) configura `interval=1` y `due=6`.
- ✅ Una revisión fallida (`py-2`) reinicia `due` a `today`, no a `today + 1`.

**🤔 Pregunta(s) socrática(s)**

- El script muestra "pear" tres veces como respuesta del estudiante, el estudiante *real* escribiría una palabra diferente para cada una. ¿Por qué un `iter` guionizado hace determinista la salida, y qué cambiaría `input()` dentro del bucle sobre eso?
- Después de la sesión, `py-2` sigue vencida. ¿Qué harías en la *siguiente* llamada a `run_session` para que el estudiante vea la tarjeta fallida otra vez sin volver a ver las tarjetas que ya sabe?

## Paso 4: Persiste el progreso y resume

Un tutor que olvida al estudiante entre sesiones es apenas una app de cuestionarios con pasos extra. Este paso guarda el mazo a JSON y verifica el ida y vuelta.

### 4.1 Guarda y carga

**👟 Pista inicial :** Escribe `save_deck` y `load_deck`, dos funciones diminutas, cada una de una línea de `json.dump`/`json.load`, manteniendo el formato de datos abierto para inspección futura.

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

`indent=2` es la elección de formato que vuelve legible el JSON en una terminal y amigable para diff en git, una decisión de una línea que se paga por sí sola cada vez que alguien tiene que leer el archivo a mano. La comprobación `round-trip ok: True` es una prueba de integridad simple pero real: el archivo en disco es igual al mazo en memoria, lo que significa que guardar + cargar no perdió ni reordenó nada.

**🎯 Resultado esperado :** `saved 4 cards to progress.json` y `round-trip ok: True`.

**🩹 Si sale mal :** Si el ida y vuelta imprime `False`, verifica si `last` se agregó después de que el JSON se guardó (el archivo guardado no lo tendrá, pero el mazo en memoria sí, guarda después de la actualización de `last` o guarda antes). Si `json.dump` da error con `TypeError: Object of type ndarray is not JSON serializable`, uno de los valores de intervalo o vencimiento era un entero de numpy, envuélvelo con `int(...)`.

### 4.2 Verifica la persistencia

**✅ Lista de verificación**

- ✅ `progress.json` existe y contiene 4 objetos de tarjeta, cada uno con campos `interval`, `due` y `last`.
- ✅ `load_deck()` devuelve una lista igual al mazo que se guardó.
- ✅ Eliminar el mazo de la memoria y volver a cargarlo produce el mismo estado.

**🤔 Pregunta(s) socrática(s)**

- Este formato de persistencia almacena el mazo *completo* cada vez. Cuando el mazo crezca a 1000 tarjetas, ¿es eso despilfarro? ¿Qué cambio de una sola fila en `json.dump` (una estructura diferente) te permitiría actualizar una tarjeta sin reescribir todo el archivo?
- El campo `last` solo se agregó dentro de `review`, así que las tarjetas que *no* se revisaron durante la sesión no lo tienen. ¿Cómo afectaría esa inconsistencia a una futura función de "historial de revisiones", y cuál es el arreglo más simple?

## Paso 5: Pista de tutor de LLM (opcional)

Un programador te dice *cuándo* repasar; una pista de tutor te dice *cómo* pensar. Este paso construye un prompt determinista y, cuando hay una clave presente, lo envía a un LLM. El tutor funciona perfectamente sin él.

### 5.1 Compón el prompt de la pista

**👟 Pista inicial :** Construye un prompt que le dé al LLM la tarjeta y la respuesta equivocada, y pida un empujón, no la solución.

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

Incrustar la respuesta equivocada en el prompt le da al LLM algo que *corregir*, puede escribir "el `d` por defecto solo se devuelve en un *fallo de búsqueda*, no en un *acierto*" en lugar de una explicación genérica. La restricción "una oración" evita que la pista se convierta en un sermón.

**🎯 Resultado esperado :** Una oración que empieza con `The learner answered 'When the key equals the default' for flashcard 'py-2'. The card asks 'When does \`dict.get(k, d)\` return \`d\`?' and the correct answer is 'When \`k\` is missing from the dict.'. Write a one-sentence hint nudging them toward the answer without giving it away.`, nota el prompt completo, no la respuesta del LLM.

**🩹 Si sale mal :** Si el ID de la tarjeta es `py-1` en lugar de `py-2`, `DECK[1]` se usó contra un mazo sin ordenar, revisa el orden de las tarjetas, o cambia el índice para que coincida con la tarjeta fallida del Paso 3.

### 5.2 Ejecuta la pista (opcional)

**👟 Pista inicial :** Revisa primero `OPENAI_API_KEY`; si está ausente, guarda el prompt para uso manual. Nunca bloquees al tutor por una clave faltante.

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

El mismo patrón elegante de las capas opcionales anteriores: la variable de entorno maneja el CI, `getpass` maneja una terminal, y la cadena vacía es la salida. Guardar el prompt significa que el paso de la pista nunca es el cuello de botella, pégalo en cualquier modelo, obtén una pista, cópiala de vuelta en la salida impresa del bucle de práctica.

**🎯 Resultado esperado :** `no key, prompt saved to hint_prompt.txt`.

**🩹 Si sale mal :** Si el archivo está vacío, la cadena del prompt la consumió el primer `print` (las f-strings se evalúan una vez), reasígnala, no la imprimas dos veces. Si imprime `GetPassWarning`, la terminal no es interactiva y no hay `OPENAI_API_KEY` configurada, exporta la variable en su lugar.

### 5.3 Verifica la capa de tutor

**✅ Lista de verificación**

- ✅ `tutor_prompt` siempre devuelve una cadena que incrusta los campos reales de la tarjeta, sin marcadores de posición genéricos.
- ✅ Sin clave, `hint_prompt.txt` existe y contiene la cadena exacta del prompt.
- ✅ La capa de pista del tutor corre al final del pipeline, así que un fallo aquí nunca bloquea al programador ni a la persistencia.

**🤔 Pregunta(s) socrática(s)**

- El prompt del tutor pide "un empujón sin revelarlo". ¿Qué cambio de una oración haría el prompt *seguramente inyectable* entre tipos de tarjetas, y por qué importa el entrecomillado explícito (escapar `'`) en `wrong_answer` cuando la cadena entra a un prompt?
- La ruta de clave `getpass` es interactiva; la ruta `OPENAI_API_KEY` no lo es. ¿Para qué tipo de despliegue es la ruta de variable de entorno en realidad *más* segura, y cuál es el error común que vuelve inseguras ambas por igual?

## ⚠️ Errores comunes

- **Mutar la tarjeta en lugar de devolver una copia.** `review` es una función pura por diseño, su salida es un dict nuevo. Si mutas la tarjeta original dentro de `review`, el bucle de sesión no puede mostrar un antes/después, y pierdes la capacidad de "deshacer" una nota mal puesta.
- **Usar `due = today + quality` en lugar de `today + interval`.** El intervalo crece; la calidad es un entero pequeño de 0–5. Mezclarlos produce fechas de vencimiento absurdas, y el error es invisible hasta la siguiente sesión.
- **Llamar `ask()` dentro de `input()` para el bucle guionizable.** `input()` en un script de prueba se cuelga. Pasas `ask` como callable y construyes un envoltorio real basado en `input` para el uso interactivo, este es el patrón que hace al tutor a la vez comprobable y usable.
- **Persistir antes de que se configure `last`.** El campo `last` solo se agrega durante `review`, así que las tarjetas no revisadas en una sesión no lo tendrán en el archivo guardado, y una futura carga verá una inconsistencia de esquema. O inicializas `last` en `new_card` o guardas solo después de una sesión completa.
- **Guardar como lista plana.** Una lista de dicts funciona para un mazo pequeño, pero dos estudiantes no pueden compartir el mismo archivo, y no hay metadatos por mazo. Un dict claveado por nombre de mazo es una mejora de bajo esfuerzo que a prueba el formato para el futuro.

## Lo que acabas de construir

Un tutor que recuerda en qué eres débil, programa revisiones con matemática real, persiste su estado honestamente y puede redactar una pista que empuja cuando hay un LLM disponible. El motor SM-2 es una función de cinco líneas; el resto es plomería de datos limpia, un mazo de dicts, un bucle que filtra y muta, y un archivo JSON. La forma transferible, *función pura para la lógica central, bucle de sesión mutable para las actualizaciones de estado, JSON para la persistencia, LLM opcional para la inteligencia*, es el mismo esqueleto detrás de los planificadores, los rastreadores de hábitos y cualquier herramienta ligera con estado.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/ai-tutor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-tutor) en el repositorio del curso es el tutor completo como notebook, el mismo mazo inicial, sesión guionizada, verificación de persistencia y pista opcional de LLM, todo ejecutable en Colab/Kaggle/Binder. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega una línea de respaldo `hint = card["hint"]`: cuando el estudiante se equivoca en una tarjeta y no hay clave de API, imprime la pista *almacenada* de inmediato, el tutor ahora ayuda incluso sin un LLM.
- Construye una función `stats()` que lea `progress.json` e imprima la racha exitosa más larga del estudiante, la calidad promedio y las tarjetas que vencen en los próximos 7 días.
- Agrega un segundo mazo (p. ej. un mazo de vocabulario) y una bandera `--deck` para que el mismo CLI sirva múltiples materias.
- Almacena un registro de sesión como un segundo archivo JSON con una lista de filas `{id, quality, timestamp}`, los datos crudos para una gráfica de progreso más adelante.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓