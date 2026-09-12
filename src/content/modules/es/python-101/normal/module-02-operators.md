---
title: "Operadores y expresiones"
description: "Operadores aritméticos, de comparación y booleanos, los bloques de construcción de toda expresión."
order: 2
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 2
lessonCount: 3
tags: ["operadores", "aritmética", "comparación", "booleano", "precedencia"]
prerequisites: ["module-01-python-basics"]
icon: "🔢"
---

## Por qué es importante

Cada vez que escribes `x + y`, usas un operador. Los operadores son los verbos de la programación, toman tus datos y *hacen algo* con ellos. Sin ellos, podrías almacenar valores pero nunca calcular nada. Una app de calculadora que no puede sumar es solo una pantalla.

Considera construir un carrito de compras. Necesitas calcular subtotales (`price * quantity`), aplicar descuentos (`subtotal * 0.9`), comprobar si la persona usuaria tiene suficiente dinero (`total <= balance`) y determinar si el envío es gratis (`subtotal >= 50`). Cada uno de estos es una expresión con operadores. Y el orden en que los evalúas importa, `3 + 4 * 2` es 11, no 14, porque la multiplicación ocurre antes que la suma. Malentendido de la precedencia y tus totales saldrán mal.

Los operadores booleanos (`and`, `or`, `not`) te permiten combinar condiciones. "¿La persona usuaria está conectada Y tiene una suscripción válida?", eso es `is_logged_in and has_subscription`. Sin comprender cómo funcionan estos operadores juntos, no puedes expresar la lógica del mundo real en código.

## Lo que aprenderás

- Operadores aritméticos, incluidos la división de piso (`//`) y el módulo (`%`) de Python
- Operadores de comparación (`==`, `!=`, `<`, `>`, `<=`, `>=`) y comparaciones encadenadas (`1 < x < 10`)
- Operadores booleanos (`and`, `or`, `not`) para combinar condiciones
- Precedencia de operadores y cuándo usar paréntesis para mayor claridad
- Evaluación por cortocircuito: cómo evita Python cálculos innecesarios
- Operadores de asignación (`+=`, `-=`, `*=`) para actualizaciones concisas

## El razonamiento

**El problema:** tienes datos y necesitas transformarlos. Un precio necesita multiplicarse por una cantidad. Una temperatura necesita compararse con un umbral. Dos condiciones necesitan comprobarse juntas. Sin operadores, necesitarías llamar a funciones para cada operación diminuta: `multiply(price, quantity)` o `is_greater_than(temp, 100)`. El código sería verboso e ilegible.

**El enfoque ingenuo:** algunos lenguajes (como Lisp) usan la notación prefija en todas partes: `(* price quantity)`. Es consistente pero difícil de leer cuando estás acostumbrado a la notación matemática.

**La solución elegante:** Python usa notación infija, `price * quantity`, igual que las matemáticas. Esto hace que las expresiones se lean de forma natural. También obtienes operadores de comparación que se encadenan: `0 < temperature < 100` se lee exactamente como la desigualdad matemática que representa. Ningún otro lenguaje convencional hace esto tan limpiamente.

**Aritmética más allá de las matemáticas básicas:** los operadores `//` (división de piso) y `%` (módulo) de Python existen porque los problemas del mundo real los necesitan. `//` te da la parte entera de la división, esencial para dividir elementos en páginas (100 elementos / 10 por página = 10 páginas). `%` te da el residuo, esencial para comprobar números pares/impares (`x % 2 == 0`) o para ciclar entre valores (`x % 3` rota por 0, 1, 2).

**La lógica booleana como lenguaje:** `and`, `or`, `not` se leen como inglés. `if is_admin and has_permission` es claro para cualquiera. Pero hay un mecanismo más profundo: la *evaluación por cortocircuito*. `if x != 0 and y / x > 1`, Python se detiene en `x != 0` si es falso, nunca evalúa `y / x` y evita un error de división por cero. Los operadores no son solo sintaxis; son mecanismos de seguridad.

**Precedencia:** el orden de las operaciones (`*` antes que `+`) se hereda de las matemáticas. Python añade `not` antes que `and` antes que `or`. Ante la duda, usa paréntesis, no cuestan nada y previenen errores.

## Gamificación

- **Recompensa de XP**: +60 XP por lección completada (180 XP en total para este módulo)
- **Retos**: cada lección incluye retos interactivos de construcción de expresiones
- **Progreso**: completa las 3 lecciones para terminar este módulo
- **Bono de racha**: +15 XP extra por día cuando tu racha supera los 3 días
- **Logro desbloqueado**: "Motor de expresiones", escribe una cadena de 5 operadores en una sola expresión

### Retos de las lecciones

| Lección | Reto | XP |
|---------|------|----|
| Aritmética | Construir una calculadora de propinas usando división de piso y módulo | +60 |
| Comparación | Encadenar 3 comparaciones para validar el formato de un número de teléfono | +60 |
| Lógica booleana | Combinar 4 condiciones con and/or/not para modelar una regla de juego | +60 |

## Proyectos que puedes crear

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 🛒 **Calculadora de carrito de compras**, los operadores aritméticos calculan totales, descuentos e impuestos
- 🎯 **Juego de adivinar números**, los operadores de comparación dan pistas de "más alto" o "más bajo"
- 📊 **Calculadora de calificaciones**, los operadores booleanos determinan aprobar/reprobar con criterios múltiples
- ⏰ **Temporizador de cuenta regresiva**, el operador módulo convierte segundos en horas, minutos, segundos

## Lecciones

1. **Operadores aritméticos**, `+`, `-`, `*`, `/`, `//`, `%`, `**` y operadores de asignación (`+=`, `-=`, etc.)
2. **Operadores de comparación**, `==`, `!=`, `<`, `>`, `<=`, `>=`, comparaciones encadenadas y `is` frente a `==`
3. **Operadores booleanos y precedencia**, `and`, `or`, `not`, evaluación por cortocircuito y reglas de precedencia de operadores