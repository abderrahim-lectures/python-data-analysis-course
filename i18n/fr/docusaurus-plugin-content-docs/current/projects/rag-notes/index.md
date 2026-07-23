---
id: rag-notes
title: "Construire une appli RAG sur vos propres notes"
sidebar_label: "Construire une appli RAG"
slug: /projects/rag-notes
description: "Passez du bac à sable dans le navigateur à du vrai Python : construisez une appli de génération augmentée par récupération (RAG) qui vous permet de dialoguer avec vos propres notes, avec des embeddings locaux et un LLM de palier gratuit."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire une appli RAG sur vos propres notes

<ProjectPublishedDate projectId="rag-notes" />

<ProjectGreeting />

Tout jusqu'ici tournait dans un bac à sable isolé, dans le navigateur — pour que vous puissiez commencer à écrire du Python dès le premier jour sans aucune configuration. Ce projet est l'étape de remise de diplôme : installez Python pour de vrai sur votre propre machine, puis utilisez-le pour construire un outil que vous pourriez réellement continuer à utiliser — une appli qui répond à des questions sur un dossier de vos propres notes, en les cherchant d'abord et en ne demandant qu'ensuite à un modèle de langage de répondre à partir de ce qu'il a trouvé. Ceci suppose Python 101 ; rien de Data Analysis n'est requis, même si c'est un plus si les tableaux `numpy` vous sont déjà familiers.

Ceci est optionnel et non noté. Voir [Projets concrets](/docs/projects) pour la liste complète, qui s'enrichit au fil du temps.

## 🎯 Ce que vous allez faire

1. Installer `uv`, un outil moderne et rapide pour gérer Python lui-même et les dépendances de votre projet.
2. Prendre un dossier de vos propres notes `.md`/`.txt` et les découper en petits fragments interrogeables.
3. Transformer chaque fragment en vecteur — une liste de nombres capturant son sens — entièrement en local, sans clé API et sans coût, avec `sentence-transformers`.
4. Écrire une petite fonction de recherche locale qui trouve les fragments les plus pertinents pour une question, en n'utilisant que `numpy`.
5. Obtenir une clé API LLM de palier gratuit et écrire un script qui récupère les fragments pertinents, puis demande au modèle de répondre *en utilisant uniquement ce contexte*.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et celui recommandé — c'est du vrai Python qui tourne sur votre propre machine, le même geste de « passage au vrai Python » que chaque autre projet de cette section. L'étape 1 ci-dessous explique comment l'installer.

**GitHub Codespaces** est une alternative sans configuration si vous préférez ne rien installer localement pour l'instant : ouvrez [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécutez exactement les mêmes commandes `uv` depuis un terminal dans votre onglet de navigateur.

**Google Colab ou les notebooks Kaggle** fonctionnent aussi, puisque ce projet — contrairement à celui de fine-tuning — ne nécessite aucun GPU : créez un nouveau notebook, exécutez `!pip install sentence-transformers numpy` dans une cellule, puis collez les scripts ci-dessous comme cellules de notebook, en adaptant les chemins de fichiers selon le besoin. Soyez honnête avec vous-même sur le compromis, cependant : c'est une façon moins fidèle de vivre le projet qu'un vrai projet local `uv` — pas de fichiers séparés, pas de vraie structure de projet, juste des cellules dans un notebook. Traitez-le comme un moyen rapide d'expérimenter, pas le chemin principal.

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

Configurez ensuite un projet :

```bash
uv init rag-notes
cd rag-notes
uv add sentence-transformers numpy python-dotenv
```

`sentence-transformers` est la bibliothèque qui transforme du texte en vecteurs localement, sur votre propre CPU — pas d'appel API, pas de clé. `numpy` fait le vrai calcul de comparaison des vecteurs. `python-dotenv` vous permet de garder votre clé API LLM (étape 5) dans un fichier `.env` local.

## Étape 2 : préparer vos notes

Placez vos notes dans un dossier `notes/` sous forme de simples fichiers `.md` ou `.txt` — notes de cours, journal, documentation que vous avez écrite, n'importe quoi. L'appli que vous construisez ne répond jamais qu'à partir de ce qui se trouve réellement dans ces fichiers.

Vous ne pouvez pas donner un fichier entier à un modèle d'embedding et attendre un résultat de recherche utile en retour. Deux raisons :

- **Les modèles d'embedding ont une limite de contexte.** `all-MiniLM-L6-v2`, le modèle utilisé par ce projet, tronque l'entrée au-delà de 256 sous-mots — donnez-lui un fichier de 2 000 mots et tout ce qui dépasse la limite est silencieusement ignoré.
- **Le vecteur d'un gros fragment est une moyenne floue.** Si une note couvre cinq sous-sujets différents, son unique vecteur d'embedding finit quelque part au milieu des cinq — proche d'aucun d'entre eux précisément. Cherchez une question portant sur un seul sous-sujet, et ce vecteur pourrait ne pas bien se classer même si la réponse est bien là dans le texte. Des fragments plus petits et plus ciblés obtiennent chacun un vecteur plus net et plus spécifique, de sorte que la récupération trouve le *vrai* passage pertinent au lieu d'un fichier entier seulement partiellement pertinent.

Découpez chaque fichier en fragments par paragraphe, puis re-fusionnez les petits paragraphes jusqu'à une taille cible, pour ne pas vous retrouver avec des dizaines de fragments d'une seule ligne :

```python
# prepare_notes.py
"""Splits every .md/.txt file in notes/ into a list of text chunks.

Run with: uv run python prepare_notes.py

This only prints a summary -- build_index.py (Step 3) imports load_chunks()
from this file and does the actual embedding.
"""

from pathlib import Path

NOTES_DIR = Path("notes")
TARGET_CHUNK_SIZE = 500  # characters -- small enough to stay focused,
                         # large enough to hold a full thought


def split_into_paragraphs(text: str) -> list[str]:
    """Splits on blank lines, dropping empty paragraphs."""
    paragraphs = [p.strip() for p in text.split("\n\n")]
    return [p for p in paragraphs if p]


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    """Greedily merges consecutive short paragraphs up to target_size characters,
    so a chunk isn't just one short line with barely any context in it."""
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
    """Returns a list of {"text": ..., "source": ...} dicts, one per chunk,
    across every .md/.txt file in NOTES_DIR."""
    chunks = []
    for path in sorted(NOTES_DIR.glob("*.md")) + sorted(NOTES_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        paragraphs = split_into_paragraphs(text)
        for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
            chunks.append({"text": chunk_text, "source": path.name})
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {NOTES_DIR}/")
    for chunk in chunks[:3]:
        preview = chunk["text"][:80].replace("\n", " ")
        print(f"  [{chunk['source']}] {preview}...")
```

```bash
uv run python prepare_notes.py
```

:::tip[La taille des fragments est un compromis, pas une règle fixe]
Des fragments plus petits sont récupérés plus précisément (une question correspond à un morceau de texte étroit et spécifique) mais perdent le contexte environnant (le modèle voit un fragment isolé, pas le paragraphe autour). Des fragments plus grands gardent plus de contexte mais sont récupérés moins précisément, pour la même raison qu'un fichier entier, juste de façon moins sévère. 500 caractères est un point de départ raisonnable pour des notes en prose — il n'y a pas de chiffre universellement correct, et ça vaut la peine d'essayer plusieurs tailles sur vos propres notes pour voir ce qui se récupère le mieux.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python prepare_notes.py` s'exécute sans erreur et affiche un nombre de fragments non nul.</StepChecklistItem>
<StepChecklistItem>Les aperçus affichés ressemblent à de vrais fragments de vos notes, pas à des chaînes vides ou d'énormes blocs de texte fusionné.</StepChecklistItem>
<StepChecklistItem>`NOTES_DIR` pointe vers un dossier qui contient bien des fichiers `.md`/`.txt`.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si vous découpez sur les lignes vides mais qu'un de vos fichiers de notes n'a aucune ligne vide (juste un seul paragraphe géant), que retournerait `split_into_paragraphs`, et qu'est-ce que cela ferait à la récupération plus tard ?
- Que se passerait-il pour la qualité de la récupération si vous rendiez `TARGET_CHUNK_SIZE` beaucoup plus grand — disons, 5 000 caractères ? Beaucoup plus petit, comme 50 ? Pourquoi ?

## Étape 3 : intégrer vos notes localement

Un **embedding** est une liste de nombres — un vecteur — qui représente le *sens* d'un morceau de texte, pas son libellé exact. `all-MiniLM-L6-v2` associe chaque fragment à un point dans un espace à 384 dimensions, et il est entraîné de sorte que les fragments de sens similaire se retrouvent proches les uns des autres dans cet espace, tandis que les fragments sans rapport se retrouvent éloignés. Vous avez déjà l'intuition centrale pour ça : c'est la même idée que tracer des données numériques sur des axes, juste avec 384 axes au lieu de 2, et « proches » mesuré de la même façon que vous mesureriez une distance dans n'importe quel espace de nombres.

Ce modèle est petit (environ 80 Mo), tourne entièrement sur votre CPU en environ une seconde par fragment sur un ordinateur portable typique, ne nécessite aucune clé API, et ne coûte rien — contrairement au LLM de l'étape 5, l'embedding est entièrement local.

```python
# build_index.py
"""Embeds every chunk from prepare_notes.py and saves the vectors + text
locally, so retrieve() (Step 4) doesn't need to re-embed anything at query time.

Run with: uv run python build_index.py
Re-run this any time you add or edit files in notes/ -- the saved index
doesn't update itself.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare_notes import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .md/.txt files to notes/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata to {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python build_index.py
```

Ceci évite délibérément une base de données vectorielle — pour un dossier personnel de notes (quelques centaines ou quelques milliers de fragments, pas des millions), un simple tableau NumPy qui tient confortablement en mémoire est plus simple, n'a pas de service supplémentaire à installer ou faire tourner, et est entièrement transparent : `index.npy` est une matrice, `chunks.json` est le texte dont elle provient, rien de plus.

`normalize_embeddings=True` met chaque vecteur à l'échelle d'une longueur de 1 — mieux vaut le faire maintenant plutôt qu'au moment de la requête, puisque c'est ce qui permet à la similarité cosinus de l'étape 4 de se réduire à un simple produit scalaire.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python build_index.py` s'est terminé sans erreur.</StepChecklistItem>
<StepChecklistItem>Un fichier `index.npy` et un fichier `chunks.json` existent maintenant dans votre dossier de projet.</StepChecklistItem>
<StepChecklistItem>Le premier nombre de la forme affichée correspond au nombre de fragments de l'étape 2, et le second nombre est 384.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Deux fragments utilisent le mot « Python » dans des sens complètement différents — l'un à propos du langage de programmation, l'autre à propos d'un serpent. Vous attendez-vous à ce que leurs vecteurs d'embedding se retrouvent proches ou éloignés ? Qu'est-ce que cela vous dit sur ce que le modèle d'embedding capture réellement ?
- Pourquoi sauvegarder les embeddings dans un fichier, plutôt que de simplement ré-intégrer toutes vos notes à chaque fois que vous posez une question ?

## Étape 4 : récupérer les fragments pertinents

Pour trouver quels fragments sont pertinents pour une question, intégrez la question avec le *même* modèle, puis classez chaque fragment selon la proximité de son vecteur avec celui de la question. La façon standard de mesurer la « proximité » pour des embeddings est la **similarité cosinus** — le cosinus de l'angle entre deux vecteurs, qui se soucie de la *direction* (le sens) et ignore la *magnitude* (grossièrement, la longueur du texte) :

$$
\text{cosine\_similarity}(a, b) = \frac{a \cdot b}{\|a\| \, \|b\|}
$$

Puisque chaque vecteur a déjà été normalisé à une longueur de 1 lors de sa sauvegarde ($\|a\| = \|b\| = 1$), le dénominateur vaut simplement 1, et la similarité cosinus se réduit à un simple produit scalaire — une des raisons de normaliser au moment de l'embedding plutôt que de sauter cette étape :

```python
# retrieve.py
"""Given a question, finds the notes chunks most relevant to it.

Imported by ask.py (Step 5) -- not meant to be run directly, though the
__main__ block below lets you try it standalone.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"

_model = None  # loaded lazily so importing this module doesn't load the model


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def retrieve(question: str, top_k: int = 3) -> list[dict]:
    """Returns the top_k chunks most similar to `question`, each with its
    similarity score, ranked highest first."""
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]

    # Every row of `embeddings` is already unit-length (Step 3), and so is
    # question_vector, so this dot product *is* the cosine similarity.
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("What is this course about?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

`embeddings @ question_vector` est une multiplication matrice-vecteur : chaque ligne de la matrice est multipliée scalairement par le vecteur de la question, toutes en même temps, en un seul appel NumPy — la même opération que dans le matériel d'algèbre linéaire du cours, faisant ici le vrai travail de comparer une question à chaque fragment des notes.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python retrieve.py` affiche `top_k` résultats, chacun avec un score de similarité et un nom de fichier source.</StepChecklistItem>
<StepChecklistItem>Le fragment le mieux classé pour une question de test simple et évidente semble effectivement pertinent en le lisant.</StepChecklistItem>
<StepChecklistItem>Les scores sont entre -1 et 1 (la plage valide pour la similarité cosinus) — si vous voyez des nombres bien en dehors, un des vecteurs n'a probablement pas été normalisé.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- `np.argsort(similarities)[::-1][:top_k]` trie *toutes* les similarités avant de prendre les premières. Pour un dossier de notes personnel, ça va, mais pourquoi trier le tableau entier pourrait-il devenir un problème si vous aviez dix millions de fragments au lieu de quelques centaines ?
- Que vous attendriez-vous à voir arriver au score du meilleur résultat si vous posiez une question qui n'a de vraie réponse nulle part dans vos notes ? Essayez — le score confirme-t-il votre prédiction ?

## Étape 5 : générer une réponse avec un LLM gratuit

La récupération seule vous rend des fragments bruts de vos propres notes — utile, mais pas une réponse rédigée. La dernière étape confie ces fragments à un modèle de langage comme contexte et lui demande de répondre *en les utilisant*. C'est ce que signifie « RAG » (retrieval-augmented generation, génération augmentée par récupération) : de la génération, augmentée par une étape de récupération exécutée d'abord.

**Choisissez le fournisseur de votre choix** — aucun d'eux ne nécessite de carte de crédit au moment de l'écriture, et ce cours n'en favorise aucun par rapport aux autres.

| Fournisseur | Où obtenir une clé | Pourquoi vous pourriez le choisir |
|---|---|---|
| **GitHub Models** *(défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — vous avez déjà un compte GitHub. Limites de palier gratuit plus généreuses que celles de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, palier gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | L'un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume élevé de tokens quotidiens, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une seule API, de nombreux modèles gratuits — bon pour comparer les fournisseurs. |

Quel que soit celui que vous choisissez, le processus est le même :

1. Connectez-vous et générez une clé API sur le site de ce fournisseur.
2. **Ne collez jamais cette clé directement dans le code ni ne la validez dans un dépôt.** Placez-la plutôt dans un fichier `.env` (déjà ignoré par git si vous avez suivi l'étape 1) :

```bash
# .env
GITHUB_TOKEN=your-key-here
```

`python-dotenv` (installé à l'étape 1) lit ce fichier dans `os.environ` automatiquement, le même motif utilisé tout au long du [projet Agent IA](/docs/projects/ai-agent) si vous l'avez déjà fait — GitHub Models expose justement une API compatible OpenAI, donc la simple bibliothèque cliente `openai` fonctionne pour lui sans aucun paquet supplémentaire :

```bash
uv add openai
```

```python
# ask.py
"""Retrieves relevant chunks for a question, then asks a free-tier LLM to
answer using only that context.

Run with: uv run python ask.py "your question here"
"""

import os
import sys

from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

PROMPT_TEMPLATE = """Answer the question using ONLY the context below. If the
context doesn't contain the answer, say so -- do not make something up.

Context:
{context}

Question: {question}

Answer:"""


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(f"[{c['source']}] {c['text']}" for c in chunks)
    return PROMPT_TEMPLATE.format(context=context, question=question)


def ask(question: str, top_k: int = 3) -> str:
    chunks = retrieve(question, top_k=top_k)
    prompt = build_prompt(question, chunks)

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "What is this course about?"
    print(ask(question))
```

```bash
uv run python ask.py "What is this course about?"
```

`build_prompt` est toute l'idée du RAG en une seule fonction : elle ne demande pas au modèle de répondre à partir de ce qu'il sait déjà, elle lui donne le *vrai texte récupéré* et lui demande de répondre à partir de ça — c'est pourquoi une appli RAG peut correctement répondre à des questions sur des notes que le modèle sous-jacent n'a jamais vues, écrites hier, sur votre propre machine.

:::tip[Vous utilisez un fournisseur différent ?]
Remplacez le bloc `OpenAI(...)` par le propre client de votre fournisseur, en suivant le même motif que le [projet Agent IA](/docs/projects/ai-agent#étape-4--écrire-votre-premier-agent) — par ex. le paquet `google-genai` de Google pour Gemini, ou le propre client de `groq` pour Groq. Cerebras et OpenRouter sont aussi compatibles OpenAI, donc le paquet `openai` fonctionne pour eux aussi, juste avec une `base_url` différente.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python ask.py "une vraie question sur vos notes"` affiche une réponse, pas une trace d'erreur.</StepChecklistItem>
<StepChecklistItem>La réponse reflète effectivement le contenu de vos notes, pas une connaissance générique que le modèle avait déjà.</StepChecklistItem>
<StepChecklistItem>Demander quelque chose que vos notes ne couvrent clairement pas fait dire au modèle qu'il ne sait pas, plutôt que d'inventer quelque chose avec assurance.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Le modèle de prompt dit explicitement « en utilisant UNIQUEMENT le contexte ci-dessous » et « si le contexte ne contient pas la réponse, dites-le ». Que pensez-vous qu'il se passerait si vous supprimiez cette instruction et donniez simplement au modèle le contexte et la question sans aucune consigne ? Essayez.
- Si `retrieve()` renvoie les *mauvais* fragments pour une question — d'apparence pertinente mais pas réellement la réponse — un bon modèle de langage peut-il quand même donner la bonne réponse ? Qu'est-ce que cela suggère sur la partie de ce pipeline qui compte le plus quand quelque chose ne va pas : la récupération ou la génération ?

## ⚠️ Pièges courants

- **Fragments trop grands ou trop petits.** Trop grands et la récupération devient floue (étape 2) ; trop petits et un fragment perd le contexte environnant dont le modèle a besoin pour bien répondre. Si les réponses semblent bizarres, essayez un `TARGET_CHUNK_SIZE` différent et relancez `build_index.py`.
- **Oublier de reconstruire l'index après avoir modifié `notes/`.** `build_index.py` ne s'exécute que lorsque vous le lancez — ajoutez une nouvelle note, et `retrieve()` n'y trouvera rien tant que vous n'aurez pas relancé `uv run python build_index.py`. Il n'y a pas de surveillance de fichiers ici ; c'est une étape manuelle par conception, pour que vous sachiez toujours exactement ce qui est indexé.
- **Intégrer la question avec un modèle différent de celui utilisé pour construire l'index.** `retrieve.py` et `build_index.py` codent tous deux en dur `MODEL_NAME = "all-MiniLM-L6-v2"` intentionnellement — les vecteurs de deux modèles d'embedding différents ne sont absolument pas comparables entre eux, même si les deux sont « à 384 dimensions ». Changez le modèle dans un fichier et vous devez le changer dans les deux, puis reconstruire l'index.
- **Limites de débit sur le palier LLM gratuit.** La récupération (étapes 3-4) est locale et illimitée ; seul l'appel `ask()` de l'étape 5 compte dans le quota de palier gratuit de votre fournisseur. Une erreur 429 à cet endroit signifie que le fournisseur vous dit de ralentir, pas un bug — voir le [projet Agent IA](/docs/projects/ai-agent#gérer-les-limites-de-débit) pour le même motif et une approche de réessai que vous pouvez copier.

## Ce que vous venez de construire

Un pipeline RAG petit mais complet : découpage en fragments, embedding local, recherche de similarité en mémoire, et une étape finale de génération ancrée dans votre propre texte récupéré — la même architecture qui alimente des systèmes de production bien plus grands, juste avec un tableau NumPy plat tenant lieu de base de données vectorielle et une API de palier gratuit tenant lieu d'une payante. Rien ici n'a été simulé ou simplifié en un jouet qui ne se généralise pas ; remplacez par un dossier de notes plus grand et un modèle payant, et les quatre mêmes étapes restent le pipeline entier.

## Où aller à partir d'ici

- Une fois que votre dossier de notes dépasse ce qui tient confortablement en mémoire (des dizaines de milliers de fragments), regardez une vraie base de données vectorielle comme [ChromaDB](https://www.trychroma.com/) — elle fait la même recherche du plus proche voisin que `retrieve()` ci-dessus, juste indexée pour la vitesse à une échelle bien plus grande, avec la persistance sur disque et le filtrage que cette version en fichier plat n'a pas.
- Essayez le **re-ranking** : récupérez un top-k plus grand (disons, 10) avec la recherche par embedding rapide, puis utilisez un modèle cross-encoder plus lent mais plus précis pour re-noter seulement ces 10 avant de choisir les 3 finaux à envoyer au LLM — un motif courant à deux étapes dans les systèmes RAG de production.
- Étendez `prepare_notes.py` pour gérer plus de types de fichiers — des PDF (`pypdf`), ou même vos propres exports de conversations passées — les étapes de découpage et d'embedding en aval se moquent d'où vient le texte.

## Partagez votre projet avec la classe

Vous avez construit quelque chose dont vous êtes fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README a un guide complet et accessible aux débutants pour ajouter le vôtre via une **pull request**, même si vous n'avez jamais utilisé git auparavant : forker le dépôt, créer une branche, valider vos fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est présumée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="rag-notes" />
