---
title: "Analizador de Podcasts"
description: "Transcribe, resume y extrae ideas de episodios de podcasts con detección de temas."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["cli", "text-processing", "csv", "regex"]
learningObjectives:
  - "Analizar una transcripción de pódcast con marcas de tiempo en turnos de hablante"
  - "Separar presentadores de invitados comparando nombres de hablantes contra un registro"
  - "Puntuar una transcripción contra conjuntos de palabras clave temáticas con Counter"
  - "Redactar una ficha del episodio y exportarla como CSV"
prerequisites: ["python-101/strings", "python-101/file-io", "python-101/sets", "python-101/functions"]
---

# 🎧 Construye un Analizador de Podcasts

Los podcasts producen horas de audio y casi ninguna estructura. Ya seas un fan decidiendo qué episodio saltarse o un show runner que quiere una lectura de datos sobre sus propios episodios, el artefacto útil es el mismo: una *ficha técnica* del episodio, quiénes fueron los invitados, qué temas dominaron realmente la conversación y qué frases se repitieron. Este proyecto construye un CLI que produce esa ficha a partir de una transcripción: analiza los turnos de los hablantes, separa presentadores de invitados, puntúa las palabras contra conjuntos de palabras clave por tema y escribe un resumen de un archivo más un CSV legible por máquina. Sin audio, sin ML, sin claves de API.

Esto asume Python 101, cadenas, conjuntos, E/S de archivos y funciones. Nada más allá de eso. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Analizar una transcripción `[marca de tiempo] Hablante: palabras` en turnos estructurados.
2. Separar presentadores de invitados usando un roster de presentadores conocido, y detectar nombres que no están en él.
3. Contar el peso de mención de cada tema puntuando la transcripción contra conjuntos de palabras clave.
4. Extraer la participación de cada invitado en la conversación y las palabras clave principales del episodio.
5. Escribir un `episode_notes.txt` legible y un `topics.csv` que puedas abrir en cualquier hoja de cálculo.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal, es procesamiento de texto puro sobre un archivo de transcripción que controlas, así que el bucle "deja una transcripción, obtén dos archivos de salida" es un hábito de terminal, y el CSV aterriza como un archivo real.

**GitHub Codespaces** funciona de forma idéntica: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y los mismos comandos se ejecutan en una pestaña del navegador con Node, Python y `uv` preinstalados.

**Google Colab, Kaggle Notebooks y Binder ejecutan cada paso con honestidad**, sin GPU, sin secretos, sin archivos grandes, contra la transcripción de episodio de muestra incluida en el curso (una conversación falsa realista escrita a mano). La salvedad honesta: el notebook analiza la transcripción incluida en lugar de audio que tú grabes. El reconocimiento de voz real para tus propias grabaciones necesita una herramienta separada; todo lo *posterior* a la transcripción es exactamente lo que el notebook ejecuta de verdad.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/podcast-analyzer/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/podcast-analyzer/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpodcast-analyzer%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes del primer conteo de palabras: `uv`, un episodio de muestra y un roster de presentadores.

### Instala `uv` y crea el andamiaje

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego:

```bash
uv --version
mkdir podcast-analyzer && cd podcast-analyzer
uv init --bare
```

Cero paquetes extra, biblioteca estándar pura.

### Escribe un episodio de muestra

Guarda esto como `episode.txt`:

```
[00:00] Maya: Welcome back to The Indie Show, this episode is about scaling, sort of.
[00:14] Maya: Our guest today is Jonas, who built a tiny publishing tool into a real business.
[00:30] Jonas: Thanks, Maya. Let's be honest, the scaling story is mostly boring — paying down tech debt.
[00:52] Jonas: The interesting part is pricing. We raised prices three times in two years.
[01:10] Maya: Pricing feels like the hardest lever. What about marketing?
[01:22] Jonas: Marketing is a distribution problem. SEO and word of mouth, mostly word of mouth.
[01:40] Maya: Let's talk about remote work culture on a small team.
[01:55] Jonas: Remote culture is trust, honestly. You either have it or you're doing it wrong.
[02:10] Maya: One last thing — taking breaks and managing burnout in an early startup.
[02:24] Jonas: Burnout is real. Rest is not a reward, it's a requirement.
[02:38] Maya: That's the episode. Jonas, thank you for your time.
[02:47] Jonas: Thank you. Keep shipping. That's it, that's the whole trick.
```

Guarda `hosts.txt` con un nombre de presentador por línea:

```
Maya
```

Escribe `topics.py` (los conjuntos de palabras clave, etiquetas de tema contra sus palabras de activación):

```python
# topics.py
TOPICS = {
    "pricing": ["price", "pricing", "revenue", "money"],
    "marketing": ["marketing", "seo", "word of mouth", "growth"],
    "culture": ["culture", "remote", "trust", "team"],
    "wellness": ["burnout", "rest", "breaks", "stress"],
}
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `episode.txt` existe (12 turnos), `hosts.txt` contiene solo `Maya`, y `topics.py` define cuatro conjuntos de temas.
- ✅ Ya puedes adivinar el resultado: `pricing` y `wellness` deberían pasar de largo a `culture`, y la herramienta te lo dirá pronto.

## Paso 1: Analiza la transcripción del episodio

Misma forma que cualquier herramienta de reuniones, con un giro: las transcripciones de podcasts llevan un archivo de *roster de presentadores*, y el analizador debe conservar cada nombre de hablante intacto porque la división presentador/invitado del Paso 2 depende de la igualdad exacta de cadenas de nombres.

### 1.1 Escribe el analizador de turnos

```python
# parse.py
from pathlib import Path

def parse_line(line: str) -> dict:
    line = line.strip()
    time_s = line.split("]", 1)[0].lstrip("[")
    rest = line.split("]", 1)[1].strip()
    speaker, _, text = rest.partition(":")
    return {"time": time_s, "speaker": speaker.strip(), "text": text.strip()}

def load_episode(path: str) -> list[dict]:
    return [parse_line(l) for l in Path(path).read_text().splitlines() if l.strip()]

def load_hosts(path: str) -> set[str]:
    return {l.strip().lower() for l in Path(path).read_text().splitlines() if l.strip()}

if __name__ == "__main__":
    turns = load_episode("episode.txt")
    print(len(turns), "turns")
    print(load_hosts("hosts.txt"))
```

`partition(":")` vuelve a hacer el trabajo pesado, los dos puntos separan al hablante del discurso, y los dos puntos *dentro* del mensaje (imagina `01:40`, o un título como `The Scraper: Part Two`) se quedan en su sitio. `load_hosts` pasa inmediatamente a minúsculas el roster en un `set`, así que la prueba de pertenencia del Paso 2 es un `in` de tiempo constante contra un nombre en minúsculas *canónico*, un "mAYA" mal escrito en el roster pondría silenciosamente al presentador en la lista de invitados para siempre.

**👟 Pista inicial :** Analiza primero, imprime `turns[1]` y *mira* la forma antes de cualquier análisis, `speaker: 'Maya'`, `text: 'Our guest today is Jonas…'`, sin corchetes, sin dos puntos.

**🎯 Resultado esperado :** `12 turns`, y el conjunto de presentadores imprime `{'maya'}` para `hosts.txt`. El primer turno de muestra es un dict limpio con las tres claves.

**🩹 Si sale mal :** Si `speaker` aún tiene un espacio inicial, falta el `.strip()` después de `partition`. Si se dispara un `ValueError` con el mensaje `not enough values to unpack`, existe una línea sin dos puntos en absoluto, las transcripciones de entrevistas a veces cortan un turno por la mitad; saltar y avisar gana a bloquearse, pero decide *cuál* antes de añadir un décimo archivo.

### 1.2 Verifica el análisis

**✅ Lista de verificación**

- ✅ `load_episode` devuelve 12 dicts con `time`, `speaker` y `text`.
- ✅ `load_hosts` devuelve un `set` en minúsculas, `{'maya'}`, no `{'Maya'}`.
- ✅ Un turno cuyo mensaje contiene dos puntos sigue conservando el mensaje completo.
- ✅ Las líneas en blanco nunca se convierten en turnos vacíos, y el roster no tiene artefactos de espacios en blanco.

**🤔 Pregunta(s) socrática(s)**

- El roster pasa a minúsculas en un set, pero las cadenas *speaker* de la transcripción siguen en mayúsculas/minúsculas mixtas. Si una línea de invitado dice `[01:10] maya: ...` (en minúsculas por una mala transcripción), ¿qué paso se rompe silenciosamente más tarde, y qué arreglaría un `speaker.lower()` en el momento del análisis?
- Tratamos `[00:14]` como una marca de tiempo de minuto:segundo solo para mostrar. Si quisieras calcular los minutos exactos de tiempo de habla por hablante (`00:47` menos `00:30`), ¿qué tendrías que cambiar sobre el tipo del campo `time`, y qué análisis forzaría eso?

## Paso 2: Separa presentadores de invitados

El roster convierte la clasificación presentador/invitado en una prueba de pertenencia a un conjunto, `speaker.lower() in hosts`. Todo lo que no sea un presentador conocido es un invitado, y un *nombre que no aparece en ningún sitio* vale la pena marcarlo con fuerza, porque "alguien habló que no está en ninguna lista" es exactamente el dato que un título de episodio escrito a mano acierta mal.

### 2.1 Clasifica a cada hablante

```python
# roster.py
from parse import load_episode, load_hosts

def classify(episode: str, hosts_file: str) -> dict[str, dict]:
    hosts = load_hosts(hosts_file)
    people = {}
    for t in load_episode(episode):
        name = t["speaker"].lower()
        row = people.setdefault(name, {"speaker": t["speaker"], "role": None,
                                       "words": 0, "turns": 0})
        row["role"] = "host" if name in hosts else "guest"
        row["words"] += len(t["text"].split())
        row["turns"] += 1
    return people

if __name__ == "__main__":
    people = classify("episode.txt", "hosts.txt")
    for name, row in sorted(people.items()):
        print(f"{row['speaker']:<6} {row['role']:<6} {row['words']:>3} words  {row['turns']} turns")
```

El clasificador es un diccionario-de-filas que *mutas en el lugar*, `setdefault` crea la fila de cada hablante la primera vez que aparece su nombre, y luego cada turno posterior aumenta palabras y turnos. El rol se calcula *en cada turno* a partir de una comprobación viva `name in hosts`, así que un nombre que aparece en la transcripción antes de que cargue el roster (o con mayúsculas diferentes) sigue resolviéndose correctamente, y como el rol se decide por fila después de cargar y nunca se cachea, no hay nada de "era presentador cuando lo vi por primera vez".

**👟 Pista inicial :** Ejecuta la clasificación y echa un vistazo a la salida, Maya debería ser `host`, Jonas `guest`; luego borra temporalmente `Maya` de `hosts.txt` y vuelve a ejecutar. Tanto que sus dos turnos se vuelvan `guest` *como* que la lista de invitados ahora contenga a tu propio presentador es el fallo exacto contra el que una herramienta real se protegería.

**🎯 Resultado esperado :** `Maya  host   71 words  7 turns` y `Jonas  guest  57 words  5 turns`, dos filas, una por cada hablante distinto, cada una con un rol.

**🩹 Si sale mal :** Si ambas filas dicen `guest`, el roster no está cargando, comprueba que `hosts.txt` termina con un salto de línea y que la ruta del archivo coincide con `load_hosts`. Si un nombre se dividió en dos personas (`maya` y `Maya`), la normalización `speaker.strip()`/`.lower()` no se aplica en `classify`, cada lectura debe pasar por el mismo embudo antes de `setdefault`.

### 2.2 Verifica la división

**✅ Lista de verificación**

- ✅ Maya = presentador, Jonas = invitado, no aparece ninguna fila de tercera persona.
- ✅ Borrar un presentador de `hosts.txt` cambia inmediatamente su rol al re-ejecutar, la clasificación lee el roster fresco en cada ejecución.
- ✅ Dos turnos del mismo hablante se acumulan en una fila (`words` y `turns` crecen ambos).
- ✅ Puedes decir, en una frase, por qué `row["role"]` se recalcula por turno en lugar de fijarse una vez cuando se crea la fila.

**🤔 Pregunta(s) socrática(s)**

- Una transcripción de podcast cuyo presentador está *ausente del archivo de roster* convierte silenciosamente al presentador en invitado, cada ficha publicada listaría a tu propio presentador como invitado. ¿Cuál es la protección mínima que hace que la herramienta se niegue a producir una ficha hasta que cada hablante de la transcripción esté clasificado por nombre?
- Los presentadores se definen por un archivo; los invitados por sustracción. Invierte el modelo: ¿qué pasa con las líneas de "suplantación" como `[01:40] fake_maya: ...`, y qué modelo (permitir presentadores vs. denegar invitados) hace que la suplantación sea *visible* en lugar de absorbida?

## Paso 3: Puntúa los temas

Cada podcast es una conversación, pero "¿de qué trataba este episodio?" es un problema de conteo. Este paso puntúa toda la transcripción contra el conjunto de palabras clave de cada tema, cada vez que una palabra de pricing aparece en la transcripción, la puntuación de pricing crece. Es co-ocurrencia de palabras clave, deliberadamente superficial: exactamente lo que debería ser una primera pasada barata y transparente antes de meter algo más sofisticado.

### 3.1 Cuenta los aciertos de palabras clave de tema

```python
# topic_score.py
from collections import Counter
from parse import load_episode
from topics import TOPICS

def score_topics(episode: str) -> Counter:
    all_words = " ".join(t["text"] for t in load_episode(episode)).lower()
    scores = Counter()
    for topic, words in TOPICS.items():
        for w in words:
            scores[topic] += all_words.count(w)
    return scores

if __name__ == "__main__":
    for topic, score in score_topics("episode.txt").most_common():
        print(f"{topic:<10} {score}")
```

Dos bucles de profundidad, una fila de salida: `TOPICS` asigna una etiqueta a sus palabras de activación, y la ocurrencia literal de cada palabra se cuenta con `all_words.count(w)`. La ordenación es deliberada, `Counter` más `.most_common()` da una lista de temas ordenada sin código extra, así que "qué dominó el episodio" es literalmente el elemento en el índice cero.

**👟 Pista inicial :** Antes de ejecutar, cuenta `pricing` manualmente en `episode.txt` (deberías encontrar `price`, `pricing` ×2, menciones de `revenue` 0) y confirma que los totales impresos coinciden, confía en la herramienta, pero solo después de que la herramienta pase una verificación manual una vez.

**🎯 Resultado esperado :** Cuatro líneas ordenadas descendente, `pricing` y `wellness` arriba (cada una un puñado de aciertos), `culture` en el medio, `marketing` abajo, con los totales exactos coincidiendo con tu conteo manual de las palabras de activación.

**🩹 Si sale mal :** Si un tema puntúa 0 cuando no debería, su palabra de activación está mal escrita en `topics.py` o aparece con un prefijo (`pricing` coincide con `pricing` pero no con `priced`), `count()` es una coincidencia de subcadena literal, así que o añades la variante a `TOPICS` o aceptas la literalidad documentada. Si cada tema es enorme, una palabra de activación como `team` es una subcadena de `teams`, `steam`, etc., `count("team")` las cuenta todas; considera contar `word in wordlist` después de tokenizar en lugar de contar subcadenas de texto crudo.

### 3.2 Verifica la puntuación de temas

**✅ Lista de verificación**

- ✅ El orden clasificado coincide con tu conteo manual de las palabras de activación.
- ✅ La puntuación de cada tema iguala la suma de sus ocurrencias de palabras clave, puedes recalcular cada número a mano.
- ✅ Un tema sin palabras coincidentes puntúa 0 y *aún aparece* en la clasificación (presente-pero-cero gana a ausente-y-asumido).
- ✅ Puedes explicar el one-liner que convierte conteos crudos en una lista clasificada.

**🤔 Pregunta(s) socrática(s)**

- La puntuación usa conteo de subcadenas, así que un "pricing" *económico* y un "price" *emocional* oyen la misma palabra. ¿Cuál es el cambio, tokenizar en una lista de palabras y probar `w in words`, que impide que `priced` y `priceless` alimenten la puntuación, y qué te cuesta en simplicidad?
- Los cuatro temas en `TOPICS` los fija el archivo. ¿En qué episodio fallaría *honestamente* esta herramienta, p. ej., un episodio sobre "AI safety" con ninguno de tus cuatro, y qué te dice eso sobre los conjuntos de palabras clave frente a un modelo que pudiera etiquetar temas abiertos?

## Paso 4: Extrae la participación del invitado y las frases clave

Las dos columnas restantes de la ficha: cuánto *tiempo al aire* dominó cada hablante y qué *frases* se repiten, los hallazgos del "tú sigues diciendo X" que hacen memorable un episodio. La participación del invitado reutiliza la fila del roster del Paso 2; las frases clave son solo las palabras más comunes que *no* son relleno común del inglés.

### 4.1 Calcula la participación y las palabras clave principales

```python
# highlights.py
from collections import Counter
from roster import classify

STOP = {"the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
        "to", "of", "in", "on", "for", "with", "it", "that", "this", "you",
        "your", "i", "we", "us", "not", "so", "really", "just", "about"}

def guest_share(people: dict) -> list[tuple]:
    guests = [(r["speaker"], r["words"]) for r in people.values() if r["role"] == "guest"]
    total = sum(words for _, words in guests) or 1
    return [(name, words / total) for name, words in guests]

def top_words(episode: str, n: int = 6) -> list[tuple]:
    words = Counter()
    for t in load_episode(episode):
        words.update(w for w in t["text"].lower().split() if w not in STOP)
    return words.most_common(n)
```

`words.update(w for w in ...)` es todo el paso-antes-del-paso: `Counter.update` acepta un iterable y cuenta cada palabra que contiene, y el generador filtra las stopwords *en el momento de contar*, así que nunca llega relleno al contador. El conjunto de stopwords es paja de prosa seleccionada a mano; `guest_share` normaliza las palabras de cada invitado contra el total de la clase de invitados (`or 1` cubre un episodio solo de presentadores), así que los números siempre suman 100%.

**👟 Pista inicial :** Ejecuta `top_words` sobre el episodio y luego desplázate por el texto, cada palabra clave impresa debería ser una palabra de *contenido* a la que puedas apuntar ("pricing", "trust", "burnout"...), y `the`/`and` no deberían estar por ningún lado.

**🎯 Resultado esperado :** `guest_share` → Jonas `100%` (un invitado, se lleva todo el tiempo al aire de invitados); `top_words` → seis palabras de contenido como `pricing`, `trust`, `burnout`, `rest`, `marketing`, `culture`, sin stopwords, en frecuencia descendente.

**🩹 Si sale mal :** Si `top_words` se inunda de `the`, `and`, `really`, un token gramatical no está en `STOP`, añádelo; el conjunto es datos que mantienes tú. Si `guest_share` divide mal en un episodio de todos invitados, el acumulador contó solo `guests`, decide (e imprime) si el denominador son *todos* los hablantes o solo los invitados; para "tiempo al aire del invitado", los invitados es el denominador honesto.

### 4.2 Verifica los destacados

**✅ Lista de verificación**

- ✅ Cada palabra clave en `top_words` es una palabra de contenido que puedes localizar en la transcripción.
- ✅ `guest_share` suma 100% cuando hay al menos un invitado, y nada alarmante sin invitados.
- ✅ Añadir una palabra de relleno inventada a `STOP` la elimina de cada ejecución futura, el conjunto es una configuración viva, no un one-off.
- ✅ La clasificación de palabras clave cambia cuando añades una línea extra de `pricing`, el contador realmente se actualiza.

**🤔 Pregunta(s) socrática(s)**

- La lista de stopwords es *tu juicio* ("just", "really" son paja para ti). ¿Cuál es una frase que tu lista conservaría o descartaría erróneamente, y eso hace que la salida de "palabras clave" tenga sesgo? ¿Quién es dueño de ese sesgo?
- `guest_share` usa *palabras por invitado*, idéntico en espíritu al tiempo al aire de la herramienta de reuniones. ¿Cuál es la alternativa que podría querer un productor, turnos, la emisión más larga, o palabras por minuto, y cuál halagaría a un invitado que habla lento pero monopoliza?

## Paso 5: Compón la ficha y exporta

El análisis está hecho; el producto son dos archivos, un `episode_notes.txt` legible que un productor pega en las notas del programa, y un `topics.csv` que se lleva bien con cualquier hoja de cálculo para una comparación de toda una temporada. La composición es el mismo movimiento "ensamblar a partir de piezas ya probadas" que cada paso final anterior.

### 5.1 Escribe las dos salidas

```python
# publish.py
import csv
from collections import Counter
from parse import load_episode
from roster import classify
from topic_score import score_topics
from highlights import guest_share, top_words

def publish(episode: str, hosts_file: str) -> None:
    turns = load_episode(episode)
    people = classify(episode, hosts_file)
    topics = score_topics(episode)
    notes = [
        f"EPISODE FACT SHEET — {len(turns)} turns",
        "\nSpeakers:",
        *[f"  {r['speaker']} ({r['role']}, {r['words']} words)"
          for r in people.values()],
        "\nTopics (ranked):",
        *[f"  {t}: {s}" for t, s in topics.most_common()],
        "\nGuest airtime share:",
        *[f"  {n}: {p:.0%}" for n, p in guest_share(people)],
        "\nTop keywords: " + ", ".join(w for w, _ in top_words(episode)),
    ]
    open("episode_notes.txt", "w").write("\n".join(notes))
    with open("topics.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["topic", "word_hits"])
        w.writerows(topics.most_common())

if __name__ == "__main__":
    publish("episode.txt", "hosts.txt")
    print("wrote episode_notes.txt and topics.csv")
```

Dos formatos de salida, una fuente de números: los *mismos* resultados de funciones (`classify`, `score_topics`, ...) alimentan tanto el archivo humano como el CSV, así que una ficha que dice `pricing: 4` y una fila CSV que dice `pricing,4` nunca pueden discrepar. `csv.writer` maneja el entrecomillado por ti (un nombre de tema con coma, `"culture, remote"`, sobrevive como una celda), lo que un `",".join` ingenuo corrompería silenciosamente.

**👟 Pista inicial :** Escribe ambos archivos y luego *abre el CSV en una hoja de cálculo* (o `python -c "print(open('topics.csv').read())"`) y confirma dos columnas, cuatro filas, sin sorpresas de entrecomillado, la vista de hoja de cálculo es una comprobación real, no teatro.

**🎯 Resultado esperado :** `episode_notes.txt` conteniendo el encabezado, ambos hablantes con roles y conteos de palabras, temas ordenados, Jonas al `100%` y la lista de palabras clave, más `topics.csv` con un encabezado `topic,word_hits` y cuatro filas de datos que coinciden con la clasificación impresa línea por línea.

**🩹 Si sale mal :** Si las filas del CSV no coinciden con `episode_notes.txt`, las dos escrituras usaron llamadas *diferentes* (re-puntuado en algún lugar), ambas deben extraerse de la variable `topics` calculada una vez, arriba. Si una celda de tema llega entrecomillada contra tus deseos, eso es `csv` haciendo su trabajo (proteger comas); si una celda está *mal*, el `w.writerows` está escribiendo tuplas de `most_common()` cuyo orden deberías imprimir antes de confiar.

### 5.2 Verifica la publicación

**✅ Lista de verificación**

- ✅ Ambos archivos existen con números coincidentes, la ficha y el CSV coinciden en cada puntuación de tema.
- ✅ El CSV se abre como 5 filas × dos columnas en una hoja de cálculo, con `topic,word_hits` arriba.
- ✅ Regenerar un archivo borrado es un comando (`uv run python publish.py`), las salidas se derivan, nunca se mantienen a mano.
- ✅ Re-ejecutar contra un episodio diferente produciría un par de archivos diferente pero bien formateado.

**🤔 Pregunta(s) socrática(s)**

- `episode_notes.txt` y `topics.csv` presentan los mismos datos dos veces. ¿Es derrochadora la duplicación, o es la *característica* (un archivo para humanos, uno para máquinas)? Nombra un tercer consumidor (un script de comparación de temporada) y dime qué archivo debería leer.
- La columna "topic" es una etiqueta que elegiste; el CSV solo registra los aciertos. Si dos episodios diferentes tuvieran archivos `TOPICS` diferentes, los CSV no podrían compararse con seguridad de columnas. ¿Qué columna (pista: empieza por `episode`) haría el CSV comparable en toda una temporada?

## ⚠️ Errores comunes

- **Normalización de nombres sensible a mayúsculas.** La transcripción dice `Maya`, el roster dice `maya`, y el Paso 2 crea silenciosamente dos personas, una presentadora, una invitada, ambas reales. Pasar a minúsculas *en el momento del análisis* y de nuevo en la comprobación `name in hosts` del clasificador es el embudo; omite uno y un roster perfectamente limpio divide mal a sus propios presentadores.
- **El conteo de subcadenas infla las puntuaciones de tema.** `count("team")` encuentra el `team` dentro de `steam` y `teams`, así que `culture` puntúa sobre palabras que no tienen nada que ver. La solución barata es probar a nivel de token (`w in words`) en lugar de contar palabras; la *honesta* es documentar que el conteo de subcadenas es una primera pasada y leer la sección de errores antes de confiar en tendencias de toda una temporada.
- **Un archivo de roster que es el punto único de fallo.** Un error tipográfico (`Mayya`) hace que toda la ficha clasifique mal al presentador del programa como su propio invitado, y no se alerta nada. Protégete con una comprobación de completitud: antes de publicar, cada nombre de hablante de la transcripción debe resolverse como presentador o invitado, y los nombres desconocidos deben fallar en voz alta o al menos imprimir en voz alta.
- **La paja de stopwords arruinando las palabras clave.** Sin el filtro del conjunto `STOP`, "the", "and", "really" dominan la salida de "palabras clave principales" y la ficha lee como una velocidad de habla, no contenido. El conjunto es un archivo de configuración que debes mantener por programa, el "ratio" de un podcast de finanzas es el "bank" de otro, así que curitia o vigila que la lista no se desvíe.
- **Sorpresas de entrecomillado en CSV.** Un tema llamado `"culture, remote"` rompe la salida de un `",".join` hecho a mano en dos celdas. `csv.writer` existe precisamente para esto; úsalo, y nunca hagas CSV a mano con concatenación de cadenas, las reglas de escape son más sutiles de lo que parecen.

## Lo que acabas de construir

Un analizador de podcasts funcional: transcripción dentro, una ficha `episode_notes.txt` y un `topics.csv` fuera, presentadores e invitados separados, temas ordenados por peso de palabras clave, tiempo al aire del invitado cuantificado y palabras clave de contenido destiladas. Cada número es verificable de forma independiente a mano, porque todo el pipeline es análisis, pertenencia a conjuntos y `Counter`, sin caja negra en ningún sitio. La habilidad transferible es la idea de *co-ocurrencia de palabras clave*: "¿de qué trata este texto?" como un problema de conteo sobre un diccionario de etiquetas y activadores, la misma primitiva que está bajo el etiquetado de documentos, el filtrado de spam, los modeladores de temas y la primera etapa de la mayoría de los pipelines de análisis de contenido que encontrarás.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/podcast-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/podcast-analyzer) en el repositorio del curso agrupa los módulos de análisis, roster, puntuador, destacados y publicación más el episodio de muestra y un notebook que ejecuta cada paso en orden. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y produce una ficha en una pestaña del navegador.
:::

## A dónde ir desde aquí

- **Comparación de temporada:** recorre un `publish` sobre cada archivo de episodio, combina las filas de `topics.csv` por episodio en un CSV de temporada y ordena "esta temporada derivó de pricing a culture", la columna CSV añadida en la pregunta socrática del Paso 5 hecha real.
- **Palabras clave de bigramas:** reemplaza el conteo de una sola palabra por ventanas de dos palabras (`"remote culture"`, `"word of mouth"`), el mismo `Counter`, un nuevo paso de tokenizador, frases clave dramáticamente mejores.
- **Una bandera `--episode`** que selle el slug del episodio en el encabezado de notas y en el CSV, 10 líneas, e instantáneamente hace atribuible cada salida.
- **Enganche de transcripción (opcional):** si tienes una herramienta de voz-a-texto de nivel gratuito (whisper.cpp en tu portátil cuenta), un pequeño paso `subprocess` convierte primero un `.mp3` en este formato de transcripción, cada paso posterior al Paso 1 ya se ejecuta sobre su salida, sin cambios necesarios.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso, una ficha que clavó un episodio real, un CSV lleno de los datos de tu propio programa? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README recorre cómo agregar el tuyo vía un **pull request** de principio a fin: fork, rama, commit y abrir el PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
