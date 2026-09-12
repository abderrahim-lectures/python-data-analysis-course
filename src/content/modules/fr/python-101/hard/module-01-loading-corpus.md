---
title: "Chargement d'un corpus textuel"
description: "Chargez, inspectez et comprenez la structure d'un corpus textuel stocké en CSV, la matière première de notre mini modèle de langage."
order: 1
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 1.5
lessonCount: 2
tags: ["csv", "corpus", "chargement-de-données", "nlp", "génération-de-texte"]
prerequisites: []
icon: "📚"
---

## Pourquoi c'est important

Chaque modèle de langage, de l'autocomplétion de votre téléphone à ChatGPT, a été entraîné sur un corpus : une vaste collection de textes. Avant que tout modèle puisse apprendre des motifs, prédire le mot suivant ou générer de la poésie, quelqu'un doit charger ce texte dans un programme. C'est l'étape zéro de tout traitement du langage naturel, et c'est là que la plupart des débutants restent bloqués.

Imaginez que vous ayez un fichier CSV avec des milliers de phrases en anglais. Vous voulez nourrir ces phrases dans un programme Python pour qu'il apprenne des motifs linguistiques. Mais un fichier CSV n'est que des octets sur le disque, un flux de caractères séparés par des virgules. Python doit l'ouvrir, l'analyser et vous donner le texte sous une forme utilisable. Si vous avez déjà essayé de charger un ensemble de données et obtenu un `FileNotFoundError`, un `csv.Error` ou une chaîne de caractères Unicode illisible, vous avez ressenti la douleur de cette étape. La réussir n'est pas négociable.

Dans ce module, vous chargerez un petit corpus anglais (`slm-corpus.csv`) fourni avec le cours. À la fin, vous comprendrez l'analyse CSV, comment extraire du texte brut de lignes structurées, et à quoi un « corpus » ressemble vraiment une fois ouvert. C'est la fondation sur laquelle tout le reste de cette piste est construit, la tokenisation, les tables de bigrammes, et en fin de compte votre générateur de texte commencent tous ici.

## Ce que vous allez apprendre

- Charger un fichier CSV avec `csv.reader` et `csv.DictReader` et comprendre la différence entre les deux
- Inspecter la forme, les noms de colonnes et des lignes d'exemple d'un ensemble de données
- Extraire le texte brut des lignes du corpus et le concaténer en une seule chaîne
- Comprendre ce qu'est un corpus textuel et pourquoi le CSV est un format de stockage pratique pour les données d'entraînement
- Déboguer les erreurs courantes de chargement de fichiers : problèmes d'encodage, erreurs de chemin et lignes mal formées

## La dérivation

**Le problème :** Vous avez un fichier rempli de texte, et vous voulez travailler avec en Python. Par où commencer ?

**L'approche naïve :** Vous pourriez essayer `open("data.csv").read()`, et parfois cela fonctionne. Mais pour des données structurées comme le CSV, vous atteindrez rapidement des limites. Les virgules dans les champs entre guillemets cassent la découpe naïve. Les systèmes d'exploitation différents utilisent des fins de ligne différentes. Certains CSV ont des en-têtes, d'autres non. Coder en dur des découpes de chaîne est fragile et échoue dès que la forme des données change.

**La solution :** Le module intégré `csv` de Python gère tout cela. Il comprend les règles de guillemets, la gestion des délimiteurs et les fins de ligne inter-plateformes. Vous pouvez utiliser `csv.reader` pour des lignes brutes (listes de chaînes) ou `csv.DictReader` pour des colonnes nommées (dicts avec les clés des en-têtes). Le choix compte : `DictReader` est plus lisible quand vous connaissez les noms de colonnes, tandis que `csv.reader` vous donne un accès positionnel.

**Comment cela fonctionne :** Quand vous appelez `csv.DictReader(open("file.csv"))`, le module lit la première ligne comme en-têtes et produit chaque ligne suivante comme un `OrderedDict` indexé par ces en-têtes. Vous pouvez itérer dessus comme sur n'importe quel itérateur Python, c'est efficace en mémoire car il ne charge pas tout le fichier d'un coup. Pour un corpus, vous extrairez typiquement une colonne (le texte) et concaténerez toutes les lignes en une longue chaîne. Cette chaîne devient l'entrée de la tokenisation dans le module suivant.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (120 XP au total pour ce module)
- **Défis** : Chaque leçon a des défis interactifs, charger un CSV, inspecter sa structure, extraire et vérifier le contenu textuel
- **Progression** : terminez les deux leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Jalon PBL** : C'est le point de départ de la pipeline complète de génération de texte, Module 1 sur 5 vers votre projet de synthèse

## Projets que vous pouvez créer

Après avoir terminé ce module, vous serez prêt à attaquer ces projets réels :

- 🤖 **Écrivain d'histoires IA**, a besoin du chargement de corpus comme première étape de toute pipeline de génération de texte
- 📰 **Générateur de newsletters**, charge les données d'articles depuis un CSV pour générer du contenu automatiquement
- 🔍 **Moteur de recherche sémantique**, le chargement de corpus est le prérequis pour construire des index de recherche
- 📊 **Tableau de bord d'analyse de texte**, chargez et inspectez des données textuelles avant l'analyse
- 🗞️ **Analyseur de sentiments**, chargez des données textuelles étiquetées pour entraîner un classifieur de sentiments

## Leçons

1. **Chargement d'un corpus CSV**, ouvrir, analyser et vérifier la structure de `slm-corpus.csv`
2. **Exploration du corpus**, calculer le nombre de lignes, les noms de colonnes et prévisualiser un échantillon de texte