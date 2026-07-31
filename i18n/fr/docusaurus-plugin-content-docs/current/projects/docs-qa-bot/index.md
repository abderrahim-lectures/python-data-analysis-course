---
id: docs-qa-bot
title: "Construire un Bot Discord de Questions-Réponses Adossé au RAG"
sidebar_label: "Construire un Bot Discord de Questions-Réponses"
slug: /projects/docs-qa-bot
description: "Passe du bac à sable dans le navigateur au vrai Python : enveloppe le pipeline de récupération du projet Appli RAG dans un bot Discord en direct qui répond aux questions à partir d'un dossier de documentation."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Bot Discord de Questions-Réponses Adossé au RAG

<ProjectPublishedDate projectId="docs-qa-bot" />

<ProjectGreeting />

Ce projet reprend le pipeline de génération augmentée par récupération du [projet Appli RAG](/docs/projects/rag-notes) — embeddings locaux, recherche de similarité cosinus avec NumPy, un LLM gratuit pour la réponse finale — et lui met un front-end différent : au lieu d'un script que tu exécutes depuis un terminal une question à la fois, le même pipeline répond aux questions en direct, dans un serveur Discord, chaque fois que quelqu'un mentionne le bot. Rien sur *comment* il récupère ou génère ne change ; seule l'interface change.

Cela suppose Python 101. Avoir déjà construit le [projet Appli RAG](/docs/projects/rag-notes) est fortement recommandé — ce projet réutilise directement son code d'embedding/récupération et passe rapidement sur les parties déjà expliquées en profondeur.

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Créer une application de bot Discord et récupérer son jeton depuis le portail développeur gratuit de Discord.
2. Installer `uv`, mettre en place un projet, et ajouter `discord.py` avec les mêmes bibliothèques d'embedding/récupération que le projet Appli RAG.
3. Réutiliser et adapter le pipeline de récupération de l'Appli RAG sur un dossier de documentation plutôt que des notes personnelles.
4. Connecter un gestionnaire de messages `discord.py` pour que le bot récupère la documentation pertinente et génère une réponse chaque fois qu'il est mentionné.
5. Inviter le bot sur un serveur de test et lui poser de vraies questions, de bout en bout.

## Où exécuter ceci

**En local avec `uv`** est vraiment la seule option pratique ici, plus que pour la plupart des autres projets de cette série. Un bot Discord n'est pas un script qui s'exécute une fois et se termine — il maintient une connexion ouverte à Discord et doit continuer à tourner tant que tu veux que le bot réponde, ce qui signifie un vrai processus local (ou hébergé) de longue durée, pas une commande ponctuelle.

**GitHub Codespaces** fonctionne aussi, et est un substitut raisonnable si tu préfères ne rien installer localement : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute `uv run python bot.py` dans un terminal là-bas — il continue de tourner tant que ce terminal (et le Codespace) reste ouvert, la même exigence de « processus de longue durée » qu'en local.

**Google Colab, Kaggle Notebooks, et Binder sont mal adaptés au vrai bot** — sois honnête avec toi-même là-dessus plutôt que de lutter contre. Les notebooks sont construits autour de l'exécution d'une cellule, l'obtention d'une sortie, et le passage à la cellule suivante ; ils ne sont pas faits pour un processus en arrière-plan qui attend des événements indéfiniment. Tu *peux* démarrer la boucle d'événements d'un bot dans une cellule de notebook, mais dès que le runtime du notebook se recycle, se déconnecte, ou que tu fermes l'onglet, le bot tombe avec lui — saute Colab/Kaggle/Binder pour le bot en direct et utilise plutôt un vrai processus local ou Codespaces.

Cela dit, le pipeline RAG *sous-jacent* au bot — découpage, embedding, récupération, et génération — n'est que du code normal qui s'exécute une cellule à la fois, ce en quoi les notebooks excellent justement. Les badges ci-dessous ouvrent un notebook qui parcourt ce pipeline central contre la documentation d'exemple du projet et affiche de vraies réponses récupérées-et-générées, pour que tu puisses le voir fonctionner sans rien installer localement. Il s'arrête délibérément avant la couche Discord — pour ça, reviens ici et exécute `bot.py` en local ou dans Codespaces comme décrit ci-dessus.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/docs-qa-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/docs-qa-bot/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdocs-qa-bot%2Fnotebook.ipynb)

## Configuration

Tout dans cette section n'a besoin de se produire qu'une fois, avant d'écrire une seule ligne du bot lui-même : installer `uv`, créer l'application de bot Discord et récupérer son jeton, obtenir une clé LLM gratuite, et configurer le projet. Chaque étape après celle-ci suppose que tout cela est déjà fait.

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

### Crée une application de bot Discord et obtiens un jeton

Le [Portail Développeur](https://discord.com/developers/applications) de Discord est gratuit et ne nécessite pas de carte :

1. Connecte-toi et clique sur **New Application**, donne-lui un nom (ex. « docs-qa-bot »), et crée-la.
2. Ouvre l'onglet **Bot** à gauche. Discord ajoute automatiquement un utilisateur bot à ton application.
3. Clique sur **Reset Token** (ou **View Token** si c'est la première fois) et copie-le. Ce jeton est exactement comme un mot de passe — quiconque le possède peut contrôler ton bot — traite-le donc de la même façon que tu traites déjà une clé API LLM : ne le colle jamais dans le code, ne le commite jamais.
4. Sur le même onglet **Bot**, fais défiler jusqu'à **Privileged Gateway Intents** et active **Message Content**. C'est requis pour que le bot voie réellement le texte des messages dans lesquels il est mentionné — sans ça, `discord.py` reçoit une chaîne vide pour le contenu de chaque message peu importe le code que tu écris.

:::tip[Un jeton de bot est un secret, exactement comme une clé API]
Tout ce que le [projet Appli RAG](/docs/projects/rag-notes) a enseigné sur la gestion des clés API LLM s'applique ici aussi, pour un deuxième secret : ne code jamais en dur le jeton du bot, ne le commite jamais, et garde-le dans un fichier `.env` local (ci-dessous) à la place.
:::

### Obtiens une clé API LLM gratuite

La moitié génération de ce pipeline a besoin du même genre de clé LLM gratuite que le [projet Appli RAG](/docs/projects/rag-notes) — **choisis le fournisseur que tu préfères**, aucun ne nécessite de carte de crédit au moment de l'écriture :

| Fournisseur | Où obtenir une clé | Pourquoi le choisir |
|---|---|---|
| **GitHub Models** *(par défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Limites de niveau gratuit plus généreuses que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, niveau gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume quotidien de tokens élevé, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, plusieurs modèles gratuits — bon pour comparer les fournisseurs. |

Si tu as déjà une clé du projet Appli RAG, la même fonctionne ici — pas besoin d'en générer une seconde.

### Mets en place le projet

```bash
uv init docs-qa-bot
cd docs-qa-bot
uv add discord.py sentence-transformers numpy python-dotenv openai
```

`discord.py` est la bibliothèque qui parle réellement à Discord — se connectant à sa Gateway, recevant les événements de messages, et envoyant des réponses. `sentence-transformers` et `numpy` sont les mêmes bibliothèques de récupération du projet Appli RAG, faisant le même travail ici : embeddings locaux et recherche de similarité cosinus, juste sur de la documentation plutôt que des notes. `openai` parle à l'endpoint compatible OpenAI de GitHub Models pour le fournisseur par défaut ci-dessus ; remplace-le par le propre paquet de ton fournisseur si tu en as choisi un différent, exactement comme le décrit le projet Appli RAG.

Crée un fichier `.env` dans le dossier du projet (ne le commite jamais) avec **les deux** secrets de cette section :

```bash
# .env
DISCORD_BOT_TOKEN=ton-jeton-de-bot-ici
GITHUB_TOKEN=ta-clé-llm-ici
```

`python-dotenv` lit ce fichier vers `os.environ` automatiquement, le même pattern que tout autre projet de cette série.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Une application et un bot Discord existent dans le Portail Développeur, et tu as copié son jeton.</StepChecklistItem>
<StepChecklistItem>« Message Content » est activé sous Privileged Gateway Intents.</StepChecklistItem>
<StepChecklistItem>Tu as une clé API LLM gratuite d'un fournisseur de ton choix.</StepChecklistItem>
<StepChecklistItem>`uv init`/`uv add` s'est terminé sans erreur, et `.env` a à la fois `DISCORD_BOT_TOKEN` et ta clé LLM configurés.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi Discord exige-t-il que tu actives explicitement « Message Content » comme intent *privilégié*, plutôt que de donner à chaque bot accès au texte des messages par défaut ?
- Le jeton du bot et la clé API LLM sont tous les deux des secrets, mais authentifient auprès de deux services complètement différents. Qu'est-ce qui irait mal si tu échangeais accidentellement quelle variable d'environnement contenait quelle valeur ?

## Étape 1 : Prépare et embedde un dossier de documentation

Cette étape correspond aux Étapes 2 et 3 du projet Appli RAG, inchangées dans leur substance, juste pointées vers un dossier `docs/` de documentation plutôt que des notes personnelles :

```python
# prepare_docs.py
"""Splits every .md/.txt file in docs/ into a list of text chunks.

Run with: uv run python prepare_docs.py
Same chunking approach as prepare_notes.py in the RAG App project.
"""

from pathlib import Path

DOCS_DIR = Path("docs")
TARGET_CHUNK_SIZE = 500  # characters


def split_into_paragraphs(text: str) -> list[str]:
    paragraphs = [p.strip() for p in text.split("\n\n")]
    return [p for p in paragraphs if p]


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    chunks = []
    current = ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) > target_size:
            chunks.append(current)
            current = paragraph
        else:
            current = f"{current}\n\n{paragraph}" if current else paragraph
    if current:
        chunks.append(current)
    return chunks


def load_chunks() -> list[dict]:
    chunks = []
    for path in sorted(DOCS_DIR.glob("*.md")) + sorted(DOCS_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        paragraphs = split_into_paragraphs(text)
        for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
            chunks.append({"text": chunk_text, "source": path.name})
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {DOCS_DIR}/")
```

Mets toute la documentation dont tu veux que le bot réponde dans un dossier `docs/` sous forme de fichiers `.md`/`.txt` — le README et les pages wiki d'un projet, le manuel interne d'une équipe, les propres fichiers de leçon de ce cours, n'importe quoi de réel. Ensuite embedde-la, en réutilisant le `build_index.py` du projet Appli RAG textuellement (seul l'import change, de `prepare_notes` à `prepare_docs`) :

```python
# build_index.py
"""Embeds every chunk from prepare_docs.py and saves the vectors + text
locally. Run with: uv run python build_index.py
Re-run any time docs/ changes -- nothing rebuilds this automatically.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare_docs import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .md/.txt files to docs/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python prepare_docs.py
uv run python build_index.py
```

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Un dossier `docs/` existe avec au moins deux vrais fichiers `.md`/`.txt` dedans.</StepChecklistItem>
<StepChecklistItem>`uv run python build_index.py` s'exécute sans erreur et rapporte un compte de fragments non nul.</StepChecklistItem>
<StepChecklistItem>`index.npy` et `chunks.json` existent maintenant dans le dossier de ton projet.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- C'est exactement le même code de découpage et d'embedding que le projet Appli RAG, avec juste un nom de dossier changé. Qu'est-ce que ça te dit sur la réutilisabilité de la moitié récupération d'un pipeline RAG à travers des cas d'usage complètement différents ?
- Si ton dossier de documentation a un fichier avec un formatage très incohérent (pas de lignes vides, un gros bloc de texte), qu'est-ce que tu attendrais qu'il arrive à la qualité des fragments qu'il produit ?

## Étape 2 : Récupère les fragments pertinents

La récupération reste aussi inchangée par rapport au projet Appli RAG — embedde la question avec le même modèle, puis classe chaque fragment par similarité cosinus, ce qui se réduit à un simple produit scalaire puisque chaque vecteur a déjà été normalisé à longueur 1 au moment de l'embedding :

```python
# retrieve.py
"""Given a question, finds the docs chunks most relevant to it.
Identical retrieval logic to the RAG App project's retrieve.py.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def retrieve(question: str, top_k: int = 3) -> list[dict]:
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("How do I enable the message content intent?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

Si ça semble aller trop vite, c'est délibéré — le [projet Appli RAG](/docs/projects/rag-notes#step-4-retrieve-relevant-chunks) couvre exactement pourquoi la similarité cosinus fonctionne ainsi, ce que la normalisation t'apporte, et comment les maths se connectent à une multiplication matrice-vecteur, avec bien plus de profondeur que ce que le répéter ici apporterait.

:::tip[Teste la récupération avant de toucher à Discord du tout]
Fais en sorte que `retrieve.py` retourne des fragments authentiquement pertinents pour quelques questions de test *avant* d'écrire du code de bot. Si la récupération est mauvaise, un bot enroulé autour d'elle livrera simplement des réponses erronées avec confiance dans un canal Discord — bien plus difficile à déboguer en direct qu'un script de terminal silencieux.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python retrieve.py` affiche des résultats classés avec de vrais scores de similarité.</StepChecklistItem>
<StepChecklistItem>Le meilleur résultat pour une question de test facile a vraiment l'air pertinent quand tu le lis.</StepChecklistItem>
<StepChecklistItem>Tu as essayé au moins une question que ton dossier de documentation ne couvre clairement pas, et confirmé que le meilleur score est nettement plus bas.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Un bot Discord pourrait recevoir des questions identiques ou très similaires de façon répétée par différents utilisateurs dans un serveur actif. `retrieve()` réembedde actuellement la question et recharge `index.npy`/`chunks.json` depuis le disque à chaque appel. Que mettrais-tu en cache pour rendre les questions répétées moins coûteuses, et quel est le risque de trop mettre en cache ?
- Si deux fichiers de documentation disent des choses légèrement contradictoires (un obsolète et un mis à jour), qu'est-ce que tu attendrais que `retrieve()` fasse, et comment remarquerais-tu le problème rien qu'à partir des réponses du bot ?

## Étape 3 : Connecte le gestionnaire de messages du bot

C'est la vraie nouvelle partie de ce projet : un gestionnaire d'événements `discord.py` qui appelle `retrieve()`, construit le même prompt « réponds en utilisant uniquement ce contexte » que le projet Appli RAG, et répond avec la réponse du modèle.

Le pattern central de `discord.py` est une boucle d'événements : tu crées un `Client` avec un ensemble d'`intents` (quelles catégories d'événements il est autorisé à recevoir), puis tu enregistres des fonctions `async def` décorées avec `@client.event` pour les événements qui t'intéressent — le plus souvent `on_ready` (se déclenche une fois, quand la connexion est établie) et `on_message` (se déclenche pour chaque message que le bot peut voir) :

```python
# bot.py
import os

import discord
from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

PROMPT_TEMPLATE = """Answer the question using ONLY the context below. If the
context doesn't contain the answer, say so -- do not make something up.
Keep the answer concise; this will be posted in a Discord message.

Context:
{context}

Question: {question}

Answer:"""

MAX_DISCORD_MESSAGE_LENGTH = 2000  # Discord's hard cap on a single message

intents = discord.Intents.default()
intents.message_content = True  # requires the portal toggle from Setup, too

client = discord.Client(intents=intents)
llm_client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(f"[{c['source']}] {c['text']}" for c in chunks)
    return PROMPT_TEMPLATE.format(context=context, question=question)


def answer(question: str, top_k: int = 3) -> str:
    chunks = retrieve(question, top_k=top_k)
    prompt = build_prompt(question, chunks)
    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


@client.event
async def on_ready():
    print(f"Logged in as {client.user} -- ready in {len(client.guilds)} server(s).")


@client.event
async def on_message(message: discord.Message):
    if message.author == client.user:
        return  # never reply to yourself -- avoids an infinite reply loop

    if client.user not in message.mentions:
        return  # only answer when actually mentioned

    question = message.content.replace(f"<@{client.user.id}>", "").strip()
    if not question:
        await message.reply("Mention me with a question, e.g. `@docs-qa-bot how do I install uv?`")
        return

    async with message.channel.typing():
        try:
            reply = answer(question)
        except Exception as error:
            print(f"Error answering question: {error!r}")
            reply = "Something went wrong answering that -- see the bot's console log for details."

    if len(reply) > MAX_DISCORD_MESSAGE_LENGTH:
        reply = reply[: MAX_DISCORD_MESSAGE_LENGTH - 1] + "…"
    await message.reply(reply)


if __name__ == "__main__":
    client.run(os.environ["DISCORD_BOT_TOKEN"])
```

`answer()` est ligne pour ligne la même idée que le `ask()` du projet Appli RAG — récupérer, construire un prompt, appeler le LLM — mais retourne une chaîne au lieu de l'afficher, pour que `on_message` puisse transmettre cette chaîne à `message.reply(...)`. Tout au-dessus de `on_ready`/`on_message` s'exécute une fois au démarrage ; tout à l'intérieur de ces deux fonctions s'exécute une fois par événement, tant que `client.run(...)` maintient la connexion vivante.

La garde `if message.author == client.user: return` compte plus qu'il n'y paraît : sans elle, si la propre réponse du bot se mentionnait elle-même (ça n'arrivera pas ici, mais c'est une erreur facile en général), ça déclencherait `on_message` à nouveau sur sa propre sortie — une boucle infinie d'un bot se répondant à lui-même.

:::tip[async def et await ne sont pas optionnels ici]
`discord.py` est entièrement construit sur `asyncio` de Python — chaque gestionnaire d'événements doit être déclaré `async def`, et tout appel qui attend sur le réseau (envoyer un message, récupérer des données) doit avoir `await`. Oublier l'un ou l'autre est l'un des tout premiers bugs les plus courants : oublier `async` sur `on_message` lève une erreur immédiatement, et oublier `await` sur `message.reply(...)` ne fait silencieusement rien du tout, puisque ça crée juste une coroutine non attendue au lieu de réellement l'exécuter.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`bot.py` définit `on_ready` et `on_message`, tous les deux en `async def`, tous les deux décorés avec `@client.event`.</StepChecklistItem>
<StepChecklistItem>`on_message` vérifie `message.author == client.user` avant de faire quoi que ce soit d'autre.</StepChecklistItem>
<StepChecklistItem>`answer()` appelle le même `retrieve()` de l'Étape 2, inchangé.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi vérifier `client.user not in message.mentions` plutôt que simplement vérifier si le nom du bot apparaît quelque part dans `message.content` comme sous-chaîne ?
- Le `try`/`except` autour de `answer(reply)` attrape *toute* exception et répond avec un message d'erreur générique plutôt que de planter. Quel est le compromis de capturer aussi largement dans un bot de longue durée par rapport à laisser un vrai bug planter le processus bruyamment ?

## Étape 4 : Invite le bot et essaie-le de bout en bout

De retour dans le Portail Développeur de Discord, ouvre **OAuth2 → URL Generator**. Sous **Scopes**, coche `bot` ; sous **Bot Permissions**, coche au moins **Send Messages** et **Read Message History**. Copie l'URL générée, ouvre-la dans un navigateur, et choisis un serveur que tu contrôles (crée un serveur de test gratuit si tu n'en as pas déjà un) pour y ajouter le bot.

Exécute-le :

```bash
uv run python bot.py
```

Tu devrais voir `Logged in as docs-qa-bot#1234 -- ready in 1 server(s).` affiché — le silence après ça est normal ; le processus est juste en attente d'événements sur la Gateway de Discord, la même idée « pas de sortie signifie que ça fonctionne » qu'un serveur MCP en attente sur stdio. Dans le serveur de test, mentionne le bot avec une vraie question sur ce qui se trouve dans ton dossier `docs/` :

```
@docs-qa-bot how do I enable the message content intent?
```

En quelques secondes tu devrais voir un indicateur « en train d'écrire », puis une réponse ancrée dans ta vraie documentation — pas une supposition venant des données d'entraînement générales du modèle.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Le bot apparaît en ligne dans la liste des membres de ton serveur de test après avoir exécuté `uv run python bot.py`.</StepChecklistItem>
<StepChecklistItem>Le mentionner avec une vraie question produit un indicateur « en train d'écrire », puis une réponse.</StepChecklistItem>
<StepChecklistItem>Le contenu de la réponse reflète réellement ton dossier `docs/`, et une question que tes docs ne couvrent pas obtient un honnête « je ne sais pas » plutôt qu'une supposition confiante.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si tu arrêtes `bot.py` (`Ctrl+C`) et mentionnes à nouveau le bot, que se passe-t-il côté Discord ? Qu'est-ce que ça te dit sur où vit réellement la « présence » du bot ?
- Tu as testé la récupération et l'appel LLM séparément dans les Étapes 1–2 avant de les connecter à Discord à l'Étape 3. Si le bot donne maintenant une mauvaise réponse, comment utiliserais-tu `retrieve.py` seul pour déterminer si le bug est dans la récupération ou dans le câblage Discord autour ?

## ⚠️ Pièges courants

- **Oublier l'intent privilégié « Message Content ».** Ça doit être activé en *deux* endroits — `intents.message_content = True` dans le code, **et** l'interrupteur sous Bot → Privileged Gateway Intents dans le Portail Développeur. Rate l'interrupteur du portail et `message.content` est silencieusement une chaîne vide pour chaque message, sans aucune erreur pour te dire pourquoi.
- **Limites de débit sur le niveau LLM gratuit, aggravées par le vrai trafic du bot.** Un script CLI comme le `ask.py` du projet Appli RAG n'appelle le LLM que quand tu l'exécutes ; un bot en direct peut recevoir plusieurs questions en succession rapide de différentes personnes dans un serveur actif, et chacune est un appel séparé contre le quota de niveau gratuit de ton fournisseur. Une erreur 429 sous charge n'est pas un bug — voir les [pièges du projet Appli RAG](/docs/projects/rag-notes#️-common-pitfalls) pour le même pattern de limite de débit et comment ajouter une nouvelle tentative.
- **Ne pas reconstruire l'index après avoir modifié `docs/`.** Exactement comme le projet Appli RAG : `build_index.py` ne tourne que quand tu l'exécutes. Ajoute ou modifie un doc et le bot continue de répondre depuis l'*ancien* index jusqu'à ce que tu relances `uv run python build_index.py` et redémarres le bot.
- **Exécuter le bot avec un jeton obsolète ou incorrect après l'avoir régénéré.** Cliquer sur « Reset Token » dans le Portail Développeur invalide immédiatement l'ancien jeton — si `.env` a toujours l'ancienne valeur, `client.run(...)` échoue à se connecter. Mets à jour `.env` chaque fois que tu réinitialises le jeton, et ne suppose jamais que la valeur que tu as copiée une fois est toujours valide.

## Ce que tu viens de construire

Un bot Discord en direct qui répond à de vraies questions à partir de vraie documentation, ancré dans du texte récupéré plutôt que dans la connaissance générale du modèle — exactement le même pipeline RAG que le [projet Appli RAG](/docs/projects/rag-notes), avec une boucle d'événements `discord.py` remplaçant un script CLI comme interface. Le code de récupération et de génération n'a pas changé de façon significative ; seule la façon dont une question entre et une réponse sort a changé. C'est une chose utile à remarquer en général : la logique centrale d'un pipeline RAG est indépendante de l'interface, et la même paire `retrieve()`/`answer()` ici pourrait tout aussi facilement se trouver derrière un bot Slack, un formulaire web, ou un endpoint API à la place.

## Où aller à partir d'ici

- Ajoute une **commande slash** (`/ask <question>`) en utilisant les `app_commands` de `discord.py` en plus, ou à la place, des réponses basées sur mention — les commandes slash apparaissent dans l'UI de Discord avec autocomplétion et ne nécessitent pas de taper une `@mention`, au prix d'une petite quantité de code d'enregistrement supplémentaire.
- Suis quelle source `docs/` chaque réponse a réellement citée, et fais en sorte que le bot inclue une ligne « Source : fichier.md » dans sa réponse — une petite mais réelle fonctionnalité de renforcement de confiance pour quiconque lit la réponse.
- Une fois que ton dossier de documentation dépasse ce qui tient confortablement en mémoire, regarde une vraie base de données vectorielle comme [ChromaDB](https://www.trychroma.com/), exactement comme suggéré dans le [« Où aller à partir d'ici » du projet Appli RAG](/docs/projects/rag-notes#where-to-go-from-here) — rien sur la couche Discord n'a besoin de changer pour le supporter.
- Déploie le bot quelque part qui reste actif sans que ton propre ordinateur portable tourne — une petite VM toujours active, ou un niveau gratuit sur une plateforme comme Railway ou Fly.io — pour qu'il continue de répondre aux questions même quand tu n'es pas à ta machine.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="docs-qa-bot" />
