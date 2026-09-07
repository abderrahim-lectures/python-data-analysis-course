---
title: "Hub de Automatización del Hogar"
description: "Automatiza dispositivos del hogar con reglas, horarios, comandos de voz y detección de presencia."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["iot", "cli", "async"]
learningObjectives:
  - "Modelar dispositivos del hogar y reglas de automatización como dataclasses de Python"
  - "Implementar un motor activador-acción que evalúe reglas contra el estado de los dispositivos"
  - "Construir un sistema de programación para automatizaciones basadas en tiempo"
  - "Detectar presencia a partir de pings de red y activar cadenas de reglas"
prerequisites:
  - "Python 101"
---

# 🏠 Hub de Automatización del Hogar

Tu hogar inteligente es tan inteligente como las reglas que conectan sus dispositivos — un sensor de movimiento que enciende una luz, un termostato que se ajusta cuando sales, una cerradura de puerta que se activa a la hora de dormir. Este proyecto construye un motor de automatización del hogar basado en reglas en Python: defines dispositivos (luces, termostatos, cerraduras), escribes reglas si-esto-entonces-aquello, programas activadores basados en tiempo y detectas presencia a partir de pings de red. El motor se ejecuta localmente, procesa eventos y ejecuta acciones — no se requiere ningún servicio en la nube.

Esto asume Python 101 — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias que necesitarás.
2. Modelar dispositivos del hogar (luces, termostatos, cerraduras) como clases de Python con estado.
3. Construir un motor de reglas que evalúe pares activador-acción contra el estado actual de los dispositivos.
4. Implementar programación basada en tiempo para automatizaciones recurrentes.
5. Añadir detección de presencia que vigile los pings de los dispositivos en la red.
6. Conectar todo en una CLI que registra dispositivos, escribe reglas y ejecuta el motor.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — este proyecto simula pings de red y ejecuta un motor de reglas que procesa eventos en un bucle. Está diseñado para ejecutarse en una máquina conectada a tu red doméstica.

**Google Colab, Kaggle Notebooks y Binder** funcionan para probar la herramienta. El notebook usa estados de dispositivos simulados y pings falsos en lugar de tráfico de red real.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/home-automation/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/home-automation/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fhome-automation%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de construir: un entorno de Python, una biblioteca de programación y un directorio de proyecto.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Crea el scaffold del proyecto

```bash
uv init home-automation
cd home-automation
uv add click schedule
```

`click` construye la interfaz CLI, y `schedule` maneja la programación de trabajos basados en tiempo. El proyecto mantiene dispositivos, reglas, programación, presencia y la CLI en archivos separados.

### Crea la estructura del proyecto

```bash
mkdir -p hub
touch hub/__init__.py hub/devices.py hub/rules.py hub/scheduler.py hub/presence.py hub/engine.py hub/cli.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `home-automation/` existe con un `pyproject.toml`, y `click` y `schedule` están instalados.
- ✅ El directorio `hub/` tiene todos los archivos de módulo requeridos.

## Paso 1: Modela los dispositivos del hogar

Cada dispositivo de hogar inteligente tiene un tipo (luz, termostato, cerradura), un nombre, una ubicación y un estado (encendido/apagado, temperatura, cerrado/abierto). Modelar dispositivos como clases con métodos como `turn_on()` y `set_temperature()` te da una API limpia para que el motor de reglas la llame.

### 1.1 Define las clases de dispositivos

**👟 Pista inicial :** Crea `hub/devices.py` con una clase base `Device` y subclases específicas por tipo.

```python
# hub/devices.py
from dataclasses import dataclass, field

@dataclass
class Device:
    id: str
    name: str
    location: str
    device_type: str

    def set_state(self, **kwargs):
        for k, v in kwargs.items():
            if hasattr(self, f"_{k}"):
                setattr(self, f"_{k}", v)

@dataclass
class Light(Device):
    _is_on: bool = False
    _brightness: int = 100

    @property
    def is_on(self): return self._is_on

    def turn_on(self, brightness: int = 100):
        self._is_on = True
        self._brightness = brightness

    def turn_off(self):
        self._is_on = False

    def toggle(self):
        if self._is_on:
            self.turn_off()
        else:
            self.turn_on()

@dataclass
class Thermostat(Device):
    _temperature: float = 70.0
    _target: float = 72.0

    @property
    def temperature(self): return self._temperature

    @property
    def target(self): return self._target

    def set_target(self, temp: float):
        self._target = temp

@dataclass
class Lock(Device):
    _locked: bool = True

    @property
    def is_locked(self): return self._locked

    def lock(self):
        self._locked = True

    def unlock(self):
        self._locked = False
```

Cada clase de dispositivo guarda estado mutable en campos con prefijo de guion bajo (`_is_on`, `_temperature`) con accessors `@property`. Esto mantiene limpia la API pública (`light.is_on`) mientras permite la mutación a través de métodos (`light.turn_on()`). La clase base `Device` proporciona un `set_state` genérico para que el motor de reglas lo use sin conocer el tipo específico de dispositivo.

**🎯 Resultado esperado :** `Light(id="l1", name="Living Room", location="Living Room")` crea una luz que comienza apagada. `light.turn_on()` establece `light.is_on` en `True`.

**🩹 Si sale mal :** Si `is_on` siempre es `False` después de `turn_on()`, la propiedad está leyendo el valor por defecto de la clase en lugar del `_is_on` de la instancia. Asegúrate de que `@property` esté definida en la clase, no en `__init__`.

### 1.2 Construye un registro de dispositivos

```python
# hub/devices.py (continued)
class DeviceRegistry:
    def __init__(self):
        self.devices: dict[str, Device] = {}

    def register(self, device: Device):
        self.devices[device.id] = device

    def get(self, device_id: str) -> Device | None:
        return self.devices.get(device_id)

    def by_location(self, location: str) -> list[Device]:
        return [d for d in self.devices.values() if d.location == location]
```

**🎯 Resultado esperado :** `registry.register(light)` hace que la luz se pueda encontrar por ID y por ubicación.

**🩹 Si sale mal :** Si `by_location` siempre devuelve una lista vacía, verifica que las cadenas de ubicación coincidan exactamente (sensible a mayúsculas).

### 1.3 Verifica el modelado de dispositivos

**✅ Lista de verificación**

- ✅ `Light`, `Thermostat` y `Lock` comienzan con valores por defecto sensatos.
- ✅ Métodos como `turn_on()`, `set_target()`, `lock()` cambian el estado del dispositivo.
- ✅ `DeviceRegistry` encuentra dispositivos por ID y por ubicación.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué usar `@property` para `is_on` en lugar de exponer `_is_on` directamente? ¿Qué te compra la indirección cuando más tarde añades registro de logs o emisión de eventos?
- Si añadieras un nuevo tipo de dispositivo (digamos, un `Speaker`), ¿cuál es la interfaz mínima que necesita implementar para que el motor de reglas lo controle?

## Paso 2: Construye el motor de reglas activador-acción

El motor de reglas es el cerebro del hogar: vigila eventos (una luz se enciende, la temperatura baja de un umbral, una puerta se abre) y ejecuta acciones (enviar una notificación, ajustar otro dispositivo, registrar una entrada). Cada regla es un par si-esto-entonces-aquello.

### 2.1 Define las reglas y el evaluador

**👟 Pista inicial :** Crea `hub/rules.py` con una dataclass `Rule` y una función `evaluate_rules`.

```python
# hub/rules.py
from dataclasses import dataclass
from typing import Callable
from hub.devices import DeviceRegistry

@dataclass
class Condition:
    device_id: str
    attribute: str  # "is_on", "temperature", "is_locked"
    operator: str   # "equals", "not_equals", "greater_than", "less_than"
    value: str      # compared as string, cast internally

@dataclass
class Action:
    device_id: str
    method: str     # "turn_on", "turn_off", "set_target", "lock", "unlock"
    args: dict = None

@dataclass
class Rule:
    name: str
    trigger: str  # "state_change", "schedule", "presence"
    conditions: list[Condition]
    actions: list[Action]
    enabled: bool = True

def evaluate_condition(condition: Condition, registry: DeviceRegistry) -> bool:
    """Check if a single condition is true given current device state."""
    device = registry.get(condition.device_id)
    if device is None:
        return False
    attr_val = getattr(device, condition.attribute, None)
    if attr_val is None:
        return False

    target = condition.value
    if condition.operator == "equals":
        return str(attr_val) == target
    elif condition.operator == "not_equals":
        return str(attr_val) != target
    elif condition.operator == "greater_than":
        return float(attr_val) > float(target)
    elif condition.operator == "less_than":
        return float(attr_val) < float(target)
    return False

def evaluate_rules(
    rules: list[Rule],
    registry: DeviceRegistry,
    event_device_id: str | None = None,
) -> list[tuple[Rule, list[str]]]:
    """Evaluate all enabled rules and return those that fire with their action logs."""
    results = []
    for rule in rules:
        if not rule.enabled:
            continue
        all_met = all(evaluate_condition(c, registry) for c in rule.conditions)
        if not all_met:
            continue
        logs = []
        for action in rule.actions:
            device = registry.get(action.device_id)
            if device is None:
                logs.append(f"  SKIP: device {action.device_id} not found")
                continue
            method = getattr(device, action.method, None)
            if method is None:
                logs.append(f"  SKIP: {action.device_id} has no method {action.method}")
                continue
            args = action.args or {}
            method(**args)
            logs.append(f"  ACTION: {action.device_id}.{action.method}({args})")
        results.append((rule, logs))
    return results
```

La función `evaluate_condition` lee un atributo de dispositivo (`is_on`, `temperature`) y lo compara contra el valor de la condición usando el operador especificado. `evaluate_rules` ejecuta todas las reglas habilitadas y recolecta las que tienen todas sus condiciones cumplidas — la comprobación de "todas las condiciones" significa que cada condición de una regla debe ser verdadera para que la regla se active. Cuando una regla se activa, ejecuta cada acción llamando al método nombrado en el dispositivo objetivo.

**🎯 Resultado esperado :** Una regla con la condición `thermostat.temperature < 68` dispara `light.turn_on()` cuando el termostato marca 65 grados.

**🩹 Si sale mal :** Si las reglas nunca se activan, verifica que `rule.enabled` sea `True` y que los nombres de atributos de la condición coincidan exactamente con los nombres de `@property` del dispositivo. Si se llama al método incorrecto del dispositivo, la cadena `action.method` no coincide con el nombre del método de la clase del dispositivo.

### 2.2 Prueba la evaluación de reglas

```python
# Quick test
from hub.devices import Light, Thermostat, DeviceRegistry
from hub.rules import Rule, Condition, Action, evaluate_rules

reg = DeviceRegistry()
light = Light(id="l1", name="Living Room Light", location="Living Room")
thermo = Thermostat(id="t1", name="Living Room Thermostat", location="Living Room", _temperature=65.0)
reg.register(light)
reg.register(thermo)

rule = Rule(
    name="Warm up",
    trigger="state_change",
    conditions=[Condition(device_id="t1", attribute="temperature", operator="less_than", value="68")],
    actions=[Action(device_id="l1", method="turn_on")],
)
results = evaluate_rules([rule], reg)
assert len(results) == 1
assert light.is_on
```

**🎯 Resultado esperado :** La aserción pasa; la luz está encendida después de la evaluación de la regla.

**🩹 Si sale mal :** Si la luz no se encendió, la comparación de la condición `less_than` puede estar comparando cadenas en lugar de flotantes — revisa el cast `float()` en `evaluate_condition`.

### 2.3 Verifica el motor de reglas

**✅ Lista de verificación**

- ✅ Una regla se activa cuando todas sus condiciones están cumplidas.
- ✅ Una regla no se activa cuando alguna condición falla.
- ✅ Las acciones llaman a los métodos correctos de los dispositivos con los argumentos correctos.

**🤔 Pregunta(s) socrática(s)**

- Las reglas evalúan todas las condiciones cada vez que ocurre un cambio de estado. Para una casa con 50 dispositivos y 20 reglas, eso son 1,000 comprobaciones de condiciones por evento. ¿Cómo lo optimizarías — reevaluando solo las reglas cuyas condiciones hacen referencia al dispositivo que cambió?
- ¿Qué pasa si dos reglas intentan establecer el mismo dispositivo en estados conflictivos? ¿Cómo añadirías prioridad u orden para resolver conflictos?

## Paso 3: Implementa la programación basada en tiempo

Algunas automatizaciones no las activa el estado de los dispositivos — se ejecutan con un horario. "Apaga todas las luces a medianoche", "baja el termostato a las 10 PM", "cierra las puertas a la hora de dormir". Este paso usa la biblioteca `schedule` para ejecutar reglas en momentos específicos.

### 3.1 Construye el programador

**👟 Pista inicial :** Crea `hub/scheduler.py` con funciones para registrar y ejecutar reglas programadas.

```python
# hub/scheduler.py
import schedule
import time
from hub.rules import Rule, evaluate_rules
from hub.devices import DeviceRegistry

class AutomationScheduler:
    def __init__(self, registry: DeviceRegistry, rules: list[Rule]):
        self.registry = registry
        self.rules = rules

    def schedule_rule(self, rule: Rule, time_str: str):
        """Schedule a rule to run at a specific time (e.g., '22:00')."""
        def job():
            results = evaluate_rules([rule], self.registry)
            for r, logs in results:
                for log in logs:
                    print(f"  [{time_str}] {log}")

        schedule.every().day.at(time_str).do(job)
        print(f"Scheduled '{rule.name}' at {time_str}")

    def run_pending(self):
        schedule.run_pending()

    def clear(self):
        schedule.clear()
```

La biblioteca `schedule` maneja el momento — solo registras una función para que se ejecute a una hora específica cada día. `run_pending()` se llama en un bucle para verificar si algún trabajo programado está pendiente. El cierre `job` captura la regla y el registro, así que cuando llega la hora programada, evalúa la regla contra el estado actual del dispositivo y ejecuta cualquier acción que coincida.

**🎯 Resultado esperado :** `scheduler.schedule_rule(rule, "22:00")` imprime "Scheduled 'Warm up' at 22:00" y registra el trabajo.

**🩹 Si sale mal :** Si el trabajo nunca se ejecuta, `run_pending()` no se está llamando en un bucle. Si el formato de hora es incorrecto, `schedule` lanza un `ValueError` — usa el formato `HH:MM` de 24 horas.

### 3.2 Prueba con tiempo simulado

```python
# Quick test (skip actual waiting)
import schedule
from hub.devices import Light, DeviceRegistry
from hub.rules import Rule, Condition, Action

reg = DeviceRegistry()
light = Light(id="l1", name="Bedroom Light", location="Bedroom")
reg.register(light)

rule = Rule(
    name="Bedtime",
    trigger="schedule",
    conditions=[],
    actions=[Action(device_id="l1", method="turn_off")],
)

scheduler_job = lambda: print("  [22:00] ACTION: l1.turn_off({})")
schedule.every().day.at("22:00").do(scheduler_job)

# Simulate: run pending jobs immediately
schedule.run_pending()
```

**🎯 Resultado esperado :** `schedule.run_pending()` imprime "ACTION: l1.turn_off({})" inmediatamente (ya que el trabajo está pendiente a las 22:00 y lo estamos llamando en una prueba).

**🩹 Si sale mal :** Si no se imprime nada, la hora programada aún no ha llegado en la prueba — `schedule.run_pending()` solo ejecuta trabajos cuya hora ha pasado desde la última llamada.

### 3.3 Verifica la programación

**✅ Lista de verificación**

- ✅ `schedule_rule` registra un trabajo que imprime cuando se llama a `run_pending()`.
- ✅ Las reglas sin condiciones ejecutan sus acciones incondicionalmente en la hora programada.
- ✅ `clear()` elimina todos los trabajos programados.

**🤔 Pregunta(s) socrática(s)**

- La biblioteca `schedule` ejecuta trabajos en un bucle bloqueante. ¿Cómo ejecutarías el programador junto a un servidor web o un listener de WebSocket para actualizaciones de dispositivos en tiempo real?
- Si una regla programada se activa mientras un dispositivo está en un estado inesperado (una luz que se apagó manualmente), ¿debería la regla ejecutar de todos modos sus acciones? ¿Cómo añadirías un modo de "verificar antes de actuar"?

## Paso 4: Añade detección de presencia

La detección de presencia responde la pregunta "¿hay alguien en casa?" monitoreando qué dispositivos están conectados a la red. Cuando un teléfono se une al WiFi, alguien está en casa; cuando se va, la casa puede entrar en modo "fuera".

### 4.1 Construye el detector de presencia

**👟 Pista inicial :** Crea `hub/presence.py` con una función que verifique si un dispositivo (teléfono) es alcanzable por ping.

```python
# hub/presence.py
import subprocess
import time

class PresenceDetector:
    def __init__(self):
        self.known_devices: dict[str, str] = {}  # name -> IP
        self.status: dict[str, bool] = {}

    def register_device(self, name: str, ip: str):
        self.known_devices[name] = ip
        self.status[name] = False

    def ping(self, ip: str, timeout: int = 2) -> bool:
        """Ping an IP address and return True if reachable."""
        result = subprocess.run(
            ["ping", "-c", "1", "-W", str(timeout), ip],
            capture_output=True,
            text=True,
            check=False,
        )
        return result.returncode == 0

    def check_all(self) -> dict[str, bool]:
        """Check presence of all registered devices."""
        for name, ip in self.known_devices.items():
            self.status[name] = self.ping(ip)
        return dict(self.status)

    @property
    def anyone_home(self) -> bool:
        return any(self.status.values())
```

La función `ping` usa `subprocess.run` para ejecutar un ping real del sistema — el mismo comando que escribirías en una terminal. `check_all` itera sobre todos los dispositivos registrados y actualiza su estado. `anyone_home` es una propiedad de conveniencia que devuelve `True` si cualquier dispositivo es alcanzable. En producción, harías polling de esto periódicamente (cada 30 segundos o un minuto) y dispararías reglas cuando el estado cambie.

**🎯 Resultado esperado :** `detector.ping("127.0.0.1")` devuelve `True` (localhost siempre es alcanzable). `detector.ping("192.0.2.1")` devuelve `False` (una dirección TEST-NET que no debería responder).

**🩹 Si sale mal :** Si `ping` siempre devuelve `False`, verifica que `timeout` sea suficientemente grande y que la IP sea alcanzable desde tu red. En algunos sistemas, `ping` requiere `-c 1` (count) para evitar hacer ping para siempre.

### 4.2 Conecta la presencia a las reglas

```python
# hub/presence.py (continued)
from hub.rules import Rule, evaluate_rules
from hub.devices import DeviceRegistry

class PresenceRuleEvaluator:
    def __init__(self, detector: PresenceDetector, registry: DeviceRegistry):
        self.detector = detector
        self.registry = registry
        self.prev_home = None

    def evaluate_on_change(self, rules: list[Rule]) -> list[tuple[Rule, list[str]]]:
        """Evaluate rules when presence status changes."""
        current = self.detector.anyone_home
        if current == self.prev_home:
            return []  # no change, no rules to evaluate
        self.prev_home = current
        results = evaluate_rules(rules, self.registry)
        return results
```

El `PresenceRuleEvaluator` solo activa reglas cuando la presencia *cambia* — no en cada polling. Esto evita que las reglas se activen repetidamente mientras alguien está en casa. El seguimiento de `prev_home` es la clave: cuando el estado cambia de `True` a `False` (todos se fueron), las reglas con condiciones de presencia se activan una vez.

**🎯 Resultado esperado :** `evaluate_on_change` devuelve reglas cuando la presencia transiciona de en casa a fuera (o viceversa), y devuelve una lista vacía cuando nada cambió.

**🩹 Si sale mal :** Si las reglas se activan en cada llamada, `prev_home` no se está actualizando. Si las reglas nunca se activan, `prev_home` comienza como `None`, lo que significa que la primera llamada siempre actúa como disparador.

### 4.3 Verifica la detección de presencia

**✅ Lista de verificación**

- ✅ `ping("127.0.0.1")` devuelve `True`.
- ✅ `check_all` devuelve un diccionario de nombres de dispositivos a booleanos.
- ✅ `evaluate_on_change` solo devuelve resultados cuando el estado en casa/fuera realmente cambia.

**🤔 Pregunta(s) socrática(s)**

- La presencia basada en ping tiene un retraso: un teléfono podría no responder durante 30 segundos después de salir de la red. ¿Cómo añadirías un período de gracia antes de declarar "fuera" para evitar activaciones falsas?
- Si hay dos personas en casa y una se va, `anyone_home` sigue siendo `True`. ¿Cómo harías seguimiento de la presencia por persona en lugar de un binario simple?

## Paso 5: Conecta todo en una CLI

La CLI une todas las piezas: registra dispositivos, escribe reglas, configura horarios y ejecuta el motor en un bucle.

### 5.1 Construye la CLI

**👟 Pista inicial :** Crea `hub/cli.py` con comandos para registrar dispositivos, añadir reglas y ejecutar el motor.

```python
# hub/cli.py
import json
import click
from hub.devices import DeviceRegistry, Light, Thermostat, Lock
from hub.rules import Rule, Condition, Action, evaluate_rules
from hub.presence import PresenceDetector

@click.group()
def cli():
    """Home Automation Hub — register devices, write rules, run automations."""
    pass

@cli.command()
def demo():
    """Run a demo with sample devices and rules."""
    reg = DeviceRegistry()
    light = Light(id="l1", name="Living Room Light", location="Living Room")
    thermo = Thermostat(id="t1", name="Thermostat", location="Living Room", _temperature=65.0)
    lock = Lock(id="d1", name="Front Door", location="Entryway")
    reg.register(light)
    reg.register(thermo)
    reg.register(lock)

    rules = [
        Rule(
            name="Cold turns on light",
            trigger="state_change",
            conditions=[Condition("t1", "temperature", "less_than", "68")],
            actions=[Action("l1", "turn_on", {"brightness": 80})],
        ),
        Rule(
            name="Lock at bedtime",
            trigger="schedule",
            conditions=[],
            actions=[Action("d1", "lock")],
        ),
    ]

    click.echo(f"Devices: {len(reg.devices)}")
    click.echo(f"Rules: {len(rules)}")

    results = evaluate_rules(rules, reg)
    for rule, logs in results:
        click.echo(f"Rule '{rule.name}' fired:")
        for log in logs:
            click.echo(log)

    click.echo(f"Light is on: {light.is_on}")
    click.echo(f"Door is locked: {lock.is_locked}")

@cli.command()
@click.argument("device_type", type=click.Choice(["light", "thermostat", "lock"]))
@click.option("--id", "device_id", required=True)
@click.option("--name", required=True)
@click.option("--location", default="Unknown")
def add_device(device_type, device_id, name, location):
    """Register a new device."""
    click.echo(f"Added {device_type}: {name} ({device_id}) at {location}")

@cli.command()
def status():
    """Show current device states."""
    click.echo("Device status: (run 'demo' first to populate)")

if __name__ == "__main__":
    cli()
```

El comando `demo` es el más útil para aprender — configura un escenario completo con tres dispositivos, dos reglas y las evalúa de una sola vez. Los comandos `add_device` y `status` son esqueletos para extender el sistema. La CLI mantiene la lógica de automatización testeable sin ejecutar un bucle de eventos continuo.

**🎯 Resultado esperado :** `uv run python -m hub.cli demo` imprime "Rule 'Cold turns on light' fired" y muestra que la luz está encendida y la puerta cerrada.

**🩹 Si sale mal :** Si ninguna regla se activa, la temperatura del termostato (65.0) puede no estar comparándose correctamente contra "68" — revisa el cast `float()` en el evaluador de condiciones.

### 5.2 Prueba de humo de extremo a extremo

```python
# Quick end-to-end test
from hub.devices import Light, Thermostat, Lock, DeviceRegistry
from hub.rules import Rule, Condition, Action, evaluate_rules

reg = DeviceRegistry()
light = Light(id="l1", name="Light", location="Room")
thermo = Thermostat(id="t1", name="Thermo", location="Room", _temperature=65.0)
lock = Lock(id="d1", name="Lock", location="Door")
reg.register(light)
reg.register(thermo)
reg.register(lock)

rules = [
    Rule(name="Cold", trigger="state_change",
         conditions=[Condition("t1", "temperature", "less_than", "68")],
         actions=[Action("l1", "turn_on")]),
    Rule(name="Away lock", trigger="presence",
         conditions=[Condition("t1", "temperature", "greater_than", "80")],
         actions=[Action("d1", "lock")]),
]
results = evaluate_rules(rules, reg)
assert len(results) == 1  # only "Cold" fires (thermo is 65 < 68)
assert results[0][0].name == "Cold"
assert light.is_on
```

**🎯 Resultado esperado :** La aserción pasa; solo se activa la regla "Cold", y la luz está encendida.

**🩹 Si sale mal :** Si ambas reglas se activan, la condición `greater_than 80` de "Away lock" se está comparando incorrectamente — revisa la conversión a flotante.

### 5.3 Verifica el pipeline de la CLI

**✅ Lista de verificación**

- ✅ `uv run python -m hub.cli demo` ejecuta un escenario completo con dispositivos, reglas y acciones.
- ✅ Las reglas se activan según el estado actual de los dispositivos — no según lo que la regla espera.
- ✅ La CLI imprime una salida clara que muestra qué reglas se activaron y qué acciones se tomaron.

**🤔 Pregunta(s) socrática(s)**

- Si ejecutaras el demo dos veces, la luz ya estaría encendida por la primera ejecución. ¿Cómo reiniciarías el estado de los dispositivos entre evaluaciones para que cada ejecución comience limpio?
- El demo evalúa las reglas una vez. Un hub real de automatización del hogar se ejecuta en un bucle continuo. ¿Cómo estructurarías el bucle principal para manejar cambios de estado, eventos programados y actualizaciones de presencia en un solo ciclo?

## ⚠️ Errores comunes

- **Reglas que se activan en cada polling en lugar de en un cambio de estado.** Si tu motor re-evalúa todas las reglas cada vez que un sensor reporta (incluso cuando nada cambió), obtendrás acciones repetidas y notificaciones innecesarias. El patrón `PresenceRuleEvaluator` — rastrear `prev_home` y solo activar en transiciones — previene esto.
- **Comparaciones de cadenas vs. numéricas en las condiciones.** Una condición como `temperature > 68` debe comparar flotantes, no cadenas. La función `evaluate_condition` convierte valores con `float()` para los operadores numéricos, pero es fácil olvidarlo al añadir operadores nuevos.
- **Acciones que llaman métodos que no existen.** Si `action.method` es `"turn_on"` pero la clase del dispositivo lo escribe como `"TurnOn"`, `getattr` devuelve `None` y la acción falla en silencio. Siempre valida que el método exista antes de llamarlo.
- **Programación con bucles bloqueantes.** La biblioteca `schedule` usa `time.sleep(1)` internamente, que bloquea todo el hilo. Para un hub real que también maneja conexiones WebSocket o solicitudes HTTP, necesitarías programación asíncrona (como `APScheduler`) en su lugar.
- **La detección de presencia asume que todos los dispositivos son teléfonos.** Una laptop siempre conectada, un altavoz inteligente que nunca sale o el teléfono de un invitado inclinarían el cálculo de presencia. Etiqueta los dispositivos como "móviles" vs. "estacionarios" antes de usarlos para presencia.

## Lo que acabas de construir

Un motor de automatización del hogar basado en reglas: dispositivos con estado y métodos, un motor de reglas activador-acción que evalúa condiciones contra el estado de los dispositivos en vivo, programación basada en tiempo para automatizaciones recurrentes y detección de presencia a partir de pings de red. La arquitectura — dispositivos, reglas, programador, presencia — refleja cómo funcionan las plataformas de automatización del hogar como Home Assistant y Hubitat, solo que más pequeña y ejecutándose enteramente en Python.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/home-automation/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/home-automation) en el repositorio del curso tiene una versión más rica con más tipos de dispositivos, un panel web y el programador conectado de extremo a extremo. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Añade una API web (Flask o FastAPI) que exponga los estados de los dispositivos y permita crear reglas desde un panel basado en navegador.
- Implementa registro de eventos: registra cada activación de regla y acción tomada en una base de datos SQLite para auditoría y depuración.
- Añade integración MQTT para que dispositivos inteligentes reales (Zigbee, Z-Wave) puedan publicar cambios de estado que el motor procese.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓