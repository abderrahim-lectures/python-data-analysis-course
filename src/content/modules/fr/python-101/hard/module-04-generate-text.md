---
title: "La fonction generate_text()"
description: "Utilisez random.choices pour échantillonner le mot suivant dans une table de bigrammes et générer des séquences de texte cohérentes."
order: 4
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2
lessonCount: 2
tags: ["random", "échantillonnage", "génération-de-texte", "function", "nlp"]
prerequisites: ["module-03-bigram-tables"]
icon: "🎲"
---

## Pourquoi c'est important

C'est là que la magie opère. Vous avez chargé des données, les avez tokenisées, compté les fréquences de mots et construit des tables de probabilité de bigrammes. Maintenant, vous regardez votre modèle parler. La fonction `generate_text()` est le moment où des statistiques abstraites deviennent du langage, où un dictionnaire de nombres produit des phrases qu'un humain peut lire et comprendre.

Chaque fois que vous voyez une « réponse suggérée » dans votre application de messagerie, une prédiction de « phrase suivante » dans un outil d'écriture, ou une suggestion d'autocomplétion pendant que vous tapez, il y a un mécanisme d'échantillonnage derrière. L'idée centrale est identique : étant donné un mot actuel, cherchez une distribution de probabilité sur ce qui vient ensuite, puis choisissez aléatoirement l'un de ces candidats pondéré par sa probabilité. Les mots à forte probabilité sont choisis souvent, les mots à faible probabilité sont choisis rarement. Le résultat semble naturel parce qu'il reflète les motifs des données d'entraînement.

Ce qui rend ce module particulièrement excitant, c'est que c'est la première fois que votre travail produit quelque chose de visible et de tangible. Vous tapez un mot de départ, et votre programme génère une séquence de mots qui forme un texte anglais cohérent (même si parfois surprenant). C'est le même mécanisme fondamental derrière les modèles de type GPT, l'échelle diffère, mais le principe d'échantillonnage depuis une distribution apprise est identique.

## Ce que vous allez apprendre

- Comprendre comment `random.choices(population, weights)` réalise un échantillonnage pondéré
- Écrire une fonction `generate_text(bigrams, length)` qui enchaîne les prédictions de mots
- Gérer les clés manquantes avec élégance quand un mot n'a pas de mots suivants connus dans le corpus
- Contrôler la longueur de sortie et déboguer la génération avec une graine pour la reproductibilité
- Comprendre la relation entre la taille du corpus et la qualité de la génération

## La dérivation

**Le problème :** Vous avez une table de probabilité de bigrammes et vous voulez produire une séquence de mots qui suit les motifs statistiques de votre corpus. Vous devez enchaîner des prédictions : choisissez un mot de départ, puis échantillonnez à plusieurs reprises le mot suivant dans la distribution du mot actuel.

**L'approche naïve :** Vous pourriez utiliser `random.choice()` pour choisir le mot suivant uniformément au hasard. Mais l'échantillonnage uniforme ignore les probabilités apprises, il traite « the » et « xylophone » comme des mots suivants également probables de « the ». Le texte généré serait absurde parce qu'il ne respecte pas la structure statistique que vous avez travaillé dur à construire.

**La solution :** `random.choices()` avec le paramètre `weights`. Cette fonction prend une population (liste de mots candidats) et une liste parallèle de poids (leurs probabilités), et renvoie une sélection aléatoire biaisée vers les poids les plus élevés. Si « cat » a une probabilité de 0,4 et « dog » de 0,1, « cat » sera choisi environ 4 fois plus souvent. C'est le mécanisme d'échantillonnage central.

**Comment cela fonctionne :** La fonction `generate_text(bigrams, length)` : (1) Choisissez un mot de départ (aléatoirement ou spécifié par l'utilisateur). (2) Cherchez `bigrams[current_word]` pour obtenir la distribution des mots suivants. (3) Extrayez les mots candidats et leurs probabilités dans deux listes. (4) Appelez `random.choices(candidates, weights=probs, k=1)` pour échantillonner un mot suivant. (5) Ajoutez-le à la sortie, définissez-le comme nouveau mot actuel, et répétez jusqu'à atteindre la longueur cible. Gérez le cas limite d'un mot sans mots suivants connus en s'arrêtant tôt ou en choisissant un mot aléatoire. Avec une graine fixe (`random.seed(42)`), vous obtenez une sortie reproductible pour le débogage et les tests.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (120 XP au total pour ce module)
- **Défis** : Chaque leçon a des défis interactifs, échantillonner des distributions, construire le générateur, tester les cas limites
- **Progression** : terminez les deux leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Jalon PBL** : Votre fonction `generate_text()` produit un vrai anglais lisible, vous avez construit un modèle de langage

## Projets que vous pouvez créer

Après avoir terminé ce module, vous serez prêt à attaquer ces projets réels :

- 🤖 **Écrivain d'histoires IA**, la fonction `generate_text()` est le cœur de toute IA créative d'écriture
- 💬 **Constructeur de chatbot**, la génération de texte est la façon dont les chatbots produisent des réponses à l'entrée utilisateur
- 📝 **Tuteur IA**, générez des explications et des exemples en échantillonnant des corpus de textes éducatifs
- 📰 **Générateur de newsletters**, générez automatiquement des brouillons d'articles et des résumés à partir du matériel source
- 🎮 **Moteur de fiction interactive**, utilisez la génération de texte pour créer des jeux narratifs à embranchements

## Leçons

1. **Échantillonner le mot suivant**, utilisez `random.choices()` pour choisir des mots suivants pondérés
2. **Implémenter generate_text()**, transformez la boucle d'échantillonnage en un générateur de texte complet