---
title: "Moteur de Questions-Réponses sur Documents"
description: "Pose des questions en langage naturel à un petit corpus de documents grâce au découpage en morceaux, à un index inversé, au scoring et aux réponses extractives."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "retrieval", "indexing", "nlp-basics"]
prerequisites:
  - "Les bases de Python (dicts, ensembles, compréhensions)"
  - "Les expressions régulières et la lecture de fichiers avec pathlib"
learningObjectives:
  - "Découper un corpus en unités de texte interrogeables avec des ids stables"
  - "Construire un index inversé mappant les termes aux morceaux"
  - "Scorer et classer les morceaux pour une requête arbitraire avec la fréquence de termes"
  - "Extraire une réponse au niveau phrase du meilleur morceau avec une citation de source"
  - "Envelopper la recherche et les réponses dans une CLI interactive qui ne dépend jamais d'un réseau"
---

# 📄 Construire un Moteur de Questions-Réponses sur Documents

Dans le monde pré-LLM — et dans chaque environnement de pointe où un LLM est trop lourd, trop lent ou trop inabordable — « poser des questions à tes documents » est un *problème de recherche avec une jolie présentation*. La machinerie est honnête et t'apprend plus que l'enveloppe de chat : découpe le corpus en morceaux, indexe chaque terme vers les morceaux où il apparaît, score les morceaux pour une requête, choisis la phrase qui y répond le mieux, et cite d'où elle vient. Ce projet construit les cinq couches en Python pur, et tu verras un vrai moteur faire une vraie chose : aucune supposition, chaque réponse porte le fichier d'où elle vient.

Ceci suppose Python 101 plus une aisance avec `re` et `pathlib`. Rien du module Analyse de Données n'est requis. C'est facultatif et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Ingérer un corpus markdown de trois fichiers et le découper en morceaux avec des ids stables.
2. Construire un index inversé — pour chaque terme, la liste des morceaux où il apparaît et combien de fois.
3. Classer les morceaux pour une requête par fréquence de termes normalisée.
4. Extraire la meilleure phrase du meilleur morceau et citer son fichier source.
5. L'envelopper dans une CLI interactive `ask.py` — tape une question, obtiens des résultats classés et une réponse avec une source.

## Où exécuter ceci

**En local avec `uv`** est le chemin recommandé — un index est un objet vivant que tu charges une fois et interroges à plusieurs reprises, et une CLI fait cela mieux qu'une cellule de notebook.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent pour chaque étape — le notebook dans [`examples/document-qa-engine/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.ipynb) exécute le même moteur sur le corpus fourni en mémoire.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdocument-qa-engine%2Fnotebook.ipynb)

## Configuration

`uv` est un outil unique qui remplace la chaîne « installer Python, puis pip, puis un outil d'environnement virtuel » — et ce projet est pure bibliothèque standard.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme son installation :

```bash
uv --version
```

Ensuite, configure le projet :

```bash
uv init document-qa-engine
cd document-qa-engine
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `document-qa-engine/` existe avec un `pyproject.toml`.
- ✅ `python -c "import re, pathlib, collections"` réussit — aucun paquet tiers.

## Étape 1 : Ingérer le corpus en morceaux

Avant qu'une question puisse être posée, les documents doivent devenir une liste de *morceaux* — de petites unités de texte autonomes que le moteur peut scorer et citer. Découper par paragraphes à lignes vides est délibérément simple : une page wiki sur les geckos devient un morceau, et l'identité du morceau est son `source#index`, qui est exactement ce qu'une réponse cite plus tard.

### 1.1 Crée le corpus et le lecteur

**👟 Indice de départ :** Trois fichiers markdown d'un paragraphe sont tout le corpus ; `load_corpus` les lit, les découpe sur les lignes vides, et tamponne chaque morceau avec un id stable :

```bash
mkdir -p docs
cat > docs/gecko.md <<'EOF'
Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
EOF
cat > docs/hamster.md <<'EOF'
Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
EOF
cat > docs/hermit.md <<'EOF'
Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
EOF
```

```python
# ingest.py
import re
from pathlib import Path

def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z']+", text.lower())

def load_corpus(directory: str = "docs") -> list[dict]:
    chunks = []
    for path in sorted(Path(directory).glob("*.md")):
        paragraphs = [p.strip() for p in path.read_text().split("\n\n") if p.strip()]
        for i, text in enumerate(paragraphs):
            chunks.append({"id": f"{path.name}#{i}", "source": path.name, "text": text})
    return chunks

if __name__ == "__main__":
    for chunk in load_corpus():
        print(f"{chunk['id']:<12} {len(tokenize(chunk['text'])):>3} words  {chunk['text'][:38]}...")
```

`tokenize` est la phrase unique que l'ingestion et (plus tard) l'interrogation partagent : mets tout en minuscules, garde uniquement les lettres et apostrophes — ainsi `Climb`, `climb`, et `climb,` s'indexent tous comme le même terme `climb`. Le découpage en paragraphes à lignes vides est l'*unité* de découpage ; les systèmes de production découpent sur les phrases ou des tailles de fenêtre fixes, mais le contrat est identique (id + source + texte), ce qui est exactement pourquoi tu pourrais échanger le découpeur sans toucher à l'index ou au répondeur.

**🎯 Résultat attendu :**

```
gecko.md#0    25 words  Geckos are nocturnal lizards. They can...
hamster.md#0  21 words  Hamsters are nocturnal rodents. They h...
hermit.md#0   23 words  Hermit crabs are decapod crustaceans. ...
```

**🩹 Si ça ne marche pas :** Si les fichiers n'apparaissent pas du tout, `Path(directory).glob("*.md")` n'en a trouvé aucun — confirme que `docs/` se trouve *à côté* de `ingest.py` (dans le même répertoire que le script depuis lequel tu exécutes). Si les ids de morceaux montrent `docs/gecko.md#0`, tu as passé `directory="docs"` mais `path.name` inclut le chemin — utilise `path.name`, pas `str(path)`.

### 1.2 Vérifie l'ingestion

**✅ Liste de vérification**

- ✅ `load_corpus()` produit exactement trois morceaux : `gecko.md#0`, `hamster.md#0`, `hermit.md#0`.
- ✅ `tokenize("Climb, CLIMB climb") == ["climb", "climb", "climb"]` — insensible à la casse et à la ponctuation.
- ✅ Les comptes de mots (25 / 21 / 23) te disent la taille du corpus sans lire la prose — les comptes pilotent la normalisation de l'Étape 3.

**🤔 Question(s) socratique(s)**

- Un paragraphe = un morceau signifie qu'un *long* paragraphe domine la recherche plus tard. Quelle unité de découpage choisirais-tu pour que le moteur de réponses distingue « la page mentionne les lézards » de « *en deux phrases* ils sont nocturnes » ? Comment le schéma d'id change-t-il ?
- Le corpus a trois fichiers d'un paragraphe, donc tout est `#0`. Quand les ids `source#index` deviendraient-ils ambigus — et quel est le premier découpeur qui produirait un `#1` ?

## Étape 2 : Construire l'index inversé

La façon brutale de trouver « où vit 'nocturnal' » est de relire les trois fichiers à chaque fois. L'index inversé inverse cela : *terme → {id de morceau : compte}*, donc une recherche de n'importe quel terme est un seul accès dict qui retourne exactement les morceaux où il est et combien de fois. De la mémoire échangée contre de la vitesse, et toute la vitesse du moteur de réponses construite en environ dix lignes de construction.

### 2.1 Écris `build_index`

**👟 Indice de départ :** Par morceau, compte les apparitions de chaque terme, puis pousse `(terme → id de morceau → compte)` dans un defaultdict imbriqué :

```python
# index.py
from collections import defaultdict

from ingest import load_corpus, tokenize

def build_index(chunks: list[dict]) -> dict[str, dict[str, int]]:
    index: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for chunk in chunks:
        seen = {}
        for term in tokenize(chunk["text"]):
            seen[term] = seen.get(term, 0) + 1
        for term, count in seen.items():
            index[term][chunk["id"]] = count
    return index

def word_counts(chunks: list[dict]) -> dict[str, int]:
    return {c["id"]: len(tokenize(c["text"])) for c in chunks}

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    for term in ("nocturnal", "climb", "humidity", "shell"):
        print(f"{term:<10} -> {dict(index[term]) if term in index else {}}")
    print("word counts:", word_counts(chunks))
```

Le `defaultdict(lambda: defaultdict(int))` est toute la forme : un dict externe clé par terme qui, pour les clés manquantes, fait surgir un dict *imbriqué* clé par morceau qui commence à compter à 0. Lire `index["nocturnal"]` est rapide que le terme ait un coup ou un million, et tu ne vérifies jamais l'appartenance avant de le toucher. Deux structures sortent de cette étape : `index` répond *« où ce terme apparaît-il »* et `word_counts` répond *« combien ce morceau est-il long »* — l'Étape 3 a besoin des deux.

**🎯 Résultat attendu :**

```
nocturnal  -> {'gecko.md#0': 1, 'hamster.md#0': 1}
climb      -> {'gecko.md#0': 1}
humidity   -> {'hermit.md#0': 1}
shell      -> {'hermit.md#0': 1}
word counts: {'gecko.md#0': 25, 'hamster.md#0': 21, 'hermit.md#0': 23}
```

**🩹 Si ça ne marche pas :** Si la démo affiche chaque terme avec un dict vide, `build_index` a tokénisé un texte vide (un `path.read_text()` sur un fichier que le glob n'a pas trouvé) — vérifie que tu es dans le répertoire `document-qa-engine/`. Si `index["climb"]` retourne des déchets defaultdict à l'affichage, tu imprimes un defaultdict qui n'a jamais été converti avec `dict(...)` — cosmétique, mais la conversion `dict(index[term])` est ce qui le fait rendre comme une vraie lecture de l'index.

### 2.2 Vérifie l'index

**✅ Liste de vérification**

- ✅ `nocturnal` mappe aux morceaux gecko et hamster ; `climb`/`humidity` mappent chacun à exactement un.
- ✅ Un terme qui apparaît deux fois dans un morceau (comme `geckos`) a le compte `2` dans l'entrée de ce morceau.
- ✅ Interroger un terme qui n'existe pas retourne un mappage vide au lieu de lever.

**🤔 Question(s) socratique(s)**

- L'index est un *dict plat de dicts*. Que faudrait-il pour supporter « trouver les morceaux par plusieurs termes en une seule recherche » (une union de clés de dict) sans aucune nouvelle dépendance — et pourquoi est-ce le prochain type de requête naturel ?
- Cet index se souvient *combien de fois* un terme apparaît mais pas *où dans le morceau* (la position). Que déverrouillerait le fait de connaître la position — et cela vaut-il la mémoire quand un morceau fait 25 mots ?

## Étape 3 : Scorer et classer les morceaux pour une requête

« Quel morceau répond à ma question ? » a maintenant une réponse mécanique : tokénise la requête, cherche le compte de chaque terme par morceau, et donne à chaque morceau un **score normalisé** = (somme des comptes de termes correspondants) ÷ (compte de mots du morceau). Les longs morceaux sont punis pour leur longueur, ce qui est tout l'intérêt de la division, et c'est la différence entre « correspond » et « correspond *densément* ».

### 3.1 Écris `search`

**👟 Indice de départ :** Termes de requête uniques, une double boucle sur les morceaux, score normalisé, puis `sorted(... reverse=True)` :

```python
# search.py
from ingest import load_corpus, tokenize
from index import build_index, word_counts

def search(query: str, chunks: list[dict], index: dict, counts: dict[str, int]) -> list[tuple[float, dict]]:
    terms = set(tokenize(query))
    scored = []
    for chunk in chunks:
        score = sum(index[t].get(chunk["id"], 0) for t in terms) / counts[chunk["id"]]
        scored.append((score, chunk))
    return sorted(scored, key=lambda pair: pair[0], reverse=True)

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    for i, (score, chunk) in enumerate(search("nocturnal", chunks, index, counts)[:3], 1):
        print(f"{i}. {chunk['id']:<12} score {score:.4f}  {chunk['text'][:30]}...")
```

Le score de fréquence de termes (TF) est délibérément basique — pas de pondération de position, pas de bonus de phrase — et sa simplicité est la leçon : même ce TF nu + normalisation produit déjà des *classements simplement corrects* pour une question par mots-clés sur un petit corpus. Interroger `nocturnal` le trouve dans deux fichiers, et — voici le détail subtil — le fichier hamster *surclasse* le fichier gecko (0.0476 → 0.0400) non pas parce qu'il mentionne le mot deux fois, mais parce que la normalisation divise par la longueur du morceau et que le morceau hamster est plus court. La qualité de recherche est une argumentation constante sur les fonctions de scoring ; tu possèdes maintenant la plus simple et la plus honnête.

**🎯 Résultat attendu :**

```
1. hamster.md#0 score 0.0476  Hamsters are nocturnal rodents...
2. gecko.md#0   score 0.0400  Geckos are nocturnal lizards. ...
3. hermit.md#0  score 0.0000  Hermit crabs are decapod crust...
```

**🩹 Si ça ne marche pas :** Si les scores sont tous `inf`/`ZeroDivisionError`, l'entrée `counts` d'un morceau manque (les ids de morceaux ne s'alignent pas entre `load_corpus` et `word_counts` — ils doivent tous deux dériver de la même liste `chunks`). Si un morceau obtient `nan`, une division par `0` a glissé à travers — un morceau vide ; `load_corpus` filtre `if p.strip()`, donc confirme que ton découpeur a gardé cette garde.

### 3.2 Vérifie le classement

**✅ Liste de vérification**

- ✅ `nocturnal` classe hamster et gecko par score *normalisé* — hamster (21 mots) au-dessus de gecko (25 mots) avec des comptes de termes identiques.
- ✅ Une requête multi-mots somme les comptes par terme : `geckos eat` score gecko à `(2+1)/25 = 0.120`.
- ✅ `sorted(..., reverse=True)` retourne le score le plus haut d'abord ; les égalités gardent l'ordre du corpus.

**🤔 Question(s) socratique(s)**

- `nocturnal` apparaît une fois dans deux morceaux, pourtant ils se classent différemment. Est-ce un *comportement correct* ou un artefact — quelle question sur les deux documents le classement encode-t-il réellement ?
- C'est seulement de la fréquence de termes, pas d'IDF (fréquence inverse de document). Un terme comme `the`, présent dans chaque morceau, scorerait également une corbeille de coups. Qu'est-ce que l'IDF soustrait du score de chaque morceau — et qu'est-ce qu'une liste de mots vides (stop-words) achète à la place, au prix de coder en dur une liste ?

## Étape 4 : Extraire une phrase comme réponse

Le classement a trouvé le *morceau* ; la question mérite une *phrase*. Découper le meilleur morceau en phrases et scorer chacune par combien de termes de requête elle contient est la réponse extractive, la deuxième couche honnête : des termes de requête présents dans une phrase signifient que la phrase porte probablement la réponse. Ce que tu gagnes est une citation (« gecko.md ») qu'aucune étape de génération de faits ne peut falsifier — et ce que tu apprends est précisément où l'extraction cesse d'être impressionnante.

### 4.1 Écris `extract_answer`

**👟 Indice de départ :** Réutilise `search` pour le meilleur morceau, découpe aux frontières de phrases avec une regex lookbehind, score les phrases par les jetons de requête distincts présents :

```python
# answer.py
import re

from ingest import load_corpus, tokenize
from index import build_index, word_counts
from search import search

def sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

def extract_answer(query: str, chunks: list[dict], index: dict, counts: dict[str, int]):
    top = search(query, chunks, index, counts)[0][1]
    terms = set(tokenize(query))
    best_sentence, best_score = "", -1.0
    for sentence in sentences(top["text"]):
        score = sum(1 for t in terms if t in tokenize(sentence))
        if score > best_score:
            best_score, best_sentence = score, sentence
    return best_sentence, top["source"]

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    for query in ("what is nocturnal", "geckos eat", "climb"):
        answer, source = extract_answer(query, chunks, index, counts)
        print(f"Q: {query}")
        print(f"A: {answer}")
        print(f"  source: {source}\n")
```

La regex `(?<=[.!?])\s+` coupe *après* la ponctuation et avale l'espace blanc suivant — un découpeur de phrases assez bon pour une prose soignée. Scorer une phrase par les jetons de requête *distincts* (`geckos` compte une fois, pas deux) garde une phrase qui répète seulement le sujet de battre celle qui répond au verbe. L'honnêteté gratuite de l'extracteur : demande « climb » et il retourne « They can climb smooth glass using tiny lamellae. » *et le fichier d'où elle vient* — la citation est la fonctionnalité, car le lecteur peut vérifier le travail.

**🎯 Résultat attendu :**

```
Q: what is nocturnal
A: Hamsters are nocturnal rodents.
  source: hamster.md

Q: geckos eat
A: Geckos eat insects such as crickets.
  source: gecko.md

Q: climb
A: They can climb smooth glass using tiny lamellae.
  source: gecko.md
```

**🩹 Si ça ne marche pas :** Si « what is nocturnal » répond depuis gecko.md au lieu de hamster.md, le classement du *morceau* a changé — le répondeur ne peut pas être plus malin que sa recherche, et `search` favorise actuellement le morceau le plus court. Si une meilleure phrase manque, `sentences()` a rétréci le découpage (la regex a manqué un `\n\n` dans le texte du paragraphe) — c'est exactement le moment où tu déplacerais le découpage vers des unités de phrases.

### 4.2 Vérifie l'extraction

**✅ Liste de vérification**

- ✅ Chaque réponse cite `source` depuis le morceau où elle a été trouvée — jamais fabriquée.
- ✅ Pour `what is nocturnal`, source = le morceau de rang 1 (`hamster.md`), cohérent avec l'Étape 3.
- ✅ Le scoring de phrases lit des termes distincts, donc `geckos` apparaissant trois fois dans une phrase ne domine pas purement par répétition.

**🤔 Question(s) socratique(s)**

- « What do hamsters eat? » chercherait le morceau de `hamsters` et extrairait « Hamsters are nocturnal rodents. » — une phrase qui *contient le mot* mais ne *répond pas à la question*. Qu'est-ce qui casse ce comportement (granularité morceau → phrase, sémantique manquante), et qu'est-ce qu'une étape de mots vides plus synonymes réparerait ?
- La citation est toute la couche de responsabilité : chaque réponse pointe vers un fichier source qu'un humain peut ouvrir. Que changerait-il à la confiance dans la réponse si la citation était *résumée* (« depuis hamster.md environ ») plutôt qu'exacte ?

## Étape 5 : La CLI interactive

Jusqu'ici tout est fonctions ; le produit est une boucle. `ask.py` charge le corpus une fois, construit l'index une fois, puis invite : classe les trois meilleurs morceaux pour une question tapée, affiche la réponse extractive avec sa source, accepte la question suivante, et ne s'arrête que sur une ligne vide (ou Ctrl-D). Un vrai « discute avec tes docs » qui tourne entièrement hors ligne.

### 5.1 Écris `ask.py`

**👟 Indice de départ :** Compose silencieusement ingestion + index + recherche + extraction sous le capot ; boucle sur `input()` jusqu'à vide ou EOF :

```python
# ask.py
from answer import extract_answer
from ingest import load_corpus
from index import build_index, word_counts
from search import search

def main() -> None:
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    while True:
        try:
            query = input("ask> ").strip()
        except EOFError:
            break
        if not query:
            break
        for rank, (score, chunk) in enumerate(search(query, chunks, index, counts)[:3], 1):
            print(f"{rank}. {chunk['id']} ({score:.3f})")
            print(f"   {chunk['text']}")
        answer, source = extract_answer(query, chunks, index, counts)
        print(f"answer: {answer} [{source}]")

if __name__ == "__main__":
    main()
```

```bash
uv run python ask.py
```

`while True:` avec `break` sur entrée vide est tout le contrat interactif — une question par tour, le silence quand l'humain a fini, et un `try/except EOFError` pour que Ctrl-D (EOF) sorte aussi élégamment qu'une ligne vide. La boucle de trois lignes sur `search(...)[:3]` est où les morceaux classés *deviennent* le chat, et la ligne finale `answer:` est où la recherche devient une réponse. Essaie `nocturnal`, puis `climb`, puis `humidity`, et remarque que le moteur cite différents fichiers pour différents faits.

**🎯 Résultat attendu** (une session réelle, une requête après l'autre) :

```
ask> geckos eat
1. gecko.md#0 (0.120)
   Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
2. hermit.md#0 (0.043)
   Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
3. hamster.md#0 (0.000)
   Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
answer: Geckos eat insects such as crickets. [gecko.md]
ask> nocturnal
1. hamster.md#0 (0.048)
   Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
2. gecko.md#0 (0.040)
   Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
3. hermit.md#0 (0.000)
   Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
answer: Hamsters are nocturnal rodents. [hamster.md]
ask> 
```

**🩹 Si ça ne marche pas :** Si l'invite se répète sans accepter d'entrée, le `input` est dans la boucle mais le `break` sur vide manque — chaque ligne vide qui n'est pas vide continue. Si `ask.py` crashe sur la première requête, une chaîne d'imports est cassée (un des quatre modules) — `uv run python -c "import ask"` révèle exactement lequel.

### 5.2 Vérifie la CLI

**✅ Liste de vérification**

- ✅ `uv run python ask.py` démarre, répond `geckos eat` comme dans la session ci-dessus, et sort sur une ligne vide.
- ✅ Une réponse vide n'apparaît jamais : `extract_answer` retourne toujours la meilleure (possiblement faible) phrase, jamais `""`.
- ✅ Se terminer avec Ctrl-D sort proprement sans traceback.

**🤔 Question(s) socratique(s)**

- La CLI compose quatre modules mais en dépend *par nom de fichier*. Qu'est-ce qui casserait si une coéquipière renommait `answer.py` en `answers.py` — et qu'est-ce que cela te dit sur l'importation de modules entiers par rapport à l'importation de fonctions ?
- La transcription de session est déterministe *parce que* le corpus et l'index sont déterministes. Qu'est-ce qui rendrait d'abord la sortie non déterministe (indice : le `sorted()` de l'Étape 1 et le top-3 fixe de l'Étape 5) — et quel choix protège tes tests ?

## ⚠️ Pièges courants

- **Ids de morceaux depuis des chemins.** `f"{path}"` tamponne `docs/gecko.md#0` dans chaque id et casse silencieusement le contrat de citation. Utilise `path.name` — court, stable, lisible par un humain.
- **Scorer avant de normaliser.** Les comptes de termes bruts font paraître le morceau gecko de 25 mots plus fort que le morceau hamster de 21 mots pour le même coup unique. Divise par la longueur du morceau, ou la « qualité de recherche » que tu débogues est surtout du « biais de longueur ».
- **Ré-indexer par requête.** Un index construit à l'intérieur de `search()` exécute la partie chère à chaque question. Construis une fois, interroge plusieurs — le `main()` de la CLI le charge avant la boucle exactement pour cette raison.
- **Des phrases d'abord conscientes de la ponctuation, puis plus.** `text.split(". ")` manque `!`, `?`, et l'espace blanc final ; le lookbehind `(?<=[.!?])\s+` gère les trois. Découpe négligemment, réponds tard.
- **Traiter l'index comme la réponse.** L'index trouve les morceaux ; `extract_answer` choisit les phrases ; aucun des deux ne « comprend ». Si une réponse de démo est fausse, vérifie si la recherche a classé correctement et si le scoreur de phrases a mal placé les termes — le bug est généralement une couche plus bas que le symptôme.

## Ce que tu viens de construire

Un moteur de recherche à quatre couches sans dépendances : découpeur → index inversé → classeur → extracteur, enveloppé dans une CLI interactive, et chaque réponse cite son fichier source. L'architecture transférable est le *rappel en couches* : tu ne demandes jamais une réponse à l'index — tu lui demandes des candidats, tu scores les candidats, et tu extrais depuis le meilleur. Échange le découpeur, le scoreur (IDF, BM25), ou l'extracteur (résumeur) indépendamment, et la forme du pipeline — des candidats, pas des réponses — est ce qui survit.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/document-qa-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/document-qa-engine) dans le dépôt du cours contient les scripts complets plus le même corpus de trois fichiers. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute la **pondération IDF** : les termes rares boostent le score d'un morceau pendant que les omniprésents (`the`) le réduisent — le plus gros gain de précision sous une douzaine de lignes dans `search`.
- Déplace le découpeur vers **les unités de phrases** : découpe sur `sentences()` dans `load_corpus` pour que « quelle phrase mentionne X » soit pré-calculé, brûlant la mémoire des morceaux pour la qualité des réponses.
- Ajoute une **table de synonymes** (`lizard → gecko`, `crustacean → hermit crab`) étendue au moment de l'index — un rappel bon marché, et la prochaine victoire de réponses naturelle.
- Persiste l'index (**dump/load de `index.json`**) pour qu'un gros corpus se construise une fois et que `ask.py` redémarre instantanément sans relire chaque fichier.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓