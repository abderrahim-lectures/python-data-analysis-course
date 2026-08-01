---
id: study-buddy-agent
title: "Construye un Agente de Cuestionarios de Compañero de Estudio"
sidebar_label: "Agente de Cuestionarios de Compañero de Estudio"
slug: /projects/study-buddy-agent
description: "Pasa del playground dentro del navegador al Python real: construye una app de terminal que convierte tus propias notas de estudio en un cuestionario, usando un LLM de nivel gratuito para escribir las preguntas y juzgar tus respuestas."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Agente de Cuestionarios de Compañero de Estudio

<ProjectPublishedDate projectId="study-buddy-agent" />

<ProjectGreeting />

Todo en el curso hasta ahora corrió en un playground sandbox, dentro del navegador — para que pudieras empezar a escribir Python desde el día uno con cero configuración. Este proyecto es el paso de graduación: instala Python de verdad en tu propia máquina, y luego úsalo para construir una herramienta que podrías seguir usando de verdad para una clase completamente distinta — una app de cuestionario que lee tus propias notas de estudio, escribe preguntas fundamentadas en lo que realmente está en ellas (no trivia genérica), te examina una pregunta a la vez en la terminal, y tiene un modelo de lenguaje que juzga si tu respuesta escrita se acerca lo suficiente, con retroalimentación breve en cualquier caso.

Esto es opcional y no calificado — una buena opción una vez que hayas terminado Python 101; nada de Data Analysis es requerido. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Instalar `uv` y obtener una clave de API de LLM de nivel gratuito.
2. Cargar uno de tus propios archivos de notas y decidir cuánto de él darle al modelo como contexto.
3. Escribir un prompt que genere preguntas de cuestionario fundamentadas en ese texto específico, junto con una respuesta esperada que el programa mantiene en secreto.
4. Construir el bucle interactivo: hacer una pregunta, tomar tu respuesta escrita, hacer que el modelo la juzgue y dé retroalimentación.
5. Llevar un puntaje acumulado y reportarlo al final.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino que siguen los pasos de esta lección, y el recomendado — es Python real corriendo en tu propia máquina, el mismo movimiento de "gradúate a Python real" que cualquier otro proyecto de esta sección.

**GitHub Codespaces** es una alternativa de configuración cero si prefieres no instalar nada localmente todavía: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta exactamente los mismos comandos `uv` desde una terminal en tu pestaña del navegador.

**Google Colab, Kaggle Notebooks, o Binder** funcionan bien también — este proyecto es solo un script de terminal que llama a una API alojada, sin GPU ni paquete local pesado involucrado. Una versión lista para ejecutar en notebook vive en [`examples/study-buddy-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/study-buddy-agent/notebook.ipynb) — refleja la misma lógica de `generate_questions()` / `judge_answer()` / `run_quiz()`, usa `input()` en una celda de la misma manera que lo harías en una terminal, e incrusta uno de los archivos de notas de muestra directamente para que funcione sin necesidad de subir un archivo. Lánzala con uno de los badges de abajo:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/study-buddy-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/study-buddy-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fstudy-buddy-agent%2Fnotebook.ipynb)

Es una forma de menor fidelidad de vivir la experiencia que un proyecto local real (sin estructura de archivos real, sin archivos `.py` separados), pero es una manera razonable de probar la idea rápidamente.

## Configuración

Todo lo que necesitas antes del Paso 1 — instalar `uv`, crear el proyecto, y obtener una clave de API — vive aquí, todo por adelantado, para que los pasos de abajo puedan enfocarse puramente en la lógica del cuestionario.

### Instalar `uv`

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

### Crear el proyecto

```bash
uv init study-buddy-agent
cd study-buddy-agent
uv add openai python-dotenv
```

`uv init` crea un proyecto pequeño (un `pyproject.toml` que rastrea tus dependencias) y `uv add` instala paquetes en un entorno aislado para ese proyecto — sin configuración manual de entorno virtual. `openai` es la biblioteca cliente que esta lección usa (GitHub Models, el proveedor predeterminado sugerido abajo, expone una API compatible con OpenAI); `python-dotenv` te permite mantener tu clave de API en un archivo `.env` local en lugar de `export`-arla en cada sesión.

### Obtén una clave de API de IA gratuita

**Elige el proveedor que prefieras** — ninguno requiere tarjeta de crédito al momento de escribir esto, y este curso no favorece a uno sobre otro. El script de ejemplo en el repositorio del curso ([`examples/study-buddy-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/study-buddy-agent)) usa GitHub Models por defecto; cambiar a otro proveedor es un cambio pequeño y bien documentado.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(predeterminado sugerido)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el alcance `models: read` | Sin registro separado — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que los de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

Sea cual sea que elijas, el proceso es el mismo:

1. Inicia sesión y genera una clave de API en el sitio de ese proveedor.
2. **Nunca pegues esta clave directamente en el código ni la subas a un repositorio.** Ponla en un archivo `.env` en su lugar:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

`python-dotenv` lee este archivo hacia `os.environ` automáticamente, el mismo patrón usado a lo largo de los proyectos [de Agente de IA](/docs/projects/ai-agent) y [de App RAG](/docs/projects/rag-notes) si has hecho alguno de esos. Una clave de API es un secreto, exactamente como una contraseña — cualquiera que la tenga puede usar la cuota de tu cuenta.

:::tip[Un archivo `.env` es a menudo más conveniente que export]
En lugar de hacer `export` de una clave en cada nueva sesión de terminal, ponla en un archivo `.env` en tu carpeta de proyecto (ver el `.env.example` del ejemplo del repo) y cárgala con `load_dotenv()`, llamada una vez cerca de la parte superior de tu script.
:::

Con `uv`, `openai`, `python-dotenv`, y una clave en `.env`, la configuración está hecha — todo de aquí en adelante es lógica de cuestionario.

## Paso 1: Carga tus notas y elige una estrategia de contexto

Pon un archivo `.txt` o `.md` de tus propias notas de estudio en algún lugar de tu proyecto — una carpeta `notes/`, misma convención que el [proyecto RAG](/docs/projects/rag-notes), es un lugar razonable. Leerlo no es nada nuevo:

```python
from pathlib import Path

notes_text = Path("notes/cell-biology.txt").read_text(encoding="utf-8")
```

Aquí está la decisión de diseño que este proyecto te pide tomar explícitamente, en lugar de saltártela: **¿cuánto de tus notas debería ver el modelo realmente?**

- **Opción A — alimenta el archivo completo como contexto.** El enfoque más simple posible: lee un archivo, entrega su texto completo al modelo en el prompt, listo. Esto funciona genial siempre que un solo archivo quepa cómodamente en la ventana de contexto del modelo — unas pocas miles de palabras no es ningún problema para cualquier modelo gratuito moderno.
- **Opción B — fragmentar, incrustar y recuperar**, exactamente como hace el [proyecto RAG](/docs/projects/rag-notes): divide tus notas en piezas pequeñas, incrústalas localmente, y recupera solo las más relevantes para cada pregunta. Esto escala a una carpeta de notas con docenas de archivos largos que nunca cabrían en un solo prompt.

**Esta lección elige la Opción A** y es explícita sobre la compensación: es menos escalable, pero es una lección completa más simple de escribir, leer y depurar — sin modelo de embedding, sin búsqueda vectorial, sin paso separado de construcción de índice, solo una cadena. Esa compensación vale la pena nombrarla en voz alta, el mismo principio de fundamentación que el proyecto RAG de cualquier manera: una buena pregunta de cuestionario tiene que venir de texto que el modelo realmente recibió, no texto que está adivinando que podría ser relevante de los datos de entrenamiento. Si tus propias notas superan un solo archivo, no reinventes la recuperación — reutiliza `retrieve.py` del ejemplo del proyecto RAG y cambia el prompt del Paso 2 para usar fragmentos recuperados en lugar de un archivo completo.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Tienes una carpeta `notes/` con al menos un archivo `.txt`/`.md` real de tus propias notas de estudio en ella.</StepChecklistItem>
<StepChecklistItem>Leer el archivo e imprimir su longitud muestra un conteo de caracteres real, no `0` o un error.</StepChecklistItem>
<StepChecklistItem>Puedes explicar, en una oración, por qué esta lección alimenta el archivo completo al modelo en lugar de recuperar fragmentos.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si tu archivo de notas tuviera 50 páginas de largo en lugar de una página, ¿qué fallaría específicamente con la Opción A primero — un error, un prompt truncado, o algo más sutil como que el modelo solo usara realmente el principio del archivo?
- El paso de fragmentación del proyecto RAG existe para hacer que cada pieza incrustada sea *específica*. ¿Perder la fragmentación aquí pierde esa especificidad, o darle al modelo el archivo completo en realidad le da *más* con qué trabajar? ¿Bajo qué circunstancias sería correcta cada respuesta?

## Paso 2: Genera preguntas de cuestionario fundamentadas en tus notas

Pídele al modelo un número fijo de preguntas, cada una emparejada con una respuesta esperada — y sé explícito en el prompt de que ambas deben venir del texto específico que le estás entregando, no de conocimiento general sobre el tema:

```python
import json

GENERATE_PROMPT_TEMPLATE = """You are a study-buddy quiz generator. Read the
study notes below and write exactly {num_questions} quiz questions that can
ONLY be answered correctly by someone who has read THESE SPECIFIC notes --
not generic questions about the general subject. Base every question and
every expected answer strictly on facts stated in the text.

Reply with ONLY a JSON array, no other text, in this exact shape:
[
  {{"question": "...", "expected_answer": "..."}},
  ...
]

Study notes:
{notes_text}
"""

def generate_questions(notes_text: str, num_questions: int = 5) -> list[dict]:
    prompt = GENERATE_PROMPT_TEMPLATE.format(num_questions=num_questions, notes_text=notes_text)
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)
```

Dos detalles que vale la pena notar:

- **`expected_answer` se genera ahora, pero nunca se muestra al estudiante antes de que responda.** El programa lo mantiene en memoria (en el dict devuelto por `generate_questions`) puramente para que el Paso 3 tenga algo contra qué juzgar después — esta es la misma idea de "fundamentado, no adivinado" que el contexto recuperado del proyecto RAG, solo que usada para *verificar* una respuesta en lugar de *escribir* una.
- **Pedirle al modelo que responda solo con JSON, y luego parsearlo, es un patrón frágil pero común.** Los modelos ocasionalmente envuelven su respuesta en un fence de código ` ```json ` incluso cuando se les dice que no — las llamadas `removeprefix`/`removesuffix` de arriba lo quitan antes de que corra `json.loads`. Si el parseo aún falla, imprimir la respuesta cruda antes de parsearla es la forma más rápida de ver qué vino realmente.

:::tip[Pide más preguntas de las que necesitas, si la calidad es inconsistente]
Los modelos pequeños de nivel gratuito ocasionalmente producen una pregunta vaga o extrañamente redactada. Si notas esto en tus propias notas, una solución simple sin código nuevo es pedir unas preguntas extra en el prompt y quedarte solo con las primeras `N` — o solo re-ejecutar la generación, ya que es una sola llamada a la API.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`generate_questions(notes_text)` devuelve una lista de Python de dicts, cada uno con una clave `"question"` y `"expected_answer"`.</StepChecklistItem>
<StepChecklistItem>Leyendo un par de las preguntas generadas, se refieren claramente a detalles específicos de tu archivo de notas, no hechos genéricos sobre el tema que un buscador podría haber escrito.</StepChecklistItem>
<StepChecklistItem>Entiendes por qué `expected_answer` se genera pero aún no se imprime en pantalla.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si le entregaras al modelo un archivo de notas sobre un tema que ya conoce extremadamente bien del entrenamiento (digamos, fotosíntesis básica), ¿cómo sabrías si una pregunta generada está realmente fundamentada en *tus* notas versus el conocimiento previo del modelo? ¿Hay una forma de probarlo?
- ¿Qué le pasaría a la calidad de las preguntas si `notes_text` estuviera vacío o fuera solo una frase corta? Pruébalo — ¿el modelo produce una respuesta elegante o algo claramente roto?

## Paso 3: Construye el bucle de cuestionario interactivo

Ahora la parte que hace de esto un cuestionario y no solo un generador de preguntas: haz cada pregunta, lee la respuesta escrita del estudiante, y haz que el modelo la juzgue — las respuestas de texto libre no coincidirán palabra por palabra con la respuesta esperada, así que una comparación exacta de cadenas (`==`) marcaría casi todo como incorrecto.

```python
JUDGE_PROMPT_TEMPLATE = """You are grading a student's quiz answer. Judge
whether the student's answer is correct, partially correct, or incorrect,
compared to the expected answer below -- the student won't phrase it
identically, so judge on meaning, not exact wording.

Question: {question}
Expected answer: {expected_answer}
Student's answer: {student_answer}

Reply with ONLY JSON, no other text, in this exact shape:
{{"verdict": "correct" | "close" | "incorrect", "feedback": "one brief, encouraging sentence"}}
"""

def judge_answer(question: str, expected_answer: str, student_answer: str) -> dict:
    prompt = JUDGE_PROMPT_TEMPLATE.format(
        question=question, expected_answer=expected_answer, student_answer=student_answer
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)


def run_quiz(questions: list[dict]) -> None:
    score = 0
    for i, item in enumerate(questions, start=1):
        print(f"\nQuestion {i}/{len(questions)}: {item['question']}")
        student_answer = input("Your answer: ").strip()

        result = judge_answer(item["question"], item["expected_answer"], student_answer)
        verdict = result.get("verdict", "incorrect")
        feedback = result.get("feedback", "")

        if verdict == "correct":
            score += 1
            print(f"✅ Correct! {feedback}")
        elif verdict == "close":
            score += 0.5
            print(f"🟡 Close. {feedback}")
        else:
            print(f"❌ Not quite. {feedback}")
            print(f"   Expected answer: {item['expected_answer']}")

    print(f"\nFinal score: {score}/{len(questions)}")
```

Un veredicto de tres vías (`correct` / `close` / `incorrect`) es deliberadamente más indulgente que un correcto/incorrecto binario — un estudiante que tiene la idea correcta pero se pierde un detalle recibe crédito parcial y retroalimentación útil, en lugar de un "incorrecto" plano que no dice por qué.

:::tip[input() bloquea hasta que el estudiante presiona Enter]
`input("Your answer: ")` pausa todo el script en esa línea hasta que escribes algo y presionas Enter — exactamente como `input()` de vuelta en Python 101, solo que ahora dentro de un bucle que también hace llamadas de red antes y después. Si la terminal parece colgarse después de imprimir una pregunta, eso es normal: está esperándote a ti, no a la API.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`run_quiz(questions)` imprime una pregunta a la vez y realmente espera entrada escrita antes de continuar.</StepChecklistItem>
<StepChecklistItem>Una respuesta deliberadamente correcta se marca como correcta, y una deliberadamente incorrecta se marca como incorrecta, con la respuesta esperada mostrada.</StepChecklistItem>
<StepChecklistItem>Una respuesta que es aproximadamente correcta pero no exacta en la redacción (p. ej. parafraseada) obtiene un veredicto razonable, no un "incorrecto" injusto.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué juzgar con una *segunda* llamada al LLM por pregunta en lugar de pedirle al modelo que genere la pregunta, la respuesta esperada, *y* un veredicto todo en una sola llamada al momento de generar el cuestionario? ¿Qué saldría mal con ese enfoque, dado que el estudiante aún no ha respondido al momento de la generación?
- El veredicto `"close"` otorga medio crédito. ¿Cuál es un caso donde la respuesta de un estudiante debería claramente ser "close" en lugar de completamente correcta o completamente incorrecta — y caería tu propia respuesta a una pregunta real de tus notas ahí?

## Paso 4: Lleva el puntaje y ejecútalo de principio a fin

`run_quiz` de arriba ya lleva el `score` mientras avanza e imprime una línea final `score/total` una vez que el bucle termina. Conecta todo junto en un `main()`:

```python
def main() -> None:
    notes_text = Path("notes/cell-biology.txt").read_text(encoding="utf-8")

    print("Generating questions...")
    questions = generate_questions(notes_text)
    print(f"Got {len(questions)} questions. Let's go!")

    run_quiz(questions)


if __name__ == "__main__":
    main()
```

Ejecútalo:

```bash
uv run python study_buddy.py
```

Deberías ver una breve pausa de "Generating questions..." (una llamada a la API), luego cinco preguntas una a la vez, cada una esperando tu respuesta escrita antes de continuar, terminando con una línea de puntaje final como `Final score: 3.5/5`.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python study_buddy.py` corre de principio a fin: generación, luego todas las preguntas, luego una línea de puntaje final.</StepChecklistItem>
<StepChecklistItem>El número de puntaje final coincide con lo que esperarías de tus propias respuestas (correcto = +1, cerca = +0.5, incorrecto = +0).</StepChecklistItem>
<StepChecklistItem>Ejecutarlo de nuevo sobre el mismo archivo de notas produce un conjunto *diferente* de preguntas — confirmando que la generación no está hardcodeada ni cacheada.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si ejecutaras todo el script dos veces seguidas sobre el mismo archivo de notas, ¿esperarías exactamente las mismas cinco preguntas ambas veces? ¿Por qué sí o por qué no, dado cómo `generate_questions` llama al modelo?
- Ahora mismo, una mala llamada a `judge_answer` (un fallo de parseo, un error de red) colapsaría todo el cuestionario a mitad de camino, perdiendo el progreso del estudiante en las preguntas restantes. ¿Cuál es un cambio mínimo en `run_quiz` que dejaría que el cuestionario continuara después de un mal juicio en lugar de detenerse por completo?

## ⚠️ Errores comunes

- **Notas delgadas producen preguntas delgadas.** Si tu archivo de notas es solo unos pocos puntos cortos, el modelo tiene muy poco en qué fundamentar cinco preguntas distintas, y obtendrás repetitivas o demasiado fáciles ("¿Cuál es el nombre de...?"). Notas más detalladas, de estilo prosa, producen preguntas notablemente mejores — esto refleja la lección de fragmentación del proyecto RAG: mejor texto de entrada significa mejor resultado, no un prompt más inteligente.
- **El juez puede ser demasiado estricto o demasiado indulgente.** Un modelo pequeño de nivel gratuito calificando respuestas de texto libre no es un instrumento preciso — puede marcar una respuesta correcta pero extrañamente redactada como incorrecta, o dejar pasar una respuesta que en realidad está perdiendo un detalle clave. Si notas un sesgo consistente, aprieta la redacción de `JUDGE_PROMPT_TEMPLATE` (p. ej. "el crédito parcial solo cuenta si al menos un hecho específico es correcto") en lugar de intentar sortearlo en Python.
- **Límites de tasa por dos llamadas por pregunta.** A diferencia de una respuesta RAG de un solo disparo, este script hace *dos* llamadas al modelo por pregunta para cuando terminas un cuestionario — una para generación (una vez, por cuestionario) y una para juzgar (una vez, por pregunta). Un cuestionario de 5 preguntas son 6 llamadas en total; ejecuta varios cuestionarios consecutivos en un nivel gratuito y podrías golpear un error de límite de tasa 429. Esto no es un bug — mira el [proyecto de Agente de IA](/docs/projects/ai-agent#manejar-límites-de-tasa) para el mismo patrón y un enfoque de reintento que puedes copiar.
- **JSON malformado del modelo rompe `json.loads`.** Incluso con una instrucción explícita de "responde solo con JSON", un modelo ocasionalmente añade una frase suelta antes o después del JSON, o deja una coma final. Si golpeas un `JSONDecodeError`, imprime la respuesta cruda antes de parsearla — casi siempre es suficiente para ver exactamente qué salió mal y ajustar el prompt.

## Lo que acabas de construir

Un pipeline pequeño pero completo de "generar, luego interactuar, luego calificar": una llamada al LLM convierte tus propias notas en preguntas fundamentadas con respuestas que solo el programa puede ver, un bucle recoge tus respuestas escritas, y una segunda llamada al LLM juzga cada una por significado en lugar de redacción exacta, con un puntaje acumulado totalizado a lo largo de toda la sesión. Nada aquí fue falsificado en un juguete que no generaliza — apúntalo a un archivo de notas genuinamente útil para otra clase que estés tomando, y es una herramienta de estudio real, no solo un ejercicio de curso.

## A dónde ir desde aquí

- Una vez que un solo archivo de notas deja de ser suficiente — un semestre completo de notas en muchos archivos — reutiliza el pipeline `prepare_notes.py`/`build_index.py`/`retrieve.py` del [proyecto RAG](/docs/projects/rag-notes): recupera los fragmentos más relevantes para un *tema* sobre el que quieras ser examinado, y aliméntalos a `generate_questions` en lugar de un archivo completo.
- Lleva un registro de las preguntas falladas a través de ejecuciones (escríbelas en un pequeño archivo JSON) y construye un modo "revisa mis puntos débiles" que te vuelva a examinar específicamente sobre los temas que fallaste antes.
- Añade un ajuste de dificultad a `GENERATE_PROMPT_TEMPLATE` ("preguntas fáciles de recordar" vs. "preguntas que requieren conectar dos ideas de las notas") y compara cuánto más difícil se siente realmente el modo más difícil.
- Revisita el contenido extra de `try`/`except` de Python 101 — envolver `judge_answer` para que una respuesta malformada no termine todo el cuestionario (ver la pregunta socrática del Paso 4) es exactamente ese patrón.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un tutorial completo y amigable para principiantes para añadir el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="study-buddy-agent" />
