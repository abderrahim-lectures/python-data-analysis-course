---
title: 'Agente Autónomo'
description: 'Crea una skill que permita a un agente de Claude tomar decisiones y ejecutar acciones sin intervención humana.'
difficulty: advanced
estimatedMinutes: 150
learningObjectives:
  - Comprender los componentes fundamentales de un loop de agente autónomo
  - Implementar capacidad de exploración y análisis del código fuente
  - Crear un sistema de planificación que descomponga metas en tareas ejecutables
  - Construir mecanismos de detección de errores con recuperación automática
prerequisites:
  - Python y comandos de terminal a nivel intermedio
  - Una skill de Claude Code existente (recomendamos empezar con la skill de UI)
  - Acceso a Claude Code con un servidor MCP
---

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo, ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-agent/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-agent/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-agent%2Fnotebook.es.ipynb)

## 🎯 Lo que harás

Ya creaste una skill que le permite a Claude controlar la interfaz de usuario de tu aplicación. Pero, ¿y si pudiera *pensar* y *decidir* por sí mismo? Esta es la skill que completa el cerebro de tu agente.

**Objetivo principal:** Construir una skill que pueda tomar una meta como "Agregar autenticación" y explorar autónomamente el código, decidir qué cambiar, implementarlo y verificar que funcione, todo sin intervención humana en cada paso.

**Tu skill podrá:**

- **Explorar y comprender** tu código: leer archivos, mapear funciones y dependencies
- **Razonar sobre tareas:** descomponer metas en pasos concretos y ejecutables
- **Ejecutar flujos de trabajo de múltiples pasos:** con manejo de estado, lógica de branching y control de flujo
- **Auto-recuperarse:** detectar errores y reintentar con un enfoque diferente

Pasos:

- Paso 1: Diseña el loop del agente
- Paso 2: Implementa la exploración del código fuente
- Paso 3: Crea el sistema de planificación
- Paso 4: Agrega detección de errores y recuperación

Dónde ejecutar esto:

Trabaja desde la carpeta `projects/` de tu repo `pyda-course`, dentro de una skill de Claude Code existente.

## Configuración

1. Asegúrate de tener Python 3.10+ y `uv` instalados
2. Ten una skill de Claude Code existente en `~/.claude/skills/`
3. Ten `mcp-remote` configurado y funcionando

---

## Paso 1: Diseña el loop del agente

El loop del agente es el ciclo fundamental de decisión de un agente autónomo: **Leer → Decidir → Actuar → Observar**. Este paso construye el loop base que todos los demás componentes alimentarán.

<details>
<summary>¿Por qué empezar por aquí?</summary>

Un agente sin un loop definido es solo un modelo de lenguaje con acceso a herramientas. El loop es lo que le da estructura: establece cuándo el agente lee contexto, cuándo toma una decisión y cuándo termina. Sin esto, la skill será impredecible.

</details>

### 1.1 Diseña la estructura del agente

Todo agente autónomo necesita: una **meta**, un **estado** que persista entre iteraciones y una lista de **acciones** que pueda ejecutar.

Crea el directorio de tu skill:

```bash
mkdir -p ~/.claude/skills/agent-skill
```

Crea `~/.claude/skills/agent-skill/agent.py` con el loop base:

```python
from typing import Any

def agent_loop(goal: str, state: dict[str, Any] | None = None):
    """Loop principal del agente autónomo."""
    state = state or {}
    state["goal"] = goal
    state["steps_completed"] = []

    while not state.get("done", False):
        # 1. Leer: qué está pasando ahora
        context = observe(state)

        # 2. Decidir: qué acción tomar
        action = decide(context, state)

        # 3. Actuar: ejecutar la acción
        result = perform(action, state)

        # 4. Observar: qué cambió
        state = update_state(state, action, result)

        # ¿Terminamos?
        if is_complete(state):
            state["done"] = True

    return state
```

Ahora necesitamos funciones para cada componente. Agrega estas funciones auxiliares:

```python
def observe(state: dict) -> dict:
    """Observa el estado actual y retorna contexto."""
    return {
        "goal": state.get("goal"),
        "steps_completed": state.get("steps_completed", []),
        "errors": state.get("errors", []),
    }

def decide(context: dict, state: dict) -> str:
    """Decide qué acción ejecutar basándose en el contexto."""
    if not context["steps_completed"]:
        return "explore"
    if context["errors"]:
        return "handle_error"
    return "plan_next"

def perform(action: str, state: dict) -> dict:
    """Ejecuta la acción seleccionada."""
    actions = {
        "explore": lambda s: {"type": "exploration", "files_found": []},
        "plan_next": lambda s: {"type": "plan", "tasks": []},
        "handle_error": lambda s: {"type": "recovery", "strategy": "retry"},
    }
    return actions.get(action, lambda s: {})(state)

def update_state(state: dict, action: str, result: dict) -> dict:
    """Actualiza el estado del agente con el resultado."""
    state["steps_completed"].append({"action": action, "result": result})
    return state

def is_complete(state: dict) -> bool:
    """Verifica si el agente alcanzó su meta."""
    goal = state.get("goal", "")
    steps = state.get("steps_completed", [])
    return len(steps) >= 3 and not state.get("errors")
```

### 1.2 Construye el orquestador

El orquestador conecta el loop con las herramientas de Claude. Crea `orchestrator.py`:

```python
from agent import agent_loop

def run_agent(goal: str):
    """Ejecuta el agente con una meta dada."""
    result = agent_loop(goal)
    print(f"Meta: {result['goal']}")
    print(f"Pasos completados: {len(result['steps_completed'])}")
    print(f"Estado final: {'Éxito' if result.get('done') else 'Incompleto'}")
    return result

if __name__ == "__main__":
    run_agent("Analizar la estructura del proyecto")
```

### Verifica

Ejecuta el orquestador y verifica que:
- El loop completa al menos 3 iteraciones
- El estado se mantiene entre iteraciones
- La función `decide` retorna acciones válidas

```bash
python orchestrator.py
```

### Checklist

- [ ] El loop del agente ejecuta el ciclo Leer → Decidir → Actuar → Observar
- [ ] El estado se mantiene entre iteraciones
- [ ] La función `decide` retorna acciones válidas
- [ ] El orquestador muestra el estado final

---

## Paso 2: Implementa la exploración del código fuente

Ahora que el loop funciona, el agente necesita entender el código con el que trabaja. Este paso le da la capacidad de descubrir archivos y analizar su contenido.

### 2.1 Explora el árbol de archivos

Crea una función que recorra el proyecto y encuentre archivos relevantes:

```python
import os
from pathlib import Path

def explore_files(root: str) -> list[dict]:
    """Explora recursivamente el árbol de archivos desde root."""
    files = []
    exclude = {"node_modules", ".git", "__pycache__", ".venv", "dist", "build"}

    for path in Path(root).rglob("*"):
        if path.is_file() and not any(part in exclude for part in path.parts):
            files.append({
                "path": str(path),
                "size": path.stat().st_size,
                "extension": path.suffix,
            })
    return files
```

### 2.2 Analiza el contenido de cada archivo

El agente necesita extraer información clave de cada archivo:

```python
def analyze_file(filepath: str) -> dict:
    """Analiza un archivo y extrae información relevante."""
    try:
        with open(filepath) as f:
            content = f.read()
    except (UnicodeDecodeError, PermissionError):
        return {"error": "No se pudo leer el archivo"}

    return {
        "lines": content.count("\n"),
        "imports": [
            line for line in content.split("\n")
            if line.strip().startswith(("import ", "from "))
        ],
        "classes": [
            line.strip().split()[1].split("(")[0]
            for line in content.split("\n")
            if line.strip().startswith("class ")
        ],
        "functions": [
            line.strip().split("(")[0].replace("def ", "")
            for line in content.split("\n")
            if line.strip().startswith("def ")
        ],
    }
```

### 2.3 Acción de exploración completa

Integra ambas funciones en una acción que el agente pueda ejecutar:

```python
def action_explore(state: dict) -> dict:
    """Explora el código fuente del proyecto."""
    root = state.get("project_root", ".")
    files = explore_files(root)

    analysis = {}
    for f in files[:20]:  # Limitar a 20 archivos para no sobrecargar
        analysis[f["path"]] = analyze_file(f["path"])

    return {
        "type": "exploration",
        "files_found": len(files),
        "analysis": analysis,
        "summary": {
            "total_files": len(files),
            "total_classes": sum(len(a.get("classes", [])) for a in analysis.values()),
            "total_functions": sum(len(a.get("functions", [])) for a in analysis.values()),
        },
    }
```

### Verifica

Ejecuta la exploración sobre un proyecto pequeño y verifica que:
- Retorna información de archivos reales
- El conteo de archivos es mayor que 0
- El análisis contiene las funciones y clases esperadas

### Checklist

- [ ] `explore_files` encuentra archivos en el proyecto
- [ ] `analyze_file` extrae imports, clases y funciones
- [ ] `action_explore` integra ambas funciones correctamente
- [ ] La exploración retorna un resumen con métricas

---

## Paso 3: Crea el sistema de planificación

Un agente autónomo no solo ejecuta acciones: planifica. Este paso le permite al agente descomponer una meta en tareas concretas.

### 3.1 Diseña el planificador

Crea un sistema que tome una meta y la convierta en una lista de tareas:

```python
def create_plan(goal: str, exploration: dict) -> list[dict]:
    """Crea un plan de tareas basado en la meta y la exploración."""
    plan = []

    # Analizar qué se necesita según la meta
    if "agregar" in goal.lower() or "add" in goal.lower():
        plan.append({"task": "Leer archivos existentes", "action": "read_files"})
        plan.append({"task": "Identificar puntos de integración", "action": "analyze"})
        plan.append({"task": "Implementar cambios", "action": "write_code"})
        plan.append({"task": "Verificar que funciona", "action": "test"})
    elif "corregir" in goal.lower() or "fix" in goal.lower():
        plan.append({"task": "Identificar el error", "action": "debug"})
        plan.append({"task": "Implementar la corrección", "action": "write_code"})
        plan.append({"task": "Verificar la corrección", "action": "test"})
    else:
        plan.append({"task": "Explorar el código", "action": "explore"})
        plan.append({"task": "Analizar findings", "action": "analyze"})

    return plan
```

### 3.2 Implementa la ejecución del plan

El agente necesita ejecutar el plan paso a paso, verificando cada tarea:

```python
def execute_plan(plan: list[dict], state: dict) -> dict:
    """Ejecuta el plan secuencialmente."""
    results = []

    for i, step in enumerate(plan):
        print(f"[{i + 1}/{len(plan)}] {step['task']}...")

        # Simular ejecución de la tarea
        result = perform(step["action"], state)
        results.append({"step": step, "result": result})

        if result.get("error"):
            state["errors"].append({"step": i, "error": result["error"]})
            break

    return {"plan_results": results, "completed": len(results) == len(plan)}
```

### Verifica

- La función `create_plan` genera una lista de tareas no vacía
- Cada tarea tiene los campos `task` y `action`
- `execute_plan` procesa las tareas secuencialmente

### Checklist

- [ ] `create_plan` genera un plan basado en la meta
- [ ] Cada tarea tiene campos `task` y `action`
- [ ] `execute_plan` procesa las tareas en orden
- [ ] El plan se interrumpe si una tarea falla

---

## Paso 4: Agrega detección de errores y recuperación

La parte final: hacer que el agente se recupere de errores sin intervención humana. Este es lo que separa un script de un agente autónomo.

### 4.1 Detecta errores comunes

Implementa un sistema que identifique errores frecuentes:

```python
ERROR_PATTERNS = {
    "syntax_error": ["SyntaxError", "IndentationError", "invalid syntax"],
    "import_error": ["ModuleNotFoundError", "ImportError", "No module named"],
    "permission_error": ["PermissionError", "Access denied", "Operation not permitted"],
    "network_error": ["TimeoutError", "ConnectionRefused", "requests.exceptions"],
    "file_error": ["FileNotFoundError", "No such file", "directory"],
    "type_error": ["TypeError", "argument", "unexpected keyword"],
}

def detect_error(output: str) -> str | None:
    """Detecta el tipo de error en la salida de un comando."""
    for error_type, patterns in ERROR_PATTERNS.items():
        if any(pattern in output for pattern in patterns):
            return error_type
    return None
```

### 4.2 Construye la recuperación con reintentos

El agente necesita saber cuándo reintentar y cuándo rendirse:

```python
MAX_RETRIES = 3

def should_retry(task: str, error_type: str, state: dict) -> bool:
    """Determina si el agente debe reintentar una tarea."""
    retries = state.get("retry_counts", {}).get(task, 0)

    # No reintentar errores de permisos
    if error_type == "permission_error":
        return False

    # No exceder el máximo de reintentos
    if retries >= MAX_RETRIES:
        return False

    # Actualizar contador de reintentos
    state.setdefault("retry_counts", {})
    state["retry_counts"][task] = retries + 1
    return True

def handle_error(task: str, error_type: str, state: dict) -> dict:
    """Maneja un error con la estrategia apropiada."""
    if should_retry(task, error_type, state):
        return {"action": "retry", "attempt": state["retry_counts"][task]}
    return {"action": "skip", "reason": f"Máximo de reintentos alcanzado para {task}"}
```

### 4.3 Integra todo

Ahora conecta el manejo de errores con el loop del agente. Modifica `agent_loop` para incluir recuperación:

```python
def agent_loop_with_recovery(goal: str, project_root: str = "."):
    """Loop del agente con recuperación de errores."""
    state = {
        "goal": goal,
        "project_root": project_root,
        "steps_completed": [],
        "errors": [],
        "retry_counts": {},
        "done": False,
    }

    # Paso 1: Explorar
    exploration = action_explore(state)
    state["exploration"] = exploration

    # Paso 2: Planificar
    plan = create_plan(goal, exploration)

    # Paso 3: Ejecutar con recuperación
    for step in plan:
        result = perform(step["action"], state)
        error = detect_error(str(result))

        if error:
            recovery = handle_error(step["task"], error, state)
            if recovery["action"] == "retry":
                result = perform(step["action"], state)
            else:
                state["errors"].append({"task": step["task"], "error": error})
                break

        state["steps_completed"].append({"task": step["task"], "result": result})

    state["done"] = len(state["errors"]) == 0
    return state
```

### Verifica

- `detect_error` identifica los 6 tipos de errores definidos
- `should_retry` respeta el límite de 3 reintentos
- `agent_loop_with_recovery` se recupera de errores automáticamente
- El agente termina con estado `done` en `True` o reporta errores

### Checklist

- [ ] `detect_error` identifica errores de sintaxis, imports, permisos, red, archivos y tipos
- [ ] `should_retry` respeta el máximo de 3 reintentos
- [ ] `handle_error` retorna las acciones "retry" o "skip"
- [ ] `agent_loop_with_recovery` se integra con el loop base
- [ ] El agente reporta errores al no poder recuperarse

---

## 🩹 Si sale mal

**El loop entra en un ciclo infinito:**
Asegúrate de que `is_complete` tenga condiciones de salida claras. Agrega un contador de iteraciones máximo como red de seguridad.

**El agente no encuentra archivos:**
Verifica que `explore_files` excluya correctamente directorios como `node_modules` y `.venv`. Prueba con `root = "."` para verificar desde el directorio actual.

**La planificación genera tareas vacías:**
Las palabras clave en `create_plan` pueden no coincidir con tu meta. Agrega más casos o usa un enfoque de fallback más genérico.

---

## 🧠 Preguntas socráticas

- ¿Cuándo un agente debería detenerse y pedir ayuda en lugar de reintentar?
- ¿Cómo decidirías entre diferentes estrategias de recuperación para un mismo error?
- ¿Qué pasaría si el agente pudiera aprender de errores pasados y evitar los mismos patrones?
- ¿Cómo balancearías la autonomía del agente con la supervisión humana en producción?

---

## 🎓 ¿Qué sigue?

Tu agente ahora puede tomar decisiones simples y ejecutar flujos de trabajo básicos. Pero un agente verdaderamente útil necesita integrarse con herramientas externas. En la skill de **MCP Server**, aprenderás a conectar tu agente con APIs, bases de datos y servicios para que pueda interactuar con el mundo real.

Si tu agente necesita entender código existente a nivel profundo, la skill de **Code Review Agent** te muestra cómo entrenar a Claude para analizar patrones de código y sugerir mejoras.
