---
title: "Construire un bot organisateur de fichiers"
description: "Trier un dossier en désordre dans des sous-dossiers par catégorie, avec un bot qui planifie avant de déplacer, journalise ce qu’il a fait et peut annuler."
difficulty: "beginner"
---

# 📁 Construire un bot organisateur de fichiers

Un dossier dans lequel vous jetez des choses depuis un an : captures d’écran, PDF, quelques archives zip, des téléchargements de musique, trois scripts et un fichier sans extension. Vous pourriez le trier à la main en vingt minutes, ou écrire ce qui le trie, et ne plus jamais le faire à la main.

C’est le premier projet qui touche votre vrai système de fichiers, ce qui en fait un meilleur professeur qu’il n’y paraît : déplacer des fichiers est destructif, et un programme négligent là-dessus est pire que pas de programme du tout. Le bot est donc construit comme le sont réellement les outils qui manipulent des fichiers : il planifie d’abord, imprime le plan, ne déplace que sur demande, enregistre ce qu’il a déplacé, et peut annuler la dernière exécution.

## 🎯 Ce que vous allez faire

1. Parcourir un dossier et classer chaque fichier par son extension dans une catégorie.
2. Construire une **simulation** : calculer chaque déplacement, l’imprimer, ne rien toucher.
3. Effectuer les déplacements en gérant les collisions de noms au lieu d’écraser.
4. Écrire un journal d’opérations et le rejouer à l’envers pour annuler.
5. Tout tester sur un dossier d’exemple volontairement en désordre, jamais le vôtre.

## Où l’exécuter

**En local avec `uv`.** Le projet n’utilise que la bibliothèque standard de Python — `pathlib`, `shutil`, `json` — donc rien à installer, mais il doit tourner sur votre machine car il touche de vrais fichiers.

```bash
cd examples/file-organizer
uv run python generate_sample.py          # crée un dossier sûr pour expérimenter
uv run python organizer.py sample_messy_folder --dry-run
uv run python organizer.py sample_messy_folder
uv run python organizer.py sample_messy_folder --undo
```

Le code exécutable complet est dans [`examples/file-organizer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/file-organizer).

## Étape 1 — Classer par extension

Tout le bot repose sur une petite fonction : de l’extension à la catégorie.

```python
CATEGORIES = {
    'documents': {'.pdf', '.txt', '.doc', '.docx', '.csv'},
    'images': {'.png', '.jpg', '.jpeg', '.gif', '.svg'},
    'archives': {'.zip', '.tar', '.gz'},
    'code': {'.py', '.js', '.ts', '.sh'},
    'audio': {'.mp3', '.wav'},
    'video': {'.mp4', '.mov'},
}
```

Tout ce qui n’est pas listé va dans `other`. Ce cas par défaut compte : une extension inconnue ne peut jamais faire planter le bot, et un fichier sans extension (`mystery`) est classé volontairement et non par accident.

## Étape 2 — Planifier avant de déplacer

La simulation calcule une liste de paires `(source, destination)` et les imprime. Rien ne change sur le disque.

```
[DRY RUN] No files will be moved. Target: sample_messy_folder

Planned moves (10):
  notes.txt      ->  documents/notes.txt
  photo1.jpg     ->  images/photo1.jpg
  report.pdf     ->  documents/report (1).pdf
  mystery        ->  other/mystery
```

Ce `report (1).pdf` n’est pas une faute : le dossier d’exemple contient déjà un `documents/report.pdf`, donc la première exécution exerce la vraie gestion des collisions.

## Étape 3 — Des collisions, pas des écrasements

Un `shutil.move` naïf écraserait le fichier existant et le perdrait. Le bot ajoute `(1)`, `(2)` jusqu’à ce que le nom soit libre — la même convention que votre gestionnaire de fichiers, pour la même raison.

<details class="challenge">
<summary>🧩 Défi : réfléchissez d’abord, puis révélez</summary>
<div class="challenge__body">

Pourquoi est-il plus sûr de gérer les collisions à l’étape de *planification* plutôt qu’au moment du déplacement ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Parce que la simulation montre alors la destination réelle. Si les collisions étaient résolues pendant le déplacement, le plan que vous avez relu ne serait pas celui qui s’exécute, ce qui annule l’intérêt de le relire.</p>

</div>
</details>

## Étape 4 — Un journal que l’on rejoue à l’envers

Chaque exécution réelle ajoute à `.organizer_log.json` : source, destination et horodatage. `--undo` lit les entrées de la dernière exécution et replace chaque fichier, du plus récent au plus ancien.

C’est la différence entre un script et un outil. Un script qui déplace des fichiers sans pouvoir revenir en arrière est à une faute de frappe d’une mauvaise après-midi.

## Étape 5 — Tester sur du sûr

`generate_sample.py` construit un dossier jetable avec une collision volontaire, des fichiers sans extension et un fichier caché que l’organisateur doit ignorer. Exécutez le bot là d’abord, toujours. L’habitude est la leçon : la simulation existe parce que pointer du code qui déplace des fichiers vers `~/Downloads` la première fois, c’est ainsi que les gens perdent des données.

## 🧩 Défis

<details class="challenge">
<summary>🧩 Défi : réfléchissez d’abord, puis révélez</summary>
<div class="challenge__body">

L’organisateur ignore les fichiers cachés. Qu’est-ce qui casse s’il ne le fait pas ?

<p class="challenge__answer">💡 <strong>Réponse :</strong> Il déplacerait des fichiers de configuration comme `.gitignore`, `.env` et son propre `.organizer_log.json` dans des dossiers de catégorie — y compris son propre journal, que `--undo` ne trouverait alors plus. Les fichiers cachés sont des réglages, pas du désordre.</p>

</div>
</details>

## 🤔 Questions socratiques

- Pourquoi écrire un mode simulation alors que vous pourriez simplement faire attention ?
- Que devrait-il se passer si le dossier de destination existe mais est un fichier ?
- `--undo` devrait-il refuser de s’exécuter si un fichier a changé depuis le déplacement ? Pourquoi ?
- Quelle est la plus petite version de ce bot à laquelle vous confieriez encore votre propre dossier ?

## ✅ Vérification rapide

<div class="quiz" data-quiz="projects-file-organizer-fr">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. Que fait --dry-run ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Il déplace les fichiers puis annule.</button>
      <button class="quiz-q__opt" data-idx="1">Il calcule et imprime chaque déplacement prévu sans toucher au disque.</button>
      <button class="quiz-q__opt" data-idx="2">Il supprime les fichiers au lieu de les déplacer.</button>
      <button class="quiz-q__opt" data-idx="3">Il exécute l’organisateur sans journal.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. Le nom de destination existe déjà. Que doit faire le bot ?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">L’écraser ; le fichier récent est meilleur.</button>
      <button class="quiz-q__opt" data-idx="1">Ignorer le fichier en silence.</button>
      <button class="quiz-q__opt" data-idx="2">Ajouter (1), (2)… jusqu’à ce que le nom soit libre.</button>
      <button class="quiz-q__opt" data-idx="3">Supprimer d’abord l’ancien fichier.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
