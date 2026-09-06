---
title: "Data Masking Tool"
description: "Anonymize sensitive data for development and testing while preserving statistical properties."
---

# Data Masking Tool

## What You'll Build

- A tool that replaces PII with realistic fake data for safe development and testing
- Preserve statistical properties of original data while protecting privacy
- Detect and classify sensitive data automatically
- Generate audit logs of all masking operations

## Features

- **PII detection**: Automatically identify names, emails, phone numbers, and other sensitive fields
- **Format-preserving encryption**: Maintain data format while encrypting values
- **Statistical preservation**: Keep distributions and correlations intact after masking
- **Audit logs**: Track all masking operations for compliance

## Stretch Goals

- [ ] Add support for custom masking rules per column
- [ ] Build a web UI for masking configuration and preview
- [ ] Implement differential privacy for aggregate data exports
