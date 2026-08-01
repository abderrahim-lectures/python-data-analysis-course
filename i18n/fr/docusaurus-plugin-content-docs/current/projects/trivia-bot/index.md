---
id: trivia-bot
title: "Construire un Bot de Trivia pour Discord"
sidebar_label: "Construire un Bot de Trivia pour Discord"
slug: /projects/trivia-bot
description: "Construis un bot `discord.py` qui organise des manches de trivia dans un serveur, suit les scores dans un classement persistant, et peut générer des questions inédites sur n'importe quel sujet avec un LLM de niveau gratuit."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Bot de Trivia pour Discord

<ProjectPublishedDate projectId="trivia-bot" />

<ProjectGreeting />

Un bot `discord.py` en direct qui organise des manches de trivia dans un serveur : poste une question, recueille les réponses dans un délai, révèle qui a trouvé la bonne réponse, et garde un classement persistant à travers les manches. La plupart des bots de trivia s'arrêtent à une banque de questions fixe — celui-ci ajoute une touche qui convient à un cours de Python : il peut aussi générer une question inédite sur n'importe quel sujet à la volée avec un LLM de niveau gratuit, au lieu de toujours puiser dans une liste préfabriquée.

Cela suppose du Python de niveau Python 101. Aucun autre Projet du Monde Réel n'est requis au préalable, même si tu as déjà construit [Construire une App RAG](/docs/projects/rag-notes), la configuration du LLM de niveau gratuit ci-dessous te semblera familière.

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Créer une application de bot Discord et récupérer son jeton depuis le portail gratuit des développeurs de Discord.
2. Installer `uv`, configurer un projet, et ajouter `discord.py` en plus d'un client LLM de niveau gratuit.
3. Construire une banque de questions de trivia fixe et une commande slash Discord de base qui en poste une.
4. Ajouter un classement persistant par joueur, stocké entre les redémarrages.
5. Ajouter un mode de génération de questions par LLM : donne un sujet au bot, récupère une question inédite.
6. Brancher le tout dans une boucle de manche complète — poste une question, recueille les réponses dans un délai, révèle la réponse, met à jour le classement.
7. Inviter le bot sur un serveur de test et jouer de vraies manches, de bout en bout.

## Où exécuter ceci

**En local avec `uv`** est vraiment la seule option pratique ici, plus que pour la plupart des autres projets de cette série. Un bot Discord n'est pas un script qui s'exécute une fois et se termine — il maintient une connexion ouverte avec Discord et doit continuer à tourner tant que tu veux qu'il réponde à `/trivia` et recueille des réponses, ce qui signifie un vrai processus local (ou hébergé) de longue durée, pas une commande ponctuelle.

**GitHub Codespaces** fonctionne aussi, et c'est un substitut raisonnable si tu préfères ne rien installer localement : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute `uv run python bot.py` dans un terminal là-bas — il reste actif aussi longtemps que ce terminal (et le Codespace) reste ouvert, la même exigence de « processus de longue durée » que de l'exécuter en local.

**Google Colab et Kaggle Notebooks sont un mauvais choix pour le bot réel** — sois honnête avec toi-même à ce sujet plutôt que de lutter contre. Les notebooks sont construits autour du fait d'exécuter une cellule, d'obtenir la sortie, et de passer à la cellule suivante ; ils ne sont pas faits pour un processus en arrière-plan qui s'assoit et attend des événements indéfiniment. Tu *peux* démarrer la boucle d'événements d'un bot dans une cellule de notebook, mais dès que le runtime du notebook est recyclé, se déconnecte, ou que tu fermes l'onglet, le bot tombe avec lui — saute Colab/Kaggle pour le bot en direct et utilise un vrai processus local ou Codespaces à la place.

Cela dit, la génération de questions et le scoring *sous* le bot ne sont que des fonctions normales qui exécutent une cellule à la fois, ce qui est exactement ce pour quoi les notebooks sont bons. Les badges ci-dessous ouvrent un notebook qui génère de vraies questions LLM sur quelques sujets d'exemple et fait passer quelques « joueurs » factices à travers la logique de scoring, pour que tu puisses voir les deux fonctionner sans rien installer localement. Il s'arrête délibérément avant la couche Discord — pour cela, reviens ici et exécute `bot.py` en local ou dans Codespaces comme décrit ci-dessus.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/trivia-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/trivia-bot/notebook.ipynb)

## Configuration

Tout dans cette section n'a besoin de se produire qu'une seule fois, avant que tu écrives la moindre ligne du bot lui-même : installer `uv`, créer l'application de bot Discord et récupérer son jeton, obtenir une clé LLM gratuite, et configurer le projet. Chaque étape après celle-ci suppose que tout cela est déjà fait.

### Installer `uv`

`uv` est un outil unique qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets » — il peut installer et gérer les versions de Python lui-même, en plus des dépendances de ton projet.

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

### Créer une application de bot Discord et obtenir un jeton

Le [Portail des Développeurs](https://discord.com/developers/applications) de Discord est gratuit et ne demande aucune carte :

1. Connecte-toi et clique sur **New Application**, donne-lui un nom (ex. « trivia-bot »), et crée-la.
2. Ouvre l'onglet **Bot** à gauche. Discord ajoute un utilisateur bot à ton application automatiquement.
3. Clique sur **Reset Token** (ou **View Token** si c'est la première fois) et copie-le. Ce jeton est exactement comme un mot de passe — quiconque l'a peut contrôler ton bot — alors traite-le de la même façon que tu traiterais une clé API LLM : ne le colle jamais dans le code, ne le commite jamais.
4. Sur le même onglet **Bot**, fais défiler jusqu'à **Privileged Gateway Intents** et active **Message Content**. C'est nécessaire pour que le bot lise réellement la lettre avec laquelle un joueur répond — sans cela, `discord.py` reçoit une chaîne vide pour le contenu de chaque message, peu importe le code que tu écris.
5. Ouvre **OAuth2 → URL Generator**. Sous **Scopes**, coche à la fois `bot` et `applications.commands` (les commandes slash ont spécifiquement besoin du second) ; sous **Bot Permissions**, coche au moins **Send Messages** et **Read Message History**. Garde l'URL générée à portée de main — tu l'utiliseras à la dernière étape pour réellement inviter le bot sur un serveur.

:::tip[Un jeton de bot est un secret, exactement comme une clé API]
Ne code jamais en dur le jeton du bot, ne le commite jamais, et garde-le dans un fichier `.env` local (ci-dessous) à la place — un jeton de bot divulgué permet à n'importe qui d'usurper ton bot dans chaque serveur où il se trouve, exactement comme une clé LLM divulguée permet à n'importe qui de dépenser ton quota.
:::

### Obtenir une clé API LLM gratuite

Le mode de génération de questions a besoin d'une clé LLM de niveau gratuit — **choisis le fournisseur que tu veux**, aucun ne demande de carte de crédit au moment de la rédaction :

| Fournisseur | Où obtenir une clé | Pourquoi le choisir |
|---|---|---|
| **GitHub Models** *(défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Limites de niveau gratuit plus généreuses que celles de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment citée. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, niveau gratuit généreux, sans carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | L'un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume de jetons quotidien élevé, sans carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, de nombreux modèles gratuits — bien pour comparer les fournisseurs. |

La banque de questions fixe (Étape 1) n'a besoin d'aucune clé LLM — tu n'en as besoin qu'une fois arrivé à la génération de questions par sujet de l'Étape 3.

### Configurer le projet

```bash
uv init trivia-bot
cd trivia-bot
uv add discord.py openai python-dotenv
```

`discord.py` est la bibliothèque qui parle à Discord — se connectant à sa Gateway, enregistrant les commandes slash, et recevant/envoyant des messages. `openai` parle à l'endpoint compatible OpenAI de GitHub Models pour le fournisseur par défaut ci-dessus ; remplace-le par le paquet de ton propre fournisseur si tu en as choisi un autre. `python-dotenv` charge les secrets depuis un fichier `.env` local.

Crée un fichier `.env` dans le dossier du projet (ne le commite jamais) avec **les deux** secrets de cette section :

```bash
# .env
DISCORD_BOT_TOKEN=your-bot-token-here
GITHUB_TOKEN=your-llm-key-here
```

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Une application Discord et un bot existent dans le Portail des Développeurs, et tu as copié son jeton.</StepChecklistItem>
<StepChecklistItem>« Message Content » est activé sous Privileged Gateway Intents.</StepChecklistItem>
<StepChecklistItem>Tu as une clé API LLM de niveau gratuit d'un fournisseur de ton choix.</StepChecklistItem>
<StepChecklistItem>`uv init`/`uv add` se sont terminés sans erreur, et `.env` a à la fois `DISCORD_BOT_TOKEN` et ta clé LLM configurés.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi Discord exige-t-il que tu actives explicitement « Message Content » comme une intention *privilégiée*, plutôt que de donner à chaque bot l'accès au texte des messages par défaut ?
- Le jeton du bot et la clé API LLM sont tous deux des secrets, mais ils s'authentifient auprès de deux services complètement différents. Qu'est-ce qui irait mal si tu échangeais accidentellement quelle variable d'environnement contient quelle valeur ?

## Étape 1 : Une banque de questions fixe et une commande slash de base

Commence par la source de questions la plus simple possible — une liste Python plate de dicts — et juste assez de câblage Discord pour en poster une :

```python
# questions.py
"""A small fixed bank of trivia questions. Every question, from this bank
or later generated by an LLM, is the same shape:
{"question": str, "options": list[str], "answer_index": int}."""

import random

QUESTION_BANK = [
    {
        "question": "What year was Python first released?",
        "options": ["1989", "1991", "1995", "2000"],
        "answer_index": 1,
    },
    {
        "question": "Which planet is known as the Red Planet?",
        "options": ["Venus", "Jupiter", "Mars", "Saturn"],
        "answer_index": 2,
    },
    # ... a handful more, see examples/trivia-bot/questions.py for the full bank
]


def random_question() -> dict:
    return random.choice(QUESTION_BANK)
```

L'interface moderne de `discord.py` pour cela est une **commande slash** : au lieu de surveiller chaque message pour quelque chose qui ressemble à une commande, tu enregistres `/trivia` auprès de Discord lui-même, et Discord l'affiche dans l'interface avec autocomplétion. Cela nécessite un `Client` plus un `app_commands.CommandTree` qui lui est attaché :

```python
# bot.py (Step 1 version — grows through the rest of this project)
import os

import discord
from discord import app_commands
from dotenv import load_dotenv

from questions import random_question

load_dotenv()

intents = discord.Intents.default()
intents.message_content = True  # requires the portal toggle from Setup, too

client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)


@tree.command(name="trivia", description="Start a trivia round")
async def trivia_command(interaction: discord.Interaction) -> None:
    question = random_question()
    lines = [f"**{question['question']}**"]
    for letter, option in zip("ABCD", question["options"]):
        lines.append(f"{letter}) {option}")
    await interaction.response.send_message("\n".join(lines))


@client.event
async def on_ready() -> None:
    await tree.sync()  # registers /trivia with Discord -- can take a minute the first time
    print(f"Logged in as {client.user} -- ready in {len(client.guilds)} server(s).")


if __name__ == "__main__":
    client.run(os.environ["DISCORD_BOT_TOKEN"])
```

`tree.sync()` est ce qui publie réellement `/trivia` sur Discord pour qu'il apparaisse quand quelqu'un tape `/` dans ton serveur — saute-le et la commande existe dans ton code mais nulle part où l'interface de Discord peut la trouver.

:::tip[Les commandes slash ont besoin d'un second scope OAuth2]
Une invitation de bot normale ne nécessite que le scope `bot`. Les commandes slash ont spécifiquement besoin aussi de `applications.commands` — si tu as généré ton URL d'invitation avant d'ajouter `/trivia`, régénère-la avec les deux scopes cochés (voir Configuration ci-dessus) ou la commande n'apparaîtra jamais en silence dans ton serveur.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`questions.py` définit `QUESTION_BANK` et `random_question()`.</StepChecklistItem>
<StepChecklistItem>`bot.py` enregistre une commande slash `/trivia` via `app_commands.CommandTree`.</StepChecklistItem>
<StepChecklistItem>`on_ready` appelle `await tree.sync()` avant d'imprimer son message de prêt.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `tree.sync()` ré-enregistre chaque commande slash auprès des serveurs de Discord, ce qui est limité en débit. Qu'est-ce qui irait mal si tu l'appelais à l'intérieur de `trivia_command` au lieu d'une fois dans `on_ready` ?
- Le `answer_index` du dict de la question pointe vers `options` par position plutôt que de stocker le texte de la bonne réponse directement. Quel est un avantage de le stocker de cette façon ?

## Étape 2 : Suivi des scores, persisté à travers les manches

Un classement ne veut dire quelque chose que s'il survit au redémarrage du bot, donc les scores vont dans un petit fichier JSON plutôt que de vivre uniquement en mémoire :

```python
# scores.py
"""Per-player score persistence in scores.json. Keyed by Discord user id
(not username), so a player's score survives a nickname change."""

import json
from pathlib import Path

SCORES_PATH = Path("scores.json")


def load_scores() -> dict:
    if not SCORES_PATH.exists():
        return {}
    return json.loads(SCORES_PATH.read_text(encoding="utf-8"))


def save_scores(scores: dict) -> None:
    SCORES_PATH.write_text(json.dumps(scores, indent=2), encoding="utf-8")


def award_point(scores: dict, user_id: int, display_name: str) -> dict:
    key = str(user_id)
    entry = scores.get(key, {"name": display_name, "score": 0})
    entry["name"] = display_name
    entry["score"] += 1
    scores[key] = entry
    save_scores(scores)
    return scores


def leaderboard_text(scores: dict, top_n: int = 10) -> str:
    if not scores:
        return "No scores yet -- play a round with `/trivia`!"
    ranked = sorted(scores.values(), key=lambda entry: entry["score"], reverse=True)
    lines = [f"{i}. {entry['name']} — {entry['score']}" for i, entry in enumerate(ranked[:top_n], start=1)]
    return "\n".join(lines)
```

Teste-le de manière autonome avant de le brancher dans `bot.py` du tout — le même motif « prouve que la pièce fonctionne seule d'abord » que n'importe quel projet en plusieurs parties :

```bash
uv run python -c "
from scores import award_point, leaderboard_text
s = {}
s = award_point(s, 111, 'Alice')
s = award_point(s, 222, 'Bob')
s = award_point(s, 111, 'Alice')
print(leaderboard_text(s))
"
```

Puis ajoute une seconde commande slash qui lit simplement le fichier :

```python
@tree.command(name="leaderboard", description="Show the trivia leaderboard")
async def leaderboard_command(interaction: discord.Interaction) -> None:
    scores = load_scores()
    await interaction.response.send_message(f"**Leaderboard:**\n{leaderboard_text(scores)}")
```

Rien n'attribue encore de point — `trivia_command` de l'Étape 1 ne vérifie pas du tout les réponses — c'est ce que la boucle de manche de l'Étape 4 ajoute. Cette étape n'est délibérément que la moitié stockage, testée et fonctionnant seule d'abord.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`scores.py` définit `load_scores()`, `award_point()`, et `leaderboard_text()`.</StepChecklistItem>
<StepChecklistItem>Exécuter le test autonome de `scores.py` imprime un classement avec Alice au-dessus de Bob.</StepChecklistItem>
<StepChecklistItem>`/leaderboard` est enregistré dans `bot.py` et répond avec le classement (encore vide).</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Les scores sont indexés par `str(user_id)` plutôt que par le nom d'affichage du joueur. Quel scénario réel casserait un classement indexé par nom qu'un classement indexé par ID d'utilisateur survit ?
- `save_scores()` réécrit tout le fichier à chaque point individuel. Pour un petit bot mono-serveur, c'est très bien — à quel moment cela cesserait-il de l'être, et vers quoi te tournerais-tu à la place ?

## Étape 3 : Générer une question inédite sur n'importe quel sujet avec un LLM

La banque fixe de l'Étape 1 ne puise toujours que dans la même poignée de questions. Cette étape ajoute une seconde source de questions : donne un sujet au bot, et il demande à un LLM une toute nouvelle question à choix multiples sur ce sujet, à la volée.

```python
# generate.py
"""Generates a fresh trivia question on a topic via a free-tier LLM.
Returns the exact same shape as questions.py's bank entries, so the rest
of the bot doesn't need to know or care where a question came from."""

import json
import os

from openai import OpenAI

llm_client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

PROMPT_TEMPLATE = """Write one multiple-choice trivia question about: {topic}

Respond with ONLY a JSON object, no other text, in exactly this shape:
{{"question": "...", "options": ["...", "...", "...", "..."], "answer_index": 0}}

Requirements:
- Exactly 4 options.
- Exactly one is correct; put its index (0-3) in answer_index.
- The wrong options must be plausible, not obviously silly.
- Keep the question and every option short enough to fit in a Discord message."""


def generate_question(topic: str) -> dict:
    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(topic=topic)}],
        response_format={"type": "json_object"},
    )
    question = json.loads(response.choices[0].message.content)

    options = question.get("options")
    answer_index = question.get("answer_index")
    if not question.get("question") or not isinstance(options, list) or len(options) != 4:
        raise ValueError(f"LLM returned a malformed question: {question!r}")
    if not isinstance(answer_index, int) or not (0 <= answer_index < 4):
        raise ValueError(f"LLM returned an invalid answer_index: {question!r}")
    return question
```

La vérification explicite de la forme après l'analyse compte : `response_format={"type": "json_object"}` garantit que la sortie du LLM est *du JSON valide*, pas que c'est *le bon* JSON — il pourrait encore renvoyer trois options au lieu de quatre, ou omettre `answer_index` complètement. L'attraper ici, avec une erreur claire, vaut mieux que de le découvrir plus tard comme un message Discord déroutant avec une option D manquante.

Branche un paramètre `topic` dans `/trivia` pour qu'il puisse puiser dans l'une ou l'autre source :

```python
from round import pick_question  # combines random_question() and generate_question()
```

```python
# round.py
"""Non-Discord round logic shared by bot.py and the notebook."""

from generate import generate_question
from questions import random_question


def pick_question(topic: str | None = None) -> dict:
    if topic:
        return generate_question(topic)
    return random_question()
```

```python
@tree.command(name="trivia", description="Start a trivia round, optionally on a topic")
@app_commands.describe(topic="Optional topic for a freshly generated question")
async def trivia_command(interaction: discord.Interaction, topic: str | None = None) -> None:
    question = pick_question(topic)
    ...
```

Teste les deux chemins depuis un terminal avant de leur faire confiance à l'intérieur de Discord :

```bash
uv run python -c "from round import pick_question; print(pick_question())"
uv run python -c "from round import pick_question; print(pick_question('classic video games'))"
```

:::tip[Valide le contenu généré par LLM avant qu'il n'atteigne un canal en direct]
Un LLM à qui l'on demande une question de trivia peut encore se tromper sur les faits, surtout sur des sujets obscurs — il n'y a pas de `try`/`except` qui attrape « incorrect avec confiance ». La validation de forme dans `generate_question()` ne protège que contre une *structure* malformée ; pour un serveur public, parcours une poignée de questions générées sur des sujets que tu connais vraiment avant de faire confiance au mode sur des sujets que tu ne connais pas.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`generate_question(topic)` de `generate.py` renvoie un dict avec 4 options et un `answer_index` valide, ou lève une erreur claire.</StepChecklistItem>
<StepChecklistItem>`pick_question()` de `round.py` renvoie une question de banque quand `topic` est vide, et une générée sinon.</StepChecklistItem>
<StepChecklistItem>`/trivia` accepte un argument `topic` optionnel et l'utilise visiblement.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `generate_question()` valide que `answer_index` est un int dans `0..3` et qu'il y a exactement 4 options, mais il ne valide pas que le *contenu* est réellement de la bonne trivia. Où se trouve la ligne entre ce que le code peut raisonnablement vérifier et ce que seul un humain qui revoit la sortie peut faire ?
- Si un joueur choisit un sujet délibérément offensant ou absurde, quelle est la pire chose plausible que `generate_question()` pourrait renvoyer, et qu'ajouterais-tu pour t'en protéger ?

## Étape 4 : Une boucle de manche de trivia complète

Jusqu'ici, tout était des pièces testées de manière isolée : une source de questions, le stockage des scores, la génération. Cette étape les branche dans ce à quoi ressemble réellement une manche en direct — poste une question, attends la première bonne réponse dans un délai, révèle-la, mets à jour le classement :

```python
# bot.py (relevant part -- see examples/trivia-bot/bot.py for the full file)
import asyncio

from round import OPTION_LETTERS, check_answer, format_question, pick_question
from scores import award_point, leaderboard_text, load_scores

ROUND_TIME_LIMIT = 30  # seconds


async def run_round(channel: discord.abc.Messageable, topic: str | None = None) -> None:
    question = pick_question(topic)
    valid_letters = OPTION_LETTERS[: len(question["options"])]
    await channel.send(
        f"{format_question(question)}\n\nYou have {ROUND_TIME_LIMIT}s -- "
        f"reply with just the letter ({'/'.join(valid_letters)})."
    )

    def is_candidate_answer(message: discord.Message) -> bool:
        return (
            message.channel == channel
            and not message.author.bot
            and message.content.strip().upper() in valid_letters
        )

    loop = asyncio.get_event_loop()
    deadline = loop.time() + ROUND_TIME_LIMIT
    winner = None

    while True:
        remaining = deadline - loop.time()
        if remaining <= 0:
            break
        try:
            message = await client.wait_for("message", check=is_candidate_answer, timeout=remaining)
        except asyncio.TimeoutError:
            break
        if check_answer(question, message.content):
            winner = message.author
            break
        await message.add_reaction("❌")

    correct_letter = OPTION_LETTERS[question["answer_index"]]
    correct_text = question["options"][question["answer_index"]]

    if winner is not None:
        scores = award_point(load_scores(), winner.id, str(winner.display_name))
        await channel.send(
            f"✅ {winner.mention} got it! The answer was **{correct_letter}) {correct_text}**.\n\n"
            f"**Leaderboard:**\n{leaderboard_text(scores)}"
        )
    else:
        await channel.send(f"⏰ Time's up! Nobody got it. The answer was **{correct_letter}) {correct_text}**.")
```

`client.wait_for("message", check=..., timeout=...)` est la façon de `discord.py` de mettre en pause une fonction `async` jusqu'à ce qu'un type d'événement spécifique se produise — ici, tout message dans le même canal dont le contenu est exactement l'une des lettres de réponse valides. La boucle `while` le rappelle avec un timeout `remaining` qui diminue, afin que le budget de temps *total* de la manche soit `ROUND_TIME_LIMIT`, pas `ROUND_TIME_LIMIT` par mauvaise réponse — sans recalculer `remaining`, un canal plein de mauvaises réponses enthousiastes pourrait garder la manche ouverte indéfiniment.

Seule la *première* bonne réponse marque ; fais `break` dès que `winner` est défini. Les mauvaises réponses reçoivent une réaction ❌ au lieu d'un message d'erreur — un retour gratuit sans inonder le canal de réponses.

Enfin, `trivia_command` de l'Étape 1 devient une fine enveloppe autour de `run_round` :

```python
@tree.command(name="trivia", description="Start a trivia round, optionally on a topic")
@app_commands.describe(topic="Optional topic for a freshly generated question")
async def trivia_command(interaction: discord.Interaction, topic: str | None = None) -> None:
    starting_text = f"🎲 Starting a round about **{topic}**..." if topic else "🎲 Starting a round..."
    await interaction.response.send_message(starting_text)
    try:
        await run_round(interaction.channel, topic)
    except Exception as error:  # keep the bot alive even if one round fails
        print(f"Error running trivia round: {error!r}")
        await interaction.channel.send("Something went wrong running that round -- see the bot's console log.")
```

:::tip[Teste d'abord le timing de la manche avec un ROUND_TIME_LIMIT court]
Mets `ROUND_TIME_LIMIT = 5` pendant que tu règles la boucle, pour ne pas attendre 30 secondes par cycle de test pour découvrir que `check_answer` a un bug. Remonte-le à quelque chose de raisonnable pour le vrai jeu une fois que la boucle elle-même fonctionne.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`/trivia` poste une question, puis attend réellement une réponse au lieu de se résoudre instantanément.</StepChecklistItem>
<StepChecklistItem>La première bonne réponse dans le délai est annoncée comme gagnante et reçoit un point via `award_point()`.</StepChecklistItem>
<StepChecklistItem>Laisser le minuteur expirer sans bonne réponse révèle la réponse sans planter ni se bloquer.</StepChecklistItem>
<StepChecklistItem>Exécuter `/trivia` deux fois de suite démarre une nouvelle manche à chaque fois, en utilisant le classement mis à jour.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `is_candidate_answer` vérifie `message.channel == channel` pour que les réponses des autres canaux du serveur ne comptent pas. Qu'arriverait-il à une manche dans un serveur occupé si cette vérification manquait ?
- Le `try`/`except Exception` autour de `run_round(...)` attrape *n'importe quelle* exception et publie une erreur générique au lieu de planter. Quel est le compromis d'attraper aussi largement dans un bot de longue durée par rapport au fait de laisser un vrai bug faire planter le processus bruyamment ?

## Invite le bot et joue une vraie manche

En utilisant l'URL OAuth2 que tu as générée dans Configuration (avec les deux scopes `bot` et `applications.commands`), ouvre-la dans un navigateur et choisis un serveur que tu contrôles — crée un serveur de test gratuit si tu n'en as pas déjà un.

```bash
uv run python bot.py
```

Tu devrais voir imprimé `Logged in as trivia-bot#1234 -- ready in 1 server(s).`. Dans le serveur de test, tape `/trivia` et choisis-le dans le menu d'autocomplétion de Discord — avec ou sans `topic`. En quelques secondes, tu devrais voir la question postée, et après avoir répondu correctement (ou laissé le minuteur expirer) la réponse révélée et le classement mis à jour. Exécute `/leaderboard` à tout moment pour vérifier les scores sans démarrer une nouvelle manche.

## ⚠️ Pièges courants

- **Oublier l'intention privilégiée « Message Content ».** Cela doit être activé à *deux* endroits — `intents.message_content = True` dans le code, **et** l'interrupteur sous Bot → Privileged Gateway Intents dans le Portail des Développeurs. Rate l'interrupteur du portail et `message.content` est silencieusement une chaîne vide pour chaque message, donc `is_candidate_answer` ne correspond jamais à aucune réponse, peu importe comment elle est tapée.
- **Confondre le jeton du bot avec le secret client OAuth2.** Le Portail des Développeurs montre les deux sur des onglets différents. Le jeton du bot (onglet Bot) est ce dont `client.run(...)` a besoin ; le secret client (onglet OAuth2) est pour un flux d'authentification complètement différent que ce projet n'utilise jamais. Coller le secret client dans `DISCORD_BOT_TOKEN` échoue à se connecter avec une erreur déroutante.
- **`/trivia` n'apparaît jamais dans l'interface de Discord.** C'est généralement l'une des deux causes : `tree.sync()` n'a jamais été appelé (ou jamais attendu) dans `on_ready`, ou l'URL d'invitation du bot a été générée avant d'ajouter le scope `applications.commands`. Régénère l'URL d'invitation avec les deux scopes et ré-invite le bot si c'est le second qui pose problème.
- **Limites de débit sur le niveau gratuit du LLM, pires avec plusieurs manches d'affilée.** Chaque appel `/trivia <topic>` est une requête LLM séparée contre le quota de niveau gratuit de ton fournisseur, et un serveur occupé qui enchaîne plusieurs manches peut l'atteindre plus vite que ce que tu attendrais des seuls tests. Une erreur 429 n'est pas un bug — ajoute une courte nouvelle tentative avec backoff autour de `generate_question()`, ou retombe sur la banque fixe quand la génération échoue.
- **Une manche qui ne se termine jamais parce que `remaining` n'est pas recalculé.** Si tu copies la boucle de manche mais que tu appelles `client.wait_for(..., timeout=ROUND_TIME_LIMIT)` (la constante fixe) au lieu de la valeur `remaining` qui diminue, chaque mauvaise réponse redémarre effectivement le chronomètre — la manche peut durer bien plus longtemps que ce que `ROUND_TIME_LIMIT` promet réellement.

## Ce que tu viens de construire

Un bot de trivia Discord en direct avec deux sources de questions — une banque fixe et la génération par LLM de niveau gratuit sur n'importe quel sujet — une boucle de manche complète avec un vrai timing, et un classement persistant par joueur qui survit aux redémarrages. La source de questions, le scoring, et la logique de manche (`questions.py`, `generate.py`, `scores.py`, `round.py`) sont tous du Python simple sans `discord`, testés indépendamment avant de toucher un canal en direct ; seul `bot.py` sait que Discord existe du tout. Cette séparation vaut la peine d'être gardée à l'esprit en général : les quatre mêmes modules pourraient se retrouver derrière un bot Slack, un formulaire web, ou un jeu CLI à la place, sans aucun changement dans aucun d'entre eux.

## Où aller à partir d'ici

- Ajoute un **mode de jeu multi-manches** — `/trivia rounds:5` qui joue plusieurs questions d'affilée et annonce un gagnant global à la fin, au lieu d'une question par commande.
- Suis les **balises de difficulté ou de catégorie** sur les questions générées (demande au LLM d'en inclure une dans sa réponse JSON) et laisse les joueurs choisir une catégorie avec `/trivia topic:... difficulty:hard`.
- Ajoute un **classement par serveur** au lieu d'un `scores.json` global — indexe `scores.json` par `(guild_id, user_id)` au lieu de seulement `user_id`, pour que deux serveurs Discord différents qui exécutent ce bot ne partagent pas un classement.
- Déploie le bot quelque part qui reste allumé sans que ton ordinateur portable tourne — une petite VM toujours active, ou un niveau gratuit sur une plateforme comme Railway ou Fly.io — pour qu'il continue d'héberger des soirées trivia même quand tu n'es pas devant ta machine.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README a un parcours complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue à l'écriture de Python hors du navigateur. 🎓

<ProjectProgressCheckbox projectId="trivia-bot" />
