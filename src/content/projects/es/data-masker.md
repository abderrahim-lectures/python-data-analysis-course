---
title: "Herramienta de Enmascaramiento de Datos"
description: "Anonimizar datos sensibles para desarrollo y pruebas preservando propiedades estadísticas."
---

# Herramienta de Enmascaramiento de Datos

## Lo que construirás

- Una herramienta que reemplaza PII con datos falsos realistas para desarrollo y pruebas seguras
- Preservar propiedades estadísticas de los datos originales mientras se protege la privacidad
- Detectar y clasificar datos sensibles automáticamente
- Generar registros de auditoría de todas las operaciones de enmascaramiento

## Características

- **Detección de PII**: Identificar automáticamente nombres, correos electrónicos, números de teléfono y otros campos sensibles
- **Cifrado preservando formato**: Mantener el formato de datos mientras se cifran los valores
- **Preservación estadística**: Mantener distribuciones y correlaciones intactas después del enmascaramiento
- **Registros de auditoría**: Rastrear todas las operaciones de enmascaramiento para cumplimiento

## Objetivos adicionales

- [ ] Agregar soporte para reglas de enmascaramiento personalizadas por columna
- [ ] Construir una UI web para configuración y previsualización del enmascaramiento
- [ ] Implementar privacidad diferencial para exportaciones de datos agregados
