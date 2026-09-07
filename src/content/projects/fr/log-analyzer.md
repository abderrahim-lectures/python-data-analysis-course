---
title: "Analyseur et Visualiseur de Logs"
description: "Parser, rechercher et visualiser les logs d'application avec détection de schémas et règles d'alerte."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "data-viz", "regex", "file-io"]
learningObjectives:
  - "Analyser des lignes de log hétérogènes en dictionnaires Python structurés"
  - "Chercher et filtrer des logs par sévérité, source et mot-clé"
  - "Détecter les schémas récurrents et les anomalies avec collections.Counter"
  - "Rendre une chronologie des événements par heure avec matplotlib"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/data-structures", "data-analysis/groupby-aggregation"]
---

# 📊 Construire un Analyseur et Visualiseur de Logs

Chaque service en fonctionnement produit un fichier de log qui grandit sans pitié — des milliers de lignes par minute, la moitié du bruit, jusqu'à ce qu'un après-midi quelque chose casse et que tu aies besoin de trouver les trois lignes pertinentes dans un million. Ce projet construit le premier outil qu'un vrai ingénieur saisit : un CLI qui analyse un fichier de log en enregistrements structurés, filtre par sévérité et mot-clé, compte les schémas qui se répètent et dessine une chronologie des événements par heure pour que tu puisses *voir* quand les choses ont mal tourné.

Cela suppose Python 101 — entrées-sorties de fichiers, chaînes, dictionnaires et fonctions — plus un peu d'aisance à lire des DataFrames depuis Analyse de Données. Rien de plus : pas de frameworks, pas d'API, pas de services externes. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Définir un format de ligne pour un log en pagaille et analyser chaque ligne en un enregistrement structuré (horodatage, niveau, source, message).
2. Chercher et filtrer les enregistrements par sévérité, source et mot-clé en texte libre.
3. Détecter les messages les plus fréquents avec un `Counter` — les schémas qui dominent ton log.
4. Compter les événements par heure et rendre un graphique chronologique qui montre la panne d'un coup d'œil.
5. Pointer l'outil terminé sur un `app.log` d'exemple réaliste que tu génères toi-même et trouver l'anomalie.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal ici — tout l'intérêt de l'outil est de pointer sur un vrai fichier de log sur le disque et de le lire, et c'est le plus naturel dans un terminal où le fichier vit réellement. Les étapes ci-dessous supposent un petit dossier avec `uv`, ce qui rend aussi l'installation pénible de `matplotlib` en une seule commande.

**GitHub Codespaces** fonctionne tout aussi bien : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et tu auras Node, Python et `uv` préinstallés dans un vrai clone du dépôt.

**Google Colab, Kaggle Notebooks et Binder sont un bon moyen d'*essayer* la mécanique d'analyse et de comptage, mais l'étape 1 riche en fichiers (`pathlib` + vraies entrées-sorties) brille moins dans un notebook éphémère.** Le notebook ci-dessous reflète les étapes avec un log d'exemple intégré pour que tout — analyse, filtre, comptage, graphique — tourne de bout en bout sans aucune configuration. Utilise-le pour voir le pipeline fonctionner ; passe au `uv` local ou à un Codespace quand tu veux pointer l'outil sur des logs qui sont réellement les tiens.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/log-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/log-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flog-analyzer%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant une seule ligne de l'analyseur : un Python moderne via `uv`, un package de graphiques et un log d'exemple réaliste pour t'entraîner.

### Installe `uv` et mets en place

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
mkdir log-analyzer && cd log-analyzer
uv init --bare
uv add matplotlib
```

### Génère un log d'exemple réaliste

Tu as besoin d'un log à analyser qui ressemble à la vraie chose — du bruit, de la répétition et un pic d'erreurs enfoui. Colle ceci dans `make_sample_log.py` :

```python
# make_sample_log.py
from datetime import datetime, timedelta
from pathlib import Path
import random

random.seed(7)
START = datetime(2026, 8, 3, 0, 0)
LINES = [
    ("INFO", "api", "GET /health 200 {}ms"),
    ("INFO", "api", "GET /api/users 200 {}ms"),
    ("INFO", "db", "query OK {}ms"),
    ("DEBUG", "cache", "hit key=user:{}"),
    ("WARN", "db", "slow query {}ms (>1000ms)"),
    ("ERROR", "api", "500 on /api/orders: KeyError 'total'"),
    ("ERROR", "db", "connection reset by peer"),
]

out = []
t = START
for _ in range(1200):
    t += timedelta(seconds=random.randint(1, 12))
    level, src, msg = random.choice(LINES)
    n = random.randint(1, 9999)
    if random.random() < 0.03:
        level, src, msg = "ERROR", "api", "500 on /api/orders: KeyError 'total'"
    out.append(f"{t:%Y-%m-%d %H:%M:%S} {level:<5} [{src}] {msg.format(n)}")

Path("app.log").write_text("\n".join(out) + "\n")
print(f"wrote {len(out)} lines to app.log")
```

Exécute-le :

```bash
uv run python make_sample_log.py
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `matplotlib` installé via `uv add matplotlib`.
- ✅ `make_sample_log.py` écrit `app.log` avec 1200 lignes — environ deux heures d'horodatages avec quelques dizaines de lignes ERROR parsemées.

## Étape 1 : Analyse une ligne de log en un enregistrement structuré

Le texte non structuré est inutile pour l'analyse, donc le premier geste est de transformer chaque ligne en un `dict` avec des champs nommés. Notre format est fixe exprès : `timestamp LEVEL [source] message`. Tu verras cette paire « définir un format analysable, puis l'analyser » dans chaque système de logging du monde réel — y compris le module `logging` de Python lui-même.

### 1.1 Écris un analyseur de bout en bout

```python
# parse.py
from pathlib import Path

def parse_line(line: str) -> dict:
    """Turns '2026-08-03 10:14:03 INFO  [api] GET /health 200 12ms' into a dict."""
    parts = line.split(None, 3)
    ts, level, source = parts[0] + " " + parts[1], parts[2], parts[3].strip("[]")
    message = parts[4] if len(parts) > 4 else ""
    return {"timestamp": ts, "level": level, "source": source, "message": message}

def load_log(path: str) -> list[dict]:
    return [parse_line(line) for line in Path(path).read_text().splitlines() if line.strip()]

if __name__ == "__main__":
    records = load_log("app.log")
    print(f"parsed {len(records)} records")
    print(records[0])
```

`line.split(None, 3)` est le cheval de trait ici : découper sur les espaces avec un `maxsplit` de 3 préserve l'espace interne de l'horodatage (`parts[1]` découperait sinon `10:14` et `03` à part) et capture tout le message comme un seul morceau final. Le niveau fait toujours exactement 5 caractères de large dans notre générateur (`INFO ` complété), donc il survit proprement au découpage aussi.

**👟 Indice de départ :** Copie `parse.py` exactement, exécute `uv run python parse.py` et confirme que le premier enregistrement est un dict avec quatre clés avant de toucher à quoi que ce soit d'autre.

**🎯 Résultat attendu :** `parsed 1200 records`, suivi d'un seul dict comme `{'timestamp': '2026-08-03 00:00:00', 'level': 'INFO', 'source': 'api', 'message': 'GET /health 200 691ms'}`.

**🩹 Si ça ne marche pas :** Si tu obtiens `ValueError: not enough values`, une ligne vide ou une ligne avec moins de 4 parties séparées par des espaces s'est glissée — c'est pourquoi `load_log` filtre les lignes vides selon `line.strip()`. Si le message est vide pour chaque ligne, le générateur a écrit un format sans séparation de message ; relance `make_sample_log.py` (l'appel `{msg.format(n)}` s'effondre quand le message n'a pas de placeholder `{}` — vérifie que ça marche encore après édition).

### 1.2 Vérifie l'analyseur

**✅ Liste de vérification**

- ✅ `parse.py` affiche `parsed 1200 records` depuis `app.log`.
- ✅ Le premier enregistrement affiché est un vrai `dict` avec les clés `timestamp`, `level`, `source` et `message`.
- ✅ Tu peux expliquer pourquoi `split(None, 3)` plafonne le découpage à trois — et ce qui casse sans le `3`.

**🤔 Question(s) socratique(s)**

- Notre analyseur suppose une colonne de niveau à largeur fixe (`{level:<5}` dans le générateur). Qu'est-ce qui changerait dans `parse_line` si le log utilisait des niveaux à largeur variable comme `[ERROR] api` à la place — et existe-t-il une réécriture qui survit aux deux ?
- L'horodatage est stocké comme une chaîne. Qu'est-ce qui casserait plus tard si tu essayais de trier les enregistrements *par heure* avec des chaînes comme `2026-08-03 00:00:00` ? (Indice : pense aux zéros de tête et à ce qu'un objet `datetime` te donne gratuitement.)

## Étape 2 : Filtre et cherche dans les enregistrements

L'analyse te donne de la structure ; le filtrage est là où tu commences à répondre aux questions. « Chaque ERROR des 10 dernières minutes » et « chaque ligne mentionnant `orders` » sont les deux requêtes qu'une session de débogage exécute réellement — l'une par champ exact, l'autre par texte libre.

### 2.1 Interroge par champ et par mot-clé

```python
# query.py
from parse import load_log

def by_level(records: list[dict], level: str) -> list[dict]:
    return [r for r in records if r["level"] == level]

def by_source(records: list[dict], source: str) -> list[dict]:
    return [r for r in records if r["source"] == source]

def by_keyword(records: list[dict], keyword: str) -> list[dict]:
    return [r for r in records if keyword.lower() in r["message"].lower()]

if __name__ == "__main__":
    records = load_log("app.log")
    errors = by_level(records, "ERROR")
    print(f"ERROR lines: {len(errors)}")
    print(f"first error message: {errors[0]['message']}")
    caches = by_keyword(records, "cache hit")
    print(f"messages containing 'cache hit': {len(caches)}")
```

Chaque filtre est une compréhension de liste sur les enregistrements avec un prédicat, et la recherche par mot-clé replie les deux côtés en minuscules pour que `ERROR` corresponde à `error`. Comme l'enregistrement est un dict, `by_level` et `by_source` sont en fait la *même* fonction déguisée — les deux ne font que tester un champ contre une valeur.

**👟 Indice de départ :** Commence par `by_level` seulement ; vérifie le nombre d'ERROR, puis ajoute `by_source` et `by_keyword` une à la fois, en relançant après chacune.

**🎯 Résultat attendu :** Trois lignes : `ERROR lines: <un nombre autour de 40>`, le texte d'une erreur `500 on /api/orders`, et un compte de `messages containing 'cache hit'` — quelque chose confortablement au-dessus de zéro.

**🩹 Si ça ne marche pas :** Si `errors[0]` lève une `IndexError`, ton log d'exemple a zéro ligne ERROR — relance le générateur : c'est la branche `random.random() < 0.03` qui les injecte. Si le compte de mots-clés est 0 mais que tu *sais* que le texte est là, vérifie que tu cherches dans `records` et pas dans un module ré-importé périmé — redémarre l'interpréteur après avoir édité `parse.py`.

### 2.2 Vérifie le filtrage

**✅ Liste de vérification**

- ✅ `by_level(records, "ERROR")` retourne une liste non vide dont les membres ont tous `level == "ERROR"`.
- ✅ `by_keyword(records, "orders")` retourne chaque ligne dont le message contient ce mot — et retourne le même résultat quelle que soit la casse.
- ✅ Tu peux prédire, avant d'exécuter, combien d'enregistrements `by_level` + `by_source` se chevaucheraient sur une source qui n'émet que des lignes INFO.

**🤔 Question(s) socratique(s)**

- `by_keyword` fait une correspondance textuelle littérale. Quelle est la première requête que tu pourrais écrire qu'elle *échouerait* — par exemple, vouloir tous les messages sur *soit* « orders » *soit* « payments » ? Que cela suggère-t-il sur la composition de prédicats simples ?
- `by_level` devrait-il traiter `"error"` (minuscules) comme égal à `"ERROR"` ? Quel est le changement d'une ligne qui rend la comparaison insensible à la casse — et quand pourrais-tu *ne pas* vouloir cela ?

## Étape 3 : Compte les schémas avec un `Counter`

Le filtrage trouve les lignes que tu soupçonnes déjà ; le comptage trouve les problèmes que tu n'avais pas devinés. Le message le plus répété d'un log est presque toujours la chose à regarder — une seule boucle de backoff qui réessaie chaque seconde générera des milliers de lignes identiques pendant qu'une vraie erreur se déclenche une fois.

### 3.1 Compte les messages répétés

```python
# count.py
from collections import Counter
from parse import load_log

def top_messages(records: list[dict], n: int = 5) -> list[tuple]:
    return Counter(r["message"] for r in records).most_common(n)

def error_rate(records: list[dict]) -> float:
    if not records:
        return 0.0
    errors = sum(1 for r in records if r["level"] == "ERROR")
    return errors / len(records)

if __name__ == "__main__":
    records = load_log("app.log")
    for msg, count in top_messages(records):
        print(f"{count:>4}  {msg}")
    print(f"\nerror rate: {error_rate(records):.2%}")
```

`Counter(...).most_common(n)` fait tout le travail « regrouper par message, trier par fréquence, prendre les n premiers » en une ligne — tu écrirais sinon une boucle `defaultdict(int)` plus un tri. Note que le message devient *pseudo-modèle* une fois un vrai format de chaîne utilisé (`{n}` remplacé au moment de la génération), donc des valeurs de paramètres distinctes s'effondrent quand même en un seul bac, ce qui est exactement ce que tu veux pour repérer un schéma répété.

**👟 Indice de départ :** Importe `Counter` depuis `collections` (stdlib — aucune installation) et affiche les 5 premiers messages avec leurs comptes ; l'expression en une ligne `error_rate` est un bonus qui répond à « quelle fraction de mon log est un échec ? »

**🎯 Résultat attendu :** Cinq lignes comme ` 213  query OK 1234ms` avec des comptes décroissants, puis `error rate: 3.4%` (tes nombres exacts varient — la graine les rend reproductibles).

**🩹 Si ça ne marche pas :** Si chaque ligne affiche un compte de 1, `{msg.format(n)}` dans le générateur a donné à chaque ligne un paramètre unique et le regroupement « modèle » n'a rien effondré — c'est un comportement correct, mais pour voir de la répétition, relance le générateur où `random.seed(7)` fait réapparaître quelques messages. Si `error_rate` affiche `0.00%`, la branche ERROR manque dans ton générateur (voir la correction de l'étape 2).

### 3.2 Vérifie le comptage

**✅ Liste de vérification**

- ✅ `top_messages` affiche 5 rangées avec comptes décroissants qui totalisent les 1200 lignes complètes.
- ✅ `error_rate` retourne un pourcentage entre 0 % et 100 % qui correspond à `len(by_level(records, "ERROR")) / len(records)`.
- ✅ Tu peux nommer le type de chaque élément retourné par `top_messages` — et pourquoi une `list` simple ne peut pas faire `most_common`.

**🤔 Question(s) socratique(s)**

- `Counter` est construit sur un `dict` simple. Qu'est-ce qui serait perdu si tu remplaçais l'expression en une ligne par `dict.fromkeys(records, 0)` pour « tout mettre à zéro d'abord » — et quel est le compte réel quand une clé manque dans un dict normal ?
- `error_rate` divise par le nombre total d'enregistrements. Si le log était à 90 % de lignes DEBUG, les mêmes 40 ERRORs sembleraient-ils meilleurs ou pires en pourcentage ? Quel serait un *meilleur* dénominateur pour « à quel point cette heure est cassée » ?

## Étape 4 : Visualise les événements dans le temps

Un nombre peut cacher un schéma ; un graphique, rarement. « Chaque heure avait 2 erreurs sauf 11:00, qui en avait 140 » est un *tableau de bord que tu peux voir*, et c'est l'étape qui fait passer l'outil de « recherche » à « analyse ».

### 4.1 Compte les événements par heure et trace

```python
# timeline.py
from collections import Counter
from datetime import datetime
from parse import load_log
import matplotlib.pyplot as plt

def events_per_hour(records: list[dict], level: str = None) -> Counter:
    hours = Counter()
    for r in records:
        if level is not None and r["level"] != level:
            continue
        hour = datetime.strptime(r["timestamp"], "%Y-%m-%d %H:%M:%S").replace(
            minute=0, second=0, microsecond=0
        )
        hours[hour] += 1
    return hours

if __name__ == "__main__":
    records = load_log("app.log")
    totals = events_per_hour(records)
    errors = events_per_hour(records, "ERROR")
    hours = sorted(set(totals) | set(errors))
    x = range(len(hours))
    plt.bar([h for h in x], [totals[h] for h in hours], label="all events")
    plt.bar([h for h in x], [errors[h] for h in hours], color="red", label="errors")
    plt.xticks(list(x), [h.strftime("%H:%M") for h in hours], rotation=45)
    plt.xlabel("hour")
    plt.ylabel("events")
    plt.title("Log events per hour")
    plt.legend()
    plt.tight_layout()
    plt.savefig("timeline.png", dpi=120)
    print("wrote timeline.png")
    print("error peak:", errors.most_common(1))
```

Deux barres sommées sur le même axe, c'est l'astuce d'un graphique empilé : le total montre le volume, et la superposition rouge montre *où le volume était des erreurs*. Les deux sont construites à partir du même `events_per_hour` — le filtre `level` est un arrêt optionnel dans la boucle de comptage, donc une seule fonction répond à « à quel point c'était occupé » et « à quel point c'était cassé » sans une seconde implémentation.

**👟 Indice de départ :** Fais afficher `saved timeline.png` et ouvre le fichier avant de t'inquiéter des étiquettes — une barre bleue plate et ennuyeuse avec un pic rouge est la première sortie attendue et correcte.

**🎯 Résultat attendu :** `wrote timeline.png` et `error peak: (<un datetime proche de 11:00>, <un compte dans les centaines>)` — une barre rouge qui domine une heure dans l'image enregistrée.

**🩹 Si ça ne marche pas :** Si `plt.bar` erre avec des longueurs non correspondantes, `x` et les deux listes de valeurs doivent être de longueur égale — la ligne d'union `hours = sorted(set(totals) | set(errors))` existe pour garantir cela, donc ne la remplace pas par seulement `set(totals)`. Si `strptime` lève `ValueError: time data ... does not match format`, ton `parse_line` a stocké des millisecondes ou un horodatage date seule — vérifie que le format `%H:%M:%S` du générateur correspond au `"%Y-%m-%d %H:%M:%S"` dans `strptime`.

### 4.2 Vérifie la chronologie

**✅ Liste de vérification**

- ✅ `timeline.png` existe et montre une heure avec une haute barre rouge — l'anomalie est visible sans lire un nombre.
- ✅ Les barres de chaque autre heure sont proches de plat, reflétant un flux de fond régulier.
- ✅ L'heure du pic d'erreurs correspond au fait que `error_rate` est nettement plus élevé dans la tranche de cette heure.

**🤔 Question(s) socratique(s)**

- Le graphique empile le total et les erreurs sur le même axe, ce qui *masque* visuellement la ligne de base des erreurs là où le rouge est minuscule. Quelle est une autre manière de coder (indice : deux sous-graphiques, ou les erreurs sur une échelle logarithmique) qui ferait ressortir un faible taux d'erreurs sur un log à fort volume ?
- Nous groupons par heure calendaire. Si une panne arrive à 11:59 et est réparée à 12:01, le groupement standard `replace(minute=0)` la brouille sur deux barres. Comment grouperais-tu si tu voulais que le graphique s'aligne sur « une rafale », pas « deux heures partielles » ?

## Étape 5 : Pointe l'analyseur sur une vraie anomalie

Tout l'outil vaut plus que la somme de ses étapes quand tu l'exécutes sur un log où tu n'as *pas déjà* lu la réponse. Cette étape génère un log avec une rafale cachée, puis utilise tes propres filtres, compteur et graphique pour la trouver — le véritable flux de travail.

### 5.1 Trouve le pic enfoui

```python
# analyze.py
from parse import load_log
from query import by_level
from count import top_messages
from timeline import events_per_hour

if __name__ == "__main__":
    records = load_log("app.log")
    errors = by_level(records, "ERROR")
    print(f"total lines: {len(records)} | errors: {len(errors)}")
    print("\nmost common error-level messages:")
    for msg, cnt in top_messages(errors, 3):
        print(f"  {cnt:>3}  {msg}")
    peak_hour, peak_count = events_per_hour(errors).most_common(1)[0]
    print(f"\nerror peak at {peak_hour:%H:%M} with {peak_count} errors")
```

**👟 Indice de départ :** `analyze.py` emprunte à chaque module précédent — exécute-le, puis *va lire* le compte et l'heure de pointe, et confirme qu'ils sont cohérents avec `timeline.png` de l'étape 4. Lire les deux ensemble, c'est la récompense.

**🎯 Résultat attendu :** Trois conclusions claires qui s'accordent entre elles — un nombre d'ERROR proche de 40 au total, un message `500 on /api/orders` récurrent dominant la liste d'erreurs, et une heure de pointe d'erreurs qui correspond visiblement au pic rouge du graphique enregistré.

**🩹 Si ça ne marche pas :** Si l'heure de pointe semble aléatoire (comptes de 1–3 partout), ton générateur a atteint l'injection de 0.03 trop uniformément ou pas du tout — relance `make_sample_log.py` ; la graine garantit une rafale. Si `top_messages(errors, 3)` montre trois *différents* messages de compte 1, le schéma d'erreurs est trop varié pour être « un bug » — cela en soi est une constatation qui vaut la peine d'être écrite.

### 5.2 Vérifie l'analyse complète

**✅ Liste de vérification**

- ✅ Les trois faits affichés (total/erreurs, message d'erreur principal, heure de pointe) sont mutuellement cohérents et correspondent à `timeline.png`.
- ✅ Tu peux nommer, pour chaque fait, exactement quelle fonction de quelle étape l'a produit — analyser, filtrer, compter ou regrouper.
- ✅ Tu as supprimé et régénéré `app.log` au moins une fois pour confirmer que l'outil lit le fichier à nouveau, pas un résultat en cache.

**🤔 Question(s) socratique(s)**

- Le pic a été fabriqué avec `random.random() < 0.03` — une injection de 3 %. Si tu changeais cela en `0.5`, laquelle des quatre fonctions serait *encore* la bonne pour le détecter, et quelle sortie cesserait d'être fiable ?
- Cet outil répond à « que s'est-il passé » mais pas à « pourquoi ». Quelle serait la seule prochaine requête que tu voudrais exécuter sur l'heure de pointe — et que construirais-tu (indice : une évolution descendante qui montre les lignes brutes) pour y répondre ?

## ⚠️ Pièges courants

- **Dérive du format d'analyse.** Le moment où un vrai log change son format de message (un nouveau champ, un niveau plus long), `split(None, 3)` produit silencieusement des enregistrements mal étiquetés et chaque compte en aval ment tranquillement. La correction est une vérification de schéma dans `load_log` : lève une erreur claire quand une ligne ne peut pas être découpée en 4+ parties, listant la ligne fautive, au lieu de laisser passer la camelote.
- **Compter les messages bruts au lieu des modèles.** Compter `r["message"]` groupé par texte exact explose soudainement en des milliers d'entrées uniques le moment où un message intègre une valeur par requête (`user:4311` vs `user:4312`). Pour l'analyse de logs tu veux généralement normaliser les nombres avant de compter — une expression régulière remplaçant `\d+` par `{N}` — pour que `user:{N}` compte comme un seul schéma. Cette normalisation est ce que font les vrais outils d'agrégation d'erreurs.
- **Appeler `strptime` sur chaque ligne.** Analyser 10 000 chaînes pour un graphique de 5 lignes, c'est bon ; analyser 10 millions ralentit tout le pipeline. Cela achète un vrai `datetime` pour le tri et le regroupement, mais mesure avant de supposer — et envisage un `sorted(records, key=lambda r: r["timestamp"])` ponctuel si tout ce dont tu as besoin c'est l'ordre, puisque les horodatages style ISO se trient correctement comme chaînes.
- **Le piège du log vide.** `error_rate` et `most_common(1)[0]` explosent tous deux (`IndexError`) sur un fichier vide, et les outils type `dataframe` sont pires — ils calculent silencieusement sur zéro ligne. Garde chaque point d'entrée : `if not records: print("empty log")` avant le tout premier filtre, pas après trois étapes qui ont déjà supposé que les données existent.
- **Enregistrer un PNG et l'appeler un tableau de bord.** Un fichier statique est un excellent point de contrôle, mais « voir l'anomalie » à 3 h du matin signifie généralement une alerte. Le prochain pas naturel (et un piège classique) est d'oublier qu'un graphique que *tu* regardes chaque semaine n'est pas un système d'alerte — pose une vérification de seuil (`if errors > 100: print("ALERT")`) bien avant de construire des tableaux de bord plus sophistiqués.

## Ce que tu viens de construire

Un vrai pipeline d'analyse de logs qui fonctionne : `parse.py` transforme 1200 lignes brutes en dicts structurés, `query.py` les filtre, `count.py` trouve les schémas répétés et le taux d'erreurs, et `timeline.py` rend la seule heure en pointe où tout a mal tourné. Rien ici n'est un échafaudage — génère un nouveau log, pointe l'outil dessus, et l'anomalie saute aux yeux. La compétence transférable est plus grande que les logs, pourtant : analyser → normaliser → compter → visualiser est le squelette exact de chaque tâche « donner du sens à une source de texte en désordre », des logs serveur aux réponses de sondage en passant par les messages de commit git.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/log-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/log-analyzer) dans le dépôt du cours regroupe les cinq modules plus un `app.log` d'exemple et un notebook prêt à exécuter. Clone ou ouvre le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Normalise les valeurs qui cassent les comptes avant de compter — remplace `\d+` par `{N}` pour que `user:4311` et `user:4312` s'effondrent en un seul schéma, et regarde ton `Counter` commencer à trouver de vraies répétitions.
- Ajoute une règle d'alerte : `warn_threshold.py` qui affiche `ALERT: <n> errors in the last hour` quand `events_per_hour` franchit un nombre — la graine d'un pager, sans le pager.
- Ajoute une carte de chaleur source-vs-heure (une rangée par `source`, une colonne par heure, couleur de cellule = compte) — la façon classique de repérer « la db était troublée à 02:00 pendant que l'api allait bien ».
- Porte le pipeline sur le module `logging` de Python : émets des enregistrements *structurés* (déjà des dicts et un format documenté) au lieu d'analyser le texte de quelqu'un d'autre — ton futur toi n'aura jamais besoin de l'étape 1.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier — un vrai log que tu as dompté, un graphique qui a trouvé un véritable pic ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README guide l'ajout du tien via une **pull request** du début à la fin : fork, branche, commit et ouverture de la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓