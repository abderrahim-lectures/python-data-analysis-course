---
title: "Analyseur de Sommeil"
description: "Journalise ton sommeil, note chaque nuit contre la durée et le rythme, et repère les tendances de semaine en semaine dans un petit historique CSV."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "csv", "datetime", "statistics", "scripting"]
learningObjectives:
  - "Parser et valider l'entrée du coucher et du réveil avec le module datetime"
  - "Calculer la durée de sommeil à travers la frontière de minuit"
  - "Noter la qualité de la nuit à partir de la durée et d'une composante de régularité"
  - "Relire un historique CSV et comparer les moyennes de semaine en semaine"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/datetime", "python-101/functions"]
---

# 😴 Construire un Analyseur de Sommeil

Chaque tracker de sommeil est au fond une petite feuille de calcul avec du jugement : journalise quand tu t'es couché et quand tu t'es réveillé, soustrais pour obtenir la durée, compare-la à un objectif, et regarde si ta moyenne rampe vers ou loin du sain sur une semaine. Ce projet construit cela — un CLI qui enregistre une nuit, attrape le piège classique du coucher-après-minuit, note chaque nuit sur la durée et la régularité, et relit tout l'historique pour comparer de semaine en semaine. Pas de wearable, pas d'EEG : le « capteur » c'est toi qui tapes deux heures, et l'analyse est du pur `datetime` Python et de l'arithmétique. C'est la plus petite chose de ce cours qui ressemble encore à un vrai outil que tu utiliserais réellement.

Cela suppose le Python 101 — chaînes, datetime, entrées-sorties de fichiers, fonctions. Optionnel et non noté ; vois [Projets du monde réel](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Demander une heure de coucher et une heure de réveil et les parser en objets `datetime`.
2. Calculer une durée de sommeil qui franchit correctement minuit.
3. Noter la nuit contre une durée cible et une règle de régularité.
4. Sauvegarder chaque nuit journalisée dans un historique CSV.
5. Relire l'historique et imprimer une comparaison des moyennes de semaine en semaine.

## Où exécuter ceci

**En local avec `uv` est le chemin principal** — tout l'outil est un script que tu exécutes (`uv run python sleep.py --log`), et l'historique CSV est un vrai fichier que tu peux ouvrir dans n'importe quel éditeur. Le gain est l'honnêteté : tu journalises tes *propres* nuits, donc l'exécuter sur un portable ou dans un navigateur Codespaces revient à choisir celui dans lequel tu taperais réellement ton heure de coucher.

**GitHub Codespaces** exécute le CLI identique : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et chaque invocation `sleep.py` se comporte exactement comme en local, avec `sleep_log.csv` vivant dans l'arborescence.

**Google Colab, les Notebooks Kaggle et Binder gèrent l'*analyse* honnêtement** — le calcul de durée, la notation de qualité et la moyenne CSV sont du Python pur et s'exécutent à l'identique dans un notebook, où le graphique de tendance ou le tableau de moyennes se rend comme une sortie de cellule. La seule chose qu'un notebook ne peut pas faire est de *demander en interactif* comme le fait un terminal — donc dans un notebook tu nourrirais une liste d'entrées codées en dur ou saisies durement (ou chargées depuis le CSV) plutôt que `input()`. Les deux sont le même moteur ; seule la source d'entrée diffère.

[![Ouvrir dans Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sleep-analyzer/notebook.ipynb)
[![Ouvrir dans Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sleep-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsleep-analyzer%2Fnotebook.ipynb)

## Configuration

Juste `uv` et un CSV vide qui attend ta première nuit.

### Installe `uv`

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
mkdir sleep-analyzer && cd sleep-analyzer
uv init --bare
```

Aucune dépendance tierce — tout le projet tourne sur la bibliothèque standard.

### Pré-remplis un en-tête CSV

```bash
mkdir -p data
printf "date,bedtime,waketime,hours,score\n" > data/sleep_log.csv
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `data/sleep_log.csv` existe avec l'en-tête `date,bedtime,waketime,hours,score`.
- ✅ Tu as deux vraies heures en tête (coucher et réveil de la nuit dernière) pour tester.

## Étape 1 : Parse et valide une nuit

Chaque journal de sommeil commence par une erreur de frappe attrapée avant qu'elle ne devienne une ligne empoisonnée. Le parser lit une heure de coucher et une heure de réveil comme `"HH:MM"`, les transforme en `datetime.time`, et *rejette* tout ce qui n'est pas une heure d'horloge valide avec un message clair au lieu d'un plantage silencieux. C'est la discipline « déchets dedans, bruit dehors » appliquée à une invite de deux lignes.

**👟 Indice de départ :** Commence par écrire `parse_time(label)` : une boucle `while True` qui `input()` une chaîne `HH:MM`, retourne `datetime.strptime(raw, "%H:%M").time()` en cas de succès, et imprime une re-demande amicale sur `ValueError`.

```python
# sleep.py
from datetime import datetime, time, timedelta
import csv, sys
from pathlib import Path

LOG = Path("data/sleep_log.csv")
TARGET_H = 7.5

def parse_time(label: str) -> time:
    while True:
        raw = input(f"{label} (HH:MM): ").strip()
        try:
            return datetime.strptime(raw, "%H:%M").time()
        except ValueError:
            print(f"  '{raw}' isn't a valid clock time. Try e.g. 22:30 or 06:15.")

def log_night() -> dict:
    date = datetime.now().strftime("%Y-%m-%d")
    bed = parse_time("Bedtime")
    wake = parse_time("Wake time")
    hours, score = duration_and_score(bed, wake)
    return {"date": date, "bedtime": bed.strftime("%H:%M"),
            "waketime": wake.strftime("%H:%M"), "hours": round(hours, 1),
            "score": round(score, 1)}
```

`parse_time` boucle jusqu'à obtenir un `"HH:MM"` valide — `datetime.strptime(raw, "%H:%M")` produit une heure en cas de succès et lève une `ValueError` pour tout le reste, que le `while True` attrape en imprimant l'entrée fautive et en redemandant. La forme de retour est un dict unique avec les cinq colonnes promise par l'en-tête CSV, calculées via un assistant `duration_and_score` que tu écriras ensuite. Attraper la mauvaise entrée *à la porte* (avant qu'elle n'atteigne la ligne) est toute la leçon : un `strptime` et un `try/except` gardent le journal propre pour toujours.

**🎯 Résultat attendu :** Pour un `22:30` et `06:15` valides, un dict comme `{'date': '2026-09-06', 'bedtime': '22:30', 'waketime': '06:15', 'hours': 7.8, 'score': 8.7}` ; pour une faute de frappe comme `25:99`, un message « heure d'horloge non valide » et une re-demande.

**🩹 Si ça ne marche pas :** Si un `"23:00"` valide lève une `ValueError`, tu as passé le mauvais format — `"%H:%M"` est en H majuscule, sur 24 heures ; `%h` minuscule n'est pas une directive valide. Si une mauvaise entrée *plante* le script au lieu de re-demander, la boucle `while True` ne boucle pas vraiment (le `return` est seulement à l'intérieur du `try`) — le `except` doit laisser continuer la boucle. Si la date est fausse, `datetime.now()` est bien pour une démo mais conscient de l'heure locale, pas de l'UTC — c'est un choix délibéré ici puisque « aujourd'hui » est ce que l'utilisateur veut dire.

**✅ Liste de vérification**

- ✅ Une entrée valide de deux heures retourne le dict complet à cinq champs.
- ✅ Une heure malformée re-demande sans planter.
- ✅ Les clés du dict correspondent exactement à l'en-tête CSV de la Configuration.

**🤔 Question(s) socratique(s)**

- `parse_time` boucle jusqu'à ce que l'*entrée* soit valide, mais que se passe-t-il si l'utilisateur appuie sur Entrée avec une entrée vide ? Ton `.strip()` transforme `""` en échec `strptime` qui re-demande — mais une *heure de coucher vide* pourrait être un signal légitime de « j'ai oublié ». Quel comportement un outil amical choisirait-il, et pourquoi (re-demander pour toujours contre laisser sauter) ?
- Ce parser accepte n'importe quelle heure sur 24h, y compris `13:00`. Une « heure de coucher » de 13:00 est une sieste ou une faute de frappe — mais l'outil ne peut pas le savoir. Quelle *vérification de plage* (par ex. coucher entre 18:00 et 04:00) ajouterait du sens, et où va-t-elle : dans `parse_time` ou après ?

## Étape 2 : Calcule la durée franchissant minuit

La première « arnaque » du calcul de sommeil : si tu te couches à 23:00 et te réveilles à 06:30, tu n'as pas dormi *moins* 16.5 heures — tu as franchi minuit. Cet assistant calcule la durée correctement en détectant l'enveloppement et en ajoutant une journée de minutes, puis convertit en heures. La soustraction naïve `wake - bed` est le bug que chaque débutant frappe ; cette étape le nomme et le corrige.

**👟 Indice de départ :** Commence par écrire la conversion en minutes dans `duration_and_score` : détecte l'enveloppement de minuit avec `if wake_min >= bed_min`, ajoute `24 * 60 - bed_min + wake_min` dans la branche de franchissement, puis convertis en heures avant de noter.

```python
# sleep.py (suite)

def duration_and_score(bed: time, wake: time) -> tuple[float, float]:
    bed_min = bed.hour * 60 + bed.minute
    wake_min = wake.hour * 60 + wake.minute
    if wake_min >= bed_min:           # same-day: went to bed and woke later the SAME day
        minutes = wake_min - bed_min
    else:                             # crossed midnight
        minutes = (24 * 60 - bed_min) + wake_min
    hours = minutes / 60.0

    duration_score = min(hours / TARGET_H, 1.0)          # 100% when you hit target
    consistency = 0.8 if hours >= TARGET_H else 0.9      # small bonus for doctor nudge
    score = (100 * duration_score) * consistency
    if hours >= TARGET_H:
        score = 100.0 + min((hours - TARGET_H) * 10, 25)  # a little bonus for sleeping in
    return hours, score
```

Le pivot de durée est le `if wake_min >= bed_min` : même jour (coucher à 06:00, réveil à 09:00, une sieste de quart de nuit) soustrait normalement ; la branche *qui franchit minuit* additionne les minutes du coucher à minuit (`24*60 - bed_min`) plus les minutes de minuit au réveil (`wake_min`). La notation plie un simple pourcentage de deux façons — une note « atteint la cible » (plafonnée à 100 venant de la durée, un petit bonus pour dormir dans une bande saine) et une réduction de *régularité* pour sous-dormir — donc une nuit de 7.5 heures score plus haut qu'une de 4 heures *et* une ornière légèrement courte mais régulière score plus haut qu'un écart.

**🎯 Résultat attendu :** `bed=23:00, wake=06:30` → `(7.5, 100.0)` ; `bed=23:00, wake=05:00` → `(6.0, 72.0)` ; `bed=01:00, wake=01:30` (une sieste de 30 min) → `(0.5, 5.3…)` ; franchir minuit produit toujours une valeur d'heures positive et raisonnable.

**🩹 Si ça ne marche pas :** Si une nuit franchissant minuit retourne un nombre *négatif* ou *énorme*, la branche `if wake_min >= bed_min` s'est déclenchée alors qu'elle devait tomber dans la branche de franchissement — la condition d'enveloppement est sur les *minutes*, pas les heures ; vérifie que la comparaison est `wake_min >= bed_min` (les deux en minutes). Si `bed=23:00, wake=06:30` produit `16.5`, tu as soustrait sans l'enveloppement — c'est exactement le bug « moins 16.5 » ; repasse par la branche else. Si les scores dépassent 100 ou plongent bizarrement, la logique de masque/bonus a compté deux fois — imprime `duration_score` et `consistency` séparément pour voir quel terme a pris le dessus.

**✅ Liste de vérification**

- ✅ Franchir minuit produit toujours une valeur d'heures positive dans une plage raisonnable.
- ✅ `7.5` heures → score 100 (cible atteinte) ; `6.0` → visiblement plus bas ; une sieste → très bas.
- ✅ Dormir au-delà de la cible gagne un bonus plafonné modeste, pas une inflation galopante.

**🤔 Question(s) socratique(s)**

- Le correctif de franchissement de minuit fonctionne pour une *unique* paire `HH:MM`. Mais un travailleur dont le quart dépasse l'aube (coucher 08:00, réveil 18:00) — la branche `wake_min >= bed_min` la gère-t-elle comme un *long sommeil de 10 heures*, ou la mal-étiquette ? Trace la frontière où « même jour » cesse d'être la bonne hypothèse (qu'en est-il d'un sommeil de 20 heures ?).
- La notation plafonne le terme de durée à 100 et ajoute un bonus pour dormir tard. Une nuit de 10 heures est-elle vraiment « meilleure » qu'un sain 8, ou le bonus est-il une *fiction commode* ? Défends ce qu'un *chercheur du sommeil* noterait pour une nuit de 5 heures contre une de 10 heures, et comment la simplicité de ta formule cache cette nuance médicale.

## Étape 3 : Sauvegarde dans un historique CSV

Une nuit enregistrée est un fait ; un *historique* est la chose dont les tendances sont faites. Cette étape ajoute le dict parsé de l'Étape 1 au CSV, faisant grandir le fichier d'une ligne par appel. Le motif « écris une fois, ajoute pour toujours » est le même qui garde un journal de plusieurs semaines bon marché — et tu as déjà touché l'en-tête dans la Configuration.

**👟 Indice de départ :** Commence par écrire `append_row(row)` avec `csv.DictWriter` et une liste `fieldnames` explicite en mode `"a"`, puis branche `main_entry` pour journaliser une nuit et réimprimer la ligne sauvegardée.

```python
# sleep.py (suite)

def append_row(row: dict) -> None:
    header = ["date", "bedtime", "waketime", "hours", "score"]
    with LOG.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=header)
        w.writerow(row)

def main_entry() -> None:
    row = log_night()
    append_row(row)
    print(f"saved {row['date']}: {row['hours']}h, score {row['score']}")

if __name__ == "__main__":
    main_entry()
```

`append_row` ouvre le journal en mode ajout (`"a"`) et utilise `csv.DictWriter` avec une liste `fieldnames` explicite, donc chaque nouvelle ligne est écrite *dans l'ordre de l'en-tête* quel que soit l'ordre des clés du dict — un petit mais vrai gain de correction (un dict mélangé brouillerait sinon les colonnes). Le garde-fou `if __name__ == "__main__"` est l'interrupteur script/import : exécute-le et il journalise une nuit ; importe-le et les fonctions sont réutilisables sans effets de bord. La ligne « imprime ce que tu as sauvegardé » referme la boucle — l'utilisateur voit la ligne exacte qui a atterri dans le CSV.

**🎯 Résultat attendu :** Une ligne terminale `saved 2026-09-06: 7.5h, score 100.0`, et une nouvelle ligne ajoutée à `data/sleep_log.csv` avec les cinq colonnes dans l'ordre de l'en-tête, la colonne date remplie.

**🩹 Si ça ne marche pas :** Si l'en-tête est *dupliqué* à chaque ligne, `append_row` écrit l'en-tête à chaque fois — tu appelles `w.writeheader()` à l'intérieur de l'ajout ; écris les en-têtes seulement à la création du fichier (Configuration), pas à chaque ajout. Si les colonnes apparaissent mélangées, `fieldnames` ne correspond pas à l'ordre de la chaîne d'en-tête — aligne la liste avec l'en-tête de la Configuration exactement. Si un `TypeError: not enough fields` apparaît, le dict a une clé qui n'est pas dans `fieldnames` ou en manque une — le dict de l'Étape 1 _doit_ contenir exactement ces cinq clés.

**✅ Liste de vérification**

- ✅ Un ajout ajoute exactement une ligne de pied au CSV, correspondant à l'en-tête.
- ✅ Relancer le script *ajoute* l'historique plutôt que de le tronquer.
- ✅ Le résumé imprimé correspond à ce que `DictWriter` a réellement écrit.

**🤔 Question(s) socratique(s)**

- Ajouter en mode `"a"` signifie que deux *programmes* ajoutant au même CSV (un notebook et un CLI) pourraient entrelacer les lignes. Qu'est-ce que le CSV abandonne par rapport à un store verrouillé par ligne, et quand la perte d'intégrité vaut-elle la peine d'être tolérée pour un journal personnel ?
- Chaque ligne stocke `hours` et `score` même si les deux sont *dérivables* de `bedtime`/`waketime`. Quel est l'argument pour les stocker (idempotent, auto-descriptif) contre les recalculer à la lecture (source unique de vérité) ? Choisis un camp qu'un petit analyste défendrait.

## Étape 4 : Lis l'historique et calcule des moyennes

Un journal que tu ne lis jamais est un journal intime que tu n'ouvres pas. Cette étape recharge chaque ligne depuis le CSV, convertit la colonne `hours` en flottants, et imprime la durée et le score moyens — la première vraie réponse « comment je vais » que l'outil produit.

**👟 Indice de départ :** Commence par écrire `summarize(history)` qui garde les cas de fichier manquant et de CSV vide avec des messages amicaux, puis convertit les colonnes `hours` et `score` et imprime leurs moyennes.

```python
# sleep.py (suite)

def summarize(history: Path = LOG) -> None:
    if not history.exists():
        print("no log yet")
        return
    rows = list(csv.DictReader(history.open()))
    if not rows:
        print("no entries yet")
        return
    durations = [float(r["hours"]) for r in rows]
    scores = [float(r["score"]) for r in rows]
    avg_h = sum(durations) / len(durations)
    avg_s = sum(scores) / len(scores)
    print(f"{len(rows)} nights logged")
    print(f"avg duration: {avg_h:.2f} h   (target {TARGET_H})")
    print(f"avg score   : {avg_s:.1f} / 100")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--summary":
        summarize()
    else:
        main_entry()
```

`csv.DictReader` rend chaque ligne comme un dict indexé par l'en-tête, donc les mêmes `fieldnames` de l'Étape 3 deviennent les *clés* à la lecture — l'aller-retour est symétrique. Les deux lignes de moyennage (`sum(durations)/len(durations)`) sont toute « l'analyse » de cette étape, mais la discipline est dans les garde-fous : un fichier absent (« `no log yet` ») et un corps vide (« `no entries yet` ») retournent tous deux des messages bruyants et amicaux au lieu d'une `ZeroDivisionError` de division par zéro. Le drapeau `--summary` est un minuscule portail CLI — exécute avec `--summary` pour lire, sans pour journaliser — qui transforme le script en un outil à deux modes.

**🎯 Résultat attendu :** Après avoir journalisé 2–3 nuits, `summary` imprime `3 nights logged`, `avg duration: 7.28 h (target 7.5)`, `avg score: 92.6 / 100`.

**🩹 Si ça ne marche pas :** Si `float(r["hours"])` lève une `ValueError`, la cellule `hours` d'une ligne est corrompue (une lettre errante d'une édition manuelle) — `DictReader` est un parser mince ; ajoute un `try/except float(...)` pour sauter-et-prévenir au lieu de mourir. Si le diviseur erre, `rows` est vide et le garde-fou `len(rows)` ne l'a pas attrapé — le garde-fou de liste vide doit venir *avant* la division. Si `--summary` est ignoré, le parsing `sys.argv` a tourné *après* que la branche `else` a appelé `main_entry` — vérifie l'ordre du `if __name__`.

**✅ Liste de vérification**

- ✅ Exécuter `--summary` imprime les comptes et les moyennes correctes sur les lignes journalisées.
- ✅ Les deux cas fichier-manquant et CSV-vide retournent des messages amicaux, pas des plantages.
- ✅ Seul `--summary` lit ; sans `--summary` on journalise — les deux modes sont distincts.

**🤔 Question(s) socratique(s)**

- La moyenne cache l'*étalement* : une moyenne de 7.0 pourrait être sept nuits de 7.0 h ou trois de 10 h et quatre de 4 h. Quelle statistique unique (par ex. la plage `max-min` ou le `std` des durées) exposerait cette différence qu'une moyenne simple lisse — et pourquoi la *variabilité* est-elle le signal le plus parlant pour le sommeil que la moyenne seule ?
- Un utilisateur qui journalise une nuit de 5 heures et une de 10 heures obtient la même moyenne de 7.5 que celui qui journalise deux nuits de 7.5 — mais un *clinicien du sommeil* se soucie de qui est qui. Quelle métrique hebdomadaire (moins d'heures, la pire nuit unique, ou la variance) l'outil aurait-il besoin pour contrer cette illusion ?

## Étape 5 : Compare de semaine en semaine

La dernière étape fait passer « comment je vais » à « est-ce que je vais *mieux* que la semaine dernière ? » Elle découpe l'historique par semaine, moyenne les deux plus récentes, et rapporte la différence — la ligne de tendance qu'un tracker d'habitudes existe réellement pour tracer. C'est là que la journalisation brute devient une *connaissance de soi*.

**👟 Indice de départ :** Commence par écrire `trend(history)` qui regroupe les lignes par le groupe-mois `date[:7]`, moyenne les heures de chaque groupe, et soustrait les deux dernières moyennes pour imprimer un delta signé plus un verdict `improving`/`declining`/`steady`.

```python
# sleep.py (suite)
from collections import defaultdict

def trend(history: Path = LOG, weeks: int = 2) -> None:
    rows = list(csv.DictReader(history.open()))
    weekly: dict[str, list[float]] = defaultdict(list)
    for r in rows:
        week = r["date"][:7]                      # "2026-09" month-group as a cheap week proxy
        weekly[week].append(float(r["hours"]))
    keys = sorted(weekly)[-weeks:]
    avgs = {k: sum(v) / len(v) for k, v in weekly.items()}
    if len(avgs) < 2:
        print("need at least two distinct weeks to compare")
        return
    k0, k1 = keys[0], keys[1]
    delta = avgs[k1] - avgs[k0]
    print(f"week {k0} → {k1}")
    print(f"avg hours {avgs[k0]:.2f} → {avgs[k1]:.2f}  ({delta:+.2f})")
    print("improving" if delta > 0 else "declining" if delta < 0 else "steady")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--trend":
        trend()
    elif len(sys.argv) > 1 and sys.argv[1] == "--summary":
        summarize()
    else:
        main_entry()
```

Grouper-par-mois est le remplaçant honnête de la « semaine » : il regroupe les lignes par les 7 premiers caractères de la date ISO (`"2026-09"`), donc un mois de nuits devient un groupe. Moyenner chaque groupe et soustraire les deux derniers donne le delta — et le verdict imprimé `+0.45`/`-0.30` (improving, declining, steady) est le résumé en un mot de la tendance. Le garde-fou `len(avgs) < 2` garde la fonction honnête quand il n'y a qu'un mois de données. C'est naïf (un mois n'est pas une semaine), mais c'est la *forme* de la vraie analyse de tendance : découpe par groupe, moyenne, diffère, et juge.

**🎯 Résultat attendu :** Avec des lignes réparties sur deux valeurs `YYYY-MM` différentes, `trend` imprime les deux moyennes et un delta signé plus une étiquette `improving`/`declining`/`steady` ; avec des données PM dans un seul mois, il imprime `need at least two distinct weeks to compare`.

**🩹 Si ça ne marche pas :** Si chaque date s'effondre en un groupe, ton CSV n'a pas de variation de date — `trend` sur un seul mois est un no-op (`need at least two`), ce qui est *correct* ; ajoute à la main une ligne avec une date antérieure pour tester. Si le signe du delta inverse, les clés de tri sont descendantes (`sorted(weekly)[-weeks:]` prend les deux *dernières*) — confirme que `keys` ordonne ancien→récent pour que `k1 - k0` signifie « plus récent moins plus ancien ». Si une `KeyError` se déclenche, la date d'une ligne a frappé un `float()` sur un non-numérique — le proxy de semaine `[:7]` est sûr, mais une cellule `hours` corrompue encore ; protège-la.

**✅ Liste de vérification**

- ✅ Avec ≥2 groupes-mois distincts, la tendance imprime les deux moyennes, un delta signé et un verdict.
- ✅ L'historique à un seul groupe retourne le message amical `need at least two`.
- ✅ La direction du verdict (`improving` contre `declining`) correspond au signe du delta.

**🤔 Question(s) socratique(s)**

- La clé de groupe est `date[:7]` — un *mois*, pas une vraie semaine de 7 jours. Quel est le bug exact qui affleure si tu journalises chaque jour pendant 45 jours (un groupe de 15 jours et un de 30 jours moyennés comme égaux) ? Comment une ancre hebdomadaire `(date - datetime.timedelta(days=weekday))` la corrigerait-elle ?
- Le verdict est un unique `+`/`-`/`0` venant des *moyennes*, qui cache encore la variance. Formule la phrase qu'un coach de sommeil dirait en utilisant *à la fois* la moyenne de la tendance *et* son étalement (par ex. « ta moyenne est stable, mais ta pire nuit a chuté ») — et nomme les deux nombres dont tu aurais besoin de l'Étape 5 pour la dire.

## ⚠️ Pièges courants

- **Le bug du « sommeil négatif ».** `wake - bed` quand le coucher franchit minuit produit un grand négatif. Pivote toujours sur `wake_min >= bed_min` pour ajouter les minutes d'une journée — l'erreur de calcul de sommeil la plus courante.
- **Ajouter l'en-tête à chaque ligne.** Écrire `writeheader()` à l'intérieur de `append_row` duplique l'en-tête et corrompt `DictReader` à la lecture. Écris l'en-tête seulement à la création du fichier (Configuration), puis ajoute des lignes de données uniquement.
- **Une faute de frappe nue `%H:%M`.** `%h` minuscule ou `%I` (sur 12 heures) parse en silence ou erre. `"%H:%M"` est sur 24 heures ; utilise-le de façon cohérente pour l'entrée et la sortie ou tes heures stockées et tes moyennes cesseront de correspondre.
- **Coder en dur des clés qui peuvent dériver.** Les `fieldnames` à l'écriture, l'en-tête CSV et les clés du dict de `log_night` doivent rester en verrou — trois copies des mêmes cinq noms. Définis l'en-tête une fois (une constante de module) et réutilise-le pour l'écriture et la lecture.
- **Faire confiance à `avg` par-dessus l'étalement.** Une moyenne de 7.0 peut cacher des écarts de 10+4. Une fois que tu as plusieurs semaines, rapporte le *delta* (Étape 5) et, si tu peux, la variance — ne laisse jamais une seule moyenne raconter toute l'histoire de l'habitude.

## Ce que tu viens de construire

Un analyseur de sommeil petit et réellement utile : tu as parsé et validé deux heures d'horloge, calculé une durée qui franchit correctement minuit, noté chaque nuit contre une cible avec un encouragement de régularité et un bonus de grasse matinée, ajouté chaque nuit à un CSV, relu l'historique en moyennes, et comparé des groupes de mois pour appeler une tendance. Le code transférable va plus loin que le sommeil : la boucle d'entrée `parse_time` avec des erreurs bruyantes, le calcul de l'enveloppement de minuit, la discipline CSV « en-tête une fois / ajoute pour toujours », et le scepticisme « la moyenne n'est pas l'étalement » sont toutes des habitudes que tu utiliseras dans n'importe quel script en forme de données.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/sleep-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/sleep-analyzer) dans le dépôt du cours regroupe le module analyseur, un `sleep_log.csv` pré-rempli, et un notebook qui calcule les durées, les scores, les moyennes et une tendance en ligne (avec des graphiques comme sorties de cellules). Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et commence à journaliser.
:::

## Où aller à partir d'ici

- **Une vraie semaine, pas un mois :** regroupe par `(datetime - timedelta(days=date.weekday()))` pour de vrais groupes de 7 jours — le correctif de l'Étape 5, codifié.
- **Rapporte aussi l'étalement :** ajoute le `min`/`max` (ou un `statistics.stdev`) des durées par semaine pour que la ligne de tendance porte sa variabilité, refermant la brèche « la moyenne cache l'écart ».
- **Un graphique :** charge le CSV dans Matplotlib et dessine les heures dans le temps avec la cible en ligne pointillée — le même fichier, désormais une image d'un coup d'œil.
- **L'édition multi-semaine du CSV :** câble un petit chemin « modifie la nuit dernière » pour qu'une heure de coucher corrigée réécrive sa ligne en place, gardant l'historique véridique après une erreur de journalisation.

## Partage ton projet avec la classe

Tu as attrapé ta propre tendance de sommeil qui s'améliore, ou construit un graphique de tes semaines ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README parcourt l'ajout du tien via une **pull request** du début à la fin : forker, créer une branche, commiter et ouvrir la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓