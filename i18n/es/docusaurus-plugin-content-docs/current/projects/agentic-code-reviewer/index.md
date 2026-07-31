---
id: agentic-code-reviewer
title: "Construye un Revisor de Código Agéntico"
sidebar_label: "Construye un Revisor de Código Agéntico"
slug: /projects/agentic-code-reviewer
description: "Gradúate del playground del navegador a Python real: construye una herramienta CLI que lee un git diff real vía subprocess y le pide a un LLM de nivel gratuito que lo revise como lo haría un humano."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Revisor de Código Agéntico

<ProjectPublishedDate projectId="agentic-code-reviewer" />

<ProjectGreeting />

Todo pull request eventualmente es leído por un revisor humano que busca errores, problemas de estilo, tests faltantes y nombres confusos — antes de eso, sin embargo, es solo texto: la salida de `git diff`. Este proyecto construye una herramienta CLI que hace esa primera pasada automáticamente: captura un diff real con el módulo `subprocess` de Python, se lo entrega a un modelo de lenguaje de nivel gratuito con un system prompt de revisor cuidadosamente diseñado, y devuelve retroalimentación estructurada y accionable — no un vago "se ve bien", sino problemas específicos con un archivo, una categoría, una severidad y una corrección sugerida.

Esto asume Python 101 y suficiente comodidad con git para saber qué muestra `git diff` — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Instalar `uv`, obtener una clave de API de un LLM de nivel gratuito, y configurar un pequeño proyecto — todo en un solo lugar, antes de empezar a construir.
2. Usar el módulo `subprocess` de Python para ejecutar `git diff` de verdad y capturar su salida como texto.
3. Diseñar un system prompt que convierta un modelo de chat de propósito general en un revisor enfocado y estructurado.
4. Enviar un diff al modelo e imprimir su retroalimentación en un formato claro y legible.
5. Ejecutar la herramienta completa contra un diff real — tus propios cambios sin confirmar, y un commit específico del pasado del propio historial de este curso.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado aquí, más que para la mayoría de otros proyectos de esta serie — la premisa completa de esta herramienta es ejecutar `git diff` contra un repositorio git local real, y eso significa que necesita una carpeta `.git` real en disco a la cual apuntar (tu propio proyecto, o un clon del repositorio de este curso).

**GitHub Codespaces** también funciona bien: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, `uv` y git ya están instalados) — es un clon real con historial real, así que cada paso de abajo, incluyendo la demo de "revisar un commit real del pasado", funciona exactamente igual que localmente.

**Google Colab, Kaggle Notebooks y Binder son una forma razonable de *probar* la herramienta, pero no de ejecutarla de verdad.** Ninguno te da un repositorio git local real con historial de commits por defecto, y la premisa completa de esta herramienta es revisar *tu propio* trabajo en progreso — el sistema de archivos efímero de un notebook no tiene nada de eso. El notebook de abajo sortea esto honestamente, en lugar de fingir que la brecha no existe: hace `!git clone` del propio repositorio de este curso dentro del notebook y revisa un commit histórico real y pequeño de él con `git show`, así que cada pieza de la herramienta (la captura de diff con `subprocess`, el system prompt, la llamada al LLM, la salida estructurada) sigue ejecutándose contra una salida real y con apariencia real — solo que está revisando un commit de ejemplo fijo en lugar de algo que tú escribiste personalmente. Úsalo para ver la herramienta funcionar de principio a fin sin ninguna configuración; cambia a `uv` local o a un Codespace cuando quieras apuntarla a tus propios cambios reales.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/agentic-code-reviewer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/agentic-code-reviewer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fagentic-code-reviewer%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de escribir una línea del revisor en sí: un Python real, una clave de API gratuita, y un pequeño proyecto para contener ambos.

### Instala `uv`

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

### Configura el proyecto

```bash
uv init agentic-code-reviewer
cd agentic-code-reviewer
uv add openai python-dotenv
```

La librería cliente de `openai` funciona aquí para cada proveedor de la tabla de abajo, no solo para OpenAI mismo — GitHub Models, Gemini, Groq, Mistral, Cerebras y OpenRouter todos exponen un endpoint de chat compatible con OpenAI, así que un solo cliente, apuntado a una `base_url` diferente, es todo lo que este proyecto necesita. `python-dotenv` te permite mantener tu clave de API en un archivo `.env` local en lugar de hacer `export` cada sesión.

### Obtén una clave de API de LLM gratuita

**Elige el proveedor que prefieras** — ninguno requiere tarjeta de crédito al momento de escribir esto, y este curso no favorece a uno sobre otro. El ejemplo más completo en el repositorio del curso ([`examples/agentic-code-reviewer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer)) soporta los seis de fábrica, seleccionables con una sola configuración.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(sugerido por defecto)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el scope `models: read` | Sin registro aparte — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada; también expone un endpoint compatible con OpenAI, usado abajo. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

Sea cual sea el que elijas, el proceso es el mismo:

1. Inicia sesión y genera una clave de API en el sitio de ese proveedor.
2. **Nunca pegues esta clave directamente en el código ni la subas a un repositorio.** Crea en su lugar un archivo `.env` en la carpeta de tu proyecto (nunca lo subas):

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=tu-clave-aquí
```

Una clave de API es un secreto, exactamente como una contraseña — cualquiera que la tenga puede usar la cuota de tu cuenta. Tratarla como una variable de entorno en lugar de una cadena fija en el código es la práctica estándar exactamente por esta razón.

:::tip[Un archivo .env suele ser más conveniente que export]
En lugar de hacer `export` de una clave en cada nueva sesión de terminal, `python-dotenv` lee un archivo `.env` en la carpeta de tu proyecto hacia `os.environ` automáticamente, la primera vez que se ejecuta tu script — mira `load_dotenv()` en el Paso 3 de abajo.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv --version` imprime un número de versión.</StepChecklistItem>
<StepChecklistItem>`agentic-code-reviewer/` existe con un `pyproject.toml`, y `openai` y `python-dotenv` están instalados.</StepChecklistItem>
<StepChecklistItem>Tienes una clave de API real de un proveedor, guardada en un archivo `.env` en la carpeta de tu proyecto — no pegada en ningún script.</StepChecklistItem>
</StepChecklist>

## Paso 1: Captura un git diff con `subprocess`

El módulo `subprocess` de Python ejecuta otro programa y captura su salida como texto — aquí, ese programa es `git` mismo. Este es un uso genuinamente realista de `subprocess`: no estás simulando nada, estás ejecutando exactamente el mismo comando `git diff` que escribirías a mano, y leyendo de vuelta exactamente lo que imprimiría en tu terminal.

Crea `review.py`:

```python
# review.py
import subprocess


def get_diff_uncommitted() -> str:
    """El diff entre el árbol de trabajo y el último commit -- cambios en stage y sin stage."""
    return _run_git(["diff", "HEAD"])


def get_diff_against(ref: str) -> str:
    """El diff entre el árbol de trabajo y otra referencia, ej. 'main'."""
    return _run_git(["diff", ref])


def get_diff_for_commit(commit: str) -> str:
    """El diff introducido por un commit específico del pasado, vs. su padre."""
    return _run_git(["show", commit])


def _run_git(args: list[str]) -> str:
    """Ejecuta `git <args>` en el directorio actual y devuelve su stdout."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} falló:\n{result.stderr}")
    return result.stdout


if __name__ == "__main__":
    diff = get_diff_uncommitted()
    print(diff if diff.strip() else "No hay cambios sin confirmar para revisar.")
```

`subprocess.run([...], capture_output=True, text=True)` es la línea clave: pasar el comando como una **lista** de argumentos (`["git", "diff", "HEAD"]`) en lugar de una cadena única de shell evita toda una clase de bugs de quoting de shell e inyección, `capture_output=True` captura stdout/stderr en lugar de dejarlos imprimir directamente a tu terminal, y `text=True` decodifica esa salida como una cadena en lugar de bytes crudos. `check=False` más un `if result.returncode != 0` manual es deliberado aquí en lugar de `check=True`: permite que esta función lance su *propio* mensaje de error claro (incluyendo el stderr real de git) en lugar de un `CalledProcessError` genérico.

Pruébalo contra este mismo proyecto — edita cualquier archivo, no lo confirmes, luego ejecuta:

```bash
uv run python review.py
```

:::tip[Este es el mismo patrón de subprocess que cualquier otro wrapper de CLI]
`subprocess.run` no le importa que el programa que se ejecuta sea `git` — funciona idénticamente para cualquier herramienta de línea de comandos: `ls`, un script de shell, otro programa Python. Una vez que este patrón hace clic, "dejar que Python controle una herramienta CLI existente y usar su salida" está disponible para mucho más que solo git.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`get_diff_uncommitted()` devuelve texto de diff real cuando tienes cambios sin confirmar, y una cadena vacía cuando no.</StepChecklistItem>
<StepChecklistItem>Ejecutar `review.py` dentro de una carpeta que no es un repositorio git en absoluto lanza un `RuntimeError` claro, no un traceback confuso desde el fondo de `subprocess`.</StepChecklistItem>
<StepChecklistItem>Puedes explicar, en tus propias palabras, por qué el comando se pasa como una lista (`["git", "diff", "HEAD"]`) en lugar de la cadena única `"git diff HEAD"`.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Qué devolvería `_run_git(["diff", "HEAD"])` para un repositorio git recién creado con un solo commit y sin cambios sin confirmar? ¿Por qué manejar un diff vacío, en lugar de asumir que siempre hay algo que revisar, es parte de escribir esta función correctamente?
- `check=False` fue una elección deliberada arriba. ¿Qué cambiaría sobre el error que ve quien llama si en su lugar usaras `check=True` y dejaras que `subprocess.CalledProcessError` se propague sin manejar?

## Paso 2: Diseña el system prompt de revisión

Un modelo de lenguaje sin instrucciones felizmente producirá "¡se ve bien!" para casi cualquier cosa — inútil como revisor. El **system prompt** es lo que convierte un modelo de chat de propósito general en un revisor que se comporta consistentemente: qué buscar, qué ignorar, y qué forma debe tomar su respuesta.

```python
SYSTEM_PROMPT = """\
You are an experienced, pragmatic senior software engineer doing a code review.
You will be given a unified git diff. Review ONLY what the diff actually
changes -- do not comment on surrounding code you can't see, and do not
invent context that isn't in the diff.

For each issue you find, report:
- file and, if visible in the diff's @@ hunk header, the approximate line
- category: one of Bug, Style, Missing Test, Unclear Naming, Security, Other
- severity: Critical, Warning, or Suggestion
- a short, concrete explanation of the issue
- a specific suggested fix, not just "consider improving this"

Focus on:
- likely bugs (off-by-one errors, unhandled edge cases, wrong operators,
  mutated shared state)
- style inconsistencies with the surrounding code
- missing or clearly inadequate test coverage for the change
- unclear variable/function names that would confuse the next reader
- obvious security issues (secrets, injection, unsafe deserialization)

If the diff genuinely has no issues, say so plainly and briefly -- do not
invent problems just to have something to say. Never respond with just
"looks good" and nothing else; always state what you checked.

Format your response as a numbered list of issues (or a short "no issues
found, because ..." paragraph), not prose paragraphs.
"""
```

Tres decisiones de diseño deliberadas que vale la pena notar:

- **"Revisa SOLO lo que el diff realmente cambia"** evita que el modelo invente quejas que suenan plausibles sobre código que no puede ver realmente — un diff muestra líneas cambiadas más un poco de contexto circundante, no el archivo completo.
- **Una estructura requerida** (archivo, categoría, severidad, explicación, corrección) es lo que convierte un chat de formato libre en algo sobre lo que realmente puedes actuar rápidamente, la misma razón por la que "LGTM con dos comentarios" de un revisor humano es más útil que un párrafo de impresiones vagas.
- **Una instrucción explícita de decir cuándo no hay nada mal** existe porque los modelos tienden a ser complacientes — sin esta línea, algunos modelos fabrican pequeñas quejas solo para parecer minuciosos, lo cual te entrena a dejar de confiar en la salida de la herramienta.

:::tip[Itera sobre el prompt como lo harías con código]
Trata este system prompt como un primer borrador, no una especificación terminada. Ejecútalo contra un diff que ya sabes que tiene un bug específico — si el modelo lo pasa por alto, o el formato de respuesta se desvía, ajusta la redacción e inténtalo de nuevo. La ingeniería de prompts para una tarea enfocada como esta se parece más a escribir una especificación muy precisa que a "pedir amablemente".
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Puedes explicar, en tus propias palabras, por qué el prompt le dice al modelo que diga cuándo no encuentra nada mal, en lugar de dejarlo sin decir.</StepChecklistItem>
<StepChecklistItem>El prompt especifica una estructura de salida concreta (archivo, categoría, severidad, explicación, corrección), no solo "da retroalimentación".</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si eliminaras la instrucción "Revisa SOLO lo que el diff realmente cambia", ¿qué tipo de error esperarías que el modelo empezara a cometer en un diff que solo cambia una línea en medio de una función grande?
- El prompt pide un nivel de severidad por problema. ¿Qué sería peor en una herramienta de revisión que reportara *cada* problema como igualmente importante, comparado con una que distingue Crítico de Sugerencia?

## Paso 3: Llama al LLM e imprime retroalimentación estructurada

Conecta el código de captura de diff del Paso 1 y el system prompt del Paso 2 en un revisor funcional:

```python
# review.py (continuación -- agrega estos imports y funciones)
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # lee .env hacia el entorno, si existe

MAX_DIFF_CHARS = 12_000  # ver el pitfall de "diffs enormes" abajo


def truncate_diff(diff: str, max_chars: int = MAX_DIFF_CHARS) -> str:
    """Recorta un diff sobredimensionado a un tamaño que cabe en una ventana de contexto de nivel gratuito."""
    if len(diff) <= max_chars:
        return diff
    return diff[:max_chars] + f"\n\n... [diff truncado -- {len(diff) - max_chars} caracteres más no mostrados] ..."


def review_diff(diff: str) -> str:
    """Envía un diff al LLM de nivel gratuito configurado y devuelve su revisión como texto."""
    if not diff.strip():
        return "No hay cambios para revisar -- el diff está vacío."

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    diff = truncate_diff(diff)
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirma que esto todavía tiene un nivel gratuito antes de ejecutar
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Review this diff:\n\n```diff\n{diff}\n```"},
        ],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    diff = get_diff_uncommitted()
    print(f"Revisando {len(diff)} caracteres de diff...\n")
    print(review_diff(diff))
```

`truncate_diff` importa más aquí de lo que podría parecer a primera vista — mira la sección de pitfalls abajo para saber por qué un diff grande no es solo lento, puede fallar silenciosamente u obtener una revisión superficial. Envolver el diff en un bloque de código con fence ` ```diff ` en el mensaje del usuario, en lugar de pegarlo crudo, es una señal pequeña pero real al modelo sobre qué tipo de texto está viendo.

Ejecútalo:

```bash
uv run python review.py
```

:::tip[¿Usando un proveedor diferente?]
Cambia el bloque `OpenAI(...)` por una `base_url` y clave diferentes — ej. `base_url="https://api.groq.com/openai/v1"` con `api_key=os.environ["GROQ_API_KEY"]` para Groq, o `base_url="https://generativelanguage.googleapis.com/v1beta/openai/"` con `api_key=os.environ["GOOGLE_API_KEY"]` para el endpoint compatible con OpenAI de Gemini. Todo lo demás en este archivo permanece igual. Mira [`examples/agentic-code-reviewer/review.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer/review.py) en el repositorio del curso para ver los seis conectados lado a lado, seleccionables con una variable de entorno.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python review.py` imprime una lista numerada de problemas reales (o un mensaje claro de "no se encontraron problemas") para un diff que sabes que tiene cambios.</StepChecklistItem>
<StepChecklistItem>Cada problema reportado nombra un archivo y una categoría, no solo un comentario vago.</StepChecklistItem>
<StepChecklistItem>Ejecutarlo con un diff vacío imprime "No hay cambios para revisar" en lugar de hacer una llamada a la API en absoluto.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `review_diff` retorna temprano con una cadena fija cuando el diff está vacío, antes de siquiera construir un cliente `OpenAI`. ¿Por qué ese orden — verificar primero, llamar a la API después — vale la pena hacerlo deliberadamente, en lugar de simplemente dejar que un prompt vacío vaya al modelo?
- Si dos ejecuciones diferentes de `review_diff` sobre el *mismo* diff exacto produjeran dos listas diferentes de problemas, ¿te sorprendería? ¿Qué sugiere eso sobre tratar la salida de esta herramienta como una lista de verificación en la que confiar ciegamente versus un punto de partida para una revisión humana?

## Paso 4: Ejecútalo contra un diff real, de principio a fin

Dos formas realistas de usar esta herramienta, ambas vale la pena probar:

**1. Revisa tus propios cambios sin confirmar** — el caso de uso cotidiano. Haz un cambio pequeño y deliberado en cualquier archivo (introduce un bug obvio a propósito, si quieres una prueba clara), luego:

```bash
uv run python review.py
```

**2. Revisa un commit específico del propio historial de este curso** — una buena forma de ver la herramienta funcionar en un diff real que tú no escribiste. Agrega una pequeña opción de CLI para poder apuntarla a cualquier commit por su hash:

```python
# review.py (continuación)
import argparse
import sys


def get_diff_for_commit(commit: str) -> str:
    """El diff introducido por un commit específico del pasado, vs. su padre."""
    return _run_git(["show", commit])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Revisa un git diff con un LLM de nivel gratuito.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--against", metavar="REF", help="Revisa el diff contra REF, ej. 'main'.")
    group.add_argument("--commit", metavar="SHA", help="Revisa un commit específico del pasado.")
    group.add_argument("--stdin", action="store_true", help="Lee el diff desde stdin en lugar de ejecutar git.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.stdin:
        diff = sys.stdin.read()
    elif args.commit:
        diff = get_diff_for_commit(args.commit)
    elif args.against:
        diff = get_diff_against(args.against)
    else:
        diff = get_diff_uncommitted()

    print(f"Revisando {len(diff)} caracteres de diff...\n")
    print(review_diff(diff))
```

Clona o abre el repositorio de este curso, luego apunta la herramienta a un commit real del pasado:

```bash
git log --oneline -10          # encuentra un hash de commit real para probar
uv run python review.py --commit <hash>
```

También puedes comparar tu rama actual contra otra, o pasar un diff directamente por pipe en lugar de dejar que el script ejecute `git` por sí mismo — útil en un job de CI que ya tiene el diff como archivo:

```bash
uv run python review.py --against main
git diff main | uv run python review.py --stdin
```

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python review.py --commit <un hash real>` imprime retroalimentación real sobre los cambios reales de ese commit.</StepChecklistItem>
<StepChecklistItem>`uv run python review.py --against main` y hacer pipe vía `--stdin` producen ambos salidas sensatas en un repositorio con más de una rama.</StepChecklistItem>
<StepChecklistItem>Has ejecutado la herramienta en al menos un diff que tú mismo escribiste, y leído la retroalimentación con suficiente atención para estar de acuerdo o en desacuerdo con ella.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Elige un commit del historial real de este curso y revísalo con tu herramienta. ¿La retroalimentación coincide con lo que esperarías que dijera un revisor humano sobre ese cambio? ¿Dónde ayuda claramente, y dónde pierde contexto que un humano habría tenido (como *por qué* se hizo el cambio)?
- `--stdin` permite que otra cosa genere el diff en lugar de las propias llamadas a `subprocess` de este script. ¿Cuál es un ejemplo de un flujo de trabajo real (pista: un pipeline de CI, un hook de pre-commit) donde esa flexibilidad importa más que la conveniencia?

## ⚠️ Errores comunes

- **Diffs enormes que exceden la ventana de contexto o la cuota de tokens de nivel gratuito.** Un diff de varios miles de líneas (una refactorización grande, una actualización de dependencia vendorizada) puede exceder lo que el modelo puede realmente atender, o simplemente exceder el límite de tokens por solicitud de tu nivel gratuito y fallar directamente. `truncate_diff` en el Paso 3 limita esto, pero la truncación significa una revisión parcial — para cambios genuinamente grandes, revísalos en piezas más pequeñas (un archivo o un commit lógico a la vez) en lugar de confiar en que una pasada truncada lo haya visto todo.
- **Revisar archivos generados o vendorizados.** Un diff que toca `uv.lock`, un bundle minificado, o un archivo de migración autogenerado desperdicia tokens en texto que ningún humano escribió ni necesita comentarios sobre él, y puede ahogar la retroalimentación real sobre los archivos que sí importan. Filtra estos antes de llamar a `git diff` (ej. `git diff -- . ':!uv.lock' ':!*.min.js'`) en lugar de enviarlo todo.
- **Confiar demasiado en la revisión de la IA como reemplazo de una humana.** Esta herramienta es una primera pasada rápida, no un revisor con contexto completo del proyecto, convenciones del equipo, o la capacidad de preguntarte *por qué* hiciste un cambio. Trata su salida como tratarías los comentarios de un colega muy rápido pero un poco inexperto — vale la pena leerla, no vale la pena fusionar (merge) basándose solo en ella.
- **No manejar un diff vacío o faltante.** Ejecutar la herramienta sin cambios sin confirmar y sin la bandera `--commit`/`--against` contra un repositorio sin nada que comparar producirá un diff vacío — el retorno temprano de `review_diff` para entrada vacía (Paso 3) existe específicamente para que esto no se convierta en una llamada a la API desperdiciada o una respuesta confusa y vacía del modelo.

## Lo que acabas de construir

Un CLI de revisión de código real y funcional: captura un git diff real vía `subprocess` — el mismo comando que escribirías a mano — y lo convierte en retroalimentación estructurada y accionable de un LLM de nivel gratuito, guiado por un system prompt diseñado específicamente para revisar código en lugar de chatear genéricamente. Nada aquí es una simulación de juguete: apúntalo a un commit real del propio historial de este curso, o a tu propio trabajo sin confirmar, y revisa el texto real, no un ejemplo enlatado.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/agentic-code-reviewer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer) en el repositorio del curso es una versión más completa del código de arriba, con los seis proveedores de la tabla conectados lado a lado (seleccionados con una configuración `LLM_PROVIDER`) y las opciones `--against`/`--commit`/`--stdin` del Paso 4 ya incluidas. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Agrega una bandera `--severity-min` que filtre la salida del modelo a solo problemas `Critical` y `Warning` — útil una vez que estés ejecutando esto en diffs más grandes y quieras triar rápido en lugar de leer cada `Suggestion`.
- Conecta esto a un hook de pre-commit o a un job de GitHub Actions para que cada pull request en tus propios proyectos reciba automáticamente un comentario de primera revisión — la opción `--stdin` del Paso 4 es exactamente la forma que necesita un job de CI (ya tiene el diff, generado de otra forma).
- Prueba comparando la retroalimentación entre dos proveedores diferentes sobre el *mismo* diff — ¿marcan los mismos problemas? ¿Dónde discrepan, y qué te dice eso sobre confiar en la revisión de un solo modelo como verdad absoluta?

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="agentic-code-reviewer" />
