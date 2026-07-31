---
id: commit-message-agent
title: "Construye un Generador de Mensajes de Commit de Git"
sidebar_label: "Construye un Generador de Mensajes de Commit de Git"
slug: /projects/commit-message-agent
description: "Construye una herramienta CLI que lee un git diff staged real vía subprocess, redacta un mensaje estilo Conventional Commits con un LLM de nivel gratuito, y solo confirma el commit después de que apruebes explícitamente."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Generador de Mensajes de Commit de Git

<ProjectPublishedDate projectId="2027-commit-message-agent" />

<ProjectGreeting />

"wip", "arreglar cosas", "asdf" — todo desarrollador ha escrito un mensaje de commit perezoso a las 6pm de un viernes. Este proyecto construye una herramienta CLI que elimina la excusa: captura tu `git diff` **staged** real con el módulo `subprocess` de Python, se lo entrega a un modelo de lenguaje de nivel gratuito con un system prompt diseñado específicamente para escribir mensajes estilo Conventional Commits, y te muestra un borrador que puedes aceptar, editar, o descartar — antes de que se confirme nada. La herramienta nunca hace commit por sí sola; un humano siempre confirma el mensaje final primero.

Esto asume Python 101 y suficiente comodidad con git para saber qué hacen `git add` y `git commit` — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Instalar `uv`, obtener una clave de API de un LLM de nivel gratuito, y configurar un pequeño proyecto — todo en un solo lugar, antes de empezar a construir.
2. Usar el módulo `subprocess` de Python para ejecutar `git diff --staged` de verdad y capturar su salida como texto.
3. Diseñar un system prompt que convierta un LLM de propósito general en un redactor enfocado de mensajes estilo Conventional Commits.
4. Construir un bucle CLI interactivo: mostrar el borrador, dejar que el usuario lo acepte, edite, o lo regenere.
5. Conectar el bucle para que realmente ejecute `git commit -m "..."` — pero solo después de que el usuario confirme explícitamente.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado aquí, más que para la mayoría de otros proyectos de esta serie — la premisa completa de esta herramienta es leer `git diff --staged` de un repositorio git local real y, si tú lo dices, confirmar un commit en él. Eso significa que necesita una carpeta `.git` real con cambios en stage en disco contra la cual trabajar (tu propio proyecto, o un clon del repositorio de este curso).

**GitHub Codespaces** también funciona bien: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, `uv` y git ya están instalados) — es un clon real con un lugar real para hacer stage de cambios, así que cada paso de abajo funciona exactamente igual que localmente.

**Google Colab y Kaggle Notebooks son una forma razonable de *probar* la lógica de redacción, pero no de ejecutar la herramienta de verdad.** Ninguno te da un repositorio git local real con cambios en stage por defecto, y la premisa completa de esta herramienta es redactar un mensaje para *tu propio* trabajo en progreso — el sistema de archivos efímero de un notebook no tiene nada de eso, y no hay nada sensato a lo cual realmente hacer commit. El notebook de abajo sortea esto honestamente, en lugar de fingir que la brecha no existe: hace `!git clone` del propio repositorio de este curso dentro del notebook y redacta un mensaje para un commit histórico real y pequeño de él con `git show`, así que la captura del diff, el system prompt, y la llamada al LLM todos se ejecutan contra una salida real y con apariencia real — solo que está redactando para un commit de ejemplo fijo, y se detiene ahí; **no** demuestra el bucle interactivo de aceptar/editar/confirmar, ya que hacer commit solo tiene sentido contra un repositorio en el que realmente estás trabajando. Úsalo para ver la lógica de redacción funcionar de principio a fin sin ninguna configuración; cambia a `uv` local o a un Codespace cuando quieras la herramienta interactiva completa apuntada a tus propios cambios reales.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/commit-message-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/commit-message-agent/notebook.ipynb)

## Configuración

Todo lo que necesitas antes de escribir una línea del redactor en sí: un Python real, una clave de API gratuita, y un pequeño proyecto para contener ambos.

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
uv init commit-message-agent
cd commit-message-agent
uv add openai python-dotenv
```

La librería cliente de `openai` funciona aquí para cada proveedor de la tabla de abajo, no solo para OpenAI mismo — GitHub Models, Gemini, Groq, Mistral, Cerebras y OpenRouter todos exponen un endpoint de chat compatible con OpenAI, así que un solo cliente, apuntado a una `base_url` diferente, es todo lo que este proyecto necesita. `python-dotenv` te permite mantener tu clave de API en un archivo `.env` local en lugar de hacer `export` cada sesión.

### Obtén una clave de API de LLM gratuita

**Elige el proveedor que prefieras** — ninguno requiere tarjeta de crédito al momento de escribir esto, y este curso no favorece a uno sobre otro. El ejemplo más completo en el repositorio del curso ([`examples/commit-message-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent)) soporta los seis de fábrica, seleccionables con una sola configuración.

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
En lugar de hacer `export` de una clave en cada nueva sesión de terminal, `python-dotenv` lee un archivo `.env` en la carpeta de tu proyecto hacia `os.environ` automáticamente, la primera vez que se ejecuta tu script — mira `load_dotenv()` en el Paso 1 de abajo.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv --version` imprime un número de versión.</StepChecklistItem>
<StepChecklistItem>`commit-message-agent/` existe con un `pyproject.toml`, y `openai` y `python-dotenv` están instalados.</StepChecklistItem>
<StepChecklistItem>Tienes una clave de API real de un proveedor, guardada en un archivo `.env` en la carpeta de tu proyecto — no pegada en ningún script.</StepChecklistItem>
</StepChecklist>

## Paso 1: Captura un git diff en stage con `subprocess`

El módulo `subprocess` de Python ejecuta otro programa y captura su salida como texto — aquí, ese programa es `git diff --staged`, no el simple `git diff` al que podrías recurrir primero. Esa es una elección deliberada: un mensaje de commit debería describir lo que realmente está a punto de confirmarse, que es lo que has puesto en stage con `git add`, no cada cambio sin stage que está en tu árbol de trabajo.

Crea `commit_helper.py`:

```python
# commit_helper.py
import subprocess

from dotenv import load_dotenv

load_dotenv()  # reads .env into the environment, if present


def get_diff_staged() -> str:
    """The diff between the index (staged changes) and the last commit."""
    return _run_git(["diff", "--staged"])


def _run_git(args: list[str]) -> str:
    """Runs `git <args>` in the current directory and returns its stdout."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed:\n{result.stderr}")
    return result.stdout


if __name__ == "__main__":
    diff = get_diff_staged()
    print(diff if diff.strip() else "No staged changes. Stage something first with `git add`.")
```

`subprocess.run([...], capture_output=True, text=True)` es la línea clave: pasar el comando como una **lista** de argumentos (`["git", "diff", "--staged"]`) en lugar de una cadena única de shell evita toda una clase de bugs de quoting de shell e inyección, `capture_output=True` captura stdout/stderr en lugar de dejarlos imprimir directamente a tu terminal, y `text=True` decodifica esa salida como una cadena en lugar de bytes crudos. `check=False` más un `if result.returncode != 0` manual es deliberado aquí en lugar de `check=True`: permite que esta función lance su *propio* mensaje de error claro (incluyendo el stderr real de git) en lugar de un `CalledProcessError` genérico.

Pruébalo contra este mismo proyecto — edita un archivo, hazle `git add`, luego ejecuta:

```bash
uv run python commit_helper.py
```

:::tip[Este es el mismo patrón de subprocess que cualquier otro wrapper de CLI]
`subprocess.run` no le importa que el programa que se ejecuta sea `git` — funciona idénticamente para cualquier herramienta de línea de comandos: `ls`, un script de shell, otro programa Python. Una vez que este patrón hace clic, "dejar que Python controle una herramienta CLI existente y usar su salida" está disponible para mucho más que solo git.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`get_diff_staged()` devuelve texto de diff real después de hacer `git add` a un cambio, y una cadena vacía cuando nada está en stage.</StepChecklistItem>
<StepChecklistItem>Ejecutar `commit_helper.py` dentro de una carpeta que no es un repositorio git en absoluto lanza un `RuntimeError` claro, no un traceback confuso desde el fondo de `subprocess`.</StepChecklistItem>
<StepChecklistItem>Puedes explicar, en tus propias palabras, por qué esta herramienta lee `git diff --staged` en lugar del simple `git diff` (cambios sin stage).</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si hicieras `git add` a un archivo y dejaras otro modificado-pero-sin-stage, ¿qué mostraría `get_diff_staged()`, y qué mostraría en su lugar el simple `git diff` (sin `--staged`)? ¿Por qué una herramienta de mensajes de commit específicamente quiere lo primero?
- ¿Qué devolvería `_run_git(["diff", "--staged"])` en un repositorio con cambios sin confirmar que están todos sin stage? ¿Por qué manejar un diff vacío, en lugar de asumir que siempre hay algo en stage, importa para una herramienta destinada a ejecutarse como parte de un flujo de trabajo de commit normal?

## Paso 2: Diseña el system prompt del mensaje de commit

Un modelo de lenguaje sin instrucciones podría escribir un mensaje demasiado vago ("actualizar código"), demasiado extenso (un párrafo completo para una corrección de un typo de una línea), o sin ningún formato consistente. El **system prompt** es lo que convierte un modelo de chat de propósito general en un redactor que se comporta como un mantenedor de proyecto disciplinado: qué formato usar, en qué tono escribir, y cuándo molestarse en más de una línea.

```python
SYSTEM_PROMPT = """\
You are an experienced software engineer writing a git commit message for a
staged diff. You will be given a unified git diff. Base the message ONLY on
what the diff actually changes -- do not invent context you can't see, and
do not guess at a ticket number or issue reference that isn't in the diff.

Write the message in the Conventional Commits style:

    <type>(<optional scope>): <short summary, imperative mood, no period>

    <optional body: a few lines explaining WHY the change was made, not
    just restating what the diff shows -- wrap around 72 characters>

Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore.
Pick the type that best matches the *dominant* change -- if a diff touches
both a fix and its test, "fix" usually still wins over "test".

Rules:
- The summary line must stay under 72 characters and use the imperative
  mood ("add", not "added" or "adds").
- Only include a body if it adds real information beyond the summary --
  for a small, self-explanatory diff, the summary line alone is enough.
- Never wrap the whole message in a fenced code block or add commentary
  before/after it -- output ONLY the commit message text itself, nothing
  else, so it can be used directly as a commit message.
"""
```

Tres decisiones de diseño deliberadas que vale la pena notar:

- **Una estructura fija (`type(scope): summary`, cuerpo opcional)** es lo que hace que la salida sea usable como un mensaje de commit real, no una respuesta de chat que resulta describir el diff — [Conventional Commits](https://www.conventionalcommits.org/) es una convención ampliamente usada específicamente porque las herramientas (changelogs, semantic-release, CI) pueden analizarla de forma confiable.
- **"Solo incluye un cuerpo si añade información real"** evita que el modelo rellene una corrección de un typo de una línea con tres oraciones de contenido repetido del diff — el mismo instinto que tiene un revisor humano cuando ve un mensaje de commit inflado para un cambio trivial.
- **"Basa el mensaje SOLO en lo que el diff realmente cambia... no adivines un número de ticket"** existe porque los modelos felizmente alucinan un `JIRA-1234` o referencia de issue que suena plausible si no lo prohíbes explícitamente — una referencia fabricada en un mensaje de commit es peor que ninguna referencia.

:::tip[Itera sobre el prompt como lo harías con código]
Trata este system prompt como un primer borrador, no una especificación terminada. Ejecútalo contra un diff que ya sabes que merece un `type` específico (una adición pura de tests, un cambio solo de docs, una corrección de bug real) — si el modelo elige el tipo equivocado o el resumen se extiende demasiado, ajusta la redacción e inténtalo de nuevo.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Puedes explicar, en tus propias palabras, por qué el prompt prohíbe inventar un número de ticket o referencia de issue que no está en el diff.</StepChecklistItem>
<StepChecklistItem>El prompt especifica un formato de salida concreto (`type(scope): summary`, cuerpo opcional), no solo "escribe un mensaje de commit."</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si eliminaras la instrucción "solo incluye un cuerpo si añade información real", ¿qué tipo de mensajes de commit esperarías para diffs muy pequeños y autoexplicativos?
- El prompt lista diez tipos válidos de Conventional Commits. ¿Qué saldría mal para las herramientas de changelog de un proyecto real si el modelo fuera libre de inventar sus propios tipos en lugar de elegir de una lista fija?

## Paso 3: Llama al LLM y construye el bucle interactivo

Conecta el código de captura de diff del Paso 1 y el system prompt del Paso 2, luego añade la parte que convierte esto en una herramienta real en lugar de un script de una sola vez: un bucle que muestra el borrador y deja que un humano lo acepte, edite, o regenere.

```python
# commit_helper.py (continued -- add these imports and functions)
import os

from openai import OpenAI

MAX_DIFF_CHARS = 12_000  # see the "huge diffs" pitfall below


def truncate_diff(diff: str, max_chars: int = MAX_DIFF_CHARS) -> str:
    """Cuts an oversized diff down to a size that fits a free-tier context window."""
    if len(diff) <= max_chars:
        return diff
    return diff[:max_chars] + f"\n\n... [diff truncated -- {len(diff) - max_chars} more characters not shown] ..."


def draft_commit_message(diff: str) -> str:
    """Sends a diff to the configured free-tier LLM and returns a drafted commit message.

    Returns a plain string. That's the whole job of this function -- it has
    no idea a terminal or a `git commit` call exists anywhere. See Step 4
    for the only place this tool actually commits.
    """
    if not diff.strip():
        return ""

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    diff = truncate_diff(diff)
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Write a commit message for this staged diff:\n\n```diff\n{diff}\n```"},
        ],
    )
    return response.choices[0].message.content.strip()


def run_interactive_loop(diff: str) -> None:
    """Drafts a message and lets the user accept, edit, or regenerate it -- see Step 4
    for where (and only where) an accepted message actually gets committed."""
    if not diff.strip():
        print("No staged changes. Stage something first with `git add`.")
        return

    print(f"Drafting a commit message from {len(diff)} characters of staged diff...\n")
    message = draft_commit_message(diff)

    while True:
        print("-" * 60)
        print(message)
        print("-" * 60)
        choice = input("\nUse this message? [y]es / [e]dit / [r]egenerate / [n]o, cancel: ").strip().lower()

        if choice in ("n", "no"):
            print("Cancelled -- nothing was committed.")
            return
        if choice in ("r", "regenerate"):
            message = draft_commit_message(diff)
            continue
        if choice in ("e", "edit"):
            message = input("Type your edited message: ").strip() or message
            continue
        if choice in ("y", "yes"):
            print(f"\n(Would commit here with message:\n{message}\n)")
            return

        print("Please answer y, e, r, or n.")


if __name__ == "__main__":
    diff = get_diff_staged()
    run_interactive_loop(diff)
```

`truncate_diff` importa más aquí de lo que podría parecer a primera vista — mira la sección de pitfalls abajo para saber por qué un diff grande no es solo lento, puede fallar silenciosamente o producir un mensaje superficial y genérico. El bucle deliberadamente **no** llama a `git commit` todavía — el Paso 4 añade eso como su propia función pequeña y explícita, así que es obvio exactamente dónde y cómo sucede el commit.

Ejecútalo:

```bash
uv run python commit_helper.py
```

:::tip[¿Usando un proveedor diferente?]
Cambia el bloque `OpenAI(...)` por una `base_url` y clave diferentes — ej. `base_url="https://api.groq.com/openai/v1"` con `api_key=os.environ["GROQ_API_KEY"]` para Groq, o `base_url="https://generativelanguage.googleapis.com/v1beta/openai/"` con `api_key=os.environ["GOOGLE_API_KEY"]` para el endpoint compatible con OpenAI de Gemini. Todo lo demás en este archivo permanece igual. Mira [`examples/commit-message-agent/commit_helper.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent/commit_helper.py) en el repositorio del curso para ver los seis conectados lado a lado, seleccionables con una variable de entorno.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python commit_helper.py` imprime un borrador estilo Conventional Commits para un diff en stage real.</StepChecklistItem>
<StepChecklistItem>Escribir `r` en el prompt le pregunta al modelo de nuevo e imprime un borrador (posiblemente diferente), sin hacer nada más.</StepChecklistItem>
<StepChecklistItem>Escribir `n` cancela limpiamente, y escribir `e` te permite escribir un mensaje de reemplazo antes de continuar.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `draft_commit_message` retorna temprano con una cadena vacía cuando el diff está vacío, antes de siquiera construir un cliente `OpenAI`. ¿Por qué verificar primero, llamar a la API después, vale la pena hacerlo deliberadamente, en lugar de simplemente dejar que un prompt vacío vaya al modelo?
- Si dos ejecuciones diferentes de `draft_commit_message` sobre el *mismo* diff staged exacto produjeran dos mensajes visiblemente diferentes, ¿te sorprendería? ¿Qué sugiere eso sobre por qué existe siquiera la opción `r` (regenerar), en lugar de confiar ciegamente en el primer borrador?

## Paso 4: Conéctalo para que realmente confirme el commit — solo con confirmación

La última pieza: reemplaza el placeholder "(Confirmaría el commit aquí...)" del Paso 3 con una función que realmente ejecuta `git commit -m`, llamada desde exactamente un lugar — justo después de que el usuario escribe `y`.

```python
# commit_helper.py (continued)
def _commit(message: str) -> None:
    """Runs the actual `git commit -m <message>`.

    This is the ONLY function in this file that commits anything. It's only
    ever called from run_interactive_loop, only ever after an explicit 'y'
    from a human. There is no other code path that reaches it.
    """
    result = subprocess.run(
        ["git", "commit", "-m", message],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git commit failed:\n{result.stderr}")
    print(result.stdout)
    print("Committed.")


def run_interactive_loop(diff: str) -> None:
    if not diff.strip():
        print("No staged changes. Stage something first with `git add`.")
        return

    print(f"Drafting a commit message from {len(diff)} characters of staged diff...\n")
    message = draft_commit_message(diff)

    while True:
        print("-" * 60)
        print(message)
        print("-" * 60)
        choice = input("\nUse this message? [y]es / [e]dit / [r]egenerate / [n]o, cancel: ").strip().lower()

        if choice in ("n", "no"):
            print("Cancelled -- nothing was committed.")
            return
        if choice in ("r", "regenerate"):
            message = draft_commit_message(diff)
            continue
        if choice in ("e", "edit"):
            message = input("Type your edited message: ").strip() or message
            continue
        if choice in ("y", "yes"):
            _commit(message)
            return

        print("Please answer y, e, r, or n.")
```

Prueba el bucle completo contra un cambio real:

```bash
# make a small, real change
git add <the file you changed>
uv run python commit_helper.py
# read the draft, then type e to tweak it, r to try again, or y to commit for real
```

Verifica que realmente sucedió:

```bash
git log -1
```

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Escribir `y` en el prompt realmente crea un commit real — `git log -1` muestra el mensaje que aceptaste.</StepChecklistItem>
<StepChecklistItem>Escribir `n` en el prompt deja tus cambios en stage en stage y sin confirmar — no pasó nada.</StepChecklistItem>
<StepChecklistItem>Puedes señalar la única línea de código donde `git commit` realmente se invoca, y explicar por qué es alcanzable desde exactamente un lugar.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `_commit` es una función pequeña y separada en lugar de estar en línea dentro de la rama `y` del bucle. ¿Qué facilita mantenerla separada si más adelante quisieras registrar cada commit real que hace esta herramienta, o añadir una bandera `--dry-run` que la salte por completo?
- Imagina una versión de esta herramienta que se salta el prompt de confirmación y confirma automáticamente cada vez que el borrador del modelo parece "seguro." ¿Cuál es una forma realista en que eso podría salir mal en un diff que no revisaste completamente tú mismo antes de ponerlo en stage?

:::tip[Nunca dejes que una herramienta confirme un commit sin que un humano confirme primero el mensaje]
Esta es la lección más importante de este proyecto, más importante que cualquier línea de código específica: una herramienta que *redacta* un mensaje de commit es útil; una herramienta que *confirma* uno autónomamente es algo muy diferente y mucho más arriesgado — un mal borrador, un diff truncado que ocultó el cambio real, o un modelo que tuvo un mal día, y el historial ahora tiene un mensaje de commit que no describe lo que realmente pasó, con tu nombre en él. `_commit` es la única función aquí que toca `git commit`, y solo es alcanzable después de un `y` explícito. Eso no es una característica "auto-commit" faltante — es el diseño. Mantén ese límite si extiendes este proyecto tú mismo.
:::

## ⚠️ Errores comunes

- **Diffs enormes que exceden la ventana de contexto o la cuota de tokens de nivel gratuito.** Un diff de varios miles de líneas (una refactorización grande, una actualización de dependencia vendorizada) puede exceder lo que el modelo puede realmente atender, o simplemente exceder el límite de tokens por solicitud de tu nivel gratuito y fallar directamente. `truncate_diff` en el Paso 3 limita esto, pero la truncación significa que el modelo está redactando desde una vista parcial — para cambios genuinamente grandes, haz stage y commit en fragmentos más pequeños y lógicos en lugar de confiar en que un diff truncado produzca un mensaje preciso.
- **Poner en stage cambios no relacionados juntos.** Si `git add` recoge dos correcciones no relacionadas a la vez, ningún system prompt puede producir un mensaje de commit honesto y enfocado para ambas — el modelo elegirá una para describir e ignorará la otra, o escribirá un mensaje vago que no cubre bien ninguna. `git add -p` para poner en stage hunks selectivamente vale la pena aprenderlo junto con esta herramienta.
- **Tratar el borrador como siempre correcto.** El modelo no sabe *por qué* hiciste un cambio, solo lo que muestra el diff — puede malinterpretar la intención (llamando "fix" a una refactorización deliberada, por ejemplo) de formas que un humano mirando el mismo diff no haría. Leer el borrador antes de escribir `y`, no solo hojearlo, es todo el punto del paso de confirmación.
- **Confirmar archivos generados o vendorizados por accidente.** Un diff que toca `uv.lock`, un bundle minificado, o un archivo autogenerado desperdicia tokens y usualmente produce un mensaje genérico de baja calidad — revisa qué está en stage (`git status`, `git diff --staged --stat`) antes de ejecutar el redactor, no después.

## Lo que acabas de construir

Un CLI de mensajes de commit real y funcional: captura tu `git diff` en stage real vía `subprocess`, redacta un mensaje estilo Conventional Commits con un LLM de nivel gratuito guiado por un prompt diseñado específicamente para esta tarea, y solo ejecuta `git commit` después de que hayas leído el borrador y dicho sí explícitamente. Nada aquí es una simulación de juguete — apúntalo a tu propio trabajo en stage, o a un commit histórico real del propio repositorio de este curso, y funciona contra el texto real de cualquier forma.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/commit-message-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent) en el repositorio del curso es una versión más completa del código de arriba, con los seis proveedores de la tabla conectados lado a lado (seleccionados con una configuración `LLM_PROVIDER`) y un conjunto de opciones CLI `--dry-run`/`--commit`/`--stdin` ya incluidas. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Conecta esto como un [alias de git](https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases) real (ej. `git draft-commit = !uv run --project ~/commit-message-agent python commit_helper.py`) para que esté a un comando corto de distancia en cualquier repositorio, en lugar de siempre hacer `cd` a la carpeta de este proyecto.
- Añádelo como un prompt dentro de un hook de [pre-commit](https://pre-commit.com/) — en lugar de reemplazar `git commit` por completo, haz que el hook imprima el mensaje redactado como una *sugerencia* junto a cualquier mensaje que el desarrollador ya haya escrito, para que siga siendo una segunda opinión en lugar de una puerta.
- Prueba comparando borradores entre dos proveedores diferentes sobre el *mismo* diff en stage — ¿eligen el mismo `type` de Conventional Commits? ¿Dónde discrepan, y qué te dice eso sobre cuánto confiar en la lectura de un solo modelo sobre "por qué" se hizo un cambio, versus solo "qué" cambió?

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2027-commit-message-agent" />
