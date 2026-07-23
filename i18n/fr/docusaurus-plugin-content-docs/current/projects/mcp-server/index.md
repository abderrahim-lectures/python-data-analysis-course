---
id: mcp-server
title: "Construire un serveur MCP"
sidebar_label: "Construire un serveur MCP"
slug: /projects/mcp-server
description: "Passez du bac à sable dans le navigateur à du vrai Python : construisez un serveur Model Context Protocol exposant vos propres outils, et connectez-le à un vrai client IA comme Claude Desktop."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un serveur MCP

<ProjectPublishedDate projectId="mcp-server" />

<ProjectGreeting />

Le [Model Context Protocol](https://modelcontextprotocol.io) (MCP) est une façon standard pour un assistant IA d'appeler du code, des outils, et des données qui vivent en dehors de lui. Un *serveur* MCP est un petit programme que vous écrivez et qui expose une poignée d'outils ; un *client* MCP — Claude Desktop, par exemple — se connecte à ce serveur et laisse le modèle appeler ces outils en votre nom, de la même façon qu'un navigateur web est un client qui parle à un serveur web. Ce projet construit le côté serveur : vos propres fonctions Python, enregistrées comme des outils MCP, appelables par un vrai assistant IA tournant sur votre propre machine.

Ceci suppose Python 101 et une aisance à écrire des fonctions simples — rien de Data Analysis n'est requis. C'est optionnel et non noté ; voir [Projets concrets](/docs/projects) pour la liste complète, qui s'enrichit au fil du temps. Il s'associe naturellement au [projet Agent IA](/docs/projects/ai-agent) — la même idée sous-jacente, donner à une IA des outils qu'elle peut appeler, abordée depuis le côté opposé : là-bas, vous avez construit l'agent qui appelle des outils directement, dans le même processus Python ; ici, vous construisez un serveur autonome dans lequel *n'importe quel* client compatible MCP peut se brancher, sans que ce client ait besoin de connaître quoi que ce soit sur votre code au-delà du protocole.

MCP est l'un des motifs les plus activement adoptés en ce moment pour étendre les assistants IA — cela vaut la peine d'en avoir construit un, même une version minimale, tant que c'est encore d'actualité.

## 🎯 Ce que vous allez faire

1. Installer `uv` et configurer un petit projet avec le SDK Python officiel de MCP.
2. Écrire un serveur MCP exposant deux de vos propres outils, en utilisant l'API `FastMCP` du SDK.
3. Exécuter votre serveur localement et tester ses outils à la main avec le MCP Inspector, avant de connecter un vrai client IA.
4. Enregistrer votre serveur auprès du palier gratuit de Claude Desktop et le regarder appeler réellement votre code.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal recommandé pour celui-ci, plus encore que pour la plupart des autres projets de cette série — tout l'intérêt est de connecter votre serveur à Claude Desktop, et Claude Desktop est une application installée sur votre propre machine. Il n'y a aucun moyen d'éviter de faire au moins la dernière étape en local.

**GitHub Codespaces** est un endroit raisonnable pour écrire et tester la *logique des outils elle-même* : ouvrez [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt), écrivez `server.py`, et appelez vos fonctions d'outils directement dans un shell Python, ou même exécutez `mcp dev server.py` et utilisez l'Inspector via le port redirigé du Codespace. Ce qu'un Codespace *ne peut pas* être, c'est votre point de connexion final à Claude Desktop — Claude Desktop tourne sur votre propre bureau et a besoin de lancer un processus local auquel il peut parler directement ; y accéder depuis un Codespace nécessiterait un tunnel supplémentaire hors du cadre de ce projet. Considérez les Codespaces comme adaptés aux étapes 1 à 3, et faites l'étape 4 en local.

**Google Colab et les notebooks Kaggle ne conviennent pas à ce projet**, contrairement à la plupart des autres de cette série — passez-les ici. Aucun des deux ne vous donne un processus local persistant auquel un client IA de bureau peut se connecter ; une cellule de notebook qui « fait tourner un serveur » dans Colab n'est pas du tout accessible par Claude Desktop sur votre propre machine.

## Étape 1 : installer `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « installer Python, puis installer pip, puis installer un outil d'environnement virtuel, puis installer les paquets » — il peut installer et gérer lui-même les versions de Python, en plus des dépendances de votre projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Fermez et rouvrez votre terminal, puis confirmez l'installation :

```bash
uv --version
```

Configurez ensuite un projet et installez le SDK Python officiel de MCP, avec son extra optionnel `cli` (c'est ce qui vous donne la commande `mcp dev` utilisée à l'étape 3) :

```bash
uv init mcp-server
cd mcp-server
uv add "mcp[cli]"
```

## Étape 2 : écrire votre premier serveur MCP

L'API de haut niveau du SDK, `FastMCP`, transforme une fonction Python ordinaire en outil MCP avec un seul décorateur — aucun code au niveau du protocole à écrire à la main. Créez `server.py` :

```python
# server.py
from pathlib import Path

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("course-tools")  # the name your AI client will show for this server

DOCS_DIR = Path.home() / "path" / "to" / "python-data-analysis-course" / "docs"  # adjust this


@mcp.tool()
def search_course_topics(query: str) -> str:
    """Search this course's lesson files for a topic and report which pages mention it.

    Looks through every .md file under docs/ for `query` (case-insensitive) and
    returns each matching file's name plus one line of context. Call this when
    someone asks whether, or where, a topic is covered in the course.
    """
    query_lower = query.lower()
    matches = []
    for path in sorted(DOCS_DIR.rglob("*.md")):
        for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            if query_lower in line.lower():
                matches.append(f"{path.name}: \"{line.strip()[:120]}\"")
                break
        if len(matches) >= 5:
            break
    return "Found in:\n" + "\n".join(matches) if matches else f"No lesson pages mention '{query}'."


@mcp.tool()
def count_words(text: str) -> int:
    """Count the words in a piece of text, splitting on whitespace."""
    return len(text.split())


if __name__ == "__main__":
    mcp.run()
```

`@mcp.tool()` fait tout le travail d'enregistrement ici : il inspecte le nom de la fonction, ses paramètres annotés par type, et sa docstring, et construit automatiquement une définition d'outil MCP à partir de ça — vous n'écrivez jamais un schéma à la main. C'est la même idée que le [projet Agent IA](/docs/projects/ai-agent) enseigne pour les outils LangChain : **le modèle lit votre docstring, pas votre code, pour décider quand un outil correspond à une demande.** Une docstring vague ne donne rien au modèle sur quoi se baser ; une docstring qui dit clairement ce que fait l'outil et quand l'appeler est ce qui fait réellement fonctionner la sélection d'outil.

`search_course_topics` reprend délibérément la même idée que l'outil-jouet du projet Agent IA — chercher un sujet dans les propres fichiers de ce cours — mais exposée via le décorateur d'outil de MCP au lieu d'être passée directement dans la liste `tools=[...]` d'un agent. `count_words` est un utilitaire plus petit et autonome, inclus pour montrer un serveur exposant plus d'un outil à la fois — un client MCP voit les deux et choisit celui qui correspond à une question donnée.

:::tip[Vérifiez la documentation actuelle du SDK MCP avant de vous y fier]
MCP est une spécification jeune et évoluant vite — le protocole lui-même, et la propre API du SDK Python, ont tous deux changé depuis les premières versions. Le style à base de décorateur de `FastMCP` est stable depuis un moment, mais avant de construire quoi que ce soit au-delà de cette leçon, parcourez le [propre README et la documentation du SDK](https://github.com/modelcontextprotocol/python-sdk) plutôt que de supposer que les spécificités de cet extrait correspondent encore exactement.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`server.py` s'enregistre sans erreur de syntaxe et définit à la fois `search_course_topics` et `count_words`.</StepChecklistItem>
<StepChecklistItem>Chaque outil a une vraie docstring en anglais simple — pas un texte de remplacement.</StepChecklistItem>
<StepChecklistItem>`DOCS_DIR` pointe vers un vrai dossier `docs/` qui existe réellement sur votre machine.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Que se passerait-il si deux de vos outils avaient des docstrings très similaires ? Comment un modèle pourrait-il choisir entre eux, et qu'est-ce que cela suggère pour l'écriture de docstrings pour un serveur avec de nombreux outils ?
- `search_course_topics` retourne une chaîne de caractères, pas des données structurées. Que perdriez-vous, ou gagneriez-vous, en retournant une liste de correspondances à la place ?

## Étape 3 : exécuter et tester votre serveur localement

Avant de brancher ceci sur un vrai client IA, faites-le tourner seul et confirmez que les outils fonctionnent réellement. Le SDK fournit une commande **dev/inspector** exactement pour ça :

```bash
uv run mcp dev server.py
```

Cela démarre votre serveur et ouvre le **MCP Inspector** — un outil gratuit basé sur le navigateur qui vous permet d'appeler `search_course_topics` et `count_words` à la main, de passer des arguments de test, et de voir les vraies valeurs de retour, sans aucun modèle IA impliqué. (Le premier lancement peut vous demander d'installer un petit paquet proxy basé sur `npx` que l'Inspector utilise ; acceptez-le.)

Testez les deux outils ici avant de continuer : appelez `search_course_topics` avec une requête que vous savez présente dans `docs/` (par ex. `"groupby"`), et `count_words` avec une courte phrase. Si l'un des deux se comporte mal, vous avez affaire à un bug dans votre fonction Python — corrigez-le ici, où la seule partie mobile est votre propre code, plutôt que de le déboguer plus tard avec Claude Desktop dans la boucle, où un résultat erroné pourrait tout aussi bien être un problème de connexion, une faute de frappe de configuration, ou le modèle choisissant le mauvais outil.

Vous pouvez aussi simplement exécuter le serveur directement, sans l'Inspector, pour confirmer qu'il démarre proprement :

```bash
uv run python server.py
```

Il n'affichera rien de lui-même — un serveur MCP attend qu'un client se connecte via stdio. Le silence ici est attendu, pas un bug ; `Ctrl+C` pour l'arrêter.

:::tip[Testez avec l'Inspector avant de toucher un vrai client]
Il est tentant de sauter directement à Claude Desktop. Résistez à ça — l'Inspector isole le code de vos outils de tout ce qui peut mal tourner ailleurs dans une vraie connexion client (chemins de configuration, redémarrages, la propre sélection d'outil du modèle). Faites d'abord fonctionner les deux outils là.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run mcp dev server.py` démarre sans erreur et ouvre l'Inspector dans votre navigateur.</StepChecklistItem>
<StepChecklistItem>L'Inspector liste à la fois `search_course_topics` et `count_words`.</StepChecklistItem>
<StepChecklistItem>Appeler chaque outil à la main dans l'Inspector retourne un vrai résultat correct — pas une erreur.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si `search_course_topics` retournait une erreur au lieu d'un résultat, comment sauriez-vous si le bug est dans votre code Python ou dans la connexion MCP elle-même ? Qu'est-ce que tester d'abord avec l'Inspector vous apporte ici ?
- Pourquoi pourrait-il être important que l'Inspector n'ait besoin d'aucun modèle IA pour tester vos outils ?

## Étape 4 : le connecter à Claude Desktop

Le palier gratuit de [Claude Desktop](https://claude.ai/download) prend en charge la connexion à des serveurs MCP locaux. Il lit un fichier de configuration JSON qui lui dit quels serveurs lancer et comment :

- **macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`

Si le fichier n'existe pas encore, créez-le. Ajoutez votre serveur, en utilisant un chemin **absolu** vers votre dossier de projet :

```json
{
  "mcpServers": {
    "course-tools": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-server", "python", "server.py"]
    }
  }
}
```

`command` et `args` décrivent exactement le processus que Claude Desktop lancera pour parler à votre serveur — le même appel `uv run` que vous avez déjà testé à l'étape 3, juste démarré par Claude Desktop au lieu de vous. Utiliser `uv run` (plutôt qu'un simple `python`) compte ici : Claude Desktop lance cette commande dans son propre environnement, sans garantie que l'environnement virtuel de votre projet soit déjà actif, et `uv run` trouve et utilise le bon tout seul.

**Quittez complètement et redémarrez Claude Desktop** — une instance déjà en cours d'exécution ne relit pas ce fichier d'elle-même. Une fois redémarré, votre serveur devrait apparaître dans sa liste d'outils/connecteurs (généralement derrière une petite icône près de la zone de message). Demandez-lui quelque chose qui devrait déclencher un appel d'outil, par ex. :

> Does the Python course cover groupby? Use the course-tools search if you have it.

Claude Desktop devrait montrer qu'il appelle `search_course_topics` (souvent sous forme d'un petit bloc repliable « a utilisé un outil » dans la conversation, avec les arguments et le résultat visibles si vous le développez), puis répondre en utilisant le vrai résultat que votre fonction a retourné — pas une supposition tirée des données d'entraînement du modèle.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`course-tools` (ou le nom de serveur que vous avez choisi) apparaît dans la liste d'outils/connecteurs de Claude Desktop après un redémarrage complet.</StepChecklistItem>
<StepChecklistItem>Poser une question qui devrait déclencher `search_course_topics` montre effectivement Claude en train de l'appeler, pas juste en train de répondre de mémoire.</StepChecklistItem>
<StepChecklistItem>Le résultat que Claude affiche utiliser correspond à ce que vous avez vu en testant le même appel dans l'Inspector.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Claude Desktop décide lui-même s'il faut appeler votre outil pour un message donné. Quelle formulation dans votre question de test a rendu cela plus ou moins probable, et pourquoi pensez-vous que c'est le cas ?
- Si vous posiez une question complètement sans rapport avec le cours, vous attendriez-vous à ce que Claude appelle quand même `search_course_topics` ? Qu'est-ce que cela vous dirait sur la façon dont le modèle décide réellement de la pertinence d'un outil ?

## ⚠️ Pièges courants

- **Un chemin relatif ou incorrect dans le fichier de configuration.** `claude_desktop_config.json` a besoin d'un chemin absolu vers votre dossier de projet — un chemin relatif n'a pas de « répertoire courant » cohérent contre lequel se résoudre quand Claude Desktop lance votre serveur, et échouera simplement à le démarrer.
- **Oublier de redémarrer complètement Claude Desktop après avoir modifié la configuration.** Sauvegarder le fichier JSON seul ne fait rien — l'application ne le lit qu'au démarrage, donc fermer et rouvrir une fenêtre ne suffit pas non plus ; quittez d'abord complètement l'application.
- **Une docstring trop vague pour que le modèle choisisse le bon outil.** `"""Does stuff with text."""` ne donne rien au modèle pour la faire correspondre à une vraie question. Dites clairement ce que fait l'outil et, idéalement, quand l'appeler — exactement comme la docstring de `search_course_topics` ci-dessus.
- **Exécuter le serveur avec un simple `python server.py` au lieu de `uv run python server.py`.** Sans `uv run`, l'interpréteur qui démarre pourrait ne pas être celui dans lequel `uv add` a installé `mcp`, et vous obtiendrez un `ModuleNotFoundError` pour `mcp` même si `uv add` a clairement dit qu'il l'avait installé avec succès.

## Ce que vous venez de construire

Deux petits outils, c'est un exemple-jouet, mais la forme est réelle : un processus autonome qui expose des fonctions Python via un protocole standard, connectable à n'importe quel client compatible MCP sans que ce client sache quoi que ce soit sur votre code au-delà des noms d'outils, des arguments, et des docstrings. C'est le véritable intérêt de MCP — le même serveur que vous venez de construire fonctionnerait sans modification avec un client MCP complètement différent, ce qui n'est pas vrai de la liste `tools=[...]` étroitement couplée du projet Agent IA.

## Où aller à partir d'ici

- Donnez à `search_course_topics` (ou à un nouvel outil) accès à quelque chose de plus véritablement utile que du texte de leçon — un petit fichier local, un vrai jeu de données, un script qui exécute un calcul dont vous avez réellement besoin.
- Lisez sur les **ressources** et les **prompts** de MCP — cette leçon ne couvre que les *outils*, mais le protocole définit aussi des façons d'exposer des données lisibles (ressources) et des modèles de prompt réutilisables (prompts) à un client. La [propre documentation du SDK](https://github.com/modelcontextprotocol/python-sdk) couvre les deux, avec le même style de décorateur `FastMCP`.
- Puisque la spécification évolue activement, revérifiez périodiquement la [documentation officielle de MCP](https://modelcontextprotocol.io) pour tout ce qui aurait changé depuis que vous avez construit ceci — de nouvelles options de transport et capacités client apparaissent à un rythme soutenu.

:::tip[Exécutez une version plus complète sans aucune configuration locale — pour la logique des outils, du moins]
[`examples/mcp-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-server) dans le dépôt du cours est une version légèrement plus complète du code ci-dessus, avec `search_course_topics` branché sur le vrai dossier `docs/` du dépôt dans lequel il tourne (aucun chemin à modifier à la main). Clonez-le, ou ouvrez tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), pour essayer les deux outils avec `uv run mcp dev server.py` — en gardant à l'esprit que la vraie connexion à Claude Desktop doit quand même se faire en local, selon « Où exécuter ceci » ci-dessus.
:::

## Partagez votre projet avec la classe

Vous avez construit quelque chose dont vous êtes fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README a un guide complet et accessible aux débutants pour ajouter le vôtre via une **pull request**, même si vous n'avez jamais utilisé git auparavant : forker le dépôt, créer une branche, valider vos fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est présumée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="mcp-server" />
