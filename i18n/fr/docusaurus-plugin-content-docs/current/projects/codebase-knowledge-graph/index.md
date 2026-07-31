---
id: codebase-knowledge-graph
title: "Transforme une Base de Code en Graphe de Connaissances"
sidebar_label: "Transforme une Base de Code en Graphe de Connaissances"
slug: /projects/codebase-knowledge-graph
description: "Passe du bac à sable dans le navigateur au vrai Python : analyse les fichiers Python d'une vraie base de code avec le module ast, construis un graphe de sa structure avec networkx, et visualise-le et interroge-le — sans clé API, sans accès réseau."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Transforme une Base de Code en Graphe de Connaissances

<ProjectPublishedDate projectId="codebase-knowledge-graph" />

<ProjectGreeting />

Chaque autre projet de cette section finit par recourir à une clé API, une inscription gratuite, ou un site web en direct. Celui-ci n'a besoin de rien de tout ça. Tu vas écrire un outil qui lit le code source Python de la même façon que l'interpréteur lui-même — en l'analysant en un **AST** (arbre syntaxique abstrait) avec le module `ast` intégré de la bibliothèque standard — puis transforme ce qu'il trouve en un **graphe** : fichiers, fonctions et classes comme nœuds, relations « importe »/« appelle »/« défini dans » comme arêtes. C'est un exemple réel et fonctionnel d'une structure de données vue bien plus tôt dans le cours apparaissant dans un outil authentiquement utile, pas un exercice de classe : un graphe n'est que des nœuds et des arêtes, et la structure propre d'une base de code s'avère déjà en être un.

Cela suppose Python 101 et de l'aisance avec les fonctions et les imports — rien de Analyse de Données n'est requis, et rien ici ne fait appel à un modèle d'IA ou un service web. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Installer `uv` et mettre en place un petit projet avec `networkx` et `pyvis` — pas de clé API, pas d'inscription, rien à configurer.
2. Analyser l'AST d'un seul fichier Python pour trouver ses définitions de fonctions, définitions de classes, et imports.
3. Parcourir un dépôt entier et construire un graphe à partir de tout ce que tu trouves, en utilisant `networkx`.
4. Ajouter des arêtes pour les relations d'**import** et d'**appel**, pour que le graphe capture comment les pièces se connectent réellement, pas juste ce qui existe.
5. Visualiser le graphe comme une page HTML interactive avec `pyvis` (et, optionnellement, une image statique avec `matplotlib`).
6. Écrire une petite fonction de requête — « qu'est-ce que cette fonction appelle ? », « qu'est-ce qui importe ce module ? » — et exécuter le tout contre un vrai dépôt.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal et recommandé — du vrai Python, sur ta propre machine, lisant de vrais fichiers depuis un vrai dossier sur disque.

**GitHub Codespaces** fonctionne très bien ici aussi : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute exactement les mêmes commandes `uv` depuis un terminal dans ton onglet de navigateur — et tu as déjà un vrai dépôt juste là pour y pointer l'outil.

**Google Colab ou Kaggle Notebooks** sont aussi une option authentiquement facile, pas juste un plan de secours — ce projet n'a besoin d'aucun GPU, d'aucun processus serveur de longue durée, et d'aucune clé API, juste des `pip install` et du calcul pur. Fais `!pip install networkx pyvis` dans une cellule, puis soit `!git clone` un dépôt public à analyser soit téléverse un petit dossier de fichiers `.py`, et le reste du code ci-dessous fonctionne essentiellement sans changement (la sortie HTML de pyvis peut même être affichée en ligne dans une cellule de notebook).

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-knowledge-graph/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-knowledge-graph/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcodebase-knowledge-graph%2Fnotebook.ipynb)

Un notebook prêt à l'emploi avec tout le code ci-dessous — y compris les fichiers jouets `sample_repo/` écrits en ligne, donc rien à téléverser ou cloner — se trouve dans [`examples/codebase-knowledge-graph/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-knowledge-graph/notebook.ipynb). Clique sur un badge ci-dessus pour le lancer directement.

## Configuration

Puisqu'il n'y a ni clé API ni fichier `.env` nulle part dans ce projet, la configuration est inhabituellement courte.

**Installe `uv`**, un seul outil qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets » :

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

**Mets en place un projet et installe les dépendances :**

```bash
uv init codebase-graph
cd codebase-graph
uv add networkx pyvis matplotlib
```

`networkx` est une bibliothèque de graphes gratuite et en Python pur — elle gère la vraie structure de données de graphe (nœuds, arêtes, parcours) pour que tu n'aies pas à en écrire une à partir de zéro. `pyvis` transforme un graphe `networkx` en une page HTML interactive que tu peux faire glisser et zoomer dans un navigateur. `matplotlib` est optionnel, utilisé pour une alternative en image statique à l'Étape 5.

C'est toute la configuration. **Pas de clé API, pas de fichier `.env`, pas d'inscription gratuite, pas de variable d'environnement à configurer** — chaque étape à partir d'ici lit des fichiers locaux et exécute du calcul local.

:::tip[Aucun accès internet nécessaire après l'installation]
Une fois que `uv add` termine de télécharger ces trois paquets, tout le reste de ce projet peut tourner avec ton réseau déconnecté. Ça vaut la peine de le remarquer : tout le reste de cette section du cours tourne autour de l'appel d'un modèle distant ou d'un site web distant, et il est facile de commencer à supposer que chaque projet Python « réel » a besoin d'un appel réseau quelque part. Celui-ci est un contre-exemple utile — l'analyse statique et la théorie des graphes sont entièrement hors ligne.
:::

## Étape 1 : Analyse l'AST d'un seul fichier

Avant d'analyser un dépôt entier, fais fonctionner un seul fichier. Le module `ast` intégré de Python transforme le code source en un arbre d'objets décrivant sa structure — la même représentation que l'interpréteur lui-même construit avant d'exécuter ton code. `ast.parse` te donne la racine de cet arbre ; `ast.walk` te permet de visiter chaque nœud qu'il contient.

Crée un petit fichier de test, `sample.py` :

```python
# sample.py
import os

def greet(name):
    print(f"Hello, {name}")

class Greeter:
    def greet_twice(self, name):
        greet(name)
        greet(name)
```

Puis écris `explore_ast.py` pour l'explorer :

```python
# explore_ast.py
import ast
from pathlib import Path

source = Path("sample.py").read_text(encoding="utf-8")
tree = ast.parse(source, filename="sample.py")

for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        print("function:", node.name)
    elif isinstance(node, ast.ClassDef):
        print("class:", node.name)
    elif isinstance(node, ast.Import):
        for alias in node.names:
            print("import:", alias.name)
    elif isinstance(node, ast.ImportFrom):
        print("import from:", node.module)
```

```bash
uv run python explore_ast.py
```

Tu devrais voir `function: greet`, `class: Greeter`, et `import: os` affichés — plus `function: greet_twice`, puisque `ast.walk` visite *chaque* nœud de l'arbre, y compris une définition de méthode imbriquée dans une classe. Cet imbrication compte pour l'Étape 2 : une fonction trouvée de cette façon pourrait être une vraie fonction de niveau supérieur, ou pourrait être une méthode qui n'a de sens qu'attachée à sa classe, et le graphe doit conserver cette distinction plutôt que d'aplatir tout en un seul tas indifférencié de « fonctions ».

:::tip[ast.parse peut échouer — et c'est attendu, pas un bug dans ton code]
Tous les fichiers `.py` d'un vrai dépôt ne s'analysent pas proprement : un fichier pourrait être du code Python 2 laissé dans un vieux dépôt, un fichier de template avec une extension `.py` qui n'est pas du Python valide du tout, ou avoir authentiquement une erreur de syntaxe que quelqu'un a oublié de corriger. `ast.parse` lève `SyntaxError` exactement dans ce cas. L'envelopper dans `try`/`except SyntaxError` et passer le fichier avec un avertissement — plutôt que de laisser tout l'outil planter au fichier un de deux mille — est une pratique standard pour tout outil qui parcourt une vraie base de code, et c'est intégré dans la version de l'Étape 2.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python explore_ast.py` s'exécute sans erreur et affiche `function: greet`, `class: Greeter`, et `import: os`.</StepChecklistItem>
<StepChecklistItem>`function: greet_twice` est aussi affiché, même s'il est imbriqué dans `Greeter` — confirmant que `ast.walk` visite chaque nœud, pas seulement ceux de niveau supérieur.</StepChecklistItem>
<StepChecklistItem>Tu peux expliquer, en une phrase, la différence entre `ast.Import` (`import os`) et `ast.ImportFrom` (`from x import y`).</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `ast.walk` visite les nœuds dans aucun ordre particulier garanti relatif à la profondeur d'imbrication. Si tu avais besoin de savoir spécifiquement à quelle classe appartient une méthode, l'itération plate de `ast.walk` seule te donnerait-elle ça, ou aurais-tu besoin de parcourir `tree.body` (niveau supérieur seulement) puis le propre `.body` de chaque classe séparément ? Pourquoi l'Étape 2 finit-elle par faire la seconde option ?
- Que ferait `ast.parse` si tu lui donnais un fichier `.txt` plein de prose anglaise au lieu de code Python ? Essaie et vois si le message d'erreur résultant aiderait réellement quelqu'un à déboguer un vrai problème « pourquoi mon scan a-t-il sauté ce fichier ».

## Étape 2 : Parcours tout un dépôt et construis le graphe

La structure d'un seul fichier est un début ; la valeur de tout un dépôt de fichiers, fonctions, classes et leurs relations est ce qui fait de ceci un vrai *graphe de connaissances* plutôt qu'une liste. `networkx.DiGraph` (graphe dirigé — les arêtes ont une direction, puisque « le fichier A importe le module B » n'est pas la même affirmation que « le module B importe le fichier A ») est la structure de données qui contient tout ça.

```python
# build_graph.py (excerpt -- Step 2)
import ast
from pathlib import Path

import networkx as nx


def parse_file(path):
    """Parses one file's AST; returns None and warns instead of crashing on a syntax error."""
    try:
        tree = ast.parse(path.read_text(encoding="utf-8", errors="ignore"), filename=str(path))
    except SyntaxError as exc:
        print(f"Skipping {path}: syntax error ({exc.msg} at line {exc.lineno})")
        return None
    return tree


def build_graph(repo_path):
    graph = nx.DiGraph()

    for path in sorted(repo_path.rglob("*.py")):
        tree = parse_file(path)
        if tree is None:
            continue

        rel = str(path.relative_to(repo_path))
        graph.add_node(rel, kind="file")

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module = alias.name.split(".")[0]
                    graph.add_node(module, kind="module")
                    graph.add_edge(rel, module, kind="imports")
            elif isinstance(node, ast.ImportFrom) and node.module:
                module = node.module.split(".")[0]
                graph.add_node(module, kind="module")
                graph.add_edge(rel, module, kind="imports")

        # Only tree.body -- top-level statements -- so a method nested in a
        # class isn't mistaken for a module-level function (see Step 1).
        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                qualified = f"{rel}::{node.name}"
                graph.add_node(qualified, kind="function", short_name=node.name)
                graph.add_edge(rel, qualified, kind="defines")
            elif isinstance(node, ast.ClassDef):
                class_qualified = f"{rel}::{node.name}"
                graph.add_node(class_qualified, kind="class", short_name=node.name)
                graph.add_edge(rel, class_qualified, kind="defines")

    return graph


if __name__ == "__main__":
    graph = build_graph(Path("sample_repo"))
    print(f"{graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges")
```

Chaque nœud dans un graphe `networkx` est juste une valeur hashable — ici, une simple chaîne comme `"models.py"` ou `"models.py::Order"` — avec un dictionnaire optionnel d'attributs (`kind`, `short_name`) attaché. Utiliser `"file.py::name"` comme id de nœud, plutôt que juste `"name"`, compte dès qu'un dépôt a deux fichiers qui définissent tous les deux une fonction appelée `helper` — sans le préfixe de fichier, `networkx` les traiterait silencieusement comme le *même* nœud.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Exécuter `build_graph.py` contre un petit dossier de fichiers `.py` affiche un compte de nœuds et d'arêtes non nul.</StepChecklistItem>
<StepChecklistItem>Un fichier qui définit deux fonctions et importe un module produit au moins 4 nœuds pour ce fichier seul (le fichier lui-même, le module, et les deux fonctions).</StepChecklistItem>
<StepChecklistItem>Casse délibérément la syntaxe d'un fichier (un crochet non fermé) et confirme que l'outil le saute avec un avertissement au lieu de planter.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi utiliser `"file.py::function_name"` comme id de nœud plutôt que juste `"function_name"` ? Qu'est-ce qui irait précisément mal sur un dépôt avec deux fichiers `utils.py` dans des sous-dossiers différents, chacun définissant une fonction appelée `run` ?
- `graph.add_node(module, kind="module")` s'exécute chaque fois qu'un import est trouvé, même si ce module a déjà été ajouté par un fichier précédent. Est-ce que `networkx` crée un nœud dupliqué, ou laisse-t-il simplement l'existant tranquille ? Vérifie la documentation `networkx` (ou teste-le simplement) — pourquoi ce comportement rend-il ce code sûr à appeler à répétition sans vérifier toi-même « ai-je déjà vu ce module » ?

## Étape 3 : Ajoute les arêtes d'appel

Les fichiers, fonctions, classes et imports décrivent ce qui *existe*. Pour capturer comment les pièces s'*utilisent* réellement entre elles, tu as besoin d'une relation de plus : quelle fonction en appelle quelle autre. C'est la partie la moins précise de l'outil — l'analyse statique ne peut pas toujours être certaine de ce qu'un appel cible (plus là-dessus dans les pièges ci-dessous) — mais une version « au mieux, appariée par nom » reste authentiquement utile.

```python
# build_graph.py (excerpt -- Step 3, extends parse_file's per-function work)
def called_names(func_node):
    """Best-effort list of names a function/method's body calls."""
    names = []
    for node in ast.walk(func_node):
        if isinstance(node, ast.Call):
            target = node.func
            if isinstance(target, ast.Name):          # add(...)
                names.append(target.id)
            elif isinstance(target, ast.Attribute):    # utils.add(...) or self.total()
                names.append(target.attr)
    return names
```

`node.func` sur un `ast.Call` est soit un `ast.Name` (un appel nu comme `add(...)`) soit un `ast.Attribute` (un appel pointé comme `utils.add(...)` ou `self.total()`) — récupérer `.id` ou `.attr` respectivement te donne le nom court dans les deux cas, mais remarque que `utils.add(...)` et `some_other_object.add(...)` s'effondrent tous les deux à la même chaîne, `"add"`. C'est une vraie limitation, pas un oubli, et c'est exactement pourquoi l'appariement de la prochaine étape se fait par *nom*, pas par certitude.

Une fois que chaque fonction/classe/méthode du dépôt a été ajoutée comme nœud (Étape 2), une deuxième passe résout chaque appel enregistré vers n'importe quel nœud partageant ce nom court, et ajoute une arête `"calls"` :

```python
# build_graph.py (excerpt -- Step 3, second pass over the whole graph)
def add_call_edges(graph, calls_by_function):
    by_short_name = {}
    for node, data in graph.nodes(data=True):
        if data.get("kind") in {"function", "method"}:
            by_short_name.setdefault(data["short_name"], []).append(node)

    for caller, called_names_list in calls_by_function.items():
        for name in called_names_list:
            for target in by_short_name.get(name, []):
                if target != caller:
                    graph.add_edge(caller, target, kind="calls")
```

Cette structure en deux passes — d'abord collecter chaque définition, *puis* résoudre les appels contre l'ensemble complet — est nécessaire parce qu'une fonction définie près du haut d'un fichier peut en appeler une définie près du bas ; une seule passe de haut en bas raterait entièrement les références en avant.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Après avoir exécuté l'outil complet sur `sample_repo/` (de l'exemple compagnon, ou tes propres fichiers de test), au moins une arête `"calls"` existe entre deux fonctions dans des fichiers différents.</StepChecklistItem>
<StepChecklistItem>Tu peux pointer un appel spécifique dans ton code de test et trouver l'arête correspondante dans le graphe.</StepChecklistItem>
<StepChecklistItem>Tu peux expliquer pourquoi l'étape de résolution d'appel doit s'exécuter *après* que chaque fichier ait été scanné, pas fichier par fichier au fur et à mesure.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Deux classes non liées dans ton dépôt de test définissent toutes les deux une méthode appelée `run`. Si une troisième fonction appelle `some_object.run()`, l'appariement par nom de cet outil ajoutera-t-il une arête `"calls"` aux *deux* méthodes `run`, ou juste à la bonne ? Que faudrait-il pour corriger ça — et est-ce que ça vaut la complexité ajoutée pour un outil d'apprentissage comme celui-ci ?
- `add_call_edges` évite de créer une self-loop (`if target != caller`). Quel vrai pattern Python créerait une self-loop ici si cette vérification était retirée, et une self-loop serait-elle réellement *incorrecte*, ou juste visuellement bruyante dans le rendu de l'Étape 4 ?

## Étape 4 : Visualise le graphe

Un graphe avec quelques centaines de nœuds est illisible en tant que liste d'arêtes — le visualiser est ce qui te permet réellement de *voir* la forme d'une base de code. `pyvis` enveloppe la sortie de `networkx` dans une page HTML autonome et interactive : fais glisser des nœuds, zoome, survole pour les détails, aucun serveur nécessaire au-delà d'ouvrir le fichier dans un navigateur.

```python
# build_graph.py (excerpt -- Step 4)
from pyvis.network import Network

COLORS = {"file": "#3b82f6", "module": "#9ca3af", "class": "#f59e0b", "function": "#10b981", "method": "#10b981"}


def visualize_pyvis(graph, output_path="graph.html"):
    net = Network(height="800px", width="100%", directed=True, notebook=False)
    net.barnes_hut()  # a physics layout that spaces nodes apart instead of overlapping

    for node, data in graph.nodes(data=True):
        kind = data.get("kind", "module")
        label = data.get("short_name", node)
        net.add_node(node, label=label, title=f"{kind}: {node}", color=COLORS.get(kind, "#9ca3af"))

    for source, target, data in graph.edges(data=True):
        net.add_edge(source, target, title=data.get("kind", ""))

    net.write_html(output_path)
```

```bash
uv run python build_graph.py
```

Ouvre le `graph.html` résultant dans un navigateur. Les nœuds sont colorés par type (fichiers bleus, classes ambre, fonctions/méthodes vertes, modules externes gris) ; survoler n'importe quel nœud ou arête affiche son id complet et son type de relation dans une infobulle.

Si tu préfères une image statique (pour l'incruster dans un document, ou pour un dépôt trop grand pour que la disposition interactive reste lisible), `matplotlib` et les propres fonctions de dessin de `networkx` couvrent aussi ce cas :

```python
# build_graph.py (excerpt -- Step 4, matplotlib alternative)
import matplotlib.pyplot as plt

def visualize_matplotlib(graph, output_path="graph.png"):
    fig, ax = plt.subplots(figsize=(12, 9))
    layout = nx.spring_layout(graph, seed=42, k=0.6)  # seed -> reproducible layout between runs
    node_colors = [COLORS.get(graph.nodes[n].get("kind", "module"), "#9ca3af") for n in graph.nodes]
    labels = {n: graph.nodes[n].get("short_name", n) for n in graph.nodes}
    nx.draw_networkx_nodes(graph, layout, node_color=node_colors, node_size=500, ax=ax)
    nx.draw_networkx_labels(graph, layout, labels=labels, font_size=7, ax=ax)
    nx.draw_networkx_edges(graph, layout, ax=ax, arrows=True)
    ax.axis("off")
    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
```

:::tip[pyvis pour explorer, matplotlib pour partager une vue fixe unique]
L'interactivité de `pyvis` (glisser, zoomer, survoler) est authentiquement meilleure pour *explorer* un graphe inconnu — tu peux écarter un cluster dense pour voir ce qui est réellement connecté à quoi. L'image statique de `matplotlib` est meilleure une fois que tu sais déjà ce que tu veux montrer et que tu as juste besoin d'une image fixe et incrustable — une capture d'écran d'une page `pyvis` ne reflète pas une disposition que tu as choisie exprès. Aucune n'est strictement meilleure ; elles résolvent des moments différents du même flux de travail.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`graph.html` s'ouvre dans un navigateur et montre un vrai graphe non vide — pas une page blanche.</StepChecklistItem>
<StepChecklistItem>Faire glisser un nœud le déplace, et les arêtes connectées le suivent.</StepChecklistItem>
<StepChecklistItem>Survoler un nœud affiche son type et son id complet dans une infobulle.</StepChecklistItem>
<StepChecklistItem>(Si tu as essayé la version matplotlib) `graph.png` existe et s'ouvre comme une vraie image, avec des couleurs de nœuds distinguables.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `net.barnes_hut()` exécute une simulation physique pour disposer les nœuds. Qu'est-ce que tu attendrais qu'il arrive à l'utilité de cette disposition à mesure que le graphe grandit de 20 nœuds à 2 000 — et est-ce une limitation spécifique à `pyvis`, ou une limitation de *n'importe quel* algorithme de disposition de graphe généraliste sur un graphe grand et densément connecté ?
- La version matplotlib passe `seed=42` à `spring_layout`. Qu'est-ce qui changerait dans l'image résultante, d'une exécution à l'autre, si tu retirais la seed ? Pourquoi une disposition reproductible pourrait-elle compter si tu compares deux versions du même graphe dans le temps (ex. « comment la structure de ce dépôt a-t-elle changé après une refonte ») ?

## Étape 5 : Interroge le graphe

Un graphe que tu peux seulement regarder est déjà utile, mais un graphe auquel tu peux *poser des questions* est plus utile — et puisque `networkx` te donne un vrai parcours de graphe, c'est une poignée de lignes, pas un nouveau système.

```python
# build_graph.py (excerpt -- Step 5)
def what_does_it_call(graph, short_name):
    """Every node matching short_name, and everything it calls."""
    results = []
    for node, data in graph.nodes(data=True):
        if data.get("short_name") == short_name or node == short_name:
            callees = [t for _, t, d in graph.out_edges(node, data=True) if d.get("kind") == "calls"]
            results.append((node, callees))
    return results


def who_imports(graph, module_name):
    """Every file with an 'imports' edge pointing at module_name."""
    if module_name not in graph:
        return []
    return [src for src, _, d in graph.in_edges(module_name, data=True) if d.get("kind") == "imports"]
```

```python
>>> what_does_it_call(graph, "total_with_tax")
[('models.py::Order.total_with_tax', ['utils.py::multiply', 'utils.py::add', 'models.py::Order.total'])]
>>> who_imports(graph, "utils")
['main.py', 'models.py']
```

`graph.out_edges(node, data=True)` et `graph.in_edges(node, data=True)` sont les deux directions de « suivre une arête depuis ce nœud » — sortante pour « qu'est-ce que ceci appelle/importe », entrante pour « qu'est-ce qui appelle/importe ceci. » Cette directionnalité est exactement pourquoi l'Étape 2 a construit un `DiGraph` (dirigé) plutôt qu'un `Graph` non dirigé : « A importe B » et « B importe A » sont des affirmations différentes et vérifiables, et un graphe non dirigé aurait jeté cette distinction.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`what_does_it_call(graph, ...)` sur une fonction dont tu sais qu'elle en appelle deux autres retourne les deux, par nom.</StepChecklistItem>
<StepChecklistItem>`who_imports(graph, ...)` sur un module dont tu sais qu'il est importé par deux fichiers retourne les deux noms de fichiers.</StepChecklistItem>
<StepChecklistItem>Interroger un nom qui n'existe pas dans le graphe retourne un résultat vide, pas un plantage.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `what_does_it_call` s'apparie sur `short_name`, qui — comme l'a soulevé la question socratique de l'Étape 3 — peut entrer en collision entre des classes non liées avec une méthode de même nom. Écris une requête qui prend plutôt directement un id de nœud *entièrement qualifié* (ex. `"models.py::Order.total_with_tax"`). Quel est le compromis entre les deux styles de requête — l'un est plus facile à taper, l'autre est sans ambiguïté ?
- Pourrais-tu écrire un `what_calls_it(graph, short_name)` — l'inverse de `what_does_it_call` — en utilisant `in_edges` plutôt que `out_edges` ? Qu'est-ce que ça te dirait que `what_does_it_call` ne peut pas ?

## Étape 6 : Exécute-le de bout en bout contre un vrai dépôt

Tout jusqu'ici a construit vers une seule chose : pointer l'outil terminé vers une base de code que personne n'a construite spécifiquement pour cette leçon, et voir ce qui en ressort. Le script d'exemple compagnon dans [`examples/codebase-knowledge-graph/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/codebase-knowledge-graph) connecte tout des Étapes 1–5 en un `build_graph.py` exécutable, plus un petit `sample_repo/` de fichiers jouets avec des relations d'import/appel délibérées pour l'essayer d'abord :

```bash
uv run python build_graph.py sample_repo --html graph.html --calls total_with_tax --imports utils
```

Une fois que ça fonctionne, pointe-le vers quelque chose de réel — **le propre dépôt de ce cours est une vraie base de code Python non triviale déjà assise sur ton disque si tu l'as cloné**, ou utilise n'importe quel autre dépôt local que tu as :

```bash
uv run python build_graph.py /path/to/python-data-analysis-course/examples --html course_graph.html
```

Ouvre le HTML résultant et regarde-le vraiment : quels fichiers importent le plus d'autres modules ? Quelle fonction a le plus d'arêtes « calls » entrantes (un bon indicateur de « code central, largement utilisé ») ? La forme correspond-elle à ce que tu savais déjà sur la façon dont la base de code s'assemble, ou révèle-t-elle une connexion que tu ne savais pas exister ?

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>L'outil s'exécute contre un vrai dépôt multi-fichiers (pas juste le `sample_repo/` jouet) sans planter.</StepChecklistItem>
<StepChecklistItem>Le graphe résultant a visiblement plus de nœuds et d'arêtes que l'exemple jouet, et la visualisation se rend toujours.</StepChecklistItem>
<StepChecklistItem>Tu peux nommer une chose que le graphe t'a montrée sur la structure de cette base de code que tu ne savais pas déjà en entrant.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Choisis le nœud avec le plus d'arêtes « calls » entrantes dans ton graphe de vrai dépôt. Ce nœud ressemble-t-il vraiment à du code « central » quand tu ouvres le vrai fichier et le lis ? Qu'est-ce qui pourrait faire qu'un nœud ait beaucoup d'arêtes entrantes *sans* être réellement particulièrement important ?
- Si tu exécutais cet outil contre le même dépôt à nouveau dans un mois, après du vrai développement entre-temps, qu'est-ce qu'un diff entre les deux graphes te dirait réellement qu'un simple `git diff` ne dirait pas ?

## ⚠️ Pièges courants

- **Que `ast.parse` échoue sur un fichier ne devrait pas tuer tout le scan.** Un seul fichier avec une erreur de syntaxe, un fichier non-Python avec une extension `.py`, ou du vieux code Python 2 laissé dans un dépôt lèvera `SyntaxError`. Attrape-la, saute ce fichier avec un avertissement, et continue — le `try`/`except` de l'Étape 1 est là spécifiquement pour qu'un mauvais fichier sur deux mille ne termine pas l'exécution.
- **L'analyse statique ne peut pas voir les imports dynamiques ou les appels dynamiques.** `importlib.import_module("some_module")`, `__import__(name)`, ou un appel construit à partir d'une variable (`getattr(obj, method_name)()`) n'apparaissent pas comme un nœud `ast.Import`/`ast.Call` avec un nom littéral de la façon dont le font `import os` ou `add(1, 2)` — cet outil, comme n'importe quel analyseur purement statique, ne verra tout simplement pas ces arêtes. C'est une vraie limitation permanente, pas un bug à corriger ; une analyse entièrement dynamique aurait besoin d'*exécuter* réellement le code et de tracer ce qui se passe, ce qui est un type d'outil différent (et bien plus lourd).
- **La résolution d'appels basée sur le nom produit des faux positifs.** Le `add_call_edges` de l'Étape 3 apparie les appels seulement par nom court, donc deux classes non liées qui définissent chacune une méthode `run` obtiendront toutes les deux une arête de n'importe quel appel qui ressemble à `something.run()`, même si une seule d'entre elles était réellement visée. C'est un compromis légitime pour un projet d'apprentissage — la résolution complète d'appels a besoin d'une vraie inférence de types, ce qu'un serveur de langage ou un outil comme `pyright` fait en interne.
- **Les graphes sur un grand dépôt deviennent trop denses pour être lus visuellement.** Quelques centaines de fichiers avec des imports croisés lourds transforme la disposition dirigée par forces de `pyvis` en un enchevêtrement illisible — les dispositions basées sur la physique écartent les nœuds, mais ne réduisent pas le nombre d'arêtes. Filtre avant de visualiser : choisis un sous-dossier, le voisinage d'un fichier (seulement ses imports/appelants directs), ou utilise les fonctions de requête de l'Étape 5 pour répondre à une question spécifique plutôt que d'essayer de rendre le graphe entier d'un coup.

## Ce que tu viens de construire

Un outil qui lit du vrai code source Python de la même façon que l'interpréteur lui-même l'analyse, transforme les relations fichier/fonction/classe/import/appel en une honnête structure de données de graphe, et te permet à la fois de *voir* cette structure (interactivement, avec `pyvis`) et de l'*interroger* (programmatiquement, avec le parcours `networkx`) — tout ça sans un seul appel réseau. La même forme en trois étapes — analyser avec `ast`, construire un graphe avec `networkx`, l'interroger ou le visualiser — passe à l'échelle du `sample_repo/` jouet jusqu'à une vraie base de code de plusieurs milliers de fichiers ; rien dans l'approche n'a été simplifié en quelque chose qui cesse de fonctionner à plus grande échelle, seule la *lisibilité* d'une visualisation complète l'est.

## Où aller à partir d'ici

- Ajoute un nouveau type d'arête : « hérite de, » en lisant la liste `bases` d'une définition de classe (`ast.ClassDef.bases`) — un ajout authentiquement utile pour comprendre la structure d'une base de code orientée objet que cette leçon n'a pas couvert.
- Calcule de vraies métriques de graphe avec les algorithmes intégrés de `networkx` plutôt que d'estimer à l'œil la visualisation — `nx.pagerank` ou la centralité de degré entrant pour trouver les fonctions les plus « centrales » d'une base de code, ou `nx.weakly_connected_components` pour trouver des clusters isolés de code que rien d'autre ne touche.
- Essaie `nx.readwrite.json_graph.node_link_data` pour exporter le graphe en JSON, pour qu'un outil séparé (ou un frontend web, si tu es à l'aise avec ça) puisse le consommer sans avoir besoin de `networkx` installé du tout.
- Compare deux graphes de deux points différents dans l'historique git d'un dépôt (`git worktree` ou deux clones à des commits différents) pour voir, structurellement, comment une refonte a réellement changé la forme de la base de code — pas juste quelles lignes ont changé, mais quelles relations sont apparues ou disparues.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="codebase-knowledge-graph" />
