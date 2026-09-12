---
title: "Aplicación de Tarjetas de Estudio"
description: "Sistema de tarjetas de estudio con repetición espaciada que optimiza el momento de revisión para máxima retención."
difficulty: "beginner"
estimatedMinutes: 40
xpReward: 50
tags: ["cli", "json", "spaced-repetition", "file-io"]
prerequisites:
  - "Fundamentos de Python (variables, bucles, funciones, diccionarios)"
  - "E/S de archivos básica"
---

# Aplicación de Tarjetas de Estudio

Construye una aplicación de tarjetas de estudio en la terminal que usa el algoritmo de repetición espaciada SM-2 para programar revisiones en intervalos científicamente óptimos. Aprenderás a modelar datos con diccionarios, implementar un bucle de estudio con interacción del usuario, aplicar un algoritmo que se adapta a tu rendimiento y persistir todo en JSON para que tu progreso sobreviva entre sesiones.

## 🎯 Lo que aprenderás

1. Modelar datos con diccionarios y listas
2. Implementar una sesión de estudio con interacción del usuario
3. Aplicar el algoritmo de repetición espaciada SM-2
4. Seguir el progreso del aprendizaje con estadísticas
5. Persistir datos en archivos JSON

## 🎯 Lo que construirás

Una aplicación de tarjetas de estudio en la terminal que:
- Almacena tarjetas con contenido frontal/posterior y etiquetas
- Ejecuta sesiones de estudio con volteo para revelar
- Usa repetición espaciada para programar revisiones
- Sigue el dominio y la precisión a lo largo del tiempo
- Guarda el progreso entre sesiones

## Dónde ejecutar esto

- **Localmente con `uv` (recomendado).** Este proyecto usa solo la biblioteca estándar, así que funciona dondequiera que corra Python. La sección Configuración de abajo lo recorre.
- **Google Colab o Kaggle Notebooks.** Pega las celdas de código directamente en un notebook. Las llamadas a `input()` funcionan para los avisos de estudio, pero la E/S de archivos (Paso 6) funciona de manera distinta en el navegador.
- **Playground de JupyterLite.** Pega las celdas de código directamente en un notebook, ten en cuenta que la persistencia de archivos (Paso 6) solo funciona localmente.

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo, ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/flashcard-app/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/flashcard-app/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fflashcard-app%2Fnotebook.es.ipynb)

## Configuración

```bash
uv init flashcard-app
cd flashcard-app
```

## Paso 1: Define el modelo de datos

Antes de construir cualquier función, decide cómo vive una tarjeta de estudio en memoria. Cada tarjeta es un diccionario con campos para su contenido, metadatos y estado de repetición espaciada. Una lista contiene todas las tarjetas de un mazo. Esta estructura plana mantiene las cosas simples, aún no se necesitan clases.

### 1.1 Crea la estructura de la tarjeta

**👟 Pista inicial :** Cada tarjeta necesita `front`, `back`, `tags` y los campos SM-2: `interval` (días hasta la próxima revisión), `ease_factor` (qué tan rápido crecen los intervalos), `repetitions` (revisiones correctas consecutivas) y `next_review` (cuándo mostrarla de nuevo). Usa `datetime.now().isoformat()` para las marcas de tiempo.

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

**🎯 Resultado esperado :** `create_card("What is Python?", "A programming language")` devuelve un dict con todos los campos:

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

**🩹 Si sale mal :** Si obtienes un `TypeError`, asegúrate de que `datetime.now().isoformat()` se llame con paréntesis, `datetime.now().isoformat()` es correcto; `datetime.now.isoformat` (sin paréntesis) hace referencia al método sin llamarlo. Si las etiquetas vuelven como una lista mutable compartida por defecto, usaste `tags or []` incorrectamente, asegúrate de que el `or` está dentro del cuerpo de la función, no en el argumento por defecto.

### 1.2 Crea la estructura del mazo

**👟 Pista inicial :** Un mazo es un diccionario con un `name` y una lista `cards`. Empieza con una lista vacía.

```python
def create_deck(name: str) -> dict:
    return {
        "name": name,
        "cards": [],
        "created_at": datetime.now().isoformat(),
    }
```

**🎯 Resultado esperado :**

```python
>>> deck = create_deck("Python Basics")
>>> deck["name"]
'Python Basics'
>>> len(deck["cards"])
0
```

**🩹 Si sale mal :** Si `deck["cards"]` es `None` en lugar de `[]`, olvidaste incluir la clave `"cards"` en el dict de retorno.

### 1.3 Agrega tarjetas a un mazo

**👟 Pista inicial :** Agrega una tarjeta a la lista `cards` del mazo. Imprime un mensaje de confirmación.

```python
def add_card(deck: dict, front: str, back: str, tags: list[str] | None = None) -> None:
    card = create_card(front, back, tags)
    deck["cards"].append(card)
    print(f"Added: {front}")
```

**🎯 Resultado esperado :**

```python
>>> deck = create_deck("Python Basics")
>>> add_card(deck, "What is Python?", "A programming language")
Added: What is Python?
>>> add_card(deck, "What is a list?", "An ordered mutable collection", tags=["data structures"])
Added: What is a list?
>>> len(deck["cards"])
2
```

**🩹 Si sale mal :** Si la tarjeta no aparece en el mazo, verifica que estás agregando a `deck["cards"]`, no a una variable local. Si dos tarjetas comparten los mismos datos, estás reutilizando la misma referencia de dict, asegúrate de que `create_card` devuelve un dict nuevo cada vez.

### 1.4 Verifica el modelo de datos

**✅ Lista de verificación**

- ✅ `create_card` devuelve un dict con `front`, `back`, `tags`, `interval`, `ease_factor`, `repetitions`, `next_review` y `created_at`.
- ✅ Las etiquetas vuelven como lista vacía `[]` si no se proporcionan.
- ✅ `next_review` está establecido a la hora actual como cadena ISO.
- ✅ `create_deck` devuelve un dict con `name` y una lista `cards` vacía.
- ✅ `add_card` crea una tarjeta y la agrega al mazo.

**🤔 Pregunta(s) socrática(s)**

¿Por qué almacenar `next_review` como una cadena ISO en lugar de un objeto datetime? ¿Qué compensación impone la serialización JSON, y qué perderías si almacenaras una marca de tiempo unix en su lugar?

---

## Paso 2: Crea y lista tarjetas de estudio

Con el modelo de datos en su lugar, construyamos funciones para poblar un mazo y mostrar su contenido. Esta es la base de todo lo que sigue.

### 2.1 Construye un mazo de ejemplo

**👟 Pista inicial :** Crea un mazo con 5–6 tarjetas que cubran diferentes temas. Usa etiquetas variadas para que el filtrado funcione más adelante.

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

**🎯 Resultado esperado :**

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

### 2.2 Lista todas las tarjetas

**👟 Pista inicial :** Itera sobre `deck["cards"]` e imprime el frente, el reverso y las etiquetas de cada tarjeta. Numera las tarjetas para facilitar la referencia.

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

**🎯 Resultado esperado :**

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

**🩹 Si sale mal :** Si las etiquetas se muestran como `['data structures']` en lugar de `data structures`, olvidaste unirlas con `", ".join(...)`. Si el conteo es incorrecto, verifica que `enumerate` empieza en 1, no en 0.

### 2.3 Verifica el listado

**✅ Lista de verificación**

- ✅ `build_sample_deck` crea un mazo con exactamente 6 tarjetas.
- ✅ `list_cards` imprime el frente, el reverso y las etiquetas de cada tarjeta.
- ✅ Los mazos vacíos imprimen "No cards in this deck." sin bloquearse.
- ✅ Las etiquetas se muestran como cadenas separadas por comas, no como listas crudas.

**🤔 Pregunta(s) socrática(s)**

¿Por qué almacenar el mazo como un diccionario simple en lugar de una clase con métodos? ¿Qué ganas al mantener la estructura de datos simple en esta etapa?

---

## Paso 3: Modo de estudio

Ahora la parte divertida: una sesión de estudio donde volteas tarjetas, revelas la respuesta y calificas qué tan bien la sabías. La calificación de calidad que das alimenta directamente el algoritmo SM-2 en el siguiente paso.

### 3.1 Escribe el bucle de la sesión de estudio

**👟 Pista inicial :** Filtra las tarjetas que están para revisión (`next_review <= now`). Para cada tarjeta, muestra el frente, espera a que el usuario presione Enter y luego muestra el reverso. Después de revelar, pide una calificación de calidad (0–5). Recolecta las calificaciones y devuélvelas.

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

**🎯 Resultado esperado :** Cuando ejecutes `study_session(deck)` con tarjetas pendientes, verás el frente de cada tarjeta, presionas Enter, ves el reverso y luego escribes una calificación. Las tarjetas que aún no están para revisión se omiten.

### 3.2 Obtén la calificación de calidad del usuario

**👟 Pista inicial :** Pide al usuario una calificación de 0 a 5. Valida la entrada, rechaza cualquier cosa que no sea un número dentro del rango. Vuelve a preguntar ante una entrada incorrecta.

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

**🎯 Resultado esperado :**

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

**🩹 Si sale mal :** Si el bucle nunca sale, no estás retornando desde dentro del `while True`, asegúrate de que `return rating` está dentro del bloque `if 0 <= rating <= 5`. Si escribir "abc" hace que se bloquee, olvidaste el `try/except ValueError`.

### 3.3 Verifica el modo de estudio

**✅ Lista de verificación**

- ✅ `get_due_cards` solo devuelve tarjetas donde `next_review` está en el pasado.
- ✅ `study_session` muestra el frente, espera Enter y luego revela el reverso.
- ✅ `get_quality_rating` rechaza entradas fuera de 0–5 y vuelve a preguntar.
- ✅ La sesión imprime un resumen cuando termina.
- ✅ Una lista vacía de pendientes imprime "No cards due for review!" sin bloquearse.

**🤔 Pregunta(s) socrática(s)**

¿Por qué el usuario presiona Enter para revelar la respuesta en lugar de que aparezca de inmediato? ¿Cómo mejora la retención el acto físico de recordar antes de ver la respuesta?

---

## Paso 4: Repetición espaciada (SM-2)

El algoritmo SM-2 es el motor que hace que esto sea más que una simple aplicación de tarjetas. Ajusta el intervalo y el factor de facilidad después de cada revisión según qué tan bien sabías la respuesta. Las tarjetas con las que te cuesta trabajo vuelven antes; las que conoces bien se alejan más en el futuro.

### 4.1 Implementa la actualización SM-2

**👟 Pista inicial :** El algoritmo modifica tres campos de la tarjeta: `repetitions`, `interval` y `ease_factor`. Si la calidad es >= 3 (correcta), incrementa `repetitions` y haz crecer el intervalo. Si la calidad es < 3 (fallida), restablece `repetitions` a 0 y vuelve el intervalo a 1. El factor de facilidad se ajusta según la calidad, sube para respuestas fáciles y baja para las difíciles.

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

**🎯 Resultado esperado :** Probando el algoritmo con una tarjeta a través de varias revisiones:

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

**🩹 Si sale mal :** Si el intervalo no crece después de la tercera revisión, verifica que la rama `elif card["repetitions"] == 1` devuelve 6, sin ella, la fórmula `round(interval * ease_factor)` da `round(1 * 2.5) = 2` en lugar de 6 para la segunda respuesta correcta. Si `ease_factor` cae por debajo de 1.3, el tope `max(1.3, ...)` no está ahí.

### 4.2 Aplica SM-2 después de cada revisión

**👟 Pista inicial :** En el bucle de la sesión de estudio, después de obtener la calificación de calidad, llama a `update_card_sm2` sobre la tarjeta. Imprime la fecha de la próxima revisión para que el usuario sepa cuándo la volverá a ver.

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

**🎯 Resultado esperado :** Después de calificar cada tarjeta, verás cuándo está programada la siguiente:

```
  Card 1/3
  Front: What is Python?
  Press Enter to reveal the answer...
  Back:  A high-level interpreted programming language
  How well did you know it?
  Rating (0-5): 4
  -> Next review: 2026-09-07
```

Las tarjetas calificadas con 0–2 aparecen de nuevo mañana; las calificadas con 3–5 se alejan según el programa SM-2.

**🩹 Si sale mal :** Si la fecha de la próxima revisión es siempre mañana sin importar la calificación, `update_card_sm2` no está modificando el `interval` de la tarjeta, asegúrate de que estás modificando `card["interval"]` en el lugar, no creando una variable local. Si la fecha está en el pasado, olvidaste agregar `timedelta(days=card["interval"])` a `datetime.now()`.

### 4.3 Verifica SM-2

**✅ Lista de verificación**

- ✅ Calidad >= 3 incrementa `repetitions` y hace crecer el intervalo.
- ✅ Calidad < 3 restablece `repetitions` a 0 y el intervalo a 1.
- ✅ El factor de facilidad nunca cae por debajo de 1.3.
- ✅ `next_review` se establece a `now + interval` días.
- ✅ Después de la sesión de estudio, los campos de la tarjeta reflejan el nuevo programa.

**🤔 Pregunta(s) socrática(s)**

¿Por qué el algoritmo SM-2 usa un factor de facilidad multiplicativo en lugar de un incremento fijo? ¿Qué pasa con la frecuencia de revisión si siempre calificas una tarjeta como 3 (correcta con dificultad) frente a siempre 5 (perfecta)?

---

## Paso 5: Sigue el progreso

Una sesión de estudio solo es útil si puedes ver tu progreso a lo largo del tiempo. Construyamos estadísticas que muestren cuántas tarjetas dominas, tu precisión general y cuántas tarjetas están pendientes.

### 5.1 Calcula las estadísticas del mazo

**👟 Pista inicial :** Recorre todas las tarjetas y cuenta: total, dominadas (`repetitions >= 3`), en aprendizaje (`repetitions` 1–2) y nuevas (`repetitions == 0`). También calcula el factor de facilidad promedio.

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

**🎯 Resultado esperado :**

```python
>>> deck = build_sample_deck()
>>> stats = deck_stats(deck)
>>> stats
{'total': 6, 'mastered': 0, 'learning': 0, 'new': 6, 'due': 6, 'avg_ease': 2.5}
```

Después de una sesión de estudio, los números cambian, dominadas y en aprendizaje suben, nuevas bajan, pendientes caen.

**🩹 Si sale mal :** Si `due` siempre es 0 después de estudiar, `get_due_cards` compara cadenas en lugar de datetimes, asegúrate de llamar `datetime.fromisoformat()` sobre la cadena `next_review`. Si `avg_ease` es incorrecto, estás dividiendo por el conteo equivocado, usa `len(cards)`, no `sum(...)`.

### 5.2 Muestra estadísticas como una barra de progreso

**👟 Pista inicial :** Usa un carácter de bloque Unicode para dibujar una barra de progreso. Muestra los conteos de dominadas, en aprendizaje y nuevas junto a ella.

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

**🎯 Resultado esperado :**

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

Después de estudiar todas las tarjetas y calificar 4–5 en cada una, la barra de progreso se llena.

**🩹 Si sale mal :** Si la barra de progreso se desborda más de 30 caracteres, `filled` excede `bar_len`, agrega `min(filled, bar_len)` como un tope de seguridad. Si los porcentajes no suman, verifica que `mastered + learning + new == total`.

### 5.3 Verifica el seguimiento del progreso

**✅ Lista de verificación**

- ✅ `deck_stats` devuelve total, dominadas, en aprendizaje, nuevas, pendientes y avg_ease.
- ✅ `show_stats` imprime un resumen formateado con una barra de progreso.
- ✅ Los mazos vacíos no se bloquean, muestran todo en ceros.
- ✅ Después de una sesión de estudio, las estadísticas reflejan los estados actualizados de las tarjetas.

**🤔 Pregunta(s) socrática(s)**

¿Por qué SM-2 define "dominado" como `repetitions >= 3` en lugar de un número mayor? ¿Qué le pasaría a tu programa de revisiones si subieras el estándar a 5?

---

## Paso 6: Guarda y carga

Tu progreso desaparece cuando cierras el programa. Arrégialo escribiendo el mazo en un archivo JSON en el disco y cargándolo de vuelta al iniciar.

### 6.1 Guarda el mazo en JSON

**👟 Pista inicial :** Usa `json.dump` para escribir el dict del mazo en un archivo. Usa `indent=2` para una salida legible. Los objetos `datetime` ya se almacenan como cadenas ISO, así que se serializan sin problemas.

```python
import json
from pathlib import Path

def save_deck(deck: dict, filename: str = "deck.json") -> None:
    with open(filename, "w") as f:
        json.dump(deck, f, indent=2)
    print(f"Saved {len(deck['cards'])} cards to {filename}")
```

**🎯 Resultado esperado :**

```python
>>> deck = build_sample_deck()
>>> save_deck(deck)
Saved 6 cards to deck.json
```

El archivo `deck.json` ahora contiene el mazo completo como JSON legible.

**🩹 Si sale mal :** Si obtienes `TypeError: Object of type datetime is not JSON serializable`, almacenaste un objeto `datetime` directamente en lugar de llamar `.isoformat()`, vuelve a `create_card` y asegúrate de que la marca de tiempo es una cadena. Si el archivo está vacío, lo abriste con el modo `"w"` (que trunca) antes de llamar `json.dump`.

### 6.2 Carga el mazo desde JSON

**👟 Pista inicial :** Usa `json.load` para leer el archivo de vuelta. Maneja el caso en que el archivo no existe, empieza con un mazo vacío en ese caso.

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

**🎯 Resultado esperado :** En la primera ejecución (sin archivo): `No saved deck found, starting fresh.` En las ejecuciones siguientes: `Loaded 6 cards from deck.json`.

**🩹 Si sale mal :** Si obtienes `FileNotFoundError`, no estás verificando `path.exists()` antes de abrir. Si el mazo cargado tiene `None` para `cards`, el archivo JSON está malformado, ábrelo en un editor de texto para revisarlo.

### 6.3 Verifica la persistencia

**✅ Lista de verificación**

- ✅ Después de guardar, `deck.json` existe y contiene JSON válido con todos los campos de las tarjetas.
- ✅ Después de cargar, el mazo tiene las mismas tarjetas, etiquetas y estado SM-2.
- ✅ La ausencia del archivo JSON no bloquea, empieza con un mazo vacío.
- ✅ El archivo guardado es legible para humanos con `indent=2`.

**🤔 Pregunta(s) socrática(s)**

¿Qué pasa si editas `deck.json` a mano e introduces un error tipográfico en el campo `ease_factor`? ¿Cómo agregarías validación al cargar para detectar datos corruptos?

---

## Paso 7: Pule la CLI

Une todo en un menú interactivo. El usuario elige acciones de una lista numerada, la entrada se valida y la experiencia se siente completa.

### 7.1 Construye el menú principal

**👟 Pista inicial :** Escribe una función `main()` que cargue el mazo al inicio, haga un bucle con un menú y guarde después de cada cambio. Usa un bucle `while True` que se rompa con la opción de "salir".

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

**🎯 Resultado esperado :** Ejecutar `main()` muestra un menú numerado, realiza la acción seleccionada y regresa al menú. El mazo se guarda automáticamente después de estudiar o agregar tarjetas.

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

**🩹 Si sale mal :** Si obtienes `UnboundLocalError`, la variable `deck` no está definida antes del bucle `while True`, asegúrate de que `deck = load_deck()` corre primero. Si las tarjetas no se guardan después de estudiar, olvidaste `save_deck(deck)` dentro de la rama `"1"`.

### 7.2 Agrega retroalimentación a color

**👟 Pista inicial :** Usa códigos de escape ANSI para los colores del terminal. Envuelve la retroalimentación correcta/incorrecta en verde/rojo. No se necesitan bibliotecas externas.

```python
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def coloured(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"
```

**🎯 Resultado esperado :** Después de calificar una tarjeta, la retroalimentación aparece a color, verde para calificaciones altas (4–5), amarillo para medianas (3), rojo para bajas (0–2).

**🩹 Si sale mal :** Si ves códigos de escape crudos como `[92m` en lugar de colores, la mayoría de los terminales modernos soportan códigos ANSI, pero el Símbolo del sistema de Windows puede necesitar `os.system("")` llamado una vez al inicio para habilitarlos.

### 7.3 Verifica la aplicación completa

**✅ Lista de verificación**

- ✅ El menú muestra seis opciones y acepta entrada sin bloquearse.
- ✅ "Study" ejecuta una sesión de estudio con actualizaciones SM-2 y guarda el mazo.
- ✅ "View all cards" lista cada tarjeta con frente, reverso y etiquetas.
- ✅ "Add a card" valida que el frente/reverso no estén vacíos y guarda de inmediato.
- ✅ "Show progress" muestra estadísticas y una barra de progreso.
- ✅ "Save deck" escribe en `deck.json` y confirma.
- ✅ "Quit" guarda y sale limpiamente.
- ✅ La entrada inválida imprime un error y regresa al menú.

---

## ⚠️ Errores comunes

- **Olvidar guardar después de los cambios.** Si estudias tarjetas pero no llamas a `save_deck`, todas las actualizaciones SM-2 se pierden al salir. Siempre guarda justo después de una operación que cambie datos.
- **Comparación de cadenas para fechas.** Comparar cadenas de fechas ISO lexicográficamente funciona para el formato `YYYY-MM-DD`, pero `datetime.fromisoformat()` es más seguro para cálculos como "¿esta tarjeta está para revisión?"
- **Mutar la lista predeterminada.** Si `get_due_cards` modifica la lista `cards` del mazo en lugar de filtrar en una lista nueva, eliminarás tarjetas del mazo. Siempre crea una copia filtrada.
- **Factor de facilidad por debajo de 1.3.** El algoritmo SM-2 puede empujar el `ease_factor` por debajo de 1.3 con calificaciones muy bajas. El tope `max(1.3, ...)` evita que los intervalos se encojan para siempre.
- **Sobrescribir el JSON al cargar.** `load_deck` debería *leer* el archivo, no escribir en él. Un desliz común es importar la función equivocada o llamar a `save` dentro de `load`.

## 🧩 Desafíos

¿Listo para ir más lejos? Prueba estos:

1. **Filtrado por etiqueta**, Agrega un comando para estudiar solo tarjetas con una etiqueta específica. Filtra `get_due_cards` verificando si la etiqueta está en `card["tags"]`.

2. **Importación/exportación de mazos**, Permite a los usuarios exportar un mazo como un archivo de texto plano (una tarjeta por línea, formato front|back) e importarlo de vuelta. Esto hace que los mazos se puedan compartir sin JSON.

3. **Historial de sesiones**, Rastrea cuántas tarjetas revisaste cada día, tu calificación promedio y tu precisión. Guarda el historial en un archivo JSON separado y muestra un resumen semanal.

## Lo que aprendiste

- **Modelado de datos basado en diccionarios**, Representaste tarjetas y mazos como dicts de Python simples con nombres de campo claros y valores por defecto.
- **Repetición espaciada SM-2**, Implementaste el algoritmo que ajusta los intervalos de revisión según qué tan bien conoces cada tarjeta.
- **Interacción con el usuario**, Construiste una sesión de estudio con volteo para revelar, validación de entrada y calificaciones de calidad.
- **Seguimiento del progreso**, Calculaste estadísticas de dominio y visualizaste el progreso con una barra de progreso en la terminal.
- **Persistencia JSON**, Guardaste y cargaste datos del mazo entre sesiones usando `json.dump` y `json.load`.
- **Diseño de CLI**, Construiste una interfaz guiada por menú con validación de entrada, retroalimentación a color y guardado automático.

Ahora tienes una aplicación de tarjetas de estudio completamente funcional. La arquitectura basada en diccionarios hace que sea fácil de extender, agrega imágenes almacenando URLs en un campo `"image"`, implementa cajas Leitner agregando un campo `"box"`, o construye un sistema de mazos compartidos leyendo JSON desde una URL.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓