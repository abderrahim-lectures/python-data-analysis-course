---
id: 2027-dependency-freshness-checker
title: "Construire un Vérificateur de Fraîcheur des Dépendances"
sidebar_label: "Vérificateur de Fraîcheur des Dépendances"
slug: /projects/dependency-freshness-checker
description: "Construis un vrai outil CLI qui lit un pyproject.toml, vérifie sur PyPI les versions plus récentes de chaque dépendance, et signale ce qui est obsolète — sans clé API nécessaire."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Vérificateur de Fraîcheur des Dépendances

<ProjectPublishedDate projectId="2027-dependency-freshness-checker" />

<ProjectGreeting />

Chaque vrai projet Python accumule des dépendances, et chaque dépendance finit par prendre du retard — un correctif de sécurité sort, un bug est corrigé, une nouvelle fonctionnalité arrive, et ton `pyproject.toml` ne le sait tout simplement pas. Ce projet construit l'outil qui te le dit : un vrai CLI qui lit un `pyproject.toml`, demande à l'API publique de PyPI quelle est réellement la version actuelle de chaque dépendance, et signale sur lesquelles tu as du retard — la même catégorie d'outil que `pip list --outdated`, mais un que tu comprends complètement parce que tu l'as construit toi-même.

C'est optionnel et non noté — un bon choix une fois que tu as terminé Python 101 (aucune expérience Analyse de Données ou de clé API nécessaire, ce projet n'utilise aucun service payant ou restreint du tout). Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Analyser un vrai fichier `pyproject.toml` et extraire sa liste de dépendances.
2. Interroger l'API JSON publique de PyPI pour trouver la version actuellement publiée de chaque dépendance.
3. Comparer ta version fixée/installée à la plus récente, en utilisant une vraie analyse de version sémantique — pas une comparaison naïve de chaînes.
4. Afficher un rapport de fraîcheur propre et catégorisé (à jour / obsolète / impossible à vérifier).

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et le recommandé — tu vas le pointer vers un vrai `pyproject.toml` (le propre dépôt de ce cours en a plusieurs, ou utilise n'importe lequel de tes projets). La section Configuration ci-dessous explique comment l'installer.

**GitHub Codespaces** est une alternative sans configuration si tu préfères ne rien installer localement pour l'instant : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés) et exécute exactement les mêmes commandes `uv` depuis un terminal dans ton onglet de navigateur — en plus tu auras plein de vrais fichiers `pyproject.toml` à proximité pour y pointer l'outil.

**Google Colab, Kaggle Notebooks, ou Binder** fonctionnent aussi, puisque ce projet n'a besoin ni de clé API ni de GPU — une version notebook réelle et exécutable vit dans [`examples/dependency-freshness-checker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb). Clique sur un badge pour le lancer directement, sans aucune installation locale :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdependency-freshness-checker%2Fnotebook.ipynb)

Sois honnête avec toi-même sur le compromis, cependant : un notebook ne peut vérifier que le contenu `pyproject.toml` d'exemple que tu y colles, pas pointer vers un vrai dossier de projet sur disque comme peut le faire le CLI local.

## Configuration

`uv` est un seul outil qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets » — il peut installer et gérer les versions de Python lui-même, en plus des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme que c'est installé :

```bash
uv --version
```

Puis configure le projet :

```bash
uv init dependency-checker
cd dependency-checker
uv add requests packaging
```

Aucune clé API n'est nécessaire nulle part dans ce projet — l'API JSON de PyPI (`https://pypi.org/pypi/<package>/json`) est publique, gratuite, et ne nécessite ni inscription ni authentification. `requests` gère les appels HTTP ; `packaging` te donne une vraie analyse correcte de version sémantique (`packaging.version.Version`) plutôt que de comparer des chaînes de version caractère par caractère, ce qui casse dès que tu compares `"2.9"` à `"2.10"` comme du texte brut.

:::tip[Pourquoi ne pas simplement comparer les versions comme des chaînes ?]
`"2.10.0" > "2.9.0"` est `True` mathématiquement, mais en tant que simples chaînes, `"2.10.0" < "2.9.0"` — parce que `"1" < "9"` caractère par caractère, Python n'arrive jamais assez loin pour remarquer que `10 > 9`. La vraie comparaison de versions doit analyser chaque partie comme un nombre d'abord. La bibliothèque `packaging` (la même que `pip` utilise en interne) fait ça correctement, y compris pour les versions pré-release comme `2.0.0rc1`.
:::

## Étape 1 : Analyse un vrai `pyproject.toml`

Python 3.11+ inclut `tomllib` dans la bibliothèque standard — aucune installation nécessaire pour *lire* du TOML (il faudrait seulement `uv add` un paquet si tu avais besoin d'*écrire* du TOML, ce que ce projet ne fait pas).

```python
# parse_deps.py
import tomllib
from pathlib import Path


def load_dependencies(pyproject_path: str) -> list[str]:
    """Read a pyproject.toml and return its raw dependency specifier strings,
    e.g. ["requests>=2.31", "packaging"]."""
    with Path(pyproject_path).open("rb") as f:
        data = tomllib.load(f)
    return data.get("project", {}).get("dependencies", [])


if __name__ == "__main__":
    deps = load_dependencies("pyproject.toml")
    for dep in deps:
        print(dep)
```

```bash
uv run python parse_deps.py
```

<StepChecklist>
  <StepChecklistItem>Exécuter ceci contre le `pyproject.toml` de ton propre projet affiche la chaîne de spécificateur brute de chaque dépendance.</StepChecklistItem>
  <StepChecklistItem>Tu peux expliquer pourquoi `tomllib` a besoin que le fichier soit ouvert en mode binaire (`"rb"`), pas en mode texte.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)** : La liste `dependencies` d'un `pyproject.toml` contient des chaînes comme `"requests>=2.31"` — pas juste des noms de paquets. Quel est le *nom* seul, séparé de toute contrainte de version qui lui est attachée ? Tu devras les séparer proprement à l'étape suivante, et une vraie chaîne de dépendance peut être plus désordonnée qu'elle n'y paraît (espaces supplémentaires, extras comme `"requests[socks]>=2.31"`, fixation exacte `==` au lieu de `>=`) — lesquels de ces cas casseraient un `.split(">=")` naïf ?

## Étape 2 : Recherche la version actuelle de chaque paquet sur PyPI

```python
# check_pypi.py
import re

import requests


def parse_package_name(specifier: str) -> str:
    """Extract just the package name from a specifier like 'requests>=2.31'
    or 'requests[socks]==2.31.0'."""
    match = re.match(r"^[A-Za-z0-9_.-]+", specifier.strip())
    if not match:
        raise ValueError(f"Could not parse a package name from {specifier!r}")
    return match.group(0)


def get_latest_version(package_name: str) -> str | None:
    """Query PyPI's public JSON API for a package's current published
    version. Returns None if the package isn't found (a typo, or a private
    package not on PyPI)."""
    url = f"https://pypi.org/pypi/{package_name}/json"
    response = requests.get(url, timeout=10)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()["info"]["version"]


if __name__ == "__main__":
    for specifier in ["requests>=2.31", "packaging", "not-a-real-package-xyz"]:
        name = parse_package_name(specifier)
        latest = get_latest_version(name)
        print(f"{name}: latest is {latest!r}")
```

```bash
uv run python check_pypi.py
```

Remarque le `"not-a-real-package-xyz"` délibérément cassé dans la liste de test — il devrait afficher `latest is None`, pas planter. Un vrai outil doit gérer avec élégance un nom de paquet mal orthographié ou privé, pas supposer que chaque nom dans un `pyproject.toml` se résout.

<StepChecklist>
  <StepChecklistItem>Les vrais paquets affichent leur vraie version PyPI actuelle — tu peux en vérifier une par recoupement sur pypi.org dans ton navigateur.</StepChecklistItem>
  <StepChecklistItem>Le faux nom de paquet affiche `None` plutôt que de faire planter le script.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)** : `response.raise_for_status()` s'exécute *après* la vérification explicite du 404 au-dessus — pourquoi isoler spécifiquement le 404 plutôt que de laisser `raise_for_status()` gérer chaque statut non-2xx de la même façon ? Qu'arriverait-il au flux de contrôle de ce script si cette vérification de 404 n'était pas là ?

## Étape 3 : Compare les versions correctement

```python
# compare.py
from packaging.version import InvalidVersion, Version


def is_outdated(current: str, latest: str) -> bool | None:
    """Compare two version strings properly. Returns None (not True/False)
    if either string isn't a version packaging can parse -- e.g. a git URL
    or a local path used as a 'version', which pyproject.toml permits."""
    try:
        return Version(current) < Version(latest)
    except InvalidVersion:
        return None


if __name__ == "__main__":
    print(is_outdated("2.9.0", "2.10.0"))  # True -- real semantic comparison
    print(is_outdated("2.10.0", "2.9.0"))  # False
    print(is_outdated("2.10.0", "2.10.0"))  # False -- equal, not outdated
    print(is_outdated("not-a-version", "2.10.0"))  # None -- can't compare
```

```bash
uv run python compare.py
```

<StepChecklist>
  <StepChecklistItem>`is_outdated("2.9.0", "2.10.0")` affiche `True`, prouvant que ce n'est pas une comparaison naïve de chaînes.</StepChecklistItem>
  <StepChecklistItem>Une chaîne de version non analysable retourne `None`, pas un plantage ou un `True`/`False` silencieusement erroné.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)** : Pourquoi `is_outdated` retourne-t-il trois résultats possibles (`True`, `False`, `None`) plutôt que juste deux ? Quelle situation réelle et non hypothétique dans un `pyproject.toml` ferait de `None` la *seule* réponse honnête ?

## Étape 4 : Assemble le tout en un vrai rapport de fraîcheur

```python
# freshness_report.py
from dataclasses import dataclass

from check_pypi import get_latest_version, parse_package_name
from compare import is_outdated
from parse_deps import load_dependencies


@dataclass
class DependencyStatus:
    name: str
    current_specifier: str
    latest: str | None
    outdated: bool | None


def build_report(pyproject_path: str) -> list[DependencyStatus]:
    report = []
    for specifier in load_dependencies(pyproject_path):
        name = parse_package_name(specifier)
        latest = get_latest_version(name)
        # A specifier with no pinned version (just "requests") has nothing
        # concrete to compare against -- treat that case as "unknown" too.
        pinned = specifier[len(name) :].lstrip(">=<~! ")
        outdated = is_outdated(pinned, latest) if pinned and latest else None
        report.append(DependencyStatus(name, specifier, latest, outdated))
    return report


def print_report(report: list[DependencyStatus]) -> None:
    outdated = [d for d in report if d.outdated is True]
    fresh = [d for d in report if d.outdated is False]
    unknown = [d for d in report if d.outdated is None]

    if outdated:
        print(f"⚠️  {len(outdated)} outdated:")
        for d in outdated:
            print(f"   {d.name}: pinned {d.current_specifier!r}, latest is {d.latest}")
    if fresh:
        print(f"✅ {len(fresh)} up to date: {', '.join(d.name for d in fresh)}")
    if unknown:
        print(f"❓ {len(unknown)} could not be checked: {', '.join(d.name for d in unknown)}")


if __name__ == "__main__":
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "pyproject.toml"
    print_report(build_report(path))
```

```bash
uv run python freshness_report.py pyproject.toml
```

Essaie de le pointer vers un `pyproject.toml` d'un vrai projet plus ancien que tu as sous la main (ou les propres fichiers `examples/*/pyproject.toml` de ce dépôt de cours) — c'est là que tu verras réellement le seau « obsolète » se remplir de vrais résultats, pas juste des dépendances à jour que tu as ajoutées il y a cinq minutes.

<StepChecklist>
  <StepChecklistItem>Exécuter le rapport contre le propre `pyproject.toml` de ton projet affiche un résumé catégorisé ✅/⚠️/❓.</StepChecklistItem>
  <StepChecklistItem>Le pointer vers un `pyproject.toml` intentionnellement plus ancien montre au moins une vraie dépendance obsolète.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)** : Ce script fait une requête HTTP par dépendance, l'une après l'autre. Pour un `pyproject.toml` avec 40 dépendances, quel est le coût vécu par l'utilisateur de cela — et quelle serait une façon concrète de l'accélérer (indice : ces requêtes ne dépendent pas du tout des résultats les unes des autres) ?

## ⚠️ Pièges courants

- **Comparaison naïve de versions comme chaînes.** `"2.9" > "2.10"` en tant que simples chaînes — c'est le bug le plus courant dans un vérificateur de versions fait maison. Analyse toujours avec `packaging.version.Version`, ne compare jamais les chaînes de version directement.
- **Supposer que chaque nom de dépendance se résout sur PyPI.** Les paquets privés/internes, les fautes de frappe, et les « dépendances » URL git sont toutes des choses réelles que `pyproject.toml` permet — ton script doit se dégrader avec élégance (un seau `None`/« inconnu »), pas faire planter tout le rapport pour une entrée inhabituelle.
- **Traiter une dépendance non fixée (`"requests"` sans aucune version) comme « obsolète ».** Il n'y a rien à comparer — c'est un cas différent et honnête d'« inconnu », pas un faux positif.
- **Marteler PyPI sans timeout.** Passe toujours `timeout=...` à `requests.get()` — une seule requête bloquée sans ça peut geler tout l'outil indéfiniment.

## Ce que tu viens de construire

Un vrai CLI de vérification de fraîcheur — la même idée centrale derrière `pip list --outdated`, Dependabot de GitHub, et Renovate, construite à partir des premiers principes : analyser un manifeste, interroger une vraie API publique, comparer les versions *correctement*, et rapporter le résultat clairement. Rien ici n'était caché derrière une bibliothèque qui fait la comparaison de versions à ta place — tu sais maintenant exactement pourquoi la comparaison naïve de chaînes casse et comment l'éviter, un détail qui fait trébucher pas mal d'outils faits maison dans la nature.

## Où aller à partir d'ici

- Accélère-le avec des requêtes concurrentes (`concurrent.futures.ThreadPoolExecutor` ou `asyncio` + `httpx`) — la question socratique ci-dessus est ton point de départ.
- Ajoute un mode `--fix` qui réécrit automatiquement les contraintes de version du `pyproject.toml` vers les dernières versions (attention : montre toujours un diff ou exige une confirmation avant d'écrire dans un vrai fichier — le même principe de sécurité utilisé ailleurs dans les projets de ce cours).
- Vérifie la date de sortie de PyPI, pas juste le numéro de version, et signale tout ce qui n'a pas été touché depuis plus d'un an comme potentiellement abandonné — un signal authentiquement différent et complémentaire à « est-ce obsolète ».
- Compare aussi contre les versions réellement installées de `uv.lock`, pas juste les spécificateurs de `pyproject.toml` — les deux peuvent légitimement diverger.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="2027-dependency-freshness-checker" />
