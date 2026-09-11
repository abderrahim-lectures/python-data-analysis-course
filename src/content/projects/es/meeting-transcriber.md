---
title: "Transcriptor y Resumidor de Reuniones"
description: "Convierte una transcripción cruda de reunión en un informe estructurado — quién dijo qué, las decisiones y una lista limpia de elementos de acción con responsables — con cero toma de notas manual."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["cli", "text-processing", "csv", "regex"]
learningObjectives:
  - "Parsear una transcripción con timestamps en turnos de hablante estructurados"
  - "Segmentar y contar hablantes para detectar dominancia y silencio"
  - "Extraer elementos de acción con nombres de responsables vía reglas de palabras clave"
  - "Ensamblar un informe resumido comprimido y compartirlo como archivo"
prerequisites: ["python-101/strings", "python-101/file-io", "python-101/loops", "python-101/functions"]
---

# 🎙️ Construye un Transcriptor y Resumidor de Reuniones

Cada reunión termina igual: alguien se ofrece a escribir las notas, olvida quién era responsable de qué, y los elementos de acción se evaporan para el lunes. Este proyecto construye la mitad resumidora de una canalización real de reuniones — toma una *transcripción* de reunión (el texto que produce tu herramienta de voz a texto) y la convierte en el informe que los humanos realmente quieren: un desglose de hablantes que muestra quién dominó, cada decisión que se tomó, y una lista por persona de elementos de acción extraídos automáticamente de los verbos y nombres de responsables en la transcripción.

Esto asume Python 101 — cadenas, I/O de archivos, bucles y funciones. Nada más allá de eso: sin ML, sin procesamiento de audio, sin APIs externas para la canalización central (el reconocimiento de voz real necesita una llave, y hay un paso opcional para eso). Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Definir un formato de archivo de transcripción (timestamp, hablante, turno) y parsear cada línea en un turno estructurado.
2. Agrupar los turnos por hablante y calcular la participación de cada persona en el tiempo de habla.
3. Encontrar las decisiones — oraciones que concluyen con verbos como "agreed", "decided", "confirmed".
4. Extraer los elementos de acción — "X will do Y" — con el nombre del responsable emparejado a cada tarea.
5. Ensamblar todo en un archivo de resumen legible y apuntar la herramienta a actas de reunión reales.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal aquí — la canalización es puro procesamiento de texto sobre un archivo que controlas, así que todo el bucle "deja caer una transcripción, obtén `summary.txt`" es un hábito de terminal, y el CSV que generas es un archivo que puedes abrir en cualquier hoja de cálculo.

**GitHub Codespaces** funciona de forma idéntica: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y los comandos exactos de abajo corren en una pestaña del navegador con Node, Python y `uv` preinstalados.

**Google Colab, Kaggle Notebooks y Binder son una opción genuinamente buena para cada paso de abajo** — no hay secretos, ni GPU, y toda la canalización son unas pocas celdas corriendo sobre la transcripción de muestra incluida en el curso (que es una reunión realista escrita a mano). La salvedad honesta: el notebook usa esa transcripción de ejemplo fija en lugar de audio que grabes. El reconocimiento de voz real necesitaría una llave de API gratuita, y esa parte la cubre un paso opcional — para *el resumidor en sí*, un notebook lo ejecuta de verdad.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-transcriber/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-transcriber/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeeting-transcriber%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de transcribir una sola palabra: `uv` y una transcripción de muestra realista para masticar.

### Instala `uv` y prepara el andamiaje

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
mkdir meeting-transcriber && cd meeting-transcriber
uv init --bare
```

Cero paquetes extra — este proyecto es pura biblioteca estándar.

### Escribe una transcripción de muestra realista

Pega esto en `transcript.txt` (cada línea: `[MM:SS] Speaker: words` — el formato que exportan la mayoría de las herramientas de transcripción, y fácil de leer a mano):

```
[00:00] Priya: Let's review where we stand on the launch.
[00:08] Tom: Design shipped the landing page yesterday.
[00:15] Priya: Great. We agreed the beta opens next Monday.
[00:22] Tom: I'll block out Thursday to prep the demo video.
[00:30] Zara: I will draft the onboarding email today.
[00:38] Priya: Please send it to me for a quick pass.
[00:44] Tom: We decided the pricing page stays as-is.
[00:52] Zara: So action items: Tom owns the video, I own the email.
[01:00] Priya: And I'll publish the changelog on Friday. Meeting's at 30 minutes? No sooner.
[01:06] Zara: Wait, that's not a decision.
```

Ejecuta:

```bash
wc -l transcript.txt
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `transcript.txt` existe con 11 líneas, cada una comenzando con un timestamp `[MM:SS]`.
- ✅ Puedes detectar los verbos de decisión (`agreed`, `decided`) y los verbos de responsabilidad (`will`, `owns`, `publish`) ya — esas son las palabras que el extractor aprenderá a capturar.

## Paso 1: Parsear la transcripción en turnos

La transcripción es una lista plana de líneas; el resumen necesita una lista *estructurada* de turnos — cada uno con un timestamp, un hablante y las palabras. Parsear está a un `split()` honesto de distancia: el timestamp y el hablante son prefijos de ancho casi fijo, y el mensaje es todo lo que sigue al tercer dos puntos.

### 1.1 Escribe el parser de turnos

```python
# parse.py
from pathlib import Path

def parse_line(line: str) -> dict:
    line = line.strip()
    time_s = line.split("]")[0].lstrip("[")
    rest = line.split("]", 1)[1].strip()
    speaker, _, message = rest.partition(":")
    return {"time": time_s, "speaker": speaker.strip(), "text": message.strip()}

def load_transcript(path: str) -> list[dict]:
    turns = []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if line.strip():
            turns.append(parse_line(line))
    return turns

if __name__ == "__main__":
    for t in load_transcript("transcript.txt")[:3]:
        print(t)
```

`partition(":")` divide en el *primer* dos puntos y devuelve una tupla de tres `(before, ":", after)` — más segura que `split(":")` porque el texto de un hablante puede contener en sí mismo dos puntos (mira la línea 11: "Wait, that's not a decision." con un apóstrofe, e imagina una URL o una hora como `01:06` en el mensaje). El `.split("]", 1)[1]` desenreda el timestamp de la misma manera: todo lo que sigue a la *primera* `]`, incluso si el mensaje contiene corchetes.

**👟 Pista inicial :** Parsear el archivo e imprime los primeros tres turnos *antes* de escribir cualquier otra cosa — el objetivo es ver `Speaker: Priya` y `text: Let's review...` como campos limpios, no prefijos destrozados.

**🎯 Resultado esperado :** Tres dicts como `{'time': '00:00', 'speaker': 'Priya', 'text': "Let's review where we stand on the launch."}` — sin que `[` o `]` se filtren en el campo de tiempo.

**🩹 Si sale mal :** Si `speaker` sale como `Priya` con un espacio inicial, falta el `.strip()` después de `partition`. Si se dispara `ValueError: not enough values to unpack`, a una línea le falta un `:` — lo cual es una transcripción genuinamente malformada, y el arreglo es decidir si saltar las líneas malas o lanzar; nuestro `strip()`+filtro salta líneas en blanco, no malformadas.

### 1.2 Verifica el parser

**✅ Lista de verificación**

- ✅ `load_transcript` devuelve 11 turnos para `transcript.txt`, cada uno un dict con `time`, `speaker` y `text`.
- ✅ Un turno cuyo mensaje contiene un dos puntos (p. ej. una URL) aún se parsea con el mensaje completo intacto.
- ✅ Las líneas solo de espacios en blanco nunca crean turnos vacíos.
- ✅ Puedes predecir qué devuelve `parse_line("[05:00] Sam: A: B")` — y hay solo una respuesta correcta para `speaker`.

**🤔 Pregunta(s) socrática(s)**

- Dividimos el timestamp con `split("]", 1)`. ¿Qué se rompería para un mensaje como `[00:30] Zara: the link is [here]` — y es `partition` en el *timestamp* una opción más robusta?
- El parser asume timestamps `[MM:SS]`. Si una transcripción usara `00:04:32` (tiempos de reloj reales), ¿qué campo cambiaría de forma silenciosamente — y debería el parser *validar* el formato de tiempo, o mantenerse débilmente tipado?

## Paso 2: Segmenta los hablantes y cuenta el tiempo de habla

Una transcripción tiene dos dimensiones: quién lo dijo, y cuánto dijo. Este paso agrega los turnos en totales por hablante — palabras por hablante, turnos por hablante — los números que muestran al instante si una sola voz se comió la reunión. El patrón es `Counter`/agrupar por llave, la misma forma que "agrupar ventas por región", aplicada al tiempo de habla.

### 2.1 Agrega estadísticas por hablante

```python
# segments.py
from collections import Counter
from parse import load_transcript

def speaker_stats(turns: list[dict]) -> dict[str, dict]:
    stats = {}
    for t in turns:
        s = t["speaker"]
        row = stats.setdefault(s, {"words": 0, "turns": 0})
        row["words"] += len(t["text"].split())
        row["turns"] += 1
    return stats

def word_share(stats: dict[str, dict]) -> dict[str, float]:
    total = sum(r["words"] for r in stats.values()) or 1
    return {s: r["words"] / total for s, r in stats.items()}

if __name__ == "__main__":
    turns = load_transcript("transcript.txt")
    stats = speaker_stats(turns)
    for s, r in sorted(stats.items()):
        print(f"{s:<6} {r['words']:>3} words  {r['turns']} turns  {word_share(stats)[s]:.0%}")
```

`stats.setdefault(s, {...})` devuelve la fila existente si el hablante ya se vio, o inserta una nueva puesta a cero y la devuelve — el modismo "construye un dict de filas" que mantiene la mutación en una línea. Las palabras se cuentan con `t["text"].split()`, los turnos con un conteo simple, y `word_share` normaliza en un porcentaje robusto ante una reunión vacía gracias al guard `or 1`.

**👟 Pista inicial :** Ejecuta las estadísticas, luego cuenta a mano las palabras de Priya en la transcripción y confirma que el número coincide — la protección contra "confiar en la herramienta" es "ya contaste una vez".

**🎯 Resultado esperado :** Tres líneas como `Priya  41 words  5 turns  43%`, `Tom  30 words  3 turns  ...%`, `Zara  ...  ...  ...%` cuyas participaciones suman 100%.

**🩹 Si sale mal :** Si un hablante falta por completo, sus turnos se parsearon bajo un nombre distinto (espacio final — revisa el `.strip()` en el hablante del Paso 1). Si las participaciones suman 99% o 101%, eso es redondeo de float, no un bug — muestra con `:.0%` o normaliza una vez; si una participación imprime como `nan%`, golpeaste el borde de `total = 0` y el guard `or 1` no está en su lugar.

### 2.2 Verifica la segmentación

**✅ Lista de verificación**

- ✅ Cada hablante distinto de la transcripción tiene exactamente una fila — las menciones dobles del mismo día se deduplican en un solo conteo acumulado.
- ✅ Un hablante con cero palabras (si existe) muestra `0 words`, `0%` — nunca una fila faltante.
- ✅ Tu total de palabras contado a mano para todo el archivo coincide con la suma de las filas.

**🤔 Pregunta(s) socrática(s)**

- La participación por palabras es una métrica de *cantidad*: la persona que más habla tiene la sala. ¿Qué necesitaría un análisis de "¿Priya dominó o solo hizo preguntas?" que las palabras solas no pueden decir — pistas: promedio de longitud de *turno* por palabra, conteos de preguntas y la proporción de enunciados frente a líneas de entrega como "Please send it to me"?
- Agrupamos por la cadena exacta del hablante; `Priya` y `priya` serían dos personas. ¿Dónde está el punto de normalización correcto — en el momento de parseo, en el de agregación, o nunca — y qué dice la elección sobre la herramienta que estás construyendo?

## Paso 3: Encuentra las decisiones

Los resúmenes que listan "cosas que pasaron" se olvidan; los resúmenes que listan **decisiones** son el registro. Este paso escanea la transcripción por el lenguaje de lo definitivo — verbos como `agreed`, `decided`, `confirmed`, `decided` — y extrae la oración completa como una decisión. Basado en reglas y superficial, pero es exactamente cómo se comporta la primera pasada de un bot resumidor.

### 3.1 Escanea verbos de decisión

```python
# decide.py
from parse import load_transcript

DECIDE_VERBS = ("agreed", "decided", "confirmed", "voted", "ruled", "settled")

def find_decisions(turns: list[dict]) -> list[str]:
    decisions = []
    for t in turns:
        for verb in DECIDE_VERBS:
            if verb in t["text"].lower():
                decisions.append(f"{t['time']} {t['speaker']}: {t['text']}")
                break
    return decisions

if __name__ == "__main__":
    for d in find_decisions(load_transcript("transcript.txt")):
        print(d)
```

El nido de dos bucles (turnos × verbos) es lo bastante pequeño para mantenerse honesto con O(n·m); el `lower()` garantiza que `agreed` coincida con `Agreed`, y el `break` asegura un verbo por turno — una línea que dice tanto "agreed" como "confirmed" cuenta una vez. Una decisión se renderiza con su `time` y `speaker` adjuntos, así que el resumen mantiene la procedencia ("at 00:15 Priya decided…") en lugar de una cláusula desnuda.

**👟 Pista inicial :** Ejecútalo, luego revisa la salida contra el archivo — estás verificando que "We agreed the beta opens next Monday" *y* "We decided the pricing page stays as-is" aparecen ambos, y que la línea 9 de Zara (`will draft`) NO — "redactar" es una acción, no una decisión, y esa distinción es todo el punto de este paso.

**🎯 Resultado esperado :** Dos líneas — el turno de las `00:15` "beta opens next Monday" y el de las `00:44` "pricing page stays as-is" — y nada de las líneas 3, 6 o 9.

**🩹 Si sale mal :** Si solo aparece una decisión, se perdió un verbo porque la transcripción usó un sinónimo (`agree` en lugar de `agreed`) — o expande la tupla o ponlo en minúsculas *y* reduce a la raíz (prueba `startswith` en una raíz de verbo) consistentemente. Si se incluye `[00:08] Tom: Design shipped...`, la palabra "decided" aparece dentro de una oración regular ("We decided...") — eso es un verdadero positivo aquí, pero un verbo `shipped` *futuro* sería un falso positivo que tu tupla tiene que evitar nombrando palabras exactas.

### 3.2 Verifica las decisiones

**✅ Lista de verificación**

- ✅ Las dos decisiones reales de la muestra aparecen con timestamp y hablante.
- ✅ Ninguna línea de acción "I will draft..." o "I'll block out..." se clasifica mal como decisión.
- ✅ Un turno que no menciona *ningún* verbo de decisión no contribuye nada a la lista.
- ✅ Puedes explicar la línea deliberada entre "agreed" (decisión) y "will draft" (acción).

**🤔 Pregunta(s) socrática(s)**

- Nuestra lista de verbos es una tupla fija, así que una decisión redactada como "Priya: so the beta is a go" (sin verbo de decisión en absoluto) se cuela. ¿Cuál es una *segunda* señal independiente — un signo de interrogación, un "right?", un "yes" de canal de vuelta — que podría marcarla, y qué falsos positivos añade?
- `agreed` dentro de "I agreed with you earlier that the design was rough" contextualmente *no* es una decisión, y sin embargo nuestro escaneo lo reporta. ¿Es un falso negativo de "no decisions reported" siempre aceptable, y dónde trazarías la línea de precisión/recuperación para un bot de notas (pista: hoy, prefiere muchos verdaderos positivos sobre un ocasional falso)?

## Paso 4: Extrae los elementos de acción con responsables

Las decisiones dicen qué cambió; los elementos de acción dicen *quién hace qué y para cuándo* — y son la parte que la gente realmente vive. El patrón de extracción: un responsable aparece como un nombre inmediatamente seguido (dentro de unas pocas palabras) por un verbo en futuro (`will`, `owns`, `publish`). Esto es un proxy superficial y explicable de lo que un transformer haría por atención — y para un bot de notas, lo explicable vence a lo mágico.

### 4.1 Extrae pares responsable + tarea

```python
# actions.py
from parse import load_transcript

ACTORS = ("Priya", "Tom", "Zara")
TASK_WORDS = ("will", "owns", "draft", "send", "block", "publish", "write", "set")

def extract_actions(turns: list[dict]) -> list[dict]:
    actions = []
    for t in turns:
        lowered = t["text"].lower()
        for actor in ACTORS:
            if actor.lower() not in lowered:
                continue
            for word in TASK_WORDS:
                if word in lowered:
                    actions.append({"time": t["time"], "owner": actor, "task": t["text"]})
                    break
    return actions

if __name__ == "__main__":
    for a in extract_actions(load_transcript("transcript.txt")):
        print(f"{a['time']}  {a['owner']} -> {a['task']}")
```

De nuevo dos bucles anidados, pero el *orden de las guardas* importa: revisar `actor` primero y hacer `continue` salta un turno entero si no menciona a una persona conocida — ese es todo el filtro de "responsabilidad". El `break` después de la primera palabra de tarea mantiene una línea en una sola acción incluso cuando dice "will draft the video and then send the email". El texto de la tarea es el *turno completo* (conservas la oración para contexto); una herramienta más sofisticada cortaría exactamente la subcadena — anota eso como una simplificación deliberada.

**👟 Pista inicial :** Ejecútalo y luego marca a mano las acciones reales: Tom → video, Zara → email, Priya → changelog. La salida debería nombrar a cada responsable y el turno correcto — y la línea 6 "send it to me" *no* debería robarse la acción de Tom.

**🎯 Resultado esperado :** Tres turnos completos, cada uno etiquetado con un responsable: `Tom -> I'll block out Thursday to prep the demo video`, `Zara -> I will draft the onboarding email today`, `Priya -> And I'll publish the changelog on Friday` — en orden de transcripción.

**🩹 Si sale mal :** Si falta la línea "publish" de Priya, su nombre no está en `ACTORS` o 'publish' no está en `TASK_WORDS` — ambos son datos que controlas; agrega nombres y verbos, y prefiere volver a ejecutar sobre "ajustar el modelo". Si la línea de Tom aparece con responsable `Zara`, el texto del turno menciona a Zara (línea 8: "Zara, Tom owns the video") *y* a Tom — una ambigüedad genuina, resuelta por ahora por el *primer* actor encontrado, y digna de tu comentario `TODO`, no de un hack.

### 4.2 Verifica las acciones

**✅ Lista de verificación**

- ✅ Cada una de las tres acciones reales aparece una vez, con el responsable y el texto de turno correctos.
- ✅ "send it to me" (una petición) no se extrae como elemento de acción para Tom ni Zara.
- ✅ Un hablante sin verbos de acción (un turno puramente conversacional) no contribuye nada.
- ✅ Puedes articular por qué "el responsable aparece en el mismo turno que una palabra de tarea" es un proxy, no la verdad.

**🤔 Pregunta(s) socrática(s)**

- El responsable es quienquiera que *nombre* aparezca en un turno — pero en "Zara, Tom will own the video", el responsable (Tom) y la persona a quien se habla (Zara) difieren. ¿Qué datos te permitirían desambiguar — el orden de palabras, la proximidad al *verbo*, o la posición de sujeto — y cuál es la señal más barata?
- "I will publish the changelog on Friday" asigna al *hablante*; "Tom will publish the changelog" asigna a *otro*. Nuestro extractor trata ambos como "mención = responsable". ¿Qué cambiaría una revisión `speaker == owner` sobre la confianza en la lista de acciones — y es la regla de hablante-primero un buen valor por defecto para notas de reunión?

## Paso 5: Compón el resumen y entrégalo

Todo lo anterior produce fragmentos; el resumen es el producto. El Paso 5 ensambla las estadísticas de hablantes, las decisiones y las acciones en un archivo legible — la cosa que de hecho pegarías en el chat grupal después de una reunión — y lo guarda para que cualquiera pueda abrirlo.

### 5.1 Ensambla y escribe el informe

```python
# summary.py
from pathlib import Path
from parse import load_transcript
from segments import speaker_stats, word_share
from decide import find_decisions
from actions import extract_actions

def build_summary(turns: list[dict]) -> str:
    stats = speaker_stats(turns)
    lines = [f"MEETING SUMMARY — {len(turns)} turns",
             "\nSpeakers by share:",
             *[f"  {s}: {r['words']} words ({word_share(stats)[s]:.0%})"
               for s, r in sorted(stats.items(), key=lambda kv: -kv[1]['words'])],
             "\nDecisions:", *[f"  [{d}]" for d in find_decisions(turns)],
             "\nAction items:", *[f"  [{a['time']}] {a['owner']}: {a['task']}"
                                  for a in extract_actions(turns)]]
    return "\n".join(lines)

if __name__ == "__main__":
    turns = load_transcript("transcript.txt")
    Path("summary.txt").write_text(build_summary(turns), encoding="utf-8")
    print(build_summary(turns))
```

Componer un informe a partir de sub-resultados es la etapa de "ensamblaje" y el hábito que llevas a cualquier herramienta más grande: cada paso anterior sigue siendo una pequeña función pura, y `build_summary` solo las *compone* — así que el resumen no puede saber más que las partes, y una parte que se comporta mal es una función que probar. Ordenar a los hablantes por palabras descendentes (`key=lambda kv: -kv[1]['words']`) pone la voz dominante primero, que por sí mismo es un hallazgo.

**👟 Pista inicial :** Escribe `summary.txt`, luego ábrelo en un editor de texto y léelo como si te hubieras perdido toda la reunión — tu estándar de "funciona" es que un desconocido podría reconstruir la reunión desde este archivo solo.

**🎯 Resultado esperado :** `summary.txt` conteniendo el encabezado con el conteo de turnos, los tres hablantes con totales de palabras y participaciones, ambas decisiones, y tres elementos de acción bajo encabezados claros — legible de arriba a abajo sin artefactos de Python.

**🩹 Si sale mal :** Si el archivo escribe secciones vacías, una sub-función devolvió `[]` — verifica que los pasos anteriores aún corran desde `__main__` *antes* de componer (un import roto reenvía `None` silenciosamente). Si la salida tiene fragmentos `None`, un f-string golpeó un retorno `None` — cada sub-función debe devolver una lista/cadena, no None; ejecuta el propio `__main__` de cada paso para aislar.

### 5.2 Verifica el resumen entregado

**✅ Lista de verificación**

- ✅ `summary.txt` existe y contiene las cuatro secciones bajo sus encabezados.
- ✅ El contenido de cada sección coincide con lo que imprimieron los pasos individuales — nada añadido, nada omitido.
- ✅ Un desconocido podría reconstruir los hablantes, decisiones y responsables de la reunión solo desde el archivo.
- ✅ Volver a ejecutar el build desde una transcripción *diferente* reproduce la misma canalización limpiamente.

**🤔 Pregunta(s) socrática(s)**

- El resumen compone *fragmentos* terminados. ¿Qué cambiaría si las estadísticas de hablantes tuvieran que mostrarse distinto en el resumen que en el Paso 2 (digamos, ¿minutos en lugar de palabras)? ¿Es el trabajo de `build_summary` *reformatear* o *transportar* — y qué dice eso sobre dónde debería vivir la lógica de presentación?
- `summary.txt` es una instantánea. ¿Cuál es el cambio que lo convierte en algo que *volverías a ejecutar después de cada reunión* en lugar de un one-off (pista: una bandera `--from` y un esquema de nombres de carpeta `meetings/`)? Nombra la decisión de configuración antes de escribirla.

## ⚠️ Errores comunes

- **Dos puntos dentro de los mensajes rompen el parseo.** "The demo link: http://..." contiene genuinamente un dos puntos, y `split(":")` en la línea completa separa el nombre del hablante *y* el mensaje. `partition(":")` después de despellejar el timestamp es el arreglo — divide solo en el *primer* dos puntos, nunca en todos.
- **La deriva de la cadena del hablante produce personas fantasma.** `Priya` vs `Priya ` (espacio final) o `priya` vs `Priya` crean dos filas en el Paso 2 y dos responsables en el Paso 4. Normaliza los nombres exactos una vez, en el momento de parseo, y deja que cada paso posterior confíe en la cadena.
- **Tiempo de habla medido en palabras vs. turnos.** La participación por palabras trata un monólogo de 40 palabras y 5 interjecciones cortas como hablantes iguales. Ambas estadísticas existen; presentar *cualquiera* sola enmarca la reunión silenciosamente — el resumen debería mostrar palabras y turnos, y dejar que la dominancia sea una lectura, no un assert.
- **Confusión decisión/acción.** "We decided the beta opens Monday" es una decisión; "I'll block Thursday" es una acción. Exactamente una herramienta aprueba si se fusionan, porque los responsables no significan nada para las decisiones y las secuencias de verbos engañan para las acciones — mantén los dos escáneres separados, como hacen los Pasos 3 y 4.
- **Escribir un resumen que nadie puede auditar.** Un resumen sin timestamps ni hablantes es opinión; con ellos es un registro. Cada viñeta que emite nuestro informe lleva `[time]` y un nombre — omítelos y construiste una herramienta que parafrasea en lugar de documentar.

## Lo que acabas de construir

Un resumidor de reuniones funcional: transcripción adentro, un `summary.txt` legible afuera — hablantes clasificados por participación, ambas decisiones extraídas con procedencia, y tres elementos de acción cada uno adjunto a un responsable real. La habilidad transferible es todo el hábito de *canalización de texto*: parsear en turnos estructurados, agregar y agrupar, reconocer patrones con reglas, y luego componer un informe — el mismo esqueleto que impulsa el triage de correo, el enrutamiento de tickets de soporte, la minería de logs y (con un modelo más pesado en medio) cada "resumidor" de LLM en el que hayas pegado alguna vez una grabación de llamada. El tuyo es transparente, probado línea por línea, y no necesita ninguna llave de API para ganarse el sustento.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/meeting-transcriber/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-transcriber) en el repo del curso agrupa los módulos de parser, segmentos, decisiones, acciones y resumen, además de la transcripción de muestra y un notebook que ejecuta cada paso en orden. Clónalo, o abre el repo completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y construye un resumen en una pestaña del navegador.
:::

## A dónde ir desde aquí

- **Reconocimiento de voz real (opcional).** Si tienes una llave de API de nivel gratuito para un servicio de transcripción (o la propia herramienta whisper de tu portátil), cambia `load_transcript` por una llamada a subprocess que tome un `.m4a` y emita SRT — cada paso posterior ya corre sobre esa salida.
- **Exportar a CSV.** `csv.writer` convierte los elementos de acción en filas (`owner, task, time`) que puedes ordenar por responsable o importar a un rastreador de tareas — el resumen sigue siendo legible para humanos, el CSV se vuelve legible para máquinas, y son dos vistas de un mismo parseo.
- **Un filtro `--speaker Sam`** que resume los turnos de una sola persona — misma canalización, un argumento de filtro, instantáneamente útil para "¿a qué me comprometí *yo*?"
- **Extracción más pesada vía un LLM (opcional).** Alimenta los turnos parseados a un modelo de nivel gratuito con un prompt de sistema como "return JSON of decisions and actions" — el extractor basado en reglas se mantiene como respaldo offline, el LLM se vuelve la línea base, y *medirás* dónde uno supera al otro.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estés orgulloso — un resumen que capturó una reunión real, una lista de acciones que realmente usaste? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README te guía por el proceso de añadir el tuyo vía un **pull request** de principio a fin: fork, rama, commit y apertura del PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓