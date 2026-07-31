---
id: chat-with-pdfs
title: "Discute avec tes PDF"
sidebar_label: "Discute avec tes PDF"
slug: /projects/chat-with-pdfs
description: "Construis une appli RAG multi-documents sur un dossier de PDF, avec des embeddings locaux, un LLM gratuit, et des citations de numéro de page dans chaque réponse."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Discute avec tes PDF

<ProjectPublishedDate projectId="2027-chat-with-pdfs" />

<ProjectGreeting />

Le [projet Appli RAG](/docs/projects/rag-notes) discute avec un dossier de notes en texte brut. Ce projet emmène la même idée quelque part de plus utile : un dossier de vrais PDF — rapports, guides, manuels, articles — avec des réponses qui citent exactement de quel document et de quelle page vient un fait, comme le ferait un assistant de recherche. Cela suppose Python 101 ; il aide aussi beaucoup d'avoir déjà construit le projet Appli RAG, puisque celui-ci réutilise toute son architecture et ne change que la façon dont les documents source sont lus et cités, mais ce n'est pas une exigence stricte si tu es à l'aise avec les concepts.

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Extraire le texte d'un dossier de PDF, page par page, et le découper en petits fragments — en gardant le nom de fichier source et le numéro de page attachés à chaque fragment.
2. Transformer chaque fragment en vecteur, entièrement en local, sans clé API et sans coût, avec `sentence-transformers`.
3. Récupérer les fragments les plus pertinents pour une question à travers *tous* les PDF à la fois, puis demander à un LLM gratuit de répondre en utilisant uniquement ce contexte — avec une citation `(source, page N)` requise pour chaque fait.
4. Envelopper tout cela dans une petite boucle interactive pour pouvoir continuer à poser des questions sans relancer un script à chaque fois.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et le recommandé — c'est du vrai Python tournant sur ta propre machine, le même mouvement « gradue vers du vrai Python » que tout autre projet de cette section. La section Configuration ci-dessous explique comment l'installer.

**GitHub Codespaces** est une alternative sans configuration si tu préfères ne rien installer localement pour l'instant : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécute exactement les mêmes commandes `uv` depuis un terminal dans ton onglet de navigateur.

**Google Colab, Kaggle Notebooks, ou Binder** fonctionnent aussi, puisque ce projet n'a pas besoin de GPU — une version notebook réelle et exécutable du pipeline de ce projet (le même découpage de PDF, embedding local, et génération de réponses citées que les étapes ci-dessous) vit dans [`examples/chat-with-pdfs/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/notebook.ipynb). Clique sur un badge pour le lancer directement, sans aucune installation locale :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fchat-with-pdfs%2Fnotebook.ipynb)

Sois honnête avec toi-même sur le compromis, cependant : c'est une façon de moindre fidélité de vivre le projet qu'un vrai projet `uv` local — pas de fichiers séparés, pas de vraie structure de projet, juste des cellules dans un notebook. Traite-le comme une façon rapide d'expérimenter, pas le chemin principal.

## Configuration

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

Puis configure un projet :

```bash
uv init chat-with-pdfs
cd chat-with-pdfs
uv add pypdf sentence-transformers numpy openai python-dotenv
```

`pypdf` lit le texte des fichiers PDF. `sentence-transformers` est la bibliothèque qui transforme le texte en vecteurs en local, sur ton propre CPU — pas d'appel API, pas de clé. `numpy` fait les vrais calculs pour comparer les vecteurs. `python-dotenv` te permet de garder ta clé API LLM dans un fichier `.env` local.

### Obtiens une clé API LLM gratuite

La génération (la dernière partie de l'Étape 3) a besoin d'une API LLM gratuite — l'extraction, le découpage, l'embedding et la récupération sont tous entièrement locaux et n'ont besoin d'aucune clé, mais c'est plus simple de configurer cela maintenant, avant de commencer à construire, plutôt que de faire une pause en cours de route.

**Choisis le fournisseur que tu préfères** — aucun ne nécessite de carte de crédit au moment de l'écriture, et ce cours n'en favorise aucun.

| Fournisseur | Où obtenir une clé | Pourquoi le choisir |
|---|---|---|
| **GitHub Models** *(par défaut suggéré)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un jeton d'accès personnel avec le scope `models: read` | Pas d'inscription séparée — tu as déjà un compte GitHub. Limites de niveau gratuit plus généreuses que Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment référencée. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, niveau gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | Un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume quotidien de tokens élevé, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, plusieurs modèles gratuits — bon pour comparer les fournisseurs. |

Quel que soit celui que tu choisis, le processus est le même :

1. Connecte-toi et génère une clé API sur le site de ce fournisseur.
2. **Ne colle jamais cette clé directement dans le code ni ne la commite dans un dépôt.** Mets-la plutôt dans un fichier `.env` (déjà dans le gitignore) :

```bash
# .env
GITHUB_TOKEN=ta-clé-ici
```

`python-dotenv` (installé ci-dessus) lit ce fichier vers `os.environ` automatiquement, le même pattern utilisé dans le [projet Appli RAG](/docs/projects/rag-notes) et le [projet Agent IA](/docs/projects/ai-agent) si tu as fait l'un ou l'autre — GitHub Models expose justement une API compatible OpenAI, donc la simple bibliothèque cliente `openai` fonctionne pour cela sans paquet supplémentaire :

```bash
uv add openai
```

Si tu as choisi un fournisseur différent, remplace par le client propre de ce fournisseur quand tu arrives à l'étape de génération ci-dessous (voir le tip là-bas).

### Récupère quelques PDF

Mets une poignée de vrais PDF — rapports, guides, articles, n'importe quoi avec du vrai texte dedans (pas des images scannées) — dans un dossier `pdfs/` à l'intérieur de ton projet. Si tu n'en as pas sous la main, copie les trois courts PDF d'exemple depuis [`examples/chat-with-pdfs/pdfs/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/chat-with-pdfs/pdfs), ou génère les tiens avec le script [`generate_sample_pdfs.py` de l'exemple](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/generate_sample_pdfs.py).

## Étape 1 : Charge et découpe tes PDF

`pypdf` extrait le texte d'un PDF une page à la fois, ce qui est exactement la granularité dont ce projet a besoin — c'est ce qui rend possible de dire *de quelle page* une réponse est venue plus tard. Comme pour le projet Appli RAG, une page entière est généralement encore trop grande et trop peu focalisée pour bien s'embedder, donc chaque page est découpée en fragments plus petits — mais contrairement à ce projet, chaque fragment ici doit aussi se souvenir de quel fichier et quelle page il vient.

```python
# load_pdfs.py
"""Loads every PDF in pdfs/, extracts text page by page, and splits each
page into small chunks -- keeping the source filename and page number
attached to every chunk, so later answers can cite exactly where a fact
came from.

Run with: uv run python load_pdfs.py

This only prints a summary -- build_index.py (Step 2) imports load_chunks()
from this file and does the actual embedding.
"""

from pathlib import Path

from pypdf import PdfReader

PDFS_DIR = Path("pdfs")
TARGET_CHUNK_SIZE = 500  # characters -- small enough to stay focused,
                         # large enough to hold a full thought


def split_into_paragraphs(text: str) -> list[str]:
    """Splits on blank lines, dropping empty paragraphs. Falls back to
    splitting on single newlines if a page has no blank-line breaks at
    all, which is common in PDFs extracted from single-column layouts."""
    paragraphs = [p.strip() for p in text.split("\n\n")]
    paragraphs = [p for p in paragraphs if p]
    if len(paragraphs) <= 1:
        paragraphs = [p.strip() for p in text.split("\n")]
        paragraphs = [p for p in paragraphs if p]
    return paragraphs


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    """Greedily merges consecutive short paragraphs up to target_size
    characters, so a chunk isn't just one short line with barely any
    context in it."""
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
    """Returns a list of {"text", "source", "page"} dicts, one per chunk,
    across every PDF in PDFS_DIR. `page` is 1-indexed, matching what a
    human reading the PDF would call "page N" -- pypdf's own page indices
    are 0-based, so every page number here has +1 applied."""
    chunks = []
    for path in sorted(PDFS_DIR.glob("*.pdf")):
        reader = PdfReader(str(path))
        for page_index, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            paragraphs = split_into_paragraphs(text)
            for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
                chunks.append({
                    "text": chunk_text,
                    "source": path.name,
                    "page": page_index + 1,
                })
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {PDFS_DIR}/")
    for chunk in chunks[:3]:
        preview = chunk["text"][:80].replace("\n", " ")
        print(f"  [{chunk['source']} p{chunk['page']}] {preview}...")
```

```bash
uv run python load_pdfs.py
```

:::tip[Plusieurs documents, un seul pipeline]
Rien en aval de `load_chunks()` n'a besoin de savoir ou de se soucier du nombre de PDF, ou duquel vient un fragment — chaque fragment porte sa propre `source` et `page`, donc la récupération cherche naturellement à travers *tous* tes PDF à la fois, et la réponse finale peut mélanger des faits de plusieurs documents différents dans une seule réponse, chacun correctement attribué.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python load_pdfs.py` s'exécute sans erreur et affiche un compte de fragments non nul.</StepChecklistItem>
<StepChecklistItem>Les aperçus affichés ressemblent à de vrais fragments du texte de tes PDF, pas des chaînes vides ou des caractères corrompus.</StepChecklistItem>
<StepChecklistItem>Chaque fragment affiché montre à la fois un nom de fichier et un numéro de page qui correspondent à ce que tu verrais en ouvrant le PDF toi-même.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Pourquoi extraire le texte *par page* plutôt que de lire tout le PDF dans une grande chaîne et découper ça ? Quelle information perdrais-tu ?
- Un PDF scanné (une photo d'un document papier, sans vrai texte intégré) ferait que `page.extract_text()` retournerait une chaîne vide pour chaque page. Comment remarquerais-tu que cela s'est produit, et que devrais-tu ajouter pour gérer ça (indice : cherche « OCR ») ?

## Étape 2 : Embedde tes fragments en local

Cette étape est identique en esprit à l'étape d'embedding du projet Appli RAG — le même modèle, le même raisonnement, juste en embeddant des fragments dérivés de PDF au lieu de fragments de notes. `all-MiniLM-L6-v2` mappe chaque fragment à un point dans un espace de 384 dimensions, entraîné pour que des fragments de sens similaire finissent proches les uns des autres. Il est petit (environ 80 Mo), tourne entièrement sur ton CPU en environ une seconde par fragment sur un ordinateur portable typique, n'a besoin d'aucune clé API, et ne coûte rien.

```python
# build_index.py
"""Embeds every chunk from load_pdfs.py and saves the vectors + text
(including source filename and page number) locally, so retrieve() (Step 3)
doesn't need to re-embed anything at query time.

Run with: uv run python build_index.py
Re-run this any time you add, remove, or edit files in pdfs/ -- the saved
index doesn't update itself.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from load_pdfs import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .pdf files to pdfs/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata (source + page) to {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python build_index.py
```

Tout comme le projet Appli RAG, cela évite délibérément une base de données vectorielle — pour un dossier personnel de PDF (des dizaines à quelques centaines de documents, pas des millions), un simple tableau NumPy est plus simple, n'a pas de service supplémentaire à installer ou faire tourner, et est totalement transparent. `normalize_embeddings=True` met chaque vecteur à l'échelle de longueur 1, ce qui fait que la similarité cosinus de l'Étape 3 se réduit à un simple produit scalaire.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python build_index.py` s'est terminé sans erreur.</StepChecklistItem>
<StepChecklistItem>Un fichier `index.npy` et un fichier `chunks.json` existent maintenant dans le dossier de ton projet.</StepChecklistItem>
<StepChecklistItem>En ouvrant `chunks.json`, chaque entrée a un champ `text`, `source`, et `page`.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Si deux PDF différents contiennent par hasard des phrases presque identiques (disons, les deux citent la même réglementation), à quoi t'attendrais-tu que ressemblent leurs vecteurs d'embedding l'un par rapport à l'autre ?
- Pourquoi ré-embedder les *fragments* ici mais pas les PDF eux-mêmes ? Que perdrait-on à embedder un PDF entier comme un seul vecteur, comparé à embedder chacun de ses fragments séparément ?

## Étape 3 : Récupère et génère une réponse citée

La récupération fonctionne exactement comme le projet Appli RAG — embedde la question, classe chaque fragment par similarité cosinus, prends les quelques premiers — sauf que maintenant le classement tourne à travers chaque fragment de chaque PDF à la fois, donc le résultat le plus pertinent pour une question pourrait venir de n'importe lequel de tes documents.

```python
# retrieve.py
"""Given a question, finds the PDF chunks most relevant to it, across every
document in pdfs/ -- each result carries its source filename and page number.

Imported by ask.py -- not meant to be run directly, though the __main__
block below lets you try it standalone.
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


def retrieve(question: str, top_k: int = 4) -> list[dict]:
    """Returns the top_k chunks most similar to `question`, each with its
    similarity score, source document, and page number, ranked highest
    first -- possibly drawn from several different PDFs at once."""
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]

    # Every row of `embeddings` is already unit-length (Step 2), and so is
    # question_vector, so this dot product *is* the cosine similarity.
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("How many days of paid time off do employees get?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']} p{r['page']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

Maintenant la génération. Le prompt est toute l'idée du RAG-avec-citations en un seul endroit : il remet au modèle les fragments récupérés *étiquetés avec leur source et leur page*, et exige que chaque fait dans la réponse soit suivi d'une citation `(source, page N)` copiée depuis cette étiquette — le modèle n'invente pas de citations, il répète celles déjà attachées au texte qu'on lui a donné.

```python
# ask.py
"""Retrieves relevant chunks across every PDF in pdfs/, then asks a
free-tier LLM to answer using only that context -- citing which document
and page each part of the answer came from.

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

Every fact you use MUST be followed by a citation in the form
(source, page N), taken from the [source, page N] tag on the context chunk
it came from. If your answer draws on more than one chunk, cite each one.

Context:
{context}

Question: {question}

Answer:"""


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(
        f"[{c['source']}, page {c['page']}] {c['text']}" for c in chunks
    )
    return PROMPT_TEMPLATE.format(context=context, question=question)


def ask(question: str, top_k: int = 4) -> str:
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
    question = " ".join(sys.argv[1:]) or "How many days of paid time off do employees get?"
    print(ask(question))
```

```bash
uv run python ask.py "How many days of paid time off do employees get?"
```

:::tip[Tu utilises un fournisseur différent ?]
Remplace le bloc `OpenAI(...)` par le client propre de ton fournisseur, en suivant le même pattern que le [projet Appli RAG](/docs/projects/rag-notes) et le [projet Agent IA](/docs/projects/ai-agent) — par ex. le paquet `google-genai` de Google pour Gemini, ou le client propre de `groq` pour Groq. Cerebras et OpenRouter sont aussi compatibles OpenAI, donc le paquet `openai` fonctionne pour eux aussi, juste avec une `base_url` différente.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python retrieve.py` affiche des résultats de tes PDF avec des noms de fichiers source et numéros de page d'apparence plausible.</StepChecklistItem>
<StepChecklistItem>`uv run python ask.py "une vraie question"` affiche une réponse, pas une traceback.</StepChecklistItem>
<StepChecklistItem>Chaque affirmation factuelle dans la réponse est suivie d'une citation `(source, page N)`, et la page de chaque citation contient réellement ce fait quand tu vérifies le PDF.</StepChecklistItem>
<StepChecklistItem>Demander quelque chose que tes PDF ne couvrent clairement pas fait que le modèle le dit, plutôt que d'inventer quelque chose avec confiance (y compris une fausse citation).</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Le prompt exige une citation pour *chaque* fait. Que t'attends-tu à voir se passer si tu supprimes cette exigence — le modèle aurait-il quand même tendance à répondre avec précision, ou demander des citations change-t-il réellement à quel point il s'en tient soigneusement au contexte ? Essaie les deux et compare.
- Si `retrieve()` extrait le fragment le mieux classé de la bonne page mais du *mauvais* PDF (disons, deux produits différents mentionnent tous les deux « garantie »), le remarquerais-tu juste en lisant la citation ? Qu'est-ce que ça suggère sur le fait de toujours vérifier les citations plutôt que de faire confiance à une réponse juste parce qu'elle en a une ?

## Étape 4 : Une petite boucle interactive

Relancer `ask.py` avec un nouvel argument de ligne de commande pour chaque question fonctionne, mais c'est lent pour itérer. Enveloppe-le plutôt dans une petite boucle, pour pouvoir continuer à discuter avec tes PDF dans une session en cours.

```python
# chat.py
"""A small interactive loop: keep asking questions about the PDFs in pdfs/
until you type "quit" or "exit".

Run with: uv run python chat.py
"""

from ask import ask


def main() -> None:
    print("Chat with your PDFs -- ask a question, or type 'quit' to stop.\n")
    while True:
        question = input("> ").strip()
        if not question:
            continue
        if question.lower() in {"quit", "exit"}:
            break
        answer = ask(question)
        print(f"\n{answer}\n")


if __name__ == "__main__":
    main()
```

```bash
uv run python chat.py
```

:::tip[C'est toute l'appli]
Il n'y a pas de serveur, pas de framework, pas de boîte à outils UI ici — une boucle `while True` autour de `ask()` *est* une appli de chat légitime. Chaque produit « discute avec tes données » que tu as vu est cette même boucle en dessous, avec un frontend web, des réponses en streaming, et un historique de conversation superposés. Aucune de ces couches ne change ce qui se passe réellement : récupérer, puis générer, puis afficher.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`uv run python chat.py` démarre, accepte une question, affiche une réponse citée, et revient à un nouveau prompt `>`.</StepChecklistItem>
<StepChecklistItem>Taper `quit` ou `exit` termine la boucle proprement.</StepChecklistItem>
<StepChecklistItem>Tu peux poser deux questions différentes sur deux PDF différents dans la même session sans rien redémarrer.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

- Chaque appel à `ask()` recharge `index.npy` et `chunks.json` depuis le disque et recharge le modèle d'embedding. Pour une seule question c'est bien — que changerais-tu dans `chat.py` et `retrieve.py` si tu voulais que la boucle se sente plus réactive après la première question ?
- Cette boucle n'a aucune mémoire des questions précédentes — chaque appel à `ask()` est indépendant. Qu'est-ce qui casserait si tu posais un suivi comme « et pour le deuxième ? » juste après une autre question ? Que devrais-tu ajouter pour supporter ça ?

## ⚠️ Pièges courants

- **Les PDF scannés, image seule, ne retournent aucun texte.** Le `extract_text()` de `pypdf` ne lit que le texte qui est réellement intégré dans le PDF — un PDF fait de pages photographiées ou scannées n'a aucun texte intégré du tout, donc `load_pdfs.py` produira silencieusement zéro fragment pour ce fichier. Si un document dont tu attends de voir des réponses n'apparaît jamais, vérifie d'abord si tu peux sélectionner/copier son texte dans une visionneuse PDF normale ; si tu ne peux pas, il a besoin d'OCR (hors du périmètre de ce projet) avant que ce pipeline puisse l'utiliser.
- **Fragments trop grands ou trop petits.** Même compromis que le projet Appli RAG : trop grand et la récupération devient floue, trop petit et un fragment perd le contexte environnant dont le modèle a besoin pour bien répondre. Si les réponses semblent bizarres, essaie un `TARGET_CHUNK_SIZE` différent et relance `build_index.py`.
- **Oublier de reconstruire l'index après avoir modifié `pdfs/`.** `build_index.py` ne tourne que quand tu l'exécutes — ajoute, supprime, ou édite un PDF, et `retrieve()` ne reflétera pas le changement avant que tu relances `uv run python build_index.py`.
- **Faire confiance à une citation sans la vérifier.** Le prompt *demande* au modèle de ne citer que ce qui est réellement dans le contexte récupéré, et en pratique il le fait de manière fiable — mais rien ici ne le garantit mathématiquement. Vérifie quelques citations par échantillonnage contre les vraies pages du PDF, surtout avant de compter dessus pour quelque chose qui importe.
- **Limites de débit sur le niveau LLM gratuit.** L'extraction, le découpage, l'embedding et la récupération sont tous locaux et illimités ; seul l'appel LLM de `ask()` compte contre le quota de niveau gratuit de ton fournisseur. Une erreur 429 là-bas est le fournisseur qui te dit de ralentir, pas un bug — voir le [projet Agent IA](/docs/projects/ai-agent) pour le même pattern et une approche de nouvelle tentative que tu peux copier.

## Ce que tu viens de construire

Un pipeline RAG multi-documents avec citations : extraction et découpage de PDF conscients des pages, embedding local, recherche de similarité en mémoire à travers un nombre arbitraire de documents, et une étape de génération finale obligée de pointer exactement vers l'origine de chaque fait — la même forme de système derrière les vrais produits « discute avec tes documents », moins la base de données vectorielle et l'API payante, remplacées par une gratuite et un tableau NumPy plat.

## Où aller à partir d'ici

- Une fois que ton dossier de PDF dépasse ce qui tient confortablement en mémoire (des dizaines de milliers de fragments), regarde une vraie base de données vectorielle comme [ChromaDB](https://www.trychroma.com/) — la même recherche des plus proches voisins que `retrieve()` ci-dessus, indexée pour la vitesse à une échelle bien plus grande, avec un filtrage de métadonnées (ex. « ne chercher que les PDF de 2024 ») que cette version en fichier plat n'a pas.
- Ajoute un **filtre de source** : laisse une question restreindre la récupération à un seul PDF (`retrieve(question, source="warranty.pdf")`), utile une fois que ton dossier contient des documents sur des sujets très différents qui ne devraient pas être mélangés.
- Essaie l'**OCR** avec une bibliothèque comme `pytesseract` pour les PDF scannés, pour que les documents image seule puissent rejoindre le pipeline plutôt que de contribuer silencieusement zéro fragment.
- Étends les citations pour inclure un **extrait**, pas juste un numéro de page — retourne la phrase exacte d'où vient le fait à côté de `(source, page N)`, pour pouvoir vérifier une réponse sans ouvrir le PDF toi-même.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓

<ProjectProgressCheckbox projectId="2027-chat-with-pdfs" />
