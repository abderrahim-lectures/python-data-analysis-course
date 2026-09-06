---
title: "Motor de Blog en Markdown"
description: "Un generador de sitios estáticos que convierte publicaciones en Markdown a un sitio publicable con resaltado de sintaxis."
tags: ["cli", "frontend", "data-pipeline"]
---

# Motor de Blog en Markdown

Construye un generador de sitios estáticos que convierte archivos Markdown en un blog hermoso.

## Lo que construirás

Una herramienta de línea de comandos que:
- Lee archivos `.md` de un directorio de publicaciones
- Parsea metadatos frontmatter (título, fecha, etiquetas)
- Convierte Markdown a HTML con resaltado de sintaxis
- Genera una página índice con filtrado por etiquetas
- Produce un sitio estático completo

## Características

- **Parseo de frontmatter** — Metadatos YAML para cada publicación
- **Resaltado de sintaxis** — Bloques de código con colores
- **Sistema de etiquetas** — Páginas de etiquetas automáticas
- **Feed RSS** — Generar un feed RSS/Atom válido
- **Modo oscuro** — Alternar entre temas claro y oscuro

## Pila tecnológica

- Python 3.12+
- Biblioteca Markdown para conversión
- Pygments para resaltado de sintaxis
- Jinja2 para plantillas HTML

## Objetivos adicionales

- [ ] Agregar búsqueda de texto completo
- [ ] Implementar estimaciones de tiempo de lectura
- [ ] Agregar metadatos de compartir social (Open Graph)
- [ ] Desplegar a GitHub Pages con un solo comando
