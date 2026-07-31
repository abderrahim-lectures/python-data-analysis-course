---
id: email-triage-agent
title: "Construye un Agente Personal de Triaje de Correo"
sidebar_label: "Construye un Agente Personal de Triaje de Correo"
slug: /projects/email-triage-agent
description: "Gradúate del playground del navegador a Python real: construye un agente que categoriza, prioriza, y redacta (pero nunca envía) respuestas para tu correo, usando un LLM de nivel gratuito."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Agente Personal de Triaje de Correo

<ProjectPublishedDate projectId="email-triage-agent" />

<ProjectGreeting />

Todo en el curso hasta ahora corrió en un playground aislado dentro del navegador — para que pudieras empezar a escribir Python desde el primer día sin ninguna configuración. Este proyecto es el paso de graduación: instala Python de verdad en tu propia máquina, y luego úsalo para construir algo genuinamente útil — un agente que lee un lote de correos, te dice cuáles realmente importan, y redacta una respuesta sugerida para los que necesitan una. Esto asume Python 101; no se requiere nada de Análisis de Datos.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Cargar una carpeta incluida de correos de ejemplo — no se requiere bandeja de entrada real, contraseña, ni configuración IMAP para completar este proyecto.
2. Obtener una clave de API de IA de nivel gratuito y escribir un prompt que categorice cada correo (urgente / necesita-respuesta / boletín / para-tu-info / posible-spam) y le asigne una prioridad.
3. Escribir un segundo prompt que redacte una respuesta sugerida para cualquier cosa que necesite una — y construir una regla dura que este agente nunca rompe: **nunca envía nada, jamás**. Cada borrador solo se imprime y guarda localmente para que tú lo leas y envíes tú mismo.
4. Ejecutar todo el pipeline de principio a fin y leer lo que produjo.
5. *(Opcional, "ve más allá")* Apunta el mismo script a tu propia bandeja de entrada real vía IMAP en lugar de los correos de ejemplo, usando una "contraseña de aplicación" de Gmail — no tu contraseña real.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado — es Python real corriendo en tu propia máquina, el mismo movimiento de "gradúate a Python real" que cualquier otro proyecto de esta serie. La lección central (Pasos 1–4) no necesita nada más que los correos de ejemplo incluidos, así que no hay compensación de privacidad de la que preocuparse incluso ejecutando localmente. La Configuración de abajo explica cómo instalar `uv`.

**GitHub Codespaces** funciona bien para la lección central: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta los mismos comandos `uv` exactos desde una terminal en tu pestaña del navegador. Los correos de ejemplo incluidos hacen de esta una forma genuinamente completa de hacer todo el proyecto con cero configuración local.

**Google Colab, Kaggle Notebooks, o Binder** también funcionan para la lección central — cero instalación, directo en tu navegador. El repositorio incluye un notebook listo para ejecutar que refleja exactamente los pasos de esta lección:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-triage-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-triage-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Femail-triage-agent%2Fnotebook.ipynb)

Haz clic en una insignia, ejecuta las celdas de arriba a abajo, y pega una clave de API de nivel gratuito cuando se te pida. Esta es una forma de menor fidelidad de experimentar el proyecto que un proyecto `uv` local real (sin archivos separados, sin estructura de proyecto real), así que trátalo como una forma rápida de experimentar en lugar del camino principal.

**Una nota sobre la extensión opcional de IMAP**: ninguna de las tres opciones de arriba es un buen lugar para escribir una contraseña de correo real, sea contraseña de aplicación o no. Si pruebas el paso opcional "ve más allá", hazlo localmente, en un archivo `.env` que nunca sale de tu máquina — no en una celda de notebook o un IDE en la nube que no controlas completamente.

## Configuración

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
uv init email-triage-agent
cd email-triage-agent
uv add openai python-dotenv
```

`openai` es la librería cliente que este proyecto usa para llamar al LLM — cada proveedor en la tabla de abajo resulta exponer un endpoint de Chat Completions compatible con OpenAI, así que una pequeña clase cliente cubre los seis, solo apuntada a una `base_url` diferente. `python-dotenv` te permite mantener tu clave de API en un archivo `.env` local en lugar de hacer `export` cada sesión.

### Obtén una clave de API de IA gratuita

**Elige el proveedor que prefieras** — ninguno requiere tarjeta de crédito al momento de escribir esto, y este curso no favorece a uno sobre otro.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(sugerido por defecto)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el scope `models: read` | Sin registro aparte — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada; usada en borradores anteriores de esta página. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

Sea cual sea el que elijas, el proceso es el mismo:

1. Inicia sesión y genera una clave de API en el sitio de ese proveedor.
2. **Nunca pegues esta clave directamente en el código ni la subas a un repositorio.** Crea en su lugar un archivo `.env` en la carpeta de tu proyecto:

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=tu-clave-aquí
```

`LLM_PROVIDER` le dice al script qué proveedor elegiste (`github`, `gemini`, `groq`, `mistral`, `cerebras`, u `openrouter`); por defecto es `github` si lo omites. Solo llena la única clave que realmente necesitas — la lista completa de nombres de variables está en el `.env.example` del ejemplo del repositorio.

:::tip[Un archivo .env suele ser más conveniente que export]
En lugar de hacer `export` de una clave en cada nueva sesión de terminal, `python-dotenv` lee `.env` automáticamente en el momento en que tu script llama a `load_dotenv()` — sin configuración por sesión, y ya está excluido de git vía `.gitignore` así que no puedes subir accidentalmente una clave real.
:::

Una clave de API es un secreto, exactamente como una contraseña — cualquiera que la tenga puede usar la cuota de tu cuenta. Tratarla como una variable de entorno en lugar de una cadena fija en el código es la práctica estándar exactamente por esta razón, y es el mismo hábito de seguridad del mundo real enseñado en el [proyecto de Agente de IA](/docs/projects/ai-agent).

Con `uv` instalado, el proyecto configurado, y `.env` completado, estás listo para construir — cada paso de aquí en adelante asume que todo esto ya está hecho.

## Paso 1: Carga e inspecciona los correos de ejemplo

El ejemplo del repositorio incluye seis correos de ejemplo cortos y realistas en `sample_emails/` — una solicitud urgente de cliente, un boletín, dos mensajes que genuinamente necesitan respuesta, una promoción de spam, y una notificación automática de información. Son archivos de texto plano con la forma de un `.eml` simplificado: algunas líneas `Encabezado: valor`, una línea en blanco, luego el cuerpo.

Crea `triage.py` y empieza con un pequeño analizador:

```python
# triage.py
"""Loads sample emails and will, by the end of this lesson, categorize,
prioritize, and draft replies for them using a free-tier LLM.

Run with: uv run python triage.py
"""

from dataclasses import dataclass
from pathlib import Path

SAMPLE_EMAILS_DIR = Path("sample_emails")


@dataclass
class Email:
    filename: str
    sender: str
    subject: str
    date: str
    body: str


def parse_email(path: Path) -> Email:
    """Parses one plain-text sample email: a few `Header: value` lines, a
    blank line, then the body -- the same shape as a real .eml file's
    headers, simplified so no email-parsing library is needed."""
    text = path.read_text(encoding="utf-8")
    header_text, _, body = text.partition("\n\n")
    headers = {}
    for line in header_text.splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            headers[key.strip().lower()] = value.strip()
    return Email(
        filename=path.name,
        sender=headers.get("from", "unknown"),
        subject=headers.get("subject", "(no subject)"),
        date=headers.get("date", "unknown"),
        body=body.strip(),
    )


def load_emails(directory: Path) -> list[Email]:
    """Loads every .txt file in `directory`, sorted by filename."""
    return [parse_email(p) for p in sorted(directory.glob("*.txt"))]


if __name__ == "__main__":
    emails = load_emails(SAMPLE_EMAILS_DIR)
    print(f"Loaded {len(emails)} email(s) from {SAMPLE_EMAILS_DIR}/\n")
    for email in emails:
        print(f"[{email.filename}] {email.subject!r} from {email.sender}")
```

Copia los seis archivos de ejemplo de la carpeta [`sample_emails/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-triage-agent/sample_emails) del ejemplo del repositorio a la carpeta `sample_emails/` de tu propio proyecto, luego ejecuta:

```bash
uv run python triage.py
```

`text.partition("\n\n")` está haciendo el trabajo real aquí: divide el archivo en exactamente dos piezas en la *primera* línea en blanco — todo antes de ella (los encabezados) y todo después (el cuerpo) — lo cual es suficiente estructura para trabajar sin traer una librería completa de análisis de correo para texto tan simple.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` se ejecuta sin errores e imprime seis correos cargados.</StepChecklistItem>
<StepChecklistItem>Cada línea impresa muestra un asunto y remitente reales, no `"unknown"` o `"(no subject)"`.</StepChecklistItem>
<StepChecklistItem>`sample_emails/` existe en la carpeta de tu proyecto y contiene los seis archivos `.txt`.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- `parse_email` busca la *primera* línea en blanco para separar encabezados del cuerpo. ¿Qué saldría mal si uno de los correos de ejemplo tuviera una línea en blanco en algún lugar dentro de su propio texto de cuerpo?
- Los archivos `.eml` reales pueden tener docenas de encabezados (`Message-ID`, `Content-Type`, `X-Mailer`, y más) que este analizador ignora silenciosamente al leer solo `from`, `subject`, y `date`. ¿Por qué es ignorar el resto la decisión correcta para este proyecto?

## Paso 2: Categoriza y prioriza cada correo con un LLM

Ahora entrega cada correo analizado a un modelo de lenguaje y pídele que lo clasifique en una categoría y una prioridad — el paso real de triaje. Añade esto a `triage.py`:

```python
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Every provider below exposes an OpenAI-compatible Chat Completions
# endpoint, so one client class covers all six -- only the base_url, model
# name, and which environment variable holds the key change.
PROVIDERS = {
    "github": {
        "base_url": "https://models.github.ai/inference",
        "api_key_env": "GITHUB_TOKEN",
        "model": "gpt-4o-mini",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "api_key_env": "GOOGLE_API_KEY",
        "model": "gemini-3.5-flash",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "api_key_env": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
    },
    "mistral": {
        "base_url": "https://api.mistral.ai/v1",
        "api_key_env": "MISTRAL_API_KEY",
        "model": "mistral-small-latest",
    },
    "cerebras": {
        "base_url": "https://api.cerebras.ai/v1",
        "api_key_env": "CEREBRAS_API_KEY",
        "model": "llama-3.3-70b",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "api_key_env": "OPENROUTER_API_KEY",
        "model": "meta-llama/llama-3.3-70b-instruct:free",
    },
}


def build_client() -> tuple[OpenAI, str]:
    """Builds an OpenAI-compatible client for LLM_PROVIDER (default "github").
    Returns (client, model_name)."""
    provider = os.environ.get("LLM_PROVIDER", "github")
    config = PROVIDERS[provider]
    client = OpenAI(api_key=os.environ[config["api_key_env"]], base_url=config["base_url"])
    return client, config["model"]


TRIAGE_PROMPT = """You are an email triage assistant. Read the email below and respond with ONLY a JSON object (no other text, no markdown fence), with these exact keys:

- "category": one of "urgent", "needs-reply", "newsletter", "fyi", "spam-ish"
- "priority": one of "high", "medium", "low"
- "reasoning": one short sentence explaining the category and priority
- "needs_reply": true or false

Email:
From: {sender}
Subject: {subject}
Date: {date}

{body}
"""


def triage_email(client: OpenAI, model: str, email: Email) -> dict:
    """Asks the LLM to categorize and prioritize one email. Read-only:
    never modifies or sends anything -- just returns the model's verdict."""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": TRIAGE_PROMPT.format(
            sender=email.sender, subject=email.subject, date=email.date, body=email.body,
        )}],
    )
    content = response.choices[0].message.content.strip()
    if content.startswith("```"):
        content = content.strip("`").removeprefix("json").strip()
    return json.loads(content)
```

Actualiza el bloque `if __name__ == "__main__":` para realmente llamarlo:

```python
if __name__ == "__main__":
    client, model = build_client()
    emails = load_emails(SAMPLE_EMAILS_DIR)
    print(f"Triaging {len(emails)} email(s) with model '{model}'...\n")
    for email in emails:
        verdict = triage_email(client, model, email)
        print(f"[{email.filename}] {email.subject!r}")
        print(f"  category: {verdict['category']}   priority: {verdict['priority']}")
        print(f"  reasoning: {verdict['reasoning']}\n")
```

```bash
uv run python triage.py
```

El prompt que pide "SOLO un objeto JSON" y luego lo analiza con `json.loads` es lo que convierte una respuesta de texto libre del modelo en algo sobre lo que tu código realmente puede ramificarse (`verdict["category"]`, `verdict["needs_reply"]`) — la misma idea que `int(input(...))` convierte texto de teclado escrito libremente en algo con lo que tu código puede hacer aritmética, solo con un modelo de lenguaje sustituyendo el teclado. Los modelos ocasionalmente envuelven JSON en una valla ` ```json ` a pesar de que se les dijo que no lo hicieran; la línea `content.strip("`")` está ahí específicamente para sobrevivir eso sin fallar.

:::tip[Pide un conjunto fijo de categorías, no texto libre]
`TRIAGE_PROMPT` detalla las cinco cadenas de categoría exactas permitidas en lugar de pedirle al modelo que "invente una categoría." Un modelo dado una lista fija y explícita es mucho más consistente de un correo al siguiente que uno al que se le pide inventar etiquetas libremente — lo cual importa aquí, ya que el código posterior (`if verdict["needs_reply"]` del Paso 3) depende de que los valores sean predecibles.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` imprime una línea de categoría, prioridad, y razonamiento para los seis correos de ejemplo.</StepChecklistItem>
<StepChecklistItem>El correo urgente del cliente y el boletín obtienen categorías y prioridades visiblemente diferentes.</StepChecklistItem>
<StepChecklistItem>Sin `JSONDecodeError` — si ves uno, imprime la cadena `content` cruda antes de analizarla para ver qué realmente devolvió el modelo.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- El correo de promoción de spam (`04_spammy_promo.txt`) usa lenguaje de urgencia ("actúa ahora," "expira en 24 horas") muy similar al correo genuinamente urgente del cliente. ¿Qué en el *contenido* de cada correo (más allá del tono) le permitiría a un lector cuidadoso — o a un prompt cuidadoso — distinguirlos?
- ¿Qué esperarías que pasara si eliminaras la instrucción "responde con SOLO un objeto JSON" y simplemente le pidieras al modelo "categoriza este correo"? Pruébalo, y observa qué se rompe en tu código Python como resultado.

## Paso 3: Redacta (pero nunca envíes) una respuesta

Este es el paso donde "agente" empieza a significar algo más que "categorizador" — para cualquier cosa que el modelo marcó `needs_reply: true`, pídele que redacte una respuesta real. Pero este es también donde este proyecto traza una línea dura: **el agente solo redacta texto. Nunca envía nada, a nadie, bajo ninguna condición.** No hay código SMTP en este proyecto en absoluto — no comentado, no detrás de una bandera, simplemente no presente, porque un script que *puede* enviar correo está a un bug o un mal prompt de distancia de realmente hacerlo.

Añade esto a `triage.py`:

```python
DRAFT_REPLY_PROMPT = """Draft a short, professional reply to the email below. Write ONLY the reply body text -- no subject line, no commentary about what you're doing, just the reply itself, as if the recipient is about to review and send it.

Original email:
From: {sender}
Subject: {subject}

{body}
"""


def draft_reply(client: OpenAI, model: str, email: Email) -> str:
    """Asks the LLM to draft a reply. The result is ALWAYS just printed and
    saved to a local file for a human to review -- this function has no
    way to actually send anything, on purpose."""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": DRAFT_REPLY_PROMPT.format(
            sender=email.sender, subject=email.subject, body=email.body,
        )}],
    )
    return response.choices[0].message.content.strip()
```

:::tip[Nunca dejes que un agente envíe nada sin que tú estés en el ciclo]
Esta es la lección más importante de este proyecto, más importante que cualquier línea de código específica: un agente que puede *redactar* una respuesta es útil; un agente que puede *enviar* una autónomamente es algo muy diferente y mucho más arriesgado — una categorización incorrecta, una instrucción inyectada por prompt escondida en el cuerpo de un mensaje, o un modelo que tuvo un mal día, y envió algo que nunca aprobaste, a alguien real, que no puedes deshacer. La función `draft_reply` de este proyecto devuelve una cadena y no hace nada más — sin `smtplib`, sin "auto-enviar si la confianza es alta," sin nada automático. Eso no es una característica faltante. Es el diseño. Mantén ese límite si extiendes este proyecto tú mismo.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`draft_reply` está definida, toma un `Email`, y devuelve una cadena simple — nada en ella toca la red excepto la única llamada a la API del LLM.</StepChecklistItem>
<StepChecklistItem>Puedes señalar el lugar exacto en tu código donde una respuesta necesitaría enviarse, y confirmar que ese código no existe.</StepChecklistItem>
<StepChecklistItem>Entiendes *por qué* esto importa, no solo que es una regla — mira las preguntas socráticas de abajo.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Imagina una versión de este proyecto que auto-envía una respuesta cada vez que el modelo reporta alta confianza. ¿Cuál es una forma realista en que eso podría salir mal — para el correo urgente del cliente específicamente, o para la promoción de spam?
- Uno de los correos de ejemplo (`04_spammy_promo.txt`) contiene lenguaje manipulador diseñado para hacer que un lector actúe rápido sin pensar. Si un atacante real elaborara un correo específicamente para manipular un *agente de IA* que lo lee (en lugar de un humano), ¿cómo se vería eso, y cómo protegería el nunca-auto-enviar contra ello incluso si el paso de categorización fuera engañado?

## Paso 4: Ejecútalo de principio a fin y revisa la salida

Conecta todo — categoriza cada correo, redacta una respuesta para los que necesitan una, y guarda cada borrador en una carpeta local `drafts/` en lugar de imprimir muros de texto en la terminal:

```python
DRAFTS_DIR = Path("drafts")

if __name__ == "__main__":
    client, model = build_client()
    emails = load_emails(SAMPLE_EMAILS_DIR)
    DRAFTS_DIR.mkdir(exist_ok=True)
    print(f"Triaging {len(emails)} email(s) with model '{model}'...\n")

    for email in emails:
        verdict = triage_email(client, model, email)
        print(f"[{email.filename}] {email.subject!r}")
        print(f"  category: {verdict['category']}   priority: {verdict['priority']}")
        print(f"  reasoning: {verdict['reasoning']}")

        if verdict.get("needs_reply"):
            reply = draft_reply(client, model, email)
            draft_path = DRAFTS_DIR / f"{Path(email.filename).stem}_draft_reply.txt"
            draft_path.write_text(reply, encoding="utf-8")
            print(f"  -> draft reply saved to {draft_path}  (NOT sent -- review and send yourself)")
        print()

    print(f"Done. Review anything in {DRAFTS_DIR}/ yourself before sending.")
```

```bash
uv run python triage.py
```

Abre los archivos en `drafts/` y realmente léelos — este es el punto de todo el proyecto. ¿Enviarías lo que el modelo redactó, tal cual? ¿Lo editarías primero? Para al menos un borrador, reescríbelo en tus propias palabras antes de considerarlo "terminado" — ese paso editorial es exactamente el paso humano-en-el-ciclo alrededor del cual está construido este proyecto, no una idea tardía atornillada encima.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` corre hasta completarse e imprime una línea de triaje para los seis correos de ejemplo.</StepChecklistItem>
<StepChecklistItem>`drafts/` contiene una respuesta guardada para cada correo que el modelo marcó `needs_reply: true`, y ningún archivo para los que no.</StepChecklistItem>
<StepChecklistItem>Realmente has abierto y leído al menos un borrador de respuesta, y podrías decir si lo enviarías tal cual o lo editarías primero.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

- Lee el borrador de respuesta para `03_needs_reply_coworker.txt` (la discrepancia de números del Q3). ¿Realmente resuelve la discrepancia, o solo reconoce la pregunta? ¿Qué te dice eso sobre lo que un modelo de redacción puede y no puede hacer por sí solo?
- Si ejecutaras este script dos veces sobre el mismo correo, ¿esperarías que las dos respuestas de borrador fueran idénticas? Pruébalo. ¿Qué te dice la respuesta sobre confiar en una sola salida de LLM como si fuera una función fija y determinista?

## Opcional, "ve más allá": conecta esto a una bandeja de entrada real

Todo lo de arriba corre completamente sobre los correos de ejemplo incluidos — sin bandeja de entrada real, sin contraseña real, nada que salga de tu máquina. Esta sección deliberadamente **no** es el camino principal: es una extensión opcional para cuando te sientas cómodo con cómo se comporta el script, no algo a lo que recurrir el primer día.

Gmail (y la mayoría de proveedores) soportan **Contraseñas de Aplicación** — una contraseña separada, revocable, de propósito limitado que generas específicamente para una aplicación, en lugar de entregarle a esa aplicación tu contraseña de cuenta real. Si tu contraseña real alguna vez necesita cambiar, una contraseña de aplicación puede revocarse independientemente; si ella alguna vez necesita cambiar, no toca tus credenciales de inicio de sesión reales en absoluto. Para crear una para Gmail: activa la Verificación en dos pasos en tu cuenta de Google, luego visita [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) y genera una nueva contraseña de aplicación para "Correo." Usa *esa* contraseña generada, nunca tu contraseña real de Gmail, en cualquier lugar de este proyecto.

Instala el paquete opcional `imap-tools` (no parte de las dependencias de la lección central) y añade tus credenciales IMAP a `.env`:

```bash
uv add imap-tools
```

```bash
# .env — add these three lines
IMAP_HOST=imap.gmail.com
IMAP_USER=tu@gmail.com
IMAP_APP_PASSWORD=tu-contraseña-de-aplicación-aquí
```

El [`fetch_from_imap.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-triage-agent/fetch_from_imap.py) del ejemplo del repositorio obtiene tus mensajes no leídos más recientes de **solo lectura** — `mark_seen=False` significa que descargar un mensaje aquí no lo marca como leído en tu bandeja de entrada real — y guarda cada uno como un archivo `.txt` local con exactamente la misma forma que los correos de ejemplo de `triage.py`:

```bash
uv run python fetch_from_imap.py
uv run python triage.py real_emails
```

Si no usas Gmail, la mayoría de proveedores soportan IMAP con una contraseña de aplicación o equivalente — revisa la configuración de seguridad de cuenta de tu proveedor para la opción equivalente, y ajusta `IMAP_HOST` en consecuencia.

:::tip[Mínimo privilegio, aplicado a tu propia bandeja de entrada]
Una contraseña de aplicación limitada solo a "Correo," que puedes revocar en cualquier momento sin tocar tu inicio de sesión real, es la misma idea de *mínimo privilegio* detrás de las claves de API, permisos de archivo, y tokens de acceso limitados en otros lugares de este curso — otorga la menor cantidad de acceso que haga el trabajo, no tu cuenta completa. Nunca uses tu contraseña real de Gmail aquí, y nunca omitas la Verificación en dos pasos para hacer la configuración más rápida.
:::

## ⚠️ Errores comunes

- **El modelo no devuelve JSON válido.** A pesar de la instrucción "SOLO un objeto JSON" del prompt, un modelo puede ocasionalmente añadir una oración perdida o envolver la salida en una valla de código. Si `json.loads` lanza un error, imprime primero la cadena `content` cruda para ver exactamente qué volvió antes de asumir que tu código tiene la culpa.
- **Confundir "redactado" con "enviado".** Un archivo guardado en `drafts/` no es un correo enviado — nada ha ido a ningún lado todavía. Si quieres realmente responder, abre tu cliente de correo real y copia el borrador tú mismo; ese es el diseño, no un paso faltante.
- **Límites de tasa en el nivel gratuito del LLM.** Seis correos son dos llamadas al LLM cada uno (triaje, más un borrador para cualquiera que necesite respuesta) — suficiente para ocasionalmente golpear un 429 en un nivel gratuito. Esto no es un bug; mira la sección "Manejo de límites de tasa" del [proyecto de Agente de IA](/docs/projects/ai-agent) para el mismo patrón y un enfoque de reintento que puedes copiar.
- **Tratar las etiquetas de categoría/prioridad como verdad absoluta.** El veredicto `"urgent"` o `"spam-ish"` del modelo es una sugerencia, no un hecho — puede juzgar mal un mensaje corto pero genuinamente urgente como de baja prioridad, o una lista de correo legítima como spam. Revisa la categorización tú mismo antes de confiar ciegamente en ella, especialmente al principio.

## Lo que acabas de construir

Un pipeline de triaje pequeño pero completo: analiza, categoriza con un LLM, redacta con una segunda llamada al LLM, y — de manera crítica — se detiene ahí. Nada aquí es una simplificación de juguete del límite de seguridad; un asistente de correo de producción manejando tu bandeja de entrada real debería trazar exactamente la misma línea entre "el agente decide qué decir" y "un humano decide si realmente decirlo," solo con más correos y posiblemente más categorías. El tamaño de la bandeja de entrada cambia; el límite no debería.

## A dónde ir desde aquí

- Añade más categorías o una escala de prioridad más fina, y ve cómo necesita cambiar el prompt para mantener al modelo consistente a medida que crece el conjunto de etiquetas.
- Extiende `parse_email` para manejar archivos `.eml` reales (el módulo integrado `email` de Python analiza estos correctamente, incluyendo adjuntos y cuerpos multipart) en lugar del formato de texto plano simplificado usado aquí.
- Prueba una segunda llamada al LLM que revise el borrador del *primer* modelo antes de guardarlo — un patrón simple de dos pasadas de "redactar, luego criticar," y una primera probada suave de pipelines de agente de múltiples pasos como los del [proyecto de Agente de IA](/docs/projects/ai-agent).

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="email-triage-agent" />
