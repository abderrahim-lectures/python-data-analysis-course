---
title: "Studio Code QR"
description: "Générez, personnalisez et traitez des codes QR en lot avec logos, couleurs et niveaux de correction d'erreurs."
tags: ["cli", "utility", "data-visualization"]
---

# Studio Code QR

Créez un générateur de codes QR avec des options de personnalisation professionnelles.

## Ce que vous allez construire

Un outil qui :
- Génère des codes QR à partir de texte, URLs ou données de contact
- Personnalise les couleurs, logos et la correction d'erreurs
- Prend en charge la génération en lot depuis des fichiers CSV
- Exporte en formats SVG, PNG ou compatibles terminal
- Valide les codes QR en les relisant

## Fonctionnalités

- **Style personnalisé** — Couleurs, arrondis, intégration de logo
- **Correction d'erreurs** — Niveaux L, M, Q, H avec informations de compromis
- **Mode lot** — Générer des centaines depuis un fichier CSV
- **Export de format** — SVG pour le web, PNG pour l'impression, ASCII pour le terminal
- **Validation** — Scanner et vérifier les codes générés

## Stack technique

- Python 3.12+
- Bibliothèque qrcode pour la génération
- Pillow pour la manipulation d'images
- Click pour le CLI

## Objectifs supplémentaires

- [ ] Ajouter un générateur de code QR Wi-Fi
- [ ] Implémenter le support vCard/MECARD
- [ ] Créer une interface web simple avec Gradio
- [ ] Ajouter la capacité de lecture de codes QR
