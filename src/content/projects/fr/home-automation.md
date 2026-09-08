---
title: "Hub d'Automatisation Domotique"
description: "Automatisez les appareils du foyer avec des règles, des horaires, des commandes vocales et la détection de présence."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["iot", "cli", "async"]
learningObjectives:
  - "Modéliser les appareils domotiques et les règles d'automatisation comme des dataclasses Python"
  - "Implémenter un moteur déclencheur-action qui évalue les règles par rapport à l'état des appareils"
  - "Construire un système de planification pour les automatisations temporelles"
  - "Détecter la présence à partir des pings réseau et déclencher des chaînes de règles"
prerequisites: ["Python 101"]
---

# 🏠 Construis un Hub d'Automatisation Domotique

Ta maison intelligente n'est aussi intelligente que les règles qui relient ses appareils — un détecteur de mouvement qui allume une lumière, un thermostat qui s'ajuste quand tu pars, une serrure de porte qui s'engage au coucher. Ce projet construit un moteur d'automatisation domotique basé sur des règles en Python : tu définis des appareils (lumières, thermostats, serrures), tu écris des règles si-alors, tu planifies des déclencheurs temporels et tu détectes la présence à partir de pings réseau. Le moteur s'exécute localement, traite les événements et exécute les actions — sans service cloud requis.

Ceci suppose Python 101 — rien de Data Analysis n'est requis. Optionnel et non noté ; voir [Real-World Projects](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Configurer un projet avec `uv` et installer les dépendances dont tu auras besoin.
2. Modéliser les appareils domotiques (lumières, thermostats, serrures) comme des classes Python avec état.
3. Construire un moteur de règles qui évalue les paires déclencheur-action par rapport à l'état actuel des appareils.
4. Implémenter la planification temporelle pour les automatisations récurrentes.
5. Ajouter une détection de présence qui surveille les pings d'appareils sur le réseau.
6. Tout relier dans une CLI qui enregistre les appareils, écrit les règles et exécute le moteur.

## Où exécuter ceci

**Localement avec `uv`** est la voie principale — ce projet simule des pings réseau et exécute un moteur de règles qui traite les événements en boucle. Il est conçu pour s'exécuter sur une machine connectée à ton réseau domestique.

**Google Colab, Kaggle Notebooks et Binder** fonctionnent pour essayer l'outil. Le notebook utilise des états d'appareils simulés et des pings factices au lieu d'un vrai trafic réseau.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/home-automation/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/home-automation/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fhome-automation%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant de construire : un environnement Python, une bibliothèque de planification et un répertoire de projet.

### Installer `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Ferme et rouvre ton terminal, puis confirme :

```bash
uv --version
```

### Initialiser le projet

```bash
uv init home-automation
cd home-automation
uv add click schedule
```

`click` construit l'interface CLI, et `schedule` gère la planification des travaux basée sur le temps. Le projet garde les appareils, les règles, la planification, la présence et la CLI dans des fichiers séparés.

### Créer la structure du projet

```bash
mkdir -p hub
touch hub/__init__.py hub/devices.py hub/rules.py hub/scheduler.py hub/presence.py hub/engine.py hub/cli.py
```

**✅ Liste de vérification**

- ✅ `uv --version` imprime un numéro de version.
- ✅ `home-automation/` existe avec un `pyproject.toml`, et `click` et `schedule` sont installés.
- ✅ Le répertoire `hub/` a tous les fichiers de modules requis.

## Étape 1 : Modéliser les appareils domotiques

Chaque appareil domotique a un type (lumière, thermostat, serrure), un nom, un emplacement et un état (allumé/éteint, température, verrouillé/déverrouillé). Modéliser les appareils comme des classes avec des méthodes comme `turn_on()` et `set_temperature()` te donne une API propre pour le moteur de règles à appeler.

### 1.1 Définir les classes d'appareils

**👟 Indice de départ :** Crée `hub/devices.py` avec une classe de base `Device` et des sous-classes spécifiques au type.

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

Chaque classe d'appareil stocke l'état mutable dans des champs préfixés par un tiret bas (`_is_on`, `_temperature`) avec des accesseurs `@property`. Cela garde l'API publique propre (`light.is_on`) tout en permettant la mutation via des méthodes (`light.turn_on()`). La classe de base `Device` fournit un `set_state` générique que le moteur de règles peut utiliser sans connaître le type d'appareil spécifique.

**🎯 Résultat attendu :** `Light(id="l1", name="Living Room", location="Living Room")` crée une lumière qui démarre éteinte. `light.turn_on()` met `light.is_on` à `True`.

**🩹 Si ça ne marche pas :** Si `is_on` est toujours `False` après `turn_on()`, la propriété lit la valeur par défaut au niveau de la classe au lieu du `_is_on` d'instance. Assure-toi que `@property` est défini sur la classe, pas dans `__init__`.

### 1.2 Construire un registre d'appareils

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

**🎯 Résultat attendu :** `registry.register(light)` rend la lumière trouvable par ID et par emplacement.

**🩹 Si ça ne marche pas :** Si `by_location` renvoie toujours une liste vide, vérifie que les chaînes d'emplacement correspondent exactement (sensibles à la casse).

### 1.3 Vérifier la modélisation des appareils

**✅ Liste de vérification**

- ✅ `Light`, `Thermostat` et `Lock` démarrent avec des valeurs par défaut sensées.
- ✅ Des méthodes comme `turn_on()`, `set_target()` et `lock()` changent l'état de l'appareil.
- ✅ `DeviceRegistry` trouve les appareils par ID et par emplacement.

**🤔 Question(s) socratique(s)**

- Pourquoi utiliser `@property` pour `is_on` au lieu d'exposer `_is_on` directement ? Qu'est-ce que l'indirection t'apporte quand tu ajoutes plus tard de la journalisation ou de l'émission d'événements ?
- Si tu ajoutais un nouveau type d'appareil (disons, une `Speaker`), quelle est l'interface minimale dont il a besoin pour que le moteur de règles puisse le contrôler ?

## Étape 2 : Construire le moteur de règles déclencheur-action

Le moteur de règles est le cerveau de la maison : il surveille les événements (une lumière s'allume, la température descend sous un seuil, une porte s'ouvre) et exécute des actions (envoyer une notification, ajuster un autre appareil, journaliser une entrée). Chaque règle est une paire si-alors.

### 2.1 Définir les règles et l'évaluateur

**👟 Indice de départ :** Crée `hub/rules.py` avec une dataclasse `Rule` et une fonction `evaluate_rules`.

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

La fonction `evaluate_condition` lit un attribut d'appareil (`is_on`, `temperature`) et le compare à la valeur de la condition en utilisant l'opérateur spécifié. `evaluate_rules` exécute toutes les règles activées et collecte celles dont toutes les conditions sont remplies — la vérification « toutes les conditions » signifie que chaque condition d'une règle doit être vraie pour que la règle se déclenche. Quand une règle se déclenche, elle exécute chaque action en appelant la méthode nommée sur l'appareil cible.

**🎯 Résultat attendu :** Une règle avec la condition `thermostat.temperature < 68` déclenche `light.turn_on()` quand le thermostat affiche 65 degrés.

**🩹 Si ça ne marche pas :** Si les règles ne se déclenchent jamais, vérifie que `rule.enabled` est `True` et que les noms d'attributs de condition correspondent exactement aux noms des `@property` de l'appareil. Si la mauvaise méthode d'appareil est appelée, la chaîne `action.method` ne correspond pas au nom de la méthode de la classe d'appareil.

### 2.2 Tester l'évaluation des règles

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

**🎯 Résultat attendu :** L'assertion passe ; la lumière est allumée après l'évaluation des règles.

**🩹 Si ça ne marche pas :** Si la lumière ne s'est pas allumée, la comparaison de la condition `less_than` compare peut-être des chaînes au lieu de flottants — vérifie le transtypage `float()` dans `evaluate_condition`.

### 2.3 Vérifier le moteur de règles

**✅ Liste de vérification**

- ✅ Une règle se déclenche quand toutes ses conditions sont remplies.
- ✅ Une règle ne se déclenche pas quand une condition échoue.
- ✅ Les actions appellent les bonnes méthodes d'appareil avec les bons arguments.

**🤔 Question(s) socratique(s)**

- Les règles évaluent toutes les conditions à chaque changement d'état. Pour une maison avec 50 appareils et 20 règles, cela fait 1 000 vérifications de conditions par événement. Comment optimiserais-tu cela — ne réévaluer que les règles dont les conditions référencent l'appareil modifié ?
- Que se passe-t-il si deux règles tentent de mettre le même appareil dans des états contradictoires ? Comment ajouterais-tu une priorité ou un ordre pour résoudre les conflits ?

## Étape 3 : Implémenter la planification temporelle

Certaines automatisations ne sont pas déclenchées par l'état de l'appareil — elles s'exécutent selon un horaire. « Éteindre toutes les lumières à minuit », « baisser le thermostat à 22 h », « verrouiller les portes au coucher ». Cette étape utilise la bibliothèque `schedule` pour exécuter des règles à des heures précises.

### 3.1 Construire le planificateur

**👟 Indice de départ :** Crée `hub/scheduler.py` avec des fonctions pour enregistrer et exécuter des règles planifiées.

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

La bibliothèque `schedule` gère le minutage — tu enregistres juste une fonction à exécuter à une heure précise chaque jour. `run_pending()` est appelée en boucle pour vérifier si des travaux planifiés sont dus. La fermeture `job` capture la règle et le registre, donc quand l'heure planifiée arrive, elle évalue la règle par rapport à l'état actuel de l'appareil et exécute les actions correspondantes.

**🎯 Résultat attendu :** `scheduler.schedule_rule(rule, "22:00")` imprime « Scheduled 'Warm up' at 22:00 » et enregistre le travail.

**🩹 Si ça ne marche pas :** Si le travail ne s'exécute jamais, `run_pending()` n'est pas appelée en boucle. Si le format d'heure est incorrect, `schedule` lève une `ValueError` — utilise le format 24 heures `HH:MM`.

### 3.2 Tester avec un temps simulé

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

**🎯 Résultat attendu :** `schedule.run_pending()` imprime « ACTION: l1.turn_off({}) » immédiatement (puisque le travail est dû à 22:00 et que nous l'appelons dans un test).

**🩹 Si ça ne marche pas :** Si rien ne s'imprime, l'heure planifiée n'est pas encore arrivée dans le test — `schedule.run_pending()` n'exécute que les travaux dont l'heure est passée depuis le dernier appel.

### 3.3 Vérifier la planification

**✅ Liste de vérification**

- ✅ `schedule_rule` enregistre un travail qui s'imprime quand `run_pending()` est appelée.
- ✅ Les règles sans conditions exécutent leurs actions inconditionnellement à l'heure planifiée.
- ✅ `clear()` supprime tous les travaux planifiés.

**🤔 Question(s) socratique(s)**

- La bibliothèque `schedule` exécute les travaux dans une boucle bloquante. Comment exécuterais-tu le planificateur en parallèle d'un serveur web ou d'un écouteur WebSocket pour les mises à jour d'appareils en temps réel ?
- Si une règle planifiée se déclenche pendant qu'un appareil est dans un état inattendu (une lumière a été éteinte manuellement), la règle devrait-elle quand même exécuter ses actions ? Comment ajouterais-tu un mode « vérifier avant d'agir » ?

## Étape 4 : Ajouter la détection de présence

La détection de présence répond à la question « y a-t-il quelqu'un à la maison ? » en surveillant quels appareils sont connectés au réseau. Quand un téléphone rejoint le WiFi, quelqu'un est à la maison ; quand il part, la maison peut passer en mode « absent ».

### 4.1 Construire le détecteur de présence

**👟 Indice de départ :** Crée `hub/presence.py` avec une fonction qui vérifie si un appareil (téléphone) est joignable par ping.

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

La fonction `ping` utilise `subprocess.run` pour exécuter un vrai ping système — la même commande que tu taperais dans un terminal. `check_all` itère sur tous les appareils enregistrés et met à jour leur statut. `anyone_home` est une propriété pratique qui renvoie `True` si un appareil est joignable. En production, tu sonderais ceci périodiquement (toutes les 30 secondes à une minute) et déclencherais des règles quand le statut change.

**🎯 Résultat attendu :** `detector.ping("127.0.0.1")` renvoie `True` (localhost est toujours joignable). `detector.ping("192.0.2.1")` renvoie `False` (une adresse TEST-NET qui ne devrait pas répondre).

**🩹 Si ça ne marche pas :** Si `ping` renvoie toujours `False`, vérifie que `timeout` est assez grand et que l'IP est joignable depuis ton réseau. Sur certains systèmes, `ping` nécessite `-c 1` (compte) pour éviter de pinger indéfiniment.

### 4.2 Connecter la présence aux règles

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

Le `PresenceRuleEvaluator` ne déclenche des règles que quand la présence *change* — pas à chaque sondage. Cela empêche les règles de se déclencher en boucle pendant que quelqu'un est à la maison. Le suivi `prev_home` est la clé : quand le statut bascule de `True` à `False` (tout le monde est parti), les règles avec des conditions de présence se déclenchent une fois.

**🎯 Résultat attendu :** `evaluate_on_change` renvoie les règles quand la présence passe de « à la maison » à « absent » (ou l'inverse), et renvoie une liste vide quand rien n'a changé.

**🩹 Si ça ne marche pas :** Si les règles se déclenchent à chaque appel, `prev_home` n'est pas mis à jour. Si les règles ne se déclenchent jamais, `prev_home` démarre à `None`, ce qui signifie que le premier appel déclenche toujours.

### 4.3 Vérifier la détection de présence

**✅ Liste de vérification**

- ✅ `ping("127.0.0.1")` renvoie `True`.
- ✅ `check_all` renvoie un dictionnaire des noms d'appareils vers des booléens.
- ✅ `evaluate_on_change` ne renvoie des résultats que quand le statut maison/absent change réellement.

**🤔 Question(s) socratique(s)**

- La détection de présence par ping a un délai : un téléphone peut ne pas répondre pendant 30 secondes après avoir quitté le réseau. Comment ajouterais-tu une période de grâce avant de déclarer « absent » pour éviter les faux déclencheurs ?
- Si deux personnes sont à la maison et que l'une part, `anyone_home` est toujours `True`. Comment suivrais-tu la présence par personne au lieu d'un simple binaire ?

## Étape 5 : Tout relier dans une interface CLI

Le CLI relie toutes les pièces : enregistrer les appareils, écrire les règles, configurer les horaires et exécuter le moteur en boucle.

### 5.1 Construire le CLI

**👟 Indice de départ :** Crée `hub/cli.py` avec des commandes pour enregistrer les appareils, ajouter les règles et exécuter le moteur.

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

La commande `demo` est la plus utile pour apprendre — elle configure un scénario complet avec trois appareils, deux règles et les évalue d'un seul coup. Les commandes `add_device` et `status` sont des stubs pour étendre le système. La CLI garde la logique d'automatisation testable sans exécuter une boucle d'événements continue.

**🎯 Résultat attendu :** `uv run python -m hub.cli demo` imprime « Rule 'Cold turns on light' fired » et montre que la lumière est allumée et la porte verrouillée.

**🩹 Si ça ne marche pas :** Si aucune règle ne se déclenche, la température du thermostat (65.0) n'est peut-être pas comparée correctement à « 68 » — vérifie le transtypage `float()` dans l'évaluateur de conditions.

### 5.2 Test de fumée de bout en bout

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

**🎯 Résultat attendu :** L'assertion passe ; seule la règle « Cold » se déclenche, et la lumière est allumée.

**🩹 Si ça ne marche pas :** Si les deux règles se déclenchent, la condition `greater_than 80` de « Away lock » est comparée incorrectement — vérifie la conversion en flottant.

### 5.3 Vérifier le pipeline CLI

**✅ Liste de vérification**

- ✅ `uv run python -m hub.cli demo` exécute un scénario complet avec des appareils, des règles et des actions.
- ✅ Les règles se déclenchent en fonction de l'état actuel des appareils — et non de ce que la règle attend.
- ✅ Le CLI imprime une sortie claire montrant quelles règles se sont déclenchées et quelles actions ont été prises.

**🤔 Question(s) socratique(s)**

- Si tu exécutais la démo deux fois, la lumière serait déjà allumée dès la première exécution. Comment réinitialiserais-tu l'état des appareils entre les évaluations pour que chaque exécution démarre proprement ?
- La démo évalue les règles une fois. Un vrai hub domotique fonctionne en boucle continue. Comment structurerais-tu la boucle principale pour gérer les changements d'état, les événements planifiés et les mises à jour de présence en un seul cycle ?

## ⚠️ Pièges courants

- **Règles qui se déclenchent à chaque sondage au lieu de chaque changement d'état.** Si ton moteur réévalue toutes les règles chaque fois qu'un capteur rapporte (même quand rien n'a changé), tu obtiendras des actions répétées et des notifications inutiles. Le motif `PresenceRuleEvaluator` — suivre `prev_home` et ne se déclencher que sur les transitions — empêche cela.
- **Comparaisons de chaînes contre de nombres dans les conditions.** Une condition comme `temperature > 68` doit comparer des flottants, pas des chaînes. La fonction `evaluate_condition` transtype les valeurs avec `float()` pour les opérateurs numériques, mais il est facile de l'oublier quand tu ajoutes de nouveaux opérateurs.
- **Actions qui appellent des méthodes inexistantes.** Si `action.method` est « turn_on » mais que la classe d'appareil l'épelle « TurnOn », `getattr` renvoie `None` et l'action échoue silencieusement. Valide toujours que la méthode existe avant de l'appeler.
- **Planification avec des boucles bloquantes.** La bibliothèque `schedule` utilise `time.sleep(1)` en interne, ce qui bloque tout le thread. Pour un vrai hub qui gère aussi des connexions WebSocket ou des requêtes HTTP, tu aurais besoin d'une planification asynchrone (comme `APScheduler`) à la place.
- **La détection de présence suppose que tous les appareils sont des téléphones.** Un ordinateur portable toujours connecté, une enceinte intelligente qui ne part jamais ou le téléphone d'un invité fausseraient tous le calcul de présence. Étiquette les appareils comme « mobile » vs « fixe » avant de les utiliser pour la présence.

## Ce que tu viens de construire

Un moteur d'automatisation domotique basé sur des règles : des appareils avec état et méthodes, un moteur de règles déclencheur-action qui évalue les conditions par rapport à l'état vivant des appareils, une planification temporelle pour les automatisations récurrentes et une détection de présence à partir des pings réseau. L'architecture — appareils, règles, planificateur, présence — reflète le fonctionnement des plateformes domotiques comme Home Assistant et Hubitat, juste plus petit et fonctionnant entièrement en Python.

:::tip[Exécute une version plus complète sans configuration locale]
[`examples/home-automation/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/home-automation) dans le dépôt du cours a une version plus riche avec plus de types d'appareils, un tableau de bord web et le planificateur câblé de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et lance-le depuis là.
:::

## Où aller ensuite

- Ajoute une API web (Flask ou FastAPI) qui expose les états des appareils et permet la création de règles depuis un tableau de bord basé sur navigateur.
- Implémente la journalisation d'événements : enregistre chaque déclenchement de règle et chaque action prise dans une base de données SQLite pour l'audit et le débogage.
- Ajoute une intégration MQTT pour que de vrais appareils domotiques (Zigbee, Z-Wave) puissent publier des changements d'état que le moteur traite.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓