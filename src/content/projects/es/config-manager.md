---
title: "Gestor de Configuración"
description: "Gestionar configs de aplicaciones en múltiples entornos con validación, cifrado y detección de deriva."
---

# Gestor de Configuración

## Lo que construirás

- Un sistema centralizado de gestión de configuración para aplicaciones
- Gestionar configuraciones específicas por entorno con validación y cifrado
- Detectar deriva de configuración entre entornos
- Nunca volver a hardcodear valores de configuración

## Características

- **Configs por entorno**: Gestionar configuraciones separadas para dev, staging y producción
- **Cifrado de secretos**: Cifrar valores sensibles usando AES-256
- **Validación de esquema**: Validar archivos de configuración contra esquemas definidos
- **Alertas de deriva**: Detectar cuando las configuraciones se desvían del estado esperado

## Objetivos adicionales

- [ ] Agregar una UI web para gestionar configuraciones entre entornos
- [ ] Implementar flujos de despliegue de configuración con puertas de aprobación
- [ ] Construir integración con HashiCorp Vault para gestión de secretos
