---
id: agentic-code-reviewer
title: "Construire un Relecteur de Code Agentique"
sidebar_label: "Construire un Relecteur de Code Agentique"
slug: /projects/agentic-code-reviewer
description: "Passe du bac à sable dans le navigateur au vrai Python : construis un outil CLI qui lit un vrai git diff via subprocess et demande à un LLM gratuit de le relire comme le ferait un humain."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Relecteur de Code Agentique

<ProjectPublishedDate projectId="agentic-code-reviewer" />

<ProjectGreeting />

Chaque pull request finit par être lue par un relecteur humain qui cherche des bugs, des problèmes de style, des tests manquants et des noms confus — avant cela, ce n'est cependant que du texte : la sortie de `git diff`. Ce projet construit un outil CLI qui fait cette première passe automatiquement : il capture un vrai diff avec le module `subprocess` de Python, le transmet à un modèle de langage gratuit avec un system prompt de relecteur soigneusement conçu, et affiche un retour structuré et actionnable — pas un vague « ça a l'air bien », mais des problèmes précis avec un fichier, une catégorie, une sévérité et une correction suggérée.

Cela suppose Python 101 et assez d'aisance avec git pour savoir ce que montre `git diff` — rien de Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Installer `uv`, obtenir une clé API LLM gratuite, et mettre en place un petit projet — tout au même endroit, avant de commencer à construire.
2. Utiliser le module `subprocess` de Python pour exécuter `git diff` pour de vrai et capturer sa sortie sous forme de texte.
3. Concevoir un system prompt qui transforme un modèle de chat généraliste en relecteur de code focalisé et structuré.
4. Envoyer un diff au modèle et afficher son retour dans un format clair et lisible.
5. Exécuter l'outil complet contre un vrai diff — tes propres changements non commités, et un commit spécifique passé de l'historique de ce cours lui-même.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal et recommandé ici, plus que pour la plupart des autres projets de cette série — la prémisse entière de cet outil est d'exécuter `git diff` contre un vrai dépôt git local, ce qui signifie qu'il a besoin d'un vrai dossier `.git` sur disque à pointer (ton propre projet, ou un clone du dépôt de ce cours).

**GitHub Codespaces** fonctionne bien aussi : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, `uv` et git sont déjà installés) — c'est un vrai clone avec un vrai historique, donc chaque étape ci-dessous, y compris la démo « relire un vrai commit passé », fonctionne exactement comme en local.

**Google Colab, Kaggle Notebooks et Binder sont une façon raisonnable d'*essayer* l'outil, mais pas de l'exécuter pour de vrai.** Aucun ne te donne par défaut un vrai dépôt git local avec un historique de commits, et la prémisse entière de cet outil est de relire *ton propre* travail en cours — le système de fichiers éphémère d'un notebook n'a rien de tout ça. Le notebook ci-dessous contourne cela honnêtement, plutôt que de prétendre que l'écart n'existe pas : il fait un `!git clone` du dépôt de ce cours lui-même dans le notebook et relit un vrai petit commit historique de celui-ci avec `git show`, donc chaque partie de l'outil (la capture de diff via `subprocess`, le system prompt, l'appel au LLM, la sortie structurée) s'exécute toujours contre une sortie réelle et d'apparence réelle — c'est juste qu'il relit un commit d'exemple fixe plutôt que quelque chose que tu as écrit personnellement. Utilise-le pour voir l'outil fonctionner de bout en bout sans aucune configuration ; passe à `uv` en local ou à un Codespace une fois que tu veux le pointer vers tes propres changements réels.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/agentic-code-reviewer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/agentic-code-reviewer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fagentic-code-reviewer%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant d'écrire une seule ligne du relecteur lui-même : un vrai Python, une clé API gratuite, et un petit projet pour contenir les deux.

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
uv init agentic-code-reviewer
cd agentic-code-reviewer
uv add openai python-dotenv
```

La bibliothèque cliente `openai` fonctionne ici pour chaque fournisseur du tableau ci-dessous, pas seulement OpenAI lui-même — GitHub Models, Gemini, Groq, Mistral, Cerebras et OpenRouter exposent tous un endpoint de chat compatible OpenAI, donc un seul client, pointé vers une `base_url` différente, est tout ce dont ce projet a besoin. `python-dotenv` te permet de garder ta clé API dans un fichier `.env` local plutôt que de faire `export` à chaque session.

### Obtiens une clé API LLM gratuite

**Choisis le fournisseur que tu préfères** — aucun ne nécessite de carte de crédit au moment de l'écriture, et ce cours n'en favorise aucun. L'exemple plus complet dans le dépôt du cours ([`examples/agentic-code-reviewer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer)) supporte les six d'office, sélectionnables avec un seul réglage.

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
Plutôt que de faire `export` d'une clé à chaque nouvelle session de terminal, `python-dotenv` lit un fichier `.env` dans le dossier de ton projet vers `os.environ` automatiquement, la première fois que ton script s'exécute — voir `load_dotenv()` à l'Étape 3 ci-dessous.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv --version` affiche un numéro de version.</StepChecklistItem>
<StepChecklistItem>`agentic-code-reviewer/` existe avec un `pyproject.toml`, et `openai` et `python-dotenv` sont installés.</StepChecklistItem>
<StepChecklistItem>Tu as une vraie clé API d'un fournisseur, enregistrée dans un fichier `.env` dans le dossier de ton projet — pas collée dans un script.</StepChecklistItem>
</StepChecklist>

## Étape 1 : Capture un git diff avec `subprocess`

Le module `subprocess` de Python exécute un autre programme et capture sa sortie sous forme de texte — ici, ce programme est `git` lui-même. C'est un usage authentiquement réaliste de `subprocess` : tu ne simules rien, tu exécutes exactement la même commande `git diff` que tu taperais à la main, et tu relis exactement ce qu'elle afficherait dans ton terminal.

Crée `review.py` :

```python
# review.py
import subprocess


def get_diff_uncommitted() -> str:
    """Le diff entre l'arbre de travail et le dernier commit -- changements en stage et hors stage."""
    return _run_git(["diff", "HEAD"])


def get_diff_against(ref: str) -> str:
    """Le diff entre l'arbre de travail et une autre référence, ex. 'main'."""
    return _run_git(["diff", ref])


def get_diff_for_commit(commit: str) -> str:
    """Le diff introduit par un commit spécifique passé, vs. son parent."""
    return _run_git(["show", commit])


def _run_git(args: list[str]) -> str:
    """Exécute `git <args>` dans le répertoire courant et retourne son stdout."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} a échoué:\n{result.stderr}")
    return result.stdout


if __name__ == "__main__":
    diff = get_diff_uncommitted()
    print(diff if diff.strip() else "Aucun changement non commité à relire.")
```

`subprocess.run([...], capture_output=True, text=True)` est la ligne clé : passer la commande comme une **liste** d'arguments (`["git", "diff", "HEAD"]`) plutôt qu'une seule chaîne shell évite toute une classe de bugs de quoting shell et d'injection, `capture_output=True` capture stdout/stderr au lieu de les laisser s'afficher directement dans ton terminal, et `text=True` décode cette sortie comme une chaîne au lieu de bytes bruts. `check=False` plus un `if result.returncode != 0` manuel est délibéré ici plutôt que `check=True` : cela permet à cette fonction de lever sa *propre* erreur claire (incluant le vrai stderr de git) au lieu d'un `CalledProcessError` générique.

Essaie-le contre ce projet lui-même — modifie n'importe quel fichier, ne le commite pas, puis exécute :

```bash
uv run python review.py
```

:::tip[C'est le même pattern subprocess que n'importe quel autre wrapper CLI]
`subprocess.run` se moque que le programme exécuté soit `git` — il fonctionne à l'identique pour n'importe quel outil en ligne de commande : `ls`, un script shell, un autre programme Python. Une fois que ce pattern fait tilt, « laisser Python piloter un outil CLI existant et utiliser sa sortie » devient disponible pour bien plus que git seul.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`get_diff_uncommitted()` retourne du vrai texte de diff quand tu as des changements non commités, et une chaîne vide sinon.</StepChecklistItem>
<StepChecklistItem>Exécuter `review.py` dans un dossier qui n'est pas du tout un dépôt git lève un `RuntimeError` clair, pas une traceback confuse venant du fond de `subprocess`.</StepChecklistItem>
<StepChecklistItem>Tu peux expliquer, dans tes propres mots, pourquoi la commande est passée comme une liste (`["git", "diff", "HEAD"]`) plutôt que la chaîne unique `"git diff HEAD"`.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Que retournerait `_run_git(["diff", "HEAD"])` pour un tout nouveau dépôt git avec un seul commit et aucun changement non commité ? Pourquoi gérer un diff vide, plutôt que supposer qu'il y a toujours quelque chose à relire, fait-il partie d'écrire cette fonction correctement ?
- `check=False` était un choix délibéré ci-dessus. Qu'est-ce qui changerait dans l'erreur que voit l'appelant si tu utilisais `check=True` à la place et laissais `subprocess.CalledProcessError` se propager sans être géré ?

## Étape 2 : Conçois le system prompt de relecture

Un modèle de langage sans instructions produira volontiers « ça a l'air bien ! » pour presque tout — inutile comme relecteur. Le **system prompt** est ce qui transforme un modèle de chat généraliste en relecteur qui se comporte de façon cohérente : quoi chercher, quoi ignorer, et quelle forme sa réponse doit prendre.

```python
SYSTEM_PROMPT = """\
You are an experienced, pragmatic senior software engineer doing a code review.
You will be given a unified git diff. Review ONLY what the diff actually
changes -- do not comment on surrounding code you can't see, and do not
invent context that isn't in the diff.

For each issue you find, report:
- file and, if visible in the diff's @@ hunk header, the approximate line
- category: one of Bug, Style, Missing Test, Unclear Naming, Security, Other
- severity: Critical, Warning, or Suggestion
- a short, concrete explanation of the issue
- a specific suggested fix, not just "consider improving this"

Focus on:
- likely bugs (off-by-one errors, unhandled edge cases, wrong operators,
  mutated shared state)
- style inconsistencies with the surrounding code
- missing or clearly inadequate test coverage for the change
- unclear variable/function names that would confuse the next reader
- obvious security issues (secrets, injection, unsafe deserialization)

If the diff genuinely has no issues, say so plainly and briefly -- do not
invent problems just to have something to say. Never respond with just
"looks good" and nothing else; always state what you checked.

Format your response as a numbered list of issues (or a short "no issues
found, because ..." paragraph), not prose paragraphs.
"""
```

Trois choix de conception délibérés qui valent la peine d'être remarqués :

- **« Relis SEULEMENT ce que le diff change réellement »** empêche le modèle d'inventer des plaintes plausibles sur du code qu'il ne peut pas réellement voir — un diff montre les lignes changées plus un peu de contexte environnant, pas le fichier entier.
- **Une structure requise** (fichier, catégorie, sévérité, explication, correction) est ce qui transforme un chat en format libre en quelque chose sur lequel tu peux réellement agir rapidement, la même raison pour laquelle un « LGTM avec deux commentaires » d'un relecteur humain est plus utile qu'un paragraphe d'impressions vagues.
- **Une instruction explicite de dire quand rien ne va pas** existe parce que les modèles ont tendance à être conciliants — sans cette ligne, certains modèles fabriquent de petites remarques juste pour paraître minutieux, ce qui t'entraîne à arrêter de faire confiance à la sortie de l'outil.

:::tip[Itère sur le prompt comme tu le ferais sur du code]
Traite ce system prompt comme un premier brouillon, pas une spec finie. Exécute-le contre un diff dont tu sais déjà qu'il contient un bug spécifique — si le modèle le rate, ou si le format de réponse dérive, resserre le texte et réessaie. L'ingénierie de prompt pour une tâche focalisée comme celle-ci ressemble plus à écrire une spec très précise qu'à « demander gentiment ».
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Tu peux expliquer, dans tes propres mots, pourquoi le prompt dit au modèle de signaler quand il ne trouve rien de mal, plutôt que de laisser cela implicite.</StepChecklistItem>
<StepChecklistItem>Le prompt spécifie une structure de sortie concrète (fichier, catégorie, sévérité, explication, correction), pas juste « donne un retour ».</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si tu supprimais l'instruction « Relis SEULEMENT ce que le diff change réellement », quel type d'erreur t'attendrais-tu à voir le modèle commencer à faire sur un diff qui ne change qu'une ligne au milieu d'une grande fonction ?
- Le prompt demande un niveau de sévérité par problème. Qu'est-ce qu'un outil de relecture qui rapporterait *chaque* problème comme également important serait-il pire à faire, comparé à un outil qui distingue Critical de Suggestion ?

## Étape 3 : Appelle le LLM et affiche un retour structuré

Connecte le code de capture de diff de l'Étape 1 et le system prompt de l'Étape 2 ensemble dans un relecteur fonctionnel :

```python
# review.py (suite -- ajoute ces imports et fonctions)
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # lit .env vers l'environnement, si présent

MAX_DIFF_CHARS = 12_000  # voir le piège des « diffs énormes » ci-dessous


def truncate_diff(diff: str, max_chars: int = MAX_DIFF_CHARS) -> str:
    """Réduit un diff surdimensionné à une taille qui tient dans une fenêtre de contexte gratuite."""
    if len(diff) <= max_chars:
        return diff
    return diff[:max_chars] + f"\n\n... [diff tronqué -- {len(diff) - max_chars} caractères supplémentaires non affichés] ..."


def review_diff(diff: str) -> str:
    """Envoie un diff au LLM gratuit configuré et retourne sa relecture sous forme de texte."""
    if not diff.strip():
        return "Aucun changement à relire -- le diff est vide."

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    diff = truncate_diff(diff)
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirme que ça a encore un niveau gratuit avant d'exécuter
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Review this diff:\n\n```diff\n{diff}\n```"},
        ],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    diff = get_diff_uncommitted()
    print(f"Relecture de {len(diff)} caractères de diff...\n")
    print(review_diff(diff))
```

`truncate_diff` compte plus ici qu'il n'y paraît au premier abord — voir la section des pièges ci-dessous pour comprendre pourquoi un gros diff n'est pas juste lent, il peut échouer silencieusement ou obtenir une relecture superficielle. Envelopper le diff dans un bloc de code avec fence ` ```diff ` dans le message utilisateur, plutôt que de le coller brut, est un petit signal réel envoyé au modèle sur le type de texte qu'il regarde.

Exécute-le :

```bash
uv run python review.py
```

:::tip[Tu utilises un fournisseur différent ?]
Remplace le bloc `OpenAI(...)` par une `base_url` et une clé différentes — ex. `base_url="https://api.groq.com/openai/v1"` avec `api_key=os.environ["GROQ_API_KEY"]` pour Groq, ou `base_url="https://generativelanguage.googleapis.com/v1beta/openai/"` avec `api_key=os.environ["GOOGLE_API_KEY"]` pour l'endpoint compatible OpenAI de Gemini. Tout le reste dans ce fichier reste identique. Voir [`examples/agentic-code-reviewer/review.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer/review.py) dans le dépôt du cours pour voir les six connectés côte à côte, sélectionnables avec une seule variable d'environnement.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python review.py` affiche une liste numérotée de vrais problèmes (ou un message clair « aucun problème trouvé ») pour un diff dont tu sais qu'il contient des changements.</StepChecklistItem>
<StepChecklistItem>Chaque problème rapporté nomme un fichier et une catégorie, pas juste un commentaire vague.</StepChecklistItem>
<StepChecklistItem>L'exécuter avec un diff vide affiche « Aucun changement à relire » plutôt que de faire un appel API du tout.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `review_diff` retourne tôt avec une chaîne fixe quand le diff est vide, avant même de construire un client `OpenAI`. Pourquoi cet ordre — vérifier d'abord, appeler l'API ensuite — vaut-il la peine d'être fait délibérément, plutôt que de simplement laisser un prompt vide partir vers le modèle ?
- Si deux exécutions différentes de `review_diff` sur le *même* diff exact produisaient deux listes différentes de problèmes, cela te surprendrait-il ? Qu'est-ce que ça suggère sur le fait de traiter la sortie de cet outil comme une checklist à laquelle faire aveuglément confiance versus un point de départ pour une relecture humaine ?

## Étape 4 : Exécute-le contre un vrai diff, de bout en bout

Deux façons réalistes d'utiliser cet outil, toutes deux valent la peine d'être essayées :

**1. Relis tes propres changements non commités** — le cas d'usage quotidien. Fais un petit changement délibéré dans n'importe quel fichier (introduis un bug évident exprès, si tu veux un test clair), puis :

```bash
uv run python review.py
```

**2. Relis un commit spécifique de l'historique de ce cours lui-même** — une bonne façon de voir l'outil fonctionner sur un vrai diff que tu n'as pas écrit toi-même. Ajoute une petite option CLI pour pouvoir le pointer vers n'importe quel commit par son hash :

```python
# review.py (suite)
import argparse
import sys


def get_diff_for_commit(commit: str) -> str:
    """Le diff introduit par un commit spécifique passé, vs. son parent."""
    return _run_git(["show", commit])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Relit un git diff avec un LLM gratuit.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--against", metavar="REF", help="Relit le diff contre REF, ex. 'main'.")
    group.add_argument("--commit", metavar="SHA", help="Relit un commit spécifique passé.")
    group.add_argument("--stdin", action="store_true", help="Lit le diff depuis stdin au lieu d'exécuter git.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.stdin:
        diff = sys.stdin.read()
    elif args.commit:
        diff = get_diff_for_commit(args.commit)
    elif args.against:
        diff = get_diff_against(args.against)
    else:
        diff = get_diff_uncommitted()

    print(f"Relecture de {len(diff)} caractères de diff...\n")
    print(review_diff(diff))
```

Clone ou ouvre le dépôt de ce cours, puis pointe l'outil vers un vrai commit passé :

```bash
git log --oneline -10          # trouve un vrai hash de commit à essayer
uv run python review.py --commit <hash>
```

Tu peux aussi comparer ta branche actuelle à une autre, ou passer un diff directement par pipe plutôt que de laisser le script exécuter `git` lui-même — pratique dans un job CI qui a déjà le diff comme fichier :

```bash
uv run python review.py --against main
git diff main | uv run python review.py --stdin
```

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python review.py --commit <un vrai hash>` affiche un vrai retour sur les vrais changements de ce commit.</StepChecklistItem>
<StepChecklistItem>`uv run python review.py --against main` et le pipe via `--stdin` produisent tous les deux une sortie sensée sur un dépôt avec plus d'une branche.</StepChecklistItem>
<StepChecklistItem>Tu as exécuté l'outil sur au moins un diff que tu as écrit toi-même, et lu le retour assez attentivement pour être d'accord ou pas avec lui.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Choisis un commit de l'historique réel de ce cours et relis-le avec ton outil. Le retour correspond-il à ce que tu attendrais qu'un relecteur humain dise sur ce changement ? Où aide-t-il clairement, et où manque-t-il un contexte qu'un humain aurait eu (comme *pourquoi* le changement a été fait) ?
- `--stdin` permet à autre chose de générer le diff plutôt que les propres appels `subprocess` de ce script. Quel est un exemple de flux de travail réel (indice : un pipeline CI, un hook pre-commit) où cette flexibilité compte plus que la commodité ?

## ⚠️ Pièges courants

- **Des diffs énormes qui dépassent la fenêtre de contexte ou le quota de tokens gratuit.** Un diff de plusieurs milliers de lignes (une grosse refonte, une mise à jour de dépendance vendorisée) peut dépasser ce que le modèle peut réellement traiter, ou simplement dépasser la limite de tokens par requête de ton niveau gratuit et échouer directement. `truncate_diff` à l'Étape 3 limite cela, mais la troncature signifie une relecture partielle — pour des changements vraiment gros, relis-les en morceaux plus petits (un fichier ou un commit logique à la fois) plutôt que de faire confiance à une passe tronquée qui aurait tout vu.
- **Relire des fichiers générés ou vendorisés.** Un diff qui touche `uv.lock`, un bundle minifié, ou un fichier de migration auto-généré gaspille des tokens sur du texte qu'aucun humain n'a écrit ni n'a besoin de commentaires dessus, et peut noyer le vrai retour sur les fichiers qui comptent vraiment. Filtre-les avant d'appeler `git diff` (ex. `git diff -- . ':!uv.lock' ':!*.min.js'`) plutôt que de tout envoyer.
- **Trop faire confiance à la relecture IA comme remplacement d'une relecture humaine.** Cet outil est une première passe rapide, pas un relecteur avec un contexte complet du projet, les conventions de l'équipe, ou la capacité de te demander *pourquoi* tu as fait un changement. Traite sa sortie comme tu traiterais les commentaires d'un collègue très rapide mais un peu inexpérimenté — ça vaut la peine d'être lu, pas la peine de merger dessus seul.
- **Ne pas gérer un diff vide ou manquant.** Exécuter l'outil sans changements non commités et sans drapeau `--commit`/`--against` contre un dépôt sans rien à comparer produira un diff vide — le retour anticipé de `review_diff` pour une entrée vide (Étape 3) existe spécifiquement pour que cela ne se transforme pas en appel API gaspillé ou en réponse vide et confuse du modèle.

## Ce que tu viens de construire

Un vrai CLI de relecture de code fonctionnel : il capture un vrai git diff via `subprocess` — la même commande que tu taperais à la main — et le transforme en retour structuré et actionnable d'un LLM gratuit, guidé par un system prompt conçu spécifiquement pour relire du code plutôt que de discuter génériquement. Rien ici n'est une simulation jouet : pointe-le vers un vrai commit de l'historique de ce cours lui-même, ou vers ton propre travail non commité, et il relit le vrai texte, pas un exemple en conserve.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/agentic-code-reviewer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer) dans le dépôt du cours est une version plus complète du code ci-dessus, avec les six fournisseurs du tableau connectés côte à côte (sélectionnés avec un seul réglage `LLM_PROVIDER`) et les options `--against`/`--commit`/`--stdin` de l'Étape 4 déjà incluses. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute un drapeau `--severity-min` qui filtre la sortie du modèle pour ne garder que les problèmes `Critical` et `Warning` — utile une fois que tu exécutes ceci sur de plus gros diffs et que tu veux trier rapidement plutôt que lire chaque `Suggestion`.
- Connecte ceci à un hook pre-commit ou à un job GitHub Actions pour que chaque pull request de tes propres projets reçoive automatiquement un commentaire de première relecture — l'option `--stdin` de l'Étape 4 est exactement la forme dont un job CI a besoin (il a déjà le diff, généré autrement).
- Essaie de comparer le retour entre deux fournisseurs différents sur le *même* diff — signalent-ils les mêmes problèmes ? Où ne sont-ils pas d'accord, et qu'est-ce que ça te dit sur le fait de se fier à la relecture d'un seul modèle comme vérité absolue ?

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="agentic-code-reviewer" />
