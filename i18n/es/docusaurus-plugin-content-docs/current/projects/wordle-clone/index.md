---
id: wordle-clone
title: "Construye un Clon de Wordle"
sidebar_label: "Clon de Wordle"
slug: /projects/wordle-clone
description: "Construye un juego de Wordle real de terminal desde cero: retroalimentación correcta de verde/amarillo/gris por intento (incluyendo el clásico error de letras repetidas), una lista de palabras personalizada, y seguimiento de estadísticas persistente entre sesiones."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Clon de Wordle

<ProjectPublishedDate projectId="2027-wordle-clone" />

<ProjectGreeting />

Este proyecto solo asume lo básico a nivel de Python 101 — funciones, listas, diccionarios, bucles, leer y escribir un archivo. Sin pandas, sin clave de API, sin GPU, sin servicio externo de ningún tipo — solo una terminal, una lista de palabras, y algo de lógica que es más difícil de hacer bien de lo que parece. Eso lo convierte en un excelente Proyecto del Mundo Real *más temprano* para intentar, incluso antes de algunos de los orientados a pandas o a IA: todo lo que necesitas es material que Python 101 ya te dio, aplicado a algo genuinamente divertido de jugar después.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Implementar la lógica central de retroalimentación de intentos — comparar un intento con la palabra objetivo y producir marcas verdes/amarillas/grises por letra, manejando correctamente las letras repetidas (el clásico error de lógica de Wordle).
2. Construir un bucle de juego interactivo respaldado por una lista de palabras real, dándole al jugador 6 intentos.
3. Validar los intentos contra la lista de palabras y dar retroalimentación clara cuando un intento es rechazado.
4. Añadir seguimiento de estadísticas persistente — tasa de victorias, racha actual, y una distribución de número de intentos — guardado en un archivo JSON local para que sobreviva entre ejecuciones.

## Dónde ejecutar esto

- **Localmente con `uv` (recomendado).** Este proyecto no necesita nada más allá de la biblioteca estándar más una pequeña biblioteca de colores de terminal — un buen candidato para instalar Python de verdad en tu propia máquina. La sección Configuración de abajo lo explica paso a paso, y los Pasos 1–4 siguen este camino.
- **GitHub Codespaces.** Abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) para un entorno de desarrollo en la nube con Node, Python y `uv` ya instalados (consulta [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)) — los mismos comandos de abajo funcionan desde una pestaña del navegador, sin instalación local en absoluto.
- **Google Colab, Kaggle Notebooks, o Binder.** Este proyecto necesita cero dependencias externas, lo que lo hace un ajuste excelente para notebook en un sentido — pero el prompt `input()` de un notebook es un poco diferente de una terminal interactiva real: sin tiles de colores redibujados en su lugar en una sola línea, y (en Colab/Kaggle) los archivos locales de una sesión no sobreviven de forma fiable entre visitas separadas, lo que va en contra de la parte "las estadísticas persisten entre sesiones" de este proyecto. [`notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb) sigue siendo una versión real y jugable — vale la pena probarla — solo ten en cuenta que la experiencia completa (tiles de colores en la terminal, estadísticas que persisten entre días separados de juego) es realmente algo de "ejecútalo localmente".

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwordle-clone%2Fnotebook.ipynb)

  {/* Badges point at this PR's branch; will point at `main` once merged. */}

## Configuración

`uv` es una sola herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego confirma que se instaló:

```bash
uv --version
```

Luego configura el proyecto:

```bash
uv init wordle-clone
cd wordle-clone
uv add rich
```

`rich` es la única dependencia de terceros que necesita todo este proyecto, y se usa puramente para la salida de colores en la terminal (tiles verdes/amarillos/grises) — cada parte de la lógica de juego real de abajo es Python de biblioteca estándar puro. Sin clave de API, sin registro, nada que configurar antes de poder ejecutar una sola línea de código.

## Paso 1: Puntúa un intento contra la palabra objetivo

Empieza con la pieza que es fácil de dejar *casi* bien y satisfactoria de dejar *realmente* bien: dado un intento de 5 letras y una palabra objetivo de 5 letras, produce una marca por letra — verde si esa letra está en la posición correcta, amarilla si está en la palabra pero en la posición equivocada, gris en caso contrario.

Un primer intento tiende a verse así, revisando cada letra adivinada de forma independiente:

```python
# A tempting first version — has a bug, keep reading
def score_guess_naive(guess: str, target: str) -> list[str]:
    marks = []
    for i, letter in enumerate(guess):
        if letter == target[i]:
            marks.append("G")
        elif letter in target:
            marks.append("Y")
        else:
            marks.append("X")
    return marks
```

Pruébalo con `guess = "SPEED"`, `target = "ERASE"`. La palabra objetivo tiene exactamente **una** `E`. La versión ingenua revisa cada letra adivinada contra la cadena objetivo completa de forma independiente — así que *ambas* `E`s en `SPEED` se revisan contra `"E" in target`, que es `True` las dos veces, y ambas se marcan amarillas. Eso está mal: el Wordle real nunca otorgaría dos `E`s amarillas en un intento cuando la palabra objetivo solo contiene una `E` — una `E` adivinada merece una marca, la otra no tiene una letra coincidente restante que justifique una.

La solución es un algoritmo de dos pasadas:

```python
from collections import Counter

WORD_LENGTH = 5

def score_guess(guess: str, target: str) -> list[str]:
    guess, target = guess.upper(), target.upper()
    marks = ["X"] * WORD_LENGTH

    # Pass 1: greens, and tally which target letters are still "available"
    # (i.e. not already accounted for by a green) for the yellow pass.
    remaining = Counter()
    for i, (g, t) in enumerate(zip(guess, target)):
        if g == t:
            marks[i] = "G"
        else:
            remaining[t] += 1

    # Pass 2: yellows, consuming from that same pool of remaining letters
    # so a letter can never be flagged more times than it truly occurs.
    for i, g in enumerate(guess):
        if marks[i] == "G":
            continue
        if remaining[g] > 0:
            marks[i] = "Y"
            remaining[g] -= 1
        # else stays "X"

    return marks
```

La Pasada 1 marca cada coincidencia de posición exacta en verde, y por separado cuenta (en `remaining`) cuántas copias de cada letra del objetivo *no verde* siguen "en juego". La Pasada 2 luego recorre el intento de nuevo: cualquier letra que no esté ya en verde solo recibe una marca amarilla si `remaining` todavía tiene una copia sin reclamar de ella — y reclamar una decrementa el conteo, así que una segunda copia adivinada de la misma letra no recibirá también un amarillo a menos que el objetivo genuinamente tenga una segunda copia también.

Ejecútalo en el caso delicado:

```python
print(score_guess("SPEED", "ERASE"))  # ['Y', 'X', 'Y', 'Y', 'X']
```

Una `E` (posición 0) es amarilla, la otra (posición 3) también es amarilla porque `ERASE` realmente tiene dos `E`s — pero un intento como `"ELITE"` contra una palabra objetivo con solo una `E` le daría correctamente a la *segunda* `E` un gris, no un amarillo.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`score_guess("CRANE", "CRANE")` returns all greens.</StepChecklistItem>
<StepChecklistItem>`score_guess("SPEED", "ERASE")` returns exactly two yellow `E`s, not more.</StepChecklistItem>
<StepChecklistItem>A guess and target that share zero letters returns all grays.</StepChecklistItem>
<StepChecklistItem>You've tried a case where the *guess* repeats a letter but the target only has one copy, and confirmed only one mark comes back non-gray.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

Prueba el objetivo `"LLAMA"` y el intento `"ALLOY"` a mano antes de ejecutar el código: `LLAMA` tiene dos `L`s y dos `A`s. Recorre tú mismo ambas pasadas — ¿qué letras terminan en verde, cuáles en amarillo, y cuáles en gris? Luego compara tu respuesta contra `score_guess`. Si te equivocaste en papel, ¿dónde exactamente divergió tu modelo mental del algoritmo de dos pasadas?

## Paso 2: Construye el bucle del juego

Con el puntaje sólido, envuélvelo en un juego real: elige un objetivo aleatorio de una lista de palabras, dale al jugador 6 intentos, y detente en cuanto tenga las cinco verdes.

```python
import random

MAX_GUESSES = 6

def load_words(path="words.txt") -> list[str]:
    with open(path) as f:
        return [w.strip().upper() for w in f if w.strip()]

def play_round(words: list[str]) -> tuple[bool, int]:
    target = random.choice(words)
    for attempt in range(1, MAX_GUESSES + 1):
        guess = input(f"Guess {attempt}/{MAX_GUESSES}: ").strip().upper()
        marks = score_guess(guess, target)
        print(" ".join(f"{l}:{m}" for l, m in zip(guess, marks)))
        if all(m == "G" for m in marks):
            print(f"You got it in {attempt}!")
            return True, attempt
    print(f"Out of guesses. The word was {target}.")
    return False, MAX_GUESSES
```

`words.txt` es un archivo de texto plano, una palabra por línea — el ejemplo real incluye una lista de unas 540 palabras comunes en inglés de 5 letras exactamente para este propósito. Una *lista* de palabras como esta (solo hechos sobre qué cadenas son palabras en inglés, sin expresión creativa) está bien para usar y redistribuir libremente, a diferencia de copiar, digamos, las definiciones reales de un diccionario.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Each round picks a genuinely random target from the word list (print it temporarily to confirm, then remove the print — no spoilers once you trust it).</StepChecklistItem>
<StepChecklistItem>The loop stops immediately once all five marks are green, even before 6 guesses are used.</StepChecklistItem>
<StepChecklistItem>After exactly 6 wrong guesses, the loop ends and reveals the target.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

Si `random.choice(words)` se llama una vez por ronda desde dentro de `play_round`, y llamas a `play_round` en un bucle para dejar que alguien juegue de nuevo, ¿el objetivo realmente cambiará entre rondas? ¿Qué pasaría si accidentalmente computaras `target` una vez *fuera* del bucle en su lugar?

## Paso 3: Valida los intentos contra la lista de palabras

El Wordle real no te deja adivinar `"ZZZZZ"` — todo intento tiene que ser una palabra real de su diccionario. Añade esa verificación antes de puntuar:

```python
def read_guess(word_set: set[str]) -> str:
    while True:
        raw = input(f"Guess ({WORD_LENGTH} letters): ").strip().upper()
        if len(raw) != WORD_LENGTH or not raw.isalpha():
            print(f"  Please enter exactly {WORD_LENGTH} letters.")
            continue
        if raw not in word_set:
            print(f"  '{raw}' isn't in the word list — try a real word.")
            continue
        return raw
```

Usar un `set` aquí en lugar de verificar `raw in words` contra la lista directamente importa más de lo que parece: las verificaciones de membresía de una lista escanean cada entrada una por una, mientras que una verificación de set es casi instantánea sin importar cuántas palabras contenga — un hábito pequeño pero genuinamente bueno para cualquier verificación de "¿está este valor en una colección grande?".

:::tip[Rechaza la entrada mala temprano, no a mitad del juego]
Validar la *forma* del intento (5 letras, alfabético) antes de verificar la lista de palabras atrapa los errores de tipeo más comunes con la verificación más barata primero — no tiene sentido buscar `"crane5"` en un set de 540 palabras cuando una verificación de `len()` y `.isalpha()` ya te dice que está malformado.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Guessing a non-word (e.g. `"ZZZZZ"`) prints a clear rejection message and re-prompts, without consuming one of the 6 tries.</StepChecklistItem>
<StepChecklistItem>Guessing something that isn't 5 letters (too short, too long, contains a digit) is also rejected before it ever reaches the word-list check.</StepChecklistItem>
<StepChecklistItem>A valid, in-list guess is accepted immediately, lowercase or uppercase.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

¿Por qué es importante que `read_guess` vuelva a preguntar sobre un intento malo *dentro de su propio bucle*, en lugar de devolver algún valor centinela como `None` para que el llamador (`play_round`) lo maneje? ¿Qué saldría mal con el conteo de intentos del Paso 2 si se permitiera que un intento inválido consumiera uno de los 6 intentos?

## Paso 4: Añade seguimiento de estadísticas persistente

La última pieza: recuerda cómo le ha ido al jugador, entre ejecuciones separadas del programa, no solo dentro de una sesión. Eso significa escribir a un archivo en disco.

```python
import json
from pathlib import Path

STATS_FILE = Path("stats.json")

DEFAULT_STATS = {
    "played": 0,
    "wins": 0,
    "current_streak": 0,
    "max_streak": 0,
    "guess_distribution": {str(n): 0 for n in range(1, MAX_GUESSES + 1)},
}

def load_stats() -> dict:
    if not STATS_FILE.exists():
        return json.loads(json.dumps(DEFAULT_STATS))  # a fresh copy
    with STATS_FILE.open() as f:
        return json.load(f)

def save_stats(stats: dict) -> None:
    with STATS_FILE.open("w") as f:
        json.dump(stats, f, indent=2)

def record_result(stats: dict, won: bool, guesses_used: int) -> dict:
    stats["played"] += 1
    if won:
        stats["wins"] += 1
        stats["current_streak"] += 1
        stats["max_streak"] = max(stats["max_streak"], stats["current_streak"])
        stats["guess_distribution"][str(guesses_used)] += 1
    else:
        stats["current_streak"] = 0
    return stats
```

`load_stats` maneja la primera ejecución con elegancia — no existe archivo todavía, así que devuelve un conjunto nuevo de valores por defecto en cero en lugar de fallar por un archivo faltante. Cada otra ejecución carga lo que se guardó la última vez. `record_result` solo añade a `guess_distribution` en una victoria — una derrota no tiene un valor significativo de "intentos usados para ganar", igual que la propia pantalla de estadísticas del Wordle real.

El bucle completo del juego lo une todo: carga las estadísticas una vez al inicio, actualízalas y guárdalas después de cada ronda.

```python
words = load_words()
stats = load_stats()

while True:
    won, attempts = play_round(words)
    stats = record_result(stats, won, attempts)
    save_stats(stats)
    print(f"Played: {stats['played']}  Win rate: {stats['wins']/stats['played']:.0%}  "
          f"Streak: {stats['current_streak']}")
    if input("Play again? [y/N] ").strip().lower() != "y":
        break
```

:::tip[Guarda después de cada ronda, no solo al salir]
Llamar a `save_stats(stats)` justo después de `record_result`, cada ronda, significa que un programa interrumpido (terminal cerrada, `Ctrl+C`, fallo) como mucho solo pierde el resultado de la ronda *actual* — nunca el progreso de toda la sesión. Guardar solo una vez al final del programa tiraría todo si el jugador sale a mitad de sesión en lugar de salir por el prompt de "¿jugar de nuevo?".
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Quitting the program and restarting it shows the same `played`/`wins`/streak numbers as before you quit, loaded from `stats.json`.</StepChecklistItem>
<StepChecklistItem>Winning in, say, 3 guesses increments `guess_distribution["3"]` specifically, not some other key.</StepChecklistItem>
<StepChecklistItem>Losing a round resets `current_streak` to 0 but does not touch `guess_distribution` or `max_streak`.</StepChecklistItem>
<StepChecklistItem>Deleting `stats.json` and rerunning the program doesn't crash — it starts a fresh, zeroed stats file instead.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

`max_streak` se computa como `max(stats["max_streak"], stats["current_streak"])` después de cada victoria, en lugar de solo actualizarse cuando el *juego* termina. ¿Por qué actualizarlo después de cada victoria (en lugar de intentar computarlo luego desde el historial) rastrea correctamente la mejor racha alcanzada, incluso si el jugador está todavía en su mejor racha ahora mismo y aún no ha perdido?

## ⚠️ Errores comunes

- **El error de letras repetidas (Paso 1).** Con mucho el error más común: verificar `letter in target` de forma independiente para cada letra adivinada, sin rastrear qué copias de una letra repetida ya han sido "reclamadas". Esto otorga de más marcas amarillas siempre que el intento o la palabra objetivo repiten una letra. Usa siempre el enfoque de dos pasadas que consume copias — primero los verdes, luego los amarillos contra un grupo de letras objetivo *restantes*.
- **Intentos que no son palabras reales.** Sin validar contra una lista de palabras (Paso 3), los jugadores pueden adivinar `"AEIOU"` o cualquier otra no palabra puramente para sondear qué letras están en la palabra objetivo — una estrategia que el Wordle real bloquea explícitamente al exigir que todo intento sea una palabra del diccionario.
- **Sensibilidad a mayúsculas.** `"crane" == "CRANE"` es `False` en Python. Normaliza todo intento y objetivo al mismo caso (este proyecto usa `.upper()` en todo) en el momento en que entran a tu código, o las comparaciones fallarán silenciosamente para intentos perfectamente válidos.
- **Perder las estadísticas en un fallo.** Solo escribir `stats.json` una vez al salir del programa significa que cualquier fallo, `Ctrl+C`, o terminal cerrada pierde el progreso de toda esa sesión. Guarda después de cada ronda en su lugar (consulta el consejo en el Paso 4).
- **Un archivo de estadísticas de una versión anterior de tu código.** Si añades un nuevo campo a `DEFAULT_STATS` más tarde, `load_stats` como está escrito arriba cargará felizmente un `stats.json` *viejo* al que le falta ese campo, y luego fallará la primera vez que tu código intente leerlo. Vale la pena manejarlo de forma defensiva (consulta cómo `examples/wordle-clone/stats.py` fusiona los datos cargados sobre una copia nueva de los valores por defecto) si planeas seguir ajustando el esquema de estadísticas.

## Lo que acabas de construir

Un clon de Wordle real: lógica correcta de retroalimentación de intentos (incluyendo el caso límite de letras repetidas que tropieza a muchos primeros intentos), un bucle de juego interactivo respaldado por una lista de palabras real con validación adecuada de intentos, y estadísticas que genuinamente persisten entre ejecuciones separadas del programa — no solo dentro de una sesión. Nada de eso necesitó nada más allá de la biblioteca estándar y una pequeña biblioteca de colores, lo que vale la pena notar: un proyecto puede ser sustancial y genuinamente divertido sin necesitar una clave de API, un framework, o un servicio en la nube.

:::tip[Verifica la lógica delicada con casos de prueba, no solo probando jugando]
Es fácil jugar unas rondas, ver una salida de aspecto razonable, y asumir que la lógica de puntuación es correcta — pero el error de letras repetidas específicamente solo aparece en intentos o palabras objetivo con letras repetidas, que no saldrán en cada ronda que casualmente juegues a mano. Escribir un puñado de casos de prueba explícitos (como el ejemplo `SPEED`/`ERASE` del Paso 1) que apunten específicamente a ese caso límite atrapa errores que las pruebas de juego casuales pueden perder por completo.
:::

## A dónde ir desde aquí

- **Modo difícil.** El modo difícil del Wordle real requiere que todo intento posterior reutilice cualquier verde/amarillo ya revelado — hacer cumplir eso significa rastrear las restricciones conocidas entre intentos dentro de una ronda, no solo puntuar un intento de forma aislada.
- **Un sistema de pistas.** Revela la posición correcta de una letra aleatoria no adivinada bajo petición, a costa de que cuente contra el total de intentos del jugador (o algún otro compromiso que diseñes).
- **Multijugador o una palabra diaria compartida.** El Wordle real famosamente les da a todos la misma palabra cada día. Derivar el objetivo de hoy de forma determinista desde la fecha (ej. hashear la cadena de la fecha para elegir un índice en la lista de palabras) dejaría que cada jugador viera la misma palabra sin un servidor — un buen ejercicio pequeño de aleatoriedad determinista.
- **Un solucionador simple, como meta adicional.** Dadas las marcas devueltas hasta ahora, filtra la lista de palabras a solo las palabras que siguen siendo consistentes con cada restricción revelada — una inversión divertida de la lógica del juego que acabas de escribir, y un buen ejercicio del mismo razonamiento de letras repetidas del Paso 1, aplicado en la dirección opuesta.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2027-wordle-clone" />
