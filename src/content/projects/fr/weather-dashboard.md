---
title: "Tableau de Bord Météo"
description: "Un tableau de bord terminal affichant les données météo en temps réel, les prévisions et des graphiques historiques pour n'importe quelle ville."
tags: ["api", "cli", "data-visualization"]
---

# Tableau de Bord Météo

Créez un beau tableau de bord terminal pour les données météorologiques.

## Ce que vous allez construire

Une application en ligne de commande qui :
- Récupère la météo actuelle depuis l'API Open-Meteo
- Affiche les prévisions sur 7 jours avec des icônes
- Présente des graphiques de température horaire
- Compare la météo entre plusieurs villes
- Fonctionne entièrement hors ligne après la première récupération

## Fonctionnalités

- **Données en temps réel** — Conditions actuelles pour n'importe quelle coordonnée
- **Graphiques de prévision** — Graphiques de température en ASCII art
- **Comparaison de villes** — Vue côte à côte de la météo
- **Cache** — Éviter les appels API redondants
- **Changement d'unités** — Basculer entre métrique et impérial

## Stack technique

- Python 3.12+
- httpx pour les appels API
- Rich pour l'interface terminal
- Matplotlib pour la génération de graphiques

## Objectifs supplémentaires

- [ ] Ajouter des alertes météo et notifications de temps sever
- [ ] Créer un analyseur de météo historique
- [ ] Créer un système de favoris de localisation
- [ ] Ajouter un mode TUI avec navigation interactive
