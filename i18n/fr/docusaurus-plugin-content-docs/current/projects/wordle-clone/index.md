---
id: wordle-clone
title: "Construire un Clone de Wordle"
sidebar_label: "Clone de Wordle"
slug: /projects/wordle-clone
description: "Construis un vrai jeu Wordle de terminal de zéro : un retour correct vert/jaune/gris par essai (y compris le bug classique des lettres répétées), une liste de mots personnalisée, et un suivi de statistiques persistant entre les sessions."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construire un Clone de Wordle

<ProjectPublishedDate projectId="2027-wordle-clone" />

<ProjectGreeting />

Ce projet ne suppose que les bases de niveau Python 101 — fonctions, listes, dictionnaires, boucles, lire et écrire un fichier. Pas de pandas, pas de clé API, pas de GPU, aucun service externe d'aucune sorte — juste un terminal, une liste de mots, et une logique qui est plus délicate à bien faire qu'elle n'en a l'air. C'est ce qui en fait un excellent Projet du Monde Réel *plus précoce* à essayer, même avant certains de ceux orientés pandas ou IA : tout ce dont tu as besoin, c'est de ce que Python 101 t'a déjà donné, appliqué à quelque chose de réellement amusant à jouer ensuite.

C'est optionnel et non noté. Voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Implémenter la logique centrale de retour d'essai — comparer un essai à un mot cible et produire une marque verte/jaune/grise par lettre, en gérant correctement les lettres répétées (le bug de logique classique de Wordle).
2. Construire une boucle de jeu interactive appuyée sur une vraie liste de mots, donnant au joueur 6 essais.
3. Valider les essais contre la liste de mots et donner un retour clair quand un essai est rejeté.
4. Ajouter un suivi de statistiques persistant — taux de victoires, série en cours, et une distribution du nombre d'essais — sauvegardé dans un fichier JSON local pour qu'il survive entre les exécutions.

## Où exécuter ceci

- **En local avec `uv` (recommandé).** Ce projet n'a besoin de rien au-delà de la bibliothèque standard plus une petite bibliothèque de couleurs de terminal — un bon candidat pour réellement installer du vrai Python sur ta propre machine. La section Configuration ci-dessous le détaille, et les Étapes 1–4 suivent ce chemin.
- **GitHub Codespaces.** Ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) pour un environnement de développement cloud avec Node, Python et `uv` déjà installés (voir [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)) — les mêmes commandes ci-dessous fonctionnent depuis un onglet de navigateur, sans aucune installation locale.
- **Google Colab, Kaggle Notebooks, ou Binder.** Ce projet a besoin de zéro dépendance externe, ce qui en fait un excellent choix de notebook dans un sens — mais l'invite `input()` d'un notebook est un peu différente d'un vrai terminal interactif : pas de tuiles colorées redessinées en place sur une seule ligne, et (sur Colab/Kaggle) les fichiers locaux d'une session ne survivent pas de façon fiable entre des visites séparées, ce qui va à l'encontre de la partie « les statistiques persistent entre les sessions » de ce projet. [`notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb) est toujours une vraie version jouable — ça vaut le coup d'essayer — sache juste que l'expérience complète (tuiles colorées dans le terminal, statistiques qui persistent entre des jours de jeu séparés) est vraiment quelque chose à « exécuter en local ».

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwordle-clone%2Fnotebook.ipynb)

  {/* Badges point at this PR's branch; will point at `main` once merged. */}

## Configuration

`uv` est un seul outil qui remplace la chaîne habituelle « installe Python, puis installe pip, puis installe un outil d'environnement virtuel, puis installe les paquets » — il peut installer et gérer les versions de Python lui-même, en plus des dépendances de ton projet.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme que c'est installé :

```bash
uv --version
```

Puis configure le projet :

```bash
uv init wordle-clone
cd wordle-clone
uv add rich
```

`rich` est la seule dépendance tierce dont tout ce projet a besoin, et elle sert uniquement à la sortie colorée du terminal (tuiles vertes/jaunes/grises) — chaque morceau de vraie logique de jeu ci-dessous est du Python de bibliothèque standard pur. Pas de clé API, pas d'inscription, rien à configurer avant de pouvoir exécuter une seule ligne de code.

## Étape 1 : Note un essai contre le mot cible

Commence par la pièce qui est facile à bien faire *presque* et satisfaisante à bien faire *vraiment* : étant donné un essai de 5 lettres et un mot cible de 5 lettres, produis une marque par lettre — vert si cette lettre est à la bonne position, jaune si elle est dans le mot mais à la mauvaise position, gris sinon.

Un premier essai tend à ressembler à ça, en vérifiant chaque lettre devinée indépendamment :

```python
# A tempting first version — has a bug, keep reading
def score_guess_naive(guess: str, target: str) -> list[str]:
    marks = []
    for i, letter in enumerate(guess):
        if letter == target[i]:
            marks.append("G")
        elif letter in target:
            marks.append("Y")
        else:
            marks.append("X")
    return marks
```

Essaie-le sur `guess = "SPEED"`, `target = "ERASE"`. Le mot cible contient exactement **un** `E`. La version naïve vérifie chaque lettre devinée contre la chaîne cible entière indépendamment — donc *les deux* `E` de `SPEED` sont vérifiés contre `"E" in target`, qui est `True` les deux fois, et les deux sont marqués en jaune. C'est faux : le vrai Wordle n'attribuerait jamais deux `E` jaunes dans un essai quand le mot cible ne contient qu'un seul `E` — un `E` deviné mérite une marque, l'autre n'a plus de lettre correspondante restante pour en justifier une.

La correction est un algorithme en deux passes :

```python
from collections import Counter

WORD_LENGTH = 5

def score_guess(guess: str, target: str) -> list[str]:
    guess, target = guess.upper(), target.upper()
    marks = ["X"] * WORD_LENGTH

    # Pass 1: greens, and tally which target letters are still "available"
    # (i.e. not already accounted for by a green) for the yellow pass.
    remaining = Counter()
    for i, (g, t) in enumerate(zip(guess, target)):
        if g == t:
            marks[i] = "G"
        else:
            remaining[t] += 1

    # Pass 2: yellows, consuming from that same pool of remaining letters
    # so a letter can never be flagged more times than it truly occurs.
    for i, g in enumerate(guess):
        if marks[i] == "G":
            continue
        if remaining[g] > 0:
            marks[i] = "Y"
            remaining[g] -= 1
        # else stays "X"

    return marks
```

La passe 1 marque chaque correspondance de position exacte en vert, et compte séparément (dans `remaining`) combien de copies de chaque lettre cible *non verte* sont encore « à prendre ». La passe 2 parcourt ensuite l'essai de nouveau : toute lettre pas déjà verte ne reçoit une marque jaune que si `remaining` a encore une copie non réclamée de celle-ci — et en réclamer une décrémente le compte, donc une seconde copie devinée de la même lettre n'obtiendra pas aussi du jaune sauf si le mot cible a vraiment une seconde copie aussi.

Exécute-le sur le cas délicat :

```python
print(score_guess("SPEED", "ERASE"))  # ['Y', 'X', 'Y', 'Y', 'X']
```

Un `E` (position 0) est jaune, l'autre (position 3) est aussi jaune parce que `ERASE` a vraiment deux `E` — mais un essai comme `"ELITE"` contre un mot cible avec un seul `E` donnerait correctement au *deuxième* `E` un gris, pas un jaune.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>`score_guess("CRANE", "CRANE")` returns all greens.</StepChecklistItem>
<StepChecklistItem>`score_guess("SPEED", "ERASE")` returns exactly two yellow `E`s, not more.</StepChecklistItem>
<StepChecklistItem>A guess and target that share zero letters returns all grays.</StepChecklistItem>
<StepChecklistItem>You've tried a case where the *guess* repeats a letter but the target only has one copy, and confirmed only one mark comes back non-gray.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Essaie le mot cible `"LLAMA"` et l'essai `"ALLOY"` à la main avant d'exécuter le code : `LLAMA` a deux `L` et deux `A`. Parcours les deux passes toi-même — quelles lettres finissent en vert, lesquelles en jaune, et lesquelles en gris ? Puis vérifie ta réponse contre `score_guess`. Si tu t'es trompé sur papier, où exactement ton modèle mental a-t-il divergé de l'algorithme en deux passes ?

## Étape 2 : Construis la boucle de jeu

Avec un scoring solide, enveloppe-le dans un vrai jeu : choisis un mot cible aléatoire dans une liste de mots, donne au joueur 6 essais, et arrête dès qu'il a les cinq verts.

```python
import random

MAX_GUESSES = 6

def load_words(path="words.txt") -> list[str]:
    with open(path) as f:
        return [w.strip().upper() for w in f if w.strip()]

def play_round(words: list[str]) -> tuple[bool, int]:
    target = random.choice(words)
    for attempt in range(1, MAX_GUESSES + 1):
        guess = input(f"Guess {attempt}/{MAX_GUESSES}: ").strip().upper()
        marks = score_guess(guess, target)
        print(" ".join(f"{l}:{m}" for l, m in zip(guess, marks)))
        if all(m == "G" for m in marks):
            print(f"You got it in {attempt}!")
            return True, attempt
    print(f"Out of guesses. The word was {target}.")
    return False, MAX_GUESSES
```

`words.txt` est un simple fichier texte, un mot par ligne — le vrai exemple inclut une liste d'environ 540 mots anglais courants de 5 lettres exactement pour ce but. Une *liste* de mots comme celle-ci (juste des faits sur quelles chaînes sont des mots anglais, sans expression créative) est libre d'utilisation et de redistribution, contrairement à copier, disons, les vraies définitions d'un dictionnaire.

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Each round picks a genuinely random target from the word list (print it temporarily to confirm, then remove the print — no spoilers once you trust it).</StepChecklistItem>
<StepChecklistItem>The loop stops immediately once all five marks are green, even before 6 guesses are used.</StepChecklistItem>
<StepChecklistItem>After exactly 6 wrong guesses, the loop ends and reveals the target.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Si `random.choice(words)` est appelé une fois par manche depuis l'intérieur de `play_round`, et que tu appelles `play_round` dans une boucle pour laisser quelqu'un rejouer, est-ce que le mot cible va vraiment changer entre les manches ? Que se passerait-il si tu calculais accidentellement `target` une fois *à l'extérieur* de la boucle à la place ?

## Étape 3 : Valide les essais contre la liste de mots

Le vrai Wordle ne te laisse pas deviner `"ZZZZZ"` — chaque essai doit être un vrai mot de son dictionnaire. Ajoute cette vérification avant de noter :

```python
def read_guess(word_set: set[str]) -> str:
    while True:
        raw = input(f"Guess ({WORD_LENGTH} letters): ").strip().upper()
        if len(raw) != WORD_LENGTH or not raw.isalpha():
            print(f"  Please enter exactly {WORD_LENGTH} letters.")
            continue
        if raw not in word_set:
            print(f"  '{raw}' isn't in the word list — try a real word.")
            continue
        return raw
```

Utiliser un `set` ici au lieu de vérifier `raw in words` contre la liste directement compte plus qu'il n'y paraît : les vérifications d'appartenance d'une liste balayent chaque entrée une par une, alors qu'une vérification de set est quasi instantanée quel que soit le nombre de mots qu'il contient — une habitude petite mais authentiquement bonne pour toute vérification « est-ce que cette valeur est dans une grande collection ».

:::tip[Rejette les mauvaises saisies tôt, pas en plein jeu]
Valider la *forme* de l'essai (5 lettres, alphabétique) avant de vérifier la liste de mots attrape les fautes de frappe les plus courantes avec la vérification la moins chère d'abord — ça ne sert à rien de chercher `"crane5"` dans un set de 540 mots quand une vérification `len()` et `.isalpha()` te dit déjà qu'il est malformé.
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Guessing a non-word (e.g. `"ZZZZZ"`) prints a clear rejection message and re-prompts, without consuming one of the 6 tries.</StepChecklistItem>
<StepChecklistItem>Guessing something that isn't 5 letters (too short, too long, contains a digit) is also rejected before it ever reaches the word-list check.</StepChecklistItem>
<StepChecklistItem>A valid, in-list guess is accepted immediately, lowercase or uppercase.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

Pourquoi est-il important que `read_guess` redemande sur un mauvais essai *à l'intérieur de sa propre boucle*, plutôt que de retourner une valeur sentinelle comme `None` pour que l'appelant (`play_round`) la gère ? Qu'est-ce qui irait mal avec le comptage d'essais de l'Étape 2 si un essai invalide était autorisé à consommer l'un des 6 essais ?

## Étape 4 : Ajoute un suivi de statistiques persistant

La dernière pièce : se souvenir de la performance du joueur, à travers des exécutions séparées du programme, pas juste au sein d'une session. Ça signifie écrire dans un fichier sur le disque.

```python
import json
from pathlib import Path

STATS_FILE = Path("stats.json")

DEFAULT_STATS = {
    "played": 0,
    "wins": 0,
    "current_streak": 0,
    "max_streak": 0,
    "guess_distribution": {str(n): 0 for n in range(1, MAX_GUESSES + 1)},
}

def load_stats() -> dict:
    if not STATS_FILE.exists():
        return json.loads(json.dumps(DEFAULT_STATS))  # a fresh copy
    with STATS_FILE.open() as f:
        return json.load(f)

def save_stats(stats: dict) -> None:
    with STATS_FILE.open("w") as f:
        json.dump(stats, f, indent=2)

def record_result(stats: dict, won: bool, guesses_used: int) -> dict:
    stats["played"] += 1
    if won:
        stats["wins"] += 1
        stats["current_streak"] += 1
        stats["max_streak"] = max(stats["max_streak"], stats["current_streak"])
        stats["guess_distribution"][str(guesses_used)] += 1
    else:
        stats["current_streak"] = 0
    return stats
```

`load_stats` gère la toute première exécution avec élégance — aucun fichier n'existe encore, donc il renvoie un nouvel ensemble de valeurs par défaut à zéro plutôt que de planter sur un fichier manquant. Chaque autre exécution charge ce qui a été sauvegardé la dernière fois. `record_result` n'ajoute à `guess_distribution` qu'en cas de victoire — une défaite n'a pas de valeur « d'essais utilisés pour gagner » significative, comme l'écran de statistiques du vrai Wordle lui-même.

La boucle complète du jeu assemble tout : charge les statistiques une fois au démarrage, mets-les à jour et sauvegarde-les après chaque manche.

```python
words = load_words()
stats = load_stats()

while True:
    won, attempts = play_round(words)
    stats = record_result(stats, won, attempts)
    save_stats(stats)
    print(f"Played: {stats['played']}  Win rate: {stats['wins']/stats['played']:.0%}  "
          f"Streak: {stats['current_streak']}")
    if input("Play again? [y/N] ").strip().lower() != "y":
        break
```

:::tip[Sauvegarde après chaque manche, pas seulement à la sortie]
Appeler `save_stats(stats)` juste après `record_result`, à chaque manche, signifie qu'un programme interrompu (terminal fermé, `Ctrl+C`, crash) ne perd au pire que le résultat de la manche *courante* — jamais la progression de toute la session. Sauvegarder une seule fois à la toute fin du programme jetterait tout si le joueur quitte en pleine session au lieu de passer par l'invite « rejouer ? ».
:::

**✅ Liste de vérification**

<StepChecklist>
<StepChecklistItem>Quitting the program and restarting it shows the same `played`/`wins`/streak numbers as before you quit, loaded from `stats.json`.</StepChecklistItem>
<StepChecklistItem>Winning in, say, 3 guesses increments `guess_distribution["3"]` specifically, not some other key.</StepChecklistItem>
<StepChecklistItem>Losing a round resets `current_streak` to 0 but does not touch `guess_distribution` or `max_streak`.</StepChecklistItem>
<StepChecklistItem>Deleting `stats.json` and rerunning the program doesn't crash — it starts a fresh, zeroed stats file instead.</StepChecklistItem>
</StepChecklist>

**🤔 Question(s) socratique(s)**

`max_streak` est calculé comme `max(stats["max_streak"], stats["current_streak"])` après chaque victoire, plutôt que d'être seulement mis à jour quand le *jeu* se termine. Pourquoi le mettre à jour après chaque victoire (au lieu d'essayer de le calculer plus tard depuis l'historique) suit-il correctement la meilleure série jamais atteinte, même si le joueur est encore sur sa meilleure série en ce moment et n'a pas encore perdu ?

## ⚠️ Pièges courants

- **Le bug des lettres répétées (Étape 1).** De loin l'erreur la plus courante : vérifier `letter in target` indépendamment pour chaque lettre devinée, sans suivre quelles copies d'une lettre répétée ont déjà été « réclamées ». Ça attribue trop de marques jaunes dès que l'essai ou le mot cible répète une lettre. Utilise toujours l'approche en deux passes qui consomme les copies — d'abord les verts, puis les jaunes contre un pool de lettres cibles *restantes*.
- **Des essais qui ne sont pas de vrais mots.** Sans valider contre une liste de mots (Étape 3), les joueurs peuvent deviner `"AEIOU"` ou tout autre non-mot purement pour sonder quelles lettres sont dans le mot cible — une stratégie que le vrai Wordle bloque explicitement en exigeant que chaque essai soit un mot du dictionnaire.
- **Sensibilité à la casse.** `"crane" == "CRANE"` est `False` en Python. Normalise chaque essai et chaque mot cible au même cas (ce projet utilise `.upper()` partout) dès qu'ils entrent dans ton code, sinon les comparaisons échoueront silencieusement pour des essais parfaitement valides.
- **Perdre les statistiques sur un crash.** N'écrire `stats.json` qu'une seule fois à la sortie du programme signifie que tout crash, `Ctrl+C`, ou terminal fermé perd la progression de toute cette session. Sauvegarde après chaque manche à la place (voir l'astuce à l'Étape 4).
- **Un fichier de statistiques d'une ancienne version de ton code.** Si tu ajoutes un nouveau champ à `DEFAULT_STATS` plus tard, `load_stats` tel qu'écrit ci-dessus chargera volontiers un `stats.json` *ancien* auquel manque ce champ, puis plantera la première fois que ton code essaiera de le lire. Ça vaut le coup de le gérer défensivement (vois comment `examples/wordle-clone/stats.py` fusionne les données chargées sur une copie neuve des valeurs par défaut) si tu prévois de continuer à peaufiner le schéma des statistiques.

## Ce que tu viens de construire

Un vrai clone de Wordle : une logique de retour d'essai correcte (y compris le cas limite des lettres répétées qui fait trébucher beaucoup de premiers essais), une boucle de jeu interactive appuyée sur une vraie liste de mots avec une validation d'essai adéquate, et des statistiques qui persistent authentiquement entre des exécutions séparées du programme — pas seulement au sein d'une session. Rien de tout ça n'avait besoin de plus que la bibliothèque standard et une petite bibliothèque de couleurs, ce qui vaut la peine d'être noté : un projet peut être substantiel et réellement amusant sans avoir besoin d'une clé API, d'un framework, ou d'un service cloud.

:::tip[Vérifie la logique délicate avec des cas de test, pas seulement en jouant]
C'est facile de jouer quelques manches, de voir une sortie d'apparence raisonnable, et de supposer que la logique de scoring est correcte — mais le bug des lettres répétées n'apparaît spécifiquement que sur des essais ou des mots cibles avec des lettres répétées, qui ne se présentent pas à chaque manche que tu joues à la main par hasard. Écrire une poignée de cas de test explicites (comme l'exemple `SPEED`/`ERASE` de l'Étape 1) qui ciblent spécifiquement ce cas limite attrape des bugs qu'un test par le jeu occasionnel peut manquer complètement.
:::

## Où aller à partir d'ici

- **Mode difficile.** Le mode difficile du vrai Wordle exige que chaque essai suivant réutilise tout vert/jaune déjà révélé — faire respecter ça signifie suivre les contraintes connues à travers les essais au sein d'une manche, pas juste noter un essai isolément.
- **Un système d'indices.** Révèle la position correcte d'une lettre non devinée au hasard sur demande, au prix de compter contre le total d'essais du joueur (ou un autre compromis que tu conçois).
- **Multijoueur ou un mot quotidien partagé.** Le vrai Wordle donne notoirement à tout le monde le même mot chaque jour. Dériver le mot cible du jour de façon déterministe depuis la date (ex. hacher la chaîne de date pour choisir un index dans la liste de mots) laisserait chaque joueur voir le même mot sans serveur — un bel exercice de hasard déterministe.
- **Un solveur simple, comme objectif ambitieux.** Étant donné les marques retournées jusqu'ici, filtre la liste de mots pour ne garder que les mots toujours cohérents avec chaque contrainte révélée — un renversement amusant de la logique de jeu que tu viens d'écrire, et un bon exercice du même raisonnement sur les lettres répétées de l'Étape 1, appliqué dans la direction opposée.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓

<ProjectProgressCheckbox projectId="2027-wordle-clone" />
