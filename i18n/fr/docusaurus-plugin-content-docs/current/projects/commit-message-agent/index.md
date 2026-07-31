---
id: commit-message-agent
title: "Construire un Générateur de Messages de Commit Git"
sidebar_label: "Construire un Générateur de Messages de Commit Git"
slug: /projects/commit-message-agent
description: "Construis un outil CLI qui lit un vrai git diff en stage via subprocess, rédige un message façon Conventional Commits avec un LLM gratuit, et ne commite qu'après ta confirmation explicite."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Générateur de Messages de Commit Git

<ProjectPublishedDate projectId="2027-commit-message-agent" />

<ProjectGreeting />

« wip », « fix stuff », « asdf » — chaque développeur a tapé un message de commit paresseux à 18h un vendredi. Ce projet construit un outil CLI qui élimine l'excuse : il capture ton vrai `git diff` **en stage** avec le module `subprocess` de Python, le transmet à un modèle de langage gratuit avec un system prompt conçu spécifiquement pour écrire des messages façon Conventional Commits, et te montre un brouillon que tu peux accepter, modifier, ou jeter — avant que quoi que ce soit ne soit jamais commité. L'outil ne commite jamais de lui-même ; un humain confirme toujours le message final en premier.

Cela suppose Python 101 et assez d'aisance avec git pour savoir ce que font `git add` et `git commit` — rien de Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Installer `uv`, obtenir une clé API LLM gratuite, et mettre en place un petit projet — tout au même endroit, avant de commencer à construire.
2. Utiliser le module `subprocess` de Python pour exécuter `git diff --staged` pour de vrai et capturer sa sortie sous forme de texte.
3. Concevoir un system prompt qui transforme un LLM généraliste en rédacteur focalisé de messages façon Conventional Commits.
4. Construire une boucle CLI interactive : montrer le brouillon, laisser l'utilisateur l'accepter, le modifier, ou le régénérer.
5. Connecter la boucle pour qu'elle exécute réellement `git commit -m "..."` — mais seulement après confirmation explicite de l'utilisateur.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal et recommandé ici, plus que pour la plupart des autres projets de cette série — la prémisse entière de cet outil est de lire `git diff --staged` depuis un vrai dépôt git local et, si tu le dis, d'y commiter. Cela signifie qu'il a besoin d'un vrai dossier `.git` avec des changements en stage sur disque contre lequel travailler (ton propre projet, ou un clone du dépôt de ce cours).

**GitHub Codespaces** fonctionne bien aussi : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, `uv` et git sont déjà installés) — c'est un vrai clone avec un vrai endroit pour mettre des changements en stage, donc chaque étape ci-dessous fonctionne exactement comme en local.

**Google Colab et Kaggle Notebooks sont une façon raisonnable d'*essayer* la logique de rédaction, mais pas d'exécuter l'outil pour de vrai.** Aucun ne te donne par défaut un vrai dépôt git local avec des changements en stage, et la prémisse entière de cet outil est de rédiger un message pour *ton propre* travail en cours — le système de fichiers éphémère d'un notebook n'a rien de tout ça, et il n'y a rien de sensé à réellement commiter. Le notebook ci-dessous contourne cela honnêtement, plutôt que de prétendre que l'écart n'existe pas : il fait un `!git clone` du dépôt de ce cours lui-même dans le notebook et rédige un message pour un vrai petit commit historique de celui-ci avec `git show`, donc la capture du diff, le system prompt, et l'appel au LLM s'exécutent tous contre une sortie réelle et d'apparence réelle — c'est juste qu'il rédige pour un commit d'exemple fixe, et s'arrête là ; il ne démontre **pas** la boucle interactive d'accepter/modifier/commiter, puisque commiter n'a de sens que contre un dépôt dans lequel tu travailles vraiment. Utilise-le pour voir la logique de rédaction fonctionner de bout en bout sans aucune configuration ; passe à `uv` en local ou à un Codespace une fois que tu veux l'outil interactif complet pointé vers tes propres changements réels.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/commit-message-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/commit-message-agent/notebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant d'écrire une seule ligne du rédacteur lui-même : un vrai Python, une clé API gratuite, et un petit projet pour contenir les deux.

### Installe `uv`

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

### Mets en place le projet

```bash
uv init commit-message-agent
cd commit-message-agent
uv add openai python-dotenv
```

La bibliothèque cliente `openai` fonctionne ici pour chaque fournisseur du tableau ci-dessous, pas seulement OpenAI lui-même — GitHub Models, Gemini, Groq, Mistral, Cerebras et OpenRouter exposent tous un endpoint de chat compatible OpenAI, donc un seul client, pointé vers une `base_url` différente, est tout ce dont ce projet a besoin. `python-dotenv` te permet de garder ta clé API dans un fichier `.env` local plutôt que de faire `export` à chaque session.

### Obtiens une clé API LLM gratuite

**Choisis le fournisseur que tu préfères** — aucun ne nécessite de carte de crédit au moment de l'écriture, et ce cours n'en favorise aucun. L'exemple plus complet dans le dépôt du cours ([`examples/commit-message-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent)) supporte les six d'office, sélectionnables avec un seul réglage.

| Fournisseur | Où obtenir une clé | Pourquoi le choisir |
|---|---|---|
| **GitHub Models** *(par défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Limites de niveau gratuit plus généreuses que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée ; expose aussi un endpoint compatible OpenAI, utilisé ci-dessous. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, niveau gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume quotidien de tokens élevé, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, plusieurs modèles gratuits — bon pour comparer les fournisseurs. |

Quel que soit celui que tu choisis, le processus est le même :

1. Connecte-toi et génère une clé API sur le site de ce fournisseur.
2. **Ne colle jamais cette clé directement dans le code ni ne la commite dans un dépôt.** Crée plutôt un fichier `.env` dans le dossier de ton projet (ne le commite jamais) :

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=ta-clé-ici
```

Une clé API est un secret, exactement comme un mot de passe — quiconque la possède peut utiliser le quota de ton compte. La traiter comme une variable d'environnement plutôt qu'une chaîne codée en dur est la pratique standard exactement pour cette raison.

:::tip[Un fichier .env est souvent plus pratique qu'export]
Plutôt que de faire `export` d'une clé à chaque nouvelle session de terminal, `python-dotenv` lit un fichier `.env` dans le dossier de ton projet vers `os.environ` automatiquement, la première fois que ton script s'exécute — voir `load_dotenv()` à l'Étape 1 ci-dessous.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv --version` affiche un numéro de version.</StepChecklistItem>
<StepChecklistItem>`commit-message-agent/` existe avec un `pyproject.toml`, et `openai` et `python-dotenv` sont installés.</StepChecklistItem>
<StepChecklistItem>Tu as une vraie clé API d'un fournisseur, enregistrée dans un fichier `.env` dans le dossier de ton projet — pas collée dans un script.</StepChecklistItem>
</StepChecklist>

## Étape 1 : Capture un git diff en stage avec `subprocess`

Le module `subprocess` de Python exécute un autre programme et capture sa sortie sous forme de texte — ici, ce programme est `git diff --staged`, pas le simple `git diff` auquel tu pourrais penser en premier. C'est un choix délibéré : un message de commit devrait décrire ce qui va réellement être commité, c'est-à-dire ce que tu as mis en stage avec `git add`, pas chaque changement hors stage assis dans ton arbre de travail.

Crée `commit_helper.py` :

```python
# commit_helper.py
import subprocess

from dotenv import load_dotenv

load_dotenv()  # reads .env into the environment, if present


def get_diff_staged() -> str:
    """The diff between the index (staged changes) and the last commit."""
    return _run_git(["diff", "--staged"])


def _run_git(args: list[str]) -> str:
    """Runs `git <args>` in the current directory and returns its stdout."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed:\n{result.stderr}")
    return result.stdout


if __name__ == "__main__":
    diff = get_diff_staged()
    print(diff if diff.strip() else "No staged changes. Stage something first with `git add`.")
```

`subprocess.run([...], capture_output=True, text=True)` est la ligne clé : passer la commande comme une **liste** d'arguments (`["git", "diff", "--staged"]`) plutôt qu'une seule chaîne shell évite toute une classe de bugs de quoting shell et d'injection, `capture_output=True` capture stdout/stderr au lieu de les laisser s'afficher directement dans ton terminal, et `text=True` décode cette sortie comme une chaîne au lieu de bytes bruts. `check=False` plus un `if result.returncode != 0` manuel est délibéré ici plutôt que `check=True` : cela permet à cette fonction de lever sa *propre* erreur claire (incluant le vrai stderr de git) au lieu d'un `CalledProcessError` générique.

Essaie-le contre ce projet lui-même — modifie un fichier, fais-lui un `git add`, puis exécute :

```bash
uv run python commit_helper.py
```

:::tip[C'est le même pattern subprocess que n'importe quel autre wrapper CLI]
`subprocess.run` se moque que le programme exécuté soit `git` — il fonctionne à l'identique pour n'importe quel outil en ligne de commande : `ls`, un script shell, un autre programme Python. Une fois que ce pattern fait tilt, « laisser Python piloter un outil CLI existant et utiliser sa sortie » devient disponible pour bien plus que git seul.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`get_diff_staged()` retourne du vrai texte de diff après avoir fait `git add` sur un changement, et une chaîne vide quand rien n'est en stage.</StepChecklistItem>
<StepChecklistItem>Exécuter `commit_helper.py` dans un dossier qui n'est pas du tout un dépôt git lève un `RuntimeError` clair, pas une traceback confuse venant du fond de `subprocess`.</StepChecklistItem>
<StepChecklistItem>Tu peux expliquer, dans tes propres mots, pourquoi cet outil lit `git diff --staged` plutôt que le simple `git diff` (changements hors stage).</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si tu faisais `git add` sur un fichier et laissais un autre modifié-mais-hors-stage, que montrerait `get_diff_staged()`, et que montrerait le simple `git diff` (sans `--staged`) à la place ? Pourquoi un outil de messages de commit veut-il spécifiquement le premier ?
- Que retournerait `_run_git(["diff", "--staged"])` dans un dépôt avec des changements non commités qui sont tous hors stage ? Pourquoi gérer un diff vide, plutôt que supposer qu'il y a toujours quelque chose en stage, compte-t-il pour un outil censé s'exécuter dans le cadre d'un flux de travail de commit normal ?

## Étape 2 : Conçois le system prompt du message de commit

Un modèle de langage sans instructions pourrait écrire un message trop vague (« update code »), trop verbeux (un paragraphe complet pour la correction d'une faute de frappe d'une ligne), ou dans aucun format cohérent du tout. Le **system prompt** est ce qui transforme un modèle de chat généraliste en rédacteur qui se comporte comme un mainteneur de projet discipliné : quel format utiliser, quel ton adopter, et quand se donner la peine de faire plus d'une ligne.

```python
SYSTEM_PROMPT = """\
You are an experienced software engineer writing a git commit message for a
staged diff. You will be given a unified git diff. Base the message ONLY on
what the diff actually changes -- do not invent context you can't see, and
do not guess at a ticket number or issue reference that isn't in the diff.

Write the message in the Conventional Commits style:

    <type>(<optional scope>): <short summary, imperative mood, no period>

    <optional body: a few lines explaining WHY the change was made, not
    just restating what the diff shows -- wrap around 72 characters>

Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore.
Pick the type that best matches the *dominant* change -- if a diff touches
both a fix and its test, "fix" usually still wins over "test".

Rules:
- The summary line must stay under 72 characters and use the imperative
  mood ("add", not "added" or "adds").
- Only include a body if it adds real information beyond the summary --
  for a small, self-explanatory diff, the summary line alone is enough.
- Never wrap the whole message in a fenced code block or add commentary
  before/after it -- output ONLY the commit message text itself, nothing
  else, so it can be used directly as a commit message.
"""
```

Trois choix de conception délibérés qui valent la peine d'être remarqués :

- **Une structure fixe (`type(scope): summary`, corps optionnel)** est ce qui rend la sortie utilisable comme un vrai message de commit, pas une réponse de chat qui décrit par hasard le diff — [Conventional Commits](https://www.conventionalcommits.org/) est une convention largement utilisée spécifiquement parce que des outils (changelogs, semantic-release, CI) peuvent l'analyser de manière fiable.
- **« N'inclus un corps que s'il ajoute une information réelle »** empêche le modèle de rembourrer la correction d'une faute de frappe d'une ligne avec trois phrases de contenu de diff répété — le même instinct qu'a un relecteur humain quand il voit un message de commit gonflé pour un changement trivial.
- **« Base le message SEULEMENT sur ce que le diff change réellement... ne devine pas un numéro de ticket »** existe parce que les modèles hallucinent volontiers un `JIRA-1234` ou une référence d'issue plausible si tu ne l'interdis pas explicitement — une référence fabriquée dans un message de commit est pire que pas de référence du tout.

:::tip[Itère sur le prompt comme tu le ferais sur du code]
Traite ce system prompt comme un premier brouillon, pas une spec finie. Exécute-le contre un diff dont tu sais déjà qu'il mérite un `type` spécifique (un ajout pur de tests, un changement docs uniquement, une vraie correction de bug) — si le modèle choisit le mauvais type ou si le résumé devient trop long, resserre le texte et réessaie.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Tu peux expliquer, dans tes propres mots, pourquoi le prompt interdit d'inventer un numéro de ticket ou une référence d'issue qui n'est pas dans le diff.</StepChecklistItem>
<StepChecklistItem>Le prompt spécifie un format de sortie concret (`type(scope): summary`, corps optionnel), pas juste « écris un message de commit ».</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si tu supprimais l'instruction « n'inclus un corps que s'il ajoute une information réelle », quel type de messages de commit t'attendrais-tu à voir pour des diffs très petits et auto-explicatifs ?
- Le prompt liste dix types valides de Conventional Commits. Qu'est-ce qui irait mal pour l'outillage de changelog d'un vrai projet si le modèle était libre d'inventer ses propres types plutôt que de choisir dans une liste fixe ?

## Étape 3 : Appelle le LLM et construis la boucle interactive

Connecte le code de capture de diff de l'Étape 1 et le system prompt de l'Étape 2 ensemble, puis ajoute la partie qui fait de ceci un vrai outil plutôt qu'un script à usage unique : une boucle qui montre le brouillon et laisse un humain l'accepter, le modifier, ou le régénérer.

```python
# commit_helper.py (continued -- add these imports and functions)
import os

from openai import OpenAI

MAX_DIFF_CHARS = 12_000  # see the "huge diffs" pitfall below


def truncate_diff(diff: str, max_chars: int = MAX_DIFF_CHARS) -> str:
    """Cuts an oversized diff down to a size that fits a free-tier context window."""
    if len(diff) <= max_chars:
        return diff
    return diff[:max_chars] + f"\n\n... [diff truncated -- {len(diff) - max_chars} more characters not shown] ..."


def draft_commit_message(diff: str) -> str:
    """Sends a diff to the configured free-tier LLM and returns a drafted commit message.

    Returns a plain string. That's the whole job of this function -- it has
    no idea a terminal or a `git commit` call exists anywhere. See Step 4
    for the only place this tool actually commits.
    """
    if not diff.strip():
        return ""

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    diff = truncate_diff(diff)
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Write a commit message for this staged diff:\n\n```diff\n{diff}\n```"},
        ],
    )
    return response.choices[0].message.content.strip()


def run_interactive_loop(diff: str) -> None:
    """Drafts a message and lets the user accept, edit, or regenerate it -- see Step 4
    for where (and only where) an accepted message actually gets committed."""
    if not diff.strip():
        print("No staged changes. Stage something first with `git add`.")
        return

    print(f"Drafting a commit message from {len(diff)} characters of staged diff...\n")
    message = draft_commit_message(diff)

    while True:
        print("-" * 60)
        print(message)
        print("-" * 60)
        choice = input("\nUse this message? [y]es / [e]dit / [r]egenerate / [n]o, cancel: ").strip().lower()

        if choice in ("n", "no"):
            print("Cancelled -- nothing was committed.")
            return
        if choice in ("r", "regenerate"):
            message = draft_commit_message(diff)
            continue
        if choice in ("e", "edit"):
            message = input("Type your edited message: ").strip() or message
            continue
        if choice in ("y", "yes"):
            print(f"\n(Would commit here with message:\n{message}\n)")
            return

        print("Please answer y, e, r, or n.")


if __name__ == "__main__":
    diff = get_diff_staged()
    run_interactive_loop(diff)
```

`truncate_diff` compte plus ici qu'il n'y paraît au premier abord — voir la section des pièges ci-dessous pour comprendre pourquoi un gros diff n'est pas juste lent, il peut échouer silencieusement ou produire un message superficiel et générique. La boucle **n'**appelle délibérément **pas** `git commit` pour l'instant — l'Étape 4 ajoute cela comme sa propre petite fonction explicite, donc c'est évident exactement où et comment le commit se produit.

Exécute-le :

```bash
uv run python commit_helper.py
```

:::tip[Tu utilises un fournisseur différent ?]
Remplace le bloc `OpenAI(...)` par une `base_url` et une clé différentes — ex. `base_url="https://api.groq.com/openai/v1"` avec `api_key=os.environ["GROQ_API_KEY"]` pour Groq, ou `base_url="https://generativelanguage.googleapis.com/v1beta/openai/"` avec `api_key=os.environ["GOOGLE_API_KEY"]` pour l'endpoint compatible OpenAI de Gemini. Tout le reste dans ce fichier reste identique. Voir [`examples/commit-message-agent/commit_helper.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent/commit_helper.py) dans le dépôt du cours pour voir les six connectés côte à côte, sélectionnables avec une seule variable d'environnement.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python commit_helper.py` affiche un brouillon façon Conventional Commits pour un vrai diff en stage.</StepChecklistItem>
<StepChecklistItem>Taper `r` au prompt redemande au modèle et affiche un brouillon (peut-être différent), sans rien faire d'autre.</StepChecklistItem>
<StepChecklistItem>Taper `n` annule proprement, et taper `e` te permet de taper un message de remplacement avant de continuer.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `draft_commit_message` retourne tôt avec une chaîne vide quand le diff est vide, avant même de construire un client `OpenAI`. Pourquoi vérifier d'abord, appeler l'API ensuite, vaut-il la peine d'être fait délibérément, plutôt que de simplement laisser un prompt vide partir vers le modèle ?
- Si deux exécutions différentes de `draft_commit_message` sur le *même* diff en stage exact produisaient deux messages visiblement différents, cela te surprendrait-il ? Qu'est-ce que ça suggère sur la raison pour laquelle l'option `r` (régénérer) existe même, plutôt que de faire aveuglément confiance au premier brouillon ?

## Étape 4 : Connecte-le pour qu'il commite réellement — seulement sur confirmation

La dernière pièce : remplace le placeholder « (Commiterait ici...) » de l'Étape 3 par une fonction qui exécute réellement `git commit -m`, appelée depuis exactement un endroit — juste après que l'utilisateur tape `y`.

```python
# commit_helper.py (continued)
def _commit(message: str) -> None:
    """Runs the actual `git commit -m <message>`.

    This is the ONLY function in this file that commits anything. It's only
    ever called from run_interactive_loop, only ever after an explicit 'y'
    from a human. There is no other code path that reaches it.
    """
    result = subprocess.run(
        ["git", "commit", "-m", message],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git commit failed:\n{result.stderr}")
    print(result.stdout)
    print("Committed.")


def run_interactive_loop(diff: str) -> None:
    if not diff.strip():
        print("No staged changes. Stage something first with `git add`.")
        return

    print(f"Drafting a commit message from {len(diff)} characters of staged diff...\n")
    message = draft_commit_message(diff)

    while True:
        print("-" * 60)
        print(message)
        print("-" * 60)
        choice = input("\nUse this message? [y]es / [e]dit / [r]egenerate / [n]o, cancel: ").strip().lower()

        if choice in ("n", "no"):
            print("Cancelled -- nothing was committed.")
            return
        if choice in ("r", "regenerate"):
            message = draft_commit_message(diff)
            continue
        if choice in ("e", "edit"):
            message = input("Type your edited message: ").strip() or message
            continue
        if choice in ("y", "yes"):
            _commit(message)
            return

        print("Please answer y, e, r, or n.")
```

Essaie la boucle complète contre un vrai changement :

```bash
# make a small, real change
git add <the file you changed>
uv run python commit_helper.py
# read the draft, then type e to tweak it, r to try again, or y to commit for real
```

Vérifie que ça s'est vraiment produit :

```bash
git log -1
```

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Taper `y` au prompt crée réellement un vrai commit — `git log -1` montre le message que tu as accepté.</StepChecklistItem>
<StepChecklistItem>Taper `n` au prompt laisse tes changements en stage en stage et non commités — rien ne s'est passé.</StepChecklistItem>
<StepChecklistItem>Tu peux pointer la seule ligne de code où `git commit` est réellement invoqué, et expliquer pourquoi elle est atteignable depuis exactement un endroit.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `_commit` est une petite fonction séparée plutôt que d'être en ligne dans la branche `y` de la boucle. Qu'est-ce que la garder séparée facilite si tu voulais plus tard enregistrer chaque vrai commit que fait cet outil, ou ajouter un drapeau `--dry-run` qui la saute entièrement ?
- Imagine une version de cet outil qui saute le prompt de confirmation et commite automatiquement dès que le brouillon du modèle a l'air « confiant ». Quelle est une façon réaliste dont ça pourrait mal tourner sur un diff que tu n'as pas entièrement relu toi-même avant de le mettre en stage ?

:::tip[Ne laisse jamais un outil commiter sans qu'un humain confirme d'abord le message]
C'est la leçon la plus importante de ce projet, plus importante que n'importe quelle ligne de code spécifique : un outil qui *rédige* un message de commit est utile ; un outil qui *commite* un message de manière autonome est une chose très différente, bien plus risquée — un mauvais brouillon, un diff tronqué qui a caché le vrai changement, ou un modèle qui a une mauvaise journée, et l'historique a maintenant un message de commit qui ne décrit pas ce qui s'est réellement passé, avec ton nom dessus. `_commit` est la seule fonction ici qui touche à `git commit`, et elle n'est atteignable qu'après un `y` explicite. Ce n'est pas une fonctionnalité « auto-commit » manquante — c'est la conception. Garde cette limite si tu étends ce projet toi-même.
:::

## ⚠️ Pièges courants

- **Des diffs énormes qui dépassent la fenêtre de contexte ou le quota de tokens gratuit.** Un diff de plusieurs milliers de lignes (une grosse refonte, une mise à jour de dépendance vendorisée) peut dépasser ce que le modèle peut réellement traiter, ou simplement dépasser la limite de tokens par requête de ton niveau gratuit et échouer directement. `truncate_diff` à l'Étape 3 limite cela, mais la troncature signifie que le modèle rédige à partir d'une vue partielle — pour des changements vraiment gros, mets en stage et commite en morceaux plus petits et plus logiques plutôt que de faire confiance à un diff tronqué pour produire un message précis.
- **Mettre en stage des changements non liés ensemble.** Si `git add` récupère deux corrections non liées à la fois, aucun system prompt ne peut produire un message de commit honnête et focalisé pour les deux — le modèle choisira l'une à décrire et ignorera l'autre, ou écrira un message vague qui ne couvre bien ni l'une ni l'autre. `git add -p` pour mettre en stage des hunks sélectivement vaut la peine d'être appris en parallèle de cet outil.
- **Traiter le brouillon comme toujours correct.** Le modèle ne sait pas *pourquoi* tu as fait un changement, seulement ce que montre le diff — il peut mal interpréter l'intention (appeler « fix » une refonte délibérée, par exemple) d'une façon qu'un humain regardant le même diff ne ferait pas. Lire le brouillon avant de taper `y`, pas juste le survoler, est tout l'intérêt de l'étape de confirmation.
- **Commiter accidentellement des fichiers générés ou vendorisés.** Un diff qui touche `uv.lock`, un bundle minifié, ou un fichier auto-généré gaspille des tokens et produit généralement un message générique de faible qualité — vérifie ce qui est en stage (`git status`, `git diff --staged --stat`) avant d'exécuter le rédacteur, pas après.

## Ce que tu viens de construire

Un vrai CLI de messages de commit fonctionnel : il capture ton vrai `git diff` en stage via `subprocess`, rédige un message façon Conventional Commits avec un LLM gratuit guidé par un prompt conçu spécifiquement pour cette tâche, et n'exécute jamais `git commit` sauf après que tu aies lu le brouillon et explicitement dit oui. Rien ici n'est une simulation jouet — pointe-le vers ton propre travail en stage, ou vers un vrai commit historique du propre dépôt de ce cours, et il fonctionne contre le vrai texte dans les deux cas.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/commit-message-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent) dans le dépôt du cours est une version plus complète du code ci-dessus, avec les six fournisseurs du tableau connectés côte à côte (sélectionnés avec un seul réglage `LLM_PROVIDER`) et un ensemble d'options CLI `--dry-run`/`--commit`/`--stdin` déjà incluses. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Connecte ceci comme un vrai [alias git](https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases) (ex. `git draft-commit = !uv run --project ~/commit-message-agent python commit_helper.py`) pour que ce soit à une courte commande de distance dans n'importe quel dépôt, plutôt que de toujours faire `cd` vers le dossier de ce projet.
- Ajoute-le comme un prompt à l'intérieur d'un hook [pre-commit](https://pre-commit.com/) — plutôt que de remplacer `git commit` complètement, fais en sorte que le hook affiche le message rédigé comme une *suggestion* à côté de n'importe quel message que le développeur a déjà tapé, pour que ça reste un deuxième avis plutôt qu'une barrière.
- Essaie de comparer les brouillons entre deux fournisseurs différents sur le *même* diff en stage — choisissent-ils le même `type` de Conventional Commits ? Où ne sont-ils pas d'accord, et qu'est-ce que ça te dit sur combien faire confiance à la lecture d'un seul modèle sur « pourquoi » un changement a été fait, par opposition à juste « quoi » a changé ?

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="2027-commit-message-agent" />
