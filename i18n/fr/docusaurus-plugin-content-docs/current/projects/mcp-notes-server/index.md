---
id: 2027-mcp-notes-server
title: "Construire un Serveur MCP pour tes Notes"
sidebar_label: "Construire un Serveur MCP pour tes Notes"
slug: /projects/mcp-notes-server
description: "Indexe un vrai dossier de notes Markdown et expose-le à Claude Desktop comme des outils consultables avec le Model Context Protocol -- un serveur MCP de base de connaissances personnelle authentiquement utile, pas un jouet."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Serveur MCP pour tes Notes

<ProjectPublishedDate projectId="2027-mcp-notes-server" />

<ProjectGreeting />

Cela suppose Python 101 et de l'aisance à écrire de simples fonctions -- et ça aide beaucoup d'avoir déjà construit le projet [Construire un Serveur MCP](/docs/projects/mcp-server) d'abord, puisque celui-ci réutilise le même pattern de décorateur `FastMCP` et n'ajoute qu'un vrai contenu à rechercher au lieu de deux outils jouets. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

Si tu gardes des notes dans Obsidian, Notion, ou juste un simple dossier de fichiers Markdown, ce projet transforme ce dossier en quelque chose qu'un assistant IA peut réellement rechercher et lire directement -- pas en collant le contenu des notes dans une fenêtre de chat, mais en donnant à Claude Desktop de vrais outils : rechercher tes notes par mot-clé, faire remonter une note en entier par titre, ou lister ce que tu as touché le plus récemment. C'est la même idée de Model Context Protocol que le projet MCP précédent, visant quelque chose que tu continueras plausiblement d'utiliser après.

## 🎯 Ce que tu vas faire

1. Installer `uv` et mettre en place un petit projet avec le SDK Python officiel de MCP.
2. Indexer un vrai dossier de notes Markdown d'exemple -- les charger depuis le disque, en extraire les titres et heures de modification.
3. Écrire des fonctions de recherche et de consultation en Python simple, et les tester avant que du code MCP ne soit impliqué.
4. Connecter ces fonctions comme outils MCP avec `FastMCP`, et connecter le serveur à Claude Desktop.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal et recommandé ici, plus que la plupart des projets de cette série -- tout l'intérêt est de connecter ton serveur à Claude Desktop, et Claude Desktop est une appli installée sur ta propre machine qui a besoin de lancer un processus local avec lequel elle peut parler directement. Il n'y a pas moyen de contourner le fait de faire au moins la dernière étape en local.

**GitHub Codespaces** est un endroit raisonnable pour écrire et tester la logique d'indexation et de recherche elle-même : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt), écris `server.py` et un dossier de notes d'exemple, et appelle tes fonctions directement dans un shell Python, ou exécute `mcp dev server.py` et utilise l'Inspector à travers le port transféré du Codespace. Ce qu'un Codespace *ne peut pas* être, c'est ton point de connexion final Claude Desktop -- atteindre un Codespace depuis une appli de bureau nécessiterait un tunneling supplémentaire hors du périmètre de ce projet. Traite Codespaces comme bon pour les Étapes 1–3, et fais l'Étape 4 en local.

**Google Colab et Kaggle ne sont pas adaptés au vrai serveur**, comme le projet MCP précédent -- saute-les pour la vraie chose. Aucun ne te donne un processus local persistant auquel un client IA de bureau peut se connecter ; une cellule de notebook qui « exécute un serveur » dans Colab n'est absolument pas atteignable par Claude Desktop sur ta propre machine.

Cela dit, si tu veux juste explorer les fonctions de recherche et de consultation en Python simple -- sans protocole MCP, sans processus serveur, sans Claude Desktop -- un notebook plus restreint existe exactement pour ça. Il démontre les fonctions de recherche/consultation sous-jacentes isolément, pas le serveur MCP en direct :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-notes-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-notes-server/notebook.ipynb)

Il appelle la même logique d'outils directement comme des fonctions ordinaires, sans décorateur, sans serveur, et sans connexion client -- utile pour expérimenter avec le code, pas un substitut au vrai projet ci-dessous.

## Configuration

`uv` est un seul outil qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets » -- il peut installer et gérer les versions de Python lui-même, en plus des dépendances de ton projet.

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

Puis configure un projet et installe le SDK Python officiel de MCP, avec son extra optionnel `cli` (c'est ce qui te donne la commande `mcp dev` utilisée plus tard) :

```bash
uv init mcp-notes-server
cd mcp-notes-server
uv add "mcp[cli]"
```

Aucune clé API nécessaire nulle part dans ce projet -- c'est de la recherche locale pure sur des fichiers déjà sur ton disque, sans aucun appel de modèle de langage impliqué dans la logique d'indexation ou de recherche elle-même.

## Étape 1 : Indexe un dossier de notes d'exemple

Crée un dossier `notes/` à côté de l'endroit où `server.py` vivra, et dépose une poignée de vrais fichiers `.md` dedans -- une recette, quelques notes de livres, une liste d'idées de projets, ce que tu as vraiment sous la main. Chaque note a juste besoin d'un titre `# Titre` près du début ; rien d'autre sur sa structure n'importe. Si tu n'as pas encore de vraies notes sous la main, écris 4–5 courtes maintenant -- des sujets authentiquement différents, pas quatre variations de la même chose, pour que les résultats de recherche plus tard signifient vraiment quelque chose.

Ensuite écris le code de chargement dans `server.py` :

```python
# server.py
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

NOTES_DIR = Path.home() / "path" / "to" / "notes"  # adjust this to your real notes folder


@dataclass
class Note:
    path: Path
    title: str
    body: str
    modified: float


def _load_note(path: Path) -> Note:
    """Read one .md file off disk and pull its title from the first '# ' heading."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    title = path.stem
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped[2:].strip()
            break
    return Note(path=path, title=title, body=text, modified=path.stat().st_mtime)


def _all_notes() -> list[Note]:
    """Load every .md file in NOTES_DIR fresh each call -- cheap at personal-notes
    scale, and it means edits on disk show up immediately, with no cache to invalidate."""
    if not NOTES_DIR.exists():
        return []
    return [_load_note(p) for p in sorted(NOTES_DIR.glob("*.md"))]
```

Rien ici n'est spécifique à MCP pour l'instant -- c'est de l'E/S de fichiers ordinaire. C'est délibéré : fais fonctionner correctement l'indexation seule, avec un simple shell Python, avant que du code de protocole n'entre en scène.

```bash
uv run python -c "from server import _all_notes; print([n.title for n in _all_notes()])"
```

Tu devrais voir le titre de chaque note affiché en retour. Si la liste est vide, `NOTES_DIR` est incorrect avant même tout le reste.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`notes/` contient au moins 4 vraies notes `.md` authentiquement différentes, chacune avec un titre `# Titre`.</StepChecklistItem>
<StepChecklistItem>`_all_notes()` retourne un `Note` par fichier, avec le bon titre extrait de chaque en-tête.</StepChecklistItem>
<StepChecklistItem>`NOTES_DIR` pointe vers un vrai dossier qui existe réellement sur ta machine.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `_all_notes()` recharge chaque fichier depuis le disque à chaque appel, sans mise en cache. À quel moment -- des centaines de notes ? des milliers ? -- ça cesserait d'être « assez bon marché », et que changerais-tu en premier ?
- Que se passe-t-il en ce moment si une note n'a aucun titre `# ` du tout ? Est-ce le comportement que tu veux, ou préférerais-tu qu'elle échoue bruyamment ?

## Étape 2 : Construis les fonctions de recherche et de consultation

Avec les notes se chargeant correctement, écris les fonctions qui répondent réellement à des questions à leur sujet -- toujours du Python simple, toujours testable sans aucun client IA dans la boucle :

```python
import time


def search_notes(query: str) -> str:
    """Search every note for a keyword and report which notes mention it."""
    query_lower = query.lower()
    matches = []
    for note in _all_notes():
        for line in note.body.splitlines():
            if query_lower in line.lower():
                matches.append(f'"{note.title}": {line.strip()[:160]}')
                break  # one hit per note is enough context
    if not matches:
        return f"No notes mention '{query}'."
    return "Found in:\n" + "\n".join(matches)


def get_note_by_title(title: str) -> str:
    """Return the full text of one note, matched by exact or partial title."""
    title_lower = title.lower()
    notes = _all_notes()

    exact = [n for n in notes if n.title.lower() == title_lower]
    if len(exact) == 1:
        return exact[0].body

    partial = [n for n in notes if title_lower in n.title.lower()]
    if len(partial) == 1:
        return partial[0].body
    if len(partial) > 1:
        titles = ", ".join(f'"{n.title}"' for n in partial)
        return f"Multiple notes match '{title}': {titles}. Be more specific."

    return f"No note titled '{title}' found."


def list_recent_notes(limit: int = 5) -> str:
    """List the most recently modified notes, newest first."""
    notes = sorted(_all_notes(), key=lambda n: n.modified, reverse=True)[:limit]
    if not notes:
        return "No notes found."

    now = time.time()
    lines = []
    for note in notes:
        age_days = (now - note.modified) / 86400
        age = "today" if age_days < 1 else f"{int(age_days)} days ago"
        lines.append(f'"{note.title}" ({age})')
    return "\n".join(lines)
```

`get_note_by_title` refuse délibérément de deviner quand un titre partiel correspond à plus d'une note, plutôt que de retourner silencieusement la première correspondance -- retourner le contenu complet de la mauvaise note à un assistant IA (et, en aval, à toi) est pire que de demander un titre plus précis.

Teste les trois à la main avant de continuer, de la même façon que tu as testé `_all_notes()` :

```bash
uv run python -c "from server import search_notes; print(search_notes('your-keyword'))"
```

:::tip[Teste les fonctions simples avant que du code de protocole ne les touche]
Chaque bug est plus facile à trouver ici qu'après que `@mcp.tool()`, l'Inspector, et Claude Desktop soient tous mélangés à la fois. Si `search_notes` retourne la mauvaise chose en ce moment, tu sais avec certitude que le bug est dans cette fonction -- pas dans une connexion, un fichier de config, ou la propre sélection d'outils du modèle.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`search_notes` trouve un mot-clé que tu sais présent dans une de tes notes, et retourne un vrai extrait correct.</StepChecklistItem>
<StepChecklistItem>`get_note_by_title` retourne le texte complet de la note pour un titre exact, et un vrai message « sois plus précis » pour un titre partiel ambigu.</StepChecklistItem>
<StepChecklistItem>`list_recent_notes` retourne les notes dans le bon ordre -- les plus récemment éditées en premier.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `search_notes` retourne au maximum un extrait par note, même si un mot-clé apparaît plusieurs fois dans le même fichier. Que perdrais-tu, ou gagnerais-tu, en retournant chaque ligne correspondante à la place ?
- Si tu avais deux notes avec des titres identiques (dans des dossiers différents, disons), laquelle des trois fonctions d'aujourd'hui se comporterait mal en premier, et comment ?

## Étape 3 : Connecte-les comme outils MCP avec FastMCP

Tout jusqu'ici a été du Python simple. Le transformer en serveur MCP est un décorateur par fonction -- aucun code au niveau du protocole à écrire à la main :

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("notes")  # the name your AI client will show for this server


@mcp.tool()
def search_notes(query: str) -> str:
    """Search every note for a keyword and report which notes mention it.

    Looks through each .md file in the notes folder (case-insensitive) and
    returns each matching note's title plus one line of surrounding context.
    Call this when someone asks whether, or where, a topic comes up in their
    notes -- e.g. "do I have any notes about sourdough?".
    """
    ...  # same body as Step 2


@mcp.tool()
def get_note_by_title(title: str) -> str:
    """Return the full text of one note, matched by title.

    Matching is case-insensitive and allows a partial match as long as
    exactly one note matches; ambiguous partial matches are reported
    instead of guessed. Call this once search_notes (or the user) has
    identified which note they want in full, not as a first-pass search tool.
    """
    ...  # same body as Step 2


@mcp.tool()
def list_recent_notes(limit: int = 5) -> str:
    """List the most recently modified notes, newest first.

    Reports each note's title and how long ago it was last edited. Call
    this when someone asks what they've been working on lately, or wants
    a quick overview of the notes folder without searching for anything
    specific.
    """
    ...  # same body as Step 2


if __name__ == "__main__":
    mcp.run()
```

`@mcp.tool()` inspecte le nom de chaque fonction, ses paramètres avec indices de type, et sa docstring, et construit automatiquement une définition d'outil MCP -- le modèle lit ta docstring, pas ton code, pour décider quand un outil correspond à une demande. Avec trois outils maintenant au lieu d'un, des docstrings qui distinguent clairement *quand* appeler chacun comptent plus qu'avec un seul outil : remarque que la docstring de `get_note_by_title` dit explicitement qu'elle est pour après la recherche, pas à sa place.

Avant de toucher à un vrai client IA, exécute la commande dev/inspector du SDK et teste les trois outils à la main :

```bash
uv run mcp dev server.py
```

Cela ouvre l'**Inspecteur MCP** -- un outil gratuit basé sur navigateur qui te laisse appeler chaque outil avec de vrais arguments et voir de vraies valeurs de retour, sans aucun modèle IA impliqué. Confirme d'abord que les trois outils fonctionnent ici.

:::tip[Trois outils suffisent largement pour voir que les docstrings comptent]
Avec un seul outil, le modèle n'a rien entre quoi choisir. Avec trois, essaie de demander aux prompts sous-jacents de l'Inspecteur (ou, une fois connecté, à Claude Desktop lui-même) quelque chose d'ambigu, comme « parle-moi de ma note sur les pâtes » -- et observe s'il se tourne d'abord vers `search_notes` ou `get_note_by_title`. S'il choisit le « mauvais », c'est presque toujours un problème de docstring, pas un bug dans ta fonction.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`server.py` définit les trois outils avec `@mcp.tool()` et de vraies docstrings spécifiques.</StepChecklistItem>
<StepChecklistItem>`uv run mcp dev server.py` démarre sans erreur et l'Inspecteur liste les trois outils.</StepChecklistItem>
<StepChecklistItem>Appeler chaque outil à la main dans l'Inspecteur retourne les mêmes résultats corrects que tu as déjà vus à l'Étape 2.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Maintenant qu'il y a trois outils plutôt qu'un, comment déciderais-tu si un nouvel outil appartient à ce serveur, ou devrait rester une fonction d'aide privée qu'aucun client ne voit jamais ?
- Si la docstring de `list_recent_notes` ne mentionnait pas « sur quoi ai-je travaillé récemment », t'attendrais-tu à ce que le modèle l'appelle quand même pour cette formulation ? Qu'est-ce que ça suggère sur à quel point les écrire littéralement ?

## Étape 4 : Connecte-le à Claude Desktop et essaie-le

Le niveau gratuit de [Claude Desktop](https://claude.ai/download) supporte la connexion à des serveurs MCP locaux. Il lit un fichier de configuration JSON qui lui dit quels serveurs lancer et comment :

- **macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`

Si le fichier n'existe pas encore, crée-le. Ajoute ton serveur, en utilisant un chemin **absolu** vers le dossier de ton projet :

```json
{
  "mcpServers": {
    "notes": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-notes-server", "python", "server.py"]
    }
  }
}
```

`command` et `args` décrivent exactement le processus que Claude Desktop lancera pour parler à ton serveur -- la même invocation `uv run` que tu as déjà testée à l'Étape 3, juste démarrée par Claude Desktop plutôt que par toi. Utiliser `uv run` (plutôt qu'un simple `python`) compte ici : Claude Desktop lance cette commande dans son propre environnement, sans garantie que l'environnement virtuel de ton projet soit déjà actif, et `uv run` trouve et utilise le bon lui-même.

**Quitte complètement et redémarre Claude Desktop** -- une instance en cours d'exécution ne relit pas ce fichier d'elle-même. Une fois qu'elle redémarre, ton serveur devrait apparaître dans sa liste d'outils/connecteurs. Essaie des questions comme :

> Do I have any notes about sourdough? Use the notes tools if you have them.
>
> What have I been working on most recently, based on my notes?
>
> Pull up my full "side project ideas" note.

Claude Desktop devrait montrer qu'il appelle `search_notes`, `list_recent_notes`, ou `get_note_by_title` (souvent comme un petit bloc repliable « a utilisé un outil », avec les arguments et le résultat visibles si tu le déplies), puis répondre en utilisant le vrai résultat que ta fonction a retourné -- pas une supposition.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`notes` (ou le nom de serveur que tu as choisi) apparaît dans la liste d'outils/connecteurs de Claude Desktop après un redémarrage complet.</StepChecklistItem>
<StepChecklistItem>Poser une question sur un sujet que tu sais présent dans une de tes notes montre réellement Claude appelant un outil, pas juste répondant de mémoire ou devinant.</StepChecklistItem>
<StepChecklistItem>Demander à Claude de faire remonter une note spécifique par nom retourne son vrai contenu complet.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si tu demandais à Claude Desktop quelque chose sur lequel tes notes ne disent rien, t'attendrais-tu à ce qu'il appelle quand même un outil et rapporte « rien trouvé », ou qu'il réponde depuis la connaissance générale à la place ? Que s'est-il passé, et pourquoi penses-tu que c'est ainsi ?
- Maintenant que c'est connecté pour de vrai, quelle est la première chose sur ton vrai dossier de notes qui casserait ces fonctions si tu y pointais `NOTES_DIR` aujourd'hui ?

## ⚠️ Pièges courants

- **Un chemin relatif ou incorrect dans le fichier de config.** `claude_desktop_config.json` a besoin d'un chemin absolu vers le dossier de ton projet -- un chemin relatif n'a pas de « répertoire courant » cohérent contre lequel se résoudre quand Claude Desktop lance ton serveur, et échouera simplement à le démarrer.
- **Oublier de redémarrer complètement Claude Desktop après avoir édité la config.** Sauvegarder seul le fichier JSON ne fait rien -- l'appli ne le lit qu'au démarrage, donc fermer et rouvrir une fenêtre ne suffit pas non plus ; quitte l'appli complètement d'abord.
- **`get_note_by_title` retournant silencieusement la mauvaise note.** Si tu sautes la vérification « plus d'une correspondance partielle » et retournes juste la première correspondance, un titre comme « notes » correspondra silencieusement au mauvais fichier dès que tu as deux notes au nom similaire -- ça vaut la peine de tester avec des titres intentionnellement ambigus avant de lui faire confiance.
- **Une docstring trop vague pour que le modèle choisisse le bon outil parmi trois.** `"""Gets a note."""` ne donne au modèle rien pour distinguer `get_note_by_title` de `search_notes`. Dis clairement ce que fait chaque outil et quand l'appeler, comme le font les docstrings ci-dessus.
- **Exécuter le serveur avec `python server.py` simple plutôt que `uv run python server.py`.** Sans `uv run`, l'interpréteur qui démarre pourrait ne pas être celui dans lequel `uv add` a installé `mcp`, et tu obtiendras un `ModuleNotFoundError` pour `mcp` même si `uv add` a clairement dit qu'il s'était installé avec succès.

## Ce que tu viens de construire

Un serveur MCP autonome qui transforme un vrai dossier de tes propres notes en quelque chose qu'un assistant IA peut rechercher et lire directement, utilisant trois outils avec des travaux authentiquement différents -- recherche par mot-clé, consultation exacte, et listage par récence -- plutôt qu'une fonction fourre-tout. Le même serveur fonctionne sans modification avec n'importe quel client compatible MCP, pas seulement Claude Desktop, et la logique d'indexation en dessous n'a rien de spécifique à MCP du tout : ce sont juste des fichiers sur disque, lus à neuf à chaque appel.

## Où aller à partir d'ici

- Pointe `NOTES_DIR` vers ton vrai coffre Obsidian, export Notion, ou simple dossier de notes plutôt que les notes d'exemple avec lesquelles tu as commencé, et vois ce qui casse -- styles de titres incohérents, fichiers énormes, pièces jointes non-Markdown mélangées.
- Ajoute un outil qui filtre par étiquette, si tes vraies notes utilisent une convention `tags:` comme le font les notes d'exemple ici -- même forme que `search_notes`, mais correspondant à un champ structuré plutôt qu'à du texte libre.
- Lis sur les **ressources** et **prompts** de MCP -- cette leçon ne couvre que les *outils*, mais le protocole définit aussi des façons d'exposer des données lisibles (ressources) et des modèles de prompt réutilisables (prompts) à un client. La [propre documentation du SDK](https://github.com/modelcontextprotocol/python-sdk) couvre les deux, avec le même style de décorateur `FastMCP`.
- Puisque la spécification évolue activement, revérifie périodiquement la [documentation officielle MCP](https://modelcontextprotocol.io) pour tout ce qui a changé depuis que tu as construit ça.

:::tip[Exécute une version plus complète sans aucune configuration locale -- pour la logique des outils, au moins]
[`examples/mcp-notes-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-notes-server) dans le dépôt du cours est une version légèrement plus complète du code ci-dessus, avec 7 vraies notes d'exemple déjà écrites et les trois outils implémentés. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), pour essayer les trois outils avec `uv run mcp dev server.py` -- en te rappelant que la vraie connexion Claude Desktop doit quand même se faire en local, selon « Où exécuter ceci » ci-dessus.
:::

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves -- et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="2027-mcp-notes-server" />
