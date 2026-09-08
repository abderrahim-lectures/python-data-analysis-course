---
title: "Tables de probabilité de bigrammes"
description: "Construisez et normalisez des tables de comptage de bigrammes qui associent chaque mot aux mots qui le suivent."
order: 3
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2
lessonCount: 2
tags: ["bigrammes", "probabilité", "dict-imbriqué", "conditionnel", "nlp"]
prerequisites: ["module-02-tokenization-frequency"]
icon: "🔗"
---

## Pourquoi c'est important

Un modèle unigramme compte juste les fréquences de mots — « the » apparaît 100 fois, « cat » apparaît 5 fois. Mais cela ne nous dit rien sur l'ORDRE des mots. Si vous savez que « the » apparaît fréquemment, c'est utile, mais cela ne vous dit pas ce qui vient APRÈS « the ». Les bigrammes capturent les transitions : quel mot suit « the » ? C'est la fondation de tous les modèles de langage séquentiels.

Pensez à la façon dont vous lisez cette phrase : vous ne traitez pas chaque mot isolément. Votre cerveau prédit ce qui vient ensuite en fonction de ce que vous venez de lire. Après avoir vu « the », vous vous attendez à un nom — « cat », « dog », « house ». Après « I love », vous vous attendez à un objet. Les bigrammes formalisent cette intuition : ils comptent combien de fois le mot B suit le mot A dans tout le corpus. À partir de ces comptages, vous dérivez des probabilités — « étant donné que le mot actuel est 'the', il y a 40 % de chances que le mot suivant soit 'cat', 20 % que ce soit 'dog', et ainsi de suite ».

C'est le saut conceptuel du comptage à la prédiction. Le comptage de fréquence vous dit quels mots existent. Les tables de bigrammes vous disent comment les mots se connectent. Sans cette information de transition, vous ne pouvez pas générer de texte cohérent — vous tireriez juste des mots aléatoires du vocabulaire sans tenir compte de leur compatibilité. Les bigrammes sont le modèle le plus simple qui capture les relations mot-à-mot, et le même principe s'étend aux trigrammes, aux n-grammes, et même aux mécanismes d'attention des transformeurs modernes.

## Ce que vous allez apprendre

- Comprendre ce qu'un modèle de bigrammes capture des séquences de mots
- Construire un dict imbriqué `bigrams = {"the": {"cat": 3, "dog": 1}, ...}` à partir d'une liste de jetons
- Normaliser les comptages bruts en probabilités en divisant par le nombre total de mots suivants par mot
- Gérer les cas limites : mots qui n'apparaissent jamais comme mots suivants, corpus à un seul mot et jetons de fin de séquence
- Reconnaître comment les modèles de bigrammes se rapportent aux modèles n-grammes et neuronaux plus avancés

## La dérivation

**Le problème :** Vous avez une liste de jetons et vous voulez savoir quels mots ont tendance à se suivre. Vous devez passer d'une liste plate de mots à une représentation structurée des transitions de mots.

**L'approche naïve :** Vous pourriez itérer sur la liste de jetons et vérifier manuellement chaque paire : pour chaque position `i`, regardez `tokens[i]` et `tokens[i+1]`. Comptez combien de fois chaque paire apparaît. Cela fonctionne, mais comment stockez-vous le résultat ? Une liste de toutes les paires explose de façon combinatoire. Un dictionnaire plat avec des clés de tuple comme `("the", "cat"): 3` est difficile à interroger — vous ne pouvez pas facilement demander « quels sont TOUS les mots qui suivent 'the' ? »

**La solution :** Un dictionnaire imbriqué. Le dictionnaire externe associe chaque mot à un dictionnaire interne. Le dictionnaire interne associe chaque mot suivant à son comptage. Ainsi, `bigrams["the"]["cat"]` vous donne le comptage de la fréquence à laquelle « cat » suit « the ». Cette structure est naturelle pour les recherches conditionnelles — vous demandez « étant donné le mot X, quels sont ses mots suivants ? » en temps O(1).

**Comment cela fonctionne :** Parcourez la liste de jetons une seule fois. Pour chaque position `i` de 0 à `len(tokens) - 2`, prenez la paire `(tokens[i], tokens[i+1])`. Si `tokens[i]` n'est pas dans le dictionnaire externe, créez-le. Ensuite, incrémentez `bigrams[tokens[i]][tokens[i+1]]`. Après le comptage, normalisez : pour chaque mot, divisez chaque comptage de mots suivants par le comptage total de ce mot, produisant une distribution de probabilité qui somme à 1.0. Cette table normalisée est le moteur derrière la génération de texte — quand vous devez choisir « le mot suivant après X », vous échantillonnez dans cette distribution.

## Gamification

- **Récompense XP** : +150 XP par leçon (bonus de piste avancée)
- **Défis** : Chaque leçon a des défis interactifs — construire des tables de bigrammes, normaliser les comptages, vérifier les sommes de probabilité
- **Progression** : Terminez les deux leçons pour débloquer le module de génération de texte
- **Bonus de série** : Terminez ce module après les Modules 1-2 pour un bonus de +15 XP
- **Jalon PBL** : Votre table de bigrammes est le cerveau du générateur de texte que vous construirez au Module 4

## Projets que vous pouvez créer

Après avoir terminé ce module, vous serez prêt à attaquer ces projets réels :

- 🤖 **Écrivain d'histoires IA** — les tables de bigrammes pilotent la génération de texte mot par mot
- 💬 **Constructeur de chatbot** — les probabilités de transition aident les chatbots à produire des réponses cohérentes
- 📝 **Tuteur IA** — l'analyse de bigrammes identifie les motifs de grammaire courants pour l'enseignement
- 🔍 **Moteur de recherche sémantique** — la co-occurrence des mots et les transitions améliorent le classement de pertinence
- 📰 **Générateur de newsletters** — les modèles de bigrammes aident à générer des résumés au ton naturel

## Leçons

1. **Construction des tables de bigrammes** — compter les paires de mots consécutives dans un dictionnaire imbriqué
2. **Normalisation des comptages de bigrammes** — convertir les comptages bruts en distributions de probabilité