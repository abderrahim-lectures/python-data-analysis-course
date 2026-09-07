---
title: "Gestionnaire de Règles de Pare-feu"
description: "Gérez les règles de pare-feu avec validation, simulation et déploiement basé sur les différences."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["cli", "security", "data-validation"]
learningObjectives:
  - "Modéliser les règles de pare-feu comme des dataclasses Python avec validation"
  - "Détecter les conflits de règles et les plages de ports qui se chevauchent"
  - "Simuler le trafic contre un ensemble de règles pour prédire les issues accept/deny"
  - "Générer des diffs de déploiement et revenir à des ensembles de règles précédents"
prerequisites: ["Python 101"]
---

# 🔥 Construis un Gestionnaire de Règles de Pare-feu

Les règles de pare-feu sont les garde-fous de la sécurité réseau — une seule règle mal configurée peut ouvrir un port sur internet ou bloquer silencieusement du trafic légitime. Ce projet construit un outil CLI qui gère un ensemble de règles comme des données structurées : tu écris les règles en Python, tu les valides pour détecter les conflits, tu simules comment le trafic réel circulerait à travers les règles, et tu déploies les changements comme un diff contre l'état courant avec un retour arrière en une commande. L'objectif est un outil qui rend la gestion du pare-feu auditable et réversible au lieu d'effrayante et mystérieuse.

Ceci suppose Python 101 — rien venant d'Analyse de données n'est requis. Facultatif et non noté ; consulte [Real-World Projects](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Monter un projet avec `uv` et installer les dépendances dont tu auras besoin.
2. Modéliser les règles de pare-feu comme des dataclasses Python avec des champs pour l'action, le protocole, la plage de ports et la source.
3. Écrire un validateur qui détecte les règles conflictuelles et les plages de ports invalides.
4. Construire un simulateur de trafic qui fait correspondre les paquets entrants à un ensemble de règles.
5. Implémenter un déploiement basé sur les différences qui montre exactement ce qui change avant d'appliquer.
6. Ajouter une commande de retour arrière qui revient à l'ensemble de règles précédent en une étape.

## Où exécuter ceci

**Localement avec `uv`** est le chemin principal — c'est un outil CLI qui lit et écrit des fichiers de règles sur disque et simule des schémas de trafic.

**Google Colab, Kaggle Notebooks, et Binder** fonctionnent pour essayer l'outil. Le notebook installe les mêmes bibliothèques et utilise le même code ; il utilise des règles d'échantillon et un trafic simulé au lieu de toucher de vraies configurations de pare-feu.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/firewall-rules/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/firewall-rules/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffirewall-rules%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant d'écrire une seule règle : un environnement Python, une bibliothèque pour construire la CLI, et un répertoire de projet.

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
uv init firewall-rules
cd firewall-rules
uv add click pydantic
```

`click` construit l'interface CLI, et `pydantic` nous donne une validation de règles avec des messages d'erreur clairs. La structure du projet garde les règles, la validation, la simulation et le déploiement dans des fichiers séparés pour la clarté.

### Créer la structure du projet

```bash
mkdir -p fw
touch fw/__init__.py fw/rules.py fw/validate.py fw/simulate.py fw/deploy.py fw/cli.py
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `firewall-rules/` existe avec un `pyproject.toml`, et `click` et `pydantic` sont installés.
- ✅ Le répertoire `fw/` a tous les fichiers de module requis.

## Étape 1 : Modéliser les règles de pare-feu comme des données

Chaque règle de pare-feu a la même forme : une action (allow ou deny), un protocole (TCP, UDP, ou ICMP), une plage de ports, et une source IP ou un bloc CIDR optionnel. Modéliser ceci comme un modèle Pydantic te donne une validation automatique — une règle avec le port `99999` ou une action `"maybe"` échoue immédiatement au lieu de corrompre silencieusement l'ensemble de règles.

### 1.1 Définis le schéma de règle

**👟 Indice de départ :** Crée `fw/rules.py` avec un modèle Pydantic qui valide chaque champ à la création.

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

Pydantic attrape les mauvaises données au moment de la construction — `port_start > port_end`, des blocs CIDR invalides, ou des protocoles non reconnus lèvent tous une `ValueError` avec un message clair. Le champ `source` a pour défaut `0.0.0.0/0` (n'importe quelle IP), ce qui est le cas courant pour la plupart des règles.

**🎯 Résultat attendu :** `FirewallRule(name="web", action="allow", protocol="tcp", port_start=80, port_end=443)` crée une règle valide. `FirewallRule(name="bad", action="allow", protocol="tcp", port_start=99999, port_end=99999)` lève une `ValidationError`.

**🩹 Si ça ne marche pas :** Si `ip_network` n'attrape pas un CIDR invalide, tu importes peut-être depuis le mauvais module — utilise `from ipaddress import ip_network`. Si Pydantic n'exécute pas le validateur de ports, assure-toi que le décorateur `@field_validator` est présent.

### 1.2 Vérifie la création de règle

```python
# Quick test
from fw.rules import FirewallRule

r = FirewallRule(name="ssh", action="allow", protocol="tcp", port_start=22, port_end=22)
assert r.action.value == "allow"
assert r.port_start == 22
print(r.model_dump())
```

Le modèle fait un aller-retour propre : crée une règle, accède à ses champs, et sérialise-la de retour en dictionnaire.

**🎯 Résultat attendu :** L'assertion passe ; `model_dump()` imprime un dictionnaire avec tous les champs.

**🩹 Si ça ne marche pas :** Si `model_dump()` n'existe pas, tu es sur une version plus ancienne de Pydantic — utilise `.dict()` à la place.

### 1.3 Vérifie le modèle de règle

**✅ Liste de vérification**

- ✅ Une règle valide se crée avec succès, tous champs accessibles.
- ✅ Un port invalide (en dehors de 1–65535) lève une `ValidationError` claire.
- ✅ Une source CIDR invalide (comme `"not-an-ip"`) lève une erreur claire.

**🤔 Question(s) socratique(s)**

- Pourquoi modéliser les règles comme des modèles Pydantic au lieu de simples dictionnaires ? Quelles garanties de validation obtiens-tu gratuitement ?
- Si deux règles ont le même nom mais des actions différentes, est-ce un conflit ou est-ce valide ? Comment déciderais-tu ?

## Étape 2 : Détecter les conflits de règles

Un ensemble de règles n'est utile que si ses règles ne se contredisent pas. Deux règles qui correspondent au même trafic avec des actions différentes créent de l'ambiguïté — la plupart des pare-feux gèrent cela avec un ordre « première correspondance gagne », mais tu dois quand même avertir l'utilisateur.

### 2.1 Écris le détecteur de conflits

**👟 Indice de départ :** Crée `fw/validate.py` avec une fonction qui compare chaque paire de règles et signale les plages de ports qui se chevauchent sur le même protocole.

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

La vérification de chevauchement `a.port_start <= b.port_end and b.port_start <= a.port_end` est le test d'intervalle standard. La vérification de source est importante : deux règles avec des IP source différentes peuvent se chevaucher sans conflit parce qu'elles correspondent à un trafic différent. Mais quand une règle couvre toutes les sources (`0.0.0.0/0`), elle chevauche tout.

**🎯 Résultat attendu :** Deux règles correspondant à TCP 80–443 depuis n'importe quelle source produisent un conflit. Deux règles correspondant à TCP 80 mais depuis des IP spécifiques différentes ne produisent aucun conflit.

**🩹 Si ça ne marche pas :** Si des règles avec des protocoles différents sont signalées comme conflictuelles, la vérification de protocole manque. Si des règles avec des sources spécifiques différentes sont signalées, la logique de chevauchement de source est trop stricte.

### 2.2 Ajoute un résumé de validation

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

**🎯 Résultat attendu :** Un ensemble de règles sans chevauchement renvoie `{"valid": True, "issues": [], "rule_count": N}`. Un ensemble conflictuel renvoie `{"valid": False, "issues": [...], ...}` avec des descriptions de conflits lisibles par l'humain.

**🩹 Si ça ne marche pas :** Si le résumé montre toujours `"valid": True`, la liste des problèmes n'est pas remplie — vérifie que `find_conflicts` renvoie les bons tuples.

### 2.3 Vérifie la détection de conflits

**✅ Liste de vérification**

- ✅ Deux règles correspondant au même protocole et à la même plage de ports depuis la même source sont signalées.
- ✅ Les règles correspondant à des protocoles différents ou des sources différentes ne sont pas signalées.
- ✅ Le résumé de validation renvoie `"valid": False` avec des descriptions de problèmes lisibles.

**🤔 Question(s) socratique(s)**

- La plupart des pare-feux réels utilisent un ordre « première correspondance gagne ». Comment l'ajout d'une priorité de règle changerait la logique de détection de conflits — les règles qui se chevauchent seraient-elles toujours des conflits, ou juste des préoccupations de tri ?
- Que se passe-t-il si un ensemble de règles a une règle `deny all` au milieu ? Ton validateur signalerait-il les règles en dessous comme redondantes ?

## Étape 3 : Simuler le trafic contre l'ensemble de règles

La validation te dit si les règles sont internement cohérentes ; la simulation te dit ce qu'elles *font* réellement. Étant donné une liste de paquets de trafic simulés (IP source, protocole, port), tu peux parcourir les règles dans l'ordre et prédire si chaque paquet est autorisé ou refusé.

### 3.1 Construis le simulateur

**👟 Indice de départ :** Crée `fw/simulate.py` avec une fonction qui parcourt les règles dans l'ordre pour chaque paquet et renvoie la première action correspondante.

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

Parcourir les règles dans l'ordre et renvoyer à la première correspondance est la façon dont la plupart des pare-feux fonctionnent réellement. Si aucune règle ne correspond, l'action par défaut est deny — c'est le défaut sûr. Le module `ipaddress` gère correctement la correspondance CIDR, y compris les cas limites comme `192.168.1.0/24`.

**🎯 Résultat attendu :** Un ensemble de règles avec `allow tcp 80-80` et `deny tcp 1-1023` produit `("allow", rule)` pour un paquet vers le port 80 depuis n'importe quelle source, et `("deny", rule)` pour le port 22 depuis n'importe quelle source.

**🩹 Si ça ne marche pas :** Si le port 80 renvoie `deny`, les règles ne sont pas ordonnées correctement — la première correspondance compte. Si la correspondance CIDR ne fonctionne pas, vérifie que tu utilises `ip_network` avec `strict=False`.

### 3.2 Ajoute la simulation par lots

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

**🎯 Résultat attendu :** Un lot de trois paquets produit trois dictionnaires de résultats, chacun avec les champs du paquet d'origine plus `action` et `matched_rule`.

**🩹 Si ça ne marche pas :** Si la liste de résultats est vide, la liste d'entrée n'est pas parcourue. Si `matched_rule` est toujours `None`, la fonction `simulate_packet` ne renvoie pas la règle correspondante.

### 3.3 Vérifie le simulateur

**✅ Liste de vérification**

- ✅ Un paquet correspondant à la première règle obtient l'action de cette règle.
- ✅ Un paquet ne correspondant à aucune règle obtient `"deny"` avec `matched_rule=None`.
- ✅ `simulate_traffic` renvoie un résultat par paquet d'entrée.

**🤔 Question(s) socratique(s)**

- Si tu inversais l'ordre des règles, quels paquets changeraient d'issue ? Cela te dit-il quelque chose sur pourquoi l'ordre des règles compte dans les pare-feux réels ?
- Que faudrait-il pour ajouter de la journalisation — enregistrer *quelles* règles ont été vérifiées mais ne correspondaient pas — pour pouvoir déboguer un paquet refusé après coup ?

## Étape 4 : Déploiement basé sur les différences avec retour arrière

Déployer des règles de pare-feu en toute sécurité signifie montrer à l'utilisateur exactement ce qui change avant d'appliquer quoi que ce soit, et pouvoir l'annuler instantanément. Cette étape construit un déployeur qui fait un instantané des règles courantes, calcule un diff contre le nouvel ensemble, et stocke la version précédente pour le retour arrière.

### 4.1 Construis le déployeur

**👟 Indice de départ :** Crée `fw/deploy.py` avec `deploy` (instantané + diff + application) et `rollback` (restauration de l'instantané précédent).

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

La fonction de déploiement fait d'abord l'instantané, puis calcule, puis applique — cet ordre garantit que tu as toujours un point de retour arrière même si les nouvelles règles sont malformées. Le rapport de diff dit à l'opérateur exactement ce qui a changé : quelles règles sont nouvelles, lesquelles ont disparu, et lesquelles ont été modifiées.

**🎯 Résultat attendu :** Déployer des règles qui en ajoutent une, en retirent une et en modifient une produit un dict de diff avec `added: ["new_rule"]`, `removed: ["old_rule"]`, `changed: ["modified_rule"]`.

**🩹 Si ça ne marche pas :** Si le fichier d'instantané n'est pas créé, `HISTORY_DIR.mkdir()` n'est pas appelé avant l'écriture. Si le diff montre tout comme ajouté, `old_rules` s'est chargé comme une liste vide — vérifie que `rules.json` existe avant le déploiement.

### 4.2 Ajoute le retour arrière

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

Le retour arrière lit l'instantané le plus récent et l'écrit de retour dans `rules.json`. Le nommage basé sur l'horodatage rend l'ordre sans ambiguïté, et renvoyer le nom de l'instantané donne à l'opérateur un enregistrement de quelle version a été restaurée.

**🎯 Résultat attendu :** Appeler `rollback()` après un déploiement rétablit `rules.json` à la version précédente et renvoie le nom de l'instantané.

**🩹 Si ça ne marche pas :** Si le retour arrière renvoie « No snapshots found », le répertoire `rule_history/` est vide — le déploiement doit se dérouler avant le retour arrière. Si les règles restaurées sont fausses, le nommage des instantanés n'est pas trié chronologiquement.

### 4.3 Vérifie le déploiement

**✅ Liste de vérification**

- ✅ `deploy` crée un instantané horodaté dans `rule_history/` avant d'appliquer les changements.
- ✅ Le rapport de diff identifie correctement les règles ajoutées, retirées et modifiées.
- ✅ `rollback` restaure l'instantané le plus récent et écrase `rules.json`.

**🤔 Question(s) socratique(s)**

- Dans un pare-feu de production, « appliquer » pourrait signifier exécuter une commande système avec un réel impact réseau. Comment l'ordre instantané-puis-application te protège-t-il si l'étape d'application échoue à mi-chemin ?
- Si deux personnes déploient en même temps, que se passe-t-il avec les instantanés ? Comment gérerais-tu les déploiements concurrents ?

## Étape 5 : Construis la CLI

Câble tout ensemble avec trois commandes : `validate`, `deploy` et `rollback`.

### 5.1 Écris la CLI

**👟 Indice de départ :** Crée `fw/cli.py` avec des commandes `click` pour chaque opération.

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

La CLI est fine — chaque commande tient en quelques lignes qui analysent l'entrée, appellent la fonction de bibliothèque, et impriment le résultat. Cette séparation signifie que le code de bibliothèque (`rules.py`, `validate.py`, `simulate.py`, `deploy.py`) est testable sans la CLI, et la CLI est triviale à étendre avec de nouvelles commandes.

**🎯 Résultat attendu :** `uv run python -m fw.cli validate rules.json` imprime « Valid: N rules, no conflicts » pour un ensemble de règles propre, ou liste les conflits et sort avec le code 1.

**🩹 Si ça ne marche pas :** Si la CLI ne trouve pas `click`, vérifie que `click` est dans `pyproject.toml`. Si `validate` montre toujours valide, les règles ne sont pas chargées depuis le fichier — vérifie le chemin de lecture du fichier.

### 5.2 Test de fumée de bout en bout

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

Cela exécute le pipeline complet : valider, simuler, déployer. Chaque morceau a été testé individuellement ; cela confirme que la transition entre eux est propre.

**🎯 Résultat attendu :** Toutes les assertions passent ; le déploiement rapporte 3 règles sans règles ajoutées, retirées ni modifiées (le premier déploiement est toujours un diff « propre »).

**🩹 Si ça ne marche pas :** Si la simulation produit de mauvaises actions, vérifie l'ordre des règles. Si le déploiement montre des règles ajoutées/retirées inattendues, le fichier `rules.json` peut avoir des données périmées d'une exécution précédente.

### 5.3 Vérifie le pipeline CLI

**✅ Liste de vérification**

- ✅ `validate` détecte les règles conflictuelles et sort avec le code 1.
- ✅ `deploy` crée un instantané et rapporte les règles ajoutées/retirées/modifiées.
- ✅ `rollback` restaure l'instantané le plus récent.

**🤔 Question(s) socratique(s)**

- Que faudrait-il pour ajouter une commande CLI `simulate` qui lit un fichier de règles et un CSV de trafic, puis imprime un tableau de résultats allow/deny ?
- Si la commande deploy écrit partiellement `rules.json` puis plante, dans quel état est le fichier ? Comment rendrais-tu l'écriture atomique ?

## ⚠️ Pièges courants

- **Oublier que l'ordre des règles compte.** Le simulateur parcourt les règles de haut en bas et renvoie à la première correspondance. Une règle `deny all` au-dessus d'une règle `allow http` bloque le trafic HTTP. Mets toujours les règles allow spécifiques avant les règles deny larges.
- **Plages de ports qui s'enroulent silencieusement.** Une règle avec `port_start=80` et `port_end=80` est correcte ; `port_start=443` et `port_end=80` devrait échouer à la validation mais ne le fait pas si la vérification de plage manque. Valide toujours `port_start <= port_end`.
- **Ne pas faire d'instantané avant le déploiement.** Si tu appliques de nouvelles règles sans enregistrer les anciennes d'abord, il n'y a aucun point de retour arrière. La fonction de déploiement fait toujours l'instantané d'abord — ne saute pas cette étape.
- **Correspondance CIDR sans `strict=False`.** `ip_network("192.168.1.1/24")` lève une `ValueError` parce que les bits d'hôte sont définis. Utiliser `strict=False` masque silencieusement les bits d'hôte, ce qui est le comportement correct pour la correspondance de source de pare-feu.
- **Traiter la validation comme un déploiement.** Un ensemble de règles qui passe la validation peut quand même causer des problèmes en production (mauvais ordre, défauts manquants). La validation attrape les conflits ; la simulation attrape les erreurs logiques. Exécute les deux avant de déployer.

## Ce que tu viens de construire

Un outil de gestion de règles de pare-feu qui modélise les règles comme des objets Python validés, détecte les conflits avant qu'ils n'atteignent la production, simule le trafic réel contre l'ensemble de règles, et déploie les changements avec un flux basé sur instantané-et-diff qui rend chaque changement auditable et réversible. L'architecture — modèle, valider, simuler, déployer — est le même schéma que celui des outils d'infrastructure-as-code comme Terraform et Pulumi.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/firewall-rules/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/firewall-rules) dans le dépôt du cours a une version plus riche avec plus de types de règles, un CSV de trafic pour la simulation par lots, et des fichiers de règles d'échantillon. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller ensuite

- Ajoute un drapeau `--dry-run` à la commande deploy qui montre le diff sans l'appliquer.
- Construis un système de modèles de règles : des modèles prédéfinis pour des schémas courants comme « allow HTTP », « allow SSH », « block all inbound » qui génèrent des règles correctement structurées.
- Implémente la priorité/le tri des règles : trie automatiquement les règles pour que les correspondances les plus spécifiques viennent en premier, réduisant les risques de bugs de tri.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓