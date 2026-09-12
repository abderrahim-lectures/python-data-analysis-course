---
title: "Funciones"
description: "Empaqueta la lógica en bloques reutilizables con parámetros, valores de retorno y ámbito."
order: 4
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 3
lessonCount: 3
tags: ["def", "parámetros", "return", "ámbito", "lambda"]
prerequisites: ["module-03-control-flow"]
icon: "⚙️"
---

## Por qué es importante

Sin funciones, todo programa es una secuencia plana de instrucciones. ¿Necesitas calcular una propina? Escribe la fórmula. ¿Necesitas calcularla de nuevo para una cuenta diferente? Copia y pega la fórmula. ¿Necesitas cambiar cómo se calculan las propinas? Busca y reemplaza cada copia. Así es como se multiplican los errores, cambias una copia y te pierdes otra.

Las funciones resuelven esto permitiéndote escribir una pieza de lógica una vez, darle un nombre y llamarla cuando la necesites. Una función `calculate_tip(bill, rate)` encapsula la lógica en un solo lugar. Si el algoritmo de propinas cambia, actualizas una función, no veinte copias. Este es el principio DRY, Don't Repeat Yourself, y las funciones son su herramienta principal.

Pero las funciones hacen más que evitar la repetición. Crean *fronteras de abstracción*. Cuando llamas a `sorted(my_list)`, no necesitas saber cómo funciona la ordenación internamente, solo sabes que devuelve una lista ordenada. Esto te permite construir programas por capas: una persona escribe la función de ordenación, otra la usa, y ninguna necesita entender el código de la otra en detalle. Las funciones son cómo crecen los programas de Python de scripts a sistemas de software.

## Lo que aprenderás

- Definir funciones con `def` y llamarlas con paréntesis
- Parámetros posicionales, de palabra clave, por defecto y `*args`/`**kwargs`
- Valores `return` y retornos tempranos para el flujo de control
- Ámbito de variables, local frente a global, y por qué `global` suele ser un mal olor de código
- Funciones lambda para operaciones en línea cortas
- Docstrings para documentar lo que hacen tus funciones

## El razonamiento

**El problema:** a medida que los programas crecen, la misma lógica aparece en varios lugares. Un programa que calcula costos de envío podría necesitar la fórmula en tres lugares: la página de pago, el panel de administración y el punto final de la API. Cambiar la fórmula significa encontrar los tres.

**El enfoque ingenuo:** copia y pega. Funciona hasta que no funciona. El problema real no es la duplicación de código, es la duplicación de *intención*. Cuando copias y pegas, estás diciendo "esto hace lo mismo". Pero una edición futura podría hacer que una copia difiera de las demás, y nunca sabrás cuál cambió.

**La solución elegante:** una función es un bloque de código nombrado y reutilizable. Lo defines una vez:

```python
def calculate_shipping(weight, destination):
    base_rate = 5.99
    per_kg = weight * 1.50
    zone_multiplier = get_zone_rate(destination)
    return base_rate + per_kg * zone_multiplier
```

Ahora cada lugar que necesita costos de envío llama a `calculate_shipping()`. Una definición, una fuente de verdad. Cuando la fórmula cambia, cambia en todas partes automáticamente.

**Parámetros y flexibilidad:** las funciones toman *parámetros*, entradas que las hacen generales. `calculate_tip(bill_amount, tip_percent)` funciona para cualquier cuenta y cualquier tasa de propina. Sin parámetros, necesitarías funciones separadas para cada combinación posible: `calculate_tip_15()`, `calculate_tip_20()`, `calculate_tip_25()`. Los parámetros hacen que las funciones sean componibles, las combinas como bloques de construcción.

**Valores de retorno:** una función que calcula algo pero no lo devuelve es inútil. `return` envía el resultado de vuelta a quien la llamó. Los retornos tempranos te permiten salir de una función antes de llegar al final, útiles para cláusulas de guarda: `if not data: return None`.

**Ámbito:** las variables creadas dentro de una función viven en el *ámbito local*, solo existen mientras la función se ejecuta. Esto evita colisiones de nombres. Dos funciones pueden usar ambas una variable llamada `result` sin conflicto. La palabra clave `global` rompe este aislamiento, pero usarla en exceso lleva a código espagueti. El ámbito local es la norma; el ámbito global es la excepción.

**Lambdas:** a veces necesitas una función diminuta que usarás una vez. `lambda x: x * 2` crea una función anónima que duplica su entrada. Las lambdas son comunes con `sorted(key=lambda ...)`, `map()` y `filter()`. No son un reemplazo para `def`, son una herramienta para operaciones cortas e en línea.

## Gamificación

- **Recompensa de XP**: +60 XP por lección completada (180 XP en total para este módulo)
- **Retos**: cada lección incluye retos interactivos de construcción de funciones
- **Progreso**: completa las 3 lecciones para terminar este módulo
- **Bono de racha**: +15 XP extra por día cuando tu racha supera los 3 días
- **Logro desbloqueado**: "Arquitecto de funciones", escribe una función que tome otra función como argumento

### Retos de las lecciones

| Lección | Reto | XP |
|---------|------|----|
| Definir funciones | Escribir una función que convierta Celsius a Fahrenheit y llamarla 3 veces | +60 |
| Parámetros | Crear una función con parámetros por defecto, de palabra clave y *args | +60 |
| Ámbito y lambda | Arreglar un error de ámbito en código dado y reemplazar una línea con una lambda | +60 |

## Proyectos que puedes crear

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 🧮 **Convertidor de unidades**, funciones para cada conversión (millas↔km, lbs↔kg, etc.) llamadas desde un menú
- 🎲 **Lanzador de dados**, una función que lanza N dados y devuelve los resultados, utilizable en cualquier juego
- 📧 **Generador de plantillas de correo**, funciones que formatean diferentes tipos de correo con plantillas reutilizables
- 🏋️ **Calculadora de entrenamiento**, funciones para calorías, IMC y cálculos de repetición máxima

## Lecciones

1. **Definir y llamar funciones**, `def`, parámetros, valores de retorno y docstrings
2. **Patrones de parámetros**, posicionales, de palabra clave, por defecto, `*args`, `**kwargs` y orden de parámetros
3. **Ámbito y lambdas**, ámbito local frente a global, cierres y funciones lambda