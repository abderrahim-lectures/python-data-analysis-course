---
title: "Tableau de Bord Support Client"
description: "Gérez les tickets de support avec routage, suivi SLA, réponses prédéfinies et métriques de satisfaction."
difficulty: "beginner"
estimatedMinutes: 55
tags: ["cli", "csv", "dataclasses", "stdlib"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions, dictionnaires)"
learningObjectives:
  - "Modéliser les tickets comme des dataclasses et ordonner une file d'attente par priorité"
  - "Router les tickets vers les agents par correspondance de compétences et charge de travail"
  - "Suivre les délais de réponse et de résolution contre les limites SLA des logs CSV"
  - "Calculer les scores CSAT par agent à partir des données d'enquête"
  - "Afficher un rapport de synthèse du support combiné"
---

# 🎧 Construire un Tableau de Bord Support Client

La réalité d'une équipe de support arrive comme un flux d'événements *non ordonnés*, une plainte de facturation affolée, une demande assoupie « comment je réinitialise mon mot de passe », un souhait de fonctionnalité, et tout l'art de l'outillage de support consiste à imposer de l'ordre à ce flux : quel ticket reçoit un agent en premier, quel agent est même *capable* de le traiter, si l'équipe répond dans les limites de sa promesse de délai, et si les clients sont réellement satisfaits. Ce projet construit le moteur derrière un tableau de bord de support, une file de priorité pour les tickets, un routage basé sur la compétence et la charge, une détection de rupture SLA mesurée en heures depuis un vrai fichier de log, et un résumé CSAT, le tout rendu dans un seul rapport terminal.

Ceci suppose Python 101, fonctions, dictionnaires, listes et l'import du module standard `csv`. Rien de l'Analyse de Données n'est nécessaire. C'est facultatif et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Modéliser les tickets comme des dataclasses avec une énumération de priorité et retirer la plus haute priorité d'une file d'attente.
2. Router chaque ticket vers l'agent libre dont les compétences correspondent à son sujet, en retombant sur le moins occupé.
3. Mesurer les délais de réponse et de résolution depuis un log CSV et signaler chaque rupture SLA.
4. Calculer les moyennes CSAT par agent depuis un CSV d'enquêtes.
5. Afficher un rapport combiné : ruptures + satisfaction des agents en une seule lecture.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé, ce projet lit de vrais fichiers CSV depuis le disque, et le tout est en bibliothèque standard, donc la configuration est une seule commande.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal de navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent bien pour la logique de file et de routage, le notebook dans [`examples/customer-support/notebook.fr.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.fr.ipynb) exécute chaque fonction sur des CSV d'exemple fournis. La limite honnête : les CSV du notebook sont des échantillons fixes, alors que la version locale te permet d'y donner *tes* logs de support.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcustomer-support%2Fnotebook.fr.ipynb)

## Configuration

`uv` est un outil unique qui remplace toute la chaîne « install Python, puis pip, puis un outil d'environnement virtuel », et ce projet n'a aucun import tiers, donc la configuration est vraiment en une étape.

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
uv init customer-support
cd customer-support
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `customer-support/` existe avec un `pyproject.toml`.
- ✅ `python -c "import csv"` réussit, aucun paquet tiers nécessaire.

## Étape 1 : Modéliser les tickets et construire une file de priorité

Une file qui sert les tickets dans l'ordre d'*arrivée* serait une bonne file mais une mauvaise file de support : un problème de facturation urgent attendrait derrière trois demandes de fonctionnalité. La correction est un ordre de priorité, urgent par-dessus élevé par-dessus moyen par-dessus bas, avec *l'ordre d'arrivée au sein de la même priorité*, ce qui est exactement ce que donne un tri par une valeur `Priority` inversée.

### 1.1 Écris le modèle de ticket et la file

**👟 Indice de départ :** Définis une énumération `Priority` (un `IntEnum`, pour qu'elle se trie numériquement), une dataclass `Ticket`, et une `SupportQueue` qui ajoute sur `add` et retire la plus haute `priority` sur `next` :

```python
# tickets.py
from dataclasses import dataclass
from enum import IntEnum

class Priority(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4

@dataclass
class Ticket:
    ticket_id: int
    customer: str
    subject: str
    priority: Priority
    assigned_to: str | None = None

class SupportQueue:
    def __init__(self) -> None:
        self._items: list[Ticket] = []

    def add(self, ticket: Ticket) -> None:
        self._items.append(ticket)

    def next(self) -> Ticket | None:
        if not self._items:
            return None
        self._items.sort(key=lambda t: t.priority, reverse=True)
        return self._items.pop(0)

    def __len__(self) -> int:
        return len(self._items)

if __name__ == "__main__":
    queue = SupportQueue()
    queue.add(Ticket(1, "Ana", "Can't log in", Priority.MEDIUM))
    queue.add(Ticket(2, "Bo", "Billing charge", Priority.URGENT))
    queue.add(Ticket(3, "Cam", "Feature idea", Priority.LOW))
    while (ticket := queue.next()) is not None:
        print(f"#{ticket.ticket_id} {ticket.priority.name}: {ticket.subject}")
```

`IntEnum` gagne son pain ici : `Priority.URGENT > Priority.LOW` fonctionne *parce que* c'est un entier sous le capot, donc `sort(key=lambda t: t.priority, reverse=True)` ordonne toute la liste avec une seule expression, aucun comparateur personnalisé nécessaire. Le `pop(0)` à l'intérieur de `next` retire délibérément le ticket servi, donc une boucle de tableau de bord « continue de servir » jusqu'à épuisement : le motif `while (ticket := queue.next()) is not None` est la sentinelle qui arrête la boucle quand la file retourne enfin `None`.

**🎯 Résultat attendu :**

```
#2 URGENT: Billing charge
#1 MEDIUM: Can't log in
#3 LOW: Feature idea
```

**🩹 Si ça ne marche pas :** Si LOW sort en premier, le `reverse=True` manque, sans lui, le plus petit nombre se trie d'abord. Si les tickets disparaissent entre les exécutions, souviens-toi que `next()` est *destructif* : il retire le ticket, donc une file vide n'affiche rien la deuxième fois que tu boucles.

### 1.2 Vérifie

**✅ Liste de vérification**

- ✅ Servir la file d'exemple produit `#2`, puis `#1`, puis `#3`, dans cet ordre.
- ✅ `len(queue)` diminue d'exactement un après chaque appel `next()`.
- ✅ Le `next()` d'une file vide retourne `None` au lieu de lever `IndexError`.

**🤔 Question(s) socratique(s)**

- Deux tickets partagent `Priority.URGENT`. Le code actuel trie par priorité et retire `index 0`, cela garantit-il l'*ordre d'arrivée* entre eux, ou quelque chose d'autre réécrit-il les positions ? Lis la paire tri+pop et décide.
- La file stocke les tickets dans une liste simple et trie à *chaque* pop. Pour un petit bureau de support c'est bien, mais quelle opération deviendrait le goulot d'étranglement à 10 000 tickets en file, et quelle structure de données existe précisément pour « retirer le max » sans re-trier ?

## Étape 2 : Router les tickets vers le bon agent

Le tri répond à « quel ticket d'abord ? » ; le routage répond « quel *agent* ? » L'ensemble de contraintes réel : l'agent doit être libre (sous une charge maximale) et idéalement *compétent* pour ce ticket. L'heuristique pragmatique est la correspondance de texte, compte combien de compétences d'un agent apparaissent dans le sujet du ticket et route vers l'agent libre qui correspond le mieux.

### 2.1 Écris `Agent` et la fonction `assign`

**👟 Indice de départ :** Une dataclass `Agent` avec une liste de compétences et un compteur de charge vivant, puis `assign` qui filtre vers les agents libres, les score par chevauchement de compétences avec le sujet, et retourne la meilleure correspondance :

```python
# routing.py
from dataclasses import dataclass, field

from tickets import Ticket

@dataclass
class Agent:
    name: str
    skills: list[str] = field(default_factory=list)
    active_tickets: int = 0
    max_work: int = 3

    def is_free(self) -> bool:
        return self.active_tickets < self.max_work

def assign(ticket: Ticket, agents: list[Agent]) -> Agent | None:
    """Route to the best free skill match; returns None only if every
    agent is at max_work."""
    needle = ticket.subject.lower()

    def skill_score(agent: Agent) -> int:
        return sum(1 for skill in agent.skills if skill.lower() in needle)

    free = [a for a in agents if a.is_free()]
    if not free:
        return None
    best = max(free, key=skill_score)
    best.active_tickets += 1
    return best

if __name__ == "__main__":
    agents = [
        Agent("Priya", skills=["billing", "refund"]),
        Agent("Tom", skills=["login", "password"]),
        Agent("Una", skills=["feature"]),
    ]
    subjects = ["Billing charge gone wrong", "Can't log in",
                "New feature idea", "Refund request"]
    for subject in subjects:
        ticket = Ticket(hash(subject) % 1000, "customer", subject, 2)
        agent = assign(ticket, agents)
        print(f"-> {subject!r}: {agent.name if agent else 'no free agent'}")
```

Deux décisions se cachent dans douze lignes. `skill_score` compte les *chevauchements* plutôt que d'exiger une correspondance de balise exacte, donc un sujet comme « Billing charge gone wrong » score 1 pour la compétence `billing` même si les mots diffèrent, un comparateur délibérément indulgent pour une démo, à revoir dès que les fausses correspondances comptent. `active_tickets` est incrémenté quand un ticket est assigné, donc la décision occupé/libre reflète la *charge acceptée*, et `max(free, key=skill_score)` choisit la meilleure correspondance purement déclarativement, les égalités retombant sur le premier agent libre de la liste.

**🎯 Résultat attendu :**

```
-> 'Billing charge gone wrong': Priya
-> 'Can't log in': Tom
-> 'New feature idea': Una
-> 'Refund request': Priya
```

**🩹 Si ça ne marche pas :** Si *chaque* ticket route vers Priya, `max(free, key=skill_score)` choisit la plus haute somme, vérifie que `score` utilise `in needle`, pas `== needle`. Si un ticket route vers un agent déjà à `max_work`, le filtre `is_free()` n'est pas dans la compréhension de liste, un agent occupé n'est même jamais un candidat.

### 2.2 Vérifie

**✅ Liste de vérification**

- ✅ Les quatre sujets d'exemple routent vers l'agent à compétences correspondantes.
- ✅ Mettre `active_tickets` de chaque agent à `max_work` fait retourner `None` à `assign`, le cas « tous occupés » dégrade en file d'attente, pas en crash.
- ✅ Après l'assignation d'un ticket, `active_tickets` de cet agent a augmenté d'exactement un.

**🤔 Question(s) socratique(s)**

- Le comparateur de compétences compte les coupures de sous-chaîne. Quel sujet réel scorerait un *faux positif* pour une compétence (indice : « password reset » contenant « pass »), et combien une stratégie de correspondance plus exacte te coûterait-elle en effort ?
- `active_tickets` s'incrémente à l'assignation et n'est jamais décrémenté dans ce projet. Quel comportement casse si tu ne libères jamais les agents, et où, dans un vrai système de support, cette décrémentation aurait-elle lieu ?

## Étape 3 : Suivre la conformité SLA dans le temps

Les SLA sont des promesses avec des maths d'horloge attachées : répondre sous 4 heures, résoudre sous 24. La matière première est un *log*, pour chaque ticket, quand il s'est ouvert, quand quelqu'un a répondu en premier, quand il s'est résolu. Cette étape transforme le texte CSV en différences d'heures et compare chacune à la promesse.

### 3.1 Charge le log et mesure les ruptures

**👟 Indice de départ :** Écris un `support_log.csv` d'exemple avec une ligne par ticket, charge-le avec `csv.DictReader`, convertis les horodatages façon-ISO en flottants d'heures avec un petit helper, et compare les heures `response`/`resolution` aux seuils :

```python
# sla.py
import csv
from datetime import datetime

LOG = """ticket_id,opened_at,responded_at,resolved_at
1,2026-09-01 09:00,2026-09-01 09:30,2026-09-01 10:00
2,2026-09-01 09:00,,2026-09-01 09:15
3,2026-09-01 09:00,2026-09-01 20:00,
4,2026-09-01 09:00,2026-09-01 09:05,2026-09-02 11:00
"""

def load_activity(path: str = "support_log.csv") -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

def hours(ts: str, fmt: str = "%Y-%m-%d %H:%M") -> float | None:
    """Parse a timestamp to hours-since-epoch; None for an empty cell."""
    if not ts.strip():
        return None
    return datetime.strptime(ts, fmt).timestamp() / 3600

def sla_report(log: list[dict], response_sla: int = 4, resolution_sla: int = 24) -> list[str]:
    breaches = []
    for row in log:
        opened = hours(row["opened_at"])
        responded = hours(row["responded_at"])
        resolved = hours(row["resolved_at"])
        if opened is not None and responded is not None and (responded - opened) > response_sla:
            breaches.append(
                f"ticket {row['ticket_id']}: response {(responded - opened):.1f}h > {response_sla}h SLA"
            )
        if opened is not None and resolved is not None and (resolved - opened) > resolution_sla:
            breaches.append(
                f"ticket {row['ticket_id']}: resolution {(resolved - opened):.1f}h > {resolution_sla}h SLA"
            )
    return breaches

if __name__ == "__main__":
    with open("support_log.csv", "w") as f:
        f.write(LOG)
    for breach in sla_report(load_activity()):
        print(breach)
```

La politique de cellule vide est l'appel de correction subtil : `hours("")` retourne `None`, et chaque comparaison se garde avec `is not None`, un ticket non résolu est `None`, *pas* zéro, ce qui signifie que tu ne signales jamais une fausse rupture « instantanée » pour un ticket que personne n'a jamais touché. Le format `.1f` est cosmétique mais significatif : quelqu'un qui lit « 11.0h » voit instantanément « plus de 4h », alors qu'un flottant brut comme `11.000000000000002` invite à une seconde vérification inutile.

**🎯 Résultat attendu :**

```
ticket 3: response 11.0h > 4h SLA
ticket 4: resolution 26.0h > 24h SLA
```

**🩹 Si ça ne marche pas :** Si *chaque* ticket signale une rupture avec des valeurs d'heures absurdes, `hours` a probablement mal analysé le format et `strptime` est silencieusement... non, un décalage de format lève `ValueError`. Si rien ne rompt même pour le ticket 3, vérifie que `LOG` contient bien le `responded_at` de `2026-09-01 20:00` du ticket 3, et que le fichier a été réécrit avant que `load_activity` ne le lise.

### 3.2 Vérifie

**✅ Liste de vérification**

- ✅ Exactement deux ruptures s'affichent : la réponse du ticket 3, la résolution du ticket 4.
- ✅ La cellule *vide* de réponse du ticket 2 ne produit aucune rupture de réponse, un ticket sans réponse n'est pas une violation instantanée.
- ✅ Conversion : `hours("2026-09-02 11:00") - hours("2026-09-01 09:00")` égale `26.0`.

**🤔 Question(s) socratique(s)**

- Un ticket sans réponse a `responded_at=""`, donc le temps de réponse est `None`, mais attends, un ticket sans réponse *rompt-il en ce moment* ou est-il simplement *non mesurable en ce moment* ? Qu'est-ce qui est le plus honnête, et que prétendrait à tort une implémentation qui traite le vide comme `0` ?
- `sla_report` code en dur les promesses comme des arguments par défaut. Que change l'utilité de la fonction si un SLA *par ticket* (la priorité URGENT obtient 1 heure, LOW obtient 24) remplace le seuil unique, et quelle couche devrait posséder cette correspondance ?

## Étape 4 : Calculer le CSAT depuis les enquêtes

Le débit ne dit rien sur les *ressentis* ; le CSAT (satisfaction client) si, typiquement une enquête post-ticket où un client note de 1 à 5. L'agrégation honnête fait la moyenne par agent pour que le rapport réponde à la fois à « comment allons-nous globalement » et « qui porte la note ».

### 4.1 Charge les enquêtes et résume par agent

**👟 Indice de départ :** Un `csat.csv` de lignes d'enquête `agent,rating`, chargé avec `csv.DictReader`, regroupé avec un `defaultdict(list)`, puis moyenné par agent :

```python
# csat.py
import csv
from collections import defaultdict

SURVEYS = """agent,rating
Priya,5
Tom,4
Priya,4
Una,3
Tom,5
Priya,5
"""

def load_surveys(path: str = "csat.csv") -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

def summarize(surveys: list[dict]) -> dict[str, float]:
    per_agent: dict[str, list[int]] = defaultdict(list)
    for row in surveys:
        per_agent[row["agent"]].append(int(row["rating"]))
    return {name: sum(vals) / len(vals) for name, vals in per_agent.items()}

if __name__ == "__main__":
    with open("csat.csv", "w") as f:
        f.write(SURVEYS)
    for agent, avg in summarize(load_surveys()).items():
        print(f"{agent}: {avg:.1f}/5")
```

`defaultdict(list)` supprime toute la cérémonie `if agent not in per_agent: per_agent[agent] = []` : ajouter à une clé qui n'existe pas crée automatiquement une liste. La compréhension d'une ligne au sortir transforme chaque liste en sa moyenne. Le transtypage `int(row["rating"])` est tout le pari « fais confiance au fichier », le CSV te donne des *chaînes*, et diviser une chaîne ferait planter une `sum` simple ; le transtypage déplace cet échec au point de chargement où il est lisible.

**🎯 Résultat attendu :**

```
Priya: 4.7/5
Tom: 4.5/5
Una: 3.0/5
```

**🩹 Si ça ne marche pas :** Si une `TypeError: unsupported operand type(s) for/: 'int' and 'str'` apparaît, une cellule de note manque le transtypage `int(...)`. Si la moyenne de Priya semble fausse, vérifie que *toutes les trois* de ses lignes d'enquête (5, 4, 5) sont entrées dans le CSV, une ligne manquante change silencieusement la moyenne.

### 4.2 Vérifie

**✅ Liste de vérification**

- ✅ `summarize(load_surveys())` retourne `{'Priya': 4.666..., 'Tom': 4.5, 'Una': 3.0}`.
- ✅ Un fichier d'enquêtes à une seule ligne fonctionne quand même (pas de division par zéro sur une entrée non vide).
- ✅ Chaque note est transtypée en `int` *avant* l'arithmétique, la chaîne `"5"` + `"4"` concaténerait, ne sommerait pas.

**🤔 Question(s) socratique(s)**

- Le CSAT agrège par *agent*. Quel autre regroupement un responsable de support voudrait-il (par file, par créneau, par zone produit), et combien de `summarize` doit changer par regroupement, ou veut-il déjà dire « grouper par n'importe quelle colonne » ?
- La moyenne récompense la constance et pénalise tout également. Que *cache* une moyenne de 3,5 sur une équipe de 30 agents où la moitié score 5 et l'autre moitié 2, et quel agrégat le montrerait ?

## Étape 5 : Le rapport combiné

Chaque métrique jusqu'ici vit dans son propre script. L'étape finale les compose dans l'artefact qu'une partie prenante lit réellement : un `report.py` qui fait ressortir les ruptures SLA et le CSAT des agents ensemble, car une équipe de support qui répond vite mais rend les clients furieux doit voir *les deux* nombres à la fois.

### 5.1 Compose le rapport

**👟 Indice de départ :** Réutilise chaque chargeur et agrégateur que tu as construits, `load_activity` → `sla_report`, `load_surveys` → `summarize`, et affiche les deux sections avec de simples en-têtes `===`, en triant les agents par CSAT pour que la liste se lise de haut en bas :

```python
# report.py
from csat import load_surveys, summarize
from sla import load_activity, sla_report

def build_report(log_csv: str = "support_log.csv", csat_csv: str = "csat.csv") -> None:
    print("=== SLA breaches ===")
    breaches = sla_report(load_activity(log_csv))
    print("\n".join(breaches) if breaches else "no breaches - all within SLA")

    print("\n=== CSAT by agent (best first) ===")
    for agent, avg in sorted(
        summarize(load_surveys(csat_csv)).items(),
        key=lambda pair: pair[1],
        reverse=True,
    ):
        print(f"  {agent}: {avg:.1f}/5")

if __name__ == "__main__":
    build_report()
```

Chaque ligne ici est de la réutilisation, le rapport ne contient *aucune nouvelle logique métier*, seulement de la présentation. C'est la conception qui vaut la peine d'être copiée : la couche composite reste sûre-par-fragilité en ne possédant que « appelle les fonctions existantes, ordonne la sortie ». `sorted(..., key=lambda pair: pair[1], reverse=True)` trie par la *moyenne*, l'index `[1]` de chaque paire `(agent, avg)`, ce qui garde l'affichage « le meilleur d'abord » sans toucher à la fonction CSAT.

**🎯 Résultat attendu :**

```
=== SLA breaches ===
ticket 3: response 11.0h > 4h SLA
ticket 4: resolution 26.0h > 24h SLA

=== CSAT by agent (best first) ===
  Priya: 4.7/5
  Tom: 4.5/5
  Una: 3.0/5
```

**🩹 Si ça ne marche pas :** Une `FileNotFoundError` signifie que le rapport ne trouve pas les CSV, exécute-le depuis le dossier où les Étapes 3–4 les ont écrits, ou passe les chemins (`build_report("logs/support_log.csv", ...)`). Si l'ordre des agents est alphabétique au lieu de meilleur-d'abord, le `reverse=True` manque dans le `sorted`.

### 5.2 Vérifie

**✅ Liste de vérification**

- ✅ `uv run python report.py` affiche les deux sections exactement dans l'ordre ci-dessus.
- ✅ Retirer l'argument de fichier de l'appel `sla_report` et passer un chemin de log vide montre `no breaches`.
- ✅ `report.py` ne contient aucun code dupliqué de lecture CSV ou d'agrégation, il l'importe.

**🤔 Question(s) socratique(s)**

- Le rapport ordonne les agents meilleur-d'abord, mais un responsable qui trie ainsi pourrait récompenser le nom en haut sans demander *pourquoi* Una a 3.0, quel est l'argument pour que le rapport imprime aussi le volume (nombre d'enquêtes) à côté de la moyenne, et qu'apparaît-il quand tu le fais ?
- `build_report` enchaîne deux analyses indépendantes avec `print`. Où est la pression pour faire évoluer cela vers la production d'un *fichier* (JSON/HTML) au lieu d'un texte terminal, et qu'est-ce qui reste pareil si cela arrive ?

## ⚠️ Pièges courants

- **Retirer le mauvais bout de la file.** `pop(0)` après un tri décroissant est correct ; `pop()` (dernier élément) après un tri *croissant* sert le bout opposé. Un mot inversé fait basculer silencieusement le triage à l'envers.
- **Laisser les agents occupés dans le pool de candidats.** Le filtre `is_free()` du routage n'est pas un indice, le retirer route des tickets vers des agents surchargés et tout le système de charge ment. Garde le filtre à l'intérieur de `assign`.
- **Traiter les cellules vides comme zéro.** `hours("")` doit signifier « non mesuré », jamais `0`. Sommer un ticket sans réponse comme instantanément résolu fabrique de fausses données SLA. Les gardes `is not None` sont le contrat.
- **Oublier que le CSV donne des chaînes.** `row["rating"]` est `"5"`, pas `5`. La division et la comparaison cassent jusqu'à ce que tu transtypes ; transtype au chargement pour qu'un échec soit lisible.
- **Mélanger les *formats* de date.** `%Y-%m-%d %H:%M` et `%Y/%m/%d` sont des horodatages valides et mutuellement non analysables. Normalise un seul format dans le log avant qu'aucun `strptime` ne tourne.

## Ce que tu viens de construire

Un vrai moteur de tableau de bord de support : des tickets modélisés comme des données, une file de priorités qui trie *et* sert, un routage conscient de la compétence et de la charge, des maths SLA mesurées en heures depuis un vrai log CSV, un CSAT par agent, et un rapport composite, tout en bibliothèque standard, tout exécutable depuis un terminal. La compétence transférable est de mesurer un service contre des promesses : toute opération avec des lignes de temps (livraisons, déploiements, réponses) peut se modéliser comme « enregistrer des horodatages, calculer des écarts, comparer à un seuil, faire ressortir les ruptures ».

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/customer-support/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/customer-support) dans le dépôt du cours contient ces scripts complets plus des CSV d'exemple. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute **l'équilibrage de charge au routage** : parmi les scores à égalité, préfère l'agent avec le moins de `active_tickets`, une ligne de plus dans la fonction clé de `max(...)`.
- Persiste la file entre les exécutions en vidant `SupportQueue` en JSON à la sortie et en le rechargeant au démarrage, les tickets sont déjà des dataclasses sérialisables.
- Émets le rapport comme un **fichier HTML statique** qu'une équipe pourrait ouvrir dans un navigateur, en utilisant un template f-string enveloppé autour des mêmes données `SLA breaches`/`CSAT`.
- Ajoute des SLA par priorité (URGENT 1h, HIGH 4h, MEDIUM 8h, LOW 24h) en passant le `Priority` du ticket à travers `sla_report`, la réponse honnête à la question socratique de l'Étape 3.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓