---
title: "Flujo de control"
description: "Toma decisiones con if/elif/else y repite acciones con bucles for y while."
order: 3
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 3
lessonCount: 3
tags: ["if", "elif", "else", "for", "while", "bucles", "condicionales"]
prerequisites: ["module-02-operators"]
icon: "🔀"
---

## Por qué es importante

Un programa que siempre hace lo mismo es solo un script. Un programa que *decide* es software. El flujo de control es lo que hace inteligentes a los programas, permite que tu código responda a diferentes entradas, repita tareas y maneje casos límite.

Piensa en un sistema de inicio de sesión. Si el nombre de usuario existe Y la contraseña coincide, deja entrar a la persona. Si el nombre de usuario existe pero la contraseña es incorrecta, muestra "contraseña incorrecta". Si el nombre de usuario no existe, muestra "cuenta no encontrada". Sin `if/elif/else`, necesitarías operadores ternarios anidados que se leen como galimatías. La sintaxis de flujo de control de Python existe para que puedas escribir lógica que se lea como un árbol de decisiones humano.

Ahora imagina procesar un archivo CSV con 10 000 filas. No puedes escribir 10 000 líneas de código, una por fila. Los bucles (`for` y `while`) te permiten escribir la lógica una vez y aplicarla a cada fila automáticamente. El bucle `for` itera sobre una secuencia. El bucle `while` repite hasta que cambia una condición. Juntos, manejan la repetición a cualquier escala, desde procesar una lista de 5 nombres hasta analizar millones de puntos de datos.

## Lo que aprenderás

- Bloques `if`, `elif`, `else` para lógica condicional con ramificaciones claras
- Bucles `for` para iterar sobre secuencias (listas, cadenas, rangos, diccionarios)
- Bucles `while` para ejecución repetida hasta que se cumpla una condición
- `break`, `continue` y `pass` para un control fino de los bucles
- Condicionales anidados y cuándo aplanarlos con cláusulas de guarda
- La función `range()` para patrones de iteración numérica

## El razonamiento

**El problema:** la lógica del mundo real se ramifica. "Si está lloviendo, lleva un paraguas. Si no, usa gafas de sol." Una computadora necesita la misma capacidad de decisión. Y a veces la decisión es "haz esto 100 veces", como revisar la calificación de cada estudiante.

**El enfoque ingenuo:** sin flujo de control estructurado, usarías sentencias `goto` (como en los primeros BASIC o ensamblador). `goto line 50` salta a un número de línea. Los programas se convertían en marañas de saltos, imposibles de leer, depurar o mantener. Esta fue la era del "código espagueti".

**La solución elegante:** el `if/elif/else` de Python se lee como un árbol de decisiones escrito en inglés. La indentación no es solo cosmética, define la estructura. A diferencia de las llaves `{}` de C, los espacios en blanco de Python hacen la lógica visualmente clara. Puedes ver de un vistazo qué hay dentro de cada rama.

```python
if temperature > 100:
    status = "dangerously hot"
elif temperature > 80:
    status = "warm"
else:
    status = "comfortable"
```

**For vs. While:** el bucle `for` es para secuencias *conocidas*, "haz esto para cada elemento de esta lista". El bucle `while` es para duraciones *desconocidas*, "sigue pidiendo entrada hasta que escriban 'quit'". Esta distinción importa porque los bucles `for` siempre terminan (la lista se acaba), mientras que los bucles `while` pueden correr para siempre si la condición de salida nunca se cumple. Elige el equivocado y obtienes bucles infinitos o complejidad innecesaria.

**Control de bucles:** `break` sale del bucle inmediatamente. `continue` salta a la siguiente iteración. `pass` no hace nada, es un marcador de posición. Existen porque los bucles reales no siempre son limpios. A veces necesitas salir temprano (`break` al encontrar un objetivo), saltar datos defectuosos (`continue` ante entrada inválida) o reservar un lugar para lógica futura (`pass` en un bloque vacío).

## Gamificación

- **Recompensa de XP**: +60 XP por lección completada (180 XP en total para este módulo)
- **Retos**: cada lección incluye retos de codificación interactivos
- **Progreso**: completa las 3 lecciones para terminar este módulo
- **Bono de racha**: +15 XP extra por día cuando tu racha supera los 3 días
- **Logro desbloqueado**: "Ramificándote", escribe un programa con 3 ramas if/elif/else anidadas

### Retos de las lecciones

| Lección | Reto | XP |
|---------|------|----|
| Condicionales | Construir un clasificador de niveles (bronce/plata/oro) según rangos de puntuación | +60 |
| Bucles for | Iterar sobre una lista de nombres e imprimir un saludo para cada uno | +60 |
| Bucles while | Crear un bucle de adivinanza de números que salga con la respuesta correcta | +60 |

## Proyectos que puedes crear

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 🎮 **Juego de aventura de texto**, ramas if/elif/else crean distintos caminos de historia según las elecciones de la persona jugadora
- 🔍 **Reto FizzBuzz**, bucles for con lógica de módulo para resolver el clásico problema de entrevistas
- 🎯 **Juego de adivinar números**, bucles while con break para jugabilidad interactiva
- 📋 **Gestor de tareas CLI**, bucles procesan comandos de la persona usuaria hasta que elige salir

## Lecciones

1. **Condicionales**, `if`, `elif`, `else`, condicionales anidados y cláusulas de guarda
2. **Bucles for**, iterar sobre secuencias, `range()`, `enumerate()` y patrones de bucles
3. **Bucles while y control de bucles**, `while`, `break`, `continue`, `pass` y evitar bucles infinitos