---
title: "Entrada y salida de archivos"
description: "Lee de archivos y escribe en ellos, trabaja con datos CSV y maneja rutas de forma segura."
order: 7
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 2
lessonCount: 2
tags: ["archivos", "leer", "escribir", "csv", "gestor-de-contexto", "with"]
prerequisites: ["module-06-data-structures"]
icon: "📁"
---

## Por qué es importante

Todo programa que escribes eventualmente necesita hablar con el mundo exterior. Un juego guarda los puntajes más altos en un archivo. Una persona analista de datos lee un CSV con miles de filas. Un servidor web carga la configuración desde un archivo YAML. Sin entrada y salida de archivos, tus programas existen en un vacío, pueden procesar datos mientras se ejecutan, pero nada persiste después de que se detienen.

Considera construir un rastreador de presupuesto. Podrías calcular los totales en memoria, pero cuando el programa se cierra, todo desaparece. La persona usuaria tendría que reingresar cada gasto cada vez. La entrada y salida de archivos resuelve esto permitiéndote guardar datos en disco y cargarlos de vuelta más tarde. El módulo `csv` maneja datos estructurados en formato de hoja de cálculo. El módulo `pathlib` maneja rutas de archivos en Windows, macOS y Linux sin trucos específicos de la plataforma.

La entrada y salida de archivos es también donde brillan los gestores de contexto de Python (la sentencia `with`). Sin ellos, tendrías que acordarte de cerrar los archivos manualmente, olvídalo y filtas descriptores de archivo, corrompes datos o te estrellas. La sentencia `with` garantiza la limpieza automáticamente. Es un patrón que usarás en todo proyecto real de Python, desde scripts simples hasta sistemas de producción.

## Lo que aprenderás

- Abrir y cerrar archivos con `open()` y por qué la sentencia `with` es esencial
- Leer archivos línea por línea y como una cadena completa
- Escribir texto en archivos y añadir datos nuevos
- Trabajar con archivos CSV usando el módulo `csv`
- Rutas de archivo seguras con `pathlib` para compatibilidad multiplataforma
- Modos de archivo (`r`, `w`, `a`, `r+`) y cuándo usar cada uno

## El razonamiento

**El problema:** los programas corren en memoria, rápida pero temporal. Los archivos viven en disco, lento pero permanente. Necesitas tender un puente entre los dos: leer datos de archivos hacia tu programa, procesarlos y escribir los resultados de vuelta. Sin entrada y salida de archivos, todo programa perdería sus datos al salir.

**El enfoque ingenuo:** abrir un archivo, leer todo en memoria, procesarlo, escribirlo de vuelta y *acordarte de cerrar el archivo*. El problema: si tu programa se estrella entre abrir y cerrar, el descriptor del archivo queda bloqueado. Otros programas no pueden acceder a él. Tus datos podrían corromperse. Y tienes que escribir `file.close()` en cada camino de código, incluidos los manejadores de errores.

**La solución elegante:** la sentencia `with` de Python es un gestor de contexto. Abre un archivo, te deja trabajar con él y lo *cierra automáticamente* cuando el bloque sale, incluso si ocurre una excepción. Sin filtraciones, sin llamadas `close()` olvidadas.

```python
with open("data.csv", "r") as file:
    for line in file:
        process(line)
# File is guaranteed to be closed here
```

**Leer vs. escribir:** el modo del archivo determina lo que puedes hacer. `r` (read) abre para lectura, el archivo debe existir. `w` (write) abre para escritura, *sobrescribe* el archivo si existe. `a` (append) abre para escritura pero añade al final en lugar de sobrescribir. `r+` abre tanto para lectura como para escritura. Elegir el modo equivocado es una fuente común de pérdida de datos, `w` en un archivo que pensabas añadir destruye todo.

**Línea por línea vs. archivo completo:** `file.read()` carga el archivo entero en memoria, bien para archivos pequeños, peligroso para grandes (un archivo de 2 GB estrellaría tu programa). Iterar `for line in file:` lee una línea a la vez, eficiente en memoria y escalable. Para archivos CSV, el módulo `csv` maneja el análisis sintáctico automáticamente, dándote filas como listas o diccionarios.

**pathlib:** rutas codificadas como `"C:/Users/data/file.csv"` se rompen en Linux. `"../data/file.csv"` se rompe en Windows. `pathlib` abstrae esto: `Path("data") / "file.csv"` funciona en todas partes. También maneja comprobaciones de existencia, sufijos, directorios padres y creación de archivos sin código específico de la plataforma.

## Gamificación

- **Recompensa de XP**: +60 XP por lección completada (120 XP en total para este módulo)
- **Retos**: cada lección incluye retos interactivos de entrada y salida de archivos
- **Progreso**: completa ambas lecciones para terminar este módulo
- **Bono de racha**: +15 XP extra por día cuando tu racha supera los 3 días
- **Logro desbloqueado**: "Maestro de archivos", lee un CSV, procésalo y escribe los resultados en un archivo nuevo

### Retos de las lecciones

| Lección | Reto | XP |
|---------|------|----|
| Lectura y escritura | Leer un archivo de texto, contar líneas/palabras/caracteres y escribir un resumen | +60 |
| CSV y pathlib | Analizar un archivo CSV, filtrar filas por una condición y guardar el resultado | +60 |

## Proyectos que puedes crear

Después de completar este módulo, estarás listo para abordar estos proyectos reales:

- 💰 **Rastreador de gastos**, lee/escribe gastos en un CSV, calcula totales acumulados
- 📝 **App de diario**, guarda entradas diarias en archivos de texto y las lee de vuelta
- 📊 **Analizador de datos CSV**, lee archivos CSV, calcula estadísticas y escribe informes de resumen
- 🗂️ **Organizador de archivos**, usa pathlib para escanear directorios y mover archivos por tipo

## Lecciones

1. **Lectura y escritura de archivos de texto**, `open()`, `with`, `read()`, `readlines()`, `write()`, `append()` y modos de archivo
2. **CSV y pathlib**, el módulo `csv` para leer/escribir datos estructurados, y `pathlib` para rutas seguras multiplataforma