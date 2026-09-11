---
title: "Gestor de Reglas de Firewall"
description: "Gestiona reglas de firewall con validación, simulación y despliegue basado en diferencias."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["cli", "security", "data-validation"]
learningObjectives:
  - "Modelar reglas de firewall como dataclasses de Python con validación"
  - "Detectar conflictos de reglas y rangos de puertos superpuestos"
  - "Simular tráfico contra un conjunto de reglas para predecir resultados allow/deny"
  - "Generar diffs de despliegue y revertir a conjuntos de reglas anteriores"
prerequisites: ["Python 101"]
---

# 🔥 Gestor de Reglas de Firewall

Las reglas de firewall son las barreras de seguridad de la red — una sola regla mal configurada puede abrir un puerto a internet o bloquear tráfico legítimo en silencio. Este proyecto construye una herramienta CLI que gestiona un conjunto de reglas como datos estructurados: escribes reglas en Python, las validas por conflictos, simulas cómo fluiría el tráfico real a través de las reglas, y despliegas cambios como un diff contra el estado actual con reversión de un comando. La meta es una herramienta que haga la gestión del firewall auditable y reversible en lugar de aterradora y misteriosa.

Esto asume Python 101 — no se requiere nada de Análisis de Datos. Opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias que necesitarás.
2. Modelar reglas de firewall como dataclasses de Python con campos para acción, protocolo, rango de puertos y fuente.
3. Escribir un validador que detecte reglas conflictivas y rangos de puertos inválidos.
4. Construir un simulador de tráfico que haga coincidir paquetes entrantes contra un conjunto de reglas.
5. Implementar despliegue basado en diff que muestre exactamente qué cambia antes de aplicar.
6. Agregar un comando de reversión que vuelva al conjunto de reglas anterior en un paso.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — esta es una herramienta CLI que lee y escribe archivos de reglas en disco y simula patrones de tráfico.

**Google Colab, Kaggle Notebooks y Binder** funcionan para probar la herramienta. El notebook instala los mismos paquetes y usa el mismo código; usa reglas de muestra y tráfico simulado en lugar de tocar configuraciones reales de firewall.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/firewall-rules/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/firewall-rules/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffirewall-rules%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de escribir una sola regla: un entorno de Python, un paquete para construir la CLI y un directorio de proyecto.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Configura el proyecto

```bash
uv init firewall-rules
cd firewall-rules
uv add click pydantic
```

`click` construye la interfaz CLI, y `pydantic` nos da validación de reglas con mensajes de error claros. La estructura del proyecto mantiene reglas, validación, simulación y despliegue en archivos separados para mayor claridad.

### Crea la estructura del proyecto

```bash
mkdir -p fw
touch fw/__init__.py fw/rules.py fw/validate.py fw/simulate.py fw/deploy.py fw/cli.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `firewall-rules/` existe con un `pyproject.toml`, y `click` y `pydantic` están instalados.
- ✅ El directorio `fw/` tiene todos los archivos de módulo requeridos.

## Paso 1: Modela reglas de firewall como datos

Toda regla de firewall tiene la misma forma: una acción (allow o deny), un protocolo (TCP, UDP o ICMP), un rango de puertos y una fuente IP opcional o bloque CIDR. Modelar esto como un modelo de Pydantic te da validación automática — una regla con el puerto `99999` o una acción de `"maybe"` falla de inmediato en lugar de corromper silenciosamente el conjunto de reglas.

### 1.1 Define el esquema de la regla

**👟 Pista inicial :** Crea `fw/rules.py` con un modelo de Pydantic que valide cada campo en la creación.

```python
# fw/rules.py
from enum import Enum
from pydantic import BaseModel, field_validator
from ipaddress import ip_network

class Action(str, Enum):
    ALLOW = "allow"
    DENY = "deny"

class Protocol(str, Enum):
    TCP = "tcp"
    UDP = "udp"
    ICMP = "icmp"

class FirewallRule(BaseModel):
    name: str
    action: Action
    protocol: Protocol
    port_start: int
    port_end: int
    source: str = "0.0.0.0/0"  # CIDR, defaults to all

    @field_validator("port_start", "port_end")
    @classmethod
    def check_port(cls, v):
        if not 1 <= v <= 65535:
            raise ValueError(f"Port must be 1-65535, got {v}")
        return v

    def model_post_init(self, __context):
        if self.port_start > self.port_end:
            raise ValueError(
                f"port_start ({self.port_start}) must be <= port_end ({self.port_end})"
            )
        ip_network(self.source, strict=False)  # validates CIDR syntax
```

Pydantic atrapa datos malos en el momento de la construcción — `port_start > port_end`, bloques CIDR inválidos o protocolos no reconocidos lanzan todos `ValueError` con un mensaje claro. El campo `source` tiene por defecto `0.0.0.0/0` (cualquier IP), que es el caso común para la mayoría de las reglas.

**🎯 Resultado esperado :** `FirewallRule(name="web", action="allow", protocol="tcp", port_start=80, port_end=443)` crea una regla válida. `FirewallRule(name="bad", action="allow", protocol="tcp", port_start=99999, port_end=99999)` lanza un `ValidationError`.

**🩹 Si sale mal :** Si `ip_network` no atrapa un CIDR malo, puede que estés importando del módulo equivocado — usa `from ipaddress import ip_network`. Si Pydantic no ejecuta el validador de puertos, asegúrate de que el decorador `@field_validator` está presente.

### 1.2 Verifica la creación de reglas

```python
# Quick test
from fw.rules import FirewallRule

r = FirewallRule(name="ssh", action="allow", protocol="tcp", port_start=22, port_end=22)
assert r.action.value == "allow"
assert r.port_start == 22
print(r.model_dump())
```

El modelo hace un round-trip limpio: crea una regla, accede a sus campos y serialízala de vuelta a un diccionario.

**🎯 Resultado esperado :** La aserción pasa; `model_dump()` imprime un diccionario con todos los campos.

**🩹 Si sale mal :** Si `model_dump()` no existe, estás en una versión vieja de Pydantic — usa `.dict()` en su lugar.

### 1.3 Verifica el modelo de regla

**✅ Lista de verificación**

- ✅ Una regla válida se crea exitosamente con todos los campos accesibles.
- ✅ Un puerto inválido (fuera de 1–65535) lanza un `ValidationError` claro.
- ✅ Una fuente CIDR inválida (como `"not-an-ip"`) lanza un error claro.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué modelar reglas como modelos de Pydantic en lugar de diccionarios simples? ¿Qué garantías de validación obtienes gratis?
- Si dos reglas tienen el mismo nombre pero acciones distintas, ¿es eso un conflicto o es válido? ¿Cómo lo decidirías?

## Paso 2: Detecta conflictos de reglas

Un conjunto de reglas solo es útil si sus reglas no se contradicen. Dos reglas que coinciden con el mismo tráfico con acciones distintas crean ambigüedad — la mayoría de los firewalls manejan esto con un orden de "primera coincidencia gana", pero de todos modos necesitas advertir al usuario.

### 2.1 Escribe el detector de conflictos

**👟 Pista inicial :** Crea `fw/validate.py` con una función que compare cada par de reglas y marque rangos de puertos superpuestos en el mismo protocolo.

```python
# fw/validate.py
from fw.rules import FirewallRule

def find_conflicts(rules: list[FirewallRule]) -> list[tuple[FirewallRule, FirewallRule, str]]:
    """Find pairs of rules that overlap in protocol and port range."""
    conflicts = []
    for i, a in enumerate(rules):
        for b in rules[i + 1:]:
            if a.protocol != b.protocol:
                continue
            ports_overlap = a.port_start <= b.port_end and b.port_start <= a.port_end
            if not ports_overlap:
                continue
            if a.source == b.source or a.source == "0.0.0.0/0" or b.source == "0.0.0.0/0":
                reason = f"Both match {a.protocol.value} ports {max(a.port_start, b.port_start)}-{min(a.port_end, b.port_end)}"
                conflicts.append((a, b, reason))
    return conflicts
```

La verificación de superposición `a.port_start <= b.port_end and b.port_start <= a.port_end` es la prueba estándar de superposición de intervalos. La verificación de fuente es importante: dos reglas con fuentes IP distintas pueden superponerse sin conflicto porque coinciden con tráficos distintos. Pero cuando una regla cubre todas las fuentes (`0.0.0.0/0`), se superpone con todo.

**🎯 Resultado esperado :** Dos reglas que coinciden con TCP 80–443 desde cualquier fuente producen un conflicto. Dos reglas que coinciden con TCP 80 pero desde IPs específicas distintas no producen conflicto.

**🩹 Si sale mal :** Si reglas con protocolos distintos se marcan como conflictivas, falta la verificación de protocolo. Si reglas con fuentes específicas distintas se marcan, la lógica de superposición de fuente es demasiado estricta.

### 2.2 Agrega un resumen de validación

```python
# fw/validate.py (continued)
def validate_ruleset(rules: list[FirewallRule]) -> dict:
    """Validate a full rule set and return a summary."""
    conflicts = find_conflicts(rules)
    issues = []
    for a, b, reason in conflicts:
        issues.append(f"CONFLICT: '{a.name}' vs '{b.name}': {reason}")
    return {"valid": len(issues) == 0, "issues": issues, "rule_count": len(rules)}
```

**🎯 Resultado esperado :** Un conjunto de reglas sin superposiciones devuelve `{"valid": True, "issues": [], "rule_count": N}`. Un conjunto conflictivo devuelve `{"valid": False, "issues": [...], ...}` con descripciones de conflicto legibles para humanos.

**🩹 Si sale mal :** Si el resumen siempre muestra `"valid": True`, la lista de issues no se está poblando — verifica que `find_conflicts` devuelve las tuplas correctas.

### 2.3 Verifica la detección de conflictos

**✅ Lista de verificación**

- ✅ Dos reglas que coinciden con el mismo protocolo y rango de puertos desde la misma fuente son marcadas.
- ✅ Reglas que coinciden con protocolos o fuentes distintas no son marcadas.
- ✅ El resumen de validación devuelve `"valid": False` con descripciones legibles de los problemas.

**🤔 Pregunta(s) socrática(s)**

- La mayoría de los firewalls reales usan el orden de "primera coincidencia gana". ¿Cómo cambiaría agregar prioridad de reglas a la lógica de detección de conflictos — las reglas superpuestas seguirían siendo conflictos, o solo preocupaciones de ordenamiento?
- ¿Qué pasa si un conjunto de reglas tiene una regla `deny all` en el medio? ¿Tu validador marcaría las reglas debajo de ella como redundantes?

## Paso 3: Simula tráfico contra el conjunto de reglas

La validación te dice si las reglas son internamente consistentes; la simulación te dice lo que de verdad *hacen*. Dada una lista de paquetes de tráfico simulados (IP fuente, protocolo, puerto), puedes recorrer las reglas en orden y predecir si cada paquete es permitido o denegado.

### 3.1 Construye el simulador

**👟 Pista inicial :** Crea `fw/simulate.py` con una función que recorra las reglas en orden para cada paquete y devuelva la primera acción coincidente.

```python
# fw/simulate.py
from ipaddress import ip_address
from fw.rules import FirewallRule

def simulate_packet(
    rules: list[FirewallRule],
    source_ip: str,
    protocol: str,
    port: int,
) -> tuple[str, FirewallRule | None]:
    """Simulate one packet. Returns (action, matching_rule) or ('deny', None)."""
    for rule in rules:
        if rule.protocol.value != protocol:
            continue
        if not (rule.port_start <= port <= rule.port_end):
            continue
        src_net = ip_address(source_ip) in __import__("ipaddress").ip_network(rule.source, strict=False)
        if src_net:
            return rule.action.value, rule
    return "deny", None  # default: deny if no rule matches
```

Recorrer las reglas en orden y devolver en la primera coincidencia es como funcionan la mayoría de los firewalls reales. Si ninguna regla coincide, la acción por defecto es deny — este es el valor por defecto seguro. El módulo `ipaddress` maneja la coincidencia CIDR correctamente, incluyendo casos límite como `192.168.1.0/24`.

**🎯 Resultado esperado :** Un conjunto de reglas con `allow tcp 80-80` y `deny tcp 1-1023` produce `("allow", rule)` para un paquete al puerto 80 desde cualquier fuente, y `("deny", rule)` para el puerto 22 desde cualquier fuente.

**🩹 Si sale mal :** Si el puerto 80 devuelve `deny`, las reglas no están ordenadas correctamente — la primera coincidencia importa. Si la coincidencia CIDR no funciona, verifica que usas `ip_network` con `strict=False`.

### 3.2 Agrega simulación por lotes

```python
# fw/simulate.py (continued)
def simulate_traffic(rules: list[FirewallRule], packets: list[dict]) -> list[dict]:
    """Simulate multiple packets and return results."""
    results = []
    for pkt in packets:
        action, matched = simulate_packet(rules, pkt["source"], pkt["protocol"], pkt["port"])
        results.append({
            **pkt,
            "action": action,
            "matched_rule": matched.name if matched else None,
        })
    return results
```

**🎯 Resultado esperado :** Un lote de tres paquetes produce tres diccionarios de resultado, cada uno con los campos del paquete original más `action` y `matched_rule`.

**🩹 Si sale mal :** Si la lista de resultados está vacía, la lista de entrada no se está iterando. Si `matched_rule` siempre es `None`, la función `simulate_packet` no está devolviendo la regla coincidente.

### 3.3 Verifica el simulador

**✅ Lista de verificación**

- ✅ Un paquete que coincide con la primera regla recibe la acción de esa regla.
- ✅ Un paquete que no coincide con ninguna regla recibe `"deny"` con `matched_rule=None`.
- ✅ `simulate_traffic` devuelve un resultado por paquete de entrada.

**🤔 Pregunta(s) socrática(s)**

- Si invirtieras el orden de las reglas, ¿qué paquetes cambiarían su resultado? ¿Eso te dice algo sobre por qué el orden de las reglas importa en los firewalls reales?
- ¿Qué haría falta para agregar registro — registrar *qué* reglas se verificaron pero no coincidieron — para que puedas depurar un paquete denegado después del hecho?

## Paso 4: Despliegue basado en diff con reversión

Desplegar reglas de firewall de forma segura significa mostrar al usuario exactamente qué cambia antes de que cualquier cambio se aplique, y poder deshacerlo al instante. Este paso construye un desplegador que hace un snapshot de las reglas actuales, calcula un diff contra el nuevo conjunto, y almacena la versión anterior para la reversión.

### 4.1 Construye el desplegador

**👟 Pista inicial :** Crea `fw/deploy.py` con `deploy` (snapshot + diff + apply) y `rollback` (restaurar snapshot anterior).

```python
# fw/deploy.py
import json
from pathlib import Path
from fw.rules import FirewallRule

RULES_FILE = Path("rules.json")
HISTORY_DIR = Path("rule_history")

def save_rules(rules: list[FirewallRule]):
    """Save the current rule set to disk."""
    RULES_FILE.write_text(json.dumps([r.model_dump() for r in rules], indent=2))

def load_rules() -> list[FirewallRule]:
    """Load the current rule set from disk."""
    if not RULES_FILE.exists():
        return []
    data = json.loads(RULES_FILE.read_text())
    return [FirewallRule(**r) for r in data]

def deploy(new_rules: list[FirewallRule]) -> dict:
    """Snapshot current rules, compute diff, and apply new rules."""
    HISTORY_DIR.mkdir(exist_ok=True)
    old_rules = load_rules()

    # Snapshot old rules
    import time
    snapshot_name = f"snapshot_{int(time.time())}.json"
    (HISTORY_DIR / snapshot_name).write_text(
        json.dumps([r.model_dump() for r in old_rules], indent=2)
    )

    # Compute diff
    old_names = {r.name for r in old_rules}
    new_names = {r.name for r in new_rules}
    added = new_names - old_names
    removed = old_names - new_names
    changed = []
    old_map = {r.name: r for r in old_rules}
    for r in new_rules:
        if r.name in old_map and r.model_dump() != old_map[r.name].model_dump():
            changed.append(r.name)

    save_rules(new_rules)
    return {
        "added": sorted(added),
        "removed": sorted(removed),
        "changed": sorted(changed),
        "snapshot": snapshot_name,
        "total_rules": len(new_rules),
    }
```

La función deploy hace el snapshot primero, luego calcula, luego aplica — este orden garantiza que siempre tengas un punto de reversión incluso si las reglas nuevas están malformadas. El reporte de diff le dice al operador exactamente qué cambió: qué reglas son nuevas, cuáles se fueron y cuáles fueron modificadas.

**🎯 Resultado esperado :** Desplegar reglas que agregan una, eliminan una y modifican una produce un dict de diff con `added: ["new_rule"]`, `removed: ["old_rule"]`, `changed: ["modified_rule"]`.

**🩹 Si sale mal :** Si el archivo de snapshot no se crea, `HISTORY_DIR.mkdir()` no se llama antes de escribir. Si el diff muestra todo como agregado, `old_rules` se cargó como una lista vacía — verifica que `rules.json` existe antes del deploy.

### 4.2 Agrega la reversión

```python
# fw/deploy.py (continued)
def rollback() -> str:
    """Restore the most recent snapshot."""
    if not HISTORY_DIR.exists():
        return "No history to rollback."
    snapshots = sorted(HISTORY_DIR.glob("snapshot_*.json"))
    if not snapshots:
        return "No snapshots found."
    latest = snapshots[-1]
    rules_data = json.loads(latest.read_text())
    rules = [FirewallRule(**r) for r in rules_data]
    save_rules(rules)
    return f"Rolled back to {latest.name} ({len(rules)} rules)"
```

La reversión lee el snapshot más reciente y lo escribe de vuelta en `rules.json`. La nomenclatura basada en marca de tiempo hace que el orden sea inequívoco, y devolver el nombre del snapshot le da al operador un registro de qué versión se restauró.

**🎯 Resultado esperado :** Llamar a `rollback()` después de un deploy revierte `rules.json` a la versión anterior y devuelve el nombre del snapshot.

**🩹 Si sale mal :** Si la reversión devuelve "No snapshots found", el directorio `rule_history/` está vacío — el deploy debe ejecutarse antes de la reversión. Si las reglas restauradas están mal, la nomenclatura de snapshots no está ordenada cronológicamente.

### 4.3 Verifica el despliegue

**✅ Lista de verificación**

- ✅ `deploy` crea un snapshot con marca de tiempo en `rule_history/` antes de aplicar cambios.
- ✅ El reporte de diff identifica correctamente las reglas agregadas, eliminadas y modificadas.
- ✅ `rollback` restaura el snapshot más reciente y sobrescribe `rules.json`.

**🤔 Pregunta(s) socrática(s)**

- En un firewall de producción, "apply" podría significar ejecutar un comando del sistema con impacto real en la red. ¿Cómo te protege el orden snapshot-luego-apply si el paso de aplicar falla a mitad de camino?
- Si dos personas despliegan al mismo tiempo, ¿qué pasa con los snapshots? ¿Cómo manejarías despliegues concurrentes?

## Paso 5: Construye la CLI

Conecta todo con tres comandos: `validate`, `deploy` y `rollback`.

### 5.1 Escribe la CLI

**👟 Pista inicial :** Crea `fw/cli.py` con comandos `click` para cada operación.

```python
# fw/cli.py
import json
import click
from fw.rules import FirewallRule
from fw.validate import validate_ruleset
from fw.simulate import simulate_traffic
from fw.deploy import deploy, rollback

@click.group()
def cli():
    """Firewall Rule Manager — validate, deploy, rollback."""
    pass

@cli.command()
@click.argument("rules_file", type=click.Path(exists=True))
def validate(rules_file):
    """Validate a rules file for conflicts."""
    data = json.loads(open(rules_file).read())
    rules = [FirewallRule(**r) for r in data]
    result = validate_ruleset(rules)
    if result["valid"]:
        click.echo(f"Valid: {result['rule_count']} rules, no conflicts.")
    else:
        for issue in result["issues"]:
            click.echo(f"  {issue}")
        raise SystemExit(1)

@cli.command()
@click.argument("rules_file", type=click.Path(exists=True))
def deploy_cmd(rules_file):
    """Deploy a new ruleset (snapshot + diff + apply)."""
    data = json.loads(open(rules_file).read())
    rules = [FirewallRule(**r) for r in data]
    result = deploy(rules)
    click.echo(f"Deployed {result['total_rules']} rules.")
    click.echo(f"  Added: {result['added']}")
    click.echo(f"  Removed: {result['removed']}")
    click.echo(f"  Changed: {result['changed']}")
    click.echo(f"  Snapshot: {result['snapshot']}")

@cli.command()
def rollback_cmd():
    """Rollback to the most recent snapshot."""
    msg = rollback()
    click.echo(msg)

if __name__ == "__main__":
    cli()
```

La CLI es delgada — cada comando son unas pocas líneas que parsean entrada, llaman a la función de la biblioteca e imprimen el resultado. Esta separación significa que el código de la biblioteca (`rules.py`, `validate.py`, `simulate.py`, `deploy.py`) es testeable sin la CLI, y la CLI es trivial de extender con comandos nuevos.

**🎯 Resultado esperado :** `uv run python -m fw.cli validate rules.json` imprime "Valid: N rules, no conflicts" para un conjunto limpio, o lista los conflictos y sale con código 1.

**🩹 Si sale mal :** Si la CLI no puede encontrar `click`, verifica que `click` está en `pyproject.toml`. Si `validate` siempre muestra válido, las reglas no se están cargando desde el archivo — verifica la ruta de lectura del archivo.

### 5.2 Prueba de humo de punta a punta

```python
# Quick end-to-end test
from fw.rules import FirewallRule
from fw.validate import validate_ruleset
from fw.simulate import simulate_traffic
from fw.deploy import deploy

rules = [
    FirewallRule(name="web", action="allow", protocol="tcp", port_start=80, port_end=443),
    FirewallRule(name="ssh", action="allow", protocol="tcp", port_start=22, port_end=22),
    FirewallRule(name="block_trojan", action="deny", protocol="tcp", port_start=4444, port_end=4444),
]

# Validate
result = validate_ruleset(rules)
assert result["valid"]

# Simulate
packets = [
    {"source": "10.0.0.1", "protocol": "tcp", "port": 80},
    {"source": "10.0.0.1", "protocol": "tcp", "port": 22},
    {"source": "10.0.0.1", "protocol": "tcp", "port": 4444},
]
results = simulate_traffic(rules, packets)
assert results[0]["action"] == "allow"
assert results[1]["action"] == "allow"
assert results[2]["action"] == "deny"

# Deploy
diff = deploy(rules)
assert diff["total_rules"] == 3
```

Esto ejecuta el pipeline completo: validar, simular, desplegar. Cada pieza se probó individualmente; esto confirma que el traspaso entre ellas es limpio.

**🎯 Resultado esperado :** Todas las aserciones pasan; el deploy reporta 3 reglas sin reglas agregadas, eliminadas o modificadas (el primer deploy siempre es un diff "limpio").

**🩹 Si sale mal :** Si la simulación produce acciones incorrectas, verifica el orden de las reglas. Si el deploy muestra reglas agregadas/eliminadas inesperadas, el archivo `rules.json` puede tener datos obsoletos de una ejecución anterior.

### 5.3 Verifica el pipeline de la CLI

**✅ Lista de verificación**

- ✅ `validate` detecta reglas conflictivas y sale con código 1.
- ✅ `deploy` crea un snapshot y reporta reglas agregadas/eliminadas/modificadas.
- ✅ `rollback` restaura el snapshot más reciente.

**🤔 Pregunta(s) socrática(s)**

- ¿Qué haría falta para agregar un comando CLI `simulate` que lea un archivo de reglas y un CSV de tráfico, y luego imprima una tabla de resultados allow/deny?
- Si el comando deploy escribe parcialmente `rules.json` y luego se estrella, ¿en qué estado queda el archivo? ¿Cómo harías la escritura atómica?

## ⚠️ Errores comunes

- **Olvidar que el orden de las reglas importa.** El simulador recorre las reglas de arriba hacia abajo y devuelve en la primera coincidencia. Una regla `deny all` sobre una regla `allow http` bloquea el tráfico HTTP. Pon siempre las reglas allow específicas antes de las reglas deny amplias.
- **Rangos de puertos que se envuelven en silencio.** Una regla con `port_start=80` y `port_end=80` es correcta; `port_start=443` y `port_end=80` debería fallar la validación pero no lo hará si falta la verificación del rango. Valida siempre `port_start <= port_end`.
- **No hacer snapshot antes del deploy.** Si aplicas reglas nuevas sin guardar primero las viejas, no hay punto de reversión. La función deploy siempre hace el snapshot primero — no omitas ese paso.
- **Coincidencia CIDR sin `strict=False`.** `ip_network("192.168.1.1/24")` lanza un `ValueError` porque los bits de host están configurados. Usar `strict=False` enmascara silenciosamente los bits de host, que es el comportamiento correcto para la coincidencia de fuente del firewall.
- **Tratar la validación como despliegue.** Un conjunto de reglas que pasa la validación aún puede causar problemas en producción (orden incorrecto, valores por defecto faltantes). La validación atrapa conflictos; la simulación atrapa errores lógicos. Ejecuta ambas antes de desplegar.

## Lo que acabas de construir

Una herramienta de gestión de reglas de firewall que modela reglas como objetos Python validados, detecta conflictos antes de que lleguen a producción, simula tráfico real contra el conjunto de reglas, y despliega cambios con un flujo de trabajo de snapshot-y-diff que hace cada cambio auditable y reversible. La arquitectura — modelar, validar, simular, desplegar — es el mismo patrón usado en herramientas de infraestructura como código como Terraform y Pulumi.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/firewall-rules/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/firewall-rules) en el repositorio del curso tiene una versión más rica con más tipos de reglas, un CSV de tráfico para simulación por lotes y archivos de reglas de muestra. Clónalo, o abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Agrega una bandera `--dry-run` al comando deploy que muestre el diff sin aplicarlo.
- Construye un sistema de plantillas de reglas: plantillas predefinidas para patrones comunes como "allow HTTP", "allow SSH", "bloquear todo lo entrante" que generen reglas correctamente estructuradas.
- Implementa prioridad/ordenamiento de reglas: ordena automáticamente las reglas para que las coincidencias más específicas vengan primero, reduciendo la posibilidad de errores de ordenamiento.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓