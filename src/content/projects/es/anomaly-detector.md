---
title: "Sistema de Detección de Anomalías"
description: "Detecta patrones inusuales en datos de series temporales, logs y métricas con alertas automáticas."
---

# Sistema de Detección de Anomalías

## Lo que construirás

- Un pipeline que ingiere datos de series temporales y aplica múltiples métodos de detección
- Clasifica anomalías por tipo y severidad con alertas automáticas
- Adapta líneas base automáticamente para cuenta de estacionalidad y tendencias
- Proporciona sugerencias de causa raíz para anomalías detectadas

## Características

- **Múltiples métodos** — Usa Z-score, Isolation Forest y DBSCAN para detección
- **Línea base automática** — Establece y actualiza comportamientos normales automáticamente
- **Manejo de estacionalidad** — Considera patrones diarios, semanales y estacionales
- **Sugerencias de causa raíz** — Correlaciona anomalías con cambios y eventos recientes

## Objetivos adicionales

- [ ] Agregar panel en vivo con visualización de anomalías en tiempo real
- [ ] Implementar alertas predictivas antes de que ocurran anomalías
- [ ] Crear integración con PagerDuty y Opsgenie para gestión de incidentes
