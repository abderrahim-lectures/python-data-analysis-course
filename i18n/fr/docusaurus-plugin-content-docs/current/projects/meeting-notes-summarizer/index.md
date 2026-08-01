---
id: meeting-notes-summarizer
title: "Construire un Résumeur de Notes de Réunion"
sidebar_label: "Résumeur de Notes de Réunion"
slug: /projects/meeting-notes-summarizer
description: "Passe du bac à sable dans le navigateur à du vrai Python : écris un script qui transforme une transcription brute de réunion en résumé structuré — décisions, éléments d'action et questions ouvertes — en utilisant un LLM gratuit et une conception soignée du prompt."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Résumeur de Notes de Réunion

<ProjectPublishedDate projectId="meeting-notes-summarizer" />

<ProjectGreeting />

Tout dans le cours jusqu'ici tournait dans un bac à sable isolé, dans le navigateur — pour que tu puisses commencer à écrire du Python dès le premier jour sans aucune configuration. Ce projet est l'étape de remise de diplôme : installe Python pour de vrai sur ta propre machine, puis utilise-le pour construire un outil qui résout un problème du monde réel authentiquement agaçant — transformer un mur de texte brut de transcription de réunion en un résumé court et structuré : ce qui a été décidé, qui doit quoi, et ce qui reste sans solution. Cela suppose du Python 101 ; rien de Data Analysis n'est requis.

Ceci est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Installer `uv`, un outil rapide et moderne pour gérer Python lui-même et les dépendances de ton projet.
2. Obtenir une clé API LLM de palier gratuit — l'un des six fournisseurs fonctionne.
3. Charger une transcription de réunion réelle (trois échantillons réalistes sont fournis avec ce projet, donc ça tourne sans aucune configuration).
4. Concevoir un prompt qui demande au modèle de renvoyer du **JSON structuré**, pas de la prose fluide — la compétence centrale et transférable de ce projet.
5. Appeler le modèle, puis analyser et valider sa réponse JSON — en gérant le cas où elle revient légèrement malformée, ce qui arrive plus souvent que tu ne le souhaiterais.
6. Formater le résultat structuré à la fois en Markdown lisible et en fichier `.json`, et exécuter le tout de bout en bout sur une transcription réelle.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et celui recommandé — c'est du vrai Python qui tourne sur ta propre machine, la même démarche de « passage au vrai Python » que chaque autre projet de cette section. La section Configuration ci-dessous explique comment l'installer.

**GitHub Codespaces** est une alternative sans configuration si tu préfères ne rien installer localement pour l'instant : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute exactement les mêmes commandes `uv` depuis un terminal dans l'onglet de ton navigateur.

**Google Colab, Kaggle Notebooks, ou Binder** fonctionnent bien aussi, et sont de bonnes options ici — ce projet est un script léger qui effectue une poignée d'appels API, pas quelque chose qui a besoin d'un GPU ou d'une vraie structure de projet pour être utile. Une version notebook prête à l'emploi est fournie avec ce projet — clique sur un badge ci-dessous pour l'ouvrir, aucune configuration locale requise — ou crée ton propre notebook, exécute `!pip install openai python-dotenv` dans une cellule, colle les scripts ci-dessous en tant que cellules, et définis ta clé API avec un secret de notebook (Colab) ou une variable d'environnement au lieu d'un fichier `.env`.

{/* TODO: update these badge links to point at main once this PR merges */}
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-notes-summarizer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-notes-summarizer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeeting-notes-summarizer%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant d'écrire le moindre code de résumé — installer `uv`, créer le projet, obtenir une clé API gratuite et la définir comme variable d'environnement — vit dans cette seule section, pour que tu n'aies à le faire qu'une seule fois.

### 1. Installe `uv`

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

`uv` peut aussi récupérer et gérer un véritable interpréteur Python directement :

```bash
uv python install 3.12
```

### 2. Crée le projet

```bash
uv init meeting-notes-summarizer
cd meeting-notes-summarizer
uv add openai python-dotenv
```

`uv init` crée un petit projet (un `pyproject.toml` qui suit tes dépendances) et `uv add` installe les paquets dans un environnement isolé automatiquement — aucune configuration manuelle d'environnement virtuel. `openai` est utilisé ici parce que plusieurs fournisseurs de palier gratuit, dont le défaut suggéré, exposent une API compatible OpenAI, donc la seule bibliothèque client fonctionne sur tous, juste pointée vers un `base_url` différent. `python-dotenv` te permet de garder ta clé API dans un fichier `.env` local au lieu de faire `export` à chaque session.

### 3. Obtiens une clé API LLM gratuite

**Choisis le fournisseur que tu veux** — aucun n'exige de carte de crédit au moment de la rédaction, et ce cours n'en privilégie aucun.

| Fournisseur | Où obtenir une clé | Pourquoi le choisir |
|---|---|---|
| **GitHub Models** *(défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le champ d'application `models: read` | Aucune inscription séparée — tu as déjà un compte GitHub. Limites de palier gratuit plus généreuses que celles de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, palier gratuit généreux, sans carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | L'un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume de jetons quotidien élevé, sans carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, de nombreux modèles gratuits — idéal pour comparer les fournisseurs. |

Quel que soit ton choix, le processus est le même : connecte-toi et génère une clé API sur le site de ce fournisseur.

### 4. Crée ton fichier `.env`

**Ne colle jamais une clé API directement dans le code et ne la commets jamais dans un dépôt.** Crée plutôt un fichier `.env` dans le dossier de ton projet (et assure-toi que `.env` est listé dans `.gitignore`, juste à côté de `.venv`) :

```bash
# .env
GITHUB_TOKEN=your-key-here
```

:::tip[Un fichier `.env` vaut mieux que faire `export` à chaque session]
`load_dotenv()` de `python-dotenv` lit `.env` dans `os.environ` automatiquement dès que ton script démarre, donc tu n'as jamais à penser à faire `export` d'une clé dans chaque nouvelle fenêtre de terminal. Voir le [`examples/meeting-notes-summarizer/.env.example`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer) de ce cours pour un modèle couvrant les six fournisseurs.
:::

La configuration terminée, tout ce qui suit concerne le résumeur lui-même.

## Étape 1 : Charge une transcription de réunion d'échantillon

Crée un dossier `transcripts/` et déposes-y une transcription de réunion en texte brut — ou copie l'un des trois échantillons réalistes fournis avec l'exemple du dépôt de ce projet : un daily standup, une réunion de planification produit et une revue d'incident (voir [`examples/meeting-notes-summarizer/sample_transcripts/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer/sample_transcripts)). Une transcription est juste du texte brut étiqueté par intervenant, rien de plus sophistiqué :

```text
Maria: Let's start with the API migration. Where are we?
James: About 70% done. I should finish the auth endpoints by Friday.
Maria: Good. Can you also write the migration guide for the team?
James: Yeah, I'll own that too.
Priya: Quick question -- are we still deprecating the v1 endpoints next month?
Maria: Let's hold off on that decision until James finishes the migration. I don't want to commit to a date yet.
```

La charger est l'étape la plus petite possible, délibérément :

```python
# load_transcript.py
"""Loads a plain-text meeting transcript from disk.

Run with: uv run python load_transcript.py transcripts/standup.txt
"""

import sys
from pathlib import Path


def load_transcript(path: str) -> str:
    """Reads a transcript file and returns its raw text."""
    text = Path(path).read_text(encoding="utf-8")
    if not text.strip():
        raise ValueError(f"{path} is empty -- nothing to summarize.")
    return text


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    transcript = load_transcript(path)
    print(f"Loaded {len(transcript)} characters from {path}")
    print(transcript[:200] + ("..." if len(transcript) > 200 else ""))
```

```bash
uv run python load_transcript.py transcripts/standup.txt
```

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python load_transcript.py <path>` affiche un nombre de caractères non nul et un aperçu qui ressemble à du vrai texte de transcription.</StepChecklistItem>
<StepChecklistItem>L'exécuter sur un chemin qui n'existe pas lève une erreur Python claire plutôt que de ne rien faire en silence.</StepChecklistItem>
<StepChecklistItem>L'exécuter sur un fichier vide lève le `ValueError` que tu as écrit, pas une erreur déroutante plus tard.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi vérifier ici, à l'Étape 1, qu'une transcription n'est pas vide, plutôt que de laisser un prompt vide atteindre le LLM à une étape ultérieure et voir ce qui se passe ?
- Cette fonction suppose que la transcription entière tient confortablement dans un seul prompt. Quelle transcription du monde réel briserait cette supposition, et comment le saurais-tu à peu près avant de l'exécuter ?

## Étape 2 : Conçois un prompt d'extraction structurée

C'est la vraie compétence que ce projet enseigne : au lieu de demander à un modèle un résumé en paragraphe de forme libre (« Veuillez résumer cette réunion »), tu lui demandes de renvoyer du **JSON avec une forme spécifique** — un schéma que tu définis — pour que la sortie soit quelque chose que ton propre code peut analyser, stocker et sur lequel il peut agir de manière fiable par la suite. C'est la même idée qu'un contrat d'API, simplement appliquée par le biais du libellé du prompt plutôt que d'un système de types.

Le schéma de ce projet : trois listes — `decisions`, `action_items` (chacun avec une `task` et un `owner` optionnel, lorsque la transcription en nomme réellement un) et `open_questions`.

```python
# extract_prompt.py
"""Builds the structured-extraction prompt sent to the LLM.

Imported by summarize.py (Step 3) -- not meant to be run directly.
"""

SYSTEM_PROMPT = """You are an assistant that extracts structured information \
from meeting transcripts. You always respond with a single JSON object and \
nothing else -- no markdown code fences, no commentary before or after it."""

# The exact shape we require back. Spelling this out in the prompt itself,
# field by field, is what makes a small/free-tier model actually follow it --
# vague instructions like "return the decisions and action items as JSON"
# produce far less consistent shapes across runs.
JSON_SCHEMA_DESCRIPTION = """Respond with a JSON object with EXACTLY these keys:

{
  "decisions": ["short string describing one decision that was made", ...],
  "action_items": [
    {"task": "short string describing the task", "owner": "person's name, or null if not stated"},
    ...
  ],
  "open_questions": ["short string describing one unresolved question", ...]
}

Rules:
- Only include a decision if the transcript shows the group actually agreeing on something -- not just discussing an option.
- Only include an action item if someone (or the group) commits to doing it.
- "owner" must be null (not the string "null", not "TBD") when no specific person is named for that task.
- If a category has nothing to report, use an empty list -- never omit the key.
- Do not invent information that isn't in the transcript."""


def build_prompt(transcript: str) -> list[dict]:
    """Returns the chat messages list ready to send to the LLM."""
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"{JSON_SCHEMA_DESCRIPTION}\n\nTranscript:\n{transcript}",
        },
    ]
```

Trois choses rendent cette conception de prompt délibérée, pas accidentelle :

1. **Le schéma est écrit littéralement**, clé par clé, avec une forme d'exemple — pas décrit en prose. Les modèles sont bien plus cohérents pour correspondre à un exemple que pour déduire un schéma d'une description.
2. **`owner` est explicitement autorisé à être `null`**, avec une règle explicite pour savoir quand l'utiliser. Sans cette règle, les modèles ont tendance à inventer un nom plausible, ou à écrire la chaîne `"TBD"` — une valeur que ton code Python devrait ensuite gérer de manière spéciale pour toujours.
3. **Le prompt système énonce le format de sortie comme une contrainte dure** (« rien d'autre — pas de délimiteurs de code markdown, pas de commentaires »), parce que la façon la plus courante que cela déraille (voir l'Étape 3) est qu'un modèle enveloppe son JSON dans un délimiteur de code ```` ```json ```` par habitude, même quand on lui dit de ne pas le faire.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`build_prompt(transcript)` renvoie une liste de deux dicts de message (`system`, `user`), avec le texte de la transcription réellement intégré dans le message utilisateur.</StepChecklistItem>
<StepChecklistItem>Tu peux montrer la phrase exacte dans `JSON_SCHEMA_DESCRIPTION` qui dit au modèle quoi faire quand aucun owner n'est nommé.</StepChecklistItem>
<StepChecklistItem>Tu pourrais expliquer, en une phrase, pourquoi le schéma est écrit comme un exemple JSON littéral au lieu d'une description en paragraphe.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si tu supprimais la règle « N'inclus une décision que si le groupe s'est réellement mis d'accord -- pas juste discuté d'une option », quel genre d'éléments penses-tu commencerait à s'infiltrer dans `decisions` sur une transcription pleine de débats aller-retour ?
- Le prompt demande `owner: null` plutôt que d'omettre entièrement le champ. Pourquoi cela pourrait-il être plus facile à gérer pour ton code Python qu'un schéma où un champ est parfois présent et parfois simplement absent ?

## Étape 3 : Appelle le LLM et analyse la réponse JSON

Envoie maintenant le prompt et transforme tout texte qui revient en vraies données Python — un `dict` sur lequel tu peux itérer, pas une chaîne que tu dois inspecter à l'œil. C'est là que les projets d'extraction structurée cassent le plus souvent en pratique : même un prompt bien conçu reçoit occasionnellement une réponse enveloppée dans un délimiteur de code, avec un commentaire de fin, ou avec une virgule égarée — et un `json.loads()` naïf plante sur les trois.

```python
# summarize.py (part 1 -- LLM call + parsing)
"""Calls a free-tier LLM to extract a structured summary from a transcript,
then parses and validates the JSON it returns.

Run with: uv run python summarize.py transcripts/standup.txt
"""

import json
import os
import re
import sys

from dotenv import load_dotenv
from openai import OpenAI

from extract_prompt import build_prompt
from load_transcript import load_transcript

load_dotenv()

REQUIRED_KEYS = {"decisions", "action_items", "open_questions"}


def call_llm(transcript: str) -> str:
    """Sends the structured-extraction prompt and returns the model's raw text reply."""
    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=build_prompt(transcript),
        temperature=0,  # deterministic-as-possible extraction, not creative writing
    )
    return response.choices[0].message.content


def extract_json(raw_text: str) -> str:
    """Strips common wrapping the model adds around JSON despite being told not to.

    Handles the two most frequent offenders: a ```json ... ``` markdown fence,
    and leading/trailing prose sentences around an otherwise-valid object.
    """
    text = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fenced:
        return fenced.group(1).strip()
    # No fence -- fall back to grabbing everything between the first "{" and
    # the last "}", in case the model added a sentence before or after the object.
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def parse_summary(raw_text: str) -> dict:
    """Parses and validates the model's response, raising a clear error if it
    doesn't match the schema after the best-effort cleanup in extract_json()."""
    cleaned = extract_json(raw_text)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Model response wasn't valid JSON even after cleanup: {error}\n"
            f"Raw response was:\n{raw_text}"
        ) from error

    if not isinstance(data, dict) or not REQUIRED_KEYS.issubset(data.keys()):
        raise ValueError(f"Response is missing required keys {REQUIRED_KEYS}. Got: {data!r}")

    # Normalize: make sure each list field really is a list, even if the
    # model returned a single object instead of a one-item list somewhere.
    for key in ("decisions", "action_items", "open_questions"):
        if not isinstance(data[key], list):
            data[key] = [data[key]]

    return data


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    transcript = load_transcript(path)
    raw = call_llm(transcript)
    summary = parse_summary(raw)
    print(json.dumps(summary, indent=2))
```

```bash
uv run python summarize.py transcripts/standup.txt
```

:::tip[Ne fais jamais aveuglément confiance à la forme de la sortie d'un LLM]
Traite la réponse d'un modèle de langage comme tu traiterais des données provenant d'une API non fiable ou d'un CSV téléchargé par un utilisateur : valide-les avant de les utiliser, ne les présume pas. `extract_json` gère les problèmes d'enveloppement courants, et `parse_summary` lève toujours une erreur claire et spécifique — avec le texte brut joint — si le résultat ne correspond vraiment pas au schéma, plutôt que de laisser un `KeyError` trois fonctions plus tard te laisser deviner ce qui a mal tourné. Renvoyer silencieusement un résumé vide en cas d'échec d'analyse serait pire que de planter : tu ne remarquerais jamais que l'extraction a silencieusement cessé de fonctionner.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python summarize.py transcripts/standup.txt` affiche du JSON valide et lisible avec les trois clés requises.</StepChecklistItem>
<StepChecklistItem>Tu peux expliquer ce que fait `extract_json` avec une réponse enveloppée dans ```` ```json ... ``` ````, par rapport à une sans aucun délimiteur.</StepChecklistItem>
<StepChecklistItem>Changer temporairement `REQUIRED_KEYS` pour inclure une clé dont tu sais qu'elle n'est pas dans le schéma et relancer produit ton propre `ValueError` clair, pas un plantage ailleurs.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Le repli de `extract_json` — saisir tout ce qui se trouve entre le premier `{` et le dernier `}` — casserait sur une transcription qui contient littéralement des accolades dans le texte prononcé par quelqu'un (par exemple en citant un extrait de code). Peux-tu imaginer une approche plus robuste, même si c'est plus de travail à implémenter ?
- Pourquoi `parse_summary` lève-t-il une exception avec la réponse brute jointe, au lieu de simplement renvoyer `None` quand l'analyse échoue ?

## Étape 4 : Formate le résultat en Markdown lisible

Le `dict` analysé est exactement ce que tu voudrais pour enregistrer dans une base de données ou alimenter un autre script, mais ce n'est pas quelque chose qu'un collègue veut lire dans un message Slack. Convertis-le aussi en un court résumé Markdown facile à parcourir — les mêmes données, formatées pour un humain plutôt que pour un programme.

```python
# format_summary.py
"""Formats a parsed summary dict as readable Markdown.

Imported by summarize.py (Step 5) -- not meant to be run directly.
"""


def format_markdown(summary: dict, source: str) -> str:
    lines = [f"# Meeting Summary — {source}", ""]

    lines.append("## Decisions")
    if summary["decisions"]:
        lines += [f"- {d}" for d in summary["decisions"]]
    else:
        lines.append("_No decisions recorded._")
    lines.append("")

    lines.append("## Action Items")
    if summary["action_items"]:
        for item in summary["action_items"]:
            owner = item.get("owner") or "unassigned"
            lines.append(f"- [ ] {item['task']} — **{owner}**")
    else:
        lines.append("_No action items recorded._")
    lines.append("")

    lines.append("## Open Questions")
    if summary["open_questions"]:
        lines += [f"- {q}" for q in summary["open_questions"]]
    else:
        lines.append("_No open questions recorded._")

    return "\n".join(lines)
```

`item.get("owner") or "unassigned"` fait double emploi : il gère à la fois un `None` littéral (ce que le prompt demande au modèle d'utiliser quand aucun owner n'est nommé) et, défensivement, une chaîne vide ou le mot `"null"` que certains petits modèles produisent occasionnellement malgré les instructions — dans les deux cas, le lecteur voit « unassigned » au lieu d'un blanc ou d'un `null` littéral déroutant.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`format_markdown(summary, "standup.txt")` renvoie une chaîne commençant par un en-tête `# Meeting Summary`.</StepChecklistItem>
<StepChecklistItem>Un élément d'action sans owner nommé s'affiche comme « unassigned », pas un blanc ou le mot « None ».</StepChecklistItem>
<StepChecklistItem>Passer un résumé où chaque liste est vide produit toujours un Markdown valide et lisible (les lignes `_No ... recorded._`), pas une section vide ou cassée.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Les éléments d'action s'affichent comme `- [ ] task` — la syntaxe de case à cocher du Markdown au goût GitHub. Où cela pourrait-il être réellement utile plutôt que purement décoratif, selon l'endroit où ce fichier atterrit (un issue GitHub, un message Slack, un fichier texte brut) ?
- Pourquoi construire le Markdown à partir du `dict` *déjà analysé*, plutôt que de demander au LLM de générer directement du Markdown à l'Étape 3 et de sauter cette étape ?

## Étape 5 : Exécute-le de bout en bout

Raccorde les pièces : charge une transcription, appelle le modèle, analyse et valide le JSON, puis écris à la fois un fichier `.md` et un fichier `.json` à côté de l'entrée.

```python
# summarize.py (part 2 -- appended to part 1 above)

from pathlib import Path

from format_summary import format_markdown


def summarize(path: str) -> dict:
    """Runs the full pipeline for one transcript and writes both output files."""
    transcript = load_transcript(path)
    raw = call_llm(transcript)
    summary = parse_summary(raw)

    stem = Path(path).stem
    Path(f"{stem}_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    Path(f"{stem}_summary.md").write_text(format_markdown(summary, source=path), encoding="utf-8")

    return summary


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    summary = summarize(path)
    print(format_markdown(summary, source=path))
    print(f"\n(also wrote {Path(path).stem}_summary.json and {Path(path).stem}_summary.md)")
```

```bash
uv run python summarize.py transcripts/standup.txt
uv run python summarize.py transcripts/product_planning.txt
uv run python summarize.py transcripts/incident_review.txt
```

Exécute-le sur les trois transcriptions d'échantillon (ou la version plus complète de [`examples/meeting-notes-summarizer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer) du dépôt, qui les fournit toutes les trois prêtes à l'emploi) et compare les sorties : un standup, une réunion de planification et une revue d'incident sollicitent chacune le schéma différemment — la revue d'incident, par exemple, a tendance à produire beaucoup plus de questions ouvertes que d'éléments d'action.

:::tip[Les limites de débit sont attendues, pas un bug]
Chaque palier gratuit plafonne les requêtes par minute ou par jour, et chaque appel à `summarize()` est exactement un appel API — donc l'exécuter sur plusieurs transcriptions à la suite peut occasionnellement rencontrer une erreur `429`. C'est le fournisseur qui te dit de ralentir, pas un signe que quelque chose est cassé ; attends le nombre de secondes suggéré et relance. Voir le projet [AI Agent](/docs/projects/ai-agent#gérer-les-limites-de-débit) pour un motif `try`/`except`-avec-réessai que tu peux copier directement si tu veux que cela récupère automatiquement.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python summarize.py transcripts/standup.txt` affiche un résumé Markdown lisible et signale l'écriture de deux fichiers de sortie.</StepChecklistItem>
<StepChecklistItem>`standup_summary.json` et `standup_summary.md` existent tous les deux ensuite, et le fichier JSON est valide (ouvre-le, ou réanalyse-le avec `json.load`).</StepChecklistItem>
<StepChecklistItem>L'exécuter sur une deuxième transcription différente produit un résumé qui reflète réellement le contenu de *cette* transcription — pas une copie de la sortie de la première.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si un collègue te remettait une transcription sans décision claire du tout — juste du brainstorming ouvert — à quoi t'attendrais-tu que `decisions` ressemble, et le libellé de ton prompt garantit-il réellement cela ?
- Qu'est-ce qui casserait si tu exécutais cela sur une transcription de deux heures et 15 000 mots au lieu de ces courts échantillons ? À quel moment aurais-tu besoin d'une stratégie comme l'approche de découpage du projet [RAG](/docs/projects/rag-notes) au lieu d'envoyer le tout dans un seul prompt ?

## ⚠️ Pièges courants

- **Le modèle enveloppe quand même son JSON dans un délimiteur de code markdown**, même quand on lui dit explicitement de ne pas le faire — surtout sur les modèles plus petits/de palier gratuit. `extract_json` à l'Étape 3 le retire automatiquement ; ne le saute pas et n'appelle pas `json.loads()` directement sur la réponse brute.
- **`owner` revient comme la chaîne `"null"`, `"TBD"` ou `"N/A"`** au lieu d'un vrai `null`/`None`. `item.get("owner") or "unassigned"` de `format_markdown` attrape les cas falsy, mais une chaîne littérale comme `"TBD"` passera telle quelle — ça vaut la peine de normaliser explicitement (par ex. `if owner in ("null", "TBD", "N/A", ""): owner = None`) si tu vois cela arriver souvent avec ton fournisseur choisi.
- **Oublier `temperature=0`.** Les tâches d'extraction veulent que la même transcription produise un résumé cohérent et reproductible — pas une variation créative entre les exécutions. Laisser le défaut (souvent `~1.0`) rend les résultats nettement moins stables d'une exécution à l'autre, ce qui rend le débogage de ton prompt plus difficile car tu ne peux pas savoir si un changement de sortie vient de ta modification du prompt ou juste de l'aléatoire.
- **Limites de débit sur le palier LLM gratuit.** Chaque appel à `summarize()` coûte une requête contre le quota de ton fournisseur ; l'exécuter sur de nombreuses transcriptions rapidement peut déclencher un 429. Voir le conseil ci-dessus.

## Ce que tu viens de construire

Un pipeline d'extraction structurée petit et complet : charger du texte brut, concevoir un prompt qui fige un schéma de sortie exact, appeler un LLM de palier gratuit, analyser et valider défensivement ce qui revient, et rendre le résultat à la fois pour les machines (JSON) et les humains (Markdown). Ce n'est pas une simplification jouet — exactement la même forme (prompt contraint par schéma → analyser → valider → se rabattre avec grâce) est la façon dont les systèmes de production extraient des données structurées de CV, factures, tickets de support et contrats. Échange le schéma et le prompt, et ce pipeline fonctionne toujours.

## Où aller à partir d'ici

- Étends le schéma avec un champ `sentiment` ou `meeting_type`, ou une `priority` sur chaque élément d'action — le motif (décrire le champ dans le prompt, le valider après l'analyse) est identique à ce que tu as déjà construit.
- Essaie de donner au modèle une transcription dans un format complètement différent (un export de chat, un fichier de sous-titres `.vtt` brut) et vois combien de nettoyage `load_transcript` a besoin avant que les résultats restent bons.
- Intéresse-toi à une bibliothèque de validation de schéma comme `pydantic` pour une version beaucoup plus stricte de `parse_summary` — au lieu de vérifier les clés à la main, définis un modèle `Summary` une fois et laisse-le valider (et même contraindre) les types pour toi, en levant une erreur structurée sur tout ce qui ne correspond pas.
- Combine cela avec le projet [AI Agent](/docs/projects/ai-agent) : donne à l'agent un outil qui appelle `summarize()` sur un fichier de transcription, pour qu'il puisse décider *quand* résumer dans le cadre d'une tâche plus grande au lieu que tu exécutes toujours le script à la main.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓

<ProjectProgressCheckbox projectId="meeting-notes-summarizer" />
