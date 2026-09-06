---
title: "Analizador de Dependencias"
description: "Visualizar y auditar las dependencias de tu proyecto — encontrar vulnerabilidades, paquetes obsoletos y riesgos de licencia."
---

# Analizador de Dependencias

## Lo que construirás

- Una herramienta que escanea archivos requirements y poetry para mapear tu árbol de dependencias
- Encontrar vulnerabilidades, paquetes obsoletos y riesgos de licencia automáticamente
- Detectar dependencias no utilizadas que se pueden eliminar de forma segura
- Visualizar el árbol completo de dependencias con gráficos interactivos

## Características

- **Escaneo de vulnerabilidades**: Verificar dependencias contra advisories de seguridad conocidos
- **Cumplimiento de licencias**: Identificar licencias y señalar problemas de compatibilidad
- **Detección de no utilizadas**: Encontrar dependencias instaladas pero nunca importadas
- **Visualización de árbol**: Generar gráficos interactivos del árbol de dependencias

## Objetivos adicionales

- [ ] Agregar soporte para monitoreo de actualizaciones de dependencias vía GitHub Dependabot
- [ ] Construir una verificación CI que falle en vulnerabilidades críticas
- [ ] Implementar creación automática de PRs para actualizaciones seguras
