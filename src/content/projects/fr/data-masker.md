---
title: "Outil de Masquage de Données"
description: "Anonymiser les données sensibles pour le développement et les tests tout en préservant les propriétés statistiques."
---

# Outil de Masquage de Données

## Ce que vous construirez

- Un outil qui remplace les PII par des données fausses réalistes pour un développement et des tests sûrs
- Préserver les propriétés statistiques des données originales tout en protégeant la vie privée
- Détecter et classifier les données sensibles automatiquement
- Générer des journaux d'audit de toutes les opérations de masquage

## Fonctionnalités

- **Détection de PII**: Identifier automatiquement les noms, emails, numéros de téléphone et autres champs sensibles
- **Chiffrement préservant le format**: Maintenir le format des données tout en chiffrant les valeurs
- **Préservation statistique**: Garder les distributions et corrélations intactes après le masquage
- **Journaux d'audit**: Suivre toutes les opérations de masquage pour la conformité

## Objectifs supplémentaires

- [ ] Ajouter le support pour des règles de masquage personnalisées par colonne
- [ ] Construire une UI web pour la configuration et prévisualisation du masquage
- [ ] Implémenter la confidentialité différentielle pour les exportations de données agrégées
