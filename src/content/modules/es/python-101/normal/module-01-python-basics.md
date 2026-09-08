---
title: "Fundamentos de Python"
description: "Tus primeros pasos: imprimir salida, nombrar valores, comprender tipos y convertir entre ellos."
order: 1
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 2
lessonCount: 4
tags: ["fundamentos", "salida", "variables", "tipos"]
prerequisites: []
icon: "🐍"
---

## Por qué es importante

Imagina que estás construyendo un panel meteorológico. Necesitas almacenar la temperatura de hoy (72.5), un nombre de ciudad ("Portland"), si está lloviendo (True) y el número de estaciones meteorológicas activas (14). Sin una forma de almacenar estos valores bajo nombres legibles, tendrías que codificar `72.5` de forma fija en todas partes — y en cuanto quisieras cambiarlo, tendrías que buscar por todo tu programa, intercambiando números uno por uno. Las variables resuelven esto dándote asas con nombre para cada dato.

Pero va más profundo. Python no solo almacena valores — rastrea qué *tipo* de valor contiene cada variable. El número `72.5` se comporta de forma diferente al texto `"72.5"`. Puedes multiplicar dos números, pero no puedes multiplicar dos cadenas de la misma manera. Puedes comparar un booleano con `True`, pero no puedes sumarlo a un entero sin un error. Comprender los tipos — `int`, `float`, `str`, `bool` — es lo que te permite predecir lo que tu código hará realmente en lugar de adivinar.

Todo programa que escribas empieza con estos bloques de construcción: almacenar datos, comprobar qué tipo de datos son, y a veces convertir entre tipos. Si te saltas esta base, cada módulo posterior se vuelve más difícil. Domínala y escribirás código predecible, legible y fácil de depurar.

## Lo que aprenderás

- Imprimir salida en la pantalla con `print()` y comprender qué devuelve
- Almacenar valores bajo nombres (variables) y reasignarlos de forma segura
- Identificar los cuatro tipos centrales de Python: `int`, `float`, `str`, `bool`
- Convertir entre tipos de forma explícita con `int()`, `float()`, `str()`, `bool()`
- Comprender el tipado dinámico y por qué Python no exige declaraciones de tipo
- Reconocer errores comunes relacionados con los tipos antes de que ocurran

## El razonamiento

**El problema:** las computadoras necesitan trabajar con datos — números, texto, indicadores. Pero las direcciones de memoria crudas (como `0x7FFF5FBFF8D0`) no significan nada para los humanos. No puedes construir una app del clima recordando que la temperatura vive en la dirección `0x7FFF5FBFF8D0` mientras que el nombre de la ciudad está en `0x7FFF5FBFF8E0`.

**El enfoque ingenuo:** los primeros lenguajes de programación (como el ensamblador) te obligaban a gestionar la memoria directamente. Asignabas bytes, rastreabas direcciones y esperabas que nada se solapara. Esto era propenso a errores y lento de desarrollar.

**La solución elegante:** Python (y la mayoría de los lenguajes modernos) introdujo las *variables* — nombres legibles por humanos que apuntan a valores. Cuando escribes `temperature = 72.5`, Python crea un objeto float en memoria y hace que el nombre `temperature` se refiera a él. Nunca vuelves a pensar en direcciones de memoria.

**¿Por qué tipado dinámico?** Python lleva esto más lejos. A diferencia de C o Java, no declaras `float temperature = 72.5`. Solo escribes `temperature = 72.5` y Python averigua el tipo automáticamente. Esto es el *tipado dinámico* — el tipo vive con el valor, no con el nombre de la variable. La misma variable puede contener un número, luego una cadena y luego una lista. Esta flexibilidad hace que Python sea rápido de escribir y fácil de prototipar, aunque significa que necesitas comprender los tipos para evitar sorpresas.

**Conversión de tipos:** a veces necesitas tender un puente entre tipos. Una persona usuaria escribe `"72.5"` en un formulario — eso es una cadena. Necesitas hacer matemáticas con ella, así que la conviertes a float con `float("72.5")`. Python llama a esto *casting*. Es explícito: siempre sabes cuándo ocurre una conversión, porque escribes la función de conversión tú mismo.

## Gamificación

- **Recompensa de XP**: +100 XP por lección completada (400 XP en total para este módulo)
- **Retos**: cada lección incluye retos de codificación interactivos en el playground del navegador
- **Progreso**: completa las 4 lecciones para desbloquear el Módulo 02 (Operadores y expresiones)
- **Bono por racha**: completa este módulo de una sola vez para un bono de +10 XP
- **Logro desbloqueado**: "Primeros pasos" — imprime tu primera salida en la consola

### Retos de las lecciones

| Lección | Reto | XP |
|---------|------|----|
| Imprimir | Mostrar un mensaje de bienvenida formateado con varias llamadas a `print()` | +100 |
| Variables | Almacenar 5 valores diferentes y reasignar dos de ellos | +100 |
| Tipos | Identificar el tipo de 10 valores diferentes sin ejecutar código | +100 |
| Conversión de tipos | Convertir la entrada de texto de una persona usuaria en un número y calcular un resultado | +100 |

## Proyectos que puedes crear

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 🎮 **Clon de Wordle** — usa variables para almacenar intentos, rastrear intentos y gestionar el estado del juego
- 📝 **App de notas** — almacena datos de texto en variables y los muestra de vuelta a la persona usuaria
- 🔐 **Generador de contraseñas** — combina variables de cadena, bucles y opciones aleatorias para construir contraseñas seguras
- 💰 **Rastreador de gastos** — almacena valores numéricos y calcula totales acumulados

## Lecciones

1. **Impresión y salida** — `print()`, argumentos de cadena, múltiples argumentos y el parámetro `end`
2. **Variables** — asignación, reglas de nombres, reasignación y por qué importan los nombres de las variables
3. **Tipos de datos** — `int`, `float`, `str`, `bool`, `type()` y el concepto de tipado dinámico
4. **Conversión de tipos** — casting entre tipos con `int()`, `float()`, `str()`, `bool()` y errores comunes