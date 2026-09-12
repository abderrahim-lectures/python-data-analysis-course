---
title: "Gestor de Campañas de Email"
description: "Crear y enviar campañas de email con plantillas, seguimiento y pruebas A/B."
difficulty: "beginner"
estimatedMinutes: 55
tags: ["cli", "json", "csv", "templates"]
prerequisites:
  - "Fundamentos de Python (listas, diccionarios, bucles, funciones)"
  - "Leer archivos CSV y JSON"
learningObjectives:
  - "Renderizar plantillas {{placeholder}} con una sustitución de regex"
  - "Importar y deduplicar una lista de suscriptores con validación de email"
  - "Renderizar una campaña completa en un outbox de solo anexar (JSONL)"
  - "Calcular tasas de apertura y de clics a partir de un registro de engagement"
  - "Dividir una lista entre dos líneas de asunto y reportar la ganadora"
---

# ✉️ Construye un Gestor de Campañas de Email

Enviar un boletín real significa gestionar un montón de pequeños flujos de trabajo: una plantilla con `{{first_name}}` que de verdad se llena, una lista de suscriptores con una fila basura que no debe tumbar el envío, un registro de outbox de *qué* se envió, tasas de apertura y de clics calculadas a partir de un registro de seguimiento, y,la parte que todo marketer pregunta primero, cuál de dos líneas de asunto la gente de verdad abrió. Este proyecto construye todo ese pipeline en Python puro. Sin envío, sin servidor, sin SMTP: la "entrega" es escribir un registro de outbox, y los números son tan reales como los de una herramienta alojada.

Esto asume Python 101, listas, diccionarios, bucles, funciones, además de comodidad con `csv`/`json`. No se requiere nada del módulo de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Renderizar plantillas `{{placeholder}}` para un suscriptor y ver cómo una variable faltante se convierte en un hueco visible.
2. Importar `subscribers.csv`, saltando silenciosamente una fila con email inválido.
3. Renderizar toda la campaña en un registro `outbox.jsonl` de lo que se envió a quién.
4. Calcular tasas de apertura y de clics a partir de un registro de engagement.
5. Dividir la lista entre dos líneas de asunto y coronar a la ganadora por tasa de apertura.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado, un gestor de campañas es una herramienta de persistencia de archivos (CSV de suscriptores de entrada, outbox JSONL de salida), y los archivos pertenecen a una CLI local.

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder** funcionan para cada paso, el notebook en [`examples/email-campaign/notebook.es.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.es.ipynb) ejecuta el mismo pipeline sobre la lista de muestra incluida, en memoria.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Femail-campaign%2Fnotebook.es.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza la cadena de "instala Python, luego pip, luego la herramienta de entorno virtual", y este proyecto es biblioteca estándar pura.

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
uv init email-campaign
cd email-campaign
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `email-campaign/` existe con un `pyproject.toml`.
- ✅ `python -c "import csv, json, re"` tiene éxito, sin paquetes de terceros.

## Paso 1: Renderiza una plantilla

El corazón de una herramienta de campañas es una idea de una sola función: reemplazar cada `{{name}}` en una plantilla con un valor de un dict de contexto. `re.sub` con una *función* te da el rellenado gratis, y que una variable faltante devuelva una cadena vacía es un comportamiento deliberado y a la cara, quieres *ver* un hueco en el email, no que el renderizador adivine e invente uno.

### 1.1 Escribe el renderizador y el cargador de campañas

**👟 Pista inicial :** Un regex para placeholders, `VAR_RE.sub(...)` con una función `replace(match)`, y un `campaign.json` que mantiene juntas las plantillas de asunto y de cuerpo:

```bash
cat > campaign.json <<'EOF'
{
  "subject_template": "Your {{product}} is ready",
  "body_template": "Hello {{first_name}}, your {{product}} is waiting for you.",
  "product": "dashboard"
}
EOF
```

```python
# templates.py
import json
import re

VAR_RE = re.compile(r"\{\{\s*(\w+)\s*\}\}")

def render(text: str, context: dict) -> str:
    def replace(match):
        return str(context.get(match.group(1), ""))
    return VAR_RE.sub(replace, text)

def load_campaign(path: str = "campaign.json") -> dict:
    with open(path) as f:
        return json.load(f)

if __name__ == "__main__":
    print(render("Hello {{ first_name }}, your {{product}} is waiting for you.",
                 {"first_name": "Ada", "product": "dashboard"}))
    print(render("Hello {{ first_name }}, your {{product}} is waiting for you.",
                 {"first_name": "Ada"}))
```

El regex `\{\{\s*(\w+)\s*\}\}` coincide con `{{ name }}` *sin importar los espacios*, que es el perdón que necesita una plantilla copiada y pegada. `render` pone toda la sustitución en una expresión, y el dict de contexto es la *única* fuente de verdad para los nombres, `{{product}}` sin una clave `product` no renderiza nada. Esa es la apuesta de diseño: fallar de forma visible, nunca fabricar.

**🎯 Resultado esperado :**

```
Hello Ada, your dashboard is waiting for you.
Hello Ada, your  is waiting for you.
```

**🩹 Si sale mal :** Si `{{ first_name }}` se renderiza literalmente, falta el `\s*` alrededor del nombre en el regex (coincidió con `{{first_name}}` en tu cabeza pero no con el espaciado). Si un `product` faltante mantiene el texto viejo `{{product}}`, `context.get(match.group(1), "")` devolvió el placeholder, debe tener como predeterminado `""`.

### 1.2 Verifica el renderizador

**✅ Lista de verificación**

- ✅ `render("Hi {{name}}", {"name": "Ada"}) == "Hi Ada"`, y también con espacios `"Hi {{ name }}"`, tolerante a espacios en blanco.
- ✅ Una variable faltante deja un hueco visible en lugar de lanzar o adivinar.
- ✅ El fallback nunca se rompe con valores raros: `context.get(..., "")` convierte números y booleanos a cadena con elegancia.

**🤔 Pregunta(s) socrática(s)**

- Un valor faltante se renderiza como una cadena vacía, un hueco silencioso en el email. ¿Cuál es la alternativa (lanzar una excepción / conservar el placeholder / dejar en blanco) y *cuándo* se convierte cada una en el predeterminado correcto para un emisor de producción?
- La plantilla tiene una variable, el archivo de campaña tiene tres claves. ¿Qué pasa cuando una plantilla referencia `{{ plan }}` mientras el único contexto del archivo de campaña es `product`, de dónde debería venir un valor *por suscriptor* como `plan` en el siguiente paso?

## Paso 2: Importa la lista de suscriptores

Una lista de clientes reales tiene exactamente una garantía: está desordenada. En algún punto entre el formulario de registro y tu campaña hay una fila que no es un email. El trabajo del import es cargar lo que es válido, saltar lo que no lo es, y *reportar lo que saltó*, comerse filas malas silenciosamente esconde huecos de datos, y confiar en filas malas envenena todo el envío.

### 2.1 Escribe el cargador de suscriptores

**👟 Pista inicial :** Un `EMAIL_RE` pragmático, un bucle que conserva solo las filas que le corresponden, y una demo que cuenta lo que se saltó:

```bash
cat > subscribers.csv <<'EOF'
email,first_name,last_name,plan
ada@example.com,Ada,Lovelace,free
grace@example.com,Grace,Hopper,pro
not-an-email,Bad,Row,free
alan@example.com,Alan,Turing,free
EOF
```

```python
# subscribers.py
import csv
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def load_subscribers(path: str = "subscribers.csv") -> list[dict]:
    subscribers = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            if EMAIL_RE.match(row["email"]):
                subscribers.append(row)
    return subscribers

if __name__ == "__main__":
    subs = load_subscribers()
    print(f"valid: {len(subs)} (1 invalid row skipped)")
    for s in subs:
        print(f"{s['email']:<26} {s['first_name']} {s['last_name']} ({s['plan']})")
```

`EMAIL_RE` es una verificación de *forma*, no una autoridad: `^[^@\s]+@[^@\s]+\.[^@\s]+$` exige exactamente un `@`, una parte local imprimible, un punto en el dominio, sin espacios, suficiente para atrapar `not-an-email` de un vistazo. Saltar es aquí la marca distintiva: una fila CSV que no es un suscriptor es un problema de *datos* detectado en la puerta, reportado una vez en la línea del conteo, y nunca se le permite filtrar a los cálculos de `outbox` más adelante.

**🎯 Resultado esperado :**

```
valid: 3 (1 invalid row skipped)
ada@example.com            Ada Lovelace (free)
grace@example.com          Grace Hopper (pro)
alan@example.com           Alan Turing (free)
```

**🩹 Si sale mal :** Si la fila mala aparece en la salida, falta el guardia `if EMAIL_RE.match(row["email"])` o está coincidiendo con `not-an-email` (¿tiene el regex una parte de dominio obligatoria `\.[^@\s]+`?). Si cada paso siguiente cuenta 4 suscriptores, importaste desde `subscribers.csv` sin el filtro, relee lo que realmente devuelve tu `load_subscribers`.

### 2.2 Verifica el import

**✅ Lista de verificación**

- ✅ Exactamente 3 de las 4 filas se importan; `not-an-email` se reporta como saltada.
- ✅ Los campos `email` en blanco o de solo espacios en blanco también se saltarían con el mismo regex.
- ✅ Las filas importadas conservan todas las columnas (`email`, `first_name`, `last_name`, `plan`), cada paso posterior lee del registro completo.

**🤔 Pregunta(s) socrática(s)**

- El conteo de saltadas se *imprime* pero no se *almacena*. ¿Qué haría un import de producción con `not-an-email`, ponerlo en cola para re-validación, registrarlo en un archivo de errores, o bloquear toda la campaña, y cuál elección es aquí el honesto "fallar en voz alta"?
- El regex acepta `grace@example.com` pero también aceptaría `a@b.c`. ¿Dónde queda la línea entre "esto es plausiblemente una dirección" y qué cuesta empujarla más lejos (verificación DNS, entraagabilidad), para una campaña pequeña real?

## Paso 3: Renderiza el outbox completo

Un email renderizado es una prueba unitaria; un outbox completo es el producto. Para cada suscriptor, combina los predeterminados de la campaña con los propios campos del suscriptor, renderiza asunto y cuerpo, y escribe un objeto JSON por email en `outbox.jsonl`, un registro de solo anexar que anota *exactamente qué se envió a quién*. No se necesita SMTP para entender la forma del trabajo.

### 3.1 Escribe `outbox.py`

**👟 Pista inicial :** `context.update({k: sub[k] ...})` pone capas de campos por suscriptor encima del archivo de campaña, luego una pasada de vista previa imprime los tres emails renderizados tal como saldrían de verdad:

```python
# outbox.py
import csv
import json

from subscribers import load_subscribers
from templates import load_campaign, render

def render_campaign(campaign: dict, subscribers: list[dict]) -> list[dict]:
    outbox = []
    for sub in subscribers:
        context = dict(campaign)
        context.update({k: sub[k] for k in ("email", "first_name", "last_name", "plan")})
        outbox.append({
            "to": sub["email"],
            "subject": render(campaign["subject_template"], context),
            "body": render(campaign["body_template"], context),
        })
    return outbox

if __name__ == "__main__":
    campaign = load_campaign()
    outbox = render_campaign(campaign, load_subscribers())
    with open("outbox.jsonl", "w") as f:
        for email in outbox:
            f.write(json.dumps(email) + "\n")
    print(f"wrote {len(outbox)} emails")
    for email in outbox:
        print(f"  to {email['to']:<26} {email['subject']} | {email['body']}")
```

`context = dict(campaign)` *copia* el dict de campaña, de modo que las fusiones por suscriptor nunca mutan la fuente compartida, la actualización de `first_name` de `Ada` no puede filtrarse al renderizado de `Grace` (el clásico bug de dict compartido que esta copia previene). El renderizador ya existe del Paso 1; `render_campaign` es pura composición, bucle, fusión, renderizado, registro. JSONL (un objeto JSON por línea) es el formato de *auditoría* de este proyecto: amigable para anexar, amigable para grep, y cada paso posterior lo vuelve a leer línea por línea.

**🎯 Resultado esperado :**

```
wrote 3 emails
  to ada@example.com            Your dashboard is ready | Hello Ada, your dashboard is waiting for you.
  to grace@example.com          Your dashboard is ready | Hello Grace, your dashboard is waiting for you.
  to alan@example.com           Your dashboard is ready | Hello Alan, your dashboard is waiting for you.
```

**🩹 Si sale mal :** Si un email dice "Hello Grace" también para Ada, `render_campaign` está *mutando* `campaign` en su lugar, `context = dict(campaign)` debe ir primero; `.update` va sobre la copia. Si `outbox.jsonl` está vacío tras una ejecución, lo abriste antes de cerrar la *escritura*, verifica que `with open("outbox.jsonl", "w")` no se trunca con una segunda apertura de la misma ruta a mitad de la ejecución.

### 3.2 Verifica el outbox

**✅ Lista de verificación**

- ✅ `outbox.jsonl` tiene exactamente 3 líneas, un objeto JSON cada una (`to`, `subject`, `body`).
- ✅ Los cuerpos renderizados de Ada y Alan no difieren en *nada* aquí, mismo producto, misma plantilla, pero los campos `first_name`/`last_name` están disponibles por suscriptor.
- ✅ El registro impreso coincide línea por línea con `outbox.jsonl` (mismo contexto, mismo renderizador).

**🤔 Pregunta(s) socrática(s)**

- El outbox registra `to/subject/body` pero *no* las elecciones de fusión (qué `product` había en el contexto). ¿Cuál es la diferencia entre un outbox y un *registro de auditoría*, y cuál quieres cuando un suscriptor se queja de que recibió el email equivocado?
- `subject_template` y `body_template` ambas vienen de `campaign.json`, y aun así `context` también carga esas dos claves. ¿Por qué ese overhead agrega +1 clave a cada fusión, y es el costo en el Paso 4 (tasas de engagement) algo más que cosmético?

## Paso 4: Mide aperturas y clics

Cada negocio se preocupa por un número detrás de una campaña: ¿lo *leyeron*? El registro de engagement es un segundo archivo JSONL, un evento `{"type": "open"|"click", "email": ...}` por suscriptor, y las tasas son `emails únicos abiertos/enviados` y `clicados/enviados`. La deduplicación por conjunto es aquí la corrección: un suscriptor que abre dos veces cuenta una vez, y un clic sin apertura sigue siendo un clic.

### 4.1 Escribe el calculador de tasas

**👟 Pista inicial :** Carga el registro de eventos, construye los *conjuntos* `opened` y `clicked` de emails únicos, luego divide por el conteo de enviados:

```bash
cat > events.jsonl <<'EOF'
{"type": "open", "email": "ada@example.com"}
{"type": "open", "email": "grace@example.com"}
{"type": "click", "email": "grace@example.com"}
EOF
```

```python
# tracking.py
import json

from subscribers import load_subscribers

def load_events(path: str = "events.jsonl") -> list[dict]:
    return [json.loads(line) for line in open(path) if line.strip()]

def engagement_rates(sent_count: int, events: list[dict]) -> dict:
    opened = {e["email"] for e in events if e["type"] == "open"}
    clicked = {e["email"] for e in events if e["type"] == "click"}
    return {"sent": sent_count,
            "opened": len(opened) / sent_count,
            "clicked": len(clicked) / sent_count}

if __name__ == "__main__":
    sent = load_subscribers()
    events = load_events()
    rates = engagement_rates(len(sent), events)
    print(f"sent:     {rates['sent']}")
    print(f"opened:   {rates['opened']*rates['sent']:.0f}/{rates['sent']}  ({rates['opened']:.1%})")
    print(f"clicked:  {rates['clicked']*rates['sent']:.0f}/{rates['sent']}  ({rates['clicked']:.1%})")
```

Todo el truco está en `{e["email"] for e in events ...}`, una comprensión de conjunto que convierte *eventos* en *emails únicos* en una sola expresión. `ada@example.com` abriendo dos veces seguiría siendo un elemento del conjunto, de modo que `opened` nunca puede exceder `sent` por doble conteo. Las tasas provienen de un *denominador que ya posees* (`sent_count` de la lista de suscriptores), no de asumir que "eventos == a quienes se les envió", el registro es el numerador, el import es el denominador.

**🎯 Resultado esperado :**

```
sent:     3
opened:   2/3  (66.7%)
clicked:  1/3  (33.3%)
```

**🩹 Si sale mal :** Si `opened: 2/3` lee como `3/3`, contaste *eventos* y no *emails*, falta la comprensión: `{e["email"] for e in events}` colapsa los duplicados; `len(events)` no. Si el denominador está mal, `sent_count` vino de `len(events)` en lugar de `load_subscribers()`, el registro no puede decirte cuántos emails *salieron*.

### 4.2 Verifica las tasas

**✅ Lista de verificación**

- ✅ `opened` = 2 emisores únicos de 3 enviados (66.7%); `clicked` = 1 de 3 (33.3%).
- ✅ Un evento `open` duplicado para el mismo email no cambia nada, conteo por deduplicación de conjunto, no por eventos.
- ✅ `engagement_rates()` toma el conteo de enviados como argumento, manteniendo el honesto "enviado" definido por el importador, no por el registro.

**🤔 Pregunta(s) socrática(s)**

- El seguimiento de aperturas es famosamente aproximado (paneles de vista previa, bloqueadores de imágenes, herramientas de privacidad). ¿Dónde vende de más la realidad "abierto = 66.7%", y qué palabra ("leído", "abierto", "cargado") usaría un dashboard cuidadoso para ese número exacto?
- Las tasas dividen por *enviado*, no por *entregado*. Los rebotes (el email nunca llegó) inflan ambas tasas. ¿Dónde en este pipeline restarías un conteo `bounced` para que las tasas describan lo que la gente de verdad recibió?

## Paso 5: Ejecuta el test A/B y elige a la ganadora

Las líneas de asunto mueven las tasas de apertura, y los marketers discuten sobre ellas para siempre, que es exactamente por qué en lugar de eso *mides*. "División A/B" significa aquí: divide la lista de suscriptores en dos mitades alternando por índice, dale a cada mitad una línea de asunto diferente (mismo cuerpo), y deja que el registro de engagement decida. La condición de victoria es la tasa de apertura por variante, y toda la decisión son tres líneas de aritmética.

### 5.1 Escribe el divisor y el reportero

**👟 Pista inicial :** `i % 2 == 0` alterna a los suscriptores entre variantes; un dict de estadísticas por variante acumula enviados/abiertos desde el archivo de resultados:

```bash
cat > effectiveness.jsonl <<'EOF'
{"variant": "A", "email": "ada@example.com", "opened": true}
{"variant": "B", "email": "grace@example.com", "opened": true}
{"variant": "A", "email": "alan@example.com", "opened": false}
EOF
```

```python
# abtest.py
import csv
import json
from collections import defaultdict

def ab_split(subscribers: list[dict], variant_a: str, variant_b: str) -> list[dict]:
    plan = []
    for i, sub in enumerate(subscribers):
        record = dict(sub)
        record["variant"] = "A" if i % 2 == 0 else "B"
        record["subject"] = variant_a if record["variant"] == "A" else variant_b
        plan.append(record)
    return plan

def load_outcomes(path: str = "effectiveness.jsonl") -> dict:
    outcomes = {}
    for line in open(path):
        if line.strip():
            record = json.loads(line)
            outcomes[record["email"]] = record
    return outcomes

if __name__ == "__main__":
    subscribers = [s for s in csv.DictReader(open("subscribers.csv", newline=""))
                   if "@" in s["email"]]
    outcomes = load_outcomes()

    plan = ab_split(subscribers,
                    "Your dashboard is ready",
                    "Start tracking with your dashboard")

    stats = defaultdict(lambda: {"sent": 0, "opened": 0})
    for row in plan:
        stats[row["variant"]]["sent"] += 1
        if outcomes[row["email"]]["opened"]:
            stats[row["variant"]]["opened"] += 1

    for variant in sorted(stats):
        s = stats[variant]
        print(f"variant {variant}: opened {s['opened']}/{s['sent']} = {s['opened']/s['sent']:.0%}")

    winner = max(stats, key=lambda v: stats[v]["opened"] / stats[v]["sent"])
    print(f"winner: variant {winner}")
```

`i % 2 == 0` es asignación alternante, Ada, Alan → A; Grace → B, una simplicidad deliberada que mantiene obvio a la vista *quién recibe qué asunto*. `defaultdict` con una fábrica `lambda` hace que `stats["A"]["sent"] += 1` funcione a la primera (`0` → `1`) sin pre-inicializar, los ceros se convierten en primeros incrementos gratis. El veredicto es un `max(...)` honesto sobre las tasas de apertura: el 1/1 de la variante B vence al 1/2 de la A *sin importar que la división sea desigual*, que es exactamente la "lista pequeña, gran advertencia" que le señalarías a cualquier marketer real.

**🎯 Resultado esperado :**

```
variant A: opened 1/2 = 50%
variant B: opened 1/1 = 100%
winner: variant B
```

**🩹 Si sale mal :** Si cada registro cae en A, el alternante usa `i % 2 == 1` de forma inconsistente entre `ab_split` y la demo, una rebanada. Si se imprime `winner: variant A`, la clave de `max` está comparando la dirección equivocada (estilo `min`), verifica que sea sobre `opened / sent`, no sobre `opened`.

### 5.2 Verifica al ganador del A/B

**✅ Lista de verificación**

- ✅ El orden de suscriptores (Ada, Grace, Alan) produce A:{Ada, Alan}, B:{Grace}; los resultados asignan Ada→abierto, Alan→cerrado, Grace→abierto.
- ✅ Tasas: A = 1/2 (50%), B = 1/1 (100%); ganador = B por tasa de apertura.
- ✅ Volver a ejecutar el mismo `effectiveness.jsonl` arroja el mismo ganador, los resultados son datos, no un volado.

**🤔 Pregunta(s) socrática(s)**

- La división alterna `i % 2 == 0`, que es *quirúrgica* pero *no aleatoria*. Si la lista resulta estar ordenada por, digamos, cohorte de registro, la variante B podría ser todos los clientes pagadores con aperturas de base más altas. ¿Qué cambia (y qué no cambia) un *barajado con semilla* sobre la honestidad del ganador?
- Con tamaños de variante de 2 y 1, el 100% es una persona. ¿Cuál es la diferencia entre "estadísticamente decisivo" y "se ve decisivo en tres emails", y cuál es el primer número umbral (suscriptores por variante) que hace defendible la expresión "ganador"?

## ⚠️ Errores comunes

- **Huecos donde debería haber nombres.** Un `{{product}}` faltante se renderiza como una cadena vacía, por diseño, pero la gente lo envía. Decide la política de variable faltante (en blanco / conservar crudo / lanzar) y hazla explícita, porque el predeterminado de hueco visible envía silenciosamente por email "Hello Ada, your  is waiting."
- **Mutar el dict compartido de la campaña.** `context = campaign` y luego `context.update(subscriber_fields)` hace que el `first_name` de Ada sobrescriba la fuente compartida para Grace. `dict(campaign)` primero, siempre.
- **Contar eventos como personas.** `len(events)` dice "ocurrieron tres aperturas", no "tres personas abrieron". Deduplica en conjuntos antes de dividir, o las tasas venden de más exactamente por el conteo de traslapes.
- **Saltar sin decirlo.** Un import que descarta una fila CSV inválida pero nunca la reporta esconde huecos de datos. Imprime el conteo de saltadas, o le estás enseñando silenciosamente la misma fila mala a cada ejecución futura.
- **Confiar en conteos antes que en definiciones.** `sent` debe venir del import, `opened`/`clicked` del registro, mezclar los dos denominadores es cómo una tasa supera el 100% sin que ningún bug sea obvio a primera vista.

## Lo que acabas de construir

El bucle completo de campañas de email en biblioteca estándar: renderizador de plantillas, import de suscriptores validado, un registro de outbox que anota exactamente lo que salió, tasas de engagement de emails únicos, y un experimento A/B cuyo ganador viene directo de los datos. La habilidad que vale la pena conservar es *separar las capas del pipeline*, la plantilla, la lista, el outbox, el registro y la decisión son dueños cada uno de un archivo y un trabajo, de modo que reemplazar cualquiera de ellos (una nueva línea de asunto A/B, una resta de conteo de rebotes) nunca se riega hacia los demás.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/email-campaign/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-campaign) en el repositorio del curso tiene los scripts completos además del `subscribers.csv` de muestra y las plantillas. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega **rebotes**: un `bounced_set` restado de `sent` antes de la división de tasas, denominador de "entrega" en lugar de "enviado", una mejora de una línea con una gran recompensa de honestidad.
- Agrega un **comando de vista previa** que renderiza un email en la terminal (`send.py ada@example.com`) con el asunto/cuerpo exactos que saldrían, una vista previa de envío vive encima de `render_campaign`.
- Persiste el **historial de envíos** como una segunda columna en el outbox (marcas de tiempo `bounced_at`, `opened_at` por suscriptor) para que el registro de auditoría gane la "garantía" que se desliza en la pregunta del Paso 3.
- Haz que la división A/B sea **aleatoria con semilla** (`random.Random(seed).shuffle`) con la semilla impresa en el reporte, el experimento se vuelve reproducible, y el marketer puede señalar la división exacta que se ejecutó.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓