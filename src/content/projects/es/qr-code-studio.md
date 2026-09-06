---
title: "Estudio de Códigos QR"
description: "Genera, personaliza y procesa códigos QR por lotes con logotipos, colores y niveles de corrección de errores."
tags: ["cli", "utility", "data-visualization"]
---

# Estudio de Códigos QR

Construye un generador de códigos QR con opciones de personalización profesionales.

## Lo que construirás

Una herramienta que:
- Genera códigos QR a partir de texto, URLs o datos de contacto
- Personaliza colores, logotipos y corrección de errores
- Soporta generación por lotes desde archivos CSV
- Exporta en formatos SVG, PNG o compatibles con terminal
- Valida códigos QR leyéndolos de vuelta

## Características

- **Estilo personalizado** — Colores, esquinas redondeadas, incrustación de logotipos
- **Corrección de errores** — Niveles L, M, Q, H con información de compromiso
- **Modo por lotes** — Generar cientos desde una hoja CSV
- **Exportación de formato** — SVG para web, PNG para impresión, ASCII para terminal
- **Validación** — Escanear y verificar códigos generados

## Pila tecnológica

- Python 3.12+
- Biblioteca qrcode para generación
- Pillow para manipulación de imágenes
- Click para CLI

## Objetivos adicionales

- [ ] Agregar generador de códigos QR Wi-Fi
- [ ] Implementar soporte vCard/MECARD
- [ ] Construir una interfaz web simple con Gradio
- [ ] Agregar capacidad de lectura de códigos QR
