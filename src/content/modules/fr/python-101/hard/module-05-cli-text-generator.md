---
title: "Générateur de texte CLI et température"
description: "Assemblez toutes les pièces en un générateur de texte en ligne de commande et ajoutez un paramètre de température pour contrôler la créativité."
order: 5
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2.5
lessonCount: 2
tags: ["cli", "argparse", "température", "génération-de-texte", "projet-final"]
prerequisites: ["module-04-generate-text"]
icon: "🖥️"
---

## Pourquoi c'est important

Vous avez construit chaque pièce d'un modèle de langage à partir de zéro, chargement de corpus, tokenisation, comptage de fréquence, tables de bigrammes et génération de texte. Mais pour l'instant, ces pièces vivent dans des scripts et des cahiers séparés. Personne ne peut utiliser votre modèle sans lire votre code et appeler vos fonctions manuellement. Le module final transforme votre prototype de recherche en un véritable outil que n'importe qui peut exécuter depuis la ligne de commande.

C'est une compétence critique qui sépare les projets d'apprentissage des logiciels déployables. Chaque outil NLP sérieux, de l'API d'OpenAI à la bibliothèque de transformeurs de Hugging Face en passant par les petites utilitaires locaux, expose une interface propre. La ligne de commande est là où vivent les développeurs : elle est scriptable, automatisable et facile à intégrer dans des flux de travail plus larges. À la fin de ce module, vous taperez `python generate.py --word-count 50 --temperature 1.2` et regarderez votre modèle produire du texte créatif à la demande.

Le paramètre de température est l'ajout le plus important. Il contrôle le compromis entre créativité et sécurité, une température basse fait choisir au modèle les mots à forte probabilité (texte conservateur, répétitif), tandis qu'une température élevée le fait explorer des options à faible probabilité (texte surprenant, créatif). C'est exactement le même mécanisme utilisé dans les modèles GPT, et le comprendre vous donne un aperçu de la façon dont l'IA moderne contrôle la qualité de sortie. Le réglage de température est ce qui transforme un prédicteur de mots ennuyeux en un partenaire d'écriture créative.

## Ce que vous allez apprendre

- Intégrer toutes les étapes de la pipeline (charger → tokeniser → compter → bigrammes → générer) en un seul script cohérent
- Implémenter un paramètre `temperature` qui modifie la distribution de probabilité avant l'échantillonnage
- Utiliser `argparse` pour accepter des arguments de ligne de commande pour le nombre de mots, le mot de départ et la température
- Tester la pipeline complète de bout en bout et produire un texte anglais plausible
- Comprendre comment la température se rapporte au compromis « créativité vs. cohérence » dans les modèles de langage

## La dérivation

**Le problème :** Vous avez une fonction `generate_text()` fonctionnelle, mais ce n'est pas un outil utilisable. Les utilisateurs ne peuvent pas l'exécuter sans modifier le code source, et la sortie a toujours le même « goût », elle est soit trop prévisible, soit trop aléatoire, sans aucun moyen de la contrôler.

**L'approche naïve :** Vous pourriez coder en dur les paramètres en haut de votre script : `START_WORD = "the"`, `LENGTH = 30`, `TEMPERATURE = 1.0`. Cela fonctionne pour vous, mais personne d'autre ne peut l'utiliser sans éditer le fichier. Ce n'est pas un outil, c'est un script que vous seul savez exécuter.

**La solution :** Deux ajouts le transforment en une vraie application. D'abord, `argparse`, l'analyseur d'arguments de ligne de commande intégré de Python. Il gère les messages `--help`, la validation de types, les valeurs par défaut et les messages d'erreur automatiquement. Ensuite, la mise à l'échelle de température, un paramètre qui redessine la distribution de probabilité avant l'échantillonnage. La température fonctionne en divisant chaque log-probabilité par une valeur de température T : un T bas (par exemple 0,5) rend la distribution plus marquée (les mots à forte probabilité dominent), tandis qu'un T élevé (par exemple 2,0) l'aplatit (tous les mots deviennent plus également probables).

**Comment cela fonctionne :** Le script de pipeline enchaîne les cinq étapes en un seul flux. `argparse` analyse les arguments de ligne de commande dans un objet de configuration. Le corpus est chargé, tokenisé et nourri dans le constructeur de bigrammes. Le paramètre de température est appliqué pendant l'échantillonnage en redimensionnant les poids avant de les passer à `random.choices()`. Quand la température est de 1,0, la distribution est inchangée. Quand elle est de 0,1, le modèle choisit presque toujours le mot le plus probable. Quand elle est de 5,0, même les mots rares ont une chance de l'emporter. Cette simple astuce d'échelle est le même mécanisme derrière le curseur de « température » dans ChatGPT et d'autres outils IA modernes.

## Gamification

- **Récompense XP** : +60 XP par leçon terminée (120 XP au total pour ce module)
- **Défis** : Chaque leçon a des défis interactifs, construire le CLI, régler la température, tester les cas limites
- **Progression** : terminez les deux leçons pour terminer ce module
- **Bonus de série** : +15 XP supplémentaires par jour une fois votre série au-delà de 3 jours
- **Jalon PBL** : Vous avez maintenant un générateur de texte en ligne de commande fonctionnel, c'est LE projet de synthèse

## Projets que vous pouvez créer

Après avoir terminé ce module, vous serez prêt à attaquer ces projets réels :

- 🤖 **Écrivain d'histoires IA**, étendez le CLI avec des invites d'histoire, la sélection de genre et la génération de chapitres
- 💬 **Constructeur de chatbot**, ajoutez une boucle interactive qui prend l'entrée utilisateur et génère des réponses
- 📝 **Tuteur IA**, construisez un outil qui génère des phrases d'exercice et des quiz à partir de corpus éducatifs
- 🔍 **Moteur de recherche sémantique**, combinez la génération de texte avec la recherche pour un système de génération augmentée par récupération (RAG)
- 📰 **Générateur de newsletters**, automatisez la rédaction d'articles en générant des résumés à partir des articles sources

## Leçons

1. **Réglage de la température**, modifiez les probabilités d'échantillonnage avec un paramètre de température
2. **Générateur de texte CLI**, construisez l'interface de ligne de commande finale qui relie tout