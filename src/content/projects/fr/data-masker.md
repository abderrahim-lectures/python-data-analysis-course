---
title: "Outil de Masquage de Données"
description: "Anonymise les données sensibles pour le développement et les tests tout en préservant les propriétés statistiques."
difficulty: "intermediate"
estimatedMinutes: 80
tags: ["cli", "csv", "pii", "hashing"]
prerequisites:
  - "Les bases de Python (variables, boucles, fonctions, dictionnaires)"
  - "Lire des fichiers CSV avec le module csv"
learningObjectives:
  - "Détecter les colonnes sensibles par indices de nom et motifs de valeurs"
  - "Appliquer les stratégies de masquage redact, hash et préservant le format"
  - "Construire automatiquement un plan de masquage par colonne à partir de la détection"
  - "Masquer les identifiants numériques tout en préservant la distribution de la colonne"
  - "Écrire un journal d'audit de chaque opération de masquage"
---

# 🕶️ Construire un Outil de Masquage de Données

Copier de vraies données clients dans une base de développement, un rapport de bug, ou une démo est ainsi que la donnée sensible fuit — et la correction est la discipline du *masquage* : remplacer les vraies valeurs par des fausses mais plausibles avant que la donnée n'aille où elle ne devrait pas. Le savoir-faire est dans les détails : un email doit garder son domaine (pour que le code de test route encore), un numéro de téléphone doit rester en forme de téléphone, un champ numérique comme le salaire doit garder sa *distribution* (pour que les analyses de test ne s'effondrent pas). Ce projet construit un masqueur qui détecte les colonnes sensibles, applique la bonne stratégie par colonne, préserve ce qui doit être préservé, et écrit un journal d'audit de chaque opération.

Ceci suppose Python 101 plus une lecture confortable de `csv` et `re` — fonctions, listes, ensembles. Rien du module Analyse de Données n'est nécessaire. C'est facultatif et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Détecter les colonnes sensibles en utilisant des indices de nom (`email`, `phone`, `name`, …) et des regex de motifs de valeurs.
2. Implémenter un zoo de stratégies : redact, hash déterministe, masquage texte préservant la longueur, email et téléphone préservant le format.
3. Construire automatiquement un plan de masquage par colonne à partir de la détection + indices de nom de colonne.
4. Masquer les identifiants numériques par permutation intra-colonne, prouvant que la distribution survit pendant que la ligne-qui-parle-de-l'id est coupée.
5. Appliquer une CLI `masker.py` qui masque un CSV, écrit `masked.csv`, et ajoute à `audit.jsonl`.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — le masquage est par nature une opération *fichier* (« masque ce CSV, garde celui-là »), donc la CLI locale contre tes propres fichiers est l'honnête foyer.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent bien pour la moitié stratégies-et-plan — le notebook dans [`examples/data-masker/notebook.fr.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.fr.ipynb) exécute chaque étape sur des lignes d'échantillon fournies. La note honnête : le notebook traite des données d'échantillon fixes, tandis que la CLI locale peut être pointée sur un vrai CSV que tu possèdes réellement.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-masker%2Fnotebook.fr.ipynb)

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
uv init data-masker
cd data-masker
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `data-masker/` existe avec un `pyproject.toml`.
- ✅ `python -c "import csv, hashlib, re"` réussit — aucun paquet tiers.

## Étape 1 : Détecter les colonnes sensibles

Le masquage commence par *trouver* les secrets. Deux signaux indépendants existent : le *nom* de la colonne (presque tout ce qui est sensible est honnête sur le fait d'être `email` ou `phone` dans l'en-tête) et les *valeurs* (un `@` contenant un point est un fort indice d'email quel que soit le nom de la colonne). La détection fait confiance aux deux, car l'un ou l'autre peut être le seul à fonctionner.

### 1.1 Écris le détecteur

**👟 Indice de départ :** Trois groupes d'indices de nom plus un motif `re` email/téléphone, alimentant tous un même ensemble de colonnes sensibles ; lance-le sur un CSV d'échantillon avec une colonne sensible au nom évident et une au nom sournois :

```python
# detect.py
import re

EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
PHONE_RE = re.compile(r"\+?\d[\d\s().-]{6,}\d")
NAME_HINTS = ("name", "person", "student", "customer", "user")
PII_HINTS = ("email", "phone", "ssn", "sin", "address", "iban", "credit")

def detect_columns(headers: list[str], rows: list[dict]) -> list[str]:
    sensitive: set[str] = set()
    for col in headers:
        lowered = col.lower()
        if any(hint in lowered for hint in NAME_HINTS):
            sensitive.add(col)
        if any(hint in lowered for hint in PII_HINTS):
            sensitive.add(col)
        values = [row[col] for row in rows]
        joined = " ".join(values)
        if EMAIL_RE.search(joined) or PHONE_RE.search(joined):
            sensitive.add(col)
    return [col for col in headers if col in sensitive]

if __name__ == "__main__":
    csv_text = """id,full_name,email,phone,contact,city
1,Ada Lovelace,ada@example.com,+1 555 0101,ada@example.com,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,grace@navy.mil,Arlington
3,Alan Turing,alan@bletchley.uk,+44 20 7946 0000,alan@bletchley.uk,Bletchley
"""
    lines = [line for line in csv_text.strip().splitlines()]
    import csv
    reader = csv.DictReader(lines)
    headers = reader.fieldnames or []
    rows = list(reader)
    print(detect_columns(headers, rows))
```

`contact` est le test qui garde le détecteur honnête : son en-tête ne dit rien de sensible, mais ses valeurs sont des emails, donc `EMAIL_RE.search(joined)` est ce qui l'attrape. Remarque que la détection fonctionne sur le *texte joint d'une colonne*, pas cellule par cellule — une seule recherche regex sur la colonne entière est à la fois plus simple et suffisante pour les signaux de motif, au prix de ne pas te dire quelles *lignes* sont sensibles (l'étape du plan n'en a pas encore besoin).

**🎯 Résultat attendu :**

```
['full_name', 'email', 'phone', 'contact']
```

**🩹 Si ça ne marche pas :** Si `contact` est raté, la recherche `EMAIL_RE` jointe ne tourne pas pour chaque colonne — confirme que le bloc regex est à l'intérieur de la boucle `for col`. Si `city` est signalé, un fragment `NAME_HINTS` comme `user` correspond à un sous-ensemble d'un en-tête innocent (`city` ? non — vérifie l'en-tête `username_last_change`) ; la liste d'indices est basée sur les sous-chaînes par conception, et la correspondance par sous-chaîne est exactement aussi lâche qu'elle en a l'air.

### 1.2 Vérifie la détection

**✅ Liste de vérification**

- ✅ L'échantillon détecte `full_name`, `email`, `phone` et `contact`, dans cet ordre d'en-tête.
- ✅ Supprimer les *valeurs* d'email de la colonne `contact` (mais garder son en-tête) fait qu'elle n'est plus signalée — les motifs de valeurs sont réellement basés sur les valeurs.
- ✅ Une colonne `address` et une colonne `iban` sont signalées par le nom seul, même avec des valeurs vides.

**🤔 Question(s) socratique(s)**

- La détection est par *colonne*, pas par *cellule* : un seul email dans une colonne « notes » de 10 000 lignes signale la colonne entière. Que le masqueur gagnerait-il (et perdrait-il) en passant à une détection au niveau cellule pour les colonnes de texte libre comme `notes` ?
- Les indices de nom correspondent à des sous-chaînes (`user` correspond à `user_name` *et* `userscript_repo`). Pourquoi la correspondance par sous-chaîne est-elle le défaut pragmatique ici plutôt qu'une correspondance exacte `==` — et quel unique faux positif changerait ton avis ?

## Étape 2 : Construire le zoo de stratégies

La détection décide *quelles* colonnes ; les stratégies décident *comment* chacune est masquée. L'ensemble utile est : redact (le destructeur), hash (pseudonyme déterministe — la même entrée correspond toujours à la même sortie, donc les jointures fonctionnent encore), texte préservant la longueur (les fixtures de test restent plausibles), email/téléphone préservant le format (le domaine et la structure survivent au routage/matching). Chacune est une fonction à une idée.

### 2.1 Écris une stratégie par fonction

**👟 Indice de départ :** Cinq petites fonctions, puis un helper `apply` que tout planificateur peut réutiliser — `mask_email` garde le domaine après le `@`, `mask_phone` garde seulement les quatre derniers chiffres, les deux sous une table de répartition de stratégie partagée :

```python
# mask.py
import hashlib
import re

STRATEGY = {}

def mask_redact(value: str) -> str:
    return "****"

def mask_hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()[:12]

def mask_text(value: str) -> str:
    if not value.strip():
        return value
    return "".join("*" if ch.isalpha() else ch for ch in value)

def mask_email(value: str) -> str:
    local, sep, domain = value.partition("@")
    if not sep:
        return mask_hash(value)
    return f"{hashlib.sha256(local.encode()).hexdigest()[:8]}@{domain}"

def mask_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) < 5:
        return "****"
    return f"+X{'-' * (len(digits) - 4)}-{digits[-4:]}"

STRATEGY.update({
    "redact": mask_redact, "hash": mask_hash, "text": mask_text,
    "email": mask_email, "phone": mask_phone,
})

def apply(rows: list[dict], plan: dict[str, str]) -> list[dict]:
    masked_rows = []
    for row in rows:
        out = dict(row)
        for col, strategy in plan.items():
            out[col] = STRATEGY[strategy](out[col])
        masked_rows.append(out)
    return masked_rows

if __name__ == "__main__":
    rows = [
        {"full_name": "Ada Lovelace", "email": "ada@example.com", "phone": "+1 555 0101", "city": "London"},
        {"full_name": "Grace Hopper", "email": "grace@navy.mil", "phone": "+1 555 0102", "city": "Arlington"},
    ]
    plan = {"full_name": "text", "email": "email", "phone": "phone"}
    for row in apply(rows, plan):
        print(row)
```

Le dict `STRATEGY` mappant les noms aux fonctions est la *table de répartition* — le planificateur (à l'étape suivante) produit des noms de stratégie en chaîne et `apply` les transforme en comportement, donc ajouter la stratégie #6 signifie une fonction plus une entrée de table, pas une réécriture du planificateur. Deux formats à admirer : `mask_email` garde tout après le `@` (un email joint route encore vers le même domaine) et hache la partie locale ; `mask_phone` compte les chiffres pour préserver la *forme* de numérotation (`+X-----0101`) tout en détruisant l'identité du numéro.

**🎯 Résultat attendu :**

```
{'full_name': '*** ********', 'email': 'fdee430d@example.com', 'phone': '+X-----0101', 'city': 'London'}
{'full_name': '***** ******', 'email': 'e010fd1c@navy.mil', 'phone': '+X-----0102', 'city': 'Arlington'}
```

**🩹 Si ça ne marche pas :** Si les hashs de `mask_email` diffèrent à chaque exécution, tu as utilisé `random` quelque part au lieu de `hashlib` — le déterminisme est tout l'intérêt. Si la longueur du masque de `mask_phone` est fausse, `len(digits)` compte un indicatif de pays qui ne devrait pas être visible — c'est un comportement correct (forme préservée, vrai préfixe détruit) ; vérifie le compte de `-` contre `len(digits) - 4` plutôt qu'à l'œil.

### 2.2 Vérifie les stratégies

**✅ Liste de vérification**

- ✅ `mask_hash("Ada")` égale `mask_hash("Ada")` entre exécutions, mais diffère de `mask_hash("ada")` (la casse compte — c'est un vrai piège, voir plus bas).
- ✅ `mask_email("grace@navy.mil")` se termine toujours par `@navy.mil` ; `mask_phone("+1 555 0102")` se termine toujours par `0102`.
- ✅ `mask_text("Ada")` est `***` — même longueur, aucune lettre.
- ✅ `apply` masque seulement les colonnes nommées par le plan et laisse chaque autre cellule intacte.

**🤔 Question(s) socratique(s)**

- `mask_hash` est déterministe, ce qui le rend inversible par devinette : `mask_hash("secret")` est de la connaissance publique une fois que tu as vu le hash. Quand le masquage en hash est-il acceptable (quelle propriété de la donnée le rend sûr), et quand est-il trivialement démaskable ?
- `mask_email` hache la partie *locale* mais garde le domaine. Quel comportement aval réel un email entièrement redacté détruirait — et quel est le risque résiduel de confidentialité à garder le domaine visible ?

## Étape 3 : Construire automatiquement le plan de masquage

Personne ne veut écrire à la main `{"email": "email", "full_name": "text", ...}` par jeu de données. Le planificateur boucle la boucle avec la détection : les colonnes sensibles reçoivent une stratégie choisie par *l'indice de leur nom* — `email` → préserveur d'email, phone → préserveur de téléphone, variantes `name` → texte préservant la longueur, tout le reste sensible → hash. Détection + une table de recherche = un plan complet.

### 3.1 Écris le planificateur

**👟 Indice de départ :** Réutilise `detect_columns`, puis parcourt la liste détectée en choisissant une stratégie par indice avec un petit `if/elif` — le plan est un dict simple que `mask.apply` sait déjà exécuter :

```python
# planner.py
from detect import detect_columns
from mask import apply

def build_plan(headers: list[str], rows: list[dict]) -> dict[str, str]:
    sensitive = detect_columns(headers, rows)
    plan: dict[str, str] = {}
    for col in sensitive:
        lowered = col.lower()
        if "email" in lowered:
            plan[col] = "email"
        elif "phone" in lowered:
            plan[col] = "phone"
        elif any(hint in lowered for hint in ("name", "person", "student")):
            plan[col] = "text"
        else:
            plan[col] = "hash"
    return plan

def mask_with_plan(rows: list[dict], plan: dict[str, str]) -> list[dict]:
    return apply(rows, plan)

if __name__ == "__main__":
    import csv
    csv_text = """id,full_name,email,phone,ssn,city
1,Ada Lovelace,ada@example.com,+1 555 0101,111-22-3333,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,444-55-6666,Arlington
"""
    reader = csv.DictReader(csv_text.strip().splitlines())
    rows = list(reader)
    plan = build_plan(reader.fieldnames or [], rows)
    print("plan:", plan)
    for row in mask_with_plan(rows, plan):
        print(row)
```

La cascade `email → phone → name → hash` est délibérément ordonnée par *combien de format doit survivre* : l'email garde le plus de structure, et tout ce qui passe à travers finit en hash — le défaut conservateur en matière de confidentialité. Parce que `build_plan` retourne un dict simple et `apply` consomme un dict simple, les deux moitiés pourraient être remplacées indépendamment (un planificateur piloté par YAML, un registre de stratégies) sans se toucher.

**🎯 Résultat attendu :**

```
plan: {'full_name': 'text', 'email': 'email', 'phone': 'phone', 'ssn': 'hash'}
{'id': '1', 'full_name': '*** ********', 'email': 'fdee430d@example.com', 'phone': '+X-----0101', 'ssn': '2e54cc08456e', 'city': 'London'}
{'id': '2', 'full_name': '***** ******', 'email': 'e010fd1c@navy.mil', 'phone': '+X-----0102', 'ssn': '74e4145b168a', 'city': 'Arlington'}
```

**🩹 Si ça ne marche pas :** Si `ssn` n'est pas dans le plan, `detect_columns` l'a trouvé sensible mais la branche « else → hash » du plan n'est pas atteinte — vérifie que l'ordre `if/elif` n'a pas avalé `ssn` sous un indice `name` (il ne devrait pas). Si la sortie masquée *lâche* `city`, `apply` reconstruit des lignes au lieu de les copier — il doit faire `dict(row)` puis écraser en place.

### 3.2 Vérifie le planificateur

**✅ Liste de vérification**

- ✅ `build_plan` mappe les quatre colonnes sensibles respectivement à `text`/`email`/`phone`/`hash`.
- ✅ `id` et `city` sont absents du plan et inchangés dans chaque ligne masquée.
- ✅ Appeler `mask_with_plan` deux fois sur les mêmes lignes produit une sortie identique — déterminisme de bout en bout.

**🤔 Question(s) socratique(s)**

- Le repli est `hash` « par défaut ». Si un jeu de données avait une colonne `date_of_birth`, c'est `hash` qu'elle recevrait — mais le hash d'un anniversaire est exactement le cas *trivialement devinable* signalé dans la question de l'Étape 2. Sur quoi un repli plus intelligent s'appuierait-il (la *forme* de la valeur, pas seulement le nom) et le défaut actuel est-il un bug ou une décision de portée ?
- `build_plan` retourne un dict mais ne sait pas comment il sera appliqué. Où cette séparation devient-elle précieuse — quel est un exemple d'appliquer le *même* plan à un pipeline différent (une base de données, une réponse API) sans toucher au planificateur ?

## Étape 4 : Préserver les distributions pour les identifiants numériques

Le masquage de texte a un étalon « préserver » facile (même longueur). Pour les nombres — salaire, âge, bonus — l'étalon est une *distribution*, et la technique honnête pour la préserver exactement est la **permutation intra-colonne** : mélange chaque colonne numérique sensible elle-même. Chaque valeur survit, donc la moyenne/la médiane sont intactes par construction ; ce qui est détruit, c'est l'*association* entre l'identité d'une ligne et son nombre.

### 4.1 Écris le masqueur par permutation et les vérificateurs de statistiques

**👟 Indice de départ :** Un mélange ensemencé par colonne plus `column_stats` (moyenne, médiane) et une vérification d'égalité de multiset qui *prouve* la préservation de la distribution sans estimation visuelle :

```python
# preserve.py
import random

def shuffle_column(values: list[str], seed: int = 42) -> list[str]:
    rng = random.Random(seed)
    shuffled = list(values)
    rng.shuffle(shuffled)
    return shuffled

def column_stats(values: list[float]) -> dict[str, float]:
    mean = sum(values) / len(values)
    ordered = sorted(values)
    n = len(ordered)
    if n % 2:
        median = ordered[n // 2]
    else:
        median = (ordered[n // 2 - 1] + ordered[n // 2]) / 2
    return {"mean": mean, "median": median}

if __name__ == "__main__":
    original = [52000.0, 61000.0, 47000.0, 75000.0, 66000.0, 58000.0]
    masked = [float(v) for v in shuffle_column([str(v) for v in original])]

    print("same multiset of values:", sorted(masked) == sorted(original))
    before = column_stats(original)
    after = column_stats(masked)
    print(f"mean  before {before['mean']:>9,.2f}  after {after['mean']:>9,.2f}")
    print(f"median before {before['median']:>9,.2f}  after {after['median']:>9,.2f}")
```

Mélanger est *exactement* préservateur de distribution parce que le résultat est le même multiset de valeurs — `sorted(masked) == sorted(original)` n'est pas une heuristique, c'est une preuve. Ce que la permutation achète côté confidentialité est plus subtil et plus précieux : le mapping *personne ↔ salaire* est coupé, tandis que la *forme* que les analystes modélisent (« six salaires avoisinant ~59,8k, médiane ~59,5k ») survit intacte. L'argument `seed` est ce qui rend les exécutions reproductibles — sans lui, chaque exécution de masquage disperserait tes fixtures de test différemment.

**🎯 Résultat attendu :**

```
same multiset of values: True
mean  before 59,833.33  after 59,833.33
median before 59,500.00  after 59,500.00
```

**🩹 Si ça ne marche pas :** Si la moyenne diffère, tu as muté des valeurs au lieu de les permuter — une transformation comme `value * factor` change la distribution ; un *mélange* ne le peut pas. Si la même `seed` produit des mélanges différents entre exécutions, `random.Random(seed)` est recréé dans une boucle au lieu d'une seule fois.

### 4.2 Vérifie la préservation

**✅ Liste de vérification**

- ✅ `sorted(masked) == sorted(original)` vaut `True`.
- ✅ La moyenne et la médiane sont identiques avant et après, à la grandeur près.
- ✅ Relancer avec la même graine reproduit exactement le même ordre masqué.

**🤔 Question(s) socratique(s)**

- La permutation préserve la distribution de chaque colonne mais *ne casse rien* non plus dans les distributions des autres colonnes. Alors qu'est-ce qui est réellement perdu pour un analyste aval — peuvent-ils encore répondre « les ingénieurs gagnent-ils plus que les designers ici », et peuvent-ils encore répondre « quelle *personne* gagne le plus » ? Quelle perte est la victoire de confidentialité ?
- `column_stats` rapporte moyenne et médiane. Quelle *autre* propriété de distribution deux colonnes avec la même moyenne/médiane différeraient-elles encore — et la permutation préserve-t-elle aussi cette propriété, ou est-ce seulement l'association qui s'est brisée ?

## Étape 5 : Journal d'audit et la CLI

Le masquage sans traces est un trou de conformité — tu dois pouvoir prouver *quel* fichier a été masqué, *quelles* colonnes, *combien* de lignes, et *quand*. Un journal d'audit JSONL en ajout seul fournit cela, et une CLI `masker.py` compose détection → plan → application → enregistrement → audit en une commande.

### 5.1 Écris `AuditLog` et la CLI

**👟 Indice de départ :** Un écrivain `audit.jsonl` en ajout seul (un objet JSON par ligne), puis une CLI qui lit un CSV, construit le plan, écrit `masked.csv` via `csv.DictWriter`, et enregistre l'opération :

```python
# masker.py
import argparse
import csv
import json
from datetime import datetime, timezone

from planner import build_plan, mask_with_plan

class AuditLog:
    def __init__(self, path: str = "audit.jsonl"):
        self.path = path

    def record(self, source: str, masked_columns: list[str], rows_masked: int) -> None:
        entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "masked_columns": masked_columns,
            "rows_masked": rows_masked,
        }
        with open(self.path, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def count(self) -> int:
        try:
            with open(self.path) as f:
                return sum(1 for _ in f)
        except FileNotFoundError:
            return 0

def main() -> None:
    parser = argparse.ArgumentParser(description="Mask sensitive columns of a CSV, preserving the rest.")
    parser.add_argument("csv_path")
    parser.add_argument("--output", default="masked.csv")
    args = parser.parse_args()

    with open(args.csv_path, newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)

    plan = build_plan(headers, rows)
    masked = mask_with_plan(rows, plan)

    with open(args.output, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(masked)

    audit = AuditLog()
    audit.record(args.csv_path, list(plan), len(rows))
    print(f"masked {len(plan)} columns across {len(rows)} rows -> {args.output}")
    print(f"audit entries: {audit.count()}")
```

```bash
cat > users.csv <<'EOF'
id,full_name,email,phone,ssn,city
1,Ada Lovelace,ada@example.com,+1 555 0101,111-22-3333,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,444-55-6666,Arlington
EOF
uv run python masker.py users.csv --output masked.csv
```

La forme en ajout seul du journal d'audit est la discipline : *ne jamais réécrire* — chaque `record` ajoute une ligne JSON délimitée par des sauts de ligne, donc le journal est l'historique complet, impossible à réduire accidentellement. La CLI compose le pipeline entier en onze lignes parce que chaque étape est une fonction que tu as déjà écrite : `build_plan(headers, rows)` → `mask_with_plan(rows, plan)` → `DictWriter`.

**🎯 Résultat attendu :** `masked 4 columns across 2 rows -> masked.csv` puis `audit entries: 1` — et `masked.csv` partage les en-têtes de l'entrée avec les cellules sensibles masquées, `audit.jsonl` contenant une ligne JSON avec horodatage ISO.

**🩹 Si ça ne marche pas :** Si `masked.csv` est vide, `DictReader` a consommé le fichier mais aucune ligne n'a été lue — vérifie que le CSV n'est pas un unique en-tête sans données et que tu n'as pas ouvert `args.output` avant de fermer le lecteur. Si le compte d'audit monte de plus d'un par exécution, tu as appelé `record` dans une boucle au lieu d'une seule fois.

### 5.2 Vérifie la CLI

**✅ Liste de vérification**

- ✅ Après une exécution, `masked.csv` a des en-têtes identiques à la source et des valeurs identiques dans toutes les colonnes non sensibles.
- ✅ `audit.jsonl` contient exactement une ligne par exécution, avec un horodatage UTC, source, colonnes masquées et compte de lignes.
- ✅ Re-masquer le même fichier fonctionne encore (masquer des données masquées est correct — les plans ciblent les mêmes colonnes).

**🤔 Question(s) socratique(s)**

- L'audit enregistre *ce qui a été masqué* mais pas les *secrets* de masquage (les graines de hash ou la transformation spécifique). Enregistrer la graine rendrait-il le journal plus auditable ou plus dangereux — et que cela te dit-il sur les journaux d'audit détenant *juste assez* pour reproduire les résultats sans révéler la donnée ?
- `masker.py` écrit un nouveau fichier et ne touche jamais la source. Qu'une option `--in-place` devrait-elle ajouter (indice : l'audit — et quoi d'autre sur `output == csv_path`) avant qu'elle soit assez sûre pour être expédiée ?

## ⚠️ Pièges courants

- **Utiliser de l'aléatoire non ensemencé.** `random.shuffle` sans graine produit un jeu de données masqué différent à chaque exécution, ce qui casse les tests et rend « reproduis ce travail de masquage » impossible. Construis toujours `random.Random(seed)` explicitement.
- **Hacher sans penser au déterminisme.** `hash()` est salé par processus en Python et inutile ici ; `hashlib.sha256(...)` est stable. Aussi, les différences minuscules/caractères blancs changent silencieusement les hashs — normalise l'entrée ou documente que la casse compte.
- **Masquer en remplaçant les valeurs au lieu de permuter.** `salary * 1.1` change la distribution dont tes analyses de test dépendent. Si la forme doit survivre, permute ; ne transforme que lorsque tu veux que la forme dérive.
- **Préserver le format au-delà du point de confidentialité.** Garder 8 chiffres sur 10 d'un téléphone « pour le réalisme » fuit l'essentiel du numéro. Préserve la *forme*, pas les chiffres — les 4 derniers sont de toute façon les plus denses en information, donc même cela est un jugement qui vaut la peine d'être revisité.
- **Pas de piste d'audit.** Un masqueur qui ne peut pas répondre « quoi a été masqué, quand, où » échoue au but de conformité pour lequel il existe. Le JSONL en ajout seul, c'est dix lignes ; son absence est un drapeau rouge dans n'importe quelle vraie revue.

## Ce que tu viens de construire

Un masqueur de données fonctionnel : détection de colonnes par noms et motifs de valeurs, un zoo de stratégies du redact au format-préservateur, un plan auto-construit, une permutation préservant la distribution pour les nombres, et une piste d'audit en ajout seul — tout en bibliothèque standard, tout derrière un verbe CLI. La compétence transférable est l'*anonymisation adaptée au but* : choisir la destruction (redact), la pseudonymité (hash), la préservation de structure (format), ou la préservation de distribution (permute) en demandant ce dont la donnée aval a réellement besoin, puis prouver chaque choix avec une vérification plutôt qu'un espoir.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/data-masker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-masker) dans le dépôt du cours contient ces scripts complets plus des CSV d'échantillon et un audit pré-écrit. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute un mode **au niveau cellule** pour les colonnes de texte libre (masque seulement les cellules qui correspondent à la regex email/téléphone), en gardant les valeurs non sensibles de la colonne intactes — la réponse honnête à la question socratique de l'Étape 1.
- Rends le repli de style `ssn` plus intelligent avec un **registre de formes de valeurs** (groupes de `\d{3}-\d{2}-\d{4}` → masque SSN dédié) au lieu du hash fourre-tout.
- Émets des statistiques par stratégie dans l'entrée d'audit (colonnes dont le format est préservé, colonnes permutées, colonnes hachées) pour que les revues de conformité puissent survoler une ligne par job.
- Ajoute `--seed` comme drapeau CLI pour qu'une équipe partenaire puisse reproduire *ton exact* instantané masqué pour ses propres tests — la reproductibilité comme API publique.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓