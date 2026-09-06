---
title: "Générateur de Descriptions d'Images"
description: "Génère des descriptions en langage naturel pour les images en utilisant des modèles vision-langage."
---

# Générateur de Descriptions d'Images

## Ce que vous allez construire

- Accepte le téléchargement d'images ou URLs et génère des descriptions lisibles par l'homme
- Utilise des modèles pré-entraînés de vision-langage comme BLIP ou LLaVA
- Fournit des scores de confiance avec chaque description générée
- Supporte le traitement par lots de répertoires entiers d'images

## Fonctionnalités

- **Modèles multiples** — Bascule entre BLIP, LLaVA et d'autres modèles de vision-langage
- **Mode par lots** — Traite des centaines d'images en une exécution avec suivi de progression
- **Vocabulaire personnalisé** — Ajoute des termes spécifiques au domaine pour améliorer la précision
- **Export EXIF** — Intègre automatiquement les descriptions générées dans les métadonnées d'image

## Objectifs supplémentaires

- [ ] Ajouter une interface web avec glisser-déposer pour le téléchargement
- [ ] Supporter la description de vidéos en analysant les images clés
- [ ] Entraîner un modèle personnalisé sur un jeu de données d'images spécifique
