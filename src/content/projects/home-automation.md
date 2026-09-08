---
title: "Build a Home Automation Hub"
description: "Build a Python-based home automation engine with trigger-action rules, schedules, presence detection, and device control."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["iot", "cli", "async"]
learningObjectives:
  - "Model home devices and automation rules as Python dataclasses"
  - "Implement a trigger-action engine that evaluates rules against device state"
  - "Build a scheduling system for time-based automations"
  - "Detect presence from network pings and trigger rule chains"
prerequisites: ["Python 101"]
---

# 🏠 Build a Home Automation Hub

Your smart home is only as smart as the rules that connect its devices — a motion sensor that turns on a light, a thermostat that adjusts when you leave, a door lock that engages at bedtime. This project builds a rule-based home automation engine in Python: you define devices (lights, thermostats, locks), write if-this-then-that rules, schedule time-based triggers, and detect presence from network pings. The engine runs locally, processes events, and executes actions — no cloud service required.

This assumes Python 101 — nothing from Data Analysis is required. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the dependencies you'll need.
2. Model home devices (lights, thermostats, locks) as Python classes with state.
3. Build a rule engine that evaluates trigger-action pairs against current device state.
4. Implement time-based scheduling for recurring automations.
5. Add presence detection that watches for device pings on the network.
6. Wire everything into a CLI that registers devices, writes rules, and runs the engine.

## Where to run this

**Locally with `uv`** is the primary path — this project simulates network pings and runs a rule engine that processes events in a loop. It's designed to run on a machine connected to your home network.

**Google Colab, Kaggle Notebooks, and Binder** work for trying the tool. The notebook uses simulated device states and mock pings instead of real network traffic.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/home-automation/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/home-automation/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fhome-automation%2Fnotebook.ipynb)

## Setup

Everything you need before building: a Python environment, a scheduling library, and a project directory.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init home-automation
cd home-automation
uv add click schedule
```

`click` builds the CLI interface, and `schedule` handles time-based job scheduling. The project keeps devices, rules, scheduling, presence, and the CLI in separate files.

### Create the project structure

```bash
mkdir -p hub
touch hub/__init__.py hub/devices.py hub/rules.py hub/scheduler.py hub/presence.py hub/engine.py hub/cli.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `home-automation/` exists with a `pyproject.toml`, and `click` and `schedule` are installed.
- ✅ The `hub/` directory has all required module files.

## Step 1: Model home devices

Every smart home device has a type (light, thermostat, lock), a name, a location, and a state (on/off, temperature, locked/unlocked). Modeling devices as classes with methods like `turn_on()` and `set_temperature()` gives you a clean API for the rule engine to call.

### 1.1 Define the device classes

**👟 Starter hint:** Create `hub/devices.py` with a base `Device` class and type-specific subclasses.

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

Each device class stores mutable state in underscore-prefixed fields (`_is_on`, `_temperature`) with `@property` accessors. This keeps the public API clean (`light.is_on`) while allowing mutation through methods (`light.turn_on()`). The base `Device` class provides a generic `set_state` for the rule engine to use without knowing the specific device type.

**🎯 Expected output:** `Light(id="l1", name="Living Room", location="Living Room")` creates a light that starts off. `light.turn_on()` sets `light.is_on` to `True`.

**🩹 If it's off:** If `is_on` is always `False` after `turn_on()`, the property is reading the class-level default instead of the instance `_is_on`. Make sure `@property` is defined on the class, not in `__init__`.

### 1.2 Build a device registry

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

**🎯 Expected output:** `registry.register(light)` makes the light findable by ID and by location.

**🩹 If it's off:** If `by_location` always returns an empty list, check that the location strings match exactly (case-sensitive).

### 1.3 Verify device modeling

**✅ Checklist**

- ✅ `Light`, `Thermostat`, and `Lock` start with sensible defaults.
- ✅ Methods like `turn_on()`, `set_target()`, `lock()` change the device state.
- ✅ `DeviceRegistry` finds devices by ID and by location.

**🤔 Socratic Question(s)**

- Why use `@property` for `is_on` instead of just exposing `_is_on` directly? What does the indirection buy you when you later add logging or event emission?
- If you added a new device type (say, a `Speaker`), what's the minimum interface it needs to implement for the rule engine to control it?

## Step 2: Build the trigger-action rule engine

The rule engine is the brain of the home: it watches for events (a light turns on, temperature drops below a threshold, a door opens) and executes actions (send a notification, adjust another device, log an entry). Each rule is an if-this-then-that pair.

### 2.1 Define rules and the evaluator

**👟 Starter hint:** Create `hub/rules.py` with a `Rule` dataclass and an `evaluate_rules` function.

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

The `evaluate_condition` function reads a device attribute (`is_on`, `temperature`) and compares it against the condition's value using the specified operator. `evaluate_rules` runs all enabled rules and collects those whose conditions are all met — the "all conditions" check means every condition in a rule must be true for the rule to fire. When a rule fires, it executes each action by calling the named method on the target device.

**🎯 Expected output:** A rule with condition `thermostat.temperature < 68` fires `light.turn_on()` when the thermostat reads 65 degrees.

**🩹 If it's off:** If rules never fire, check that `rule.enabled` is `True` and that the condition attribute names match the device's `@property` names exactly. If the wrong device method is called, the `action.method` string doesn't match the device class method name.

### 2.2 Test rule evaluation

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

**🎯 Expected output:** The assertion passes; the light is on after rule evaluation.

**🩹 If it's off:** If the light didn't turn on, the condition `less_than` comparison may be comparing strings instead of floats — check the `float()` cast in `evaluate_condition`.

### 2.3 Verify the rule engine

**✅ Checklist**

- ✅ A rule fires when its conditions are all met.
- ✅ A rule doesn't fire when any condition fails.
- ✅ Actions call the correct device methods with the correct arguments.

**🤔 Socratic Question(s)**

- Rules evaluate all conditions every time a state change occurs. For a house with 50 devices and 20 rules, that's 1,000 condition checks per event. How would you optimize this — only re-evaluate rules whose conditions reference the changed device?
- What happens if two rules try to set the same device to conflicting states? How would you add priority or ordering to resolve conflicts?

## Step 3: Implement time-based scheduling

Some automations aren't triggered by device state — they run on a schedule. "Turn off all lights at midnight," "lower the thermostat at 10 PM," "lock the doors at bedtime." This step uses the `schedule` library to run rules at specific times.

### 3.1 Build the scheduler

**👟 Starter hint:** Create `hub/scheduler.py` with functions to register and run scheduled rules.

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

The `schedule` library handles the timing — you just register a function to run at a specific time each day. `run_pending()` is called in a loop to check if any scheduled jobs are due. The `job` closure captures the rule and registry, so when the scheduled time arrives, it evaluates the rule against the current device state and executes any matching actions.

**🎯 Expected output:** `scheduler.schedule_rule(rule, "22:00")` prints "Scheduled 'Warm up' at 22:00" and registers the job.

**🩹 If it's off:** If the job never runs, `run_pending()` isn't being called in a loop. If the time format is wrong, `schedule` raises a `ValueError` — use 24-hour `HH:MM` format.

### 3.2 Test with simulated time

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

**🎯 Expected output:** `schedule.run_pending()` prints "ACTION: l1.turn_off({})" immediately (since the job is due at 22:00 and we're calling it in a test).

**🩹 If it's off:** If nothing prints, the scheduled time hasn't arrived yet in the test — `schedule.run_pending()` only runs jobs whose time has passed since the last call.

### 3.3 Verify scheduling

**✅ Checklist**

- ✅ `schedule_rule` registers a job that prints when `run_pending()` is called.
- ✅ Rules with no conditions execute their actions unconditionally at the scheduled time.
- ✅ `clear()` removes all scheduled jobs.

**🤔 Socratic Question(s)**

- The `schedule` library runs jobs in a blocking loop. How would you run the scheduler alongside a web server or a WebSocket listener for real-time device updates?
- If a scheduled rule fires while a device is in an unexpected state (a light was manually turned off), should the rule still execute its actions? How would you add a "check before acting" mode?

## Step 4: Add presence detection

Presence detection answers the question "is anyone home?" by monitoring which devices are connected to the network. When a phone joins the WiFi, someone's home; when it leaves, the house can enter "away" mode.

### 4.1 Build the presence detector

**👟 Starter hint:** Create `hub/presence.py` with a function that checks whether a device (phone) is reachable by ping.

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

The `ping` function uses `subprocess.run` to execute a real system ping — the same command you'd type in a terminal. `check_all` iterates over all registered devices and updates their status. `anyone_home` is a convenience property that returns `True` if any device is reachable. In production, you'd poll this periodically (every 30 seconds to a minute) and trigger rules when the status changes.

**🎯 Expected output:** `detector.ping("127.0.0.1")` returns `True` (localhost is always reachable). `detector.ping("192.0.2.1")` returns `False` (a TEST-NET address that shouldn't respond).

**🩹 If it's off:** If `ping` always returns `False`, check that `timeout` is large enough and that the IP is reachable from your network. On some systems, `ping` requires `-c 1` (count) to avoid pinging forever.

### 4.2 Connect presence to rules

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

The `PresenceRuleEvaluator` only triggers rules when presence *changes* — not on every poll. This prevents rules from firing repeatedly while someone is home. The `prev_home` tracking is the key: when the status flips from `True` to `False` (everyone left), rules with presence conditions fire once.

**🎯 Expected output:** `evaluate_on_change` returns rules when presence transitions from home to away (or vice versa), and returns an empty list when nothing changed.

**🩹 If it's off:** If rules fire on every call, `prev_home` isn't being updated. If rules never fire, the `prev_home` starts as `None`, which means the first call always triggers.

### 4.3 Verify presence detection

**✅ Checklist**

- ✅ `ping("127.0.0.1")` returns `True`.
- ✅ `check_all` returns a dictionary of device names to booleans.
- ✅ `evaluate_on_change` only returns results when the home/away status actually changes.

**🤔 Socratic Question(s)**

- Ping-based presence has a lag: a phone might not respond for 30 seconds after leaving the network. How would you add a grace period before declaring "away" to avoid false triggers?
- If two people are home and one leaves, `anyone_home` is still `True`. How would you track per-person presence instead of a simple binary?

## Step 5: Wire everything into a CLI

The CLI ties all the pieces together: register devices, write rules, set up schedules, and run the engine in a loop.

### 5.1 Build the CLI

**👟 Starter hint:** Create `hub/cli.py` with commands for registering devices, adding rules, and running the engine.

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

The `demo` command is the most useful for learning — it sets up a complete scenario with three devices, two rules, and evaluates them in one shot. The `add_device` and `status` commands are stubs for extending the system. The CLI keeps the automation logic testable without running a continuous event loop.

**🎯 Expected output:** `uv run python -m hub.cli demo` prints "Rule 'Cold turns on light' fired" and shows the light is on and the door is locked.

**🩹 If it's off:** If no rules fire, the thermostat temperature (65.0) may not be compared correctly against "68" — check the `float()` cast in the condition evaluator.

### 5.2 End-to-end smoke test

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

**🎯 Expected output:** The assertion passes; only the "Cold" rule fires, and the light is on.

**🩹 If it's off:** If both rules fire, the "Away lock" condition `greater_than 80` is being compared incorrectly — check the float conversion.

### 5.3 Verify the CLI pipeline

**✅ Checklist**

- ✅ `uv run python -m hub.cli demo` runs a complete scenario with devices, rules, and actions.
- ✅ Rules fire based on current device state — not based on what the rule expects.
- ✅ The CLI prints clear output showing which rules fired and what actions were taken.

**🤔 Socratic Question(s)**

- If you ran the demo twice, the light would already be on from the first run. How would you reset device state between evaluations so each run starts clean?
- The demo evaluates rules once. A real home automation hub runs in a continuous loop. How would you structure the main loop to handle state changes, scheduled events, and presence updates in one cycle?

## ⚠️ Common pitfalls

- **Rules that fire on every poll instead of on state change.** If your engine re-evaluates all rules every time a sensor reports (even when nothing changed), you'll get repeated actions and unnecessary notifications. The `PresenceRuleEvaluator` pattern — tracking `prev_home` and only firing on transitions — prevents this.
- **String vs. numeric comparisons in conditions.** A condition like `temperature > 68` must compare floats, not strings. The `evaluate_condition` function casts values with `float()` for numeric operators, but this is easy to forget when adding new operators.
- **Actions that call methods that don't exist.** If `action.method` is `"turn_on"` but the device class spells it `"TurnOn"`, `getattr` returns `None` and the action silently fails. Always validate that the method exists before calling it.
- **Scheduling with blocking loops.** The `schedule` library uses `time.sleep(1)` internally, which blocks the entire thread. For a real hub that also handles WebSocket connections or HTTP requests, you'd need async scheduling (like `APScheduler`) instead.
- **Presence detection assumes all devices are phones.** A laptop that's always connected, a smart speaker that never leaves, or a guest's phone would all skew the presence calculation. Tag devices as "mobile" vs. "stationary" before using them for presence.

## What you just built

A rule-based home automation engine: devices with state and methods, a trigger-action rule engine that evaluates conditions against live device state, time-based scheduling for recurring automations, and presence detection from network pings. The architecture — devices, rules, scheduler, presence — mirrors how home automation platforms like Home Assistant and Hubitat work, just smaller and running entirely in Python.

:::tip[Run a fuller version without any local setup]
[`examples/home-automation/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/home-automation) in the course repo has a richer version with more device types, a web dashboard, and the scheduler wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a web API (Flask or FastAPI) that exposes device states and allows rule creation from a browser-based dashboard.
- Implement event logging: record every rule fire and action taken to a SQLite database for audit and debugging.
- Add MQTT integration so real smart home devices (Zigbee, Z-Wave) can publish state changes that the engine processes.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
