---
title: "Entrées/sorties de fichiers"
description: "Lisez et écrivez des fichiers, travaillez avec des données CSV et gérez les chemins en toute sécurité."
order: 7
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 2
lessonCount: 2
tags: ["fichiers", "lecture", "écriture", "csv", "gestionnaire de contexte", "with"]
prerequisites: ["module-06-data-structures"]
icon: "📁"
---

## Pourquoi c'est important

Chaque programme que vous écrivez finit par avoir besoin de communiquer avec le monde extérieur. Un jeu enregistre les meilleurs scores dans un fichier. Un analyste de données lit un CSV avec des milliers de lignes. Un serveur web charge la configuration depuis un fichier YAML. Sans entrées/sorties de fichiers, vos programmes existent dans le vide, ils peuvent traiter des données pendant leur exécution, mais rien ne persiste après leur arrêt.

Pensez à construire un suivi de budget. Vous pourriez calculer des totaux en mémoire, mais quand le programme se ferme, tout disparaît. L'utilisateur devrait ressaisir chaque dépense à chaque fois. Les entrées/sorties de fichiers résolvent cela en vous permettant d'enregistrer des données sur le disque et de les recharger plus tard. Le module `csv` gère les données structurées au format de tableur. Le module `pathlib` gère les chemins de fichiers sur Windows, macOS et Linux sans pirouettes spécifiques à une plateforme.

Les entrées/sorties de fichiers sont aussi là où les gestionnaires de contexte de Python (l'instruction `with`) brillent. Sans eux, vous devriez penser à fermer les fichiers manuellement, oubliez-le, et vous fuyez des descripteurs de fichiers, corrompez des données ou plantez. L'instruction `with` garantit le nettoyage automatiquement. C'est un motif que vous utiliserez dans chaque vrai projet Python, des scripts simples aux systèmes de production.

## Ce que vous allez apprendre

- Ouvrir et fermer des fichiers avec `open()` et pourquoi l'instruction `with` est essentielle
- Lire des fichiers ligne par ligne et comme une chaîne entière
- Écrire du texte dans des fichiers et ajouter de nouvelles données
- Travailler avec des fichiers CSV en utilisant le module `csv`
- Des chemins de fichiers sûrs avec `pathlib` pour la compatibilité inter-plateformes
- Les modes de fichier (`r`, `w`, `a`, `r+`) et quand utiliser chacun

## La dérivation

**Le problème :** Les programmes s'exécutent en mémoire, rapide mais temporaire. Les fichiers vivent sur le disque, lent mais permanent. Vous devez relier les deux : lire des données de fichiers dans votre programme, les traiter et écrire les résultats en retour. Sans entrées/sorties de fichiers, chaque programme perdrait ses données à sa sortie.

**L'approche naïve :** Ouvrir un fichier, tout lire en mémoire, le traiter, l'écrire en retour, et *penser à fermer le fichier*. Le problème : si votre programme plante entre l'ouverture et la fermeture, le descripteur de fichier reste verrouillé. Les autres programmes ne peuvent pas y accéder. Vos données pourraient être corrompues. Et vous devez écrire `file.close()` dans chaque chemin de code, y compris les gestionnaires d'erreurs.

**La solution élégante :** L'instruction `with` de Python est un gestionnaire de contexte. Elle ouvre un fichier, vous permet de travailler avec, et *le ferme automatiquement* quand le bloc se termine, même si une exception survient. Pas de fuite, pas d'appel `close()` oublié.

```python
with open("data.csv", "r") as file:
    for line in file:
        process(line)
# File is guaranteed to be closed here
```

**Lecture contre écriture :** Le mode de fichier détermine ce que vous pouvez faire. `r` (lecture) ouvre en lecture, le fichier doit exister. `w` (écriture) ouvre en écriture, il *écrase* le fichier s'il existe. `a` (ajout) ouvre en écriture mais ajoute à la fin au lieu d'écraser. `r+` ouvre à la fois en lecture et en écriture. Choisir le mauvais mode est une source courante de perte de données, `w` sur un fichier que vous vouliez ajouter détruit tout.

**Ligne par ligne contre fichier entier :** `file.read()` charge tout le fichier en mémoire, parfait pour les petits fichiers, dangereux pour les gros (un fichier de 2 Go ferait planter votre programme). Itérer `for line in file:` lit une ligne à la fois, efficace en mémoire et évolutif. Pour les fichiers CSV, le module `csv` gère l'analyse automatiquement, vous donnant des lignes comme des listes ou des dictionnaires.

**pathlib :** Les chemins codés en dur comme `"C:/Users/data/file.csv"` cassent sur Linux. `"../data/file.csv"` casse sur Windows. `pathlib` abstrait cela : `Path("data") / "file.csv"` fonctionne partout. Il gère aussi les vérifications d'existence, les suffixes, les répertoires parents et la création de fichiers sans code spécifique à une plateforme.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (120 XP au total pour ce module)
- **Défis** : Chaque leçon inclut des défis interactifs d'entrées/sorties de fichiers
- **Progression** : terminez les deux leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Succès débloqué** : « Maître des fichiers », lisez un CSV, traitez-le et écrivez les résultats dans un nouveau fichier

### Défis de leçons

| Leçon | Défi | XP |
|--------|-----------|-----|
| Lecture et écriture | Lisez un fichier texte, comptez les lignes/mots/caractères et écrivez un résumé | +60 |
| CSV et pathlib | Analysez un fichier CSV, filtrez les lignes selon une condition et enregistrez le résultat | +60 |

## Projets que vous pouvez créer

Après avoir terminé ce module, vous serez prêt à attaquer ces projets réels :

- 💰 **Suivi de dépenses**, lit/écrit les dépenses dans un CSV, calcule des totaux cumulés
- 📝 **Application journal**, enregistre les entrées quotidiennes dans des fichiers texte et les relit
- 📊 **Analyseur de données CSV**, lit des fichiers CSV, calcule des statistiques et écrit des rapports de synthèse
- 🗂️ **Organisateur de fichiers**, utilise pathlib pour analyser les répertoires et déplacer les fichiers par type

## Leçons

1. **Lire et écrire des fichiers texte**, `open()`, `with`, `read()`, `readlines()`, `write()`, `append()` et les modes de fichier
2. **CSV et pathlib**, le module `csv` pour lire/écrire des données structurées, et `pathlib` pour des chemins sûrs inter-plateformes