---
title: "Generador de Pruebas con IA"
description: "Apunta un generador a una función pura de Python, haz que lea la firma y los valores por defecto, sintetice casos de prueba de frontera y de propiedades, opcionalmente pregunte a un LLM por pruebas de intención, y luego ejecute toda la suite y reporte verde o rojo."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Developer Tools", "Testing", "LLMs"]
prerequisites:
  - "Funciones, valores por defecto/argumentos y comprensiones de listas"
  - "Un modelo mental básico de qué es una prueba unitaria (assert + salida esperada)"
  - "No se necesita experiencia con pytest — el generador escribe las pruebas por ti"
learningObjectives:
  - "Leer la firma de una función y sus metadatos de parámetros con inspect.signature"
  - "Derivar entradas de prueba de valores frontera a partir de los valores por defecto de los parámetros en lugar de adivinarlos a mano"
  - "Sintetizar un módulo de pytest programáticamente a partir de esas entradas más comprobaciones de propiedades"
  - "Componer un prompt de 'prueba de intención' para un LLM y degradar con elegancia cuando no existe una clave de API"
  - "Ejecutar la suite generada como subproceso y convertir su código de salida en un veredicto"
---

# 🛠️ 🧪 Construye un Generador de Pruebas con IA

Escribir pruebas a mano se siente como volver a teclear la función que acabas de escribir, solo que más lento. Este proyecto construye el inverso: un generador que *lee* una función objetivo — su firma, sus valores por defecto y su comportamiento — y produce una suite de pytest que ejercita fronteras reales, propiedades reales (como la idempotencia) y una red de seguridad de argumentos intercambiados. Una capa opcional de LLM redacta "pruebas de intención" que capturan lo que se *supone* que hace la función, y toda la suite se ejecuta como subproceso para que tu herramienta reporte el veredicto en una línea. La función objetivo es un `clamp` diminuto, así que cada prueba generada es fácil de revisar de un vistazo — el mecanismo, no la matemática, es el punto.

Esto asume soltura con los valores por defecto de funciones y las comprensiones de listas; nada de esto es calificado, es opcional y no calificado — consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Inspeccionar la firma de una función y descubrir qué parámetros tienen valores por defecto y cuáles no.
2. Generar entradas candidatas de frontera a partir de esos valores por defecto — no de la adivinanza.
3. Renderizar esos candidatos en un módulo real de pytest, incluyendo pruebas de propiedades y de resguardo.
4. Componer un prompt de "prueba de intención" para un LLM y omitir la llamada a la API con elegancia cuando no hay una clave configurada.
5. Ejecutar la suite generada vía subprocess y traducir la salida en un veredicto.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — el punto completo es generar archivos reales de pruebas `.py` en tu disco y ejecutarlos, lo que `uv add pytest` hace instantáneo.

**Google Colab, Kaggle Notebooks y Binder** ejecutarán cada paso: `!pip install pytest` y luego `import pytest` — el generador escribe un archivo `test_*.py` en el directorio de trabajo del notebook, y `subprocess` lo ejecuta contra el mismo entorno. Los notebooks son un buen lugar; lo único que no pueden darte es un `test_clamp_simple.py` permanente después de que termine la sesión.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-test-generator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-test-generator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-test-generator%2Fnotebook.ipynb)

## Configuración

Todo lo necesario antes de la generación: un proyecto con pytest, y una función objetivo gloriosamente simple a la que apuntar el generador.

### Configura el proyecto

```bash
uv init ai-test-generator
cd ai-test-generator
uv add pytest
```

`pytest` alimenta tanto la suite generada *como* el ejecutor de listas de casos ingenuo del Paso 5. Los pasos posteriores asumen que escribes todo el código en un solo archivo, `testgen.py`.

**✅ Lista de verificación**

- ✅ `uv add pytest` termina, y `uv run python -m pytest --version` imprime una versión.
- ✅ Tienes `testgen.py` creado y listo para el Paso 1.

**🤔 Pregunta(s) socrática(s)**

- El generador apunta a `clamp`, una función con parámetros por defecto. ¿Qué parte de `inspect.signature` te dice que un parámetro *requiere* un argumento, y por qué el generador necesitará tratar esos dos tipos de parámetros de forma diferente?
- Cada prueba que escribe el generador se *ejecuta* al final, pero solo comparando el comportamiento con un valor esperado que él mismo también generó. ¿Dónde se vuelve circular "la máquina prueba a la máquina", y qué tipo de prueba no se puede falsificar de ese modo?

## Paso 1: Lee la firma del objetivo

### 1.1 Define el objetivo y vuelca su firma

**👟 Pista inicial :** Escribe `clamp(value, low=0.0, high=1.0)` — el guardia numérico clásico — y luego pregunta a `inspect.signature` qué sabe.

```python
# testgen.py
import inspect

def clamp(value, low=0.0, high=1.0):
    """Clamp a number into [low, high]."""
    return max(low, min(value, high))

sig = inspect.signature(clamp)
for name, param in sig.parameters.items():
    print(name, "kind=", param.kind, "default=", param.default)
```

`clamp` devuelve `max(low, min(value, high))` — una línea, pero densa: fija `value` por debajo en `low` y por arriba en `high`. `inspect.signature` devuelve una `Signature` cuyo `.parameters` mapea cada nombre de argumento a un `Parameter` que lleva `.kind` (cómo puede pasarse) y `.default`.

**🎯 Resultado esperado :**

```
value kind= POSITIONAL_OR_KEYWORD default= <class 'inspect._empty'>
low kind= POSITIONAL_OR_KEYWORD default= 0.0
high kind= POSITIONAL_OR_KEYWORD default= 1.0
```

**🩹 Si sale mal :** Si `sig.parameters` está vacío, el bucle `for` está leyendo el callable equivocado — imprime `sig` y verifica que diga `(value, low=0.0, high=1.0)`. Si `default=` no imprime nada para `low`, `clamp` se definió sin valores por defecto.

### 1.2 Detecta qué valores por defecto son reales

**👟 Pista inicial :** Escribe un predicado diminuto `has_default(param)` — `inspect.Parameter.empty` es un *marcador*, así que la prueba con `is` es la grafía correcta.

```python
# testgen.py (continued)
def has_default(param: inspect.Parameter) -> bool:
    return param.default is not inspect.Parameter.empty

for name, param in sig.parameters.items():
    print(name, "requires argument:", not has_default(param))
```

`is`/`is not` de Python sobre singletons es la comparación idiomática — `Parameter.empty` es un objeto centinela, y `==` puede ser engañado por cualquier cosa que accidentalmente nombres de forma idéntica. El generador necesita esta distinción para saber que `low`/`high` tienen valores semilla utilizables mientras que `value` necesita suposiciones de estilo humano.

**🎯 Resultado esperado :** `value requires argument: True`, y luego `False` para `low` y `high`.

**🩹 Si sale mal :** Si `low` reporta `requires argument: True`, comparaste con `==` o `is` contra un `inspect.Parameter.empty` *nuevo* — usa `param.default is not inspect.Parameter.empty` textualmente.

### 1.3 Verifica la inspección

**✅ Lista de verificación**

- ✅ Los tres nombres de parámetros, kinds y valores por defecto se imprimen exactamente como en 1.1.
- ✅ `has_default` distingue a `value` de `low`/`high` correctamente.
- ✅ `sig.parameters["low"].default` es `0.0` (un float, no un string).

**🤔 Pregunta(s) socrática(s)**

- `sig` se calcula una vez y se reutiliza en todos lados. ¿Qué se rompe si las pruebas generadas se escriben contra una versión *posterior* y editada de `clamp` — y por qué regenerar desde la firma viva es más seguro que almacenarla en caché?
- Los valores por defecto de los parámetros son objetos de Python, así que `clamp(value, low=0, high=1)` (ints) produce `0`/`1`, no `0.0`/`1.0`. ¿Qué línea de prueba generada diferiría en silencio, y es una diferencia de prueba o una diferencia de tipo?

## Paso 2: Genera entradas de frontera a partir de los valores por defecto

Escribir entradas de prueba a mano significa probar lo que *imaginaste* que era peligroso. Este generador en cambio deriva candidatos de la propia firma: cada valor por defecto, empujado por arriba y por abajo, más los bordes numéricos canónicos.

### 2.1 Construye el helper de valores de borde

**👟 Pista inicial :** Para un parámetro con valor por defecto, produce `[default-1, default-0.1, default, default+0.1, default+1]` más `0.0` y `1.0`, deduplicados; para un parámetro sin valor por defecto, recurre al conjunto de prueba clásico `[-1.0, 0.0, 0.5, 1.0]`.

```python
# testgen.py (continued)
def edge_values(param: inspect.Parameter) -> list[float]:
    if not has_default(param):
        return [-1.0, 0.0, 0.5, 1.0]
    d = param.default
    probes = {d - 1.0, d - 0.1, d, d + 0.1, d + 1.0, 0.0, 1.0}
    return sorted(round(x, 2) for x in probes)

for name, param in sig.parameters.items():
    print(name, "->", edge_values(param))
```

Las sondas son el *vocabulario de frontera* de las funciones numéricas: un paso por arriba y por debajo de un límite, el propio límite, y los dos anclas `0.0`/`1.0`. `round(x, 2)` es la verificación de la realidad — el punto flotante binario hace que `0.1` sea genuinamente feo (p. ej. `0.10000000000000003`), y las pruebas generadas deben comparar literales decimales limpios.

**🎯 Resultado esperado :**

```
value -> [-1.0, 0.0, 0.5, 1.0]
low -> [-1.0, -0.1, 0.0, 0.1, 1.0]
high -> [0.0, 0.9, 1.0, 1.1, 2.0]
```

**🩹 Si sale mal :** Si una fila muestra `0.10000000000000003` en lugar de `0.1`, el `round` se perdió. Si `value` muestra floats construidos desde `d` (y no tiene `d`), `has_default` devolvió `True` para un parámetro sin valor por defecto — la comparación del centinela se invirtió.

### 2.2 Explica las elecciones antes de ejecutar

**👟 Pista inicial :** Imprime la *razón* por la que se eligió cada candidato — una prueba generada sin una historia es solo ruido.

```python
# testgen.py (continued)
for name, param in sig.parameters.items():
    values = edge_values(param)
    note = "handpicked probe set" if not has_default(param) else "nudged around the default"
    print(f"{name}: {values} ({note})")
```

Colgar una razón explícita en cada candidato hace auditable al generador: cuando un futuro revisor pregunte "¿por qué probar `1.1`?", la nota dice "un paso por encima del valor por defecto de `high`". Esa auditabilidad es la diferencia entre pruebas generadas y un *oráculo* de pruebas.

**🎯 Resultado esperado :** Dos líneas para `low`/`high` que dicen `nudged around the default`, y una para `value` que dice `handpicked probe set`.

**🩹 Si sale mal :** Si cada línea dice "handpicked", la rama de `has_default` está mal. Si una línea dice "nudged around the default" para `value`, el valor por defecto de `value` está otra vez vacío en silencio.

### 2.3 Verifica las entradas

**✅ Lista de verificación**

- ✅ `edge_values` es determinista — misma llamada, misma lista, en cualquier orden de invocación.
- ✅ No aparecen floats duplicados dentro de una lista candidata, y cada valor está `round`ed a 2 decimales.
- ✅ Cada candidato es trazable a una razón (conjunto de sondas o empujón al valor por defecto).

**🤔 Pregunta(s) socrática(s)**

- `edge_values` asume parámetros numéricos. ¿Qué devuelve la misma función para un parámetro cuyo valor por defecto es `"hello"` — y cómo extenderías el helper para que una llamada posterior pudiera pasar un conjunto de sondas de *string*?
- Dos de los candidatos generados (p. ej. `-1.0` y `1.0`) probarían un comportamiento idéntico para *algunas* funciones. ¿Qué necesita saber un desambiguador inteligente que `edge_values` actualmente no puede ver?

## Paso 3: Renderiza un módulo de pytest

Ahora los candidatos se convierten en Python: un `test_clamp_simple.py` real, donde cada prueba es una función `test_*` que importa `clamp` y afirma una expectativa generada.

### 3.1 Compón el código de prueba como cadenas

**👟 Pista inicial :** Renderiza cada candidato de `value` en un `def test_<name>():` que afirme `clamp(v) == max(low, min(v, high))`, usando los floats reales por defecto de la firma como plantilla del valor esperado.

```python
# testgen.py (continued)
def render_case(value: float) -> str:
    name = str(value).replace(".", "p").replace("-", "neg")
    low, high = sig.parameters["low"].default, sig.parameters["high"].default
    return (f"def test_value_at_{name}():\n"
            f"    assert clamp({value}) == max({low}, min({value}, {high}))\n")

parts = ["from testgen import clamp", ""]
for v in edge_values(sig.parameters["value"]):
    parts.append(render_case(v))
print(render_case(0.5))
```

La expresión del valor esperado se *construye a partir de los mismos valores por defecto que lleva la firma* — mejor que `== clamp(v)`, que probaría una función contra sí misma y no probaría nada. La transformación de nombre `0.5 → value_at_0p5` mapea floats en identificadores válidos y legibles; `-1.0 → value_at_neg1p0`.

**🎯 Resultado esperado :**

```
def test_value_at_0p5():
    assert clamp(0.5) == max(0.0, min(0.5, 1.0))
```

**🩹 Si sale mal :** Si la indentación está mal, los saltos de línea `\n` de la f-string no tienen los cuatro espacios. Si el nombre contiene un `.` crudo, se omitió el `.replace(".", "p")`, y pytest rechazará el identificador.

### 3.2 Agrega las pruebas de propiedad y de resguardo

**👟 Pista inicial :** Anexa dos pruebas renderizadas a mano que *expresen intención*, no aritmética — idempotencia (aplicar `clamp` dos veces no cambia nada) y un resguardo de límites intercambiados.

```python
# testgen.py (continued)
parts.append("def test_idempotent():")
parts.append("    for v in " + str(edge_values(sig.parameters["value"])) + ":")
parts.append("        assert clamp(clamp(v)) == clamp(v)")
parts.append("")
parts.append("def test_swapped_bounds_guard():")
parts.append("    assert clamp(0.25, 0.5, 0.0) == 0.5")
open("test_clamp_simple.py", "w").write("\n".join(parts) + "\n")
print("wrote test_clamp_simple.py with", sum(1 for line in parts if line.startswith("def test_")), "tests")
```

La idempotencia es una *propiedad* — se cumple para toda entrada sin necesitar un valor esperado calculado a mano, que es la clase de prueba que atrapa un límite roto sin que hayas predicho el resultado. `clamp(0.25, 0.5, 0.0)` documenta lo que pasa cuando el llamador pasa `low > high`: gana `max`, y el resultado es `low`, bit por bit — una decisión que la función toma en silencio, así que la prueba la hace en voz alta.

**🎯 Resultado esperado :** `wrote test_clamp_simple.py with 6 tests` — cuatro renders de frontera de valor más las pruebas de propiedad y de resguardo.

**🩹 Si sale mal :** Si el conteo es 4, las dos líneas anexadas `def test_...` se escribieron sin el prefijo `def test_` o nunca se anexaron. Si el archivo contiene solo una prueba, `"\n".join(parts)` concatenó una lista de un solo elemento — olvida el `.append` dentro del ciclo y obtienes solo el último caso.

### 3.3 Verifica el render

**✅ Lista de verificación**

- ✅ `test_clamp_simple.py` se abre y se analiza como Python (sin errores de sintaxis en los nombres generados).
- ✅ Contiene exactamente 6 funciones `test_*`, importando `clamp` desde `testgen`.
- ✅ Las expresiones esperadas hacen referencia a `max(0.0, min(v, 1.0))`, no a una copia del cuerpo de `clamp`.

**🤔 Pregunta(s) socrática(s)**

- Una prueba renderizada como `assert clamp(v) == max(0.0, min(v, 1.0))` re-codifica la fórmula de `clamp` — solo puede fallar si las dos *grafías* difieren. ¿Qué verifica la prueba de idempotencia que este render tautológico pasaría felizmente?
- El generador le pega `.replace` a cada float, pero `-0.0` se formatea como `"-0.0"` → `neg0p0`. ¿Por qué eso es inofensivo *ahora* y a la vez una pista de que la generación de identificadores merece un contador `CASE_INDEX` en su lugar?

## Paso 4: Pide a un LLM pruebas de intención (opcional)

Las pruebas de frontera revisan matemática; las pruebas de intención revisan *significado*. Este paso compone un prompt determinista que le pregunta a un LLM qué se supone que hace la función y — la parte honesta — degrada a un archivo guardado cuando no hay clave de API configurada.

### 4.1 Compón el prompt desde la firma viva

**👟 Pista inicial :** Construye un prompt de un párrafo que incruste la cadena de firma real, y pide funciones de pytest ejecutables — nada más.

```python
# testgen.py (continued)
def build_prompt(target: str, signature: inspect.Signature) -> str:
    return (
        f"You are reviewing a pure Python function `{target}{signature}`. "
        "List the three most important test cases that would catch a real regression. "
        "Answer as runnable pytest functions named test_* inside a fenced code block, nothing else."
    )

prompt = build_prompt("clamp", sig)
print(prompt[:90], "...")
```

Enviar la *firma misma* (`clamp(value, low=0.0, high=1.0)`) es el truco completo — el modelo recibe el contrato en una línea, así que la "intención" que escribe está anclada a nombres de parámetros reales que las pruebas generadas pueden importar. El sufijo determinista ("tres más importantes...nada más") mantiene el prompt reproducible y la respuesta limitada en formato.

**🎯 Resultado esperado :** Una sola línea que empieza con `You are reviewing a pure Python function \`clamp(value, low=0.0, high=1.0)\`. List the three most important...` — con un `.` y una elipsis `...` del corte de impresión.

**🩹 Si sale mal :** Si el prompt incrusta una firma obsoleta, `build_prompt` se llamó con un `sig` en caché de antes de una edición — siempre pasa `inspect.signature(clamp)` fresco. Si falta la cláusula de formato de respuesta, vuelve a agregar el fragmento `...nothing else.` de la f-string.

### 4.2 Degrada con elegancia sin una clave de API

**👟 Pista inicial :** Revisa `OPENAI_API_KEY` (env) y luego `getpass` (interactivo), y cuando ninguno provea una clave, guarda el prompt para uso manual en lugar de fallar.

```python
# testgen.py (continued)
def maybe_ask_llm(prompt_text: str) -> None:
    import getpass, os
    key = os.environ.get("OPENAI_API_KEY") or getpass.getpass("OpenAI key (blank to skip): ")
    if not key:
        with open("llm_prompt.txt", "w") as f:
            f.write(prompt_text)
        print("no key: prompt saved to llm_prompt.txt")
        return
    print("key present — an API call would go here, replacing this line")

maybe_ask_llm(prompt)
```

`or` encadena las dos fuentes de clave para que un trabajo sin pantalla pueda configurar `OPENAI_API_KEY` y un usuario de terminal pueda escribirla — y la comprobación de cadena vacía es lo que hace que todo el asunto sea *opcional por defecto*. Guardar `llm_prompt.txt` significa que el paso del LLM nunca es un bloqueante: pégalo en cualquier modelo más tarde.

**🎯 Resultado esperado :** `no key: prompt saved to llm_prompt.txt` (primera ejecución, sin clave configurada).

**🩹 Si sale mal :** Si `GetPassWarning` escupe, la terminal no puede pedir de forma interactiva (CI/notebook) — ese es el trabajo de la *ruta de variable de entorno*; configura `OPENAI_API_KEY` y vuelve a ejecutar. Si imprime `key present`, una clave se filtró al entorno — la ruta del archivo aun se guarda, pero la línea de llamada a la API es intencionalmente un stub aquí.

### 4.3 Verifica la capa de prompt

**✅ Lista de verificación**

- ✅ `build_prompt` incrusta la firma *viva* y restringe el formato de la respuesta.
- ✅ Sin clave, `llm_prompt.txt` existe y su primera línea coincide con el prompt impreso.
- ✅ La ruta opcional nunca lanza cuando no hay clave configurada.

**🤔 Pregunta(s) socrática(s)**

- El prompt le pide a un LLM *tres* casos pero nunca ejecuta lo que devuelve. ¿Cuál es la cosa más peligrosa de auto-ejecutar pruebas escritas por un modelo que la ruta "guardar a archivo, pegar manualmente" elude gratis?
- `getpass` oculta las pulsaciones de teclas pero la clave aun vive en el proceso. ¿Por qué pasar la clave por una variable de entorno es *mejor* que escribirla — y para qué clase de función insistirías en que el LLM nunca vea el código fuente en absoluto?

## Paso 5: Ejecuta la suite y produce el veredicto

Las pruebas existen para ejecutarse. Este paso ejecuta el `test_clamp_simple.py` generado con pytest como subproceso, lee el código de salida e imprime el juicio de lo que trata todo el proyecto.

### 5.1 Ejecuta pytest desde tu proceso

**👟 Pista inicial :** Usa `sys.executable -m pytest` — no la cadena `pytest` pelada — para que el subproceso use el *mismo* intérprete del que tu proyecto llama al generador.

```python
# testgen.py (continued)
import subprocess, sys

def run_suite(path: str = "test_clamp_simple.py") -> int:
    result = subprocess.run(
        [sys.executable, "-m", "pytest", path, "-q"],
        capture_output=True, text=True, timeout=60,
    )
    print(result.stdout.strip().splitlines()[-1])
    return result.returncode

code = run_suite()
print("all green!" if code == 0 else "something failed — inspect and regenerate")
```

`sys.executable` es la dirección del Python que ejecuta *tu* script, así que el proceso hijo recibe el mismo entorno y site-packages — cambiar por un shell `pytest` pelado puede ejecutar silenciosamente un intérprete diferente y un `clamp` diferente. `returncode` es la puerta de salida de pytest: `0` significa que cada prueba pasó, cualquier otra cosa significa un fallo o un error de recolección.

**🎯 Resultado esperado :**

```
6 passed in 0.01s
all green!
```

**🩹 Si sale mal :** Si la última línea es `ERROR ... no tests ran`, pytest no pudo importar `testgen` — ejecuta desde el directorio que contiene ambos archivos (o agrega `PYTHONPATH=.`). Si dice `1 failed`, la expresión esperada de una prueba renderizada no coincide con el comportamiento de `clamp` — lee la aserción que falla y arregla la plantilla, no la función.

### 5.2 Introduce una regresión real y observa voltearse el veredicto

**👟 Pista inicial :** Reemplaza temporalmente `testgen.py` con un clamp *deliberadamente roto* (uno que olvida el clamp inferior), vuelve a ejecutar la misma suite y luego restaura el archivo original.

```python
# testgen.py (continued)
save = open("testgen.py").read()
open("testgen.py", "w").write(
    "def clamp(value, low=0.0, high=1.0):\n"
    "    return min(value, high)  # deliberately forgot the low clamp\n"
)
code = run_suite()
open("testgen.py", "w").write(save)   # restore the real function
print("caught the regression!" if code != 0 else "suite passed?!")
```

El proceso hijo de pytest importa `clamp` *desde el disco*, así que romper el archivo es la única forma de alcanzarlo — y restaurar desde la cadena guardada después mantiene intacto tu generador. Como las seis pruebas derivaron de fronteras reales, olvidar el clamp inferior dispara exactamente las sondas que se preocupan por el lado inferior: el caso de frontera `-1.0` y el resguardo de límites intercambiados afirman ambos contra `max(0.0, ...)`, y ambos se ponen rojos con cero ediciones al archivo de pruebas.

**🎯 Resultado esperado :** `2 failed, 4 passed in 0.02s` con los dos nombres que fallan `test_value_range_neg1p0` y `test_swapped_bounds_guard`, y luego `caught the regression!`.

**🩹 Si sale mal :** Si la suite se mantiene verde, la cadena "rota" no está realmente rota — `min(value, high)` debe ser el cuerpo completo (sin `max`, sin uso de `low`). Si pytest aun pasa después de la escritura, `open(..., "w")` corrió en un directorio diferente al de `test_clamp_simple.py` — escribe en la misma carpeta absoluta.

### 5.3 Verifica el veredicto

**✅ Lista de verificación**

- ✅ Ejecución limpia: `6 passed` y `all green!/code == 0`.
- ✅ Ejecución con regresión: al menos un fallo y un código de salida no cero, con cero ediciones al archivo de pruebas.
- ✅ Ambas ejecuciones usan `sys.executable -m pytest` para que la prueba vea tu `clamp` real.

**🤔 Pregunta(s) socrática(s)**

- El `clamp` deliberadamente roto "olvidó el clamp inferior", y aun así la prueba de idempotencia y las sondas de rango `0.0`/`0.5`/`1.0` siguen pasando — solo lo atraparon la sonda `-1.0` y el resguardo de límites intercambiados. ¿Cuáles dos *tipos* de pruebas fueron obligatorios aquí, y qué te dice eso sobre el valor de una sonda que se sienta *debajo* del rango por defecto como `-1.0`?
- `run_suite` imprime solo la última línea de la salida de pytest. Cuando una suite tiene 200 pruebas generadas y una falla, ¿qué debería imprimir una herramienta de producción *en lugar* de la cola — y qué garantiza ya el código de salida por sí solo?

## ⚠️ Errores comunes

- **Probar una función contra sí misma.** `assert clamp(v) == clamp(v)` pasa sin importar qué tan roto esté `clamp`. El valor esperado generado debe escribirse desde *otra* expresión (la fórmula `max/low/min`), o la prueba no prueba nada.
- **`==` en lugar de `is` sobre `Parameter.empty`.** `param.default == inspect.Parameter.empty` puede ser engañado; el centinela debe compararse con `is`, o cada parámetro "sin valor por defecto" parecerá tener uno.
- **`pytest` pelado en un subproceso.** En una máquina con varios Pythons, `subprocess.run(["pytest", ...])` puede ejecutar un intérprete diferente sin `clamp`. Siempre lanza `[sys.executable, "-m", "pytest", ...]`.
- **Floats filtrándose en los nombres de funciones.** `0.1` y `-1.0` son floats válidos pero identificadores inválidos; el mapeo `.replace` existe precisamente porque los identificadores generados deben hacer ida y vuelta.
- **Deriva de nombre/colección generados.** Un archivo de pruebas que pierde su prefijo `test_` inicial (o el `def test_` en los appends) se *colecciona como nada* — pytest reporta "no tests ran" con código de salida 5, y tu pipeline dice rojo por la razón equivocada.
- **Almacenar en caché la firma.** Renderizar contra un `sig` obsoleto construye pruebas para código que cambió; siempre regenera a partir de una llamada fresca a `inspect.signature(...)`.

## Lo que acabas de construir

Un generador de pruebas con tres fuentes honestas de verdad: la firma (qué argumentos existen), los valores por defecto (cuáles son los extremos) y la intención escrita por humanos (propiedades que siempre debe cumplir). Renderiza un archivo real de pytest, lo ejecuta como subproceso y hasta puede llamar a un LLM por pruebas de intención cuando hay una clave presente — y se probó a sí mismo atrapando el clamp deliberadamente roto. La idea transferible es más grande que las pruebas: "derivar el arnés de la interfaz, renderizarlo como texto, ejecutarlo y leer el código de salida" es el mismo esqueleto que los generadores de código, los renderizadores de configuración y los helpers de CI.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/ai-test-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-test-generator) en el repositorio del curso es el generador completo como notebook — volcado de firma, sondas de borde, pruebas renderizadas, prompt opcional de LLM y el veredicto rojo/verde en un solo lugar. Clónalo o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Generaliza `render_case` a cualquier *tipo* de parámetro: los strings reciben sondas `["", "a", "a"*N]`, las listas reciben vacío/un solo elemento/ordenado, y el valor esperado viene de una propiedad por tipo en lugar de una plantilla de fórmula.
- Agrega una bandera CLI `--limit` para que los conjuntos de sondas enormes rendericen una muestra aleatoria acotada — la generación se mantiene rápida mientras aun se fuzza el espacio de frontera.
- Conecta el veredicto a un hook de git: al hacer commit, regenera la suite para los módulos cambiados y bloquea el commit si `returncode != 0`.
- Convierte `llm_prompt.txt` en una llamada real con clave y *colecciona* las pruebas devueltas por el modelo, anexándolas a la suite — manteniendo intacto el respaldo manual.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓