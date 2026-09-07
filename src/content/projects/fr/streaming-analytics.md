---
title: "Moteur d'Analytique de Streaming"
description: "Traitez des flux de données en temps réel avec des agrégations par fenêtre, des jointures et la détection de patterns."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["generators", "data-processing", "real-time"]
learningObjectives:
  - Construire un générateur d'événements de type infini avec des générateurs Python
  - "Agréger un flux avec une fenêtre de temps glissante"
  - Détecter des pics par rapport à une ligne de base glissante
  - "Joindre deux flux d'événements corrélés"
  - Appliquer une contre-pression à tampon borné sans perdre le pipeline central
prerequisites:
  - "Les bases de Python (fonctions, boucles, dictionnaires)"
  - "Être à l'aise avec les générateurs et yield"
  - "Une compréhension de base des listes et du calcul du temps"
---

# 🛠️ ⚡ Moteur d'Analytique de Streaming

Les tableaux de bord qui affichent « utilisateurs actifs en ce moment » ne recalculent pas toute la base de données à chaque instant — ils consomment un flux sans fin d'événements et gardent une petite fenêtre constamment mise à jour de ce qui vient de se passer. Ce projet construit ce moteur en Python pur : un générateur qui émet un flux d'événements réaliste, une fenêtre glissante qui maintient les moyennes à jour, la détection de pics par rapport à une ligne de base glissante, une jointure qui corrèle les achats aux pages vues qui les ont précédés, et enfin un tampon borné pour qu'une rafale d'événements ralentisse le pipeline au lieu de faire exploser sa mémoire.

Cela suppose Python 101 et une certaine aisance avec les générateurs — aucun paquet externe ni rien d'Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Écrire un générateur qui émet un flux sans fin apparent d'événements horodatés.
2. Garder une fenêtre de temps glissante et afficher une moyenne à jour à chaque frontière.
3. Signaler les événements qui dépassent une ligne de base glissante, pas un nombre fixe.
4. Joindre les événements d'achat à la page vue précédente de chaque utilisateur.
5. Borner le pipeline avec un tampon plafonné et exécuter chaque étape de bout en bout.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal. Ce moteur est uniquement de la bibliothèque standard pure — `uv init` et tu es immédiatement opérationnel — et chaque étape est une fonction que tu peux appeler, inspecter et relancer depuis un terminal exactement comme écrit ci-dessous.

**Google Colab, Kaggle Notebooks et Binder** exécutent chaque étape à l'identique, car il n'y a aucune dépendance externe à installer ni fichier à conserver entre les cellules. L'honnêteté impose de préciser : les cellules d'un notebook remplacent la *sortie terminal* de ce moteur par la sortie du notebook, donc ce que tu perds, c'est le ressenti « relance le flux et regarde-le changer ». Utilise les badges pour voir tout le pipeline en un clic, et passe au `uv` local une fois que tu veux pointer le générateur vers un vrai fichier ou une vraie socket.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/streaming-analytics/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/streaming-analytics/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fstreaming-analytics%2Fnotebook.ipynb)

## Configuration

Crée le projet. Comme le moteur n'utilise que la bibliothèque standard, il n'y a rien à installer.

```bash
uv init streaming-analytics
cd streaming-analytics
```

```bash
uv run python -c "from collections import deque; import random, datetime; print('ok')"
```

Ces trois imports couvrent toute la surface de dépendances de ce projet : `deque` pour les fenêtres glissantes (à partir de l'Étape 2), `random` pour le flux synthétique (Étape 1), et `datetime`/`timedelta` pour les horodatages d'événements sur lesquels chaque fenêtre est mesurée.

**✅ Liste de vérification**

- ✅ `uv init streaming-analytics` a créé un dossier avec un `pyproject.toml`.
- ✅ `uv run python -c "from collections import deque; import random, datetime"` affiche `ok` — zéro paquet ajouté.

## Étape 1 : Construis un générateur de flux d'événements en direct

Chaque moteur d'analytique commence au même endroit : des événements qui arrivent un par un, pour toujours. Les générateurs Python sont la manière honnête de modéliser cela — une fonction qui `yield` des événements paresseusement ressemble exactement à un flux en direct pour tout ce qui est en aval, sans avoir réellement besoin d'un serveur.

### 1.1 Émets des événements horodatés

**👟 Indice de départ :** Crée une dataclass pour la forme de l'événement, puis un générateur qui `yield` un événement par itération avec un horodatage seedé et monotone croissant.

```python
# stream.py
import random
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class Event:
    ts: datetime
    kind: str
    value: float

def event_stream(events: int = 50, seed: int = 3):
    """Yield events lazily, as if arriving from a live feed."""
    random.seed(seed)
    now = datetime(2026, 1, 1, 9, 0, 0)
    for _ in range(events):
        kind = random.choice(["view", "click", "purchase"])
        value = {"view": random.randint(5, 15),
                 "click": random.randint(1, 4),
                 "purchase": random.choice([0, 1])}[kind]
        now += timedelta(seconds=random.randint(1, 3))
        yield Event(ts=now, kind=kind, value=value)

for ev in event_stream(5):
    print(ev.ts.strftime("%H:%M:%S"), ev.kind, ev.value)
```

La `@dataclass` te donne un `Event` lisible et immuable sans écrire de constructeur. Le générateur est l'idée porteuse : `event_stream` ne calcule rien tant qu'on ne l'*itère* pas, et chaque `yield` le suspend en pleine boucle — exactement la forme d'un flux qui continue de produire après que tu as consommé 50 événements. Les horodatages avancent de 1 à 3 secondes aléatoires par événement, pour que les fenêtres et jointures ultérieures aient un timing réaliste et irrégulier avec lequel travailler plutôt qu'un tic parfaitement régulier.

**🎯 Résultat attendu :** Cinq lignes comme `09:00:00 click 3`, chacune avec un horodatage plus tard que le précédent et un des trois types d'événement.

**🩹 Si ça ne marche pas :** Si chaque horodatage est identique, c'est que `now +=` manque, donc l'horloge n'avance jamais. Si itérer deux fois donne des types différents, c'est que `random.seed(seed)` manque, rendant le flux non reproductible. Si `Event` semble non picklable ou verbeux, c'est que le décorateur `@dataclass` manque, donc les raccourcis d'égalité/`__repr__` n'existent pas.

### 1.2 Vérifie le flux

**✅ Liste de vérification**

- ✅ `event_stream(5)` affiche 5 événements avec des horodatages strictement croissants.
- ✅ Le même seed produit la même séquence d'événements à chaque exécution.
- ✅ Tu peux expliquer pourquoi un *générateur* modélise un flux en direct mieux que de retourner une liste pré-construite.

**🤔 Question(s) socratique(s)**

- Quand tu appelles `event_stream(50)`, aucun événement n'existe encore — où la mémoire du code est-elle dépensée avant le premier appel `next()`, et pourquoi est-ce exactement ce qu'un consommateur réel de flux veut ?
- Chaque événement avance l'horloge de 1 à 3 secondes aléatoires. Qu'est-ce qui changerait dans les fenêtres de l'Étape 2 si `timedelta` était toujours exactement de 2 secondes ?

## Étape 2 : Ajoute une fenêtre de temps glissante

Un flux que tu ne peux pas résumer n'est que du bruit. Cette étape construit une fenêtre glissante — « les 10 dernières secondes d'événements, gardées fraîches » — et émet une moyenne glissante chaque fois que la fenêtre avance, ce qui est la forme d'un chiffre d'« activité récente » en direct.

### 2.1 Agrège les dernières `window_s` secondes

**👟 Indice de départ :** Utilise une `deque` comme fenêtre, pousse chaque événement à droite, `popleft` ce qui est plus vieux que `window_s` à gauche, et émet la moyenne quand l'horloge franchit une frontière d'étape.

```python
# stream.py (continuation)
from collections import deque

def windowed_average(stream, window_s: int = 10, step_s: int = 3):
    """Emit the average of the last window_s seconds at each step boundary."""
    window: deque[Event] = deque()
    boundary = None
    for ev in stream:
        window.append(ev)
        while (ev.ts - window[0].ts).total_seconds() > window_s:
            window.popleft()
        if boundary is None or ev.ts >= boundary:
            boundary = ev.ts + timedelta(seconds=step_s)
            avg = sum(e.value for e in window) / len(window)
            yield ev.ts, round(avg, 2)

for ts, avg in windowed_average(event_stream(30), window_s=10, step_s=4):
    print(ts.strftime("%H:%M:%S"), "window avg:", avg)
```

Deux choses rendent cela en O(1)-ish par événement au lieu d'un re-scan de l'historique : la `deque` — dont `.append` à droite et `.popleft` à gauche sont tous deux en temps constant — et la boucle `while` qui expulse les événements périmés en comparant à `window[0]`, le plus ancien survivant. Comme les événements arrivent par ordre d'horodatage, un seul contrôle sur l'extrémité gauche suffit à garder toute la fenêtre fraîche. La logique `boundary` est ce qui transforme une fenêtre continue en *sortie* périodique : elle ne yield que lorsque le dernier événement a dépassé la prochaine frontière d'étape, donc tu obtiens une moyenne lisible par étape au lieu d'une par événement.

**🎯 Résultat attendu :** Quelques lignes imprimées, ex. `09:00:13 window avg: 6.67`, une par frontière d'étape, chacune couvrant environ les 10 dernières secondes simulées.

**🩹 Si ça ne marche pas :** Si la moyenne de chaque ligne est énorme, c'est que le `while` d'expulsion manque, donc la fenêtre grandit sans fin. Si rien ne s'affiche, le flux que tu as passé a moins d'événements qu'une étape — passe un nombre `events` plus grand. Si les horodatages semblent se chevaucher bizarrement, c'est que `window_s`/`step_s` sont inversés, rendant la fenêtre plus longue que l'entrée.

### 2.2 Vérifie la fenêtre

**✅ Liste de vérification**

- ✅ Une moyenne s'affiche environ toutes les 4 secondes simulées, chacune couvrant les ~10 secondes précédentes.
- ✅ La taille de la fenêtre reste bornée : relancer avec plus d'événements n'augmente jamais le nombre d'événements détenus à la fois.
- ✅ Tu peux expliquer pourquoi `window[0]` est le seul contrôle d'expiration nécessaire.

**🤔 Question(s) socratique(s)**

- La fenêtre émet des moyennes sur une *frontière d'étape* fixe plutôt que par événement. Dans quel tableau de bord réel l'échantillonnage-sur-frontière dériverait-il mal, et que changerais-tu pour émettre exactement par événement à la place ?
- La fenêtre stocke `value` et recalcule la somme à chaque émission. Quelles variables courantes séparées rendraient l'émission de la moyenne réellement à temps constant, quelle que soit la longueur de la fenêtre ?

## Étape 3 : Détecte des pics par rapport à une ligne de base glissante

La détection d'anomalies sur un flux ne peut pas utiliser un seuil fixe — le trafic culmine naturellement à midi et meurt à 3h du matin. Cette étape signale les événements qui dépassent une *ligne de base glissante*, donc « trop haut » signifie « haut pour maintenant ».

### 3.1 Signale les événements au-dessus de la moyenne en direct

**👟 Indice de départ :** Garde une `deque` des valeurs récentes comme ligne de base, calcule sa moyenne, et yield tout ce qui dépasse la moyenne d'un multiplicateur configuré.

```python
# stream.py (continuation)
def detect_spikes(stream, window_s: int = 15, multiplier: float = 3.0):
    """Yield events whose value exceeds `multiplier * recent-average`."""
    recent: deque[Event] = deque()
    for ev in stream:
        recent.append(ev)
        while (ev.ts - recent[0].ts).total_seconds() > window_s:
            recent.popleft()
        baseline = sum(e.value for e in recent) / len(recent)
        if baseline > 0 and ev.value > multiplier * baseline:
            yield ev.ts, ev.kind, ev.value, round(baseline, 2)

for ts, kind, value, baseline in detect_spikes(event_stream(200), window_s=15, multiplier=2.5):
    print(ts.strftime("%H:%M:%S"), f"{kind:>8} {value:>3} vs baseline {baseline}")
```

La perspicacité est de comparer à *où se trouve le flux en ce moment*, pas à une moyenne globale. Avec `multiplier=2.5`, une `view` de 25 déclenche une alerte quand les 15 dernières secondes ont moyenné 10, mais la *même* valeur reste silencieuse si la ligne de base est déjà à 30 — car un événement normal pendant une période chargée est un pic pendant une période calme. Le garde-fou `baseline > 0` compte : une fenêtre qui contient par hasard uniquement des zéros ne doit pas transformer la comparaison en un pathologique `0 > 0` divise-par-n'importe-quoi.

**🎯 Résultat attendu :** Moins de lignes de sortie que d'événements d'entrée (200 → environ une poignée), chacune montrant une valeur d'événement bien au-dessus de sa propre ligne de base glissante — jamais une inondation de chaque événement.

**🩹 Si ça ne marche pas :** Si *chaque* événement s'affiche, le multiplicateur est trop bas ou la fenêtre de ligne de base est si courte qu'elle ne contient jamais que le seul événement le plus fort. Si deux sorties consécutives partagent le même horodatage, c'est que le `while` d'expulsion manque, donc la ligne de base inclut les événements *passés* pour toujours. Si rien ne s'affiche du tout, `multiplier=2.5` est peu probable avec le seed que tu utilises — essaie 1.5 pour voir les détections se déclencher.

### 3.2 Vérifie la détection de pics

**✅ Liste de vérification**

- ✅ `detect_spikes` n'affiche qu'une petite fraction du flux.
- ✅ La valeur de chaque événement signalé dépasse 2,5× sa propre ligne de base glissante.
- ✅ Tu peux expliquer pourquoi la même valeur absolue est parfois un pic et parfois non.

**🤔 Question(s) socratique(s)**

- Une semaine lente et régulière signifie que la ligne de base glissante *est* le pic — une montée progressive ne dépasse jamais 2,5×. Quel test supplémentaire attraperait une tendance qui passe de 10 à 30 sur une heure ?
- Le multiplicateur est constant. Comment se comporterait le détecteur sur une plateforme normalement calme mais avec une rafale annuelle légitime, et de quoi aurais-tu besoin pour garder l'alerte utile pendant cette rafale ?

## Étape 4 : Joins deux flux corrélés

Une page vue solitaire est banale ; une page vue suivie rapidement d'un *achat* du même utilisateur est l'histoire. Les jointures corrèlent les événements qui référencent la même clé (ici, un utilisateur) dans un budget de temps — le parent calme d'un `JOIN` SQL, fait sur le temps plutôt que sur des tables.

### 4.1 Corrèle les achats aux vues antérieures

**👟 Indice de départ :** Donne au flux une clé `user`, mémorise l'heure de la page vue la plus récente de chaque utilisateur, et yield une ligne « convertie » quand un achat arrive dans la fenêtre de rétrospective.

```python
# stream.py (continuation)
def user_stream(events: int = 80, seed: int = 5):
    random.seed(seed)
    users = [f"u{i}" for i in range(8)]
    now = datetime(2026, 1, 1, 9, 0, 0)
    for _ in range(events):
        uid = random.choice(users)
        kind = random.choices(["page_view", "purchase"], weights=[80, 20])[0]
        now += timedelta(seconds=random.randint(1, 4))
        yield {"ts": now, "user": uid, "kind": kind}

def correlated_join(stream, lookback_s: int = 30):
    """Yield (user, seconds-after-view) for purchases within lookback_s of a view."""
    last_view: dict[str, datetime] = {}
    for ev in stream:
        if ev["kind"] == "page_view":
            last_view[ev["user"]] = ev["ts"]
        elif ev["kind"] == "purchase" and ev["user"] in last_view:
            age = (ev["ts"] - last_view[ev["user"]]).total_seconds()
            if age <= lookback_s:
                yield ev["user"], round(age, 1), "converted"

for user, age, label in correlated_join(user_stream(120)):
    print(f"{user} purchased {age}s after viewing -> {label}")
```

La jointure est un dictionnaire indexé par la clé de jointure (`user`) plus un budget de temps : `last_view` ne mémorise que la vue la plus récente de chaque utilisateur, et un achat la consulte plutôt que de re-scanner tous les événements antérieurs. La comparaison `age <= lookback_s` est ce qui transforme une corrélation inconditionnelle en une corrélation bornée dans le temps — un achat cinq minutes après une vue n'est probablement pas le même parcours. Comme le tampon stocke un horodatage par utilisateur actif, sa mémoire est proportionnelle au nombre d'utilisateurs distincts, pas au nombre d'événements — la même raison pour laquelle les vrais moteurs gardent un état par clé et font expirer les clés obsolètes.

**🎯 Résultat attendu :** Une poignée de conversions imprimées (environ 20 % des événements sont des achats, et seule une partie a une vue dans les 30 s), chacune comme `u3 purchased 12.3s after viewing -> converted`.

**🩹 Si ça ne marche pas :** Si chaque achat se convertit, c'est que le contrôle `age <= lookback_s` n'est pas là ou que `lookback_s` est énorme. Si rien ne se convertit, les valeurs `kind` de `user_stream` ne correspondent pas aux chaînes que la jointure contrôle. Si l'*ancienne* vue d'un utilisateur continue de correspondre à des achats des minutes plus tard, `last_view[user] = ev["ts"]` ne s'écrase que sur les vues comme prévu — mais les clés obsolètes ne sont jamais expulsées, ce qui est la dérive à surveiller dans un flux long.

### 4.2 Vérifie la jointure

**✅ Liste de vérification**

- ✅ Chaque conversion yieldée montre un achat arrivant après la vue de son utilisateur.
- ✅ Le nombre de lignes de sortie est bien inférieur au nombre d'achats (jointure bornée dans le temps).
- ✅ Tu peux nommer la clé de jointure (`user`) et le budget de temps (`lookback_s`) sans regarder le code.

**🤔 Question(s) socratique(s)**

- La jointure ne met en tampon que la vue la *plus récente* par utilisateur. Qu'est-ce qui changerait dans les conversions si tu mettais plutôt en tampon la première vue de la journée de l'utilisateur ?
- Les vraies jointures de flux doivent aussi *expirer* les clés que personne ne touche. Si `lookback_s` bornait la fenêtre de jointure, pourquoi le dict `last_view` n'est-il pas déjà borné — et que pourrait grandir sans borne dans une jointure de longue durée ?

## Étape 5 : Borne le pipeline avec de la contre-pression

Un vrai flux peut dépasser son consommateur — une rafale de mille événements empêche le processus de suivre, et la réponse naïve (tout garder) est la façon dont un pic d'une seconde devient un crash hors-mémoire. La contre-pression signifie que le consommateur *dit* au producteur de ralentir, rendu ici honnêtement comme un tampon borné qui lâche plutôt que de grandir.

### 5.1 Ajoute un tampon borné et exécute tout

**👟 Indice de départ :** Plafonne la pile en attente à `max_pending` événements, appelle un hook quand le plafond est atteint, puis compose chaque étape pour que tout le moteur tourne depuis un seul `__main__`.

```python
# stream.py (continuation)
def with_backpressure(stream, max_pending: int = 8, on_overflow=None):
    """Mirror a bounded queue: absorb up to max_pending events, drop the rest."""
    on_overflow = on_overflow or (lambda ev: None)
    pending: list = []
    for ev in stream:
        if len(pending) < max_pending:
            pending.append(ev)
        else:
            on_overflow(ev)
    return pending

def main() -> None:
    dropped: list = []
    def count_drop(ev): dropped.append(ev)

    feed = event_stream(300)
    buffered = with_backpressure(feed, max_pending=8, on_overflow=count_drop)

    windows = list(windowed_average(iter(buffered), window_s=10, step_s=4))
    spikes = list(detect_spikes(iter(buffered), window_s=15, multiplier=2.5))
    joins = list(correlated_join(user_stream(200)))

    print(f"buffered: {len(buffered)}  dropped: {len(dropped)}")
    print(f"windows emitted: {len(windows)}  spikes: {len(spikes)}  conversions: {len(joins)}")

if __name__ == "__main__":
    main()
```

`with_backpressure` rend le compromis visible : jusqu'à `max_pending` événements attendent en ligne, tout ce qui dépasse est *lâché* et rapporté via le hook `on_overflow` au lieu d'être perdu en silence ou thésaurisé en silence. Composer chaque étape sur `iter(buffered)` montre l'autre propriété qui vaut la peine d'être testée — chaque fonction en aval des Étapes 2 à 4 consomme n'importe quel itérable paresseusement, donc le pipeline reste une chaîne de petits lecteurs plutôt qu'une seule boucle monolithique. Le compteur `main()` donne un signal de bout en bout : fenêtres, pics et conversions tous calculés depuis le même flux borné, avec le dépassement visible comme un nombre plutôt qu'un crash.

**🎯 Résultat attendu :** Un bloc de synthèse unique, ex. `buffered: 300  dropped: 0  windows emitted: 54  spikes: 9  conversions: 4` — chaque étape a tourné, rien n'a levé.

**🩹 Si ça ne marche pas :** Si un `TypeError` sur un argument manquant apparaît, c'est qu'une étape reçoit le *résultat* d'une étape au lieu d'un itérable — passe `iter(buffered)` de façon cohérente. Si `dropped` est non nul sur un flux de 300 événements, `max_pending=8` est atteint en plein flux, ce qui est un comportement correct ; confirme que lâcher correspondait à ton intention avant de paniquer. Si `detect_spikes` a besoin d'un flux plus long, augmente le nombre d'`events`, pas le multiplicateur.

### 5.2 Vérifie de bout en bout

**✅ Liste de vérification**

- ✅ `uv run python stream.py` affiche le bloc de synthèse sans traceback.
- ✅ Chaque étape de la liste a consommé le même flux `buffered` borné.
- ✅ `main()` est gardé par `if __name__ == "__main__":` pour qu'importer `stream.py` dans un test ne lance pas le pipeline.

**🤔 Question(s) socratique(s)**

- `with_backpressure` lâche des événements plutôt que de bloquer le producteur. Que *perd* un consommateur en lâchant pendant une rafale, et qu'enregistrerais-tu à côté de chaque événement lâché pour rendre la perte auditable ?
- Les quatre étapes lisent la même liste `buffered` en séquence, donc tout le pipeline doit finir l'Étape 1 avant que l'Étape 2 ne commence. Qu'est-ce qui changerait dans la latence si les étapes tournaient *en parallèle* — et quel problème de synchronisation devrais-tu soudainement résoudre ?

## ⚠️ Pièges courants

- **Régénérer ton flux à mi-chemin du pipeline.** Les étapes consomment les itérateurs une seule fois ; appeler `event_stream()` une seconde fois produit un flux (seedé) tout neuf, donc fenêtres et pics calculent sur des événements *différents* et les nombres divergent. Correction : génère une fois et passe-le (ou `iter(buffered)`) à chaque étape, comme à l'Étape 5.
- **Des fenêtres qui n'expulsent jamais.** Oublier la boucle `while … popleft` fait grandir la fenêtre pour toujours, donc la « moyenne des 10 dernières secondes » devient silencieusement « la moyenne de tout jusqu'ici ». Correction : expulse toujours depuis l'extrémité gauche après avoir ajouté.
- **Comparer un seuil fixe au lieu d'une ligne de base.** Un `value > 25` codé en dur déclenche constamment pendant les heures chargées et jamais pendant les heures calmes ; c'est `multiplier * rolling_average` de l'Étape 3 qui garde les détections relatives au trafic courant.
- **Des jointures sur un dictionnaire qui ne vieillit jamais.** `last_view` grandit d'un emplacement par utilisateur distinct et ne rétrécit jamais, donc une jointure de longue durée fuit la mémoire. Correction : fais expirer les clés obsolètes que tu n'as pas vues dans la fenêtre de rétrospective.
- **Des tampons bornés qui lâchent en silence.** Un vrai design de contre-pression ne peut pas simplement `discard` ; il doit faire surface du dépassement. Le hook `on_overflow` de l'Étape 5 fait la différence entre un lâcher instrumenté et une perte de données silencieuse.

## Ce que tu viens de construire

Un moteur d'analytique de streaming fonctionnel : un générateur d'événements, un résumeur à fenêtre glissante, une détection de pics à ligne de base glissante, une jointure bornée dans le temps, et un tampon borné avec contre-pression visible — chaque étape une petite fonction composable en Python pur, sans paquet tiers. La compétence transférable est *traiter les données à mesure qu'elles arrivent plutôt qu'après leur stockage* : une fois que tu as construit une fenêtre `deque` et un générateur, les tableaux de bord en direct, les boucles de surveillance et les processeurs d'événements cessent d'être mystérieux et deviennent les mêmes cinq fonctions.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/streaming-analytics/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/streaming-analytics) dans le dépôt du cours est une version plus complète du code ci-dessus, y compris un flux d'événements imprimable et une ventilation par étape. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Pointe le générateur vers une source réelle — un fichier auquel on ajoute, ou une socket — pour que le « flux » soit de vrais événements en direct au lieu d'un hasard seedé.
- Ajoute la sessionisation à la jointure : regroupe les vues d'un utilisateur en une session logique, puis attribue un achat à la session dans laquelle il est tombé (c'est ainsi que les vrais outils d'attribution rapportent les « conversions par session »).
- Remplace la moyenne recalculée de `windowed_average` par des variables `count`/`sum` incrémentales pour que l'émission soit à temps constant quelle que soit la longueur de la fenêtre.
- Persiste fenêtres et pics dans un fichier JSONL avec un writer flush-par-lot, transformant le pipeline en direct en quelque chose qu'un tableau de bord peut lire.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
