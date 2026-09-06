---
title: "Panel del Clima"
description: "Un panel de terminal que muestra el clima en tiempo real, pronósticos y gráficos históricos para cualquier ciudad."
tags: ["api", "cli", "data-visualization"]
---

# Panel del Clima

Construye un hermoso panel de terminal para datos climáticos.

## Lo que construirás

Una aplicación de línea de comandos que:
- Obtiene el clima actual de la API Open-Meteo
- Muestra pronósticos de 7 días con iconos
- Presenta gráficos de temperatura por hora
- Compara el clima entre múltiples ciudades
- Funciona completamente sin conexión después de la primera obtención

## Características

- **Datos en tiempo real** — Condiciones actuales para cualquier coordenada
- **Gráficos de pronóstico** — Gráficos de temperatura en arte ASCII
- **Comparación de ciudades** — Vista del clima lado a lado
- **Caché** — Evitar llamadas API redundantes
- **Cambio de unidades** — Alternar entre métricas e imperiales

## Pila tecnológica

- Python 3.12+
- httpx para llamadas API
- Rich para interfaz de terminal
- Matplotlib para generación de gráficos

## Objetivos adicionales

- [ ] Agregar alertas climáticas y notificaciones de clima severo
- [ ] Construir un analizador de clima histórico
- [ ] Crear un sistema de marcadores de ubicación
- [ ] Agregar un modo TUI con navegación interactiva
