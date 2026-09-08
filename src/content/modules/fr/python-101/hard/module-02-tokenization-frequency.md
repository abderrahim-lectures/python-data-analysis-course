---
title: "Tokenisation et fréquence des mots"
description: "Découpez le texte brut en jetons, comptez les fréquences de mots et construisez le vocabulaire de notre modèle de langage."
order: 2
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2
lessonCount: 2
tags: ["tokenisation", "fréquence-des-mots", "dict", "vocabulaire", "nlp"]
prerequisites: ["module-01-loading-corpus"]
icon: "🔤"
---

## Pourquoi c'est important

Chaque fois que vous utilisez l'autocomplétion, posez une question à Siri ou voyez un chatbot répondre — il y a un modèle de langage derrière. Ces modèles apprennent des motifs à partir du texte. Mais les ordinateurs ne lisent pas les mots, ils lisent les caractères. La tokenisation est le pont entre le langage humain et la compréhension machine.

Quand vous nourrissez un modèle avec du texte brut sans le tokeniser d'abord, le modèle voit « The » et « the » comme des mots complètement différents. Il compte « running », « run » et « runs » comme trois entrées de vocabulaire distinctes. Cela fragmente le signal d'apprentissage et gonfle le vocabulaire inutilement. Pire, si vous ne gérez pas la ponctuation et les majuscules, le modèle pense que « hello! » et « hello » ne sont pas liés. Ces décisions apparemment minimes se répercutent sur chaque calcul en aval — les comptages de bigrammes, les estimations de probabilité et le texte généré dépendent tous d'une tokenisation correcte.

Le comptage de fréquence des mots est l'étape critique suivante. Avant qu'un modèle de langage puisse prédire quel mot vient ensuite, il doit savoir quels mots existent et à quel point ils sont courants. Un mot qui apparaît 10 000 fois dans le corpus est fondamentalement différent d'un mot qui apparaît une fois. Les distributions de fréquence sont la première empreinte statistique de tout texte — elles vous disent de quoi parle le texte, quel vocabulaire il utilise et où vivent les motifs importants. Sans cette étape, vous avancez à l'aveugle.

## Ce que vous allez apprendre

- Écrire une fonction `tokenize(text)` qui met en minuscules, retire la ponctuation et découpe le texte en une liste de jetons de mots
- Construire une fonction `word_frequency(tokens)` qui compte les occurrences de chaque jeton à l'aide d'un dict
- Comprendre pourquoi les décisions de tokenisation (minuscules, gestion de la ponctuation) affectent la qualité du modèle en aval
- Calculer des statistiques de base du corpus : jetons totaux, mots uniques, mots les plus/moins fréquents
- Reconnaître les compromis entre les stratégies de tokenisation agressives et conservatrices

## La dérivation

**Le problème :** Vous avez une chaîne de texte brut — quelque chose comme `"The cat sat on the mat."` — et vous devez la découper en mots individuels pour pouvoir les compter et les analyser.

**L'approche naïve :** Vous pourriez découper sur les espaces : `"The cat sat on the mat.".split()` → `["The", "cat", "sat", "on", "the", "mat."]`. Cela fonctionne presque, mais remarquez : `"The"` ≠ `"the"` (majuscules), et `"mat."` inclut un point (ponctuation). Si vous construisez une table de fréquence à partir de cela, « mat » et « mat. » sont comptés comme des mots différents, et « The » et « the » sont des entrées séparées. Votre vocabulaire est gonflé et vos comptages sont faux.

**La solution :** Une fonction `tokenize()` correcte applique une séquence de transformations : (1) tout mettre en minuscules pour que « The » et « the » se fondent en un seul jeton, (2) retirer la ponctuation des bords de chaque mot, (3) découper sur les espaces blancs pour obtenir des jetons individuels. Cela produit une liste propre où chaque élément est un mot unique et normalisé.

**Comment cela fonctionne en pratique :** La fonction enchaîne les méthodes de chaîne de Python — `.lower()` pour la normalisation des majuscules, `.strip(string.punctuation)` pour retirer la ponctuation de début/fin, et `.split()` pour tokeniser sur les espaces blancs. Pour le comptage de fréquence des mots, vous itérez sur la liste de jetons, en maintenant un dictionnaire où chaque clé est un mot et chaque valeur est son comptage. Ce `dict` devient le vocabulaire — l'ensemble complet des mots que votre modèle connaît, pondéré par leur fréquence d'apparition. Ces deux fonctions (`tokenize` et `word_frequency`) sont le squelette de toute pipeline NLP, des simples modèles de bigrammes aux architectures de transformeurs modernes.

## Gamification

- **Récompense XP** : +150 XP par leçon (bonus de piste avancée)
- **Défis** : Chaque leçon a des défis interactifs — construire un tokeniseur, compter les fréquences, calculer les statistiques du corpus
- **Progression** : Terminez les deux leçons pour débloquer le module des tables de bigrammes
- **Bonus de série** : Terminez ce module après le Module 1 pour un bonus de +15 XP
- **Jalon PBL** : Votre vocabulaire tokenisé est la fondation du modèle de bigrammes du Module 3

## Projets que vous pouvez créer

Après avoir terminé ce module, vous serez prêt à attaquer ces projets réels :

- 🤖 **Écrivain d'histoires IA** — la tokenisation alimente directement la pipeline de génération de texte
- 💬 **Constructeur de chatbot** — tokeniser l'entrée utilisateur est la façon dont les chatbots comprennent les messages
- 📝 **Tuteur IA** — l'analyse de fréquence des mots aide à identifier les concepts clés dans les textes éducatifs
- 🔍 **Moteur de recherche sémantique** — la tokenisation et la pondération par fréquence sont au cœur de la correspondance de texte
- 📰 **Générateur de newsletters** — l'analyse de fréquence identifie les sujets les plus importants dans le matériel source

## Leçons

1. **Bases de la tokenisation** — construire une fonction `tokenize()` à partir des méthodes de chaîne
2. **Comptage de fréquence des mots** — totaliser les jetons dans un dict de fréquences et extraire les statistiques du vocabulaire