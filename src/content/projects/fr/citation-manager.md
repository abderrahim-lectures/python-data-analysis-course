---
title: "Gestionnaire de Citations"
description: "Gérez des bibliographies avec formatage automatique des citations en APA, MLA, Chicago et BibTeX."
difficulty: "intermediate"
estimatedMinutes: 75
xpReward: 100
tags: ["Science", "Productivity", "Utility"]
prerequisites:
  - "Dictionnaires imbriqués et méthodes de chaînes"
  - "Les ensembles (sets) et les compréhensions de listes"
  - "Lire et écrire des fichiers JSON"
learningObjectives:
  - "Modéliser une bibliographie comme un dict d'entrées à clés stables"
  - "Formater les entrées en texte APA cohérent avec une seule fonction"
  - "Rechercher à travers auteurs, titres et revues avec la correspondance de sous-chaînes"
  - "Trouver les références manquantes et inutilisées avec la différence d'ensembles"
  - "Détecter les quasi-doublons par titre normalisé et générer une section Références triée"
---

# 🛠️ 📚 Construire un Gestionnaire de Citations

Les articles ne s'écrivent pas tout seuls — mais la bibliographie peut presque s'en charger. Ce projet construit un petit **gestionnaire de citations** : une bibliothèque d'entrées bibliographiques (clé → auteur/titre/année/revue/type), un formateur qui transforme n'importe quelle entrée en une ligne APA cohérente, une recherche qui fonctionne à travers auteurs, titres et revues, un vérificateur *manquante-et-inutilisée* construit sur la différence d'ensembles qui trouve les erreurs de liste de références avant qu'un relecteur ne le fasse, une détection de quasi-doublons qui attrape le même livre saisi deux fois avec une casse différente, des comptes par type, et un générateur final qui trie toute la bibliothèque par année-et-auteur et écrit une section `References` plus une sauvegarde JSON. Tout est déterministe — de petites données choisies à la main, aucun aléatoire, uniquement la bibliothèque standard.

Cela suppose les dicts imbriqués, les ensembles, les compréhensions et le JSON de base. C'est un projet facultatif et non noté — consulte [Projets du monde réel](/fr/projets) pour la liste complète et grandissante. Un seul fichier, uniquement la bibliothèque standard.

## 🎯 Ce que tu vas faire

1. Construire la bibliothèque de citations et un formateur APA.
2. Rechercher dans la bibliothèque à travers auteur, titre et revue.
3. Vérifier les citations dans le texte d'un manuscrit pour les clés manquantes et inutilisées.
4. Détecter les entrées quasi-dupliquées et compter les types.
5. Générer une section Références triée par année-et-auteur et la persister en JSON.

## Où exécuter ceci

Partout où tourne Python 3.10+ — localement, Colab, Kaggle ou Binder. Tout le projet est `json` + des builtins, donc rien à installer et aucune différence d'environnement.

```bash
mkdir citation-manager && cd citation-manager
touch citations.py
```

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/citation-manager/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/citation-manager/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcitation-manager%2Fnotebook.fr.ipynb)

## Configuration

Zéro dépendance : confirme simplement l'interpréteur et crée le fichier.

### Vérifie l'environnement

```bash
python3 --version
```

**✅ Liste de vérification**

- ✅ `python3 --version` affiche 3.10+.
- ✅ `citations.py` existe ; `import json` et `import itertools` fonctionnent.
- ✅ Aucun `pip install` — c'est la bibliothèque standard qui fait le travail.

**🤔 Question(s) socratique(s)**

- Une bibliographie est une *correspondance* : tu cites `[knuth1984]` dans le texte et la section Références l'étend. Où dans ce projet le dict est-il la bonne forme, et où une simple liste perdrait-elle de l'information ?
- Le gestionnaire formate lui-même les entrées. Pourquoi une *unique* fonction de formatage est-elle meilleure que de rédiger à la main chaque ligne de référence — et quel risque cette abstraction introduit-elle quand une revue change de style en cours de projet ?

## Étape 1 : La bibliothèque de citations

Commence par le modèle de données : un dict dont les clés sont des poignées de citation (`shannon1948`) et dont les valeurs sont des dicts d'entrées.

### 1.1 Les entrées

**👟 Indice de départ :** Un dict de six entrées, chacune avec `authors`, `title`, `year`, `venue`, `type`.

```python
# citations.py
import json
import itertools

bib = {
    "knuth1984": {"authors": "Donald E. Knuth", "title": "The TeXbook",
                  "year": 1984, "venue": "Addison-Wesley", "type": "book"},
    "turing1950": {"authors": "Alan M. Turing", "title": "Computing machinery and intelligence",
                   "year": 1950, "venue": "Mind 59 (236)", "type": "article"},
    "shannon1948": {"authors": "Claude E. Shannon", "title": "A mathematical theory of communication",
                    "year": 1948, "venue": "Bell System Technical Journal", "type": "article"},
    "hopper1978": {"authors": "Grace M. Hopper", "title": "The education of a computer",
                   "year": 1978, "venue": "IEEE Transactions on Computers", "type": "article"},
    "ritchie1974": {"authors": "Dennis M. Ritchie; Ken Thompson", "title": "The UNIX time-sharing system",
                    "year": 1974, "venue": "Communications of the ACM", "type": "article"},
    "lamport1994": {"authors": "Leslie Lamport", "title": "LaTeX: A Document Preparation System",
                    "year": 1994, "venue": "Addison-Wesley", "type": "book"},
}
```

Le handle est la façon dont le manuscrit cite une source ; l'entrée porte les faits bibliographiques. Cette séparation — *clé stable* contre *données mutables* — est ce qui évite qu'un re-formatage ou une recherche casse chaque citation du texte.

**🎯 Résultat attendu :** Rien pour l'instant — des données seulement. Vérifie la forme : les six entrées ont les cinq mêmes champs.

**🩹 Si ça ne marche pas :** Un `venue` manquant sur une entrée ne plantera pas *ici* mais se formatera plus tard comme `None` — revois les dicts avant de continuer.

### 1.2 Un formateur, toutes les entrées

**👟 Indice de départ :** `format_apa(entry)` → `"{authors} ({year}). {title}. {venue}."`, en boucle sur `bib`.

```python
# citations.py (continued)
def format_apa(entry):
    return f"{entry['authors']} ({entry['year']}). {entry['title']}. {entry['venue']}."

for key, entry in bib.items():
    print(f"[{key:>10}] {format_apa(entry)}")
```

Chaque citation devient exactement une ligne issue d'une seule fonction. Change le style (APA → MLA) à un seul endroit et toute la bibliographie suit.

**🎯 Résultat attendu :**

```
[ knuth1984] Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
[turing1950] Alan M. Turing (1950). Computing machinery and intelligence. Mind 59 (236).
[shannon1948] Claude E. Shannon (1948). A mathematical theory of communication. Bell System Technical Journal.
[hopper1978] Grace M. Hopper (1978). The education of a computer. IEEE Transactions on Computers.
[ritchie1974] Dennis M. Ritchie; Ken Thompson (1974). The UNIX time-sharing system. Communications of the ACM.
[lamport1994] Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 Si ça ne marche pas :** Si l'ordre affiché est alphabétique au lieu de l'ordre d'insertion, aucun tri n'a lieu pour l'instant — c'est l'ordre d'insertion (l'ordre des lignes du dict). Si une ligne affiche `None`, cette entrée a un couplage de `venue` manquant.

### 1.3 Vérifie la bibliothèque

**✅ Liste de vérification**

- ✅ Six entrées, chacune avec `authors`, `title`, `year`, `venue`, `type`.
- ✅ Trois tours en six lignes formatées — une fonction, cinq champs, aucune duplication.
- ✅ Les handles sont des identifiants stables ; les données peuvent changer sans casser les citations.

**🤔 Question(s) socratique(s)**

- `format_apa` affiche l'année entre parenthèses *dans* la chaîne avec `(entry['year'])`. Qu'est-ce qui casserait si `year` était un entier à chaque fois *sauf* pour une entrée stockée comme chaîne `"1984"` ? Conçois un seul cast qui répare toutes les entrées.
- Les œuvres à deux auteurs sont stockées comme `"Dennis M. Ritchie; Ken Thompson"` — une chaîne avec un séparateur. Où cette convention de division commence-t-elle à transparaître à travers le formateur, et qu'est-ce qu'un modèle `authors: [list]` correct t'apporterait-il ?

## Étape 2 : Recherche dans la bibliothèque

Trouve une citation en ne sachant que *quelque chose* sur elle — un auteur, un mot du titre, une revue, une année.

### 2.1 La recherche par sous-chaîne

**👟 Indice de départ :** `search(query)` retourne chaque clé dont l'entrée contient la requête (insensible à la casse) dans l'auteur, le titre, la revue, ou exactement l'année.

```python
# citations.py (continued)
def search(query):
    q = query.casefold()
    hits = []
    for key, entry in bib.items():
        haystack = " ".join([
            entry["authors"], entry["title"], entry["venue"],
            str(entry["year"])]).casefold()
        if q in haystack:
            hits.append(key)
    return hits

print("search('turing')      ->", search("turing"))
print("search('addison')     ->", search("addison"))
print("search('1984')        ->", search("1984"))
```

Joindre tous les champs en une seule botte de foin en minuscules signifie qu'un seul test de sous-chaîne couvre chaque champ avec une ligne de logique — la requête apparaît dans *n'importe* quel champ et elle correspond. La réduction de casse rend `unix` égal à `UNIX`.

**🎯 Résultat attendu :**

```
search('turing')      -> ['turing1950']
search('addison')     -> ['knuth1984', 'lamport1994']
search('1984')        -> ['knuth1984']
```

**🩹 Si ça ne marche pas :** Si `search('UNIX')` retourne `[]`, `casefold()` n'a été appliqué qu'à la requête. Si `search('1984')` correspond à un titre contenant « 1984 » *et* à la vraie année, la botte de foin joint les champs par chaîne — décide si l'année doit correspondre exactement ou comme sous-chaîne (ici : sous-chaîne).

### 2.2 Comprends les résultats

**👟 Indice de départ :** Affiche les lignes APA pour les résultats d'une requête.

```python
# citations.py (continued)
for key in search("addison"):
    print(f"[{key:>10}] {format_apa(bib[key])}")
```

`search('addison')` retournant deux résultats est un moment pédagogique : « Addison » est un *éditeur*, et il apparaît dans le champ `venue` des deux livres. Une recherche par mots-clés ne peut pas distinguer l'auteur de l'éditeur de l'année — elle trouve simplement du texte.

**🎯 Résultat attendu :**

```
[ knuth1984] Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
[lamport1994] Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 Si ça ne marche pas :** Si la boucle imprime plus ou moins de lignes que ce que `search` a rapporté, la fonction de recherche et cette boucle diffèrent — réutilise `search`, ne retape pas sa logique.

### 2.3 Vérifie la recherche

**✅ Liste de vérification**

- ✅ Correspondances insensibles à la casse à travers l'auteur, le titre et la revue.
- ✅ `search('addison')` → deux livres (correspondance sur l'éditeur), `search('1984')` → Knuth uniquement.
- ✅ La recherche est une fonction pure de `bibliography` + la requête — même bibliothèque, mêmes résultats.

**🤔 Question(s) socratique(s)**

- La requête est une *sous-chaîne* : `'a'` correspond à presque tout, `'e'` encore plus. Quel genre de corpus rendrait la correspondance plein-texte inutile, et quelle mise à niveau en deux commandes (par ex. `author:knuth` limité au champ) y remédierait ?
- Joindre les champs en une seule botte de foin perd *où* la correspondance a eu lieu. Comment étendrais-tu `search` pour retourner des paires `(key, field)` — et pourquoi un gestionnaire de bibliographie voudrait-il rapporter « trouvé dans la revue » plutôt que « trouvé dans le titre » ?

## Étape 3 : Vérifie chaque citation dans le texte

La liste de références doit contenir chaque œuvre citée, et aucune œuvre citée ne doit manquer à la bibliothèque. L'arithmétique sur les ensembles fait cela en deux lignes.

### 3.1 Manquantes et inutilisées

**👟 Indice de départ :** Un manuscrit cite `in_text` ; calcule `missing = cited − stored` et `unused = stored − cited`.

```python
# citations.py (continued)
in_text = ["knuth1984", "turing1950", "shannon1948", "hopper1978",
           "lamport1994", "smith2021"]

missing = sorted(set(in_text) - set(bib))
unused = sorted(set(bib) - set(in_text))
print("MISSING (cited but no entry) :", missing)
print("UNUSED  (stored but not cited):", unused)
```

`set(in_text) - set(bib)` est « les citations sans foyer » — `smith2021` est dans le texte mais pas dans la bibliothèque. `set(bib) - set(in_text)` est « les entrées stockées jamais mentionnées » — `ritchie1974` siège dans la bibliothèque mais aucune phrase ne le cite. Ces ensembles te font re-vérifier à la manière socratique : une ligne dans chaque sens, et la découverte préférée du relecteur (une référence manquante) saute aux yeux.

**🎯 Résultat attendu :**

```
MISSING (cited but no entry) : ['smith2021']
UNUSED  (stored but not cited): ['ritchie1974']
```

**🩹 Si ça ne marche pas :** Si `missing` et `unused` sont échangés, l'ordre de soustraction a été inversé — le premier opérande est « ce qu'on a », le second « ce qu'on veut ». Si `smith2021` n'apparaît pas, la liste du manuscrit et la bibliothèque utilisent des handles incohérents (coquilles) — normalise les clés avant de faire la différence.

### 3.2 Le correctif

**👟 Indice de départ :** Ajoute l'entrée manquante, puis re-vérifie que les deux directions rapportent vide.

```python
# citations.py (continued)
bib["smith2021"] = {
    "authors": "Barbara J. Smith", "title": "Design patterns for tiny data pipelines",
    "year": 2021, "venue": "Journal of Small Systems", "type": "article"}

missing = sorted(set(in_text) - set(bib))
unused = sorted(set(bib) - set(in_text))
print("MISSING after fix :", missing)
print("UNUSED  after fix :", unused)
```

Ajouter l'entrée rééquilibre les ensembles : `smith2021` se résout maintenant, donc `missing` est vide. `ritchie1974` reste inutilisé — un vrai constat : la bibliothèque détient une source que le manuscrit ne mentionne jamais (cite-la correctement ou retire-la).

**🎯 Résultat attendu :**

```
MISSING after fix : []
UNUSED  after fix : ['ritchie1974']
```

**🩹 Si ça ne marche pas :** Si `UNUSED` liste encore `smith2021`, la clé de l'entrée et le handle dans le texte diffèrent par la casse ou les espaces — fais partager une normalisation à `set(in_text)` et `set(bib)`. Si le correctif a silencieusement avalé l'ancien `missing`, l'affectation `bib["smith2021"]` a atterri après la re-vérification (ordre !).

### 3.3 Vérifie le vérificateur

**✅ Liste de vérification**

- ✅ Manquante (smith2021) et inutilisée (ritchie1974) trouvées en une différence chacune.
- ✅ Après l'enregistrement de smith2021, `missing` est vide et `unused` est juste `['ritchie1974']`.
- ✅ `missing`/`unused` ne se chevauchent jamais — un bug de disposition (comme faire la différence de deux copies de `bib`) est impossible une fois les ensembles distincts.

**🤔 Question(s) socratique(s)**

- L'ordre de `set` est arbitraire pour une liste de chaînes ; tu as trié les deux résultats. Pourquoi *trier* le rapport compte-t-il pour un lecteur humain, et où une sortie triée induirait-elle réellement en erreur (par ex. trier par année de découverte, pas par handle) ?
- « Entrée inutilisée » peut signifier « pas encore citée » ou « vieillisserie obsolète ». Quel effet de bord une entrée inutilisée *supprimée* aurait-elle sur la prochaine exécution — et pourquoi un avertissement de style lint (jamais de suppression automatique) est-il le comportement d'outil le plus sûr ?

## Étape 4 : Nettoie les doublons et compte les types

Les listes de références doublent silencieusement — le même livre saisi deux fois avec des champs légèrement différents. L'Étape 4 normalise les titres pour l'attraper et compte les types.

### 4.1 Un quasi-doublon

**👟 Indice de départ :** Fournis à la bibliothèque un livre qui existe déjà sous un second handle avec une casse/édition différente.

```python
# citations.py (continued)
duplicates = {
    "lamport1994": {"authors": "Leslie Lamport", "title": "LaTeX: A Document Preparation System",
                    "year": 1994, "venue": "Addison-Wesley", "type": "book"},
    "lamport94": {"authors": "L. Lamport", "title": "LaTeX: a document preparation system",
                  "year": 1994, "venue": "Addison-Wesley Pub.", "type": "book"},
}

def norm_title(title):
    return " ".join(title.casefold().split())

dups = []
for a, b in itertools.combinations(duplicates, 2):
    if norm_title(duplicates[a]["title"]) == norm_title(duplicates[b]["title"]):
        dups.append((a, b))
print("NEAR-DUPLICATES:", dups)
```

`norm_title` normalise les espaces et réduit la casse d'un titre — `"LaTeX: A Document Preparation System"` et `"LaTeX: a document preparation system"` deviennent la même chaîne, donc les deux handles sont signalés comme une seule œuvre. Un test d'égalité brut manquerait cela à cause de la différence de casse ; la normalisation est ce qui transforme le « quasi » en « identique ».

**🎯 Résultat attendu :** `NEAR-DUPLICATES: [('lamport1994', 'lamport94')]`

**🩹 Si ça ne marche pas :** Si aucune paire n'est signalée, le normalisateur n'a pas tourné (compare les titres bruts — la casse diffère). Si *plus* d'une paire est signalée, `itertools.combinations(…, 2)` a itéré sur une bibliothèque qui contient déjà les doublons — teste sur le petit dict `duplicates`, pas sur `bib`.

### 4.2 Compte les types

**👟 Indice de départ :** Compte les entrées par `type` avec un dict-comme-histogramme.

```python
# citations.py (continued)
types = {}
for entry in bib.values():
    types[entry["type"]] = types.get(entry["type"], 0) + 1
print("BY TYPE:", types)
```

Un histogramme de types est un inventaire d'une ligne : combien d'articles contre combien de livres composent ta section méthodes. `get(type, 0) + 1` est l'idiome du compteur que tu as vu dans le suivi d'empreinte carbone — la première apparition démarre à zéro.

**🎯 Résultat attendu :** `BY TYPE: {'book': 2, 'article': 4}`

**🩹 Si ça ne marche pas :** Si les livres totalisent 3, une entrée dupliquée s'est glissée dans `bib` — précisément le problème que l'Étape 4 existe pour attraper. Si le compte est constant (`{'book': 1}`), la boucle met à jour la même clé à chaque passage au lieu de le faire par entrée.

### 4.3 Vérifie le nettoyage

**✅ Liste de vérification**

- ✅ `lamport1994` contre `lamport94` signalés comme quasi-doublons par titre normalisé.
- ✅ Histogramme des types `{'book': 2, 'article': 4}`.
- ✅ La normalisation (réduction de casse + espaces) est la *raison* pour laquelle les paires et les totaux par type concordent.

**🤔 Question(s) socratique(s)**

- `norm_title` plie la casse et les espaces mais pas la ponctuation — `"The UNIX Operating System"` contre `"The UNIX Operating System."` ne correspondrait PAS. Quels deux normalisateurs les feraient correspondre, et quel couple de « faux amis » fusionneraient-ils alors à tort ?
- L'année ne fait pas partie de la vérification de doublons. Deux *éditions* différentes d'un livre sont réellement des entrées distinctes, et pourtant elles auraient des titres quasi identiques. Comment laisserais-tu « même titre, année différente » passer — et quand une *nouvelle édition* devrait-elle remplacer automatiquement l'ancienne ?

## Étape 5 : Génère la section Références

Le livrable : une liste de références triée à l'écran, dans un fichier, et une sauvegarde JSON de la bibliothèque.

### 5.1 Trie par année, puis par auteur

**👟 Indice de départ :** `sorted(bib, key=lambda k: (bib[k]["year"], bib[k]["authors"].casefold()))`, numéroté.

```python
# citations.py (continued)
order = sorted(bib, key=lambda k: (bib[k]["year"], bib[k]["authors"].casefold()))
for i, key in enumerate(order, start=1):
    print(f"{i:>2}. {format_apa(bib[key])}")
```

Trier par `year` d'abord, auteur ensuite, imite l'ordre d'une liste de références typique (chronologique, égalités départagées alphabétiquement). La clé stable survit au tri — les entrées ne sont jamais copiées hors de leur place.

**🎯 Résultat attendu :**

```
 1. Claude E. Shannon (1948). A mathematical theory of communication. Bell System Technical Journal.
 2. Alan M. Turing (1950). Computing machinery and intelligence. Mind 59 (236).
 3. Dennis M. Ritchie; Ken Thompson (1974). The UNIX time-sharing system. Communications of the ACM.
 4. Grace M. Hopper (1978). The education of a computer. IEEE Transactions on Computers.
 5. Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
 6. Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 Si ça ne marche pas :** Si les dates posent problème (1948 après 1984), `year` a été trié comme une *chaîne* — caste en entier ou compare numériquement. Si les auteurs au sein d'une même année diffèrent, le départage sur `authors.casefold()` n'a pas tourné.

### 5.2 Persiste et recharge

**👟 Indice de départ :** Écris les lignes de références dans `references.txt` et la bibliothèque dans `bib.json`, puis recharge la bibliothèque et prouve que `len` et les clés survivent.

```python
# citations.py (continued)
with open("references.txt", "w") as f:
    for key in order:
        f.write(format_apa(bib[key]) + "\n")

with open("bib.json", "w") as f:
    json.dump(bib, f, indent=2)

loaded = json.load(open("bib.json"))
print("bib.json round-trip:", len(loaded), "entries,",
      "keys match" if sorted(loaded) == sorted(bib) else "KEYS MISMATCH")
```

`references.txt` est le livrable humain (une section Références en texte brut). `bib.json` est le livrable machine — toute la bibliothèque sérialisée pour que la session suivante puisse la recharger inchangée au lieu de retaper les entrées. JSON transforme le dict imbriqué en texte portable et inversement.

**🎯 Résultat attendu :**

```
bib.json round-trip: 7 entries, keys match
```

…et `references.txt` contenant les six lignes triées de 5.1 — plus `bib.json` restauré avec 7 entrées (les six d'origine et `smith2021`).

**🩹 Si ça ne marche pas :** Si l'aller-retour rapporte moins d'entrées, JSON a silencieusement laissé tomber une entrée dont la valeur n'était pas sérialisable en JSON (par ex. un `datetime`). Si `keys match` affiche une discordance, les clés rechargées diffèrent en ordre ou en orthographe — compare comme des ensembles ; l'ordre dans un objet JSON est conservé en pratique mais jamais garanti.

### 5.3 Vérifie le livrable

**✅ Liste de vérification**

- ✅ Liste de références triée par année, puis auteur — Shannon 1948 en premier, Lamport 1994 en dernier.
- ✅ `references.txt` a 6 lignes propres ; `bib.json` se recharge en 7 entrées avec des clés correspondantes.
- ✅ Le même `format_apa` a produit chaque ligne — écran, fichier et JSON ne sont jamais en désaccord.

**🤔 Question(s) socratique(s)**

- La section Références trie chronologiquement — mais beaucoup de revues trient *alphabétiquement* par auteur. Quelle ligne unique basculerait la politique en alphabétique, et pourquoi le *formateur* reste-t-il intouché dans les deux cas ?
- `json.dump(bib, f, indent=2)` ne réordonne rien mais le fichier grossit. Les allers-retours qui partagent `sorted(…) == sorted(…)` masquent l'ordre ; comment horodaterais-tu une version de `bib.json` (par ex. un champ `"schema": 2`) pour qu'un futur chargement puisse rejeter proprement un fichier incompatible ?

## ⚠️ Pièges courants

- **Clés contre données.** Le handle identifie l'œuvre ; l'entrée la décrit. Éditer la *clé* lors d'un renommage casse les citations dans le texte ; éditer les *champs* ne les casse jamais. Garde les clés stables.
- **La casse dans la correspondance.** `search` et `norm_title` doivent tous deux `casefold()`. Un `in` brut sur des titres à casse mixte manque chaque quasi-doublon et la moitié de tes recherches.
- **Trié contre ordre d'insertion.** L'ordre d'insertion du `dict` est agréable mais ce n'est pas une *politique* ; la section Références trie explicitement par `(year, author)`. Ne compte pas sur l'ordre du dict pour être le tri.
- **Les différences d'ensembles dans le bon sens.** `set(in_text) - set(bib)` = cité-mais-non-stocké (manquant), l'inverse = inutilisé. Un sens inversé et tu rapportes des entrées fantômes au lieu des manquantes.
- **Les années-chaînes se trient mal.** `"1978" < "1948"` comme *chaînes* est `False` — caste les années en `int` (ou complète) avant de trier chronologiquement.
- **Les quasi-doublons ont besoin d'un bassin de comparaison.** Vérifier chaque entrée contre une « liste de titres connus » écrite à la main manque les paires *au sein de* la bibliothèque — utilise `itertools.combinations(keys, 2)` sur les titres stockés.

## Ce que tu viens de construire

Un gestionnaire de citations qui va des faits bibliographiques bruts à une liste de références à l'épreuve des relecteurs : une bibliothèque dict-de-dicts avec des handles stables, une fonction `format_apa` unique qui possède le style, une recherche par sous-chaîne multi-champs, un contrôle de santé par différence d'ensembles en deux lignes qui trouve les citations manquantes et inutilisées avant un humain, une détection de doublons par titre normalisé, un histogramme de types, et un générateur trié par année/auteur qui écrit à la fois un fichier de `References` humain et une sauvegarde JSON. Les idées s'étendent bien au-delà des bibliographies : **garde des identifiants stables séparés des enregistrements mutables** ; **laisse un seul formateur posséder chaque rendu** ; **normalise avant de comparer** ; et **fais du contrôle de santé une différence d'ensembles** — les mêmes trois motifs font tourner les annuaires d'employés, les manifests de paquets et les caches de traduction.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/citation-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/citation-manager) dans le dépôt du cours contient le gestionnaire complet comme notebook — bibliothèque, formateur, recherche, vérifications manquantes/inutilisées, déduplication, et les Références triées + l'aller-retour JSON, exécutables dans Colab/Kaggle/Binder. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Charge un vrai fichier BibTeX `.bib` au lieu de taper les entrées — parse les lignes `@article{key, field = value}` et nourris-en `bib`.
- Ajoute une recherche limitée au champ (`author:knuth`, `year:1974`) retournant des paires `(key, field)` au lieu d'une botte de foin jointe.
- Implémente « conversion en MLA » : un second formateur et un paramètre `style` sur `format_apa` — preuve que la décision de style est isolée à un seul endroit.
- Classe les revues : crée un histogramme des valeurs `venue` et fais émerger vers quels supports tes références penchent.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier·e ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README contient un tutoriel complet, accessible aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, étape par étape. Aucune expérience git préalable n'est requise.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓