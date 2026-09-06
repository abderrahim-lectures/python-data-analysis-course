---
title: "Moteur de Blog Markdown"
description: "Un générateur de site statique qui convertit des articles Markdown en un site publiable avec coloration syntaxique."
tags: ["cli", "frontend", "data-pipeline"]
---

# Moteur de Blog Markdown

Créez un générateur de site statique qui transforme des fichiers Markdown en un beau blog.

## Ce que vous allez construire

Un outil en ligne de commande qui :
- Lit les fichiers `.md` depuis un répertoire d'articles
- Parse les métadonnées frontmatter (titre, date, tags)
- Convertit Markdown en HTML avec coloration syntaxique
- Génère une page d'index avec filtrage par tags
- Produit un site statique complet

## Fonctionnalités

- **Parsing frontmatter** — Métadonnées YAML pour chaque article
- **Coloration syntaxique** — Blocs de code colorés
- **Système de tags** — Pages de tags automatiques
- **Flux RSS** — Générer un flux RSS/Atom valide
- **Mode sombre** — Basculer entre thèmes clair et sombre

## Stack technique

- Python 3.12+
- Bibliothèque Markdown pour la conversion
- Pygments pour la coloration syntaxique
- Jinja2 pour les modèles HTML

## Objectifs supplémentaires

- [ ] Ajouter la recherche plein texte
- [ ] Implémenter les estimations de temps de lecture
- [ ] Ajouter les métadonnées de partage social (Open Graph)
- [ ] Déployer sur GitHub Pages avec une seule commande
