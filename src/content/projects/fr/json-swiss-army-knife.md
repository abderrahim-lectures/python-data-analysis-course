---
title: "Couteau Suisse JSON"
description: "Un outil CLI qui formate, valide, interroge et transforme des fichiers JSON avec la puissance de JQ."
tags: ["cli", "data-pipeline", "developer-tools"]
---

# Couteau Suisse JSON

Créez un outil de traitement JSON puissant en ligne de commande.

## Ce que vous allez construire

Un outil en ligne de commande qui :
- Formate le JSON minifié de manière lisible
- Valide la syntaxe JSON avec localisation des erreurs
- Interroge les données avec des chemins en notation point
- Transforme JSON avec des filtres et des maps
- Convertit entre JSON, YAML et TOML

## Fonctionnalités

- **Formatage et linting** — Formatage lisible avec indentation configurable
- **Validation** — Vérifier la syntaxe et signaler les erreurs avec numéros de ligne
- **Requêtes** — Expressions de chemin style JQ (`$.users[*].name`)
- **Transformation** — Filtrer, mapper et remodeler les données
- **Conversion** — Échange JSON ↔ YAML ↔ TOML

## Stack technique

- Python 3.12+
- Click pour le CLI
- PyYAML et tomli pour la conversion de formats
- Rich pour la sortie colorée

## Objectifs supplémentaires

- [ ] Ajouter un analyseur JSON en streaming pour les gros fichiers
- [ ] Implémenter un diff JSON entre deux fichiers
- [ ] Ajouter la validation de schéma JSON
- [ ] Créer un mode REPL pour l'exploration interactive
