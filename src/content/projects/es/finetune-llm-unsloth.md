---
title: "Fine-tune un Pequeño Modelo de Lenguaje con Unsloth"
description: "Gradúa del playground del navegador a Python real: ajusta un pequeño modelo de lenguaje de código abierto con LoRA usando Unsloth, en una GPU gratuita."
---

# 🎛️ Fine-tune un Pequeño Modelo de Lenguaje con Unsloth

En la ruta difícil de Python 101, construiste un pequeño modelo de lenguaje completamente desde cero, conteo de palabras, tablas de probabilidad de bigramas, muestreo ponderado. Este proyecto retoma ese hilo exacto: en lugar de construir las matemáticas de un modelo de lenguaje desde la nada, tomarás un modelo real preentrenado de código abierto y lo especializarás para una tarea de tu elección mediante *fine-tuning*, ajustando sus pesos existentes con una pequeña cantidad de tus propios datos, usando [Unsloth](https://unsloth.ai), una librería construida específicamente para hacer esto rápido y (lo que es importante) gratuito.

Esto es opcional y no calificado, encaja bien una vez que hayas terminado la ruta difícil de Python 101 (el modelo de lenguaje desde cero te da la intuición sobre la que se construye este proyecto). Consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente, incluyendo el [proyecto AI Agent](/es/proyectos/ai-agent).

:::tip[Una diferencia honesta con el proyecto AI Agent]
El proyecto AI Agent se ejecuta completamente en tu propia máquina. Este no puede, completamente, fine-tuning de un modelo de lenguaje, incluso uno pequeño, necesita una GPU, y la mayoría de las laptops personales no tienen una adecuada para el trabajo. Así que este proyecto divide el trabajo: la configuración del proyecto, la preparación de datos y la ejecución de tu modelo *terminado* se hacen localmente con `uv`, igual que el proyecto AI Agent; el paso real de fine-tuning se ejecuta en una GPU alojada gratuita (Google Colab o Kaggle) en su lugar. Eso no es un atajo, es la forma honesta y estándar de hacer esto sin gastar dinero.
:::

## 🎯 Lo que harás

1. Instala `uv` y configura un proyecto local, el mismo primer paso que en cada proyecto.
2. Prepara un pequeño conjunto de datos de ejemplos que le muestren al modelo el comportamiento que quieres que aprenda.
3. Obtén acceso gratuito a GPU vía Google Colab o Kaggle, y usa Unsloth para hacer fine-tuning con LoRA de un pequeño modelo abierto (alrededor de mil millones de parámetros) en tu conjunto de datos.
4. Descarga el resultado, un pequeño archivo de "adaptador", no un modelo nuevo completo, y ejecútalo localmente para ver tu modelo ajustado en acción.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino que siguen los pasos de esta lección, y el recomendado para la Configuración, preparación del conjunto de datos e inferencia local (Pasos 1 y 3), la sección de Configuración a continuación detalla cómo instalarlo. El Paso 2, el fine-tuning real, necesita una GPU y se ejecuta en el notebook oficial de Unsloth en Colab/Kaggle de todas formas (consulta el Paso 2 más abajo), ya que ese paso genuinamente no puede ocurrir en la mayoría de las laptops.

Si prefieres probar los pasos de preparación local del conjunto de datos e inferencia en un notebook alojado en lugar de con `uv`, hay un notebook complementario exactamente para eso:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finetune-llm-unsloth/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finetune-llm-unsloth/notebook.es.ipynb)

Este badge cubre solo los pasos **locales** (preparación del conjunto de datos e inferencia), el paso de fine-tuning en sí sigue usando el notebook oficial de Unsloth, enlazado por separado en el Paso 2.

## Configuración

`uv` es una herramienta única que reemplaza la cadena habitual de "instalar Python, luego instalar pip, luego instalar una herramienta de entorno virtual, luego instalar paquetes", puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

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

Luego configura un proyecto local para los pasos de preparación del conjunto de datos e inferencia (las partes que no necesitan GPU):

```bash
uv init finetune-llm
cd finetune-llm
uv add datasets huggingface_hub
```

## Paso 1: Prepara un pequeño conjunto de datos

El fine-tuning le enseña a un modelo un *comportamiento* específico, no hechos nuevos desde cero, funciona mejor con un conjunto pequeño, enfocado y bien formateado de ejemplos, no un montón enorme de texto sin procesar. Un formato común es una lista de pares instrucción/respuesta. Elige una tarea personal y estrecha, algunas ideas: responder preguntas en un tono o persona específica, seguir un formato de salida fijo (por ejemplo, siempre responder en JSON válido), o resumir texto de la forma que tú personalmente lo harías.

### 1.1 Escribe tus ejemplos y construye el archivo

**👟 Pista inicial :** Empieza con los dos ejemplos de abajo, mantén la forma exacta `{"instruction": ..., "response": ...}` para cada entrada, y amplía la lista a 30-50 antes de continuar, un objeto JSON por línea (`.jsonl`), no un solo array JSON:

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

**🎯 Resultado esperado :** `Wrote N examples to dataset.jsonl` donde N coincide con la longitud de tu lista, y al abrir `dataset.jsonl` en un editor se muestra un objeto JSON válido por línea, sin problemas de comas sobrantes, ya que cada línea se escribe independientemente.

**🩹 Si sale mal :** Si `dataset.jsonl` tiene menos líneas que ejemplos que escribiste, busca una clave duplicada por error en uno de tus diccionarios (Python mantiene silenciosamente solo el último valor para una clave repetida, lo que no fallará pero se verá incorrecto). Mantén la lista corta (2-3 ejemplos) solo para confirmar que el script se ejecuta, luego amplíala a 30-50 antes del Paso 2, un conjunto de 2 ejemplos pasa por el notebook de fine-tuning sin problemas pero no producirá un cambio de comportamiento visible después.

### 1.2 Verifica el conjunto de datos

**✅ Lista de verificación**

- ✅ `dataset.jsonl` existe con un objeto JSON por línea, cada uno con exactamente `instruction` y `response`.
- ✅ El conteo impreso por el script coincide con el número de ejemplos que realmente escribiste.
- ✅ Cada entrada mantiene la misma forma `{"instruction": ..., "response": ...}`, sin claves o formatos inconsistentes entre entradas.

**🤔 Pregunta(s) socrática(s)**

El consejo anterior advierte que "50 ejemplos cuidadosamente escritos y consistentes le enseñan un comportamiento a un modelo de forma mucho más confiable que 500 descuidados o inconsistentes." Si dos de tus ejemplos responden al *mismo* tipo de pregunta en estilos contradictorios, ¿qué tiene que aprender el modelo, y por qué agregar más ejemplos contradictorios empeoraría el problema en lugar de mejorar?

## Paso 2: Fine-tuning con Unsloth en una GPU gratuita

Este es el paso que necesita una GPU. [Unsloth](https://github.com/unslothai/unsloth) ofrece notebooks listos para ejecutar, diseñados específicamente para los niveles **gratuitos** de GPU de Google Colab y Kaggle, no instalas nada localmente para esta parte.

### 2.1 Confirma que el notebook original funciona primero

**👟 Pista inicial :** Ejecuta las celdas del notebook de arriba abajo *sin modificar* una vez, con sus propios datos de ejemplo, antes de tocar cualquier cosa, confirmar que el notebook original entrena y produce un adaptador primero aísla "si Unsloth funciona en absoluto" de "si el intercambio de mi conjunto de datos funciona", de la misma forma que probar con entrada conocida y correcta ayuda en todo lo demás de este curso.

1. Ve a la [página de notebooks de Unsloth](https://docs.unsloth.ai/get-started/unsloth-notebooks) y abre uno de los notebooks de Colab amigables para principiantes para un modelo pequeño (alrededor de 1B parámetros, lo suficientemente pequeño para hacer fine-tuning rápidamente y para realmente poder descargarlo y ejecutarlo después). Un modelo abierto de 1B parámetros, como una versión pequeña de Llama o Qwen, es un punto de partida razonable y bien soportado; revisa la lista de notebooks de Unsloth para ver qué modelo pequeño tiene una plantilla actual y funcional, ya que el que mejor se soporta cambia con el tiempo.
2. Ejecuta las celdas del notebook en orden, de principio a fin, sin cambiar nada.

**🎯 Resultado esperado :** La celda de entrenamiento del notebook imprime un número de pérdida de entrenamiento visiblemente decreciente (no llegará a cero, y no debería), y al terminar produce una carpeta de adaptador descargada de decenas de megabytes, no gigabytes.

**🩹 Si sale mal :** Si la pérdida de entrenamiento se mantiene plana en lugar de decrecer, el notebook no se está entrenando en absoluto, vuelve a ejecutar las celdas de carga de datos y entrenamiento y observa los registros en lugar de asumir que una celda larga está ocupada. Si Colab se desconecta a mitad de la ejecución, casi siempre es por tiempo de inactividad del nivel gratuito, reconéctate y vuelve a ejecutar desde el principio; no hay guardado parcial del que reanudar en los notebooks para principiantes.

### 2.2 Intercambia tu propio conjunto de datos

**👟 Pista inicial :** Ahora conecta tu trabajo del Paso 1: sube el `dataset.jsonl` que construiste, y apunta la celda de carga de datos del notebook a él en lugar del conjunto de datos de ejemplo, luego ejecuta las celdas en orden una vez más.

```text
# In the notebook's data-loading cell, point it at your dataset.jsonl
# instead of the notebook's bundled example dataset. Exactly which line
# changes depends on the notebook you opened — look for the cell that
# reads a .jsonl/.json dataset and give it your file's name/path.
```

**🎯 Resultado esperado :** La celda de entrenamiento nuevamente muestra una pérdida decreciente, y puedes confirmar desde la vista previa de datos cargados del notebook que ahora está leyendo tus entradas de `dataset.jsonl` (tus pares instrucción/respuesta), no el conjunto de demostración original.

**🩹 Si sale mal :** El fallo silencioso más común es que la celda de carga de datos siga leyendo el conjunto de datos original del notebook, este paso parece "tener éxito" sin haber entrenado nunca con tus datos. Confirma que la vista previa de datos cargados contiene realmente tus ejemplos antes de que se ejecute la celda larga de entrenamiento. La pérdida de entrenamiento que se mantiene plana generalmente se remonta a esta misma causa de conjunto de datos incorrecto.

:::tip[Consulta la documentación actual antes de empezar]
Qué modelo específico, qué notebook específico, y la propia API de Unsloth cambian rápido, más rápido que la mayoría del software, ya que es una herramienta de investigación activamente desarrollada. Antes de ejecutar cualquier cosa, abre la [documentación actual de Unsloth](https://docs.unsloth.ai) y usa el notebook y modelo que recomiende actualmente para principiantes, en lugar de asumir que los detalles del año pasado siguen siendo válidos.
:::

El paso central de fine-tuning usa **LoRA** (Low-Rank Adaptation): en lugar de actualizar todos los miles de millones de parámetros de un modelo (lento, necesita mucha memoria), LoRA congela el modelo original y entrena un par mucho más pequeño de matrices de bajo rango que se añaden encima, matemáticamente, si la matriz de pesos original es $W$, LoRA aprende una actualización de bajo rango $\Delta W = BA$ (donde $B$ y $A$ son matrices mucho más pequeñas) y usa $W + \Delta W$ en tiempo de inferencia. Esta es la misma idea que aproximar una matriz grande con una de menor dimensión, un concepto de álgebra lineal para el que ya tienes la base, aplicado para hacer el fine-tuning lo suficientemente barato como para ejecutarse en una GPU gratuita. Una vez que termina el entrenamiento, el notebook guarda tu resultado como un pequeño **adaptador**, solo las matrices $A$ y $B$, típicamente decenas de megabytes, no una copia de varios gigabytes de todo el modelo. Descarga esta carpeta de adaptador a tu computadora.

### 2.3 Verifica el fine-tuning

**✅ Lista de verificación**

- ✅ La celda de entrenamiento se ejecutó con tu propio `dataset.jsonl` (confirmado a través de la vista previa de datos cargados), no con los datos de demostración del notebook.
- ✅ La pérdida de entrenamiento decreció visiblemente durante la ejecución.
- ✅ Descargaste la carpeta de adaptador resultante a tu computadora, decenas de megabytes, no gigabytes.
- ✅ Sabes qué modelo base exacto fine-tuneó este notebook, ya que el Paso 3 necesita ese identificador preciso.

**🤔 Pregunta(s) socrática(s)**

¿Por qué el archivo de adaptador es solo de decenas de megabytes mientras que el modelo completo que ajusta es de gigabytes? Si LoRA solo almacenó las matrices de bajo rango $A$ y $B$ en lugar de re-guardar todo el modelo base, ¿qué pasaría si intentaras usar ese adaptador descargado en un modelo diferente del que fue entrenado?

## Paso 3: Ejecuta tu modelo ajustado localmente

De vuelta en tu propia máquina, carga el modelo base más tu adaptador descargado y pruébalo.

### 3.1 Escribe y ejecuta el script de inferencia

**👟 Pista inicial :** Carga el modelo *base* y el tokenizador primero con `AutoModelForCausalLM`/`AutoTokenizer`, exactamente como se nombra en el notebook del Paso 2, luego envuelve el modelo base con `PeftModel.from_pretrained(base_model, adapter_path)`, esa es la línea que realmente aplica tu fine-tuning encima:

```bash
uv add transformers peft torch --extra-index-url https://download.pytorch.org/whl/cpu
```

```python
# infer.py
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model_name = "unsloth/<the-base-model-you-fine-tuned>"  # match Step 2's notebook
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

Ejecutar un modelo de ~1B parámetros en CPU es lento (espera que tome segundos reales, no milisegundos, por respuesta) pero funciona, esta es tu propia máquina ejecutando realmente un modelo de lenguaje ajustado, sin clave de API, sin conexión a internet necesaria una vez que los archivos del modelo estén descargados.

**🎯 Resultado esperado :** Una respuesta generada que se incline notablemente hacia el estilo o formato de tus ejemplos de entrenamiento, no con la misma redacción exacta, sino con un cambio visible de cómo el modelo base sin ajustar respondería al mismo prompt.

**🩹 Si sale mal :** Un error de `size mismatch`/configuración al cargar el adaptador casi siempre significa que `base_model_name` no coincide exactamente con el modelo base que fine-tuneó el notebook del Paso 2, revisa la celda de carga de modelo del propio notebook para el identificador preciso y cópialo textualmente. Si la respuesta parece indistinguible de la de un modelo sin entrenar, verifica de nuevo que `adapter_path` apunte a la carpeta que descargaste (no a un marcador de posición vacío) y que el Paso 2 realmente entrenó con tus datos, no con el conjunto de demostración del notebook.

### 3.2 Verifica la salida del modelo ajustado

**✅ Lista de verificación**

- ✅ `uv run python infer.py` completa e imprime una respuesta, no un traceback.
- ✅ La respuesta muestra un cambio visible hacia el estilo o formato de tus ejemplos de entrenamiento, comparado con el comportamiento predeterminado del modelo base.
- ✅ El identificador del modelo base en `infer.py` coincide exactamente con el que fine-tuneó el notebook del Paso 2.

**🤔 Pregunta(s) socrática(s)**

La respuesta debería mostrar el *comportamiento* que entrenaste, pero no reproducir ningún ejemplo textualmente. Compara tu salida contra tus datos de entrenamiento: ¿el modelo está memorizando y repitiendo un ejemplo almacenado, o está generalizando el patrón instrucción/respuesta subyacente? ¿Cómo distinguirías la diferencia, y cuál preferirías tener?

## ⚠️ Errores comunes

- **Demasiados pocos o demasiado inconsistentes ejemplos.** Un conjunto de datos de 5 ejemplos, o 50 ejemplos que cada uno responda preguntas similares de forma diferente, no le da al modelo nada confiable de lo que generalizar, obtendrás algo cercano al modelo base sin ajustar.
- **Olvidar intercambiar realmente tu propio conjunto de datos.** Es fácil ejecutar un notebook de principio a fin con su conjunto de datos de *ejemplo* y concluir "funcionó" sin haber entrenado nunca con tus propios datos, siempre confirma que la celda de carga de datos esté leyendo `dataset.jsonl`, no el archivo de demostración original del notebook.
- **Intentar hacer fine-tuning localmente en la GPU de una laptop (o sin GPU) en lugar de usar la gratuita alojada.** Incluso un modelo "pequeño" de 1B necesita memoria de GPU real para entrenar eficientemente, el nivel gratuito de Colab/Kaggle existe específicamente para que no necesites el tuyo propio.
- **No coincidir el modelo base entre los Pasos 3 y 4.** El adaptador que descargaste solo tiene sentido cargado encima del modelo base *exacto* contra el que fue entrenado, cargarlo en un modelo diferente (incluso uno con nombre similar) dará error o producirá silenciosamente basura.

## Lo que acabas de construir

No entrenaste un modelo de lenguaje desde cero, eso es lo que la ruta difícil de Python 101 ya te mostró, de la forma honesta, desde los primeros principios. Aquí, tomaste un modelo real preentrenado y lo *especializaste*: la misma idea subyacente (un modelo cuyo comportamiento está moldeado por datos) pero a una escala y nivel de capacidad que nada construido desde cero en un navegador podría alcanzar, usando una técnica (LoRA) diseñada específicamente para hacerlo asequible en hardware gratuito.

## A dónde ir desde aquí

- Prueba una tarea genuinamente diferente para tu próximo fine-tuning, un formato de salida fijo, un tono específico, o un dominio estrecho (por ejemplo, solo responder preguntas sobre un tema) tiende a mostrar diferencias antes/después más claras y convincentes que un cambio amplio y general.
- Lee la propia documentación de Unsloth sobre **cuantización**, los notebooks de nivel gratuito ya usan cuantización de 4 bits para ajustar el entrenamiento en la memoria de GPU limitada; entender qué se intercambia (una pequeña cantidad de precisión) por lo que se obtiene (caber un modelo que de otro modo no cabría) vale la pena saberlo antes de confiar en ello para algo más allá de un proyecto de curso.
- Compara esto con el [proyecto AI Agent](/es/proyectos/ai-agent): ese uno cambia el *comportamiento* de un modelo dándole herramientas e instrucciones en el momento de la solicitud (sin entrenamiento involucrado); este uno cambia los pesos reales del modelo de antemano. Ambos son enfoques reales y actuales para construir con modelos de lenguaje, saber cuándo usar uno u otro es una cosa genuinamente útil haberla sentido en primera mano, no solo leído sobre ella.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
