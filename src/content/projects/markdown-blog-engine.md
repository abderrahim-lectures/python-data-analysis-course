---
title: "Markdown Blog Engine"
description: "A static blog generator that converts Markdown posts to a publishable site with syntax highlighting."
tags: ["cli", "frontend", "data-pipeline"]
---

# Markdown Blog Engine

Build a static site generator that turns Markdown files into a beautiful blog.

## What You'll Build

A CLI tool that:
- Reads `.md` files from a posts directory
- Parses frontmatter for metadata (title, date, tags)
- Converts Markdown to HTML with syntax highlighting
- Generates an index page with tag filtering
- Outputs a complete static site

## Features

- **Frontmatter parsing** — YAML metadata for each post
- **Syntax highlighting** — Color-coded code blocks
- **Tag system** — Automatic tag pages
- **RSS feed** — Generate a valid RSS/Atom feed
- **Dark mode** — Toggle between light and dark themes

## Tech Stack

- Python 3.12+
- Markdown library for conversion
- Pygments for syntax highlighting
- Jinja2 for HTML templates

## Stretch Goals

- [ ] Add full-text search
- [ ] Implement reading time estimates
- [ ] Add social sharing metadata (Open Graph)
- [ ] Deploy to GitHub Pages with a single command
