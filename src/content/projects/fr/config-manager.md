---
title: "Gestionnaire de Configuration"
description: "Gérer les configs d'applications à travers les environnements avec validation, chiffrement et détection de dérive."
---

# Gestionnaire de Configuration

## Ce que vous construirez

- Un système centralisé de gestion de configuration pour les applications
- Gérer les configurations spécifiques à chaque environnement avec validation et chiffrement
- Détecter la dérive de configuration entre les environnements
- Ne plus jamais coder en dur les valeurs de configuration

## Fonctionnalités

- **Configs par environnement**: Gérer des configurations séparées pour dev, staging et production
- **Chiffrement des secrets**: Chiffrer les valeurs sensibles en utilisant AES-256
- **Validation de schéma**: Valider les fichiers de configuration contre les schémas définis
- **Alertes de dérive**: Détecter quand les configurations dévient de l'état attendu

## Objectifs supplémentaires

- [ ] Ajouter une UI web pour gérer les configurations à travers les environnements
- [ ] Implémenter des flux de déploiement de configuration avec portes d'approbation
- [ ] Construire une intégration avec HashiCorp Vault pour la gestion des secrets
