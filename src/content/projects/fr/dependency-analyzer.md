---
title: "Analyseur de Dépendances"
description: "Visualiser et auditer les dépendances de votre projet — trouver les vulnérabilités, paquets obsolètes et risques de licence."
---

# Analyseur de Dépendances

## Ce que vous construirez

- Un outil qui scanne les fichiers requirements et poetry pour cartographier votre arbre de dépendances
- Trouver les vulnérabilités, paquets obsolètes et risques de licence automatiquement
- Détecter les dépendances inutilisées qui peuvent être supprimées en toute sécurité
- Visualiser l'arbre complet de dépendances avec des graphiques interactifs

## Fonctionnalités

- **Scan de vulnérabilités**: Vérifier les dépendances contre les advisories de sécurité connus
- **Conformité des licences**: Identifier les licences et signaler les problèmes de compatibilité
- **Détection d'inutilisées**: Trouver les dépendances installées mais jamais importées
- **Visualisation d'arbre**: Générer des graphiques interactifs de l'arbre de dépendances

## Objectifs supplémentaires

- [ ] Ajouter le support pour la surveillance des mises à jour de dépendances via GitHub Dependabot
- [ ] Construire une vérification CI qui échoue sur les vulnérabilités critiques
- [ ] Implémenter la création automatique de PRs pour les mises à jour sûres
