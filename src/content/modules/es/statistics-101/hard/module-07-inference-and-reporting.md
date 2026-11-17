---
title: "Inferencia y comunicación"
description: "Regresión múltiple y remuestreo: ajustar por confusores y expresar la incertidumbre de forma que se pueda revisar."
order: 7
section: "statistics-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 3
lessonCount: 2
tags: ["regresión-múltiple", "confusión", "bootstrap", "informes"]
prerequisites: []
icon: "🧪"
---

## Por qué importa

Las dos últimas lecciones de la ruta difícil tratan de la defensa del resultado. Un coeficiente de una sola variable es el número más fácil de producir en estadística y el más fácil de refutar; un intervalo construido sobre un supuesto que nadie comprobó puede parecer preciso y estar equivocado.

Ambas lecciones sustituyen un atajo por un procedimiento: ajustar por un confusor medido en lugar de agrupar sin más, y remuestrear en lugar de suponer una forma. Ninguno es complicado, y cualquiera convierte una afirmación en algo que otra persona puede examinar.

## Qué vas a aprender

- Leer un coeficiente ajustado con su cláusula "manteniendo el resto fijo", y saber cuándo ajustar es un error
- Distinguir un confusor de un mediador y de un colisionador
- Construir un intervalo por remuestreo cuando los supuestos de la fórmula no se cumplen
- Separar error muestral de sesgo, y redactar un análisis que nombre sus propios límites
