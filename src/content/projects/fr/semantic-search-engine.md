---
title: "Moteur de Recherche Sémantique"
description: "Construis un moteur de recherche qui comprend le sens, pas seulement les mots-clés — intègre des documents, calcule la similarité cosinus dans NumPy, et cherche par sens au lieu de termes exacts."
difficulty: "advanced"
estimatedMinutes: 240
tags: ["machine-learning", "numpy", "embeddings", "search", "cosine-similarity", "sentence-transformers"]
learningObjectives:
  - "Intégrer une petite collection de documents en vecteurs denses avec un modèle transformer hébergé"
  - "Stocker et interroger la matrice d'embeddings avec NumPy"
  - "Classer les documents par similarité cosinus avec une requête en langage naturel"
  - "Diagnostiquer quand les mots-clés battent la sémantique (et vice-versa) avec une sonde hybride"
prerequisites: ["python-101/libraries", "numpy-101/arrays", "data-analysis/pandas"]
---

# 🧠 Construire un Moteur de Recherche Sémantique

La recherche par mots-clés est littérale : tape « moteur de voiture » et le système cherche ces deux jetons exacts. La recherche sémantique est *paresseuse avec le langage* : tape « moteur de véhicule » et elle devrait quand même trouver le paragraphe sur les moteurs, parce qu'elle représente le sens comme un vecteur dans un espace de haute dimension où les idées similaires se tiennent proches. En 2026, ce truc tourne sur de petits modèles transformers que tu peux exécuter dans un notebook, donc tout le pipeline tient dans tes mains : intègre une collection de documents en vecteurs denses, garde-les dans une matrice NumPy, puis réponds à une requête en langage naturel en calculant quels paragraphes intégrés sont les plus proches en distance cosinus. Ce projet construit ce moteur de bout en bout, puis confronte la limite honnête — quand l'éclat sémantique échoue et qu'une simple correspondance de mots-clés gagne sur un nom propre — et te montre comment un hybride sonde dans quel régime tu te trouves.

Cela suppose le Python 101 plus les modules NumPy et pandas du cours. C'est optionnel et non noté ; vois [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Charger une petite collection réelle de morceaux de documents et les inspecter.
2. Intégrer chaque morceau en un vecteur dense avec un petit modèle transformer.
3. Stocker les vecteurs dans une matrice NumPy et les normaliser une fois.
4. Répondre aux requêtes en langage naturel en classant la similarité cosinus avec l'embedding de la requête.
5. Construire un hybride mots-clés-vs-sémantique et trouver la requête où chaque approche gagne.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal pour le *petit* modèle — `sentence-transformers` télécharge un modèle de ~100 Mo une fois, puis intègre et cherche sur CPU en millisecondes. `uv add sentence-transformers numpy pandas` couvre tout ; la première exécution récupère les poids, les exécutions suivantes utilisent le cache.

**GitHub Codespaces** donne l'expérience identique : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et les mêmes commandes s'exécutent dans un onglet de navigateur contre un petit corpus inclus.

**Google Colab, les Notebooks Kaggle et Binder gèrent ce projet mieux que tout autre dans le cours** — un petit transformer tourne à l'aise sur le CPU gratuit de Colab/Kaggle (parfois CUDA), le modèle de la classe `all-MiniLM-L6-v2` se télécharge automatiquement, et toute la boucle intègre→cherche s'affiche en ligne avec les vecteurs visibles. La seule réserve honnête : tu télécharges les poids à la première exécution (quelques centaines de Mo), et si tu es hors ligne, le modèle ne se chargera pas — donc les parties de *pur calcul vectoriel* fonctionnent toujours avec `numpy` que tu as précalculé, mais l'étape d'intégration en direct a besoin d'un accès réseau vers Hugging Face.

[![Ouvrir dans Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/semantic-search-engine/notebook.fr.ipynb)
[![Ouvrir dans Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/semantic-search-engine/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsemantic-search-engine%2Fnotebook.fr.ipynb)

## Configuration

La chaîne d'outils, une bibliothèque avec un téléchargement de modèle, et un petit corpus de morceaux de documents à chercher.

### Installe `uv` et `sentence-transformers`

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis :

```bash
uv --version
mkdir semantic-search-engine && cd semantic-search-engine
uv init --bare
uv add sentence-transformers numpy pandas
```

Téléchargement du modèle à la première exécution (une seule fois) :

```python
# fetch_model.py
from sentence_transformers import SentenceTransformer
SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
print("model ready")
```

```bash
uv run python fetch_model.py
```

### Un petit corpus d'exemple

Le dépôt du cours embarque une petite collection de courts paragraphes « de faits sur les animaux » — assez concrets pour distinguer la sémantique des mots-clés :

```python
# corpus.py
CORPUS = {
    0: "Dolphins communicate using clicks and whistles underwater.",
    1: "The tallest mountain on Earth is Mount Everest in Asia.",
    2: "Octopuses have three hearts and blue blood.",
    3: "Cats spend most of their day sleeping.",
    4: "Mount Kilimanjaro is a dormant volcano in Africa.",
    5: "Dogs are descendants of gray wolves, domesticated over thousands of years.",
}
```

N'hésite pas à substituer ton propre texte (notes de cours, histoires) — n'importe quels courts morceaux fonctionnent.

**✅ Liste de vérification**

- ✅ `uv --version` affiche une version ; `sentence-transformers`, `numpy`, `pandas` installés.
- ✅ `uv run python fetch_model.py` imprime `model ready` (quelques centaines de Mo mis en cache à la première exécution).
- ✅ Ton corpus est un dict Python de quelques courtes chaînes de morceaux.

## Étape 1 : Charge et inspecte les morceaux

Avant qu'aucun calcul ne touche un modèle, regarde la matière première — le corpus est petit exprès, pour que tu puisses *connaître* chaque morceau à vue. L'habitude « imprime tes données avant de les transformer » est ce qui sépare un script qui fait confiance au modèle d'un script qui peut *lire* les entrées du modèle.

**👟 Indice de départ :** Commence par importer `CORPUS`, construire des listes parallèles `ids` et `texts` depuis ses clés et valeurs, et imprimer le nombre de morceaux avec le texte de chaque morceau avant qu'aucun embedding ne s'exécute.

```python
# search.py
from corpus import CORPUS

ids = list(CORPUS.keys())
texts = list(CORPUS.values())
print(f"{len(ids)} chunks, {sum(len(t.split()) for t in texts)} words total")
for i, (cid, t) in enumerate(CORPUS.items()):
    print(f"{cid:>2}  {t[:70]}")
```

Le mapping `id → text` est la référence que tu garderas à travers chaque étape suivante : l'*embedding* est la forme lisible par la machine, mais le *texte* est la réponse orientée humain, et un moteur de recherche retourne celui qu'il pense qu'une personne a envie de lire. Garder `ids` et `texts` comme des listes parallèles (ou le dict avec lequel tu as commencé) est la discipline qui t'empêche de retourner « vecteur 14.7 » quand l'utilisateur a posé une question.

**🎯 Résultat attendu :** Un compte (6 morceaux, ~40 mots au total) et une liste numérotée des chaînes de paragraphes — le contenu exact que tu chercheras dans les Étapes 2–5.

**🩹 Si ça ne marche pas :** Si l'import échoue, `corpus.py` n'est pas sur le chemin d'import — exécute depuis le même dossier, ou mets `CORPUS` directement dans `search.py`. Si l'impression montre moins de lignes qu'attendu, une barre oblique inverse de fin a silencieusement échappé un saut de ligne — le littéral `CORPUS` exige que `\{` soit géré ; citer avec `"""` est le correctif robuste.

**✅ Liste de vérification**

- ✅ Le corpus s'imprime en entier avec des identifiants entiers stables.
- ✅ Tu peux réciter, de mémoire, un morceau « piège » (un concept partagé comme `mountains` entre 1 et 4) pour tester la sémantique plus tard.
- ✅ `ids`, `texts` sont synchronisés (même ordre) pour le reste du pipeline.

**🤔 Question(s) socratique(s)**

- Deux morceaux mentionnent tous deux « mountain » (1 et 4) mais décrivent des montagnes *différentes*. Une recherche par mots-clés ne peut pas les distinguer par ce jeton ; qu'est-ce qui les rend *sémantiquement* distincts, et pourquoi cette distinction est-elle exactement ce que les embeddings sont censés capturer ?
- Le corpus est minuscule. Quelle est la raison *pratique* de prototyper sur 6 phrases avant de passer à l'échelle sur 6000 — quel bug un corpus de 6 documents révélerait-il qu'un corpus de 6000 documents enterrerait ?

## Étape 2 : Intègre chaque morceau

Le saut des mots aux nombres est le cœur du projet. Un modèle sentence-transformer lit chaque morceau et produit un vecteur dense de taille fixe (ici 384 flottants) où les phrases sémantiquement similaires atterrissent près les unes des autres et les non apparentées atterrissent loin. « Le sens » devient une géométrie : une direction dans l'espace des embeddings.

**👟 Indice de départ :** Commence par charger le modèle une fois (`SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")`) et appeler `model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)` — puis imprime `X.shape` et la norme de la première ligne.

```python
# search.py (suite)
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed(texts: list[str]) -> np.ndarray:
    return model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)

X = embed(texts)
print("embedding matrix:", X.shape)          # (6, 384) in this model
print("row norm[0]     :", round(float(np.linalg.norm(X[0])), 4))
```

`model.encode(..., normalize_embeddings=True)` retourne une matrice de `(n_morceaux, 384)`, chaque ligne un vecteur unitaire (norme ≈ 1.0). Normaliser une fois à l'avance signifie que chaque similarité ultérieure est un *cosinus* — et avec des vecteurs unitaires, la similarité cosinus se réduit à un simple produit scalaire, donc toute l'arithmétique de recherche de l'Étape 3 est un unique `X @ q`. Le nombre de 384 dimensions est le choix de conception du modèle ; tu ne règles pas *cela*, tu choisis un modèle, mais tu *façonnnes* son résultat.

**🎯 Résultat attendu :** `embedding matrix: (6, 384)` et `row norm[0]` : `1.0` (dans l'arrondi des flottants).

**🩹 Si ça ne marche pas :** Si le téléchargement du modèle se bloque ou échoue, l'accès réseau à Hugging Face est bloqué — l'étape `fetch_model.py` de la Configuration doit réussir d'abord ; derrière un proxy, pointe `HF_ENDPOINT` vers un miroir. Si `X` n'est pas `(6, 384)`, tu as aiguillé les mauvais textes dans `encode` — `convert_to_numpy=True` garantit une matrice ; une liste-de-listes errante signifie que tu as manqué la conversion en tableau.

**✅ Liste de vérification**

- ✅ `X.shape == (6, 384)` et chaque norme de ligne ≈ 1.0.
- ✅ Deux morceaux sémantiquement similaires produisent des vecteurs proches — vérifie que `np.dot(X[1], X[4])` (paire « mountain ») est plus élevé que `np.dot(X[1], X[2])`.
- ✅ Tu peux dire ce que « vecteur unitaire » t'achète plus tard (cosinus == produit scalaire).

**🤔 Question(s) socratique(s)**

- `normalize_embeddings=True` force la longueur unitaire, donc « combien ce texte en dit » est abandonné et seul « dans quelle direction il pointe » demeure. Quand la *longueur* serait-elle un signal significatif que tu *voudrais* garder (une requête qui exige une réponse super longue et sinueuse contre une réponse concise) ? Pourquoi la recherche préfère-t-elle généralement la direction seule ?
- Le même modèle intègre un *mot* et *tout son contexte*. Un morceau sur un « script python » et un sur un « python » serpent — même jeton, embeddings différents, parce que le modèle regarde les mots environnants. Trace ce que cela signifie pour un domaine avec des mots-clés ambigus, et où cela échoue silencieusement (homonymes que le modèle n'a pas bien désambiguïsés).

## Étape 3 : Cherche par similarité cosinus

Le moteur, en deux lignes de calcul : intègre la requête de l'utilisateur, puis classe chaque morceau stocké par similarité cosinus avec elle. Parce que l'Étape 2 a normalisé les lignes, le cosinus et le produit scalaire sont la même chose, et `X @ q` retourne un score pour chaque morceau en une seule étape vectorisée. Le classement est tout le produit.

**👟 Indice de départ :** Commence par écrire `search(query, X, texts, ids, k)` qui encode la requête exactement comme les documents, score chaque morceau avec `X @ q`, et retourne les `k` premiers par `np.argsort(scores)[::-1]`.

```python
# search.py (suite)

def search(query: str, X: np.ndarray, texts: list[str], ids: list[int],
           k: int = 3) -> list[tuple[int, float, str]]:
    q = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
    scores = X @ q
    order = np.argsort(scores)[::-1][:k]
    return [(ids[i], float(scores[i]), texts[i]) for i in order]

for q in ["an animal that lives in the sea", "a very tall landform", "sleeping pet"]:
    print(f"\nquery: {q!r}")
    for cid, score, text in search(q, X, texts, ids):
        print(f"   {score:>0.3f}  [{cid}] {text[:60]}")
```

La requête suit le chemin d'intégration *identique* à celui des documents — même modèle, même normalisation — donc le vecteur de requête vit dans le même espace sémantique, et `X @ q` est le produit scalaire de similarité cosinus. `np.argsort(scores)[::-1]` classe en descendant et découpe les `k` premiers. Le gain est visible dans la première requête : « an animal that lives in the sea » devrait classer le morceau *dauphin* (0) et le morceau *pieuvre* (2) — même si aucun de ces morceaux ne contient les mots « sea » ou « animal ». C'est de la sémantique : le modèle a donné le sens, et le produit scalaire a classé selon celui-ci.

**🎯 Résultat attendu :** Pour « an animal that lives in the sea », les premiers résultats sont les morceaux dauphin (0) et pieuvre (2) avec des scores bien au-dessus des montagnes (1, 4) ; pour « sleeping pet », le morceau chat (3) devrait être en tête — parce que tes mots de requête (« sea », « pet ») n'apparaissent dans *aucun* document, la correspondance est purement sémantique.

**🩹 Si ça ne marche pas :** Si la requête mer s'effondre sur les morceaux montagne, le modèle n'a pas généralisé comme tu l'espérais — essaie une requête plus idiomatique (« marine creature ») ; la qualité de l'embedding varie avec la formulation. Si tous les scores sont 0, la normalisation de la requête diffère de celle du corpus — les deux doivent utiliser `normalize_embeddings=True`. Si `np.argsort` retourne une `IndexError` d'incompatibilité de forme, `X` et `q` ne sont pas tous deux `(..., 384)` — un mauvais pipeline de modèle (par ex. un modèle différent produisant une dimension différente) entre en collision ; revérifie la forme de la matrice depuis l'Étape 2.

**✅ Liste de vérification**

- ✅ La requête mer classe dauphin + pieuvre au-dessus des montagnes — le sens, pas les jetons.
- ✅ Les scores sont dans `[0, 1]` (vecteurs unitaires), et l'ordre de classement est stable entre les exécutions.
- ✅ Tu peux pointer la ligne *exacte* qui fait la recherche (`X @ q` + `argsort`).

**🤔 Question(s) socratique(s)**

- Toute la recherche est `X @ q` après normalisation. Si tu *n'avais pas* normalisé, quelles deux quantités mélangerais-tu (magnitude des documents × magnitude de la requête) et pourquoi cela mal-classerait-il visiblement un long document informatif contre un court sur le même sujet ?
- `argsort(scores)[::-1]` trie en ascendant puis inverse. Quelle est la différence subtile entre cela et `scores.argsort()[: -(k+1) : -1]` — et pourquoi les deux fonctionnent ici ? (Pense à ce qu'« inverser un tableau trié en ascendant » fait aux égalités.)

## Étape 4 : Un hybride — les mots-clés quand ils comptent

La recherche sémantique est puissante mais pas omnipotente : quand la requête contient un *nom propre ou un jeton exact rare*, la correspondance lexicale peut être plus fiable que l'estimation du modèle. Un vrai moteur mélange les deux — un score par mots-clés (jetons exacts/chevauchants) fusionné avec un score sémantique — et expose le bouton pour que tu puisses voir chaque côté gagner. Cette étape construit l'hybride et confronte l'échec honnête.

**👟 Indice de départ :** Commence par écrire `keyword_score(query, text)` qui compte les jetons de la requête trouvés dans le morceau divisé par le nombre de jetons du morceau, puis mélange-le dans `hybrid(...)` comme `alpha * sem + (1 - alpha) * kw`.

```python
# search.py (suite)
import re

TOK = re.compile(r"[a-z0-9]+")

def keyword_score(query: str, text: str) -> float:
    q = set(TOK.findall(query.lower()))
    t = TOK.findall(text.lower())
    return sum(1 for w in t if w in q) / max(1, len(t))

def hybrid(query: str, X: np.ndarray, texts: list[str], ids: list[int],
           alpha: float = 0.5, k: int = 3) -> list[tuple[int, float, str]]:
    q = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
    sem = X @ q
    kw = np.array([keyword_score(query, t) for t in texts])
    blended = alpha * sem + (1 - alpha) * kw
    order = np.argsort(blended)[::-1][:k]
    return [(ids[i], float(blended[i]), texts[i]) for i in order]

for q in ["Mount Everest", "an animal that lives in the sea"]:
    print(f"\nquery: {q!r}")
    for alpha in (0.0, 1.0):
        print(f"  alpha={alpha}")
        for cid, s, text in hybrid(q, X, texts, ids, alpha=alpha):
            print(f"     {s:>0.3f}  [{cid}] {text[:50]}")
```

`keyword_score` compte combien des jetons du morceau apparaissent dans la requête, normalisé par le nombre de jetons du morceau — un signal lexical naïf mais honnête. `hybrid` le mélange avec les scores sémantiques (déjà normalisés `[0,1]`, donc la somme `alpha` reste comparable) et classe. Le drame est dans les deux requêtes : pour « Mount Everest » (un nom propre que le modèle a peut-être *vu* mais que le matcheur par mots-clés cloue par exactitude), la recherche par mots-clés `alpha=0` devrait faire aussi bien ou mieux que le bras sémantique ; pour la paraphrase « animal that lives in the sea », les mots-clés sont *impuissants* (ces mots ne sont dans aucun document) et seule la sémantique `alpha=1` fonctionne. Le travail de l'hybride est de tenir *les deux* — et l'écart de score imprimé est ta preuve de dans quel régime tu te trouves.

**🎯 Résultat attendu :** Pour « Mount Everest », le morceau Everest (1) est en tête dans les deux bras alpha, mais l'*écart* entre le rang-1 et un rang-2 (Kilimanjaro, 4) est typiquement plus net pour les mots-clés (`alpha=0`) ; pour la requête mer, `alpha=0` ne trouve rien (les mots ne sont dans aucun doc), tandis que `alpha=1` classe dauphin+pieuvre en premier — les deux régimes visibles dans un seul tableau.

**🩹 Si ça ne marche pas :** Si la requête mer à `alpha=0` retourne *quelque chose* (un morceau avec un jeton partagé aléatoire comme « a »), ton `keyword_score` matche articles/mots vides — ajoute un petit filtre de mots vides, ou accepte-le comme le biais connu du modèle et laisse l'écart t'enseigner. Si « Mount Everest » se classe *moins bien* à `alpha=1` qu'à 0, le transformer sous-pondère les noms propres rares — exactement la défaillance que la recherche par mots-clés raccommode, ce qui est le message final : alpha mélange, aucun bras n'a toujours raison.

**✅ Liste de vérification**

- ✅ Les requêtes à noms propres se classent bien via les mots-clés ; les requêtes paraphrasantes seulement via la sémantique.
- ✅ `alpha` décale visiblement le classement entre les deux classes de requêtes.
- ✅ `keyword_score` est borné dans `[0, 1]`, la même plage que `sem`, donc le mélange est comparable.

**🤔 Question(s) socratique(s)**

- Le mélange suppose que les deux scores vivent sur `[0, 1]`. `keyword_score` divise par la longueur du morceau pour que les longs docs ne gagnent pas par volume. Mais *quel* coût y a-t-il à normaliser par max(1, len) quand un morceau de 3 mots mérite de matcher — et le « combien de termes de requête apparaissent ici » *non* normalisé n'est-il pas parfois le meilleur signal métier ?
- `alpha` n'a pas de « bonne » valeur en général. Quelle est la manière *expérimentale* de la choisir pour *ton* corpus — un petit ensemble de requêtes avec des meilleures réponses connues, puis choisis l'alpha qui les classe correctement le plus souvent — et le piège de régler alpha sur les mêmes requêtes que celles que tu rapportes ?

## Étape 5 : Diagnostique quand ça casse

La dernière étape est l'honnêteté intellectuelle : un moteur de recherche qui ne te montre que des gagnants cache les moments où il a *tort*. Cette étape chasse délibérément la défaillance — une requête dont le premier rang est sémantiquement proche mais factuellement faux, ou une paraphrase que le modèle lit mal — et la caractérise, pour que tu partes en comprenant à la fois le pouvoir *et* la frontière.

**👟 Indice de départ :** Commence par écrire `show_all(query, X, texts, ids)` — encode la requête, score avec `X @ q`, et imprime chaque morceau avec son score en ordre descendant au lieu des seuls `k` premiers.

```python
# search.py (suite)

def show_all(query: str, X: np.ndarray, texts: list[str], ids: list[int]) -> None:
    q = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
    scores = X @ q
    order = np.argsort(scores)[::-1]
    print(f"\nquery: {query!r}")
    for i in order:
        print(f"   {scores[i]:>0.3f}  [{ids[i]}] {texts[i][:60]}")

show_all("the tallest mountain in Africa", X, texts, ids)
show_all("a creature with three hearts", X, texts, ids)
```

`show_all` imprime *chaque* morceau avec son score au lieu des seuls top-k, pour que tu puisses *voir* le classement complet et localiser le cas limite. La sonde « tallest mountain in Africa » est le piège : le modèle a *probablement* lié « mountain » fortement à Everest (1) à partir de ses données d'entraînement, donc le rang-1 peut être le morceau Everest même si la bonne réponse *factuelle* est Kilimanjaro (4). C'est le diagnostic honnête — les embeddings mesurent *l'association statistique*, pas *le fait de vérité terrain* — et le nommer est la vraie compétence.

**🎯 Résultat attendu :** Pour « the tallest mountain in Africa », un classement complet où Everest (1) peut surpasser Kilimanjaro (4) — une illustration parfaite que ce moteur mesure le *rapport à la phrase « tallest mountain »*, pas la *vérification du fait*. « A creature with three hearts » devrait clairement mettre la pieuvre (2) en tête.

**🩹 Si ça ne marche pas :** Si la sonde Afrique classe inopinément Kilimanjaro en premier, notre évaluation du risque était fausse *en ta faveur* — le modèle a choisi le contexte correctement ; c'est l'étape de la variance, et relancer avec une phrase légèrement différente (« very high peak in Africa ») la fera généralement retomber dans le piège. Si *tout* est une ligne plate propre (chaque morceau ≈ 0.5), ton corpus est trop homogène — remplace-le par des thèmes plus distincts pour que les scores s'étalent.

**✅ Liste de vérification**

- ✅ `show_all` imprime chaque morceau avec un score, pas seulement le top-3.
- ✅ La sonde Afrique *peut* classer Everest au-dessus de Kilimanjaro — et tu peux expliquer pourquoi (association ≠ fait).
- ✅ Tu peux articuler la limite en un mot de ce moteur : il cherche du *texte associé*, pas de la *vérité*.

**🤔 Question(s) socratique(s)**

- Le modèle encode « tallest mountain in Africa » avec de forts liens résiduels vers Everest depuis l'entraînement. Est-ce un *bug* du modèle, ou une *caractéristique des modèles de langage statistiques* qu'une couche de vérification des faits devrait corriger ? Défends brièvement les deux côtés.
- Chaque morceau est classé, mais que le score le plus élevé soit *le plus haut* ne signifie pas qu'il soit *bon* — un paragraphe corrélé mais faux peut quand même scorer 0.8. Qu'apporterait un *seuil* (pas de réponse si score max < θ), et quel est son risque quand la vraie réponse n'est simplement pas dans le corpus ?

## ⚠️ Pièges courants

- **Oublier de normaliser.** Sans `normalize_embeddings=True` sur les documents *et* la requête, le cosinus dégénère en un produit scalaire brut qui crie « long document, score plus élevé » et classe mal selon la longueur. Normalise une fois, partout.
- **Des modèles incompatibles.** Intégrer avec un modèle et interroger avec un autre (dimension différente, espace différent) classe mal silencieusement. Encode les documents et les requêtes avec la *même* instance `SentenceTransformer`.
- **Retourner des vecteurs, pas du texte.** Une recherche qui retourne « morceau 3, score 0.9 » est une UX cassée. Garde `id → text` synchronisé (listes parallèles) pour que chaque résultat classé reconduise vers quelque chose qu'un humain peut lire.
- **Traiter les scores sémantiques comme une vérité.** Les embeddings encodent *l'association statistique*, pas *les faits* — « tallest mountain in Africa » peut classer Everest parce que le modèle a appris qu'Everest est célèbre. Ajoute une couche de vérification (vérification par mots-clés ou récupération sur un champ factuel) pour tout ce qui est sensible aux faits.
- **Régler alpha sur la requête, pas sur le corpus.** Choisir α pour flatter une requête de démo surajuste. Choisis-le avec un ensemble mis de côté de paires (requête, résultat attendu) et rapporte le taux de réussite — la même discipline qui a rendu l'hybride digne de confiance.

## Ce que tu viens de construire

Un moteur de recherche sémantique fonctionnel : tu as intégré un petit corpus en une matrice NumPy 6×384, normalisé les lignes pour que le cosinus devienne un unique produit scalaire `X @ q`, classé les requêtes en langage naturel par similarité, mélangé un bras par mots-clés avec un `alpha` réglable, puis — la partie la plus dure — *regardé le classement complet* et nommé exactement où il est naïf. Les idées transférables vont bien au-delà de la recherche : l'habitude « normalise une fois, puis la géométrie devient de l'arithmétique », la frontière « associe, ne vérifie pas » que chaque modèle d'embedding embarque, et la discipline d'imprimer tous tes scores, pas seulement les gagnants.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/semantic-search-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/semantic-search-engine) dans le dépôt du cours regroupe un corpus plus riche, le module intègre-et-cherche, et un notebook qui charge, intègre, classe, mélange et montre l'étalement complet des scores en ligne. Clone le dépôt, ou ouvre-le dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute les cinq étapes de bout en bout.
:::

## Où aller à partir d'ici

- **Un corpus plus grand :** lis des documents depuis un dossier (`pathlib.glob`) et découpe-les en paragraphes avant d'intégrer — le jouet de 6 éléments devient un vrai index.
- **Persiste l'index :** sauvegarde `X` avec `np.save` et charge-le sans re-intégrer, pour que les démarrages à froid soient une lecture de fichier, pas un appel de modèle.
- **Une API :** enveloppe `search` dans un point de terminaison `FastAPI` `/search?q=...` retournant du JSON `{id, score, text}` — la même fonction, désormais joignable par HTTP.
- **Vérifie le premier résultat :** ajoute une revérification par mots-clés (le `keyword_score` de l'Étape 4) comme garde-fou avant que le rang-1 n'atteigne un utilisateur, refermant la brèche « l'association n'est pas un fait ».

## Partage ton projet avec la classe

Tu as intégré une collection, trouvé une victoire sémantique, ou photographié une défaillance sur nom propre ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README parcourt l'ajout du tien via une **pull request** du début à la fin : forker, créer une branche, commiter et ouvrir la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓