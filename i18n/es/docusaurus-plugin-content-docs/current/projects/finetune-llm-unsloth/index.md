---
id: 2027-finetune-llm
title: "Ajusta finamente un pequeño modelo de lenguaje con Unsloth"
sidebar_label: "Ajusta finamente un pequeño modelo de lenguaje"
slug: /projects/finetune-llm-unsloth
description: "Gradúate del playground en el navegador a Python de verdad: ajusta finamente un modelo de lenguaje pequeño de código abierto con LoRA usando Unsloth, en una GPU gratuita."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';

# 🌍 Ajusta finamente un pequeño modelo de lenguaje con Unsloth

<ProjectPublishedDate projectId="2027-finetune-llm" />

En el track Difícil de Python 101, construiste un pequeñísimo modelo de lenguaje completamente desde cero — conteos de palabras, tablas de probabilidad de bigramas, muestreo ponderado. Este proyecto retoma exactamente ese hilo: en lugar de construir las matemáticas de un modelo de lenguaje desde la nada, tomarás un modelo real, preentrenado y de código abierto, y lo especializarás para una tarea de tu elección mediante el *ajuste fino* (fine-tuning) — ajustando sus pesos existentes con una pequeña cantidad de tus propios datos, usando [Unsloth](https://unsloth.ai), una biblioteca construida específicamente para hacer esto rápido y (lo importante) gratis.

Esto es opcional y no calificado — una buena opción una vez que hayas terminado el track Difícil de Python 101 (el modelo de lenguaje construido desde cero te da la intuición sobre la que se apoya este proyecto). Ver [Proyectos del mundo real](/docs/projects) para la lista completa, que sigue creciendo, incluyendo el [proyecto de Agente de IA](/docs/projects/ai-agent).

:::tip[Una diferencia honesta con el proyecto de Agente de IA]
El proyecto de Agente de IA corre enteramente en tu propia máquina. Este no puede hacerlo del todo — ajustar finamente un modelo de lenguaje, incluso uno pequeño, necesita una GPU, y la mayoría de las laptops personales no tienen una adecuada para el trabajo. Así que este proyecto divide el trabajo: la configuración del proyecto, la preparación de datos, y ejecutar tu modelo *terminado* ocurren localmente con `uv`, igual que en el proyecto de Agente de IA; el paso de ajuste fino en sí corre en una GPU gratuita alojada (Google Colab o Kaggle) en su lugar. Eso no es un atajo — es la forma honesta y estándar de hacer esto sin gastar dinero.
:::

## 🎯 Lo que harás

1. Instalar `uv` y configurar un proyecto local — el mismo primer paso que cada proyecto.
2. Preparar un pequeño conjunto de datos de ejemplos que le muestren al modelo el comportamiento que quieres que aprenda.
3. Obtener acceso gratuito a GPU vía Google Colab o Kaggle, y usar Unsloth para ajustar finamente con LoRA un pequeño modelo abierto (alrededor de 1000 millones de parámetros) sobre tu conjunto de datos.
4. Descargar el resultado — un pequeño archivo "adaptador", no un modelo completamente nuevo — y ejecutarlo localmente para ver tu modelo ajustado en acción.

## Paso 1: instala `uv`

`uv` es una sola herramienta que reemplaza la cadena habitual de "instalar Python, luego instalar pip, luego instalar una herramienta de entorno virtual, luego instalar paquetes" — puede instalar y gestionar versiones de Python por sí misma, además de las dependencias de tu proyecto.

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

Luego configura un proyecto local para los pasos de preparación de datos e inferencia (las partes que no necesitan una GPU):

```bash
uv init finetune-llm
cd finetune-llm
uv add datasets huggingface_hub
```

## Paso 2: prepara un pequeño conjunto de datos

El ajuste fino le enseña a un modelo un *comportamiento* específico, no hechos nuevos desde cero — funciona mejor con un conjunto de ejemplos pequeño, enfocado y bien formateado, no un enorme montón de texto crudo. Un formato común es una lista de pares instrucción/respuesta. Elige una tarea acotada y personal — algunas ideas: responder preguntas con un tono o personalidad específica, seguir un formato de salida fijo (por ejemplo, siempre responder en JSON válido), o resumir texto de la manera en que tú lo harías.

Escribe tus ejemplos localmente como un pequeño archivo JSON:

```python
# build_dataset.py
import json

examples = [
    {
        "instruction": "Summarize this course in one sentence.",
        "response": "A free, browser-based course teaching Python and pandas from first principles through a full data-analysis project.",
    },
    {
        "instruction": "Explain what a variable is, briefly.",
        "response": "A variable is a name that points to a value stored in memory, so you can refer to that value again by name instead of retyping it.",
    },
    # Add at least 30-50 more examples for the model to actually pick up a
    # pattern — a handful of examples is enough to see this code run, but not
    # enough to see a real behavior change once fine-tuned.
]

with open("dataset.jsonl", "w") as f:
    for example in examples:
        f.write(json.dumps(example) + "\n")

print(f"Wrote {len(examples)} examples to dataset.jsonl")
```

```bash
uv run python build_dataset.py
```

:::tip[Calidad sobre cantidad]
La propia documentación de Unsloth y la mayoría de las guías de ajuste fino coinciden en esto: 50 ejemplos cuidadosamente escritos y consistentes le enseñan un comportamiento a un modelo mucho más confiablemente que 500 descuidados o inconsistentes. Si tus ejemplos se contradicen entre sí (respondiendo el mismo tipo de pregunta de forma diferente cada vez), el modelo no tiene nada consistente que aprender.
:::

## Paso 3: ajusta finamente con Unsloth en una GPU gratuita

Este es el paso que necesita una GPU. [Unsloth](https://github.com/unslothai/unsloth) ofrece notebooks listos para usar diseñados específicamente para los niveles **gratuitos** de GPU de Google Colab y Kaggle — no instalas nada localmente para esta parte.

1. Ve a la [página de notebooks de Unsloth](https://docs.unsloth.ai/get-started/unsloth-notebooks) y abre uno de los notebooks de Colab amigables para principiantes para un modelo pequeño (alrededor de 1000 millones de parámetros — lo suficientemente pequeño para ajustar rápidamente y para realmente descargar y ejecutar después). Un modelo abierto de 1000 millones de parámetros, como una versión pequeña de Llama o Qwen, es un punto de partida razonable y bien soportado; revisa la lista de notebooks de Unsloth para ver qué modelo pequeño tiene actualmente una plantilla vigente y funcional, ya que qué modelo específico está mejor soportado cambia con el tiempo.
2. En el notebook, reemplaza su conjunto de datos de ejemplo por el tuyo: sube el `dataset.jsonl` que construiste en el Paso 2 (el panel de subida de archivos de Colab, o monta Google Drive), y apunta la celda de carga de datos del notebook hacia él en su lugar.
3. Ejecuta las celdas del notebook en orden. El paso central de ajuste fino usa **LoRA** (Low-Rank Adaptation): en lugar de actualizar los miles de millones de parámetros de un modelo (lento, necesita mucha memoria), LoRA congela el modelo original y entrena un par de matrices de rango mucho menor que se añaden encima — matemáticamente, si la matriz de pesos original es $W$, LoRA aprende una actualización de rango bajo $\Delta W = BA$ (donde $B$ y $A$ son matrices mucho más pequeñas) y usa $W + \Delta W$ en el momento de la inferencia. Esta es la misma idea que aproximar una matriz grande con una de dimensión menor — un concepto de álgebra lineal para el que ya tienes la base — aplicada para hacer que el ajuste fino sea lo suficientemente barato como para correr en una GPU gratuita.
4. Una vez que termina el entrenamiento, el notebook guarda tu resultado como un pequeño **adaptador** — solo las matrices $A$ y $B$, típicamente decenas de megabytes, no una copia de varios gigabytes del modelo completo. Descarga esta carpeta del adaptador a tu computadora.

:::tip[Revisa la documentación actual antes de empezar]
Qué modelo específico, qué notebook específico, y la propia API de Unsloth cambian rápido — más rápido que la mayoría del software, ya que esta es una herramienta activamente desarrollada y cercana a la investigación. Antes de ejecutar nada, abre la [documentación actual de Unsloth](https://docs.unsloth.ai) y usa el notebook y el modelo que actualmente recomiende para principiantes, en lugar de asumir que los detalles del año pasado todavía aplican.
:::

## Paso 4: ejecuta tu modelo ajustado localmente

De vuelta en tu propia máquina, carga el modelo base más tu adaptador descargado y pruébalo:

```bash
uv add transformers peft torch --extra-index-url https://download.pytorch.org/whl/cpu
```

```python
# infer.py
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model_name = "unsloth/<the-base-model-you-fine-tuned>"  # match Step 3's notebook
adapter_path = "./my-adapter"  # the folder you downloaded from Colab

tokenizer = AutoTokenizer.from_pretrained(base_model_name)
base_model = AutoModelForCausalLM.from_pretrained(base_model_name)
model = PeftModel.from_pretrained(base_model, adapter_path)

prompt = "Summarize this course in one sentence."
inputs = tokenizer(prompt, return_tensors="pt")
output = model.generate(**inputs, max_new_tokens=80)
print(tokenizer.decode(output[0], skip_special_tokens=True))
```

```bash
uv run python infer.py
```

Ejecutar un modelo de ~1000 millones de parámetros en CPU es lento (espera segundos reales, no milisegundos, por respuesta) pero funciona — esta es tu propia máquina realmente ejecutando un modelo de lenguaje ajustado, sin clave API, sin conexión a internet requerida una vez que los archivos del modelo están descargados.

## ⚠️ Errores comunes

- **Muy pocos ejemplos, o demasiado inconsistentes.** Un conjunto de datos de 5 ejemplos, o 50 ejemplos que responden preguntas similares de forma diferente cada uno, no le da al modelo nada confiable para generalizar — obtendrás algo cercano al modelo base sin ajustar.
- **Olvidar realmente cambiar por tu propio conjunto de datos.** Es fácil ejecutar un notebook de principio a fin sobre su conjunto de datos de *ejemplo* y concluir "funcionó" sin nunca haber entrenado con tus propios datos — siempre confirma que la celda de carga de datos está leyendo `dataset.jsonl`, no el archivo de demostración original del notebook.
- **Intentar ajustar finamente localmente en la GPU de una laptop (o sin GPU) en lugar de usar la gratuita alojada.** Incluso un modelo "pequeño" de 1000 millones de parámetros necesita memoria de GPU real para entrenar eficientemente — el nivel gratuito de Colab/Kaggle existe precisamente para que no necesites el tuyo propio.
- **Confundir el modelo base entre los pasos 3 y 4.** El adaptador que descargaste solo tiene sentido cargado sobre el modelo base *exacto* con el que fue entrenado — cargarlo sobre un modelo diferente (incluso uno con nombre similar) dará error o producirá silenciosamente resultados sin sentido.

## Lo que acabas de construir

No entrenaste un modelo de lenguaje desde cero — eso es lo que el track Difícil de Python 101 ya te hizo recorrer, de la manera honesta y basada en primeros principios. Aquí, tomaste un modelo real preentrenado y lo *especializaste*: la misma idea subyacente (un modelo cuyo comportamiento está moldeado por datos) pero a una escala y nivel de capacidad que nada construido desde cero en un navegador podría alcanzar, usando una técnica (LoRA) específicamente diseñada para hacer eso asequible en hardware gratuito.

## Hacia dónde ir desde aquí

- Prueba una tarea genuinamente diferente para tu próximo ajuste fino — un formato de salida fijo, un tono específico, o un dominio acotado (por ejemplo, responder solo preguntas sobre un tema) tiende a mostrar diferencias antes/después más claras y convincentes que un cambio amplio y de propósito general.
- Lee la propia documentación de Unsloth sobre **cuantización** — los notebooks del nivel gratuito ya usan cuantización de 4 bits para que el entrenamiento quepa en memoria GPU limitada; entender qué sacrifica eso (una pequeña cantidad de precisión) a cambio de qué obtiene (que quepa un modelo que de otra forma no cabría) vale la pena saberlo antes de depender de ello para algo más allá de un proyecto de curso.
- Compara esto con el [proyecto de Agente de IA](/docs/projects/ai-agent): ese cambia el *comportamiento* de un modelo dándole herramientas e instrucciones en el momento de la solicitud (sin entrenamiento involucrado); este cambia los pesos reales del modelo de antemano. Ambos son enfoques reales y actuales para construir con modelos de lenguaje — saber cuándo recurrir a uno u otro es algo genuinamente útil de haber sentido de primera mano, no solo leído.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa y accesible para principiantes para agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, hacer commit de tus archivos, y abrir el PR, paso a paso. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2027-finetune-llm" />
