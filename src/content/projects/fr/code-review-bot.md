---
title: "Bot de Revue de Code IA"
description: "Revue de code automatisée qui détecte les bugs, suggère des améliorations et applique les guidelines de style."
---

# Bot de Revue de Code IA

## Ce que vous allez construire

- Surveille les pull requests GitHub et analyse les changements de code avec un LLM
- Publie des commentaires de revue directement sur les diffs avec des suggestions exploitables
- Applique les guidelines de style de code et détecte les patterns d'erreurs courants
- Suit les métriques de qualité de code au fil du temps dans votre projet

## Fonctionnalités

- **Analyse des diffs** — Comprend le contexte des changements et revue de manière significative
- **Détection de bugs** — Détecte les pièges courants comme les références nulles et les race conditions
- **Application du style** — Applique et fait respecter les standards de codage personnalisés automatiquement
- **Scan de sécurité** — Signale les vulnérabilités potentielles dans le nouveau code

## Objectifs supplémentaires

- [ ] Ajouter le support pour GitLab et Bitbucket
- [ ] Implémenter des suggestions de correction automatique en un clic
- [ ] Créer un tableau de bord montrant les tendances de qualité de code par dépôt
