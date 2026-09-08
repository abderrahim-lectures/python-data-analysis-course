---
title: "Générateur de Tests IA"
description: "Générez automatiquement des tests unitaires, des cas limites et des tests basés sur des propriétés à partir du code source."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Developer Tools", "Testing", "LLMs"]
prerequisites:
  - "Fonctions, valeurs par défaut/arguments et compréhensions de listes"
  - "Un modèle mental basique de ce qu'est un test unitaire (assert + sortie attendue)"
  - "Aucune expérience de pytest nécessaire — le générateur écrit les tests pour toi"
learningObjectives:
  - "Lire la signature d'une fonction et les métadonnées de ses paramètres avec inspect.signature"
  - "Dériver des entrées de test aux valeurs limites depuis les valeurs par défaut des paramètres au lieu de deviner à la main"
  - "Synthétiser un module pytest de manière programmatique depuis ces entrées plus des vérifications de propriétés"
  - "Composer un prompt LLM de « test d'intention » et dégrader avec élégance quand aucune clé API n'existe"
  - "Exécuter la suite générée comme sous-processus et transformer son code de sortie en verdict"
---

# 🛠️ 🧪 Construire un Générateur de Tests IA

Écrire des tests à la main donne l'impression de retaper la fonction que tu viens d'écrire, mais plus lentement. Ce projet construit l'inverse : un générateur qui *lit* une fonction cible — sa signature, ses valeurs par défaut et son comportement — et produit une suite pytest qui exerce de vraies valeurs limites, de vraies propriétés (comme l'idempotence), et un filet de sécurité pour les arguments inversés. Une couche LLM optionnelle rédige des « tests d'intention » qui capturent ce que la fonction est *censée* faire, et la suite complète s'exécute comme sous-processus pour que ton outil rende son verdict en une seule ligne. La fonction cible est un minuscule `clamp`, donc chaque test généré est facile à relire à l'œil — la machinerie, pas les maths, est le sujet.

Ceci suppose une bonne maîtrise des valeurs par défaut de fonctions et de la compréhension de listes ; rien ici n'est noté, c'est optionnel et non noté — voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Inspecter la signature d'une fonction et découvrir quels paramètres ont des valeurs par défaut et lesquels n'en ont pas.
2. Générer des entrées candidates aux limites depuis ces valeurs par défaut — pas en devinant.
3. Rendre ces candidats dans un vrai module pytest, avec les tests de propriétés et de garde.
4. Composer un prompt LLM de « test d'intention » et sauter l'appel API avec élégance quand aucune clé n'est configurée.
5. Exécuter la suite générée via un sous-processus et traduire la sortie en verdict.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — tout le but est de générer de vrais fichiers de tests `.py` sur ton disque et de les exécuter, ce que `uv add pytest` rend instantané.

**Google Colab, Kaggle Notebooks et Binder** exécuteront chaque étape : `!pip install pytest` puis `import pytest` — le générateur écrit un fichier `test_*.py` dans le répertoire de travail du notebook, et `subprocess` l'exécute dans le même environnement. Les notebooks sont un bon cadre ; la seule chose qu'ils ne peuvent pas te donner, c'est un `test_clamp_simple.py` permanent une fois la session terminée.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-test-generator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-test-generator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-test-generator%2Fnotebook.ipynb)

## Configuration

Tout ce qui est nécessaire avant la génération : un projet avec pytest, et une fonction cible glorieusement simple à pointer vers le générateur.

### Mets en place le projet

```bash
uv init ai-test-generator
cd ai-test-generator
uv add pytest
```

`pytest` alimente à la fois la suite générée *et* l'exécuteur de liste de cas naïf de l'Étape 5. Les étapes suivantes supposent que tu écris tout le code dans un seul fichier, `testgen.py`.

**✅ Liste de vérification**

- ✅ `uv add pytest` se termine, et `uv run python -m pytest --version` affiche une version.
- ✅ Tu as `testgen.py` créé et prêt pour l'Étape 1.

**🤔 Question(s) socratique(s)**

- Le générateur cible `clamp`, une fonction avec des paramètres à valeurs par défaut. Quelle partie de `inspect.signature` te dit qu'un paramètre *exige* un argument, et pourquoi le générateur devra-t-il traiter ces deux types de paramètres différemment ?
- Chaque test que le générateur écrit est *exécuté* à la fin, mais seulement en comparant le comportement à une valeur attendue qu'il a aussi générée. Où « la machine teste la machine » devient-il circulaire, et quel type de test ne peut pas être simulé de cette façon ?

## Étape 1 : Lis la signature de la cible

### 1.1 Définis la cible et affiche sa signature

**👟 Indice de départ :** Écris `clamp(value, low=0.0, high=1.0)` — le classique garde-fou numérique — puis demande à `inspect.signature` ce qu'il sait.

```python
# testgen.py
import inspect

def clamp(value, low=0.0, high=1.0):
    """Clamp a number into [low, high]."""
    return max(low, min(value, high))

sig = inspect.signature(clamp)
for name, param in sig.parameters.items():
    print(name, "kind=", param.kind, "default=", param.default)
```

`clamp` retourne `max(low, min(value, high))` — une seule ligne, mais dense : elle épingle `value` par le bas à `low` et par le haut à `high`. `inspect.signature` retourne une `Signature` dont `.parameters` fait correspondre chaque nom d'argument à un `Parameter` portant `.kind` (comment il peut être passé) et `.default`.

**🎯 Résultat attendu :**

```
value kind= POSITIONAL_OR_KEYWORD default= <class 'inspect._empty'>
low kind= POSITIONAL_OR_KEYWORD default= 0.0
high kind= POSITIONAL_OR_KEYWORD default= 1.0
```

**🩹 Si ça ne marche pas :** Si `sig.parameters` est vide, la boucle `for` lit le mauvais appelable — affiche `sig` et vérifie qu'il indique `(value, low=0.0, high=1.0)`. Si `default=` n'affiche rien pour `low`, `clamp` a été définie sans valeurs par défaut.

### 1.2 Répère quelles valeurs par défaut sont réelles

**👟 Indice de départ :** Écris un petit prédicat `has_default(param)` — `inspect.Parameter.empty` est un *marqueur*, donc le test `is` est la forme correcte.

```python
# testgen.py (continued)
def has_default(param: inspect.Parameter) -> bool:
    return param.default is not inspect.Parameter.empty

for name, param in sig.parameters.items():
    print(name, "requires argument:", not has_default(param))
```

Les `is`/`is not` de Python sur les singletons sont la comparaison idiomatique — `Parameter.empty` est un objet sentinelle, et `==` peut être trompé par n'importe quoi que tu nommes involontairement à l'identique. Le générateur a besoin de cette distinction pour savoir que `low`/`high` ont des valeurs de départ utilisables tandis que `value` a besoin d'hypothèses faites main.

**🎯 Résultat attendu :** `value requires argument: True`, puis `False` pour `low` et `high` tous les deux.

**🩹 Si ça ne marche pas :** Si `low` indique `requires argument: True`, tu as comparé avec `==` ou `is` à un `inspect.Parameter.empty` *frais* — utilise `param.default is not inspect.Parameter.empty` tel quel.

### 1.3 Vérifie l'inspection

**✅ Liste de vérification**

- ✅ Les trois noms de paramètres, kinds et valeurs par défaut s'affichent exactement comme dans 1.1.
- ✅ `has_default` distingue `value` de `low`/`high` correctement.
- ✅ `sig.parameters["low"].default` est `0.0` (un float, pas une chaîne).

**🤔 Question(s) socratique(s)**

- `sig` est calculé une fois et réutilisé partout. Qu'est-ce qui casse si les tests générés sont écrits contre une version *ultérieure* et modifiée de `clamp` — et pourquoi est-il plus sûr de régénérer depuis la signature vivante que de la mettre en cache ?
- Les valeurs par défaut des paramètres sont des objets Python, donc `clamp(value, low=0, high=1)` (des entiers) produit `0`/`1`, pas `0.0`/`1.0`. Quelle ligne de test généré différerait silencieusement, et est-ce une différence de test ou une différence de type ?

## Étape 2 : Génère des entrées limites depuis les valeurs par défaut

Écrire à la main les entrées de test, c'est tester ce que tu *avais imaginé* être dangereux. Ce générateur dérive au contraire les candidats depuis la signature elle-même : chaque valeur par défaut, décalée au-dessus et en dessous, plus les bords numériques canoniques.

### 2.1 Construis l'aide aux valeurs limites

**👟 Indice de départ :** Pour un paramètre avec valeur par défaut, produis `[default-1, default-0.1, default, default+0.1, default+1]` plus `0.0` et `1.0`, dédupliqués ; pour un paramètre sans valeur par défaut, retombe sur le jeu de sondes classique `[-1.0, 0.0, 0.5, 1.0]`.

```python
# testgen.py (continued)
def edge_values(param: inspect.Parameter) -> list[float]:
    if not has_default(param):
        return [-1.0, 0.0, 0.5, 1.0]
    d = param.default
    probes = {d - 1.0, d - 0.1, d, d + 0.1, d + 1.0, 0.0, 1.0}
    return sorted(round(x, 2) for x in probes)

for name, param in sig.parameters.items():
    print(name, "->", edge_values(param))
```

Les sondes sont le *vocabulaire des limites* des fonctions numériques : un pas au-dessus et en dessous d'une borne, la borne elle-même, et les deux ancres `0.0`/`1.0`. `round(x, 2)` est le garde-fou de la réalité — le point flottant binaire rend `0.1` véritablement laid (par ex. `0.10000000000000003`), et les tests générés doivent comparer des littéraux décimaux propres.

**🎯 Résultat attendu :**

```
value -> [-1.0, 0.0, 0.5, 1.0]
low -> [-1.0, -0.1, 0.0, 0.1, 1.0]
high -> [0.0, 0.9, 1.0, 1.1, 2.0]
```

**🩹 Si ça ne marche pas :** Si une ligne affiche `0.10000000000000003` au lieu de `0.1`, le `round` a été supprimé. Si `value` affiche des floats construits depuis `d` (alors qu'elle n'a pas de `d`), `has_default` a retourné `True` pour un paramètre sans valeur par défaut — la comparaison de sentinelle a été inversée.

### 2.2 Explique les choix avant d'exécuter

**👟 Indice de départ :** Affiche la *raison* pour laquelle chaque candidat a été choisi — un test généré sans explication n'est que du bruit.

```python
# testgen.py (continued)
for name, param in sig.parameters.items():
    values = edge_values(param)
    note = "handpicked probe set" if not has_default(param) else "nudged around the default"
    print(f"{name}: {values} ({note})")
```

Accrocher une raison explicite à chaque candidat rend le générateur auditable : quand un futur relecteur demande « pourquoi tester `1.1` ? », la note répond « un pas au-dessus de la valeur par défaut de `high` ». Cette auditabilité est la différence entre des tests générés et un *oracle* de test.

**🎯 Résultat attendu :** Deux lignes pour `low`/`high` disant `nudged around the default`, et une pour `value` disant `handpicked probe set`.

**🩹 Si ça ne marche pas :** Si chaque ligne dit « handpicked », la branche `has_default` est fausse. Si une ligne dit « nudged around the default » pour `value`, la valeur par défaut de `value` est silencieusement vide de nouveau.

### 2.3 Vérifie les entrées

**✅ Liste de vérification**

- ✅ `edge_values` est déterministe — même appel, même liste, quel que soit l'ordre d'invocation.
- ✅ Aucun float en double n'apparaît dans une liste de candidats, et chaque valeur est `round`ée à 2 décimales.
- ✅ Chaque candidat est traçable à une raison (jeu de sondes ou décalage de valeur par défaut).

**🤔 Question(s) socratique(s)**

- `edge_values` suppose des paramètres numériques. Que retourne la même fonction pour un paramètre dont la valeur par défaut est `"hello"` — et comment étendrais-tu l'aide pour qu'un appel ultérieur puisse passer un jeu de sondes *de chaînes* ?
- Deux des candidats générés (par ex. `-1.0` et `1.0`) testeraient un comportement identique pour *certaines* fonctions. Qu'est-ce qu'un désambiguïsateur intelligent doit savoir que `edge_values` ne peut actuellement pas voir ?

## Étape 3 : Rend un module pytest

Maintenant les candidats deviennent du Python : un vrai `test_clamp_simple.py`, où chaque test est une fonction `test_*` qui importe `clamp` et affirme une attente générée.

### 3.1 Compose le source du test sous forme de chaînes

**👟 Indice de départ :** Rends chaque candidat `value` dans un `def test_<name>():` qui affirme `clamp(v) == max(low, min(v, high))`, en utilisant les floats réels de valeurs par défaut de la signature comme modèle de valeur attendue.

```python
# testgen.py (continued)
def render_case(value: float) -> str:
    name = str(value).replace(".", "p").replace("-", "neg")
    low, high = sig.parameters["low"].default, sig.parameters["high"].default
    return (f"def test_value_at_{name}():\n"
            f"    assert clamp({value}) == max({low}, min({value}, {high}))\n")

parts = ["from testgen import clamp", ""]
for v in edge_values(sig.parameters["value"]):
    parts.append(render_case(v))
print(render_case(0.5))
```

L'expression de valeur attendue est *construite depuis les mêmes valeurs par défaut que porte la signature* — mieux que `== clamp(v)`, qui testerait une fonction contre elle-même et ne prouverait rien. La transformation de nom `0.5 → value_at_0p5` mappe les floats vers des identifiants valides et lisibles ; `-1.0 → value_at_neg1p0`.

**🎯 Résultat attendu :**

```
def test_value_at_0p5():
    assert clamp(0.5) == max(0.0, min(0.5, 1.0))
```

**🩹 Si ça ne marche pas :** Si l'indentation est fausse, les sauts de ligne `\n` de la f-string n'ont pas leurs quatre espaces. Si le nom contient un `.` brut, le `.replace(".", "p")` a été sauté, et pytest rejettera l'identifiant.

### 3.2 Ajoute les tests de propriété et de garde

**👟 Indice de départ :** Ajoute deux tests rendus à la main qui *expriment une intention*, pas de l'arithmétique — l'idempotence (appliquer `clamp` deux fois ne change rien) et une garde de bornes inversées.

```python
# testgen.py (continued)
parts.append("def test_idempotent():")
parts.append("    for v in " + str(edge_values(sig.parameters["value"])) + ":")
parts.append("        assert clamp(clamp(v)) == clamp(v)")
parts.append("")
parts.append("def test_swapped_bounds_guard():")
parts.append("    assert clamp(0.25, 0.5, 0.0) == 0.5")
open("test_clamp_simple.py", "w").write("\n".join(parts) + "\n")
print("wrote test_clamp_simple.py with", sum(1 for line in parts if line.startswith("def test_")), "tests")
```

L'idempotence est une *propriété* — elle tient pour chaque entrée sans avoir besoin d'une valeur attendue calculée à la main, ce qui est la classe de test qui attrape une borne cassée sans que tu aies deviné le résultat à l'avance. `clamp(0.25, 0.5, 0.0)` documente ce qui se passe quand l'appelant passe `low > high` : `max` gagne, et le résultat est `low`, bit pour bit — une décision que la fonction prend en silence, donc le test la rend bruyante.

**🎯 Résultat attendu :** `wrote test_clamp_simple.py with 6 tests` — quatre rendus de valeurs limites plus les tests de propriété et de garde.

**🩹 Si ça ne marche pas :** Si le compte est 4, les deux lignes `def test_...` ajoutées ont été écrites sans le préfixe `def test_` ou n'ont jamais été ajoutées. Si le fichier ne contient qu'un seul test, `"\n".join(parts)` a concaténé une liste à élément unique — oublie le `.append` dans la boucle et tu n'auras que le dernier cas.

### 3.3 Vérifie le rendu

**✅ Liste de vérification**

- ✅ `test_clamp_simple.py` s'ouvre et se parse comme du Python (aucune erreur de syntaxe dans les noms générés).
- ✅ Il contient exactement 6 fonctions `test_*`, important `clamp` depuis `testgen`.
- ✅ Les expressions attendues référencent `max(0.0, min(v, 1.0))`, pas une copie du corps de `clamp`.

**🤔 Question(s) socratique(s)**

- Un test rendu comme `assert clamp(v) == max(0.0, min(v, 1.0))` ré-encode la formule de `clamp` — il ne peut échouer que si les deux *orthographes* diffèrent. Que vérifie le test d'idempotence que ce rendu tautologique passerait allègrement ?
- Le générateur colle un `.replace` sur chaque float, mais `-0.0` se formate comme `"-0.0"` → `neg0p0`. Pourquoi est-ce à la fois inoffensif *maintenant* et un indice que la génération d'identifiants mérite un compteur `CASE_INDEX` à la place ?

## Étape 4 : Demande des tests d'intention à un LLM (optionnel)

Les tests de limites vérifient les maths ; les tests d'intention vérifient le *sens*. Cette étape compose un prompt déterministe qui demande à un LLM ce que la fonction est censée faire, et — la partie honnête — retombe sur un fichier enregistré quand aucune clé API n'est configurée.

### 4.1 Compose le prompt depuis la signature vivante

**👟 Indice de départ :** Construis un prompt d'un paragraphe intégrant la vraie chaîne de signature, et demande des fonctions pytest exécutables — rien d'autre.

```python
# testgen.py (continued)
def build_prompt(target: str, signature: inspect.Signature) -> str:
    return (
        f"You are reviewing a pure Python function `{target}{signature}`. "
        "List the three most important test cases that would catch a real regression. "
        "Answer as runnable pytest functions named test_* inside a fenced code block, nothing else."
    )

prompt = build_prompt("clamp", sig)
print(prompt[:90], "...")
```

Envoyer la *signature elle-même* (`clamp(value, low=0.0, high=1.0)`) est tout le truc — le modèle reçoit le contrat en une ligne, donc « l'intention » qu'il écrit est ancrée à de vrais noms de paramètres que les tests générés peuvent importer. Le suffixe déterministe (« three most important...nothing else ») garde le prompt reproductible et le format de réponse borné.

**🎯 Résultat attendu :** Une seule ligne commençant par `You are reviewing a pure Python function \`clamp(value, low=0.0, high=1.0)\`. List the three most important...` — avec une ellipse `.` et `...` venant de la tranche du print.

**🩹 Si ça ne marche pas :** Si le prompt intègre une signature périmée, `build_prompt` a été appelé avec un `sig` mis en cache avant une modification — passe toujours `inspect.signature(clamp)` frais. Si la clause de format de réponse manque, ré-ajoute le fragment `...nothing else.` de la f-string.

### 4.2 Dégrade-toi avec élégance sans clé API

**👟 Indice de départ :** Vérifie `OPENAI_API_KEY` (variable d'environnement) puis `getpass` (interactif), et quand aucun ne fournit de clé, enregistre le prompt pour un usage manuel au lieu d'échouer.

```python
# testgen.py (continued)
def maybe_ask_llm(prompt_text: str) -> None:
    import getpass, os
    key = os.environ.get("OPENAI_API_KEY") or getpass.getpass("OpenAI key (blank to skip): ")
    if not key:
        with open("llm_prompt.txt", "w") as f:
            f.write(prompt_text)
        print("no key: prompt saved to llm_prompt.txt")
        return
    print("key present — an API call would go here, replacing this line")

maybe_ask_llm(prompt)
```

`or` enchaîne les deux sources de clé pour qu'une tâche sans interface puisse définir `OPENAI_API_KEY` et qu'un utilisateur de terminal puisse la saisir — et la vérification de chaîne vide est ce qui rend l'ensemble *optionnel par défaut*. Enregistrer `llm_prompt.txt` signifie que l'étape LLM n'est jamais un blocage : colle-le dans n'importe quel modèle plus tard.

**🎯 Résultat attendu :** `no key: prompt saved to llm_prompt.txt` (première exécution, aucune clé configurée).

**🩹 Si ça ne marche pas :** Si `GetPassWarning` déborde, le terminal ne peut pas demander de façon interactive (CI/notebook) — c'est le travail du *chemin variable d'environnement* ; définis `OPENAI_API_KEY` et relance. S'il affiche `key present`, une clé a fui dans l'environnement — le chemin de fichier est toujours enregistré, mais la ligne d'appel API est intentionnellement un stub ici.

### 4.3 Vérifie la couche de prompt

**✅ Liste de vérification**

- ✅ `build_prompt` intègre la signature *vivante* et contraint le format de réponse.
- ✅ Sans clé, `llm_prompt.txt` existe et sa première ligne correspond au prompt affiché.
- ✅ Le chemin optionnel ne lève jamais quand aucune clé n'est configurée.

**🤔 Question(s) socratique(s)**

- Le prompt demande *trois* cas à un LLM mais n'exécute jamais ce qu'il retourne. Quelle est la chose la plus dangereuse avec l'auto-exécution de tests écrits par le modèle, que le chemin « enregistrer dans un fichier, coller manuellement » contourne gratuitement ?
- `getpass` masque les frappes mais la clé vit toujours dans le processus. Pourquoi passer la clé via une variable d'environnement est-il *mieux* que de la saisir — et pour quelle classe de fonctions insisterais-tu pour que le LLM ne voie jamais le source du tout ?

## Étape 5 : Exécute la suite et rends le verdict

Les tests existent pour être exécutés. Cette étape exécute le `test_clamp_simple.py` généré avec pytest comme sous-processus, lit le code de sortie et affiche le jugement autour duquel tourne tout le projet.

### 5.1 Exécute pytest depuis ton processus

**👟 Indice de départ :** Utilise `sys.executable -m pytest` — pas la chaîne `pytest` nue — pour que le sous-processus utilise le *même* interpréteur depuis lequel ton projet appelle le générateur.

```python
# testgen.py (continued)
import subprocess, sys

def run_suite(path: str = "test_clamp_simple.py") -> int:
    result = subprocess.run(
        [sys.executable, "-m", "pytest", path, "-q"],
        capture_output=True, text=True, timeout=60,
    )
    print(result.stdout.strip().splitlines()[-1])
    return result.returncode

code = run_suite()
print("all green!" if code == 0 else "something failed — inspect and regenerate")
```

`sys.executable` est l'adresse du Python qui exécute *ton* script, donc le processus enfant reçoit le même environnement et les mêmes site-packages — mettre un `pytest` shell nu à la place peut exécuter silencieusement un interpréteur différent et un `clamp` différent. `returncode` est la porte de sortie de pytest : `0` signifie que chaque test a réussi, tout le reste signifie un échec ou une erreur de collecte.

**🎯 Résultat attendu :**

```
6 passed in 0.01s
all green!
```

**🩹 Si ça ne marche pas :** Si la dernière ligne est `ERROR ... no tests ran`, pytest n'a pas pu importer `testgen` — exécute depuis le répertoire contenant les deux fichiers (ou ajoute `PYTHONPATH=.`). S'il dit `1 failed`, l'expression attendue d'un test rendu ne correspond pas au comportement de `clamp` — lis l'assertion qui échoue et corrige le modèle, pas la fonction.

### 5.2 Introduis une vraie régression et regarde le verdict basculer

**👟 Indice de départ :** Remplace temporairement `testgen.py` par un `clamp` *délibérément cassé* (un qui oublie la borne basse), relance la même suite, puis restaure le fichier original.

```python
# testgen.py (continued)
save = open("testgen.py").read()
open("testgen.py", "w").write(
    "def clamp(value, low=0.0, high=1.0):\n"
    "    return min(value, high)  # deliberately forgot the low clamp\n"
)
code = run_suite()
open("testgen.py", "w").write(save)   # restore the real function
print("caught the regression!" if code != 0 else "suite passed?!")
```

Le processus pytest enfant importe `clamp` *depuis le disque*, donc casser le fichier est l'unique façon de l'atteindre — et restaurer depuis la chaîne enregistrée garde ensuite ton générateur intact. Parce que les six tests ont été dérivés de vraies limites, oublier la borne basse déclenche exactement les sondes qui se préoccupent du côté bas : le cas limite `-1.0` et la garde de bornes inversées affirment tous les deux contre `max(0.0, ...)`, et les deux passent au rouge avec zéro modification du fichier de test.

**🎯 Résultat attendu :** `2 failed, 4 passed in 0.02s` avec les deux noms en échec `test_value_range_neg1p0` et `test_swapped_bounds_guard`, puis `caught the regression!`.

**🩹 Si ça ne marche pas :** Si la suite reste verte, la chaîne « cassée » n'est pas réellement cassée — `min(value, high)` doit être le corps entier (pas de `max`, pas d'usage de `low`). Si pytest passe encore après l'écriture, `open(..., "w")` a tourné dans un répertoire différent de `test_clamp_simple.py` — écris dans le même dossier absolu.

### 5.3 Vérifie le verdict

**✅ Liste de vérification**

- ✅ Exécution propre : `6 passed` et `all green!/code == 0`.
- ✅ Exécution de régression : au moins un échec et un code de sortie non nul, avec zéro modification du fichier de test.
- ✅ Les deux exécutions utilisent `sys.executable -m pytest` pour que le test voie ton vrai `clamp`.

**🤔 Question(s) socratique(s)**

- Le `clamp` délibérément cassé a « oublié la borne basse », pourtant le test d'idempotence et les sondes de plage `0.0`/`0.5`/`1.0` passent encore tous — seule la sonde `-1.0` et la garde de bornes inversées l'ont attrapé. Quels deux *types* de tests étaient obligatoires ici, et que cela te dit-il sur la valeur d'une sonde qui se tient *sous* la plage par défaut comme `-1.0` ?
- `run_suite` n'affiche que la dernière ligne de la sortie de pytest. Quand une suite a 200 tests générés et qu'un échoue, que devrait imprimer un outil de production *au lieu de* la fin — et que garantit déjà à lui seul le code de sortie ?

## ⚠️ Pièges courants

- **Tester une fonction contre elle-même.** `assert clamp(v) == clamp(v)` passe peu importe à quel point `clamp` est cassée. La valeur attendue générée doit être écrite depuis une *autre* expression (la formule `max/low/min`), ou le test ne prouve rien.
- **`==` au lieu de `is` sur `Parameter.empty`.** `param.default == inspect.Parameter.empty` peut être trompé ; la sentinelle doit être comparée avec `is`, sinon chaque paramètre « sans valeur par défaut » paraît avoir une valeur par défaut.
- **`pytest` nu dans un sous-processus.** Sur une machine avec plusieurs Python, `subprocess.run(["pytest", ...])` peut exécuter un interpréteur différent sans `clamp`. Lance toujours `[sys.executable, "-m", "pytest", ...]`.
- **Des floats qui fuient dans les noms de fonctions.** `0.1` et `-1.0` sont des floats valides mais des identifiants invalides ; la correspondance `.replace` existe précisément parce que les identifiants générés doivent faire l'aller-retour (round-trip).
- **Dérive de noms/collecte générés.** Un fichier de test qui perd son préfixe `test_` initial (ou le `def test_` sur les ajouts) est *collecté comme rien du tout* — pytest signale « no tests ran » avec le code de sortie 5, et ton pipeline devient rouge pour la mauvaise raison.
- **Mettre la signature en cache.** Rendre contre un `sig` périmé construit des tests pour du code qui a changé ; régénère toujours depuis un appel `inspect.signature(...)` frais.

## Ce que tu viens de construire

Un générateur de tests avec trois sources de vérité honnêtes : la signature (quels arguments existent), les valeurs par défaut (quelles sont les extrêmes) et l'intention écrite par un humain (quelles propriétés il doit toujours tenir). Il rend un vrai fichier pytest, l'exécute comme sous-processus et peut même appeler un LLM pour des tests d'intention quand une clé est présente — et il s'est prouvé en attrapant le clamp intentionnellement cassé. L'idée transférable est plus grande que le test : « dériver le harnais de l'interface, le rendre sous forme de texte, l'exécuter et lire le code de sortie » est le même squelette que les générateurs de code, les rendeurs de configuration et les aides CI.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/ai-test-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-test-generator) dans le dépôt du cours est le générateur complet en notebook — affichage de signature, sondes de limites, tests rendus, prompt LLM optionnel et le verdict rouge/vert, tout au même endroit. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Généralise `render_case` à n'importe quel *type* de paramètre : les chaînes reçoivent des sondes `["", "a", "a"*N]`, les listes le vide/singleton/triée, et la valeur attendue vient d'une propriété par type plutôt que d'un modèle de formule.
- Ajoute un drapeau CLI `--limit` pour que les énormes jeux de sondes rendent un échantillon aléatoire borné — la génération reste rapide tout en fuzzant l'espace des limites.
- Branche le verdict dans un hook git : à chaque commit, régénère la suite pour les modules changés et bloque le commit si `returncode != 0`.
- Transforme `llm_prompt.txt` en un vrai appel avec clé et *collecte* les tests retournés par le modèle, en les ajoutant à la suite — tout en gardant le repli manuel intact.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓