---
title: "Constructor de Cursos"
description: "Crea cursos en línea con módulos, cuestionarios, seguimiento del progreso y generación de certificados."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "dataclasses", "json", "stdlib"]
prerequisites:
  - "Fundamentos de Python (variables, loops, funciones, diccionarios)"
learningObjectives:
  - "Modelar un curso como dataclasses anidadas y cargarlo desde JSON"
  - "Registrar la finalización de lecciones por estudiante y calcular porcentajes"
  - "Calificar cuestionarios contra una clave de respuestas con un umbral de aprobación"
  - "Renderizar un panel de texto con el progreso y las calificaciones de cuestionarios"
  - "Generar un certificado de finalización solo cuando el curso esté terminado"
---

# 🎓 Construir un Constructor de Cursos

Un curso es, bajo la superficie, solo datos estructurados: módulos hechos de lecciones, lecciones con contenido, y estudiantes con un conjunto de checkpoints completados. Este proyecto construye el motor detrás de una plataforma de cursos en línea, un conjunto de clases y funciones de Python que cargan un curso desde JSON, registran el progreso real de un estudiante a través de él, califican sus cuestionarios contra una clave de respuestas, imprimen un panel de progreso y finalmente emiten un certificado de finalización cuando, y *solo* cuando, el curso está realmente terminado. Sin navegador, sin base de datos: solo el modelo de datos y las reglas que viven sobre él.

Esto asume Python 101, funciones, diccionarios y un `json` import cómodo. No se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Modelar un curso como dataclasses `Lesson`, `Module` y `Course` y cargar uno desde un archivo JSON.
2. Registrar las lecciones completadas de un estudiante y calcular porcentajes de finalización de módulo y curso.
3. Calificar un cuestionario contra una clave de respuestas y juzgar aprobado/fallido contra un umbral.
4. Imprimir un panel que muestre el progreso de módulos y las calificaciones de cuestionarios de un estudiante.
5. Generar un certificado de texto, negándose cortésmente cuando el curso no esté completo.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado, este proyecto es de biblioteca estándar pura (dataclasses, JSON, `datetime`), así que el setup es un comando, y el CLI local es donde lo apuntarás a *tu* archivo de curso.

**GitHub Codespaces** es una alternativa sin setup: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder** funcionan bien para la mitad de modelado de datos de este proyecto, el notebook de [`examples/course-builder/notebook.es.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.es.ipynb) ejecuta cada paso sobre un curso de muestra incluido. La nota honesta: los archivos de certificado (`certificate.txt`) se guardan limpiamente en un notebook, pero el código es idéntico de cualquier manera.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcourse-builder%2Fnotebook.es.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza la cadena "instalar Python, luego pip, luego una herramienta de entorno virtual", y este proyecto no necesita paquetes de terceros, así que el setup es genuinamente corto.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, y confirma que quedó instalado:

```bash
uv --version
```

Luego configura el proyecto:

```bash
uv init course-builder
cd course-builder
```

Todo lo que se usa de aquí en adelante, `dataclasses`, `json`, `datetime`, viene integrado en Python, así que no hay paso de `uv add`.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `course-builder/` existe con un `pyproject.toml`.
- ✅ `python -c "from dataclasses import dataclass"` tiene éxito.

## Paso 1: Modelar un curso con dataclasses

Un curso tiene una jerarquía limpia, un curso *contiene* módulos, cada módulo *contiene* lecciones, y las `dataclasses` de Python existen para convertir exactamente eso en objetos tipados y auto-documentados. JSON, mientras tanto, es el formato real de intercambio en el que viajan los cursos. Este paso hace que ambos se encuentren: un `Course` que puedes construir en Python y cargar de vuelta desde un archivo.

### 1.1 Escribir las tres dataclasses y un cargador JSON

**👟 Pista inicial :** Define dataclasses diminutas `Lesson`, `Module` y `Course`, anidadas con un `default_factory`, y luego `load_course`, que lee JSON y rehidrata las clases con una comprensión de listas:

```python
# models.py
from dataclasses import dataclass, field
import json

@dataclass
class Lesson:
    title: str
    minutes: int

@dataclass
class Module:
    title: str
    lessons: list[Lesson] = field(default_factory=list)

@dataclass
class Course:
    title: str
    modules: list[Module] = field(default_factory=list)

def load_course(path: str) -> Course:
    with open(path) as f:
        data = json.load(f)
    modules = [
        Module(title=m["title"], lessons=[Lesson(**l) for l in m["lessons"]])
        for m in data["modules"]
    ]
    return Course(title=data["title"], modules=modules)

if __name__ == "__main__":
    sample = {
        "title": "Python 101",
        "modules": [
            {"title": "Basics", "lessons": [
                {"title": "Variables", "minutes": 12},
                {"title": "Loops", "minutes": 15},
            ]},
            {"title": "Functions", "lessons": [
                {"title": "def and return", "minutes": 10},
            ]},
        ],
    }
    with open("course.json", "w") as f:
        json.dump(sample, f, indent=2)
    course = load_course("course.json")
    print(course.title)
    for module in course.modules:
        print(f"- {module.title}: " + ", ".join(l.title for l in module.lessons))
```

`Lesson(**l)` es el truco deliberado: cada dict JSON bajo `lessons` tiene exactamente las mismas claves que los campos de la dataclass `Lesson`, así que el desempaquetado `**` los mapea posición-por-nombre gratis. El `field(default_factory=list)` en los *contenedores* importa por una trampa clásica de dataclasses, un `= []` pelado sería compartido por cada instancia de `Module` y `Course` jamás creada.

**🎯 Resultado esperado :**

```
Python 101
- Basics: Variables, Loops
- Functions: def and return
```

**🩹 Si sale mal :** Un `TypeError: __init__() got an unexpected keyword argument` de `Lesson(**l)` significa que un dict JSON tiene una clave que no coincide con un campo (un typo como `minuts`), alinea las claves JSON con los nombres de campo. Si cada módulo parece compartir una lista de lecciones, usaste `= []` en lugar de `field(default_factory=list)`, ese es el bug del mutable compartido hecho concreto.

### 1.2 Verifica el modelo

**✅ Lista de verificación**

- ✅ `load_course("course.json")` produce tres objetos cuyos atributos `title` imprimen como arriba.
- ✅ `course.modules[0].lessons` es un `list[Lesson]` de longitud 2, no una lista de dicts.
- ✅ Añadir un segundo `Module()` sin argumentos *no* comparte la lista de lecciones del primer módulo.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué un dict JSON `{"title": "Variables", "minutes": 12}` es "la misma forma" que una dataclass `Lesson`, y qué pasa el día en que un archivo de curso envía un campo *nuevo* que la dataclass no conoce, dónde falla eso y qué tan fuerte?
- La dataclass guarda `minutes` por lección. ¿Quién debería calcular "minutos totales", la clase o el código que imprime un reporte, y cuál es el argumento para mantener `Course` como un contenedor de datos puro?

## Paso 2: Registrar el progreso del estudiante

Los estudiantes necesitan estado por estudiante, *qué* lecciones han completado, separado de la definición del curso. Lo esbelto y correcto aquí significa: el objeto curso nunca cambia por estudiante; en su lugar, un `ProgressTracker` posee un `set` de pares `(module_index, lesson_index)` y responde a la pregunta "¿qué porcentaje está hecho?" con un poco de conteo.

### 2.1 Escribir el rastreador

**👟 Pista inicial :** Una clase con tres métodos, `complete_lesson` (guardando una clave tupla), `module_percent` y `course_percent`, y luego condúcela con el curso del Paso 1:

```python
# progress.py
from models import Course

class ProgressTracker:
    def __init__(self, course: Course, student: str):
        self.course = course
        self.student = student
        self.completed: set[tuple[int, int]] = set()

    def complete_lesson(self, module_index: int, lesson_index: int) -> None:
        self.completed.add((module_index, lesson_index))

    def module_percent(self, module_index: int) -> float:
        lessons = self.course.modules[module_index].lessons
        done = sum(1 for (mi, _) in self.completed if mi == module_index)
        return 100.0 * done / len(lessons)

    def course_percent(self) -> float:
        total = sum(len(m.lessons) for m in self.course.modules)
        return 100.0 * len(self.completed) / total

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    tracker.complete_lesson(0, 0)
    tracker.complete_lesson(0, 1)
    print(f"{tracker.student}: {tracker.course_percent():.0f}% complete")
    print(f"Module 0: {tracker.module_percent(0):.0f}% | Module 1: {tracker.module_percent(1):.0f}%")
```

Un `set` es la estructura de datos correcta por partida doble: re-marcar la misma lección es un *no-op* (idempotente, llamar `complete_lesson(0, 0)` dos veces sigue contando una), y `len(self.completed)` es el total del curso por gratis, porque ninguna tupla puede aparecer dos veces. La suma dentro de `module_percent` sobre `self.completed` calcula "cuántos pares completados pertenecen a este módulo" sin ninguna contabilidad separada por módulo.

**🎯 Resultado esperado :**

```
Ada: 67% complete
Module 0: 100% | Module 1: 0%
```

**🩹 Si sale mal :** Si los porcentajes salen como floats tipo `66.66666666666666`, eso es diagnóstico, no roto, significa que imprimiste el float sin el formato `:.0f`; formatéalo. Si marcar la misma lección dos veces sube un porcentaje, el almacenamiento no es un `set`, una `list` de tuplas recuenta duplicados.

### 2.2 Verifica el seguimiento

**✅ Lista de verificación**

- ✅ Completar ambas lecciones de Basics hace que `course_percent()` imprima `67%` y `module_percent(0)` imprima `100%`.
- ✅ Llamar `complete_lesson(0, 0)` dos veces no lanza error ni infla el conteo.
- ✅ Un rastreador nuevo sobre el mismo curso reporta `0%`, probando que el progreso es estado por estudiante.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué el progreso se guarda como *coordenadas* (`(módulo 0, lección 1)`) en lugar de títulos de lección? ¿Qué le pasa al sistema basado en coordenadas si se renombra una lección, y sobreviviría eso al seguimiento basado en títulos?
- El rastreador no sabe nada de los módulos excepto su índice. ¿Qué cambiaría si un curso insertara un módulo *nuevo* al frente, dos semanas después de que los estudiantes empezaron, con sus sets `completed` ya llenos? ¿Una clave basada en coordenadas es robusta a eso?

## Paso 3: Calificar cuestionarios

El progreso responde "¿lo leyeron?", los cuestionarios responden "¿se les quedó?". Un cuestionario es un conjunto de preguntas, enunciado, opciones, el índice de la respuesta correcta, y la calificación es un `zip` sobre las respuestas del estudiante comparando cada una contra la clave. La decisión aprobado/fallido aplica entonces un umbral al ratio.

### 3.1 Escribir el modelo de pregunta y el calificador

**👟 Pista inicial :** Una dataclass `Question`, un `score_quiz` que hace zip de las respuestas dadas contra la clave en una lista de booleanos, y un helper `passed` que compara lo ganado contra el total contra una nota mínima:

```python
# quizzes.py
from dataclasses import dataclass

@dataclass
class Question:
    prompt: str
    choices: list[str]
    answer_index: int
    points: int = 1

def score_quiz(questions: list[Question], answers: list[int]) -> tuple[int, int, list[bool]]:
    """Returns (earned, total, per-question correctness)."""
    correct = [given == q.answer_index for q, given in zip(questions, answers)]
    earned = sum(q.points for q, ok in zip(questions, correct) if ok)
    total = sum(q.points for q in questions)
    return earned, total, correct

def passed(results: tuple[int, int, list[bool]], pass_mark_pct: int = 70) -> bool:
    earned, total, _ = results
    return 100 * earned / total >= pass_mark_pct

if __name__ == "__main__":
    quiz = [
        Question("What is 2+2?", ["3", "4", "5"], 1),
        Question("Which type is a boolean?", ["int", "bool", "str"], 1),
    ]
    results = score_quiz(quiz, [1, 1])
    print(f"score: {results[0]}/{results[1]}")          # 2/2
    print("passed at 70%:", passed(results))             # True
    print("passed at 100%:", passed(results, 100))       # False
```

`zip` está haciendo el trabajo honesto: empareja cada pregunta con la respuesta correspondiente del estudiante *posicionalmente*, y la comprensión de listas de una línea convierte ese emparejamiento en banderas de corrección. Vale la pena notar que `score_quiz` devuelve *tres* cosas, ganadas, total y banderas por pregunta, porque un calificador que solo reporta un número es inútil para decirle a un estudiante *dónde* se equivocó; las banderas alimentan el veredicto de "reintentar" más tarde.

**🎯 Resultado esperado :**

```
score: 2/2
passed at 70%: True
passed at 100%: False
```

**🩹 Si sale mal :** Un `score: 0/2` equivocado con respuestas de aspecto correcto normalmente significa que los índices de la lista `answers` están desviados en uno, las respuestas se dan como *índices de opción* (`1` = "4"), no texto de opción. Si `passed at 100%` imprime `True` para un 2/2... eso es correcto; haz un caso con error real, o revisa el operador de comparación, `>=` vs `>` cambia si un 70% exacto aprueba.

### 3.2 Verifica el calificador

**✅ Lista de verificación**

- ✅ Un cuestionario perfecto imprime `score: 2/2` y tu llamada a `passed()` devuelve `True` en todo umbral razonable.
- ✅ La lista de corrección por pregunta puede decirte exactamente qué pregunta falló el estudiante.
- ✅ `passed()` con una respuesta equivocada en un cuestionario de dos preguntas devuelve `False` al 70%.

**🤔 Pregunta(s) socrática(s)**

- `score_quiz` devuelve banderas de corrección *y* un puntaje. Si una UI construye su pantalla de "revisa tus respuestas" a partir de `correct`, ¿qué romperías si simplificaras el retorno a solo `(earned, total)`, y es eso una regresión de diseño o una simplificación perfectamente aceptable para un proyecto pequeño?
- `passed` compara un porcentaje contra un umbral. ¿Por qué un cuestionario de 10 preguntas con umbral de 70% podría comportarse sorprendentemente con esta matemática entera exacta (pista: intenta diseñar un puntaje que *redondee* a exactamente 70%)?

## Paso 4: Construir el panel

Las piezas separadas, curso, progreso, cuestionarios, necesitan una única superficie de lectura: el panel. Es la "vista de producto" de todo lo construido hasta ahora, renderizando el estado de módulos, porcentajes y resultados de cuestionarios en un solo panel de terminal, e introduce la pequeña idea de convertir un número en una *palabra de estado* ("done"/"active"/"todo").

### 4.1 Renderizar el panel

**👟 Pista inicial :** Una función `render_dashboard` que formatea encabezados con `"=" * 40`, mapea el porcentaje de cada módulo a una etiqueta de estado y califica cada resultado de cuestionario guardado mediante el helper `passed`:

```python
# dashboard.py
from progress import ProgressTracker
from quizzes import passed

def _status(pct: float) -> str:
    if pct == 100.0:
        return "done"
    if pct > 0:
        return "active"
    return "todo"

def render_dashboard(tracker: ProgressTracker, quiz_results: dict[str, tuple[int, int, list[bool]]]) -> None:
    print(f"Dashboard for {tracker.student}")
    print("=" * 40)
    for i, module in enumerate(tracker.course.modules):
        pct = tracker.module_percent(i)
        print(f"[{_status(pct):>6}] {module.title}: {pct:.0f}%")
    print("-" * 40)
    for name, (earned, total, _) in quiz_results.items():
        grade = "pass" if passed((earned, total, [])) else "retake"
        print(f"Quiz '{name}': {earned}/{total}  {grade}")
    print("=" * 40)
    print(f"Course complete: {tracker.course_percent():.0f}%")

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    tracker.complete_lesson(0, 0)
    tracker.complete_lesson(0, 1)
    render_dashboard(tracker, {"Basics quiz": (1, 2, [])})
```

El helper de estado es una pieza diminuta de "lógica de renderizado", convierte un float en una palabra para que la pantalla se lea como un producto en lugar de una hoja de cálculo. `quiz_results` llega como un *dict* con clave el nombre del cuestionario porque el panel es de solo lectura: muestra cada resultado guardado de ganadas/total y re-juzga el veredicto de aprobación en pantalla, en lugar de mutar cualquier estado de cuestionario.

**🎯 Resultado esperado :**

```
Dashboard for Ada
========================================
[  done] Basics: 100%
[  todo] Functions: 0%
----------------------------------------
Quiz 'Basics quiz': 1/2  retake
========================================
Course complete: 67%
```

**🩹 Si sale mal :** Si un módulo al 0% se imprime como `[  done]`, la comparación `== 100.0` en `_status` se está ejecutando sobre un float sin formatear que apenas falla, los porcentajes se calculan como floats, así que compara contra `100.0` exactamente como está escrito. Si la línea `Quiz 'Basics quiz'` muestra un pass que contradice tu calificador, la `tuple` que se pasa a `passed()` tiene `average` intercambiado con `earned`, mantén el orden `(earned, total, flags)` consistente en todas partes.

### 4.2 Verifica el panel

**✅ Lista de verificación**

- ✅ El encabezado del panel nombra al estudiante y ambas filas de módulos muestran las palabras de estado esperadas.
- ✅ Los resultados de cuestionarios se renderizan como `X/Y` con un veredicto `pass` o `retake` que coincide con el calificador del Paso 3 sobre los mismos números.
- ✅ `render_dashboard` imprime sin error para un dict `quiz_results` vacío.

**🤔 Pregunta(s) socrática(s)**

- `render_dashboard` añade el pulido de encabezado/estado/veredicto, pero no cambia ningún estado del rastreador. ¿Por qué mantener *renderizar* separado de *mutar* es un diseño que vale la pena defender a medida que el curso crece con una bandera de salida `--json`?
- El tipo `tuple[int, int, list[bool]]` reaparece en todos lados donde se mueve un resultado de cuestionario. ¿Qué cambiaría si un resultado de cuestionario se volviera una `@dataclass`, dónde deja de ser expresiva una tupla pelada?

## Paso 5: Certificados, ganados, no asumidos

Un certificado que se imprime cada vez que se le pide no vale nada; uno que se imprime *solo cuando el curso está completo* es significativo. El paso final impone el invariante en el límite: construye el texto del certificado, pero rehúsate con una razón clara si `course_percent()` no ha llegado a 100.

### 5.1 Escribir `build_certificate`

**👟 Pista inicial :** Protege con un `raise ValueError` temprano usando un mensaje preciso, y luego construye el certificado con los datos reales del rastreador y la fecha de hoy:

```python
# certificate.py
from datetime import date

from progress import ProgressTracker

def build_certificate(tracker: ProgressTracker) -> str:
    pct = tracker.course_percent()
    if pct < 100.0:
        raise ValueError(
            f"{tracker.student} is only {pct:.0f}% complete -- finish the course first."
        )
    module_line = ", ".join(m.title for m in tracker.course.modules)
    return f"""
================================================
            COURSE COMPLETION CERTIFICATE
================================================

  This certifies that

        {tracker.student}

  has completed the course

        {tracker.course.title}

  covering: {module_line}

  Date: {date.today().isoformat()}
  Signature: Course Instructor
================================================
"""

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    for mi, module in enumerate(tracker.course.modules):
        for li in range(len(module.lessons)):
            tracker.complete_lesson(mi, li)
    with open("certificate.txt", "w") as f:
        f.write(build_certificate(tracker))
    print("Wrote certificate.txt")
```

Cada regla de este proyecto converge en esta protección. El `if pct < 100.0: raise` es un *invariante de negocio impuesto en código*, ningún camino imprime un certificado para un curso al 89%, porque la protección está antes de que siquiera se ensamble cualquiera del texto del certificado. `date.today().isoformat()` te da un string de fecha real y ordenable sin ningún formato de strings, y el bloque `__main__` recorre los módulos por índice para marcar todo como completo, la misma clave de coordenadas que el rastreador entiende desde el Paso 2.

**🎯 Resultado esperado :** `Wrote certificate.txt`, y abrir `certificate.txt` muestra el certificado ASCII con `Ada`, `Python 101`, la lista de módulos, la fecha de hoy y una línea de firma.

**🩹 Si sale mal :** Un `ValueError` que dice `finish the course first` es *comportamiento correcto* para un curso incompleto, completa el bucle en `__main__` por completo (ambos módulos) si quieres un certificado. Si el certificado imprime los títulos de módulo en el orden equivocado, se está iterando `tracker.course.modules` sobre una lista que mutaste entre la carga y la impresión, recarga el curso nuevo en el demo.

### 5.2 Verifica la regla del certificado

**✅ Lista de verificación**

- ✅ Completar cada lección del curso escribe `certificate.txt` e imprime `Wrote certificate.txt`.
- ✅ Quitar una llamada a `complete_lesson` hace que el mismo script lance `ValueError` antes de escribir archivo alguno.
- ✅ El certificado contiene el nombre real del estudiante, el título real del curso y la fecha de hoy, nada hardcodeado.

**🤔 Pregunta(s) socrática(s)**

- La protección lanza `ValueError`. ¿Qué cambiaría si un llamador *capturara* silenciosamente ese error para imprimir "en progreso" en su lugar, es lanzar la elección honesta, o un valor de retorno como `None` es más indulgente para el código de UI?
- `build_certificate` calcula el porcentaje *ella misma* en lugar de confiar en un bool `fully_complete` pasado como argumento. ¿Por qué verificar la verdad derivada es más robusto que confiar en una bandera que podría setearse de forma optimista?

## ⚠️ Errores comunes

- **Defaults mutables compartidos.** `lessons=[]` en un campo de dataclass se evalúa *una vez*, cada `Module()` comparte una sola lista, así que añadir una lección a un módulo "aparece" en todos. Siempre `field(default_factory=list)`.
- **Guardar el progreso como títulos, no coordenadas.** Renombrar "Loops" reinicia a cada estudiante que la completó. Las tuplas de índices sobreviven renombres y serialización idénticamente.
- **Claves de respuestas como strings vs. índices.** Calificar `answers = ["4", "bool"]` contra una clave de enteros nunca coincide. Decide una vez que las opciones se identifican por *índice*, y mantén las comparaciones del calificador índice-a-índice.
- **Comparar floats exactamente.** `pct == 100` donde `pct` es `99.9999999` por aritmética de floats devuelve `False`. Compara con `< 100.0` para la protección y un `>=` para las notas mínimas, como hace el código de arriba.
- **Dejar que cualquier código imprima secretos o certificados antes de tiempo.** Como la protección del certificado, todo artefacto con "solo significativo si se gana" merece una verificación de límite antes de construir texto, el mismo instinto que evita que `config-manager` (el proyecto compañero de este curso) imprima secretos.

## Lo que acabas de construir

Un motor de cursos funcional: dataclasses anidadas hidratadas desde JSON, seguimiento de progreso por estudiante con finalización idempotente, un calificador de cuestionarios con umbral de aprobación, un panel legible y un certificado ganado-y-no-asumido, todo biblioteca estándar, todo ejecutable desde una terminal. La habilidad transferible es *modelar un dominio del mundo real en estructuras de datos e invariantes*: convertir "un estudiante terminó su curso" de una vibra a un `course_percent() == 100.0` verificable, impuesto por código en lugar de por buena voluntad.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/course-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/course-builder) en el repositorio del curso tiene estos scripts completos más un `course.json` de muestra. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Escribe el progreso al disco como JSON (`tracker.completed` ya es un set serializable de tuplas) para que un estudiante pueda cerrar la terminal y retomar, la capa de persistencia sobre un modelo ya limpio.
- Añade una fábrica `Course` que *valide* el JSON al cargar (títulos de lección únicos, minutos no negativos) en lugar de confiar en el archivo, un seguro barato que reutiliza las formas del Paso 1.
- Imprime el certificado como **PDF** emitiendo a mano un PDF mínimo válido, o ve por la ruta pragmática y renderiza Markdown que una plataforma de cursos renderice.
- Añade un segundo estudiante y deja que el panel acepte `--student ada|grace`, descubrirás que el progreso está completamente desacoplado del curso (el Paso 2 lo hizo a propósito).

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓