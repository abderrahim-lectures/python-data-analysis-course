---
title: "Estructuras de datos"
description: "Trabaja con listas, tuplas, diccionarios y conjuntos — los contenedores centrales de Python."
order: 6
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 4
lessonCount: 3
tags: ["listas", "tuplas", "dicts", "conjuntos", "comprensiones"]
prerequisites: ["module-05-strings"]
icon: "📦"
---

## Por qué es importante

Una sola variable contiene un valor. Pero los datos reales vienen en colecciones — una lista de estudiantes, un diccionario que mapea nombres de usuario a direcciones de correo, un conjunto de etiquetas únicas en una publicación de blog. Las estructuras de datos son cómo organizas y trabajas con grupos de datos, y elegir la correcta determina cuán rápido corre tu programa y cuán legible es tu código.

Considera construir una libreta de contactos. Podrías almacenar los nombres en una lista, los correos en otra y los números de teléfono en una tercera:

```python
names = ["Alice", "Bob", "Charlie"]
emails = ["alice@example.com", "bob@example.com", "charlie@example.com"]
```

Pero ¿qué pasa cuando añades un contacto nuevo? Tienes que acordarte de añadirlo a las tres listas — y si olvidas una, tus datos quedan desincronizados. Un diccionario (`contacts = {"Alice": "alice@example.com"}`) mantiene los datos relacionados juntos. Las listas te dan secuencias ordenadas con indexación rápida. Las tuplas protegen los datos de cambios accidentales. Los conjuntos eliminan automáticamente los duplicados y responden "¿está este elemento en la colección?" al instante.

Las cuatro estructuras de datos centrales de Python — listas, tuplas, diccionarios y conjuntos — resuelven cada una problemas diferentes. Aprenderlas es como aprender las herramientas de un taller: un martillo no es mejor que un destornillador, pero usar la correcta para el trabajo marca toda la diferencia.

## Lo que aprenderás

- **Listas**: secuencias ordenadas y mutables con métodos como `append`, `sort`, `pop`, `extend`
- **Tuplas**: secuencias inmutables para datos fijos, desempaquetado y tuplas con nombre
- **Dicts**: mapeos de clave-valor con métodos, patrones de iteración y comprensiones de diccionario
- **Conjuntos**: colecciones desordenadas para pruebas de pertenencia, deduplicación y operaciones de conjuntos (unión, intersección, diferencia)
- **Comprensiones de listas**: sintaxis concisa para construir listas a partir de datos existentes
- **Cuándo usar cuál**: elegir la estructura de datos correcta para el problema

## El razonamiento

**El problema:** los programas reales tratan con colecciones de datos, no con valores individuales. Un carrito de compras tiene múltiples artículos. Una clase tiene múltiples estudiantes. Un archivo tiene múltiples líneas. Sin estructuras de datos, necesitarías variables separadas para cada elemento: `item1`, `item2`, `item3`... Esto no escala. ¿Qué pasa si hay 100 artículos?

**El enfoque ingenuo:** usar arreglos — contenedores de tamaño fijo indexados por enteros. Los arreglos de C funcionan, pero son rígidos: declaras el tamaño por adelantado, no puedes mezclar tipos, y añadir/eliminar elementos requiere gestión manual de la memoria.

**La solución elegante:** las listas de Python son arreglos dinámicos. Crecen y se encogen automáticamente. `my_list.append(item)` añade al final. `my_list.pop()` elimina del final. Nunca piensas en la asignación de memoria. Las listas también admiten tipos mixtos (aunque suele ser mala práctica) y la poderosa indexación de Python: `my_list[-1]` obtiene el último elemento, `my_list[1:3]` obtiene un segmento.

**Tuplas para la inmutabilidad:** a veces necesitas una secuencia que *no puede* cambiar. Un par de coordenadas `(x, y)` nunca debería convertirse accidentalmente en `(x, y, z)`. Las tuplas son inmutables — cualquier "modificación" crea una tupla nueva. Esto las hace seguras para claves de diccionario, valores de retorno de funciones y datos que no deberían alterarse. Las tuplas con nombre (`Point = namedtuple("Point", ["x", "y"])`) añaden legibilidad: `point.x` en lugar de `point[0]`.

**Diccionarios para pares clave-valor:** el diccionario es la estructura más versátil de Python. Mapea claves a valores — como un diccionario real mapea palabras a definiciones. La búsqueda es O(1) — instantánea, sin importar el tamaño. Un diccionario de 10 000 entradas encuentra una clave tan rápido como uno de 10 entradas. Esto hace que los diccionarios sean esenciales para el almacenamiento en caché, la configuración y cualquier operación con muchas búsquedas.

**Conjuntos para la unicidad:** un conjunto es una colección desordenada de elementos *únicos*. `set([1, 1, 2, 3])` se convierte en `{1, 2, 3}`. La prueba de pertenencia (`x in my_set`) es O(1) — instantánea. Los conjuntos también admiten operaciones matemáticas: unión (`|`), intersección (`&`), diferencia (`-`). Úsalos para deduplicación, encontrar elementos comunes o comprobar pertenencia.

**Comprensiones:** la sintaxis de comprensión de Python construye colecciones en una sola expresión. `[x**2 for x in range(10)]` crea una lista de cuadrados. `{name: age for name, age in people}` crea un diccionario a partir de una lista de pares. Las comprensiones son más rápidas que los bucles y se leen más claramente — expresan la *intención* de la transformación sin el andamiaje.

## Gamificación

- **Recompensa de XP**: +100 XP por lección completada (300 XP en total para este módulo)
- **Retos**: cada lección incluye retos interactivos de estructuras de datos
- **Progreso**: completa las 3 lecciones para desbloquear el Módulo 07 (Entrada y salida de archivos)
- **Bono por racha**: completa este módulo de una sola vez para un bono de +10 XP
- **Logro desbloqueado**: "Organizador de datos" — usa las cuatro estructuras de datos en un solo programa

### Retos de las lecciones

| Lección | Reto | XP |
|---------|------|----|
| Listas y tuplas | Construir una lista de tareas con append, remove, sort y empaquetado de tuplas | +100 |
| Dicts y conjuntos | Crear un contador de frecuencia de palabras con dicts y encontrar palabras únicas con conjuntos | +100 |
| Comprensiones | Reescribir 3 bucles for como comprensiones de lista/dict/set | +100 |

## Proyectos que puedes crear

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 📒 **Libreta de contactos** — los diccionarios mapean nombres a números de teléfono y correos
- 🎵 **Lista de reproducción musical** — las listas gestionan el orden de las canciones, los conjuntos rastrean artistas únicos
- 📊 **Analizador de frecuencia de palabras** — los diccionarios cuentan las apariciones de palabras en un texto
- 🃏 **Juego de cartas** — las listas representan manos, las tuplas representan pares de cartas, los conjuntos rastrean cartas jugadas

## Lecciones

1. **Listas y tuplas** — creación, indexación, segmentado, métodos, desempaquetado y cuándo usar tuplas en lugar de listas
2. **Diccionarios y conjuntos** — mapeos de clave-valor, operaciones de conjuntos, prueba de pertenencia y patrones de diccionario
3. **Comprensiones y elección de estructuras de datos** — comprensiones de lista/dict/set, expresiones generadoras y selección de la estructura correcta