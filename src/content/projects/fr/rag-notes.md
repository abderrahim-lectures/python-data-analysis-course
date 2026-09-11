---
title: "Construire une application RAG sur vos propres notes"
description: "Passez du bac à sable dans le navigateur à du vrai Python : construisez une application de génération augmentée par récupération qui vous permet de discuter avec vos propres notes, avec des embeddings locaux et un LLM gratuit."
---

# 📚 Construire une application RAG sur vos propres notes

Jusqu'à présent, tout dans le cours tournait dans un bac à sable dans le navigateur — pour pouvoir commencer à écrire du Python dès le premier jour sans aucune configuration. Ce projet est l'étape de graduation : installez Python pour de vrai sur votre propre machine, puis utilisez-le pour construire un outil que vous pourriez réellement continuer à utiliser — une application qui répond à des questions sur un dossier de vos propres notes, en les cherchant d'abord et en ne demandant ensuite qu'au modèle de langage de répondre en utilisant ce qu'il a trouvé. Ceci suppose Python 101 ; rien de Data Analysis n'est requis, même si ça aide si les tableaux `numpy` vous semblent déjà familiers.

Ceci est optionnel et non noté. Voir [Projets concrets](/fr/projets) pour la liste complète, qui s'enrichit au fil du temps.

## 🎯 Ce que vous allez faire

1. Prendre un dossier de vos propres notes `.md`/`.txt` et les diviser en petits morceaux recherchables.
2. Transformer chaque morceau en vecteur — une liste de nombres capturant sa signification — entièrement en local, sans clé API et sans frais, en utilisant `sentence-transformers`.
3. Écrire une petite fonction de recherche locale qui trouve les morceaux les plus pertinents pour une question, en n'utilisant rien d'autre que `numpy`.
4. Écrire un script qui récupère les morceaux pertinents, puis demande à un LLM gratuit de répondre *en utilisant uniquement ce contexte*.

## Où exécuter ceci

**En local avec `uv`** est le chemin que suivent les étapes de cette leçon, et le recommandé — c'est du vrai Python tournant sur votre propre machine, le même geste « passer à du vrai Python » que pour tous les autres projets de cette section. La section Setup ci-dessous explique comment l'installer.

**GitHub Codespaces** est une alternative zéro configuration si vous préférez ne rien installer en local pour l'instant : ouvrez [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, et `uv` sont déjà installés, selon le `.devcontainer/devcontainer.json` du dépôt) et exécutez les mêmes commandes `uv` depuis un terminal dans votre onglet de navigateur.

**Google Colab, les notebooks Kaggle, ou Binder** fonctionnent aussi, puisque ce projet — contrairement à celui du fine-tuning — ne nécessite aucun GPU. Un notebook prêt à l'emploi avec les exemples de notes déjà intégrés est inclus dans le dépôt, pour que vous n'ayez pas à copier-coller les cellules à la main :

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rag-notes/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rag-notes/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frag-notes%2Fnotebook.fr.ipynb)

Cliquez sur un badge, exécutez les cellules de haut en bas, et collez une clé API LLM gratuite quand c'est demandé. Soyez honnête avec vous-même sur le compromis : c'est une façon moins fidèle de vivre le projet qu'un vrai projet local `uv` — pas de fichiers séparés, pas de vraie structure de projet, juste des cellules dans un notebook. Traitez-le comme un moyen rapide d'expérimenter, pas comme le chemin principal.

## Setup

### Installer `uv`

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

`sentence-transformers` est la bibliothèque qui transforme le texte en vecteurs en local, sur votre propre CPU — aucun appel API, aucune clé. `numpy` fait le calcul réel pour comparer les vecteurs. `python-dotenv` vous permet de garder votre clé API LLM dans un fichier local `.env`.

### Obtenir une clé API LLM gratuite

La génération (la dernière étape de ce projet) nécessite une API LLM au palier gratuit — la récupération elle-même (l'embedding et la recherche de vos notes) est entièrement locale et ne nécessite aucune clé, mais il est plus simple de configurer tout ça maintenant, avant de commencer à construire, plutôt que de faire une pause à mi-chemin.

**Choisissez le fournisseur que vous voulez** — aucun ne nécessite de carte de crédit au moment de la rédaction, et ce cours n'en favorise aucun.

| Fournisseur | Où obtenir une clé | Pourquoi le choisir |
|---|---|---|
| **GitHub Models** *(suggestion par défaut)* | [github.com/settings/tokens](https://github.com/settings/tokens) — un personnel access token avec le champ d'application `models: read` | Pas d'inscription séparée — vous avez déjà un compte GitHub. Des limites de palier gratuit plus généreuses que celles de Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | L'option la plus couramment évoquée. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Inférence rapide, palier gratuit généreux, pas de carte. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | L'un des quotas gratuits permanents les plus généreux. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | Volume de jetons quotidien élevé, pas de carte. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Une API, de nombreux modèles gratuits — bon pour comparer les fournisseurs. |

Whichever you pick, the process is the same :

1. Connectez-vous et générez une clé API sur le site de ce fournisseur.
2. **Ne collez jamais cette clé directement dans du code et ne la validez pas dans un dépôt.** Mettez-la dans un fichier `.env` à la place (déjà gitignoré) :

```bash
# .env
GITHUB_TOKEN=your-key-here
```

`python-dotenv` (installé ci-dessus) lit ce fichier dans `os.environ` automatiquement, le même modèle utilisé tout au long du [projet Agent IA](/fr/projets/ai-agent) si vous l'avez fait — GitHub Models expose justement une API compatible OpenAI, donc la bibliothèque client standard `openai` fonctionne pour lui sans aucun paquet supplémentaire :

```bash
uv add openai
```

Si vous avez choisi un fournisseur différent, remplacez-le par le client propre de ce fournisseur quand vous arriverez à l'étape de génération ci-dessous (voir l'astuce là-bas).

## Étape 1 : Préparer vos notes

Mettez vos notes dans un dossier `notes/` sous forme de fichiers `.md` ou `.txt` simples — notes de cours, un journal, de la documentation que vous avez écrite, n'importe quoi. L'application que vous construisez ne répond qu'à partir de ce qui est réellement dans ces fichiers.

Vous ne pouvez pas donner un fichier entier à un modèle d'embedding et espérer un résultat de recherche utile. Deux raisons :

- **Les modèles d'embedding ont une limite de contexte.** `all-MiniLM-L6-v2`, le modèle que ce projet utilise, tronque l'entrée au-delà de 256 morceaux de mots — donnez-lui un fichier de 2 000 mots et tout ce qui dépasse la limite est silencieusement ignoré.
- **Le vecteur d'un gros morceau est une moyenne floue.** Si une note couvre cinq sous-sujets différents, son vecteur d'embedding unique finit quelque part au milieu des cinq — proche d'aucun d'entre eux précisément. Cherchez une question sur un seul sous-sujet, et ce vecteur peut ne pas bien se classer même si la réponse est juste là dans le texte. De plus petits morceaux plus ciblés obtiennent chacun un vecteur plus net et plus spécifique, donc la récupération trouve *le* passage réellement pertinent au lieu d'un fichier entier qui n'est que partiellement pertinent.

Divisez chaque fichier en morceaux par paragraphe, puis refusionnez les minuscules paragraphes jusqu'à une taille cible pour ne pas vous retrouver avec des dizaines de fragments d'une ligne :

### 1.1 Écrire le script de découpage

**👟 Indice de départ :** Le plus petit premier pas est un script qui compte juste combien de morceaux votre dossier `notes/` produit avant tout embedding. Copiez `prepare_notes.py` ci-dessous — il divise sur les lignes vides, fusionne les minuscules paragraphes jusqu'à `TARGET_CHUNK_SIZE`, et affiche un résumé :

```python
# prepare_notes.py
"""Splits every .md/.txt file in notes/ into a list of text chunks.

Run with: uv run python prepare_notes.py

This only prints a summary -- build_index.py (Step 2) imports load_chunks()
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

:::tip[La taille des morceaux est un compromis, pas une règle fixe]
Des morceaux plus petits récupèrent plus précisément (une question correspond à un morceau de texte étroit et spécifique) mais perdent le contexte environnant (le modèle voit un fragment isolé, pas le paragraphe autour). De plus gros morceaux conservent plus de contexte mais récupèrent moins précisément, pour la même raison qu'un fichier entier, juste moins sévèrement. 500 caractères est un point de départ raisonnable pour des notes en prose — il n'existe pas de nombre universellement correct, et il vaut la peine d'essayer quelques tailles sur vos propres notes pour voir laquelle récupère mieux.
:::

**🎯 Résultat attendu :** `uv run python prepare_notes.py` affiche un nombre de morceaux non nul, et les morceaux prévisualisés ressemblent à de vrais fragments de vos notes — pas des chaînes vides ni un seul énorme blob de tout fusionné.

**🩹 Si ça ne marche pas :** Un nombre de morceaux de 0 signifie que `NOTES_DIR` ne pointe pas vers un dossier contenant des fichiers `.md`/`.txt` — revérifiez le chemin depuis l'endroit où vous exécutez le script. Et finalement, un seul énorme morceau par fichier signifie généralement que vos notes n'ont pas de sauts de paragraphe par ligne vide, donc `split_into_paragraphs` traite tout le fichier comme un seul paragraphe — ce qui brouillera la récupération plus tard (voir la question socratique).

### 1.2 Vérifie le découpage

**✅ Liste de vérification**

- ✅ `uv run python prepare_notes.py` s'exécute sans erreur et affiche un nombre de morceaux non nul.
- ✅ Les prévisualisations imprimées ressemblent à de vrais fragments de vos notes, pas des chaînes vides ni des murs géants de texte fusionné.
- ✅ `NOTES_DIR` pointe vers un dossier qui contient réellement des fichiers `.md`/`.txt`.

**🤔 Question(s) socratique(s)**

- Si vous divisez sur les lignes vides mais qu'un de vos fichiers de notes n'a pas du tout de lignes vides (juste un énorme paragraphe), que retournerait `split_into_paragraphs`, et que cela ferait-il à la récupération plus tard ?
- Que se passerait-il pour la qualité de la récupération si vous agrandissiez considérablement `TARGET_CHUNK_SIZE` — disons 5 000 caractères ? Et bien plus petit, comme 50 ? Pourquoi ?

## Étape 2 : Embedder vos notes en local

Un **embedding** est une liste de nombres — un vecteur — qui représente la *signification* d'un morceau de texte, pas son libellé exact. `all-MiniLM-L6-v2` projette chaque morceau sur un point dans un espace à 384 dimensions, et il est entraîné pour que les morceaux de signification similaire finissent proches les uns des autres dans cet espace, tandis que les morceaux sans rapport finissent loin. Vous avez déjà l'intuition centrale pour ça : c'est la même idée que tracer des données numériques sur des axes, juste avec 384 axes au lieu de 2, et « proches l'un de l'autre » mesuré de la même façon dont on mesure une distance dans n'importe quel espace de nombres.

Ce modèle est petit (environ 80 Mo), tourne entièrement sur votre CPU en environ une seconde par morceau sur un ordinateur portable classique, ne nécessite aucune clé API, et ne coûte rien — contrairement au LLM de l'étape 4, l'embedding est entièrement local.

### 2.1 Construire l'index d'embeddings

**👟 Indice de départ :** Le plus petit premier pas est un script qui embed chaque morceau et sauvegarde les vecteurs. Copiez `build_index.py` ci-dessous — il charge vos morceaux de l'étape 1, les embed en local avec `all-MiniLM-L6-v2`, et écrit deux fichiers (`index.npy` pour les vecteurs, `chunks.json` pour le texte), pour que le temps de requête n'ait jamais à ré-embedder quoi que ce soit :

```python
# build_index.py
"""Embeds every chunk from prepare_notes.py and saves the vectors + text
locally, so retrieve() (Step 3) doesn't need to re-embed anything at query time.

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

Ceci évite délibérément une base de données vectorielle — pour un dossier personnel de notes (des centaines ou quelques milliers de morceaux, pas des millions), un simple tableau NumPy qui tient confortablement en mémoire est plus simple, n'a aucun service supplémentaire à installer ou à exécuter, et est entièrement transparent : `index.npy` est une matrice, `chunks.json` est le texte dont elle provient, rien de plus.

`normalize_embeddings=True` remet chaque vecteur à l'échelle pour qu'il soit de longueur 1 — utile à faire maintenant plutôt qu'au moment de la requête, puisque c'est ce qui réduit la similarité cosinus de l'étape 3 à un simple produit scalaire.

**🎯 Résultat attendu :** `uv run python build_index.py` se termine et affiche la forme sauvegardée — un premier nombre correspondant au nombre de morceaux de votre étape 1 et un second nombre de `384` — et `index.npy` plus `chunks.json` existent maintenant dans votre dossier de projet.

**🩹 Si ça ne marche pas :** Si ça affiche « No chunks found », `notes/` est vide ou `load_chunks` ne voit pas vos fichiers — vérifiez `NOTES_DIR` et relancez `prepare_notes.py`. Si le second nombre de la forme n'est pas 384, votre modèle a produit une dimension d'embedding différente, ce qui n'est pas grave tant que vous continuez à utiliser le *même* modèle pour les requêtes.

### 2.2 Vérifie l'index

**✅ Liste de vérification**

- ✅ `uv run python build_index.py` s'est terminé sans erreur.
- ✅ Un fichier `index.npy` et un fichier `chunks.json` existent maintenant dans votre dossier de projet.
- ✅ Le premier nombre de la forme imprimée correspond au nombre de morceaux de l'étape 1, et le second nombre est 384.

**🤔 Question(s) socratique(s)**

- Deux morceaux utilisent le mot « Python » dans des sens complètement différents — l'un sur le langage de programmation, l'autre sur un serpent. Vous attendez-vous à ce que leurs vecteurs d'embedding finissent proches l'un de l'autre ou éloignés ? Qu'est-ce que cela vous dit sur ce que le modèle d'embedding capture réellement ?
- Pourquoi sauvegarder du tout les embeddings dans un fichier, au lieu de simplement ré-embedder toutes vos notes à chaque fois que vous posez une question ?

## Étape 3 : Récupérer les morceaux pertinents

Pour trouver quels morceaux sont pertinents pour une question, embeddez la question avec le *même* modèle, puis classez chaque morceau selon la proximité de son vecteur à celui de la question. La façon standard de mesurer la « proximité » pour les embeddings est la **similarité cosinus** — le cosinus de l'angle entre deux vecteurs, qui se préoccupe de la *direction* (la signification) et ignore la *magnitude* (grossièrement, la longueur du texte) :

$$
\text{cosine\_similarity}(a, b) = \frac{a \cdot b}{\|a\| \, \|b\|}
$$

Puisque chaque vecteur a déjà été normalisé pour être de longueur 1 lors de la sauvegarde ($\|a\| = \|b\| = 1$), le dénominateur vaut juste 1, et la similarité cosinus se réduit à un produit scalaire simple — une raison de normaliser au moment de l'embedding plutôt que de sauter cette étape.

### 3.1 Écrire la fonction de récupération

**👟 Indice de départ :** Le plus petit premier pas est une fonction `retrieve(question, top_k)` qui charge l'index sauvegardé et retourne les morceaux les plus similaires. Copiez `retrieve.py` ci-dessous — il embed la question avec le *même* modèle, la projette en produit scalaire contre chaque vecteur sauvegardé, et classe par score :

```python
# retrieve.py
"""Given a question, finds the notes chunks most relevant to it.

Imported by ask.py (Step 4) -- not meant to be run directly, though the
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

    # Every row of `embeddings` is already unit-length (Step 2), and so is
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

`embeddings @ question_vector` est une multiplication matrice-vecteur : chaque ligne de la matrice projetée en produit scalaire avec le vecteur question, tout d'un coup, en un seul appel NumPy — la même opération du matériel d'algèbre linéaire du cours, ici en train de faire le travail réel de comparaison d'une question contre chaque morceau des notes.

**🎯 Résultat attendu :** `uv run python retrieve.py` affiche `top_k` résultats, chacun avec un score de similarité et un nom de fichier source, et le morceau le mieux classé pour une question de test facile et évidente semble réellement pertinent quand vous le lisez.

**🩹 Si ça ne marche pas :** Des scores loin hors de la plage -1 à 1 signifient presque toujours qu'un des vecteurs n'a pas été normalisé — revenez en arrière et confirmez que `normalize_embeddings=True` est présent à la fois dans `build_index.py` et dans `retrieve()`. Si `retrieve` échoue avec `FileNotFoundError`, l'index de l'étape 2 n'existe pas — relancez d'abord `uv run python build_index.py`.

### 3.2 Vérifie la récupération

**✅ Liste de vérification**

- ✅ `uv run python retrieve.py` affiche `top_k` résultats, chacun avec un score de similarité et un nom de fichier source.
- ✅ Le morceau le mieux classé pour une question de test facile et évidente semble réellement pertinent quand vous le lisez.
- ✅ Les scores sont entre -1 et 1 (la plage valide pour la similarité cosinus) — si vous voyez des nombres bien au-delà, un des vecteurs n'a probablement pas été normalisé.

**🤔 Question(s) socratique(s)**

- `np.argsort(similarities)[::-1][:top_k]` trie *toutes* les similarités avant de prendre les quelques premières. Pour un dossier de notes personnel, c'est parfaitement bien, mais pourquoi trier le tableau entier pourrait-il devenir un problème si vous aviez dix millions de morceaux au lieu de quelques centaines ?
- À quoi vous attendriez-vous pour le score du premier résultat si vous posiez une question qui n'a pas de vraie réponse nulle part dans vos notes ? Essayez — le score confirme-t-il votre prédiction ?

## Étape 4 : Générer une réponse avec un LLM gratuit

La récupération seule vous rend des morceaux bruts de vos propres notes — utiles, mais ce n'est pas une réponse écrite. La dernière étape remet ces morceaux à un modèle de langage comme contexte et lui demande de répondre *en les utilisant*. C'est ce que signifie « RAG » (récupération-augmentée-generation) : la génération, augmentée par une étape de récupération exécutée d'abord. Vous avez déjà obtenu une clé API au palier gratuit et installé le client `openai` pendant le Setup, plus haut.

### 4.1 Écrire `ask.py`

**👟 Indice de départ :** Le plus petit premier pas est un script qui colle la récupération à la génération. Copiez `ask.py` ci-dessous — il récupère les meilleurs morceaux, construit un prompt qui remet au modèle uniquement ce contexte, et affiche la réponse :

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

`build_prompt` est toute l'idée du RAG dans une seule fonction : elle ne demande pas au modèle de répondre à partir de ce qu'il sait déjà, elle remet au modèle le *texte récupéré réel* et lui demande de répondre à partir de ça — c'est pourquoi une application RAG peut répondre correctement à des questions sur des notes que le modèle sous-jacent n'a jamais vues, écrites hier, sur votre propre machine.

:::tip[Vous utilisez un fournisseur différent ?]
Remplacez le bloc `OpenAI(...)` par le client propre de votre fournisseur, en suivant le même modèle que le [projet Agent IA](/fr/projets/ai-agent#step-1-write-your-first-agent) — par ex. le paquet `google-genai` de Google pour Gemini, ou le client propre de `groq` pour Groq. Cerebras et OpenRouter sont aussi compatibles OpenAI, donc le paquet `openai` fonctionne pour eux aussi, juste avec un `base_url` différent.
:::

**🎯 Résultat attendu :** `uv run python ask.py "une vraie question sur vos notes"` affiche une réponse, pas un traceback — et la réponse reflète le contenu de vos notes, pas des connaissances génériques que le modèle avait déjà.

**🩹 Si ça ne marche pas :** Un `KeyError` sur `GITHUB_TOKEN` signifie que `load_dotenv()` ne capte pas votre `.env` — vérifiez que le fichier existe à côté de l'endroit où vous exécutez le script. Si la réponse est une connaissance générique au lieu du contenu de vos notes, la récupération a retourné les mauvais morceaux (revérifiez l'étape 3) ou le modèle a ignoré le contexte. Si demander quelque chose que vos notes ne couvrent manifestement pas produit quand même une réponse inventée avec assurance, l'instruction « dire le cas échéant » (« say so ») n'est pas respectée — c'est exactement ce que sonde la question socratique de l'étape 4.

### 4.2 Vérifie la réponse RAG

**✅ Liste de vérification**

- ✅ `uv run python ask.py "une vraie question sur vos notes"` affiche une réponse, pas un traceback.
- ✅ La réponse reflète réellement le contenu de vos notes, pas des connaissances génériques que le modèle avait déjà.
- ✅ Demander quelque chose que vos notes ne couvrent manifestement pas fait dire au modèle qu'elles ne le couvrent pas, plutôt que d'inventer quelque chose avec assurance.

**🤔 Question(s) socratique(s)**

- Le modèle de prompt dit explicitement « using ONLY the context below » et « if the context doesn't contain the answer, say so ». Que pensez-vous qu'il se passerait si vous retiriez cette instruction et remettiez juste le contexte et la question au modèle sans aucune directive ? Essayez.
- Si `retrieve()` retourne les *mauvais* morceaux pour une question — d'apparence pertinente mais pas réellement la réponse — un bon modèle de langage peut-il quand même obtenir la bonne réponse ? Qu'est-ce que cela suggère sur quelle partie de ce pipeline compte le plus quand quelque chose tourne mal : la récupération ou la génération ?

## ⚠️ Pièges courants

- **Des morceaux trop gros ou trop petits.** Trop gros et la récupération devient floue (étape 1) ; trop petits et un morceau perd le contexte environnant dont le modèle a besoin pour bien répondre. Si les réponses semblent bizarres, essayez un autre `TARGET_CHUNK_SIZE` et relancez `build_index.py`.
- **Oublier de reconstruire l'index après avoir modifié `notes/`.** `build_index.py` ne s'exécute que quand vous l'exécutez — ajoutez une nouvelle note, et `retrieve()` n'y trouvera rien jusqu'à ce que vous relanciez `uv run python build_index.py`. Il n'y a pas de surveillant de fichiers ici ; c'est une étape manuelle par conception, pour que vous sachiez toujours exactement ce qui est indexé.
- **Embedder la question avec un modèle différent de celui utilisé pour construire l'index.** `retrieve.py` et `build_index.py` codent tous deux `MODEL_NAME = "all-MiniLM-L6-v2"` exprès — les vecteurs de deux modèles d'embedding différents n'ont rien de comparable entre eux, même si les deux sont « 384-dimensionnels ». Changez le modèle dans un fichier et vous devez le changer dans les deux, puis reconstruire l'index.
- **Les limites de taux sur le palier gratuit du LLM.** La récupération (étapes 2-3) est locale et illimitée ; seul l'appel `ask()` de l'étape 4 compte contre le quota du palier gratuit de votre fournisseur. Une erreur 429 là-bas, c'est le fournisseur qui vous dit de ralentir, pas un bug — voir le [projet Agent IA](/fr/projets/ai-agent#handling-rate-limits) pour le même modèle et une approche de relance que vous pouvez copier.

## Ce que vous venez de construire

Un petit pipeline RAG mais complet : découpage, embedding local, recherche de similarité en mémoire, et une étape de génération finale ancrée dans votre propre texte récupéré — la même architecture que celle de systèmes de production bien plus grands, juste avec un plat tableau NumPy à la place d'une base de données vectorielle et une API au palier gratuit à la place d'une payante. Rien ici n'a été truqué ou simplifié en un jouet qui ne se généralise pas ; remplacez par un dossier de notes plus grand et un modèle payant, et les mêmes quatre étapes sont encore tout le pipeline.

## Où aller à partir d'ici

- Une fois que votre dossier de notes dépasse ce qui tient confortablement en mémoire (des dizaines de milliers de morceaux), regardez une vraie base de données vectorielle comme [ChromaDB](https://www.trychroma.com/) — elle fait la même recherche de plus proche voisin que `retrieve()` ci-dessus, juste indexée pour la vitesse à une échelle bien plus grande, avec la persistance sur disque et le filtrage que cette version à fichiers plats n'a pas.
- Essayez le **re-rangement (re-ranking)** : récupérez un top-k plus grand (disons 10) avec la recherche d'embeddings rapide, puis utilisez un modèle cross-encoder plus lent et plus précis pour re-scorer ces 10 seulement avant de choisir les 3 finales à envoyer au LLM — un modèle à deux étages courant dans les systèmes RAG de production.
- Étendez `prepare_notes.py` pour gérer plus de types de fichiers — des PDF (`pypdf`), ou même vos propres exports de conversations passées — les étapes de découpage et d'embedding en aval n'ont pas d'importance d'où vient le texte.

## Partagez votre projet avec la classe

Vous avez construit quelque chose dont vous êtes fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README a un guide complet et accessible aux débutants pour ajouter le vôtre via une **pull request**, même si vous n'avez jamais utilisé git auparavant : forker le dépôt, créer une branche, valider vos fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est présumée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓