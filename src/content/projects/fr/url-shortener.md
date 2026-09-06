---
title: "API Raccourcisseur d'URL"
description: "Créez un raccourcisseur d'URL avec analytics — suivez les clics, les référents et les données géographiques."
tags: ["api", "backend", "database"]
---

# API Raccourcisseur d'URL

Créez un service de raccourcissement d'URL entièrement fonctionnel avec analytics de clics.

## Ce que vous allez construire

Une API REST qui raccourcit les URLs et suit :
- Le total des clics par lien court
- Les sources de référents
- La distribution géographique
- Les données de clics temporelles

## Fonctionnalités

- **Génération de code court** — Encodage Base62 pour des URLs compactes
- **Suivi des clics** — Enregistrer chaque visite avec métadonnées
- **Tableau de bord analytics** — Visualiser les patterns de clics dans le temps
- **Limitation de débit** — Prévenir les abus avec des limites configurables
- **Alias personnalisés** — Permettre aux utilisateurs de choisir leurs propres codes courts

## Stack technique

- Python 3.12+
- FastAPI pour l'API REST
- SQLite pour le stockage
- Charts pour la visualisation des analytics

## Objectifs supplémentaires

- [ ] Ajouter la génération de code QR pour chaque URL courte
- [ ] Implémenter l'expiration des liens
- [ ] Ajouter l'analyse des paramètres UTM
- [ ] Créer un tableau de bord analytics simple
