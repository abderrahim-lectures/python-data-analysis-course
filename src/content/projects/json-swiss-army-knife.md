---
title: "JSON Swiss Army Knife"
description: "A CLI tool that formats, validates, queries, and transforms JSON files with JQ-like power."
tags: ["cli", "data-pipeline", "developer-tools"]
---

# JSON Swiss Army Knife

Build a powerful JSON processing CLI tool.

## What You'll Build

A command-line tool that:
- Pretty-prints minified JSON
- Validates JSON syntax with error locations
- Queries data with dot-notation paths
- Transforms JSON with filters and maps
- Converts between JSON, YAML, and TOML

## Features

- **Format & lint** — Pretty-print with configurable indentation
- **Validate** — Check syntax and report errors with line numbers
- **Query** — JQ-style path expressions (`$.users[*].name`)
- **Transform** — Filter, map, and reshape data
- **Convert** — JSON ↔ YAML ↔ TOML interchange

## Tech Stack

- Python 3.12+
- Click for CLI
- PyYAML and tomli for format conversion
- Rich for colored output

## Stretch Goals

- [ ] Add streaming JSON parser for large files
- [ ] Implement JSON diff between two files
- [ ] Add JSON schema validation
- [ ] Build a REPL mode for interactive exploration
