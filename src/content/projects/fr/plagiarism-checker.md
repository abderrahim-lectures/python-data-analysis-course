---
title: "Détecteur de Plagiat"
description: "Détectez le plagiat dans les soumissions de texte avec notation de similarité et identification des sources."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "text-processing", "algorithm", "csv"]
learningObjectives:
  - Normaliser le texte par le casse et la tokenisation en mots
  - Construire un ensemble de shingles (n-grammes) pour un document
  - Noter la similarité par paire avec la similarité de Jaccard entre ensembles de shingles
  - Exécuter un rapport par lot sur un corpus et signaler les paires à forte similarité
prerequisites: ["python-101/strings", "python-101/sets", "python-101/loops", "python-101/functions"]
---

# 🔍 Construire un Détecteur de Plagiat

Chaque plateforme d'évaluation ne regarde qu'un seul chiffre : quelle part de cette dissertation a été copiée. Derrière ce chiffre se cache un algorithme étonnamment simple et honnête, le **shingle**. Un document est découpé en séquences de mots qui se chevauchent, de longueur N, et deux documents sont comparés selon le nombre de ces séquences qu'ils partagent. Ce projet construit un CLI qui note une dissertation contre un corpus entier de documents sources, transformant le texte brut en ensembles de jetons, calculant une similarité de Jaccard pour chaque paire, et affichant un rapport classé avec les paires suspectes en tête. Pas de ML, pas d'API, pas de magie.

Cela suppose le Python 101, chaînes, ensembles, boucles et fonctions. Rien au-delà de cela. C'est optionnel et non noté ; vois [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Tokeniser et normaliser un document en listes de mots en minuscules.
2. Découper un document en shingles de N mots qui se chevauchent (la « empreinte digitale » du texte).
3. Calculer un score de similarité entre deux documents comme le recouvrement de Jaccard de leurs ensembles de shingles.
4. Exécuter une dissertation contre un corpus source entier et classer chaque paire par score.
5. Signaler les paires au-dessus d'un seuil et afficher un rapport lisible par un humain, plus les phrases de recouvrement exactes comme preuve.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal ici, c'est un algorithme purement textuel, purement stdlib, sur des fichiers que tu contrôles, donc « dépose deux dissertations dans un dossier, exécute une commande, obtiens le rapport » est exactement le flux de travail pour lequel il est conçu, et les fichiers de sortie atterrissent sur un vrai système de fichiers.

**GitHub Codespaces** est la même expérience : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et les commandes ci-dessous s'exécutent dans un onglet de navigateur avec Node, Python et `uv` préinstallés.

**Google Colab, les notebooks Kaggle et Binder exécutent honnêtement tout le pipeline**, normalisation, shingling, notation Jaccard, rapport, contre le corpus d'exemple fourni avec le cours, car rien ici n'a besoin d'un GPU, d'une clé ou d'un gros fichier. La réserve honnête est la portée : le notebook note les dissertations d'exemple fixes plutôt que ton propre dossier de soumissions, donc considère-le comme le banc d'essai de l'algorithme, et passe en local quand tu veux l'exécuter sur de vrais documents.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/plagiarism-checker/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/plagiarism-checker/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fplagiarism-checker%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant de noter une seule phrase : `uv`, et un petit corpus avec une dissertation manifestement copiée plus deux honnêtes.

### Installe `uv` et structure le projet

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
mkdir plagiarism-checker && cd plagiarism-checker
uv init --bare
```

Zéro paquet supplémentaire, pure bibliothèque standard.

### Construis le corpus source

Écris trois documents sources dans `sources/` (copie-les mot pour mot) :

`sources/origin_ecology.txt` :

```
The kelp forest is a foundation of coastal biodiversity. Otters control the
urchin population, and where otters vanish the urchins strip the kelp to bare
rock. Removing one species can collapse an entire ecosystem within a decade.
```

`sources/origin_urbanism.txt` :

```
Cities concentrate talent because dense proximity lowers the cost of exchanging
ideas. A walking neighborhood outperforms a highway suburb at innovation, since
casual collisions between workers seed collaborations that commuting never allows.
```

`sources/origin_renewables.txt` :

```
Solar generation rises in the late morning and peaks at noon, while wind output
tends to strengthen overnight. Storage smooths the daily gap, but a grid that
overbuilds one intermittent source still faces scarcity in the other's trough.
```

Maintenant écris une dissertation qui est **manifestement plagiée** de la première source, et une seconde qui est une prise de position honnête et originale. Puis fais-les passer toutes les deux, depuis un dossier `submissions/` :

`submissions/essay_ours.txt` :

```
The kelp forest is a foundation of coastal biodiversity. Otters control the
urchin population, and where otters vanish the urchins strip the kelp to bare
rock. I would also argue that rewilding otter populations is the cheapest
conservation investment we can make in temperate seas.
```

`submissions/essay_original.txt` :

```
I want to write about where we keep losing coastlines, and why a single fishy
manager per hectare beats ten committees. The short answer is that small teams
acting locally catch damage faster, and I will defend that claim from my own
observations of tidal restoration projects this year.
```

```bash
mkdir sources submissions
# save the three files into sources/ and the two into submissions/
ls sources submissions
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `sources/` contient trois documents d'origine distincts et `submissions/` contient une dissertation à l'air copié et une originale.
- ✅ Tu sais déjà, rien qu'en lisant, que `essay_ours.txt` devrait obtenir un score élevé contre `origin_ecology.txt`. L'Étape 4 existe pour confirmer que le chiffre correspond à ton intuition.

## Étape 1 : Normalise et tokenise le texte

La détection de plagiat est bruitée avant d'être précise : les dissertations diffèrent par la casse, la ponctuation et les sauts de ligne même quand les mots sont identiques. La première étape retire tout cela, tout en minuscules, découpé en mots, ponctuation supprimée, pour que « The Kelp » et « the kelp » soient enfin les deux mêmes mots.

### 1.1 Écris le tokeniseur

```python
# normalize.py
import re
from pathlib import Path

def tokenize(text: str) -> list[str]:
    text = text.lower()
    words = re.findall(r"[a-z']+", text)
    return words

def load_document(path: str) -> list[str]:
    return tokenize(Path(path).read_text(encoding="utf-8"))

if __name__ == "__main__":
    toks = load_document("submissions/essay_ours.txt")
    print(f"{len(toks)} tokens")
    print(toks[:12])
```

`re.findall(r"[a-z']+", text)`, après mise en minuscules, est toute la normalisation : il ne garde que les suites de lettres et d'apostrophes, donc virgules, points et sauts de ligne disparaissent tandis que `don't` survit comme un seul jeton (cela compte pour faire correspondre « don't » à lui-même, pas pour la ponctuation). Le motif produit directement la *liste* de jetons, pas de découpage, pas de passe de filtrage, ce qui est à la fois plus rapide et plus correct que `text.split()` + un nettoyage.

**👟 Indice de départ :** Exécute le tokeniseur sur la dissertation copiée et compte, tu cherches « the kelp forest is a foundation of coastal biodiversity » à ressortir en 9 jetons propres, pas en 12 avec des fragments de ponctuation.

**🎯 Résultat attendu :** `35 tokens` (environ) pour `essay_ours.txt`, et les 12 premiers jetons se lisent `['the', 'kelp', 'forest', 'is', 'a', 'foundation', 'of', 'coastal', 'biodiversity', 'otters', 'control', 'the']`, aucune `'` ni `,` nulle part.

**🩹 Si ça ne marche pas :** Si les jetons contiennent encore de la ponctuation, le regex a été exécuté avant `lower()` ou n'a rien trouvé à retirer, la classe `[a-z']+` ne correspond qu'aux lettres, donc tout le reste a déjà été écarté. Si des chiffres qui t'importaient ont disparu (`2026`), la classe exclut délibérément les chiffres, décide, et documente-le, si les années et les comptes comptent pour ton corpus (d'habitude non pour de la prose).

### 1.2 Vérifie la normalisation

**✅ Liste de vérification**

- ✅ `tokenize("The Kelp. Forest!")` retourne `['the', 'kelp', 'forest']`, 3 jetons, tous en minuscules, sans ponctuation.
- ✅ `tokenize("don't stop")` garde `don't` comme un seul jeton.
- ✅ Le nombre de jetons pour le même texte est identique quelle que soit la façon dont tombent les sauts de ligne, la normalisation efface le formatage, pas le contenu.

**🤔 Question(s) socratique(s)**

- Nous supprimons les nombres et isolons `don't`. Pour une prose *qui étoffe les propositions*, un terme traité avec un trait d'union comme `**self-organized**` se tokenise en `self` et `organized`, deux jetons qui ne correspondent jamais au `self-organized` du source. Est-ce une correspondance que tu voudrais conserver, et quelle est la forme normalisée (indice : remplace le trait d'union par un espace ou garde l'union) qui la préserve ?
- `re.findall` met en minuscules en réécrivant d'abord toute la chaîne. Si un document faisait 10 Mo, où va la mémoire, et quelle est l'alternative à un drapeau `re` (`re.IGNORECASE`) qui éviterait la copie si cela t'importait un jour ?

## Étape 2 : Découpe un document en shingles

Les mots bruts sont trop granulaires : deux documents qui partagent le mot « the » se ressemblent beaucoup sans être similaires. La solution est le **shingle**, une fenêtre de N mots consécutifs qui se chevauchent, où deux documents ne sont similaires que lorsqu'ils partagent *des fenêtres entières*, des dizaines de mots, dans le même ordre relatif. C'est l'idée unique autour de laquelle tout le vérificateur est construit.

### 2.1 Construis la fenêtre de shingles

```python
# shingle.py
from normalize import tokenize
from pathlib import Path

N = 4

def shingles(tokens: list[str], n: int = N) -> set[tuple]:
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

if __name__ == "__main__":
    toks = tokenize(Path("submissions/essay_ours.txt").read_text())
    print(f"{len(toks)} tokens -> {len(shingles(toks))} shingles of size {N}")
    print(sorted(shingles(toks))[:2])
```

`tuple(tokens[i:i+n])` sur `range(len(tokens) - n + 1)` est la fenêtre glissante : pour un document de 35 jetons et n=4, cela donne 32 fenêtres, chacune étant la tranche de 4 mots commençant à la position i. L'*ensemble* est délibéré, le vérificateur demande « quelles fenêtres existent ici ? », pas « combien de fois ? », et la sémantique d'ensemble est ce qui rend le recouvrement de Jaccard de l'Étape 3 une seule ligne.

**👟 Indice de départ :** Avant d'exécuter, prédis : pour 35 jetons et n=4 tu t'attends à `35 - 4 + 1 = 32` shingles. Vérifie que le comptage atterrit exactement là, puis essaie n=3 et sens l'ensemble *grossir*.

**🎯 Résultat attendu :** `35 tokens -> 32 shingles of size 4`, et les deux premiers shingles sont des 4-uplets comme `('the', 'kelp', 'forest', 'is')`.

**🩹 Si ça ne marche pas :** Si le compte est 35, ta fenêtre est `tokens[i:i+n]` sur `range(len(tokens))` sans le `- n + 1`, les trois dernières fenêtres sont des tranches courtes qui ne devraient pas exister ; le `- n + 1` est le off-by-one qui fait que chaque fenêtre fait exactement n mots. Si les shingles ressemblent à des chaînes plutôt qu'à des tuples, tu as enveloppé la tranche dans `tuple()` mais retourné une liste, les ensembles exigent des éléments hachables, et un ensemble de listes lève un `TypeError`.

### 2.2 Vérifie le shingling

**✅ Liste de vérification**

- ✅ Un doc de 35 jetons avec n=4 produit exactement 32 shingles ; n=3 en produit 33 ; n=35 en produit... 1. Exécute les trois et confirme le motif `len - n + 1`.
- ✅ Chaque shingle est un tuple d'exactement `n` mots, pas d'extrémités courtes, pas de doublons dans l'ensemble.
- ✅ Shingler deux fois le même document retourne des ensembles identiques, le déterminisme est le but.

**🤔 Question(s) socratique(s)**

- Nous stockons les 4-uplets complets, donc la mémoire croît avec `len(tokens) - n + 1`. Les vrais vérificateurs de plagiat ne stockent qu'un *hachage* de chaque shingle (un entier de 64 bits), que se casse-t-il si deux 4-uplets différents s'écrasent vers le même hachage, et pourquoi ce compromis en vaut-il la peine à l'échelle d'un corpus ?
- La taille de fenêtre n est le seul bouton libre de tout cet outil. Qu'est-ce qui change dans la sensibilité quand n diminue (n=2 : chevauchement insensé entre deux dissertations quelconques) contre quand n augmente (n=12 : seules les citations verbatim correspondent) ? Écris la phrase que tu t'attendrais à voir « capturée » à n=4 mais « manquée » à n=8.

## Étape 3 : Note la similarité entre deux documents

Deux documents sont « similaires » quand leurs ensembles de shingles se recouvrent fortement. La mesure standard est **Jaccard** : taille de l'intersection divisée par la taille de l'union, un nombre entre 0 et 1 identique que les deux documents soient courts ou longs, car l'union normalise la longueur. 1,0 est identique, 0,0 est une absence totale de fenêtre partagée.

### 3.1 Calcule le score de Jaccard

```python
# score.py
from shingle import shingles, N
from normalize import load_document

def jaccard(a: set, b: set) -> float:
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 1.0

def score_pair(path_a: str, path_b: str) -> float:
    return jaccard(shingles(load_document(path_a)), shingles(load_document(path_b)))

if __name__ == "__main__":
    print("ours vs ecology:", round(score_pair("submissions/essay_ours.txt",
                                               "sources/origin_ecology.txt"), 3))
    print("ours vs renewables:", round(score_pair("submissions/essay_ours.txt",
                                                  "sources/origin_renewables.txt"), 3))
    print("ours vs itself:", round(score_pair("submissions/essay_ours.txt",
                                              "submissions/essay_ours.txt"), 3))
```

`a & b` et `a | b` sont l'intersection et l'union d'ensembles, les opérateurs de Python se lisent exactement comme les mathématiques, et la garde `if union else 1.0` gère deux documents vides (les deux unions sont vides : définis ce cas limite comme « identique », sinon tu diviserais par zéro). Le coude de la courbe est le moment pédagogique : `essay_ours` partage ~9 shingles avec les ~40 d'ecology, tandis que le vocabulaire généraliste (« I would also argue that... ») partage zéro avec renewables.

**👟 Indice de départ :** Calcule `essay_ours` contre ecology *à la main* d'abord : compte les fenêtres de 4 mots partagées dans le chevauchement des deux premiers paragraphes, puis vérifie que l'outil a été d'accord à l'arrondi près.

**🎯 Résultat attendu :** `ours vs ecology: ≈0.31`, `ours vs renewables: 0.0` (aucune fenêtre partagée), `ours vs itself: 1.0`. Le score exact contre ecology se situe entre 0,25 et 0,4, au-dessus de zéro, loin en dessous de un, clairement *différent* du zéro de renewables.

**🩹 Si ça ne marche pas :** Si le score contre ecology est aussi 0,0, les deux tokenisations diffèrent quelque part, un trait d'union ou une apostrophe dans un fichier que l'autre n'a pas ; affiche les deux listes de jetons et fais leur diff (la correction est d'habitude un caractère dans le texte source). Si `ours vs itself` n'est pas 1,0, `jaccard` ne compare pas la même paire d'ensembles, vérifie que tu shingles le *même* fichier deux fois plutôt que deux chemins différents.

### 3.2 Vérifie la notation

**✅ Liste de vérification**

- ✅ `score_pair(essay_ours, origin_ecology)` ≈ 0,31, un recouvrement non trivial, loin de 1.
- ✅ `score_pair(essay_ours, origin_renewables)` == 0,0 exactement.
- ✅ `score_pair(x, x) == 1.0` pour n'importe quel document, le cas d'identité est la vérification de cohérence.
- ✅ Deux documents *totalement sans rapport* obtiennent exactement 0,0, et non un petit plancher de bruit positif.

**🤔 Question(s) socratique(s)**

- Jaccard divise par l'union, donc un *paragraphe copié enfoui dans une longue dissertation originale* obtient un score plus bas qu'une courte dissertation qui le copie en entier. Quelle direction est le « faux négatif », et quel dénominateur (indice : intersection ÷ la taille de *l'accusé*) un enseignant préférerait-il voir pour décider s'il faut lire de près ?
- L'identité « ours vs itself = 1.0 » est tautologiquement vraie pour des fichiers identiques. Mais un fichier réenregistré avec 100 lignes vides insérées a les *mêmes jetons* (la normalisation les efface), il obtient donc aussi 1,0. Cette sur-correspondance est-elle correcte pour un outil de plagiat, et que devrais-tu changer pour détecter les copies dont la mise en page a changé ?

## Étape 4 : Compare une dissertation contre tout le corpus

Noter une seule paire est la primitive ; signaler une soumission est le produit. Cette étape exécute une dissertation contre chaque document source, conserve le score de chaque paire, trie en ordre décroissant, et affiche un rapport classé, la boucle qui transforme `score_pair` en vérification de plagiat.

### 4.1 Classe chaque paire candidate

```python
# checker.py
from pathlib import Path
from score import jaccard
from shingle import shingles, N
from normalize import load_document

def check_against(essay: str, sources_dir: str) -> list[dict]:
    essay_sh = set(shingles(load_document(essay)))
    results = []
    for src in sorted(Path(sources_dir).glob("*.txt")):
        src_sh = set(shingles(load_document(str(src))))
        score = jaccard(essay_sh, src_sh)
        if score > 0:
            results.append({"source": src.name, "score": score})
    return sorted(results, key=lambda r: -r["score"])

if __name__ == "__main__":
    essay = "submissions/essay_ours.txt"
    for r in check_against(essay, "sources"):
        print(f"{r['score']:.3f}  {r['source']}")
```

Deux habitudes qui valent la peine d'être copiées : les documents sources sont **shinglés une fois chacun** (hors du travail par paire, pas de relecture ni de re-shingling trois fois), et l'ensemble de shingles de la dissertation est calculé *une fois* avant la boucle, pas à l'intérieur. La clé de tri `-r["score"]` est simplement le tri décroissant de Python, et le filtre `score > 0` garde le rapport lisible, les sources sans rapport restent hors de la liste classée au lieu de la charger de dizaines de lignes `0.000`.

**👟 Indice de départ :** Exécute-le pour `essay_ours`, la source ecology devrait être l'unique ligne, `0.31`. Puis exécute `check_against("submissions/essay_original.txt", "sources")` et confirme qu'il n'affiche rien du tout.

**🎯 Résultat attendu :** Pour `essay_ours.txt` : exactement une ligne `≈0.310  origin_ecology.txt`. Pour `essay_original.txt` : aucune sortie, la dissertation ne partage aucune fenêtre de 4 mots avec aucun source.

**🩹 Si ça ne marche pas :** Si les deux dissertations affichent `0.000`, ta dissertation a été tokenisée avec un libellé différent de ce que tu penses, affiche les jetons et compare-les au corpus (une apostrophe ou un trait d'union errant est le suspect habituel). Si `essay_original` affiche un score non nul, les deux *devraient* être zéro, lis le shingle partagé : tu as probablement réutilisé une phrase de l'énoncé, et l'outil a déjà trouvé une correspondance réelle (si innocente).

### 4.2 Vérifie la vérification de corpus

**✅ Liste de vérification**

- ✅ `essay_ours` classe `origin_ecology` en premier (et seul) à ≈0,31.
- ✅ `essay_original` ne correspond à rien, sortie propre, rapport vide.
- ✅ L'ordre du dossier source sur le disque n'affecte pas l'ordre de sortie, le classement se fait par score, calculé par `key=lambda r: -r["score"]`.
- ✅ Chaque source a été shinglée une fois, pas une fois par dissertation, la structure de la boucle le garantit.

**🤔 Question(s) socratique(s)**

- Le rapport n'affiche que les lignes `score > 0`. Qu'est-ce qui est perdu en cachant les zéros, plus précisément, pourrais-tu toujours *défendre* une conclusion de 0,0 si l'outil a simplement omis la ligne ? Qu'est-ce qu'un rapport qui liste toujours chaque source (avec scores) ferait mieux ?
- `check_against` shingle chaque source tout en l'itérant, c'est « paresseux » et très bien à l'échelle d'un corpus, mais un `check_all(corpus_dir)` qui précalcule un dictionnaire `name → shingle set` est la forme qu'utilise un vrai vérificateur. Nomme la propriété concrète de vitesse ou de correction que la précomputation achète (indice : rien ici, mais un corpus croissant change la structure de la boucle).

## Étape 5 : Signale les paires suspectes et montre la preuve

Une liste de scores classée est un résultat ; **les phrases de recouvrement sont la preuve**, la différence entre « fais-moi confiance, 0,31 » et « voici les trois phrases qu'il a copiées ». Cette étape affiche, pour chaque paire signalée, les fenêtres réellement partagées qui ont produit le score, pour qu'un enseignant puisse *vérifier* le chiffre avant d'agir dessus.

### 5.1 Affiche les fenêtres correspondantes

```python
# evidence.py
from pathlib import Path
from shingle import shingles, N
from normalize import load_document
from score import jaccard

THRESHOLD = 0.25

def evidence(essay: str, sources_dir: str) -> None:
    essay_sh = set(shingles(load_document(essay)))
    for src in sorted(Path(sources_dir).glob("*.txt")):
        src_sh = set(shingles(load_document(str(src))))
        score = jaccard(essay_sh, src_sh)
        if score < THRESHOLD:
            continue
        shared = essay_sh & src_sh
        print(f"\n{essay}  vs  {src.name}  score={score:.3f}  ({len(shared)} shared windows)")
        for sh in sorted(shared)[:5]:
            print("   " + " ".join(sh))

if __name__ == "__main__":
    evidence("submissions/essay_ours.txt", "sources")
```

La ligne `shared = essay_sh & src_sh` est le plat de résistance : la même intersection qui a produit le score est aussi la liste des preuves, donc le chiffre du rapport et ses citations ne peuvent jamais se contredire, ce sont littéralement le même ensemble. Le plafond `sorted(shared)[:5]` (une poignée d'exemples, pas chaque fenêtre) garde la sortie parcourable tandis que le compte `len(shared)` reste honnête dans l'en-tête.

**👟 Indice de départ :** Exécute-le, puis lis à voix haute les fenêtres imprimées de 4 mots, chacune devrait être une *phrase* véritable de ta dissertation qui existe aussi dans le source, pas une suite fortuite de mots vides du genre « the kelp forest is ».

**🎯 Résultat attendu :** Un en-tête pour `grass_ours vs origin_ecology.txt` à ≈0,31 avec le compte de fenêtres partagées, suivi de fenêtres d'exemple triées, les premières étant des variantes de `the kelp forest is a`, `otters control the urchin`, `urchins strip the kelp to`, et *aucune sortie pour les deux autres sources*.

**🩹 Si ça ne marche pas :** Si rien ne s'affiche alors que l'Étape 4 montrait 0,31, `THRESHOLD = 0.25` est au-dessus du score, abaisse la constante, ne supprime pas la garde ; la garde est ce qui garde le rapport honnête. Si les fenêtres incluent `is a foundation of` (une phrase générique), c'est une vraie correspondance, les vrais vérificateurs de plagiat filtrent les fenêtres riches en mots vides de la même façon que tu apprendrais à les lire avec esprit critique.

### 5.2 Vérifie le rapport de preuves

**✅ Liste de vérification**

- ✅ Chaque paire signalée affiche le score plus un compte de fenêtres partagées plus des phrases d'exemple lisibles.
- ✅ Les phrases affichées sont de véritables recouvrements que tu peux vérifier à l'œil dans les deux fichiers.
- ✅ Les paires sous `THRESHOLD` n'apparaissent jamais, et le seuil est une constante nommée, pas un nombre magique.
- ✅ Le score dans l'en-tête correspond exactement au chiffre de l'Étape 4 pour la même paire, l'intersection est le même ensemble aux deux fois.

**🤔 Question(s) socratique(s)**

- Nous affichons les 5 premières fenêtres triées comme exemples. Et si la fenêtre *la plus accablante* était la 31e ? Quel est le changement (trier par autre chose que l'alphabet, ou rapporter la *plus longue* suite de fenêtres de recouvrement) qui ferait remonter la preuve la plus forte en premier ?
- `THRESHOLD` décide qui est désigné. Deux humains avec le même outil pourraient choisir 0,2 et 0,3. Qu'est-ce que l'affichage des preuves apporte qui permette à un *enseignant* d'outrepasser le seuil, et « signale tout, laisse les preuves arbitrer » est-il un design alternatif défendable ?

## ⚠️ Pièges courants

- **Le problème de sur-correspondance « the/a/of ».** À n=2 ou n=3, chaque paire de dissertations anglaises partage des shingles faits de purs mots vides (« the kelp », « is a »), et le score revendique une similarité qui n'existe pas. Le noyau de la correction est soit un n plus grand (4+ pour la prose), soit la suppression des shingles dont tous les mots sont dans un ensemble de mots vides avant l'intersection.
- **La dérive de normalisation entre fichiers.** Un fichier dit « self-organized », l'autre « self organized » ; un utilise les guillemets courbes « ’ », l'autre de l'ASCII. Le vérificateur voit alors *des jetons différents* et rate une copie évidente. Normalise les deux côtés avec le même tokeniseur, *et* normalise le corpus une fois (stocke les listes de jetons), pour que les deux ne divergent jamais en cours d'exécution.
- **Le off-by-one dans la fenêtre glissante.** `range(len(tokens) - n + 1)` est impitoyable : oublie le `- n + 1` et les dernières fenêtres sont des tranches courtes qui ne correspondent à rien et abaissent silencieusement chaque score. Teste le compte (Étape 2.2) avant de te fier à n'importe quel chiffre en aval.
- **Le paragraphe copié noyé dans une longue dissertation.** L'union de Jaccard moyenne tout ce que le source *et* la dissertation ont, donc un paragraphe verbatim à 40 % à l'intérieur d'une longue dissertation originale peut obtenir 0,15 et passer sous n'importe quel seuil raisonnable. Rapporte *à la fois* Jaccard et le `shared_window_count` brut, le compte est le signal « va le lire » le plus fort.
- **Oublier que le seuil est un jugement, pas une loi.** Un score de 0,24 et 0,26 sont le même cas ; un seuil de 0,25 est une ligne tracée par des humains, pas un oracle. Le travail de l'outil est de *classer et montrer la preuve*, et celui de l'enseignant de juger, l'affichage des preuves (Étape 5) existe précisément pour que l'outil n'ait jamais à prétendre à une autorité qu'il n'a pas.

## Ce que tu viens de construire

Un vérificateur de plagiat fonctionnel : tokeniseur, shingler, scoreur de Jaccard, rapport à l'échelle du corpus, et un affichage de preuves qui montre les phrases exactes derrière chaque score. La dissertation copiée s'allume à 0,31 ; la dissertation originale obtient un zéro plat ; et *toi*, tu peux reproduire chaque chiffre à la main, car tout l'algorithme est de l'arithmétique d'ensembles sur des mots. La compétence transférable est le shingling lui-même, l'idée de l'« empreinte de fenêtre qui se chevauche » se trouve sous la détection de plagiat, la déduplication web des quasi-doublons, la comparaison floue de fichiers, et les références de la plupart des systèmes de recherche sémantique, et tu peux désormais construire toute la chaîne depuis le texte brut au lieu d'importer le `similarity_score` de quelqu'un d'autre.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/plagiarism-checker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/plagiarism-checker) dans le dépôt du cours regroupe les modules tokeniseur, shingler, scoreur, vérificateur et preuves, plus le corpus d'exemple et un notebook qui exécute chaque étape dans l'ordre. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et note les dissertations fournies dans un onglet de navigateur.
:::

## Où aller à partir d'ici

- **Groupement flou de suspects :** exécute chaque document contre chaque autre (dissertation contre dissertation, pas seulement dissertation contre source) et affiche « cette paire d'élèves partage 0,4 », la boucle de l'Étape 4, croisée avec elle-même, avec un `if` qui saute chaque document contre lui-même.
- **Preuve normalisée par la longueur :** rapporte `shared_count / len(essay_shingles)` comme l'angle « quelle part de *ta* dissertation est copiée », le changement de dénominateur que j'ai esquissé à l'Étape 3, et le chiffre qu'un enseignant lit réellement en premier.
- **Un drapeau `--min-shared-windows`** qui signale sur le compte de recouvrement brut plutôt que sur le ratio, pour qu'une seule copie d'une demi-page dans un source énorme remonte toujours, la correction durable du piège du « paragraphe noyé ».
- **Passe sur un vrai bruit de démarrage :** exécute le vérificateur sur un dossier de *notes de lecture* que tu as écrites pour deux cours, et prépare-toi à la surprise honnête, ta propre paraphrase d'un source obtient 0,2+. Ce n'est pas un bug ; c'est l'outil qui mesure correctement ce que « se souvenir d'un source » veut dire.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier, un vérificateur qui a attrapé un vrai recouvrement, un rapport de preuves auquel tu te fierais ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README t'accompagne dans l'ajout du tien via une **pull request** de bout en bout : forker, créer une branche, commiter, et ouvrir la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
