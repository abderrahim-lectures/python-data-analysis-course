---
title: "Tableau de Bord d'Analyse de Sentiment"
description: "Analyse de sentiment en temps réel des flux de réseaux sociaux avec graphiques de tendances et alertes."
---

# Tableau de Bord d'Analyse de Sentiment

## Ce que vous allez construire

- Un tableau de bord en direct qui surveille le sentiment des réseaux sociaux en temps réel
- Diffuse du texte depuis des APIs, exécute l'analyse NLP et stocke dans une base de données de séries temporelles
- Affiche des graphiques de tendances avec des alertes basées sur des mots-clés
- Suit les changements de sentiment sur plusieurs plateformes simultanément

## Fonctionnalités

- **Diffusion en temps réel** — Reçoit et analyse les flux de réseaux sociaux au fur et à mesure qu'ils arrivent
- **Comparaison multi-modèles** — Compare les modèles VADER, TextBlob et basés sur les transformateurs côte à côte
- **Alertes par mots-clés** — Configure des notifications lorsque des sujets spécifiques augmentent ou diminuent
- **Tendances historiques** — Visualise le sentiment au fil du temps avec des graphiques interactifs

## Objectifs supplémentaires

- [ ] Ajouter des mises à jour en direct via WebSocket au tableau de bord
- [ ] Implémenter la détection de sentiment multilingue
- [ ] Créer un bot Slack ou Discord qui publie des alertes lors du dépassement de seuils
