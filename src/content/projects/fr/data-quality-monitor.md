---
title: "Moniteur de Qualité des Données"
description: "Transforme les règles de qualité des données en vérifications, scores, et une alerte de dérive qui compare les instantanés dans le temps."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "csv", "dataclasses", "reporting"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions, dictionnaires)"
  - "Les dataclasses et la lecture de CSV avec le module csv"
learningObjectives:
  - "Modéliser les règles de qualité comme des données avec une dataclass Rule et un fichier de règles JSON"
  - "Implémenter un moteur de vérification qui rapporte les violations par règle avec les indices de ligne"
  - "Calculer un score de qualité global depuis les taux de réussite par règle"
  - "Détecter les régressions en comparant les taux de réussite entre instantanés"
  - "Livrer une CLI qui retourne un code de sortie non nul en cas d'échec de qualité"
---

# 🩺 Construire un Moniteur de Qualité des Données

« Ne livre pas des données que tu n'as pas vérifiées » ne fonctionne que si vérifier est bon marché et répétable. Ce projet construit l'outil qui rend cela bon marché : un fichier de règles écrit en JSON, un moteur qui transforme chaque règle en une liste de lignes en violation, un score qui résume tout le fichier, une comparaison de dérive qui sonne l'alerte quand une colonne empire silencieusement entre les instantanés, et une CLI dont un script de build peut réellement agir sur le code de sortie. Le tout est `csv`, `dataclasses`, et `json` — pas de framework, pas de base de données, juste tes règles exécutées contre tes données.

Ceci suppose Python 101 plus les `dataclasses` et `csv`. Rien du module Analyse de Données n'est nécessaire. C'est facultatif et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Modéliser les règles de qualité comme des données : une dataclass `Rule` qu'un simple fichier JSON peut décrire.
2. Écrire le moteur de vérification : cinq types de vérification (`not_null`, `unique`, `within_range`, `in_set`, plus une garde pour les inconnues) qui retournent des lignes `Violation` explicites.
3. Agréger les résultats en un rapport avec des taux de réussite par règle et un score de qualité global.
4. Comparer trois instantanés trimestriels et signaler les colonnes dont le taux de réussite a régressé.
5. En faire une CLI : une commande contre un CSV + un fichier de règles, code de sortie = verdict de qualité.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — tout l'intérêt est la minuscule CLI qu'un script de build ou de cron peut appeler, et cela nécessite un vrai système de fichiers.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent pour chaque étape — le notebook dans [`examples/data-quality-monitor/notebook.fr.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.fr.ipynb) exécute le même moteur de règles sur les instantanés trimestriels fournis en mémoire.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-quality-monitor%2Fnotebook.fr.ipynb)

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
uv init data-quality-monitor
cd data-quality-monitor
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `data-quality-monitor/` existe avec un `pyproject.toml`.
- ✅ `python -c "import csv, json, dataclasses"` réussit — aucun paquet tiers.

## Étape 1 : Modéliser une règle comme des données

Une vérification de qualité est une petite chose : *quelle colonne*, *quelle vérification*, *sous quels paramètres*. Le moment où tu écris ces vérifications comme des `if` éparpillés dans des fonctions, tu as couplé « quoi vérifier » à « comment l'exécuter ». La dataclass `Rule` les découple — les règles deviennent des *données*, chargeables depuis JSON, pour que votre responsable ajoute une règle en modifiant un fichier, pas ton code.

### 1.1 Écris la dataclass `Rule`

**👟 Indice de départ :** Une dataclass avec `name`, `column`, `check`, et un dict `params` ; une méthode de classe `from_dict` qui ramasse toutes les clés supplémentaires que la règle JSON porte :

```python
# rules.py
from dataclasses import dataclass
from typing import Any

@dataclass
class Rule:
    name: str
    column: str
    check: str
    params: dict[str, Any] = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Rule":
        return cls(
            name=data["name"],
            column=data["column"],
            check=data["check"],
            params={k: v for k, v in data.items()
                    if k not in {"name", "column", "check"}},
        )

if __name__ == "__main__":
    import json

    raw = json.loads(
        '[{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100}]'
    )
    rule = Rule.from_dict(raw[0])
    print(rule.name, "->", rule.check, rule.params)
```

`from_dict` est l'astuce silencieuse : les règles en JSON sont écrites comme `{"name": ..., "column": ..., "check": ..., "min": ..., "max": ...}` et la méthode *liste blanche* les trois clés structurelles, balayant tout le reste dans `params` — donc une future clé `"description": "..."` tombe inoffensivement dans params au lieu de faire crasher le chargeur. Les annotations de type sur params (`dict[str, Any]`) couvrent le fait que `allowed` est une liste mais `min` est un flottant.

**🎯 Résultat attendu :**

```
age in range -> within_range {'min': 0, 'max': 100}
```

**🩹 Si ça ne marche pas :** Si params est vide, `data["name"]` etc. ne sont pas les seules clés — vérifie que tu n'as pas aussi mis `"params": {...}` *à l'intérieur* de la règle JSON (from_dict ne dé-emboîte pas un dict imbriqué ; il aplatit les clés sœurs). Si `Rule` lève `TypeError`, le champ de défaut `params` utilise `None` pas `field(default_factory=dict)` — toujours valide ici, mais tu passeras params explicitement partout, donc préfère cela.

### 1.2 Vérifie le modèle de règle

**✅ Liste de vérification**

- ✅ `Rule.from_dict({"name": "x", "column": "age", "check": "unique"})` se construit avec des params vides.
- ✅ Passer une règle JSON avec `"allowed": [...]` fait atterrir cette liste dans `rule.params["allowed"]`.
- ✅ `Rule` est une dataclass : comparer `Rule(name="a", column="age", check="unique")` à une égale est `True`.

**🤔 Question(s) socratique(s)**

- Pourquoi une règle qui survit comme *dict/dataclass* (des données) au lieu d'une fonction est-elle meilleure pour une équipe où des analystes, pas des ingénieurs, définissent les vérifications ?
- `from_dict` ignore les clés supplémentaires inconnues en les balayant dans `params`. Quand cette permissivité est-elle un bug (`"minn": 0` avec une faute de frappe rend une règle silencieusement qui-ne-vérifie-rien plusieurs fois) ?

## Étape 2 : Écris le moteur de vérification

Le moteur est : *d'une règle et de toutes les lignes données, retourne les lignes en violation*. Chaque type de vérification est un prédicat étroit (`_fails`), et `rule_failures` parcourt les lignes en collectant les enregistrements `Violation` qui disent *quelle règle, quelle colonne, quel indice de ligne, quelle valeur*. Les violations sont des citoyens de première classe ici — pas des `print`, pas des `assert` — car le rapport, la dérive, et les étapes CLI les consomment toutes.

### 2.1 Implémente `_fails` et `rule_failures`

**👟 Indice de départ :** Un prédicat `_fails(rule, value, rows) -> bool` par nom de vérification, puis un collecteur qui mappe les échecs vers des `Violation`s avec des indices de ligne :

```python
# checks.py
from collections import Counter
from dataclasses import dataclass
from typing import Any

from rules import Rule

@dataclass
class Violation:
    rule: str
    column: str
    row_index: int
    value: Any

def _fails(rule: Rule, value: Any, rows: list[dict]) -> bool:
    if rule.check == "not_null":
        return value is None or str(value).strip() == ""
    if rule.check == "within_range":
        try:
            num = float(value)
        except (TypeError, ValueError):
            return True
        return not (rule.params["min"] <= num <= rule.params["max"])
    if rule.check == "in_set":
        return value not in rule.params["allowed"]
    if rule.check == "unique":
        non_null = [str(r.get(rule.column)) for r in rows if r.get(rule.column) is not None]
        return Counter(non_null)[str(value)] > 1
    raise ValueError(f"unknown check: {rule.check}")

def rule_failures(rows: list[dict], rule: Rule) -> list[Violation]:
    failures: list[Violation] = []
    for i, row in enumerate(rows):
        value = row.get(rule.column)
        if _fails(rule, value, rows):
            failures.append(Violation(rule.name, rule.column, i, value))
    return failures

if __name__ == "__main__":
    rows = [{"id": "1", "age": "36"}, {"id": "2", "age": "101"}, {"id": "3", "age": ""}]
    rule = Rule(name="age in range", column="age", check="within_range",
                params={"min": 0, "max": 100})
    for v in rule_failures(rows, rule):
        print(v.rule, "row", v.row_index, "->", repr(v.value))
```

`unique` est le mouton à cinq pattes et vaut la peine d'être relu deux fois : il ne peut pas être décidé cellule par cellule, donc il compte chaque valeur de colonne parmi *toutes* les lignes, puis retourne « échec » pour toute valeur apparaissant plus d'une fois. La forme `{..., ...} > 1` est un test d'appartenance, pas une comparaison — `Counter` retourne le compte et 2 > 1 est le signal de doublon. Le `raise ValueError` pour les vérifications inconnues est délibéré : un nom de vérification avec une faute de frappe dans le fichier de règles doit échouer bruyamment au moment de la vérification, pas passer silencieusement chaque ligne.

**🎯 Résultat attendu :**

```
age in range row 1 -> '101'
age in range row 2 -> ''
```

**🩹 Si ça ne marche pas :** Si la ligne 2 n'est pas attrapée, `float("")` a levé mais ton `except` n'attrape pas `ValueError` — `ValueError` et `TypeError` doivent tous deux être dans le tuple. Si chaque valeur est signalée comme doublon, le `Counter` dans `unique` est reconstruit par ligne au lieu d'une fois par règle — remonte-le hors de `_fails` ou repose-toi sur `rule_failures` qui passe la liste complète des lignes.

### 2.2 Vérifie le moteur

**✅ Liste de vérification**

- ✅ `not_null` échoue sur `""`, `"   "`, et une clé manquante (aucun des trois ne crashe).
- ✅ `within_range` échoue sur `"101"` avec max 100 et sur `"abc"` (non analysable → échec).
- ✅ `in_set` traite `"platinum"` comme un échec contre `["free", "pro", "business"]`, une question d'appartenance d'ensemble, pas une question de sous-chaîne.
- ✅ Une `check` inconnue lève `ValueError` plutôt que de passer silencieusement.

**🤔 Question(s) socratique(s)**

- `within_range` retourne `True` (échec) pour les nombres non analysables comme `"abc"`. Une valeur ordures est-elle une violation de *plage* ou une violation de *format* — et qu'arrive-t-il au score d'une colonne si les deux sont en désaccord ?
- `unique` compte `str(value)` tandis que `in_set` compare des valeurs brutes. Que font `"1"` vs `1` (chaîne contre entier) à chaque vérification — quand `unique` appellerait-il deux valeurs apparemment différentes des doublons ?

## Étape 3 : Agréger en un rapport et un score

Les violations sont la preuve ; un score est le verdict. Le rapport transforme 5 lignes × 4 règles en une ligne par règle — taux de réussite et compte de lignes en échec — et le score moyenne les taux de réussite. Un unique `0.80 / 1.00` est ce qu'un humain ou un journal de build peut analyser d'un coup d'œil et comparer au trimestre dernier.

### 3.1 Écris `QualityReport` et `render`

**👟 Indice de départ :** Une dataclass tenant les résultats, une méthode `pass_rate`, un `score` qui les moyenne, et un `render` qui affiche la version lisible par un humain :

```python
# report.py
from dataclasses import dataclass

from checks import Violation, rule_failures
from rules import Rule

@dataclass
class QualityReport:
    rules: list[Rule]
    failures: dict[str, list[Violation]]
    n_rows: int

    def pass_rate(self, rule_name: str) -> float:
        n = len(self.failures[rule_name])
        return 1 - n / max(self.n_rows, 1)

    def score(self) -> float:
        if not self.rules:
            return 0.0
        return sum(self.pass_rate(r.name) for r in self.rules) / len(self.rules)

def build_report(rows: list[dict], rules: list[Rule]) -> QualityReport:
    failures = {r.name: rule_failures(rows, r) for r in rules}
    return QualityReport(rules=rules, failures=failures, n_rows=len(rows))

def render(report: QualityReport) -> str:
    lines = [f"checked {report.n_rows} rows against {len(report.rules)} rules"]
    for rule in report.rules:
        rate = report.pass_rate(rule.name)
        fails = len(report.failures[rule.name])
        mark = "PASS" if rate == 1.0 else "FAIL"
        lines.append(f"[{mark}] {rule.name:<16} {rate:.1%} ({fails} violating rows)")
    lines.append(f"overall quality score: {report.score():.2f} / 1.00")
    return "\n".join(lines)

if __name__ == "__main__":
    import csv
    import json

    csv_text = """id,name,email,age,plan
1,Ada,ada@example.com,36,free
2,Grace,,44,pro
3,Alan,alan@bletchley.uk,,free
4,Katherine,kj@nasa.gov,101,platinum
5,Margaret,mh@mit.edu,66,free
"""
    rules = [Rule.from_dict(r) for r in json.loads(
        '[{"name": "id unique", "column": "id", "check": "unique"},'
        '{"name": "email present", "column": "email", "check": "not_null"},'
        '{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100},'
        '{"name": "plan valid", "column": "plan", "check": "in_set", "allowed": ["free", "pro", "business"]}]'
    )]

    rows = list(csv.DictReader(csv_text.strip().splitlines()))
    print(render(build_report(rows, rules)))
```

La moyenne est *non pondérée par conception* : quatre règles, quatre taux de réussite, voix égale. `pass_rate` utilise `max(self.n_rows, 1)` pour qu'un fichier *vide* score chaque règle à 0 % (toutes les zéro lignes échouent, c'est la lecture honnête) au lieu de crasher sur une division par zéro. Le préfixe `[FAIL]`/`[PASS]` et le formatage `:.1%` sont toute l'UX du rapport — une colonne qui score 80 % ou une dérive de −13,3 % doit être visible en un scan, pas après avoir compté des étoiles.

**🎯 Résultat attendu :**

```
checked 5 rows against 4 rules
[PASS] id unique        100.0% (0 violating rows)
[FAIL] email present    80.0% (1 violating rows)
[FAIL] age in range     60.0% (2 violating rows)
[FAIL] plan valid       80.0% (1 violating rows)
overall quality score: 0.80 / 1.00
```

**🩹 Si ça ne marche pas :** Si `age in range` montre 80 % au lieu de 60 %, le `''` vide de la ligne 3 n'est pas compté — `float('')` qui lève est géré, mais vérifie que la clause `except (TypeError, ValueError)` retourne `True` (échec) ; si elle `pass`ait, la cellule vide tombe à travers vers la comparaison de plage et passe silencieusement. Si la ligne de score est 1.00, la méthode `score` moyenne autre chose que tes règles — confirme que `len(self.rules)` divise *quatre* taux de réussite.

### 3.2 Vérifie le rapport

**✅ Liste de vérification**

- ✅ Les lignes 2 (Grace, email vide), 3 (Alan, âge vide), et 4 (Katherine, âge 101, plan `platinum`) sont exactement les lignes en violation comptées.
- ✅ `render()` affiche une ligne par règle plus le score ; la colonne de compte correspond à `len(rule_failures(...))`.
- ✅ Un CSV vide score 0.00 sans crasher dans `pass_rate`.

**🤔 Question(s) socratique(s)**

- Le score est une simple moyenne. Une colonne échouant 40 % du temps et une colonne échouant 10 % du temps pèsent toutes deux sur la moyenne de leur propre poids. Quel type de score *pondéré* voudraient un tableau de bord d'hôpital ou un système de paie — et `render` a-t-il encore du sens, ou diviserais-tu le rapport en niveaux ?
- `PASS` exige exactement 100 %. Deux équipes de qualité des données divergent sur le fait qu'une couverture email de 99,5 % devrait être verte. Où appartient le seuil de passage — dans `render` ou dans le score ?

## Étape 4 : Détecter la dérive entre les instantanés

Un fichier propre isolé est agréable ; une colonne qui se *salit* est l'urgence. La dérive compare le taux de réussite de chaque règle entre des fichiers d'instantanés consécutifs et signale toute colonne dont le taux a baissé de plus d'un seuil (5 points) avec le marqueur `  <-- regression` — pour qu'un build puisse appeler la personne qui possède `email present`.

### 4.1 Écris le comparateur

**👟 Indice de départ :** Réutilise `build_report` par fichier pour obtenir les taux de réussite, puis parcours fichier-à-fichier en affichant les taux et les deltas, signalant les baisses au-delà du seuil :

```python
# drift.py
from report import build_report

def pass_rates_for_file(path: str, rules: list) -> dict[str, float]:
    import csv
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    report = build_report(rows, rules)
    return {r.name: report.pass_rate(r.name) for r in rules}

def compare(files: list[str], rules: list, threshold: float = 0.05) -> list[str]:
    lines: list[str] = []
    prev = None
    for path in files:
        rates = pass_rates_for_file(path, rules)
        if prev is None:
            lines.append(f"== {path} (baseline)")
            for name, rate in rates.items():
                lines.append(f"   {name:<16} {rate:.1%}")
        else:
            lines.append(f"== {path}")
            for name, rate in rates.items():
                delta = rate - prev[name]
                flag = "   <-- regression" if delta < -threshold else ""
                lines.append(f"   {name:<16} {rate:.1%} ({delta:+.1%}){flag}")
        prev = rates
    return lines

if __name__ == "__main__":
    import csv
    import json

    from rules import Rule

    snapshots = {
        "customers_q1.csv": [
            ["id", "name", "email", "age", "plan"],
            ["1", "Ada", "ada@example.com", "36", "free"],
            ["2", "Grace", "", "44", "pro"],
            ["3", "Alan", "alan@bletchley.uk", "", "free"],
            ["4", "Katherine", "kj@nasa.gov", "101", "platinum"],
            ["5", "Margaret", "mh@mit.edu", "66", "free"],
        ],
        "customers_q2.csv": [
            ["id", "name", "email", "age", "plan"],
            ["6", "Tim", "td@example.com", "44", "free"],
            ["7", "Barbara", "", "29", "free"],
            ["8", "Don", "don@example.com", "118", "pro"],
        ],
        "customers_q3.csv": [
            ["id", "name", "email", "age", "plan"],
            ["9", "Carol", "carol@example.com", "51", "pro"],
            ["10", "David", "david@example.com", "52", "business"],
            ["11", "Ellen", "ellen@example.com", "", "free"],
        ],
    }
    for path, rows in snapshots.items():
        with open(path, "w", newline="") as f:
            csv.writer(f).writerows(rows)

    rules = [Rule.from_dict(r) for r in json.loads(
        '[{"name": "id unique", "column": "id", "check": "unique"},'
        '{"name": "email present", "column": "email", "check": "not_null"},'
        '{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100},'
        '{"name": "plan valid", "column": "plan", "check": "in_set", "allowed": ["free", "pro", "business"]}]'
    )]

    for line in compare(["customers_q1.csv", "customers_q2.csv", "customers_q3.csv"], rules):
        print(line)
```

La ligne de base est le *premier* fichier par position dans la liste — comparant les taux de réussite à l'instantané immédiatement précédent (q2 vs q1, q3 vs q2), pas toujours à q1. C'est l'honnête question « le dernier envoi de cette équipe était-il pire que le précédent » ; tout comparer à q1 répondrait « est-ce pire qu'il y a trois mois », une différence (toujours valide) de graphique. Le formatage de delta `%(+...%)` rend l'ambiguïté de signe +/− impossible à lire à l'envers.

**🎯 Résultat attendu :**

```
== customers_q1.csv (baseline)
   id unique        100.0%
   email present    80.0%
   age in range     60.0%
   plan valid       80.0%
== customers_q2.csv
   id unique        100.0% (+0.0%)
   email present    66.7% (-13.3%)   <-- regression
   age in range     66.7% (+6.7%)
   plan valid       100.0% (+20.0%)
== customers_q3.csv
   id unique        100.0% (+0.0%)
   email present    100.0% (+33.3%)
   age in range     66.7% (+0.0%)
   plan valid       100.0% (+0.0%)
```

**🩹 Si ça ne marche pas :** Si aucun marqueur `regression` n'apparaît jamais, `threshold` (défaut `0.05`) est comparé au mauvais signe — une *baisse* est `delta < -threshold`, donc vérifie le moins. Si la baisse d'email de q2 apparaît comme `+13.3%`, le delta est calculé `prev - rate` au lieu de `rate - prev` — signe, inversé.

### 4.2 Vérifie la dérive

**✅ Liste de vérification**

- ✅ `customers_q2.csv` signale exactement une régression : `email present`.
- ✅ `age in range` *s'améliore* q1→q2 (+6,7 %) et tient bon q2→q3, jamais faussement signalé.
- ✅ Les fichiers sont écrits par la démo (donc le comparateur tourne sur de vrais fichiers), et les taux sur le disque correspondent à la ligne de base ci-dessus.

**🤔 Question(s) socratique(s)**

- Le seuil (5 points) est le même pour toutes les règles. `email present` qui chute de 13,3 points déclenche le drapeau ; `age in range` qui monte de 6,7 points est un succès. Quel type de règle mérite un seuil *par règle* — et où vivrait-il dans la signature de `compare` sans changer l'API ?
- La dérive compare taux-à-taux, ignorant le *volume* (q2 vérifie 3 lignes, q1 en vérifiait 5). Un signal de régression d'une seule ligne depuis un fichier de 3 lignes est statistiquement faible. À quoi ressemblerait une comparaison pondérée par confiance — et quand « signale tout, vérifie à la main » est-il de toute façon le choix pragmatique ?

## Étape 5 : La CLI et le code de sortie

Le moteur est terminé ; la partie qui change la façon dont une équipe *contracte* avec l'outil est le code de sortie. `monitor.py` lit un CSV et un fichier de règles, affiche le rapport, et sort `0` si tout a réussi ou `2` si quoi que ce soit a échoué — une étape CI ou un script cron peut traiter non-nul comme « bloque le déploiement / appelle le propriétaire » sans analyser une seule ligne de sortie.

### 5.1 Écris `monitor.py`

**👟 Indice de départ :** `argparse` pour `csv_path` + `--rules` optionnel, réutilise `build_report`/`render`, règle `sys.exit` depuis le score :

```python
# monitor.py
import argparse
import csv
import json
import sys

from report import build_report, render
from rules import Rule

def main() -> None:
    parser = argparse.ArgumentParser(description="Check CSV data quality against a rules file.")
    parser.add_argument("csv_path")
    parser.add_argument("--rules", default="rules.json")
    args = parser.parse_args()

    with open(args.rules) as f:
        rules = [Rule.from_dict(r) for r in json.load(f)]

    with open(args.csv_path, newline="") as f:
        rows = list(csv.DictReader(f))

    report = build_report(rows, rules)
    print(render(report))
    sys.exit(0 if report.score() == 1.0 else 2)

if __name__ == "__main__":
    main()
```

**✅ Liste de vérification**

- ✅ La CLI tourne avec `uv run python monitor.py customers_q1.csv` et affiche le rapport.
- ✅ `echo $?` montre `2` pour customers_q1.csv (score 0.80) ; un fichier propre sort avec `0`.
- ✅ `--rules` honore un chemin personnalisé (ex. `uv run python monitor.py data.csv --rules my-rules.json`).

Le score est la seule chose que le code de sortie connaît, et c'est une vraie décision de conception. « Porte de qualité » signifie *le score doit être exactement 1.00* — le plus strict possible. Si tu préfères porter la porte sur « pire que 0.95 », tu changes une constante ; le rapport, le moteur, et le contrat CLI restent en place.

### 5.2 Vérifie la CLI de bout en bout

**🩹 Si ça ne marche pas :** Si `sys.exit(2)` semble ne rien faire, souviens-toi que l'aide/les versions d'`argparse` sortent avec leurs propres codes avant que `main()` n'atteigne même la porte — et une exécution `--help` rapportant 0 est correcte. Si le code de sortie est `1` au lieu de `2`, une exception s'est échappée de `main()` avant que la porte ne s'exécute — lis la traceback ; c'est un problème de chemin de fichier, pas un problème de porte.

**🤔 Question(s) socratique(s)**

- Le code de sortie ne connaît que réussite/échec ; le rapport connaît quelles règles ont dérivé. Pourquoi cette séparation est-elle *correcte* pour une porte CI, et que ton pipeline perdrait-il si la CLI affichait « score 0.80 » mais *sortait toujours* par 0 ?
- `--rules rules.json` se définit sur un nom de fichier fixe. Qu'est-ce que `--rules` n'autorise *pas* qu'une équipe pourrait vouloir (règles par répertoire, écrasements par variable d'environnement) — et ces ajouts changeraient-ils le contrat de code de sortie ?

## ⚠️ Pièges courants

- **Transformer le vide en succès.** `float("")` lève ; si ta clause `except` retourne `False` (réussite) ou re-lève silencieusement, les cellules blanches traversent `within_range`. Vide est un échec ; non analysable est un échec ; une exception non gérée n'est *pas* un résultat.
- **`unique` qui recompte pour chaque ligne.** Construire le `Counter` à l'intérieur du prédicat par ligne transforme un fichier de 100k lignes en travail O(n²). Compte une fois par règle (ou accepte-le pour des données de démo) — et souviens-toi que `"1"` et `1` sont des chaînes différentes.
- **Inversions de signe dans les deltas de dérive.** `delta = rate - prev` signale correctement les baisses ; `prev - rate` signale les hausses. C'est un vidage d'un caractère de la crédibilité d'un rapport.
- **Score `0/0`.** Un CSV vide doit scorer 0,00 à travers une garde `max(self.n_rows, 1)`, pas crasher dans une division par zéro. La question du fichier vide à se poser est « 0 ligne devrait-il être un échec ou un saut ».
- **Dérive de code de sortie.** Un outil qui *affiche* SUCCÈS/ÉCHEC mais sort toujours par 0 est décoratif. Si tu embarques la porte dans un script, `cmd /c` (Windows) et le chaînage `&&` honorent tous deux le vrai code de sortie — choisis le code de sortie délibérément et teste-le.

## Ce que tu viens de construire

Une suite de qualité des données autonome : des règles comme données JSON, un moteur de vérification avec des violations par ligne, un rapport scoré sur un écran, une comparaison de dérive instantané-à-instantané avec drapeaux de régression, et une CLI dont le code de sortie est une porte de déploiement. La compétence réutilisable est de *séparer le jugement de l'exécution* : des données `Rule` dans un fichier, un moteur dans `checks.py`, une présentation dans `render`, une décision dans un code de sortie — n'importe lequel peut changer (nouveau type de vérification, nouveau format de rapport, nouvelle règle de porte) sans toucher les trois autres.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/data-quality-monitor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-quality-monitor) dans le dépôt du cours contient les scripts complets, les CSV d'instantanés trimestriels, et un `rules.json` d'échantillon. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute un drapeau CLI **`--threshold`** qui écrase le défaut de `compare`, répondant à la question socratique de l'Étape 4 sur la sensibilité par règle sans changer le moteur.
- Émets un rapport **JSON** (`--json report.json`) aux côtés du rapport humain : même score, mêmes violations, lisible par machine — le frère verbeux du code de sortie.
- Ajoute des **comptes de volume par colonne** au tableau de dérive (3 lignes ce trimestre contre 5 le dernier) pour que les lecteurs humains puissent voir la *confiance* autant que le taux.
- Prends en charge la **détection d'instantané périmé** : signale les instantanés dont la colonne d'horodatage `as_of` est plus vieille que N jours — la dérive se mesure dans le temps, pas seulement dans l'ordre des fichiers.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓