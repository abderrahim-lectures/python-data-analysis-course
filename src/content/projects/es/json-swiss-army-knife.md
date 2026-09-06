---
title: "Cuchillo Suizo JSON"
description: "Una herramienta CLI que formatea, valida, consulta y transforma archivos JSON con el poder de JQ."
tags: ["cli", "data-pipeline", "developer-tools"]
---

# Cuchillo Suizo JSON

Construye una herramienta de procesamiento JSON potente desde la línea de comandos.

## Lo que construirás

Una herramienta de línea de comandos que:
- Formatea JSON minificado de manera legible
- Valida la sintaxis de JSON con ubicación de errores
- Consulta datos con rutas de notación punto
- Transforma JSON con filtros y mapas
- Convierte entre JSON, YAML y TOML

## Características

- **Formato y linting** — Formateo legible con indentación configurable
- **Validación** — Verificar sintaxis y reportar errores con números de línea
- **Consulta** — Expresiones de ruta estilo JQ (`$.users[*].name`)
- **Transformación** — Filtrar, mapear y remodelar datos
- **Conversión** — Intercambio JSON ↔ YAML ↔ TOML

## Pila tecnológica

- Python 3.12+
- Click para CLI
- PyYAML y tomli para conversión de formatos
- Rich para salida con colores

## Objetivos adicionales

- [ ] Agregar analizador JSON streaming para archivos grandes
- [ ] Implementar diff de JSON entre dos archivos
- [ ] Agregar validación de esquema JSON
- [ ] Construir un modo REPL para exploración interactiva
