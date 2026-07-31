---
id: 2027-browser-automation-agent
title: "Construye un Agente de Automatización de Navegador"
sidebar_label: "Agente de Automatización de Navegador"
slug: /projects/browser-automation-agent
description: "Combina la automatización de navegador de Playwright con un agente LLM de nivel gratuito que llama herramientas y llena por sí solo un formulario web de práctica real."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Agente de Automatización de Navegador

<ProjectPublishedDate projectId="2027-browser-automation-agent" />

<ProjectGreeting />

Cada otro proyecto de esta sección habla con una API o lee archivos locales. Este conduce un navegador real — haciendo clic, escribiendo y leyendo una página real — y luego entrega ese control a un agente LLM, para que pueda decidir *qué* campo llenar con *qué*, en lugar de que tú codifiques cada selector a mano. Conocimiento previo asumido: Python 101, más haber construido ya el [proyecto de Agente de IA](/docs/projects/ai-agent) — este reutiliza su patrón de llamada a herramientas (`deepagents`, una clave de API de nivel gratuito) y añade control real de navegador encima, así que no es el lugar para empezar con agentes desde cero.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Instalar Python [Playwright](https://playwright.dev/python/) y un binario real de navegador Chromium.
2. Escribir un script codificado a mano que llena un formulario de práctica real — y ver exactamente cuán frágil es eso.
3. Envolver la lectura de página y el llenado de campos como **herramientas** que un agente LLM puede llamar.
4. Darle al agente un objetivo en inglés simple ("llena este formulario con estos datos") y dejar que decida qué campos corresponden a qué llamadas de herramientas, luego ejecutarlo de principio a fin y verificar el envío real.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino que siguen los pasos de esta lección, y la única forma completamente fiel de hacer este proyecto: Playwright necesita un binario de navegador real e instalado para conducir, lo que significa una máquina real (o virtual) con una pantalla real. La sección de Configuración de abajo explica cómo instalar tanto `uv` como ese binario de navegador.

**GitHub Codespaces** también funciona bien aquí, y es una alternativa genuina de configuración cero si prefieres no instalar nada localmente todavía: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados) y ejecuta `uv run playwright install chromium` desde una terminal en tu pestaña del navegador — la instalación del navegador funciona exactamente igual ahí que en tu propia máquina, el modo headless tampoco necesita una pantalla real en ningún caso.

**Google Colab, Kaggle Notebooks o Binder son un mal ajuste para este proyecto en particular**, y esta página deliberadamente omite una versión de notebook en lugar de forzar una — un navegador Playwright real necesita un binario de navegador real más un proceso persistente que controla paso a paso, lo cual no se traduce limpiamente al modelo de celdas sin estado y sin ventana de navegador local de un notebook, como sí lo hacen las llamadas `requests` del [proyecto scrape-analyze](/docs/projects/scrape-analyze). Si quieres experimentar en un notebook de todas formas, la versión honesta de eso es **no** tener control real de navegador en absoluto: simula una "página" falsa como un diccionario Python simple de nombres de campo y tipos, dale al agente herramientas que lean/escriban ese diccionario en lugar de una página real de Playwright, y úsalo para demostrar solo la *toma de decisiones* del agente — qué campo cree que corresponde a qué pieza de información — sin ningún navegador real abierto en ningún lugar. Esa es una forma legítima de explorar el razonamiento del Paso 3 de forma aislada, pero no es este proyecto; trátalo como un juguete, no como un sustituto de la Configuración de abajo.

## Configuración

### Instala `uv`

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

### Configura el proyecto e instala el binario de navegador de Playwright

```bash
uv init browser-automation-agent
cd browser-automation-agent
uv add playwright deepagents langchain-openai python-dotenv
uv run playwright install chromium
```

Ese último comando es el paso que es fácil olvidar, y el que es específico de Playwright: el paquete `playwright` que acabas de instalar con `uv add` es solo el driver de Python — no incluye un navegador real. `playwright install chromium` descarga una build real y fijada de Chromium (que coincide con la versión exacta de Playwright que tienes) en una caché local que el paquete luego conduce. Sáltatelo, y cada script de abajo falla inmediatamente con un error que te dice que falta un ejecutable de navegador.

:::tip[Esto es Playwright de Python, no el propio Playwright de Node de este repositorio]
Si has mirado por el propio repositorio de este curso, puede que hayas notado `playwright` ya listado como una dependencia de desarrollo de Node en el `package.json` raíz — esa copia es una herramienta no relacionada que este sitio usa para sus propios tests de extremo a extremo, escritos en JavaScript/TypeScript. El **paquete pip** `playwright` que acabas de instalar con `uv add` es una biblioteca de Python completamente separada con su propia instalación, su propia caché de navegador, y su propia API (`sync_playwright()`, no `require('playwright')`). Resulta que comparten un nombre y un motor de automatización de navegador subyacente, pero ninguna instalación afecta a la otra, y no necesitas Node.js instalado en absoluto para hacer este proyecto.
:::

### Obtén una clave de API de IA de nivel gratuito

**Elige el proveedor que prefieras** — ninguno requiere tarjeta de crédito al momento de escribir esto.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(sugerido por defecto)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el scope `models: read` | Sin registro aparte — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada; usada en borradores anteriores de esta página. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

Misma regla que cualquier otro proyecto aquí: **nunca** pegues una clave directamente en el código ni la subas a un repositorio — configúrala como variable de entorno, o ponla en un archivo `.env` local (tampoco subas ese) y cárgala con `python-dotenv`, igual que el proyecto de Agente de IA.

```bash
# .env
GITHUB_TOKEN=tu-clave-aquí
```

## Paso 1: Un script codificado a mano, sin LLM todavía

Antes de recurrir a un agente, escribe la versión simple hecha a mano — vale la pena sentir exactamente cuán frágil es antes de arreglar ese problema. El objetivo para todo este proyecto es [httpbin.org/forms/post](https://httpbin.org/forms/post), un formulario de "pedido de pizza" pequeño, bien conocido y estable, construido específicamente para probar herramientas como esta — sin login, sin datos reales de clientes, nada detrás de autorización, y un sandbox público y amigable con los ToS para probar formularios que estudiantes y tutoriales han usado durante años.

Crea `scripted_fill.py`:

```python
from playwright.sync_api import sync_playwright

FORM_URL = "https://httpbin.org/forms/post"

ORDER = {
    "custname": "Ada Lovelace",
    "custtel": "555-0100",
    "custemail": "ada@example.com",
    "size": "medium",
    "topping": ["bacon", "cheese"],
    "delivery": "18:30",
    "comments": "Please ring the bell twice.",
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False, slow_mo=250)
    page = browser.new_page()
    page.goto(FORM_URL)

    page.fill('input[name="custname"]', ORDER["custname"])
    page.fill('input[name="custtel"]', ORDER["custtel"])
    page.fill('input[name="custemail"]', ORDER["custemail"])
    page.check(f'input[name="size"][value="{ORDER["size"]}"]')
    for topping in ORDER["topping"]:
        page.check(f'input[name="topping"][value="{topping}"]')
    page.fill('input[name="delivery"]', ORDER["delivery"])
    page.fill('textarea[name="comments"]', ORDER["comments"])
    page.click('button[type="submit"]')

    page.wait_for_selector("pre")
    print(page.locator("pre").inner_text())
    browser.close()
```

Ejecútalo:

```bash
uv run python scripted_fill.py
```

Aparece una ventana de Chromium real y visible (`headless=False`), escribe en cada campo y envía — httpbin devuelve los datos enviados como JSON, que deberías ver impreso en tu terminal.

Ahora imagina que el dueño del formulario renombra `custname` a `customer_name`, o añade un nuevo campo requerido. Este script se rompe inmediatamente, sin idea de *por qué* — nunca miró la página, solo repitió una secuencia fija de selectores. Esa fragilidad es el problema real que resuelve este proyecto.

<StepChecklist>
  <StepChecklistItem>`uv run python scripted_fill.py` abre un navegador visible, llena el formulario, e imprime el JSON enviado.</StepChecklistItem>
  <StepChecklistItem>Puedes señalar al menos un nombre de campo o selector en el script que se rompería silenciosamente si el formulario cambiara.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**: Si no controlaras el sitio web objetivo y cambiara su formulario mañana, ¿cómo te *enterarías* siquiera de que este script se rompió, más allá de ejecutarlo y leer el error?

## Paso 2: Envuelve el navegador como herramientas

Un agente LLM no puede llamar directamente a la API de Python de Playwright — las herramientas de `deepagents` son funciones simples con argumentos sencillos y amigables con JSON, la misma forma que viste en el proyecto de Agente de IA. Así que la solución a la fragilidad del Paso 1 es darle al modelo un conjunto pequeño y fijo de *capacidades* en lugar de un script fijo, y dejar que decida cuándo usar cada una.

Crea `browser_tools.py` (o añade esto a la parte superior de `agent.py` — cualquiera funciona):

```python
from playwright.sync_api import sync_playwright

class BrowserSession:
    def __init__(self, headless: bool = True) -> None:
        self._playwright = sync_playwright().start()
        self.browser = self._playwright.chromium.launch(headless=headless)
        self.page = self.browser.new_page()

    def close(self) -> None:
        self.browser.close()
        self._playwright.stop()

_session: BrowserSession | None = None

def _page():
    if _session is None:
        raise RuntimeError("No active browser session -- call navigate() first.")
    return _session.page

def navigate(url: str) -> str:
    """Open a URL in the browser. Always call this first."""
    _page().goto(url)
    return f"Navigated to {url}"

def read_form_fields() -> str:
    """List every form field on the current page: its name, type, and (for
    radio/checkbox groups) its available option values."""
    fields = _page().eval_on_selector_all(
        "input, textarea, select",
        "els => els.map(el => ({name: el.getAttribute('name'), "
        "type: el.getAttribute('type') || el.tagName.toLowerCase(), "
        "value: el.getAttribute('value')}))",
    )
    return "\n".join(f"- name={f['name']!r} type={f['type']} value={f['value']!r}" for f in fields)

def fill_text_field(name: str, value: str) -> str:
    """Type a value into a text-like field (text, email, tel, time, textarea) by its name."""
    _page().fill(f'[name="{name}"]', value)
    return f"Filled '{name}' with '{value}'"

def select_option(name: str, value: str) -> str:
    """Check a radio button or checkbox by its name and option value."""
    _page().check(f'input[name="{name}"][value="{value}"]')
    return f"Selected '{value}' for '{name}'"

def click_submit() -> str:
    """Click the form's submit button."""
    _page().click('button[type="submit"], input[type="submit"]')
    _page().wait_for_load_state("networkidle")
    return "Submitted."

def read_page_text() -> str:
    """Read back the visible text of the current page -- use this to verify what happened."""
    return _page().inner_text("body")[:2000]
```

Nota lo que cambió del Paso 1: nada aquí menciona `custname` o `size` ni ningún campo específico. `read_form_fields` descubre cualquier campo que realmente exista en cualquier página a la que apunte — el agente, no este código, es responsable de hacer coincidir "nombre del cliente" con `name="custname"`.

<StepChecklist>
  <StepChecklistItem>Puedes explicar, en una frase, por qué estas funciones de herramientas toman cadenas simples (una URL, un nombre de campo, un valor) en lugar de un objeto `Page` de Playwright como argumento.</StepChecklistItem>
  <StepChecklistItem>`read_form_fields()` llamado manualmente contra una página real devuelve una lista real de los nombres de campo reales de la página — no una suposición codificada.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**: `read_form_fields` no trunca nada y devuelve la estructura *real* de la página al modelo. ¿Qué podría salir mal si en su lugar confiaras en que el modelo adivine los nombres de campo sin nunca llamarla?

## Paso 3: Dale al agente un objetivo en inglés simple

Ahora conecta esas herramientas a un agente `deepagents`, el mismo patrón `create_deep_agent` del proyecto de Agente de IA, y dale un objetivo en lenguaje ordinario en lugar de un script paso a paso:

```python
import os
from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[navigate, read_form_fields, fill_text_field, select_option, click_submit, read_page_text],
    system_prompt=(
        "You are a browser-automation agent. Navigate to the given URL, call "
        "read_form_fields to see the real fields on the page, then map the given "
        "details onto the real field names and types you found -- never guess a "
        "field name read_form_fields didn't show you. Fill what you can confidently "
        "match, submit, then read the page back to confirm."
    ),
)

_session = BrowserSession(headless=False)
goal = (
    "Go to https://httpbin.org/forms/post and fill it out with these details: "
    "Customer name: Grace Hopper. Phone: 555-0199. Email: grace@example.com. "
    "Pizza size: large. Toppings: mushroom and cheese. Delivery time: 19:00. "
    "Comments: leave at the front desk. Then submit it."
)
result = agent.invoke({"messages": [{"role": "user", "content": goal}]})
print(result["messages"][-1].content)
_session.close()
```

Ejecútalo y observa la ventana del navegador: el agente llama a `navigate`, luego a `read_form_fields`, luego a una secuencia de llamadas `fill_text_field`/`select_option` que él mismo eligió — en un orden que él mismo eligió, usando nombres de campo que leyó de la página real en lugar de los que le indicaste en el texto del objetivo.

<StepChecklist>
  <StepChecklistItem>Las llamadas a herramientas del agente (imprime `result["messages"]` y busca entradas de llamada a herramienta `AIMessage`, igual que la traza del proyecto de Agente de IA) muestran que llama a `read_form_fields` antes de cualquier llamada a `fill_text_field`/`select_option`.</StepChecklistItem>
  <StepChecklistItem>Cambiaste un detalle en el objetivo en inglés simple (ej. un topping diferente) y lo volviste a ejecutar sin tocar ningún código de herramientas, y el envío cambió acordemente.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**: El system prompt dice explícitamente "nunca adivines un nombre de campo que `read_form_fields` no te mostró." ¿Por qué esa instrucción importa más aquí de lo que importaba para las herramientas de juguete en el proyecto de Agente de IA?

## Paso 4: Ejecútalo de principio a fin y verifica el envío real

Ejecuta el script completo y confirma que todo el ciclo realmente funcionó, no solo que no falló:

```bash
uv run python agent.py
```

Verifica el texto final impreso de la página (de `read_page_text`) contra lo que httpbin realmente devuelve — debería ser un blob JSON bajo `"form"` que contiene cada valor que pediste, usando los nombres de campo reales que el agente descubrió, no los nombres en inglés simple de tu objetivo.

<StepChecklist>
  <StepChecklistItem>El texto final de la página mostrado por el agente contiene cada valor de tu objetivo, correctamente emparejado con el campo correcto.</StepChecklistItem>
  <StepChecklistItem>Lo ejecutaste una segunda vez con `headless=True` y se completó sin ventana visible, confirmando que no depende secretamente de que lo estés observando.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**: Si el agente hubiera enviado el formulario con un campo equivocado — digamos, el topping equivocado — ¿cómo lo sabrías, más allá de leer tú mismo el texto de confirmación? ¿Qué haría falta para que el agente verifique su propio trabajo?

:::tip[Automatiza solo sitios para los que tienes permiso]
`httpbin.org/forms/post` se eligió deliberadamente porque es una herramienta pública construida *para* este tipo exacto de práctica — automatizarla es lo esperado, no una violación de nada. Eso no es cierto para la mayoría de sitios web. Nunca apuntes código de automatización de navegador a las páginas de login, checkout o cuenta de un sitio de producción real sin la autorización explícita del dueño del sitio — los Términos de Servicio de la mayoría de sitios prohíben el envío automatizado de formularios, el scraping, o acciones masivas de cuentas, y "el formulario era técnicamente alcanzable públicamente" no es lo mismo que "tenía permiso para automatizarlo." Trata esto igual que tratarías cualquier otra credencial o cuenta: obtén permiso explícito antes de automatizar objetivos reales que no sean de práctica.
:::

:::tip[Los selectores son un contrato con una página que no controlas]
Cada llamada `page.fill(...)` y `page.check(...)` de arriba depende de que el HTML real del sitio objetivo no cambie — un atributo `name` renombrado, un `<div>` intercambiado por un `<button>` real, o un formulario rediseñado rompe un script codificado a mano instantánea y silenciosamente. Por eso exactamente existe la herramienta `read_form_fields` del Paso 2: un agente que *lee* la página antes de actuar se adapta a pequeños cambios que un script codificado a mano no puede, aunque tampoco es inmune a una página que cambia toda su estructura o significado.
:::

## ⚠️ Errores comunes

- **Olvidar `uv run playwright install chromium`** — el fallo único más común. `uv add playwright` solo instala el driver de Python; el mensaje de error ("Executable doesn't exist...") te dice exactamente esto, pero es fácil pasarlo por alto en una primera lectura.
- **Fragilidad de selectores** — un selector como `input[name="custname"]` solo funciona porque ese es el atributo real en *esta* página hoy. Copiar selectores de un sitio a otro diferente, o reutilizarlos después de un rediseño, es la fuente única más común de un script que "solía funcionar."
- **Confusión entre modo headless y con interfaz** — `headless=False` (una ventana visible) es genial para desarrollo y depuración, pero más lento y requiere una pantalla real; `headless=True` (el predeterminado) es lo que quieres para cualquier cosa desatendida, como CI, pero hace la depuración de un fallo más difícil ya que no puedes observarlo suceder. Alterna deliberadamente, no lo dejes en el que empezaste.
- **Condiciones de carrera y temporización** — hacer clic en enviar antes de que una página termine de cargar, o leer el texto de la página antes de que se complete una redirección, produce fallos inconsistentes y difíciles de reproducir. `wait_for_load_state`, `wait_for_selector` de Playwright, y su auto-espera incorporada en la mayoría de acciones existen específicamente para evitar llamadas `time.sleep()` hechas a mano, que ocultan bugs de temporización en lugar de arreglarlos.

## Lo que acabas de construir

Un agente que no solo *habla* — toma acciones reales y verificables en un navegador real, decidiendo cuál de un pequeño conjunto de capacidades usar y en qué orden, basado en lo que realmente observa en la página en lugar de un script que escribiste de antemano. Ese es el mismo ciclo de llamada a herramientas del proyecto de Agente de IA, pero ahora las "herramientas" tienen efectos secundarios en el mundo real en lugar de solo devolver texto, lo cual es exactamente la forma de la mayoría de agentes de automatización genuinamente útiles.

## A dónde ir desde aquí

- Añade una herramienta que lea de vuelta el valor *específico* en un campo después de llenarlo (no solo la página completa), para que el agente pueda verificar cada llenado antes de pasar al siguiente, en lugar de verificar solo al final.
- Prueba con un formulario con más tipos de campo — un dropdown `<select>`, un formulario de varias páginas, un campo con validación del lado del cliente en tiempo real — y ve cuáles herramientas del Paso 2 necesitan crecer para manejarlo.
- Compara esto con el [proyecto de Agente de IA](/docs/projects/ai-agent): las herramientas de aquel siempre devuelven solo texto; estas herramientas cambian el estado real del navegador. Piensa en lo que esa diferencia significa para cuán cuidadosamente querrías probar el conjunto de herramientas de un agente antes de confiar en él sin supervisión.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2027-browser-automation-agent" />
