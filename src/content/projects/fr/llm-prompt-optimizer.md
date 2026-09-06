---
title: "Optimiseur de Prompts LLM"
description: "Affine automatiquement les prompts en utilisant des tests A/B, des exemples few-shot et des modèles de chaîne de pensée."
---

# Optimiseur de Prompts LLM

## Ce que vous allez construire

- Un outil CLI qui prend des prompts bruts et génère des variantes optimisées
- Teste automatiquement les modèles few-shot, chaîne de pensée et basés sur les rôles
- Compare les variantes de prompts en utilisant des métriques de scoring intégrées
- Exporte les prompts optimisés pour les flux de travail LLM ultérieurs

## Fonctionnalités

- **Auto-optimisation** — Génère et classe automatiquement les variantes de prompts
- **Tests A/B** — Compare les prompts côte à côte sur la même entrée
- **Injection few-shot** — Sélectionne et insère automatiquement des exemples pertinents
- **Métriques de scoring** — Mesure la précision, la cohérence et l'efficacité des tokens

## Objectifs supplémentaires

- [ ] Ajouter une interface web pour l'édition visuelle des prompts
- [ ] Supporter l'optimisation de conversations multi-tours
- [ ] Créer un système de versionnage de prompts avec historique type git
