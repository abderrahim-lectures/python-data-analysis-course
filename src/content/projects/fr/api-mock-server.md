---
title: "Serveur Mock API"
description: "Générer des APIs mock réalistes à partir de spécifications OpenAPI pour le développement et tests frontend."
---

# Serveur Mock API

## Ce que vous construirez

- Un serveur mock qui lit les spécifications OpenAPI et Swagger pour générer des APIs réalistes
- Fournir une génération de données réalistes basée sur les définitions de schéma
- Simuler la latence réseau et les scénarios d'erreur pour les tests
- Enregistrer et rejouer des interactions API réelles pour le développement hors ligne

## Fonctionnalités

- **Génération de données réalistes**: Générer des données mock qui correspondent aux types et contraintes du schéma
- **Simulation de latence**: Ajouter des délais configurables pour simuler les conditions réseau réelles
- **Enregistrement de scénarios**: Enregistrer les interactions API réelles et les rejouer comme mocks
- **Mode proxy**: Transférer les requêtes vers un backend réel tout en enregistrant les réponses

## Objectifs supplémentaires

- [ ] Ajouter un tableau de bord web pour gérer les endpoints mock et données
- [ ] Implémenter les tests de contrat entre le frontend et le serveur mock
- [ ] Construire un serveur mock partagé pour la collaboration en équipe
