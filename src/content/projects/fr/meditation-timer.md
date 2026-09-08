---
title: "Minuteur de Méditation"
description: "Sessions de méditation guidées avec sons ambiants, exercices de respiration et suivi des séries."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["cli", "time", "file-io", "gamification"]
learningObjectives:
  - "Exécuter des attentes bloquantes et non bloquantes avec time.sleep et l'attente coopérative"
  - "Compter à rebours depuis une durée et déclencher un signal à chaque intervalle"
  - "Demander un retour et ajouter des lignes structurées à un journal de sessions CSV"
  - "Calculer des séries sur des dates avec datetime et l'arithmétique de dates"
prerequisites: ["python-101/loops", "python-101/functions", "python-101/file-io", "python-101/date-time"]
---

# 🧘 Construire un Minuteur de Méditation

S'asseoir pour une méditation minutée a un problème qu'aucune application au monde n'est autorisée à régler — le téléphone qui bourdonne, les publicités, la séance de culpabilisation sur la série *avant* même que tu closes les yeux. Un minuteur de terminal n'a rien de tout cela : une invite simple, un compte à rebours, une cloche douce, on répète. Ce projet construit un petit CLI qui compte à rebours une session, sonne à chaque intervalle (pour que tu n'aies pas à vérifier l'horloge), guide un cycle de respiration en boîte 4-4-4-4, et journalise discrètement chaque session pour que tu puisses voir ta série grandir sans aucun jugement sur les jours de repos.

Ceci suppose Python 101 — boucles, fonctions, lecture et écriture de fichiers, et la gestion de base des dates. Rien au-delà : pas d'interface graphique, pas de web, pas de services externes. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Compter à rebours une session de méditation depuis des minutes jusqu'à un signal agréable « inspire / expire ».
2. Déclencher une cloche (cloche de terminal) toutes les N minutes pour ne jamais avoir à ouvrir les yeux pour vérifier.
3. Guider un cycle de respiration en boîte où chaque phase a son propre compte à rebours.
4. Journaliser chaque session terminée dans un CSV avec la date, la durée et une note d'humeur en une ligne.
5. Relire le journal et rapporter ta série actuelle et tes minutes totales de méditation.
6. Gérer Ctrl+C avec élégance pour qu'un arrêt en plein milieu de session se souvienne des minutes d'aujourd'hui — exactement comme une app de série qui pardonne.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — et honnêtement le *seul* où les charmes du minuteur atterrissent, parce que les cloches et les signaux de respiration ont besoin soit d'un vrai `time.sleep` contre un terminal vivant, soit au moins d'une vraie horloge murale pour ressembler à un minuteur. Tout ce qui suit fonctionne aussi bien sur l'un des trois chemins notebook, mais un minuteur de méditation dans un notebook, c'est un métronome dans une feuille de calcul : la mécanique est là, l'intérêt n'y est pas.

**GitHub Codespaces** revient au même que le local — ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et un court `uv run python meditate.py --minutes 1` fait une véritable session honnête d'une minute dans l'onglet de terminal.

**Google Colab, Kaggle Notebooks et Binder sont une façon raisonnable de *voir le code s'exécuter* — la logique de compte à rebours, le cycle de respiration, le journal CSV et les maths de série s'exécutent tous pour de vrai** — mais le notebook exécute chaque étape comme un instantané rapide et visible plutôt que comme une expérience réelle de temps qui s'écoule (une cellule `time.sleep` de 10 minutes est une mauvaise méditation). Utilise le notebook pour apprendre la mécanique ; lance la commande pour de vrai quand tu veux que le minuteur chronomètre réellement quelque chose.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meditation-timer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meditation-timer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeditation-timer%2Fnotebook.ipynb)

## Configuration

Tout ce dont tu as besoin avant ta première session : `uv`, et un dossier pour accueillir le projet.

### Installe `uv` et mets en place le projet

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
mkdir meditation-timer && cd meditation-timer
uv init --bare
```

Zéro package supplémentaire — ce projet est en pur bibliothèque standard (`time`, `datetime`, `csv`).

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `meditation-timer/` existe avec un `pyproject.toml` issu de `uv init --bare`.
- ✅ Tu peux exécuter `uv run python -c "import time, datetime; print('time is real')"` et voir le message.
- ✅ Tu sais ce qu'est une cloche de terminal (sur la plupart des systèmes c'est `\a` dans une chaîne, et elle bipe ou clignote). Nous l'entendrons à l'étape 2.

## Étape 1 : Compte à rebours d'une session simple

Un minuteur n'est qu'une boucle sur les secondes qui te restent, imprimant le temps restant et dormant une seconde par battement. Le modèle mental ici est celui que tu réutiliseras pour les pauses, les intervalles et le cycle de respiration : *décide combien de temps durent les choses, puis laisse la boucle vider cette durée un battement à la fois.*

### 1.1 Écris un minuteur comptant les minutes

```python
# meditate.py
import time

def countdown(minutes: int) -> None:
    total = minutes * 60
    print(f"Session: {minutes} min — begin. 🧘")
    for remaining in range(total, 0, -1):
        print(f"\r{remaining // 60:02d}:{remaining % 60:02d} left", end="", flush=True)
        time.sleep(1)
    print("\r00:00 left — done. Enjoy the quiet. 🙏")

if __name__ == "__main__":
    countdown(1)  # start with one real minute
```

`range(total, 0, -1)` descend *depuis* le total de secondes jusqu'à 1, et chaque itération imprime le temps restant puis bloque sur `time.sleep(1)`. Le retour chariot `\r` (avec `end=""` et `flush=True`) réécrit la même ligne sur place au lieu d'imprimer 60 lignes, et `//` plus `%` découpent les secondes en `MM:SS` pour une horloge qui se lit comme un vrai minuteur.

**👟 Indice de départ :** Exécute `countdown(1)` et *assieds-toi à travers la minute entière* — tu ressentiras pourquoi `\r` bat 60 lignes imprimées, et pourquoi un `time.sleep` d'une seconde dans la boucle est tout le battement de cœur d'un minuteur.

**🎯 Résultat attendu :** Une ligne qui affiche `01:00 left`, défile en place jusqu'à `00:00 left`, puis imprime le message de fin — 60 secondes complètes plus tard.

**🩹 Si ça ne marche pas :** Si 60 lignes s'impriment au lieu d'une ligne écrasée, le trio `\r`/`end=""`/`flush=True` n'est pas au complet — le retour chariot seul (sans `flush=True`) ne se redessine souvent pas dans une sortie capturée. Si le compte à rebours se termine instantanément, `time.sleep(1)` a peut-être été placé *hors* de la boucle — il doit battre à chaque itération.

### 1.2 Vérifie le compte à rebours

**✅ Liste de vérification**

- ✅ `countdown(1)` prend de vraies 60 secondes et trace une seule ligne `MM:SS` qui atteint `00:00`.
- ✅ `countdown(5)` formate `05:00` → `04:59` → … sans en sauter — la math `// 60`/`% 60` est stable.
- ✅ `countdown(0)` imprime le message de fin immédiatement (une session-zéro honnêtement pythonesque).

**🤔 Question(s) socratique(s)**

- La boucle dort exactement 1 seconde par battement mais *imprimer prend aussi du temps*, donc le temps réel écoulé dépasse toujours légèrement `minutes * 60`. Où la dérive s'accumule-t-elle — et quelle réécriture basée sur `time.monotonic()` (calcule l'échéance, puis `sleep` jusqu'à elle) garderait un minuteur de 10 minutes honnête à la seconde près ?
- Après la boucle, remaining vaut `0` — mais tu ne *vois* jamais d'itération `00:00`, seulement le message post-boucle. Quel unique changement ferait imprimer une vraie ligne `00:00` comme partie de la progression de la boucle plutôt que comme message de fin ?

## Étape 2 : Cloche à chaque intervalle

Un minuteur de méditation qui ne sait pas faire de cloches d'intervalle n'est pas un minuteur de méditation — tout l'intérêt est un signal à des points fixes pour ne jamais vérifier l'horloge en plein milieu de session. Sur un terminal, « la cloche » est le modeste caractère `\a` (BEL) : dans la plupart des terminaux il bipe ou clignote de façon invisible, et même là où il ne le fait pas, le `bell()` Python via `print("\a", end="")` est la même primitive dont les grosses apps tirent leur son sous le capot.

### 2.1 Ajoute les cloches d'intervalle

```python
# meditate.py (continued)

def countdown_with_bells(minutes: int, bell_every: int = 5) -> None:
    total = minutes * 60
    print(f"Session: {minutes} min, bell every {bell_every} min — begin. 🧘")
    for remaining in range(total, 0, -1):
        el = total - remaining                        # seconds elapsed since the start
        if el % (bell_every * 60) == 0 and el > 0:    # exactly on an interval boundary
            print(f"\n   +bell at {el // 60:02d}:00   ({remaining // 60:02d}:{remaining % 60:02d} left)\a",
                  flush=True)
        print(f"\r{remaining // 60:02d}:{remaining % 60:02d} left", end="", flush=True)
        time.sleep(1)

if __name__ == "__main__":
    countdown_with_bells(2, bell_every=1)  # 2 minutes, chime at the 1-minute mark
```

La ligne qui fait fonctionner les cloches est `el % (bell_every * 60) == 0` — les secondes écoulées modulo l'intervalle, donc la cloche se déclenche *exactement* toutes les `bell_every` minutes (et jamais à 0 grâce à `el > 0`). Le `\a` chevauche la `end` de la ligne de cloche pour faire partie de la seconde imprimée, pas une écriture invisible séparée, et `el` est recalculée à chaque battement depuis le compte à rebours pour que la vérification reste correcte quelle que soit la réorganisation ultérieure de la boucle.

**👟 Indice de départ :** Commence avec `bell_every=1` sur une session courte — deux minutes, une cloche — et confirme que la cloche (un bip ou un clignotement) atterrit à la marque 1:00, pas à 0:59 ou 1:01.

**🎯 Résultat attendu :** Une session où, à précisément une minute écoulée, une ligne de cloche s'imprime (avec le bip/clignotement du terminal), le compte à rebours continue, et le message de fin arrive au bout.

**🩹 Si ça ne marche pas :** Si la cloche ne se déclenche jamais, `el % (bell_every * 60) == 0` compare au mauvais intervalle — vérifie que tu as multiplié `bell_every` par 60, pas comparé à `bell_every`. Si les cloches se déclenchent à chaque battement, la garde `el > 0` manque — sans elle, `el == 0` au premier battement fait que `0 % n'importe quoi == 0`, donc une cloche « 0 écoulé » se déclenche immédiatement.

### 2.2 Gère une interruption avec élégance

```python
# meditate.py (continued)

def countdown_forgiving(minutes: int, bell_every: int = 5) -> None:
    total = minutes * 60
    done = 0.0
    try:
        print(f"Session: {minutes} min — begin. 🧘")
        for remaining in range(total, 0, -1):
            el = total - remaining
            if el % (bell_every * 60) == 0 and el > 0:
                print(f"\n   +bell at {el // 60:02d}:00\a", flush=True)
            print(f"\r{remaining // 60:02d}:{remaining % 60:02d} left", end="", flush=True)
            time.sleep(1)
            done = float(el + 1)
    except KeyboardInterrupt:
        pass
    finally:
        print(f"\n— interrupted or finished after {done:.0f}s ({done / 60:.1f} min) —")

if __name__ == "__main__":
    countdown_forgiving(2, bell_every=1)
```

La forme `try/finally` est le modèle de sortie élégante : `Ctrl+C` lève `KeyboardInterrupt`, le `except` l'avale, et le bloc `finally` *s'exécute toujours* pour rapporter les secondes réellement accomplies. `done` n'est mise à jour qu'après la fin réelle de chaque seconde, donc une interruption en plein `sleep` compte quand même les battements accomplis et ne ment jamais en disant « 0 minute faite » quand tu en as vraiment fait 42.

**👟 Indice de départ :** Exécute `countdown_forgiving(5, bell_every=2)`, attends ~15 secondes, puis appuie sur Ctrl+C — le terminal doit rapporter une réalité du style `158s / 2.6 min`, pas une traceback ni un faux `0s`.

**🎯 Résultat attendu :** Appuyer sur Ctrl+C en pleine session imprime une seule ligne propre disant combien de secondes tu as réellement faites — pas de traceback, pas de redessin partiel — et `finally` garantit que cette ligne s'imprime même si l'interruption tombe exactement sur un battement de cloche.

**🩹 Si ça ne marche pas :** Si Ctrl+C affiche une traceback, le `except KeyboardInterrupt` manque ou est placé sur le mauvais `try` — il doit envelopper la boucle, pas seulement le `sleep`. Si les secondes rapportées sont fausses, `done` est mise à jour avant la fin du sleep — ne l'incrémente qu'*après* qu'une seconde complète passe.

### 2.3 Vérifie les cloches

**✅ Liste de vérification**

- ✅ `countdown_with_bells(2, 1)` déclenche une ligne de cloche audible exactement à la marque de 1 minute.
- ✅ `countdown_forgiving` rapporte les vraies secondes accomplies quand tu l'interromps — jamais de traceback, jamais de mensonge arrondi à la hausse.
- ✅ Aucune cloche ne se déclenche jamais au tout premier battement (la garde `el > 0` tient).
- ✅ Tu peux expliquer pourquoi `el` est *écoulée* — calculée comme `total - remaining` — plutôt que simplement `remaining`.

**🤔 Question(s) socratique(s)**

- En utilisant `time.sleep(1)` par battement, la vérification de cloche tourne au plus une fois par seconde. C'est bien — mais quelle dérive du monde réel un `sleep` de *30 secondes* introduirait-il si tu « optimisais » la boucle ainsi, et qu'est-ce que `el` capturerait encore correctement ?
- La cloche imprime sa propre ligne, écrasant le `\r` du compte à rebours pendant une image. Quel est le bug d'ordre de rendu entre « imprimer la ligne de cloche » et « redessiner le compte à rebours » qu'un message plus long pourrait exposer — et comment ta sortie y survivrait-elle ?

## Étape 3 : Guide un cycle de respiration en boîte

La respiration en boîte est un rythme fixe — inspire 4s, retiens 4s, expire 4s, retiens 4s, on répète — et c'est *la même boucle de compte à rebours* de l'étape 1 avec une idée en plus : au lieu d'un seul minuteur qui se vide une fois, le cycle répète une *séquence* fixe de phases, imprimant un signal parlé pour chaque phase pendant qu'elle s'exécute.

### 3.1 Exécute le cycle à quatre phases

```python
# breathe.py
import time

BOX = [("Inhale", 4), ("Hold", 4), ("Exhale", 4), ("Hold", 4)]

def breath_cycle(rounds: int = 3, phase_seconds: int = 4) -> None:
    print("Box breathing: In 4 - Hold 4 - Out 4 - Hold 4. Begin. 🌬️")
    for r in range(rounds):
        for name, secs in BOX:
            for left in range(secs, 0, -1):
                print(f"\r{' ' * 20}  {name}… {left}", end="", flush=True)
                time.sleep(1)
    print(f"\r{' ' * 20}  Complete — {rounds} rounds. 👌")

if __name__ == "__main__":
    breath_cycle(rounds=2)
```

La liste de tuples `BOX` *est* la technique : la boucle interne sur `(name, secs)` transforme quatre phases codées en dur en données, donc un style 4-4-8 (la respiration à expiration longue des athlètes) est un changement de données d'une ligne au lieu d'un changement de code. Le rembourrage de huit espaces `' ' * 20` dans chaque `\r` empêche les noms de phase courts (« Inhale ») de laisser des caractères fantômes des plus longs (« Complete »).

**👟 Indice de départ :** Exécute `breath_cycle(rounds=1)` — un seul round de 16 secondes — et *fais réellement la respiration* ; tu remarques que le signal change de phase exactement sur la grille d'une seconde, ce qui est toute l'expérience que la boucle de l'étape 1 a rendue possible.

**🎯 Résultat attendu :** Deux rounds de `Inhale… 4` → `Hold… 4` → `Exhale… 4` → `Hold… 4`, chaque phase comptant à rebours un nombre par seconde, se terminant par `Complete — 2 rounds`.

**🩹 Si ça ne marche pas :** Si les noms de phase se chevauchent (`Exhale… 3Exhale… 2`), le rembourrage `\r` est trop court ou manque — rembourre au moins à la longueur du message le plus long. Si les respirations sautent un nombre, le `range(secs, 0, -1)` interne est inversé (essaie `-1` vs `1`) ou `time.sleep(1)` est sauté par un `continue` égaré.

### 3.2 Vérifie le guide de respiration

**✅ Liste de vérification**

- ✅ `breath_cycle(1, 4)` prend 16 secondes et montre quatre phases distinctes, chacune comptée 4→1 en place.
- ✅ La séquence correspond à `BOX` : Inhale → Hold → Exhale → Hold, jamais Out → In.
- ✅ Exécuter `breath_cycle(2)` double le temps total sans répéter le texte de configuration — la configuration s'imprime une fois, les phases se répètent.

**🤔 Question(s) socratique(s)**

- `BOX` est des données, les boucles sont du code. Si tu voulais un cycle *basé sur les ratios* comme 4-7-8, quelle est la plus petite édition de `BOX` — et qu'est-ce que cela dit sur le fait d'encoder une technique comme données plutôt que de recompiler la logique ?
- Le signal s'imprime *avant* la seconde qu'il représente (`Inhale… 4` signifie « habite les 4 prochaines secondes »). Où `sleep` s'insère-t-il dans cette formulation — et imprimer un `0` à la fin de chaque phase se lirait-il mieux ou moins bien pour une respiration réelle ?

## Étape 4 : Journalise une session dans un CSV

Un suivi d'habitude qui oublie est un jouet ; toute la valeur de série de la méditation vient d'un fichier qui grandit. L'étape 4 fait de chaque session *terminée* (ou élégamment interrompue) une ligne : date, minutes, et une humeur d'un mot. Le CSV est choisi parce que c'est un fichier qu'un humain peut ouvrir dans n'importe quelle feuille de calcul et auditer — du code de journalisation que tu ne peux pas relire est la façon la plus rapide de perdre la confiance.

### 4.1 Ajoute une ligne de session

```python
# log.py
from datetime import date
import csv
from pathlib import Path

LOG = Path("sessions.csv")

def log_session(minutes: int, mood: str = "ok") -> None:
    header = ["date", "minutes", "mood"]
    exists = LOG.exists()
    with open(LOG, "a", newline="") as f:
        writer = csv.writer(f)
        if not exists:
            writer.writerow(header)
        writer.writerow([date.today().isoformat(), minutes, mood])

def show_log() -> None:
    with open(LOG, newline="") as f:
        for row in csv.reader(f):
            print(f"{row[0]} — {row[1]:>3} min — {row[2]}")

if __name__ == "__main__":
    log_session(5, "calm")
    log_session(2, "restless")
    show_log()
```

Les deux décisions qui portent cette étape : l'en-tête n'est écrit que lorsque le fichier est *nouveau* (relancer le script ajoute des lignes au lieu de dupliquer l'en-tête), et `date.today().isoformat()` stocke les dates en `YYYY-MM-DD` — un format qui se trie correctement comme une simple chaîne, sur quoi la math de série de l'étape 5 s'appuiera fortement.

**👟 Indice de départ :** Exécute `log.py` deux fois. Premier lancement : deux lignes plus l'en-tête sont nouvelles. Deuxième lancement : les mêmes deux lignes s'ajoutent à nouveau, *sans* second en-tête — c'est le test ajout-vs-en-tête qui passe.

**🎯 Résultat attendu :** Exécuter `log.py` deux fois imprime au second lancement un historique propre de deux lignes de données (4 lignes au total au premier, 4 lignes encore au second — pas 6), chaque ligne `YYYY-MM-DD — N min — mood`.

**🩹 Si ça ne marche pas :** Si l'en-tête réapparaît au second lancement, `exists` a été calculé *après* l'ouverture du fichier (qui le crée) — calcule-le avant `open(LOG, "a")`. Si les lignes montrent des ordures du style `manual override`, un retour à la ligne parasite dans le CSV coupe une ligne en deux — vérifie que le fichier se termine par un simple saut de ligne, pas une ligne vide.

### 4.2 Vérifie la journalisation

**✅ Liste de vérification**

- ✅ Ajouter deux fois ajoute deux lignes et jamais d'en-tête dupliqué.
- ✅ Chaque ligne est `date,minutes,mood` avec une date ISO — tu peux ouvrir `sessions.csv` dans une feuille de calcul et la lire.
- ✅ `show_log` rend le fichier ligne par ligne, y compris après un nouveau lancement.

**🤔 Question(s) socratique(s)**

- Nous journalisons seulement la *date*, pas l'heure de la journée, donc deux sessions dans la même journée n'écrasent rien (deux lignes, même date). Voudrais-tu que l'outil *fusionne* les minutes du même jour ? Que préférerait la math de série de l'étape 5 — et que révèle ta réponse sur le client du modèle de données ?
- Le mode `append` écrit une nouvelle ligne à la fin. Si tu utilisais l'outil sur deux machines (un portable et un téléphone), quel désastre au niveau système de fichiers un journal partagé en ajout-seul risque-t-il — et quelle est la correction économique (indice : lis le fichier, fusionne, réécris) ?

## Étape 5 : Calcule ta série

Le journal existe pour être relu ; la série est la relecture qui te fait te présenter demain. Cette étape analyse le CSV, trie les dates, et trouve la plus longue suite de jours consécutifs *et* la suite actuelle se terminant aujourd'hui — les deux nombres que chaque suivi d'habitude affiche. L'idée centrale est que « consécutif » n'est que de l'arithmétique de dates : chaque date est la précédente plus un jour.

### 5.1 Analyse et calcule la série

```python
# streak.py
from datetime import date, timedelta
import csv
from pathlib import Path

LOG = Path("sessions.csv")

def session_dates(path: Path = LOG) -> list[date]:
    days = set()
    with open(path, newline="") as f:
        for row in csv.reader(f):
            if row and row[0].lower() != "date":
                days.add(date.fromisoformat(row[0]))
    return sorted(days)

def best_streak(days: list[date]) -> tuple[int, date]:
    best = 0
    run = 0
    end = None
    prev = None
    for d in days:
        run = run + 1 if prev is None or (d - prev).days == 1 else 1
        if run > best:
            best, end = run, d
        prev = d
    return best, end

if __name__ == "__main__":
    days = session_dates()
    print(f"{len(days)} meditated day(s) on record")
    print(f"longest streak: {best_streak(days)[0]} days")
```

La *définition* de la série vit dans une ligne : `(d - prev).days == 1` — un jour ne continue une suite que lorsqu'il est exactement le jour calendaire suivant du précédent. Un `set()` en amont dédoublonne les doubles sessions du même jour, et `sorted()` garantit que la boucle marche toujours sur des dates en ordre croissant quel que soit l'ordre d'ajout du CSV.

**👟 Indice de départ :** Écris un petit lot de minuscules listes de dates (`["2026-08-03","2026-08-04","2026-08-05"]` devrait donner `best == 3`) *avant* de le pointer sur de vraies sessions — la fonction de série est là où se cachent les erreurs de décalage, et des fixtures vérifiées à la main les trouvent le plus vite.

**🎯 Résultat attendu :** Avec l'échantillon de l'étape 4 (`08-03`, `08-05` — un écart d'un jour), la sortie est `2 meditated day(s) on record` et `longest streak: 1 days`, parce que les deux dates ne sont *pas* consécutives.

**🩹 Si ça ne marche pas :** Si une suite de trois jours rapporte `2`, la vérification `== 1` est mal écrite (dire `(d - prev).days >= 1` inclut en effet les écarts — ça doit être exactement `1`). Si la ligne d'en-tête du CSV pollue l'ensemble, la garde `row[0].lower() != "date"` manque ou l'en-tête n'est pas `date` ; imprime les premières dates analysées pour le voir.

### 5.2 Vérifie la série

**✅ Liste de vérification**

- ✅ `best_streak` sur des listes construites à la main renvoie la bonne suite la plus longue (3 pour trois jours consécutifs, 1 pour deux dates espacées d'un jour).
- ✅ Les lignes d'en-tête ne deviennent jamais des dates de session.
- ✅ Deux sessions à la même date comptent pour un seul jour — le dédoublonnage `set` tient.
- ✅ Tu peux expliquer si cela compte une série *terminée hier* comme égale à une série toujours en cours aujourd'hui.

**🤔 Question(s) socratique(s)**

- `best_streak` renvoie la suite la plus longue *de tous les temps* mais pas « suis-je en série en ce moment ? ». Quelle vérification supplémentaire, comparant la dernière date à `date.today()`, transforme `best` en « actuelle » — et que devrait-elle rapporter quand aujourd'hui est un jour de repos mais qu'hier a été médité ?
- La définition de série traite *tout* écart comme une remise à zéro. Les vraies apps d'habitude pardonnent un jour manqué (un « accroc » vs une « rechute »). Comment la vérification changerait-elle pour pardonner un écart unique — et qu'est-ce que cela fait à la signification du nombre ?

## ⚠️ Pièges courants

- **Oublier de vider le tampon.** Le compte à rebours fonctionne en local mais semble figé dans les journaux capturés ou les notebooks parce que `print(..., end="")` met en tampon. `flush=True` sur chaque écriture `\r` n'est pas optionnel quand la sortie est pipée ou capturée.
- **Erreur de décalage d'un dans la vérification de cloche.** `el % interval == 0` se déclenche à `0`, ce qui fait arriver la « première cloche » un battement trop tôt — la garde `el > 0` est toute la correction, et l'omettre fait applaudir bizarrement une session d'une minute à la seconde 0.
- **Sauter le `try/finally` sur les interruptions.** Un minuteur qui meurt avec une traceback sur Ctrl+C rapporte des mensonges (« a fait 0 minutes ») et corrompt l'histoire du journal de sessions. Le `finally` qui imprime toujours les secondes accomplies est ce qui fait d'abandonner *pas* un échec.
- **Double comptage de la même date dans les séries.** Exécuter le minuteur deux fois dans une journée ajoute deux lignes, et un analyseur naïf compte deux « jours » — gonflant la série de deux pour zéro jour en plus. Dédoublonne les dates (un `set`) avant toute math de jours consécutifs.
- **Une ligne d'en-tête qui devient une date.** Le CSV commence par `date,minutes,mood`, et `date.fromisoformat("date")` lève une erreur — transformant un simple coup de journalisation en crash. Soit saute l'en-tête dans le lecteur (la garde `!= "date"`), soit sépare les lignes de données des en-têtes ; choisis-en un et sois cohérent.
- **Dérive de `time.sleep` sur les longues sessions.** Chaque battement d'une seconde plus le surcoût d'impression pousse une session de 30 minutes au-delà de 30:00. Pour la *méditation* c'est pratiquement sans importance ; si tu chronomètres un jour plus précisément, une boucle à échéance absolue avec `time.monotonic()` retire la dérive — et `sleep(1)` reste content entre-temps.

## Ce que tu viens de construire

Un vrai minuteur de méditation : un compte à rebours qui trace une ligne propre, des cloches d'intervalle à ne jamais vérifier, un guide de respiration en boîte, un journal de sessions CSV en ajout-seul, et une math de série honnête qui ne flatte pas. La compétence transférable est tout l'outillage de *boucle d'événements dans un terminal* : la comptabilité écoulé-vs-restant, le battement coopératif `time.sleep`, l'interruption gracieuse, et l'état sauvegardé sur fichier — les primitives exactes derrière chaque minuteur d'intervalle, moniteur de disponibilité, app de compte à rebours et suivi d'habitude que tu écriras à partir d'ici. La session de 10 minutes d'un ami est à 600 secondes honnêtes, redessinées par impression, avec cloche quand il le faut.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/meditation-timer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meditation-timer) dans le dépôt du cours regroupe le minuteur, le guide de respiration, le journal et les modules de série plus un notebook qui exécute chaque pièce comme un instantané visible. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute les cellules dans un onglet de navigateur.
:::

## Où aller à partir d'ici

- Ajoute une ligne de **série actuelle** : vérifie la dernière date contre `date.today()` et rapporte « tu es au jour N » — une variante de plus de `best_streak`, et le nombre que tu vérifieras réellement chaque jour.
- Ajoute un **rapport hebdomadaire** : totalise les minutes par semaine ISO et imprime un petit graphique en barres d'ASCII `▁▃▅▇` — la même habitude de regroupement depuis le journal, désormais sur 8 semaines glissantes.
- Ajoute des **commandes d'historique** (`--last 7`, `--since 2026-08-01`) qui filtrent le CSV avant la math de série, construites sur la même lecture `csv` en laquelle tu as déjà confiance.
- Remplace le `BOX` fixe par un drapeau `--technique` — `box`, `478`, `long-exhale` — chacun une liste de tuples différente ; les boucles ne changent pas, les données changent.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier — un minuteur qui a réellement tourné, une série que tu n'as pas brisée, une session de respiration que tu as terminée ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README guide l'ajout du tien via une **pull request** du début à la fin : fork, branche, commit et ouverture de la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓