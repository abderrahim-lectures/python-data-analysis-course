---
title: "Libreta de Calificaciones"
description: "Gestiona calificaciones de estudiantes con categorías ponderadas, cálculo de GPA y portales de padres."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["pandas", "csv", "classes", "statistics"]
prerequisites:
  - "Conceptos básicos de Python (variables, bucles, funciones, diccionarios)"
  - "Conceptos básicos de pandas (DataFrames, groupby)"
---

# 📓 Libreta de Calificaciones

Todo maestro necesita una forma de dar seguimiento al desempeño de sus estudiantes, calcular promedios ponderados y convertir los puntajes crudos en boletas de calificaciones significativas. En este proyecto construirás un sistema completo de libreta de calificaciones en Python que maneja registros de estudiantes, cálculo de GPA ponderado, estadísticas de clase, persistencia en CSV e incluso visualización básica. Practicarás el uso de clases para modelar entidades del mundo real, pandas para manipulación de datos y estadística para el análisis.

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo — ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/gradebook/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/gradebook/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgradebook%2Fnotebook.es.ipynb)

## 🎯 Lo que aprenderás

1. **Modelado de datos con clases** — Representa estudiantes, calificaciones y categorías como objetos con responsabilidades claras
2. **Cálculo de promedio ponderado** — Calcula GPA que respetan los pesos de las categorías de tareas
3. **Análisis estadístico** — Encuentra promedios de clase, medianas y distribuciones de calificaciones
4. **Persistencia en CSV** — Guarda y carga datos de la libreta para que sobrevivan entre sesiones
5. **Visualización** — Genera gráficos de barras para distribuciones de calificaciones con matplotlib

## 🎯 Lo que construirás

Una aplicación de libreta de calificaciones de línea de comandos que te permite añadir estudiantes, registrar calificaciones por categorías (tareas, cuestionarios, exámenes), calcular GPA ponderados, generar boletas de calificaciones formateadas, guardar todo en CSV y visualizar distribuciones de calificaciones con gráficos.

## Configuración

```bash
mkdir gradebook && cd gradebook
pip install pandas matplotlib
touch gradebook.py
```

## Paso 1: Define el modelo de datos

La base de cualquier libreta de calificaciones es su modelo de datos. Necesitamos representar tres conceptos centrales:

- **Student** — una persona con un nombre y una colección de calificaciones
- **Grade** — un puntaje único ligado a una categoría y un peso
- **Category** — una agrupación con nombre (como "tarea" o "examen") con un peso hacia la calificación final

Usar clases mantiene esto organizado y hace que cada pieza sea fácil de probar y extender.

### 1.1 Crea la clase Grade

**👟 Pista inicial :** Crea una clase `Grade` con los atributos `category`, `score` y `weight`.

```python
class Grade:
    def __init__(self, category, score, weight):
        self.category = category
        self.score = score
        self.weight = weight

    def __repr__(self):
        return f"Grade(category='{self.category}', score={self.score}, weight={self.weight})"
```

**🎯 Resultado esperado :**

```python
>>> g = Grade("homework", 95, 0.3)
>>> g
Grade(category='homework', score=95, weight=0.3)
>>> g.score
95
```

**🩹 Si sale mal :**
- Asegúrate de que `weight` sea un decimal (0.3 para 30%), no un porcentaje (30)
- El método `__repr__` usa comillas simples dentro del f-string — asegúrate de que coincidan

### 1.2 Crea la clase Student

**👟 Pista inicial :** La clase `Student` guarda un nombre y una lista vacía de calificaciones. Añade un método para agregar calificaciones y otro para listarlas.

```python
class Student:
    def __init__(self, name):
        self.name = name
        self.grades = []

    def add_grade(self, category, score, weight):
        grade = Grade(category, score, weight)
        self.grades.append(grade)

    def __repr__(self):
        return f"Student(name='{self.name}', grades={len(self.grades)})"
```

**🎯 Resultado esperado :**

```python
>>> s = Student("Alice")
>>> s.add_grade("homework", 92, 0.3)
>>> s.add_grade("exam", 88, 0.7)
>>> s
Student(name='Alice', grades=2)
>>> s.grades
[Grade(category='homework', score=92, weight=0.3), Grade(category='exam', score=88, weight=0.7)]
```

**🩹 Si sale mal :**
- El método `add_grade` debe crear un objeto `Grade` nuevo y añadirlo a `self.grades`
- No olvides `self.grades = []` en `__init__` — sin esto, todos los estudiantes compartirían la misma lista

**✅ Lista de verificación**
- ✅ `Grade` guarda categoría, puntaje y peso
- ✅ `Student` guarda un nombre y una lista de calificaciones
- ✅ `add_grade` crea un `Grade` y lo añade a la lista del estudiante
- ✅ Ambas clases tienen métodos `__repr__`

**🤔 Pregunta(s) socrática(s)**
- ¿Por qué guardar las calificaciones como una lista en el estudiante en lugar de un diccionario indexado por categoría?

---

## Paso 2: Añade calificaciones

Ahora que tenemos el modelo de datos, construyamos un sistema para ingresar calificaciones de verdad. Crearemos una clase `Gradebook` que contiene a todos los estudiantes y proporciona métodos para añadir estudiantes y calificaciones.

### 2.1 Crea la clase Gradebook

**👟 Pista inicial :** La clase `Gradebook` guarda un diccionario que mapea nombres de estudiantes a objetos `Student`.

```python
class Gradebook:
    def __init__(self, name):
        self.name = name
        self.students = {}

    def add_student(self, name):
        if name in self.students:
            print(f"Student '{name}' already exists.")
            return self.students[name]
        student = Student(name)
        self.students[name] = student
        return student

    def get_student(self, name):
        if name not in self.students:
            print(f"Student '{name}' not found.")
            return None
        return self.students[name]

    def add_grade(self, student_name, category, score, weight):
        student = self.get_student(student_name)
        if student:
            student.add_grade(category, score, weight)

    def __repr__(self):
        return f"Gradebook(name='{self.name}', students={len(self.students)})"
```

**🎯 Resultado esperado :**

```python
>>> gb = Gradebook("CS101 Fall 2025")
>>> gb.add_student("Alice")
Student(name='Alice', grades=0)
>>> gb.add_grade("Alice", "homework", 95, 0.3)
>>> gb.add_grade("Alice", "exam", 87, 0.7)
>>> gb.add_grade("Alice", "homework", 88, 0.3)
>>> gb.add_student("Bob")
Student(name='Bob', grades=0)
>>> gb.add_grade("Bob", "homework", 78, 0.3)
>>> gb.add_grade("Bob", "exam", 92, 0.7)
>>> gb
Gradebook(name='CS101 Fall 2025', students=2)
```

**🩹 Si sale mal :**
- `get_student` debe imprimir un mensaje y devolver `None` cuando el estudiante no existe
- Asegúrate de que `add_student` verifica duplicados antes de crear un estudiante nuevo

**✅ Lista de verificación**
- ✅ `Gradebook` guarda estudiantes en un diccionario indexado por nombre
- ✅ `add_student` crea un estudiante y maneja duplicados
- ✅ `get_student` recupera un estudiante o imprime un mensaje de no encontrado
- ✅ `add_grade` añade una calificación a un estudiante específico por nombre

**🤔 Pregunta(s) socrática(s)**
- ¿Qué cambiaría si los estudiantes pudieran tener el mismo nombre? ¿Cómo lo manejarías?

---

## Paso 3: Calcula el GPA

La característica central de cualquier libreta es el cálculo del GPA. Un GPA ponderado multiplica cada puntaje por su peso, suma esos productos y divide entre el peso total. Esto garantiza que los exámenes cuenten más que las tareas cuando tienen pesos mayores.

### 3.1 Promedio ponderado para un solo estudiante

**👟 Pista inicial :** Itera sobre las calificaciones de un estudiante, multiplica cada puntaje por su peso, súmalos y divide entre el peso total.

```python
def weighted_average(grades):
    if not grades:
        return 0.0
    total_weighted = sum(g.score * g.weight for g in grades)
    total_weight = sum(g.weight for g in grades)
    if total_weight == 0:
        return 0.0
    return round(total_weighted / total_weight, 2)

# Add this method to the Student class:
# def gpa(self):
#     return weighted_average(self.grades)
```

**🎯 Resultado esperado :**

```python
>>> alice = gb.get_student("Alice")
>>> alice.grades
[Grade(category='homework', score=95, weight=0.3), Grade(category='exam', score=87, weight=0.7), Grade(category='homework', score=88, weight=0.3)]
>>> weighted_average(alice.grades)
90.54
```

**🩹 Si sale mal :**
- Revisa que estés usando `g.weight` y no `g.score` como divisor
- Asegúrate de manejar el caso de la lista vacía — la división entre cero hará que el programa se bloquee
- El peso total aquí es 1.3 (0.3 + 0.7 + 0.3), no 1.0 — eso es correcto porque la tarea apareció dos veces

### 3.2 GPA acumulativo en todos los estudiantes

**👟 Pista inicial :** Añade un método a `Gradebook` que promedie los GPA de todos los estudiantes.

```python
# Add this method to the Gradebook class:
def class_average(self):
    if not self.students:
        return 0.0
    averages = [weighted_average(s.grades) for s in self.students.values() if s.grades]
    if not averages:
        return 0.0
    return round(sum(averages) / len(averages), 2)
```

**🎯 Resultado esperado :**

```python
>>> gb.class_average()
87.07
```

**🩹 Si sale mal :**
- Filtra a los estudiantes sin calificaciones — una lista de calificaciones vacía no debe contar para el promedio
- El promedio de la clase es el promedio de los promedios de los estudiantes, no el promedio de todas las calificaciones individuales

**✅ Lista de verificación**
- ✅ `weighted_average` maneja listas de calificaciones vacías con elegancia
- ✅ Cada puntaje se multiplica por su peso antes de sumar
- ✅ `class_average` devuelve la media de todos los GPA de los estudiantes
- ✅ Los resultados se redondean a 2 decimales

**🤔 Pregunta(s) socrática(s)**
- Si dos tareas tienen ambas un peso de 0.3, ¿debería cada una contar 30% o deberían las tareas en conjunto contar 30%? ¿Cómo rediseñarías el modelo para manejar ambos enfoques?

---

## Paso 4: Estadísticas de la clase

Los números crudos del GPA son útiles, pero los maestros también necesitan ver el panorama general: ¿cómo se está desempeñando la clase en general? ¿Cuál es la mediana? ¿Cuántos estudiantes están obteniendo A contra F?

### 4.1 Conversión a calificación por letra

**👟 Pista inicial :** Escribe una función que mapee un puntaje numérico a una calificación por letra usando cortes estándar.

```python
def letter_grade(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"
```

**🎯 Resultado esperado :**

```python
>>> letter_grade(95)
'A'
>>> letter_grade(82)
'B'
>>> letter_grade(55)
'F'
```

### 4.2 Método de estadísticas de la clase

**👟 Pista inicial :** Añade un método a `Gradebook` que calcule promedio, mediana, mínimo, máximo y distribución de calificaciones.

```python
import statistics

# Add this method to the Gradebook class:
def class_stats(self):
    student_averages = [
        weighted_average(s.grades)
        for s in self.students.values()
        if s.grades
    ]
    if not student_averages:
        return {"average": 0, "median": 0, "min": 0, "max": 0, "distribution": {}}

    dist = {}
    for avg in student_averages:
        lg = letter_grade(avg)
        dist[lg] = dist.get(lg, 0) + 1

    return {
        "average": round(statistics.mean(student_averages), 2),
        "median": round(statistics.median(student_averages), 2),
        "min": round(min(student_averages), 2),
        "max": round(max(student_averages), 2),
        "distribution": dist,
    }
```

**🎯 Resultado esperado :**

```python
>>> stats = gb.class_stats()
>>> stats
{'average': 87.07, 'median': 87.07, 'min': 81.31, 'max': 92.83, 'distribution': {'A': 1, 'B': 1}}
```

**🩹 Si sale mal :**
- Asegúrate de importar `statistics` en la parte superior del archivo
- La distribución cuenta las calificaciones por letra basadas en el promedio ponderado de cada estudiante, no en calificaciones individuales
- Usa `dist.get(lg, 0) + 1` para manejar la primera aparición de cada calificación por letra

**✅ Lista de verificación**
- ✅ `letter_grade` mapea puntajes a A/B/C/D/F
- ✅ `class_stats` devuelve promedio, mediana, mínimo, máximo y distribución
- ✅ Las listas de calificaciones vacías se filtran antes de calcular las estadísticas
- ✅ La distribución de calificaciones es un diccionario que mapea letras a conteos

**🤔 Pregunta(s) socrática(s)**
- La mediana es 87.07 en este ejemplo. ¿Qué te dice eso sobre la clase que el promedio solo no te dice?

---

## Paso 5: Genera reportes

Una libreta de calificaciones no es útil a menos que puedas presentar la información con claridad. Construyamos boletas de calificaciones formateadas que muestren las calificaciones de cada estudiante, su promedio ponderado y su calificación por letra.

### 5.1 Boletas de calificaciones individuales

**👟 Pista inicial :** Construye un método que devuelva una cadena formateada mostrando todas las calificaciones y el promedio final de un estudiante.

```python
# Add this method to the Student class:
def report_card(self):
    lines = [f"Report Card: {self.name}", "=" * 40]
    if not self.grades:
        lines.append("No grades recorded.")
        return "\n".join(lines)

    by_category = {}
    for g in self.grades:
        by_category.setdefault(g.category, []).append(g)

    for cat, grades in sorted(by_category.items()):
        avg = weighted_average(grades)
        lines.append(f"  {cat.title():12s}  avg: {avg:.1f}  ({len(grades)} grades)")

    overall = weighted_average(self.grades)
    lines.append("-" * 40)
    lines.append(f"  Overall GPA: {overall:.2f} ({letter_grade(overall)})")
    return "\n".join(lines)
```

**🎯 Resultado esperado :**

```python
>>> print(alice.report_card())
Report Card: Alice
========================================
  Exam         avg: 87.0  (1 grades)
  Homework     avg: 91.5  (2 grades)
----------------------------------------
  Overall GPA: 90.54 (A)
```

**🩹 Si sale mal :**
- Usa `.title()` en los nombres de las categorías para que "homework" se convierta en "Homework"
- El GPA general es el promedio ponderado en todas las calificaciones, no una media simple de los promedios de las categorías

### 5.2 Reporte completo de la clase

**👟 Pista inicial :** Añade un método a `Gradebook` que imprima la boleta de calificaciones de cada estudiante.

```python
# Add this method to the Gradebook class:
def full_report(self):
    print(f"\n{'=' * 50}")
    print(f"  {self.name} — Full Report")
    print(f"{'=' * 50}\n")
    for name in sorted(self.students):
        student = self.students[name]
        if student.grades:
            print(student.report_card())
            print()
    stats = self.class_stats()
    print(f"{'=' * 50}")
    print(f"  Class Statistics")
    print(f"{'=' * 50}")
    print(f"  Average: {stats['average']}")
    print(f"  Median:  {stats['median']}")
    print(f"  Min:     {stats['min']}")
    print(f"  Max:     {stats['max']}")
    print(f"  Distribution: {stats['distribution']}")
    print()
```

**🎯 Resultado esperado :**

```
==================================================
  CS101 Fall 2025 — Full Report
==================================================

Report Card: Alice
========================================
  Exam         avg: 87.0  (1 grades)
  Homework     avg: 91.5  (2 grades)
----------------------------------------
  Overall GPA: 90.54 (A)

Report Card: Bob
========================================
  Exam         avg: 92.0  (1 grades)
  Homework     avg: 78.0  (1 grades)
----------------------------------------
  Overall GPA: 81.31 (B)

==================================================
  Class Statistics
==================================================
  Average: 87.07
  Median:  87.07
  Min:     81.31
  Max:     92.83
  Distribution: {'A': 1, 'B': 1}
```

**🩹 Si sale mal :**
- Ordena a los estudiantes alfabéticamente por nombre antes de imprimir
- Omite a los estudiantes sin calificaciones en la sección por estudiante
- Asegúrate de que la sección de estadísticas aparezca al final

**✅ Lista de verificación**
- ✅ `report_card` muestra las calificaciones agrupadas por categoría
- ✅ `full_report` imprime a todos los estudiantes y las estadísticas de la clase
- ✅ Los promedios de las categorías se muestran junto al GPA general
- ✅ La salida está formateada con cuidado con separadores

**🤔 Pregunta(s) socrática(s)**
- ¿Cómo modificarías el reporte para mostrar el puntaje de cada tarea individual en lugar de solo el promedio de la categoría?

---

## Paso 6: Guarda y carga

Una libreta que pierde todos los datos cuando cierras el programa no es muy útil. Añadamos persistencia en CSV para que los datos sobrevivan entre sesiones. Guardaremos cada calificación como una fila con el nombre del estudiante, la categoría, el puntaje y el peso.

### 6.1 Guarda en CSV

**👟 Pista inicial :** Itera sobre todos los estudiantes y sus calificaciones, escribiendo cada una como una fila de CSV.

```python
import csv

# Add this method to the Gradebook class:
def save(self, filename):
    with open(filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["student", "category", "score", "weight"])
        for name in sorted(self.students):
            student = self.students[name]
            for grade in student.grades:
                writer.writerow([
                    student.name,
                    grade.category,
                    grade.score,
                    grade.weight,
                ])
    print(f"Saved {len(self.students)} students to {filename}")
```

**🎯 Resultado esperado :**

```python
>>> gb.save("grades.csv")
Saved 2 students to grades.csv
```

El archivo CSV contendrá:

```
student,category,score,weight
Alice,homework,95,0.3
Alice,exam,87,0.7
Alice,homework,88,0.3
Bob,homework,78,0.3
Bob,exam,92,0.7
```

### 6.2 Carga desde CSV

**👟 Pista inicial :** Lee el archivo CSV y reconstruye estudiantes y calificaciones. Maneja el caso en el que el archivo no existe.

```python
# Add this class method to the Gradebook class:
@classmethod
def load(cls, filename):
    gb = cls(filename.replace(".csv", ""))
    try:
        with open(filename, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                gb.add_student(row["student"])
                gb.add_grade(
                    row["student"],
                    row["category"],
                    float(row["score"]),
                    float(row["weight"]),
                )
    except FileNotFoundError:
        print(f"File '{filename}' not found. Starting with empty gradebook.")
    return gb
```

**🎯 Resultado esperado :**

```python
>>> loaded = Gradebook.load("grades.csv")
>>> loaded.class_average()
87.07
>>> len(loaded.students)
2
```

**🩹 Si sale mal :**
- Usa `csv.DictReader` para que puedas acceder a las columnas por nombre (`row["student"]`) en lugar de por índice
- Convierte `score` y `weight` a `float` — CSV lee todo como cadenas
- Usa un `@classmethod` para que puedas llamar a `Gradebook.load(...)` sin tener una instancia existente

**✅ Lista de verificación**
- ✅ `save` escribe una fila de encabezado más una fila por calificación
- ✅ `load` usa `DictReader` y reconstruye la libreta completa
- ✅ Los archivos faltantes se manejan con elegancia con un mensaje
- ✅ Los valores numéricos se convierten de cadenas a flotantes

**🤔 Pregunta(s) socrática(s)**
- ¿Qué pasa si guardas una libreta, editas el CSV a mano con un puntaje inválido y luego lo cargas? ¿Cómo añadirías validación?

---

## Paso 7: Visualiza los resultados

Los números en una terminal están bien, pero un gráfico hace que las distribuciones de calificaciones sean inmediatamente claras. Usaremos matplotlib para crear un gráfico de barras que muestre cuántos estudiantes obtuvieron cada calificación por letra.

### 7.1 Gráfico de barras de la distribución de calificaciones

**👟 Pista inicial :** Usa el diccionario de distribución de `class_stats` y pásalo a `plt.bar`.

```python
import matplotlib.pyplot as plt

# Add this method to the Gradebook class:
def plot_distribution(self):
    stats = self.class_stats()
    dist = stats["distribution"]
    if not dist:
        print("No data to plot.")
        return

    grades_order = ["A", "B", "C", "D", "F"]
    counts = [dist.get(g, 0) for g in grades_order]
    colors = ["#2ecc71", "#3498db", "#f1c40f", "#e67e22", "#e74c3c"]

    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(grades_order, counts, color=colors, edgecolor="white", linewidth=1.2)

    for bar, count in zip(bars, counts):
        if count > 0:
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.1,
                str(count),
                ha="center",
                va="bottom",
                fontweight="bold",
                fontsize=12,
            )

    ax.set_title(f"{self.name} — Grade Distribution", fontsize=14, fontweight="bold")
    ax.set_xlabel("Letter Grade")
    ax.set_ylabel("Number of Students")
    ax.set_ylim(0, max(counts) + 1)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    plt.savefig("grade_distribution.png", dpi=150)
    plt.show()
    print("Chart saved as grade_distribution.png")
```

**🎯 Resultado esperado :**

Se abrirá una ventana con el gráfico de barras que muestra:

```
Number of Students
  2 |
  1 |        ■
    |     ■     ■
  0 +--+--+--+--+--
       A  B  C  D  F
     Letter Grade
```

El gráfico también se guardará como `grade_distribution.png`.

**🩹 Si sale mal :**
- Asegúrate de tener `matplotlib` instalado (`pip install matplotlib`)
- Si no aparece ningún gráfico, prueba `plt.show()` en una terminal separada o usa solo `plt.savefig`
- La llamada a `tight_layout()` evita que las etiquetas se corten

### 7.2 Gráfico comparativo de GPA de estudiantes

**👟 Pista inicial :** Crea un gráfico de barras horizontales que compare los GPA de todos los estudiantes.

```python
# Add this method to the Gradebook class:
def plot_student_comparison(self):
    names = []
    averages = []
    for name in sorted(self.students):
        student = self.students[name]
        if student.grades:
            names.append(name)
            averages.append(weighted_average(student.grades))

    if not names:
        print("No data to plot.")
        return

    fig, ax = plt.subplots(figsize=(8, max(3, len(names) * 0.6)))
    colors = ["#2ecc71" if avg >= 90 else "#3498db" if avg >= 80 else "#f1c40f" if avg >= 70 else "#e74c3c" for avg in averages]
    bars = ax.barh(names, averages, color=colors, edgecolor="white", height=0.5)

    for bar, avg in zip(bars, averages):
        ax.text(
            bar.get_width() + 0.5,
            bar.get_y() + bar.get_height() / 2,
            f"{avg:.1f} ({letter_grade(avg)})",
            va="center",
            fontsize=10,
        )

    ax.set_title(f"{self.name} — Student GPAs", fontsize=14, fontweight="bold")
    ax.set_xlabel("Weighted Average")
    ax.set_xlim(0, 100)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    plt.savefig("student_comparison.png", dpi=150)
    plt.show()
    print("Chart saved as student_comparison.png")
```

**🎯 Resultado esperado :**

Un gráfico de barras horizontales que muestra el GPA de cada estudiante con colores codificados (verde para A, azul para B, amarillo para C, rojo para calificaciones por debajo de C).

**🩹 Si sale mal :**
- Si las barras son demasiado delgadas, aumenta el parámetro `height` en `barh`
- Los colores se determinan por el rango del GPA — revisa la comprensión de lista condicional
- Si los nombres se superponen, aumenta la altura de la figura según el número de estudiantes

**✅ Lista de verificación**
- ✅ `plot_distribution` crea un gráfico de barras con los conteos de calificaciones por letra
- ✅ `plot_student_comparison` crea un gráfico de barras horizontales con los GPA de los estudiantes
- ✅ Los gráficos se guardan como archivos PNG
- ✅ Los datos vacíos se manejan con elegancia

**🤔 Pregunta(s) socrática(s)**
- ¿Cómo añadirías una línea de referencia en el promedio de la clase para que sea más fácil ver quién está por encima o por debajo del promedio?

---

## 🧩 Desafíos

¿Listo para ir más lejos? Prueba esto:

1. **Validación de pesos** — Asegúrate de que los pesos de las categorías sumen 1.0 para cada estudiante. Si no lo hacen, advierte al usuario y lista el total.

2. **Configuración de pesos por categoría** — Permite que el maestro defina pesos de categoría por defecto (por ejemplo, tarea = 30%, examen = 70%) para que no tenga que especificar el peso cada vez que añade una calificación.

3. **Exportar a HTML** — Genera una boleta de calificaciones HTML imprimible con tablas estilizadas y colores para las calificaciones por letra. Usa el formateo de cadenas de Python para construir el HTML y luego ábrelo en un navegador con `webbrowser.open`.

---

## Lo que aprendiste

- **Modelado de datos basado en clases** — Representaste estudiantes, calificaciones y la propia libreta como clases de Python con métodos claros
- **Promedios ponderados** — Calculaste GPA que respetan los pesos de las categorías, manejando casos límite como listas de calificaciones vacías
- **Análisis estadístico** — Usaste el módulo `statistics` de Python para la media y la mediana, y construiste un contador personalizado de distribución de calificaciones
- **Persistencia en CSV** — Guardaste y cargaste datos de la libreta usando `csv.DictReader` y `csv.writer`
- **Visualización de datos** — Creaste gráficos de barras con matplotlib para distribuciones de calificaciones y comparaciones de estudiantes
- **Generación de reportes** — Construiste boletas de calificaciones de texto formateadas con calificaciones agrupadas y estadísticas de resumen

Ahora tienes una libreta de calificaciones totalmente funcional que puedes extender con características como notificaciones por email, gestión de la curva o una interfaz web. La arquitectura basada en clases hace que cada pieza sea fácil de probar, modificar y reutilizar.