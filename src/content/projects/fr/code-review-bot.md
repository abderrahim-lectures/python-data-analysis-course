---
title: "Bot de Revue de Code IA"
description: "Revue de code automatisée qui détecte les bugs, suggère des améliorations et applique les guidelines de style."
difficulty: "intermediate"
estimatedMinutes: 75
xpReward: 100
tags: ["AI Agents", "Developer Tools", "APIs"]
prerequisites:
  - "Fonctions, listes et dictionnaires"
  - "Compréhensions de listes et de dictionnaires"
  - "Lire un fichier texte et écrire du JSON"
learningObjectives:
  - "Modéliser une pull request comme des lignes de code avec un nom de fichier"
  - "Encoder des règles de revue comme des données (nom, sévérité, test) au lieu de branches if"
  - "Attacher des commentaires par ligne et les agréger par sévérité"
  - "Calculer un verdict APPROVE/REJECT et exporter la revue en JSON"
  - "Relire le diff corrigé et voir le verdict basculer"
---

# 🛠️ 🤖 Construire un Bot de Revue de Code

Les bots de revue lisent chaque pull request pour que les humains n'aient pas à le faire — et avant qu'un LLM ne soit impliqué, un bot de revue est surtout fait de *règles*. Ce projet en construit un : un **agent de revue de code** déterministe qui prend un diff de PR simulé (`payment.py`), applique un registre de règles (longueur de ligne, espaces de fin, `except` nu, `print` de débogage, `TODO` non résolu, docstrings manquantes), attache un commentaire par ligne pour chaque correspondance, les agrège par sévérité, décide `REJECT` quand un problème majeur existe, exporte toute la revue comme payload JSON, puis relit le diff *corrigé* pour voir le verdict basculer vers `APPROVE`. Pas de réseau, pas d'aléatoire — le même diff produit toujours la même revue, ce qui rend justement les bots à règles auditable : chaque commentaire est retraçable jusqu'à un test.

Cela suppose fonctions, collections, entrées-sorties de fichiers et JSON. C'est un projet optionnel et non noté — vois [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Modéliser une pull request comme une liste nommée de lignes.
2. Écrire des règles comme des données — un registre sur lequel le bot boucle.
3. Relire un diff, attacher des commentaires et les agréger par sévérité.
4. Calculer le verdict et exporter le rapport en JSON.
5. Corriger les bloquants, relire, et voir `REJECT` → `APPROVE`.

## Où exécuter ceci

**En local** est le cadre naturel d'un outil de revue qui lit et écrit des fichiers.

```bash
mkdir code-review-bot && cd code-review-bot
touch review_bot.py
```

**Google Colab, Kaggle Notebooks et Binder** exécutent tout sans changement — chaque bloc est du Python pur. L'export JSON reste un fichier que tu peux ouvrir.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-review-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-review-bot/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcode-review-bot%2Fnotebook.ipynb)

## Configuration

Aucun paquet ; un seul fichier spécimen à relire.

### Crée la PR spécimen

```bash
mkdir code-review-bot && cd code-review-bot
touch review_bot.py
```

Enregistre ceci comme `payment.py` — la « PR sous revue ». Note les deux lignes avec espaces de fin et le `except:` exprès :

```python
def process_payment(total, tax_rate):       
    """Compute the final total."""
    discount = 0
    if total > 100:
        discount = total * 0.1
    try:
        final = total + (total * tax_rate) - discount
    except:  # noqa: E722
        print("something went wrong")
    return final

# TODO: add tests for negative totals
def apply_coupon(order_total, coupon):
    return order_total - coupon
# This comment is deliberately stretched out far beyond 72 chars to flag long lines. xxxxxxxxxxxxxxxx  
```

**✅ Liste de vérification**

- ✅ `payment.py` a **15 lignes** ; la ligne 1 et la ligne 15 se terminent par des espaces de fin (encore visibles dans un éditeur).
- ✅ `final` à la ligne 7 — la fonction qui a reçu une docstring — fonctionne comme ligne de base saine.
- ✅ `python3 review_bot.py` s'exécute sans sortie pour l'instant.

**🤔 Question(s) socratique(s)**

- Un relecteur intelligent *juge* ; ce bot *teste* seulement. Où est la frontière entre une règle que tu peux encoder comme `True/False` et un jugement qui a besoin d'un LLM ou d'un humain ?
- Le verdict du bot est soit `APPROVE`, soit `REJECT`. Quelle information un troisième état (`COMMENT`) apporterait-il à un processus de fusion où « approuver avec commentaires » est une vraie étape — et laquelle des règles ici le produirait-elle jamais ?

## Étape 1 : Modélise la PR

Un bot de revue parcourt des lignes. D'abord, un `load_pr` qui transforme le fichier en une structure que le bot peut scanner.

### 1.1 La PR comme des lignes

**👟 Indice de départ :** Un petit paquet sans dataclass : `{"file": "payment.py", "lines": [...]}`.

```python
# review_bot.py
import json

def load_pr(path):
    with open(path) as f:
        return {"file": path, "lines": f.read().splitlines()}

pr = load_pr("payment.py")
print("file:", pr["file"], "| lines:", len(pr["lines"]))
for i, ln in enumerate(pr["lines"], 1):
    print(f"{i:>2} |{ln}|")
```

`splitlines()` abandonne le `\n`, donc `pr["lines"]` est du *contenu pur* — une liste dont l'index (comme numéro de ligne) est ce vers quoi un commentaire pointe. Un paquet dict (nom de fichier + lignes) est la plus petite forme qu'un outil de revue peut donner à un moteur de règles, et il reflète la façon dont les vrais bots reçoivent une pull request (nom, puis lignes changées).

**🎯 Résultat attendu :**

```
file: payment.py | lines: 15
 1 |def process_payment(total, tax_rate):       |
 2 |    """Compute the final total."""|
 3 |    discount = 0|
 4 |    if total > 100:|
 5 |        discount = total * 0.1|
 6 |    try:|
 7 |        final = total + (total * tax_rate) - discount|
 8 |    except:  # noqa: E722|
 9 |        print("something went wrong")|
10 |    return final|
11 ||
12 |# TODO: add tests for negative totals|
13 |def apply_coupon(order_total, coupon):|
14 |    return order_total - coupon|
15 |# This comment is deliberately stretched out far beyond 72 chars to flag long lines. xxxxxxxxxxxxxxxx  |
```

**🩹 Si ça ne marche pas :** Si `lines` en montre 16, un saut de ligne final orphelin a ajouté un élément vide (ou ton éditeur en a ajouté un) — `splitlines()` le gère, mais recompte le fichier. Si les enveloppes `|…|` perdent les espaces de fin de la ligne 1, ton éditeur a auto-coupé le spécimen (recolle-le).

### 1.2 Vérifie

**✅ Liste de vérification**

- ✅ `pr` est un dict avec `file` et `lines` ; 15 lignes au total.
- ✅ La ligne 1 et la ligne 15 montrent visuellement des espaces de fin dans `|…|`.
- ✅ L'indexage correspond : `pr["lines"][7]` est la ligne `except:` (basée 0) — les positions de règles s'écrivent `i+1`.

**🤔 Question(s) socratique(s)**

- Le dict regroupe `file` et `lines`. Si tu relisais une *vraie* PR GitHub, quels deux ou trois champs l'entrée du bot devrait-elle avoir au-delà du contenu (ex. SHA du commit, auteur) ? Pourquoi ces éléments font-ils partie de la *piste d'audit* d'un commentaire ?
- Les numéros de ligne sont basés sur 1 pour les humains, mais Python indexe en base 0. Chaque commentaire que tu produis portera `line = i + 1`. Où se cache le bug si une règle oublie le `+1` ?

## Étape 2 : Les règles comme données

L'intelligence du bot est un *registre* — des règles encodées comme des données sur lesquelles le moteur boucle, donc ajouter une règle signifie ajouter un dict, pas une branche if.

### 2.1 Le registre

**👟 Indice de départ :** Chaque règle est `(name, severity, test)` où `test(line) -> bool` ; `MAX_LINE` plafonne la longueur de ligne.

```python
# review_bot.py (continued)
MAX_LINE = 72

RULES = [
    {"name": "line-length", "severity": "minor",
     "test": lambda ln: len(ln) > MAX_LINE},
    {"name": "trailing-space", "severity": "minor",
     "test": lambda ln: ln != ln.rstrip()},
    {"name": "bare-except", "severity": "major",
     "test": lambda ln: ln.lstrip().startswith("except:")},
    {"name": "debug-print", "severity": "minor",
     "test": lambda ln: "print(" in ln},
    {"name": "todo-marker", "severity": "info",
     "test": lambda ln: "TODO" in ln or "FIXME" in ln},
    {"name": "missing-docstring", "severity": "minor",
     "test": lambda ln: False},  # needs line context, wired next
]
```

Chaque règle est un dict simple : un nom, une sévérité et un test pur. Le test du except nu est une sur-correspondance honnête (`except:`), et `missing-docstring` est délibérément bouché à `False` jusqu'à ce que l'Étape 2.2 lui donne du contexte. Un registre construit à partir de données est ce qui rend le bot *maintenable* — tu pourras plus tard l'étendre depuis un fichier de config sans éditer le moteur.

**🎯 Résultat attendu :** Rien encore — RULES est des données. Vérifie chaque test à la main : `len("…") > 72` est la longueur de ligne ; `ln != ln.rstrip()` est l'espace de fin.

### 2.2 Les docstrings ont besoin de contexte

**👟 Indice de départ :** Un test de docstring qui regarde les quelques lignes *après* un `def` — une fonction a une docstring si sa prochaine ligne non vide `startswith('"""')`.

```python
# review_bot.py (continued)
def has_docstring(lines, idx):
    for ln in lines[idx:idx + 3]:
        if ln.strip() == "":
            continue
        return ln.lstrip().startswith('"""')
    return False

RULES.append({"name": "missing-docstring", "severity": "minor",
              "test": lambda ln: ln.lstrip().startswith("def ") and
                                 not has_docstring(pr["lines"], 0)})
```

Attends — une lambda ne peut pas atteindre l'index de la *ligne actuelle*, donc ce branchement naïf vérifiera `pr["lines"][0]` pour toujours. La bonne forme est un test qui prend l'*index*, pas la ligne. Réécris le registre pour que chaque test reçoive `(lines, i)` :

```python
# review_bot.py (continued)
def t_missing_docstring(lines, i):
    return lines[i].lstrip().startswith("def ") and not has_docstring(lines, i)

RULES = [
    {"name": "line-length", "severity": "minor",
     "test": lambda lines, i: len(lines[i]) > MAX_LINE},
    {"name": "trailing-space", "severity": "minor",
     "test": lambda lines, i: lines[i] != lines[i].rstrip()},
    {"name": "bare-except", "severity": "major",
     "test": lambda lines, i: lines[i].lstrip().startswith("except:")},
    {"name": "debug-print", "severity": "minor",
     "test": lambda lines, i: "print(" in lines[i]},
    {"name": "todo-marker", "severity": "info",
     "test": lambda lines, i: "TODO" in lines[i] or "FIXME" in lines[i]},
    {"name": "missing-docstring", "severity": "minor",
     "test": t_missing_docstring},
]
```

Tous les tests reçoivent maintenant `(lines, i)` — la plupart ignorent l'index ; la règle de docstring en a besoin. Cette uniformité est le contrat qui permet au moteur (Étape 3) de rester bête et correct.

**🎯 Résultat attendu :** Rien — mais en relisant la liste, tu peux déjà prédire sur quelles lignes chaque test se déclenchera (1 et 15 pour l'espace de fin, 8 pour le except nu, 9 pour le print de débogage, 12 pour le todo, 13 pour la docstring, 15 pour la longueur).

### 2.3 Vérifie

**✅ Liste de vérification**

- ✅ Six règles nommées avec leurs sévérités ; chacune est un test pur sur `(lines, i)`.
- ✅ `missing-docstring` utilise le test contextuel `t_missing_docstring`, pas le bouchon naïf.
- ✅ Les sévérités correspondent à la politique : `major` uniquement pour le `except` nu ; le reste `minor`/`info`.

**🤔 Question(s) socratique(s)**

- Le test du except nu correspond à `except:` mais pas à `except Exception:` — ce dernier est *plus* spécifique et, à vrai dire, acceptable. Encoderais-tu `except Exception:` comme sa propre règle ou apprendrais-tu au test à parler de `except ValueError:` ? Quelle est l'amélioration en une ligne ?
- Les règles-comme-données signifient que le moteur ne sait pas ce qu'une « règle » signifie. Si un futur bot ajoutait une règle *ML* (「cette ligne sent le bug」), comment la sévérité lui serait-elle assignée — et qu'est-ce qui fait des règles déterministes ici une bonne *référence* contre laquelle couvrir une règle ML ?

## Étape 3 : Exécute la revue

Le moteur : boucle chaque règle contre chaque ligne, attache un commentaire par correspondance.

### 3.1 Le moteur de commentaires

**👟 Indice de départ :** `review(pr)` itère `(rule, line_index)`, exécute `rule["test"]`, ajoute un dict commentaire.

```python
# review_bot.py (continued)
def review(pr):
    comments = []
    lines = pr["lines"]
    for i in range(len(lines)):
        for rule in RULES:
            if rule["test"](lines, i):
                comments.append({
                    "file": pr["file"],
                    "line": i + 1,            # 1-based for humans
                    "rule": rule["name"],
                    "severity": rule["severity"],
                    "code": lines[i].rstrip(),
                })
    return comments

comments = review(pr)
print("comments:", len(comments))
for c in comments:
    print(f"{c['line']:>2} {c['severity']:<5} {c['rule']:<16} {c['code'][:40]}")
```

Une seule boucle imbriquée règles × lignes est tout le moteur — ajouter une règle ou une ligne ne change rien ici. Chaque commentaire porte `file`, `line` basé sur 1, `rule`, `severity` et l'extrait de code *epuré*, pour qu'un humain puisse le lire sans ouvrir le fichier. `code = lines[i].rstrip()` garde le message court pendant que `line` épingle l'emplacement exact.

**🎯 Résultat attendu :**

```
comments: 7
 1 minor trailing-space    def process_payment(total, tax_rate):
 8 major bare-except       except:  # noqa: E722
 9 minor debug-print       print("something went wrong")
12 info  todo-marker       # TODO: add tests for negative totals
13 minor missing-docstring def apply_coupon(order_total, coupon):
15 minor line-length       # This comment is deliberately stretched out far beyond 72 chars to flag long line
15 minor trailing-space    # This comment is deliberately stretched out far beyond 72 chars to flag long line
```

**🩹 Si ça ne marche pas :** Si la ligne 15 n'apparaît qu'une fois, une de ses deux règles ne s'est pas déclenchée (elle est *à la fois* longue *et* avec espace de fin — deux tests indépendants, deux commentaires). Si la ligne 8 manque, `lstrip().startswith("except:")` a buté sur le suffixe `  # noqa` — il ne devrait pas ; la règle teste le *début*.

### 3.2 Résumé par sévérité

**👟 Indice de départ :** `Counter` sur les sévérités, puis le verdict : `REJECT` s'il y a un `major`.

```python
# review_bot.py (continued)
from collections import Counter

counts = Counter(c["severity"] for c in comments)
print("BY SEVERITY:", dict(counts))
verdict = "REJECT" if counts.get("major", 0) else "APPROVE"
print("VERDICT:", verdict)
```

Sept commentaires, c'est du bruit ; `{major:1, minor:5, info:1}` est le signal. Le verdict est un booléen : le `except` nu qui avale chaque type d'exception est le bloquant — tout le reste est du poli. L'agrégation par sévérité est ce qui transforme un mur de commentaires en décision de fusion.

**🎯 Résultat attendu :**

```
BY SEVERITY: {'major': 1, 'minor': 5, 'info': 1}
VERDICT: REJECT
```

**🩹 Si ça ne marche pas :** Si `minor` totalise 4, une règle a calé (ex. `missing-docstring` encore sur le bouchon d'avant l'Étape 2.2 — elle en ajoute un). Si le verdict lit `APPROVE`, `counts.get("major", 0)` a été changé en `counts["major"]` et a planté/ne fait rien — garde le `.get`.

### 3.3 Vérifie

**✅ Liste de vérification**

- ✅ 7 commentaires : espace de fin ×2 (1, 15), longueur de ligne (15), except nu (8), print de débogage (9), todo (12), docstring manquante (13).
- ✅ `{'major': 1, 'minor': 5, 'info': 1}` ; `VERDICT: REJECT`.
- ✅ Chaque commentaire porte fichier, ligne basée sur 1, règle, sévérité et un extrait de code épuré.

**🤔 Question(s) socratique(s)**

- La ligne 15 a gagné *deux* commentaires de *deux* règles. Existe-t-il un « trop de commentaires » sur une seule ligne — et quelle politique de déduplication (ex. un commentaire par règle par ligne, ou un regroupement par ligne) un relecteur humain remercierait-il le bot d'avoir ?
- Le verdict ignore entièrement `info`. Si la politique du dépôt était « les TODO doivent être résolus pour fusionner », `todo-marker` deviendrait un *major*. Qu'est-ce que cela dit sur la politique que le bot encode — et comment la paramétrerais-tu par dépôt sans réécrire les règles ?

## Étape 4 : Exporte le rapport

Une revue sur laquelle personne ne peut agir est une pensée. L'Étape 4 exporte les commentaires en JSON et affiche un résumé humain.

### 4.1 Le payload JSON

**👟 Indice de départ :** `json.dump` de la revue complète sur un payload en forme d'API : `verdict`, `counts`, `comments`.

```python
# review_bot.py (continued)
report = {
    "verdict": verdict,
    "counts": dict(counts),
    "comments": comments,
}

with open("review.json", "w") as f:
    json.dump(report, f, indent=2)
print("Wrote review.json with", len(comments), "comments")
```

`review.json` est le livrable *machine* — un payload en forme d'API (`verdict`, `counts`, `comments`) qu'un autre outil (un bot GitHub, une porte CI, un hook de notification) peut consommer sans relancer la logique Python. `indent=2` garde aussi le fichier lisible par un humain.

**🎯 Résultat attendu :** `Wrote review.json with 7 comments` — et le fichier s'ouvre avec

```json
{
  "verdict": "REJECT",
  "counts": {
    "major": 1,
    "minor": 5,
    "info": 1
  },
  "comments": [...]
}
```

**🩹 Si ça ne marche pas :** Si le JSON est une ligne incompressible, `indent=2` a été abandonné. Si `report["comments"]` s'affiche comme `[]`, tu as ajouté chaque dict commentaire à une *copie* (ex. `c = review(pr)` deux fois) — appelle `review` une seule fois.

### 4.2 Le résumé humain

**👟 Indice de départ :** Affiche un top-3 « quoi corriger en premier » depuis `major` puis dans l'ordre de sévérité, et où regarder.

```python
# review_bot.py (continued)
order = {"major": 0, "minor": 1, "info": 2}
lines_by_rule = {}
for c in comments:
    lines_by_rule.setdefault(c["rule"], []).append(c["line"])

print("SUMMARY")
print(f"  verdict: {verdict}")
print(f"  comments: {len(comments)} ({counts.get('major', 0)} major, "
      f"{counts.get('minor', 0)} minor, {counts.get('info', 0)} info)")
for rule in sorted(lines_by_rule, key=lambda r: order.get(
        RULES[[x['name'] for x in RULES].index(r)]['severity'], 2)):
    print(f"  {rule}: lines {sorted(lines_by_rule[rule])}")
```

Le résumé réordonne les règles par sévérité pour que la *première* chose qu'un développeur lise soit le bloquant, puis les éléments de poli. Les numéros de ligne triés leur permettent de sauter directement à chaque correction.

**🎯 Résultat attendu :**

```
SUMMARY
  verdict: REJECT
  comments: 7 (1 major, 5 minor, 1 info)
  bare-except: lines [8]
  line-length: lines [15]
  missing-docstring: lines [13]
  trailing-space: lines [1, 15]
  debug-print: lines [9]
  todo-marker: lines [12]
```

**🩹 Si ça ne marche pas :** Si l'ordre des règles est alphabétique sans égard à la sévérité, la recherche de la `key` de correspondance est cassée — cette danse d'index est fragile ; simplifie en stockant `severity` dans chaque commentaire et en triant les commentaires directement (`sorted(comments, key=lambda c: order[c["severity"]])`).

### 4.3 Vérifie

**✅ Liste de vérification**

- ✅ `review.json` a verdict, counts, comments ; 7 commentaires dedans.
- ✅ Le résumé humain liste bare-except en premier (le seul major), les autres groupés par règle avec des numéros de ligne triés.
- ✅ Le JSON et le résumé racontent la même histoire — des comptes identiques des deux côtés.

**🤔 Question(s) socratique(s)**

- Le dict `comment` porte déjà `severity`, pourtant le résumé la redérive de `RULES` par nom. Quel bug dans cette recherche (une règle renommée) révèle la *duplication* entre la source de vérité des données et le rapport — et quel changement d'une ligne rendrait les commentaires auto-descriptifs ?
- Un vrai bot publie `review.json` à un endpoint d'API. Quels champs ajouterais-tu *avant* de le livrer à l'API de GitHub — ex. `commit_sha`, `pull_request`, `author` — et pourquoi un audit les veut-il dans le payload, pas seulement dans le log ?

## Étape 5 : Relis après corrections

La récompense : un développeur corrige les bloquants, le bot se relance, et le verdict bascule.

### 5.1 Corrige le diff

**👟 Indice de départ :** Corrige les deux problèmes liés au `major` — une exception spécifique au lieu du `except` nu, et une ligne 15 raisonnable.

```python
# review_bot.py (continued)
fixed_lines = list(pr["lines"])
fixed_lines[7] = "    except ValueError:  # noqa: E722"
fixed_lines[14] = "# This comment is now a sane length."

fixed_pr = {"file": "payment.py", "lines": fixed_lines}
fixed_comments = review(fixed_pr)
fixed_counts = Counter(c["severity"] for c in fixed_comments)
fixed_verdict = "REJECT" if fixed_counts.get("major", 0) else "APPROVE"
print("FIXED BY SEVERITY:", dict(fixed_counts))
print("NEW VERDICT:", fixed_verdict)
```

Une copie de liste (`list(pr["lines"])`) puis des écritures ciblées par index tiennent lieu des « modifications du développeur ». `except ValueError:` garde le gestionnaire spécifique (un `except` nu doit devenir une exception *nommée* ou la règle se déclenche encore).

**🎯 Résultat attendu :**

```
FIXED BY SEVERITY: {'minor': 3, 'info': 1}
NEW VERDICT: APPROVE
```

**🩹 Si ça ne marche pas :** Si `major` vaut encore 1, le remplacement n'a pas atterri sur `fixed_lines[7]` (l'index 7 est la ligne 8 — vérifie la base 0 !). Si minor est encore à 5, la ligne 15 n'a pas été raccourcie sous 72 caractères.

### 5.2 La boucle d'agent complète

**👟 Indice de départ :** Un `run_review(pr)` qui retourne verdict + rapport, pour qu'un appelant puisse relire, corriger et relire dans une boucle.

```python
# review_bot.py (continued)
def run_review(pr, out="review.json"):
    comments = review(pr)
    counts = Counter(c["severity"] for c in comments)
    verdict = "REJECT" if counts.get("major", 0) else "APPROVE"
    report = {"verdict": verdict, "counts": dict(counts), "comments": comments}
    with open(out, "w") as f:
        json.dump(report, f, indent=2)
    return verdict, report

v1, r1 = run_review(pr)
v2, r2 = run_review(fixed_pr, out="review_v2.json")
print(v1, "->", v2)
print("comments", len(r1["comments"]), "->", len(r2["comments"]))
```

Envelopper tout le pipeline dans un `run_review(pr, out=…)` rend le bot *réutilisable* — relire, corriger, relire avec deux appels. Le fichier de sortie versionné (`review_v2.json`) est la piste d'audit que la boucle produit.

**🎯 Résultat attendu :**

```
REJECT -> APPROVE
comments 7 -> 4
```

**🩹 Si ça ne marche pas :** Si la première ligne affiche `APPROVE -> APPROVE`, `run_review` n'a pas hérité de la logique de sévérité (dérive copier-coller entre `review` et la ligne de verdict). Si les comptes lisent `7 -> 5`, la ligne 15 corrigée porte encore un espace de fin.

### 5.3 Vérifie

**✅ Liste de vérification**

- ✅ Première revue : 7 commentaires, `REJECT` (le except nu est major).
- ✅ Après avoir corrigé `except:` → `except ValueError:` et raccourci la ligne 15 : 4 commentaires, `APPROVE`.
- ✅ `review.json` et `review_v2.json` écrits tous les deux — l'historique complet des décisions du bot survit.

**🤔 Question(s) socratique(s)**

- La boucle est manuelle ici (tu as exécuté `run_review` deux fois). Un vrai bot appellerait `run_review` sur *chaque* push. Quelle condition d'arrêt ou quel délai garderait un bot autonome de relire sans fin une PR qui ne converge jamais ?
- `REJECT` signifie ici « un problème majeur ». Ce bot n'a aucune notion de *taux de rappel* (a-t-il raté un vrai bug ?) ni de *précision* (ses commentaires étaient-ils du bruit ?). Les bots de revue sont généralement réglés sur les deux. Si tu avais un corpus de PR déjà fusionnées, comment mesurerais-tu la précision vs le rappel de ces six règles ?

## ⚠️ Pièges courants

- **Dérive base 0 vs base 1.** Le moteur indexe `lines[i]` en base 0 ; chaque *commentaire* rapporte `i + 1`. Une règle qui oublie le `+1` épingle son commentaire une ligne à côté pour toujours.
- **Les règles contextuelles comme lambdas.** `t_missing_docstring` exige `(lines, i)` ; une lambda coincée à vérifier `pr["lines"][0]` signale silencieusement chaque `def` (ou, pire, aucun). Donne à *toutes* les règles la même signature `(lines, i)`.
- **Faux négatifs du except nu.** `except:` est attrapé ; `except Exception:` non. Décide la politique et encode le startswith exactement (`except:`), jamais `"except" in line` (qui se déclenche sur des commentaires comme `# except: …`).
- **Espace de fin = lignes uniquement composées d'espaces.** Une ligne de trois espaces échoue `ln != ln.rstrip()` — signalée comme espace de fin, ce qui est, à vrai dire, du bruit de *ligne vide*. Déduplique les suites de vides avant la boucle de revue si cela offense le rapport.
- **Muter le spécimen en place.** `fixed_lines = pr["lines"]` (sans copie) modifierait la PR *originale* pendant que tu la « corriges » — et `review.json` refléterait silencieusement les modifications. Copie avant de réécrire.
- **Vérifier le JSON deux fois.** Ouvrir `review.json` avant que `run_review` ait fini (ou relancer `review` deux fois) donne des payloads périmés ou doublés. Un appel `run_review` par état, une écriture.

## Ce que tu viens de construire

Un bot de revue de code de bout en bout : une PR modélisée comme `{file, lines}`, un registre règles-comme-données de six tests déterministes, un moteur de deux lignes qui score chaque règle × chaque ligne, des commentaires par ligne avec sévérité et extrait de code, un verdict `REJECT`/`APPROVE` conditionné par `major`, un payload JSON plus un résumé humain, et une boucle de re-revue qui a fait basculer le verdict une fois le `except` nu nommé. La colonne vertébrale transférable — **les règles comme des données pour que le moteur reste générique**, **les commentaires épinglés à des numéros de ligne basés sur 1 avec un payload programmatique**, **l'agrégation par sévérité qui pilote un verdict booléen unique**, **le diff corrigé relu pour prouver la boucle** — est exactement ainsi que les vrais bots de revue CI sont construits avant (ou parallèlement à) toute couche de jugement LLM.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/code-review-bot/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/code-review-bot) dans le dépôt du cours contient le bot complet comme notebook — modèle de PR, registre de règles, moteur, export JSON et la boucle corriger-et-relire, exécutable dans Colab/Kaggle/Binder. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Tout est de la donnée — **charge les règles depuis du JSON** au lieu de coder `RULES` en dur, pour que `review_bot.py` reste inchangé quand une règle change.
- Fais du bot un **CLI** : `python3 review_bot.py payment.py [--out review.json]`, en lisant `sys.argv` comme dans les projets précédents.
- Ajoute une **règle contextuelle** : signale les blocs `try:` dont le `except` est *nu* seulement quand la largeur compte — ou une règle qui vérifie le `return` sur chaque branche d'un `if`.
- Compare à un vrai relecteur : exécute **ruff** (`pip install ruff`) sur `payment.py` et fais correspondre chaque code `E…`/`W…` à tes règles — un audit honnête de ce que des règles écrites à la main ratent.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓