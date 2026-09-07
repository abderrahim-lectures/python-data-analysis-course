---
title: "Gestionnaire d'Appareils"
description: "Suis une flotte d'appareils connectés, juge la santé depuis les battements de cœur, déploie les firmwares, et pousse la configuration à distance."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "json", "datetimes", "file-persistence"]
prerequisites:
  - "Les bases de Python (listes, dictionnaires, boucles, fonctions)"
  - "Ouvrir et lire des fichiers"
learningObjectives:
  - "Charger un registre d'appareils depuis JSON et le garder trié par identifiant d'appareil"
  - "Mesurer l'âge du battement de cœur avec l'arithmétique datetime et classifier la santé de l'appareil"
  - "Détecter la dérive de firmware contre une carte des dernières versions"
  - "Résoudre la configuration effective de chaque appareil en stratifiant les écrasements de pièce"
  - "Afficher un rapport de flotte et l'exposer comme une CLI"
---

# 📡 Construire un Gestionnaire d'Appareils

Une flotte d'appareils connectés est un tas croissant de petits problèmes jusqu'à ce que quelqu'un la suive : des capteurs signalent un battement de cœur puis se taisent, `cam-01` est silencieux depuis six jours, deux de tes trois capteurs `temp-hum` sont derrière une release de firmware, et le capteur du garage devrait alerter à −5 °C pendant que les autres préviennent à 28. Un gestionnaire d'appareils transforme ces faits éparpillés en un registre que tu peux trier, un verdict de santé par appareil, une file de mise à jour, une configuration résolue par appareil, et un rapport de flotte sur un écran — tout depuis du JSON et un peu d'arithmétique `datetime`, sans réseau requis.

Ceci suppose Python 101 — listes, dictionnaires, boucles, fonctions — plus l'aise à ouvrir des fichiers. Rien du module Analyse de Données n'est requis. C'est facultatif et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Charger un registre d'appareils depuis `devices.json`, trié par identifiant.
2. Classifier la santé de chaque appareil depuis depuis quand son dernier battement de cœur date (en ligne / avertissement / hors ligne).
3. Comparer le firmware de chaque appareil au dernier de son modèle et construire une file de mise à jour.
4. Résoudre la configuration effective de chaque appareil en stratifiant les écrasements au niveau pièce sur les défauts de modèle.
5. Afficher un rapport de flotte groupé par pièce et l'expédier comme une petite CLI.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — un gestionnaire d'appareils est un outil de persistance de fichiers (ton propre `devices.json`), et cela vit sur un vrai système de fichiers.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent pour chaque étape — le notebook dans [`examples/device-manager/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.ipynb) exécute la même logique de flotte sur le registre de quatre appareils fourni en mémoire. Le compromis honnête : un notebook ne peut pas maintenir un fichier à jour comme une CLI le peut.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdevice-manager%2Fnotebook.ipynb)

## Configuration

`uv` est un outil unique qui remplace toute la chaîne « install Python, puis pip, puis un outil d'environnement virtuel » — et ce projet est pure bibliothèque standard.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme son installation :

```bash
uv --version
```

Ensuite, configure le projet :

```bash
uv init device-manager
cd device-manager
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `device-manager/` existe avec un `pyproject.toml`.
- ✅ `python -c "import json, datetime"` réussit — aucun paquet tiers.

## Étape 1 : Charger le registre d'appareils

Chaque décision en aval a besoin du même point de départ : la liste complète et triée des appareils. Un registre est juste du JSON — un enregistrement par appareil avec id, name, room, model, firmware, et dernier battement de cœur — et le charger signifie ouvrir le fichier, analyser deux vues, et décider d'un *ordre stable* sur lequel tu t'appuieras tout au long du projet.

### 1.1 Crée `devices.json` et `registry.py`

**👟 Indice de départ :** Stocke le registre, puis fais en sorte que `load_devices()` le retourne `sorted(...)` par identifiant d'appareil pour que chaque rapport soit déterministe :

```bash
cat > devices.json <<'EOF'
[
  {"id": "th-01", "name": "Living Room Sensor", "room": "living", "model": "temp-hum", "firmware": "1.2.0", "last_seen": "2026-09-06T08:15:00"},
  {"id": "th-02", "name": "Kitchen Sensor", "room": "kitchen", "model": "temp-hum", "firmware": "1.2.0", "last_seen": "2026-09-06T09:00:00"},
  {"id": "cam-01", "name": "Front Door Camera", "room": "entry", "model": "cam-1080", "firmware": "2.0.5", "last_seen": "2026-08-30T22:10:00"},
  {"id": "th-03", "name": "Garage Sensor", "room": "garage", "model": "temp-hum", "firmware": "1.1.9", "last_seen": "2026-09-06T06:40:00"}
]
EOF
```

```python
# registry.py
import json

def load_devices(path: str = "devices.json") -> list[dict]:
    with open(path) as f:
        devices = json.load(f)
    return sorted(devices, key=lambda d: d["id"])

if __name__ == "__main__":
    for d in load_devices():
        print(f"{d['id']:<8} {d['name']:<22} {d['model']:<10} firmware {d['firmware']}  ({d['room']})")
```

```bash
uv run python registry.py
```

`sorted(devices, key=lambda d: d["id"])` est la décision silencieuse qui garde chaque étape suivante ennuyeuse dans le bon sens : `fleet_report` montrera `cam-01` avant `th-01` *parce que le chargeur trie*, donc aucune autre fonction ne ré-implémente jamais cette règle. Les largeurs de format `:<8` / `:<22` sont le début de chaque jolie table de ce projet — une colonne alignée à gauche de largeur fixe.

**🎯 Résultat attendu :**

```
cam-01   Front Door Camera      cam-1080   firmware 2.0.5  (entry)
th-01    Living Room Sensor     temp-hum   firmware 1.2.0  (living)
th-02    Kitchen Sensor         temp-hum   firmware 1.2.0  (kitchen)
th-03    Garage Sensor          temp-hum   firmware 1.1.9  (garage)
```

**🩹 Si ça ne marche pas :** Si l'ordre est th-01 avant cam-01, le `sorted` manque à l'intérieur de `load_devices` ou trie un autre champ (`key=lambda d: d["id"]`, pas `d["name"]`). Si `json.decoder.JSONDecodeError` se déclenche, le heredoc a écrit un JSON malformé — le `]` final a besoin d'un dernier enregistrement sans virgule ; `json.load` est impitoyable avec une virgule manquante.

### 1.2 Vérifie le registre

**✅ Liste de vérification**

- ✅ `load_devices()` retourne quatre dicts triés par `id` croissant.
- ✅ Chaque appareil a les six clés (`id`, `name`, `room`, `model`, `firmware`, `last_seen`).
- ✅ Relancer la démo affiche une sortie identique — le JSON préserve la disposition, le tri la rend stable.

**🤔 Question(s) socratique(s)**

- Le registre n'a aucun champ `status` nulle part — la santé sera *calculée* depuis `last_seen` à l'Étape 2. Pourquoi stocker « online » dans le JSON est une pire idée que de toujours la recalculer depuis le battement de cœur ?
- Les IDs sont lisibles par un humain (`th-01`) plutôt qu'aléatoires. Quand un id lisible par un humain est-il un pied de biche (`th-10` se trie *avant* `th-2` lexicalement — vois `sorted` sans clé) ? Quelle propriété du tri de chaînes rend les ids nécessiteux de remplissage ?

## Étape 2 : Juger la santé depuis les battements de cœur

Le renseignement de flotte le plus utile est « depuis combien de temps chaque appareil a-t-il parlé en dernier ». L'arithmétique `datetime` transforme une chaîne `last_seen` en un âge, et un verdict de santé est alors une petite décision de seuil : des moments → en ligne, sous quelques heures → avertissement, plus d'une demi-journée → hors ligne. Même ensemble de règles, chaque appareil, aucun champ à désynchroniser.

### 2.1 Écris `health.py`

**👟 Indice de départ :** Analyse `last_seen` avec `datetime.fromisoformat`, soustrais d'un « maintenant » de référence fixe, et classifie le `timedelta` résultant avec une chaîne de comparaisons :

```python
# health.py
from datetime import datetime, timedelta

from registry import load_devices

NOW = datetime.fromisoformat("2026-09-06T09:05:00")

def age_of(device: dict, now: datetime = NOW) -> timedelta:
    return now - datetime.fromisoformat(device["last_seen"])

def health_status(age: timedelta) -> str:
    if age > timedelta(hours=12):
        return "offline"
    if age > timedelta(minutes=30):
        return "warning"
    return "online"

if __name__ == "__main__":
    for d in load_devices():
        age = age_of(d)
        print(f"{d['id']:<8} {health_status(age):<8} age {age}")
```

`NOW` est l'astuce honnête pour un système sans piles : le vrai code de battement de cœur compare contre `datetime.now()`, ce qui casse la reproductibilité des tests et des captures d'écran. Ici `NOW` est un instant fixe, passé en défaut, donc la sortie de la démo est stable *et* un appelant peut l'écraser avec l'horloge vivante. Regarde ce que les frontières signifient pour un humain : hors ligne n'est pas « appareil éteint » — c'est littéralement « rien entendu de cette chose depuis douze heures », ce qui est le verdict pour lequel tu appelles quelqu'un.

**🎯 Résultat attendu :**

```
cam-01   offline  age 6 days, 10:55:00
th-01    warning  age 0:50:00
th-02    online   age 0:05:00
th-03    warning  age 2:25:00
```

**🩹 Si ça ne marche pas :** Si chaque âge lit `0:00:00`, tu as passé `datetime.now()` quelque part *après* la construction du défaut — supprime l'argument et laisse `NOW` être utilisé. Si les horodatages lèvent `ValueError`, la chaîne ISO contient un suffixe `Z` (marqueur UTC) que `fromisoformat` de cette version de Python n'acceptera pas — remplace `Z` par `+00:00` avant l'analyse, et traite cela comme un piège de forme de données du monde réel auquel tu viens d'échapper.

### 2.2 Vérifie la vérification de santé

**✅ Liste de vérification**

- ✅ `cam-01` (6 jours 10 h) → hors ligne ; `th-03` (2 h 25 m) → avertissement ; `th-02` (5 m) → en ligne.
- ✅ La frontière de 30 minutes est « avertissement à plus de 30 minutes », pas « en ligne jusqu'à 31 » — un *âge de exactement* 30:00 est `online`.
- ✅ `health_status` n'a besoin d'aucun dict d'appareil — elle ne prend que le `timedelta`, donc deux appareils avec le même âge obtiennent le même verdict.

**🤔 Question(s) socratique(s)**

- Les seuils d'entiers (30 minutes, 12 heures) codent en dur une politique de triage. Que changerait dans `health_status` si tu veux « les congélateurs médicaux appellent à 10 minutes de silence mais les caméras appellent à 2 jours » — et la signature de la fonction dit-elle quelque chose sur à qui appartient ce choix ?
- `cam-01` est « hors ligne » à 6 jours. Si le registre *avait* un champ stocké `status: "offline"` (l'anti-motif de l'Étape 1), qu'est-ce qui arrive en premier le moment où un moniteur re-remplit un battement de cœur mais personne ne re-bascule le champ stocké ?

## Étape 3 : Détecter la dérive de firmware

« Périmé » est une comparaison : la chaîne de firmware de chaque appareil contre la version la plus récente publiée pour *son* modèle. Les chaînes de version ne sont pas des nombres, donc tu les compares proprement en coupant sur les points et en comparant des tuples d'entiers — `(1, 2, 0) < (1, 3, 0)` vaut `True` dans chaque type de Python qui compte, et `"1.2.0" < "1.3.0"` fonctionne aussi par coïncidence, mais seulement jusqu'à ce que *2.0.0* soit à côté de *11.0.0*.

### 3.1 Écris `firmware.py`

**👟 Indice de départ :** Une carte `LATEST` par modèle, un découpeur `version_tuple`, et un prédicat `needs_update` qui les compose :

```python
# firmware.py
from registry import load_devices

LATEST = {"temp-hum": "1.3.0", "cam-1080": "2.0.5"}

def version_tuple(version: str) -> tuple[int, ...]:
    return tuple(int(part) for part in version.split("."))

def needs_update(device: dict) -> bool:
    target = LATEST[device["model"]]
    return version_tuple(device["firmware"]) < version_tuple(target)

if __name__ == "__main__":
    for d in load_devices():
        target = LATEST[d["model"]]
        flag = f"-> update to {target}" if needs_update(d) else "up to date"
        print(f"{d['id']:<8} {d['model']:<10} {d['firmware']:<8} {flag}")
```

Trois appareils sur quatre sont sur l'ancienne release de `temp-hum` et un est à jour — bonne démo, car l'appareil à jour prouve que la comparaison ne marque pas juste tout. Le prédicat `needs_update` est sans état : pas de file de mise à jour à transporter, pas de « dernière exécution de mise à jour » à stocker, juste *appareil → booléen* selon la carte `LATEST`. Note ce que cette étape ne fait délibérément pas : elle rapporte ce qui *mettrait* à jour — pousser réellement les versions sur le fil est du territoire OTA firmware, et tu fakeras l'accusé de réception dans le rapport.

**🎯 Résultat attendu :**

```
cam-01   cam-1080   2.0.5    up to date
th-01    temp-hum   1.2.0    -> update to 1.3.0
th-02    temp-hum   1.2.0    -> update to 1.3.0
th-03    temp-hum   1.1.9    -> update to 1.3.0
```

**🩹 Si ça ne marche pas :** Si *chaque* appareil rapporte `up to date`, `version_tuple` coupe probablement sur autre chose (« `1.2.0rc1` » coupe en quatre morceaux, mais la démo utilise des versions en trois parties) — vérifie que la conversion int ne s'étrangle pas sur un marqueur de pré-release. Si un modèle inconnu lève `KeyError`, c'est la *bonne* réaction (une flotte avec des infos de firmware manquantes est un problème de données, pas un toléré) — mais tu peux toujours préférer `LATEST.get(model)` retournant `None` pour les appareils que tu ne suis pas vraiment.

### 3.2 Vérifie la dérive de firmware

**✅ Liste de vérification**

- ✅ `version_tuple("1.2.0") == (1, 2, 0)` et `(1, 2, 0) < (1, 3, 0)` — des tuples d'entiers, donc `2.10` bat `2.9` numériquement.
- ✅ `cam-01` rapporte à jour (son 2.0.5 égale la cible de la carte) ; trois appareils `temp-hum` planifient une mise à jour vers 1.3.0.
- ✅ La démo opère sur le registre `load_devices()` trié, donc les lignes s'affichent toujours dans l'ordre de l'Étape 1.

**🤔 Question(s) socratique(s)**

- `LATEST` est un dict codé en dur dans la source. En production, il viendrait de l'API du vendeur ou d'un manifeste. Quel *contrat* `needs_update` (appareil, dict seulement) satisfait-il déjà qu'un flux de versions ne fait que brancher — c'est-à-dire, à quelle forme l'endpoint du vendeur devrait-il correspondre pour que rien d'autre dans le code ne change ?
- `th-03` est sur 1.1.9 pendant que ses frères sont sur 1.2.0 — même modèle, release plus ancienne. Quelles causes de « dérive de firmware de flotte » (en dehors de la paresse) un rapport qui montre *modèle+release* par ligne aide un partie prenante à réellement voir ?

## Étape 4 : Résoudre la configuration effective

La config est *stratifiée* : chaque `temp-hum` définit à 28 °C par défaut, mais celui du garage devrait alerter à −5 °C. Le motif est défauts → défauts de modèle → écrasements de pièce → écrasements par appareil (le dernier gagne), et le mot correct pour la sortie est la config *effective* — le seul dict qu'un appareil exécute réellement, après que toutes les couches se replient.

### 4.1 Écris le résolveur

**👟 Indice de départ :** Copie les défauts de modèle, puis `.update()`-les avec les écrasements au niveau pièce (et laisse de la place pour un passage au niveau appareil plus tard) :

```python
# config.py
from registry import load_devices

DEFAULTS = {
    "temp-hum": {"poll_rate_s": 60, "alert_threshold_c": 28, "units": "c"},
    "cam-1080": {"recording": False, "motion": True, "retention_days": 7},
}
ROOM_OVERRIDES = {"garage": {"alert_threshold_c": -5}, "entry": {"recording": True}}

def resolve_config(device: dict) -> dict:
    config = dict(DEFAULTS[device["model"]])
    config.update(ROOM_OVERRIDES.get(device["room"], {}))
    return config

if __name__ == "__main__":
    for d in load_devices():
        print(f"{d['id']:<8} {resolve_config(d)}")
```

`dict(DEFAULTS[...])` *copie* les défauts de modèle partagés avant `.update()` — cette copie est la différence entre « le garage reçoit −5 pendant que le salon reste à 28 » et « chaque `temp-hum` hérite silencieusement de −5 parce qu'ils partagent tous un dict en mémoire ». Déposer cela comme un pipeline (défauts → écrasements) plutôt que d'écrire un dict `winter` et un dict `summer` garde chaque appareil sur une vérité *dérivée* : quand tu changes les unités en `f`, une couche de base les met à jour à l'échelle de la flotte.

**🎯 Résultat attendu :**

```
cam-01   {'recording': True, 'motion': True, 'retention_days': 7}
th-01    {'poll_rate_s': 60, 'alert_threshold_c': 28, 'units': 'c'}
th-02    {'poll_rate_s': 60, 'alert_threshold_c': 28, 'units': 'c'}
th-03    {'poll_rate_s': 60, 'alert_threshold_c': -5, 'units': 'c'}
```

**🩹 Si ça ne marche pas :** Si th-01 montre aussi `-5`, `resolve_config` mute `DEFAULTS[model]` en place (le `.update` se passe sur le dict partagé, pas la copie). Si la caméra d'entrée a perdu `recording`, une branche `else` remplace toute la config au lieu de la fusionner — la garde `ROOM_OVERRIDES.get(device["room"], {})` devrait être une *fusion vide*, jamais un remplacement.

### 4.2 Vérifie la résolution de config

**✅ Liste de vérification**

- ✅ `th-03` a `alert_threshold_c: -5` ; `th-01` et `th-02` gardent le défaut 28 — l'écrasement du garage a touché un appareil.
- ✅ `cam-01` bascule `recording` du défaut `False` à `True` ; chaque autre clé de `cam-1080` est inchangée.
- ✅ Le dict de défauts lui-même est intact après l'exécution (chaque appel a reçu une copie).

**🤔 Question(s) socratique(s)**

- Les écrasements de pièce ressemblent à une *politique* : « le garage gèle ». Si le même type d'appareil est utilisé par deux locataires avec des besoins différents, tes couches auraient besoin d'une étape par locataire. Où dans ce pipeline appartient le par-locataire (avant ou après la couche pièce), et comment une fonction de fusion l'ordonnerait sans contredire l'écrasement de pièce ?
- Le dict résolu a un `alert_threshold_c` qu'un appareil pourrait ne pas honorer (firmware défectueux). Quelle est la différence entre la config *désirée* et la config *appliquée* — et laquelle de ces deux est cette fonction réellement responsable de fournir ?

## Étape 5 : Rapport de flotte et CLI

Les quatre capacités sont des fonctions ; le livrable est l'écran unique qui montre tout : groupé par pièce, une ligne par appareil avec sa santé, et une ligne de résumé. Puis le même rapport reçoit une CLI à un drapeau pour que « que fait la flotte ? » devienne une commande au lieu de cinq exécutions `__main__`.

### 5.1 Écris `report.py` et `manage.py`

**👟 Indice de départ :** Réutilise `age_of`/`health_status` de l'Étape 2, groupe par pièce avec un ensemble de pièces trié, compte les statuts avec `collections.Counter`, et laisse `manage.py --report` afficher tout :

```python
# report.py
from collections import Counter

from health import NOW, age_of, health_status
from registry import load_devices

def fleet_report(devices: list[dict] | None = None, now=NOW) -> str:
    if devices is None:
        devices = load_devices()
    lines = [f"Fleet report — {len(devices)} devices"]
    statuses = Counter()
    for room in sorted({d["room"] for d in devices}):
        lines.append(f"== {room}")
        for d in devices:
            if d["room"] != room:
                continue
            status = health_status(age_of(d, now))
            statuses[status] += 1
            lines.append(f"  {d['id']:<8} {d['name']:<22} {status}")
    counts = ", ".join(f"{n} {s}" for s, n in sorted(statuses.items()))
    lines.append(f"summary: {counts}")
    return "\n".join(lines)
```

```python
# manage.py
import argparse

from report import fleet_report

def main() -> None:
    parser = argparse.ArgumentParser(description="Manage a fleet of devices.")
    parser.add_argument("--report", action="store_true")
    args = parser.parse_args()
    if args.report:
        print(fleet_report())
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
```

```bash
uv run python manage.py --report
```

Le rapport est du *par composition plutôt que par branchement* : il orchestre seulement des fonctions que tu as déjà construites (`health_status`, `age_of`, `load_devices`), c'est pourquoi il fait ~12 lignes. `Counter()` avec une clé chaîne est le moment-un-seul-nouveau-truc — `statuses["offline"] += 1` démarre magiquement à 0 au lieu de lever, ce qui est la chose commode que `dict` ne fait pas. Le drapeau `action="store_true"` garde la CLI à un verbe (`--report`), ce qui est exactement assez pour ce projet et un plafond très délibéré — les vrais gestionnaires d'appareils grandissent vers `--update`, `--push-config`, `--add-device`, et ton architecture a déjà les fonctions qu'ils appelleraient.

**🎯 Résultat attendu :**

```
Fleet report — 4 devices
== entry
  cam-01   Front Door Camera      offline
== garage
  th-03    Garage Sensor          warning
== kitchen
  th-02    Kitchen Sensor         online
== living
  th-01    Living Room Sensor     warning
summary: 1 offline, 1 online, 2 warning
```

**🩹 Si ça ne marche pas :** Si le résumé dit `0 offline`, le `Counter` est incrémenté sur un *booléen brut* (`statuses[is_offline]`) au lieu de la chaîne de statut. Si `--report` affiche l'aide d'argparse au lieu de la flotte, la branche `if args.report:` vérifie autre chose — confirme qu'elle lit `args.report`, l'attribut `store_true`.

### 5.2 Vérifie le rapport de flotte

**✅ Liste de vérification**

- ✅ Les pièces apparaissent alphabétiquement ; les appareils dans une pièce gardent l'ordre de `load_devices()` (tri d'id).
- ✅ Les comptes du résumé somment à 4 et correspondent aux lignes par appareil (1 hors ligne / 1 en ligne / 2 avertissement).
- ✅ `uv run python manage.py --report` affiche le rapport ; sans drapeau, il affiche l'usage.

**🤔 Question(s) socratique(s)**

- Le résumé est `sorted(statuses.items())` — un tri *alphabétique* des noms de statut. Si tu préfères résumer « 1 offline, 2 warning, 1 online » dans l'ordre de gravité, quel argument à `sorted` (avec un minuscule helper) corrige cela, et l'ordre de gravité vaut-il les deux lignes supplémentaires ?
- `fleet_report` a des paramètres `devices` et `now` avec des défauts. Qui (un humain, un cron, un test) l'appelle avec un `now` *différent*, et que ce paramètre dit-il sur la partie du rapport qui est un instantané plutôt qu'une vérité vivante ?

## ⚠️ Pièges courants

- **Stocker le statut au lieu de le calculer.** Un champ sauvegardé `"online"` devient périmé le moment où un battement de cœur arrive ou meurt. Dérive la santé depuis `last_seen` ; ne fais jamais confiance à un verdict persisté.
- **Trier par chaîne quand un nombre se cache derrière une chaîne.** `cam-2` se trie *après* `cam-10` lexicalement. Si les IDs vont au-delà de 9, rembourre (`cam-02`) ou trie avec une clé int — le registre `sorted(... by id)` se ré-ordonnera silencieusement sur toi exactement au mauvais moment.
- **Surprises de forme de fuseau horaire.** `2026-09-06T08:15:00Z` (un `Z` final) fait crasher `fromisoformat` sur la plupart des Pythons. Gère la normalisation `Z → +00:00` exactement une fois, dans `age_of`, pas à chaque site d'appel.
- **Muter le dict de défauts partagé.** `DEFAULTS[model].update(...)` sans copie fait hériter chaque appareil du premier écrasement. `dict(DEFAULTS[model])` d'abord, *puis* update.
- **Les comparaisons de versions faites comme des chaînes.** `"2.10.0" < "2.9.0"` est `True` lexicalement et absurde sémantiquement. Tuple-ise les versions avant de comparer — une fois, en un seul endroit, partout.

## Ce que tu viens de construire

Un gestionnaire d'appareils à quatre couches : registre (JSON trié), santé (calculée depuis l'âge du battement de cœur), détection de dérive de firmware, et résolution de config stratifiée — tout composé en un seul `manage.py --report`. Le motif à emporter est *dérive, ne stocke pas* : santé, besoin-de-mise-à-jour, et config effective sont toutes des fonctions du registre, donc le registre ne ment jamais sur ce qui est actuel, et chaque nouveau rapport ou commande que tu ajoutes est un consommateur de plus de la même source honnête, triée et versionnée.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/device-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/device-manager) dans le dépôt du cours contient les scripts complets plus un `devices.json` de départ. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute une couche d'écrasement au niveau appareil (`PER_DEVICE`) qui gagne sur la couche pièce — la règle « un quart de tes pièces gèle », sans toucher aux défauts de pièce.
- Émets un **instantané JSON** du rapport de flotte (`manage.py --report --json`) — une vue lisible par machine des mêmes lettres qu'un humain lit.
- Suis **l'historique des changements de config** : `resolve_config` gagne un `when` et un `who`, et le rapport gagne un drapeau `--changes` montrant les N dernières actions.
- Simule **les accusés de réception OTA** : `needs_update` retourne une cible mais rien ne stocke un ack — ajoute `ack_at` au registre, et le rapport de flotte marque les appareils « mise à jour en attente ».

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓