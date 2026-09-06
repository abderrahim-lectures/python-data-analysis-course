---
title: "Système de Détection d'Anomalies"
description: "Détectez les patterns inhabituels dans les données de séries temporelles, logs et métriques avec alertes automatiques."
---

# Système de Détection d'Anomalies

## Ce que vous allez construire

- Un pipeline qui ingère des données de séries temporelles et applique plusieurs méthodes de détection
- Classifie les anomalies par type et sévérité avec alertes automatiques
- Adapte les lignes de base automatiquement pour tenir compte de la saisonnalité et des tendances
- Fournit des suggestions de cause racine pour les anomalies détectées

## Fonctionnalités

- **Méthodes multiples** — Utilise Z-score, Isolation Forest et DBSCAN pour la détection
- **Ligne de base automatique** — Établit et met à jour les comportements normaux automatiquement
- **Gestion de la saisonnalité** — Tient compte des patterns quotidiens, hebdomadaires et saisonniers
- **Suggestions de cause racine** — Corrèle les anomalies avec les changements et événements récents

## Objectifs supplémentaires

- [ ] Ajouter un tableau de bord en direct avec visualisation des anomalies en temps réel
- [ ] Implémenter des alertes prédictives avant que les anomalies ne se produisent
- [ ] Créer une intégration avec PagerDuty et Opsgenie pour la gestion des incidents
