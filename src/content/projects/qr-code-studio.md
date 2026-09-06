---
title: "QR Code Studio"
description: "Generate, customize, and batch-process QR codes with logos, colors, and error correction levels."
tags: ["cli", "utility", "data-visualization"]
---

# QR Code Studio

Build a QR code generator with professional customization options.

## What You'll Build

A tool that:
- Generates QR codes from text, URLs, or contact data
- Customizes colors, logos, and error correction
- Supports batch generation from CSV files
- Outputs SVG, PNG, or terminal-friendly formats
- Validates QR codes by reading them back

## Features

- **Custom styling** — Colors, rounded corners, logo embedding
- **Error correction** — L, M, Q, H levels with trade-off info
- **Batch mode** — Generate hundreds from a CSV spreadsheet
- **Format export** — SVG for web, PNG for print, ASCII for terminal
- **Validation** — Scan and verify generated codes

## Tech Stack

- Python 3.12+
- qrcode library for generation
- Pillow for image manipulation
- Click for CLI

## Stretch Goals

- [ ] Add Wi-Fi QR code generator
- [ ] Implement vCard/MECARD support
- [ ] Build a simple web UI with Gradio
- [ ] Add QR code reading capability
