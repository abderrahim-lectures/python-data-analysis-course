---
id: 2027-finance-agent
title: "Construye un Agente de Finanzas Personales"
sidebar_label: "Construye un Agente de Finanzas Personales"
slug: /projects/finance-agent
description: "Categoriza una exportación CSV bancaria y marca anomalías de gasto, combinando manipulación de datos con pandas con un agente LLM que llama herramientas para categorización inteligente."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Agente de Finanzas Personales

<ProjectPublishedDate projectId="2027-finance-agent" />

<ProjectGreeting />

Este proyecto asume que te sientes cómodo con Python 101, y se apoya en ideas de otros dos Proyectos del Mundo Real sin requerir estrictamente ninguno: limpieza de datos con pandas aproximadamente al nivel de [Entrena tu Primer Modelo de Machine Learning](/docs/projects/ml-classifier) (cargar un CSV, manejar columnas desordenadas), y el patrón de agente que llama herramientas de [Construye un Agente de IA](/docs/projects/ai-agent) (un modelo de lenguaje que decide llamar a tus funciones Python en lugar de solo responder con texto). Haber visto cualquiera de los dos ayuda, pero los pasos de abajo vuelven a explicar lo que necesitan sobre la marcha.

Esto es opcional y no calificado — un buen ajuste una vez que hayas terminado Python 101. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Cargar y limpiar una exportación CSV bancaria de muestra con pandas.
2. Construir un categorizador base rápido basado en reglas — y ver exactamente dónde se le acaba el camino a las reglas de palabras clave.
3. Construir una herramienta de agente LLM que categorice las transacciones que las reglas no pudieron etiquetar con confianza, y explique su razonamiento.
4. Marcar transacciones estadísticamente inusuales (una compra inusualmente grande comparada con el gasto típico de esa categoría) y hacer que el agente resuma en inglés simple lo que encontró.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino que siguen los pasos de esta lección, y el recomendado — Python real en tu propia máquina, igual que cualquier otro proyecto de esta sección. La sección de Configuración de abajo explica cómo instalarlo.

**GitHub Codespaces** es una alternativa de configuración cero: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados, según el `.devcontainer/devcontainer.json` del repositorio) y ejecuta los mismos comandos `uv` exactos desde una terminal en tu pestaña del navegador.

**Google Colab, Kaggle Notebooks, o Binder** también funcionan — este proyecto no necesita GPU, solo pandas y una llamada a la API del LLM por transacción ambigua. Una versión real y ejecutable en notebook (el mismo pipeline que los pasos de abajo, trabajando sobre el mismo CSV sintético de muestra) vive en [`examples/finance-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb). Haz clic en una insignia para lanzarlo directamente, sin instalación local en absoluto:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffinance-agent%2Fnotebook.ipynb)

Sé honesto contigo mismo sobre la compensación, sin embargo: esta es una forma de menor fidelidad de experimentar el proyecto que un proyecto `uv` local real — sin archivos separados, sin estructura de proyecto real, solo celdas en un notebook. Trátalo como una forma rápida de experimentar, no el camino principal.

## Configuración

### Instala `uv`

`uv` es una sola herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes".

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
uv init finance-agent
cd finance-agent
uv add pandas deepagents langchain-openai python-dotenv
```

`pandas` maneja la carga y limpieza del CSV; `deepagents` es el framework de LangChain para construir agentes que llaman herramientas; `langchain-openai` habla con GitHub Models (su API es compatible con OpenAI — mira el tip abajo si elegiste un proveedor diferente); `python-dotenv` lee tu clave de API de un archivo `.env` local.

### Obtén una clave de API de IA gratuita

**Elige el proveedor que prefieras** — ninguno requiere tarjeta de crédito al momento de escribir esto. El ejemplo completo en el repositorio del curso ([`examples/finance-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent)) soporta los seis de fábrica, seleccionables con una sola configuración.

| Proveedor | Dónde obtener una clave | Por qué podrías elegirlo |
|---|---|---|
| **GitHub Models** *(sugerido por defecto)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un token de acceso personal con el scope `models: read` | Sin registro aparte — ya tienes una cuenta de GitHub. Límites de nivel gratuito más generosos que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | La opción más comúnmente referenciada. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inferencia rápida, nivel gratuito generoso, sin tarjeta. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Una de las cuotas gratuitas permanentes más generosas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Alto volumen diario de tokens, sin tarjeta. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Una API, muchos modelos gratuitos — bueno para comparar proveedores. |

Crea un archivo `.env` (nunca lo subas) con la clave del proveedor que hayas elegido:

```bash
# .env
GITHUB_TOKEN=tu-clave-aquí
```

:::tip[Un archivo .env suele ser más conveniente que export]
En lugar de hacer `export` de una clave en cada nueva sesión de terminal, ponla en un archivo `.env` (mira el `.env.example` del ejemplo del repositorio) y cárgala automáticamente con `python-dotenv`, como hacen los pasos de abajo.
:::

## Paso 1: Carga y limpia una exportación CSV bancaria de muestra

:::tip[Nunca envíes datos bancarios reales y sin redactar a una API de terceros]
Este proyecto trabaja sobre un CSV de muestra **sintético** — fechas falsas, nombres de comerciantes falsos, montos falsos, incluido en [`examples/finance-agent/transactions.csv`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/transactions.csv). Los Pasos 3 y 4 envían descripciones y montos de transacciones a una API de LLM de terceros. Hacer eso con tu exportación bancaria *real* significa que una copia de tu historial financiero real — nombres de comerciantes, montos de gasto, potencialmente más si exportaste columnas extra — ahora está en los servidores de ese proveedor, sujeta a las políticas de retención y entrenamiento que tengan actualmente, completamente fuera de tu control. Si alguna vez adaptas esto a tu gasto real, redacta o sintetiza primero: elimina números de cuenta, generaliza nombres de comerciantes que revelen algo sensible, redondea o distorsiona montos. Este es un hábito genuinamente importante, no una formalidad del curso — trata cualquier script que llame una API externa como algo que verá todo lo que le entregues.
:::

Descarga el CSV de muestra, o cópialo de [`examples/finance-agent/transactions.csv`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/transactions.csv) a la carpeta de tu proyecto. Se ve como una exportación real: una fila por transacción, una fecha, una descripción cruda del comerciante exactamente como la imprimiría un banco (abreviada, a veces críptica), y un monto con signo — negativo para dinero que sale, positivo para depósitos.

```python
import pandas as pd

df = pd.read_csv("transactions.csv", parse_dates=["date"])
df["description"] = df["description"].str.strip()
df = df.dropna(subset=["date", "description", "amount"]).sort_values("date").reset_index(drop=True)
df.head()
```

`parse_dates=["date"]` te da objetos `Timestamp` reales en lugar de cadenas simples, así que pasos posteriores pueden agrupar por mes u ordenar cronológicamente sin volver a analizar nada. `.str.strip()` limpia el espacio en blanco perdido del que están llenas las exportaciones bancarias reales. Eliminar filas que les falte alguna de las tres columnas esenciales es una forma barata y honesta de manejar una fila genuinamente malformada sin adivinar qué significaba.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`df["date"].dtype` muestra un tipo datetime, no `object`.</StepChecklistItem>
<StepChecklistItem>`df["amount"]` contiene valores tanto negativos (gastos) como positivos (ingresos).</StepChecklistItem>
<StepChecklistItem>`df.isna().sum()` no muestra valores faltantes en `date`, `description`, o `amount`.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

Una exportación bancaria real también podría incluir una columna `balance` acumulada. Nada en este proyecto la usa — pero ¿se te ocurre una verificación de cordura que podrías hacer usando `balance` que `date`, `description`, y `amount` solos no pueden darte?

## Paso 2: Construye un categorizador base basado en reglas — y ve sus límites

La forma más barata de categorizar una transacción es una búsqueda de palabra clave: si `"STARBUCKS"` aparece en la descripción, llámalo `"Dining"`. Esto es rápido, gratis, y no necesita ninguna clave de API en absoluto — un buen instinto al que recurrir antes de añadir cualquier IA a un pipeline.

```python
RULES = {
    "starbucks": "Dining",
    "trader joes": "Groceries",
    "netflix.com": "Subscriptions",
    "shell oil": "Transport",
    "pacific gas electric": "Utilities",
    # ... see examples/finance-agent/rules.py for the full list
}


def categorize_rule_based(description: str) -> str | None:
    text = description.lower()
    for keyword, category in RULES.items():
        if keyword in text:
            return category
    return None


df["category"] = df["description"].apply(categorize_rule_based)
resolved = df["category"].notna().sum()
print(f"Rule-based pass: {resolved}/{len(df)} categorized. {len(df) - resolved} left ambiguous.")
```

Ejecuta esto contra los datos de muestra y una mayoría sólida de filas se categoriza instantáneamente. Pero mira lo que queda en `df[df["category"].isna()]`: descripciones como `SQ *JOES COFFEE CART`, `TST* CORNER BISTRO`, `PAYPAL *MERCHXYZ123`, `AMZN MKTP US*1H8KX2LP2`, y `VENMO PAYMENT JSMITH`. Un humano echando un vistazo a `SQ *JOES COFFEE CART` reconoce "coffee cart" instantáneamente — pero ninguna lista fija de palabras clave puede anticipar cada prefijo de procesador de pagos (`SQ *`, `TST*`, `PAYPAL *`) o transferencia entre pares que una exportación bancaria contendrá jamás. Esta es una limitación real y común de los enfoques basados en reglas para texto desordenado del mundo real, no una artificial — es exactamente la brecha que el siguiente paso existe para cerrar.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Puedes imprimir las filas exactas que `categorize_rule_based` dejó como `None`, y ver por qué cada una es genuinamente ambigua (un prefijo de procesador de pagos o una transferencia P2P, no solo un typo en tu diccionario de reglas).</StepChecklistItem>
<StepChecklistItem>Resististe la tentación de simplemente añadir más palabras clave para cada caso — un puñado de filas restantes sin resolver es esperado, no un bug para parchear con reglas.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

Si siguieras añadiendo palabras clave para siempre, ¿podrías eventualmente cubrir cada posible descripción bancaria que una persona pudiera ver? ¿Qué implica tu respuesta sobre cuándo un enfoque puramente basado en reglas deja de valer la pena mantener?

## Paso 3: Construye una herramienta de agente LLM que categorice transacciones ambiguas

Esta es la misma forma de llamada a herramientas de [Construye un Agente de IA](/docs/projects/ai-agent): una función Python con un docstring, entregada a `create_deep_agent`, que el modelo decide llamar por sí mismo.

```python
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from deepagents import create_deep_agent

load_dotenv()

CATEGORIES = [
    "Income", "Housing", "Groceries", "Dining", "Transport", "Utilities",
    "Subscriptions", "Entertainment", "Shopping", "Healthcare", "Travel", "Fees", "Other",
]


def categorize_transaction(description: str, amount: float) -> str:
    """Categorize one bank transaction the rule-based pass couldn't confidently label.

    `description` is the raw bank description string; `amount` is signed
    (negative = money out). Must return exactly one of: Income, Housing,
    Groceries, Dining, Transport, Utilities, Subscriptions, Entertainment,
    Shopping, Healthcare, Travel, Fees, Other.
    """
    # A real version of this tool could just let the model itself reason
    # about the description text and return a category directly, with no
    # body here at all -- see the tip below. This version keeps a small,
    # deterministic heuristic so the example stays fully repeatable offline.
    text = description.lower()
    if text.startswith("sq *") or text.startswith("tst*") or "coffee" in text or "bistro" in text:
        return "Dining"
    if text.startswith("venmo") or text.startswith("paypal"):
        return "Other"
    if text.startswith("amzn mktp"):
        return "Shopping"
    return "Other"


model = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[categorize_transaction],
    system_prompt=(
        "You are a personal finance assistant. When asked to categorize a "
        "transaction, call the categorize_transaction tool rather than "
        "guessing -- it exists precisely for the ambiguous cases a simple "
        "keyword list can't handle."
    ),
)

unresolved = df[df["category"].isna()]
for idx, row in unresolved.iterrows():
    result = agent.invoke({
        "messages": [{
            "role": "user",
            "content": f"Categorize this transaction: description={row['description']!r}, amount={row['amount']}",
        }]
    })
    text = str(result["messages"][-1].content)
    match = next((c for c in CATEGORIES if c.lower() in text.lower()), "Other")
    df.at[idx, "category"] = match

df["category"].value_counts()
```

Nota que el bucle llama a `agent.invoke(...)` una vez por fila sin resolver, cada una un viaje separado de ida y vuelta al modelo — la misma consideración de límite de tasa del proyecto de Agente de IA aplica aquí: ejecuta esto contra un CSV grande y puedes golpear el límite por minuto de un nivel gratuito. Mira la sección "Manejo de límites de tasa" de ese proyecto, y `ask()` en [`examples/ai-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent/agent.py), para un patrón de reintento que puedes reutilizar aquí.

:::tip[Deja que el modelo razone, no solo vuelvas a esconder las reglas en la herramienta]
El cuerpo de `categorize_transaction` de arriba deliberadamente sigue siendo una pequeña heurística, no una búsqueda fija — pero puedes ir más allá: dale al `system_prompt` del agente la lista completa de categorías y pídele que razone sobre una descripción desconocida directamente (`"SQ *"` es el prefijo de punto de venta de Square; `"TST*"` es el de Toast — un modelo que ha visto suficientes datos reales de pago a menudo puede inferir "esto probablemente es un pequeño restaurante o carrito" solo de la forma de la cadena, de la misma forma que lo haría un humano). El ejemplo más completo del repositorio en [`examples/finance-agent/finance_agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent) está escrito para hacer fácil este cambio — mira sus comentarios.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Cada fila que era `None` después del Paso 2 ahora tiene una `category` no nula después de que este paso se ejecuta.</StepChecklistItem>
<StepChecklistItem>Has impreso al menos una respuesta del agente y puedes señalar qué llamada a herramienta produjo qué categoría.</StepChecklistItem>
<StepChecklistItem>`df["category"].value_counts()` muestra categorías que tienen sentido para lo que sabes sobre cada comerciante.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

El docstring de la herramienta lista las 13 categorías válidas, y el código que lee la respuesta del modelo (`match = next((c for c in CATEGORIES if c.lower() in text.lower()), "Other")`) todavía recurre a `"Other"` si ninguna de ellas aparece. ¿Por qué mantener ese respaldo aunque se *supone* que la herramienta siempre devuelve una de las 13? ¿Qué podría salir mal sin él?

## Paso 4: Marca anomalías estadísticas y resúmelas en inglés simple

"Anomalía" aquí significa: inusualmente grande *para esa categoría*. Un cargo de hotel de $400 es normal para Travel pero un claro valor atípico para Dining — así que en lugar de un umbral de dólar global, calcula un **z-score** por categoría: cuántas desviaciones estándar está una transacción por encima del gasto promedio de su propia categoría.

```python
spend = df["amount"].where(df["amount"] < 0)
df["spend_abs"] = spend.abs()

stats = df.groupby("category")["spend_abs"].agg(["mean", "std"]).rename(
    columns={"mean": "category_mean", "std": "category_std"}
)
df = df.join(stats, on="category")

safe_std = df["category_std"].replace(0, pd.NA)  # avoid dividing by 0/undefined std for tiny categories
df["z_score"] = (df["spend_abs"] - df["category_mean"]) / safe_std
df["is_anomaly"] = (df["z_score"] >= 2.0).fillna(False)

flagged = df[df["is_anomaly"]].sort_values("z_score", ascending=False)
flagged[["date", "description", "spend_abs", "category", "category_mean", "z_score"]]
```

Un z-score de 2.0 significa "más de dos desviaciones estándar por encima del promedio de esta categoría" — una regla general estadística común, aunque algo arbitraria, para "inusual". Ejecuta esto en los datos de muestra y deberías ver un par de transacciones destacarse claramente: una compra de electrónica sobredimensionada relativa al gasto típico de Shopping, y un cargo de restaurante muy por encima del gasto típico de Dining (una gran cena grupal, tal vez — los datos no pueden decir por qué, solo que es inusual).

Ahora entrega la lista cruda marcada al mismo agente y pídele que explique lo que encontró, en lenguaje simple:

```python
summary_lines = [
    f"- {row['date'].date()} | {row['description']} | ${row['spend_abs']:.2f} in {row['category']} "
    f"(category average: ${row['category_mean']:.2f}, z-score: {row['z_score']:.1f})"
    for _, row in flagged.iterrows()
]
anomaly_summary = "\n".join(summary_lines) if summary_lines else "No anomalies found."

result = agent.invoke({
    "messages": [{
        "role": "user",
        "content": (
            "Here are transactions flagged as statistically unusual for their category "
            "(z-score = how many standard deviations above that category's average spend):\n\n"
            f"{anomaly_summary}\n\n"
            "Summarize this for someone reviewing their bank statement, in 2-4 plain-English "
            "sentences. No new numbers, no advice beyond what the data supports."
        ),
    }]
})
print(result["messages"][-1].content)
```

El prompt deliberadamente dice "sin números nuevos, sin consejos más allá de lo que los datos respaldan" — una protección real contra un modo de fallo común de los resúmenes de LLM: inventar una explicación que suena plausible pero no tiene respaldo ("esto probablemente fue una cena de cumpleaños") en lugar de apegarse a lo que las estadísticas realmente muestran.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`flagged` contiene la(s) transacción(es) que esperarías que destacaran a simple vista, y excluye las ordinarias.</StepChecklistItem>
<StepChecklistItem>Entiendes por qué el z-score se calcula *por categoría*, no globalmente a través de todo el gasto.</StepChecklistItem>
<StepChecklistItem>El resumen en inglés simple del agente menciona solo categorías/montos que realmente aparecen en `anomaly_summary` — nada inventado.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

Una categoría con solo una o dos transacciones tiene una desviación estándar indefinida o casi cero — el código de arriba se protege contra dividir por eso con `.replace(0, pd.NA)`. ¿Qué le pasaría a los z-scores de una categoría si esa protección no estuviera ahí, y por qué podría una categoría con muy pocas transacciones ser un candidato pobre para este tipo de detección de anomalías desde el principio?

## ⚠️ Errores comunes

- **Enviar datos financieros reales a una API de terceros.** Cubierto arriba, vale la pena repetirlo: este proyecto está construido alrededor de un CSV sintético específicamente para que construyas el hábito de tratar cualquier script que llame una API externa como algo que verá todo lo que le entregues.
- **Volver a ejecutar el bucle de categorización innecesariamente.** Llamar a `agent.invoke(...)` una vez por fila sin resolver quema cuota real de API cada vez que vuelves a ejecutar tu script — cachea resultados (ej. en un CSV local o diccionario indexado por descripción) en lugar de volver a categorizar las mismas filas en cada ejecución mientras iteras en el Paso 4.
- **Un umbral de anomalía global en lugar de uno por categoría.** Marcar "cualquier transacción sobre $200" se perdería un valor atípico de $150 en una categoría que normalmente gasta $20, y marcaría cargos ordinarios de alquiler o viaje constantemente. Compara cada transacción con el gasto típico de su propia categoría, como hace el Paso 4.
- **Dejar que el agente de resumen invente explicaciones.** Un LLM al que se le pide "explicar" una anomalía felizmente fabricará una razón que suena plausible si se lo permites. Restringe el prompt a los números reales, como en el Paso 4, y trata cualquier cosa más allá de eso como el modelo adivinando, no reportando.
- **Confiar en `is_anomaly` de una categoría con 1-2 transacciones.** Una categoría de la que casi cada valor vino de una muestra diminuta no te dice mucho sobre qué es "normal" para ella todavía — mira la pregunta socrática de arriba.

## Lo que acabas de construir

Un pipeline pequeño pero genuinamente útil: una pasada basada en reglas que maneja el fácil 80% de las transacciones gratis, un agente LLM que recoge el resto ambiguo que una lista fija de palabras clave estructuralmente no puede cubrir, y una verificación estadística de anomalías que convierte "¿algo aquí se ve mal?" en una respuesta real y defendible — luego un resumen en inglés simple sobre el que un lector no técnico podría actuar. Esta forma de "pasada determinista barata primero, IA para el resto genuinamente ambiguo" generaliza bien más allá de las finanzas — es el mismo instinto detrás de muchos pipelines de datos del mundo real que usan LLMs.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/finance-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent) en el repositorio del curso tiene el pipeline completo como archivos separados y reutilizables (`rules.py`, `anomalies.py`, `finance_agent.py`) más un CSV de muestra sintético, y soporta los seis proveedores de la tabla de arriba, seleccionables con una configuración. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- **Un resumen sin confusión a través de meses.** Agrupa por `date.dt.to_period("M")` y compara los totales de categoría de cada mes — ¿está el gasto tendiendo hacia arriba en algo específico, más allá de cualquier transacción marcada individual?
- **Una verificación de anomalías más inteligente.** Un z-score asume que el gasto dentro de una categoría es aproximadamente con forma de campana, lo cual no siempre es cierto (el alquiler es casi constante; la comida varía mucho). Investiga medidas más robustas como la mediana y el rango intercuartílico (IQR) para categorías donde unos pocos valores grandes sesgan la media.
- **Un presupuesto de categorización real.** En lugar de volver a categorizar cada fila sin resolver en cada ejecución, persiste resultados categorizados (un archivo SQLite local o una caché CSV indexada por descripción) para que volver a ejecutar el script solo llame al agente en transacciones genuinamente nuevas.
- **Múltiples meses, múltiples cuentas.** Las finanzas reales abarcan más de una cuenta. Intenta extender el pipeline para cargar varios CSVs y reconciliar categorías consistentemente entre ellos.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2027-finance-agent" />
