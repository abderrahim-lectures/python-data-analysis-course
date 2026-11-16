---
title: "Crea un bot organizador de archivos"
description: "Ordena una carpeta desordenada en subcarpetas por categoría con un bot que planifica antes de mover, registra lo que hizo y puede deshacerlo."
difficulty: "beginner"
---

# 📁 Crea un bot organizador de archivos

Una carpeta en la que llevas un año dejando cosas: capturas de pantalla, PDF, un par de archivos zip, algunas canciones descargadas, tres scripts y un archivo sin extensión. Podrías ordenarla a mano en veinte minutos, o podrías escribir lo que la ordena, y no volver a hacerlo nunca a mano.

Este es el primer proyecto que toca tu sistema de archivos real, y eso lo convierte en un profesor mejor de lo que parece: mover archivos es destructivo, y un programa descuidado con eso es peor que no tener programa. Así que el bot se construye como se construyen de verdad las herramientas que manipulan archivos: primero planifica, imprime el plan, mueve solo cuando se lo pides, registra lo que movió y puede deshacer la última ejecución.

## 🎯 Qué vas a hacer

1. Escanear una carpeta y clasificar cada archivo suelto por su extensión en una categoría.
2. Construir una **simulación**: calcular cada movimiento, imprimirlo y no tocar nada.
3. Ejecutar los movimientos gestionando las colisiones de nombres en lugar de sobrescribir.
4. Escribir un registro de operaciones y reproducirlo al revés para deshacer.
5. Probarlo todo contra una carpeta de muestra deliberadamente desordenada, nunca la tuya real.

## Dónde ejecutarlo

**En local con `uv`.** El proyecto usa solo la biblioteca estándar de Python — `pathlib`, `shutil`, `json` — así que no hay nada que instalar, pero tiene que correr en tu máquina porque toca archivos reales.

```bash
cd examples/file-organizer
uv run python generate_sample.py          # crea una carpeta segura para experimentar
uv run python organizer.py sample_messy_folder --dry-run
uv run python organizer.py sample_messy_folder
uv run python organizer.py sample_messy_folder --undo
```

El código ejecutable completo está en [`examples/file-organizer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/file-organizer).

## Paso 1 — Clasificar por extensión

Todo el bot descansa en una función pequeña: de extensión a categoría.

```python
CATEGORIES = {
    'documents': {'.pdf', '.txt', '.doc', '.docx', '.csv'},
    'images': {'.png', '.jpg', '.jpeg', '.gif', '.svg'},
    'archives': {'.zip', '.tar', '.gz'},
    'code': {'.py', '.js', '.ts', '.sh'},
    'audio': {'.mp3', '.wav'},
    'video': {'.mp4', '.mov'},
}
```

Lo que no está en la lista va a `other`. Ese caso por defecto importa: una extensión desconocida nunca puede romper el bot, y un archivo sin extensión (`mystery`) se clasifica a propósito y no por accidente.

## Paso 2 — Planificar antes de mover

La simulación calcula una lista de pares `(origen, destino)` y los imprime. Nada cambia en el disco.

```
[DRY RUN] No files will be moved. Target: sample_messy_folder

Planned moves (10):
  notes.txt      ->  documents/notes.txt
  photo1.jpg     ->  images/photo1.jpg
  report.pdf     ->  documents/report (1).pdf
  mystery        ->  other/mystery
```

Ese `report (1).pdf` no es un error: la carpeta de muestra ya contiene un `documents/report.pdf`, así que la primera ejecución ejercita la gestión real de colisiones.

## Paso 3 — Colisiones, no sobrescrituras

Un `shutil.move` ingenuo sobrescribiría el archivo existente y lo perdería. El bot añade `(1)`, `(2)` hasta que el nombre esté libre, la misma convención que usa tu gestor de archivos, por la misma razón.

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

¿Por qué es más seguro gestionar las colisiones en el paso de *planificación* y no en el momento de mover?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Porque así la simulación muestra el destino real. Si las colisiones se resolvieran al mover, el plan que revisaste no sería el plan que se ejecutó, lo que anula el sentido de revisarlo.</p>

</div>
</details>

## Paso 4 — Un registro que se reproduce al revés

Cada ejecución real añade a `.organizer_log.json`: origen, destino y marca de tiempo. `--undo` lee las entradas de la última ejecución y devuelve cada archivo a su sitio, de la más reciente a la más antigua.

Esta es la diferencia entre un script y una herramienta. Un script que mueve archivos y no puede revertirlo está a un error de tecleo de una tarde mala.

## Paso 5 — Probar sobre algo seguro

`generate_sample.py` construye una carpeta desechable con una colisión deliberada, archivos sin extensión y un archivo oculto que el organizador debe ignorar. Ejecuta el bot ahí primero, siempre. El hábito es la lección: la simulación existe porque apuntar código que mueve archivos a `~/Downloads` la primera vez es como la gente pierde datos.

## 🧩 Retos

<details class="challenge">
<summary>🧩 Reto: piensa primero y luego revela</summary>
<div class="challenge__body">

El organizador ignora los archivos ocultos. ¿Qué se rompe si no lo hace?

<p class="challenge__answer">💡 <strong>Respuesta:</strong> Movería archivos de configuración como `.gitignore`, `.env` y el propio `.organizer_log.json` a carpetas de categoría, incluido su propio registro, que `--undo` ya no encontraría. Los archivos ocultos son ajustes, no desorden.</p>

</div>
</details>

## 🤔 Preguntas socráticas

- ¿Por qué merece la pena escribir un modo de simulación cuando podrías simplemente tener cuidado?
- ¿Qué debería pasar si la carpeta de destino ya existe pero es un archivo?
- ¿Debería `--undo` negarse a ejecutarse si un archivo ha cambiado desde el movimiento? ¿Por qué?
- ¿Cuál es la versión más pequeña de este bot con la que seguirías confiando en tu propia carpeta?

## ✅ Comprobación rápida

<div class="quiz" data-quiz="projects-file-organizer-es">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ¿Qué hace --dry-run?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Mueve los archivos y luego lo revierte.</button>
      <button class="quiz-q__opt" data-idx="1">Calcula e imprime cada movimiento previsto sin tocar el disco.</button>
      <button class="quiz-q__opt" data-idx="2">Borra los archivos en lugar de moverlos.</button>
      <button class="quiz-q__opt" data-idx="3">Ejecuta el organizador sin registro.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. El nombre de destino ya existe. ¿Qué debería hacer el bot?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">Sobrescribirlo; el archivo nuevo es mejor.</button>
      <button class="quiz-q__opt" data-idx="1">Saltarse el archivo en silencio.</button>
      <button class="quiz-q__opt" data-idx="2">Añadir (1), (2)… hasta que el nombre esté libre.</button>
      <button class="quiz-q__opt" data-idx="3">Borrar primero el archivo antiguo.</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
