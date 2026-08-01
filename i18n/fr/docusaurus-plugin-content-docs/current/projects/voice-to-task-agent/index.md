---
id: voice-to-task-agent
title: "Construire un Agent de la Voix vers les Tâches"
sidebar_label: "Agent de la Voix vers les Tâches"
slug: /projects/voice-to-task-agent
description: "Passe du playground intégré au navigateur au vrai Python : transcris une note vocale localement et gratuitement avec le modèle open source Whisper d'OpenAI, puis utilise un LLM de niveau gratuit pour la transformer en une liste de tâches structurée."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Agent de la Voix vers les Tâches

<ProjectPublishedDate projectId="voice-to-task-agent" />

<ProjectGreeting />

Tout dans le cours jusqu'ici s'est exécuté dans un playground isolé intégré au navigateur — pour que tu puisses commencer à écrire du Python dès le premier jour avec zéro configuration. Ce projet est l'étape de remise des diplômes : installe du vrai Python sur ta propre machine, puis utilise-le pour construire quelque chose d'authentiquement utile — un petit pipeline qui prend une note vocale décousue et la transforme en une courte liste de tâches structurée, sans que tu aies à taper ou à organiser quoi que ce soit à la main. Cela suppose du Python 101 ; rien de l'Analyse de Données n'est requis.

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Transcrire une courte note vocale en texte, entièrement en local et gratuitement, en utilisant le modèle *open source* Whisper d'OpenAI (`openai-whisper`, s'exécutant sur ton propre CPU) — pas l'API Whisper payante.
2. Écrire un prompt qui demande à un LLM de niveau gratuit de lire cette transcription et d'en extraire des éléments d'action structurés : une tâche, une date limite optionnelle, une priorité optionnelle.
3. Exécuter tout le pipeline de bout en bout sur un enregistrement d'exemple fourni (ou le tien), et sauvegarder le résultat sous forme de simple liste de tâches.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal et recommandé — la transcription est un travail de CPU (pas besoin de GPU pour un clip court avec un petit modèle Whisper), donc ça tourne confortablement sur un ordinateur portable ordinaire. La configuration ci-dessous explique comment installer `uv`.

**GitHub Codespaces** fonctionne aussi : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés) et exécute exactement les mêmes commandes `uv` depuis un terminal dans ton onglet de navigateur. C'est un peu plus lent qu'un ordinateur portable moderne pour l'étape de transcription, puisque les machines Codespaces sont CPU uniquement, mais parfaitement utilisable pour les courts clips d'exemple d'ici.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-to-task-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-to-task-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fvoice-to-task-agent%2Fnotebook.ipynb)

**Google Colab est un très bon ajustement pour celui-ci** — meilleur que pour la plupart des autres projets de cette série. La vitesse de transcription de Whisper évolue beaucoup avec le matériel, et Colab te donne un GPU gratuit qu'un ordinateur portable local CPU uniquement n'a pas : `!pip install openai-whisper` dans une cellule, puis un runtime GPU, et même les tailles de modèle Whisper plus grandes (plus précises, normalement trop lentes pour être envisagées sur un CPU) deviennent pratiques. Si tu veux expérimenter avec la taille du modèle par rapport à la précision (voir le conseil à l'Étape 1), Colab est l'endroit pour le faire. Les badges ci-dessus ouvrent un [`notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-to-task-agent/notebook.ipynb) prêt à l'emploi qui exécute tout le pipeline avec zéro configuration locale — le même pipeline en deux étapes, le même audio d'exemple, juste dans un notebook hébergé plutôt que dans un terminal.

## Configuration

Tout ce qui est nécessaire avant que tu écrives du code de pipeline — installer `uv`, créer le projet, et obtenir une clé API LLM — vit ici, une fois, à l'avance. La construction réelle commence à l'Étape 1, en supposant que tout cela est déjà en place.

### Installer `uv`

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

### Configurer le projet

```bash
uv init voice-to-task-agent
cd voice-to-task-agent
uv add openai-whisper openai python-dotenv
```

`openai-whisper` est le modèle open source de parole en texte lui-même — malgré le nom du paquet, cela s'installe et s'exécute *localement*, sans clé API et sans coût par minute ; c'est juste qu'il est publié par OpenAI et partage un nom avec leur API hébergée, payante et séparée. `openai` est le client API simple utilisé à l'Étape 2 pour appeler le fournisseur de LLM de niveau gratuit que tu choisis — plusieurs d'entre eux exposent un endpoint compatible OpenAI, donc une seule bibliothèque client couvre les six. `python-dotenv` te permet de garder ta clé API LLM dans un fichier `.env` local au lieu de l'`export`-er à chaque session.

:::tip[La première exécution télécharge le modèle]
`openai-whisper` ne fournit pas les poids de son modèle — la première fois que ton code appelle `whisper.load_model(...)` (Étape 1), il télécharge les poids vers `~/.cache/whisper` (environ 140 Mo pour la taille `"base"` utilisée dans ce projet) et les réutilise à chaque exécution suivante. La première transcription semblera lente ; c'est le téléchargement, pas la transcription elle-même.
:::

### Obtenir une clé API LLM gratuite

**Choisis le fournisseur que tu préfères** — aucun n'exige une carte de crédit au moment de la rédaction, et ce cours n'en favorise pas un plutôt qu'un autre. L'exemple dans le dépôt du cours ([`examples/voice-to-task-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent)) supporte les six prêts à l'emploi, sélectionnés avec un seul réglage.

| Fournisseur | Où obtenir une clé | Pourquoi tu pourrais le choisir |
|---|---|---|
| **GitHub Models** *(défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Des limites de niveau gratuit plus généreuses que celles de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée ; utilisée dans des brouillons précédents de cette page. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, niveau gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume de jetons quotidien élevé, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, beaucoup de modèles gratuits — bien pour comparer les fournisseurs. |

Quel que soit ton choix, le processus est le même :

1. Connecte-toi et génère une clé API sur le site de ce fournisseur.
2. **Ne colle jamais cette clé directement dans le code et ne la committe pas dans un dépôt.** Crée plutôt un fichier `.env` dans ton dossier de projet (ne le committe jamais) :

```bash
# .env
GITHUB_TOKEN=your-key-here
```

Une clé API est un secret, exactement comme un mot de passe — n'importe qui avec elle peut utiliser le quota de ton compte. La traiter comme une variable d'environnement plutôt qu'une chaîne en dur est la pratique standard précisément pour cette raison, et c'est la même habitude construite dans le [projet AI Agent](/docs/projects/ai-agent) si tu as fait celui-là.

:::tip[Un fichier .env est souvent plus pratique que export]
Au lieu d'`export`-er une clé dans chaque nouvelle session de terminal, un fichier `.env` dans ton dossier de projet, chargé automatiquement avec `python-dotenv`, persiste entre les sessions sans que tu aies à t'en souvenir. Vois le `.env.example` de l'exemple du dépôt pour la liste complète des noms de variables, un par fournisseur.
:::

Une fois la configuration faite, tout ce qui suit suppose : `uv` est installé, ton projet contient `openai-whisper`, `openai`, et `python-dotenv`, et `.env` contient une vraie clé pour le fournisseur que tu as choisi.

## Étape 1 : Transcris une note vocale d'exemple localement

Tu n'as pas besoin d'un microphone ou d'un vrai enregistrement pour commencer — le dépôt du cours fournit trois courts clips d'exemple de notes vocales dans [`examples/voice-to-task-agent/sample_audio/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent/sample_audio). Prends-en un (ou enregistre le tien avec n'importe quelle app de notes vocales de téléphone/ordinateur portable et copie-le dans ton projet — `.wav` et `.mp3` fonctionnent tous les deux).

Crée `voice_to_tasks.py` :

```python
# voice_to_tasks.py
import sys

import whisper

WHISPER_MODEL_SIZE = "base"  # tiny / base / small / medium / large -- see the tip below

_whisper_model = None  # loaded lazily so importing this module doesn't load it


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print(f"Loading Whisper '{WHISPER_MODEL_SIZE}' model...")
        _whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
    return _whisper_model


def transcribe(audio_path: str) -> str:
    """Transcribes an audio file to plain text, entirely locally."""
    model = get_whisper_model()
    result = model.transcribe(audio_path)
    return result["text"].strip()


if __name__ == "__main__":
    audio_path = sys.argv[1] if len(sys.argv) > 1 else "sample_audio/memo_1_work_followups.wav"
    print(transcribe(audio_path))
```

```bash
uv run python voice_to_tasks.py sample_audio/memo_1_work_followups.wav
```

`whisper.load_model("base")` charge un réseau de neurones entraîné sur une énorme quantité de données de parole multilingue ; `model.transcribe(audio_path)` l'exécute sur ton fichier audio et retourne un dict dont la clé `"text"` est la transcription complète — Whisper gère lui-même le décodage audio (via `ffmpeg` sous le capot) et fonctionne sur `.wav`, `.mp3`, et la plupart des autres formats courants sans que tu aies à convertir quoi que ce soit à la main d'abord.

:::tip[La taille du modèle est un compromis vitesse/précision]
Whisper est disponible en cinq tailles — `tiny`, `base`, `small`, `medium`, `large` — chacune plus précise et plus lente que la précédente. `"base"` est un défaut raisonnable sur un CPU d'ordinateur portable pour de la parole anglaise courte et claire comme les clips d'exemple ; l'audio bruité, les accents que le modèle gère moins bien, ou la parole non anglaise profitent souvent de `"small"` ou `"medium"`, au prix d'un temps de transcription sensiblement plus long. C'est exactement le genre de compromis qui vaut la peine d'essayer avec un GPU — vois « Où exécuter ceci » ci-dessus pour pourquoi Colab est un bon ajustement ici spécifiquement.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python voice_to_tasks.py sample_audio/memo_1_work_followups.wav` affiche une vraie transcription, pas un traceback.</StepChecklistItem>
<StepChecklistItem>Le texte affiché correspond à peu près à ce que la note d'exemple dit réellement — Whisper ne sera pas parfait, mais il devrait être clairement reconnaissable.</StepChecklistItem>
<StepChecklistItem>Le relancer est sensiblement plus rapide que la première exécution (les poids du modèle sont maintenant mis en cache localement, pas re-téléchargés).</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `transcribe()` n'envoie jamais ton audio nulle part sur le réseau. Qu'est-ce que cela signifie pour utiliser ça sur une note vocale véritablement privée, par rapport à une API de transcription hébergée dans le cloud ?
- Si tu exécutais ça sur une note avec de la musique de fond, ou deux personnes parlant en même temps, à quoi t'attendrais-tu qu'il arrive à la qualité de la transcription ? Essaie sur ton propre enregistrement si tu en as un qui correspond.

## Étape 2 : Extrais des éléments d'action structurés avec un LLM gratuit

Une transcription n'est qu'un mur de texte — utile, mais pas encore une liste de tâches. Cette étape remet la transcription à un LLM de niveau gratuit avec un prompt lui demandant de la lire et de retourner de vraies données structurées : une entrée par élément d'action, chacune avec une description de tâche et, quand la transcription les implique, une date limite et une priorité.

Ajoute l'appel LLM à `voice_to_tasks.py` :

```python
# voice_to_tasks.py (additions)
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# All six free-tier providers from the table above happen to expose an
# OpenAI-compatible chat completions endpoint, so one client class covers
# all of them -- only base_url and model change.
PROVIDERS = {
    "github": {"env": "GITHUB_TOKEN", "base_url": "https://models.github.ai/inference", "model": "gpt-4o-mini"},
    "gemini": {"env": "GOOGLE_API_KEY", "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/", "model": "gemini-3.5-flash"},
    "groq": {"env": "GROQ_API_KEY", "base_url": "https://api.groq.com/openai/v1", "model": "llama-3.3-70b-versatile"},
    "mistral": {"env": "MISTRAL_API_KEY", "base_url": "https://api.mistral.ai/v1", "model": "mistral-small-latest"},
    "cerebras": {"env": "CEREBRAS_API_KEY", "base_url": "https://api.cerebras.ai/v1", "model": "llama-3.3-70b"},
    "openrouter": {"env": "OPENROUTER_API_KEY", "base_url": "https://openrouter.ai/api/v1", "model": "meta-llama/llama-3.3-70b-instruct:free"},
}

EXTRACTION_PROMPT = """You extract action items from a voice memo transcript.

Return a JSON object shaped exactly like this, with no other text before or
after it, and no markdown code fences:

{{"tasks": [{{"task": "...", "due_date": "...", "priority": "..."}}]}}

Rules:
- "task" is a short, clear action (e.g. "Email the client the revised
  proposal"), not a raw quote from the transcript.
- "due_date" is null if the transcript doesn't mention one -- do not invent
  a specific date that was never said.
- "priority" is "high", "medium", or "low" only if the transcript implies
  one; otherwise null.
- If there are no action items at all, return {{"tasks": []}}.

Transcript:
\"\"\"
{transcript}
\"\"\"
"""


def extract_action_items(transcript: str, provider: str | None = None) -> list[dict]:
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    config = PROVIDERS[provider]
    client = OpenAI(api_key=os.environ[config["env"]], base_url=config["base_url"])

    response = client.chat.completions.create(
        model=config["model"],
        messages=[{"role": "user", "content": EXTRACTION_PROMPT.format(transcript=transcript)}],
    )
    return json.loads(response.choices[0].message.content)["tasks"]
```

```bash
uv run python -c "
from voice_to_tasks import transcribe, extract_action_items
transcript = transcribe('sample_audio/memo_1_work_followups.wav')
print(extract_action_items(transcript))
"
```

Le prompt fait le vrai travail ici : il dit au modèle exactement quelle forme retourner (un objet JSON avec une liste `"tasks"`, pas une prose libre), et donne des règles explicites pour les parties délicates — n'invente pas une date limite qui n'a jamais été dite, ne devine pas une priorité qui n'est pas réellement impliquée. C'est la même idée que le prompt du [projet RAG](/docs/projects/rag-notes) disant au modèle de répondre *uniquement* à partir du contexte récupéré : une instruction claire et spécifique rétrécit ce que fait le modèle, au lieu d'espérer qu'il déduise la bonne forme tout seul.

`json.loads(...)["tasks"]` suppose que le modèle a réellement suivi l'instruction et retourné du JSON propre — les modèles de niveau gratuit ne le font parfois pas (une phrase parasite avant le JSON, un code fence markdown autour malgré la consigne de ne pas le faire). La version plus complète dans [`examples/voice-to-task-agent/voice_to_tasks.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent) retire un code fence s'il apparaît et lève une erreur claire au lieu d'un traceback déroutant si le JSON refuse toujours de s'analyser — à copier si tu prévois de l'exécuter sur plus de deux ou trois notes.

:::tip[Tu utilises un fournisseur différent ?]
Tout ce qui précède fonctionne déjà pour les six fournisseurs du tableau — il suffit de définir `LLM_PROVIDER` dans ton `.env` (ou de passer un nom de fournisseur directement à `extract_action_items`). Cela fonctionne parce que GitHub Models, Gemini, Groq, Mistral, Cerebras, et OpenRouter exposent tous un endpoint compatible OpenAI ; contrairement au [projet AI Agent](/docs/projects/ai-agent), tu n'as pas besoin d'une bibliothèque client différente par fournisseur ici, puisque ce script n'utilise pas LangChain.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`extract_action_items(transcript)` retourne une liste Python de dicts, pas une erreur.</StepChecklistItem>
<StepChecklistItem>Chaque dict a les clés `"task"`, `"due_date"`, et `"priority"` — même quand une valeur est `None`.</StepChecklistItem>
<StepChecklistItem>L'exécuter sur `memo_1_work_followups.wav` trouve à peu près trois tâches séparées, correspondant aux trois suivis réellement mentionnés dans cette note.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Le prompt dit explicitement « n'invente pas une date spécifique qui n'a jamais été dite. » À quoi t'attendrais-tu qu'il arrive si tu retirais cette instruction et que la transcription disait « quelque temps la semaine prochaine » ? Essaie — le modèle ajoute-t-il une vraie date de calendrier quand même ?
- Si la transcription mentionne la même tâche deux fois, formulée légèrement différemment à chaque fois (les gens font ça quand ils pensent à voix haute), t'attendrais-tu à une tâche dans la sortie ou deux ? Qu'est-ce que ta réponse suggère sur une limitation de demander à un modèle de faire ça en un seul passage, sans étape de déduplication propre ?

## Étape 3 : Exécute-le de bout en bout et sauvegarde une liste de tâches

Assemble les deux morceaux en un seul script qui transcrit, extrait, affiche une liste lisible, et la sauvegarde en JSON :

```python
# voice_to_tasks.py (additions)
def print_tasks(tasks: list[dict]) -> None:
    if not tasks:
        print("No action items found in this memo.")
        return
    markers = {"high": "\U0001f534", "medium": "\U0001f7e1", "low": "\U0001f7e2"}
    for item in tasks:
        marker = markers.get((item.get("priority") or "").lower(), "⚪")
        due = f" (due: {item['due_date']})" if item.get("due_date") else ""
        print(f"{marker} {item['task']}{due}")


def main() -> None:
    audio_path = sys.argv[1] if len(sys.argv) > 1 else "sample_audio/memo_1_work_followups.wav"

    print(f"Transcribing {audio_path} ...")
    transcript = transcribe(audio_path)
    print("\n--- Transcript ---")
    print(transcript)

    print("\nExtracting action items...")
    tasks = extract_action_items(transcript)

    print("\n--- Action items ---")
    print_tasks(tasks)

    with open("tasks.json", "w", encoding="utf-8") as f:
        json.dump(tasks, f, indent=2, ensure_ascii=False)
    print(f"\nSaved {len(tasks)} task(s) to tasks.json")


if __name__ == "__main__":
    main()
```

```bash
uv run python voice_to_tasks.py sample_audio/memo_3_project_planning.mp3
```

Essaie les trois clips d'exemple, et — si tu as un moyen d'en enregistrer un — ta propre note vocale aussi. Une courte liste de courses, un ensemble de suivis de réunion, ou une liste de corvées sont tous de bons tests : n'importe quoi avec une poignée d'éléments d'action distincts de longueur de phrase, parlés comme tu te parlerais réellement, pas une liste formellement structurée.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python voice_to_tasks.py` (avec n'importe lequel des trois clips d'exemple) affiche une transcription, puis une liste de tâches marquée, puis une ligne « Saved N task(s) ».</StepChecklistItem>
<StepChecklistItem>Un fichier `tasks.json` existe maintenant dans ton dossier de projet, et son contenu correspond à ce qui a été affiché.</StepChecklistItem>
<StepChecklistItem>L'exécuter sur une note sans véritables éléments d'action (essaie juste de décrire ta journée) affiche « No action items found » plutôt que d'en inventer des faux.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `tasks.json` s'écrase lui-même à chaque exécution, sans fusion d'une ancienne liste et d'une nouvelle. Que devrais-tu ajouter pour en faire une liste de tâches courante véritablement utile sur plusieurs notes, enregistrées des jours différents ?
- Ce pipeline a deux points de défaillance qui se comportent très différemment : Whisper qui entend mal un mot, et le LLM qui lit mal une phrase correctement transcrite. Si une tâche sort incorrecte, comment saurais-tu laquelle des deux étapes en a réellement été la cause ?

## ⚠️ Pièges courants

- **Confondre Whisper open source avec l'API Whisper payante.** `openai-whisper` (ce projet) s'exécute entièrement sur ta propre machine, gratuitement, sans clé API — ce n'est pas la même chose que `client.audio.transcriptions.create(...)`, l'endpoint de transcription *hébergé* et payant d'OpenAI. Les deux s'appellent « Whisper » et les deux viennent d'OpenAI, ce qui est exactement pourquoi il vaut la peine d'être explicite sur lequel un code donné utilise.
- **Une toute première exécution très longue, prise pour un blocage.** Le premier appel à `whisper.load_model(...)` télécharge les poids du modèle (vois le conseil de Configuration) — sur une connexion lente, ça peut prendre un moment sans barre de progression dans les versions plus anciennes. Laisse-le finir une fois ; chaque exécution après est rapide.
- **La réponse JSON du LLM n'est pas tout à fait du JSON valide.** Les modèles de niveau gratuit enveloppent parfois leur réponse dans un code fence markdown, ou ajoutent une phrase parasite, malgré une instruction explicite de ne pas le faire. Traite l'échec de `json.loads(...)` ici comme un événement attendu et occasionnel — pas un signe que ton prompt est fondamentalement cassé — et vois le `_parse_tasks_response` de l'exemple plus complet pour un correctif de suppression de fence.
- **Les limites de débit sur le niveau gratuit du LLM.** La transcription (Étape 1) est locale et illimitée ; seul l'appel d'extraction de l'Étape 2 compte contre le quota de niveau gratuit de ton fournisseur. Une erreur 429 là-bas, c'est le fournisseur qui te dit de ralentir, pas un bug — vois le [projet AI Agent](/docs/projects/ai-agent#gérer-les-limites-de-débit) pour le même pattern et une approche de nouvelle tentative que tu peux copier.

## Ce que tu viens de construire

Un pipeline petit mais complet reliant deux types de modèles d'IA véritablement différents : un modèle de parole en texte local, gratuit et à poids ouverts faisant l'écoute, et un modèle de langage hébergé de niveau gratuit faisant la lecture-et-structuration. Rien ici n'a été truqué — remplace par un vrai enregistrement plus long et plus brouillon, et les mêmes deux étapes (transcris, puis extrais) restent tout le pipeline. C'est aussi un petit exemple concret d'un pattern plus large qui vaut la peine d'être noté : toute tâche d'IA n'a pas besoin d'un énorme modèle hébergé. Whisper est assez petit pour s'exécuter localement gratuitement ; seule la partie du travail qui bénéficie réellement du raisonnement d'un grand modèle de langage — transformer un langage parlé lâche en données structurées propres — fait appel à l'un d'eux.

:::tip[Exécute une version plus complète sans aucune configuration locale pour le code]
[`examples/voice-to-task-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent) dans le dépôt du cours est une version un peu plus complète du code ci-dessus — le même pipeline en deux étapes, plus le correctif de suppression de fence mentionné ci-dessus et des messages d'erreur plus clairs. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le contre n'importe lequel des trois clips d'exemple dans `sample_audio/`.
:::

## Où aller à partir d'ici

- Essaie une taille de modèle Whisper plus grande (`"small"` ou `"medium"`) sur un enregistrement plus long et plus brouillon — bruit de fond, plusieurs locuteurs, ou une note non anglaise — et vois où `"base"` commence à montrer ses limites. C'est une excellente excuse pour essayer le chemin GPU de Colab depuis « Où exécuter ceci » ci-dessus.
- Groupe les tâches extraites par priorité, ou trie-les selon la façon dont le modèle rapporte les dates limites, au lieu de les afficher dans l'ordre de la transcription.
- Rends `tasks.json` cumulatif : charge le fichier existant (s'il y en a un), ajoute les tâches nouvellement extraites au lieu de les écraser, et déduplique tout ce qui ressemble à la même tâche dite deux fois.
- Branche ceci sur quelque chose qui consomme réellement la liste de tâches — ajouter à l'API d'une vraie app de tâches, un calendrier, ou même juste un fichier Markdown de checklist courant — au lieu d'un fichier JSON que rien d'autre ne lit encore.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue à l'écriture de Python hors du navigateur. 🎓

<ProjectProgressCheckbox projectId="voice-to-task-agent" />
