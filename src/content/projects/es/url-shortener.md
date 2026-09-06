---
title: "API Acortador de URLs"
description: "Construye un acortador de URLs con análisis — rastrea clics, referentes y datos geográficos."
tags: ["api", "backend", "database"]
---

# API Acortador de URLs

Construye un servicio de acortamiento de URLs completamente funcional con análisis de clics.

## Lo que construirás

Una API REST que acorta URLs y rastrea:
- Total de clics por enlace corto
- Fuentes de referentes
- Distribución geográfica
- Datos de clics serie temporal

## Características

- **Generación de código corto** — Codificación Base62 para URLs compactas
- **Rastreo de clics** — Registrar cada visita con metadatos
- **Panel de análisis** — Visualizar patrones de clics a lo largo del tiempo
- **Límite de velocidad** — Prevenir abusos con límites configurables
- **Alias personalizados** — Permitir a los usuarios elegir sus propios códigos cortos

## Pila tecnológica

- Python 3.12+
- FastAPI para la API REST
- SQLite para almacenamiento
- Charts para visualización de análisis

## Objetivos adicionales

- [ ] Agregar generación de código QR para cada URL corta
- [ ] Implementar expiración de enlaces
- [ ] Agregar análisis de parámetros UTM
- [ ] Construir un panel de análisis simple
