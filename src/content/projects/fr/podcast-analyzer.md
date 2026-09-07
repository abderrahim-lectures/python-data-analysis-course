---
title: "Analyseur de Podcasts"
description: "Transcrivez, résumez et extrayez des insights d'épisodes de podcasts avec détection de sujets."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["cli", "text-processing", "csv", "regex"]
learningObjectives:
  - Analyser une transcription de podcast horodatée en tours de parole
  - Distinguer les animateurs des invités en comparant les noms d'intervenants à un registre
  - Noter une transcription contre des ensembles de mots-clés de sujets avec Counter
  - Composer une fiche d'épisode et l'exporter en CSV
prerequisites: ["python-101/strings", "python-101/file-io", "python-101/sets", "python-101/functions"]
---

# 🎧 Construire un Analyseur de Podcasts

Les podcasts produisent des heures d'audio et presque aucune structure. Que tu sois un fan qui décide quel épisode sauter ou un producteur qui veut une lecture de données sur ses propres épisodes, l'élément utile est le même : une *fiche* d'épisode — qui étaient les invités, quels sujets ont vraiment dominé la conversation, et quelles phrases se sont répétées. Ce projet construit un CLI qui produit cette fiche à partir d'une transcription : il analyse les tours de parole des intervenants, distingue les animateurs des invités, note les mots contre des ensembles de mots-clés de sujets, et écrit un résumé en un fichier plus un CSV lisible par machine. Pas d'audio, pas de ML, pas de clés API.

Cela suppose le Python 101 — chaînes, ensembles, entrées-sorties de fichiers et fonctions. Rien au-delà de cela. C'est optionnel et non noté ; vois [Projets du monde réel](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Analyser une transcription `[horodatage] Intervenant: mots` en tours structurés.
2. Distinguer les animateurs des invités en utilisant un registre connu d'animateurs — et détecter les noms qui n'y figurent pas.
3. Compter le poids de mention de chaque sujet en notant la transcription contre des ensembles de mots-clés.
4. Extraire la part de conversation de chaque invité et les mots-clés principaux de l'épisode.
5. Écrire un `episode_notes.txt` lisible et un `topics.csv` que tu peux ouvrir dans n'importe quel tableur.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — c'est du traitement de texte pur sur un fichier de transcription que tu contrôles, donc la boucle « dépose une transcription, obtiens deux fichiers de sortie » est une habitude de terminal, et le CSV atterrit comme un vrai fichier.

**GitHub Codespaces** fonctionne à l'identique : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et les mêmes commandes s'exécutent dans un onglet de navigateur avec Node, Python et `uv` préinstallés.

**Google Colab, les notebooks Kaggle et Binder exécutent honnêtement chaque étape** — pas de GPU, pas de secrets, pas de gros fichiers — contre la transcription d'épisode d'exemple fournie avec le cours (une fausse conversation réaliste écrite à la main). La réserve honnête : le notebook analyse la transcription fournie plutôt que de l'audio que tu enregistres. La vraie conversion parole-en-texte pour tes propres enregistrements a besoin d'un outil séparé ; tout ce qui *suit* la transcription est exactement ce que le notebook exécute pour de vrai.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/podcast-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/podcast-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpodcast-analyzer%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant les premiers comptages de mots : `uv`, un épisode d'exemple, et un registre d'animateurs.

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
mkdir podcast-analyzer && cd podcast-analyzer
uv init --bare
```

Zéro paquet supplémentaire — pure bibliothèque standard.

### Écris un épisode d'exemple

Enregistre ceci sous `episode.txt` :

```
[00:00] Maya: Welcome back to The Indie Show, this episode is about scaling, sort of.
[00:14] Maya: Our guest today is Jonas, who built a tiny publishing tool into a real business.
[00:30] Jonas: Thanks, Maya. Let's be honest, the scaling story is mostly boring — paying down tech debt.
[00:52] Jonas: The interesting part is pricing. We raised prices three times in two years.
[01:10] Maya: Pricing feels like the hardest lever. What about marketing?
[01:22] Jonas: Marketing is a distribution problem. SEO and word of mouth, mostly word of mouth.
[01:40] Maya: Let's talk about remote work culture on a small team.
[01:55] Jonas: Remote culture is trust, honestly. You either have it or you're doing it wrong.
[02:10] Maya: One last thing — taking breaks and managing burnout in an early startup.
[02:24] Jonas: Burnout is real. Rest is not a reward, it's a requirement.
[02:38] Maya: That's the episode. Jonas, thank you for your time.
[02:47] Jonas: Thank you. Keep shipping. That's it, that's the whole trick.
```

Enregistre `hosts.txt` avec un nom d'animateur par ligne :

```
Maya
```

Écris `topics.py` (les ensembles de mots-clés — les étiquettes de sujets contre leurs mots déclencheurs) :

```python
# topics.py
TOPICS = {
    "pricing": ["price", "pricing", "revenue", "money"],
    "marketing": ["marketing", "seo", "word of mouth", "growth"],
    "culture": ["culture", "remote", "trust", "team"],
    "wellness": ["burnout", "rest", "breaks", "stress"],
}
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `episode.txt` existe (12 tours), `hosts.txt` ne contient que `Maya`, et `topics.py` définit quatre ensembles de sujets.
- ✅ Tu peux déjà deviner le résultat : `pricing` et `wellness` devraient dépasser largement `culture` — et l'outil te le dira bientôt.

## Étape 1 : Analyse la transcription de l'épisode

Même forme que n'importe quel outil de réunion, avec une particularité : les transcriptions de podcasts portent un fichier de *registre d'animateurs*, et l'analyseur doit garder chaque nom d'intervenant intact parce que la distinction animateur/invité de l'Étape 2 dépend d'une égalité exacte de chaînes de noms.

### 1.1 Écris l'analyseur de tours

```python
# parse.py
from pathlib import Path

def parse_line(line: str) -> dict:
    line = line.strip()
    time_s = line.split("]", 1)[0].lstrip("[")
    rest = line.split("]", 1)[1].strip()
    speaker, _, text = rest.partition(":")
    return {"time": time_s, "speaker": speaker.strip(), "text": text.strip()}

def load_episode(path: str) -> list[dict]:
    return [parse_line(l) for l in Path(path).read_text().splitlines() if l.strip()]

def load_hosts(path: str) -> set[str]:
    return {l.strip().lower() for l in Path(path).read_text().splitlines() if l.strip()}

if __name__ == "__main__":
    turns = load_episode("episode.txt")
    print(len(turns), "turns")
    print(load_hosts("hosts.txt"))
```

`partition(":")` fait encore une fois le travail lourd — le premier deux-points sépare l'intervenant de la parole, et les deux-points *à l'intérieur* du message (imagine `01:40`, ou un titre comme `The Scraper: Part Two`) restent en place. `load_hosts` met immédiatement le registre en minuscules dans un `set`, donc le test d'appartenance de l'Étape 2 est un `in` en temps constant contre un nom *canonique* en minuscules — un seul "mAYA" mal écris dans le registre mettrait silencieusement l'animateur dans la liste des invités pour toujours.

**👟 Indice de départ :** Analyse d'abord, affiche `turns[1]`, et *regarde* la forme avant toute analyse — `speaker: 'Maya'`, `text: 'Our guest today is Jonas…'`, pas de crochets, pas de deux-points.

**🎯 Résultat attendu :** `12 turns`, et l'ensemble des animateurs affiche `{'maya'}` pour `hosts.txt`. Le premier tour d'exemple est un dict propre avec les trois clés.

**🩹 Si ça ne marche pas :** Si `speaker` a encore un espace de tête, le `.strip()` après `partition` manque. Si un `ValueError` se déclenche avec le message `not enough values to unpack`, une ligne existe sans aucun deux-points — les transcriptions d'interviews coupent parfois un tour en deux ; « saute et avertisse » vaut mieux que de planter, mais décide *avant* d'ajouter un dixième fichier.

### 1.2 Vérifie l'analyse

**✅ Liste de vérification**

- ✅ `load_episode` retourne 12 dicts avec `time`, `speaker` et `text`.
- ✅ `load_hosts` retourne un `set` en minuscules — `{'maya'}`, pas `{'Maya'}`.
- ✅ Un tour dont le message contient un deux-points conserve quand même tout le message.
- ✅ Les lignes vides ne deviennent jamais des tours vides, et le registre n'a pas d'artefacts d'espaces.

**🤔 Question(s) socratique(s)**

- Le registre se met en minuscules dans un ensemble, mais les chaînes `speaker` de la transcription sont toujours en casse mixte. Si une ligne d'un invité dit `[01:10] maya: ...` (en minuscules à cause d'une mauvaise transcription), quelle étape casse silencieusement plus tard — et que réparerait un `speaker.lower()` au moment de l'analyse ?
- Nous traitons `[00:14]` comme un horodatage minute:seconde pour l'affichage uniquement. Si tu voulais calculer les minutes exactes de temps de parole par intervenant (`00:47` moins `00:30`), que devrais-tu changer au type du champ `time`, et quelle analyse cela imposerait-il ?

## Étape 2 : Distingue les animateurs des invités

Le registre fait de la classification animateur/invité un test d'appartenance d'ensemble — `speaker.lower() in hosts`. Tout ce qui n'est pas un animateur connu est un invité, et un *nom qui n'apparaît nulle part* mérite d'être signalé bruyamment, car « quelqu'un a parlé qui n'est sur aucune liste » est exactement la donnée qu'un titre d'épisode écrit à la main se trompe.

### 2.1 Classe chaque intervenant

```python
# roster.py
from parse import load_episode, load_hosts

def classify(episode: str, hosts_file: str) -> dict[str, dict]:
    hosts = load_hosts(hosts_file)
    people = {}
    for t in load_episode(episode):
        name = t["speaker"].lower()
        row = people.setdefault(name, {"speaker": t["speaker"], "role": None,
                                       "words": 0, "turns": 0})
        row["role"] = "host" if name in hosts else "guest"
        row["words"] += len(t["text"].split())
        row["turns"] += 1
    return people

if __name__ == "__main__":
    people = classify("episode.txt", "hosts.txt")
    for name, row in sorted(people.items()):
        print(f"{row['speaker']:<6} {row['role']:<6} {row['words']:>3} words  {row['turns']} turns")
```

Le classificateur est un dictionnaire-de-lignes que tu *mutes sur place* — `setdefault` crée la ligne de chaque intervenant la première fois que son nom apparaît, puis chaque tour ultérieur incrémente les mots et les tours. Le rôle est calculé *à chaque tour* à partir d'une vérification vivante `name in hosts`, donc un nom qui apparaît dans la transcription avant que le registre ne se charge (ou avec une casse différente) se résout toujours correctement — et parce que le rôle est décidé par ligne après chargement et jamais mis en cache, il n'y a pas d'obsolescence du type « c'était un animateur quand je l'ai vu la première fois ».

**👟 Indice de départ :** Exécute la classification et inspecte la sortie — Maya devrait être `host`, Jonas `guest` ; puis supprime temporairement `Maya` de `hosts.txt` et réexécute. Au fait que ses deux tours deviennent `guest` *et* que la liste des invités contienne maintenant ton propre animateur est exactement l'échec contre lequel un vrai outil se protégerait.

**🎯 Résultat attendu :** `Maya  host   71 words  7 turns` et `Jonas  guest  57 words  5 turns` — deux lignes, une par intervenant distinct, chacune avec un rôle.

**🩹 Si ça ne marche pas :** Si les deux lignes disent `guest`, le registre ne se charge pas — vérifie que `hosts.txt` se termine par un retour à la ligne et que le chemin du fichier correspond à `load_hosts`. Si un nom s'est scindé en deux personnes (`maya` et `Maya`), la normalisation `speaker.strip()`/`.lower()` n'est pas appliquée dans `classify` — chaque lecture doit passer par le même entonnoir avant `setdefault`.

### 2.2 Vérifie la distinction

**✅ Liste de vérification**

- ✅ Maya = animateur, Jonas = invité, aucune ligne de tierce personne n'apparaît.
- ✅ Supprimer un animateur de `hosts.txt` bascule immédiatement son rôle à la réexécution — la classification relit le registre à chaque exécution.
- ✅ Deux tours du même intervenant s'accumulent en une seule ligne (`words` et `turns` augmentent tous les deux).
- ✅ Tu peux dire, en une phrase, pourquoi `row["role"]` est recalculé à chaque tour au lieu d'être défini une seule fois à la création de la ligne.

**🤔 Question(s) socratique(s)**

- Une transcription de podcast dont l'animateur est *absent du fichier de registre* transforme silencieusement l'animateur en invité — chaque fiche publiée listerait ton propre animateur comme invité. Quelle est la garde minimale qui ferait refuser à l'outil de produire une fiche jusqu'à ce que chaque intervenant de la transcription soit classé par nom ?
- Les animateurs sont définis par un fichier ; les invités par soustraction. Inverse le modèle : que se passe-t-il avec les lignes « d'usurpation » comme `[01:40] fake_maya: ...` — et quel modèle (liste blanche des animateurs contre liste de rejet des invités) rend l'usurpation *visible* plutôt qu'absorbée ?

## Étape 3 : Note les sujets

Chaque podcast est une conversation, mais « de quoi parlait cet épisode ? » est un problème de comptage. Cette étape note toute la transcription contre l'ensemble de mots-clés de chaque sujet — à chaque fois qu'un mot de pricing apparaît dans la transcription, le score de pricing augmente. C'est une co-occurrence de mots-clés, délibérément superficielle : exactement ce que doit être une première passe bon marché et transparente avant que quelque chose de plus sophistiqué ne s'en mêle.

### 3.1 Compte les occurrences de mots-clés de sujets

```python
# topic_score.py
from collections import Counter
from parse import load_episode
from topics import TOPICS

def score_topics(episode: str) -> Counter:
    all_words = " ".join(t["text"] for t in load_episode(episode)).lower()
    scores = Counter()
    for topic, words in TOPICS.items():
        for w in words:
            scores[topic] += all_words.count(w)
    return scores

if __name__ == "__main__":
    for topic, score in score_topics("episode.txt").most_common():
        print(f"{topic:<10} {score}")
```

Deux boucles en profondeur, une ligne en sortie : `TOPICS` associe une étiquette à ses mots déclencheurs, et chaque occurrence littérale d'un mot est comptée avec `all_words.count(w)`. L'ordre est délibéré — `Counter` plus `.most_common()` donne une liste de sujets classée avec zéro code supplémentaire, donc « ce qui a dominé l'épisode » est littéralement l'élément à l'index zéro.

**👟 Indice de départ :** Avant d'exécuter, compte `pricing` à la main dans `episode.txt` (tu devrais trouver `price`, `pricing` ×2, `revenue` mentions 0) et confirme que les totaux affichés correspondent — fais confiance à l'outil, mais seulement après que l'outil a réussi une vérification à la main une fois.

**🎯 Résultat attendu :** Quatre lignes classées en ordre décroissant — `pricing` et `wellness` en tête (chacun une poignée de touches), `culture` au milieu, `marketing` en dessous — avec les totaux exacts correspondant à ton comptage manuel des mots déclencheurs.

**🩹 Si ça ne marche pas :** Si un sujet obtient 0 alors qu'il ne devrait pas, son mot déclencheur est mal orthographié dans `topics.py` ou apparaît avec un préfixe (`pricing` correspond à `pricing` mais pas à `priced`) — `count()` est une correspondance de sous-chaîne littérale, donc soit ajoute la variante à `TOPICS`, soit accepte la littéralité documentée. Si chaque sujet est énorme, un mot déclencheur comme `team` est une sous-chaîne de `teams`, `steam`, etc. — `count("team")` les compte tous ; envisage de compter `word in wordlist` après tokenisation plutôt que de compter des sous-chaînes du texte brut.

### 3.2 Vérifie la notation des sujets

**✅ Liste de vérification**

- ✅ L'ordre classé correspond à ton comptage manuel des mots déclencheurs.
- ✅ Le score de chaque sujet égale la somme de ses occurrences de mots-clés — tu peux recalculer chaque chiffre à la main.
- ✅ Un sujet sans mots correspondants obtient 0 et *apparaît quand même* dans le classement (présent-mais-zéro vaut mieux qu'absent-et-supposé).
- ✅ Tu peux expliquer la ligne unique qui transforme des comptes bruts en liste classée.

**🤔 Question(s) socratique(s)**

- La notation utilise le comptage de sous-chaînes, donc un « pricing » *économique* et un « price » *émotionnel* entendent le même mot. Quel est le changement — tokeniser en une liste de mots et tester `w in words` — qui empêche `priced` et `priceless` d'alimenter le score, et qu'est-ce que cela te coûte en simplicité ?
- Les quatre sujets de `TOPICS` sont fixés par le fichier. Sur quel épisode cet outil échouerait-il *honnêtement* — par exemple, un épisode sur « la sécurité de l'IA » avec aucun de tes quatre — et que cela te dit-il sur les ensembles de mots-clés par rapport à un modèle qui pourrait étiqueter des thèmes ouverts ?

## Étape 4 : Extrais la part d'invité et les phrases clés

Les deux colonnes restantes de la fiche : combien de *temps d'antenne* chaque intervenant a-t-il commandé, et quelles *phrases* se répètent — les pépites « tu n'arrêtes pas de dire X » qui rendent un épisode mémorable. La part d'invité réutilise la ligne du registre de l'Étape 2 ; les phrases clés sont simplement les mots les plus courants qui ne sont pas du remplissage anglais courant.

### 4.1 Calcule la part et les mots-clés principaux

```python
# highlights.py
from collections import Counter
from roster import classify

STOP = {"the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
        "to", "of", "in", "on", "for", "with", "it", "that", "this", "you",
        "your", "i", "we", "us", "not", "so", "really", "just", "about"}

def guest_share(people: dict) -> list[tuple]:
    guests = [(r["speaker"], r["words"]) for r in people.values() if r["role"] == "guest"]
    total = sum(words for _, words in guests) or 1
    return [(name, words / total) for name, words in guests]

def top_words(episode: str, n: int = 6) -> list[tuple]:
    words = Counter()
    for t in load_episode(episode):
        words.update(w for w in t["text"].lower().split() if w not in STOP)
    return words.most_common(n)
```

`words.update(w for w in ...)` est tout l'étape-avant-l'étape : `Counter.update` accepte un itérable et compte chaque mot qu'il contient, et le générateur filtre les mots vides *au moment du comptage*, donc aucun remplissage n'atterrit jamais dans le compteur. L'ensemble de mots vides est de la paille de prose choisie à la main ; `guest_share` normalise les mots de chaque invité contre le total de la classe des invités (`or 1` couvre un épisode sans invité), donc les nombres font toujours 100 %.

**👟 Indice de départ :** Exécute `top_words` sur l'épisode puis parcours le texte — chaque mot-clé affiché devrait être un *mot de contenu* auquel tu peux pointer (« pricing », « trust », « burnout »…), et `the`/`and` ne devraient être nulle part.

**🎯 Résultat attendu :** `guest_share` → Jonas `100 %` (un seul invité, il obtient tout le temps d'antenne des invités) ; `top_words` → six mots de contenu comme `pricing`, `trust`, `burnout`, `rest`, `marketing`, `culture` — aucun mot vide, en fréquence décroissante.

**🩹 Si ça ne marche pas :** Si `top_words` inonde de `the`, `and`, `really`, un jeton de grammaire n'est pas dans `STOP` — ajoute-le ; l'ensemble est une donnée que tu maintiens. Si `guest_share` divise mal sur un épisode sans invité, l'accumulateur n'a compté que `guests` — décide (et affiche) si le dénominateur est *tous* les intervenants ou seulement les invités ; pour le « temps d'antenne des invités », les invités sont le dénominateur honnête.

### 4.2 Vérifie les points saillants

**✅ Liste de vérification**

- ✅ Chaque mot-clé de `top_words` est un mot de contenu que tu peux localiser dans la transcription.
- ✅ `guest_share` fait 100 % quand il y a au moins un invité, et rien d'alarmant sans invité.
- ✅ Ajouter un mot de remplissage inventé à `STOP` le retire de chaque exécution future — l'ensemble est une configuration vivante, pas un coup unique.
- ✅ Le classement des mots-clés change quand tu ajoutes une ligne `pricing` supplémentaire — le compteur se met vraiment à jour.

**🤔 Question(s) socratique(s)**

- La liste de mots vides est *ton jugement* (« just », « really » sont de la paille pour toi). Quelle phrase ta liste retiendrait à tort ou rejetterait à tort — et cela rend-il la sortie « phrases clés » biaisée ? Qui possède ce biais ?
- `guest_share` utilise les *mots par invité*, identiques en esprit au temps d'antenne de l'outil de réunion. Quelle est l'alternative qu'un producteur pourrait vouloir — les tours, l'énoncé unique le plus long, ou les mots par minute — et laquelle flatterait un invité qui parle lentement mais monopolise ?

## Étape 5 : Compose la fiche et exporte

L'analyse est terminée ; le produit est deux fichiers — un `episode_notes.txt` lisible par un humain qu'un producteur colle dans les notes d'émission, et un `topics.csv` qui s'entend bien avec n'importe quel tableur pour une comparaison de toute une saison. La composition est le même geste « assemble à partir de pièces déjà testées » que chaque étape de finition précédente.

### 5.1 Écris les deux sorties

```python
# publish.py
import csv
from collections import Counter
from parse import load_episode
from roster import classify
from topic_score import score_topics
from highlights import guest_share, top_words

def publish(episode: str, hosts_file: str) -> None:
    turns = load_episode(episode)
    people = classify(episode, hosts_file)
    topics = score_topics(episode)
    notes = [
        f"EPISODE FACT SHEET — {len(turns)} turns",
        "\nSpeakers:",
        *[f"  {r['speaker']} ({r['role']}, {r['words']} words)"
          for r in people.values()],
        "\nTopics (ranked):",
        *[f"  {t}: {s}" for t, s in topics.most_common()],
        "\nGuest airtime share:",
        *[f"  {n}: {p:.0%}" for n, p in guest_share(people)],
        "\nTop keywords: " + ", ".join(w for w, _ in top_words(episode)),
    ]
    open("episode_notes.txt", "w").write("\n".join(notes))
    with open("topics.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["topic", "word_hits"])
        w.writerows(topics.most_common())

if __name__ == "__main__":
    publish("episode.txt", "hosts.txt")
    print("wrote episode_notes.txt and topics.csv")
```

Deux formats de sortie, une source de nombres : les *mêmes* résultats de fonctions (`classify`, `score_topics`, …) alimentent à la fois le fichier humain et le CSV, donc une fiche qui dit `pricing: 4` et une ligne CSV qui dit `pricing,4` ne peuvent jamais se contredire. `csv.writer` gère les guillemets pour toi (un nom de sujet avec une virgule — `"culture, remote"` — survit comme une seule cellule), ce qu'un `",".join` naïf corromprait silencieusement.

**👟 Indice de départ :** Écris les deux fichiers, puis *ouvre le CSV dans un tableur* (ou `python -c "print(open('topics.csv').read())"`) et confirme deux colonnes, quatre lignes, aucune surprise de guillemets — la vue tableur est une vraie vérification, pas du théâtre.

**🎯 Résultat attendu :** `episode_notes.txt` contenant l'en-tête, les deux intervenants avec rôles et comptages de mots, les sujets classés, Jonas à `100 %`, et la liste de mots-clés — plus `topics.csv` avec un en-tête `topic,word_hits` et quatre lignes de données qui correspondent au classement affiché ligne pour ligne.

**🩹 Si ça ne marche pas :** Si les lignes CSV ne correspondent pas à `episode_notes.txt`, les deux écritures ont utilisé des *appels* différents (re-notés quelque part) — les deux doivent tirer de la variable `topics` calculée une fois, en haut. Si une cellule de sujet arrive entre guillemets contre ton gré, c'est `csv` qui fait son travail (protéger les virgules) ; si une cellule est *fausse*, le `w.writerows` écrit des tuples `most_common()` dont tu devrais afficher l'ordre avant de t'y fier.

### 5.2 Vérifie la publication

**✅ Liste de vérification**

- ✅ Les deux fichiers existent avec des nombres correspondants — la fiche et le CSV sont d'accord sur chaque score de sujet.
- ✅ Le CSV s'ouvre en 5 lignes × deux colonnes dans un tableur, avec `topic,word_hits` en haut.
- ✅ Régénérer un fichier supprimé est une commande (`uv run python publish.py`) — les sorties sont dérivées, jamais maintenues à la main.
- ✅ Réexécuter contre un épisode différent produirait une paire de fichiers différente, toujours bien formatée.

**🤔 Question(s) socratique(s)**

- `episode_notes.txt` et `topics.csv` présentent deux fois les mêmes données. La duplication est-elle un gaspillage — ou est-ce la *fonctionnalité* (un fichier pour les humains, un pour les machines) ? Nomme un troisième consommateur (un script de comparaison de saisons) et dis-moi quel fichier il devrait lire.
- La colonne « topic » est une étiquette que tu as choisie ; le CSV ne fait qu'enregistrer les occurrences. Si deux épisodes différents avaient des fichiers `TOPICS` différents, les CSV ne pourraient pas être comparés en toute sécurité colonne par colonne. Quelle colonne unique (indice : elle commence par `episode`) rendrait le CSV comparable sur toute une saison ?

## ⚠️ Pièges courants

- **Normalisation de nom sensible à la casse.** La transcription dit `Maya`, le registre dit `maya`, et l'Étape 2 crée silencieusement deux personnes — un animateur, un invité, tous deux réels. La mise en minuscules *au moment de l'analyse* et encore dans la vérification `name in hosts` du classificateur est l'entonnoir ; saute l'une et un registre parfaitement propre mal-sépare ses propres animateurs.
- **Le comptage de sous-chaînes qui gonfle les scores de sujets.** `count("team")` trouve le `team` à l'intérieur de `steam` et `teams`, donc `culture` score sur des mots qui n'ont rien à voir. La correction bon marché est le test au niveau du jeton (`w in words`) plutôt que le comptage de mots ; celle *honnête* consiste à documenter que le comptage de sous-chaînes est une première passe et à lire la section des pièges avant de te fier à des tendances sur toute une saison.
- **Un fichier de registre qui est le point de défaillance unique.** Une faute de frappe (`Mayya`) fait mal-classifier à toute la fiche l'animateur de l'émission comme son propre invité — et rien n'est alerté. Garde avec une vérification de complétude : avant de publier, chaque nom d'intervenant de la transcription doit se résoudre en animateur ou en invité, et les noms inconnus devraient échouer bruyamment ou au moins s'afficher bruyamment.
- **La paille des mots vides qui gâche les mots-clés.** Sans le filtre `STOP`, « the », « and », « really » dominent la sortie « mots-clés principaux » et la fiche se lit comme un débit de parole, pas comme du contenu. L'ensemble est un fichier de configuration que tu dois maintenir par émission — le « ratio » d'un podcast financier est le « bank » de quelqu'un d'autre, donc entretiens-le ou regarde la liste dériver.
- **Les surprises de guillemets dans le CSV.** Un sujet nommé `"culture, remote"` brise une sortie `",".join` faite à la main en deux cellules. `csv.writer` existe précisément pour cela ; utilise-le, et ne fabrique jamais de CSV par concaténation de chaînes — les règles d'échappement sont plus subtiles qu'elles n'en ont l'air.

## Ce que tu viens de construire

Un analyseur de podcasts fonctionnel : transcription en entrée, un `episode_notes.txt` de fiche et un `topics.csv` en sortie — animateurs et invités séparés, sujets classés par poids de mots-clés, temps d'antenne des invités quantifié, et mots-clés de contenu distillés. Chaque chiffre est vérifiable indépendamment à la main, car tout le pipeline est de l'analyse, de l'appartenance d'ensemble et du `Counter` — sans boîte noire nulle part. La compétence transférable est l'idée de *co-occurrence de mots-clés* : « de quoi parle ce texte ? » comme un problème de comptage sur un dictionnaire d'étiquettes et de déclencheurs, la même primitive qui se trouve sous l'étiquetage de documents, le filtrage de spam, les modélisateurs de sujets, et la première étape de la plupart des pipelines d'analyse de contenu que tu rencontreras.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/podcast-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/podcast-analyzer) dans le dépôt du cours regroupe les modules d'analyse, de registre, de notation, de points saillants et de publication, plus l'épisode d'exemple et un notebook qui exécute chaque étape dans l'ordre. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et produis une fiche dans un onglet de navigateur.
:::

## Où aller à partir d'ici

- **Comparaison de saisons :** boucle un `publish` sur chaque fichier d'épisode, regroupe les lignes `topics.csv` par épisode dans un CSV de saison, et classe « cette saison est passée de pricing à culture » — la colonne CSV ajoutée dans la question socratique de l'Étape 5 rendue réelle.
- **Mots-clés bigrammes :** remplace le comptage de mots uniques par des fenêtres de deux mots (`"remote culture"`, `"word of mouth"`) — le même `Counter`, une nouvelle étape de tokenisation, des phrases clés dramatiquement meilleures.
- **Un drapeau `--episode`** qui estampille le slug de l'épisode dans l'en-tête des notes et le CSV — 10 lignes, et rend instantanément chaque sortie attribuable.
- **Accroche de transcription (optionnel) :** si tu as un outil de parole-en-texte de niveau gratuit (whisper.cpp sur ton ordinateur portable compte), une petite étape `subprocess` convertit d'abord un `.mp3` en ce format de transcription — chaque étape après l'Étape 1 s'exécute déjà sur sa sortie, sans aucune modification.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier — une fiche qui a parfaitement résumé un vrai épisode, un CSV plein des données de ta propre émission ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README t'accompagne dans l'ajout du tien via une **pull request** de bout en bout : forker, créer une branche, commiter, et ouvrir la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
