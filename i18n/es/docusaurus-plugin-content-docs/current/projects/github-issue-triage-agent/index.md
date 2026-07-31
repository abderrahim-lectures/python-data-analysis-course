---
id: github-issue-triage-agent
title: "Construye un Agente de Triaje de Issues de GitHub"
sidebar_label: "Construye un Agente de Triaje de Issues de GitHub"
slug: /projects/github-issue-triage-agent
description: "Gradúate del playground del navegador a Python real: obtén issues abiertos de un repositorio público real de GitHub y usa un LLM de nivel gratuito para redactar sugerencias de etiquetas de triaje para que un mantenedor humano las revise."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Agente de Triaje de Issues de GitHub

<ProjectPublishedDate projectId="github-issue-triage-agent" />

<ProjectGreeting />

Cada repositorio de código abierto con algo de tráfico acumula un backlog de issues sin triar — reportes de bugs, solicitudes de características, preguntas, y duplicados, todos sentados ahí sin etiquetar hasta que un mantenedor tiene tiempo de ordenarlos a mano. Este proyecto construye un pequeño script que hace la primera pasada por ellos: obtiene los issues ABIERTOS de un repositorio público real directamente de la propia API de GitHub, envía cada uno a un LLM de nivel gratuito, e imprime un reporte sugiriendo una etiqueta de triaje y una justificación de una oración para cada issue — el tipo de cosa que un mantenedor podría hojear en un minuto en lugar de leer cada issue desde cero.

Esto asume Python 101 — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Instalar `uv`, obtener una clave de API de un LLM de nivel gratuito, y configurar un pequeño proyecto.
2. Obtener issues ABIERTOS de un repositorio público real de GitHub usando la API REST gratuita de GitHub — sin autenticación requerida para lecturas públicas.
3. Escribir un prompt que convierta el título y cuerpo de un issue en una solicitud de una etiqueta de triaje sugerida y una justificación de una oración.
4. Llamar al LLM para cada issue y analizar su respuesta.
5. Imprimir un reporte de triaje legible, y ejecutar todo de principio a fin contra un repositorio real.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado — el mismo movimiento de "gradúate a Python real" que cualquier otro proyecto de esta sección.

**GitHub Codespaces** funciona igual de bien, y es notablemente conveniente para este proyecto en particular: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ya estás sentado dentro de un entorno consciente de `git`/`gh` con una identidad real de GitHub adjunta — un ajuste natural para un proyecto que trata completamente sobre repositorios e issues de GitHub.

**Google Colab o Kaggle Notebooks** también están bien aquí — este es un script ligero que llama a APIs sin servidor de archivos local ni proceso de larga duración que gestionar, así que `!pip install requests python-dotenv openai` en una celda seguido de pegar el código como celdas de notebook funciona sin mucha adaptación. Una versión de notebook lista está en [`examples/github-issue-triage-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-issue-triage-agent/notebook.ipynb) si prefieres no pegar el código tú mismo:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-issue-triage-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-issue-triage-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgithub-issue-triage-agent%2Fnotebook.ipynb)

## Configuración

### 1. Instala `uv`

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

### 2. Configura el proyecto

```bash
uv init github-issue-triage-agent
cd github-issue-triage-agent
uv add requests python-dotenv openai
```

`requests` obtiene issues de la API REST de GitHub; `python-dotenv` carga tu clave de API de un archivo `.env` local; `openai` es el cliente usado para llamar a GitHub Models por defecto (su API es compatible con OpenAI) — mira el tip abajo si eliges un proveedor de LLM diferente.

### 3. Obtén una clave de API de LLM gratuita

**Elige el proveedor que prefieras** — ninguno requiere tarjeta de crédito al momento de escribir esto, y este curso no favorece a uno sobre otro. El ejemplo más completo en el repositorio del curso ([`examples/github-issue-triage-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent)) soporta los seis de fábrica, seleccionables con una sola configuración.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(sugerido por defecto)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el scope `models: read` | Sin registro aparte — ya tienes una cuenta de GitHub, y este proyecto ya necesita una para la API de issues. Límites de nivel gratuito más generosos que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada; usada en borradores anteriores de esta página. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

Sea cual sea el que elijas, el proceso es el mismo: inicia sesión y genera una clave de API en el sitio de ese proveedor, luego **nunca la pegues directamente en el código ni la subas a un repositorio** — ponla en un archivo `.env` en su lugar (siguiente sección).

:::tip[¿Usando un proveedor diferente a GitHub Models?]
El código de esta lección usa el paquete `openai` para llamar a GitHub Models, ya que GitHub Models, Cerebras, y OpenRouter son todos compatibles con OpenAI (mismo cliente, `base_url` diferente). Gemini, Groq, y Mistral necesitan su propio SDK — `uv add google-generativeai`, `uv add groq`, o `uv add mistralai` respectivamente — y un pequeño cambio en `call_llm` abajo. El ejemplo más completo del repositorio ([`examples/github-issue-triage-agent/triage.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent)) ya tiene los seis conectados lado a lado.
:::

### 4. Crea tu archivo `.env`

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=tu-clave-de-proveedor-de-llm-aquí

# Optional -- see Step 1 below. Raises GitHub's API rate limit; not required.
GITHUB_API_TOKEN=
```

`GITHUB_TOKEN` aquí es tu clave de **proveedor de LLM** (GitHub Models específicamente) — no es necesario que sea el mismo token que `GITHUB_API_TOKEN`, que es un token completamente separado y opcional usado solo para el paso de obtención de issues de abajo. Está bien que sean el mismo token de acceso personal si generaste uno pensando en ambos usos, pero ni este proyecto ni GitHub lo requieren.

## Paso 1: Obtén issues abiertos de un repositorio real

GitHub expone una API REST gratuita para leer datos de repositorios públicos — no se necesita autenticación para leer issues de un repositorio público. Crea `triage.py`:

```python
# triage.py
import requests

GITHUB_API_URL = "https://api.github.com"


def fetch_open_issues(owner: str, repo: str, limit: int = 10) -> list[dict]:
    """Fetch up to `limit` OPEN issues from a public GitHub repo."""
    response = requests.get(
        f"{GITHUB_API_URL}/repos/{owner}/{repo}/issues",
        params={"state": "open", "per_page": min(limit, 100), "sort": "updated"},
        headers={"Accept": "application/vnd.github+json"},
        timeout=10,
    )
    response.raise_for_status()
    # GitHub's /issues endpoint also returns pull requests -- a PR *is* an
    # issue internally. Real issues lack a "pull_request" key, so filter it.
    issues = [item for item in response.json() if "pull_request" not in item]
    return issues[:limit]


if __name__ == "__main__":
    issues = fetch_open_issues("psf", "requests", limit=10)
    for issue in issues:
        print(f"#{issue['number']}: {issue['title']}")
```

```bash
uv run python triage.py
```

Deberías ver hasta 10 líneas, cada una un número y título de issue real y actualmente abierto de [`psf/requests`](https://github.com/psf/requests). `params={"state": "open", ...}` está haciendo el filtrado importante aquí — el comportamiento por defecto de GitHub también incluiría issues cerrados, y este proyecto solo se preocupa por los que todavía necesitan triaje.

:::tip[El límite de tasa sin autenticar de GitHub es bajo]
Las solicitudes sin autenticar a la API REST de GitHub están limitadas a **60 solicitudes/hora, por dirección IP** — fácil de alcanzar si estás volviendo a ejecutar este script mucho mientras desarrollas, o compartiendo una IP con compañeros en la misma red. Esta lección solo hace una solicitud de API por ejecución (una llamada obtiene hasta 100 issues a la vez), así que probablemente no lo alcances solo siguiendo el tutorial — pero si ves un `403` con un mensaje sobre límite de tasa, eso es lo que pasó. Configurar `GITHUB_API_TOKEN` (cualquier token de acceso personal, no se requieren scopes para lecturas públicas) en tu `.env` eleva el límite a 5,000 solicitudes/hora — mira el paso opcional en la Configuración de arriba.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` se ejecuta sin errores e imprime números y títulos de issues reales.</StepChecklistItem>
<StepChecklistItem>Ninguna línea impresa es un pull request — verifica un par de los números impresos contra la pestaña real de Issues del repositorio en GitHub.</StepChecklistItem>
<StepChecklistItem>Cambiar `owner`/`repo` a un repositorio público real diferente sigue funcionando.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- El filtro `"pull_request" not in item` corre *después* de que la solicitud regresa, sobre datos que GitHub ya te envió. ¿Podrías en su lugar pedirle a GitHub que excluya pull requests en la solicitud misma? ¿Qué necesitarías verificar en la documentación de la API de GitHub para averiguarlo?
- `sort="updated"` significa que los 10 issues que obtienes son los 10 *actualizados más recientemente*, no los 10 más antiguos o creados más recientemente. ¿Por qué "actualizado más recientemente" podría ser un valor por defecto más útil para una herramienta de triaje que "creado más recientemente"?

## Paso 2: Escribe un prompt de sugerencia de triaje por issue

Cada issue necesita convertirse en un prompt que le pida al modelo exactamente dos cosas: una etiqueta de una lista fija, y una justificación de una oración. Añade esto a `triage.py`:

```python
MAX_BODY_CHARS = 2000  # keep each issue's body well inside any model's context window
LABEL_CHOICES = ["bug", "feature", "question", "docs", "duplicate-looking", "other"]


def build_triage_prompt(issue: dict) -> str:
    title = issue.get("title") or "(no title)"
    body = (issue.get("body") or "(no description provided)")[:MAX_BODY_CHARS]

    return (
        "You are drafting a SUGGESTION for a human maintainer triaging a GitHub "
        "issue. You are not applying anything -- your output will be reviewed by "
        "a person before any label is added.\n\n"
        f"Choose exactly one label from this list: {', '.join(LABEL_CHOICES)}.\n\n"
        f"Issue title: {title}\n"
        f"Issue body:\n{body}\n\n"
        "Reply in exactly this two-line format, nothing else:\n"
        "Label: <one label from the list>\n"
        "Rationale: <one sentence explaining the suggested label and its priority>"
    )
```

Dos decisiones deliberadas aquí. Primero, `MAX_BODY_CHARS` trunca el cuerpo del issue — algunos issues llegan a miles de palabras (stack traces pegados, logs largos), y no hay beneficio en gastar tokens en más de lo que el modelo necesita para captar la idea; mira la sección de pitfalls abajo para lo que pasa si omites esto. Segundo, el prompt pide un formato de respuesta fijo y simple de dos líneas (`Label: ...` / `Rationale: ...`) en lugar de JSON — más fácil de seguir de forma confiable para un modelo pequeño de nivel gratuito, y suficientemente fácil de analizar con métodos de cadena simples en el siguiente paso.

:::tip["Sugerir, no aplicar" es una instrucción estructural, no un detalle amable]
Nota que el prompt le dice explícitamente al modelo que está redactando una sugerencia para revisión humana, no aplicando nada. Este script respalda eso con comportamiento real, no solo con palabras: nada en `triage.py` llama jamás a un endpoint de GitHub que agregaría una etiqueta o comentario a un issue real — solo lee issues e imprime texto en tu terminal. Ese es un límite de seguridad deliberado, el mismo principio detrás de cualquier herramienta de IA que toca las cosas de otras personas: redacta con confianza, actúa solo con un humano en el ciclo, especialmente para algo tan fácil de malinterpretar sutilmente como una lectura de una oración del reporte de bug de otra persona.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`build_triage_prompt` incluye el título y (truncado) cuerpo reales del issue, no texto de marcador de posición.</StepChecklistItem>
<StepChecklistItem>El prompt lista todas las `LABEL_CHOICES` explícitamente, no una instrucción vaga de "elige una etiqueta".</StepChecklistItem>
<StepChecklistItem>Imprimir `build_triage_prompt(issues[0])` para un issue real obtenido produce un prompt bien formado y legible.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué restringir al modelo a una lista fija de `LABEL_CHOICES` en lugar de dejarlo inventar cualquier etiqueta que quiera? ¿Qué perderías si eliminaras esa restricción?
- Si el cuerpo de un issue está vacío (algunos issues realmente no tienen ninguno), ¿qué envía actualmente `build_triage_prompt` al modelo? ¿Es eso un prompt razonable, o lo mejorarías?

## Paso 3: Llama al LLM y analiza su respuesta

Ahora conecta una llamada real al LLM, y convierte su respuesta de dos líneas de vuelta en un `dict` de Python utilizable:

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)


def call_llm(prompt: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before relying on it
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,  # a triage suggestion should be consistent, not creative
    )
    return response.choices[0].message.content or ""


def parse_triage_reply(reply: str) -> dict:
    label, rationale = "other", reply.strip()
    for line in reply.splitlines():
        if line.lower().startswith("label:"):
            candidate = line.split(":", 1)[1].strip().lower()
            label = candidate if candidate in LABEL_CHOICES else candidate or "other"
        elif line.lower().startswith("rationale:"):
            rationale = line.split(":", 1)[1].strip()
    return {"label": label, "rationale": rationale}


def suggest_triage(issue: dict) -> dict:
    reply = call_llm(build_triage_prompt(issue))
    return parse_triage_reply(reply)
```

No olvides `from dotenv import load_dotenv` más `load_dotenv()` cerca de la parte superior del archivo, para que `os.environ["GITHUB_TOKEN"]` realmente encuentre la clave de tu archivo `.env` — mismo patrón que el [proyecto de Agente de IA](/docs/projects/ai-agent).

`parse_triage_reply` deliberadamente recurre a `label="other"` y la respuesta cruda como justificación si el modelo no sigue el formato de dos líneas solicitado exactamente — los modelos de nivel gratuito ocasionalmente añaden texto perdido o se saltan una línea, y un *borrador* de triaje ligeramente malformado sigue siendo más útil impreso para que un humano lo hojee que descartado silenciosamente por un error de análisis.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Llamar a `suggest_triage` en un issue real obtenido devuelve un `dict` con una `label` real y una `rationale` real del tamaño de una oración — no un error o cadenas vacías.</StepChecklistItem>
<StepChecklistItem>La `label` devuelta siempre es una de `LABEL_CHOICES` (o el respaldo `"other"`), nunca texto arbitrario filtrándose sin analizar.</StepChecklistItem>
<StepChecklistItem>Alimentar deliberadamente a `parse_triage_reply` con una respuesta malformada (ej. solo `"I think this is a bug"`, sin líneas `Label:`/`Rationale:`) no falla — recurre a un respaldo con elegancia.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `temperature=0.2` sesga al modelo hacia su respuesta más probable y menos "creativa". ¿Por qué podría importar más una temperatura baja para una herramienta de triaje que para, digamos, un asistente de escritura creativa?
- Si ejecutaras `suggest_triage` en el *mismo* issue dos veces, ¿esperarías exactamente la misma justificación ambas veces? ¿Qué sugiere tu respuesta sobre cuánto debería confiar un mantenedor en una sola sugerencia versus tratarla como un punto de datos?

## Paso 4: Imprime el reporte y ejecútalo de principio a fin

Junta todo el pipeline — obtén, sugiere, reporta:

```python
import time


def print_triage_report(owner: str, repo: str, issues: list[dict], suggestions: list[dict]) -> None:
    print("=" * 72)
    print(f"Triage suggestions for {owner}/{repo} -- {len(issues)} open issue(s)")
    print("These are DRAFT suggestions. Review each one before applying any label.")
    print("=" * 72)
    for issue, suggestion in zip(issues, suggestions):
        print(f"\n#{issue['number']}: {issue['title']}")
        print(f"  {issue['html_url']}")
        print(f"  Suggested label: {suggestion['label']}")
        print(f"  Rationale:       {suggestion['rationale']}")


if __name__ == "__main__":
    owner, repo = "psf", "requests"
    issues = fetch_open_issues(owner, repo, limit=10)

    suggestions = []
    for issue in issues:
        suggestions.append(suggest_triage(issue))
        time.sleep(0.5)  # a small, deliberate gap between LLM calls

    print_triage_report(owner, repo, issues, suggestions)
```

```bash
uv run python triage.py
```

Deberías ver un reporte completo: un encabezado nombrando el repositorio y conteo de issues, luego un bloque por issue con su número, título, URL real de GitHub, etiqueta sugerida, y justificación de una oración — más esa línea recordatorio arriba de que estos son borradores, no cambios aplicados. Intenta apuntar `owner`/`repo` a un repositorio público real y activo diferente (cualquiera con issues abiertos funciona) y confirma que el reporte se adapta a contenido de issue genuinamente diferente, no solo repitiendo la misma salida.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Ejecutar `triage.py` de principio a fin imprime un reporte completo sin tracebacks sin manejar.</StepChecklistItem>
<StepChecklistItem>Cada issue en el reporte tiene una URL real de GitHub, una etiqueta sugerida, y una justificación no vacía.</StepChecklistItem>
<StepChecklistItem>Ejecutarlo contra un segundo repositorio público real y diferente produce sugerencias genuinamente diferentes, no un reporte que parece copiado y pegado.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Si dos issues en el mismo repositorio son casi duplicados uno del otro, ¿lo notaría este script? ¿Qué se necesitaría para añadir una sugerencia de "posible duplicado de #N" — qué información extra necesitaría el prompt?
- Ahora mismo cada issue obtiene su propia llamada separada al LLM. ¿Qué cambiaría, para bien o para mal, si en su lugar enviaras los 10 issues al modelo en un solo prompt y pidieras 10 sugerencias etiquetadas de vuelta a la vez?

## ⚠️ Errores comunes

- **Alcanzar el límite de tasa sin autenticar de GitHub en un repositorio ocupado o un ciclo de desarrollo rápido.** 60 solicitudes/hora suena a mucho hasta que estás volviendo a ejecutar el script cada minuto mientras depuras. Un `403` mencionando límite de tasa significa esto, no un bug en tu código — configura `GITHUB_API_TOKEN` en `.env` para elevarlo a 5,000/hora.
- **Issues con cuerpos muy largos excediendo el contexto de un modelo, o simplemente desperdiciando tokens/cuota.** Algunos issues incluyen stack traces completos, logs pegados, o capturas de pantalla incrustadas como texto que llegan a miles de palabras. `MAX_BODY_CHARS` trunca esto — elimina esa truncación y arriesgas una solicitud que es lenta, costosa contra tu cuota de nivel gratuito, o en casos raros demasiado grande para el modelo por completo.
- **Tratar la sugerencia del LLM como verdad absoluta en lugar de un borrador.** Un modelo de nivel gratuito leyendo un título y un cuerpo truncado no tiene acceso a las convenciones reales del repositorio, su taxonomía de etiquetas, o contexto de issues relacionados — puede etiquetar mal un bug real como una "pregunta", o pasar por alto que dos issues son duplicados. Siempre enmarca esto como acelerando la primera pasada de un humano, nunca como un reemplazo de una.
- **Olvidar que el endpoint `/issues` de GitHub también devuelve pull requests.** Omite el filtro `"pull_request" not in item` del Paso 1 y terminarás pidiéndole a un LLM que triaje PRs como si fueran reportes de bugs — un resultado confuso e incorrecto para algo que no es un issue en absoluto.

## Lo que acabas de construir

Un pipeline real de obtener → prompt → sugerir → reportar contra un repositorio público y en vivo de GitHub — no un dataset de juguete. La forma aquí generaliza bien más allá del triaje: cualquier flujo de trabajo donde quieras que un LLM redacte un juicio de primera pasada sobre un lote de elementos del mundo real (tickets de soporte, descripciones de pull requests, mensajes de clientes) para que un humano revise sigue el mismo ciclo de obtener-un-elemento, construir-un-prompt-enfocado, llamar-al-modelo, reportar-el-resultado que acabas de escribir.

## A dónde ir desde aquí

- **Realmente aplicar etiquetas — con cuidado, una vez que confíes en las sugerencias.** El [CLI `gh`](https://cli.github.com/) (`gh issue edit 123 --add-label bug`) o el propio endpoint de edición de issues de la API de GitHub puede agregar una etiqueta de verdad. Si construyes esto, mantén un humano explícitamente en el ciclo — ej. imprime las sugerencias primero, pide confirmación por issue (o por lote) antes de llamar a la API, y nunca apliques automáticamente una etiqueta directamente de la primera pasada de un modelo. Trata el acceso de escritura a los issues del repositorio de otra persona con cuidado real, especialmente uno que no mantienes tú mismo.
- **Agrupa múltiples issues en una sola llamada al LLM** en lugar de una llamada por issue — menos viajes de ida y vuelta, pero un prompt más complejo y un problema de análisis más difícil (el modo estructurado de salida/JSON vale la pena explorarlo aquí).
- **Añade una verificación de "posible duplicado"** haciendo embedding de los títulos de issues (mira el [proyecto RAG](/docs/projects/rag-notes) para el patrón de embeddings) y marcando pares que son sospechosamente similares, en lugar de depender de que el LLM recuerde cada otro issue abierto por sí solo.
- **Cachea resultados** para que volver a ejecutar el script no vuelva a triar issues que ya has revisado — un archivo JSON simple indexado por número de issue, verificado antes de cada llamada al LLM, es suficiente para una primera versión.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/github-issue-triage-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent) en el repositorio del curso es una versión más completa del código de arriba, con los seis proveedores de la tabla conectados lado a lado, seleccionables con una configuración, más un `GITHUB_API_TOKEN` opcional para el límite de tasa más alto de GitHub. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, y `uv` ya instalados) y ejecútalo desde ahí.
:::

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="github-issue-triage-agent" />
